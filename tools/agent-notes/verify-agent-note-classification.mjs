// Generated from DeepSeek Harness 687f282e8625c6b8d11ff58211a90524be2e4317 scripts/verify-agent-note-classification.ts.
// License: ../../SOURCE-LICENSE.txt. Original generation used a publisher-only builder; maintain this shipped runtime directly.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { agentNoteRoot, walkAgentNoteTree } from './agent-note-tree.mjs';
const { notes, errors } = walkAgentNoteTree();
for (const legacyRoot of [
    'docs/rfc',
    'docs/rfcs'
]){
    if (existsSync(resolve(agentNoteRoot, '../..', legacyRoot))) {
        errors.push(`legacy-path: ${legacyRoot}/ is forbidden — put Agent Notes under .agents/notes/`);
    }
}
if (errors.length === 0) {
    console.log(`verify-agent-note-classification: ${notes.length} Agent Note(s) checked, structure consistent.`);
    process.exit(0);
}
console.error('verify-agent-note-classification: violations found:');
for (const e of errors)console.error(`  ${e}`);
process.exit(1);
