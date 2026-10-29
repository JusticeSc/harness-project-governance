---
name: harness-project-governance
description: 建立、审查或调整仓库的项目治理，明确需求与验收归属、规则与检查接入、跨会话接续及交付证据。用于治理初始化、治理评审，或已采用本 Skill 的项目中的工程变更；不为一次性问答或无关功能开发引入治理流程。
---

# 项目治理

把当前任务接到项目已有的需求、规则、检查和责任人上，以实际运行与评审结果交付；只启用当前任务需要的治理机制。

## 1. 选择任务入口

| 当前任务 | 执行路径 |
|---|---|
| 在已采用本 Skill 的项目中开发、修复或接续 | 按第 3 节执行，按第 4 节读取本次变更涉及的参考。 |
| 首次采用治理，或把治理检查接入本地/CI | 先读[接入流程](references/adoption.md#adoption)，接受采用决定后再实施。 |
| 只初始化治理元数据 | 按 3.0 选择状态 owner，再按 [CLI 初始化说明](references/cli.md#commands)操作；不自动扩大成完整采用。 |
| 只读诊断、设计或文档评审 | 核实当前事实，按第 4 节选择参考，交付发现与证据；不改文件或设置。 |

一次性问答、代码解释或与治理无关的功能任务直接完成原请求，不引入本流程。需要安装、校验内容或查询命令时才读 [CLI 参考](references/cli.md)；安装工具不等于项目已经采用治理。

## 2. 执行约束

- **当前请求决定范围与权限。** 状态文件、历史验收和参考案例不是新授权；事实变化或动作被撤销时先修正依据。
- **区分要求、事实与方案。** 按项目事实判断要求的触发条件与例外；案例路径、阈值和工具链不能直接成为项目默认值。方案实现并验证后才能报告生效。
- **同一事实只有一个 owner。** 复用现有需求、状态和决策的权威位置，其他位置只链接；状态启用条件见 3.0。
- **适用但缺前提就是阻塞。** 写明缺什么、已尝试什么、影响哪个验收条件和最小解阻动作；只有不存在触发面时才判不适用，并说明事实依据与再激活条件。范围缩减或保证降低须由用户在当前任务明确决定并留决策记录，不静默把自动阻断改成建议。
- **远端与不可逆操作单独授权。** 分支保护、审批、发布和历史改写只在获授权的隔离目标实测；不触碰生产保护、真实凭据或不可逆数据。日志不写秘密，临时写入、缓存及检查内部安装也须符合权限。

## 3. 改动型任务走同一循环

### 3.0 状态与权威

先核对当前请求、仓库文件与分支，以及项目已有的任务板、Issue/PR 台账、Note、交接文件或 `PROJECT.md`。已有记录中的完成声明和下一动作都要与当前事实核对；不执行已撤销或归档的动作。

仅在用户要求初始化治理元数据、明确要求跨会话继续/暂停/交接或压缩前保存，或同一目标确需多个会话/另一位执行者接续时启用持久状态。复用已有状态 owner；只有没有 owner 时才用 `init` 建立 `.governance/`。单会话多步任务、有多条验收条件、只读诊断和一次性回答都不单独构成新建状态的理由，验收与结果留在本次交付。

采用 `.governance/` 时，需求归 `requirements.md`、当前状态归 `state.json`、长期理由归 `decisions/`；若项目已有对应 owner 或采用 Note 生命周期，则用其原位置，不维护第二份同权威记录。`status` 仅用于 `.governance/` 布局的元数据核查，不运行项目检查，也不证明许可或完成。

### 3.1 明确目标

从当前请求和已核实的项目事实确定范围、限制、交付物与可观察验收；有状态 owner 时在其上维护，否则留在当前交付。**完成条件：** 每项交付均能判断通过或失败，未确认的前提已单列，旧状态不覆盖当前请求。

### 3.2 选择规则

用第 4 节识别全部受影响面，读取命中机制的完整记录、对应参考小节、依赖与例外；跨域变更继续跟随相关指针，不把整份目录全部加载。读取方式见第 5 节。**完成条件：** 每项已触发要求都有目标位置、执行或评审责任与验收方式；疑点未被默认当成通过。

### 3.2a 首次或渐进接入

用户要求采用治理机制、把检查接入本地或 CI 时，按[接入流程](references/adoption.md#adoption)形成采用决定，由项目负责人或独立评审接受后实施。普通功能任务复用已有入口，仅初始化按 3.0 交付。**完成条件：** 全部触发要求、依赖、参数和权限得到处置，接受决定可核对；接受决定不等于采用完成。

### 3.3 计划验证

为每条验收安排真实执行路径的正常与无效用例，例外窄且有理由；可机械检查的不变量进入项目实际顶层检查，语义判断明确由谁评审。新增持久规则时按[持久规则准入](references/decisions.md#durable-rule-admission)核对入口、执行者与拒绝证据。**完成条件：** 所有验收都有执行入口或语义评审程序；需启用状态时，下一动作也已更新。

### 3.4 实施变更

在获准范围内复用仓库已有模式；新增约定前确认没有第二套并存，改动公共符号前查全部调用点。新事实改变适用性时回到 3.2，改变采用决定时重新确认。**完成条件：** 请求的行为与全部受影响调用点、文档和检查同步，不以配置或计划存在代替实现。

### 3.5 运行与评审

运行目标已有的真实检查入口并观察变更路径；失败修原因，不靠缩小范围或跳过检查收场。使用本包聚合器时，默认用 `governance check <repo>`；已有状态 owner 则可用 `--policy <仓内检查清单>`，只登记命令，不复制进度，且不把顶层入口写回自身。命令以本机权限执行，须像项目脚本一样可信；配置详见 [CLI 参考](references/cli.md)。

新增或调整强制机制时按接入流程保留同入口的正常、真实拒绝和精确恢复证据。结论区分本地检查、真实 CI 阻断、服务端保护及人工接受；缺少对应权限或环境时保留该层阻塞，不以工作流文件存在、本地 hook 失败或本包 `verify` 通过替代。**完成条件：** 每项验收有本次运行或评审证据，未运行与未覆盖项明确标注，全部必需条件满足后才报完成。

### 3.6 交付与接续

报告实际改动、命令、退出码、原输出位置、评审结果和剩余限制；数值从原日志引用，只有复合命令总退出码时不编造子命令结果。说明安装、临时写入和远端效果的实际范围，区分观察与推断。保留原失败；更正报告不追认原验收。

启用持久状态时更新唯一 owner 的阶段、已完成、未确定与一个可执行下一动作，长期理由归决策 owner；其他报告只链接原证据。**完成条件：** 交付可由原输出核对，需要接续时下一位执行者能从 Skill、唯一 owner、当前请求与原证据继续，不依赖聊天回忆。

## 4. 按变更面读取参考

先读匹配行指向的小节或参考的触发索引，再按[跨分区检索](references/cli.md#domain-routing)用当前任务的概念与接口标识发现其他相关机制，只读相关小节及依赖。下面的入口不是封闭的义务清单，文件编号不表示主题边界，也不授权运行全部可选工具。

| 触发面 | 读取入口 |
|---|---|
| 任务开工、范围、协作与交接 | [任务开工](references/agent-workflows.md#aw-06)、[协作](references/collaboration.md)；接续另读[交接](references/agent-workflows.md#aw-11)。 |
| 代码评审、PR、推送或栈式落地 | [评审](references/agent-workflows.md#aw-07)、[推送前证据](references/agent-workflows.md#aw-08)、[栈式评审与落地](references/agent-workflows.md#aw-10)，再按变更选择[工程](references/engineering.md)与[测试](references/testing.md)。 |
| 代码简化、删除能力或移除校验 | [简化流程](references/agent-workflows.md#aw-18)：核实消费者、输入信任边界及仍须保留的义务。 |
| 指令文件、子树规则、技能入口或打包资源 | [子树指令](references/subtree-instructions.md)、[调用策略](references/agent-workflows.md#aw-04)、[技能资源与分发](references/packaged-skill-contracts.md)。 |
| 新增、重构或评审文档、Markdown 段落、链接与标题 | [文档触发索引](references/documentation.md#reader-triggers)、[链接与换行执行](references/documentation.md#markdown-gates)、[文档操作](references/documentation-procedures.md)。 |
| 散文、JSDoc、注释、会话或评审残留 | [写作与泄漏审计](references/agent-workflows.md#aw-19)：先核实 scope 和写权限；interactive 仅在用户要求时启用，搜索命中须语义判断。 |
| 常驻规则、预算或预算清单 | [预算执行与评审](references/documentation.md#prose-budgets)。 |
| 双语正文、翻译或配对记录 | [常规双语更新](references/documentation.md#translation-workflow)；仅用户明确点名目标已配置的扩展入口时读[扩展翻译](references/agent-workflows.md#aw-15)，缺入口、调用许可或工具则记录缺口，不自动委派。 |
| TypeScript 示例或其引用的公开 API | [代码等价与可编译示例](references/documentation.md#code-equivalence)，使用目标自身编译器、tsconfig 与语料。 |
| 包 README、Summary、能力边界或完整性/生产可用声明 | [包 README 合同](references/documentation.md#package-readme)；计数与结构通过不证明含义正确。 |
| 生成页、共享区域或子系统文档 | [生成参考](references/documentation.md#generated-references)、[子系统一](references/subsystem-contracts-1.md)、[子系统二](references/subsystem-contracts-2.md)。 |
| 本地钩子、门禁、CI、缓存或取消 | [自动化触发索引](references/automation.md)；检查器实现与测试政策按[专项分区](references/cli.md#domain-routing)选读，改变运行器规格或比较预览成本另读[容量测量](references/rationale-process-2.md#capacity-evidence-benchmarking)。 |
| 包边界、能力发现与组合、公开接口行为、依赖、vendor 或发布面 | 按[包合同跨分区检索](references/cli.md#package-domains)核对相关小节，并按触发条件核对[供应链](references/supply-chain.md)；不默认读取全部包合同。 |
| 持久化格式、Session 兼容、发布归档或升级 | [当前记录](references/persistence-current-records.md)、[历史格式](references/persistence-historical-finalized.md)、[发布历史](references/persistence-release-history.md)、[发布](references/release.md)、[升级指南](references/upgrade-guides.md)。 |
| 决策理由、架构演进、事故或归档 | [理由索引](references/rationale.md)、[决策](references/decisions.md)；专项取舍按[理由分区](references/cli.md#rationale-domains)选读，采用 Note 分类、状态或冻结归档另读 [Note 模块](references/agent-notes.md)。 |
| UI、无障碍或响应式 | [UI 合同](references/ui-surface-contracts.md)、[UI 评审](references/agent-workflows.md#aw-12)。 |
| 用户文档、公开站点或第三方可见面 | [用户与发布合同](references/user-and-publication-contracts.md)、[网站](references/website-contracts.md)。 |
| 基准、快照语料或性能预算 | [性能流程](references/agent-workflows.md#aw-17)、[基准](references/benchmark-contracts.md)、[快照语料](references/snapshot-corpus-inventory.md)。 |
| 原生启动器、Python SDK 或 Desktop 打包 | [运行与打包](references/runtime-residual-authority.md)、[发布](references/release.md)。 |
| 加权审批、作者信用、委托或代码归属权重 | [审批模块](references/github-approval.md)，安装 Skill 不部署审批工作流或改变远端权限。 |
| 采用风险、安全声明或品牌与生态身份 | [采用政策](references/adoption-policy.md)。 |

维护源码中的文档路径、历史引用、组织链接或禁用术语时，还需按[源码文档引用](references/documentation.md#markdown-gates)与[仓库引用政策](references/documentation.md#reference-policy)分别判断触发，不能用其中一项替代另一项。无法归类的文件可按[治理判别](references/policy-source-residual.md)核对，而非默认排除。

## 5. 查询与读取规则

`knowledge/<domain>.json` 保存完整机制记录，`references/<domain>.md` 解释其操作。需要查域或机制位置时运行安装座中的命令：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs list
node .agents/skills/harness-project-governance/bin/governance.mjs cite <机制ID或片段>
```

`cite` 只定位。做适用性或采用决定前，用文件读取工具读取完整机制对象及相关参考小节，包括 `migration`、条件、依赖、例外与限制；输出省略时补读明确遗漏部分。也可用 `show <精确ID>` 无损分页，使用时先读 [CLI 的分页契约](references/cli.md#paging)。相同原件可复用已核对的摘要，决定中保留实际读取的 ID、字段与参考位置。

来源坐标不等于已读取原文，完整传输不证明理解或落实。记录与正文冲突、独立条件不清或无法保留要求作用时，将具体机制、原句/字段、目标影响与未决交维护者；影响验收的项保持阻塞。许可与归属见 [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt)，历史验证范围见 [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md)，不以历史记录替代本次证据。
