# Public release verification

## Scope

This preserves the historical observations reported for the first public demonstration release. It is not a fresh verification report for the recovered development checkout. Counts describe packaged knowledge/reference integrity, not how many automatic guarantees an installed project receives.

Some mechanism ledgers and references retain paths to publisher-internal historical evidence (`verification/evidence/`, `_working/` and extraction builders). Those artifacts are not distributed and cannot be treated as independently reproducible proof from this repository. This page records this public release's observed checks; retained source/extraction statements remain bounded by their stated limitations.

## Historical local observations

Environment: Windows x64; Node v24.19.0; npm 11.17.0; Git 2.48.1.windows.1.

| Command | Observed result | What it proves |
| --- | --- | --- |
| `node bin/governance.mjs verify` | Exit 0; 1195 mechanisms, 55 domains | Knowledge/reference IDs and anchors satisfy the shipped integrity checker |
| `npm run demo` | Exit 0; real acceptance command returned 0, deliberate feature mutation returned 1, restoration returned 0; final fresh-process status returned 0 | Scripted local application/requirement/acceptance/handoff loop |
| `npm ci --prefix tools/doc-gates --ignore-scripts --no-audit --no-fund` then `npm run test-doc-gates` | Exit 0; 87 passed, 0 failed, 0 skipped | The selected optional documentation module regression scenarios on this environment |
| `npm run smoke` | Exit 0; 15 real command scenarios passed | Fresh offline tarball install, installed CLI and Agent seat, overwrite/redirect rejection, preserved target edits, installed demo |

The published workflow runs these core commands from the allowlisted staging tree. The release description and [public Actions results](https://github.com/JusticeSc/harness-project-governance/actions) are the sources for their historical remote outcomes; neither a workflow file nor this preserved table proves a passing run of the current checkout.

## Reproduce

```bash
npm run verify
npm run demo
npm run smoke
npm ci --prefix tools/doc-gates --ignore-scripts
npm run test-doc-gates
```

The core requires no dependency install. `smoke` packs and installs the local tarball in offline mode with a fresh cache, exercises the installed package and Agent-discoverable seat, rejects overwrites and redirected installation parents, preserves target edits, and executes the installed end-to-end demo. All consumer fixtures are temporary.

## Limits

- Complete source extraction and automatic equivalence are not established by these release observations.
- The demo is explicit scripted execution, not autonomous Agent adoption, and the fresh CLI process is not a fresh model session.
- `status` checks metadata readiness only. It never executes registered project checks or proves semantic acceptance.
- Optional tools need their own prerequisites, actual target configuration and explicit adoption. Their full privileged/remote behavior is not verified by the core smoke.
- No branch protection, approval App, organization policy or production release configuration is installed or certified here.
- Public CI is the authority for its actual operating-system/Node matrix; a workflow file alone is not evidence of a passing run.
