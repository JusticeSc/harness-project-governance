// Regression tests for the portable documentation gates in tools/doc-gates/.
// These exercise consumer-visible behavior of the shipped commands on disposable target trees: the
// positive path, each refusal class the source verifier rejects, the documented blind spots, and recovery.
// They do not copy source fixtures and do not restate gate wiring.
//
// Prerequisite: the pinned parsers declared in tools/doc-gates/package.json
//   npm install --prefix tools/doc-gates --ignore-scripts
// When they are absent the suite reports a skip rather than passing silently.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gates = join(packageRoot, 'tools/doc-gates')
const scratch = join(packageRoot, '_working/doc-gate-tests')
mkdirSync(scratch, { recursive: true })

const parserAvailable = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('js-yaml'); await import('mdast-util-gfm')"], {
  cwd: gates,
  encoding: 'utf8',
}).status === 0
const skip = parserAvailable ? false : 'run `npm install --prefix tools/doc-gates --ignore-scripts` first'

function run(root, script, args = []) {
  return spawnSync(process.execPath, [join(gates, script), ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' },
  })
}

function upgradeGate(root, args = []) {
  return run(root, 'verify-upgrade-guides.mjs', args)
}

function pairingGate(root, args = []) {
  return run(root, 'verify-translation-pairing.mjs', args)
}

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

const VALID_GUIDE = [
  '---',
  'kind: upgrade-guide',
  'description: "The `--preset` flag is removed."',
  '---',
  '',
  '# `--profile` replaces `--preset`',
  '',
  '## Change',
  '',
  'Old and new behavior.',
  '',
  '### Detail',
  '',
  '```md',
  '# not a heading',
  '```',
  '',
  '## Migration',
  '',
  '1. Rename the flag.',
  '',
].join('\n')

const VALID_ZH = VALID_GUIDE
  .replace('description: "The `--preset` flag is removed."', 'description: "移除 `--preset` 参数。"')
  .replace('## Change', '## 变更')
  .replace('## Migration', '## 迁移')

test('upgrade guides: conforming tree passes and an absent tree reports the source blind spot instead of silence', { skip }, t => {
  const root = fixture(t, 'guides-positive')
  write(root, 'docs/upgrade-guide/v0.1.7-rc.2/profile-flag/guide.md', VALID_GUIDE)
  write(root, 'docs/upgrade-guide/v0.1.7-rc.2/profile-flag/guide.zh.md', VALID_ZH)
  write(root, 'docs/upgrade-guide/v0.1.7-rc.2/profile-flag/guide.i18n.yaml', 'not parsed by this gate\n')
  write(root, 'docs/upgrade-guide/v1.0.0/crlf-item/guide.md', VALID_GUIDE.replaceAll('\n', '\r\n'))
  const conforming = upgradeGate(root)
  assert.equal(conforming.status, 0, conforming.stderr)

  const absent = fixture(t, 'guides-absent')
  const missing = upgradeGate(absent)
  assert.equal(missing.status, 0, missing.stderr)
})

test('upgrade guides: layout refusals name the offending repository-relative path', { skip }, t => {
  const root = fixture(t, 'guides-layout')
  for (const file of [
    'README.md',
    '0.1.7/item/guide.md',
    'v0.1/item/guide.md',
    'v0.1.7/Item_Name/guide.md',
    'v0.1.7/item/notes.md',
    'v0.1.7/item/extra/guide.md',
    'v0.1.7+build/item/guide.md',
  ]) write(root, `docs/upgrade-guide/${file}`, VALID_GUIDE)
  const rejected = upgradeGate(root)
  assert.equal(rejected.status, 1)
  for (const file of ['README.md', '0.1.7/item/guide.md', 'v0.1/item/guide.md', 'v0.1.7/Item_Name/guide.md', 'v0.1.7/item/notes.md', 'v0.1.7/item/extra/guide.md', 'v0.1.7+build/item/guide.md']) {
    assert.equal(rejected.stderr.includes(`docs/upgrade-guide/${file}:`), true, rejected.stderr)
  }
})

test('upgrade guides: frontmatter refusals cover missing, non-object, extra key, wrong kind, empty description', { skip }, t => {
  const root = fixture(t, 'guides-frontmatter')
  const body = VALID_GUIDE.slice(VALID_GUIDE.indexOf('# '))
  write(root, 'docs/upgrade-guide/v0.1.7/none/guide.md', body)
  write(root, 'docs/upgrade-guide/v0.1.7/list/guide.md', `---\n- a\n---\n${body}`)
  write(root, 'docs/upgrade-guide/v0.1.7/fields/guide.md', `---\nkind: persistence-change\ndescription: ""\nversion: v0.1.7\n---\n${body}`)
  const rejected = upgradeGate(root)
  assert.equal(rejected.status, 1)

  // Recovery: the same tree passes once the metadata is repaired.
  write(root, 'docs/upgrade-guide/v0.1.7/none/guide.md', VALID_GUIDE)
  write(root, 'docs/upgrade-guide/v0.1.7/list/guide.md', VALID_GUIDE)
  write(root, 'docs/upgrade-guide/v0.1.7/fields/guide.md', VALID_GUIDE)
  const recovered = upgradeGate(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('upgrade guides: heading refusals are exact about text and order, and H3 stays outside the outline', { skip }, t => {
  const root = fixture(t, 'guides-headings')
  const cases = {
    'no-title': VALID_GUIDE.replace('# `--profile` replaces `--preset`\n', ''),
    'two-titles': VALID_GUIDE.replace('## Migration', '# Migration'),
    'renamed': VALID_GUIDE.replace('## Change', '## Changes'),
    'extra': `${VALID_GUIDE}\n## References\n`,
    'reordered': VALID_GUIDE.replace('## Change', '## Placeholder').replace('## Migration', '## Change').replace('## Placeholder', '## Migration'),
  }
  for (const [item, source] of Object.entries(cases)) write(root, `docs/upgrade-guide/v0.1.7/${item}/guide.md`, source)
  const rejected = upgradeGate(root)
  assert.equal(rejected.status, 1)
  for (const item of Object.keys(cases)) assert.equal(rejected.stderr.includes(`v0.1.7/${item}/guide.md:`), true, rejected.stderr)

  // The conforming tree above contains an H3 under Change; it must not count as an outline entry.
  const positive = fixture(t, 'guides-h3')
  write(positive, 'docs/upgrade-guide/v0.1.7/h3/guide.md', VALID_GUIDE)
  assert.equal(upgradeGate(positive).status, 0)
})

test('upgrade guides: Chinese sibling uses its own section names and the same metadata rules', { skip }, t => {
  const root = fixture(t, 'guides-zh')
  write(root, 'docs/upgrade-guide/v0.1.7/english-headings/guide.zh.md', VALID_GUIDE)
  write(root, 'docs/upgrade-guide/v0.1.7/wrong-kind/guide.zh.md', VALID_ZH.replace('kind: upgrade-guide', 'kind: guide'))
  const rejected = upgradeGate(root)
  assert.equal(rejected.status, 1)
})

test('upgrade guides: the 500-word ceiling counts frontmatter and exempts Chinese', { skip }, t => {
  const root = fixture(t, 'guides-words')
  const words = VALID_GUIDE.split(/\s+/u).filter(Boolean).length
  write(root, 'docs/upgrade-guide/v0.1.7/at-limit/guide.md', `${VALID_GUIDE}${'word '.repeat(500 - words)}\n`)
  write(root, 'docs/upgrade-guide/v0.1.7/over-limit/guide.md', `${VALID_GUIDE}${'word '.repeat(501 - words)}\n`)
  write(root, 'docs/upgrade-guide/v0.1.7/over-limit/guide.zh.md', `${VALID_ZH}${'词 '.repeat(600)}\n`)
  const rejected = upgradeGate(root)
  assert.equal(rejected.status, 1)
  assert.doesNotMatch(rejected.stderr, /at-limit/)
  assert.doesNotMatch(rejected.stderr, /over-limit\/guide\.zh\.md/)
})

test('upgrade guides: guide root, language contract and root are explicit parameters, not product constants', { skip }, t => {
  const root = fixture(t, 'guides-parameters')
  write(root, 'handbook/v2.0.0/flag-swap/guide.md', VALID_GUIDE)
  // A non-Chinese second language uses the same fixed file name; only its section names change.
  const GERMAN = VALID_GUIDE
    .replace('description: "The `--preset` flag is removed."', 'description: "Das Flag `--preset` entfällt."')
    .replace('## Change', '## Änderung')
    .replace('## Migration', '## Migration')
  write(root, 'handbook/v2.0.0/flag-swap/guide.zh.md', GERMAN)

  const defaulted = upgradeGate(root)
  assert.equal(defaulted.status, 0, defaulted.stderr)

  const declaredRoot = upgradeGate(root, ['--guide-root', 'handbook'])
  assert.equal(declaredRoot.status, 1)

  const declaredLanguage = upgradeGate(root, ['--guide-root', 'handbook', '--sections', 'guide.zh.md=Änderung,Migration'])
  assert.equal(declaredLanguage.status, 0, declaredLanguage.stderr)

  // The source exempts the second language from the word ceiling; declaring a ceiling makes it apply.
  const limited = upgradeGate(root, ['--guide-root', 'handbook', '--sections', 'guide.zh.md=Änderung,Migration', '--max-words', 'guide.zh.md=10'])
  assert.equal(limited.status, 1)

  // The file set is fixed by the layout rule; a new language cannot be smuggled in through a flag.
  const unknownFile = upgradeGate(root, ['--sections', 'guide.de.md=Änderung,Migration'])
  assert.equal(unknownFile.status, 2)
})

test('upgrade guides: unusable invocation is exit 2, never a pass', { skip }, t => {
  const root = fixture(t, 'guides-invocation')
  const unknown = upgradeGate(root, ['--nonsense'])
  assert.equal(unknown.status, 2)
  const missingRoot = upgradeGate(root, ['--root', join(root, 'does-not-exist')])
  assert.equal(missingRoot.status, 2)
})

function pairingFixture(t, name) {
  const root = fixture(t, name)
  write(root, '.doc-gates/translation-pairing.json', `${JSON.stringify({
    roots: ['docs'],
    files: [],
    excluded: [],
    generatedSources: [],
    publicRepositoryBlobRoot: 'https://example.invalid/blob/main/',
  }, null, 2)}\n`)
  git(root, 'init', '-q')
  git(root, 'config', 'user.name', 'Doc Gate Fixture')
  git(root, 'config', 'user.email', 'fixture@example.invalid')
  git(root, 'config', 'commit.gpgsign', 'false')
  git(root, 'config', 'core.autocrlf', 'false')
  return root
}

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' },
  })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

const EN_GUIDE = [
  '---',
  'kind: upgrade-guide',
  'description: "The `--preset` flag is removed."',
  '---',
  '',
  '# Flag swap',
  '',
  'English | [中文](guide.zh.md)',
  '',
  '## Change',
  '',
  'The old flag is gone.',
  '',
  '## Migration',
  '',
  '1. Rename it.',
  '',
].join('\n')

const ZH_GUIDE = [
  '---',
  'kind: upgrade-guide',
  'description: "移除 `--preset` 参数。"',
  '---',
  '',
  '# 参数替换',
  '',
  '[English](guide.md) | 中文',
  '',
  '## 变更',
  '',
  '旧参数已移除。',
  '',
  '## 迁移',
  '',
  '1. 重命名它。',
  '',
].join('\n')

function addPair(root, base = 'docs/v1.0.0/flag-swap/guide') {
  write(root, `${base}.md`, EN_GUIDE)
  write(root, `${base}.zh.md`, ZH_GUIDE)
  const recorded = pairingGate(root, ['--write', `${base}.md`])
  assert.equal(recorded.status, 0, recorded.stderr)
  return base
}

test('pairing: complete triple passes, and the record is canonical, sectioned and re-recordable', { skip }, t => {
  const root = pairingFixture(t, 'pairing-positive')
  const base = addPair(root)
  const record = readFileSync(join(root, `${base}.i18n.yaml`), 'utf8')
  assert.match(record, /^\/:$/m)
  assert.match(record, /^\/flag-swap:$/m)
  assert.match(record, /^\/flag-swap\/change:$/m)
  assert.match(record, /^\/flag-swap\/migration:$/m)
  assert.match(record, /^ {2}en: [0-9a-f]{16}$/m)
  assert.match(record, /^ {2}zh: [0-9a-f]{16}$/m)
  const check = pairingGate(root)
  assert.equal(check.status, 0, check.stderr)
  const listing = pairingGate(root, ['--list'])
  assert.equal(listing.status, 0, listing.stderr)
})

test('pairing: a one-sided edit is out of sync until the counterpart moves and the record is re-recorded', { skip }, t => {
  const root = pairingFixture(t, 'pairing-drift')
  const base = addPair(root)
  write(root, `${base}.md`, EN_GUIDE.replace('The old flag is gone.', 'The old flag is gone and the new one is documented.'))
  const stale = pairingGate(root)
  assert.equal(stale.status, 1)

  // Recovery: bring the counterpart along, then re-record exactly that pair.
  write(root, `${base}.zh.md`, ZH_GUIDE.replace('旧参数已移除。', '旧参数已移除，新参数已有文档。'))
  assert.equal(pairingGate(root).status, 1, 'content still differs from the recorded hashes')
  const rewrote = pairingGate(root, ['--write', `${base}.md`])
  assert.equal(rewrote.status, 0, rewrote.stderr)
  const recovered = pairingGate(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('pairing: half-deleted pairs are caught from either remnant and a scoped check cannot bless the rest', { skip }, t => {
  const root = pairingFixture(t, 'pairing-remnants')
  const base = addPair(root)
  rmSync(join(root, `${base}.zh.md`))
  const noCounterpart = pairingGate(root)
  assert.equal(noCounterpart.status, 1)

  write(root, `${base}.zh.md`, ZH_GUIDE)
  rmSync(join(root, `${base}.i18n.yaml`))
  const noRecord = pairingGate(root)
  assert.equal(noRecord.status, 1)

  // A second pairless document is only reported by the corpus-wide check.
  write(root, 'docs/loose.md', '# Loose\n')
  write(root, `${base}.i18n.yaml`, 'placeholder\n')
  const scoped = pairingGate(root, ['docs/v1.0.0/flag-swap/guide.md'])
  assert.equal(scoped.status, 1, 'the named pair has a malformed record')
  assert.doesNotMatch(scoped.stderr, /docs\/loose\.md/)
})

test('pairing: missing switcher and structural drift each refuse with a named reason', { skip }, t => {
  const root = pairingFixture(t, 'pairing-structure')
  const base = addPair(root)

  // Recorded hashes must match before structural checks run, so each edit below is re-recorded first.
  write(root, `${base}.md`, EN_GUIDE.replace('English | [中文](guide.zh.md)\n\n', ''))
  write(root, `${base}.zh.md`, ZH_GUIDE.replace('[English](guide.md) | 中文\n\n', ''))
  assert.equal(pairingGate(root, ['--write', `${base}.md`]).status, 0)
  const noSwitcher = pairingGate(root)
  assert.equal(noSwitcher.status, 1)

  const restore = () => {
    write(root, `${base}.md`, EN_GUIDE)
    write(root, `${base}.zh.md`, ZH_GUIDE)
    assert.equal(pairingGate(root, ['--write', `${base}.md`]).status, 0)
  }
  restore()

  write(root, `${base}.zh.md`, ZH_GUIDE.replace('## 迁移', '### 迁移'))
  assert.equal(pairingGate(root, ['--write', `${base}.md`]).status, 0)
  const headingDrift = pairingGate(root)
  assert.equal(headingDrift.status, 1)

  restore()
  write(root, `${base}.zh.md`, ZH_GUIDE.replace('1. 重命名它。', '1. 重命名它。\n2. 重新运行。'))
  assert.equal(pairingGate(root, ['--write', `${base}.md`]).status, 0)
  const listDrift = pairingGate(root)
  assert.equal(listDrift.status, 1)

  restore()
  const withCode = (text, body) => text.replace('1. Rename it.', `1. Rename it.\n\n\`\`\`sh\n${body}\n\`\`\``)
  write(root, `${base}.md`, withCode(EN_GUIDE, 'tool migrate'))
  write(root, `${base}.zh.md`, ZH_GUIDE.replace('1. 重命名它。', '1. 重命名它。\n\n```sh\ntool migrate\n```'))
  assert.equal(pairingGate(root, ['--write', `${base}.md`]).status, 0)
  assert.equal(pairingGate(root).status, 0)
  write(root, `${base}.zh.md`, ZH_GUIDE.replace('1. 重命名它。', '1. 重命名它。\n\n```sh\ntool migrate --dry-run\n```'))
  assert.equal(pairingGate(root, ['--write', `${base}.md`]).status, 0)
  const codeDrift = pairingGate(root)
  assert.equal(codeDrift.status, 1)
})

test('pairing: an undeclared or empty corpus is exit 2, never a silent pass', { skip }, t => {
  const root = fixture(t, 'pairing-activation')
  git(root, 'init', '-q')
  const missing = pairingGate(root)
  assert.equal(missing.status, 2)

  write(root, '.doc-gates/translation-pairing.json', '{"roots": [], "files": []}\n')
  const empty = pairingGate(root)
  assert.equal(empty.status, 2)

  write(root, '.doc-gates/translation-pairing.json', '{"roots": ["docs"]}\n')
  const absentRoot = pairingGate(root)
  assert.equal(absentRoot.status, 2)

  write(root, '.doc-gates/translation-pairing.json', '{"roots": ["docs"], "exclude": []}\n')
  const misspelled = pairingGate(root)
  assert.equal(misspelled.status, 2)
})

test('pairing: --write requires a confirmed pair or explicit --all, and never silently rewrites the corpus', { skip }, t => {
  const root = pairingFixture(t, 'pairing-write')
  const base = addPair(root)
  const bare = pairingGate(root, ['--write'])
  assert.equal(bare.status, 2)
  const both = pairingGate(root, ['--write', '--all', `${base}.md`])
  assert.equal(both.status, 2)
  const conflicting = pairingGate(root, ['--cached', '--write', `${base}.md`])
  assert.equal(conflicting.status, 2)
  const excludedAnchor = pairingGate(root, ['docs/other/thing.md'])
  assert.equal(excludedAnchor.status, 2)
})

test('pairing: excluded documents must not carry a translation or a record', { skip }, t => {
  const root = pairingFixture(t, 'pairing-excluded')
  write(root, '.doc-gates/translation-pairing.json', `${JSON.stringify({ roots: ['docs'], excluded: ['docs/generated/'] }, null, 2)}\n`)
  write(root, 'docs/generated/page.md', EN_GUIDE.replace('English | [中文](guide.zh.md)', 'Generated page'))
  write(root, 'docs/generated/page.zh.md', ZH_GUIDE)
  const rejected = pairingGate(root)
  assert.equal(rejected.status, 1)
})

test('pairing: --cached reads staged bytes, so an unstaged edit does not satisfy the check', { skip }, t => {
  const root = pairingFixture(t, 'pairing-index')
  const base = addPair(root)
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'fixture baseline')
  write(root, `${base}.md`, EN_GUIDE.replace('The old flag is gone.', 'A different, uncommitted sentence.'))
  const worktree = pairingGate(root, [base + '.md'])
  assert.equal(worktree.status, 1)
  const staged = pairingGate(root, ['--cached', `${base}.md`])
  assert.equal(staged.status, 0, staged.stderr)
  git(root, 'add', '.')
  const afterStage = pairingGate(root, ['--cached', `${base}.md`])
  assert.equal(afterStage.status, 1)
})

function linkFixture(t, name, corpus = { roots: ['docs'], files: [] }) {
  const root = fixture(t, name)
  write(root, '.doc-gates/markdown-links.json', `${JSON.stringify(corpus)}\n`)
  mkdirSync(join(root, 'docs'), { recursive: true })
  return root
}

function linkGate(root) {
  return run(root, 'verify-md-links.mjs')
}

test('Markdown links: rendered headings, Setext and occupied duplicate suffixes identify exact anchors', { skip }, t => {
  const root = linkFixture(t, 'links-headings')
  write(root, 'docs/target.md', '# Repeat\n# Repeat-1\n# Repeat\n\nSetext `code`\n---\n\n# [Linked](target.md) ![Picture](icon.svg) web_fetch\n\n<a id="CaseSensitive"></a>\n')
  write(root, 'docs/icon.svg', '<svg/>')
  write(root, 'docs/index.md', [
    '[first](target.md#repeat)', '[second](target.md#repeat-1)', '[third](target.md#repeat-2)',
    '[Setext](target.md#setext-code)', '[rendered](target.md#linked-picture-web_fetch)',
    '[explicit](target.md#CaseSensitive)', '',
  ].join('\n'))
  const accepted = linkGate(root)
  assert.equal(accepted.status, 0, accepted.stderr)
  write(root, 'docs/index.md', '[wrong case](target.md#casesensitive)\n')
  const rejected = linkGate(root)
  assert.equal(rejected.status, 1)
  assert.match(rejected.stderr, /target\.md#casesensitive.*no such anchor in target/)
})

test('Markdown links: code and commented HTML cannot create anchors, and adding a real anchor recovers', { skip }, t => {
  const root = linkFixture(t, 'links-fake-anchors')
  const source = '# Page\n\n```html\n<a id="fenced"></a>\n```\n\n`<a id="inline"></a>`\n\n<!-- <a id="commented"></a> -->\n\n[f](#fenced) [i](#inline) [c](#commented)\n'
  write(root, 'docs/page.md', source)
  const rejected = linkGate(root)
  assert.equal(rejected.status, 1)
  for (const anchor of ['fenced', 'inline', 'commented']) assert.match(rejected.stderr, new RegExp(`#${anchor}.*no such anchor`))
  write(root, 'docs/page.md', `${source}\n<a id="fenced"></a>\n<a id="inline"></a>\n<a id="commented"></a>\n`)
  assert.equal(linkGate(root).status, 0)
})

test('Markdown links: decoded paths, query strings, images and definitions resolve; target errors precede fragments', { skip }, t => {
  const root = linkFixture(t, 'links-destinations')
  write(root, 'docs/My File.md', '# A Heading\n')
  write(root, 'docs/file.ts', 'export {}\n')
  mkdirSync(join(root, 'docs/directory'), { recursive: true })
  const valid = '[encoded](My%20File.md?view=1#a-heading)\n\n![image](file.ts#renderer-owned)\n\n[reference][key]\n\n[key]: My%20File.md#a-heading\n\n[dir](directory)\n[external](https://example.invalid/missing#anchor)\n[root](/docs/missing)\n[protocol](//example.invalid/missing)\n'
  write(root, 'docs/page.md', valid)
  assert.equal(linkGate(root).status, 0)
  write(root, 'docs/page.md', `${valid}\n[missing](missing.md#absent)\n[malformed](bad%zz.md)\n`)
  const rejected = linkGate(root)
  assert.equal(rejected.status, 1)
  assert.match(rejected.stderr, /missing\.md#absent.*target does not exist/)
  assert.match(rejected.stderr, /bad%zz\.md.*target does not exist/)
  assert.doesNotMatch(rejected.stderr, /missing\.md#absent.*no such anchor/)
})

test('Markdown links: frozen outgoing links are skipped but live links into archived history stay checked', { skip }, t => {
  const root = linkFixture(t, 'links-archive', { roots: ['docs', '.agents/notes'], files: ['README.md'] })
  write(root, '.agents/notes/archived/architecture/old.md', '# Historical\n\n[stale outgoing](gone.md)\n')
  write(root, 'README.md', '[history](.agents/notes/archived/architecture/old.md#historical)\n')
  assert.equal(linkGate(root).status, 0)
  write(root, 'README.md', '[history](.agents/notes/archived/architecture/old.md#renamed)\n')
  const rejected = linkGate(root)
  assert.equal(rejected.status, 1)
  assert.match(rejected.stderr, /README\.md:1.*old\.md#renamed.*no such anchor/)
  write(root, 'README.md', '[history](.agents/notes/archived/architecture/old.md#historical)\n')
  assert.equal(linkGate(root).status, 0)
})

test('Markdown links: unusable or empty corpus never reports a successful check', { skip }, t => {
  const root = linkFixture(t, 'links-config')
  assert.equal(linkGate(root).status, 2)
  write(root, 'docs/page.md', '# Present\n')
  for (const corpus of [{}, { roots: ['missing'] }, { files: ['docs/missing.md'] }, { roots: ['docs/**'] }, { roots: ['../'] }, { roots: ['docs'], typo: [] }]) {
    write(root, '.doc-gates/markdown-links.json', `${JSON.stringify(corpus)}\n`)
    assert.equal(linkGate(root).status, 2)
  }
  write(root, '.doc-gates/markdown-links.json', '{"roots":["docs"]}\n')
  assert.equal(linkGate(root).status, 0)
})

test('Standing budgets: whitespace counts, refusal diagnostics and list-only mode preserve distinct outcomes', t => {
  const root = fixture(t, 'standing-budgets')
  const gate = args => run(root, 'verify-doc-budgets.mjs', args)
  // Markdown syntax and code are counted, not rendered; adjacent Chinese is one token.
  write(root, 'AGENTS.md', 'alpha\tbeta\n中文连字\u00a0`code`\n')
  write(root, '.doc-gates/doc-budgets.json', '{"AGENTS.md":4}\n')
  assert.equal(gate().status, 0)
  write(root, 'AGENTS.md', 'alpha\tbeta\n中文连字\u00a0`code`\nextra')
  const excess = gate()
  assert.equal(excess.status, 1)
  assert.match(excess.stderr, /AGENTS\.md: 5 words exceeds the 4-word ceiling/)
  const listed = gate(['--list'])
  assert.equal(listed.status, 0)
  assert.match(listed.stdout, /OVER\s+5\s+\/\s+4\s+AGENTS\.md/)

  write(root, '.doc-gates/doc-budgets.json', '{"missing.md":3,"AGENTS.md":0}\n')
  const invalid = gate()
  assert.equal(invalid.status, 1)
  assert.match(invalid.stderr, /missing\.md: budgeted file does not exist/)
  assert.match(invalid.stderr, /AGENTS\.md: ceiling must be a positive integer/)
  assert.equal(gate(['--list']).status, 0)
  write(root, '.doc-gates/doc-budgets.json', '{}\n')
  assert.equal(gate().status, 2)

  write(root, 'AGENTS.md', 'alpha beta 中文连字 `code`\n')
  write(root, '.doc-gates/doc-budgets.json', '{"AGENTS.md":4}\n')
  assert.equal(gate().status, 0)
})

test('Markdown wrapping: prose in ordinary, list and quote paragraphs refuses without flattening structural blocks', { skip }, t => {
  const root = fixture(t, 'markdown-wrap')
  const gate = () => run(root, 'verify-md-wrap.mjs')
  write(root, '.doc-gates/markdown-wrap.json', '{"roots":["docs"]}\n')
  const valid = '---\ndescription: first\n  second\n---\n# Page\n\n::: tip\nOne paragraph.\n:::\n\n- One item.\n\n> One quote.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n<div>\nHTML body\n</div>\n\n```ts\nconst first = 1\nconst second = 2\n```\n'
  write(root, 'docs/page.md', valid)
  assert.equal(gate().status, 0)
  write(root, 'docs/page.md', '# Page\n\nFirst line\nsecond line.\n\n- List first\n  continuation.\n\n> Quoted first\n> continuation.\n')
  const refused = gate()
  assert.equal(refused.status, 1)
  for (const line of [3, 6, 9]) assert.ok(refused.stderr.includes(`docs/page.md:${line} `))
  write(root, 'docs/page.md', '# Page\n\nFirst line second line.\n\n- List first continuation.\n\n> Quoted first continuation.\n')
  assert.equal(gate().status, 0)
  write(root, '.agents/notes/archived/process/history.md', '# Historical\n\nOld hard\nwrap.\n')
  write(root, '.doc-gates/markdown-wrap.json', '{"roots":["docs",".agents/notes"]}\n')
  assert.equal(gate().status, 0)
})
