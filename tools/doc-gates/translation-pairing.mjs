// Pure parsing and structural helpers for the bilingual-document pairing gate.
// Adapted from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/translation-pairing.ts.
// License: ../../SOURCE-LICENSE.txt.
//
// Two adaptations, both explicit:
// 1. The source's corpus predicate hardcodes product directories (`docs/`, `python/`, README artifacts,
//    `.agents/notes/`). Here the corpus is declared by the target's `.doc-gates/translation-pairing.json`
//    (`roots` + `files` + `excluded`); a missing or empty declaration is an activation failure, not a pass.
// 2. The source's generated-source allowlist and public blob root are product facts, so they come from the
//    same config (`generatedSources`, `publicRepositoryBlobRoot`).
// Generator-side helpers (renderGeneratedRegion, spliceGeneratedRegion) are not ported: no shipped command
// injects generated regions, and a gate that rendered them would be a different capability.
import { basename } from 'node:path'
import {
  languageSwitcherLinkOffset,
  semanticTranslationLinkNodeTarget,
} from './translation-links.mjs'
import { parseMarkdown } from './markdown.mjs'

/** Complete opening marker line: `<!-- BEGIN GENERATED <slug> … -->` (slug captured). */
const GENERATED_REGION_BEGIN_LINE = /^<!-- BEGIN GENERATED (\S+)(?: [^>]*)? -->$/
/** Complete closing marker line: `<!-- END GENERATED <slug> -->` (slug captured). */
const GENERATED_REGION_END_LINE = /^<!-- END GENERATED (\S+) -->$/
/** Loose marker detector: any line that LOOKS like a region marker must parse as one. */
const GENERATED_REGION_MARKER_HINT = /^<!-- (?:BEGIN|END) GENERATED /

/**
 * Locate every generated region. Regions are line-delimited: a marker occupies
 * its whole line, must be a complete well-formed marker, and the closing slug
 * must match the opener.
 *
 * @param content - Full Markdown document text.
 * @returns The regions in document order.
 * @throws Error on an unopened END, unclosed BEGIN, nested BEGIN, malformed
 *   marker line, or a closing slug that does not match its opener.
 */
export function generatedRegions(content) {
  const lines = content.split('\n')
  const regions = []
  let open = null
  for (const [index, line] of lines.entries()) {
    const begin = GENERATED_REGION_BEGIN_LINE.exec(line)
    if (begin?.[1]) {
      if (open) throw new Error('generated region BEGIN marker nested inside an open region')
      open = { slug: begin[1], begin: index }
      continue
    }
    const end = GENERATED_REGION_END_LINE.exec(line)
    if (end?.[1]) {
      if (!open) throw new Error('generated region END marker without a BEGIN')
      if (end[1] !== open.slug) throw new Error(`generated region END slug '${end[1]}' does not match its BEGIN slug '${open.slug}'`)
      regions.push({ ...open, end: index, text: lines.slice(open.begin, index + 1).join('\n') })
      open = null
      continue
    }
    if (GENERATED_REGION_MARKER_HINT.test(line)) {
      throw new Error(`malformed generated region marker line: ${JSON.stringify(line)}`)
    }
  }
  if (open) throw new Error('generated region BEGIN marker without an END')
  return regions
}

const NON_SOURCE_DIRECTORIES = new Set([
  'node_modules',
  'lib',
  '.pnpm-store',
  '.cache',
  'coverage',
  '.sessions',
  '.storages',
  'tmp',
  'dist-exe',
  '__pycache__',
  '.pytest_cache',
  '.artifacts',
  'vendor',
])

/** Whether a repository-relative path belongs to a dependency or generated tree. */
function isTranslationSourceExcluded(file) {
  const segments = file.split('/')
  return segments.some(segment => NON_SOURCE_DIRECTORIES.has(segment)
      || segment.startsWith('.doc-typecheck-')
    || segment.startsWith('.node-next-types-'))
}

function stringArray(record, field, required) {
  const value = record[field]
  if (value === undefined) {
    if (required) throw new Error(`translation-pairing config: ${field} is required (declare the paired-document corpus; an empty corpus is not a pass)`)
    return []
  }
  if (!Array.isArray(value) || !value.every(entry => typeof entry === 'string')) {
    throw new Error(`translation-pairing config: ${field} must be an array of strings`)
  }
  return value
}

function normalizeEntry(entry) {
  return entry.split('\\').join('/').replace(/^\.\//, '')
}

/**
 * Parse and validate the target's pairing config.
 *
 * Unlike the source manifest — which lists only exclusions because the corpus is a product fact — this
 * config must declare the corpus. Unknown fields are rejected so a misspelled scope cannot silently widen
 * or narrow the checked set.
 *
 * @param content - Config file text (JSON).
 * @returns The validated config.
 * @throws Error when the document is not an object, has unsupported fields, or declares no corpus.
 */
export function parseTranslationPairingManifest(content) {
  const value = JSON.parse(content)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('translation-pairing config: expected an object')
  }
  const record = value
  const supported = ['excluded', 'files', 'generatedSources', 'publicRepositoryBlobRoot', 'roots']
  const unsupported = Object.keys(record).filter(field => !supported.includes(field))
  if (unsupported.length > 0) {
    throw new Error(`translation-pairing config: unsupported field(s): ${unsupported.join(', ')}; every in-scope document is required`)
  }
  const roots = stringArray(record, 'roots', true).map(entry => normalizeEntry(entry).replace(/\/+$/, '')).filter(Boolean)
  const files = stringArray(record, 'files', false).map(normalizeEntry)
  if (roots.length === 0 && files.length === 0) {
    throw new Error('translation-pairing config: roots and files are both empty; declare the paired-document corpus')
  }
  const blobRoot = record.publicRepositoryBlobRoot
  if (blobRoot !== undefined && typeof blobRoot !== 'string') {
    throw new Error('translation-pairing config: publicRepositoryBlobRoot must be a string')
  }
  return {
    excluded: stringArray(record, 'excluded', false).map(normalizeEntry),
    files,
    generatedSources: stringArray(record, 'generatedSources', false).map(normalizeEntry),
    publicRepositoryBlobRoot: blobRoot === undefined ? undefined : blobRoot.endsWith('/') ? blobRoot : `${blobRoot}/`,
    roots,
  }
}

/** Whether one discovered Markdown or sidecar path belongs to the declared bilingual source corpus. */
export function isTranslationScopeFile(file, manifest) {
  if (isTranslationSourceExcluded(file)) return false
  if (manifest.files.includes(file)) return true
  return manifest.roots.some(root => file.startsWith(`${root}/`))
}

/** Whether a manifest entry excludes one exact file or a directory subtree. */
export function isTranslationPairingManifestExcluded(file, manifest) {
  return manifest.excluded.some(entry => (entry.endsWith('/') ? file.startsWith(entry) : file === entry))
}

/** Build the active bilingual-source predicate shared by every link consumer. */
export function translationPairSourcePredicate(manifest) {
  return sourcePath => isTranslationScopeFile(sourcePath, manifest)
    && !isTranslationPairingManifestExcluded(sourcePath, manifest)
}

/**
 * Normalize one CLI pair argument to its English anchor path: any of the
 * pair's three files (`foo.md`, `foo.zh.md`, `foo.i18n.yaml`) or the bare
 * `foo` stem names the same pair, and platform separators are accepted.
 *
 * @param argument - Repo-relative path as passed on a command line.
 * @returns The pair's `foo.md` anchor path with `/` separators.
 */
export function pairAnchorOfArgument(argument) {
  const normalized = argument.split('\\').join('/').replace(/^\.\//, '')
  if (normalized.endsWith('.zh.md')) return `${normalized.slice(0, -'.zh.md'.length)}.md`
  if (normalized.endsWith('.i18n.yaml')) return `${normalized.slice(0, -'.i18n.yaml'.length)}.md`
  if (normalized.endsWith('.md')) return normalized
  return `${normalized}.md`
}

/**
 * Parse and validate `verify-translation-pairing` CLI arguments.
 *
 * Check accepts optional pair paths; `--write` requires either pair paths or
 * `--all` so a bulk re-record is always an explicit choice — a bare
 * `--write` would silently bless every drifted pair in the tree, including
 * ones the caller never confirmed. `--list` is corpus-only.
 *
 * @param argv - Arguments after the script name.
 * @returns The validated request.
 * @throws Error when flags or their combination are invalid.
 */
export function parseTranslationPairingCliArgs(argv) {
  const valued = new Map()
  const remaining = []
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const inline = /^--(repo|config)=(.*)$/.exec(argument)
    if (inline?.[1] !== undefined) {
      valued.set(inline[1], inline[2] ?? '')
      continue
    }
    const separate = /^--(repo|config)$/.exec(argument)
    if (separate?.[1] !== undefined) {
      const value = argv[index + 1]
      if (value === undefined) throw new Error(`${argument} requires a value`)
      valued.set(separate[1], value)
      index += 1
      continue
    }
    remaining.push(argument)
  }
  const flags = remaining.filter(argument => argument.startsWith('--'))
  const anchors = [...new Set(remaining
    .filter(argument => !argument.startsWith('--'))
    .map(pairAnchorOfArgument))].sort()
  const unknown = flags.filter(flag => !['--list', '--write', '--all', '--cached'].includes(flag))
  if (unknown.length > 0) throw new Error(`unknown flag(s): ${unknown.join(', ')}`)
  const listMode = flags.includes('--list')
  const writeMode = flags.includes('--write')
  const allMode = flags.includes('--all')
  const cachedMode = flags.includes('--cached')
  if (listMode && (writeMode || allMode || cachedMode || anchors.length > 0)) {
    throw new Error('--list reports the whole corpus and takes no other flags or paths')
  }
  if (allMode && !writeMode) throw new Error('--all only applies to --write')
  if (cachedMode && writeMode) throw new Error('--cached is a read-only index check and cannot be combined with --write')
  if (cachedMode && anchors.length === 0) throw new Error('--cached requires the staged pair paths to check')
  const repo = valued.get('repo')
  const config = valued.get('config')
  if (writeMode) {
    if (anchors.length > 0 && allMode) throw new Error('--write takes either pair paths or --all, not both')
    if (anchors.length === 0 && !allMode) {
      throw new Error('--write requires the pair(s) you confirmed (any file of a pair), or --all to re-record every complete pair; recording pairs you did not review blesses unconfirmed content')
    }
    return { config, input: 'worktree', mode: 'write', repo, scope: allMode ? 'corpus' : 'pairs', anchors }
  }
  if (listMode) return { config, input: 'worktree', mode: 'list', repo, scope: 'corpus', anchors: [] }
  return {
    config,
    input: cachedMode ? 'index' : 'worktree',
    mode: 'check',
    repo,
    scope: anchors.length > 0 ? 'pairs' : 'corpus',
    anchors,
  }
}

/** Parse Markdown with the same GFM extensions used by the pairing gate. */
export function parseTranslationMarkdown(content) {
  return parseMarkdown(content)
}

/** Return the accepted relative and public-repository links to one counterpart. */
export function languageSwitcherTargets(counterpart, manifest) {
  const targets = [basename(counterpart)]
  if (manifest.publicRepositoryBlobRoot !== undefined) targets.push(`${manifest.publicRepositoryBlobRoot}${counterpart}`)
  return targets
}

/** Generated English sources cannot carry a switcher without making their generator stale. */
export function requiresSourceLanguageSwitcher(source, manifest) {
  return !manifest.generatedSources.includes(source)
}

/** Collect the ordered structural signature, skipping accepted switcher targets. */
export function translationStructureSignature(tree, switcherTargets, linkContext) {
  const switcherOffset = languageSwitcherLinkOffset(tree, linkContext.markdown, switcherTargets)
  const sig = { headings: [], code: [], tables: [], lists: [], links: [] }
  const definitions = new Map()
  const collectDefinitions = (node) => {
    if (node.type === 'definition' && !definitions.has(node.identifier)) {
      definitions.set(node.identifier, node)
    }
    if ('children' in node) for (const child of node.children) collectDefinitions(child)
  }
  collectDefinitions(tree)
  const linkTarget = (node) => (
    semanticTranslationLinkNodeTarget(node, linkContext.markdown, linkContext)
  )
  const visit = (node) => {
    switch (node.type) {
      case 'heading':
        sig.headings.push(node.depth)
        break
      case 'code':
        sig.code.push(`\`\`\`${node.lang ?? ''}${node.meta ? ` ${node.meta}` : ''}\n${node.value}`)
        break
      case 'table':
        sig.tables.push(`${node.children.length}x${node.children[0]?.children.length ?? 0}`)
        break
      case 'list':
        sig.lists.push(node.ordered
          ? `ordered:start=${node.start ?? 1}:items=${node.children.length}`
          : `bullet:items=${node.children.length}`)
        break
      case 'link':
        if (node.position?.start.offset !== switcherOffset) {
          sig.links.push(linkTarget(node))
        }
        break
      case 'linkReference': {
        const definition = definitions.get(node.identifier)
        if (definition !== undefined) {
          sig.links.push(linkTarget(definition))
        }
        break
      }
      default:
        // Every other node kind is prose or a container, not part of the signature.
        break
    }
    if ('children' in node) for (const child of node.children) visit(child)
  }
  visit(tree)
  return sig
}

/** Render a signature element for an error message, truncated for readability. */
function show(value) {
  if (value === undefined) return 'nothing'
  const text = JSON.stringify(value)
  return text.length > 72 ? `${text.slice(0, 72)}…` : text
}

/** Return the first divergence for each structural field; empty means equal. */
export function translationStructureDiff(source, zh) {
  const out = []
  const fields = [
    ['heading (depth)', source.headings, zh.headings],
    ['code block', source.code, zh.code],
    ['table (row x column count)', source.tables, zh.tables],
    ['list (kind, start, item count)', source.lists, zh.lists],
    ['link target', source.links, zh.links],
  ]
  for (const [field, sourceValues, zhValues] of fields) {
    const length = Math.max(sourceValues.length, zhValues.length)
    for (let index = 0; index < length; index++) {
      if (sourceValues[index] !== zhValues[index]) {
        out.push(`${field} #${index + 1} diverges between the pair: ${show(sourceValues[index])} vs ${show(zhValues[index])}`)
        break
      }
    }
  }
  return out
}
