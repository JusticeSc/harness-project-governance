# 决策记录与持久规则治理迁移参考（decisions）

> 源仓：`deepseek-harness`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，只读。
> 引用格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。引用只标实际检查过的范围；未检查的文件列入 `research/decisions-coverage.json` 的 `uninspectedCandidates`。
> 标记约定：**[源规则]** 有明确文字、代码或配置要求；**[迁移设计]** 为让这些要求在采用项目中可执行而设计；**[建议]** 源仓未强制、采用时可降低风险的附加做法。实际顶层检查义务直接来自 AGENTS.md:175，不是由多个案例推导的建议；门禁拓扑仍由采用项目选择。
> 未执行声明：作者阶段未运行源仓任何 build/lint/test；所有 `verification.status` 为 `unexecuted`，凡“门禁会通过/失败”均来自源码阅读。
> 本域负责：Agent Note 的创建、分类、格式、状态迁移、取代、合并、删除、归档与冻结信任，Postmortem 准入，持久规则写入哪一层及机械门禁偏好，门禁接线。历史政策正文（为什么选择统一格式、为什么冻结）归 rationale 域；文档分层、双语配对归 documentation 域；CI 聚合与 hook 实现归 automation 域。交叉依赖见文末。

## 0. 使用契约与读者入口

这套治理解决的不是“有没有文档”，而是：**一条决策/教训凭什么进入仓库存档，进入后如何保持可检索、可验证、可冻结，以及哪些内容永远不该写下来**。源仓把它拆成四个边界清晰的载体，混用即违约：

| 载体 | 记什么 | 不记什么 | 是否有门禁 |
|---|---|---|---|
| Agent Note（`.agents/notes/`） | 决策的 why、放弃了什么、被否决的替代方案、后果与验证要求 | 迁移计划清单、验收任务清单、实现叙述、当前行为手册 | 分类、格式、归档封印三类机械门禁 |
| Postmortem（`docs/postmortem/`） | 已发生的故障、机制、为什么所有安全网都没拦住、新增护栏 | 设计提案、未发生的假设、教程 | 通用配对门禁；准入、摘要与索引由评审 |
| Defensive pattern（`docs/defensive-patterns/`） | 一类缺陷的规则、评审判断条件与边界 | 类型定义、决策理据 | 无独立门禁；`dsh-code-review` 要求读取 |
| 常驻指令 / 文档（根 `AGENTS.md`、子树 `AGENTS.md`、`docs/`） | 每次会话都需要的命令、一事实一归宿的当前事实 | 长篇理据、历史叙事 | 预算、链接、类型等价、配对等门禁 |

先按触发选入口：

| 触发 | 先读 | 产物 | 完成信号 |
|---|---|---|---|
| 做了一个有长期价值的决策 | M01、M02、M03 | 同 PR 内新增/更新一篇 Agent Note | 分类+格式门禁通过，且 `doc-sync` 绿 |
| 只是机械/局部改动 | M01 | 不新增 Note；更新既有 owner 的事实 | PR 能说明为何豁免 |
| 提案要落地或被否决 | M04 | 文件在生命周期目录间移动并重写 | 状态行与目录一致，骨架重写完成 |
| 新增 Note 前怀疑旧 Note 已被取代 | M05 | 取代审计结论 + 同 PR 归档/保留交叉链接 | 每个候选被判定 full/partial/none |
| 写完后发现事实漂移 | M06 | 原地更新事实，不改决策 | 路径/符号/默认值与代码一致 |
| 想删除、归档或合并旧 Note | M07、M08、M09 | 判决 + 三件套操作 + 封印 | `verify-archived-agent-notes` 通过 |
| 怀疑归档被改 | M10 | 只读审计，报告 seal 变化 | 不修改冻结内容 |
| 线上事故后要留教训 | M11 | Postmortem + 索引 + 护栏链接 | 执行摘要、时间线、根因、护栏、教训齐全 |
| 想把一条规则写进常驻指令 | M12 | 放到唯一归属层并接机械门禁 | 能被检查的规则有门禁；不能检查的说明评审判断 |
| 门禁红了 / 要证明完成 | M13、M14 | 命令与真实输出 | 实际运行结果，不用“应该通过” |

**[源规则]** Agent Note 的单一入口是 `.agents/notes/README.md`；它同时定义位置、命名、分类、格式与归档。子树指令只补充局部规则：`.agents/notes/AGENTS.md` 强制取代审计，`implemented/AGENTS.md` 强制现状维护，`archived/AGENTS.md` 定义冻结边界。`deepseek-harness/.agents/notes/README.md:5-125@687f282e`、`deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e`、`deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e`、`deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e`。

## 机制 ID 索引

下表把展示编号映射到 `knowledge/decisions.json` 的稳定 mechanism ID；每个 ID 同时写在对应小节标题下方。参考锚点用于 `reference` 字段定位。

| 机制 | mechanism ID | 锚点 |
|---|---|---|
| Agent Note 必要性准入 | `decisions-note-necessity` | `#note-necessity` |
| 生命周期、分类与路径 | `decisions-lifecycle-classification` | `#lifecycle-classification` |
| 文件格式门禁 | `decisions-note-format` | `#note-format` |
| 生命周期迁移 | `decisions-lifecycle-transitions` | `#lifecycle-transitions` |
| 取代审计与交叉链接 | `decisions-supersession-audit` | `#supersession-audit` |
| implemented Note 的现状维护 | `decisions-implemented-maintenance` | `#implemented-maintenance` |
| 删除、保留与归档判决 | `decisions-delete-keep-archive` | `#delete-keep-archive` |
| 合并（consolidation） | `decisions-consolidation` | `#consolidation` |
| 归档三件套操作 | `decisions-archive-triplet` | `#archive-triplet` |
| 冻结信任与封印语义 | `decisions-frozen-archive-trust` | `#frozen-trust` |
| Postmortem 准入 | `decisions-postmortem-admission` | `#postmortem-admission` |
| 持久规则准入与机械门禁偏好 | `decisions-durable-rule-admission` | `#durable-rule-admission` |
| 门禁接线与证据链 | `decisions-gate-wiring` | `#gate-wiring` |
| 引用、链接与归档可见性 | `decisions-reference-integrity` | `#references` |

## 1. 领域边界与事实源

**[源规则]** 决策理据不进普通文档：文档层写当前状态，历史留在 commit、PR、Agent Note、postmortem 或专门的 persistence 记录。`docs/AGENTS.md` 的层级表把 Agent Note 定义为“active decision records: the why, what-was-given-up, and required verification”，并明确 `implemented/` 用现在时描述已发布现实；postmortem 是“唯一允许 war-story 叙事的层”。`deepseek-harness/docs/AGENTS.md:15-36@687f282e`、`deepseek-harness/docs/AGENTS.md:40@687f282e`。

**[源规则]** Postmortem 明确“NOT an Agent Note”：Agent Note 记录深思熟虑的设计决策及被否决的替代方案，或提出未来工作；postmortem 是向后看的事故记录。`deepseek-harness/docs/postmortem/README.md:5-9@687f282e`。

**[源规则]** 防御模式目录自身不是决策库；每条规则写成“必须成立什么 + 评审者据什么判断 + 边界”，且 `dsh-code-review` 要求按改动面读取对应页面。`deepseek-harness/docs/defensive-patterns/README.md:5-25@687f282e`。

**[迁移设计]** 采用项目先画一张“载体—触发—门禁—所有者”表（可直接改写上表），再决定是否引入 Agent Note 机制。若项目没有双语、没有归档冻结需求，删掉对应列，不要照搬三件套与封印。

## 2. M01 Agent Note 必要性准入 {#note-necessity}

> 机制 ID：`decisions-note-necessity`

**问题.** 决策理据要么散落在 PR 评论和聊天里而不可检索，要么每件小事都写一篇 Note 把活跃决策集淹没。准入必须同时给出“必须写”“不必写”和“不得写成另一篇”的边界。

**触发.** 任何 PR 声称引入或改变一个有长期价值的决策；或作者正在考虑新增 Note。

**前提.** 已确认代码、测试与现有文档都不能解释该决策的 why；已搜索活跃树中可能拥有同一决策的既有 Note。

**步骤.**
1. 判断是否满足创建标准：只有“代码、测试和现有文档无法解释的持久决策理据”才写。**[源规则]** `deepseek-harness/.agents/notes/README.md:44-48@687f282e`
2. 分流：实质未来工作从 `proposed/` 开始；已做出的决策从 `implemented/` 开始。**[源规则]** 同上。
3. 选择与决策匹配的 class 目录（M02）。
4. 先查是否已有 Note 拥有该决策；有则更新那一篇，不建重复篇。**[源规则]** `deepseek-harness/.agents/notes/README.md:48@687f282e`
5. 机械/局部改动（包括本地 UI 呈现与交互）不写 Note。**[源规则]** `deepseek-harness/.agents/notes/README.md:48@687f282e`、`deepseek-harness/AGENTS.md:155@687f282e`
6. 同一 PR 内完成 Note 变更；不能“后续补文档”。**[源规则]** `deepseek-harness/.agents/notes/README.md:46@687f282e`
7. 绝不把一篇 Note 编辑成另一个决策；反悔时新建 Note 并互相交叉链接，除非旧 Note 之后按合并规则整体合并。**[源规则]** `deepseek-harness/.agents/notes/README.md:48@687f282e`

**责任者.** 改动作者（写与改）、评审者（判断是否真的“代码/测试/文档无法解释”）。

**完成信号.** PR 内 Note 与代码同一 diff；若豁免，PR 描述能指出属机械/局部改动；无重复 owner。

**失败处理.** 发现重复 Note：合并内容到现行 owner 并删除重复篇（需满足 M08 的合并前提）。发现被编辑成相反决策：恢复事实性更新，另建新 Note 并交叉链接。

**例外.**
- 机械/局部编辑豁免，但“实现很小”不能豁免实质性行为决策：局部 bug 修复、性能变化、新能力、实质行为决策即使实现小也不符合删除条件。`deepseek-harness/.agents/notes/README.md:38@687f282e`
- 更新既有 owner 的当前事实是义务，不是“编辑决策”。`deepseek-harness/.agents/notes/implemented/AGENTS.md:11-13@687f282e`

**证据限制.** 机械门禁只能检查“有 Note 且格式正确”，不能证明“这个改动真的需要 Note”或“写下的理据是真的”；后者只能评审。

## 3. M02 生命周期、分类与路径 {#lifecycle-classification}

> 机制 ID：`decisions-lifecycle-classification`

**问题.** 只靠标签或索引文件无法阻止 Note 被放进错误状态或类别；索引又会制造无关变更的争用。

**触发.** 新建 Note、移动 Note、新增 class、重构目录。

**前提.** 已选定生命周期（proposed/implemented/rejected）与 class。

**步骤.**
1. 路径固定为 `{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`；日期是主题**首次提出**的日期（按 git 历史）。**[源规则]** `deepseek-harness/.agents/notes/README.md:9-17@687f282e`
2. 生命周期三选一：`proposed/`（实现前评审、尚未建成或部分建成）、`implemented/`（已发布）、`rejected/`（已否决策）。**[源规则]** `deepseek-harness/.agents/notes/README.md:11-14@687f282e`
3. class 从闭集选一：`feature`、`bug-fix`、`simplification`、`architecture`、`process`、`testing`。**[源规则]** `deepseek-harness/.agents/notes/README.md:23-32@687f282e`、`deepseek-harness/scripts/agent-note-tree.ts:1-83@687f282e`
4. 用判别式消除边界：`architecture` 描述“我们发布的源码如何组织、运行时词汇是什么”；`process` 是围绕代码的工具/政策/工作流；`refactor` 故意缺席，因为它与 `simplification` 重叠，后者的判别式是“可观察行为是否改变”。**[源规则]** `deepseek-harness/.agents/notes/README.md:30-34@687f282e`
5. 不在根放 `INDEX.md`；浏览目录或搜索仓库即工作清单。**[源规则]** `deepseek-harness/.agents/notes/README.md:19@687f282e`
6. 新增 class 必须同时改 `AGENT_NOTE_CLASSES` 与 README 分类节；门禁拒绝未列目录。**[源规则]** `deepseek-harness/scripts/agent-note-tree.ts:1-83@687f282e`、`deepseek-harness/.agents/notes/README.md:23@687f282e`
7. 运行分类门禁：它遍历活跃树，拒绝根级 `INDEX.md`、未知生命周期目录、深度不等于 3、未知 class、文件名不是 `yyyy-mm-dd-topic.md`，并拒绝旧路径 `docs/rfc`、`docs/rfcs` 重新出现。**[源规则]** `deepseek-harness/scripts/agent-note-tree.ts:41-82@687f282e`、`deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e`

**责任者.** 作者选路径；分类门禁做机械判定；class 新增需维护者共识。

**完成信号.** `verify-agent-note-classification` 输出 `N Agent Note(s) checked, structure consistent.`，退出码 0。

**失败处理.** 门禁按文件逐条报错（`structure: <path> — <reason>`）；修正路径或补 class 定义后重跑。未知生命周期目录会让其中的 Note 对遍历不可见，必须显式改名。

**例外与陷阱.**
- `walkAgentNoteTree` 只 glob `{lifecycle}/**/*.md`，先放行生命周期根下的 `AGENTS.md`/`CLAUDE.md`，再跳过 `.zh.md`；后者由配对门禁负责。**[源规则]** `deepseek-harness/scripts/agent-note-tree.ts:57-79@687f282e`
- 因此放在生命周期根下的杂项 `.zh.md` 会被静默跳过，这是门禁的分工而非许可。**[边界]**
- `INDEX.md` 只检查 `.agents/notes` 根一层；深层无日期文件会被文件名规则拒绝。**[边界]**

**证据限制.** 分类门禁证明路径合法，不证明类别选得对；“architecture vs process”的语义只能评审。该门禁同样没有独立 spec，负向行为来自源码阅读。**[已核对]**

## 4. M03 文件格式门禁 {#note-format}

> 机制 ID：`decisions-note-format`

**问题.** 路径已经编码状态，但正文仍会混入 ADR 模板、提案时态章节和重复状态行，读者无法快速判断文件处于哪一阶段。

**触发.** 任何活跃 Note 的新增或编辑；迁移剧本第一次落地。

**前提.** 已选定生命周期；已读 `.agents/notes/README.md § The file format`。

**步骤.**
1. 前三行固定：`# Agent Note: <title>`、空行、`Status: <status>`；第 4 行必须空。**[源规则]** `deepseek-harness/.agents/notes/README.md:58-66@687f282e`、`deepseek-harness/scripts/verify-agent-note-format.ts:55-61@687f282e`
2. 状态语法与目录交叉校验：`proposed` 必须恰好 `Status: proposed`；`implemented` 必须恰好 `Status: implemented`；`rejected` 必须 `Status: rejected — <一句话原因>`。**[源规则]** `deepseek-harness/.agents/notes/README.md:68-74@687f282e`、`deepseek-harness/scripts/verify-agent-note-format.ts:21-26@687f282e`
3. 状态不带日期与括号；文件名持有首次提出日期，git 持有其余；“以修订形式接受”写进正文。**[源规则]** `deepseek-harness/.agents/notes/README.md:74@687f282e`
4. 全文只允许第 3 行这一处 `Status:`（围栏代码块外）。**[源规则]** `deepseek-harness/scripts/verify-agent-note-format.ts:62-65@687f282e`
5. 正文第一段必须是 `## Problem`，且必须先于任何其他 H2。**[源规则]** `deepseek-harness/.agents/notes/README.md:78@687f282e`、`deepseek-harness/scripts/verify-agent-note-format.ts:67-68@687f282e`
6. 按生命周期补齐必备 H2：proposed 需 `## Proposal`、`## Acceptance criteria`、`## Risks`；implemented 需 `## Decision`、`## Consequences`；rejected 需 `## Proposal`。**[源规则]** `deepseek-harness/scripts/verify-agent-note-format.ts:28-33@687f282e`
7. implemented 禁用提案时态标题（大小写不敏感）：`## Proposal`、`## Plan`、`## Migration plan`、`## Acceptance criteria`；`## Testing`、`## Deferred`、`## Related` 允许，只要陈述当前事实。**[源规则]** `deepseek-harness/scripts/verify-agent-note-format.ts:35-36,72-76@687f282e`、`deepseek-harness/.agents/notes/README.md:103@687f282e`
8. 必须有 `## Alternatives considered`；每个真实替代方案一段加粗领起，或有争议者用 `### Why not <X>?`。替代方案是记录，不是发明。**[源规则]** `deepseek-harness/.agents/notes/README.md:109-111@687f282e`
9. 2026-07-05 之前且替代方案不可复原的 Note，可用精确注释替代该节：`<!-- agent-note-format: alternatives-not-recorded (pre-format Agent Note) -->`；该注释与 `## Alternatives considered` 互斥，且日期 >= 2026-07-05 使用即失败。**[源规则]** `deepseek-harness/.agents/notes/README.md:113-117@687f282e`、`deepseek-harness/scripts/verify-agent-note-format.ts:13-16,78-82@687f282e`
10. 已退役的债务标记 `XXX: legacy ADR/RFC body format`、`XXX: legacy ADR/Agent Note body format` 在正文任何位置出现即失败。**[源规则]** `deepseek-harness/.agents/notes/README.md:117@687f282e`、`deepseek-harness/scripts/verify-agent-note-format.ts:18-19,84@687f282e`
11. 代码围栏内的格式 token 不算文档结构：门禁先剔除围栏行再检查。**[源规则]** `deepseek-harness/scripts/verify-agent-note-format.ts:44-53@687f282e`

**责任者.** 作者；`verify-agent-note-format` 逐文件判定；评审者判断语义质量。

**完成信号.** `verify-agent-note-format: N Agent Note(s) checked, all conform ...`；任何违规输出 `format: <rel> — <message>` 并以 1 退出。

**失败处理.** 按报错修：缺节补节，implemented 的提案标题折叠进 `## Decision`/`## Consequences`/现在时 `## Testing`；重复状态行删除；大范围旧格式先批量规范化再开门禁（源仓在定义格式的同一变更内完成全库规范化，无过渡期、无双格式容忍）。**[源规则]** `deepseek-harness/.agents/notes/README.md:56@687f282e`。

**例外.**
- 归档 Note 保留封印时的格式加一行 `Archived:`，不受本门禁约束。**[源规则]** `deepseek-harness/.agents/notes/README.md:56@687f282e`
- 中文对照由配对门禁检查结构，格式门禁跳过 `.zh.md`；`# Agent Note: ` 与 `Status:` 两个机器 token 必须保持英文原样。**[源规则]** `deepseek-harness/.agents/notes/README.md:123-125@687f282e`

**证据限制.** 门禁证明形状，不证明替代方案真实、后果诚实或 Problem 写得清楚；这些是评审责任。格式与分类两个门禁把规则写在脚本内联逻辑里，没有导出谓词，也没有对应 spec；它们的“会失败”只能由源码阅读推断，源仓唯一带正反用例的 Agent Note 门禁是归档校验器。**[已核对]**

## 5. M04 生命周期迁移 {#lifecycle-transitions}

> 机制 ID：`decisions-lifecycle-transitions`

**问题.** 文件从 proposed 移到 implemented 时最常见的违约，是只改文件夹和状态行，正文仍是未来时计划。

**触发.** 提案被接受并发布；提案被否决；rejected 想恢复为活跃提案（源仓无恢复程序，见限制）。

**前提.** 已按 M01 判断仍是同一个决策；若决策已变，另建 Note（M05/M06）。

**步骤.**
1. 同一变更内移动文件并更新 `Status:` 行。**[源规则]** `deepseek-harness/.agents/notes/README.md:119-121@687f282e`
2. 重新满足目标文件夹骨架：否则门禁失败。**[源规则]** 同上。
3. `proposed/` → `implemented/`：把 `## Proposal` 改写成现在时 `## Decision`；把 `## Acceptance criteria` 与 `## Risks` 折叠进 `## Consequences`，或改成现在时 `## Testing`/`## Verification` 说明“现在由什么钉住行为”；删除计划，改写已发布内容。**[源规则]** `deepseek-harness/.agents/notes/README.md:121@687f282e`
4. `proposed/` → `rejected/`：只在 `Status:` 行加一句话原因，并冻结文件。**[源规则]** `deepseek-harness/.agents/notes/README.md:121@687f282e`
5. 迁移后运行格式与分类门禁；`doc-sync`/`test:docs` 会覆盖归档与配对。

**责任者.** 作者；评审者确认重写没有偷偷改变决策。

**完成信号.** 目录、状态行、骨架三者一致，门禁绿。

**失败处理.** 门禁会指出缺节、禁用标题或状态语法不符；按 M03 修，不要用旧文件夹逃避重写。

**例外/限制.** 源仓没有 `archived → implemented` 的恢复程序，也没有“撤销归档”门禁路径；`dsh-archive-agent-notes` 的 description 提到 restoring，但正文只定义归档/删除判决。**[边界]** 恢复只能作为采用项目的扩展设计：解除封印意味着破坏 append-only 信任，应新建 Note 并保留归档原文，而不是改归档。

## 6. M05 取代审计与交叉链接 {#supersession-audit}

> 机制 ID：`decisions-supersession-audit`

**问题.** 新决策写完后，旧 Note 仍然以“现行权威”姿态留在活跃树，读者会同时找到互相矛盾的 two truths。

**触发.** **每一篇**新 Agent Note 创建时（不是延后的季度清理）。**[源规则]** `deepseek-harness/.agents/notes/AGENTS.md:5@687f282e`、`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:14-16@687f282e`

**前提.** 新 Note 的决策、机制与被否决替代方案已经能一句话概括，便于检索同主题旧 Note。

**步骤.**
1. 搜索活跃树中覆盖同一决策、机制或被否决替代方案的旧 Note。**[源规则]** `deepseek-harness/.agents/notes/AGENTS.md:5@687f282e`
2. 对每个候选判定：full supersession（旧决策整体被取代）、partial（部分事实/机制仍现行）、none。**[源规则]** 同技能。
3. full 且为 implemented 三件套：同一 PR 内按 M09 归档。**[源规则]** `deepseek-harness/.agents/notes/AGENTS.md:5@687f282e`、`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:14-16@687f282e`
4. partial：保持两篇都活跃，并互相交叉链接；更新仍现行的事实。**[源规则]** `deepseek-harness/.agents/notes/AGENTS.md:5@687f282e`、`deepseek-harness/.agents/notes/README.md:50@687f282e`
5. 旧提案已无价值：不是归档，而是按 rejected 生命周期拒绝并给出诚实原因。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-27@687f282e`
6. 用相对 Markdown 链接交叉引用 Note，禁止裸散文或编号，保证可机械检查且移动后仍有效。**[源规则]** `deepseek-harness/.agents/notes/README.md:17@687f282e`

**责任者.** 新 Note 作者（审计与同 PR 归档）；`dsh-archive-agent-notes` 技能提供判决标准；评审者抽查。

**完成信号.** PR 报告列出每个被检旧 Note 的 full/partial/none 与去向；归档发生在同一 PR。

**失败处理.** 漏审不算“以后清理”：源仓把 supersession 定义为写入时动作，避免语料债务复利。发现漏审时在合并前补审；已合并则下次触碰该主题时补齐。

**例外.** 局部机械修改常不产生新 Note，因而也不触发审计；但如果它们改变了既有 Note 的事实，仍要按 M06 更新。

**证据限制.** “搜索完整”无法机械证明：没有自动覆盖审计的工具。技能明确要求检查范围内每一篇并记录边界案例，但只靠人/代理执行。

<a id="implemented-maintenance"></a>
## 7. M06 implemented Note 的现状维护

> 机制 ID：`decisions-implemented-maintenance`

**问题.** 已发布 Note 会随代码漂移；两种错误都常见：任其腐烂，或把 Note 当成变更日志不断追加历史。

**触发.** 代码移动文件、重命名包、改变 key/默认值/机制；或发现 Note 与已发布现实不符。

**前提.** 变更没有改变决策本身，只改变其实现落点。

**步骤.**
1. 在**同一变更**内更新路径、符号、默认值与机制。**[源规则]** `deepseek-harness/.agents/notes/implemented/AGENTS.md:5-7@687f282e`
2. 原地重写陈旧事实，不追加变更历史。**[源规则]** 同上。
3. 判断是否越界：决策或其理据被反转时，不允许改写旧 Note 来“变成新决策”；需新建 Note 并交叉链接。**[源规则]** `deepseek-harness/.agents/notes/implemented/AGENTS.md:11-13@687f282e`
4. 当 Note 已不太可能指导未来工作、但仍有历史决策价值时，走归档（M09），而不是继续维护。**[源规则]** `deepseek-harness/.agents/notes/implemented/AGENTS.md:9@687f282e`
5. 完全被取代的旧 Note 只能经受控合并删除（M08）。**[源规则]** `deepseek-harness/.agents/notes/implemented/AGENTS.md:13@687f282e`

**责任者.** 改动作者；评审者按 `dsh-code-review` 的 “Implemented Agent Notes match shipped reality” 项核对。

**完成信号.** Note 中每个路径/名称/机制都能在当前代码找到；没有 changelog 式段落；决策未被偷换。

**失败处理.** 评审发现漂移：作者在同一 PR 内修正。若旧 Note 已归档，则**不得**改归档：改为写当前文档或新 Note。**[源规则]** `deepseek-harness/.agents/notes/archived/AGENTS.md:3@687f282e`

**证据限制.** 机械门禁只查格式与路径，不查事实是否与代码同步；源仓靠评审清单而非自动比对。

## 8. M07 删除、保留与归档判决 {#delete-keep-archive}

> 机制 ID：`decisions-delete-keep-archive`

**问题.** 活跃决策集会无限膨胀；简单按字数、年龄或配额清理会删掉仍能防止重蹈覆辙的理据。

**触发.** 新 Note 触发取代审计；或计划清理活跃语料。

**前提.** 已读全部相关 Note 全文；已掌握当前代码/配置/包文档/生成目录与较新 Note。

**步骤.**
1. 语义逐篇判断，词数与年龄只作发现线索，**绝不**作归档判据。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:8@687f282e`
2. 对每个 implemented Note 选一个结果：
   - **删除**：只描述小型 UI 调整或纯机械改动；连同英文、中文、sidecar 三件套一起删，修复或移除入站链接。**[源规则]** `deepseek-harness/.agents/notes/README.md:38@687f282e`、`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:22@687f282e`
   - **保留活跃**：其替代方案、所有权边界、负向保证、持久/线格式语义、安全规则或重新引入条件仍可能指导未来改动。**[源规则]** 同上，`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:23@687f282e`
   - **归档**：决策已完整发布、理据不太可能指导未来工作，但历史决策价值仍值得保存；已满足直接删除条件的记录不得归档。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:24@687f282e`
3. proposed：永不归档；不再值得推进就诚实地拒绝（rejected），满足 rejected 格式。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:25@687f282e`
4. rejected：仅当失败的提案仍是诱人且有意义的错误、且 Note 解释它为何失败时保留；过时、被取代、不再可信或无法阻止重提时删除整个三件套。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:26-27@687f282e`
5. 不给配额：检查范围内每一篇；相似组按同一原则归类；边界案例用最佳判断并记录。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:29@687f282e`
6. 小型实现不等于可删除；局部 bug 修复、性能变化、新能力、实质行为决策不符合条件。**[源规则]** `deepseek-harness/.agents/notes/README.md:38@687f282e`
7. 报告保留/删除/归档的 implemented、rejected、以及被拒绝的 proposed，和每个真实边界案例的词数与选择。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:68@687f282e`

**责任者.** 执行代理做语义分类；评审者复核删除/归档判决；所有者对合并负责。

**完成信号.** 每篇被检查 Note 有明确去向；删除的三件套与入站链接都已处理；归档通过封印；报告含边界案例。

**失败处理.** 误删：从 git 恢复三件套并修复链接，然后重新评审；误归档（不应冻结）：源仓无解封程序，需维护者显式决定是否新开例外并改封印清单，不能自行编辑归档。

**例外.** 校准示例给出“删除/保留/拒绝”的尺度而非配额，采用项目必须按自身领域重标定，不能照抄 533/248 等字数。

**证据限制.** 没有自动检查“判决正确”；技能只提供语义标准与报告格式。`word count` 仅用于报告边界案例。

<a id="consolidation"></a>
## 9. M08 合并（consolidation）

> 机制 ID：`decisions-consolidation`

**问题.** 两篇 Note 讲同一决策时，简单删旧篇会丢失独有理据；把旧文改写成相反结论则会制造历史伪造。

**触发.** 一篇 implemented Note 被完全取代，或 feature 增加篇在后续移除变更中需要并入。

**前提.** 已确认是 **full** supersession；partial 不符合条件。

**步骤.**
1. 合并进当前 owning Note，然后删除旧篇。**[源规则]** `deepseek-harness/.agents/notes/README.md:50@687f282e`
2. 删除前，owner 必须保留旧篇的每一条独有理据、替代方案、后果、必需验证与具名覆盖缺口。**[源规则]** 同上。
3. 修复每一条入站链接。**[源规则]** 同上。
4. 同一变更内删除中文对照与一致性记录。**[源规则]** 同上。
5. partial supersession 不合并：两篇都保留并交叉链接，更新所有仍现行的事实。**[源规则]** 同上。
6. 不得把旧文件改写成它的反面，也不得让 git 历史成为理据的唯一副本。**[源规则]** 同上。
7. feature 增加篇并入后来的移除篇，必须同时满足：功能已不在生产代码、配置、schema、持久/线格式、迁移与兼容行为中；没有当前文档把它呈现为可用；没有测试把它当受支持行为。**[源规则]** `deepseek-harness/.agents/notes/README.md:52@687f282e`
8. 移除 owner 还要保留：最初动机、为何不再支持该功能、完整移除之外的替代方案、放弃的能力、重新引入条件、完整缺席的验证。**[源规则]** 同上。
9. 只验证被删除行为的过时实现清单与测试，不算当前验证证据；移除一种 transport/default/实现/呈现，或仍有持久数据与兼容处理，属 partial。**[源规则]** 同上。

**责任者.** 旧 Note 的 owner / 合并执行者；评审者核对“独有内容是否全部转移”。

**完成信号.** 旧篇及其 zh/sidecar 消失；owner 包含全部独有内容；所有入站链接指向新 owner 或归档。

**失败处理.** 发现遗漏独有理据：停止删除，恢复旧篇并补全 owner 后再删。链接未修复：链接门禁红（见 M14）。

**例外.** 删除整篇是唯一允许在活跃语料中“丢失文件”的路径，且必须逐条满足上述保留义务。

## 10. M09 归档三件套操作 {#archive-triplet}

> 机制 ID：`decisions-archive-triplet`

**问题.** 归档若允许顺手修链接、改事实、重排版，就会把历史快照变成不可信的混合体。

**触发.** M07 判决为“归档”的完整 implemented 三件套。

**前提.** 已确认该篇满足归档（不是删除、不是保留）条件；工作树干净或变更已暂存。

**步骤.**
1. 将完整的 `foo.md`、`foo.zh.md`、`foo.i18n.yaml` 从 `implemented/<kind>/` 移到 `archived/<kind>/`；归档路径故意没有 `implemented` 段。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:54-56@687f282e`
2. 不做正文编辑；仅在两个语言文件的 `Status: implemented` 下一行插入 `Archived: YYYY-MM-DD`，两侧使用同一归档日期。**[源规则]** `deepseek-harness/.agents/notes/README.md:40@687f282e`、`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:57@687f282e`
3. 机械重录 sidecar 的两个元数据编辑后哈希；不翻译、不重排版、不更新事实、不修内部链接；现有标点、空行布局与语言切换措辞随正文保留。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:58@687f282e`
4. 从活跃散文搜索入站链接：重定向到当前权威、仅在有意引用历史时改指归档路径、或删除；**绝不**检查或修复归档 Note 的出站链接。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:59@687f282e`、`deepseek-harness/.agents/notes/README.md:42@687f282e`
5. 运行 `pnpm run verify-archived-agent-notes --write`：追加模式先证明每个既有 seal 仍匹配，再只添加新三件套哈希。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:60@687f282e`
6. 再运行普通校验器（无 `--write`），确认新封印无未封印缺项。**[源规则]** 同上。

**责任者.** 归档执行者；评审者核对“除 Archived 行与重录 sidecar 外无正文差异”。

**完成信号.** 普通校验输出 `N frozen artifact(s) checked across 6 kind(s).`；manifest 新增恰好 3 个路径；`git diff` 显示旧路径删除、新路径新增与两行 `Archived:`。

**失败处理.**
- `sealed content hash changed`：说明改动了已封印内容，必须还原，而不是更新哈希。
- `archived artifact is not sealed in manifest.json`：忘记 `--write`，补跑。
- `incomplete archived triplet; missing ...`：三件套不全，补齐或整体撤回。
- `requires Archived...` / 日期非法 / 早于文件名日期 / 两侧日期不同：按错误修正插入行。

**例外.**
- 源仓为一次授权 Figma 链接移除登记了三个精确 old→new 哈希（英文、中文、sidecar），只允许这一条路径的精确转换；反向、其他路径、缺项均被拒。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.ts:56-89@687f282e`、`deepseek-harness/.agents/notes/archived/AGENTS.md:9@687f282e`
- 历史标题格式不必是 `# Agent Note:`；归档校验只要求 `Status:` 与下一行 `Archived:`，保留旧标题与语言切换措辞。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.ts:118-130@687f282e`、`deepseek-harness/scripts/archived-agent-notes.spec.ts:36-44@687f282e`

**证据限制.** 源校验器首次封印没有搬移前正文比对；目标执行器已增加可信 Git 原文比对，操作与初始历史导入条件见[实际归档模块](agent-notes.md#3-冻结归档与可信历史)。本地实测不等于 required CI 或独立关闭。

## 11. M10 冻结信任与封印语义 {#frozen-trust}

> 机制 ID：`decisions-frozen-archive-trust`

**问题.** “别改归档”如果只是口头约定，任何一次善意修链接都会悄悄改写历史；但把归档做成不可读的死文件又会妨碍检索。

**触发.** 任何归档目录变更；审计归档完整性；CI 与本地 hook 运行。

**前提.** 已存在 `archived/AGENTS.md` 与 `manifest.json`；CI 提供可信的变更前基线提交。

**步骤（校验器实际行为）.**
1. 结构：归档根只允许 `AGENTS.md` 与 `manifest.json` 两个普通文件；只允许普通文件与 class 目录；类目录必须属于闭集六类；六类目录必须全部存在（可为空）；类目录内只允许普通文件。**[源规则]** `deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e`
2. 三件套与元数据：每个路径必须匹配 `{kind}/yyyy-mm-dd-topic.{md,zh.md,i18n.yaml}`；缺任一侧即 `incomplete archived triplet`；两份语言文件都要求恰为 `Status: implemented`，且下一行是合法 `Archived: YYYY-MM-DD`；归档日期不得早于文件名日期；两侧归档日期必须相同。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.ts:132-183@687f282e`
3. Sidecar：忽略空行与 `#` 注释；每行必须是 `^([^:#]+\.md): ([0-9a-f]{40})$`；必须恰好两个条目，且分别等于两份语言文件的 git blob SHA-1。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.ts:107-116,175-180@687f282e`
4. Manifest：闭合 schema，只允许 `version` 与 `files`，`version` 必须为 1，哈希必须是 `sha256:<64 hex>`；渲染时按路径 `localeCompare` 排序、2 空格缩进、末尾换行，避免 churn。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.ts:30-54@687f282e`
5. 基线：`DSH_ARCHIVE_BASE_REF` 默认 `HEAD`；该 ref 必须是 commit；ref 上没有 manifest 视为空基线；ref 上的每条封印路径在当前 manifest 中必须存在且哈希不变（除非命中登记例外）。**[源规则]** `deepseek-harness/scripts/verify-archived-agent-notes.ts:61-93@687f282e`
6. 追加：未封印的新 artifact 在非 `--write` 模式报错；`--write` 只追加，既有封印仍先校验。**[源规则]** `deepseek-harness/scripts/verify-archived-agent-notes.ts:95-115@687f282e`
7. 冻结语义：不编辑、不翻译、不重排版、不修复、不删除、不移动；不作为当前行为权威；文档门禁跳过归档源（含其出站链接），但活跃散文仍可有意链接进归档。**[源规则]** `deepseek-harness/.agents/notes/archived/AGENTS.md:3@687f282e`、`deepseek-harness/.agents/notes/README.md:42@687f282e`
8. 搜索可见性：根 `.rgignore` 排除 `/.agents/notes/archived/`，历史查询需显式命名目录；这防止冻结事实混入默认检索，同时保留有意访问。**[源规则]** `deepseek-harness/.rgignore:1-2@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:17@687f282e`

**责任者.** 归档校验器拥有冻结边界；维护者拥有例外登记；CI 拥有可信基线。

**完成信号.** 普通模式输出封印数量与 class 数并以 0 退出；`--write` 只报告新增数量，且既有封印不变。

**失败处理.**
- `sealed manifest entry is missing` / `sealed manifest hash changed`：还原内容或恢复条目；不得更新封印来“修复”。
- `cannot read baseline`：CI 的基线 ref 不可达（浅克隆/force push），按源仓做法取全历史（`fetch-depth: 0`）或使用 PR base SHA。
- 基线本身被伪造：`DSH_ARCHIVE_BASE_REF` 是信任根，必须由 CI 注入，不能让 PR 作者控制。

**例外与已知缺口（必须如实迁移）.**
- **源缺口与目标补强**：源校验器看不到搬移前正文，首次提交可夹带修改。目标 `verify-archived-agent-notes.mjs` 用可信基线的完整 implemented 三元组核对搬移，只允许 Archived 行和侧车重录；可信对象比对支持 SHA-1/SHA-256，旧式侧车仍为 SHA-1。对可信基线中既有未封印历史，既要求原字节一致，也拒绝整组三元组遗漏；伪造当前清单不绕过比对。LF、基线建立前历史不可知及 CI 信任边界见[实际归档模块](agent-notes.md#3-冻结归档与可信历史)。局部实测与独立代码复核不等于真实 required CI。**[源边界/目标实现]**
- `--write` 的本地基线默认 `HEAD`：若本地已提交归档变更再跑，基线已包含新哈希，追加模式只做自洽检查，不能证明历史未变。**[边界]**
- 精确例外是硬编码的路径+before+after 三元组；它能防止复用，但新增例外需要改代码并评审，不是配置项。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.spec.ts:115-144@687f282e`
- 归档校验不要求 H1 为 `# Agent Note:`，也不检查正文骨架；历史格式被显式保留。**[源规则]** `deepseek-harness/scripts/archived-agent-notes.spec.ts:36-44@687f282e`
- 归档只校验 sidecar 的旧式两行 blob 记录；活跃语料已改为按标题分节的记录格式，因此归档 sidecar 不能用现行配对门禁重录。**[源规则]** `deepseek-harness/docs/i18n/README.md:34@687f282e`、实现对比见 coverage。
- 校验器不检查 `Archived:` 是否等于实际归档时间；它只要求合法日期且不早于文件名日期。**[边界]**

## 12. M11 Postmortem 准入 {#postmortem-admission}

> 机制 ID：`decisions-postmortem-admission`

**问题.** 每个 bug 都写复盘会稀释信号；只写“修了什么”又无法防止同类问题再次穿过安全网。

**触发.** bug 到达了不该到达的地方（真实用户、已合并 PR、发布），且失败原因具有系统性。

**前提.** 已掌握故障机制与为什么现有测试/工具/约定没拦住；已定位可链接的护栏。

**步骤.**
1. 三条件同时成立才写：**subtle**（机制不显然，细心的工程师也要重走一遍）、**systemic**（逃逸原因是测试/工具/约定缺口，不是一次性笔误）、**costly to rediscover**（耗费真实调试时间且会再次耗费）。**[源规则]** `deepseek-harness/docs/postmortem/README.md:9@687f282e`
2. 开头写 `## Executive summary`：一段话让忙碌读者三十秒内得到“坏了什么、根因、为何逃逸、持久教训”。**[源规则]** `deepseek-harness/docs/postmortem/README.md:11@687f282e`
3. 正文包含 `## Summary`、`## Timeline`、`## Root cause`、`## Guardrails added`、`## Lessons`；示例还含 `## Impact`。时间线记录证据，不写成教学顺序。**[源规则]** `deepseek-harness/docs/postmortem/README.md:11@687f282e`、`deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:7-53@687f282e`
4. 链接它促成的护栏（测试、`AGENTS.md` 规则、ADR 等）。**[源规则]** `deepseek-harness/docs/postmortem/README.md:9@687f282e`
5. 在 `docs/postmortem/README.md` 的编号索引表加一行 `| [NNNN](file.md) | title |`。**[源规则]** `deepseek-harness/docs/postmortem/README.md:13-18@687f282e`
6. 维护中英配对：每篇有 `.zh.md`，README 也有；语言切换行紧随 H1。**[源规则]** 文件清单与 `deepseek-harness/docs/i18n/README.md:7-10@687f282e`
7. 护栏必须能失败：回归测试要针对报告的机制，而不是超时或替代服务。示例明确“进程超时不等于 fail-fast，退出后端口可用不证明从未绑定”。**[源规则]** `deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:48-53@687f282e`
8. 快照刷新是夹具生产，不是正确性评审：0002 记录快照套件之所以放行，是因为 `UNKNOWN_TOOL` 结果被刷新成新的期望输出；因此护栏补成“快照/会话夹具拒绝结构化 `UNKNOWN_TOOL`”，并让文件系统场景改用自带 header class 的独立 overlay，而不是共享默认组合的 pin。**[源规则]** `deepseek-harness/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:7,15,34,38-41@687f282e`
9. 归因需要独立证据的合取，共享前缀不是协议：0004 记录把 `landlock-run:` 前缀加任意非零退出当作 runner 失败，导致子进程合法的 1/2/125 退出被误判；护栏改为“退出码 125 + 单行致命签名 + 精确排除信息行”，并保留“子进程可伪造同一行”的残余风险说明。**[源规则]** `deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:11-13,35,43-48@687f282e`
10. 适配器必须保留下方 seam 拥有的结构化失败，不要替换成自己最近的通用类别（0004 的 `SEARCH_FAILED` 覆盖 `SANDBOX_UNAVAILABLE`）；平台相关行为要有原生边界确定性 fake 加一条装配后的产品路径，自跳过的真内核测试不能独自承载回归。**[源规则]** `deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:43-48,52-55@687f282e`
11. 不把 postmortem 当设计决策：设计理据进 Agent Note；postmortem 只讲已发生事实与护栏。**[源规则]** `deepseek-harness/docs/postmortem/README.md:7@687f282e`

**责任者.** 事故处理者/owner 写；评审者检查根因是否到机制层；护栏 owner 落地测试或规则。

**完成信号.** 执行摘要、章节、索引行、双语文件、护栏链接齐全；每个护栏有真实测试或明确规则位置。

**失败处理.** 根因停在“某人疏忽”：退回重写，追到测试/工具/约定缺口。护栏只是文字：补失败测试，或把规则写入可执行门禁（M13）。

**例外与限制.**
- 源仓没有 postmortem 专用脚本：`scripts/` 中无引用，编号、执行摘要、索引表全靠评审；状态行（如 `Status: resolved`）在示例中出现但 README 未强制。**[源规则/边界]** 反向核对：`scripts/doc-standard.spec.ts` 全文 457 行不含 `postmortem` 或 `agent-note` 字样，说明快速文档标准测试也不覆盖这两类载体；`scripts/verify-doc-budgets.ts` 只按 manifest 检查 7 个常驻文档（AGENTS.md、docs/AGENTS.md、docs/architecture.md、docs/cordis-primer.md、docs/testing.md、packages/AGENTS.md、packages/README.md），postmortem 与 Note 不在预算内。**[已核对]**
- **双语不是“仅靠评审”**：postmortem 属于 `docs/**` 的通用配对语料，未被 manifest 排除，缺译文/侧车、结构或记录漂移会被配对门禁拒绝；含义与术语仍由评审判断。没有 postmortem 专用摘要/索引检查，不表示没有通用自动约束。**[源规则]** `deepseek-harness/docs/i18n/README.md:28-48@687f282e`、`deepseek-harness/scripts/translation-pairing.ts:161-168@687f282e`、`deepseek-harness/scripts/translation-pairing.manifest.json:1-13@687f282e`。目标采用真实目录时须把它纳入[同一文档执行模块](documentation.md#markdown-gates)，不能用人工确认替代配对执行；针对 postmortem 目标入口的证明仍缺。
- Postmortem 不进网站投影（`website/docs.ts` 无 postmortem 源），是仓库内参考。**[边界]**
- “ADR”在 postmortem README 中作为可链接护栏类型出现，但源仓没有独立 ADR 目录或门禁；现行决策记录载体是 Agent Note。**[边界]**
- 0002 与 0004 证明“护栏”可以落在彼此很不同的层：静态配置校验器（`verify-cordis-config`）、快照/夹具拒绝结构化错误、原生边界回归用例、装配后的 snapshot 组合。采用项目不应把这几种手段压缩成单一“加个测试”的模板。**[源规则]**

<a id="durable-rule-admission"></a>
## 13. M12 持久规则准入与机械门禁偏好

> 机制 ID：`decisions-durable-rule-admission`

**问题.** 一条规则可能被写进根指令、子树指令、文档、Note、防守模式或 skill；写错层会导致上下文膨胀、重复与漂移。规则若不接门禁，只能靠记忆执行。

**触发.** 想新增/修改常驻规则；根文件超预算；同一规则在多处出现；决定何时把“约定”升级成“检查”。

**前提.** 已读 `docs/AGENTS.md` 的层级表与写作规则；已确认没有现成 owner。

**步骤.**
1. 一事实一归宿：每条事实只放其职责层，其他地方链接过去。**[源规则]** `deepseek-harness/docs/AGENTS.md:15-17@687f282e`
2. 选层：根 `AGENTS.md` 只放每次会话都需要的常驻命令，每条 1-3 行并链接权威主页；子树 `AGENTS.md` 只放该子树特有命令；`architecture.md` 放有序地图；subsystems 放类型定义与语义；Agent Notes 放理据；defensive-patterns 放评审强制规则；postmortem 放事故故事；cookbook 放步骤；user 放产品指南；package README 放包契约；generated 放生成参考；skills 放可复用工作流。**[源规则]** `deepseek-harness/docs/AGENTS.md:19-36@687f282e`
3. 放置判断：bugs → postmortems；rationale → Agent Notes；procedures → cookbooks；type definitions → subsystems；package contracts → READMEs；standing orders → 根 `AGENTS.md` 加理据链接；review-enforced rules → `defensive-patterns/`。**[源规则]** `deepseek-harness/docs/AGENTS.md:36@687f282e`
4. 预算：常驻文档受 `scripts/doc-budgets.manifest.json` 上限约束；超限按“先迁移、再压缩、最后提额并说明”的顺序处理；上限是护栏不是削减目标。**[源规则]** `deepseek-harness/docs/AGENTS.md:49-59@687f282e`
5. 机械强制优先，并要求证据可复算：防守模式总纲把“Require evidence”定义为可证伪、可重算——前后测量或门禁检查，而不是靠手工同步。**[源规则]** `deepseek-harness/docs/defensive-patterns/README.md:15@687f282e`
6. 规则与其实现在页面里分离职责：依赖声明与版本一致性由依赖扫描机械保证，页面只给入口命令、门禁名、政策所有者文件与边界，不复制包清单、字段规则或阈值。**[源规则]** `deepseek-harness/docs/defensive-patterns/package-surface.md:115-122@687f282e`
7. 例外必须窄、具名并留痕：修改扫描或政策需要领域所有者确认，并把理由记录在该变更上。**[源规则]** `deepseek-harness/docs/defensive-patterns/package-surface.md:123@687f282e`
8. 每条变更的验收规则都要有故意无效用例：负对照必须通过真实 runner 失败，而不是绕过 runner 或只改 mock。**[源规则]** `deepseek-harness/docs/testing.md:40@687f282e`、`deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:54@687f282e`
9. **[源规则]** 每条可机械检查的不变量必须接入实际执行的顶层检查，并证明每条变更验收路径拒绝无效用例；例外必须窄且有理由，不能全局禁用规则。`deepseek-harness/AGENTS.md:175@687f282e` 原文明确写出这一通用义务。它不要求所有规则进入同一个聚合：源格式/分类/预算是 doc-sync 的 quick 叶子，归档还有可信 CI 基线与 staged hook，依赖扫描进入多个聚合，Loader 元数据由独立脚本检查。采用方为每项指定实际入口和证据，不能只写一条“应有门禁”的散文。
10. 规则文本自包含但链接高层文档；能保持清晰就压缩；内容确实需要更多空间才提高预算上限。**[源规则]** `deepseek-harness/AGENTS.md:181@687f282e`
11. `CLAUDE.md` 在根与 `packages/` 是 `AGENTS.md` 的符号链接；编辑真实文件。**[源规则]** `deepseek-harness/AGENTS.md:181@687f282e`（实现：git mode 120000，见 coverage）
12. 新增防守规则时按页面解剖写：规则、它防止的缺陷、评审判断条件、边界；并让 `dsh-code-review` 指向它。**[源规则]** `deepseek-harness/docs/defensive-patterns/README.md:5-15@687f282e`、`deepseek-harness/docs/defensive-patterns/general.md:9-11@687f282e`
13. 门禁接线要有测试锁住归属：`run-gates.spec.ts` 断言 quick 聚合等于带 `quick` 标记的 doc-sync 叶子，并在 `ci-primary`/`ci-static`/`check-all`/`hygiene` 中都断言 `package-dependencies` 存在；`verify-cordis-config.spec.ts` 用拒绝/接受两类用例锁住 Loader 元数据规则。**[源规则]** `deepseek-harness/scripts/run-gates.spec.ts:353-358,430-437@687f282e`、`deepseek-harness/scripts/verify-cordis-config.spec.ts:19-48@687f282e`

**责任者.** 规则作者；子树 owner；评审者判断层次与必要性；门禁 owner 实现检查并补归属测试；扫描/政策变更还需领域所有者确认。

**完成信号.** 规则只在一处；根文件未超预算；证据可复算；每条可机械检查的不变量有真实顶层执行入口，且每条变更验收路径有经该入口拒绝的无效用例。**[源规则]** 顶层入口可以不同，字段齐全或命令存在不证明已执行。

**失败处理.** 预算红：迁移/压缩/提额；重复规则：保留一个 home，其余改链接；可机械校验的规则缺少实际顶层接线或无效路径证明：补齐并执行，不把它降为人工建议。不可机械校验的语义判断明确评审程序、执行者与判断证据。

**例外.** 历史叙事允许留在 postmortem / Note / commit / PR；普通文档不得承载。生成内容的英文侧可省略语言切换以保持字节一致（documentation 域）。具体门禁的例外必须窄、具名并留痕：依赖扫描/政策变更需领域所有者确认，理由记录在该变更上。**[源规则]** `deepseek-harness/docs/defensive-patterns/package-surface.md:123@687f282e`

**证据限制.** “可机械检查”是设计判断，不是自动发现；没有工具能证明一条规则已被正确接入。防守模式没有独立执行门禁，靠 code review 读取与人工判断。领域所有者确认是流程约束，仓库内没有文件能证明它确实发生过。**[已核对/未知]**

<a id="gate-wiring"></a>
## 14. M13 门禁接线与证据链

> 机制 ID：`decisions-gate-wiring`

**问题.** 有了脚本但不在任何路径执行，等于没有治理；反过来把所有门禁塞进 pre-commit 会拖慢本地提交。

**触发.** 新增/修改 Agent Note 门禁；文档变更；归档变更；准备推送或合并。

**前提.** 已确认脚本入口、聚合方式与信任基线。

**步骤.**
1. `package.json` 暴露独立脚本：`verify-agent-note-classification`、`verify-agent-note-format`、`verify-archived-agent-notes`、`verify-translation-pairing`、`doc-sync`、`test:docs`。**[源规则]** `deepseek-harness/package.json:122-130,198@687f282e`
2. `doc-sync` 聚合文档门禁；三个 Agent Note 门禁与 pairing/md-links/md-wrap 都标记 `quick: true`。`doc-quick` 取 `docSyncLeafGates({includeDocTypecheck:false})` 中 `quick` 的叶子，供 `test:docs` 使用。**[源规则]** `deepseek-harness/scripts/run-gates.ts:805-873,877-882@687f282e`
3. 本地 hook 只在暂存了归档文件时运行归档校验器；暂存 sidecar 时运行 pairing，但排除归档目录（归档有专用校验器）。pre-commit 与 pre-merge-commit 相同。**[源规则]** `deepseek-harness/lefthook.yml:5-15,30-44@687f282e`
4. CI PR 静态车道注入可信基线 `DSH_ARCHIVE_BASE_REF: github.event.pull_request.base.sha`，运行 `check:ci:static`（含 doc-sync）。**[源规则]** `deepseek-harness/.github/workflows/ci.yml:104-107@687f282e`
5. master 串行车道注入 `github.event.before`，并强制 `fetch-depth: 0`，因为浅克隆会读不到基线提交。**[源规则]** `deepseek-harness/.github/workflows/ci-master.yml:146-152,182-186@687f282e`
6. 推送前按 `dsh-pre-push-checks` 选择与表面匹配的证据：文档/Note 变更跑 `doc-sync`。**[源规则]** `deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:35@687f282e`
7. 归档变更按技能要求跑：归档校验器的聚焦测试、普通校验器、`doc-sync`、`lint`、`git diff --check`。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:64-68@687f282e`
8. 评审按 `dsh-code-review`：Note 与已发布现实一致、提案落地时同 diff 移动并改写、推翻 Note 被视为设计讨论而非自动否决。**[源规则]** `deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:27,41,55@687f282e`
9. 报告只写实际运行的命令与输出，不写“应该通过”。**[源规则]** `deepseek-harness/AGENTS.md:115@687f282e`

**责任者.** 门禁维护者接聚合；CI owner 提供基线；作者运行本地证据；评审者核对证据与 diff 面匹配。

**完成信号.** 本地 `test:docs` 绿；推送前 `doc-sync` 绿；CI 静态车道绿且归档基线可读；归档变更另有 `--write` 后的普通校验绿。

**失败处理.**
- 归档校验因浅克隆失败：改用全历史 checkout 或正确 base SHA；不要跳过门禁。
- 本地 hook 慢：保持 hook 只做与暂存文件相关的快速检查，完整矩阵交给 CI。
- 门禁在本地绿、CI 红：检查是否只跑了定向模式（如 `--cached` 或定向 pair），PR 级需要语料级运行。

**例外.** `git diff --check` 在 pre-commit 只查暂存内容；`check:windows-wine` 只在诊断已知 Windows 失败时运行，CI 拥有该信号。**[源规则]** `deepseek-harness/AGENTS.md:99,165@687f282e`

**证据限制.** 仓库内看不到分支保护/ruleset，无法证明这些 check 是 required；hook 可被 `--no-verify` 绕过，CI 才是权威。

## 15. M14 引用、链接与归档可见性 {#references}

> 机制 ID：`decisions-reference-integrity`

**问题.** 决策记录靠交叉链接生存；裸编号、绝对路径、失效锚点会让审计不可机械执行。

**触发.** Note 间引用；归档搬移；文档链接变更；历史引用。

**步骤.**
1. Note 间使用相对 Markdown 链接，不用裸散文或编号。**[源规则]** `deepseek-harness/.agents/notes/README.md:17@687f282e`
2. `verify-md-links` 扫描 README、`.agents/notes/**/*.md`、`docs/**/*.md`、包 Markdown、根 `AGENTS.md`、skills；归档 Note 被排除为**源**，但指向它们的链接仍被检查。**[源规则]** `deepseek-harness/scripts/verify-md-links.ts:20-40@687f282e`
3. `verify-translation-pairing` 的 scope 明确排除 `.agents/notes/archived/`，因为归档有专用封印校验器；普通文档门禁也跳过归档。**[源规则]** `deepseek-harness/scripts/translation-pairing.ts:128-168@687f282e`、`deepseek-harness/scripts/doc-typecheck.ts:210@687f282e`
4. 归档搬移后修复/删除**入站**链接；不改归档出站链接。**[源规则]** `deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:59@687f282e`
5. 历史引用用 tag 或 PR 编号；当前文件用相对链接；仓库引用校验拒绝真实 commit 标识符与不允许的组织链接。**[源规则]** `deepseek-harness/docs/AGENTS.md:75-77@687f282e`
6. 归档默认从 ripgrep 搜索中排除；需要历史查询时显式命名归档目录。**[源规则]** `deepseek-harness/.rgignore:1-2@687f282e`

**完成信号.** 链接门禁绿；搬移后无断链；归档出站链接即使失效也不阻塞（这是冻结的代价）。

**失败处理.** 链接红：修目标或锚点，不要删检查；归档内断链：按策略不修，若确实需要当前事实，在新 Note/文档中说明。

**例外.** 有意引用历史时，活跃散文可链接进归档；该链接指向快照，不构成当前权威。**[源规则]** `deepseek-harness/.agents/notes/README.md:42@687f282e`

## 16. 采用项目落地设计（参数化） {#migration}

**[迁移设计]** 以下是让上述机制在另一个仓库可执行的最小落地顺序。每步都给出可删/可调参数，禁止直接照抄源仓常量。

1. **定载体与范围.** 选择决策记录目录（源为 `.agents/notes/`）、事故目录（`docs/postmortem/`）、防守规则目录。若项目只有单语，删掉 `.zh.md`/sidecar 与配对门禁；若没有归档需求，删掉 manifest 与冻结章。
2. **定生命周期与 class.** 从闭集开始，宁可少：`proposed/implemented/rejected` 三态通常足够；class 用 3-6 个并写清判别式（源仓用 `refactor` 缺席 + `simplification` 判别式解决重叠）。新增 class 必须同时改代码常量与契约文档。
3. **定命名与日期语义.** `yyyy-mm-dd-topic.md`，日期=首次提出；把“状态不带日期”的规则写进契约，避免二次真相。
4. **写格式契约再开门禁.** 先把 header、状态语法、必填/禁用 H2、alternatives 规则写成一页；再实现分类与格式校验器。若历史语料多，设定一个明确的 grandfather 日期与唯一豁免注释，并在同一变更内规范化，避免长期双格式。
5. **定义“写/不写”准入.** 把创建标准、同 PR 义务、更新既有 owner、禁止改写决策写进子树指令；把机械/局部豁免写清楚，防止“实现小”被滥用。
6. **实现取代审计.** 新 Note 模板/PR 模板加一项：检索到的同主题旧 Note、full/partial/none 判定、去向。源仓把它放在 `notes/AGENTS.md` 与技能中，没有自动检查，采用项目可先人工执行。
7. **实现删除/归档判决.** 复制语义标准（删除=小型 UI/纯机械；归档=完整、低未来指导价值但有历史价值；保留=仍能指导未来），删除“字数/年龄/配额”判据。为边界案例规定报告格式。
8. **实现归档三件套.** 搬移完整 triple、插入同一日期行、重录 sidecar、修复入站链接、先 `--write` 再普通校验。本包的双语执行器已加入**首次封印补强**：由可信 Git 基线证明原文和三元组搬移，不能仅用当前内容自封；已提交历史首次建清单必须逐字节匹配基线。采用单语而需等效归档时仍须适配并证明，不能把双语执行器当单语支持。
9. **实现封印.** manifest 用闭合 schema、确定性排序、末尾换行；CI 注入可信 base ref；禁止 PR 控制基线；本地默认 `HEAD` 只用于写入，不作为历史完整性证明。例外登记必须是显式 path+before+after，并有测试证明反向/其他路径被拒。
10. **接门禁.** 独立脚本 → 文档聚合（quick/full 两级）→ 本地暂存 hook 只跑相关快速检查 → PR 静态车道跑聚合。归档校验必须拿到可信基线，浅克隆要么取全历史，要么换 base SHA。
11. **定信任与权威.** 归档=历史快照而非现行权威；活跃文档可有意链接；默认搜索排除归档；文档门禁跳过归档源与出站链接。把这一条写进归档目录的 `AGENTS.md`，否则后来者会把归档当文档修。
12. **写 Postmortem 准入.** 三条件、执行摘要、章节、索引、双语、护栏链接；若项目规模小，至少保留执行摘要与护栏；不设专用门禁也可以，但要明确“评审检查索引与护栏”。
13. **写持久规则准入.** 先建层级表（载体—职责—禁止内容），再迁移现有规则；根文件只放常驻命令；对每条规则显式选择强制方式：能机械校验的接到你实际会跑的门禁（源仓是逐机制落地，不是单一顶层聚合），不能校验的写清评审判断条件；为每条新增/变更的验收规则准备通过真实 runner 的负对照；涉及扫描/政策实现时指定领域所有者为例外批准人；预算 manifest 用相对路径与明确上限。**[迁移综合]**
14. **定评审与证据.** PR 模板要求“命令/步骤 + 可复核证据”；评审清单覆盖 Note 与现实一致、归档只允许的变更、链接修复、门禁真实运行。报告只写实际输出。

**采用时必须重设的参数（不得继承源仓值）**：格式生效日期与 grandfather 日期；归档日期下限规则；class 集合；双语/单语；预算上限；基线环境变量名；CI 车道名；例外登记；搜索排除路径；是否要求执行摘要/索引。

## 17. 评审清单 {#review-checklist}

- [ ] 该改动是否真的需要 Note？是否更新了既有 owner 而不是新建重复篇？
- [ ] 路径的生命周期与 class 是否与决策性质一致？日期是否为首次提出日期？
- [ ] 前三行、状态语法、`## Problem`、必备 H2、禁用标题、alternatives 是否满足？
- [ ] 是否把 Note 编辑成了相反决策？若是，是否另建并交叉链接？
- [ ] 新 Note 是否触发了取代审计？full/partial/none 是否逐项记录？full 是否同 PR 归档？
- [ ] implemented 的路径/符号/默认值是否与当前代码一致？是否出现 changelog 式历史？
- [ ] 删除是否满足“小型 UI/纯机械”？归档是否满足“完整、低未来指导价值、有历史价值”？是否误用字数/配额？
- [ ] 合并是否保留了全部独有理据、替代方案、后果、验证与覆盖缺口？是否删除 zh+sidecar 并修链接？
- [ ] 归档是否只做了搬移、插入同一日期行、重录 sidecar、修入站链接？是否改动了正文？
- [ ] `--write` 后是否又跑了普通校验？既有 seal 是否全部未变？
- [ ] Postmortem 是否三条件成立？执行摘要是否能在 30 秒内读懂？每个护栏是否落在可失败的具体层（配置校验/夹具拒绝/原生边界/装配路径）而不是只有文字？
- [ ] 新规则是否放在唯一归属层？证据是否可复算（门禁或前后测量）？新增/变更的验收规则是否有通过真实 runner 的负对照？例外是否窄、具名并留痕？
- [ ] 涉及扫描/政策实现的改动，是否取得领域所有者确认并把理由记录在该变更上？
- [ ] 证据是否真实运行？是否只跑了定向检查却宣称语料级通过？

## 18. 交叉域依赖 {#cross-domain}

- **rationale**：统一格式的理由与替代方案（`2026-07-05-uniform-agent-note-format`）、冻结归档的理由与替代方案（`2026-07-26-frozen-agent-note-archive`）应由 rationale 域承载；本域只引用结论与操作约束。
- **documentation**：双语三件套、语言切换、配对门禁、`.zh.md` 结构镜像、文档分层与预算归 documentation；本域只保留“归档 sidecar 与现行配对记录格式不同”的接口事实。
- **automation-ci**：`doc-sync`/`doc-quick` 聚合、lefthook 条件、CI 基线注入、required check 与分支保护归 automation；本域只声明证据入口。
- **testing**：守卫测试“必须能因目标回归失败”、负对照、聚焦证据选择归 testing；本域引用其规则。
- **collaboration**：评审职责、PR 模板与证据块、设计讨论而非自动否决归 collaboration。
- **agent-workflows**：常驻指令分层、skill 元数据、代理如何加载规则归 agent-workflows；本域只声明持久规则放哪一层。
- **engineering**：防守模式的具体技术规则（生命周期、所有权、性能证据等）归 engineering；本域只保留“规则准入与门禁偏好”。
- **supply-chain**：依赖面、workspace 协议、可选依赖、依赖目录与 `vendor/` 政策归 supply-chain；本域只把 `verify-package-dependencies`（含 `PACKAGE_DEPENDENCY_POLICY`）当作“机械强制 + 领域所有者确认例外”的例证。

## 19. 证据与未知（写作时） {#evidence-limits}

- 本参考基于对源文件的直接阅读与少量只读统计：活跃 Note 343 篇（implemented 293、proposed 42、rejected 8）；归档 924 个英文 Note（三件套共 2772 条 manifest 记录）、6 个 class。计数用于理解规模，不构成判据。**[已核对]**
- 未运行源仓门禁（BRIEF 要求作者阶段跳过 build/lint/test）；因此所有“门禁会通过/失败”的陈述来自代码阅读，不是执行证据。**[未执行]**
- 未在本域逐篇审计活跃 343 篇与归档 924 篇正文；源仓共 1267 篇英文 Note 已由 rationale 域按 `research/note-partitions.json` 的 15 个分区承接语义审计，本域只审计契约、门禁与代表性历史，覆盖报告记录抽样与结构性检查。**[边界/跨域]**
- 依赖扫描的完整语义（依赖面、workspace 协议、可选依赖）归 supply-chain 域；本域只把它作为“机械强制+领域所有者例外”的具体例证。**[跨域]**
- 未验证 GitHub 分支保护/ruleset 是否要求这些 check；仓库内无该配置。**[未知]**
- 未验证 `dsh-archive-agent-notes` 的 “restoring” 描述是否有未写出的恢复流程；正文只覆盖归档/删除判决。**[未知]**
- 作者阶段未验证源首次封印夹带正文修改是否被真实评审拦截；源校验器没有搬移前内容比对。目标现有补强及其局部实测与源事实分开记录，独立/平台证据仍缺。**[源结构性缺口/目标局部证据]**
- 未检查 `.agents/notes/README.zh.md` 与英文契约是否逐句一致；配对门禁声称检查结构，不证明语义。**[未检查]**

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `decisions-note-format`：`deepseek-harness/scripts/verify-agent-note-format.ts:1-94@687f282e`、`deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:1-31@687f282e`
- `decisions-supersession-audit`：`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:8-16@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:23-25@687f282e`
- `decisions-implemented-maintenance`：`deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:55-55@687f282e`
- `decisions-delete-keep-archive`：`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:18-29@687f282e`、`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:31-52@687f282e`
- `decisions-archive-triplet`：`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:54-62@687f282e`、`deepseek-harness/scripts/archived-agent-notes.ts:118-183@687f282e`
- `decisions-frozen-archive-trust`：`deepseek-harness/scripts/archived-agent-notes.ts:1-204@687f282e`、`deepseek-harness/scripts/archived-agent-notes.spec.ts:25-153@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:146-186@687f282e`、`deepseek-harness/lefthook.yml:13-15@687f282e`
- `decisions-postmortem-admission`：`deepseek-harness/docs/postmortem/README.md:1-18@687f282e`、`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:1-40@687f282e`、`deepseek-harness/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:1-47@687f282e`、`deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:1-53@687f282e`、`deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:1-55@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:1-40@687f282e`
- `decisions-durable-rule-admission`：`deepseek-harness/docs/defensive-patterns/package-surface.md:115-123@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:353-358@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:428-437@687f282e`
- `decisions-gate-wiring`：`deepseek-harness/package.json:122-130@687f282e`、`deepseek-harness/package.json:198-198@687f282e`、`deepseek-harness/scripts/run-gates.ts:805-882@687f282e`、`deepseek-harness/lefthook.yml:1-49@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:140-190@687f282e`
- `decisions-reference-integrity`：`deepseek-harness/scripts/verify-md-links.ts:14-40@687f282e`、`deepseek-harness/scripts/doc-typecheck.ts:205-212@687f282e`
