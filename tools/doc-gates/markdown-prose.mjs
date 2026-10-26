// Source-preserving heading/prose views adapted from DeepSeek Harness687f282e scripts/markdown.ts:174-277.
// License: ../../SOURCE-LICENSE.txt. Code and rendered-away HTML comments do not satisfy prose requirements.
import { parseMarkdown, visitMarkdown } from './markdown.mjs'

function renderedText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value
  if (node.type === 'image' || node.type === 'imageReference') return node.alt ?? ''
  if (node.type === 'break') return ' '
  return 'children' in node ? node.children.map(renderedText).join('') : ''
}

export function markdownHeadingLines(source, tree = parseMarkdown(source)) {
  const rawLines = source.split('\n')
  const headings = []
  visitMarkdown(tree, node => {
    if (node.type !== 'heading' || node.position === undefined) return
    headings.push({ depth: node.depth, index: node.position.start.line, raw: rawLines[node.position.start.line - 1] ?? '', text: renderedText(node) })
  })
  return headings
}

function htmlCommentRanges(tree, rawLines) {
  const comments = []
  visitMarkdown(tree, node => {
    if (node.type !== 'html' || node.position?.start.offset === undefined) return
    let cursor = 0
    while (true) {
      const start = node.value.indexOf('<!--', cursor)
      if (start < 0) break
      const close = node.value.indexOf('-->', start + '<!--'.length)
      const end = close < 0 ? node.value.length : close + '-->'.length
      comments.push([node.position.start.offset + start, node.position.start.offset + end])
      cursor = end
    }
  })
  const ranges = new Map()
  let lineOffset = 0
  rawLines.forEach((raw, index) => {
    const lineEnd = lineOffset + raw.length
    for (const [start, end] of comments) {
      const from = Math.max(start, lineOffset)
      const to = Math.min(end, lineEnd)
      const coversEmptyLine = raw.length === 0 && start <= lineOffset && end > lineOffset
      if (from < to || coversEmptyLine) {
        const lineRanges = ranges.get(index + 1) ?? []
        lineRanges.push([from - lineOffset, to - lineOffset])
        ranges.set(index + 1, lineRanges)
      }
    }
    lineOffset = lineEnd + 1
  })
  return ranges
}

function hasRenderedTextOutsideComments(raw, ranges) {
  if (ranges === undefined) return true
  let cursor = 0
  let visible = ''
  for (const [start, end] of [...ranges].sort((left, right) => left[0] - right[0])) {
    visible += raw.slice(cursor, start)
    cursor = Math.max(cursor, end)
  }
  visible += raw.slice(cursor)
  return visible.trim().length > 0
}

export function markdownProseLines(source, tree = parseMarkdown(source)) {
  const rawLines = source.split('\n')
  const comments = htmlCommentRanges(tree, rawLines)
  const fenced = new Set()
  visitMarkdown(tree, node => {
    if (node.type !== 'code' || node.position === undefined) return
    for (let line = node.position.start.line; line <= node.position.end.line; line += 1) fenced.add(line)
  })
  const kept = []
  rawLines.forEach((raw, index) => {
    if (fenced.has(index + 1)) return
    if (hasRenderedTextOutsideComments(raw, comments.get(index + 1))) kept.push({ index: index + 1, raw })
  })
  return kept
}
