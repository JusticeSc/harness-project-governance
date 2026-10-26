// Consumer-visible Summary budget and discovery regression tests for the portable package README gate.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const script = join(packageRoot, 'tools/doc-gates/verify-package-readme-summaries.mjs')
const scratch = join(packageRoot, '_working/package-readme-tests')
mkdirSync(scratch, { recursive: true })
function fixture(t) {
  const root = mkdtempSync(join(scratch, 'summary-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  write(root, '.doc-gates/package-readme-summaries.json', JSON.stringify({ packagesRoot: 'modules', readme: 'INDEX.md' }))
  mkdirSync(join(root, 'modules'), { recursive: true })
  return root
}
function write(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}
function run(root, args = []) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', timeout: 60_000 })
}
function summary(words) {
  return `# Package\n\n## Summary\n\n${Array(words).fill('word').join(' ')}\n\n## Contract\n\n${Array(150).fill('body').join(' ')}\n`
}

test('Summary budget includes exactly100 words, rejects101, and recovers without changing the ceiling', t => {
  const root = fixture(t)
  write(root, 'modules/core/tool/INDEX.md', summary(100))
  const atLimit = run(root)
  assert.equal(atLimit.status, 0, atLimit.stderr)
  write(root, 'modules/core/tool/INDEX.md', summary(101))
  const oversized = run(root)
  assert.equal(oversized.status, 1)
  assert.match(oversized.stderr, /modules\/core\/tool\/INDEX\.md: Summary has 101 words; the limit is 100/)
  write(root, 'modules/core/tool/INDEX.md', summary(99))
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('root, group and package READMEs all require Summaries; correcting the offending group recovers', t => {
  const root = fixture(t)
  write(root, 'modules/INDEX.md', summary(8))
  write(root, 'modules/core/INDEX.md', '# Core\n\nNo Summary yet.\n')
  write(root, 'modules/core/tool/INDEX.md', summary(8))
  const missing = run(root)
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /modules\/core\/INDEX\.md: missing `## Summary`/)
  write(root, 'modules/core/INDEX.md', summary(8))
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
  assert.match(recovered.stdout, /3 English package README Summaries/)
})

test('an empty package README scan cannot pass; adding the target root README restores a real check', t => {
  const root = fixture(t)
  const empty = run(root)
  assert.equal(empty.status, 1)
  assert.match(empty.stderr, /no English package READMEs found/)
  write(root, 'modules/INDEX.md', summary(8))
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})
