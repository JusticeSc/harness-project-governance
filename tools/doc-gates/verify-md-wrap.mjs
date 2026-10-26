#!/usr/bin/env node
// Paragraph hard-wrap checks adapted from DeepSeek Harness687f282e scripts/verify-md-wrap.ts.
// License: ../../SOURCE-LICENSE.txt. Target corpus discovery is explicit; the checker never rewrites.
// Usage: node <skill>/tools/doc-gates/verify-md-wrap.mjs [--root <dir>] [--config <relative-json>]
// Exit0: checked; exit1: multiline prose paragraphs; exit2: unusable invocation/corpus/parser.
import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { repositoryPath, sourcePaths } from './corpus.mjs'

const COMMAND = 'verify-md-wrap'

function maskVitePressStructure(lines) {
  const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1
  return lines.map((line, index) => index <= frontmatterEnd || line.trimStart().startsWith(':::') ? '' : line).join('\n')
}

async function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/markdown-wrap.json'
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (!['--root', '--config'].includes(flag)) throw new Error(`unknown argument: ${flag}`)
    const value = args[++index]
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
    if (flag === '--root') root = value
    else configPath = repositoryPath(value)
  }
  root = resolve(root)
  const config = JSON.parse(readFileSync(resolve(root, configPath), 'utf8'))
  const files = sourcePaths(root, config)
  let markdown
  try {
    markdown = await import('./markdown.mjs')
  } catch (error) {
    const { exitOnLoadFailure } = await import('./dependencies.mjs')
    exitOnLoadFailure(COMMAND, error)
  }
  const violations = []
  for (const absolute of files) {
    const lines = readFileSync(absolute, 'utf8').split('\n')
    const tree = markdown.parseMarkdown(maskVitePressStructure(lines))
    markdown.visitMarkdown(tree, node => {
      if (node.type !== 'paragraph' || !node.position) return
      const { start, end } = node.position
      if (end.line > start.line) {
        const text = (lines[start.line - 1] ?? '').trim()
        violations.push({ file: relative(root, absolute).replaceAll('\\', '/'), line: start.line, text })
      }
      return false
    })
  }
  if (violations.length) {
    console.error(`${COMMAND}: hard-wrapped prose paragraphs found (write one physical line per paragraph):`)
    for (const { file, line, text } of violations) console.error(`  ${file}:${line}  ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`)
    process.exitCode = 1
  } else console.log(`${COMMAND}: ${files.length} file(s) checked, no hard-wrapped prose paragraphs.`)
}

main().catch(error => {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
})
