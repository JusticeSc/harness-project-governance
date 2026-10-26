// Regression tests for the package-group subsystem-page ownership gate in tools/doc-gates/.
// They exercise consumer-visible behavior on disposable target trees: the positive path, every refusal class,
// the source's documented blind spots, and recovery after a fix. They do not copy source fixtures.
//
// Prerequisite: the pinned parsers declared in tools/doc-gates/package.json
//   npm install --prefix tools/doc-gates --ignore-scripts
// When absent the suite reports a skip rather than passing silently.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gates = join(packageRoot, 'tools/doc-gates')
const scratch = join(packageRoot, '_working/subsystem-page-tests')
mkdirSync(scratch, { recursive: true })

const parserAvailable = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('mdast-util-gfm')"], {
  cwd: gates,
  encoding: 'utf8',
}).status === 0
const skip = parserAvailable ? false : 'run `npm install --prefix tools/doc-gates --ignore-scripts` first'

function fixture(t, name) {
  const root = mkdtempSync(join(scratch, `${name}-`))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  return root
}

function write(root, file, content) {
  const path = join(root, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
  return path
}

function gate(root, args = []) {
  return spawnSync(process.execPath, [join(gates, 'verify-subsystem-pages.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
  })
}

function config(root, value) {
  write(root, '.doc-gates/subsystem-pages.json', JSON.stringify(value))
}

const CONFIG = { packagesRoot: 'packages', docsRoot: 'docs', exemptions: {} }

function linkedGroup(root, group, page = 'runtime') {
  write(root, `packages/${group}/README.md`, `# ${group}\n\nSee [${page}](../../docs/subsystems/${page}.md).\n`)
  write(root, `docs/subsystems/${page}.md`, `# ${page}\n`)
}

function manifestGroup(root, group, child = 'core') {
  write(root, `packages/${group}/${child}/package.json`, JSON.stringify({ name: `@scope/${group}-${child}` }))
}

test('a group that links its subsystem page passes, and the reported counts match the tree', { skip }, t => {
  const root = fixture(t, 'pass')
  config(root, CONFIG)
  linkedGroup(root, 'runtime')
  linkedGroup(root, 'session', 'session')
  write(root, 'packages/util/README.md', '# util\n\nNo page; ownership stays with consumers.\n')
  config(root, { ...CONFIG, exemptions: { util: 'Low-level primitives whose semantics live with consumers.' } })
  const result = gate(root)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /3 group\(s\) checked \(2 linked, 1 explicitly exempt\)/)
})

test('a non-exempt group without a direct page link is refused with an actionable message', { skip }, t => {
  const root = fixture(t, 'missing-link')
  config(root, CONFIG)
  write(root, 'packages/runtime/README.md', '# runtime\n\nProse without a subsystem link.\n')
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /packages\/runtime\/README\.md: no reader-visible direct/)
  assert.match(result.stderr, /or add a justified exemptions entry/)
})

test('a group discovered only through a child manifest still needs a group README', { skip }, t => {
  const root = fixture(t, 'missing-readme')
  config(root, CONFIG)
  manifestGroup(root, 'ghost')
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /packages\/ghost\/README\.md: package group has no group README/)
})

test('an exemption for a group that no longer exists is refused as stale', { skip }, t => {
  const root = fixture(t, 'stale-exemption')
  config(root, { ...CONFIG, exemptions: { retired: 'Historical group.' } })
  linkedGroup(root, 'runtime')
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /exemption retired: no matching package group; remove the stale entry/)
})

test('an exemption with an empty justification is refused even when the group exists', { skip }, t => {
  const root = fixture(t, 'empty-justification')
  config(root, { ...CONFIG, exemptions: { util: '   ' } })
  write(root, 'packages/util/README.md', '# util\n')
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /exemption util: missing justification/)
})

test('a group that links a page while remaining exempt is refused as an inconsistent policy', { skip }, t => {
  const root = fixture(t, 'exempt-but-linked')
  config(root, { ...CONFIG, exemptions: { runtime: 'Claims no page.' } })
  linkedGroup(root, 'runtime')
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /links a subsystem page but remains exempt/)
})

test('a link to a missing subsystem page is refused', { skip }, t => {
  const root = fixture(t, 'missing-page')
  config(root, CONFIG)
  write(root, 'packages/runtime/README.md', '# runtime\n\nSee [runtime](../../docs/subsystems/runtime.md).\n')
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /linked subsystem page does not exist: docs\/subsystems\/runtime\.md/)
})

test('the source blind spots stay blind: indirect, Chinese and subsystem-README links do not count', { skip }, t => {
  const root = fixture(t, 'blind-spots')
  config(root, CONFIG)
  write(root, 'docs/subsystems/runtime.md', '# runtime\n')
  write(root, 'docs/subsystems/runtime.zh.md', '# 运行时\n')
  write(root, 'docs/subsystems/README.md', '# index\n')
  write(root, 'packages/runtime/README.md', [
    '# runtime',
    '',
    '- [Chinese](../../docs/subsystems/runtime.zh.md)',
    '- [Index](../../docs/subsystems/README.md)',
    '- [Nested](../../docs/other/runtime.md)',
    '',
    'A bare path docs/subsystems/runtime.md is not a link either.',
    '',
  ].join('\n'))
  const result = gate(root)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /no reader-visible direct/)
})

test('a valid link with a fragment and one without both count', { skip }, t => {
  const root = fixture(t, 'fragments')
  config(root, CONFIG)
  write(root, 'docs/subsystems/runtime.md', '# runtime\n\n## Lifecycle\n')
  write(root, 'packages/runtime/README.md', '# runtime\n\nSee [lifecycle](../../docs/subsystems/runtime.md#lifecycle).\n')
  const result = gate(root)
  assert.equal(result.status, 0, result.stderr)
})

test('recovery: adding the missing link to the same tree turns the refusal into a pass', { skip }, t => {
  const root = fixture(t, 'recovery')
  config(root, CONFIG)
  write(root, 'packages/runtime/README.md', '# runtime\n\nProse only.\n')
  const before = gate(root)
  assert.equal(before.status, 1)
  linkedGroup(root, 'runtime')
  const after = gate(root)
  assert.equal(after.status, 0, after.stderr)
})

test('configuration is mandatory: a missing config file is an unusable invocation, not a pass', { skip }, t => {
  const root = fixture(t, 'no-config')
  const result = gate(root)
  assert.equal(result.status, 2)
  assert.match(result.stderr, /cannot read configuration/)
})

test('an explicit alternate layout is honoured instead of the source product layout', { skip }, t => {
  const root = fixture(t, 'alternate-layout')
  write(root, '.doc-gates/subsystem-pages.json', JSON.stringify({
    packagesRoot: 'modules',
    docsRoot: 'manual',
    pageRoot: 'manual/reference',
    groupReadme: 'INDEX.md',
    manifest: 'pkg.json',
    pageSuffix: '.md',
    exemptions: {},
  }))
  write(root, 'modules/core/INDEX.md', '# core\n\nSee [spec](../../manual/reference/spec.md).\n')
  write(root, 'manual/reference/spec.md', '# spec\n')
  const result = gate(root)
  assert.equal(result.status, 0, result.stderr)
})

test('a link is judged by where it actually resolves, not by how it reads', { skip }, t => {
  const root = fixture(t, 'resolution')
  config(root, CONFIG)
  write(root, 'docs/subsystems/runtime.md', '# runtime\n')
  write(root, 'docs/other/spec.md', '# spec\n')
  write(root, 'packages/runtime/README.md', [
    '# runtime',
    '',
    '- [Looks like a page but leaves the page root](../../docs/subsystems/../other/spec.md)',
    '',
  ].join('\n'))
  const refused = gate(root)
  assert.equal(refused.status, 1)
  assert.match(refused.stderr, /no reader-visible direct link to a docs\/subsystems\/\*\.md page/)
  write(root, 'packages/runtime/README.md', '# runtime\n\n- [Page](../../docs/subsystems/runtime.md)\n')
  const accepted = gate(root)
  assert.equal(accepted.status, 0, accepted.stderr)
})

test('a page under the configured root is found through traversal, and a missing one is still refused', { skip }, t => {
  const root = fixture(t, 'traversal')
  config(root, CONFIG)
  write(root, 'docs/subsystems/runtime.md', '# runtime\n')
  write(root, 'packages/runtime/README.md', '# runtime\n\n- [Page](../../packages/../docs/subsystems/runtime.md)\n')
  const ok = gate(root)
  assert.equal(ok.status, 0, ok.stderr)
  write(root, 'packages/runtime/README.md', '# runtime\n\n- [Gone](../../docs/subsystems/gone.md)\n')
  const missing = gate(root)
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /linked subsystem page does not exist: docs\/subsystems\/gone\.md/)
})

test('a nested group README resolves links from its own directory, with refusal and recovery', { skip }, t => {
  const root = fixture(t, 'nested-readme')
  config(root, {
    packagesRoot: 'components',
    docsRoot: 'guide',
    pageRoot: 'guide/owners',
    groupReadme: 'docs/OWNERS.md',
    exemptions: {},
  })
  write(root, 'guide/owners/compute.md', '# Compute lifecycle\n')
  const readme = 'components/compute/docs/OWNERS.md'
  write(root, readme, '# Compute\n\n[Owner](../../guide/owners/compute.md)\n')
  const refused = gate(root)
  assert.equal(refused.status, 1, refused.stdout + refused.stderr)
  assert.match(refused.stderr, /components\/compute\/docs\/OWNERS\.md: no reader-visible direct/)
  write(root, readme, '# Compute\n\n[Owner](../../../guide/owners/compute.md)\n')
  const recovered = gate(root)
  assert.equal(recovered.status, 0, recovered.stdout + recovered.stderr)
  assert.match(recovered.stdout, /1 group\(s\) checked \(1 linked, 0 explicitly exempt\)/)
})
