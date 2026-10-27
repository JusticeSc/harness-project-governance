# DeepSeek Harness 架构决策的可迁移治理机制（rationale-architecture-3）

> 源提交：`687f282e8625c6b8d11ff58211a90524be2e4317`
> 分区：`rationale-architecture-3`（architecture，94 个英文 Note 及其中文配对与 sidecar）
> 证据边界：本参考只基于指定 Note 正文、中文正文、sidecar、固定分区与两份研究契约。没有读取旧 Skill/旧分析，没有运行实现、构建、测试、lint、格式化或远程调用。所有“验证”均为计划，不是执行结果。归档记录只作为历史；proposed 记录只作为提案；implemented 记录是决策证据，不等于当前代码仍完全如此。
> 本文覆盖：94 个英文 Note（archived 47、implemented 42、proposed 5）及其中文配对，归纳为 40 个机制。

## 0. 如何使用

先按“何时读”找到机制，再读该节的义务、步骤、失败处理与局限。每条机制都给出源 Note 的完整行范围，便于回到原文核对；本参考本身包含足够的代码标识与判断标准，安装后的消费者不必持有源码 checkout 也能执行大部分步骤。

三类证据要分开：

1. **当前规范**：implemented Note 中明确写为决定的内容。
2. **历史/已被取代**：archived Note，以及 implemented Note 内明确标注的 Superseded/部分取代段落。
3. **提案**：proposed Note，包括其中自称 shipped 或 open 的段落；这些不是本分区可验证的运行时保证。

本参考与对应 knowledge 记录中的裸 `Mxx` 简写（例如 `M03 格式演进`）都指本分区的 `arch3-Mxx` 条目，与其他资料的同名编号无关；跨域关系必须写完整记录 ID。

## 1. 机制索引

| ID | 机制 | 先读它的情况 |
| --- | --- | --- |
| rationale-architecture-3.arch3-M01 | 事件 Turn 边界与日志完整性 | 新增可持久化事件类型或写入点 |
| rationale-architecture-3.arch3-M02 | 派生介质与缓存不得成为恢复权威 | 新增缓存、索引、搜索或统计介质 |
| rationale-architecture-3.arch3-M03 | 已发布格式、模式演进与保留字段 | 重构会话/存储抽象 |
| rationale-architecture-3.arch3-M04 | 存储根解析与介质生命周期 | 配置相对 storage root |
| rationale-architecture-3.arch3-M05 | 配置与设置的写入完整性 | 保存 profile/manifest/快捷键/设置 |
| rationale-architecture-3.arch3-M06 | 当前 profile 插件管理事务 | 安装/卸载/启用/禁用插件或 bundle |
| rationale-architecture-3.arch3-M07 | 声明式 Preset 与保留代际 | 新增/编辑 Agent preset |
| rationale-architecture-3.arch3-M08 | 能力缝：消费者定义形状，适配器拥有实现 | 新增文件系统/目录选择/推理强度/代码执行等平台能力 |
| rationale-architecture-3.arch3-M09 | Dispose 阶梯归消费者，而非子进程接缝 | 新增子进程、服务、组件或客户端资源 |
| rationale-architecture-3.arch3-M10 | Provider 注册与精确资源所有权 | 新增可插拔 provider（browser-use/CUA/subagent） |
| rationale-architecture-3.arch3-M11 | 独占附件与可取消资源操作 | 两个视图/Agent 操作同一外部资源 |
| rationale-architecture-3.arch3-M12 | 沙箱策略、启动严格性与生命周期清理 | PTC/代码执行 runtime 启动 |
| rationale-architecture-3.arch3-M13 | 单一应用启动与平台启动同构 | 新增运行平台（Web/Desktop/Preview/源码启动） |
| rationale-architecture-3.arch3-M14 | 启动时一次性清理本地 Spill 文件 | 应用启动/重启 |
| rationale-architecture-3.arch3-M15 | 等待式 Agent 初始化与上下文注入边界 | 创建/恢复 Agent 或子 Agent |
| rationale-architecture-3.arch3-M16 | Client Session 引用、代际与空白写锁 | 打开/切换/关闭 Session 视图 |
| rationale-architecture-3.arch3-M17 | Client 投影状态与工具呈现所有权 | 新增工具行/命令 UI |
| rationale-architecture-3.arch3-M18 | Client 资源模型与地址生命周期 | 新增客户端资源类型 |
| rationale-architecture-3.arch3-M19 | 提交后激活与单一 UI 运动 | 保存偏好/快捷键/草稿 |
| rationale-architecture-3.arch3-M20 | 组件工厂、局部 Slot 与扩展点 | 同一组件需要多个 occurrence |
| rationale-architecture-3.arch3-M21 | 类型化远程调用与统一元数据 | 新增 Remote 方法/端点 |
| rationale-architecture-3.arch3-M22 | 二进制结果的类型定向传输 | Remote 返回文件/图片/字节 |
| rationale-architecture-3.arch3-M23 | 事件投递、路由与文档相对寻址 | 新增浏览器下行/事件流 |
| rationale-architecture-3.arch3-M24 | 路由化模型上下文与压缩策略 | 新增模型/provider/路由 |
| rationale-architecture-3.arch3-M25 | 提示词区块、变量与工具指导所有权 | 新增提示词区块/变量 |
| rationale-architecture-3.arch3-M26 | 协作式取消与已交付前缀终结 | 用户取消/超时 |
| rationale-architecture-3.arch3-M27 | 日志读取意图与物化成本 | 新增列表/搜索/统计/调试视图 |
| rationale-architecture-3.arch3-M28 | Inspector 执行域、协议平面与快照 | 新增运行时/进程检查 |
| rationale-architecture-3.arch3-M29 | VFS 监听上下文、平台约束与懒加载归档 | 在 Worker/VFS 中运行插件 |
| rationale-architecture-3.arch3-M30 | 原生致命恢复与桌面安装包页面 | Electron 主窗口/文档/preload/renderer/Web 初始化/后端失败 |
| rationale-architecture-3.arch3-M31 | 凭据优先级与 profile 级认证边界 | 新增认证来源/凭据存储 |
| rationale-architecture-3.arch3-M32 | Schedule 硬删除与有界投递历史 | 删除任务 |
| rationale-architecture-3.arch3-M33 | 派生内容（翻译/图像）的持久缓存与原始内容共存 | 重新展开思考内容/预览 |
| rationale-architecture-3.arch3-M34 | Workspace 文件服务、路径授权与原生字节 | 读取/预览/上传 Workspace 文件 |
| rationale-architecture-3.arch3-M35 | 插件身份、显示元数据与设置页归属 | 新增插件/实验包 |
| rationale-architecture-3.arch3-M36 | 模型 Provider 声明与凭据 UI | 新增模型 provider/凭据流程 |
| rationale-architecture-3.arch3-M37 | 机械重构与行为改动分离 | 需要从大组件/大文件提取实现 |
| rationale-architecture-3.arch3-M38 | 部分取代与决策记录的生命周期 | 新决策改变旧记录的部分行为/所有权 |
| rationale-architecture-3.arch3-M39 | 会话核心能力协议（提案）与证据边界 | 重构会话/存储抽象 |
| rationale-architecture-3.arch3-M40 | 显式反馈遥测与请求扩展字段 | 新增遥测/反馈上传 |

## 2. 迁移的最小顺序

以下顺序不是唯一实现，但它避免把后面的机制建立在不稳定的前提上：

1. 先建立事件/日志的提交边界与读取意图（M01、M27），否则后续缓存/恢复没有可信真源。
2. 再声明介质 authority 与格式版本（M02、M03、M04），把“可重建”与“权威”分开。
3. 把配置/插件写入收进单事务与锁（M05、M06），再迁移 preset 与凭据 profile（M07、M31）。
4. 为平台能力建立消费者定义的接缝，并把释放/独占/取消责任放回所有者（M08-M12）。
5. 统一应用启动与远程元数据（M13、M21-M23），再接 UI 状态与组件 slot（M16-M20）。
6. 最后处理产品专属的文件/预览/安装/遥测（M30、M32-M35、M40），并把提案与未实现范围显式保留（M38、M39）。

## 3. 机制详解

## A 事件、持久化与恢复

### rationale-architecture-3.arch3-M01 事件 Turn 边界与日志完整性 {#rationale-architecture-3.arch3-M01}

**何时读。** 新增可持久化事件类型或写入点；在 turn 之外注入上下文/排队消息；修改扫描、恢复、压缩或 fork 逻辑；把文本提示当作结构化会话变更。

**问题与历史原因。** 事件日志既是回放真源，也是崩溃恢复边界；一旦允许事件落在 turn/start..turn/end 之外，扫描、恢复或压缩就可能静默丢事件。排队用户消息、空闲上下文注入以及动态工具变更都曾落在这个缝上。

**必须满足的义务。**
- 所有会话事件必须被一个 turn 包围，turn 号从日志派生而非外部计数器
- 生产者侧不变式优先于放宽读取方；Session.append 在写入时拒绝越界事件
- 空闲注入使用一次性 turn，不得裸露在 turn 之外
- end-seed 只保证已提交前缀；不得让日志边界承诺超出可证明范围
- 事件身份（event id）与物理日志偏移分离，二者不可互换
- 消息来源由生产者拥有，消费者不得按名称猜测；工具变更使用 DeveloperMessage 而非自由文本
- 独立事件走查/backstop 作为表面穷尽性兜底；发现遗漏时补规则而不是放宽扫描

**责任角色。** 会话核心/append 实现；事件生产者（loop、注入器、工具注册表）；恢复与压缩实现；评审者。

**步骤。**
1. 确定事件的最小持久化边界（通常一次 turn）
2. 在生产者处写入 turn 包装，或为一次性注入建立合成 turn
3. 在 append 处注册不变式并附带归属（如 dsh-session），失败即拒绝
4. 把 turn 号、序号与日志偏移分别建模，禁止以偏移替代事件身份
5. 为每个消息来源声明 source kind，并在 V4 解码/接纳处校验角色与来源
6. 把动态工具添加/移除写成结构化 developer 记录，引用历史 headerSeq
7. 用崩溃恢复与扫描测试覆盖 turn 外事件、半写日志和 fork 前缀

**完成信号。** turn 外注入被拒绝或自动包装；正常 turn 的事件完整回放。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：运行时不变式 + 接纳校验 + 测试。实现线索：Session.append 的 InvariantError；V4 codec 的角色/字段校验；scanLog/恢复测试；DeveloperMessage 的 headerSeq 引用校验。信任：生产者与日志写入路径共同承担；读取方不得承担修复责任。

**失败处理。** 在写入/接纳点明确拒绝；恢复时保留可恢复前缀并报告类别，不得静默丢弃或改写历史

**例外。** 只读派生数据（索引、投影缓存）不属于日志；其损坏按派生介质规则处理

**适用性。** 适用于任何事件溯源/追加日志系统，尤其是存在 turn、压缩、fork 与崩溃恢复的产品。若系统没有事务边界，可退化为“单次操作内事件必须完整”的更强批量边界。

**与其他机制的关系。** 与 M02 派生介质权威、M03 格式演进、M26 取消前缀终结共享“已提交前缀”概念。

**迁移策略。** 先在生产侧建立可检查的 turn 边界，再迁移读取方；不要先放宽扫描器

**落地实现。** 在唯一 append 入口加不变式与归属；为注入器补合成 turn；为 developer 消息建立 headerSeq 引用与接纳拒绝

**所需支持。** 统一 append 路径、事件 schema、恢复/压缩测试夹具

**验证（计划，未执行）。** 正向：turn 外注入被拒绝或自动包装；正常 turn 的事件完整回放；fork/压缩保留 header 事件与 developer 记录。拒绝：缺少 headerSeq、前向/未知 header、角色错误的消息被拒绝。恢复：半写尾部保留已提交前缀；损坏类别可区分，不删除旧 generation。

**局限。** 本分区只读到决策记录，未执行实现或崩溃注入测试；archived 记录是冻结历史，不代表当前代码形状；end-seed 的保证范围由具体实现限定，不能扩展为“所有失败都不丢事件”。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-06-15-turn-enclosure-invariant.md:1-43@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-30-session-end-seed-log-boundary.md:1-56@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-06-agent-event-payload-objects.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-21-session-log-read-intent.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-31-session-sequence-and-log-offset-brands.md:1-46@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-producer-owned-message-sources.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-developer-session-changes.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-20-dynamic-tool-updates.md:1-37@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-09-cordis-event-walk-backstop.md:1-39@687f282e`

### rationale-architecture-3.arch3-M02 派生介质与缓存不得成为恢复权威 {#rationale-architecture-3.arch3-M02}

**何时读。** 新增缓存、索引、搜索或统计介质；启动时打开派生文件失败；派生数据需要跨重启复用；把模型输出/翻译/预览写入磁盘。

**问题与历史原因。** 投影缓存、图像卸载、翻译结果等派生数据一旦被当作规范数据，损坏就会阻塞启动或让重建结果覆盖真源；反之，把权威数据当缓存自动删除会丢用户内容。

**必须满足的义务。**
- 每个介质必须声明 authority：规范源或可重建派生
- 派生介质损坏只能丢弃/重建，权威介质必须拒绝启动并保留证据
- 缓存读取不得发布旧 generation 或把缓存当恢复依据
- 派生写入是 fail-soft，规范日志/会话写入才是成功判据
- 翻译等派生记录必须与原始内容并存，不能替换原始事件或模型输入

**责任角色。** 域所有者（声明 authority）；存储 facility/backend；缓存与投影实现；启动装配。

**步骤。**
1. 在域 spec 中声明 recovery 策略与介质身份，而不是在全局启动器里按文件名判断
2. 把 damage-class 错误（version-mismatch、malformed-medium、invalid-record）与配置/IO 错误分开
3. 仅对声明为 reset 的派生域执行一次性 destroy+reopen，并记录一条命名介质的警告
4. 权威域保持 loud failure，保留完整 generation 与错误类别
5. 派生记录使用原始内容的身份（Session id/请求身份）作键，并提供只读缓存查找
6. 跨重启复用前校验请求/规则身份，避免用错配置的旧结果

**完成信号。** 派生介质截断/版本不符时启动成功且重建；权威介质同样损坏时拒绝启动。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：域级声明 + 启动路径分类 + 缓存身份校验。实现线索：DomainSpec.recovery、KvFacet.destroy、DomainFacility.open 的单发重试；投影 stateVersion/restore floor；翻译 request/result 记录。信任：域所有者声明 authority；facility 只执行声明，不猜测。

**失败处理。** 非 damage 错误始终 loud；reset 第二次失败传播；缓存 miss 回源而不是返回错误值

**例外。** workspace.json 等用户数据默认 reject；实验性派生介质可 reset，但必须在文档中标注可丢弃

**适用性。** 适用于任何“规范日志 + 可重建索引/缓存”的系统。若没有域 spec，可在存储层增加显式 authority 标记；不要用全局 auto-reset。

**与其他机制的关系。** 依赖 M04 的介质打开/销毁原语；与 M33 翻译/图像缓存、M27 读取意图相关。

**迁移策略。** 先声明 authority 与错误分类，再启用 reset；先对最小派生域试点

**落地实现。** 为每个域补 spec 字段与测试；把缓存损坏从启动致命错误改为警告+重建；为权威域保留 loud failure

**所需支持。** 统一的 open 错误分类、可注入的 destroy 原语、损坏/非损坏测试夹具

**验证（计划，未执行）。** 正向：派生介质截断/版本不符时启动成功且重建；权威介质同样损坏时拒绝启动。拒绝：非 damage 的 EACCES/EIO 不被 reset；第二次 open 失败不被吞掉。恢复：reset 只删除目标介质；警告包含域名与路径；缓存重建后冷列表恢复。

**局限。** storage-root 提案中 reset 部分仍为 proposed；投影缓存全局域已被 per-session 文件部分取代；无法从本分区证明各后端 destroy 的原子性；未执行真实损坏注入。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-02-durable-image-offload.md:1-56@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-persistent-machine-translation.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/proposed/architecture/2026-07-28-storage-root-and-derived-medium-recovery.md:1-59@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-21-session-log-read-intent.md:1-33@687f282e`

### rationale-architecture-3.arch3-M03 已发布格式、模式演进与保留字段 {#rationale-architecture-3.arch3-M03}

**何时读。** 重构会话/存储抽象；新增消息角色、工具变更或事件类型；调整 JSONL 物理布局/压缩；删除或重命名已发布字段；改变 header/turn 基数。

**问题与历史原因。** 抽象重构或新增字段很容易顺手改变磁盘字节，导致旧对话打不开；反过来，为兼容而在旧版本上原地改写会破坏审计与回滚。动态工具和消息角色的演进还要求同一文件内的事件引用可重映射。

**必须满足的义务。**
- 已发布格式由 SESSION_FORMAT_VERSION/格式目录拥有；重构不得改变磁盘字节
- 迁移写入新的 current generation，保留旧 committed generation，不自动降级
- 原生校验与历史迁移是两项独立责任
- 同一 artifact 内的事件引用（如 headerSeq）在改变基数的迁移中必须重映射
- 被拒绝的字段用 never/@persistenceReserved 记录，避免未来静默改变现有值类型
- 物理布局优化（如 packed rows）必须保持逻辑事件等价并提供 fixture
- 统一 JSON-value/schema DSL 作为校验与投影的同一形状，避免各层各自解释

**责任角色。** 格式目录/迁移作者；writer/reader 实现；模式所有者；评审者。

**步骤。**
1. 先确定逻辑事件与物理行的边界，列出必须保持的字节/语义
2. 在格式目录登记 released 路径与 delivery guards，而不是在重构 PR 内重定义格式
3. 为迁移写新 generation；旧 generation 只读保留
4. 为同一 artifact 引用建立 remap 规则并测试 fork/压缩
5. 用 reserved never 字段锁定被拒绝的形状；新增可选元数据必须通过 optional-property 规则
6. 用 canonical snapshot fixtures 比较 packed/非 packed 的逻辑事件

**完成信号。** 重构前后 V3 字节不变；V2→V3 迁移生成新 generation 且旧文件保留。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：版本常量 + 迁移目录 + codec/接纳校验 + fixture。实现线索：SESSION_FORMAT_VERSION、released-format migration chain、V4 codec 角色槽位、ToolAdditionBlock.tool 的 @persistenceReserved、packed chunk 逻辑事件测试。信任：writer authority 与格式目录；消费者不得自行解释旧字节。

**失败处理。** 不支持的新版本、损坏、所有权冲突、迁移失败分别报告；不得删除旧文件或降级

**例外。** 投影缓存等派生格式有自己的 durability 规则，不能与 Session V3/V4 混为一谈

**适用性。** 适用于有已发布磁盘格式和长期用户数据的系统；实验性、未发布格式可简化，但仍应保留版本与损坏分类。

**与其他机制的关系。** M01 的事件身份/来源、M02 的派生介质、M38 的部分取代记录。

**迁移策略。** 先冻结已发布格式，再在新版本中加字段/迁移；绝不在重构中重定义旧版本

**落地实现。** 新增格式版本与迁移 stage；为 headerSeq 等引用写 remap；用 reserved 字段阻止形状漂移

**所需支持。** 格式目录、迁移夹具、旧 generation 保留策略、双版本读取测试

**验证（计划，未执行）。** 正向：重构前后 V3 字节不变；V2→V3 迁移生成新 generation 且旧文件保留；packed/非 packed 的逻辑事件与快照一致。拒绝：缺少必需字段/角色错误/已退役内联定义被拒绝；higher-priority override 不能绕过校验。恢复：迁移失败保留旧 generation 与错误类别；不自动降级。

**局限。** session-data-compatibility 为 proposed，只给出约束而非已执行证据；packed rows 与 V4 的具体实现未在本分区执行；不能从备注证明所有 provider 都遵守 released-format contract。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-20-unified-json-value-schema-dsl.md:1-38@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-26-packed-chunk-rows-by-default.md:1-60@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-31-session-sequence-and-log-offset-brands.md:1-46@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-producer-owned-message-sources.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-developer-session-changes.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-data-compatibility.md:1-43@687f282e`

### rationale-architecture-3.arch3-M04 存储根解析与介质生命周期 {#rationale-architecture-3.arch3-M04}

**何时读。** 配置相对 storage root；从不同目录启动同一部署；实现新的存储 backend；启动时打开损坏/版本不符的介质。

**问题与历史原因。** 相对存储根会随 process.cwd() 漂移，使同一后端在运行中被劈到多个根；介质打开失败的分类又决定启动是否应该失败。

**必须满足的义务。**
- 配置根在 backend 构造时解析一次，后续 cwd 变化不得改变路径
- 会话根与派生介质根使用同一规范 home 解析器
- 启动路径必须区分“空 unit”“损坏”“配置错误”“IO 错误”
- 权威介质损坏拒绝启动；派生介质按声明 reset
- 不做迁移垫片的前提是明确 pre-release/无外部消费者

**责任角色。** 存储 backend 作者；app-boot/overlay 作者；域所有者。

**步骤。**
1. 在构造时对 root 调用一次 resolve，并缓存绝对路径
2. 用 dshHomePath/dsh-home-paths 统一会话与 storages 的默认值、波浪号与回退
3. 把 open 错误映射为封闭类别；ENOENT 视为空 unit，其余 IO 保持 loud
4. 为每个域声明 recovery 与 authority
5. 在测试中 patch 绝对临时根，避免触碰用户 home

**完成信号。** 从任意目录启动读写同一根；相对根在 cwd 改变后仍指向同一路径。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：构造期解析 + 错误分类 + 域声明。实现线索：JsonStorageBackend/SQLite backend 的 resolve-once；openJsonUnit 的 malformed-medium/version-mismatch；DomainFacility.open。信任：backend 负责路径稳定；域所有者负责 authority。

**失败处理。** 相对根漂移属于配置/实现错误，应测试拒绝或固定；损坏按域策略

**例外。** 测试/裸 Loader 可使用相对根，但必须固定 cwd 或在构造时解析

**适用性。** 任何有可配置存储根、工作目录可变、多个介质共享 home 的应用；对纯内存测试可豁免。

**与其他机制的关系。** M02 的 authority/reset；M05 的写入锁。

**迁移策略。** 先修 resolve-once，再迁移根位置；pre-release 可不做 shim，但需记录一次性手工迁移

**落地实现。** 在 backend 构造函数缓存 resolve 后的根；把 overlay 的 root 锚定到 $DSH_HOME/storages

**所需支持。** 统一 home 解析器、绝对根测试夹具、错误分类

**验证（计划，未执行）。** 正向：从任意目录启动读写同一根；相对根在 cwd 改变后仍指向同一路径。拒绝：损坏的权威域仍拒绝启动；非 damage 错误不被 reset。恢复：派生域 reset 后重建；旧 per-cwd 数据需手工迁移或重新派生。

**局限。** storage-root 仍为 proposed，resolve-once 被明确标为 still open；投影缓存全局域已部分被 per-session 文件取代；未执行多 cwd 集成测试。

**源证据。**
- `deepseek-harness/.agents/notes/proposed/architecture/2026-07-28-storage-root-and-derived-medium-recovery.md:1-59@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-30-settings-write-path-integrity.md:1-36@687f282e`

## B 配置、插件、凭据与决策生命周期

### rationale-architecture-3.arch3-M05 配置与设置的写入完整性 {#rationale-architecture-3.arch3-M05}

**何时读。** 保存 profile/manifest/快捷键/设置；多个适配器共享同一事务逻辑；观察者/监听器在写入后触发；相对路径或禁用条目参与配置插值。

**问题与历史原因。** 配置/设置是用户可见状态：写入顺序、观察者生命周期和并发锁不正确会产生“界面显示成功但重启丢失”、覆盖并发编辑或读到半写文件。

**必须满足的义务。**
- 先持久化、后发布/激活；失败不得改变已接受配置
- 写入使用版本/锁/单写者；并发冲突拒绝而不是静默覆盖
- 观察者属于 owner，卸载时移除并等待已接纳工作
- 不可读/未来版本配置阻止普通编辑并保留原始字节
- Loader 对 disabled 等字段的插值必须有明确语义，不能把禁用条目误当启用

**责任角色。** 设置/配置服务；各适配器（Web/Electron/CLI）；观察者/监听器 owner；Loader。

**步骤。**
1. 定义唯一 accepted configuration；写入事务成功后才发布
2. 为每次编辑读 revision，拒绝 stale draft；文件系统写入使用原子替换/串行队列
3. 把校验与事务逻辑放在共享层，平台适配器只负责存储位置
4. 卸载时 dispose 监听器并 await 其拥有的工作；避免写入循环
5. 对不可读数据保持只读，提供外部修复路径而不是重置

**完成信号。** 成功保存后重启可见；失败保存不改变界面/已接受值。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：事务 + revision 检查 + 生命周期管理。实现线索：shortcut service、profile writer lock、chokidar 稳定性窗口、settings observer dispose、Loader disabled 插值。信任：共享事务层负责正确性；平台层不得自行绕过。

**失败处理。** 保存失败保持旧 accepted 值并报告；冲突拒绝；不可读阻止编辑

**例外。** 显式恢复/管理员修复可以替换数据，但必须是单独路径并保留证据

**适用性。** 任何有本地持久化设置、多个 UI 适配器或热更新观察者的桌面/Web 应用。

**与其他机制的关系。** M06 的 profile 事务与锁；M19 的提交后激活；M04 的介质错误分类。

**迁移策略。** 先统一事务与 accepted 状态，再迁移各适配器；不要在两个平台各写一套校验

**落地实现。** 把校验/事务抽到共享 service；为 revision/锁/不可读状态补测试

**所需支持。** 原子文件写入、revision、观察者生命周期、平台存储适配器

**验证（计划，未执行）。** 正向：成功保存后重启可见；失败保存不改变界面/已接受值；并发编辑按 revision 拒绝 stale；卸载后监听器不再触发。拒绝：不可读/未来版本配置被普通编辑拒绝；禁用条目不被错误插值。恢复：外部修复文件后重新加载；恢复路径不覆盖原始字节。

**局限。** Windows 原子替换不承诺 fsync；浏览器 localStorage 只能 last-writer-wins；未执行真实断电/并发写测试；部分实现细节在其他域。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-30-settings-write-path-integrity.md:1-36@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-11-loader-entry-disabled-interpolation.md:1-26@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-current-profile-plugin-management.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-20-device-local-shortcut-preferences.md:1-27@687f282e`

### rationale-architecture-3.arch3-M06 当前 profile 插件管理事务 {#rationale-architecture-3.arch3-M06}

**何时读。** 安装/卸载/启用/禁用插件或 bundle；CLI 与 Web 同时修改 profile；HMR 观察到 manifest 变化；构建批准/allowBuilds 交互。

**问题与历史原因。** CLI、Web 与 agent 工具都能改插件；若各自实现安装/启用/删除，会出现重复安装、半写 YAML、并发覆盖和“保存成功但运行时未生效”。

**必须满足的义务。**
- CLI 与服务共享同一异步实现，不 spawn 第二个 dsh、不维护第二 installer
- profile manifest 写入持有 writer lock；HMR 变更走单一队列
- 依赖安装（pnpm）在 HMR 队列之外，HMR 不持有 package writer lock
- 只做最小 YAML 编辑：条目 toggle 改最后一个匹配 override，bundle 改有序列表
- 删除先应用“不含该 bundle”的组合，等待旧 fiber 结束后再删依赖
- 保存配置、pnpm 完成、运行时激活是三个独立结果，分别报告
- 安装失败只恢复快照 manifest/lockfile；删除失败保留真实部分状态
- 构建批准只改 pending 的确切名称，保留无关 YAML，拒绝 anchor/alias，stale retry 不能覆盖后续拒绝
- 管理组件受保护，启动中的进程必须先停止才能删除 CLI

**责任角色。** profile 服务/launcher；Web 插件管理器；CLI；HMR；pnpm。

**步骤。**
1. 读取 profileContext 纯数据，组合当前文件，不暴露回调
2. 获取 writer lock，执行最小编辑并持久化
3. 把变更送入 HMR 队列；等待应用 ready 后再处理 watcher 事件
4. 依赖操作完成后重新组合；对受影响组件做前后比较
5. 用显式信号/超时验证删除等待与失败恢复
6. 把批准状态限制在 pending 名称，校验 YAML 结构

**完成信号。** CLI 与 Web 得到相同结果；连续写入不覆盖；启用 bundle 后行生效。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：单实现 + 锁/队列 + 前后比较 + 明确结果。实现线索：profile manifest writer lock、HMR queue、Chokidar 50ms 稳定性、applyEntryPatches、allowBuilds、reconcile 比较。信任：共享服务是唯一写者；UI/CLI 只是调用方。

**失败处理。** 半写/失败保留可诊断部分状态；安装失败恢复快照；未激活的显式启用视为错误

**例外。** pnpm 自身并发由 pnpm 处理；HMR 不等待 pnpm

**适用性。** 适用于有可写 profile、插件包管理器、HMR 和多前端的管理系统；无热更新的系统可省略队列但仍需锁与结果分离。

**与其他机制的关系。** M05 的写入完整性；M07 preset 声明；M35 插件身份/显示元数据。

**迁移策略。** 先把 CLI 与服务合并到一个事务实现，再迁移 Web/agent 调用方

**落地实现。** 抽取共享 package operations；为 manifest 加锁；为 HMR 建队列；把批准与安装结果分开建模

**所需支持。** profileContext、writer lock、HMR 队列、YAML 保留编辑、reconcile 测试

**验证（计划，未执行）。** 正向：CLI 与 Web 得到相同结果；连续写入不覆盖；启用 bundle 后行生效。拒绝：stale revision、anchor/alias 批准、非 pending 名称被拒绝。恢复：安装失败恢复 manifest/lockfile；删除失败保留部分状态并在下次重试。

**局限。** 真实 pnpm/网络与 HMR 未在本分区执行；不同平台的 YAML 保留编辑细节需实现验证；管理组件保护清单由产品定义。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-current-profile-plugin-management.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-09-plugin-management-in-the-web-sidebar.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-21-live-config-inspect-provider.md:1-26@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-17-settings-pages-as-companion-packages.md:1-41@687f282e`

### rationale-architecture-3.arch3-M07 声明式 Preset 与保留代际 {#rationale-architecture-3.arch3-M07}

**何时读。** 新增/编辑 Agent preset；运行中 Agent 仍引用旧定义；为某能力决定放在全局行还是 preset；重启/复用空白 Session 时解析 preset 身份。

**问题与历史原因。** 如果 preset 是独立目录/复制 API，就会与 Cordis profile 配置争夺同一身份；编辑时销毁定义又会撤销运行中 Agent 的工具。另一方向是把所有能力塞进全局行，让不需要它的 preset 承担持久消息成本。

**必须满足的义务。**
- preset registry 拥有选择与运行时代际；声明只描述身份/显示元数据/子插件列表
- 定义 eager 激活；失败保留在 roster 并拒绝新绑定，但不阻止应用启动
- 每个 revision 拥有独立 scope/Loader 树；Agent 链接自己的 scope，子 Agent 继承父级确切 revision
- 更新使旧 revision 退役；Agent/冷读者持有引用，最后释放才销毁树
- preset 服务提供方/消费者在隔离 realm，Host 注册表与 Agent loop 保持共享
- 编辑器/工具只写子插件 YAML 到当前 profile 用户补丁，保留显示元数据与无关配置
- revision 检查 + profile 锁防覆盖；拒绝会击败编辑的更高优先级 override
- 持久化与激活分别报告；配置在 Host 执行，写入需批准或完全访问
- Session 记录 preset 身份；重启解析缺失则拒绝；空白复用不解析旧身份
- 能力注入归属消费它的 preset；部署级服务行与客户端界面不归属 preset

**责任角色。** preset registry；preset 作者；Web 编辑器/agent_preset 工具；profile 服务；Agent/子 Agent。

**步骤。**
1. 把 preset 声明为普通 Cordis YAML，不在目录中另建发现/复制 API
2. 注册 revision 时建立 scope/Loader 树，并记录引用
3. Agent 绑定时链接 scope；子 Agent 继承 revision 而不是重新选择
4. 编辑时写 profile 用户补丁，先校验 revision/override，再持久化并激活
5. 运行时错误保留 roster，不阻断启动；删除定义前等待所有引用释放
6. 决定注入位置时，先问“谁消费它”，再决定放 preset 还是部署行

**完成信号。** 运行中 Agent 保留旧 revision；编辑后新 Agent 用新 revision；子 Agent 继承父 revision。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：registry 所有权 + 引用计数 + 隔离 realm + 编辑校验。实现线索：dsh-agent-preset-registry/dsh-agent-preset、retained revisions、applyEntryPatches、verify-cordis-config、preset 用户补丁。信任：registry 负责代际生命周期；编辑面只写声明数据。

**失败处理。** 激活失败拒绝新绑定但保留旧 Agent；缺失定义拒绝重启解析；持久化失败不激活

**例外。** 用户 override 替换整个子插件列表，不合并未来内置变更；preset 不是安全沙箱

**适用性。** 适用于需要同一进程运行不同能力集、又要求热编辑不打断运行中任务的插件系统。单体应用可简化为静态配置，但仍应区分声明与运行时代际。

**与其他机制的关系。** M06 的 profile 事务；M03 的 Session 身份；M25 的提示词/注入所有权。

**迁移策略。** 先建立 registry 所有权与引用释放，再把目录 preset 迁移为声明

**落地实现。** 声明 identity/display/children；建立 per-revision scope；把编辑改成用户补丁；删除旧目录 API

**所需支持。** Cordis YAML、Loader scope、revision 引用计数、profile 锁、双语 UI 元数据

**验证（计划，未执行）。** 正向：运行中 Agent 保留旧 revision；编辑后新 Agent 用新 revision；子 Agent 继承父 revision。拒绝：缺失定义重启失败；并发编辑被 revision 检查拒绝；无效子插件 YAML 被拒绝。恢复：激活失败保留 roster 与旧引用；持久化失败不改变运行态。

**局限。** 旧目录/逐会话挂载记录是历史，不是当前实现；未执行多 Agent 隔离与热编辑测试；隔离 realm 的具体边界需代码验证。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-03-per-session-agent-presets.md:1-85@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md:1-39@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-preset-scoped-time-context.md:1-37@687f282e`

### rationale-architecture-3.arch3-M31 凭据优先级与 profile 级认证边界 {#rationale-architecture-3.arch3-M31}

**何时读。** 新增认证来源/凭据存储；headless/CI 与 GUI 共享 Harness home；provider 需要登录/grant；凭据恢复。

**问题与历史原因。** GUI 保存的凭据、环境变量、provider 记录和 headless 任务的显式密钥可能互相覆盖；全局改优先级会让 GUI 保存失效，或让 headless 误用另一个账户。

**必须满足的义务。**
- 凭据解析优先级必须明确，且由 profile 组合选择
- headless 可完全不挂载 credentials/authorization/account 行，按启动快照（进程环境→调用目录 .env→home .env）解析
- 不读取/迁移/写入/删除 .credentials.yaml；显式禁用依赖行避免 pending warning
- GUI/Web/SDK/ACP 保留存储与登录刷新行为
- 恢复存储认证后回到 stored-first；恢复 patch 由 profile README 拥有

**责任角色。** 凭据服务/provider；profile 作者；headless/CI 用户；认证 UI。

**步骤。**
1. 列出所有凭据来源与优先级，写入 profile 组合
2. headless 组合禁用存储及依赖行；API-key adapter 走环境快照
3. 保留恢复路径（patch）并测试
4. 对缺失/畸形存储/恢复做进程级测试
5. 避免在共享 provider 中增加第二优先级模式

**完成信号。** headless 用显式环境密钥；GUI/Web 仍 stored-first；恢复后 headless 也 stored-first。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：profile 组合 + adapter 解析顺序 + 恢复 patch。实现线索：stored credential precedence、headless environment auth、credentials/authorization/deepseek-account rows。信任：profile 选择机制；adapter 执行解析；存储服务不被 headless 挂载。

**失败处理。** headless 缺少存储凭据时 provider 失败；不静默回退到 GUI 凭据

**例外。** 其他 profile/恢复后的 headless 保持 stored-first

**适用性。** 适用于多认证来源、共享 home、CI/headless 的产品；单一认证来源可简化。

**与其他机制的关系。** M05 配置写入；M07 preset 组合；M36 provider UI。

**迁移策略。** 先用 profile 覆盖实现 headless 隔离，再考虑统一优先级

**落地实现。** 禁用行；启动快照解析；恢复 patch；进程测试

**所需支持。** profile 覆盖、adapter 环境解析、.env 层

**验证（计划，未执行）。** 正向：headless 用显式环境密钥；GUI/Web 仍 stored-first；恢复后 headless 也 stored-first。拒绝：headless 不读取畸形存储；依赖行不产生 pending warning。恢复：恢复 patch 后登录/刷新可用；文件保持原样。

**局限。** 凭据优先级记录在其他域，未逐条复核；未执行真实登录/CI 测试；headless README 的恢复 patch 是外部依赖。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-13-credential-records-and-authorization-flows.md:1-68@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-12-headless-environment-auth.md:1-30@687f282e`

### rationale-architecture-3.arch3-M35 插件身份、显示元数据与设置页归属 {#rationale-architecture-3.arch3-M35}

**何时读。** 新增插件/实验包；插件需要设置页/侧栏入口；本地化显示名称/说明；插件启用/禁用/卸载。

**问题与历史原因。** 实验性包、插件显示名、设置页和 Web 侧栏入口若由核心硬编码或由多个来源提供，会出现名称冲突、翻译缺失、卸载后残留页面，以及实验能力被误当稳定 API。

**必须满足的义务。**
- 实验包使用显式命名/发布通道，不伪装稳定 API
- 显示元数据由插件包拥有（locale/icon/title），核心只消费
- 设置页作为 companion package 注册，随插件启用/卸载
- 插件管理入口有明确 owner（Web 侧栏），不复制到多处
- Live Config inspection 读取当前 profile，不维护 Host Builtin 第二真源
- 本地化元数据缺少时回退，不硬编码中文/英文

**责任角色。** 插件作者；Web 侧栏/设置宿主；本地化/发布流程；profile 服务。

**步骤。**
1. 在包 manifest 声明 display/locale/icon 与 experimental 标记
2. 设置页作为包注册，绑定启用状态
3. 侧栏/设置宿主按注册表渲染，不硬编码列表
4. Live Config 读取 profile 当前值
5. 卸载时移除入口；缺失翻译回退
6. 测试启用/禁用/卸载与双语元数据

**完成信号。** 插件标题/图标/翻译正确；设置页随启用出现；卸载后消失。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：包所有权 + 注册表 + 生命周期绑定。实现线索：experimental package prefix、localized package metadata、settings companion packages、Web sidebar plugin management、live config inspect。信任：插件拥有元数据；宿主只渲染注册项。

**失败处理。** 名称冲突/缺失元数据明确回退或拒绝；卸载清理入口

**例外。** 核心内置页面可保留，但需与插件页区分

**适用性。** 适用于插件化 UI、实验包和多语言产品；单体应用可省略注册表，但仍应避免核心硬编码列表。

**与其他机制的关系。** M06 插件事务；M20 slots；M36 模型页。

**迁移策略。** 先把显示/设置元数据移到包，再迁移侧栏/设置页

**落地实现。** manifest 元数据；companion 设置页；live config；卸载清理

**所需支持。** 插件注册表、locale、启用状态、卸载钩子

**验证（计划，未执行）。** 正向：插件标题/图标/翻译正确；设置页随启用出现；卸载后消失。拒绝：实验包不被标为稳定；缺失元数据不崩溃。恢复：回退默认文案；重新启用恢复入口。

**局限。** 未执行插件 UI/本地化测试；实验包命名策略是产品约定；Sidebar 入口的产品细节可能演进。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-18-experimental-agent-teams-packages.md:1-42@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-19-experimental-package-name-prefix.md:1-30@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-09-plugin-management-in-the-web-sidebar.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-17-settings-pages-as-companion-packages.md:1-41@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-18-localized-package-metadata.md:1-92@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-21-live-config-inspect-provider.md:1-26@687f282e`

### rationale-architecture-3.arch3-M36 模型 Provider 声明与凭据 UI {#rationale-architecture-3.arch3-M36}

**何时读。** 新增模型 provider/凭据流程；Models 页面扩展；登录/授权/刷新；provider 声明持久化。

**问题与历史原因。** 让用户在 Models 页面声明 provider 时，若直接写核心配置/凭据文件，会绕过 profile 分层、锁和凭据边界；模型页扩展点也可能变成核心硬编码。

**必须满足的义务。**
- provider 声明通过 profile 配置/补丁持久化，遵守事务/锁
- 凭据写入走凭据服务/授权流程，不由 UI 直接写文件
- Models 页面使用扩展 slot，插件提供声明 UI/元数据
- provider 能力/认证方式显式声明，不靠名称猜测
- 登录/登出/刷新有明确生命周期与错误分类

**责任角色。** Models 页面/扩展；provider 插件；凭据/授权服务；profile 服务。

**步骤。**
1. 定义 provider 声明 schema 与 profile 写入路径
2. 把凭据输入交给授权服务；UI 不落盘
3. 用扩展 slot 注入 provider 卡片/表单
4. 声明能力/认证方式
5. 测试登录/失败/刷新/登出
6. 确保声明与凭据恢复路径

**完成信号。** 声明持久化并在重启后可用；登录/刷新成功；扩展卡片只影响模型页。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：profile schema + 凭据服务 + 扩展 slot。实现线索：declaring provider from Models page、models-page extension slots、credential records/authorization flows。信任：profile 持久化声明；凭据服务拥有秘密；UI 只收集。

**失败处理。** 无效声明/认证失败明确；不把密钥写日志

**例外。** 本地/无认证 provider 可简化凭据步骤

**适用性。** 适用于可插拔模型 provider 与用户自助声明的产品；固定 provider 可省略 UI。

**与其他机制的关系。** M31 凭据优先级；M35 插件元数据；M06 profile 写入。

**迁移策略。** 先定义 schema/凭据边界，再开放 Models UI

**落地实现。** provider schema；授权流程；扩展 slot；profile 补丁

**所需支持。** 凭据服务、profile 锁、provider 插件接口

**验证（计划，未执行）。** 正向：声明持久化并在重启后可用；登录/刷新成功；扩展卡片只影响模型页。拒绝：无效 schema/未授权 provider 被拒绝；密钥不入日志。恢复：登出/刷新清理；凭据恢复后重新可用。

**局限。** 未执行模型页/登录测试；具体 provider 认证流程依实现；凭据安全需独立审计。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-04-declaring-a-provider-from-the-models-page.md:1-52@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-26-models-page-extension-slots.md:1-34@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-13-credential-records-and-authorization-flows.md:1-68@687f282e`

### rationale-architecture-3.arch3-M38 部分取代与决策记录的生命周期 {#rationale-architecture-3.arch3-M38}

**何时读。** 新决策改变旧记录的部分行为/所有权；旧记录仍拥有其他有效约束；提案中部分已落地/部分仍开放；重写/拆分架构决策。

**问题与历史原因。** 新决策常常只取代旧记录的一部分；若直接归档/删除旧记录，会让仍有效的约束失去归属；若完全不标注，读者会把已被取代的内容当现行规则。

**必须满足的义务。**
- 明确写出取代范围：哪些段落/决策被替换，哪些仍有效
- 旧记录保持 active（或仅冻结被取代部分），并指向新 owner
- 提案中区分 shipped/open/superseded，不能把未实现写成 current
- 新记录承担被取代部分的唯一权威；读者按链接解析
- 迁移/验收标准写清旧记录中仍需遵守的部分

**责任角色。** 决策作者；评审者；后续维护者。

**步骤。**
1. 列出旧记录的所有决策点，逐项标记 keep/replace
2. 在新记录中引用旧记录并说明边界
3. 旧记录保留链接/状态，不删除仍有效内容
4. 对 shipped/open 分别标注证据
5. 后续变更再次更新 owner 链接

**完成信号。** 读者能从旧记录找到新 owner；仍有效约束未被误删。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：文档状态 + 取代边界 + 链接。实现线索：Status/partial supersession 段落、archived/implemented/proposed 目录、owner links。信任：作者声明；评审核对范围。

**失败处理。** 范围不清/旧记录被误归档视为治理缺陷

**例外。** 完全取代可归档；部分取代不得冻结/归档整个旧记录

**适用性。** 适用于长期维护的决策记录/ADR/规范；一次性设计文档可简化。

**与其他机制的关系。** M03 格式演进；M04 介质权威；M31 凭据 profile。

**迁移策略。** 先列出旧决策点，再写取代矩阵

**落地实现。** partial supersession 段落；active owner；status 目录

**所需支持。** 决策索引、链接检查、评审流程

**验证（计划，未执行）。** 正向：读者能从旧记录找到新 owner；仍有效约束未被误删。拒绝：部分取代却归档旧记录被评审拒绝；未实现内容标为 current 被拒绝。恢复：拆分/回滚时恢复旧 owner；保留历史链接。

**局限。** 本分区只读记录，未审计全库链接；部分取代的边界仍可能随实现变化；文档状态不等于代码状态。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-05-session-preparation.md:1-46@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-schedule-hard-delete-and-bounded-history.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-12-headless-environment-auth.md:1-30@687f282e`
- `deepseek-harness/.agents/notes/proposed/architecture/2026-07-28-storage-root-and-derived-medium-recovery.md:1-59@687f282e`

## C 能力缝、资源所有权与清理

### rationale-architecture-3.arch3-M08 能力缝：消费者定义形状，适配器拥有实现 {#rationale-architecture-3.arch3-M08}

**何时读。** 新增文件系统/目录选择/推理强度/代码执行等平台能力；模型或 provider 能力不一致；CLI/桌面/Web 需要不同实现；旧 seam 已无真实调用方。

**问题与历史原因。** 把本地路径、模型名称、平台目录选择或命令解析直接写进业务代码，会让每个调用方各自猜测实现，无法替换后端；反过来，过度抽象会把无关策略塞进 seam。

**必须满足的义务。**
- 接缝由消费者需求定义，适配器拥有平台差异；业务代码依赖能力接口而非具体后端
- 能力差异显式声明（如 reasoning effort 由 adapter 拥有），不要用全局默认掩盖
- 路径/标识等平台值由拥有者解析，消费者不得重复拼装
- 只保留有真实调用方的 seam；命令/参数裁剪先证明无消费者
- 模型提示词/工具指导的所有权与执行所有权分离

**责任角色。** 能力所有者（fs/code runtime/directory picker/model adapter）；调用方；适配器作者。

**步骤。**
1. 列出调用方真正需要的操作与失败语义，删去“以后可能用”的方法
2. 定义最小接口与能力声明，把平台值/限制放在适配器
3. 为每个适配器提供契约测试；用依赖门禁禁止业务导入具体实现
4. 用真实调用方迁移验证 seam；删除无消费者的旧接口
5. 对模型差异使用路由/能力字段，而不是在业务层分支 provider 名称

**完成信号。** 同一业务代码在两种适配器下通过契约测试；不支持能力得到明确错误。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：接口 + 契约测试 + 依赖门禁。实现线索：ctx.fs、code-runtime portable identifiers、directory-picker capability、adapter-owned reasoning effort、cmdline seam trim。信任：能力所有者定义语义；适配器实现；业务只消费。

**失败处理。** 不支持的能力显式报错/降级，不得静默改变语义

**例外。** 测试/组合根可见具体实现；产品可保留平台专属能力但需标注

**适用性。** 适用于跨平台、多 provider 或有本地/远程两种实现的系统；单一平台小工具可延迟抽象，但不要把具体路径写进业务层。

**与其他机制的关系。** M09 的 dispose；M21 的远程能力；M35 的 provider 声明。

**迁移策略。** 按真实调用方逐个抽取，先删旧 seam 再增加新抽象

**落地实现。** 定义接口与 capability 字段；迁移所有调用方；加契约测试/依赖门禁；删除无消费者路径

**所需支持。** 依赖注入/Context、契约测试、平台适配器

**验证（计划，未执行）。** 正向：同一业务代码在两种适配器下通过契约测试；不支持能力得到明确错误。拒绝：业务源码导入具体实现被依赖门禁拒绝；无消费者 seam 被删除。恢复：适配器失败不污染核心状态；调用方可重试/降级。

**局限。** 本分区未执行依赖门禁或契约测试；部分 seam 的当前实现可能已再次演进；产品专属 UI 能力不可直接迁移。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-06-17-filesystem-capability-seam.md:1-164@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-24-adapter-owned-reasoning-effort-capabilities.md:1-34@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-28-directory-picker-capability-seam.md:1-49@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-31-code-runtime-portable-identifier-seam.md:1-45@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-11-cmdline-seam-trim.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-05-prompt-variables-and-tool-guidance-ownership.md:1-71@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-22-single-dsh-application-launcher.md:1-100@687f282e`

### rationale-architecture-3.arch3-M09 Dispose 阶梯归消费者，而非子进程接缝 {#rationale-architecture-3.arch3-M09}

**何时读。** 新增子进程、服务、组件或客户端资源；接缝需要释放多个资源；组件工厂/实例需要独立生命周期。

**问题与历史原因。** 把“如何优雅关闭”写进子进程/组件接缝，会让每个接缝复制一套阶梯；消费者最了解自己拥有的资源，应该决定关闭顺序与超时。

**必须满足的义务。**
- 接缝只提供原子释放/取消原语；消费者拥有 dispose 阶梯与顺序
- 组件工厂与 occurrence 分离：工厂可复用，occurrence 拥有局部状态
- 资源模型用地址/句柄标识，生命周期由所有者显式释放
- 释放必须幂等；已释放对象读取明确失败
- 卸载/销毁只影响自己的连接/实例，不牵连其他消费者

**责任角色。** 资源所有者（Agent/Client/service）；接缝实现；组件工厂。

**步骤。**
1. 列出资源及其依赖顺序，在消费者实现 dispose ladder
2. 接缝只暴露 close/kill/cancel 等原语，不内置业务顺序
3. 为每个 occurrence 建立独立状态与释放钩子
4. 用弱键/地址表管理活跃资源，避免按全局 id 误释放
5. 用幂等释放与已释放读取测试验证

**完成信号。** 重复 dispose 无副作用；卸载一个视图不影响另一个；工厂复用不共享 occurrence 状态。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：所有权约定 + 幂等释放 + 生命周期测试。实现线索：subprocess seam、component factories/local slots、Client resource model、SessionReference.dispose。信任：消费者负责；接缝不替消费者决策。

**失败处理。** 释放失败保留可诊断状态；不得让一个实例的卸载解绑另一个

**例外。** 进程级资源（如共享 native service）由连接计数/进程退出管理

**适用性。** 任何有长生命周期资源、组件复用或多视图实例的系统；简单一次性对象可直接释放。

**与其他机制的关系。** M10 的 provider 生命周期；M11 的独占资源；M16 的 Session reference；M18 的资源模型。

**迁移策略。** 先明确资源所有者，再把顺序从接缝移回消费者

**落地实现。** 删除接缝内的业务阶梯；为 occurrence 建独立 dispose；用幂等测试覆盖重复释放

**所需支持。** 资源地址/句柄、幂等 close、生命周期钩子

**验证（计划，未执行）。** 正向：重复 dispose 无副作用；卸载一个视图不影响另一个；工厂复用不共享 occurrence 状态。拒绝：已释放对象读取失败；跨所有者误释放被阻止。恢复：释放失败保留错误与剩余资源；下次重试。

**局限。** 本分区只读决策记录，未执行资源泄漏测试；共享进程/子进程的细节分散在其他域；组件工厂的运行时类型检查需实现验证。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-27-dispose-ladder-to-consumer.md:1-24@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-component-factories-and-local-slots.md:1-105@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-client-resource-model.md:1-86@687f282e`

### rationale-architecture-3.arch3-M10 Provider 注册与精确资源所有权 {#rationale-architecture-3.arch3-M10}

**何时读。** 新增可插拔 provider（browser-use/CUA/subagent）；多个 Agent 共享同一外部应用/进程；同一路径发布不同构建；Agent 销毁/重载/切换。

**问题与历史原因。** 用一个通用 provider 注册表暴露浏览器/桌面对象，会迫使所有后端共享并不存在的语义；只按 Session id 或进程路径识别资源，又会让不同 Agent/构建互相替换连接。

**必须满足的义务。**
- 注册表可以只注册名称/工厂，不暴露共享对象或统一操作 API；provider 拥有自己的工具与生命周期
- 资源归属于确切的 live Agent+Session，而不只是可复用 id
- 同一用户/内容摘要可共享 native service，但每个 Agent 连接拥有独立句柄/快照/限制/取消状态
- 共享服务选主使用版本锁 + 规范化路径锁；锁持有到进程退出
- 服务生命周期可交给客户端连接，最后连接清理后退出
- 诊断入口代理到同一服务，不另起实例

**责任角色。** provider 作者；registry；Agent/Session；native service。

**步骤。**
1. 先判断后端是否有可移植的共同语义；没有则只注册名称，不强行统一 API
2. 把资源所有权绑定到 Agent+Session 生命周期，调用期间保留状态
3. 用内容摘要/版本/路径锁选主，避免路径标识冲突
4. 为每个连接建立独立状态与 FIFO 操作队列
5. 取消/超时先停止单请求并等待确认；迟到结果丢弃
6. 服务退出/进程失效时使所有旧句柄失效，不自动重放不确定输入

**完成信号。** 两个 Agent 共享服务但互不释放句柄；不同构建同路径不能同时运行；最后连接退出服务。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：注册形状 + 所有权 + 选主锁 + 连接隔离。实现线索：ctx.browserUse 名称注册、exact Agent+Session ownership、CUA content digest/version/canonical-path locks、FIFO、CAPTURE_BUSY。信任：provider 拥有资源；registry 只做名称注册。

**失败处理。** 重复注册/错误路径/构建冲突拒绝；连接失败只影响自己的请求

**例外。** 实验性 provider 可显式声明能力不足；外部拥有的浏览器不关闭

**适用性。** 适用于多 Agent 共享外部桌面/浏览器/进程的系统；单一 Agent 可直接持有资源，不必引入共享服务。

**与其他机制的关系。** M09 dispose；M11 独占附件；M12 沙箱；M24 subagent/provider 组合。

**迁移策略。** 先删共享对象 API，再迁移 provider 到名称注册；共享服务先做内容摘要/锁

**落地实现。** 注册名称+工厂；资源绑 Agent+Session；native service 用 digest/path locks；连接级状态

**所需支持。** 进程锁、内容摘要、连接协议、取消/超时语义

**验证（计划，未执行）。** 正向：两个 Agent 共享服务但互不释放句柄；不同构建同路径不能同时运行；最后连接退出服务。拒绝：第二个 provider 注册失败；路径冲突/重复捕获槽位拒绝。恢复：取消等待确认；进程失效使旧句柄失效；连接清理后服务退出。

**局限。** macOS replayd 行为来自特定版本观察，不能泛化为所有平台；共享服务/浏览器实现未在本分区执行；产品专属工具语义需 provider 自证。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-10-product-subagent-providers-in-shared-host.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-12-browser-use-provider-registration.md:1-53@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-cua-shared-native-helper.md:1-25@687f282e`

### rationale-architecture-3.arch3-M11 独占附件与可取消资源操作 {#rationale-architecture-3.arch3-M11}

**何时读。** 两个视图/Agent 操作同一外部资源；用户取消或超时；流式输出被中断；策略变化需要停旧工作。

**问题与历史原因。** 浏览器、桌面应用、沙箱进程等资源不能同时被两个 owner 操作；取消/超时若只返回 Promise，底层工作可能仍在运行，下一次操作会撞上半旧状态。

**必须满足的义务。**
- 同一 provider 内对附件资源做独占预约；外部已打开资源保留并复用，不重复启动
- 取消先停止单次请求并等待确认；不能仅结束 await/创建包装就认为恢复
- 超时占用有界槽位时，新请求明确 busy，不堆积
- 已交付前缀可终结，但不得伪造未交付内容
- 不确定输入不自动重放
- 策略变化立即取消受影响完整调用，等待取消结束后再按新策略执行

**责任角色。** 资源 provider；调用方/Agent；取消实现；策略观察者。

**步骤。**
1. 在 provider 内建立预约表/独占标记，按 Agent+Session 识别
2. 取消传播到嵌套工具/审批，返回明确 code 标明是否已 dispatch
3. 对不可中断的系统 RPC 保留单槽，busy 拒绝新请求而不是排队
4. 在流结束时只 finalize 已交付前缀，保留取消原因
5. 清理失败阻止资源复用；下一次程序等待清理 Promise
6. 把“请求失败/句柄失效/进程失效”分开报告

**完成信号。** 并发附件请求被串行/拒绝；取消后旧工作结束前新调用等待；流只输出已交付前缀。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：独占预约 + 取消确认 + 有界槽位 + 失败分类。实现线索：browser-use exclusive attachment、cooperative cancellation codes、cancelled stream prefix finalize、CUA CAPTURE_BUSY、PTC cleanup Promise。信任：资源 provider 负责真实状态；调用方不得假设取消即停止。

**失败处理。** 取消后工作可能仍在；清理失败可重试且阻止复用；busy 明确返回

**例外。** 只读操作可共享；外部拥有的资源不因清理关闭

**适用性。** 适用于外部应用自动化、浏览器、沙箱进程、流式 LLM 等有副作用且难中断的资源。

**与其他机制的关系。** M10 provider；M12 沙箱清理；M26 取消词表。

**迁移策略。** 先建立独占/取消确认，再暴露并发 API；把 busy 作为正常结果

**落地实现。** 预约表、取消 code、单 RPC 槽、流前缀 finalize、清理 Promise

**所需支持。** 可取消协议、超时、资源身份、失败分类

**验证（计划，未执行）。** 正向：并发附件请求被串行/拒绝；取消后旧工作结束前新调用等待；流只输出已交付前缀。拒绝：迟到的截图/结果被丢弃；清理失败时复用被拒绝。恢复：清理重试；进程失效后所有旧句柄不可用；不自动重放不确定输入。

**局限。** 不同类型资源的可取消性差异大，需 provider 自证；未执行真实并发/取消测试；策略变化与清理的时序需实现验证。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-19-cooperative-tool-cancellation.md:1-73@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-cancelled-stream-prefix-finalize.md:1-39@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-sandboxed-node-ptc-runtime.md:1-60@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-12-browser-use-provider-registration.md:1-53@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-ptc-owned-policy-cleanup.md:1-27@687f282e`

### rationale-architecture-3.arch3-M12 沙箱策略、启动严格性与生命周期清理 {#rationale-architecture-3.arch3-M12}

**何时读。** PTC/代码执行 runtime 启动；权限/文件策略变化；宿主或消费方需要严格输入校验；启动失败/取消/资源清理。

**问题与历史原因。** 沙箱限制在启动时应用，不能安全重配置；权限设置若等待进程清理，会把 PTC 生命周期泄漏给无关调用方；启动严格性若由框架统一决定，会让不需要严格校验的消费者被迫付出成本。

**必须满足的义务。**
- 沙箱限制在启动时应用；需要新策略时释放旧环境，不能原地重配置
- 权限设置同步提交，只保证策略已记录，不保证旧工作已停止
- PTC 观察已提交模式变化，立即取消受影响完整调用，后续调用等待清理完成并使用最新策略
- Node provider 立即失效受影响进程（含空闲），保留清理 Promise；失败可重试且阻止复用
- 未变化模式保留环境
- 启动严格性由消费者拥有：需要严格的 Host 等待本地注册，普通消费者可用有限 fallback
- 启动失败/取消要回滚已创建资源，忙碌附件跳过该次激活

**责任角色。** PTC runtime/provider；权限服务；消费者/组合根；清理所有者。

**步骤。**
1. 在启动时解析并应用沙箱策略，记录策略身份
2. 权限 setter 同步写入并返回；不由它 await 清理
3. 观察 committed 变化，取消调用/审批/嵌套工具；后续调用等待清理
4. 失效进程而不是重用；保留 cleanup Promise 供重试
5. 消费者声明严格性；Host 在服务调用前等待注册；fallback 只覆盖支持的子集
6. 卸载时移除观察者并 await 自己拥有的工作

**完成信号。** 权限设置立即返回；旧操作最终停止；后续调用用新策略。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：启动期策略 + 同步提交/异步清理 + 消费方严格性。实现线索：persistent PTC sandbox、PtcRuntime cleanup Promise、policy observer、consumer-owned startup strictness、fallback。信任：PTC 负责执行/销毁；权限服务只记录；消费者选择严格性。

**失败处理。** 清理失败不回滚已记录策略；后续调用等待/拒绝复用；严格 descriptor 撤销后拒绝调用而不是降级

**例外。** 无后续调用时仍立即开始取消；空闲环境也要失效

**适用性。** 适用于代码执行沙箱、持久进程池、需要策略热切换的系统；普通无沙箱工具可省略。

**与其他机制的关系。** M11 取消确认；M05 配置提交；M21 元数据严格性。

**迁移策略。** 先分离“记录策略”和“停止旧工作”，再把严格性移到消费者

**落地实现。** 同步 permission setter；PTC observer + cleanup Promise；严格/有限 fallback 两条路径

**所需支持。** 启动期策略、进程失效、cleanup 重试、消费者注册协议

**验证（计划，未执行）。** 正向：权限设置立即返回；旧操作最终停止；后续调用用新策略；严格消费者等待注册；普通消费者用 fallback。拒绝：清理失败时进程复用被拒绝；严格 descriptor 撤销后调用被拒绝。恢复：清理重试；启动失败回滚；取消不留下半创建资源。

**局限。** 超时设计被明确 deferred；未执行真实沙箱/进程清理测试；严格性与 fallback 的具体 API 仍需实现验证。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-consumer-owned-startup-strictness.md:1-41@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-11-sandboxed-node-ptc-runtime.md:1-60@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-ptc-owned-policy-cleanup.md:1-27@687f282e`

### rationale-architecture-3.arch3-M14 启动时一次性清理本地 Spill 文件 {#rationale-architecture-3.arch3-M14}

**何时读。** 应用启动/重启；本地 spill 目录增长；崩溃后残留文件。

**问题与历史原因。** 工具输出 spill 文件会跨会话累积；在启动时清理可以避免长期磁盘增长，但清理逻辑本身不能阻塞启动或误删活跃文件。

**必须满足的义务。**
- 清理是一次性的启动步骤，不是每请求扫描
- 只清理可证明属于旧一代/无活跃引用的文件
- 清理失败不阻塞启动，记录可诊断信息
- 活跃会话/工具的 spill 文件必须保留
- 清理策略与存储根解析一致

**责任角色。** 启动装配；spill 文件所有者；清理任务。

**步骤。**
1. 在启动时定位 spill 根（使用统一 home 解析器）
2. 根据代际/年龄/引用标记选择候选，避免删除当前进程刚写入的文件
3. 执行删除并统计；失败逐项记录
4. 把清理结果暴露到日志/诊断，不向普通用户弹错

**完成信号。** 重启后旧 spill 被清理，活跃文件保留。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：启动钩子 + 保守候选选择 + 失败隔离。实现线索：local spill startup cleanup；与 Session/工具输出所有者共享目录约定。信任：spill 所有者定义可删除条件；启动器执行。

**失败处理。** 删除失败保留文件并记录；不影响应用 ready

**例外。** 无法判断归属的文件不删除；测试/调试可关闭清理

**适用性。** 适用于会产生临时大文件、需要跨重启清理的本地工具；无本地磁盘/临时目录的系统不适用。

**与其他机制的关系。** M04 存储根；M13 启动流程；M27 读取/物化成本。

**迁移策略。** 先建立目录与归属约定，再加启动清理；先在测试环境观察候选

**落地实现。** 启动钩子扫描 spill 根；按代际/引用筛选；逐项删除与日志

**所需支持。** 统一临时目录、代际/引用标记、失败隔离

**验证（计划，未执行）。** 正向：重启后旧 spill 被清理，活跃文件保留。拒绝：无法归属的文件不被删除；清理失败不阻塞启动。恢复：残留文件下次启动再清理；诊断可定位。

**局限。** 本分区只读决策记录，未执行清理测试；具体目录/代际规则需代码确认；多进程同时启动的竞争未在本分区验证。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-17-local-spill-startup-cleanup.md:1-38@687f282e`

### rationale-architecture-3.arch3-M15 等待式 Agent 初始化与上下文注入边界 {#rationale-architecture-3.arch3-M15}

**何时读。** 创建/恢复 Agent 或子 Agent；在轮次前注入上下文/提醒；父子/相邻 Agent 通信；启动/恢复失败。

**问题与历史原因。** Agent 创建/恢复如果在初始化完成前发布，会让调用方看到半可用对象；上下文注入如果借用 turn 执行，会把“准备上下文”和“执行一次模型轮次”混为一谈；相邻 Agent 的消息又需要统一入口。

**必须满足的义务。**
- 创建/恢复在发布前完成可失败准备；失败回滚资源并拒绝发布
- 调用方必须能 await 初始化，不能靠“稍后可用”
- 上下文注入与 turn 执行分离；注入有自己的生命周期/触发条件，不伪造模型轮次
- 标准 send_message 定义可见时，父子 Agent 共享同一定义与返回指导，不新增平行 API；preset 缺省、历史 descriptor 过滤或 scoped 替换时不注入标准调用指令
- inject() 只提交不唤醒的 next-step inbox 变更；领取后到达的注入可能错过正在定稿的请求，必须影响该请求的上下文应由 PreStepDecision.messages 返回；工具 additionalContexts 排在对应完整有序结果之后
- agent/created 监听器串行 await；初始化成功前 driver 不启动，失败跳过后续监听器并保持创建错误可见，不能 detached 初始化

**责任角色。** Agent 创建者/父 Agent；Session controller；注入器；消息工具。

**步骤。**
1. 把创建/恢复拆成准备与发布两阶段，准备失败清理资源
2. 发布后返回可用句柄；调用方 await 就绪
3. 为注入定义 next-step 入队、原子领取与 pre-step 准入；不保留 prompt-prefix 或 prompt envelope
4. 标准定义可见时相邻 Agent 统一走 send_message；只允许授权的父子相邻边，不根据同名 scoped 工具猜测标准身份
5. 移除借注入创建的零步 turn；空闲注入待 followup()/steer() 唤醒，取消/销毁可先丢弃队列项但不抹去持久队列历史
6. 用启动失败、取消、重入测试覆盖

**完成信号。** await 后首个请求已有初始化贡献；空闲 inject() 不创建 turn，合法唤醒且进入 pre-step 后才追加消息；标准工具可见时父子共用 send_message，零次或多次合法调用均不因次数被拒绝。这里只定义可观察验收条件，不等于已经执行验证。

**执行方式与信任。** 模式：两阶段发布 + await + 独立注入生命周期 + 单一消息入口。实现线索：awaited agent creation、separate context injection from turn execution、adjacent-agent steer send_message、session preparation。信任：创建者负责发布；注入器负责自己的生命周期；消息工具是唯一入口。

**失败处理。** 准备失败不发布；pre-step 拒绝或抛错时已领取的注入/steering/prompt 不恢复，也不追加返回批次；领取后新到消息仍待处理；发送失败返回明确错误

**例外。** preset 可不含标准消息工具、历史 descriptor 过滤可移除它、scoped 替换可有不同语义；这些情形不附标准调用指令。初始化监听器不得等待自身 idle 或其所有者 disposal，销毁须取消并等待初始化释放资源。

**适用性。** 适用于有异步 Agent/子 Agent 初始化、上下文注入和 Agent 间通信的系统；简单单 Agent 可简化。

**与其他机制的关系。** M01 turn 边界；M16 Session 生命周期；M24 subagent/provider。

**迁移策略。** 先建立 await 发布与失败回滚，再迁移调用方；把注入从轮次执行中拆出

**落地实现。** create/restore 两阶段；不唤醒的 next-step 注入与 pre-step 准入；send_message 统一工具

**所需支持。** 可等待初始化、资源回滚、注入协议、消息权限

**验证（计划，未执行）。** 正向：await 后首个请求已有初始化贡献；空闲 inject() 不创建 turn，合法唤醒并进入 pre-step 后才追加消息；标准工具可见时零次或多次合法 send_message 均不因次数被拒绝。拒绝：准备失败不发布或唤醒队列；兄弟、自身、非相邻祖先、过期 Agent、未知目标和 one-shot child 路由被拒绝。恢复：初始化失败清理资源；pre-step 领取 A 后注入 B，再拒绝该 pre-step，A 不恢复且不追加消息，B 保持待处理并可在下一次合法进入时消费；空闲项可被取消/销毁丢弃，但持久队列历史保留。

**局限。** session preparation 记录含 Superseded 段落，需区分历史与当前；未执行真实创建/注入测试；相邻 Agent 权限模型需其他域确认。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-05-session-preparation.md:1-46@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-24-separate-context-injection-from-turn-execution.md:1-74@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-27-adjacent-agent-steer-messaging.md:1-82@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-awaited-agent-creation.md:1-31@687f282e`

### rationale-architecture-3.arch3-M26 协作式取消与已交付前缀终结 {#rationale-architecture-3.arch3-M26}

**何时读。** 用户取消/超时；流式响应中断；工具注册表拒绝调用；Remote 调用失败。

**问题与历史原因。** 工具/流被取消时，调用方需要知道“是否已 dispatch、是否有副作用、已交付哪些内容”，否则会把取消当成失败重试，或把未交付内容伪装成成功。

**必须满足的义务。**
- 取消在注册表边界协作传播，不强制杀线程
- 取消 code 记录是否已 dispatch，区分 pre-abort 与已开始
- 已开始工作仍要到 quiescence，不能提前释放资源
- 流取消只 finalize 已交付前缀，保留取消原因，不补造内容
- Remote 失败使用统一词表，按 code 判别而非文本
- 不确定输入不自动重放

**责任角色。** 工具注册表/工具；流实现；Remote Gateway；调用方。

**步骤。**
1. 在调用入口检查 pre-abort，直接短路
2. dispatch 后设置取消标记并传播到嵌套工具
3. 等待已开始工作结束；返回 code/部分结果
4. 流结束时 finalize 已交付前缀
5. 把失败映射到固定 code 词表
6. 测试 pre-abort/中途取消/已交付前缀

**完成信号。** pre-abort 不 dispatch；中途取消等待 quiescence；流只输出已交付前缀。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：协作取消 + code 词表 + 前缀终结。实现线索：cooperative tool cancellation、cancelled stream prefix finalize、ctx.remote failure vocabulary。信任：工具/流负责真实状态；Gateway 只传播。

**失败处理。** 取消不等于回滚；已 dispatch 的副作用可能保留；失败 code 明确

**例外。** 不可取消工具需声明并等待完成

**适用性。** 适用于工具有副作用、流式输出和远程调用的 Agent 系统；纯本地快速调用可简化。

**与其他机制的关系。** M11 独占资源；M12 清理；M21 Remote。

**迁移策略。** 先统一 code/前缀语义，再迁移调用方重试逻辑

**落地实现。** 取消传播；dispatch 标记；流 finalize；失败词表

**所需支持。** 可取消工具协议、流生命周期、错误码

**验证（计划，未执行）。** 正向：pre-abort 不 dispatch；中途取消等待 quiescence；流只输出已交付前缀。拒绝：未 dispatch 的副作用不被伪造；未知 code 不被文本猜测。恢复：已开始工作完成/清理；不自动重放不确定输入。

**局限。** 未执行取消/流测试；不同工具的可取消性不同；已 dispatch 的副作用无法由取消回滚。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-19-cooperative-tool-cancellation.md:1-73@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-cancelled-stream-prefix-finalize.md:1-39@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-28-ctx-remote-failure-vocabulary.md:1-88@687f282e`

## D 启动、平台、传输与可观测性

### rationale-architecture-3.arch3-M13 单一应用启动与平台启动同构 {#rationale-architecture-3.arch3-M13}

**何时读。** 新增运行平台（Web/Desktop/Preview/源码启动）；发布 profile 或可选 bundle；调整 dist chunk/模块布局；源文件启动。

**问题与历史原因。** 如果 CLI、Web、桌面、Preview 各自实现 profile 启动与模块分发，就会出现同一配置在不同平台行为不一致、打包配置过期、可选插件不可见和镜像膨胀。

**必须满足的义务。**
- 普通启动只保留一个 launcher/application profile，平台差异通过组合而非分叉实现
- 源码/产物启动同构：同一 app-boot loadProfile/readProfilePatches/profileContext 路径
- 打包产物从与 UI 相同的 app-boot 表读取 bundle/optional 清单，避免 dump 过期
- 镜像记录 profile 与安装锚点，不携带已组合配置；平台差异用 home patch 显式声明
- 平台缺少模块时提供最小接口/降级，而不是让所有调用方分支
- lazy chunk 独立归档，按需拉取；不设任意大小阈值
- PR 预览部署使用独立环境/URL，不与生产共享凭据或可变数据

**责任角色。** launcher/app-boot；packer/平台适配器；profile 作者；发布者。

**步骤。**
1. 把启动链路的公共部分放到 app-boot，平台只提供环境快照/加载器
2. packer 从 app-boot 读取 roster 与 optional bundles，并记录安装锚点
3. Worker/桌面用同一 loadProfile 组合模板与 patch；平台差异写成显式 patch
4. 为缺失模块提供有边界的 stub，错误码可识别；只对特定错误降级
5. 把懒加载资源从基础镜像拆出，校验登记路径/大小，异步读取等待归档

**完成信号。** 无 bundle 时 Preview 与 Web 仅差显式平台覆盖；开启 optional bundle 不跳补丁；基础镜像不含懒 chunk。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：共享启动路径 + 清单同源 + 显式平台补丁 + 降级码。实现线索：apps/cli/app-boot、single dsh launcher、webworker-preview-profile-parity、PLATFORM_ENTRY_CONFIG、Inspector degradation。信任：app-boot 是组合真源；平台适配器不得复制配置逻辑。

**失败处理。** 镜像缺少 profile/安装清单校验失败；非指定错误不降级；懒归档拉取失败只影响等待读取

**例外。** Preview 明确保留的差异（无 pnpm、无进程代理、日志/参数）必须列入文档

**适用性。** 适用于多平台共享同一应用组合的系统；单平台可直接启动，但仍应把 platform override 限定在组合层。

**与其他机制的关系。** M04 的 root；M14 启动清理；M29 VFS/懒加载。原记录的 `M44 镜像` 在本分区没有对应条目，已移除，未从「镜像」一词推断跨域目标。

**迁移策略。** 先统一 app-boot 路径，再迁移各平台；把 pack-time dump 替换为运行时组合

**落地实现。** packer roster 同源；Worker 复现 runProfile；平台差异 home patch；最小 internal module 接口

**所需支持。** app-boot 导出、平台环境快照、镜像 manifest、懒归档协议

**验证（计划，未执行）。** 正向：无 bundle 时 Preview 与 Web 仅差显式平台覆盖；开启 optional bundle 不跳补丁；基础镜像不含懒 chunk。拒绝：缺 profile/安装清单的镜像被拒绝；未发布 chunk/错误归档被拒绝。恢复：特定平台码降级 Inspector；归档失败可重试；旧组合镜像需重打包。

**局限。** Preview 产物/体积为实测值，未在本分区运行；桌面/CLI 的当前启动细节分散在其他域；最小接口 stub 只覆盖实测调用方，未来调用方可能显式失败。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-28-dsh-native-typescript-source-launch.md:1-48@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-06-web-shell-dist-chunk-layout.md:1-51@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-20-preview-cloudflare-pages-deploy.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-22-single-dsh-application-launcher.md:1-100@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-14-webworker-preview-profile-parity.md:1-105@687f282e`

### rationale-architecture-3.arch3-M21 类型化远程调用与统一元数据 {#rationale-architecture-3.arch3-M21}

**何时读。** 新增 Remote 方法/端点；离线 CLI/MCP 需要元数据；Consumer 需要严格输入校验；源码/产物两种启动方式。

**问题与历史原因。** CLI 帮助、MCP 发现、原生工具和浏览器/Node 调用都需要方法说明、具名输入解析器、JSON Schema 与结果类型，但不应运行时分析 TypeScript、激活 Host Service 或让每个消费方手写 schema。

**必须满足的义务。**
- 同一 compiler-independent 模型生成方法 spec；Host/Client 各自 Registry，不跨进程共享对象身份
- 普通 ESM 产物可离线提供元数据；独立消费方可直接读 ./remote，无需 Registry/Connection
- 严格性由消费者选择：normal codec 接受/剥离未知字段，strict 递归拒绝未声明字段
- 具名参数 envelope 拒绝多余参数；JSON/字典键保持开放
- Registry 保留原子注册、通知、tombstone、fiber disposal；不新增元数据 RPC/跨进程同步
- 生成物为每个端点一个静态 spec；索引/视图/解析器惰性缓存
- 已观察到的严格 descriptor 撤销后拒绝调用，不降级 fallback

**责任角色。** Typert emitter/generator；protocol/Registry；Remote Gateway；CLI/MCP/native consumer。

**步骤。**
1. 从类型模型生成 spec：service、receiver、有序参数、result、stream/scope/uplink/cancel/docs
2. 为每个参数生成 normal+strict codec；不要把逐方法策略放进 analyzer
3. 用 factory 返回惰性 info 实例；首次读取构建索引，methods[endpoint] 别名同一 descriptor
4. 消费方选择 input({strict}) 并解析；Host dispatch 保持普通 codec
5. 离线消费者注册元数据或直接读 methods；live 消费者 mount
6. 严格启动预构建并加载；fallback 仅覆盖支持子集

**完成信号。** 每端点一 spec；索引/视图惰性缓存；普通/严格解析符合预期；离线读取无需连接。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：生成 spec + Registry + consumer-owned policy + readiness。实现线索：TypertRemoteMethodSpec、createTypertRemoteInfo、isTypertRemoteMethod、input({strict})、ctx.typert.register/remotes.register/remote.$mount。信任：生成器/Registry 提供定义；消费方选择策略；Host 负责 readiness。

**失败处理。** 缺文档/可选投影不阻止生成；选中的工具在缺少要求时拒绝；严格 descriptor 撤销拒绝调用

**例外。** 独立消费者无需 Cordis；有限 fallback 不提供被擦除字段/约束/文档

**适用性。** 适用于多语言面、离线 CLI/MCP、需要类型化远程调用的插件系统；单一进程内 RPC 可省略生成元数据。

**与其他机制的关系。** M22 二进制；M12 严格启动；M08 能力缝。

**迁移策略。** 先完成 ordinary-artifact 生成/注册，再迁移下游 consumer；删除 source-definition 交付

**落地实现。** 静态 spec；normal/strict codec；Registry；离线/在线两模式；严格/fallback 测试

**所需支持。** 类型提取器、Zod 运行时、Cordis Context、下游包迁移

**验证（计划，未执行）。** 正向：每端点一 spec；索引/视图惰性缓存；普通/严格解析符合预期；离线读取无需连接。拒绝：额外具名参数/未声明字段（strict）被拒绝；已撤销 descriptor 不 fallback。恢复：缺可选投影仍可解析输出；下游未迁移时明确范围。

**局限。** unified-typert 仍为 proposed，下游迁移未完成；生成元数据不等于每个操作已迁移；未执行生成/离线 CLI/MCP 测试。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-02-typert-remote-method-calls.md:1-531@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-28-ctx-remote-failure-vocabulary.md:1-88@687f282e`
- `deepseek-harness/.agents/notes/proposed/architecture/2026-09-20-unified-typert-remote-metadata.md:1-191@687f282e`

### rationale-architecture-3.arch3-M22 二进制结果的类型定向传输 {#rationale-architecture-3.arch3-M22}

**何时读。** Remote 返回文件/图片/字节；需要 range/完整读取；HTTP 断连/取消；嵌套/多附件结果。

**问题与历史原因。** 文档预览需要原生字节；base64 增加约三分之一载荷并要求浏览器解码；独立文件 Fetch 路由又会复制 Gateway 的分发、Session 查找和错误处理。

**必须满足的义务。**
- 沿用既有 Remote 分发/生命周期，不新建 feature-specific 路由
- 一个 readBytes Remote 用 options 对象独立选择 range/baseFile，避免正交选项分裂成多个方法名
- 生成 codec 递归识别 Uint8Array，encode/decode 不逐字节复制/冻结
- Gateway 返回 JSON 元数据 + result-relative 附件；Connection 负责 FormData 与 RPC envelope，不检查业务值
- Client 恢复 ArrayBuffer/Uint8Array 视图；输出解析仍必需
- 断连时中止请求信号并排空已物化块，避免 multipart 生产竞态
- 二进制参数/事件/流不支持时明确拒绝；递归类型要求无环

**责任角色。** Remote/Gateway/Connection；Typert codec；workspace file service；Client。

**步骤。**
1. 在现有 Remote 上增加 readBytes options；range/baseFile 正交
2. 生成递归结果 codec；声明 Client 字节类型
3. Gateway 执行 encoder，保留 strict JSON，返回附件表
4. Connection 组装 FormData；按路径关联附件
5. Client 读取 Blob 并校验
6. 断连/取消测试覆盖 drain 与 retry

**完成信号。** 完整/分段读取往返；嵌套多附件；浏览器 PNG/PDF 预览。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：类型生成 + 附件协议 + 平台 FormData。实现线索：readBytes、Typert recursive Uint8Array codec、attachment table、FormData、ERR_INVALID_STATE drain。信任：Gateway 负责分发；codec 负责类型；Connection 不解释业务。

**失败处理。** 畸形 multipart/取消拒绝；断连不写 socket；失败读取可重试

**例外。** 不承诺流式/零拷贝；Office PDF 仍走 base64 的有界解码

**适用性。** 适用于需要原生字节但已有统一 RPC 的系统；纯文本/小二进制可继续 JSON。

**与其他机制的关系。** M21 Typert；M34 文件服务；M13 传输。

**迁移策略。** 先在单一读取 API 上支持递归字节，再迁移插件调用方

**落地实现。** options 对象；递归 codec；JSON+附件表；Client 视图

**所需支持。** FormData 运行时、流/取消、结果路径映射

**验证（计划，未执行）。** 正向：完整/分段读取往返；嵌套多附件；浏览器 PNG/PDF 预览。拒绝：二进制参数/事件/流被拒绝；畸形 multipart 被拒绝。恢复：断连 drain；失败读取重试；无 Session 格式变更。

**局限。** 未执行传输/浏览器测试；字节范围与 maxFileBytes 的边界需实现确认；附件 digest/安全校验不在本记录范围。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-workspace-file-binary-transfer.md:1-31@687f282e`

### rationale-architecture-3.arch3-M23 事件投递、路由与文档相对寻址 {#rationale-architecture-3.arch3-M23}

**何时读。** 新增浏览器下行/事件流；部署在剥离前缀的代理后；多标签页/重连；增加 Remote 事件类型。

**问题与历史原因。** 浏览器下行、Remote 事件和挂载路径若各自拼接绝对 URL/允许列表，会在代理挂载、重连或多标签页下丢失事件或路由到错误源站。

**必须满足的义务。**
- carrier 按历史与当前协议所有者区分：08-04 的 `/api/events.mux` 与 `/api/events.host` 双物理通道是迁移历史；08-10 的 Remote 事件使用 Gateway 已有 `/api/remote.mux` 上独立的 `$events` 逻辑流，结果经 HTTP unary `$events/result` 返回，不新增第三条物理连接。
- 服务端路由键保持绝对路径名，浏览器引用相对 served document
- index 只放一个 <base href="./">，先于启动 manifest/插件行；不推断代理前缀
- 源站根/挂载共用一份 bundle；认证 URL 保留 authority/mount，重定向 ./
- Remote $on 的允许列表只有一个声明，Host/Client 都读它；未选事件不能被类型化订阅，结构合法但无订阅者的未知运行时 emit 被丢弃而非抛错
- 普通通知是 best-effort 且不重放；只有原 Host invocation 仍 pending 的 scoped waterfall 可在重连后重放。可靠状态须有 owner 提供的 query、cursor 或 opening baseline，不能把 `$on` 当可靠日志。
- allowlist 的 emit/waterfall 模式与 owner 的同一 `Events` 声明匹配；只共享 Client-safe `./types`，不另建影子类型表；只允许 unscoped void 通知或顶层 Agent scope、带同结果 `next()` 的 Promise waterfall。
- 每个 Client 流有独立 listener set 与 queue；断开一个不能消费或撤回另一个的事件；非 JSON 参数入队前失败，后续合法事件仍可投递。
- 先同步装好增量 listener，再发带 clientId/host.home 的 opening ready；其后才能发布 connected 并读 baseline。订阅归 calling fiber，同一函数重复注册可独立释放。

**责任角色。** Web shell/Gateway；Remote 事件实现；代理/部署者；Client。

**步骤。**
1. 在 index 注入唯一 base，冻结入口目录
2. 浏览器用相对 ROUTE，服务端用绝对 PATH；共享常量在边界剥离前导斜杠
3. Remote 事件声明 allowlist 并双侧校验
4. 打开 Gateway 所有的 `$events` 逻辑流，ready 后建立代际；保留每 Client 独立队列，不把应用事件 allowlist 泛化为所有 Remote stream 的限制。
5. 用真实浏览器经 prefix-stripping proxy 测试 pushState/fetch/WS

**完成信号。** 挂载下 fetch/WS/pushState 均正常；一个 bundle 服务根与挂载；事件只投递允许类型。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：文档 base + 相对引用 + 双侧 allowlist。实现线索：`<base href="./">`、`*_ROUTE/*_PATH`、authenticatedUrl、单一 `$on` allowlist/type projection、Gateway `$events` 与 per-Client source/queue。信任：document 是挂载点唯一来源；Gateway 拥有 carrier/代际，API Remotes 拥有应用事件选择。

**失败处理。** 未选事件/错误 mode/不支持 scope 的类型负控失败；非 JSON 参数在入队前抛错但不毒化后续队列；未知但结构合法的无订阅者 emit 丢弃，普通 listener 失败隔离。物理断连以 `RemoteStreamCarrierError` 结束逻辑流；Host stream 错误、意外正常结束、非 ready 开场和畸形 item 也结束当前代际，Connection 退避重开。深层直接重载在支持入口之外。

**例外。** Desktop 用自己的 document owner/streamBaseUrl；裸挂载需代理补斜杠

**适用性。** 适用于可被挂载到子路径的 Web 应用与 Remote 事件系统；固定根路径部署可简化，但仍建议相对路由。

**与其他机制的关系。** M21 Remote；M13 启动；M31 认证。

**迁移策略。** 先修 document base 与路由常量，再迁移事件 allowlist

**落地实现。** 单 base；相对 browser/绝对 server；共享常量；allowlist；真实代理 e2e

**所需支持。** 代理配置、认证 URL、WebSocket mux

**验证（计划，未执行）。** 正向：挂载下 fetch/WS/pushState 正常且共用 bundle；两个 Client 各获自己的事件，断开 A 不影响 B；ready 晚于 listener 安装，connected/baseline 晚于 ready。拒绝：类型负控拒绝未选事件/错误 mode/非 Agent waterfall；非 JSON 参数入队前失败；合法未知 emit 丢弃而不抛错；错误开场、畸形 item、Host stream 错误结束代际；不一致 base 被静态门禁拒绝。恢复：分别注入物理断连、Host stream 错误和意外结束，观察代际撤回/退避/新 ready；普通通知不重放，只有仍 pending 的 scoped waterfall 可重放，可靠业务自供 query/cursor/baseline；非法入队后合法事件仍可投递；代理规范化斜杠。

**局限。** 未执行浏览器/代理测试；Desktop 文档所有者差异需实现确认；深层直接加载不是支持入口。08-04 的双物理通道是历史而非固定提交当前 Remote 事件实现的要求；应用事件 allowlist 不约束所有 Gateway Remote stream。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-04-websocket-downlink-carrier.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-10-remote-event-delivery.md:1-202@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-web-document-relative-app-routes.md:1-47@687f282e`

### rationale-architecture-3.arch3-M29 VFS 监听上下文、平台约束与懒加载归档 {#rationale-architecture-3.arch3-M29}

**何时读。** 在 Worker/VFS 中运行插件；实现文件监听/HMR；打包资源/搜索工具；平台缺少 worker_threads/模块。

**问题与历史原因。** Worker/沙箱中的文件监听、路径约束和打包工具与真实 Node 行为不同；如果 watcher 回调在写入方上下文运行，HMR 会把配置写入误判为嵌套事务；懒加载资源若随基础镜像下载，会拖慢启动。

**必须满足的义务。**
- watcher 回调在创建 watcher 的异步上下文运行，而不是写入方上下文
- VFS 变更源与 watcher 明确；不支持的同步读取显式 ERR_DSH_VFS_DEFERRED
- 平台缺少模块时提供最小接口或特定错误码降级，不让所有调用方分支
- 懒加载 chunk 独立归档，登记路径/大小，异步读取等待；同步读取拒绝
- 搜索工具使用打包二进制/受控 spawn，不依赖系统 PATH

**责任角色。** VFS/Worker runtime；HMR；packer；搜索工具。

**步骤。**
1. 为 watcher 保存创建上下文并按 Node 语义派发
2. 登记 deferArchive 文件；异步 fs 接口等待归档，校验路径/大小
3. 对同步读写/重命名在到达前拒绝；删除/seed 更新登记
4. HMR 配置 watcher 保持在写入事务外
5. 用 fs-watch-context/lazy-archive 测试覆盖

**完成信号。** HMR 配置写入不触发嵌套事务；异步读取等待归档；同步读取明确拒绝；删除/seed 生效。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：上下文隔离 + 延迟登记 + 显式拒绝。实现线索：fs.watch context、MemoryVfs.deferArchive、ERR_DSH_VFS_DEFERRED、lazy archives、packaged ripgrep。信任：Worker runtime 负责平台语义；packer 负责归档。

**失败处理。** 未到达同步读取拒绝；归档失败只影响等待读取并可重试

**例外。** 基础镜像中的 eager chunk 可直接读取；不承诺 digest 校验

**适用性。** 适用于浏览器内 Node/Worker 预览、沙箱 VFS 和按需资源分发的系统；普通 Node 进程不需要。

**与其他机制的关系。** M13 平台启动；M27 读取；M28 Inspector。

**迁移策略。** 先修 watcher 上下文与延迟读取，再拆懒归档

**落地实现。** watcher 上下文；deferArchive；异步等待；归档 manifest；打包搜索

**所需支持。** VFS API、归档格式、Worker 平台 stub

**验证（计划，未执行）。** 正向：HMR 配置写入不触发嵌套事务；异步读取等待归档；同步读取明确拒绝；删除/seed 生效。拒绝：未发布 chunk/畸形归档拒绝；未到达写入拒绝。恢复：归档失败重试；删除后到达归档不改路径。

**局限。** 未执行 Worker/打包测试；平台 stub 只覆盖实测调用方；digest 未校验是已知限制。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-01-packaged-ripgrep-search.md:1-39@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-23-webworker-vfs-watch-and-landlock.md:1-81@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-14-webworker-preview-profile-parity.md:1-105@687f282e`

### rationale-architecture-3.arch3-M30 原生致命恢复与桌面安装包页面 {#rationale-architecture-3.arch3-M30}

**何时读。** Electron 主窗口/文档/preload/renderer/Web 初始化/后端失败；重复启动失败报告；安装/首次运行。

**问题与历史原因。** 恢复 UI 若依赖渲染器/preload，而它们正是故障源，就无法启动；多个启动失败报告会掩盖原始诊断。桌面安装包还需要在无运行时的情况下展示许可/说明页面。

**必须满足的义务。**
- 每个应用进程一个原生致命对话框；首次报告取得展示权，后续只记日志
- 崩溃报告文件保留完整诊断；对话框有界（末尾 8 行/1200 UTF-16）并给出报告路径
- 动作限于退出/重启/禁用第三方 bundle 后重启；不自动重置配置/循环重启
- sanitizeProfile 在 Host 关闭后、profile 锁内运行；重命名 patch 为唯一备份，不解析/删除安装文件
- 普通请求保留局部错误处理；预期取消/关闭不进入恢复
- 安装包页面不依赖应用运行时

**责任角色。** Electron main；app-boot/sanitizeProfile；安装器；用户。

**步骤。**
1. 捕获明确致命信号并去重
2. 写崩溃报告；构造有界对话框
3. 用户选择动作；Host 关闭后执行 sanitize
4. 保留 home patch；唯一备份名
5. 安装器静态页面/许可与版本信息
6. 测试致命信号、去重、关闭顺序、locale

**完成信号。** 首次报告展示，后续仅日志；对话框有界；禁用 bundle 后重启成功。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：原生对话框 + 首次去重 + 有界诊断 + 显式恢复。实现线索：desktop-native-fatal-recovery、sanitizeProfile、crash report file、installer pages。信任：main 进程拥有恢复；渲染器不参与。

**失败处理。** 主进程被杀/静默挂起无法报告；home patch 损坏仍需手工修复

**例外。** 备份不自动清理；无效 profile JSON 可能阻止禁用插件

**适用性。** 适用于 Electron/桌面应用；Web-only 可用普通错误页，但仍需诊断去重。

**与其他机制的关系。** M05 profile 锁；M13 启动；M35 安装/发布。

**迁移策略。** 先把致命路径集中到 main，再迁移恢复动作

**落地实现。** 单对话框；崩溃报告；sanitizeProfile；安装器静态页

**所需支持。** main 进程信号、profile 锁、安装器构建

**验证（计划，未执行）。** 正向：首次报告展示，后续仅日志；对话框有界；禁用 bundle 后重启成功。拒绝：预期取消/关闭不进入恢复；无效动作被拒绝。恢复：唯一备份保留原始字节；失败单独展示。

**局限。** 未执行 Electron/安装器测试；主进程被杀/静默挂起是已知盲区；home patch 仍需手工修复。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-10-windows-native-installer-pages.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-desktop-native-fatal-recovery.md:1-29@687f282e`

### rationale-architecture-3.arch3-M40 显式反馈遥测与请求扩展字段 {#rationale-architecture-3.arch3-M40}

**何时读。** 新增遥测/反馈上传；请求需要关联 Session/插件包；显示 token/上下文占用；插件包/实验功能。

**问题与历史原因。** 默认上传日志/反馈会侵犯隐私并放大数据量；请求中缺少 Session/插件包身份又会让日志难以关联；token 用量若伪装精确会误导容量决策。

**必须满足的义务。**
- 遥测默认不上传；仅显式反馈触发，并有明确范围/大小上限
- 上传内容遵循用户可见说明与同意，不夹带隐式数据
- 请求扩展字段增量添加（如 session log/plugin package），保持旧读取方兼容
- token/占用是投影/近似值，UI 标注而非精确承诺
- 插件包身份/实验标记随请求传递，便于归因

**责任角色。** 遥测/反馈服务；LLM adapter；UI。

**步骤。**
1. 定义显式触发与上传内容
2. 为日志/插件包增加增量请求字段
3. 在 UI 标注近似值/来源
4. 限制上传大小/重试
5. 测试无同意不上传、字段兼容

**完成信号。** 无显式反馈不上传；旧读取方忽略新字段；UI 标注近似。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：opt-in + 增量 schema + 标注。实现线索：nonofficial feedback OTEL、session-log/plugin-package request extensions、projected token usage。信任：用户触发上传；adapter 传递字段；UI 标注近似。

**失败处理。** 上传失败不影响主流程；字段缺失兼容

**例外。** 管理员可配置遥测，但仍需透明

**适用性。** 适用于需要反馈/日志归因的 LLM 产品；无遥测的小工具可省略。

**与其他机制的关系。** M24 上下文；M35 插件身份；M27 读取。

**迁移策略。** 先做 opt-in 上传与增量字段，再迁移日志/UI

**落地实现。** 显式反馈；请求扩展；近似标注

**所需支持。** 同意流程、上传限制、schema 版本

**验证（计划，未执行）。** 正向：无显式反馈不上传；旧读取方忽略新字段；UI 标注近似。拒绝：未同意/超限上传被拒绝。恢复：上传失败不阻塞；字段缺失回退。

**局限。** 本分区未执行遥测/隐私审计；上传范围/合规需产品确认；近似 token 的误差需测量。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-projected-token-usage-and-request-context.md:1-61@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-nonofficial-feedback-otel.md:1-33@687f282e`

## E 客户端状态、UI 不变量与重构纪律

### rationale-architecture-3.arch3-M16 Client Session 引用、代际与空白写锁 {#rationale-architecture-3.arch3-M16}

**何时读。** 打开/切换/关闭 Session 视图；并发异步操作持有 Session；同名 Session 重建/fork/replace；两个 Host 共享存储并打开 Workspace。

**问题与历史原因。** Session 目录成员关系不等于仍在使用；同一 Session id 可能对应不同 Client 代际；借用 binding 无法保护异步工作。空白 Session 还可能在创建检查点后持有写锁，两个 Host 会选中同一个。

**必须满足的义务。**
- 目录成员、live generation、view 与异步操作分开建模
- SessionReference 表示一次使用：同步 acquire、显式 release、ready 表示共享历史打开；借用 binding 不得超出 owner
- Sources 是本地所有权计数，不是可见性/权限；current 仅是 mainView 正计数
- release 最后一个引用才撤下代际与清理；旧清理不得移除替代者
- Provider 子树只消费自己的 binding，不读主引用/全局选择
- 空白 Session 复用必须先取得 writer，再打开历史；冲突则新建，不能探测后释放
- Agent 持有 writer 句柄整个生命周期；不持久化 PID

**责任角色。** Client Session controller；视图/Provider；Session catalog/storage writer；Workspace 导航。

**步骤。**
1. 定义 target→binding→reference 三层；acquire 同步返回 reference，ready 异步打开历史
2. 为每个使用点标注 source，release 只减自己的计数
3. 最后一个 release 撤 admission/id 映射并 dispose，使用 generation 身份防旧清理
4. Provider 只注入 binding；缓存以 binding 为弱键
5. 空白导航按 catalog 顺序选候选，取得 writer 后打开；失败按错误类型处理
6. 同一 Workspace 连接仅在 preset 相同时合并；后续导航取消旧选择

**完成信号。** 多个引用共享一次历史打开；最后 release 才清理；不同 binding 隔离；空白复用保留 slash 状态。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：引用计数 + 代际身份 + 写锁 + Provider 边界。实现线索：SessionTarget/SessionBinding/SessionReference、retainInfo、mainView source、SessionProvider、writer acquisition。信任：controller 负责所有权；存储写锁仲裁跨 Host。

**失败处理。** release 后读 binding 失败；未释放引用泄漏；writer 被占则新建

**例外。** 持久化 Session-keyed Store 可跨视图保留；非持久状态随最后引用丢弃

**适用性。** 适用于多视图/多窗口共享同一 Session、异步历史加载和跨进程存储的系统；单视图可直接持有 Session，但仍需区分目录与运行态。

**与其他机制的关系。** M09 资源释放；M17 投影状态；M19 UI 状态；M04 存储写锁。

**迁移策略。** 先把 catalog 与 live generation 分离，再逐视图迁移到 reference；空白复用单独加写锁

**落地实现。** target/binding/reference 类型；source 计数；Provider；writer acquire-before-history

**所需支持。** 历史打开 Promise、代际缓存、写锁、Provider 上下文

**验证（计划，未执行）。** 正向：多个引用共享一次历史打开；最后 release 才清理；不同 binding 隔离；空白复用保留 slash 状态。拒绝：释放后读取失败；另一个 Host 持锁时新建；并发空白不共享 writer。恢复：历史打开失败仍可渲染/重试；旧清理不删除替代代际。

**局限。** 未执行并发/引用泄漏测试；空白写锁的当前实现与 preset 规则需代码确认；每个 retain 都启动历史打开是已知成本。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-client-session-references.md:1-226@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-process-local-blank-sessions.md:1-35@687f282e`

### rationale-architecture-3.arch3-M17 Client 投影状态与工具呈现所有权 {#rationale-architecture-3.arch3-M17}

**何时读。** 新增工具行/命令 UI；多个视图消费同一 Session；服务端事件到达但视图未挂载；需要派生标题/摘要/统计。

**问题与历史原因。** 把 Host 原始事件、工具执行状态和每个视图的展开/选择混在一起，会导致同一数据在 Workspace/Sidebar 各自组合、状态错位，或把仅展示用的行当成持久事实。

**必须满足的义务。**
- 投影拥有可重建的客户端读模型；原始事件仍是真源
- 工具行按 view keyed slot/occurrence 管理，不共享可变 UI 状态
- 命令行的复制文本等展示契约由行与 handler 明确分工，避免双重来源
- subagent 列表身份由投影单元/父子地址决定，不靠扫描全部日志
- 观察是点读单位；读取按 audience/成本分层，不能每问一次扫全日志
- 客户端不得把展示状态反写成规范 Session 数据

**责任角色。** 投影/read model 作者；客户端视图；Host 事件/查询实现；工具 UI。

**步骤。**
1. 定义 projection unit 的输入（事件/header）与输出（列表行/摘要/统计）
2. 把视图局部状态放在 occurrence，投影只暴露稳定身份与数据
3. 为工具行建立 per-view keyed slot；销毁视图只释放自己的 occurrence
4. 为冷/热读取建立 observation/query API，明确物化成本
5. 用可重建测试验证投影可从日志恢复
6. 命令复制等契约在行与 handler 之间只保留一个权威实现

**完成信号。** 投影可从日志重建；两个视图互不干扰；工具行按 view 独立。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：投影层 + occurrence 状态 + 读取 API + 可重建测试。实现线索：client-derived tool presentation、session observations、subagent projection unit、toolview keyed slots、command row copy contract。信任：投影拥有派生数据；视图拥有局部 UI 状态；Host 拥有原始事件。

**失败处理。** 投影缺失时可回源/重建；视图卸载不影响其他视图

**例外。** 纯展示动画/布局状态无需持久化，也不进入投影

**适用性。** 适用于事件溯源 + 多视图客户端；单视图可直接从事件渲染，但仍应区分规范数据与局部 UI 状态。

**与其他机制的关系。** M16 Session 引用；M18 资源；M20 组件 slots；M27 读取意图。

**迁移策略。** 先把可重建读模型从视图中抽出，再迁移工具/子 Agent 列表

**落地实现。** 定义 projection unit 与 observation；工具行用 keyed slot；命令复制单一实现

**所需支持。** 投影运行时、事件/header 输入、视图 key、读取成本 API

**验证（计划，未执行）。** 正向：投影可从日志重建；两个视图互不干扰；工具行按 view 独立。拒绝：非法/过期 observation 被拒绝；视图不能写规范状态。恢复：投影丢失后回源重建；视图销毁只清理自己的 occurrence。

**局限。** 本分区未执行 UI/投影测试；工具呈现的产品细节可能已演进；读取成本/audience 的具体 API 需实现确认。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-23-toolview-dissolution.md:1-36@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-30-command-row-copy-contract.md:1-36@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-06-subagent-list-identity-projection.md:1-190@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-23-client-derived-tool-presentation.md:1-710@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-25-session-observations-and-projection-owned-client-state.md:1-200@687f282e`

### rationale-architecture-3.arch3-M18 Client 资源模型与地址生命周期 {#rationale-architecture-3.arch3-M18}

**何时读。** 新增客户端资源类型；多视图共享资源；资源跨异步操作/重连；卸载/重载组件。

**问题与历史原因。** 客户端同时管理 Session、文件、上传、流和 UI 资源时，若用临时对象/全局 id 互相引用，视图切换或卸载会造成泄漏、悬空引用或误释放。

**必须满足的义务。**
- 资源用稳定地址/句柄标识，服务负责生命周期
- hook/frame 只观察，不拥有资源
- 取消/释放幂等，且只影响调用方自己的引用
- 跨重连恢复用地址而不是对象身份
- 资源模型不把 Session 业务状态复制进来

**责任角色。** Client resource service；组件/hook；Session controller。

**步骤。**
1. 定义 address/handle 与 owner
2. 通过 service 获取/释放；组件只订阅
3. 为 frame/stream 建立显式结束与错误路径
4. 用资源表/弱引用避免悬挂
5. 测试卸载、重连、重复释放

**完成信号。** 卸载后资源释放；重连按地址恢复；重复释放无副作用。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：地址 + 服务所有权 + 幂等释放。实现线索：client resource model、SessionReference、upload/stream handles。信任：service 拥有；组件只借阅。

**失败处理。** 已释放地址明确失败；重连重新解析地址

**例外。** 短期纯 UI 状态可留在组件内

**适用性。** 适用于多视图、可重连的客户端；简单页面可直接持有对象。

**与其他机制的关系。** M09 dispose；M16 Session 引用；M17 投影。

**迁移策略。** 先抽象资源地址与服务，再迁移组件

**落地实现。** address/handle、service、hook；释放协议

**所需支持。** 稳定 id、重连、取消、资源表

**验证（计划，未执行）。** 正向：卸载后资源释放；重连按地址恢复；重复释放无副作用。拒绝：越权/已释放地址被拒绝。恢复：地址失效可重新解析；失败保留错误。

**局限。** 本分区只读决策记录，未执行资源测试；资源类型边界需代码确认。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-client-resource-model.md:1-86@687f282e`

### rationale-architecture-3.arch3-M19 提交后激活与单一 UI 运动 {#rationale-architecture-3.arch3-M19}

**何时读。** 保存偏好/快捷键/草稿；折叠上一轮工作详情；提交状态与通知顺序；读者滚动/阅读手势。

**问题与历史原因。** 界面在持久化/提交前就激活，会让失败保存看起来成功、重启后状态不一致；折叠动画若同时存在多条路径，会在读者位于正文中段时制造整屏空白。

**必须满足的义务。**
- 先持久化/提交，再发布 accepted 状态与驱动 UI
- 只保留一条折叠运动路径；所有关闭行按批次驱动
- 落点只有“到底部”和“读者内容不动”，取决于是否 own input 与读者是否跟随
- 补白只安装精确差额，内容不回溯下滑
- 阅读手势优先于自动到底部；迟到/旧回调不得覆盖新状态
- 源/目标状态独立发布，消费者不得从通知顺序推断生命周期

**责任角色。** 设置/保存事务；聊天 viewport/折叠驱动；输入回显。

**步骤。**
1. 持久化成功后发布 accepted；失败保持旧状态
2. 批次 begin/prepare/frame/finish 四步；关闭/展开行同批接管
3. 选择 tail/reader-still；tail 读取已提交布局，reader-still 用参照行位移补偿
4. own input 用本页 echo/子 Agent echo 识别，而不是“是否为用户消息”
5. 滚动/手势取消 tail；短正文保留差额
6. 用布局空洞/锚点位移测试覆盖

**完成信号。** 保存失败界面不生效；折叠后布局空洞 <=120px；读者锚点位移 <=2px。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：提交门 + 单运动路径 + 落点测试。实现线索：shortcut accepted config、InputFoldDriver、flow-motion、fold-blank-matrix e2e。信任：保存事务决定 accepted；viewport 决定运动。

**失败处理。** 保存失败不激活；动画批次外不改变行；短正文差额保留

**例外。** reduced motion 立即完成；无阅读策略时用 CSS 过渡

**适用性。** 适用于有乐观 UI 风险或复杂滚动/折叠的客户端；简单静态列表无需批次驱动。

**与其他机制的关系。** M05 写入完整性；M16 引用；M17 视图状态。

**迁移策略。** 先删第二条路径，再统一落点；不要只修 ownInput 检测

**落地实现。** 删 reserve/followAfterFold；批次驱动；tail/reader-still 计算；echo 识别

**所需支持。** 滚动测量、参照行、echo id、reduced motion

**验证（计划，未执行）。** 正向：保存失败界面不生效；折叠后布局空洞 <=120px；读者锚点位移 <=2px。拒绝：旧回调/过期状态不覆盖；批次外行不变化。恢复：短正文保留差额，新内容到达后填满；焦点保护已知一次位移。

**局限。** 动画数值来自特定 e2e，不能直接复用为通用阈值；未执行浏览器动画测试；产品布局/阅读策略差异大。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-client-session-references.md:1-226@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-20-device-local-shortcut-preferences.md:1-27@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-chat-single-fold-motion.md:1-92@687f282e`

### rationale-architecture-3.arch3-M20 组件工厂、局部 Slot 与扩展点 {#rationale-architecture-3.arch3-M20}

**何时读。** 同一组件需要多个 occurrence；插件需要扩展页面/设置/模型列表；响应式布局需要注入 tab 信息；工具行需要按视图独立。

**问题与历史原因。** 全局注册的组件/工具行/设置页会让两个实例共享可变状态；直接把扩展点写死到主页面，又会让插件无法在不修改核心的情况下增加页面/行。

**必须满足的义务。**
- 工厂与 occurrence 分离：工厂只创建，occurrence 拥有状态
- 局部 slot 优先于全局注册；子组件只看到自己的 slot
- 扩展点由消费者定义形状，插件提供内容，不反向导入核心
- 按 view/occurrence keyed，卸载只清自己的节点
- 响应式/可见性信息由布局拥有，插件只声明元数据

**责任角色。** 组件/工厂作者；插件；布局/宿主。

**步骤。**
1. 定义 factory 输入与 occurrence 生命周期
2. 在消费点建立局部 slot；注册返回 disposer
3. 把扩展点声明为数据/组件契约，不暴露核心内部
4. 用 keyed slot 绑定 view，避免全局单例
5. 测试两实例、卸载、重复注册

**完成信号。** 两个 occurrence 状态隔离；插件扩展只影响目标 slot；卸载清理。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：工厂/occurrence + 局部 slot + keyed 绑定。实现线索：component factories/local slots、models-page extension slots、settings companion packages、toolview keyed slots、sidebar responsive tab info。信任：工厂创建；occurrence 拥有；slot 只影响子树。

**失败处理。** 重复/非法注册拒绝；卸载清理自己的 slot

**例外。** 真正全局单例需显式声明并说明理由

**适用性。** 适用于插件化 UI 或多实例组件；单实例页面可直接组件化。

**与其他机制的关系。** M17 工具呈现；M35 插件身份；M09 dispose。

**迁移策略。** 先把全局注册改为局部 slot，再迁移插件

**落地实现。** factory/occurrence 接口；slot 注册 disposer；扩展点数据契约

**所需支持。** slot 运行时、keyed view、组件生命周期

**验证（计划，未执行）。** 正向：两个 occurrence 状态隔离；插件扩展只影响目标 slot；卸载清理。拒绝：重复注册/越权访问其他 slot 被拒绝。恢复：slot 失败不影响核心页面；重新挂载恢复。

**局限。** 本分区未执行 UI 测试；扩展点产品形状差异大；工厂类型系统实现需代码确认。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-07-23-toolview-dissolution.md:1-36@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-26-models-page-extension-slots.md:1-34@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-07-sidebar-responsive-tab-info.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-17-settings-pages-as-companion-packages.md:1-41@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-component-factories-and-local-slots.md:1-105@687f282e`

### rationale-architecture-3.arch3-M37 机械重构与行为改动分离 {#rationale-architecture-3.arch3-M37}

**何时读。** 需要从大组件/大文件提取实现；同时要改变行为/所有权；多实例/共享状态需求；评审机械 diff。

**问题与历史原因。** 把多实例/共享草稿等行为改动直接塞进大文件，会让评审无法区分“搬代码”和“改语义”，也容易在提取时改变 ref/effect 顺序或提交状态机。

**必须满足的义务。**
- 先做纯机械提取 PR：新文件只承载已执行逻辑，不含占位接口/未来功能
- 行为 PR 只改行为，禁止移动/改名/纯提取/测试重排/格式清理
- 结构准备若不足，先补机械 PR（或修改未合并的机械 PR），行为 PR 以其为 base
- 保留原方法体/分支/回调顺序/Hooks/ref/effect 相对顺序；DOM 不增加包装
- 测试第一阶段只改必要类型导入；不刷新快照
- 行为阶段用真实双实例/卸载测试验证

**责任角色。** 重构作者；评审者；测试作者。

**步骤。**
1. 列出提取边界与不变项（创建/复用/dispose 次数、事件顺序、公开 API）
2. 机械 PR 只移动/委托，保留原宿主
3. 评审逐项比较原方法体/分支/顺序
4. 合并后再开行为 PR，只改目标位置
5. 用双实例/IME/Undo/卸载测试验收

**完成信号。** 机械 PR 现有测试/快照不变；行为 PR 双实例同步/卸载正常。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：两阶段 PR + 不变项清单 + diff 审查。实现线索：Stage one five extractions、stage-two restrictions、hooks/refs stay host、no DOM wrapper。信任：作者拆分；评审按不变项核对。

**失败处理。** 行为 PR 夹带机械整理则拒绝；机械 PR 改变语义则拒绝

**例外。** 新行为需要的新类型/测试可在行为 PR 添加；不得复制旧代码后删除原文规避

**适用性。** 适用于大文件重构、需要多实例/共享状态的产品；小改动可直接一次 PR，但仍应分离纯搬移。

**与其他机制的关系。** M09 dispose/occurrence；M20 factories；M17 tool rows。

**迁移策略。** 先机械提取并锁定不变项，再实现行为

**落地实现。** 五处提取；保留 Hooks/ref/顺序；行为 PR 只改目标位置

**所需支持。** 可比较的基线、双实例测试、评审清单

**验证（计划，未执行）。** 正向：机械 PR 现有测试/快照不变；行为 PR 双实例同步/卸载正常。拒绝：机械 PR 改变事件顺序/DOM；行为 PR 含搬移/改名被拒绝。恢复：结构不足时回到机械 PR 补齐；不以“以后清理”绕过。

**局限。** 本提案未实现双实例行为；机械提取仍可能改变 ref/effect 时序，需逐项审查；具体产品 UI 结构不可直接复用。

**源证据。**
- `deepseek-harness/.agents/notes/proposed/architecture/2026-09-14-composer-model-and-draft-editor.md:1-116@687f282e`

## F 模型上下文与提示词

### rationale-architecture-3.arch3-M24 路由化模型上下文与压缩策略 {#rationale-architecture-3.arch3-M24}

**何时读。** 新增模型/provider/路由；上下文接近容量；压缩/摘要；请求扩展字段。

**问题与历史原因。** 不同模型/路由的上下文容量与压缩能力不同；用一个全局 token 估算或统一压缩策略，会在精确路由上过早失败或错过压缩时机。

**必须满足的义务。**
- 精确路由的容量由 adapter 拥有；token 测量保持模型无关
- 压缩目标由 compact-basic 解析 target spec，而不是写死全局
- 目标特有压力失败保留可选组合，不误删必要上下文
- 上下文占用是近似值；UI/日志必须标注而非伪装精确
- 请求扩展（session log/plugin package）增量添加，不破坏旧请求

**责任角色。** model adapter/router；compaction policy；token measurement；UI/日志。

**步骤。**
1. 在 adapter 声明路由容量/能力
2. 用模型无关测量估计占用；记录为近似
3. 压缩时解析 target spec，应用策略并保留可选组合
4. 压力失败按目标分类；不要用全局 fallback 掩盖
5. 请求扩展字段按增量 schema 加入，保留旧读取方
6. 用真实 SDK/路由测试验证首次请求与压缩

**完成信号。** 不同路由按各自容量压缩；近似占用标注；扩展字段不破坏旧请求。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：路由能力 + 目标 spec + 近似测量。实现线索：routed model context、compact-basic target spec、projected token usage、DeepSeek request extensions。信任：adapter 拥有容量；policy 拥有压缩；UI 不把近似当精确。

**失败处理。** 压力失败保留可选组合；测量偏差显式标注

**例外。** 无精确容量的 provider 可用保守默认；辅助请求可牺牲前缀复用

**适用性。** 适用于多模型/多路由 LLM 系统；单一固定模型可简化，但仍应区分容量与测量。

**与其他机制的关系。** M01 前缀/日志；M25 提示词；M21 请求元数据。

**迁移策略。** 先把容量移到 adapter，再把压缩目标参数化

**落地实现。** route capacity；target spec；近似占用；增量请求字段

**所需支持。** 模型能力表、token 测量、压缩策略、SDK 测试

**验证（计划，未执行）。** 正向：不同路由按各自容量压缩；近似占用标注；扩展字段不破坏旧请求。拒绝：目标不支持时明确失败；无效 target spec 拒绝。恢复：压力失败保留可选组合；重试不重复压缩。

**局限。** 本分区未执行模型/压缩测试；容量表随 provider 变化；近似测量的误差范围需实现数据。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-20-routed-model-context-and-compaction-policy.md:1-57@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-projected-token-usage-and-request-context.md:1-61@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-21-deepseek-llm-api-request-extensions.md:1-92@687f282e`

### rationale-architecture-3.arch3-M25 提示词区块、变量与工具指导所有权 {#rationale-architecture-3.arch3-M25}

**何时读。** 新增提示词区块/变量；插件提供工具指导；调整 persona/系统提示；子 Agent 对话历史描述。

**问题与历史原因。** 提示词由多个插件/组件拼接时，区块顺序、变量替换和工具指导容易各自为政，导致稀疏顺序冲突、persona 位置错误或工具说明重复。

**必须满足的义务。**
- 首方提示词区块顺序集中声明为互不重复的稀疏整数位次，相邻至少留 10 点；外部同位次按 code-unit 名称排序，不靠激活顺序
- persona 是 order-0 区块；变量替换有明确所有者
- 工具指导由工具/能力所有者提供，不复制到通用提示
- 子 Agent 的对话历史说明从 provider.inheritsParentContext 派生并随 provider 生命周期同步，不由 persona 或 provider 名称猜测
- 绑定 provider 缺席时子 Agent 工具不注册，请求不包含它；重新激活后工具及说明恢复为该 provider 的真实语义

**责任角色。** 提示词组装器；插件/工具作者；persona 所有者。

**步骤。**
1. 建立集中区块顺序表；稀疏 order 映射到稳定位置
2. 变量只由事实所有者注册；插值区块严格解析，literal 区块用 interpolate:false，不能假设存在 inline escape
3. 工具指导随工具注册提供；组装器只消费
4. 从 provider.inheritsParentContext 生成工具与参数说明，并监听 provider 注册/卸载更新
5. 用请求/快照验证稀疏顺序、同 rank 的 code-unit 名称排序，以及 provider 缺席/重激活的真实工具集合

**完成信号。** persona 位于 order 0；首方区块使用集中稀疏整数位次，外部同 rank 区块对相反注册顺序仍产生相同的 code-unit 名称排序；工具指导只有其所有者的一份；说明匹配 provider 的真实继承标志。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：集中顺序 + 所有权 + 快照测试。实现线索：sparse first-party prompt section orders、prompt variables、tool guidance ownership、persona order-0、subagent history descriptor。信任：组装器拥有顺序；插件拥有自己的区块内容。

**失败处理。** 未知、无值或畸形变量引用及重复注册明确失败；绑定 provider 缺席时不保留不可兑现的工具

**例外。** literal 区块不插值；inline escape 不支持；单独未闭合的 {{ 仍作正文；外部区块可用任意有限 order，同 rank 按名称确定排序；agent-scoped deployment:persona-prefix 在排序前按同名覆盖全局默认，并可在子 Agent 发布前安装。

**适用性。** 适用于多插件/多工具拼接提示词的系统；单一静态 prompt 可省略。

**与其他机制的关系。** M24 上下文；M07 preset 注入；M01 消息边界。

**迁移策略。** 先把顺序与变量集中，再迁移插件区块

**落地实现。** 区块表；变量解析；工具指导接口；子 Agent 描述符

**所需支持。** 提示词组装器、区块注册、快照测试

**验证（计划，未执行）。** 正向：persona 位于 order 0；集中稀疏整数位次保持首方顺序，外部同 rank 在相反注册顺序下仍按 code-unit 名称确定排序；工具指导只有所有者的一份。拒绝：未知/undefined 变量、畸形引用与重复注册明确失败；literal 区块中的 {{example}} 原样保留，替换结果不二次扫描。恢复：卸载绑定 provider 后子 Agent 工具从请求消失；以不同 inheritsParentContext 重激活后恢复工具并更新说明，不沿用旧文案。

**局限。** 本分区未执行提示词测试；具体区块顺序是产品配置；变量语法/转义需代码确认。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-25-sparse-first-party-prompt-section-orders.md:1-60@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-07-05-prompt-variables-and-tool-guidance-ownership.md:1-71@687f282e`

## G 文件、Schedule 与派生内容

### rationale-architecture-3.arch3-M32 Schedule 硬删除与有界投递历史 {#rationale-architecture-3.arch3-M32}

**何时读。** 删除任务；确认投递/追加回执；部署需要更长历史；preset 决定是否注入时间/提醒工具。

**问题与历史原因。** Schedule 是每次 mutation 都重写的单个整 unit JSON；保留 deleted 行和无限投递记录会让文档大小随投递次数增长，并引入所有读取方都要跳过的状态。

**必须满足的义务。**
- 删除是硬删除：移除 storage row，任务停止调度、离开 list/catalog，history 返回 schedule_not_found，记录随行删除
- 任务 schema 无 deleted 字段；无回收站/已删除记录读取
- 投递历史受 Config 双重上限：天数窗口 + 条数上限，在唯一写路径应用
- 窗口锚定本次追加回执的 deliveredAt，始终保留最新回执
- 裁剪设置 unavailable/pruned 标志，后续追加保留；仅“确认裁剪”才显示清理提示
- 时间上下文注入归属消费它的 preset；部署级 schedule/ui-schedule 行不归属 preset

**责任角色。** Schedule service/storage；plugin Config；client UI；preset 作者。

**步骤。**
1. 删除直接调用 tasks.delete，不保留墓碑
2. appendDelivery 同时应用天数与条数；先过滤窗口再取最新 N，并强制保留本次回执
3. 设置裁剪标志；历史响应携带当前上限
4. 客户端只在最后一页且确认裁剪时提示
5. 把 time-context 放在 standard/ptc/cordis，不放 minimal/全局行

**完成信号。** 删除后 history not_found；窗口/条数上限生效；最新回执保留；时间上下文只在消费 preset。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：硬删除 + 单写路径上限 + preset 归属。实现线索：ScheduleService.delete/tasks.delete、deliveryHistoryDays/Records、earlierRecordsPruned、preset patch 声明。信任：service 执行删除/保留；preset 决定注入。

**失败处理。** 删除不可恢复；裁剪明确标记；配置上限可调

**例外。** inactive 是唯一非活动状态；部分取代 Host schedule storage，剩余决策仍由原记录拥有

**适用性。** 适用于整文档重写、投递/事件历史会增长的本地存储；关系型/增量存储可用不同保留策略。

**与其他机制的关系。** M07 preset；M02 派生介质；M38 部分取代。

**迁移策略。** 先改硬删除与唯一写路径，再加双重上限；保留部分取代关系

**落地实现。** tasks.delete；appendDelivery 双上限；pruned 标志；preset time-context

**所需支持。** Config、row schema、历史 UI、preset patch

**验证（计划，未执行）。** 正向：删除后 history not_found；窗口/条数上限生效；最新回执保留；时间上下文只在消费 preset。拒绝：deleted 行/回收站不存在；minimal 不产生 time-context。恢复：裁剪标记说明历史不完整；提高 Config 可保留更长历史。

**局限。** 删除不可恢复是明确代价；未执行 Schedule 测试；部分取代需与 Host schedule storage 记录一起读。

**源证据。**
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-schedule-hard-delete-and-bounded-history.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-preset-scoped-time-context.md:1-37@687f282e`

### rationale-architecture-3.arch3-M33 派生内容（翻译/图像）的持久缓存与原始内容共存 {#rationale-architecture-3.arch3-M33}

**何时读。** 重新展开思考内容/预览；应用重启；翻译/图像 Provider 调用；Session 历史落盘。

**问题与历史原因。** 读者需要在重新展开/重启后复用译文或图像；只存在展开区缓存会重复请求/计费，替换原始内容又会丢失模型历史；图像若只留在事件里，durable log 会膨胀。

**必须满足的义务。**
- 派生记录与原始事件并存，不替换原始内容/模型输入
- 请求在 dispatch 前持久化；结果在返回 GUI 前持久化
- 缓存身份包含 Provider+recipe/语言/目标；身份不符不得复用
- 只缓存完成且持久化的结果；失败/未完成不提供
- 使用已激活 Session 的现有 writer；未激活且未命中时在 Provider 调用前拒绝
- 并发相同翻译共享一个结果；不同片段可并行
- 图像/翻译使用派生介质规则，可重建/可丢弃部分需标注

**责任角色。** translator/image offload provider；Session writer；GUI 消费者；Session controller。

**步骤。**
1. 定义 request/result 记录与身份键
2. dispatch 前写 request；返回前写 result
3. 只读查找优先；命中直接返回
4. 新记录通过 active writer append + targeted flush
5. 未激活 Session 等待正常激活后重试一次
6. 并发去重；失败/取消保留已有完成记录
7. 用重启/展开/并发测试覆盖

**完成信号。** 重启后复用译文/图像；原始思考仍可访问；并发相同请求共享结果。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：durable-before-side-effect + 身份键 + 单写者。实现线索：plugin:translator/request/result、appendPluginRecord、image offload surface replacement、Session writer。信任：派生 Provider 负责内容；Session writer 负责持久化。

**失败处理。** 失败/未完成不缓存；late cancel 可能保留已完成记录；旧 generation 缓存不发布

**例外。** 实验性记录可被未来迁移丢弃；无 Session 的 stateless 调用不缓存

**适用性。** 适用于需要跨重启复用外部模型/转换结果、且原始内容必须保留的系统；一次性预览可只存内存。

**与其他机制的关系。** M02 派生介质；M16 Session 激活；M27 读取。

**迁移策略。** 先定义记录身份与持久化时机，再迁移 GUI 缓存

**落地实现。** request/result；dispatch/return 前写入；只读查找；active writer；并发去重

**所需支持。** Session writer、记录 schema、Provider 适配器

**验证（计划，未执行）。** 正向：重启后复用译文/图像；原始思考仍可访问；并发相同请求共享结果。拒绝：身份不符/失败结果不复用；未激活且未命中在 Provider 前拒绝。恢复：激活后重试一次；已完成记录在 late cancel 后保留。

**局限。** 记录为实验性，未来格式迁移可能丢弃；未执行重启/并发测试；Provider 可用性/计费行为需外部验证。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-02-durable-image-offload.md:1-56@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-persistent-machine-translation.md:1-35@687f282e`

### rationale-architecture-3.arch3-M34 Workspace 文件服务、路径授权与原生字节 {#rationale-architecture-3.arch3-M34}

**何时读。** 读取/预览/上传 Workspace 文件；相对路径解析；Office/PDF 预览；HTTP 断连/取消。

**问题与历史原因。** 文件读取/预览/上传若各自解析路径或直接暴露 Host 路由，会绕过 Workspace 边界、重复错误处理，或把大字节塞进 base64；预览还需要原生字节。

**必须满足的义务。**
- Workspace 文件服务是唯一文件操作入口；路径解析有 baseFile/Workspace 约束
- 读取权限由 Workspace 归属决定，不能仅凭 Session 身份
- 二进制读取使用统一 readBytes/附件协议；不新建 feature 路由
- Office 预览可本地 WASM/独立转换，但遵守有界转换与隔离 iframe
- Desktop 上传使用受控传输（如 COS SDK），凭据/重试/失败可见
- 路径/文件名不进入可导航 HTTP 响应；HTML 放隔离 Blob
- 上传为单次流式 putObject，显式 ContentLength/Content-MD5；失败保持可审计，不自动重试

**责任角色。** workspaceFiles service；Session/Workspace 授权；preview/office renderer；upload transport。

**步骤。**
1. 定义 readBytes/统计/列表 API 与 baseFile 解析
2. 在服务层校验 Workspace containment 与 Session 权限
3. 预览用原生字节；Office 走有界转换
4. 上传使用 SDK/受控通道，处理取消/重试
5. 用路径穿越/相对目标/断连测试覆盖

**完成信号。** 相对/完整读取正确；越界被拒绝；PNG/PDF/Office 预览可用；上传失败可诊断。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：单一文件服务 + containment + 二进制协议。实现线索：workspaceFiles、workspace file read authority、readBytes、Office WASM preview、COS upload。信任：文件服务拥有路径/权限；预览只消费字节。

**失败处理。** 越界路径/无权限拒绝；转换/上传失败明确

**例外。** 插件可读文件系统不等于可绕过 Workspace 权限；大文件仍有上限

**适用性。** 适用于多 Workspace、文件预览/上传的本地或 Web 应用；单用户单目录可简化，但仍需路径规范化。

**与其他机制的关系。** M22 二进制；M27 读取；M30 桌面安装包页面。

**迁移策略。** 先把路径/权限收进服务，再迁移预览/上传

**落地实现。** readBytes options；containment；WASM 预览；SDK 上传

**所需支持。** Workspace 元数据、路径解析、转换器、上传凭据

**验证（计划，未执行）。** 正向：相对/完整读取正确；越界被拒绝；PNG/PDF/Office 预览可用；上传失败可诊断。拒绝：路径穿越/无权限/未发布路由被拒绝。恢复：转换/上传失败重试；断连 drain。

**局限。** Office/COS 为产品集成，需外部服务验证；未执行路径穿越/浏览器测试；文件大小/转换上限依实现。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-10-local-office-preview.md:1-52@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-09-16-desktop-cos-upload-transport.md:1-44@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-workspace-files-service.md:1-149@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-workspace-file-read-authority.md:1-29@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-workspace-file-binary-transfer.md:1-31@687f282e`

## H 提案、核心协议与证据边界

### rationale-architecture-3.arch3-M39 会话核心能力协议（提案）与证据边界 {#rationale-architecture-3.arch3-M39}

**何时读。** 重构会话/存储抽象；引入第二个 provider/索引；迁移已发布 Session 格式；评审“已实现”声明。

**问题与历史原因。** 保留旧 Session 名称不等于实现可替换；storage/query/projection/前端若假设具体内存类、JSONL 路径或索引 schema，物理实现仍会泄漏。提案给出目标协议，但明确尚未全部实现。

**必须满足的义务。**
- 普通业务只依赖 LogicalSession + SessionService；cold/索引/搜索走 SessionQuery
- 仅 detached 构造/校验/provider adapter/测试使用 createLogicalSession/restoreLogicalSession
- Projection 是可重建读模型，不是第二 Session/恢复权威
- 只有 composition/provider 可见具体实现；依赖门禁禁止反向导入/provider 名称分支
- 已发布格式兼容独立于抽象重构；迁移写新 generation、保留旧 generation
- 提案必须标明 target/未实现/风险，不能把目标签名当 current

**责任角色。** 会话核心/ provider 作者；迁移作者；评审者。

**步骤。**
1. 定义逻辑核心与正交能力接口
2. 列出当前实现差距（publication/storage/projection timing）
3. 迁移消费者到 LogicalSession/SessionService/SessionQuery
4. 用共享 contract suite 验证第二 provider
5. 保留 released-format 测试与旧 generation
6. 在文档中标注 proposed/unimplemented

**完成信号。** 第二 provider 不改消费者通过 suite；索引/统计可重建。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：接口 + 依赖门禁 + contract suite + 文档证据。实现线索：LogicalSession/SessionService/SessionStorage/SessionProjectionPort/SessionQuery、dependency gate、released-format fixtures。信任：接口所有者定义；provider 通过 suite；文档不得夸大。

**失败处理。** 反向导入/provider 名称分支被拒绝；旧 runtime 不承诺读新格式

**例外。** 兼容名称可暂时保留，但新代码不得新增导入

**适用性。** 适用于大型会话/存储重构；小型系统可直接用具体类型，但仍应隔离持久化。

**与其他机制的关系。** M03 格式；M02 派生；M27 读取。

**迁移策略。** 先建逻辑核心与 contract suite，再逐 provider 迁移；提案不冒充实现

**落地实现。** LogicalSession/Service/Query；contract suite；依赖门禁；released-format 兼容

**所需支持。** 接口、provider 套件、迁移证据

**验证（计划，未执行）。** 正向：第二 provider 不改消费者通过 suite；索引/统计可重建。拒绝：生产源码导入具体实现被门禁拒绝；旧 runtime 读新格式不被承诺。恢复：迁移失败保留旧 generation；协议按证据修订。

**局限。** capability protocols 与 data compatibility 均为 proposed；SessionService timing 未达目标，远程实现可能暴露同步 append 限制；本分区未执行 contract suite。

**源证据。**
- `deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-capability-protocols.md:1-94@687f282e`
- `deepseek-harness/.agents/notes/proposed/architecture/2026-09-10-session-data-compatibility.md:1-43@687f282e`


## I 读取意图与运行时检查

### rationale-architecture-3.arch3-M27 日志读取意图与物化成本 {#rationale-architecture-3.arch3-M27}

**何时读。** 新增列表/搜索/统计/调试视图；读取冷 Session；需要进程/运行时快照；分页/懒加载。

**问题与历史原因。** 把“读事件”“列列表”“查统计”“调试快照”都实现成隐式全量扫描，会让 UI 卡顿、内存峰值和成本不可预测；调用方也不知道一次读取会物化多少。

**必须满足的义务。**
- 读取 API 明确意图与物化成本（点读/范围/扫描/索引）
- 冷读取优先走索引/投影，不因列表而加载完整正文
- 进程/运行时检查使用快照，不按问题逐项读取
- 分页/流式读取有界，避免 whole-artifact 峰值
- 读取不得发布旧 generation 或把缓存当权威

**责任角色。** Session query/observation 实现；UI/CLI 调用方；索引/投影。

**步骤。**
1. 按调用方需求分类读取：点读/过滤/搜索/统计
2. 为每类提供专门 API 或参数，返回成本/是否物化
3. 冷 Session 用索引/投影；缺失时回源但有界
4. 进程表/调试用快照，按版本/时间失效
5. 用大日志/冷缓存测试内存与延迟

**完成信号。** 列列表不加载正文；冷读取走索引；进程检查用快照。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：读取意图 API + 索引/快照 + 有界物化。实现线索：session log read intent、session observations、process-table snapshots、projection cache。信任：读取实现负责成本；调用方选择意图。

**失败处理。** 不支持的读取明确拒绝；索引缺失回源但不静默全量

**例外。** 调试/导出可显式请求全量，但需标注成本

**适用性。** 适用于大日志、冷启动、列表/搜索并存的系统；小数据可直接全量。

**与其他机制的关系。** M02 派生介质；M17 投影；M28 运行时检查。

**迁移策略。** 先给读取分类并加成本标注，再迁移 UI/CLI

**落地实现。** 点读/范围/扫描 API；索引；进程快照

**所需支持。** 索引/投影、分页、成本测量

**验证（计划，未执行）。** 正向：列列表不加载正文；冷读取走索引；进程检查用快照。拒绝：越界/不支持读取明确失败；旧 generation 不发布。恢复：索引缺失回源；快照过期重新采样。

**局限。** 本分区只读决策记录，未执行性能测试；成本阈值依产品而定；索引一致性需实现验证。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-21-session-log-read-intent.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/implemented/architecture/2026-08-25-session-observations-and-projection-owned-client-state.md:1-200@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-27-process-table-snapshots.md:1-72@687f282e`

### rationale-architecture-3.arch3-M28 Inspector 执行域、协议平面与快照 {#rationale-architecture-3.arch3-M28}

**何时读。** 新增运行时/进程检查；调试器连接/断开；跨 realm 对象/标识；高频状态查询。

**问题与历史原因。** 调试器/检查器如果直接跨进程读对象、按问题逐个查询或混用 Host/Client 协议，会破坏隔离、产生不一致快照，并让调试功能耦合业务运行时。

**必须满足的义务。**
- 执行域/协议平面显式分离：Host/Client/Worker 各自拥有对象与标识
- 对象桥接只暴露协议允许的值，不跨域共享可变对象
- Cordis 运行时树用含 schema version 与单调 revision 的不可变快照；进程表每 pass 使用同一 point-in-time 观察，等待变化时每轮重新采集
- 依赖规则禁止业务导入检查器内部
- 断开/重连清理订阅，不泄漏句柄

**责任角色。** Inspector Host/Client；运行时/Worker；业务插件。

**步骤。**
1. 定义执行域与协议平面；列出允许跨域的值
2. 区分 Cordis 树的 schema version/revision 与 ProcessSnapshot 的单次观察；不为进程表凭空承诺版本号
3. 同一 pass 的进程问题共用快照；signalProcess 发送前另取当前 per-identity liveness fence，不能从旧快照决定信号
4. 用依赖门禁限制内部导入
5. 测试跨域对象、断开、降级

**完成信号。** 跨域只传允许值；Cordis 树携带 schema version 与单调 revision；0/2/10 后代的同一前台检查各只读一次进程表，空成员清理不采集；断开不泄漏活对象路由。这里的“完成”只是该机制的可观察验收条件；实现与其他机制仍需分别验证。

**执行方式与信任。** 模式：域/协议隔离 + 快照 + 依赖规则。实现线索：inspector execution realms/protocol planes、runtime tree inspection、process-table snapshots。信任：Inspector 拥有调试协议；运行时拥有状态。

**失败处理。** 不支持的对象/平台明确失败；断开清理订阅

**例外。** macOS 表不含 session/state，session 为空且 alive 按 start identity；Linux 的 Z/X/x 为 quiescent；Windows 无 POSIX session，首个 tree 问题才枚举 Toolhelp32，alive 读取当前进程句柄而非假设表有等待态。不能从“同进程”自行推导放宽身份边界的例外。

**适用性。** 适用于有调试器、进程检查或多运行时（Host/Worker/Client）的系统；简单日志调试不需要。

**与其他机制的关系。** M27 读取；M29 Worker/平台；M13 启动。

**迁移策略。** 先分域/快照，再迁移查询；不要先暴露对象引用

**落地实现。** 协议平面；快照；订阅清理；依赖门禁

**所需支持。** 跨域桥、Cordis 带版本/修订的树快照、进程表每 pass 采集与即时身份围栏、各平台明确的观察能力

**验证（计划，未执行）。** 正向：跨域只传允许值；Cordis 树带 schema version/单调 revision；0/2/10 后代的前台检查各只读一次进程表，空成员清理不采集。拒绝：越权对象/内部导入被拒绝；旧快照仍含旧 PID/start identity 时，当前 per-identity fence 阻止向复用 PID 发信号；断开保留的树不能解析为活对象。恢复：waitForMembers 每轮重采以观察变化；Cordis 断开保留数据快照但撤销活对象路由，同 sourceId 的新代际替换后才恢复 connected 与对象查询。

**局限。** 本分区未执行调试器测试；平台差异大；协议细节需代码确认。

**源证据。**
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-24-cordis-runtime-tree-inspection.md:1-114@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-26-inspector-execution-realms-and-protocol-planes.md:1-97@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-27-process-table-snapshots.md:1-72@687f282e`

## 3.10 小型高风险检查清单（按机制索引）

以下规则单看很小，但都是 Note 里真实事故后的防线；迁移时逐条问“目标系统有没有等价检查”。

| 检查 | 机制 |
| --- | --- |
| turn 外的持久化事件一律拒绝；空闲注入使用一次性 turn | M01 |
| 事件 id 与日志偏移分离，不用偏移替代身份 | M01 |
| 不变式/提交路径不插入日志或其他可失败副作用 | M01 |
| end-seed 只承诺已提交前缀，不把当前尾部当已封口 | M01 |
| 派生索引/缓存声明为可重建，不参与恢复权威 | M02 |
| 迁移写新 generation，旧 generation 保留可读 | M03 |
| 被拒绝字段用 never/保留标记，未来不得静默改类型 | M03 |
| packed rows 等物理优化必须有逻辑等价 fixture | M03 |
| 临时 spill 启动清理有界、按标记/年龄，不无限扫描 | M04、M14 |
| 能力接口只放定义域；消费者不导入 provider 或 node:fs | M08 |
| 写文件用私有目录 0700、临时文件 0600、原子 rename | M08 |
| 带版本/CAS 的写入失败返回明确的 stale 错误，不静默覆盖 | M08 |
| 释放责任归资源所有者；不把进程接缝当 dispose 通道 | M09 |
| 可独占资源加锁并可取消，第二个操作者得到明确拒绝 | M11 |
| 沙箱启动参数严格校验，异常路径仍执行生命周期清理 | M12 |
| 预览部署走受保护 URL，删除 sourcemap，校验实际 200/gzip | M13 |
| 空白草稿写锁带 generation；关闭后旧写不得复活 | M16 |
| slot 键重复时大声失败；不用 refCount 猜声明 | M17、M20 |
| UI 先提交再激活；同一操作只保留一条运动路径 | M19 |
| 远程调用方法/元数据经共享模型生成与校验，不手写分叉 | M21 |
| 二进制按类型定向传输；不把文件塞进 JSON 再猜编码 | M22 |
| 下行事件有 allowlist/路由；不向任意上下文广播 | M23 |
| 模型上下文按路由装配；provider 专属 preamble 不重复叠加 | M24 |
| 提示词区块/变量有唯一所有者；未知变量明确失败 | M25 |
| 取消后已交付前缀终结，之后不再产生可观察输出 | M26 |
| 读取 API 标注物化成本；冷列表不隐式加载全文 | M27 |
| Inspector 跨域只传协议允许值；断开清理订阅 | M28 |
| VFS 监听上下文按生命周期清理；懒 chunk 未到达时明确失败 | M29 |
| 致命恢复不依赖已失败的 renderer；首次报告去重 | M30 |
| 凭据优先级固定；密钥不进入日志/错误响应；profile 边界明确 | M31 |
| Schedule 删除是硬删除；投递历史有界，不因删除而泄漏 | M32 |
| 翻译/图像缓存与原始内容共存；以内容摘要/模型选择主记录 | M33 |
| Workspace 路径授权收在单一服务；HTML 放隔离 Blob | M34 |
| 实验包同时有实验前缀、private、受控 publishConfig，且无别名 | M35 |
| 机械重构与行为改动分 PR；每步可回退 | M37 |
| 部分取代旧决策时同步更新状态/链接，不静默改变旧记录 | M38 |
| 提案标明 target/未实现；第二 provider 通过共享 contract suite 才算可替换 | M39 |
| 反馈遥测显式、可归因；请求扩展字段有版本/校验 | M40 |

## 4. 纯产品细节与可迁移内核

以下记录包含大量产品专属形状，迁移时只取标注的内核，不要把具体 UI/安装/商业流程照搬：

- 折叠动画的 120px/2px 阈值、focus 保护的具体一次位移，属于聊天界面验收值；可迁移的是“先提交后激活、只保留一条运动路径、tail/reader-still 两种落点、补白只装精确差额”（M19）。
- 原生致命对话框的 8 行/1200 UTF-16、安装包静态页面、COS 上传、Office WASM 预览、Web 侧栏入口、模型页卡片，属于桌面/产品集成；可迁移的是“恢复不依赖故障组件、首次报告去重、保留原始字节、路径/权限收进单一服务、实验包显式命名”（M30、M34-M36）。
- Schedule 的 day/record 默认值、translation 的实验性记录格式、CUA 的 macOS replayd 观察，属于特定域/平台；可迁移的是“硬删除与有界历史、派生内容与原始内容共存、按内容摘要选主与连接级隔离”（M10、M32、M33）。
- Preview 镜像 9.20 MiB/4.45 MiB 等体积是实测样例，不是通用预算；可迁移的是“从同一 app-boot 表生成 roster、平台差异用显式 patch、懒资源独立归档并显式拒绝未到达读取”（M13、M29）。

## 5. 跨域依赖与未决

本分区不能单独证明以下事项；它们必须在对应域的真实源被检查后才能标为已绑定：

- 文档/双语配对治理：本分区只核对了 sidecar 的结构与旧格式哈希，新格式 per-heading 哈希没有用仓库脚本重算；配对规则本身属于文档域（M38 只覆盖决策记录的取代关系）。
- 会话格式/持久化实现：V3/V4、packed rows、append-only 迁移、writer 锁的具体代码不在本分区；M01/M03/M04 的规范需要与格式域交叉验证。
- 插件/profile/HMR 运行时：M06、M07 依赖 profileContext、Loader、HMR、pnpm 的真实实现；本分区没有执行安装/热更新。
- 客户端 UI/传输：M16-M20、M23 依赖 Session controller、projection、Transport、WebSocket mux 的实现；本分区没有运行浏览器 e2e。
- 凭据/授权/安全：M31、M36 依赖凭据服务、OAuth/登录刷新、密钥存储；本分区没有做安全审计。
- 构建/发布/平台：M13、M29、M30 依赖 app-boot、packer、Electron、安装器；本分区没有构建或部署。
- 提案状态：M39 的两份 Note 都是 proposed；M21 的 unified Typert、M34 的 storage recovery、M37 的 Composer 双阶段也未在本分区执行。任何“已支持/已迁移/已通过”的说法都需要实现与验证证据。

## 6. 本参考自身的不确定性

- 行范围是 Note 正文的完整范围（含必要的 raw 长行补读），不是逐句语义映射。
- 机制是对 94 条记录的归纳；同一 Note 可能支撑多个机制，索引中保留全部相关来源。
- 机制标题与代码标识来自 Note 正文；没有用当前源码重新命名。
- 中文正文与英文正文存在翻译差异时，本参考以两端共同表达的约束为准，并在局限中保留未决项。

## 7. 采用时的最小证据闭环

1. 选定机制后，先写清 authority（谁是权威）、owner（谁负责执行）与 failure mode（失败时发生什么），再写实现。
2. 对每条正向义务、拒绝路径和恢复路径分别留下证据；没有执行过的检查只能标为 planned。
3. 产品专属阈值、厂商集成与安装流程只作为示例，不能直接变成通用验收标准。
4. 任何“已实现/已修复/已迁移/已通过”的说法，都必须由当前代码、测试或运行记录支持；Note 文本本身只是决策证据。
5. proposed 记录不得当作 current；archived 记录只保留可迁移原则；跨域条目在对应源被实际检查前保持 unbound。
