#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packageFiles } from './package-files.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(process.argv[2] ?? join(root, 'dist/public'))
if (existsSync(destination)) throw new Error('Public export refuses an existing destination; choose a new directory.')
const extras = [
  '.gitignore', '.github/workflows/check.yml', 'scripts/export-public.mjs',
  'research/doc-gates.test.mjs', 'research/doc-typecheck.test.mjs',
  'research/type-equiv.test.mjs', 'research/subsystem-pages.test.mjs',
  'research/package-readme-summaries.test.mjs', 'research/package-readme-limitations.test.mjs',
  'research/repository-references.test.mjs',
  'research/omp-preflight.test.mjs',
  'AGENTS.md', 'METHODS.zh.md',
  'research/fixtures/adoption-cli/.gitignore',
  'research/fixtures/adoption-cli/README.md',
  'research/fixtures/adoption-cli/CONTRACT.md',
  'research/fixtures/adoption-cli/package.json',
  'research/fixtures/adoption-cli/bin/tasks.mjs',
  'research/fixtures/adoption-cli/test/cli.test.mjs',
  'research/fixtures/adoption-cli/test/reopen.test.mjs',
  'research/fixtures/adoption-cli/observations.json',
  'research/fixtures/adoption-cli/evidence/initial-acceptance.txt',
  'research/fixtures/adoption-cli/evidence/recovered-acceptance.txt',
  'research/fixtures/adoption-cli/evidence/continuation-acceptance.txt',
  'research/fixtures/adoption-cli/evidence/live-continuation.txt',
]
const files = [...new Set([...packageFiles(root), ...extras])].sort()
// Validate the complete source selection before creating output.
for (const file of files) if (!existsSync(join(root, file))) throw new Error(`Missing public file: ${file}`)
mkdirSync(destination, { recursive: true })
for (const file of files) {
  const target = join(destination, file)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(join(root, file), target)
}
console.log(`Exported ${files.length} allowlisted public files to ${destination}`)
console.log('Development entry, bounded adoption evidence and regression fixtures included; no private archives, working stores, credentials or source checkout copied.')
