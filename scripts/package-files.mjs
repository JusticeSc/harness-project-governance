import { globSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

// The npm runtime allowlist is also the installer/exporter's source of truth.
export function packageFiles(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const files = new Set()
  function visit(name) {
    const full = resolve(root, name)
    const local = relative(root, full)
    if (!local || local.startsWith('..') || isAbsolute(local)) throw new Error(`unsafe package path: ${name}`)
    const stat = lstatSync(full)
    if (stat.isSymbolicLink()) throw new Error(`package symlinks are not supported: ${name}`)
    if (stat.isDirectory()) {
      for (const child of readdirSync(full)) {
        if (['node_modules', '.git', '__pycache__'].includes(child)) continue
        visit(join(name, child))
      }
    } else if (stat.isFile()) files.add(local.replaceAll('\\', '/'))
  }
  for (const name of ['package.json', 'README.md', 'README.zh.md', 'LICENSE', 'CHANGELOG.md', ...manifest.files]) {
    if (name.includes('*')) {
      const matches = globSync(name, { cwd: root })
      if (matches.length === 0) throw new Error(`package pattern has no files: ${name}`)
      for (const match of matches) visit(match)
    } else visit(name)
  }
  return [...files].sort()
}
