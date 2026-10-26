#!/usr/bin/env node
// Package-group subsystem-page ownership gate adapted from DeepSeek Harness687f282e scripts/verify-subsystem-pages.ts.
// License: ../../SOURCE-LICENSE.txt. Target groups, page root and exemption policy are explicit configuration.
// Usage: node tools/doc-gates/verify-subsystem-pages.mjs [--root <dir>] [--config <relative-json>]
// Exit0: every group is linked or explicitly exempt; exit1: contract violations; exit2: unusable invocation,
// configuration or Markdown parser prerequisite.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, posix, resolve, sep } from 'node:path'
import { exitOnLoadFailure } from './dependencies.mjs'

const COMMAND = 'verify-subsystem-pages'
const DEFAULT_CONFIG = '.doc-gates/subsystem-pages.json'

let markdown
try {
  markdown = await import('./markdown.mjs')
} catch (error) {
  exitOnLoadFailure(COMMAND, error)
  throw error
}
const { parseMarkdown, visitMarkdown } = markdown

/** Normalize one filesystem path to repository slash form. */
function normalize(path) {
  return path.split(sep).join('/')
}

/** Read one JSON document, reporting a usable message instead of a stack trace. */
function loadJson(file, label) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (error) {
    console.error(`${COMMAND}: cannot read ${label} ${file}: ${error.message}`)
    process.exit(2)
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    console.error(`${COMMAND}: ${label} is not valid JSON: ${error.message}`)
    process.exit(2)
  }
}

/** CLI parsing: only the documented flags, with an explicit value. */
function parseArgs(argv) {
  const options = { root: '.', config: DEFAULT_CONFIG }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag !== '--root' && flag !== '--config') {
      console.error(`${COMMAND}: unknown argument ${flag}`)
      process.exit(2)
    }
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      console.error(`${COMMAND}: ${flag} requires a value`)
      process.exit(2)
    }
    options[flag.slice(2)] = value
    index += 1
  }
  return options
}

/** Direct child directories, sorted, without following symlinks. */
function childDirectories(directory) {
  let entries
  try {
    entries = readdirSync(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

/** Exact file test that rejects a directory carrying the expected name. */
function isFile(file) {
  try {
    return statSync(file).isFile()
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
    throw error
  }
}

/**
 * Normalize the configuration. Every value is required to be explicit so a target project never inherits a
 * source-specific path silently.
 * @param raw - parsed configuration object.
 * @returns normalized `{ packagesRoot, docsRoot, pageRoot, groupReadme, manifest, exemptions, pageSuffix }`.
 */
export function subsystemPageConfig(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('configuration must be a JSON object')
  }
  const string = (key, fallback) => {
    const value = raw[key] ?? fallback
    if (typeof value !== 'string' || value.trim() === '') throw new Error(`configuration.${key} must be a non-empty string`)
    return value.replace(/\\/g, '/').replace(/\/+$/, '')
  }
  const exemptions = raw.exemptions ?? {}
  if (exemptions === null || typeof exemptions !== 'object' || Array.isArray(exemptions)) {
    throw new Error('configuration.exemptions must be an object mapping group to justification')
  }
  const docsRoot = string('docsRoot', 'docs')
  return {
    packagesRoot: string('packagesRoot', 'packages'),
    docsRoot,
    pageRoot: string('pageRoot', `${docsRoot}/subsystems`),
    groupReadme: string('groupReadme', 'README.md'),
    manifest: string('manifest', 'package.json'),
    pageSuffix: string('pageSuffix', '.md'),
    exemptions,
  }
}

/** Repository-relative path of the page a reader-visible link actually reaches, or undefined. */
function linkedPage(url, readmeDirectory, config) {
  const target = url.split('#')[0].split('?')[0]
  if (target === '' || target.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined
  const resolved = posix.normalize(posix.join(readmeDirectory, target))
  if (resolved.startsWith('../') || resolved === '..') return undefined
  if (!resolved.startsWith(`${config.pageRoot}/`)) return undefined
  if (!resolved.endsWith(config.pageSuffix)) return undefined
  const name = posix.basename(resolved)
  if (name === `README${config.pageSuffix}` || name.endsWith(`.zh${config.pageSuffix}`)) return undefined
  return resolved
}

/**
 * Canonical subsystem-page paths a group README actually links, resolved from that README's own directory.
 * `pageRoot` decides what counts; the URL is never assumed to name the page it checks.
 */
export function subsystemLinks(source, config, readmeDirectory) {
  const links = new Set()
  visitMarkdown(parseMarkdown(source), node => {
    if (node.type !== 'link') return
    const page = linkedPage(node.url, readmeDirectory, config)
    if (page !== undefined) links.add(page)
  })
  return [...links].sort()
}

/**
 * Audit package-group subsystem ownership for one repository tree.
 * @param root - repository root containing the configured package and docs roots.
 * @param config - normalized configuration from `subsystemPageConfig`.
 * @returns counts plus every actionable violation.
 */
export function auditSubsystemPages(root, config) {
  const packagesDirectory = resolve(root, config.packagesRoot)
  const groups = new Set()
  for (const group of childDirectories(packagesDirectory)) {
    if (isFile(join(packagesDirectory, group, config.groupReadme))) groups.add(group)
  }
  for (const group of childDirectories(packagesDirectory)) {
    for (const child of childDirectories(join(packagesDirectory, group))) {
      if (isFile(join(packagesDirectory, group, child, config.manifest))) groups.add(group)
    }
  }

  const violations = []
  const entries = Object.entries(config.exemptions)
  for (const [group, reason] of entries) {
    if (!groups.has(group)) violations.push(`exemption ${group}: no matching package group; remove the stale entry`)
    if (typeof reason !== 'string' || reason.trim() === '') {
      violations.push(`exemption ${group}: missing justification for omitting a subsystem page`)
    }
  }

  let linked = 0
  let exempt = 0
  for (const group of [...groups].sort()) {
    const readme = `${config.packagesRoot}/${group}/${config.groupReadme}`
    const readmePath = resolve(root, readme)
    if (!isFile(readmePath)) {
      violations.push(`${readme}: package group has no group README declaring subsystem ownership`)
      continue
    }
    const readmeDirectory = posix.dirname(readme)
    const links = subsystemLinks(readFileSync(readmePath, 'utf8'), config, readmeDirectory)
    const isExempt = Object.hasOwn(config.exemptions, group)
    if (links.length === 0) {
      if (isExempt) {
        exempt += 1
      } else {
        violations.push(
          `${readme}: no reader-visible direct link to a ${config.pageRoot}/*${config.pageSuffix} page;`
          + ' add the owning page and link it, or add a justified exemptions entry',
        )
      }
      continue
    }
    linked += 1
    if (isExempt) violations.push(`${readme}: links a subsystem page but remains exempt; remove the stale exemption`)
    for (const page of links) {
      if (!isFile(resolve(root, page))) violations.push(`${readme}: linked subsystem page does not exist: ${page}`)
    }
  }

  return { groups: groups.size, linked, exempt, violations }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const configPath = resolve(options.root, options.config)
  const raw = loadJson(configPath, 'configuration')
  let config
  try {
    config = subsystemPageConfig(raw)
  } catch (error) {
    console.error(`${COMMAND}: ${error.message}`)
    process.exit(2)
  }
  const audit = auditSubsystemPages(options.root, config)
  if (audit.violations.length > 0) {
    console.error(`${COMMAND}: package-group documentation violations found:`)
    for (const violation of audit.violations) console.error(`  ${violation}`)
    process.exit(1)
  }
  console.log(
    `${COMMAND}: ${audit.groups} group(s) checked (${audit.linked} linked, ${audit.exempt} explicitly exempt), all conform.`,
  )
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) main()
