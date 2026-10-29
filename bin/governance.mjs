#!/usr/bin/env node
// Governance runtime shipped with this Skill. Node-only, no dependencies.
// Commands: verify, list, cite, show, init, status, check.
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runShow } from './show.mjs'

const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KNOWLEDGE_DIR = join(SKILL_ROOT, 'knowledge')
const REFERENCES_DIR = join(SKILL_ROOT, 'references')
const GOVERNANCE_DIR = '.governance'

const args = process.argv.slice(2)
const command = args[0]

function fail(message) {
  console.error(`governance: ${message}`)
  process.exit(1)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function loadMechanisms() {
  if (!existsSync(KNOWLEDGE_DIR)) fail(`knowledge directory is missing: ${KNOWLEDGE_DIR}`)
  const mechanisms = []
  const domains = new Map()
  const ledgers = []
  for (const file of readdirSync(KNOWLEDGE_DIR).filter((name) => name.endsWith('.json')).sort()) {
    const value = readJson(join(KNOWLEDGE_DIR, file))
    if (typeof value.domain !== 'string' || value.domain.length === 0) fail(`${file}: domain is missing`)
    if (domains.has(value.domain)) fail(`${file}: duplicate domain ${value.domain}`)
    if (!Array.isArray(value.mechanisms) || value.mechanisms.length === 0) fail(`${file}: mechanisms must be a non-empty array`)
    domains.set(value.domain, value.mechanisms.length)
    ledgers.push({ file, domain: value.domain, sourceCommit: value.sourceCommit, mechanisms: value.mechanisms })
    for (const mechanism of value.mechanisms) mechanisms.push({ ...mechanism, file })
  }
  return { mechanisms, domains, ledgers }
}

function anchorPresent(text, fragment) {
  const wanted = fragment.toLowerCase()
  let fence = null
  for (const line of text.split(/\r?\n/)) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      if (delimiter && delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = null
      continue
    }
    if (delimiter) {
      fence = delimiter[1]
      continue
    }
    for (const anchor of line.matchAll(/<(?:a|h[1-6])\b[^>]*\b(?:id|name)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
      if (anchor[1].toLowerCase() === wanted) return true
    }
    const heading = line.match(/^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/)
    if (!heading) continue
    const explicit = heading[1].match(/\s*\{#([^}]+)\}\s*$/)
    if (explicit && explicit[1].toLowerCase() === wanted) return true
    const title = heading[1].replace(/\s*\{#[^}]+\}\s*$/, '')
    const slug = title.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-')
    if (slug === wanted) return true
  }
  return false
}

function verify() {
  const { mechanisms, domains } = loadMechanisms()
  const problems = []
  const seen = new Set()
  for (const mechanism of mechanisms) {
    const id = mechanism.id
    if (typeof id !== 'string' || id.length === 0) { problems.push(`${mechanism.file}: mechanism without id`); continue }
    if (seen.has(id)) problems.push(`duplicate mechanism id ${id}`)
    seen.add(id)
    if (typeof mechanism.reference !== 'string' || !mechanism.reference.includes('#')) {
      problems.push(`${id}: reference must be a path#anchor`)
      continue
    }
    const [filePart, fragment] = mechanism.reference.split('#')
    const referencePath = join(SKILL_ROOT, filePart)
    if (!existsSync(referencePath)) { problems.push(`${id}: reference file is missing: ${filePart}`); continue }
    const text = readFileSync(referencePath, 'utf8')
    if (!text.includes(id)) problems.push(`${id}: reference ${filePart} does not contain the mechanism id`)
    if (!anchorPresent(text, fragment)) problems.push(`${id}: reference ${filePart} does not contain anchor #${fragment}`)
    if (!Array.isArray(mechanism.sources) || mechanism.sources.length === 0) {
      problems.push(`${id}: sources must be a non-empty array`)
    } else {
      for (const source of mechanism.sources) {
        if (typeof source?.path !== 'string' || !Number.isInteger(source?.start) || !Number.isInteger(source?.end)) {
          problems.push(`${id}: every source needs path, start and end`)
          break
        }
      }
    }
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`governance: ${problem}`)
    console.error(`governance: ${problems.length} integrity problem(s)`)
    process.exit(1)
  }
  console.log(`governance: ${mechanisms.length} mechanisms in ${domains.size} domains; references and anchors verified`)
}

function list() {
  const { mechanisms, domains } = loadMechanisms()
  for (const [domain, count] of [...domains].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${domain}\t${count}`)
  }
  console.log(`total\t${mechanisms.length}`)
}

function cite() {
  const query = args[1]
  if (!query) fail('usage: governance cite <mechanism-id-or-text>')
  const { mechanisms } = loadMechanisms()
  const exact = mechanisms.filter((mechanism) => mechanism.id === query)
  const matches = exact.length > 0 ? exact : mechanisms.filter((mechanism) => String(mechanism.id).includes(query))
  if (matches.length === 0) fail(`no mechanism matches ${query}`)
  for (const mechanism of matches.slice(0, 12)) {
    console.log(`${mechanism.id}`)
    console.log(`  title: ${mechanism.title}`)
    console.log(`  reference: ${mechanism.reference}`)
    console.log(`  domain: ${mechanism.file.replace(/\.json$/, '')}`)
    console.log(`  sources: ${(mechanism.sources ?? []).length}`)
  }
  if (matches.length > 12) console.log(`... ${matches.length - 12} more; narrow the query`)
}

function readTarget(dir) {
  const root = resolve(dir)
  const governance = join(root, GOVERNANCE_DIR)
  const policyPath = join(governance, 'policy.json')
  const statePath = join(governance, 'state.json')
  const requirementsPath = join(governance, 'requirements.md')
  return { root, governance, policyPath, statePath, requirementsPath }
}

function init() {
  const dir = args[1] ?? '.'
  const { root, governance, policyPath, statePath, requirementsPath } = readTarget(dir)
  mkdirSync(join(governance, 'decisions'), { recursive: true })
  const writes = []
  const skip = []
  const writeOnce = (path, content) => {
    if (existsSync(path)) { skip.push(path); return }
    writeFileSync(path, content)
    writes.push(path)
  }
  writeOnce(policyPath, JSON.stringify({
    schema: 'dsh-governance-policy/v1',
    project: { name: '', root: '.' },
    skill: { name: 'harness-project-governance', version: '1.0.0' },
    toolchains: [],
    owners: {},
    checks: {},
    activation: {},
  }, null, 2) + '\n')
  writeOnce(statePath, JSON.stringify({
    schema: 'dsh-governance-state/v1',
    phase: 'intake',
    requirement: null,
    acceptance: [],
    nextAction: 'fill .governance/requirements.md, then set state.requirement',
    updatedAt: new Date().toISOString(),
  }, null, 2) + '\n')
  writeOnce(requirementsPath, [
    '# Requirement',
    '',
    '## Goal',
    '',
    '## Acceptance',
    '',
    '- ',
    '',
    '## Non-goals',
    '',
    '## Evidence plan',
    '',
  ].join('\n'))
  writeOnce(join(governance, 'README.md'), [
    '# Project governance state',
    '',
    'This directory is written by the harness-project-governance Skill for change tasks that need acceptance tracking or cross-session continuation. It is migration design, not a source-repository guarantee: read it when such a task starts here, not for every question.',
    '',
    '- `requirements.md`: goal, acceptance, non-goals and evidence plan. Acceptance items are the completion test.',
    '- `policy.json`: project facts (name, toolchains, owners, checks, activation). Empty fields mean "not established yet", not "not applicable".',
    '- `state.json`: current phase, active requirement, next action. Update it when the task changes, not when it ends.',
    '- `decisions/`: one decision record per irreversible or cross-cutting choice.',
    '',
    'Filled metadata is not permission to act: `status` never runs `policy.checks`, and it cannot tell whether a next action was withdrawn or whether an archived record is still current. `check` runs exactly the commands in `policy.checks`; it does not infer checks, prove semantic completeness or show platform enforcement. Verify authority, ownership and completion separately.',
    '',
    'Run `node <skill>/bin/governance.mjs status <repo>` to see what is still missing, then `node <skill>/bin/governance.mjs check <repo>` to execute the configured checks.',
  ].join('\n') + '\n')
  for (const path of writes) console.log(`created ${path.slice(root.length + 1)}`)
  for (const path of skip) console.log(`kept    ${path.slice(root.length + 1)} (existing files are never overwritten)`)
  status(root)
}

function status(dir = args[1] ?? '.') {
  const { root, governance, policyPath, statePath, requirementsPath } = readTarget(dir)
  if (!existsSync(governance)) fail(`${root} has no ${GOVERNANCE_DIR}/; run: governance init ${root}`)
  const problems = []
  let policy = null
  let state = null
  let requirements = ''
  try { policy = readJson(policyPath) } catch (error) { problems.push(`policy.json: ${error.message}`) }
  try { state = readJson(statePath) } catch (error) { problems.push(`state.json: ${error.message}`) }
  if (existsSync(requirementsPath)) requirements = readFileSync(requirementsPath, 'utf8')
  else problems.push('requirements.md is missing')
  if (policy) {
    if (!policy.project?.name) problems.push('policy.project.name is empty')
    if (!Array.isArray(policy.toolchains) || policy.toolchains.length === 0) problems.push('policy.toolchains is empty')
    if (!policy.owners || Object.keys(policy.owners).length === 0) problems.push('policy.owners is empty')
    if (!policy.checks || Object.keys(policy.checks).length === 0) problems.push('policy.checks is empty')
  }
  if (state) {
    if (!state.requirement) problems.push('state.requirement is null')
    if (!Array.isArray(state.acceptance) || state.acceptance.length === 0) problems.push('state.acceptance is empty')
    if (!state.nextAction) problems.push('state.nextAction is empty')
  }
  if (requirements && !/^## Acceptance\s*\n+\s*- \S/m.test(requirements)) problems.push('requirements.md has no acceptance bullet')
  console.log(`governance: ${root}`)
  console.log(`  phase: ${state?.phase ?? 'unknown'}`)
  console.log(`  requirement: ${state?.requirement ?? '(none)'}`)
  console.log(`  next action: ${state?.nextAction ?? '(none)'}`)
  if (problems.length === 0) {
    console.log('  status: metadata fields are filled; this does not execute project checks or prove the task complete')
    return
  }
  for (const problem of problems) console.log(`  missing: ${problem}`)
  process.exitCode = 2
}

function check() {
  let dir = null
  let policyArg = null
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--policy') {
      policyArg = args[++index]
      if (!policyArg) {
        console.error('governance: --policy requires a repository-relative path')
        process.exit(2)
      }
    } else if (arg.startsWith('-')) {
      console.error(`governance: unknown check option: ${arg}`)
      process.exit(2)
    } else if (dir !== null) {
      console.error(`governance: unexpected check argument: ${arg}`)
      process.exit(2)
    } else dir = arg
  }
  const { root, governance, policyPath: defaultPolicyPath } = readTarget(dir ?? '.')
  const policyPath = policyArg ? resolve(root, policyArg) : defaultPolicyPath
  if (!policyArg && !existsSync(governance)) {
    console.error(`governance: ${root} has no ${GOVERNANCE_DIR}/; run: governance init ${root}`)
    process.exit(2)
  }
  let policy
  try {
    const canonicalRoot = realpathSync(root)
    const canonicalPolicyPath = realpathSync(policyPath)
    const relativePath = relative(canonicalRoot, canonicalPolicyPath)
    if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
      console.error('governance: policy must resolve inside the target repository')
      process.exit(2)
    }
    policy = readJson(canonicalPolicyPath)
  } catch (error) {
    console.error(`governance: cannot read ${policyArg ?? '.governance/policy.json'}: ${error.message}`)
    process.exit(2)
  }
  const entries = policy?.checks
  if (!entries || typeof entries !== 'object' || Array.isArray(entries) || Object.keys(entries).length === 0) {
    console.error('governance: policy.checks is empty; configure real project commands before running check')
    process.exit(2)
  }
  const plan = []
  for (const [name, command] of Object.entries(entries)) {
    if (typeof command !== 'string' || command.trim().length === 0) {
      console.error(`governance: policy.checks.${name} must be a non-empty command string`)
      process.exit(2)
    }
    plan.push({ name, command })
  }
  console.log(`governance: ${root}`)
  const failures = []
  for (const { name, command } of plan) {
    console.log(`\n--- check ${name}: ${command} ---`)
    const result = spawnSync(command, { cwd: root, shell: true, stdio: 'inherit', env: process.env })
    const status = result.error ? null : result.status
    if (result.error) console.error(`governance: ${name} failed to start: ${result.error.message}`)
    else if (result.signal) console.error(`governance: ${name} was terminated by ${result.signal}`)
    console.log(`[observed exit ${status ?? 'none'}${result.signal ? `, signal ${result.signal}` : ''}]`)
    if (status !== 0) failures.push(name)
  }
  console.log(`\ngovernance: ${plan.length - failures.length}/${plan.length} configured checks passed`)
  if (failures.length > 0) {
    console.error(`governance: failed checks: ${failures.join(', ')}`)
    process.exit(1)
  }
  console.log('governance: configured checks passed; this does not prove semantic completeness, adoption or platform enforcement')
}

function show() {
  const { ledgers } = loadMechanisms()
  runShow(args.slice(1), {
    ledgers,
    skillRoot: SKILL_ROOT,
    referencesDir: REFERENCES_DIR,
    anchorPresent,
  })
}

switch (command) {
  case 'verify': verify(); break
  case 'list': list(); break
  case 'cite': cite(); break
  case 'show': show(); break
  case 'init': init(); break
  case 'status': status(); break
  case 'check': check(); break
  default:
    console.error('usage: governance <verify|list|cite|show|init|status|check> [argument] [--policy path]')
    process.exit(1)
}
