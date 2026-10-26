#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const npm = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
assert.ok(existsSync(npm), 'npm CLI not found; run this scenario through npm run smoke')
const workspace = mkdtempSync(join(tmpdir(), 'harness-governance-smoke-'))
let passed = 0
function run(label, args, cwd, expected = 0) {
  const child = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 180_000 })
  if (child.error) throw child.error
  assert.equal(child.status, expected, `${label}: expected ${expected}, got ${child.status}\n${child.stdout}\n${child.stderr}`)
  passed++
  console.log(`PASS ${label} (exit ${child.status})`)
  return child
}
try {
  const artifact = join(workspace, 'artifact')
  const consumer = join(workspace, 'offline consumer')
  const target = join(workspace, '项目 demo')
  for (const directory of [artifact, consumer, target]) mkdirSync(directory)
  const packed = run('offline npm pack', [npm, 'pack', '--json', '--ignore-scripts', '--offline', '--pack-destination', artifact], root)
  const [pack] = JSON.parse(packed.stdout)
  assert.ok(pack.files.some(file => file.path === 'SKILL.md'))
  assert.ok(!pack.files.some(file => /^(?:_working|verification|research|adoption|\.toolchains|node_modules)\//.test(file.path)), 'private work must not enter the package')
  const tarball = join(artifact, pack.filename)
  writeFileSync(join(consumer, 'package.json'), '{"name":"isolated-skill-consumer","private":true}\n')
  run('install tarball with offline mode and empty cache', [npm, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', '--cache', join(workspace, 'empty-cache'), tarball], consumer)
  const installed = join(consumer, 'node_modules/harness-project-governance')
  const cli = join(installed, 'bin/governance.mjs')
  run('installed integrity command', [cli, 'verify'], consumer)
  run('installed local npm binary', [npm, 'exec', '--offline', '--', 'harness-governance', 'verify'], consumer)
  run('domain discovery', [cli, 'list'], consumer)
  run('mechanism lookup', [cli, 'cite', 'agent-workflows'], consumer)
  run('unknown mechanism is rejected', [cli, 'cite', 'nonexistent-smoke-mechanism'], consumer, 1)
  run('install Skill from the installed package into a target with spaces and Unicode', [join(installed, 'scripts/install-skill.mjs'), target], consumer)
  const seat = join(target, '.agents/skills/harness-project-governance')
  const seatedCli = join(seat, 'bin/governance.mjs')
  run('Agent-discoverable installed seat verifies', [seatedCli, 'verify'], target)
  const before = readFileSync(join(seat, 'SKILL.md'), 'utf8')
  run('repeat installation refuses an existing seat', [join(installed, 'scripts/install-skill.mjs'), target], consumer, 1)
  assert.equal(readFileSync(join(seat, 'SKILL.md'), 'utf8'), before)
  run('new target initialization reports missing project facts', [seatedCli, 'init', target], target, 2)
  const requirements = join(target, '.governance/requirements.md')
  const preserved = '# Requirement\n\n## Goal\n\nKeep user edits.\n\n## Acceptance\n\n- Existing user acceptance remains.\n'
  writeFileSync(requirements, preserved)
  run('repeat initialization preserves user content', [seatedCli, 'init', target], target, 2)
  assert.equal(readFileSync(requirements, 'utf8'), preserved)
  run('fresh-process status reports incomplete metadata', [seatedCli, 'status', target], target, 2)
  const redirected = join(workspace, 'redirected-project')
  const outside = join(workspace, 'outside')
  mkdirSync(redirected)
  mkdirSync(outside)
  symlinkSync(outside, join(redirected, '.agents'), process.platform === 'win32' ? 'junction' : 'dir')
  run('symlinked installation parent is rejected', [join(installed, 'scripts/install-skill.mjs'), redirected], consumer, 1)
  assert.ok(!existsSync(join(outside, 'skills')), 'installer must not write through the redirect')
  // This executes the installed demo, including real passing/failing/recovered application checks.
  run('installed end-to-end demo with rejection and recovery', [join(seat, 'scripts/demo.mjs')], target)
  console.log(`\nSMOKE PASSED: ${passed} real command scenarios; clean offline package, installed Skill, preservation, rejection and handoff.`)
} finally {
  rmSync(workspace, { recursive: true, force: true })
}
