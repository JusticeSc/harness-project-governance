#!/usr/bin/env node
import { constants, copyFileSync, lstatSync, mkdirSync, realpathSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packageFiles } from './package-files.mjs'

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targetArg = process.argv[2]
if (!targetArg || process.argv.length !== 3 || targetArg === '--help') {
  console.log('usage: node scripts/install-skill.mjs <existing-target-repository>')
  process.exit(targetArg === '--help' ? 0 : 1)
}
let seat
let created = false
try {
  const target = realpathSync(resolve(targetArg))
  if (!lstatSync(target).isDirectory()) throw new Error('target must be an existing directory')
  const files = packageFiles(source)
  for (const name of ['.agents', '.agents/skills']) {
    const path = join(target, name)
    const stat = lstatSync(path, { throwIfNoEntry: false })
    if (stat) {
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${name} must be a real directory, not a symlink or file`)
    } else mkdirSync(path)
  }
  seat = join(target, '.agents/skills/harness-project-governance')
  // Exclusive mkdir refuses even an empty existing installation. Never merge or overwrite.
  mkdirSync(seat)
  created = true
  for (const name of files) {
    const destination = join(seat, name)
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(join(source, name), destination, constants.COPYFILE_EXCL)
  }
  console.log(`Installed harness-project-governance (${files.length} files) at ${seat}`)
  console.log('Next: run node <installed-seat>/bin/governance.mjs verify, then ask your Agent to read SKILL.md.')
  console.log('No project policy, remote settings, hooks or workflows were changed.')
} catch (error) {
  if (created) rmSync(seat, { recursive: true, force: true })
  console.error(`install-skill: ${error.message}`)
  process.exitCode = 1
}
