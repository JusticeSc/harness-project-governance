# package-contracts-2：包级契约与组合边界

本文件是 `package-contracts-2` 域的操作参考，覆盖 55 个英文 README（53 个三件套包文档 + 2 个 vendor README）所建立的包契约。53 个中文对照正文同样是人工维护的权威契约，已完整读取（1-EOF），章节锚点与英文一致；`README.i18n.yaml` 是生成 sidecar，只用于配对记账。所有 `verification` 条目是 **planned**，不是已执行结果。

读法：先按“你正在做什么”找到小节，再读该机制的“必须/失败/迁移”。标识符（事件名、配置键、错误码）足以在安装后的消费仓中定位实现，无需源 checkout。

---

## 你要接入 Remote、API 或 Client 装配

### Remote 能力选择层：单一门面、构建期装配与转发事件白名单 {#package-contracts-2.remote-layer-selection}

来源：`deepseek-harness/packages/api/README.md:1-60@687f282e`、`deepseek-harness/packages/api/remotes/README.md:1-92@687f282e`、`deepseek-harness/packages/api/workspace-controller/README.md:1-74@687f282e`。

触发：新增 Client 可调用的 Host 能力，或新增一个可转发 Host 事件。

必须：
- Client 业务包只依赖 `api-remotes` 门面，不直接依赖 Gateway 实现或单个 Remote 运行时入口。
- 能力集合由构建期显式 import 与 `ctx.remote.$mount()` 决定，不做运行时 Host 服务发现。
- 转发事件只能来自 `src/remote-events.ts` 的 `API_REMOTE_FORWARDED_EVENTS` 白名单；类型投影、Client key face 与 Host 转发循环都从这一处派生。
- Host 对每个白名单条目做 `TypertForwardableEventEntry` 断言：`emit` 必须是一向事件；`waterfall` 必须 Agent 作用域且末参为同结果 `next()`。
- 通知默认作用 global 资源；声明 `resources` 的通知只发给访问控制允许这些资源的 Peer。一个通知只命名一个资源身份或不命名。
- Host 在入队前拒绝非 JSON 普通事件参数；waterfall 请求必须携带 `request.agent` 且与路由 Agent 一致。
- 卸载时 Cordis effect 撤回全部贡献；Client 面保持 React-free。

角色：Remote/API 维护者、Client 特性包作者、Host 能力所有者、访问控制维护者。完成信号：在 Client 通过门面调用已装配命名空间，得到类型化结果；卸载装配后同一调用不再可用。

失败与边界：事件不在白名单、参数非 JSON、waterfall Agent 不匹配都会在转发前失败；不做运行时发现意味着忘写 import 的能力不可调用。

迁移：先冻结门面与白名单，再接第二个 Client 消费者；不要为每个 UI 包生成独立 Gateway 依赖。

### Workspace 投影流：完整基线 + 有序增量、重连换代与访问过滤 {#package-contracts-2.workspace-projection-stream}

来源：`deepseek-harness/packages/api/workspace-controller/README.md:1-74@687f282e`、`deepseek-harness/packages/api/remotes/README.md:1-92@687f282e`。

触发：实现或消费 workspace 列表/会话分组的实时更新。

必须：
- 每个投影流先给完整基线，再有序列化增量；增量按序应用，不能跳号。
- 重连产生新的 generation；旧 generation 的增量必须丢弃，避免把上一连接的状态拼进新基线。
- 事件按资源身份做访问过滤：无权限的 Peer 不收到该资源通知，而不是收到后再隐藏。
- 客户端把流当作只读投影；变更通过 mutation 端点提交，不在流里回写。
- 失败时重新取基线，不做“本地补差”。

角色：Workspace/Remote 控制器维护者、访问控制策略作者、Client 状态模型作者。完成信号：连接后先收到完整 baseline，随后收到有序增量；重连后收到替换 baseline 且状态一致。

失败与边界：断线/换代/权限变化都可能导致增量不可用；正确恢复是重新基线，不是猜测缺失事件。

迁移：先实现“基线 + 有序增量 + 换代丢弃”，再优化增量体积。

### 首次使用默认 Workspace：固定目录名、Documents 定位与幂等初始化 {#package-contracts-2.default-workspace-initialization}

来源：`deepseek-harness/packages/api/workspace-controller/README.md:31-50@687f282e`、`deepseek-harness/packages/api/workspace-controller/README.zh.md:31-50@687f282e`。

触发：首次启动需要持久默认 Workspace，或实现 `initializeDefault` / Documents 目录定位。

必须：
- `workspace.initializeDefault()` 不接受请求参数；Client service 暴露 `workspaces.initializeDefault(signal?)`。Host 拥有固定目录名 `default-workspace`，注册表从同一路径段派生初始标题，因此同一安装只有一个磁盘路径和一个存储标题。
- Host 把目录放在其账户的 `<Documents>/deepseek-harness` 下（远程 Web Host 同样如此），并遵守 OS 文件名限制；Linux 系统查询要求存在 `xdg-user-dir` 且启用了 Documents 目录，否则部署必须配置 `documentsDirectory` 或使用文件夹选择器。
- Workspace registry 拥有资格判断、目录创建与持久初始化；已有默认 Workspace 直接返回且不再查询 Documents，永不重命名或迁移；无资格返回 `undefined`，启动可把目录选择留给用户；查询/创建失败走标准 Remote 错误；初始化不创建 Session、不发送消息。
- `./default-workspace` 为浏览器消费方发布 `DEFAULT_WORKSPACE_DIRECTORY` 与 `workspaceDisplayTitle(title, localizedDefault)`：仍带自动标题的工作区按读者语言显示默认名，其他标题原样显示；用户重命名为 `default-workspace` 或从选择器采用同名文件夹也显示为默认，除此之外没有行为依赖该判断。
- 配置 `documentsDirectory`（默认系统 Documents，完全限定 Host 目录）与 `documentsLookupTimeoutMs`（默认 `10000`，正数毫秒）；Documents 查询占用 registry mutation queue，其他 Workspace 变更最多等待该时长；取消可停止查询，但解析成功后不会回滚创建或登记。

角色：Host Workspace controller 维护者、启动流程/Client UI、部署配置者。完成信号：首次启动返回默认 Workspace，目录为 `<Documents>/deepseek-harness/default-workspace`，标题为 default-workspace，且未创建 Session。

失败与边界：无资格返回 `undefined`；无效 `documentsDirectory`、目录查询或创建失败按 Remote 错误返回；超时停止查询；已有默认 Workspace 永不迁移，取消不回滚已创建记录。

迁移：先让 Host 唯一拥有默认路径与标题，再接启动流程；成功返回才 upsert，无资格走目录选择器；不要由多个客户端各自推导目录。

### Host/Client 双编译面：仅生成产物受阻的拆分包与单一来源声明 {#package-contracts-2.client-build-face-split}

来源：`deepseek-harness/packages/api/remotes/README.md:1-92@687f282e`。

触发：某个类型或事件需要在 Host 与浏览器 Client 两套编译面共享。

必须：
- 共享词汇只放在拥有该能力的包声明的 client-safe `./types` 产物中；不要复制方法签名。
- Client 只 import 生成的 `/remote` 产物；生成模块缺失/过期时构建失败，而不是用 `any` 或全局 suppress 掩盖。
- 转发事件、payload、资源身份只有一份声明来源；Host 与 Client 都从它派生。
- 卸载/重连时生成面的贡献随 Cordis effect 撤回。
- 交付 Remote/mock 变更前运行真实的 Client 类型检查（`pnpm run typecheck` 一类），未构建的成功不算类型证据。

角色：构建配置维护者、包作者、类型系统维护者。完成信号：Host 与 Client 两面分别构建成功，共享声明输出字节一致且 .tsbuildinfo 独立。

失败与边界：生成物过期会阻止构建；这比运行期发现未装配命名空间更早、更可诊断。

迁移：先建立生成步骤与单一声明源，再拆包；不要用编译器全局开关换取“先跑起来”。

### 语音转写 Remote：瞬态录音、Provider 发现与准备/取消生命周期 {#package-contracts-2.speech-audio-transient}

来源：`deepseek-harness/packages/experimental/api-speech-to-text/README.md:1-80@687f282e`、`deepseek-harness/packages/experimental/api-speech-to-text/README.zh.md:1-80@687f282e`。

触发：把浏览器语音输入接入 Remote/Client，或替换转写 Provider。

必须：
- `speech` Remote 把浏览器录音接到 `ctx.speechToText`，只提供一个完整录音转写调用；`maxAudioBytes` 与 `maxDurationSeconds` 限制接收的录音；浏览器 UI 启用时挂载本包生成的 `/remote` 贡献。
- `prepare(providerId, { downloadSource })` 把一个已公布下载源转发给 Provider，省略时保留其配置策略；`catalog` 通过 `downloadSources` 提供选择器选项；Provider 拒绝不可用选择与进行中任务的源变更。
- `catalog()` 暴露 Provider 标识、默认选择与录音限制；`transcribe()` 在解析指定 Provider 前校验规范 base64 与 16 kHz 单声道 PCM16 WAV；音频是瞬态数据，不成为 Session 事件或附件，只有用户之后的普通提交才记录识别文字。
- `follow()` 推送包含准备状态与当前偏好的完整目录；`prepare()` 启动或加入 Host 任务；`cancelPreparation()` 显式取消；`configure()` 持久化传入的偏好字段；观察连接断开不会取消准备。
- 现有 gateway 负责认证与取消传输。

角色：Host speech service 维护者、Voice Provider 作者、浏览器录音 UI。完成信号：catalog 返回 Provider 与限制；prepare 后 follow 报告准备状态；transcribe 成功返回文字。

失败与边界：Provider 拒绝不可用下载源与进行中任务的源变更；不提供文件上传、持久化转写历史或流式协议；Base64 增加传输开销；录音受公布的上限约束。

迁移：先建立 catalog + prepare + transcribe 的瞬态管线，再接 UI；不要把音频写入 Session。

---

## 你要组合插件或扩展 UI

### Profile 插件生命周期：patch 分层、bundle 选择、安装事务与失败恢复 {#package-contracts-2.profile-plugin-lifecycle}

来源：`deepseek-harness/packages/boot/plugin-manager/README.md:1-172@687f282e`。

触发：安装/移除/启用/禁用插件，或调整 profile 组合。

必须：
- 组合按 profile 持久 patch 分层：bundle 层是基础状态，profile patch 只记录对 bundle 的偏离（最后匹配 override 的 `disabled`）；home 与 invocation patch 在 profile patch 之后应用并保留更高优先级，且不参与 profile patch 的比较。
- bundle 是带顺序的层；安装记录依赖与层序，不能只写一个扁平包列表。
- 安装是事务：解析、下载、写入 profile 包树、更新 manifest；任一步失败要恢复到安装前状态。
- 启用/禁用只改组合可见性，不删除已安装字节；移除才走卸载事务。
- 失败要保留可读诊断与原 profile 可用性；不要留下半安装树。

角色：插件管理员、Web Plugins 页面、plugin_manager 工具调用者、profile 维护者。完成信号：安装成功后 bundle 追加到列表末尾并激活；禁用只去掉选择、保留依赖。

失败与边界：网络/解析/写盘失败会回滚；用户手改过的 profile 文件不应被静默覆盖。

迁移：先定义 patch 层序与 manifest，再实现安装事务；不要用复制目录代替事务。

### 插件兼容性豁免：精确版本对、显式风险确认与不继承 {#package-contracts-2.plugin-compatibility-exemption}

来源：`deepseek-harness/packages/boot/plugin-manager/README.md:1-172@687f282e`。

触发：插件声明的 peer 版本与实际安装版本不一致，但需要临时运行。

必须：
- 豁免只针对精确的插件/宿主版本对，不能写成范围或通配。
- 豁免记录保存在 profile 的 `compatibility.json`，以精确 `package-name@version` → 精确 DSH runtime 版本列表的形式保存已启用授权；授予前先警告用户并取得明确同意，且需 `acceptRisk: true`；服务只校验确认与版本，不校验对话历史；默认不豁免。
- 豁免不继承到升级后的新版本；版本变化后重新评估。
- 豁免不是永久兼容承诺；它只解除该次安装的版本门槛。
- 兼容性拒绝使用 `incompatible-version`，详情含每个被拒包的 `name`、`version`、`runtimeVersion` 与未满足的 `requirements`（键为 `engines.dsh` 或 DSH peer 包名）；各界面自行呈现。
- CLI 的 `version-exemptions` / `allow-version` / `revoke-version` 在 profile 的 `package.json` 文件锁内执行（等待上限 120000ms）；Desktop profile 必须先由应用初始化。模块提示先退出 Desktop，但不检测它是否已退出；打印风险警告也不证明用户已同意。依据：`deepseek-harness/apps/cli/src/plugin.ts:1-107@687f282e`。

角色：插件管理员、用户（风险确认）、CLI 操作者。完成信号：为精确 package@version 与 runtime 授予豁免后，原安装重试成功并报告 applied 或 restart-required。

失败与边界：版本对不匹配或缺少风险确认时安装失败；已豁免的组合仍可能在运行期失败，豁免不改变运行时行为。

迁移：把豁免实现为 profile 的 `compatibility.json` 中最小、可撤销的精确版本对映射，不要改全局版本检查。

### Client Slot 扩展：单值槽冲突、贡献撤回与固定展示边界 {#package-contracts-2.ui-slot-extension}

来源：`deepseek-harness/packages/client/README.md:1-114@687f282e`、`deepseek-harness/packages/client/ui-deepseek-model-label-1017/README.md:1-91@687f282e`、`deepseek-harness/packages/client/ui-message-feedback/README.md:1-91@687f282e`、`deepseek-harness/packages/client/ui-workflow-run/README.md:1-101@687f282e`、`deepseek-harness/packages/api/workspace-controller/README.md:29-29@687f282e`。

触发：向 `conversation.chat.node` 等 slot 注册 UI，或新增一个 slot。

必须：
- 单值 slot 只能有一个贡献者；第二个注册必须冲突失败，不能静默覆盖。
- 每个贡献随 Cordis effect 注册；移除 client entry 时撤回 Definition、locale 与 renderer。
- slot 的展示边界固定：例如 workflow-run 节点只显示 run/phase/member 身份与状态，不把脚本、输出、错误、日志、用量、拓扑或控制塞进同一节点。
- 贡献者不拥有宿主资源；需要打开子会话等动作时，必须满足宿主提供的身份与 live 条件。
- workspace-controller 的 Client entry 公开框架中立的快照与订阅，把导航策略与 React hooks 留给 UI owner。这是该 API 包的具体契约，不推定所有 UI 包都必须采用相同边界。
- 固定的 slot 名称与顺序（如 Web bundle 在 `ui-conversation`、`ui-tool` 之后）属于组合契约。

角色：UI 插件作者、槽位 owner、Client 组合维护者。完成信号：安装两个使用不同槽位的 UI 插件，二者同时生效；卸载其一只撤回该插件贡献。

失败与边界：重复单值贡献会失败；贡献撤回不完整会在卸载后留下幽灵 UI。

迁移：先定义 slot 契约与冲突规则，再让业务包接入；不要用条件渲染模拟多贡献者。

### UI 贡献所有权：每 Session 单控制器、版本冲突对账与失败面分离 {#package-contracts-2.ui-contribution-ownership}

来源：`deepseek-harness/packages/client/ui-message-feedback/README.md:1-91@687f282e`、`deepseek-harness/packages/client/ui-workflow-run/README.md:1-101@687f282e`、`deepseek-harness/packages/client/ui-settings-account/README.md:1-119@687f282e`。

触发：UI 需要持有每会话状态（反馈、账户设置、运行节点等）。

必须：
- 每个 Session 由单组控制器拥有该 UI 状态：一个 `MessageFeedbackController` 支撑全部消息控件，一个 `FeedbackDialogController` 拥有对话框草稿、提交与 toast 序列。
- 快照带版本/代次；收到乱序或旧版本时对账，不把 stale 值写回。
- 释放/卸载时明确标记 stale，晚到的响应不得复活已释放状态。
- 失败面与内容面分离：加载失败、提交失败、冲突各有独立呈现，不用空内容伪装成功。
- 账户设置等单一原生 Platform 视图由宿主唯一拥有，Client 不复制一份状态机。

角色：UI 控制器作者、Host 服务 owner、多表面入口维护者。完成信号：同一 Session 的 Header 菜单、命令与消息行打开同一对话框，只发一次列表读取。

失败与边界：版本冲突时以宿主最新快照为准；晚到成功响应被丢弃。

迁移：先实现“单控制器 + 版本对账 + stale 释放”，再接更多 UI。

### Workflow run 对话节点：持久事件确定性重放、披露选择与实时导航 {#package-contracts-2.workflow-run-replay}

来源：`deepseek-harness/packages/client/ui-workflow-run/README.md:1-101@687f282e`。

触发：把长时间运行的后台工作流渲染成 Chat 节点，或处理崩溃/fork 后的运行状态。

必须：
- 节点是持久会话事件的确定性重放：`tool-workflow/run-start` 按 `runId` 建 Context，member start/ending 与 run ending 按日志顺序更新。
- 只有 `dsh-tool-workflow` 的顶层调用产生记录；嵌套 PTC 与直接 `WorkflowEngine` 消费者不产生。
- phase 分组只来自已启动的 member；结算改状态但不移除或重排 member。
- 只含更新的 history tail 保持 pending，直到更旧一页提供唯一 start；之后 prepend、完整重放与 live append 必须得到同一状态。
- 披露规则：普通更新保留用户选择；首次异常打开一次；正常完成关闭一次；同一 phase 下新 running member 使已完成 phase 与外层 run 再打开。
- 无终止事件的 run/member 在 Turn/Step 正常结束后仍显示 running；Turn 在崩溃或 fork 边界关闭时显示 interrupted，且不修改工具结果。
- 打开子 Session 要求 member 与 child 都 running、当前 Session 是 parent、child identity projection 可用；导航故意 live-only。
- 节点只显示身份与状态；终止 member 仍可查看，但不提供冷会话 opener。

角色：Conversation Node 作者、workflow 工具维护者、Client 导航维护者。完成信号：历史 tail 先只有更新时保持 pending，补到 run-start 后与 live append 得到同一节点状态。

失败与边界：缺唯一 start 时保持 pending；丢失终止事件会一直 running；这是日志事实不足，不是 UI 猜测的理由。

迁移：先绑定 `runId` 与日志重放，再做披露与导航；不要用组件本地状态当真源。

---

## 你要改会话、命令、目标或持久化

### Session 事件日志：append-only、无损 JSON 校验、投影与请求头重建 {#package-contracts-2.session-event-log}

来源：`deepseek-harness/packages/core/session/README.md:1-215@687f282e`。

触发：新增会话事件、修改投影、实现 resume/fork。

必须：
- 日志 append-only；事件一旦写入不改写、不重排、不删除。
- 每个事件必须是可无损 JSON 化的结构；非 JSON 值在入队前拒绝。
- 事件带单调序列；投影按序应用，重复/缺口可检测。
- resume/fork 从日志 fold 出状态；请求头等派生信息从日志重建，不依赖进程内缓存。
- 投影单元只读日志，不写日志；缓存可丢弃并从日志重建。
- 迁移/升级不得重解释旧事件的字段含义；需要新语义时加新事件或版本化。

角色：Session 维护者、事件生产者（loop/tool/plugin）、持久化后端作者、评审者。完成信号：append 一个含嵌套对象的事件后，后续修改源对象不影响已记录事件；deriveMessages 返回冻结投影的新数组。

失败与边界：损坏/不可读日志要显式失败，不能创建空会话替代；fork 边界要把未终止 turn 标为 interrupted。

迁移：先冻结事件 schema 与序列，再实现投影；不要用内存镜像作为恢复源。

### 实验插件记录：命名空间、ignorable 与生产调用边界 {#package-contracts-2.session-plugin-records}

来源：`deepseek-harness/packages/core/session/README.md:1-215@687f282e`。

触发：插件想向会话写入自有记录。

必须：
- 插件记录使用命名空间，避免与核心事件冲突。
- 每条记录声明 `ignorable`：读取方不识别时可安全跳过，而不是让整个会话不可读。
- 生产调用边界明确：哪些消费者可以写、哪些只读；不要靠事件名约定。
- 记录仍遵守无损 JSON 与 append-only；不写二进制或不可序列化句柄。
- 未知命名空间/字段的读取策略固定：跳过并记录诊断，不猜语义。

角色：实验包作者、Session 维护者、持久化/格式维护者。完成信号：实验包声明记录并写入后，恢复会话时通过 pluginRecordOf 重建状态。

失败与边界：非 ignorable 的未知记录应使消费者失败；ignorable 记录不得改变核心状态。

迁移：先在核心之外定义命名空间与 ignorable 规则，再让插件写入。

### 命令 seam：后端无关控制、日志型生命周期与空闲约束 {#package-contracts-2.command-seam-contract}

来源：`deepseek-harness/packages/compaction/command-compact/README.md:1-155@687f282e`。

触发：新增斜杠命令、替换命令后端，或处理命令取消/teardown。

必须：
- handler 只依赖后端无关 seam（如 `compactNow(agent, signal)`），不直接依赖某个实现。
- `command/run` 与 `command/done` 是 executor 拥有的仅日志事件，不进入模型历史；成功时 `command/done.sourceEventSeq` 指向领域事件。
- 忙碌判定是进程作用域：活跃未匹配标记阻止；早于最新 `session/end-seed` 的标记视为过期。
- 执行器跟踪真实 handler promise；root teardown 先注销命令，再排空已启动 handler。
- 运行中提交的 prompt 被接受，完成后按序启动，不丢失、不重排。
- 预期失败映射为稳定消息（busy、历史变化、无有用摘要、未干净结束、无法保存）；取消后后端完成清理，命令以 cancelled 结算。

角色：命令作者、压缩后端作者、命令 UI 适配器维护者。完成信号：空闲时 /compact 压紧旧区间并报告条目数与估算 token；最近历史不变。

失败与边界：没有命令适配器的自动化表面无法调用；命令自身不排队。

迁移：先冻结 seam 与日志事件，再接 UI 适配器。

### /goal 命令适配器：精确控制词语法、直出 UI 输出与附件单消息边界 {#package-contracts-2.goal-command-adapter}

来源：`deepseek-harness/packages/goal/command-goal/README.md:1-140@687f282e`。

触发：在交互式 UI 中创建/编辑/暂停/恢复/清理目标，或解析 `/goal` 输入。

必须：
- 命令与直接输出留在 UI command plane，不进入模型请求。
- 控制词只有 `clear`、`pause`、`resume`、`edit` 且必须占满完整输入；其他非空后缀是 objective。因此 `/goal pause after verification` 创建该字面 objective。
- `edit` 只改 objective，不改 phase/activation；`edit` 单独出现非法，且拒绝直接替换未完成目标。
- 预期域拒绝转成稳定直出错误，不暴露 branded id/revision；意外实现失败重新抛出。
- 附件只随 objective：create/edit 成功后提交一条 user followup，按选择顺序携带已准入图片/文件块，并附固定文本 `Reference attachments for the goal objective.`；goal 域不存附件状态。
- 其他子命令与任何被拒绝的 create/edit 在域变更前返回错误，保留 composer 草稿与卡片。
- 组合上注入 commands registry 与 goal service；Web bundle 在 `standard`/`code`/`cordis` preset 挂载 producer，`minimal` 省略；`sdk-minimal` 省略整个 goal 栈。

角色：命令适配器作者、UI composer 维护者、goal 域维护者、preset 组合者。完成信号：/goal pause after verification 创建字面 objective 而非暂停；裸 /goal 显示 phase/round/activation/下一命令。

失败与边界：通用命令注册表没有模态编辑或替换确认；没有 per-command round-cap 参数；shipped 只有 Web 适配器消费 `ctx.commands`。

迁移：先接 goal service 与命令注册表，再做精确语法与附件 followup。

### 会话持久化与相邻格式链：一次消费物理行、标头分类与恢复策略 {#package-contracts-2.session-persistence-format-chain}

来源：`deepseek-harness/packages/session/session-format/README.md:1-112@687f282e`、`deepseek-harness/packages/session/README.md:1-87@687f282e`。

触发：实现会话后端、读取旧会话、增加格式版本。

必须：
- 会话格式是 JSONL：每行一个事件；读取方一次消费一个物理行，不把多行拼成一个事件。
- 文件头/标头携带格式版本与必要元数据；读取时先分类标头，再按版本选择解析器。
- 迁移链是显式的：旧版本经已声明的迁移到当前版本，不允许跳步或猜字段。
- 恢复区分“可修复的中断最后 turn”和“不可读/不兼容”；后者显式失败，不创建替代会话。
- 后端（文件/数据库/sidecar）只负责存储，不改变事件语义；格式层拥有序列化。
- 写入保持 append-only；压缩/重写必须保留事件身份与顺序。

角色：格式/持久化维护者、后端作者、发布/迁移评审者。完成信号：旧版本会话经相邻链还原为当前 artifact，迁移后模型历史与直接当前读取一致。

失败与边界：没有迁移路径的版本必须拒绝；损坏行不能静默跳过（除非该记录明确 ignorable）。

迁移：先固定格式版本与迁移链，再接新后端。

### 会话标题辅助请求：共享执行策略、路由回退、全量输入上限与迟到拒绝 {#package-contracts-2.session-title-execution}

来源：`deepseek-harness/packages/session/session-title-llm/README.md:1-130@687f282e`。

触发：新增标题提供方，或调整标题生成的预算/取消。

必须：
- 提供方在 `ctx.sessionTitle` 注册，并在 `generate(request)` 内把 `{ system, input, messageSeqs, selectReasoningEffort }` 交给 `executeSessionTitleLlm`；同一服务第二次注册抛错。
- 提供方拥有 system 指令、输入 framing、推理选择与输出解释；共享函数拥有路由准备、边界、取消、请求日志与流组装。
- `provider` 与 `model` 覆盖必须同时给且非空；否则用当前会话已记录 `request/header` 的精确路由；无路由时的显式刷新必须给覆盖。
- 在派发前用 `maxInputBytes` 测量完整输入，超限拒绝而不是截断。
- 在消费流期间与流完成后都复查超时/取消；迟到成功结果即使适配器忽略 abort 也不接受。
- 记录 `session/title-llm-request`；失败也保留请求记录。
- `maxInputBytes`、`maxOutputTokens`、`timeoutMs` 全部必填，无库默认；标题长度目标由提供方另加。
- 辅助请求无 agent-loop 身份、不进对话历史；主对话保留自己的 thinking mode。

角色：标题提供方作者、部署配置者、会话标题服务维护者。完成信号：无覆盖时使用当前会话 request/header 的精确路由；提供成对覆盖时使用覆盖。

失败与边界：输出是否可用由提供方解释；推理 effort 由提供方选择；提供方不能绕过共享边界。

迁移：先抽共享执行函数与请求记录，再迁移提供方。

---

## 你要接执行 seam、模型或子进程

### 能力 seam 的三角色划分：Service Definition、Provider 与 Consumer {#package-contracts-2.capability-seam-roles}

来源：`deepseek-harness/packages/llm/llm/README.md:1-197@687f282e`、`deepseek-harness/packages/web/README.md:1-55@687f282e`、`deepseek-harness/packages/subprocess/README.md:1-51@687f282e`、`deepseek-harness/packages/sandbox/sandbox/README.md:1-184@687f282e`、`deepseek-harness/packages/ptc-runtime/ptc-runtime/README.md:1-150@687f282e`、`deepseek-harness/packages/storage/README.md:1-51@687f282e`。

触发：新增一个可替换能力（LLM、Web、子进程、沙箱、PTC、存储等）。

必须：
- Service Definition 定义提供方中立的词汇、生命周期与失败分类；Provider 实现平台/供应商细节；Consumer 只依赖 Definition。
- 能力集合由组合显式挂载，不做运行期服务发现；单例能力（如 Web）只有一个活动 provider。
- Provider 负责平台限制与 fallback 的如实披露；Consumer 不感知后端差异。
- 卸载/重载时 provider 的贡献随 effect 撤回；服务跨消费者重载保留必要生命周期。
- 失败分类稳定（不可用、拒绝、超时、取消），不让后端错误文本泄漏到模型。
- 存储等可选能力可以整组省略；省略时消费者要显式失败或降级，而不是假装成功。

角色：seam 维护者、后端提供者、消费者包作者。完成信号：替换搜索/模型/沙箱后端后，消费者代码与公共结果形状不变。

失败与边界：较弱 fallback 必须披露；能力未挂载时调用失败。

迁移：先冻结 Definition 与失败词汇，再接第一个 provider；不要先写 provider 再倒推接口。

### LLM 服务边界：提供方中立词汇、适配器注册与单次尝试终态 {#package-contracts-2.llm-provider-boundary}

来源：`deepseek-harness/packages/llm/llm/README.md:1-197@687f282e`。

触发：接入新模型供应商，或修改请求/流式处理。

必须：
- Consumer 只使用提供方中立的消息、工具、用量与失败词汇；供应商特有字段留在适配器内。
- 适配器在组合中注册；路由由 provider/model 标识，不在调用点硬编码。
- 一次调用是一次尝试：成功、失败、取消都有明确终态；重试属于上层策略，不在适配器内隐式重放。
- 流式增量与最终结果不重复；取消要传递到传输层并释放资源。
- 请求准备（`prepareCall`）与执行分离；推理 effort 等选择由调用方/提供方策略决定。
- 适配器不把凭据、原始响应或供应商错误结构透传给模型。

角色：LLM 服务维护者、适配器作者、loop/消费者。完成信号：两个适配器提供不同 wire，但消费者收到同一 chunk 词汇与唯一 finish。

失败与边界：无适配器/模型不可用时在 prompt 前失败；流中断按失败或取消分类。

迁移：先定义中立词汇与单次尝试，再接供应商。

### 模型请求重试：先持久化后等待、按提供方策略与开放步骤边界 {#package-contracts-2.llm-retry-durable}

来源：`deepseek-harness/packages/llm/llm-retry/README.md:1-147@687f282e`。

触发：实现 agent-loop 模型请求重试，配置 provider 的 retryPolicy，或处理退避期间取消、卸载与多恢复策略的组合。

必须：
- 每次计划重试先持久化非表面 `llm/retry`（id、provider、mode、policy key、failure、delay），再等待；开始重试前追加 `llm/retry-started`。这些事件记录调度而非最终完成。
- normal 默认最多重试 5 次，只覆盖 `EMPTY_RESPONSE/RATE_LIMIT/SERVER/TIMEOUT/TRANSPORT`，退避 500ms–10s、10% 抖动；预算、eligible 代码与退避可配置。
- always 先让下游恢复策略结算并尊重其 retry 决定，再对所有模型请求失败无限重试，包括认证、配额、协议等永久失败；只在成功、取消或释放时停止。不能把 normal 的 eligible 集合或有限预算套给 always。
- 恢复位于 `agent/request-error` waterfall 的开放步骤边界，让 loop 在同一 open turn、同一 durable history 上重跑失败步骤；不包装裸 `ctx.llm.stream()`，后者保持单次尝试。来源没有“存在未结算工具步骤便一律禁止重试”的额外规则。
- 有限插件预算相加；normal 只计自身配置代码与精确 provider 策略，上下文压缩拥有独立预算。重叠策略须明确注册顺序，不能捏造“每次尝试预算 + 总预算”的双预算接口。
- 取消在等待/退避期间也生效。
- 释放/取消须中止活动退避并排空委派恢复，释放前捕获的回调 fail closed；失败部分输出、错误、延迟与重试事件不进入模型表面。
- 每次 retry 是新的 provider 请求，可能重复输入 token 计费；`llm/retry` 本身不贡献 token。重建前缀只按 provider 规则具备缓存复用资格，非表面重试事件不改变 cache identity，不保证命中。

角色：重试执行器维护者、适配器作者（策略）、部署者。完成信号：限流失败后先出现 llm/retry 再等待，重试在同一 open turn 重建同一请求。

失败与边界：未选中最终适配器、normal 代码不 eligible 或预算耗尽时原样委托下游；有效且符合策略界限的 `Retry-After` 替代本地退避，always 遇超上限 provider 延迟则使用本地退避而不是终止。下游恢复若忽略取消且永不结算，也会阻止 fallback、turn 静止与释放；部署者承担 always 的成本与延迟控制。

迁移：先在持久会话日志上定义重试调度事件与开放步骤恢复点，再接可取消退避、provider 策略和同 turn 重跑；不要把重试塞进裸流读取循环。

### Token 计量：回放日志、提供方用量锚点与位置替换投影 {#package-contracts-2.token-meter-replay}

来源：`deepseek-harness/packages/llm/token-meter/README.md:1-159@687f282e`。

触发：统计会话/请求 token，或实现用量投影。

必须：
- 计量从会话日志回放，不依赖进程内累加器。
- 仅在最新成功调用的 canonical request envelope 完全匹配、且 provider 总量不低于该调用完整路由计价锚点时复用 usage；否则估算完整当前 envelope 与 surface。
- 最终 assistant 样本替换同一次尝试的流式用量；`llm/retry-started` 结束该替换范围。新的 retry 是另一次 provider 请求，可能重复输入计费，不能把它合并掉。
- 每次测量经可选 `llm` 服务解析有效 envelope 的 provider/model；表面变化相对同一路由重新计价的匹配锚点保持有符号增量，缩减替换可为负；图片使用路由视觉定价与模型可见文本，offload 使用该路由占位文本，文件使用实际分发的句柄文本。
- 固定启发式是近似，不等价于 provider tokenizer 或账单；占用只是参考值，压缩读 `measure()` 而不是 UI 占用。【迁移设计】[INFERENCE] 消费方因此不应把回退估值当作精确 usage，也不应因缺少 usage 抹去仍可估算的压力；这是迁移指导，不冒充原文新增禁令。
- `measure(session, requestHeader?)` 返回单一 consumed-log revision 的分离、深不可变快照；`totalTokens` 为请求+响应压力，`surfaceTokens = sum(nodes[].tokens)`。header 覆盖只选择路由/压力，节点仍描述当前 Session。`estimateMessage(message)` 用固定启发式定价；每次测量克隆节点，成本 O(surface)。
- 节点同时保留路由无关 `heuristicTokens` 供 shadow price 使用，不与路由计价 tokens 混用。`contextBreakdown` 的 system 是最后一个非空存活 system/message，message 是其余可见节点（含旧 prompt）；两者和在 append、metered compaction/pruning、system prompt 重写/清空后等于节点 heuristicTokens 总和；未计量的非 system replacement 按零增量折叠，tools 跟随最新 request/header。启发式总量按构造一致，route-priced 总量有意不同。
- 有 `ctx.sessionProjections` 时注册 `tokenUsage`（完整日志的 `uncachedInputTokens/outputTokens/cacheReadTokens/cacheWriteTokens`）、`contextPressure`（可选 pressure/projected/contextWindow）和 `contextBreakdown`（固定启发式组成）；卸载移除三个键。
- `deriveTurnTokenUsage(events)` 仅在完整生命周期、安全计数和精确总量一致时返回逐 attempt/整轮用量；各可选 cache/reasoning/route 汇总须全部参与 attempt 都报告对应值，不能用部分样本补全。

角色：token 计量维护者、压缩/UI/遥测消费者、适配器作者（图像定价）。完成信号：同一日志多次 measure 结果相同，且 surfaceTokens 等于节点和。

失败与边界：缺少可复用 usage 或 envelope 不匹配时，回退完整估算，不填 0，也不是一律显示未知。畸形事件须在状态变更前失败；系统提示词改写没有 shadow price，`projectedTokens` 在下一用量样本前按零增量折叠，而即时测量会重新计价。

迁移：先定义事件与锚点，再做 UI 汇总。

### Subagent 委派：工具镜像 provider 生命周期、activation 结果与深度/预设/模型选择 {#package-contracts-2.subagent-delegation}

来源：`deepseek-harness/packages/subagent/tool-subagent/README.md:1-252@687f282e`、`deepseek-harness/packages/subagent/subagent-spawn-in-process/README.md:1-150@687f282e`。

触发：新增子代理工具，或调整子代理的模型/工具继承。

必须：
- `tool-subagent` 是 provider 生命周期的工具镜像：open/read/完成/取消都映射到 provider 的真实状态。
- spawn 产生 fresh child：独立会话与工具上下文；继承哪些提示词/工具是显式策略，不是隐式共享。
- 深度、preset、model 选择是显式参数/策略；子代理不能无限递归，深度上限必须存在。
- activation 结果（成功/拒绝/失败）返回给父代理；失败不伪装成空结果。
- 父代理取消要传到子代理并清理；子代理通知按 wire 顺序转交，不能替换父响应。
- 完成后释放资源；已结束子代理的读取是历史读取，不复活执行。

角色：工具配置者、subagent 运行时、provider 后端、模型。完成信号：provider 存在时工具可用；卸载 provider 后工具消失且无悬空调用。

失败与边界：超过深度/不可用模型/被拒绝的 activation 显式失败；子代理不能向用户提问（见 ask-user）。

迁移：先实现 provider 生命周期与 fresh child，再做工具镜像。

### LSP stdio 提供方：按工作区池化、临时打开查询、先读后生成与有界关闭 {#package-contracts-2.lsp-transient-open}

来源：`deepseek-harness/packages/lsp/lsp-stdio/README.md:1-159@687f282e`。

触发：接入语言服务器，或修改代码导航。

必须：
- 按 `(server id, 规范化工作区)` 单飞一个池化进程；不同工作区可并行。
- 每次查询经 `ctx.fs` 读取当前源文件，`didOpen`（版本 1、全文）→ 请求 → `didClose`；不在跨查询保留文档版本。
- 执行前在工作区队列内解析、包含并限制字节数；非法源不留下空闲进程。
- 同一服务器+工作区查询串行；取消失败终止只影响该实例。
- 只读查询遇到池化进程失败时，在新进程重试一次。
- 初始化声明 UTF-16 位置、工作区文件夹/配置；服务器能力为准；`positionEncoding` 非 utf-16 失败。
- 拒绝 `workspace/applyEdit`；`workspace/configuration` 用静态配置回答。
- 关闭走受管范围终止：优雅 `shutdown`/`exit`，超时升级，等待整个范围静止。

角色：LSP 提供方维护者、部署配置者、tool-lsp 消费者。完成信号：同一工作区两次查询复用进程，第二次看到磁盘最新文本。

失败与边界：被硬杀的 harness 会遗留服务器；本包不加沙箱；不支持省略 open/close 的服务器。

迁移：先做池化与临时打开，再做缓存；不要反过来。

### 子进程 seam 与 Win32 原语：统一生命周期、受管范围与 ABI 证据 {#package-contracts-2.subprocess-and-win32}

来源：`deepseek-harness/packages/subprocess/README.md:1-51@687f282e`、`deepseek-harness/packages/subprocess/win32-process/README.md:1-89@687f282e`。

触发：新增子进程消费者（bash、LSP、持久 shell、进程外 subagent），或实现平台后端。

必须：
- 所有子进程经 `ctx.subprocess` 启动/观察/终止；本地后端在宿主运行。
- seam 拥有可执行文件查找、受管进程范围、有界输出捕获与 spill 恢复、每子进程清洗环境。
- 消费者拥有进程含义（命令/语言服务器）、deadline 与模型可见呈现。
- 服务跨消费者重载保留进程生命周期；消费者负责自己的默认值。
- 提供方管理范围；较弱 fallback 必须显式披露。
- `win32-process` 是仓库唯一的 Koffi 绑定表，供 ACL 沙箱与普通 Job runner 共用；它不是 Cordis 服务，不决定策略。
- 受限进程用 `CreateProcessAsUserW`（沙箱 token + null 环境）；普通 runner 用 `CreateProcessW` + 完整排序 UTF-16LE 环境块。
- inherited-stdio 与 ordinary runner 的 Job primitive 先 suspended 创建、分配到 kill-on-close Job 后再 resume，目标代码不能在分配前运行；`spawnPipedProcess()` 则创建匿名 stdin/stdout/stderr pipes、立即关闭 stdin，并把等待/排空交给调用者，不使用 Job。两条沙箱路径共享 quoting、cwd、null-environment、返回值检查和句柄清理，不共享 Job 分配保证。
- 部分失败关闭已拥有句柄；Koffi out-param/struct 在其 Win32 生命周期后释放。
- ABI probe 与模块加载时 size 断言校验结构；新指针宽度/ABI 先更新 probe 再声称支持。

角色：子进程维护者、平台后端作者、沙箱/runner 维护者。完成信号：bash、LSP、持久 shell 都通过同一服务启动并可被统一终止。

失败与边界：无法建立受管范围时披露 fallback；外部终止在创建与分配之间可留下 suspended 目标；win32 仅 Windows 原生加载。

迁移：先收敛所有 spawn 到一个 seam，再各平台实现受管范围。

### Bash 工具：job 化执行、前台超时转后台、退出标记与升权重试 {#package-contracts-2.bash-job-lifecycle}

来源：`deepseek-harness/packages/shell/tool-bash/README.md:1-229@687f282e`。

触发：实现命令执行工具，或处理长命令/后台任务。

必须：
- 每次执行注册为 job；前台在超时后转后台，不杀死正在产出的工作。
- `job_output` / `job_kill` 等操作按 job id 定位；输出有上限并可 spill，读取可继续。
- 进程退出写持久退出标记；模型之后能看到结束状态，而不是永远 running。
- 升权（sandbox 受限 → 放宽）是显式重试，不是静默降级；每次尝试有独立结果。
- 取消/终止按进程组/受管范围，先优雅后强制；超时分类与用户取消分开。
- 输出呈现区分 stdout/stderr/退出码；不把 stderr 当失败的唯一依据。

角色：工具作者、job 运行时维护者、executor 提供者、模型。完成信号：前台命令超时后继续以同一 job 运行，返回 id 且 job_output 从已消费位置继续。

失败与边界：job 状态是进程本地与日志协作；跨重启不恢复进程。前台超时转后台是默认语义，不是可选优化。

迁移：先 job 化与退出标记，再做升权。

### 进程沙箱：逐调用策略、fail-closed、完整度披露与单次升权阶梯 {#package-contracts-2.sandbox-fail-closed}

来源：`deepseek-harness/packages/sandbox/sandbox/README.md:1-184@687f282e`。

触发：实现或选择 sandbox provider，或调整文件/网络策略。

必须：
- 策略逐调用解析，不由全局开关决定；每次 spawn 都带解析后的文件/网络策略。
- 不能执行所请求策略时 fail closed（`SANDBOX_UNAVAILABLE`），不静默放宽。
- provider 披露完整度：哪些限制真正生效、哪些只是声明；同一世界限制要如实说明。
- 升权是单次、显式的阶梯：受限执行失败后，只有明确请求才放宽，且记录原因。
- 临时目录/可写根按调用隔离；不把宿主全局可写当默认。
- 消费者不假设所有平台能力相同；平台不支持时返回稳定错误。

角色：沙箱维护者、平台后端作者、消费者（bash/fs）、审批服务。完成信号：workspace-write 下工作区内写入成功、工作区外被拒绝并返回 denial 标记。

失败与边界：无容器/弱后端仍可能执行，但必须披露；fail-closed 优先于“先跑起来”。

迁移：先接 fail-closed 与逐调用策略，再实现升权。

### PTC 执行 seam：可移植绑定名、结构化结果与一次性运行 {#package-contracts-2.ptc-runtime-portable}

来源：`deepseek-harness/packages/ptc-runtime/ptc-runtime/README.md:1-150@687f282e`。

触发：实现或选择 PTC 后端，或定义绑定命名空间。

必须：
- `resolve(request)` 校验 cwd、timeout、sandbox 选择并应用 provider 默认；`run(spec)` 执行完整输入并在清理后解析结果。
- `programFormat` 选择 async function body（顶层 await/return）或 REPL statements（顶层声明、await、最终表达式）。
- 无损 JSON 完成→`result.value`；文本→`result.logs`；失败→`result.error`，kind 为 `exception`/`timeout`/`abort`/`worker-exit`/`invalid-output`/`output-limit`/`protocol`/`sandbox-unavailable`。
- 绑定全局与错误类名匹配 `[A-Za-z_][A-Za-z0-9_]*`，避开 ECMAScript∪Python 保留字、后端自有槽（`console`、`__dsh_main__`）与错误成员排除集。
- `language` 与 `isolation` 只是诊断描述符，不授予权限也不证明隔离；`sandboxMode` 仅表示 provider 是否接受解析后的文件策略。
- 保留内存只属于显式 `stateOwner`；不同对象身份不共享环境；省略 owner 用临时环境；同一 owner 调用不得重叠；`release(owner)` 结束保留。
- `run()` 是一次性：logs 只在解析后的结果上，不提供流式日志/进度 API。

角色：seam 维护者、后端作者、PTC 消费者。完成信号：同一绑定命名空间在 Node 与 Python 后端都可运行。

失败与边界：非法名字/未解析输入/dispose 后调用在运行前拒绝；实验 Python 后端拒绝显式策略；无容器后端。

迁移：先冻结可移植标识符与结果词汇，再接后端。

### 超时库：夹取提示、截止融合、首次原因分类与空闲看门狗 {#package-contracts-2.timeout-deadline}

来源：`deepseek-harness/packages/util/timeout/README.md:1-153@687f282e`。

触发：能力接受调用方 `timeoutMs`，或读流需要空闲保护。

必须：
- `clampTimeout` 缺失时填后端默认、封顶到最大值；非正/非有限值带名称拒绝；零不是公开禁用超时。
- `deadline` 用一个计时器与上游信号经 `AbortSignal.any` 融合，采用先中止者的原因；`TimeoutReason` 带能力 `code` 与 elapsed `timeoutMs`。
- 信号只通知：调用方自己把 signal 交给 fetch，或监听 abort 杀进程/socket/task；不要用 Promise.race。
- `timeoutOf(signal, code)` 只在本 deadline 计时器先触发时恢复原因；上游先胜出保持普通取消。
- `timeoutMs <= 0` 是后端内部哨兵：不设计时器，只转发上游（无上游则永不中止）；外部提示必须先夹取。
- `idleWatchdog` 只在 iterator `next()` 未决时计时，`pulse()` 为有活动但无值的传输重臂；消费者思考时间不计入。
- 空闲间隔必须正、有限且不超过 `MAX_TIMER_DELAY_MS`；并发 demand 拒绝；到点自行结算未决读取。
- 本地文件 read/write/edit 不设超时。

角色：能力作者、工具运行时、流式适配器。完成信号：缺失提示取默认、超大提示封顶、合法提示原样进入 deadline。

失败与边界：忽略信号的传输仍可能泄漏资源；空闲看门狗不是总截止；首次原因胜出后不能补充。

迁移：先统一夹取与分类，再逐能力接入。

---

## 你要控制 agent 行为或人工交互

### Plan mode：仅日志整值状态、步骤边界追加与人工评审退出 {#package-contracts-2.plan-mode}

来源：`deepseek-harness/packages/plan/plan-mode/README.md:1-202@687f282e`。

触发：需要“先计划、后执行”的协作模式，或实现计划审批 UI。

必须：
- 只持久化一个仅日志整值事件 `plan/mode`，最后记录值即状态；resume/fork/压缩靠 fold 恢复。
- 无 open turn 时模式变更立即追加；open turn 中保持 pending，直到下一次被接受的 in-turn pre-step 追加；追加失败不能阻塞 turn。
- `section` 是唯一必填配置，渲染为 `plan:policy` 提示段；其他字段加载失败。
- 计划模式是软约束：所有工具仍可调用；强制限制需另配 sandbox 与 approval。
- `/plan` 无参数=激活；精确 `off`=关闭且不产生模型输入；其他非空参数=激活并把 trim 后文本经 `agent.steer()` 作为下一普通用户消息。
- `/plan off` 携带附件在模式变更前拒绝，保留草稿与卡片。
- `exit_plan_mode` 无论激活与否都注册；批准记录 silent pending exit，下一次被接受 pre-step 追加，使当前工具批次仍受计划引导。
- 无 user-questions 通道或评审中服务重载时 fail closed；`/plan off` 是手动逃生口。
- 投影单元把日志命令运行转成 candidate，并在 `plan/mode` 提交状态，派发 `{ active, pending }`；读取需要 `plan` 与 `turnBoundary` 两个投影键。

角色：plan 包维护者、命令适配器、UI 评审者、模型。完成信号：进入计划模式后模型看到 section；/plan off 后提示段消失且不产生模型输入。

失败与边界：pending 选择在进程退出后丢失；无交互评审时工具无法运行；新建子级默认 inactive。

迁移：先做仅日志状态与步骤边界追加，再做命令与退出工具。

### Preset Persona：作用域内遮蔽、complete 模式与运行时上下文抑制 {#package-contracts-2.persona-scoped}

来源：`deepseek-harness/packages/preset/persona/README.md:1-127@687f282e`。

触发：某个 preset 需要独立人设，或需要把 prefix 作为完整系统提示词。

必须：
- 只能在 agent scope 的 preset 组合内挂载；全局挂载与 `deployment:persona-prefix` 注册冲突并 fail loud。
- `prefix` 必填，渲染为 `deployment:persona-prefix`（order 0）；`suffix` 默认空，渲染为 `deployment:persona-suffix`（order 10200）。
- 空模板仍遮蔽部署级段落，然后在渲染时消失；省略 suffix 不继承全局 suffix。
- `complete: true` 时 assembly 仍解析 contexts/tools/variables/监听器，但注册表把渲染后的 prefix 恢复为唯一段落；其他贡献不得追加提示文本。
- `includeRuntimeContext: false` 抑制该 scope 的所有可选上下文贡献；required 贡献仍保留，拥有服务不被禁用。
- 模板变量在渲染时严格解析；未知变量使渲染失败，不静默保留。

角色：preset 作者、系统提示注册表维护者。完成信号：某 preset 挂载 persona 后该 agent 使用自己的 prefix/suffix，其他 agent 仍用部署默认。

失败与边界：无 per-provider 运行时上下文过滤；complete 会移除所有其他系统提示 token。

迁移：先确认注册表已有部署级 persona 段，再把该行实现为 scoped shadow。

### Ask-user 工具：阻塞/定时双模式、pending 结果与子 agent 拒绝 {#package-contracts-2.ask-user-timed}

来源：`deepseek-harness/packages/interaction/tool-ask-user/README.md:1-168@687f282e`。

触发：模型需要向用户确认/选择，或实现回答 UI。

必须：
- 默认阻塞等待；`mode: timed` 时正超时先返回 pending，问题仍可回答；`timeout: -1` 无限等待。
- `mode: legacy` 或省略配置保持阻塞 schema；timed 行是 preset 内插件行。
- 行级 `timeout` 是每次 timed 调用默认；模型提供的正 timeout 覆盖；模型 `-1` 只对该调用（含全部问题）生效。
- 问题 id 在一次调用内唯一，答案回显 id；推荐选项放首位并加 `(Recommended)`。
- 超时从来不是批准；无 answerer 时阻塞/`-1` 调用报错，有限 timed 到点返回 pending。
- 取消、调用者不是精确 live runtime root、或 live child 调用都返回错误；child 以 `DELEGATED_CALLER` 拒绝，必须把未决决策写入最终结果。
- 答案每问一项：`selected` 为选项标签，`custom` 补充多选或替换单选，跳过项两者皆空。
- 迟到答案作为 user 消息，带 `kind`/`tool`/`callId` 与原问题；Web 配对问答，其他消费者收到紧凑 JSON。
- projection 从记录的工具 schema 识别 timed 原生调用（即使调用省略 timeout）；schema 变更需提升 `stateVersion`。

角色：工具作者、preset 配置者、回答 UI、模型/子 agent。完成信号：timed 调用到点返回 pending，随后答案以 user 消息到达并可被后续步骤读取。

失败与边界：legacy 永不 pending；PTC 等待中断可能丢失问题；原生答案以 JSON 文本呈现。

迁移：先实现阻塞 seam，再加 timed 与 projection；不要用超时暗示批准。

### 循环卫生 guard 家族：重复调用提醒与声明式工具超时 {#package-contracts-2.guard-loop-hygiene}

来源：`deepseek-harness/packages/guard/README.md:1-51@687f282e`。

触发：组合 dsh base 或自定义 bundle，或处理模型重复调用/挂起工具。

必须：
- `repeat-tool-reminder` 检测完全相同的工具调用，提醒模型改变方法或结束；它只是 advisory，不阻止调用。
- `timeout-policy` 对声明了时限的工具调用施加时间限制，返回明确的 timed-out 错误，而不是拖住会话。
- 两者都在 `dsh` base bundle 中默认启用；组合可以调优或移除。
- 只有工具 schema 声明了 timeout，timeout-policy 才覆盖该调用；未声明的不强行限时。
- 相关权威：tools 子系统的工具调用管线、配置目录中的 repeat-tool-reminder 字段、timeout deadline 库。

角色：bundle 组合者、工具作者、agent 运行时维护者。完成信号：重复完全相同的工具调用触发一次改变方法/结束的提醒。

失败与边界：提醒可能被模型忽略；组 README 不含子插件完整配置。

迁移：保留两个默认 guard，按工具 schema 与循环特征调优；不要用提醒替代强制终止。

---

## 你要接浏览器、钩子、Webhook 或运行时反射

### Computer-use 单提供者槽：名称注册、effect 释放与共享桌面边界 {#package-contracts-2.computer-use-provider-slot}

来源：`deepseek-harness/packages/computer-use/computer-use/README.md:1-87@687f282e`。

触发：接入桌面控制 provider，或实现 computer-use 工具。

必须：
- 单提供者槽按名称注册；第二个活动 provider 冲突，不能并存。
- provider 的注册/释放随 Cordis effect；卸载后不留控制器。
- 共享桌面是外部资源：provider 必须声明/处理所有权，不能假设独占。
- 工具层只依赖 provider 中立动作；平台差异留在 provider。
- 失败（无 provider、权限不足、桌面不可用）返回稳定错误。

角色：驱动提供者、部署配置者、调用方工作流。完成信号：挂载一个 provider 后 providerName 报告其名称并可使用其工具。

失败与边界：单槽意味着不能同时跑两个桌面后端；共享桌面冲突由 provider/部署处理。

迁移：先定义单槽与动作词汇，再接 provider。

### 浏览器会话预留：单 Agent 附着、配置而非工具参数、清理失败保留 {#package-contracts-2.browser-session-reservation}

来源：`deepseek-harness/packages/experimental/browser-use-stagehand-native/README.md:1-169@687f282e`。

触发：让 agent 使用浏览器，或实现浏览器 provider。

必须：
- 一个浏览器会话同时只附着给一个 Agent；预留是显式的，不能两个 Agent 共写。
- 连接/选择是配置，不是模型工具参数；模型不能随意切换到别人的会话。
- 预留记录所有者与生命周期；释放/结束要清理，但清理失败要保留记录供诊断，不假装已释放。
- 外部浏览器进程可能比会话活得久；恢复不承诺重建外部进程。
- 失败（已被占用、不可达、无权限）显式返回，不自动新建替代会话。

角色：浏览器 provider 维护者、profile 配置者、Session 调用者。完成信号：同一 Session 多次工具调用复用其浏览器；释放后可重新附着。

失败与边界：清理失败保留状态；跨重启不恢复浏览器。

迁移：先实现预留与所有权，再接工具。

### Claude Code 钩子桥：明确子集、失败包容与串行顺序 {#package-contracts-2.hook-bridge-compat-subset}

来源：`deepseek-harness/packages/experimental/hooks-claude-code/README.md:1-195@687f282e`。

触发：兼容 Claude Code hooks，或把钩子映射到本仓事件。

必须：
- 只实现明确列出的子集；未支持的事件/字段显式忽略或报错，不假装兼容。
- 钩子失败默认包容（不影响主流程），但记录诊断；需要阻断的钩子要单独声明。
- 同一事件的多个钩子按串行顺序执行；不并发写同一状态。
- 输入/输出映射保持字段语义；不把宿主特有字段透传给 hook 作者。
- 超时/取消终止钩子进程；不无限等待。

角色：桥接维护者、使用既有 hooks 的用户、原生插件作者。完成信号：PreToolUse deny 阻止工具并把 provider 原因原样给模型；无原因时使用固定文案。

失败与边界：子集之外的语义不保证；钩子失败不改变主流程是默认策略。

迁移：先列子集与失败策略，再实现映射。

### Webhook 可信规则：提交点、失败回滚与进程内尽力投递 {#package-contracts-2.webhook-trusted-rule}

来源：`deepseek-harness/packages/experimental/webhook/README.md:1-86@687f282e`。

触发：配置 webhook，或实现投递/重试。

必须：
- webhook 规则在明确提交点生效；规则变更失败要回滚到旧规则。
- 只对受信任调用方开放；凭据/签名验证在投递前完成。
- 投递是进程内尽力而为：失败记录、可重试，但不承诺持久 outbox 或 exactly-once。
- 事件 payload 只含批准字段；不把会话内容/凭据塞进 webhook。
- 超时/取消终止请求；不阻塞主流程。

角色：规则插件作者、Webhook 运行时维护者、接入适配器作者。完成信号：匹配规则返回请求后创建新 Session，消息 source.kind 为 webhook 且记录四个标识。

失败与边界：进程退出可能丢投递；没有持久队列。

迁移：先定义规则提交与信任边界，再做投递。

### 浏览器 Worker VFS 镜像：发布视图、可达性扫描与惰性分块 {#package-contracts-2.webworker-vfs-pack}

来源：`deepseek-harness/packages/experimental/webworker-packer/README.md:1-74@687f282e`；`deepseek-harness/packages/experimental/webworker-packer/tests/exports.spec.ts:1-69@687f282e`。

触发：把文件系统打包给 WebWorker，或实现 VFS 镜像。

必须：
- packer 不编译源码；先构建并确认 `lib/` 新鲜。参数化 library 接收 profile、roster、installation manifest、包目录与 resolution root；worker 在 boot 时组合 bundle，不把已组合配置直接打入镜像。
- roster 包含 profile template bundles、optional bundles、patch 点名包与内部 `dsh.configTrees` 行，再物化 Node 风格依赖闭包；external peer 不绑定 worker，workspace peer 保留。CLI manifest 单独作为 bundle 解析锚进入镜像。
- publish view 使用 workspace/vendor 的 `files` + picomatch npm 切片，排除源码和 workspace dist；外部包保留发布的 src/dist JavaScript，不能把外部包的 src 一概删掉。
- sweep 从非通配 workspace runtime exports 和 assembly seeds 出发。declaration-only condition tree 不 seed；显式 runtime import/assembly entry 请求这些 export 仍失败；runtime target 与 types 条件并存时保留 runtime target。仅推断源码列出的精确 import/require 形式；自有代码不可解析请求拒绝 pack，第三方请求可延迟至 require 时明确失败。
- lazy archive 来自 page asset 的字面量 `require.async("./client.<name>.js")`，不是泛指“大文件”。每个 chunk 独立写为 `lazy/<archive-sha256>.tar.gz` 并登记 path/size/archive；请求包未发布的 chunk 时失败。
- overlay 绕过 publish-view 与 reachability 过滤，按不透明字节保留点目录和示例源码，挂载仅限 home/ 与 workspace/。
- preview fixture 取最新 canonical raw Session generation，经 catalog 严格恢复、编码并验证当前 successor，保留源字节；malformed/unsupported/future 代际拒绝构建，不 fallback；打包后清理临时 successor。

角色：镜像打包维护者、worker 运行时作者、包作者。完成信号：同一输入两次打包产生相同归档与 manifest（确定性）。

失败与边界：规则表由人工判断和源 tests 钉住；计算 import/require、保存的 createRequire 等未支持形式只在运行时解析，需要显式 seed。stale build 会打包 stale 字节，packer 不自动修复。repo CLI 依赖原始、完整且已构建的检出；npm 安装仅保证参数化 library API 可用。preview fixture 拒绝压缩或不规范代际名；普通 overlay 仍只保留字节。本次仅读源测试，未执行 VFS 打包。

迁移：将目标项目自己的 roster、发布切片、runtime exports/seeds 与 chunk 形式作为明确输入，不照搬源仓 CLI 的目录假设。只有目标确有 Worker VFS 交付时激活这些特定构建校验；启用后必须保留 declaration-only/runtime 请求拒绝、发布视图与 fixture 代际的约束效果。

### 运行时 API 检视：只读工具、每进程单注册与 preset 边界 {#package-contracts-2.runtime-api-inspection}

来源：`deepseek-harness/packages/extensions/tool-cordis/README.md:1-77@687f282e`。

触发：让模型检视 Cordis 运行时 API，或新增反射工具。

必须：
- 工具只读；不提供修改/调用运行时对象的能力。
- 每进程单注册；重复注册冲突。
- 输出经过白名单与敏感信息脱敏；不暴露凭据/内部句柄。
- preset 边界决定是否挂载；不需要的 preset 不注册该工具。
- 查询结果带稳定结构；无结果/不可用显式返回。

角色：Creator 模式 agent、插件作者、Host/Client 运行时维护者。完成信号：list 发现 provider 后 query 返回精确方法声明与 live 工具 schema。

失败与边界：反射不等于授权；工具不能绕过访问控制。

迁移：先定义只读查询面与脱敏，再挂载。

---

## 你要接技能、文件、存储、工作区或搜索

### 本地 Skill 发现：目录/扁平格式、frontmatter 门槛、根优先级与监视失效 {#package-contracts-2.skill-discovery}

来源：`deepseek-harness/packages/skill/skill-filesystem/README.md:1-161@687f282e`。

触发：实现技能 provider，或排查“技能没出现”。

必须：
- 支持目录格式（`SKILL.md`）与扁平格式；只有带有效 frontmatter 的候选才成为技能。
- 多个根按优先级解析；同名技能由更具体的根胜出，不静默合并。
- 单层发现：不递归无限深；坏技能跳过并记录，不阻止其他技能。
- 监视/重载失效时显式标记；不继续提供过期技能。
- 技能名/描述来自 frontmatter；路径与调用参数由 provider 约束。

角色：skill 作者、平台配置者、provider 维护者。完成信号：在 .agents/skills 新增目录包后下一次模型步骤出现于目录，无需重启。

失败与边界：缺少 frontmatter、不可读、名称冲突都可能导致技能不可见；watcher 失效不会自动修复。

迁移：先定义根优先级与 frontmatter 门槛，再做监视。

### Office Skill：渐进加载、资源校验与渲染/导出边界 {#package-contracts-2.office-progressive-loading}

来源：`deepseek-harness/packages/skill/skill-office/README.md:1-136@687f282e`。

触发：接入 Office 文档操作，或排查 Office 运行时缺失。

必须：
- 技能渐进加载：先暴露操作入口，再按需加载重型资源；不在发现阶段启动 Office。
- 运行时/引擎在操作前校验；缺失时显式失败或提示下载，不静默降级。
- 渲染/导出与编辑操作边界清晰；输出文件/目录的所有权与失败清理明确。
- 文档内容不进入模型上下文，除非工具显式返回；技能只返回结构化结果/路径。
- 平台限制（引擎、字体、格式保真）如实披露。

角色：Office skill 作者、部署配置者、模型。完成信号：非 Office 任务不加载任何 Office 正文；Office 任务按路由只加载所需子技能。

失败与边界：缺少引擎/资源时操作失败；渐进加载不保证所有格式。

迁移：先定义操作路由与资源校验，再接引擎。

### 文件搜索工具：子进程 seam、打包 rg、双层预算与溢出回收 {#package-contracts-2.fs-search-budgets}

来源：`deepseek-harness/packages/fs/tool-fs-search/README.md:1-223@687f282e`。

触发：实现文件搜索/枚举工具，或调整搜索预算。

必须：
- 搜索经子进程 seam 执行打包的 ripgrep；不依赖宿主 PATH 的任意 rg。
- 双层预算：结果数量与字节/时间分别限制；超限返回稳定错误/截断标记，不无限扫描。
- 溢出结果写到受管临时位置并可回收；不把全部命中留在内存。
- glob 采样在工作区根第一层条目间均衡；分页只暴露一页，无 offset 分页。
- 只读工具不证明共享 workspace；只有同根时读取才能继续。
- 失败码稳定（如 `SEARCH_FAILED`）；平台不支持/安装损坏显式失败。

角色：工具作者、部署者、spill store 维护者。完成信号：无宿主 rg 的部署中 glob/grep 正常返回 workdir 相对路径与行预览。

失败与边界：搜索与文件访问是不同能力；结果多不等于可读。

迁移：先接子进程 seam 与预算，再做分页/溢出。

### Storage 组：具名后端、domain KV 校验与宿主侧可选边界 {#package-contracts-2.storage-domain}

来源：`deepseek-harness/packages/storage/README.md:1-51@687f282e`。

触发：新增非会话持久数据（Workspace 记录、sidecar），或选择存储后端。

必须：
- `storage` 连接已注册后端与已挂载 data-form；`storage-json` 每单元一个人类可读 JSON 文件；`storage-sqlite` 把单元作为 JSON 文档存一个 SQLite 库。
- `storage-domain` 在路由后端上提供 schema 校验、可变更通知的 KV domain。
- 消费者声明 domain schema；写入前校验，读取得到类型化值；变更通知用于更新内存投影。
- 这些包是可选宿主侧组件：不暴露工具、提示词或会话事件给模型；没有非会话持久数据时可整组省略。
- 不宣称已具备：会话后端迁移、log facet、跨进程变更推送。

角色：存储维护者、domain 消费者、部署配置者。完成信号：JSON 后端产生人类可读单元文件；SQLite 后端可定点更新同一单元。

失败与边界：非法值写入被拒；未注册后端不可用；跨进程一致性不在当前范围。

迁移：先选后端与 domain schema，再接首个消费者。

### Workspace 生命周期：持久项目、隐藏而非删除与首次使用目录 {#package-contracts-2.workspace-lifecycle}

来源：`deepseek-harness/packages/workspace/README.md:1-49@687f282e`、`deepseek-harness/packages/api/workspace-controller/README.md:1-74@687f282e`。

触发：创建/移除 Workspace，或初始化首次使用。

必须：
- Workspace 是持久、命名、有序的项目实体，按目录归组会话。
- 移除 Workspace 不删除其文件夹，也不删除会话历史；隐藏/移除的会话仍作为未分组历史可用。
- Workspace 家族需要会话存储与持久化后端；不向模型暴露工具/提示/会话事件。
- `initializeDefault()` 无请求参数；Host 拥有固定 `default-workspace` 目录名，registry 从同一段派生初始标题。
- 默认目录位于账号 `<Documents>/deepseek-harness`（含远程 Web 宿主）；文件系统限制适用。
- Linux 查找需要 `xdg-user-dir` 且 Documents 启用；否则部署必须配置 `documentsDirectory` 或使用目录选择器。
- 已存在的默认 Workspace 直接返回，不再查 Documents；不合格首次使用返回 `undefined`。
- Documents 查找持有 registry mutation queue；可取消，但解析成功后不回滚创建/注册。

角色：Workspace registry 维护者、Host 控制器、Client 导航。完成信号：移除项目后目录与会话历史仍在，会话作为未分组历史可见。

失败与边界：无 Documents 且未配置时首次使用不合格；不向模型暴露内容。

迁移：先定义删除语义与默认目录，再实现 registry 与导航。

### Web 搜索提供方：可用性、错误码、结果上限与引用回退 {#package-contracts-2.web-search-provider}

来源：`deepseek-harness/packages/web/README.md:1-55@687f282e`、`deepseek-harness/packages/web/web-search-perplexity/README.md:1-165@687f282e`。

触发：选择/实现搜索 provider，或处理搜索失败。

必须：
- `search` 与 `fetch` 共享一个 provider 选择服务；消费者获得一致的工具行为、取消与错误报告。
- 提供方可用性取决于配置：Perplexity 的 `apiKey` 为空或 `baseURL` 不可解析时 provider 不可用，所有搜索返回结构化错误。
- Perplexity 返回的生成答案作为 `content`；`sources` 优先结构化 `search_results`（url/title/snippet/publishedAt），缺失时回退 URL-only `citations`。
- Perplexity 无结果数控制，服务在返回后截断到 `maxResults` 并标记。
- provider 失败→`WEB_PROVIDER_ERROR`；中止→`WEB_ABORTED`；重定向在联系 `Location` 前拒绝并以 `WEB_PROVIDER_ERROR` 返回。
- 只有 `DOMException` 且名为 `AbortError` 才映射 `WEB_ABORTED`；自定义 reason（如 `TimeoutReason`）归为 provider error。
- 默认 `apiKey` 回退 `$PERPLEXITY_API_KEY`；`maxTokens` 必须正整数；`searchRecency` 只接受 `day`/`week`/`month`/`year`。

角色：搜索提供方作者、部署配置者、tool-web 消费者。完成信号：结构化 search_results 存在时 sources 带 title/snippet/date；缺失时回退 URL-only。

失败与边界：URL-only 回退来源缺少标题/摘要/日期；超额来源仍消耗 token 与延迟；abort 分类基于错误形状。

迁移：先定义规范化 `content`/`sources` 与错误码，再接供应商。

---

## 你要接遥测、共享工具或测试

### 产品遥测：显式事件、批量预算与匿名安装 id {#package-contracts-2.telemetry-and-identity}

来源：`deepseek-harness/packages/host/product-telemetry-otel/README.md:1-109@687f282e`、`deepseek-harness/packages/identity/README.md:1-37@687f282e`。

触发：接入产品事件上报，或决定身份字段。

必须：
- 挂载插件不自动采集；应用必须显式 `emit` 选定字段。
- 事件含名称、字符串摘要、发生时间与标量/单层对象属性；插件分配观察时间并把 severity 默认 `INFO`。
- 调用方必须排除 prompt、响应、文件内容、凭据与其他未批准值；插件不自动脱敏。
- 身份只使用每 harness home 一个匿名 id（由遥测/反馈/DeepSeek 请求共享）；首次使用时出现，文件删除前稳定；无配置。
- 插件不读 Session、账户、凭据或设备标识；只传 `x-channel` 与 SDK 协议头，不继承环境 OTel 头或客户端证书。
- 批量/队列/延迟/超时/关闭预算是明确预算；队列满、网络失败、进程退出可丢事件，无持久 outbox 或仓库确认。
- 关闭超时取消活动 HTTP/重试并等待传输清理；不可达收集器可拖满整个预算。
- 默认端点指向生产收集器；测试/自定义部署必须覆盖。

角色：埋点消费者、平台配置者、隐私/分析 owner。完成信号：仅显式 emit 的事件离开进程，未 emit 时不产生网络请求。

失败与边界：导出失败仅本地告警；关闭超时报告可能丢失；匿名 id 不是用户身份。

迁移：先定义事件 schema 与禁用自动采集，再接收集器。

### 不可变分块列表：有界追加复制、插入序迭代与检查点校验 {#package-contracts-2.util-immutable-chunked-list}

来源：`deepseek-harness/packages/util/chunked-list/README.md:1-91@687f282e`。

触发：投影状态只追加，但需要保留旧版本。

必须：
- 空列表用 `undefined`；`appendChunkedList` 返回新头，不修改旧节点。
- 最新块最多 64 个值；追加只复制该块并共享更旧节点（有界 O(1)）；容量控制布局而非总长度。
- `iterateChunkedList` 按插入顺序访问全部 N 值，O(N) 时间与 O(N/64) 暂存。
- 值按引用共享，调用方必须视为不可变。
- `chunkedListSchema(valueSchema)` 校验 JSON 检查点：未知字段、非法值、空块或超大块都拒绝。
- 同一容量常量管辖追加滚动与递归 Zod 校验；包含字段允许空列表时加 `.optional()`。

角色：投影维护者、表/目录消费者。完成信号：追加两个值后第一个头仍只含原值，第二个按序输出两值。

失败与边界：只支持追加；递归检查点受运行时嵌套限制。

迁移：先确认访问模式只有追加与全量迭代，再替换数组复制。

### 单一扩展名语言表：Map 原型安全、持久 lang 提示投影与纯文本回退 {#package-contracts-2.util-code-language-table}

来源：`deepseek-harness/packages/util/code-language/README.md:1-48@687f282e`。

触发：Client 代码预览/diff 与 Host read 卡片需要一致的语言判定。

必须：
- 仓库只有一张扩展名→语法高亮语言表；Client Code 预览、diff review 与 Host read 的持久 `lang` 提示共用。
- 键是规范 grammar id，值是去点的小写扩展名；`languageForPath` 取最后一段最后一个点之后的文本、转小写并用 `Map` 查找。
- `Map` 防止 `foo.constructor` 解析到 `Object.prototype` 成员。
- 未列出的点文件（`.gitignore`）、无扩展名、尾随点、未知后缀返回 `undefined`，消费者渲染纯文本；前导点仍是分隔符，所以 `.env`→`dotenv`。
- 路径分段同时接受 `/` 与 `\`；Windows 路径与 POSIX 一致。
- 表是精选集；无对应 grammar 的扩展名映射最近者（`properties`→`ini`），证书/锁扩展名（`pem`/`crt`/`key`/`cer`/`lock`）不列入。
- `readLangHintForPath` 是同一表上的投影：已记录会话持有的后缀返回其持久 short id，其他后缀返回语言 short name（`powershell`→`ps1`），未知返回 `undefined`。

角色：Client 预览作者、read 工具作者、语言表维护者。完成信号：.env→dotenv、.ts→typescript、Windows 反斜杠路径与 POSIX 得到同一语言。

失败与边界：只按扩展名；不嗅探内容；表小于 Shiki/linguist；无扩展名的知名文件不识别。

迁移：先抽单表与纯函数，再把 Client/Host 两处消费者切过来。

### 测试支持：端点为名的 Remote mock、真实客户端连接与提交式二进制夹具 {#package-contracts-2.test-support-fixtures}

来源：`deepseek-harness/packages/test-support/remote-mock/README.md:1-147@687f282e`、`deepseek-harness/apps/web/tests/fixtures/office/README.md:1-7@687f282e`。

触发：整客户端 spec 需要脚本化 Host，或做 Office 预览回归。

必须：
- Remote mock 通过 `mock.remote.<namespace>.<method>` 配置响应，使用原生 Vitest mock 方法；同一函数同时服务直接调用与真实 Connection 流量。
- 端点名是 Gateway wire 名（`session/page`、`settings/describe`）；`args` 是位置参数列表并去掉尾随 `AbortSignal`；值原样返回。
- 唯一声明是端点属于 `unary` 还是 `stream`；只有显式 `stream()` 或表 `stream` 声明走流。
- 缺失响应使调用失败，并在 teardown 由 `assertNoUnmatched()` 再次报告；访问方法不伪造成功业务结果。
- 包无需业务 Host、不导入 DOM/React/Node 模块，仅作为 `devDependency` 使用；可在 Node 或浏览器页运行。
- 流脚本接收打开 args 与 `StreamHandle`（`push`/`end`/`fail`/`signal`）；`frames` 产完即结束，`openStream` 保持打开。
- `mock.streams` 按打开 args 过滤；`opened`/`drained` 提供等待；消费者取消中止 `StreamHandle.signal`、无异常结束并记为 `cancelled`。
- `MockedRemote` 使用 Vitest 深层 mock 转换整个生成的 `TypertRemoteNamespaceMap`；非空 map 保留命名空间/方法/参数/结果/spy 类型；空 map 只让该测试代理为 `any`。
- 交付 Remote/mock 变更前运行真实的 Client 类型检查；未构建/部分声明需先重建，`any` 推断不算严格类型证据。
- Office 夹具是提交的 `preview.doc`/`preview.xls`/`preview.ppt`，固定内容、来源可公开、保留 Harness MIT 许可；浏览器回归验证实际转换与可选中 PDF 文本；不含用户文档，不需 Office 应用或生成器；只覆盖简单旧格式导入。

角色：测试作者、Client 插件作者、预览回归维护者。完成信号：未注册端点被调用时失败并在 teardown 列出 miss；注册后同一 mock 同时服务直接调用与 rpc 流量。

失败与边界：仅进程内 carrier；值按引用不序列化；不校验 unary 响应形状；规则只按端点匹配；原生流 override 绕过脚本日志。

迁移：先建立端点为名的默认表与未匹配失败，再补流脚本与类型检查。

---

## 你要写 SDK、桌面打包或发布安装包

### Python SDK：显式 home、惰性运行时、resume 语义与 profile 定制 {#package-contracts-2.python-sdk-contract}

来源：`deepseek-harness/python/sdk/README.md:1-100@687f282e`。

触发：从 Python 驱动 Harness，或实现 SDK 运行时。

必须：
- 安装 `deepseek-harness-sdk` 同时安装完全同版本的 `deepseek-harness-runtime-bin` wheel。
- 每次启动必须显式 `dsh_home` 或子进程环境中非空 `DSH_HOME`；SDK 故意从不发现 `~/.dsh`。
- `DeepSeekHarness` 惰性启动，`close()` 或上下文退出前复用运行时；初始 profile 握手有独立 30 秒默认上界，普通 turn 除非设置 `request_timeout_seconds` 否则无界。
- `cwd` 是 agent 工作区，`runtime_cwd` 独立选择子进程工作目录，两者启动前转绝对路径。
- `provider`/`model`/`reasoning_effort`/`max_tokens` 在 JSON-RPC 初始化时发送；`reasoning_effort` 是适配器拥有的精确路由标识；`max_tokens` 是根 agent 及进程内后代的每请求输出上限。
- `resume_session` 恢复持久历史并返回可 run 的 Session；保存原 session id 并复用同一 `dsh_home` 与 workspace；恢复保留存储目录、修复中断的最后 turn、不发送新输入；缺失/不可读/不兼容/被占用会话直接报错且不创建替代；不恢复外部进程。
- `start_session(id)` 只打开惰性句柄，不请求持久恢复。
- 持久定制属于 dsh profile：`dsh plugin --profile sdk add file:...` 装入 profile 包树；manifest 记录依赖与有序 bundle 层；`$DSH_HOME/profiles/sdk/cordis.patch.yml` 是持久用户补丁；一次性 `patches` 按序转发在 profile/home 之后。
- profile 可换但必须保留 `@deepseek-ai/dsh-sdk-app` 或等价 `sdk-jsonrpc-server` 行；错误配置在 CLI boot 或 SDK 初始化失败，无完整配置回退；任意 argv 替换不是公开 API。
- `Session.run()` 活动区间从 prompt 的持久 inbox 收据到下一次整 agent 空闲；`RunResult` 含 `session_id`/`final_response`/`finish_reason`/`events`/`notifications`。
- `final_response` 是区间内最后提交的根会话 assistant 文本；`finish_reason` 是最后根会话 `turn/end` 的 kind；缺字符串 `data.reason.kind` 抛 `SdkProtocolError`。
- `notifications` 接收根会话及已知后代；`events` 只含根会话事件，后代输出不能替换根响应；低级 `session_prompt()` 立即返回排队 id，调用方自己负责活动边界。
- Office 操作需显式 `download_office()`，之后无需 agent/Session/模型请求/API key/home；输出必须不存在；成功归调用方，失败由 Kit 删除；`OfficeError` 保留 CLI 失败码，畸形结果抛 `SdkProtocolError`；重算不验证业务逻辑或 Excel 保真；Ctrl+C 等待清理，第二次强制终止可能留下部分输出。

角色：Python 应用作者、SDK 维护者、profile 配置者。完成信号：同一 DeepSeekHarness 多次 run 复用运行时；close 后进程结束。

失败与边界：不恢复外部进程；`sdk-minimal` 工具集有限；Windows Office Ctrl+C 有限制；无完整配置回退。

迁移：先强制显式 home 与惰性启动，再实现 resume 与 profile 定制。

### Desktop 打包：版本确认、预设/密钥分离、目标隔离与构建发布分离 {#package-contracts-2.desktop-build-config}

来源：`deepseek-harness/apps/desktop/packaging/README.md:1-279@687f282e`。

补读：`deepseek-harness/apps/desktop/scripts/desktop-package-environment.d.mts:1-37@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-package-environment.mjs:1-173@687f282e`、`deepseek-harness/apps/desktop/tests/package-target-errors.spec.ts:1-72@687f282e`。

触发：准备 Windows/macOS 安装包，或配置签名/发布。

必须：
- 每次打包前先与当前用户确认完整版本串；部署设置本身不授权版本选择。
- 生产 Desktop 版本精确等于 dsh base（含 alpha/beta/rc）；测试版保留完整预发布 base 并追加 `.YYYYMMDD.index`，稳定 base 用 `-test.YYYYMMDD.index`；日期用 Asia/Shanghai 实际创建日。
- 每个 base 与日期从 index 1 开始，检查保留发布记录与已发布对象后递增；绝不复用已发布版本；测试分发不发布对应无后缀 base。
- 手工 CI 使用独立未发布 `auto` 构建标识：UTC 日期 + run number + attempt；这些数字不是保留发布序号。
- `--build-version` 作为单一值传达到 artifact 名、update feed 与 upload 验证；manifest 保留产品版本。
- 生产发布发布产品版本并不带 `--build-version`；上传在 artifact 公开后把打包提交标记为 `desktop-v<version>`；修改过的 checkout 不打 tag；tag 失败打印手工命令而不让已完成上传失败。
- 每个 artifact manifest 记录 `dshBuildCommit` 与 `dshBuildDirty`。
- 安装器独立嵌入 `DSH_DESKTOP_UPDATE_CHANNEL`（默认 `nightly` 或 `latest`），与版本/部署无关；自动更新停留该 channel；`latest` 拒绝预发布版本；已安装更高版本不能降级。
- 本地 Windows 命令用 `DSH_PACKAGING_CONFIG_DIR`（绝对机器配置目录）与 `DSH_PACKAGING_PRESET`（`test`/`production`）；loader 读 `presets/<preset>.env`，签名命令另读 `secrets/windows-signing.env`；相对证书/SignTool 路径相对声明文件解析。
- 公共 preset 只接受固定公共 allowlist（app ID、auto-update env、registry、mandatory-update、test download 与平台调优字段）；signing/upload 设置与生产下载字段按 unsupported 拒绝，preset 的 `DSH_DESKTOP_AUTO_UPDATE_ENV` 必须等于 preset 名；签名文件不能覆盖公共设置；缺配置失败且不回退 `.env.windows`；unsigned 与 Windows preparation-only preset 从不读签名文件；macOS preparation-only 仍读签名凭据。
- `test_release_id` 空白用机器 preset；非空必须 32 位小写十六进制且要求 test preset；同平台连续升级测试保持同值。
- 非机器 preset 模式下，打包/上传/手工 macOS 签名验证读 `.env.windows`/`.env.macos`；release 字段只来自所选配置文件，不回退系统/shell 变量；文件 UTF-8 可带 BOM；本地 env 被 Git 忽略且不进入 artifact；dotenv 解析失败不得透传可能含凭据的 parser 原文，不支持字段不回显值，NUL 值拒绝；loader 不修改父环境。
- 每个 package 命令构建/下载前检查 app ID 与 mode-specific update/signing 配置，再探测外部工具；unsigned 与 Windows preparation-only 不需签名凭据，macOS preparation-only 仍需签名凭据，`skip_notarization` 只免公证、不免签名；检查不认证 PIN、不登录 token、不解锁 keychain、不联系 Apple。
- 每个 target 独占 packed inputs、runtime、package set、dsh tree、pnpm preparation state、unpacked app、update metadata 与 artifact，位于 `targets/<target>/`；target 构建不消费另一 target 的可变状态。
- 打包、发布与安装资格是三个独立操作；手工 workflow 不发布 release；成功 workflow 不证明生产 preset、新工作站或已安装升级验收。
- macOS 打包命令打印 `DESKTOP_PACKAGING_RECORD`，在 `.desktop-build/packaging-runs/` 唯一目录保留 `run.json`（published/product version、Git commit、dirty、target、Node 版本）、`events.jsonl`、脱敏 `stdout.log`/`stderr.log` 与 `result.json`；失败也保留，缺 `result.json` 表示完成未确认；已知凭据值不得进入日志，环境与 notarytool auth 参数不记录。

测试边界：`package-target-errors.spec.ts` 静态覆盖父进程失败时 journal/terminal 脱敏及 stage 结果；其异常在签名 release record 清理处触发，不能当作真实 notarization proxy 恢复、全部日志或真实凭据加载的证据；本轮未执行源测试。

角色：打包操作者、发布 owner、签名/安全 owner、CI 维护者。完成信号：test 版本按日期/index 递增，生产版本精确等于 base；--build-version 同时进入 artifact 名与 upload 验证。

失败与边界：Linux 不是支持 target；本地 unsigned 不可分发；配置 preflight 不认证凭据；自动降级禁用。

迁移：先分离配置/密钥与 target 状态，再把发布设为独立显式步骤。

### Desktop 运行时文件策略：显式过滤、运行时补丁分类与安装/冒烟证据 {#package-contracts-2.desktop-runtime-file-policy}

来源：`deepseek-harness/apps/desktop/packaging/README.md:151-279@687f282e`。

补读：`deepseek-harness/apps/desktop/scripts/macos-app-update-config.mjs:1-91@687f282e`、`deepseek-harness/apps/desktop/tests/macos-app-update-config.spec.ts:1-75@687f282e`。

触发：修改 Desktop 资源过滤、新增原生依赖/Office 引擎、应用 workspace patch，或实现安装器回滚。

必须：
- 运行时文件策略在签名与完整性封装前过滤 `resources/app.asar/dsh/node_modules` 副本。
- 排除 TypeScript 声明、可识别 JS/CSS/TS source map、TS 构建缓存、Domino 测试目录与 Yarn 开发元数据、选定原生编译器输出、其他平台 `node-pty` prebuild；非 Windows target 另删 `node-pty/third_party/conpty`，Windows 保留。
- 保留运行时 JavaScript、目标原生模块及 DLL/EXE 助手、WASM、未知资产、许可证与 notices；普通 `.map` 数据资产保留。
- Office provider 携带 target 声明的原生引擎，无匹配时用 WASM；准备阶段在打包前拒绝缺失 target 引擎；完整 Office 依赖解包到 `app.asar.unpacked/dsh/node_modules`。
- payload smoke 在 Electron `RunAsNode` 下、Host smoke 与最终 inventory 前运行，解析 search 工具的 ripgrep 并验证文本搜索/枚举。
- Host smoke 创建 DOCX/XLSX/PPTX；Windows release 资格另跑目录替换/回滚与锁定文件替换冒烟。
- Windows 安装器在启动时、目标选择后、替换目录前检查运行中的应用；运行中阻止安装，更新最多等 10 秒退出。
- 同路径升级在提升成功前保留旧目录；解压失败保留旧目录；提升失败尝试恢复；启动前删除旧备份。
- 目录重命名/空目标移除/恢复对 Windows 错误 5/32/33 最多重试 10 次，250ms 递增延迟（每操作 11.25 秒）；其他错误立即停止。
- 替换失败写 `directory-failure-<timestamp>.log`；恢复失败保留备份并停止后续重试；提取失败写 `extract-failure-<timestamp>.log`。
- 7-Zip filter 固定为 `BCJ` 以兼容捆绑 NSIS 解码器。
- 补丁策略把每个 workspace patch 分类为 `shared`/`workspace-only`/`runtime-only`；shared 复用根 patch 字节并按根 lockfile 校验 hash；runtime-only 用独立文件；workspace-only 属于已嵌入 client bundle 的工具/依赖。
- 未分类/过期、缺文件、hash 变化、版本不兼容、workspace-only 包进入 runtime 都停止打包。
- 每次构建仍解析新的 runtime lockfile 再用 `--frozen-lockfile` 安装；跨构建依赖解析尚不可复现。
- 签名 macOS 在组装 App 时、代码签名前写 `Contents/Resources/app-update.yml`（含目录构建与并行 ZIP/DMG lane）；签名 hook 验证精确 feed 与 updater cache 目录；两个 lane 副本与提升后的 App 在写 release completion record 前再检查；缺失/不匹配阻止提升与上传。

测试边界：`macos-app-update-config.spec.ts` 静态覆盖配置 resolve/create/write/verify 的合法形状与精确 feed/channel/cache 拒绝条件；它不调用签名 hook，也不证明打包流程实际在签名前校验或 promotion/upload 被阻断；本轮未执行源测试。

角色：Desktop 运行时维护者、原生依赖 owner、安装器维护者、release 资格执行者。完成信号：排除声明/map/缓存/其他平台 prebuild 后仍保留运行时 JS、目标原生模块、WASM 与许可证。

失败与边界：过滤依赖可识别类别，未知资产保留；Windows 目录冒烟需手工运行；安装器尺寸/首启延迟是测量；Linux 不支持。

迁移：先冻结保留/排除类别与补丁分类，再接入冒烟和安装器回滚。

---

## 快速失败码与标识符索引

- Remote：`API_REMOTE_FORWARDED_EVENTS`、`ctx.remote.$mount()`、`TypertForwardableEventEntry`、`request.agent`。
- 工作区：`initializeDefault`、`DEFAULT_WORKSPACE_DIRECTORY`、`workspaceDisplayTitle`、`documentsDirectory`、`documentsLookupTimeoutMs`。
- 语音：`ctx.speechToText`、`maxAudioBytes`、`maxDurationSeconds`、`downloadSources`、`prepare`、`cancelPreparation`、`configure`、`follow`。
- 会话/命令：`command/run`、`command/done`、`sourceEventSeq`、`plan/mode`、`plan:policy`、`exit_plan_mode`、`session/title-llm-request`。
- 目标命令：`/goal`、`clear`/`pause`/`resume`/`edit`、`Reference attachments for the goal objective.`、`GoalError`。
- 工作流：`tool-workflow/run-start`、`runId`、`WorkflowRunPanel`、`conversation.chat.node`。
- 执行：`ctx.subprocess`、`ctx.fs`、`ctx.llm.prepareCall()`、`SANDBOX_UNAVAILABLE`、`DELEGATED_CALLER`、`stateOwner`。
- 超时：`clampTimeout`、`deadline`、`timeoutOf`、`idleWatchdog`、`MAX_TIMER_DELAY_MS`、`TimeoutReason`。
- Web：`WEB_PROVIDER_ERROR`、`WEB_ABORTED`、`maxResults`、`search_results`。
- 遥测：`x-channel`、`session/title-llm-request` 以外的产品事件由消费者命名；匿名 id 每 home 一个。
- 打包：`DSH_PACKAGING_CONFIG_DIR`、`DSH_PACKAGING_PRESET`、`DSH_DESKTOP_UPDATE_CHANNEL`、`DSH_DESKTOP_UNSIGNED`、`dshBuildCommit`、`dshBuildDirty`。
- 测试：`mock.remote`、`assertNoUnmatched()`、`MockedRemote`、`TypertRemoteNamespaceMap`。

---

## 证据与使用边界

- 来源：`deepseek-harness` 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 55 个英文 README；53 个中文对照正文已完整读取（1-EOF，含显示宽度超过读取器上限的 raw 复核），sidecar 为全文机器解析。中文是人工维护的平行契约，不是生成物，不能只按头部核对。
- 本文件把 README 声明的义务与迁移设计分开写；`verification` 全部是 planned，未执行构建/测试。
- vendor README 不建立本仓治理机制；sidecar 是生成的配对元数据，不是正文。
- 跨域依赖：`packages/boot/plugin-manager/README*.md` 的注册表/启动策略引用 `../../.agents/notes/implemented/architecture/2026-09-18-plugin-install-registries.zh.md` 与 `../app-boot/README.md#profiles`；`packages/api/remotes/README*.md` 的访问控制引用 `../remote-access/README.md`；`apps/desktop/packaging/README*.md` 的发布/签名/更新通道引用 release/CI、supply-chain 与 Agent Note；`packages/**/README*.md` 中涉及 shell、powershell、overlay、tasks 的职责分离由对应域继续定义。本域只记录从这些正文直接读到的包级义务，不声称拥有其上游规则。
- 跨域 canonical 词汇（release、supply-chain、session、llm、client、tools、sandbox、api、skills、storage-workspace、sdk、documentation）以对应域 coverage 为准；本域只保留读到的包级契约。

## 来源索引（固定提交）

来源：deepseek-harness/packages/bundle/web-app/presets/standard.patch.yml:45-65@687f282e
