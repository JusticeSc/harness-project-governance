#!/usr/bin/env node
// Adapted from DeepSeek Harness687f282e scripts/doc-typecheck.ts,
// doc-typecheck-paths.ts and paired-markdown-derivatives.ts. License: ../../SOURCE-LICENSE.txt.
// The target explicitly owns its corpus, tsconfig and TypeScript installation.
import { execFileSync } from 'node:child_process'
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { repositoryPath, sourcePaths } from './corpus.mjs'

const COMMAND = 'doc-typecheck'
const KINDS = new Map([
  ['ts', 'check'], ['ts ignore-check', 'ignore'],
  ['ts type-equiv', 'type-equiv'], ['ts public-api', 'type-equiv'],
  ['ts cordis-catalog', 'cordis-catalog'], ['ts persistence-catalog', 'persistence-catalog'],
  ['ts config-catalog', 'config-catalog'],
])

function partition(blocks) {
  const byDoc = new Map()
  for (const block of blocks) {
    const group = byDoc.get(block.file)
    if (group) group.push(block)
    else byDoc.set(block.file, [block])
  }
  const derivativeDocs = new Set()
  for (const [file, candidates] of byDoc) {
    if (!file.endsWith('.zh.md')) continue
    const originals = byDoc.get(`${file.slice(0, -'.zh.md'.length)}.md`)
    if (originals?.length === candidates.length && candidates.every((block, index) => {
      const original = originals[index]
      return original.kind === block.kind && original.code === block.code
    })) derivativeDocs.add(file)
  }
  return {
    primary: blocks.filter(block => !derivativeDocs.has(block.file)),
    derivatives: blocks.filter(block => derivativeDocs.has(block.file)),
  }
}

function builtDeclarationPath(candidate) {
  if (candidate.endsWith('/src')) return `${candidate.slice(0, -4)}/lib/types`
  if (candidate.endsWith('/src/*')) return `${candidate.slice(0, -6)}/lib/types/*`
  if (candidate.includes('/examples/')) return candidate
  const file = /^(.*)\/src\/(.+)\.ts$/.exec(candidate)
  if (file) return `${file[1]}/lib/types/${file[2]}.d.ts`
  const directory = /^(.*)\/src\/(.+)$/.exec(candidate)
  if (directory) return `${directory[1]}/lib/types/${directory[2]}`
  throw new Error(`cannot map source alias to built declarations: ${candidate}; use project mode for other target layouts`)
}

function remapDiagnostics(output, blocks) {
  return output.replace(/^(?:[^\r\n]*[/\\])?block-(\d+)\.ts\((\d+),(\d+)\)/gm, (original, index, line, column) => {
    const block = blocks[Number(index)]
    return block ? `${block.file} (block at line ${block.line}, +${line}:${column})` : original
  })
}

function loadConfig(ts, root, configPath, blocks) {
  const input = ts.readConfigFile(configPath, ts.sys.readFile)
  if (input.error) throw new Error(ts.flattenDiagnosticMessageText(input.error.messageText, '\n'))
  // Parse the target's settings/references, but with the actual documentation inputs.
  // Its normal include/exclude list must not discard the virtual documentation project.
  const projected = JSON.stringify({
    ...input.config,
    files: blocks.map((_, index) => resolve(root, '.doc-typecheck', `block-${index}.ts`)),
    include: [],
    exclude: [],
  })
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
    ...ts.sys,
    readFile: file => resolve(file) === configPath ? projected : ts.sys.readFile(file),
    getCurrentDirectory: () => root,
    onUnRecoverableConfigFileDiagnostic(diagnostic) {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    },
  })
  if (!parsed) throw new Error(`cannot parse ${configPath}`)
  if (parsed.errors.length) throw new Error(parsed.errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'))
  return parsed
}

function compileDeclarations(ts, root, parsed, blocks) {
  if (parsed.options.paths === undefined) throw new Error('declarations mode requires tsconfig paths for source-to-lib/types mapping')
  const options = {
    ...parsed.options,
    paths: Object.fromEntries(Object.entries(parsed.options.paths).map(([specifier, paths]) => [specifier, paths.map(builtDeclarationPath)])),
    noEmit: true, composite: false, incremental: false,
    declaration: false, declarationMap: false, emitDeclarationOnly: false, sourceMap: false,
    noCheck: false, noUnusedLocals: false, noUnusedParameters: false,
    rootDir: root,
  }
  delete options.tsBuildInfoFile
  const sources = new Map(blocks.map((block, index) => [resolve(root, '.doc-typecheck', `block-${index}.ts`), `${block.code}\n`]))
  const base = ts.createCompilerHost(options, true)
  const host = {
    ...base,
    fileExists: file => sources.has(resolve(file)) || base.fileExists(file),
    readFile: file => sources.get(resolve(file)) ?? base.readFile(file),
    getSourceFile(file, version, onError, fresh) {
      const source = sources.get(resolve(file))
      return source === undefined ? base.getSourceFile(file, version, onError, fresh) : ts.createSourceFile(file, source, version, true)
    },
    writeFile() { throw new Error('noEmit compilation attempted to write output') },
  }
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([...sources.keys()], options, host))
  return diagnostics.length ? remapDiagnostics(ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: file => file,
    getCurrentDirectory: () => root,
    getNewLine: () => ts.sys.newLine,
  }), blocks) : undefined
}

function compileProject(root, configPath, parsed, compilerPath, blocks) {
  const temporary = mkdtempSync(join(root, '.doc-typecheck-'))
  // A derived config must keep the selected config's directory: relocating it
  // changes every ${configDir} template, not only paths/typeRoots known today.
  const project = join(dirname(configPath), `${basename(temporary)}.json`)
  let projectCreated = false
  const fileNames = blocks.map((_, index) => join(temporary, `block-${index}.ts`))
  try {
    const projected = JSON.stringify({
      extends: configPath,
      compilerOptions: {
        noCheck: false, noUnusedLocals: false, noUnusedParameters: false,
        composite: false, incremental: true, noEmit: true,
        rootDir: root, outDir: join(temporary, 'output'),
        tsBuildInfoFile: join(temporary, 'tsconfig.tsbuildinfo'),
      },
      files: fileNames,
      exclude: [],
      include: [],
      // TypeScript has already resolved these against the owning config, including nested configs.
      references: (parsed.projectReferences ?? []).map(reference => ({ path: reference.path })),
    })
    // Never overwrite or clean up a pre-existing file with the random sibling name.
    const descriptor = openSync(project, 'wx')
    projectCreated = true
    try {
      writeFileSync(descriptor, projected)
    } finally {
      closeSync(descriptor)
    }
    for (const [index, block] of blocks.entries()) writeFileSync(fileNames[index], `${block.code}\n`)
    try {
      execFileSync(process.execPath, [compilerPath, '-b', project, '--pretty', 'false'], {
        cwd: root, encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
      })
      return undefined
    } catch (error) {
      if (typeof error.status !== 'number') throw error
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`
      return remapDiagnostics(output || `TypeScript exited ${error.status} without diagnostics.`, blocks)
    }
  } finally {
    try {
      if (projectCreated) rmSync(project, { force: true })
    } finally {
      rmSync(temporary, { recursive: true, force: true })
    }
  }
}

async function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/typecheck.json'
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
  if (typeof config !== 'object' || config === null || Array.isArray(config)) throw new Error('config must be an object')
  const { tsconfig = 'tsconfig.json', mode = 'project', ...corpus } = config
  if (!['project', 'declarations'].includes(mode)) throw new Error('mode must be project or declarations')
  const files = sourcePaths(root, corpus).sort()
  const compilerConfig = resolve(root, repositoryPath(tsconfig))
  const targetRequire = createRequire(join(root, 'package.json'))
  let ts
  let compilerPath
  try {
    ts = targetRequire('typescript')
    compilerPath = targetRequire.resolve('typescript/bin/tsc')
  } catch (error) {
    throw new Error(`target TypeScript is unavailable; install the target project's compiler before checking documentation (${error.message})`)
  }
  let markdown
  try {
    markdown = await import('./markdown.mjs')
  } catch (error) {
    const { exitOnLoadFailure } = await import('./dependencies.mjs')
    exitOnLoadFailure(COMMAND, error)
  }
  const extracted = []
  for (const absolute of files) {
    const file = relative(root, absolute).replaceAll('\\', '/')
    markdown.visitMarkdown(markdown.parseMarkdown(readFileSync(absolute, 'utf8')), node => {
      if (node.type !== 'code' || !node.position) return
      const info = node.lang == null ? '' : node.meta ? `${node.lang} ${node.meta}` : node.lang
      const kind = KINDS.get(info)
      if (kind) extracted.push({ file, line: node.position.start.line, kind, code: node.value })
    })
  }
  const { primary, derivatives } = partition(extracted)
  const checked = primary.filter(block => block.kind === 'check')
  const ignored = primary.filter(block => block.kind === 'ignore')
  if (!checked.length) {
    console.log(`${COMMAND}: no ts code blocks to check.`)
    return
  }
  const parsed = loadConfig(ts, root, compilerConfig, checked)
  const compilationError = mode === 'declarations'
    ? compileDeclarations(ts, root, parsed, checked)
    : compileProject(root, compilerConfig, parsed, compilerPath, checked)
  if (compilationError !== undefined) {
    console.error(`${COMMAND}: documentation code blocks failed to compile.\n\n${compilationError}`)
    process.exitCode = 1
    return
  }
  const denominator = checked.length + ignored.length
  const ratio = ignored.length / denominator
  console.log(`${COMMAND}: ${checked.length} block(s) compiled, ${ignored.length} ignored (${(ratio * 100).toFixed(0)}% opt-out), ${primary.length - denominator} type-equiv/catalog (checked elsewhere), ${derivatives.length} paired derivative(s).`)
  if (denominator >= 4 && ratio > 0.5) {
    console.error(`${COMMAND}: too many blocks opt out of checking (${ignored.length}/${denominator}). Make them compile or delete them.`)
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
})
