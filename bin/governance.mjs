#!/usr/bin/env node
// Governance runtime shipped with this Skill. Node-only, no dependencies.
// Commands: verify, list, cite, init, status.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const KNOWLEDGE_DIR = join(SKILL_ROOT, 'knowledge')
const REFERENCES_DIR = join(SKILL_ROOT, 'references')
const GOVERNANCE_DIR = '.governance'

const args = process.argv.slice(2)
const command = args[0]

function fail(message) {
  console.error(`governance: ${message}`)
  process.exit(1)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function loadMechanisms() {
  if (!existsSync(KNOWLEDGE_DIR)) fail(`knowledge directory is missing: ${KNOWLEDGE_DIR}`)
  const mechanisms = []
  const domains = new Map()
  for (const file of readdirSync(KNOWLEDGE_DIR).filter((name) => name.endsWith('.json')).sort()) {
    const value = readJson(join(KNOWLEDGE_DIR, file))
    if (typeof value.domain !== 'string' || value.domain.length === 0) fail(`${file}: domain is missing`)
    if (domains.has(value.domain)) fail(`${file}: duplicate domain ${value.domain}`)
    if (!Array.isArray(value.mechanisms) || value.mechanisms.length === 0) fail(`${file}: mechanisms must be a non-empty array`)
    domains.set(value.domain, value.mechanisms.length)
    for (const mechanism of value.mechanisms) mechanisms.push({ ...mechanism, file })
  }
  return { mechanisms, domains }
}

function anchorPresent(text, fragment) {
  const wanted = fragment.toLowerCase()
  let fence = null
  for (const line of text.split(/\r?\n/)) {
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      if (delimiter && delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = null
      continue
    }
    if (delimiter) {
      fence = delimiter[1]
      continue
    }
    for (const anchor of line.matchAll(/<(?:a|h[1-6])\b[^>]*\b(?:id|name)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
      if (anchor[1].toLowerCase() === wanted) return true
    }
    const heading = line.match(/^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/)
    if (!heading) continue
    const explicit = heading[1].match(/\s*\{#([^}]+)\}\s*$/)
    if (explicit && explicit[1].toLowerCase() === wanted) return true
    const title = heading[1].replace(/\s*\{#[^}]+\}\s*$/, '')
    const slug = title.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-')
    if (slug === wanted) return true
  }
  return false
}

function verify() {
  const { mechanisms, domains } = loadMechanisms()
  const problems = []
  const seen = new Set()
  for (const mechanism of mechanisms) {
    const id = mechanism.id
    if (typeof id !== 'string' || id.length === 0) { problems.push(`${mechanism.file}: mechanism without id`); continue }
    if (seen.has(id)) problems.push(`duplicate mechanism id ${id}`)
    seen.add(id)
    if (typeof mechanism.reference !== 'string' || !mechanism.reference.includes('#')) {
      problems.push(`${id}: reference must be a path#anchor`)
      continue
    }
    const [filePart, fragment] = mechanism.reference.split('#')
    const referencePath = join(SKILL_ROOT, filePart)
    if (!existsSync(referencePath)) { problems.push(`${id}: reference file is missing: ${filePart}`); continue }
    const text = readFileSync(referencePath, 'utf8')
    if (!text.includes(id)) problems.push(`${id}: reference ${filePart} does not contain the mechanism id`)
    if (!anchorPresent(text, fragment)) problems.push(`${id}: reference ${filePart} does not contain anchor #${fragment}`)
    if (!Array.isArray(mechanism.sources) || mechanism.sources.length === 0) {
      problems.push(`${id}: sources must be a non-empty array`)
    } else {
      for (const source of mechanism.sources) {
        if (typeof source?.path !== 'string' || !Number.isInteger(source?.start) || !Number.isInteger(source?.end)) {
          problems.push(`${id}: every source needs path, start and end`)
          break
        }
      }
    }
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`governance: ${problem}`)
    console.error(`governance: ${problems.length} integrity problem(s)`)
    process.exit(1)
  }
  console.log(`governance: ${mechanisms.length} mechanisms in ${domains.size} domains; references and anchors verified`)
}

function list() {
  const { mechanisms, domains } = loadMechanisms()
  for (const [domain, count] of [...domains].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`${domain}\t${count}`)
  }
  console.log(`total\t${mechanisms.length}`)
}

function cite() {
  const query = args[1]
  if (!query) fail('usage: governance cite <mechanism-id-or-text>')
  const { mechanisms } = loadMechanisms()
  const exact = mechanisms.filter((mechanism) => mechanism.id === query)
  const matches = exact.length > 0 ? exact : mechanisms.filter((mechanism) => String(mechanism.id).includes(query))
  if (matches.length === 0) fail(`no mechanism matches ${query}`)
  for (const mechanism of matches.slice(0, 12)) {
    console.log(`${mechanism.id}`)
    console.log(`  title: ${mechanism.title}`)
    console.log(`  reference: ${mechanism.reference}`)
    console.log(`  domain: ${mechanism.file.replace(/\.json$/, '')}`)
    console.log(`  sources: ${(mechanism.sources ?? []).length}`)
  }
  if (matches.length > 12) console.log(`... ${matches.length - 12} more; narrow the query`)
}

function readTarget(dir) {
  const root = resolve(dir)
  const governance = join(root, GOVERNANCE_DIR)
  const policyPath = join(governance, 'policy.json')
  const statePath = join(governance, 'state.json')
  const requirementsPath = join(governance, 'requirements.md')
  return { root, governance, policyPath, statePath, requirementsPath }
}

function init() {
  const dir = args[1] ?? '.'
  const { root, governance, policyPath, statePath, requirementsPath } = readTarget(dir)
  mkdirSync(join(governance, 'decisions'), { recursive: true })
  const writes = []
  const skip = []
  const writeOnce = (path, content) => {
    if (existsSync(path)) { skip.push(path); return }
    writeFileSync(path, content)
    writes.push(path)
  }
  writeOnce(policyPath, JSON.stringify({
    schema: 'dsh-governance-policy/v1',
    project: { name: '', root: '.' },
    skill: { name: 'harness-project-governance', version: '1.0.0' },
    toolchains: [],
    owners: {},
    checks: {},
    activation: {},
  }, null, 2) + '\n')
  writeOnce(statePath, JSON.stringify({
    schema: 'dsh-governance-state/v1',
    phase: 'intake',
    requirement: null,
    acceptance: [],
    nextAction: 'fill .governance/requirements.md, then set state.requirement',
    updatedAt: new Date().toISOString(),
  }, null, 2) + '\n')
  writeOnce(requirementsPath, [
    '# Requirement',
    '',
    '## Goal',
    '',
    '## Acceptance',
    '',
    '- ',
    '',
    '## Non-goals',
    '',
    '## Evidence plan',
    '',
  ].join('\n'))
  writeOnce(join(governance, 'README.md'), [
    '# Project governance state',
    '',
    'This directory is written by the harness-project-governance Skill and read at the start of every task.',
    '',
    '- `requirements.md`: goal, acceptance, non-goals and evidence plan. Acceptance items are the completion test.',
    '- `policy.json`: project facts (name, toolchains, owners, checks, activation). Empty fields mean "not established yet", not "not applicable".',
    '- `state.json`: current phase, active requirement, next action. Update it when the task changes, not when it ends.',
    '- `decisions/`: one decision record per irreversible or cross-cutting choice.',
    '',
    'Run `node <skill>/bin/governance.mjs status <repo>` to see what is still missing.',
  ].join('\n') + '\n')
  for (const path of writes) console.log(`created ${path.slice(root.length + 1)}`)
  for (const path of skip) console.log(`kept    ${path.slice(root.length + 1)} (existing files are never overwritten)`)
  status(root)
}

function status() {
  const { root, governance, policyPath, statePath, requirementsPath } = readTarget(args[1] ?? '.')
  if (!existsSync(governance)) fail(`${root} has no ${GOVERNANCE_DIR}/; run: governance init ${root}`)
  const problems = []
  let policy = null
  let state = null
  let requirements = ''
  try { policy = readJson(policyPath) } catch (error) { problems.push(`policy.json: ${error.message}`) }
  try { state = readJson(statePath) } catch (error) { problems.push(`state.json: ${error.message}`) }
  if (existsSync(requirementsPath)) requirements = readFileSync(requirementsPath, 'utf8')
  else problems.push('requirements.md is missing')
  if (policy) {
    if (!policy.project?.name) problems.push('policy.project.name is empty')
    if (!Array.isArray(policy.toolchains) || policy.toolchains.length === 0) problems.push('policy.toolchains is empty')
    if (!policy.owners || Object.keys(policy.owners).length === 0) problems.push('policy.owners is empty')
    if (!policy.checks || Object.keys(policy.checks).length === 0) problems.push('policy.checks is empty')
  }
  if (state) {
    if (!state.requirement) problems.push('state.requirement is null')
    if (!Array.isArray(state.acceptance) || state.acceptance.length === 0) problems.push('state.acceptance is empty')
    if (!state.nextAction) problems.push('state.nextAction is empty')
  }
  if (requirements && !/^## Acceptance\s*\n+\s*- \S/m.test(requirements)) problems.push('requirements.md has no acceptance bullet')
  console.log(`governance: ${root}`)
  console.log(`  phase: ${state?.phase ?? 'unknown'}`)
  console.log(`  requirement: ${state?.requirement ?? '(none)'}`)
  console.log(`  next action: ${state?.nextAction ?? '(none)'}`)
  if (problems.length === 0) {
    console.log('  status: complete enough to work; re-check after every change')
    return
  }
  for (const problem of problems) console.log(`  missing: ${problem}`)
  process.exitCode = 2
}

switch (command) {
  case 'verify': verify(); break
  case 'list': list(); break
  case 'cite': cite(); break
  case 'init': init(); break
  case 'status': status(); break
  default:
    console.error('usage: governance <verify|list|cite|init|status> [argument]')
    process.exit(1)
}
