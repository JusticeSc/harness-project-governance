#!/usr/bin/env node
// Relative link/fragment checks adapted from DeepSeek Harness687f282e scripts/verify-md-links.ts.
// License: ../../SOURCE-LICENSE.txt. Target corpus paths are explicit, not the source product's globs.
// Usage: node tools/doc-gates/verify-md-links.mjs [--root <dir>] [--config <relative-json>]
// Exit0: checked; exit1: broken links; exit2: unusable invocation, corpus or parser prerequisite.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { repositoryPath, sourcePaths } from './corpus.mjs'

const COMMAND = 'verify-md-links'


/** Heading text as rendered by Markdown, including image alt text but not raw HTML. */
function renderedText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value
  if (node.type === 'image' || node.type === 'imageReference') return node.alt ?? ''
  if (node.type === 'break') return ' '
  return 'children' in node ? node.children.map(renderedText).join('') : ''
}

function decoded(value) {
  try { return decodeURIComponent(value) } catch (error) {
    // A malformed URI escape remains literal and is reported by target/anchor lookup.
    if (error instanceof URIError) return value
    throw error
  }
}

/** Parse a source/target once; exact case and occupied-set heading suffixes match the source gate. */
function documentCache(parseMarkdown, visitMarkdown) {
  const documents = new Map()
  const existence = new Map()
  return {
    exists(path) {
      if (!existence.has(path)) existence.set(path, existsSync(path))
      return existence.get(path)
    },
    document(path) {
      if (documents.has(path)) return documents.get(path)
      const tree = parseMarkdown(readFileSync(path, 'utf8'))
      const anchors = new Set()
      const occurrences = new Map()
      const destinations = []
      visitMarkdown(tree, node => {
        if (node.type === 'heading') {
          const base = renderedText(node).toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-')
          let slug = base
          let bump = occurrences.get(base) ?? 0
          while (anchors.has(slug)) slug = `${base}-${++bump}`
          occurrences.set(base, bump)
          anchors.add(slug)
        }
        if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
          destinations.push({ url: node.url, line: node.position?.start.line ?? 0 })
        }
      })
      // HTML anchors are added after every heading, as in the source. Code nodes never count.
      visitMarkdown(tree, node => {
        if (node.type !== 'html') return
        const html = node.value.replace(/<!--[\s\S]*?-->/g, '')
        for (const match of html.matchAll(/<a id="([^"]+)"/g)) anchors.add(match[1])
      })
      const document = { anchors, destinations }
      documents.set(path, document)
      return document
    },
  }
}

async function main() {
  let root = process.cwd()
  let configPath = '.doc-gates/markdown-links.json'
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
  const cache = documentCache(markdown.parseMarkdown, markdown.visitMarkdown)
  const violations = []
  for (const file of files) {
    for (const { url, line } of cache.document(file).destinations) {
      if (url.startsWith('/') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) continue
      const target = decoded(url.replace(/[#?].*$/, ''))
      const resolved = target === '' ? file : resolve(dirname(file), target)
      let reason
      if (!cache.exists(resolved)) reason = 'target does not exist'
      else {
        const hash = url.indexOf('#')
        if (hash !== -1 && resolved.endsWith('.md')) {
          const fragment = decoded(url.slice(hash + 1).replace(/\?.*$/, ''))
          if (!cache.document(resolved).anchors.has(fragment)) reason = 'no such anchor in target'
        }
      }
      if (reason) violations.push({ file: relative(root, file).replaceAll('\\', '/'), line, url, reason })
    }
  }
  if (violations.length) {
    console.error(`${COMMAND}: broken relative cross-links found:`)
    for (const violation of violations) console.error(`  ${violation.file}:${violation.line}  ${violation.url}  (${violation.reason})`)
    process.exitCode = 1
  } else {
    console.log(`${COMMAND}: ${files.length} file(s) checked, all relative cross-links and fragments resolve.`)
  }
}

main().catch(error => {
  console.error(`${COMMAND}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
})
