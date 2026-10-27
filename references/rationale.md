# 决策理由、否决知识与归档理由（rationale）：迁移参考

> 源提交：`687f282e8625c6b8d11ff58211a90524be2e4317`（DeepSeek Harness）。
> 本文只从原始仓库的 Note 正文、postmortem、当前规则/脚本和冻结归档中取证；不读取新根目录之外的既有提取包、Skill、研究或审计产物。所有新文件仅写入 `harness-project-governance/`。
>
> **证据标签**：`【源规则】` 是源仓库明文规则或脚本行为；`【源实践】` 是从多个 Note/postmortem 正文归纳出的做法；`【迁移设计】` 是给安装后消费者项目的建议，不是源仓库义务；`【未验证】` 是尚未运行或无法从静态阅读证明的事项。引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`。

本域负责“**为什么这样决定、哪些路已经被否决、旧记录何时不再是权威、哪些经验必须留在正文里**”。它不是 Note 生命周期操作手册（分类、移动、归档提交、翻译配对的具体命令主要由 Decisions/Documentation 域承担），也不是测试或发布流程本身。读本域时，应同时把“当前权威”落到相邻域的活文件；本域给出理由和判据，避免把历史记录误当现状。

---

<a id="0"></a>
## 0. 术语与总原则

| 术语 | 含义 | 不是 |
|---|---|---|
| Agent Note | 承载持久决策理据的记录；`proposed` / `implemented` / `rejected` 三种生命周期，`archived` 是冻结历史目录 | 变更日志、实现计划、规格书、PR 描述 |
| Postmortem | 一次已发生事故的根因、时间线、安全网与教训叙事 | 决策记录、缺陷单、追责报告 |
| Current authority | 当前活文件中的规则、接口、默认值或行为 | 归档 Note 中的旧事实 |
| Frozen snapshot | 归档 Note 的字节副本；只读、可链接、不可编辑 | 可修正的活文档 |
| Rejected knowledge | 被否决方案及其理由；未来提案必须先击败的理由 | 永久黑名单、不可再提的禁忌 |
| Negative guarantee | “永不发生/结构上不可能”的边界；后续改动必须保持 | 普通实现细节 |
| Reintroduction condition | 删除某项能力时写下的“什么条件下可以回来” | 模糊的“以后再说” |

总原则（`【源实践】`，在多个 Note 正文中重复出现）：

1. **记录“为什么”而不是“做了什么”**：代码和 PR 已经说明做了什么；Note 要说明问题、选择、被放弃的路、代价和永久边界。
2. **一个决定一个状态**：`implemented` 的 Note 用现在时描述当前代码；`proposed` 才写计划和未决问题；`rejected` 的 `Status` 行本身要给出否决理由。不要把“计划—实现—后续修补”堆在同一篇 Note 里。
3. **历史不是权威**：归档 Note 是历史快照。当前行为以活代码、活规则、活文档为准；引用归档时必须明确它是历史。
4. **否决要可检验**：备选方案要写“为什么没选”，最好带证据（失败测试、PR、基准、平台限制）。没有理由的“不选”会在下一次调查中被重新提出。
5. **证据分层**：格式正确不等于内容正确；测试通过不等于生产行为正确；文档声明不等于运行时保证。写 Note 和做评审时都要说明证据属于哪一层。
6. **判断留给人**：是否承载持久决策理据、是否“低价值可删”、译文是否等义、根因叙事是否充分，都是语义判断；工具只能检查字节、结构、链接和部分行为。

### 机制 ID 与章节索引

本参考按下列稳定机制 ID 组织；JSON 使用同一组 ID，便于集成者互链。

| 机制 ID | 本文章节 |
|---|---|
| `rationale.decision-record-content` | §1 |
| `rationale.alternatives-and-rejected-knowledge` | §2 |
| `rationale.non-trivial-note-policy` | §3 |
| `rationale.format-classification-and-index` | §4 |
| `rationale.archive-retention-and-freeze` | §5 |
| `rationale.postmortem-root-cause` | §6 |
| `rationale.verification-epistemics` | §7 |
| `rationale.simplification-evidence` | §8 |
| `rationale.dependency-policy` | §2.1、§8.2 |
| `rationale.performance-evidence` | §9 |
| `rationale.removal-and-reintroduction` | §10 |
| `rationale.authority-and-history-routing` | §5.4、§12 |
| `rationale.human-judgment-boundary` | §11 |

---

<a id="1"></a>
## 1. 决策记录的内容契约

### 1.1 何时必须写

`【源规则｜现行】` 只有 **lasting decision rationale**（代码、测试和现有文档无法解释的持久决策）才要求在同一变更中新增或更新 Agent Note；不是每个非平凡变更都强制。当前活权威是根 `AGENTS.md:155`、`docs/AGENTS.md:40-41` 与 `.agents/notes/README.md#when-to-write-one`；归档的 2026-07-19 “every non-trivial change” 规则是历史，不再单独构成义务。

`【源规则｜历史信号】` 归档 Note 给出的非平凡范围仍可用于判断改动是否承载持久决策：

- 新增或修改事件/上下文/hook/流；
- 新增状态存储；
- 改变用户可见行为；
- 改变公开 API、配置默认值、CLI 表面或扩展点；
- 新增跨包依赖；
- 移除能力、文件或路径；
- 其他会让未来读者问“为什么”的改动。

纯 typo、格式、注释编辑，以及不改变接口、状态或行为的机械清理，可以省略 Note。**但“小”不等于“平凡”**：一个字符的默认值、一个 CSS token、一个 accessibility 语义都可能改变用户可见行为。2026-06-20 的分类修订明确删除了“small UI adjustments or purely mechanical changes”这一豁免，因为“看起来像调参”的 UI 改动仍可能改变行为、可访问性和契约（`deepseek-harness/.agents/notes/archived/process/2026-06-20-agent-note-classification.md:11-33@687f282e`）。测试和 fixture 的批量机械修改通常可省略；但如果测试本身在定义新的验证契约，则应按承载持久决策处理。

判定表（`【迁移设计】`，用于判断改动是否需要为持久决策建 Note）：

| 问题 | 是 → 需要 Note | 否 → 可省 Note |
|---|---|---|
| 是否改变事件、上下文、hook、流、持久化状态或 schema？ | 是 | 否 |
| 是否改变默认值、公开 API、CLI、配置键或扩展点？ | 是 | 否 |
| 是否改变用户可观察行为（含可访问性、焦点、布局语义）？ | 是 | 否 |
| 是否新增依赖、移除能力、改变跨包所有权？ | 是 | 否 |
| 是否只是重命名局部变量、格式化、注释或纯机械 fixture 更新？ | 否 | 是 |
| 读者是否会问“为什么这样做而不是另一种”？ | 是 | 否 |

**不要用行数、文件数或“是否在 architecture 目录”来判定**。2026-07-19 的 Note 明确拒绝了自动阈值：语义判断无法由 diff 大小替代；一个五行的持久化默认值改动可能比两百行测试改动更重要（`deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:7-40@687f282e`）。作者在 PR 中声明改动范围；评审者补足或质疑；没有 CI 分类器。

### 1.2 必须回答的问题

`【源规则】` 当前格式说明（`deepseek-harness/.agents/notes/README.md:54-125@687f282e`）要求正文围绕以下骨架展开：

| 段 | 必须回答 | 质量判据 |
|---|---|---|
| `## Problem` | 什么坏了/什么机会存在？失败如何被观察到？影响谁？ | 不是“需求是……”的空话；能指向具体文件、行为、错误或用户场景 |
| `## Decision` | 决定了什么？边界在哪？谁拥有什么？ | 现在时；能区分“我们做什么”和“我们不做什么” |
| `## Alternatives considered` | 还有哪些现实可选路径？为什么没选？ | 每个备选独立成段；理由可检验；不是稻草人 |
| `## Consequences` | 读者/维护者要付出什么？换来了什么？哪些旧做法被禁止？ | 同时写成本和收益；不掩饰迁移负担 |
| `## Verification`（按需） | 在这版代码上如何证明？哪些是计划中证据？ | 区分已运行/计划；不把“测试存在”当“行为正确” |
| `## Risks`（`proposed`） | 可能怎样错？哪些未知？ | 具体、可观测；不是“可能有风险” |

`【源规则】` `implemented` Note 不得包含 `## Open Questions`、计划/迁移步骤或“未来工作”；这些属于 PR/issue。`implemented` 的正文要用现在时描述已落地的代码，不能用“将”“计划”“TODO”。反过来，`proposed` Note 可以保留未来时、`## Proposal`、`## Acceptance criteria`、`## Risks`，但一旦落地必须重写为 `implemented` 的完成时/现在时，而不是追加一段“后来我们……”（`deepseek-harness/.agents/notes/implemented/AGENTS.md:3-13@687f282e`）。

`【源规则】` `rejected` Note 用 `## Proposal` 代替 `## Decision`，并保留 `## Alternatives considered`；`Status` 行必须给出否决理由，不能只写 `rejected`。如果否决是在实现后由证据推翻前提，理由要写清“哪条前提被什么证据推翻”（例子：`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:1-10@687f282e`：vitest 的 fake clock 不拦截 `node:timers/promises`，换取约十行删除却失去确定性测试，因此否决）。

### 1.3 正文里必须留下的“永久事实”

`【源实践】` 以下内容一旦写入 Note，通常就是该 Note 长期保持 active 的理由；它们比“实现了某个函数”更耐久：

1. **负向保证**：明确什么永远不会发生、什么是结构上不可能、什么必须在所有路径上成立。例：事件溯源 Note 说日志本身就是状态，因此状态与日志“结构上不可能”分叉（`deepseek-harness/.agents/notes/implemented/architecture/2026-06-11-event-sourced-sessions.md:5-23@687f282e`）；能力接缝 Note 说 Consumer 永不导入 provider 特定类型（`deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:7-36@687f282e`）。
2. **所有权边界**：一个跨切面事实只能有一个解析器/主人。例：`~/.dsh` 的解析只由 `dsh-home-paths` 拥有；两个 `resolveDshHome` 已经漂移，重复就是潜在分叉缺陷（`deepseek-harness/.agents/notes/implemented/architecture/2026-07-24-single-harness-home-resolver.md:7-24@687f282e`）。
3. **删除/回退后的重新引入条件**：删除 `ImageBlock` 时写下“若槽位回归，保留类型但把每个静默跳过改成显式拒绝；静默丢弃是唯一没有辩护者的状态”（`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:5-30@687f282e`）。该条件后来由多模态/`read_image` 的回归满足，Note 也已归档；这正是“条件写清楚”的价值。
4. **验证契约与观察边界**：这版代码用什么测试/基准/手工检查证明；哪些只是计划；哪些观察无法由该测试覆盖。例：Windows 打开文件的 Note 明确写“Nothing here verifies that a window appeared”，并记录非交互会话下 Explorer 仍退出 1 的限制（`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-windows-open-through-shell-resolution.md:5-44@687f282e`）。
5. **代价**：新增包、额外 boilerplate、迁移负担、性能成本、失去的确定性。没有代价的“收益”通常意味着分析不完整。

### 1.4 时态、措辞与引用

`【源规则】` `docs/AGENTS.md` 的文档规范要求：

- 当前文档用现在时描述当前状态；历史留在 commit/PR/Note/postmortem，不写“以前是……现在是……”的编年史（`deepseek-harness/docs/AGENTS.md:40-41@687f282e`）。
- 具体散文要命名真实 actor、文件、函数、配置键和已记录的事实；禁止“it's not X, it's Y”一类空洞对比、模糊的“更简单/更清晰”、未落地的抽象名词（`deepseek-harness/docs/AGENTS.md:61-73@687f282e`）。
- 引用已提交的工件（路径、符号、PR/commit），不要引用未提交的工作区状态；不要用“设计 1/设计 2”这类相对编号代替可定位的标识符（`deepseek-harness/.agents/notes/archived/process/2026-08-09-committed-artifact-citations.md:7-33@687f282e`）。
- 不要在 Note 里重述完整代码或接口目录；代码和生成参考是权威，Note 只解释“为什么”和“边界”。

### 1.5 操作卡：写一篇可用的决策记录

| 项 | 内容 |
|---|---|
| 前置 | 已确认改动承载持久决策理据（非平凡判定表只是信号）；已读当前活规则和同主题旧 Note；知道当前权威文件 |
| 步骤 1 | 先写 `## Problem`：具体失败/机会、观察方式、受影响 actor；不要把方案写进问题 |
| 步骤 2 | 写 `## Decision`：选择、边界、所有权、负向保证；用现在时 |
| 步骤 3 | 写 `## Alternatives considered`：至少一个真实备选；逐条写“为什么不选” |
| 步骤 4 | 写 `## Consequences`：成本 + 收益 + 被禁止的旧做法 + 迁移负担 |
| 步骤 5 | 写验证/限制：哪些已运行、哪些计划、哪些无法观察；不要把计划标成已通过 |
| 步骤 6 | 若取代旧 Note：加 `Superseded by` 链接和原因；若只是部分取代：保留旧 Note 仍有效的部分，只在新 Note 里说明覆盖范围 |
| 责任角色 | 作者/PR 作者写；评审者检查语义；文档维护者检查格式/链接/配对 |
| 完成信号 | Note 与代码同一变更落地；格式检查通过；评审者能只读 Note 复述决定和代价；未来读者能按链接找到当前权威 |
| 失败处理 | 若写不出备选：说明“确实只有一个可行路径”并给出约束，不要伪造；若写不出代价：重新审视方案；若发现旧 Note 与新代码冲突：不要静默改旧 Note，新增/重写当前 Note 并在旧 Note 标记 superseded |
| 例外 | 纯机械/纯格式可只改代码；`proposed` 可暂不完整；事故用 postmortem 而非普通 Note |
| 证据限制 | 格式门只查标题/状态/配对；没有任何门能证明理由正确、备选真实、代价完整 |

---

来源：deepseek-harness/.agents/notes/README.md:44-52@687f282e
来源：deepseek-harness/.agents/notes/README.md:54-125@687f282e
来源：deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e
来源：deepseek-harness/docs/AGENTS.md:40-41@687f282e
来源：deepseek-harness/docs/AGENTS.md:61-73@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-11-event-sourced-sessions.md:5-23@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-24-single-harness-home-resolver.md:7-24@687f282e
来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:5-30@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-windows-open-through-shell-resolution.md:5-44@687f282e
来源：deepseek-harness/docs/postmortem/README.md:1-18@687f282e

<a id="2"></a>
## 2. 备选方案与否决知识

来源：deepseek-harness/.agents/notes/README.md:105-121@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:9-23@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:11-78@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:3-37@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:1-10@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-19-evidence-led-simplification-surveys.md:25-45@687f282e
来源：deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:31-31@687f282e
来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-38@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:25-30@687f282e

<a id="2-1"></a>
### 2.1 为什么备选段是硬要求

`【源规则】` 每篇非 `rejected` 的 Note 都必须有 `## Alternatives considered`；每段只讲一个备选，每段给出不选的理由（`deepseek-harness/.agents/notes/README.md:105-117@687f282e`）。格式门会把缺失/空段标为问题，但不判断理由质量（`deepseek-harness/scripts/verify-agent-note-format.ts:1-94@687f282e`）。

`【源实践】` 好的备选段通常包含三类内容：

- **被认真考虑过的替代设计**：不是“也可以不做”这种废话，而是另一个可运行的方案。
- **否决证据**：失败测试、平台限制、维护成本、语义不匹配、已有机制已覆盖。
- **未来重新提出的条件**：如果前提变化，什么证据会让这个备选重新成立。

例子：

- 统一 Note 格式的早期 Note 把“按状态分文件/目录”“每域自定义模板”“强制每篇都套完整骨架”“把模板文字原样保留”逐条否决，理由分别是发现成本、读者负担、机械填空和模板腐化（`deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:9-23@687f282e`）。
- NIH 审计把 16 个候选依赖替换合并成一篇 Note，逐条给出“已有 maintained package / 删除行数 / 平台风险 / 安全边界”等理由；这不是“每个候选一篇”的机械记录，而是“同一政策决定”的分组（`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:11-78@687f282e`）。
- 包拆分提案在实现前被否决，理由包括 `ctx.compaction` 已持有 seam、消费者是 loop、重新导出类型边界不清、运行时调用次数需要实测；后来按该 seam 落地并删除旧包（`deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:3-37@687f282e`）。

### 2.2 否决知识的生命周期

`【源规则】` `rejected` Note 不归档，`proposed` 也不归档；只有 `implemented` 可以归档。`rejected` 只在“仍然能阻止一个有诱惑力的现实错误”时保留；如果它已过时、被取代、不再可信或不太可能阻止重提，就删除整个三元组并修复/删除入站链接。归档技能把拒绝记录定位为 **guardrail**，而不是永久陈列；`proposed` 若不再值得推进，应诚实地转为 `rejected`，而不是归档（`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-38@687f282e`）。全仓检索 `rejected` 仍能发现这些理由，不需要默认搜索归档。

`【源实践】` 否决不是永久禁令：

- 否决是**带范围/版本的证据**，不是人格判断。未来提案可以因为平台变化、依赖维护状态变化、消费者出现或测试能力变化而重新成立。
- 新提案必须引用旧否决，并明确“哪条理由不再成立/被新证据推翻”。如果只是重复旧提案而不处理理由，评审应直接拒绝。
- 如果否决是在实现后由证据推翻前提，`Status` 行要写“已被什么证据推翻”，而不是只写“rejected”。内置 timer promise 的 Note 就是这种“实现后否决”的模板（`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:1-10@687f282e`）。

### 2.3 操作卡：提出/审查一个被否决的方案

| 项 | 内容 |
|---|---|
| 前置 | 已搜索 `rejected/`、归档、历史模式；知道旧理由和适用范围 |
| 步骤 1 | 在提案中引用旧 Note 的具体理由，而不是只说“之前被拒过” |
| 步骤 2 | 列出发生变化的前提（依赖维护、平台、消费者、测试能力、性能预算） |
| 步骤 3 | 给出能推翻旧理由的证据（基准、失败复现、上游 release、平台文档） |
| 步骤 4 | 若仍不成立：不要改写旧 Note；保留/更新当前否决理由。若旧否决已过时、被取代或不再可信，按当前归档技能删除整个三元组并修复链接，而不是继续陈列 |
| 步骤 5 | 若旧 Note 仍有 guardrail 价值：把新提案的证据作为 PR/issue 记录，不要修改历史 Note 的当时结论 |
| 责任角色 | 提案者举证；评审者判断证据是否真的触及旧理由 |
| 完成信号 | 新旧理由的差异可被第三人复述；决定能落到一个当前权威 |
| 失败处理 | 若证据不足：保留 `rejected`，把新证据作为 PR/issue 附件；不要把“没时间”写成“技术上不可行” |
| 例外 | 安全/法律/平台硬限制可以构成强否决；仍要写清具体限制 |
| 证据限制 | 旧否决可能已过时；归档/历史模式不是当前事实；不要用“历史模式”替代本仓证据 |

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:9-34@687f282e
来源：deepseek-harness/AGENTS.md:140-140@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:3-78@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:1-10@687f282e
来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:45-55@687f282e

<a id="3"></a>
## 3. 持久决策理据的判定：为什么没有自动分类器

### 3.1 源规则的核心

`【源规则｜历史】` 归档 2026-07-19 Note 明确说：“Review enforces the semantic boundary. No automated gate attempts to classify a diff as trivial or non-trivial, so this policy adds no gate stage or runtime.” 这句话仍准确描述现行机制：变更范围由作者声明、评审者判断；**没有自动门把 diff 分类为 trivial/non-trivial**（`deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:30-40@687f282e`）。

`【源规则｜现行】` 触发已收窄为 lasting decision rationale：只有承载持久决策的变更才在同一个 change 中新增或更新 Agent Note；只在 PR/commit body 中解释不算。现行权威为 `AGENTS.md:155`、`docs/AGENTS.md:40-41` 与 `.agents/notes/README.md:44-52`（`deepseek-harness/AGENTS.md:155@687f282e`；`deepseek-harness/docs/AGENTS.md:40-41@687f282e`；`deepseek-harness/.agents/notes/README.md:44-52@687f282e`）。归档的“每个非平凡变更都写 Note”是历史触发，不是现行义务。

### 3.2 现行规则下仍不采纳的简化做法（迁移设计）

`【迁移设计】` 现行规则不要求“每个非平凡变更”，但仍不能把持久理据缩成某一类改动；以下做法会漏掉其他类的决策：

| 替代 | 为什么不行 |
|---|---|
| 用行数/文件数阈值 | 语义权重与大小无关；默认值/安全边界可以在几行内改变 |
| 用 CI 分类器 | 分类器只能看文本，不能理解“这是否改变了持久化契约/用户行为” |
| 只要求 architecture 变更写 | 大量治理风险在 process/testing/simplification/依赖/文档 |
| 只要求用户可见变更写 | 内部状态、所有权、验证契约同样需要理由 |
| 只要求“有测试”的变更写 | 测试可能只钉住错误行为；测试存在不等于行为正确 |

### 3.3 操作卡

| 项 | 内容 |
|---|---|
| 前置 | 作者能描述改动的可观察效果和受影响契约 |
| 步骤 1 | 用 1.1 判定改动是否承载持久决策理据；不确定时按需要 Note 处理 |
| 步骤 2 | 在 PR 描述中写“实际改了什么/没改什么”；测试范围也要如实写（见 `dsh-code-review` 的 scope 要求） |
| 步骤 3 | 如判为无需 Note：在 PR 中给出理由（纯格式/纯机械/无行为变化），不要只写“trivial” |
| 责任角色 | 作者判断；评审者复核；没有机器兜底 |
| 完成信号 | 需要 Note 时 Note 存在且与改动同一变更；或 PR 中有可复核的免 Note 理由 |
| 失败处理 | 评审者认为漏写：要求补 Note；作者认为被过度要求：引用具体行为/契约说明为什么不需要 Note |
| 例外 | 紧急回滚可先落地，但随后补 Note；不要用“紧急”永久豁免 |
| 证据限制 | 误判会长期累积；没有指标能证明“所有持久决策都写了 Note” |

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:7-40@687f282e
来源：deepseek-harness/.agents/notes/README.md:44-52@687f282e
来源：deepseek-harness/AGENTS.md:155-155@687f282e
来源：deepseek-harness/docs/AGENTS.md:40-41@687f282e
来源：deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e

<a id="4"></a>
## 4. 格式、分类与索引：结构服务于发现，不证明内容

### 4.1 统一格式的理由

`【源规则】` 所有 active Note 共享一个骨架：`Status`、`## Problem`、`## Decision`、`## Alternatives considered`、`## Consequences`（`implemented`）；`proposed` 用 `## Proposal`/`## Acceptance criteria`/`## Risks`；`rejected` 用 `## Proposal` 并保留备选。文件名是 `YYYY-MM-DD-short-kebab-title.md`；日期是创建日，不是归档日或决定日。每篇 Note 还必须有一个中文对照文件（`deepseek-harness/.agents/notes/README.md:54-125@687f282e`）。

`【源实践】` 统一格式的价值不是“好看”，而是：

- 读者不必先猜作者风格，能直接跳到问题/决定/备选/后果；
- 评审者可以按段检查是否缺少理由；
- 旧 Note 可以机械迁移，不必重写论证；
- 模板的“空段”会暴露论证缺失，而不是被散文掩盖。

被否决的格式方案包括：按状态分目录/文件名、每域自定义模板、强制每篇都套完整骨架（对一行修复过重）、把模板文字原样保留（产生空洞段落）（`deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:9-23@687f282e`）。

### 4.2 分类的理由

`【源规则】` 类型由“变更意图”决定，而不是由改了哪些文件决定：

- `architecture`：边界、所有权、持久化/协议契约；
- `bug-fix`：修正错误行为/症状；
- `feature`：新增能力；
- `process`：治理、评审、发布、文档流程；
- `simplification`：删除/合并/降低维护成本；
- `testing`：测试基础设施、覆盖策略、可靠性。

分类器是两遍：先按目录推出类型，再解析 Note 的 `Status`；未知目录、类型/状态矛盾、缺少 `## Problem` 等都拒绝。它只检查“类型与位置一致”，不判断类型选得对不对（`deepseek-harness/scripts/agent-note-tree.ts:1-83@687f282e`；`deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e`）。

`【源规则】` 分类器使用的路径分类清单在 `scripts/agent-note-tree.ts` 内；要新增类型必须同时改校验器/文档，而不是只建目录。分类错误属于评审问题；分类器只拒绝机械不一致。

### 4.3 不生成索引的理由

`【源实践】` 早期有一个生成的 `INDEX.md`，但它在默认检索中变成陈旧、重复的“第二权威”，读者会先搜到索引而不是活 Note。2026-07-19 的 Note 决定删除索引，改为链接/目录发现；当前 `.rgignore` 把归档和生成目录排除在默认搜索之外（`deepseek-harness/.agents/notes/archived/process/2026-07-19-remove-generated-agent-note-index.md:7-31@687f282e`；`deepseek-harness/.agents/notes/README.md:36-42@687f282e`）。

`【迁移设计】` 不要重新引入“全量 Note 索引”作为默认入口。若需要发现，使用：

- 当前活的目录 + 类型；
- 具体主题的交叉链接；
- 当前权威文档中的“相关决策”链接；
- 受控的 `rg` 搜索（显式包含/排除历史）。

索引可以作为一次性报告/审计输出，但不应成为可编辑的第二真源。

### 4.4 格式门的能与不能

`【源规则】` `scripts/verify-agent-note-format.ts` 检查：头部状态、必需段落、`rejected` 的 `Proposal`、备选段存在、文件名/日期格式、英文/中文配对、Section key 块等。`scripts/agent-note-tree.ts` 检查路径与状态。它们不检查论证质量、备选真实性、代价是否完整。`scripts/verify-doc-refs.ts` 检查本地链接目标是否存在，忽略归档内容；归档内的链接由归档冻结规则处理（`deepseek-harness/scripts/verify-doc-refs.ts:1-45@687f282e`）。

操作卡：

| 项 | 内容 |
|---|---|
| 前置 | 已读当前 `README` 骨架和分类清单 |
| 步骤 1 | 用 `YYYY-MM-DD-kebab-title.md` 命名；同变更创建 `.zh.md` 对应文件 |
| 步骤 2 | 填头部 `Status`、`English | [中文](...)`；按状态选骨架 |
| 步骤 3 | 填 `## Problem`/`Decision`/`Alternatives`/`Consequences`；不要留空段 |
| 步骤 4 | 运行 `node scripts/agent-note-tree.ts --write` 和格式/分类校验（若项目脚本名不同，使用对应 `scripts/*` 入口） |
| 责任角色 | 作者填；评审者看语义；CI 跑机械检查 |
| 完成信号 | 格式/分类/链接检查通过；评审者能复述论证 |
| 失败处理 | 格式失败按错误修；分类失败改路径或文档化新增类型；链接失败改目标或加当前权威重定向 |
| 例外 | 归档 Note 不重新格式化；旧 Note 的缺段由冻结规则允许 |
| 证据限制 | 结构正确 ≠ 内容正确；自动门可被空话通过；分类正确 ≠ 分类合理 |

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:9-31@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-06-20-agent-note-classification.md:7-40@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-remove-generated-agent-note-index.md:7-31@687f282e
来源：deepseek-harness/.agents/notes/README.md:7-34@687f282e
来源：deepseek-harness/.agents/notes/README.md:54-125@687f282e
来源：deepseek-harness/scripts/agent-note-tree.ts:1-83@687f282e
来源：deepseek-harness/scripts/verify-agent-note-format.ts:1-94@687f282e
来源：deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e
来源：deepseek-harness/scripts/verify-doc-refs.ts:1-45@687f282e
来源：deepseek-harness/docs/i18n/README.md:9-44@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-23-section-keyed-translation-pairing-records.md:1-29@687f282e

<a id="5"></a>
## 5. 冻结归档与当前权威

### 5.1 保留、删除、归档的边界

`【源规则】` 实现型 Note 达到以下任一条件时**保留 active**（不归档、不删除）：

- 记录负向保证/所有权边界/跨产品契约；
- 记录 durable/wire 语义、安全规则；
- 记录引入条件、微妙不变量；
- 记录独特备选方案或后来的改动依赖其理由；
- 其理由仍能指导未来工作，或历史决策仍可搜索。

`【源规则】` 只有“低价值记录”可以删除：只描述小 UI 调整或纯机械变更，且其理由对未来工作不太可能有指导意义；删除前要确认没有行为/默认值/安全/持久化/重新引入条件/微妙不变量/独特备选。删除后不得留下空引用；如果同一主题需要保留，改写为归档或合并到当前 Note（`deepseek-harness/.agents/notes/README.md:36-42@687f282e`；`deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:11-23@687f282e`）。

`【源规则】` 所有符合条件的完整 `implemented` 三元组（`.md`、`.zh.md`、`.i18n.yaml`）必须在同一 PR 中归档。部分取代时，更新幸存 Note 使其精确覆盖原范围，而不是把旧 Note 留在 active 制造两份权威（`deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:23-30@687f282e`）。

`【源规则】` 当前归档技能把 lifecycle 分成六类（`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:24-38@687f282e`）：

- **implemented — delete**：只删除“小 UI 调整/纯机械变更”的完整三元组；本地 bug fix、性能改动、新能力、实质性行为/所有权决定**不能仅因为已实现就删除**。先应用这条，再考虑 keep/archive。
- **implemented — keep active**：理由、备选、负向保证、durable/wire 语义、所有权边界、安全规则、重新引入条件仍可能指导未来改动；长度不是标准。
- **implemented — archive**：完整、实质性、历史理由值得保留、但不太可能指导未来工作的决定；不要归档满足“直接删除”标准的记录。
- **proposed — 永不归档**：不再值得推进时，诚实地转为 `rejected`，而不是归档。
- **rejected — 只作为 guardrail 保留**：失败提案仍是诱人的、有意义的错误，且 Note 解释了它为什么输。
- **rejected — 删除**：过时、被取代、不再可信，或不太可能阻止重提；修复/删除入站链接。

不要按配额归档；检查范围内每一篇 Note，把同类决定归到一个原则上判断，记录真正的边界案例（`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:38-52@687f282e`）。只有 `implemented` 可以归档；`proposed`/`rejected` 都不进 `archived/`。

### 5.2 归档为什么是冻结的

`【源规则】` 归档 Note 是“当时的事实/决定”的历史快照，不是当前权威：

- 不编辑、不重排、不翻译、不删除、不移动；
- 不“修复”旧事实/旧链接；当前文档可以新增重定向，但不改归档字节；
- 不把归档加入默认搜索（`.rgignore` 已排除）；
- 归档路径是兼容命名空间；链接可指向它，但读者必须回到当前权威；
- 唯一允许的写入是归档清单（路径 + `sha256:`），用于证明字节未被改动；清单本身不是内容权威。

来源：`deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e`；`deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e`；`deepseek-harness/.rgignore:1-2@687f282e`。
来源：deepseek-harness/.agents/notes/README.md:36-42@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:5-45@687f282e
来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-38@687f282e
来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:38-52@687f282e
来源：deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e
来源：deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e
来源：deepseek-harness/.rgignore:1-2@687f282e
来源：deepseek-harness/docs/AGENTS.md:23-29@687f282e

`【源实践】` 冻结的理由不是“历史不可变”的教条，而是**防止历史被悄悄改写为现状**：

- 归档中的“当前默认值/当前路径”会随代码变化；若允许编辑，读者无法判断这是当时事实还是后来修订。
- 归档是兼容性链接目标；删除/移动会破坏外部引用。
- 归档清单的哈希能证明“没有改过”，但不能证明内容正确或仍适用。

### 5.3 归档时的操作

| 项 | 内容 |
|---|---|
| 前置 | 变更已实现；确认 Note 是完整三元组；确认它是 `implemented`；确认当前权威仍在某处 |
| 步骤 0 | 新增 Note 前，先审计同一决定/机制/被否代方案的 active Note：分类 full/partial supersession；同 PR 归档完整三元组；部分取代保留并交叉链接；过时提案转 `rejected`；不再有 guardrail 价值的 rejected 删除（`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-22@687f282e`） |
| 步骤 1 | 运行归档技能/清单生成器，把三个文件移动到 `archived/<type>/` 并保留相对链接 |
| 步骤 2 | 更新归档清单（路径 + hash），不要手写 hash |
| 步骤 3 | 在合并 PR 中同时更新所有引用：活文档指向当前权威；归档内链接不修，除非是新的当前文档重定向 |
| 步骤 4 | 运行归档校验（字节、清单、路径、必需文件）；运行链接校验 |
| 责任角色 | 作者/归档技能；评审者确认“没有把仍需 active 的理由归档” |
| 完成信号 | 归档校验通过；默认搜索不返回归档；活文档能指向新的当前权威 |
| 失败处理 | 字节/清单失败：从 Git 恢复原字节，重新生成清单；链接失败：改当前文档，不改归档；误归档：从 Git 恢复并把该 Note 留在 active，记录原因 |
| 例外 | 归档 Note 的内部链接可以失效；`verify-doc-refs` 不要求归档内容可解析 |
| 证据限制 | 没有门判断“是否低价值”；清单只证字节；归档会累积陈旧事实 |

<a id="5-4"></a>
### 5.4 历史策略 Note → 当前权威映射

下表把本次实际读到的归档策略 Note 映射到当前活权威。**“当前权威”是阅读入口，不是对每条细节的逐字证明**；最后一列给出验证方式。若活文件与归档冲突，以活文件为准。

| 归档 Note（历史理由） | 它冻结了什么 | 当前权威（活文件） | 验证/注意 |
|---|---|---|---|
| `archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes` | 历史触发：every non-trivial change 写 Note；无自动分类器；移除保留理由 | `.agents/notes/README.md:44-52`；`AGENTS.md:155`；`docs/AGENTS.md:40-41`；`.agents/notes/implemented/AGENTS.md:3-13` | 现行触发已缩为 lasting decision rationale；非平凡判定不再是强制触发；读当前 README 确认 PR 同变更含 Note |
| `archived/process/2026-07-05-uniform-agent-note-format` | 统一骨架/状态/文件名 | `.agents/notes/README.md:54-125`；`scripts/verify-agent-note-format.ts`；`scripts/agent-note-tree.ts` | 运行格式/分类脚本；读当前 README |
| `archived/process/2026-06-20-agent-note-classification` | 类型/生命周期/路径分类；未知拒绝 | `.agents/notes/README.md:7-34`；`scripts/verify-agent-note-classification.ts`；`scripts/agent-note-tree.ts` | 运行分类脚本；确认新类型同时改脚本/文档 |
| `archived/process/2026-07-19-remove-generated-agent-note-index` | 删除生成索引；链接替代 | `.rgignore:1-2`；`scripts/verify-doc-refs.ts`；`.agents/notes/README.md:36-42` | 搜索是否重新出现 INDEX；运行链接检查 |
| `archived/process/2026-07-26-frozen-agent-note-archive` | 归档冻结、保留/删除边界、manifest | `.agents/notes/archived/AGENTS.md:1-9`；`scripts/verify-archived-agent-notes.ts`；`.agents/notes/README.md:36-42` | 读归档 AGENTS；运行归档校验 |
| `archived/process/2026-08-09-committed-artifact-citations` | 只引用已提交工件；拒绝设计序号 | `docs/AGENTS.md:61-73`；`AGENTS.md:156`；`scripts/verify-repository-references.ts`；`dsh-prose-standard` | 读 PR 引用；运行引用校验 |
| `archived/process/2026-08-09-concrete-prose-names-actors-and-recorded-facts` | 具体散文命名 actor/事实；反 slop | `docs/AGENTS.md:61-73`；`dsh-prose-standard` | 评审阅读；没有语义门 |
| `archived/process/2026-09-23-section-keyed-translation-pairing-records` | 按 heading 做中英配对 | `docs/i18n/README.md:9-44`；`scripts/verify-translation-pairing.ts` | 读配对规则；运行配对校验 |
| `archived/process/2026-07-27-explicit-change-scope-report` | PR 说明实际改了什么/测试范围 | `scripts/change-scope.ts`；`.agents/skills/dsh-code-review/SKILL.md:10-27`；pre-push | 运行 scope 检查；读 review skill |
| `archived/process/2026-09-19-evidence-led-simplification-surveys` | 证据优先、分类/验证/无预设目标 | `.agents/skills/dsh-find-simplifications/SKILL.md:8-61`；`.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-43` | 读当前 skill；不要拿历史模式当命令 |
| `archived/testing/2026-09-27-web-lane-assertions-name-their-input-state` | 快照断言必须自己建立输入状态 | `docs/testing.md:19-41`；当前 e2e 测试；`dsh-ci-test-reliability` | 读当前测试；运行对应 lane |
| `archived/testing/2026-09-08-ci-completion-observations` | 完成观察 ≠ 接受/投影/启动 | `docs/testing.md:1-55`；`dsh-ci-test-reliability`；当前相关测试 | 读当前测试/技能；不能只靠归档 |
| `archived/simplification/2026-07-04-drop-image-content-block` | 删除 `ImageBlock`；重新引入条件 | 当前多模态/`read_image` Note；`ImageBlock` 回到词汇（见 `archived/feature/2026-08-10-minimal-read-image-tool.md:10-19`） | 该条件已满足，Note 已归档；不要再把它当现状 |
| `implemented/simplification/2026-09-11-remove-e2b-providers` | 移除 E2B；能力损失/回归条件 | 该 Note 的 Verification 声称删除清单无 live E2B package/import；本次未全量复跑 | 以 Note 的缺席验证为准；若回归按 Reintroduction conditions |
| `implemented/simplification/2026-07-23-acp-automation-only-protocol` | ACP 仅自动化/文件 I/O，不做交互式 | 当前 ACP 实现/文档；协议边界 | 读当前实现；历史 Note 只解释原因 |
| `implemented/architecture/2026-06-11-event-sourced-sessions` | 日志即状态；持久化/派生边界 | 当前 `packages/session`/`dsh-session` 代码与文档 | 该 Note 仍 active，应优先读它；不要把归档中的旧持久化名当现状 |
| `implemented/architecture/2026-07-24-single-harness-home-resolver` | 一个 home 解析器；XDG 被拒 | 当前 `dsh-home-paths` 代码/README | 该 Note 仍 active；检查是否有第二个 resolver |

**读法**：归档 Note 告诉你“当时为什么这样”；活文件告诉你“现在是什么”。如果两者冲突，先修当前权威或新增 Note，不要改归档。归档 Note 的 `Status`/`Archived` 日期不是决定生效日期；真正的生效点在该变更的 commit/PR。

### 5.5 归档技能中被质疑的校准例子

`【未验证】` 当前归档技能把 `archived/simplification/2026-07-04-drop-image-content-block` 列为“应保留 active，直到多模态支持落地”的校准例子（`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:31-52@687f282e`），但该 Note 在源提交中已经位于 `archived/` 且 `Archived: 2026-08-19`，而 `read_image`/多模态 Note 已让 `ImageBlock` 回归（`deepseek-harness/.agents/notes/archived/feature/2026-08-10-minimal-read-image-tool.md:10-19@687f282e`）。这可能是“条件满足后归档”的正常结果，也可能是技能示例文字未随归档更新。**不要据此推断归档规则错误**；把它作为审计项交给 Decisions/归档技能维护者确认。

---

来源：deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e
来源：deepseek-harness/.agents/notes/README.md:7-19@687f282e
来源：deepseek-harness/.agents/notes/README.md:36-42@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:13-23@687f282e
来源：deepseek-harness/.rgignore:1-2@687f282e
来源：deepseek-harness/docs/AGENTS.md:15-36@687f282e
来源：deepseek-harness/docs/AGENTS.md:40-41@687f282e
来源：deepseek-harness/docs/AGENTS.md:61-73@687f282e
来源：deepseek-harness/docs/i18n/README.md:34-48@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-committed-artifact-citations.md:7-33@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:1-13@687f282e
来源：deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-30@687f282e
来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:10-10@687f282e

<a id="6"></a>
## 6. 事故复盘：根因、时间线与安全网

### 6.1 何时写 postmortem

`【源规则】` `docs/postmortem/README.md` 的触发条件是：一个已经发生、值得留下“为什么没早发现/为什么安全网没拦住”的事故；不是每个 bug 都需要 postmortem。小事可以只写 `bug-fix` Note；但如果事故暴露了跨路径的失效模式、测试拓扑缺陷、工具/平台假设错误，或需要改变后续做法，就写 postmortem（`deepseek-harness/docs/postmortem/README.md:1-18@687f282e`）。

`【源规则】` postmortem 的命名/编号是 `NNNN-short-title.md`，放在 `docs/postmortem/`；正文是事故叙事，不是决策记录。一个 postmortem 可以链接一个 Agent Note，但不要用 Note 代替时间线。

### 6.2 正文必须包含的推理链

`【源规则】` `docs/postmortem/README.md` 要求每篇 postmortem 先写 **Executive summary**（一个短段：什么坏了、根因的平实说法、为什么安全网没拦住、可复用教训），再展开 Summary / Timeline / Root cause / Guardrails；它是“事后叙事”，不是 Agent Note（`deepseek-harness/docs/postmortem/README.md:1-18@687f282e`）。

`【源实践】` 四篇 postmortem 的共同推理链：

1. **Executive summary**：30 秒能读完的“坏了什么/根因/为何逃过/教训”。
2. **Summary / Impact / Timeline**：谁在什么操作下看到什么；错误/状态/日志/截图；哪些是观察，哪些是推断。
3. **根因 + 机制**：不是“某个调用错了”，而是“为什么这个调用会错、为什么错误会传播/被吞掉”。
4. **安全网分析**：为什么规则/门/测试没有拦住？是测试路径不对、断言太弱、平台差异、错误被静默、还是已知限制未被记录？
5. **Guardrails / 修复**：改哪一层；哪些路径一起修；哪些测试/规则/ADR 被补上；哪些边界保持。
6. **教训/后果**：可复用的检查、必须保留的负向保证、仍存在的限制。

### 6.3 四篇 postmortem 的具体教训

#### 0001：默认导出与影子服务

`【源事实】` ACP 的 `export default` 让 Loader 丢掉插件的 `inject`，同时一个带 trace 的 optional-service 查找跨 shadow boundary 失败；两个独立 bug 共享同一个错误字符串。178 个绿色单元测试和 100% 行覆盖没有发现，因为测试全部通过手工挂载路径，未经过真实 Loader/服务解析路径。修复补了 keyless 的真实 Loader 覆盖，并补上插件导出/optional-service 访问的包规则（`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:1-113@687f282e`）。

可复用规则：

- **100% 行覆盖不证明集成正确**：手挂测试可以绕过 Loader/导出/服务解析。
- **一个错误字符串可能有两个根因**：先相信 trace，再相信漂亮的 shadow 理论；默认导出的一行错误先被找到。
- **Guard 必须在真实入口上生效**：用真实 Loader/进程/发布工件测试，而不只是单元路径。

#### 0002：配置求值位置与快照刷新

`【源事实】` ACP 示例用 `disabled: !!js ...` 想让文件系统插件只在全访问/快照时启用，但 Cordis 只在插件的 `config` 内求值 JavaScript 表达式；入口元数据 `disabled` 收到的是 truthy 的表达式对象，所以文件系统栈在所有模式下都被禁用。快照刷新又把 `UNKNOWN_TOOL` 结果当成新的期望输出，于是套件“通过”只是在确定性回放回归。修复改用显式文件系统 overlay，并加静态配置守卫与快照结果守卫（`deepseek-harness/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:1-47@687f282e`）。

可复用规则：

- **语法合法不等于在该位置被求值**：入口元数据/插件 config 的插值范围必须文档化并用真实 Loader 验证。
- **快照刷新是 fixture 生产，不是正确性评审**：缺失已注册工具这类语义不可能，必须有独立断言，不能靠“输出与刷新后的 fixture 一致”。
- **权限控制只描述它真正治理的能力**：运行时 bash 沙箱/审批预设不能安全地挂载/卸载/限制进程内文件系统栈；组合期访问要用 overlay。
- **一个症状可能有两个独立缺陷**：配置求值位置 + 快照守卫缺失；只修一个仍会失败。

#### 0003：GUI 反馈回路与人工验证

`【源事实】` Web Agent 改了 GUI 源码，却不知道哪个 URL/进程承载它的 Session：先把验收交还给用户，再把裸 Vite 的 HTTP 200 当成功（页面因缺 `window.__DSH_BOOT__` 白屏），最后在另一个端口验证替代 `dsh web` 服务器，而原 3081 页面其实已经加载了重建产物。修复让当前 URL/运行模式对模型可见/可查询，standalone Vite 在 listen 前拒绝，并用外部状态验证生产 refresh 与开发 HMR；回归测试还必须能因报告机制失败（timeout 杀死 Vite 不能满足非零退出断言）（`deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:1-53@687f282e`）。

可复用规则：

- **验证对象要对**：验证一个替代服务/页面，不等于验证用户实际使用的 GUI/端口/进程；必须探测原 URL。
- **HTTP 200 / build success / boot manifest 是不同事实**：bare Vite 返回 200 仍可能白屏；acceptance 必须命名 exact origin 并外部观察改动。
- **隐藏运行前提要模型可见**：启动模式/URL/进程是应用上下文，不是口头知识。
- **回归测试必须能因报告机制失败**：timeout 杀进程不等于 fail-fast；post-exit 端口可用不证明端口从未绑定。
- **长运行进程用受管生命周期**，不要用 shell `&` 绕过 job 身份/完成通知/清理。

#### 0004：部分通知、子进程失败与错误分类

`【源事实】` Landlock partial-enforcement notice 与真正的 launcher failure 共享 `landlock-run:` 前缀；旧实现把“共享前缀 + 任意非零子进程退出”当成 launcher failure，于是 ripgrep 的 no-match exit 1、非法 pattern exit 2、甚至子进程自选的 exit 125 都被误报为 `SANDBOX_UNAVAILABLE`。文件系统搜索又把结构化的 `SandboxUnavailableError` 替换成通用的 `SEARCH_FAILED`，丢失了下层错误。修复把分类改为“精确 informational 排除后、status-gated fatal evidence”，并保留结构化错误/组装路径（`deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:1-55@687f282e`）。

可复用规则：

- **共享前缀不是协议**：进程归因要用独立证据的合取（允许的退出码 + 逐行 fatal signature + 精确 informational 排除）。
- **informational 与 fatal 可共享命名空间**：排除必须精确/窄；未知 fatal 行要保持 fail-closed。
- **下层结构化错误必须保留**：adapter 不要把 `SANDBOX_UNAVAILABLE` 一类结构化失败替换成自己的通用类别。
- **部分通知是不完整证据**：不能把“部分执行/部分限制”直接映射为整体成功。
- **平台行为需要确定性 fake + 一条组装产品路径**；自跳过的真实内核测试不能单独承担回归。

### 6.4 操作卡：写/审 postmortem

| 项 | 内容 |
|---|---|
| 前置 | 有可复现/可观察的事故；有日志、commit、测试、截图或用户报告；知道受影响版本 |
| 步骤 1 | 按时间线记录观察；给每条观察标来源（日志/截图/测试/推断） |
| 步骤 2 | 写根因机制；用“如果去掉这个条件，事故是否还发生”检验因果链 |
| 步骤 3 | 写安全网分析：哪条规则/门/测试应该拦、为什么没拦、缺口在哪一层 |
| 步骤 4 | 写修复/决定：改哪层、哪些路径、哪些负向保证；链接 Agent Note |
| 步骤 5 | 写教训/限制：可复用检查、仍存在的盲区、后续观察 |
| 责任角色 | 事故处理者/作者；评审者检查因果与证据；领域 owner 检查修复边界 |
| 完成信号 | 第三人能按时间线复述“发生了什么/为什么没拦住/改了什么/还剩什么风险” |
| 失败处理 | 证据不足：显式写“未知”，不要编造因果；不要把“相关”当“根因”；修复未落地：标 `proposed`/后续 Note |
| 例外 | 纯用户操作错误/无系统缺陷可以只写支持记录；安全/隐私敏感细节要脱敏 |
| 证据限制 | 事后叙事有 hindsight bias；日志可能不完整；平台差异可能无法复现；postmortem 不是运行时证明 |

---

来源：deepseek-harness/docs/postmortem/README.md:1-18@687f282e
来源：deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:1-113@687f282e
来源：deepseek-harness/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:1-47@687f282e
来源：deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:1-53@687f282e
来源：deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:1-55@687f282e
来源：deepseek-harness/docs/AGENTS.md:7-7@687f282e
来源：deepseek-harness/docs/testing.md:1-55@687f282e
来源：deepseek-harness/.agents/notes/archived/testing/2026-09-27-web-lane-assertions-name-their-input-state.md:3-44@687f282e
来源：deepseek-harness/.agents/notes/archived/testing/2026-09-08-ci-completion-observations.md:3-45@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-windows-open-through-shell-resolution.md:5-44@687f282e

<a id="7"></a>
## 7. 验证证据的层次：不要用一个观察代替另一个

### 7.1 核心区分

`【源实践】` 事故与测试 Note 反复出现同一组区分：

| 观察 | 能证明 | 不能证明 |
|---|---|---|
| HTTP 202 / 请求被接受 | 服务收到了请求 | 会话已创建、持久化已完成 |
| UI 投影/乐观更新 | 客户端显示了某状态 | 服务端 durable 状态一致 |
| 子进程已启动 | 进程存在 | 请求已被处理、工具已执行 |
| 日志出现某行 | 代码走到了该分支 | 整体操作成功 |
| 快照文本相等 | 当前视图与记录一致 | 视图处于正确输入状态 |
| 测试套件绿色 | 已覆盖的断言通过 | 未覆盖路径/真实入口/生产行为 |
| 文档声明 | 作者意图/当前描述 | 运行时行为/自动保证 |

`【源实践】` CI 完成观察 Note 的原文判断：“HTTP acceptance, projected UI state, process startup, and durable completion are separate observations. Tests need an explicit completion condition and controls that prevent an intermediate state from satisfying it.”（`deepseek-harness/.agents/notes/archived/testing/2026-09-08-ci-completion-observations.md:3-10@687f282e`）

### 7.2 真实入口与负向控制

`【源事实】` 0002 的教训是：测试经过的路径/配置必须与真实 Loader 的求值位置一致；快照刷新不能替代语义断言。真实 Loader boot 才发现每个 `disabled` 仍是表达式对象、每个文件系统 fiber 都不存在。

`【迁移设计】` 每条安全/策略断言至少问：

1. 它是否经过真实入口（public API/CLI/HTTP/tool dispatch），而不是测试专用的旁路？
2. 如果去掉保护，测试是否会失败？如果不会，它不是 guard 测试。
3. 如果保护错误地拒绝合法输入，是否有测试能发现？
4. 失败时是否保留原始错误/字段，而不是变成“未知错误”？

### 7.3 状态命名与快照

`【源事实】` Web lane 的三个场景在捕获 aria 区域时，把“行被 hover”“Tooltip anchor 被 focus”“Host read 发布的值”当作隐含状态；指针位置/异步读决定捕获到哪个状态。修复让每个捕获自己建立输入状态（hover/focus/等待值），而不是靠“快照相等”或 timeout（`deepseek-harness/.agents/notes/archived/testing/2026-09-27-web-lane-assertions-name-their-input-state.md:3-44@687f282e`）。

可复用规则：

- 快照/golden 相等只证明“与记录一致”，不证明“处于正确状态”；
- timeout 只是等待边界，不是状态建立；
- 捕获要显式建立 hover/focus/滚动/读完成等前置状态；
- 刷新 volatile 字段时不要用“暂停时钟 + 原样刷新”掩盖真实变化；要证明视图文字未被修改；
- 不要复制 vendored/fixture 快照当“源真相”；从当前生成器/源组件重新生成，并验证差异。

### 7.4 进程归因、结构化错误与超时

`【源事实】` 0004 的修复把进程归因做成合取：允许的退出码 + 逐行 fatal signature + 精确 informational 排除；同时保留原始信号/结构化错误，避免 adapter 把下层 `SANDBOX_UNAVAILABLE` 替换成自己的通用类别。测试要区分 timeout、signal、exit status；killed child 不能报成 status mismatch（`deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:1-55@687f282e`；`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:79-98@687f282e`）。

`【源实践】` 进程边界不要 `throw new Error(error.message)` 丢掉 `code`/`signal`/`stderr`/`cause`；结构化字段是后续归因的证据。快照编解码器遇到未知工具块要保留/报 `UNKNOWN_TOOL`，而不是静默降级（`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:787-806@687f282e` 与 `deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1197-1199@687f282e`）。

### 7.5 确定性 fake 与真实装配路径

`【源事实】` Cordis 配置解析 Note 说明了为什么只靠“确定性 fake”不够：假对象可以证明遍历顺序/规则，但不能证明注入、默认值合并、未知 provider 存活、用户数组中未知项的顺序。测试必须同时覆盖“确定性 fake + 真实 `Context`/装配路径”（`deepseek-harness/scripts/verify-cordis-config.ts:508-557@687f282e`）。另一个相关 Note 记录：fake clock 不拦截 `node:timers/promises`，所以替换内置 timer 会失去确定性测试（`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:1-10@687f282e`）。

可复用规则：

- fake 时间/传输/文件系统用于确定性和边界；
- 真实装配/合并/插件注册用于发现“fake 没模拟到的集成语义”；
- 两者不是二选一；只测 fake 会漏 DI/默认值/未知字段，只测真实会慢/不稳。

### 7.6 世界验证

`【源规则】` 测试文档要求：

- 用户可见的 Web UI 变更必须真正驱动产品世界；Web browser snapshot 在 Chromium 比较所有 session-driven `snapshots/web/` 与 UI-only expected 输出，model/reasoning picker 也在 WebKit 运行；CI 强制只读 replay，record/refresh 只在本地进行，且每个 diff 都要审查。
- e2e 断言要重新运行命令或从外部重读文件；对 Agent 自己输出的 keyword probe 可能让作弊 Agent 通过；未触及文件应保持字节一致。
- “真实入口”指发布工件：包 `bin` 在 plain `node` 下运行 built `lib/bin.js`；真正缺失的配置应以非零退出。
- 行覆盖是必要不充分：它证明行跑过，不证明功能按发布行为工作。

（`deepseek-harness/docs/testing.md:1-55@687f282e`）

`【源事实】` 0003 的 GUI 反馈回路还说明：验证对象必须是用户实际使用的原 URL/端口/进程；HTTP 200、build 成功和 boot manifest 是不同事实，bare Vite 返回 200 仍可能白屏；真实浏览器、HTTP、进程和 session-log 的外部观察承担 acceptance。

### 7.7 操作卡：为一条断言选择证据

| 项 | 内容 |
|---|---|
| 前置 | 明确要证明的观察（接受/完成/状态/用户可见/进程归因） |
| 步骤 1 | 写出断言对应的真实入口和输入状态；不要用旁路 |
| 步骤 2 | 加负向控制：坏输入/去掉保护/超时/取消，至少一种应失败 |
| 步骤 3 | 如果涉及异步完成：等待明确事件/状态，不用 timeout 当条件 |
| 步骤 4 | 如果涉及进程/跨边界：保留结构化错误，做多观察合取 |
| 步骤 5 | 如果涉及快照：显式建立状态；刷新 volatile；验证非目标文本不变 |
| 步骤 6 | 如果涉及 UI：真实浏览器/手工/截图；区分视觉回归与逻辑断言 |
| 责任角色 | 测试作者；评审者检查“这个测试能不能失败”；CI 执行 |
| 完成信号 | 失败模式可复现；负向控制确实失败；正向路径在真实入口通过 |
| 失败处理 | 测试只能证明弱观察：改断言/加观察点；无法稳定：先隔离/记录限制，不要用 sleep 掩盖 |
| 例外 | 纯文档/格式变更不需要世界验证；静态类型/格式门可作为补充 |
| 证据限制 | 测试环境与生产不同；控制也可能错；没有测试能证明“所有路径” |

---

来源：deepseek-harness/docs/testing.md:1-55@687f282e
来源：deepseek-harness/.agents/notes/archived/testing/2026-09-27-web-lane-assertions-name-their-input-state.md:3-44@687f282e
来源：deepseek-harness/.agents/notes/archived/testing/2026-09-08-ci-completion-observations.md:3-45@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-windows-open-through-shell-resolution.md:5-44@687f282e
来源：deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:7-63@687f282e
来源：deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:97-125@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-19@687f282e
来源：deepseek-harness/scripts/verify-cordis-config.ts:508-557@687f282e
来源：deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:787-806@687f282e
来源：deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1197-1199@687f282e
来源：deepseek-harness/packages/AGENTS.md:5-9@687f282e
来源：deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:79-106@687f282e

<a id="8"></a>
## 8. 简化调查：先证明行为，再证明“更少”

### 8.1 调查的触发与目标

`【源规则】` `dsh-find-simplifications` 的目标是消除不必要的复杂度，不是追求最少文件/最少行。它要求：

- 读 owning docs、历史、代码和测试；
- 产出一份覆盖主要领域的 inventory；
- 把候选按领域/类型分类，给出验证与风险；
- 不要用预设的“目标数量”或“必须删除 N 个机制”；
- 历史模式只是假设，不是命令（`deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:8-61@687f282e`；`deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-43@687f282e`）。

`【源规则】` 2026-09-19 的调查 Note 明确否决了“按 checklist 逐项打勾”“按文件数/行数选目标”“先删再验证”的做法；它要求按领域读、按行为验证、保留未知（`deepseek-harness/.agents/notes/archived/process/2026-09-19-evidence-led-simplification-surveys.md:7-45@687f282e`）。

来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:8-61@687f282e
来源：deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-45@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-19-evidence-led-simplification-surveys.md:7-45@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:9-30@687f282e
来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:7-47@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:3-37@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:11-36@687f282e

<a id="8-2"></a>
### 8.2 候选的六个问题

`【源实践】` 在判断“能否删/并/换”之前，逐个问：

1. **完整效果路径**：这个符号/包/配置真的进入了执行路径吗？构造器、DI、tree-shaking、canonical API、动态 import 都可能让“静态引用”不等于“运行效果”。
2. **消费者区分**：消费者是否依赖 `undefined` vs 空值、顺序、错误类型、同步/异步、取消语义？如果两个函数看起来一样但消费者区分，不能合并。
3. **行为减少是否明确**：删除能力会失去什么？是否要让空目录报错、去掉负向前瞻/XOR 限制、允许可变配置？这些是行为变化，不是“清理”。
4. **能否改为派生**：读时从当前数据计算，是否比维护计数/时间戳/数组更便宜？新增的冗余状态会成为第二个真源。
5. **组合是否被误当政策**：一个一次性插件/bundle 的便利，是否被搬到共享层，给无关表面增加风险？
6. **维护成本**：手写实现是否比 maintained dependency 更贵？但“净删除/单一机制”不等于必须换；测试确定性、安全边界、平台行为都可能否决。

### 8.3 删除包/能力的证据链

`【源事实】` E2B provider 的移除 Note 展示了完整证据链：列出 provider/入口/调用点；说明没有已知生产消费者但外部采用未知；说明能力损失（远程 filesystem/subprocess/PTY/LSP）；保留共享接口与 POSIX SSH 路径；给出重新引入条件（具体消费者、共享坐标、有界传输/独立控制/精确关闭/受管取消）；明确移除不等于 E2B 不能支持或不代表发布包无外部用户（`deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:7-47@687f282e`）。

`【源事实】` 删除 SDK project toolchain 的 Note 说明：一个未发布、没有消费者的开发者项目工具链（`create-sdk`、`dsh-scripts`、`dsh-helper`、`dsh-telemetry`）被整体删除，没有替代/兼容层；独立使用的 runtime SDK 协议/客户端/JSON-RPC server 保留并移动到 `packages/sdk/`，npm 名与 wire 行为不变。重新引入工具链需要真实消费者和基于该消费者工作流的新提案，不会默认复活旧包/旧格式（`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:5-42@687f282e`）。

### 8.4 “不要预拆分”的架构理由

`【源事实】` 能力接缝 Note 的规则是：三角色（Service Definition / Service Provider / Consumer）通常分开包，但**不强制**；当角色确实是一个关注点时，可以折叠。LLM seam 把 Definition 与 Consumer 折进 `dsh-llm`；只有出现第二个 provider/consumer 或独立演化需求时才拆。预拆分会产生包、tsconfig、README、注入 wiring 的固定成本（`deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:11-36@687f282e`）。

`【源事实】` 把 compaction 包拆分的提案被否决，原因是 `ctx.compaction` 已经持有 seam，消费者是 loop，拆包会重新导出类型边界且需要实测运行时调用次数；后来按 seam 落地并删除旧包（`deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:3-37@687f282e`）。

`【迁移设计】` 不要为了“目录对称”预拆包；先证明两个角色以不同速率变化、或存在第二个实现者。一个 provider + 一个 consumer 先留在一个包里，等第二个出现再拆。

### 8.5 操作卡：简化调查

| 项 | 内容 |
|---|---|
| 前置 | 读 owning docs、历史、测试；建立 inventory；不设删除数量目标 |
| 步骤 1 | 按领域列出候选（重复实现/死代码/过度抽象/重复状态/依赖替换/测试重复） |
| 步骤 2 | 对每个候选走 8.2 六问；标“证据充分/需验证/不可行/保留” |
| 步骤 3 | 对“证据充分”的候选写行为变化、能力损失、受保护义务、验证计划 |
| 步骤 4 | 小批量落地：一个机制/一个 seam；每批后跑相关测试/类型/构建；不要一次性大爆炸 |
| 步骤 5 | 记录未验证/动态 import/可选插件边界；发现更多工作就报告，不隐藏 |
| 责任角色 | 调查者；领域 owner 确认行为/所有权；评审者检查证据链 |
| 完成信号 | 每个删除/合并都有“效果路径 + 行为变化 + 验证”；没有把“看起来少”当证据 |
| 失败处理 | 测试失败：回退该批，保留候选与证据；无法确定：标未知，不删除；动态消费者：用运行时/集成测试而非 grep |
| 例外 | 纯死代码/未引用文件在完整搜索后可快速删；仍要记录搜索范围 |
| 证据限制 | 静态搜索会漏动态 import/运行时字符串；测试可能没覆盖被删路径；调查者可能带着“想删”的偏见 |

<a id="8-6"></a>
### 8.6 依赖替换的额外门槛

`【源规则】` 依赖政策（`implemented/process/2026-07-26-dependencies-over-hand-rolling.md:9-34@687f282e`）要求：

- 优先使用 maintained dependency，而不是手写同类基础设施；TUI 等需要边界方言/快照稳定性的场景可以例外；
- 替换必须带来净删除（stdlib/维护代码），不能只是把代码搬进依赖；
- 一行能解决的内置/标准库优先；不要为一行的 await 引入包；
- 安全/平台/许可证是正当例外；记录范围；
- 被否决的替换（如 NIH 审计的 16 项）分组记录，未来提案必须先击败记录的理由；
- 不要为了“单一机制”重复依赖已有的 `check`/`staging` 控制流。

`【源事实】` 内置 `node:timers/promises` 替换手写 sleep 的提案被否决，因为 vitest fake clock 不拦截该 builtin，换取约十行删除却失去确定性测试；这是“依赖/内置替换必须验证测试能力”的反例（`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:1-10@687f282e`）。

---

<a id="9"></a>
## 9. 性能与预算：端点、分布、控制和棘轮

### 9.1 先定义“对谁快”

`【源事实】` Session open 性能门禁 Note 的做法：

- 先测用户可感知的端点（session open → 首屏/可用），而不是某个内部函数；
- 用分布/分位数，不用单次样本；
- 区分冷/热、首次/重复、不同 fixture；
- 用正/负控制证明测量能区分真实成本；
- 设定预算并在合法改进后收紧（ratchet），防止回退；
- 记录测量限制（CI 噪声、机器差异、缓存、fixture 代表性）（`deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:7-63,97-125@687f282e`）。

`【源事实】` 双发布安装布局的 work budget Note 把“工作量”限制为可计数的图操作/文件操作，而不是墙钟时间；这避免机器速度差异，但需要证明计数与真实成本相关（`deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:7-30@687f282e`）。

`【源事实】` lossless build speedup Note 要求输出字节不变；否则“更快”可能是删除了必要内容（`deepseek-harness/.agents/notes/implemented/process/2026-10-11-lossless-build-speedups.md:7-30@687f282e`）。

### 9.2 操作卡

| 项 | 内容 |
|---|---|
| 前置 | 明确用户/系统端点；有基线；知道测量环境 |
| 步骤 1 | 先跑基线，记录分布/分位数/样本数；不要只跑一次 |
| 步骤 2 | 加正/负控制：已知成本的输入应显示成本；无操作输入应接近零 |
| 步骤 3 | 改一处，重测同一端点；记录差异与噪声 |
| 步骤 4 | 若改进成立：收紧预算/ratchet；若回退：回滚或解释 |
| 步骤 5 | 记录限制与未覆盖场景（内存、冷启动、跨平台、真实用户） |
| 责任角色 | 性能作者；评审者检查端点/控制/预算是否合理；CI 跑门禁 |
| 完成信号 | 同一端点的分布改进可重复；控制有效；预算更新有理由 |
| 失败处理 | 噪声大：增加样本/固定环境/改用工作计数；预算不合理：先修测量再改预算；不要为过门禁而放宽阈值 |
| 例外 | 纯构建时间优化可只看墙钟，但要固定环境；安全/正确性优先于速度 |
| 证据限制 | 基准环境不等于生产；缓存/预热会改变结果；预算会过时；工作计数不一定线性对应真实成本 |

---

来源：deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:7-63@687f282e
来源：deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:97-125@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:5-50@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-11-lossless-build-speedups.md:5-30@687f282e
来源：deepseek-harness/docs/testing.md:1-55@687f282e

<a id="10"></a>
## 10. 移除与重新引入

### 10.1 移除 Note 必须保留的内容

`【源规则】` 删除一个能力/文件/路径时，Note 必须保留：

- 原始动机（为什么曾经存在）；
- 为什么现在不再成立（没有消费者/被替代/成本大于收益/平台消失）；
- 不完全删除的替代方案；
- 失去了什么能力；
- 重新引入的条件；
- 完整缺席的验证（搜索/测试/构建/文档）。

来源：`deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:15-20@687f282e`；`deepseek-harness/.agents/notes/README.md:44-52@687f282e`。
来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:15-22@687f282e
来源：deepseek-harness/.agents/notes/README.md:44-52@687f282e
来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:24-38@687f282e
来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:7-47@687f282e
来源：deepseek-harness/.agents/notes/implemented/simplification/2026-07-23-acp-automation-only-protocol.md:5-57@687f282e
来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:5-30@687f282e
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-minimal-read-image-tool.md:10-19@687f282e
来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:3-37@687f282e
来源：deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:31-31@687f282e

`【源规则】` 如果移除只限一个 transport/default/implementation，必须明确范围，不能声称全局缺席；未受影响的部分保留其现有记录。测试如果只是描述被删行为，应删除/改写为“缺席验证”，而不是继续把旧行为当契约（`deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:15-22@687f282e`）。

### 10.2 重新引入

`【源实践】` 重新引入不是“把代码加回来”，而是：

1. 检查旧 Note 的条件是否真的满足（不是“有人想要”）；
2. 说明为什么旧理由不再成立或旧理由被新证据击败；
3. 选择最小路径：先恢复能力/消费者，再恢复优化/扩展；
4. 如果一个类型回归，所有适配器/压缩/序列化路径必须一起支持，不能回到“静默丢弃”；
5. 更新当前权威/文档；旧 Note 保持历史，不修改。

`【源事实】` `ImageBlock` 的案例：删除时写清“若槽位回归，保留类型但把每个静默跳过改成显式拒绝”；后来 `read_image`/多模态让 `ImageBlock` 回归，Note 归档。这里的“重新引入”是协调的多包改动，不是单点加回（`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:5-30@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-minimal-read-image-tool.md:10-19@687f282e`）。

`【源事实】` E2B provider 移除 Note 保留了远程 filesystem/subprocess/PTY/LSP 能力损失、共享接口/POSIX SSH 剩余路径和“具体消费者 + 共享坐标 + 有界传输/独立控制 + 精确关闭/受管取消”的重新引入条件；ACP 只做自动化/文件 I/O 的 Note 保留“不做交互式”的边界（`deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:7-47@687f282e`；`deepseek-harness/.agents/notes/implemented/simplification/2026-07-23-acp-automation-only-protocol.md:5-57@687f282e`）。

### 10.3 操作卡

| 项 | 内容 |
|---|---|
| 前置 | 确认要删的能力/路径；列出所有消费者/入口/文档/测试/fixture |
| 步骤 1 | 写 Note：原动机、失效理由、替代方案、能力损失、重新引入条件、缺席验证 |
| 步骤 2 | 删除代码/配置/文档/测试；更新所有引用；不要留下死类型/死别名/兼容 shim（除非明确迁移期） |
| 步骤 3 | 用精确搜索/构建/测试证明缺席；区分“未找到”与“证明不存在” |
| 步骤 4 | 如果部分移除：写清范围；未移除部分的当前权威保留 |
| 步骤 5 | 归档 Note 前确认重新引入条件仍可读；若能力已回归，按归档规则冻结 |
| 责任角色 | 删除者；领域 owner 确认能力损失；评审者检查缺席证据 |
| 完成信号 | 无残留引用；构建/测试通过；Note 能回答“为什么删/何时可回” |
| 失败处理 | 发现动态消费者/未覆盖路径：恢复并补证据；不能证明缺席：保留 Note 为 proposed/记录未知 |
| 例外 | 纯未使用文件可快速删；仍需完整搜索并记录范围 |
| 证据限制 | 动态 import/配置字符串/外部消费者可能搜不到；测试通过不等于能力真的无人使用；重新引入条件可能过时 |

---

<a id="11"></a>
## 11. 人为判断与工具边界

### 11.1 哪些事情工具不能证明

`【源事实】` 源仓库自己反复标注了门禁的边界：

- 文档/翻译门禁检查字节/配对/章节 hash，不判断译文是否等义；翻译语义仍由评审负责（`deepseek-harness/docs/i18n/README.md:44-48@687f282e`）。
- `verify-skill-invocation-metadata` 只枚举带 `agents/openai.yaml` 的技能；没有该文件的技能被跳过，干净检出可能报 0 对并通过。它不能证明所有技能都已对齐；缺元数据本身应列为审计项（`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:24-35,107-122@687f282e`）。
- Session reader 兼容性评审：检查器验证决策/schema，但“cannot prove explanation matches runtime”；文档不能替代运行时验证（`deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:15-19@687f282e`）。
- 归档校验只证明字节/清单/路径/必需文件，不证明“低价值”判断正确，也不检查归档出站链接（`deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e`）。
- 没有门拒绝设计序号/模糊来源；这些是 prose review 的责任（`deepseek-harness/.agents/notes/archived/process/2026-08-09-committed-artifact-citations.md:28-33@687f282e`）。
- 没有门分类 trivial/non-trivial；评审负责（`deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:30-40@687f282e`）。

`【源事实】` 人类评审提案（`proposed/process/2026-07-13-human-review-skill-maintenance.md`）明确指出：两位独立评审者、私有工具、由 operator 晋升；这些都不是自动化保证。其信任限制包括：同一人不是两个信任域；公开工件不能证明私有工件仍在；没有本地验证提示；需要访问/API key（`deepseek-harness/.agents/notes/proposed/process/2026-07-13-human-review-skill-maintenance.md:9,41-85@687f282e`）。

### 11.2 迁移时必须写清的“保证级别”

`【迁移设计】` 对每个治理机制，在安装后的项目中标注以下之一：

| 级别 | 含义 | 例子 |
|---|---|---|
| Automatic gate | 机器在每次提交/CI 上执行，失败会阻止合并 | 源仓库已有脚本的格式/分类/链接/归档字节/翻译配对（安装后需接入才算） |
| Automatic observation | 机器记录/报告，但不阻止 | 性能趋势、覆盖率报告、审计输出 |
| Review-only | 人按检查表评审，没有机器兜底 | 持久理据判定、备选真实性、归档低价值判断、根因充分性、译文等义 |
| Recommendation | 文档建议，尚未落地 | human-review 双评审、某些迁移期流程 |
| Unknown | 未验证/未实现 | 任何“计划中”的自动支持 |

`【源规则/迁移设计】` 不要把 Review-only 写成“门禁”。C2 的注意事项：评审程序存在不等于自动保证；如果安装后的项目没有对应工具/CI，必须标 `planned` 或 `review-only`，不能声称已经自动执行；**但缺少工具不是义务不适用**——机制仍然适用，只是保证级别降低，必须补等价评审或明确未知。

### 11.3 操作卡：评审一个语义判断

| 项 | 内容 |
|---|---|
| 前置 | 知道该判断是否有机器检查；知道证据来源 |
| 步骤 1 | 问：如果这个判断错了，什么会失败？有没有反例/负向控制？ |
| 步骤 2 | 检查证据是否来自真实入口/当前版本/已提交工件 |
| 步骤 3 | 检查是否把“相关”当“根因”、把“格式正确”当“内容正确” |
| 步骤 4 | 在 PR/Note 中写清保证级别和剩余风险 |
| 责任角色 | 评审者/领域 owner；工具只提供机械信号 |
| 完成信号 | 判断可被第三人复核；保证级别诚实；未知被保留 |
| 失败处理 | 证据不足：要求补；无法补：标 unknown，不要用“已审查”掩盖 |
| 例外 | 紧急安全修复可先合入，但随后补证据 |
| 证据限制 | 评审者可能疲劳/偏见；同一人重复审查不是独立；工具可能漏报 |

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:30-40@687f282e
来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:8-8@687f282e
来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-38@687f282e
来源：deepseek-harness/docs/i18n/README.md:44-48@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:15-19@687f282e
来源：deepseek-harness/.agents/notes/proposed/process/2026-07-13-human-review-skill-maintenance.md:9-85@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-committed-artifact-citations.md:28-33@687f282e
来源：deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e
来源：deepseek-harness/docs/postmortem/README.md:1-18@687f282e

<a id="12"></a>
## 12. 迁移操作清单（按场景）

### 12.1 新变更

1. 读当前 `AGENTS.md`、领域 `docs/AGENTS.md`、`.agents/notes/README.md`、同主题活 Note/历史。
2. 用 1.1 判断改动是否承载持久决策理据（非平凡判定表只是信号）；不确定时按需要 Note 处理。
3. 写 Note（1.5 操作卡）；同时写代码/测试。
4. 分类/命名/配对；运行格式/分类/链接检查。
5. 评审：备选是否真实、代价是否完整、永久边界是否写清、验证是否分层。
6. 合并；若取代旧 Note：更新/归档按 Decisions 域流程。

### 12.2 否决一个提案

1. 搜索 `rejected/`、归档、历史模式。
2. 写清提案、备选、否决理由、证据、适用范围。
3. 若在实现后否决：写清哪条前提被什么证据推翻。
4. 留在 `rejected/`；未来提案必须先击败理由。

### 12.3 事故

1. 判断 postmortem vs bug-fix Note（6.1）。
2. 记录时间线/观察/来源。
3. 写根因机制；做“去掉条件是否仍发生”的检验。
4. 写安全网缺口；修在失败层；加负向控制。
5. 链接 Note；更新当前权威；保留未知/限制。

### 12.4 简化/依赖

1. 读 owner/历史/测试；建 inventory；不设数量目标。
2. 走 8.2 六问；标证据级别。
3. 写行为变化/能力损失/受保护义务/验证。
4. 小批量落地；每批验证；记录未知。
5. 依赖替换额外满足净删除/维护成本/测试确定性/安全边界。

### 12.5 移除/重新引入

1. 写移除 Note（10.1 六项）。
2. 删除并清引用；证明缺席。
3. 若回归：检查条件、最小路径、所有适配器一起支持；更新当前权威；旧 Note 冻结。

### 12.6 归档

1. 确认 `implemented` 完整三元组；判断是否低价值/仍需 active（5.1）。
2. 归档技能移动 + manifest hash；同一 PR 更新引用。
3. 运行归档/链接校验；不编辑归档。
4. 活文档指向当前权威；读法见 5.4。

### 12.7 一页检查表

- [ ] 这个改动是否承载持久决策理据？理由是什么？
- [ ] Note 是否与代码同一变更？
- [ ] `Problem` 是否描述可观察失败，而不是方案？
- [ ] `Decision` 是否写清边界/所有权/负向保证？
- [ ] `Alternatives` 是否至少一个真实备选，且理由可检验？
- [ ] `Consequences` 是否同时写成本和收益？
- [ ] 验证是否区分已运行/计划/无法观察？
- [ ] 是否引用已提交工件，而不是工作区/相对序号？
- [ ] 是否更新/取代了旧 Note，而不是制造第二权威？
- [ ] 归档是否冻结、manifest 是否由工具生成、链接是否指向当前权威？
- [ ] 是否把 review-only 误写成 automatic gate？

---

<a id="13"></a>
## 13. 未决问题与证据限制

1. **归档技能校准例子**：`drop-image-content-block` 已被归档，但技能仍以“keep until multimodal support lands”作为 active 校准；需 Decisions/归档技能维护者确认是示例过时还是条件已满足（见 5.5）。
2. **postmortem 根因**：本次只读正文，没有复现 0001-0004 的运行环境；根因链是源作者的叙事，不是本报告独立验证的运行时事实。
3. **当前门禁清单**：格式/分类/归档/链接/翻译配对脚本已读；完整 CI 触发条件、pre-push 组合、失败策略属于 Automation/Release 域，未逐项验证。
4. **翻译语义**：只读了 `docs/i18n/README.md` 的规则与配对脚本；没有逐篇检查中英等义；Documentation 域负责。
5. **human-review 提案**：`proposed/process/2026-07-13-human-review-skill-maintenance.md` 是提案，不是已落地自动保证；其双评审/私有工具/晋升流程需 Decisions/AgentFlows 确认状态。
6. **当前权威映射**：5.4 的多数映射来自活文件文本，不是每条都有显式 `Superseded by` 链；审计应逐条确认，尤其是 2026-08/09 的 process 归档。
7. **归档清单**：`archived/manifest.json` 有 2777 行；本次只做了定向检索，没有逐项核对所有 hash/路径。
8. **0004 平台行为**：Landlock/libc/子进程行为没有在本机复现；结论来自源 postmortem。
9. **简化调查**：没有运行完整测试/构建；简化候选的“行为不变”只到静态证据层，安装后项目必须自行验证。
10. **来源范围**：1272 个英文 Note/README 候选中，本次只语义阅读了约 30-40 个代表文件；其余按目录/计数登记为未检查，不能把“清单”当“覆盖”。详见 `research/rationale-coverage.json`。

---

<a id="14"></a>
## 14. 交叉域接口（给集成者）

| 邻域 | 本域提供 | 需要邻域提供/确认 |
|---|---|---|
| Decisions | 归档/保留的**理由判据**、否决知识、当前权威映射 | Note 生命周期命令、归档准入/冻结流程、分类/格式操作 |
| Documentation | 具体散文/引用/翻译的**理由与边界** | 当前 prose standard、i18n 配对规则、链接校验命令 |
| Testing | 验证证据分层、postmortem 测试教训 | CI lane、flake 处理、测试命令与预算 |
| Engineering | 简化/依赖/架构所有权的**证据门槛** | 当前架构规则、包边界、构建/测试入口 |
| AgentFlows | 当前权威/指令路由的理由 | 指令加载顺序、AGENTS 层级、跨工具投影 |
| Automation | 哪些检查是自动/评审/未知 | CI 工作流、pre-push、失败策略 |
| Release | 归档/发布/迁移的边界 | 发布流程、changelog、版本兼容 |
| Supply | 依赖替换/维护成本的判据 | 依赖审计、许可证/安全策略 |
| Collaboration | 评审中的语义判断 | PR 模板、review 责任、scope 报告 |

**集成原则**：本域的 reference/JSON 是“理由与判据”的权威；具体命令/CI 接线以邻域活文件为准。不要把本文的“迁移设计”当成源仓库已经自动执行的保证。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `rationale.decision-record-content`：`deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e`
- `rationale.alternatives-and-rejected-knowledge`：`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:25-30@687f282e`
- `rationale.non-trivial-note-policy`：`deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e`
- `rationale.format-classification-and-index`：`deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:9-31@687f282e`、`deepseek-harness/.agents/notes/archived/process/2026-06-20-agent-note-classification.md:7-40@687f282e`、`deepseek-harness/.agents/notes/README.md:7-34@687f282e`、`deepseek-harness/docs/i18n/README.md:9-44@687f282e`、`deepseek-harness/.agents/notes/archived/process/2026-09-23-section-keyed-translation-pairing-records.md:1-29@687f282e`
- `rationale.archive-retention-and-freeze`：`deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:5-45@687f282e`、`deepseek-harness/docs/AGENTS.md:23-29@687f282e`
- `rationale.postmortem-root-cause`：`deepseek-harness/docs/AGENTS.md:7-7@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-08-ci-completion-observations.md:3-45@687f282e`
- `rationale.verification-epistemics`：`deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:7-63@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:97-125@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-19@687f282e`、`deepseek-harness/packages/AGENTS.md:5-9@687f282e`、`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:79-106@687f282e`
- `rationale.simplification-evidence`：`deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-45@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:9-30@687f282e`
- `rationale.dependency-policy`：`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:9-34@687f282e`、`deepseek-harness/AGENTS.md:140-140@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:3-78@687f282e`
- `rationale.performance-evidence`：`deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:5-50@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-10-11-lossless-build-speedups.md:5-30@687f282e`
- `rationale.authority-and-history-routing`：`deepseek-harness/docs/AGENTS.md:15-36@687f282e`、`deepseek-harness/docs/i18n/README.md:34-48@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:1-13@687f282e`、`deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-30@687f282e`
- `rationale.human-judgment-boundary`：`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:8-8@687f282e`、`deepseek-harness/.agents/notes/proposed/process/2026-07-13-human-review-skill-maintenance.md:9-85@687f282e`
