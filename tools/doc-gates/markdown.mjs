// Portable Markdown parsing and destination-offset helpers for the doc gates.
// Adapted from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/markdown.ts.
// License: ../../SOURCE-LICENSE.txt. Only the members the doc gates use are ported.
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'

/** Parse GitHub-flavored Markdown with the source repository's standard extensions. */
export function parseMarkdown(source) {
  return fromMarkdown(source, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
}

/**
 * Visit a Markdown tree depth-first; returning false prunes a node's children.
 * @param node - current tree node.
 * @param visitor - callback invoked before each node's children.
 */
export function visitMarkdown(node, visitor) {
  if (visitor(node) === false) return
  if ('children' in node) {
    for (const child of node.children) visitMarkdown(child, visitor)
  }
}

/** Whether a Markdown URL is external, repository-root absolute, or purely in-page. */
export function isExternalOrAbsoluteMarkdownUrl(url) {
  return url.startsWith('#')
    || url.startsWith('//')
    || url.startsWith('/')
    || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)
}

/** Split one Markdown URL without normalizing its query or fragment suffix. */
export function splitMarkdownUrlTarget(url) {
  const boundary = url.search(/[?#]/)
  if (boundary === -1) return { path: url, suffix: '' }
  return { path: url.slice(0, boundary), suffix: url.slice(boundary) }
}

function skipWhitespace(source, start) {
  let index = start
  while (/\s/.test(source[index] ?? '')) index += 1
  return index
}

function labelEnd(source) {
  const first = source.indexOf('[')
  if (first === -1) return -1
  let depth = 0
  for (let index = first; index < source.length; index += 1) {
    const char = source[index]
    if (char === '\\') index += 1
    else if (char === '[') depth += 1
    else if (char === ']') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function destinationRange(rawNode, type) {
  const endOfLabel = labelEnd(rawNode)
  if (endOfLabel === -1) throw new Error(`markdown: cannot locate label end in ${JSON.stringify(rawNode)}`)
  let start
  if (type === 'definition') {
    const colon = rawNode.indexOf(':', endOfLabel + 1)
    if (colon === -1) throw new Error(`markdown: cannot locate definition separator in ${JSON.stringify(rawNode)}`)
    start = skipWhitespace(rawNode, colon + 1)
  } else {
    if (rawNode[endOfLabel + 1] !== '(') {
      throw new Error(`markdown: cannot locate inline destination in ${JSON.stringify(rawNode)}`)
    }
    start = skipWhitespace(rawNode, endOfLabel + 2)
  }
  if (rawNode[start] === '<') {
    for (let index = start + 1; index < rawNode.length; index += 1) {
      if (rawNode[index] === '\\') index += 1
      else if (rawNode[index] === '>') return { start: start + 1, end: index }
    }
    throw new Error(`markdown: cannot locate angle-bracket destination end in ${JSON.stringify(rawNode)}`)
  }
  let depth = 0
  for (let index = start; index < rawNode.length; index += 1) {
    const char = rawNode[index]
    if (char === '\\') index += 1
    else if (char === '(') depth += 1
    else if (char === ')') {
      if (depth === 0) return { start, end: index }
      depth -= 1
    } else if (/\s/.test(char ?? '') && depth === 0) {
      return { start, end: index }
    }
  }
  return { start, end: rawNode.length }
}

/** Locate one parsed destination in the original Markdown without reserializing it. */
export function markdownDestination(source, node) {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) {
    throw new Error(`markdown: destination ${JSON.stringify(node.url)} has no source offsets`)
  }
  const range = destinationRange(source.slice(start, end), node.type)
  const absolute = { start: start + range.start, end: start + range.end }
  return { ...absolute, url: source.slice(absolute.start, absolute.end) }
}
