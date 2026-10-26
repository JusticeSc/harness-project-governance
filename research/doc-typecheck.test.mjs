// Real TypeScript/CLI regressions for semantic drift, opt-out boundaries and paired sequences.
// Install publisher test prerequisites: npm install --prefix tools/doc-gates --ignore-scripts.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gates = join(packageRoot, 'tools/doc-gates')
const compiler = dirname(createRequire(join(gates, 'package.json')).resolve('typescript/package.json'))
const scratch = join(packageRoot, '_working/doc-typecheck-tests')
mkdirSync(scratch, { recursive: true })

function write(root, file, content) {
  const destination = join(root, file)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, content)
}

function fixture(t, mode = 'project') {
  const root = mkdtempSync(join(scratch, `${mode}-`))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'node_modules'))
  symlinkSync(compiler, join(root, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir')
  write(root, 'package.json', JSON.stringify({ private: true, type: 'module' }))
  write(root, 'api/src/index.ts', 'export interface Config { timeout: number }\n')
  write(root, 'api/lib/types/index.d.ts', 'export interface Config { timeout: number }\n')
  write(root, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true,
      paths: { '@fixture/api': ['./api/src/index.ts'] },
    },
    files: ['api/src/index.ts'],
    exclude: ['.doc-typecheck-*'],
  }))
  write(root, '.doc-gates/typecheck.json', JSON.stringify({ roots: ['docs'], tsconfig: 'tsconfig.json', mode }))
  return root
}

function run(root) {
  return spawnSync(process.execPath, [join(gates, 'doc-typecheck.mjs')], {
    cwd: root, encoding: 'utf8', timeout: 120_000,
  })
}

const fence = (code, info = 'ts') => `\`\`\`${info}\n${code}\n\`\`\`\n`
const valid = 'export const value: string = "ok"'
const usage = 'import type { Config } from "@fixture/api"\nexport const config: Config = { timeout: 1 }'

for (const mode of ['project', 'declarations']) {
  test(`document compiler: ${mode} checks real API drift and maps failure to Markdown`, t => {
    const root = fixture(t, mode)
    write(root, 'docs/guide.md', '# Usage\n\n' + fence(usage))
    const admitted = run(root)
    assert.equal(admitted.status, 0, admitted.stderr)
    const artifact = mode === 'project' ? 'api/src/index.ts' : 'api/lib/types/index.d.ts'
    write(root, artifact, 'export interface Config { timeout: string }\n')
    const drifted = run(root)
    assert.equal(drifted.status, 1, drifted.stderr)
    assert.match(drifted.stderr, /docs\/guide\.md/)
    write(root, 'docs/guide.md', '# Usage\n\n' + fence(usage.replace('timeout: 1', 'timeout: "1"')))
    const recovered = run(root)
    assert.equal(recovered.status, 0, recovered.stderr)
  })
}

test('document compiler: other-owned fences neither compile nor dilute the opt-out budget', t => {
  const root = fixture(t)
  const ownedElsewhere = ['type-equiv', 'public-api', 'cordis-catalog', 'persistence-catalog', 'config-catalog']
    .map(kind => fence('not valid TypeScript ???', `ts ${kind}`)).join('\n')
  write(root, 'docs/guide.md', fence(valid) + fence('unchecked sketch', 'ts ignore-check') + ownedElsewhere)
  const admitted = run(root)
  assert.equal(admitted.status, 0, admitted.stderr)
  write(root, 'docs/guide.md', fence(valid) + fence('one', 'ts ignore-check') + fence('two', 'ts ignore-check') + ownedElsewhere)
  const belowMinimum = run(root)
  assert.equal(belowMinimum.status, 0, belowMinimum.stderr)
  write(root, 'docs/guide.md', fence(valid) + fence(valid) + fence('one', 'ts ignore-check') + fence('two', 'ts ignore-check') + ownedElsewhere)
  const half = run(root)
  assert.equal(half.status, 0, half.stderr)
  write(root, 'docs/guide.md', fence(valid) + fence('one', 'ts ignore-check') + fence('two', 'ts ignore-check') + fence('three', 'ts ignore-check') + ownedElsewhere)
  const exceeded = run(root)
  assert.equal(exceeded.status, 1, exceeded.stderr)
})

test('document compiler: only a complete identical Chinese sequence reuses the English checks', t => {
  const root = fixture(t)
  const checked = fence(valid) + fence(valid)
  const ignored = fence('one', 'ts ignore-check') + fence('two', 'ts ignore-check')
  write(root, 'docs/guide.md', checked + ignored)
  write(root, 'docs/guide.zh.md', checked + ignored)
  const identical = run(root)
  assert.equal(identical.status, 0, identical.stderr)
  // A subset must remain primary: its two opt-outs change the real budget from2/4 to4/6.
  write(root, 'docs/guide.zh.md', ignored)
  const subset = run(root)
  assert.equal(subset.status, 1, subset.stderr)
  write(root, 'docs/guide.zh.md', fence('export const value: number = "broken"') + ignored)
  const changed = run(root)
  assert.equal(changed.status, 1, changed.stderr)
  assert.match(changed.stderr, /docs\/guide\.zh\.md/)
})

test('document compiler: project preserves configDir aliases and ambient type roots from a nested target config', t => {
  const root = fixture(t)
  write(root, 'config/project/tsconfig.docs.json', JSON.stringify({
    extends: '../../tsconfig.json',
    compilerOptions: {
      paths: { '@fixture/api': ['${configDir}/../../api/src/index.ts'] },
      typeRoots: ['${configDir}/../../ambient'],
      types: ['ambient-fixture'],
    },
  }))
  write(root, '.doc-gates/typecheck.json', JSON.stringify({
    roots: ['docs'], tsconfig: 'config/project/tsconfig.docs.json', mode: 'project',
  }))
  write(root, 'ambient/ambient-fixture/index.d.ts', 'interface AmbientFixture { label: string }\n')
  const example = usage + '\nexport const ambient: AmbientFixture = { label: "ok" }'
  write(root, 'docs/guide.md', fence(example))
  const admitted = run(root)
  assert.equal(admitted.status, 0, admitted.stderr)
  write(root, 'ambient/ambient-fixture/index.d.ts', 'interface AmbientFixture { label: number }\n')
  const drifted = run(root)
  assert.equal(drifted.status, 1, drifted.stderr)
  assert.match(drifted.stderr, /docs\/guide\.md/)
  write(root, 'docs/guide.md', fence(example.replace('label: "ok"', 'label: 1')))
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('document compiler: declarations accepts an emit-declaration-only target without losing API checking', t => {
  const root = fixture(t, 'declarations')
  const config = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'))
  config.compilerOptions.declaration = true
  config.compilerOptions.emitDeclarationOnly = true
  write(root, 'tsconfig.json', JSON.stringify(config))
  write(root, 'docs/guide.md', fence(usage))
  const admitted = run(root)
  assert.equal(admitted.status, 0, admitted.stderr)
  write(root, 'api/lib/types/index.d.ts', 'export interface Config { timeout: string }\n')
  const drifted = run(root)
  assert.equal(drifted.status, 1, drifted.stderr)
  assert.match(drifted.stderr, /docs\/guide\.md/)
  write(root, 'docs/guide.md', fence(usage.replace('timeout: 1', 'timeout: "1"')))
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

for (const mode of ['project', 'declarations']) {
  test(`document compiler: ${mode} cannot inherit noCheck and silently admit a type error`, t => {
    const root = fixture(t, mode)
    const config = JSON.parse(readFileSync(join(root, 'tsconfig.json'), 'utf8'))
    config.compilerOptions.noCheck = true
    write(root, 'tsconfig.json', JSON.stringify(config))
    write(root, 'docs/guide.md', fence('export const value: number = "broken"'))
    const refused = run(root)
    assert.equal(refused.status, 1, refused.stderr)
    assert.match(refused.stderr, /docs\/guide\.md/)
    write(root, 'docs/guide.md', fence('export const value: number = 1'))
    const recovered = run(root)
    assert.equal(recovered.status, 0, recovered.stderr)
  })
}
