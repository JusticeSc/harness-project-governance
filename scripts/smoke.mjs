#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, rmdirSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
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
function runShowFailure(label, args, cwd) {
  const child = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 120_000 })
  if (child.error) throw child.error
  assert.equal(child.status, 1, `${label}: expected exit 1, got ${child.status}\n${child.stdout}\n${child.stderr}`)
  assert.equal(child.stdout, '', `${label}: a failed show must not print success stdout\n${child.stdout}`)
  passed++
  console.log(`PASS ${label} (exit 1, empty stdout)`)
  return child
}
const PAGE_BYTES = 4096
const LINE_BYTES = 512
function assertPayloadDigest(payload, resource, label) {
  assert.equal(Buffer.byteLength(payload, 'utf8'), resource.bytes, `${label}: joined payload bytes`)
  assert.equal(resource.sha256, createHash('sha256').update(payload, 'utf8').digest('hex'), `${label}: resource sha256 must hash the full payload`)
}
function parsePage(child, label) {
  const raw = Buffer.from(child.stdout, 'utf8')
  assert.ok(raw.length > 0, `${label}: a page must print JSON`)
  assert.ok(raw.length <= PAGE_BYTES, `${label}: stdout is ${raw.length} bytes, above ${PAGE_BYTES}`)
  for (const line of child.stdout.split('\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= LINE_BYTES, `${label}: an output line is ${Buffer.byteLength(line, 'utf8')} bytes, above ${LINE_BYTES}`)
  const page = JSON.parse(child.stdout)
  assert.equal(page.version, 1, `${label}: version`)
  assert.deepEqual(page.limits, { pageBytes: PAGE_BYTES, lineBytes: LINE_BYTES }, `${label}: limits`)
  assert.ok(Array.isArray(page.chunks) && page.chunks.every((chunk) => typeof chunk === 'string'), `${label}: chunks`)
  assert.ok(Number.isInteger(page.range?.start) && Number.isInteger(page.range?.end), `${label}: byte range`)
  assert.equal(typeof page.complete, 'boolean', `${label}: complete`)
  assert.ok(page.next === null || (typeof page.next === 'string' && page.next.length > 0), `${label}: next`)
  const resource = page.resource
  assert.ok(resource && typeof resource.id === 'string' && resource.id.length > 0, `${label}: resource id`)
  assert.ok(resource.part === 'mechanism' || resource.part === 'reference', `${label}: resource part`)
  assert.ok(typeof resource.file === 'string' && resource.file.length > 0, `${label}: resource file`)
  assert.ok(typeof resource.domain === 'string' && resource.domain.length > 0, `${label}: resource domain`)
  assert.ok(typeof resource.sourceCommit === 'string' && resource.sourceCommit.length > 0, `${label}: resource sourceCommit`)
  assert.ok(typeof resource.sha256 === 'string' && resource.sha256.length > 0, `${label}: resource sha256`)
  assert.ok(Number.isInteger(resource.bytes) && resource.bytes >= 0, `${label}: resource bytes`)
  assert.equal(Buffer.byteLength(page.chunks.join(''), 'utf8'), page.range.end - page.range.start, `${label}: chunks must cover exactly the declared range`)
  assert.ok(page.range.start >= 0 && page.range.end >= page.range.start && page.range.end <= resource.bytes, `${label}: range inside the resource`)
  assert.equal(page.complete, page.range.end === resource.bytes, `${label}: complete must mean end===bytes`)
  if (page.complete) assert.equal(page.next, null, `${label}: a complete page has no next cursor`)
  else assert.ok(page.range.end < resource.bytes, `${label}: an incomplete page must leave bytes`)
  return page
}
function validatePageSequence(pages, label) {
  assert.ok(pages.length > 0, `${label}: no pages`)
  const first = pages[0]
  let offset = 0
  for (const [index, page] of pages.entries()) {
    assert.deepEqual(page.resource, first.resource, `${label}: page ${index + 1} changed the resource identity`)
    assert.equal(page.range.start, offset, `${label}: page ${index + 1} starts at ${page.range.start}, expected ${offset}; pages must be complete, unique and ordered`)
    offset = page.range.end
    if (index < pages.length - 1) {
      assert.equal(page.complete, false, `${label}: page ${index + 1} claims completion before the last page`)
      assert.equal(typeof page.next, 'string', `${label}: page ${index + 1} needs a next cursor`)
    }
  }
  assert.equal(offset, first.resource.bytes, `${label}: pages cover ${offset} of ${first.resource.bytes} bytes`)
  assert.equal(pages.at(-1).complete, true, `${label}: the last page must be complete`)
  return first.resource
}
function reconstructPages(pages, label) {
  const resource = validatePageSequence(pages, label)
  const payload = pages.map((page) => page.chunks.join('')).join('')
  assertPayloadDigest(payload, resource, label)
  return { payload, resource, pages }
}
function collectShow(cli, cwd, id, part, label) {
  const pages = []
  const seen = new Set()
  let cursor = null
  for (let index = 0; index < 512; index += 1) {
    const args = [cli, 'show', id, '--part', part]
    if (cursor !== null) args.push('--cursor', cursor)
    const page = parsePage(run(`${label} page ${index + 1}`, args, cwd), `${label} page ${index + 1}`)
    pages.push(page)
    if (page.complete) return reconstructPages(pages, label)
    assert.ok(page.range.end < page.resource.bytes, `${label}: an incomplete page left no bytes`)
    assert.equal(typeof page.next, 'string', `${label}: an incomplete page must offer a next cursor`)
    assert.ok(!seen.has(page.next), `${label}: the next cursor repeated`)
    seen.add(page.next)
    cursor = page.next
  }
  assert.fail(`${label}: exceeded 512 pages`)
}
function digestTree(dir) {
  const entries = []
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name)
      if (statSync(path).isDirectory()) {
        entries.push(`${path.slice(dir.length).replace(/\\/g, '/')}/`)
        walk(path)
      } else entries.push(`${path.slice(dir.length).replace(/\\/g, '/')}:${createHash('sha256').update(readFileSync(path)).digest('hex')}`)
    }
  }
  walk(dir)
  return entries
}
function recordOf(skillDir, ledgerName, id) {
  const ledger = JSON.parse(readFileSync(join(skillDir, 'knowledge', ledgerName), 'utf8'))
  const matches = ledger.mechanisms.filter((mechanism) => mechanism.id === id)
  assert.equal(matches.length, 1, `${ledgerName}: expected exactly one mechanism ${id}`)
  return { ledger, record: matches[0] }
}
function assertMechanismShow(cli, cwd, skillDir, ledgerName, id, label) {
  const { ledger, record } = recordOf(skillDir, ledgerName, id)
  const { payload, resource, pages } = collectShow(cli, cwd, id, 'mechanism', label)
  assert.equal(resource.id, id, `${label}: resource id`)
  assert.equal(resource.part, 'mechanism', `${label}: resource part`)
  assert.equal(resource.domain, ledger.domain, `${label}: domain comes from the ledger`)
  assert.equal(resource.sourceCommit, ledger.sourceCommit, `${label}: sourceCommit comes from the ledger`)
  const file = resource.file.replace(/\\/g, '/')
  assert.ok(file === ledgerName || file.endsWith(`knowledge/${ledgerName}`), `${label}: resource file identifies the ledger, got ${resource.file}`)
  assert.deepEqual(JSON.parse(payload), record, `${label}: reconstructed JSON must equal the original mechanism record`)
  assertPayloadDigest(payload, resource, label)
  return { ledger, record, resource, pages, payload }
}
function assertReferenceShow(cli, cwd, skillDir, ledgerName, id, label) {
  const { ledger, record } = recordOf(skillDir, ledgerName, id)
  assert.equal(typeof record.reference, 'string', `${label}: the fixture record needs a reference`)
  const [filePart] = record.reference.split('#')
  const text = readFileSync(join(skillDir, filePart), 'utf8')
  const { payload, resource, pages } = collectShow(cli, cwd, id, 'reference', label)
  assert.equal(resource.id, id, `${label}: resource id`)
  assert.equal(resource.part, 'reference', `${label}: resource part`)
  assert.equal(resource.domain, ledger.domain, `${label}: domain comes from the ledger`)
  assert.equal(resource.sourceCommit, ledger.sourceCommit, `${label}: sourceCommit comes from the ledger`)
  const file = resource.file.replace(/\\/g, '/')
  assert.ok(file === filePart || file.endsWith(filePart), `${label}: resource file identifies the reference, got ${resource.file}`)
  assert.equal(payload, text, `${label}: reference payload must be the exact full file text`)
  assertPayloadDigest(payload, resource, label)
  return { ledger, record, resource, pages, payload }
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
  // Read-only `show`: real pages are reconstructed; payloads must match ledger records and reference bytes.
  const showCwd = join(workspace, 'show cwd')
  mkdirSync(showCwd)
  const installedKnowledgeScope = digestTree(join(installed, 'knowledge'))
  const installedReferenceScope = digestTree(join(installed, 'references'))
  const seatKnowledgeScope = digestTree(join(seat, 'knowledge'))
  const seatReferenceScope = digestTree(join(seat, 'references'))
  const smallLedger = 'engineering.json'
  const smallId = 'engineering-todo-markers'
  let installedBig = null
  for (const [label, cliUnderTest, skillDir] of [
    ['installed package', cli, installed],
    ['installed seat', seatedCli, seat],
  ]) {
    assertMechanismShow(cliUnderTest, showCwd, skillDir, smallLedger, smallId, `${label} mechanism`)
    const big = assertMechanismShow(cliUnderTest, showCwd, skillDir, 'agent-workflows.json', 'agent-workflows-skill-catalog', `${label} multi-page mechanism`)
    assert.ok(big.pages.length > 1, `${label}: a record above the page budget must paginate`)
    assert.ok(big.record.migration, `${label}: migration obligations must survive reconstruction`)
    if (label === 'installed package') installedBig = big
  }
  assert.ok(installedBig, 'the installed package must supply the multi-page mechanism pages')
  const sharedA = assertReferenceShow(cli, showCwd, installed, 'subtree-instructions.json', 'subtree-instructions.native-contract-first', 'shared reference first mechanism')
  const sharedB = assertReferenceShow(cli, showCwd, installed, 'subtree-instructions.json', 'subtree-instructions.profile-test-placement', 'shared reference second mechanism')
  assert.equal(sharedA.payload, sharedB.payload, 'both mechanisms must read the same exact reference file')
  assert.equal(sharedA.resource.file, sharedB.resource.file)
  assert.equal(sharedA.resource.sha256, sharedB.resource.sha256)
  assert.equal(sharedA.resource.bytes, sharedB.resource.bytes)
  assert.ok(sharedA.pages.length > 1, 'the shared reference file must paginate')
  const seatedReference = assertReferenceShow(seatedCli, showCwd, seat, 'subtree-instructions.json', 'subtree-instructions.native-contract-first', 'installed seat reference')
  assert.equal(seatedReference.payload, sharedA.payload, 'the installed seat must expose the same reference bytes')
  const mechanismCursor = installedBig.pages[0].next
  assert.equal(typeof mechanismCursor, 'string')
  const tamperedCursor = `${mechanismCursor.slice(0, Math.floor(mechanismCursor.length / 2))}%${mechanismCursor.slice(Math.floor(mechanismCursor.length / 2) + 1)}`
  runShowFailure('show rejects a cursor from another mechanism id', [cli, 'show', smallId, '--part', 'mechanism', '--cursor', mechanismCursor], showCwd)
  runShowFailure('show rejects a reference cursor under another mechanism id', [cli, 'show', 'subtree-instructions.profile-test-placement', '--part', 'reference', '--cursor', sharedA.pages[0].next], showCwd)
  runShowFailure('show rejects a mechanism cursor on the reference part', [cli, 'show', 'agent-workflows-skill-catalog', '--part', 'reference', '--cursor', mechanismCursor], showCwd)
  runShowFailure('show rejects a malformed cursor', [cli, 'show', 'agent-workflows-skill-catalog', '--cursor', '%%%not-a-cursor%%%'], showCwd)
  runShowFailure('show rejects a noncanonical cursor mutation', [cli, 'show', 'agent-workflows-skill-catalog', '--cursor', tamperedCursor], showCwd)
  runShowFailure('show rejects a cursor with an appended character', [cli, 'show', 'agent-workflows-skill-catalog', '--cursor', `${mechanismCursor}A`], showCwd)
  runShowFailure('show rejects an unknown mechanism id', [cli, 'show', 'no-such-mechanism-smoke'], showCwd)
  runShowFailure('show requires an exact mechanism id', [cli, 'show', 'engineering-todo-marker'], showCwd)
  for (const [label, extra] of [
    ['show rejects a missing mechanism id', []],
    ['show rejects an unknown option', [smallId, '--unknown']],
    ['show rejects an extra positional argument', [smallId, 'extra']],
    ['show rejects a missing --part value', [smallId, '--part']],
    ['show rejects an unknown --part value', [smallId, '--part', 'body']],
    ['show rejects a case-mismatched --part value', [smallId, '--part', 'Mechanism']],
    ['show rejects a duplicate --part option', [smallId, '--part', 'mechanism', '--part', 'reference']],
    ['show rejects a missing --cursor value', [smallId, '--cursor']],
    ['show rejects a duplicate --cursor option', [smallId, '--cursor', mechanismCursor, '--cursor', mechanismCursor]],
    ['show rejects an empty cursor', [smallId, '--cursor', '']],
    ['show rejects a cursor without a mechanism id', ['--cursor', mechanismCursor]],
  ]) runShowFailure(label, [cli, 'show', ...extra], showCwd)
  const cloned = installedBig.pages.map((page) => structuredClone(page))
  assert.throws(() => validatePageSequence(cloned.slice(1), 'missing first page'), /./, 'a sequence without its first page must be rejected')
  assert.throws(() => validatePageSequence(cloned.slice(0, -1), 'missing last page'), /./, 'a sequence without its last page must be rejected')
  assert.throws(() => validatePageSequence([cloned[0], ...cloned], 'duplicated page'), /./, 'a duplicated page must be rejected')
  assert.throws(() => validatePageSequence([...cloned].reverse(), 'reordered pages'), /./, 'reordered pages must be rejected')
  assert.deepEqual(digestTree(join(installed, 'knowledge')), installedKnowledgeScope, 'show must not write package knowledge')
  assert.deepEqual(digestTree(join(installed, 'references')), installedReferenceScope, 'show must not write package references')
  assert.deepEqual(digestTree(join(seat, 'knowledge')), seatKnowledgeScope, 'show must not write seat knowledge')
  assert.deepEqual(digestTree(join(seat, 'references')), seatReferenceScope, 'show must not write seat references')
  assert.deepEqual(digestTree(showCwd), [], 'show must not write its working directory')
  assert.ok(!existsSync(join(showCwd, '.governance')), 'show must not create .governance')
  assert.ok(!existsSync(join(consumer, '.governance')), 'show must not create .governance in the consumer')
  // Isolated installed-copy fixtures: only copied fixtures change, then they are restored byte-for-byte.
  const fixture = join(workspace, 'fixture package')
  cpSync(installed, fixture, { recursive: true })
  const fixtureCli = join(fixture, 'bin/governance.mjs')
  const fixtureKnowledge = join(fixture, 'knowledge')
  const fixtureReferences = join(fixture, 'references')
  const fixtureKnowledgeScope = digestTree(fixtureKnowledge)
  const fixtureReferenceScope = digestTree(fixtureReferences)
  const duplicateLedgerPath = join(fixtureKnowledge, 'zz-smoke-duplicate.json')
  writeFileSync(duplicateLedgerPath, JSON.stringify({
    domain: 'smoke-duplicate',
    sourceCommit: 'b'.repeat(40),
    mechanisms: [{ id: smallId, title: 'duplicate fixture' }],
  }, null, 2) + '\n')
  try {
    runShowFailure('show rejects duplicate exact mechanism ids', [fixtureCli, 'show', smallId], showCwd)
  } finally {
    rmSync(duplicateLedgerPath, { force: true })
  }
  assertMechanismShow(fixtureCli, showCwd, fixture, smallLedger, smallId, 'fixture duplicate-id recovery')
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  const migrationLedgerPath = join(fixtureKnowledge, 'zz-smoke-migration-only.json')
  const migrationRecord = {
    id: 'smoke-migration-only',
    migration: {
      strategy: 'retain-and-trim',
      implementation: `迁移时保留真实要求：${'长'.repeat(900)}`,
      obligations: [
        '只迁移 obligations 中存在的要求，不把迁移设计写成目标事实。',
        `控制字符必须原样保留：${'\u0001\u0007\u001b'.repeat(40)}`,
      ],
      requiredSupport: ['Skill 发现机制', '引用检查', '分页游标'],
    },
  }
  writeFileSync(migrationLedgerPath, JSON.stringify({
    domain: 'smoke-migration-only',
    sourceCommit: 'c'.repeat(40),
    evidenceModel: 'isolated installed smoke fixture',
    mechanisms: [migrationRecord],
  }, null, 2) + '\n')
  try {
    const migration = collectShow(fixtureCli, showCwd, migrationRecord.id, 'mechanism', 'fixture migration-only record')
    assert.deepEqual(JSON.parse(migration.payload), migrationRecord, 'a record whose requirements live only in migration must stay exact')
    assert.equal(migration.resource.domain, 'smoke-migration-only')
    assert.equal(migration.resource.sourceCommit, 'c'.repeat(40))
    runShowFailure('show rejects the reference part of a migration-only record', [fixtureCli, 'show', migrationRecord.id, '--part', 'reference'], showCwd)
  } finally {
    rmSync(migrationLedgerPath, { force: true })
  }
  runShowFailure('show restores unknown-id failure after the migration-only ledger is removed', [fixtureCli, 'show', migrationRecord.id], showCwd)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  const unknownLedgerPath = join(fixtureKnowledge, smallLedger)
  const unknownOriginal = readFileSync(unknownLedgerPath)
  let unknownExpected = null
  {
    const ledger = JSON.parse(unknownOriginal.toString('utf8'))
    const record = ledger.mechanisms.find((mechanism) => mechanism.id === smallId)
    record.xSmokeUnknown = {
      note: '未知新增字段不得省略',
      long: `${'长'.repeat(1400)}${'🙂'.repeat(400)}${'\u0000\u0001\t\n\r'.repeat(40)}`,
      nested: { list: Array.from({ length: 40 }, (_, index) => `entry-${index}: ${'值'.repeat(20)}`) },
    }
    unknownExpected = JSON.parse(JSON.stringify(record))
    writeFileSync(unknownLedgerPath, JSON.stringify(ledger, null, 2) + '\n')
  }
  const unknownModified = readFileSync(unknownLedgerPath)
  const unknown = collectShow(fixtureCli, showCwd, smallId, 'mechanism', 'fixture unknown huge Unicode and control fields')
  assert.deepEqual(JSON.parse(unknown.payload), unknownExpected, 'unknown fields must be preserved exactly')
  assert.ok(unknown.pages.length > 1, 'the unknown long field must paginate')
  assert.equal(JSON.parse(unknown.payload).xSmokeUnknown.long, unknownExpected.xSmokeUnknown.long)
  assert.ok(readFileSync(unknownLedgerPath).equals(unknownModified), 'show must not rewrite the fixture ledger')
  writeFileSync(unknownLedgerPath, unknownOriginal)
  assert.ok(readFileSync(unknownLedgerPath).equals(unknownOriginal))
  const unknownRecovered = assertMechanismShow(fixtureCli, showCwd, fixture, smallLedger, smallId, 'fixture unknown-field recovery')
  assert.equal(Object.hasOwn(unknownRecovered.record, 'xSmokeUnknown'), false)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  const staleLedgerName = 'agent-workflows.json'
  const staleId = 'agent-workflows-skill-catalog'
  const staleLedgerPath = join(fixtureKnowledge, staleLedgerName)
  const staleOriginal = readFileSync(staleLedgerPath)
  const stalePage = parsePage(run('fixture stale-cursor setup', [fixtureCli, 'show', staleId], showCwd), 'fixture stale setup page')
  assert.equal(stalePage.complete, false, 'the stale-cursor fixture must have a next page')
  const staleCursor = stalePage.next
  {
    const ledger = JSON.parse(staleOriginal.toString('utf8'))
    ledger.mechanisms.find((mechanism) => mechanism.id === staleId).xSmokeStale = 'changed after the cursor was issued'
    const staleModified = Buffer.from(JSON.stringify(ledger, null, 2) + '\n')
    writeFileSync(staleLedgerPath, staleModified)
    runShowFailure('show rejects a cursor whose content changed', [fixtureCli, 'show', staleId, '--cursor', staleCursor], showCwd)
    assert.ok(readFileSync(staleLedgerPath).equals(staleModified), 'show must not rewrite the changed ledger')
  }
  writeFileSync(staleLedgerPath, staleOriginal)
  assert.ok(readFileSync(staleLedgerPath).equals(staleOriginal))
  const staleRecovered = assertMechanismShow(fixtureCli, showCwd, fixture, staleLedgerName, staleId, 'fixture stale-cursor recovery')
  assert.equal(Object.hasOwn(staleRecovered.record, 'xSmokeStale'), false)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  const refLedgerName = 'subtree-instructions.json'
  const refId = 'subtree-instructions.native-contract-first'
  const refLedgerPath = join(fixtureKnowledge, refLedgerName)
  const refOriginal = readFileSync(refLedgerPath)
  {
    const ledger = JSON.parse(refOriginal.toString('utf8'))
    ledger.mechanisms.find((mechanism) => mechanism.id === refId).reference = 'references/smoke-missing.md#native-contract-first'
    writeFileSync(refLedgerPath, JSON.stringify(ledger, null, 2) + '\n')
  }
  assertMechanismShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture mechanism without its reference file')
  runShowFailure('show rejects a registered reference file that is missing', [fixtureCli, 'show', refId, '--part', 'reference'], showCwd)
  writeFileSync(refLedgerPath, refOriginal)
  assert.ok(readFileSync(refLedgerPath).equals(refOriginal))
  assertReferenceShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture missing-reference recovery')
  const outsideReference = join(workspace, 'outside reference')
  mkdirSync(outsideReference)
  const outsideReferenceText = '# outside\n\n<a id="native-contract-first"></a>\n\nsubtree-instructions.native-contract-first\n'
  writeFileSync(join(outsideReference, 'payload.md'), outsideReferenceText)
  const referenceLink = join(fixtureReferences, 'smoke-outside')
  symlinkSync(outsideReference, referenceLink, process.platform === 'win32' ? 'junction' : 'dir')
  const outsideLedgerOriginal = readFileSync(refLedgerPath)
  {
    const ledger = JSON.parse(outsideLedgerOriginal.toString('utf8'))
    ledger.mechanisms.find((mechanism) => mechanism.id === refId).reference = 'references/smoke-outside/payload.md#native-contract-first'
    writeFileSync(refLedgerPath, JSON.stringify(ledger, null, 2) + '\n')
  }
  try {
    assertMechanismShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture redirected-reference mechanism')
    runShowFailure('show rejects a reference redirected outside the packaged references directory', [fixtureCli, 'show', refId, '--part', 'reference'], showCwd)
    assert.equal(readFileSync(join(outsideReference, 'payload.md'), 'utf8'), outsideReferenceText)
  } finally {
    writeFileSync(refLedgerPath, outsideLedgerOriginal)
    if (process.platform === 'win32') rmdirSync(referenceLink)
    else unlinkSync(referenceLink)
  }
  assert.ok(readFileSync(refLedgerPath).equals(outsideLedgerOriginal))
  assertReferenceShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture redirected-reference recovery')
  assert.deepEqual(digestTree(fixtureReferences), fixtureReferenceScope)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  // Redirecting the whole packaged references root must not redefine containment or expose outside files.
  const referencesBackup = join(fixture, 'references.original')
  const outsideReferencesRoot = join(workspace, 'outside references root')
  mkdirSync(outsideReferencesRoot)
  cpSync(join(fixtureReferences, 'subtree-instructions.md'), join(outsideReferencesRoot, 'subtree-instructions.md'))
  renameSync(fixtureReferences, referencesBackup)
  symlinkSync(outsideReferencesRoot, fixtureReferences, process.platform === 'win32' ? 'junction' : 'dir')
  try {
    runShowFailure('show rejects a packaged references root redirected outside the package', [fixtureCli, 'show', refId, '--part', 'reference'], showCwd)
  } finally {
    if (process.platform === 'win32') rmdirSync(fixtureReferences)
    else unlinkSync(fixtureReferences)
    renameSync(referencesBackup, fixtureReferences)
  }
  const rootRedirectRecovered = assertReferenceShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture references-root redirect recovery')
  assert.equal(rootRedirectRecovered.payload, sharedA.payload)
  assert.deepEqual(digestTree(fixtureReferences), fixtureReferenceScope)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  // A legitimate package-root alias must still resolve registered references inside the real package.
  const packageAlias = join(workspace, 'fixture package alias')
  symlinkSync(fixture, packageAlias, process.platform === 'win32' ? 'junction' : 'dir')
  try {
    assertMechanismShow(join(packageAlias, 'bin/governance.mjs'), showCwd, fixture, smallLedger, smallId, 'legitimate package-root alias mechanism')
    const aliasReference = assertReferenceShow(join(packageAlias, 'bin/governance.mjs'), showCwd, fixture, refLedgerName, refId, 'legitimate package-root alias reference')
    assert.equal(aliasReference.payload, sharedA.payload)
  } finally {
    if (process.platform === 'win32') rmdirSync(packageAlias)
    else unlinkSync(packageAlias)
  }
  assert.deepEqual(digestTree(fixtureReferences), fixtureReferenceScope)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  const longReferencePath = join(fixtureReferences, 'subtree-instructions.md')
  const longReferenceOriginal = readFileSync(longReferencePath)
  const longReferenceOriginalText = longReferenceOriginal.toString('utf8')
  const longReferenceLine = `${'长'.repeat(3000)}${'🙂'.repeat(600)}${'\u0001'.repeat(120)}`
  const longReferenceText = `${longReferenceOriginalText}\n${longReferenceLine}\n`
  writeFileSync(longReferencePath, longReferenceText)
  try {
    const longReference = assertReferenceShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture long single-line reference')
    assert.equal(longReference.payload, longReferenceText, 'the full reference file text must survive one long line')
    assert.ok(longReference.pages.length > 1, 'a long reference line must paginate')
    assert.ok(longReference.payload.split('\n').some((line) => Buffer.byteLength(line, 'utf8') > PAGE_BYTES), 'the fixture line must exceed one page')
  } finally {
    writeFileSync(longReferencePath, longReferenceOriginal)
  }
  assert.ok(readFileSync(longReferencePath).equals(longReferenceOriginal))
  const longRecovered = assertReferenceShow(fixtureCli, showCwd, fixture, refLedgerName, refId, 'fixture long-reference recovery')
  assert.equal(longRecovered.payload, longReferenceOriginalText)
  assert.deepEqual(digestTree(fixtureReferences), fixtureReferenceScope)
  assert.deepEqual(digestTree(fixtureKnowledge), fixtureKnowledgeScope)
  assert.ok(!existsSync(join(showCwd, '.governance')), 'fixture show commands must not create .governance')
  assert.ok(!existsSync(join(fixture, '.governance')), 'show must not initialize the package')
  assert.deepEqual(digestTree(showCwd), [], 'no show command may write files')
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
  console.log(`\nSMOKE PASSED: ${passed} real command scenarios; clean offline package, installed Skill, lossless show pagination, preservation, rejection and handoff.`)
} finally {
  rmSync(workspace, { recursive: true, force: true })
}
