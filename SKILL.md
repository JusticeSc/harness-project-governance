---
name: harness-project-governance
description: 把 DeepSeek Harness 式项目治理落到任意代码库：识别项目与工具链、建立需求/验收与工作状态、按任务路由到已提取的治理参考、执行变更与独立评审、以真实命令输出完成验证和交接。用于初始化治理、接续任务、日常变更、缺陷修复、代码简化与删减评估、设计/文档/发布评审、强制体系核查。
---

# Harness 项目治理

本 Skill 是从 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 独立提取的**治理知识与操作程序**，不是产品代码副本。它回答两件事：源仓用哪些义务、门禁和反例约束“维护者如何修改、验证、评审、发布这个项目”；这些义务迁移到当前仓库时，怎样在不削弱作用的前提下落地。

**1.1.0-rc.1 交付边界。** 本版用于由项目负责人或独立评审确认的辅助采用。核心CLI、安装器及可选工具只提供各自声明的保证；安装、分页完整或检查通过均不认证自主采用、跨项目稳定复现或全部源义务迁移。当前采用程序以§3.2a为准，版本验证与历史失败边界见 [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md)。

**适用**：任何需要建立或收紧工程治理的仓库；尤其是有多包/多工具链、生成文档、双语页面、持久化格式、CI 门禁、评审与发布流程的项目。

**不适用**：只要一次性答案或与仓库治理无关的产品功能实现；此时直接做事，不要引入治理流程。

## 1. 安装与完整性

安装 = 把本 Skill 目录（`SKILL.md`、`references/`、`knowledge/`、`bin/`、`tools/`、`package.json`、`SOURCE-LICENSE.txt`）原样复制到目标仓库的 `.agents/skills/harness-project-governance/`。核心运行时不依赖源仓、发布者路径或网络；可选执行模块的依赖按其参考单独准备。

从公开仓库获取时，先按 [README.zh.md](README.zh.md) 运行 `npm run verify` 与 `npm run demo`；用 `node scripts/install-skill.mjs <目标仓库>` 安装白名单文件，已有安装座会拒绝，不覆盖。演示使用真实小应用、验收失败与恢复，但不证明自主 Agent 已在其他项目中采用。历史公开版本的运行记录与适用边界见 [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md)。

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs verify
```

`verify` 只证明交付内容自洽：全部机制可解析、ID 唯一、每项都有存在的参考文件、锚点和来源区间。锚点可来自 Markdown 标题、标题末尾的 `{#id}` 或 HTML 锚点；普通链接和围栏代码中的示例不算定义。它**不**证明目标项目已落实治理。核心命令需要 Node ≥ 22.19，无第三方依赖；可选 GitHub 审批模块另需 Python/Pygments。

`package.json` 将运行面列入离线包：可用 `npm pack --ignore-scripts --offline` 打包，再从本地 tarball 安装。Node 核心无第三方依赖；可选审批模块的 Python 依赖单独固定在其 `requirements.txt`。`private: true` 防止误发布到 registry。安装后的命令名为 `harness-governance`；npm 不自动注册 Agent Skill，实际发现仍需上述 `.agents/skills/harness-project-governance/` 布局。研究、审计、验收项目和缓存不进入运行包；打包成功不代表目标项目已经配置或执行治理检查。

命令：

| 命令 | 作用 |
|---|---|
| `verify` | 校验本 Skill 的知识与引用完整性；失败退出 1。 |
| `list` | 按域列出机制数量。 |
| `cite <id或片段>` | 查机制的标题、参考文件、来源数量；迁移前定位原文。 |
| `show <精确id> [--part mechanism\|reference] [--cursor token]` | 无损分页读取完整机制对象或其登记的参考文件；未知ID、无效/过期游标及不可读引用退出1。字段、分页契约与限制见第5节。 |
| `init [仓库]` | 在目标仓库创建 `.governance/`（幂等，不覆盖已有文件）。 |
| `status [仓库]` | 报告需求、验收、负责人、检查项与下一步的缺口；有缺口退出 2。 |
| `check [仓库] [--policy 路径]` | 按策略中的 `checks` 顺序执行已配置命令，逐项报告退出码；任一失败退出 1；策略缺失、无效或检查为空退出 2。默认读取 `.governance/policy.json`；已有 owner 时用 `--policy` 指定检查清单，不创建状态文件。两种路径均解析仓库根与策略的真实路径，拒绝通过 symlink/junction 指向仓库外的策略。 |

## 2. 五条硬规则

1. **结论必须有观察到的证据。** “应该能过”“上次通过”“测试数量够”都不算。写结论时附命令、退出码和输出位置；没运行就写“未验证”。
2. **区分三种陈述。** 【源义务】源仓可定位的强制规则/门禁/冻结约定；【源事实】源仓现状、阈值、历史例子；【迁移设计】本 Skill 为落地补充、源仓无等价物。不得把迁移设计说成源仓保证。
3. **一个事实只有一个家。** 需求在 `.governance/requirements.md`，当前状态在 `.governance/state.json`。但先看目标是否已有状态 owner：既有任务板、Issue 台账、Agent Note 树或交接文件已经承担这件事时，以它为唯一权威，把本文要求迁入该 owner，不新建第二套。长期决策默认在 `.governance/decisions/`；若采用 Agent Note 生命周期树，把同一决策及链接迁到其 owner，不维护两份同权威记录。参考文件只解释机制，不复制状态。
4. **不静默降级。** 源仓的自动/CI 强制不能改写成“建议”后宣称等效。确需降低保证时，先写决策记录、列明影响，并由用户明确决定。
5. **远端与不可逆操作先授权。** 分支保护、审批、发布、历史改写只在获授权的隔离仓库/测试环境实测；不碰生产保护、真实凭据或不可逆数据。工作流文件存在不等于远端已验证。

## 3. 改动型任务走同一循环

**3.0 何时启用状态协议。** 本循环的 `.governance` 状态文件是**迁移设计**（源仓没有等价通用协议，见 `agent-workflows-continuation-extension`：`sourceBacked: false`）。状态协议的任务是让进度跨上下文边界存活，**不是**把每次改动变成账本。只在以下情况启用：

- 用户要求初始化治理元数据（此时 `init` 本身就是交付）；
- 用户明确要求跨会话继续、暂停、交接，或压缩前保存进度；
- 同一目标确需多个会话或另一位执行者接续。

**只因为任务会改动仓库、或有多条验收条件，不在本轮新建 `.governance`。** 单会话内完成的多步改动把可观察验收写进当前交付和验证结果，不额外制造状态记录。

纯问答、单点查询、只读诊断、一次性代码解释同样**不建立** `.governance`：不要为回答一个问题制造状态文件或运行 `init`。这些任务仍受第 2 节硬规则约束，并以实际命令输出交付。

目标已有唯一状态 owner（任务板、Issue/PR 台账、Note 生命周期树、既有 handoff 文件或 `PROJECT.md`）时，**在既有 owner 上记录**，不新建 `.governance`；只有一个状态记录是权威，另一处只能是指向它的引用。现有记录的“已完成”“nextAction”或归档项都是待核对事实：用户已经撤销或改变的动作按当前请求失效，以仓库/用户当前事实修正记录，不因它写在状态文件里就继续执行。

**3.1 接续。** 已存在 `.governance/` 或目标自定义状态 owner 时，先读它，再运行 `governance status`（仅对 `.governance` 布局有效）；把用户本次的真实目标与验收写进 requirements——不要从聊天记录或检查清单猜进度。需要按 3.0 启用但尚不存在时，用 `init` 创建后再写；不满足 3.0 时只读现有记录，不新建。

`status` 只检查元数据是否齐备：它**不执行** `policy.checks`，也不判断 `nextAction` 是否已被撤销、归档项是否仍是现役。元数据齐全不是执行许可，`phase: complete` 也不证明交付已完成；权限、当前权威与完成状态必须各自核对。接续先核对 git/文件与用户当前请求；记录与仓库事实冲突时以仓库为准，不执行已撤销动作。

**3.2 分类。** 用第4节路由表确定变更类型、受影响域和触发机制。跨域变更列出全部受影响域，不只读最显眼的一份参考。

**3.2a 首次或渐进接入。** 用户要求采用治理机制、把检查接入本地/CI时，先形成采用决定，经项目负责人或独立评审确认后实施。普通功能任务复用既有入口，不重复采用；仅初始化元数据按3.0交付。本段是**迁移设计**，不是源仓的通用自动接入器；当前请求和已接受决定共同约束实施，元数据不是许可。

**维护者决定，消费者适配。** 本 Skill 的维护者负责核对来源、独立义务及条件/例外，区分源义务、源事实和迁移设计，并明确参数化、工具保证与语义评审责任。消费者使用这些已发布决定核实目标条件、选择等价实现和运行验证；普通采用不要求按语义单元新建F/S/D会话、拷贝全部源文或重新完成来源提取。目标适配仍须保留每项已触发义务，现成工具清单不能代替适用性判断。

1. **核实目标。** 保留当前请求和既有验收；读取目标规则、唯一事实/状态owner、工具链、脚本和CI。把当前内容、采用会新增的文档/决定、配置和执行证据，以及后续必需变更面分别绑定到目标文件或请求；拟议路径不是已有事实。对照第4节路由与第7节条件分派检查这些变更面，未知事实单列。记录实际命令、实际返回的退出码和原输出位置；复合命令只有总退出码时不另造子命令退出码。核对固定依赖的准备方式及检查内部的安装、scratch、缓存和远端效果是否在权限内。
2. **读取迁移决定，适配项目参数。** 按第5节读取命中机制的完整记录及对应参考小节、依赖和例外。事实归属、状态复用、文档预算/语料和本地/CI接线从[现有迁移契约](references/documentation.md#migration)进入；这是采用入口，不是所有项目的封闭义务清单。双语、API/示例、生成页、Note/归档、发布等分支按实际事实继续读取。保留已确认义务，填写目标的owner、路径、语料、阈值、工具链、现有命令和权限；来源案例值不是默认参数，已有合规内容仍可能触发持续检查。
3. **形成同一owner中的采用决定。** 对每项触发义务记录“目标事实/位置 → 机制ID及已发布决定位置/依赖 → 保留的义务与目标参数 → 检查或语义评审owner及实际/待建入口 → 前提与权限 → 拒绝及精确恢复 → 状态”。状态用**待接入**、**已接入且待复验**、**触发但阻塞**或**不适用**；缺工具、依赖或权限不是无触发面，不适用须有目标事实和重新激活条件。按3.0沿用现有owner；单会话任务可在当前交付中保存决定，不仅为采用另建状态账。

**来源或迁移决定有疑点时。** 若记录与正文冲突、分类/独立条件不清，或没有不削弱义务的实施办法，保留具体机制、原句/字段、目标影响和未决，交本 Skill 维护者定向核对来源并修正原owner。影响验收的未决项保持阻塞，不由消费者临时猜测后宣称等价；这不是要求每个消费者重做全库研究。源义务/源事实的追溯使用既有固定提交区间，迁移设计不伪造上游来源。

**接受条件。** 项目负责人或独立评审先从目标实际变更面、路由和所读参考的条件反查遗漏，再检查每项决定的事实、义务/例外、依赖、执行与评审责任、权限及原报告。直接阅读记录和正文，不以决定摘要、引文字面匹配、计数或`verify`通过替代语义核对。每项必需义务均须有处置；影响验收的未决、冲突或驳回使整体决定不能接受。接受记录绑定接受者及权限、时间、决定版本和原始证据；保留原报告与失败，事后修正不追认通过。


**实施（决定已被接受，原有行为验收不变）。**

1. **重读与配置。** 核对当前请求与已接受决定；读本次变更触发的参考小节，事实变化时更新同一决定。保持既有脚本/状态归属；仓内最小独立清单可用 `{"checks":{"项目检查名":"目标已有命令"}}`，执行 `governance check <repo> --policy <仓内路径>`。新初始化用默认 policy。清单只存执行配置，不复制需求/进度；按已接受前提准备固定依赖与受检语料，不照搬来源阈值。
2. **同入口接线。** 开发者与 CI 调用同一顶层检查；保留原安装、矩阵及其他义务。把项目自己的检查写进清单，顶层 `governance check` 入口不写回自身；非零退出必须传播。缺远端目标/权限时准确保留该层阻塞，不将工作流文件当远端强制。只有已获对应授权的隔离目标才能实测平台设置。
3. **真实变更与回归。** 完成应用/文档任务；每条已接受的可机械不变量都在同入口保留正常和无效断言，临时探针不能替代后续 CI 所需的回归检查。语义义务另由已指定评审者核对，计数通过不抵销内容或适用性错误。
4. **拒绝与恢复收据。** 从同入口观察正常、真实义务破坏后的拒绝、精确恢复后的通过。原始 stdout/stderr、实际退出码、注入/恢复命令与文件哈希存入目标已有证据位置；没有位置时放在唯一 owner 所属的证据目录，owner 只链接原输出与结论。使用已批准的 scratch/缓存范围，日志不写秘密；保留可复核收据后清理一次性探针，不能把唯一证明日志也删掉。按 3.6 交付，不靠回忆改写数值。
5. **冷接续与采用验收。** 新会话从 Skill、唯一 owner、已接受决定、原收据和当前请求继续真实变更；重新评估其触发义务，保留旧行为与原失败。采用完成须同时满足行为、义务落实、正常/拒绝/恢复、实际接入层级及准确原交接；缺任一必需条件仍未通过，不以事后修报告追认。

**3.3 计划。** 把验收写成可观察条件；启用状态协议时写入 `state.acceptance`，否则在本次交付中列出同一组条件。每条可机械检查的不变量接入目标已有或新增、实际执行的顶层入口；每条变更验收路径安排正常与无效用例，例外窄且有理由，不全局禁用规则。按[持久规则准入](references/decisions.md#durable-rule-admission)核对入口、执行者和拒绝证据；不能机械校验的语义判断单列评审程序。启用时更新 `state.nextAction`。

**3.4 实施。** 复用目标仓库已有模式；新增约定前先确认没有第二套并存。改动公共符号前查全部调用点。

**3.5 验证。** 运行目标项目已有的真实检查入口；采用 `.governance/policy.json` 时可用 `governance check <repo>`，已有状态 owner 且使用独立检查清单时用 `governance check <repo> --policy <路径>`。检查清单只登记命令，不另存需求或进度；命令以本机权限执行，和项目脚本一样需要信任。失败就停下修，不以缩小范围或跳过检查收场。只报告实际执行过的验证。`check` 不推导检查、不证明语义完整或平台强制。

**3.6 记录与交接。** 更新唯一 owner 的阶段、已完成、未确定与一个可执行下一动作；仅按 3.0 已启用时写 `state`，长期理由沿用决策 owner。观察用“实际命令、实际退出码、原输出位置”作收据，引用原日志的数值与诊断原句；不需要的计数和注入词数省略，不凭记忆增加描述。检查的安装/临时写入效果按真实路径报告，不把“未改目标依赖”概括成“没有任何安装”。源码事实与推断注明位置/范围，未执行项留未验证。交接引用证据位置，不复制另一份同权威报告；独立复核发现原报告不准确时保留原失败，事后更正不追认原验收通过。

## 4. 任务路由

| 触发 | 先读 |
|---|---|
| 新任务、接续、范围与证据、交接 | `agent-workflows`（§0、§6、§11、§26）、`collaboration`、`decisions` |
| 代码评审、PR、栈式评审与落地 | `agent-workflows`（§7–§10）、`engineering`、`testing` |
| 改动指令文件、子树规则、技能入口 | `subtree-instructions`、`agent-workflows`（§1–§4）、`packaged-skill-contracts` |
| 文档、双语配对、预算、生成区、升级指南 | `documentation`、`documentation-procedures`、`subsystem-contracts-1`、`subsystem-contracts-2`、`upgrade-guides`；采用决策 Note/冻结归档时另读 `agent-notes` |
| 写、修剪、恢复或审查散文/注释；用户要求编辑校准 | `agent-workflows`（§19.2–§19.3）、`documentation`；先确认显式scope与写权限，interactive仅在用户明确要求时启用 |
| 持久化格式、Session 兼容、发布归档 | `persistence-current-records`、`persistence-historical-finalized`、`persistence-release-history`、`release` |
| 本地钩子、门禁运行器、CI、缓存、取消 | `automation`、`enforcement-scripts-1`、`enforcement-scripts-2`、`enforcement-scripts-3`、`enforcement-scripts-4`、`policy-tests-1`、`policy-tests-2` |
| 包边界、依赖、vendor、发布面 | `package-contracts-1`…`package-contracts-8`、`supply-chain`、`packaged-skill-contracts` |
| 架构决策、规则演进、事故与归档理由 | `rationale`、`decisions`、`rationale-architecture-1`…`4`、`rationale-process-1`…`2`、`rationale-feature-1`…`4`、`rationale-bug-fix-1`…`2`、`rationale-simplification-1`…`2`、`rationale-testing-1` |
| UI、前端契约、无障碍与响应式 | `ui-surface-contracts`、`subsystem-contracts-2` |
| 用户文档、公开站点、第三方可见面 | `user-and-publication-contracts`、`website-contracts` |
| 基准、快照语料、性能预算 | `benchmark-contracts`、`snapshot-corpus-inventory`、`rationale-testing-1` |
| 代码简化、删除能力或移除校验的评估 | [`agent-workflows` §18](references/agent-workflows.md#aw-18)；先核实消费者、信任边界和保留义务 |
| 原生启动器、Python SDK、Desktop 打包 | `runtime-residual-authority`、`release` |
| 采用风险、安全声明、品牌与生态身份 | `adoption-policy` |
| 无法归类的源码文件该不该算治理 | `policy-source-residual`（判别附录） |

路由只给入口：查看命中域的触发索引、对应小节及交叉引用，不把整个域自动激活，也不从可用工具反推范围。`governance cite <mechanism-id>`只定位元数据，不算读取；按第5节读取完整机制与对应参考正文。固定提交坐标用于追溯来源；已有迁移决定没有争议时，消费者不必另取源仓才能采用。

## 5. 机制账怎么用

`knowledge/<domain>.json` 是机器可读的机制账，`references/<domain>.md` 是同一域的操作解释。每条机制至少包含：

| 字段 | 用途 |
|---|---|
| `problem` / `triggers` | 防哪种失败、什么条件下触发 |
| `obligations` / `actors` / `steps` | 要求什么、谁执行、顺序与责任边界 |
| `enforcement` | 失败如何传播、由谁阻断、可信边界与例外 |
| `applicability` | 目标项目何时激活；不激活时保留判据与重新评估触发条件 |
| `migration` | 原样保留、参数化还是替代；为什么没有削弱作用 |
| `verification` | 正向、应拒绝、恢复三种证据要求 |
| `limitations` | 源仓未证明或本迁移未覆盖的部分 |
| `sources` / `reference` | 固定提交的路径与行号、可读解释位置 |

用`node <安装座>/bin/governance.mjs show <精确机制ID>`读取完整机制，`--part reference`读取其登记的参考文件全文；有原生读取工具时，也可按已核对的小节范围读取正文及其交叉引用。`show`保留全部字段，包括`migration`及未来新增键；结合完整记录与对应正文使用已发布迁移决定，字段名不决定内容都是源义务。`sources`路径/行号/kind和域级`sourceCommit`是上游定位，不等于已返回上游正文；不依赖发布者私有路径。

保留实际读取的机制ID/字段及参考位置供决定和评审核对；相同资源可按摘要复用已完整读取的原件。工具返回有省略时读取明确遗漏部分；`show --part reference`只提供整文件分页，不替代参考内的条件与依赖选择。

每次`show`只输出一页JSON：`version`、`resource`（ID/part/file/domain/sourceCommit/全内容sha256/bytes）、`range.start/end`（UTF-8字节，尾端不含）、`chunks`、`next`、`complete`和`limits`。依次用同一ID/part加`--cursor <next>`继续，检查身份/摘要不变、区间连续，连接各页`chunks`后核对总字节和sha256；机制内容可解析为完整JSON对象，参考内容为原文件文本。整页含换行至多4096字节、每行至多512字节，长值分片而不省略。显式`complete: true`且`next: null`才是末页；缺页/重页/乱序、工具省略或截断均不算读取完成。无效/过期游标退出1，从同一当前来源第一页重新读取，不混合快照。游标不是签名或授权凭据。

完整供给与散列只证明读到哪些字节，不证明理解、适用性或无遗漏。消费者按3.2a把已发布义务落实到目标；评审从真实变更面和对应参考反查遗漏，来源疑点交维护者核对。选择等价工具不能取消已触发义务；源义务、源事实与迁移设计分别保留，不把具体来源阈值直接设为目标参数。

## 6. 适用性、降级与阻塞

- 目标项目缺少某机制的前提（平台、工具链、权限）时，把该机制标为**阻塞**并写明缺什么、已尝试什么、影响哪个验收条件、最小解阻动作；不得改写为“不适用”后算完成。
- 只有在目标项目确实不存在该机制的触发面时，才记录“不适用”，并写清判据与重新评估条件。
- 机制激活与否由项目事实决定，不由本 Skill 的默认清单决定；知识保留完整，执行按条件选择。
- 任何范围缩减或保证降低都需要用户在当前任务中明确决定，并留下决策记录。

## 7. 强制体系的核实顺序

1. **本地检查**：命令真的失败吗（正向/应拒绝/恢复三个独立场景）？
2. **CI**：同一个检查在流水线里是否真的阻断，而不是 `continue-on-error` 或被条件跳过？
3. **平台**：分支保护、审批、规则自修改、历史保护是否在服务端生效？需要隔离测试仓库与书面授权，并保留服务端拒绝的输出。
4. **人工步骤**：审批人是谁、凭什么权限、决定时间、绑定了哪个产物哈希？

检查失败不等于平台阻断；本地 hook 失败也不等于服务端拒绝。结论必须写清是哪一层观察到的。

**GitHub 加权审批、作者信用、委托或生产代码归属权重触发时**，先读 [可选审批执行模块](references/github-approval.md)。模块按目标项目的真实生产目录安装；部署到受信默认分支、绑定状态发布 App、配置原生评审与历史保护后，仍需分别观察服务端拒绝和恢复。默认安装 Skill 不部署工作流或修改远端权限。

**Agent Note 分类、状态格式或冻结归档触发时**，先读[可选 Note 执行模块](references/agent-notes.md)。原生 Node 门禁在目标 cwd 检查真实语料；归档以受信 Git 基线追加密封，不继承源仓的一次性解封授权。配对、链接和平台保护仍是独立能力，不得把本地检查当成全部文档或远端保证。

**修改 Markdown 段落、链接、标题或双语正文时**，按[文档模块的链接/换行执行与配对配置](references/documentation.md#markdown-gates)声明真实目标语料并运行适用命令。Note 配对只声明活跃生命周期根，冻结归档交给 Note 模块；链接检查仍验证活跃→归档的入站引用。段落门禁不证明标题写作或译文含义正确；解析器、语料或 CI/平台前提缺失时分别记录，不以核心 `verify` 代替。

**修改常驻规则、文档预算或预算清单时**，先读[预算执行与评审程序](references/documentation.md#prose-budgets)，在目标仓库声明受约束文档并运行普通预算检查。`--list` 是报告不是阻断；5% 余量、内容归属和升限理由仍需评审，不能从计数通过推断已经满足。

**修改 TypeScript 文档示例或其引用的公开 API 时**，按[代码等价与可编译示例](references/documentation.md#code-equivalence)配置真实目标语料、tsconfig 和目标自身的编译器，运行文档编译执行器并接入项目实际检查入口。编译不执行示例；类型等价/生成围栏仍须各自门禁，不能借标记逃过普通示例编译。

**改变CI运行器规格或比较预览构建成本时**，先读[容量测量合同](references/rationale-process-2.md#capacity-evidence-benchmarking)。CI owner保留固定输入、冷/热精确缓存和逐作业费用表，reviewer拒绝合计取整、漏失败/开销或build-only发布声明；普通PR缓存fallback不受实验规则替换，真实发布仍须已有preview workflow确认。

**新增或改写包README及Summary时**，按[完整包README合同](references/documentation.md#package-readme)配置真实包根与英文文件名，从安装座运行Summary词数门禁，覆盖包根、组和包三级README。100词是硬上限，缺节/空扫描拒绝；不要把这个零依赖单门禁当完整Metadata、Model Experience或限制节检查，也不要由计数通过推断语义无损。

**声明包能力边界、延迟工作或“已完整/生产可用”时**，同一变更补齐唯一 `## Known Limitations and Deferred Work` 与读者可见顶层条目，运行限制节门禁；确实无延迟工作须逐包审计豁免，指向不存在包或空理由会失败。代码围栏/HTML注释里的条目不算，中文侧与限制真实性仍由评审承担。

**维护历史引用、组织链接或禁用术语时**，按[仓库引用政策执行入口](references/documentation.md#reference-policy)声明语料、实际 Git 对象库和目标规则，运行普通引用门禁；诊断 `--list` 不阻断，关闭的规则和浅历史漏报不得计为已保证。来源脚本按规则排除不同范围：用 `ruleExclusions` 只豁免指名规则、用 `generatedRegions` 豁免标记内的生成内容，不要用整语料 `excludePrefixes` 一并放弃提交号与链接检查。

**撰写、审计或精简散文、JSDoc、注释，或清理会话/评审残留时**，先读[完整命题与泄漏审计程序](references/agent-workflows.md#aw-19)。明确 scope 与写权限，先列命题和 owner，再校准召回探针并语义判断；审计只报告，修复保留义务、假设、必要解释和测量来源。搜索命中不是自动拒绝。

**双语变更时**，常规路径同一 pass 做最小 counterpart 更新并 scoped 重录/检查，不自动生成 briefing 或委派。只有用户明确点名目标已配置的扩展入口，才按[扩展翻译分支](references/agent-workflows.md#aw-15)执行；入口、宿主禁隐式调用策略或执行工具缺失时记录实现缺口，不自动进入该分支。


## 8. 完整参考索引

| 文件 | 覆盖 |
|---|---|
| `adoption-policy.md` | 采用风险、安全声明、品牌与生态身份 |
| `agent-workflows.md` | 指令层级、技能路由、任务开工、评审、推送、栈、交接、专项工作流 |
| `agent-notes.md` | 可选 Note 执行模块：当前触发政策、生命周期/格式检查、可信基线与冻结归档 |
| `automation.md` | 本地钩子、门禁运行器、CI 工作流、runner/缓存/并发/取消/裁决 |
| `benchmark-contracts.md` | benchmark 执行契约与证据边界 |
| `collaboration.md` | 协作、作者/评审者/机器人边界 |
| `decisions.md` | 决策记录、持久规则、冻结与归档 |
| `documentation.md` | 文档分层、归属、预算、双语与生成参考 |
| `documentation-procedures.md` | 页面义务、能力/格式变更、复盘与评审响应 |
| `enforcement-scripts-1.md` … `-4.md` | `scripts/` 全量分区：构建、生成、校验、发布、打包、快照 |
| `engineering.md` | 代码与架构约束、错误与生命周期、类型安全、边界校验 |
| `github-approval.md` | 可选加权审批执行模块：安装、目标生产根目录、信任边界、平台接入与升级 |
| `package-contracts-1.md` … `-8.md` | 包 README 契约、seam、组合边界、版本与发布语义 |
| `packaged-skill-contracts.md` | 打包技能的文件、策略与门禁 |
| `persistence-current-records.md` | 当前持久化变更记录 |
| `persistence-historical-finalized.md` | 历史 Session 格式与 finalized 检查点 |
| `persistence-release-history.md` | 预发布持久化历史归档 |
| `policy-source-residual.md` | 无新机制的残差文件判别与既有机制落点 |
| `policy-tests-1.md` / `policy-tests-2.md` | 测试分区、Session 语料、发布门禁 |
| `rationale*.md`（17 份） | 架构、过程、功能、缺陷修复、简化、测试决策的可迁移理由 |
| `release.md` | npm、原生、Python、Desktop、GitHub 发布链 |
| `runtime-residual-authority.md` | 原生启动器、Python 发布、Desktop 打包 |
| `snapshot-corpus-inventory.md` | 快照语料清点与使用边界 |
| `subsystem-contracts-1.md` / `-2.md` | 子系统参考页、生成区、页面归属 |
| `subtree-instructions.md` | 子树 `AGENTS.md` 的层级与归属 |
| `supply-chain.md` | 依赖、vendor、补丁、许可证、凭据与供应链 |
| `testing.md` | 单元/集成/真实入口/E2E/快照/覆盖率/平台矩阵 |
| `ui-surface-contracts.md` | UI 表面、主题、响应式、遮罩与可读性 |
| `upgrade-guides.md` | 升级指南触发、同改动写入、结构与字数 |
| `user-and-publication-contracts.md` | 用户文档、教程、公开页面 |
| `website-contracts.md` | 站点实现、样式、期望输出 |

## 9. 证据边界

- 本 Skill 的知识来自固定提交的只读检查；行号以该提交为准，源仓后续提交会漂移。引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e`。
- 机制账或参考中保留的 `verification/evidence/`、`_working/` 与提取 builder 路径属于发布者内部历史记录，不随公开包分发。不得把这些路径当成安装后可执行的入口或当前目标的已验证证据；公开版本的可复跑命令与本次观察见 `PUBLIC-VERIFICATION.md`。
- 源仓的产品行为、平台配置和远端效果，只有实际运行或服务端记录才算证据；参考文件里的“源事实”不等于目标项目已具备。
- 每个目标的验证命令与输出应可由他人复跑；不可复跑的证据（人工审批、远端控制台）要记录操作者、时间、对象和原始输出位置。
- 未观察到的结果写“未验证”，不写“已通过”。
