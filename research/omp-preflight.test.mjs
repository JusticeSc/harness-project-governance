// Integration behavior of tools/omp-preflight/simplification.mjs through the real OMP RPC
// agent loop. The local scripted OpenAI-compatible provider is a host fixture: it chooses
// real tool calls from the user prompt and the loop consumes real tool results.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import readline from 'node:readline'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const OMP_BIN = process.env.OMP_BIN
const CANDIDATE = fileURLToPath(new URL('../tools/omp-preflight/simplification.mjs', import.meta.url))
const REFERENCE = fileURLToPath(new URL('../references/agent-workflows.md', import.meta.url))
const PLAN_MARKER = 'PREFLIGHT_PLAN:'
const PROVIDER = 'preflight-local'
const MODEL = 'preflight-model'
const TOOLS = ['read', 'grep', 'glob', 'write', 'edit', 'bash', 'eval', 'task', 'governance_preflight', 'fixture_mutation']

const SKIP = (() => {
  if (!OMP_BIN) return 'OMP_BIN must point to the installed omp 18.13.1 executable'
  if (!existsSync(OMP_BIN)) return `OMP_BIN does not exist: ${OMP_BIN}`
  if (!existsSync(CANDIDATE)) return `candidate module is missing: ${CANDIDATE}`
  if (!existsSync(REFERENCE)) return `canonical reference is missing: ${REFERENCE}`
  return false
})()

const roots = new Set()
after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

function referenceSection() {
  const text = readFileSync(REFERENCE, 'utf8').replaceAll('\r\n', '\n')
  const start = text.indexOf('<a id="aw-18"></a>')
  const end = text.indexOf('<a id="aw-19"></a>', start)
  assert.ok(start >= 0 && end > start, 'the installed reference exposes the simplification section anchors')
  const section = text.slice(start, end).trimEnd()
  const firstLine = text.slice(0, start).split('\n').length
  const lastLine = firstLine + section.split('\n').length - 1
  return {
    text: section,
    firstLine,
    lastLine,
    readPath: `${REFERENCE}:${firstLine}-${lastLine}:raw`,
    partialPath: `${REFERENCE}:${firstLine}-${firstLine + 2}:raw`,
  }
}

function contentText(message) {
  const content = message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map(part => part?.text ?? '').join('\n')
  return ''
}

function argsFor(step) {
  switch (step.tool) {
    case 'read':
      return { path: step.path }
    case 'write':
      return { path: step.path, content: step.content }
    case 'edit':
      return { path: step.path, old_string: step.old_string, new_string: step.new_string }
    case 'bash':
      return { command: step.command }
    case 'eval':
      return { language: 'js', code: step.code }
    case 'task':
      return {
        context: 'Preflight host fixture.',
        tasks: [{ name: 'FixtureChild', task: step.task, solutionSpace: 'one mechanical write' }],
      }
    case 'fixture_mutation':
      return { marker: step.marker }
    case 'governance_preflight':
      return { constraints: step.constraints, acceptance: step.acceptance }
    default:
      return {}
  }
}

function createProviderServer(observe = () => ({})) {
  const requests = []
  let seq = 0
  let pausedRequest = null
  const server = createServer((request, response) => {
    const chunks = []
    request.on('data', chunk => chunks.push(chunk))
    request.on('end', async () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      let body = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch {
        body = null
      }
      if (request.method === 'GET' && (request.url ?? '').includes('/models')) {
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ object: 'list', data: [{ id: MODEL, object: 'model' }] }))
        return
      }

      const messages = Array.isArray(body?.messages) ? body.messages : []
      const lastUserIndex = messages.findLastIndex(message => message.role === 'user')
      const userText = lastUserIndex >= 0 ? contentText(messages[lastUserIndex]) : ''
      const markerAt = userText.lastIndexOf(PLAN_MARKER)
      let plan = null
      if (markerAt >= 0) {
        try {
          plan = JSON.parse(userText.slice(markerAt + PLAN_MARKER.length).trim())
        } catch {
          plan = null
        }
      }
      const stepsDone = lastUserIndex >= 0
        ? messages.slice(lastUserIndex + 1).filter(message => message.role === 'assistant').length
        : 0
      const entry = {
        seq: ++seq,
        roles: messages.map(message => message.role),
        toolNames: Array.isArray(body?.tools) ? body.tools.map(tool => tool?.function?.name) : [],
        hasToolResult: messages.some(message => message.role === 'tool'),
        plan: Array.isArray(plan) ? plan.map(step => step.tool) : null,
        stepsDone,
        observation: observe(),
      }
      requests.push(entry)
      if (pausedRequest) {
        const pause = pausedRequest
        pausedRequest = null
        pause.arrive(entry)
        await pause.released
      }

      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      const base = {
        id: `chatcmpl-preflight-${entry.seq}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: MODEL,
      }
      const send = (delta, finishReason, usage) => {
        const payload = { ...base, choices: [{ index: 0, delta, finish_reason: finishReason }] }
        if (usage) payload.usage = usage
        response.write(`data: ${JSON.stringify(payload)}\n\n`)
      }
      const finish = () => {
        response.write('data: [DONE]\n\n')
        response.end()
      }
      if (!Array.isArray(plan) || stepsDone >= plan.length) {
        send({ role: 'assistant', content: 'PREFLIGHT_FIXTURE_DONE' }, null)
        send({}, 'stop', { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 })
        finish()
        return
      }
      const step = plan[stepsDone]
      if (!entry.toolNames.includes(step.tool)) {
        send({ role: 'assistant', content: 'PREFLIGHT_FIXTURE_TOOL_UNAVAILABLE' }, null)
        send({}, 'stop', { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 })
        finish()
        return
      }
      const call = {
        index: 0,
        id: `call_${entry.seq}_${stepsDone}`,
        type: 'function',
        function: { name: step.tool, arguments: JSON.stringify(argsFor(step)) },
      }
      send({ role: 'assistant', content: '' }, null)
      send({ tool_calls: [call] }, null)
      send({}, 'tool_calls', { prompt_tokens: 8, completion_tokens: 3, total_tokens: 11 })
      finish()
    })
  })
  return {
    server,
    requests,
    pauseNextRequest() {
      if (pausedRequest) throw new Error('A provider request is already paused')
      let arrive
      let release
      const arrived = new Promise(resolve => { arrive = resolve })
      const released = new Promise(resolve => { release = resolve })
      pausedRequest = { arrive, released }
      return { arrived, release }
    },
  }
}

function isolatedEnv(root) {
  const env = {}
  for (const key of [
    'PATH', 'SystemRoot', 'SystemDrive', 'ComSpec', 'PATHEXT', 'WINDIR',
    'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'USERNAME', 'SHELL',
  ]) {
    if (process.env[key]) env[key] = process.env[key]
  }
  const home = join(root, 'home')
  const config = join(root, 'config')
  return {
    ...env,
    HOME: home,
    USERPROFILE: home,
    APPDATA: config,
    LOCALAPPDATA: config,
    TEMP: join(root, 'tmp'),
    TMP: join(root, 'tmp'),
    XDG_CONFIG_HOME: config,
    XDG_CACHE_HOME: join(root, 'cache'),
    XDG_DATA_HOME: join(root, 'data'),
    XDG_STATE_HOME: join(root, 'state'),
    PI_CONFIG_DIR: '.omp-preflight',
    PI_CODING_AGENT_DIR: join(root, 'agent'),
    PI_NATIVES_DIR: join(root, 'natives'),
    NO_COLOR: '1',
    CI: '1',
  }
}

async function createHarness() {
  const root = mkdtempSync(join(tmpdir(), 'omp-preflight-'))
  roots.add(root)
  for (const dir of ['home', 'config', 'tmp', 'cache', 'data', 'state', 'agent', 'natives', 'sessions']) {
    mkdirSync(join(root, dir), { recursive: true })
  }
  const repo = join(root, 'repo')
  mkdirSync(repo, { recursive: true })
  const owner = join(repo, 'AGENTS.md')
  writeFileSync(owner, '# consumer owner\n')

  const { server, requests, pauseNextRequest } = createProviderServer(() => ({ ownerText: readFileSync(owner, 'utf8') }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}/v1`

  const extension = join(root, 'provider.mjs')
  const providerConfig = {
    baseUrl,
    apiKey: 'preflight-local-key',
    api: 'openai-completions',
    models: [{
      id: MODEL,
      name: 'Preflight Scripted Model',
      api: 'openai-completions',
      reasoning: false,
      input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 65536,
      maxTokens: 2048,
    }],
  }
  writeFileSync(extension, `import fs from 'node:fs'
import candidate from ${JSON.stringify(pathToFileURL(CANDIDATE).href)}

export default function (pi) {
  pi.registerProvider(${JSON.stringify(PROVIDER)}, ${JSON.stringify(providerConfig)})
  pi.registerTool({
    name: 'fixture_mutation',
    label: 'Fixture mutation',
    loadMode: 'essential',
    description: 'Host fixture that writes a marker only when it actually executes.',
    parameters: {
      type: 'object',
      properties: { marker: { type: 'string' } },
      required: ['marker'],
      additionalProperties: false,
    },
    async execute(_id, params) {
      fs.writeFileSync(params.marker, 'FIXTURE')
      return { content: [{ type: 'text', text: 'fixture wrote' }] }
    },
  })
  candidate(pi)
}
`, 'utf8')

  return {
    root,
    repo,
    owner,
    target: join(repo, 'target.txt'),
    extension,
    requests,
    pauseNextRequest,
    async close() {
      await new Promise(resolve => server.close(resolve))
    },
  }
}

function startAgent(harness, ownerPath = harness.owner) {
  const args = [
    '--mode', 'rpc',
    '--no-ui',
    '--no-session',
    '--profile', 'default',
    '--cwd', harness.repo,
    '--session-dir', join(harness.root, 'sessions'),
    '--trusted-extension', harness.extension,
    '--no-extensions',
    '--no-skills',
    '--no-rules',
    '--no-context-files',
    '--no-lsp',
    '--no-pty',
    '--no-title',
    '--approval-mode', 'yolo',
    '--model', `${PROVIDER}/${MODEL}`,
    '--smol', `${PROVIDER}/${MODEL}`,
    '--slow', `${PROVIDER}/${MODEL}`,
    '--plan', `${PROVIDER}/${MODEL}`,
    '--governance-owner', ownerPath,
  ]
  const child = spawn(OMP_BIN, args, {
    cwd: harness.repo,
    env: isolatedEnv(harness.root),
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  })
  const frames = []
  const toolEnds = []
  const extensionErrors = []
  const pending = new Map()
  const promptWaiters = new Map()
  let settleWaiter = null
  let settleTimer = null
  let readyResolve
  let readyReject
  let stderr = ''
  let promptSeq = 0
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve
    readyReject = reject
  })

  const failAll = error => {
    readyReject(error)
    for (const waiter of pending.values()) waiter.reject(error)
    pending.clear()
    for (const waiter of promptWaiters.values()) waiter.reject(error)
    promptWaiters.clear()
    settleWaiter?.reject(error)
    settleWaiter = null
    clearTimeout(settleTimer)
    settleTimer = null
  }

  child.stderr.on('data', chunk => {
    stderr += chunk.toString('utf8')
  })
  child.once('exit', code => {
    if (code !== null) failAll(new Error(`omp exited with code ${code}\n${stderr.slice(-2000)}`))
  })

  const reader = readline.createInterface({ input: child.stdout })
  reader.on('line', line => {
    if (!line.trim()) return
    let frame
    try {
      frame = JSON.parse(line)
    } catch {
      frames.push({ unparsed: line.slice(0, 400) })
      return
    }
    frames.push(frame)
    if (frame.type === 'ready') {
      readyResolve(frame)
      return
    }
    if (frame.type === 'response') {
      const waiter = pending.get(frame.id)
      if (waiter) {
        pending.delete(frame.id)
        clearTimeout(waiter.timer)
        waiter.resolve(frame)
      }
      return
    }
    if (frame.type === 'prompt_result') {
      const waiter = promptWaiters.get(frame.id)
      if (waiter) {
        promptWaiters.delete(frame.id)
        clearTimeout(waiter.timer)
        waiter.resolve(frame)
      }
      return
    }
    if (frame.type === 'session_settled') {
      settleWaiter?.resolve(frame)
      settleWaiter = null
      return
    }
    if (frame.type === 'extension_error') {
      extensionErrors.push(frame)
      return
    }
    if (frame.type === 'tool_execution_end') {
      toolEnds.push({
        toolName: frame.toolName,
        toolCallId: frame.toolCallId,
        isError: frame.isError,
        result: frame.result,
      })
    }
  })

  function send(frame) {
    child.stdin.write(JSON.stringify(frame) + '\n')
  }

  function request(frame, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(frame.id)
        reject(new Error(`timeout waiting for response ${frame.id}\n${stderr.slice(-2000)}`))
      }, timeoutMs)
      pending.set(frame.id, { resolve, reject, timer })
      try {
        send(frame)
      } catch (error) {
        clearTimeout(timer)
        pending.delete(frame.id)
        reject(error)
      }
    })
  }

  async function waitReady() {
    let timer
    try {
      return await Promise.race([
        ready,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`no ready frame\n${stderr.slice(-2000)}`)), 90000)
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  }

  async function prompt(plan) {
    const id = `prompt-${++promptSeq}`
    const resultPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        promptWaiters.delete(id)
        reject(new Error(`timeout waiting for prompt_result ${id}\n${stderr.slice(-2000)}`))
      }, 90000)
      promptWaiters.set(id, { resolve, reject, timer })
    })
    const settledPromise = new Promise((resolve, reject) => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => reject(new Error(`timeout waiting for session_settled ${id}`)), 30000)
      settleWaiter = { resolve, reject }
    })
    const response = await request({ id, type: 'prompt', message: `${PLAN_MARKER}${JSON.stringify(plan)}` })
    assert.equal(response.success, true, `prompt was rejected: ${JSON.stringify(response)}`)
    const result = await resultPromise
    assert.equal(result.status, 'completed', `prompt did not complete: ${JSON.stringify(result)}`)
    if (!result.sessionSettled) await settledPromise
    clearTimeout(settleTimer)
    return result
  }

  async function close() {
    for (const waiter of pending.values()) clearTimeout(waiter.timer)
    pending.clear()
    for (const waiter of promptWaiters.values()) clearTimeout(waiter.timer)
    promptWaiters.clear()
    clearTimeout(settleTimer)
    settleTimer = null
    try {
      child.stdin.end()
    } catch {
      // already closed
    }
    let timer
    await Promise.race([
      new Promise(resolve => child.once('exit', resolve)),
      new Promise(resolve => {
        timer = setTimeout(resolve, 5000)
      }),
    ])
    clearTimeout(timer)
    if (child.exitCode === null) child.kill('SIGKILL')
    reader.close()
  }

  return { args, child, frames, toolEnds, extensionErrors, waitReady, request, prompt, close, getStderr: () => stderr }
}

async function withAgent(fn, ownerPath) {
  const harness = await createHarness()
  const agent = startAgent(harness, ownerPath)
  try {
    await agent.waitReady()
    return await fn(harness, agent)
  } finally {
    await agent.close()
    await harness.close()
  }
}

function offeredTools(requests) {
  return new Set(requests.flatMap(request => request.toolNames ?? []))
}

test('early preflight without a read, write, edit, bash, eval, task, and non-allowlisted calls are blocked before the checkpoint', { skip: SKIP, timeout: 120000 }, async () => {
  await withAgent(async (harness, agent) => {
    const marker = name => join(harness.repo, name)
    const plan = [
      { tool: 'governance_preflight', constraints: 'EARLY_CONSTRAINT', acceptance: 'EARLY_ACCEPTANCE' },
      { tool: 'write', path: harness.target, content: 'EARLY_TARGET' },
      { tool: 'write', path: harness.owner, content: 'CORRUPTED_OWNER' },
      { tool: 'edit', path: harness.owner, old_string: '# consumer owner', new_string: '# CORRUPTED_OWNER' },
      { tool: 'bash', command: `node -e "require('node:fs').writeFileSync('bash-marker.txt','BASH')"` },
      { tool: 'eval', code: "await Bun.write('eval-marker.txt','EVAL')" },
      { tool: 'task', task: 'Write task-marker.txt with the content TASK.' },
      { tool: 'fixture_mutation', marker: marker('fixture-marker.txt') },
    ]
    await agent.prompt(plan)

    assert.deepEqual(agent.toolEnds.map(event => event.toolName), plan.map(step => step.tool))
    for (const event of agent.toolEnds) {
      assert.equal(event.isError, true, `${event.toolName} was not refused before the checkpoint`)
    }
    assert.equal(existsSync(harness.target), false)
    assert.equal(readFileSync(harness.owner, 'utf8'), '# consumer owner\n')
    for (const name of ['bash-marker.txt', 'eval-marker.txt', 'fixture-marker.txt', 'task-marker.txt']) {
      assert.equal(existsSync(marker(name)), false, `${name} was created before the checkpoint`)
    }
    const offered = offeredTools(harness.requests)
    for (const name of TOOLS) {
      assert.ok(offered.has(name), `the model was not offered ${name}`)
    }
    assert.deepEqual(agent.extensionErrors, [])
  })
})

test('wrong-provenance and partial reads do not unlock; a complete read plus preflight does, and a new prompt resets', { skip: SKIP, timeout: 180000 }, async () => {
  await withAgent(async (harness, agent) => {
    const section = referenceSection()
    const decoy = join(harness.repo, 'decoy.md')
    writeFileSync(decoy, `${section.text}\n`)
    const constraints = 'LOCAL_CONSTRAINT_MAP_PREFLIGHT_TEST'
    const acceptance = 'OBSERVABLE_ACCEPTANCE_PREFLIGHT_TEST'
    const target2 = join(harness.repo, 'target-after-reset.txt')
    const plan = [
      { tool: 'read', path: decoy },
      { tool: 'governance_preflight', constraints: 'REJECTED_DECOY_MAPPING', acceptance: 'REJECTED_DECOY_ACCEPTANCE' },
      { tool: 'write', path: harness.target, content: 'BLOCKED_AFTER_DECOY' },
      { tool: 'read', path: section.partialPath },
      { tool: 'governance_preflight', constraints: 'REJECTED_PARTIAL_MAPPING', acceptance: 'REJECTED_PARTIAL_ACCEPTANCE' },
      { tool: 'write', path: harness.target, content: 'BLOCKED_AFTER_PARTIAL' },
      { tool: 'read', path: section.readPath },
      { tool: 'governance_preflight', constraints, acceptance },
      { tool: 'eval', code: "await Bun.write('eval-after.txt','EVAL_AFTER')" },
      { tool: 'bash', command: `node -e "require('node:fs').writeFileSync('bash-after.txt','BASH_AFTER')"` },
      { tool: 'write', path: harness.target, content: 'ALLOWED_TARGET' },
    ]
    await agent.prompt(plan)

    assert.deepEqual(agent.toolEnds.map(event => event.toolName), plan.map(step => step.tool))
    const fullRead = agent.toolEnds[6].result
    assert.equal(realpathSync(fullRead.details.meta.source.value), REFERENCE)
    for (const index of [1, 2, 4, 5]) {
      assert.equal(agent.toolEnds[index].isError, true, `${plan[index].tool} at step ${index} was not refused`)
    }
    for (const index of [0, 3, 6, 7, 8, 9, 10]) {
      assert.equal(agent.toolEnds[index].isError, false, `${plan[index].tool} at step ${index} failed unexpectedly`)
    }
    for (const stepsDone of [2, 5]) {
      const afterRefusal = harness.requests.find(request => request.plan?.length === plan.length && request.stepsDone === stepsDone)
      assert.ok(afterRefusal, 'the model did not consume a rejected preflight result')
      assert.equal(afterRefusal.observation.ownerText, '# consumer owner\n', 'a rejected read was recorded before the valid section read')
    }
    assert.equal(readFileSync(harness.target, 'utf8'), 'ALLOWED_TARGET')
    assert.equal(readFileSync(join(harness.repo, 'eval-after.txt'), 'utf8'), 'EVAL_AFTER')
    assert.equal(readFileSync(join(harness.repo, 'bash-after.txt'), 'utf8'), 'BASH_AFTER')
    const ownerText = readFileSync(harness.owner, 'utf8')
    assert.ok(ownerText.startsWith('# consumer owner'))
    assert.ok(ownerText.includes(constraints), 'the supplied constraint mapping was not appended to the owner')
    assert.ok(ownerText.includes(acceptance), 'the supplied acceptance was not appended to the owner')
    assert.ok(harness.requests.some(request => request.hasToolResult), 'the scripted model never consumed a real tool result')
    assert.ok(harness.requests.some(request => request.plan?.length === plan.length), 'the scripted plan did not drive the real loop')

    const beforeReset = agent.toolEnds.length
    await agent.prompt([{ tool: 'write', path: target2, content: 'BLOCKED_AFTER_RESET' }])
    const resetEvents = agent.toolEnds.slice(beforeReset)
    assert.deepEqual(resetEvents.map(event => event.toolName), ['write'])
    assert.equal(resetEvents[0].isError, true, 'a new user prompt did not reset the checkpoint')
    assert.equal(existsSync(target2), false)
    assert.equal(readFileSync(harness.owner, 'utf8'), ownerText)
    assert.deepEqual(agent.extensionErrors, [])
  })
})

test('queued follow-up work cannot reuse a checkpoint completed after it was enqueued', { skip: SKIP, timeout: 120000 }, async () => {
  await withAgent(async (harness, agent) => {
    const section = referenceSection()
    const activeTarget = join(harness.repo, 'active-task.txt')
    const queuedTarget = join(harness.repo, 'queued-task.txt')
    const pause = harness.pauseNextRequest()
    const active = agent.prompt([
      { tool: 'read', path: section.readPath },
      { tool: 'governance_preflight', constraints: 'ACTIVE_TASK_CONSTRAINT', acceptance: 'ACTIVE_TASK_ACCEPTANCE' },
      { tool: 'write', path: activeTarget, content: 'ACTIVE_TASK_COMPLETED' },
    ])
    try {
      await Promise.race([
        pause.arrived,
        active.then(() => { throw new Error('The active task completed before the provider barrier') }),
      ])
      const queued = await agent.request({
        id: 'queued-user-work',
        type: 'follow_up',
        message: `${PLAN_MARKER}${JSON.stringify([{ tool: 'write', path: queuedTarget, content: 'STALE_CHECKPOINT_WRITE' }])}`,
      })
      assert.equal(queued.success, true, 'the follow-up request was not admitted')
    } finally {
      pause.release()
    }
    await active
    assert.deepEqual(agent.toolEnds.map(event => event.toolName), ['read', 'governance_preflight', 'write', 'write'])
    assert.equal(readFileSync(activeTarget, 'utf8'), 'ACTIVE_TASK_COMPLETED')
    assert.equal(agent.toolEnds[1].isError, false, 'the active task did not actually record its checkpoint')
    assert.equal(agent.toolEnds[2].isError, false, 'the active task was not allowed to finish')
    assert.equal(agent.toolEnds[3].isError, true, 'queued user work reused the earlier task checkpoint')
    assert.equal(existsSync(queuedTarget), false)
    assert.deepEqual(agent.extensionErrors, [])
  })
})

test('an existing valid owner outside the repository is refused without being modified', { skip: SKIP, timeout: 120000 }, async () => {
  const harness = await createHarness()
  try {
    const external = join(harness.root, 'external')
    mkdirSync(external, { recursive: true })
    const externalOwner = join(external, 'owner.md')
    writeFileSync(externalOwner, '# external owner\n')
    const agent = startAgent(harness, externalOwner)
    try {
      await agent.waitReady()
      const section = referenceSection()
      await agent.prompt([
        { tool: 'read', path: section.readPath },
        { tool: 'governance_preflight', constraints: 'EXTERNAL_CONSTRAINT', acceptance: 'EXTERNAL_ACCEPTANCE' },
        { tool: 'write', path: harness.target, content: 'EXTERNAL_TARGET' },
      ])
      assert.deepEqual(agent.toolEnds.map(event => event.toolName), ['read', 'governance_preflight', 'write'])
      assert.equal(agent.toolEnds[0].isError, false)
      assert.equal(agent.toolEnds[1].isError, true, 'an owner outside the repository was accepted')
      assert.equal(agent.toolEnds[2].isError, true, 'mutation was opened after a refused owner')
      assert.deepEqual(agent.extensionErrors, [])
      assert.equal(readFileSync(externalOwner, 'utf8'), '# external owner\n')
      assert.equal(existsSync(harness.target), false)
    } finally {
      await agent.close()
    }
  } finally {
    await harness.close()
  }
})

test('an in-repository alias to an external owner is refused without being modified', { skip: SKIP, timeout: 120000 }, async t => {
  const harness = await createHarness()
  try {
    const external = join(harness.root, 'external-alias-target')
    mkdirSync(external, { recursive: true })
    const externalOwner = join(external, 'owner.md')
    writeFileSync(externalOwner, '# external alias owner\n')
    const alias = join(harness.repo, 'external-link')
    try {
      symlinkSync(external, alias, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      t.skip(`the host cannot create a directory alias: ${error.message}`)
      return
    }
    const agent = startAgent(harness, join(alias, 'owner.md'))
    try {
      await agent.waitReady()
      const section = referenceSection()
      await agent.prompt([
        { tool: 'read', path: section.readPath },
        { tool: 'governance_preflight', constraints: 'ALIAS_CONSTRAINT', acceptance: 'ALIAS_ACCEPTANCE' },
        { tool: 'write', path: harness.target, content: 'ALIAS_TARGET' },
      ])
      assert.deepEqual(agent.toolEnds.map(event => event.toolName), ['read', 'governance_preflight', 'write'])
      assert.equal(agent.toolEnds[0].isError, false)
      assert.equal(agent.toolEnds[1].isError, true, 'an aliased external owner was accepted')
      assert.equal(agent.toolEnds[2].isError, true, 'mutation was opened after a refused alias')
      assert.deepEqual(agent.extensionErrors, [])
      assert.equal(readFileSync(externalOwner, 'utf8'), '# external alias owner\n')
      assert.equal(existsSync(harness.target), false)
    } finally {
      await agent.close()
    }
  } finally {
    await harness.close()
  }
})

test('an in-repository alias to the repository itself is a legitimate owner path', { skip: SKIP, timeout: 120000 }, async t => {
  const harness = await createHarness()
  try {
    const alias = join(harness.repo, 'root-link')
    try {
      symlinkSync(harness.repo, alias, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      t.skip(`the host cannot create a directory alias: ${error.message}`)
      return
    }
    const agent = startAgent(harness, join(alias, 'AGENTS.md'))
    try {
      await agent.waitReady()
      const section = referenceSection()
      const constraints = 'ROOT_ALIAS_CONSTRAINT'
      const acceptance = 'ROOT_ALIAS_ACCEPTANCE'
      await agent.prompt([
        { tool: 'read', path: section.readPath },
        { tool: 'governance_preflight', constraints, acceptance },
        { tool: 'write', path: harness.target, content: 'ROOT_ALIAS_TARGET' },
      ])
      assert.deepEqual(agent.toolEnds.map(event => event.toolName), ['read', 'governance_preflight', 'write'])
      assert.equal(agent.toolEnds[0].isError, false)
      assert.equal(agent.toolEnds[1].isError, false, 'an in-repository alias was refused')
      assert.equal(agent.toolEnds[2].isError, false, 'mutation stayed closed after a valid checkpoint')
      assert.deepEqual(agent.extensionErrors, [])
      assert.equal(readFileSync(harness.target, 'utf8'), 'ROOT_ALIAS_TARGET')
      const ownerText = readFileSync(harness.owner, 'utf8')
      assert.ok(ownerText.includes(constraints))
      assert.ok(ownerText.includes(acceptance))
    } finally {
      await agent.close()
    }
  } finally {
    await harness.close()
  }
})
