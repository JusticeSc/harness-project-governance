#!/usr/bin/env node
// Package README limitations gate adapted from DeepSeek Harness687f282e scripts/verify-package-readme-limitations.ts.
// License: ../../SOURCE-LICENSE.txt. Target layout and audited exemptions are explicit, not inherited source group names.
// Usage: node tools/doc-gates/verify-package-readme-limitations.mjs [--root <dir>] [--config <relative-json>]
// Exit0: scanned packages conform; exit1: contract violations; exit2: unusable invocation/configuration/parser.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { repositoryPath } from './corpus.mjs'
import { exitOnLoadFailure } from './dependencies.mjs'

const COMMAND = 'verify-package-readme-limitations'
const CANONICAL = '## Known Limitations and Deferred Work'
function isFile(path) {
  try { return statSync(path).isFile() } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
    throw error
  }
}
function childDirectories(path) {
  return readdirSync(path, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'node_modules')
    .map(entry => entry.name)
    .sort()
}
function limitationsLike(text) {
  return /\blimitations?\b/i.test(text) || /deferred work/i.test(text) || /what is not here/i.test(text)
    || /^deferred\b/i.test(text) || /^non-goals?\b/i.test(text)
}

async function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/package-readme-limitations.json'
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag !== '--root' && flag !== '--config') throw new Error(`unknown argument: ${flag}`)
    const value = args[++index]
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
    if (flag === '--root') root = value
    else configPath = repositoryPath(value)
  }
  root = resolve(root)
  const raw = JSON.parse(readFileSync(resolve(root, configPath), 'utf8'))
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('configuration must be an object')
  for (const key of Object.keys(raw)) {
    if (!['packagesRoot', 'manifest', 'readme', 'exemptions'].includes(key)) throw new Error(`unknown configuration field: ${key}`)
  }
  const packagesRoot = repositoryPath(raw.packagesRoot ?? 'packages')
  const manifest = repositoryPath(raw.manifest ?? 'package.json')
  const readmeName = repositoryPath(raw.readme ?? 'README.md')
  const exemptions = raw.exemptions ?? {}
  if (exemptions === null || typeof exemptions !== 'object' || Array.isArray(exemptions)) throw new Error('exemptions must be an object mapping package directories to reasons')
  if (!readmeName.endsWith('.md')) throw new Error('configuration.readme must name a Markdown file')
  let markdown
  let prose
  try {
    markdown = await import('./markdown.mjs')
    prose = await import('./markdown-prose.mjs')
  } catch (error) { exitOnLoadFailure(COMMAND, error); throw error }
  const packages = []
  for (const group of childDirectories(resolve(root, packagesRoot))) {
    const directory = posix.join(packagesRoot, group)
    for (const child of childDirectories(resolve(root, directory))) {
      const pkg = posix.join(directory, child)
      if (isFile(resolve(root, pkg, manifest))) packages.push(pkg)
    }
  }
  packages.sort()
  const scanned = new Set(packages)
  const failures = []
  for (const [entry, reason] of Object.entries(exemptions)) {
    if (!scanned.has(entry)) failures.push(`exemption ${entry}: does not name a scanned package; update the policy in the same change`)
    if (typeof reason !== 'string' || reason.trim() === '') failures.push(`exemption ${entry}: missing justification for omitting an empty limitations section`)
  }
  for (const pkg of packages) {
    const readme = posix.join(pkg, readmeName)
    if (!isFile(resolve(root, readme))) {
      failures.push(`${readme}: package manifest has no sibling README with the \`${CANONICAL}\` section`)
      continue
    }
    const source = readFileSync(resolve(root, readme), 'utf8')
    const tree = markdown.parseMarkdown(source)
    const lines = prose.markdownProseLines(source, tree)
    const headings = prose.markdownHeadingLines(source, tree)
    const limitations = headings.filter(heading => limitationsLike(heading.text))
    if (Object.hasOwn(exemptions, pkg)) {
      for (const heading of limitations) failures.push(`${readme}:${heading.index}: exempt as having no known limitations, but carries ${JSON.stringify(heading.raw)}; drop the section or remove the exemption`)
      continue
    }
    const heading = limitations[0]
    if (heading === undefined) {
      failures.push(`${readme}: missing the \`${CANONICAL}\` section; a genuinely empty section needs an audited exemption with a reason`)
      continue
    }
    if (limitations.length > 1) {
      failures.push(`${readme}: ${limitations.length} limitations-like headings (lines ${limitations.map(line => line.index).join(', ')}); keep exactly one \`${CANONICAL}\` section`)
      continue
    }
    if (heading.depth !== 2 || heading.raw.trimEnd() !== CANONICAL) {
      failures.push(`${readme}:${heading.index}: non-canonical heading ${JSON.stringify(heading.raw)}; use \`${CANONICAL}\``)
      continue
    }
    const headingAt = lines.findIndex(line => line.index === heading.index)
    const body = lines.slice(headingAt + 1)
    const headingLines = new Set(headings.map(entry => entry.index))
    const end = body.findIndex(line => headingLines.has(line.index))
    const section = end === -1 ? body : body.slice(0, end)
    if (!section.some(line => /^- /.test(line.raw))) failures.push(`${readme}:${heading.index}: the \`${CANONICAL}\` section has no top-level \`- \` bullet; state the limitations or obtain a justified exemption`)
  }
  if (failures.length) {
    console.error(`${COMMAND}: violations found:`)
    for (const failure of failures) console.error(`  ${failure}`)
    process.exitCode = 1
  } else {
    console.log(`${COMMAND}: ${packages.length} package READMEs checked (${Object.keys(exemptions).length} explicitly exempt), all conform.`)
  }
}
main().catch(error => {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
})
