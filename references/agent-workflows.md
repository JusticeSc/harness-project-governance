# agent-workflows：DeepSeek Harness 代理工作流治理迁移参考

本文件是 `agent-workflows` 域的自包含操作参考。来源固定为 `deepseek-harness/` 的提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e`。

本域拥有：代理指令拓扑、技能入口与路由、常驻命令（standing orders）、入门与贡献边界、任务开工与评审、推送与历史改写、PR 栈的评审修复与落地、Agent Note 交接与归档、以及各专项工作流（UI/美术/浏览器证据/翻译/provider/性能/简化/文档/测试可靠性/升级指南/技能维护）的**入口与执行编排**。

本域不重复拥有各专业领域内部规则的全部细节。凡标注 `【跨域】` 的机制，本文件只保留其触发点、入口、交接信号和与其他工作流的接口；机制本体（例如文档预算算法、测试分层细节、发布流水线、供应链策略）由对应域负责。迁移时必须同时迁移被引用域，或显式记录未迁移依赖。

---

<a id="aw-00"></a>
## 0. 适用边界与真实性分级

每条机制在正文中使用三种标签：

- `【源义务】`：源仓库中可定位的强制规则、门禁、脚本行为或已冻结约定。必须保留其效果；若目标仓库条件不满足，保留知识并写明重新激活条件。
- `【源事实】`：源仓库的现状描述、示例、阈值或历史证据。迁移时可参数化，但不得伪造为通用保证。
- `【迁移设计】`：本参考为落地而补充的做法，源仓库没有等价物，或只有部分等价物。不得声称源仓库已实现。

源仓库没有集中式工作流清单文件。工作流由四层叠加而成：根 `AGENTS.md` 的常驻命令、子目录 `AGENTS.md` 的局部规则、`.agents/skills/*/SKILL.md` 的场景技能、`docs/` 与 `.agents/notes/` 的权威说明。任何迁移如果只复制技能目录而丢掉指令层级或门禁，都属于**降级**：技能会变成无强制力的建议。

**证据限制。** 本文件基于提交 `687f282e` 的只读检查。行号以该提交为准；后续提交会漂移。文中标为 `planned` 的验证项均未在目标仓库执行，不得当作已通过的保证。

### 机制 ID 索引

现有 `aw-XX` 锚点保持可达；下表给出全文 27 个机制的稳定全 ID，供 `knowledge/agent-workflows.json` 的 `reference` 与外部验证器交叉引用。共享锚点的机制（`aw-10`、`aw-11`）在正文中按小节拆分。

| 机制 ID | 锚点 | 主题 |
|---|---|---|
| `agent-workflows-instruction-tiers` | `#aw-01` | 指令层级与常驻命令 |
| `agent-workflows-symlink-indirection` | `#aw-02` | 指令与技能入口的符号链接 |
| `agent-workflows-skill-catalog` | `#aw-03` | 19 条技能入口与支撑文件 |
| `agent-workflows-skill-invocation-policy` | `#aw-04` | 跨产品技能调用策略 |
| `agent-workflows-onboarding` | `#aw-05` | 入门、贡献边界与安装完成信号 |
| `agent-workflows-task-intake` | `#aw-06` | 任务开工、范围与证据 |
| `agent-workflows-code-review` | `#aw-07` | 代码评审工作流 |
| `agent-workflows-pre-push-evidence` | `#aw-08` | 推送前证据选择 |
| `agent-workflows-history-rewrite` | `#aw-09` | 历史改写保护 |
| `agent-workflows-stack-review-propagation` | `#aw-10` | PR 栈评审修复传播 |
| `agent-workflows-stack-landing` | `#aw-10` | PR 栈落地 |
| `agent-workflows-agent-note-lifecycle` | `#aw-11` | Agent Note 生命周期 |
| `agent-workflows-agent-note-archive` | `#aw-11` | Agent Note 归档冻结 |
| `agent-workflows-handoff` | `#aw-11` | 交接 |
| `agent-workflows-continuation-extension` | `#aw-11` | 用户要求的连续会话补充（非源义务） |
| `agent-workflows-ui-review` | `#aw-12` | UI/UX 与响应式 |
| `agent-workflows-artwork` | `#aw-13` | 官方插件美术与 catalog 准入 |
| `agent-workflows-browser-evidence` | `#aw-14` | 浏览器证据与 GIF |
| `agent-workflows-translation` | `#aw-15` | 翻译工作流 |
| `agent-workflows-provider-evidence` | `#aw-16` | Provider 真实 API 证据 |
| `agent-workflows-performance` | `#aw-17` | 性能工作流 |
| `agent-workflows-simplification` | `#aw-18` | 简化工作流 |
| `agent-workflows-documentation-entry` | `#aw-19` | 文档、散文与 CoT 入口 |
| `agent-workflows-test-and-error-review` | `#aw-20` | 测试可靠性、错误处理与 Cordis |
| `agent-workflows-upgrade-guide` | `#aw-21` | 升级指南 |
| `agent-workflows-skill-maintenance` | `#aw-22` | 技能维护与人类评审 |
| `agent-workflows-review-approval-gate` | `#aw-23` | 评审批准门 |

---

<a id="aw-01"></a> **机制声明的其余来源**（知识账登记、由本域作者在上述机制中核对，本节复核时未逐行重读）：`deepseek-harness/packages/AGENTS.md:1-29@687f282e`、`deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e`、`deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e`、`deepseek-harness/snapshots/session/agent-instructions/session.v2.jsonl:8-8@687f282e`


**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/context/agent-instructions/src/digest.ts:1-17@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/files.ts:1-149@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/files.ts:181-419@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/files.ts:420-430@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/files.ts:431-602@687f282e`

## 1. 指令层级、常驻命令与优先级

### 1.1 层级与归属

`【源义务】` 文档层级由 `docs/AGENTS.md` 的“一层级一事实”表定义。与本域直接相关的层级：

| 层级 | 职责 | 不允许放入 |
|---|---|---|
| 根 `AGENTS.md` | 常驻命令：每次会话都需要在上下文中的规则，每条一到三行，链接其权威主页 | 故事、完整示例、情境化流程、从被链接主页复述的内容 |
| 子树 `AGENTS.md`（`packages/`、`docs/`、`.agents/notes/`、`.github/`、`snapshots/`、`benchmarks/`、`scripts/`） | 仅该子树特有的命令 | 根文件已承载的全仓规则 |
| `.agents/skills/` | 可复用工作流与专项决策标准 | 产品与运行时契约（应去 docs 或源码） |
| `docs/` | 当前状态说明、教程、参考、cookbook | 决策理据（去 Agent Notes） |
| `.agents/notes/` | 决策记录：为什么、放弃了什么、如何验证 | 迁移计划、验收清单、fixture 走查 |

来源：`deepseek-harness/docs/AGENTS.md:15-37@687f282e`，`deepseek-harness/AGENTS.md:1-185@687f282e`。 来源：deepseek-harness/AGENTS.md:1-185@687f282e 来源：deepseek-harness/docs/AGENTS.md:1-77@687f282e 来源：deepseek-harness/packages/AGENTS.md:1-29@687f282e 来源：deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e 来源：deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e 来源：deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e 来源：deepseek-harness/packages/context/agent-instructions/README.md:34-40@687f282e 来源：deepseek-harness/snapshots/session/agent-instructions/session.v2.jsonl:8-8@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/digest.ts:1-17@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:1-149@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:181-419@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:420-430@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:431-602@687f282e 来源：deepseek-harness/packages/bundle/web-app/presets/standard.patch.yml:15-18@687f282e

### 1.2 优先级与加载语义

`【源义务】` 运行时把工作区指令渲染为一条 `user/message` 基线，`source.kind = "agent-instructions"`、`baseline: true`，包裹在 `<system-reminder>` 中。渲染文本明确：

> More specific instructions take precedence over broader ones. They do not override system, developer, or direct user instructions.

即：**更具体的文件优先于更宽泛的文件；任何工作区指令都不能覆盖 system/developer/直接用户指令。**

加载顺序：先用户全局链（`$DSH_HOME/AGENTS.md`，再 `<agentsHome>/AGENTS.md`），再项目链（项目根到会话工作目录，由宽到具体）。同一候选组内，去除首尾空白后内容相同的文件只渲染一次，因此 `CLAUDE.md` 复制 `AGENTS.md` 不会重复。

默认候选：基础文件 `AGENTS.md`、`CLAUDE.md`；本地叠加 `AGENTS.local.md`、`CLAUDE.local.md`。项目根由 `.git` 标记。来源：`deepseek-harness/packages/context/agent-instructions/README.md:34-40@687f282e`、`deepseek-harness/packages/context/agent-instructions/README.md:66-68@687f282e`、`deepseek-harness/snapshots/session/agent-instructions/session.v2.jsonl:8@687f282e`。

**操作含义。** 不要靠“再加一个更长的根文件”解决局部问题；把规则放到最近的子树 `AGENTS.md`，并在根文件留一到三行和链接。也不要利用“具体覆盖宽泛”写出与根规则冲突的子树规则而不说明例外。

### 1.3 常驻命令（standing orders）清单

`【源义务】` 根文件中的下列条目属于本域可执行的常驻命令。迁移时必须逐条判定：保留、参数化、或声明不适用。

- 改 `packages/` 前读 `docs/architecture.md`；文档遵循 `docs/AGENTS.md`（`AGENTS.md:3`）。
- 公开 API 为 pre-stable；更新每一个消费者（`AGENTS.md:7`）。
- 每个外部可感知的破坏性变更**立即**写入升级指南，不推迟到发版准备（`AGENTS.md:11`，`dsh-create-upgrade-guide/SKILL.md:10-20`）。
- 失败时只在凭据、网络、IPC、watch 或嵌套沙箱被拦截时，用“最窄的主机提权”原样重试；必须有沙箱证据；禁止绕过测试失败或产品沙箱（`AGENTS.md:109-112`）。
- 推送前遵循 `dsh-pre-push-checks`，只报告实际运行过的命令（`AGENTS.md:115`）。
- 证据与改动面对齐：聚焦行为测试、模型/用户输出快照、文档用 `doc-sync`、发布路径用构建后 smoke、provider 用真实 API e2e；不要默认跑全量，也不要为提交/推送重复已通过的检查（`AGENTS.md:117-119`）。
- 完成声明前运行 `build:check`（在最新 `build:artifacts` 之后）或 `build`（`AGENTS.md:120`）。
- Web 浏览器自动化与 GIF 录制使用 `pnpm dsh web --patch apps/web/tests/pin-browse-picker.overlay.yml`，仅当显式测试原生 picker 行为时才省略（`AGENTS.md:121`）。
- 错误处理遵循 `dsh-error-handling`（`AGENTS.md:149`）。
- 注释保持局部；不复述代码、不扩展无关注释（`AGENTS.md:150-151`）。
- 官方插件图标使用 `dsh-official-plugin-artwork`，新字形落地前取得设计者批准（`AGENTS.md:156`）。
- 客户端 UI 文案由 locale 拥有；`verify-client-ui-i18n` 拒绝硬编码文案（`AGENTS.md:157`）。
- 每个非平凡的模型/产品用户可见变更更新无密钥录制的 session 快照；顶层 `snapshots/` 只给 session 驱动用例（`AGENTS.md:158-160`）。
- 一个 PR 只允许一个 `kind/*` 标签、覆盖所有实质面的 `area/*`、以及原生 Issue Type（`AGENTS.md:163`）。
- 文件以恰好一个尾随换行结束；`git diff --cached --check` 在 pre-commit 把关（`AGENTS.md:165`）。
- 可机械检查的不变量接入实际执行的顶层检查，每条变更验收路径证明拒绝无效用例，例外窄且有理由；具体执行程序由[持久规则准入](decisions.md#durable-rule-admission)拥有（`AGENTS.md:175`）。

### 1.4 预算与瘦身

`【源义务】` 常驻文档有词数上限，由 `scripts/doc-budgets.manifest.json` 与 `pnpm run verify-doc-budgets` 执行。门禁变红时按固定顺序处理：**先迁移**（内容属于别的层级就搬走，留一行链接），**再压缩**，**最后才提高上限**，并在 PR 中说明 manifest 差异。上限是护栏不是压缩目标；低于目标时保留至少 5% 余量。来源：`deepseek-harness/docs/AGENTS.md:49-59@687f282e`、`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`。

`【源事实】` manifest 当前硬上限：`AGENTS.md`2080、`docs/AGENTS.md`1430、`docs/architecture.md`2410、`docs/cordis-primer.md`600、`docs/testing.md`1350、`packages/AGENTS.md`810、`packages/README.md`994。`docs/AGENTS.md:59` 的默认子树写作目标是600词（packages810、docs1430、examples310有具名目标），architecture2400/testing1300与执行上限也不同；完整目标与升降限条件由[文档预算](documentation.md#prose-budgets)拥有。数字不同本身不证明漂移，目标数值不能静默升级为目标仓自动上限。

### 1.5 执行卡片

- **前置条件**：目标仓库有根指令文件；能决定“项目根标记”（源仓库用 `.git`）。
- **步骤**：建立层级 → 只写常驻命令 → 每条链接权威主页 → 设预算 → 接入预算门禁。
- **责任者**：仓库维护者（层级与预算）；每个子树所有者（子树文件）。
- **完成信号**：新人/代理能在一次会话内从根文件定位到所有强制规则的主页；预算门禁通过。
- **失败处理**：规则冲突时以更具体文件为准并显式写例外；预算超限按“迁移→压缩→提额”处理。
- **范围**：`vendor/` 的 prose/leakage 排除来自各专项技能，不是 `AGENTS.md:183-185` 的全仓豁免；该段实际要求固定上游、同步、维护补丁记录与 test/build，迁移程序由[supply-chain](supply-chain.md)拥有。`.agents/notes/archived/` 保留冻结历史边界，不据此豁免归档完整性检查。
- **证据限制**：源仓库未提供“根文件完整性”的机械检查；只有预算和链接检查。不要声称层级一定正确。

---

<a id="aw-02"></a> **机制声明的其余来源**（知识账登记、由本域作者在上述机制中核对，本节复核时未逐行重读）：`deepseek-harness/CLAUDE.md:1-1@687f282e`、`deepseek-harness/packages/CLAUDE.md:1-1@687f282e`、`deepseek-harness/vendor/CLAUDE.md:1-1@687f282e`、`deepseek-harness/.agents/notes/implemented/CLAUDE.md:1-1@687f282e`、`deepseek-harness/.claude/skills:1-1@687f282e`、`deepseek-harness/.agents/skills/agent-experience/SKILL.md:1-1@687f282e`、`deepseek-harness/snapshots/session/agent-instructions/workspace/AGENTS.md:1-1@687f282e`、`deepseek-harness/snapshots/session/agent-instructions/workspace/nested/AGENTS.md:1-1@687f282e`、`deepseek-harness/snapshots/AGENTS.md:9-17@687f282e`、`deepseek-harness/docs/i18n/README.md:46-66@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/agent-experience/SKILL.md:1-19@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/files.ts:156-158@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/files.ts:173-178@687f282e`、`deepseek-harness/packages/context/agent-instructions/src/digest.ts:20-24@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/README.md:1-115@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:422-459@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:819-835@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:129-165@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:214-236@687f282e`、`deepseek-harness/docs/config-catalog.md:3110-3114@687f282e`


**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/context/agent-instructions/src/files.ts:550-586@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:619-634@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:636-662@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:853-868@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:906-922@687f282e`

## 2. 指令间接层与符号链接

### 2.1 清单

`【源义务】` 源仓库用符号链接建立“一份内容、多个产品入口”。提交中全部符号链接（14 条）里与本域相关的有：

| 路径 | 目标 | 作用 |
|---|---|---|
| `CLAUDE.md` | `AGENTS.md` | 让 Claude Code 读取同一份根指令 |
| `packages/CLAUDE.md` | `AGENTS.md` | 包子树指令的 Claude 入口 |
| `vendor/CLAUDE.md` | `AGENTS.md` | vendor 子树指令入口 |
| `.agents/notes/implemented/CLAUDE.md` | `AGENTS.md` | implemented notes 子树入口 |
| `.claude/skills` | `../.agents/skills` | Claude Code 技能目录直指唯一技能源 |
| `.agents/skills/agent-experience/SKILL.md` | `../../../packages/preset/agent-preset/skills/agent-experience/SKILL.md` | 仓库技能目录暴露运行时 preset 内的同一技能，避免复制 |
| `snapshots/session/agent-instructions/workspace/AGENTS.md` | `AGENTS.canonical.md` | snapshot fixture 的指令别名 |
| `snapshots/session/agent-instructions/workspace/nested/AGENTS.md` | `AGENTS.canonical.md` | 嵌套 fixture 别名 |

来源：`deepseek-harness/CLAUDE.md:1@687f282e`、`deepseek-harness/packages/CLAUDE.md:1@687f282e`、`deepseek-harness/vendor/CLAUDE.md:1@687f282e`、`deepseek-harness/.agents/notes/implemented/CLAUDE.md:1@687f282e`、`deepseek-harness/.claude/skills:1@687f282e`、`deepseek-harness/.agents/skills/agent-experience/SKILL.md:1@687f282e`、`deepseek-harness/snapshots/session/agent-instructions/workspace/AGENTS.md:1@687f282e`。 来源：deepseek-harness/CLAUDE.md:1-1@687f282e 来源：deepseek-harness/packages/CLAUDE.md:1-1@687f282e 来源：deepseek-harness/vendor/CLAUDE.md:1-1@687f282e 来源：deepseek-harness/.agents/notes/implemented/CLAUDE.md:1-1@687f282e 来源：deepseek-harness/.claude/skills:1-1@687f282e 来源：deepseek-harness/.agents/skills/agent-experience/SKILL.md:1-1@687f282e 来源：deepseek-harness/snapshots/session/agent-instructions/workspace/AGENTS.md:1-1@687f282e 来源：deepseek-harness/snapshots/session/agent-instructions/workspace/nested/AGENTS.md:1-1@687f282e 来源：deepseek-harness/AGENTS.md:179-182@687f282e 来源：deepseek-harness/snapshots/AGENTS.md:9-17@687f282e 来源：deepseek-harness/docs/i18n/README.md:46-66@687f282e 来源：deepseek-harness/packages/preset/agent-preset/skills/agent-experience/SKILL.md:1-19@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:156-158@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:173-178@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/digest.ts:20-24@687f282e 来源：deepseek-harness/packages/context/agent-instructions/README.md:1-236@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:804-819@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:859-861@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:906-919@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/README.md:1-115@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:422-459@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:819-835@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:129-165@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:214-236@687f282e 来源：deepseek-harness/docs/config-catalog.md:3110-3114@687f282e 来源：deepseek-harness/packages/context/agent-instructions/src/files.ts:550-586@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:619-634@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:636-662@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:853-868@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:906-922@687f282e

### 2.2 操作规则

`【源义务】`

1. **编辑真实文件。** 根 `AGENTS.md:179-182` 明确：`CLAUDE.md` 在根和 `packages/` 符号链接到 `AGENTS.md`；编辑真实文件。不要在两个“副本”里各改一半。
2. **保持规则自包含同时链接高层文档。** 每条常驻命令能独立读懂；背景去链接。
3. **压缩到清晰仍成立为止；只有内容确实需要更多空间时才提高 `verify-doc-budgets` 上限。**
4. **不要把符号链接当目录复制。** 新增子树指令应先判断：它是否只是根规则的重复？若是，删掉；若是局部规则，创建真实 `AGENTS.md` 并（按产品需要）创建 `CLAUDE.md` 链接。
5. **删除/移动真实文件时同步链接。** 悬空链接不会让所有加载器报错，但会让某个产品静默丢失指令。

### 2.3 运行时去重与风险

`【源事实】` 指令加载器按“去空白后内容相同则只渲染一次”去重；实现用 `stat` / `fs.resolve` 跟随最终组件符号链接并读取目标内容（`deepseek-harness/packages/context/agent-instructions/src/files.ts:156-158,173-178@687f282e`、`src/digest.ts:20-24@687f282e`），因此 POSIX 上 `CLAUDE.md → AGENTS.md` 不会让模型看到两遍，且目标内容被加载（`packages/context/agent-instructions/README.md:34,222,225@687f282e`）。

`【源事实】` 技能 provider 同样跟随链接：目录 entry 分类用 `stat`，文件读取用 `realpath` + `readFile`；`parseSkillFile` 要求首行 `---` 的 YAML frontmatter，缺失时记录 `missing YAML frontmatter` 并跳过该技能（`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:804-819,859-861,906-919@687f282e`、`packages/skill/skill-filesystem/README.md:85@687f282e`）。`watchFollowSymlinks` 默认 true；关闭时只保留根链接的 `lstat` 语义（`src/index.ts:69-70,85-86,632-645@687f282e`）。

`【源限制】` 在 Windows `core.symlinks=false` 的检出中，Git 把链接写成普通文件，内容为目标路径字符串。源加载器没有 `lstat` 分支：`CLAUDE.md` 会被当作普通指令加载，模型看到的是 `AGENTS.md` 这一行路径而不是规则；技能 provider 因文件缺少 `---` frontmatter 而跳过 `agent-experience`，19 条入口中该条不会出现在模型目录，且只有日志警告、没有逐技能诊断（源实现未提供该诊断）。`.claude/skills` 变成普通文件，Claude Code 的发现行为不在本仓库，未验证。源仓库未提供跨平台链接检查或物化修复门禁；这些属迁移设计，不是已实现保证。

`【源事实】` 快照 fixture 用符号链接别名复用同一份 canonical 指令，并由 snapshot 语料门禁解析链接、校验声明的目标；该 lane 在 macOS 与 Linux 上运行（`snapshots/AGENTS.md:9-17@687f282e`）。

`【迁移设计】风险与处置`：

- **Windows / `core.symlinks=false`**：Git 会把链接物化为普通文件，内容为目标路径字符串。指令加载器会把 `CLAUDE.md` 的路径文本当普通指令读入；技能 provider 因缺 frontmatter 跳过 `agent-experience`；`.claude/skills` 不再是目录。处置：在 onboarding 检查 `git config core.symlinks`；在检出后运行“链接修复/校验”脚本；或对 Windows 采用生成副本并在 CI 校验内容一致。验证时必须读加载器实际内容，不能只检查文件存在。
- **归档/打包**：某些压缩或发布工具会解引用链接，导致同一内容出现两份并可能漂移。发布前校验链接仍为链接（`git ls-tree` 的 mode 为 `120000`）。
- **安全**：不要跟随指向 `vendor/` 的链接去编辑（`dsh-prose-standard/SKILL.md:14-27` 明确排除 `vendor/`，且“不要跟随符号链接进入 vendor”）。

### 2.4 执行卡片

- **前置条件**：确定目标仓库支持符号链接，或已决定替代方案。
- **步骤**：建立真实文件 → 建链接 → 加“链接模式”检查 → 在 Windows 路径上验证加载器实际读到的内容。
- **责任者**：仓库基础设施维护者；各子树所有者负责内容。
- **完成信号**：`git ls-tree` 显示预期 `120000`；加载器渲染出的指令只出现一次；Claude/Codex/dsh 三个入口都能读到同一规则。
- **失败处理**：链接被物化时，先修复检出而不是复制内容；无法修复时改用生成副本并加一致性校验。
- **例外**：`agent-experience` 链接指向运行时 preset 包，属于“单一内容两个消费面”，不要把它复制进技能目录。
- **证据限制**：源仓库未提供跨平台链接检查；Windows 上“路径文本被当指令/技能跳过”的行为有加载器实现依据，修复方案是迁移设计；Claude Code 的发现行为未在本仓库验证。

---

<a id="aw-03"></a> **机制声明的其余来源**（知识账登记、由本域作者在上述机制中核对，本节复核时未逐行重读）：`deepseek-harness/.agents/skills/.gitignore:1-1@687f282e`、`deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:1-65@687f282e`、`deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:1-68@687f282e`、`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:1-131@687f282e`、`deepseek-harness/.agents/skills/dsh-ci-test-reliability/references/ci-flake-diagnosis.md:1-60@687f282e`、`deepseek-harness/.agents/skills/dsh-client-ui-ux/SKILL.md:1-73@687f282e`、`deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-61@687f282e`、`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:1-132@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:1-78@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/review.md:1-67@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:1-87@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/style.md:1-49@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/website-sync.md:1-95@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/package-bundle.md:1-103@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/package-group.md:1-59@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/package-library.md:1-96@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/package-reference.md:1-103@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/persistence-change.md:1-73@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/persistence-format.md:1-25@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/persistence-release.md:1-30@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e`、`deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:1-30@687f282e`、`deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:1-65@687f282e`、`deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-45@687f282e`、`deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:1-127@687f282e`、`deepseek-harness/.agents/skills/dsh-official-plugin-artwork/SKILL.md:1-41@687f282e`、`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:1-137@687f282e`、`deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:1-81@687f282e`、`deepseek-harness/.agents/skills/dsh-prose-standard/references/examples.md:1-169@687f282e`、`deepseek-harness/.agents/skills/dsh-responsive-ui/SKILL.md:1-54@687f282e`、`deepseek-harness/.agents/skills/dsh-speed-up-perf/SKILL.md:1-92@687f282e`、`deepseek-harness/.agents/skills/dsh-trim-cot-leakage/SKILL.md:1-45@687f282e`、`deepseek-harness/.agents/skills/dsh-trim-cot-leakage/references/examples.md:1-275@687f282e`、`deepseek-harness/.agents/skills/dsh-trim-cot-leakage/references/recall-batteries.md:1-52@687f282e`、`deepseek-harness/.agents/skills/record-browser-gif/SKILL.md:1-172@687f282e`、`deepseek-harness/.agents/skills/record-browser-gif/scripts/encode_gif.py:1-337@687f282e`、`deepseek-harness/.agents/skills/record-browser-gif/scripts/test_encode_gif.py:1-103@687f282e`


**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:34-68@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:87-286@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:287-630@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:646-803@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:820-848@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:862-905@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:920-1006@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:184-421@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:465-818@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:849-922@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:1-124@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:166-213@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:237-489@687f282e`

## 3. 技能目录：19 条入口与支撑文件

### 3.1 目录布局与发现

`【源义务】` 技能是目录包：`<name>/SKILL.md`，名称 kebab-case（`^[a-z0-9]+(?:-[a-z0-9]+)*$`）。本地 provider 也接受扁平 `<name>.md`，但**不支持**递归 `**/SKILL.md` 发现。来源：`deepseek-harness/docs/subsystems/skills.md:83-91@687f282e`。

`【源义务】` 仓库内技能根为 `<projectRoot>/.agents/skills`，在本地 provider 的 rank 表中为 200；rank 100 是 `<projectRoot>/.dsh/skills`，300 是自定义目录，400/500 是用户目录，600 是打包目录。rank 小的优先；同一 rank 内按 provider 顺序、再按本地顺序。来源：`deepseek-harness/docs/subsystems/skills.md:64-82@687f282e`。

`【源事实】` `.agents/skills/.gitignore` 只忽略 `*/agents/openai.yaml`，即 Codex 的本地调用策略文件不入库；当前提交中没有任何已跟踪的 `agents/openai.yaml`。来源：`deepseek-harness/.agents/skills/.gitignore:1@687f282e`。

`【源义务，发现契约】` provider 只扫描每个 root 的**直接条目**：目录包解析 `<name>/SKILL.md`，扁平文件解析 `<name>.md`；每个文件必须能解析为 YAML 对象，`name` 为 kebab-case、`description` 非空。解析失败（包括缺失 frontmatter）的条目会记录警告并跳过，模型目录不会出现该技能；模型目录只渲染摘要，不渲染正文（`deepseek-harness/packages/skill/skill-filesystem/README.md:85@687f282e`、`src/index.ts:804-819@687f282e`、`docs/subsystems/skills.md:92-135@687f282e`）。

`【源事实，跨域】` `docs/subsystems/skills.md:151-352@687f282e` 描述 `ctx.skills` registry、`ctx.sessionSkillCatalog`、`skills/change` 事件与 Cordis API；完整 definition 不缓存，每次 `get()` 重读，非法候选会失效。这些是运行时接口，不是文件工作流义务；本域只依赖“非法/缺失候选失效”的语义。

### 3.2 入口总表（19 条，全部）

下表是提交 `687f282e` 下 `.agents/skills/` 的全部技能目录。`支撑文件` 列列出该技能自带的 references/templates/scripts。

`【源限制】` 表中的 `agent-experience/SKILL.md` 在 Git 中是 mode `120000` 的符号链接，指向 `packages/preset/agent-preset/skills/agent-experience/SKILL.md`。POSIX 检出中 provider 通过 `realpath` 读取目标；Windows `core.symlinks=false` 检出中该链接被物化为一行路径文本，缺少 frontmatter，provider 会跳过它——19 条入口在该平台上不会全部出现在模型目录。不要把“目录存在”当成“技能可发现”。

| # | 入口 | 触发（description 摘要） | 主要产出 | 支撑文件 | 关键依赖 |
|---|---|---|---|---|---|
| 1 | `agent-experience` | 写/改模型可见工具定义、技能、上下文加载、多步工作流时 | 信息可发现、上下文高效的设计判断 | 无（SKILL.md 为符号链接） | 运行时 preset |
| 2 | `cordis-styling-nitpicking` | 评审 Cordis 插件或从入口可达的 helper；生命周期审计 | 三条 P0 违规的实证报告 | 无 | `docs/cordis-tutorial/*`、`vendor/cordis/src/*` |
| 3 | `dsh-archive-agent-notes` | 新增、审计、修剪、归档、恢复或评审 Agent Notes | 活跃决策语料的删/留/归档分类与冻结操作 | 无 | notes README、archived AGENTS |
| 4 | `dsh-ci-test-reliability` | 设计/评审/诊断可能因 CI 并发、共享资源、时钟、全局状态、子进程、监听器或异步 teardown 而不确定的测试 | 隔离、分配、同步、超时、静默 teardown 规则 | `references/ci-flake-diagnosis.md` | `docs/testing.md`、`snapshots/AGENTS.md` |
| 5 | `dsh-client-ui-ux` | 新增/修改 `packages/client` 的产品可见 GUI 行为，或评审此类 PR | token、复用、反馈面、遮罩、平台窗口、加载态判断 | 无 | `packages/client/AGENTS.md`、`docs/web-styling.md` |
| 6 | `dsh-code-review` | 评审 deepseek-harness PR | 阻断项、人工检查、发现报告 | 无 | AGENTS、defensive-patterns、其他技能 |
| 7 | `dsh-create-upgrade-guide` | 变更破坏外部可感知面，或改动未发布升级指南已覆盖的面 | `docs/upgrade-guide/v<version>/<item>/guide.md` 三件套 | 无 | `dsh-doc/templates/upgrade-guide.md` |
| 8 | `dsh-doc` | 新建/重构/评审/审计/迁移 Markdown、包 README、文档站点 | 页面结构、kind、双语、站点发布、校验 | 5 个 references + 8 个 templates | `docs/AGENTS.md`、i18n 契约 |
| 9 | `dsh-error-handling` | 设计或评审失败、恢复、重试、后台任务、用户可见错误 | 类型化失败、处理所有权、可见报告 | 无 | 无 |
| 10 | `dsh-find-simplifications` | 寻找有证据的简化、写/合并提案、评估其他分支的简化 | 候选分类、可达性证明、提案骨架 | `references/historical-patterns.md` | 依赖策略、Agent Notes |
| 11 | `dsh-merging-stacked-prs` | 落地依赖链 PR 栈、合并 base 为另一开放 PR 的 PR | 官方 stack 链接、刷新、预检、`gh stack merge` | 无 | `gh stack`、AGENTS 历史规则 |
| 12 | `dsh-official-plugin-artwork` | 画/评审官方插件图标与可选特性预览 | 36×36 SVG、几何/字标/透明/导出规则 | 无 | 现有 artwork、`verify-package-meta` |
| 13 | `dsh-pre-push-checks` | 推送、强推、标记 ready、声称检查通过前；`gh stack sync` 之后 | 最小充分证据集、推送与失败处理 | 无 | `change-scope`、`docs/testing.md` |
| 14 | `dsh-prose-standard` | 写/评审/恢复/修剪/审计散文（Markdown、JSDoc、注释、prompt、诊断、CLI/UI 字符串） | 完整命题规则、按位置的最低覆盖、工作流 | `references/examples.md` | `dsh-doc`、`dsh-trim-cot-leakage` |
| 15 | `dsh-responsive-ui` | 设计/实现/评审响应式布局、截断、标题换行、纯图标控件、移动 hover/tooltip、宽度变化焦点 | 390px 验收、决策顺序、逐类规则 | 无 | 无 |
| 16 | `dsh-speed-up-perf` | 调查/优化性能、设计基准或 CI 性能门禁、剖析长 Session/Web 响应、把性能证据变为修复 | 测量卡、基准、回归证明、行为保持 | 无 | `benchmarks/AGENTS.md`、测试策略 |
| 17 | `dsh-translate-docs` | 用户显式按名调用时运行扩展双语工作流 | briefing 驱动的增量更新或整篇翻译 | 无 | `docs/i18n/*`、`gen-translation-brief` |
| 18 | `dsh-trim-cot-leakage` | 审计/修复“泄漏的推理轨迹”式散文 | 一条测试、8 类分类法、keep 规则、召回探针 | `references/examples.md`、`references/recall-batteries.md` | `dsh-prose-standard` |
| 19 | `record-browser-gif` | 被要求录制浏览器演示 GIF；每个改变产品可见 GUI 的 PR | 真实服务器/真实模型流程的 GIF + attach 发布 | `scripts/encode_gif.py`、`scripts/test_encode_gif.py` | 浏览器控制工作流、ffmpeg/ffprobe |

来源：上表 19 个 `SKILL.md` 的 frontmatter 与正文；逐条路径见 `knowledge/agent-workflows.json` 的 `sources`。技能内容文件：19 个 `SKILL.md` + 10 个 references + 8 个 templates + 2 个 scripts = 39 个；目录级 `.agents/skills/.gitignore` 另计，因此该目录在固定提交下共有 40 个受版本控制文件。

### 3.3 frontmatter 与路由

`【源义务】` 最小 frontmatter 是 `name` 与 `description`。`description` 是路由文本：它要说明“何时使用”和“覆盖什么”，因为模型会话目录只渲染 `name` 与 `description`，从不渲染正文或绝对路径（`docs/subsystems/skills.md:92-135@687f282e`）。

`【源事实】` 19 条中有 18 条只有 `name` + `description`；`dsh-translate-docs` 额外声明：

```yaml
disable-model-invocation: true
user-invocable: true
```

来源：`deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-8@687f282e`。 来源：deepseek-harness/.agents/skills/.gitignore:1-1@687f282e 来源：deepseek-harness/.agents/skills/agent-experience/SKILL.md:1-1@687f282e 来源：deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:1-65@687f282e 来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:1-68@687f282e 来源：deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:1-131@687f282e 来源：deepseek-harness/.agents/skills/dsh-ci-test-reliability/references/ci-flake-diagnosis.md:1-60@687f282e 来源：deepseek-harness/.agents/skills/dsh-client-ui-ux/SKILL.md:1-73@687f282e 来源：deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-61@687f282e 来源：deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/SKILL.md:1-132@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:1-78@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/review.md:1-67@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:1-87@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/style.md:1-49@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/website-sync.md:1-95@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/package-bundle.md:1-103@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/package-group.md:1-59@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/package-library.md:1-96@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/package-reference.md:1-103@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/persistence-change.md:1-73@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/persistence-format.md:1-25@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/persistence-release.md:1-30@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e 来源：deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:1-30@687f282e 来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:1-65@687f282e 来源：deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-45@687f282e 来源：deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:1-127@687f282e 来源：deepseek-harness/.agents/skills/dsh-official-plugin-artwork/SKILL.md:1-41@687f282e 来源：deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:1-137@687f282e 来源：deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:1-81@687f282e 来源：deepseek-harness/.agents/skills/dsh-prose-standard/references/examples.md:1-169@687f282e 来源：deepseek-harness/.agents/skills/dsh-responsive-ui/SKILL.md:1-54@687f282e 来源：deepseek-harness/.agents/skills/dsh-speed-up-perf/SKILL.md:1-92@687f282e 来源：deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-74@687f282e 来源：deepseek-harness/.agents/skills/dsh-trim-cot-leakage/SKILL.md:1-45@687f282e 来源：deepseek-harness/.agents/skills/dsh-trim-cot-leakage/references/examples.md:1-275@687f282e 来源：deepseek-harness/.agents/skills/dsh-trim-cot-leakage/references/recall-batteries.md:1-52@687f282e 来源：deepseek-harness/.agents/skills/record-browser-gif/SKILL.md:1-172@687f282e 来源：deepseek-harness/.agents/skills/record-browser-gif/scripts/encode_gif.py:1-337@687f282e 来源：deepseek-harness/.agents/skills/record-browser-gif/scripts/test_encode_gif.py:1-103@687f282e 来源：deepseek-harness/docs/subsystems/skills.md:64-150@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/README.md:1-115@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:804-819@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:906-919@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:34-68@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:87-286@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:287-630@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:646-803@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:820-848@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:862-905@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:920-1006@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:184-421@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:465-818@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:849-922@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:1-124@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:166-213@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem-watcher.spec.ts:237-489@687f282e

`【源义务】` 调用策略必须区分**原始 frontmatter 键**与**归一化字段**，两者不是同一组布尔：

- 原始键：`disable-model-invocation` 缺省或 `false` 时模型可调用，只有 `true` 禁用；`user-invocable` 缺省或 `true` 时用户可调用，只有 `false` 禁用。解析在 `parseInvocationPolicy` 中完成：缺省返回 `undefined`，再分别用 `disableModelInvocation !== true` 与 `userInvocable !== false` 得到归一化值（`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:1007-1016,1025-1026@687f282e`）。
- 归一化字段：`{ modelInvocable, userInvocable }` 保留四种组合；`{true,false}` 是 model-only，`{false,true}` 是 user-only，`{false,false}` 只对可信 `ctx.skills.get()` 调用者可见，`{true,true}` 两者都可（`deepseek-harness/docs/subsystems/skills.md:128@687f282e`）。
- `docs/subsystems/skills.md:128` 的 “defaults omitted fields to true” 指**归一化后的两个字段**，不是原始 `disable-model-invocation`；原始 `disable-model-invocation` 缺省是 `false`（不禁用）。
- **禁止把“两个原始键都写 `false`”当成 trusted-only**：原始 `disable-model-invocation: false` + `user-invocable: false` 归一化为 `{true,false}`（model-only）；trusted-only 对应原始 `disable-model-invocation: true` + `user-invocable: false`。

`dsh-translate-docs` 声明 `disable-model-invocation: true`、`user-invocable: true`，归一化为 `{false,true}`（user-only / 手动调用），与其“只在用户显式按名调用时运行”一致（`deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-8@687f282e`）。

### 3.4 技能间引用图与循环

`【源事实】` 从各 `SKILL.md` 提取的技能到技能链接（仅 `../<skill>/SKILL.md` 形式）：

```text
dsh-code-review            -> cordis-styling-nitpicking, dsh-ci-test-reliability,
                              dsh-client-ui-ux, dsh-error-handling, dsh-prose-standard
dsh-pre-push-checks        -> dsh-ci-test-reliability
dsh-ci-test-reliability    -> dsh-pre-push-checks
dsh-speed-up-perf          -> dsh-ci-test-reliability, dsh-pre-push-checks
dsh-find-simplifications   -> dsh-archive-agent-notes, dsh-pre-push-checks, dsh-prose-standard
dsh-doc                    -> dsh-create-upgrade-guide, dsh-find-simplifications,
                              dsh-prose-standard, dsh-trim-cot-leakage
dsh-prose-standard         -> dsh-doc, dsh-trim-cot-leakage
dsh-trim-cot-leakage       -> dsh-doc, dsh-prose-standard
dsh-client-ui-ux           -> dsh-error-handling, dsh-prose-standard, dsh-responsive-ui
dsh-official-plugin-artwork-> dsh-client-ui-ux, record-browser-gif
dsh-translate-docs         -> dsh-code-review, dsh-pre-push-checks, dsh-prose-standard
dsh-create-upgrade-guide   -> dsh-prose-standard
dsh-archive-agent-notes    -> dsh-pre-push-checks
```

`【源义务】` 这些环不是缺陷，而是**所有权切分**的结果：每个技能用一句“本技能拥有 X；Y 由某技能/文档拥有”把读者送到正确入口，而不是把对方内容抄一遍。例如：

- `dsh-pre-push-checks` 负责“选哪些命令”；`dsh-ci-test-reliability` 负责“测试是否可靠”（`dsh-pre-push-checks/SKILL.md:6-8,27-29`）。
- `dsh-prose-standard` 负责命题与覆盖；`dsh-doc` 负责放置、预算、双语；`dsh-trim-cot-leakage` 负责推理轨迹泄漏（`dsh-prose-standard/SKILL.md:6-12`）。
- `dsh-code-review` 负责评审编排；Cordis 生命周期、错误处理、CI 可靠性各有专主（`dsh-code-review/SKILL.md:12-28`）。

### 3.5 技能撰写契约

`【源义务】` 从 19 条技能中反复出现的硬性写法：

1. **声明“是指导，不是完整清单/脚本”。** `dsh-code-review:8`、`dsh-client-ui-ux:8`、`dsh-find-simplifications:8`、`dsh-prose-standard:12`、`dsh-trim-cot-leakage:8`、`dsh-speed-up-perf:8` 都显式声明。作用是防止后来者把技能当门禁，用手工照单勾选替代语义判断。
2. **指定必读背景。** `dsh-trim-cot-leakage:8` 用 `**REQUIRED BACKGROUND:**` 指向 `dsh-prose-standard`；`dsh-doc` 指向 `docs/AGENTS.md`、`notes/README.md`、`i18n/README.md` 与根 `AGENTS.md`（`dsh-doc/SKILL.md:87-94`）。
3. **单一事实主页。** 技能不复制产品契约；它链接 `docs/`、包 README、源码或 Agent Note。`docs/AGENTS.md:34` 明确技能层“不承载产品与运行时契约”。
4. **引用深度为一跳。** `dsh-doc` 明确“每个 reference 直接从本文件链接，因此技能没有深层引用链”，并给出“只加载当前任务需要的 reference”的规则（`dsh-doc/SKILL.md:103-116`）。
5. **触发句用“何时使用”。** 19 条 description 几乎都以 `Use when` / `Use during` / `Use before` / `Manually run` 开头或包含明确场景。
6. **局部规则带适用边界。** `dsh-official-plugin-artwork` 声明“不适用于工具栏或动作图标”；`dsh-responsive-ui` 声明 390px 以下可放宽；`dsh-translate-docs` 声明只在用户按名调用时运行。
7. **例外显式化。** `vendor/` 与 `.agents/notes/archived/` 在 `dsh-prose-standard` 与 `dsh-trim-cot-leakage` 中被排除，并要求把排除放在 include 之后，防止后续 include 重新纳入。

### 3.6 执行卡片

- **前置条件**：目标产品能发现 `<root>/.agents/skills`，或能配置等价根；技能名唯一。
- **步骤**：建 19 条入口（或按目标仓库裁剪并记录缺失）→ 写路由 description → 写“本技能拥有/不拥有”句 → 把 references 放在下一层并只从 SKILL.md 链接 → 加调用策略 → 加元数据门禁。
- **责任者**：技能所有者（内容）；仓库维护者（目录与门禁）。
- **完成信号**：模型目录只读取 `name`/`description` 就能选对技能；每个技能能在不读源码的情况下完成其场景；无技能复制产品契约。
- **失败处理**：技能被误当门禁时，补“guidance, not a checklist”并把强制项移到真实门禁；技能过长时，把细节下沉到一跳 reference。
- **例外**：`agent-experience` 是符号链接，内容属于运行时 preset；不要在 `.agents/skills` 内编辑它。
- **证据限制**：源仓库没有“技能内容正确性”的自动检查，只有调用元数据、文档标准测试与预算。技能中的判断仍需评审。

---

<a id="aw-04"></a> **机制声明的其余来源**（知识账登记、由本域作者在上述机制中核对，本节复核时未逐行重读）：`deepseek-harness/docs/subsystems/skills.md:119-129@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:1007-1016@687f282e`、`deepseek-harness/scripts/verify-skill-invocation-metadata.spec.ts:1-53@687f282e`、`deepseek-harness/scripts/run-gates.ts:851-858@687f282e`


**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:804-848@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/src/index.ts:1019-1044@687f282e`、`deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:314-378@687f282e`

## 4. 技能调用策略的跨产品一致性

`【源义务】` `scripts/verify-skill-invocation-metadata.ts` 在存在 `agents/openai.yaml` 的技能目录上检查：

- `SKILL.md` 必须以 YAML frontmatter 开始且闭合；
- `disable-model-invocation` 与 `user-invocable` 若存在必须是布尔；
- `agents/openai.yaml` 必须是 YAML 对象；
- `policy.allow_implicit_invocation` 若存在必须是布尔；
- Claude Code 的 manual-only（`disable-model-invocation === true`）必须与 Codex 的 manual-only（`allow_implicit_invocation === false`）**双向一致**；
- manual-only 技能必须仍 `user-invocable`（不能把两个入口都关死）。

来源：`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:44-105@687f282e`。 来源：deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-8@687f282e 来源：deepseek-harness/docs/subsystems/skills.md:119-129@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:1007-1016@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:1025-1026@687f282e 来源：deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e 来源：deepseek-harness/scripts/verify-skill-invocation-metadata.spec.ts:1-53@687f282e 来源：deepseek-harness/.agents/skills/.gitignore:1-1@687f282e 来源：deepseek-harness/scripts/run-gates.ts:851-858@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:804-848@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/src/index.ts:1019-1044@687f282e 来源：deepseek-harness/packages/skill/skill-filesystem/tests/skill-filesystem.spec.ts:314-378@687f282e

`【源义务，范围限定】` 上述 manual-only 检查只遍历**存在 `agents/openai.yaml` 的技能目录**（`skillDirectories` 过滤），而该文件被 `.gitignore` 忽略；检查用原始键 `disableModelInvocation === true` 判定 Claude manual-only，并在同一原始键 `userInvocable === false` 时报 `a manual-only skill must remain user-invocable`（`scripts/verify-skill-invocation-metadata.ts:95-103@687f282e`）。因此：

- 运行时本身支持 `{modelInvocable:false,userInvocable:false}` 的 trusted-only；但本仓库的跨产品门禁拒绝“manual-only + 用户入口关闭”的组合。不要把“运行时支持”与“本仓库门禁允许”混为一谈。
- 原始 `disable-model-invocation: false` + `user-invocable: false` 归一化为 `{true,false}`（model-only），既不是 manual-only，也不是 trusted-only。

`【源事实】` 该门禁只遍历“存在 `agents/openai.yaml`”的目录；而该文件被 `.gitignore` 忽略，所以在一个干净检出上它报告 0 对并通过。它防的是**本地生成策略后忘记同步**，不是仓库内容缺失；报告 0 对也不证明其余技能策略正确。失败示例由测试固定：`claude-only` 报 `Claude Code manual-only=true but Codex manual-only=false`，`codex-only` 反向（`verify-skill-invocation-metadata.spec.ts:38-51@687f282e`）。

`【源义务】` 该门禁属于 `doc-quick` / `doc-sync` 叶子门禁（`scripts/run-gates.ts:851-858@687f282e`）。

**执行卡片**

- **前置条件**：目标产品各自有“模型可自动调用/仅用户可调用”的开关。
- **步骤**：把每个技能的策略写成两个产品的等价声明 → 加一致性检查 → 在文档中写明 manual-only 技能必须保留用户入口。
- **责任者**：技能所有者；仓库维护者。
- **完成信号**：`verify-skill-invocation-metadata` 通过；手动抽查一个 manual-only 技能在两个产品中都不可被模型隐式选中。
- **失败处理**：任一方向不一致即失败；修正策略而不是删除检查。
- **例外**：没有 Codex 元数据的仓库可省略 Codex 侧，但必须记录“该保证不适用”。
- **证据限制**：干净检出通过不等于策略语义正确；测试只覆盖布尔映射。

---

<a id="aw-05"></a>
## 5. 入门、贡献边界与首次安装

`【源义务】` `CONTRIBUTING.md` 明确：项目早期，**当前不接受外部 pull request**。替代参与方式：在 GitHub Discussions 报告问题、给讨论投票、做生态插件并打 `dsh-plugin` topic、写博客/指南、回答社区问题。来源：`deepseek-harness/CONTRIBUTING.md:1-23@687f282e`。

`【源事实】` README 声明 developer preview，会有破坏性变更；从 npm 或源码运行；开发从 `docs/development.md` 与 `docs/architecture.md` 开始（`README.md:11-15,17-42,49-56@687f282e`）。

`【源义务】` 首次安装路径（`docs/development.md:9-53@687f282e`）：

1. Node.js 22.19+ 与 24+；CI 覆盖 22.19、24、26。
2. 启用 Node TypeScript type stripping；`NODE_OPTIONS` 含 `--no-experimental-strip-types` 会让构建脚本失败。
3. Corepack 启用的 pnpm，仓库 pin `pnpm@11.28.5`。
4. Git 2.26+；hook 安装启用 Git worktree-specific 配置扩展。
5. 可选 DeepSeek API key。
6. `pnpm install` 同时通过 `scripts/install-lefthook.mjs` 安装 worktree-local Lefthook hooks。
7. **完成信号**：`pnpm run typecheck` 成功退出。

**Windows 事实。** 可以在原生 Windows 或 WSL 2 开发；检出、依赖、工具链必须在同一操作系统环境；WSL 中把检出放在 Linux 文件系统，原生 Windows 放在 Windows 文件系统；跨文件系统访问会给 Git/安装/构建增加 I/O 开销；每个环境单独安装依赖；测试结果只对运行环境成立（`docs/development.md:17-23`）。

`【源实现案例，不是新增通用工具要求】` 根 `deepseek-harness/Makefile:1-35@687f282e` 只是入口短名：默认 `help`，`PNPM` 可覆盖、`ARGS` 默认空；build/clean 调用原 package scripts，Web/Desktop 与开发入口转发 `ARGS`。文件明确 package scripts 才是真源，文档同时介绍两类入口；帮助文本还区分 Web 接受 `dsh web` 参数、Desktop launcher 不接受参数。迁移时保留真实命令 owner 与参数边界，不复制一套独立“完成”定义，也不要求目标项目为复现产品案例而采用 Make、Web 或 Desktop。这里只实际读取配置，未启动原产品。

**执行卡片**

- **前置条件**：目标仓库决定是否接受外部贡献；若接受，改写 `CONTRIBUTING.md` 的“不接受 PR”段。
- **步骤**：写清入口 → 写清工具链与版本 → 写清首次安装 → 定义唯一完成信号 → 把 hook 安装纳入安装步骤。
- **责任者**：仓库维护者。
- **完成信号**：新贡献者按文档从零到 `typecheck` 通过，无需提问。
- **失败处理**：安装失败时先验证工具链版本与 type stripping；hook 缺失时运行 `node scripts/install-lefthook.mjs`；wrapper 报告陈旧锁或拒绝现有 Git 配置时按诊断与 Agent Note 处理，不要猜测性编辑 worktree 元数据。
- **例外**：没有外部贡献时，仍保留“如何报告问题/如何做生态”的入口，避免把“不接受 PR”写成“不欢迎反馈”。
- **证据限制**：源文档的完成信号只覆盖类型检查，不覆盖产品可运行；迁移时应补一个最小运行 smoke，但那是迁移设计。

---

来源：deepseek-harness/CONTRIBUTING.md:1-23@687f282e 来源：deepseek-harness/docs/development.md:9-53@687f282e 来源：deepseek-harness/docs/development.md:133-162@687f282e 来源：deepseek-harness/docs/development.md:196-205@687f282e 来源：deepseek-harness/README.md:11-15@687f282e 来源：deepseek-harness/README.md:17-42@687f282e 来源：deepseek-harness/README.md:49-56@687f282e

<a id="aw-06"></a>
## 6. 任务开工：范围、证据与权限

### 6.1 范围

`【源义务】` `dsh-prose-standard` 把“显式 scope”作为硬输入：缺少 scope 时报告所需输入并停止，**不得推断全仓范围**，也不得开始访谈（`dsh-prose-standard/SKILL.md:14-27`）。这条规则可推广到所有审计/评审类任务：先要范围，再动手。

`【源义务】` `dsh-find-simplifications` 区分“调查”与“实施授权”：调查不等于允许实施其提案；实现必须留在用户授权内（`dsh-find-simplifications/SKILL.md:8,55-64`）。`record-browser-gif` 把“录制”和“发布到 PR”分成两步，只有任务包含发布时才执行第二步（`record-browser-gif/SKILL.md:18-24`）。

### 6.2 变更范围工具

`【源义务】` 评审和推送前使用 `pnpm --silent run change-scope --base <verified-base-ref> [--head <ref>]`。它**从不猜测或抓取 base**；调用者必须提供从当前远端或栈状态验证过的 ref。报告是带版本号的 JSON，包含 `repositoryRoot`、`input`、`resolved`（base/head/merge-base SHA）以及 `committed`/`staged`/`unstaged`/`untracked` 路径。合并 base 变化后要重跑并重新评估受影响行为。

来源：`dsh-pre-push-checks/SKILL.md:10-26`、`dsh-code-review/SKILL.md:8`、`scripts/change-scope.ts:1-40@687f282e`。 来源：deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:14-27@687f282e 来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:8-16@687f282e 来源：deepseek-harness/.agents/skills/record-browser-gif/SKILL.md:18-24@687f282e 来源：deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:10-26@687f282e 来源：deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:8-10@687f282e 来源：deepseek-harness/scripts/change-scope.ts:1-50@687f282e 来源：deepseek-harness/AGENTS.md:109-112@687f282e

### 6.3 主机沙箱失败

`【源义务】` 只有当必需命令因沙箱阻止凭据、网络、IPC、watch 或嵌套 `sandbox-exec` 而失败时，才用**最窄的主机提权**原样重试；必须有沙箱证据；**绝不**用提权绕过测试失败或产品沙箱。来源：`AGENTS.md:109-112`。

### 6.4 执行卡片

- **前置条件**：有可验证的 base/head；有明确的用户范围。
- **步骤**：确认 scope → 验证 base/head → 跑 `change-scope` → 读报告 → 只读必要上下文 → 再改。
- **责任者**：执行代理；评审者复核 base/head。
- **完成信号**：报告中的路径集合与用户描述的范围一致；没有未解释的 dirty layer。
- **失败处理**：`change-scope` 失败时先验证 ref 是否存在/可解析；不要改用 `git diff` 猜 base。
- **例外**：纯调查任务可只读；不要为了“完整”扩大到无关分支。
- **证据限制**：`change-scope` 只列路径，不做语义判断；脏层仍需人工解释。

---

<a id="aw-07"></a>
## 7. 代码评审工作流（`dsh-code-review`）

### 7.1 前置条件

`【源义务】` 在评审前：验证并抓取 PR 的**实时 base 与精确 head**；运行 `change-scope`；读 diff 与足够上下文理解设计。retarget 或 merge 后重新建立 base 并重跑。来源：`dsh-code-review/SKILL.md:8`。

### 7.2 必读来源

`【源义务】` 先读要求，再判断 diff。按变更路径映射并打开每一份权威页面（`dsh-code-review/SKILL.md:10-28`）：

- 根 `AGENTS.md` 与 `packages/AGENTS.md`：常驻与包规则。
- `docs/defensive-patterns/`：按 artifact 分页；diff 触及哪页就读哪页。
- `docs/AGENTS.md`：文档放置与散文纪律。
- `dsh-prose-standard`、`dsh-ci-test-reliability`、`dsh-client-ui-ux`、`dsh-error-handling`：各自专项。
- `docs/testing.md`：测试层级与门禁。
- Agent Notes：设计理据；与笔记不一致是设计讨论，不是自动否决。
- 双语变更：`docs/i18n/translation-rules.md` 与 `terminology.md`；扩展翻译技能不在自动评审内，只由用户显式调用。

### 7.3 阻断项（blocking requirements）

`【源义务】` 六条硬阻断（`dsh-code-review/SKILL.md:30-38`）：

1. **新散文必须语义评审。** 自动检查不能证明覆盖、准确、放置、编辑质量。
2. **文档与代码同 diff。** 配置、默认值、错误、wire 字段、事件、公开行为要同时更新包 README 与 JSDoc；注释只写非显然契约；删除实现叙述、测试走查、评审历史、重复理据。
3. **核心类型文档同步。** spine/seam 词汇变化更新对应 subsystems 页面与 `type-equiv` 条目；内部类型不需要目录条目。
4. **Cordis 所有权与清理。** 触及 Cordis 插件或入口可达 helper 时，应用 `cordis-styling-nitpicking` 的三条 P0：单例状态、未反转副作用、清理依赖先于消费者完成；并验证 registry 贡献的 disposal 测试。
5. **证据存在。** 核实作者运行了相关本地检查；CI 覆盖穷尽矩阵；评审者补语义缺口。
6. **客户端文案由 locale 拥有。** 拒绝 JSX/模板/helper 返回/可访问性属性/原始默认值中的产品文案；要求 typed dictionary key、标准 `t` 座位或显式 localized props、`verify-client-ui-i18n`、每个受影响 locale 的行为证据；用户/模型/wire 数据与代码 token 原样保留。

### 7.4 人工检查

`【源义务】` 至少覆盖（`dsh-code-review/SKILL.md:39-58`）：

- 意图与接口契约：追踪每个改动接口的两侧；错误、取消、所有权、disposal。
- 错误处理：应用到改动失败路径与最终用户可见报告；拒绝 catch-and-continue，除非状态所有者证明后续前置条件成立。
- 生命周期与并发：发布前竞态、await 期间取消、独立错误报告、回调包含、重入前所有权、完整 detach、静默 disposal。
- 能力与消费者契合：追踪每个当前消费者；拒绝消费者特定行为泄漏进接口；也拒绝“泛型服务上只服务一个内部消费者的新公开方法”——应传私有能力闭包。
- 范围、所有权、必要性：每个抽象、状态机、选项、防御性拷贝、兼容路径都要映射到当前契约、生产消费者、拥有插件/服务。
- 配置与公开选择：每个默认值、公开操作集、格式、导入概念都要有当前消费者证据或先例；否则要求显式选择或推迟。
- 模型视角：检查模型实际收到的 prompt、tool schema、result、diagnostics；跨模式；稳定文本逐字验证，动态行为用快照或 e2e。
- 强制执行：沿每条拒绝路径追到真正执行的操作；测试直接与替代调用者，防止绕过 schema/prompt/facade/wrapper/listener 顺序。
- 借用与派生状态：每个保留值是借用还是拥有；通知、缓存、prompt、UI 回显、replay、查询视图追到文档化成功点与权威源。
- 边界覆盖最终结果：找到完整发出/保留结果的所有者（含 wrapper 与 metadata）；测极小/精确边界、超大单块、多字节文本。
- 真实入口：测试要走 shipped Loader、bin、worker、ACP bridge 或子进程；手挂插件抓不到非法 Loader 导出；函数插件必须命名导出且无 default export。
- 测试强度：断言必须在目标回归上失败；验证外部状态、日志、事件或 disposal，而不是复述实现或相信代理报告。
- 测试可靠性：资源、异步、平台敏感或 flaky 测试应用 `dsh-ci-test-reliability`。
- 负向控制：每个改动的验收规则都要有一个故意无效的用例经真实 runner 失败。
- 已实现 Agent Note 与 shipped 现实一致：实现 proposed note 时，同 diff 内改为现在时的 shipped 状态，并核对路径、名称、机制。
- 转录变更：编辑器/模型可见变化更新快照或解释为何不适用；expected-output diff 当行为变更读，不当格式噪声。
- 双语变更：两侧意义与术语都要比较；绿色 pairing hash 不证明翻译质量。

### 7.5 报告发现

`【源义务】` 陈述缺陷、位置、影响、证据。局部缺陷放在最紧的相关 diff 范围；跨切面架构/范围/评审综合用 PR 级评论。阻断项与建议分开；已由绿色门禁执行的问题省略。回复使用现有 thread。**收到评审时**：逐条核实，基于技术理由修复或反驳，不做表演性同意。来源：`dsh-code-review/SKILL.md:59-61`。

### 7.6 执行卡片

- **前置条件**：可读 PR、实时 base/head、`change-scope` 可运行。
- **步骤**：验证 ref → `change-scope` → 读来源 → 阻断项 → 人工检查 → 报告。
- **责任者**：评审者（结论）；作者（证据与修复）。
- **完成信号**：每条阻断项有明确通过/不通过；发现带有可复现证据；阻断与建议分开。
- **失败处理**：base/head 无法验证时停止评审；不要以“看起来是同一个分支”代替。
- **例外**：纯样式/无行为变更可缩短人工检查，但不能跳过散文与范围判断。
- **证据限制**：评审技能是指导，不是完整清单；它不能替代编译器、测试或 CI。

---

来源：deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-61@687f282e 来源：deepseek-harness/docs/defensive-patterns/README.md:1-25@687f282e 来源：deepseek-harness/docs/AGENTS.md:1-77@687f282e 来源：deepseek-harness/docs/testing.md:7-55@687f282e 来源：deepseek-harness/.github/pull_request_template.md:1-21@687f282e

<a id="aw-08"></a>
## 8. 推送前证据选择（`dsh-pre-push-checks`）

### 8.1 核心原则

`【源义务】` 在 `deepseek-harness` 分支上推送、强推、标记 ready、声称检查通过之前，运行**一次**相关本地证据。唯一的顺序例外是 `gh stack sync`：它可能在校验重写层之前级联 rebase 并发布；之后必须立即验证，且证据通过前不得合并。Git hook 故意很窄：pre-commit 修 staged lint、查 staged 空白、守 vendor 元数据；pre-push 只跑增量仓库 typecheck；CI 拥有穷尽覆盖与平台矩阵。来源：`dsh-pre-push-checks/SKILL.md:6-8`。

`【源义务】` “没有通用本地基线，只有 hooks”。每个行为变更需要能对其回归失败的最窄测试或专用检查；只有 diff 真正触达的面才加更广检查。**不要**因为提交/推送在即就重复已通过的检查；尤其不要为了重复 pre-push hook 而在推送前跑 typecheck。来源：`dsh-pre-push-checks/SKILL.md:27-29`、`docs/development.md:133-152`。

### 8.2 证据映射

`【源义务】` 按变更面选命令（`dsh-pre-push-checks/SKILL.md:30-52`）：

| 变更面 | 证据 |
|---|---|
| 包/脚本行为 | 所属 Vitest 文件或聚焦测试名；共享契约变化加相邻包测试；仓库级覆盖留给 CI，除非真正跨切面或用户要求 |
| Remote mock 类型 | 未构建的 `any` 是本地回退，不是严格证据；先重建缺失/陈旧/部分生成声明并跑 `pnpm run typecheck`；例外仅限[测试代理](package-contracts-2.md)的空声明map，不外溢生产Remote类型、ambient flag或复制签名 |
| 文档、Agent Notes、目录、文档链接注释 | `pnpm run doc-sync`；文档工作流要求时跑全量 lint |
| 模型/编辑器/CLI/终端可见输出 | 拥有该输出的聚焦无密钥快照或真实可运行示例场景 |
| expected-output 放置 | Session replay输入与持久输出放顶层 `snapshots/`并声明shipped profile/header pin；无Session往返的输出留 `tests/expected/`；规范父子文件名、代际和owning lane由[测试M16–M18](testing.md)拥有，不因统一称为snapshot就混放 |
| profile 与配置放置 | 跨包 shipped `dsh` profile 行为放 `apps/cli/tests/profiles/`；包特定 Loader 组合放该包 `tests/fixtures/`；用户可选 overlay 放 `apps/cli/config/examples/` 并配 `docs/user/` 指南 |
| 包清单、公开导出、构建配置、worker/bin 入口、构建后运行时路径 | `pnpm run build`、相关 hygiene、所属 built-artifact smoke |
| 仓库测试与脚本类型 | `build:artifacts` 只检查包项目；TypeScript 变更完成前在最新 `build:artifacts` 后跑 `build:check`，或跑 `build`；`build:check` 只读现有输出，不重建 |
| 真实 provider 或代理行为 | 有凭据时跑相关 `pnpm run test:e2e`；绝不打印 secret |

`【源义务】` 聚焦覆盖率时“选择测试”和“选择覆盖范围”是两件事：文件过滤只决定跑哪些测试，仓库配置默认测量所有 `packages/*/*/src/**/*.ts`。需要时同时指定 owning tests 与 `--coverage.include`；配置的 per-file 100% 阈值仍在所选范围内生效。`vitest related` 不能发现仅通过配置、动态加载、子进程、worker、构建产物或外部 provider 到达的行为，这些必须显式选测试。**不要**用 `--passWithNoTests`、降低阈值或缩窄 `--coverage.include` 来掩盖未覆盖文件。来源：`dsh-pre-push-checks/SKILL.md:53-75`。

`【源义务】` 参数转发：Vitest 文件与名称过滤直接跟在脚本名后，**不要**插入独立 `--`；那会传给 Vitest 并可能禁用 `-t`。例如：`pnpm run test:snapshot snapshots/session/headless.snapshot.ts -t 'cordis-inspect-jsdoc'`。把过滤后的运行当证据前先看报告选中的测试数。来源：`dsh-pre-push-checks/SKILL.md:44-51`。

### 8.3 失败处理

`【源义务】` 普通推送前相关检查失败：停止并修复或说明阻塞；不要推上去赌 CI 不同。post-sync 例外：阻止合并并执行修复流程。环境特定失败要证明：记录精确命令、失败测试、平台差异；确认相关非平台证据；优先修跨平台不确定性；只有用户明确要求/同意才绕过本地 hook，并报告失败内容与为何预期 CI 不同。来源：`dsh-pre-push-checks/SKILL.md:97-107`。

### 8.4 推送程序

`【源义务】` 普通与独立 rebase 推送（`dsh-pre-push-checks/SKILL.md:108-137`）：

1. 运行选定的相关检查一次。
2. 正常提交；检查 pre-commit fixer 改过的文件后再继续。
3. 正常推送；授权重写分支用精确 lease；让增量 typecheck hook 运行。
4. 验证远端 ref 与本地 `HEAD` 一致：`git rev-parse HEAD origin/$(git branch --show-current)`。
5. GitHub PR 推送后检查远端 CI：`gh pr checks`；pending 就报告 pending。

`【源义务】` 若 `gh pr checks` 报“no checks reported”且 `/actions/runs?head_sha=<sha>` 返回 `total_count: 0`，先读 mergeability：`gh pr view <number> --json mergeable,mergeStateStatus`。PR 处于 `CONFLICTING`/`DIRTY` 时 GitHub 不创建 `pull_request` workflow，所以缺失信号是冲突而不是基础设施。唯一修复是解决冲突；空提交、`--allow-empty`、draft/ready 切换、revert-and-restore 都不会让计数变成非零，只会增加垃圾历史。需要时用 `git merge-tree --write-tree HEAD origin/<base>` 确认冲突路径。

### 8.5 执行卡片

- **前置条件**：已提交或明确工作区状态；已选 base；知道 diff 触及的面。
- **步骤**：`change-scope` → 选最小证据 → 跑一次 → 提交 → 推送 → 验证远端 SHA → 看 CI。
- **责任者**：作者。
- **完成信号**：所选检查通过；远端 SHA 等于本地 HEAD；CI 状态被如实报告（passing/pending/skipped/failing）。
- **失败处理**：先修复；环境问题要证明；post-sync 失败阻止合并。
- **例外**：用户显式要求全量排练、诊断 CI 失败、或变更跨切面到没有更窄集合可信时，才跑完整本地近似；不要重建已删除的 `check:pre-push` 聚合。
- **证据限制**：本地通过不证明 CI runner 稳定；CI 通过不证明语义正确。

---

来源：deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:1-137@687f282e 来源：deepseek-harness/AGENTS.md:113-122@687f282e 来源：deepseek-harness/docs/development.md:133-162@687f282e 来源：deepseek-harness/docs/testing.md:7-25@687f282e 来源：deepseek-harness/scripts/change-scope.ts:1-50@687f282e

<a id="aw-09"></a>
## 9. 历史改写保护与 `gh stack sync` 后验证

`【源义务】` standalone 与 stacked PR 分支允许 rebase（含评审后）。独立历史重写前：抓取当前远端分支并记录精确 OID；用 `--force-with-lease=<branch>:<observed-oid>` 发布，使并发更新中止推送。`gh stack push` 与 `gh stack sync` 为其管理分支提供 lease 保护。**原始 `--force` 永不允许。** 来源：`dsh-pre-push-checks/SKILL.md:80-85`、`AGENTS.md:161-162`、`responding-to-pr-review-on-a-stack.md:7-14`。

`【源义务】` 任何重写推送后，重新抓取实时 heads，并重新审计未解决 review threads、approvals、mergeability、checks。重写前的 commit hash 与 inline-comment anchor 不是当前证据。来源：`dsh-pre-push-checks/SKILL.md:84-85`。

`【源义务】` `gh stack sync` 把 fetch、级联 rebase、push 作为一个操作，无法在校验与发布之间插入本地步骤。运行前要求干净 worktree，记录官方 stack 顺序与精确远端 heads。返回后（`dsh-pre-push-checks/SKILL.md:86-96`）：

1. 重新查询每个分支 head 与官方 GitHub stack 顺序。
2. 对每个重写层，对照其 live PR base 检查变更范围。
3. 对每个受影响层运行本技能选定的相关证据。
4. 所有选定检查通过前，保持每个 PR 未合并，并把验证报告为 pending。

若 post-sync 证据失败：保留 lease 保护的已发布 heads，修复失败，验证修复，再发布修正。**不要**因为命令成功就声称栈已 ready。

### 执行卡片

- **前置条件**：干净 worktree；已知官方栈顺序；已知远端 heads。
- **步骤**：记录 OID → 用 lease 重写 → 重取 heads → 重审 threads/approvals/mergeability/checks → 按层验证。
- **责任者**：作者；评审者复核重写后状态。
- **完成信号**：远端 heads 被记录且与预期一致；每层证据通过；未解决线程与批准状态是重写后的。
- **失败处理**：并发更新导致 lease 中止时，重新抓取并重新评估，不要覆盖；post-sync 失败时阻止合并。
- **例外**：`gh stack sync` 是唯一允许“先发布后验证”的顺序例外。
- **证据限制**：GitHub 的 stack/queue 状态可能异步；命令成功不等于分层落地完成。

---

来源：deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:80-96@687f282e 来源：deepseek-harness/AGENTS.md:161-162@687f282e 来源：deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:7-26@687f282e

<a id="aw-10"></a>
## 10. PR 栈：评审修复传播与落地

### 10.1 评审修复传播（`responding-to-pr-review-on-a-stack`）

`【源义务】` 基本规则（`responding-to-pr-review-on-a-stack.md:7-14`）：

1. **每个 PR 分支一个 worktree。** 并行修复不共享检出。
2. **GitHub 的 stack 对象是权威。** base 分支只建立期望依赖顺序；`PullRequest.stack` 与 `stackEntry.position` 证明 GitHub 认可它。没有检查这些字段就不要把“分支链匹配”当官方栈。
3. **修复落在引入问题的 PR，再向上流动。** 评论在 `B` 指向 `B` 引入的代码，就在 `B` 修，再把 `B` 传播到 `C`——即使 `C` 也含该文件。把修复起源在下游会让 `B` 继续发布未修复代码，并向 `B` 的评审者隐藏修复。
4. **每个评审修复保持独立提交。** 后续 rebase 可能改 OID，但不要把已评审修复 amend 出历史。只 amend 自己尚未推送、尚未评审的工作。
5. **有意选择 merge-forward 或 rebase。** 评审后两种历史都允许；重写推送必须 lease 保护并在远端前进时中止；原始 `--force` 禁止。

`【源义务】` 处理评论的步骤（`responding-to-pr-review-on-a-stack.md:15-26`）：

1. 先按实质 triage 每条评论；对照代码验证——评审者指出正确症状也可能误诊原因。
2. 把接受的发现映射到起源 PR 并在那里修。
3. 按顺序把修复层传播到每个受影响子层：merge-forward（合并修复后的父分支到子、验证、继续向上，保留进行中的 checkpoint）或原生级联 rebase（`gh stack rebase` → 验证重写层 → `gh stack push`；或 `gh stack sync`，因其可能先发布，需按 `dsh-pre-push-checks` 立即 post-sync 验证）。
4. **委派修复 trust-but-verify**：子代理报告描述意图，不必然等于落地内容。自己在真实树上重跑门禁；对回归 guard，证明它在未修复代码上**失败**（引入回归、看红、还原）——两边都通过的 guard 什么也没守。子代理把问题重述为“已处理”是要亲自深挖的信号。
5. 在 review thread 回复（`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`），不是顶层评论；说明修复与承载它的当前 commit/head。
6. 任何重写推送后，重读未解决线程、approvals、mergeability、checks。
7. 只通过官方栈程序落地。

### 10.2 栈落地（`dsh-merging-stacked-prs`）

`【源义务】` 通过 GitHub 原生 stack 对象与 `gh stack merge` 落地依赖 PR；**不要**用 `gh pr merge` + `gh pr edit` 逐个合并与重定向复制栈语义。根 `AGENTS.md` 拥有允许的 merge-forward/rebase 历史；stack review 指南拥有评审修复传播。来源：`dsh-merging-stacked-prs/SKILL.md:6-8`。

`【源义务】` 硬停条件（`dsh-merging-stacked-prs/SKILL.md:10-48`）：

- 运行 `gh stack --version`；官方扩展或服务端 stack 功能不可用 → 硬停；不得退化为手动合并。
- GitHub stacks 要求每个 head 分支在同一仓库；跨 fork 链 → 硬停。
- 用干净专用 worktree；抓取实时 PR 元数据与精确 head OID，不信分支名或早先报告。
- 对每个看似链中的至少一个 PR 查询 `PullRequest.stack` 与 `stackEntry.position`；官方对象而不是 base 推断才是栈成员权威。`size` 超过返回页时对 `entries` 分页。
- 从 live PR base 建立期望的 bottom-to-top 顺序：底部指向 trunk，每个更高 PR 指向紧邻其下的 head。

`【源义务】` 链接缺失成员（`dsh-merging-stacked-prs/SKILL.md:50-67`）：

1. 先比较已有 stack entries 与期望链。一个已有 stack 可能包含请求链的保序子集；多个 stack number、意外 entry 或冲突顺序需要用户指示后才能改动。
2. 若某依赖 PR 不在官方栈：精确比较每个 `author.login`。
3. 全部作者匹配 → 按 bottom-to-top 自动链接：`gh stack link --base <trunk> <bottom-pr> <next-pr> ... <top-pr>`。
4. 作者不同或任一作者不可得 → 改 GitHub 状态前询问用户。
5. 重新查询 GraphQL，要求一个 stack number、期望 trunk、完整 PR 集、期望 positions 与 base 链。
6. **永远不要**自动解散、重排或重建已有 stack；`gh stack link` 是追加式，已合并/已排队 entry 不能 unstack。

`【源义务】` 只在需要时刷新（`dsh-merging-stacked-prs/SKILL.md:68-76`）：不要因为有刷新机制就重写分支。当 live merge state 或仓库规则要求更新 trunk 时，二选一：

- **原生级联 rebase**：本地未跟踪时 `gh stack checkout <pr-or-stack>`，然后 `gh stack sync`；它可能在校验前 rebase + lease 保护强推每个活跃层，因此立即检查重写范围、对每层跑相关检查、通过前不合并。冲突时 `gh stack rebase` → 解决验证 → `gh stack push`。若 checkout 或 sync 报告本地/远端栈组成分歧，取消并询问，不要自动删除/重建远端栈。
- **增量 merge-forward**：把 trunk 合并进受影响最底分支，再 bottom-to-top 把每个更新后的父传入子并正常推送。进行中合并期间 base 前进时，先保留该 checkpoint 再合并更新 tip。

`【源义务】` 合并前预检（`dsh-merging-stacked-prs/SKILL.md:77-82`）：重新查询官方栈；要求每个选中 PR 为 open、非 draft、顺序正确、满足仓库评审与检查要求。独立对待每个 PR 状态；顶层 ready 不证明依赖 ready。“Land the stack”选择整个栈；部分落地必须显式指定边界 PR，并包含从底部到该边界的每一层。

`【源义务】` 通过栈 API 合并（`dsh-merging-stacked-prs/SKILL.md:83-100`）：

```sh
gh stack merge <stack-number> --yes --merge
# 或显式部分落地
gh stack merge <boundary-pr> --yes --merge
```

不要传 `--delete-branch`、手动 retarget 依赖、或逐 PR merge。GitHub bottom-up 合并选中范围，并重定向/rebase 剩余上层。直接 stack merge 是 all-or-nothing；trunk 使用 merge queue 时，GitHub 把选中范围一起排队但可能分成多个组落地。不要绕过合并要求；原生合并报阻塞时，在拥有该阻塞的 PR 内解决或停止报告，绝不退回 `gh pr merge`。

`【源义务】` 验证落地（`dsh-merging-stacked-prs/SKILL.md:101-118`）：等待每个选中 PR 报 `MERGED`；排队不等于完成。部分落地后重新查询官方栈，验证剩余 PR 仍按期望顺序链接并指向 trunk 或其下一层；重查 heads、review state、CI，因为 GitHub 可能已 rebase 剩余层。分支删除只在对应 PR 报 `MERGED` 后的独立最终阶段进行；删除前要求 GitHub 报告没有以该分支为 base 的开放 PR（`gh pr list --state open --base <branch> --json number --jq length` 必须为 `0`）。

### 10.3 执行卡片

- **前置条件**：原生 `gh stack` 可用；同仓库分支；干净 worktree；可读 GraphQL。
- **步骤**：查栈 → 链接（必要时）→ 只在需要时刷新 → 预检 → `gh stack merge` → 等 MERGED → 验证剩余栈 → 最后删分支。
- **责任者**：落地作者；评审者确认每层证据。
- **完成信号**：每个选中 PR `state == MERGED`；剩余上层仍是期望官方栈；删除分支前依赖数为 0。
- **失败处理**：扩展缺失/跨 fork → 硬停；作者不匹配 → 询问；冲突 → `gh stack rebase`；阻塞 → 在 owning PR 解决或停止。
- **例外**：部分落地需要显式边界。
- **证据限制**：GitHub stack 对象与 merge queue 状态是外部事实；本地无法完全模拟。跨 fork、Enterprise Server 等场景可能不支持原生栈。

---

来源：deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:1-32@687f282e 来源：deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:6-8@687f282e 来源：deepseek-harness/.agents/skills/dsh-merging-stacked-prs/SKILL.md:1-127@687f282e 来源：deepseek-harness/AGENTS.md:161-162@687f282e 来源：deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:27-32@687f282e

<a id="aw-11"></a>
## 11. 交接：Agent Notes、归档、维护者与委派

### 11.1 Agent Note 生命周期

`【源义务】` 路径编码两个轴：`{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`。生命周期为 `proposed/`、`implemented/`、`rejected/`；类为 `feature`、`bug-fix`、`simplification`、`architecture`、`process`、`testing`，该闭集由 `scripts/agent-note-tree.ts` 与分类门禁执行；新增类要同时更新规范集与本段。`architecture` 关于 shipped source 的结构决策；`process` 关于代码周围的工具/策略/工作流。日期是**首次提出**日期（按 git 历史）。来源：`.agents/notes/README.md:7-35`。

`【源义务】` 何时写：同一 PR 内，仅当代码、测试、现有文档无法解释的持久决策理据。实质未来工作从 `proposed/` 开始；已决定从 `implemented/` 开始。更新已有 owning note 即满足规则，不要重复创建。机械/局部编辑（含局部 UI 展示与交互）豁免。**Agent Note 永远不能被编辑成“另一个决定”**：用新 note 取代它，并交叉链接，除非旧 note 后来按合并规则完全合并。来源：`.agents/notes/README.md:44-53`。

上述“不能换成另一决策”不禁止事实维护：实现落点变动时同变更更新已有 owning Note，见[现状维护](decisions.md#implemented-maintenance)；完全取代才可按[合并条件](decisions.md#consolidation)保留独有理据后删除，partial 仍双向链接。归档后的验证与分类结果/边界词数报告由[门禁与证据链](decisions.md#gate-wiring)给出完整程序，不能以seal通过代替这些义务。

`【源义务】` **每个新 Agent Note 触发 supersession 检查。** 搜索活跃树中覆盖同一决策/机制/被拒替代的旧 note；分类完全或部分取代；同 PR 归档所有符合条件的 implemented 三件套；保留部分取代并交叉链接。来源：`.agents/notes/AGENTS.md:1-7`、`dsh-archive-agent-notes/SKILL.md:14-17`。

`【源义务】` 文件格式：前三行必须是 `# Agent Note: <title>`、空行、`Status: <status>`，且 Status 与生命周期目录一致。`proposed/` 骨架：`## Problem`、`## Proposal`、自定义节、`## Alternatives considered`、`## Acceptance criteria`、`## Risks`。`implemented/`：`## Problem`、`## Decision`、自定义节、`## Alternatives considered`、`## Consequences`；禁止 `## Proposal`、`## Plan`、`## Migration plan`、`## Acceptance criteria`。`rejected/` 保留提案时结构，裁决在 Status 行。`## Alternatives considered` 强制。来源：`.agents/notes/README.md:54-122`。

`【源义务】` 生命周期移动要同变更更新 Status 并重新满足目标目录骨架：`proposed → implemented` 把 `## Proposal` 改写为现在时 `## Decision`，把 Acceptance criteria/Risks 折入 `## Consequences`（或现在时 `## Testing`/`## Verification`），删除计划。`proposed → rejected` 只在 Status 加理由并冻结。来源：`.agents/notes/README.md:119-122`。

`【源义务】` 分类与删除（`dsh-archive-agent-notes/SKILL.md:18-30`）：

- **implemented — 删除**：只描述小 UI 调整或纯机械变更的完整三件套；修/删入链。局部 bug fix、性能、新能力、实质行为/所有权决策不因“实现小”而删除。先应用此判据，再做 keep/archive。
- **implemented — 保留活跃**：理据、替代、负保证、持久/wire 语义、所有权边界、安全规则、重新引入条件可能指导未来变更。判决策略，不判实现机制；长度无关。
- **implemented — 归档**：实质历史决策完整且不太可能指导未来，但历史理据仍值得保存。不归档符合直接删除判据的记录。
- **proposed — 永不归档**：活的提案保持活跃；不再值得推进就诚实拒绝并满足 rejected 格式。
- **rejected — 只作护栏保留**：失败的提案仍是诱人、有意义的错误，且 note 解释为何失败。
- **rejected — 删除**：想法过时、被取代、不再可行或不太可能防止重诉；修/删入链。

`【源义务】` 不按配额归档；检查范围内每个 note；类比组用一个原则分类；接近边界要判断并记录。

### 11.2 归档冻结

`【源义务】` 归档一个 implemented 三件套（`dsh-archive-agent-notes/SKILL.md:54-63`）：

1. 把完整 `foo.md`、`foo.zh.md`、`foo.i18n.yaml` 从 `implemented/<kind>/` 移到 `archived/<kind>/`；归档路径故意没有 `implemented`。
2. **不改正文。** 仅在两个语言文件的 `Status: implemented` 下插入同一日期 `Archived: YYYY-MM-DD`。
3. 为这两处元数据编辑机械重录 sidecar；不翻译、不重排、不更新事实、不修 note 内链接。标题标点、空行布局、语言切换措辞保持原样，不作为归档前提。
4. 搜索活跃散文的入链；重定向到当前权威、仅在有意引用历史时指向归档路径、或删除。**永远不要**验证或修复归档 note 的出链。
5. `pnpm run verify-archived-agent-notes --write`：append-only 模式先证明每个现有 seal 仍匹配，再加入新三件套哈希；随后运行普通 verifier。

`【源义务】` 封印后：永远不要编辑、移动、翻译、重排或删除。归档 note 仍是合法入链目标，但只是历史快照，不是当前行为权威。来源：`.agents/notes/archived/AGENTS.md:1-9`、`.agents/notes/README.md:36-43`。

`【源事实】` verifier 还要求归档根只含 `AGENTS.md` 与 `manifest.json`；kind 目录必须在闭集内；三件套完整；archive 元数据有效；存在针对 Figma 链接移除的三个精确 seal 例外（`scripts/verify-archived-agent-notes.ts:1-40@687f282e`、`.agents/notes/archived/AGENTS.md:9`）。

### 11.3 维护者交接

`【源义务】` `dsh-code-review` 由一个指定操作者用私有周期维护工具保持最新。工具在操作者机器上运行；产物在 `~/dsh-code-review-outputs/`，原始 adapter I/O 在私有临时目录；维护 worktree 每次运行后恢复干净。操作者对候选 diff 做最终决定：

- **Discard**：删除候选；下次运行会按当时技能重新考虑同一反馈。
- **Batch**：小更新可留待与未来候选合并；`master` 变化后重跑分析或手动 rebase + 重审。
- **Promote**：从干净 `master` 运行 helper；刷新 master、验证当前技能匹配记录的 source blob、应用保存的 diff、开 draft PR，body 列出 source feedback URL/ID、landed commit 范围、来源 run、检查、操作者编辑。技能漂移时停止而不覆盖更新指导。

不要逐字提交 adapter 输出；promotion 时的小编辑（收紧措辞、删只在源 PR 上下文有意义的例子、并入现有规则）是预期行为。`【源义务】` **交接给另一位维护者**：开一个取代当前 note 的后续 Agent Note——把机制移进仓库，或记录新操作者的私有设置。不要静默转移工具；“单维护者 bus factor”正是交接需要文档化决策的原因。来源：`docs/cookbook/maintaining-dsh-code-review.md:1-64`。

### 11.4 委派工作的 trust-but-verify

`【源义务】` 子代理报告描述意图，不必然是落地内容：在真实树上自己重跑门禁；对回归 guard 证明它在未修复代码上失败；子代理把问题重述为已处理是要亲自深挖的信号（`docs/cookbook/responding-to-pr-review-on-a-stack.md:24`）。这与 `docs/testing.md:33-35` 的“验证世界，而不是自我报告”一致：e2e 断言要重跑命令或外部重读文件；关键词探测代理自己的输出会让作弊代理通过。

`【迁移设计】` 在无 e2e 的工作流中，至少要求代理返回：实际命令、观察到的输出、未运行项与原因；并把“完成”声明与文件系统/远端状态分开核验。

### 11.5 Scratch 与 Dev Note

`【源义务】` `docs/scratch/` 存放受版本控制、会过期的讨论，必须能跨交接存活。每页写明 owner、创建日期、过期时间、晋升目标。本地一次性笔记保持忽略且不提交。来源：`docs/AGENTS.md` 所链接的 `dsh-doc/references/structure-hierarchy.md:55-60@687f282e`。

`【源义务】` 每个 authored 页面以 `Dev Note` 结束，并显式非权威：活跃假设、兼容性担忧、粗略替代、进度指针、未决问题可以放那里；稳定行为、必需限制、已接受理据属于普通 owner。工作关闭时：晋升耐久结论、把可复用理据移入 Agent Note、把事件时间线留在 postmortem、删除已解决的闲聊。空 Dev Note 写 `None.`，不积累占位散文。来源：`dsh-doc/references/structure-hierarchy.md:75-87@687f282e`。

### 11.6 用户要求的连续会话补充（非源义务）

`【迁移设计，非源义务】` 源仓库没有“新会话继续未完成任务”的通用协议；它依赖 Agent Notes、Dev Note、scratch 和 git 历史。若目标用户要求“刷新会话后继续”，必须作为**新增能力**明确标注，不得冒充源机制。最低可用设计：

1. 先复用项目已有唯一状态owner（任务板、Issue台账、交接文件等），不为本协议复制一份同权威记录；没有既有owner且按[Skill状态触发](../SKILL.md#3-改动型任务走同一循环)确需启用时，才建立可持久定位的任务状态文件。字段：owner、目标、当前分支/commit、已完成、未完成、阻塞、下一命令、证据路径、过期/复核日期；存储位置沿用项目权限与交接方式，不强制给既有owner另建版本控制副本。
2. 启用信号是跨上下文边界：用户要求继续/暂停/交接，压缩前保存，或同一目标确需多个会话或另一位执行者。单会话内的小改动，即使有多步验收，也不仅为“以后可能有用”而新建状态文件；用户明确要求初始化治理元数据时，初始化本身是任务。
3. 写入时机：任务暂停、交接、上下文压缩前；不是每步都写。
4. 读取时机：新会话开始时先读状态文件与 owning Agent Note，再读代码；不要只读聊天摘要。
5. 完成信号：状态文件中的“下一命令”可被独立执行；“未完成”项有明确 owner；当前请求已撤销的动作不在队列。
6. 失败处理：状态与实际 git/文件或用户当前请求不一致时，以仓库状态和当前请求为准并更新状态文件；不要用状态文件覆盖代码事实或复活已撤销动作。
7. 证据限制：这是迁移设计，源仓库未验证；不能用它声称源工作流具备连续会话保证。

### 11.7 执行卡片（交接）

- **前置条件**：存在需要跨 PR/跨人/跨会话保留的决策或状态。
- **步骤**：判断是否值得写 note → 查 supersession → 写/改 note → 同 PR 归档符合条件的三件套 → 修复入链 → 运行 verifier → 交接时写后继 note 或 handoff 状态。
- **责任者**：决策提出者（note）；归档者（冻结操作）；交接双方（后继 note/handoff）。
- **完成信号**：活跃语料中每个决策有唯一 owner；归档三件套封印；入链可解析；交接记录可执行。
- **失败处理**：格式门禁失败按生命周期骨架修；seal 不匹配时停止并调查，不要 `--write` 覆盖；归档 note 出链损坏不修（有意）。
- **例外**：机械/局部编辑、局部 UI 变更不写 note；已完全合并的旧 note 可按合并规则删除。
- **证据限制**：源仓库的自动检查只覆盖路径/类/格式/三件套/seal；语义“是否值得保留”仍需人判断。

---

来源：deepseek-harness/.agents/notes/README.md:7-125@687f282e 来源：deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e 来源：deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e 来源：deepseek-harness/scripts/agent-note-tree.ts:1-40@687f282e 来源：deepseek-harness/scripts/verify-agent-note-format.ts:1-40@687f282e 来源：deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e 来源：deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e 来源：deepseek-harness/.agents/skills/dsh-archive-agent-notes/SKILL.md:1-68@687f282e 来源：deepseek-harness/.agents/notes/README.md:36-43@687f282e 来源：deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e 来源：deepseek-harness/scripts/archived-agent-notes.ts:1-60@687f282e 来源：deepseek-harness/scripts/archived-agent-notes.spec.ts:1-60@687f282e 来源：deepseek-harness/docs/cookbook/maintaining-dsh-code-review.md:54-64@687f282e 来源：deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:15-26@687f282e 来源：deepseek-harness/docs/testing.md:33-35@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:55-60@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:75-87@687f282e 来源：deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:44-62@687f282e

<a id="aw-12"></a>
## 12. UI/UX 与响应式工作流

### 12.1 `dsh-client-ui-ux`

`【源义务】` 触发：新增/修改 `packages/client` 的产品用户可见 GUI 行为，或评审此类 PR。技能是指导，不是完整清单；它处理 lint/typecheck/i18n 门禁无法做的判断（`dsh-client-ui-ux/SKILL.md:6-14`）。

关键规则组（`dsh-client-ui-ux/SKILL.md:10-73`）：

- **架构前置**：Slot/props、响应式读取、导出、ctx、分层规则见 `packages/client/AGENTS.md` 与 `docs/defensive-patterns/client-components.md`。
- **视觉基础**：颜色/圆角/间距用现有 token；引入字面值前先搜索目标页与最近兄弟页；**每个颜色在明暗两主题都验证可读**；新增/修改特性 CSS 的字重上限 500（markdown 排版 token 例外）；字号从主题排版变量或页面既有比例选；图标/文本/相邻元素成比例对齐。
- **先复用**：扩展现有组件/容器/交互优先；图标来自现有图标库，新字形需设计者批准；右侧栏内容注册到现有 sidebar 的 slot；纯图标且含义不明显的动作加 Tooltip，需要悬停/选择才能读的信息用 HoverCard。
- **反馈面**：瞬时操作结果用应用级 Toast，且 toast 状态与渲染在比报告面更长寿的 host（如 `shell.overlay` 条目）中；失败操作保持数据可见；就地 notice 用于与面绑定的状态（查询失败 + Retry、表单字段校验）；错误文案用平实语言、最多两句；中文 notice 不超过两句时省略句号；notice 不得挤动布局。
- **加载态**：列表用 skeleton；其他页面级加载居中裸 spinner；不要角落 spinner；每页/组件一种加载处理；无必要时不加加载文字。
- **遮罩与菜单**：每个菜单/popover/tooltip 合并前验证可关闭（外部点击、可聚焦时 Escape）、适配视口（滑动/翻转、边缘留白、不来回振荡）、不被裁剪（逃逸 overflow 祖先与 containing block，必要时 portal 到 body，不被相邻元素覆盖）。滚动条留在容器内，用共享样式，验证不溢出、不被圆角/边缘裁剪，保留小 inset。
- **平台窗口**：macOS titlebar clearance 是 `--dsh-frame-top-clearance`，由 Menu/Modal/overlay 原语作为顶部安全边距消费；**永远不要**为修一个页面改全局变量；在页面自身 inset 上加 scoped `[data-platform='darwin']` 覆盖，并在页面样式 spec 中断言。评审时说明预期总偏移（clearance + page inset）。
- **间距**：审查每个改动区域的间隙；相邻元素不留无意贴边；平行元素优先对称；无法解释的一次性间隙通常意味着漏了共享值。
- **设计评审升级**：大幅 UI 变更或任何明显可感知的 UI/交互变更必须获得设计者或产品评审；没有该角色时建议从设计/产品评审者请求。源文列出 2026-09 roster，并要求成员变化时在此更新（`dsh-client-ui-ux/SKILL.md:71-73`）。

### 12.2 `dsh-responsive-ui`

`【源义务】` 规则（`dsh-responsive-ui/SKILL.md:8-54`）：

1. 主验收最小视口 390 CSS px；无意外重叠、裁剪、页面级横向滚动、主操作不可达；390px 以下可放宽。
2. 决策顺序：先调空间分配/换行 → 再考虑文本截断、纯图标、把图标移入 More 菜单；主操作与主状态不得省略；不得用全局裁剪、缩小所有字号、缩小点击目标隐藏冲突；只有产品设计明确要求才缩字号。
3. 截断内容必须能在次级页或菜单完整获得；截断不得丢失错误或关键信息；tab 导航、可见选择器、按钮、标签优先单行截断；无法在别处获得的重要信息必须完整显示。
4. 标题优先完整显示；必要时把动作区换行；卡片标题优先自然换行；限制行数时必须仍能查看完整标题。
5. 纯图标控件需同时满足：图标清楚传达含义或操作对用户熟悉；悬停有 tooltip。“More account information”不得降为图标（它导航到独立页）；输入框模型选择器可降为图标（高频且可开菜单切换）；自动化任务中的关联会话是另一例。
6. 移动 hover：只在支持 hover 的设备启用鼠标悬停效果，用 `@media (hover: hover)` 而不是视口宽度；手机上点击不得留下只为 hover 设计的背景/高亮/按钮可见性；保留正常 selected/enabled/pressed 与键盘焦点指示；宽度变化时尽量保留焦点，除非焦点元素因此从页面消失。
7. 移动 tooltip：只提供辅助信息（动作名、键盘快捷键）的 tooltip 在移动端不显示；提供补充说明的 tooltip 必须支持点击显示。
8. 移动端除非明确意图，不自动升起输入键盘。

### 12.3 执行卡片

- **前置条件**：能运行 Web/Desktop；能截图或录屏；有明暗主题；有 390px 视口。
- **步骤**：读架构与 token 规则 → 复用优先 → 反馈面选择 → 遮罩三验 → 390px 与明暗主题验证 → 设计评审。
- **责任者**：UI 实现者；设计/产品评审者（批准）。
- **完成信号**：明暗主题可读；390px 无重叠/裁剪/横滚；遮罩可关闭/适配/不裁剪；错误与加载态符合面选择；GUI PR 有真实 GIF。
- **失败处理**：token 缺失时先找最近兄弟页；平台 clearance 冲突时用 scoped override 而不是改全局；无法获得设计批准时停止落地新字形。
- **例外**：markdown 排版 token 的字重例外；390px 以下布局要求可放宽；原生 picker 行为测试可省略 browser overlay。
- **证据限制**：这些是判断规则，自动门禁只覆盖 i18n、类型、lint；视觉与交互仍需人/截图验证。

---

来源：deepseek-harness/.agents/skills/dsh-client-ui-ux/SKILL.md:1-73@687f282e 来源：deepseek-harness/.agents/skills/dsh-responsive-ui/SKILL.md:1-54@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:1-40@687f282e 来源：deepseek-harness/docs/defensive-patterns/README.md:1-25@687f282e

<a id="aw-13"></a>

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/gen-official-bundle-catalog.ts:41-127@687f282e`

## 13. 官方插件美术与官方 bundle catalog 准入

`【源义务】` 触发：官方与官方 experimental 插件图标、`PluginArtwork` 字形、可选特性预览；仅当维护官方 on-demand bundle catalog 时，另触发 §13.1 的打包子程序。**不适用于**工具栏或动作图标（那属于 `dsh-client-ui-ux`）。来源：`dsh-official-plugin-artwork/SKILL.md:6-8`。

`【源义务】` 可选特性预览先读 `docs/cookbook/adding-a-plugin-preview.md`；它拥有可选性、图片数量、设计画布、显示尺寸与位置、语言变体、资源上限、验收，以及 SVG 预览的内嵌栅格例外；小图标仍只允许几何。检查真实特性、保留其产出资源、内置预览放 Plugin Manager client assets 目录及其内部双语映射。来源：`dsh-official-plugin-artwork/SKILL.md:10-12`。

`【源义务】` 建立主题（`dsh-official-plugin-artwork/SKILL.md:14-18`）：先检查真实特性、输出、owning manifest；复用设计者提供的资源；不要发明品牌标记或改产品名/标识/无关图标；读现有 artwork 与最近包 SVG，借一种连贯处理而不是每个参考的效果；检查每个受影响的 entry、list、detail、component row——bundle artwork 与组件名/图标可能由不同 metadata owner 拥有。

`【源义务】` 绘制（`dsh-official-plugin-artwork/SKILL.md:20-34`）：

1. 从简单开始：一个主导主题，只加解释它所需的细节；相关能力可共享隐喻，通过比例、轮廓、调色板区分，而不是额外面板/符号/徽章。
2. 视觉尺寸：`width="36" height="36" viewBox="0 0 36 36"`；有意留白居中；18–22 units 是有用起点，不是每个轮廓或宽字标的硬要求。页面渲染器拥有显示尺寸与外层 tile 框；不要把 tile 烤进 SVG，也不要放大工具栏字形去填满它。
3. 几何一致：平衡主次；重复标记与角对齐；尾巴与把手有意；一次只细化一个请求维度，不改已批准部分。
4. 克制颜色：与相邻图标平衡饱和度/亮度；优先现有调色板；鲜艳/霓虹只用于批准的品牌要求、必要对比或设计者明确指示；饱和度与色相/亮度分开调；不要为降饱和把作品变灰/浑；平面填充或短渐变、有限分层；避免 glow、投影、高光、emoji。页面 CSS 仍用语义主题 token。
5. 字标按可见墨迹对齐：一致字形、cap height、基线、字重、间距；比较渲染后的描边边缘而不只是 path 坐标；字标导出为 path，无字体依赖；实际尺寸可读。
6. 空区真正透明：空心透镜必须透出背景，包括与另一形状重叠处；用局部 mask/cutout 去掉底层填充，不要用白/深色圆盘替代；两主题都检查。

`【源义务】` 在 owner 处导出（`dsh-official-plugin-artwork/SKILL.md:29-34`）：用 manifest 的 `icon` 路径并发布资源；有意一起更新 bundle/component 副本；范围内验证本地化显示名与描述；不要为改插件图标而改特性产出资源。包图片经 `<img>` 渲染：自包含 SVG 几何，局部且唯一命名的 gradient/mask/clip 引用；无 script、事件处理、动画、外部图片/样式、字体、`foreignObject`。内联 React artwork 需 per-instance ID；独立图片文档不共享 ID。资源变更保持局部：不要为此加运行时依赖、原语导出或渲染器特例。

`【源义务】` 评审与验证（`dsh-official-plugin-artwork/SKILL.md:35-41`）：不确定几何前给几个编号替代；替代标签贯穿评审；现有文件或生成草稿不等于设计批准；比较物放 gitignored 目录，不放产品包。新旧 artwork 与未改参考并排、明暗主题、实际 row/card 尺寸与放大都看。运行 `pnpm run verify-package-meta`、`pnpm run constraints`、`pnpm run verify-official-bundle-catalog`；陈旧目录用 `pnpm run gen-official-bundle-catalog` 重新生成，不手改。结构检查不替代视觉评审。构建受影响产物并通过 `dsh web` 看真实页面；批量批准细化后再重启缓存 metadata 的 Host；两主题验证 entry 与嵌套 component rows。GUI PR 遵循 UI 测试策略与 `record-browser-gif`。新字形落地前取得设计者批准。

### 13.1 官方 bundle catalog 准入（条件性打包子程序）

`【源义务｜条件性打包】` 当目标仓库存在官方 on-demand bundle 目录时，`gen-official-bundle-catalog.ts` 还承担 catalog 准入与新鲜度；这是与视觉美术并列的独立子程序，不能把它的通过当成美术合格，也不能用美术批准替代它。

- 名单必须非空且无重复，默认取安装侧 `ON_DEMAND_BUNDLES`；生成器扫描 `packages/*/*/package.json`、`apps/*/package.json`、`vendor/*/package.json`，重名 workspace 包直接失败。
- 成员必须是 `packages/` 下、以 `@deepseek-ai/dsh-` 命名、非 private 且声明 `dsh.bundle.patch` 的公开 bundle；并且不得出现在 `@deepseek-ai/dsh` 的 dependencies/optionalDependencies/peerDependencies 闭包中。
- 元数据只从包资源读取，不 import 或激活 provider：`locale/{en,zh}.json` 的 `meta.title`/`meta.description` 必须非空；插件 meta 必须有 icon，且 title/description 的 en/zh 文本都非空；`meta.error` 直接失败。
- 生成文件 `packages/boot/app-boot/src/official-bundles.generated.ts` 是确定性 source-plane 产物：header 写明生成命令与 do not edit；localized 对象按语言键排序，字符串经 TypeScript printer 单引号转义。
- 同步只容忍 ENOENT，其他读取错误抛出；内容相同不写；`--check` 发现 stale 时抛错并提示 `pnpm gen-official-bundle-catalog`，否则写文件。
- `package.json` 的 `verify-official-bundle-catalog` 就是 `gen-official-bundle-catalog.ts --check`。

来源：`deepseek-harness/scripts/gen-official-bundle-catalog.ts:1-40@687f282e`、`deepseek-harness/scripts/gen-official-bundle-catalog.ts:41-127@687f282e`、`deepseek-harness/package.json:215-216@687f282e`。

`【证据限制】` 该子程序只证明名单、成员、元数据与生成文件结构，不证明视觉美术、provider 运行行为或真实安装；未执行生成器或 `--check`。

### 13.2 执行卡片

- **前置条件**：有真实特性与 manifest；有现有 artwork 参考；有设计者批准通道；仅当维护官方 on-demand catalog 时才需要 catalog 子程序。
- **步骤**：读预览指南（若需要）→ 检查特性 → 画/改 → 导出 → 跑 `verify-package-meta`/`constraints` → 维护 catalog 时另跑 `verify-official-bundle-catalog` → 真实页面明暗主题验证 → 设计批准 → GIF。
- **责任者**：美术实现者；设计者（批准）；catalog 维护者（仅条件适用）。
- **完成信号**：`verify-package-meta`、`constraints` 通过；维护 catalog 时 `verify-official-bundle-catalog` 也通过；实际尺寸可读；透明与两主题正确；设计批准。
- **失败处理**：目录陈旧用生成器；SVG 被 `<img>` 拒绝时去掉脚本/外部引用；裁剪或不可读时改几何而不是加特例。
- **例外**：预览用内嵌栅格是文档化例外；图标不得用。
- **证据限制**：自动检查只覆盖元数据/结构；视觉质量需人与真实页面。

---

来源：deepseek-harness/.agents/skills/dsh-official-plugin-artwork/SKILL.md:1-41@687f282e 来源：deepseek-harness/docs/cookbook/adding-a-plugin-preview.md:1-52@687f282e 来源：deepseek-harness/scripts/verify-package-meta.ts:1-40@687f282e 来源：deepseek-harness/scripts/gen-official-bundle-catalog.ts:1-40@687f282e 来源：deepseek-harness/scripts/gen-official-bundle-catalog.ts:41-127@687f282e

<a id="aw-14"></a>
## 14. 浏览器证据与 GIF 工作流

### 14.1 何时必须

`【源义务】` 改变产品用户可见 GUI 行为的 PR **必须**包含一个用本技能录制的演示 GIF，并通过 attach 工作流嵌入 PR body。录制本身是证据：用该 PR 分支树启动的真实服务器、真实 API key、真实模型轮次。**绝不**用 fixture 查询、mock transport、合成事件注入或测试专用 hook 替代，除非用户明确要求 fixture 录制。GIF 旁要写：演示的精确 commit SHA、服务它的 tree 与 origin、任何模式标志或浏览器状态例外、是否跑了真实模型轮次。来源：`record-browser-gif/SKILL.md:12-16`。

### 14.2 录制与发布分离

`【源义务】` 录制只产生本地视频/截图与一个 `.gif`，从不改远端状态。发布（`gh --attach`，或 push 到 assets 分支并嵌入 URL）是独立最后一步，只在任务包含附加到 PR 时执行；它永不触碰 PR 自己的分支。保留请求的录制条件；凭据或服务器不可用时报告限制，不要用 fixture 替代。永不读取或暴露凭据值；用应用正常配置路径与良性演示 prompt。来源：`record-browser-gif/SKILL.md:18-24`。

### 14.3 按 PR 暂存

`【源义务】` （`record-browser-gif/SKILL.md:25-33`）：

1. 要求干净 worktree；用 `git rev-parse HEAD` 记录精确 commit；构建该记录树（`pnpm run build && pnpm run build:web`）。用另一个 commit 的构建录 GIF 会错误归因证据。
2. 每个端口一个服务器，从该树启动，使用全新 scratch `DSH_HOME`、`DSH_AGENTS_HOME`、workspace、session state。浏览器也要全新隔离 context/profile；若浏览器工作流无法创建，导航前清该 origin 的 cookies 与 site storage。真实 API 凭据可能在 `~/.dsh/.credentials.yaml`，即使 `DEEPSEEK_API_KEY` 与根 `.env` 不存在；scratch `DSH_HOME` 下用 recording overlay 把 `dsh-credentials-local` provider 的 `path` 指向该文件绝对路径；让应用正常凭据 provider 解析，绝不回显 key。
3. **一个 storyboard 一次证据运行**：每个发布帧来自同一服务器与那些 state roots、workspace、session、模型场景运行。捕获自动化失败时丢弃其帧，从全新 roots 重跑；**绝不**拼接不同运行的帧。
4. 切换 PR 时按 PID 或精确命令行匹配停旧服务器；宽泛 `pkill -f` 可能匹配并杀掉启动它的 shell。

### 14.4 录制与编码

`【源义务】` 优先使用可用的浏览器控制工作流；它暴露 `recordVideo` 时在同一受控 context 启用视频以捕获更多中间帧；否则用截图捕获。只有浏览器控制不可用时，才用仓库声明的 Playwright 依赖在隔离 headless 浏览器中回退，并在 capture notes 说明。源仓库中它从 `apps/web/package.json` 解析；不要另装 driver 或打开用户浏览器。来源：`record-browser-gif/SKILL.md:34-43`。

`【源义务】` 录制前识别 origin、构建或 dev server、transport、任何模式覆盖。生产默认打开自动化无法驱动的原生面时，通过正常应用配置选一个官方浏览器可操作后端并披露覆盖。脚本、原始视频、时序笔记、QA 帧、GIF 存仓库 gitignored 的 `.playwright-mcp/`；先建 run 目录。来源：`record-browser-gif/SKILL.md:36-42`。

`【源义务】` 视频：显式匹配 `viewport` 与 `recordVideo.size`，否则 Playwright 会缩到 800×800，UI 文字可能不可读。保留 page 的 video handle 再关闭；`context.close()` 之后再 `video.saveAs()` 或编码；只关 browser 不保证视频 flush。每个 page 有自己的视频；显式选择演示页，不拼接无关页面或运行。失败运行只作诊断。来源：`record-browser-gif/SKILL.md:44-77`。

`【源义务】` 故事：3–6 个有意义状态；等唯一语义 locator 再动作；`exact: true` 用于 accessible-name 相等；完成谓词用 exact-text 且不能匹配 prompt 回显。固定等待可在状态验证后提供阅读停留，但绝不建立就绪。视频捕获时保留动画与滚动。演示工具调用/拒绝/恢复时打开其 detail/trajectory，让视频显示工具身份、状态或稳定错误码、下游结果。需要瞬态 running 状态时，提示一个慢前台操作并观察其 DOM 标记。给模型一个短最终 sentinel 锚定完成；演示状态可见后停止不必要的长真实 API 运行。不捕获 secret、个人数据、无关 tab、通知；视频含页面内容不含浏览器 chrome；避免渲染含凭据 URL。评审整个选中区间，包括中间状态；保持一个视口。来源：`record-browser-gif/SKILL.md:54-77`。

`【源义务】` 编码：需要 `python3`、`ffmpeg`、`ffprobe`；缺媒体二进制时报告依赖，不未经授权安装。`export GIF_SKILL_DIR` 单独一行；同一命令内联赋值不能影响参数展开。

```sh
export GIF_SKILL_DIR=/absolute/path/to/this/skill
python3 "$GIF_SKILL_DIR/scripts/encode_gif.py" \
  /absolute/path/to/demo.webm /absolute/path/to/demo.gif \
  --start 2 --end 32 --speed 2 --final-hold 3 \
  --fps 10 --max-width 1200 --colors 128
```

`--start`/`--end` 选择一个连续源区间；默认保留全视频 1× 并加两秒 final hold。`--speed` 改播放速度，必须在 GIF 旁披露所选区间与速度，避免暗示实测延迟。用观察到的视频时间，不猜 wall-clock 偏移；保留完整因果。final hold 重复最后选中帧。`--fps` 不能恢复源录制没捕获的运动。保留原始 WebM 供 QA；不拼接运行或合成缺失状态。来源：`record-browser-gif/SKILL.md:78-94`。

`【源事实】` 编码器（`scripts/encode_gif.py`）默认 `--max-bytes 5 MiB`，超过时 `fail("output is ... above --max-bytes ...")`；它探测 WebM 容器时长，在调色板转换前应用 trim 与 speed，并检查编码时长、动画、宽度、字节数；拒绝空/越界区间、少于两个输出帧的选择、模式不匹配的标志、意外覆盖（`encode_gif.py:16,184-186,315-316@687f282e`；`SKILL.md:88-94`）。

`【源义务】` 截图路径：3–6 个验证状态，一次隔离运行，浏览器截图 API；返回的图片字节直接保存在一个 run 目录，命名 `00-initial.png`、`01-typed.png`……；相同尺寸与裁剪；瞬态状态轮询 DOM 标记并在同一浏览器脚本调用内捕获。目录输入拒绝少于两帧、尺寸或时长数量不匹配；时长只适用于截图目录，视频时序标志只适用于视频。来源：`record-browser-gif/SKILL.md:95-106`。

### 14.5 验证与发布

`【源义务】` 验证（`record-browser-gif/SKILL.md:107-115`）：

1. 读编码器 JSON summary，确认输出路径、源区间与速度（或截图数）、编码帧数、尺寸、时长、字节数。
2. **视觉读编码后的 GIF 本身**，不只源帧；确认过渡可读、最后状态停留足够、无敏感内容。查看器只渲染第一帧时，用 `ffmpeg` 解码编码 GIF 的代表帧检查。
3. `git status --short` 确认原始视频、QA 帧、产物只落在 ignored 路径。
4. 返回绝对 GIF 路径，客户端支持时渲染，并说明录制用的是真实 API、fixture 还是其他 transport。任务不包含附加到 PR 时到此停止。

`【源义务】` 发布（仅当任务包含）：**绝不**把 GIF 提交到 PR 自己的分支或任何合并进长期分支的分支；优先 `gh --attach`。要求 `gh` v2.99.0+、github.com（不支持 GHES）、写权限、GIF ≤10 MB。body 中用普通本地路径引用，`gh` 会原地重写为上传 URL 并保留位置与 alt 文本。附加前重读被演示 PR 的 live head 并与 GIF 旁记录的 commit 比较；移动则停止重录。附加后重读 live head 要求仍在记录 commit；重读 body 确认引用指向上传 URL；经 GitHub Markdown API 渲染确认 `<img>`；抓取上传 URL 一次确认 `200` 与 `image/gif`。来源：`record-browser-gif/SKILL.md:116-142`。

`【源义务】` assets 分支回退（仅在 `gh --attach` 不适用时：GIF >10MB、`gh` 太旧、非 github.com）：用 orphan assets 分支，只放媒体；一个 series 一个分支（`<series>-assets`）。push 前验证分支只含媒体、staged GIF 校验和匹配已验证本地产物。已有分支在 shallow single-branch scratch clone 中操作；新 series 用 fresh shallow clone + `git switch --orphan`。push 后用认证 API 或 raw 请求确认远端路径、字节数、校验和、`200`、`image/gif`；匿名 `404` 不证明私有仓库资产不存在。嵌 body 用 raw blob URL，`?raw=true` 必需。**永不**删除或重写 assets 分支，**永不** force-push：已合并 PR body 永远引用其 URL；只追加提交。来源：`record-browser-gif/SKILL.md:143-172`。

### 14.6 浏览器自动化 overlay

`【源义务】` Web 浏览器自动化与 GIF 录制用 `pnpm dsh web --patch apps/web/tests/pin-browse-picker.overlay.yml` 使用页内目录选择器；只有显式测试原生 picker 行为时才省略。overlay 通过 `disabled: true` + `insert` 把 shipped `directory-picker` 替换为 `@deepseek-ai/dsh-host-directory-picker-browse` 与对应 client UI；原因：shipped `-auto` 在 loopback + local display 下解析为原生 OS 选择器，Playwright 无法驱动（`AGENTS.md:121`、`apps/web/tests/pin-browse-picker.overlay.yml:1-13@687f282e`）。

### 14.7 执行卡片

- **前置条件**：干净 worktree；能构建；真实 key 或可用凭据 provider；ffmpeg/ffprobe/python3；浏览器控制工作流。
- **步骤**：记录 commit → 构建 → 起隔离服务器 → 录 3–6 状态 → 编码 → 视觉验证 → （仅任务要求）attach/assets 发布。
- **责任者**：GIF 录制者；评审者核对 commit 与真实性。
- **完成信号**：编码 summary 与视觉检查通过；GIF 旁写明 commit/源/凭据/模型轮次；body 引用可渲染；live head 未移动。
- **失败处理**：捕获失败 → 丢弃帧、全新 roots 重跑；媒体缺失 → 报告依赖；attach 失败 → assets 分支；head 移动 → 重录。
- **例外**：用户明确要求 fixture 录制；原生 picker 行为测试省略 overlay。
- **证据限制**：编码器测试需要本地 ffmpeg/ffprobe，且**不在仓库 CI 运行**（`SKILL.md:115`）；GIF 真实性最终靠人核对。

---

来源：deepseek-harness/.agents/skills/record-browser-gif/SKILL.md:1-172@687f282e 来源：deepseek-harness/.agents/skills/record-browser-gif/scripts/encode_gif.py:1-337@687f282e 来源：deepseek-harness/.agents/skills/record-browser-gif/scripts/test_encode_gif.py:1-103@687f282e 来源：deepseek-harness/AGENTS.md:121-121@687f282e 来源：deepseek-harness/apps/web/tests/pin-browse-picker.overlay.yml:1-13@687f282e 来源：deepseek-harness/apps/web/tests/README.md:1-39@687f282e

<a id="aw-15"></a>
## 15. 翻译工作流：常规单遍与扩展用户调用

### 15.1 分工

`【源义务】` 常规 agent 工作由工作代理直接单遍更新对应文件，**不**调用翻译技能、不生成 briefing、不单独做翻译评审、不委派子代理。扩展 `dsh-translate-docs` 只在用户显式按名调用时运行（`docs/i18n/README.md:67-69`、`dsh-translate-docs/SKILL.md:10-12`）。

`【源义务】` `dsh-translate-docs` frontmatter 设 `disable-model-invocation: true` 与 `user-invocable: true`，把“只能人工调用”编码进运行时策略，而不是只写在正文里（`dsh-translate-docs/SKILL.md:1-8`）。

### 15.2 扩展技能的三条路径

`【源义务】` 按变更类型分流（`dsh-translate-docs/SKILL.md:18-25`）：

- **Update**（pair 存在、一侧编辑）：briefing 驱动的增量路径。**绝不**为应用更新而整篇重译——最小更新保留未变内容的已评审措辞；重译会丢掉那次评审。
- **New pair**（尚无对应）：整篇路径。
- **Deleted/renamed doc**：同时删除/重命名 counterpart 与 `.i18n.yaml`；否则门禁报告不完整 pair。

`【源义务】` 冻结的 `.agents/notes/archived/` 不是翻译工作；其完整三件套由 archive verifier 封印；归档后永不再更新、重录或修复任一侧（`dsh-translate-docs/SKILL.md:24`）。

### 15.3 更新路径

`【源义务】` （`dsh-translate-docs/SKILL.md:26-35`）：

1. `pnpm run gen-translation-brief <pair 中任一文件>`；无参数则对所有 out-of-sync pair 生成。briefing 按最窄安全对齐粒度映射变更：Markdown 单元（段落、表行、列表项、标题）→ 整节 → 整篇；包含 authored 侧自上次确认一致以来的 diff、每个变更单元的上次确认源文/当前源文/当前 counterpart（带行号）、涉及的术语行、首次出现移动说明、绑定更新规则摘要。
2. **纯机械 diff → `--apply`**：当所有变更都在两侧字节一致的 code fence 内，briefing 会说明；`pnpm run gen-translation-brief --apply <pair>` 把编辑后的 fence 拼进 counterpart 并在写入前做结构校验；无子代理、无手改。
3. **散文 diff → 委派子代理并传 briefing**（或生成它的命令）。briefing 是译者的全部工作集；子代理不重读指导语料、不重推 diff。只有 briefing 留下真正无法回答的具体决定时才升级到整篇来源。
4. **覆盖 diff 的最小编辑**：保留 diff 未触及内容的已评审措辞，逐句对照源文验证改动 hunk：不加、不丢、术语按内联行、code span 逐字。
5. **记录并作用域校验**：`pnpm run verify-translation-pairing --write <pair>` 再 `verify-translation-pairing <pair>`。`--write` 只命名你确认过的 pair；裸跑会被拒绝，批量重录必须显式 `--all`。

### 15.4 整篇路径

`【源义务】` 从头写译文时，编排代理不翻译：spawn 子代理。译者先读权威来源，再整篇翻译；长文档按节推进，每节结构锁源，而不是最后统一修结构。来源：`dsh-translate-docs/SKILL.md:36-47`。

必读：`docs/i18n/README.md`（pairing 契约）、`translation-rules.md`（忠实、结构保持、术语、排版）、`terminology.md`（双向绑定；翻译前加载，不是遇到不确定才加载）、`translation-prompt.md`（自动管线模板；agent 不渲染它）、`dsh-prose-standard`。

`【源义务】` 翻译两遍（`dsh-translate-docs/SKILL.md:48-57`）：

- Pass 1：读一个语义单元，用目标语言的原生技术作者语气重述；保留必需框架，不强行逐句对应。
- Pass 2：逐句对照源文验证：不加不丢、术语按表、code span 逐字。修法是重写句子，不是往句子里补词。
- 完成后单独读译文（不并排源文），重写只有孤立阅读才暴露的别扭表达。
- 只把最终文本写入文件，不写草稿或笔记。
- 术语表每个词按指定渲染；中文目标用中文与首次出现列；未列术语需可引用的中文 OSS/vendor 先例，否则保留英文并标「待定术语」；英文目标用英文列与既有英文术语；歧义源术语保留并加短注，列入 pending。不得内联发明渲染。
- 代码块两侧字节一致，含注释。仓库相对文档链接保持同一语义目标与精确 query/fragment：活跃双语语料内英文侧 `.md`、中文侧 `.zh.md`；缺失 in-scope counterpart 是错误；语料外保持 authored 路径；切换器是跨 locale 例外。
- pairing 门禁检查标题深度、fence、表行列数、列表类型、有序列表起点、列表项数、链接 locale、语义目标；Pass 2 人工验证列表/表顺序、非规范编号、inline code、强调、意义、术语、语气。

### 15.5 找活与收尾

`【源义务】` `pnpm run verify-translation-pairing --list` 打印每个 in-scope 文档的 missing/out-of-sync/ok；missing 与 out-of-sync 是契约违规。编辑配对文档的 PR 中，工作清单就是 diff：每个改动侧都要在同一 PR 更新 counterpart 并重录。收尾（`dsh-translate-docs/SKILL.md:58-71`）：

1. 切换器：中文文件 H1 后 `[English](foo.md) | 中文`；英文文件 H1 后 `English | [中文](foo.zh.md)`；新 pair 两侧都加，但 generator-owned 英文源保持与生成输出字节一致并省略切换器，中文 counterpart 仍回链。
2. `verify-translation-pairing --write <pair>` 重算并记录 per-section hash 到 `foo.i18n.yaml`；PR 中 yaml diff 是“我确认两侧同义”的可评审声明，只有真的确认后才跑。
3. 普通文档不需要 manifest 条目；只有 owning policy 记录真实 generated/instructional/bilingual-by-construction 排除时才改 `scripts/translation-pairing.manifest.json`。
4. PR 前 touched pairs 在作用域检查下为绿；`pnpm run doc-sync`（含全语料 pairing + `verify-md-wrap`/`verify-md-links`）按 `dsh-pre-push-checks` 在 PR 级跑一次，不在每个翻译任务内跑。
5. 保持 PR 可评审：说明哪些 pair 是新建、哪些是最小更新；显著列出「待定术语」。

`【源义务】` 回应翻译评审：遵循 `dsh-code-review` 的报告指导；术语评论以术语表为契约，把评审者的渲染决定应用到 `terminology.md`，而不只是一个文件（`dsh-translate-docs/SKILL.md:72-74`）。

### 15.6 执行卡片

- **前置条件**：`docs/i18n/` 契约存在；pairing 工具可运行；术语表可用。
- **步骤**：先区分常规 one-shot/one-pass 更新与用户明确点名的扩展工作流；常规更新按文档标准最小同步并 scoped 重录，不自动加载扩展技能。仅明确调用扩展工作流时判断 update/new/delete，生成 briefing 后按机械 `--apply`、委派或整篇路径执行，再 scoped `--write`/检查；全域 `doc-sync` 留在 PR 级一次运行。
- **责任者**：工作代理（常规单遍）；用户指定的译者/子代理（整篇）。
- **完成信号**：scoped pairing 检查结构、逐节 hash 与指定链接语义通过；物理行对齐、术语、意义、列表/表格顺序与散文质量另行评审。门禁通过不等于物理行数相等；本地3行/6行 pair 通过已实际观察。
- **失败处理**：结构校验失败时修结构而不是重录；`--write` 拒绝裸跑时显式给 pair；未列术语保留英文并标 pending。
- **例外**：generated 英文源无切换器；`.agents/notes/archived/` 不翻译；`translation-prompt.md` 不配对。
- **证据限制**：绿色 hash 证明记录与当前各节字节一致，不证明译文质量；自动结构与链接检查也不覆盖通用物理行数相等。常规/明确扩展的调用边界仍来自源技能1–12，不能因生成器存在就自动进入扩展路径。

---

来源：deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-74@687f282e 来源：deepseek-harness/docs/i18n/README.md:7-69@687f282e 来源：deepseek-harness/docs/AGENTS.md:38-48@687f282e 来源：deepseek-harness/scripts/translation-pairing.manifest.json:1-13@687f282e 来源：deepseek-harness/scripts/gen-translation-brief.ts:1-40@687f282e 来源：deepseek-harness/scripts/verify-translation-pairing.ts:1-40@687f282e

<a id="aw-16"></a>
## 16. Provider 面向的真实 API 证据

`【源义务】` 测试策略的 with-key 规则：不做 real-API 配给限制；无 key 测试只证明管线，只有 with-key 运行证明 agent 对真实模型工作。覆盖写文件 prompt、多轮对话、工具使用、流中取消。最高价值是 boot 一个 shipped `dsh` profile、发一个 prompt、检查世界的 **smoke**。无密钥 CI 与无 key 贡献者通过 self-skip 保持可用；self-skip 不是成本信号。profile 级集成测试放 `apps/cli/tests/profiles/`；包特定组合留在包测试。来源：`docs/testing.md:23-25`。

`【源义务】` 真实 provider e2e 属于 `pnpm run test:e2e` 层级：针对 live provider API（DeepSeek 模型 + 按各自 key 门控的 provider 专用 smoke，如 `EXA_API_KEY`、`PERPLEXITY_API_KEY`）；每个 suite 无 key 时 self-skip，保持无密钥 CI 绿（`docs/testing.md:7-17`）。

`【源义务】` 实现新 provider adapter 的协议义务（`docs/cookbook/adding-an-llm-adapter.md:1-43`）：

- 注册是 effect-based（HMR-safe）；每个 provider route 一个 adapter；重复抛错；多 route 注册 all-or-nothing。
- `options.provider` 选 adapter，`options.model` 是 provider model id；动态目录 adapter 可不经生命周期重配服务新模型。
- Secret 用 cordis 原生：schemastery Config + env fallback，经 cordis.yml `!!js process.env.MY_KEY` 注入；不要在代码里读临时 key 文件。
- `usage` 必须在 `finish` 之前发出；`finish` 之后**什么也不发**。稳健做法：缓冲 finish/usage 到 provider 的 end-of-stream 标记，再 flush。
- Tool-call `arguments` 端到端是**原始 JSON 字符串**；流式片段用 `argumentsDelta`；provider 返回解析对象时在 `block-end` 重新 stringify。
- block `index` 按首次出现流顺序分配；同一 block 的每个 delta 复用该 index。
- 错误只有两条路径：从 `stream()` **抛**（transport/protocol 失败，用 `LlmError` + 稳定 code），或以 `finish {kind: 'error' | 'aborted'}` 结束（provider in-band 失败）。按失败类选择并记录。
- 尊重 `options.signal`（传给 fetch/SDK）。
- provider 无法履行的 `GenerateOptions` 字段必须抛 `LlmError(..., 'UNSUPPORTED_OPTION')`，不得静默丢弃。
- 需要 native metadata 的 provider 用 `finish.replayState` 发出最小无损 JSON 投影；重建历史时校验。`LlmRuntime` 只在历史 provider route 与目标 route 当前由**同一 adapter 实例**拥有时传递；adapter 决定同模型/跨模型/跨 provider 恢复是否合法。状态缺失时不得仅凭 provider/model 名推断 native replay。
- thinking-mode 开关留在 adapter Config；模型元数据用 provider-neutral capability seam：实现 `resolveModel()`，含 provider/model identity 与可选 `context`/`reasoning`；只在存在时声明配置的 `defaultEffort`；尊重 resolver 的可选 `AbortSignal`。reasoning effort 是有序不透明 id，由 adapter 映射到 provider 请求；保留 adapter 权威可选列表（含支持的 `off`），不暴露最终 wire 拼写、不 clamp 不支持值；id 不必等于 wire 表示。
- 实现结构：wire types、request serialization、transport parsing、chunk translation、adapter class 分离职责。

`【源义务】` pre-push 对 provider 变更：有凭据时跑相关 `pnpm run test:e2e`；绝不打印 secret（`dsh-pre-push-checks/SKILL.md:41`）。CI 可靠性对文档化瞬态外部 provider 测试允许重试，例外保持在外部边界（`dsh-ci-test-reliability/SKILL.md:102-117`）。

`【源义务】` 简化约束：两个 LLM adapter 是有意设计；JSONL 是唯一第一方 Session persistence provider，后端中立 Service Definition 支持 out-of-tree provider；除非用户明确覆盖，不要提议删除 LLM 双胞胎或 persistence seam（`dsh-find-simplifications/SKILL.md:14`）。

`【源事实】` pi-ai provider metadata 有本地 hook 检查：变更 pi-ai 依赖或生成器后按包 README 的 provider metadata 更新步骤；hook 在输入或生成文件 staged 时内存重生成期望元数据，拒绝陈旧而不重写/暂存（`docs/development.md:145-149`）。

### 执行卡片

- **前置条件**：真实 key 可用；或明确知道本次无 key 只证明管线。
- **步骤**：选 provider 面 → 跑对应 e2e smoke → 检查世界而非自报 → 记录 key 是否可用 → 不打印 secret。
- **责任者**：provider/adapter 作者；评审者核对证据。
- **完成信号**：真实模型轮次发生；断言外部状态/文件/事件；失败分类正确（产品 vs provider 瞬态）。
- **失败处理**：无 key 时报告“未验证真实 provider”，不要声称通过；外部瞬态按策略重试，不扩散到内部断言。
- **例外**：无密钥 CI 的自跳过；文档化瞬态外部 provider 的重试。
- **证据限制**：源仓库的 with-key 证据在外部环境生成，迁移后不可复用；必须重跑。

---

来源：deepseek-harness/docs/testing.md:7-25@687f282e 来源：deepseek-harness/docs/cookbook/adding-an-llm-adapter.md:1-43@687f282e 来源：deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:27-52@687f282e 来源：deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:102-117@687f282e 来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:10-16@687f282e 来源：deepseek-harness/docs/development.md:145-149@687f282e

<a id="aw-17"></a>
## 17. 性能工作流

`【源义务】` 触发：调查/优化性能、设计真实合成基准或 CI 性能门禁、剖析长 Session/Web 响应、把性能 PR 证据变成有测量的行为保持修复（`dsh-speed-up-perf/SKILL.md:6-8`）。

关键约束（`dsh-speed-up-perf/SKILL.md:10-92`）：

1. **先定范围与当前权威**：读根 `AGENTS.md`、architecture、testing policy、defensive patterns、受影响包指令与 Agent Notes；用 `dsh-ci-test-reliability` 处理进程、时钟、浏览器测试、异步清理。与用户约定用户可见端点、负载范围、资源约束、可接受的小行为差异、停止规则。后端与浏览器端到端测量分开；测本地开销时排除模型/网络延迟并声明排除。
2. **检查精确当前 base**，不只看运行中的 checkout；研究最终合并 diff、owning source、测试、已解决 review threads；PR body 可能描述已放弃实现。区分已合并、已关闭未合并、被取代、估算、新测量证据。
3. **先考察用户路径再排序候选**：冷启动、首次历史读取、当前代重开、可写恢复；多轮/工具重历史、大消息/结果、子 Session 列表、重复导航；初始历史传输与折叠、首次可用 paint、旧页加载、滚动、工具展开、非活跃视图激活；live streaming 与重连。独立成本驱动因素（字节、持久事件、compact 记录、raw delta、turn、tool、child、可见 DOM 节点）要变化；不要用大量微小相同消息冒充真实负载。按用户延迟、CPU/分配、保留内存、发生率、置信度排序；每个候选写生产消费者、重复工作、期望复杂度、最小可证伪干预、必须稳定的行为。
4. **先建真实合成基准**：遵循 `benchmarks/AGENTS.md` 与性能门禁决策；扩展现有必跑 lane，不建竞争性校准/报告基础设施。用户授权本地语料检查时只提取聚合负载特征；**绝不**把 prompt、输出、路径、身份、ID、凭据、录音或可识别片段复制进 fixture、日志、截图、PR、产物。用审查过的常量生成固定输入；基准不依赖用户 home、环境仓库、网络服务或私有数据。
5. **实现前记录测量卡**：用户操作（精确动作 + 外部可观察完成条件）、负载（固定维度、分布、构造 seed/常量、为何覆盖普通与尾部长尾）、入口路径（生产调用/组合与构建产物；mock 的外部边界）、时钟（包含 setup、冷/热、计时起止、排除成本）、内存（可达端点对象、基线、GC 策略、保留 vs 瞬态限制）、裁决（原始样本、选定聚合、校准的绝对/比率/内存限制、负向控制）、行为（owning 功能测试/快照、允许的小差异）。
6. **测量构建后 JavaScript**：CPU worker 在 plain Node 下运行；source-loader 开销与模块解析不是 shipped 路径。浏览器用构建后产品资源与支持的 `dsh` profile 经现有测试 harness。不要为测量加生产导出或把算法复制进“基准实现”。冷/进程内存样本用 fresh children 与私有临时根；warm 样本显式保留目标缓存；不要让 fixture setup 偷偷预热冷场景；两侧保持相同输入、校验、完成条件、可达输出。
7. **报告所有样本与决定结果的聚合**；Node lane 用现有共享时间校准与审查过的方差余量；不要按 CPU 速度缩放字节/计数/无量纲比率。手工浏览器诊断无阈值；必跑浏览器性能用例需要显式 lane 决策并在实际 CI 浏览器/runner 上重复测量后才采用时间预算；Node 机器乘数不是浏览器校准。预算是源码常量，不是环境覆盖。测量工作与其他 owned CPU 密集 job 串行；参考与候选在可比条件下测量；不要放宽预算或挑幸运运行隐藏回归。
8. **端到端延迟独立于组件阶段**；保留内存要目标对象仍可达；瞬态压力用受限堆完成或合适峰值测量区分。更快执行但无界保留不是自动胜利。
9. **浏览器响应性**用真实浏览器输入并观察 UI 更新；包含最终 stall；区分 scheduled timers 与真实输入；有界合成生产者，避免追赶爆发发明不同负载；说明 first paint、滚动、分页、live 更新、已激活但隐藏视图是否覆盖。Node fold、fake DOM、自定义 heartbeat 事件不能单独证明浏览器响应性。
10. **先证明回归再删除工作**：改生产代码前跑未优化负载，保存命令、revision、运行时/平台、fixture 维度、原始测量、裁决。把失败场景缩小到仍触真实瓶颈，再排序可证伪假设。用 profile、分配样本、工作计数或阶段计时区分。一次只改一个因果因素；重跑聚焦场景与其端到端父级；要求负向控制：收紧后的断言在原始实现或受控重新引入目标成本时失败。阈值宽到回归通过不是保护；低于已验证噪声底也不是可靠预算。
11. **保持行为与资源所有权**：性能测量补充功能证据，不替代；跑/加 owning 窄测试（输出、排序、分页、流索引、错误、取消、并发、disposal）。保留模型可见/日志等价、已发布代不可变、原子发布、必需校验、可写就绪。不要为数字静默截断历史、跳过工具结果或改生命周期语义。任何有意的小可见差异通过 owning 无密钥快照验证；产品可见 GUI 变更包含浏览器证据/GIF。
12. **交付有界可评审结果**：用 Agent Note 规则记录耐久理据、替代、校准、排除、剩余风险；检查相关 note 的 supersession，但不把性能工作变成全语料散文清理。请求栈时先选层并用官方 GitHub stacks 与独立 worktree；每层可合并：基准基础设施保护基线，优化层带修复、功能覆盖、更紧预算；独立瓶颈可用独立栈；在 owning 层修复再向上传播。应用 pre-push，报告只执行过的证据，检查 CI 而非假设本地时序证明 runner 稳定。

### 执行卡片

- **前置条件**：可复现负载；构建产物；可测环境；用户同意的停止规则。
- **步骤**：定范围 → 检查 base → 排候选 → 写测量卡 → 建基准 → 证明回归 → 单因素改 → 端到端复测 → 行为证据 → 负向控制 → 报告。
- **责任者**：性能作者；评审者核对测量与行为。
- **完成信号**：改动前后绝对值与比率、端点与内存语义、行为证据、负向控制、精确检查、排除项齐全；预算不放宽。
- **失败处理**：端到端收益消失、典型负载显著回归、复杂度超过小收益、取消/保留/耐久无法解释与测试时拒绝优化；记录被拒假设，不扩范围。
- **例外**：手工浏览器诊断无阈值；必跑浏览器预算需显式 lane 决策。
- **证据限制**：本地时序不证明 CI runner 稳定；历史数字与新鲜测量、CI 证据必须分开。

---

来源：deepseek-harness/.agents/skills/dsh-speed-up-perf/SKILL.md:1-92@687f282e 来源：deepseek-harness/benchmarks/AGENTS.md:1-18@687f282e 来源：deepseek-harness/docs/testing.md:7-17@687f282e 来源：deepseek-harness/docs/defensive-patterns/README.md:7-25@687f282e

<a id="aw-18"></a>
## 18. 简化工作流

`【源义务】` 触发：寻找有证据的简化、写/合并提案、识别小内联清理、评估其他分支的简化（`dsh-find-simplifications/SKILL.md:6-8`）。

### 18.1 约束与领域切分

`【源义务】` 先读 `AGENTS.md`、architecture（判断包之前）、defensive patterns、testing policy；查相关活跃 Agent Notes 的有意决策；归档 note 是历史例子，不是当前权威，**不要**检查、验证或修复其出链。两个 LLM adapter 与 JSONL persistence provider 是受保护设计（见 §16）。广泛请求按独立域分给子代理：loop 与 persistence；model/tool assembly；Host/Client/SDK；subprocess 与 execution providers；composition/scripts/tests/documentation。每个代理给有界域并要求消费者证据与被拒替代。来源：`dsh-find-simplifications/SKILL.md:10-16`。

### 18.2 发现可移除义务的问题

`【源义务】` （`dsh-find-simplifications/SKILL.md:18-28`）：

- 声明特性是否有完整效果路径？追 producer、transformations、provider/endpoint 支持、可观察结果；字段到处复制仍可能没有 setter、没有 reader、或只有拒绝它的实现；搜索 constructor 与 discriminant emitter，不只 caller。
- 哪些区分改变消费者动作？几个内部状态可能只需一个模型可见状态或一个可用标识符；保留控制授权、驻留、耐久、所有权的内部区分；删只邀请不可用选择的公开区分。
- 更小的显式行为能否移除子系统？固定间隔、调用者提供时区、报告激活失败可消除通用日历、持久默认、自动回滚；说出放弃的能力与被删机制。生产调用者让它成为行为决策，不是自动拒绝。
- 消费者能否在需要时读权威值？找复制历史、晋升账本、失效事件后读取、共享投影流旁的特性缓存；派生或复用可能一起删除订阅、保留数据、陈旧响应处理、恢复路径；先确定必需观察时机。
- 是否把组合误当策略？可选服务存在、provider 方法、兄弟工具可表达可用性而不决定部署行为；显式配置或调用者意图操作可移除 registry 与依赖检查；所有权或完成时机不同时保留不同操作。
- 谁拥有完整维护成本？追 pass-through 配置、重复应用树、产品使用的 demo launcher、仅 resolver 的 workspace、有自身升级生命周期的安装 helper；把整个被删系统与替代比较，含残余 glue；移动复杂度或加门禁保持重复定义相等不是移除。

### 18.3 证明可达性与权衡

`【源义务】` 先 `rg` 再读匹配；搜索精确符号、属性读写、discriminant、event/wire 字符串、config key、包名，以及 `.method(` 与 `method(` 两种形式。测试与声明能显示契约，不能证明 shipped producer/consumer。覆盖 `packages/*/*/src`、`apps/`、`python/`、运行时脚本、shipped profiles 与 overlays、包 manifest 与 exports、loader resolution、生成运行时资产、安装包消费者。按真实入口而不是目录名分类 example/fixture。跟生成目录到消费者：被模型写插件挂载使用的目录是动态产品 API，纯文档列表不是固定调用者。公共第三方扩展路径即使零仓库调用点也可能是有意的。静态未用代码检查器必须覆盖 manifest 驱动加载、生成输出、编译面，且不维护平行 per-workspace 例外清单。来源：`dsh-find-simplifications/SKILL.md:29-42`。

每个候选记录：当前 owner、有效 producer/consumer 路径、消失什么、保留什么、保留它的最强理由。区分：不可达/未读行为的移除；有明确损失的产品/公开行为收窄；受保护义务或证据不足。候选破坏受保留义务、只是搬移同样复杂度、或没有有意义减少时拒绝。

`【源义务】` 小的本改进放可执行 `TODO`/`FIXME`/`XXX` 注释，不写独立设计记录（`dsh-find-simplifications/SKILL.md:42`、`docs/development.md:196-205`）。

### 18.4 保留所有权与失败语义

`【源义务】` 对拷贝、冻结、校验器、回调捕获，命名值的 origin、next owner、trust boundary。类型化同进程调用通常借用 readonly 值；parser、config loader、queue、model/tool JSON、durable file、worker、process、wire decoder 拥有或校验输入。恶意 getter 或回调替换测试本身不建立需求。冻结根不证明后代不可变；相等 id 不证明对象同一。异步机制要映射每个 promise、flag、取消路径、disposer、reservation 到 owner 与 transition；只有表达同一事实时才合并；保留同步发布与回滚、回调包含、first-terminal-outcome 仲裁、worker/process 所有权、dispose-to-quiescence。持久 start/end 标记即使转录渲染器忽略也可记录真实事实；丢掉中断工作不是冗余日志清理。来源：`dsh-find-simplifications/SKILL.md:43-48`。

### 18.5 替换基础设施

`【源义务】` 遵循依赖策略：在加包前搜索现有依赖与 Node 内置（按引擎下限）；识别替代删除的精确实现与专用测试、维护与传递成本、glue 必须保留的每个残余行为。演练最可能击败替代的不匹配：协议截断、取消与 teardown、配置边界、确定性测试时钟、平台打包、source vs built 入口。覆盖 framing 但需重建同样 framing 以执行大小限制的库不是简化。接受的边缘行为变化写进提案与相关测试。不要重证依赖的通用规范却省略 harness 特有 shim 的测试。来源：`dsh-find-simplifications/SKILL.md:49-54`。

### 18.6 记录、合并与验证

`【源义务】` 实质提案用强制骨架：`Problem`、`Proposal`、`Alternatives considered`、`Acceptance criteria`、`Risks`；含具体消费者证据、被删维护成本、放弃的能力、可观察验收条件。已实现决策用 implemented 格式。同一决策更新现有 owner，不创建重复 note。每个新 note 通过 `dsh-archive-agent-notes` 做作用域 supersession 检查。折叠另一分支时比较其独立 diff 与目标 base，只移植有支持的非重叠提案，合并重叠理据；关闭另一 PR 需要授权或明确 housekeeping 所有权。仅文档 Agent Note 工作跑 `doc-sync`、`lint`、`git diff --check`；技能或注释编辑加适用 validator；其他检查经 `dsh-pre-push-checks`。报告调查区域、有支持候选、有意义拒绝/推迟、note 增/并/留/删、实际运行命令。调查扩展中用 draft PR；不要把未验证搜索描述为穷尽。来源：`dsh-find-simplifications/SKILL.md:55-65`。

### 执行卡片

- **前置条件**：明确范围；可搜索全仓；可读 Agent Notes 与历史模式。
- **步骤**：读约束 → 分域 → 找候选 → 证明可达性 → 分类（删除/收窄/受保护）→ 记录 → 验证。
- **责任者**：简化作者；评审者核对消费者证据。
- **完成信号**：每个候选有 owner/路径/损失/保留理由；提案骨架完整；supersession 检查完成。
- **失败处理**：证据不足则拒绝或推迟；受保护设计需用户显式覆盖；不要把“零固定调用者”当不可达。
- **例外**：小改进用 TODO 注释；已实现决策按 implemented 格式。
- **证据限制**：历史模式是校准，不是当前删除清单；归档出链不修。

---

来源：deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md:1-65@687f282e 来源：deepseek-harness/.agents/skills/dsh-find-simplifications/references/historical-patterns.md:1-45@687f282e 来源：deepseek-harness/docs/development.md:196-205@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:1-36@687f282e

<a id="aw-19"></a>
## 19. 文档、散文与推理轨迹工作流（跨域入口）

本域只保留**入口与工作流编排**；文档结构、预算、双语、站点发布属于 documentation 域，散文覆盖与编辑判断属于 prose 域，泄漏分类属于 CoT 域。

### 19.1 `dsh-doc`

`【源义务】` 触发：创建/重构/评审/审计/迁移 Markdown、包 README、文档站点。工作流（`dsh-doc/SKILL.md:26-38`）：

1. 读根与更具体 `AGENTS.md`、`docs/AGENTS.md`、目标页、其源码/测试、导航 owner、双语记录。
2. 按一个主 job 与读者分类：产品 quick start、用户任务指南、贡献者教程、架构概览、包/子系统参考、生成参考、agent 指令、决策记录、scratch。
3. 放到最近 owner：包契约在包代码旁；`docs/` 用于跨包学习、用户、开发者、架构、讨论、会过期的 scratch。
4. 先定义读者起点、可观察结果、可能的失败、恢复路径、下一有用深度。
5. 加/改 YAML metadata，`kind` 映射模板；按 Summary、Table of Contents、用户内容、开发者内容、可选 Further Exploration、最终 Dev Note 顺序写。
6. 同 pass 更新双语 counterpart；标题、列表、表格、代码、链接、frontmatter 布局、物理行数对齐。
7. 对照代码/测试/生成器/包元数据/当前决策 owner 验证每个声明，并**运行页面指示的操作**。
8. 跑聚焦检查，再 `test:docs`、`doc-sync`、`lint`、`git diff --check`；先读完整 diff 查正确性，再读简洁性与仓库契合。

`【源义务】` Fact-check：操作声明的唯一可采纳证据是运行过它。分类 subject 前读事实（`package.json` 的 `dsh.bundle.patch`、入口形状）；对当前 checkout 运行每个声明操作；无法复现就删除声明；`git fetch origin` 后与 `origin/master` 比较旧页；每次编辑后重录 pair（如果启用双语）。来源：`dsh-doc/SKILL.md:39-48`。

`【源义务】` kind 系统：8 个 kind 各映射一个模板（package-group、package-reference、package-library、package-bundle、persistence-change、persistence-release、persistence-format、upgrade-guide）。新增 kind 必须同时有独立模板、明确仓库位置或声明 owner、聚焦检查。来源：`dsh-doc/SKILL.md:49-63`、`dsh-doc/references/metadata-links-i18n.md:30-52@687f282e`。

`【源义务】` Voice：Summary 说 subject 能做什么，不说角色/类型/内部身份；开发者节解释概念不枚举 API；Dev Note 是唯一 slop zone；普通文档只描述当前状态；受控技术英语（明确 actor、一词一概念、直接动词、拆开堆叠指令与条件、保留 modality 与例外）。来源：`dsh-doc/SKILL.md:64-73`。

**执行卡片**：前置=已知 scope 与目标页；步骤=读层级→分类→放置→元数据→写作→双语→验证；责任者=文档作者；完成信号=kind/模板/结构/预算/链接/双语/操作复现全通过；失败处理=声明无法复现则删；例外=tiny machine-owned/generated/parser-owned 格式可省 Summary/ToC；证据限制=绿色门禁不证明内容正确。

### 19.2 `dsh-prose-standard`

`【源义务】` 必须有显式 scope；缺失则报告并停止。`mode: automatic | interactive`，默认 automatic；mode 控制提问，不控制写权限。评审/审计只报告，明确请求的写/修/trim 才改。**总是排除 `vendor/`**，即使 scope 是全仓；不要跟随符号链接进入；排除放在 include 之后。也排除 `.agents/notes/archived/`。生成目录、快照、fixture 是 derivative；先改 owner 再重生成。双语 pair 无永久 owner；按 lightweight routine 更新并重录。来源：`dsh-prose-standard/SKILL.md:14-27`。

`【源义务】` 删任何词前先枚举命题，保留每个相关的：actor/action；condition/timing/ordering；modality（must/may/never）；negative guarantee/exception；ownership/side effect/failure mode/consequence。只有每个事实子句存活且结果更清晰时才删形容词、重复、叙述；更少词数本身不是改进。来源：`dsh-prose-standard/SKILL.md:28-43`。

`【源义务】` `contract/boundary/shape/surface/seam/gate/vocabulary` 是使用前核对的术语，不是禁词表：更精确的规则、API、字段、类型或时点优先；确为技术义务或字面进程/安全边界时保留。只有两个以上版本都保留完整命题且确有原则取舍才算 borderline。automatic 对已授权明确改动直接执行、真正边界只报告，不为了改写制造问题。interactive 只在用户明确要求时启用：按原则归组、给两三种真实可行版本、推荐与差异、不设劣质陪衬；遵循指定渠道，PR行内校准将临时推荐放在确切diff行并附替代。用户决定后把原则/版本存入目标自己的样例（不写PR史），再检查范围内同类段落。来源：`dsh-prose-standard/SKILL.md:10,18-20,65-81`。

`【源义务】` 按位置的最低覆盖（`dsh-prose-standard/SKILL.md:44-62`）：公开 JSDoc（返回区分、throws/rejections、副作用、所有权、时机、取消、耐久）；内部注释（非局部结构、invariant、race ordering、ownership、security boundary、意外失败）；模块注释（角色、依赖、职责、非显然架构选择）；测试（只解释非显然设计）；cookbook（前置、动作、真实入口、可观察验证、警告）；README（消费者契约）；Agent Notes（独有理据、机制、替代、后果、shipped 验证证据、命名覆盖缺口）；postmortems（事件序列、证据、因果链、影响、预防）；技能与 agent 指令（行为护栏、显式范围限制）；示例与配置注释（访问限制、非显然 wiring/load order、安全立场、replay、例外、误用）；prompt 与可见字符串（措辞即行为；typed locale dictionary；跑 `verify-client-ui-i18n`；更新 owning 快照）；诊断（失败 subject/path、违反规则、修正）。

**执行卡片**：前置=scope + mode + 分支/PR base + 适用 AGENTS；步骤=读文档标准与 owner→检查范围→分类 keep/add/trim/restore/restructure/defer→先改 owner→跑窄检查与 `git diff --check`→报告；完成信号=每个改动保留完整命题、owner 先于 derivative、无 vendor 路径；失败处理=scope 缺失即停；例外=vendor 与 archived 排除；证据限制=编辑判断不可自动证明。

### 19.3 `dsh-trim-cot-leakage`

`【源义务】` 一条测试：**HEAD 上的读者，无法访问任何 session transcript、PR thread 或未提交草稿，能否解析每个引用并验证每个声明？** 否则把存活事实按仓库视角重述并删除其余；能则不是泄漏。但可解析只过本技能门槛；当前状态面（README、docs、JSDoc）上的可解析变更故事仍是 change narration，归 class 3。来源：`dsh-trim-cot-leakage/SKILL.md:8-13`。

`【源义务】` 8 类：死亡设计会话引用（`(decision 7)`、`(audit C2)`、`design §4.7`、phase label、`(B ruling)`）；栈/PR 视角（"a later PR in this stack"、"this PR adds"）；变更叙述与版本戳（"used to"、"no longer"、"v1"、"this cut"）；评审编排（"Rejected in review"、draft ordinal）；面向评审者的辩护（"the cast is safe — it simply…"）；复述与推导转录（control-flow narration、test walkthrough）；hedge 与计划残留（"probably fine for now"）；作者语言滑落（英文中的中文片段，或反向）。来源：`dsh-trim-cot-leakage/SKILL.md:14-24`。

`【源义务】` Keep 规则（`dsh-trim-cot-leakage/SKILL.md:25-38`）：issue 引用；Agent Note/postmortem 中的 merged-PR/issue 引用；suppression 理由（`oxlint-disable … -- reason`、coverage-ignore、空 catch 解释）；反事实现在时回归 pin；测量边界；运行时 old/new 状态；note change-story 节内的历史阶段名；仓库外按设计解析的引用（RFC 节、Figma 帧名）；项目声音与体裁形式。

`【源义务】` 工作流（`dsh-trim-cot-leakage/SKILL.md:39-45`）：先只读审计，跑 recall batteries（带 `--hidden` 搜 `.agents/`），每个探针先用 known positive 与 near-miss negative 校准；电池是探针不是定义，还要无模式读最密散文。修 owner-first：生成目录→追消费者→改源 JSDoc/模板→重生成；`type-equiv` fence→改源 JSDoc→两侧重贴；双语散文→最小更新并重录；双语 fence→逐字复制到两侧再重录；模型/用户可见字符串→按 prose standard 且只在有 owning 行为证据时改，否则报告推迟。删前枚举命题并查 overcorrection traps（把义务翻转成背书、把假设升为 shipped、删真事实、丢证据源）。验证：重跑电池，期望只剩 sanction keep、技能自身目录、owning note 引用证据；确认每个剩余引用在 HEAD 可解析；跑 touched surface 门禁。

**执行卡片**：前置=scope + 排除 vendor/archived；步骤=只读审计→语义判断→owner-first 修→命题检查→重跑；完成信号=无未解析引用、无变更叙述、keep 项有理由；失败处理=不确定时保留并报告；例外=keep 规则；证据限制=电池 over-match 且 under-match，必须人工判断。

#### 可执行的召回与校准

把以下正则分别交给可搜索隐藏目录的搜索工具，搜索路径仅取明确授权的 scope。使用 `--hidden` 或工具等价选项，同时最后排除 `vendor/`、`node_modules/`、`.agents/notes/archived/`、录制 fixture/snapshot；不跟随符号链接进入这些目录。源技能自身的校准目录也排除；目标技能中明确引用的校准材料是证据，不是正文使用违规。不要扩大 scope 来追求命中数。这里的搜索结果都是候选，**不是自动拒绝规则**。

英文探针中第一条区分大小写；第2–6条忽略大小写；第7条搜索节号本身。每条先确认能命中一个已知 positive，并拒绝一个 near-miss negative，然后才用于实际 scope：

1. `\(decision \d|\(audit [A-Z]\d|design §|plan §|design ledger|\(B ruling|\bP-I\b|\bW\d\b|\bT\d\b`
2. `\bthis PR\b|\bthis branch\b|\bthis stack\b|\blater PRs?\b|\bprevious commits?\b|\bthis commit\b`
3. `\bused to\b|\bno longer\b|\bpreviously\b|\bthe old\b|\bwas renamed\b|\bwas moved\b`
4. `\bv1\b|this cut|\bcut \d|\btoday\b|\bfor now\b|roadmap`
5. `rejected in review|review round|reviewer|as of v\d`
6. `probably |should be enough|should suffice|it simply|is safe —|is safe --`
7. `§\d`

中文与工作语言残留探针按表面限制，而不是跨全仓混搜：

- 中文 counterpart 的变更/评审叙述：`评审|上一?轮|旧版|老的|不再|以前|本版|遗留`，只搜 `*.zh.md`。
- 英文 Markdown 的中文残留：`设计稿|评审|上一?轮|旧版|老的|不再|以前|本版|遗留|私有|(^|[^a-zA-Z])端([^a-zA-Z]|$)`，搜 `*.md` 且排除 `*.zh.md`。
- 英文 TS/JS/CSS 注释：`(^[[:space:]]*(//|/\*|\*)|//|/\*)[^\r\n]*(设计稿|评审|上一?轮|旧版|老的|不再|以前|本版|遗留|私有|端)`，只搜相应源码扩展名。
- 英文 Python 注释：`#[^\r\n]*(设计稿|评审|上一?轮|旧版|老的|不再|以前|本版|遗留|私有|端)`，只搜 `*.py`。中文中的英文标识/代码很常见，不以通用 ASCII 探针判断翻译残留，而是对照新增散文与 counterpart。

例如 `this PR adds` 是已知 positive，`this project`、`this process`、`this provider` 是词界 near-miss negative；`used to` 探针必须能找到变更叙述，但 `the key used to sign requests`、`the old connection drains before the new one accepts` 仍要语义保留。`/v1/chat` 是协议路径，RFC 的可解析 `§N`、issue 引用、note 的 Alternatives-considered、运行时日期与录制时间戳也不能按词命中删除。保留 suppression 的必要解释与测量来源。每轮仍无模式阅读最密的实际散文；零命中不证明完整。

修复先列出全部命题，再按 owner-first 路径处理；禁止把“pending migration”的义务改成“sanctioned”背书、把假设改成 shipped、连同叙述删除事实，或去掉数字的测量来源。来源：`dsh-trim-cot-leakage/references/recall-batteries.md:1-52`、`references/examples.md:1-275@687f282e`。这是源手工评审方法的可用化，不是新自动内容门禁或独立审计证据。

---

来源：deepseek-harness/.agents/skills/dsh-doc/SKILL.md:1-132@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:1-78@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/review.md:1-67@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:1-87@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/style.md:1-49@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/website-sync.md:1-95@687f282e 来源：deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:1-81@687f282e 来源：deepseek-harness/.agents/skills/dsh-prose-standard/references/examples.md:1-169@687f282e 来源：deepseek-harness/.agents/skills/dsh-trim-cot-leakage/SKILL.md:1-45@687f282e 来源：deepseek-harness/.agents/skills/dsh-trim-cot-leakage/references/examples.md:1-275@687f282e 来源：deepseek-harness/.agents/skills/dsh-trim-cot-leakage/references/recall-batteries.md:1-52@687f282e 来源：deepseek-harness/docs/AGENTS.md:1-77@687f282e

<a id="aw-20"></a>
## 20. 测试可靠性、错误处理与 Cordis 生命周期（跨域入口）

### 20.1 `dsh-ci-test-reliability`

`【源义务】` 触发：新增/修改有 CI 并发、共享主机资源、时钟、进程全局状态、子进程、网络监听器或异步 teardown 风险的测试；调查 flaky CI；评审测试隔离。它拥有隔离与可靠性决策，不替代测试层级策略，也不为推送选命令。来源：`dsh-ci-test-reliability/SKILL.md:6-8`。

核心规则组（`dsh-ci-test-reliability/SKILL.md:18-131`）：

- **执行拓扑**：同文件测试、不同文件/worker 进程、同 job 内独立 gate 进程、共享主机的不同 Actions job 都可能重叠；进程隔离不隔离端口、可预测路径、外部服务、数据库、socket、继承子进程。对每个获取的资源识别 owner、原子分配机制、可观察就绪信号、注册清理、静默完成信号。
- **原子分配**：网络 fixture 用 `listen(0)` 绑 loopback，server 报 listening 后读地址；不要先扫空闲端口再绑定。私有 per-test 临时根用 `mkdtemp`；共享数据库/socket/session/output 用唯一 per-test namespace；必须不存在的路径用独占创建；稳定录制标识与临时 transport 地址分开，在 fixture 内翻译。
- **进程全局状态**：`process.env`、`cwd`、fake timers、locale/timezone、module mock、registry、console hook、`globalThis`、全局 `fetch` 拦截都是独占可变资源；优先注入依赖或实例局部 adapter；必须修改时捕获原值是 absent 还是 present、精确恢复、立即注册恢复、最小 `try/finally`、`afterEach` 兜底、只拦截 fixture 拥有的最窄请求。
- **平台语义**：写回值只在断言容忍写回失败时安全；NTFS 100ns tick 不能让分数毫秒无损往返；Windows 环境变量名大小写不敏感；Windows 异步释放文件句柄；Windows 无 POSIX 权限/信号语义。优先全平台成立的观察；确实不能时显式平台跳过并写原因。
- **超时预算**：`describe`/case timeout 覆盖 runner `--testTimeout` 而不是让步；低于 lane 预算会降低 CI 已给的额度；受进程创建约束的 suite 用 lane 预算，更紧的值要写原因；hook 预算随 test 预算一起提高；超时本身是主题时，外层等待远大于被测超时。
- **按状态同步**：固定 sleep 不是证据；等显式就绪事件、握手、状态转换、owned promise 或外部可观察条件；用 deferred/barrier 把竞态放在确定点；超时只用于界定等待；不要断言调度相关顺序，除非那是被测产品行为；时间本身是主题时注入/伪造时钟并恢复。
- **Dispose 到静默**：获取后立即注册清理，使断言失败也释放资源；清理停止新回调/请求、detach listener、恢复全局 hook、终止 owned work、await 子进程退出/server close/worker termination；只调 `abort()`/`close()`/`kill()` 而不 await 完成信号是不完整 teardown。
- **证明目标回归**：实用时先看普通回归失败；新静态/语料 guard 临时引入被拒用例并观察预期失败；竞态用 barrier 证明重叠，重复执行不是竞态测试；端口/socket/共享路径/子进程在跨进程隔离是修复一部分时并发独立测试进程；fixture 自带 deadline 时先断言没有信号/超时结束子进程再断言退出状态；验证外部状态/事件/文件/日志/退出/disposal，不信自报；压力运行补充确定性回归，不替代。
- **拒绝掩盖**：无目标状态的加超时、加重试、全文件串行、吞错/未处理 rejection、弱化断言、normalize 掉不稳定行为、清理/断言前加 sleep 都不是根因修复。真实 API 策略下文档化瞬态外部 provider 测试可重试，例外留在外部边界。恢复预算不是掩盖。
- **诊断现有 flake**：只读调查；读 `references/ci-flake-diagnosis.md`，按证据分类（host-resource collision、incomplete lifecycle、process-global contamination、load-sensitive synchronization、platform/entry-path mismatch、product concurrency defect、external-provider transience、runner infrastructure），从最小相关拓扑复现，按 owner 修。

### 20.2 `dsh-error-handling`

`【源义务】` 期望失败需要声明类型、稳定 discriminant、处理相关细节；复用包错误约定、保留 cause、机器身份与展示文本分离；**绝不**靠解析 message 路由处理；`assertNever` 等意外缺陷可保持普通 `Error`，containment 不得把它们变成成功。对每个失败定义处理与报告 owner、containment、保证（有效 invariant、absent/partial/committed/unknown 效果、清理责任），并写进 owning API 文档；后台工作保留这些义务。catch 限制异常传播，不限制 mutation；只有受影响状态 owner 能建立安全继续；否则停止依赖工作、丢弃无效状态/实例、升级；只记日志不是恢复；重试需要安全重复、取消、显式 owner；有限操作需要预算，持续监督需要生命周期所有权与可观察降级。每个最终报告需要可读摘要、受影响操作、安全下一步；经接收应用 locale 机制本地化；用户文本不含敏感内部细节。不可信状态或未知结果必须通过 UI 或默认开启的可访问日志可见：影响、不确定性、系统处置、安全下一步；持久无效状态需要持久可见；没有保证不要声称成功/回滚/安全重试；报告失败需要独立回退。验证结果状态与可见结果，不只是异常被捕获。来源：`dsh-error-handling/SKILL.md:6-30`。

### 20.3 `cordis-styling-nitpicking`

`【源义务】` 只报三条 P0（`cordis-styling-nitpicking/SKILL.md:25-60`）：

1. **单例**：进程级实例或可变状态 owner，其身份/生命周期来自模块加载、静态字段、全局 symbol、隐藏缓存或 `getInstance()`。弱键、大小边界、generation check、行为保持 memoization 不给模块级缓存 Cordis 所有权。排除不可变标量常量、纯冻结表、无状态函数、显式 scoped owner 内分配的对象。建议 Cordis service + 声明/解析的消费者依赖。
2. **未反转副作用**：disposal 后仍留下 listener、registration、timer、watcher、子 fiber、process、connection、临时文件、subscription、ambient patch、异步工作。abort/kill 而不 await settlement，且清理可能在 owned work 停止前返回，即违规。正确的 `ctx.on()`/`ctx.plugin()`/`ctx.effect()` 已提供反转，调用者不必保留早期 disposer；未管理资源需要 owned effect 或显式 await 清理。不要要求回滚有意的 durable write 或远端 mutation，但临时/活资源仍需 owner。
3. **清理依赖先于消费者完成**：任何完成清理所需的服务调用或事件投递都是生命周期依赖；让实际资源与 listener 可用到消费者 settle（含最终结果发布与 durable write）。provider 的 disposal promise 在消费者之后完成，不证明其资源活过消费者清理。当前 fiber unload 并发启动兄弟 disposer；service withdrawal 在自己的 disposer 内 await 依赖 fiber，而兄弟资源 closer 可能已运行；加 `inject`、反转注册顺序、保留 service 引用都不修复该竞态；listener 也可能属于 consumer fiber 并随操作 drain 自动退订。要求显式所有权与 await 顺序：停止 admission → 在消费者依赖仍可用时 settle accepted consumers → drain/release 资源；新 admission 拒绝与 accepted 操作完成分开 scope。用显式组合 effect 或资源拥有父级 + awaited consumer/service child；验证实际捕获的 disposer 身份。`ctx.effect(function* ...)` 序列化它收集的 disposer，但包裹独立注册 effect 的 wrapper 不转移原 effect 所有权；顶层 plugin generator yield 不是通用兄弟串行 disposal 保证；检查失败路径：一个清理错误不得跳过必需 abort/settlement/release。

`【源事实】` 当前 workaround：函数式 provider 插件用**一个** `ctx.effect(function* () { ... })` 组合 service 发布与资源 effect；yield 注册返回的精确 disposer；最后 `yield ctx.provide(name, service)`；需要 admission gate 时其清理最后 yield。这排序 provider withdrawal 而消费者仍注册，但不是完整 enclosing-owner shutdown 修复；root/enclosing-owner disposal 与独立启动的 consumer cleanup 仍要显式 owner 保留并 await 实际 consumer disposal task。yield 放在组合 `ctx.effect()` generator 内，即使插件本身是 generator；不要 yield 已注册 disposer 的替代 wrapper。来源：`cordis-styling-nitpicking/SKILL.md:45-60`。

**执行卡片**：前置=插件入口与可达调用图；步骤=定位 mutable owner/注册/资源获取/work admission→追 `this.ctx` 所有权→追清理到最后 service call/event/ack/durable write→比较 consumer 完成与依赖不可用时刻→构造合法失败交错；完成信号=三条 P0 中每条有/无违规的实证结论；失败处理=证据不足则报告 inspected scope 与 material gaps；例外=不可变常量/纯冻结表/无状态函数、有意 durable write、可选通知抑制；证据限制=模式搜索不能宣称穷尽安全。

---

来源：deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:1-131@687f282e 来源：deepseek-harness/.agents/skills/dsh-ci-test-reliability/references/ci-flake-diagnosis.md:1-60@687f282e 来源：deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:1-30@687f282e 来源：deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:1-65@687f282e 来源：deepseek-harness/docs/testing.md:7-55@687f282e 来源：deepseek-harness/packages/AGENTS.md:1-29@687f282e

<a id="aw-21"></a>
## 21. 升级指南工作流

`【源义务】` 触发：变更破坏外部可感知面（CLI、profile、`cordis.yml`/settings key、持久用户数据、SDK/wire API、发布包入口），或改动未发布升级指南已覆盖的面。**在引入破坏的同一个变更里写**，一旦识别就写，不推迟到发版准备。来源：`dsh-create-upgrade-guide/SKILL.md:6-8`。

- **范围**（`SKILL.md:10-20`）：只写仓库外用户在升级后可观察的破坏。pre-stable 内部 API 且消费者同变更更新则不需要指南。Session 格式变更仍遵循类型确认，其指南只写读者动作并链接记录。
- **位置**（`SKILL.md:22-28`）：`docs/upgrade-guide/v<version>/<item>/guide.md`；`<version>` 是写指南时根 `package.json` 的 `version`（如 `v0.1.7-rc.2`），描述从该 release 到下一个的升级；`<item>` 是 kebab-case 变更面。每个 item 目录恰好 `guide.md`、`guide.zh.md`、`guide.i18n.yaml`，无 index、无附件。
- **维护**（`SKILL.md:30-32`）：根版本未变时，当前版本目录描述 vT 到当前 `master` 的 delta；后续变更触及已有指南覆盖的面时，同变更更新；破坏被回滚则删除指南。版本 bump 后旧版本目录冻结；新破坏进新版本目录；**绝不**写跨一个 release 以上的指南。
- **格式**（`SKILL.md:34-46`）：从 `dsh-doc/templates/upgrade-guide.md` 开始。`verify-upgrade-guides` 强制：frontmatter 恰好 `kind: upgrade-guide` 与一句 `description`；一个 `#` 标题，然后 `## Change`、`## Migration`（中文 `## 变更`、`## 迁移`）按序；`guide.md` 最多 500 词（含 frontmatter）。`Change` 写旧/新行为与受影响者；`Migration` 列有序步骤，命名精确文件/key/命令/symbol，并说明如何确认迁移成功。超过 500 词时，额外文本去别处：链接源文件/symbol、把理据移入 Agent Note、把重复机械步骤变成脚本或 `dsh` 命令。
- **验证**（`SKILL.md:48-54`）：`pnpm run verify-upgrade-guides`、`pnpm run verify-translation-pairing docs/upgrade-guide/v<version>/<item>/guide.md`、`pnpm run verify-md-links`。

`【源事实】` 验证器实现：只允许 `v<semver>/<kebab-item>/guide.{md,zh.md,i18n.yaml}`；frontmatter keys 恰好 `description,kind`；标题标题 + 各语言节；英文 500 词上限（`scripts/verify-upgrade-guides.ts:1-85@687f282e`）。

**执行卡片**：前置=识别外部可感知破坏；步骤=定位版本/条目→写 Change/Migration→写中文→重录 pair→跑三个门禁；责任者=引入破坏的作者；完成信号=三件套齐全、节序正确、≤500 词、链接可解析；失败处理=超词先外移内容；例外=pre-stable 内部 API；证据限制=门禁只查格式与词数，不查迁移步骤是否真的有效。

---

来源：deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e 来源：deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e 来源：deepseek-harness/AGENTS.md:5-13@687f282e 来源：deepseek-harness/docs/AGENTS.md:15-37@687f282e

<a id="aw-22"></a>
## 22. 技能维护与人类评审

`【源义务】` `dsh-code-review` 由单一指定操作者用私有周期工具维护；工具选择窗口内合并的 PR（日更默认两个 UTC 天、周更七天），要求 merge commit 可从 `origin/master` 到达；不可达（父被 squash 的栈分支）或超过 250 commit 获取上限的 PR 记入 `skipped-pulls.json` 并跳过而非中止。它收集带 commit anchor 的 pre-merge 人类评审反馈（inline comments 与 review submissions），比较反馈时与最终落地 patch；不获取 PR conversation comments（当前 GitHub 状态无法给 force-push-safe 的反馈时基线），并排除 target-branch-only 变更。两个独立配置的 reviewer adapter 分类作者与是否采纳，再按当前技能分类 agreed-adopted 项；主 adapter 起草完整修订 `SKILL.md`；两个 adapter 审同一 diff；阻断发现循环直到双方批准；候选上跑 `doc-sync` 与 `lint` 后工具才声明成功。来源：`docs/cookbook/maintaining-dsh-code-review.md:7-18`。

`【源义务】` 操作者处理候选：**按自身价值读 diff**，不因“reviewer 批准”而服从；找清单膨胀、历史散文、从单一事件无支持外推、与现有技能/权威文档重复覆盖。对照运行产物抽查至少一个候选：链接的人类评论真的支持新增规则吗？链接的 PR 真的采纳了吗？然后 Discard / Batch / Promote。Promote 从干净 `master` 运行 helper；它刷新 master、验证当前技能匹配记录的 source blob、应用保存 diff、开 draft PR，body 列 source feedback URL/ID、landed commit 范围、来源 run、检查、操作者编辑；技能漂移时停止而不覆盖更新指导。不要逐字提交 adapter 输出。来源：`docs/cookbook/maintaining-dsh-code-review.md:19-49`。

`【源义务】` 无候选是常见且正确的：记录 “no candidate”，不发通知（避免告警疲劳）。中断处理：漏掉日更由两天重叠窗口自动覆盖；更长间隔用 `DSH_CODE_REVIEW_SINCE=<Nd>` 手动跑；重叠窗口幂等。adapter provider 故障：两个 reviewer 命令解析到字节相同可执行文件时拒绝运行；单批 adapter 响应 schema/id 失败时该批 fail-closed（全标 unclear）并继续，保留原始输出；任一 adapter 对任何非空批无有效结果时运行失败、写失败记录、通知操作者；**绝不**把全面 provider 故障折叠成 “no candidate”。交接：开取代当前 note 的后续 Agent Note，把机制移进仓库或记录新操作者私有设置；不要静默转移工具。来源：`docs/cookbook/maintaining-dsh-code-review.md:50-64`。

`【迁移设计】` 若目标仓库没有“私有维护工具 + 单操作者”条件，保留的知识是：技能需要周期性从真实评审反馈更新；更新必须有人类最终判断；promotion 要防技能漂移；故障要 fail loud。可用人工月度评审 + PR 模板替代，但必须标注这不等价于自动周期采集。

---

来源：deepseek-harness/docs/cookbook/maintaining-dsh-code-review.md:1-64@687f282e 来源：deepseek-harness/.agents/notes/proposed/process/2026-07-13-human-review-skill-maintenance.md:1-85@687f282e 来源：deepseek-harness/.agents/skills/dsh-code-review/SKILL.md:1-61@687f282e

<a id="aw-23"></a>
## 23. 评审批准门（跨域）

`【源义务，跨域】` 源仓库用 `weighted-approval` 工作流发布批准分数；分支规则应只要求那个以 GitHub Actions 为预期来源的 commit status，而不是仅 context 的要求（否则可能接受同名状态）。政策文件给指定账号两点权重，其他有写权限评审者一点；作者自己的评审与无写权限评审者不计。作者贡献 `min(100, mergedPRCount) × 11 / 1000` 点；作者信用不能单独满足两点要求。一分的批准按生产代码行所有权加权 `min(2, 1 + 4 × ownedLines / totalLines)`，由 live base 与精确 reviewed head 的 merge base 上的 `git blame` 归属；0%/12.5%/25% 所有权给 1/1.5/2 分，上限 2；阈值仍是 2 分，不四舍五入。来源：`.github/review-ownership/README.md:1-63@687f282e`。

`【源义务，跨域】` `/delegate @username` 作为 PR conversation comment 的**全部文本**，把自己的评审点转给该用户的 effective `APPROVED`；双方都必须当前有写/管理权限，且都不能是 PR 作者；发送者最新存活的合格、作者授权命令胜出；任何后续评审（approval、change request、comment-only，含 inline “Add single comment”）自动收回；delegate 可收多人点但只能转自己点；作者信用不可转；其他评审者的 effective `CHANGES_REQUESTED` 仍阻塞。来源：`.github/review-ownership/README.md:35-44`。

`【源义务，跨域】` 安全：status-writing job 的所有 action 钉 commit SHA；只 checkout 默认分支；不 checkout/执行 PR 代码；不用仓库 secret；只在无 blocker、评审点+作者信用不足、且批准是默认权重时才用 job token 取完整历史；Git 对象作为数据传给可信 classifier；fetch 凭据只在 Git 子进程环境；缺失历史/解析失败/不完整作者查询使评估失败而非部分分数。政策变更只在合并进默认分支后生效。来源：`.github/review-ownership/README.md:45-52`。

本域只负责“评审/handoff 的批准门语义与何时要求评审”；具体 workflow YAML、分类器、计分实现归 automation 域。迁移时若目标仓库没有等价门禁，必须显式记录“批准门未迁移”，不能用“人工评审流程”冒充自动保证。

加权部分的具体可选执行面见 [审批模块](github-approval.md)，包含源评分器、委托、生产根参数化与双工作流；它不自动部署或配置远端，目标缺少受信 publisher/原生保护时仍是未迁移，不把文件就位算作批准门生效。

---

来源：deepseek-harness/.github/review-ownership/README.md:1-63@687f282e 来源：deepseek-harness/.github/review-ownership/approval-policy.json:1-12@687f282e 来源：deepseek-harness/.github/review-ownership/check-approval.mjs:1-60@687f282e 来源：deepseek-harness/.github/workflows/weighted-approval.yml:1-66@687f282e

<a id="aw-24"></a>
## 24. 迁移落地清单

### 24.1 最小可运行集合

按依赖顺序落地；每一步都要有完成信号。

1. **指令层**：根 `AGENTS.md`（只常驻命令）、子树 `AGENTS.md` 占位、`CLAUDE.md` 链接或生成副本。完成信号：加载器只渲染一次；预算门禁通过。
2. **技能层**：`.agents/skills/` + 至少 6 个核心技能（评审、推送前、栈、Agent Notes、文档、测试可靠性）。完成信号：模型目录能按 description 选中；`verify-skill-invocation-metadata` 通过。
3. **评审层**：`dsh-code-review` + `docs/defensive-patterns/` 的等价物 + PR 模板（Motivation/Changes/Testing/Proof）。完成信号：一个真实 PR 能用阻断项/人工检查/报告结构完成评审。
4. **推送层**：`change-scope` 等价物 + hook 策略 + 证据映射表。完成信号：一次真实变更能选出最小证据并通过。
5. **交接层**：Agent Note 路径/格式/分类/归档 + verifier。完成信号：一个 note 能创建、移动生命周期、归档、封印。
6. **专项层**：按目标产品实际存在的面启用 UI/美术/浏览器/翻译/provider/性能/简化/升级指南。完成信号：每个启用面有可执行入口与至少一次真实运行证据。

### 24.2 参数化表

| 源参数 | 源值 | 迁移时决定 |
|---|---|---|
| 项目根标记 | `.git` | 目标仓库的根标记；影响指令与技能发现 |
| 指令文件名 | `AGENTS.md`、`CLAUDE.md`、`*.local.md` | 目标产品的候选文件与本地叠加 |
| 技能根 rank | `.dsh/skills` 100、`.agents/skills` 200、custom 300、user 400/500、bundled 600 | 目标产品的根与优先级 |
| 技能名格式 | kebab-case | 是否保持 |
| 技能调用开关 | `disable-model-invocation`、`user-invocable`；Codex `policy.allow_implicit_invocation` | 目标产品的等价开关 |
| 文档预算 | manifest 见 §1.4 | 目标仓库的常驻文件与上限 |
| 证据命令 | `change-scope`、`test:docs`、`doc-sync`、`test:snapshot`、`test:e2e`、`test:bench` | 目标仓库的等价命令；没有就记录缺口 |
| 栈工具 | `gh stack` v? + GitHub 原生 stacks | 目标托管平台是否支持；不支持则不得声称栈语义 |
| GIF 上限 | attach ≤10 MB；编码器默认 5 MiB | 目标平台附件上限 |
| 最小视口 | 390 CSS px | 目标产品的最小宽度 |
| 指南词数 | 500 | 目标仓库的指南上限 |

### 24.3 迁移时必须显式记录的“不适用”

- 没有 Codex 元数据 → 跨产品调用一致性只覆盖已存在的产品；记录未覆盖面。
- 没有原生 PR 栈 → `dsh-merging-stacked-prs` 只能作为“必须使用平台原生栈，否则硬停”的知识保留，不得用手工流程冒充。
- 目标确实没有双语面 → 翻译工作流可标“不适用”，但必须给出“没有双语内容/翻译契约”的证据；若只是缺少翻译工具、术语表或执行预算，保留义务并记录未执行。`dsh-prose-standard` 的命题规则仍适用。
- 没有真实 provider key → provider 证据只能标 planned；不得声称 with-key 通过。
- 没有设计者角色 → 美术/GUI 的批准门无法满足；必须记录阻塞，而不是自行批准。
- 没有 ffmpeg/ffprobe → GIF 编码不可执行；不得用截图冒充 GIF 证据。

---

<a id="aw-25"></a>
## 25. 源缺口、未决项与漂移

以下区分**源仓库自身**的保证边界、已知缺口和本域未能确证的点；概念上的不同不能一概称为漂移，也不得把未实现项当成已实现保证。

1. **预算目标不等于硬上限**：`docs/AGENTS.md:59` 的写作目标与 manifest 的自动拒绝上限分别治理；architecture2400/2410、testing1300/1350 的差异本身不构成漂移。`examples/AGENTS.md`310由评审治理，不是脚本已执行的上限；不要合并两种概念、删掉必要内容或静默重设门槛。
2. **技能内容无自动正确性检查**：只有调用元数据、文档标准测试、预算与链接检查。技能中的判断规则靠评审。`doc-standard.spec.ts` 只检查 kind↔template 映射与“无原型期语言”等有限属性。
3. **跨产品策略检查在干净检出上为空**：`verify-skill-invocation-metadata` 只遍历存在 `agents/openai.yaml` 的目录，而该文件被 gitignore；因此 CI/干净检出报告 0 对并通过。它不能证明仓库技能策略齐全。
4. **符号链接无跨平台检查**：`CLAUDE.md`、`.claude/skills`、`agent-experience/SKILL.md` 依赖 Git 符号链接；Windows `core.symlinks=false` 会物化，指令加载器把 `CLAUDE.md` 的路径文本当普通指令读入，技能 provider 因缺 frontmatter 跳过 `agent-experience`。源仓库没有对应门禁或文档化处置。
5. **无通用连续会话协议**：源仓库依赖 Agent Notes/Dev Note/scratch/git 历史；没有“新会话读取状态文件继续”的标准。§11.6 是迁移设计。
6. **注释/技能中的“官方”批准人名单会过期**：`dsh-client-ui-ux` 的设计评审 roster 是 2026-09 快照，并要求成员变化时在此更新；没有自动校验。
7. **`dsh-code-review` 维护机制在仓库外**：私有工具、凭据、调度器不在仓库；cookbook 只描述保证，不描述实现。仓库无法独立验证该周期更新真的发生。
8. **栈能力依赖 GitHub 与 `gh stack` 扩展**：跨 fork、GHES、扩展缺失都硬停；源仓库没有降级路径。
9. **GIF 编码器测试不在 CI**：需要本地 ffmpeg/ffprobe；`SKILL.md:115` 明说这些媒体测试不在仓库 CI 运行。编码器回归只能本地发现。
10. **性能预算的浏览器校准需实际 runner**：源文档要求 before adopting timing budgets 在真实 CI 浏览器/runner 上重复测量；仓库内没有通用浏览器校准器。
11. **`docs/AGENTS.md` 的 tier 表与 `docs/AGENTS.md` 的预算段并非同源生成**：两者可能再次漂移；迁移时建议从 manifest 生成预算段。
12. **Agent Note 语义分类无法自动化**：“是否值得保留/归档/删除”靠人判断；verifier 只查路径、类、格式、三件套、seal。

---

<a id="aw-26"></a>
## 26. 验收与证据状态

以下验证项均为 `planned`：本参考在只读源上编写，未在目标仓库执行。它们用于指导集成后的验证，不作为已通过声明。

| 机制 | 正向 | 拒绝 | 恢复 |
|---|---|---|---|
| 指令层级 | 新会话加载根+子树指令，模型能看到更具体规则 | 删除根文件后，子树规则仍加载但失去常驻命令 | 恢复根文件并重跑加载快照 |
| 符号链接 | `git ls-tree` 显示 `120000`；加载器只渲染一次；技能目录包含 `agent-experience` | 在 `core.symlinks=false` 的检出上，`CLAUDE.md` 的路径文本被当普通指令读入，且 `agent-experience` 不在技能目录 | 修复检出或改用生成副本 + 内容一致性检查 |
| 技能调用策略 | 缺省归一化 `{true,true}`；原始 `disable-model-invocation:false` + `user-invocable:false` 归一化为 `{true,false}`（model-only）；manual-only 技能在两个产品都不可被模型隐式选中 | 单侧 `disable-model-invocation:true`，或原始 `disable-model-invocation:true` + `user-invocable:false`（manual-only 且用户入口关闭，带 `agents/openai.yaml` 时）→ 门禁失败 | 修正另一侧策略后重跑 |
| 评审 | 真实 PR 产出阻断项与证据 | 未验证 base/head 就评审 → 应被流程拒绝 | 重新验证 ref 后重跑 `change-scope` |
| 推送证据 | 最小证据通过且远端 SHA 匹配 | 用 `--passWithNoTests` 或缩窄覆盖掩盖未覆盖文件 → 评审拒绝 | 补 owning tests 或恢复覆盖范围 |
| 历史改写 | lease 推送成功；post-sync 每层验证 | 原始 `--force` 或并发前进时覆盖 → 必须中止 | 重新抓取 heads 并重评 |
| 栈落地 | 每个 PR `MERGED`；剩余上层仍是官方栈 | 跨 fork / 无 `gh stack` → 硬停 | 满足前置后重试；不得退化手动合并 |
| Agent Note | note 创建/移动/归档/封印全通过 | 归档后编辑 → verifier 拒绝 | 还原内容；新决策开新 note |
| 交接 | 新会话能按 handoff 状态执行下一命令 | 状态与仓库不一致仍继续 → 必须停下核对 | 以仓库状态修正状态文件 |
| UI | 明暗主题可读、390px 无重叠、遮罩三验 | 全局改 `--dsh-frame-top-clearance` → 评审拒绝 | 改 scoped 页面覆盖 |
| 美术 | 三个门禁通过 + 设计批准 | 用白色圆盘伪造透明 → 视觉/评审拒绝 | 改 mask/cutout |
| GIF | 编码 summary 与视觉检查通过；live head 未移动 | 拼接不同运行/用 fixture 冒充真实模型 → 评审拒绝 | 全新 roots 重录 |
| 翻译 | pair 结构/术语/链接/sidecar 一致 | 整篇重译一个增量 → 评审拒绝 | 改为最小更新并重录 |
| Provider | with-key smoke 发生真实模型轮次 | 无 key 却声称通过 → 评审拒绝 | 补 key 后重跑，或标未验证 |
| 性能 | 前后绝对值/比率 + 负向控制 | 放宽预算或挑幸运运行 → 评审拒绝 | 恢复预算并重测 |
| 简化 | 每个候选有 owner/路径/损失 | 零调用点即删除公共扩展点 → 评审拒绝 | 恢复并按历史模式校准 |
| 升级指南 | 三件套 + 节序 + ≤500 词 + 链接 | 推迟到发版准备才写 → 评审拒绝 | 在引入破坏的变更内补写 |
| 技能维护 | 候选经人类按价值审阅后 promote | 逐字提交 adapter 输出 → 评审拒绝 | 人工编辑后重新开 PR |

**证据限制**：上表是验证义务，不是已执行结果。集成后必须由独立验证者运行并记录真实命令与输出；任何“绿”都必须绑定精确 source/target/deliverable 版本。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `agent-workflows-instruction-tiers`：`deepseek-harness/docs/AGENTS.md:1-77@687f282e`
- `agent-workflows-symlink-indirection`：`deepseek-harness/packages/context/agent-instructions/README.md:1-236@687f282e`
- `agent-workflows-skill-catalog`：`deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-74@687f282e`、`deepseek-harness/docs/subsystems/skills.md:64-150@687f282e`
- `agent-workflows-skill-invocation-policy`：`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e`
- `agent-workflows-onboarding`：`deepseek-harness/docs/development.md:9-53@687f282e`、`deepseek-harness/docs/development.md:133-162@687f282e`、`deepseek-harness/docs/development.md:196-205@687f282e`、`deepseek-harness/README.md:11-15@687f282e`、`deepseek-harness/README.md:17-42@687f282e`、`deepseek-harness/README.md:49-56@687f282e`
- `agent-workflows-task-intake`：`deepseek-harness/scripts/change-scope.ts:1-50@687f282e`
- `agent-workflows-code-review`：`deepseek-harness/docs/defensive-patterns/README.md:1-25@687f282e`、`deepseek-harness/docs/testing.md:7-55@687f282e`、`deepseek-harness/.github/pull_request_template.md:1-21@687f282e`
- `agent-workflows-history-rewrite`：`deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:7-26@687f282e`
- `agent-workflows-stack-review-propagation`：`deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:1-32@687f282e`
- `agent-workflows-agent-note-lifecycle`：`deepseek-harness/.agents/notes/README.md:7-125@687f282e`、`deepseek-harness/scripts/agent-note-tree.ts:1-40@687f282e`、`deepseek-harness/scripts/verify-agent-note-format.ts:1-40@687f282e`、`deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e`、`deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e`
- `agent-workflows-agent-note-archive`：`deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e`、`deepseek-harness/scripts/archived-agent-notes.ts:1-60@687f282e`、`deepseek-harness/scripts/archived-agent-notes.spec.ts:1-60@687f282e`
- `agent-workflows-handoff`：`deepseek-harness/docs/cookbook/maintaining-dsh-code-review.md:54-64@687f282e`
- `agent-workflows-ui-review`：`deepseek-harness/packages/client/AGENTS.md:1-40@687f282e`
- `agent-workflows-artwork`：`deepseek-harness/docs/cookbook/adding-a-plugin-preview.md:1-52@687f282e`、`deepseek-harness/scripts/verify-package-meta.ts:1-40@687f282e`、`deepseek-harness/scripts/gen-official-bundle-catalog.ts:1-40@687f282e`
- `agent-workflows-browser-evidence`：`deepseek-harness/apps/web/tests/pin-browse-picker.overlay.yml:1-13@687f282e`、`deepseek-harness/apps/web/tests/README.md:1-39@687f282e`
- `agent-workflows-translation`：`deepseek-harness/docs/i18n/README.md:7-69@687f282e`、`deepseek-harness/scripts/translation-pairing.manifest.json:1-13@687f282e`、`deepseek-harness/scripts/gen-translation-brief.ts:1-40@687f282e`、`deepseek-harness/scripts/verify-translation-pairing.ts:1-40@687f282e`
- `agent-workflows-provider-evidence`：`deepseek-harness/docs/cookbook/adding-an-llm-adapter.md:1-43@687f282e`
- `agent-workflows-performance`：`deepseek-harness/benchmarks/AGENTS.md:1-18@687f282e`
- `agent-workflows-simplification`：`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:1-36@687f282e`
- `agent-workflows-upgrade-guide`：`deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e`
- `agent-workflows-skill-maintenance`：`deepseek-harness/docs/cookbook/maintaining-dsh-code-review.md:1-64@687f282e`、`deepseek-harness/.agents/notes/proposed/process/2026-07-13-human-review-skill-maintenance.md:1-85@687f282e`
- `agent-workflows-review-approval-gate`：`deepseek-harness/.github/review-ownership/README.md:1-63@687f282e`、`deepseek-harness/.github/review-ownership/approval-policy.json:1-12@687f282e`、`deepseek-harness/.github/review-ownership/check-approval.mjs:1-60@687f282e`、`deepseek-harness/.github/workflows/weighted-approval.yml:1-66@687f282e`
