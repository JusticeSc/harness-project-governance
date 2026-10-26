#!/usr/bin/env node
// Enforce complete English/Chinese pairs, matching structure, and recorded per-section hashes.
// Adapted from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317
// scripts/verify-translation-pairing.ts. License: ../../SOURCE-LICENSE.txt.
//
// Usage (all forms need a corpus config; see references/upgrade-guides.md §9.5):
//   node tools/doc-gates/verify-translation-pairing.mjs [--root <dir>] [--config <path>] [pairs...]
//   node tools/doc-gates/verify-translation-pairing.mjs --list
//   node tools/doc-gates/verify-translation-pairing.mjs --write <pairs...> | --write --all
//   node tools/doc-gates/verify-translation-pairing.mjs --cached <pairs...>
//
// Exit codes: 0 consistent (or records written), 1 violations, 2 unusable invocation/config/prerequisite.
//
// Adaptations from the source verifier, each explicit:
// - The corpus is declared by a target config file (default `.doc-gates/translation-pairing.json`) instead
//   of the source's hardcoded product directories. A missing/empty config is exit 2, never a silent pass.
// - The repository root defaults to the current working directory instead of the source script's parent.
// - `--cached` still reads the Git index of that root; it needs a Git work tree, as in the source.
// Everything else — three-file pairs, half-deletion anchors, canonical-form check, switcher rules, link
// locale, generated-region equality, structural signature, scoped --write — is the source semantics.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const COMMAND = 'verify-translation-pairing'
const DEFAULT_CONFIG = '.doc-gates/translation-pairing.json'
const SCOPE_EXTENSIONS = ['.md', '.i18n.yaml']

function fatal(message) {
  console.error(`${COMMAND}: ${message}`)
  process.exit(2)
}

/** Walk one declared corpus root, returning repository-relative Markdown and sidecar paths. */
function walkRoot(root, declaredRoot) {
  const directory = join(root, declaredRoot)
  if (!existsSync(directory)) {
    fatal(`declared corpus root does not exist: ${declaredRoot} (fix the config or remove the root; an absent root is not a pass)`)
  }
  if (!statSync(directory).isDirectory()) {
    fatal(`declared corpus root is not a directory: ${declaredRoot} (declare single files under "files")`)
  }
  const prefix = declaredRoot === '.' ? '' : `${declaredRoot}/`
  const files = []
  for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isDirectory()) continue
    if (!SCOPE_EXTENSIONS.some(extension => entry.name.endsWith(extension))) continue
    const relative = join(entry.parentPath, entry.name).slice(directory.length + 1).replaceAll('\\', '/')
    files.push(`${prefix}${relative}`)
  }
  return files
}

async function main() {
  let modules
  try {
    const [pairing, record, git, links] = await Promise.all([
      import('./translation-pairing.mjs'),
      import('./translation-pairing-record.mjs'),
      import('./translation-pairing-git.mjs'),
      import('./translation-links.mjs'),
    ])
    modules = { ...pairing, ...record, ...git, ...links }
  } catch (error) {
    const { exitOnLoadFailure } = await import('./dependencies.mjs')
    exitOnLoadFailure(COMMAND, error)
  }
  const {
    computeTranslationPairingRecord,
    hasLanguageSwitcher,
    isTranslationPairingManifestExcluded,
    isTranslationScopeFile,
    languageSwitcherTargets,
    normalizeTranslationMarkdownLinks,
    parseTranslationMarkdown,
    parseTranslationPairingCliArgs,
    parseTranslationPairingManifest,
    parseTranslationPairingRecord,
    renderTranslationPairingRecord,
    requiresSourceLanguageSwitcher,
    translationLinkLocaleViolations,
    translationPairPaths,
    translationPairSourcePredicate,
    translationPairingRecordDiff,
    translationStructureDiff,
    translationStructureSignature,
    generatedRegions,
  } = modules

  let request
  try {
    request = parseTranslationPairingCliArgs(process.argv.slice(2))
  } catch (error) {
    fatal(error instanceof Error ? error.message : String(error))
  }
  const root = resolve(request.repo ?? process.cwd())
  if (!existsSync(root)) fatal(`--repo does not exist: ${root}`)
  const listMode = request.mode === 'list'
  const writeMode = request.mode === 'write'
  const indexMode = request.input === 'index'
  let indexFiles
  try {
    indexFiles = indexMode ? modules.gitIndexPaths(root) : undefined
  } catch (error) {
    fatal(`--cached needs a readable Git index: ${error instanceof Error ? error.message : String(error)}`)
  }

  const contentCache = new Map()

  /** Read one repository path from the selected worktree or index plane. */
  function readRepositoryFile(file) {
    if (contentCache.has(file)) return contentCache.get(file)
    const content = indexMode
      ? indexFiles?.has(file) ? modules.readGitIndexBlob(root, file) : undefined
      : existsSync(join(root, file)) && statSync(join(root, file)).isFile()
        ? readFileSync(join(root, file))
        : undefined
    contentCache.set(file, content)
    return content
  }

  /** Whether one path exists in the selected content plane. */
  function repositoryFileExists(file) {
    return indexMode ? indexFiles?.has(file) === true : readRepositoryFile(file) !== undefined
  }

  const configPath = request.config ?? DEFAULT_CONFIG
  const configContent = readRepositoryFile(configPath)
  if (configContent === undefined) {
    fatal(`${configPath} is missing from ${root}: declare the paired-document corpus ({"roots": [...], "files": [...]}); `
      + 'the source repository\'s corpus paths are product facts, so they are not defaulted here')
  }
  let manifest
  try {
    manifest = parseTranslationPairingManifest(configContent.toString('utf8'))
  } catch (error) {
    fatal(error instanceof Error ? error.message : String(error))
  }
  const isTranslationPairSource = translationPairSourcePredicate(manifest)

  /**
   * An excluded entry ending in `/` excludes the whole directory. The trailing slash IS the path boundary.
   */
  function isExcluded(file) {
    return isTranslationPairingManifestExcluded(file, manifest)
  }

  const recordContext = { repoRoot: root, isTranslationPairSource, repositoryFileExists }

  // Enumerate the scope once: the whole corpus, or exactly the named pairs' three files (a named pair whose
  // files are absent is caught by the same completeness rules that cover discovered remnants).
  const files = new Set()
  if (request.scope === 'pairs') {
    for (const anchor of request.anchors) {
      const { source, zh, meta } = translationPairPaths(anchor)
      for (const file of [source, zh, meta]) {
        if (repositoryFileExists(file)) files.add(file)
      }
      // A named worktree anchor with no files still enters the source list so an interactive check reports
      // it. An index check accepts a complete three-file deletion and still rejects every partial deletion.
      if (!indexMode && !repositoryFileExists(anchor)) files.add(anchor)
    }
  } else {
    const discovered = new Set()
    for (const declaredRoot of manifest.roots) {
      for (const file of walkRoot(root, declaredRoot)) discovered.add(file)
    }
    for (const file of manifest.files) discovered.add(file)
    for (const file of discovered) {
      if (isTranslationScopeFile(file, manifest)) files.add(file)
    }
  }
  const translations = [...files].filter(f => f.endsWith('.zh.md')).sort()
  const metas = [...files].filter(f => f.endsWith('.i18n.yaml')).sort()
  const sources = [...files].filter(f => f.endsWith('.md') && !f.endsWith('.zh.md')).sort()

  if (request.scope === 'pairs') {
    const rejected = request.anchors.filter(anchor => !isTranslationScopeFile(anchor, manifest) || isExcluded(anchor))
    const absent = request.anchors.filter((anchor) => {
      const { source, zh, meta } = translationPairPaths(anchor)
      return ![source, zh, meta].some(repositoryFileExists)
    })
    if (rejected.length > 0 || (!indexMode && absent.length > 0)) {
      for (const anchor of rejected) {
        console.error(`${COMMAND}: ${anchor} is not an in-scope pair (excluded or outside the declared corpus; see the translation-pairing reference)`)
      }
      for (const anchor of absent) {
        console.error(`${COMMAND}: ${anchor} names no pair on disk (none of its three files exist)`)
      }
      process.exit(2)
    }
  }

  // --write: (re)record the section hashes for the requested complete pairs, creating missing records. A
  // named pair that cannot be recorded (missing counterpart) fails loud; corpus scope (--all) skips
  // pairless sources as before.
  if (writeMode) {
    let written = 0
    for (const source of sources) {
      if (isExcluded(source)) continue
      const paths = translationPairPaths(source)
      const { zh, meta } = paths
      if (!repositoryFileExists(source) || !repositoryFileExists(zh)) {
        if (request.scope === 'pairs') {
          console.error(`${COMMAND}: cannot record ${source}: missing ${repositoryFileExists(source) ? zh : source}`)
          process.exit(2)
        }
        continue
      }
      const sourceContent = readRepositoryFile(source)
      const zhContent = readRepositoryFile(zh)
      if (sourceContent === undefined || zhContent === undefined) throw new Error(`${source}: complete pair became unreadable`)
      let record
      try {
        record = renderTranslationPairingRecord(paths, computeTranslationPairingRecord(
          paths,
          sourceContent.toString('utf8'),
          zhContent.toString('utf8'),
          recordContext,
        ))
      } catch (error) {
        console.error(`${COMMAND}: cannot record ${source}: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(2)
      }
      if (existsSync(join(root, meta)) && readFileSync(join(root, meta), 'utf8') === record) continue
      writeFileSync(join(root, meta), record)
      console.log(`${COMMAND}: recorded ${meta}`)
      written++
    }
    console.log(`${COMMAND}: ${written} record(s) written; run the check to validate the pairs.`)
    return
  }

  const errors = []
  const state = new Map()

  // 1. Every discovered, non-excluded source merges bilingual.
  for (const source of sources) {
    if (isExcluded(source)) continue
    const { zh } = translationPairPaths(source)
    if (!repositoryFileExists(zh)) {
      errors.push(`${source}: in-scope documentation must merge bilingual; add the counterpart and record the pair`)
      state.set(source, 'missing')
    }
  }

  // 2. Every pair that exists at all is complete and consistent. Anchor on the union of .zh.md files and
  // .i18n.yaml records so a half-deleted pair is caught from either remnant.
  const pairAnchors = new Set()
  for (const zh of translations) pairAnchors.add(zh.replace(/\.zh\.md$/, '.md'))
  for (const meta of metas) pairAnchors.add(meta.replace(/\.i18n\.yaml$/, '.md'))

  for (const source of [...pairAnchors].sort()) {
    const paths = translationPairPaths(source)
    const { zh, meta } = paths
    const have = {
      source: repositoryFileExists(source),
      zh: repositoryFileExists(zh),
      meta: repositoryFileExists(meta),
    }

    if (isExcluded(source)) {
      if (have.zh) errors.push(`${zh}: ${source} is excluded from pairing (generated or bilingual-by-construction); this translation must not exist`)
      if (have.meta) errors.push(`${meta}: ${source} is excluded from pairing; this consistency record must not exist`)
      continue
    }
    const missing = Object.entries(have).filter(([, ok]) => !ok).map(([k]) => (k === 'source' ? source : k === 'zh' ? zh : meta))
    if (missing.length > 0) {
      errors.push(`${source}: incomplete pair — missing ${missing.join(', ')} (pairs merge whole: both languages plus the .i18n.yaml record)`)
      continue
    }

    const sourceContent = readRepositoryFile(source)
    const zhContent = readRepositoryFile(zh)
    const metaContent = readRepositoryFile(meta)
    if (sourceContent === undefined || zhContent === undefined || metaContent === undefined) {
      throw new Error(`${source}: complete pair became unreadable`)
    }
    const record = parseTranslationPairingRecord(metaContent.toString('utf8'))
    if (record === undefined) {
      errors.push(`${meta}: malformed consistency record (expected \`/<section path>:\` entries, each followed by \`  en: <16-hex>\` and \`  zh: <16-hex>\`)`)
      state.set(source, 'out-of-sync')
      continue
    }

    const sourceText = sourceContent.toString('utf8')
    const zhText = zhContent.toString('utf8')
    let current
    let sourceTree
    let zhTree
    try {
      sourceTree = parseTranslationMarkdown(sourceText)
      zhTree = parseTranslationMarkdown(zhText)
      current = computeTranslationPairingRecord(paths, sourceText, zhText, recordContext, { en: sourceTree, zh: zhTree })
    } catch (error) {
      errors.push(`${source} ↔ ${zh}: ${error instanceof Error ? error.message : String(error)}`)
      state.set(source, 'out-of-sync')
      continue
    }
    const recordErrors = translationPairingRecordDiff(record, current).map(message => (
      `${meta}: out of sync — ${message} (bring the other side along, then re-record with --write)`
    ))
    if (recordErrors.length === 0 && renderTranslationPairingRecord(paths, current) !== metaContent.toString('utf8')) {
      recordErrors.push(`${meta}: not in canonical form (re-record with --write)`)
    }
    if (recordErrors.length > 0) {
      errors.push(...recordErrors)
      state.set(source, 'out-of-sync')
      continue
    }
    const sourceSwitcherTargets = languageSwitcherTargets(source, manifest)
    const zhSwitcherTargets = languageSwitcherTargets(zh, manifest)
    for (const violation of [
      ...translationLinkLocaleViolations(sourceText, {
        repoRoot: root,
        sourcePath: source,
        isTranslationPairSource,
        repositoryFileExists,
      }, zhSwitcherTargets, sourceTree),
      ...translationLinkLocaleViolations(zhText, {
        repoRoot: root,
        sourcePath: zh,
        isTranslationPairSource,
        repositoryFileExists,
      }, sourceSwitcherTargets, zhTree),
    ]) {
      errors.push(`${violation.sourcePath}:${violation.line}: link target ${JSON.stringify(violation.url)} uses the wrong locale; expected ${JSON.stringify(violation.expectedUrl)}`)
      state.set(source, 'out-of-sync')
    }

    // Generated regions must remain byte-identical after paired document paths are normalized to one
    // semantic target. The structural signature below compares their contents again as part of the whole
    // document; this named check rejects any prose, ordering, code, marker, or non-locale URL drift.
    let sourceRegions
    let zhRegions
    try {
      sourceRegions = generatedRegions(sourceText).map(region => region.text)
      zhRegions = generatedRegions(zhText).map(region => region.text)
    } catch (error) {
      errors.push(`${source} ↔ ${zh}: ${error instanceof Error ? error.message : String(error)}`)
      state.set(source, 'out-of-sync')
      continue
    }
    const normalizedSourceRegions = sourceRegions.map(region => normalizeTranslationMarkdownLinks(region, {
      repoRoot: root,
      sourcePath: source,
      isTranslationPairSource,
      repositoryFileExists,
    }))
    const normalizedZhRegions = zhRegions.map(region => normalizeTranslationMarkdownLinks(region, {
      repoRoot: root,
      sourcePath: zh,
      isTranslationPairSource,
      repositoryFileExists,
    }))
    if (normalizedSourceRegions.length !== normalizedZhRegions.length
      || normalizedSourceRegions.some((region, index) => region !== normalizedZhRegions[index])) {
      errors.push(`${source} ↔ ${zh}: generated regions differ beyond paired-document locale paths — regenerate both sides`)
      state.set(source, 'out-of-sync')
    }

    if (!hasLanguageSwitcher(zhTree, zhText, sourceSwitcherTargets)) {
      errors.push(`${zh}: missing language switcher — no link to ${basename(source)}`)
    }
    if (requiresSourceLanguageSwitcher(source, manifest) && !hasLanguageSwitcher(sourceTree, sourceText, zhSwitcherTargets)) {
      errors.push(`${source}: missing language switcher — no link back to ${basename(zh)}`)
    }
    for (const divergence of translationStructureDiff(
      translationStructureSignature(sourceTree, zhSwitcherTargets, {
        repoRoot: root,
        sourcePath: source,
        isTranslationPairSource,
        repositoryFileExists,
        markdown: sourceText,
      }),
      translationStructureSignature(zhTree, sourceSwitcherTargets, {
        repoRoot: root,
        sourcePath: zh,
        isTranslationPairSource,
        repositoryFileExists,
        markdown: zhText,
      }),
    )) {
      errors.push(`${source} ↔ ${zh}: ${divergence}`)
    }
    if (!state.has(source)) state.set(source, 'ok')
  }

  // Complete the state map for --list: any in-scope, non-excluded document with no pair is missing.
  for (const source of sources) {
    if (!isExcluded(source) && !state.has(source)) state.set(source, 'missing')
  }

  if (listMode) {
    const order = { 'out-of-sync': 0, missing: 1, ok: 2 }
    const rows = [...state.entries()].sort((a, b) => order[a[1]] - order[b[1]] || a[0].localeCompare(b[0]))
    for (const [file, status] of rows) {
      console.log(`${status.padEnd(11)} ${file}${status === 'missing' ? '  (required)' : ''}`)
    }
    const counts = { 'ok': 0, 'out-of-sync': 0, 'missing': 0 }
    for (const status of state.values()) counts[status]++
    console.log(`${COMMAND}: ${counts.ok} ok, ${counts['out-of-sync']} out-of-sync, ${counts.missing} missing (of ${state.size} in scope)`)
    return
  }

  if (errors.length === 0) {
    console.log(request.scope === 'pairs'
      ? `${COMMAND}: ${pairAnchors.size} named ${indexMode ? 'staged ' : ''}pair(s) consistent; the corpus-wide check still runs separately.`
      : `${COMMAND}: ${pairAnchors.size} pair(s) checked across the declared corpus, all consistent.`)
    return
  }

  console.error(`${COMMAND}: bilingual pairing rules violated (see the translation-pairing reference):`)
  for (const message of errors) console.error(`  ${message}`)
  process.exit(1)
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  await main()
}
