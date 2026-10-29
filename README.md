# harness-project-governance

**[中文版 / Chinese](README.zh.md)**

**A portable project-governance Skill for coding agents.** It turns “the agent says it is done” into a traceable claim: where the requirement lives, which checks actually ran, and what remains unverified.

## Summary

A portable Agent Skill for engineering governance in real repositories. The project aims to turn DeepSeek Harness's transferable governance methods into a self-bootstrapping development package, with executable checks and CI where mechanical enforcement is appropriate. The current package provides source-linked procedures, optional enforcement tools, and a zero-dependency CLI for knowledge integrity and project metadata. Target-project selection, configuration and CI integration still require explicit adaptation; installation alone does not establish governance. Start with `npm run verify`, then `npm run demo`.

## What you get

- **A starting point for an unfamiliar repository.** The agent reads the goal, acceptance conditions, and next action from the project's existing state owner instead of guessing progress from a chat transcript.
- **Located guidance instead of generic advice.** Every mechanism has an ID, a reference section, and pinned source ranges, so an agent can show why it chose a procedure.
- **A visible gap report.** `init` and `status` list missing project facts, owners, checks, and acceptance criteria before work is called ready.
- **Honest completion language.** The operating loop requires real commands and exit codes; unrun checks stay “unverified.”
- **Incremental adoption.** The core is a Skill plus a CLI. Optional approval, Agent Note, and documentation modules can be adopted later, only where their prerequisites exist.

It is not a hosted governance service, a security audit, or a substitute for your project's tests and reviews.

## Development status

`1.1.0-rc.1` is a prerelease candidate of this package, not a stable release and not an npm-registry publication. It contains the zero-dependency core CLI (`verify`, `list`, `cite`, `show`, `init`, `status`, `check`), the independent installer, the assisted adoption procedure, the whole-corpus Markdown baseline, and one Agent Note diagnostic correction. Optional approval, Agent Note, documentation-gate and OMP preflight modules work only within their own dependencies, configuration and permissions. Candidate distribution is the repository's GitHub release/tarball path; `package.json` remains `private: true`. A release entry or a CI pass is not asserted here until the corresponding GitHub release and Actions run exist.

Adoption is assisted and owner-reviewed: record the target facts and every obligation the change actually triggers, adapt the package's published migration decisions ([SKILL §3.2a](SKILL.md) and per-domain migration sections such as [documentation migration](references/documentation.md#migration)) to the target's owner, commands, corpora, dependencies and permissions, then have the project owner or an independent reviewer accept the decision before implementation. The withdrawn per-semantic-unit fresh-context adoption program is not the default. Earlier candidates—the cold-session PowerShell and Node exercises, reviewed-decision, citation-backed, split-context and source-bound attempts—did not satisfy their required conditions, and those failures remain failed; [METHODS §14](METHODS.zh.md#a07-adoption-candidate) preserves that history rather than this quickstart. This candidate has no complete independent adoption result, no autonomous-Agent adoption, no cross-project or cross-language certification, and no complete-source certification.

Maintainer session progress, next actions and local investigation records belong in a separate development workspace outside the product checkout. A fresh clone requires no private records or parent-directory layout; follow `AGENTS.md`, the current request and repository facts. `AGENTS.md` is not installed into consumer projects. [Public verification](PUBLIC-VERIFICATION.md) separates version-specific release checks from historical observations; neither certifies complete adoption.

## Quickstart (no `npm install`)

Requirements: Git, Node.js >= 22.19.0, and npm for the repository scripts. The core CLI has zero runtime dependencies.

```bash
git clone https://github.com/JusticeSc/harness-project-governance.git
cd harness-project-governance
node --version
npm run verify
npm run demo
```

The same commands work in Windows PowerShell. `npm run demo` creates a throwaway sample project in a temporary directory, initializes governance, fills the metadata from that sample, runs a real Node app and its test command, deliberately breaks the feature to observe a rejection, restores it, reports status, and shows a handoff. It is a local, repeatable walkthrough: passing it demonstrates the workflow, not that another repository or an autonomous agent has adopted the Skill.

Inspect the actual [sample application and acceptance checks](examples/task-board/README.md), or read the [historical release observations and limits](PUBLIC-VERIFICATION.md). The temporary demo is removed automatically; it does not modify your projects.

On this development checkout, `verify` reports `governance: 1196 mechanisms in 55 domains; references and anchors verified`. That number describes the extracted ledger; it is not a claim that every upstream source line was reviewed or that no mechanism is missing.

## Install the Skill into a repository

```bash
node scripts/install-skill.mjs path/to/your-repo
node path/to/your-repo/.agents/skills/harness-project-governance/bin/governance.mjs verify
```

Replace `path/to/your-repo` with the target path; forward slashes work in PowerShell as well. The installer creates a new `.agents/skills/harness-project-governance` seat and refuses to overwrite an existing seat. There is no force mode. It does not edit application code, `.governance/` state, or GitHub settings.

Before creating metadata, check whether the target already has a single state owner (a task board, issue/PR ledger, handoff file or `PROJECT.md`). If it does, keep requirements, acceptance, the adoption decision and the next action there; do not run `init` and do not create `.governance/`.

Run `init` only when the target has no state owner and at least one of these conditions holds: the user asked to initialize governance; work must continue across sessions or be handed off; or progress must be saved before compaction:

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs init .
node .agents/skills/harness-project-governance/bin/governance.mjs status .
```

`init` creates `.governance/policy.json`, `state.json`, `requirements.md`, `README.md`, and `decisions/` without overwriting existing files. A successful installation or a multi-step change is not by itself a reason to initialize metadata. Until the project name, toolchains, owners, checks, active requirement, acceptance items, and next action are filled, `init` and `status` exit with code 2. That is the expected incomplete-metadata signal, not a broken installation. `status` checks whether metadata is present; it does not execute `policy.checks` or prove that work is complete. If `.governance/` does not exist yet, `status` exits 1 and tells you to run `init`.

## Use it from an agent

After installing, give the agent a prompt such as:

```text
Follow .agents/skills/harness-project-governance/SKILL.md.
First find the project's single existing state owner (for example PROJECT.md, a task board, or a handoff file) and read it; do not create a second authority.
When the user asks to initialize governance, or work must continue across sessions, be handed off, or be saved before compaction: use the existing state owner if there is one; otherwise read or create .governance/requirements.md and state.json. A multi-step change confined to one session does not justify a new state file.
Before editing, put observable acceptance conditions in the current state owner or the current delivery, and route the task to the relevant references.
For first/gradual adoption, follow SKILL §3.2a: establish the target facts and every obligation the change actually triggers, then adapt the package's published migration decisions (for example [documentation migration](references/documentation.md#migration)) to the target's parameters, existing owner, commands, corpora, dependencies and permissions. The maintainer owns source-to-obligation verification, exceptions, classification and tool guarantees; you own project facts, configuration, execution and accurate reporting. Return a concrete source doubt to the maintainer instead of asserting equivalence or dropping an obligation. The project owner or an independent reviewer accepts the adoption decision before implementation; then implement, verify at the same local/CI entry with normal, rejection and recovery evidence, continue across sessions from the same owner, and report each real command's exit code.
List anything you did not run as unverified; do not call the work complete from metadata alone, and do not execute an action the current request has withdrawn.
```

For a review or a risky change:

```text
Use harness-project-governance to review this change.
Cite the mechanisms and references you rely on, run the configured checks, and separate observed results from unverified claims.
```

## Command surface

| Command | What it does | What it does not do |
|---|---|---|
| `verify` | Parses every mechanism ledger and checks unique IDs, reference files, anchors, and source-range metadata. | Prove upstream claims are complete or true, or that your project adopted them. |
| `list` | Prints mechanism counts per domain. | Decide which domains matter for your task. |
| `cite <id-or-fragment>` | Prints the matching mechanism title, reference path, domain, and source count. | Print the referenced source excerpt. |
| `show <exact-id> [--part mechanism\|reference] [--cursor token]` | Returns a bounded, lossless JSON page of the complete mechanism record or its registered reference file, with provenance, byte ranges, content hash and continuation cursor. | Select applicability, return unshipped upstream source bodies, prove comprehension or certify adoption. |
| `init [repo]` | Creates missing `.governance/` metadata files and never overwrites. | Fill in project facts for you. |
| `status [repo]` | Reports missing project, requirement, acceptance, owner, check, and next-action fields. | Run checks or certify completion. |
| `check [repo] [--policy path]` | Runs the policy's `checks` in order and reports each exit code; exits 1 when any fails and 2 for a missing or invalid policy, empty `checks`, or a value that is not a non-empty command string. Both default and explicit policies must resolve inside the repository's real path. No state files are created. | Infer checks, prove semantic completeness or platform enforcement, or load a policy whose real location is outside the repository through a symlink/junction. |

Example against an installed Skill:

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

Use `show documentation-prose-budgets` to read the complete record, including `migration` and any additional fields; use `--part reference` for its reference file. Follow each `next` token with the same ID/part and `--cursor`; join `chunks` and check continuous byte ranges, identity/hash and the explicit final page. Each page is at most 4096 UTF-8 bytes and each line at most 512 bytes. Missing, repeated, reordered or tool-truncated pages do not establish complete reading. Invalid/stale cursors and unreadable references exit 1 without a success page. See [SKILL §5](SKILL.md) for the full paging contract; complete transport is not semantic acceptance.

## What `verify` actually proves

`verify` proves package coherence: the JSON ledgers parse, mechanism IDs are unique, every referenced Markdown file exists, the mechanism ID and anchor occur in that file, and every mechanism carries source `path`, `start`, and `end` fields. It fails with exit code 1 and names the broken mechanism otherwise.

It does not read the pinned upstream repository, revalidate quoted source lines, judge whether a reference is semantically correct, check whether optional tools are configured, or show that a target project follows the procedure.

## Minimal adoption walkthrough

Adoption starts from the target, not from re-reading upstream source per obligation. Record the target facts and the obligations the change actually triggers, then adapt the package's published migration decisions—[SKILL §3.2a](SKILL.md), per-domain migration sections such as [documentation migration](references/documentation.md#migration), and each mechanism's `migration` field—keeping every mechanism and its effect while replacing only parameters such as paths, thresholds, gate names, language pairs and tool implementations. The documentation migration section is one entry, not a closed checklist; follow whichever branches the target facts actually trigger. The maintainer is responsible for verifying that a published decision covers the source obligation, including its exceptions, classification, parameterization and tool guarantees; the consumer is responsible for real project facts, the existing owner, commands, corpora, dependencies and permissions, plus execution and reporting. A gap or conflict in the published material goes back to the maintainer with the specific impact; do not assume equivalence, invent upstream support, or silently cancel an obligation.

Record the adoption decision in the existing owner together with the exact commands and observed exits. The project owner or an independent reviewer checks the decision against target facts and every triggered obligation, including blocked and inapplicable items, before implementation; metadata, citations and a green mechanical check do not authorize implementation. Missing dependencies or permissions are blocked prerequisites, not inapplicability, and scratch, cache and test-internal installation effects must match the recorded permissions. Only after acceptance is recorded is the change implemented and verified at the same local/CI entry; decision completion is not completed adoption, and metadata-only initialization does not require this adoption workflow.

Reference locations identify this package's explanation, not upstream source. Label a migration design as such, and record a parameter substitution instead of presenting a source threshold as a target parameter.

- **An existing state owner** (a task board, issue/PR ledger, handoff file, or `PROJECT.md`): keep the decision, requirements, acceptance and next action there. Do not run `init` and do not create `.governance/`. After decision acceptance, keep only execution configuration in a repository-relative manifest, for example `governance-checks.json`:

  ```json
  {
    "checks": {
      "docs": "node .agents/skills/harness-project-governance/tools/doc-gates/verify-doc-budgets.mjs"
    }
  }
  ```

  Each value is a non-empty command string for a real project command (for example `"tests": "npm test"`). `check` reads no other field, and runs the commands from the repository root through the shell in file order.

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
  ```

- **No existing state owner, plus a request to initialize governance, continue across sessions, hand off, or have another executor take over**: run `init` once. A missing owner alone does not trigger initialization, and a multi-step change confined to one session does not justify it.

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs init .
  # The first init exits 2: fill policy, requirements and state with project facts
  node .agents/skills/harness-project-governance/bin/governance.mjs status .
  node .agents/skills/harness-project-governance/bin/governance.mjs check .
  ```

The budget example also needs `.doc-gates/doc-budgets.json`, for example `{"README.md":60}`; 60 is an example, not a default policy. Review the target and remaining margin separately from the hard ceiling, and assign review ownership, reasons and reactivation conditions to unbudgeted documents. Markdown changes also trigger the applicable link/wrap checks and semantic review; prepare their locked parser dependencies and full applicable corpus rather than treating one zero-dependency budget command as complete coverage. The [documentation reference](references/documentation.md#prose-budgets) specifies these obligations and [Markdown setup](references/documentation.md#markdown-gates).

Both paths should use one top-level entry. Add **the same locally verified command** as one step in the repository's existing CI, keeping its install, matrix, and other checks; adapt the syntax to your CI system:

```yaml
- run: node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
```

Retain `--policy` for an existing owner and use the default policy after `init`. The CI step must inherit the non-zero exit; `continue-on-error: true` or a fallback that always succeeds defeats the check. A manifest entry that calls `governance check` again on the same policy recurses, so register the project's own commands. If the repository already has a top-level script that runs these checks, call that script from both the local command and the CI step, and keep the script out of its own manifest. A workflow file does not prove a remote required check is active.

After the accepted decision is implemented, retain consumer-visible normal and invalid-input assertions in the shared entrypoint, not only disposable probes. If adoption must continue across sessions, leave the unique owner with the accepted decision, checked and unchecked commands, original evidence locations and one executable next action. A fresh session must continue a real change from the Skill, repository and current request, reevaluating triggered obligations without this conversation.

**Evidence and layers.** For either path, run the normal command and observe a pass; inject a real violation into a recoverable copy or an authorized file; confirm the same top-level entry exits non-zero; restore exact bytes and observe recovery. Retain the original stdout/stderr and command/exit receipts in the owner's evidence location; quote diagnostics from those logs rather than reconstructing numbers from memory. Report actual installation and scratch effects and distinguish local execution, workflow wiring, remote CI and server-side merge blocking. Adoption acceptance requires every applicable obligation, behavior, original-report and authority condition; corrections do not retroactively pass failed originals. `check` executes registered commands; it does not choose rules, prove semantic completeness, or establish platform enforcement. Policy commands run with local privileges and require the same trust as project scripts.

Node.js is the CLI host, not evidence that every target language is supported or validated. Registered commands may call the repository's own toolchains, but this package's checks and installation observations are Node-hosted; other languages and platforms remain unverified unless the project tests them. In adoption reports, separate observed commands and exit codes, source-based inference, and unverified items. One bounded delivery exercise separated these categories when explicitly asked; as a single intervention without a control, it is not causal proof or general certification.

## Optional modules

- `tools/github-approval/` is an optional weighted-approval installer and workflow bundle. It needs Node.js and, for production-ownership analysis, Python >= 3.10 with Pygments. It installs files only and does not change GitHub branch protection or grant approvals; see [references/github-approval.md](references/github-approval.md).
- `tools/agent-notes/` provides Agent Note format, classification, tree, and archive verifiers. See [references/agent-notes.md](references/agent-notes.md).
- `tools/doc-gates/` provides Markdown link, wrapping, translation-pairing, budget, and package-README gates with their own pinned parser dependencies. Install them with `npm run install-doc-gates`, then configure only the gates your repository needs; do not copy this repository's thresholds wholesale.

### Optional OMP preflight adapter

`tools/omp-preflight/simplification.mjs` is a target-added OMP adapter, not recovered upstream behavior and not part of the zero-dependency `bin/governance.mjs` CLI. It uses Node built-ins only. Historical probes ran on OMP 18.13.1 on Windows with `--mode rpc`; that version-specific evidence covers host mechanics, not semantic acceptance of the source workflow or general adoption. Interactive TUI and unlisted host/mode/version combinations are not certified. A separately installed OMP can be exercised from a development checkout with the repository's localhost fixture; the exact installed version, command and result belong in the version-scoped [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md), and one version's result is not generalized to another. Real-model candidate failures and any later bounded results are recorded in [METHODS](METHODS.zh.md).

Start it per session from the consumer repository root (or pass `--cwd`), with the installed module on OMP's exact allowlist and an existing Markdown state owner:

```powershell
$module = (Resolve-Path '.agents/skills/harness-project-governance/tools/omp-preflight/simplification.mjs').Path
omp --mode rpc --trusted-extension $module --governance-owner PROJECT.md
```

```bash
omp --mode rpc --trusted-extension "$PWD/.agents/skills/harness-project-governance/tools/omp-preflight/simplification.mjs" --governance-owner PROJECT.md
```

An RPC client must drive prompts over stdio; `--mode rpc` alone starts no conversation. `--trusted-extension` requires an absolute existing file, bypasses ambient extension discovery, and cannot be combined with `-e`/`--extension` or `--hook`. Ordinary `-e`/`--hook` loading and non-strict extension error handling can fail open, so they are not equivalent launch forms. The adapter changes no settings, profile, or installed files, and needs no global setup. It is an in-process module, not a sandbox; other capabilities or middleware can still alter tool input and results, so do not combine it with extensions that rewrite reads or tool calls.

`--governance-owner` must name an existing Markdown file inside the session cwd root after resolving real paths; a repository-relative or absolute spelling is accepted only if its canonical path stays inside that root. The adapter never creates an owner and refuses missing, outside, or junction-escaped paths; no `.governance/` initialization or second owner is needed. Before a checkpoint, the root session may only use native `read`, `grep`, and `glob`; `write`, `edit`, `bash`, `eval`, `task`, and unknown tools are blocked, so delegation and executable work cannot start first.

The checkpoint tool `governance_preflight` is exposed directly as an essential tool, without an extra `--tools` override, and takes nonblank `constraints` and `acceptance` strings. It succeeds only after a native `read` of the installed `references/agent-workflows.md` §18 (`aw-18` through before `aw-19`) whose returned text contains every nonblank line of that section; the path must match the canonical reference, which is checked for changes again when recording the checkpoint. OMP can report a truncation flag because lines after the section remain unread even when the whole section was returned; that flag alone does not reject the read. A read that omits or head-truncates required section lines does not qualify. The tool then appends the mapping and normal/rejection criteria to the owner and allows root-session tool calls to proceed. New user input, activation of queued user work, session switch, branch, or tree navigation resets the checkpoint. Recording proves reading order and presence, not semantic correctness; it does not continuously revalidate the reference after success.

Where its handler is bound, the adapter refuses non-root mutation, but OMP child, revived, and advisor sessions are not universally guaranteed: source reading shows child factory errors can be swallowed, child extension tools are excluded, and child CLI flags are dropped. Successful ordinary child binding is not a child-failure fail-close guarantee. Only the root-session checkpoint is promised. Once an allowed executable call starts, its internals are not gated.

From a development checkout, set `OMP_BIN` to the separately installed OMP executable and run `npm run test-omp-preflight`. The six integration cases use a localhost scripted provider, not paid model calls or model credentials; they explicitly skip when that host prerequisite is unavailable. They verify mechanics, not semantic adoption, and the exact version exercised is part of the version-scoped evidence record rather than a supported-version claim.

The optional references explain the source mechanisms and migration boundaries. Reuse their requirements, not their full configuration.

## Repository layout

```text
SKILL.md                 Agent-facing procedure, hard rules, and task routing
bin/governance.mjs       verify / list / cite / show / init / status / check; zero dependencies
knowledge/*.json         Machine-readable mechanism ledgers (55 domains)
references/*.md          Domain explanations, source ranges, and migration notes
tools/                   Optional GitHub approval, Agent Note, OMP preflight, and documentation modules
scripts/                 install-skill and repository demo/smoke helpers
research/fixtures/       Repository-only reproducible adoption snapshot and evidence
package.json             Node >= 22.19.0; MIT; private package
LICENSE                  License for this package
SOURCE-LICENSE.txt       Pinned upstream attribution and MIT notice
```

## Verification for contributors

```bash
npm run verify
npm run demo
npm run smoke
npm run test-adoption
```

`npm run smoke` checks a fresh package and install path, including the refusal to overwrite an existing Skill seat. Optional documentation gates need their locked parser dependencies and the repository configurations:

```bash
npm ci --prefix tools/doc-gates --ignore-scripts
npm run test-doc-gates
npm run verify-md-links
npm run verify-md-wrap
```

Report only commands you actually ran and their exit codes. A green local command does not establish this candidate's CI or release status; check the GitHub Actions run and Releases entry for the candidate commit.

For the independently authored consumer contract tests and retained first-failure/recovery observations, see [the public adoption fixture](research/fixtures/adoption-cli/README.md). It needs no installed Skill or dependencies. `test-adoption` is a repository-contributor command; research fixtures are not shipped in the npm runtime or Agent seat. Re-running it validates application behavior, not another autonomous Agent session. The [method report](METHODS.zh.md) distinguishes these observations from production adoption and complete source migration.


## Adopt it in your project

Start with the zero-dependency core, then add the governance checks that fit your repository:

- **Keep work traceable.** Use the Skill's requirement, acceptance, verification, and handoff workflow alongside your existing development process.
- **Choose your checks.** Register only the checks your repository needs, using its own commands; optional documentation, Agent Note, and approval modules apply only where their prerequisites exist. Keep GitHub approvals and branch protection under your project's policy.
- **Share it easily.** Install from this repository, or use the offline package once the corresponding entry exists on the [Releases page](https://github.com/JusticeSc/harness-project-governance/releases).

The [historical release record](PUBLIC-VERIFICATION.md) reports core installation and demo observations across Windows/Linux and Node.js 22.19/24; those observations are not a rerun of this development checkout. Detailed operating references are Chinese-first, with English CLI output and getting-started documentation.

## License and acknowledgements

This independently maintained project draws on the governance practices of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317). It is not an official DeepSeek product.

Released under the [MIT License](LICENSE). Source attribution and the original MIT notice are preserved in [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt).
