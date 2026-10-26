// Generated from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/agent-note-tree.ts.
// License: ../../SOURCE-LICENSE.txt. Original generation used a publisher-only builder; maintain this shipped runtime directly.
import { globSync, readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
export const agentNoteRoot = resolve(process.cwd(), '.agents/notes');
const AGENT_NOTE_LIFECYCLES = [
    'proposed',
    'implemented',
    'rejected'
];
export const AGENT_NOTE_CLASSES = [
    'feature',
    'bug-fix',
    'simplification',
    'architecture',
    'process',
    'testing'
];
const AGENT_NOTE_ARCHIVE = 'archived';
const ROOT_ALLOWLIST = new Set([
    'AGENTS.md',
    'CLAUDE.md'
]);
export function walkAgentNoteTree() {
    const notes = [];
    const errors = [];
    for (const entry of readdirSync(agentNoteRoot, {
        withFileTypes: true
    })){
        if (entry.name === 'INDEX.md') {
            errors.push('structure: INDEX.md — centralized Agent Note indexes are forbidden; browse the lifecycle/class tree or search the repository');
            continue;
        }
        if (entry.isDirectory() && entry.name !== AGENT_NOTE_ARCHIVE && !AGENT_NOTE_LIFECYCLES.includes(entry.name)) {
            errors.push(`structure: ${entry.name}/ — unknown lifecycle folder (allowed: ${AGENT_NOTE_LIFECYCLES.join(', ')}, plus ${AGENT_NOTE_ARCHIVE}/)`);
        }
    }
    for (const lifecycle of AGENT_NOTE_LIFECYCLES){
        for (const match of globSync(`${lifecycle}/**/*.md`, {
            cwd: agentNoteRoot
        }).map((path)=>path.split(sep).join('/')).sort()){
            const segs = match.split('/');
            if (segs.length === 2 && ROOT_ALLOWLIST.has(segs[1] ?? '')) continue;
            if (match.endsWith('.zh.md')) continue;
            const cls = segs[1];
            const base = segs[2];
            if (segs.length !== 3 || cls === undefined || base === undefined) {
                errors.push(`structure: ${match} — expected {lifecycle}/{class}/file.md (got depth ${segs.length})`);
                continue;
            }
            if (!AGENT_NOTE_CLASSES.includes(cls)) {
                errors.push(`structure: ${match} — unknown class folder "${cls}" (allowed: ${AGENT_NOTE_CLASSES.join(', ')})`);
                continue;
            }
            if (!/^\d{4}-\d{2}-\d{2}-.+\.md$/.test(base)) {
                errors.push(`structure: ${match} — filename must be yyyy-mm-dd-topic.md`);
                continue;
            }
            notes.push({
                lifecycle,
                rel: match,
                date: base.slice(0, 10)
            });
        }
    }
    return {
        notes,
        errors
    };
}
