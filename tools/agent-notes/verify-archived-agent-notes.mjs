// Generated from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/verify-archived-agent-notes.ts.
// License: ../../SOURCE-LICENSE.txt. Original generation used a publisher-only builder; maintain this shipped runtime directly.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AGENT_NOTE_CLASSES, agentNoteRoot } from './agent-note-tree.mjs';
import { extendArchiveManifest, parseArchiveManifest, renderArchiveManifest, validateArchiveArtifacts, validateArchiveManifestExtension } from './archived-agent-notes.mjs';
const args = process.argv.slice(2);
const writeMode = args.length === 1 && args[0] === '--write';
if (args.length > 0 && !writeMode) {
    console.error('verify-archived-agent-notes: usage: node <skill>/tools/agent-notes/verify-archived-agent-notes.mjs [--write]');
    process.exit(1);
}
const archiveRoot = resolve(agentNoteRoot, 'archived');
const manifestPath = resolve(archiveRoot, 'manifest.json');
const repoRoot = resolve(agentNoteRoot, '../..');
const manifestRepoPath = '.agents/notes/archived/manifest.json';
const errors = [];
const allowedRootFiles = new Set([
    'AGENTS.md',
    'manifest.json'
]);
const kinds = new Set();
if (!existsSync(resolve(archiveRoot, 'AGENTS.md'))) errors.push('archived/AGENTS.md is required');
const artifacts = new Map();
for (const entry of readdirSync(archiveRoot, {
    withFileTypes: true
})){
    if (entry.isFile()) {
        if (!allowedRootFiles.has(entry.name)) errors.push(`archived/${entry.name}: unexpected root file`);
        continue;
    }
    if (!entry.isDirectory()) {
        errors.push(`archived/${entry.name}: only regular files and kind directories are allowed`);
        continue;
    }
    if (!AGENT_NOTE_CLASSES.includes(entry.name)) {
        errors.push(`archived/${entry.name}/: unknown Agent Note kind`);
        continue;
    }
    kinds.add(entry.name);
    for (const child of readdirSync(resolve(archiveRoot, entry.name), {
        withFileTypes: true
    })){
        const rel = `${entry.name}/${child.name}`;
        if (!child.isFile()) {
            errors.push(`${rel}: archived kind directories contain regular files only`);
            continue;
        }
        artifacts.set(rel, readFileSync(resolve(archiveRoot, rel)));
    }
}
for (const kind of AGENT_NOTE_CLASSES){
    if (!kinds.has(kind)) errors.push(`archived/${kind}/: required kind directory is missing`);
}
errors.push(...validateArchiveArtifacts(artifacts));
function runGit(args) {
    const result = spawnSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8'
    });
    if (result.error !== undefined) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr.trim() || `git exited with status ${result.status}`);
    return result.stdout;
}
function readBaselineManifest(ref) {
    runGit([
        'cat-file',
        '-e',
        `${ref}^{commit}`
    ]);
    const manifestEntry = runGit([
        'ls-tree',
        '--name-only',
        ref,
        '--',
        manifestRepoPath
    ]).trim();
    if (manifestEntry === '') return {
        version: 1,
        files: {}
    };
    return parseArchiveManifest(runGit([
        'show',
        `${ref}:${manifestRepoPath}`
    ]));
}
function validateFirstArchivalTransitions(ref, baseline) {
    const errors = [];
    const tree = new Map();
    for (const entry of runGit([
        'ls-tree',
        '-rz',
        ref,
        '--',
        '.agents/notes'
    ]).split('\0')){
        const match = /^(?:100644|100755) blob ([0-9a-f]{40}|[0-9a-f]{64})\t(.+)$/.exec(entry);
        if (match !== null) tree.set(match[2], match[1]);
    }
    const objectFormat = tree.values().next().value?.length === 64 ? 'sha256' : 'sha1';
    const status = Buffer.from('Status: implemented\n');
    const archivePrefix = '.agents/notes/archived/';
    for (const path of tree.keys()){
        if (!path.startsWith(archivePrefix)) continue;
        const relative = path.slice(archivePrefix.length);
        if (!relative.includes('/') || baseline.files[relative] !== undefined) continue;
        if (!artifacts.has(relative)) errors.push(relative + ': trusted historical artifact is missing; restore the complete baseline archive before sealing');
    }
    for (const [relative, content] of artifacts){
        if (baseline.files[relative] !== undefined) continue;
        const archivedPath = '.agents/notes/archived/' + relative;
        const historical = tree.get(archivedPath);
        if (historical !== undefined) {
            const hash = createHash(objectFormat).update('blob ' + content.length + '\0').update(content).digest('hex');
            if (hash !== historical) errors.push(relative + ': unsealed historical artifact changed from trusted baseline');
            continue;
        }
        const activePath = '.agents/notes/implemented/' + relative;
        const original = tree.get(activePath);
        if (original === undefined) {
            errors.push(relative + ': first seal has no trusted implemented original; commit the complete active triplet before archival');
            continue;
        }
        if (existsSync(resolve(repoRoot, activePath))) errors.push(relative + ': first archival transition must move the complete triplet, not retain its active copy');
        if (!relative.endsWith('.md')) continue;
        let offset = content.indexOf(status);
        while(offset > 0 && content[offset - 1] !== 10)offset = content.indexOf(status, offset + 1);
        if (offset < 0) continue;
        const start = offset + status.length;
        const newline = content.indexOf(10, start);
        const end = newline < 0 ? content.length : newline + 1;
        const hash = createHash(objectFormat);
        hash.update('blob ' + (content.length - (end - start)) + '\0');
        hash.update(content.subarray(0, start));
        hash.update(content.subarray(end));
        if (hash.digest('hex') !== original) errors.push(relative + ': first archival body changed; only the Archived metadata line may be inserted');
    }
    return errors;
}
let manifest = {
    version: 1,
    files: {}
};
if (existsSync(manifestPath)) {
    try {
        manifest = parseArchiveManifest(readFileSync(manifestPath, 'utf8'));
    } catch (error) {
        errors.push(`archived/manifest.json: ${error instanceof Error ? error.message : String(error)}`);
    }
} else if (!writeMode) {
    errors.push('archived/manifest.json is required; seal new artifacts with `node <skill>/tools/agent-notes/verify-archived-agent-notes.mjs --write`');
}
const baselineRef = process.env.GOVERNANCE_ARCHIVE_BASE_REF ?? 'HEAD';
try {
    const baseline = readBaselineManifest(baselineRef);
    errors.push(...validateArchiveManifestExtension(baseline, manifest));
    errors.push(...validateFirstArchivalTransitions(baselineRef, baseline));
} catch (error) {
    errors.push(`archived/manifest.json: cannot read baseline ${JSON.stringify(baselineRef)}: ${error instanceof Error ? error.message : String(error)}`);
}
const extended = extendArchiveManifest(manifest, artifacts);
errors.push(...extended.errors);
if (!writeMode) {
    for (const path of extended.added)errors.push(`${path}: archived artifact is not sealed in manifest.json`);
}
if (errors.length > 0) {
    console.error('verify-archived-agent-notes: archive rules violated:');
    for (const error of errors)console.error(`  ${error}`);
    process.exit(1);
}
if (writeMode) {
    const rendered = renderArchiveManifest(extended.files);
    if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== rendered) {
        writeFileSync(manifestPath, rendered);
    }
    console.log(`verify-archived-agent-notes: sealed ${extended.added.length} new artifact(s); existing seals unchanged.`);
} else {
    console.log(`verify-archived-agent-notes: ${artifacts.size} frozen artifact(s) checked across ${kinds.size} kind(s).`);
}
