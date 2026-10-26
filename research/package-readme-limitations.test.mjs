// Consumer-visible limitations-section, exemption and hidden-prose regressions.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gates = join(packageRoot, 'tools/doc-gates')
const scratch = join(packageRoot, '_working/package-readme-tests')
mkdirSync(scratch, { recursive: true })
const available = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('mdast-util-gfm')"], { cwd: gates, encoding: 'utf8' }).status === 0
const skip = available ? false : 'install the pinned optional doc-gate parsers first'
function write(root, file, content) { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), content) }
function config(root, exemptions = {}) { write(root, '.doc-gates/package-readme-limitations.json', JSON.stringify({ packagesRoot: 'modules', manifest: 'unit.json', readme: 'INDEX.md', exemptions })) }
function fixture(t) {
  const root = mkdtempSync(join(scratch, 'limitations-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  config(root)
  write(root, 'modules/core/tool/unit.json', '{}')
  return root
}
function run(root) { return spawnSync(process.execPath, [join(gates, 'verify-package-readme-limitations.mjs')], { cwd: root, encoding: 'utf8', timeout: 60_000 }) }
const VALID = '# Tool\n\n## Known Limitations and Deferred Work\n\n- No remote transport is available.\n'

test('manifest discovery refuses a missing README and accepts a real limitations contract after recovery', { skip }, t => {
  const root = fixture(t)
  const missing = run(root)
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /modules\/core\/tool\/INDEX\.md: package manifest has no sibling README/)
  write(root, 'modules/core/tool/INDEX.md', VALID)
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
  assert.match(recovered.stdout, /1 package READMEs checked/)
})

test('code and HTML-comment bullets cannot satisfy the reader-visible limitations contract', { skip }, t => {
  const root = fixture(t)
  for (const hidden of ['```markdown\n- Not reader-visible prose.\n```', '<!--\n- Rendered away.\n-->']) {
    write(root, 'modules/core/tool/INDEX.md', '# Tool\n\n## Known Limitations and Deferred Work\n\n' + hidden + '\n')
    const refused = run(root)
    assert.equal(refused.status, 1)
    assert.match(refused.stderr, /has no top-level `- ` bullet/)
  }
  write(root, 'modules/core/tool/INDEX.md', VALID)
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('variant headings and competing non-goals sections are refused instead of silently choosing a section', { skip }, t => {
  const root = fixture(t)
  write(root, 'modules/core/tool/INDEX.md', VALID.replace('## Known Limitations and Deferred Work', '### Known Limitations and Deferred Work'))
  const wrongDepth = run(root)
  assert.equal(wrongDepth.status, 1)
  assert.match(wrongDepth.stderr, /non-canonical heading/)
  write(root, 'modules/core/tool/INDEX.md', VALID + '\n## Non-goals\n\n- Separate disclaimer.\n')
  const duplicate = run(root)
  assert.equal(duplicate.status, 1)
  assert.match(duplicate.stderr, /2 limitations-like headings/)
  write(root, 'modules/core/tool/INDEX.md', VALID)
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('a reasoned exemption requires an existing package and omission of its limitations section', { skip }, t => {
  const root = fixture(t)
  write(root, 'modules/core/tool/INDEX.md', VALID)
  config(root, { 'modules/core/tool': 'Audited stateless helpers have no deferred work.' })
  const staleSection = run(root)
  assert.equal(staleSection.status, 1)
  assert.match(staleSection.stderr, /exempt as having no known limitations, but carries/)
  write(root, 'modules/core/tool/INDEX.md', '# Tool\n\nA stateless helper.\n')
  const conforming = run(root)
  assert.equal(conforming.status, 0, conforming.stderr)
  config(root, { 'modules/core/tool': ' ', 'modules/core/removed': 'Old package.' })
  const invalidPolicy = run(root)
  assert.equal(invalidPolicy.status, 1)
  assert.match(invalidPolicy.stderr, /exemption modules\/core\/tool: missing justification/)
  assert.match(invalidPolicy.stderr, /exemption modules\/core\/removed: does not name a scanned package/)
  config(root, { 'modules/core/tool': 'Audited stateless helpers have no deferred work.' })
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})
