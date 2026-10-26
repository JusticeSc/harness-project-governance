# 协作治理迁移参考（collaboration）

> 源仓库：`deepseek-harness`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。本文引用的路径均相对于该源树，格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`。
>
> 本文是**操作参考**，不是对源仓库当前 GitHub 线上设置的断言。仓库内没有 branch protection / ruleset 的配置文件，也没有 GitHub App 安装状态的证明；凡是只能由 forge（GitHub 服务器端）配置的项目，本文会标为 **forge-only**，并把“仓库内代码已实现”与“线上门禁已生效”严格分开。
>
> 标记约定：
> - **【源义务】**：源仓库代码、配置或指令明确要求的行为；迁移时必须保留其效果。
> - **【迁移设计】**：为把源机制落到另一个仓库而必须补齐的接线、参数化或 forge 配置；源仓库没有以文件形式保存的部分。
> - **【额外建议】**：不是源仓库的硬性要求，但能降低迁移风险的加固措施；不得冒充源义务。
>
> 证据状态：作者只做了源读取与静态核对，**没有运行任何测试、没有查询任何线上 GitHub 设置**。本文与 `knowledge/collaboration.json` 中所有“验证”均标为 `planned`；集成阶段必须按命令实际执行并保存输出，不能把“代码存在”当作“门禁已验证”。

**状态区分（不得混写）**：
- **源事实**：固定提交中的代码/配置/指令确实如此，附精确范围。
- **已确认的源弱点**：源实现自身存在的缺口（如 pending 写入失败可能保留旧 success、没有 stale-review 失效、没有 Project CAS/reconciler）。这是对被审计对象的结论，不是迁移后的能力。
- **未解决的源研究**：仓库内无法证明的线上设置、App 安装、Project 字段、`gh stack`/merge queue 能力，以及未读候选文件；列在 `research/collaboration-coverage.json` 的 `unresolved` / `uninspectedCandidates`。
- **未执行的目标验证**：所有 `verification.status` 均为 `planned`；即使源测试通过，也只证明源基线，不证明目标仓库已启用 required check 或已获得线上证据。

**可选执行面**：加权审批、作者信用、生产归属和委托的独立程序已随 Skill 的 `tools/github-approval/` 提供，接入见 [审批模块](github-approval.md)。它不部署 Issue/Project 工作流，不自动改变远端设置，也不把本文 planned 场景改成已执行证据；目标仍需实际权限、生产目录、受信发布和平台拒绝/恢复记录。

## 机制 ID 索引

下表把本文的展示编号映射到 `knowledge/collaboration.json` 的稳定 mechanism ID；每个 ID 也在对应小节标题的 `<a id="...">` 锚点中可定位。

| # | 机制 ID | 参考锚点 |
|---|---|---|
| 1 | `collaboration-trusted-default-branch` | `#trusted-default-branch` |
| 2 | `collaboration-approval-status-contract` | `#approval-status-contract` |
| 3 | `collaboration-approval-eligibility` | `#reviewer-eligibility-points` |
| 4 | `collaboration-author-credit` | `#author-credit` |
| 5 | `collaboration-ownership-weighted` | `#production-ownership-weight` |
| 6 | `collaboration-production-classifier` | `#production-source-classifier` |
| 7 | `collaboration-delegation` | `#delegation` |
| 8 | `collaboration-blocker-pending` | `#blocking-review-pending` |
| 9 | `collaboration-review-event-handoff` | `#review-event-handoff` |
| 10 | `collaboration-stale-head-boundary` | `#stale-head-review-boundary` |
| 11 | `collaboration-issue-policy` | `#issue-pr-policy` |
| 12 | `collaboration-selective-preflight` | `#issue-policy-selective-preflight` |
| 13 | `collaboration-label-taxonomy` | `#label-taxonomy` |
| 14 | `collaboration-lifecycle-status` | `#issue-lifecycle-status` |
| 15 | `collaboration-lifecycle-scheduling` | `#issue-lifecycle-scheduling` |
| 16 | `collaboration-project-fields-start-date` | `#issue-project-fields-start-date` |
| 17 | `collaboration-issue-audit-repair` | `#issue-audit-repair` |
| 18 | `collaboration-issue-pr-templates` | `#issue-pr-templates` |
| 19 | `collaboration-change-scope-report` | `#change-scope-report` |
| 20 | `collaboration-pre-push-evidence` | `#pre-push-evidence` |
| 21 | `collaboration-native-stack-landing` | `#native-stack-landing` |
| 22 | `collaboration-stack-review-propagation` | `#stack-review-propagation` |
| 23 | `collaboration-code-review-procedure` | `#code-review-procedure` |
| 24 | `collaboration-forge-branch-rules` | `#forge-branch-rule-contract` |

## 0. 这套协作治理解决什么问题

源仓库把“合并一个 PR 之前需要什么”拆成四个互相独立、失败语义不同的控制面：

1. **审批控制面**：`weighted-approval` 工作流把评审意见、仓库权限、作者历史、生产代码归属和 `/delegate` 委托折算成一个 commit status；它只回答“审批分数是否达标”，不回答代码是否可合并。
2. **Issue 策略控制面**：`Issue policy` 工作流检查 PR 是否引用了真实同仓库 Issue、标签分类是否合法、解决型引用的 Priority 是否一致；它通过 = 元数据合规，不通过 = job 失败。
3. **Issue 生命周期控制面**：`Issue lifecycle` 工作流把 Issue/PR 事件投影到 GitHub ProjectV2 的 Status、Start Date，并修复确定性的 Issue 标签违规；它是事件驱动的投影，不是对账器。
4. **开发者协作程序**：`change-scope`、push 前证据选择、原生 stacked PR、stack 上的 review 修复传播、`dsh-code-review` 审阅程序。它们主要是**人的操作规范**，只有少量 hook 和测试提供机械保证。

这四层不能互相替代。特别是：

- 审批分数达标不等于 Issue 元数据合规；
- Issue policy 通过不等于审批分数达标；
- 本地测试通过不等于提交状态已被 branch rule 消费；
- 默认分支 checkout 了可信代码，不等于 PR 不能修改工作流 YAML（见 §2.1 的限制）。

## 1. 机制总览

| # | 机制 | 主要强制方式 | 自动化程度 | 关键失败信号 |
|---|---|---|---|---|
| 1 | 可信默认分支执行与策略自修改边界 | 工作流 checkout + 权限 + SHA 固定 | 自动（配置） | 工作流失败、状态缺失 |
| 2 | 加权审批 commit status 契约 | GitHub commit status + branch rule | 自动状态，forge 阻断 | `pending` / `error` |
| 3 | 评审人资格与积分 | 工作流计算 | 自动 | `ignoredReviewers`、`pending` |
| 4 | 作者历史积分 | GraphQL 合并历史 | 自动、按需 | `error`、history 不完整 |
| 5 | 生产代码归属加权 | `git blame` + Pygments | 自动、按需 | `error`、attribution 失败 |
| 6 | 生产源分类器 | Python 分类器 | 自动 | 分类失败、shallow 拒绝 |
| 7 | `/delegate` 委托 | 评论解析 + 权限 + 评审 | 自动 | `error`、dismissal 失败 |
| 8 | 阻塞评审保持 pending | 状态语义 | 自动 | `pending`（不是 `failure`） |
| 9 | 评审事件无权限交接 | 独立 `permissions: {}` 工作流 | 自动 | 无权限、run title 无效 |
| 10 | head / closed / stale 边界 | 实时 API 读取 | 自动 | 跳过、无状态写入 |
| 11 | PR Issue 策略 | `Issue policy` job | 自动 job | `::error::`、job 失败 |
| 12 | 选择性 preflight 与 legacy 回退 | 标记文件 + 工作流分支 | 自动 | preflight 失败即失败 |
| 13 | 标签分类法 | 策略校验 + Issue 修复 | 自动 | 非法 `kind/*`、旧别名 |
| 14 | Issue 生命周期状态机 | ProjectV2 Status 写入 | 自动 | 无 transition、审计评论 |
| 15 | 生命周期事件调度 | workflow trigger + job `if` | 自动 | 无 runner、无操作 |
| 16 | Project 字段与 Start Date | GraphQL ProjectV2 | 自动 | 字段缺失/类型错即失败 |
| 17 | Issue 审计与修复 | 标签删除 + 审计评论 | 自动 | 审计评论、剩余错误 |
| 18 | Issue / PR 模板 | 模板文件 + 模板测试 | 半自动（测试） | 测试失败 |
| 19 | `change-scope` 报告 | Node CLI + Git | 工具 | 非零退出、歧义 ref |
| 20 | push 前证据与历史安全 | Skill + hooks + CI | 半自动 | 检查失败、lease 中止 |
| 21 | 原生 stacked PR 落地 | `gh stack` + GraphQL | 人工 + forge | hard-stop、非 `MERGED` |
| 22 | stack review 修复传播 | 人工程序 | 人工 | 未在引入层修复、OID 失效 |
| 23 | code review 程序 | 人工 + 评审门禁 | 人工 | 实质缺陷漏检 |
| 24 | forge 分支规则精确契约 | GitHub 设置 | forge-only | 状态不匹配、门禁未生效 |

---

## 2. 审批与合并门禁

### 2.1 可信默认分支执行与策略自修改边界 <a id="trusted-default-branch"></a>

**触发**：任何会计算审批或 Issue 策略的 PR 事件、review 事件、PR 评论事件。

**前置条件**：仓库存在默认分支；工作流文件已在默认分支；GitHub Actions 可用；`actions/checkout`、`actions/setup-python`、`actions/create-github-app-token` 等 action 已按 SHA 固定（迁移时重新固定到目标仓库允许的提交）。

**角色**：
- 维护者：合并策略/程序变更，配置 branch rule 与 App。
- 工作流：只执行默认分支上的策略程序，把 PR 的 review/comment/文件元数据当**数据**读取。
- PR 作者：不能让自己的 PR 改变本次运行所用的策略程序。

**步骤（源义务）**：
1. `weighted-approval.yml` 的 `Check out trusted approval policy` 使用 `ref: ${{ github.event.repository.default_branch }}` 与 `persist-credentials: false`，只检出默认分支；脚本从检出目录读取 `approval-policy.json`，不从 PR head 读取。
2. 该工作流的事件是 `pull_request_target`，不是 `pull_request`；因此工作流 YAML 与检出内容都来自默认分支。`pull_request_target` 只提供 base 仓库上下文，不能把 PR head 检出来执行。
3. 状态写入 job 只使用 `GITHUB_TOKEN`，权限为 `contents: read`、`pull-requests: write`、`statuses: write`；不使用仓库 secrets；不执行 PR 代码。
4. `weighted-approval-review-event.yml` 只做无权限的记录（`permissions: {}`），把 PR 编号放进 `run-name`；真正的发布由默认分支上的 publisher 通过 `workflow_run` 完成。
5. 审批策略变更只有在合并进默认分支后才生效；PR 内的 `approval-policy.json`、`check-approval.mjs`、`blame-production.py` 不会影响该 PR 自己的运行。
6. `issue-policy.yml` 与 `issue-lifecycle.yml` 都 checkout 默认分支上的 Node 策略代码；`persist-credentials: false`；策略代码不从 PR head 读取。

**完成信号**：日志显示 checkout 的 ref 是默认分支；工作流权限符合上表；发布脚本没有读取 PR head 文件。

**失败处理**：checkout 失败 → job 失败，不产生可信结果；策略解析失败 → `error` 状态（审批）或 job 失败（Issue policy）；App token 创建失败 → job 失败。

**例外**：
- `issue-policy.yml` 与 `issue-lifecycle.yml` 使用 `pull_request`，所以**工作流 YAML 本身来自 PR head**（GitHub 对 `pull_request` 的 workflow 解析使用 PR 的 merge/head 上下文）。源仓库只保证“Node 策略代码来自默认分支”，不保证“YAML 不可被 PR 修改”。这是源实现的实际信任边界，不能宣称更强。
- `weighted-approval` 的 `issue_comment` 事件可由任意评论者触发，但运行的是默认分支代码，评论内容只作为数据处理。
- 如果 checkout 或第一次 `pending` 状态写入本身失败，`steps.revoke.outputs.active` 不会变成 `true`，末尾的 `error` 步骤不会执行；同一 head 上的旧 `success` 可能保留（详见 §2.2 的证据限制）。

**证据限制**：`scripts/ci-workflow.spec.ts:1234-1331` 固定了 weighted-approval 的 checkout ref、权限、事件和命令；`policy.test.mjs:894-916` 断言 issue-policy 源文件不含 `pull_request.head` / `pull_request_target`，并检查默认分支 checkout 与 `persist-credentials: false`。这些测试证明**文件内容**，不证明线上 branch rule 或 App 权限。

**源**：`deepseek-harness/.github/workflows/weighted-approval.yml:1-66@687f282e`；`deepseek-harness/.github/workflows/weighted-approval-review-event.yml:1-18@687f282e`；`deepseek-harness/.github/workflows/issue-policy.yml:19-58@687f282e`；`deepseek-harness/.github/workflows/issue-lifecycle.yml:41-57@687f282e`；`deepseek-harness/.github/review-ownership/README.md:45-49@687f282e`；`deepseek-harness/.github/issue-management/README.md:11-29@687f282e`。

---

### 2.2 加权审批 commit status 契约 <a id="approval-status-contract"></a>

**触发**：
- `pull_request_target`：`opened`、`synchronize`、`reopened`、`ready_for_review`、`converted_to_draft`、`edited`（包括 base branch 变更）。
- `issue_comment`：`created`、`edited`、`deleted`，且当前或前一个 body 含 `/delegate`，并且 issue 是 open PR。
- `workflow_run`：`weighted-approval-review-event` 完成且成功。

**前置条件**：`approval-policy.json` 可解析；`GITHUB_TOKEN` 可读 review/comment/collaborator/status；目标 PR 仍 open 且 head 未变；Python 3.10 + `requirements.txt`（Pygments）在 `pending` 成功写入、`active=true` 时安装——源实现是每个 active 事件都安装，而不是只在确实需要归属测量时安装。

**角色**：publisher 工作流（唯一写入者）；评审人（提供当前决策）；PR 作者（提供作者积分，不提供评审积分）；GitHub（提供权限与 review API）。

**状态语义（源义务）**：
- 发布两个**不同**的检查：名为 `weighted approval publisher` 的 Actions job，以及 context 为 `weighted approval` 的 commit status。job 只表示“求值与状态发布是否完成”；commit status 才表示审批决定。
- 在安装 Python/Pygments 之前，先发布 `pending`（`Preparing approval evaluation.`），使 setup 失败或历史抓取中断不能保留旧的 success。
- 求值完成：分数低于阈值、PR 是 draft、或有写权限评审人的有效 `CHANGES_REQUESTED` → `pending`；只有“ready + 分数达标 + 无阻塞”才 `success`；求值异常 → `error`。
- 代码从不发布 `failure`；`error` 是运行失败信号，`pending` 是可恢复的未达标信号。
- 描述最长 140 字符；`target_url` 必须是 HTTPS；context 固定为小写 `weighted approval`。
- 发布到 `POST /repos/{repository}/statuses/{headSha}`，因此状态天然绑定当前 head。

**步骤**：
1. 解析事件到当前 PR；closed/merged PR、普通 Issue、head 已变化的 PR 直接跳过，不写状态、不 setup。
2. `check-approval.mjs pending` 发布 `pending`；只有该阶段写 `GITHUB_OUTPUT active=true`。
3. `active=true` 时才安装 Python 3.10 与 lexer，然后运行 `check-approval.mjs`。
4. 求值完成后发布 `success`/`pending`，再尝试为未批准的 delegate 请求 review。
5. 任一失败且 `active=true` → 末尾步骤发布 `error`。

**完成信号**：PR head 上存在 context `weighted approval` 的最新状态；日志含 `Published "weighted approval" status ...` 或 `Published approval ...`。

**失败处理**：
- 求值异常：发布 `error`，重新抛出，job 失败。
- setup/lexer 安装失败：`error` 状态（前提是 `pending` 已成功写入）。
- 状态写入失败：job 失败；旧状态可能留在同一 head 上（见下）。
- review request 失败：只记录日志，不改变已发布分数；下一次求值重试。

**例外与限制**：
- 关闭/合并 PR、stale head、普通 Issue 评论：不发布状态。
- `pending` 之前的失败（checkout 失败、`pending` 写入失败）不会触发 `error` 步骤；同一 head 的旧 `success` 可能保留。这是源工作流的真实缺口；迁移时若要更强保证，应额外增加独立的“状态新鲜度”检查，但那是【额外建议】，不能声称源已实现。
- 如果 review 事件工作流被禁用或未运行，同一 head 上的旧 `success` 不会被刷新；审批分数本身不会自动过期。原生 branch rule 的 “dismiss stale approvals / require latest push” 不由此工作流提供（§2.10）。
- 状态是 commit status，不是 check run；branch rule 必须按 context + expected source 匹配（§2.11）。
- review、delegation comment 等列表按每页 100 拉取，累计达到或超过 3000 条即抛错；源实现不会在超限时返回部分分数。超长历史 PR 需要迁移时另设上限或分段策略，但那是【额外建议】。

**源**：`deepseek-harness/.github/review-ownership/README.md:5-49@687f282e`；`deepseek-harness/.github/workflows/weighted-approval.yml:1-66@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:10-15@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:312-368@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:470-481@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-09-blocked-weighted-approvals-remain-pending.md:1-34@687f282e`。

---

### 2.3 评审人资格与积分 <a id="reviewer-eligibility-points"></a>

**触发**：每次审批求值。

**前置条件**：policy 文件只含 `defaultPoints`、`requiredPoints`、`reviewerPoints` 三个字段；三个值都是正整数；`reviewerPoints` 的 login 合法且大小写不重复。

**当前源参数**：`requiredPoints: 2`，`defaultPoints: 1`；`@07akioni`、`@imccyu`、`@tianyicui`、`@tianyicui-bot`、`@turtle1999`、`@turtle2099` 各 2 分；其他有 `write`/`admin` 的评审人 1 分。

**角色**：评审人；publisher（读取 `GET /repos/{repo}/collaborators/{login}/permission`）；策略文件（权重）。

**规则（源义务）**：
1. 只有“当前 base 仓库计算权限”为 `write` 或 `admin` 的评审人计数。404 视为 `none`；其他权限读取错误抛出。
2. PR 作者自己的 review 不计数；作者从 participants 中删除。
3. 每个评审人只取 GitHub 返回的**当前** `APPROVED` 或 `CHANGES_REQUESTED` 决策；`DISMISSED` 清除该评审人的既有决策（包括更早的 approval）；`COMMENTED`/`PENDING` 不替换决策。
4. 每个评审人按 policy 的固定权重或默认权重计分；固定 2 分评审人不受生产归属加权影响。
5. 没有写权限的评审人进入 `ignoredReviewers`，不影响分数；日志列出。
6. 被删除账号（`review.user === null`）跳过；无效 state、无效 login 直接使求值失败，而不是静默忽略。
7. 权限在事件发生时读取；权限变更在下一个订阅事件才生效。

**步骤**：
1. 拉取全部 review（每页 100，达到或超过 3000 条即失败）。
2. 按时间顺序折叠为每个 login 的当前决策。
3. 过滤作者；解析 `/delegate` 命令参与者；对每个参与者查询当前权限。
4. 对每个有写权限的 login：若其（或受托人）当前 `APPROVED`，加入 approvals；分数为 policy 固定值或 default。
5. 有写权限且 `CHANGES_REQUESTED` 的评审人进入 blockers。

**完成信号**：日志 `Counted approvals` 与 `Ignored reviewers without write access` 符合预期；状态描述显示 `x/2 approval points`。

**失败处理**：policy 非法 → job 失败；review 列表不完整/超过上限 → job 失败/`error`；权限 API 非 404 错误 → `error`。

**例外**：bot 评审人（如 `dependabot[bot]`）与人类使用同一规则；作者自己的 bot 身份同样被排除。固定 2 分评审人即使拥有生产代码也不额外加权。

**证据限制**：`check-approval.test.mjs:37-65` 覆盖 policy 解析/拒绝；`66-82` 覆盖当前决策与 dismissal；`154-233` 覆盖 1/2 分与 404；`235-290` 覆盖 blocker 与 draft。测试不证明线上 collaborator 权限。

**源**：`deepseek-harness/.github/review-ownership/approval-policy.json:1-12@687f282e`；`deepseek-harness/.github/review-ownership/README.md:21-29@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:30-80@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:214-260@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:456-468@687f282e`。

---

### 2.4 作者历史积分 <a id="author-credit"></a>

**触发**：PR 不是 draft、没有 blocker、评审人总分低于 `requiredPoints` 时。

**前置条件**：PR 作者有不可变 account ID（REST `user.node_id`）；GraphQL 可读同仓库 merged PR 历史；当前 PR 编号有效。

**公式（源义务）**：`authorCreditPoints = min(100, mergedPRCount) × 11 / 1000`。0 → 0；50 → 0.55；90 → 0.99；91 → 1.001；100 及以上 → 1.1。作者积分不能单独满足 2 分阈值；作者自己的 review 仍被排除。

**规则**：
1. 只统计**本仓库**、`MERGED` 状态、作者 account ID 与当前 PR 作者相同的 PR；排除当前 PR。
2. 按 `CREATED_AT DESC` 分页，每页 100；最多数到 100 个匹配即停止。
3. 重复页码/重复 PR 编号去重；cursor 未前进、GraphQL errors、节点结构不完整 → 失败，不返回部分分数。
4. 人类与 bot 作者（包括 Dependabot）同一规则。
5. draft、blocker、评审人分数已达标 → 跳过历史查询，日志标记 `not evaluated` 及原因。
6. 历史查询失败 → `error` 状态。

**角色**：publisher；GitHub GraphQL。

**完成信号**：日志 `Author credit: <points> (<count> merged PRs).`；显示分数含 `(author <points>)`。

**失败处理**：不完整历史 → 抛错 → `error`；不降级为 0 分。

**证据限制**：`author-weight.test.mjs:11-47` 覆盖同账号、排除当前 PR、删除账号、cursor、100 上限与不完整响应；`check-approval.test.mjs:501-525` 与 `check-approval.test.mjs:570-667` 覆盖组合阈值和 bot。

**源**：`deepseek-harness/.github/review-ownership/README.md:23@687f282e`；`deepseek-harness/.github/review-ownership/author-weight.mjs:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-16-author-approval-credit.md:1-26@687f282e`。

---

### 2.5 生产代码归属加权 <a id="production-ownership-weight"></a>

**触发**：PR 不是 draft、没有 blocker、评审人分数 + 作者积分仍低于阈值，且至少有一个 default 权重（当前 1 分）的 approval。

**公式（源义务）**：对每个 default 权重 approval，令 `ownedLines` 为其在“被修改或删除的旧生产代码行”中的归属行数，`totalLines` 为所有此类行的总数：

```
points = min(requiredPoints, defaultPoints + (requiredPoints - defaultPoints) × 4 × ownedLines / totalLines)
```

当前参数（required=2、default=1）下：0% → 1；12.5% → 1.5；25% 及以上 → 2。新增加的行不进入分母；分母为 0 不提升；固定 2 分评审人保持不变；比较用未四舍五入的分数，容差 `1e-12`；显示最多 3 位小数。

**前置条件**：完整 Git 历史；live base ref；精确 reviewed head；`GITHUB_TOKEN`；Python 3.10 + Pygments；`git` 可用；base ref 通过 `git check-ref-format refs/heads/<base>`。

**步骤**：
1. 读取 live PR，确认 `head.sha` 等于事件 head，base ref 合法。
2. 用 job token 配置 Git `http.<server>/.extraheader`，fetch base ref 与 head SHA；若本地是 shallow，先 `--unshallow`。
3. 取 `FETCH_HEAD` 作为 base SHA，调用 `blame-production.py <baseSha> <headSha>`；分类与 blame 都在 merge base 上，不 checkout PR 代码。
4. Python 返回 `{mergeBase, files, totalLines, commitLines}`；Node 按 commit SHA 批量 50 个查询 GitHub commit-author 账号，汇总每个 login 的 `reviewerLines`。
5. 对 default 权重 approval 应用公式；固定权重 approval 不变。
6. 记录 `ownedLines/totalLines` 到日志和状态描述。

**完成信号**：日志显示每个计数 approval 的 `(ownedLines/totalLines old production lines)`；分数达到阈值。

**失败处理**：PR head 变化、base ref 非法、历史不完整、Python 解析失败、GraphQL author 查询失败/不完整 → 抛错 → `error` 状态；不降级为无归属的普通 1 分。

**例外**：
- blocker、draft、评审人分数已足够、没有 default 权重 approval → 不测量。
- 纯 rename 没有 changed old lines；rename + edit 使用旧路径；删除文件的全部 eligible 旧行计入。
- 未关联 GitHub 账号的 commit author 保留在分母中，但不贡献给任何评审人。
- 空分母不提升。
- 每个 PR 只测量一次，所有评审人共享；author 查询按 50 个一批。

**证据限制**：`check-approval.test.mjs:392-463` 与 `check-approval.test.mjs:501-525` 覆盖跳过、失败、阈值；`blame-ownership.test.mjs:8-52` 覆盖批量与不完整查询；`test_blame_production.py:44-215` 覆盖真实 Git 历史的 merge base、rename、删除、混合注释行、排除、shallow 拒绝、fetch 不 checkout PR。作者未运行这些测试。

**源**：`deepseek-harness/.github/review-ownership/README.md:25@687f282e`；`deepseek-harness/.github/review-ownership/blame-ownership.mjs:1-86@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-11-production-blame-approval-weight.md:1-36@687f282e`。

---

### 2.6 生产源分类器 <a id="production-source-classifier"></a>

**触发**：生产归属测量时，对每个 changed file 判断是否属于“生产源”。

**生产路径（源义务）**：
- `packages/`、`apps/`、`python/`、`native/` 下，路径组件含 `src` 的文件；
- 或 `apps/desktop/renderer/`、`packages/experimental/code-runtime-python/py/` 前缀；
- 或精确文件 `python/sdk-runtime/runtime-bootstrap.mjs`、`packages/experimental/webworker-packer/bin.js`。

**扩展名**：`.ts`、`.tsx`、`.js`、`.jsx`、`.mjs`、`.cjs`、`.css`、`.scss`、`.py`、`.c`、`.h`、`.cpp`、`.hpp`、`.rs`、`.html`。

**排除（源义务）**：
- 路径组件：`vendor`、`node_modules`、`dist`、`lib`、`build`、`coverage`、`target`、`test`、`tests`、`__tests__`、`fixture`、`fixtures`、`snapshot`、`snapshots`、`testing`、`test-support`、`support`、`examples`、`docs`、`gen`、`generated`、`generated-effect`。
- 文件名：`.test.`、`.spec.`、`.e2e.`、`.gen.`、`.generated.`、`.d.`；`stem === 'testing'`。
- 生成文件：文件开头（leading comments/docstrings）匹配 `auto-generated|automatically generated|generated by|do not edit`（大小写不敏感）→ 整个文件 0 行。
- 注释、空行、docstring 不计；混合代码/注释行只要含非注释 token 就计；C 预处理指令计。

**步骤**：
1. `git diff --raw -z --no-abbrev --find-renames --no-ext-diff --no-textconv <base> <head> --` 取旧路径、旧 blob、新 blob；只接受 `100644`/`100755`。
2. 旧 blob 用 `git cat-file blob` 读取（UTF-8 replace）；用 Pygments 按扩展名选择 lexer，计算 eligible 行。
3. 删除文件（新 blob 全 0）→ 全部 eligible 行 changed；否则用 `git diff --unified=0` 解析旧侧 hunk 范围，取 eligible 交集。
4. 若 changed 为空 → 跳过；否则对 `min..max` changed 行执行一次 `git blame --line-porcelain -L`，只统计 changed 行对应的 commit。
5. 若归属行数不等于 changed 行数 → 失败；返回 JSON。

**完成信号**：Python stdout 是合法 JSON，`totalLines === sum(commitLines)`，Node 侧校验通过。

**失败处理**：base/head 不是完整 40 位 SHA、仓库是 shallow、Git 命令超时/失败、blame 不完整、非生产路径全部排除 → 相应失败或空结果；不得用不完整 blame 估算。

**例外**：纯 rename 的 changed old lines 为空；注释-only 修改为空；二进制标记替换仍按旧内容分类（测试覆盖）；非 UTF-8 blob 以 replace 读取。

**证据限制**：`test_blame_production.py` 用真实临时 Git 仓库覆盖；`check-approval.test.mjs` 只覆盖 Node 侧的跳过与失败，不覆盖 lexer。

**源**：`deepseek-harness/.github/review-ownership/README.md:27@687f282e`；`deepseek-harness/.github/review-ownership/blame-production.py:1-135@687f282e`；`deepseek-harness/.github/review-ownership/test_blame_production.py:44-215@687f282e`。

---

### 2.7 `/delegate` 委托 <a id="delegation"></a>

**触发**：PR conversation comment 的 `created`、`edited`、`deleted`；当前或前一个 body 含 `/delegate`；issue 必须是 open PR。

**命令语法（源义务）**：整条评论 trim 后必须完全匹配：

```
/delegate @<login>
```

- `<login>` 必须匹配 `^[A-Za-z0-9-]+(?:\[bot\])?$`；大小写不敏感匹配账号。
- 带引用、代码块、额外文本、review body、inline review comment、多个命令、`/delegate writer`（缺 `@`）、非法 login 都不算。
- 前后空白允许。
- 命令作者与受托人都必须当前拥有 `write`/`admin`，且都不是 PR 作者；否则忽略。
- 自委托（`/delegate @自己`）删除既有委托，恢复自己的决策。

**角色**：sender（转移自己的积分）；delegate（接收积分，但只在自身 `APPROVED` 时生效）；publisher（解析、权限校验、dismiss、请求 review）；GitHub（权限/review API）。

**步骤**：
1. 拉取全部 PR conversation comments（每页 100；达到或超过 3000 条即失败）。
2. 解析候选命令；每条必须有正数 `id`、`node_id`、`user.node_id`、合法 `created_at`。
3. 对候选按 100 条批量查 GraphQL `nodes(ids:)`，要求返回数量与顺序一致，`id/body/createdAt/author.id` 与 REST 一致，`lastEditedAt` 字段存在。
4. 若 `lastEditedAt !== null` 且 `editor.id !== author.id` → 该命令被他人编辑，忽略；缺失或不一致 → 求值失败。
5. 按 comment creation 顺序处理：sender 必须是 writer；不同 sender 各自保留最新命令；编辑旧命令不改变顺序；删除较新命令可能恢复较旧命令。
6. 对每个 sender，检查其命令之后（`submitted_at >= createdAt`）是否有任何非 `PENDING` review；有则撤销委托（`DISMISSED`、`COMMENTED`、`APPROVED`、`CHANGES_REQUESTED` 都算；时间相等时 review 优先）。
7. 对仍活跃的委托：dismiss 该 sender 的所有既有 `APPROVED`/`CHANGES_REQUESTED` review（不 dismiss comment/pending）；确认返回 `state: DISMISSED` 且 id 一致；失败 → `error`。
8. dismiss 成功后重新求值；若 sender 在 dismiss 期间提交了新 review，按时间戳重新判断，不会误 dismiss 新 review。
9. 对未批准的 delegate，读取当前 requested reviewers，去掉已请求者，再 `POST` 请求剩余；请求失败只记录，不改变分数，下次重试。

**积分规则**：
- 每个 sender 最多贡献一次，使用 sender 自己的固定权重或生产归属权重。
- delegate 可以接收多个 sender 的积分，但**不能转发**已接收的积分；链式委托不传递。
- 作者积分不能委托。
- 其他评审人的有效 `CHANGES_REQUESTED` 仍然阻塞。
- sender 的旧 review 被 dismiss 后，其旧 change request 才停止阻塞；只有 sender 在命令之后提交的 review 才自动收回积分。
- delegate 的 approval 被 dismiss/替换 → 计入的积分消失，但委托仍活跃，等 delegate 下一次 approval。
- 日志应标识每个计分 owner 与 delegate。

**完成信号**：日志 `Dismissed @sender's review ... for delegation to @delegate.`；`Requested delegated reviews from ...`；approvals 日志含 `(delegated to @...)`。

**失败处理**：comment 历史不完整、GraphQL 编辑历史不一致、时间戳非法、dismiss 失败/未确认 → `error`，且不请求 review；review request 失败 → 仅日志，分数不变。

**例外**：
- draft 不 dismiss、不请求 review；但命令保留，PR ready 后重新协调。
- 命令事件被并发队列替换 → 后续事件重新协调全部活跃命令。
- 已被批准的 delegate 不需要新请求。
- 评论作者只能由作者本人编辑；他人编辑不能转移或取消其积分。

**证据限制**：`check-approval.test.mjs:669-1131` 覆盖积分守恒、双方权限、作者排除、一跳、撤销、编辑授权、分页、dismiss、请求、失败；`2026-09-15-pr-approval-delegation.md` 记录取舍。测试不证明真实 GitHub 评论编辑历史与 App 权限。

**源**：`deepseek-harness/.github/review-ownership/README.md:35-41@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:135-201@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:214-310@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:428-438@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-15-pr-approval-delegation.md:1-34@687f282e`。

---

### 2.8 阻塞评审保持 pending，而不是 failure <a id="blocking-review-pending"></a>

**触发**：求值完成，但存在有写权限评审人的有效 `CHANGES_REQUESTED`。

**规则（源义务）**：
- 有效 blocker 支配总分：即使 counted approvals 已达到 2 分，状态仍是 `pending`。
- draft 也是 `pending`。
- 只有 ready + 分数达标 + 无 blocker → `success`。
- 求值异常 → `error`，不是 `failure`。
- `weighted approval publisher` job 可以在 `pending` 状态下成功完成；它只表示发布流程完成，不表示审批通过。

**为什么**：把可逆的 review 状态（请求修改）与运行故障（`error`）分开；branch rule 因 `pending` 不满足 required status 而阻断，贡献者能从状态描述和 review 判断剩余工作。

**完成信号**：状态描述含 `1 blocking change request.` 或 `N blocking change requests.`；状态为 `pending`；publisher job 可能 success。

**失败处理**：不要为了“让检查变绿”把 blocker 改成 failure 或忽略；不要把 publisher job 当作审批门禁。

**例外**：只读评审人、作者本人、被删除账号的 `CHANGES_REQUESTED` 不算 blocker；`DISMISSED` 清除该评审人的 blocker。

**证据限制**：`check-approval.test.mjs:235-290` 固定 blocker 状态；`2026-09-09-blocked-weighted-approvals-remain-pending.md` 记录决策。

**源**：`deepseek-harness/.github/review-ownership/README.md:19@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:277-290@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-09-blocked-weighted-approvals-remain-pending.md:1-34@687f282e`。

---

### 2.9 评审事件的无权限交接 <a id="review-event-handoff"></a>

**触发**：`pull_request_review` 的 `submitted`、`edited`、`dismissed`。

**设计（源义务）**：
- 独立的 `weighted-approval-review-event.yml` 只运行一个 `echo`，`permissions: {}`，不 checkout、不碰 secrets、不写状态。
- `run-name: weighted-approval-review-event:${{ github.event.pull_request.number }}` 把 PR 编号放进 run title。
- publisher 由 `workflow_run`（`workflows: [weighted-approval-review-event]`, `types: [completed]`）触发；它只接受：
  - `workflow_run.path === '.github/workflows/weighted-approval-review-event.yml'`；
  - `workflow_run.event === 'pull_request_review'`；
  - `workflow_run.conclusion === 'success'`；
  - `display_title` 精确匹配 `^weighted-approval-review-event:([1-9][0-9]*)$`；
  - `head_sha` 是 40 位小写十六进制；
  - 若 `pull_requests` 数组非空，必须包含该编号；
  - 重新读取 PR 后，PR 必须 open 且 `head.sha` 等于 `workflow_run.head_sha`；closed 或 head 变化 → 跳过。
- 不能用 `workflow_run.name` 识别工作流：GitHub 可能把 `run-name` 展开进 `name`；必须用 `.path`。
- 该工作流本身没有 `GITHUB_TOKEN` 权限；publisher 的写权限只存在于默认分支 job。

**步骤**：
1. review 事件运行记录 job；run title 带 PR 编号。
2. publisher 收到 completed run；校验 path/event/conclusion/title/head。
3. 读取 live PR；closed 或 stale head → null → 跳过。
4. 用 PR 编号拉取 review/comment；重新计算并发布状态。

**完成信号**：publisher 日志显示 `workflow_run` 求值，而不是“跳过 stale/closed”。

**失败处理**：path/event/conclusion/title/head 任一不合法 → 抛错，job 失败；不发布部分结果。review-event 工作流没有权限，因此不能伪造状态；它只能触发 publisher 重新读取事实。

**例外**：`workflow_run.pull_requests` 可能为空；run title 是编号来源。review-event 的 job 只在 PR open 时运行；closed PR 不产生成功记录。

**证据限制**：`check-approval.test.mjs:84-135` 覆盖 path、event、conclusion、title、head；`ci-workflow.spec.ts:1234-1331` 固定 `permissions: {}`、run-name 与事件。测试不证明 GitHub 的 workflow_run 关联行为。

**源**：`deepseek-harness/.github/workflows/weighted-approval-review-event.yml:1-18@687f282e`；`deepseek-harness/.github/review-ownership/README.md:31-47@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:371-397@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:522-529@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-10-approval-review-workflow-identity.md:1-26@687f282e`。

---

### 2.10 head、closed、stale review 与原生规则边界 <a id="stale-head-review-boundary"></a>

**触发**：任何状态写入前；任何 review 事件；任何 PR 同步/编辑。

**规则（源义务）**：
1. 状态始终写到事件的 `pull_request.head.sha`；写入前重新读取 live PR，head 变化则跳过（`approvalEventFromPullRequest` 比较 live head）。
2. `workflow_run` 路径比较 `workflow_run.head_sha` 与 live PR head；不同则跳过。
3. `issue_comment` 路径读取 live PR；closed → 跳过；普通 Issue → 跳过。
4. closed/merged PR 在状态写入和依赖安装之前跳过。
5. publisher 不订阅 master push；master 上的基础分支变化不会直接触发重新求值。PR 的 `edited`（包括 base branch change）会触发。
6. 审批工作流**不按 review 的 commit 使 approval 失效**；它只取当前 review 决策。`DISMISSED` 清除决策。
7. 仓库的原生 pull-request 规则拥有 “dismiss stale reviews / require approval of latest push / require branches up to date” 等要求；本工作流不实现它们。
8. 同一 PR 的 pull_request、review、comment 事件共享一个 concurrency group；`cancel-in-progress: false`，不取消进行中的求值。

**完成信号**：跳过时日志 `Skipped an issue, closed pull request, or superseded pull-request head.`；正常时状态写到当前 head。

**失败处理**：live 状态读取失败 → `error`/job 失败；不得用事件里的旧 head 继续写状态。

**例外与限制**：
- 同一 head 上的 review 变化依赖 review-event 工作流触发；若该工作流未运行，旧 `success` 可能保留。
- 如果 branch rule 不启用原生 stale-review / latest-push 规则，旧 commit 上的 approval 仍可能被计分；这是 forge 配置缺口，不是代码 bug。
- 状态是 per-commit；新 commit 没有状态，required check 自然不满足。
- 并发只保证按 PR 串行，不保证跨 PR 顺序；不提供 compare-and-swap。

**证据限制**：`check-approval.test.mjs:1013-1045` 与 `check-approval.test.mjs:1133-1146` 覆盖 comment/PR 的 live head 与 closed 跳过；`ci-workflow.spec.ts` 固定 concurrency 与事件。线上 branch rule 的 stale/latest-push 设置不可由仓库证明。

**源**：`deepseek-harness/.github/review-ownership/README.md:29-31@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:400-425@687f282e`；`deepseek-harness/.github/workflows/weighted-approval.yml:17-19@687f282e`。

---

### 2.11 原生分支规则的精确契约（forge-only） <a id="forge-branch-rule-contract"></a>

> 本节是 **【迁移设计】** 为主：源仓库没有把 GitHub branch protection/ruleset 保存为文件。下面每一条都来自源 README/工作流/测试的**意图**；必须在目标仓库的 GitHub 设置中逐项核对，不能仅凭仓库文件宣称已生效。

| 门禁 | 精确配置 | 满足条件 | 拒绝条件（不得声称等价） | 源证据 |
|---|---|---|---|---|
| 加权审批 | required status check，context **精确等于** `weighted approval`，expected source **GitHub Actions** | 当前 head 上该 context 的最新状态为 `success` | 只配 context、不配 expected source：任何有 `statuses: write` 的第三方都可以发同名 `success`；只要求 `weighted approval publisher` job：该 job 在分数 `pending` 时也能成功；把 job 与 status 混为同一个门禁 | `deepseek-harness/.github/review-ownership/README.md:19@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:13@687f282e`；`deepseek-harness/.github/review-ownership/check-approval.mjs:470-481@687f282e` |
| Issue policy | required check，job 名 **`Issue policy`** | 当前 head 上该 job 成功；PR 在订阅事件上运行过 | 不要求该 job；要求一个从不运行的 workflow；把 `Issue lifecycle` 当作校验门禁（它是写 Project 的 lifecycle，不是 PR 元数据校验） | `deepseek-harness/.github/issue-management/README.md:11-27@687f282e`；`deepseek-harness/.github/workflows/issue-policy.yml:15-16@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-07-selective-issue-policy-evaluation.md:32@687f282e` |
| CI 聚合 | required status **`all checks passed`**（单一稳定聚合） | 该聚合成功；所有 blocking job 都在 `needs` 中 | 逐条要求矩阵 leg（名称随 lane 变化）；聚合遗漏 blocking job；用 skipped 冒充 success（聚合显式拒绝 skipped） | `deepseek-harness/.github/workflows/ci.yml:729-738@687f282e` |
| E2E（历史配置） | 归档记录称 branch protection 继续要求 `e2e` | `e2e` job 成功，或受信任的 job-level skip 报告成功 | 在 fork/Dependabot 上硬失败；把 skip 当 live 证据；把这条历史记录当成当前线上事实 | `deepseek-harness/.agents/notes/archived/process/2026-07-23-portable-required-pull-request-ci.md:18@687f282e`；`deepseek-harness/.github/workflows/e2e.yml:18-30@687f282e`；`deepseek-harness/.github/workflows/e2e.yml:48-63@687f282e` |
| stale review / latest push | 由 GitHub 原生 PR 规则配置 | 若启用：push 后旧 approval 失效；要求最新 push 的 approval | 宣称 weighted approval 已按 review commit 失效；只依赖加权分数而不启用原生规则；把“当前 decision”误当成“当前 commit 的 decision” | `deepseek-harness/.github/review-ownership/README.md:29@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-15-pr-approval-delegation.md:34@687f282e` |
| stacked PR | 原生 GitHub stack 对每层应用 trunk 规则与 CI | 每个选中层独立满足 review/check；merge queue 可能分组落地 | 把 top layer 的 ready 当成所有层 ready；逐 PR `gh pr merge` + 手动 retarget 绕过 stack；假设 stack merge 一定原子落地 | `deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:3-99@687f282e` |
| workflow 自修改 | 【额外建议】对 `.github/workflows/**`、`.github/review-ownership/**`、`.github/issue-management/**` 的变更要求 owner review/审批 | 变更合并后才影响默认分支执行 | 仅凭“checkout 默认分支”就认为 PR 不能改 workflow YAML；把 `pull_request` 运行当成完全可信 | 本参考 §2.1 的限制；源仓库无 CODEOWNERS |

**迁移时必须做的检查**：
1. 读取 branch protection/ruleset（需显式授权）：required status checks 的 context、app/source、strict/up-to-date、dismiss stale、require latest push、required approvals。
2. 确认 `weighted approval` 的 expected source 是 GitHub Actions，而不是 “Any source”。
3. 确认 `Issue policy` 是 required check，且其 workflow 在 `opened/edited/synchronize/reopened/labeled/unlabeled/ready_for_review/review_requested/pull_request_review.submitted` 上都会运行。
4. 确认 `all checks passed` 的 `needs` 覆盖所有 blocking job；不要把 `ci-master.yml` 的 master-only lane 加进 PR 门禁。
5. 若启用 native stack/merge queue，确认每层都受 branch rule 约束，且不能通过逐 PR merge 绕过。
6. 对 `.github/**` 的变更配置 CODEOWNERS 或等价 owner review；这是源仓库没有的额外加固，不冒充源义务。

**拒绝条件（整体）**：
- 只要有一项 required check 实际未配置，就不能声称该控制面“已迁移”。
- 只要 `weighted approval` 只按 context 匹配，就不能声称审批门禁防伪造。
- 只要原生 stale-review/latest-push 未启用，就不能声称“旧 commit 的 approval 不会计入”。
- 只要没有 `Issue policy` required check，就不能声称 Issue 元数据会阻断合并。
- 只要没有 `.github/**` 的 owner review，就不能声称 PR 不能通过修改工作流 YAML 来影响自己的门禁。

**证据限制**：仓库内没有 branch protection 文件；`scripts/ci-workflow.spec.ts` 只验证工作流声明，不验证线上设置。必须保存 `gh api`/UI 的只读证据，并记录读取时间、仓库、分支规则名称。远程读取需要显式授权；不得修改生产保护设置。

---

## 3. Issue 策略与生命周期

### 3.1 PR Issue 策略 <a id="issue-pr-policy"></a>

**触发**：`issue-policy.yml` 的 `pull_request`（`opened`、`edited`、`synchronize`、`reopened`、`labeled`、`unlabeled`、`ready_for_review`、`review_requested`）与 `pull_request_review`（`submitted`）。

**强制范围（源义务）**：仅对**非 draft、人类作者（非 Bot/App）、且至少有一个 requested reviewer 或已提交 review** 的 PR 强制。Draft、Bot/App、尚无 review request/review 的 PR 豁免；豁免 job 仍成功结束，不解析引用、不签发 Project token、不查询 ProjectV2。

**前置条件**：默认分支上有 `selective-preflight.json`（选择性模式）或没有该标记（legacy 模式）；仓库 token 可读 PR/Issue/reviewers/reviews；解决型引用需要 Project 读 token。

**必需元数据（源义务）**：
1. 至少一个同仓库 Issue 引用。PR 编号（包括 stacked 依赖 PR）不算 Issue 引用；跨仓库引用不算；HTML 注释、代码围栏、inline code 中的引用不算。
2. 恰好一个 canonical `kind/*`。允许集合：`kind/feature`、`kind/bug-fix`、`kind/doc`、`kind/testing`、`kind/cleanup`、`kind/dependency`。
3. 至少一个 `area/*`。
4. 至多一个 `p0`–`p3`。
5. 不允许未知 `kind/*`、旧版别名、PR 上的 `source/*`。
6. 每个 `all` 引用都必须解析为同仓库 Issue（REST `issue.pull_request` 为空）；否则报错。

**Informational vs resolving（源义务）**：
- `Refs #123`、普通 `#123`、Issue URL：informational，只建立上下文；不读 Project Priority，不约束 PR Priority。
- `Fixes/Closes/Resolves #123`：resolving；只有 resolving 引用需要 Project Priority 读取。
- 若所有 resolving Issue 都没有 Priority：PR 可以没有 Priority。
- 若任一 resolving Issue 有 Priority：PR 必须带 `p0`–`p3`，且等于所有 resolving Issue 中的最高优先级（p0 最高）。
- 若 PR 带 Priority：每个 resolving Issue 都必须有 Priority。
- informational-only PR 可以自行带 Priority，不受 referenced Issue 约束。

**步骤**：
1. 读取 live PR（draft、author type、labels、body）。
2. draft 或 Bot/App → 直接返回豁免；否则并行读取 requested reviewers 与 reviews，计算是否强制。
3. 不强制 → 返回；强制 → 解析 body 引用；对每个 `all` 编号调用 REST `/issues/{n}`，过滤掉 PR；保留 Issue 引用。
4. 若需要 Project：对每个 `resolving` 编号读 ProjectV2 item 的 `Priority` 字段。
5. `validatePullRequest` 生成错误列表；有错误 → 每个输出 `::error::` 注解，抛 `Issue policy 未通过，共 N 项`，job 失败。
6. 无错误 → 输出 `Issue policy 通过。` 或豁免消息。

**完成信号**：job success；日志 `Issue policy 通过。` 或 `Issue policy exempt：...`。

**失败处理**：任何 REST/Project 读失败 → job 失败（fail closed），不跳过；引用编号 404 → 失败；Project 字段缺失/类型错误 → 失败；不得把 failed preflight 当成豁免。

**例外**：
- Draft、Bot/App、无 review request/review：豁免。
- `reviewCount` 统计 `/reviews?per_page=100` 返回的数组长度（只取第一页）；只要有 review 就进入强制范围。
- `edited` 的标题-only 编辑仍会触发 job；最终校验重新读取 live 状态，不复用 preflight 结论。
- 关闭/合并 PR 没有后续触发；已存在的 check 不再更新。

**证据限制**：`policy.test.mjs:540-893` 覆盖引用、informational、标签、Priority、编辑后重读、缺 Issue/Project 失败；`ci-workflow.spec.ts:1332-1400` 固定工作流条件。测试使用 mock API，不证明真实 GitHub 返回结构或 App 权限。

**源**：`deepseek-harness/.github/issue-management/README.md:27-37@687f282e`；`deepseek-harness/.github/issue-management/rules.mjs:5-303@687f282e`；`deepseek-harness/.github/issue-management/pull-request.mjs:21-126@687f282e`；`deepseek-harness/.github/workflows/issue-policy.yml:1-58@687f282e`。

---

### 3.2 选择性 preflight 与 legacy 回退 <a id="issue-policy-selective-preflight"></a>

**触发**：`issue-policy.yml` 的 `Determine policy eligibility` 步骤。

**规则（源义务）**：
- 如果默认分支 checkout 中存在 `.github/issue-management/selective-preflight.json`（当前内容 `{ "version": 1 }`），运行 `node .github/issue-management/policy.mjs pr-preflight`。
- 如果没有该标记，执行内联 legacy 逻辑：`automated = ['Bot','App'].includes(event.pull_request.user.type)`；输出 `legacy-automated=true/false`、`needs-project=!automated`；打印 “Trusted policy has no selective preflight; preserving legacy policy enforcement.”。
- 受支持的 preflight 执行失败 → job 失败，**不回退**到 legacy；只有“标记不存在”才走 legacy。
- preflight 输出：
  - `eligible=true/false`
  - `exempt=!eligible`
  - `needs-project = eligible && resolving.length > 0`
- `Create Project read token` 只在 `needs-project == 'true'` 时创建；token 权限：`permission-issues: read`、`permission-organization-projects: read`，owner/repo 限定。
- `Validate pull request` 只在 `legacy-automated != 'true'` 时运行；它重新读取 live 状态，不缓存 preflight。
- 无论是否豁免，job 都必须存在；required job 的权威不变。

**步骤**：
1. 默认分支 checkout。
2. 标记存在 → `policy.mjs pr-preflight`；否则内联输出 legacy outputs。
3. 需要 Project → 创建只读 App token。
4. 非 legacy-automated → `policy.mjs pr` 做最终校验。

**完成信号**：preflight 输出符合预期；token 只在需要时创建；最终 job success/fail 与 live 状态一致。

**失败处理**：preflight 失败 → job 失败；最终校验失败 → `::error::` + 非零退出；不得用 `if` 把失败变成 skip。

**例外**：legacy 模式下人类 PR 即使只有 informational 引用也会创建 token 并做完整校验；这是回退行为，不是优化目标。标记只能通过默认分支变更；PR 内的标记不会影响自己的运行。

**证据限制**：`policy.test.mjs:894-916` 固定 preflight 在 token 之前、required policy 无条件；`917-957` 用临时目录覆盖“标记存在/不存在”的 rollout；`917` 在 Windows 跳过，因为工作流在 Ubuntu bash 运行。线上 App 权限与 token 创建不可由本地测试证明。

**源**：`deepseek-harness/.github/workflows/issue-policy.yml:24-58@687f282e`；`deepseek-harness/.github/issue-management/pull-request.mjs:89-113@687f282e`；`deepseek-harness/.github/issue-management/README.md:29@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-07-selective-issue-policy-evaluation.md:1-44@687f282e`。

---

### 3.3 标签分类法 <a id="label-taxonomy"></a>

**PR 维度（源义务）**：
- 恰好一个 canonical `kind/*`，记录**主导意图**；附带测试/文档/清理/依赖移动不改变主导 kind。
- 至少一个 `area/*`；多个 area 表示多个独立行为/API 受影响；不得同时使用 umbrella 与更窄标签描述同一变化。
- 至多一个 `p0`–`p3`。
- `source/*` 只用于 Issue，不用于 PR。
- 运维标签可以共存，但不满足 kind/area 要求。
- 已关闭且从未合并的 PR 保留历史标签，不强行补分类。

**Kind 集合（封闭）**：`kind/feature`（新增/有意改变行为）、`kind/bug-fix`（修正错误行为）、`kind/doc`（文档为主导）、`kind/testing`（测试/测试基础设施，不改变产品行为）、`kind/cleanup`（保持行为，维护/简化实现或流程）、`kind/dependency`（依赖更新且无其他主导意图）。

**保留别名（不可重建）**：`kind/bug`、`kind/documentation`、`feature`、`bug-fix`、`doc`、`cleanup`、`testing`、`dependencies`、`ci`、`cli`、`llm`、`web-search`。策略对 PR 直接报错，生命周期从 Issue 删除。

**Area 维度**：
- `area/*` 是**可扩展**的；没有现成描述时，可以创建 `area/<lowercase-kebab-case>`，无需单独审批，但必须在应用后报告新标签与理由。
- 不得为单个 PR、偶然路径、临时项目、状态、个人/团队创建 area；不得为了规避新增而复用不准确 area。
- 示例边界：`area/web` 浏览器/Electron GUI；`area/vscode` 编辑器扩展；`area/api` 跨接口协议与语言 SDK；`area/planning` 目标/计划/todo/调度；`area/workflow` 可执行工作流/后台 job runtime；`area/artifact` 制品/附件/多模态；`area/tools` 通用 registry/schema/execution 契约；`area/hooks` Claude Code/Codex bridge；`area/infra` build/release/CI/repo gates/generators/dependencies/dev tooling；`area/windows` 原生 Windows 产品支持（不是 CI runner 选择）。

**Issue 维度**：
- Issue 用原生 Issue Type（`Bug`/`Feature`/`Task`，策略还接受既有的 `Idea`/`Research`），不用 `kind/*`。
- Issue 的 `area/*` 可选。
- `source/*` 记录 Issue 创建来源，不用于 PR。
- Priority、GitHub 默认值、workflow trigger 是独立运维元数据。

**迁移与删除**：
- 先添加 canonical 替换，验证 labelable，再删除旧别名。
- 只有当没有 PR/Issue 使用该标签时才删除标签；不能整组替换无关标签。
- 生命周期在审计 Issue 前删除 PR kind 与保留别名；审计评论只报告无法从 Issue 推导的违规。

**完成信号**：PR 标签满足 1 kind + ≥1 area + ≤1 priority；Issue 不含 kind/旧别名；area 描述与语义边界一致。

**失败处理**：未知 kind/旧别名/source on PR → `Issue policy` 失败；Issue 上的违规标签被自动删除；缺失 Type/Priority/Status 无法推导 → 审计评论。

**证据限制**：`policy.test.mjs:723-837` 覆盖 canonical/未知/旧别名/source/多 kind/area；`258-296` 覆盖 Issue 标签删除；`2026-08-08-unified-github-label-taxonomy.md` 是规范来源。线上 label 目录与描述需单独读取。

**源**：`deepseek-harness/.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md:1-76@687f282e`；`deepseek-harness/.github/issue-management/rules.mjs:5-29@687f282e`；`deepseek-harness/.github/issue-management/rules.mjs:210-245@687f282e`；`deepseek-harness/AGENTS.md:163@687f282e`。

---

### 3.4 Issue 生命周期状态机 <a id="issue-lifecycle-status"></a>

**状态集合（config 顺序）**：`Inbox`、`Backlog`、`Ready`、`In progress`、`In review`、`Done`、`No action`。前五个是 active；`Done`/`No action` 是 terminal。

**Issue 事件（源义务）**：
- `opened` → `Inbox`。
- `closed` 且 `state_reason === 'not_planned'` → `No action`；其他关闭 → `Done`。
- `reopened` → `Inbox`。
- 其他订阅的 Issue 事件（`edited`、`labeled`、`unlabeled`、`typed`、`untyped`、`field_added`、`field_removed`）不改变 Status，但仍执行 `ensureProjectItem` 与 `auditIssue`。
- 每个 Issue 事件后都确保 Project item 存在，再做审计。

**PR 命令（源义务）**：
- `pull_request.opened` / `reopened` / `edited`（仅当 `changes.body` 存在）→ `implementation`。
- `pull_request.review_requested`（包括重复请求）→ `review-requested`。
- `pull_request_review.submitted` 且 `review.state === 'changes_requested'` → `changes-requested`。
- 其他 PR 动作（`synchronize`、`labeled`、`unlabeled`、`ready_for_review`、`assigned` 等）不产生 lifecycle command；不在订阅列表的事件更不会运行。
- `approved`/`commented` review 不分配 lifecycle runner；`dismissed` review 未订阅。

**转移规则（源义务）**：
- `implementation`/`changes-requested` 目标 `In progress`；`review-requested` 目标 `In review`。
- 只允许从 active 且 index 更低的 status 向前移动；terminal 或相同/更后 status 不改。
- 唯一的向后移动：`changes-requested` 且当前 `In review` 且 `currentStatusActor === config.lifecycleActor` → `In progress`。人类或未知 actor 拥有当前 `In review` 时保持不动。
- 不修改 terminal status；不添加没有 Project status 的 Issue；不依赖 PR 元数据合法性；不查 `reviewDecision`；不重建 review round；不做定时对账。

**角色**：lifecycle 工作流（写 Project）；GitHub App（Project/Issue 写权限）；`s`（由 `config.lifecycleActor` 标识）。

**步骤**：
1. 根据事件计算 command；无 command 直接返回（不读 PR、不发请求）。
2. 读取 live PR body 的 resolving 引用。
3. 对每个 resolving Issue 读 Project context（`changes-requested` 时读 status actor）。
4. 计算 target；无 target 跳过；有 target 则 `updateProjectV2ItemFieldValue`。
5. 对每个处理过的 Issue 执行 `auditIssue`。

**完成信号**：Project item 的 Status 符合转移；审计评论无新增错误；日志无异常。

**失败处理**：Project/Issue 读失败 → job 失败；Status option 不存在 → 抛错；更新失败 → job 失败；不重试、不回滚。

**例外**：
- Draft PR 的 `opened` 事件同样会把 resolving Issue 推进到 `In progress`；lifecycle 不按 draft 豁免（与 Issue policy 不同）。
- `ready_for_review` 不触发 lifecycle；Issue policy 仍订阅它。
- 标题-only 编辑被 job `if` 过滤；body 编辑触发 implementation。
- 并发没有 compare-and-swap；最后写入可能胜出；同一 Issue/PR 的 workflow concurrency 只降低竞争，不消除。
- 旧 workflow run 重放会重放旧 command；没有 durable lifecycle state。

**证据限制**：`policy.test.mjs:613-691`、`policy.test.mjs:882-893` 与 `policy.test.mjs:959-1010` 覆盖命令映射、重复 review request、human guard、terminal、无关事件；`ci-workflow.spec.ts:1332-1400` 固定订阅与 job `if`。测试不证明 ProjectV2 的并发行为。

**源**：`deepseek-harness/.github/issue-management/README.md:44-48@687f282e`；`deepseek-harness/.github/issue-management/rules.mjs:30-120@687f282e`；`deepseek-harness/.github/issue-management/lifecycle.mjs:108-155@687f282e`；`deepseek-harness/.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md:1-41@687f282e`。

---

### 3.5 生命周期事件调度与成本 <a id="issue-lifecycle-scheduling"></a>

**订阅（源义务）**：
- `issues`: `opened`、`edited`、`labeled`、`unlabeled`、`closed`、`reopened`、`typed`、`untyped`、`field_added`、`field_removed`。
- 不订阅 `assigned`/`unassigned`。
- `pull_request`: `opened`、`edited`、`reopened`、`review_requested`。
- 不订阅 `synchronize`、`labeled`、`unlabeled`、`ready_for_review`。
- `pull_request_review`: 仅 `submitted`。
- 不订阅 `dismissed`/`edited` review。

**job 级过滤**：
- review 事件只在 `state === 'changes_requested'` 时运行；approved/commented review 不分配 runner。
- PR `edited` 只在 `changes.body != null` 时运行；标题-only 编辑不分配 runner。
- concurrency：`issue-lifecycle-<issue-or-pr-number>`；`cancel-in-progress: false`。

**为什么**：approval/comment/push/label/assignment 等事件不改变 Project 状态；为它们分配 runner 只是消耗容量。`ready_for_review` 也不携带新的 lifecycle command（draft 已在 `opened` 进入 `In progress`；review 请求/提交另有两个事件）。Issue policy 保留 `ready_for_review`，因为它在人类 PR 进入 review 时拥有必需检查。

**完成信号**：无关事件没有 workflow run；title-only 编辑没有 run；changes-requested review 有 run。

**失败处理**：漏掉事件不会修复 Project 状态（event-driven，不是 reconciler）；需要人工修复或重新触发相关事件。

**例外**：selective evaluation 只降低部分读取/runner，不改变 required-check 权威，也不保证实际 Actions 分钟节省；runner 仍会分配。

**证据限制**：`ci-workflow.spec.ts:1332-1400` 固定 trigger 与 job `if`；`policy.test.mjs:959-1010` 固定订阅集合；这些测试不证明实际 billing/runner 分配。

**源**：`deepseek-harness/.github/workflows/issue-lifecycle.yml:1-57@687f282e`；`deepseek-harness/.github/issue-management/README.md:46@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-07-selective-issue-policy-evaluation.md:1-44@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-08-08-review-driven-issue-lifecycle-triggers.md:1-32@687f282e`。

---

### 3.6 Project 字段与 Start Date <a id="issue-project-fields-start-date"></a>

**配置（源义务）**：`config.json` 固定 `organization`、`repository`、`projectNumber`、`projectTitle`、`lifecycleActor`、`priorityField`、`startDateField`、`projectTimeZone`、`statuses`。当前值：`deepseek-harness/deepseek-harness`、Project 1、`DSH Issue Management`、`dsh-issue-management`、`Priority`、`Start Date`、`Asia/Shanghai`。

**Project 读取校验（源义务）**：
- Project 标题必须精确等于 `config.projectTitle`。
- `Status` 字段必须存在。
- `Priority` 字段必须存在、`SINGLE_SELECT`、且是 **Project custom field**（`isIssueField` 为 false）。
- `Start Date` 字段（需要时）必须存在、`DATE`、且是 Project custom field。
- Issue 的 `projectItems(first: 20, includeArchived: true)` 中按 Project id 找 item；不在 Project → item null。
- `statusActor`：读取最近 100 个 `ProjectV2ItemStatusChangedEvent`，取最后一个匹配项目的事件；只有该事件的 `status` 等于当前 item status 时，actor 才有效。

**Start Date（源义务）**：
- 只在 `pull_request.opened` 初始化。
- 对 `references.all` 中的**每一个**同仓库 Issue（包括 informational）初始化；不限于 resolving。
- 日期 = PR `created_at` 在 `projectTimeZone` 下的 `YYYY-MM-DD`。
- 先 `ensureProjectItem`（必要时 `addProjectV2ItemById`）；若 `startDateValue.date` 已存在 → 保留，不覆盖；否则 `updateProjectV2ItemFieldValue` 写入。
- 没有字段迁移、没有 Priority 同步；Priority 由维护者手工设置；不要用原生 organization Issue fields 替代。

**角色**：lifecycle 工作流；Project App token；维护者（手工 Priority/字段配置）。

**步骤**：
1. 读取 PR live body，解析所有同仓库 Issue 引用。
2. 对每个引用：确保 Project item；读 Start Date；空则写。
3. 并发 PR 同时看到空值 → 最后一次写入胜出（无 compare-and-swap）。

**完成信号**：Project item 的 Start Date 等于 PR 创建日（按配置时区）；已有值不变。

**失败处理**：Project 不存在/标题不匹配、字段缺失/类型错误、Issue 不存在 → job 失败；不创建 fallback 字段、不写原生 Issue field。

**例外**：draft 或 informational-only PR 仍会初始化 Start Date（opened 事件，且 `references.all` 不受 eligibility 限制）；已有 Start Date 永不覆盖；纯 retry 幂等（空值检查）。

**证据限制**：`policy.test.mjs:381-537` 覆盖时区边界、opened-only、空值写、已有值保留、缺 item 添加、字段类型拒绝；测试用 mock GraphQL，不证明真实 ProjectV2 权限或并发。

**源**：`deepseek-harness/.github/issue-management/config.json:1-19@687f282e`；`deepseek-harness/.github/issue-management/github.mjs:94-300@687f282e`；`deepseek-harness/.github/issue-management/lifecycle.mjs:31-39@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-02-project-local-issue-planning-fields.md:1-44@687f282e`。

---

### 3.7 Issue 审计与自动修复 <a id="issue-audit-repair"></a>

**触发**：
- 每个订阅的 Issue 事件（包括不改变 Status 的编辑/标签/Type/field 事件）。
- 每次 resolving Issue 的 Status 转移之后。

**修复（源义务）**：
- 删除 Issue 上的所有 `kind/*` 标签和 `LEGACY_LABELS` 中的旧别名（12 个）。
- 保留 `area/*`、`source/*`、Priority 标签等；不修改标题、正文、assignee。
- 删除使用 `allow404`，标签已不存在也继续。

**校验（源义务）**：
- 存在非法标签（kind/或旧别名）→ 错误（但先被 repair 删除，所以通常不再报）。
- `type` 必须是 `Idea`、`Feature`、`Bug`、`Research`、`Task` 之一。
- `status` 必须存在且属于 config.statuses。
- `priority` 为空或 p0–p3（大小写不敏感判断）。
- `status === 'Done'` 必须 Issue closed 且 `state_reason === 'completed'`。
- `status === 'No action'` 必须 closed 且 `not_planned`。
- 非 terminal status 必须 Issue open。

**审计评论（源义务）**：
- 评论 marker：`<!-- dsh-issue-policy -->`。
- 查找该 Issue 评论第一页（`per_page=100`）中由 Bot 作者、body 含 marker 的评论。
- 无剩余错误：若存在审计评论 → DELETE；否则什么都不做。
- 有错误：body = marker + `⚠️ Issue policy 未通过：` + 每条错误一个 `-`；已有评论 body 相同 → 不写入；不同 → PATCH；没有 → POST。
- 只报告无法自动推导的违规（Type/Priority/Status/terminal 一致性）；不评论标题/正文/assignee/展示格式。

**步骤**：
1. `issueSnapshot`：REST Issue，若是 PR 则返回 null；读 Project context 的 status/priority。
2. `repairIssueLabels`：逐个 DELETE 非法标签，返回过滤后的 labels。
3. `validateIssue` + 调用方传入的 `extraErrors`。
4. `upsertAudit`。

**完成信号**：非法标签消失；审计评论内容与剩余错误一致；修复后无错误则旧审计评论被删除。

**失败处理**：Issue/Project 读失败 → job 失败；DELETE/PATCH/POST 失败 → job 失败；不吞掉错误。只读前 100 条评论是源实现的限制；更早的审计评论可能未被发现。

**例外**：Issue 不是 PR 才审计；PR 引用不满足 Issue 要求由 Issue policy 负责，不由 lifecycle 审计。`validateIssue` 不会因为标签修复而自动补 Type/Priority/Status；这些仍需人工。

**证据限制**：`policy.test.mjs:224-369` 覆盖展示中立、标签删除、审计评论删除/更新、terminal 对齐。测试不证明真实 Bot 作者/评论分页。

**源**：`deepseek-harness/.github/issue-management/rules.mjs:210-245@687f282e`；`deepseek-harness/.github/issue-management/lifecycle.mjs:41-106@687f282e`；`deepseek-harness/.github/issue-management/github.mjs:71-91@687f282e`；`deepseek-harness/.github/issue-management/README.md:55-59@687f282e`。

---

### 3.8 Issue 与 PR 模板 <a id="issue-pr-templates"></a>

**Issue 模板（源义务）**：
- 只保留 `bug.md`、`feature.md`、`task.md`、`config.yml`；不提供 Idea/Research 独立模板（归入 Task，除非未来有不同生命周期行为）。
- `config.yml` 精确为 `blank_issues_enabled: false`。
- 每个模板 frontmatter 只有 `name`、`about`、`type`；`type` 映射原生 Issue Type。
- 每个模板至少一个 `##` heading 和 HTML 注释说明；不使用 `<details>`。

**精确 heading**：
- Bug：`## Summary`、`## Reproduction`、`## Current behavior`、`## Expected behavior`、`## Environment`。
- Feature：`## Motivation`、`## Behavior`。
- Task：`## Summary`、`## Deliverables`。

**PR 模板（源义务）**：
- `## Motivation`；用一句话说明问题，并用 `Fixes #NN` 或 `Related #NN` 引用同仓库 Issue。
- `## Changes`；两个相邻 HTML 注释占位：一个说明命令/配置/API/协议/持久化格式变化，一个说明用户/模型/系统可观察行为变化；没有则写 None。
- `## Testing`；每种测试方法一个条目；方法可见，可复核证据放进对应 `Proof` 区域。
- 只有一个 `<details><summary>Proof</summary>` 块；不使用 `###` 子标题。

**策略中立性（源义务）**：
- Issue policy **不检查** `<details>` 展示、可见正文长度、标题语言、标题前缀、`Owner:` 正文行、assignee。
- 这些展示差异不得导致失败；测试明确接受。
- 模板测试是仓库内测试，不是运行时策略；模板变更需要更新测试。

**完成信号**：`policy.test.mjs:159-223` 通过；Issue 模板可被 GitHub 识别，`type` 生效；PR 模板 heading 与 proof 结构正确。

**失败处理**：模板文件增减、frontmatter 键变化、heading 变化、多个 details、`blank_issues_enabled` 变化 → 测试失败；不阻断运行时 PR（除非另有 CI gate）。

**例外**：既有 Issue 的 `Idea`/`Research` Type 仍被 `validateIssue` 接受；新模板不提供这两个入口。模板不自动迁移历史 Issue。

**证据限制**：测试只检查文件文本，不证明 GitHub 模板渲染或 Issue Type 自动应用；需要真实创建 Issue 的 UI/API 证据。

**源**：`deepseek-harness/.github/ISSUE_TEMPLATE/bug.md:1-25@687f282e`；`deepseek-harness/.github/ISSUE_TEMPLATE/feature.md:1-13@687f282e`；`deepseek-harness/.github/ISSUE_TEMPLATE/task.md:1-13@687f282e`；`deepseek-harness/.github/ISSUE_TEMPLATE/config.yml:1@687f282e`；`deepseek-harness/.github/pull_request_template.md:1-21@687f282e`；`deepseek-harness/.github/issue-management/policy.test.mjs:159-223@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-09-03-semantic-issue-templates-and-policy.md:1-40@687f282e`。

---

## 4. 日常协作程序

### 4.1 `change-scope` 显式范围报告 <a id="change-scope-report"></a>

**触发**：push 前、审阅 PR 前、stack sync 后、任何需要知道“这次改动到底碰了哪些路径”的时候。

**前置条件**：Git worktree；Node + `tsx`；`pnpm run change-scope` 脚本；调用者已经从 live PR/stack 状态验证了 base；`--base` 必须显式给出，工具不猜、不 fetch。

**角色**：开发者/审阅者/agent（调用者）；`scripts/change-scope.ts`（工具）；Git（数据源）。

**步骤**：
1. 确认 checkout 与分支：`git status --short --branch`、`git rev-parse --show-toplevel`。
2. 从 live PR 或 stack parent 验证 base ref，并显式传入：`pnpm --silent run change-scope --base <verified-base-ref>`；检查其他 commit 时用 `--head <ref>`。
3. 读取 versioned JSON：
   - `resolved.baseSha/headSha/mergeBaseSha`
   - `paths.committed`（merge base 到 head，`--no-renames`）
   - `paths.staged`、`paths.unstaged`、`paths.untracked`
4. 根据 committed + dirty layers 选择证据；合并 base 后重跑，重新评估受影响行为。

**完成信号**：JSON 正常输出，`repositoryRoot` 正确，`mergeBaseSha` 唯一，路径集合符合预期。

**失败处理**：
- 缺失 `--base`、ref 缺失/歧义/非 commit、多个 merge base、非 UTF-8 path、Git 失败 → 非零退出，输出 `change-scope: <message>`。
- 不要用 `git diff` 猜 base；不要在没有验证 base 的情况下把报告当证据。

**例外**：工作区可以 dirty；报告把 committed 与 staged/unstaged/untracked 分开，不声称 dirty 路径属于本次 PR。报告只列路径，不判断语义或覆盖范围。

**证据限制**：`change-scope.spec.ts:99-241` 覆盖 fresh branch、stack 的精确 head、dirty 独立、不修改仓库状态、fsmonitor 不执行、非 UTF-8 拒绝、歧义/非 commit 拒绝、确定性 JSON。工具是“范围输入”，不是“测试已覆盖”的证明。

**源**：`deepseek-harness/scripts/change-scope.ts:1-248@687f282e`；`deepseek-harness/scripts/change-scope.spec.ts:99-241@687f282e`；`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:19-25@687f282e`；`deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:8@687f282e`。

---

### 4.2 push 前证据与历史改写安全 <a id="pre-push-evidence"></a>

**触发**：push、force-push、mark ready for review、声称检查通过之前；`gh stack sync` 之后立即。

**前置条件**：已读 `dsh-pre-push-checks`；已确认 live base/stack parent；已运行 `change-scope`；了解 hooks 的边界。

**Git hooks（源义务）**：
- `pre-commit`：翻译配对（staged `*.i18n.yaml`，排除 archived）、archived Agent Notes 校验、staged Oxlint fix（排除 `vendor/*/src/**`，`stage_fixed`）、`git diff --cached --check`、pi-ai provider metadata 校验、vendor manifest guard。
- `pre-merge-commit`：翻译配对、archived Agent Notes。
- `pre-push`：`pnpm run typecheck`。
- hooks **故意窄**：不跑单测、snapshot、docs、build、hygiene；CI 拥有完整矩阵。

**证据选择（源义务）**：
- 每个行为变更必须有最窄的、能因该回归而失败的测试/检查；不要反射式跑全量。
- 文档/Agent Notes/catalog/doc-linked comments → `pnpm run doc-sync`；必要时 full lint。
- 模型/编辑器/CLI/终端可见输出 → 对应 keyless snapshot 或 runnable example。
- 包 manifest/public exports/build config/worker/bin/built runtime → `pnpm run build` + hygiene + owning built smoke。
- 仓库 test/script 类型 → `pnpm run build:check`（在最新 `build:artifacts` 之后）或 `pnpm run build`。
- 真实 provider/agent → 对应 `pnpm run test:e2e`（有凭据时）；不打印 secret。
- 单测覆盖：文件过滤与 coverage 过滤分开；用 `--coverage.include` 指定必须证明的源文件；不得用 `--passWithNoTests`、降低阈值或缩小 include 来隐藏未覆盖文件。
- `vitest related` 不能发现配置、动态加载、子进程、worker、构建产物、外部 provider 的路径；这些要显式选 owning tests。

**历史改写（源义务）**：
- 独立分支/stack 层允许 merge-forward 或 rebase，包括 review 之后。
- standalone force-push 必须 fetch 当前远端、记录 OID，用 `--force-with-lease=<branch>:<observed-oid>`；并发前进则中止。
- `gh stack push` / `gh stack sync` 提供 lease 保护；**raw `--force` 永不使用**。
- 改动后重新 fetch live heads，并重新审计 unresolved threads、approvals、mergeability、checks；旧 commit OID 与 inline anchor 不再是当前证据。

**`gh stack sync` 例外（源义务）**：它 fetch + cascade rebase + push 是一个操作，无法在 rewrite 与 publish 之间本地验证。运行前要求 clean worktree、记录官方 stack 顺序与精确远端 head；运行后：重新查询每个 head 与官方 stack 顺序、对每层重新跑相关证据、在所有检查通过前不 merge、不声称 ready。

**push 后验证**：
- `git rev-parse HEAD origin/$(git branch --show-current)` 比较本地与远端。
- `gh pr checks`；pending 就报告 pending。
- 若 `gh pr checks` 显示 “no checks reported” 且 `/actions/runs?head_sha=<sha>` 为 0：先看 `gh pr view <n> --json mergeable,mergeStateStatus`。`CONFLICTING`/`DIRTY` 时 GitHub 不创建 `pull_request` run；解决冲突是唯一修复。不要用空 commit、draft/ready toggle、revert/restore 制造运行。

**完成信号**：选定检查实际通过；远端 ref 等于本地 HEAD；CI 运行已出现（或明确说明为何 pending）；rewrite 后审查项已重新读取。

**失败处理**：普通 push 前检查失败 → 停止、修复或解释 blocker，不 push 赌 CI。post-sync 失败 → 保持 lease-protected heads，修复、验证、再发布；不 merge。环境特定失败 → 记录命令/测试/平台差异，确认非平台证据；只有用户明确同意才绕过 hook，并报告失败原因与 CI 预期差异。

**例外**：完整本地演练只在用户明确要求、诊断 CI、或改动确实横跨仓库时进行；不要重建已删除的 `check:pre-push` 聚合。

**证据限制**：Skill 是指导，不是强制脚本；hooks 只覆盖窄边界；CI 才是 exhaustive matrix。作者未运行任何检查。

**源**：`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:1-137@687f282e`；`deepseek-harness/lefthook.yml:1-49@687f282e`；`deepseek-harness/AGENTS.md:113-120@687f282e`；`deepseek-harness/.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md:1-37@687f282e`。

---

### 4.3 原生 stacked PR 落地 <a id="native-stack-landing"></a>

**触发**：同一仓库中两个及以上相互依赖的 PR（A ← B ← C，每个 base 在下一层）；或用户提到 stacked/dependent PRs、连续 merge。

**前置条件**：
- 官方 `gh stack` 扩展与服务端 stack 功能可用：先 `gh stack --version`。
- 每个 head branch 都在同一仓库（cross-fork 不支持）。
- clean dedicated worktree；live PR metadata；官方 `PullRequest.stack` / `stackEntry.position` 可查。
- 每层都满足仓库 review/check 要求；trunk 规则适用。

**角色**：landing operator（人/agent）；GitHub stack 对象（权威）；`gh stack`（link/merge/sync）；reviewers/CI（每层）。

**步骤**：
1. `gh stack --version`；不可用或 cross-fork → hard-stop，**不要**退化为逐 PR merge + retarget。
2. 逐个读取 live PR：`gh pr view <pr> --json number,author,baseRefName,baseRefOid,headRefName,headRefOid,isCrossRepository,state,isDraft,reviewDecision,mergeStateStatus,statusCheckRollup`；不要信任分支名或旧报告。
3. 对每个 apparent chain 至少一个 PR 查 GraphQL `PullRequest.stack` 与 `stackEntry.position`；`size` 超过一页时翻页。官方 stack 对象是成员资格权威，base 链只是期望顺序。
4. 建立 bottom-to-top：bottom 指向 trunk，每层指向下一层 head。
5. 若链未入 stack：
   - 所有 `author.login` 完全一致 → 自动 `gh stack link --base <trunk> <bottom> ... <top>`。
   - 作者不同或不可用 → 先问用户，再改 GitHub 状态。
   - 不要自动解散/重排/重建已有 stack；`gh stack link` 是 additive；merged/queued entry 不能 unstack。
6. 重新查询 GraphQL：要求一个 stack number、期望 trunk、完整 PR 集合、期望 position/base 链。
7. 只在需要时刷新：
   - 原生 cascading rebase：`gh stack checkout <pr-or-stack>`（未跟踪时）→ `gh stack sync`；sync 可能 rebase + lease-protected force-push 所有 active layer，之后立即检查每层重写范围并跑相关检查；冲突用 `gh stack rebase` 解决、验证、`gh stack push`；本地/远端 stack 组成分歧 → 取消并询问，不要删除/重建。
   - 增量 merge-forward：把 trunk merge 进 bottom，再 bottom-to-top 把更新后的 parent merge 进 child；base 前进时保留 in-progress checkpoint。
8. merge 前重新查询官方 stack；每个选中 PR 必须 open、非 draft、顺序正确、满足 review/check。
9. 全 stack：`gh stack merge <stack-number> --yes --merge`；显式 partial landing：`gh stack merge <boundary-pr> --yes --merge`，包含 bottom 到 boundary 的每一层。
10. 不传 `--delete-branch`、不手动 retarget、不逐个 `gh pr merge`；GitHub 自底向上 merge，并 retarget/rebase 剩余上层。merge queue 可能把选中范围分组成多个 landing；不能假设原子。
11. 等待每个选中 PR 报告 `MERGED`；queued ≠ landed；partial 后重新查询剩余 stack、heads、review、CI。
12. 分支删除放到最后；删除前 `gh pr list --state open --base <branch> --json number --jq length` 必须为 `0`。

**完成信号**：所有选中 PR `state === 'MERGED'`；剩余上层仍是期望 stack；分支删除前零依赖。

**失败处理**：native 不可用 / cross-fork / 组成分歧 / 冲突 / 任一 blocker → hard-stop 或询问；不要 fallback 到逐 PR merge。merge 后未全部 MERGED → 不要声称完成。

**例外**：merge queue 下 stack 可能分多组落地；partial landing 必须显式 boundary；已 merged/queued entry 不能 unstack。

**证据限制**：Skill 是操作程序，仓库内没有自动化测试证明 `gh stack` 行为；`PullRequest.stack`/merge queue 是 forge 能力，必须实机验证。作者未运行 `gh stack`。

**源**：`deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:1-127@687f282e`；`deepseek-harness/.agents/notes/implemented/process/2026-08-02-native-github-stacks-and-optional-rebases.md:1-43@687f282e`；`deepseek-harness/AGENTS.md:162@687f282e`。

---

### 4.4 stack 上的 review 修复传播 <a id="stack-review-propagation"></a>

**触发**：review comments 落在 dependent stack 的多个 PR 上。

**规则（源义务）**：
1. 每个 PR branch 一个 worktree；并行修复不共享 checkout。
2. GitHub stack 对象是权威；base 链只给期望顺序；必须查 `PullRequest.stack` / `stackEntry.position`。
3. 修复落在**引入问题的 PR**，再向上传播；即使上层也带同一文件，也不在上层起源修复。
4. 每个 review fix 保持独立 commit；不要 amend 已 review 的 fix；只 amend 自己尚未 push、尚未 review 的工作。
5. merge-forward 或 rebase 都可；rewrite 必须 lease-protected，远端前进则中止；raw `--force` 禁止。
6. 逐条 triage review comment 的实质；验证 reviewer 的诊断，不因“症状对”就接受错误原因。
7. 传播顺序：
   - merge-forward：修复 parent → merge 进 child → 验证 child → 继续向上；保留 in-progress checkpoint。
   - native rebase：`gh stack rebase` → 验证重写层 → `gh stack push`；或用 `gh stack sync`（可能先发布）→ 立即 post-sync 验证。
8. delegated fix 是 trust-but-verify：子 agent 的报告只是意图；在真实 tree 上重跑 gates；对回归 guard，先证明它在未修复代码上失败（引入回归 → 红 → 撤销）。
9. 在 review thread 回复（`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`），不是顶层评论；说明 fix 与承载它的当前 commit/head。
10. rewrite 后重读 unresolved threads、approvals、mergeability、checks；旧 OID/inline anchor 不是当前证据。
11. 只通过官方 stack 程序落地；未 link 时按 §4.3 自动/询问；native 不可用 hard-stop。

**完成信号**：每个修复 PR 的当前 diff 在引入层包含修正；GraphQL 报告一个期望顺序的官方 stack；每个 child 对 parent 的 diff 只含自身变化；rewrite 后审查项已重读；相关 gates 在每层通过，不只是 top。

**失败处理**：发现修复落错层 → 在引入层重做并重新传播；rewrite 后旧证据失效 → 重新获取；native 不可用 → 停止并报告。

**证据限制**：程序是人工的；没有测试证明 review thread 回复或 stack 顺序。gh API 需要认证。

**源**：`deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:1-32@687f282e`；`deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:68-127@687f282e`；`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:80-109@687f282e`。

---

### 4.5 code review 程序 <a id="code-review-procedure"></a>

**触发**：审阅 deepseek-harness 的 PR。

**前置条件**：读取 live base 与 exact head；取得 diff；能运行 `change-scope`；能打开仓库内的 sources of truth。

**角色**：reviewer；author；`dsh-code-review` Skill；CI/approval 门禁。

**步骤**：
1. 验证并 fetch PR 的 live base 与 exact head；运行 `pnpm --silent run change-scope --base <verified-base-ref> --head <verified-head-ref>`；在读过 diff 与足够 surrounding code 之前不要下结论。retarget/merge 后重新建立 base 并重跑。
2. 先读要求：根 `AGENTS.md`、`packages/AGENTS.md`、`docs/defensive-patterns/*`（按 diff 触及的 artifact 选页）、`docs/AGENTS.md`、`dsh-prose-standard`、`dsh-ci-test-reliability`、`dsh-client-ui-ux`、`dsh-error-handling`、`docs/testing.md`、Agent Notes、bilingual rules（如适用）。
3. 执行 blocking requirements：
   - 新 prose 做语义 review（自动检查不能证明覆盖/准确/位置/编辑质量）。
   - docs 与 code 同 diff 更新（config/defaults/errors/wire fields/events/public behavior → README + JSDoc）。
   - spine/seam vocabulary 更新 subsystems 页面与 `type-equiv`。
   - Cordis 代码应用 `cordis-styling-nitpicking` 的三条 P0（singleton state、unreversed effects、cleanup dependency 早于 consumer 完成）。
   - 作者是否运行了相关本地检查；CI 覆盖 exhaustive matrix；review 语义缺口。
   - client UI copy 必须 locale-owned；拒绝 JSX/template/helper/accessibility/primitive defaults 中的产品文本。
4. 执行 manual checks（按 diff 选）：
   - intent/interface 两侧；error handling 的 state guarantee；lifecycle/concurrency 的 race/cancellation/disposal；capability/consumer fit；scope/ownership/necessity；configuration/public choice 的 current-consumer evidence；model perspective 的 prompt/tool schema/result；enforcement 的 denial path 与 alternate caller；borrowed/derived state；bounds（tiny/exact/oversized/multibyte）；real entry path（Loader/bin/worker/ACP/subprocess）；test strength（失败于预期回归、验证外部状态）；test reliability；negative controls；implemented Agent Note 与 shipped reality；transcript snapshot；bilingual 语义/术语。
5. 报告：陈述 defect、location、impact、evidence；局部缺陷放最紧的 inline diff range；跨切面/架构/scope 用 PR-level comment；区分 blocker 与 suggestion；已在 green gate 中强制的问题不重复；回复用现有 thread；收到 review 时验证每条 claim，按技术理由 fix 或 rebut，不做表演性同意。

**完成信号**：每个 blocker 有可复核证据；review 覆盖 diff 触及的 sources of truth；没有把“change-scope 路径列表”当成语义 review。

**失败处理**：base/head 无法验证 → 停止，不审旧快照；缺少 owning page → 先读再判；无法复现的 claim → 明确标注证据限制。

**例外**：Skill 明确是 guidance，不是完整 checklist；短 review 带一个实质 blocker 优于一长串 nit；Agent Note 与实现冲突是设计讨论，不是自动否决；翻译扩展 Skill 只在用户明确调用时运行。

**证据限制**：人工 review 质量无法由仓库测试证明；`change-scope` 只识别路径与 dirty layer，不判断设计；`dsh-code-review` 依赖的 defensive patterns/docs 由其他域维护，跨域引用可能随源更新。

**源**：`deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-61@687f282e`；`deepseek-harness/AGENTS.md:113-120@687f282e`；`deepseek-harness/scripts/change-scope.ts:1-248@687f282e`。

---

## 5. 迁移实施顺序

> 下列顺序是【迁移设计】。源仓库的实际顺序不可从单一提交完全还原；这里按“先建立可信控制面，再启用门禁，最后启用写操作”排列，避免先开后门。

### 阶段 0：forge 前置

1. 确认目标仓库、默认分支、GitHub Actions、分支保护/ruleset 的管理权限。
2. 创建 GitHub App：
   - policy 读：Issues read + organization Projects read；
   - lifecycle 写：Issues write + organization Projects write（源工作流没有显式 `permission-*`，依赖 App 安装权限）。
   - 配置 `DSH_ISSUE_APP_CLIENT_ID`（variable）与 `DSH_ISSUE_APP_PRIVATE_KEY`（secret）。
3. 创建/确认 ProjectV2：标题、`Status`、`Priority`（Project custom single select）、`Start Date`（Project custom date）、状态选项与 `projectTimeZone`。
4. 确认 Python 3.10、Pygments（`requirements.txt`）、Node、pnpm、`uv`（CI 测试）。
5. 确认 `gh` 与官方 stack 扩展/服务端功能；不支持则先不要启用 stack 程序。

### 阶段 1：复制只读策略

1. 复制 `.github/review-ownership/**`、`.github/issue-management/**`、`.github/ISSUE_TEMPLATE/**`、`.github/pull_request_template.md`、两个相关 workflow。
2. 替换仓库名、默认分支、Project 编号/标题、字段名、时区、lifecycle actor、approval policy logins/points。
3. 保留 `check-approval.mjs` 的 status context `weighted approval`；若改名，必须同步 branch rule 与 README。
4. 保留 `weighted-approval-review-event.yml` 的 path 与 run-name 格式；publisher 用 `.path` 与 `display_title` 识别，改名会破坏交接。
5. 运行本地测试（集成阶段）：
   - `node --test .github/review-ownership/check-approval.test.mjs .github/review-ownership/blame-ownership.test.mjs .github/review-ownership/author-weight.test.mjs`
   - `node .github/issue-management/policy.test.mjs`
   - `uv run --python 3.10 --with-requirements .github/review-ownership/requirements.txt python -m unittest discover -s .github/review-ownership -p 'test_*.py'`
   - `pnpm run test:approval-policy`、`pnpm run test:issue-management`（若目标仓库保留同名 scripts）。

### 阶段 2：先启用只读检查，不启用写操作

1. 启用 `Issue policy` job；先以非 required 运行，观察豁免/失败是否符合预期。
2. 启用 `weighted-approval` 发布；先不把它设为 required，观察 head 状态、pending/error、日志。
3. 验证 review-event 无权限交接：提交/编辑/dismiss review，确认 publisher 收到 `workflow_run` 并刷新同一 head。
4. 验证 `/delegate`：用测试 PR 检查权限、dismiss、request、revoke；不要在真实重要 PR 上首次试验。

### 阶段 3：启用 forge 门禁

1. 设置 `weighted approval` required status，context 精确、expected source GitHub Actions。
2. 设置 `Issue policy` required check。
3. 确认 `all checks passed` 的 `needs` 与 required 状态；按需保留 `e2e`。
4. 启用原生 stale review / latest push / up-to-date（若组织策略要求）。
5. 对 `.github/**` 与策略目录配置 CODEOWNERS 或等价 owner review（额外建议）。
6. 用只读 API/UI 证据记录设置；不要修改生产保护设置。

### 阶段 4：启用 Issue lifecycle 写操作

1. 先在一个测试 Issue/Project 上验证 `opened`/`closed`/`reopened` 的 Status 与 Start Date。
2. 验证 PR `opened`/body edit/review_requested/changes_requested 的 resolving Issue 转移。
3. 验证 human-owned `In review` 不被 changes-requested 覆盖。
4. 验证审计评论的创建/更新/删除；确认 marker 与 Bot 作者匹配。
5. 再扩大到真实 Issue。

### 阶段 5：启用人与 stack 程序

1. 安装 hooks（`node scripts/install-lefthook.mjs` 或目标仓库等价物）。
2. 启用 `change-scope` script 与 pre-push Skill。
3. 启用原生 stack 程序；先用非关键 stack 演练 link/refresh/merge/partial。
4. 培训 reviewer 使用 `dsh-code-review` 与 stack review 程序。

### 参数化表

| 参数 | 源值 | 迁移要求 |
|---|---|---|
| `organization` / `repository` | `deepseek-harness` / `deepseek-harness` | 替换为目标仓库；Issue/Project API 路径同步 |
| 默认分支 | 仓库默认分支（工作流用 `github.event.repository.default_branch`） | 确保 branch rule 绑定同一分支 |
| `projectNumber` / `projectTitle` | `1` / `DSH Issue Management` | 标题精确匹配，否则 `projectContext` 抛错 |
| `lifecycleActor` | `dsh-issue-management` | 必须与 App/机器人 login 一致；human guard 依赖它 |
| `priorityField` | `Priority` | 必须是 Project custom single-select，不能是 Issue field |
| `startDateField` | `Start Date` | 必须是 Project custom date |
| `projectTimeZone` | `Asia/Shanghai` | 合法 IANA 时区；`Intl.DateTimeFormat` 会校验 |
| `statuses` | Inbox/Backlog/Ready/In progress/In review/Done/No action | 必须含 `In progress`、`In review`；顺序决定 forward-only |
| `requiredPoints` / `defaultPoints` | `2` / `1` | 正整数；公式/阈值随参数变化 |
| `reviewerPoints` | 6 个 login 各 2 分 | 大小写不敏感唯一；login 必须合法 |
| `STATUS_CONTEXT` | `weighted approval` | branch rule 精确匹配；改名需同步所有检查 |
| `MAX_PULL_REQUEST_RECORDS` | `3000` | review/comment 列表上限；达到即失败 |
| `PAGE_SIZE` | `100` | 分页大小；GraphQL 批量也 100/50 |
| production roots/extensions | `packages|apps|python|native` 的 `src` + shipped roots/files | 目标仓库必须显式扩展，否则归属失真 |
| classifier exclusions | `vendor/node_modules/dist/...` | 目标仓库若有不同生成目录，必须补充并测试 |
| workflow names/paths | `weighted-approval`、`weighted-approval-review-event` | publisher 用 path 识别 review-event；改名需改 `check-approval.mjs` |
| timeout | 5 min publisher / 2 min review-event | 目标仓库历史大小不同，需按测量调整 |
| labels | 6 kind + 12 reserved aliases + `area/*` + `p0-p3` + `source/*` | 目标仓库的 label 目录必须先创建；别名保留不可重建 |

---

## 6. 验证矩阵

> 所有证据状态均为 `planned`：作者未执行。集成阶段按表执行，保存命令、退出码、关键输出与时间；失败/缺失/过期证据不能标为通过。

| 机制 | Positive | Rejection | Recovery | 命令/证据 |
|---|---|---|---|---|
| 可信默认分支 | 日志 checkout 默认分支；无 PR head 文件读取 | 把 checkout 改成 PR head 应被测试抓住 | 恢复默认分支 checkout | `scripts/ci-workflow.spec.ts`；`policy.test.mjs` |
| 审批状态契约 | 1 个 2 分 approval → `success`；draft/不足 → `pending`；异常 → `error` | 旧 success 在 setup 失败后仍存在（需专门回归） | 重新运行发布，确认 pending→结果 | `test:approval-policy` |
| 评审资格 | 2 个 1 分或 1 个 2 分通过；只读/作者不计 | 只读评审人计分应失败 | 修正权限后下一事件重算 | `check-approval.test.mjs:154-233` |
| 作者积分 | 90/91 PR 边界；bot 同规则 | 不完整历史返回部分分数应失败 | 修复 API 后重跑 | `author-weight.test.mjs` |
| 归属加权 | 0/12.5/25% → 1/1.5/2 | 空分母、shallow、失败 attribution 不得提升 | 补全历史/修复后重跑 | `test_blame_production.py`；`blame-ownership.test.mjs` |
| 分类器 | 混合行/字符串/预处理行计数；生成/测试/vendor 排除 | 纯 rename、注释-only 不得产生分母 | 扩展根/排除后重跑 | 同上 |
| 委托 | sender 积分跟随 delegate approval；dismiss 旧 blocker | 只读/作者/链式转发/编辑他人评论应无效 | 重新评论或 self-delegate 恢复 | `check-approval.test.mjs:669-1131` |
| blocker pending | blocker + 足够分数 → `pending` | 发布 `success` 或 `failure` 应失败 | 解除 blocker 后重算 | `check-approval.test.mjs:235-290` |
| 评审交接 | review 事件触发 publisher；head 匹配 | 错误 path/title/head 应拒绝 | 修复 run/重新提交 review | `check-approval.test.mjs:84-135` |
| stale 边界 | closed/stale head 跳过；live head 写入 | 旧 head 写入应失败 | 重新触发当前 head | `check-approval.test.mjs:1013-1146` |
| PR Issue 策略 | 1 kind + ≥1 area + 真实 Issue | PR 编号/跨仓库/未知 kind/旧别名/多 priority 应失败 | 修标签/引用后重新触发 | `policy.test.mjs:540-893` |
| 选择性 preflight | marker 存在走 selective；缺失走 legacy | 标记存在但 preflight 失败不得回退 | 修复后重跑 | `policy.test.mjs:894-957` |
| 标签分类法 | canonical kind/area 通过 | 旧别名/未知 kind/source on PR 失败 | 修标签；Issue 自动删除 | `policy.test.mjs:723-837` |
| 生命周期状态 | opened→Inbox；review request→In review；changes requested→In progress（actor guard） | 人类 In review 被覆盖应失败；terminal 改动应失败 | 重新触发正确事件/人工修复 | `policy.test.mjs:613-691` |
| 生命周期调度 | 无关事件不分配 runner | title-only/synchronize/label/assignment 触发应失败 | 修正 trigger/if | `ci-workflow.spec.ts:1332-1400` |
| Project 字段/Start Date | opened-only、空值写、已有值保留、时区边界 | Issue field/非 Date/非 select 应失败；覆盖已有值应失败 | 修字段/重新打开事件 | `policy.test.mjs:381-537` |
| Issue 审计 | 删除非法标签、评论更新/删除 | 保留 kind/旧别名应失败；错误正文应更新 | 修复后重跑审计 | `policy.test.mjs:258-352` |
| 模板 | exact headings/frontmatter、blank disabled | 多 details/缺 heading/多余 frontmatter 失败 | 修模板并更新测试 | `policy.test.mjs:159-223` |
| change-scope | committed/staged/unstaged/untracked 独立、确定 JSON | 缺 base/歧义 ref/多 merge base/非 UTF-8 失败 | 修 ref/工作区后重跑 | `change-scope.spec.ts` |
| push 证据 | 选定检查通过；lease push 成功 | 检查失败仍 push、raw force、旧 OID 当证据应失败 | 修复/重新验证/lease 重试 | `dsh-pre-push-checks` 人工执行 |
| 原生 stack | 官方 stack 识别、整栈/边界 merge、全部 MERGED | cross-fork/native 缺失/逐 PR merge 应 hard-stop | 修 link/refresh 后重试 | 人工 + `gh stack`；当前证据只显示 extension NOT installed，未执行 help/真实 stack |
| stack review | 修复在引入层、每层 gates 通过、thread 回复 | 只修 top/旧 OID 当证据应失败 | 重做并重新传播 | 人工 |
| code review | blocker 有证据、sources of truth 已读 | change-scope 路径当语义 review 应失败 | 重审 | 人工 |
| forge 分支规则 | required status/check 精确匹配；证据已保存 | context-only/source 不匹配/缺 required check 应失败 | 修正设置并重新读取 | `gh api`/UI 只读证据；需授权 |

---

## 7. 已知限制与未决项

1. **没有 branch protection 配置文件**：`weighted approval` 的 expected source、`Issue policy` 是否 required、`all checks passed`/`e2e` 是否 required、stale review/latest push 是否启用，全部是 forge-only，仓库内无法证明。必须用只读 API/UI 证据。
2. **`issue-policy.yml`/`issue-lifecycle.yml` 的 YAML 来自 PR head**：默认分支 checkout 只保证 Node 策略代码；PR 可以修改 workflow YAML。源仓库没有 CODEOWNERS。迁移时应对 `.github/**` 加 owner review/审批（额外建议），但不要声称源已保证。
3. **`weighted approval` 的 `pending` 前失败**：checkout 或 `pending` 写入失败不会触发 `error`；同一 head 的旧 `success` 可能保留。review 事件缺失也会留下旧状态。
4. **没有 stale-review 失效**：加权评分只取当前 review decision；旧 commit 的 approval 可能计入，除非原生规则 dismiss。不能声称代码已处理。
5. **没有 Project compare-and-swap**：`transitionResolvingIssues` 与 `initializeIssueStartDate` 都是 read-then-write；并发最后写入胜出。`lifecycle.mjs` 内有 TODO。
6. **没有 reconciler**：漏掉的 webhook/run 不会修复 Project；旧 run 重放会重放旧 command。
7. **Issue policy 的强制范围**：只有非 draft、人类、已有 review request/review 的 PR；其他 PR 豁免。不能把“没有报错”理解为“所有 PR 都合规”。
8. **review/comment 上限**：review 列表与 comment 列表达到 3000 条即失败；审计评论只查第一页 100 条；reviewCount 只取第一页 100 条。大型仓库需评估上限。
9. **归属加权的语义**：`git blame` 是 last-touch authorship，不是 review 质量或领域专长；分类器是词法/路径规则，不是语义执行分析；新 shipped source 必须扩展 classifier。
10. **原生 stack 能力未知且未验证**：`verification/evidence/raw/gh-stack-availability.json` 退出码为 0，但内容只记录 official extension **NOT installed**；没有 `--help` 输出，也没有一次真实 stack 成功。`gh stack` 版本、服务端 stack 功能、merge queue 配置仍是 forge-only；不支持时 hard-stop，不降级。
11. **review 所有权是手工选择**：源仓库没有 CODEOWNERS 或自动 reviewer assignment；`reviewerPoints` 是 login 白名单，不是路径 owner。迁移需自行决定是否加 CODEOWNERS（额外建议）。
12. **文档语言**：`review-ownership/README.md` 只以英文维护（`docs/i18n/README.md:62`）；`issue-management/README.md` 有中英配对。迁移时不要把英文 README 当成翻译配对的一部分，除非目标仓库另有规定。
13. **模板测试不是运行时策略**：模板 heading/frontmatter 由测试固定；运行时不检查展示格式；不要为了“统一”重新引入 details/长度/标题语言等展示规则。
14. **作者积分与合并数**：只反映历史合并数量，不反映质量；cap 100 可能截断高产出作者；bot 与人类同规则。
15. **人工 review 不可自动证明**：`dsh-code-review` 是 guidance；branch rule 只能证明“有人 approve”，不能证明 review 质量。
16. **远程证据的范围**：已授权公开 fixture `JusticeSc/harness-governance-public-acceptance-20261023-c7a4`（私有 fixture 保留）上已有历史只读记录：fixture 主分支保护要求 `weighted approval` 与 `fixture business`（app 15368，`strict:true`，dismiss stale/latest push/code-owner 开启、禁止强推）、过期 head 未审批合并被拒（405）后经真实新 head review 与加权分数合并、规则自改被拒；以及单个隔离 Project 的 Todo/In Progress/Done 写入读回。这些是**历史 fixture 能力**证据，不是原始源仓生产设置、完整七态生命周期、第二独立身份/委托或规则自改恢复的证明。本轮没有发起新的远程调用。所有 `verification` 仍为 `planned`。
17. **Project/App 需要显式授权**：源派生的 ProjectV2 字段、App 安装、required status 都保留为迁移前提；没有被授权/供应的账号、组织 Project 或 App 不得被写成已验证，也不得因为缺凭据把义务降级为“不适用”。不要重复创建 Project 或重建其一次性创建 workflow。

---

## 8. 跨域依赖与产品功能边界

**绑定状态说明**（只描述 coverage 账本，不描述执行结果）：
- `linked-other-owner-coverage`：对应域的 `research/<domain>-coverage.json` 确实记录了下列 path + ranges，且 `borrowedRanges` 已保留精确范围；不等于测试已执行。
- `linked-other-owner-coverage (partial)`：只绑定了一个视角（如 Security 只绑 Automation 的 credentialed-workflow 检查）。
- `pending-other-owner-coverage`：owner 仍在收敛或尚无 coverage；这是 blocking 的待办，不是已完成绑定。
- `self-inspected`：本域自己读取的产品源码/文档，记录在 `productScope`，不是其他域的绑定。

| 域 | 状态 | 实际绑定/观察范围（节选，完整见 coverage JSON） | 对本域的影响 |
|---|---|---|---|
| Automation/CI | `linked-other-owner-coverage` | `automation-coverage.json`；`.github/workflows/ci.yml:1-763`；`ci-master.yml:1-531`；`scripts/run-gates.ts:1-1697`；`package.json:19-243`；`scripts/ci-workflow.spec.ts` 的 1-123/218-306/304-563/679-783/964-1000/1516-1565 | `all checks passed`、gate inventory、required check 名称与 `needs` 由 Automation 最终确认；本域只要求“必须进入门禁” |
| Testing | `linked-other-owner-coverage`（源行已绑定，执行未证） | `testing-coverage.json#/inspected/1,9,10,23,32`；`docs/testing.md:1-55`；`.github/workflows/e2e.yml:1-127`；`vitest.e2e.config.ts:1-62`；`vitest.snapshot.config.ts:1-73`；`packages/test-support/session-snapshot/README.md:1-176` | `test:approval-policy`、snapshot/provider e2e 的源行由 Testing 记录；实际执行证据仍属该 owner 的计划项，本域不代证 |
| Documentation | `linked-other-owner-coverage` | `documentation-coverage.json`；`docs/AGENTS.md:1-77`；`docs/i18n/README.md:1-69`；`docs/defensive-patterns/README.md:1-25`；`scripts/run-gates.ts:300-362,487-505,805-885` | 双语配对、英文例外和文档入口由 Documentation 确认；`run-gates.ts:780-804` 是 flag/hygiene（Automation 侧），旧 `780-883` 请求并非一段 Documentation 声明 |
| Release | `linked-other-owner-coverage` | `release-coverage.json`；`AGENTS.md:1-185`；`release.yml:1-180`；`release-publish.yml:1-131`；`release-vendor.yml:1-107`；`release-vendor-publish.yml:1-126`；`scripts/release/publish.ts:1-235` | 发布分支 required checks、bot 作者与发布顺序由 Release 负责 |
| Supply | `linked-other-owner-coverage` | `supply-chain-coverage.json#/inspected/0`；`.github/dependabot.yml:1-41` | Dependabot/bot 作者积分、vendor 排除属于 Supply 的源记录，不能从 Release 覆盖推断，也不等于依赖更新已执行 |
| Engineering | `linked-other-owner-coverage` | `engineering-coverage.json`；`AGENTS.md:1-127,129-185`；`packages/AGENTS.md:1-29`；`docs/defensive-patterns/README.md:1-25`；`docs/defensive-patterns/general.md:1-222`；`scripts/run-gates.ts:333-397` | 代码修改的证据边界由 Engineering 负责；128 行未形成连续区间 |
| AgentFlows | `linked-other-owner-coverage` | `agent-workflows-coverage.json`；`AGENTS.md:1-185`；`dsh-code-review/SKILL.md:1-61`；`dsh-pre-push-checks/SKILL.md:1-137`；`dsh-merging-stacked-prs/SKILL.md:1-127`；`scripts/change-scope.ts:1-50` | 本域第 4/5 节的程序性机制以这些 Skill 原文为准 |
| Decisions | `linked-other-owner-coverage` | `decisions-coverage.json`；`AGENTS.md:60-124,139-185`；`docs/AGENTS.md:1-77`；`docs/defensive-patterns/README.md:1-25`；`dsh-code-review/SKILL.md:24-58`；`scripts/run-gates.ts:805-882`；`ci.yml:88-110` | 决策记录/门禁接线由 Decisions 负责 |
| Rationale | `linked-other-owner-coverage`（源行已绑定，结论未证） | `rationale-coverage.json#/inspected/4`；`AGENTS.md:125-169`；`docs/AGENTS.md:1-77`；`.agents/notes/README.md:1-125`；`docs/postmortem/README.md:1-18` | 上述范围由各自 owner 记录承接；只有 `AGENTS.md:125-169` 绑定到 rationale 的实际 inspected 行，“证据不能自证/非平凡变更留痕”的最终结论仍属该 owner |
| Security | `linked-other-owner-coverage`（partial） | 仅 Automation 的 credentialed-workflow 视角：`weighted-approval.yml:1-64`、`issue-policy.yml:1-58`、`issue-lifecycle.yml:1-52`、`e2e.yml:1-93`、`pi-ai-provider-e2e.yml:1-63`、`docs-pages.yml:1-90`、`build-preview-cloudflare.yml:1-73`、`publish-ssh-helper.yml:1-83` | 只能说明这些 workflow 的信任边界被看过，不是安全审计；secret scanning/action pinning 仍待独立 Security owner |
| Snapshot/provider e2e | `linked-other-owner-coverage`（源行已绑定，执行未证） | `testing-coverage.json#/inspected/1,9,10,23,32`；`docs/testing.md:1-55`、`e2e.yml:1-127`、`vitest.e2e.config.ts:1-62`、`vitest.snapshot.config.ts:1-73`、`session-snapshot/README.md:1-176` | 源行由 Testing 承接；provider/snapshot e2e 未执行，不能当作已通过 |
| Product UI | `self-inspected`（productScope） | `docs/user/guide/github-review.md:1-99`；`webhook-github/README.md:1-88`；`src/handler.ts:1-130`；`src/body.ts:1-69`；`examples/github-review/github-ready-review-rule.mjs:1-65`；`tests/handler.spec.ts:1-258`；`apps/web/tests/github-ready-review.e2e.ts:1-212` | 见下文：产品功能，不是合并门禁；有可迁移入站控制 |

### 8.1 产品 GitHub review：product-only 还是可迁移治理？

**实际定位**：这是 `dsh web` 的可选产品功能：签名 GitHub webhook 在 PR 从 draft 变 ready 时创建一个 **read-only review Session**。它**不是**仓库的 approval/branch-rule，也不是 Issue policy；`weighted approval` 的分数、required status、Project 字段都不由它计算。因此不能把 `apps/web/tests/github-ready-review*` 当作源仓库的合并门禁证据。

**可迁移的入站控制（已从源码确认，不是路径猜测）**：
1. **先验签再解析**：`handler.ts` 在 `JSON.parse` 前用 Octokit `Webhooks.verify` 验证 `X-Hub-Signature-256`；secret 每请求从 credential store 解析，支持轮换；错误签名返回 401。
2. **限界与形状**：只接受 `POST application/json`；必需头必须单值；`Content-Length` 与流式字节都受 `maxBodyBytes` 限制（示例 1 MiB）；UTF-8 解码失败/非对象/lossless JSON 失败返回 400。
3. **精确路由与事件过滤**：示例把 webhook 挂在独立 listener 的精确 `/github` 路径；rule 只接受 `source`、精确仓库、`pull_request`、`ready_for_review`；其他事件/仓库返回 null。
4. **不可信元数据边界**：rule 把 payload 中的 head SHA（事件快照，未独立向 GitHub 校验）和选定 PR 字段传入；prompt 明确要求先刷新 live PR metadata，再把 `event_metadata_json` 当 untrusted metadata，不得当指令；要求不回写文件/分支/PR/GitHub。
5. **最小权限**：Session 使用 `read-only` permission preset；webhook secret 只认证入站数据，不授予 rule 或 Agent 出站 GitHub 权限，出站授权必须另配。
6. **响应诚实**：202 只表示签名和 JSON 已被接受并已在内存 dispatch；不表示 rule 匹配或 Session 创建。

**明确限制**：
- 没有 TLS；示例依赖 loopback listener + TLS reverse proxy/tunnel。
- 没有 delivery 去重或持久状态；重复投递可能重复创建 Session；崩溃会丢失尚未 admitted 的 rule call。
- rule 是 trusted JavaScript；prompt 的“不要修改”不是硬安全边界，read-only 依赖 permission preset 配置。
- 未在本轮执行该 e2e；`handler.spec.ts` 的存在只证明测试代码覆盖了 202/轮换/400/401/413/415/503/重复头，不证明已运行。

**源范围**：上面表格 Product UI 行的 7 个文件，加上 `packages/experimental/webhook-github/examples/github-review/cordis.yml:1-35`（定义 1 MiB、loopback 3081 与 `read-only`）。

**结论**：产品功能本身是 product-only；其中“验签→限界→精确过滤→不可信元数据→最小权限→诚实 202”这组是**可迁移的入站安全控制**，但不能冒充仓库治理门禁。迁移时若目标没有该产品，不应因此丢弃这些控制；若目标要实现类似 webhook，可按上述顺序落地并补 TLS/去重。

**跨域报告给 parent**：Automation 的 `all checks passed` required 状态仍待远程证据；Testing/Supply 的源行已绑定而执行未证，Rationale 只有 `AGENTS.md:125-169` 已绑定、其余观察路径由各自 owner 记录；Security 只有 partial；Product UI 已按实际源码分类。除非另有授权，不把 Project/App/远程 CI 的缺失当作“不适用”，也不把源文件存在当作“已生效”。


---

## 9. 最小可操作清单（给安装后的 agent）

1. 先读目标仓库的默认分支、`AGENTS.md`、本参考 §2.11 的 forge 契约。
2. 任何 push 前：确认 live base → 运行 `change-scope` → 选最窄证据 → 跑一次 → 用 lease push → 核对远端 HEAD → `gh pr checks`。
3. 任何 review 前：fetch live base/head → 跑 `change-scope` → 读 sources of truth → 只报有证据的 blocker。
4. 任何多 PR 依赖：先查官方 stack 对象；native 不可用或 cross-fork → 停，不要逐 PR merge。
5. 任何 Issue/Project 变更：确认 Project 字段类型；不要在 PR 内假设 Checkout 会使用你的策略文件。
6. 任何“门禁已生效”的声明：必须有 required check/status 的只读线上证据；仓库文件本身不够。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `collaboration-trusted-default-branch`：`deepseek-harness/.github/review-ownership/README.md:44-56@687f282e`、`deepseek-harness/scripts/ci-workflow.spec.ts:1234-1331@687f282e`、`deepseek-harness/.github/issue-management/policy.test.mjs:894-957@687f282e`
- `collaboration-approval-eligibility`：`deepseek-harness/.github/review-ownership/check-approval.mjs:118-133@687f282e`、`deepseek-harness/.github/review-ownership/check-approval.test.mjs:154-233@687f282e`、`deepseek-harness/.github/review-ownership/check-approval.test.mjs:235-290@687f282e`
- `collaboration-author-credit`：`deepseek-harness/.github/review-ownership/author-weight.test.mjs:1-47@687f282e`、`deepseek-harness/.github/review-ownership/check-approval.test.mjs:501-525@687f282e`、`deepseek-harness/.github/review-ownership/check-approval.test.mjs:570-667@687f282e`
- `collaboration-ownership-weighted`：`deepseek-harness/.github/review-ownership/check-approval.test.mjs:392-463@687f282e`、`deepseek-harness/.github/review-ownership/blame-ownership.test.mjs:8-52@687f282e`
- `collaboration-delegation`：`deepseek-harness/.github/review-ownership/check-approval.mjs:184-310@687f282e`、`deepseek-harness/.github/review-ownership/check-approval.test.mjs:669-1131@687f282e`
- `collaboration-review-event-handoff`：`deepseek-harness/.github/review-ownership/check-approval.test.mjs:84-135@687f282e`
- `collaboration-stale-head-boundary`：`deepseek-harness/.github/review-ownership/check-approval.test.mjs:1133-1146@687f282e`
- `collaboration-issue-policy`：`deepseek-harness/.github/issue-management/README.md:11-37@687f282e`、`deepseek-harness/.github/issue-management/policy.test.mjs:540-893@687f282e`
- `collaboration-selective-preflight`：`deepseek-harness/.github/issue-management/selective-preflight.json:1-1@687f282e`
- `collaboration-label-taxonomy`：`deepseek-harness/.github/issue-management/rules.mjs:1-58@687f282e`
- `collaboration-lifecycle-status`：`deepseek-harness/.github/issue-management/policy.test.mjs:959-1010@687f282e`
- `collaboration-lifecycle-scheduling`：`deepseek-harness/scripts/ci-workflow.spec.ts:1332-1400@687f282e`
- `collaboration-project-fields-start-date`：`deepseek-harness/.github/issue-management/README.md:50-59@687f282e`、`deepseek-harness/.github/issue-management/policy.test.mjs:381-537@687f282e`
- `collaboration-issue-audit-repair`：`deepseek-harness/.github/issue-management/policy.test.mjs:224-369@687f282e`

## 来源索引（固定提交）

来源：deepseek-harness/.github/review-ownership/check-approval.test.mjs:292-345@687f282e
来源：deepseek-harness/.github/review-ownership/check-approval.test.mjs:347-370@687f282e
来源：deepseek-harness/.github/review-ownership/check-approval.test.mjs:476-487@687f282e
来源：deepseek-harness/.github/review-ownership/test_blame_production.py:1-43@687f282e
来源：deepseek-harness/.github/review-ownership/test_blame_production.py:216-217@687f282e
来源：deepseek-harness/.github/issue-management/policy.test.mjs:370-380@687f282e
来源：deepseek-harness/.github/issue-management/policy.test.mjs:1011-1077@687f282e
来源：deepseek-harness/.github/issue-management/policy.test.mjs:124-147@687f282e
来源：deepseek-harness/.github/issue-management/policy.test.mjs:1040-1054@687f282e
来源：deepseek-harness/scripts/change-scope.spec.ts:1-98@687f282e
