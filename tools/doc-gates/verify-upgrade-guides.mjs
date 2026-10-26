#!/usr/bin/env node
// Enforce the `<guide-root>/v<version>/<item>/guide.md` layout, metadata, sections, and word ceiling.
// Adapted from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/verify-upgrade-guides.ts.
// License: ../../SOURCE-LICENSE.txt.
//
// Usage:
//   node tools/doc-gates/verify-upgrade-guides.mjs [--root <dir>] [--guide-root <relative-dir>]
//   node tools/doc-gates/verify-upgrade-guides.mjs --print-config
//
// Exit codes: 0 conforming (or no guide tree present — the source gate's documented blind spot),
//             1 violations, 2 unusable prerequisite (missing parser, bad flag, missing required root).
//
// Adaptations from the source verifier, each explicit:
// - `GUIDE_ROOT` and the repository root are parameters (`--guide-root`, `--root`), because the source's
//   `docs/upgrade-guide` and `import.meta.dirname/..` are product facts.
// - The expected H1/H2 names per language file come from the same optional parameters
//   (`--sections guide.md=Change,Migration`), so a non-Chinese second language can be expressed without
//   editing the code. Defaults are the source's English and Chinese names.
// - Everything else — recursive scan, path regex, frontmatter regex + js-yaml JSON_SCHEMA parse, mdast
//   heading slicing, whitespace-token word count, the absent-tree pass — is the source semantics.
// Deliberately not ported: nothing. The source file has no other behavior.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const COMMAND = 'verify-upgrade-guides'
const DEFAULT_GUIDE_ROOT = 'docs/upgrade-guide'
const FRONTMATTER_KEYS = ['description', 'kind']
/** Required `##` sections for each guide language; the word ceiling applies to the English source. */
const DEFAULT_LANGUAGES = {
  'guide.md': { sections: ['Change', 'Migration'], maxWords: 500 },
  'guide.zh.md': { sections: ['变更', '迁移'], maxWords: undefined },
}
const SEMVER = String.raw`(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?`

function guidePathPattern() {
  return new RegExp(`^v${SEMVER}/[a-z0-9]+(?:-[a-z0-9]+)*/(guide\\.md|guide\\.zh\\.md|guide\\.i18n\\.yaml)$`, 'u')
}

function usage() {
  console.error(`usage: node tools/doc-gates/${COMMAND}.mjs [--root <dir>] [--guide-root <relative-dir>] [--sections <guide.md|guide.zh.md>=<H2>,<H2>] [--max-words <guide.md|guide.zh.md>=<n>] [--print-config]`)
}

/** The two guide files whose content the gate reads; the layout regex fixes this set. */
const CHECKED_FILES = Object.keys(DEFAULT_LANGUAGES)

/** Parse the CLI. Every knob is explicit; nothing is read from a package.json or publisher path. */
function parseArgs(argv) {
  const options = { root: process.cwd(), guideRoot: DEFAULT_GUIDE_ROOT, languages: structuredClone(DEFAULT_LANGUAGES), printConfig: false }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    const take = () => {
      if (value === undefined) throw new Error(`${flag} requires a value`)
      index += 1
      return value
    }
    if (flag === '--root') options.root = take()
    else if (flag === '--guide-root') options.guideRoot = take().split('\\').join('/').replace(/^\.\//, '').replace(/\/+$/, '')
    else if (flag === '--sections') {
      const [file, list] = take().split('=')
      if (!CHECKED_FILES.includes(file)) throw new Error(`--sections must name one of ${CHECKED_FILES.join(', ')}; the guide file set is fixed by the layout rule`)
      if (list === undefined) throw new Error('--sections expects <file>=<H2>,<H2>')
      options.languages[file] = { ...(options.languages[file] ?? {}), sections: list.split(',').map(section => section.trim()).filter(Boolean) }
    } else if (flag === '--max-words') {
      const [file, count] = take().split('=')
      if (!CHECKED_FILES.includes(file)) throw new Error(`--max-words must name one of ${CHECKED_FILES.join(', ')}; the guide file set is fixed by the layout rule`)
      const parsed = Number(count)
      if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('--max-words expects <file>=<positive-integer>')
      options.languages[file] = { ...(options.languages[file] ?? {}), maxWords: parsed }
    } else if (flag === '--print-config') options.printConfig = true
    else throw new Error(`unknown argument: ${flag}`)
  }
  for (const [file, language] of Object.entries(options.languages)) {
    if (!Array.isArray(language.sections) || language.sections.length === 0) throw new Error(`${file}: at least one required "## " section must be declared`)
  }
  if (options.guideRoot === '') throw new Error('--guide-root must not be empty')
  return options
}

/** Return one guide's frontmatter and structure violations. */
function guideViolations(source, language, loadYaml) {
  const violations = []
  const words = source.split(/\s+/u).filter(Boolean).length
  if (language.maxWords !== undefined && words > language.maxWords) violations.push(`${String(words)} words exceeds the ${String(language.maxWords)}-word ceiling`)

  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/u.exec(source)
  if (frontmatter === null) return [...violations, 'must start with YAML frontmatter']
  const metadata = loadYaml(frontmatter[1])
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) return [...violations, 'frontmatter must be a YAML object']
  const fields = metadata
  const keys = Object.keys(fields).sort()
  if (keys.join() !== FRONTMATTER_KEYS.join()) violations.push(`frontmatter keys must be exactly ${FRONTMATTER_KEYS.join(', ')}; got ${keys.join(', ') || 'none'}`)
  if (fields.kind !== 'upgrade-guide') violations.push('kind must be upgrade-guide')
  if (typeof fields.description !== 'string' || fields.description.trim() === '') violations.push('description must be a non-empty string')

  const body = source.slice(frontmatter[0].length)
  const outline = language.parseMarkdown(body).children
    .flatMap(node => node.type === 'heading' && node.depth <= 2 ? [body.slice(node.position?.start.offset, node.position?.end.offset)] : [])
  const expected = language.sections.map(section => `## ${section}`)
  if (outline.length !== expected.length + 1 || !outline[0]?.startsWith('# ') || outline.slice(1).join('\n') !== expected.join('\n')) {
    violations.push(`headings must be one "#" title followed by ${expected.map(heading => `"${heading}"`).join(', ')}; got ${outline.map(heading => `"${heading}"`).join(', ') || 'none'}`)
  }
  return violations
}

/**
 * Report upgrade-guide tree violations.
 * @param root - Repository root containing the guide root.
 * @param options - Parsed CLI options (guide root, per-file language contract).
 * @param parser - Loaded Markdown/YAML parser functions.
 * @returns Diagnostics prefixed by the repository-relative file path; empty when the tree is absent.
 */
export function collectUpgradeGuideViolations(root, options, parser) {
  const guideRoot = options.guideRoot
  const directory = join(root, guideRoot)
  if (!existsSync(directory)) return []
  const pattern = guidePathPattern()
  const violations = []
  const files = readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => !entry.isDirectory())
    .map(entry => join(entry.parentPath, entry.name).slice(directory.length + 1).replaceAll('\\', '/'))
    .sort()
  for (const file of files) {
    const path = `${guideRoot}/${file}`
    const name = pattern.exec(file)?.[1]
    if (name === undefined) {
      violations.push(`${path}: only v<semver>/<kebab-case-item>/guide.{md,zh.md,i18n.yaml} files belong in ${guideRoot}`)
      continue
    }
    const language = options.languages[name]
    if (language === undefined) continue
    for (const violation of guideViolations(readFileSync(join(directory, file), 'utf8'), { ...language, parseMarkdown: parser.parseMarkdown }, parser.loadYaml)) {
      violations.push(`${path}: ${violation}`)
    }
  }
  return violations
}

async function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
    usage()
    process.exit(2)
  }
  const root = resolve(options.root)
  if (!existsSync(root)) {
    console.error(`${COMMAND}: --root does not exist: ${root}`)
    process.exit(2)
  }
  if (options.printConfig) {
    console.log(JSON.stringify({ guideRoot: options.guideRoot, languages: options.languages }, null, 2))
    return
  }
  let parser
  try {
    const [{ load, JSON_SCHEMA }, { parseMarkdown }] = await Promise.all([
      import('js-yaml'),
      import('./markdown.mjs'),
    ])
    parser = {
      parseMarkdown,
      loadYaml: (source) => load(source, { schema: JSON_SCHEMA }),
    }
  } catch (error) {
    const { exitOnLoadFailure } = await import('./dependencies.mjs')
    exitOnLoadFailure(COMMAND, error)
  }
  const violations = collectUpgradeGuideViolations(root, options, parser)
  if (violations.length > 0) {
    process.stderr.write(`${COMMAND}: violations found:\n`)
    for (const violation of violations) process.stderr.write(`  ${violation}\n`)
    process.exit(1)
  }
  if (!existsSync(join(root, options.guideRoot))) {
    // The source verifier's documented blind spot: an absent tree is a pass. Say so instead of implying coverage.
    process.stdout.write(`${COMMAND}: ${options.guideRoot} is absent; nothing to check (the source gate's documented blind spot — add a required-file check if absence must fail).\n`)
    return
  }
  process.stdout.write(`${COMMAND}: upgrade guides conform.\n`)
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  await main()
}
