// Locale-aware resolution and byte-preserving normalization for bilingual Markdown links.
// Adapted from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/translation-links.ts.
// License: ../../SOURCE-LICENSE.txt. The source module's write-side rewrite helper is not ported:
// no shipped command rewrites links, and inventing a caller would change the gate's contract.
import { existsSync, statSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import {
  isExternalOrAbsoluteMarkdownUrl,
  markdownDestination,
  parseMarkdown,
  splitMarkdownUrlTarget,
  visitMarkdown,
} from './markdown.mjs'

/**
 * Offset of the one top-level switcher link immediately following the H1.
 * @param tree - GFM parse of `markdown`.
 * @param markdown - Exact authored Markdown text used for offsets.
 * @param acceptedTargets - Accepted switcher destinations.
 * @returns The switcher link's source offset, or undefined when the canonical switcher is absent.
 */
export function languageSwitcherLinkOffset(tree, markdown, acceptedTargets) {
  if (tree.type !== 'root') return undefined
  const accepted = new Set(typeof acceptedTargets === 'string' ? [acceptedTargets] : acceptedTargets)
  const headingIndex = tree.children.findIndex(node => node.type === 'heading' && node.depth === 1)
  if (headingIndex < 0) return undefined
  for (const node of tree.children.slice(headingIndex + 1)) {
    if (node.type === 'heading') return undefined
    if (node.type !== 'paragraph' || node.position === undefined) continue
    const start = node.position.start.offset
    const end = node.position.end.offset
    if (start === undefined || end === undefined) continue
    const authored = markdown.slice(start, end)
    if (!/^(?:English \| \[中文\]\([^\n]+\)|\[English\]\([^\n]+\) \| 中文)$/.test(authored)) continue
    const links = node.children.filter(child => child.type === 'link')
    if (links.length === 1 && accepted.has(links[0]?.url ?? '')) {
      return links[0]?.position?.start.offset
    }
  }
  return undefined
}

/** Whether the tree carries its canonical top-level language switcher. */
export function hasLanguageSwitcher(tree, markdown, acceptedTargets) {
  return languageSwitcherLinkOffset(tree, markdown, acceptedTargets) !== undefined
}

function decodePath(path) {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function worktreeFileExists(repoRoot, repoPath) {
  try {
    const path = resolve(repoRoot, repoPath)
    return existsSync(path) && statSync(path).isFile()
  } catch {
    return false
  }
}

function repositoryFileExists(context, repoPath) {
  return context.repositoryFileExists?.(repoPath) ?? worktreeFileExists(context.repoRoot, repoPath)
}

function repositoryRelativePath(path) {
  const normalized = posix.normalize(path)
  if (normalized === '' || normalized === '.' || normalized === '..' || normalized.startsWith('../') || posix.isAbsolute(normalized)) {
    return undefined
  }
  return normalized
}

function resolveRepositoryTarget(rawPath, context) {
  const decoded = decodePath(rawPath)
  const exact = repositoryRelativePath(posix.join(posix.dirname(context.sourcePath), decoded))
  if (exact === undefined) return undefined
  return repositoryFileExists(context, exact) ? exact : undefined
}

function translationPairTarget(targetPath, context) {
  const source = targetPath.endsWith('.zh.md')
    ? targetPath.replace(/\.zh\.md$/, '.md')
    : targetPath.endsWith('.md') ? targetPath : undefined
  if (source === undefined || !context.isTranslationPairSource(source)) return undefined
  const zh = source.replace(/\.md$/, '.zh.md')
  return { source, zh }
}

function encodePathSegment(segment) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, character => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ))
}

function relativeExpectedPath(context, expectedPath, rawPath) {
  const relative = posix.relative(posix.dirname(context.sourcePath), expectedPath)
  const encoded = relative.split('/').map(encodePathSegment).join('/')
  return rawPath.startsWith('./') && !encoded.startsWith('.') ? `./${encoded}` : encoded
}

function expectedLocalePath(rawPath, locale, context, expectedPath) {
  if (locale === 'zh' && rawPath.endsWith('.md') && !rawPath.endsWith('.zh.md')) {
    return rawPath.replace(/\.md$/, '.zh.md')
  }
  if (locale === 'en' && rawPath.endsWith('.zh.md')) return rawPath.replace(/\.zh\.md$/, '.md')
  return relativeExpectedPath(context, expectedPath, rawPath)
}

function resolveTranslationLink(url, context, authoredUrl) {
  if (isExternalOrAbsoluteMarkdownUrl(url)) return undefined
  const { path } = splitMarkdownUrlTarget(url)
  const authored = splitMarkdownUrlTarget(authoredUrl)
  if (path === '') return undefined
  const targetPath = resolveRepositoryTarget(path, context)
  if (targetPath === undefined) return undefined
  const pair = translationPairTarget(targetPath, context)
  if (pair === undefined) return undefined
  const locale = context.sourcePath.endsWith('.zh.md') ? 'zh' : 'en'
  const expectedPath = locale === 'zh' ? pair.zh : pair.source
  return {
    pair,
    targetPath,
    suffix: authored.suffix,
    expectedPath,
    expectedUrl: `${expectedLocalePath(authored.path, locale, context, expectedPath)}${authored.suffix}`,
    locale,
  }
}

function hasExpectedLocale(resolved) {
  return resolved.targetPath === resolved.expectedPath
}

function replacementFor(destination, value) {
  return { start: destination.start, end: destination.end, value }
}

function authoredExternalTarget(markdown, node) {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) {
    throw new Error(`translation-links: external link ${JSON.stringify(node.url)} has no source offsets`)
  }
  const raw = markdown.slice(start, end)
  if (node.type === 'definition' || raw.startsWith('[')) return markdownDestination(markdown, node).url
  if (raw.startsWith('<') && raw.endsWith('>')) return raw.slice(1, -1)
  return raw
}

function applyReplacements(markdown, replacements) {
  let output = markdown
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end)
  }
  return output
}

function visitDocumentLinkNodes(markdown, skipTargets, visitor, tree = parseMarkdown(markdown)) {
  const switcherOffset = languageSwitcherLinkOffset(tree, markdown, skipTargets)
  const referencedIdentifiers = new Set()
  const visitedDefinitions = new Set()
  visitMarkdown(tree, (node) => {
    if (node.type === 'linkReference') referencedIdentifiers.add(node.identifier)
  })
  visitMarkdown(tree, (node) => {
    if (node.type === 'link' && node.position?.start.offset === switcherOffset) return
    if (node.type === 'link') {
      visitor(node)
    } else if (node.type === 'definition'
      && referencedIdentifiers.has(node.identifier)
      && !visitedDefinitions.has(node.identifier)) {
      visitedDefinitions.add(node.identifier)
      visitor(node)
    }
  })
}

function visitResolvedDocumentLinks(markdown, context, skipTargets, visitor, tree) {
  visitDocumentLinkNodes(markdown, skipTargets, (node) => {
    if (isExternalOrAbsoluteMarkdownUrl(node.url)) return
    const destination = markdownDestination(markdown, node)
    const resolved = resolveTranslationLink(node.url, context, destination.url)
    if (resolved !== undefined) visitor(node, destination, resolved)
  }, tree)
}

/**
 * Return one violation per wrong-locale link or link definition.
 * @param markdown - Exact authored Markdown text used for link offsets.
 * @param context - Repository and locale used to resolve relative links.
 * @param skipTargets - Accepted language-switcher destinations.
 * @param tree - Optional GFM parse of this exact Markdown text; never a normalized or edited document.
 * @returns Wrong-locale links in document order.
 */
export function translationLinkLocaleViolations(markdown, context, skipTargets = [], tree) {
  const violations = []
  visitResolvedDocumentLinks(markdown, context, skipTargets, (node, destination, resolved) => {
    if (hasExpectedLocale(resolved)) return
    violations.push({
      sourcePath: context.sourcePath,
      line: node.position?.start.line ?? 0,
      url: destination.url,
      expectedUrl: resolved.expectedUrl,
    })
  }, tree)
  return violations
}

/**
 * Normalize only paired-document locale paths and report each replaced destination.
 * @param markdown - Exact authored Markdown text used for link offsets.
 * @param context - Repository and locale used to resolve relative links.
 * @param skipTargets - Accepted language-switcher destinations.
 * @param tree - Optional GFM parse of this exact Markdown text; never a normalized or edited document.
 * @returns The normalized text plus the authored destination ranges it replaced.
 */
export function normalizeTranslationMarkdownLinkEdits(markdown, context, skipTargets = [], tree) {
  const edits = []
  visitResolvedDocumentLinks(markdown, context, skipTargets, (node, destination, resolved) => {
    edits.push({
      node,
      ...replacementFor(destination, `dsh-translation-target:${resolved.pair.source}${resolved.suffix}`),
    })
  }, tree)
  const content = applyReplacements(markdown, [...edits])
  return { content, edits: edits.sort((left, right) => left.start - right.start) }
}

/**
 * Normalize only paired-document locale paths while retaining every other byte and URL suffix.
 * @param markdown - Exact authored Markdown text used for link offsets.
 * @param context - Repository and locale used to resolve relative links.
 * @param skipTargets - Accepted language-switcher destinations.
 * @param tree - Optional GFM parse of this exact Markdown text; never a normalized or edited document.
 * @returns Markdown with paired-document destinations replaced by semantic targets.
 */
export function normalizeTranslationMarkdownLinks(markdown, context, skipTargets = [], tree) {
  return normalizeTranslationMarkdownLinkEdits(markdown, context, skipTargets, tree).content
}

/** Semantic target of one authored inline link or referenced definition. */
export function semanticTranslationLinkNodeTarget(node, markdown, context) {
  if (isExternalOrAbsoluteMarkdownUrl(node.url)) return authoredExternalTarget(markdown, node)
  const destination = markdownDestination(markdown, node)
  const resolved = resolveTranslationLink(node.url, context, destination.url)
  return resolved === undefined
    ? destination.url
    : `dsh-translation-target:${resolved.pair.source}${resolved.suffix}`
}
