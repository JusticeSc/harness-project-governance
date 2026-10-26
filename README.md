# harness-project-governance

**[中文版 / Chinese](README.zh.md)**

**A portable project-governance Skill for coding agents.** It turns “the agent says it is done” into a traceable claim: where the requirement lives, which checks actually ran, and what remains unverified.

## Summary

A portable Agent Skill for engineering governance in real repositories. It gives coding agents a stored requirement and acceptance state, a routing table to source-linked operating references, and a completion report that separates observed evidence from unverified claims. A zero-dependency Node.js CLI verifies the bundled knowledge, lists mechanisms by domain, resolves citations, scaffolds `.governance/` metadata, and reports gaps before work starts. The material is extracted from one pinned upstream commit with boundaries intact. It does not enforce remote protection, certify the upstream source, or replace your project's checks. Start with `npm run verify`, then `npm run demo`.

## What you get

- **A starting point for an unfamiliar repository.** The agent reads a stored goal, acceptance conditions, and next action instead of guessing progress from a chat transcript.
- **Located guidance instead of generic advice.** Every mechanism has an ID, a reference section, and pinned source ranges, so an agent can show why it chose a procedure.
- **A visible gap report.** `init` and `status` list missing project facts, owners, checks, and acceptance criteria before work is called ready.
- **Honest completion language.** The operating loop requires real commands and exit codes; unrun checks stay “unverified.”
- **Incremental adoption.** The core is a Skill plus a CLI. Optional approval, Agent Note, and documentation modules can be adopted later, only where their prerequisites exist.

It is not a hosted governance service, a security audit, or a substitute for your project's tests and reviews.

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

Inspect the actual [sample application and acceptance checks](examples/task-board/README.md), or read the [observed verification and limits](PUBLIC-VERIFICATION.md). The temporary demo is removed automatically; it does not modify your projects.

On the current checkout, `verify` reports `governance: 1195 mechanisms in 55 domains; references and anchors verified`. That number describes the extracted ledger; it is not a claim that every upstream source line was reviewed or that no mechanism is missing.

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
Run `node .agents/skills/harness-project-governance/bin/governance.mjs status .` and read .governance/requirements.md plus state.json.
If .governance/ is missing, initialize it from repository facts only.
Before editing, write observable acceptance conditions into state.acceptance and route the task to the relevant references.
Then implement the task, run the real commands in policy.checks, and report each command with its exit code.
List anything you did not run as unverified; do not call the work complete from metadata alone.
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

Example against an installed Skill:

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

## What `verify` actually proves

`verify` proves package coherence: the JSON ledgers parse, mechanism IDs are unique, every referenced Markdown file exists, the mechanism ID and anchor occur in that file, and every mechanism carries source `path`, `start`, and `end` fields. It fails with exit code 1 and names the broken mechanism otherwise.

It does not read the pinned upstream repository, revalidate quoted source lines, judge whether a reference is semantically correct, check whether optional tools are configured, or show that a target project follows the procedure.

## Optional modules

- `tools/github-approval/` is an optional weighted-approval installer and workflow bundle. It needs Node.js and, for production-ownership analysis, Python >= 3.10 with Pygments. It installs files only and does not change GitHub branch protection or grant approvals; see [references/github-approval.md](references/github-approval.md).
- `tools/agent-notes/` provides Agent Note format, classification, tree, and archive verifiers. See [references/agent-notes.md](references/agent-notes.md).
- `tools/doc-gates/` provides Markdown link, wrapping, translation-pairing, budget, and package-README gates with their own pinned parser dependencies. Install them with `npm run install-doc-gates`, then configure only the gates your repository needs; do not copy this repository's thresholds wholesale.

The optional references explain the source mechanisms and migration boundaries. Reuse their requirements, not their full configuration.

## Repository layout

```text
SKILL.md                 Agent-facing procedure, hard rules, and task routing
bin/governance.mjs       verify / list / cite / init / status; zero dependencies
knowledge/*.json         Machine-readable mechanism ledgers (55 domains)
references/*.md          Domain explanations, source ranges, and migration notes
tools/                   Optional GitHub approval, Agent Note, and documentation modules
scripts/                 install-skill and repository demo/smoke helpers
package.json             Node >= 22.19.0; MIT; private package
LICENSE                  License for this package
SOURCE-LICENSE.txt       Pinned upstream attribution and MIT notice
```

## Verification for contributors

```bash
npm run verify
npm run smoke
```

`npm run smoke` checks a fresh package and install path, including the refusal to overwrite an existing Skill seat. Optional documentation gates additionally need:

```bash
npm run install-doc-gates
npm run test-doc-gates
```

Report only commands you actually ran and their exit codes.

## Adopt it in your project

Start with the zero-dependency core, then add the governance checks that fit your repository:

- **Keep work traceable.** Use the Skill's requirement, acceptance, verification, and handoff workflow alongside your existing development process.
- **Choose your checks.** Configure the optional documentation, Agent Note, and approval modules for your project, and connect them to your own check commands and CI. Keep GitHub approvals and branch protection under your project's policy.
- **Share it easily.** Use this repository or the offline package on the [Releases page](https://github.com/JusticeSc/harness-project-governance/releases).

The core installation and demo workflows have passed on Windows and Linux with Node.js 22.19 and 24. See [verification results and scope](PUBLIC-VERIFICATION.md) for reproducible commands and module-specific details. Detailed operating references are Chinese-first, with English CLI output and getting-started documentation.

## License and acknowledgements

This independently maintained project draws on the governance practices of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317). It is not an official DeepSeek product.

Released under the [MIT License](LICENSE). Source attribution and the original MIT notice are preserved in [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt).
