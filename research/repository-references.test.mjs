// Behavioral regressions for tools/doc-gates/verify-repository-references.mjs.
// The gate's guarantee depends on a real Git object database, so every case builds a disposable
// repository with an actual commit instead of mocking Git.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const GATE = fileURLToPath(new URL('../tools/doc-gates/verify-repository-references.mjs', import.meta.url))
const TEMP_ROOT = fileURLToPath(new URL('../verification/.tmp/repository-references/', import.meta.url))
mkdirSync(TEMP_ROOT, { recursive: true })
const roots = []
after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

/** A disposable repository holding one commit and a declared corpus. */
function fixture(files, config = {}) {
  const root = mkdtempSync(join(TEMP_ROOT, 'case-'))
  roots.push(root)
  git(root, ['init', '--quiet', '--initial-branch=main'])
  writeFileSync(join(root, 'seed.txt'), 'seed\n')
  git(root, ['add', '--', 'seed.txt'])
  git(root, ['-c', 'user.name=Gate Test', '-c', 'user.email=gate@example.invalid', 'commit', '--quiet', '-m', 'seed'])
  const head = git(root, ['rev-parse', 'HEAD'])
  const declared = typeof files === 'function' ? files(head) : files
  for (const [name, content] of Object.entries(declared)) {
    const path = join(root, name)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, content)
  }
  const policy = {
    gitRoot: '.',
    roots: ['docs'],
    files: [],
    commitIdentifiers: true,
    forbiddenUrls: [],
    bannedTerms: [],
    ...config,
  }
  mkdirSync(join(root, '.doc-gates'), { recursive: true })
  writeFileSync(join(root, '.doc-gates/repository-references.json'), JSON.stringify(policy, null, 2))
  return { root, head }
}

function run(root, extra = []) {
  return spawnSync(process.execPath, [GATE, '--root', root, ...extra], { encoding: 'utf8' })
}

test('a real commit identifier in maintained text is refused with its location', () => {
  const { root, head } = fixture((commit) => ({ 'docs/record.md': `Pinned at ${commit.slice(0, 8)}.\n` }))
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /docs\/record\.md:1 commit-hash/)
  assert.match(result.stderr, new RegExp(head.slice(0, 8)))
})

test('a hexadecimal token that names no object is not a commit reference', () => {
  const { root } = fixture({ 'docs/record.md': 'Digest deadbeefcafe and code 1234567 do not name objects.\n' })
  const result = run(root)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /no commit identifiers/)
})

test('removing the identifier turns the same tree into a pass', () => {
  const { root, head } = fixture((commit) => ({ 'docs/record.md': `Pinned at ${commit.slice(0, 8)}.\n` }))
  assert.equal(run(root).status, 1)
  writeFileSync(join(root, 'docs/record.md'), 'Pinned at release v1.2.3.\n')
  const recovered = run(root)
  assert.equal(recovered.status, 0, recovered.stderr)
})

test('a disallowed organization URL is refused and an allowed literal is not', () => {
  const { root } = fixture({ 'docs/links.md': 'See https://github.com/example-org/repo\n' }, {
    forbiddenUrls: ['github.com/example-org'],
    allowedUrlLiterals: ['github.com/example-org/kit'],
  })
  const refused = run(root)
  assert.equal(refused.status, 1, refused.stderr)
  assert.match(refused.stderr, /docs\/links\.md:1 organization-url/)

  writeFileSync(join(root, 'docs/links.md'), 'See https://github.com/example-org/kit\n')
  assert.equal(run(root).status, 0)
})

test('percent and HTML entity encodings cannot hide a forbidden URL', () => {
  const policy = { forbiddenUrls: ['github.com/example-org'] }
  const percent = fixture({ 'docs/links.md': 'See https://github.com%2Fexample-org/repo\n' }, policy)
  const percentResult = run(percent.root)
  assert.equal(percentResult.status, 1, percentResult.stderr)
  assert.match(percentResult.stderr, /organization-url/)

  const entity = fixture({ 'docs/links.md': 'See https:&#47;&#47;github.com/example&#45;org/repo\n' }, policy)
  const entityResult = run(entity.root)
  assert.equal(entityResult.status, 1, entityResult.stderr)
  assert.equal(run(entity.root, ['--list']).status, 0)
})

test('a blocked term is refused in a path and in a line', () => {
  const { root } = fixture({
    'docs/provenance.md': 'Neutral text.\n',
    'docs/notes.md': 'Explain the provenance of this number.\n',
  }, { bannedTerms: ['provenance'] })
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /docs\/provenance\.md banned-term/)
  assert.match(result.stderr, /docs\/notes\.md:1 banned-term/)
})

test('declared exclusions skip an otherwise refused file', () => {
  const { root, head } = fixture((commit) => ({ 'docs/record.md': `Pinned at ${commit.slice(0, 8)}.\n` }), {
    excludePrefixes: ['docs/'],
    files: ['keep.md'],
  })
  writeFileSync(join(root, 'keep.md'), 'nothing\n')
  const result = run(root)
  assert.equal(result.status, 0, result.stderr)
})

test('embedded NUL preserves commit and term enforcement while URL checks skip that payload', () => {
  const { root } = fixture((commit) => ({
    'docs/payload.bin': `\0 ${commit} provenance https://github.com/example-org/repo\n`,
  }), { bannedTerms: ['provenance'], forbiddenUrls: ['github.com/example-org'] })
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /docs\/payload\.bin:1 commit-hash/)
  assert.match(result.stderr, /docs\/payload\.bin:1 banned-term/)
  assert.doesNotMatch(result.stderr, /organization-url/)
  writeFileSync(join(root, 'docs/payload.bin'), '\0 release v1.2.3 https://github.com/example-org/repo\n')
  assert.equal(run(root).status, 0)
})

test('an absent configuration, an empty corpus and an omitted rule are unusable invocations', () => {
  const { root } = fixture({ 'docs/record.md': 'text\n' })
  const missing = spawnSync(process.execPath, [GATE, '--root', root, '--config', 'absent.json'], { encoding: 'utf8' })
  assert.equal(missing.status, 2)
  assert.match(missing.stderr, /configuration is required/)

  writeFileSync(join(root, '.doc-gates/repository-references.json'), JSON.stringify({
    gitRoot: '.', roots: [], files: [], commitIdentifiers: true, forbiddenUrls: [], bannedTerms: [],
  }))
  const empty = run(root)
  assert.equal(empty.status, 2)
  assert.match(empty.stderr, /empty corpus is not a pass/)

  writeFileSync(join(root, '.doc-gates/repository-references.json'), JSON.stringify({
    gitRoot: '.', roots: ['docs'], files: [], forbiddenUrls: [], bannedTerms: [],
  }))
  const omitted = run(root)
  assert.equal(omitted.status, 2)
  assert.match(omitted.stderr, /must declare commitIdentifiers/)
})

test('a gitRoot that is not a repository root is refused rather than reported clean', () => {
  const subdirectory = fixture({ 'docs/record.md': 'text\n' }, { gitRoot: 'docs' })
  const nested = run(subdirectory.root)
  assert.equal(nested.status, 2, nested.stderr)
  assert.match(nested.stderr, /must be the repository root/)

  const absent = fixture({ 'docs/record.md': 'text\n' }, { gitRoot: 'nowhere' })
  const missing = run(absent.root)
  assert.equal(missing.status, 2, missing.stderr)
  assert.match(missing.stderr, /not a readable Git repository/)
})

test('commit scanning can be declared off, and then an identifier is not a finding', () => {
  const { root, head } = fixture((commit) => ({ 'docs/record.md': `Pinned at ${commit.slice(0, 8)}.\n` }), {
    commitIdentifiers: false,
  })
  assert.equal(run(root).status, 0)
})

test('an allowed repository cannot exempt a similarly prefixed repository', () => {
  const { root } = fixture({ 'docs/links.md': 'https://github.com/example-org/kit-malicious\n' }, {
    forbiddenUrls: ['github.com/example-org'],
    allowedUrlLiterals: ['github.com/example-org/kit'],
  })
  assert.equal(run(root).status, 1)
  writeFileSync(join(root, 'docs/links.md'), 'https://github.com/example-org/kit.git/releases\n')
  assert.equal(run(root).status, 0)
})

test('Git object identifiers for blobs are allowed while commit identifiers are refused', () => {
  const { root, head } = fixture({ 'docs/record.md': 'text\n' })
  const blob = git(root, ['rev-parse', 'HEAD:seed.txt'])
  writeFileSync(join(root, 'docs/record.md'), `Blob ${blob}.\n`)
  assert.equal(run(root).status, 0)
  writeFileSync(join(root, 'docs/record.md'), `Commit ${head}.\n`)
  assert.equal(run(root).status, 1)
})

test('a per-rule exclusion waives only the declared rule, not the other two', () => {
  const { root, head } = fixture((commit) => ({
    'docs/frozen/schema.json': `frozen provenance ${commit.slice(0, 8)} https://github.com/example-org/repo\n`,
    'docs/note.md': 'authored provenance\n',
  }), {
    bannedTerms: ['provenance'],
    forbiddenUrls: ['github.com/example-org'],
    ruleExclusions: [{ rule: 'term', pathPrefixes: ['docs/frozen'] }],
  })
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /docs\/note\.md:1 banned-term/)
  assert.match(result.stderr, /docs\/frozen\/schema\.json:1 commit-hash/)
  assert.match(result.stderr, /docs\/frozen\/schema\.json:1 organization-url/)
  assert.doesNotMatch(result.stderr, /docs\/frozen\/schema\.json:1 banned-term/)
})

test('a marker-delimited generated region exempts one rule only inside it', () => {
  const policy = {
    bannedTerms: ['provenance'],
    generatedRegions: [{
      rule: 'term',
      pathPattern: '^docs\\/frozen\\/v[0-9]+\\.md$',
      startMarker: '<!-- gen:start -->',
      endMarker: '<!-- gen:end -->',
    }],
  }
  const body = 'authored provenance\n<!-- gen:start -->\ngenerated provenance\n<!-- gen:end -->\nfinal provenance\n'
  const { root } = fixture({ 'docs/frozen/v1.md': body }, policy)
  const refused = run(root)
  assert.equal(refused.status, 1, refused.stderr)
  assert.match(refused.stderr, /docs\/frozen\/v1\.md:1 banned-term/)
  assert.match(refused.stderr, /docs\/frozen\/v1\.md:5 banned-term/)
  assert.doesNotMatch(refused.stderr, /v1\.md:3 banned-term/)

  writeFileSync(join(root, 'docs/frozen/v1.md'), body.replace('<!-- gen:end -->\n', ''))
  const malformed = run(root)
  assert.equal(malformed.status, 1, malformed.stderr)
  assert.match(malformed.stderr, /v1\.md:3 banned-term/)
})

test('undeclarable rule scopes and patterns are unusable invocations, not silent exemptions', () => {
  for (const policy of [
    { ruleExclusions: [{ rule: 'license', pathPrefixes: ['docs'] }] },
    { ruleExclusions: [{ rule: 'term' }] },
    { generatedRegions: [{ rule: 'term', pathPattern: '(', startMarker: 'a', endMarker: 'b' }] },
    { generatedRegions: [{ rule: 'term', pathPattern: '^docs', startMarker: '', endMarker: 'b' }] },
  ]) {
    const { root } = fixture({ 'docs/record.md': 'text\n' }, policy)
    const result = run(root)
    assert.equal(result.status, 2, `${JSON.stringify(policy)}: ${result.stderr}`)
    assert.match(result.stderr, /ruleExclusions|generatedRegions/)
  }
})

test('duplicate and malformed marker-family members grant no exemption', () => {
  const start = '<!-- gen:start -->', end = '<!-- gen:end -->'
  const { root } = fixture({ 'docs/frozen.md': 'text\n' }, {
    bannedTerms: ['provenance'],
    generatedRegions: [{ rule: 'term', pathPattern: '^docs/frozen\\.md$', startMarker: start, endMarker: end }],
  })
  for (const extra of [start, end, '<!-- gen:other -->', '<!-- GEN:start -->', '<!--\ngen:start -->', '<!--gen:start']) {
    writeFileSync(join(root, 'docs/frozen.md'), `${start}\n${extra}\nprovenance\n${end}\n`)
    const result = run(root)
    assert.equal(result.status, 1, `${extra}: ${result.stderr}`)
    assert.match(result.stderr, /banned-term/)
  }
  writeFileSync(join(root, 'docs/frozen.md'), `${start}\nprovenance\n${end}\n`)
  assert.equal(run(root).status, 0)
})

test('declared commit and URL regions apply only to matching interiors', () => {
  const { root, head } = fixture({ 'docs/frozen.md': 'text\n' }, {
    forbiddenUrls: ['github.com/example-org'],
    generatedRegions: ['commit', 'url'].map(rule => ({
      rule, pathPattern: '^docs/frozen\\.md$', startMarker: '<!-- gen:start -->', endMarker: '<!-- gen:end -->',
    })),
  })
  const forbidden = `${head} https://github.com/example-org/repo`
  writeFileSync(join(root, 'docs/frozen.md'), `<!-- gen:start -->\n${forbidden}\n<!-- gen:end -->\n`)
  assert.equal(run(root).status, 0)
  writeFileSync(join(root, 'docs/frozen.md'), `<!-- gen:start -->\n${forbidden}\n<!-- gen:end -->\n${forbidden}\n`)
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /docs\/frozen\.md:4 commit-hash/)
  assert.match(result.stderr, /docs\/frozen\.md:4 organization-url/)
  assert.doesNotMatch(result.stderr, /frozen\.md:2/)
})

function sourceGitDiscovery() {
  return {
    commitIdentifiers: 'tracked-and-untracked',
    forbiddenUrls: {
      'github.com/example-org': { files: 'tracked-and-untracked', skipNul: false },
      'legacy-owner/legacy-repo': { files: 'tracked', skipNul: true },
    },
    bannedTerms: 'tracked',
  }
}

test('Git discovery uses each rule corpus and excludes ignored new files without exempting tracked ones', () => {
  const { root } = fixture(commit => ({
    'docs/tracked.md': 'tracked source identity\n',
    'docs/new.md': `${commit} https://github.com/example-org/repo legacy-owner/legacy-repo provenance\n`,
    'docs/ignored.md': `${commit} https://github.com/example-org/repo provenance\n`,
  }), { bannedTerms: ['provenance'], forbiddenUrls: ['github.com/example-org', 'legacy-owner/legacy-repo'], gitDiscovery: sourceGitDiscovery() })
  writeFileSync(join(root, '.gitignore'), 'docs/ignored.md\n')
  git(root, ['add', 'docs/tracked.md'])
  const first = run(root)
  assert.equal(first.status, 1, first.stderr)
  assert.match(first.stderr, /docs\/new\.md:1 commit-hash/)
  assert.match(first.stderr, /docs\/new\.md:1 organization-url \(github\.com\/example-org\)/)
  assert.doesNotMatch(first.stderr, /legacy-owner|banned-term|ignored\.md/)
  writeFileSync(join(root, 'docs/new.md'), 'release-v1 legacy-owner/legacy-repo provenance\n')
  assert.equal(run(root).status, 0)
  git(root, ['add', 'docs/new.md'])
  const tracked = run(root)
  assert.equal(tracked.status, 1, tracked.stderr)
  assert.match(tracked.stderr, /legacy-owner\/legacy-repo/)
  assert.match(tracked.stderr, /docs\/new\.md:1 banned-term/)
  git(root, ['add', '-f', 'docs/ignored.md'])
  assert.match(run(root).stderr, /docs\/ignored\.md:1 commit-hash/)
  writeFileSync(join(root, 'docs/new.md'), 'source identity at release-v1\n')
  writeFileSync(join(root, 'docs/ignored.md'), 'source identity at release-v1\n')
  assert.equal(run(root).status, 0)
})

test('Git discovery skips absent tracked files but refuses a corpus with no existing selected files', () => {
  const { root } = fixture({ 'docs/a.md': 'text\n', 'docs/b.md': 'text\n' }, {
    forbiddenUrls: ['github.com/example-org', 'legacy-owner/legacy-repo'], gitDiscovery: sourceGitDiscovery(),
  })
  git(root, ['add', 'docs/a.md', 'docs/b.md'])
  rmSync(join(root, 'docs/a.md'))
  assert.equal(run(root).status, 0)
  rmSync(join(root, 'docs/b.md'))
  const empty = run(root)
  assert.equal(empty.status, 2, empty.stderr)
  assert.match(empty.stderr, /no maintained files/)
})

test('Git discovery refuses incomplete, unknown and invalid per-URL declarations', () => {
  for (const gitDiscovery of [
    {},
    { ...sourceGitDiscovery(), bannedTerms: 'all' },
    { ...sourceGitDiscovery(), forbiddenUrls: { 'github.com/example-org': { files: 'tracked', skipNul: false } } },
    { ...sourceGitDiscovery(), forbiddenUrls: { 'github.com/example-org': { files: 'tracked' }, 'legacy-owner/legacy-repo': { files: 'tracked', skipNul: true } } },
    { ...sourceGitDiscovery(), extra: 'tracked' },
  ]) {
    const { root } = fixture({ 'docs/a.md': 'text\n' }, {
      forbiddenUrls: ['github.com/example-org', 'legacy-owner/legacy-repo'], gitDiscovery,
    })
    const rejected = run(root)
    assert.equal(rejected.status, 2)
    assert.match(rejected.stderr, /gitDiscovery[.:]/)
    assert.doesNotMatch(rejected.stderr, /unknown config field/)
  }
})

test('per-rule path patterns preserve exact historical eligibility and other rules', () => {
  const { root, head } = fixture({
    'docs/history/v1.schema.json': 'provenance\n',
    'docs/history/v01.schema.json': 'provenance\n',
    'docs/history/v1.zh.schema.json': 'provenance\n',
  }, { bannedTerms: ['provenance'], ruleExclusions: [{ rule: 'term', pathPatterns: ['^docs/history/v(?:0|[1-9]\\d*)\\.schema\\.json$'] }] })
  const refused = run(root)
  assert.equal(refused.status, 1, refused.stderr)
  assert.doesNotMatch(refused.stderr, /history\/v1\.schema\.json/)
  assert.match(refused.stderr, /history\/v01\.schema\.json:1 banned-term/)
  assert.match(refused.stderr, /history\/v1\.zh\.schema\.json:1 banned-term/)
  writeFileSync(join(root, 'docs/history/v01.schema.json'), 'source identity\n')
  writeFileSync(join(root, 'docs/history/v1.zh.schema.json'), 'source identity\n')
  assert.equal(run(root).status, 0)
  writeFileSync(join(root, 'docs/history/v1.schema.json'), `provenance ${head}\n`)
  assert.match(run(root).stderr, /history\/v1\.schema\.json:1 commit-hash/)
})

test('Git-discovered URL rules retain their distinct NUL boundaries', () => {
  const { root } = fixture(commit => ({ 'docs/record.bin': `\0 ${commit} github.com/example-org/repo legacy-owner/legacy-repo provenance\n` }), {
    bannedTerms: ['provenance'], forbiddenUrls: ['github.com/example-org', 'legacy-owner/legacy-repo'], gitDiscovery: sourceGitDiscovery(),
  })
  git(root, ['add', 'docs/record.bin'])
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /commit-hash/)
  assert.match(result.stderr, /github\.com\/example-org/)
  assert.match(result.stderr, /banned-term/)
  assert.doesNotMatch(result.stderr, /legacy-owner/)
  writeFileSync(join(root, 'docs/record.bin'), '\0 release-v1 legacy-owner/legacy-repo\n')
  assert.equal(run(root).status, 0)
})

test('Git discovery refuses a corpus root different from its Git index root', () => {
  const { root } = fixture({ 'docs/a.md': 'text\n' }, {
    gitRoot: 'docs', forbiddenUrls: ['github.com/example-org', 'legacy-owner/legacy-repo'],
    gitDiscovery: sourceGitDiscovery(),
  })
  git(join(root, 'docs'), ['init', '--quiet', '--initial-branch=main'])
  const result = run(root)
  assert.equal(result.status, 2, result.stderr)
  assert.match(result.stderr, /same repository root/)
})

test('URL-specific path exemptions do not silence another URL rule or commit and term rules', () => {
  const { root } = fixture(commit => ({ 'docs/vendor/code.md': `${commit} github.com/example-org/repo legacy-owner/legacy-repo provenance\n` }), {
    forbiddenUrls: ['github.com/example-org', 'legacy-owner/legacy-repo'], bannedTerms: ['provenance'],
    gitDiscovery: sourceGitDiscovery(),
    ruleExclusions: [{ rule: 'url', urlLiteral: 'github.com/example-org', pathPrefixes: ['docs/vendor'] }],
  })
  git(root, ['add', 'docs/vendor/code.md'])
  const result = run(root)
  assert.equal(result.status, 1, result.stderr)
  assert.doesNotMatch(result.stderr, /organization-url \(github\.com\/example-org/)
  assert.match(result.stderr, /organization-url \(legacy-owner\/legacy-repo/)
  assert.match(result.stderr, /commit-hash/)
  assert.match(result.stderr, /banned-term/)
  writeFileSync(join(root, 'docs/vendor/code.md'), 'github.com/example-org/repo\n')
  assert.equal(run(root).status, 0)
})

test('requiredAreas refuse a repository whose tracked areas were abandoned and recover on restore', () => {
  const { root } = fixture(commit => ({
    'AGENTS.md': 'source identity\n',
    'docs/guide.md': `${commit} provenance\n`,
    'packages/example/README.md': 'source identity\n',
  }), {
    bannedTerms: ['provenance'],
    gitDiscovery: { commitIdentifiers: 'tracked-and-untracked', forbiddenUrls: {}, bannedTerms: 'tracked', requiredAreas: ['AGENTS.md', 'packages/', 'docs/', 'vendor/'] },
  })
  git(root, ['add', 'AGENTS.md', 'docs/guide.md', 'packages/example/README.md'])
  const refused = run(root)
  assert.equal(refused.status, 2, refused.stderr)
  assert.match(refused.stderr, /omitted a required repository area: vendor/)
  mkdirSync(join(root, 'vendor'), { recursive: true })
  writeFileSync(join(root, 'vendor/example.txt'), 'source identity\n')
  git(root, ['add', 'vendor/example.txt'])
  const guardPassed = run(root)
  assert.equal(guardPassed.status, 1, guardPassed.stderr)
  assert.doesNotMatch(guardPassed.stderr, /required repository area/)
  assert.match(guardPassed.stderr, /docs\/guide\.md:1 commit-hash/)
  assert.match(guardPassed.stderr, /docs\/guide\.md:1 banned-term/)
  writeFileSync(join(root, 'docs/guide.md'), 'source identity\n')
  assert.equal(run(root).status, 0)
  git(root, ['rm', '--cached', '--quiet', 'packages/example/README.md'])
  writeFileSync(join(root, 'packages/example/README.md'), 'source identity\n')
  const untracked = run(root)
  assert.equal(untracked.status, 2, untracked.stderr)
  assert.match(untracked.stderr, /required repository area: packages/)
})

test('requiredAreas accept a declared area satisfied by any tracked member and reject invalid declarations', () => {
  const { root } = fixture({ 'AGENTS.md': 'source identity\n', 'docs/guide.md': 'source identity\n' }, {
    gitDiscovery: { commitIdentifiers: 'tracked-and-untracked', forbiddenUrls: {}, bannedTerms: 'tracked', requiredAreas: ['AGENTS.md', 'docs/', 'AGENTS.md'] },
  })
  git(root, ['add', 'AGENTS.md', 'docs/guide.md'])
  const duplicate = run(root)
  assert.equal(duplicate.status, 2, duplicate.stderr)
  assert.match(duplicate.stderr, /requiredAreas must not repeat/)
  const rejectionExpectations = [
    /declare literal paths, not globs or parent paths/,
    /declare literal paths, not globs or parent paths/,
    /gitDiscovery\.requiredAreas must be an array of non-empty strings/,
  ]
  for (const [index, requiredAreas] of [['vendor/x/../AGENTS.md'], ['vendor/*/AGENTS.md'], ['strings-in-array-but-not-list', '']].entries()) {
    const { root: bad } = fixture({ 'AGENTS.md': 'source identity\n' }, {
      gitDiscovery: { commitIdentifiers: 'tracked-and-untracked', forbiddenUrls: {}, bannedTerms: 'tracked', requiredAreas },
    })
    const badResult = run(bad)
    assert.equal(badResult.status, 2, `${requiredAreas}: ${badResult.stderr}`)
    assert.match(badResult.stderr, rejectionExpectations[index])
  }
})

test('requiredAreas distinguish exact tracked files from required directory members', () => {
  const { root } = fixture({ 'AGENTS.md/child.md': 'source identity\n', 'docs/guide.md': 'source identity\n' }, {
    gitDiscovery: { commitIdentifiers: 'tracked-and-untracked', forbiddenUrls: {}, bannedTerms: 'tracked', requiredAreas: ['AGENTS.md', 'docs/'] },
  })
  git(root, ['add', 'AGENTS.md/child.md', 'docs/guide.md'])
  const directorySubstitute = run(root)
  assert.equal(directorySubstitute.status, 2, directorySubstitute.stderr)
  assert.match(directorySubstitute.stderr, /required repository area: AGENTS\.md/)
})
