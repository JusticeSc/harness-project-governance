// Target-added optional OMP18.13.1 root-session checkpoint; not an upstream mechanism.
// Load with --trusted-extension and --governance-owner <existing Markdown owner>.
import { appendFileSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const READ_ONLY = new Set(['read', 'grep', 'glob'])
const PREFLIGHT = 'governance_preflight'

export default function simplificationPreflight(pi) {
  const reference = realpathSync(fileURLToPath(new URL('../../references/agent-workflows.md', import.meta.url)))
  const referenceText = readFileSync(reference, 'utf8').replaceAll('\r\n', '\n')
  const start = referenceText.indexOf('<a id="aw-18"></a>')
  const end = referenceText.indexOf('<a id="aw-19"></a>', start)
  if (start < 0 || end <= start) throw new Error('Simplification reference boundaries are missing')
  const section = referenceText.slice(start, end).trimEnd()
  const requiredLines = section.split('\n').filter(line => line.trim() !== '')
  const firstLine = referenceText.slice(0, start).split('\n').length
  const lastLine = firstLine + section.split('\n').length - 1
  const readPath = `${reference}:${firstLine}-${lastLine}:raw`

  pi.registerFlag('governance-owner', {
    type: 'string',
    description: 'Existing in-repository Markdown state owner for the optional simplification checkpoint',
  })

  let sessionId
  let referenceReturned = false
  let prepared = false

  function reset() {
    referenceReturned = false
    prepared = false
  }

  function currentSession(ctx) {
    const id = ctx.sessionManager.getSessionId()
    if (id !== sessionId) {
      reset()
      sessionId = id
    }
  }

  function ownerPath(ctx) {
    // CLI flags are applied after factory binding; never capture their defaults at load time.
    const configured = pi.getFlag('governance-owner')
    if (typeof configured !== 'string' || configured.trim() === '') {
      throw new Error('Set --governance-owner to the existing Markdown state owner; no owner will be created')
    }
    const root = realpathSync(ctx.cwd)
    const owner = realpathSync(resolve(ctx.cwd, configured))
    const local = relative(root, owner)
    if (local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local)) {
      throw new Error('The state owner must resolve inside the current repository, including through aliases')
    }
    if (!statSync(owner).isFile() || extname(owner).toLowerCase() !== '.md') {
      throw new Error('The state owner must be an existing Markdown file')
    }
    return owner
  }

  function isMain(ctx) {
    return ctx.agent?.kind === 'main'
  }

  pi.on('input', reset)
  pi.on('before_agent_start', reset)
  pi.on('session_switch', reset)
  pi.on('session_branch', reset)
  pi.on('session_tree', reset)

  pi.on('tool_result', (event, ctx) => {
    if (!isMain(ctx) || event.toolName !== 'read' || event.isError) return
    currentSession(ctx)
    const source = event.details?.meta?.source
    const returnedPath = source?.type === 'path' ? source.value : event.details?.resolvedPath
    if (typeof returnedPath !== 'string') return
    let actual
    try { actual = realpathSync(returnedPath) } catch { return }
    if (relative(reference, actual) !== '') return
    const text = event.content.filter(part => part.type === 'text').map(part => part.text).join('\n')
    // OMP also labels a complete bounded window "truncated" when later file lines remain.
    // Require the actual section text: a requested selector or success flag alone is insufficient.
    if (requiredLines.every(line => text.includes(line))) referenceReturned = true
  })

  pi.on('tool_call', (event, ctx) => {
    if (READ_ONLY.has(event.toolName)) return
    currentSession(ctx)
    if (!isMain(ctx)) {
      return { block: true, reason: 'This optional checkpoint supports root-session mutation only; child activation is not guaranteed' }
    }
    if (event.toolName === PREFLIGHT || prepared) return
    return {
      block: true,
      reason: 'Before mutation or executable/delegating tools, read the applicable installed reference and record local constraints and observable acceptance with governance_preflight',
    }
  })

  pi.registerTool({
    name: PREFLIGHT,
    label: 'Record simplification preflight',
    loadMode: 'essential',
    description: `Before simplifying, read the existing owner/contracts and the complete installed simplification section with read({path:${JSON.stringify(readPath)}}). Then supply the reference-to-local-constraint mapping and normal/rejection acceptance. This tool appends them to --governance-owner and permits root-session tool calls. It records mechanical reading/order, not semantic correctness.`,
    parameters: {
      type: 'object',
      properties: {
        constraints: { type: 'string', description: 'Applicable reference obligations mapped to concrete existing local owners, contracts and trust boundaries' },
        acceptance: { type: 'string', description: 'Observable normal and rejection conditions, plus the actual checks to run after implementation' },
      },
      required: ['constraints', 'acceptance'],
      additionalProperties: false,
    },
    async execute(_id, params, signal, _onUpdate, ctx) {
      currentSession(ctx)
      prepared = false
      try {
        if (!isMain(ctx)) throw new Error('Only a root session can record this checkpoint')
        const owner = ownerPath(ctx)
        if (!referenceReturned) throw new Error(`No complete successful native read of the installed section was observed. Read ${readPath}`)
        if (readFileSync(reference, 'utf8').replaceAll('\r\n', '\n') !== referenceText) {
          referenceReturned = false
          throw new Error('The reference changed; reload the extension before continuing')
        }
        if (typeof params.constraints !== 'string' || params.constraints.trim() === '' ||
            typeof params.acceptance !== 'string' || params.acceptance.trim() === '') {
          throw new Error('Both the local constraint mapping and observable acceptance must be nonblank')
        }
        if (signal?.aborted) throw new Error('Preflight was cancelled before recording')
        const record = `\n\n### Simplification preflight\n\nReference returned by native read: ${readPath}\n\nLocal constraint mapping:\n\n${params.constraints.trim()}\n\nObservable acceptance:\n\n${params.acceptance.trim()}\n\nThis checkpoint records supplied claims and observed reading/order; semantic validity and final behavior remain unverified.\n`
        appendFileSync(owner, record, 'utf8')
        prepared = true
        return {
          content: [{ type: 'text', text: `Preflight recorded in ${owner}. Continue only within the authorized task; run the actual checks and retain unverified limits.` }],
          details: { owner, reference, mechanicallyPrepared: true },
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text', text: error.message }] }
      }
    },
  })
}
