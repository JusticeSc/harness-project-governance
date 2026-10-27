# 架构决策迁移参考：持久化、扩展点与发布边界（rationale-architecture-2）

本参考只提取 `deepseek-harness` 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中以架构 Note 形式记录的、**可迁移的工程治理机制**。它不复制该项目的业务代码，也不把项目规模、部署形态或工具链当作放松义务的理由。每条机制的完整机读记录见 `knowledge/rationale-architecture-2.json`，覆盖与阅读范围见 `research/rationale-architecture-2-coverage.json`。

阅读方式：先按“触发条件”定位机制，再执行“迁移步骤”，最后按“完成信号”和“证据边界”核对。所有验证项在本轮均为 `planned`（未执行），不得据本文声称任何目标仓库已通过验证。来源路径中的 `archived`/`implemented`/`proposed` 目录与 coverage 的逐文件 Lifecycle 记录决定历史/提案/现役；knowledge 记录不设 `authority` 字段，`sources[].kind` 表示文档角色而非生命周期。

---

## <a id="canonical-vocabulary"></a>1. 每个边界只有一个词汇权威（`rationale-architecture-2.canonical-vocabulary`）

**触发条件**
- 同一个概念同时存在多种“活着的”表示：作者侧类型、持久事件、模型投影、线上 schema、公开包接口。
- 某个插件特性（例如图片卸载）需要核心代码理解插件事件。
- 生成物（schema、目录、类型声明）出现第二个手工维护的来源。

**前置条件**：能指明该概念唯一的所有者包；能运行类型检查/契约检查。

**步骤**
1. 写出概念的权威类型，并在其所有者包内定义创建、解析与校验入口。
2. 列出它的所有表示，逐一改为从权威类型派生或由带检查的投影生成。
3. 对可扩展词汇建立“声明即清单”的机制：事件声明处标注所需的纯解释器；缺失定义时在 append、恢复和离线折叠处直接拒绝。
4. 公开包只暴露经过挑选的字段集合；内部元数据留在其所属工具，不因为“可发现”就变成公共契约。
5. 增加负向测试：已退役的表示必须被拒绝，而不是被兼容读取。

**角色**：核心词汇所有者、领域事件插件、代码生成器、评审者。

**执行者**：概念的所有者（核心包或事件/清单的拥有者）修改权威表示；消费方只读取派生表示。

**完成信号**：同一语义在任一表示上都能追溯到唯一来源；新增一种表示不需要再写第二份手写描述。

**失败处理**：拒绝并给出稳定错误码；历史形态只允许由显式冻结的迁移边处理，绝不在当前读取路径同时接受两种形态。

**证据边界**：来源笔记证明的是该仓库自身的封闭角色集合与清单完整性，不证明每个解释器语义正确；迁移到其他项目时必须自行判定哪些概念真正封闭、哪些仍需 provider 扩展。

**例外**：纯展示层别名可以存在，但不得进入持久化、模型可见输入或公共包接口。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-06-11-custom-schema-dsl.md:1-24@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-11-tool-schemas-in-prompt-assembly.md:1-24@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-first-class-tool-role-messages.md:1-28@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-plugin-owned-message-projections.md:1-35@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-public-package-manifest.md:1-35@687f282e`。

---

## <a id="structured-errors"></a>2. 结构化失败，而不是匹配文案（`rationale-architecture-2.structured-error-taxonomy`）

**触发条件**：跨包分支、重试策略、沙箱/权限拒绝、需要跨持久化或线路保留的失败身份。

**前置条件**：跨 seam 的失败需要被程序分支处理，而不仅是写入日志；存在一个所有依赖方都可依赖的叶子包。

**步骤**
1. 在领域契约旁定义错误基类与稳定 code 联合；保留原始 cause，不把外部错误压扁成字符串。
2. 在每个持久/线路边界投影 code，消费方只依据 code 分支；展示文案可自由变化。
3. 扩展服务报告失败时附带注册者包名，避免“服务级”错误掩盖贡献者。
4. 用正反两个测试固定：code 稳定、文案可变。

**执行者**：错误基类所在叶子包的所有者定义 `code`；抛出方保留 `code`，消费方按 `code` 分支。

**完成信号**：删除所有基于 `message.includes(...)` 的生产分支。

**失败处理**：未知 code 仍以内部错误浮出；缺失 code 视为缺陷，而不是回退到文本解析。

**例外**：第三方/未知错误保持原样并包装，不改写其类型；并非每种错误都需要新 `code`。

**证据边界**：来源没有提供仓库级的 code 注册总表，稳定性依赖各所有者把 code 当作 API。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-06-11-structured-error-taxonomy.md:1-27@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-19-package-owned-invariant-service.md:1-106@687f282e`。

---

## <a id="released-format-contract"></a>3. 已发布的持久格式是冻结契约（`rationale-architecture-2.released-format-contract`）

**触发条件**：格式已随任一版本发布（含 alpha）；新增事件种类或改变事件基数会改变序号；第三方生产者想写入当前读取方不认识的字段。

**前置条件**：存在版本字段；存在“发布后不得回滚”的发布原语；能保留原始代际直到后继成功发布。

**步骤**
1. 清点所有已发布版本的物理与逻辑形态。
2. 为每一对相邻版本增加一条**静态**迁移边；迁移目录在特性插件挂载前即可用，不依赖运行时插件注册。
3. 按“解码源 → 校验目标 → 验证（可在 Worker）→ 再核对源身份 → 无覆盖发布”的顺序执行。
4. 未知事件默认拒绝；只有生产者显式标记 `ignorable: true` 的外部事件可原样保留。
5. 若事件基数变化，重写所有显式声明的关系引用，并保留精确的 fork 切点；遇到未声明关系直接拒绝。
6. 禁止猜测缺失的 provider/model、父引用或序号；无法证明就拒绝。

**执行者**：格式包所有者冻结清单与迁移边；持久化后端所有者执行发布；评审者检查未知事件策略。

**完成信号**：旧版本可打开且逻辑事件一致；未知非 ignorable 事件使打开失败而源文件不变；发布一旦开始便运行到结束，取消不再回滚。

**失败处理**：拒绝时保留源代际并给出诊断；源在准备与发布之间漂移则取消替换，而不是在变化后的字节上重跑。

**例外**：已发布的 alpha 清单可能只接受已知事件；只读消费可以完全不发布（见机制 4）。

**证据边界**：迁移目录是 DeepSeek Harness Session 版本专用的；其他项目必须自行建立版本清单，不能照搬版本号。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-30-retain-ignorable-external-session-events.md:1-45@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-alpha-historical-unknown-event-refusal.md:1-37@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-01-v2-embedded-assistant-streams.md:1-80@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:1-251@687f282e`。

---

## <a id="staged-migration"></a>4. 有界分段迁移：读准备与写发布分离（`rationale-architecture-2.staged-migration`）

**触发条件**：整文件转换可能超过内存或事件循环预算；分页、follow、导出、恢复只需要逻辑结果而不需要写权限；多个调用者并发打开同一历史文件。

**前置条件**：存在可重复读取的稳定源 revision、可排他创建的临时文件和无覆盖发布原语。

**步骤**
1. 用流式解码器按帧/块读取源，校验结构。
2. 每条迁移边实现为有状态阶段；只保留源与当前产物，不持久化中间版本。
3. 在固定节奏（例如约 500 ms）让出事件循环并检查调用者取消。
4. 编码后继到临时代际，Worker 校验，再核对源身份，最后无覆盖发布。
5. 只读打开直接返回已准备的内存事件，不发布；写打开加入同一准备，等待发布完成后才返回可追加句柄。
6. 并发调用共享一次准备；单个等待者取消只移除自己，最后一个等待者释放共享工作。

**执行者**：持久化后端所有者实现 prepare/publish；读路径所有者选择 prepared 结果；Agent 提升方等待发布完成。

**完成信号**：只读调用在编码/校验前拿到内容；并发读者只付出一次主解码成本；发布开始后运行到结束。

**失败处理**：校验失败拒绝发布并保留源；发布开始的取消不再生效；发布后不回滚。

**例外**：跟随重定向的进度 UI 在来源中只是 proposed，不得描述为已实现。

**证据边界**：来源中的 116 MB 案例与耗时是特定机器/语料观察，不是通用保证。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:104-251@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-read-only-session-migration-preparation.md:1-170@687f282e`；`deepseek-harness/.agents/notes/proposed/architecture/2026-09-29-session-migration-follow-redirect.md:1-43@687f282e`。

---

## <a id="append-only-persistence"></a>5. 只追加持久化、有界修复与物理打包（`rationale-architecture-2.append-only-persistence`）

**触发条件**：高频小记录写入日志；崩溃可能留下撕裂尾部；需要只读头部列举或后缀读取。

**前置条件**：写入必须按会话串行，且后端能提供崩溃后识别撕裂尾部的 token（或等价的 `inspect` 契约）。

**步骤**
1. 头部独立成帧/单元；之后每个持久批次一个单元。压缩时每帧独立校验。
2. 追加前 fsync；写/同步失败则截断回先前长度并抛错，由协调器重试同一批次。
3. 打开时校验所有完整单元；把“最后一个单元内 EOF”视为撕裂尾部，从该单元起始字节截断。
4. 仅在修复后追加合成的 tool/step/turn closer，作为一个新的持久批次。
5. 若采用物理打包（多个逻辑事件一行），必须：标签显式、边界与批次一致、单行有数量与字节上限、解码无损、序号连续；行内元数据不得被解释为逻辑事件类型。
6. 修复标记绑定该行起始序号；持有写锁时重新校验，删除该物理行及其后行，避免过期修复删掉新写入者的有效后缀。
7. 读取后缀时只检查可能覆盖 `fromSeq` 的最大行跨度，并让重叠的标量行参与连续性校验。

**执行者**：`PersistenceCoordinator` 拥有会话条目与刷写顺序；后端实现钩子并保持 torn marker 不透明。

**完成信号**：正常路径从不重写已提交字节；元数据列举只读头部；撕裂尾部修复不复活未确认记录。

**失败处理**：内部校验失败/序号空洞视为损坏并拒绝；只有最终单元可被修复。

**例外**：显式崩溃修复允许删除损坏的最终物理行及更晚行，然后追加 closer。

**证据边界**：SQLite 与 JSONL 是两套后端实现；压缩率与延迟数字是特定语料/机器观察。迁移项目应在自己的后端上重新证明这些不变量。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-shared-persistence-write-coordinator.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-19-zstandard-jsonl-session-logs.md:1-58@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-18-sqlite-physical-chunk-row-compression.md:1-82@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-15-packed-session-history-transport.md:1-62@687f282e`。

---

## <a id="cache-isolation"></a>6. 派生缓存可选、失败软化、按记录隔离（`rationale-architecture-2.cache-isolation`）

**触发条件**：读模型重建昂贵但可从权威日志推导；元数据列举不能打开每个日志；多个会话/进程共享存储根。

**前置条件**：缓存是可重建的派生数据，删除后不影响正确性；存在按记录定位的存储域。

**步骤**
1. 缓存记录与其版本定义在领域 schema 旁；权威日志仍是唯一事实来源。
2. 每条记录独立存储（例如 `<root>/<domain>/<id>.json`），写入串行化，内存只在持久化后更新。
3. 读取从内存同步返回；冷启动需要确定性时由消费者自行从日志重折。
4. 打开时逐记录校验；非法或版本不支持视为“缺失”，不使整个域失败。
5. 版本升级时按记录丢弃并重写，不整体拒绝。
6. 不要把介质/路径策略塞进缓存；路径与写链属于存储层。

**执行者**：投影/缓存所有者定义记录键与版本；存储域所有者提供读写；启动路径只做同步内存查找。

**完成信号**：单条坏记录只影响该会话；缓存缺失不阻塞列举。

**失败处理**：跳过坏记录并记诊断；缓存永不使请求失败。

**例外**：只有在“没有新布局文档且版本被显式接受”时才从旧的整文件缓存引导。

**证据边界**：缓存命中率与零 I/O 仅在来源测量过的规模上成立；跨版本读取兼容需单独验证。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-08-19-projection-cache-per-session-files.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-shared-persistence-write-coordinator.md:1-53@687f282e`。

---

## <a id="reconstructable-requests"></a>7. 模型可见 ⟺ 持久可引用（`rationale-architecture-2.reconstructable-requests`）

**触发条件**：请求读取未记录状态；钩子/监听器可逐调用改写请求；恢复、fork 或压缩必须复现早先请求。

**前置条件**：存在仅追加的会话日志，且能从每个节点纯函数地重建模型输入。

**步骤**
1. 枚举请求构造的每个输入。
2. 对每个输入：要么记录为事件/头部快照，要么由已记录数据经公开纯函数推导。
3. 在会话实例、真实变更与序列边界记录**完整**请求头快照；不要发明增量编解码器。
4. 构造后的请求冻结；修改即抛出。替换只能通过已记录的通道并带原因。
5. provider 与 model 同时进入请求头和 assistant 消息；迁移不得猜测缺失路由。
6. replay 状态进入终止 chunk 与组装后的 assistant 消息，逐块对齐。
7. 消息身份在创建时铸造并在所有表示间保持；创建用 `create*`，导入/转换用 `freezeMessage`。

**执行者**：请求组装器拥有 `EpochHeader` 与开放步骤边界；持久化层只存引用；适配器不得隐藏额外状态。

**完成信号**：日志 + 被引用附件 + 固定代码版本可逐字节重建每个请求；从日志无法解释的请求无法被构造。

**失败处理**：缺失附件或不可解释的头导致请求显式失败，不得静默丢弃内容。

**例外**：不进入模型可见输入的本地状态无需持久化；诊断/遥测数据不在此契约内。

**证据边界**：逐字节重建假定固定代码版本与不变的 provider 序列化；压缩、真实 prompt/tool 变更仍会击穿 provider 前缀缓存，这是被接受的成本。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md:1-57@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-28-identified-immutable-message-values.md:1-50@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-14-provider-routed-llm-adapters.md:1-93@687f282e`。

---

## <a id="capability-seam"></a>8. 能力缝：一个接口、可替换 provider、显式执行世界（`rationale-architecture-2.capability-seam`）

**触发条件**：同一原语有两个消费者/执行世界（本地、沙箱、远程、PTY）；平台实现会泄漏到消费者；模型工具开始拥有进程/存储机制。

**前置条件**：至少两个真实消费方需要同一能力，且替换实现有实际动机；接口可由叶子包持有。

**步骤**
1. 仅在出现第二个真实消费者或执行世界时拆缝，避免预防性拆分。
2. 在 service-definition 包定义最小接口与失败词汇；实现放 provider 包；消费者保留。
3. 消费者拥有策略与展示；provider 拥有原语机制与资源清理。
4. provider 只返回存储/进程事实（before/after 文本、退出事实），由消费者计算 UI。
5. 不添加没有生产消费者的推测 API。
6. 平台差异写成文档化行为（mode bits 对 DACL、信号可用性、就绪等级），不做隐藏 shim。

**执行者**：能力包所有者定义接口与生命周期；provider 实现平台细节；组合方显式挂载。

**完成信号**：同一消费者通过 local/remote provider 工作，领域代码中没有 local/remote 分支；provider 机制只测试一次。

**失败处理**：缺少 provider 时消费者按注入语义保持 pending；不可用平台操作显式失败。

**例外**：有些启动因所有权留在缝外（MCP transport、测试启动器）；PTY 分配放在 provider 之后。

**证据边界**：缝的收益需由第二个实现或真实替换证明；只有一个实现的抽象只是预测。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-07-03-filesystem-directory-listing-seam.md:1-54@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-26-subprocess-seam.md:1-45@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-05-windows-fs-permissions.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-19-shared-win32-process-primitives.md:1-36@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-posix-ssh-runtime.md:1-65@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-20-extract-example-app-packages.md:1-58@687f282e`。

---

## <a id="scoped-lifetime"></a>9. effect 拥有的注册生命周期与原子作用域层（`rationale-architecture-2.scoped-lifetime`）

**触发条件**：注册只应在某个 agent/session/scope 内可见并随所有者消失；贡献可能早于声明到达；抛错观察者不得留下半应用注册。

**前置条件**：存在 Cordis 式父子上下文与 disposer；注册需要按 agent 隔离。

**步骤**
1. 每个服务定义一个聚合层类型；全局层急切创建，作用域层首次 effect 时创建。
2. 可见性与所有权来自同一个 context；不接受分离输入。
3. 原子插入、返回精确 undo；先收集 undo 再通知观察者，观察者抛错则回滚。
4. 返回框架原始 disposer，不包装。
5. 只有整个聚合层为空才回收。
6. 声明注入记录独立的 declaration epoch：折叠后重新声明即使最终状态连续，也要重启注入。
7. 交互/模态请求通过单一 FIFO 焦点所有者串行化，排队工作绑定调用者 fiber。
8. 用类型、运行时不变式、生成目录/解析表与行为测试分别覆盖常规路径、逃逸点和跨服务事实；不要要求单层证明它观察不到的事实，也不把同进程插件当作恶意边界。

**执行者**：作用域库所有者维护键与层；领域注册表保留校验；插件通过 `ctx` 注册，不手工保存全局表。

**完成信号**：插件卸载移除其全部条目；延迟声明失败会退订并回滚已收集 effects。

**失败处理**：setup 失败按逆序销毁已产生的 effects 并释放名称保留。

**例外**：进程级单例（如 home 解析器）不需要作用域；强制每会话实例化会制造重复状态。

**证据边界**：具体 API 依赖 Cordis 的 fiber/effect 语义；其他框架需要等价保证。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-07-12-scoped-layers-store.md:1-127@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-12-agent-scope-runtime-design.md:1-403@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-05-slot-declaration-injection.md:1-46@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-22-tui-interactive-extension-service.md:1-42@687f282e`。

---

## <a id="extension-ownership"></a>10. 每个扩展点只有一个呈现/解释所有者（`rationale-architecture-2.extension-point-ownership`）

**触发条件**：两个 Definition 匹配同一事件并各建节点；会话层需要知道业务工具名；插件想增加呈现但不拥有数据生命周期。

**前置条件**：同一呈现/解释点存在多个贡献者，且顺序或所有权会产生歧义。

**步骤**
1. 明确“放置”与“原子内容”的所有者。
2. 在 dispatch 中加入 claim：同一 target 上被 claim 的事件不再传给其他 Definition，冲突直接抛错且与注册顺序无关。
3. 根/子调用组合、fallback 与原子渲染分发归一个呈现包；业务插件只注册原子渲染器。
4. 业务分组规则留在注册 Definition；通用装配只提供输入、校验与发布。
5. 命令/引用 chip 作为带数据节点并显式投影；机器已知的 claim 状态不要从文本形状推导。

**执行者**：扩展点所有者定义注册 API 与结算规则；贡献方只声明自己的条目；消费方通过唯一查找读取。

**完成信号**：被 claim 事件在目标上只有一个 Context/节点；移除呈现插件后 fallback 与持久数据仍可读。

**失败处理**：两个 claim 或 target-less claim 在 dispatch 抛错并指出事件、seq 与 Definition 类型。

**例外**：其他 target 的 Definition 与无 target 的 Definition 仍收到事件；通用 Definition 可完全不知道 claim 机制。

**证据边界**：所有权由装载期注册事实证明，不由组件内部自探 props 证明。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-10-12-exclusive-conversation-matches.md:1-52@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-08-client-tool-presentation-ownership.md:1-77@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-conversation-build-groups.md:1-174@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-22-slot-type-chain-implementation.md:1-123@687f282e`。

---

## <a id="composition-truth"></a>11. 组合是“实际运行什么”的唯一陈述（`rationale-architecture-2.composition-truth`）

**触发条件**：特性只能通过示例 overlay 或启动参数到达；按会话作用域挂载的行在主机面板清单中不可见；两个启动器维护不同参数解析或引导路径。

**前置条件**：组合可由 profile/manifest 声明，且存在多条装配路径（CLI/Web/Desktop/SDK）。

**步骤**
1. 列出所有可引入行/标志的位置，选定唯一拥有组合。
2. 删除重复 overlay；让消费者改用随产品发布的 profile。
3. 应用拥有自己的命令行：启动器只解析自己的参数，其余原样传递（`provideCmdline`/`parseCmdline`）。
4. 作用域行按“每进程一次 standing mount”挂载，agent 显式绑定 scope。
5. 清单同时报告全局与预设平面；评估声明门但不激活任何行。
6. 共享契约的界面复用同一引导/服务路径（例如 Desktop 通过 Web Host）。

**执行者**：组合包所有者声明行与默认值；Loader 负责激活顺序；应用只解析自己的 flag。

**完成信号**：默认 profile 无需 flag/overlay 即暴露特性；清单列出会话实际运行的预设行。

**失败处理**：消费者行缺少 provider 时在 settlement 失败并指出 pending 服务；不靠插入两次来“修复”。

**例外**：可选 bundle 仍是显式 opt-in；用户可在自己的 patch 层禁用随产品行。

**证据边界**：来源假设特定 Loader/组合模型；默认开启的特性会给不使用它的用户带来 token/运行成本。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-08-09-headless-direct-core-entry-point.md:1-45@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-06-app-owned-command-line.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-29-plugin-inventory-agent-preset-scopes.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-24-web-default-schedule-composition.md:1-40@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-desktop-web-wrapper.md:1-51@687f282e`。

---

## <a id="config-credential-provenance"></a>12. 配置与凭据的来源、顺序与原子替换（`rationale-architecture-2.config-credential-provenance`）

**触发条件**：一个值可来自 CLI、用户设置、组合、shell、项目文件或默认值；存储密钥需要可写、可轮换、可撤销；多条凭据路由共用同一协议实现。

**前置条件**：能在 Cordis 启动前冻结启动环境快照；设置服务有 revision 校验。

**步骤**
1. 分别写出非机密值与凭据的顺序，并写测试区分二者：
   - 非机密：显式本次运行 > 用户设置 > 组合 > 启动 shell > 发现文件（cwd `.env`，再 `$HOME/.env`）> 默认。
   - 凭据：继承的进程环境（只读，最高）> 凭据存储 > cwd `.env` > home `.env`。
2. 启动前拒绝发现文件中会改变 harness 自身的变量：`PATH`、`SHELL`、`NODE_OPTIONS`、`LD_PRELOAD`、`EDITOR`、`PAGER`、`BROWSER`、`BASH_ENV`、`PYTHONSTARTUP`、代理/CA 变量，以及整个 `DSH_*` 命名空间；大小写不敏感。
3. 绝不把凭据文档提升进 `process.env`。
4. 一次请求只来自一个配置代际；被拒绝的代际不得贡献任何字段。
5. 每个适配器恰有一个凭据解析器与头部模式；不得回退到另一路由的凭据。
6. 路由替换是注册表操作：先完整校验候选集合，再同步换入；拒绝时旧路由继续服务，调用方缓存只在注册表持有新集合后才前进。
7. 每个线路面做结构化脱敏并枚举被剥离的槽位。

**执行者**：配置 seam 所有者定义顺序；凭据提供方独占凭据文档；消费方按代读取快照。

**完成信号**：项目 `.env` 无法改写端点或关闭审批；存储密钥在重启后仍可写；被拒替换可修复后重放。

**失败处理**：禁止变量使启动失败；缺失被引用凭据以 `MISSING_CREDENTIAL` 失败，而不是环境自动发现。

**例外**：一次性调试覆盖可高于 settings，但必须在该次运行内显式；继承环境对凭据始终优先。

**证据边界**：来源明确记录存储凭据对同用户模型工具**没有**边界；OS keychain 是已记录但未实现的更强设计。层仍被物化进 `process.env`，普通项目变量会到达子进程。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-04-configuration-source-ownership.md:1-75@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-30-credential-boundaries-and-atomic-registration.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-30-web-config-plane.md:1-40@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-24-single-harness-home-resolver.md:1-40@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-deepseek-account-login.md:1-71@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-account-provider-signout.md:1-27@687f282e`。

---

## <a id="egress-identity"></a>13. 出站身份、源固定与拒绝重定向（`rationale-architecture-2.egress-identity`）

**触发条件**：适配器发送凭据或用户数据；一个 Host 被多个调用者共享；部署使用代理、网关、自定义 base URL 或 SSH 转发。

**前置条件**：存在统一的出站客户端，且代理/身份策略必须在任何请求前生效。

**步骤**
1. 集中出站请求创建与代理解析；所有子系统遵循同一代理策略。
2. 启动时与每次请求校验配置源；拒绝离开该源的 redirect。
3. 每个 provider 请求发送静态、非机密的 `User-Agent`；不要把他方专有头当作通用标准。
4. 客户端身份按调用携带（版本、语言、UTC 偏移），Host 不记住“最后一个调用者”。
5. 部署认证头与账户授权头分离，并保留保留名称。
6. 密钥不得进入 URL、问卷、日志或模型可见文本。

**执行者**：出站库所有者解析一次启动快照并安装 dispatcher；各工具不得自行解析环境。

**完成信号**：mock server 断言手写适配器与库适配器发出同一 `User-Agent`；发往非配置源的请求不带凭据。

**失败处理**：越界 redirect 被拒绝；缺少归属身份时回退到产品默认，而不是抑制。

**例外**：明确不影响用户代价的直连通道（如遥测）可豁免，但必须有负向测试证明其确实直连。

**证据边界**：修改过的客户端仍可请求任意模型 id；服务端版本下限只能在服务端执行。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-27-outbound-proxy-policy.md:1-97@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-21-mandatory-app-attribution-headers.md:1-83@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-deepseek-account-login.md:1-71@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-deepseek-account-remote-model-catalog.md:1-36@687f282e`。

---

## <a id="bounded-envelope"></a>14. 用字节而非记录数约束外部载荷（`rationale-architecture-2.bounded-envelope`）

**触发条件**：载荷被序列化进请求体、OTLP 记录或历史页；端点不可用时积压增长；单条记录可能异常大。

**前置条件**：载荷跨越进程/线路/持久化边界，且有可度量的字节上限需求。

**步骤**
1. 明确被测量的精确序列化形态与字节上限（含头部与数值信封）。
2. 从 watermark 起选择能放入上限的最长连续段；仅按提供方接受推进 watermark（`throughSeq`）。
3. 首条待发记录自身超限：省略该字段、记警告、watermark 不前进，后续请求重试。
4. 合并体序列化失败视为扩展失败：发送基础体、跳过联合接受事务、记录被省略字段名，稍后重发。
5. OTLP 逐记录用完整信封测量并贪心打包；超大单条只产生一次诊断，不阻塞后续事件。
6. 保持逐记录测量线性，不为发现溢出而先序列化整个候选集合。

**执行者**：边界所有者按 UTF-8 字节计算并维护水位；生产方只在被接受的请求上补传。

**完成信号**：积压按每次 ≤ 上限排空；单条超大事件不会让所有请求失败。

**失败处理**：provider 拒绝仍使模型请求失败；准备/接受失败记录并重试。

**例外**：本地内存中的同进程值不按字节设限；上限只约束离开所有权边界的载荷。

**证据边界**：来源中的吞吐（约 8 MiB/s、约 100 请求排空 0.86 GB）是特定机器/语料观察，不是协议保证。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-bounded-session-log-upload.md:1-30@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-25-session-log-otel-byte-limits.md:1-29@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-session-log-upload-default.md:1-30@687f282e`。

---

## <a id="naming-ledger"></a>15. 角色准确的命名契约与机械重命名台账（`rationale-architecture-2.naming-ledger`）

**触发条件**：类/包/键/provider 名称不再描述其职责；能力获得第二实现或不同执行环境；产品标识变化导致包移动但行为不变。

**前置条件**：存在已发布名称、旧路径/别名和跨包引用，重命名必须一次完成。

**步骤**
1. 使用角色词表：`Registry` 拥有命名注册与查找、重复/优先级、生命周期；`Runtime` 拥有实时派发/取消/生命周期；`Store` 拥有一个数据集；`Directory` 暴露可发现条目；`Presenter` 是纯转换；`Controller` 协调一个有界状态转换；`Resolver` 计算一个答案；`Binder` 把声明绑定到调用者生命周期；`Engine` 实现领域算法；`Policy` 只决策；`Executor` 执行一个显式规格；`Gateway` 翻译边界；`Provider` 提供一个能力实现；`Backend` 实现可替换底层；`Handle` 控制/观察一个活资源；`Config` 拥有一个有界配置；其余才用 `Service`。
2. 一个家族在目录、包名、import、插件 id、context key、类型、事件、工具、配置、测试、文档中使用同一词汇。
3. 预发布期一次切换，不留别名、双 key、fallback parser 或兼容包。
4. 记录明确的“不重命名”及其理由。
5. 重命名只改名字；边界缺陷必须另立提案。
6. 机械审计旧 token，保留外部 URL、历史 Note 标识与产品可见命令的原拼写。

**执行者**：命名契约所有者维护保留清单；每个重命名家族的所有者更新其调用方；评审者检查旧名残留。

**完成信号**：台账每条映射在仓库中都能解析到当前名称；旧名称无法解析；行为、边界、默认值与数据模型不变。

**失败处理**：旧配置的拥有解析器清晰失败，而不是同时接受两种形式。

**例外**：确有产品含义的稳定名称（命令、协议字段）保留，不因内部重构而改。

**证据边界**：391 行台账是本仓库专用映射，不可照抄；角色词表可移植。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-08-11-repository-naming-contract-and-rename-ledger.md:1-391@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-12-ptc-runtime-vocabulary.md:1-30@687f282e`。

---

## <a id="plugin-identity"></a>16. 所有权移动中的插件身份与最小公开契约（`rationale-architecture-2.plugin-identity`）

**触发条件**：包移动到实验/可选层；配置页面在界面间移动；外部作者需要文档化 manifest 子集。

**前置条件**：包/插件身份被持久化配置、选择状态或认证引用；迁移不能破坏已装用户。

**步骤**
1. 将目录/支持分类与已发布身份分开。
2. 在一个带类型的目录→名称映射中记录命名例外；manifest、消费者与检查都与之对齐。
3. 保持已发布包名与既有配置行 id；新能力用新 id，已有 id 不被重新解释。
4. 只公开选定 manifest 字段；packer/迁移目录等内部元数据不进入公共类型。
5. 每个消费者拥有解析/校验/默认值；共享类型不等于共享解析器。
6. 延迟的重命名需要显式发布/迁移决定与已安装 profile 证据。

**执行者**：发布单元所有者保留身份与兼容行；实验目录只改变分类，不改身份；测试覆盖直接导入/别名/传递依赖。

**完成信号**：移动到实验目录后旧 profile 行仍解析；公共类型中不存在内部字段。

**失败处理**：缺失、移动或重复的命名例外被拒绝；公共类型中的内部字段使类型检查失败。

**例外**：实验分类可以改变包的发布或支持级别，但不得改变已发布身份；同一身份可同时出现在兼容行与新位置。

**证据边界**：身份兼容只能由旧 profile/旧产物测试证明；包名相同不证明运行时仍是同一提供方。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-10-06-web-desktop-plugin-identity-compatibility.md:1-40@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-public-package-manifest.md:1-35@687f282e`。

---

## <a id="platform-packaging"></a>17. 独立发布单元与已鉴定的平台载体（`rationale-architecture-2.platform-packaging`）

**触发条件**：依赖需要原生编译或按平台二进制；大引擎/资源的鉴定周期不同；安装器可能在暂存与激活之间失败。

**前置条件**：存在按平台的原生依赖、大资源或安装器，且干净安装不能依赖编译器/网络。

**步骤**
1. 把可复用引擎/kit 与应用集成分离；各自独立版本与发布。
2. 分发预编译原语与平台包（稳定 ABI），普通安装不编译。
3. 按 manifest 为每个平台选择恰一个引擎/载荷；声明了原生包就必须存在，缺失即安装不完整，不回退到另一实现。
4. 发布身份、签名与已安装产物鉴定属于打包期，不属于启动期。
5. 先暂存并校验，再原子替换；旧目录保留到提升成功。
6. 构建环境值通过单一公开命名空间（如 `DSH_CLIENT_*`）注入，并记录完整构建的公开环境与产物摘要。
7. 每个平台用已安装产物做鉴定；单元测试或另一可执行文件不能替代。

**执行者**：打包维护者选择每平台恰一个载荷并记录摘要；CI 在声明目标上做安装后鉴定；应用启动不承担打包职责。

**完成信号**：干净安装在每个声明目标上运行声明的引擎且无需编译器/下载；缺失原生包使安装失败。

**失败处理**：提升失败恢复旧目录；损坏归档保留旧应用；`--help` 等控制流不触发应用参数解析。

**例外**：无原生目标声明的平台保留 WASM/回退载荷；开发载体可与生产载体不同，但生产必须走已鉴定产物。

**证据边界**：来源明确不声称两次 rename 具备崩溃原子性；Windows/macOS/Electron/NSIS/pkg 细节需按工具链重推。

来源：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-07-prebuilt-system-primitives.md:1-33@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-independent-libreoffice-kit.md:1-29@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-15-platform-office-engines.md:1-32@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-10-single-file-executable-sdk-runtime-distribution.md:1-95@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-23-python-sdk-windows-x64-runtime.md:1-52@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-11-windows-directory-installation.md:1-30@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-in-place-profile.md:1-30@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-09-11-desktop-electron-node-runtime.md:1-28@687f282e`。

---

## <a id="trusted-input-boundaries"></a>18. 只在真实信任边界物化（`rationale-architecture-2.trusted-input-boundaries`）

**触发条件**：数据从调用者进入持久化、模型请求、队列、Worker、进程或线路；模型工具读取不可信文件或渲染不可信 HTML/SVG；凭据/授权回调经过浏览器或 preload 桥。

**前置条件**：能指出所有权或信任真正变更的位置（解析器、队列、模型、持久化、Worker、进程、线路）。

**步骤**
1. 画出边界表：同进程类型化调用（借用只读值）／解析配置与外部文件（校验）／队列消息（异步消费前物化）／模型与工具 JSON（边界物化）／持久事件（提交前物化并校验）／Worker、进程、线路（序列化、校验并拥有解码值）。
2. 持久 append 顺序：物化 → 校验 → 恰好一次 push（提交点）→ 逐个包含观察者失败的通知 → 释放 append 状态。
3. 观察者错误不得让已提交事件看起来未提交；一个监听器不得饿死其他监听器。
4. 不可信 HTML 放 sandbox iframe（`allow-scripts`，无 same-origin/popup/form/download/navigation）；SVG 用静态 `<img>` 上下文，不注入应用 DOM。
5. 浏览器登录以本地取消为准；回调到达不等于成功，必须等凭据持久化；PKCE 密钥不跨 UI 传输；只允许 loopback 源。
6. 钩子专用 `stdin`/`env` 不暴露给模型工具；合并顺序为 `scrub(process.env, 含 DSH_*)` → 展示用 `ENV_OVERRIDES` → 普通 `env` → 受管 `dshEnv`。

**执行者**：边界所有者负责物化/校验/清洗；同进程类型化调用方遵守 readonly 约定，不重复防御。

**完成信号**：append 后事件不可变；已构造请求不可变；不可信 HTML 不能触达应用源；显式钩子 env 不能覆盖受管变量。

**失败处理**：非法持久数据拒绝提交；登录换取失败不持久化凭据；未授权路径读取返回稳定错误。

**例外**：可信 setup 与同进程插件不做恶意回调防御；安全边界不在类型系统内。

**证据边界**：来源明确不声称同用户文件系统隔离；存储凭据对模型工具无边界，OS keychain 更强但未实现。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-07-12-agent-scope-runtime-design.md:124-263@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-06-30-bash-stdin-env-trusted-plugin-api.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-02-result-time-applied-hunk-diffs.md:1-58@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-08-document-preview-operations.md:1-45@687f282e`。

---

## <a id="evidence-limits"></a>19. 区分测量、未执行验证与产品限制（`rationale-architecture-2.evidence-limits`）

**触发条件**：Note 报告性能、平台支持或安全属性；功能只能在当前环境做单元测试；决定带有已知延后项。

**前置条件**：能区分“已测量”“已执行验证”“未执行”和“产品限制”，并指向具体命令或产物。

**步骤**
1. 标注结论的证据等级：源码事实、已执行测试、观察性测量、计划验证、产品限制。
2. 测量记录语料、机器与方法；不把数字写成阈值或协议保证。
3. 必需但未执行的验证单列为义务；单元 fixture 不替代已安装产物证据。
4. 延后工作记录重新激活的前置条件与所有者。
5. 没有测量就不声称启动、体积或延迟改进。

**执行者**：作者标注证据状态；独立验证者复跑；发布评审拒绝把计划当作通过。

**完成信号**：读者能区分“已证明”“已观察”“待验证”“不支持”。

**失败处理**：无证据边界的 Note 在评审中被拒绝；未证明指标被删除或标注。

**例外**：来源本身未提供的数据保持未知；不得用推断补齐。

**证据边界**：URL、Note 与测量数字只在其原始提交和环境下有效；产品限制不是通用默认值。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-08-15-packed-session-history-transport.md:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-08-18-sqlite-physical-chunk-row-compression.md:1-82@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-08-desktop-bundled-runtime-and-external-plugins.md:1-63@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-posix-ssh-runtime.md:1-65@687f282e`。

---

## <a id="decision-discipline"></a>20. 提案、拒绝与取代纪律（`rationale-architecture-2.decision-discipline`）

**触发条件**：设计尚未可实施或被有意延后；提案被拒绝或收窄；新决定替换旧决定的一部分。

**前置条件**：存在提案/已实现/已拒绝/被取代等状态，且旧决策仍需可追溯。

**步骤**
1. 先定状态：`implemented`、`proposed`、`rejected`、`superseded`，写入头部。
2. 提案必须列出验收标准、风险、未决问题与前置条件；不得读起来像已实现。
3. 拒绝记录原因、影响面、替代方案，以及何种证据会使它重新开启。
4. 部分取代必须写明旧 Note 仍然有效的职责。
5. 关联各剩余领域的拥有者，不复制其内容。

**执行者**：决策所有者标注状态与取代关系；后续实现者引用而非改写历史；评审者检查未决问题是否被当作义务。

**完成信号**：读者仅凭头部与取代句即可判断哪些决定当前有效。

**失败处理**：无状态或无取代范围的 Note 在评审中被拒绝；提案的未完成前置条件保持可见。

**例外**：历史决定保留原拼写，不被改写。

**证据边界**：提案的验收标准不是已满足的保证；被拒绝方案的理由必须保留，不能只留结论。

来源：`deepseek-harness/.agents/notes/proposed/architecture/2026-07-29-durable-last-activity-index.md:1-64@687f282e`；`deepseek-harness/.agents/notes/proposed/architecture/2026-09-29-session-migration-follow-redirect.md:1-43@687f282e`；`deepseek-harness/.agents/notes/rejected/architecture/2026-06-16-typed-event-schemas.md:1-75@687f282e`。

---

## <a id="publication-transaction"></a>21. 一个事务负责发布，一个 start promise 负责所有权转移（`rationale-architecture-2.publication-transaction`）

**触发条件**：创建/恢复跨多个注册表、持久化加载与插件 setup；所有权跨 provider 或进程边界；start 可能在已准备资源后失败；取消可能在未发布时到达。

**前置条件**：存在可挂到调用方 context 的事务载体、必需的取消信号，以及可逆的注册/资源释放钩子。

**步骤**
1. 在任何可能挂起的加载或 setup 之前，把事务安装到调用方 context。
2. 在私有世界准备 session、注册与 contributions，不对外暴露。
3. 校验取消后，按观察者需要的顺序发布注册表、监听器和公告。
4. 只返回已发布句柄；调用方成为所有者并负责 dispose。
5. 发布前失败：逆序销毁已产生的 effects，释放名称保留，拒绝且不产生 start/end 对。
6. 所有权转移后立即重新检查信号；窄窗口内的 abort 必须 dispose 新句柄。
7. dispose 走记忆化路径：请求取消、排空、投递最终事件、撤销作用域，并等待完全停稳。

**执行者**：事务所有者实现提交/回滚；provider 负责边界就绪；调用方 await 并 dispose；拆除所有者保证锁步。

**完成信号**：外部只看到完整句柄；预发布失败无泄漏、无生命周期对；dispose 后无挂起回调或子进程。

**失败处理**：提交失败回滚最后条目并可重试；进程/provider 失败在拒绝前回收；已接受 run 不因 provider 卸载被二次撤销。

**例外**：冷只读路径不需要 agent 事务；进程 provider 仍需自己的握手就绪，但 start 只在握手成功后 resolve。

**证据边界**：来源证明注册组合、发布与生命周期所有权，不证明安全隔离或父子不升级；跨进程杀死到退出的证据需该 provider 单独提供。

来源：`deepseek-harness/.agents/notes/archived/architecture/2026-07-12-agent-scope-runtime-design.md:124-403@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-16-explicit-turn-cancellation.md:1-56@687f282e`；`deepseek-harness/.agents/notes/archived/architecture/2026-07-19-package-owned-invariant-service.md:1-106@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-07-30-followup-enqueue-and-owned-runs.md:1-42@687f282e`；`deepseek-harness/.agents/notes/implemented/architecture/2026-09-01-parent-owned-subagent-catalog.md:1-51@687f282e`。

---

## 迁移顺序建议（不是来源义务）

以下顺序只是本参考的迁移设计，来源并未规定：

1. 先建立“唯一词汇 + 结构化错误 + 决策状态”三项元规则，成本最低且约束后续工作。
2. 再处理持久格式与只追加/迁移机制，因为它们承载其余一切证据。
3. 随后拆分能力缝、作用域生命周期、发布事务与扩展点所有权。
4. 最后处理组合、配置/凭据、出站与打包；这些需要前几层的稳定接口。

任何一步若目标仓库没有对应设施，应保留该机制并记录其重新激活条件，而不是删除义务。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `rationale-architecture-2.canonical-vocabulary`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-12-pi-ai-route-default-input-modalities.md:1-54@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-shared-agents-root-instructions.md:1-37@687f282e`
- `rationale-architecture-2.append-only-persistence`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-31-live-assistant-stream-frames.md:1-25@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-07-24-project-session-directories.md:1-53@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-host-schedule-storage.md:1-65@687f282e`
- `rationale-architecture-2.capability-seam`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-10-unary-apiproxy-remote-migration.md:1-66@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-08-18-session-history-and-event-transport.md:1-385@687f282e`
- `rationale-architecture-2.scoped-lifetime`：`deepseek-harness/.agents/notes/archived/architecture/2026-07-15-llm-model-catalog-and-acp-selection.md:1-63@687f282e`
- `rationale-architecture-2.extension-point-ownership`：`deepseek-harness/.agents/notes/archived/architecture/2026-07-25-web-input-machine-and-slash-pipeline.md:1-122@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-08-17-dynamic-client-render-and-attachment-ownership.md:1-44@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-08-26-local-submission-echoes.md:1-40@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-09-01-jobs-absorb-activity-record.md:1-49@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-09-27-progressive-office-skills.md:1-32@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-composer-command-chip.md:1-41@687f282e`
- `rationale-architecture-2.composition-truth`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-08-per-preset-standing-mounts.md:1-33@687f282e`
- `rationale-architecture-2.bounded-envelope`：`deepseek-harness/.agents/notes/archived/architecture/2026-09-06-embedded-stream-record-readers.md:1-51@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-09-15-narrow-pi-ai-runtime-imports.md:1-26@687f282e`
- `rationale-architecture-2.plugin-identity`：`deepseek-harness/.agents/notes/archived/architecture/2026-09-16-plugin-configuration-on-the-plugins-page.md:1-42@687f282e`
- `rationale-architecture-2.platform-packaging`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-18-client-build-environment.md:1-44@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-08-11-pwsh-persistent-pty.md:1-69@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-09-17-shared-office-runtime.md:1-38@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-09-08-desktop-welcome-window-material.md:1-37@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-profile-resolution-lookup-order.md:1-182@687f282e`
