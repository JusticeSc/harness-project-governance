#!/usr/bin/env node
// English package README Summary gate adapted from DeepSeek Harness687f282e scripts/verify-package-readme-summaries.ts.
// License: ../../SOURCE-LICENSE.txt. Target package layout is explicit; the100-word source ceiling is unchanged.
// Usage: node tools/doc-gates/verify-package-readme-summaries.mjs [--root <dir>] [--config <relative-json>]
// Exit0: summaries conform; exit1: missing/oversized Summary or empty scan; exit2: unusable input/configuration.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { repositoryPath } from './corpus.mjs'

const COMMAND = 'verify-package-readme-summaries'
const MAX_WORDS = 100

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

// Preserve the source's exact H2/raw-source extraction and whitespace token count, not an AST rewrite.
function summaryFailure(file, source) {
  const match = /^## Summary\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/mu.exec(source)
  if (!match) return `${file}: missing \`## Summary\``
  const words = match[1].trim().split(/\s+/u).filter(Boolean).length
  if (words <= MAX_WORDS) return undefined
  const kind = /^kind:\s*["']?([a-z-]+)["']?\s*$/mu.exec(source)?.[1]
  return `${file}: Summary has ${words} words; the limit is ${MAX_WORDS}. Review the ${kind ?? 'package'} README contract in the installed Skill's references/documentation.md section5 before rewriting; retain user outcomes and boundaries.`
}

function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/package-readme-summaries.json'
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
    if (key !== 'packagesRoot' && key !== 'readme') throw new Error(`unknown configuration field: ${key}`)
  }
  const packagesRoot = repositoryPath(raw.packagesRoot ?? 'packages')
  const readme = repositoryPath(raw.readme ?? 'README.md')
  if (!readme.endsWith('.md')) throw new Error('configuration.readme must name a Markdown file')
  const files = []
  function add(directory) {
    const file = posix.join(directory, readme)
    if (isFile(resolve(root, file))) files.push(file)
  }
  add(packagesRoot)
  for (const group of childDirectories(resolve(root, packagesRoot))) {
    const directory = posix.join(packagesRoot, group)
    add(directory)
    for (const child of childDirectories(resolve(root, directory))) add(posix.join(directory, child))
  }
  files.sort()
  const failures = files.length === 0
    ? ['no English package READMEs found; the scan is empty or narrowed']
    : files.map(file => summaryFailure(file, readFileSync(resolve(root, file), 'utf8'))).filter(Boolean)
  if (failures.length > 0) {
    console.error(`${COMMAND}: violations found:`)
    for (const failure of failures) console.error(`  ${failure}`)
    process.exitCode = 1
  } else {
    console.log(`${COMMAND}: ${files.length} English package README Summaries are within ${MAX_WORDS} words.`)
  }
}

try { main() } catch (error) {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
