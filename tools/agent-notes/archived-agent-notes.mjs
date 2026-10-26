// Generated from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/archived-agent-notes.ts.
// License: ../../SOURCE-LICENSE.txt. Original generation used a publisher-only builder; maintain this shipped runtime directly.
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { AGENT_NOTE_CLASSES } from './agent-note-tree.mjs';
function archiveContentHash(content) {
    return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}
export function gitBlobHash(content) {
    const hash = createHash('sha1');
    hash.update(`blob ${content.byteLength}\0`);
    hash.update(content);
    return hash.digest('hex');
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function parseArchiveManifest(content) {
    const value = JSON.parse(content);
    if (!isRecord(value)) throw new Error('expected a JSON object');
    const fields = Object.keys(value).sort();
    if (fields.join(',') !== 'files,version') throw new Error('expected exactly the fields `version` and `files`');
    if (value.version !== 1) throw new Error('unsupported manifest version (expected 1)');
    if (!isRecord(value.files)) throw new Error('`files` must be an object');
    const files = {};
    for (const [path, hash] of Object.entries(value.files)){
        if (typeof hash !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(hash)) {
            throw new Error(`invalid content hash for ${path}`);
        }
        files[path] = hash;
    }
    return {
        version: 1,
        files
    };
}
export function renderArchiveManifest(files) {
    return `${JSON.stringify({
        version: 1,
        files: Object.fromEntries(Object.entries(files).sort(([left], [right])=>left.localeCompare(right)))
    }, null, 2)}\n`;
}
const figmaLinkRemovals = [];
export function validateArchiveManifestExtension(baseline, current) {
    const errors = [];
    for (const [path, expected] of Object.entries(baseline.files)){
        const actual = current.files[path];
        if (actual === undefined) errors.push(`${path}: sealed manifest entry is missing`);
        else if (actual !== expected && !figmaLinkRemovals.some((change)=>change.path === path && change.before === expected && change.after === actual)) errors.push(`${path}: sealed manifest hash changed`);
    }
    return errors;
}
function validDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match === null) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function pairMeta(content) {
    const entries = new Map();
    for (const line of content.split('\n')){
        if (line === '' || line.startsWith('#')) continue;
        const match = /^([^:#]+\.md): ([0-9a-f]{40})$/.exec(line);
        if (match?.[1] === undefined || match[2] === undefined) return undefined;
        entries.set(match[1], match[2]);
    }
    return entries;
}
function validateMetadata(path, content, sourceBase) {
    const errors = [];
    const lines = content.toString('utf8').split('\n');
    const status = lines.findIndex((line)=>line.startsWith('Status:'));
    if (lines[status] !== 'Status: implemented') errors.push(`${path}: requires \`Status: implemented\``);
    const archived = /^Archived: (\d{4}-\d{2}-\d{2})$/.exec(lines[status + 1] ?? '')?.[1];
    if (status < 0 || archived === undefined || !validDate(archived)) {
        errors.push(`${path}: requires \`Archived: YYYY-MM-DD\` with a valid date immediately after the status`);
    } else if (archived < sourceBase.slice(0, 10)) {
        errors.push(`${path}: archive date ${archived} predates the note filename`);
    }
    return {
        errors,
        date: archived
    };
}
export function validateArchiveArtifacts(artifacts) {
    const errors = [];
    const triplets = new Map();
    for (const [path, content] of artifacts){
        const match = /^([^/]+)\/(\d{4}-\d{2}-\d{2}-.+?)(\.zh\.md|\.i18n\.yaml|\.md)$/.exec(path);
        if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined) {
            errors.push(`${path}: expected {kind}/yyyy-mm-dd-topic.{md,zh.md,i18n.yaml}`);
            continue;
        }
        if (!AGENT_NOTE_CLASSES.includes(match[1])) {
            errors.push(`${path}: unknown Agent Note kind ${JSON.stringify(match[1])}`);
            continue;
        }
        const key = `${match[1]}/${match[2]}`;
        const triplet = triplets.get(key) ?? {};
        if (match[3] === '.md') triplet.source = content;
        else if (match[3] === '.zh.md') triplet.zh = content;
        else triplet.meta = content;
        triplets.set(key, triplet);
    }
    for (const [key, triplet] of [
        ...triplets
    ].sort(([left], [right])=>left.localeCompare(right))){
        const sourcePath = `${key}.md`;
        const zhPath = `${key}.zh.md`;
        const metaPath = `${key}.i18n.yaml`;
        const { source, zh, meta } = triplet;
        const missing = [
            source === undefined ? sourcePath : undefined,
            zh === undefined ? zhPath : undefined,
            meta === undefined ? metaPath : undefined
        ].filter((path)=>path !== undefined);
        if (source === undefined || zh === undefined || meta === undefined) {
            errors.push(`${key}: incomplete archived triplet; missing ${missing.join(', ')}`);
            continue;
        }
        const sourceBase = basename(key);
        const { errors: sourceErrors, date: sourceDate } = validateMetadata(sourcePath, source, sourceBase);
        const { errors: zhErrors, date: zhDate } = validateMetadata(zhPath, zh, sourceBase);
        errors.push(...sourceErrors, ...zhErrors);
        if (sourceDate !== undefined && zhDate !== undefined && sourceDate !== zhDate) {
            errors.push(`${key}: English and Chinese archive dates differ (${sourceDate} vs ${zhDate})`);
        }
        const pair = pairMeta(meta.toString('utf8'));
        if (pair === undefined || pair.size !== 2 || pair.get(`${sourceBase}.md`) !== gitBlobHash(source) || pair.get(`${sourceBase}.zh.md`) !== gitBlobHash(zh)) {
            errors.push(`${metaPath}: consistency record must contain the current Git blob hashes of both archived sides`);
        }
    }
    return errors;
}
export function extendArchiveManifest(existing, artifacts) {
    const errors = [];
    const files = {
        ...existing.files
    };
    for (const [path, expected] of Object.entries(existing.files)){
        const content = artifacts.get(path);
        if (content === undefined) errors.push(`${path}: sealed artifact is missing`);
        else if (archiveContentHash(content) !== expected) errors.push(`${path}: sealed content hash changed`);
    }
    const added = [];
    for (const [path, content] of [
        ...artifacts
    ].sort(([left], [right])=>left.localeCompare(right))){
        if (files[path] !== undefined) continue;
        files[path] = archiveContentHash(content);
        added.push(path);
    }
    return {
        files,
        added,
        errors
    };
}
