# 简化类决策的可迁移治理机制

本文件来自 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中 `rationale-simplification-1` 分区的 60 篇英文 Note 正文，以及必要的当前实现、仓级规则和依赖政策。中文配对正文已逐篇阅读；sidecar 只作一致性元数据检查，不作为语义证明。这里描述的是“源仓库已经记录/实现的设计事实”和“从这些事实提炼、供其他仓库采用的迁移建议”。后者不是源仓库的运行保证。

各节的“定位/触发/必须做/步骤/完成信号/失败例外”是把源机制参数化后的迁移设计；源仓库的实际强制力只到该节“源证据”所列规则、代码或 Note 明确记录的范围。不要把手册里的建议反推成源仓库政策，也不要把源仓库的预发布姿态当成所有采用仓库都可直接复制的兼容策略。

## 先读这一页：证据状态与使用边界

- **archived**：当时已实施的简化。正文里的路径、命令、API 可能被后续决定取代；引用原则前必须用当前代码/README 复核。
- **implemented**：当前仍作为权威设计记录；实现可能继续演进，仍需以当前代码为准。
- **proposed**：未执行的设计提案。`Proposal`/`Acceptance criteria` 是计划，不是已实现门禁；不得声称其收益或保证已经存在。
- **rejected**：明确否决的提案。正文的 `What we give up`/`Risks` 是反例和代价，不得当成待办。
- 本仓库的预发布姿态允许删除公开 API 而不保留别名；这与“已提交的用户数据仍可解码”是两件事。不要把预发布代码兼容政策套到持久化数据上。

### 决策顺序（建议）

1. **确定事实**：要删/改的是事件、字段、服务、入口、UI 还是持久化世代？
2. **找当前所有者**：生产读取者、恢复/审计读取者、外部承诺分别是谁？写不出一句“谁在什么生命周期读它”的，先标记候选而不是直接删。
3. **检查记录状态**：读 Note 的 Status/目录；rejected/proposed 不作权威，archived 的具体机制要复核当前代码。
4. **选最小切口**：优先删除只写字段/镜像/重复入口；涉及持久化、并发、权限、恢复时，先补证明。
5. **同提交迁移**：所有仓库内调用方、生成目录、文档、测试一起改；旧名称用精确搜索清零。
6. **保留正确的兼容**：旧日志/旧数据用版本化 decoder/migration；旧代码形状不留 alias。
7. **写回证据**：Note/README 记录删了什么、谁迁移、剩余风险、未验证项。验证仍标记为 planned，直到真正执行。

### 机制索引

| 机制 | 一句用途 |
|---|---|
| [rationale-simplification-1-simplification-owner-evidence-gate](#rationale-simplification-1-simplification-owner-evidence-gate) | 先证明当前所有者/消费者，再删或加 |
| [rationale-simplification-1-single-source-durable-truth](#rationale-simplification-1-single-source-durable-truth) | 持久事实只留一个权威来源 |
| [rationale-simplification-1-durable-audit-exception](#rationale-simplification-1-durable-audit-exception) | 审计/恢复事实可无 UI 消费者 |
| [rationale-simplification-1-event-and-field-surface-pruning](#rationale-simplification-1-event-and-field-surface-pruning) | 清点并删除无消费者事件/字段/开关 |
| [rationale-simplification-1-seam-role-and-payload-separation](#rationale-simplification-1-seam-role-and-payload-separation) | 定义/提供方/策略/消费者分层 |
| [rationale-simplification-1-service-consolidation-and-intent-api](#rationale-simplification-1-service-consolidation-and-intent-api) | 合并能力族，按意图暴露操作 |
| [rationale-simplification-1-single-owner-product-and-package-boundary](#rationale-simplification-1-single-owner-product-and-package-boundary) | 一个产品角色一个所有者 |
| [rationale-simplification-1-composition-overlay-single-level](#rationale-simplification-1-composition-overlay-single-level) | 共享基座+单层覆盖 |
| [rationale-simplification-1-shipped-default-opt-in](#rationale-simplification-1-shipped-default-opt-in) | 可选/实验/诊断默认关闭 |
| [rationale-simplification-1-default-roster-single-interface](#rationale-simplification-1-default-roster-single-interface) | 默认 roster 只留一个重叠接口 |
| [rationale-simplification-1-pre-release-cutover-no-aliases](#rationale-simplification-1-pre-release-cutover-no-aliases) | 预发布删除不留兼容别名 |
| [rationale-simplification-1-durable-data-generation-boundary](#rationale-simplification-1-durable-data-generation-boundary) | 已提交数据世代可解码 |
| [rationale-simplification-1-dependency-adoption-evidence](#rationale-simplification-1-dependency-adoption-evidence) | 依赖替换的净删除/健康/拟合证据 |
| [rationale-simplification-1-generated-enforcement-and-stale-surface-gates](#rationale-simplification-1-generated-enforcement-and-stale-surface-gates) | 生成物与陈旧表面门禁 |
| [rationale-simplification-1-ui-affordance-honesty](#rationale-simplification-1-ui-affordance-honesty) | UI 不展示无法履行的承诺 |
| [rationale-simplification-1-documentation-single-owner](#rationale-simplification-1-documentation-single-owner) | 文档入口/定位单一所有者 |
| [rationale-simplification-1-owner-local-layout-and-tests](#rationale-simplification-1-owner-local-layout-and-tests) | 路径即所有权，测试/指南就近 |
| [rationale-simplification-1-telemetry-no-duplicate-buffer](#rationale-simplification-1-telemetry-no-duplicate-buffer) | 遥测不复制规范日志 |
| [rationale-simplification-1-bounded-recurrence](#rationale-simplification-1-bounded-recurrence) | 固定频率、最新一次、批处理 |
| [rationale-simplification-1-one-send-one-turn](#rationale-simplification-1-one-send-one-turn) | 一次发送至多一个回合 |
| [rationale-simplification-1-automation-transport-boundary](#rationale-simplification-1-automation-transport-boundary) | 自动化协议不承担人类 UI |
| [rationale-simplification-1-activation-lifecycle-single-owner](#rationale-simplification-1-activation-lifecycle-single-owner) | 一个激活一个句柄/一次清理 |
| [rationale-simplification-1-non-transactional-loader-recovery](#rationale-simplification-1-non-transactional-loader-recovery) | 非事务加载器失败可见 |
| [rationale-simplification-1-team-direct-inbox](#rationale-simplification-1-team-direct-inbox) | 一个目标收件箱，不做第二发件箱 |
| [rationale-simplification-1-copy-only-preset-authoring](#rationale-simplification-1-copy-only-preset-authoring) | 预设只复制文件，不传任意文本 |
| [rationale-simplification-1-measured-micro-optimization](#rationale-simplification-1-measured-micro-optimization) | 热路径先测量，无无主缓存 |
| [rationale-simplification-1-decision-record-lifecycle](#rationale-simplification-1-decision-record-lifecycle) | 记录状态决定权威边界 |

### 三条硬边界

- **持久事实不能因为“UI 不读”而删除**：恢复/审计/计费也是消费者（见 `rationale-simplification-1-durable-audit-exception`）。
- **公开扩展事件/外部 API 不能因为“仓库内零调用”直接删除**：先判断外部承诺；不能判断时保留未知并写风险（见 `rationale-simplification-1-event-and-field-surface-pruning`、`rationale-simplification-1-pre-release-cutover-no-aliases`）。
- **默认组合的“未挂载”必须同时在依赖闭包层成立**：只把 row 设为 disabled、但基座仍依赖可选包，用户仍会下载载荷（见 `rationale-simplification-1-shipped-default-opt-in`）。

---

## rationale-simplification-1-simplification-owner-evidence-gate

**定位**：所有简化/新增的入口门。核心不是“代码越少越好”，而是每个保留/删除/新增的表面都有当前所有者、消费者或明确契约。

**触发**：删除抽象、状态机、配置项、公开方法/事件/包；新增默认值、公开操作集、格式或外部概念；有人用“未来可能”要求保留/新增。

**必须做**：

- 把待处理表面绑定到当前契约/生产消费者/明确所有者；测试、生成目录、文档、Note 自身不算消费者。
- 检查是否属于已记录的稳定接缝；若是，替换方案要击败原记录理由，而不是只引用本政策。
- 新增公开选择要有当前消费者证据或相关先例；否则要求显式取值或推迟。
- 拒绝用“保留但禁用/隐藏”逃避所有权：要么有明确生命周期，要么删除。
- 记录净删除（实现+专属测试+文档）与残余语义。

**步骤**：枚举使用点（排除测试/生成物/文档/自引）→ 为每个保留项写“谁在什么生命周期读” → 查 Note 状态 → 选删除/保留例外/显式契约 → 同提交迁移并更新生成物。

**完成信号**：精确搜索只剩声明/测试/生成物/历史 Note；构建与目录生成通过；每个保留项有一句可审计的所有者说明。

**失败/例外**：删除后出现未迁移调用者、陈旧目录或第二来源；或“未来可能”让无主表面继续累积。持久化/审计事实、已承诺扩展点、明确部署策略可以构成非 UI 消费者，但必须写出消费者与失败后果。

**源证据**：`deepseek-harness/packages/AGENTS.md:8-16@687f282e`；`deepseek-harness/AGENTS.md:139-143@687f282e`；rejected Notes `deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-fold-session-persistence-interface.md:1-31@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:1-37@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-12-prune-unused-skill-registry-api.md:1-29@687f282e`。

## rationale-simplification-1-single-source-durable-truth

**定位**：同一持久事实只能有一个权威来源；镜像、trace-only 行、重复表示必须折叠或证明可重建。

**触发**：事实已写 session log 又通过 `agent/*`/UI 再广播；两个消费者对同一 durable fact 用不同来源；为了 UI 复刻标题/usage/error/turn-step 边界/token 流；内存里同时维护数组、map、链表或多份快照。

**必须做**：

- 指定唯一权威来源（通常是 session event/log）；其他表示只能是可重建缓存/纯投影。
- 删镜像前确认事实仍由权威事件携带；会丢失则先并入承载事件。
- live-only 信号只用于“尚未持久化、可能被取消”的信息；进入日志后订阅日志。
- 需要 live 对象时按 id 解析或保留自有对象，不要求第二事件附带对象。
- 重复表示要有可重建证明和失效策略。

**步骤**：画事实生命周期（产生→持久化→广播→消费→回放）→ 标出每个消费者实际来源 → 把必要载荷并入权威事件 → 删除镜像声明/emit/文档/目录/专属测试，迁移消费者 → 用回放/快照/身份迁移证明旧记录可解释、新记录无第二来源。

**完成信号**：只订阅权威流的消费者能重建边界、token、标题；新日志不再出现独立 trace-only 行；旧记录仍可回放。

**失败/例外**：保留两个可写来源并让消费者“自己选”；删除日志中的持久事实只留 live 流；旧记录无法回放。纯派生缓存/UI 临时状态/未持久化入队信号可保留，但必须可随时重建且有失效点。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-collapse-trace-only-session-events.md:1-41@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-remove-agent-boundary-mirror-events.md:1-39@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-02-remove-stream-chunk-mirror.md:1-48@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-remove-agent-steering-mirror.md:1-34@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-22-tui-titles-from-session-title-service.md:1-36@687f282e`；当前 `deepseek-harness/packages/core/session/src/types.ts:391-399@687f282e`（full request header）与 `deepseek-harness/packages/core/session/src/request-header.ts:66-66@687f282e`。

## rationale-simplification-1-durable-audit-exception

**定位**：没有 UI 读取不等于可以删除。用于崩溃恢复、审计、计费、重放的持久事实可以没有 UI 消费者。

**触发**：待删事件/字段只有测试、不变量或快照读取；该事实用于恢复/审计/重放/计费/跨进程交接；为了“日志更简洁”准备合并边界。

**必须做**：

- 把 durable audit/replay/crash-repair 视为合法消费者。
- 删除前问：没有这条记录，恢复能否区分“未开始、已开始未完成、已完成、失败”？不能则保留。
- 保留时写出具体事实、读取者、失败后果；不用“以后可能有用”替代。
- 要删则给出等价恢复证明并写崩溃/回放测试。
- 不为了统一把不同生命周期边界塞进一个通用事件。

**步骤**：列读取场景（UI/恢复/审计/测试/外部）→ 构造进程在边界中途死亡的场景 → 检查剩余日志是否可判定 → 不可判定则保留并记录；可判定则补替代证明再删 → 用崩溃恢复/回放测试固定判定逻辑。

**完成信号**：恢复状态机能在 step 开始后、首条 chunk 前死亡时识别“已开始未完成”；审计能区分完成/失败/中断。

**失败/例外**：以“UI 不读”删除 step/end 却没有等价恢复证明；恢复出现歧义。纯展示冗余可删；只有不可重建事实受保护。

**源证据**：rejected `deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-drop-durable-step-boundaries.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-collapse-trace-only-session-events.md:1-41@687f282e`；`deepseek-harness/packages/core/session/src/types.ts:391-399@687f282e`；当前 step 边界仍写入 `deepseek-harness/packages/core/agent-loop/src/agent.ts:358-358@687f282e`。

## rationale-simplification-1-event-and-field-surface-pruning

**定位**：事件、字段、状态查询、请求开关的消费者清点。删除“每个实现都填但没人读”的表面，同时保留真正的注册/清理行为。

**触发**：字段被所有实现填充但生产只读一部分；事件/状态方法只有测试/生成目录/本包监听；请求开关无生产 setter 或适配器直接拒绝；结果回显调用方已拥有的信息；移除能力后注册事件/状态查询失去消费者。

**必须做**：

- 逐字段/事件列读取者，区分生产、测试、生成物、文档、仅写入。
- 删除只写字段时同步收缩 fake、schema、序列化、文档、测试。
- 删除注册事件时保留状态所有权：注册/注销直接改状态、缓存同步失效、查询按需读当前 map。
- 删除状态查询后，把调用方改为“执行成功或结构化选择错误”，不保留无人看的聚合状态。
- 公开扩展事件要说明是产品承诺还是内部通知；删除需记录外部监听风险。

**步骤**：生成使用矩阵 → 对每项写“删掉后哪个失败路径变差” → 同提交改接口/实现/fake/序列化/目录/文档/测试 → 事件删除补行为/HMR 测试 → 精确搜索旧拼写清零。

**完成信号**：旧字段/事件拼写不再存活；回滚/缓存失效仍正确；模型可见输出不变。

**失败/例外**：旧字段残留导致契约分叉；删除后回滚顺序/缓存失效回归。公开扩展若有外部承诺，走版本化弃用；内部事件可直接删。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-inert-request-knobs.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-unconsumed-web-observation-surface.md:1-35@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-prune-write-only-fs-surface.md:1-33@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-trim-acp-bridge-unreachable-surface.md:1-29@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-12-drop-unconsumed-skill-provider-events.md:1-30@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-12-prune-unused-web-seam-fields.md:1-28@687f282e`；proposed `deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-retire-prompt-registry-change-event.md:1-35@687f282e`。

## rationale-simplification-1-seam-role-and-payload-separation

**定位**：Service Definition、Provider、Policy/Consumer分层；文本策略消费已解码文本，版本校验与写入同临界区。当前文件系统接口另有有界原始字节/范围方法，不把文本策略规则扩大为整个provider禁字节。

**触发**：一个服务同时做后端 I/O、模型格式化、策略判断或工具路由；准备为“未来第二个后端”拆包但当前只有一个完整实现；消费者绕过策略直接调底层能力；删/合并接缝会改变缓存、版本校验或并发语义。

**必须做**：

- Definition 只定义提供方契约；Provider 实现存储/传输；Policy/Consumer 负责模型语义、授权、展示。
- 文本策略只消费provider一次完成UTF-8解码/二进制拒绝后的文本；当前 `FileSystem.readBytes/readByteRange` 为图片/范围等消费者保留有界字节能力。禁止的是文本策略自行重复解码，不是这些provider方法本身。
- 版本校验与写入由同一层闭合；策略层不得把 stale check 与 mutation 分开。
- 拆分必须有真实角色差异；只有一个提供方且无独立消费者时，保留单包并记录未来拆分条件。
- 直接使用底层服务要明确绕过策略的后果（如未观察导致 edit 拒绝），并在错误码/文档暴露。

**步骤**：列角色与生命周期 → 把模型格式化/窗口策略移出提供方 → 版本校验与写入同临界区 → 单提供方先不拆包 → 用直接调用/绕过路径测试确认失败显式可诊断。

**完成信号**：窗口读取后编辑未变化文件成功；未读取编辑返回显式错误；并发写入仍做版本校验；直接绕过路径有文档化后果。

**失败/例外**：策略被绕过、编辑覆盖未观察内容、拆出无人使用的空接缝。安全/审计接缝即使只有一个实现也可独立，但必须说明独立理由。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-06-26-fsspec-style-fs-seam.md:1-131@687f282e`；`deepseek-harness/packages/AGENTS.md:10-10@687f282e`；rejected `deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-fold-session-persistence-interface.md:1-31@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:1-37@687f282e`；当前 `deepseek-harness/packages/fs/fs/src/index.ts:205-287@687f282e`。

## rationale-simplification-1-service-consolidation-and-intent-api

**定位**：同一能力族被拆成多个公开服务/通用路由参数时，按调用意图合并；内部 descriptor/authorization/activation 解析留在管理器。

**触发**：每个 continuable 调用方同时需要两个服务；公开方法要求调用方提供只有内部管理器能解析的 descriptor/signal；多个方法只差调度策略/方向；恢复决策通过窄窗口公开命令回传。

**必须做**：

- 按意图命名：`start`、`startContinuable`、`sendMessage`、`followup`、`steer`、`inject`；不公开 `resume` 这类机制。
- 合并后一个公开服务键、一个错误分类；provider 能力通过可选钩子贡献，不获得生命周期权威。
- 调度策略固定在操作语义里（例如 Team send 固定 Steer），不给模型“quiet vs waking”的实现选择。
- 恢复决策用 waterfall typed action 返回；不要在 Agent 上保留可变 retry 窗口。
- 方向确有独立生命周期时保留明确命名，不用布尔/枚举参数掩盖。

**步骤**：列调用方真实意图 → 划公共生命周期 → 内部解析留管理器 → 意图命名公开操作、固定方向/调度 → 合并错误/服务键、删旧包/旧键/旧方法 → 用调用方迁移和失败分类测试证明最早暴露。

**完成信号**：调用方只注入一个服务即可完成普通/可续/消息操作；错误在最早可解析点暴露；旧服务键/方法不再出现在生成目录。

**失败/例外**：旧服务键/方法继续被外部使用；合并后内部机制重新泄漏为公开参数。两个方向有独立授权/持久化/取消语义时，保留两个操作更诚实。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-07-26-merge-subagent-control-service.md:1-42@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-27-intent-named-subagent-continuation-operations.md:1-39@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-27-request-error-retry-action.md:1-30@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-30-private-agent-send.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-30-team-send-message-steer.md:1-42@687f282e`。

## rationale-simplification-1-single-owner-product-and-package-boundary

**定位**：每个产品角色一个所有者；只有一个真实 app 消费者的 helper 不单独拆包；外部插件只保留一条分发路径。

**触发**：两个入口做同一件事，或一个入口只是 mock/教学版；helper 包只有一个 app 消费者；准备为“外部复用”保留无第二消费者的包边界；CLI 隐式选择产品。

**必须做**：

- 每个产品角色指定唯一所有者；删除重复入口，不给每个入口加兼容模式。
- 只有出现第二个独立消费者才提升 helper 为包；否则折叠进唯一 app。
- 入口显式：裸命令不能隐式选择产品；无入口的基座不能假装启动成功。
- 外部插件只保留一条路径（profile bundle），不同时维护仓库清单与包管理器。
- 删除入口时同删命令、leaf、SDK 接口、测试、文档、图节点。

**步骤**：列用户可见角色/唯一入口 → 标重复/教学/mock → 评估折叠/删除 → 入口改显式 profile/config，无入口启动失败 → 删除旧命令/包/leaf/接口/测试/文档/图节点 → 用构建、启动、产品 e2e 固定剩余入口。

**完成信号**：交互与非交互各一个可运行 leaf；裸启动无模式是用例错误；包图/命令表无旧入口。

**失败/例外**：旧入口通过别名间接保留；裸启动无入口却成功退出。教学/mock 入口若明确非产品且有独立预算可保留，但不得默认进入产品路径。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-fold-stdio-ui-helper.md:1-31@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-20-remove-stdio-and-echo-agents.md:1-50@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-03-explicit-config-dsh-entrypoint.md:1-46@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-04-remove-tui-package.md:1-40@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-09-remove-repository-plugin.md:1-45@687f282e`；当前 `deepseek-harness/apps/cli/src/args.ts:4-15@687f282e` 的 profile/patch 入口。

## rationale-simplification-1-composition-overlay-single-level

**定位**：共享基座 + 每个 surface 的 patch list，所有补丁在同一 include 层应用；不跨 include 嵌套。

**触发**：多个 surface 配置大量重复；准备多层 include 复用；overlay patch id 在当前 surface 不存在；个人/部署 overlay 要同时作用多个 surface。

**必须做**：

- 共享只放一个基座；surface 只写差异行和插入行。
- overlay 作为兄弟 patch list 同层应用；patch 不跨 include 边界。
- 明确 patch 语义：整块 config 替换，不自动合并；每行最终一个 bundle 层加用户层。
- 缺失 id 的 patch 保持 no-op 是有意行为，否则共享 overlay 会在不适用的 surface 失败。
- 用真实 Loader 启动检查 settled entries，不只读 YAML。

**步骤**：收敛共享行 → 每 surface 建 patch list → 同层应用 → 明确目标 row id、接受缺失 no-op → 真实 Loader 启动检查未加载/重复注册/冲突 → 文档写清整块替换限制。

**完成信号**：每个 surface 启动无未加载行；个人 overlay 能命中插入行；缺失 id 不导致无关 surface 失败。

**失败/例外**：overlay 跨 include 被丢弃、个人 patch 静默 no-op、两个 provider 注册同一服务导致启动失败。不同默认值放 surface bundle，不在共享基座加条件分支。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-07-29-shared-base-config-overlays.md:1-54@687f282e`；当前 `deepseek-harness/packages/bundle/base/README.md:82-90@687f282e`、`deepseek-harness/packages/bundle/base/README.md:133-136@687f282e`；`deepseek-harness/apps/cli/src/args.ts:4-15@687f282e`。注意旧 `apps/cli/config` 路径已被 profile/bundle 模型取代。

## rationale-simplification-1-shipped-default-opt-in

**定位**：可选/实验/诊断能力默认关闭，但保留包与显式恢复路径；依赖闭包也要同步。

**触发**：工具描述自己劝模型不要默认用；可选 provider 让每个安装下载平台 CLI/大载荷；开发诊断只在测试/自定义部署需要；实验 bundle 无稳定性承诺。

**必须做**：

- 默认组合只保留产品当前站得住的默认能力；可选/实验/诊断显式 opt-in。
- 优先“保留包、默认不挂载/disabled”，不要删除仍被显式组合使用的包。
- disabled 行要能由用户 patch 重新启用；删行会让用户无法恢复。
- 依赖闭包同步：基座不依赖可选 provider，否则“未挂载”仍下载载荷。
- README/注释写默认关闭理由、恢复方式、依赖关系。

**步骤**：列默认组合每个可选能力的安装/schema/失败成本 → 选 disabled 保留或独立 bundle → 同步依赖闭包 → 默认/opt-in 两组目录/启动测试 → 记录实验状态/无稳定性承诺。

**完成信号**：默认目录无未承诺工具；生产安装闭包无可选 provider 载荷；显式启用后出现且依赖完整。

**失败/例外**：默认会话出现未承诺工具；或可选 provider 仍被基座依赖。安全/审计必需能力不能因“重”关闭；判断标准是产品是否站得住，不是体积 alone。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-08-03-omit-invariants-from-shipped-config.md:1-31@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-12-production-dsh-excludes-product-subagent-providers.md:1-30@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-12-ralph-off-in-shipped-defaults.md:1-50@687f282e`；当前 `deepseek-harness/packages/experimental/ralph-bundle/cordis.patch.yml:1-16@687f282e`、`deepseek-harness/packages/experimental/ralph-bundle/README.md:12-12@687f282e`、`deepseek-harness/packages/boot/app-boot/src/profile.ts:225-225@687f282e`。

## rationale-simplification-1-default-roster-single-interface

**定位**：默认工具清单只保留一个重叠接口；包保留给显式 insert；minimal 组合独立声明自己的工具集。

**触发**：两个工具对普通文件检查/编辑重叠；默认 preset 出现重复 schema；minimal 工具清单被误当全局默认；准备“挂载但隐藏 schema”。

**必须做**：

- 默认组合只选一个文件编辑接口；base 拥有默认选择，surface/minimal 独立拥有自己的选择。
- 区分“默认不挂载”与“删除包”；包保留给显式 insert。
- 不用 presentation/filter 隐藏已挂载能力；隐藏层会让能力随展示配置重新出现。
- minimal 的单一接口契约由它自己的组合拥有，不从 base 继承后偷偷禁用。
- 用工具目录/模型请求断言默认与显式 opt-in 差异。

**步骤**：列重叠 schema/模型成本 → base 选定一个、minimal 独立声明 → 从默认组合移除另一 row（不是隐藏）→ 默认/显式 insert/minimal 三种目录测试 → README 写 opt-in 和 disabled row 限制。

**完成信号**：默认请求无重复 schema；显式 insert 后出现；minimal 只有其声明接口。

**失败/例外**：默认带重复 schema，或 minimal 契约被 base 默认污染。两个接口服务不同能力（结构化编辑 vs 通用写）时可同时保留，但必须说明不是重叠。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-08-10-default-presets-single-editor.md:1-26@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-03-minimal-profiles-persistent-shell-only.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-05-base-default-file-editor.md:1-32@687f282e`；当前 `deepseek-harness/packages/bundle/base/README.md:54-54@687f282e`、`deepseek-harness/packages/bundle/web-app/presets/minimal.patch.yml:12-23@687f282e`、`deepseek-harness/apps/cli/tests/profiles/sdk/keyless-smoke.e2e.ts:64-68@687f282e`（minimal 当前保留 tool-fs 仅供 image read，已不是 Note 36 的 editor 断言）。

## rationale-simplification-1-pre-release-cutover-no-aliases

**定位**：预发布期删除即完成迁移；不留 alias/兼容包/旧命令；已提交数据仍可解码。

**触发**：删除公开方法、事件、包、CLI 命令、配置键；有人建议兼容 alias/模式/包装包；旧名称只被文档/测试/旧 Note 引用；版本仍 pre-release/0.x。

**必须做**：

- 同提交迁移所有仓库调用方并删除旧名称；不留 alias、re-export、“deprecated”空壳。
- Note/README 记录删除和迁移路径，让用户改代码。
- 区分代码兼容与数据兼容：旧日志/文件仍能解码，旧 API 不必可用。
- 外部 API 先确认稳定承诺；未承诺按本机制，已承诺走版本化弃用。
- 删除后更新生成目录、命令表、文档、测试，旧拼写搜索清零。

**步骤**：列旧面调用方/外部承诺 → 一次性迁移新面、删旧声明/实现/命令/包 → 更新目录/文档/示例/测试、旧名称搜索验收 → 持久数据保留 decoder/migration → 发布说明写破坏性变化。

**完成信号**：全仓搜索/构建无旧名称；新入口 e2e 可用；旧日志仍可回放。

**失败/例外**：旧别名形成第二路径；或删除旧日志 decoder。已承诺稳定外部 API 需弃用周期；安全关键错误码/协议字段可能长期保留，但要有明确契约。

**源证据**：`deepseek-harness/AGENTS.md:7-7@687f282e`；`deepseek-harness/.agents/notes/archived/simplification/2026-07-20-remove-stdio-and-echo-agents.md:1-50@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-30-private-agent-send.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-03-explicit-config-dsh-entrypoint.md:1-46@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-04-remove-tui-package.md:1-40@687f282e`；proposed `deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-python-sdk-directional-client.md:1-34@687f282e`、`deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-retire-prompt-registry-change-event.md:1-35@687f282e`。

## rationale-simplification-1-durable-data-generation-boundary

**定位**：已提交日志/格式世代必须可解码/迁移；当前代码只写新形状；旧代码形状不自动兼容。

**触发**：修改 session event schema、字段名、事件种类或序列化格式；删除已发布/已写入事件/字段；引入新版本；准备用“兼容读取”保留旧代码。

**必须做**：

- 代码兼容与数据兼容分开：旧 API 可删，已提交数据必须有 decoder 或版本化 migration。
- 迁移只追加版本命名的后继，不移动/覆盖/删除已提交世代；前驱不自动意味着回退/降级支持。
- 当前 parser 可拒绝旧事件进入新日志，但读取旧日志的路径必须存在且被测试。
- 删除字段时保留 legacy decode 映射，不把旧字段重新引入当前事件模型。
- 用旧日志回放/种子校验/格式迁移测试固定边界。

**步骤**：列受影响世代与读取入口 → 决定当前写入形状、为旧世代加/留 decoder 或 append-only migration → 从当前代码删旧写入/API，保留只读映射 → 旧日志回放/种子/跨版本测试 → 格式文档写支持世代、拒绝行为、降级限制。

**完成信号**：旧日志能迁移进入当前模型；新日志只写当前形状；降级不支持时明确报错。

**失败/例外**：旧会话无法打开；当前日志混入旧形状；或为读旧日志重新引入旧写入路径。从未提交/仅测试产生的旧形状可不保留，但需真实发布证据。

**源证据**：`deepseek-harness/AGENTS.md:7-7@687f282e`；`deepseek-harness/.agents/notes/archived/simplification/2026-07-12-simplify-session-log-representation.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-22-plan-specific-collaboration-state.md:1-72@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-27-persistence-export-and-pre-release-trims.md:1-47@687f282e`、implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-09-26-team-direct-inbox.md:1-27@687f282e`；当前 `deepseek-harness/packages/core/session/src/types.ts:391-399@687f282e`。

## rationale-simplification-1-dependency-adoption-evidence

**定位**：手写基础设施替换为维护中的包/builtin，必须有净删除、健康度、边界拟合和闭包成本证据。

**触发**：手写解析器/协议/转换器/并发池而生态有成熟实现；准备引入新依赖；已有依赖/builtin 能覆盖门禁脚本；包体积/单文件闭包敏感。

**必须做**：

- 净删除：依赖替换真实拥有的实现+专属测试+文档，不是只加能力/未来可能性。
- 健康度：活跃维护、广泛使用、合理传递依赖；小而无维护的包不是简化。
- 边界拟合：包语义覆盖实际契约；残余手写语义计入成本。
- 尊重已记录稳定接缝（schemastery、vendored Cordis、twin adapters 等）；替换需击败原理由。
- 量化打包/安装成本；对单文件可执行/安全敏感闭包明确残余风险和排除项。
- 优先 builtin/已有依赖；不因一个 20 行删除新增 devDep，除非达到同一门槛。

**步骤**：列被替换代码/测试/文档/边缘 bug 成本 → 评估候选包健康/传递依赖/许可证 → 真实边界试接、列残余语义/失败差异 → 测量包体积/安装闭包、对可执行/安全目标做排除/替代 → 记录净删除与残余风险；只搬迁复杂度则放弃。

**完成信号**：手写实现+专属测试删除；契约/快照测试通过；包体积在预算内；残余 shim 有测试。

**失败/例外**：依赖引入后代码量未降、边缘行为回归、包体积/攻击面超预算。已记录稳定接缝不因本政策重开；安全关键解析器即使只删少量代码也可能值得，但需单独论证。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/simplification/2026-07-26-consolidate-gate-scripts-on-existing-deps.md:1-34@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-26-eventsource-parser-for-deepseek-sse.md:1-29@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-26-turndown-for-tool-web-html-markdown.md:1-38@687f282e`；当前 `deepseek-harness/packages/llm/llm-deepseek/package.json:47-47@687f282e`、`deepseek-harness/packages/web/tool-web/package.json:41-42@687f282e`。

## rationale-simplification-1-generated-enforcement-and-stale-surface-gates

**定位**：删除后用生成物、精确搜索、真实启动、回放/快照固定结果，防止旧名称/旧组合残留。

**触发**：删除事件、服务键、工具、命令、包、配置行；生成 API/事件/服务/组合目录；更新模型可见工具清单/preset；迁移配置组合/启动路径。

**必须做**：

- 旧名称精确搜索覆盖源码、测试、生成物、文档、配置。
- 更新生成目录/矩阵/图，并让生成检查在旧条目残留时失败。
- 用真实 Loader/启动测试验证组合，不只读 YAML/类型。
- 用快照/回放验证模型可见输出和记录会话。
- 只为旧表面存在的测试一并删除；保留测试验证行为而非旧名称。

**步骤**：确定旧表面所有表示 → 删除实现后精确搜索逐项清理/解释 → 重新生成目录、检查 diff → 启动/回放/快照验证 → 把“旧名称不得存活”写成门禁/评审清单 → 记录删除的测试，避免以数量冒充覆盖。

**完成信号**：旧名称在源码/生成物为零；默认/opt-in 目录与行为符合预期；回放/快照通过。

**失败/例外**：只删 emit 不删声明/目录；手改生成文件掩盖源定义；旧事件仍出现在目录。历史 Note/迁移文档可有意保留旧名称，搜索需排除记录而非删历史。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-remove-agent-boundary-mirror-events.md:1-39@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-unconsumed-web-observation-surface.md:1-35@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-12-drop-unconsumed-skill-provider-events.md:1-30@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-29-shared-base-config-overlays.md:1-54@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-10-default-presets-single-editor.md:1-26@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-12-ralph-off-in-shipped-defaults.md:1-50@687f282e`。

## rationale-simplification-1-ui-affordance-honesty

**定位**：UI 只展示能履行的承诺；装饰不得污染复制/交互；不可达的禁用态不保留。

**触发**：控件可见但无 handler/后端操作；只在几乎不可达状态可用；装饰/前缀会被选中进入剪贴板；装饰越界迫使 overflow 裁剪。

**必须做**：

- 可见控件必须有可用操作，或明确标注不可用并解释；不用“灰掉+tooltip”假装能力存在。
- 移除控件时同删 prop、golden、aria 文案、README 误导描述；缺失能力写进 Known Limitations。
- 复制区域每行前缀为零；角色区分用不进入剪贴板的样式（标题/间距/颜色）。
- 装饰不得越界；不用 overflow:hidden 掩盖无主 bleed，否则隐藏下一个布局错误。
- 删除为装饰存在的测试/裁剪时，保留能暴露未来越界的构造性约束。

**步骤**：枚举可见控件 handler/失败路径 → 无 handler 删除 → 检查出现状态是否可达 → 检查选中复制是否带装饰 → 移除装饰/专用裁剪/测试，用布局约束替代 → 更新 README/golden/aria。

**完成信号**：选中消息/代码块复制无前缀；死控件消失；删除装饰后真实溢出会暴露而非被裁剪。

**失败/例外**：死控件继续误导；复制带前缀；overflow 隐藏布局错误。明确禁用态可在可达边界保留并解释真实限制；不可达禁用态不应保留。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-07-27-copyable-transcript-no-gutter-bar.md:1-35@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-31-drop-user-message-edit-stub.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-06-user-bubbles-drop-the-branch-action.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-28-remove-hero-input-glow.md:1-30@687f282e`。

## rationale-simplification-1-documentation-single-owner

**定位**：产品定位、文档入口、教程/事实各有一个所有者；根入口导航到 quickstart，不渲染第二张 landing。

**触发**：准备新增文档首页/landing/功能摘要；同一安装/使用步骤出现在多个指南；README 与 JSDoc 重复同一契约；文档站根路径不是可操作入口。

**必须做**：

- 产品定位/功能摘要只由产品 landing page 拥有；文档根只导航到 quickstart。
- 每个事实一个 home：当前状态、限制、契约各写一处，其他位置链接。
- 文档变更与代码同提交；README/JSDoc 跟随行为更新。
- 根路由用相对重定向保留部署 base path；不渲染第二首页。
- 区分当前事实与历史 Note；历史记录不作当前指南。

**步骤**：列根/quickstart/landing 职责 → 根改重定向、删重复 landing/摘要 → 事实指定唯一 home、其余改链接 → 更新投影/导航测试，两种语言根到同一教程 → 代码变更同步 README/JSDoc。

**完成信号**：两种语言根都到各自 quickstart；文档站无第二 landing；同一事实不再多份漂移。

**失败/例外**：根仍渲染重复首页；同一事实多处漂移；代码变文档没变。历史/迁移文档可保留旧叙事，但必须标历史、不作当前入口。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-quickstart-documentation-home.md:1-32@687f282e`；`deepseek-harness/AGENTS.md:177-177@687f282e`；`deepseek-harness/packages/AGENTS.md:22-29@687f282e`。

## rationale-simplification-1-owner-local-layout-and-tests

**定位**：路径即所有权；测试、夹具、指南、示例就近放置；不用顶层 examples umbrella 决定依赖解析。

**触发**：准备把测试夹具/指南/示例放顶层 examples；一个 umbrella workspace 只为让嵌套配置解析包；包内测试依赖另一个包夹具；用户指南与包 README 重复同一配置。

**必须做**：

- 跨包 profile 测试放 CLI profile 测试目录；包内夹具放包 tests/fixtures；会话回放放 snapshots；用户指南放 docs/user；SDK 示例放 SDK 目录。
- 不用顶层 examples workspace 统一解析依赖；每个所有者声明自己的 manifest。
- 删除示例/指南/测试不改变无关包依赖解析。
- 可运行用户指南链接实际 shipped 资产，不链接任意 leaf。
- 包 README 的 Known Limitations 记录持久消费者缺口，普通清理留 TODO/Note。

**步骤**：按角色分类现有 examples → 每类移到所有者目录、更新 manifest/链接 → 删除顶层 umbrella 和仅为解析的 workspace → CI/文档从新位置发现测试/指南 → 更新路径文档。

**完成信号**：顶层无 examples；CLI profile 测试/包夹具/用户指南各自解析；删除任一指南不影响全局依赖。

**失败/例外**：测试/指南仍依赖 umbrella；删除一个示例导致无关包解析失败。真正跨包集成测试可集中，但要有明确集成所有者，不叫 examples。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-08-24-owner-local-profile-tests-and-guides.md:1-30@687f282e`；`deepseek-harness/packages/AGENTS.md:22-24@687f282e`；`deepseek-harness/packages/bundle/base/README.md:96-98@687f282e`。

## rationale-simplification-1-telemetry-no-duplicate-buffer

**定位**：遥测不复制规范日志；按需读取已提交前缀，触发时脱敏上传；用 handoff cursor 去重。

**触发**：遥测/分析需要在未来触发点上传历史；准备在事件投影时缓存脱敏副本；需要区分捕获时/上传时策略；同一会话可能多次触发反馈/上传。

**必须做**：

- 默认不注册会话/flush/操作监听器，不保留按事件数的副本。
- 触发时从规范日志读指定序列边界内前缀，按序深拷贝、运行当前脱敏策略；上传内容就是该前缀。
- 用对象键控 handoff cursor：同一对象只释放后缀，避免第二索引/重复上传。
- 明确边界：反馈事件已提交后监听器才运行，前缀包含反馈事件且不含后续后缀。
- 同步克隆/脱敏在非阻塞入队前；成本随未释放前缀增长，必须记录。

**步骤**：确认规范日志含所需事实 → 删除捕获期缓冲 → 实现 `captureSession(session, throughSeq?)` → handoff cursor 去重 → 测试无反馈不增长/反馈内容=前缀/重复反馈只后缀 → 记录“上传时策略”语义。

**完成信号**：无反馈长会话无界内存消失；反馈上传前缀与规范日志一致且含反馈事件；重复反馈不重传。

**失败/例外**：长会话无界内存；重复反馈重传；上传内容与日志不一致。需要“事件发生时策略快照”或日志外操作遥测时，独立有界存储并明确保留策略。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-08-06-buffer-free-feedback-telemetry.md:1-30@687f282e`；`deepseek-harness/packages/AGENTS.md:17-17@687f282e`。

## rationale-simplification-1-bounded-recurrence

**定位**：Every固定锚点、latest-only和有界批处理，冷会话不制造无界backlog。归档的Every-only/300秒/删除Cron决定是历史；固定提交现行协议有六种selector、Every下限60秒。

**触发**：产品只需要“每隔 N 秒提醒”；准备引入 Cron/时区/复杂日历；需要处理停机后错过的多次触发；多个提醒同时到期。

**必须做**：

- 以当前真实协议选择selector。现行支持 `after_seconds`、`at`、`every_seconds`、`daily`、`weekly`、`cron`；Every最小60秒。日历选择器保留自己的显式IANA时区合同，不能误按历史规则拒绝Cron/时区。
- 创建存首个目标；每次 dispatch 存 record id 和一个 wall-clock `acceptedAt`，整数运算选最新对齐 occurrence 并推进到下一个。
- 不重放每个错过区间；只取最新一次。
- 所有到期 Every 记录进入一个 follow-up batch，按 target/creation 排序；每条一个 occurrence、同一 decision time。
- due one-shot 优先于 recurrence batch；不用全局 gate 让无关提醒互相延迟。
- 记录范围耗尽/无效规则/超出安全整数的拒绝行为。

**步骤**：确认当前selector和日历需求 → 定义Every下限/锚点/acceptedAt/整数推进 → latest-only与有界批次/one-shot优先 → 对齐、推进、耗尽、无backlog及60/59边界分别验证。目标若已有日历支持，保持其独立合同；仅对真实不支持的输入显式拒绝，不盲删历史清单。

**完成信号**：停机很久恢复只产生当前最新一次；多个 overdue 合并一个 batch；one-shot 优先；无 turn 风暴。

**失败/例外**：漏区间逐个重放导致turn风暴或全局gate拖延无关提醒应拒绝。非法时钟/间隔显式失败；合法最后occurrence因下一四位年份UTC目标不可表示而结束，不承诺保留记录无限重试。每日墙钟不是每86400秒；真实日历/时区结果需单独验证。

**源证据**：历史 `deepseek-harness/.agents/notes/archived/simplification/2026-08-09-bounded-fixed-rate-schedule.md:1-45@687f282e`；当前 `deepseek-harness/packages/schedule/schedule/README.md:28-43@687f282e`。这里只修正知识与来源边界，没有执行目标调度器。

当前实现：`deepseek-harness/packages/schedule/schedule/src/domain.ts:33-37@687f282e`、`deepseek-harness/packages/schedule/schedule/src/domain.ts:782-823@687f282e`、`deepseek-harness/packages/schedule/schedule/src/domain.ts:1357-1387@687f282e`。

## rationale-simplification-1-one-send-one-turn

**定位**：每次 send 独立 FIFO 项；普通 send 不隐式批处理；保证“至多一个 turn”。

**触发**：队列/驱动循环会把等待中的多条消息合并；调用方用多次 send 表达独立工作单元；需要可预测 turn 边界/检查点顺序；准备为减少 model 调用自动批处理。

**必须做**：

- 每个成功 send 创建独立 FIFO 队列项；该项若运行，是所在 turn 的唯一普通消息。
- 保证“至多一个 turn”而非“恰好一个”：项可能在开始前被丢弃。
- 插入前检查 agent 状态，接受已标识、深冻结消息；splice 与 inbox 事件保留 MessageId，pending 可 replace/remove。
- 不静默合并；未来批处理必须显式、可测量、调用方可见。
- 用同栈、相邻 microtask、不同生产者、重入回调测试边界。

**步骤**：把 send 队列项建模为独立 FIFO + MessageId → 移除按当前等待集合合并 → 保留 pending replace/remove/取消 → 测试多生产者/时序每个消息独立 turn、built-stdio 两行两请求/边界 → 记录更多请求/检查点代价，批处理另立契约。

**完成信号**：A/B 两个 send 产生两个 FIFO turn；B 在 A 检查点后运行；两行输入两请求。

**失败/例外**：消息被合并、后一条在前一 turn 检查点前运行、MessageId 丢失无法取消。显式 batch/queue API 可有不同契约；普通 send 不隐式批处理。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-07-17-one-send-one-turn.md:1-45@687f282e`。

## rationale-simplification-1-automation-transport-boundary

**定位**：自动化协议只做自动化控制与已提交事实，不承担人类 UI/展示/编辑器卡片。

**触发**：自动化协议开始承担展示/导航/编辑器卡片；同一 transport 既服务 agent/controller 又服务人类 UI；能力广告与实际 route 不一致；准备把 token delta/结构化工具 UI 放进协议。

**必须做**：

- 只保留标准控制：session 创建/列表/恢复/关闭、单 in-flight prompt、模型配置、MCP 挂载、已提交语义更新、取消、并发 session、一次性权限回答。
- 人类交互/展示由 TUI/Web 拥有；自动化传输不投影 tool cards/diff/plan/title/picker。
- 能力广告真实：只有 durable attachment store + 精确 provider/model 支持图片时才 advertise；每次 prompt 快照 route、严格解码/保存。
- 自动化客户端收 committed message/reasoning/generic tool/config/usage，不收 token delta/结构化 UI。
- 协议外的 subagent backend 依赖标准边界，不依赖 UI 服务。

**步骤**：收缩 ACP 到自动化控制/已提交事实 → 删除 UI 投影/导航/picker/elicitation/注入服务 → 图片能力绑定真实 route/attachment → keyless ACP 套件验证 record/refresh/replay/cancel/permission → 明确人类 UI 仍由 TUI/Web 提供，不做兼容层。

**完成信号**：ACP 只发 committed 更新；无图片 route 不广告；取消/权限/并发 session 通过；无 UI 服务注入。

**失败/例外**：协议继续携带 UI 语义/编辑器依赖；能力广告与 route 不符。标准协议的通用 tool 通知/权限可保留，它们不是产品 UI 卡片。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-07-23-acp-automation-only-protocol.md:1-63@687f282e`；`deepseek-harness/packages/AGENTS.md:15-15@687f282e`。

## rationale-simplification-1-activation-lifecycle-single-owner

**定位**：一个激活一个句柄；创建、取消、结果、清理同属一个生命周期；结果在清理/通知后 settle。

**触发**：同一子任务有多个执行路径/驱动；调用方需要等结果但不需要多轮续聊；取消/清理/通知顺序在不同 provider 不一致；准备为同步 workflow 保留 one-shot driver。

**必须做**：

- 每个 provider 通过一个 `startActivation` 入口；句柄暴露子身份、结果 promise、该激活 disposal。
- 调用方 signal 只取消尚未发布/创建的激活；已发布激活取消走句柄。
- 结果 promise 在清理和通知后 settle；本地结果等待 pending input/owned descendants 关闭准入。
- 结构化工具/schema/instructions/terminal guard 附着一个激活并在结束关闭；cold resume 重建普通会话，不带旧 schema。
- 不为同步 workflow 保留第二套 Agent 生命周期。

**步骤**：把创建/取消/结果/清理收敛一个 activation → local spawn/fork 只提供 `prepareContinuable` 数据，服务拥有 Agent 创建/驻留 → 定义结果/disposal 顺序 → 删除独立 in-process driver/one-shot 生命周期、迁移 workflow → 用继承/捕获/cold resume/取消/结果-清理顺序测试固定。

**完成信号**：结果在清理/通知后 settle；dispose 只影响该激活；cold resume 无旧 schema；workflow 同步收集结果无需第二 driver。

**失败/例外**：结果清理前 settle、取消泄漏子进程、cold resume 带旧 schema、两套 driver 分叉。外部 provider 不需要多轮续聊，但仍共享激活取消/清理/结果契约，不能另起生命周期。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-09-17-unified-subagent-activations.md:1-49@687f282e`；`deepseek-harness/packages/AGENTS.md:9-9@687f282e`；`deepseek-harness/.agents/notes/implemented/simplification/2026-09-09-nontransactional-loader.md:1-35@687f282e`。

## rationale-simplification-1-non-transactional-loader-recovery

**定位**：非事务加载器：解析失败可在应用前拒绝；插件运行失败不自动回滚，失败可见、部分树可能保留。

**触发**：准备为配置/插件重载加入事务/自动回滚；Loader 变更开始复制上游生命周期机制；插件激活失败后调用方假设 await create 即成功；Include/parse 失败与插件运行失败需区分。

**必须做**：

- 解析/Include 校验失败可在应用前拒绝；插件运行失败不自动回滚，可能留下部分树和 failed fiber。
- Loader 急切应用 entry options；EntryGroup 并发启动兄弟并记录失败；EntryTree 等待未完成工作但不因 failed fiber 拒绝。
- 调用方需要“激活成功”时，必须在 settlement 后审计活动插件，不能只 await `Loader.create()`。
- 自动回滚需要独立未来决定和证据，不作为默认承诺。
- 文档/测试暴露部分应用状态和失败报告，不把回滚写成保证。

**步骤**：明确 parse/运行失败边界 → 移除事务候选/回滚/option identity、保留急切应用与失败日志 → 调用方 settlement 后审计、文档写部分树可能保留 → live-patch 测试失败报告/无回滚/后续恢复 → vendored 修改逐项登记。

**完成信号**：插件激活失败被报告、部分树保留、后续有效 patch 可恢复；parse/Include 失败应用前拒绝。

**失败/例外**：调用方以为失败已回滚继续用半应用配置；failed fiber 被静默忽略。解析失败仍尽量应用前拒绝；安全/数据关键插件可在上层补偿，但不是 Loader 自动回滚。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-09-09-nontransactional-loader.md:1-35@687f282e`；`deepseek-harness/packages/AGENTS.md:9-9@687f282e`。

## rationale-simplification-1-team-direct-inbox

**定位**：Team 新发送直接走目标 inbox，不做第二 outbox/ack/重试；admission 不等于模型处理；历史 mailbox 只解码/投影不投递。

**触发**：Team/群组消息准备维护自己的待发队列；需要 retry/ack/幂等/跨重启投递；历史 mailbox 仍在日志但不再投递；跨 root/兄弟发送需要 sender 归属。

**必须做**：

- 新发送走目标 inbox：live Lead Steer 或 host-only subagent Steer adapter；返回 accepted MessageId 或抛错。
- 接受遵循普通 Agent 持久化，不承诺模型处理/同步 flush；Team 不保留未接受意图、不跨重启重试、不去重显式重发。
- 历史 mailbox 记录仍可解码/投影以便旧 Lead 日志回放，但不再投递/ack。
- sender 归属用现有 `agent-message` source + 成员名，不扩大公共 sibling 权限。
- 失败对调用方可见；不把“已入队”说成“已处理”。

**步骤**：删除 Team outbox/ack/重试，改为调用目标 inbox → 返回 accepted MessageId、定义失败/取消/冷恢复 → 保留历史 decoder/projection、禁止投递 → sender 归属/冷恢复/失败/取消/历史不回放测试 → README 标 experimental 和无重试承诺。

**完成信号**：新发送返回 accepted MessageId；重启后未接受消息不重试；历史可投影但不投递；sender 归属正确。

**失败/例外**：第二套 ack/重试与 inbox 分叉；历史消息误投递；sender 归属错误。需要 durable send-intent/重试保证时，独立设计，不复制隐式 outbox。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-09-26-team-direct-inbox.md:1-27@687f282e`；`deepseek-harness/.agents/notes/archived/simplification/2026-08-30-team-send-message-steer.md:1-42@687f282e`；当前 `deepseek-harness/packages/experimental/agent-team/src/types.ts:129-136@687f282e`、`deepseek-harness/packages/experimental/agent-team/src/index.ts:140-145@687f282e`。

## rationale-simplification-1-copy-only-preset-authoring

**定位**：预设只按 id 复制文件；不通过浏览器传任意组合文本/路径；文件系统是唯一编辑器。

**触发**：Web/远程界面允许编辑组合/配置文本；用 schema 校验代替能力边界；需要把 composition 路径/内容暴露给浏览器；预设复制/编辑与运行中 generation 竞争。

**必须做**：

- 作者操作只接收 host 解析的两个 id（from/agentPreset）和可选显示名；路径/组合文本不跨浏览器 wire。
- host 侧整目录复制，symlink 解引用，权限收紧 owner-only（保留 owner-execute），元数据保留 description 但不保留源 name/order。
- 删除 write/editor/assertComposition；文件系统是唯一编辑器。
- 运行中 generation 用 mtime+size 检测变化并启动下一代，避免旧 generation 继续服务。
- authoring 操作集只含 read/copy/openDocument/remove，均不接受文件系统目标；用完整 Host API 认证。

**步骤**：write→host copy(id→id)、禁止路径/文本入参 → 删除 YAML 编辑器/形状检查 → 整目录复制/权限/元数据/mtime generation → Web UI/远程 API 只暴露 read/copy/openDocument/remove → 测试无路径/文本跨 wire、权限收紧、编辑后新 generation。

**完成信号**：copy 只接受 id；浏览器不发路径/组合文本；复制后权限 owner-only；编辑后下一 session 用新 generation。

**失败/例外**：浏览器可写任意组合/路径；`!!js` 在下一 mount 执行；编辑被旧 generation 忽略。本地 CLI/文件编辑仍可直接改文件；本机制限制远程/浏览器能力。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-08-08-copy-only-preset-authoring.md:1-31@687f282e`。注意固定提交的 preset registry 未完全保留该 Note 的 `copy/openDocument/remove` 方法名，应把具体 API 当历史，原则仍适用。

## rationale-simplification-1-measured-micro-optimization

**定位**：热路径优化先测量，再选局部算法改动；不用无所有权缓存换性能。

**触发**：profile 显示纯遍历函数在热路径有显著 self time；准备为扫描/投影加缓存；准备优化 image traversal/system prompt 但无测量；需保留 early exit/嵌套/tool-role 语义。

**必须做**：

- 先测量：profile/基准指出具体函数与成本；优化保留可观察语义。
- 优先局部算法改动（直接迭代/early exit），不引入全局状态/缓存。
- 缓存必须有不可变性证明/失效协议；浅冻结不够，不缓存可变嵌套内容。
- 测试空/冻结/嵌套/后续变更数组，以及 tool-role/file-handle 投影。
- 不把未测量的相邻优化塞进同一改动。

**步骤**：记录 profile 证据/调用频率 → 直接迭代替代递归回调，保留 early exit/traversal/other block false → 删除/避免无所有权缓存；需缓存先证明不可变+失效 → 内容/请求重构/恢复测试确认模型文本与 Session 格式不变 → 未测量优化列 out of scope。

**完成信号**：`contentHasFile` 对空/嵌套/tool-role/文件块正确、early exit 保留；模型可见文本/Session 格式不变。

**失败/例外**：优化改变嵌套/tool-role 语义，或缓存读到已变更内容。安全/正确性修复不需性能证据；本机制只约束以简化/提速为名的改动。

**源证据**：`deepseek-harness/.agents/notes/archived/simplification/2026-09-07-file-content-scan.md:1-33@687f282e`；当前 `deepseek-harness/packages/llm/llm/src/content.ts:136-136@687f282e`；`deepseek-harness/packages/AGENTS.md:11-11@687f282e`。

## rationale-simplification-1-decision-record-lifecycle

**定位**：Note 的目录/Status 决定权威边界；archived/implemented/proposed/rejected 不可混用；当前代码与 Note 冲突时，代码是事实状态，Note 是历史/意图。

**触发**：阅读 Agent Note 作为设计输入；准备实施 Proposal；引用 archived Note 的路径/命令/API；发现 Note 与当前代码不一致。

**必须做**：

- 先读 Status 与目录：implemented/archived 是已落地历史（archived 可能被后续决定取代）；proposed 未执行；rejected 是否决理由。
- proposed 的 Acceptance/Risks 只作计划，不得宣称已实现或已有自动保证。
- rejected 正文用于理解反例/代价；不把 Proposal 当待办，不删 `What we give up`。
- archived 的具体路径/命令/API 可能过时；引用原则前用当前代码/README 复核。
- 当前代码与 Note 冲突时，把漂移写进迁移说明，不静默按旧 Note 实施。

**步骤**：读 Status/目录/链接 → 区分 Problem/Decision（历史）与 Proposal/Acceptance（计划）与 What we give up（否决代价）→ archived 具体机制做当前代码/README 复核 → 迁移文档注明“历史 Note + 当前实现状态” → 发现漂移更新/补 Note。

**完成信号**：proposed surface 仍存在时迁移不声称已删除；rejected surface 仍存在且理由保留；archived 旧 CLI 与当前 profile 不一致时以当前为准并记录。

**失败/例外**：把 proposed 当已实现、rejected 当待办、archived 旧 API 当现状。同一 Note 可部分 supersede 另一 Note，必须读链接和范围说明，不能只看标题/状态。

**源证据**：implemented `deepseek-harness/.agents/notes/implemented/simplification/2026-07-17-one-send-one-turn.md:1-45@687f282e`；proposed `deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-config-only-hmr.md:1-36@687f282e`、`deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-prune-stream-visibility-helpers.md:1-35@687f282e`；rejected `deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-drop-durable-step-boundaries.md:1-32@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-19-fold-compaction-package-split.md:1-37@687f282e`。

---

## 60 篇 Note 的状态与去向（覆盖索引）

下表只给一行去向；完整正文范围、逐篇理由与未绑定项在 `research/rationale-simplification-1-coverage.json`，各机制末行给出固定提交精确引用；本表本身不作为独立来源证明。所有 Note 都已读英文+中文正文；sidecar 只做机械格式检查。

| # | Note（简写） | 状态 | 去向 |
|---|---|---|---|
| 1 | collapse-trace-only-session-events | archived | 折叠 usage/error 到承载事件；当前仍无独立 usage/error。 |
| 2 | remove-agent-boundary-mirror-events | archived | 删 turn/step 边界镜像；session/event 单一来源；当前镜像名不存在。 |
| 3 | fsspec-style-fs-seam | archived | fs provider/policy/tool 分层；当前 fs 方法/观察策略仍在。 |
| 4 | remove-stream-chunk-mirror | archived | 删 agent/stream-chunk；当前无该事件。 |
| 5 | drop-inert-request-knobs | archived | 删无端到端路径的 prefill/strict；当前无该请求面。 |
| 6 | drop-unconsumed-web-observation-surface | archived | 删 providers-change/status；当前无这些拼写。 |
| 7 | fold-stdio-ui-helper | archived | 单消费者 helper 折叠；后被 note 14 整体删除 stdio 产品。 |
| 8 | prune-write-only-fs-surface | archived | 删只写字段/死路由；类型与 fake 随正文收缩。 |
| 9 | remove-agent-steering-mirror | archived | 删 steering 镜像；保留 live queued + durable steering。 |
| 10 | trim-acp-bridge-unreachable-surface | archived | 删不可达 branding/kind fallback；ACP 不再投影 tool cards。 |
| 11 | drop-unconsumed-skill-provider-events | archived | 删 skill provider 事件；当前无该拼写。 |
| 12 | prune-unused-web-seam-fields | archived | 删结果回显/请求超时等无消费者字段；保留安全边界。 |
| 13 | simplify-session-log-representation | archived | surface 数组化、full request header；当前 request/header 仍在。 |
| 14 | remove-stdio-and-echo-agents | archived | 删重复产品入口；交互/非交互各一；无兼容包。 |
| 15 | plan-specific-collaboration-state | archived | 删通用 mode registry，plan 专用包/布尔状态；当前 plan-mode 仍在。 |
| 16 | tui-titles-from-session-title-service | archived | 标题单一服务；TUI 已随后删除，原则仍适用。 |
| 17 | consolidate-gate-scripts-on-existing-deps | archived | 共享 mdast fence/parseArgs，删重复扫描器。 |
| 18 | eventsource-parser-for-deepseek-sse | archived | SSE 交给 eventsource-parser；当前依赖仍在。 |
| 19 | merge-subagent-control-service | archived | 合并 subagentControl 到 subagents；当前无旧键。 |
| 20 | turndown-for-tool-web-html-markdown | archived | 正则 HTML→MD 换 turndown；当前依赖仍在。 |
| 21 | copyable-transcript-no-gutter-bar | archived | TUI 去 gutter；TUI 已删，产品 UX 历史。 |
| 22 | intent-named-subagent-continuation-operations | archived | start/startContinuable/sendMessage 意图 API；当前 sendMessage 仍在。 |
| 23 | request-error-retry-action | archived | waterfall typed retry action；当前 RequestErrorAction 仍在。 |
| 24 | shared-base-config-overlays | archived | 共享基座+单层 overlay；当前已迁 profile/bundle，原则仍适用。 |
| 25 | simplify-web-image-input-v1 | archived | 有界批量/存储前验证；部分被后续统一图片管线扩展。 |
| 26 | private-agent-send | archived | 公开 followup/steer/inject，send 私有；当前无 SendOptions 公开面。 |
| 27 | drop-user-message-edit-stub | archived | 删无 handler 编辑控件；当前分支/复制 UI 继续演进。 |
| 28 | explicit-config-dsh-entrypoint | archived | 显式 `--config` 入口/无兼容别名；当前已改 profile/patch，机制原则保留。 |
| 29 | omit-invariants-from-shipped-config | archived | shipped 不挂不变量诊断；当前 bundle 仍无 invariants。 |
| 30 | remove-tui-package | archived | 删 TUI 包；当前无 packages/ui/tui。 |
| 31 | buffer-free-feedback-telemetry | archived | 反馈遥测按需读日志前缀；不复制无界缓冲。 |
| 32 | user-bubbles-drop-the-branch-action | archived | 用户/steering 气泡不再 branch；只 settled answer 可 fork。 |
| 33 | copy-only-preset-authoring | archived | 预设只复制文件、不传任意 YAML；当前具体 API 有漂移，原则适用。 |
| 34 | bounded-fixed-rate-schedule | archived | 只留 every_seconds，最新一次+批处理；当前 every_seconds 仍在。 |
| 35 | remove-repository-plugin | archived | 外部插件只留 profile bundle；当前 repository plugin 移除。 |
| 36 | default-presets-single-editor | archived | 默认 preset 只留一个 editor；minimal 断言已被 43/44 取代。 |
| 37 | quickstart-documentation-home | archived | 文档根重定向 quickstart，删重复 landing。 |
| 38 | production-dsh-excludes-product-subagent-providers | archived | 可选 provider 不进 base 闭包；独立 bundle。 |
| 39 | owner-local-profile-tests-and-guides | archived | 删顶层 examples，路径即所有权。 |
| 40 | persistence-export-and-pre-release-trims | archived | persistence export 收窄；无 supportsRaw/locate 公开面；具体 export 形状属 handle 重构前历史。 |
| 41 | remove-hero-input-glow | archived | 删 glow 及其无主 overflow 裁剪。 |
| 42 | team-send-message-steer | archived | Team 单 send_message 固定 Steer；TeamMessageSnapshot 无 scheduling 字段。 |
| 43 | minimal-profiles-persistent-shell-only | archived | minimal 只留持久 shell；当前 minimal 另保留 tool-fs 的 image read，具体“无 fs 工具”断言漂移。 |
| 44 | base-default-file-editor | archived | base 默认 read/write/edit，不挂 editor；当前仍成立。 |
| 45 | file-content-scan | archived | 热路径直接迭代，无无主缓存；当前 contentHasFile 直接迭代。 |
| 46 | ralph-off-in-shipped-defaults | archived | ralph 默认关闭/opt-in；当前已迁 experimental/ralph-bundle，更强。 |
| 47 | one-send-one-turn | implemented | 普通 send 独立 FIFO，不隐式批处理。 |
| 48 | acp-automation-only-protocol | implemented | ACP 只做自动化/committed facts，不做 UI。 |
| 49 | nontransactional-loader | implemented | Loader 非事务，失败可见不回滚。 |
| 50 | unified-subagent-activations | implemented | 一个 startActivation 生命周期/结果/清理。 |
| 51 | team-direct-inbox | implemented | Team 直接目标 inbox，无第二 outbox/重试。 |
| 52 | config-only-hmr | proposed | 未执行；HMR 模块替换仍在。 |
| 53 | prune-stream-visibility-helpers | proposed | 未执行；五个 visibility 函数仍在。 |
| 54 | python-sdk-directional-client | proposed | 未执行；Python reverse RPC 仍在。 |
| 55 | retire-app-bin-boot-helpers | proposed | 未执行；resolveConfigPath/loadEnv 仍导出。 |
| 56 | retire-prompt-registry-change-event | proposed | 未执行；system-prompt/change 仍存在。 |
| 57 | drop-durable-step-boundaries | rejected | 保留 step 边界；当前 step/start/step/end 仍写入。 |
| 58 | fold-session-persistence-interface | rejected | 保留独立持久化包；当前 session-persistence 仍在。 |
| 59 | prune-unused-skill-registry-api | rejected | 保留 register/扩展面；当前 register 仍在。 |
| 60 | fold-compaction-package-split | rejected | 保留 compaction/compaction-basic 分包。 |

---

## 未绑定与证据限制

- 本文件只覆盖 `rationale-simplification-1` 的 60 篇 Note。链接到的其他 Note（例如 profile-plugin-bundles、single-dsh-application-launcher、log-backed-session-titles、capability-seams、agent-teams）正文未在本分区读取；相关跨域关系在 coverage 中标记为 `linked-other-owner-coverage`，不把“有 owner”当成已绑定证据。
- 当前代码抽查用于识别历史漂移，不是运行时验证。所有 positive/rejection/recovery 场景在 knowledge 中标为 `planned`；没有执行构建、测试、lint、远程操作或目标仓库变更。
- Note 33、36、43、46 等存在具体机制漂移；本文件已分别注明，不把旧断言当现状。Note 28 的 `--config` 已被当前 profile/patch 入口取代；Note 24 的 `apps/cli/config` 路径已迁到 bundle 模型。
- sidecar 检查：46 篇 archived 使用“双 blob 哈希”格式，14 篇 implemented/proposed/rejected 使用“逐标题 en/zh 哈希”格式；两者都只证明配对记录存在，不证明译文语义等价。Note 48 的中英文行数不同（63/65），已按全文阅读处理，没有据此声称结构完全一致。
