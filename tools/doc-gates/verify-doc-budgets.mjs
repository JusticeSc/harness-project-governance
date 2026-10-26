#!/usr/bin/env node
// Standing-document ceilings adapted from DeepSeek Harness687f282e scripts/verify-doc-budgets.ts.
// License: ../../SOURCE-LICENSE.txt. Targets supply their own reviewed, non-empty manifest.
// Usage: node <skill>/tools/doc-gates/verify-doc-budgets.mjs [--root <dir>] [--config <relative-json>] [--list]
// Exit0: within ceilings, or diagnostic --list; exit1: budget violations; exit2: unusable invocation/manifest.
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

const COMMAND = 'verify-doc-budgets'

function repositoryPath(value) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value) || /^[A-Za-z]:/.test(value)) {
    throw new Error('budget paths must be non-empty repository-relative paths')
  }
  const path = value.replaceAll('\\', '/').replace(/^\.\//, '')
  if (path.split('/').some(segment => segment === '..' || segment === '' || /[*?\[\]{}]/.test(segment))) {
    throw new Error(`declare literal budget paths, not globs or parent paths: ${value}`)
  }
  return path
}

function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/doc-budgets.json'
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
  const manifest = JSON.parse(readFileSync(resolve(root, configPath), 'utf8'))
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest) || Object.keys(manifest).length === 0) {
    throw new Error('declare a non-empty object of standing-document paths and positive-integer ceilings')
  }
  const failures = []
  const rows = []
  for (const [path, ceiling] of Object.entries(manifest)) {
    const absolute = resolve(root, repositoryPath(path))
    if (!Number.isInteger(ceiling) || ceiling <= 0) {
      rows.push(`BAD   ${'—'.padStart(6)} / ${String(ceiling).padEnd(6)} ${path}`)
      failures.push(`${path}: ceiling must be a positive integer, got ${ceiling}`)
      continue
    }
    if (!existsSync(absolute)) {
      rows.push(`MISS  ${'—'.padStart(6)} / ${String(ceiling).padEnd(6)} ${path}`)
      failures.push(`${path}: budgeted file does not exist (renamed or deleted? update ${configPath} in the same change)`)
      continue
    }
    // Match the source's whitespace-delimited wc-w semantics, including Markdown/code and Chinese runs.
    const words = readFileSync(absolute, 'utf8').match(/\S+/g)?.length ?? 0
    rows.push(`${words <= ceiling ? 'ok  ' : 'OVER'}  ${String(words).padStart(6)} / ${String(ceiling).padEnd(6)} ${path}`)
    if (words > ceiling) failures.push(`${path}: ${words} words exceeds the ${ceiling}-word ceiling — relocate or condense; raising the ceiling requires review justification`)
  }
  if (listOnly) {
    console.log(rows.join('\n'))
    return
  }
  if (failures.length) {
    console.error(`${COMMAND} failed:\n`)
    for (const failure of failures) console.error(`  ${failure}`)
    process.exitCode = 1
  } else console.log(`${COMMAND}: ${rows.length} budgeted docs within ceiling.`)
}

try {
  main()
} catch (error) {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
}
