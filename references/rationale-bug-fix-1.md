# 理由域参考：bug-fix Note 中的可迁移治理机制

本文件是 `rationale-bug-fix-1` 分区的独立参考，覆盖 95 条英文 bug-fix Agent Note（91 条 `archived`、4 条 `implemented`）、对应的 95 条中文正文和 95 个双语一致性记录（`.i18n.yaml`）。它不是 95 篇摘要的堆叠，而是从这些事故记录中抽取的可执行机制、失败信号、采用步骤和证据限制。

## 0. 阅读前提

### 0.1 证据等级

- 本分区读取原始仓库固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中的 Note 正文、中文正文、侧车记录、固定清单/分配文件和两份提取契约；另对 RB03 做了少量源码定点核对（见 0.1 后续条目）。
- Note 中「Status: implemented」表示该 Note 记录的 source 改动状态；它不等于本参考在目标项目中已验证。所有目标验证在本轮均为 `planned`，没有构建、测试、lint、格式化或运行时执行。
- 机制字段中的 `confidence` 表示「Note 文本到机制的解读置信度」，不是实现仍有效的证明。
- Note 正文是主要证据；实现文件仅对 RB03 的 `sessions.using` 调用点和 `SessionReferenceSourceMap` 扩展标签做了定点源码核对（见该节「源码口径」），未做全量实现审计。其余实现细节以 Note 陈述为界，不额外推断。

### 0.2 引用格式

本文来源行使用固定格式：

`deepseek-harness/<path>:<start>-<end>@687f282e8625c6b8d11ff58211a90524be2e4317`

例如 `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-20-error-cause-chain-diagnostics.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317` 表示该 Note 英文正文第 1 至 38 行（全文）已读。全部 95 条的精确范围、处置和机制映射保留在发布者内部 coverage 台账中，不随公开包分发；机制的结构化版本见 [../knowledge/rationale-bug-fix-1.json](../knowledge/rationale-bug-fix-1.json)。每节「来源」列出主要证据；完整的 `sources` 数组（含每条 Note 的机制归属）在 knowledge JSON 中。

### 0.3 证据状态与「当前强制」边界

- 95 条 Note 分两层：91 条 archived 是历史事实/教训；4 条 implemented（2026-09-20 session-open、2026-09-29 reused blank、2026-09-30 job lifecycle、2026-09-30 session-list）是权威的 source decisions，不能降级为「仅历史」。
- 但 source decision 的权威是决策层，不是 current code enforcement：本参考只对 RB03 的调用点和扩展标签做了定点源码核对，没有做全量实现审计，`currentEnforcementClaims` 仍为空；`currentSourceVerification` 记录为部分定点核对、未做全量复验。任何「当前源码/策略已强制」的结论都需要 current owner 的完整已读实现证据。
- Note 引用的实现文件除 RB03 的定点核对之外未在本分区独立阅读；任何 current owner/implementation 结论必须由已读证据绑定，未绑定时保持 unbound。
- 4 条 implemented Note 的中文正文已读，但未做逐句语义等价审计；侧车的标题/en/zh 计数只说明配对记录结构，不等于语义等价。
- implemented decisions 的边界必须随机制保留：session-open 不是全局 singleflight，`ready` settle 不等于成功，只覆盖当前 generation 的初次打开，且不新增 Host Agent 授权/取消协议；job lifecycle 不保证 teardown 顺序或缺失终态重建；time-sliced list 不保证 cross-Session atomic cut。

### 0.4 机制总表

| ID | 机制 | 何时用 | 最小产物 |
|---|---|---|---|
| rationale-bug-fix-1-RB01 | 保留因果链并把退化成功归类为可重试边界错误 | 适配器、传输、turn 结束、子代理输出 | cause 链、非 completed reason、canonical output |
| rationale-bug-fix-1-RB02 | 确认缺失与元数据不可用分离，身份失败关闭 | 读元数据、索引、目录、shell 打开 | 错误类别映射、fail-closed 身份 |
| rationale-bug-fix-1-RB03 | 持久记录先绑定稳定身份，再做显示投影 | 会话/工作区/任务/锁/标签恢复 | 身份元组、冲突拒绝、legacy 标记 |
| rationale-bug-fix-1-RB04 | 分派前完成原子准入，只通过一个排序点发布 | 图片/模型选择、消息总线、重放、互斥编辑 | ordering chain、envelope 对齐、wake latch |
| rationale-bug-fix-1-RB05 | 失败步骤关闭前补齐未决 tool call 的显式结果 | failed step、paired tool call/result | call/result 位图、unknown/not-started |
| rationale-bug-fix-1-RB06 | 进程/锁/管道完成点可观测，等待有界 | 子进程、pnpm、锁接管、脚本运行时 | 退出观察、输出排空、超时分类 |
| rationale-bug-fix-1-RB07 | 热重载按补偿事务处理 | 配置/插件热更新 | 候选验证、等待结算、补偿、failure event |
| rationale-bug-fix-1-RB08 | 测试命中真实执行/生效边界 | 权限、构建豁免、UI 几何、手势 | 强制点断言、错误类别豁免、coverage canonicalization |
| rationale-bug-fix-1-RB09 | 持久证据保持原样，兼容降级只在出站投影 | 历史消息、tool input、用量、重放 | 冻结记录、block type 省略、中性 fold |
| rationale-bug-fix-1-RB10 | 派生视图只从完成事实和原始来源计算 | 计数、fork/retry、transcript、分页 | 完成事实索引、turn tail、append-origin |
| rationale-bug-fix-1-RB11 | 队列/扫描/并发有上限、线性 drain 与让出 | backlog、分页、单 Host 列表、批处理 | consumer 上限、circular deque、单调时间片、取消点 |
| rationale-bug-fix-1-RB12 | Windows 路径/字符串/进程使用明确的 UTF-16/重解析点/创建期语义 | Win32 路径、junction、子进程、Store alias | code-unit NUL、str16 pointer、creation flags |
| rationale-bug-fix-1-RB13 | 能力准入放在 Host/执行器，页面不可信 | 工具执行、附件、WebView、writer | dispatch 前过滤、私有通道、typed busy |
| rationale-bug-fix-1-RB14 | 模型投影复用真实能力/编码规则，截断代表性可见 | 多模态、glob、压缩摘要、保留策略 | 能力表、sample 披露、原始引用 |
| rationale-bug-fix-1-RB15 | 适配器升级/设置恢复/提示组合显式分类 | SDK/插件升级、catalog、包导入、提示 | 字段映射、持久化恢复、distinct order |
| rationale-bug-fix-1-RB16 | 交互时序用显式状态/宽限/所有权 | 浮层、outside click、草稿、claim | 状态机、same-tick echo、实体 id |
| rationale-bug-fix-1-RB17 | 布局/滚动/显示状态单一所有权，测试相对几何 | 折叠、sticky、覆盖层、列表、响应式 | owner 表、clip/scroll 分离、恢复控件 |
| rationale-bug-fix-1-RB18 | 指导/预设/目录内容由真实挂载与提交事件校验 | 预设、插件 root、slash catalog | 真实 mount 校验、roster 错误行、commit 失效 |
| rationale-bug-fix-1-RB19 | 已确认事实/目标执行/未决问题分层记录 | 交付、审计、采用决策 | evidence 等级、limitations、unresolved |
| rationale-bug-fix-1-RB20 | 并发测试基础设施隔离 runner 安装目录与真实夹具 | CI、包管理器测试、端到端 | runner-private dest、安全 teardown |
| rationale-bug-fix-1-RB21 | owned-run finish reason 是区间观察，不是 prompt 因果 | Python SDK owned interval | last turn/end kind、None、protocol error |
| rationale-bug-fix-1-RB22 | owned job 生命周期只写持久观察 | job register/settle、SDK history | UUID JobId、producerReported、incomplete |

---

## 1. 诊断与缺失语义

<a id="rationale-bug-fix-1-RB01"></a>

### rationale-bug-fix-1-RB01 保留失败因果链，并把退化成功归类为可重试的边界错误

**触发。** 适配器/传输层把下层异常转换成本层错误；模型返回空内容、流被截断或停止原因未知；同一 turn 重试；子代理 terminal message 没有内容块。

**必须做。**

1. 在捕获点保存原始错误、`cause`、错误码和传输元数据；不要在捕获点把 message 重写成人类可读句子后丢掉 cause。
2. 已识别的 mid-stream `terminated`/`Premature close` 与终止事件前 `stream ended before/without` 截断映射为 `TRANSPORT`，由已组合的 `llm-retry` 默认策略有界重试；未分类 `PI_AI_ERROR` 仍非默认可重试，不能整桶放宽。pi-ai 已丢失 cause 时只在适配器按来源模式做 best-effort 文本分类并保留原 notice，不伪造 cause；上游提供 code/cause 后再替换 workaround。
3. `stop` finish 且零 content blocks 的 `completed` 响应不是成功零内容，而是 provider 边界的可重试错误；重试耗尽后 fail turn。whitespace-only/reasoning-only 携带模型内容，仍算成功。
4. TUI 必须为每个非 `completed` 的 `turn/end` 显示停止原因；`completed` 由最终 assistant message 与 `Completed` timing header 表示；未知插件 `kind` 也要按名称显示，不能留白。同一 turn 的重试不能在历史中抹掉终态错误行。
5. 子代理输出选择器按确定性规则找 canonical output：取最后一条非空 Assistant message；没有则取 embedded `assistant/message`/`assistant/attempt` 流或 chunk-only transport 累积的 `text-delta`；空 content message 不参与选择。两种形式都不存在时 lifecycle 字段为 absent，而不是显式错误；`max-tokens`/`aborted` 仍保留真实 stop reason。
6. 工具行打开文件被 Host 拒绝时，显示拒绝原因和重试入口；不要吞掉错误只留下无响应。

**完成信号。** 可获得的 cause 链被保留，已压平丢失的 detail 如实披露；已识别传输截断路由为可重试 `TRANSPORT`，未知错误不被一并放宽；每个非 `completed` 的 `turn/end` 有 reason，重试事实可追溯，空完成不冒充成功。

**失败/例外。** 空响应判定只覆盖 `stop` finish 且零 content blocks；whitespace-only 与 reasoning-only 响应携带模型内容，仍算成功，不按 empty 重试。模型确实想空回复（罕见，可能出现在 tool result 之后）时会先被重试；持续为空则 turn 失败——这是来源明确接受的取舍：空 assistant message 与 provider 缺陷无法区分，对用户没有价值。来源没有 provider 语义白名单，也不能据此抑制该重试/失败路径。分类无法确定时保留 `unknown` 并上抛，不要猜成 retryable。

**迁移步骤。** 先改诊断包装器，再改 turn 状态机，最后改 UI 的 reason/canonical output 读取。测试至少覆盖：截断、空完成、未知停止原因、同轮重试。

**证据与限制。** Note 报告了 source 的修复，但本分区未运行任何 adapter/流式测试；不同 provider 的截断与空响应语义不一致，迁移时必须逐 provider 验证。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-20-error-cause-chain-diagnostics.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-22-pi-ai-transport-truncation-classification.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-24-empty-model-response-is-retryable.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-turn-error-survives-same-turn-retry-history.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-subagent-empty-terminal-message-output.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-18-tool-row-file-open-failure.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-24-tui-turn-end-stop-reason-notices.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB02"></a>

### rationale-bug-fix-1-RB02 确认缺失与元数据不可用必须分离，身份判定失败关闭

**触发。** 读取 root marker、workspace/session 元数据、Web 索引路径、目录项或 shell 关联。

**必须做。**

1. 建立错误类别映射：`ENOENT/EISDIR/ENOTDIR` 等「确实不存在/类型不符」与 `EACCES/EIO/解析失败` 分开。只有前者可以变成 not-found 或空结果。
2. 身份判定所需元数据不可读时 fail closed：不要生成空 workspace、空 session 或「无标题」身份。
3. 目录 junction/重解析点必须以目录语义列举，不能当作不可读文件，也不能在遍历时穿透到目标。
4. Windows shell 打开/揭示必须把默认关联解析交给 `explorer.exe`：target 作为一个 argv 元素，file URI 只对 Explorer 自己解析的逗号/等号 percent-encode，非 ASCII 保持 literal。Explorer 的 exit 0/1 不能区分「已打开」与「拒绝」；调用方不得伪造无关联错误或声称窗口出现。交互式 desktop session 是前提；非交互 session 会退化为 exit 1 且没有 fallback。
5. 在 UI/API 层，把「不可用」作为可诊断状态暴露（原因、重试），不要与「不存在」共用同一个空态。

**完成信号。** 每个读取路径都有「缺失/不可用/成功」三态；不可用不会进入身份缓存；HTTP 层只有确认缺失才 404。Windows 打开路径有确定的 handoff 语义，但不声称能判断窗口是否出现。

**失败/例外。** 明确标记为 optional 的元数据可以 best-effort，但读取失败仍要记录，不得伪装成空值。对不暴露可区分 errno 的平台，需要适配层补充探测。Explorer 的 0/1 不是关联错误信号；非交互 Windows session 会失去 open 能力。

**迁移步骤。** 先枚举所有 `catch -> 空值/默认值` 的读取点；按类别重写；再补身份 fail-closed 和 junction/shell 测试。

**证据与限制。** 平台错误码映射来自 Note 的陈述，未在 Windows/macOS/Linux 实测；部分 provider 可能无法区分错误类别。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-root-marker-metadata-failures.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-explicit-web-index-paths.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-18-windows-directory-junction-listing.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-windows-open-through-shell-resolution.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`

---

## 2. 持久化、并发与生命周期

<a id="rationale-bug-fix-1-RB03"></a>

### rationale-bug-fix-1-RB03 持久化记录先绑定稳定身份，再用显示字段做投影

**触发。** 创建/恢复 JSONL 会话、workspace、session row、schedule task、job 或锁记录；复用空白 run/session/tab；分页/过滤列表；锁持有者退出。

**必须做。**

1. 每类持久记录定义最小身份元组：至少稳定 id + kind/scope；需要版本演进的加 revision。basename、标题、cwd、tab 槽位只是显示/定位字段，不能单独作为唯一键。
2. 读取时按身份元组查询；禁止「最近修改时间最接近」「同名就选第一个」「空白就认领」这类推断。
3. 复用空白 run/session 前校验：workspace membership、请求的 preset、调用者 scope。请求命名了 preset 时不能被当前默认值覆盖；请求未命名时按配置默认。
4. session row 的身份覆盖 preset/revision；preset 切换后旧投影必须失效。
5. 锁接管仅凭 PID probe 的 `ESRCH` 证明退出；以原记录 SHA-256 前16位命名、`wx` 创建 claim，claim 内重读相同记录并再次探测，仍退出才移除并重试获取。`EPERM`、自身 PID、无效记录或已复用 PID 均保留；无接管代数计数器。仅支持共享 PID 命名空间的本机部署，claim 持有者崩溃可能需人工清理。
6. 无法确定身份的旧记录标记为 `legacy/unresolved`，提供人工确认路径，不要自动合并。

**Implemented source decisions（决策层权威；当前代码未复核）。**

- **session-open（2026-09-20）。** 共享等待只发生在实际辅助 RPC 调用点（`sessions.using`），而不是只延迟 prewarm hook；Note 的表列出四类消费者/五个 RPC，当前源码有五个生产调用点。它不是全局 cold-read singleflight，也不合并每个未完成冷读的 Promise。`ready` 只表示初始 `Session.open()` 尝试已 settle，不表示成功；消费者还必须检查 `openState === 'open'`，失败打开后不再发辅助 RPC。等待只覆盖当前 Client generation 的初次打开，不覆盖每次 follow 替换后的就绪；重连/异常重试仍需单独验证。该决策不新增 Host Agent 授权，也不新增 Commands/Goals 的取消协议；既有 signal 保留，正常 Agent resume 在 opening snapshot 后仍允许。真实入口是有限枚举的实际 RPC 调用点，不是全局锁；源码侧 `SessionReferenceSourceMap` 当前有 8 个扩展标签（`commandCatalog`、`goalActivation`、`referenceCandidates`、`mainView`、`sidebarView`、`skillCatalog`、`sidebarChat`、`workspaceOperation`），其中只有四类辅助读取/五个 RPC 走 Note 的等待，view 标签不是辅助 RPC。已知缺口：header 根 catalog/menu 加载提示仍缺失；stale tests（旧 fixture 名、root-menu refresh 期望、Sidebar parent-refresh 前置、Team 拒绝缺失 catalog）是 gap，不是通过证据。
- **reused blank（2026-09-29）。** 命名 blank 只是复用候选；Host 必须在 writer 下重复 started 检查，校验请求目录、Workspace 成员与所有权。复用运行请求的 `agentPreset` 或配置默认，不解析记录中的 preset；因此旧默认/已删除定义不会继续继承。
- **job lifecycle（2026-09-30）。** UUID `JobId` 是 live control 与 historical record 的身份；`producerReported`、incomplete 终态、append 顺序与 teardown 边界由 RB22 单独承载，不在 RB03 重述。

证据：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-20-session-open-read-coordination.md:23-36@687f282e8625c6b8d11ff58211a90524be2e4317`、`:49-56@687f282e8625c6b8d11ff58211a90524be2e4317`、`:73-75@687f282e8625c6b8d11ff58211a90524be2e4317`、`:81-81@687f282e8625c6b8d11ff58211a90524be2e4317`、`:85-86@687f282e8625c6b8d11ff58211a90524be2e4317`；`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-29-reused-blank-runs-requested-preset.md:11-15@687f282e8625c6b8d11ff58211a90524be2e4317`；`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-30-job-session-lifecycle.md:11-17@687f282e8625c6b8d11ff58211a90524be2e4317`。源码口径：`deepseek-harness/packages/api/session-controller/src/client/index.ts:79-88@687f282e8625c6b8d11ff58211a90524be2e4317`；扩展标签分别见 `deepseek-harness/packages/client/ui-commands/src/client/service.ts:39-43`、`deepseek-harness/packages/client/ui-goal/src/client/index.ts:46-50`、`deepseek-harness/packages/client/ui-reference/src/client/index.ts:38-42`、`deepseek-harness/packages/client/ui-session/src/client/index.ts:189-193`、`deepseek-harness/packages/client/ui-sidebar-right/src/client/session-view.ts:6-10`、`deepseek-harness/packages/client/ui-skill/src/client/index.ts:57-61`、`deepseek-harness/packages/client/ui-subagent/src/client/sidebar-chat/index.tsx:29-33`、`deepseek-harness/packages/client/ui-workspace/src/client/index.ts:85-89`（均 `@687f282e8625c6b8d11ff58211a90524be2e4317`）。

**完成信号。** 同名 basename/标题、同 tab 复用、preset 切换、锁接管四类场景都能给出确定结果（正确记录或显式冲突），不会静默错配。

**失败/例外。** 某些纯展示实体确实没有持久身份；它们不能反过来成为可恢复/可写入实体的身份来源。迁移旧数据时允许保留无身份记录，但读取必须显式标记。

**迁移步骤。** 先改 schema 和写入点，再改所有读取入口，最后改 UI 投影；不要先改 UI。

**证据与限制。** 身份元组是 source 实现细节，迁移项目需要定义自己的最小集合；Notes 未提供通用旧数据迁移器。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-20-jsonl-storage-identity.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-same-basename-workspace-adoption.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-session-row-identity-covers-the-preset.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-24-exited-holder-lock-takeover.md:1-52@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-20-session-open-read-coordination.md:1-88@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-resume-selector-batch-projection.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-05-workspace-blank-session-reuse-membership.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-18-schedule-task-tab-restore.md:1-46@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-29-reused-blank-runs-requested-preset.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-30-job-session-lifecycle.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB04"></a>

### rationale-bug-fix-1-RB04 分派前完成原子准入，只通过一个排序点发布，取消先落锁存

**触发。** 图片/消息/子代理任务入队或发远端；同一逻辑请求重放；取消与工作同时活跃；多个 produce/consume 需要稳定顺序；互斥编辑。

**必须做。**

1. 准入决定（图片尺寸、格式、能力）在 dispatch/队列写入之前完成；失败时回滚占位，不能留下半个任务。
2. 图片准入与 model selection 共享同一私有 promise chain，形成单一排序点：selection 先则准入观察新模型并拒绝不支持图片；准入先则附件与事件发布完成后才允许切换路由；文本 prompt 不进入该链。
3. max-token 重放的 `replayState` 必须与 emitted blocks 同源对齐；envelope/block 数量不匹配时整包丢弃；不得创建第二条逻辑请求。
4. model-authored adjacent-Agent message 固定使用 Steer delivery；running parent 在最近 safe step boundary 读取，idle parent 开新 turn；不提供 quiet/next-turn model 选项。
5. continuation manager 用 `sendWaking()` + private `SubagentInbox` 保证 settlement 不越过 accepted waking send；accepted attempt 在返回前 renew wake generation。
6. 取消先写 wake latch/状态，再唤醒；等待者被唤醒后检查终态。取消后仍要收敛，不得永远停在 cancelling。
7. 互斥编辑（drill 等）先成功 claim，再修改；claim 失败不得产生副作用。

**完成信号。** image admission 与 model selection 的两种先后顺序都有确定结果；max-token replay 不产生第二条逻辑请求；取消与完成同时到达不会丢唤醒或双发布；claim 失败无编辑副作用。

**失败/例外。** 某些队列允许「至少一次」投递；这时消费者必须幂等，不能把去重责任推给上游。排序点可以是单线程事件循环、数据库序列或显式 sequencer，但必须唯一。图片排序链不是通用去重层，幂等键仍由各队列定义。

**迁移步骤。** 先找所有入队/发送入口，把校验前移；再引入单点发布；最后补取消/重放测试。

**证据与限制。** 幂等键结构因队列而异，Notes 未给统一方案；真实竞态未在 source 运行中复现。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-atomic-web-image-admission.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-15-max-token-replay-state-alignment.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-17-subagent-message-settlement-ordering.md:1-45@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-07-cancel-convergence-wake-latch.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-drill-claim-precedes-the-drill-edit.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB05"></a>

### rationale-bug-fix-1-RB05 失败步骤关闭前为每个未决 tool call 写入显式结果，不伪造成功

**触发。** turn/step 以失败、取消或超时结束；assistant message 已记录 tool calls，但 scheduler 未完成全部 result；需要在 resume/fork 后保持 call/result 配对。

**必须做。**

1. 从 committed events 增量维护 pending call identities；失败时先停止 scheduler replenishment，并 drain 已启动 dispatches。
2. 在关闭 failed step 前，按 assistant 的 call 顺序为每个未完成 call 写入结果：有 `tool/call` 无 result -> `TOOL_OUTCOME_UNKNOWN`；assistant 请求了但无 call record -> `TOOL_NOT_STARTED`。
3. 恢复结果必须保守：unknown 文本警告不要盲目重试可能有副作用的操作；不得声称成功、取消或无副作用。
4. 保留已提交结果与原有顺序；只追加缺失结果，不删除 assistant message、不替换已完成结果、不执行工具、不把 failed turn 变成 success。
5. live failed-step recovery 与 `interruptedTurnClosers` 共享 incremental pending-call tracking/result construction；live driver 仍拥有 step/turn 事件。

**完成信号。** 失败步骤的 tool-call 数等于 result 数；已提交结果与顺序不被替换；resume/fork 后 call/result 配对有效。

**失败/例外。** 某些工具本来就没有结果（例如纯通知）；这需要在工具定义中声明「无结果」语义，而不是让最终化器猜。`TOOL_OUTCOME_UNKNOWN` 不代表取消或没有副作用。

**迁移步骤。** 先建立未决调用清单，再改失败步骤的最终化路径，最后补失败/取消/resume 测试。

**证据与限制。** `TOOL_OUTCOME_UNKNOWN`/`TOOL_NOT_STARTED` 的 wire 表达由项目协议决定；已关闭的不一致历史不变；failed log append 无法被修复。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-failed-step-tool-results.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB21"></a>

### rationale-bug-fix-1-RB21 owned-run finish reason 是区间观察，不是 prompt 因果

**触发。** Python SDK 需要 `RunResult` 级 finish reason；区间从 submitted message 的 durable inbox receipt 到 next whole-agent idle；区间内可能包含 steering/injected/queued work。

**必须做。**

1. `RunResult.finish_reason` 取区间内最后一个 root-session `turn/end` 的 string `kind`。
2. 没有 `turn/end` 时返回 `None`；存在 `turn/end` 但 `data.reason.kind` 不是 string 时抛 `SdkProtocolError`，不能伪装成「没有 turn ending」。
3. 字段描述 owned run interval，不得归因到 submitted prompt；不得展示为 initiating prompt 的因果结果。
4. 只暴露 kind；完整 structured reason 留在 `RunResult.events`。transport loss/timeout/protocol failure 仍抛错，不产生 finish reason。
5. in-repo TypeScript SDK 只通过 typed events 暴露 finish-reason observation，不承诺同名字段。

**完成信号。** SDK 能分支 `completed`/`max-tokens`/`error` 等 kind；`None` 只在无 turn/end 时出现；malformed reason 与 transport failure 不被吞掉。

**失败/例外。** 区间可能包含 non-initiating work；最后一个 root turn/end 不一定是 submitted prompt 的因果结果。TS SDK 的事件能力与 Python 字段不同。

**迁移步骤。** 记录 durable inbox receipt；收集 root-session turn/end 直到 whole-agent idle；选择最后一个并提取 kind；保留 events 中的完整 reason，不映射到 prompt。

**证据与限制。** Note 是 archived（Status implemented），本分区未核对当前 Python SDK；`None`/malformed reason 必须由协议测试固定。源 Verification 只报告「最后一个 turn ending、无 turn ending、malformed reason」三类测试；transport loss/timeout/protocol failure 抛错且不产生 finish reason 是 Decision 规定，必须作为额外 rejection 场景执行，当前仍为 planned，不能声称已覆盖。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-owned-run-finish-reason.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB22"></a>

### rationale-bug-fix-1-RB22 owned job 生命周期只写持久观察，不承担调度/资源释放

**触发。** owned job register/settle；需要重建执行区间或审计历史；registry restart、copied history、teardown；producer 拒绝或 teardown cancellation。

**必须做。**

1. 捕获 `job/registered`/`job/settled`，保留 epoch-ms timestamps、original owner、producer kind、label 与 optional creating tool call。
2. UUID-backed `JobId` 同时标识 live controls 与 historical records，跨 registry restart/copied history 稳定；unowned work 不写 Session journal。
3. `producerReported` 当且仅当 `JobHooks.done` fulfilled 为 true；rejection 或 teardown cancellation throw 时为 false；它只报告 fulfillment，不表示资源释放。
4. 缺失 terminal record 保持 incomplete，不由 later reads/process restart 重建；不得合成 terminal。
5. facts 在 registry commit 处同步 append，先于 live hub reactions 与 completion waiter 恢复；recording error 只 warn，不阻止 cleanup 或 waiter 释放。
6. journal 是 durable observation，不是 live execution、resource ownership 或 event routing；teardown 可能先关闭 Session routing/writer，造成 incomplete history。
7. 不强制 cross-fiber disposal order；interval 覆盖 registration 到 settlement（含 producer work/cleanup），不是 CPU time 或 rollout latency。

**完成信号。** SDK 能从 durable facts 重建 owned job interval；late settlement 保留 registration identity；append failure 可见但不阻止 cleanup；缺失 terminal 明确为 incomplete。

**失败/例外。** journal 不恢复外部 process/output ring；teardown 顺序无保证；recording failure 可留下 incomplete history；SDK `run()` 只覆盖 bounded observation windows。

**迁移步骤。** 在 registry commit 前同步 append registration/settlement；保留原 timestamp/owner/producer kind/label/tool call；用 UUID JobId 关联 live/history；区分 producerReported 与 forced bookkeeping；缺失终态保持 incomplete。

**证据与限制。** Note 是 implemented source decision（2026-09-30），本分区未核对当前代码；teardown/cross-fiber disposal order 不受保证。

**来源。**

- `deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-30-job-session-lifecycle.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB06"></a>

### rationale-bug-fix-1-RB06 进程、锁与管道的完成点必须有可观测证据，等待必须有界

**触发。** 终止子进程树、运行 pnpm、等待 shell 命令；持有/接管文件锁；读取子进程输出；Python/脚本运行时 load、settle 或 dispatch。

**必须做。**

1. 终止后等待进程真正退出（含同组子进程）；不能以 signal 发送成功、父进程已死或 pipe EOF 作为完成。
2. 有界运行以原始 child 的 `exit` 为完成点，而不是 execa 的 promise/pipe 关闭；随后在固定 grace 内排空 stdout/stderr，静默超过 `idleTimeoutMs` 则终止并分类为 timeout。只 kill 父进程会留下子进程和写阻塞。
3. 锁接管验证持有者退出事实与身份；不能只看锁文件存在。接管要串行化 claim、重读验证，防止 PID 复用与双持有。
4. 结算覆盖成功、异常、超时、取消和部分输出；不能只读 exit code。
5. Python 运行时桥接在 load 时拒绝自包含配置错误（显式 `pythonBin` 必须是 executable regular file）；binding callables 在 validation 时 snapshot 一次；reply drain 同时监听 `drain`/`close`/`error`；leak 断言只针对本测试 staged 的精确路径。
6. 平台差异显式处理：Linux scope、Windows 进程树、shell 会话各有不同完成语义。

**完成信号。** 运行返回 `exit code + signal + timeout + output完整性` 的组合结果；没有残留进程；锁接管有确定结果；destroyed pipe 不会让 reply drain 永久挂起。

**失败/例外。** 某些守护进程故意脱离父进程；这需要在进程模型中标记为 detached，并采用不同的完成/清理策略。超时后允许升级为强制终止，但仍要观察退出。timeout 不能因为 signal 留下的 exit status 被误判为成功。

**迁移步骤。** 先替换「kill 即完成」「读一行即成功」；再补进程树/输出排空；最后给所有等待加超时与分类。

**证据与限制。** Windows/Linux 语义不同；pnpm 有界运行在 source 中仍有 workaround；本分区未运行进程测试。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-12-linux-scope-direct-kill-settlement.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-23-bounded-pnpm-runs.md:1-60@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-24-exited-holder-lock-takeover.md:1-52@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-code-runtime-python-settlement-fixes.md:1-152@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-load-and-dispatch-hardening.md:1-42@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB07"></a>

### rationale-bug-fix-1-RB07 热重载按等待完成的补偿事务处理：候选验证、回滚与错误可见

**触发。** 配置/插件被修改并触发热重载；HMR 需要释放旧模块；候选配置非法或依赖初始化失败。

**必须做。**

1. 读取候选 -> schema/语义验证 -> 计算差异；验证失败保持旧配置可用。
2. 模块改名先 import 再释放活动 fiber；等待候选应用和组内全部 outcome，失败时恢复变更、增删与移动。
3. 只有成功结算才提交缓存解析数据/持久化 programmatic mutation；HMR 对 refresh 拒绝归一化并广播 typed failure，不把它变成未处理启动失败。
4. HMR dispose 排空活动工作，区分「被拒绝的更新」与「未处理的启动失败」；dispose 期间的新工作按策略拒绝或排队。
5. 并发重载序列化，不让两次更新交错。

**完成信号。** 应用 Promise 等待生命周期结算，最终接受版本稳定；补偿成功后旧配置可用，失败不提前提交缓存/持久状态。中间生命周期效果可以短暂可见，不承诺所有读者始终看到同一版本；补偿失败报告 `AggregateError`，可能留下不可用项，不得报为完整恢复。

**失败/例外。** 任意插件副作用不能快照，来源明确拒绝 invisible atomic replacement。缺失依赖的 service-gated fiber 可以有效 pending，结算不代表依赖全都存在；HMR disposer 关闭 watcher 并排空活动工作。不可把 failed rollback 隐藏为旧树仍完好。

**迁移步骤。** 先给配置加候选验证和补偿接口，再序列化重载，最后补失败注入测试。

**证据与限制。** 补偿能力依赖子系统可逆性；HMR 生命周期与构建工具绑定；本分区未运行热重载测试。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-20-config-hot-reload-resilience.md:1-42@687f282e8625c6b8d11ff58211a90524be2e4317`

---

## 3. 执行边界、测试与指导校验

<a id="rationale-bug-fix-1-RB08"></a>

### rationale-bug-fix-1-RB08 测试必须命中真实执行/生效边界，而不是表面结构

**触发。** 安全/权限测试；构建产物/覆盖率/路径豁免；窄视口或真实浏览器布局；手势/可编辑区域判定；测试运行器自身的安装目录。

**必须做。**

1. 画出从入口到副作用的执行链，标出唯一强制点；在强制点上断言成功与拒绝，而不是只在 UI/presentation 层断言。
2. 工具 schema 省略不是禁用；执行器必须按能力过滤。测试要直接调用执行器，绕过 UI。
3. 布局测试用真实容器几何和相对不变量；不要用绝对像素、位置索引或实现细节。
4. 构建/导入豁免按错误类别本身（例如 Node 的 unknown `.css` extension），不绑定具体 stylesheet 路径；另一 extension、另一 error code、无关 message、以及豁免 bundle 能 clean import 都仍必须是 finding。
5. 分区覆盖率在 blob merge 前把非有限 end column 归一化为 `Number.MAX_SAFE_INTEGER`（行尾哨兵），让不同环境的同一 statement 在序列化后仍能 reconcile；这不是豁免，per-file 100% gate 保持，且无 istanbul `data` 的 payload 要 loud reject。
6. 真实浏览器测试要能在目标视口复现；测试替身不能替代真实 editable 元素/挂载。

**完成信号。** 安全关键路径有执行边界断言；豁免按错误类别而不是 pinned path；分区合并后无 phantom uncovered statement 且 per-file gate 仍为 100%；UI 几何测试在真实视口可复现。

**失败/例外。** 单元测试可以覆盖纯逻辑，但不能作为权限/准入的唯一证据。某些平台无法在 CI 跑真实浏览器时，至少要有可重复的本地/专用 runner，并标记 CI 缺口。canonicalization 依赖 Vitest reporter 的 `onCoverage`/`onTestRunEnd` 顺序；升级若调换 hook，phantom 会回归。

**迁移步骤。** 先列出安全/权限关键路径的强制点；把展示层测试改到强制点；再补另一 extension/error code/message/clean import 的负向案例。

**证据与限制。** 测试实现依赖 source 栈；真实浏览器几何受字体/滚动条影响；Notes 只覆盖部分视口。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-07-ptc-executor-collapse.md:1-47@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-plan-narrow-viewport-regression.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-26-composer-gesture-editable-gate.md:1-26@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-10-built-bundle-css-exemption.md:1-26@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-13-partitioned-coverage-location-canonicalization.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB13"></a>

### rationale-bug-fix-1-RB13 能力准入与信任边界放在 Host/执行器，页面/展示层不可信

**触发。** 工具 schema 暴露给模型但执行器仍需过滤；图片/附件进入会话；嵌入式 WebView 请求特权操作；会话写入与 writer 锁竞争。

**必须做。**

1. 执行器在 dispatch 前按能力/权限过滤；schema 省略不是禁用。
2. 附件准入在 Host 侧原子校验，并与模型选择共享同一排序点；不支持图片/越权的附件显式拒绝，不留下半发布状态。
3. 嵌入式页面只通过私有 MessageChannel/能力令牌请求特权操作，不信任页面消息来源。
4. writer 被持有时写入返回 typed failure（如 busy），不静默排队到无界，也不丢弃。
5. 所有拒绝都有 typed 错误码，便于调用方决定重试/终止。

**完成信号。** 绕过 UI 直接调用执行器仍被拒绝；伪造页面消息无法触发特权操作；writer 竞争有确定结果且无半记录。

**失败/例外。** 能力模型可以按租户/会话收窄，但收窄必须发生在执行器，不是只在 UI 隐藏。私有通道的密钥/令牌要有生命周期和范围。

**迁移步骤。** 先找所有「UI 已隐藏」的权限判断，下沉到执行器；再补绕过 UI 的负向测试。

**证据与限制。** 能力清单是项目特定；私有 MessageChannel 的安全属性未在本分区独立审计。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-atomic-web-image-admission.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-07-ptc-executor-collapse.md:1-47@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-27-steer-followup-image-delivery.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-16-session-writer-held-feedback.md:1-26@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-20-windows-embedded-mandatory-update.md:1-26@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB18"></a>

### rationale-bug-fix-1-RB18 指导/预设/目录内容必须由真实挂载与提交事件校验

**触发。** preset/指导文档声称某种行为；插件提供自带 preset root；preset 切换后需要更新 slash catalog；损坏 preset 需要展示。

**必须做。**

1. 指导内容由真实 mount/执行验证；声明、快照或测试替身不能替代最终组合。
2. 损坏 preset 以显式 roster 行呈现错误；发现健康与验证结果分开，其他 preset 仍可用。
3. 插件自带 root 由插件拥有；宿主不得越权覆盖，失败要可见。
4. catalog 在 preset 切换的 commit 事件后失效/重建，不能读取时缓存旧目录。
5. 需要稳定相对位置的提示 section 使用 distinct `order`；其他 equal-order section 仍按 activation order。不要新增 registry 名称 tie-breaker 或声称所有提示全局稳定。

**完成信号。** 真实 mount 的 composition 与声明一致；损坏项可见且不阻塞其他项；切换 preset 后 catalog 立即更新。

**失败/例外。** 真实 mount 成本高，可以用最小挂载夹具，但不能只用静态声明。插件 root 的只读/可写权限要按所有权模型定义。

**迁移步骤。** 先建立真实 mount 校验；再分离 discovery/validation；最后在提交事件上重建 catalog。同时为需要稳定相对位置的 prompt sections 分配 distinct `order`（其他 equal-order 保留 activation order），不新增 registry 名称 tie-breaker。

**证据与限制。** 真实 mount 夹具是项目特定的；插件所有权模型依赖 source 插件系统。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-09-broken-preset-roster-rows.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-slash-catalog-follows-preset-switch.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-preset-authoring-agent-validates-its-own-composition.md:1-74@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-plugin-owned-shipped-preset-root.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-24-system-prompt-section-order-ties.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB20"></a>

### rationale-bug-fix-1-RB20 并发测试基础设施使用私有资源与真实夹具

**触发。** pnpm/包管理器在测试中运行；多个测试并发使用 runner 安装目录；浏览器/UI 测试需要清理真实夹具；热重载/进程测试需要独立工作目录。

**必须做。**

1. 每次 workflow run/attempt（Windows 再加 job）使用 runner.temp 下私有的 pnpm setup `dest`；不共享安装目录。包下载 store/cache 仍可共享，但必须显式声明。
2. 夹具清理识别 junction/重解析点，避免穿透删除；删除前显式 unlink。
3. teardown 等待子进程退出并清理私有资源；失败时保留可诊断目录，不污染其他用例。
4. CI 中限制并发与资源回收，避免资源耗尽被误判为测试失败。
5. 覆盖率路径 canonicalization 可跨域复用，但不能代替测试资源隔离。

**完成信号。** 两个并发 run/attempt 不共享 pnpm setup dest；共享 store 仍可并发；teardown 后无残留子进程/临时目录；夹具删除不触碰目标目录。

**失败/例外。** 某些集成测试必须共享真实服务；这时要用隔离命名空间/租户，并显式声明共享资源，不能默默共用。

**迁移步骤。** 先给测试 harness 加私有根和 teardown，再修 junction 删除，最后在 CI 验证并发。

**证据与限制。** 并发仍可能竞争共享 store；CI 资源上限可能迫使串行化。本分区未运行 pnpm/CI 测试。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-pnpm-setup-runner-isolation.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-unlink-fixture-junctions-before-delete.md:1-24@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-plan-narrow-viewport-regression.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-23-bounded-pnpm-runs.md:1-60@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-13-partitioned-coverage-location-canonicalization.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`

---

## 4. 投影、完成事实与演进

<a id="rationale-bug-fix-1-RB09"></a>

### rationale-bug-fix-1-RB09 持久证据保持原样，兼容降级只发生在出站投影

**触发。** 历史 tool input/messages 需要发送给不同版本对端；输入历史含未知 block type；token 用量字段缺失/未定价；请求重放需要补齐状态。

**必须做。**

1. 持久记录保留原始 wire 形态和版本号；兼容层只在构造出站请求时降级/转换。
2. 输入历史按 block type 保留/降级：支持的 block 转换，未知 block 显式省略或降级；不把未知类型当已知类型解析。
3. 未定价 token 的替换保留原用量表面和可解释回退；不能静默清零。
4. 重放补齐只针对同一逻辑请求；不产生第二条持久记录。
5. 出站转换记录原因（对端不支持/版本差异），便于诊断。

**完成信号。** 兼容转换后持久记录字段/字节不变；未知 block type 不被误读；旧格式仍可投影；未定价替换有 usage 和回退说明。

**失败/例外。** 历史记录可能含敏感数据；保留原样与脱敏策略需要单独设计，不能以「兼容」为由无条件保留密钥。对端完全不支持某字段时只在该次投影省略。

**迁移步骤。** 先分离 store 与 projector，再给记录加版本/type，最后补未知 block 与重放测试。

**证据与限制。** wire 细节依赖 provider 版本；Notes 未覆盖脱敏。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-token-surface-unpriced-replace-compatibility.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-15-max-token-replay-state-alignment.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-16-messages-historical-tool-input.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-18-messages-input-history-compatibility.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB10"></a>

### rationale-bug-fix-1-RB10 派生视图只从完成事实和原始来源计算

**触发。** UI 显示 turn/step 计数、fork/retry 按钮或消息来源；历史被分页/截断/恢复；同一 turn 重试；transcript replacement 序列。

**必须做。**

1. turn/step 计数来自 completion facts（`turn/end`、`step/end`），不从可见消息数或最后一条消息 timeline 推断；每次 append/update 维护 index，不用 full replay。
2. fork/retry 只在 completed turn tail 上提供；tail marker 只表示该 turn 最后一条非-folding accepted item，不代表 run completion；中途/失败 turn 不提供。
3. 人类 transcript 只投影 append-origin surface events；replacement copies 保持 model-only；compaction 在日志位置显示 marker，不擦除被 shadow 的历史；history 配额只计 append-origin messages。
4. 派生视图能追溯到原始消息/事件 id；分页不改变计数。
5. 完成事实缺失时显示 `unknown`，不猜测。

**完成信号。** 分页后计数等于全量完成事实；失败 turn 无 tail 动作；恢复后 append-origin 保持原值；replacement-only 短前缀不误用 id/index。

**失败/例外。** 历史数据可能缺少 append 来源，无法无损回填；应标记 legacy，不伪造。某些统计可以近似展示，但必须标注近似。

**迁移步骤。** 先建立完成事实索引，再改 UI 查询，最后补分页/失败 turn/恢复测试。

**证据与限制。** 完成事实定义依赖项目事件模型；旧数据回填不保证无损。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-human-transcript-append-origin.md:1-54@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-02-message-fork-actions-require-completed-turn-tail.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-05-turn-tail-actions-require-a-completed-turn.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-full-session-turn-step-counts.md:1-39@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-turn-error-survives-same-turn-retry-history.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB14"></a>

### rationale-bug-fix-1-RB14 面向模型的投影复用真实能力/编码规则，截断要代表性且可见

**触发。** 图片/多模态输入投影到模型请求；glob/搜索结果被截断；压缩摘要请求需要复用缓存前缀；多模态 tool result 需要保留/摘要。

**必须做。**

1. 请求投影按模型真实能力网格选择尺寸/质量/编码；不用复用的错误估算。
2. over-cap glob 结果按显式配置处理：未超限保持完整 modification-time 顺序；超限时选择 head 或按 top-level entry round-robin；footer 披露 sample/head 与 reached entries，spill 保留完整列表。
3. 压缩摘要请求把指令移到末尾，并复用上次已路由请求的 system/tools/leading messages；缓存命中是 best-effort，手动中段压缩/不同 route 放弃；摘要输出不变，收益以真实前缀衡量。
4. prepared content 在 post-execute policy 前安装，不能在 policy 后复活已阻止图片。文本/图片按估算 tokens 共享保留预算（来源12,500），预留 omission notice、保留连续两端；图片不可分割且边界余量不用。完整 spill 按顺序保存文本与可读附件路径，附件字节仍归 attachment store，PTC 原始值保持完整；来源不是 typed overflow 返回协议。
5. 缺图片定价或可读恢复路径时保留原 result 并给 diagnostic，其他 block 类型透传。image alpha/quality ladder 按 provider 路由选择；这些来源未定义通用 `unsupported/needs-probe` 协议。

**完成信号。** 图片参数来自能力表且可解码；glob 结果明确 sample/head 与 reached entries；压缩请求命中/未命中都可解释且摘要不变；截断结果含代表项与 omitted/原始引用。

**失败/例外。** 模型能力表会随 provider 版本变化，必须可更新。某些模型不支持 alpha/特定质量；降级要显式。

**迁移步骤。** 先建立模型能力表，替换估算/硬编码，再补截断代表性和缓存前缀测试。

**证据与限制。** Notes 中的 token 网格是特定模型事实，不能外推；本分区未做图像编码/缓存运行。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-21-compaction-summary-prefix-cache-reuse.md:1-46@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-glob-sampling.md:1-48@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-24-alpha-routed-image-quality-ladders.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-10-deepseek-v41-request-image-projection.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-21-multimodal-tool-result-retention.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB15"></a>

### rationale-bug-fix-1-RB15 适配器升级、设置恢复与提示组合要显式分类并按所有权解析

**触发。** 升级模型 SDK/pi-ai 或插件；设置 catalog 需要恢复/迁移；包内转发 import 需要解析；系统提示/运行时上下文由多个来源组合。

**必须做。**

1. 升级逐字段分类（保留/替换/移除），做编译期穷尽检查；不能静默丢弃。
2. 设置 catalog 从持久化 source 重建，损坏项可见；不依赖内存缓存。
3. 包内转发 import 由 `WorkspaceAnalyzer.targetForReference` 沿 package-local forwarding modules 解析：相对 specifier 经共享 compiler host/解析缓存解析，只在仍位于引用包内时前进；收集携带请求名的 named re-export、`export { local }` + 该模块 import、以及导出同名 symbol 的 star re-export；explicit 先于 star，每个 module/name 对只进入一次（循环 star 终止），首个 package specifier 处停止并交给 `packageExportName`；仍要求 public package import，不得把相对跨包路径、namespace-only route 当 public。这不是 package.json exports/tsconfig 映射改动。
4. 仅为需要稳定相对位置的提示 section 分配 distinct `order`，其他 equal-order 仍按 activation order；不新增 registry 名称 tie-breaker，也不只在 snapshot harness 归一化来掩盖运行时顺序。
5. 面向模型的 residency 词汇稳定为 `running | idle | ready`；`ready` 只表示 durable conversation 仍可 `send_message`，不是 terminal/complete；service layer 可保留 `running | inactive`，但必须显式映射。不得把历史 job 说成运行中。
6. 运行时上下文由应用显式组合并可 opt-out，记录最终提示；受控 prompt 只属于 host 组合。持久 pwsh 的 `prompt` 函数由 `dsh-terminal-bash` 在 `spawn` 时单一所有者安装并等待 `stdin_read` readiness；持久 pwsh 工具不得安装/覆写 prompt、不得持有私有常量或匹配 backend 的 `dsh> ` 文本；无 end marker 的 `stdin_read` 只按 seam 信号返回 captured partial output，partial output 可保留 backend prompt 文本。

**完成信号。** 升级字段无遗漏；catalog 可从磁盘恢复；包内 forwarding 链经 analyzer 解析到 original declaration 且 public subpath 校验仍生效（不是 exports-map 改动）；section 顺序稳定且不静默重排；residency 词表与真实能力一致；真实 Loader composition 中持久 pwsh 的每个 send 记录 `stdin_read`（至少六次）且无 `inferred_idle`，重新引入工具 prompt 覆写会失败。

**失败/例外。** 某些 SDK 字段没有替代；必须显式 `unsupported`，不能静默丢弃。设置损坏时保留旧值并提供修复入口。持久 pwsh 的 backend prompt 只在 `spawn` 安装一次；模型命令重定义 `prompt` 后无法按 prompt 重断言，后续 send 仍降级到 silence tier，这是文档化残留，不是自动修复。

**迁移步骤。** 先建立字段/顺序/转发的显式映射：转发由 analyzer 沿 package-local forwarding modules 解析，走 face 的共享 compiler host/resolution cache，不要改成 exports-map 映射或依赖 hoisting；再用编译期检查和恢复测试锁住。持久 pwsh 删除初始化 send、`PWSH_PROMPT_SETUP`、私有 prompt 常量与匹配/剥离逻辑，由 `dsh-terminal-bash` 在 `spawn` 安装并等待 `stdin_read`；用 loader-composition suite 的 `waitReason` 固定。

**证据与限制。** 升级映射是版本特定的；catalog 损坏恢复依赖存储格式。Typert 的修复在 analyzer 的 `targetForReference`（不是 exports-map/tsconfig 映射）：每个 cross-package relative reference 经 face 的共享解析缓存逐 hop 付一次 module resolution，`reachableFiles` 也走同一缓存；relative 跨包路径、namespace-only 与全部回环仍失败。pwsh 的 8493/3722/3832/3759 ms → 1340/255/251/241 ms 是源 Note 的 Windows 实测；本分区未重跑，且 `stdin_read` 早返回会保留会话，仍在读 stdin 的子进程可消费下一次命令直到 `timeoutMs`。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-pi-ai-upgrade-compatibility.md:1-26@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-07-pi-ai-settings-catalog-recovery.md:1-40@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-07-typert-package-local-forwarding-imports.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-24-system-prompt-section-order-ties.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-list-agents-residency-vocabulary.md:1-41@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-web-agent-runtime-context.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-21-persistent-pwsh-keeps-controlled-prompt.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`

---

## 5. 资源、平台与交互

<a id="rationale-bug-fix-1-RB11"></a>

### rationale-bug-fix-1-RB11 为队列、扫描和并发加上限与协作式让出

**触发。** 流式队列/回复 backlog 增长；大历史分页或大量参数扫描；单个 Host 的 Session 列表占用事件循环；脚本运行时处理大量请求。

**必须做。**

1. 队列/backlog 必须有上限。来源的 reply backlog 以保留的 pending reply 计数（`MAX_PENDING_REPLIES` = 1024）为界：达到上限时 `sendReply` 先把 run 结算为 `worker-exit` 并带 reply-queue 消息，再推送该帧，子进程提前失败。这是数量上限，不是 byte/payload 大小上限；不要把它描述成可重试 busy 信号或消费后恢复。
2. FIFO 用 circular deque/index 保留线性 drain、front insertion 与移除 slot 清理；不以 `Array.shift()` 反复移动剩余范围。容量、coalescing、拒绝与 admission 仍是 consumer policy，不由通用 deque 猜测。
3. 单个 Host 的列表分类/摘要共用 monotonic deadline，仅耗尽 `listWorkSliceMs`（来源默认16正整数毫秒）才让出，等待后重置；小列表不强制最终让出。这不是 per-host round-robin 或多主机无饥饿保证。
4. lone surrogate 计数在 pair-combining 之后按长度差得到：每个剩余 surrogate 都是 lone 且恰好一个码点，计数即被移除数量；不能改成通用 UTF-16 code-unit 计数（astral 字符占两个 code unit 但零 lone surrogate）。
5. 取消后不再启动新批次；可取消等待必须收敛，不留下永远 pending 的 reader。

**Implemented source decision（2026-09-30 session-list-host-fairness；决策层权威，非当前代码验证）。** `ApiSessionList` 用一个 monotonic deadline 覆盖分类与摘要生成；只有耗尽配置的 `listWorkSliceMs`（默认 16ms 正整数）才让出，等待后重新计时，小列表不强制最终让出。取消在每行、每次让出后、返回前检查，不返回 partial list；所有行仍同步，live rows 先于 queued cold rows，不承诺 cross-Session atomic cut。该决策不证明所有上限/公平性路径都已覆盖；16ms 是可配置默认预算，不是硬全局 bound。

证据：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-30-session-list-host-fairness.md:11-15@687f282e8625c6b8d11ff58211a90524be2e4317`、`:67-69@687f282e8625c6b8d11ff58211a90524be2e4317`。

**完成信号。** 超限行为可预测（reply backlog 达到 1024 即 `worker-exit` 结算）、deque drain 线性；受控时钟验证廉价行不强制 yield、预算耗尽才 yield 且等待后重置；每行、每次让出后与返回前均检查取消，不返回 partial list。来源 CI 以 elapsed queue-delay 和粗吞吐/heap 限额拒绝未让出的重批次，不断言固定批次大小。

**失败/例外。** 队列容量与 admission 依赖 consumer 与部署；来源的 reply backlog 是 1024 个保留 reply 的数量上限，不是 byte/payload 大小上限，且没有暂停后恢复的路径。所有行仍同步且验证不省略，live rows 在 queued cold rows 前；不承诺 cross-Session atomic cut。单行、provider enumeration、GC、最终排序和序列化可越过工作预算，16ms 不是硬全局延迟上限。

**迁移步骤。** 先分离队列存储复杂度与容量/admission：把 `Array.shift()` 的二次范围移动换成 circular deque（索引推进、移除清 slot、满时倍增、非空降到四分之一容量时收缩，FIFO/front insertion/复用保留）；再实现单 Host 的单调时间片及三个取消点；保留目标 CI 的队列延迟/粗吞吐保护，不能用人工“公平轮转”评审替代。

**证据与限制。** 来源本地与 CI 数值属于相应 workload/环境，不证明多主机公平或浏览器/网络延迟改善；本分区尚未运行目标队列/取消/CI 场景。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-28-linear-stream-queue-drain.md:1-57@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-reply-backlog-and-surrogate-count.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-04-large-history-pagination-call-stack.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-30-session-list-host-fairness.md:1-69@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB12"></a>

### rationale-bug-fix-1-RB12 Windows 路径/字符串/进程边界使用显式长度与创建期标志

**触发。** 读取 Win32 picker/API 返回的 UTF-16 路径；列举/删除 junction/重解析点；启动 Windows 子进程；解析 Store pwsh 别名。

**必须做。**

1. UTF-16 字符串按显式长度读取；code-unit NUL 是合法内容，不能把它当字符串终止符。只依赖 `strlen`/`wcslen` 的解析是错误。
2. 删除/递归遍历前识别并解除 junction/重解析点，避免穿透目标。
3. 子进程控制台可见性在创建时设置（隐藏窗口/无窗口），不能创建后再隐藏；否则会闪烁/抢焦点。
4. Store 别名解析走 App Execution Alias，不把别名当普通文件。
5. 遇到不支持的重解析点类型时显式报错并保留原目录，不做递归删除。

**完成信号。** 含 NUL/非 BMP 路径读取正确；junction 目标不被删除；子进程无可见控制台；Store pwsh 解析到真实可执行文件。

**失败/例外。** 某些重解析点（如符号链接）可能需要不同权限/策略；必须按类型处理，不能一律递归。Windows 版本差异要记录。NUL 可表示非法 win32 path 边界，但 SDK/API 返回的显式长度字符串仍必须完整读取。

**迁移步骤。** 先封装长度感知路径读取和重解析点删除，再统一进程创建标志，最后补平台测试。

**证据与限制。** 本分区未在 Windows 运行这些测试；不同 Windows 版本行为可能不同。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-23-win32-utf16-nul-truncation.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-31-win32-picker-path-string-read.md:1-26@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-hidden-windows-subprocess-windows.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-unlink-fixture-junctions-before-delete.md:1-24@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-resolve-store-pwsh-aliases.md:1-24@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-16-windows-subprocess-console-visibility.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB16"></a>

### rationale-bug-fix-1-RB16 交互时序用显式状态/宽限/所有权，不靠延迟或位置猜测

**触发。** hover popup 进入/离开；outside-click 自关闭；同一 tick 的输入 echo；跨 session 草稿；drill claim 与编辑。

**必须做。**

1. 关闭有明确 owner 与指针宽限；outside click 协调内部点击与焦点恢复。
2. 同一 tick 的 caret echo 不得被当作外部 intent transition；只有非 echo 的 intent 变化才标记 dirty。不要吞掉用户输入，也不要让 echo 触发自动提交。
3. 草稿按 session/实体 id 保存，不用全局单例。
4. 互斥编辑先 claim 成功再修改；claim 失败无副作用。
5. feedback popover 只有实际打开过才在关闭时回焦 trigger；初次挂载未打开时不抢焦点，关闭后可再次打开。

**完成信号。** 快速移入 popup 不被关闭；outside close 只关闭一次，确实打开过才回焦 trigger、初次挂载不抢焦点；caret echo 不把 intent 标脏；session 草稿隔离。

**失败/例外。** 指针宽限时长是产品选择；不同输入设备事件顺序可能不同，需要真机/浏览器测试。

**迁移步骤。** 先给浮层/草稿建立状态和 id，再移除固定 delay/全局单例，最后补重入与跨 session 测试。

**证据与限制。** 具体时长无通用值；指针事件顺序因平台而异。feedback popover 的以下限制被来源接受而非修复：打开时点击 rating（或 outside click 落在另一可聚焦控件）会先关闭面板并把焦点交还 note trigger，键盘用户可感到焦点移动；clamp 假设面板能放进 viewport，高于 viewport 时 `top` 变负、面板头部被裁；rating 在打开期间消失时面板卸载但 `noteOpen` 仍为 true，document 级 Escape/pointer-down 监听保持挂载，resync 重现时面板带旧 draft 返回且不重新聚焦 textarea；面板关闭后再打开期间发生的 save failure 被丢弃而不展示（draft 已重新播种，旧失败会误导）。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-hover-popup-pointer-grace.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-18-rail-search-outside-click-self-dismissal.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-26-intent-draft-same-tick-echo.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-26-question-drafts-survive-session-switch.md:1-40@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-drill-claim-precedes-the-drill-edit.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-feedback-note-editor-popover.md:20-44@687f282e8625c6b8d11ff58211a90524be2e4317`

<a id="rationale-bug-fix-1-RB17"></a>

### rationale-bug-fix-1-RB17 布局/滚动/显示状态要有单一所有权，测试相对几何而非绝对像素

**触发。** 折叠侧栏、sticky composer、滚动跟随、覆盖层/浮层定位；列表项/步骤卡顺序变化；窄视口/不同浏览器/滚动条差异；需要决定默认开合与 transient/持久状态边界。

**必须做。**

1. 一个布局状态只由一个 owner 驱动；共享入口动效由同一状态驱动。
2. 每个 scrollport 使用独立 `useScrollFollow` controller，clip/scroll 容器与 follow intent 分离；用 native scroll target/input interruption 处理动画，不用轮询或绝对几何。
3. 覆盖层 seat 补偿滚动条/内边距，不改变正文宽度。
4. 控件保留可恢复命中区；隐藏不等于删除。
5. 默认开合由显式产品决定，不自动等于持久化。来源 details geometry 为 transient、不新增浏览器 storage key，reload 回零；显式打开仍360px，同一 Session 可保留已打开宽度，切换 Session 关闭。其他面板是否持久化须有各自产品依据。
6. 测试断言相对几何/顺序关系，不依赖绝对像素或位置索引。

**完成信号。** 折叠后仍有恢复控件且命中区非零；覆盖层不改变正文宽度；列表顺序变化后计时/操作仍绑定正确 id；两个 scrollport 的跟随状态互不串扰；窄视口无溢出。

**失败/例外。** 某些浏览器滚动条行为不同（Firefox 仍是 source 的已知 residual）；必须记录，不要声称完全消除。TUI/Web 的几何模型不同，需分别测试。动画中断/浏览器 scroll anchoring 差异可能留下 residual。

**迁移步骤。** 先统一布局状态源，再替换绝对像素断言，最后补折叠/窄视口/滚动条测试。

**证据与限制。** 具体实现与 source 栈绑定；Firefox 差异未完全消除。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-22-collapsed-sidebar-control-rail.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-sticky-composer-conversation-scroll.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-composer-overlay-seat-width-compensation.md:1-40@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-chat-scroll-follow-and-footer-geometry.md:1-55@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-tui-diff-context-line-accounting.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tui-step-timing-trails-tool-cards.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-composer-context-stack-order.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-details-default-closed.md:1-28@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-02-todo-first-composer-context-order.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-collapsed-sidebar-shared-entry-motion.md:1-33@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-feedback-note-editor-popover.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-21-inline-user-text-projection.md:1-33@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-session-search-result-reveal.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-16-movable-mandatory-update-window.md:1-24@687f282e8625c6b8d11ff58211a90524be2e4317`

---

## 6. 证据、范围与未决

<a id="rationale-bug-fix-1-RB19"></a>

### rationale-bug-fix-1-RB19 把已确认事实、目标执行与未决问题分层记录

**触发。** 交付机制/文档/验证结论；声明性能、安全、兼容或恢复保证；存在跨域依赖、workaround 或未测平台；会话打开/恢复等并发路径存在未决状态。

**必须做。**

1. 区分 source mechanism、planned target check、confirmed source limitation、unresolved question。
2. 未执行的目标验证标 `evidence=planned`，不得写成通过。
3. 已知 workaround/residual 显式记录，不隐藏为 success。
4. 跨域依赖在未读/未绑定时保持 `unbound`，不用依赖名代替证据。
5. 发现证据不足时降级结论并补 `targetCheck`，不删除限制。

**Implemented source decision boundary（2026-09-20 session-open；决策层权威，非当前代码验证）。** `ready` 只表示初始 `Session.open()` 尝试已 settle，不等于成功；消费者仍要检查 `openState === 'open'`，失败打开后不再发辅助 RPC。等待只覆盖当前 Client generation 的初次打开，不覆盖 reconnect 或每次 follow replacement；没有 global cold-read singleflight，也不合并所有未完成冷读。该决策不新增 Host Agent 授权或 Commands/Goals 取消协议。真实入口是实际辅助 RPC 调用点（Note 四类消费者/五个 RPC；源码 `SessionReferenceSourceMap` 8 个扩展标签；当前源码五个生产 `sessions.using` 调用点），是有限枚举，不是全局锁。known gaps 仍按 gap 记录：header 根 catalog/menu 加载提示缺失；stale tests 不是通过证据。

证据：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-20-session-open-read-coordination.md:34-36@687f282e8625c6b8d11ff58211a90524be2e4317`、`:52-53@687f282e8625c6b8d11ff58211a90524be2e4317`、`:73-75@687f282e8625c6b8d11ff58211a90524be2e4317`、`:81-81@687f282e8625c6b8d11ff58211a90524be2e4317`。

**完成信号。** 每条「已验证/已修复」都有执行证据；limitations 非空且具体；unresolved 带 sourceEvidence 与 targetCheck。

**失败/例外。** 文档可以给出建议，但建议不是保证；采用者必须按目标环境重新验证。

**迁移步骤。** 在模板中固定 evidence/limitations/unresolved 字段；评审先看证据等级，再看结论。

**证据与限制。** 本参考所有验证均为 planned；证据等级是流程约束，不替代独立审计。

**来源。**

- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-23-bounded-pnpm-runs.md:1-60@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-continuous-client-recovery.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-20-session-open-read-coordination.md:1-88@687f282e8625c6b8d11ff58211a90524be2e4317`
- `deepseek-harness/.agents/notes/archived/bug-fix/2026-08-27-steer-followup-image-delivery.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317`

---

## 7. 按任务触发的采用清单

### 7.1 新增/修改持久化实体

1. 定义稳定身份元组与版本（rationale-bug-fix-1-RB03）。
2. 列出所有读取入口，禁止 basename/标题/最近时间猜测（rationale-bug-fix-1-RB03）。
3. 迁移旧记录：无法确定身份 -> legacy/unresolved（rationale-bug-fix-1-RB03、rationale-bug-fix-1-RB19）。
4. 写测试：同名冲突、preset 切换、复用、锁接管（rationale-bug-fix-1-RB03、rationale-bug-fix-1-RB06）。

### 7.2 新增队列/异步消息/取消

1. 定义准入检查，前移到入队前；幂等键按队列单独定义（rationale-bug-fix-1-RB04）。
2. 建立单一发布/排序点（rationale-bug-fix-1-RB04）。
3. 取消先写 latch，再唤醒；终态收敛（rationale-bug-fix-1-RB04）。
4. 加上限/背压/取消点（rationale-bug-fix-1-RB11）。
5. 测试两种准入/选择顺序、取消/完成竞态、深队列（rationale-bug-fix-1-RB04、rationale-bug-fix-1-RB11）。

### 7.3 新增进程/锁/运行时

1. 完成 = 观察到的退出 + 排空输出 + 分类结果（rationale-bug-fix-1-RB06）。
2. 进程树终止，不只父进程（rationale-bug-fix-1-RB06）。
3. 锁接管验证身份/退出事实：PID 记录、`ESRCH` probe、SHA-256 claim 与二次 probe；无接管代数计数器（rationale-bug-fix-1-RB03、rationale-bug-fix-1-RB06）。
4. 结算覆盖成功/异常/超时/取消/部分输出（rationale-bug-fix-1-RB06）。
5. 测试杀树、输出阻塞、锁接管（rationale-bug-fix-1-RB06）。

### 7.4 新增模型适配器/多模态投影

1. 保留 cause 链与 typed 分类（rationale-bug-fix-1-RB01）。
2. 空/截断/未知停止原因显式处理（rationale-bug-fix-1-RB01）。
3. 建立模型能力表，投影按真实参数（rationale-bug-fix-1-RB14）。
4. 升级逐字段分类 + 编译期穷尽（rationale-bug-fix-1-RB15）。
5. 截断采样代表性 + omitted（rationale-bug-fix-1-RB14）。
6. 测试 provider 变体（rationale-bug-fix-1-RB01、rationale-bug-fix-1-RB14）。

### 7.5 新增 UI 交互/布局

1. 一个布局状态一个 owner（rationale-bug-fix-1-RB17）。
2. 每个 scrollport 用独立 scroll-follow controller 与相对几何（rationale-bug-fix-1-RB17）。
3. 浮层/草稿/claim 用显式状态与实体 id（rationale-bug-fix-1-RB16）。
4. 折叠/隐藏保留恢复入口（rationale-bug-fix-1-RB17）。
5. 真实浏览器/窄视口测试，不用绝对像素（rationale-bug-fix-1-RB08、rationale-bug-fix-1-RB17）。
6. 已知浏览器差异记录为 residual（rationale-bug-fix-1-RB17、rationale-bug-fix-1-RB19）。

### 7.6 新增测试/覆盖率/构建豁免

1. 测试命中真实执行边界，不测 presentation（rationale-bug-fix-1-RB08）。
2. 豁免按错误类别本身（如 Node 的 unknown `.css` extension），不绑定具体 stylesheet 路径；另一 extension/error code/message/clean import 仍须 finding（rationale-bug-fix-1-RB08）。
3. pnpm setup dest 按 run/attempt 私有，共享 store/cache 需声明；teardown 等待退出（rationale-bug-fix-1-RB20）。
4. junction 安全删除（rationale-bug-fix-1-RB12、rationale-bug-fix-1-RB20）。
5. 覆盖率路径 canonicalization，不把未覆盖算通过（rationale-bug-fix-1-RB08）。

### 7.7 写 Note/PR/交接

1. 写清触发、动作、完成信号、失败信号（rationale-bug-fix-1-RB01 至 rationale-bug-fix-1-RB22）。
2. 分开 source fact / target planned / known limitation / unresolved（rationale-bug-fix-1-RB19）。
3. 任何「已验证」必须指向实际执行；否则标 planned（rationale-bug-fix-1-RB19）。
4. 指导内容如果声称行为，必须由真实 mount/执行校验（rationale-bug-fix-1-RB18）。
5. 记录 workaround 与 residual，不把 workaround 写成最终方案（rationale-bug-fix-1-RB19）。

### 7.8 新增 job/SDK 历史/区间字段

1. job identity 用 UUID，跨 registry restart/copied history 稳定；unowned work 不写 journal（rationale-bug-fix-1-RB22）。
2. 在 registry commit 前同步 append registration/settlement；记录 producerReported、incomplete、timestamps、owner、label、creating tool call（rationale-bug-fix-1-RB22）。
3. 缺失终态保持 incomplete；不得合成 terminal；recording failure 只警告不阻止 cleanup（rationale-bug-fix-1-RB22）。
4. owned-run finish reason 取区间最后一个 root turn/end kind；无 turn/end 为 None，malformed 抛协议错误；不归因 prompt（rationale-bug-fix-1-RB21）。
5. 明确 journal 只是观察，不恢复 process/output ring，也不保证 teardown/cross-fiber disposal order（rationale-bug-fix-1-RB22）。

---

## 8. 反模式速查

| 症状 | 错误做法 | 应采用 |
|---|---|---|
| 未分类 provider 错误也被自动重试 | 把所有 provider 错误归入可重试集合 | rationale-bug-fix-1-RB01 |
| 空回复被当成功 | `completed` 即成功，不看内容 | rationale-bug-fix-1-RB01 |
| 不可读元数据变成空身份 | `catch -> {}` | rationale-bug-fix-1-RB02 |
| 同名 workspace 互相覆盖 | basename 作为键 | rationale-bug-fix-1-RB03 |
| 取消后永远停在 cancelling | 只发 signal，不落状态 | rationale-bug-fix-1-RB04 |
| 失败步骤留下无结果 tool call | 只结束父 turn | rationale-bug-fix-1-RB05 |
| kill 父进程就算结束 | 不等待退出/不排空 | rationale-bug-fix-1-RB06 |
| 热重载半更新 | 直接赋值，不回滚 | rationale-bug-fix-1-RB07 |
| 权限只在 UI 隐藏 | schema 省略即认为禁用 | rationale-bug-fix-1-RB08、rationale-bug-fix-1-RB13 |
| 兼容层改写历史 | 迁移时覆盖原记录 | rationale-bug-fix-1-RB09 |
| 计数按可见消息算 | 分页后统计变小 | rationale-bug-fix-1-RB10 |
| `Array.shift()` drain / 无界 backlog | 深队列 O(n²)/OOM | rationale-bug-fix-1-RB11 |
| 创建后隐藏控制台 | 窗口闪烁/抢焦点 | rationale-bug-fix-1-RB12 |
| 信任 WebView 页面消息 | 页面可直接触发特权 | rationale-bug-fix-1-RB13 |
| 用错误 token 估算图片 | 请求与能力网格不符 | rationale-bug-fix-1-RB14 |
| SDK 升级静默丢字段 | 只改类型不列映射 | rationale-bug-fix-1-RB15 |
| residency 词汇把 ready 说成 complete | 模型以为可终止/不可发消息 | rationale-bug-fix-1-RB15 |
| outside click 第一次就吞点击 | 固定延迟/无 owner | rationale-bug-fix-1-RB16 |
| 覆盖层改变正文宽度 | 不补偿滚动条 | rationale-bug-fix-1-RB17 |
| 两个 scrollport 共用一个 follow 状态 | 互相抢滚动/跳底 | rationale-bug-fix-1-RB17 |
| 声明式 preset 未真实挂载 | 只跑声明快照 | rationale-bug-fix-1-RB18 |
| 未执行测试写成通过 | 计划当证据 | rationale-bug-fix-1-RB19 |
| 测试共享 pnpm 安装 dest / 跟随 junction | 并发互相删除安装目录 | rationale-bug-fix-1-RB20 |
| 把 owned-run finish reason 归因到 initiating prompt | 区间内还有 steering/queued work | rationale-bug-fix-1-RB21 |
| 缺失 job terminal 由读取重建 | 伪造完成/资源释放 | rationale-bug-fix-1-RB22 |

---

## 9. 覆盖、限制与未决

### 9.1 本分区实际覆盖

- 95/95 英文 Note 正文已读，范围 1 至各自实际末行；95/95 中文正文已读（含 4 条 implemented），但未做逐句语义等价审计；95/95 `.i18n.yaml` 已机械解析（读取全文并核对格式/哈希计数），侧车数量一致不等同于语义等价。
- 95 个侧车与产品专用的 goal round wrap-up Note 的英文/中文两条 coverage 记录（共 97 条）在 coverage 中显式标记为 `non-governance`：它们不是可迁移机制来源，没有被强行映射到机制。
- 91 条 archived 侧车使用整文件 blob 哈希；机械核对显示两侧记录的 blob SHA-1 与实际文件 blob SHA-1 一致。
- 4 条 implemented 侧车使用逐标题哈希；逐文件检查 en/zh 条目数与标题数相等（11/11、6/6、5/5、6/6），格式为逐标题一致性记录，不是整文件 blob 哈希。
- 共抽取 22 个可迁移机制；94 条 Note 被至少一个机制引用；1 条 Note（goal round wrap-up）为产品专用，未强行提炼机制。
- 22 个机制中，4 个含 implemented source-decision 证据（RB03/RB11/RB19/RB22），其余以 archived historical note 为主；implemented decision 的权威是决策层，不是当前代码已强制。
- `sourceDecisionAuthority` 列出 4 条 implemented Note 及其决定与机制映射；所有机制仍没有 current enforcement claim，也没有绑定 current owner。
- 覆盖明细、每文件处置和机制映射保留在发布者内部 coverage 台账中，不随公开包分发；这些内部记录不构成公开可复跑的验证证据。

### 9.2 证据限制

- 所有目标验证为 `planned`；没有构建、测试、lint、格式化、远程调用或运行时执行。
- implemented source decisions 已读；仅 RB03 的调用点/扩展标签做了定点源码核对，current code enforcement 未做全量核对；`currentSourceVerification` 记录为部分定点核对、未做全量复验。
- 除 RB03 的定点核对之外，Note 中提到的实现文件未独立阅读；机制描述以 Note 文本为界，不声称全部代码仍与 Note 一致。
- 跨域 Note（architecture/feature/decision/simplification 等）未读，未建立跨域绑定；`crossDomain` 为空。
- 平台差异（Windows/Linux/macOS）未实测；Notes 自身也记录了若干平台残余。
- provider/模型行为会变化；rationale-bug-fix-1-RB01/rationale-bug-fix-1-RB14/rationale-bug-fix-1-RB15 的能力表与分类必须按目标版本重新验证。

### 9.3 已知 source 限制（历史 Note 与 implemented decision 的 known gaps；当前源码未做全量核对）

以下均为历史 Note 或 implemented Note 的陈述，不构成当前实现/政策强制结论。

- Windows open/reveal 依赖 `explorer.exe` handoff；exit 0/1 不能区分 opened/declined；非交互 session 会失去 open 能力，调用方不得声称关联失败或窗口出现。
- 锁接管只覆盖已退出持有者：source 用 PID 记录、`ESRCH` probe、SHA-256 claim 与二次 probe 串行化，没有接管代数计数器；PID 复用仍由第二次 probe 拒绝，claim 持有者崩溃或多主机/跨 PID 命名空间共享文件时仍需人工清理。
- pnpm 有界运行是 workaround，不是完整进程树治理。
- Firefox 滚动条/滚动跟随仍有 residual。
- 会话打开/恢复的 scope 限制在 Note 中明确列出；不能把未覆盖能力当成已支持。
- implemented 2026-09-20 session-open 的边界：`ready` 仅表示 initial open 已 settle，不是成功；消费者需 `openState === 'open'`；只覆盖当前 generation 初次打开；没有全局 singleflight；不新增 Host Agent 授权/取消协议；header 根 catalog/menu 加载提示仍是 gap；stale tests 不是通过证据。
- implemented 2026-09-30 job lifecycle 不保证 teardown 顺序，缺失终态不重建；time-sliced list 的 16ms 是默认可配置预算，不是硬全局 bound，也不承诺 cross-Session atomic cut。
- 指导/preset 的真实组合依赖插件所有权与真实 mount；声明本身不是证明。

### 9.4 未决问题（结构化）

1. **目标验证未执行。** `sourceEvidence`: 本参考各机制的 `verification` 数组；`targetCheck`: 在目标项目运行 positive/rejection/recovery 场景；`blocking`: 对采用决策为 true，对 source 提取已完成部分为 false。
2. **实现文件未做全量审计。** `sourceEvidence`: Note 中引用的 `packages/...`/`apps/...` 路径；仅 RB03 的 `sessions.using` 调用点与 `SessionReferenceSourceMap` 扩展标签做过定点核对，其余实现未读。`targetCheck`: 独立核对实现与 Note 的一致性；`blocking`: 对「source 代码仍有效」或「current enforcement」的声明为 true；source decision 作为决策仍有效，但 current code 结论依赖此核对。
3. **跨域未绑定。** `sourceEvidence`: 未读的 architecture/feature/decision/simplification Note 类；`targetCheck`: 由对应分区作者提供覆盖与证据后再绑定；`blocking`: 对跨域结论为 true，对本分区机制提取为 false。
4. **平台/提供方差异。** `sourceEvidence`: rationale-bug-fix-1-RB01/rationale-bug-fix-1-RB02/rationale-bug-fix-1-RB06/rationale-bug-fix-1-RB12/rationale-bug-fix-1-RB14 的 limitations；`targetCheck`: 在目标平台/provider 版本复跑；`blocking`: 对跨平台/多 provider 保证为 true。
5. **当前强制结论未绑定。** `sourceEvidence`: knowledge 中 `currentEnforcementClaims` 为空；4 个机制标记 `source-decision-authority`，其余为 historical/archived-note evidence；未绑定 current owner；`targetCheck`: 若采用者需要「当前源码/政策确实强制」的结论，由 current owner 提供已读 implementation/policy 证据并在 coverage 中绑定；`blocking`: 对当前强制结论为 true，对 source decision / 历史 Note 的机制提取为 false。

---

## 10. 一句话结论

这批 bug-fix Note 的共同治理教训不是「修更多 bug」，而是：**把失败保留为可分类的证据，把身份写在持久记录里，把准入放在执行边界，把完成建立在可观测事实上，把兼容限制在出站投影，把未验证的东西明确标成未验证。** 采用时按第 7 节的触发清单逐项落地，并按第 9 节保留证据等级与限制。
