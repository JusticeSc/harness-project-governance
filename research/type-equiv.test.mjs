// Actual target-owned TypeScript/CLI regressions at the optional equivalence gate.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gates = join(packageRoot, 'tools/doc-gates')
const compiler = dirname(createRequire(join(gates, 'package.json')).resolve('typescript/package.json'))
const scratch = join(packageRoot, '_working/type-equiv-tests')
mkdirSync(scratch, { recursive: true })
function write(root, file, text) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), text)
}
function fixture(t) {
  const root = mkdtempSync(join(scratch, 'consumer-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'node_modules'))
  symlinkSync(compiler, join(root, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir')
  write(root, 'package.json', JSON.stringify({ private: true, type: 'module' }))
  write(root, '.doc-gates/type-equiv.json', JSON.stringify({ roots: ['docs'] }))
  return root
}
function manifest(root, entries) {
  write(root, '.doc-gates/type-equiv.manifest.json', JSON.stringify({ entries }))
}
const fence = (code, info = 'ts type-equiv') => `\`\`\`${info}\n${code}\n\`\`\`\n`
function run(root) {
  return spawnSync(process.execPath, [join(gates, 'verify-type-equiv.mjs')], { cwd: root, encoding: 'utf8', timeout: 30_000 })
}
function status(result, expected) {
  assert.equal(result.status, expected, `${result.stdout}\n${result.stderr}`)
}

test('type equivalence preserves literal content and every real JSDoc while ignoring trivia', t => {
  const root = fixture(t)
  const source = '/** Contract */\nexport interface Config {\n  /** URL docs */\n  url: "file//A  B";\n  marker: "/** literal */";\n  inline: string; /** inline contract */\n}\n'
  const doc = '/** Contract */\nexport interface Config { /** URL docs */\nurl : "file//A  B"; /* ordinary layout note */\nmarker : "/** literal */"; // /** not JSDoc */\ninline : string; /** inline contract */\n}'
  write(root, 'src/api.ts', source)
  manifest(root, [{ doc: 'docs/guide.md', symbol: 'Config', source: 'src/api.ts' }])
  write(root, 'docs/guide.md', fence(doc))
  status(run(root), 0)
  write(root, 'docs/guide.md', fence(doc.replace('file//A  B', 'file//A B')))
  const literalDrift = run(root)
  status(literalDrift, 1)
  assert.match(literalDrift.stderr, /DRIFT: docs\/guide\.md:1/)
  write(root, 'docs/guide.md', fence(doc.replace('/** inline contract */', '')))
  status(run(root), 1)
  write(root, 'docs/guide.md', fence(doc))
  status(run(root), 0)
})

test('public API projection preserves contract docs and signatures but omits bodies and nonpublic members', t => {
  const root = fixture(t)
  const source = '/** API */\nexport abstract class Service<T> extends Base<T> {\n  #secret = 1;\n  private internal = 2;\n  protected helper(): void {}\n  static { throw Error("not executed") }\n  /** Public field */\n  readonly label: string = "initial";\n  constructor(value: T) { super(value) }\n  /** Request */\n  request(value: T): T { return value }\n  get size(): number { return 1 }\n  set size(value: number) {}\n}\n'
  const projected = '/** API */\ndeclare abstract class Service<T> extends Base<T> {\n  /** Public field */\n  readonly label: string;\n  constructor(value: T);\n  /** Request */\n  request(value: T): T;\n  get size(): number;\n  set size(value: number);\n}'
  write(root, 'src/api.ts', source)
  manifest(root, [{ doc: 'docs/guide.md', symbol: 'Service', source: 'src/api.ts', projection: 'public-api' }])
  write(root, 'docs/guide.md', fence(projected, 'ts public-api'))
  status(run(root), 0)
  write(root, 'src/api.ts', source.replace('return value', 'throw Error("different body")').replace('return 1', 'return 2'))
  status(run(root), 0)
  write(root, 'src/api.ts', source.replace('Request */', 'Changed public docs */'))
  status(run(root), 1)
  write(root, 'src/api.ts', source.replace('request(value: T): T', 'request(value: T): string'))
  status(run(root), 1)
  write(root, 'src/api.ts', source)
  status(run(root), 0)
})

test('explicit augmentations include every named interface member and its original docs', t => {
  const root = fixture(t)
  const base = '/** Base */\nexport interface Config<T> extends Parent<T> {\n  /** ID */\n  id: T;\n}'
  const extra = '/** Extension */\ndeclare module "./api.ts" {\n  interface Config<T> extends Extra<T> {\n    /** Runtime */\n    runtime: string;\n  }\n}\ndeclare module "other" { interface Config<T> { unrelated: boolean } }'
  const expected = '/** Base */\ninterface Config<T> extends Parent<T>, Extra<T> { /** ID */ id: T; /** Runtime */ runtime: string; }'
  write(root, 'src/api.ts', base)
  write(root, 'src/extension.ts', extra)
  const entry = { doc: 'docs/guide.md', symbol: 'Config', source: 'src/api.ts', augmentations: [{ source: 'src/extension.ts', module: './api.ts' }] }
  manifest(root, [entry])
  write(root, 'docs/guide.md', fence(expected))
  status(run(root), 0)
  write(root, 'src/extension.ts', extra.replace('runtime: string', 'runtime: number'))
  status(run(root), 1)
  write(root, 'src/extension.ts', extra)
  manifest(root, [{ ...entry, augmentations: [{ source: 'src/extension.ts', module: 'missing' }] }])
  status(run(root), 1)
  manifest(root, [entry])
  write(root, 'docs/guide.md', fence(expected.replace('/** Runtime */', '')))
  status(run(root), 1)
  write(root, 'docs/guide.md', fence(expected))
  status(run(root), 0)
})

test('manifest bijection rejects undisclosed blocks, stale entries, duplicates and sources outside the active corpus', t => {
  const root = fixture(t)
  const code = 'interface Config { enabled: boolean }'
  const entry = { doc: 'docs/guide.md', symbol: 'Config', source: 'src/api.ts' }
  write(root, 'src/api.ts', `export ${code}`)
  write(root, 'docs/guide.md', fence(code))
  manifest(root, [entry])
  write(root, 'docs/new.md', fence('interface Undisclosed {}'))
  const orphan = run(root)
  status(orphan, 1)
  assert.match(orphan.stderr, /docs\/new\.md:1: Undisclosed has no manifest entry/)
  write(root, 'docs/new.md', '# No copied types\n')
  manifest(root, [entry, entry])
  status(run(root), 1)
  manifest(root, [entry])
  write(root, 'docs/guide.md', fence(code) + fence(code))
  status(run(root), 1)
  write(root, 'outside.md', fence(code))
  manifest(root, [{ ...entry, doc: 'outside.md' }])
  status(run(root), 1)
  write(root, '.agents/notes/archived/old.md', fence(code))
  manifest(root, [{ ...entry, doc: '.agents/notes/archived/old.md' }])
  status(run(root), 1)
  manifest(root, [entry])
  write(root, 'docs/guide.md', '# No copied declaration\n')
  status(run(root), 1)
  write(root, 'docs/guide.md', fence(code))
  status(run(root), 0)
})

test('Chinese reuse requires the full ordered equivalence family including projection', t => {
  const root = fixture(t)
  const declaration = 'class Service { value: number; }'
  const projected = 'declare class Service { value: number; }'
  write(root, 'src/api.ts', `export ${declaration}`)
  const english = fence(declaration) + fence(projected, 'ts public-api')
  manifest(root, [
    { doc: 'docs/guide.md', symbol: 'Service', source: 'src/api.ts' },
    { doc: 'docs/guide.md', symbol: 'Service', source: 'src/api.ts', projection: 'public-api' },
  ])
  write(root, 'docs/guide.md', english)
  write(root, 'docs/guide.zh.md', '# Chinese prose is not compared\n' + english)
  status(run(root), 0)
  write(root, 'docs/guide.zh.md', fence(declaration))
  status(run(root), 1)
  write(root, 'docs/guide.zh.md', fence(projected, 'ts public-api') + fence(declaration))
  status(run(root), 1)
  write(root, 'docs/guide.zh.md', english.replace('ts public-api', 'ts type-equiv'))
  status(run(root), 1)
  write(root, 'docs/guide.zh.md', english)
  status(run(root), 0)
})

test('GFM container fences check real declarations and cannot be implicitly closed or carry extra code', t => {
  const root = fixture(t)
  const code = 'interface Config { enabled: boolean }'
  write(root, 'src/api.ts', `export ${code}`)
  manifest(root, [{ doc: 'docs/guide.md', symbol: 'Config', source: 'src/api.ts' }])
  for (const markdown of [fence(code).split('\n').map(line => `> ${line}`).join('\n'), '- ' + fence(code).replaceAll('\n', '\n  '), `~~~ts type-equiv\n${code}\n~~~~\n`]) {
    write(root, 'docs/guide.md', markdown)
    status(run(root), 0)
  }
  write(root, 'docs/guide.md', `\`\`\`ts type-equiv\n${code}\n    \`\`\``)
  const missing = run(root)
  status(missing, 1)
  assert.match(missing.stderr, /unterminated/)
  write(root, 'docs/guide.md', fence(`${code}\nexport const extra = true`))
  status(run(root), 1)
  write(root, 'docs/guide.md', fence(code, 'ts type-equiv public-api'))
  status(run(root), 1)
  write(root, 'docs/guide.md', fence(code))
  status(run(root), 0)
})
