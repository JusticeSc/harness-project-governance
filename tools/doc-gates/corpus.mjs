// Explicit target Markdown discovery shared by portable link and wrapping checks.
// Adapted from fixed-source repository discovery; archive roots exclude sources, not link targets.
import { readdirSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'

export { repositoryPath, sourcePaths }
function repositoryPath(value) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value) || /^[A-Za-z]:/.test(value)) {
    throw new Error('corpus paths must be non-empty repository-relative paths')
  }
  const path = value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+$/, '')
  if (path === '' || path.split('/').some(segment => segment === '..' || segment === '' || /[*?\[\]{}]/.test(segment))) {
    throw new Error(`declare literal corpus paths, not globs or parent paths: ${value}`)
  }
  return path
}

/** Resolve the target's explicit authored corpus; archive history is never a source. */
function sourcePaths(root, config) {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) throw new Error('corpus config must be an object')
  for (const key of Object.keys(config)) {
    if (!['roots', 'files', 'archiveRoots'].includes(key)) throw new Error(`unknown corpus field: ${key}`)
  }
  const arrays = {}
  for (const key of ['roots', 'files', 'archiveRoots']) {
    const value = config[key] ?? (key === 'archiveRoots' ? ['.agents/notes/archived'] : [])
    if (!Array.isArray(value)) throw new Error(`${key} must be an array of literal paths`)
    arrays[key] = value.map(repositoryPath)
  }
  if (arrays.roots.length + arrays.files.length === 0) throw new Error('declare at least one corpus root or file; an empty corpus is not a pass')
  const archived = file => arrays.archiveRoots.some(directory => file.startsWith(`${directory}/`))
  const seen = new Set()
  const files = []
  function add(file) {
    if (archived(file)) return
    if (!file.endsWith('.md')) throw new Error(`declared source is not Markdown: ${file}`)
    const absolute = resolve(root, file)
    const real = realpathSync(absolute)
    if (!statSync(absolute).isFile()) throw new Error(`declared source is not a file: ${file}`)
    if (seen.has(real)) return
    seen.add(real)
    files.push(absolute)
  }
  function walk(directory, prefix) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      // As with the source wildcard walker, recursive discovery does not enter hidden/symlink dirs.
      if (entry.name.startsWith('.')) continue
      const file = prefix ? `${prefix}/${entry.name}` : entry.name
      if (archived(file)) continue
      if (entry.isDirectory()) walk(join(directory, entry.name), file)
      else if (entry.name.endsWith('.md') && (entry.isFile() || entry.isSymbolicLink())) add(file)
    }
  }
  for (const file of arrays.files) add(file)
  for (const directory of arrays.roots) {
    const absolute = resolve(root, directory)
    if (!statSync(absolute).isDirectory()) throw new Error(`declared corpus root is not a directory: ${directory}`)
    if (!archived(`${directory}/`)) walk(absolute, directory === '.' ? '' : directory)
  }
  if (files.length === 0) throw new Error('declared corpus contains no active Markdown sources')
  return files
}
