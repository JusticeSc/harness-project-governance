# Changelog

## Unreleased — Recovered development baseline

- Restore the published Git history with provenance-checked local corrections; keep historical plans, recovery candidates and internal evidence outside the development tree.
- Add a concise contributor entry and one current project-state owner; retire historical acceptance-plan references from active guidance and distinguish current capabilities from historical release observations.
- Correct the authoring knowledge and references for format-owner exceptions, Summary guidance, scoped translation checks, website publication/projection, CI compatibility versions, built-smoke lane ownership, manual Web diagnostics and repository-reference decoding.
- Add `governance check [repo] [--policy <path>]`: run registered commands in order, report their exit codes, and fail when any check fails. An explicit policy supports an existing owner without creating `.governance/`; paths outside the target are rejected. The installed smoke exercises real documentation-budget acceptance, rejection and recovery.
- Add separate adoption walkthroughs for an existing state owner and a new `.governance/` protocol. Register one applicable invariant, observe pass/rejection/recovery, then reuse the same command in existing CI. A workflow file remains separate from proof of remote enforcement.
- Fix policy containment after resolving both the repository root and policy file with `realpath`. Explicit and default policies redirected outside the target through symlinks/junctions are rejected before reading commands. Regression scenarios use an executable external policy, verify its execution marker remains absent on rejection, and preserve valid repository aliases.
- Narrow the target-added state protocol to cross-session continuity, handoff, compaction or explicit governance initialization; a multi-step single-session change no longer activates `.governance`, and continuation must reuse the existing state owner and honor withdrawn actions.
- Exercise the installed Skill in a persistent sibling test consumer with independent implementation, contract-only acceptance, retained first failures, recovery and cold-session continuation. Reuse the consumer's owner and test/CI entry; keep local evidence separate from hosted CI or external production adoption claims.
- Preserve the consumer's code, independent assertions and sanitized historical outputs as a standalone repository-only adoption fixture. Add `npm run test-adoption` to the existing CI matrix and explicit public-export allowlist, without adding research content to the npm runtime or installed Skill.
- Correct pre-merge source-contract descriptions: scope automatic provider selection to Web rather than implying LLM route inference, and recognize optional product reachability alongside default reachability or explicit package classification.
- Local observations do not certify complete semantic consolidation, autonomous adoption across repositories or remote enforcement.

## 1.0.0 — First public demonstration release

- Package the existing source-linked governance Skill and its Node-only integrity, discovery, initialization and metadata-status commands for independent use.
- Add English/Chinese getting-started documentation and a local installer that refuses to merge with an existing Skill seat.
- Add an executable task-board demo with real acceptance, deliberate rejection, recovery and persistent handoff.
- Add clean-install smoke verification and public CI; keep optional governance modules explicitly opt-in.
- Preserve upstream MIT attribution and pin source knowledge to commit `687f282e8625c6b8d11ff58211a90524be2e4317`.

This release does not certify complete source extraction, autonomous Agent adoption or remote branch/approval enforcement. See the README limitations and historical verification record.
