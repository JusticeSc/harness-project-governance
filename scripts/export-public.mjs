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
console.log('Research tests only; no working records, toolchains, evidence stores, credentials or source checkout included.')
