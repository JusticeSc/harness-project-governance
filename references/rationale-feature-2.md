# DeepSeek Harness 项目治理机制参考（rationale-feature-2）

本参考从固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 89 篇 feature Note 英文正文与 89 篇中文对照中独立提取。每篇均记录实际阅读范围；本文件只写可由这些 Note 正文支持的机制，不把 Note 自称的验证当成已在目标项目执行的结果。

**证据等级**：来源均为 Note（设计决策记录），`kind=history`。标注 implemented 的 Note 是固定提交时的当前记录；标注 archived 的 Note 是历史提案，机制可迁移，但其文件位置、命令名、UI 入口或实现细节可能已被后续决策取代，采用前必须重验。

**非主张**：本包没有在目标项目运行构建、测试、lint、格式化或远程操作；没有实现自动检查器；没有证明任何机制已部署或被强制执行。文中的“完成证据”是采用者应规划并实际执行的验证，不是本次提取的结果。

**覆盖说明**：89 对正文全部阅读。其中 2 对（`new-session-clears-to-empty-state`、`tui-question-dialog-multiline`）为纯产品/UI 行为，正文未新增治理机制，已在 coverage 的 disposition 中明确标注为 product-only；其余 87 对至少支撑一个机制。任何“Note 验证通过”的说法都只是源项目自述，本包未复跑。

## 如何使用

- 按“触发场景”找到机制；先读该机制的硬性要求，再按步骤落地。
- 一个变更通常同时触发 3–6 个机制；用文末交叉检查表做一次覆盖。
- 机制编号 `rationale-feature-2.<slug>` 与 `knowledge/rationale-feature-2.json`、`research/rationale-feature-2-coverage.json` 一致。
- 引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e` 指向本机制所依据的 Note 正文范围；需要判断时回到原文，不要只依赖摘要。

## 机制索引

| # | 机制 | 触发场景（摘要） | 主要失效 |
|---|---|---|---|
| 1 | [权威上下文来源与作用域](#authoritative-context-sources) | 当你加载指令、读取会话/工作区状态、引入个人配置，或使用搜索索引、清单、渲染文档等派生结果时。… | missing scopes are explicit; transient instruction errors retain the prior scope; a header mismatch is a typed query error |
| 2 | [变更纪律：范围、取代、例外与发布](#change-discipline) | 当撰写 Agent Note/ADR 或 PR、替换既有决策、增加协议或抽象、改变默认值、删除/… | review rejects undocumented scope/supersession; stale docs fail a link/consistency check |
| 3 | [危险动作审批与授权证据](#dangerous-action-approval) | 当启用 danger-full-access/更宽沙箱、中断运行中的子代理、接受持久权限预设、注… | denied/unavailable result; state untouched; auditable refusal |
| 4 | [缺失即拒绝的安全默认](#fail-closed-defaults) | 当没有审批回答者、权限模式未知或会话锁定、无适配器服务所选模型、提供商缺少能力、配置缺失/非法、… | typed refusal/unavailable; no partial effect |
| 5 | [在真实执行边界强制](#enforcement-placement) | 当添加触发特权操作的 UI 控件、暴露 RPC/路由、执行限制、渲染不可信内容、校验模型路由或删… | typed denial/error before side effect; a scan violation fails the check |
| 6 | [持久状态完整性与生命周期权威](#durable-state-integrity) | 当准入、锁、计划生命周期、恢复/回放、进度显示、工作区删除、工作流记录、文件存储或文件监听依赖“… | typed conflict/not-found/invariant errors; a failed optional recording is an explicit warning, not silent data loss |
| 7 | [日志可重建性：记录模型所见](#logging-reconstructability) | 当增加模型可见值、格式化工具结果、命名工具/提供商、记录时间/位置、持久化子代理目录，或回放会话… | missing/duplicate/misordered nodes fail reconstruction; a collision produces a deterministic error |
| 8 | [单一来源与去重](#single-source-and-dedup) | 当增加第二个界面（Web/TUI/headless）、为服务端规则添加客户端检查、创建缓存/镜像… | duplicate divergence is a review failure; a bypass test fails |
| 9 | [创建时固定策略、修订栅栏与配置形状](#pinned-policy-and-config) | 当创建/恢复/分叉会话、修改 provider 或权限设置、保存设置段、升级依赖，或基于先前读取… | typed stale/validation error; no overwrite; no silent default |
| 10 | [能力协商与接口投影](#capability-and-interface-negotiation) | 当增加 provider/model/effort 选择、寻址子代理或分叉、启动 shell 工… | mount/config error or typed refusal; never silently drop an option |
| 11 | [有界、原子、可取消的多步操作](#bounded-operations) | 当并发执行工具/子代理、启动 shell 作业、发布服务或 UI、监听文件、申请容量、失败重试或… | typed diagnostic/cancelled status; no unbounded queue; no partial publication |
| 12 | [不可信内容与边界校验](#untrusted-boundary) | 当摄取外部文档/网页、渲染模型或工具输出、命名 MCP 工具、打开 URL、展示子进程诊断，或在… | reject/refuse with a safe diagnostic; no partial raw fallback |
| 13 | [特权本地能力与密钥处理](#privileged-capability-and-secrets) | 当从 Web UI 调用宿主机能力（原生对话框、打开系统路径）、保存提供商凭据、启动子进程、选择… | denied or typed unsupported error; secrets are not written; duplicate keys fail at load |
| 14 | [同意门控与数据最小化](#consent-data-minimization) | 当收集遥测/诊断、启用调试导出、提交反馈、回放录制会话，或增加后端 exporter 时。… | disabled mode sends nothing; unknown mode fails before setup; reentrant emit is impossible |
| 15 | [证据诚实、可操作诊断与显式缺口](#honest-evidence) | 当报告完成或调试、写诊断/错误、显示实时状态/进度、撰写验证、回答“未找到/不支持”、回放 fi… | overclaim is a review finding; a divergent replay fixture fails loudly |
| 16 | [tmux 位置上下文（条件性子契约）](#tmux-location-context) | 当某个 surface 需要自身 tmux session/window/pane/layout，并通过 shell 拉取后注入持久历史时。 | tty 不匹配/缺 seam 时 no-op；重复注入或进程内缓存失败 |

<a id="authoritative-context-sources"></a>
## 1. 权威上下文来源与作用域

`rationale-feature-2.authoritative-context-sources`

**适用**：当你加载指令、读取会话/工作区状态、引入个人配置，或使用搜索索引、清单、渲染文档等派生结果时。

**硬性要求**

1. 按会话 cwd 解析指令作用域；每个类别由最近目录胜出，根级/全局配置只能作为已文档化的回退。
2. 每个目录只让已文档化的主文件胜出；`.local`/数据叠加层是增量用户数据，不得改写已提交策略。
3. 个人偏好与凭据放在提交文件之外、harness home 之下，并用唯一共享解析器定位该 home。
4. 指令符号链接解析到普通文件才加载；解析结果是非文件则视为确认缺失；解析/stat 暂时异常时保留已加载作用域，不删除。
5. 加载所有存在的候选，按配置顺序；仅在同一目录内对去除首尾空白后字节相同的内容去重，保留最早者并渲染原始字节；不得全局去重。
6. 精确读取已知会话时先读 live store，不读持久层；读持久层必须证明存在，并拒绝 header/list 不一致；live header 胜出，live 与持久可用性独立报告，不缓存持久元数据。
7. SQLite 搜索、清单、生成的参考等派生结果一律可丢弃、可重建；不得用它们授予可见性或扩大授权，schema 版本变化时重建。
8. 任何上下文增强都有显式预算；发生截断必须显式报告，不能把部分上下文当成完整。

**条件性子契约**：若某 surface 需要自身 tmux 位置，见 [16. tmux 位置上下文](#tmux-location-context)；它不改变本节指令/状态解析规则，也不是默认启用项。

**操作步骤**

1. 解析会话 cwd/工作区，列出该位置声明的全部指令作用域。
2. 从规范路径读取候选，记录每个作用域胜出文件与增量层，并应用符号链接与去重规则。
3. 回答状态问题时读取权威 live 记录或已证明的持久记录；派生索引只用于发现。
4. 使用派生前先回读权威记录；记录预算截断与未读范围。
5. 用嵌套指令、跨目录泄漏、live/持久冲突、暂态符号链接错误做回归。

**完成证据**：记录每个作用域的实际来源、去重结果与截断；冲突产生类型化错误，而非静默选择缓存；暂态错误保留旧作用域并有可观察说明。

**失败与例外**：文件损坏或 header/list 冲突必须显式失败；不得用未经验证的索引声称“文件不存在”。个人层位置与优先级属于项目 owner 决定，代理不得自创。

**证据边界**：固定提交中多篇 Note 属归档历史，入口模式与文件名后来被取代；迁移项目须重新确认当前仓库事实。去重只按字节，语义相同但格式不同者都会加载。派生索引不保证即时收敛。

**审查问题**：A generated index is used directly to claim a file does not exist; the check fails because the authoritative read was skipped；An instruction candidate from a sibling directory leaks into the session; the scope test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-06-24-workspace-context.md:1-90@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-10-session-query-service.md:1-43@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-20-dsh-cli-personal-config.md:1-52@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-21-follow-instruction-symlinks.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-21-instruction-load-all-dedup.md:1-38@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-27-web-session-search.md:1-45@687f282e`

<a id="change-discipline"></a>
## 2. 变更纪律：范围、取代、例外与发布

`rationale-feature-2.change-discipline`

**适用**：当撰写 Agent Note/ADR 或 PR、替换既有决策、增加协议或抽象、改变默认值、删除/迁移文档、规划发布时。

**硬性要求**

1. 明确写出非目标，以及哪些接口/状态/契约保持不变。
2. 精确指出被取代的旧决策或段落；只改了一部分时不得把整篇文档标为过时。
3. 记录有意例外与被否方案及观察到的原因，不擦除历史。
4. 优先标准词汇/协议子集；任何扩展必须公开文档化。
5. 未产生实现用途前不引入公开契约，保持 seam 内部。
6. 新行为先 opt-in、在真实组合中验证，再另一步改默认；已存选择需显式迁移。
7. 保持唯一权威叙述：更新/取代既有 Note，不留互相矛盾的活跃文档。
8. 归档 Note 作为历史保留并标记 archived，不把它改写成当前权威。
9. 任何公开元数据/manifest 变更都必须显式修改测试契约；路径前缀部署必须同时重审所有绝对链接、身份、作用域与图标 URL。

**操作步骤**

1. 按仓库格式写问题、决策、替代方案、后果。
2. 列出非目标与不变契约。
3. 引用被取代的精确决策与新权威。
4. 在最小 seam 实现并在实际组合中测试。
5. 更新配对文档/索引，标记过时内容但不删除历史。
6. opt-in 发布、测量，再切换默认并给出迁移与回滚。

**完成证据**：新 Note 能让人追踪被取代决策与不变契约；默认切换发生在 opt-in 与测量之后；归档保留历史，索引不把其当当前权威。

**失败与例外**：紧急修复可先落地，但同变更或紧随其后必须补齐 Note/取代说明并指定 owner。公开协议扩展若无文档用途应被拒绝。

**证据边界**：源仓库的 Note 格式与流程属于其自身项目，不能整体照搬；文档检查不能证明语义正确；通过测试不等于被采用。

**审查问题**：A change deletes an earlier note instead of archiving it; the history check fails；A public protocol flag is added without a documented use; review rejects it；A manifest field changes without updating the built-artifact contract test; the check fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-28-dsh-guided-skill-session-commands.md:1-44@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-01-pwsh-tool-and-executor.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-web-install-manifest.md:1-40@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-05-web-preview-product-badge.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-durable-workflow-runs-in-chat.md:1-46@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-out-of-process-subagent-minimal-diagnostics.md:1-87@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-fire-and-forget-webhook-sessions.md:1-59@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-standard-acp-automation-controls.md:1-80@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-26-shell-execute-projection-and-jobs-at-start.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-01-web-elevation-stroke-shadows.md:1-43@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-continuable-activation-capacity.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-27-desktop-cli-runtime.md:1-42@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-14-built-in-plugin-feature-previews.md:1-27@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-08-windows-acl-restricted-token-sandbox.md:1-53@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-06-15-ptc.md:1-138@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-15-deepseek-search-fetch-api.md:1-84@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-17-sidebar-file-and-directory-auto-refresh.md:1-345@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-02-web-thinking-tail-scroll.md:1-32@687f282e`

<a id="dangerous-action-approval"></a>
## 3. 危险动作审批与授权证据

`rationale-feature-2.dangerous-action-approval`

**适用**：当启用 danger-full-access/更宽沙箱、中断运行中的子代理、接受持久权限预设、注册审批回答者，或经协议暴露控制操作时。

**硬性要求**

1. 所有权限选择器共用同一个确认组件；启用动作在显式勾选确认框前保持禁用。
2. 所有取消路径（Cancel、Escape、关闭、遮罩）不提交任何内容，保持当前预设并重置确认框。
3. 会话锁定或授权理由消失时撤销放宽模式；重新进入时重置确认状态。
4. 审批建模为单一服务与闭合词汇；谁来答、是否会话被询问属于注册回答者与 per-session tier 的策略，不放进机制。
5. 零回答者时拒绝，绝不默认允许。
6. 控制操作同步授权并返回最小结果；除非显式生命周期操作，不得级联释放/处置。
7. 把接受的模式及来源记录为持久证据；已是目标模式的无操作按 accepted no-op 处理，不重复写审计。
8. 只为实际效果（安装/写入/执行）要求批准，纯读取且不改变任何状态的发现操作不需要批准；新增会引入代码来源的索引/来源属于特权变更。

**操作步骤**

1. 分类请求操作与所需权限。
2. 解析会话策略与可用回答者。
3. 呈现最窄确认并要求显式勾选，启用动作保持禁用。
4. 批准后应用模式、记录授权与审计对，并按作用域执行。
5. 拒绝/取消时保持旧状态，必要时记录拒绝。
6. 会话锁定或理由消失时重新检查/撤销。
7. 覆盖所有取消路径、零回答者与重复同模式请求。

**完成证据**：启用全权限必须勾选；批准后记录模式并按模式执行；重复请求已激活模式不产生重复持久写；Escape 关闭后旧预设不变且无批准事件。

**失败与例外**：审批 UI 只能降低歧义，不能消除社会工程；持久审计不证明操作安全。per-session 策略分级属于产品政策，必须显式定义。平台级紧急覆盖只能文档化、可见并独立审计。

**证据边界**：危险动作清单随产品变化；未列入的操作仍可能扩大权限。审批证据只说明授权，不说明执行结果。

**审查问题**：Pressing Escape dismisses the dialog but leaves the old preset; no approval event is written；With no answerer, the dangerous call is denied rather than allowed；A read-only market discovery call demands approval while an install proceeds without it; the approval-placement test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-31-gui-full-access-confirmation.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-continuable-subagent-interrupt.md:1-49@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-out-of-process-subagent-minimal-diagnostics.md:1-87@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-standard-acp-automation-controls.md:1-80@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-16-sandbox-same-mode.md:1-24@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-discover.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-06-approval-seam.md:1-139@687f282e`

<a id="fail-closed-defaults"></a>
## 4. 缺失即拒绝的安全默认

`rationale-feature-2.fail-closed-defaults`

**适用**：当没有审批回答者、权限模式未知或会话锁定、无适配器服务所选模型、提供商缺少能力、配置缺失/非法、Web 可能公网绑定、插件未挂载时。

**硬性要求**

1. 零回答者时每次审批 ask 解析为 unavailable，工具调用拒绝；不加载该 seam 就是显式的 fail-closed 退出。
2. 未知的直接构造权限值在读取任何 transport/setup 前失败；未知模式绝不被归一为宽松默认。
3. 在真实操作边界（如 session.prompt）于开启 turn 前拒绝无适配器的模型；禁用输入框只是客户端提示。
4. 只有确认能力后才启用功能；settings 启用但 provider 未声明该能力时，插件挂载失败。
5. 本地 Web 绑定 loopback 并拒绝公网 host 值；认证不能悄悄扩大部署契约。
6. 配置按 absent/default/override 三态校验；未知 key/value 拒绝而不是忽略。
7. 初始化未完成或必需依赖失败时报告不可用且不产生副作用；不发布半就绪状态。
8. 配置/schema 导出只能部分支持时，仍可输出可用内容，但必须报告 `complete:false` 并以非零退出；消费者必须先读诊断，不能把近似文档当成完整可用。

**操作步骤**

1. 枚举该操作的缺失/未知/错误状态。
2. 判定哪些必须视为拒绝/不可用。
3. 把检查放在首个副作用或 setup 读取之前。
4. 返回类型化、可操作的拒绝，保持旧状态不变。
5. 覆盖零回答者、未知模式、无模型、公网绑定等负向用例。

**完成证据**：零回答者时危险调用被拒绝；公网 host 被拒绝，服务保持 loopback；缺失能力时挂载失败且注册无残留。

**失败与例外**：允许文档化“离线/本地降级”仅当它明确声明能力缩减且不允许危险效果；未知值不得靠默认值继续。

**证据边界**：需要完整枚举缺失状态，新可选字段会产生新缺口。某些产品面刻意允许降级，必须文档化且可观察。源 Note 不能给出所有能力的通用默认，仍需逐能力策略。

**审查问题**：An unknown permission mode is coerced to workspace-write; the negative test fails；A model with no serving adapter still opens a turn; the boundary test fails；A partially supported config dump reports complete:true and exits 0; the completeness test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-06-30-session-store-fork-api.md:1-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-05-dynamic-workflows.md:1-76@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-22-web-bind-address.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-29-ask-question-web-presentation.md:1-52@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-workspace-write-surface-default.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-05-feedback-gated-session-telemetry.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-07-default-model-follows-the-picker.md:1-48@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-12-open-ready-web-ui.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-12-web-image-intake-and-limits-alignment.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-model-selected-subagent-routes.md:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-out-of-process-subagent-minimal-diagnostics.md:1-87@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-continuable-activation-capacity.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-16-sandbox-same-mode.md:1-24@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-20-config-schema-dump-validation-policy.md:1-31@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-06-approval-seam.md:1-139@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-08-windows-acl-restricted-token-sandbox.md:1-53@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-06-15-ptc.md:1-138@687f282e`

<a id="enforcement-placement"></a>
## 5. 在真实执行边界强制

`rationale-feature-2.enforcement-placement`

**适用**：当添加触发特权操作的 UI 控件、暴露 RPC/路由、执行限制、渲染不可信内容、校验模型路由或删除资源时。

**硬性要求**

1. 授权与能力检查放在执行器/服务端方法内、副作用之前；禁用/隐藏控件只是 affordance。
2. 授权集合在宿主机由权威身份/配置派生；绝不接受客户端提供的允许列表。
3. 任何可能改变身份的 await 之后重新校验 provider/route 身份与凭据。
4. 渲染策略在结算后的渲染边界应用，不仅流式阶段。
5. 对可在代码树上判定的规则增加机械扫描（如禁止的样式/令牌组合），并文档化规则以便新代码遵循。
6. 不变量检查扫描实际产物集合并对违规失败，不信任手工清单。
7. 服务端特权操作每次暴露调用都要求已认证通道/会话，不只页面加载时。

**操作步骤**

1. 列出可到达该效果的所有入口，包括直接 RPC/测试。
2. 在最窄公共执行器边界放置权威检查。
3. 客户端检查保留用于体验，但绝不作为唯一门禁。
4. 为可判定不变量增加静态/机械检查。
5. 用直接调用与畸形客户端状态测试绕过路径。
6. 记录边界，供未来入口复用。

**完成证据**：绕过 UI 的直接 RPC 仍被拒绝；违反 elevation 规则的样式表使扫描失败；客户端提交的授权集合不被宿主接受。

**失败与例外**：机械扫描只覆盖可判定规则，语义强制仍需运行时/审查。遗留代码可能没有单一执行器边界，需分阶段迁移。客户端 affordance 仍影响可用性，即使非权威。

**证据边界**：无法保证所有入口都被枚举；新增路由必须重新执行清单。静态检查可能误报/漏报，需要维护。

**审查问题**：Disabling the composer is the only defense against an unserved model; the direct prompt succeeds and the test fails；A client supplies the authorization set; the host accepts it and the test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-08-07-default-model-follows-the-picker.md:1-48@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-01-web-elevation-stroke-shadows.md:1-43@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-07-session-prose-local-media-display.md:1-44@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-docs-page-markdown-actions.md:1-36@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-24-user-authorized-subagent-model-routes.md:1-43@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-26-generic-file-upload.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-17-sidebar-file-and-directory-auto-refresh.md:1-345@687f282e`

<a id="durable-state-integrity"></a>
## 6. 持久状态完整性与生命周期权威

`rationale-feature-2.durable-state-integrity`

**适用**：当准入、锁、计划生命周期、恢复/回放、进度显示、工作区删除、工作流记录、文件存储或文件监听依赖“当前状态”时。

**硬性要求**

1. 生命周期/准入问题从权威存储行或事件回答，不从 live Agent 存活状态或运行时镜像推断。
2. 压缩等互斥操作以唯一持久锁事件为权威；在昂贵工作前同步追加，使慢/崩溃尝试可观察；不得再加进程内 mutex 或 locked/unlocked 双权威。
3. 纯 UI 生命周期（如计划在下一 turn 清除）折叠进投影，不得为视图规则追加模型从未写过的假事件。
4. 可选记录保持观察性：首次 Session append 失败后停止该 run 的后续写入，仅告警一次，绝不可改变取消、结果映射或资源释放。
5. 任何已记录 run 必须“不存在”或“合法连续前缀”；重复 start、非法顺序由机器可检查不变量拒绝并响亮失败。
6. 只有当前挂载进程观察到的 live start 括号才能打开进行中指示；回放不得用孤儿 start 制造幽灵工作。
7. 确认状态与身份写入权威 settings/session store，不用浏览器 local storage 或环境猜测；新 profile 不得继承旧确认。
8. 删除只作用于记录自身拥有的对象：删除工作区注册不得删文件或会话日志；未知 id 映射为类型化 not-found。

**操作步骤**

1. 为每个决策指出权威记录/事件及其 owner。
2. 通过 owner API 读取并校验形状/连续性；冲突返回类型化错误。
3. 在副作用前同步追加锁/开始/确认，再执行工作。
4. 从观察到的 live 括号派生 UI 状态；回放只重建历史，不推断正在运行。
5. 记录失败时停止可选写并保持执行语义，报告一次。
6. 用恢复/回放、重复投递、崩溃前缀、未知 id 验证。

**完成证据**：冷会话仍能凭存储任务行做出准入决定；恢复看到持久锁，不会启动第二个并发写者；录制失败后执行结果不变，且有明确降级告警。

**失败与例外**：不得用 live/cache 代替存储行；不得为 UI 生命周期伪造日志。崩溃后允许不完整前缀，但必须可识别并阻止非法续写。

**证据边界**：各子系统记录类型不同，前缀不变量需逐类检查，不能假设统一 schema。部分 fire-and-forget 设计不重试、不去重，必须显式声明。live 与持久可用性独立，不能强行统一。

**审查问题**：A repeated workflow append after the first failure is attempted; the invariant test fails；A workspace deletion removes session logs; the ownership test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-05-dynamic-workflows.md:1-76@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-07-mcp-client-plugin.md:1-226@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-16-durable-per-step-time-context.md:1-75@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-22-durable-subagent-catalog-and-list-agents.md:1-113@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-27-workspace-registration-deletion.md:1-60@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-28-cross-workspace-resume.md:1-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-28-todo-plan-clears-on-next-turn.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-compaction-progress-visibility.md:1-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-queued-manual-compaction.md:1-111@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-tui-details-command.md:1-35@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-versioned-gui-welcome-onboarding.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-durable-workflow-runs-in-chat.md:1-46@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-22-archive-admission-reads-stored-tasks.md:1-27@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-08-windows-acl-restricted-token-sandbox.md:1-53@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-26-generic-file-upload.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-17-sidebar-file-and-directory-auto-refresh.md:1-345@687f282e`

<a id="logging-reconstructability"></a>
## 7. 日志可重建性：记录模型所见

`rationale-feature-2.logging-reconstructability`

**适用**：当增加模型可见值、格式化工具结果、命名工具/提供商、记录时间/位置、持久化子代理目录，或回放会话时。

**硬性要求**

1. 模型可见事实写入会话日志中模型实际接收的位置，不能只存在于重建的 system prompt。
2. 记录规范值（id、raw name、时间戳、结构化字段），展示文本由它生成；不得只记录表现层。
3. 稳定公开身份由可信本地配置与确定性归一化派生；文档化碰撞与长度限制。
4. 派生数据保留 provenance：重建所需的输入、版本、解析算法与时间戳。
5. 按定义顺序在 step/start 与 request 派生之间追加持久节点；请求重建必须精确恢复模型所见。
6. 在请求 header 记录已解析的呈现（如实际返回的工具 schema），不用事后近似。
7. 规范值才是 API，展示只是投影；中间执行期值可能无法回放，必须如实声明，不能当作持久事实呈现。

**操作步骤**

1. 识别模型可见事实及它在请求中的精确位置。
2. 选择跨回放稳定且避免名称碰撞的规范表示。
3. 在请求派生前/同时持久化为节点。
4. UI/展示由它派生，不改变规范值。
5. 提供读取日志并复现请求的重建测试。
6. 记录 provenance 与任何有损展示。

**完成证据**：每步时间节点回放后，重建请求包含模型当时看到的同一读数；恢复会话重建出相同规范工具身份，展示差异被隔离；请求 header 与实际返回的 presentation 一致。

**失败与例外**：缺失/重复/乱序节点使重建失败；碰撞返回确定性错误。纯 UI 且不影响模型输入或持久决策的临时状态可不记录。

**证据边界**：记录规范值不保证模型按预期解释；展示变化仍可能改变感知行为。会话格式迁移需版本化，旧会话未必能在新代码下重建。

**审查问题**：A timestamp exists only in the rebuilt system prompt; reconstruction fails；A remote self-reported name is logged as the permission identity; the identity test fails；An oversized canonical value is silently truncated into a string; the output-limit test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card.md:1-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-web-workspace-file-links.md:1-39@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-fire-and-forget-webhook-sessions.md:1-59@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-standard-acp-automation-controls.md:1-80@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-09-ptc-trajectory-code-inspection.md:1-32@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-24-user-authorized-subagent-model-routes.md:1-43@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-06-15-ptc.md:1-138@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-20-ptc-typed-tool-returns.md:1-116@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-26-generic-file-upload.md:1-56@687f282e`

<a id="single-source-and-dedup"></a>
## 8. 单一来源与去重

`rationale-feature-2.single-source-and-dedup`

**适用**：当增加第二个界面（Web/TUI/headless）、为服务端规则添加客户端检查、创建缓存/镜像列表、增加行为略有差异的第二方法，或拆分展示与执行时。

**硬性要求**

1. 安全/权限组合只放在一个基础 composition；surface overlay 不得复制整套安全栈。
2. 不变量在拥有它的 seam 实现一次；调用方可依赖，但不得再实现分叉副本。
3. 保留一个规范状态/派生，UI 与模型投影由它生成；不手工维护平行列表。
4. 与 UI 状态相关时从权威模型派生视图，不另存重复状态。
5. 优先一个执行方法配正交选项，消除平行方法漂移。
6. 模型措辞与机器词汇分离：边界 owner 组织模型文本，provider 保留稳定 code/message。
7. 限制/计数从单一来源投影，不在多个执行点重复硬编码。

**操作步骤**

1. 列出规则/状态的所有副本与投影。
2. 选择拥有必要权威与上下文的 owner。
3. 让其他位置派生或经 owner 执行。
4. 删除废弃的重复路径与测试。
5. 增加派生物与权威值一致性测试、以及绕过负向测试。

**完成证据**：基础 composition 变化覆盖所有界面，overlay 不能覆盖安全默认；并发变化后 UI 计数与权威计数一致；客户端检查不再是特权操作的唯一防线。

**失败与例外**：有意缓存必须文档化失效/派生规则与陈旧语义，否则视为缺陷。识别真正 owner 依赖上下文，无法完全自动化；遗留别名必须清理而非长期并存。

**证据边界**：防御性深度有时需要重复，但必须是受检的等价派生，而非手工复制。源中仍有产品级并行实现，迁移项目需自行画组合图。

**审查问题**：A second surface defines a divergent permission stack; the composition check fails；A client-side check is the only enforcement for a server operation; the bypass test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-tool-row-unified-expand-and-inspect.md:1-35@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-result-card-frontend.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-gui-full-access-confirmation.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-session-completed-done-dot.md:1-26@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-08-pi-ai-per-model-reasoning-declarations.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-plugin-configuration.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-export-command-and-dialog.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-12-web-image-intake-and-limits-alignment.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-fire-and-forget-webhook-sessions.md:1-59@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-01-web-elevation-stroke-shadows.md:1-43@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-07-session-prose-local-media-display.md:1-44@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-08-file-display-through-filesystem.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-docs-page-markdown-actions.md:1-36@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-14-built-in-plugin-feature-previews.md:1-27@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-discover.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-06-15-ptc.md:1-138@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-26-generic-file-upload.md:1-56@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-03-fs-tool-error-remedy.md:1-32@687f282e`

<a id="pinned-policy-and-config"></a>
## 9. 创建时固定策略、修订栅栏与配置形状

`rationale-feature-2.pinned-policy-and-config`

**适用**：当创建/恢复/分叉会话、修改 provider 或权限设置、保存设置段、升级依赖，或基于先前读取写文件时。

**硬性要求**

1. 会话或操作开始时快照有效策略/配置；恢复与分叉使用已记录策略，不读取当前全局设置。
2. 设置变更只影响未来会话；改变活动操作必须显式切换且切换可见。
3. 每次可变写都带先前读取的 revision/version；不匹配返回类型化 stale 错误并要求重读。
4. 配置按显式形状校验：区分 absent/default/override，拒绝未知 key 与非法值，解析失败响亮报错。
5. 保存设置段时从单一快照写完整段，不把部分字段合并进未知并发状态。
6. 依赖升级固定版本并重跑受影响验证；不得静默浮动版本。
7. 检测生成物与源之间的漂移，失败而不是接受陈旧产物。
8. 保存后回读该分节并报告是否真正落盘，不预测校验器结果；失败时保留草稿。新增适配器/模型注册不得扩大已保存的授权或路由选择。

**操作步骤**

1. 解析有效策略并随会话/操作身份记录。
2. 标明每个配置值是默认还是显式。
3. 变更前读取当前 revision。
4. 以 revision/version 条件写入，成功后回读。
5. 未知/非法配置返回可操作错误。
6. 测试恢复后全局变更、并发写冲突、未知 key 拒绝。

**完成证据**：全局默认变化不影响已有会话；新会话使用新值；同 revision 的两个写者中第二个得到 stale 并重读；未知配置 key 被拒绝。

**失败与例外**：盲写覆盖并发编辑必须失败；陈旧写必须保持文件不变并给出重读/重试补救。只读/默认值可在读取时解析，但行为依赖的值必须固定。

**证据边界**：固定策略可能让期待实时生效的用户意外，切换语义必须显式。revision 检查只保护参与者，外部编辑器仍在协议外。schema 覆盖不可能完整，未知 key 拒绝只是护栏。

**审查问题**：An unknown config key is silently ignored; the schema test fails；A blind whole-file overwrite loses a concurrent edit; the revision test fails；A save reports success without reading the section back and the validator silently rejected it; the save-honesty test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-shell-prompt-editor.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-permission-default-for-new-sessions.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-workspace-write-surface-default.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-01-pwsh-tool-and-executor.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-07-default-model-follows-the-picker.md:1-48@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-08-pi-ai-per-model-reasoning-declarations.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-durable-workflow-runs-in-chat.md:1-46@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-plugin-configuration.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-model-selected-subagent-routes.md:1-62@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-20-config-schema-dump-validation-policy.md:1-31@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-24-user-authorized-subagent-model-routes.md:1-43@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-15-deepseek-search-fetch-api.md:1-84@687f282e`

<a id="capability-and-interface-negotiation"></a>
## 10. 能力协商与接口投影

`rationale-feature-2.capability-and-interface-negotiation`

**适用**：当增加 provider/model/effort 选择、寻址子代理或分叉、启动 shell 工作、加载后端缺能力的插件，或定义外部协议时。

**硬性要求**

1. 仅当会话策略解析成功且绑定的 provider 声明该能力时，才向模型暴露 provider/model/effort 字段；不提供无限制静态模式。
2. provider 与 model 作为一条 route 同时提供；effort 只有在声明能力内才可选。
3. settings 启用的能力若绑定后端未声明，插件挂载或配置直接失败。
4. 子代理/分叉地址包含 mode 判别，不从 lineage 或粗粒度 origin 推断。
5. 分叉 seed 必须连续且结束于活动 turn 外；缺失/陈旧/重复/非法边界使用类型化错误。
6. 优先一个执行方法配正交的投影/等待选项，避免 run/start 多方法漂移。
7. 外部协议只实现文档化的标准子集；不支持的能力省略，不添加私有 flag 或 `_meta` 扩展。
8. 按模型声明就是完整报价，省略的 key 不得静默回退到 catalog 默认值。新增适配器/模型注册不扩大用户授权；catalog 只是建议，精确已保存路由只要适配器接受就仍可用。

**操作步骤**

1. 解析真实 provider/backend 与其声明能力集。
2. 由该解析结果计算暴露字段/地址/方法。
3. 执行前拒绝或省略不支持组合。
4. 校验生命周期边界输入并返回类型化错误。
5. 在模型可见/日志请求形状中记录已解析能力。
6. 测试不支持组合与协议一致性。

**完成证据**：effort 仅在 provider 声明时出现，schema 快照一致；带 mode 的地址选择正确 transport，从不查 lineage；缺能力时挂载失败且无部分注册。

**失败与例外**：catalog 是咨询性且可能省略可请求模型，不能用 catalog 成员资格代替 routability。模型不能自行扩大暴露字段。

**证据边界**：能力声明本身可能错误；源实现通常信任绑定 provider 的声明而非探测。协议子集随版本演进，迁移项目须固定一致性目标版本。

**审查问题**：provider supplied without model is accepted; the schema test fails；An unknown _meta extension is emitted; the protocol conformance test fails；A newly registered adapter expands a saved user authorization without an explicit settings change; the authorization-boundary test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-06-30-session-store-fork-api.md:1-50@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-07-mcp-client-plugin.md:1-226@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-27-web-subagent-conversations.md:1-120@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-08-pi-ai-per-model-reasoning-declarations.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-model-selected-subagent-routes.md:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-26-shell-execute-projection-and-jobs-at-start.md:1-53@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-24-user-authorized-subagent-model-routes.md:1-43@687f282e`

<a id="bounded-operations"></a>
## 11. 有界、原子、可取消的多步操作

`rationale-feature-2.bounded-operations`

**适用**：当并发执行工具/子代理、启动 shell 作业、发布服务或 UI、监听文件、申请容量、失败重试或取消工作时。

**硬性要求**

1. 一个用户意图建模为一个原子操作与类型化拒绝；不拆成可部分成功的独立 RPC。
2. 并发用带预留的池限制；容量不足返回诊断而不是无限排队；失败回滚预留。
3. 超时限制“等待”而非底层工作；取消停止等待并按定义顺序释放资源。
4. 先注册工作/监听，再声明就绪，再读取；错过/重复事件后收敛，不回放陈旧状态。
5. 完整组合就绪后才发布；不得在必需组件挂载前暴露 URL/状态。
6. 取消/卸载时关闭所属 watcher/stream，即使生产者挂起；迟到结果不得重建状态。
7. 上下文增强/重试有显式、可测量预算；预算导致覆盖截断时记录。
8. 需要能力/授权的副作用在开始前检查，不先启动再拒绝。
9. fire-and-forget 操作必须说明最多进程生命周期语义，不得被重新解释为持久自动化。前台超时只限定等待而非 job；已登记 job 必须有显式 kill/stop 路径。

**操作步骤**

1. 定义原子意图与拒绝情形。
2. 启动前预留所需容量/资源。
3. 注册持久/生命周期状态（锁/开始/监听）并使其可观察。
4. 在超时与取消传播下执行。
5. 全部就绪后才发布/公告。
6. 失败/取消按顺序释放并保留诊断。
7. 测试并发上限、取消迟到、就绪顺序。

**完成证据**：服务在 loader 树稳定后才公告 URL，早到请求看不到半挂载应用；池满时给出清晰诊断并回滚预留；取消后 watcher/状态不再被迟到结果重建。

**失败与例外**：有意 fire-and-forget 仅当不存投递/执行状态且丢失语义已文档化；不支持就绪信号的提供方必须如实声明，不能用轮询或本地 watcher 冒充。

**证据边界**：部分操作刻意不重试/不去重并接受重复投递，必须显式而非默认。就绪回退可能不可用。预算若未测量只是猜测。

**审查问题**：A cancelled read recreates a watcher/state after unmount; the lifetime test fails；A timeout kills the underlying job; the wait-vs-work test fails；A fire-and-forget webhook runtime is documented as durable automation; the semantics test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-24-provider-retry-policies.md:1-72@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-27-workspace-registration-deletion.md:1-60@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-28-sdk-max-output-tokens.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-29-persistent-bash-str-replace-editor.md:1-38@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-queue-steer-action.md:1-72@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-continuable-subagent-interrupt.md:1-49@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-plugin-configuration.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-export-command-and-dialog.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-12-open-ready-web-ui.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-model-selected-subagent-routes.md:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-fire-and-forget-webhook-sessions.md:1-59@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-standard-acp-automation-controls.md:1-80@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-26-shell-execute-projection-and-jobs-at-start.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-14-docs-mermaid-viewer.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-continuable-activation-capacity.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-16-sandbox-same-mode.md:1-24@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-27-desktop-cli-runtime.md:1-42@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-06-15-ptc.md:1-138@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-26-generic-file-upload.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-15-deepseek-search-fetch-api.md:1-84@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-17-sidebar-file-and-directory-auto-refresh.md:1-345@687f282e`

<a id="untrusted-boundary"></a>
## 12. 不可信内容与边界校验

`rationale-feature-2.untrusted-boundary`

**适用**：当摄取外部文档/网页、渲染模型或工具输出、命名 MCP 工具、打开 URL、展示子进程诊断，或在 UI 嵌入第三方内容时。

**硬性要求**

1. 身份取自可信本地配置（如 server name 加本地 raw name），绝不使用远端自报的 serverInfo/display name。
2. 抓取前按闭合允许列表校验 scheme/地址/重定向目标；拒绝私网/loopback/元数据地址，重定向后重新校验，防 SSRF。
3. 外部文本以数据+来源标签传给模型，绝不拼入指令、规范名称或工具 schema。
4. 外部/标记内容经允许列表清洗器渲染，禁止原样注入 HTML 或执行内嵌脚本。
5. 子进程/worker 失败映射为固定的安全诊断文本；异常、stderr、任务内容、工具输入、路径、环境值、凭据、协议载荷均不得进入模型可见诊断。
6. 工具参数在工具边界校验；未知/非法字段拒绝，不得归一为 null 后继续。
7. 流式内容不得缓存渲染器处理器以致未结算内容被冻结；策略在结算后的渲染边界应用。
8. 诊断只允许闭集协议值、类型化错误与调用点事实；诊断是展示文本，消费方不得按其格式分支。

**操作步骤**

1. 分类数据来源与跨越的信任边界。
2. 在该边界使用最窄的解析器/校验器/允许列表。
3. 把可信身份与不可信展示字段分开记录。
4. 经批准的处理器抓取/渲染，带超时、大小限制、重定向检查。
5. 校验失败返回类型化拒绝与安全文本，不回退原始内容。
6. 用敌对/歧义输入测试，确认不可信文本到不了指令或身份位置。

**完成证据**：搜索结果中的注入指令只作为带标签数据出现；重定向到私网地址在读取内容前被拒绝；远端名称无法成为权限 key；子进程 stderr 不出现在模型诊断。

**失败与例外**：渲染器能力不支持时回退到转义纯文本，不执行内嵌内容。哪些本地来源可信必须由迁移项目文档化；“不可信”判断不能照搬。

**证据边界**：这些 Note 不能证明某个清洗器覆盖所有内容类别；委托远端取页时目标访问策略也随之委托，必须显式说明。地址校验不能使远端服务本身变安全。

**审查问题**：A remote MCP serverInfo name becomes a permission key; the identity test fails；Child stderr text appears in a model diagnostic; the boundary test fails；A diagnostic contains raw child stderr, or a consumer branches on diagnostic text; the trust-boundary test fails。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-06-29-todo-write-tool.md:1-61@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-21-cross-session-references.md:1-63@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-23-web-assistant-markdown.md:1-46@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-result-card-frontend.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-permission-default-for-new-sessions.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-plugin-configuration.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-out-of-process-subagent-minimal-diagnostics.md:1-87@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-07-session-prose-local-media-display.md:1-44@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-08-file-display-through-filesystem.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-docs-page-markdown-actions.md:1-36@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-discover.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-20-ptc-typed-tool-returns.md:1-116@687f282e`

<a id="privileged-capability-and-secrets"></a>
## 13. 特权本地能力与密钥处理

`rationale-feature-2.privileged-capability-and-secrets`

**适用**：当从 Web UI 调用宿主机能力（原生对话框、打开系统路径）、保存提供商凭据、启动子进程、选择沙箱等级或注入环境变量时。

**硬性要求**

1. 特权宿主能力只接受来自 loopback socket 且带 same-origin 浏览器元数据的请求；每次暴露的调用都必须带已认证会话，不能只在页面加载时检查。
2. 原生工具通过平台适配器直接打开，不经 shell；可浏览器渲染的文档优先浏览器处理器。
3. 密钥绝不进入 provider settings：字面量会穿过 settings 变更路径，整段替换也无法安全重建被脱敏的值；由凭据存储 seam 统一负责存储、校验、失败与失效。
4. 密钥不进日志、模型可见诊断、工具输入或子进程环境；子进程确需配置时传入每次执行的不可变快照，并清洗含密钥变量。
5. 按明确威胁模型选择沙箱/降权机制，并报告该机制无法治理的效果；不得把读、网络、进程可见性说成已被控制。
6. 环境变量由事实 owner 解析为每次执行的不可变快照；恢复/分叉/并发下不得依赖进程全局可变状态。
7. 每个环境/配置贡献者声明稳定名称与受管 key；重复名称/key 在加载时响亮失败，不得静默覆盖。
8. 插件必须经现有 shell seam 使用部署沙箱/策略，不得用裸 child_process 绕过。
9. 沙箱机制必须公布明确的“所得/所失”表，包括无法治理的效果（硬链接、其他 AppContainer SID、控制台隔离、未验证的文件系统目标），并以 API 名与平台错误码失败。

**操作步骤**

1. 分类该能力授予的权限与执行世界。
2. 在接受请求前验证传输为本地且会话已认证。
3. 经凭据存储解析密钥，保持 settings 与日志无密钥。
4. 构建每次执行的环境快照，启动前清洗密钥。
5. 在真实进程 seam 应用沙箱策略，并列出未治理效果。
6. 测试非 loopback/直接调用、密钥泄漏路径、重复环境 key、不支持的沙箱效果。

**完成证据**：非本地调用在打开对话框前被拒绝；设置、日志与模型输入中均无字面密钥；沙箱未覆盖的效果被明确报告，而非宣称已阻止。

**失败与例外**：缺少凭据返回可操作错误且不产生半成品 provider 配置；重复环境贡献者 key 使加载失败。放宽传输检查只允许明确文档化的本地可信组合，且不得远程暴露。

**证据边界**：loopback/same-origin 不构成远程部署安全模型；同用户本地进程仍可能读取内存/凭据。沙箱保证依平台而异，只等于所声明机制。归档 UI/config Note 的平台适配器须由目标项目重新推导。

**审查问题**：A non-loopback caller invokes the privileged method and is denied before the dialog opens；A duplicate environment contributor key is accepted; the registry test fails；A sandbox note omits that hard links escape path confinement; the mechanism report is incomplete and rejected。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-05-dynamic-workflows.md:1-76@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-07-mcp-client-plugin.md:1-226@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-10-agent-session-identity-and-log-location.md:1-66@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-21-follow-instruction-symlinks.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-27-native-workspace-directory-picker.md:1-52@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-28-tool-call-file-open-in-os.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-deepseek-onboarding-credential-setup.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-web-plugin-configuration.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-12-open-ready-web-ui.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-fire-and-forget-webhook-sessions.md:1-59@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-08-windows-acl-restricted-token-sandbox.md:1-53@687f282e`

<a id="consent-data-minimization"></a>
## 14. 同意门控与数据最小化

`rationale-feature-2.consent-data-minimization`

**适用**：当收集遥测/诊断、启用调试导出、提交反馈、回放录制会话，或增加后端 exporter 时。

**硬性要求**

1. 当前共享 base 的 unset/empty `DSH_TELEMETRY_MODE` 与直接省略后端 `mode` 均为 `FEEDBACK_ONLY`。显式 `DISABLED` 不构造 coordinator/provider/processor/exporter；live feedback 本地警告、cold mutation 静默。
2. 模式使用闭合词汇；未知值在读取 transport/setup 前失败。
3. 仅新的本 Session canonical 文本反馈、评分/备注编辑与撤回授权到该事件的未 handoff 前缀（包含存储上下文）；存储/父 Session 继承的反馈、普通活动、mount 与直接 emit 都不授权，后续记录等待新反馈。
4. live 与按需路径均在后端前脱敏；按需回放采用反馈/采集时的当前策略，不是记录创建时策略。规则异常时扣留该条，只处理副本、不改 canonical log。
5. 当前 OTel 后端在全部支持模式下的公开 emit 都是 no-op，只有私有反馈路径可授权采集；归档的 FULL/公开 emit 设计不是当前绕行口。
6. canonical feedback 先提交再发布，包含该事件但不能越界；不能把行提交说成磁盘持久化或 collector 回执。
7. 同对象最高已 handoff seq 游标与接收端 `(session id, format version, event seq)` 去重是两层保证；cold snapshot/重启/重试可重复前缀，不承诺 exactly-once。
8. 当排除了 shutdown/error 记录时，明确说明其缺失不是崩溃信号。

**操作步骤**

1. 保留当前两模式与反馈门控默认；`FULL` 和未知直接配置在 transport setup 前失败，`DISABLED` 真正不构造传输。
2. 将释放边界绑定到新的本 Session canonical feedback；继承反馈不能自行授权 child export。
3. 在实际采集时复制、应用当前脱敏策略，不改源日志。
4. 结构上分离不授权的公开 emit 与私有反馈采集。
5. 先提交反馈行再发布，只释放到反馈事件的 inclusive prefix。
6. 分别验证默认/硬 opt-out、disabled/feedback-only、FULL 拒绝、重入 emit、当前策略回放与接收端去重；区分 handoff 和送达。

**完成证据**：默认模式为反馈门控而不是禁用；普通/继承反馈不采集；新的本 Session 反馈仅授权其前缀。显式 disabled 无传输；FULL/未知值在 setup 前失败；实际运行证据与仅计划场景分开。

**失败与例外**：重入 redaction listener 不能借公开 emit 授权无关记录；本地诊断若永不离开机器可无需上传同意，但须文档化。无内置脱敏规则不能声称匿名；withdrawal 是删除事件，不证明远端抹除。

**证据边界**：归档 Note 的三模式、生命周期历史排除和省略 mode=DISABLED 已与当前源码不同；后继 Note 仍保留过时的插件默认值句子。当前配置、`DEFAULT_TELEMETRY_MODE` 与 README 一致为 FEEDBACK_ONLY，后端拒绝 FULL。按需当前策略、包含历史与 handoff/送达边界分别查当前 seam；本节没有执行源产品或目标 telemetry runtime。

**审查问题**：重入 listener 调 public emit 是否额外授权？FULL/未知模式是否在 setup 前失败？更换脱敏策略后，新反馈是否对未 handoff 前缀应用当前规则？cold replay 重复前缀是否由接收端去重而非冒称 exactly-once？

**来源**：历史：`deepseek-harness/.agents/notes/archived/feature/2026-08-05-feedback-gated-session-telemetry.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:12-32@687f282e`。当前：`deepseek-harness/packages/bundle/base/cordis.patch.yml:205-221@687f282e`；`deepseek-harness/packages/session/session-telemetry-otel/src/index.ts:31-63,152-165@687f282e`；`deepseek-harness/packages/session/session-telemetry-otel/README.md:32-68,142-144@687f282e`；`deepseek-harness/packages/session/session-telemetry/README.md:50-119@687f282e`。

<a id="honest-evidence"></a>
## 15. 证据诚实、可操作诊断与显式缺口

`rationale-feature-2.honest-evidence`

**适用**：当报告完成或调试、写诊断/错误、显示实时状态/进度、撰写验证、回答“未找到/不支持”、回放 fixture，或处理歧义/陈旧状态时。

**硬性要求**

1. 区分“服务返回了什么”与“客户端观察到了什么”：服务端 200 不证明目标页面状态。
2. 错误在决策点可操作：给出唯一正确恢复，保留机器 code/cause，无关错误原样透传。
3. 不得伪造实时性：动画/状态跟随真实 delta 或观察到的 live 括号，绝不用独立动画或回放孤儿。
4. 精确陈述覆盖与验证：已读/未读、已运行/计划、通过/未执行；枚举限制属于结果的一部分。
5. 维护被测量拒绝登记：记录被否方案及当时观察到的原因，不做事后重构。
6. 证据歧义时重置为显式 unknown/needs-recheck，不猜测；优先类型化冲突。
7. 仅在读取权威来源后报告缺失，并区分确认缺失与暂时不可用。
8. 回放测试与录制/live 行为分歧时响亮失败，不得归一化掩盖。
9. 不得宣称未经验证的节省或兼容性；实验性依赖放在单一 seam 之后并给出替代路径，量化指导明确属于上线后学习。超大输出必须显式失败，不得静默截断或转字符串，并说明上限排除了什么。

**操作步骤**

1. 写出要主张的精确命题与支持它的观察。
2. 识别观察边界（client/server、live/replay、read/unread）。
3. 收集观察；不可得则标注未验证。
4. 失败时输出类型化 code 与下一步，同时保留原 cause。
5. UI 状态只由观察到的 live 事件驱动。
6. 结果中列出未执行路径与限制。
7. 回放测试断言一致性，分歧即失败。

**完成证据**：完成报告区分已执行测试与计划检查，并列出未读文件；陈旧文件错误仅追加正确重读/重试补救，保留 code 与 cause；服务端 200 未被说成目标 HTTP 状态。

**失败与例外**：无法自动证明语义诚实，作者/审查者负责。诊断可操作但不得泄漏不可信内容。覆盖账本机械一致仍可能语义错误，需要独立审计。

**证据边界**：证据边界依赖具体组件；同一状态在不同层可能需要不同措辞。计划中的验证不得写成已通过。

**审查问题**：A service-side 200 is reported as the target HTTP status; the claim is rejected；A live indicator is driven by a recorded orphan start; the parity test fails；A note claims unconditional prompt-token savings for an experimental SDK; the evidence review rejects the claim。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-21-tui-auto-pane-title.md:1-42@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-21-tui-auto-title-default-on.md:1-33@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-23-tui-file-reference-autocomplete.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-27-tmux-location-context.md:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-29-persistent-bash-str-replace-editor.md:1-38@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-30-plan-review-presentation-intent.md:1-56@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-07-31-web-workspace-file-links.md:1-39@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-continuable-subagent-interrupt.md:1-49@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-06-web-install-manifest.md:1-40@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-05-web-preview-product-badge.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-10-durable-workflow-runs-in-chat.md:1-46@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-11-web-export-command-and-dialog.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-12-web-image-intake-and-limits-alignment.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-18-model-selected-subagent-routes.md:1-62@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-21-out-of-process-subagent-minimal-diagnostics.md:1-87@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-22-fire-and-forget-webhook-sessions.md:1-59@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-26-shell-execute-projection-and-jobs-at-start.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-07-session-prose-local-media-display.md:1-44@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-08-file-display-through-filesystem.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-09-ptc-trajectory-code-inspection.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-14-docs-mermaid-viewer.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-continuable-activation-capacity.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-15-docs-page-markdown-actions.md:1-36@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-09-27-desktop-cli-runtime.md:1-42@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-20-config-schema-dump-validation-policy.md:1-31@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-22-archive-admission-reads-stored-tasks.md:1-27@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-discover.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-06-approval-seam.md:1-139@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-08-windows-acl-restricted-token-sandbox.md:1-53@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-06-15-ptc.md:1-138@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-07-20-ptc-typed-tool-returns.md:1-116@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-08-26-generic-file-upload.md:1-56@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-10-15-deepseek-search-fetch-api.md:1-84@687f282e`；`deepseek-harness/.agents/notes/implemented/feature/2026-09-17-sidebar-file-and-directory-auto-refresh.md:1-345@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-02-web-thinking-tail-scroll.md:1-32@687f282e`；`deepseek-harness/.agents/notes/archived/feature/2026-08-03-fs-tool-error-remedy.md:1-32@687f282e`

<a id="tmux-location-context"></a>
## 16. tmux 位置上下文（条件性子契约）

`rationale-feature-2.tmux-location-context`

**适用**：某个 surface 需要 agent 知道自己所在的 tmux session/window/pane/layout，并愿意把该信息作为持久、可重建的上下文注入。它不是通用指令/状态解析的一部分；普通项目不需要启用。

**前置条件**：可用的 `ctx.shell` executor；tmux 提供 `display-message`；`ps -o tty=` 等 POSIX tty 查询可用；存在可从 `user/message` 事件重建的持久投影；消息类型能标注独立来源。

**责任者**：上下文插件（注册 `agent/pre-step` 监听器）；shell executor（执行策略与 sandbox）；session projection（抑制基线）；agent runtime（消费持久消息）。

**操作步骤**
1. 注册 prepended `agent/pre-step` 监听器；先调用下游决策，仅在 `step === 1`、决策非 `reject` 且 signal 未 aborted 时继续。
2. 从持久 `tmuxContext` 投影读取上次注入的 stable state block；不要建立进程内缓存。
3. 若配置了正的 `refreshIntervalMs`，且距上次注入不足该毫秒数，直接返回。
4. 通过 `ctx.shell` 执行一次只读查询：先取本进程 controlling tty，再取 `$TMUX_PANE` 的 `#{pane_tty}`，两者一致才输出 tab 分隔字段。
5. 解析 session/window/pane/active/layout；字段数不符、pane id 为空、非零退出或查询异常均视为 no-op。
6. 仅当 stable state block 变化时，prepend 一条持久 `user/message`，source kind 为 `tmux-context`，正文含 turn preamble 与状态块；turn preamble 不参与比较。

**完成信号**：真实 pane 内每轮首 step 至多一条带来源的持久消息；同轮后续 step 不重复；状态未变的下轮不注入；移位/改名/重排后下轮注入；resume/compaction 后仍能从持久投影找到抑制基线。

**失败与例外**：缺 `ctx.shell`、缺 tmux env、tty 不匹配、字段数错误、空 pane id、非零退出、aborted signal 或 executor rejection 都是 no-op 或警告，不能终止 turn。继承 `$TMUX`/`$TMUX_PANE` 的终端（例如 VS Code 集成终端）必须读作“不在 tmux”，否则会注入陈旧位置。pane 在轮内移动只在下一轮反映；prepended listener 已追加的记录，在后续 listener 取消或失败时不回滚；不抓 sibling pane 内容或 pixel size；原运行时 invariant 已删除，因为它只重复生产者自己的调度/格式计算。

**证据边界**：固定提交的 Note 是归档历史，当前实现是该提交的 `packages/context/tmux-context`；本包未执行其测试。`ps -o tty=` 与 `#{pane_tty}` 不可用的平台为空操作，不能据此声称位置已注入。持久投影只证明注入基线可重建，不证明两轮之间的实时 tmux 状态。

**来源**：`deepseek-harness/.agents/notes/archived/feature/2026-07-27-tmux-location-context.md:1-62@687f282e`；`deepseek-harness/packages/context/tmux-context/src/index.ts:1-275@687f282e`；`deepseek-harness/packages/context/tmux-context/README.md:32-52,64-66@687f282e`。

---

## 交叉机制检查表

对任何变更，逐行回答；答“否”或“未验证”必须写入结果，不得略过。

| 检查 | 相关机制 | 通过条件 |
|---|---|---|
| 规则/状态的唯一 owner 是谁？ | `single-source-and-dedup` | 没有两个手工维护的副本；派生物有失效规则 |
| 缺失/未知/错误时会发生什么？ | `fail-closed-defaults` | 在副作用前拒绝或明确降级 |
| 谁能在真实执行边界强制执行？ | `enforcement-placement` | 直接 RPC/绕过 UI 仍被拒绝 |
| 这是否扩大权限或接触密钥？ | `dangerous-action-approval；privileged-capability-and-secrets` | 显式批准 + 凭据存储 + 本地认证 + 撤销 |
| 是否跨信任边界摄取/渲染外部内容？ | `untrusted-boundary` | 有允许列表、来源标签、安全诊断 |
| 模型可见事实是否可重建？ | `logging-reconstructability` | 日志含规范值与位置，重建测试通过 |
| 决策是否读取了权威持久状态？ | `durable-state-integrity` | 不用 live 对象/缓存代替存储行 |
| 是否固定策略/带 revision 写入？ | `pinned-policy-and-config` | 恢复不漂移；冲突返回 stale；保存后回读 |
| 能力/字段是否按声明暴露？ | `capability-and-interface-negotiation` | 不支持组合在执行前失败；新注册不扩大授权 |
| 操作是否有界、可取消、就绪后才发布？ | `bounded-operations` | 池/超时/取消/ready 顺序有测试；job 可停 |
| 是否收集/外发用户数据？ | `consent-data-minimization` | 当前反馈门控默认 + 硬 opt-out/disabled + 显式反馈边界 + 采集时脱敏 |
| 是否注入位置/环境上下文？ | `rationale-feature-2.tmux-location-context` | opt-in；tty 验证真实 pane；每轮首 step；状态变化才注入；无进程内缓存 |
| 完成声明是否只覆盖实际观察？ | `honest-evidence` | 已运行/未运行、已读/未读分离；限制已列出 |
| 是否说明非目标、取代关系与发布步骤？ | `change-discipline` | 非目标 + 精确 supersession + opt-in/迁移 |

## 建议采用顺序

这是基于机制依赖的工程建议，不是源 Note 规定的唯一顺序。

1. 先建立**权威上下文来源**与**变更纪律**，让后续规则有唯一位置和可追踪决策。
2. 建立**单一来源**、**执行边界强制**、**缺失即拒绝**，先堵住绕过与默认放行。
3. 接入**危险动作审批**、**特权能力与密钥**、**不可信边界**，覆盖高权限与外部输入。
4. 再处理**持久状态**、**日志可重建**、**固定策略/配置**，保证恢复与回放正确。
5. 最后补**能力协商**、**有界操作**、**同意门控**，并持续用**证据诚实**审计所有声明。

## 采用者必须保留的未知

- Note 中的类名、包名、命令、配置键、文件路径都是源项目事实；迁移项目必须映射到自己的实现，不能照抄后声称存在。
- 多数 Note 的“验证”章节描述源项目测试；本包未运行它们，不能据此声称目标项目通过。
- 归档 Note 与后续决策存在明确取代关系（各条 disposition 已记录）；不要把归档提案当作当前权威。
- 本参考未覆盖其他 Note 分区；跨分区机制（例如更完整的审批策略、运行时架构）只能在实际阅读对应正文后绑定。

