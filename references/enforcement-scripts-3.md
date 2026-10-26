# enforcement-scripts-3

This reference covers the `enforcement-scripts-3` partition of `scripts/` at fixed source commit `687f282e8625c6b8d11ff58211a90524be2e4317`. Citations use `deepseek-harness/<path>:<start>-<end>@687f282e`; every cited range is also recorded in `research/enforcement-scripts-3-coverage.json`.

## Scope

The 60 assigned paths are the residual enforcement/build/catalog/snapshot classes:

- executable builders and native addon locators for the Python SDK and SSH helper;
- catalog generators for client slots, Cordis inspect data and dependencies;
- route, package-meta, client-package and snapshot-replay gates with their co-located specs;
- persistence schema/render/release helpers and the recorded Python SDK snapshot corpus;
- release process/tarball plumbing and Windows-safe fixture cleanup.

Reading was file-by-file. Ranges in the coverage record are the ranges actually read; generated JSON/JSONL fixtures are marked `generated` and carry no mechanism. Ten files are `non-governance` or `generated`; 43 governance files only reuse already-recorded mechanisms. Four mechanisms below are new and are supported by seven of those files. The browser route spec reuses `enforcement-scripts-4-client-route-resolution`; the package-metadata spec reuses `engineering-package-shape-exports` and `agent-workflows-artwork`. Neither is duplicated here. The recorded snapshot JSON/JSONL fixtures contain lines over 768 characters; those lines were re-read with `:raw` and the coverage notes say so. No build, test, formatter or git command was run.

## Mechanisms

<a id="m-enforcement-scripts-3-snapshot-spill-locator-isolation"></a>
### enforcement-scripts-3-snapshot-spill-locator-isolation — Replay spill locators are stable logical names scoped to one saved run {#enforcement-scripts-3-snapshot-spill-locator-isolation}

**Problem**: A replay records logical spill locators so a later run can refer to the same tool result. Concurrent replays of the same session/call can allocate the same physical file, overwriting each other's bytes; a locator saved by one run mapping into another reads unrelated content. Locator text must stay stable while routing to a run-private file.

**Triggers**: recording/replaying spilled tool results; concurrent snapshot sessions; changing spill store, filesystem adapter or locator root; disposing/restoring a replay fork.

**Obligations**:

- Concurrent replays with identical owner/source/name/content produce equal-length logical locators but distinct physical files inside each run's root. Allocation completion order must not matter.
- The locator retains the recorded prefix and UTF-8 byte count; reading through `fs.resolve` returns exactly the saved content.
- Only locators saved by the current run resolve or map to a host path. Unknown locators under the locator root throw `not saved by this run` from both resolve and reverse mapping; ordinary paths pass through unchanged.
- Disposing the locator plugin removes the mapping: the old locator no longer stats the old physical file and reverse mapping treats it as an ordinary path.
- Both allocation orders are covered because `Promise.all` preserves input order, not completion order.

**Enforcement**: `mode: test`. `scripts/snapshot-spill-locators.spec.ts` runs two concurrent forks over `LocalSpillStore` and `LocalFileSystem` with real temp roots. Trust: locator length/bytes, physical privacy, saved-run resolution, passthrough and post-dispose behavior are asserted; cross-process collision is not.

**Evidence**:

<a id="m-enforcement-scripts-3-spill-private"></a>
- `deepseek-harness/scripts/snapshot-spill-locators.spec.ts:12-67@687f282e` — two runs with the same session/call/content keep distinct physical paths, equal locator lengths and each other's bytes; both allocation orders are parameterized.
<a id="m-enforcement-scripts-3-spill-unsaved"></a>
- `deepseek-harness/scripts/snapshot-spill-locators.spec.ts:50-55@687f282e` — an unsaved locator throws `not saved by this run` from resolve and reverse mapping, while an ordinary path passes through.
<a id="m-enforcement-scripts-3-spill-dispose"></a>
- `deepseek-harness/scripts/snapshot-spill-locators.spec.ts:56-60@687f282e` — after disposal the old locator no longer reaches the old physical file, and its stat is undefined.

**Limitations**: one in-process store/adapter pair; no cross-process collision, crash recovery or exhaustive path-shape coverage. The synthetic locator root may not reproduce every Windows edge.

<a id="m-enforcement-scripts-3-python-wheel-test-pruning"></a>
### enforcement-scripts-3-python-wheel-test-pruning — Python runtime wheels: remove only distribution test trees and rewrite RECORD safely {#enforcement-scripts-3-python-wheel-test-pruning}

**Problem**: The unpacked Python runtime ships NumPy and pandas wheels whose tests dominate the payload. Deleting too much removes testing helpers, compiled support modules, licenses or data; rewriting RECORD naively drops quoted comma paths or hashes, and a malformed record can lead to deletion before corruption is noticed.

**Triggers**: changing bundled NumPy/pandas versions; changing the runtime unpack/prune step; adding a distribution with a different layout; changing RECORD parsing.

**Obligations**:

- Remove only `numpy/tests` and `pandas/tests` trees, including nested and empty test directories. Keep similarly named tests of other distributions, `numpy/testing`, `pandas/testing`, `pandas/_testing`, compiled `*_tests` binaries, data files and dist-info licenses.
- RECORD is CSV with sha256 and size per row. Rewrite with original hashes/sizes, preserve quoted comma paths and the self-row, and keep exactly the retained rows.
- Validate every RECORD before deleting anything for that distribution. Unterminated quotes, empty rows, missing hash/size rows and empty files abort with `invalid wheel RECORD` while tests remain.
- A second prune is a byte-identical no-op; the source `.whl` archive is never modified. Pruning applies to the unpacked tree only.
- Tests use the lock-pinned distribution versions.

**Enforcement**: `mode: test`. `scripts/primary-runtime/prune-python-tests.spec.ts` builds a real zip and calls `prunePrimaryRuntimePythonTests` after `unpackPrimaryRuntimeWheel`. Trust: selection, RECORD round-trip, archive immutability, idempotence and malformed-record refusal are asserted; exotic CSV/wheel layouts are not.

**Evidence**:

<a id="m-enforcement-scripts-3-prune-selection"></a>
- `deepseek-harness/scripts/primary-runtime/prune-python-tests.spec.ts:16-60@687f282e` — only NumPy/pandas tests trees disappear; testing modules, compiled extension support files, data, licenses and other distributions survive; RECORD keeps original hashes and comma quoting.
<a id="m-enforcement-scripts-3-prune-record"></a>
- `deepseek-harness/scripts/primary-runtime/prune-python-tests.spec.ts:70-84@687f282e` — malformed RECORD inputs throw `invalid wheel RECORD` before the test file is deleted.
<a id="m-enforcement-scripts-3-prune-idempotent"></a>
- `deepseek-harness/scripts/primary-runtime/prune-python-tests.spec.ts:61-64@687f282e` — the archive is byte-identical and a second prune leaves RECORD unchanged.

**Ownership boundary**: wheel/platform policy belongs to `supply-chain-python-runtime`; this mechanism owns only pruning and RECORD integrity.

**Limitations**: only NumPy/pandas are covered. Validation is exercised on synthetic rows; a wheel whose RECORD omits rows may behave differently. The pruned extracted RECORD intentionally differs from the archive's original.

<a id="m-enforcement-scripts-3-bounded-client-slot-report"></a>
### enforcement-scripts-3-bounded-client-slot-report — Client slot catalog: teach every registrable slot within a bounded per-slot report {#enforcement-scripts-3-bounded-client-slot-report}

**Problem**: A model adding UI to a dynamic package must know which slots exist, what each kind accepts, what props the component receives, who occupies the seat and when it exists. That contract lives in SlotMap merges and register call sites. Dumping the type graph makes one answer expensive; an undocumented or unresolvable slot yields an unusable catalog silently.

**Triggers**: declaring/changing a SlotMap slot; changing register options, kind or scope; changing owner props/standard props/inject; adding a registrant; regenerating the model-facing catalog.

**Obligations**:

- SlotMap merges are the authority. Each key is declared exactly once; duplicates violate the contract because merges are silent. `kind` is a literal `single`/`list`/`keyed`/`chain`; `scope` is a literal `root`/`session`/`session-maybe`.
- Every slot has registrant-side JSDoc prose. An owner prop type must resolve to an exported declaration; every registration targets a declared slot or is a factory; every child slot is typed.
- Expand only the owner type and its top-level composed aliases; field values stay references. Truncate declarations over 1200 characters with an explicit marker.
- One slot report (doc, example, owner props, register-option docs, standard props, owner-prop references, occupants) stays within 122 lines. Over-budget slots fail; narrow the owner share or prose, never raise the budget.
- Register options are curated per cardinality; do not teach `priority`; teach inject/remount, no-import and CSS-theme constraints.
- Emit a data module for the host toolset without importing a client runtime. Scan all matching `.ts`/`.tsx` files, drop ambiguous exported type names, parse TSX as TSX, restrict receivers to `slots`/`*.slots` and names to string literals.
- Intentional seat repetition is marked for clone detection with jscpd annotations. `--check` fails stale/missing output and never writes; regeneration is the only remedy.

**Enforcement**: `mode: gate`. `scripts/gen-client-catalog.ts` + `scripts/slot-walk.ts`; `scripts/gen-client-catalog.spec.ts` pins validation, truncation, budget and `--check` behavior. Trust: liveness, duplicates, resolution, budget and freshness are mechanical; prose quality and real token cost require review.

**Evidence**:

<a id="m-enforcement-scripts-3-slot-budget"></a>
- `deepseek-harness/scripts/gen-client-catalog.ts:36-53@687f282e` — kind/scope sets, 1200-character declaration cap and the 122-line per-slot budget with its rationale.
<a id="m-enforcement-scripts-3-slot-validate"></a>
- `deepseek-harness/scripts/gen-client-catalog.ts:135-224@687f282e` — `collectSlotEntries` fails on contract violations and oversized reports; `validateSlotContracts` rejects duplicate keys, non-literal kind/scope, missing JSDoc, unresolvable owner types, undeclared registrations and untyped children.
<a id="m-enforcement-scripts-3-slot-owner"></a>
- `deepseek-harness/scripts/gen-client-catalog.ts:312-345@687f282e` — owner props expand the named type plus top-level composed aliases only; nested field types remain references.
<a id="m-enforcement-scripts-3-slot-truncate"></a>
- `deepseek-harness/scripts/gen-client-catalog.ts:403-408@687f282e` — over-long declarations are truncated with an explicit marker.
<a id="m-enforcement-scripts-3-slot-check"></a>
- `deepseek-harness/scripts/gen-client-catalog.ts:571-593@687f282e` — `--check` compares the committed artifact and exits 1 with the regeneration command when stale; it never writes.
<a id="m-enforcement-scripts-3-slot-spec"></a>
- `deepseek-harness/scripts/gen-client-catalog.spec.ts:1-264@687f282e` — specs pin slot validation, truncation, the 122-line budget and `--check` freshness over inline declarations and fixture catalog output.
<a id="m-enforcement-scripts-3-slot-walk"></a>
- `deepseek-harness/scripts/slot-walk.ts:120-147,196-227,302-311,333-336@687f282e` — ambiguous exported types are dropped; registrations require a literal name, a `slots`/`*.slots` receiver and a `register`/`registerFactory` callee; TSX is parsed as TSX.

**Limitations**: line count is a proxy for rendered context cost, not measured tokens. The scan is lexical and does not resolve conditional/mapped types; one-level expansion can omit a cross-package shape. Specs assert generator judgement, not the host tool's answer.

<a id="m-enforcement-scripts-3-windows-safe-script-plumbing"></a>
### enforcement-scripts-3-windows-safe-script-plumbing — Windows-safe script plumbing: JS entrypoints, tar cwd and junction-first cleanup {#enforcement-scripts-3-windows-safe-script-plumbing}

**Problem**: POSIX-written scripts fail or destroy state on Windows: `spawnSync` cannot start a `.cmd` shim, GNU tar treats `C:/` as a remote host, and recursive deletion follows junctions into the repository's real `scripts/`, `node_modules` and tsx directories.

**Triggers**: invoking pnpm from Node; reading a tarball by absolute Windows path; cleaning a fixture containing junctions; adding a Windows CI lane.

**Obligations**:

- Resolve pnpm to a JavaScript-launchable command: either `pnpm` itself or a node executable whose first argument names pnpm. Do not rely on `pnpm.cmd` or a shell. The command must actually run `--version`.
- When GNU tar reads an archive, set `cwd` to the archive's directory and pass its basename; never pass a drive-colon absolute path.
- Before recursive fixture deletion, walk and unlink every junction/symlink; only then remove the tree. On POSIX the walk is a no-op. Never call `rmSync` or `git worktree remove` on a tree with junctions.
- Windows removal is bounded: `maxRetries: 50`, `retryDelay: 200` (10 seconds). Do not retry unboundedly, do not swallow non-EPERM errors, and do not pin `afterEach`.
- Test with real processes and archives: pnpm `--version`, tar member listing and packed identity, not only command-shape mocks.

**Enforcement**: `mode: test + helper`. `scripts/release/process.spec.ts` covers the process/tarball helpers; `scripts/test-fixture-cleanup.ts` implements `unlinkFixtureLinks`/`removeFixtureSafely`. Trust: command shape, real pnpm/tar and cleanup order are checkable; destructive junction behavior and handle timing need a real Windows runner.

**Evidence**:

<a id="m-enforcement-scripts-3-win-pnpm"></a>
- `deepseek-harness/scripts/release/process.spec.ts:31-37@687f282e` — the pnpm command resolves to `pnpm` or a node executable plus a pnpm JS entry, and runs a real `--version`.
<a id="m-enforcement-scripts-3-win-tar"></a>
- `deepseek-harness/scripts/release/process.spec.ts:40-50@687f282e` — tar readers list members and read packed identity when run beside the archive; the comment names the Windows drive-colon failure.
<a id="m-enforcement-scripts-3-win-cleanup"></a>
- `deepseek-harness/scripts/test-fixture-cleanup.ts:18-48@687f282e` — recursively unlink links before `rmSync`, with a 50×200 ms bounded retry and the Windows handle-release rationale.

**Ownership boundary**: link-first deletion specializes `engineering-untrusted-subprocess`; this mechanism adds the pnpm JS entrypoint, tar cwd and bounded Windows retry.

**Limitations**: the specs prove command shape and real pnpm/tar behavior on the current platform; destructive junction traversal is not reproduced end to end. The retry window is tuned to the source runners and should be re-measured.

## References

- `knowledge/enforcement-scripts-3.json` — domain mechanisms and bounds.
- `research/enforcement-scripts-3-coverage.json` — the 60 assigned paths, actual read ranges, dispositions and reused mechanism ids.
- `deepseek-harness/scripts/snapshot-spill-locators.spec.ts:1-72@687f282e`
- `deepseek-harness/scripts/primary-runtime/prune-python-tests.spec.ts:1-85@687f282e`
- `deepseek-harness/scripts/gen-client-catalog.ts:1-597@687f282e`
- `deepseek-harness/scripts/gen-client-catalog.spec.ts:1-264@687f282e`
- `deepseek-harness/scripts/slot-walk.ts:1-432@687f282e`
- `deepseek-harness/scripts/release/process.spec.ts:1-51@687f282e`
- `deepseek-harness/scripts/test-fixture-cleanup.ts:1-49@687f282e`
