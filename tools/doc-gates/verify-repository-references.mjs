#!/usr/bin/env node
// Repository-reference policy adapted from DeepSeek Harness 687f282e
// scripts/verify-repository-references.ts, scripts/verify-public-repository-links.ts and
// scripts/verify-concrete-terms.ts. License: ../../SOURCE-LICENSE.txt.
//
// Target adaptations, all deliberate:
// - The maintained corpus is declared explicitly (roots/files/excludePrefixes) instead of the source's
//   whole-tree `git ls-files` walk, so an adopting repository chooses the scope in a reviewed file.
// - The Git object database is REQUIRED. Commit detection depends on resolving a hexadecimal prefix to
//   exactly one object of type `commit`; without a database the rule cannot be evaluated and the gate
//   refuses to run rather than reporting a pass.
// - The three source gates (commit identifiers, disallowed organization URLs, blocked terms) are one
//   executor with three separately declared rule sets. Each set may be empty only by explicit
//   declaration; a missing field is an unusable configuration, not a policy choice.
// - Per-rule exclusions and marker regions are explicit target policy, not inferred source inventory.
//   Source-specific tracked/untracked discovery and historical path-pattern parity remain open.
//   NUL-bearing files are skipped only by the URL rule, not commit or term rules.
//
// Usage: node <skill>/tools/doc-gates/verify-repository-references.mjs [--root <dir>] [--config <relative-json>] [--list]
// Exit 0: no prohibited reference; 1: violations; 2: unusable invocation, configuration or git database.
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'

const COMMAND = 'verify-repository-references'
const CONFIG_KEYS = ['gitRoot', 'roots', 'files', 'excludePrefixes', 'commitIdentifiers', 'forbiddenUrls', 'allowedUrlLiterals', 'bannedTerms', 'ruleExclusions', 'generatedRegions', 'gitDiscovery']
const RULES = ['commit', 'url', 'term']
const GIT_OUTPUT_LIMIT = 256 * 1024 * 1024
const COMMIT_CANDIDATE = /(?<![a-z0-9])[\da-f]{7,40}(?![a-z0-9])/gi
const NAMED_REFERENCE_CHARACTERS = { hyphen: '-', num: '#', period: '.', colon: ':', sol: '/' }

/** Reject escaped or compatibility forms so a hidden URL cannot pass the literal check. */
function canonicalReferenceText(source) {
  return source
    .normalize('NFKC')
    .replaceAll('\\/', '/')
    .replace(/\\(?:u([\da-f]{4})|x([\da-f]{2}))/gi, (_match, unicode, byte) =>
      String.fromCodePoint(Number.parseInt(unicode ?? byte ?? '', 16)))
    .replace(/%([\da-f]{2})/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(?:(\d+)|x([\da-f]+));/gi, (entity, decimal, hexadecimal) => {
      const code = Number.parseInt(decimal ?? hexadecimal ?? '', decimal === undefined ? 16 : 10)
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    })
    .replace(/&(hyphen|num|period|colon|sol);/gi, (entity, name) => NAMED_REFERENCE_CHARACTERS[name.toLowerCase()] ?? entity)
    .normalize('NFKC')
    .toLowerCase()
}

function repositoryPath(value) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value) || /^[A-Za-z]:/.test(value)) {
    throw new Error('declared paths must be non-empty repository-relative paths')
  }
  const path = value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '')
  if (path === '' || path.split('/').some(segment => segment === '..' || segment === '' || /[*?\[\]{}]/.test(segment))) {
    throw new Error(`declare literal paths, not globs or parent paths: ${value}`)
  }
  return path
}

function stringList(value, field) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`${field} must be an array of non-empty strings`)
  }
  return value
}

function readConfig(config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) throw new Error('config must be an object')
  for (const key of Object.keys(config)) {
    if (!CONFIG_KEYS.includes(key)) throw new Error(`unknown config field: ${key}`)
  }
  for (const key of ['gitRoot', 'roots', 'files', 'commitIdentifiers', 'forbiddenUrls', 'bannedTerms']) {
    if (!(key in config)) throw new Error(`config must declare ${key}; an omitted rule is not a disabled rule`)
  }
  if (typeof config.gitRoot !== 'string' || config.gitRoot.length === 0) throw new Error('gitRoot must be a non-empty path')
  if (typeof config.commitIdentifiers !== 'boolean') throw new Error('commitIdentifiers must be true or false')
  const roots = stringList(config.roots, 'roots').map(repositoryPath)
  const files = stringList(config.files, 'files').map(repositoryPath)
  if (roots.length + files.length === 0) throw new Error('declare at least one root or file; an empty corpus is not a pass')
  const excludePrefixes = config.excludePrefixes === undefined ? [] : stringList(config.excludePrefixes, 'excludePrefixes').map(repositoryPath)
  const forbiddenUrls = stringList(config.forbiddenUrls, 'forbiddenUrls')
    .map(value => canonicalReferenceText(value))
  const allowedUrlLiterals = config.allowedUrlLiterals === undefined
    ? []
    : stringList(config.allowedUrlLiterals, 'allowedUrlLiterals').map(value => {
      const literal = canonicalReferenceText(value)
      const escaped = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`\\b${escaped}(?:\\.git)?(?=/|[^a-z0-9_.-]|$)`, 'g')
    })
  const bannedTerms = stringList(config.bannedTerms, 'bannedTerms').map(value => value.normalize('NFKC').toLowerCase())
  const ruleExclusions = config.ruleExclusions === undefined ? [] : ruleExclusionList(config.ruleExclusions, forbiddenUrls)
  const generatedRegions = config.generatedRegions === undefined ? [] : generatedRegionList(config.generatedRegions)
  const gitDiscovery = config.gitDiscovery === undefined ? undefined : readGitDiscovery(config.gitDiscovery, forbiddenUrls)
  return { gitRoot: config.gitRoot, roots, files, excludePrefixes, commitIdentifiers: config.commitIdentifiers, forbiddenUrls, allowedUrlLiterals, bannedTerms, ruleExclusions, generatedRegions, gitDiscovery }
}

/** Validate each rule's Git corpus; URL rules also declare their distinct binary boundary. */
function readGitDiscovery(value, forbiddenUrls) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('gitDiscovery must be an object')
  const fields = ['commitIdentifiers', 'forbiddenUrls', 'bannedTerms', 'requiredAreas']
  for (const key of Object.keys(value)) {
    if (!fields.includes(key)) throw new Error(`gitDiscovery: unknown field ${key}`)
  }
  const mode = (input, field) => {
    if (!['tracked', 'tracked-and-untracked'].includes(input)) throw new Error(`gitDiscovery.${field} must be tracked or tracked-and-untracked`)
    return input
  }
  const commits = mode(value.commitIdentifiers, 'commitIdentifiers')
  const terms = mode(value.bannedTerms, 'bannedTerms')
  if (value.forbiddenUrls === null || typeof value.forbiddenUrls !== 'object' || Array.isArray(value.forbiddenUrls)) {
    throw new Error('gitDiscovery.forbiddenUrls must declare every forbidden URL')
  }
  const urls = new Map()
  for (const [literal, entry] of Object.entries(value.forbiddenUrls)) {
    const url = canonicalReferenceText(literal)
    if (!forbiddenUrls.includes(url) || urls.has(url)) throw new Error(`gitDiscovery.forbiddenUrls has an unknown or duplicate URL: ${literal}`)
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)
      || Object.keys(entry).some(key => !['files', 'skipNul'].includes(key)) || typeof entry.skipNul !== 'boolean') {
      throw new Error(`gitDiscovery.forbiddenUrls[${literal}] must declare files and boolean skipNul`)
    }
    urls.set(url, { files: mode(entry.files, `forbiddenUrls[${literal}].files`), skipNul: entry.skipNul })
  }
  if (new Set(forbiddenUrls).size !== urls.size) throw new Error('gitDiscovery.forbiddenUrls must declare every forbidden URL')
  const requiredAreas = value.requiredAreas === undefined ? [] : stringList(value.requiredAreas, 'gitDiscovery.requiredAreas').map(value => {
    const normalized = value.replaceAll('\\', '/')
    const area = repositoryPath(normalized)
    if (area === '.') throw new Error('gitDiscovery.requiredAreas must name an exact file or a directory ending in /, not the root')
    return normalized.endsWith('/') ? `${area}/` : area
  })
  if (new Set(requiredAreas).size !== requiredAreas.length) throw new Error('gitDiscovery.requiredAreas must not repeat an area')
  return { commits, terms, urls, requiredAreas }
}

/** Per-rule exclusions let one rule stay enforced where another waives a path, as the source rules do. */
function ruleExclusionList(value, forbiddenUrls) {
  if (!Array.isArray(value)) throw new Error('ruleExclusions must be an array')
  return value.map((entry, index) => {
    const where = `ruleExclusions[${index}]`
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${where} must be an object`)
    for (const key of Object.keys(entry)) {
      if (!['rule', 'pathPrefixes', 'files', 'pathPatterns', 'urlLiteral'].includes(key)) throw new Error(`${where}: unknown field ${key}`)
    }
    if (!RULES.includes(entry.rule)) throw new Error(`${where}.rule must be one of ${RULES.join(', ')}`)
    let urlLiteral
    if (entry.urlLiteral !== undefined) {
      if (entry.rule !== 'url' || typeof entry.urlLiteral !== 'string') throw new Error(`${where}.urlLiteral requires rule url and a declared URL string`)
      urlLiteral = canonicalReferenceText(entry.urlLiteral)
      if (!forbiddenUrls.includes(urlLiteral)) throw new Error(`${where}.urlLiteral must identify a declared forbidden URL`)
    }
    const pathPrefixes = entry.pathPrefixes === undefined
      ? []
      : stringList(entry.pathPrefixes, `${where}.pathPrefixes`).map(repositoryPath)
    const files = entry.files === undefined ? [] : stringList(entry.files, `${where}.files`).map(repositoryPath)
    const pathPatterns = entry.pathPatterns === undefined ? [] : stringList(entry.pathPatterns, `${where}.pathPatterns`).map(pattern => new RegExp(pattern, 'u'))
    if (pathPrefixes.length + files.length + pathPatterns.length === 0) throw new Error(`${where} must declare pathPrefixes, files or pathPatterns`)
    return { rule: entry.rule, pathPrefixes, files, pathPatterns, urlLiteral }
  })
}

/**
 * Declare marker-delimited regions where one rule does not apply, e.g. checked generated schema text.
 * Malformed markers grant no exemption, so a broken generator fails toward enforcement.
 */
function generatedRegionList(value) {
  if (!Array.isArray(value)) throw new Error('generatedRegions must be an array')
  return value.map((entry, index) => {
    const where = `generatedRegions[${index}]`
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${where} must be an object`)
    for (const key of Object.keys(entry)) {
      if (!['rule', 'pathPattern', 'startMarker', 'endMarker'].includes(key)) throw new Error(`${where}: unknown field ${key}`)
    }
    if (!RULES.includes(entry.rule)) throw new Error(`${where}.rule must be one of ${RULES.join(', ')}`)
    for (const key of ['pathPattern', 'startMarker', 'endMarker']) {
      if (typeof entry[key] !== 'string' || entry[key].length === 0) throw new Error(`${where}.${key} must be a non-empty string`)
    }
    const markerName = /^<!-- ([a-zA-Z0-9_-]+):start -->$/u.exec(entry.startMarker)?.[1]
    const markerFamily = markerName !== undefined && entry.endMarker === `<!-- ${markerName}:end -->`
      ? new RegExp(`<!--\\s*${markerName}\\b`, 'giu')
      : undefined
    try {
      return { rule: entry.rule, pathPattern: new RegExp(entry.pathPattern, 'u'), startMarker: entry.startMarker, endMarker: entry.endMarker, markerFamily }
    } catch (error) {
      throw new Error(`${where}.pathPattern is not a valid regular expression: ${error.message}`)
    }
  })
}

function discovery(root, policy, gitFiles) {
  const excluded = file => policy.excludePrefixes.some(prefix => file === prefix || file.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))
  const seen = new Set()
  const found = []
  function add(file) {
    if (excluded(file)) return
    const absolute = resolve(root, file)
    const stat = lstatSync(absolute)
    if (!stat.isFile() && !stat.isSymbolicLink()) throw new Error(`declared source is not a file: ${file}`)
    if (seen.has(absolute)) return
    seen.add(absolute)
    found.push({ file, absolute })
  }
  function walk(directory, prefix) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.git') continue
      const file = prefix ? `${prefix}/${entry.name}` : entry.name
      if (excluded(file)) continue
      if (entry.isDirectory()) walk(join(directory, entry.name), file)
      else if (entry.isFile() || entry.isSymbolicLink()) add(file)
    }
  }
  for (const file of policy.files) {
    const absolute = resolve(root, file)
    if (!existsSync(absolute)) throw new Error(`declared file does not exist: ${file}`)
    if (gitFiles === undefined || gitFiles.all.has(file)) add(file)
  }
  for (const directory of policy.roots) {
    const absolute = resolve(root, directory)
    if (!existsSync(absolute) || !lstatSync(absolute).isDirectory()) throw new Error(`declared root is not a directory: ${directory}`)
    if (gitFiles === undefined) walk(absolute, directory === '.' ? '' : directory)
  }
  if (gitFiles !== undefined) {
    for (const file of gitFiles.all) {
      if (!policy.files.includes(file) && !policy.roots.some(directory => directory === '.' || file.startsWith(`${directory}/`))) continue
      const stat = lstatSync(resolve(root, file), { throwIfNoEntry: false })
      if (stat?.isFile() || stat?.isSymbolicLink()) add(file)
    }
  }
  if (found.length === 0) throw new Error('declared corpus contains no maintained files')
  const sources = []
  for (const entry of found) {
    const stat = lstatSync(entry.absolute)
    const source = stat.isSymbolicLink() ? readlinkSync(entry.absolute) : readFileSync(entry.absolute, 'utf8')
    sources.push({ file: entry.file, source })
  }
  return sources
}

function gitLines(gitRoot, args, maxBuffer, input) {
  return execFileSync('git', ['-C', gitRoot, ...args], {
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1' },
    encoding: 'utf8',
    input,
    maxBuffer,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trimEnd().split('\n').filter(line => line !== '')
}

/** Find the one object whose name starts with `prefix`, or undefined when none or several match. */
function uniquePrefixMatch(objects, prefix) {
  let low = 0
  let high = objects.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if ((objects[middle] ?? prefix) < prefix) low = middle + 1
    else high = middle
  }
  const match = objects[low]
  if (match?.startsWith(prefix) !== true || objects[low + 1]?.startsWith(prefix) === true) return undefined
  return match
}

/** Resolve hexadecimal candidates against the local object database; only unique commit objects count. */
function resolveCommits(gitRoot, sources) {
  const candidates = [...new Set(sources.flatMap(({ source }) =>
    [...source.matchAll(COMMIT_CANDIDATE)].map(match => match[0].toLowerCase())))]
  if (candidates.length === 0) return new Set()
  const objects = gitLines(gitRoot, ['cat-file', '--batch-all-objects', '--batch-check=%(objectname)'], GIT_OUTPUT_LIMIT).sort()
  const matches = new Map()
  for (const candidate of candidates) {
    const object = uniquePrefixMatch(objects, candidate)
    if (object !== undefined) matches.set(candidate, object)
  }
  if (matches.size === 0) return new Set()
  const names = [...new Set(matches.values())]
  const commits = new Set(gitLines(gitRoot, ['cat-file', '--batch-check=%(objectname) %(objecttype)'], GIT_OUTPUT_LIMIT, `${names.join('\n')}\n`)
    .map(line => line.split(' '))
    .filter(([, type]) => type === 'commit')
    .map(([object]) => object))
  return new Set([...matches].filter(([, object]) => commits.has(object)).map(([candidate]) => candidate))
}

function scan(root, policy) {
  const gitRoot = resolve(root, policy.gitRoot)
  let toplevel
  try {
    toplevel = execFileSync('git', ['-C', gitRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd()
  } catch {
    throw new Error(`gitRoot is not a readable Git repository: ${policy.gitRoot}; commit detection cannot be skipped`)
  }
  if (realpathSync(toplevel) !== realpathSync(gitRoot)) {
    throw new Error(`gitRoot must be the repository root that owns the object database, not a subdirectory: ${policy.gitRoot}`)
  }
  let gitFiles
  if (policy.gitDiscovery !== undefined) {
    if (realpathSync(root) !== realpathSync(gitRoot)) throw new Error('gitDiscovery requires --root and gitRoot to name the same repository root')
    const list = args => new Set(execFileSync('git', ['-C', gitRoot, 'ls-files', ...args, '-z'], {
      encoding: 'utf8', maxBuffer: GIT_OUTPUT_LIMIT, stdio: ['ignore', 'pipe', 'pipe'],
    }).split('\0').filter(file => file !== ''))
    gitFiles = { tracked: list(['--cached']), all: list(['--cached', '--others', '--exclude-standard']) }
    for (const area of policy.gitDiscovery.requiredAreas) {
      const satisfied = area.endsWith('/')
        ? gitFiles.tracked.values().some(file => file.startsWith(area))
        : gitFiles.tracked.has(area)
      if (!satisfied) throw new Error(`gitDiscovery tracked-file discovery omitted a required repository area: ${area}`)
    }
  }
  const sources = discovery(root, policy, gitFiles)
  const selected = (mode, file) => gitFiles === undefined || (mode === 'tracked' ? gitFiles.tracked : gitFiles.all).has(file)
  const commits = policy.commitIdentifiers ? resolveCommits(gitRoot, sources) : new Set()
  const waived = (rule, file, urlLiteral) => policy.ruleExclusions.some(entry => entry.rule === rule
    && (entry.urlLiteral === undefined || entry.urlLiteral === urlLiteral)
    && (entry.files.includes(file)
      || entry.pathPrefixes.some(prefix => file === prefix || file.startsWith(`${prefix}/`))
      || entry.pathPatterns.some(pattern => pattern.test(file))))
  const findings = []
  for (const { file, source } of sources) {
    const lines = source.split(/\r?\n/u)
    const termWaived = waived('term', file) || !selected(policy.gitDiscovery?.terms, file)
    const urlWaived = waived('url', file)
    const commitWaived = waived('commit', file) || !selected(policy.gitDiscovery?.commits, file)
    const canonicalPath = canonicalReferenceText(file)
    if (!termWaived) {
      for (const term of policy.bannedTerms) {
        if (canonicalPath.includes(term)) findings.push({ file, line: null, kind: 'banned-term', detail: term })
      }
    }
    const regions = policy.generatedRegions
      .filter(region => region.pathPattern.test(file))
      .flatMap(region => {
        // Count occurrences, not only exact marker lines: inline and malformed nested markers
        // in the same family invalidate the exemption just as in historicalSchemaRegion.
        if (source.split(region.startMarker).length !== 2 || source.split(region.endMarker).length !== 2) return []
        if (region.markerFamily !== undefined && [...source.matchAll(region.markerFamily)].length !== 2) return []
        const start = lines.indexOf(region.startMarker)
        const end = lines.indexOf(region.endMarker)
        return start >= 0 && end > start ? [{ rule: region.rule, start: start + 1, end }] : []
      })
    for (const [index, line] of lines.entries()) {
      const canonical = canonicalReferenceText(line)
      if (!urlWaived && !regions.some(region => region.rule === 'url' && index >= region.start && index < region.end)) {
        let urlText = canonical
        for (const allowed of policy.allowedUrlLiterals) urlText = urlText.replace(allowed, '')
        for (const url of policy.forbiddenUrls) {
          const urlPolicy = policy.gitDiscovery?.urls.get(url)
          if (waived('url', file, url) || !selected(urlPolicy?.files, file) || (urlPolicy?.skipNul ?? true) && source.includes('\0')) continue
          if (urlText.includes(url)) findings.push({ file, line: index + 1, kind: 'organization-url', detail: url })
        }
      }
      if (!commitWaived && commits.size > 0 && !regions.some(region => region.rule === 'commit' && index >= region.start && index < region.end)) {
        for (const match of line.matchAll(COMMIT_CANDIDATE)) {
          if (commits.has(match[0].toLowerCase())) findings.push({ file, line: index + 1, kind: 'commit-hash', detail: match[0] })
        }
      }
      if (termWaived) continue
      if (regions.some(region => region.rule === 'term' && index >= region.start && index < region.end)) continue
      for (const term of policy.bannedTerms) {
        if (canonical.includes(term)) findings.push({ file, line: index + 1, kind: 'banned-term', detail: term })
      }
    }
  }
  const seen = new Set()
  return findings.filter(finding => {
    const key = `${finding.file}\0${finding.line}\0${finding.kind}\0${finding.detail}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/repository-references.json'
  let listOnly = false
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag === '--list') {
      listOnly = true
      continue
    }
    if (!['--root', '--config'].includes(flag)) throw new Error(`unknown argument: ${flag}`)
    const value = args[++index]
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
    if (flag === '--root') root = value
    else configPath = repositoryPath(value)
  }
  root = resolve(root)
  const absoluteConfig = resolve(root, configPath)
  if (!existsSync(absoluteConfig)) throw new Error(`configuration is required: ${configPath}`)
  const policy = readConfig(JSON.parse(readFileSync(absoluteConfig, 'utf8')))
  const findings = scan(root, policy)
  if (listOnly) {
    for (const finding of findings) {
      console.log(`${finding.kind}  ${finding.file}${finding.line === null ? '' : `:${String(finding.line)}`}  ${finding.detail}`)
    }
    console.log(`${COMMAND}: ${String(findings.length)} prohibited reference(s)`)
    return
  }
  if (findings.length === 0) {
    console.log(`${COMMAND}: declared corpus contains no commit identifiers, disallowed URLs or blocked terms.`)
    return
  }
  console.error(`${COMMAND} failed: use release tags, maintained repository links and concrete wording:`)
  for (const finding of findings) {
    console.error(`  ${finding.file}${finding.line === null ? '' : `:${String(finding.line)}`} ${finding.kind} (${finding.detail})`)
  }
  process.exitCode = 1
}

try {
  main()
} catch (error) {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
