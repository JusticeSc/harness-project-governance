# Public release verification

## Scope

This page separates the 1.1.0-rc.1 release contract from the historical observations for the first public demonstration release. Version-specific local results describe only their stated environment and candidate; the matching commit's Actions results and GitHub Release identify remote outcomes and published assets. Counts describe packaged knowledge/reference integrity, not automatic guarantees received by an installed project.

Some mechanism ledgers and references retain paths to publisher-internal historical evidence (`verification/evidence/`, `_working/` and extraction builders). Those artifacts are not distributed and cannot be treated as independently reproducible proof from this repository. This page records this public release's observed checks; retained source/extraction statements remain bounded by their stated limitations.

## 1.1.0-rc.1 release scope

This prerelease distributes the existing Skill, source-linked knowledge, zero-dependency CLI (including the read-only paginated `show` command), independent installer and optional execution modules for project-owner-reviewed adoption. It does not certify autonomous adoption, complete extraction or stable cross-project reproduction. The current adoption procedure is SKILL §3.2a; superseded F/S/D experiments and failed original reports remain historical evidence in [METHODS.zh.md on GitHub](https://github.com/JusticeSc/harness-project-governance/blob/v1.1.0-rc.1/METHODS.zh.md#a07-adoption-candidate).

Fresh-checkout verification must exercise the repository commands below, offline package/installed-seat behavior, the full authored Markdown corpus, and public export. The existing CI retains Ubuntu/Windows × Node 22.19.0/24 core checks and a Node 24 documentation job. The optional OMP integration requires a separately installed OMP host and uses a scripted localhost provider; tested host versions must be stated, and a missing host is a skip, not compatibility proof. No test run here replaces consumer applicability, semantic review, cold Agent adoption or platform-policy acceptance.

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

Run this contributor sequence from a fresh repository checkout or allowlisted public export, not from the smaller npm runtime or installed Agent seat: regression fixtures and corpus configuration are development inputs. The exporter refuses an existing destination; use a new path if `dist/public` already exists.

```bash
npm run verify
npm run demo
npm run test-adoption
npm run smoke
npm ci --prefix tools/doc-gates --ignore-scripts
npm run test-doc-gates
npm run verify-md-links
npm run verify-md-wrap
node scripts/export-public.mjs
npm --prefix dist/public run verify
npm --prefix dist/public run demo
```

The core requires no dependency install. `smoke` packs and installs the local tarball in offline mode with a fresh cache, exercises the installed package and Agent-discoverable seat, rejects overwrites and redirected installation parents, preserves target edits, and executes the installed end-to-end demo. All consumer fixtures are temporary.

## Limits

- Complete source extraction and automatic equivalence are not established by these release observations.
- The demo is explicit scripted execution, not autonomous Agent adoption, and the fresh CLI process is not a fresh model session.
- `status` checks metadata readiness only. It never executes registered project checks or proves semantic acceptance.
- Optional tools need their own prerequisites, actual target configuration and explicit adoption. Their full privileged/remote behavior is not verified by the core smoke.
- No branch protection, approval App, organization policy or production release configuration is installed or certified here.
- Public CI is the authority for its actual operating-system/Node matrix; a workflow file alone is not evidence of a passing run.
