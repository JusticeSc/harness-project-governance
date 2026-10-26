# rationale-feature-1：功能决策中的可迁移治理机制

本文是分区 `rationale-feature-1` 的独立操作参考。它只从固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 88 组 English/Chinese Agent Note 正文提取机制，不依赖其他分区的结论、旧 Skill 或既有实现。机制计数不是目标；这里保留的是在 Note 中反复出现、且能改变工程行为的治理约束。

## 1. 适用范围与阅读方式

- 输入：`research/note-partitions.json` 为本分区列出的 88 个 English Note 及其 `.zh.md` 对；每一对都完整读取。覆盖记录见 `research/rationale-feature-1-coverage.json`。
- 状态：`archived`、`implemented`、`proposed` 三种。`proposed` 只提供设计知识与触发条件，绝不是现行保证；`archived` 中标注 Superseded/Update 的内容按注记降级，不能把旧结论当现行规则。
- 每条机制都给出：触发条件、必须履行的义务、破坏点、迁移方式、计划验证与已知限制。所有验证在本阶段都是 `planned`，没有运行任何构建、测试、格式化或远端操作。
- 引用格式：`references/rationale-feature-1.md#<anchor>` 指向本文对应小节；机制 JSON 中的 `sources` 给出固定提交内的文件与行范围。

## 2. 机制索引

| 机制 ID | 一句话触发条件 |
| --- | --- |
| `rationale-feature-1.seam-boundary-optionality` | 新增跨包能力、观察面或可选集成时 |
| `rationale-feature-1.unconditional-terminal-delivery` | 异步工作可能在没有人工读取通道时结束 |
| `rationale-feature-1.durable-terminal-truth` | 需要告诉人或模型“它究竟怎么结束的” |
| `rationale-feature-1.fail-closed-delegation-authority` | 委派、子会话或无人工界面的执行者需要权限 |
| `rationale-feature-1.advertisement-is-not-authority` | 配置里出现 URL、主机名、桌面或来源标记 |
| `rationale-feature-1.durable-policy-provenance` | 状态变更要跨 resume/fork/重启存活 |
| `rationale-feature-1.producer-declared-content-shape` | 多种生产方共用一条持久消息或展示通道 |
| `rationale-feature-1.announcement-only-derived-lifetime` | 日志记录的事实与可获取内容寿命不一致 |
| `rationale-feature-1.repo-is-read-only-input` | 工具需要快照、diff 或读取用户工作区 |
| `rationale-feature-1.bounded-work-honest-degradation` | 输入、输出或诊断可能无界 |
| `rationale-feature-1.explicit-stop-hidden-work` | 隐藏、归档、退出或人工终止可能留下在跑工作 |
| `rationale-feature-1.defaults-observable-failure` | 选择默认值、默认挂载或首次使用行为时 |
| `rationale-feature-1.single-fact-single-owner` | 同一事实可能被缓存、复制或二次投影 |
| `rationale-feature-1.negative-controls-and-fences` | 写测试、快照、负例或覆盖率豁免时 |
| `rationale-feature-1.compatibility-is-capability-demonstration` | 桥接外部生态或声称“兼容”时 |
| `rationale-feature-1.consistency-before-identity` | 想改写已提交调用、参数或请求时 |
| `rationale-feature-1.accessible-disclosure-and-confirmation` | 折叠、弹层、破坏性操作、动效与键盘交互 |
| `rationale-feature-1.identity-and-origin-boundaries` | 发送身份头、加载远端页面或读取登录环境 |
| `rationale-feature-1.model-facing-tool-contract` | 设计/修改工具 schema、参数、结果信封或花名册 |
| `rationale-feature-1.phase-specific-extension-authority` | 设计观察/拒绝/改写混合的扩展点 |

## 3. 机制

### seam-boundary-optionality

**机制 ID：** `rationale-feature-1.seam-boundary-optionality`

**触发。** 需要把能力开放给其他包、客户端、插件或观察者；或要把模型不可见的实时观察加到既有工作上。

**义务。**

1. 在依赖方向最低的包中定义与后端无关的词汇和 Service Definition；Provider 只实现该词汇；wire 层和客户端各自拥有自己的半区。不要在可选后端包里定义共享词汇。
2. 可选能力必须能被“缺失”地组合：生产者用运行时 `ctx.get(...)` 读取，绝不声明注入；任何观察失败只记录并吞掉，不能破坏被观察的工作。模型可见事实留在原地，不因未安装 seam 而改变。
3. 观察面必须是非消费的：给观察者绝对 offset，给模型保留消费游标；不能用同一个可破坏读取器同时服务两者。缓冲有界，淘汰后读取返回 `lossy` 并带 `gapBefore`，不是错误。
4. 结算顺序固定：先在仍在运行的流上发终态，再关闭；重连从上一帧的 `next` 续传；`end` first-wins；end 后写入丢弃而不是让生产者收尾 flush 破坏自己的 teardown。
5. 未实现的观察面写成包 README 的限制，不假装已覆盖。

**破坏点。** 在可选服务的消费者里声明 injection，导致无该服务时整个插件加载失败；让浏览器读取会消费模型游标的接口，静默偷走模型永远看不到的字节；用整值 control 帧承载会增长的数据，形成 O(n²)；把实时输出写成持久会话事件，造成日志膨胀与重放压力。

**迁移。** 先建立 seam 词汇与空实现，再逐个生产者接入（每个生产者一个 tap），最后把重复的任务列表/头部列表合并为一个消费者。删除旧读取路径前先证明没有生产者再写入。

**计划验证。** 可选服务缺失时工作照常；throwing registry 不影响被观察任务；非消费读取不推进模型游标；结算终态与关闭同流顺序；lossy 读取返回 gap 而非抛错。证据状态：`planned`。

**限制。** 该机制在 Note 中记录的独立 `ctx.activities` seam 已被后续 jobs 收敛取代（Superseded）；本机制保留的是可选观察、非消费游标与结算顺序，而不是旧包名。前台流式、terminal `pty-send` 观察等被明确延期。

### unconditional-terminal-delivery

**机制 ID：** `rationale-feature-1.unconditional-terminal-delivery`

**触发。** 模型能启动一种异步工作，但其结束只有可选的人工或子级消息通道。

**义务。**

1. 为每一种可启动的异步形态提供可达的终态：要么有可等待的 Task/返回值，要么由运行时在结算事务内主动投递通知。不能依赖子级“愿意上报”。
2. 工具描述里的承诺必须是无条件的。只要调用方拿到过 child id，就投递一次结果说明加最终 assistant 文本；不查询子级是否已上报，不保留让承诺变成条件的记账。做不到无条件就不要在工具 schema 里承诺。
3. 通知与子级编写的消息使用不同的 kind：`agent-message` 表达“child 选择说的话”，运行时 notice 表达“harness 观察到它停下了”。合并会让日志无法区分两者，并把 child 没写的话算到它头上。
4. 投递必须在 dispose 事务内、`releaseOwnership` 之前完成；否则唤醒的 watcher 可能在下一个 microtask 恢复、发现没有 child 并 dispose，从而清空正装着通知的 inbox。建立/恢复期间用 hold 把 child id 预登记，避免空闲父级被误判为已结算。
5. 空闲父级获得普通后续轮；繁忙父级 steer 到最近 step 边界，让同时结算的一批只消耗一个 step。该调度是正确性规则，不做成 Config。
6. 自身已开始拆卸的父级不得被唤醒；改为 inject，且投递失败只记录、不阻塞拆卸。
7. 面向父级的文本只投影非空文本块，保留字节与块顺序；完整子级输出仍留给 SDK/UI 消费方。

**破坏点。** 在 `releaseOwnership` 之后投递；把通知做成可配置开关；只在 child 没发消息时投递；把通知合并进 `agent-message`；把 `subagent/end` 的 payload 扩成携带 parent 再让插件投递；对正在拆卸的父级调用 `followup()`，在即将销毁的 Agent 上发起真实模型请求。

**迁移。** 先建立无条件投递与顺序，再补建立期 hold 与拆卸期 inject；测试必须能在顺序反转或去掉记账时失败。已接受的风险要显式保留：没有持久 mailbox、回执或重试，父级不在线就丢失；拆卸期 inject 的通知在父级被 dispose 时不可读。

**计划验证。** 每个终止原因（完成、失败、上限、取消、拒绝、拆卸）都产生一条通知；fan-out 同批只一个 step；pre-release 顺序测试在反转时失败；父级已消失或发送被拒不影响拆卸；快照必须等待通知实际开启的那个父级轮次。证据状态：`planned`。


**限制。** Note 明确接受：通知只投递不确认，父级不在线即丢失；拆卸期 inject 在父级被 dispose 时不可读；终止原因归因是尽力而为并偏向不高估成功；深/宽树的轮次放大真实存在且按设计不可配置。

### durable-terminal-truth

**机制 ID：** `rationale-feature-1.durable-terminal-truth`

**触发。** 需要向父级、UI、hook 或模型解释一次运行的结局。

**义务。**

1. 从该次运行自己的持久日志推导结局，不要采样当前活动对象或管理器内存。采样只能看到本管理器即将执行的取消，漏掉祖先 `interrupt()`、插件卸载取消等发起方。
2. 把“轮次”与“输入”两套词汇折叠成一个答案：最新能交代已消费工作的轮次，以及此后是否有已接受工作被取消而没有轮次开启。`Inbox` 的 `removedCount` 与 `outcome: 'canceled'` 是区分“被认领后失败/停止/拒绝”与“被丢弃未运行”的关键。
3. 认领过输入的 `blocked` 轮次也算交代（pre-step 拒绝丢弃了消息），应报告“拒绝”而不是“完成”；只有没认领任何输入的 `blocked` 轮次保持不可见。
4. 优先级归消费方：已记录的失败或上限优先于取消；停下一个已经失败的 child 不能把失败改写成取消。
5. 结局词汇归拥有 inbox 标记的包；多个消费者（一次性与可继续）使用同一个 fold，避免各自留洞。
6. 归因是尽力而为并偏向不高估成功：`remove()` 与 teardown `clear()` 的 splice 可能无法区分，误读方向必须是让父级复查已完成 child，而不是信任未完成 child。

**破坏点。** 用 `turn/end` 是否存在判断完成（pre-step 前被停的轮次与空转轮次不可区分）；在 cancel 前采样管理器自己的 Activation；为每个消费者各写一套推断。

**迁移。** 先补 inbox 的删除词汇，再迁移消费方到共享 fold；无法区分的情形写入已知限制，不静默升级为“完成”。

**计划验证。** 每种终止原因逐字固定；移除 fold 的任一半使测试失败；被中断的 child 不再被 one-shot 路径报成 completed；快照与单元测试覆盖拒绝/中断措辞。证据状态：`planned`。


**限制。** 终止原因归因是日志既有 splice 词汇上的尽力而为；需要更丰富的删除词汇才能完全区分。归档的活动检查与写入是两步，期间开始的回合会被隐藏，直到写入后的第一步被阻断。

### fail-closed-delegation-authority

**机制 ID：** `rationale-feature-1.fail-closed-delegation-authority`

**触发。** 一个执行者没有人工界面，或权限范围由上层委派决定。

**义务。**

1. 权限范围在委派时固定，并由持久事件记录（含 `source`）；冷恢复重放它，fork 种子里的陈旧父级策略不能覆盖它。
2. 面向模型的工具 schema 与启动请求不包含权限字段；模型或单次调用不能提升自身权限。放宽只能由父级一侧先放宽再重新委派/继续。
3. 审批能力存在时，子级审批钉定为确定性的拒绝；每次 ask 在任何应答者被咨询前解析，同时保留 `approval/asked`/`approval/decided` 审计对。不要留下“无人查看的挂起问题”。
4. 无人工界面的产品提供方在 Profile/Config 层选择各自原生的非交互模式，默认选择最安全值；未知、交互式或无效值在配置阶段失败。不要镜像父级沙箱到不共享词汇的产品。
5. 危险模式必须有显式确认；计划模式要阻止 `ExitPlanMode` 重新进入执行；MCP elicitation、未声明对话框与意外审批一律拒绝。
6. 告诉子级它的范围：运行时上下文声明“权限在启动时固定、需审批操作会被自动拒绝、需要更宽访问时报告限制而非重试”。不要只靠系统提示词 section，保持父子系统提示词逐字节一致。
7. 失败诊断与 assistant 输出分离，有界、脱敏，不含命令、路径、环境值、凭据或原始协议载荷；前台与后台消费同一事实。
8. 新决策若取代旧决策的审批一半，要写明取代关系与“未来若引入子级应答器必须先推翻本决策”。

**破坏点。** 继承父级审批策略，产生不可见的 blocked 等待；把权限模式放进每次 start 请求；返回 SDK 的无限阻塞 `null`；把原始 stderr 放进诊断；在 `ApprovalService` 内按会话来源钉定，耦合委派词汇。

**迁移。** 先在委派边界写入带来源的策略事件，再切换执行器语义；外部进程提供方保留自己的权限策略，并在边界文档中说明；预发布期不添加迁移时，明确写出旧会话冷恢复折叠到部署默认值。

**计划验证。** executor 边界测试证明即使根应答者本会批准，子级升级仍被拒绝且审计对存在；Config 拒绝每个非法值；真实产品 fixture 证明安全默认、受限拒绝、显式 bypass 与进程树停稳；诊断不含原始命令或路径。证据状态：`planned`。


**限制。** Note 明确：预发布阶段不为旧 child 添加迁移；外部进程提供方（claude-code/codex/dsh-sdk）按各自组合运行；更丰富的 blocked 可见性与逐 child 权限调整被延期而非实现。

### advertisement-is-not-authority

**机制 ID：** `rationale-feature-1.advertisement-is-not-authority`

**触发。** 配置里出现对外 URL、可信主机、桌面/平台标记、来源消息或任何“展示给用户的地址”。

**义务。**

1. 广告与授权分离：`--public-url` 只影响打印/打开的 URL 与环境变量，不配置路由、传输或 cookie 作用域；浏览器可见 authority 必须由可重复的 `--trusted-host` 显式点名，栅栏逐请求校验 `Host` 与 `Origin`。
2. 不让公告根决定路由与 cookie；不让公告主机并入 trustedHosts；不从请求或转发头推断外部链路；不从公告根推断网络暴露。监听始终显式，通配 `--host` 拒绝。
3. 打包时嵌入配置与应用身份；打包应用忽略环境覆盖；只有未打包开发可省略策略配置。避免“忘记配置就静默产出没有强更检查的包”。
4. 桌面 guest 只允许主应用窗口顶层 frame 申请，校验一次性租约、partition 与 `about:blank` 初始文档；主进程替换 renderer 提供的偏好：无 Node integration、无 guest preload、无嵌套 webview、无 plugin、无不安全内容、无对话框、无拖放导航；sandbox/context isolation/web security 保持开启。
5. guest 不继承应用认证转发，不注册应用协议；权限、设备、屏幕捕获、下载、原生弹窗与 HTTP 认证提示拒绝；导航只接受无凭据 HTTP(S)，过滤本地文件、特权协议与已知 Host 地址（含 loopback 别名）。明确这不是通用私网/DNS rebinding 防火墙。
6. 测试登录等高风险窗口使用隔离沙箱、精确 HTTPS 允许列表、仅内存 Session；主进程校验 sender、frame、菜单名与锚点坐标。
7. 不提供关闭 sandbox 的开关，不增加远程调试端口；未来自动化必须是经过认证、限定 target 的 broker。

**破坏点。** 把 `--public-url` 当成认证或路由配置；让 guest 继承应用 preload/IPC；接受任意 frame 的菜单请求；用 `<iframe>` 假装能处理跨域/拒嵌站点；把测试身份提供方导航放开。

**迁移。** 先加广告字段与显式信任列表，再让启动流程在带挂载前缀时仍正确附加 token；最后用真实剥前缀代理 e2e 同时验证公告挂载与 loopback。

**计划验证。** 公告主机不改变 accepted authorities；外来源/未知菜单/非法锚点被拒；凭据失败不创建身份文件；guest 申请的非主 frame 被拒；真实代理 e2e 通过。证据状态：`planned`。

**限制。** 该 Note 明确声明：桌面 webview 实现本身不构成“完整浏览器安全策略可发布”的证据；真实 Electron 挂载时序、焦点、平台样式与存储隔离仍是运行时验证缺口。

### durable-policy-provenance

**机制 ID：** `rationale-feature-1.durable-policy-provenance`

**触发。** 一个状态变更必须跨越 resume、fork、重启或客户端重连。

**义务。**

1. 状态变更写成带来源的持久事件，而不是只改内存或只写客户端状态；冷恢复必须能重放同一决定。
2. 在可能失败的多个 await 之前先占位/预登记，避免“调用方仍在创建，父级已被判定结算”的窗口；失败路径只撤销本次调用添加的持有。
3. 模型可见的切换/边界用既有 durable 事件承载。例如路由切换写成带标识的 user 角色消息，落盘于请求 header 之前；只有真正会发请求的步骤才添加，初始选择、未变化、仅推理强度变化、被拒绝/取消步骤都不添加。失败在 header 落盘前发生时，下一步重复提示是可接受且可解释的。
4. “缺省”不是同意。偏好采用 fail-closed 直到收到经 schema 解析并接受的值；加载中、读取失败、命名空间不可用都不授予能力。已保存的用户值（包括 false）优先。
5. 首次使用/初始化标记不能以显示名称或路径为身份：用持久 id，且标记与登记一起提交；改名、迁移、删除或切换语言不得再次初始化。
6. 登录 shell 环境只读取一次并在所有 Host 间共享；shell 值可覆盖继承值，但不能覆盖 `DSH_*`、`ELECTRON_*` 与读取进程自身的会话变量；失败回退继承环境且不阻塞启动。

**破坏点。** 把提示放进系统提示词（无法从日志重建，也不能标出分界点）；只在客户端展示切换；把缺失响应解释为允许；用目录名当初始化标记；让 `~/.zshrc` 覆盖 `DSH_HOME`。

**迁移。** 先补持久事件与读取端折叠，再迁移消费者；保留旧格式的可接受路径；对无法自愈的旧目录明确写降级，不假装已修复。

**计划验证。** 每条实际发出的切换提示成为保留历史并出现在 Chat/Trajectory；header 落盘前失败会重发；缺省/失败不激活脚本；归档/隐藏历史阻止首次使用初始化；登录 shell 超时/中止/回退各有测试。证据状态：`planned`。


**限制。** 路由提示会成为保留历史并消耗上下文；header 前失败可能保留多条相同提示。首次使用默认 Workspace 会在用户发消息前创建目录与空白 Session。旧目录形态存在无法自愈的降级（无 tombstone）。

### producer-declared-content-shape

**机制 ID：** `rationale-feature-1.producer-declared-content-shape`

**触发。** 多个生产方共用一条持久消息、事件或展示通道，消费者需要知道“这是什么形状”。

**义务。**

1. 把“谁产生”（kind）与“是什么形态”（form）分成两个字段。多个生产方可共享一个 form，一个生产方可发出多个 form。
2. 词汇表只语义、不视觉：颜色、图标、排序、折叠默认值归消费者。form 一次只增加一个值，并随生产方补齐呈现所需的结构化事实。
3. 生产方声明形态时必须同时携带该形态所需事实；用受判别联合在编译期强制（没有 summary 的 notice、没有 sections 的 snapshot 不能通过）。
4. 读取方全有或全无：一个不可读条目使整条记录降级，而不是丢掉它后给出“自信但残缺”的模型输入说明。行的标记报告实际渲染的形态，不是声明的形态。
5. 默认必须是 opaque：未知 form、缺失 form、当前 UI 不认识的 form、条目不可用的 catalog，都按真实换行显示模型文本，再把剩余 source 数据列成字段。
6. 分类信息放在持久 source 中，不放在客户端按 producer 键的表里；这样外部日志、未挂载生产方的日志也能渲染。
7. 不要为上下文复制工具的 `presentCall(args)` 注册表：工具的 args 由模型生成、翻译不可避免；上下文的 source 由生产方自己构造，可以直接记录事实。加注册表只会带来无人需要的翻译、host 计算点、wire 字段与浏览器 bundle。
8. 不要解析模型面向的散文来恢复结构；身份/摘要应基于持久事实，而不是渲染文本，否则改文案会悄悄破坏卡片或误判“内容变了”。

**破坏点。** 复用 kind 当 form，多个生产方共享形态时丢失生产者信息；在客户端把 kind 映射到 renderer，外部日志无法分类；把 `<system-reminder>` 包装隐藏掉；存储转义后的条目，迫使消费者理解框架编码。

**迁移。** 先给一个生产方加 form 与结构化字段，保持模型文本逐字节不变；再把身份从文本 digest 迁到持久条目 digest，提供旧格式的可接受边；最后删除文本切分路径。

**计划验证。** 未知/空/类型不符/缺失 form 全部 opaque；不可读 catalog 回落到 opaque 且不打断步骤观察；instructions 保留原样包装与文件列表；浏览器场景展开真实 instructions 并断言几何不变。证据状态：`planned`。


**限制。** catalog 没有组装态浏览器覆盖，因为隔离脚手架不发布 skill；instructions 的 Markdown 渲染被延期到生产方按文件记录结构化内容之后。旧格式唯一目录可能留下无人替换的陈旧目录，是 context 功能的显式降级。

### announcement-only-derived-lifetime

**机制 ID：** `rationale-feature-1.announcement-only-derived-lifetime`

**触发。** 日志要宣称某个内容存在，但内容本身只活在当前进程/临时目录/附件存储中。

**义务。**

1. 日志只写“宣告”（如轮号），不写摘要、行数或内容副本；内容通过受认证的服务/路由按需读取。否则日志会永远宣称一个 Host 已打不开的卡片。
2. 产品决定“Host 打不开内容的卡片根本不该出现”，因此卡片寿命等于内容寿命，而不是日志寿命；重启后重开的对话可以没有旧卡片。把这一点写成产品决定，而不是事故。
3. 交付/声明只记录路径与说明，不读取或复制内容；编辑后下次打开看到当前字节；删除/移动使声明不可用。不要引入第二份存储权威。
4. 事件仅写日志、永不模型可见；读取端仍要求识别它，静默丢失声明会改变重建/fork 的历史。
5. 路由按当前查看的 Session、事件序号、原始文件索引选择；继承历史中的相对路径按当前 Session 工作区解析；Host 在原生打开前验证普通文件存在与路径映射；不接受浏览器提供的替代路径。
6. 每次原生操作都重新执行可用性检查；桌面元数据随连接代次失效，避免旧主机信息让控件持续禁用或显示错误文件管理器名。

**破坏点。** 把文件列表与行数记进事件（卡片可永远从日志渲染，内容却活不了那么久）；用工具展示文本当持久索引；用不可变附件快照冒充可编辑交付；让浏览器传路径给原生打开。

**迁移。** 先把摘要事件降为宣告，再补 Host 服务与认证路由；删除摘要/副本的日志字段；在包 README 写明重启后无卡片。

**计划验证。** 会话导出包含声明但不含内容；重启后旧轮无卡片；编辑后重新打开看到新字节；删除/移动显示错误；fork 相对路径正确；原生打开拒绝浏览器替代路径。证据状态：`planned`。


**限制。** 会话重开后旧轮没有卡片是明确产品决定；会话 ZIP 只带声明不带文件；无法保证路径 API 的并发替换—复原原子性；Host 桌面元数据会随连接代次失效。

### repo-is-read-only-input

**机制 ID：** `rationale-feature-1.repo-is-read-only-input`

**触发。** 工具要对用户工作区做快照、diff、变更统计或文件捕获。

**义务。**

1. 用户仓库是输入，不是目标：`add --all` 写入从仓库 index 种子化的私有 index，再 `write-tree`；对象写入 Session 自己的临时对象目录，仓库对象库只以只读 alternate 挂接。仓库的 index、对象、工作树与 ref 从不被修改。
2. 基线与首次模型请求并行；快照恰好包含本轮改动，用户此前未提交（暂存或未暂存）的工作属于基线；模型轮中做出的提交也不能藏住改动。
3. 用 `diff-tree -r -M --numstat` 比较两个 tree；不要用 `HEAD` 比较（会把用户未提交工作算到本轮），不要打 tag/stash（留 ref 或漏未跟踪文件）。
4. 无仓库或无 git 时不阻断：不做快照，摘要只列文件工具编辑；嵌套仓库与 submodule 是 gitlink，不深入；这些写成已知限制。
5. 快照覆盖不到的整文件编辑：在 `write`/`edit`/mutating `str_replace_editor` 之前复制整文件到 Session 临时目录，每轮每路径一次，轮末再复制；副本按字节 SHA-1 命名以便去重；逐行比较首尾，不累加 hunk。
6. 每个 Session 一个临时目录；释放时删除；不要用 Harness home 下共享的、带字节上限的对象库（一个 Session 丢弃会让另一个快照失败）。
7. 只有明确的产品需求才引入影子仓库；没有 `.gitignore` 与可靠排除策略时保持延期。

**破坏点。** 把整个前后文本塞进工具结果元数据（每个编辑文件两次进日志）；用内存副本（随轮次增长）；把副本存成 git blob（让文件工具路径依赖 git）；用共享对象库（跨 Session 干扰）。

**迁移。** 先加私有 index/tree 快照与只读 alternate，再加整文件副本路径；把摘要事件改为宣告；最后删除按 hunk 累加与共享库。

**计划验证。** 真实 git 仓库测试确认仓库对象/ ref 不变；忽略文件、工作区外文件、改名、删除、过大 blob、超时退化均有覆盖；无 git/无仓库时卡片仍出现但只列文件工具编辑；一个 Web 场景种入 git 并验证 shell 编辑。证据状态：`planned`。


**来源。** `deepseek-harness/.agents/notes/archived/feature/2026-09-11-turn-changed-files-card.md:12-35@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-changed-file-diff-preview.md:12-23@687f282e`。

**限制。** 覆盖之外的 shell 编辑仍是已知限制；并发替换—复原不在路径 API 保证内；影子仓库延期；每次文件工具编辑每轮读写整文件，受 maxFileBytes 限制；comparison 超时携带两侧全部行（最多两倍上限），tab 只画 5000 行。

### bounded-work-honest-degradation

**机制 ID：** `rationale-feature-1.bounded-work-honest-degradation`

**触发。** 任何可能无界的输入：文件、输出、诊断、diff、重试、轮次、队列。

**义务。**

1. 每个无界量都有上限与明确降级：文件 `maxFileBytes` → `oversized` 且拒绝比较；行比较 `diffTimeoutMs` → 一个替换全部行的 `coarse` hunk；观察缓冲到 `outputEarliest` → `lossy` + `gapBefore`；诊断 4096 UTF-8 字节 → 标记截断且不切断字符；子级文本只投非空文本块。
2. 降级必须可见且语义正确。两侧都超过上限的文件列为 `oversized`，不是丢掉，因为“没读过的内容永远不能认定为没有改动”。
3. “不可读/不支持”要有分类与专门出路，不要落进读取报错：`not-text`/`too-large` 可提供“用默认应用打开”；`not-found`/`not-regular-file` 只给说明；不支持的二进制后缀在读取前就显示空态。
4. 上限改变行为时写进同一份用户可见说明与配置，不把“以后可调”当作现在的保证。
5. 不要把“内容未知”渲染成正常，也不要用 `null` 占位假装已有内容；空槽位必须测过实际 DOM，而不是假设。

**破坏点。** 无界读取后才失败；超时后静默返回部分数据；把 NUL 字节或二进制当文本；把诊断原文透传；把不可读条目丢掉后继续展示。

**迁移。** 先确定降级词汇与渲染分支，再加配置上限；为每个降级写一个断言，负例必须能让它变红。

**计划验证。** 超大文件 `oversized`；超时 `coarse`；UTF-8 安全裁尾；lossy 读取非错误；二进制不提供行；空槽位有可见回退文本。证据状态：`planned`。


**限制。** 上限值本身是产品选择，不是普适常数；超时比较携带两侧全部行；present 删除文件大小上限只适用于元数据声明；观察流淘汰后无法恢复已丢失区间，只能标记。

### explicit-stop-hidden-work

**机制 ID：** `rationale-feature-1.explicit-stop-hidden-work`

**触发。** 归档、隐藏、退出、关闭窗口、人工 kill 或任何“让工作从视线里消失”的操作。

**义务。**

1. 归档绝不隐藏正在运行的工作。默认拒绝：活动查询返回非空时以结构化错误拒绝；错误详情携带各族及条目 id/名称。没有要求停止的调用方（任何客户端或 SDK）都不能把工作藏起来。
2. 只有显式 `stopActivity` 才停止：先写入归档，再派发停止。pre-step 门禁读取持久归档集合，所以停止引发的每次唤醒都已被拦下。停止请求只发出、不等待收敛；失败只记录，不撤销归档。
3. 停止走用户停止的同一条路径：取消回合、kill 所属 job、按父身份取消 subagent 子孙（持久血缘、任意深度、从不包括 fork）、删除该 Session 的已存储定时任务。每个请求各自兜住，一个抛错不影响其余。
4. 已归档即不跑模型步：`agent/pre-step` 拒绝为已归档 Session 或其 subagent 子孙提出的步骤，loop 以 `blocked` 收口且不发请求。取消归档解除整条血缘的门禁。
5. 拒绝即确认：客户端先发普通归档；静默 Session 直接成功；遇结构化拒绝才打开“停止并归档”对话框，清单来自 Host 答案而非客户端镜像；确认后重发；撤销只恢复 Session，不让被停止的工作继续。
6. 人工 kill 不算“已送达”：交付认领属于工具自己的 `job_kill` 与等待；来自任务列表的 kill 让结算照常走完成播报员，否则模型会保留过期世界模型。记录的原因合入 `killed` 的 detail，生产者事实在前，detail 始终按不透明文本处理。
7. 破坏性控件用两击确认（武装、限时确认），只渲染在真正可终止的行；解禁只由权威帧（行离开可杀集合）触发，unary 响应不算。
8. 拆卸期间不唤醒即将销毁的父级；退出应用先隐藏产品窗口再收尾 Host，避免把预期断开显示成恢复错误。安装前先拒新请求、等待已接收请求结束、再检查任务；超时或被替代的等待不能授权安装。

**破坏点。** 只改可见性而不停止；在客户端停止（只覆盖一个客户端）；在写入前等待收敛（把点击悬在最慢取消上）；给 `kill` 加 `notify` 布尔（注册表承诺不了通知）；忽略 kill 的 job 让归档撤销。

**迁移。** 先建立 activity/stop 两个 capability seam 与默认拒绝，再接入各 owner 的族；最后加 pre-step 门禁与客户端确认对话框。把停止收敛的尽力而为与先写后停的残余写进已知限制。

**计划验证。** 忙碌 Session 归档被拒且列出精确条目；确认后先归档再停止；停止后迟到唤醒被 `blocked`；停止失败仍保持归档；人工 kill 的完成通知仍待送达；两击控件只在权威帧后释放；拆卸期通知不发起新请求。证据状态：`planned`。

**限制。** 停止结算尽力而为；活动检查与归档写入是两步，期间开始的回合会被隐藏；崩溃可能留下已归档但仍有已存储任务的 Session；取消归档不重放已被消耗的触发。

### defaults-observable-failure

**机制 ID：** `rationale-feature-1.defaults-observable-failure`

**触发。** 选择新安装默认值、默认挂载、默认重试/唤醒策略、默认首次使用行为。

**义务。**

1. 默认值是产品政策，不是实现细节；把选择与理由写进 Note，并说明它取代了哪个旧默认（只取代默认，不接管旧 Note 的其他所有权）。
2. 在两个失败之间，优先可观察的代价，而不是不可观察的停滞。若上限会让通知停在一个客户端不渲染、无人唤醒的 inbox 里，就不应默认设上限；把上限留给需要它的部署，并在 README/config/JSDoc 写明设置后的静默停摆代价。
3. 默认必须让面向模型的承诺为真：“完成会通知你，不要轮询”只有在无默认上限时才成立。
4. 能力默认开启时，必须先 fail-closed 直到收到被接受的值；缺省不是同意。已保存的关闭值优先。默认只覆盖明确要求的那一项，不扩成通用插件 API。
5. 可选依赖默认不启用：空注册表不贡献提示词、工具 schema、PTC 声明或绑定；首个提供方启用，最后一个移除；连接健康不决定可见性。极简 SDK 在用户添加前只公布一个 shell。
6. 首次使用默认 Workspace 只在 Workspace 与 Session 基线都为空时创建；隐藏、归档、无 cwd 的 Session 都算历史。启动等待完整基线；Session 存在前不可输入；准备失败提供文件夹选择器，不在后续列表通知时重试；选中或创建都不提交消息。
7. 默认展示可以紧凑，但必须保留 Normal 与可访问性出路；默认杀器（关闭脚本、关闭 preview）不能因为“渲染更快”而短暂激活。

**破坏点。** 默认上限把通知停驻；默认开启但设置到达前先激活脚本（卸载 iframe 不能撤销已执行脚本）；空注册表仍暴露不可用工具与提示词 token；用侧栏可见行推断首次使用；把缺失响应当同意。

**迁移。** 先改默认与 fail-closed 读取路径，再补“默认值+显式关闭”的浏览器/回放测试；旧安装升级时说明会覆盖哪些既有偏好。

**计划验证。** 默认下连续四次完成各开一轮；配置上限时停驻测试仍通过；pending/disabled 不读文件也不建可执行 frame；空 MCP 配置零 token；隐藏/归档历史阻止初始化；启动取消不创建目录。证据状态：`planned`。


**限制。** 默认值是可辩论的产品选择；默认上限停驻在配置后仍可能不可见；首次使用会提前创建目录；升级会覆盖既有 API-key 安装的 Chat/用量/开发者工具偏好；远程用户使用 Host 账户 Documents。

### single-fact-single-owner

**机制 ID：** `rationale-feature-1.single-fact-single-owner`

**触发。** 同一事实出现在两个表面、两个缓存、两个事件字段或两个渲染器。

**义务。**

1. 一个事实一个家。可见值若来自计算/渲染结果（如 body 的计算背景色），就让它成为权威，不再增加可能漂移的静态字段；head 元数据只由拥有调色板的 presenter 创建/更新/移除。
2. 已结算内容已是附件引用的权威；不要为了卡片方便在 `meta` 再存一份引用。`tools/post-execute` 合法改写的是 content，重复的 meta 会在内容变化时恰好过期。
3. 一个会话附件只读取一次、只生成一个浏览器 URL；缓存归共享的 conversation 层，多个视图通过同一实例解析；第二个视图声明自己的 slot key 但共享 owner 类型，不要复制加载/重试/灯箱实现。
4. 客户端只从原始 event 字段派生卡片；host 的 `presentCall/presentResult` 不进入客户端。不要为没有消费方的封闭公共联合新增分支。
5. 删除死路径：当所有生产方都只写持久引用时，内联 `imageSrc` 嗅探与本地 `<img>` 渲染应删除，而不是“留着兼容”。保留会留下非持久渲染路径。
6. 组件/样式/时间线若必须耦合（组件常量与 CSS 动画时长），在两侧注释点名耦合，并让常量成为唯一来源。
7. 识别不透明值（附件 id、path、detail），只检查存在性/形状，不解析其表示；否则会拒绝替代存储的合法 id。

**破坏点。** 在 manifest 与计算背景色之间保留两个颜色权威；卡片从 meta 读引用；每个视图各建缓存；为 `ToolResultView` 加无人读取的 arm；让 shell 的显示名成为初始化身份。

**迁移。** 先确定权威来源，再迁读取方，最后删除重复字段/死代码；用“同一 URL 字符串”之类的身份断言钉住共享。

**计划验证。** 详情面板与 Chat 画廊对同一附件 URL 逐字符相同；post-execute 替换后卡片跟随 content；删除内联嗅探后无生产方受影响；视觉/ARIA 只渲染一个元数据节点。证据状态：`planned`。


**限制。** 主题色依赖客户端保持具体 body 背景；附件缓存随 Session binding 释放；present 卡片的原生打开与预览仍是两套打开器，统一被列为下一步；图像卡片在旧会话回放为通用文本卡片是既有降级。

### negative-controls-and-fences

**机制 ID：** `rationale-feature-1.negative-controls-and-fences`

**触发。** 写测试、快照、负例、覆盖率豁免或“已验证”声明。

**义务。**

1. 每组断言在保留前跑负例：移除分类、禁用渲染分支、打错 registrant key、恢复被否定的模式、把卡片文本指回错误来源，都必须让目标断言变红。没有负例的断言可能只是在描述实现。
2. 并发测试要证明“能并发”而不是“没报错”：让两个 child 各自阻塞到两者都已启动；隐藏串行化会死锁而不是静默通过。可继续路径要让两个准备停在同一 await，取消其中一个，证明另一个独立持久化且被取消者不留 Agent/Session。
3. 快照必须为它要等待的“由运行产生的轮次/通知”设显式栅栏：先等该轮开始再等结束；等待一个运行并未保证会产生的轮次不是覆盖，而是超时。用测试专用栅栏把平台调度从 transcript 中移除，但不得伪造通知。
4. 逐字措辞（拒绝/中断原因）可以放单元测试而非重放 transcript，只要通路本身已由组装场景端到端覆盖；说明为什么该措辞无法在无密钥组装中产生。
5. 明确“测试不证明什么”：例如视觉变形、真实 Electron 挂载时序、生产 API 兼容、签名安装、重启后健康、浏览器与剪贴板集成。把这些留在验证记录，不用单元测试冒充。
6. 覆盖率豁免要写明目录、原因与替代覆盖；共享控制器/iframe/保活仍受原覆盖率要求。
7. 快照身份要钉住用户关心的不变量（如“详情面板 URL 与 Chat URL 相同”），而不只是“有图”。

**破坏点。** 只写正例；用 `assert no error` 证明并发；等待一个可能不会出现的轮次；为失败措辞伪造 transcript；把覆盖率豁免当成已覆盖。

**迁移。** 在测试计划里为每个机制列正例、拒绝例、恢复例；先写能让实现失败的负例，再保留断言；把未证明项写进限制。

**计划验证。** 顺序反转/记账删除/分类移除各自使测试失败；并发门控在串行实现上死锁；通知落进已在跑的轮次时快照超时；记录 factory 输出与 ARIA。证据状态：`planned`。


**限制。** 负例本身也可能腐化，需要定期重跑；无密钥组装无法覆盖需要策略插件/取消栅栏的措辞；真实 Electron/生产/签名验证仍需独立运行时证据；覆盖豁免是临时而非永久。

### compatibility-is-capability-demonstration

**机制 ID：** `rationale-feature-1.compatibility-is-capability-demonstration`

**触发。** 要桥接另一个 harness/生态，或要声称“兼容某生态的扩展/插件”。

**义务。**

1. 先判定上游稳定性。若 API 未发布、需要实验开关、tarball 不含构建产物、上游自述“不是稳定契约”，则不应构建兼容层；保留调研结果（服务映射、运行时差异、分级触发条件），而不是留空或硬上原型。
2. 若构建，加载未修改的上游源码，用现有机制承载它能承载的行为；不嵌入上游 harness（会带入其依赖闭包，并在本仓文件系统/沙箱策略之外运行其工具实现）。
3. 明确列出不提供的功能：无法触发的事件在注册时接受、永不触发，并在加载时警告；无法提供的成员抛出指名错误。
4. 在哪里上游失败关闭，桥接也失败关闭。例如编辑 `event.input` 的 `tool_call` handler 必须拒绝该调用并说明原因，否则日志中记录的调用与实际执行不一致；不要“记录警告并继续”。
5. 扩展状态写进可忽略（`plugin:` 前缀）记录，不新增 required-on-read 事件类型；无桥接的构建保留并跳过；未来的格式迁移边尽力携带，不能携带时说明丢弃。
6. 内置工具的名称/参数差异要有双向映射表，并用测试加载真实 schema：被映射参数改名/移除，或新增未分类参数时失败。安全扩展依赖 `event.input.path`，传错名字会让它放行写入。
7. 兼容页面逐项列出与上游的差异、每个缺口对应的追踪 issue、每级的触发条件与风险；不把“示例能跑”当成完整兼容。
8. 对实验性、未稳定插件，分级记录“0 级是唯一产物”，每级写明上游触发与 DSH 工作；不预建原型。把 API 不稳定、facet 能力更少、Host 进程无故障隔离写成风险。

**破坏点。** 依赖上游 runner 复用 loader/runner；自动扫描 `~/.pi` 或 `.pi` 执行用户未组合的代码；把扩展状态放到日志外的 storage（不跟随 fork）；声明 `pi/*` required 事件让无桥接构建拒绝会话；拒绝加载订阅未提供事件的扩展（多数扩展会整体不可用）。

**迁移。** 按“提案—验收—风险”保留为待触发设计；若触发，先建 Host 包与有序分发器，再逐 API 映射，最后补 Web 包与兼容页面。不要因为“已有 11,000 个包”就跳过稳定性判断。

**计划验证。** 上游示例扩展原样作为 fixture；权限扩展拒绝工具调用且模型看到原因；扩展工具在恢复会话后 `details` 仍在；替换系统提示词；卸载时每项注册移除；参数改名使映射测试失败；未提供事件加载时警告。证据状态：`planned`；`proposed` 项没有现行运行时证据。


**限制。** 桥接、改写与 pi-* 来源为 proposed，没有现行运行时证据，API 可能变化或撤回；`2026-06-30-interception-extension-points.md:45-48` 是 archived implemented 基础，只证明现有扩展点（PreToolDecision 不能改写），不证明桥接。1–4 级在 Host 进程运行插件代码，一个未捕获错误会停止所有 Session；3 级依赖上游声明不稳定的 pi-durable 类型；4 级 Remote 由 Chord wire parser 校验；插件包经 Chord 打包器引入 esbuild。

### consistency-before-identity

**机制 ID：** `rationale-feature-1.consistency-before-identity`

**触发。** 想在任何 pre-execute/post-execute 钩子中改写工具参数、模型请求或多条读取方共享的事实。

**义务。**

1. 不要给受保护的执行对象加可变逃逸口。执行身份与参数已被 deep-freeze/不可写；允许 `exec.arguments = ...` 只会产生“执行改了、历史/审计/展示没改”的局部行为。
2. 重写必须是“身份创建前的一致性事务”：在构造不可变执行之前确定有效值，并原子反映到全部读取方——审计记录（原始参数保留在 sidecar）、派生模型历史（与实际执行一致）、展示（读取重写后的参数）。
3. 在现有 `PreToolDecision` 触发点扩展是不够的：两条持久记录已存在、身份已受保护。必须把决策移到日志提交之前，或新增更早的专用决策点，并回答“现有 pre-tool 钩子如何不跑两次”。
4. 在一致性事务实现之前，桥接必须警告/拒绝，不能声称已兑现 `updatedInput`。用 `TODO(...)` 锚定缺失阶段，保留风险与开放问题（provider 回放是否接受改写、原始参数放在何处、与权限 `ask` 的交互）。
5. 该机制当前是 `proposed`：不得在实现或覆盖率中当成已交付能力。它约束的是“不能怎么做”，而不是“已经能做”。

**破坏点。** 直接改执行对象；只改执行不改展示；在工具调用已落盘后才决定改写；为了桥接兼容性而假装支持。

**迁移。** 先固定三方读取方与顺序，再实现更早决策点；在实现前列出受影响的 provider 回放实验与开放问题。

**计划验证。** 若未来实现桥接但尚不支持改写：编辑 `event.input` 被拒绝而不是记录为成功，对 `updatedInput` 如实警告。实现改写后：审计含重写值与原始 sidecar；派生历史与执行一致；展示读取重写值；深冻结贯穿 pre-policy/guards/dispatch/post-policy。证据状态：`planned`；当前桥接与改写能力不存在。


**限制。** 改写与桥接均为 proposed、未实现；若未来实现桥接但不支持改写，应拒绝/警告，不构成当前运行时保证。assistant/message 改写的 provider 回放风险、原参数位置与权限 ask 交互仍未定。

### accessible-disclosure-and-confirmation

**机制 ID：** `rationale-feature-1.accessible-disclosure-and-confirmation`

**触发。** 折叠过程、弹层、动效、破坏性按钮、键盘手势或“只在悬停时显示”的界面。

**义务。**

1. 折叠是终态投影，不改变日志/模型输入；打开中的轮次绝不折叠，历史不完整时既不显示控件也不隐藏成员。没有最终正文的已关闭轮次保留全部过程证据。
2. 使用稳定 Seat/wrapper 改变可见性，不重挂载有状态 renderer；隐藏成员用 `hidden="until-found"` 并处理 `beforematch`，让浏览器查找仍能发现文本。普通选择在 Compact 下不选中隐藏成员，用户可展开或切 Normal。
3. 自动收起若会隐藏键盘焦点，改为展开并把焦点留在原处；手动收起先把焦点移到控件再隐藏。已关闭轮次使用确定性的默认状态，不按“从哪进入视口”分叉；滚动锚定保持位置。
4. 弹层用 `aria-haspopup="dialog"`、锚定定位、视口边距、外部 pointerdown 与 Escape 关闭；七项事实需要可持久、可聚焦的面板，不用 hover tooltip。
5. 动效尊重 `prefers-reduced-motion`；装饰性动画 `aria-hidden`；单次提示在播放结束后确认，避免后续挂载重放；空显示名立即确认。时长上限让长短语言同一窗口完成，不按字符数拖长。
6. 破坏性/不可撤销操作（kill、停止并归档）用两击确认并显示将停止的具体条目；确认文案来自权威答案。控件只在真正可执行的行出现。
7. 图标按钮必须有可访问名；窄屏收起文字时保持几何与节奏；悬停揭示必须在无 hover 设备上退化为常显。
8. 平台隔离用 preload 标记限制共享 CSS 的影响范围；原生控件与 Web 控件各自保留其可访问行为，编辑命令送回焦点编辑器以使用其 undo 历史。

**破坏点。** 把整个轮次 reparent 到一个 summary 下（重挂载）；在 `turn/end` 前折叠流式正文（自动收起—展开—收起）；用 hover 承载诊断数据；用 `hidden`/卸载让页内查找失效；关闭动效偏好仍播放。

**迁移。** 先建立确定性投影与稳定 Seat，再加控件与默认收起；把手动展开存进非持久会话 store；最后补 reduced-motion、焦点与窄屏分支。

**计划验证。** 运行中不折叠；历史不完整无控件；焦点保护；页内查找可发现隐藏文本；Escape/外部点击关闭；480px 几何；reduced-motion 跳过；ARIA golden 只含标签按钮。证据状态：`planned`。


**限制。** 隐藏 wrapper 保留内存以换稳定工具状态；普通跨消息选择在 Compact 下排除隐藏成员；不支持 hidden=until-found 的浏览器无法通过页内查找发现隐藏文本；视觉变形/动画仍靠人工验证。

### identity-and-origin-boundaries

**机制 ID：** `rationale-feature-1.identity-and-origin-boundaries`

**触发。** 发送用户/会话身份、加载远端页面、读取登录环境、使用默认浏览器/剪贴板。

**义务。**

1. 身份值是传输元数据，不是模型输入：不进入请求体、提示词、token 计量、KV cache 身份或会话日志。用 provider 专属 header，不放进通用 `attributionHeaders()`；不放在 OpenAI 兼容的 `user`/`metadata` body 字段。
2. 同一 `$DSH_HOME` 的用户 id 在遥测、反馈与 provider header 中一致；不要另铸 id。凭据解析成功后才惰性解析并 memoize；凭据失败不得创建身份文件。同步/会话 header 只在有 session id 时发送。
3. 明确接收方：自定义网关会收到稳定用户 id 与会话 id，必须把它当作身份接收方写进文档。遥测共享开关只控制导出，不关闭 provider 身份；两者接收方与目的不同。
4. 打包时嵌入配置与应用身份；打包应用忽略环境覆盖；测试与生产使用不同鉴权与策略源站；不得用开发者凭据或猜测 URL 填充。
5. 浏览器/剪贴板使用前校验精确 HTTPS 源站；请求完成不能证明外部页面已加载；只有复制失败才展示完整地址供手动复制；导航/复制结果独立于 updater 错误，策略目标改变后忽略迟到结果。
6. 登录 shell 环境读取要有定界符、超时与进程组终止；不等待 stdout 关闭（后台进程会永久持有）；账户 shell 无法运行 POSIX dump 时回退第一个系统 shell；`DSH_*` 必须来自启动方环境。
7. 诊断展示进程生命周期事实，而不是任意插件 stderr（可能含凭据）；本地化文案与语义字段分离，避免比较翻译文本。

**破坏点。** 把用户 id 放进通用 attribution helper 或请求 body；用固定配置头替代会话 id；用登录重定向完成当更新决定；把网关登录 URL 当作策略 URL；打包应用接受环境覆盖；等待 stdout 关闭。

**迁移。** 先确定身份/接收方与隐私边界，再加 header 与惰性解析；把测试鉴权隔离；最后在部署文档写明网关接收身份。

**计划验证。** 已授权请求携带同一 user id；无 session id 时省略 session header；凭据失败不创建文件；精确源站外拒绝打开；打包应用忽略环境覆盖；登录 shell 超时/中止/回退。证据状态：`planned`。


**限制。** 自定义网关会收到稳定用户 id 与会话 id；HTTP 根在无 TLS 时携带 token 化 URL 与 cookie；测试登录以持久登录/身份提供方导航换隔离；登录 shell 改动只在 Desktop 重启后生效；非 POSIX shell 回退系统 shell 环境。

### model-facing-tool-contract

**机制 ID：** `rationale-feature-1.model-facing-tool-contract`

**触发。** 设计或修改面向模型的工具 schema、工具名、参数、结果信封、spill 或工具花名册。

**义务。**

1. schema 最小且自足：只保留模型决策需要的字段；同一概念只有一个规范名，不提供两套别名；后端语义变化时同步 schema，而不是让模型猜。
2. schema 从能力与既有后端契约派生，不为了“以后可能用”预留字段；被推迟的参数写进 Deferred 段，而不是悄悄接受。
3. 结果形状固定：文本信封 + 结构化字段 + 溢出（spill）路径分离；超大输出不进入日志，模型通过引用读取；失败与空结果各有稳定形状。
4. 工具花名册按产品 profile 一致：随附 profile 不出现缺行/重复行；可选依赖（如 MCP）不是一行工具；空注册表不贡献 schema 或提示词 token。
5. 呈现按 Agent 选择，而不是按工具注册表全局改；工具自己的卡片/标题/路径派生自原始参数，host 的 present 值不进入客户端。
6. 跨包工具用纯类型入口共享事件，不把 Host 代码导入浏览器；一个包的 preset 安装不能与浏览器打包耦合。
7. 参数翻译（如外部生态名称）必须有双向映射与真实 schema 测试；映射参数改名/移除或新增未分类参数时测试失败。

**破坏点。** 同一路径同时叫 `path` 与 `file_path`；为未被任何消费者读取的封闭联合加 arm；把超大输出直接写日志；为可选依赖造一行假工具；客户端解析工具展示文本当索引。

**迁移。** 先冻结规范名与结果形状，再迁移生产者；删除别名与死分支；用 schema 测试与真实调用 fixture 钉住。

**计划验证。** 工具 schema 的最小性/一致性审阅；溢出结果仍可被模型取回；空 MCP 配置零 token；参数翻译测试在改名时失败；随附 profile 花名册一致。证据状态：`planned`。

**限制。** 该机制是跨多个产品 Note 的综合，单个 Note 只覆盖其中一部分；工具 schema 的“最小”没有绝对值，需按模型决策点审查。

### phase-specific-extension-authority

**机制 ID：** `rationale-feature-1.phase-specific-extension-authority`

**触发。** 设计工具执行管线、拦截钩子、请求/响应钩子或任何“观察 + 改写 + 拒绝”混合的扩展点。

**义务。**

1. 每个阶段只给一种权威：pre-execute 是 allow/deny/ask 门禁；post-execute 是结果观察/替换；system-prompt 组装是提示词贡献；不要在同一阶段同时允许观察与改写。
2. 观察者不获得变更权；需要变更时使用专门的、更早的决策点，并明确其与门禁的顺序（谁先、是否跑两次）。
3. 改写若不能原子影响所有读取方，就不提供该扩展点；失败关闭而不是“尽力应用”。
4. 阶段边界写进文档：哪些字段可读、哪些不可写、调用身份是否受保护、错误如何传播；hooks 的错误不能被吞成成功。
5. 需要跨阶段协调时，用共享的持久事实/类型，而不是让一个阶段的 listener 偷改另一个阶段的对象。
6. 对外部生态的 hook 适配遵守同一映射：上游 `updatedInput` 在本仓没有一致事务时拒绝，而不是局部改执行。

**破坏点。** 在 post-execute 里改参数；在 pre-execute 里改系统提示词；让 listener 返回 `null` 无限阻塞；把“观察 + 改写”塞进一个回调；在一个阶段里既审计又执行副作用。

**迁移。** 先列出每个阶段的输入/输出/权威与失败语义，再迁移混合钩子到专用阶段；删除可变逃逸口。

**计划验证。** 每个阶段的允许/拒绝/异常路径；观察者不能改执行；改写未实现时被拒绝；hook 错误不静默；顺序测试（改写先于门禁）在反转时失败。证据状态：`planned`。

**限制。** 该机制综合自拦截扩展点与改写提案；具体阶段名随实现变化，迁移时以本仓当前管线为准。

## 4. 跨机制审查清单

- 这个新能力属于哪个边界？它的 seam 词汇是否在不依赖可选后端的地方？缺失时是否仍能组合？
- 异步工作有没有可达终态？工具描述里的承诺是否无条件？通知与子级消息是否可区分？顺序是否在 release 之前？拆卸期是否会唤醒将死对象？
- 结局是从日志推导还是从活动采样？是否覆盖 pre-step 停止、拒绝、取消、上限？误读方向是否偏向不高估成功？
- 权限是否在委派时固定并持久化？模型是否无法通过参数提升权限？未知/交互式值是否配置期失败？诊断是否有界脱敏？
- 广告字段是否只影响展示？信任是否显式且逐请求校验？外部进程/guest 是否运行在完整权限且未声明？
- 状态变更是否跨 resume/fork/重启？缺省是否被当成同意？初始化标记是否独立于名称？
- 持久消息是否有 producer 声明的语义形态？不可读记录是否整体降级到 opaque？分类是否在日志而非客户端表？
- 日志宣告与内容寿命是否一致？是否为了“永远能渲染”而复制了会过期的内容？
- 工具是否修改了用户仓库？快照是否包含用户既有未提交工作？基线是否与首请求并行？
- 每个无界量是否有上限与可见降级？空槽位/不可读/超大是否有设计过的出路？
- 隐藏/归档/退出是否可能留下在跑工作？默认拒绝是否覆盖所有调用方？停止是否走用户停止路径？撤销是否只恢复外壳？
- 默认值是否让面向模型的承诺为真？是否优先可观察代价而非不可观察停滞？默认开启是否 fail-closed 到接受值？
- 同一事实是否有两个家？缓存/展示/元数据是否重复？是否还有死路径？
- 每个断言是否有负例？快照是否栅栏到运行实际产生的轮次？测试没有证明什么是否写明？
- 兼容层是否在稳定性触发后才建？未提供能力是否列出并失败关闭？状态是否用可忽略记录？
- 改写是否在身份创建前完成并原子反映三方？未实现前是否如实拒绝/警告？
- 折叠/弹层/动效/破坏性操作是否可键盘、可查找、尊重 reduced-motion、焦点不丢？
- 身份/来源边界是否只发必要字段、接收方明确、打包配置不可被环境覆盖？
- 面向模型的工具 schema 是否最小、单一命名、结果有界？花名册是否按 profile 一致、可选依赖不占行？
- 扩展点是否每个阶段只有一种权威？观察者能否改写、改写是否有身份前事务？

## 5. 反模式

- 把可选服务声明为注入，让没有该服务的组合加载失败。
- 用消费型读取器服务观察者，偷走模型字节。
- 在 `releaseOwnership` 之后投递结算通知。
- 给“是否通知”加部署开关，让工具描述重新变成“通常会通知”。
- 用 turn/end 是否存在判断 child 完成。
- 继承交互式审批策略，让后台 child 进入无人查看的 blocked 等待。
- 把 `--public-url` 当认证/路由；把公告主机并入 trustedHosts。
- 把缺失偏好/响应当同意，提前激活脚本。
- 在日志里存摘要，让卡片永远渲染 Host 已打不开的内容。
- 在用户仓库里打 tag/stash/write-tree，或与 `HEAD` 比较。
- 无界读取后才失败；静默丢弃不可读内容。
- 归档只改可见性，留下后台 child/job 继续消耗 token。
- 人工 kill 不告诉模型，制造过期世界模型。
- 为同一附件/路径建第二个缓存或第二个颜色权威。
- 只写正例、没有负例的“验证”；等待不会发生的轮次。
- 为未稳定上游硬建兼容层，或把“示例能跑”当完整兼容。
- 直接改执行参数，让审计/历史/展示不一致。
- 在 `turn/end` 前折叠流式正文；用 hover 承载诊断。
- 把用户 id 放进请求 body 或通用 attribution helper。

## 6. 历史、提案与被取代内容

- `2026-08-24-activity-observation-seam`（59）：独立 `ctx.activities` seam 已被 jobs 收敛取代；持久/实时分析、非消费 offset、可选性与结算顺序仍成立。
- `2026-08-26-human-job-kill`（61）：`reported` 选项已随 jobs 收敛消失；交付认领、原因合并、两击控件仍成立。
- `2026-08-10-subagent-approval-pinned-never`（54）：取代 2026-07-25 的审批一半，并推翻其“强制 never 会排除未来子级应答器”的结论；未来若要子级应答器必须先推翻本 Note。
- `2026-09-20-developer-tools-default-on`（75）：只取代 2026-09-17 的默认关闭选择；共享持久化与渲染策略仍归旧 Note。
- `2026-09-13-mcp-resources-in-profiles`（69）：部分取代 2026-09-12 的单独启用挂载；操作/作用域/规范结果/二进制渲染/指令设计仍归旧 Note。
- `2026-09-08-present-workspace-source-files`（81）：取代 2026-09-08 的快照交付设计；删除下载端点与回退副本是明确决定。
- `2026-06-30-pre-tool-input-rewrite`（84）、`2026-07-08-interactive-side-sessions`（85）、`2026-09-08-desktop-mandatory-update-api`（86）、`2026-10-03-pi-extensions-bridge`（87）、`2026-10-03-pi-plugins-compatibility`（88）均为 `proposed`。它们提供验收标准、风险与开放问题，不提供现行运行时保证；迁移不得把它们当成已实现机制。
- `2026-09-08-desktop-mandatory-update-api`（86）明确：本地 fixture 不能认证服务，API 地址与网关是部署输入，未提供的后端/发布输入不得用开发者凭据或猜测 URL 填充。

## 7. 覆盖与未解决

- 88 个 English Note 与 88 个 Chinese Note 均已完整读取（范围见 coverage JSON `inspected`）；每个文件都有实质处置，不以代表样本替代。
- `uninspectedCandidates` 为空：没有未读的分配 Note 或未检查的候选。6 个由源 Note 自己声明的实现限制/开放问题保留在 `unresolved`，逐项带 `sourceEvidence`、`targetCheck`、`blocksImplementation: true` 和 `blocking: false`；它们阻塞“已实现/已认证”的声明，不阻塞本轮正文提取。
- 88 个 `.i18n.yaml` 一致性 sidecar 已机械读取并核对结构（77 个整文件哈希记录、11 个逐标题记录，共 253 条）；它们是翻译一致性元数据，不作为治理机制来源。
- 跨域借用只以 `crossDomain` 中已实际读取的 `coverageArtifact` + `coveredPaths` + 具体关系记录；没有实际证据就不声明绑定。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `rationale-feature-1.seam-boundary-optionality`：`deepseek-harness/.agents/notes/archived/feature/2026-08-24-activity-observation-seam.md:16-36@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-07-feedback-acknowledgement-sharing-disclosure.md:12-24@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-13-mcp-resources-in-profiles.md:12-20@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-05-per-agent-tool-presentation.md:14-27@687f282e`
- `rationale-feature-1.unconditional-terminal-delivery`：`deepseek-harness/.agents/notes/archived/feature/2026-08-06-manager-owned-subagent-settlement-delivery.md:16-53@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-22-unbounded-completion-wakes-by-default.md:14-21@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-26-human-job-kill.md:14-22@687f282e`
- `rationale-feature-1.durable-terminal-truth`：`deepseek-harness/.agents/notes/archived/feature/2026-08-06-manager-owned-subagent-settlement-delivery.md:54-65@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-09-21-archive-stops-running-session-work.md:11-20@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-01-workflow-run-in-background.md:14-22@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-07-model-switch-notice.md:12-19@687f282e`
- `rationale-feature-1.fail-closed-delegation-authority`：`deepseek-harness/.agents/notes/archived/feature/2026-08-10-subagent-approval-pinned-never.md:12-28@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-08-15-product-subagent-noninteractive-permissions.md:13-63@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-07-19-model-facing-goal-tools.md:27-34@687f282e`
- `rationale-feature-1.advertisement-is-not-authority`：`deepseek-harness/.agents/notes/archived/feature/2026-09-07-public-web-deployments.md:12-35@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-09-20-desktop-browser-webview.md:35-42@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-11-desktop-mandatory-update-client.md:12-39@687f282e`
- `rationale-feature-1.durable-policy-provenance`：`deepseek-harness/.agents/notes/archived/feature/2026-09-20-developer-tools-default-on.md:12-19@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-28-desktop-login-shell-environment.md:12-15@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-20-default-workspace.md:12-23@687f282e`
- `rationale-feature-1.producer-declared-content-shape`：`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-context-form-vocabulary.md:15-49@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-20-tool-card-image-results.md:16-35@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-24-trajectory-image-attachments.md:12-19@687f282e`
- `rationale-feature-1.announcement-only-derived-lifetime`：`deepseek-harness/.agents/notes/archived/feature/2026-09-11-turn-changed-files-card.md:12-47@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-15-changed-file-diff-preview.md:12-39@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-09-08-present-workspace-source-files.md:11-34@687f282e`
- `rationale-feature-1.bounded-work-honest-degradation`：`deepseek-harness/.agents/notes/archived/feature/2026-09-15-changed-file-diff-preview.md:40-45@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-06-manager-owned-subagent-settlement-delivery.md:106-114@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-08-05-context-form-vocabulary.md:60-66@687f282e`
- `rationale-feature-1.explicit-stop-hidden-work`：`deepseek-harness/.agents/notes/implemented/feature/2026-09-21-archive-stops-running-session-work.md:11-36@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-26-human-job-kill.md:14-36@687f282e`
- `rationale-feature-1.defaults-observable-failure`：`deepseek-harness/.agents/notes/archived/feature/2026-09-22-unbounded-completion-wakes-by-default.md:14-31@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-14-web-turn-process-folding.md:12-27@687f282e`
- `rationale-feature-1.single-fact-single-owner`：`deepseek-harness/.agents/notes/archived/feature/2026-08-05-composer-context-meter-breakdown.md:12-21@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-06-resolved-theme-color-metadata.md:12-17@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-16-open-in-default-app-for-sidebar-files.md:12-17@687f282e`
- `rationale-feature-1.negative-controls-and-fences`：`deepseek-harness/.agents/notes/archived/feature/2026-08-20-tool-card-image-results.md:46-51@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-09-parallel-subagent-delegations.md:24-29@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-06-manager-owned-subagent-settlement-delivery.md:66-77@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-12-hero-fish-hover-swim-morph.md:26-28@687f282e`、`deepseek-harness/.agents/notes/implemented/feature/2026-09-20-desktop-browser-webview.md:53-58@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-11-desktop-mandatory-update-client.md:66-69@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-extensions-bridge.md:125-141@687f282e`
- `rationale-feature-1.compatibility-is-capability-demonstration`：`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-extensions-bridge.md:13-29@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-extensions-bridge.md:30-74@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-extensions-bridge.md:75-98@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-extensions-bridge.md:99-141@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-plugins-compatibility.md:18-52@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-10-03-pi-plugins-compatibility.md:94-139@687f282e`、`deepseek-harness/.agents/notes/proposed/feature/2026-06-30-pre-tool-input-rewrite.md:7-36@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-06-30-interception-extension-points.md:45-48@687f282e`
- `rationale-feature-1.consistency-before-identity`：`deepseek-harness/.agents/notes/proposed/feature/2026-06-30-pre-tool-input-rewrite.md:37-52@687f282e`
- `rationale-feature-1.accessible-disclosure-and-confirmation`：`deepseek-harness/.agents/notes/archived/feature/2026-08-14-web-turn-process-folding.md:12-43@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-28-web-turn-stat-pills.md:12-25@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-10-creator-guidance-introduce-cue.md:12-27@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-12-hero-fish-hover-swim-morph.md:12-17@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-16-windows-desktop-titlebar.md:12-23@687f282e`
- `rationale-feature-1.identity-and-origin-boundaries`：`deepseek-harness/.agents/notes/archived/feature/2026-08-11-deepseek-request-user-id-header.md:14-39@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-11-desktop-mandatory-update-client.md:12-65@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-28-desktop-login-shell-environment.md:12-25@687f282e`
- `rationale-feature-1.model-facing-tool-contract`：`deepseek-harness/.agents/notes/archived/feature/2026-06-17-filesystem-tool-schemas.md:26-96@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-31-even-out-shipped-tool-rosters.md:14-35@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-09-bash-backed-grep-glob-discovery.md:38-123@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-06-18-acp-terminal-and-tool-rendering.md:27-40@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-31-ptc-language-dispatch.md:14-32@687f282e`
- `rationale-feature-1.phase-specific-extension-authority`：`deepseek-harness/.agents/notes/archived/feature/2026-06-30-interception-extension-points.md:14-52@687f282e`
