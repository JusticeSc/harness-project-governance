# harness-project-governance

**[中文版 / Chinese](README.zh.md)**

**A portable project-governance Skill for coding agents.** It turns “the agent says it is done” into a traceable claim: where the requirement lives, which checks actually ran, and what remains unverified.

## Summary

A portable Agent Skill for engineering governance in real repositories. The project aims to turn DeepSeek Harness's transferable governance methods into a self-bootstrapping development package, with executable checks and CI where mechanical enforcement is appropriate. The current package provides source-linked procedures, optional enforcement tools, and a zero-dependency CLI for knowledge integrity and project metadata. Target-project selection, configuration and CI integration still require explicit adaptation; installation alone does not establish governance. Start with `npm run verify`, then `npm run demo`.

## What you get

- **A starting point for an unfamiliar repository.** The agent reads a stored goal, acceptance conditions, and next action instead of guessing progress from a chat transcript.
- **Located guidance instead of generic advice.** Every mechanism has an ID, a reference section, and pinned source ranges, so an agent can show why it chose a procedure.
- **A visible gap report.** `init` and `status` list missing project facts, owners, checks, and acceptance criteria before work is called ready.
- **Honest completion language.** The operating loop requires real commands and exit codes; unrun checks stay “unverified.”
- **Incremental adoption.** The core is a Skill plus a CLI. Optional approval, Agent Note, and documentation modules can be adopted later, only where their prerequisites exist.

It is not a hosted governance service, a security audit, or a substitute for your project's tests and reviews.

## Development status

This checkout contains recovered, unpublished source-claim corrections. Its installation and individual checks are usable; an integrated target-project bootstrap and autonomous adoption are not yet established. The repository contains the Skill, supporting programs, tests and public documentation. Maintainer session progress, next actions and local investigation records belong in a separate development workspace outside the product checkout. A fresh clone requires no private records or parent-directory layout; follow `AGENTS.md`, the current request and repository facts. `AGENTS.md` is not installed into consumer projects. [Public verification](PUBLIC-VERIFICATION.md) preserves historical release observations, not a fresh certification of this checkout.

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

To start project metadata, run these from the target repository:

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs init .
node .agents/skills/harness-project-governance/bin/governance.mjs status .
```

`init` creates `.governance/policy.json`, `state.json`, `requirements.md`, `README.md`, and `decisions/` without overwriting existing files. Until the project name, toolchains, owners, checks, active requirement, acceptance items, and next action are filled, `init` and `status` exit with code 2. That is the expected incomplete-metadata signal, not a broken installation. `status` checks whether metadata is present; it does not execute `policy.checks` or prove that work is complete. If `.governance/` does not exist yet, `status` exits 1 and tells you to run `init`.

## Use it from an agent

After installing, give the agent a prompt such as:

```text
Follow .agents/skills/harness-project-governance/SKILL.md.
First find the project's single existing state owner (for example PROJECT.md, a task board, or a handoff file) and read it; do not create a second authority.
When the user asks to initialize governance, or work must continue across sessions, be handed off, or be saved before compaction, read or create .governance/requirements.md and state.json. A multi-step change confined to one session does not justify a new state file.
Before editing, put observable acceptance conditions in the current state owner or the current delivery, and route the task to the relevant references.
Then implement the task, use `governance check` to run the real commands registered in policy.checks, and report each command with its exit code.
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
| `init [repo]` | Creates missing `.governance/` metadata files and never overwrites. | Fill in project facts for you. |
| `status [repo]` | Reports missing project, requirement, acceptance, owner, check, and next-action fields. | Run checks or certify completion. |
| `check [repo] [--policy path]` | Runs the policy's `checks` in order and reports each exit code; exits 1 when any fails and 2 for a missing or invalid policy or empty checks. Both default and explicit policies must resolve inside the repository's real path. No state files are created. | Infer checks, prove semantic completeness or platform enforcement, or load a policy whose real location is outside the repository through a symlink/junction. |

Example against an installed Skill:

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

## What `verify` actually proves

`verify` proves package coherence: the JSON ledgers parse, mechanism IDs are unique, every referenced Markdown file exists, the mechanism ID and anchor occur in that file, and every mechanism carries source `path`, `start`, and `end` fields. It fails with exit code 1 and names the broken mechanism otherwise.

It does not read the pinned upstream repository, revalidate quoted source lines, judge whether a reference is semantically correct, check whether optional tools are configured, or show that a target project follows the procedure.

## Minimal adoption walkthrough

Choose one invariant the repository already cares about, then select the entry point by state ownership:

- **An existing state owner**: keep requirements, acceptance and the next action there; do not run `init`. Keep a check manifest beside it, for example `governance-checks.json`:

  ```json
  {
    "checks": {
      "docs": "node .agents/skills/harness-project-governance/tools/doc-gates/verify-doc-budgets.mjs"
    }
  }
  ```

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
  ```

- **No state owner, and a decision to adopt the `.governance/` protocol**:

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs init .
  # The first init exits 2: fill policy, requirements and state with project facts
  node .agents/skills/harness-project-governance/bin/governance.mjs status .
  node .agents/skills/harness-project-governance/bin/governance.mjs check .
  ```

The budget command also needs `.doc-gates/doc-budgets.json`, for example `{"README.md":60}`; 60 is an example, not a default policy. For either path, observe a pass, exceed the ceiling and confirm exit 1, then restore and observe recovery. Wire **the same verified `check` command** into existing CI, retaining `--policy` for the existing-owner path. A workflow file does not prove a remote required check is active; `check` executes registered commands rather than choosing rules. Policy commands run with local privileges and require the same trust as project scripts.

## Optional modules

- `tools/github-approval/` is an optional weighted-approval installer and workflow bundle. It needs Node.js and, for production-ownership analysis, Python >= 3.10 with Pygments. It installs files only and does not change GitHub branch protection or grant approvals; see [references/github-approval.md](references/github-approval.md).
- `tools/agent-notes/` provides Agent Note format, classification, tree, and archive verifiers. See [references/agent-notes.md](references/agent-notes.md).
- `tools/doc-gates/` provides Markdown link, wrapping, translation-pairing, budget, and package-README gates with their own pinned parser dependencies. Install them with `npm run install-doc-gates`, then configure only the gates your repository needs; do not copy this repository's thresholds wholesale.

The optional references explain the source mechanisms and migration boundaries. Reuse their requirements, not their full configuration.

## Repository layout

```text
SKILL.md                 Agent-facing procedure, hard rules, and task routing
bin/governance.mjs       verify / list / cite / init / status / check; zero dependencies
knowledge/*.json         Machine-readable mechanism ledgers (55 domains)
references/*.md          Domain explanations, source ranges, and migration notes
tools/                   Optional GitHub approval, Agent Note, and documentation modules
scripts/                 install-skill and repository demo/smoke helpers
research/fixtures/       Repository-only reproducible adoption snapshot and evidence
package.json             Node >= 22.19.0; MIT; private package
LICENSE                  License for this package
SOURCE-LICENSE.txt       Pinned upstream attribution and MIT notice
```

## Verification for contributors

```bash
npm run verify
npm run smoke
npm run test-adoption
```

`npm run smoke` checks a fresh package and install path, including the refusal to overwrite an existing Skill seat. Optional documentation gates additionally need:

```bash
npm run install-doc-gates
npm run test-doc-gates
```

Report only commands you actually ran and their exit codes.

For the independently authored consumer contract tests and retained first-failure/recovery observations, see [the public adoption fixture](research/fixtures/adoption-cli/README.md). It needs no installed Skill or dependencies. `test-adoption` is a repository-contributor command; research fixtures are not shipped in the npm runtime or Agent seat. Re-running it validates application behavior, not another autonomous Agent session. The [method report](METHODS.zh.md) distinguishes these observations from production adoption and complete source migration.


## Adopt it in your project

Start with the zero-dependency core, then add the governance checks that fit your repository:

- **Keep work traceable.** Use the Skill's requirement, acceptance, verification, and handoff workflow alongside your existing development process.
- **Choose your checks.** Configure the optional documentation, Agent Note, and approval modules for your project, and connect them to your own check commands and CI. Keep GitHub approvals and branch protection under your project's policy.
- **Share it easily.** Use this repository or the offline package on the [Releases page](https://github.com/JusticeSc/harness-project-governance/releases).

The [historical release record](PUBLIC-VERIFICATION.md) reports core installation and demo observations across Windows/Linux and Node.js 22.19/24; those observations are not a rerun of this development checkout. Detailed operating references are Chinese-first, with English CLI output and getting-started documentation.

## License and acknowledgements

This independently maintained project draws on the governance practices of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317). It is not an official DeepSeek product.

Released under the [MIT License](LICENSE). Source attribution and the original MIT notice are preserved in [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt).
