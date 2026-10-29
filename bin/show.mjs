// Read-only paginated reader for a source-linked mechanism or its reference file.
// The cursor is an integrity fingerprint for continuation, not a signature and not
// a security authority: it detects edits, wrong ids/parts and replays, nothing more.
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const READER_VERSION = 1
const CURSOR_VERSION = 1
const PAGE_BYTES = 4096
const LINE_BYTES = 512
// Worst case a chunk becomes six JSON bytes per source byte (control characters);
// 80 raw bytes plus indentation, quotes and comma stay under the 512-byte line cap.
const MAX_CHUNK_BYTES = 80
const PART_VALUES = ['mechanism', 'reference']

function fail(message) {
  console.error(`governance: ${message}`)
  process.exit(1)
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function toPosix(path) {
  return path.split(sep).join('/')
}

function parseArgs(argv) {
  let id = null
  let part = 'mechanism'
  let cursor = null
  let partSeen = false
  let cursorSeen = false
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--part') {
      if (partSeen) fail('duplicate --part option')
      partSeen = true
      const value = argv[++index]
      if (value === undefined) fail('--part requires mechanism or reference')
      if (!PART_VALUES.includes(value)) fail(`--part must be mechanism or reference, got ${value}`)
      part = value
    } else if (arg === '--cursor') {
      if (cursorSeen) fail('duplicate --cursor option')
      cursorSeen = true
      cursor = argv[++index]
      if (cursor === undefined) fail('--cursor requires a token')
    } else if (arg.startsWith('-') && arg !== '-') {
      fail(`unknown show option: ${arg}`)
    } else if (id === null) {
      id = arg
    } else {
      fail(`unexpected show argument: ${arg}`)
    }
  }
  if (id === null) fail('usage: governance show <exact-id> [--part mechanism|reference] [--cursor token]')
  return { id, part, cursor }
}

function selectMechanism(ledgers, id) {
  const matches = []
  for (const ledger of ledgers) {
    for (const record of ledger.mechanisms) {
      if (record !== null && typeof record === 'object' && record.id === id) matches.push({ ledger, record })
    }
  }
  if (matches.length === 0) fail(`no mechanism has id ${id}`)
  if (matches.length > 1) fail(`duplicate mechanism id ${id}`)
  return matches[0]
}

function mechanismPayload(ledger, record) {
  const payload = Buffer.from(JSON.stringify(record), 'utf8')
  return { payload, file: toPosix(`knowledge/${ledger.file}`) }
}

function referencePayload(record, { skillRoot, referencesDir, anchorPresent }) {
  const reference = record.reference
  if (typeof reference !== 'string' || !reference.includes('#')) {
    fail(`${record.id}: reference must be a path#anchor`)
  }
  const split = reference.indexOf('#')
  const filePart = reference.slice(0, split)
  const fragment = reference.slice(split + 1)
  if (filePart.length === 0 || fragment.length === 0) fail(`${record.id}: reference must be a path#anchor`)
  let referencesRoot
  try {
    referencesRoot = realpathSync(referencesDir)
  } catch (error) {
    fail(`packaged references directory is missing: ${referencesDir}`)
  }
  const skillReal = realpathSync(skillRoot)
  const rootContainment = relative(skillReal, referencesRoot)
  if (rootContainment === '..' || rootContainment.startsWith(`..${sep}`) || isAbsolute(rootContainment)) {
    fail('packaged references directory must resolve inside the Skill package')
  }
  let real
  try {
    real = realpathSync(resolve(skillRoot, filePart))
  } catch (error) {
    fail(`${record.id}: reference file is missing: ${filePart}`)
  }
  const containment = relative(referencesRoot, real)
  if (containment === '..' || containment.startsWith(`..${sep}`) || isAbsolute(containment)) {
    fail(`${record.id}: reference must resolve inside the packaged references directory: ${filePart}`)
  }
  if (!statSync(real).isFile()) fail(`${record.id}: reference is not a file: ${filePart}`)
  const payload = readFileSync(real)
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(payload)
  } catch (error) {
    fail(`${record.id}: reference file is not valid UTF-8: ${filePart}`)
  }
  if (!anchorPresent(text, fragment)) fail(`${record.id}: reference file ${filePart} has no anchor #${fragment}`)
  return { payload, file: toPosix(relative(skillReal, real)) }
}

function isContinuationByte(byte) {
  return (byte & 0xc0) === 0x80
}

function encodeCursor(fingerprint, offset) {
  const raw = JSON.stringify({ v: CURSOR_VERSION, f: fingerprint, o: offset })
  return Buffer.from(raw, 'utf8').toString('base64url')
}

function decodeCursor(token, fingerprint, payload) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) fail('cursor is malformed')
  const decoded = Buffer.from(token, 'base64url')
  if (decoded.toString('base64url') !== token) fail('cursor is not canonical base64url')
  const raw = decoded.toString('utf8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    fail('cursor is malformed')
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) fail('cursor is malformed')
  if (Object.keys(parsed).sort().join(',') !== 'f,o,v') fail('cursor is malformed')
  if (JSON.stringify(parsed) !== raw) fail('cursor is not canonical JSON')
  if (parsed.v !== CURSOR_VERSION) fail(`unsupported cursor version: ${String(parsed.v)}`)
  if (parsed.f !== fingerprint) {
    fail('cursor does not match this resource; it is stale or belongs to another id, part or content')
  }
  if (!Number.isInteger(parsed.o)) fail('cursor offset is malformed')
  const offset = parsed.o
  if (offset < 0 || offset >= payload.length) fail('cursor offset is out of range')
  if (isContinuationByte(payload[offset])) fail('cursor offset is not on a UTF-8 boundary')
  return offset
}

function resourceFingerprint(resource) {
  return sha256Hex(Buffer.from(JSON.stringify({
    version: READER_VERSION,
    id: resource.id,
    part: resource.part,
    file: resource.file,
    domain: resource.domain,
    sourceCommit: resource.sourceCommit,
    sha256: resource.sha256,
    bytes: resource.bytes,
  }), 'utf8'))
}

function chunkEnd(payload, start, maxBytes) {
  let end = Math.min(start + maxBytes, payload.length)
  while (end > start && end < payload.length && isContinuationByte(payload[end])) end -= 1
  return end
}

function makePage(payload, resource, fingerprint, start, end) {
  const chunks = []
  let offset = start
  while (offset < end) {
    const stop = Math.min(chunkEnd(payload, offset, MAX_CHUNK_BYTES), end)
    chunks.push(payload.subarray(offset, stop).toString('utf8'))
    offset = stop
  }
  const complete = end === payload.length
  return {
    version: READER_VERSION,
    resource,
    range: { start, end },
    chunks,
    next: complete ? null : encodeCursor(fingerprint, end),
    complete,
    limits: { pageBytes: PAGE_BYTES, lineBytes: LINE_BYTES },
  }
}

function serializePage(page) {
  const text = `${JSON.stringify(page, null, 2)}\n`
  if (Buffer.byteLength(text) > PAGE_BYTES) return null
  for (const line of text.split('\n')) {
    if (Buffer.byteLength(line) > LINE_BYTES) return null
  }
  return text
}

function renderPage(payload, resource, fingerprint, start) {
  if (payload.length === 0) {
    const text = serializePage(makePage(payload, resource, fingerprint, 0, 0))
    if (text === null) fail('cannot render a page within the byte limits')
    return text
  }
  let end = start
  let text = null
  for (;;) {
    const candidateEnd = chunkEnd(payload, end, MAX_CHUNK_BYTES)
    if (candidateEnd <= end) break
    const candidate = serializePage(makePage(payload, resource, fingerprint, start, candidateEnd))
    if (candidate === null) break
    end = candidateEnd
    text = candidate
    if (end === payload.length) break
  }
  if (text === null) fail('cannot render a page within the byte limits')
  return text
}

export function runShow(argv, { ledgers, skillRoot, referencesDir, anchorPresent }) {
  const { id, part, cursor } = parseArgs(argv)
  const { ledger, record } = selectMechanism(ledgers, id)
  if (typeof ledger.sourceCommit !== 'string' || ledger.sourceCommit.length === 0) {
    fail(`${ledger.file}: domain ledger has no sourceCommit`)
  }
  const { payload, file } = part === 'reference'
    ? referencePayload(record, { skillRoot, referencesDir, anchorPresent })
    : mechanismPayload(ledger, record)
  const resource = {
    id,
    part,
    file,
    domain: ledger.domain,
    sourceCommit: ledger.sourceCommit,
    sha256: sha256Hex(payload),
    bytes: payload.length,
  }
  const fingerprint = resourceFingerprint(resource)
  const start = cursor === null ? 0 : decodeCursor(cursor, fingerprint, payload)
  process.stdout.write(renderPage(payload, resource, fingerprint, start))
}
