// Optional third-party dependencies for the doc gates.
// The core governance runtime (bin/governance.mjs) stays dependency-free; these gates need the same
// Markdown/YAML parsers the source verifiers use, so they are declared in tools/doc-gates/package.json.
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MODULE_ROOT = dirname(fileURLToPath(import.meta.url))
export const INSTALL_COMMAND = `npm install --prefix "${MODULE_ROOT}" --ignore-scripts`

/**
 * Report a gate module that could not be loaded and exit 2 (an unavailable prerequisite, never a pass).
 * @param command - Command name used as the diagnostic prefix.
 * @param error - Error thrown while importing the gate module.
 */
export function exitOnLoadFailure(command, error) {
  if (error?.code === 'ERR_MODULE_NOT_FOUND' || error?.code === 'ERR_UNKNOWN_FILE_EXTENSION') {
    console.error(`${command}: required Markdown/YAML parser is not installed (${error.message})`)
    console.error(`${command}: install the pinned optional dependencies declared in tools/doc-gates/package.json:`)
    console.error(`  ${INSTALL_COMMAND}`)
    process.exit(2)
  }
  console.error(`${command}: failed to load the gate module: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  process.exit(2)
}
