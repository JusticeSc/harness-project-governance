#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const skill = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = mkdtempSync(join(tmpdir(), 'harness-governance-demo-'))
const target = join(workspace, 'task-board')
mkdirSync(target)
const cli = join(skill, 'bin/governance.mjs')
function run(label, args, expected = 0) {
  console.log(`\n--- ${label} ---`)
  const result = spawnSync(process.execPath, args, { cwd: target, encoding: 'utf8', timeout: 120_000 })
  if (result.error) throw result.error
  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
  assert.equal(result.status, expected, `${label}: expected exit ${expected}, got ${result.status}`)
  console.log(`[observed exit ${result.status}]`)
  return result
}
function json(name, value) { writeFileSync(join(target, '.governance', name), JSON.stringify(value, null, 2) + '\n') }
try {
  console.log('Harness Project Governance — executable local demo')
  console.log('Scenario: a task-board feature, its acceptance check, rejection and fresh-process handoff.')
  console.log('This script performs the steps explicitly. It is not an autonomous Agent adoption or a C1–C6 certification.')
  run('1. Check the installed knowledge/reference integrity', [cli, 'verify'])
  run('2. Initialize a new project (exit 2 means required facts are still empty)', [cli, 'init', target], 2)
  const policy = JSON.parse(readFileSync(join(target, '.governance/policy.json'), 'utf8'))
  Object.assign(policy, {
    project: { name: 'task-board-demo', root: '.' },
    toolchains: [{ name: 'Node.js', version: process.version }],
    owners: { application: 'demo-maintainer' },
    checks: { acceptance: 'node --test board.test.mjs' },
  })
  json('policy.json', policy)
  writeFileSync(join(target, '.governance/requirements.md'), '# Requirement\n\n## Goal\n\nReturn only unfinished task titles, preserving order.\n\n## Acceptance\n\n- Mixed tasks return exactly the unfinished titles in their input order.\n- A fully completed board returns an empty list.\n\n## Non-goals\n\nNo UI, persistence or remote configuration.\n\n## Evidence plan\n\nRun node --test board.test.mjs; deliberately violate the acceptance condition and observe rejection, then recover.\n')
  const state = {
    schema: 'dsh-governance-state/v1', phase: 'implementation',
    requirement: 'unfinished-task-titles',
    acceptance: ['mixed task filtering preserves input order', 'completed board is empty'],
    nextAction: 'run node --test board.test.mjs and retain its observed result',
    updatedAt: new Date().toISOString(),
  }
  json('state.json', state)
  run('3. Confirm project facts and handoff metadata are populated (not test execution)', [cli, 'status', target])
  const example = join(skill, 'examples/task-board')
  const working = readFileSync(join(example, 'board.mjs'), 'utf8')
  for (const file of ['board.mjs', 'board.test.mjs']) copyFileSync(join(example, file), join(target, file))
  run('4. Execute the real acceptance command', ['--test', 'board.test.mjs'])
  writeFileSync(join(target, 'board.mjs'), 'export function pendingTitles(tasks) { return tasks.map(task => task.title) }\n')
  run('5. Deliberately break the feature: the acceptance command must reject it', ['--test', 'board.test.mjs'], 1)
  writeFileSync(join(target, 'board.mjs'), working)
  run('6. Restore the feature and observe recovery', ['--test', 'board.test.mjs'])
  Object.assign(state, {
    phase: 'handoff', nextAction: 'A fresh Agent reads requirements.md and state.json, then reruns node --test board.test.mjs before making changes.',
    evidence: { command: 'node --test board.test.mjs', positiveExit: 0, rejectedMutationExit: 1, recoveryExit: 0 },
    updatedAt: new Date().toISOString(),
  })
  json('state.json', state)
  run('7. Read persistent handoff from a fresh CLI process', [cli, 'status', target])
  console.log('\nDEMO PASSED: initialization → project facts → real acceptance → rejection → recovery → persisted handoff.')
  console.log('status checks metadata only; the separately executed test command proved the demonstrated feature behavior.')
} finally {
  rmSync(workspace, { recursive: true, force: true })
}
