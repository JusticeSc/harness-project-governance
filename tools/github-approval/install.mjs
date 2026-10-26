#!/usr/bin/env node
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_ROOT = dirname(fileURLToPath(import.meta.url))
const RUNTIME_FILES = [
  'check-approval.mjs',
  'author-weight.mjs',
  'blame-ownership.mjs',
  'blame-production.py',
  'requirements.txt',
  'approval-policy.json',
  'SOURCE-LICENSE.txt',
]
const WORKFLOW_FILES = ['weighted-approval.yml', 'weighted-approval-review-event.yml']
const USAGE = 'Usage: node tools/github-approval/install.mjs <project> --production-root <relative-dir> [--production-root <relative-dir> ...]'

function statIfPresent(path) {
  try {
    return lstatSync(path)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

function assertDirectory(path) {
  const stat = statIfPresent(path)
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`Expected an existing non-symlink project directory: ${path}`)
  }
}

function assertSafeParents(target, relative) {
  let parent = target
  for (const part of relative.split('/').slice(0, -1)) {
    parent = join(parent, part)
    const stat = statIfPresent(parent)
    if (stat && (stat.isSymbolicLink() || !stat.isDirectory())) {
      throw new Error(`Refusing a symlink or non-directory install parent: ${parent}`)
    }
  }
}

function parseRoots(args) {
  const roots = new Set()
  for (let index = 0; index < args.length; index += 2) {
    if (args[index] !== '--production-root' || !args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error(USAGE)
    }
    const value = args[index + 1].replaceAll('\\', '/')
    if (posix.isAbsolute(value) || /^[A-Za-z]:/u.test(value) || value.split('/').includes('..')) {
      throw new Error('Production roots must stay inside the project.')
    }
    roots.add(posix.normalize(value))
  }
  if (roots.size === 0) throw new Error('Declare at least one actual shipped-source directory with --production-root.')
  return [...roots].sort()
}

function install(args) {
  if (args.length === 1 && args[0] === '--help') {
    console.log(USAGE)
    return
  }
  if (!args[0] || args[0].startsWith('--')) throw new Error(USAGE)
  const target = resolve(args[0])
  const roots = parseRoots(args.slice(1))
  assertDirectory(target)
  for (const root of roots) {
    assertSafeParents(target, `${root}/.production-root-check`)
    assertDirectory(join(target, root))
  }

  const desired = new Map()
  for (const file of RUNTIME_FILES) {
    desired.set(`.github/review-ownership/${file}`, readFileSync(join(MODULE_ROOT, 'runtime', file)))
  }
  desired.set('.github/review-ownership/production-roots.json', Buffer.from(`${JSON.stringify(roots, null, 2)}\n`))
  for (const file of WORKFLOW_FILES) {
    desired.set(`.github/workflows/${file}`, readFileSync(join(MODULE_ROOT, 'workflows', file)))
  }

  const missing = []
  for (const [relative, content] of desired) {
    assertSafeParents(target, relative)
    const path = join(target, relative)
    const stat = statIfPresent(path)
    if (!stat) {
      missing.push([relative, content])
    } else if (stat.isSymbolicLink() || !stat.isFile() || !readFileSync(path).equals(content)) {
      throw new Error(`Existing file differs; no files were changed: ${relative}. Review and merge an upgrade explicitly.`)
    }
  }
  for (const [relative, content] of missing) {
    assertSafeParents(target, relative)
    const path = join(target, relative)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content, { flag: 'wx' })
  }
  console.log(JSON.stringify({
    target,
    productionRoots: roots,
    created: missing.length,
    unchanged: desired.size - missing.length,
    enforcementActive: false,
    nextAction: 'Review and commit these files to the trusted default branch. Configure app-bound weighted approval and native review/history protection separately; installation alone does not enforce merges.',
  }))
}

try {
  install(process.argv.slice(2))
} catch (error) {
  console.error(`weighted approval install: ${error.message}`)
  process.exitCode = 2
}
