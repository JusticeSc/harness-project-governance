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
  const externalPolicy = join(workspace, 'existing owner')
  mkdirSync(externalPolicy)
  writeFileSync(join(externalPolicy, 'PROJECT.md'), '# Existing owner\n\nThis repository already has a state owner.\n')
  const guide = join(externalPolicy, 'guide.md')
  writeFileSync(guide, 'one two three\n')
  writeFileSync(join(externalPolicy, 'doc-budgets.json'), JSON.stringify({ 'guide.md': 3 }) + '\n')
  const budgetCommand = `"${process.execPath}" "${join(seat, 'tools/doc-gates/verify-doc-budgets.mjs')}" --config doc-budgets.json`
  writeFileSync(join(externalPolicy, 'governance-checks.json'), JSON.stringify({ checks: { docs: budgetCommand } }) + '\n')
  run('explicit policy accepts documentation at its ceiling', [seatedCli, 'check', externalPolicy, '--policy', 'governance-checks.json'], externalPolicy)
  writeFileSync(guide, 'one two three four\n')
  run('explicit policy rejects over-budget documentation', [seatedCli, 'check', externalPolicy, '--policy', 'governance-checks.json'], externalPolicy, 1)
  writeFileSync(guide, 'one two three\n')
  run('explicit policy recovers after documentation is trimmed', [seatedCli, 'check', externalPolicy, '--policy', 'governance-checks.json'], externalPolicy)
  assert.ok(!existsSync(join(externalPolicy, '.governance')), 'explicit policy must not create .governance')
  const policyOutside = join(workspace, 'outside-policy')
  mkdirSync(policyOutside)
  const executionMarker = join(policyOutside, 'executed.txt')
  const probeScript = join(policyOutside, 'probe.cjs')
  writeFileSync(probeScript, "const { writeFileSync } = require('node:fs'); const { join } = require('node:path'); writeFileSync(join(__dirname, 'executed.txt'), 'executed\\n'); console.log('external execution marker written');\n")
  writeFileSync(join(policyOutside, 'policy.json'), JSON.stringify({ checks: { probe: `"${process.execPath}" "${probeScript}"` } }) + '\n')
  run('external policy is executable when its own directory is the target', [seatedCli, 'check', policyOutside, '--policy', 'policy.json'], policyOutside)
  assert.equal(readFileSync(executionMarker, 'utf8'), 'executed\n')
  rmSync(executionMarker)
  run('check rejects an existing policy outside the target', [seatedCli, 'check', externalPolicy, '--policy', '../outside-policy/policy.json'], externalPolicy, 2)
  assert.ok(!existsSync(executionMarker), 'an outside policy must not execute')
  symlinkSync(policyOutside, join(externalPolicy, 'policy-link'), process.platform === 'win32' ? 'junction' : 'dir')
  run('check rejects a policy redirected outside the target', [seatedCli, 'check', externalPolicy, '--policy', 'policy-link/policy.json'], externalPolicy, 2)
  assert.ok(!existsSync(executionMarker), 'a redirected outside policy must not execute')
  const defaultPolicyRedirect = join(workspace, 'default-policy-redirect')
  mkdirSync(defaultPolicyRedirect)
  symlinkSync(policyOutside, join(defaultPolicyRedirect, '.governance'), process.platform === 'win32' ? 'junction' : 'dir')
  run('check rejects a default policy redirected outside the target', [seatedCli, 'check', defaultPolicyRedirect], defaultPolicyRedirect, 2)
  assert.ok(!existsSync(executionMarker), 'a redirected default policy must not execute')
  const targetAlias = join(workspace, 'target-alias')
  symlinkSync(externalPolicy, targetAlias, process.platform === 'win32' ? 'junction' : 'dir')
  run('check accepts an in-target policy through a repository alias', [seatedCli, 'check', targetAlias, '--policy', 'governance-checks.json'], externalPolicy)
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
