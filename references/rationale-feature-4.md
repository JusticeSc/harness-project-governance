# rationale-feature-4：功能决策中可迁移的治理机制参考

> 来源：`deepseek-harness` 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 89 个 feature Note（英文正文与中文对读）。本文是 **source-only 提取**：机制来自已读 Note 正文与说明，迁移做法标注为设计建议；不表示任何自动检查、部署配置或目标项目执行已经发生。 适用方式：先按“何时使用”判断，再读“前置条件”，按“操作步骤”落地，最后用“证据与限制”决定能声称什么。文中锚点与 knowledge JSON 的 `reference` 字段一一对应。

## 阅读约定：源义务 vs 迁移设计

每个机制包含三类信息，采用时必须区分：

1. **源义务**：Note 中实际陈述的约束或实现事实（含已取代/提案的历史状态）。
2. **迁移设计**：为把这些约束带入采用项目而提出的步骤、接口和默认值；这是设计，不是源项目已交付的产品。
3. **验证计划**：知识文件中的 positive/rejection/recovery 场景均标 `planned`；它们说明怎样获得证据，不表示已运行。

来源中 `Status: superseded/archived` 或 `proposed` 的记录只作为历史/设计输入；仅存放在 `archived/` 目录但 Status 为 implemented 的 Note 仍可能描述当前机制，具体以每条 Note 的 Status 与 coverage disposition 为准。不得把 proposal 的验收标准当作已交付保证。

<a id="m1-decision-record-lifecycle"></a>
## m1-decision-record-lifecycle：决策记录生命周期与当前权威链

**何时使用**：新增/修改/取代架构或行为决策；发现旧 Note、旧注释与实现冲突；跨会话交接；一项设计处于 proposed、archived 或部分取代状态。

**前置条件**：决策记录可检索；每条记录有状态字段；取代关系用链接而非口头说明；评审者能访问历史版本。

**负责角色**：决策作者、评审者、后续实现者/会话。

**操作步骤**：
1. 决策作者写记录：问题、决定、被否决方案及理由、后果、验证、限制、适用范围；状态只能是单一值。
2. 需要变更时新增记录并在旧记录顶部写 Superseded-by 链接；部分取代逐项列出“旧条款 → 新所有者”。
3. 后续实现者先沿取代链走到末端，列出仍有效义务；只执行末端未取代条款。
4. 提案保持 `proposed`，验收与风险标“未执行”；不得在实现/发布清单中把它当已交付。
5. 删除失效入口/旧公共接口（见 m19），保留记录作为历史。
6. 评审检查是否存在两个“当前权威”；发现即停止实现，先合并或明确取代。

**完成信号**：每条被引用的事实恰有一个当前所有者；旧记录只作为历史；不存在把提案当运行时保证的引用。

**失败处理与例外**：双当前权威 → 停止并合并；链接失效 → 打开末端记录人工核对，不能只检查链接存在；历史记录不得删除；proposal 可长期存在但不产生义务。

**证据与限制**：状态、链接和当前权威都是文本约定，需评审/检索执行；状态文本不能证明实现存在；链接可能失效；proposal 的缓存/安全论证未经验证。

**源义务**：状态/取代链接、部分取代说明、替代方案与后果、提案不得冒充已交付（来源 Note 的状态行与替代/后果章节）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-08-dsh-run-headless-command.md:1-16@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-25-unified-task-list.md:1-14@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:46-53@687f282e`；`deepseek-harness/.agents/notes/proposed/feature/2026-07-06-recallable-compaction.md:94-110@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-08-dsh-run-headless-command.md:1-16@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-unified-task-list.md:1-14@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:46-53@687f282e 来源：deepseek-harness/.agents/notes/proposed/feature/2026-07-06-recallable-compaction.md:94-110@687f282e

<a id="m2-capability-declaration-gating"></a>
## m2-capability-declaration-gating：逐路由能力声明与显式降级

**何时使用**：接入模型、协议、后端或工具链；同一协议下端点能力不同；某行为只对部分提供方存在；升级上游词汇。

**前置条件**：有路由/适配器目录；配置可校验；日志可记录实际模式；缺省行为已定义。

**负责角色**：适配器作者、配置/部署者、运行时调用准备者。

**操作步骤**：
1. 适配器作者定义能力枚举与“缺省=哪种安全行为”（替换、旧协议、拒绝）。
2. 在路由/模型条目逐项声明能力；用 schema/zod/类型校验，非法值在加载时失败。
3. 运行时在准备实际调用后读取绑定适配器能力，不读取上次请求快照或协议族名称。
4. 把实际模式记入请求上下文/日志；恢复会话时重新绑定，而不是沿用旧快照。
5. 不支持的控制（depthLimit/toolFilter 等）在取得所有权、发布运行、持久化之前失败。
6. 测试：缺省、显式启用、非法值、路由切换、恢复、上游新增能力。

**完成信号**：解析后的调用对象上能看到每个能力；缺省路径有测试；错误可诊断；没有静默混合。

**失败处理与例外**：非法值 → `INVALID_MODEL_INFO`；不支持 → `UNSUPPORTED_CAPABILITY`，且在所有权前；同协议不同实现必须逐路由声明；实验能力可显式 opt-in，但默认关闭。

**证据与限制**：本地声明不能证明远端真实支持；需要真实网关/模型 e2e；名称/协议族不能当能力证据；实验能力在目标环境可能不可用，须有拒绝/回退。

**源义务**：显式逐路由能力、缺省替换、非法值拒绝、实际模式记录、所有权前失败（in-history、messages adapter、pi-ai、subagent 过滤 Note）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-09-02-in-history-system-prompt-replacement.md:15-25@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:16-32@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:62-68@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-02-in-history-system-prompt-replacement.md:15-25@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:16-32@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:62-68@687f282e

<a id="m3-durable-authority-and-process-coordination"></a>
## m3-durable-authority-and-process-coordination：持久日志权威与进程协调

**何时使用**：持久会话/任务/团队/终端与可重建运行时共存；接受与落日志之间有窗口；冷恢复、fork、重连或多进程访问同一存储。

**前置条件**：存在 append-only 或事件日志；可区分持久事实与进程内缓存；恢复入口明确。

**负责角色**：持久化所有者、运行时管理器、宿主/恢复入口。

**操作步骤**：
1. 列出所有必须跨重启的事实，确认它们在日志中有事件；没有的要么补事件，要么明确声明会丢失。
2. 把进程内激活/claim/cache 降级为协调，标注生命周期；重启后自然消失。
3. 冷恢复实现为日志折叠；缺失/损坏记录显式失败或进入恢复流程，不伪造。
4. 旧介质用 schema 默认值升级；新增字段优先纯新增，避免迁移脚本。
5. 明确“inbox 已接受但未落日志”的消息不具重启保证；回执/文档写明，不宣称 exactly-once。
6. 环境相关访问（绝对路径、挂载映射）不进入持久身份或确定性变体。
7. 测试重启、重连、fork、并发接受、日志损坏。

**完成信号**：同一日志折叠出同一状态；重启不依赖旧运行时对象；丢失窗口被显式记录。

**失败处理与例外**：日志损坏/缺失 → 显式失败/恢复；进程状态丢失不等于持久状态丢失；纯瞬态 UI/缓存可不持久化但须说明；跨进程仍需 lease/邮箱，日志权威不提供分布式 exactly-once。

**证据与限制**：flush 布尔/监听器参与不能证明后端已确认；仅接受未落日志的消息可能丢失；记录来源字段不能作为授权。

**源义务**：日志拥有身份/历史/授权输入、进程状态仅协调、冷恢复、additive default、接受/丢失窗口（continuable、teams、archive、delivery）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:53-60@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:132-144@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-08-web-explicit-file-delivery.md:32-38@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:53-60@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:132-144@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-08-web-explicit-file-delivery.md:32-38@687f282e

<a id="m4-single-ordering-authority"></a>
## m4-single-ordering-authority：单一排序/所有权权威

**何时使用**：给同一资源增加 follow-up、后台任务、重试、任务板或终端发送；已有队列/注册表/定时器而新功能想再建一套；存在多个写入者或并发 mutation。

**前置条件**：能列出该语义的全部写入者；可引入 CAS/串行队列/single-flight；有稳定错误码。

**负责角色**：运行时/存储所有者、调用方/UI 生产者。

**操作步骤**：
1. 列出所有写入者和现有队列/台账/定时器；选一个作为唯一权威。
2. 其他路径改为委托或删除；不得保留第二 FIFO、第二 reservation 台账、第二 retry timer。
3. 每个 mutation 经权威串行化；跨步骤拒绝在最终无 await 区间再次校验身份/修订/所有权。
4. 资源占用用身份集合而非引用计数；一次只允许一个活跃发送/提交，重复请求返回明确错误。
5. 共享状态用单调 revision + `expectedRevision` CAS；删除保留 tombstone；id 耗尽失败而不复用。
6. 重试只有一个调度器；每次物理尝试唯一编号、一次 socket 替换；手动恢复走同一路径。
7. 测试并发、重试、重复点击、删除与恢复。

**完成信号**：每个操作只有一个顺序和一个所有者；竞态有稳定结果；无第二条写入路径。

**失败处理与例外**：第二写入者删除或返回错；重复发送/提交返回 `SEND_ACTIVE`/`submission-pending`；纯只读缓存可多副本但不得成为写入权威。

**证据与限制**：单进程权威不协调两个宿主，跨进程需 lease/邮箱；单队列降低吞吐，应按域拆分而非复制同一语义；CAS 不证明业务语义。

**源义务**：唯一 inbox/队列、single-flight、revision CAS、单 retry 调度器、身份集合（continuable、teams、archive、PTY、connection recovery）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:61-102@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:39-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:31-41@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-28-web-connection-recovery-control.md:12-22@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:61-102@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:39-50@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:31-41@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-28-web-connection-recovery-control.md:12-22@687f282e

<a id="m5-boundary-snapshot-and-exact-cut"></a>
## m5-boundary-snapshot-and-exact-cut：边界快照与精确切点

**何时使用**：委派、fork、归档、定时、投递或配置授权跨越时间边界；父级策略/工作区/时钟在子级运行后仍会变化；用户显式选择历史位置或时间。

**前置条件**：边界可识别；持久记录能承载快照；恢复路径能只读快照；时间有明确时区。

**负责角色**：委派/fork 管理器、持久化所有者、恢复入口。

**操作步骤**：
1. 定义边界与省略默认值（省略切点=最近完整步骤/轮次；省略时间=立即）。
2. 在边界同步读取权威状态并生成不可变快照，且在第一次 await 前完成。
3. 把快照写入创建输入/持久事件，排在 fork 种子之后；恢复只读快照。
4. 显式切点精确保留请求的事件，不移动到更完整步骤；无效切点在最早解析点失败。
5. 时间规范化为 UTC/RFC3339；DST 缺口拒绝，重叠取较早；固定间隔只追赶最新序列点。
6. 在不受信任项目代码可修改环境之前冻结同意/授权。
7. 测试父级切换、冷恢复、省略/显式切点、DST、时钟回拨。

**完成信号**：同一持久记录产生同一有效策略/时间/切点；父级未来变化不追溯改变子级。

**失败处理与例外**：边界前失败不发布；无效切点/时间拒绝；冷恢复缺快照显式失败；新边界可重新委派；旧记录迁移可补默认值但不改变已持久语义。

**证据与限制**：父级后续收紧不会自动作用于已存在子级；精确切点可能保留不完整历史；固定间隔只追赶最新点；快照不证明外部副作用已发生。

**源义务**：同步快照、随记录传递、冷恢复不重捕、精确切点、时区/DST、授权冻结（policy inheritance、fork、schedule、archive、delivery）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-10-continuable-subagent-policy-inheritance.md:12-18@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-arbitrary-seq-session-fork.md:12-24@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-05-durable-web-schedule.md:16-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-08-web-explicit-file-delivery.md:12-20@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-continuable-subagent-policy-inheritance.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-arbitrary-seq-session-fork.md:12-24@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-05-durable-web-schedule.md:16-32@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-08-web-explicit-file-delivery.md:12-20@687f282e

<a id="m6-transactional-unpublished-setup"></a>
## m6-transactional-unpublished-setup：未发布设置与事务式准入

**何时使用**：启动子代理、团队、PTY 或一次性任务；首次请求依赖策略/工具/提示词组装；接受消息与发布运行之间异步。

**前置条件**：资源可预留；创建可回滚；有明确发布边界；能注入失败做测试。

**负责角色**：子级管理器、提供方、宿主调用方。

**操作步骤**：
1. 预留身份/容量。
2. 在私有 owner scope 创建并安装句柄；提供方只给分离的创建输入。
3. 在发布前完成历史恢复覆盖、首个提示词/工具视图组装、结构化输出安装。
4. 提交初始消息并取得 MessageId；回执只在 inbox 接受/等价提交边界返回。
5. 返回回执后发布；任何前置失败走关闭事务回滚句柄/激活/所有权。
6. 最终无 await 的准入区间再次检查取消、作用域、dispose、父级权限。
7. 测试每条失败路径、并发投递、dispose、首次请求内容。

**完成信号**：观察者看不到半配置子级；第一次请求已使用正确策略/工具；失败无孤儿、无未配对生命周期边。

**失败处理与例外**：失败不返回 id 并回滚；发布后失败按正常 dispose 闭合；调用方 signal 只拥有未发布工作；closing promise 单赢家；外部 provider start 仍受管理器容量/结算。

**证据与限制**：未发布设置在单进程成立；跨进程创建需额外协议；回执不保证已落日志（见 m3）；只能回滚自己创建的资源，外部副作用另行处理。

**源义务**：发布前组装、回执边界、调用方取消范围、最终准入检查、回滚（subagent、continuable、teams、PTY）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:68-74@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:37-53@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:31-41@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:68-74@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:37-53@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:31-41@687f282e

<a id="m7-fail-closed-configuration"></a>
## m7-fail-closed-configuration：配置/引用失败关闭

**何时使用**：配置 schema、适配器兼容字段、过滤器、持久引用或恢复记录；写入/挂载/启动可能接受无效值；未知/缺失字段可能被默认值掩盖。

**前置条件**：原始配置可检查；schema 能拒绝未知键；引用解析有最早点；恢复流程可对账。

**负责角色**：配置/schema 所有者、适配器/恢复器、操作员。

**操作步骤**：
1. 枚举允许键与作用域，区分 offer/withhold。
2. 在原始输入上检查未知/无值/拼错键，早于协议解析；schema 拒绝非法类型/枚举。
3. 写入/挂载/启动传播失败，错误点名可用集合或失败位置。
4. 过滤器无 allow/deny 或命名作用域外条目 → 启动失败；`allow:[]` 合法（隐藏全部）。
5. 引用在最早可解析点校验；畸形附件/会话引用使请求失败，不静默跳过。
6. 不支持模式拒绝；遥测等旁路不得改变命令结果。
7. 恢复对未终结记录对账；冲突显式报告，不保留孤儿。
8. 测试错拼、无值、作用域外、损坏引用、恢复冲突。

**完成信号**：坏配置不会以 inert 形式落盘；错误可诊断；恢复不产生孤儿。

**失败处理与例外**：外部文件编辑可能只能保留 last-good 并告警，须记录该限制；显式空集合/默认值合法，必须与“未设置”区分；过严校验需版本化扩展点。

**证据与限制**：只能证明本地契约；远端可能忽略字段；外部编辑的 last-good 可能没有用户可见通道；拒绝不证明业务正确。

**源义务**：未知/非法键失败、过滤器校验、最早引用解析、恢复冲突、错误点名（pi-ai、teams、image paths、spawn preset、subagent 过滤）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:26-32@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-model-readable-image-paths.md:12-28@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-20-spawn-agent-preset-selection.md:11-19@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:37-52@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:26-32@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-21-model-readable-image-paths.md:12-28@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-20-spawn-agent-preset-selection.md:11-19@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:37-52@687f282e

<a id="m8-compile-time-exhaustiveness"></a>
## m8-compile-time-exhaustiveness：编译期穷尽门禁

**何时使用**：包装持续演进的上游类型/协议字段/工具结果；配置界面、schema 与运行时类型描述同一集合；新增上游枚举/联合分支。

**前置条件**：上游类型可导入；TypeScript strict/exactOptionalPropertyTypes；CI 执行类型检查。

**负责角色**：适配器作者、编译器/CI 与评审者。

**操作步骤**：
1. 为每个上游类型维护 `Record<keyof Upstream, Disposition>`，逐字段分类 offer/withhold。
2. 用类型级 AssertNever/对称差证明显式 profile 恰好命名开放集；schema 注解与 exactOptionalPropertyTypes 让缺键失败。
3. 字段类型从上游派生，另加可赋值性证明，防止值域收窄。
4. 协议适用性按上游 compat 类型分组，协议集从上游条件类型派生；新增类型按名失败。
5. 工具结果声明完整 schema，由共享 helper 一致渲染；未声明结果类型视为缺陷。
6. 升级上游后先跑类型门禁，再逐项分类，不靠运行时抽查。

**完成信号**：新增上游字段/漏键/漏 schema 键在编译期失败；没有静默丢弃路径。

**失败处理与例外**：编译失败即阻止合并；分类语义仍需评审；动态/插件扩展显式 opaque 并独立验证。

**证据与限制**：编译期只证明结构一致，不证明分类语义或远端接受；类型技巧增加维护成本；动态扩展无法完全穷尽。

**源义务**：disposition 映射、AssertNever、schema 注解、字段派生、协议集派生、完整结果 schema（pi-ai、teams、messages adapter）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:16-26@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-pi-ai-wire-compat-surface.md:16-26@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e

<a id="m9-bounded-resources-and-streaming"></a>
## m9-bounded-resources-and-streaming：有界资源、分页与流式背压

**何时使用**：导出/下载、命令输出、预览解析、长会话投影、工具结果；结果可能大于内存/模型上下文；多个并发调用共享慢后端。

**前置条件**：可测量输出规模；有流式 API/背压；配置能设上限；结果可标注截断。

**负责角色**：导出/终端/预览生产者、消费者、部署配置者。

**操作步骤**：
1. 定义字节/行/块/字段/表格行预算及最小合法值。
2. 后端读取、序列化、最终渲染三处都执行上限；刷新包装后的最终边界。
3. 用流式 API + 高水位等待消费者；不把完整归档/文件放单缓冲。
4. 分页从最新/指定位置读取，带 total/truncated 元数据；单条超长项仍受字节上限。
5. 过小上限（会破坏 id/确认）显式拒绝；说明限制不是硬内存沙箱。
6. 并发慢后端限制启动数，不无限累积 I/O。
7. 测试超大单行、空结果、取消、超时。

**完成信号**：响应有界；单个超大项不能绕过；截断可见；取消终止生产。

**失败处理与例外**：超限截断并标注/报错；保留单个超大项时仍受观察预算；缺失引用使流失败而非静默少导出；取消/重试可重来。

**证据与限制**：字节/矩阵限制不等于硬沙箱（解压后仍可能超限）；流式导出是逐会话读取边界快照，不是整树原子快照；完整 DOM 仍可能增长。

**源义务**：流式 ZIP、字节/行/矩阵上限、背压、分页/截断、最小预算（export、PTY、Excel、turn rail、teams）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:12-19@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:52-75@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md:13-29@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-30-web-turn-rail-outline-jump.md:12-24@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:52-75@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md:13-29@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-30-web-turn-rail-outline-jump.md:12-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e

<a id="m10-typed-evidence-and-uncertainty"></a>
## m10-typed-evidence-and-uncertainty：类型化证据与未知

**何时使用**：外部进程就绪/活动检测；指标/比率展示；队列准入/完成；网络存活；未知进程/语言/平台。

**前置条件**：结果可定义联合类型；检测器能区分正向证据与推断；清理策略可按未知保留。

**负责角色**：检测器/后端、UI/消费者、清理器。

**操作步骤**：
1. 定义精确/推断/未知的结果联合，明确每类可做什么。
2. 只对正向证据下结论；不可读/不支持 → miss/unknown。
3. 超时映射为 timeout，不映射为 exit；进程仍在则状态仍 running。
4. 缺失采样/分母为零 → 省略指标，不显示 0/100%。
5. 未知活动保留资源，不按空闲回收；确认空闲后才起完整宽限。
6. 只向已确认前台进程组发信号；解析失败就失败，不猜 PID。
7. 测试未知、缺失、超时、负值、临界舍入。

**完成信号**：调用方能区分事实与推断；没有把缺失当零；清理只在确认条件下发生。

**失败处理与例外**：unknown 保留；timeout 不杀；缺失省略；非法值拒绝；启发式回退必须标 inferred 并保留不确定性。

**证据与限制**：启发式仍可能误判（静默构建、网络阻塞）；未知可能永久保留资源，需人工处置；精确证据依赖平台能力。

**源义务**：精确/推断/超时分离、缺失省略、unknown 保留、PID 不猜、精度保持区别（PTY、reclamation、metrics、high-cache、schedule）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:75-89@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:11-38@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-04-web-latency-throughput-metrics.md:12-20@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-19-high-cache-hit-decimal-display.md:14-27@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-05-durable-web-schedule.md:28-32@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:75-89@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:11-38@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-04-web-latency-throughput-metrics.md:12-20@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-19-high-cache-hit-decimal-display.md:14-27@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-05-durable-web-schedule.md:28-32@687f282e

<a id="m11-replay-determinism-and-presentation-fidelity"></a>
## m11-replay-determinism-and-presentation-fidelity：回放确定性与呈现保真

**何时使用**：展示持久模型输入/工具结果；流式到定稿；快照/黄金文件；链接、路径、系统提示词、指标渲染。

**前置条件**：持久日志/投影可读；快照基础设施；能区分渲染器与词表所有者。

**负责角色**：投影/渲染器、快照作者、评审者。

**操作步骤**：
1. 确认展示数据权威来源（持久日志/当前窗口），不读实时目录/环境。
2. 模型可见文本按原始字节呈现；不把 Markdown 重新排版成模型未收到的文档。
3. 不臆造日志未命名的分段/生产者/来源；未知字段显示未知。
4. 链接/提及只对已确认目标生效；歧义/未知保持惰性，绝不产生 404。
5. 流式增量必须与从头解析/定稿等价；非追加输入或语法变化重置。
6. 不可复现墙钟指标在快照中归一化；提供固定种子/比率。
7. 测试回放、分页窗口、实时目录变化、未知版本、增量等价。

**完成信号**：同一持久输入在实时/回放产生相同字节/导航目标；没有死链；快照可重复。

**失败处理与例外**：未知版本回退通用结果；链接歧义惰性；流式非追加重置；视觉装饰可不同但不得改变模型可见文本/目标。

**证据与限制**：完整字节保真可能牺牲可读性；窗口分页限制可见历史，未加载部分不能冒充已加载；快照归一化可能掩盖真实性能变化。

**源义务**：只读持久源、opaque 字节、不臆造、惰性链接、增量等价、快照归一化（skill row、opaque prompt、metrics、markdown links、image paths、streaming fence）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-06-web-skill-tool-row.md:12-20@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-system-prompt-opaque-body.md:12-16@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-04-web-latency-throughput-metrics.md:28-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-markdown-file-preview-links.md:12-20@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-model-readable-image-paths.md:12-28@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-20-web-streaming-fence-highlight.md:12-23@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-06-web-skill-tool-row.md:12-20@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-system-prompt-opaque-body.md:12-16@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-04-web-latency-throughput-metrics.md:28-32@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-15-markdown-file-preview-links.md:12-20@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-21-model-readable-image-paths.md:12-28@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-20-web-streaming-fence-highlight.md:12-23@687f282e

<a id="m12-composition-ownership-and-public-contracts"></a>
## m12-composition-ownership-and-public-contracts：组合所有权与公共契约

**何时使用**：新增 UI/后端能力需要跨包组合；两个包共享渲染/数据/提示词；实验能力进入产品；替换旧包/旧公共接口。

**前置条件**：包边界清晰；有 slot/服务注册机制；组合配置可增删行；可选服务可缺席。

**负责角色**：包所有者、组合作者、评审者。

**操作步骤**：
1. 列出数据、渲染、提示词、持久化的所有者；每项能力唯一所有者。
2. 其他包只通过公开 slot/契约消费，不 import 内部实现。
3. 可选能力做成可选 provider；缺席=关闭，不导致挂载失败。
4. 一个组合行同时启停渲染器与对应提示词/行为，防止漂移。
5. 实验包放独立目录、显式挂载；稳定 API/UC 包不依赖实验包。
6. 替换旧包时预发布直接删除，迁移所有调用方；禁用行不是关闭，要移除消费者。
7. 测试组合有无该行、实验隔离、HMR/dispose、可选服务缺席。

**完成信号**：一行启停整个能力；无跨包内部依赖；实验能力不影响稳定包；禁用行不存在。

**失败处理与例外**：跨包内部 import 评审拒绝；实验依赖稳定包阻止；缺行退化为关闭；type-only import 可跨包（无运行时依赖）。

**证据与限制**：拆包增加成本；可选服务缺席的降级路径需单独测试；实验隔离不是权限/安全边界。

**源义务**：唯一所有者、公开契约、可选 provider、单行组合、实验隔离、删除旧包（attachments、inline mentions、onboarding、teams、unified task、export）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-attachment-display-alignment.md:16-22@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-07-web-inline-file-mentions.md:14-22@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-13-shared-modal-product-onboarding.md:12-22@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-25-unified-task-list.md:14-25@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:19-26@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-attachment-display-alignment.md:16-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-07-web-inline-file-mentions.md:14-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-13-shared-modal-product-onboarding.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-unified-task-list.md:14-25@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:19-26@687f282e

<a id="m13-explicit-opt-in-and-consent"></a>
## m13-explicit-opt-in-and-consent：显式启用与正向同意

**何时使用**：遥测/上传/远端调用；实验性或高成本能力；隐私/凭据/工作区数据；默认工具目录/组合。

**前置条件**：可信授权配置；部署文档；在不可信项目环境之前确定授权；按能力维护默认组合，不恢复已删除的 SDK launcher。

**负责角色**：部署者、运行时启动、产品默认组合维护者。

**操作步骤**：
1. 当前共享 base 的 unset/empty 模式与省略后端 mode 均为 FEEDBACK_ONLY；普通活动不授权采集，新的本 Session 显式反馈才释放到其事件的未 handoff 前缀，包含存储上下文。
2. 保留非空 `DSH_TELEMETRY_DISABLED`（包括 0/false）加载前硬 opt-out 与显式 DISABLED；当前后端拒绝 FULL/未知直接配置，不能套用旧 launcher 的 deny-not-throw。
3. 仅对 session-search 等有该义务的默认目录移除消费者、保留宿主所需提供方；这不是删除当前 base 的反馈门控后端。
4. 不允许项目 .env/代码自行授权导出；旧 SDK launcher 的启动环境冻结是历史信任边界，具体工具链已删除。
5. 文档说明可能导出完整上下文、采集时脱敏、覆盖值与 handoff 非送达；当前后端没有内部 FULL 例外。
6. 验证默认/空/省略 mode、禁用/硬 opt-out、FULL/未知拒绝、新的本 Session 反馈、继承反馈不授权、直接 emit 不授权与项目环境篡改。

**完成信号**：全新安装普通活动不采集；新的本 Session 反馈才授权其 inclusive prefix；硬 opt-out 不加载、DISABLED 不构造传输。反馈确认只是记录，不是分享/送达回执。

**失败处理与例外**：未授权不采集；硬 opt-out 优先；FULL/未知后端模式在 setup 前失败。旧 SDK launcher 的 FULL 许可和静默拒绝仅为历史，不是当前后端例外。

**证据与限制**：外部代理/网关仍可能记录；无部署脱敏规则时可外发完整内容。撤回不证明远端抹除；旧授权批次按 SDK 关闭期限处置，不能声称切换 disabled 即取消在途请求或存在 durable outbox。

**源义务**：正向授权、当前反馈门控默认、硬 opt-out、可信启动边界、逐能力的默认消费者移除与显式重能力（session search、PTY、teams、worktree）。归档默认禁用/FULL 不覆盖当前实现。 **源引用**：历史遥测决策见下；当前以 `deepseek-harness/packages/bundle/base/cordis.patch.yml:205-221@687f282e`、`deepseek-harness/packages/session/session-telemetry-otel/src/index.ts:31-63@687f282e`、`deepseek-harness/packages/session/session-telemetry-otel/README.md:32-68,142-144@687f282e` 为准。硬 opt-out 的实现：`deepseek-harness/packages/boot/app-boot/src/profile-context.ts:29-64@687f282e` 在加载前把非空值转成 disabled patch，`deepseek-harness/apps/cli/src/profile-boot.ts:314-322@687f282e` 传入启动环境值；相关模式/拒绝测试见 `deepseek-harness/packages/session/session-telemetry-otel/tests/otel.spec.ts:732-773@687f282e`（本包未执行）。后继 Note `deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:12-32@687f282e` 仍残留省略插件 mode=DISABLED 的旧句，不能机械照搬。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-telemetry-default-off.md:12-20@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-02-session-search-not-shipped-default.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:15-21@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:15-23@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-13-explicit-worktree-creation.md:11-21@687f282e

<a id="m14-versioned-compatibility-and-reader-refusal"></a>
## m14-versioned-compatibility-and-reader-refusal：版本化兼容与读者拒绝

**何时使用**：持久格式新增事件/字段；发布/热替换跨版本；旧会话/旧介质恢复；新事件是后续操作的授权索引。

**前置条件**：记录有版本字段；发布身份可注入；客户端能判断并拒绝/提示；迁移路径明确。

**负责角色**：schema 所有者、发布者、客户端。

**操作步骤**：
1. 新记录带版本；旧介质用 schema 默认值升级，迁移不丢事件。
2. 新增强制事件若是授权/索引，旧读者必须拒绝而不是静默丢弃；不支持则明确失败。
3. 已发布校验器不修改；新变体走新版本/新检查。
4. 构建时固定 release 身份（版本+commit）；每帧携带；页面只应用启动 release 的图。
5. 跨 release 暂停热替换并提示刷新；不自动 reload，避免丢草稿。
6. 未知版本/缺失身份回退通用/未知显示，不部分解释。
7. 测试旧介质、未知版本、跨 release、返回启动 release、刷新后基线。

**完成信号**：无静默数据丢失；页面只运行一个 release；旧记录可读；新索引不被旧读者忽略。

**失败处理与例外**：不支持则拒绝/失败；纯展示元数据可安全忽略，授权/索引事件不可；刷新提示可被忽略但页面仍保持自身 release 可用；发布顺序必须先有新读者。

**证据与限制**：旧读者拒绝依赖部署顺序；release 身份依赖构建注入，源码启动可能只有版本；刷新提示不能保证用户立即执行。

**源义务**：版本默认、旧读者拒绝、校验器不修改、release gate、不自动 reload、未知回退（fork、delivery、release prompt、archive、messages adapter）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-18-arbitrary-seq-session-fork.md:12-24@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-08-web-explicit-file-delivery.md:32-38@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-14-host-release-change-refresh-prompt.md:20-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-arbitrary-seq-session-fork.md:12-24@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-08-web-explicit-file-delivery.md:32-38@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-10-14-host-release-change-refresh-prompt.md:20-50@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-session-archive-global-set.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e

<a id="m15-authority-not-visibility"></a>
## m15-authority-not-visibility：可见性不是授权

**何时使用**：工具过滤/能力限制；多代理/团队/共享 checkout；Queue mutation 的所有权例外；工作树/共享目录。

**前置条件**：有威胁模型；能识别实时身份与谱系；授权入口可集中；文档能写非保证。

**负责角色**：安全评审者、运行时所有者、文档作者。

**操作步骤**：
1. 列出攻击者/可信进程模型；区分组合（可见性）与授权（谁可做什么）。
2. 新工作/提示词仍要求确切在线直接父级；只有目标本地事实足够时才允许窄例外。
3. 记录来源字段（MessageSource/senderSessionId）不能作为授权依据。
4. 不为没有具体消费方的权限铸造 API/用户分支。
5. 写作用域是建议而非锁；外部写者绕过 CAS；不声称互斥。
6. 共享 checkout 的集成边界留给 Lead/人工测试，不自动创建隔离。
7. 测试绕过路径并把非保证写入文档。

**完成信号**：没有把过滤器/可见性当安全边界；宽例外只作用于已存在本地状态；拒绝路径可诊断。

**失败处理与例外**：不满足则拒绝；同一可信进程内可放宽可见性，跨信任边界不可；窄例外可能被知道 MessageId 的调用方滥用，需评估目标本地状态是否足够。

**证据与限制**：同进程可信模型无法防止恶意插件直接调用服务；共享 checkout 冲突只能降低；过滤器不阻止直接服务调用、不要求子集、不沙箱插件。

**源义务**：过滤非安全边界、确切直接父级、目标本地窄例外、来源字段非授权、写作用域非锁（subagent 过滤、inbox control、teams、worktree）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:74-82@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-27-continuable-subagent-human-inbox-control.md:14-30@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:51-57@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-13-explicit-worktree-creation.md:11-21@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-12-subagent-persona-tool-filter-and-depth.md:74-82@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-27-continuable-subagent-human-inbox-control.md:14-30@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:51-57@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-13-explicit-worktree-creation.md:11-21@687f282e

<a id="m16-lifecycle-teardown-and-resource-ownership"></a>
## m16-lifecycle-teardown-and-resource-ownership：结构化生命周期拆卸

**何时使用**：子代理/团队/终端/插件/宿主关闭；资源所有权图运行时变化；清理失败或取消与 dispose 竞争。

**前置条件**：有 owner scope/生命周期框架；能关闭准入；能等待进程/句柄停稳；持久状态与运行时分离。

**负责角色**：生命周期所有者、宿主、清理器。

**操作步骤**：
1. 画出所有权图与动态边；每个资源有结构化所有者。
2. 先注册结构化 disposer，再注册 drain disposer，确保逆序先 drain。
3. 关闭准入、停止工作、等待已准入物化；等待 quiescence；保留持久会话。
4. child-first 释放；父级在所有 child 完成前不结算。
5. closing promise 记忆化，让宿主关闭、管理器卸载、child 释放汇合。
6. 单分支失败仍继续其余分支，最后聚合报告；清理失败保持 tracked、可重试。
7. 身份关闭后不可复用；测试并发 dispose、清理失败、重试、身份复用。

**完成信号**：无存活进程/句柄；持久状态保留；无过早释放；无祖先永久等待。

**失败处理与例外**：失败聚合且可重试；不缓存失败关闭；宿主只 drain 自己拥有的子树；等待 quiescence 可能很长，需要 grace/显式关闭。

**证据与限制**：进程内拆卸不清理持久日志；崩溃后仍可能需恢复；外部副作用（push/API）不能由本地 teardown 撤销。

**源义务**：结构化 owner、child-first、drain/quiescence、closing promise、失败聚合、身份不复用（continuable、PTY、teams、reclamation）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:102-116@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:176-204@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:31-41@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:95-103@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:11-38@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:102-116@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-28-continuable-subagent-conversations.md:176-204@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:31-41@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:95-103@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:31-39@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:11-38@687f282e

<a id="m17-ui-state-accessibility-and-layout-stability"></a>
## m17-ui-state-accessibility-and-layout-stability：UI 状态、焦点、无障碍与布局稳定

**何时使用**：模态、卡片、composer、连接/发布提示；状态切换隐藏/显示区域；异步提交/重连/刷新；一个控件/行承载两个意图。

**前置条件**：状态可移到组件/服务；有无障碍检查/组件测试；几何可测量；刷新/重连可显式确认。

**负责角色**：UI 所有者、无障碍/键盘评审者、测试作者。

**操作步骤**：
1. 草稿/当前位置/已选答案存放在组件状态而非 DOM；折叠/展开不重置。
2. 隐藏的可交互面从 a11y 树卸载；`aria-expanded`/标签随状态变化。
3. 提交/取消进行中禁用会改变状态的控制；忙碌不得静默接受。
4. 焦点与 DOM identity 在状态过渡中保留；常驻 textarea 同一节点变可编辑。
5. 覆盖层 portal 到 body，避免 transform 困住 fixed。
6. 为最宽本地化标签预留几何；状态变化不移动/缩放控件。
7. 刷新提示不自动 reload；初始焦点留在页面，Enter 不丢草稿。
8. 用键盘/屏幕阅读器/多视口测试。
9. 一个控件/行只承载一个意图；动作结果显式报告实际分支（如 pick|drill），旧调用方按默认分支保持兼容。

**完成信号**：草稿/焦点保留；隐藏面不可聚焦；忙碌无第二次提交；几何稳定；刷新不丢输入；动作结果可区分。

**失败处理与例外**：测试失败即阻止；视觉装饰动画可不同，但不得影响输入/焦点/可点击区域；固定几何可能浪费空间，按最宽文本权衡。

**证据与限制**：快照/组件测试不覆盖所有屏幕阅读器；仍需人工检查；视觉产品决策本身不是治理机制。

**源义务**：组件状态、隐藏面卸载、busy 守卫、焦点/DOM identity、portal、固定几何、刷新不丢草稿、显式动作结果（question card、onboarding、release prompt、connection recovery、attachments、folder pick/drill）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-11-collapsible-ask-user-question-card.md:12-23@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-13-shared-modal-product-onboarding.md:12-22@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-14-host-release-change-refresh-prompt.md:107-117@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-28-web-connection-recovery-control.md:12-22@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-attachment-display-alignment.md:16-22@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-24-folder-reference-pick-vs-drill.md:1-32@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-collapsible-ask-user-question-card.md:12-23@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-13-shared-modal-product-onboarding.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-10-14-host-release-change-refresh-prompt.md:107-117@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-28-web-connection-recovery-control.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-attachment-display-alignment.md:16-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-24-folder-reference-pick-vs-drill.md:1-32@687f282e

<a id="m18-verification-matrix-and-honest-limits"></a>
## m18-verification-matrix-and-honest-limits：分层验证矩阵与诚实限制

**何时使用**：声明功能完成/修复/可发布；涉及平台/native/真实浏览器/真实模型；存在无法自动化的手动检查。

**前置条件**：能分层（单测/组件/集成/真实引擎/组装/平台）；有确定性 fixture；CI 可跑真实入口；能记录未覆盖。

**负责角色**：作者、验证执行者、评审者。

**操作步骤**：
1. 列出风险与平台矩阵；为每层选最小但真实的测试。
2. 纯逻辑可注入并在所有平台测试；真实平台路径单独 job。
3. 用固定种子/固定时钟/固定比率；非确定性值在快照中归一化。
4. 最终验收覆盖真实入口（组装/安装/构建产物），不以源码级测试替代。
5. 明确列出未测试分支（打包自我 spawn、真实渲染、手动交互）与覆盖缺口。
6. 证据状态区分 planned/manual/executed；提取阶段不声称运行。
7. 失败保留并报告；不用抽样代表全量。

**完成信号**：每个声明有对应证据或明确标未执行；关键路径在组装产物上验证；未覆盖清单可见。

**失败处理与例外**：成本极高的平台/打包路径可手动，但必须命名；真实模型/网关受凭据限制时跳过而非伪造；覆盖率是结构指标，不代表语义完整。

**证据与限制**：测试通过只证明被测场景；不能证明所有代理/网关/平台；人工检查不能冒充自动保证。

**源义务**：分层测试、真实引擎/平台、确定性 fixture、组装/安装验证、手动/未覆盖声明（PTY、export、wide table、streaming fence、reclamation、Excel、teams）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:161-185@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:26-31@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-19-web-markdown-wide-table-view.md:28-38@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-20-web-streaming-fence-highlight.md:23-27@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:48-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md:41-45@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:81-87@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:161-185@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:26-31@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-19-web-markdown-wide-table-view.md:28-38@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-20-web-streaming-fence-highlight.md:23-27@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:48-56@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md:41-45@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-05-agent-teams.md:81-87@687f282e

<a id="m19-no-dead-surfaces-and-clean-cutover"></a>
## m19-no-dead-surfaces-and-clean-cutover：删除死接口与干净切换

**何时使用**：替换/删除功能或包；公共接口失去唯一消费者；预发布阶段形状变化；共享常量/包装无生产调用方。

**前置条件**：能全局检索引用；构建/类型检查可跑；组装应用可验证；旧包/旧接口清单明确。

**负责角色**：实现者、评审者、组装测试者。

**操作步骤**：
1. 列出旧接口/包的所有调用方与文档。
2. 迁移到新入口并更新测试/快照。
3. 删除旧实现、兼容导出、配置行、常量；预发布不加 shim/转发文件。
4. 删除被替换包并让新入口占用其 slot；不保留禁用行。
5. 全局检索引用并构建；在组装应用验证只有新路径。
6. 发现遗漏调用方时迁移它，不恢复旧接口。

**完成信号**：零引用；单一路径；无旧包/禁用行/占位符；构建与组装通过。

**失败处理与例外**：残留引用导致构建/测试失败；已发布版本的兼容窗口需单独政策，预发布无；全局检索不能证明动态/字符串调用不存在。

**证据与限制**：删除可能破坏外部消费者；需版本政策；动态调用可能漏检；本机制面向预发布/内部替换。

**源义务**：迁移所有调用方、删除旧 RPC/包/常量、预发布直改、无禁用行（export、unified task、skill row、messages adapter）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:19-26@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-25-unified-task-list.md:14-25@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-web-skill-tool-row.md:12-20@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:29-39@687f282e`。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-session-log-export.md:19-26@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-unified-task-list.md:14-25@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-06-web-skill-tool-row.md:12-20@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:29-39@687f282e

<a id="m20-cache-prefix-and-context-stability"></a>
## m20-cache-prefix-and-context-stability：缓存前缀稳定

**何时使用**：系统提示词/工具 schema 频繁变化；图片/附件路径依赖宿主环境；长会话重复请求。

**前置条件**：能识别缓存前缀；有逐路由能力声明；有真实 API 缓存指标；能区分系列开始/压缩/恢复。

**负责角色**：循环/适配器作者、投影/计量、验证者。

**操作步骤**：
1. 识别缓存前缀中的动态事实。
2. 有能力时追加 system 节点，不重写 message 0；无能力时重写/替换。
3. 在系列开始/压缩/工具 schema 变化时重新基线；空渲染清除所有版本。
4. 把环境相关访问路径排除出确定性身份/variantId；请求时按当前环境解析。
5. 披露追加节点的 token 成本与缓存收益；用真实 API 缓存指标检测代理重写。
6. 模型契约收窄时增加重新基线触发条件。
7. 测试追加/重写、无能力路由、空渲染、压缩、环境变化、真实缓存。

**完成信号**：前缀在会话内稳定；变更可在尾部表达；缓存命中可测量；环境变化不改变确定性身份。

**失败处理与例外**：无能力则替换；契约不符导致 cache miss；代理重写会静默破坏语义，只有真实指标能检测；路由切换本身已 miss，追加无额外收益。

**证据与限制**：追加节点每请求付出 token，直到被压缩遮蔽；外部模型契约可能收窄；本地测试不能证明远端缓存。

**源义务**：分离动态事实、追加/重写能力、系列开始重基线、环境排除、缓存成本披露（in-history、image paths、messages adapter；proposal 仅历史）。 **源引用**：`deepseek-harness/.agents/notes/implemented/feature/2026-09-02-in-history-system-prompt-replacement.md:15-42@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-model-readable-image-paths.md:12-28@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e`；`deepseek-harness/.agents/notes/proposed/feature/2026-07-06-recallable-compaction.md:51-58@687f282e`（proposal，仅历史）。

来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-02-in-history-system-prompt-replacement.md:15-42@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-21-model-readable-image-paths.md:12-28@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-07-deepseek-messages-adapter.md:11-19@687f282e 来源：deepseek-harness/.agents/notes/proposed/feature/2026-07-06-recallable-compaction.md:51-58@687f282e

<a id="m21-native-risk-containment-and-platform-gating"></a>
## m21-native-risk-containment-and-platform-gating：原生风险隔离与平台门禁

**何时使用**：Windows/macOS 原生 UI、PTY、系统集成；原生 ABI/COM/API；浏览器二进制格式解析；平台专属外观。

**前置条件**：原生调用可隔离到子进程/模块；平台标记可注入；有界中止/终止可用；平台 CI/手动矩阵。

**负责角色**：平台所有者、CI/发布者、宿主。

**操作步骤**：
1. 把高风险原生模态放入子进程/隔离层，宿主事件循环不被阻塞。
2. 加平台标记与发送者/参数校验；非目标平台零影响。
3. 实现有界中止；超时强制终止；失败限制在隔离层并上报。
4. 纯逻辑/驱动/mock/真实平台分层测试；原生 ABI 崩溃风险用子进程隔离。
5. 可选增强（DPI/毛玻璃）best-effort，缺失不降级核心功能；移除的回退层不再保留。
6. 打包/自我 spawn 等无法自动覆盖的路径显式命名并手动检查。

**完成信号**：宿主在原生失败/中止后仍存活；其他平台不受影响；子进程无孤儿；核心功能不依赖可选外观。

**失败处理与例外**：原生加载失败限制在隔离层；可选增强降级；平台门禁依赖 preload 标记，缺失时可能不生效/误生效；隔离不修复错误 ABI。

**证据与限制**：打包后自我 spawn/真实渲染可能无法自动测试；平台矩阵可能不完整；原生风险只是被限制，不是消失。

**源义务**：进程隔离、平台门禁、有界中止、ABI 风险分层、best-effort 增强（win32 dialog、macOS titlebar、PTY、reclamation、Excel）。 **源引用**：`deepseek-harness/.agents/notes/archived/feature/2026-08-02-win32-in-process-folder-dialog.md:12-28@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-13-macos-hidden-titlebar-vibrancy.md:12-30@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:41-52@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:11-38@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md:13-29@687f282e`。

## 采用顺序建议

1. **先建权威**（m1、m3、m4）：确认当前决策、持久日志和单一排序点。缺少这三者时，其余机制会建立在双权威/竞态上。
2. **再定边界与准入**（m5、m6、m7、m8）：快照、事务式发布、失败关闭、编译期穷尽。
3. **限制资源与证据**（m9、m10、m18）：有界输出、类型化未知、验证矩阵。
4. **处理展示与组合**（m11、m12、m17、m19）：回放保真、包所有权、UI 状态、删除旧面。
5. **最后处理版本、授权与平台**（m13、m14、m15、m16、m20、m21）：这些机制依赖前面的权威/边界；不要用可见性/同意变量替代授权。

## 全局限制

- 本参考不声称任何采用项目已经实现这些机制；所有 positive/rejection/recovery 场景在 knowledge JSON 中标 `planned`。
- 来源 Note 中的产品决策（颜色、布局、API 形状）不自动成为治理义务；只有被明确陈述为约束/权衡/验证要求的内容才转写为机制。
- `Status` 为 archived/superseded/proposed 或 coverage 标为 historical-superseded/superseded-partial/proposed-unshipped 的记录只提供历史或设计输入；仅存放在 `archived/` 目录的 implemented Note 仍按其当前状态处理。其运行时保证必须回到当前实现/验证证据。
- 跨领域依赖（例如设置 seam 的 last-good 可见性、模型真实缓存、浏览器/PTY 平台行为）仍未被本分区的实际证据完全绑定；采用时需单独验证。

---

## 机制 ID 索引（稳定标识与锚点）

本表把 `knowledge/` 中的稳定机制 ID 对应到本文锚点；正文按主题叙述，这里只提供可检索的标识映射。

| 机制 ID | 锚点 |
|---|---|
| `rationale-feature-4.decision-record-lifecycle` | `#m1-decision-record-lifecycle` |
| `rationale-feature-4.capability-declaration-gating` | `#m2-capability-declaration-gating` |
| `rationale-feature-4.durable-authority-and-process-coordination` | `#m3-durable-authority-and-process-coordination` |
| `rationale-feature-4.single-ordering-authority` | `#m4-single-ordering-authority` |
| `rationale-feature-4.boundary-snapshot-and-exact-cut` | `#m5-boundary-snapshot-and-exact-cut` |
| `rationale-feature-4.transactional-unpublished-setup` | `#m6-transactional-unpublished-setup` |
| `rationale-feature-4.fail-closed-configuration` | `#m7-fail-closed-configuration` |
| `rationale-feature-4.compile-time-exhaustiveness` | `#m8-compile-time-exhaustiveness` |
| `rationale-feature-4.bounded-resources-and-streaming` | `#m9-bounded-resources-and-streaming` |
| `rationale-feature-4.typed-evidence-and-uncertainty` | `#m10-typed-evidence-and-uncertainty` |
| `rationale-feature-4.replay-determinism-and-presentation-fidelity` | `#m11-replay-determinism-and-presentation-fidelity` |
| `rationale-feature-4.composition-ownership-and-public-contracts` | `#m12-composition-ownership-and-public-contracts` |
| `rationale-feature-4.explicit-opt-in-and-consent` | `#m13-explicit-opt-in-and-consent` |
| `rationale-feature-4.versioned-compatibility-and-reader-refusal` | `#m14-versioned-compatibility-and-reader-refusal` |
| `rationale-feature-4.authority-not-visibility` | `#m15-authority-not-visibility` |
| `rationale-feature-4.lifecycle-teardown-and-resource-ownership` | `#m16-lifecycle-teardown-and-resource-ownership` |
| `rationale-feature-4.ui-state-accessibility-and-layout-stability` | `#m17-ui-state-accessibility-and-layout-stability` |
| `rationale-feature-4.verification-matrix-and-honest-limits` | `#m18-verification-matrix-and-honest-limits` |
| `rationale-feature-4.no-dead-surfaces-and-clean-cutover` | `#m19-no-dead-surfaces-and-clean-cutover` |
| `rationale-feature-4.cache-prefix-and-context-stability` | `#m20-cache-prefix-and-context-stability` |
| `rationale-feature-4.native-risk-containment-and-platform-gating` | `#m21-native-risk-containment-and-platform-gating` |

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-02-win32-in-process-folder-dialog.md:12-28@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-13-macos-hidden-titlebar-vibrancy.md:12-30@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-16-persistent-pty-sessions.md:41-52@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-unattended-browser-terminal-reclamation.md:11-38@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md:13-29@687f282e