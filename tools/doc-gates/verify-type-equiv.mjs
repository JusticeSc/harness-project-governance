#!/usr/bin/env node
// Adapted from DeepSeek Harness687f282e scripts/verify-type-equiv.ts and markdown.ts.
// License: ../../SOURCE-LICENSE.txt. Target corpus, manifest and TypeScript are explicit.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative, resolve } from 'node:path'
import { repositoryPath, sourcePaths } from './corpus.mjs'

const COMMAND = 'verify-type-equiv'
const named = (ts, node) => ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)
  || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node)
const keyOf = value => JSON.stringify([value.doc, value.symbol, value.projection ?? 'declaration'])

// A derivative reuses only the complete ordered family sequence, never a subset.
function partition(blocks) {
  const byDoc = new Map()
  for (const block of blocks) {
    const group = byDoc.get(block.doc)
    if (group) group.push(block)
    else byDoc.set(block.doc, [block])
  }
  const docs = new Set()
  for (const [file, sequence] of byDoc) {
    if (!file.endsWith('.zh.md')) continue
    const original = byDoc.get(`${file.slice(0, -'.zh.md'.length)}.md`)
    if (original?.length === sequence.length && sequence.every((block, index) => block.projection === original[index].projection && block.code === original[index].code)) docs.add(file)
  }
  return { primary: blocks.filter(block => !docs.has(block.doc)), derivatives: blocks.filter(block => docs.has(block.doc)) }
}

// mdast omits a real delimiter from value. Line counts also prevent delimiter-
// looking content (including indented/container content) from closing the fence.
function closed(node, lines) {
  const span = node.position.end.line - node.position.start.line + 1
  const count = node.value === '' ? [0, 1] : [node.value.split('\n').length]
  const last = lines[node.position.end.line - 1] ?? ''
  return /(?:`{3,}|~{3,})[\t ]*$/.test(last) && count.some(value => span === value + 2)
}

// AST leaves preserve literals/templates/regex bodies; the scanner only visits
// the trivia gaps, so comment-looking literal text is never erased or rewritten.
function normalize(ts, code) {
  const sf = ts.createSourceFile('type-equiv.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const exportStarts = new Set()
  for (const statement of sf.statements) {
    if (!named(ts, statement)) continue
    for (const modifier of statement.modifiers ?? []) {
      if ([ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].includes(modifier.kind)) exportStarts.add(modifier.getStart(sf))
    }
  }
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, code)
  const structure = []
  const jsdoc = []
  function visit(node) {
    if (ts.isJSDoc(node)) return
    const children = node.getChildren(sf)
    if (children.length) {
      for (const child of children) visit(child)
      return
    }
    const start = node.getStart(sf)
    while (scanner.getTextPos() < start) {
      const kind = scanner.scan()
      if (scanner.getTextPos() > start) throw new Error('compiler trivia crossed a declaration token')
      const text = scanner.getTokenText()
      if (kind === ts.SyntaxKind.MultiLineCommentTrivia && text.startsWith('/**')) jsdoc.push(text.replace(/\s+/g, ' ').trim())
    }
    if (node.kind !== ts.SyntaxKind.EndOfFileToken && !exportStarts.has(start)) structure.push([node.kind, node.getText(sf)])
    scanner.setTextPos(node.end)
  }
  visit(sf)
  return { structure, jsdoc }
}

function sourceJSDoc(ts, parsed, node) {
  return ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc)
    .map(doc => parsed.text.slice(doc.pos, doc.end)).join('\n')
}

function publicApi(ts, parsed, symbol) {
  const statement = parsed.sf.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === symbol)
  if (!statement) return null
  const abstract = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AbstractKeyword) ? 'abstract ' : ''
  const parameters = statement.typeParameters?.map(parameter => parameter.getText(parsed.sf)).join(', ')
  const heritage = statement.heritageClauses?.map(clause => clause.getText(parsed.sf)).join(' ')
  const header = `declare ${abstract}class ${symbol}${parameters ? `<${parameters}>` : ''}${heritage ? ` ${heritage}` : ''} {`
  const members = []
  for (const member of statement.members) {
    if (ts.isClassStaticBlockDeclaration(member)) continue
    const name = ts.getNameOfDeclaration(member)
    if (name && ts.isPrivateIdentifier(name)) continue
    const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined
    if (modifiers?.some(modifier => [ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword].includes(modifier.kind))) continue
    let end = member.end
    if ((ts.isConstructorDeclaration(member) || ts.isMethodDeclaration(member)
      || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) && member.body) end = member.body.getStart(parsed.sf)
    if (ts.isPropertyDeclaration(member) && member.initializer) end = member.initializer.getStart(parsed.sf)
    const signature = parsed.text.slice(member.getStart(parsed.sf), end).trimEnd().replace(/;$/, '').replace(/=\s*$/, '').trimEnd()
    const doc = sourceJSDoc(ts, parsed, member)
    members.push(`${doc ? `${doc}\n` : ''}${signature};`)
  }
  const doc = sourceJSDoc(ts, parsed, statement)
  return [doc, header, ...members, '}'].filter(Boolean).join('\n')
}

function mergedInterface(ts, load, entry) {
  const base = load(entry.source)
  const declaration = base.sf.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === entry.symbol)
  if (!declaration) return null
  const parts = [{ parsed: base, declaration }]
  for (const augmentation of entry.augmentations) {
    const parsed = load(augmentation.source)
    let addition
    for (const module of parsed.sf.statements) {
      if (!ts.isModuleDeclaration(module) || !ts.isStringLiteral(module.name)
        || module.name.text !== augmentation.module || !module.body || !ts.isModuleBlock(module.body)) continue
      addition = module.body.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === entry.symbol)
      if (addition) break
    }
    if (!addition) return null
    parts.push({ parsed, declaration: addition })
  }
  const parameters = declaration.typeParameters?.map(parameter => parameter.getText(base.sf)).join(', ')
  // Merge heritage types into one valid extends clause rather than concatenating
  // repeated extends keywords from separate interface declarations.
  const heritage = parts.flatMap(part => part.declaration.heritageClauses?.flatMap(clause => clause.types.map(type => type.getText(part.parsed.sf))) ?? [])
  const docs = parts.map(part => sourceJSDoc(ts, part.parsed, part.declaration)).filter(Boolean)
  const members = parts.flatMap(part => part.declaration.members.map(member => {
    const doc = sourceJSDoc(ts, part.parsed, member)
    return `${doc ? `${doc}\n` : ''}${part.parsed.text.slice(member.getStart(part.parsed.sf), member.end)}`
  }))
  return [...docs, `interface ${entry.symbol}${parameters ? `<${parameters}>` : ''}${heritage.length ? ` extends ${heritage.join(', ')}` : ''} {`, ...members, '}'].join('\n')
}

function entriesFrom(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.entries)) throw new Error('manifest must contain an entries array')
  return raw.entries.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('manifest entry must be an object')
    for (const field of Object.keys(entry)) if (!['doc', 'symbol', 'source', 'projection', 'augmentations'].includes(field)) throw new Error(`unknown manifest entry field: ${field}`)
    if (typeof entry.symbol !== 'string' || entry.symbol.length === 0) throw new Error('manifest symbol must be non-empty')
    if (entry.projection !== undefined && entry.projection !== 'public-api') throw new Error('projection must be public-api or omitted')
    let augmentations
    if (entry.augmentations !== undefined) {
      if (!Array.isArray(entry.augmentations)) throw new Error('augmentations must be an array')
      if (entry.projection !== undefined) throw new Error('augmentations apply to complete interfaces, not public-api projections')
      augmentations = entry.augmentations.map(value => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('augmentation must be an object')
        for (const field of Object.keys(value)) if (!['source', 'module'].includes(field)) throw new Error(`unknown augmentation field: ${field}`)
        if (typeof value.module !== 'string' || value.module.length === 0) throw new Error('augmentation module must be a non-empty string literal')
        return { source: repositoryPath(value.source), module: value.module }
      })
    }
    return { doc: repositoryPath(entry.doc), symbol: entry.symbol, source: repositoryPath(entry.source), ...(entry.projection ? { projection: entry.projection } : {}), ...(augmentations !== undefined ? { augmentations } : {}) }
  })
}

async function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/type-equiv.json'
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index++) {
    const flag = args[index]
    if (!['--root', '--config'].includes(flag)) throw new Error(`unknown argument: ${flag}`)
    const value = args[++index]
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
    if (flag === '--root') root = value
    else configPath = repositoryPath(value)
  }
  root = resolve(root)
  const config = JSON.parse(readFileSync(resolve(root, configPath), 'utf8'))
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('config must be an object')
  const { manifest = '.doc-gates/type-equiv.manifest.json', ...corpus } = config
  const files = sourcePaths(root, corpus).sort()
  const manifestPath = repositoryPath(manifest)
  const entries = entriesFrom(JSON.parse(readFileSync(resolve(root, manifestPath), 'utf8')))
  let ts
  try { ts = createRequire(join(root, 'package.json'))('typescript') }
  catch (error) { throw new Error(`target TypeScript is unavailable; install the target project's compiler (${error.message})`) }
  let markdown
  try { markdown = await import('./markdown.mjs') }
  catch (error) {
    const { exitOnLoadFailure } = await import('./dependencies.mjs')
    exitOnLoadFailure(COMMAND, error)
  }
  const errors = []
  const docSet = new Set()
  const extracted = []
  for (const file of files) {
    const doc = relative(root, file).replaceAll('\\', '/')
    docSet.add(doc)
    const source = readFileSync(file, 'utf8')
    const lines = source.split(/\r\n?|\n/)
    markdown.visitMarkdown(markdown.parseMarkdown(source), node => {
      if (node.type !== 'code' || !node.position) return
      const info = node.lang == null ? '' : node.meta ? `${node.lang} ${node.meta}` : node.lang
      if (info === 'ts type-equiv public-api') errors.push(`${doc}:${node.position.start.line}: use the concise ts public-api fence`)
      if (info !== 'ts type-equiv' && info !== 'ts public-api') return
      if (!closed(node, lines)) { errors.push(`${doc}:${node.position.start.line}: unterminated type-equivalence fence`); return }
      const parsed = ts.createSourceFile('block.ts', node.value, ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
      const declaration = parsed.statements.find(statement => named(ts, statement) && statement.name)
      if (!declaration) { errors.push(`${doc}:${node.position.start.line}: block has no parseable interface/type/class/enum declaration`); return }
      extracted.push({ doc, line: node.position.start.line, code: node.value, symbol: declaration.name.text, ...(info === 'ts public-api' ? { projection: 'public-api' } : {}) })
    })
  }
  const { primary, derivatives } = partition(extracted)
  const blocks = new Map()
  for (const block of primary) {
    if (blocks.has(keyOf(block))) errors.push(`${block.doc}:${block.line}: duplicate type-equiv block for ${block.symbol}`)
    else blocks.set(keyOf(block), block)
  }
  const registered = new Map()
  for (const entry of entries) {
    if (!docSet.has(entry.doc)) errors.push(`manifest references ${entry.doc}, which is missing or outside the active corpus`)
    if (registered.has(keyOf(entry))) errors.push(`duplicate manifest entry for ${entry.symbol} in ${entry.doc}`)
    else registered.set(keyOf(entry), entry)
  }
  for (const block of primary) if (!registered.has(keyOf(block))) errors.push(`${block.doc}:${block.line}: ${block.symbol} has no manifest entry`)
  for (const entry of entries) if (!blocks.has(keyOf(entry))) errors.push(`manifest entry ${entry.symbol} (${entry.doc}) has no matching block`)
  const sources = new Map()
  function loadSource(source) {
    let parsed = sources.get(source)
    if (!parsed) {
      const text = readFileSync(resolve(root, source), 'utf8')
      parsed = { text, sf: ts.createSourceFile(source, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS) }
      sources.set(source, parsed)
    }
    return parsed
  }
  let verified = 0
  for (const entry of entries) {
    const block = blocks.get(keyOf(entry))
    if (!block) continue
    const parsed = loadSource(entry.source)
    const declaration = parsed.sf.statements.find(statement => named(ts, statement) && statement.name?.text === entry.symbol)
    const text = entry.augmentations !== undefined ? mergedInterface(ts, loadSource, entry)
      : entry.projection === 'public-api' ? publicApi(ts, parsed, entry.symbol)
      : declaration ? parsed.text.slice(declaration.getStart(parsed.sf, true), declaration.end) : null
    if (text === null) { errors.push(`symbol ${entry.symbol} not found for ${entry.projection ?? 'declaration'} in ${entry.source}`); continue }
    if (JSON.stringify(normalize(ts, text)) !== JSON.stringify(normalize(ts, block.code))) errors.push(`DRIFT: ${block.doc}:${block.line}: ${entry.symbol} does not match ${entry.source} structure/JSDoc`)
    else verified++
  }
  if (errors.length) {
    console.error(`${COMMAND}: verification failed:\n${errors.map(error => `  ${error}`).join('\n')}`)
    process.exitCode = 1
  } else console.log(`${COMMAND}: ${verified} block(s) match source structure/JSDoc (1:1 with manifest); ${derivatives.length} paired derivative(s).`)
}
main().catch(error => {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
})
