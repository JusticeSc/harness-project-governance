# 架构类治理迁移参考（rationale-architecture-4）

本文件从 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的架构 Note 中提取可迁移的项目治理机制。它面向需要把同类约束落到另一个代码库的维护者，不依赖原仓库源码。每节先给触发条件，再给义务、前置条件、操作步骤、责任角色/完成信号、失败处理/例外和证据边界；引用使用 `deepseek-harness/<path>:<start>-<end>@687f282e`。

**证据分级。** 本文把“源 Note 记录的行为/决定”与“迁移建议”分开写。提取阶段只读了 Note，没有运行构建、测试、lint、格式化或远程操作；因此每一节的完成信号都是**待执行验证的设计**，不是已验证事实。`implemented/` Note 描述作者记录的已实现状态，`archived/` 是历史设计，`proposed/` 是提案；提案不能当作已上线保证。译文只用于核对英文正文，引用仍指向英文原文。覆盖范围内所有超过单行显示上限的源行（41 行，17 个正文）都已用精确行号 `raw` 重新读取；coverage 记录逐条注明正文补读与长行重读，不再保留未恢复的截断细节。

**使用顺序。** 先按症状查“触发索引”，再读对应节。跨节依赖很常见：事件、会话语义和持久化通常要一起改；权限、执行范围、取消和清理通常要一起验收。不要只复制某一条规则而跳过其所有者、生命周期或证据义务。

## 触发索引

| 症状/任务 | 先读 |
|---|---|
| 新增事件、合并重复动词、判断哪些事件可重放 | 1、2 |
| 多个模块重复实现同一能力、接口/实现/消费者边界不清 | 3 |
| 包之间互相引用、客户端导入宿主、配置树膨胀 | 4、5、7 |
| 一条链路承载多种消息、调试协议侵入业务协议 | 6 |
| 密钥泄漏、环境变量与凭据混用、默认值漂移 | 8、11 |
| 用户权限与模型权限混淆、原生对象/终端授权 | 9、10 |
| 超时、取消、失败表示不统一 | 12、13、25 |
| UI 节点重复、重放不一致、隐藏后丢状态 | 14、15 |
| 技能/面板默认占空间、技能文件被截断 | 16 |
| 性能优化无法判断收益、预算互相替代 | 17 |
| 发布身份漂移、签名/校验/上传顺序错误、预发布改名 | 18 |
| 存储对象被外部修改、校验与存储不一致 | 19 |
| 多 Session 串 cwd、隐式上下文、组合身份不一致 | 20 |
| 多个启动器、最小配置仍挂载全部服务 | 21 |
| 私有 registry 回退到公共源、安装失败归因错误 | 22 |
| 插件热更新半更新、缓存跨代复用 | 23 |
| 大重构旧新 API 并存、兼容层永久化 | 24 |
| 关闭时消费者仍在使用已释放资源 | 26 |
| 单槽位用数字优先级混合语义 | 27 |
| 翻译/增强请求污染模型历史或静默换供应商 | 28 |
| Worker/替代运行时伪造平台语义 | 29 |
| ID 跨包混淆、品牌类型滥用 | 30 |
| 长任务各自实现生命周期 | 31 |
| 工具输出截断策略重复、无界保留 | 32 |
| 本地化标签重复注册、硬编码文案 | 33 |
| 策略可被绕过、审计事件与副作用不一致 | 34 |
| 昂贵派生能力默认开启、卸载 provider 破坏精确读取 | 35 |

## 机制索引

- `rationale-architecture-4-event-taxonomy-ownership` — Event taxonomy and vocabulary ownership
- `rationale-architecture-4-event-log-integrity` — Event-log integrity and format governance
- `rationale-architecture-4-capability-seam-ownership` — Capability seam ownership and evidence-gated abstraction
- `rationale-architecture-4-package-layering` — Package layering and dependency direction
- `rationale-architecture-4-contract-single-source` — Single-source contracts and stable public faces
- `rationale-architecture-4-protocol-channel-independence` — Channel-independent protocol ownership
- `rationale-architecture-4-config-authority` — Configuration authority, provenance, and atomicity
- `rationale-architecture-4-credential-management` — Credential precedence and store separation
- `rationale-architecture-4-privilege-boundaries` — Privilege separation and dispatch-time consent
- `rationale-architecture-4-execution-containment` — 受管执行范围：进程树只是观察，不是保证
- `rationale-architecture-4-transport-trust` — Transport and storage trust derived from receiver state
- `rationale-architecture-4-deadline-policy` — Deadline primitive and per-tool timeout policy
- `rationale-architecture-4-failure-normalization` — Failure normalization and mandatory-state seams
- `rationale-architecture-4-presentation-assembly` — Target-neutral presentation assembly and replacement points
- `rationale-architecture-4-live-retention` — Live retention distinct from recovery
- `rationale-architecture-4-progressive-disclosure` — Progressive disclosure and zero-footprint extension
- `rationale-architecture-4-performance-governance` — Decision-grade performance governance
- `rationale-architecture-4-release-governance` — Release identity, validation placement, and ordered publication
- `rationale-architecture-4-storage-boundary` — 存储事实的始终开启不可变所有权
- `rationale-architecture-4-session-context` — Session context ownership and explicit defaults
- `rationale-architecture-4-single-launcher` — Single launcher and explicit profile mounting
- `rationale-architecture-4-registry-safety` — Registry resolution and dependency-confusion safety
- `rationale-architecture-4-generation-swap` — Immutable generations and cache publication boundaries
- `rationale-architecture-4-staged-migration-contract` — Staged migration without permanent compatibility debt
- `rationale-architecture-4-cancellation-propagation` — Required cancellation signals across async capability seams
- `rationale-architecture-4-cleanup-dependency-lifetimes` — Consumer-first disposal for dependent resources
- `rationale-architecture-4-semantic-phases` — Semantic phases before priority for single-slot election
- `rationale-architecture-4-enrichment-isolation` — Display-only enrichment isolated from model history and providers
- `rationale-architecture-4-fidelity-shims` — Platform shims must not fabricate behavior or invariants
- `rationale-architecture-4-branded-ids` — Branded IDs at package boundaries
- `rationale-architecture-4-generic-task-runtime` — One generic runtime for long-running tool work
- `rationale-architecture-4-output-retention-library` — Retention as a pure, small library
- `rationale-architecture-4-localization-rollout` — Localization as a typed seat with lazy labels
- `rationale-architecture-4-policy-event-gate` — Optional filesystem policy plugin as an intent gate and recorder
- `rationale-architecture-4-capability-opt-in` — Expensive capabilities off by default

<a id="rationale-architecture-4-event-taxonomy-ownership"></a>
## 1. 事件分类与词汇所有权

**触发**：新增事件族、合并近似动词、消费者需要区分“可重放事实”和“仅运行时信号”。

**问题与规则**：把不同职责的事件混在一个总线里，会让消费者无法判断哪些事件可持久化、哪些可拦截、哪些只是通知；每加一个生产者就修改中央 switch，最终形成循环依赖。源 Note 的决定是：(a) 持久会话事实用纯 JSON、可重放；运行时事件可携带运行时身份并允许拦截；通知是 fire-and-forget。(b) 事件词汇放在契约包，采用小型纯 Cordis 分类：`waterfall`、`serial`、`parallel`、`emit`，每种只有一个所有者。(c) 只允许一个具体 loop 插件，其他模块不得重新派发 loop 事件。(d) 持久事件 map 可合并扩展：生产者包拥有事件类型、payload 声明合并和不变量伴随物，类型消费者显式声明包依赖/project reference，但不必挂载生产者的模型工具。(e) 近似动词收敛为一个原语加预设别名，例如 `send(message, target, wakeup)` 覆盖 2×2 策略矩阵；`inject` 是不唤醒的 next-step 投递，经持久 inbox splice，只有被 pre-step batch 接收才成为 user/message。(f) 需要跨重启/分叉存活的目标变更放到持久侧，inbox 投递另算。

**前置条件**：已能区分 durable event 与 live event；有契约包和单一 loop 所有者；消费方按事件职责而不是按发送方模块订阅。

**操作步骤**：1) 按职责与生命周期给事件分类。2) 把词汇和 payload 声明放到拥有者包，写不变量伴随测试。3) 删除重复事件类型和镜像状态，消费者改用 `source.kind` 等显式判别。4) 为合并后的原语列出策略矩阵，确认原先不可表达的格也可以显式表达。5) 检查是否有第二个 loop 派发点、中央 switch 或包间值依赖；有则删除。

**角色/完成信号**：契约包所有者定义词汇；生产者包维护 payload/不变量；loop 所有者保持唯一。完成信号是新增事件无需修改核心 switch，且重放/实时两条路径对同一事实给出同一语义。

**失败处理/例外**：历史 Note 明确拒绝“核心 switch 逐个 case 扩展”和“让核心依赖具体工具包”。已有旧事件若已进入持久日志，不能直接改名；需要格式版本和迁移边（见第 2、18 节）。通知类事件不承诺重放。

**尾部补充**：`wakeup` 是唯一的“模型是否应运行”信号；孤立的 `next-turn`/无 wakeup 项保持停放，随下一次唤醒发送一并处理。每次插入和退出发布匹配的 live 通知，领域持久事实走 typed message source，而不是并行元数据通道。

**证据边界**：源 Note 为 archived 设计记录，含对工具/消息动词的已实现观察，但本提取未运行事件派发或重放测试；Cordis 的具体 API 名称属于原产品。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-06-11-microkernel-event-taxonomy.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-20-todo-event-ownership.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-22-unified-send-and-coalesced-user-messages.md:1-54@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-11-microkernel-event-taxonomy.md:1-32@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-20-todo-event-ownership.md:1-32@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-22-unified-send-and-coalesced-user-messages.md:1-54@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-30-event-domain-semantics.md:1-39@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-31-goal-owned-durable-events.md:1-33@687f282e

<a id="rationale-architecture-4-event-log-integrity"></a>
## 2. 事件日志完整性与持久发布

**触发**：实现/修改会话持久化、JSONL 发布、恢复、日志版本或写入批处理。

**问题与规则**：持久化若另造一套“持久消息”类型，就会与运行时事件语义分叉。源 Note 把持久化做成 `SessionEvent` 之上的能力缝：只追加、崩溃的 turn 被关闭而不是截断、reader 负责平衡并合成 interrupted closer。撕裂的尾部追加片段被丢弃，完整恢复的记录重写；已提交前缀出现解析错误或 seq 缺口时，整个 session 不可加载，不能“跳过坏行继续”。元数据放在日志外（如 `SessionHeader`），不混入事件流。Windows 发布采用 fork 发布协议：POSIX 为临时文件 + `fsync` + `link` + 目录 `fsync` + 删除临时文件；Windows 用 staging 目录 + `MoveFileExW(MOVEFILE_WRITE_THROUGH)`，不使用 `REPLACE_EXISTING`/`COPY_ALLOWED`，并明确拒绝硬链接、`ReplaceFileW`、TxF。对外契约是：第一次 append 要么在最终名字发布完整日志，要么失败且不覆盖旧日志。后续 Note 增加大日志恢复流水线、有界写入批处理、sidecar、日志版本机制、原生 v4 读取校验和 v3 规范信封；这些是在同一完整性义务上的演进，不是替代。

**前置条件**：明确日志是唯一持久事实源；有会话头/元数据旁路；有崩溃恢复与版本字段；知道目标文件系统的发布语义。

**操作步骤**：1) 定义 reader 的“完整/可恢复/不可加载”三态和恢复点。2) 把每次 turn 的关闭写成可合成的 closer，不允许截断已提交前缀。3) 实现平台特定的原子发布；失败时保留旧文件。4) 给日志加结构版本，旧版本走相邻迁移边，不原地改语义。5) 为大批量写入加有界批处理和背压，避免把延迟挪到读/分叉。6) 用撕裂尾、seq 缺口、坏版本、崩溃在发布中途等场景做拒绝测试。

**角色/完成信号**：存储所有者负责发布协议与 reader；会话所有者负责关闭语义；迁移所有者负责版本边。完成信号是：崩溃后重启只看到“完整已提交前缀 + 被合成的中断关闭”，坏前缀使 session 明确不可加载而不是静默丢数据。

**失败处理/例外**：尾部不完整允许丢弃；已提交前缀损坏不允许跳过。历史日志改名需要结构版本 + 迁移边（第 18 节的预发布改名规则不能直接用于 durable 词汇）。不同平台的发布实现可以不同，但对外契约必须相同。

**证据边界**：源 Note 覆盖 POSIX/Windows 设计、恢复流水线、批处理、sidecar 和版本机制；其中 Windows API 选择与断电/崩溃行为未在本提取中执行验证。大日志性能数字属历史测量，不是当前保证。

**尾部补充**：日志即状态是结构保证，不是附加功能；派生成本随日志长度增长，用压缩而不是改写日志来缓解，已发布的持久事件形状冻结。原生 V4 读取用每读一个有界状态机在发布前拒绝矛盾；未知记录保持不可变归属，破坏性表示变更要求后继版本，兼容新增要求新的 acknowledgement，修复不得改变已声明含义。未知但标记可忽略的记录仍保留 payload 与原始位置，已知记录即使被标记 ignorable 仍要校验；JSON 参数比较只检查 own properties，继承的原型成员不能冒充记录字段。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-06-14-session-persistence.md:1-37@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-05-windows-jsonl-durable-publish.md:1-36@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-06-11-event-sourced-sessions.md:1-28@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-native-v4-read-validation.md:1-31@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-14-session-persistence.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-05-windows-jsonl-durable-publish.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-15-replay-token-meter-service.md:1-61@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-05-large-session-jsonl-restore-pipeline.md:1-53@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-08-bounded-session-persistence-write-batching.md:1-60@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-10-message-feedback-sidecar.md:1-44@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-11-event-sourced-sessions.md:1-28@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:1-42@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-06-v3-canonical-session-envelopes.md:1-47@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-native-v4-read-validation.md:1-31@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-context-breakdown-system-prompt-state.md:1-36@687f282e

<a id="rationale-architecture-4-capability-seam-ownership"></a>
## 3. 能力缝：定义、实现、消费者与所有者

**触发**：多个包重复实现同一能力；需要替换后端；引入 mock；消费者开始直接依赖具体实现。

**问题与规则**：能力缝不是“先拆接口再随便加 provider”。源 Note 的共同结构是：Service Definition 拥有公开类型和 ctx key；一个 Provider 注册一个后端；Consumer 只依赖定义；每个能力只有一行所有权，写清谁拥有状态、谁负责默认、谁可以替换。持久化、jobs、session query、web 文件能力、反馈遥测都按此收敛。关键判断：只有出现**第二个真实消费者**才拆接口；否则一个具体实现就够（replay token meter 明确拒绝在第二个实现出现前做 interface+backend）。不要引入 provider registry；mock 只作为测试替身，不能成为生产选择器。jobs 的合并把 task id、授权、读取、取消、等待、监听和清理收进一个 runtime，生产者只提供执行钩子；`cancel`/`shutdown` 语义分开，清理幂等。能力缝的 owner 还要负责默认值、配置和释放顺序，而不是把生命周期留给每个消费者。

**前置条件**：能列出真实消费者和后端；有明确的 ctx key/公开类型归属；知道哪些状态必须跨调用保存。

**操作步骤**：1) 画出现有重复实现和调用方。2) 指定定义包、唯一 provider、消费者集合和所有权行。3) 把默认值/配置/释放放到 owner；消费者只传显式参数。4) 第二个真实消费者出现前不拆接口；出现后再拆，并保留一个后端直到有第二个实现。5) 用 mock 只测隔离行为；禁止生产分支按“是否有 provider”选择实现。6) 删除旧入口和重复的注册表。

**角色/完成信号**：定义包所有者、provider 所有者、消费者所有者三方签字。完成信号是消费者代码只 import 定义；替换 provider 不需要改消费者；只有一个生产后端被挂载。

**失败处理/例外**：只有一个消费者/一个后端时，允许具体类；这是有意的“暂不抽象”，但必须在所有权行里写明触发拆分的条件（第二个真实消费者）。测试替身可以绕过 provider，但不得进入正式组合。历史 Note 中的 jobs runtime 后来又被 jobs seam consolidation 调整；迁移时以当前所有权行为准，不把中间 API 当永久契约。

**证据边界**：源 Note 含已实现与历史演进，未在本提取中运行依赖注入、替换或 mock 测试；具体 ctx key、服务名和包名属于原产品。

**尾部补充**：共享库由多个真实消费者正当化；如果运行时关系不变量会是空洞的（例如只读私有文件），就在空的 invariant companion 中说明，而不是造一个检查。若一条 Note 只取代某一个所有权决定，较早 Note 仍对其余语义有权威，并应写明边界。后台作业的注册事件必须先于 producer 启动；已结算的输出环保留模型游标尚未消费的字节直到第一次终态读取；每次 wait 只有一个 claim，abort 同步清除，使超时的 wait 不会丢掉另一个 wait 的结算通知。结算结果只在首次读取交付一次；消耗式读取器、observed offset reader 等特殊 producer 适配同一字节环，不新增第二套表示。Service Provider 从同一批记录派生 `running` + `stopping` 准入容量（含一个 unowned bucket），不得增加公开计数或第二个状态所有者。适配器把各 provider 的响应字段映射到 seam 的可选词汇；provider 未提供的字段就省略，不得伪造或泄漏 vendor 形状。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-06-14-session-persistence.md:1-37@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-20-generic-long-running-tool-runtime.md:1-139@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-26-file-context-as-event-gate.md:1-174@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-07-shared-feedback-telemetry-user-id.md:1-33@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-03-jobs-seam-consolidation.md:1-39@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-14-session-persistence.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-20-generic-long-running-tool-runtime.md:1-139@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-26-file-context-as-event-gate.md:1-174@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-15-replay-token-meter-service.md:1-61@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-22-unified-send-and-coalesced-user-messages.md:1-54@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-23-unified-session-query-service.md:1-40@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-25-web-command-surfaces-and-assembly.md:1-63@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-26-job-registry-seam.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-07-shared-feedback-telemetry-user-id.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md:1-350@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-03-jobs-seam-consolidation.md:1-39@687f282e

<a id="rationale-architecture-4-package-layering"></a>
## 4. 包分层与单向依赖

**触发**：新增 host/client 包、客户端插件、web 入口；发现循环依赖或“客户端导入宿主运行时”。

**问题与规则**：分层必须能从 `package.json` 依赖审计，而不是靠口头约定。源 Note 的规则：host/client 分层单向；runtime→apiproxy 单向；client 永不导入 host runtime；webserver 不依赖任何 workspace 包，通过结构注入接收 handler；跨插件 client 值导入在 tsdown purity gate 处是构建错误。因为两侧都合并同一 Cordis Context key，需要两个聚合 TS program。插件注册表按 scope 分层：provider 行进入调用上下文的 scope layer，provider 名在层内唯一，避免“部署提供哪些技能”和“某个 agent 是否消费”混为一谈。配置树保持一层 flat tree、每插件一行、无代码内 tunable；共享行抽到 base，按 surface 覆盖。客户端 shell/动态包也遵守同一方向，不通过运行时单例绕过。

**前置条件**：包边界已按 host/client/runtime/adapter 划分；构建系统能读取依赖图；有类型聚合程序或等价检查。

**操作步骤**：1) 为每个包写“允许依赖谁、禁止依赖谁”。2) 把 webserver 等边界改为结构注入，不 import workspace 实现。3) 在构建门禁中拒绝跨插件 client 值导入和反向依赖。4) 技能/工具注册表按 scope 分层，provider 名层内唯一。5) 配置按 base + overlay 拆分，每行一个所有者。6) 用依赖图检查和最小构建验证，而不是只靠 review。

**角色/完成信号**：包所有者维护依赖声明；构建/发布所有者维护门禁；插件作者按层注册。完成信号是依赖图单向且可从 package 元数据复算；删掉一个上层包不会迫使下层导入它。

**失败处理/例外**：测试/构建工具可以依赖更多层，但不得进入发布产物。纯类型包可以跨层，但必须是 type-only 且不携带运行时值。动态客户端插件若只能导入类型，契约就不能要求 helper 或导出常量（见第 5 节）。

**证据边界**：源 Note 为 archived 设计记录，含 tsdown purity gate 和两个聚合程序的决定，但本提取未运行构建或依赖检查；包名/目录名是原产品。

**尾部补充**：生产入口必须显式 join Agent；只安装 registry 不会绑定它，未 join 的 Agent 会静默地没有 tools、prompt sections 或 skills。缺少 boot 注册必须在 Cordis 启动前失败，后续 import/apply/service-wait 失败通过 boot 状态可见。shell 消费构建后的 `lib/`，所以只 typecheck 源码不能证明浏览器运行同一份代码；需要 build/watch 漂移检查，并把静态 UI 库列为显式例外及其转换前置条件。客户端包 roster 由发布 profile 拥有，单个包不得用 peer placement 重新解同一张图。创建 entry 之前必须完成 immediately 层预取：`tree.import` 的物化是同步 require，不受 fiber inject 等待保护；跨包 require 边要求该层工厂全部注册完毕，否则会出现启动竞态。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-layering-and-rpc-protocol.md:1-256@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-24-web-config-tree-boot-and-transport-layering.md:1-45@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-09-layered-skill-registry.md:1-40@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-15-client-shells-and-dynamic-packages.md:1-90@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-host-plane-ownership-after-presets.md:1-43@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-layering-and-rpc-protocol.md:1-256@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-24-web-config-tree-boot-and-transport-layering.md:1-45@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-09-layered-skill-registry.md:1-40@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:1-40@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-host-plane-ownership-after-presets.md:1-43@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-15-client-shells-and-dynamic-packages.md:1-90@687f282e

<a id="rationale-architecture-4-contract-single-source"></a>
## 5. 契约单一事实源

**触发**：外部插件要依赖某个 manifest/协议/UI 类型；同一概念在多处声明；预发布公共面即将冻结。

**问题与规则**：公共面一旦有外部插件就难以改名，所以要在外部消费者出现前定稿。源 Note 的做法：一个 type-only 工具包拥有 manifest 声明，不携带运行时值；reader 保留解析、校验、默认值和 resolved data 的所有权；运行时 service/event 声明仍留在各自 owner。依赖种类跟随发布面：声明引用这些类型时用 production，不引用时用 development；每个消费者都有 project reference；外部作者直接 import 工具包，不经过兼容层。客户端动态插件只能导入类型，因此契约不能要求 helper 或导出常量；这反过来决定 UI 用字面量优先级带、自声明唯一 `id`，而不是 registry 生成的 key。公共 `kind` 等分类要说明“它回答什么问题”，不要把所有维度塞进一个枚举。资源地址与导航地址分成永不混用的两族：只有 `dsh-resource://<type>/…` 资源地址是公共契约；导航地址是 Sidebar 内部簿记，字面量集中在一处，不进入业务包。

**前置条件**：已识别哪些类型会跨包/跨插件；有 type-only 包和 project references；知道哪些声明属于运行时 owner。

**操作步骤**：1) 列出公共面及外部消费者。2) 把纯声明移入 type-only 包；运行时默认/解析留在 reader。3) 按实际发布面选择 dependency kind 和 project reference。4) 禁止兼容别名和“同时导出旧新名字”。5) 用编译失败测试验证：缺字段、错枚举、缺 project reference 都应报错。6) 在外部插件出现前完成命名/字段冻结。

**角色/完成信号**：契约包所有者、runtime owner、外部插件作者。完成信号是外部插件只依赖声明的类型即可编译；改一个公共字段会在所有消费者处产生编译错误，而不是运行时静默。

**失败处理/例外**：内部实现可以暂时共享具体类型，但一旦跨包就必须走契约包。预发布阶段允许一次性改名，但必须同步所有引用且不留别名（第 18 节）。已发布且已有外部消费者的字段不能靠“加可选字段”伪装兼容而不写迁移边。

**证据边界**：源 Note 含 archived 设计与公共面冻结决定；未在本提取中编译外部消费者或运行 API 兼容检查。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-layering-and-rpc-protocol.md:1-256@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-05-package-manifest-types.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-05-sidebar-tab-types-and-navigation.md:1-123@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-layering-and-rpc-protocol.md:1-256@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-05-package-manifest-types.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-05-sidebar-tab-types-and-navigation.md:1-123@687f282e

<a id="rationale-architecture-4-protocol-channel-independence"></a>
## 6. 协议通道独立与单一状态所有者

**触发**：在一条 RPC/stream 上叠加调试、控制或第二方向数据；每个生产者各自发明关联键。

**问题与规则**：把业务协议当万能载体，会让调试协议的状态、暂停/恢复和展示协议耦合；在暂停的 Host 线程上放 debugger transport 甚至无法送达 resume。源 Note 的规则：一个私有 Client/Host 插件拥有协议状态；跨 realm 的 CDP 由 Node Worker 作为唯一 endpoint 和唯一状态所有者，生产者只发送经过校验的 observation，不各自实现 CDP。Remote duplex stream 则让每个 Remote stream 接受 Client uplink，返回类型 `RemoteStream<Out, In = never>` 同时声明两个方向；交互功能不再各自造第二载体/关联键。子进程控制也把 control pipe 与 stdio 数据面分开，避免结构化控制消息污染普通输出。共同原则：一条通道一种语义；需要双向就显式类型化，不要靠旁路；协议状态只有一个 owner。

**前置条件**：能列出通道上的所有消息类别（数据、控制、调试、生命周期）；有版本化协议和校验；明确谁拥有状态机。

**操作步骤**：1) 把消息按语义分类，找出被塞进同一通道的异类。2) 为每类定义显式消息类型/方向；双向流用类型参数声明。3) 把状态机收敛到一个 owner；生产者只发 observation。4) 为控制面单独开 pipe/channel，不复用数据面。5) 给协议加版本和关闭/取消路径。6) 用暂停、重连、并发操作、未知消息做拒绝测试。

**角色/完成信号**：协议 owner 拥有状态和版本；生产者只发送校验后的消息；传输层不解释业务。完成信号是新增交互功能不需要新载体；暂停/恢复不会因线程模型丢消息；未知/越界消息被拒绝。

**失败处理/例外**：纯通知可以复用 emit，但不得承载需要确认的状态转换。调试/诊断数据可以走独立私有通道；不要把它暴露成公共 API。历史 Note 中的下行-only stream 是对旧限制的记录，新设计以显式 uplink 为准。

**证据边界**：源 Note 含已实现的双向流、CDP 隔离和子进程控制设计；本提取未运行 RPC、Worker 或暂停/恢复测试。

**尾部补充**：端点 disposal 必须先关闭 admission，停止 capture、关闭 socket 与自有上游会话，并等待 Worker 退出后才报告完成。兼容性 synthetic no-op 必须逐个命名并测试，不能对所有未知方法静默成功。loopback 绑定只是可达性控制，不是认证；完整 capture 会把凭据和 payload 暴露给能连上端点的本地进程。控制 pipe 在各平台使用同一固定描述符，原生 wrapper 负责保留并关闭；subprocess service 不解释也不缓冲控制消息，消费者要自行约束 I/O，且该传输不是 JavaScript 安全边界。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-layering-and-rpc-protocol.md:1-256@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-23-cross-realm-cdp-inspector.md:1-101@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-remote-duplex-stream.md:1-616@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-subprocess-control-pipe.md:1-37@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-layering-and-rpc-protocol.md:1-256@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-23-cross-realm-cdp-inspector.md:1-101@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-subprocess-control-pipe.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-remote-duplex-stream.md:1-616@687f282e

<a id="rationale-architecture-4-config-authority"></a>
## 7. 配置权威与默认值物化

**触发**：新增配置项、默认值、环境变量层；发现同一设置在多处声明；provider/model 切换后旧默认值残留。

**问题与规则**：配置必须只有一个声明处，默认值由最了解该路由的 owner 决定。源 Note 的组合规则：一个 flat config tree，每插件一行，无代码内 tunable；共享行抽到 base，按 surface overlay；boot glue 只保留必须在 Cordis 之前存在的东西；env 分层为 ambient > cwd `.env` > `$DSH_HOME/.env`；每个配置源恰好一个声明位置。`trustedHosts` 明确只是 DNS-rebinding fence，不是授权边界；wire 暴露是显式 allow-list，不由“安装了哪些插件”推断；未注册与未暴露的 namespace 返回相同结果，避免探测。adapter 拥有 per-route 默认：runtime 只在调用方省略时物化，并标记为 adapter default；这个标记在任何 dispatch 前成为持久请求头事实；下一次请求 waterfall 前移除标记字段，按当前精确 route 重新物化，因此 provider/model 切换不会携带上一个 adapter 的默认值，而显式会话值始终优先。

**前置条件**：能列出所有配置源和读取点；知道每个默认值属于哪个 owner；有 route/provider 身份概念。

**补充规则**：模型发现注册表保持最小——每个 namespace 一个 offer，不存储、不拥有超出所属 fiber 的生命周期；provider/网络失败与格式错误的 URL 拒绝是不同结果。声明式路由只能使用 key、endpoint、headers 能完整描述的协议；需要 SigV4、ADC、Azure 环境或 OAuth 等专属认证的 provider 只保留 catalog 路由，认证跟随 provider 而非 wire 协议。settings namespace 在同时注册 configurable provider 之前不可 web 配置；`SettingsDescriptor` 必须携带 `revision`，写入冲突由 `expectedRevision` 表达，忽略它的客户端保持 last-write-wins。

**操作步骤**：1) 画配置源与声明位置，合并重复项。2) 把默认值放到 adapter/owner，runtime 只负责在省略时物化和标记。3) 在 dispatch 前把 effective config 记为请求事实；下一轮前剥掉标记并按当前 route 重算。4) 用 allow-list 控制 wire 暴露；未注册/未暴露统一响应。5) 把安全边界（认证、host 信任、DNS rebinding）分开写，不用一个配置项承担两种语义。6) 测试显式值、省略值、切换 provider/model、未知 key、未暴露 namespace。

**角色/完成信号**：配置 owner 定义声明处和默认；adapter owner 定义 per-route 默认；runtime 负责物化/剥离。完成信号是任一配置只有一个写入/声明处；切换路由后默认值随路由改变，显式值不变。

**失败处理/例外**：未知/禁止的配置 key 应拒绝而不是忽略（第 21 节）。环境变量层可以覆盖文件，但必须按固定优先级，且不能成为第二个声明处。历史默认值若已写入持久日志，需要版本/迁移边，不能靠“重新物化”改写旧记录。

**证据边界**：源 Note 含 archived 的配置树/adapter 默认/边界设计；未在本提取中启动服务或验证真实 HTTP/DNS 行为。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-24-web-config-tree-boot-and-transport-layering.md:1-45@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-30-adapter-owned-max-token-defaults.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-30-config-plane-boundaries.md:1-44@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-24-web-config-tree-boot-and-transport-layering.md:1-45@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-30-adapter-owned-max-token-defaults.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-30-config-plane-boundaries.md:1-44@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-03-pi-ai-declared-provider-catalog.md:1-68@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-04-draft-provider-endpoint-interrogation.md:1-51@687f282e

<a id="rationale-architecture-4-credential-management"></a>
## 8. 凭据分层、严格解析与优先级

**触发**：新增 provider/密钥来源；`.env` 同时承担 Secret 存储和用户环境；出现“设置成功但实际用了另一个密钥”。

**问题与规则**：凭据文件必须一个文件一个职责。源 Note 把 Harness 管理的 `.credentials.yaml` 与用户环境层拆开：前者是严格的 `CredentialRef -> 非空字符串` 映射；非 mapping 根、非 POSIX key、非字符串、空值、重复和坏 YAML 在启动/写入时 fail loud；热重载时告警并保留上一个 good 值，因为静默忽略一个 key 会读成“凭据不存在”。凭据优先级必须显式且可解释：保存 winner、保留 losing layer 供读取、报告来源；不能因为某个名字被导出就拒绝保存。pre-run override 用“移除 ref / 独立 home”等方式，而不是偷偷改全局。UI 始终显示最终 winner。provider 目录是声明，安装的 catalog 只是默认；per-model 字段按 id 继承，只暴露有真实读者的字段；字段暴露按消费者逐个增加，避免“看起来支持”。模型/显示名不参与凭据资格判断。模型发现是第三类 secret 承载 payload：必须要求完整 Host API 认证，密钥只写不回声，键入密钥优先于已存凭据且不重建已存值，拒绝详情只点名端点、绝不包含凭据，响应按实际收到字节限界。

**前置条件**：列出所有凭据来源（文件、env、显式参数、provider 默认）；知道每个来源的优先级和生命周期；有严格解析器和来源报告。

**操作步骤**：1) 把 Secret 存储与用户环境层拆成不同文件/接口。2) 对凭据文件做严格 schema 校验，启动/写入 fail loud；热重载 warn-and-keep-last-good。3) 定义 winner 计算并记录来源；保留 losing layer 但不参与当前读取。4) pre-run override 通过独立的 ref/home，不改写全局文件。5) UI/日志显示 winner 和来源，不显示 secret 值。6) 测试坏 YAML、空值、重复、权限、provider/model 切换和显式值优先。

**角色/完成信号**：凭据 store owner 负责解析和 winner；provider owner 负责字段消费；UI 负责显示来源。完成信号是任一次请求都能回答“用了哪个 ref、来自哪一层、为什么”；坏文件不会被当作空凭据继续。

**失败处理/例外**：热重载失败保留 last-good，但必须可观察；启动失败应阻止服务而不是带病运行。环境变量可作为一层，但不能与托管 Secret 文件混写。历史 Note 中曾有一个 `.env` 同时承担两种职责，迁移时必须拆分，不能只改注释。

**证据边界**：源 Note 含 archived 的凭据/目录/优先级设计；未在本提取中读取真实凭据文件或执行 provider 请求。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-03-pi-ai-declared-provider-catalog.md:1-68@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-04-credentials-yaml-and-user-environment-layer.md:1-50@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-03-pi-ai-declared-provider-catalog.md:1-68@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-04-credentials-yaml-and-user-environment-layer.md:1-50@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-04-draft-provider-endpoint-interrogation.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-stored-credential-precedence.md:1-45@687f282e

<a id="rationale-architecture-4-privilege-boundaries"></a>
## 9. 权限分离、目标身份与同意

**触发**：用户手动操作与模型工具共享宿主权限；暴露原生应用/窗口对象；授权可被保留句柄绕过。

**问题与规则**：宿主权限不等于用户对某个目标的同意。源 Note 的规则：(a) 用户终端通过 Session 的 subprocess provider 直接运行，使用执行环境的系统用户权限，不套用 Agent sandbox，也不请求 Agent approval；OS 权限、容器隔离和 provider 的凭据环境清洗仍然生效。为手动终端而放宽 Agent sandbox 是错误方向。(b) CUA 共享库拥有应用/窗口对象、同意和带日志的 dispatch；平台包只拥有 Swift helper、构建和连接生命周期；消费者不持有平台代码，也不建第二个 runtime registry。(c) 同意绑定可验证目标身份：规范可执行路径 + 已验证签名要求；显示名/标签永远不能建立身份。不可验证的临时应用只获得 task-only 访问，绑定到进程实例和连接生命周期，不能创建保存的 grant。(d) 先准备元数据和句柄，再询问；启动前再次检查可执行文件；同一目标串行决策；任务内已拒绝不重复弹窗。撤销使句柄失效并取消活跃操作；重新授权用新连接；dispose 等待原生清理。(e) 连续悬停等操作不得按下/恢复指针；不要从到达顺序或 Session 生命周期推断跨调用应用所有权。

**前置条件**：能区分“用户操作权限”和“模型工具权限”；有目标身份验证（路径 + 签名）；有 consent 服务/问题服务；能清理原生句柄。

**操作步骤**：1) 为每个特权操作写清 authority、target identity、consent lifetime。2) 用户手动能力走独立权限路径，不扩大模型 sandbox。3) 对原生目标做可验证身份；不可验证则降级为 task-only。4) 在 dispatch 时再次检查 consent，而不是只信准备阶段的快照。5) 撤销时使句柄失效并取消操作；重新授权用新连接。6) 测试并发决策、撤销后旧句柄、拒绝后同任务、原生清理和悬停副作用。

**角色/完成信号**：executor 执行；consent 服务记录决定；OS 授权；provider 清理。完成信号是拒绝/撤销后没有副作用，旧句柄不能复用，任务内不会反复弹窗，跨任务重新验证。

**失败处理/例外**：平台签名/ACL/原生对象语义因 OS 而异；打包权限和二进制分发可能不在同一范围。用户明确拒绝后，同一任务不重复询问；新任务应重新评估。原生清理失败要报告，不能静默宣称已释放。

**证据边界**：源 Note 为 implemented 记录，但本提取未在 macOS/桌面环境执行 CUA、签名验证或句柄清理；具体 signing requirement、ACL 和 UI 流程属于原产品。

**尾部补充**：用户终端的授权范围是 subprocess provider 的系统用户命令执行（可写 workspace 之外），但不授予 root 或容器逃逸；Session 所有权只用于分组和清理，不代表 Agent 对用户操作有权限。控制器测试要覆盖所有 Agent sandbox 模式下的直接 shell 启动和模式切换期间的持续所有权，并用真实 PTY 验证 workspace 内外的写入，同时保留 Agent 侧只读拒绝与审批断言。原生 CUA 的输入成功只记录 dispatch，不表示任务完成：调用方必须验证效果，不能自动重试不确定的输入，观察不得锁住桌面。剪贴板粘贴要限制等待消费者读取数据的时间，超时关闭 provider，仅在仍持有所有权时恢复剪贴板，并只报告“区间内未读取”，不能断言应用永远不会处理该命令。源码构建的可执行文件按 generation 内容寻址，不能在运行时替换；分发包 payload 与源码构建路径分开。撤销一个应用会同时使同一 Agent 连接上的其他应用句柄失效（需要重新选择）；保存的 grant 仍可复用，task grant 过期，独立连接除非共享该应用否则不受影响。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-user-terminal-permissions.md:1-29@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-experimental-cua-object-api.md:1-43@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-26-cua-application-consent.md:1-38@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-user-terminal-permissions.md:1-29@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-experimental-cua-object-api.md:1-43@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-26-cua-application-consent.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-cua-continuous-hover.md:1-27@687f282e

<a id="rationale-architecture-4-execution-containment"></a>
## 10. 受管执行范围与进程树边界

**触发**：工具启动子进程/PTY/脚本；取消或超时后需要确认没有后代残留；工作流执行模型生成的代码。

**问题与规则**：进程组、Windows 父进程遍历和 PTY 后代扫描只描述可观察关系；子进程可以 `setsid`、被重新挂接或在父进程退出后存活。终止“看起来的进程树”可能返回，但工作、端口、文件仍被占用；直接目标退出不等于后代停止。发布 PID 也不能解决，因为原生目标身份异步建立，PID 不命名受管范围。源 Note 的做法：provider 在执行前选一个私有受管范围所有者：符合条件的 Linux 普通/PTY 用 transient user-systemd scope；符合条件的 Windows 普通进程用私有 runner 拥有的、未命名 kill-on-close Job；不支持的主机明确降级到较弱回退并说明。终止/等待接口控制并观察同一范围，`.done` 只报告直接目标。文件系统与子进程共同定义一个执行世界：路径命名空间、可执行文件、进程、终端会话必须一致；上层能力消费这两个接口，不直接命名 provider。工作流复用已有受限 Node 执行运行时（文件策略、隔离程序状态、受限输出/控制流量、受管清理），不新起第二个 launcher。持久执行只描述状态保留：默认每次调用新进程；显式 `persistent-in-memory` 才按对象身份保留 REPL；`durable` 不是可接受值，除非先定义恢复点、可恢复值和外部资源处理。

**前置条件**：有可用的平台范围机制（systemd/Job Object）或明确降级；有统一路径/可执行文件/终端接口；清理和取消语义已定义。

**操作步骤**：1) 列出执行入口和终止/等待语义。2) 选受管范围 owner，定义私有目标身份。3) 把 terminate/wait/exit 绑定到同一范围，不暴露可伪造的 PID 所有权。4) 让上层只消费统一执行接口。5) 复用已有沙箱运行时，不新建第二个执行器。6) 用 setsid、重新挂载、父进程退出、PTY 后代、残留端口/文件等场景测试。

**角色/完成信号**：provider 创建/持有范围；执行消费者只调接口；平台提供范围保证。完成信号是终止后范围内工作、端口和文件句柄消失，而不只是直接进程退出；不支持的主机明确记录降级。

**失败处理/例外**：同步调用、已移交所有权的执行、明确不在范围内的外部进程不适用。平台不支持时不能宣称强保证；降级要可观察。`durable` 若未来出现，必须先有恢复契约，不能只改枚举值。

**证据边界**：源 Note 含 archived 的进程范围设计、execution world 和已实现的 PTC 复用/持久模式；本提取未在 Linux/Windows 执行终止或残留测试。

**尾部补充**：启动失败是歧义的，不能重放命令，否则可能执行两次；只缓存一次成功的深度探测，并在每个符合条件调用前重新检查 manager 可达性。启动失败只能由 owner 发出的终止信号推断，不能只看 request 是否被消费。range 结算不能从未知或 malformed 的 manager 结果推断：未上报的进程数保持未决，异常组合使 `waitForExit()` 拒绝；只有当请求已消费或 launcher 已退出且 unit 仍 active 却无进程等条件成立时，才停止遗留 unit。平台回退是观察性的：终止顶层 shell 前后扫描后代，等待 PID 身份围栏内的后代；macOS leader 退出后无法枚举 reparent 的子进程是显式限制。终端取消保留 send reservation 直到在途写结算，再向 foreground group 发信号；stale inspection 不能释放 reservation，被拒绝的写不发信号，absolute deadline 保持 armed，close 拒绝新的 public signal 并把 quiescence 交给 handle。per-spawn selector 只是 locator，不是凭据或持久格式；wire 记录闭合，缺失/多余/类型错误/未知字段都 fail closed，父进程的首个取消原因原样保留且不传到 wire。长工作流用显式 null 保留调用方控制的生存期，共享沙箱不引入新账本或配额；取消不等待脚本协作退出，dispose 等待子进程清理，provider 管理范围仍限制可声称的保证。共享转换来源的尾部只界定该转换自己的准入边界：source reservation 只计二进制字节，Remote base64 展开、引擎 RSS、调用方保留输出与 PDF.js 页面内存明确不在限内，因此不能当作受管执行范围的成本保证；其验证覆盖 pre-read admission、内容合并、优先级、取消隔离、延迟释放、LRU/别名上限、陈旧版本与转换器替换，loader 组合和 native 转换检查独立于展示消费者验证同一 provider；以上验证均由源 Note 报告，本提取未执行。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-28-subprocess-native-containment.md:1-91@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-28-portable-execution-world-consumers.md:1-71@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-13-workflow-ptc-sandbox-reuse.md:1-41@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-bounded-office-conversion.md:1-43@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-23-best-effort-persistent-ptc.md:1-37@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-28-subprocess-native-containment.md:1-91@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-28-portable-execution-world-consumers.md:1-71@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-13-workflow-ptc-sandbox-reuse.md:1-41@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-bounded-office-conversion.md:1-43@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-23-best-effort-persistent-ptc.md:1-37@687f282e

<a id="rationale-architecture-4-transport-trust"></a>
## 11. 传输与存储信任从接收端状态推导

**触发**：直连服务器需要携带凭据；部署在反向代理后；桌面端需要跨账号保存浏览器状态。

**问题与规则**：广告一个 HTTPS URL 既不会加密 listener，也不会建立证书信任；`publicUrl`/forwarded headers 不能证明代理身份。源 Note 的规则：(a) listener 自己拥有 TLS：证书和未加密私钥 PEM 在 bind 前加载；不可读/空/无效/不匹配时 activation 失败，且没有 HTTP fallback；HTTP 仍是默认；两种传输共享路由/upgrade/dispose；dispose 负责未完成握手。(b) `webServer.protocol` 是 bind URL、非 loopback 明文警告和 Secure cookie 的唯一来源，不从 `publicUrl` 或 forwarded header 推导。(c) Origin 按自身 HTTP(S) scheme 比较，但 listener scheme 用于 grant；cookie 名和签名 audience 绑定 scheme，HTTP 凭据不能在 HTTPS 重放；保留既有 HTTP cookie 拼写。(d) 浏览器存储按“Platform origin 的 SHA-256 + 稳定 account id”分区，分区名不出现原始 id/token；持久分区只保留声明的 localStorage 类数据，加载前清理 cookies、filesystem、IndexedDB、caches、service workers 和 auth state；关闭/下次打开/关停都清理，清理失败则阻止该账号重开直到成功。

**前置条件**：能区分 listener 实际协议与对外广告 URL；有证书/私钥加载和验证；有账号身份和存储清理实现。

**操作步骤**：1) 分类接收端实际控制什么（socket、账号、存储）。2) 在 bind 前加载/验证 TLS 材料，失败即停。3) 从 listener 协议派生 URL、警告和 cookie 属性。4) 给 cookie 名/audience 绑定 scheme；验证跨 scheme 不可重放。5) 按 origin + 账号分区，清理所有非保留数据类。6) 测试无效证书、代理头伪造、跨 scheme cookie、清理失败和异常退出。

**角色/完成信号**：server operator 配证书；listener 负责 TLS；desktop host 负责分区/清理；平台负责信任。完成信号是直连流量确实被 listener 加密；无效证书不会退回 HTTP；分区不泄漏原始账号/token；清理失败时账号被阻止而不是复用残留。

**失败处理/例外**：证书签发/续期/信任由 operator 负责；代理重写和 Electron 进程行为属于外部。HTTP 是显式默认，不是错误；但携带凭据的直连必须用 TLS。单个账号清理失败不影响其他账号。

**证据边界**：源 Note 为 implemented 记录；本提取未启动 TLS listener、伪造代理头或执行 Electron 分区测试。

**尾部补充**：直连 HTTPS 不需要 TLS 终止代理，但 HTTP listener 前面的 HTTPS 代理仍自行负责外部 cookie 重写；HTTPS listener 发出 `Secure` cookie，因此面向公网的浏览器部署必须保留 HTTPS，不能依赖本地浏览器的 HTTP 例外；部署步骤属于 public deployments guide。该 Note 只部分取代早先的 HTTP-only 假设：早先 Note 仍拥有 cookie 载荷/生存期与 bind 准入。测试覆盖已验证 HTTPS、无效材料、dispose、listener 拥有的 cookie 属性、跨协议凭据重放、精确端口授权、未配对 CLI flag 的启动拒绝，以及桌面端 WS/WSS 凭据匹配与跨传输拒绝；本提取仍未执行这些测试。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-platform-browser-storage.md:1-23@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-23-native-https-web-listener.md:1-41@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-platform-browser-storage.md:1-23@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-23-native-https-web-listener.md:1-41@687f282e

<a id="rationale-architecture-4-deadline-policy"></a>
## 12. 超时原语与 per-tool 策略

**触发**：异步工具/ provider 调用可能挂起；不同工具需要不同超时；需要区分超时与调用方取消。

**问题与规则**：超时逻辑被重复实现三次，且“超时”和“上游取消”被错误融合。源 Note 的规则：(a) 提供一个纯函数库（不是 Cordis service/plugin，无 ctx/注册/跨调用状态/事件）：`clampTimeout` 校验/填充正数 hint 并设上限；`deadline` 通过 `AbortSignal.any` 融合上游信号与一次性 timer，产生 typed `TimeoutReason`；timer 可 dispose；非正数表示无超时 sentinel 并转发上游。(b) 超时策略只附着在面向模型的工具执行上：`dsh-tools` 在 pre/post 之间加 `tools/execute` around-dispatch waterfall；policy 只包裹 `ToolDefinition` 声明了可选 `timeoutMs` 的调用；该值由拥有工具的插件从配置设置，`defineTool` 校验正有限数；默认无 deadline。(c) 超时放在定义上，不放在名字 map，避免拼错后静默不生效。(d) enforcer 原地修改 `exec.signal`（Cordis waterfall 的 next 语义要求）；终止仍由能力 owner 负责，策略层不声称能停任意工作。

**前置条件**：有统一 deadline 原语；工具定义可声明超时；dispatch 有 around 钩子；能力 owner 能执行终止。

**操作步骤**：1) 用共享库替换本地 timer，保留 timeout/cancel 的原因区分。2) 只在工具执行 dispatch 上加策略，要求显式 opt-in。3) 由工具 owner 从配置设置 `timeoutMs`，定义时校验。4) 到期时请求能力终止并等待结算。5) 测试超时、调用方取消、两者竞争、未 opt-in、无法终止。

**角色/完成信号**：工具作者声明策略；registry 应用策略；能力 owner 终止。完成信号是每个超时/取消产生稳定分类结果，未 opt-in 的工具行为不变，无法终止的能力明确报告。

**失败处理/例外**：不要给所有工具强加一个全局超时；同步工作和已移交的工作不适用。超时默认值/工具名属于产品配置，不能从 Note 推断。超时不是取消的替代：调用方取消必须保留独立原因。

**证据边界**：源 Note 为 implemented 记录；本提取未执行计时、取消竞争或工具 dispatch 测试。

**尾部补充**：流式/空闲预算用 idleWatchdog：只在有一个 iterator `next()` 未决时 arm，结算时 disarm，后续 demand 重新 arm；out-of-band 传输活动可以 pulse 同一未决 demand；没有未决 demand 或已 dispose 时 pulse 是 no-op，并发 demand 失败，dispose 清除 arm。one-shot deadline 只通知，终止仍由能力 owner 完成；第一个 abort 原因决定是 timeout 还是调用方取消，timeoutOf 只作用于内层能力，外层 deadline 被当作 upstream cancellation。不能强制停止的工作（例如本地文件 syscall）不加 timeout，已无人读取的 always-zero/always-false 字段应删除。声明 `timeoutMs` 意味着工具承诺遵守 `exec.signal` 并到达 quiescence；不要用 `Promise.race` 伪造强制终止，也不要把 timeout 暴露成模型参数，provider backstop 应高于工具预算。around-dispatch wrapper 按注册顺序组合：调用 `next()` 的 wrapper 包裹下游，直接返回则短路；部署必须明确预算覆盖整个 retry 还是每次 attempt。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-07-06-timeout-deadline-library.md:1-116@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-07-tool-call-timeout-policy.md:1-113@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-06-timeout-deadline-library.md:1-116@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-07-tool-call-timeout-policy.md:1-113@687f282e

<a id="rationale-architecture-4-failure-normalization"></a>
## 13. 失败归一化与必需状态缝

**触发**：adapter 同时以抛出异常和 in-band 终态事件失败；可选 registry 缺失时功能静默变空。

**问题与规则**：一个 adapter attempt 的失败可能来自最终 adapter 选择、同步 dispatch、iterator 构造或 `next()`，也可能来自 in-band terminal error/aborted finish；让 loop 同时处理两种表示，正确性就取决于哪条语句抛出。源 Note 的做法：runtime 是单个 attempt 的归一化边界，只捕获上述最终路径的失败，把抛出值转成不可变 `LlmFailure`，并恰好发出一个 terminal `finish`；调用方取消保持独立。消费者只处理一种公开结果，不维护 stream-keyed sidecar。另一条规则：可选 projection registry 会让“宿主行为读取投影状态”的插件在 registry 缺失时仍激活，随后字段静默消失；因此每个 host reader 把 registry 和所需 key 当必需：要么声明 required injection，要么显式解析并在首次依赖访问时 throw。官方组合先挂 registry；`ApiProxyService` 用 required injection，底层 factory 为隔离测试保留宽容；`ctx.inject` 只控制可选注册。

**前置条件**：能枚举一个 attempt 的所有失败表示；有单一 loop/消费者；知道哪些 registry/key 是必需的。

**操作步骤**：1) 列出选择、dispatch、构造、迭代、in-band 终态的错误路径。2) 在 runtime 边界统一捕获并转成一种 outcome，保留 cause。3) 保证每个 attempt 恰好一个终态。4) 对必需 registry/key 用 required injection 或显式 throw；只在可重建数据上 fail-soft。5) 测试每条失败路径、缺 registry、取消与失败竞争。

**角色/完成信号**：adapter 归一化；loop 消费单一结果；reader 强制必需状态。完成信号是消费者无需区分“抛出/事件”两种表示；缺 registry 时启动/读取明确失败，而不是空功能。

**失败处理/例外**：可重建的缓存失败可以降级，但必须显式声明并可观察。隔离测试可容忍缺 registry，但正式组合不能。不能把 caller cancellation 混进 adapter failure。

**证据边界**：源 Note 为 implemented 记录；本提取未构造 adapter 失败矩阵或运行 projection 组合。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-terminal-llm-stream-failures.md:1-37@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-19-session-projection-mandatory-seam.md:1-35@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-terminal-llm-stream-failures.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-19-session-projection-mandatory-seam.md:1-35@687f282e

<a id="rationale-architecture-4-presentation-assembly"></a>
## 14. 目标中立的展示装配与替换点

**触发**：新增业务节点、第三方要替换/包裹一个展示位置、高频流需要渐进显示、投影状态随窗口增长。

**问题与规则**：集中式 transcript fold 或 renderer 自己解析，会让每个新业务改 switch、重放、索引和缓存。源 Note 的所有权分层：Session 只拥有连续事件窗口和快照通知；注册 Event Definition 和 per-target View Builder；`match(event)` 只读当前事件并返回稳定 id 与 start/update 角色，不读 Context/history；同一 kind+id 的最早 start 初始化一个生命周期，后续 start 走 update，独立调用必须使用不同 id，不能再靠第二个 start 报错检测身份复用；State 从 start 向前折叠，非尾部插入或依赖变化从 start 重放，不向后打补丁。Location 是一等引擎事实；先发布 Step 数据再发布 Turn 数据；renderer 只拿稳定只读 location。State 更新与发布节奏（立即、animation frame、无）分开，节奏不能改变折叠结果。替换位置（Slot）与可复用实现（Factory）分开；官方默认也是普通 peer registration；per-domain slot 共享实现但不合并替换身份。渐进阶段只暴露工具阶段和惰性参数视图，不暗示已执行；历史最终收敛到同一状态。只保留不可推导的投影状态，shape 变化时 bump state version；装配层按整体 surface 验收，不手工声明 taxonomies。

**前置条件**：有事件窗口/Definition 注册；稳定 id 生成规则；Location 数据；发布调度；slot/factory 机制。

**操作步骤**：1) 先定所有权分层和稳定身份。2) 注册 Definition/Builder，实现 forward replay、Location、发布节奏。3) 加 slot/factory，默认 peer，per-domain 替换不共享身份。4) 只在改善显示时加渐进阶段。5) 删除旧链/注册表。6) 测试重复 start、身份变化、非法撤回、非尾部插入、隐藏目标不物化、替换后恢复默认。

**角色/完成信号**：Session/assembler 拥有身份/依赖；Definition 拥有一个业务；Builder 拥有目标排序；Renderer 拥有显示。完成信号是新增业务只需本地注册，不修改 Session 或其他业务；重载后最终节点一致；替换插件后官方默认恢复。

**失败处理/例外**：成员 Note 跨多个迭代，其中一条明确 supersede 了早期装配限制；迁移时以稳定所有权行为准，不照搬中间 API。React/Cordis 的具体 API 和 slot 名属于原产品。非尾部插入允许重放，不允许“向后 patch”掩盖身份冲突。

**证据边界**：源 Note 含 archived/implemented 的装配、投影、三阶段工具调用设计；本提取未渲染 UI、运行重放或浏览器快照。

**尾部补充**：本决策取代“同一 Context 只能收到一次 start”的旧限制：同一 kind+id 的多个 start 属于同一生命周期，最早者初始化，之后按 update 折叠；独立调用必须使用不同 id，不能再靠第二个 start 报错来检测身份复用。每个携带 id 的 delta 都是 start 候选；已读取答案变化时替换准备态块，未读取的调用保留块引用。schema 顺序与描述只是引导模型先生成标签，不保证生成顺序：字段可用就显示，路径晚到会推迟其后的进度展示；名字晚于参数到达的流放弃扫描并退回只显示标题。替换位置要退役旧 slot 名称、chain selector 和标题动作，更新测试夹具与 inspect catalog；Body 是独占替换位置，不自动组合多个正文转换，显示变换不等于脱敏或模型输入修改。request-prompt 解释是跨 target 共享的纯函数、但不共享 target State；每个 target 自行选择产物。Step 的首个 header 按 provider envelope 定位，后续 header 留在自身 Event；部分窗口外的非 `initial` header 保守渲染；每个 header 都是完整快照；prepend 可隐藏未变的 `change` header，但不得撤回其稳定 Node key。收件箱分类由 target 自己拥有：只在消费分类的 target 注册 Inbox Definition；插入只存 message ID；一次成功 claim 只物化一次 pending 链并替换上一批 claimed 集合；后续 Context 保留线性 ID 状态。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-25-web-command-surfaces-and-assembly.md:1-63@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-19-session-projection-state-and-client-views.md:1-29@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-tool-call-three-phases.md:1-67@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-preparing-tool-arguments.md:1-88@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-reasoning-content-slot-factory.md:1-102@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-25-web-command-surfaces-and-assembly.md:1-63@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-19-session-projection-state-and-client-views.md:1-29@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-09-client-conversation-node-assembly.md:1-429@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-tool-call-three-phases.md:1-67@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-preparing-tool-arguments.md:1-88@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-message-node-factories-and-delegates.md:1-54@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-reasoning-content-slot-factory.md:1-102@687f282e

<a id="rationale-architecture-4-live-retention"></a>
## 15. 活动保留与恢复分离

**触发**：tab/pane 隐藏后返回；Session 切换要求不销毁嵌入页面；嵌入式 guest 在 unmount 时断开。

**问题与规则**：恢复 tab 记录/URL 不等于保留活浏览上下文；unmount body 或改变 DOM 祖先会断开 guest（Electron 44 会在 disconnect 时 detach/reset），缓存元素/keys 无法补偿。源 Note 把 live-body retention 放在 Sidebar，独立于导航/存储：retained page 的祖先在 session 切换、tab 选择、pane 移动、collapse、浮动、re-dock 期间保持连接且不变；Browser 直接 attach 到内容容器，不用占位测量/overlay。布局上 DockLayout 一/二 pane，稳定 tab siblings；每个 tab 有稳定 grid cell/frame/header/body；docking 用显式结构。保留是显式 opt-in（`keepMounted`）：首次显示创建，直到 occurrence/provider 生命周期结束；不持久化保留策略。每个 view 拥有一个 `SessionReference`；tab 通过 retention hold 贡献，而不是独立 reference；Session provider key 稳定。导航/占位只为选中的 Session 绑定；后台 action 指向自己的 store；隐藏内容从 pointer/keyboard 移除并 blur。provider 有物理 attach/detach（hiding 不触发）；dispose 等待 pending creation/release；取消后完成的 acquisition 被释放而不是 attach。没有隐式 LRU/idle timeout；回收需要显式 suspension/recovery 策略。

**前置条件**：稳定的容器布局；引用所有者；provider 的 attach/detach 和清理；明确哪些类型值得付出保留成本。

**操作步骤**：1) 区分 live retention 与 cold recovery。2) 为类型显式 opt-in，稳定 DOM 祖先。3) 每个 view 一个 reference，tab 只加 hold。4) 实现 provider attach/detach 和取消后释放。5) 隐藏时移出交互/blur。6) 测试所有过渡、guest crash、shutdown 和取消竞态。

**角色/完成信号**：layout 拥有放置；Session 拥有引用；provider 拥有 guest 创建/销毁；host 拥有分区。完成信号是隐藏/重显后页面仍活着且身份不变；冷启动仍只显示保存的元数据直到显式恢复；取消的 acquisition 被释放。

**失败处理/例外**：guest crash 可以经 provider 重试，但不能声称“内存中的页面”已持久化；undo 产生新 occurrence。非保留类型按可见性 unmount。Electron 具体行为和 DOM API 属于原产品；真实 guest 身份/表单/历史证据可能未验证。

**证据边界**：源 Note 为 implemented 记录，含单元测试与手工冷启动验收；本提取未运行 Electron guest 或布局测试。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-20-sidebar-retained-tab-layout.md:1-82@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-20-sidebar-retained-tab-layout.md:1-82@687f282e

<a id="rationale-architecture-4-progressive-disclosure"></a>
## 16. 渐进披露与零足迹扩展

**触发**：技能首文件接近工具结果截断阈值；应用级扩展可能为空或可选；插件要加全局导航/空间。

**问题与规则**：超过 pruner 阈值的技能文件会被 head/tail 截断，丢失中段；根级扩展即使没有内容也可能改变默认布局。源 Note 的规则：(a) 把首文件 `SKILL.md` 缩到“过程、知识源顺序、索引”；配方移到 `references/`/`templates/`，通过 skill base directory 解析；测试强制首文件低于 pruner head、每个引用文件存在、每个模板可解析；知识源只是有序、不是禁止（inspect query、resolved packageDir README、built declarations 或 checkout sources）；包路径按安装/profile 解析，不能从 profile 推导。(b) 应用级 panel 用 root-scoped keyed main slot；添加扩展不得给默认应用增加导航控件或预留空间；空 panel 列表不渲染 DOM/spacing，默认 sidebar 快照不变；选择校验 live main entry，缺 key 拒绝且不替换当前 panel；选择是 transient、reload 重置；dispose 移除贡献，移除选中项回到 Conversation；DOM focus 不等于 selection；共享 root store 保存 panel/layout 信息。

**前置条件**：知道技能/扩展的大小预算；有按需加载的引用目录；有零足迹的空状态；有选择/恢复语义。

**操作步骤**：1) 先测量首文件是否接近阈值。2) 把细节移入索引引用，保留过程与知识源顺序。3) 加大小/引用/模板检查。4) 让空扩展不渲染 DOM/spacing/导航；按需注册。5) 选择校验实时条目，dispose 恢复默认。6) 测试空/满扩展、缺 key、reload、移除选中项。

**角色/完成信号**：技能作者控制结构；扩展 host 控制懒注册；shell 控制默认 chrome。完成信号是首文件低于阈值且所有引用可解析；空扩展对默认 UI 完全不可见；移除扩展无残留。

**失败处理/例外**：精确字节阈值、技能文件名和 UI slot 属于原产品；不能把“知识源列表”当成禁止读取其他来源。扩展可以提供导航，但只在真的有贡献时；默认状态不能预留空间。

**证据边界**：源 Note 含 archived 的技能/面板设计；本提取未运行大小检查、模板解析或 UI 快照。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-09-08-global-main-panels.md:1-38@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-21-creator-skills-progressive-disclosure.md:1-26@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-08-global-main-panels.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-21-creator-skills-progressive-disclosure.md:1-26@687f282e

<a id="rationale-architecture-4-performance-governance"></a>
## 17. 以决策为导向的性能治理

**触发**：热路径/存储布局变更；提出资源预算；用性能数字支持设计。

**问题与规则**：存储优化可能把不成比例的工作挪到写、读或 fork；字体复用不会减少图片工作；一个数字不能代表另一条路径。源 Note 的测量纪律：在代表性语料上做独立运行、轮换执行顺序、每个候选占据每个 run 位置、每个 build 做三次完整与后缀读取扫描、每指标去掉最高/最低后平均剩余三次；结果要同时报告收益与代价。例如 provenance ranges 让存储大小降 14.1% 且无明显延迟回归；level 19 再省 12.1%，但 full write +67.0%、fork +129.8%，读变化 <1%，因此不采纳。字体/图片是不同成本：provider 构建一次不可变 font metadata snapshot，按 worker `structuredClone`；per-worker glyph coverage/request caches/imported bytes；cache key 用完整请求（family、style、weight、italic、width、pitch、language、有序 code points），部分 key 会选错文件；worker 终止释放 cache/engine memory；字体变更需显式 provider reload；图片默认 192 DPI 是相对 96 CSS DPI × ratio 2 的显示目标，不是引擎内存保证。

**前置条件**：有代表性语料；能独立重建/运行；有明确的决策问题；知道哪些成本不能互相替代。

**操作步骤**：1) 先写测量支持的决定和排除项。2) 存储按五次独立重建轮换顺序，每次三轮 complete/suffix sweep，每指标去最高/最低后平均其余三次；不是中位数。3) 分开报告存储大小、写/读/fork、字体复用与图片工作，不能互相抵消。4) 不可变 font metadata 构建一次、按 worker 克隆，cache key 用完整请求。5) 用实际引擎导出验证 DPI 下图片尺寸、可选中文本和页数，ABI 转发不等于滤镜生效。6) 在目标环境记录可比结果；目标可另行设计 CI 预算/负向控制，但来源没有这种自动性能门，不得假称已继承。

**角色/完成信号**：性能 owner 记录语料、方法、收益和代价；存储/渲染 owner 验证各自行为。完成信号是可比方法下支持设计取舍，以及真实导出保持声明的尺寸/文本/页数；不把一次性测量写成 CI regression gate。

**失败处理/例外**：历史数字不是当前保证；本地测量不等于整页/CI 延迟。优化若失败，回到测量基线，不发布未测量声明。不能用字体复用证明图片预算，也不能用一个综合分数覆盖两条路径。两条声明来源只测量存储大小、写/读/后缀读/fork 时间、字体复用与真实导出行为；它们没有 allocation、retained heap 或 RSS 测量（预览 Note 只把内存写成非保证），因此不得把这些指标名当作来源预算。

**证据边界**：源 Note 的数字是历史一次性结果；本提取未运行 benchmark、CI 预算或浏览器预览。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-25-persistence-latency-and-page-size.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-11-wasm-preview-font-and-image-budgets.md:1-36@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-25-persistence-latency-and-page-size.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-11-wasm-preview-font-and-image-budgets.md:1-36@687f282e

<a id="rationale-architecture-4-release-governance"></a>
## 18. 发布身份、校验位置与有序发布

**触发**：打包桌面/多产物发布；health/readiness 结论被下游消费；预发布改名；上传产物与 channel 元数据。

**问题与规则**：shell/backend/client/plugin 独立版本会产生未限定组合；health verdict 可能声称超过它证明的范围；校验放在发布之后就不能保护发布；预发布改名留下兼容别名会形成两套持久词汇。源 Note 的规则：(a) 一个 release identity 绑定精确 artifact 与核心依赖；构建/运行不能另选核心版本；保留产品 profile 名并拒绝跨产品包操作。(b) 生产 artifact 签名/验证，失败即停，不产出未签名 artifact；本地 unsigned 模式明确隔离且不能通过 release validation。(c) 在校验 completion record、版本、channel 元数据、artifact 名/大小/digest 之前不读凭据、不上传；先上传不可变版本化 payload 和所有 blockmap，最后替换 channel 元数据；不删除差分更新需要的历史对象。(d) health 结论必须恰好证明消费者推断的东西（例如 `broken` 表示“不会 compose”），每个检查放在能证明其主张的位置；preset discovery 要解析每个“能证明会启动”的行且不 import，避免只有 parse shape 时把已删除包显示为健康。(e) 预发布改名：同步更新所有引用，不留兼容别名；durable session 词汇（`tool/code-dispatch*`、logged plugin name、`:code:` sub-call segment）必须延后，配结构格式版本 + 相邻迁移边，否则旧日志不可读。(f) Electron 更新按一个 release 发布；桌面与 npm 共享 `.dsh` 数据根但版本可不同，必须共享受支持产品数据而不共享可执行包、lockfile、node_modules、插件激活或包管理器配置；Electron 拥有保留的 `.dsh/profiles/desktop`。

**前置条件**：有单一 release identity；签名/验证基础设施；completion record；平台安装/更新测试；格式版本和迁移边。

**操作步骤**：1) 绑定版本与 artifact/dependency。2) 在任何 build/upload 前校验 mode-specific 输入。3) 签名、验证、必要时 notarize。4) 上传 artifact，再最后替换 channel 元数据；保留历史对象。5) 把 health 检查放到能证明结论的位置；测试选择/挂载失败。6) 预发布改名同步所有引用；durable 词汇走版本迁移。7) 在每个阻塞平台测试上一版本安装与更新。

**角色/完成信号**：release owner 绑定版本；签名基础设施验证身份；平台验证信任；packaging verifier 拥有 descriptor 校验。完成信号是发布集恰好是验证过的 artifact；上一支持版本可安装并更新；错误 health 声明会阻止下游。

**失败处理/例外**：生产签名/托管/更新基础设施不在本提取范围；平台 GUI 证据需真实资源。失败上传保留旧 channel 元数据和历史 artifact。不要用“启动时重复 descriptor 比较”替代 packaging verifier，除非有具体的安装失败证明它必要。

**证据边界**：源 Note 含 archived 的改名/health/desktop validation 与 implemented 的打包更新设计；本提取未签名、上传或安装任何 release。

**尾部补充**：预发布更名后旧配置值和 preset id 不再受支持；如果持久词汇未变，本次更名不应顺手提升格式版本，后续持久词汇更名需要自己的相邻迁移边并刷新 fixture。health 宁可漏报也不要误报 broken：包存在但 import 会失败时仍可报告健康并在挂载时失败，因为误报 broken 会让可用 preset 不可选；判定不依赖任何单个包的构建状态，源码检出也不等于已安装宿主。本地未签名打包与生产发布分离：清除证书输入、隔离产物、省略 updater 配置与完成记录，常规打包命令即使环境请求 unsigned 也显式选择签名模式。替换安装目录时，解压到目标旁边、同卷改名完整目录、暂存期间保留旧目录并在晋升失败时恢复；打包应用忽略开发资源与项目环境覆盖。生成清单或发布前验证每个原生运行时文件和每个签名，应用与 DMG 都要公证并通过 Gatekeeper；所有引用产物通过校验前不得暴露 channel 元数据。共享持久数据的每个 owner 在读取、迁移或写入前执行格式版本与进程锁；产品之间不得从对方 node_modules/profile 解析或安装包。签名凭据不进入跟踪文件或系统设置：限制文件访问、清理 CI 临时配置、从 Git 与发布映射排除真实设置、串行签名并在首次失败停止；发布配置文件是发布字段的唯一来源，加载不得修改父环境，打包子进程环境要清除上传凭据。频道按发布成熟度命名：稳定版使用 `latest`，预发布版使用语义化版本的第一个预发布标识符；作为更新 URL 一部分的 release id 不可变，上传必须拒绝不同的 id；随机目录只降低被猜中概率，不构成鉴权。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-25-rename-code-mode-to-ptc.md:1-38@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-26-preset-health-resolves-rows.md:1-76@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-build-release-validation.md:1-24@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-25-electron-desktop-packaging-and-updates.md:1-177@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-25-rename-code-mode-to-ptc.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-26-preset-health-resolves-rows.md:1-76@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-build-release-validation.md:1-24@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-25-electron-desktop-packaging-and-updates.md:1-177@687f282e

<a id="rationale-architecture-4-storage-boundary"></a>
## 19. 存储事实的始终开启不可变所有权

**触发**：对象即将进入事件日志；已存储事件被发布给观察者；有人提议用 dev-only 插件或 TypeScript `readonly` 保证不可变。

**问题与规则**：不可变所有权不能是可选 dev 插件，也不能是 TypeScript `readonly`：类型在运行时被擦除、可强转，并会污染可变消费者。源 Note 的规则：`Session` 内始终开启一个边界，一次递归遍历生成无损 JSON 快照，拒绝不支持的值，并产生真正进入日志的分离记录；这样校验和存储不会因有状态 getter 给出不同结果，也不会保留调用方引用。接受的事件及其后代在发布前深度冻结；append 返回被拥有的冻结事件，观察者和 `eventAt` 收到同一记录；`snapshotEvents` 返回不会增长的冻结数组快照；`seq` 只读长度而不物化；seed 走同一存储路径。`deriveMessages()` 是另一个隔离边界：返回分离、深冻结的 Message 投影与新数组快照，缓存可复用安全不可变投影；它不是派生事件回写 append。任何外部引用、getter 或有状态转换都不得留到发布之后。

**前置条件**：有单一运行时写入边界（如 Session）；能递归物化 JSON、深冻结；append/seed 等存储入口经过该边界，派生消息单独保持分离与冻结。

**操作步骤**：1) 列出 append/seed 存储入口与 deriveMessages 投影边界。2) 对存储入口一次性递归物化、校验和深冻结，发布被拥有的同一记录。3) 让 snapshotEvents/seq 遵守快照不增长、计数不物化的契约。4) 派生消息返回分离、冻结投影，缓存只复用安全不可变对象。5) 测试外部修改、getter、不支持值、seed 和 request-side 隔离。

**角色/完成信号**：Session 是始终开启的存储强制点，生产者交付普通对象，观察者读取被冻结的拥有记录。append/observer/eventAt 身份一致，snapshotEvents 的旧数组不增长；deriveMessages 为分离冻结 Message 与新数组快照，不可回写历史。

**失败处理/例外**：focused test 与 custom embedding 同样获得始终开启的存储语义，不靠可选插件。`readonly` 仅是编译期提示；冻结单个记录不证明跨记录序列、嵌套、tool pairing 或请求重建正确，那些关系由独立规则验证。不支持值在写入前拒绝。

**证据边界**：来源是 implemented Note 的存储/投影契约；本次未运行目标 Session、严格模式修改或 request-side 隔离场景，不能从文本修正推导目标已执行强制。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-06-11-dev-invariants-over-deep-readonly.md:1-52@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-11-dev-invariants-over-deep-readonly.md:1-52@687f282e

<a id="rationale-architecture-4-session-context"></a>
## 20. 会话上下文所有权与显式默认

**触发**：provider 读取可选 context 或模块级 cwd；工具用 `process.cwd()` 解析路径；一个渲染器组合多个可选 override。

**问题与规则**：provider 读取 ambient agent context 或模块级 CWD，会让一个 Session 观察到另一个的选择。源 Note 的规则：调用方（工具）提供 session cwd；provider 不得读 agent/session；默认只存在于 provider 配置；`sessionCwd` 返回 `undefined` 而不是 `process.cwd()`；symlink、`..` 和父级遍历的相对路径必须解析到原生文件系统身份，使 bash、fs 工具和 sandbox grant 共享一个 workspace identity；`targetKey` 保持 realpath。注册 scope（`Context`、`agent.ctx`）与操作 subject（Agent/Session identity）不同；动态 `ctx.agent` 会混淆并破坏并发 driver。深层进程内基础设施需要可信的 initiating Agent，但不应把它转发进每个私有 helper；全局 slot 跨 await 是错的；模型可见参数永远不能选择身份。组合应一次解析并把结果传给每个消费者，使一个 view 只有一个身份；只持久化规范化根，复用前重新派生依赖状态；可选 override 缺失就省略，不用 sentinel 或第二个默认。

**前置条件**：有显式 context 注入；知道 cwd 的 owner；有路径规范化（realpath/symlink/父级）；组合根可传递解析结果。

**操作步骤**：1) 把 provider context 改为必需，消费者显式传递。2) 删除 ambient 读取和模块级 cwd。3) 定义唯一默认和规范化规则。4) 组合一次解析，所有消费者复用。5) 持久化规范化根，复用时重算依赖。6) 测试 Session 切换、symlink、父级遍历、缺 context、组合多 override。

**角色/完成信号**：provider 拥有默认；Session 拥有 cwd；工具使用传入值；消费者不得再 default。完成信号是两个 Session 不共享隐式 cwd；一个组合只有一个身份；删除 workspace 明确失败而不是回退。

**失败处理/例外**：可选 override 用“省略”表达，不用 sentinel。fork/continuable child 的 prefix 复用要求 leading bytes 匹配；child-only system prompt 或 tool schema 放在继承历史之前会破坏 provider prefix cache。具体 context key/API 属于原产品。

**证据边界**：源 Note 含 archived 的 cwd 规则和 implemented 的 initiator/fork 设计；本提取未运行 Session 切换、路径或 fork 测试。

**尾部补充**：进程内发起身份只用于横切基础设施；隐式存在既不证明存活也不授予权限，取消与归属必须显式，且不能跨 worker、进程、HTTP 或持久队列。销毁顺序是：拒绝新边界，排空注入的依赖者与活动的 returned-Promise 边界，再 disable ambient store；由所属 fiber unload 启动的嵌套边界链要释放，避免 teardown 等待自己；dispose 后 initiator 访问必须抛错。ambient 作用域只携带 Agent，不应加入 turn、step、signal、cwd、sandbox 或 authorization；陈旧字段最多误标遥测，绝不能授予控制。工作目录在使用时验证并记录恢复，因为它可能在 harness 之外消失；当前目录与恢复目标都不可用时，提示词组装应拒绝模型轮次而不是发明回退。目录身份是必需运行时上下文，即使可选上下文被抑制也可见；文件系统、shell、指令、技能、subagent 与两个 SDK 必须一起迁移。fork child 要保留继承种子在初始任务与返回指引之前，不添加 child-only 请求头或不同工具 schema；测试只断言组装请求头输入相等，不声称 provider 缓存复用。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-02-fs-per-session-cwd.md:1-40@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-15-agent-initiator-scope.md:1-65@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-fork-children-stay-one-shot.md:1-43@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-13-session-working-directory.md:1-47@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-02-fs-per-session-cwd.md:1-40@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-15-agent-initiator-scope.md:1-65@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-fork-children-stay-one-shot.md:1-43@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-13-session-working-directory.md:1-47@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-team-identity-runtime-context.md:1-31@687f282e

<a id="rationale-architecture-4-single-launcher"></a>
## 21. 单一启动器与显式 profile 挂载

**触发**：多个宿主重复 bootstrap；引入 minimal/basic 配置；打包运行时需要与开发一致；调用方要选择插件集。

**问题与规则**：私有 Node 应用若自行 boot 外部 `cordis.yml`，会重复环境加载、配置所有权、插件解析、关闭、artifact 和测试，并让定制变成全有或全无。源 Note 的决定：runtime executable 打包普通 CLI，使用其正常命令语法；公共 Python 配置是有界集合（`bin/profile/ordered patches/home/cwd/env/provider/model/token/init timeout/turn-shutdown timeouts`），既不暴露完整 Cordis 树，也不接受任意 argv；每次启动必须显式 home，SDK 不发现 `~/.dsh`。所有宿主走一个 launcher，由它拥有环境/配置加载、日志、Home、插件解析、runtime 创建和关闭；base 服务只定义一次，profile 只增加/省略自己声明的内容，继承和产品覆盖在一个点解析。不能宣传或启动 profile 省略的服务；未知/禁止的配置 key 拒绝而不是忽略；只挂载显式 roster，不默认挂整张图；打包运行时必须解析与开发相同的构建模块和配置；省略优于把不可用功能藏在 config 后面。minimal profile 不能是 full profile 的 overlay（那会保留每个 base service，并让排除依赖散落的 filter/disable），而应是版本化 standalone bundle，列出自己的 bundle 并插入完整树。

**前置条件**：有单一 launcher；profile 定义/继承规则；显式 roster；打包运行时；配置 key 校验。

**操作步骤**：1) 枚举每个入口及其 bootstrap 职责。2) 把 env/config/plugin 解析移入 launcher。3) 定义 profile roster 和继承，只挂声明模块。4) 校验配置 key，拒绝未知/禁止项。5) minimal profile 用 standalone bundle，不用 overlay 排除。6) 测试 dev/desktop/CLI 一致、打包启动、省略服务确实不存在。

**角色/完成信号**：launcher owner 拥有启动；profile owner 声明 roster；runtime 只挂该 roster。完成信号是所有宿主启动路径一致；minimal profile 不加载未声明服务；未知 key 使启动失败。

**失败处理/例外**：打包/产品 launcher 未在本提取中检查；两条声明来源 Note 的头部均为 Status: implemented 并 Archived: 2026-09-04，不是提案，其 installed-wheel/发布义务在本提取中仍未验证。失败启动不得留下“部分挂载但声称 ready”的状态。profile 可以继承 base，但必须显式声明，而不是靠隐藏 filter。

**证据边界**：源 Note 为 archived 设计/实现记录；本提取未启动任何宿主或打包产物。

**尾部补充**：standalone 极简 profile 只随其所属组合包或受信任的上层 patch 扩大而变化；不要用 overlay 过滤完整 profile 来获得极简，接受一棵较小完整树的刻意重复，并明确省略的共享 settings、凭据、策略、遥测与 Web 能力。不要恢复 Python 自有的 cordis 参数或环境选择的完整配置、第二个极简启动插件，或从运行时闭包移除 Web 包的打包分叉；应用由 profile 选择隔离，两种选择仍共用一个 launcher、一套 profile 词汇与一个打包运行时。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-23-python-sdk-dsh-profile-runtime.md:1-56@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-24-standalone-sdk-minimal-profile.md:1-58@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-23-python-sdk-dsh-profile-runtime.md:1-56@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-24-standalone-sdk-minimal-profile.md:1-58@687f282e

<a id="rationale-architecture-4-registry-safety"></a>
## 22. Registry 解析与依赖混淆防护

**触发**：安装/升级依赖；默认 registry 不可达；配置私有 fallback；安装失败需要归因。

**问题与规则**：安装对话框直接把 spec 交给 pnpm，没有自己的 registry，导致默认不可达时长时间重试且没有 mirror。源 Note 的做法：manager 请求“registry plan”，不是单个 registry：`registry`（首个；null 表示 pnpm 配置的）加 `fallbackRegistries`（默认 npmmirror）；`registryPlan` 先 requested，否则 configured first，再其余。请求的 registry 不在集合内时单独询问；私有 registry 永不回退到公共 registry，因为同名包会装成别人的包。比较用 pnpm 形式（小写 host、尾斜杠）。pnpm 自己的 registry 只有在实际读为 public 后才算 public：每次 plan 前读 `pnpm config get registry`。安装从当前 alive 的 registry 开始；失败尝试之间恢复被改文件；只有该 registry 能改变结果时才把失败归因于它（缺包/认证），连接/上游错误不是 registry verdict；有界 liveness 检查，不无限挂起；记住用户选择并显示每个包解析自哪个 registry。

**前置条件**：能读取 package manager 的真实 registry 配置；有 registry plan；有失败归因和有界超时；有文件恢复。

**操作步骤**：1) 读取实际 registry，映射名字所有权。2) 生成 plan，私有名字 fail closed。3) 有界检查 liveness，从 alive registry 开始。4) 失败后先恢复文件再重试；正确归因。5) 显示解析来源并记住选择。6) 测试不可达、私有/公共同名、认证失败、连接错误、重试。

**角色/完成信号**：package manager 是 registry 事实源；plugin manager 生成 plan/归因；用户选择被记住。完成信号是每个包解析自预期 registry；不可达/歧义时停止而不是回退公共源；失败尝试不留脏文件。

**失败处理/例外**：不进行网络/安装验证；package-manager 内部行为属于外部。公共 registry 只有在读为 public 后才能作为 fallback；私有 registry 的公共回退是明确禁止的。安装失败不是“registry 坏了”的同义词。

**证据边界**：源 Note 为 implemented 记录；本提取未执行安装、网络或 registry 查询。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-18-plugin-install-registries.md:1-45@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-18-plugin-install-registries.md:1-45@687f282e

<a id="rationale-architecture-4-generation-swap"></a>
## 23. 不可变代际与缓存发布边界

**触发**：运行时要拾取插件/配置变化而不重启；缓存/解析器 memoize 模块或配置；构建/部署完成但依赖未刷新；热更新需要判断是否保留身份。

**问题与规则**：只在启动时解析插件会迫使任何变化都重启；朴素 reload 会改半张图、混合配置/模块缓存、留下旧模块和依赖者。源 Note 的规则：profile startup 计算一个不可变 `RuntimeResolution`，安装进 Node ESM 和 CommonJS resolver；runtime 是唯一后端（没有 mode selector/disk materializer）；`PluginPackages.replace()` 通过一次引用替换发布完整 successor。计算并验证完整 successor 后才发布；验证失败保留当前代际。解析模块、配置和依赖按代际键控，旧缓存不能回答新代际。保留身份需要有意的重启/服务关闭，不是隐式 cache-miss。磁盘/构建成功与 live publication 是分开的点；在真实发布点失效依赖，而不是 mere write。配置缓存与模块缓存分别失效；一个失效不意味着另一个。失效锚点用真实 source path、模块身份、配置文件；宁可漏一次失效也不要 stale reuse。旧代际拥有的 cache 要替换/失效；Worker 继承代际边界；保留的 link target 要重新验证。GUI install 后要实际发布新代际，否则私有依赖不可达、已删除名字仍被保留；`package.json` 的 exports/main/imports/format detection 和 JSON module 有独立缓存，清模块缓存不够。

**前置条件**：有代际对象和验证；resolver/cache 可按代际键控；有一个发布点；Worker/保留引用可验证；配置与模块缓存分离。

**操作步骤**：1) 定义 generation 和验证规则。2) 构建完整 successor，不触碰 active 状态。3) 一次 swap 发布，停旧行。4) 在发布点失效 generation-scoped cache。5) 分别处理 config/module invalidation；Worker 继承代际。6) 测试废弃 build、混合更新、Worker、保留 link、GUI install。

**角色/完成信号**：runtime 拥有 active generation；resolver 返回代际值；cache 不得跨代。完成信号是变化只通过一个已发布代际可见；失败 build/swap 让旧代际继续完整服务；旧 target 重新验证或重启。

**失败处理/例外**：依赖 Node/source 内部；未运行真实 Worker/HMR。不要用共享 symlink/profile link/proxy package 桥接 profile 外依赖：它们跨进程持久化选择、需要协调/锁、暴露生成 manifest 且不能原子变化。

**证据边界**：源 Note 为 implemented 记录；本提取未构建 Worker、HMR 或真实依赖图。

**尾部补充**：解析器不创建 fallback 软链接或代理包；runtime resolution 条目占据 profile `node_modules` 上各自的包名位置，保留原生祖先顺序与逐位置 peer 映射，installation 作用域目录不参与 linked 拦截。路由面保持窄且确定：忽略 builtin、相对/绝对路径、URL、profiles 与注册 linked root 之外的 parent，以及带显式 `paths` 的 CommonJS 请求；self-reference 保留原 parent，旧式子路径是否继续探测交给原生 CJS 探测。generation 构造属于启动或更新工作，不属于 resolve 热路径；热路径只有 scope 分类、bare name 提取、本地优先判断、Map 查询和一次原生解析。进程只保留一个 package identity：解析表换代无法使存活模块实例和对象引用失效，因此保留身份需要重启，移除 profile 记录或 linked root 不等于卸载模块。每个自有 Worker 要尽早执行自包含 bootstrap，不提供纯磁盘后端或 dual 对比模式。保留身份的允许/拒绝矩阵：profile-scope 映射与本地包名可移除，保留 installation 条目的目录、版本与 declaring anchor 不得变化；移动映射只能通过卸载再安装；profile 条目可以改变 declaring anchor。名称与 base URL 相同的 entry 要保留全部已加载命名空间，未初始化 entry 不能抹去其他 entry 的命名空间，已加载 URL 仍是重载单位。配置专用 manifest 与模块缓存一起在 HMR 失效，JSON 模块走普通依赖重载；无 HMR 或待生效的启动 bundle 停用时，后续发布延迟到重启并保留运行中插件映射；销毁 HMR 会恢复原生 reader 的旧缓存。重组合时先停止新一代不再列出的行（此时包仍被映射），再恰好发布一次；纯数据 resolution 不能刷新。依赖 Node internal 接口，Node 升级必须重跑兼容测试。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-30-profile-package-refresh-and-manifest-invalidation.md:1-117@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-profile-resolution-generations.md:1-155@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-profile-resolution-generations.md:1-155@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-30-profile-package-refresh-and-manifest-invalidation.md:1-117@687f282e

<a id="rationale-architecture-4-staged-migration-contract"></a>
## 24. 分阶段迁移契约

**触发**：大型重构跨越多个迭代；旧/新 API 并存；不同调用点适用不同阶段规则。

**问题与规则**：迁移期最大的风险不是“没改完”，而是贡献者不知道当前阶段允许改什么、哪些兼容层可以留、哪些是已发布行为。源 Note 的提案：固定一个心智模型（通过 `SessionService` 获取 `LogicalSession`，使用其成员；只有 provider/composition 知道物理实现），然后给阶段表（当前 master、Stage 1 后、后续阶段）列出 target state、允许的变更、禁止的变更。每个阶段只做“行为保持”或一个命名变更；不把无关改动打包。兼容路径只在有真实消费者时存在，并写明移除条件；没有消费者/移除条件的 alias 视为永久债务。用可开关的 warn→enforce 门禁：先对现有违规告警，修完后对新代码强制，最后删除 warn 模式。FAQ 把每个问题路由到规范所有者，不复制规则；贡献者阅读顺序是 overview、protocols、current-stage、stage table。`LogicalSession` 的命名是迁移期临时方案：`Session` 被具体类占用，最终改名推迟到兼容移除，不是前置条件；`Logical` 强调 identity/events/surface/append 与物理 storing/listing/publishing 的分离，使 storage/query 可以在没有 live logical session 时处理 durable record。

**前置条件**：有当前/目标状态；阶段表；真实消费者清单；warn/enforce 门禁；规范 owner。

**操作步骤**：1) 先写 overview、每个应用类型的协议、私有 provider 协议、当前阶段和阶段表。2) 每个阶段只允许一个命名变更或行为保持。3) 兼容层写消费者和移除条件。4) 加 warn 门禁，修完现有违规后对新代码 enforce。5) 用契约测试和阶段一致性检查。6) 在 FAQ 中把问题路由到 owner，避免规则复制。

**角色/完成信号**：迁移 owner 维护阶段表/协议；贡献者按阶段改；CI 执行门禁；reviewer 路由争议。完成信号是任一贡献者能说出目标 API、当前阶段、本阶段唯一允许变更；无消费者/无移除条件的 alias 被拒绝；回滚阶段同时移除新路径。

**失败处理/例外**：多数 Note 是 proposal/plan，不是已实现阶段；阶段状态可能漂移，必须从当前仓库重新核对。兼容层可以暂时存在，但不能没有消费者或移除条件。不要为了“看起来统一”而提前改 durable 词汇。

**证据边界**：源 Note 为 proposed；本提取未执行迁移、门禁或阶段检查。

**尾部补充**：门禁默认 `warn` 时打印警告、写 CI annotation、以 0 退出，使迁移中的分支可以合并；`enforce` 模式对任何发现失败，签入默认在无进行中分支后切到 `enforce`。阶段 1 完成条件包括生产代码只用公开逻辑会话接口、deprecated 入口只有兼容测试、访问门禁没有迁移允许列表、生成文档已更新、快照与 SDK 输出不变。每个阶段必须有一个所有权结果、明确兼容限制、针对性特征化测试与可独立回退的提交边界，并在同一 PR 更新所属 Note、子系统参考、包文档、生成目录与双语对侧。非目标要显式写出（格式、协议值、SDK 输出、模型可见历史），迁移不能夹带行为变化；契约测试覆盖新鲜度、关闭持久性、迁移预备与跨进程所有权。handoff 记录 current、target、gap、下一删除条件与准确 branch/commit；一次只迁移一个有明确调用方的路径，生命周期/格式/失败顺序变化独立成阶段。依赖门检查普通插件不导入具体 provider；兼容入口有覆盖、已命名旧消费方与删除条件。薄抽象不能隐藏生命周期缺口：替代实现要等服务拥有发布与挂接后才能参与，同步 disposer 不得启动无人等待的异步关闭。每个阶段更新总览状态时必须复查 FAQ，实现事实以当前 branch 类型、测试与子系统文档为准。

**来源**：`deepseek-harness/.agents/notes/proposed/architecture/2026-09-06-logical-session-storage-rebuild.md:1-174@687f282e`；`deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-developer-transition.md:1-101@687f282e`；`deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-refactor-faq.md:1-63@687f282e`。

来源：deepseek-harness/.agents/notes/proposed/architecture/2026-09-06-logical-session-storage-rebuild.md:1-174@687f282e
来源：deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-developer-transition.md:1-101@687f282e
来源：deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-refactor-faq.md:1-63@687f282e

<a id="rationale-architecture-4-cancellation-propagation"></a>
## 25. 异步能力缝的必需取消信号

**触发**：工具的异步能力调用接受可选 `AbortSignal`；工作代表可能取消的调用方；所有权在调用中被移交。

**问题与规则**：工具 registry 已让 `exec.signal` 在每个工具体内必需，但许多可从工具体到达的异步能力接口仍接受可选 signal；工具可以满足自己的类型，却在下一个同进程调用丢掉取消。缺口沿 fs/web/bash/composite 工具传递。要求“所有地方”都必需会过度扩张：非工具可达、同步查询、故意 detach 的工作不应被纳入。源 Note 的提案：对“从工具体可达、工具拥有/等待、异步同进程”的能力操作要求 `AbortSignal` 必需；从 `ToolDefinition.execute` 盘点真实范围；每个派生 signal 链接父 signal，保证传递；不得提供 never-abort 默认，也不得读 ambient async-local signal；运行时 dispatch 不重复验证取消（seam 已要求）；排除同步工作和已 handoff 的工作，并命名 handoff commit point；handoff 必须在一个点显式转移取消所有权。机械地“传一个 signal”不等于正确链接。

**前置条件**：有工具执行契约；能盘点可达异步调用；有派生 signal 链接；有 handoff 边界。

**操作步骤**：1) 从 `ToolDefinition.execute` 盘点范围和排除项。2) 把 seam 改为必需参数。3) 每个派生 signal 链接父 signal。4) 加编译失败测试（省略 signal 不通过）。5) 集成测试 abort 后所有后代工作静默。6) 命名 handoff 点，之后取消不再声称可达。

**角色/完成信号**：工具作者改调用点；能力 owner 传播；reviewer 检查 handoff。完成信号是省略 signal 编译失败；abort 到达所有后代；handoff 后的工作有明确新 owner；同步/非可达调用不被误改。

**失败处理/例外**：提案状态，未执行 compile-fail/集成测试；不要用 never-abort 默认或 ambient signal 绕过。机械合规（传 signal）不等于正确传播；要检查链接和 handoff。

**证据边界**：源 Note 为 proposed；本提取未编译或运行取消传播测试。

**来源**：`deepseek-harness/.agents/notes/proposed/architecture/2026-07-19-required-cancellation-through-tool-capability-seams.md:1-65@687f282e`。

来源：deepseek-harness/.agents/notes/proposed/architecture/2026-07-19-required-cancellation-through-tool-capability-seams.md:1-65@687f282e

<a id="rationale-architecture-4-cleanup-dependency-lifetimes"></a>
## 26. 依赖资源的消费者优先释放

**触发**：provider 在消费者仍需要时被替换/关闭；消费者的 cleanup 依赖 provider 的 storage/取消；scope teardown 触发 shutdown。

**问题与规则**：一个 disposer 可以等待它的消费者，而兄弟 disposer 已经移除了消费者 cleanup 所需的 listener/资源；因此“等待 provider 的最终 disposal promise”不保证资源还活着。影响 shutdown 和插件替换，包括最终 Session 事件、已接受的 reminder 投递、credential commit、远程进程终止。Cordis 并发启动兄弟 disposer；service withdrawal 只在自己的 disposer 内等待；event subscription 是独立拥有的 effect。源 Note 的提案：按依赖顺序释放——停止新 admission，结算已接受工作和最终发布，再 drain/release provider 资源；provider 不得释放消费者 cleanup 仍要用的资源；用真实 disposer 组合，而不是注释声明顺序；每个阶段保留取消和错误报告，不吞 cleanup failure；用 controlled promise 复现回归；标注证据类（test/source trace/observed）；扫描同类 scope，找相同 bug。

**前置条件**：能映射 consumer→provider 资源依赖；有可组合 disposer；shutdown 由 scope 拥有；能记录证据类。

**操作步骤**：1) 映射依赖和 shutdown 触发。2) 停止 admission，等待消费者结算。3) 再 drain/release provider。4) 用 disposer 组合表达顺序，保留错误/取消。5) 用 controlled promise 做回归。6) 扫描其他 scope，避免只修一个。

**角色/完成信号**：依赖 owner 定义顺序；scope 组合 disposer；测试验证行为。完成信号是消费者能在 shutdown 开始后完成 cleanup，然后 provider 才释放；反向释放或吞错被视为缺陷；失败 cleanup 可观察且不困住依赖资源。

**失败处理/例外**：proposal/部分 source-traced；未执行 shutdown/插件替换。不要用“await 最终 promise”替代资源生存证明。provider 可以比消费者活得久，但不能反过来。

**证据边界**：源 Note 为 proposed；本提取未运行进程关闭或插件替换。

**尾部补充**：区分新准入与已接受工作：dispose 期间拒绝新准入，但排空已准入的提交或操作，不能取消它；凭据 provider 要排空已接受且排队中的提交，同时拒绝新准入。监听器与 effect 所有权跟随实际调用方上下文；只把清理移进 provider 对象而不转移 effect 所有权，竞态仍然存在。受控 promise 回归要在真实消费者最后一次使用依赖前暂停，启动 provider/外层释放，放行暂停，再等待操作与释放都完成；即使测试失败也必须释放暂停，并保留已有外部操作时限策略。验收要比较实时与恢复后的历史并检查实际最终后缀（包括工具结果和结束事件），不能只看 `close()` 被调用；SSH 通过真实 helper 验证远程停稳，Windows sandbox 保留临时权限与目录直到延迟终止和最终写入完成。不要隐藏清理失败或静默丢弃最终写入；延长 provider 存活会增加关闭延迟，错误组合依赖可能死锁。

**来源**：`deepseek-harness/.agents/notes/proposed/architecture/2026-10-09-cordis-cleanup-dependency-lifetimes.md:1-93@687f282e`。

来源：deepseek-harness/.agents/notes/proposed/architecture/2026-10-09-cordis-cleanup-dependency-lifetimes.md:1-93@687f282e

<a id="rationale-architecture-4-semantic-phases"></a>
## 27. 单槽位选举先用语义阶段

**触发**：一个 slot 只选一个 provider/renderer；条目属于不同语义类；当前只有数字优先级。

**问题与规则**：`conversation.composer` 用一个全局数字优先级排序并选第一个匹配，导致一次性历史显示只读解释，而已有问题/审批仍待回答。源提案让 opted-in chain 声明 domain-owned phase tuple，composer 为 `['interaction','restriction']`：解决已有等待不等于新建子代理后续工作，故 interaction 先于 restriction；同 phase 内才按 priority、registration order。phased chain 注册缺/未知 phase 立即拒绝；unphased chain 保留原数值行为，不强迫所有链迁移。交互解决、dispose、HMR 或 reconnect 后按当前 props/注册重新 election；所有候选 decline 时仍返回 InputBar fallback，不发明 unresolved required-slot/scanner 错误。phase 词汇由 domain 拥有，不导出通用层级。

**前置条件**：有 slot 选举；能列出语义类；注册时有 phase 字段；解析结果可重算。

**操作步骤**：1) 声明 domain phase tuple 与 interaction-before-restriction 规则。2) 只对 opted-in chain 分类注册，保留 unphased 对照。3) 校验 phase→priority→registration 排序。4) 测试问题/审批胜过只读限制，解决后回到 restriction，all-declined 回 InputBar。5) 测试缺/未知 phase 拒绝，以及 dispose/HMR/reconnect 不保留 stale election。

**角色/完成信号**：slot owner 定义 phases；registrant 声明一个；resolver 确定性排序。完成信号是排序先反映语义类；未声明/未知 phase 注册失败；解析变化不冻结 stale authority。

**失败处理/例外**：proposal；phase 名称可能含糊，未检查 election runtime。没有语义差异的 slot 不应引入 phases；保持单 priority 是允许的。

**证据边界**：源 Note 为 proposed；本提取未运行 slot 或 election 测试。

**来源**：`deepseek-harness/.agents/notes/proposed/architecture/2026-08-08-semantic-composer-chain-phases.md:1-46@687f282e`。

来源：deepseek-harness/.agents/notes/proposed/architecture/2026-08-08-semantic-composer-chain-phases.md:1-46@687f282e

<a id="rationale-architecture-4-enrichment-isolation"></a>
## 28. 展示型增强与模型历史/供应商隔离

**触发**：UI 把用户可见文本发到外部模型做翻译/解释；会话 provider 与增强 provider 不同；付费能力需要 manifest 披露。

**问题与规则**：翻译需要外部请求，但如果共享主 provider 凭据或改写会话，译文可能成为模型输入、持久历史或跨 provider 泄漏。源 Note 的规则：translator 有独立 owner，与 conversation/model adapter 分开；显式选择 provider 路由和默认，不静默切换；原文保持权威，译文仅用于显示，不替换模型历史、不作为用户消息持久化、默认不作为模型输入；付费资格记录在 manifest。发送前记录精确的 model-visible input，以便证明后续输入可忽略；先查 cache 再 admission；surface 折叠、settings 不兼容变化、plugin unload 时 abort in-flight。匿名路径可用 Google/Bing 显式路由和有界网络请求；付费路径只允许 active built-in `deepseek-account`/`deepseek-official` owner + 已配置凭据 + 精确 `deepseek-flash` catalog ID；display name/version 不参与，pi-ai route 排除；每个 fragment 一次新的 text-only query。Service Definition 与两个 provider 可同包，因为当前消费者用同一 operation/lifetime；不要为了“未来”提前拆。只对展开的正文启动翻译；折叠、切换选择、卸载或 settings 不兼容变化都中止在途工作，并丢弃迟到结果。

**前置条件**：translator 与 conversation adapter 分离；显式路由/默认；显示型 result 不进入历史；有 manifest 披露；有 admission/cancel。

**操作步骤**：1) 分离增强 owner 和会话 adapter。2) 解析路由/默认，显式 opt-in。3) 强制 display-only、非持久、非模型输入。4) 记录 model-visible input，cache 先于 admission。5) 在折叠/settings/unload 时 abort。6) 测试译文进入历史、静默切换 provider、付费资格、取消竞态。

**角色/完成信号**：translator 拥有增强；host 拥有 admission；conversation adapter 不隐式增强。完成信号是模型只看到原文历史；译文仅显示；付费能力有 manifest/资格；取消后无 stale 显示或历史变更。

**失败处理/例外**：外部 endpoint 可用性、费用、质量未运行；provider 名称属于原产品。付费翻译是匿名路径的显式替代，不是默认。不要复用对话请求（会继承 history/generation controls），也不要路由到任意已配置模型（会隐藏 billing/receiver）。

**证据边界**：源 Note 为 implemented 记录；本提取未发起外部请求、未验证 admission 或计费。

**来源**：`deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-anonymous-reasoning-translation.md:1-31@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-paid-native-flash-reasoning-translation.md:1-27@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-anonymous-reasoning-translation.md:1-31@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-paid-native-flash-reasoning-translation.md:1-27@687f282e

<a id="rationale-architecture-4-fidelity-shims"></a>
## 29. 平台 shim 不得伪造行为或不变量

**触发**：为 Worker/替代运行时替换平台 API；模块解析提供不同实现；平台专属服务要在缺失平台上运行。

**问题与规则**：替换平台 API 可能提供真实平台从未提供的隐藏不变量，或漏掉消费者依赖的语义，而测试只看到“能跑”。源 Note 的规则：让同一份 web profile 配置逐字节通过两个运行时，不 fork 配置、不静默 fallback；缺失平台行为在模块解析层替换，放在显式 seam 后；proxy table 只覆盖 Node builtins 和外部 npm 包，绝不覆盖 workspace/vendored 模块；已实现模块保持真实语义，mock 静默挂载并在调用时报告缺失能力（结构性 stub 会宣传一个每次调用都失败的工具）；覆盖不到的操作显式失败，不伪造平台保证；加 fidelity 测试比较行为，而不只是“没崩”。文件系统仿真还必须给每个路径独立身份（重建路径得到新身份）和严格递增的 mtime，否则同毫秒写入会让依赖它们的 stale-write 守卫误判。

**前置条件**：列出真实需要的平台特性和包；有模块解析 seam；有双运行时配置；有覆盖/未覆盖清单。

**操作步骤**：1) 盘点平台特性/包。2) 在模块解析层实现最小 proxy。3) 同一配置分别跑两个运行时并比较行为。4) 对未覆盖操作显式失败。5) 记录未覆盖语义；测试 stub 调用时报告。6) 删除静默 mock。

**角色/完成信号**：adapter owner 维护 shim/覆盖表；runtime owner 决定加载哪个实现；消费者不得探测替代品。完成信号是覆盖操作行为一致；未覆盖操作失败而非伪造；失败 shim 不改变配置。

**失败处理/例外**：源 Note 只有设计记录，未构建 shim 或运行跨运行时比较。不要 proxy workspace/vendored 模块；不要把“结构性 stub”当成可用实现。

**证据边界**：源 Note 为 archived 设计；本提取未执行模块解析或双运行时对比。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-20-webworker-node-face.md:1-36@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-20-webworker-node-face.md:1-36@687f282e

<a id="rationale-architecture-4-branded-ids"></a>
## 30. 包边界上的品牌 ID

**触发**：标识符跨包；多个 ID 共享原始形状；公共 API 接受 ID。

**问题与规则**：同一概念的 ID 跨包以普通字符串传递会混淆；给所有字符串都加 brand 又会让代码库难用并耦合无关包。源 Note 的规则：只 brand 真正跨包且可能混淆的 ID；brand 放在拥有该 ID 语义的包；把 brand 传播到 Map key 和公共方法参数；构造只在 owner 处；消费者接收并携带；强转只允许在来源已证明处，不能当日常转换。通用 executor seam 需要不透明 token 时，mint 一个独立的 `OwnerToken` brand，而不是 import `SessionId`。`brandString` 返回输入不变，因此不改变 wire/serialization。

**前置条件**：能识别跨包 ID；有 owning package；TypeScript 品牌类型/编译检查。

**操作步骤**：1) 列出跨包 ID 和可能混淆的对象。2) 在 owner 包定义 brand。3) 更新公共签名和 Map key。4) 构造收口到 owner，消费者不得自 mint。5) 审查每个强转的来源。6) 用编译错误测试错误 ID。

**角色/完成信号**：owner 包定义 brand；消费者传播；reviewer 审查 cast。完成信号是原始字符串不能用于 branded 位置；错误 ID 在编译期报错；序列化行为不变。

**失败处理/例外**：type-only，无运行时保护（序列化、反射、外部输入）；不要把本地字符串也 brand。具体 overload/命名属于原产品。

**证据边界**：源 Note 为 archived 设计；本提取未重新编译或运行运行时校验。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-06-20-branded-ids.md:1-66@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-20-branded-ids.md:1-66@687f282e

<a id="rationale-architecture-4-generic-task-runtime"></a>
## 31. 长任务使用统一通用运行时

**触发**：工具启动后台工作；多个 producer 共享长生命周期需求；输出需要授权/有界读取。

**问题与规则**：多个长任务 producer 各自重建 task id、授权、输出读取、取消、等待、监听隔离和清理，会产生行为漂移；在验证输入前就启动副作用，会让后续校验失败时留下半成品。源 Note 的规则：一个 jobs runtime 拥有 task id、授权、输出读取、取消、等待、监听通知和清理；producer 只提供能力钩子，不重实现生命周期控制器。所有可失败校验/边界输入在 `run()` 前 preflight，且 `run()` 只调用一次；不得产生无法收集的 start。有界 admission：`maxConcurrentJobsPerOwner` 默认 10，按精确 Agent 计数，另有一个 unowned bucket；拒绝发生在 run 前和 id 分配前；stopping 保持容量直到进程结束。所有权只转移一次：runtime 拒绝时 producer 仍拥有清理。读取/wait/cancel/list 有授权检查和边界；listener 隔离，一个失败不影响通知。shutdown cancel 与 user cancel 区分；cleanup 幂等。通用 runtime 应在 owning layer 作为可复用库/服务，不是 feature-specific copy。

**前置条件**：有 producer 钩子契约；preflight 可列出所有可失败输入；有授权/边界读取；有幂等清理。

**操作步骤**：1) 盘点重复生命周期职责。2) 提取一个 runtime + producer hooks。3) 把 preflight 放在任何 effect/id 分配之前。4) 启动后一次性转移所有权。5) 实现授权读取/取消/等待/监听隔离。6) 用多 producer、拒绝、listener 失败、重复取消测试。

**角色/完成信号**：runtime 拥有生命周期；producer 拥有钩子/内容；只有 runtime mint/store task id。完成信号是所有长任务共享一个生命周期；preflight 失败不创建 task；拒绝 start 时 producer 仍能清理；listener 失败不丢 task。

**失败处理/例外**：源 Note 的通用 runtime 后来被 jobs seam consolidation 部分调整；迁移以当前所有权为准，不照搬中间 API。不要用 feature-specific copy 绕过 runtime；shutdown 与 user cancel 不能混为一个原因。

**证据边界**：源 Note 为 archived 设计；本提取未运行 runtime 或 producer。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-06-20-generic-long-running-tool-runtime.md:1-139@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-20-generic-long-running-tool-runtime.md:1-139@687f282e

<a id="rationale-architecture-4-output-retention-library"></a>
## 32. 输出保留作为纯小库

**触发**：工具输出可能很大；需要截断策略；多个工具各自实现保留。

**问题与规则**：每个截断工具重实现保留会混淆 item-count 与 text-byte。来源记录已交付纯小库 `ItemRetainer`/`TextRetainer` 与中立 notice helpers，不依赖 Cordis/工具；业务语义仍由工具拥有。item 支持 head，text 支持 head/tail/headTail 与 UTF-8-safe byte 边界；`truncated` 只表示预算省略，不能吞并上游 incomplete/permission/provider/binary/UTF-8 状态。该历史变更为 glob、grep、bash、web_fetch、web_search 记录迁移映射，但明确不是所有工具都已迁移；不能声明每个工具输出已经共享 retainer。`read` 的 offset/limit、totalLines、范围错误与行预览/窗口字节上限是专门分页契约，刻意不进入通用库。

**前置条件**：知道本次 consumer 的资源模式与显式边界；有纯 retainer 库和 tool-owned 输出契约；能区分预算省略与上游不完整/错误。

**操作步骤**：1) 明确本次实际要迁移的 consumer 与资源模式。2) 选 item/text 及显式边界。3) 只替换该 consumer 的本地 retention。4) 保留 domain failure/incomplete 字段。5) 同步 consumer README/tests，证明 model-facing 文本除有意 notice 文案外不变。6) 检查 omission、UTF-8、零预算与 head/tail 边界，不把 read 分页强塞进单一 Omitted。

**角色/完成信号**：库 owner 负责算法与 notice 元数据，工具 owner 负责含义和独立迁移。库的模式/边界测试与每个已迁移 consumer 的输出等价证据分开；记录映射或库已交付都不证明所有 consumer 完成迁移。

**失败处理/例外**：`read` 分页刻意排除；windows/grouped/sort-aware budgets 与 upstream-stop control 等第二个真实 consumer 证明需要后再扩充。文本库按 bytes 限额，line/character preview 属于工具；不能把 provider 不完整误标为预算 truncated。

**证据边界**：上述是 archived Note 对该变更交付与未完成迁移的区分；本次未核对固定提交全部 consumer 实现或执行目标截断测试，不能把历史映射当当前全量采用保证。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-06-tool-result-retention-library.md:1-158@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-06-tool-result-retention-library.md:1-158@687f282e

<a id="rationale-architecture-4-localization-rollout"></a>
## 33. 本地化作为类型化座位与惰性标签

**触发**：UI 字符串要显示；locale 运行时可切换；标签要注册进菜单/命令模型。

**问题与规则**：急切注册本地化标签会在 locale 变化时造成大范围重注册风暴；标签定义在 canonical 字典之外会漂移；部分 rollout 会留下混合语言 UI。源 Note 的规则：注册时使用 label thunk，通过 `resolveSlotLabel` 和 revision-following 读取点在读取时解析；不要把标签急解析或复制进 service registration。组件文案走类型化 `t` seat；深层子组件把 `t` 当 prop，使零 Cordis atom 保持运行时独立，遗漏时 typecheck 失败。字典 canon：zh record 是 key 来源，en 满足 `Record`；每个可翻译 seat 有 typed key；缺 key/错名是编译错误；在渲染/读取处解析，不在模块初始化；按 surface 完整 rollout，半本地化 surface 视为未完成；不得硬编码用户可见文案。内置 locale 集合保持封闭；外部语言通过 `addLanguage` 注册并声明 fallback 链，链必须终止于 `en`，未知目标或循环在注册时失败。查找先按请求 namespace 沿链走一遍，再在 `common` 重复同一条链，最后回显 key。

**前置条件**：有 typed seat/key；canonical 字典；locale hook；读取时解析点。

**操作步骤**：1) 定义 seat 和 typed key。2) 提供 label thunk。3) 在 canonical 字典加条目。4) 读取时解析并测试 locale 切换。5) 完成整个 surface，不留硬编码。6) 用类型检查缺 key/硬编码。

**角色/完成信号**：locale owner 拥有字典；seat owner 提供 thunk；renderer 解析。完成信号是切 locale 时标签更新且不重注册 service；缺 key 编译失败；半 rollout 明确未完成。

**失败处理/例外**：源 Note 为 archived 设计；未盘点现有 locale 包/格式/rollout 状态，未运行 UI 测试。不要为了“统一”把所有字符串塞进一个 seat；零 Cordis atom 通过 prop 接收 `t`，不 import runtime。

**证据边界**：源 Note 为 archived 设计；本提取未执行类型检查或 UI 切换。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-07-30-client-locale-full-rollout.md:1-43@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-30-client-locale-full-rollout.md:1-43@687f282e

<a id="rationale-architecture-4-policy-event-gate"></a>
## 34. 可选文件策略插件的 intent 事件门与观察记录

**触发**：文件工具要直接使用 I/O provider；部署选择启用 prior-observation/freshness 规则；需要把 intent 决策、原子 mutation 与观察记录分清。

**问题与规则**：来源移除强制 `fileContext` 方法服务：工具直接用 `ctx.fs` 解析/读/写，并在 mutation 前发 `fs/write-intent` 或 `fs/edit-intent`，以 `fs/observed` 记录观察。可选 policy plugin 无 service API、零 I/O，只选 guarded `expected`/拒绝；provider 在原子 mutation 临界区执行 CAS，避免 policy-side stat 的 TOCTOU。shipped guarded 配置预期挂载该插件，但服务边界支持裸 provider：无 listener 时 expected 为 undefined，read/create/overwrite/unread edit 仍可用且原子，无 read-first/version guard。intent 是 first-wins 单槽 waterfall，后注册 decider 被短路；policy 占该槽是部署约定，不是事件强制不变量，更早注册的另一个 decider 可以绕过。观察是 notification-only，不是追溯授权或基本工具可用性的前提。

**前置条件**：provider 支持原子 mutation 与可选 expected/CAS；fs contract 定义 intent/observation；部署明确是否挂 policy、谁先占槽，以及 bare-floor 对照。

**操作步骤**：1) 分离 executor I/O、policy observed-state/CAS basis 与 provider 临界区。2) guarded 部署挂 policy 并验证先注册关系。3) mutation 前 intent、完成后 observation。4) 分别实测 guarded unread/stale 拒绝与 bare unread create/overwrite/edit 成功。5) 记录 earlier-decider 可绕过的部署限制；要 layered freshness policy 必须另做设计，不静默添加第二个 listener。

**角色/完成信号**：executor 直接执行；policy 只决定 guarded basis；provider 保持原子性。完成信号是 guarded 未观察 edit 返回 `FS_NOT_OBSERVED`、stale mutation 被 CAS 拒绝，同时 no-policy 组合仍可启动并允许无 freshness guard 的 mutation；不宣称插件不可省略或槽位唯一所有权由事件系统强制。

**失败处理/例外**：无 policy 的裸 provider 有意无 freshness 约束，但不是 shipped guarded 配置的常态。拒绝不能产生伪 observation；policy 不做 stat；stale→missing reread→guarded recreation 是明确恢复路径。观察记录不能变成授权或强制 method service；此来源不是所有工具的 blanket authorization 规则。

**证据边界**：源 Note 为 archived 设计；未执行事件/拒绝测试。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-06-26-file-context-as-event-gate.md:1-174@687f282e`。

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-26-file-context-as-event-gate.md:1-174@687f282e

<a id="rationale-architecture-4-capability-opt-in"></a>
## 35. 昂贵能力默认关闭与精确读取保留

**触发**：能力有便宜精确模式与昂贵派生模式；能力作为 required injection；部署对派生模式需求不同。

**问题与规则**：派生全文索引默认开启会消耗资源；为了让消费者读取而卸载 provider 不可行，因为 API gateway 把 `sessionQuery` 声明为 required injection，精确读取（export lineage、fork workspace、titles）依赖它。源 Note 的做法：把昂贵模式在 owner 处默认关闭，显式启用；保留 service 的 required injection，但 provider 可以禁用派生索引而不移除 service；精确读取在索引关闭时仍可用，缺失精确读取是硬失败而不是空结果；派生索引可重建，其缺失只降级派生功能；安全默认 + 文档化启用路径。实现上 provider 增加第三个 opening phase `openAt:'never'`：search 方法在任何请求规范化之前就以 typed `SESSION_QUERY_SEARCH_DISABLED` 失败。

**前置条件**：能拆分 exact/derived 行为；service 是 required；派生索引可重建；有配置默认和 typed 错误。

**操作步骤**：1) 拆分 exact 与 derived。2) 派生默认 off，启用显式。3) 保留 service 注入，但允许派生关闭。4) exact 缺失硬失败；derived 缺失只降级。5) 加配置默认/测试 exact-off。6) 记录省略 vs 禁用。

**角色/完成信号**：owner 设默认；deployment 显式 opt-in；consumer 不从注入推断可用性。完成信号是默认部署不建索引；exact 读取仍工作；search 在 disabled 时返回 typed 错误；重新启用可重建。

**失败处理/例外**：源 Note 为 archived 设计；未检查实现/config key/provider 生命周期。不要通过卸载 provider 来关闭派生模式；不要用空结果伪装 disabled。

**证据边界**：源 Note 为 archived 设计；本提取未运行索引、配置或 search。

**来源**：`deepseek-harness/.agents/notes/archived/architecture/2026-08-13-session-content-search-opt-in.md:1-33@687f282e`。

## 迁移验收清单

1. **所有权**：每个机制能回答“谁拥有状态、谁提供默认、谁执行、谁清理”。没有两个 owner 同时写同一事实。
2. **边界**：依赖、配置、凭据、权限、执行范围、协议通道都从接收端/owner 推导，不从广告 URL、显示名、到达顺序或全局变量推导。
3. **失败**：必需状态缺失时 fail closed；可重建数据才允许 fail-soft；一个 attempt 一个终态；拒绝/取消不产生副作用。
4. **生命周期**：停止 admission → 结算已接受工作 → 释放依赖资源；dispose 等待 pending 操作；取消后完成的 acquisition 被释放。
5. **身份与版本**：持久日志/公共面/发布 artifact 都有结构版本或不可变 identity；预发布改名不留 alias；durable 词汇走迁移边。
6. **默认值**：昂贵/可选能力默认关闭；空扩展零足迹；省略优于隐藏；配置 key 未知即拒绝。
7. **证据**：每个自动保证都有正向、拒绝、恢复三类计划；本文所有完成信号仍标记为 planned，需由后续实现/采纳者实际执行后才可去掉标记。

**全局证据限制。** 本参考只基于 Note 正文与固定提交，不包含源码、运行时、CI、远程 registry、签名、Electron、真实 OS 权限或生产数据验证。任何“已实现”均指源 Note 的作者记录，不是本提取的独立复现。

---

## 机制→来源补充索引（非完整）

本节补充部分机制的来源坐标，使用固定提交 `687f282e`，不是 `knowledge/` 全部来源的完整索引；完整集合以各小节的来源清单和机制账为准。这里不新增正文断言。

- `rationale-architecture-4-event-taxonomy-ownership`：`deepseek-harness/.agents/notes/implemented/architecture/2026-06-30-event-domain-semantics.md:1-39@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-07-31-goal-owned-durable-events.md:1-33@687f282e`
- `rationale-architecture-4-event-log-integrity`：`deepseek-harness/.agents/notes/archived/architecture/2026-07-15-replay-token-meter-service.md:1-61@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-08-05-large-session-jsonl-restore-pipeline.md:1-53@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-08-08-bounded-session-persistence-write-batching.md:1-60@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-08-10-message-feedback-sidecar.md:1-44@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:1-42@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-09-06-v3-canonical-session-envelopes.md:1-47@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-context-breakdown-system-prompt-state.md:1-36@687f282e`
- `rationale-architecture-4-capability-seam-ownership`：`deepseek-harness/.agents/notes/archived/architecture/2026-07-23-unified-session-query-service.md:1-40@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-07-26-job-registry-seam.md:1-36@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md:1-350@687f282e`
- `rationale-architecture-4-package-layering`：`deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:1-40@687f282e`
- `rationale-architecture-4-config-authority`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-04-draft-provider-endpoint-interrogation.md:1-51@687f282e`
- `rationale-architecture-4-credential-management`：`deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-stored-credential-precedence.md:1-45@687f282e`
- `rationale-architecture-4-privilege-boundaries`：`deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-cua-continuous-hover.md:1-27@687f282e`
- `rationale-architecture-4-execution-containment`：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-bounded-office-conversion.md:1-43@687f282e`
- `rationale-architecture-4-presentation-assembly`：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-09-client-conversation-node-assembly.md:1-429@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-message-node-factories-and-delegates.md:1-54@687f282e`
- `rationale-architecture-4-session-context`：`deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-team-identity-runtime-context.md:1-31@687f282e`

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-13-session-content-search-opt-in.md:1-33@687f282e