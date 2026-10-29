# harness-project-governance

**[中文版 / Chinese](README.zh.md)**

**A portable project-governance Skill for coding agents.** It turns “the agent says it is done” into a traceable claim: where the requirement lives, which checks actually ran, and what remains unverified.

## Summary

A project-governance Skill for coding agents. It helps agents identify project facts and toolchains, clarify requirements and acceptance conditions, select relevant rules, and verify changes through real project commands and reviews. The package includes operational references, a zero-dependency CLI, and optional enforcement tools. Start with `npm run verify`, then `npm run demo`; project checks and CI still need explicit configuration.

## What you get

- **A starting point for an unfamiliar repository.** The agent reads the goal, acceptance conditions, and next action from the project's existing state owner instead of guessing progress from a chat transcript.
- **Located guidance instead of generic advice.** Every mechanism has an ID, a reference section, and pinned source ranges, so an agent can show why it chose a procedure.
- **A visible gap report.** `init` and `status` list missing project facts, owners, checks, and acceptance criteria before work is called ready.
- **Honest completion language.** The operating loop requires real commands and exit codes; unrun checks stay “unverified.”
- **Incremental adoption.** The core is a Skill plus a CLI. Optional approval, Agent Note, and documentation modules can be adopted later, only where their prerequisites exist.

It is not a hosted governance service, a security audit, or a substitute for your project's tests and reviews.

## Development status

The current release is [`1.1.0-rc.1`](https://github.com/JusticeSc/harness-project-governance/releases/tag/v1.1.0-rc.1), distributed through GitHub rather than the npm registry. It provides the core CLI, Skill installer and optional approval, Agent Note, documentation and OMP tools. Each optional module requires its own dependencies, configuration and permissions.

Use the [adoption workflow](references/adoption.md#adoption) to adapt the relevant rules to the project's existing owners, checks and permissions, with project-owner or independent-reviewer acceptance before implementation. Installation alone does not establish governance, and this prerelease does not guarantee autonomous adoption.

[Public verification](PUBLIC-VERIFICATION.md) records version-specific commands, results and limits. Contributors follow [AGENTS.md](AGENTS.md); it is not installed into consumer projects, and using the Skill requires no maintainer session records.

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

Inspect the [sample application and acceptance checks](examples/task-board/README.md), or read the [verification commands and limits](PUBLIC-VERIFICATION.md). The temporary demo is removed automatically; it does not modify your projects.

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

Name the installed Skill, the actual task and the permitted effects. For example:

```text
Follow .agents/skills/harness-project-governance/SKILL.md.
Review whether this repository's local checks and CI cover its existing acceptance conditions.
Report findings and evidence only; do not edit files or remote settings.
```

For implementation or adoption, replace the review request with your actual deliverable and authorized scope. The Skill owns the workflow; the prompt does not need to repeat it.

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

Use `show documentation-prose-budgets` for the complete mechanism or add `--part reference` for its reference file. Follow the [CLI paging protocol](references/cli.md#paging) to read all pages and verify continuity and the full-content hash; `cite` or a partial page is not the complete record. Complete transport does not prove semantic acceptance.

## What `verify` actually proves

`verify` proves package coherence: the JSON ledgers parse, mechanism IDs are unique, every referenced Markdown file exists, the mechanism ID and anchor occur in that file, and every mechanism carries source `path`, `start`, and `end` fields. It fails with exit code 1 and names the broken mechanism otherwise.

It does not read the pinned upstream repository, revalidate quoted source lines, judge whether a reference is semantically correct, check whether optional tools are configured, or show that a target project follows the procedure.

## Minimal adoption walkthrough

The examples below configure execution **after** the project owner or an independent reviewer accepts the adoption decision. Follow the [adoption workflow](references/adoption.md#adoption) to identify every triggered requirement, adapt target parameters and permissions, and resolve conflicts or blocked prerequisites. For documentation, start with the [project-adaptation sections](references/documentation.md#migration); they are not an exhaustive rule list. These commands are examples, not default project policy or proof of completed adoption.

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

Verify either route with normal execution, a real violation rejected by the same entrypoint, and byte-exact recovery. Retain consumer-visible normal and invalid-input assertions in the shared entrypoint. The [receipt procedure](references/adoption.md#adoption-receipts) specifies raw evidence and execution layers; the [handoff and completion criteria](references/adoption.md#adoption-continuation) cover cross-session work and the remaining acceptance conditions. A passing `check` only proves that its registered commands passed, not semantic completeness or platform enforcement.

Node.js hosts the CLI; registered commands may invoke the target's own toolchains. Other languages and platforms remain unverified unless exercised. Report observed commands and exit codes separately from source-based inference and unverified items.

## Optional modules

- `tools/github-approval/` is an optional weighted-approval installer and workflow bundle. It needs Node.js and, for production-ownership analysis, Python >= 3.10 with Pygments. It installs files only and does not change GitHub branch protection or grant approvals; see [references/github-approval.md](references/github-approval.md).
- `tools/agent-notes/` provides Agent Note format, classification, tree, and archive verifiers. See [references/agent-notes.md](references/agent-notes.md).
- `tools/doc-gates/` provides Markdown link, wrapping, translation-pairing, budget, and package-README gates with their own pinned parser dependencies. Install them with `npm run install-doc-gates`, then configure only the gates your repository needs; do not copy this repository's thresholds wholesale.

### Optional OMP preflight adapter

`tools/omp-preflight/simplification.mjs` is an optional OMP adapter, separate from the core CLI and using Node built-ins only. It requires a separately installed OMP host. Windows RPC checks, the exact exercised versions and their limits are recorded in [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md); they do not certify interactive TUI, other host/mode/version combinations or semantic correctness of an agent's decisions.

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

The optional references explain each module's prerequisites, configuration and limits. Adapt them to your project rather than copying the full configuration.

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

Report only commands you actually ran and their exit codes. Local success does not prove remote CI or publication; check the GitHub Actions run and Releases entry that match the commit you are using.

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
