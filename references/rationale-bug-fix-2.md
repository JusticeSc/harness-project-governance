# Bug-fix 治理机制参考（rationale-bug-fix-2）

本参考覆盖 `rationale-bug-fix-2` 分区的 99 个英文 Agent Note 与等权中文正文。它把可迁移的治理机制、失败教训和小 safeguard 转成可执行程序；产品专属行为没有被提升为普遍规则。每条都给出固定提交的精确引用，并保留关键英文措辞，以免转述丢失限定词。

## 所有条目共用的执行程序

**负责者**：所有者组件作者负责实现与边界；评审者负责拒绝重复路径、按形状推断和未证实保证；回归测试维护者负责正常、拒绝、恢复三类证据。

**步骤**：
1. 用机制 ID 或标题定位条目；先读“何时适用/前提”，确认事实触发存在，再启动。
2. 定位唯一所有者与全部表示/消费者；不要在展示层、邻近服务或每个适配器里复制规则。
3. 在所有者处落实“机制义务”，再迁移消费者；删除重复、遗留、按字段形状推断和仅靠约定的路径。
4. 分别添加正常路径、拒绝路径、恢复路径证据；负控必须能使旧实现失败，禁止空测。
5. 记录例外、未激活触发事实和未验证限制；没有事实触发时，不得以规模小、缺工具或实现方便为由跳过。

**完成信号**：目标仓库中的可观察回归证据同时覆盖正常与拒绝路径，且能观察到机制义务的效果；代码已写、文件存在、评审同意或源 Note 的测试记录都不算完成。

**失败处理**：失败必须响亮或在副作用前拒绝；不得伪造回退、静默丢弃证据、把未知当成功，或把源文的“不承诺”改写成保证。

**例外与未决**：只允许源文明确记录的例外与事实性未激活条件。未决问题保持为阻塞或显式目标检查；不得为了通过检查而改标为非阻塞。

**证据限制**：所有目标验证仍是 planned，直到真正执行。源 Note 中记录的测试、基准、CI lane 与平台探测不构成本次提取的执行证据；本参考未独立检查 Note 链接的实现、配置与测试文件。

<a id="absence-observation-contract"></a>
## 1. Absence Observation Contract

**机制 ID**：`rationale-bug-fix-2-absence-observation-contract`

**中文摘要**：区分未观察、不存在（带版本）与存在；absent 是观察转移而不是删除版本；在发布点强制 createIfAbsent，并明确不宣称跨进程线性化。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Explicit observation union present(version)|absent on fs/observed; absence is a transition, not deletion of the version; policy maps unseen/absent/present to createIfAbsent/replaceIfVersion/edit errors; providers enforce createIfAbsent at publication (hard-link no-clobber, ln -T) not just probe; cross-process linearizability is explicitly not claimed; failur…

**机制义务（提取要点；保留关键英文措辞）**：
- model absence explicitly, enforce creation at the commit point, and bound the stated guarantee
- Explicit observation union present(version)|absent on fs/observed
- absence is a transition, not deletion of the version
- policy maps unseen/absent/present to createIfAbsent/replaceIfVersion/edit errors

**机制特定失败/例外/证据限制**：The source records unresolved, unverified or explicitly non-promised behavior; preserve it rather than upgrading it to a guarantee.

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-09-filesystem-absence-observation.md:1-37@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-09-filesystem-absence-observation.md:1-37@687f282e

<a id="admission-control-live-resources"></a>
## 2. Admission Control Live Resources

**机制 ID**：`rationale-bug-fix-2-admission-control-live-resources`

**中文摘要**：按所有者限制并发后台任务；活动数来自权威记录，running/stopping 都占位到生产者结算；拒绝发生在执行与 id 分配之前。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：LocalJobRegistry.maxConcurrentJobsPerOwner (positive int, default 10) admits after controller/owner checks and before producer run; active count is derived from authoritative records, running and stopping both occupy until producer done settles; rejection precedes execution/id allocation and gives job_kill guidance; exact Agent identity buckets, unowned shar…

**机制义务（提取要点；保留关键英文措辞）**：
- bound live resources per owner from the state authority and release only on settlement
- LocalJobRegistry.maxConcurrentJobsPerOwner (positive int, default 10) admits after controller/owner checks and before producer run
- active count is derived from authoritative records, running and stopping both occupy until producer done settles
- rejection precedes execution/id allocation and gives job_kill guidance

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-bounded-background-job-admission.md:1-56@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-bounded-background-job-admission.md:1-56@687f282e

<a id="authentication-not-locality"></a>
## 3. Authentication Not Locality

**机制 ID**：`rationale-bug-fix-2-authentication-not-locality`

**中文摘要**：访问与持久化由已认证身份决定，网络本地性只是路由证据；同一 Host 的已认证浏览器共享设置，唯一本地性 UI 例外需显式说明。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Locality selects nothing: one settings.describe mirror and settings.mutate path serve every authenticated browser; browser-token authentication of the Connection API is the identity boundary, remote.$host locality is request-routing evidence no store selector consults; mirror states are idle/loading/ready, snapshots carry no mode, unavailable only for unregi…

**机制义务（提取要点；保留关键英文措辞）**：
- derive access/persistence from authentication, not network locality
- keep any locality presentation-only and explain why

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-15-authenticated-browser-host-preferences.md:1-29@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-15-authenticated-browser-host-preferences.md:1-29@687f282e

<a id="authoritative-source-observation"></a>
## 4. Authoritative Source Observation

**机制 ID**：`rationale-bug-fix-2-authoritative-source-observation`

**中文摘要**：从已完成的 system-prompt/assemble 瀑布读取实际 provider/model，而不是会话头或 options；用 WeakMap 按 Agent 存路由，不重复组装或分派。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：The model route must be observed from the completed system-prompt/assemble waterfall, stored in a WeakMap keyed by Agent, instead of reading the session header or agent options, which can be stale after a live switch.

**机制义务（提取要点；保留关键英文措辞）**：
- Observe the completed assembly result rather than a pre-assembly header or option snapshot.
- Scope the observation to the exact Agent with a WeakMap and dispose it with the effect.
- Fall back only when the authoritative route is genuinely absent; propagate other lookup failures.

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-model-budget.md:1-26@687f282e`；`deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-11-process-specific-prompt-values-in-runtime-context.md:1-95@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-model-budget.md:1-26@687f282e
来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-11-process-specific-prompt-values-in-runtime-context.md:1-95@687f282e

<a id="authority-action-propagation"></a>
## 5. Authority Action Propagation

**机制 ID**：`rationale-bug-fix-2-authority-action-propagation`

**中文摘要**：人工暂停控制当前执行与后续模型权限：宿主暂停中止任何在途 Turn，旧取消按精确 goalId/revision 栅栏；持久 paused 只能由用户/直接领域入口恢复，模型工具仍可恢复 disarmed-active/blocked。

**何时适用/前提**：存在用户拥有的持久暂停、模型可调用 resume 和在途执行。缺少该领域时记录项目事实，新增时重新触发；缺少 driver/tool 绑定是效果缺口，不能算不适用。

**机制义务与责任程序**：
- Round driver 处理 `operation=pause` 且 `currentInitiator()!=agent`，以 `agent.cancel({kind:'user'},{keepInbox:true})` 中止任何 live Turn，保留 Inbox；排队 goal round 仍过既有 reservation 拒绝。模型自己的 pause 不切断确认回复。
- Tool owner 在调用 GoalService 前拒绝持久 paused 的 `update_goal resume`，错误为 `GOAL_TOOL_RESUME_PAUSED`，即使已进入后续人工 Turn；恢复/分叉后的 disarmed-active 和人工继续后的 blocked 仍可由模型恢复。
- Web、`/goal resume` 或直接 goal-service caller 保有持久暂停恢复权；prompt/tool description 明示用户所有权，不能以 prompt-only restraint 替代代码守卫。
- Reviewer 分别检查用户与模型入口；回归 owner 观察当前 Turn 取消、Inbox 保留、服务调用前拒绝及用户立即 resume 提升 revision 后旧 idle handler 不再暂停它。

**机制特定失败/例外/证据限制**：宿主取消是广义 stop-now，不只 goal round；模型 pause 与直接领域恢复不被一刀切禁止。`automatic` 保留源 driver/tool 效果，但目标绑定与实际执行仍缺失；durable 格式不变。该来源补全不是独立关闭或目标 Goal/Web 证明。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-01-host-goal-pause-aborts-turn.md:1-30@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-user-owned-goal-pause-activation.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-01-host-goal-pause-aborts-turn.md:1-30@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-user-owned-goal-pause-activation.md:1-36@687f282e

<a id="bootstrap-before-plugin"></a>
## 6. Bootstrap Before Plugin

**机制 ID**：`rationale-bug-fix-2-bootstrap-before-plugin`

**中文摘要**：首屏主题在插件加载前由同步内联脚本写入两个 DOM 字段；bootstrap 不注册监听、不解析第三方主题，后续由 ThemePresenter 接管。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Host injects one synchronous body-adjacent inline script carrying the schema-validated built-in theme preference (or system), writing only the two DOM fields ThemePresenter later owns; bootstrap registers no listeners and does not resolve third-party themes; ThemeRuntime remains authoritative after plugin activation; both script and runtime must change toget…

**机制义务（提取要点；保留关键英文措辞）**：
- pre-activation bootstrap may read authoritative durable config but must write only the minimal state and hand ownership back explicitly
- Host injects one synchronous body-adjacent inline script carrying the schema-validated built-in theme preference (or system)
- writing only the two DOM fields ThemePresenter later owns
- bootstrap registers no listeners and does not resolve third-party themes

**机制特定失败/例外/证据限制**：The source records unresolved, unverified or explicitly non-promised behavior; preserve it rather than upgrading it to a guarantee.

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-pre-plugin-theme-bootstrap.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-pre-plugin-theme-bootstrap.md:1-38@687f282e

<a id="boundary-error-normalization"></a>
## 7. Boundary Error Normalization

**机制 ID**：`rationale-bug-fix-2-boundary-error-normalization`

**中文摘要**：在工具模型边界把多种 FS_NOT_OBSERVED 统一成一条可执行诊断，保留错误码与 cause；不修改提供方/策略的机器错误，也不新增错误码。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：remediateFsError replaces every FS_NOT_OBSERVED message at the dsh-tool-fs model boundary with one actionable read-then-retry text, preserving the structured code and chaining the source error as cause; provider/policy keep their machine-oriented messages; no new error code; FS_STALE_VERSION keeps its separate remedy

**机制义务（提取要点；保留关键英文措辞）**：
- normalize wording only at the boundary that owns the consumer presentation, preserve codes and causes, and do not rewrite provider errors for everyone
- remediateFsError replaces every FS_NOT_OBSERVED message at the dsh-tool-fs model boundary with one actionable read-then-retry text
- preserving the structured code and chaining the source error as cause
- provider/policy keep their machine-oriented messages

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-normalized-unread-fs-tool-diagnostic.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-normalized-unread-fs-tool-diagnostic.md:1-30@687f282e

<a id="bounded-auxiliary-state"></a>
## 8. Bounded Auxiliary State

**机制 ID**：`rationale-bug-fix-2-bounded-auxiliary-state`

**中文摘要**：资源上限必须测量真实 outstanding closures 并选对观察点：来源1024个在途 binding calls，在 macrotask 的 microtasks 排空后检查，done 另行复查；metadata 在验证/boot 前读一次普通值快照。O(depth) completion cursor 与 reply prefix compaction 是独立内存规则。

**何时适用/前提**：子进程可突发调用异步 binding、多个 data event 共享 macrotask，或 binding metadata 带 getter；存在可控制 pending/instant binding、同批 done 和宽 completion 的 runtime harness。不能用 resolved reply backlog 或 per-event snapshot 代替真正在途调用数。

**机制义务（提取要点；保留关键英文措辞）**：
- pendingCalls 在 dispatch 前递增、finally 全路径释放；严格 `>1024` 才 worker-exit，允许恰好1024，不是 byte cap。
- 每 macrotask 只排一次去重 `setImmediate`，在 microtasks/finally 排空后检查；done 接受前单独复查。已结算后 scheduled check no-op，不能靠同批 done 越过超限。
- namespace.global、errorClass.name/memberNameProperty 各读一次普通值，验证和 boot serialize 同一份 snapshot，不再读 getter。
- Hold one cursor per open nesting level instead of copying every member.
- Compact consumed queue prefixes during the drain; do not wait for an empty queue.
- Bound auxiliary state separately from the primary byte/content budget.

**机制特定失败/例外/证据限制**：1025 instant gather 或跨 reads 的1300 instant calls 应成功；1025 unresolved calls 单批无后续帧仍须提前 worker-exit，同批 done 也不能偷渡；恰好1024 pending+done 可完成。completion cursor 的 O(depth) 不覆盖 lossless dict collision set 的 O(keys)。这些是来源给出的具体控制，目标仍未执行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e

<a id="bounded-content-actions-visible"></a>
## 9. Bounded Content Actions Visible

**机制 ID**：`rationale-bug-fix-2-bounded-content-actions-visible`

**中文摘要**：一个上限值由共享祖先声明并供两个消费者使用；只让文本滚动，操作行留在滚动区外；滚动区可聚焦，长命令故意可证伪。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：A single cap value is declared on a shared ancestor and consumed by both the text region and the action row. Only the text scrolls; the action row stays outside the scroll region, which is a focusable group so keyboard users can read the tail.

**机制义务（提取要点；保留关键英文措辞）**：
- Declare the cap once at the shared ancestor and derive both consumers from it.
- Keep decision/action controls outside the scrolling region while text scrolls.
- Make the scroll region keyboard-focusable and verify the long command remains falsifiable.

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-approval-panel-command-cap.md:1-53@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-approval-panel-command-cap.md:1-53@687f282e

<a id="bounded-deterministic-comparison"></a>
## 10. Bounded Deterministic Comparison

**机制 ID**：`rationale-bug-fix-2-bounded-deterministic-comparison`

**中文摘要**：用固定 maxEditLength 限制 diff 搜索而非墙钟；超限时退化为保留全部行的粗粒度替换；卡片与统计共用同一确定性推导。内容行把末尾换行视为终止符；上限只约束编辑图搜索，规范化、回退行与复制输出仍随输入长度增长。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Diff cards derive line patches with the maintained diff library bounded by maxEditLength 256; exact changes get up to three neutral context lines, distant changes separate hunks, shared context counted in neither total; above 256 additions/deletions per fragment the complete old/new fragments render as a coarse replacement preserving every line in display, c…

**机制义务（提取要点；保留关键英文措辞）**：
- bound an expensive comparison deterministically (not by clock), fall back to a coarse but complete representation, and share one derivation between display and totals
- Diff cards derive line patches with the maintained diff library bounded by maxEditLength 256
- exact changes get up to three neutral context lines, distant changes separate hunks, shared context counted in neither total
- above 256 additions/deletions per fragment the complete old/new fragments render as a coarse replacement preserving every line in display, copy and counts
- treat a final newline as a terminator when deriving content lines, and keep the bound on edit-graph search rather than wall-clock time

**机制特定失败/例外/证据限制**：上限只约束编辑图搜索，不约束墙钟时长；规范化、回退行及复制内容仍随输入长度增长，展开卡片也单独推导正文行。内容行规则把末尾换行视为终止符。浏览器构建需包含维护中的 `diff` 库；无需缓存或异步渲染。129 处替换回归在移除上限时失败，因为无上限实现返回精确统计而非要求的完整片段回退。按上方共用失败处理与证据限制执行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-14-web-diff-context.md:1-34@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-14-web-diff-context.md:1-34@687f282e

<a id="bounded-optional-payload"></a>
## 11. Bounded Optional Payload

**机制 ID**：`rationale-bug-fix-2-bounded-optional-payload`

**中文摘要**：可选 best-effort diff 基准由提供方拥有并受配置上限约束；用描述符 open/stat/read 防 TOCTOU；越界、变化、二进制或 errno 都返回 before:null。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Provider owns optional best-effort diff basis; config bound applies to both replacement and prior file; descriptor-based open/stat/read enforces the limit against TOCTOU; reaching boundary, size change, binary/invalid UTF-8 or errno yields before:null without failing the committed write; consumer keeps whole-file fallback

**机制义务（提取要点；保留关键英文措辞）**：
- bound optional derived payload at its producer with descriptor-level enforcement and explicit degradation
- Provider owns optional best-effort diff basis
- config bound applies to both replacement and prior file
- descriptor-based open/stat/read enforces the limit against TOCTOU

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-bounded-overwrite-diff-basis.md:1-32@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-bounded-overwrite-diff-basis.md:1-32@687f282e

<a id="bounded-shutdown-escalation"></a>
## 12. Bounded Shutdown Escalation

**机制 ID**：`rationale-bug-fix-2-bounded-shutdown-escalation`

**中文摘要**：backend 限完整 OTel shutdown（默认/发布3s），launcher 另有不可配置的 referenced5s 总边界。正常调用合并、首码保留且健康成功只设 exitCode；pending shutdown 的信号立即按自身码退出，不让 latch 吃掉升级。

**何时适用/前提**：SDK timeout 未覆盖完整 provider Promise、任意 plugin disposer 挂起，或 native handles 在正常 dispose 后仍排空。backend owner 管 export loss/latency，launcher owner 管整个进程的 graceful/forced 边界。

**机制义务（提取要点；保留关键英文措辞）**：
- Bound complete OTel provider shutdown (default/shipped3s) separately from the launcher's referenced fixed5s process backstop.
- Coalesce normal calls, preserve first code, never escalate each other; healthy disposal uses process.exitCode and natural handle draining, rejected disposal forces exit.
- First signal starts grace when none is pending; any signal during pending shutdown, even the first during normal disposal, immediately exits with that path's code. Post-disposal handle draining can still be interrupted.
- Preserve headless0/1/130/143 versus Web SIGTERM0/SIGINT130; no latch may remove escalation.

**机制特定失败/例外/证据限制**：强制/超时可能丢 export 和余下清理，并不证明 quiescence；不能削弱普通 disposer。只 bound backend 或只加 timeout 都不替代显式升级，健康成功也不应总 process.exit。目标控制器/OTLP/真实 PTY 证据缺失，automatic 表示需保留的源效果；场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-03-cli-signal-shutdown-escalation.md:1-57@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-03-cli-signal-shutdown-escalation.md:1-57@687f282e

<a id="build-artifact-order"></a>
## 13. Build Artifact Order

**机制 ID**：`rationale-bug-fix-2-build-artifact-order`

**中文摘要**：包产物先于 browser consumer 是自动脚本/gate 契约，不是只靠 README/评审的建议；来源 `test:web` 明确 `build && test:web:built`，`check:all` 进入 gate runner，历史 Note 说明 check-all 已先 build 再 build:web。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：A documented demo command built the shell but not the client plugin bundles, so the browser failed at runtime with 404s; UI browser lanes can likewise load a stale library if the package is not rebuilt first. The documented runnable entry must build every runtime artifact in order.

**机制义务（提取要点；保留关键英文措辞）**：
- Encode the artifact producer before the frontend/browser consumer in local runnable scripts and CI gates; build failure stops the dependent lane. Review is supplemental, not a substitute.
- Treat missing generated artifacts as a build failure, not a runtime browser failure.
- For UI/browser evidence, rebuild stale libraries before the lane and add a stale-bundle negative control.

**机制特定失败/例外/证据限制**：仅重建 shell 会继续服务 stale plugin bundle，不能用它证明 CSS negative control。隔离目标必须删声明、重建对应 package+shell 后观察真实浏览器失败，恢复后同入口复验；已有完整 build 的 caller 可直接 `dsh web`，但 server boot 不承担编译。已读来源脚本/gate，不代表已运行目标 CI/浏览器。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-23-demo-web-builds-client-bundles.md:1-28@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-themed-scrollbars-and-reserved-gutter.md:1-85@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-approval-panel-command-cap.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-composer-text-layers-share-one-scrollport.md:1-85@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-23-demo-web-builds-client-bundles.md:1-28@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-themed-scrollbars-and-reserved-gutter.md:1-85@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-approval-panel-command-cap.md:1-53@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-composer-text-layers-share-one-scrollport.md:1-85@687f282e
来源：deepseek-harness/package.json:77-87@687f282e；deepseek-harness/scripts/run-gates.ts:332-352@687f282e

<a id="cancellation-scope"></a>
## 14. Cancellation Scope

**机制 ID**：`rationale-bug-fix-2-cancellation-scope`

**中文摘要**：普通 Web Session 的 stop 只停当前轮次并保留独立队列；session-backed subagent 必须先拒绝为 `agent-busy`。Host 拥有 occurrence/FIFO 领取，浏览器不重发，取消收敛后才开始下一轮。

**何时适用/前提**：普通 Session 的 Web `session.cancel` endpoint；有活动 turn、独立 queued/steering occurrences 和 Host FIFO owner。session-backed subagent 是拒绝对照，不是 keepInbox 的另一个普通调用者。

**机制义务（提取要点；保留关键英文措辞）**：
- scope cancellation to the requested effect, keep one writer for queue state, wait for quiescence before successor work
- First reject a session-backed subagent with agent-busy; only ordinary sessions call agent.cancel({kind:'user'}, {keepInbox:true}) to preserve queued and steering entries.
- host owns occurrence identity/claim order and retires claimed rows via authoritative dequeue
- browser never resends/promotes

**机制特定失败/例外/证据限制**：default Agent.cancel 仍 broad，ACP/TUI 与 AgentHandle.dispose 保持自身策略；Web 只显示 queued，不显示可能保留的 steering。uncooperative active work 延迟下一轮，不能并发替代；单行 delete 才是显式丢弃。验收分别观察普通 Session abort→FIFO/no-discard、subagent agent-busy/no-effect、取消延迟后恢复；仍是未执行目标场景。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-web-stop-preserves-queue.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-web-stop-preserves-queue.md:1-38@687f282e

<a id="capability-authority-check"></a>
## 15. Capability Authority Check

**机制 ID**：`rationale-bug-fix-2-capability-authority-check`

**中文摘要**：UserQuestionService.ask 依次检查 aborted、empty batch、当前 exact live root、intent、provider；不用持久 lineage 判当前权限。缺失/过期对象 CALLER_NOT_LIVE，owned child DELEGATED_CALLER，且不产生人类等待。

**何时适用/前提**：共享 human-interaction seam 收到带 Agent 的调用，涵盖 ask_user_question、exit_plan_mode 与直接 consumers。service owner 保持 aborted/empty 优先于 root guard，再进行 intent/dispatch；registry exact instance 与 roots 是权威。

**机制义务（提取要点；保留关键英文措辞）**：
- Use UserQuestionService.ask and preserve aborted→EMPTY_QUESTIONS→exact-live-root→intent→provider precedence.
- Missing registry or stale same-id object yields CALLER_NOT_LIVE; a live owned child yields DELEGATED_CALLER before UI/provider invocation.
- Runtime roots, not durable delegationDepth, decide eligibility: historical child resumed as root may ask; zero-depth live child may not.
- Keep agentless programmatic provider behavior and consumer-neutral child-final-result guidance; do not invent forwarding or move the guard into one tool/composer.

**机制特定失败/例外/证据限制**：旧 session lineage 不永久拒绝新 root；child final result 才是现成上行交付，不是 answer-forwarding。源码 class/identity/ask-order 已核对，但目标 service/tool/assembled 执行缺失；automatic 不是已实现证明，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-01-ask-user-delegated-caller-guard.md:1-40@687f282e`

**实现核对**：`deepseek-harness/packages/interaction/user-questions/src/index.ts:131-144@687f282e`；`deepseek-harness/packages/interaction/user-questions/src/index.ts:287-330@687f282e`（class 声明另于79核对）。

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-01-ask-user-delegated-caller-guard.md:1-40@687f282e

<a id="capability-readiness-predicate"></a>
## 16. Capability Readiness Predicate

**机制 ID**：`rationale-bug-fix-2-capability-readiness-predicate`

**中文摘要**：提供方可用 = 活跃适配器注册 + 已命名凭据；无引用配置和原生认证路由也算可用；仅首次运行 posture 需要 needsSetup；每张卡自管关闭处理。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：providerUsable = active adapter registration + named credential stored; reference-free profiles and live routes with no settings address count as native auth; provider-ready if any row usable; needsSetup only for first-run posture; each card owns its close handler and dismissal is local viewing state; registration rather than configurability defines usabilit…

**机制义务（提取要点；保留关键英文措辞）**：
- readiness is a capability predicate over all providers, and UI close state is owned by the card that displays it
- providerUsable = active adapter registration + named credential stored
- reference-free profiles and live routes with no settings address count as native auth
- provider-ready if any row usable

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-onboarding-reads-every-provider.md:1-39@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-onboarding-reads-every-provider.md:1-39@687f282e

<a id="capacity-relative-limits"></a>
## 17. Capacity Relative Limits

**机制 ID**：`rationale-bug-fix-2-capacity-relative-limits`

**中文摘要**：每个引用源按完成 assemble 后实际选中模型取 max(65536, floor(contextWindow×4×fraction)) bytes，fraction 默认0.2。显式 maxReferenceBytes 精确绕过 lookup；缺 metadata 保底，缺 adapter 不等于 middleware 路由不能服务。

**何时适用/前提**：live model switch 使 header/options 预算过时，或消费者混淆显式覆盖、metadata 缺失与真实查询失败。reference-context owner 管 completed-assembly 观察和 effect-owned WeakMap/listener，reviewer 检查不要重复执行路由。

**机制义务（提取要点；保留关键英文措辞）**：
- Observe completed system-prompt/assemble into an Agent WeakMap with an effect-owned local prepend listener; before assembly use options and no-Agent diagnostics do not update state.
- Per source use max(65536, floor(contextWindow×4×referenceContextFraction)), default0.2; four bytes/token is a heuristic, not aggregate reservation.
- Apply explicit maxReferenceBytes exactly and bypass lookup/floor; do not reassemble or redispatch routing.
- Missing route/service/adapter/capacity keeps the floor; other errors/cancellation propagate. An absent adapter still permits stream middleware to serve the route.

**机制特定失败/例外/证据限制**：预算不改变 projection/retention/preview；listener 随 effect 移除且不持有 Agent。automatic 保留源 preparation 效果，不是当前目标实现证明。100000窗口→80000bytes、低容量→65536、显式12345→12345 与 middleware 无 adapter 等场景均 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-model-budget.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-model-budget.md:1-26@687f282e

<a id="captured-observation-single-source"></a>
## 18. Captured Observation Single Source

**机制 ID**：`rationale-bug-fix-2-captured-observation-single-source`

**中文摘要**：完整产物与有界预览来自同一份捕获投影，不二次读取源；未截断不写产物；取消阻止发布；过期与不可用如实说明。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：The full artifact and bounded preview must derive from the same captured user/assistant projection (including compaction checkpoints, excluding tools/reasoning) with no second source read; cancellation before publication prevents context publication.

**机制义务（提取要点；保留关键英文措辞）**：
- Capture the projection once and derive every representation from it.
- Do not re-read the source when saving or retrieving; preserve the captured sequence.
- Prevent publication on cancellation even if storage already created an artifact.

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-spill-reuse.md:1-42@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-spill-reuse.md:1-42@687f282e

<a id="client-lifetime-ancestry"></a>
## 19. Client Lifetime Ancestry

**机制 ID**：`rationale-bug-fix-2-client-lifetime-ancestry`

**中文摘要**：valid started 在 dispatch 前更新当前 child→parent；finished 依自身 immutable parent 路由但不覆盖复用 id 的新边。同一 runtime 中跨订阅保留，重启新进程才重置；树通知可见，根 response 只取根事件，无关通知仍走 global queue。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Client records child-to-parent edges from subagent.started, routes notifications by walking client-lifetime ancestry, never rewrites ancestry on finished, resets on runtime restart; only root session events feed TurnResult.events

**机制义务（提取要点；保留关键英文措辞）**：
- Record valid start edges before dispatch and walk the one-current-parent graph cycle-safely.
- Route late finishes by their immutable parent without reparenting a newer reused child id.
- Retain across subscriptions/turns in one runtime; reset for a new runtime process, not each subscription.
- Deliver discovered tree notifications/callbacks in wire order, root-only events/final response and unrelated global notifications separately; avoid tree buildup on the global queue.

**机制特定失败/例外/证据限制**：这不是 immutable-ever start edges 或跨进程图持久化，也未新增 exact run-id wire correlation。目标 SDK/router/queue 实测缺失，automatic 仅保留源效果，planned 场景不代替实现。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-24-recursive-python-sdk-session-notifications.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-24-recursive-python-sdk-session-notifications.md:1-30@687f282e

<a id="compile-time-pin"></a>
## 20. Compile-time checkpoint pin and explicit /compact event pairing

**机制 ID**：`rationale-bug-fix-2-compile-time-pin`

**中文摘要**：源 Note 含两个独立合同：(1) 客户端 `COMPACT_PLUGIN` 用 type-only leaf 的 `CompactionCheckpointSource['plugin']` 在编译期钉住，type-only import 必须过 client purity gate，死 fold/contract 删除；(2) 成功的命名 `/compact` 只按持久 `command/done` 的 `summaryEventSeq` 与唯一已加载 checkpoint 配对，不按相邻关系或解析出的展示文本。

**何时适用/前提**：变更 checkpoint plugin id、客户端类型/纯度边界，或手动 `/compact` 与 checkpoint 的配对；需要真实窗口/分页与 cold resume。

**机制义务（提取要点；保留关键英文措辞）**：
- Compile-time pin：type-only leaf 声明 `CompactionCheckpointSource['plugin']` 钉住客户端字面量；`COMPACT_PLUGIN` 赋值在 plugin id 改名时是编译错误；import 保持 type-only 并补 tsconfig path/reference。
- Compile-time pin：删除死 fold/contract 代码，不保留第二解释；行为测试用 checkpoint/provenance 记录驱动 compaction Definition。
- Event pairing：只配对成功命名 `/compact` 的 `CommandResult.sourceEventSeq`/持久 `command/done` 引用与恰好一个 `CompactionSummaryNode.summaryEventSeq`；歧义或缺失配对为空，pre-field 日志保留两行 soft-fall。

**机制特定失败/例外/证据限制**：两个合同触发、owner 和证据不同，不能拿一个的证明当另一个的。裸 shape rule 会接受改名；value import 被 purity gate 拒绝。上下文注入可落在 command 与 checkpoint 之间；窗口 cut 丢失 cited summary event 时字段不可用，后续页补齐，不迁移旧日志。源 Note archived/implemented；当前代码绑定未验证，全部场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-transcript-log-ordered-projection.md:1-79@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-transcript-log-ordered-projection.md:1-79@687f282e

<a id="composition-inheritance"></a>
## 21. Composition Inheritance

**机制 ID**：`rationale-bug-fix-2-composition-inheritance`

**中文摘要**：子会话同步绑定父的 standing mount（不是重挂 id 或父 agent key），join 时同代且父销毁后可存活；parent-required API、live-chain joined header 和 own/inherited filter 一并保留。冷恢复 continuable child 会重接父 CURRENT composition，是明确例外。

**何时适用/前提**：工具/提示行来自 agent preset 而 global layer 为空，或子 driver 的 join/filter/header 可能偏离真实 standing instance。roster/driver owners 管同步 bind，reviewer 检查父私有约束不被错误继承和自有输出工具不被剥离。

**机制义务（提取要点；保留关键英文措辞）**：
- Bind synchronously to the parent's standing mount: same generation at join, no second mount/roster read and no dependency on the disposable parent-agent key.
- Require parent in the composition API and join before child registrations; read joined id from the live parent chain, not stale creation header. Rosterless parent joins nothing without error.
- Filter inherited global/ancestor contributions per restriction ownership; exempt own registrations from that scope's filter so structured-output machinery survives. Ancestor restrictions still govern nested scopes.
- Preserve cold-resumed continuable child joining parent's CURRENT composition while the header records start identity; resident children never rejoin and one-shot children never resume.

**机制特定失败/例外/证据限制**：冷恢复差异只需 parent 仍 blank、切 preset 后再 wake 的窄窗口；不能许诺永久原代。per-subagent preset 尚未实现。源普通 keyless examples 没有 roster，需真实 roster+delegation 的 assembled Web 证据。目标自动 binding/可触发事实和运行仍缺，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-child-agents-join-their-parent-preset.md:1-60@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-child-agents-join-their-parent-preset.md:1-60@687f282e

<a id="conservative-cache-degradation"></a>
## 22. Conservative Cache Degradation

**机制 ID**：`rationale-bug-fix-2-conservative-cache-degradation`

**中文摘要**：冷会话摘要信任缓存 blank:false，缓存缺失视为可见非空，绝不为判断 blank 打开冷日志；blank 只在 turn/start 由 true→false。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Cold session summary trusts cached blank:false (checkpoint turn/start remains non-blank), treats cache miss as visible non-blank, never opens a cold log; blank only true->false on turn/start; lastPromptAt only from kind=user user/message; updatedAt=max(createdAt,lastPromptAt) so opening does not promote; all degradations fail toward visibility/lower ordering

**机制义务（提取要点；保留关键英文措辞）**：
- caches may degrade only in the safe direction, with monotonic facts and event-based recency
- Cold session summary trusts cached blank:false (checkpoint turn/start remains non-blank), treats cache miss as visible non-blank, never opens a cold log
- blank only true->false on turn/start
- lastPromptAt only from kind=user user/message

**机制特定失败/例外/证据限制**：The source records unresolved, unverified or explicitly non-promised behavior; preserve it rather than upgrading it to a guarantee.

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-bounded-cold-blank-verification.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-bounded-cold-blank-verification.md:1-36@687f282e

<a id="content-derived-sizing"></a>
## 23. Content Derived Sizing

**机制 ID**：`rationale-bug-fix-2-content-derived-sizing`

**中文摘要**：Mermaid/Graphviz/SVG 用 intrinsic image height、按宽等比缩放和16px padding；source toggle 保留图、copy 取原码，Graphviz theme 重生颜色而非另加 sizing observer。HTML 仍是 opaque/script-free400px frame。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Mermaid/Graphviz/SVG share an inert image canvas whose height comes from the rendered image, aspect preserved when shrinking, 16px padding; iframe auto-height rejected because an iframe cannot derive outer height; measurement scripts/same-origin access rejected because image dimensions already exist. HTML keeps its script-free opaque 400px frame; SVG disable…

**机制义务（提取要点；保留关键英文措辞）**：
- Derive shared inert-image canvas geometry from intrinsic dimensions with proportional width shrink and16px padding.
- Retain image when switching source, copy original code and regenerate Graphviz colors on theme changes without another sizing observer.
- Keep SVG script/link/external loads inert without app-document markup insertion; do not add measurement script/same-origin access/resize messaging.
- HTML isolation/lifecycle/licensing remain separately owned and automatic HTML height stays outside this change.

**机制特定失败/例外/证据限制**：没有源文独立恢复协议，不能生成通用 fail-loud/quarantine 场景。HTML400px 与图形 geometry 是不同隔离边界。目标实际 geometry/source-copy/theme/security 浏览器证据和 automatic binding 缺失；源恢复 not applicable 不豁免目标 C5 修复后复验。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-09-content-sized-diagram-previews.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-09-content-sized-diagram-previews.md:1-26@687f282e

<a id="control-ownership"></a>
## 24. Control Ownership

**机制 ID**：`rationale-bug-fix-2-control-ownership`

**中文摘要**：行点击展开是 opt-in，保持通用 tool-row 契约；Think 行把标题+摘要合成一个可访问 disclosure 目标，不扩大所有行、不制造重复焦点。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Opt-in expandOnRowClick preserves generic tool-row contract (row=details, leading control=arguments) while Think row makes title+summary one accessible disclosure target; rejects widening all rows and duplicate focus stops

**机制义务（提取要点；保留关键英文措辞）**：
- Keep expandOnRowClick opt-in; ThinkRow title+summary is one accessible disclosure target over one component-local expanded state.
- Pointer, Enter and Space toggle the same state; avoid icon-only inert labels and duplicate title/summary focus stops.
- Generic rows that do not opt in keep row-to-details and leading-control argument expansion; do not widen all rows.

**机制特定失败/例外/证据限制**：源码没有独立 failure/recovery path；只对 opted-in row 改 disclosure，不改其他工具交互。目标真实 pointer/keyboard/generic-handoff 证据与 automatic binding 仍缺；not-applicable 源恢复不代表 C5 验收通过。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-23-thinking-row-disclosure-target.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-23-thinking-row-disclosure-target.md:1-30@687f282e

<a id="declarative-overlay-id-safety"></a>
## 25. Declarative Overlay Id Safety

**机制 ID**：`rationale-bug-fix-2-declarative-overlay-id-safety`

**中文摘要**：overlay 不得重复声明基础 bundle 已有的 id；用 id 定向的顶层覆盖并显式 disabled:false，同时只注册一个执行器。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Overlay inserted an id already declared by the base bundle, causing duplicate loader entry at boot; fix uses id-targeted top-level override with explicit disabled:false, and also disables the platform-gated pwsh-sandbox so only one executor registers; reverting reproduces the failure

**机制义务（提取要点；保留关键英文措辞）**：
- Inspect composed declared ids, including disabled/platform-gated rows; insert only an absent id, override an existing id at the top level.
- Explicitly clear tool-pwsh disabled:false after base/Web layers; name alone leaves the unconditional Web disable in place.
- Disable pwsh-sandbox as well as bash-sandbox so pwsh-local is the only executor, including Windows; do not change shipped preset policy for a test overlay.
- Keep loader duplicate-id refusal and verify the actual assembled lane rather than merely accepting YAML.

**机制特定失败/例外/证据限制**：源2/2 证明带 pwsh 的 POSIX seam；无 pwsh 会 skip。Windows base pwsh-sandbox 与 inserted local 的组合从未在源 CI 跑过，test:web 仅 Linux；disable 为 Windows composability，并非该分支实测证明。目标 loader/overlay/assembled 证据仍缺，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-fix-pwsh-terminal-overlay-dup.md:1-56@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-fix-pwsh-terminal-overlay-dup.md:1-56@687f282e

<a id="declared-carrier-authorization"></a>
## 26. Declared Carrier Authorization

**机制 ID**：`rationale-bug-fix-2-declared-carrier-authorization`

**中文摘要**：附件授权与导出按内置事件类型选择内容字段，不按常见字段名猜测；未知事件载荷保持不透明；拒绝测试断言存储从未被读取。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Attachment authorization and ZIP export select content fields by built-in event type (completed assistant blocks, direct content blocks, flat V4 tool-role messages); other fields and unknown event payloads stay opaque even if they resemble image/file refs; controller applies before reading bytes, exporter before reading image/file bytes and retains the full …

**机制义务（提取要点；保留关键英文措辞）**：
- Both readers admit declared built-in content carriers, including flat tool and valid compaction fields; unknown/custom and other fields stay opaque regardless of reference shape.
- Decide before controller image/export image-file storage IO; refusal asserts zero reads and archive retains the complete logical log.
- Exclude title requests (V4 single-text contract); version-owned persistence codecs convert history first, without a second reader codec or changed released inventory.
- Custom-only plugin references need supported content occurrence or their own reader. Add a carrier only with both-reader positive/refusal updates.

**机制特定失败/例外/证据限制**：title exclusion 是预期边界，不是“采用规则当负控”。basic compaction 当前 text 不意味着其他合法 producer 不能附附件。改变 lookup/archive membership，不改 encoding/model history。目标双 reader/zero-IO/archive 实测缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-declared-session-attachment-carriers.md:1-32@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-declared-session-attachment-carriers.md:1-32@687f282e

<a id="declared-vs-sniffed-type"></a>
## 27. Declared Vs Sniffed Type

**机制 ID**：`rationale-bug-fix-2-declared-vs-sniffed-type`

**中文摘要**：扩展名是媒体类型声明；不同非空扩展名在 I/O 前拒绝；仅无扩展名路径在图片上限内读取并按签名嗅探；后端是读取授权权威，完整解码是最终权威。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Extension is a declared media type; a different non-empty extension is refused before I/O; only an extensionless path is read under image caps and sniffed for one of four signatures; the mounted fs backend is the complete read-authorization authority; attachment store full decode remains authoritative and rejects mismatched declarations; errors name the path

**机制义务（提取要点；保留关键英文措辞）**：
- Treat supported extensions as declarations, reject other nonempty extensions before IO, and let store full decode reject declared-byte mismatch.
- Only extension-less paths use ctx.fs under maxImageBytes/tighter maxMessageImageBytes and a tool-local four-signature declaration.
- Mounted ctx.fs completely authorizes paths; do not add reverse/session proof for normalized object paths. Current media policy/saveImage full decode remains authoritative for bytes.
- Re-admit normalized objects under current limits; name failure paths/signatures without exposing unsupported content. Non-image extension-less reads may reach the image cap before rejection.

**机制特定失败/例外/证据限制**：签名/扩展名不授予路径权限，不覆盖 full decode，也不改变附件 API/storage。无扩展名普通图与 normalized object 同边界；错误非空扩展名仍在 I/O 前拒绝。目标 fs/tool/store 集成和执行缺失，automatic 是源义务，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-28-read-image-extensionless-paths.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-28-read-image-extensionless-paths.md:1-30@687f282e

<a id="degraded-transport-fallback"></a>
## 28. Degraded Transport Fallback

**机制 ID**：`rationale-bug-fix-2-degraded-transport-fallback`

**中文摘要**：Files 优先；特定解析失败时丢弃临时 parts，用同一已准备附件原子全量切 inline，不再变换、不混 file id。inline 独立按 base64 计20MiB/10MiB，后续请求仍试 Files；cancel、outer deadline 和 generic chat error 不触发降级。

**何时适用/前提**：Files 不可用/不支持/超时或部分解析失败而 inline 仍可能可用。adapter/serializer owner 管 prepared identity 与请求模式，reviewer 分清 resolution、chat classification 和 terminal outcomes。

**机制义务（提取要点；保留关键英文措辞）**：
- Bound each Files resolution by filesApiTimeoutMs (one minute default); successful resolution refreshes the outer idle watchdog (five minutes default, independently configurable).
- Discard transient file parts and rebuild all retained images as data URLs from the same prepared RequestImageAttachment, with no extra decode/resize/encode and no mixed modes.
- Inline base64-expanded defaults are20MiB/10MiB deterministic oldest-prefix removal; keep600-image/count-quantum limits, separately from Files128MiB/64MiB.
- Preserve committed mappings after partial failure and try Files on the next request without global outage state.
- Cancellation/outer deadline is terminal; generic chat errors do not switch. Stale id invalidates/re-uploads/retries once, with inline only when replacement resolution fails.

**机制特定失败/例外/证据限制**：外层可配置为先到期；inline 会重复 bytes、可能省略更多历史，不承诺保存全部图。已完成映射可复用，显式 file-management 仍报自身错误。目标 adapter/serializer/deadline 自动 binding、适用事实与真实请求执行均缺，场景 planned；不能以文档代替自动能力。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-21-deepseek-files-inline-fallback.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-21-deepseek-files-inline-fallback.md:1-38@687f282e

<a id="derived-state-versioning"></a>
## 29. Derived State Versioning

**机制 ID**：`rationale-bug-fix-2-derived-state-versioning`

**中文摘要**：派生计量以当前实现为版本权威：历史 Note 的 stateVersion3 已演进为固定提交的5。Host 在同事件 surface delta 前记录 provider sample，投影有零下限；UI 只选择 projectedTokens 或 bare pressure，不自行缩放 rows。

**何时适用/前提**：派生 usage/occupancy 受 compaction 或 replacement 影响，且有明确 projection/checkpoint owner。当前 schema、fold/view 与 UI fallback 已读；字段缺失 fallback 不等于接受任意旧 checkpoint version，目标数字也不能机械照抄3或5。

**机制义务（提取要点；保留关键英文措辞）**：
- derived UI state must react to the domain action it describes, version its projection, and degrade explicitly for old data
- Publish max(0, pressureTokens + surfaceTokens - sampledSurfaceTokens); keep the provider anchor exact and only estimate signed surface movement.
- Stamp sampledSurfaceTokens before the same event's delta; pinned current schema uses stateVersion5/shared fold claim state, while3 is historical.
- Occupancy uses projectedTokens ?? pressureTokens only when numerator and contextWindow exist; checkpoint compatibility follows the actual projection owner/version contract.

**机制特定失败/例外/证据限制**：禁止用 summary request 的 usage 伪造 conversation usage，或把 rows 缩放成 header。无 projected 字段时退回 sample；无 numerator/capacity 则不可显示 occupancy。已读当前实现，不等于运行 checkpoint 恢复、fresh replay 或 UI；旧版 checkpoint 的拒绝/重建仍须按实际 owner 单独实测。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-05-context-meter-blind-to-compaction.md:1-47@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-05-context-meter-blind-to-compaction.md:1-47@687f282e
来源：deepseek-harness/packages/llm/token-meter/src/usage-projection.ts:67-106,173-218@687f282e；deepseek-harness/packages/client/ui-conversation/src/client/context-occupancy.ts:15-25@687f282e

<a id="display-memory-keyed-identity"></a>
## 30. Display Memory Keyed Identity

**机制 ID**：`rationale-bug-fix-2-display-memory-keyed-identity`

**中文摘要**：以 session id 记住接受/运行观察，跨同页 refresh/reconnect/对象替换，按 row/object/child identity 持有情况 pruning；page reload 不持久化，不证明 turn/queue/durability。remove/re-add 可能产生双 projection store 的既有缺陷明确仍未修。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Manager keeps accepted/running observations in a private set keyed by session id; list rows and Session blank updates use summary.blank && !engagedSessions.has(id), with metadata hints on top. Every successful prompt response (including from a replaced Session object) updates retained observation, list row and resident Session by id; rejection records nothin…

**机制义务（提取要点；保留关键英文措辞）**：
- Retain observed acceptance/running per id and reconcile list/resident Session blank with summary.blank && !engagedSessions.has(id), preserving metadata hints.
- Successful responses from replaced objects update current identity; rejection records none. Pre-removal baselines cannot resurrect forgotten engagement.
- Prune only after successful mutation-replayed refresh when no row/object/child address retains identity; failed/superseded pulls do not prune.
- Late acceptance cannot recreate removed identity; disposal clears/fences outstanding responses. This is page-local display memory, not durable/queued/started proof and not reload-persistent.

**机制特定失败/例外/证据限制**：source35 的 projection-store ownership 仍 deferred：移除时旧 store 可被丢弃，retained Session 仍读旧 store，re-add 后新 seeded store 与旧 object 读者不一致直到对象替换。展示修复不改变这些 lifetime、Host defaults、scope/provisioning 或 transport/assembly/snapshot。目标 Manager/browser 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-15-client-session-blank-reconciliation.md:1-43@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-15-client-session-blank-reconciliation.md:1-43@687f282e

<a id="documented-platform-capability"></a>
## 31. Documented Platform Capability

**机制 ID**：`rationale-bug-fix-2-documented-platform-capability`

**中文摘要**：Win32 child 在 showing→Show 间发一个 Alt down/up 最小输入授权；保留单 child，但不许诺无竞态的所有 Windows 前台激活。记录 Win11 forced-lock5/5、Win10 未验证、注入被抑制和 menu highlight 副作用，browse 仍由 composition 选择。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：A Win32 folder dialog spawned by a background host cannot take foreground; a synthesized Alt keybd_event (VK_MENU down/up) on the dialog thread immediately before Show makes Windows treat the process as most recent input owner, a documented activation ground. Custom dsh-picker: URL protocol rejected as a much larger registry/server-route/per-boot-token/brows…

**机制义务（提取要点；保留关键英文措辞）**：
- Keep showing→pressAltForForeground VK_MENU down/up→Show on the dialog thread, without a new protocol/launcher surface.
- Press is unconditional on Windows; already-foreground may need no grant but focused windows can briefly highlight a menu.
- Suppressed injection can leave the dialog behind, and asynchronous raw-input consumption leaves a race; browse is a composition-level alternative, not transparent runtime fallback.
- Separate actual foreground evidence (source Win11 forced-lock5/5) from unverified Win10 and CI real-dialog open/abort-close with no activation assertion.

**机制特定失败/例外/证据限制**：secure desktop、restricted remote、elevated foreground 可能抑制输入；5/5 不是确定性跨平台保证，调用顺序也不是 foreground 证据。目标 native binding/实际前台观察缺失，automatic 是有限源机制要求而非已实现承诺；场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-07-win32-picker-foreground-alt-key.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-07-win32-picker-foreground-alt-key.md:1-26@687f282e

<a id="domain-owned-projection-recovery"></a>
## 32. Domain Owned Projection Recovery

**机制 ID**：`rationale-bug-fix-2-domain-owned-projection-recovery`

**中文摘要**：组合 Session registry 时，Inbox 在 AgentLoop 激活注册、提交 splice 在 append 返回前 fold；cold display 不启动 Agent。跨 ready generation 清空旧权威，同代 lower-seq 保留较新值。

**何时适用/前提**：消费者依赖由 durable domain splices 派生的 live/cold projection，且已组合 Session projection registry；明确 generation、Host sequence 与 cache-viewed baseline 的不同权威。变更 read/reconnect/mutation 时分别执行这些边界，不能将缺失 target binding 记为已实现。

**机制义务（提取要点；保留关键英文措辞）**：
- With projection registry composed, register Inbox at AgentLoop activation and fold committed splices before append returns; cold display never starts an Agent.
- Keep one generic projection carrier/store/raw two-list schema, not SessionSnapshot/client fold/live-Agent baseline; surfaces choose next-turn or user-origin next-step directly.
- Ready-generation invalidation clears values/watermarks BEFORE refresh/control stream; old requests cannot publish/settle, new durable seq may lower, same-generation higher Host seq wins while cache-viewed block yields to baseline.
- Actual cold-row mutation resolves ordinary Agent and retains subagent fences; cache version follows fold/serialized changes without a new event/file format.

**机制特定失败/例外/证据限制**：lower seq within one generation 只忽略，不清空较新值；跨代才失效重建。display≠resume，mutation 才 resume；local echo 有独立决策。目标 registry/client/resolver/restart 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-17-durable-web-queue-recovery.md:1-54@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-17-durable-web-queue-recovery.md:1-54@687f282e

<a id="durable-artifact-register"></a>
## 33. Compaction checkpoints use an English engineering register

**机制 ID**：`rationale-bug-fix-2-durable-artifact-register`（历史 ID 保留；该 ID 的 “artifact register” 不是本机制主题，不表示 artifact 生命周期）

**中文摘要**：英文内部工程 checkpoint 要求位于 trailing COMPACTION_INSTRUCTION 的首句；叙述翻译、exact literals（含 signature/非 ASCII）保留。summary request 的 system/tools/history 与 routed request byte-identical，不是所有后续 turn 的 prefix 不变。

**何时适用/前提**：构造 replay-prefix compaction summarization request；该内部 checkpoint 的 instruction register/literal policy 不改变用户对话语言。只有 routed request 与 summary request 的对应前缀参与此 byte-identity 契约。

**机制义务（提取要点；保留关键英文措辞）**：
- Put register requirement in final instruction's FIRST sentence, not in generated checkpoint text; preserve structured headings/bullets and exact multilingual literals.
- Only final summarization instruction changes; compare replayed system/tools/history to routed request, retaining that cache alignment.
- Do not impose visible conversation language/ASCII or invent deterministic output refusal. Direct summary has no Agent-owned Assistant settlement; real-loop test observes final request, not transcript snapshot.

**机制特定失败/例外/证据限制**：instruction 自动供给不保证 model output 语言可被确定性拒绝；源无 retry/repair protocol，非 C5 waiver。目标 request/prefix/实际输出证据缺失，planned 不等于运行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-english-compaction-checkpoints.md:1-29@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-english-compaction-checkpoints.md:1-29@687f282e

<a id="durable-preference-authority"></a>
## 34. Durable Preference Authority

**机制 ID**：`rationale-bug-fix-2-durable-preference-authority`

**中文摘要**：Host Config 是唯一持久偏好权威；已实施 successor 明确每个 authenticated browser 都使用同一 Host 路径，locality 不选择存储。仅 native Open configuration file UI 限 loopback；实例级 session/draft/disclosure 状态仍本地。

**何时适用/前提**：同一 Host 的本地/远端 authenticated browser 偏好共享；需 Connection token、settings.describe.writable 与 namespace revision。镜像先挂 invalidation/reset listeners 再后台读，激活不阻塞；有序写入和 dispose 先跳过 queued 再等待 in-flight 的责任不变。

**机制义务（提取要点；保留关键英文措辞）**：
- classify durable user config vs instance state, keep one durable authority, and define listener/write/disposal ordering
- Persist user preferences in the Host active-profile patch for every authenticated browser; locality selects no Host/memory store and is routing evidence, not identity.
- page-local session/draft/disclosure state stays local
- settings mirror installs invalidation/reset listeners before background read so activation is nonblocking and no read-before-subscribe gap exists
- Use one settings.describe mirror and per-namespace form/mutate path; mirror is idle/loading/ready and form snapshots have no persistence mode.
- Fence concurrent writes by expectedRevision; only native Open configuration file/hasDocument UI is loopback-specific, while its Remote stays authenticated.

**机制特定失败/例外/证据限制**：2026-08-06 的 non-loopback process-local 分支被 2026-09-15 successor 取代。unavailable 只限未注册 namespace；locality 不选择存储或放宽认证。源自动路径保留，目标 Host/browser/lifecycle binding 与 remote reload/authentication evidence 仍缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-host-backed-web-preferences.md:1-44@687f282e`（部分被取代的历史）；`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-15-authenticated-browser-host-preferences.md:1-29@687f282e`（当前身份/存储边界）。

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-host-backed-web-preferences.md:1-44@687f282e
来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-15-authenticated-browser-host-preferences.md:1-29@687f282e

<a id="early-authoritative-facts"></a>
## 35. Early Authoritative Facts

**机制 ID**：`rationale-bug-fix-2-early-authoritative-facts`

**中文摘要**：只有更早的权威来源（session-list summary blank=true）能豁免 settling guard；snapshot blank 与 summary blank 区分；其他状态保守隐藏。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：A settling guard may be exempted only when an earlier authoritative source (the session-list summary blank=true) proves the outcome. Snapshot blank is distinct from summary blank; all other states keep the conservative hide.

**机制义务（提取要点；保留关键英文措辞）**：
- Use earlier summary blank:true, distinct from snapshot blank; blank:false and absent rows keep conservative settling.
- With blank composer and summary proof, hero remains through cold/loading/error without falsifying openState; preserve existing frame/DOM nodes during initial selection.
- Hold history open to expose the decision interval; existing knowledge already had the three concrete summary shapes and hero timeline.

**机制特定失败/例外/证据限制**：unknown/nonblank 不豁免；reference churn 独立 deferred。目标 summary/phase binding 与 held-history/DOM 实测缺失，既有 planned 场景不算新执行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-hero-visible-while-blank-session-opens.md:1-34@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-hero-visible-while-blank-session-opens.md:1-34@687f282e

<a id="effect-co-location"></a>
## 36. Effect Co Location

**机制 ID**：`rationale-bug-fix-2-effect-co-location`

**中文摘要**：takeover chrome 从 shell 移入 step 的可见分支，使 null decision 按构造既不绘制也不阻塞；slot 契约声明注册者拥有 wrap。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Takeover chrome (portal/mask/stage/root-inert) moves from the shell into the step's visible branch so a null decision paints and blocks nothing by construction; slot contract states registrants own the wrap; test holds settings.describe open and samples at 8ms

**机制义务（提取要点；保留关键英文措辞）**：
- Mount portal/mask/stage and #root inert only in the step's visible OnboardingSurface branch; undecided null leaves the app visible and non-inert.
- Keep shell coordinator/slot currency unchanged and render elected step bare; registrants own visible wrap/null while private facts undecided.
- Missing wrap renders bare, not a shell fallback; configured reload self-completes without takeover, unconfigured takeover starts after the join with content present.

**机制特定失败/例外/证据限制**：源 held settings.describe +8ms sampler 是验证技术，不是治理义务；不能要求已配置步骤在响应释放后出现 chrome。目标 primitive/shell/steps/DOM-inert 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-onboarding-step-owned-takeover-chrome.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-onboarding-step-owned-takeover-chrome.md:1-36@687f282e

<a id="engine-owned-measurements"></a>
## 37. Engine Owned Measurements

**机制 ID**：`rationale-bug-fix-2-engine-owned-measurements`

**中文摘要**：Chat 独享 engine-owned stable gutter；overlay 明确 auto，由 view 拥有滚动区/seat compensation。两支保持 overflow-x:hidden / overflow-y:auto，不能把 WebKit 会忽略的 hidden box 或隐藏滚动条测试当布局证明。

**何时适用/前提**：实际存在占布局宽度的滚动条、Chat sticky content-box 与 overlay padding-box 的几何差异；不向所有 scroller 泛化 stable，不硬编码源8px。

**机制义务（提取要点；保留关键英文措辞）**：
- Reserve stable for Chat short/scrolling and hero/first-turn phases; keep its sticky flow and accept narrower content.
- Overlay overrides auto and retains its own compensation/scroller ownership; overflow-y:auto is WebKit's load-bearing precondition, with overflow-x:hidden to avoid an accidental horizontal bar.
- Measure real engine rectangles at capped/shrinking widths without --hide-scrollbars and apply uncompensated overlay cascade as the old-state control.

**机制特定失败/例外/证据限制**：overlay 不保留 gutter，未来可溢出 view 要自行 clip。源4px/8px 是观察而非跨引擎常数；jsdom/CSS 文本不证明几何。源无独立 runtime recovery；目标布局 binding/engine 观察缺失，planned 不等于通过。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-04-composer-tab-gutter-reservation.md:1-49@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-04-composer-tab-gutter-reservation.md:1-49@687f282e

<a id="engine-specific-recovery-gate"></a>
## 38. Engine Specific Recovery Gate

**机制 ID**：`rationale-bug-fix-2-engine-specific-recovery-gate`

**中文摘要**：Safari 软换行后原生行布局残留；恢复需同时满足缓存的 Safari 身份、原生收缩信号和实际违反单滚动区不变量，再执行有序 1px 失效。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Safari retains stale native textarea line layout after a shrink across a soft-wrap threshold. Recovery is gated on cached Safari identity, a native-shrink signal, and an actually violated single-scrollport invariant, then performs ordered one-pixel invalidation.

**机制义务（提取要点；保留关键英文措辞）**：
- Cache constrained Safari identity; require native shortening before geometry reads, then require postcommit scrollHeight/clientHeight mismatch before forced layout.
- Apply textarea1px invalidate/layout/restore/layout, then scrollport in that order before paint, retaining value/selection/IME/undo.
- Non-Safari/programmatic/non-shortening changes read no geometry; settled Safari shrink forces none. Resize/sidebar-only stale state is outside the trigger.

**机制特定失败/例外/证据限制**：组件可固定52/28/20→28/28/0、顺序和 gate；原生51→50 Backspace 缺陷由 real Safari26.5.2 证据负责，Chromium CI/Playwright WebKit26.5 本来就正常，不能代替。目标 component/native binding 与真实 Safari 实测缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-safari-textarea-soft-wrap-reflow.md:1-48@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-safari-textarea-soft-wrap-reflow.md:1-48@687f282e

<a id="environment-independent-identity"></a>
## 39. Environment Independent Identity

**机制 ID**：`rationale-bug-fix-2-environment-independent-identity`

**中文摘要**：Workspace 身份不得依赖进程状态；在 realpath 前拒绝非完全限定路径，复用平台解析器接受 drive/UNC，拒绝 drive-relative/current-drive-root。无效拼写先于文件系统访问失败；完全限定但不存在的路径仍返回原始文件系统错误；UNC share 根用 share 名作非空默认标题。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Registry create/resolveByPath reject non-fully-qualified paths before realpath (POSIX absolute; Windows win32.isAbsolute plus parsed root not \ or /), accepting drive/UNC while rejecting drive-relative and current-drive-root spellings without a second path grammar; canonical path remains identity; default title uses final segment or parsed root; browser-safe…

**机制义务（提取要点；保留关键英文措辞）**：
- Require caller-qualified paths before realpath using the platform parser, not cwd/guessed Workspace anchors; preserve original filesystem errors for qualified nonexistent paths.
- Keep canonical path identity and nonunique labels; root defaults use parsed root or UNC share final segment.
- Choose join separator from Workspace spelling and retain the separator after a drive-root colon in either slash style.

**机制特定失败/例外/证据限制**：标题不唯一，调用者必须给完全限定路径；drive/UNC 根仍有效，非限定输入先于 IO 拒绝。源没有模板所称的未决平台行为。目标 registry/helpers/IO 实测缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-fully-qualified-workspace-paths.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-fully-qualified-workspace-paths.md:1-36@687f282e

<a id="event-conditioned-timeout"></a>
## 40. Event Conditioned Timeout

**机制 ID**：`rationale-bug-fix-2-event-conditioned-timeout`

**中文摘要**：只在已见提示符标记且尾部未到时延长静默上界；默认 0 精确保留旧行为；非法值拒绝；测试覆盖晚到、永不到、失效与零值。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：promptTailGraceMs (default 0) extends the silence bound only while a send has seen the prompt marker and its printable tail has not arrived; every other bound/reason/code path unchanged; zero reproduces the previous bound bit-for-bit. Raising the default rejected because it imposes fixed cost everywhere and delays never-arriving tails; sticky observation rej…

**机制义务（提取要点；保留关键英文措辞）**：
- Keep default0 and the previous plain bound exactly; validate zero/nonnegative integer and refuse nonzero below pollIntervalMs.
- Extend only current marker-seen/valid-tail-pending silence by promptTailGraceMs; all other tier bounds/reasons remain unchanged.
- Missing marker or a seen tail invalidated by later output keeps the plain bound; never-arriving tail falls back at the extension, not timeoutMs.
- Observe per-send readiness rather than retry tests/raise defaults/stick old tail evidence; these are rejected alternatives, not positive obligations.

**机制特定失败/例外/证据限制**：源 persistent pwsh composition 保持0；self-hosted 退化发送未激活此 tolerance，后续记录 malformed tail，不能称已被本字段修复。guest-patched 晚到实验是历史证据，不是当前执行；目标 timer/config/native 实测缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-27-pwsh-prompt-tail-grace.md:1-31@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-27-pwsh-prompt-tail-grace.md:1-31@687f282e

<a id="evidence-gated-backfill"></a>
## 41. Evidence Gated Backfill

**机制 ID**：`rationale-bug-fix-2-evidence-gated-backfill`

**中文摘要**：只有恰好一个受支持的自身 descriptor 才补全缺失父目录项；其他数量/版本保留 unknown 成员关系；不推断 mode/label，不选择首/末 descriptor。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Backfill a missing parent catalog entry only when exactly one supported own child descriptor supplies the fields. Other descriptor counts/versions retain unknown-mode membership; never choose first vs last or invent mode/label.

**机制义务（提取要点；保留关键英文措辞）**：
- Backfill only from exactly one supported OWN child descriptor; preserve existing complete entries and header-proven unknown when evidence is absent/ambiguous.
- Check known creation-time conflicts independently; child-local decode/field warns, cancellation/source consistency aborts, inspected revisions rechecked before publication.
- No first/last guess, recursive child-catalog preparation or published-V4 automatic rescan/backfill; child independently reopens actual log/capabilities, unknown browseable but known-continuable only for list_agents.

**机制特定失败/例外/证据限制**：older whole-parent failure propagation 被部分替代，不删除 cardinality/conflict/immutable publication；v1 unknown/v0 healthy payload 与旧 reader 拒绝区别保留。目标 converter/catalog/migration 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-session-local-subagent-migration.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-v3-incomplete-child-catalog-evidence.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-session-local-subagent-migration.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-v3-incomplete-child-catalog-evidence.md:1-30@687f282e

<a id="exact-format-recognition"></a>
## 42. Exact Format Recognition

**机制 ID**：`rationale-bug-fix-2-exact-format-recognition`

**中文摘要**：只把严格等于 v1 的末段视为已有版本并追加 /messages 或 /files；其他基址完整追加 /v1/messages 或 /v1/files；同一解析根作用于文件缓存，不推测其他版本兼容。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：The shared Messages owner trims trailing slashes and treats only a final segment exactly equal to v1 as an existing version, preserving that root and appending /messages or /files; all other bases get /v1/...; the resolved root also scopes cached file uploads. Recognizing any v+digit suffix rejected as an undocumented compatibility policy that can bypass the…

**机制义务（提取要点；保留关键英文措辞）**：
- Trim trailing slashes; preserve an exact final v1 root for /messages and /files.
- Every other base gets /v1/messages or /v1/files in full, including version-like v1beta/v2/v4 nonmatches.
- Resolve one root for both transports and upload-cache identity; do not generalize version recognition or duplicate an explicit /v1.

**机制特定失败/例外/证据限制**：完整 endpoint 不是裸 /v1/；/anthropic 与 /anthropic/v1 共用同一根，其他 suffix 有意放弃推测代理兼容。源无独立 recovery，非 C5 waiver。目标 transport/cache/endpoint 实测缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-15-messages-v1-base-url.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-15-messages-v1-base-url.md:1-26@687f282e

<a id="exact-input-provenance"></a>
## 43. Exact Input Provenance

**机制 ID**：`rationale-bug-fix-2-exact-input-provenance`

**中文摘要**：beforeinput 记录 selection/inputType，并把精确应用范围传给 setDraft，优先于模糊前后缀扫描；替换选择、删除与字素测量都按实际输入。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：beforeinput records selection and inputType and passes the exact applied range to setDraft, preferring it over the ambiguous common-prefix/suffix scan; replace-selection reports the selection, caret deletion measures actual characters lost (multi-unit grapheme/word/line), only insert/delete families recorded, history replay ignored; record consumed once and …

**机制义务（提取要点；保留关键英文措辞）**：
- Capture insert/delete beforeinput selection/type; consume and clear once, prefer only a validated exact range.
- Replacement uses selected span/actual inserted delta; caret delete uses direction and measured lost units, not a fixed one-character step.
- Invalid length/out-of-bounds/unexplained shrink/undirected delete return no range to existing scan. History/facade/missing provenance keep scan; paste/boundary gestures keep their own ranges.
- Preserve deliberate inside-reference identity loss; fix provenance rather than weakening reconciliation or adding private marker characters.

**机制特定失败/例外/证据限制**：依赖 beforeinput 在 value change 之前且 delete inputType 有方向；缺失即旧 scan，不伪造精确范围、不 fail-loud。真实按键/IME 应观察结构 occurrence/model form 而非只看可见文本；目标 event/machine/browser 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-composer-edit-range-from-selection.md:1-48@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-composer-edit-range-from-selection.md:1-48@687f282e

<a id="explicit-event-reference"></a>
## 44. Explicit Event Reference

**机制 ID**：`rationale-bug-fix-2-explicit-event-reference`

**中文摘要**：成功 /compact 用持久 sourceEventSeq 与唯一 loaded summaryEventSeq 配对，不按邻接/英文文案；另一个编译约束钉住的是 checkpoint plugin-id literal，不是 seq 引用类型。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Use an explicit authoritative reference such as summaryEventSeq to pair events; adjacency and parsed presentation text are not stable identities.

**机制义务（提取要点；保留关键英文措辞）**：
- Persist manual sourceEventSeq and pair only a successful named /compact with exactly one loaded summary reference; preserve running key at checkpoint flow position.
- Read summary/count/token estimate from the cited structured event; missing-page data stays unavailable until supplied, old logs keep two-row soft-fall.
- Recognize user/message AND owner plugin AND replacement. Pin CompactionCheckpointSource['plugin'] through a type-only cordis-free leaf with paths/project reference, separately from seq matching.
- Keep generic failed/cancelled/rejected rows and automatic standalone markers; do not widen client purity/import host root or guess an adjacent checkpoint.

**机制特定失败/例外/证据限制**：ambiguous references pair nothing，append plugin message 仍是 context；type-only host-root 仍有 Context collision。源历史义务不证明当前目标 runtime/build/browser 已绑定；场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-transcript-log-ordered-projection.md:1-79@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-transcript-log-ordered-projection.md:1-79@687f282e

<a id="external-spec-verbatim-port"></a>
## 45. External Spec Verbatim Port

**机制 ID**：`rationale-bug-fix-2-external-spec-verbatim-port`

**中文摘要**：逐句移植提供方公开计算器的 v41 配置，按公开向量重钉测试；删除不可达旧配置；把相邻的像素预算改动拆成后继决策。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：image-tokens.ts rewritten as a verbatim port of the provider's published v41 calculator (14px patch, 3:1 downsampling, 544x544 floor, 1024 cap, rows*(cols+1)+2, no odd-row/parity/pad/ratio clamp, closed-form over-budget solve), with test vectors re-pinned from the published calculator and prose/README numbers updated. Keeping both configs or generic switches…

**机制义务（提取要点；保留关键英文措辞）**：
- Port v41 literally:14px patch,3:1 per-axis downsampling,544×544 floor,1024 cap and rows×(cols+1)+2; preserve fixpoint and closed-form solve/published assertion.
- Remove odd-row/parity/even-row trim/alignment pad/aspect clamp/decrement-loop and unreachable old configurations; pin published vectors and pricing/README numbers together.
- Keep request-content succession separate: current targets and pricing share provider-owned solver, not historical640000 default; completed provider usage remains authoritative.

**机制特定失败/例外/证据限制**：source800×800/640×480/512×512 prices422/206/184 是 estimator vectors，不是当前默认 request targets。replay 用 fixture imageRequestTokens，不能证明图片发送尺寸；源无独立 recovery。目标 solver/vector/current-target 绑定与实测缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-10-deepseek-image-token-calculator-v41.md:1-28@687f282e`

**后继范围**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-10-deepseek-v41-request-image-projection.md:16-18@687f282e`（当前 target/pricing 共享 solver；不把旧640000 当当前默认）。

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-10-deepseek-image-token-calculator-v41.md:1-28@687f282e

<a id="fail-closed-capability-selection"></a>
## 46. Fail Closed Capability Selection

**机制 ID**：`rationale-bug-fix-2-fail-closed-capability-selection`

**中文摘要**：bwrap 必须 unshare PID 命名空间并挂载私有 /proc，使 procfs magic link 无法逃逸 bind profile；环境 ptrace/ownership 只是纵深防御，不是边界；功能探针走同一路径。

**何时适用/前提**：Linux bwrap 的 procfs magic link 会破坏 file-effect confinement。仅 bwrap profile/probe 需此 PID invariant，不扩成 SandboxMode 的通用进程或网络承诺；Landlock/Seatbelt 不改进程可见性，所有 backend 均不限制网络。

**机制义务（提取要点；保留关键英文措辞）**：
- Every bwrap profile uses PID unsharing and matching private procfs; Bubblewrap PID1 reaps owned descendants.
- Probe and wrap share the real builder; missing PID capability rejects bwrap during selection and follows the existing supported Linux backend ladder.
- Do not substitute host ptrace/ownership, selected-link masks or a weaker probe for the kernel boundary.
- Validate both modes with real namespace/host-target/own-descendant behavior, not transcript snapshots; keep bwrap-only, non-SandboxMode/non-network scope explicit.

**机制特定失败/例外/证据限制**：命令仍能管理自己的后代；fallback 不是弱化 bwrap。Landlock/Seatbelt process visibility 和网络行为不变。目标真实 Linux builder/selector/namespace 证据缺失；automatic 保留源效果但不证明本包已有隔离实现，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-bwrap-private-pid-namespace.md:1-37@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-bwrap-private-pid-namespace.md:1-37@687f282e

<a id="falsifiable-verification"></a>
## 47. Falsifiable Verification

**机制 ID**：`rationale-bug-fix-2-falsifiable-verification`

**中文摘要**：先证明会使断言有意义的触发条件，再用同路径旧实现/变异负控证明它能失败；视口、引擎和输入广度按缺陷边界决定，340 sweep/replay-only 只是特定源场景。

**何时适用/前提**：声明行为已修复/被约束时，实际触发可能缺失或观察窗口可能消失；验证必须到真实 owner surface，不能把健康自动化引擎或 source counts 当缺陷复现。

**机制义务（提取要点；保留关键英文措辞）**：
- Prove wrapped/scrolling, real cap/bar, held async interval or stale-engine condition before the invariant.
- Use an owner-level reverted/mutated control; exercise both transitions where meaningful, not an unrelated universal matrix.
- Match engine/viewport/process/input proof and build identity to the claim; keep real Safari versus components, real keyboard versus replayed touch signature, and real PTY versus fake process distinct.

**机制特定失败/例外/证据限制**：row340 sweep/replay record guard、scrollbar declaration mutation/computed style、hero held history、fatal PTY、Safari native gap 各有范围。stale plugin lib、无 overflow、无效触摸合成都不能通过反空测；目标 gates/owner evidence 仍缺，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-themed-scrollbars-and-reserved-gutter.md:1-85@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-approval-panel-command-cap.md:1-53@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-composer-text-layers-share-one-scrollport.md:1-85@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-fail-loud-releases-the-terminal.md:1-61@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-hero-visible-while-blank-session-opens.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-04-composer-tab-gutter-reservation.md:1-49@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-reader-scroll-attribution-observed-top-ledger.md:1-38@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-safari-textarea-soft-wrap-reflow.md:1-48@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-themed-scrollbars-and-reserved-gutter.md:1-85@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-approval-panel-command-cap.md:1-53@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-composer-text-layers-share-one-scrollport.md:1-85@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-fail-loud-releases-the-terminal.md:1-61@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-hero-visible-while-blank-session-opens.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-04-composer-tab-gutter-reservation.md:1-49@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-reader-scroll-attribution-observed-top-ledger.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-safari-textarea-soft-wrap-reflow.md:1-48@687f282e

<a id="fatal-exit-cleanup"></a>
## 48. Fatal Exit Cleanup

**机制 ID**：`rationale-bug-fix-2-fatal-exit-cleanup`

**中文摘要**：首个诊断→可选 release 参数→exit1；固定2s referenced deadline/latch 保证失败 teardown 也不取消退出。terminal-owning bin 在 boot prepare 捕获 root 并传 disposal；省略参数保持 ACP/JSON-RPC/demo 原行为。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Fail-loud disposal must emit the diagnostic before exit and then perform an awaited, bounded release: first-rejection latch instead of uninstall, 2s cap, referenced timer, swallowed release rejection, and an optional hook that preserves old bins.

**机制义务（提取要点；保留关键英文措辞）**：
- Diagnose first, latch without uninstall; await optional release bounded by referenced2000ms and swallow its rejection while still exiting1.
- Terminal-owning bins supply root disposal captured before entry mount and reuse TUI drainInput/stop, not duplicate escape resets or sync exit handlers.
- Omitted parameter preserves non-TUI behavior; actual boot owns config-tree disposal, detached failures and uncaughtException still use the fatal guard.

**机制特定失败/例外/证据限制**：不是额外 compatibility hook。fake process 不证明 event-loop exit/PTY；真实 invalid-provider case pins diagnostic/exit1/reset，no-JS crash 不在异步保证内。目标 handler/launcher/native 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-fail-loud-releases-the-terminal.md:1-61@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-fail-loud-releases-the-terminal.md:1-61@687f282e

<a id="fixture-representativeness"></a>
## 49. Fixture Representativeness

**机制 ID**：`rationale-bug-fix-2-fixture-representativeness`

**中文摘要**：旧 row fixture 不 wrap；旧 diff fixture 是无路径 Edit renderer 标题加两个 diff，掩盖的恰是“单 diff 且 title 已含 path”。fixture 必须保留真实触发组合并让旧实现失败。

**何时适用/前提**：简化数据可消除真实触发时：wrapped copy/短 viewport/实际 overflow，或 single FileDiff/effective title path 的组合；不是“少了两个 diff 中一个”。

**机制义务（提取要点；保留关键英文措辞）**：
- Keep wrapped/actually-scrolling row structure and single-diff title-path coincidence plus separate multi-file headers control.
- Require the same assertion to fail under old owner implementation; do not remove the trigger while refreshing fixtures/goldens.
- Keep TUI substring/empty-path behavior and non-TUI presenter path data; fixture policy is not a runtime fallback.

**机制特定失败/例外/证据限制**：长 fixture 成本是特定可证伪条件；源无独立 runtime recovery，非 C5 waiver。目标 representative fixtures/CI/真实 browser-TUI 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tui-diff-card-redundant-path-header.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tui-diff-card-redundant-path-header.md:1-38@687f282e

<a id="heap-derived-limits"></a>
## 50. Heap Derived Limits

**机制 ID**：`rationale-bug-fix-2-heap-derived-limits`

**中文摘要**：Host parse cap 用配置堆减64MiB后除固定保守16x，再与协议 cap 取较小；实测6.4x 只是证据，不直接当除数。加载期拒绝不安全预算；child RLIMIT_AS 是另一资源。

**何时适用/前提**：宽 short-unique-key JSON frame 会在 Host 物化多倍 raw bytes，必须在 load gate 检查 `min(protocol cap, floor((heap_size_limit -64MiB)/16))`，尊重 `--max-old-space-size`。16/64MiB 是来源固定安全 invariant，不是随意调低的用户 knob。

**机制义务（提取要点；保留关键英文措辞）**：
- Measure hostile shapes as evidence, but retain fixed16x headroom (about2.5x the observed6.4x), not measured_worst_case_multiple as the divisor.
- Reserve64MiB of configured Host heap, divide by16, floor and cap by protocol budget; reject unsafe frame/value budgets during load.
- Keep the child RLIMIT_AS gate separate; do not treat it as host-parse protection.

**机制特定失败/例外/证据限制**：来源用128MiB old-space child 拒绝50MiB completion budget，另测 admitted-cap wide-key parse 存活；8x 对照 OOM。Host parse、child build/encode、全进程内存不是同一保证；源自动 load gate 保留，目标 parser/heap binding 与低堆 refusal/survival evidence 仍缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e
来源：deepseek-harness/packages/experimental/ptc-runtime-python/src/index.ts:263-307@687f282e

<a id="honest-degradation"></a>
## 51. Honest Degradation

**机制 ID**：`rationale-bug-fix-2-honest-degradation`

**中文摘要**：存储尽力而为；省略通知如实区分未配置存储与保存失败，并携带定位/retrievalHint；过期存在时明确不承诺永久归档。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Spill storage is best-effort. The omission notice must distinguish missing storage from a failed save, carry the locator and retrievalHint or an unavailable outcome, and remain outside the bounded preview JSON so a tiny budget cannot hide it.

**机制义务（提取要点；保留关键英文措辞）**：
- Keep exact omittedMessages/omittedBytes in durable model-visible text outside preview JSON; successful save includes locator AND retrievalHint, unavailable distinguishes missing store from failed save.
- Use one captured projection/metadata/untrusted warning with exact64-code-point JSON fragments; target-session ownership does not authorize retrieval.
- Cancelled save cannot publish context; backend expiry owns leftovers without new rollback/delete API. Replay uses logged preview/notice without IO/save.
- Keep preview usable on storage degradation; disclose notice/retrieval token costs and expiry/no-permanent-archive/no-compacted-content recovery limits.

**机制特定失败/例外/证据限制**：missing/failed storage 是诚实降级，不是任意 fail-loud；untruncated 不写，tiny budget 不藏通知，durable locator 仍可能过期。目标 store/preparation/replay/真实 paged read 实测缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-spill-reuse.md:1-42@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-session-reference-spill-reuse.md:1-42@687f282e

<a id="incremental-retention-accounting"></a>
## 52. Incremental Retention Accounting

**机制 ID**：`rationale-bug-fix-2-incremental-retention-accounting`

**中文摘要**：保留字符串链表+头偏移+UTF-8/换行聚合计数；追加只淘汰最旧码点并把成本记到早先追加，总工作量线性；跨块代理对按一个四字节码点处理。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Retention keeps a linked sequence of strings, head offset, aggregate UTF-8 byte and newline counts; appends evict only oldest code points until both limits hold, so evicted work is charged to earlier appends and total work is linear; reads assemble proportional to retained output. Semantics match line trim then UTF-8 trim, trailing newline is an empty logica…

**机制义务（提取要点；保留关键英文措辞）**：
- Maintain linked strings/head offset plus exact byte/newline aggregates with amortized input-linear eviction; reads remain retained-output proportional.
- Preserve line-then-UTF8 suffix, trailing empty line, sticky truncation/consume reset and split/lone-surrogate JS semantics.
- Own every sanitizer slice, half-head suffix copy, bounded4096-unit non-head aggregation/cached last code unit; bound metadata/backing storage during production.
- Keep required source CI timing50/125/300ms via shared scale/headroom, unscaled capacity ratio<4× and heap16MiB; validate eager/tiny-node/filtered-slice controls separately from shell latency.

**机制特定失败/例外/证据限制**：synthetic provider 排除 shell startup/OS PTY/model/browser；native 单样本包括 spawn/PTY 不含 interactive prompt roundtrip。heap 包含 live session/result，tiny/filtered case 无 timing verdict；snapshot/consume 仍合并分配。目标 buffer/required CI/真实行为缺失，planned 不算通过。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-11-incremental-terminal-retention.md:1-65@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-11-incremental-terminal-retention.md:1-65@687f282e

<a id="linear-reconciliation"></a>
## 53. Linear Reconciliation

**机制 ID**：`rationale-bug-fix-2-linear-reconciliation`

**中文摘要**：从对账后的行构建一个 ID 集合用于淘汰和选中判断，替代每个缓存 ID 全表扫描；用实例内访问计数证明线性，而不依赖墙钟。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Build one ID set from reconciled rows for cache eviction and selected-row membership, replacing a full new-list scan per cached ID (quadratic, including first hydration because new rows enter cache before cleanup); field comparison, row identity, array reuse, lineage order, subagent addresses unchanged; O(n+c) time, O(n) temporary storage. Wall-clock unit-te…

**机制义务（提取要点；保留关键英文措辞）**：
- Build one reconciled ID set for eviction and selected membership:O(n+c) time/O(n) temporary storage, including first hydration.
- Preserve fields, unchanged row/array identity, lineage/subagent addresses; evict missing rows without replacing the reuse path.
- Recover off-list selection on row return; prove linear ID-read work with instance-local instrumentation, not tight unit wall-clock thresholds.

**机制特定失败/例外/证据限制**：missing row 丢失 cache identity，unchanged 保留；返回选中候选不等于复活旧对象。源 local Node production-manager snapshot 计时不含 server/transport/DOM/input/memory，不能证明 reconnect latency。目标 manager/instrumentation/runtime 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-15-linear-session-list-cache.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-15-linear-session-list-cache.md:1-26@687f282e

<a id="local-failure-isolation"></a>
## 54. Local Failure Isolation

**机制 ID**：`rationale-bug-fix-2-local-failure-isolation`

**中文摘要**：父 catalog 只需 direct child 自身 descriptor；child-local 正文/字段失败才带路径警告并保留 header/unknown 身份。取消或 source-consistency 失败必须中止，不得一起降为 warning。

**何时适用/前提**：父迁移发现 direct-child headers 并读取自身 descriptor，有 revision fencing 与不可变 predecessor。准备父不递归准备 child catalog，也不发布 child successor；源变更/修复必须在复用和发布前重查，包括曾失败的 decode。

**机制义务（提取要点；保留关键英文措辞）**：
- Read only the child facts the parent actually needs.
- Localize only child-body/descriptor-field errors to path-bearing warnings with header/unknown membership; existing complete entries stay authoritative.
- Do not recursively prepare child catalogs or drop the child's navigation entry.
- Propagate cancellation and source-consistency failures to stop the operation; recheck inspected revisions, including failed decodes, before reuse/publication.

**机制特定失败/例外/证据限制**：unreadable/unsupported header 略去；unknown 可浏览而 list_agents 只选 known-continuable；已发布 unknown 不自动改写，单独开 child 才重试。源自动 local-warning/operation-abort 边界保留，目标 migration/revision binding 与 corrupt-child/abort/repair evidence 仍缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-session-local-subagent-migration.md:1-34@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-v3-incomplete-child-catalog-evidence.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-session-local-subagent-migration.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-19-v3-incomplete-child-catalog-evidence.md:1-30@687f282e

<a id="lossless-encoding-collision"></a>
## 55. Lossless Encoding Collision

**机制 ID**：`rationale-bug-fix-2-lossless-encoding-collision`

**中文摘要**：两种 Python 键拼写折叠成同一 JSON 成员时，宿主 JSON.parse 会静默丢键；在编码前用每字典 seen 集判为非 lossless。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Two distinct Python dict keys (a spelled-out surrogate pair and its astral code point) fold to the same JSON member; the host JSON.parse silently drops one. Both lossless walks must track combined keys in a per-dict seen-set and reject a collision before encoding.

**机制义务（提取要点；保留关键英文措辞）**：
- Track the actual emitted key for each dict entry in a per-dict seen-set.
- Reject distinct source keys that fold to one JSON member as non-lossless before encoding.
- Apply the same collision check to completions and binding arguments.

**机制特定失败/例外/证据限制**：completion invalid-output / args lossless-JSON call rejection 均在编码前，per-dict O(keys) 不等于 meter O(depth)，不跨 dict/call 污染状态、不恢复旧丢键。目标 Python/host runtime 证据缺失，场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e

<a id="lossless-replay-contract"></a>
## 56. Lossless Replay Contract

**机制 ID**：`rationale-bug-fix-2-lossless-replay-contract`

**中文摘要**：每个有推理的 assistant 轮次都按流式通道逐字节回传 reasoning_content，使网关能重建被哈希的链；不提供配置开关，因为错误设置会静默失败。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：serializeAssistant emits reasoning_content on every reasoned assistant turn, byte-exact with the streamed channel, so a gateway that hashes the replayed chain can reconstruct; no config switch because a wrong setting fails silently; baseURL cannot reveal forwarding; absent reasoning still emits no field; stable prefix preserved

**机制义务（提取要点；保留关键英文措辞）**：
- Emit reasoning_content for all reasoned text/tool/reasoning-only turns, with reasoning-only content empty; no reasoning means no field.
- Replay the exact streamed single reasoning channel at its original turn position; compare bytes/hashes, not just presence.
- Do not infer forwarding from baseURL or add silent-loss switches/tool-call gating; this wire supplies no upstream thinkingSignature.
- Record later token cost and stable subsequent prefix with the initial change-spanning cache discontinuity.

**机制特定失败/例外/证据限制**：official endpoint 可忽略不代表 gateway 可丢失；未记录历史 reasoning 不被恢复，源无独立 recovery。目标 translator/serializer/byte-hash 证据缺失，场景 planned，非 C5 waiver。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-19-deepseek-reasoning-passback-every-turn.md:1-34@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-19-deepseek-reasoning-passback-every-turn.md:1-34@687f282e

<a id="measured-overflow-affordance"></a>
## 57. Measured Overflow Affordance

**机制 ID**：`rationale-bug-fix-2-measured-overflow-affordance`

**中文摘要**：四行 CSS clamp 保留完整描述，只有真实 overflow 才挂 Tooltip；高度仍派生，空 title 停止原生 lookup。宽度/垂直翻转不承诺所有气泡都能容纳在 viewport。

**何时适用/前提**：卡片描述可任意长，且 pane 宽度、原因/路径行或 viewport 底部锚点影响布局；需要真实 DOM 几何、ResizeObserver 生命周期与共享 Tooltip。缺少该表面记录事实，新增时触发；缺少浏览器证据不能判已落实。

**机制义务与责任程序**：
- Card owner 用四行 CSS clamp，不截断文本；按 `scrollHeight>clientHeight` 条件挂 Tooltip，并在 ResizeObserver 宽度变化后重测。description 按内容定高，`.cardId` 用 `margin-top:auto`，原因/目录行可合法变高。
- Tooltip owner 提供可选 `maxWidth`；top/bottom 只翻到确实容纳的一侧，两侧都不够就保留请求 placement，不振荡、不垂直滑动覆盖原文。
- Description 用 `title=""` 停止向 card body 查找原生 title；完整文字仍在 accessibility tree。Reviewer 检查短/溢出/无 ResizeObserver、宽度/位置和变量行；固定高度、无条件 Tooltip、hover 扩张是具体反例。

**机制特定失败/例外/证据限制**：原生 tooltip 在页面外，源只做空 title DOM 断言；若未来 lookup 又跨过空 title，回退是移除 card body 的 title，信息已在 aria-label。两侧不够仍保留位置，故不存在“永不出 viewport”保证。`automatic` 保留源布局效果；目标组件/浏览器证明仍缺失，无 observer 情形不能冒充持续重测。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-preset-card-description-clamp.md:1-44@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-preset-card-description-clamp.md:1-44@687f282e

<a id="native-path-url-translation"></a>
## 58. Native Path Url Translation

**机制 ID**：`rationale-bug-fix-2-native-path-url-translation`

**中文摘要**：补丁解析把本机绝对路径和补丁相对 ./ ../ 转为 file URL，因为只有解析知道来源补丁目录；包标识符、已有 URL 和替换 config 保持原义。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Patch-file parsing converts native absolute paths and patch-relative ./ ../ names into file URLs in insert rows before layers compose, because only parsing knows the originating patch directory; package specifiers, existing URLs, name assertions, and replacement configs keep meaning; changing the shared Loader base is rejected because it loses per-patch prov…

**机制义务（提取要点；保留关键英文措辞）**：
- Convert native absolute and patch-relative ./ ../ insert/nested-group specifiers to file URLs at parse time, where originating patch directory is known; keep package specifiers/URLs/name assertions/replacement config unchanged.
- Keep optional HostResolvedRootInclude conversion separate for installed-host resolver callers; direct Loader imports and replacement-config children stay out of scope.

**机制特定失败/例外/证据限制**：改变 shared Loader base 或加第二转换路径会丢 per-patch provenance/双转换；源无独立 runtime recovery protocol，非 C5 waiver。目标 patch-reader/loader binding 与 URL-sensitive activation proof 缺失，planned 不等于运行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-patch-plugin-file-urls.md:1-28@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-patch-plugin-file-urls.md:1-28@687f282e

<a id="object-type-correct-removal"></a>
## 59. Object Type Correct Removal

**机制 ID**：`rationale-bug-fix-2-object-type-correct-removal`

**中文摘要**：Junction 删除用 unlinkSync，不用 rmSync（ERR_FS_EISDIR）或递归 rm（可能在 lstat 与删除之间删掉真实目录）；只删 reparse point 并保持 fail-loud。

**何时适用/前提**：移动安装/第二 checkout 的 profile node_modules 需要修复旧 junction/symlink，或 lstat 与删除之间可能被替换为真实目录。没有 link healer 时记录事实，新增时重触发。

**机制义务与责任程序**：
- Fallback owner 仅把旧链接删除改为 `unlinkSync(link)`，不下降到 target，也不改变 two-anchor resolution 或每次重建正确链接。
- Reviewer 检查真实目录替换 race：非递归 rmSync 在 Windows 错链接处报 `ERR_FS_EISDIR`，递归 rm 虽可删 junction，却可能删掉 guard 后出现的真实目录，不能采用。
- Native regression owner 运行错误 Windows junction、POSIX symlink、目标内容保留和正确链接无 churn；第二个并发删除仍应报 `ENOENT`。

**机制特定失败/例外/证据限制**：POSIX 普通 unlink 行为不变；rmdirSync 也能删除 Windows junction，但不是本决策选定 idiom。没有错误吞并或自动 race retry。`automatic` 保留源对象类型正确删除，目标 healer/native/race 证明仍缺失；修复 fixture 后重跑属于目标 repair，非新增源恢复协议。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-unlink-stale-profile-fallback-links.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-unlink-stale-profile-fallback-links.md:1-26@687f282e

<a id="observation-accurate-labels"></a>
## 60. Observation Accurate Labels

**机制 ID**：`rationale-bug-fix-2-observation-accurate-labels`

**中文摘要**：徽标说 Failed to load 而不是 Broken，因为观察到的是缺失、不可读或格式错误，不是损坏；标签必须对应实际观察。

**何时适用/前提**：Discovery 对 composition 文件只能确定 missing/unreadable/malformed，UI 却可能把 broken flag 译为损坏。需真实失败类和 badge/reason 表面，而不只是文案 golden。

**机制义务与责任程序**：
- Discovery/presentation owner 显示 `Failed to load`/`加载失败`，不显示 `Broken`/`已损坏`，保留逐字的 reason（文件及修复提示），不改变底层失败分类。
- Reviewer 对照观察证据判断标签是否越权；regression owner 分别构造缺失、不可读、格式错误，恢复旧损坏标签或隐藏 reason 时断言失败。

**机制特定失败/例外/证据限制**：`damaged.expected.md` 是源 fixture 名，不是 damage 诊断依据。`automatic` 指源 badge 渲染，不替代语义评审；目标 loader/UI 证据仍缺失。源没有独立恢复协议，后续修复文件的 C5 拒绝→恢复须另证，不能借 not-applicable 免除。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-preset-card-description-clamp.md:1-44@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-preset-card-description-clamp.md:1-44@687f282e

<a id="observation-window-resource-bound"></a>
## 61. Observation Window Resource Bound

**机制 ID**：`rationale-bug-fix-2-observation-window-resource-bound`

**中文摘要**：在途调用上限每个宏任务在微任务排空后检查一次，严格阈值且 done 帧再检查；按事件快照会漏突发或误杀合法批。

**何时适用/前提**：Python child 分批调用异步 Host binding，未 settled 的闭包会积累；pipe chunk 边界与微任务 finally 排空顺序不同。该 cap 是 outstanding calls 的1024计数，不是字节或 reply 存储上限。

**机制义务与责任程序**：
- Backend owner 分派前递增 `pendingCalls`，async finally 在 reply-written、resolution-rejected、settled-drop 各出口释放。
- 每宏任务只排一个去重 `setImmediate`，在微任务排空后看真实 outstanding；严格 `>MAX_PENDING_REPLIES`（1024合法）时以 worker-exit/backlog message 结束。settled 后 no-op，但同批 done 接受前独立重查。
- Regression owner 分别运行5000不 settled、62KiB单写1025（含/不含同批 done）的早拒绝；1025 instant gather、1300 split-read instant 和1024 pending+done 都应正常。Reviewer 拒绝按 frame/data-event 快照或暂停 fd3（会阻塞 done/log）。

**机制特定失败/例外/证据限制**：大量立即 settled 的 frame 数不等于真实 pending；1024+done 是合法边界。源没有 backlog 后自动 retry；目标 repair 应纠正 flooding 条件并启动新正常 run，不抑制 wall timeout。`automatic` 保留源调度/计数效果，目标 backend/subprocess 证据仍缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e

<a id="observed-state-ledger"></a>
## 62. Observed State Ledger

**机制 ID**：`rationale-bug-fix-2-observed-state-ledger`

**中文摘要**：以同步写入 ledger 和收缩地板归因滚动，不枚举设备。React commit 和单独收缩可吸收；同一更新中的非 React 收缩再增长无法区分，明确接受它暂停跟随，由回到底部或 Back to bottom 恢复。

**何时适用/前提**：滚动区在流式更新时把非 wheel 输入误认成程序写入，或变更写入点、布局和归因规则。审查者必须同时保留 device-independent 归因和源文接受的竞争例外。

**机制义务（提取要点；保留关键英文措辞）**：
- Record component writes and delivered scroll positions synchronously; cover bottom follow, restore, prepend and resize.
- Compare top against min(ledger, floor) with the half-pixel tolerance; ledger delivery/shrink-only clamp preserves ownership and the existing threshold governs reader release/re-pin.
- Keep one scroll listener, not device-enumeration branches. React-commit shrink/regrow is absorbed; non-React coalesced shrink-plus-regrow intentionally releases follow.
- Recover the accepted release by returning to the floor or using Back to bottom; do not swallow real streaming input with a grace window.

**机制特定失败/例外/证据限制**：竞争情形不是“已处理”的吸收保证。源 Chromium 不能合成真实 touch 或 compositor scrollbar 滚动；键盘承担真实非 wheel 输入链证明，fling 是直接位移重放，不是触摸硬件证据。本包目标浏览器场景仍为 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-reader-scroll-attribution-observed-top-ledger.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-reader-scroll-attribution-observed-top-ledger.md:1-38@687f282e

<a id="offer-capability-consistency"></a>
## 63. Offer Capability Consistency

**机制 ID**：`rationale-bug-fix-2-offer-capability-consistency`

**中文摘要**：只展示当前产品能完成认证的新增路径，同时保留 catalog、已存 profile 与手写解析边界。旧 api-key-only 限制已被持久凭据与登录流程取代，openai-codex 恢复展示，catalogProviderTakesApiKey 已移除。

**何时适用/前提**：目录展示了产品无法完成的认证路径，或能力变化、展示过滤可能搁置既有设置/破坏启动。先确认当前 store/login 能力，不能把历史缺口固化为提供商禁令。

**机制义务（提取要点；保留关键英文措辞）**：
- Offer only flows the current product can complete; do not keep a permanent provider-name/api-key-only ban after the missing capability exists.
- Preserve catalog membership and the unconditional stored-profile half, including visibility/edit/delete.
- Keep resolution and namespace registration intact, including hand-written apiKeyEnv profiles; do not relocate a surface filter into resolveProfiles.
- Treat withholding as historical: durable credentials/login restored openai-codex and removed catalogProviderTakesApiKey.

**机制特定失败/例外/证据限制**：历史缺少登录时只收窄新增 offer，不使已存无 key 路由拖垮整个 namespace。旧测试验证旧姿态；当前知识不能据此继续隐藏已可认证的路由。链接的凭据架构、当前实现与目标认证执行未在本批核验；双姿态和重新开放场景仍为 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-oauth-only-providers-withheld.md:1-46@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-13-oauth-only-providers-withheld.md:1-46@687f282e

<a id="optimistic-representation-handoff"></a>
## 64. Optimistic Representation Handoff

**机制 ID**：`rationale-bug-fix-2-optimistic-representation-handoff`

**中文摘要**：提交保留本地 placement；Chat 同帧按 rpcId 隐藏回显并排除旧 Inbox 行；Session 保留排除身份直到投影水位到达领取序号；固定延迟不能证明入档。

**何时适用/前提**：本地 optimistic input 与 Inbox/history 独立到达；需要 rpcId、claim receipt/watermark 和 keyed render。placement 由 local submission 决定，durable admission 才拥有最终顺序。

**机制义务（提取要点；保留关键英文措辞）**：
- Preserve idle Chat/running steering/explicit Dock placement through acceptance; same-render rpcId replacement excludes only matching local rows.
- Keep suppression to claim watermark and higher-seq retention, with existing receipt cancellation; no new event/snapshot/file field.
- First transcript echo alone precedes input-free tail control; pending/durable seats share keyed list and durable admission owns final order.
- Return attachment refs once/in order at retirement; keep cold Inbox recovery and attachment preparation at their existing owners.

**机制特定失败/例外/证据限制**：源文记录的已知限制：没有本地提交身份的 steering 仍按 Inbox 投影显示，投影迟到时可能短暂重复持久行；重连可撤销已有接收回执的乐观回显，已领取但不在新基线中的输入可能短暂无气泡（不承诺 DOM 连续性）；本地 A/B/C 提交顺序在持久入档后可能改变可见顺序；跨客户端竞争可改变实际开场输入，且客户端不会仅因 Host 排队就把空闲分类的回显迁入 Dock。改动不改变模型输入、Inbox 调度、滚动跟随或已发布 Session 数据；浏览器屏障证明行为，不代表普遍延迟或吞吐改进。按上方共用失败处理与证据限制执行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-input-echo-admission-ownership.md:1-55@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-22-input-echo-admission-ownership.md:1-55@687f282e

<a id="os-process-model-fidelity"></a>
## 65. Os Process Model Fidelity

**机制 ID**：`rationale-bug-fix-2-os-process-model-fidelity`

**中文摘要**：Windows 用继承 IO/environment 的 spawn-and-wait 并返回真实状态，POSIX 保留 execvpe；失败报告十进制/无符号32位十六进制状态与流。最终 wheel 的实际入口仍必须单独过 CI，不能用本地测试、绕过入口或重试替代。

**何时适用/前提**：发布的 Python 控制台入口涉及 Windows CRT exec 与 POSIX replacement 差异，或验证者把源码测试/直接 executable 成功当作安装产物成功。runtime maintainer 负责启动语义，release CI owner 负责最终产物的独立安装执行。

**机制义务（提取要点；保留关键英文措辞）**：
- match the platform's real process model and make failure diagnostics carry exit status
- Windows console entry uses subprocess.run spawn-and-wait with inherited streams/environment and exits with the runtime status because Windows CRT exec is not POSIX execvpe and faulted natively
- POSIX keeps os.execvpe
- smoke reports decimal and unsigned 32-bit hex status plus captured streams so native process exceptions are distinguishable from ordinary failure
- Require full installed-wheel CI on the final shipped console, separately from branch-level tests; preserve the keyless assertion, not a bypass/retry/cache-disable substitute.

**机制特定失败/例外/证据限制**：Windows 保留 Python 父进程；标准同步 subprocess 管等待/中断，不增加自定义树管理或全局设置。status513 由原生 Windows 验证，POSIX 仅八位。源固定次数比较中四个 patched 和四个 control 都过，不是同批复现。机制的 CI 义务已恢复为 ci；目标最终产物 lane 与正常/拒绝/恢复证据仍缺失，不能称自动效果已保留。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-06-windows-python-console-spawn-wait.md:1-28@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-06-windows-python-console-spawn-wait.md:1-28@687f282e

<a id="owned-temporary-state"></a>
## 66. Owned Temporary State

**机制 ID**：`rationale-bug-fix-2-owned-temporary-state`

**中文摘要**：验证器只对自己的 npm install 传 --cache consumerRoot/.npm-cache；finally 随消费者删除；不删共享缓存、不改全局环境；强制终止残留是显式限制。

**何时适用/前提**：packed-install verifier 拥有 disposable consumer，需显式 per-install cache、finally cleanup、真实 offline npm 与独立 env/npmrc canaries。源 Note 只证明源 verifier 的 install invocation 与 finally cleanup；本治理工作区的 C3 producer/evidence 是独立 target 工作，不是源行为或已发布 C3 认证。

**机制义务（提取要点；保留关键英文措辞）**：
- Pass explicit --cache consumerRoot/.npm-cache only to owned npm install; win env/npmrc without changing installed executable environment.
- Finally remove owned consumer/cache on success/install failure/entry failure; preserve shared host state/global config and unrelated npm consumers.
- 源自动保证只覆盖源 verifier；target producer、installed-entry 观察和 `verification/evidence/*` 属于 target-package 工作区证据。

**机制特定失败/例外/证据限制**：forced kill 阻止 finally 可残留，不承诺 crash recovery/清除旧共享缓存/其他生产者不耗尽磁盘；接受重复下载。真实 Windows npm 的4个回归及故障修正后新消费者均通过，移除 cache 参数的隔离副本在2个私有缓存断言上失败。原始输出见 `verification/evidence/raw/resumed-c3-private-cache-recovery.json`，变异证据见 `verification/evidence/resumed-c3-cache-mutation-control-complete.json`；这些是 target-package 工作区证据，公开导出不包含 evidence store，不能声称随包发布或从包内独立复现。目标保留 --ignore-scripts，以 installed entry 观察缓存，不冒充源 lifecycle/POSIX shim 测试；无全局 TMPDIR 改写不等于禁止 npm 合法临时写入。全包刷新和独立 C3 审计仍缺失。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-06-packed-install-private-npm-cache.md:1-29@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-06-packed-install-private-npm-cache.md:1-29@687f282e

<a id="performance-incremental-derived-state"></a>
## 67. Performance Incremental Derived State

**机制 ID**：`rationale-bug-fix-2-performance-incremental-derived-state`

**中文摘要**：每个 footer 的 O(steps×events) 回放改成一个共享 StepTimingTracker 游标；行缓存在每次状态变异和 invalidate() 时按宽度丢弃。

**何时适用/前提**：append-only seq=log-length timing log 与 retained card components；每个 mount 共享 tracker，每个 mutator 与 invalidate 都需 cache drop，实际 terminal/session measurement 单独证明性能。

**机制义务（提取要点；保留关键英文措辞）**：
- Advance one per-mount shared cursor with per-step buckets, accumulating open and pinning ended steps, rather than per-footer replay.
- Cache rows by width; EVERY updateResult/visibility/expanded/invalidate path drops cache, unchanged keystrokes reuse it.
- Keep component ownership; zero-clamp backward time and ignore duplicate start of closed coordinates.

**机制特定失败/例外/证据限制**：new mutator 漏 invalidation 可 stale rows；clock rollback 可不同于旧 cutoff。历史196k-event/200x50 timing 非通用门槛；初始 layout/load 与 row traversal 仍 linear。目标 tracker/card/TUI proof 缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-03-tui-long-session-render-costs.md:1-34@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-03-tui-long-session-render-costs.md:1-34@687f282e

<a id="plan-commit-atomicity"></a>
## 68. Plan Commit Atomicity

**机制 ID**：`rationale-bug-fix-2-plan-commit-atomicity`

**中文摘要**：把所有可失败步骤放进 plan（只读 surface），commit 只做不可失败的 push/splice；剩余可失败 anchor 校验放在两者之间，使重试一致性由顺序保证。

**何时适用/前提**：mutable priced-surface fold 同时存在可失败 planning/anchor checks 和可构造的 infallible commit；每个失败都需 state/total 不变，而非只比 throw。

**机制义务（提取要点；保留关键英文措辞）**：
- Plan pricing/replacement against readonly surface, finish all step/provenance anchor checks, THEN commit owned push/splice.
- Repeated invalid-event throws preserve both priced state and running total; detached structuredClone/deepFreeze measure protects callers.
- Append amortized O(1) removes whole-array copy; replacements still O(surface) findIndex, no added map/persistent vector.

**机制特定失败/例外/证据限制**：plan-valid/anchor-invalid early commit 可同样 throw 却 double-count；必须观察状态。content pricing/Session snapshot reads 不在此修复。目标 fold/measurement/retry proof 缺失，源不自动修复坏事件。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-24-token-meter-surface-fold-plan-commit.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-24-token-meter-surface-fold-plan-commit.md:1-30@687f282e

<a id="platform-object-metadata"></a>
## 69. Platform Object Metadata

**机制 ID**：`rationale-bug-fix-2-platform-object-metadata`

**中文摘要**：Windows 替换已有文件，必须先给空暂存应用并保护目标 DACL，再写内容和 ReplaceFileW；创建新文件则继承目标目录。POSIX 保留 owner-only 暂存及既有 mode；测试语义权限而非机器账号或 descriptor 字节。

**何时适用/前提**：原子替换的目标权限比父目录窄，或实现混淆 Windows 创建/替换与 POSIX modes。filesystem owner 负责写内容前的 DACL 边界，native regression owner 检查暂存和最终策略。

**机制义务（提取要点；保留关键英文措辞）**：
- For an existing Windows target, read its DACL and apply it with inheritance protected to the empty temp before writing; publish closed staging with ReplaceFileW.
- Fail before content if target-DACL read or temp-DACL set fails; load Koffi only on Windows replacement paths.
- For a new Windows file, stage beside the destination and inherit its directory DACL; preserve deliberate sharing rather than imposing owner-only DACLs.
- Keep POSIX owner-only staging/existing mode. Compare ordered de-duplicated ACE policy, not self-relative bytes, localized account lists or Windows mode-bit assertions.

**机制特定失败/例外/证据限制**：新文件可能按目录设计继承较宽权限；这不是替换已有受保护文件的例外。ACL merge 可重排序列化/重复等价 ACE；read-only Windows 目标仍在发布失败。目标原生权限、失败注入和 POSIX 场景仍 planned，不因文档补齐而声称已执行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-19-windows-atomic-write-dacl-preservation.md:1-32@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-19-windows-atomic-write-dacl-preservation.md:1-32@687f282e

<a id="poison-payload-quarantine"></a>
## 70. Poison Payload Quarantine

**机制 ID**：`rationale-bug-fix-2-poison-payload-quarantine`

**中文摘要**：提案：不可读历史附件在分派前记入会话投影；NOT_FOUND/CORRUPT 立即隔离，READ_FAILED 一次可取消重试后隔离；确定性占位、原始块保留、显式验证后恢复。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：PROPOSAL, not shipped authority: an unavailable historical image otherwise fails every later request. Proposal records unreadable refs in a session-backed projection before dispatch; NOT_FOUND/CORRUPT quarantine immediately, READ_FAILED gets one cancellation-aware retry then a retryable quarantine; cancellation/unclassified failures never quarantine. A durab…

**机制义务（提取要点；保留关键英文措辞）**：
- Record unreadable historical attachment references in a session-backed projection before provider dispatch.
- Quarantine ATTACHMENT_NOT_FOUND and ATTACHMENT_CORRUPT immediately; for ATTACHMENT_READ_FAILED perform one cancellation-aware retry, then quarantine with a retryable reason.
- Never quarantine on cancellation or unclassified failures; the durable event identifies the attachment and failure class.
- Replace each quarantined image with deterministic text (display name if present, attachment-id prefix, failure class) and skip readImage for that reference; keep the original block in append-only history.
- Restore the original reference only after an explicit read verifies digest and metadata; never overwrite missing/corrupt bytes or clear quarantine without verification.

**机制特定失败/例外/证据限制**：固定源仍是未 shipped 的 proposal，`advisory` 只编码此事实，不降低已实现保证。若显式采用，需 session-backed 幂等 quarantine/recovered、精确坏引用、并发有效 transition 协调、发现后的 dispatch 前重投影，以及 cancellation/一次重试/restart/fork/nested-image/验证后恢复和 keyless durable-event 证据；届时必须绑定自动效果，不能继续凭 advisory 豁免。每 transition 改一次 provider prefix；sessionless auxiliary policy 仍是显式实现范围。当前目标未实现或运行，历史双语声明不等于本次等价性重读。

**引用**：`deepseek-harness/.agents/notes/proposed/bug-fix/2026-08-20-attachment-read-quarantine.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/proposed/bug-fix/2026-08-20-attachment-read-quarantine.md:1-38@687f282e

<a id="prefix-cut-boundary"></a>
## 71. Prefix Cut Boundary

**机制 ID**：`rationale-bug-fix-2-prefix-cut-boundary`

**中文摘要**：fork 复制截至选中 turn/end（含）的连续前缀；显式锚点取其后第一个结束事件，省略/越界取最后一个；结束事件之后的排队输入、标题、设置都不属于种子。

**何时适用/前提**：完成回合后 fork 可能带入后续 inbox/title/model-settings。controller owner 负责关闭事件处的精确 cut，reviewer 检查不靠插件事件分类或复制后清 inbox 补救。

**机制义务（提取要点；保留关键英文措辞）**：
- Copy exactly the contiguous prefix through the selected turn/end inclusive; do not extend to the next inbox or a later stable event.
- Select the first closing event at/after an explicit anchor; omitted/past-end anchors select the last closing event.
- Exclude every later event, including queued input, titles and model settings.
- Retain lower-level SessionStore.fork explicit stable-event semantics and ordinary replay for events already inside the prefix; a client may independently assign a fork title.

**机制特定失败/例外/证据限制**：该决策只管 controller 完成回合 cut，不重定义 prefix 内已插入 pending input 的 replay，也不改底层显式 stable-event fork。省略/越界 anchor 是边界回退，不是源文另有恢复协议。具体负控为 next-inbox 延伸与 copy-tail-then-clear；目标继续执行场景仍 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-11-session-controller-fork-turn-cut.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-11-session-controller-fork-turn-cut.md:1-30@687f282e

<a id="prefix-stability-migration"></a>
## 72. Prefix Stability Migration

**机制 ID**：`rationale-bug-fix-2-prefix-stability-migration`

**中文摘要**：仅 checkout/Web URL 两段的进程值移入可选 runtime context；旧会话投影逐字保留日志中的对应旧段落。值不变不出 snapshot，minimal preset 可完全看不到两值；不承诺整个 prompt 跨版本稳定。

**何时适用/前提**：端口、安装或 checkout 变化会改写历史前缀，尤其非 in-history 路由上的 thinking signature。context/projection owner 保留两段精确旧模板与 committed system/message 投影，不引入同步任意历史读取。

**机制义务（提取要点；保留关键英文措辞）**：
- Move only process-specific checkout/Web values into optional contexts; new sessions keep value-free guidance.
- Preserve the two exact earlier paragraphs verbatim through the host-only committed-system/message projection; never rewrite committed history.
- Use current checkout and advertised publicUrl/listener origin; append a complete changed snapshot before the step user message, no snapshot when unchanged, and compare resume to the latest logged snapshot.
- Keep both contexts optional: the minimal preset sees neither. Only these two paragraphs are protected; unrelated prompt edits can still rewrite the head.

**机制特定失败/例外/证据限制**：这不是强制 context、全 prompt freeze、drop thinking 或新重试协议；无 agent 的诊断组装用当前 guidance。首轮升级、后续端口/安装变更、无变化不产 snapshot、关闭可选 context 和无关 prompt 编辑必须分别检查；本包尚未执行目标 resume/signature 场景。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-11-process-specific-prompt-values-in-runtime-context.md:1-95@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-11-process-specific-prompt-values-in-runtime-context.md:1-95@687f282e

<a id="presentation-derivation-boundary"></a>
## 73. Presentation Derivation Boundary

**机制 ID**：`rationale-bug-fix-2-presentation-derivation-boundary`

**中文摘要**：sweep 只改展示，不进会话日志；共享 toolRowModel 相对化所有工具路径，而 args/log 保持绝对；空 assistant 节点只在 chat 派生中跳过。

**何时适用/前提**：Client 展示变更跨 chat、菜单、tool row 和 workspace chip，而 Host/Session log/args 仍有其他消费者。缺少这些表面时记录事实，新增时重触发，不以表面缺证代替已落实。

**机制义务与责任程序**：
- Chat owner 只在 flow derivation 跳过 finalized 的 tool-head+blank text/reasoning assistant，interrupted 必须显示 stopped marker；Host/Trajectory/replay/log 原节点不删。
- 一处 `toolRowModel` 用 `ToolRowOwnerProps.cwd` 做 summary prefix 相对化，outside/empty cwd 及 non-chat/args/log 不变；拒绝每工具 presenter 各做一次。
- Surface owners 让菜单先 hidden0,0、useLayoutEffect 测量后 paint，12px clearance/内部滚动/create footer 不滚；运行 sweep 用固定 glare-band overlay 不用 dim 全行的 mask；chip 选下次 workspace，无 live 选择用 Choose workspace，cwd 仅桥接初次 list load，ready list 删除后清 stale pick。
- 保留源 scoped16px rhythm、14/20无 turns counter、stepped state/tail 和 antialiasing；Reviewer 用 host-filter、per-tool-relative、mask、deleted-chip echo 和未知 list 尺寸预定位做反例。

**机制特定失败/例外/证据限制**：Chat item 数可少于 snapshot nodes；workspace rename 后允许暂显绝对路径直到 summary 重派生。每次菜单 open 增加一次 hidden layout pass；更密布局应显式重引第二常数。`automatic` 保留源显示派生效果；目标 UI/owner 绑定和实际证明仍缺失，不能声称“源无额外例外”。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-web-conversation-polish-sweep.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-web-conversation-polish-sweep.md:1-38@687f282e

<a id="presentation-does-not-infer-state"></a>
## 74. Presentation Does Not Infer State

**机制 ID**：`rationale-bug-fix-2-presentation-does-not-infer-state`

**中文摘要**：后台 Shell 的启动回执不是完成结果，原调用状态不能代表任务实时状态；卡片只展示 Start 已有命令/工作目录，ack 后变静态，不伪造运行或成功。

**何时适用/前提**：有效 explicit background bash/pwsh 的 Start、ack 或 launch error 经过 root/child Client assembly；原调用生命周期与 job 完成/输出拥有不同入口。

**机制义务与责任程序**：
- Assembly/component owner 直接组合 Start `background` 和原调用 `running`：两者 true 仅为 launch in progress；ack 后 background 保留、running=false，静态 command-only。
- 保留 command/cwd/wrapping/disclosure，ack 后无 state dot/exit/empty-output/animation；launch failure 保留 raw args+error，Inspect 仍有全量参数/ack。
- Job panel/notices/job_output 自己拥有终态/输出；卡片不订阅、不轮询、不组装输出、不新增 jobId/callId index。Reviewer 拒绝把 ack 当 completed-command 或永久 running，并检查 root/child 与失败路径。

**机制特定失败/例外/证据限制**：只覆盖显式后台 launch，不覆盖 timeout promotion/background terminal_send；foreground/persistent Shell、Copy output、Host/log/execution 不变。源 constructed assembly cases 非真实 job 关联。`automatic` 指源卡片派生而非 job-state 强制；目标 UI/assembly 证据仍缺失，修正 launch 后新 run 是明确 repair，不是自动重试。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-10-background-shell-command-display.md:1-33@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-10-background-shell-command-display.md:1-33@687f282e

<a id="presentation-eligibility-by-facts"></a>
## 75. Presentation Eligibility By Facts

**机制 ID**：`rationale-bug-fix-2-presentation-eligibility-by-facts`

**中文摘要**：terminal 卡片适用性对根调用和嵌套 dispatch 用同一检查，不因 parentCallId 拒绝；嵌套不删除模型已消费的原始事实；不确定时用保守通用回退。

**何时适用/前提**：根与 PTC nested 调用具有同一组原始 terminal facts；tree placement 与 terminal eligibility 应独立，spill/异常/不完整结果需要保守展示。

**机制义务与责任程序**：
- Terminal derivation owner 不因 parentCallId 单独拒绝；同样检查 root/PTC bash/pwsh/terminal_send。Persistent Shell running 可用、settled 通用；nonzero process exit 是 result data，非 tool error。
- 保留 tool error/malformed/missing head/unsupported 的 generic fallback。September background-generic 仅被 October explicit-background bash/pwsh 的 launch/static command 规则局部取代；background terminal_send/timeout promotion 不扩张。
- Spill notice 可跟在 exit marker 后或替代它，走 BashRow expandable generic/Details raw；不从缺 marker 推成功。复用 browser-safe `formatSpillNotice`/`hasSpillNotice`/`describeOmitted`，保留历史字节，不新增 regex。
- Reviewer 对比 root/child、running/settled、notice-only/marker后缀与真实 PTC spill；其他 structured child metadata/Host/event/schema/model context 规则不变。

**机制特定失败/例外/证据限制**：Notice 可由工具伪造，识别不是认证，只选保守显示；不能恢复被截掉的 exit status。`automatic` 保留源共享派生/文本 convention，目标 UI/spill 未运行。修复支持的调用可重获 terminal display，不能把 generic fallback 说成自动 status 修复。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-nested-terminal-cards.md:1-36@687f282e`；`deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-10-background-shell-command-display.md:1-33@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-nested-terminal-cards.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-10-background-shell-command-display.md:1-33@687f282e

<a id="presentation-single-row-escape"></a>
## 76. Presentation Single Row Escape

**机制 ID**：`rationale-bug-fix-2-presentation-single-row-escape`

**中文摘要**：单行卡片字段在单行渲染点转义换行；多行字段保留 displayText+split；拒绝在 presenter 层剥离，因为这是 UI 关注点。

**何时适用/前提**：TUI 对 card title、terminal description/cwd 与 pending command echo 只预留一 logical row，而源 command 可能含真实 newline。需要实际 row layout 与原始值/多行 body comparator。

**机制义务与责任程序**：
- Render owner 在四个单行点用 `displayInlineText` 将 newline 显示为 literal `\x0a`，不改变原始 command/presenter。
- 真正 captured output 与 contentText 仍用 `displayText`+`split('\n')`；Reviewer 拒绝 presenter strip 和故意多行 title，检查邻接 description/output/exit/steering row 不相撞。
- Regression owner 在实际 TUI 观察 pending/completed 的多行命令；源 tmux 两态与 multilineTerminal fixture 只是历史证明。

**机制特定失败/例外/证据限制**：单行边界不能套到 genuine output；源没有独立 fail-loud/恢复协议，目标 C5 的修复后实际 TUI 重跑须另证。`automatic` 保留源 render escape，目标 renderer/escape 与 live run 仍缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tool-card-single-row-fields-inline.md:1-24@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tool-card-single-row-fields-inline.md:1-24@687f282e

<a id="primary-action-state-alignment"></a>
## 77. Primary Action State Alignment

**机制 ID**：`rationale-bug-fix-2-primary-action-state-alignment`

**中文摘要**：唯一主指针控件反映当前状态与内容：空运行草稿显示 Stop，非空或附件显示 Send via Queue，owner block 保持 Stop，清除或成功提交恢复 Stop。

**何时适用/前提**：Ordinary running composer 可编辑且只有一个 pointer primary seat，text/attachment、owner block 或 clear/submit 改变动作；keyboard delivery preference 是独立设置。

**机制义务与责任程序**：
- InputBar owner 让 running empty→Stop/session cancel，non-whitespace 或 attachment→同 seat 的 Send/Queue；owner block 即使有 retained draft 仍 Stop。
- Clear 或成功 submit 在仍 running 时恢复 Stop；idle Send 在 empty/unavailable 时 disabled。Pointer 永远不继承 busyEnter Steer/Queue，后者仅 keyboard gestures。
- Continuable subagent 保留独立 Send/Stop，one-shot read-only；Reviewer 拒绝 ordinary 永久 dual controls、全程 Stop 和 pointer 隐式 Steer。
- Regression owner park 真实 composed Turn，点击 follow-up 经 Host Queue，见 draft clear 后 Stop，删除 queued row 再 cancel；attachment-only/block/idle/subagent 另控。

**机制特定失败/例外/证据限制**：Actionable ordinary draft 暂占主 seat，不同时保留 Stop；清除/接受/block 后才回 Stop。Keyboard、cancel transport、subagent 不改。`automatic` 指源 precedence/transport 使用，源 keyless Host Queue 历史 replay 不能替代目标 pointer/Host 证明；当前仍缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-running-draft-primary-send.md:1-32@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-running-draft-primary-send.md:1-32@687f282e

<a id="process-vs-durable-state-separation"></a>
## 78. Process Vs Durable State Separation

**机制 ID**：`rationale-bug-fix-2-process-vs-durable-state-separation`

**中文摘要**：activation 按领域契约是进程本地，单独发 live 事件并仅转发 JSON，不写入 GoalSnapshot 或检查点投影，也不转发非 JSON 的 scoped 事件。

**何时适用/前提**：领域有 process-local activation 与 durable goal status，Web 经异步 Remote 刷新并可能遇到 restore/fork、reconnect 或乱序 stale read。所需 live hook channel 缺失属于效果缺口。

**机制义务与责任程序**：
- Goal/API owner 保持 activation 不进入 GoalSnapshot/checkpoint；read-only `ctx.goals.get` 与 JSON `goal/activation-changed` 只传 `{sessionId,goal:{id,revision,activation}}`，clear 后无 goal，不转发含 Agent 的 scoped goal/changed。
- Slot inject 创建 registrant-private observed source，读 `ctx.remote.goals.get`、订阅 activation edges，在 running/connection reset 刷新；components 自己不订阅。Edge epoch 拒绝旧 HTTP，running refresh 保留前值。
- GoalBar 显示 armed active 为 Ongoing Goal/pause，disarmed active 为 Inactive Goal/resume，durable paused 保留用户 resume；模型能否恢复必须用 authority-action-propagation 的 pre-service 守卫，不能凭按钮推断。
- Reviewer 测 restore/fork 无旧 armed、clear、stale edge/read、refresh retention；durable 格式/版本不改，pause 权仍归领域和用户入口。

**机制特定失败/例外/证据限制**：持久 paused 的模型 `update_goal resume` 在 GoalService 前 `GOAL_TOOL_RESUME_PAUSED`；disarmed-active/blocked 仍可恢复，Web/command/direct service 保有用户恢复。`automatic` 保留源 live channel/epoch 效果；目标 Goal/Remote/source/UI 仍未绑定运行，不能让 refresh 等价于授权。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-user-owned-goal-pause-activation.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-03-user-owned-goal-pause-activation.md:1-36@687f282e

<a id="producer-owned-serialization-normalization"></a>
## 79. Producer Owned Serialization Normalization

**机制 ID**：`rationale-bug-fix-2-producer-owned-serialization-normalization`

**中文摘要**：生产方把凭据转成 JSON 像（丢 undefined 成员、数组 undefined 变 null），严格存储仍拒绝真正不可表示的值；不让存储放宽为所有插件共享的归一化。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：The store bridge converts a grant credential to its JSON image (explicit undefined members dropped, undefined array entries null), matching JSON.stringify semantics, while foreign values pass through so the strict store still fails loud; JSON round-trip rejected because it also nulls non-finite numbers and invokes toJSON; validator not relaxed

**机制义务（提取要点；保留关键英文措辞）**：
- Producer JSON image drops explicit-undefined plain-object members and nulls undefined array entries; non-finite/foreign-prototype values pass through to the strict store unchanged.
- Do not JSON round-trip (nulls NaN/Infinity, runs toJSON) or relax the shared byte-faithful validator; normalize only in the producer that knows the idiom.

**机制特定失败/例外/证据限制**：Date-valued member 必须 fail loud 到 caller；read-back 缺失与未设置不可区分。目标 provider/store binding 与写入/拒绝运行证据缺失，planned 不等于运行。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-26-pi-ai-grant-payload-json-image.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-26-pi-ai-grant-payload-json-image.md:1-30@687f282e

<a id="projection-separation"></a>
## 80. Projection Separation

**机制 ID**：`rationale-bug-fix-2-projection-separation`

**中文摘要**：人类 transcript 按原始日志顺序投影，绝不参考模型 surface 顺序；模型专属替换副本不进入；压缩标记报告边界而非删除历史。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：The human transcript projects raw log order and never consults model surface order; model-only replacement copies stay out, and a compaction marker reports a boundary instead of erasing history.

**机制义务（提取要点；保留关键英文措辞）**：
- Project append-origin log order plus one marker per landed checkpoint; never consult model surface order.
- Exclude model-only replacement copies; keep a separate exact model-view reader.
- Marker reads cited structured compaction/summary event, not framed checkpoint payload; pair /compact only by unique successful summaryEventSeq, else generic rows.

**机制特定失败/例外/证据限制**：outside-page summary leaves count/token unavailable (soft-fall, later page resolves), no foldDegraded/logging; older logs keep two-row soft-fall without migration. 窗口仍随 session length 增长；目标 adapter/browser replay proof 缺失。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-transcript-log-ordered-projection.md:1-79@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-web-transcript-log-ordered-projection.md:1-79@687f282e

<a id="prompt-fact-ownership"></a>
## 81. Prompt Fact Ownership

**机制 ID**：`rationale-bug-fix-2-prompt-fact-ownership`

**中文摘要**：prompt section 说明 checkout 与 cwd 是可能不同的独立事实，禁止推断并指向 pwd；拒绝虚假的“永不相等”，因为 meta 模式有意重合。

**何时适用/前提**：launcher-global checkout 与 session cwd 同时影响 prompt；普通项目可不同，`dsh meta` 有意相等，不能由一个固定路径推工作目录。

**机制义务与责任程序**：
- Prompt/launcher owner 标识 `DeepSeek Harness implementation checkout` 与 inspection/extension 目的，说明两值独立、可能不同，禁止推 cwd，指向 `pwd`。
- 保留 global source 派生和 first-party order−900（identity 后），不混入 session-owned cwd，也不删去可靠 checkout purpose；Reviewer 用 unrelated-workspace 与 meta-equal 检查，拒绝“永不相等”。
- Evidence owner 区分 text/order unit pin、assembled keyless PTY header、recorded DeepSeekV4 TUI case；目标实际回答另观察 `pwd` 和输出，不能据 replay 宣称所有模型必遵从。

**机制特定失败/例外/证据限制**：`automatic` 仅指源 prompt construction/order，不是模型回答/调用 pwd 的确定性强制。源无独立 runtime fail-loud/recovery，not-applicable 不免除目标 repair 证据。目标 construction/model/PTY 仍未运行，本次 English 阅读不建立新中文等价证明。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-source-checkout-workdir-distinction.md:1-34@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-source-checkout-workdir-distinction.md:1-34@687f282e

<a id="protocol-owner-self-healing"></a>
## 82. Protocol Owner Self Healing

**机制 ID**：`rationale-bug-fix-2-protocol-owner-self-healing`

**中文摘要**：消费者覆盖 PS1 会让每次 send 退化到静默层；PROMPT_COMMAND 在每个标记后重新断言 PS1，删除消费者私有 prompt 常量。

**何时适用/前提**：persistent-shell backend 拥有 readiness prompt，消费者或命令覆盖 PS1 导致静默层退化；tool 需要使用 seam 证明的 stdin_read，而不是知道某个 provider 的 prompt。

**机制义务（提取要点；保留关键英文措辞）**：
- Backend 在 marker 后重设 PS1；tool 只初始化 stty -echo，删除私有 prompt 常量、viewport-suffix 判断和剥离逻辑。
- 无完整 end marker 但已证明 stdin_read 时返回 captured partial output，允许尾部 backend prompt；完整 marker 输出保持字节一致。
- 保留 marker+exact-prompt readiness，拒绝仅修消费者、导入常量、删除 prompt 因子或调大静默时间来掩盖失效。
- Evidence owner 将 idleSilenceMs 设到 send bound 之外，真实 PTY 覆盖 PS1 后观察下一次 send 的自愈，不让静默层使测试虚过。

**机制特定失败/例外/证据限制**：macOS 无 exact stdin-wait，交互 child 无证明仍到 timeoutMs；覆盖 PROMPT_COMMAND 本身不会自愈，保留原静默上界。源 Darwin 时间不是目标基准。automatic 是 backend 实际修复效果，不是当前包已实现 PTY；目标 runtime/byte/故障证据仍 planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-15-persistent-bash-keeps-controlled-prompt.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-15-persistent-bash-keeps-controlled-prompt.md:1-36@687f282e

<a id="redundancy-suppression-owner"></a>
## 83. Redundancy Suppression Owner

**机制 ID**：`rationale-bug-fix-2-redundancy-suppression-owner`

**中文摘要**：路径去重放在 TUI renderer，因为冗余是共享展示问题；工具仍为其他消费者输出路径；多文件头保留；fixture 必须能暴露旧 bug。

**何时适用/前提**：TUI diff title 与单个 FileDiff 重复路径；producer 仍需为其他 surface 保留完整信息，不能为视觉去重删数据。

**机制义务（提取要点；保留关键英文措辞）**：
- 仅 exactly one diff 且 effective title（resultView.title ?? callView.title）包含其 path 时关闭 showPath；multi-file 保留每个 header。
- 共享 TUI renderer 做 suppression，tools 仍输出 title/path。接受 substring 语义，含 blank/empty path 与 incidental match。
- Evidence owner 用真实形状 Edit src/only.ts 测 visible path 恰一次，并用 Edit files 的 a.txt/b.txt 保留控制；旧 title无path/两diff fixture 不足。

**机制特定失败/例外/证据限制**：substring 是有意 heuristic，不是 path equality；没有新增 error/retry/recovery。目标 renderer/actual snapshot 未绑定/运行，场景 planned，not-applicable 不能豁免目标失败控制修复，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tui-diff-card-redundant-path-header.md:1-38@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-tui-diff-card-redundant-path-header.md:1-38@687f282e

<a id="render-identity-keying"></a>
## 84. Render Identity Keying

**机制 ID**：`rationale-bug-fix-2-render-identity-keying`

**中文摘要**：结构化 occurrence 按 occurrenceId 键；扫描得到的纯文本范围按草稿顺序序号键（在边界列表组装处计算），偏移键会在每次击键时重挂后续装饰。

**何时适用/前提**：plain scan refs 无持久 identity，前方文本长度变动会让 offset keys 重挂 mark/glyph；structured occurrences 则有 occurrenceId，不能统一改 ordinal。

**机制义务（提取要点；保留关键英文措辞）**：
- Structured chips 用 occurrenceId；plain marks 用 offset-sorted textRefs ordinal，在 boundary assembly 计算以避免 skipped boundary 位移。
- 真实前方键入/删除后 mark 和 nested glyph DOM identity 保持；token 不再匹配扫描时 decoration 消失。
- 仅无 focus/selection/animation state 的 marks 可用 ordinal；前方插入 ref 可复用旧 slots/替换内容，不承诺 durable occurrence identity。
- 拒绝 text/offset keys、仅为 key 新建 mutable identity table 或不提供 React array keys。

**机制特定失败/例外/证据限制**：token失配是正常纯派生，不是 fail-loud/retry；未来 mark 有内部状态必须重新判断 key。目标 DOM identity/change/insertion 证据 planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-composer-reference-decoration-keys.md:1-40@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-20-composer-reference-decoration-keys.md:1-40@687f282e

<a id="replaceable-component-substitution"></a>
## 85. Replaceable Component Substitution

**机制 ID**：`rationale-bug-fix-2-replaceable-component-substitution`

**中文摘要**：Windows PTY 用 node-pty 自带 OpenConsole（useConptyDll 仅 win32）；不把 OS 控制台宿主的重绘 quirk 教给 sanitizer；打包资产因此承重，缺失时硬失败。

**何时适用/前提**：Windows OS console 重绘出 nonprefixing prompt，既有 tail grace 永远不适用；可替换 backend 已随 node-pty 发布，不应把其 quirk 固化进共享 sanitizer。

**机制义务（提取要点；保留关键英文措辞）**：
- win32 allocator 设 useConptyDll:true 用 bundled OpenConsole，POSIX不变；相对 addon 解析 conpty.dll/OpenConsole.exe，packaged retained-file policy 因此承重。
- missing DLL 必须 throw、不回 OS host；shell pid、Windows inspector、SIGINT写入到 console-wide CTRL_C 和两种 kill exit event 保持。
- Reviewer 保留 experimental upgrade 风险，实跑受影响 pool scroll/prompt、packaged PTY/kill；不能只 pin option 或调 nonprefixing-tail grace。
- 不接受红 standby drill、生产host强制升级或 sanitizer特判作为这次替代修复。

**机制特定失败/例外/证据限制**：Windows仍无 exact stdin wait；源 host 测量不等于 next-master standby CI 已通过。目标 Windows/PTy/packaged assets/lane 未绑定/运行，恢复需还原资产后实际重跑，planned；未新读中文。

**引用**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-28-pty-bundled-console-host.md:1-39@687f282e`

来源：deepseek-harness/.agents/notes/implemented/bug-fix/2026-09-28-pty-bundled-console-host.md:1-39@687f282e

<a id="representation-boundary-conversion"></a>
## 86. Representation Boundary Conversion

**机制 ID**：`rationale-bug-fix-2-representation-boundary-conversion`

**中文摘要**：客户端分数 flow seq 在 SessionRuntime.fork（拥有该约定的包）的 wire 边界转成真实整数 event seq；线上契约保持规范整数。

**何时适用/前提**：client live/replay projection 的 turnEnd.seq−0.9 不是事件号；wire 仅接受 nonnegative integer，conversion 必须由拥有 fractional convention 的 runtime 统一完成。

**机制义务（提取要点；保留关键英文措辞）**：
- SessionRuntime.fork 在RPC前 floor atSeq，integer不变；host first-turn/end-at-or-after 仍完成点击的 whole-turn prefix。
- actual aborted-turn child seed 包含该 turn/end；chunk重建 frozen partial 从未是 assistant/message，不进入 child model transcript。
- 不放宽 wire fractions、不隐藏 stopped-turn button、不在一个 UI adapter 局部 floor；Reviewer/evidence owner 走实际 apiproxy 和 child log。

**机制特定失败/例外/证据限制**：chat fork failures 仍 swallowed，这是未修 gap，不能写成 fail-loud；修 owner 后 actual child 才是恢复证明。目标 RPC/fork/model transcript planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-fork-anchor-floors-to-event-seq.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-fork-anchor-floors-to-event-seq.md:1-36@687f282e

<a id="request-aware-validation"></a>
## 87. Request Aware Validation

**机制 ID**：`rationale-bug-fix-2-request-aware-validation`

**中文摘要**：selected+custom 只在问题显式 opt-in multiSelect 时允许；单选或无选项保持互斥；custom 不编码成 option label；DTO/schema 不变。

**何时适用/前提**：原请求明确 multiSelect:true 且用户同时选择 labels/输入 custom；validator 必须读请求 cardinality，而非放宽所有 answer DTO。

**机制义务（提取要点；保留关键英文措辞）**：
- Web先选/先写都保留两值；TUI mode切换保留 pending custom，两种submit mode都投影 checked labels+custom。
- Host保留id/label/uniqueness/batch/nonempty-text校验与 labels-only；single-select/optionless custom覆盖selected，保持exclusive。
- `{id,selected,custom?}` wire/tool schema不变，custom不伪装为caller label。
- Evidence owner联动 actual Web/TUI、host response、tool projection，拒绝只改一端造成合法组合丢失/拒绝。

**机制特定失败/例外/证据限制**：没有全局 combined permission 或新 retry协议；输入保留/校验状态不等于恢复已执行。目标各入口未绑定/运行，planned；未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-multi-select-custom-answer-composition.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-multi-select-custom-answer-composition.md:1-26@687f282e

<a id="root-cause-and-ownership"></a>
## 88. Root Cause And Ownership

**机制 ID**：`rationale-bug-fix-2-root-cause-and-ownership`

**中文摘要**：先证明根因（如 flex shortfall 分布）再修；修复钉住行让溢出进入滚动容器；验证必须有反空测守卫和双向变异。

**何时适用/前提**：short viewport+wrapped option copy 下 flex-shrink 分配短缺，copy超出row而list没有scroll；cap本身保留header/footer可达，不能因表象去掉。

**机制义务（提取要点；保留关键英文措辞）**：
- option/custom flex-shrink:0；.options保留overflow-y:auto/min-height:0与min(60vh,520px) cap，让真实shortfall到scroll owner，不clip/ellipsis描述。
- Evidence owner在900×520/440/380检查row-child containment；必须有wrapped row且真实list scrolling，short container/Blue-Green单行fixture不能证伪。
- 撤销CSS应失败、还原通过；必须先成功build client module并确认exit0，再 replay/capture，不用build:web或部分失败留下的stale lib。

**机制特定失败/例外/证据限制**：record mode需到fixture write，几何断言replay-only；源340-size sweep是历史测量，不是目标proof。更早出现scroll是有意结果，非需恢复异常。目标build/browser geometry planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-question-composer-rows-do-not-shrink.md:1-51@687f282e

<a id="runtime-feedback-target"></a>
## 89. Runtime Feedback Target

**机制 ID**：`rationale-bug-fix-2-runtime-feedback-target`

**中文摘要**：以托管会话的同一实际 URL 为 GUI 验收对象；完整 host 提供 orientation 与 DSH_WEB_URL，裸 Vite serve 在 listen 前失败；重建/刷新和 HMR 不能由“另起端口能访问”替代。

**何时适用/前提**：普通 full-host Web 会话正在修改自身 GUI；surfaceContext:false 完整 profile 明确选择放弃这套 guidance/managed URL。无 GUI 的目标不能靠这段文字宣称反馈闭环通过。

**机制义务（提取要点；保留关键英文措辞）**：
- Runtime 拥有实际 bound/advertised URL，shell 变量同值；无隐含 DOM/route/screenshot，也不声称 LAN alias 是浏览器字面地址。
- Agent 验证 same-checkout dev:web watcher 后才能承诺 plugin HMR；其他 shell/package 变更重建受影响 artifacts 并刷新既有 URL，不主动换 GUI。
- Guard Vite serve 本身（含 npx 绕过），自然退出并给 full-host/HMR 路径诊断，Server.listen 必须未调用；build mode 不受影响。
- 观察同 page identity 的新 DOM 与同 port 的新静态 bytes。另起服务仅在用户明确要求时走 managed background lifecycle，不用 shell &。
- July literal system URL 现由 October value-free guidance + optional runtime-context 接续；不把旧 prompt 字节位置当作当前要求。

**机制特定失败/例外/证据限制**：surfaceContext:false 不接收 optional guidance/value 和 managed URL；URL 契约不能阻止任意 shell 命令另起端口。Host 无需仅因静态 artifact 改动而重启，client reload 还依赖 watcher。目标 CLI/browser/HTTP/HMR 未实现/运行，场景 planned，不把模型 guidance 说成确定性禁止。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-web-gui-feedback-loop.md:1-40@687f282e`

**位置接续**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-11-process-specific-prompt-values-in-runtime-context.md:19-43@687f282e`；完整旧格式兼容见 `prefix-stability-migration`，此处只保留实际 runtime feedback 契约。

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-web-gui-feedback-loop.md:1-40@687f282e

<a id="scoped-state-ownership"></a>
## 90. Scoped State Ownership

**机制 ID**：`rationale-bug-fix-2-scoped-state-ownership`

**中文摘要**：详情状态按会话作用域，宽度偏好按根作用域；记录最后一个非空拥有会话；未选中状态只派生零轨道而不成为所有者；切换在绘制前关闭根偏好。

**何时适用/前提**：详情是Session-owned，宽度preference root-owned；只比较真实nonblank selected owners，hero/unselected/invalidation不构成新owner。

**机制义务（提取要点；保留关键英文措辞）**：
- AppFrame从权威Session id/blank读取，记录last nonblank owner；无owner仅render track0，不改preference或last owner。
- first materialization保留initial closed；same-A经hero返回保留当前width，不同B在paint前经layout store关闭，忘掉dragged width，reopen用default。
- transient store不读写localStorage；reload还原sidebar default/details closed，不加baseline readiness或per-session width map。
- Reviewer/evidence owner覆盖direct/hero-mediated/first/same-owner/reload full grid；drafts/navigation/chat selection/resizing继续归原owner。

**机制特定失败/例外/证据限制**：rendered0与stored width不是同一状态，reload忘geometry是有意契约；New Session click不负责关details。目标actual frame/browser/control repair planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-web-details-session-lifecycle.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-29-web-details-session-lifecycle.md:1-30@687f282e

<a id="secret-absence-nonretryable"></a>
## 91. Secret Absence Nonretryable

**机制 ID**：`rationale-bug-fix-2-secret-absence-nonretryable`

**中文摘要**：一个 trim 后可打印 ASCII 谓词覆盖所有报告的坏输入；字符集不变量在浏览器/解析器/凭据读取处执行；粘贴形状启发式只在浏览器，避免解析器误杀网关。

**何时适用/前提**：必须区分unnamed credential、UI truly empty draft和provided whitespace；只验证已提供的string，不把absence当坏key。

**机制义务（提取要点；保留关键英文措辞）**：
- trim后非空且U+0021–U+007E；adapter credential/env和discovery在造header前拒绝INVALID_CREDENTIAL，default retry set不包含该code，诊断指Models且不含key片段/ByteString。
- unnamed pi-ai保留ambient/OAuth；no-key probe无authorization；UI空draft保留stored并不调用set，whitespace-only是field failure。
- browser-only粘贴env/matching-quotes heuristic不能移入resolver锁死gateway；真实ASCII assignment-shaped key可经environment绕过误判。
- Evidence owner跑real credentials seam、headless terminal与UI/probe/save input table；不扩大generic credential store职责，也不增blocking network verify-on-save。

**机制特定失败/例外/证据限制**：ASCII有意比latin1严格，browser heuristic可能false-positive；default nonretryable不是认证成功保证。目标LLM/UI/headless尚无运行证据，planned；不得用GitHub token模块冒充，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-api-key-format-validation.md:1-102@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-api-key-format-validation.md:1-102@687f282e

<a id="semantic-durability-barriers"></a>
## 92. Semantic Durability Barriers

**机制 ID**：`rationale-bug-fix-2-semantic-durability-barriers`

**中文摘要**：语义屏障在派生请求、构建 adapter、执行工具之前保住已记录意图；ACP 必须把 bridge/policy/persistence 放进一个有序 effect，先等 bridge agents 静止并 flush 真实 closing events，再拆后两者。恢复依据 durable call 是否存在，不承诺通用 exactly-once。

**何时适用/前提**：持久化 runtime 的请求/工具可能崩溃，或卸载时 persistence 与 agent 关闭竞争。policy/coordinator owners 管屏障与序列化，ACP composite owner 管卸载顺序；specialized 部署可显式替换/省略 policy，而非让 backend 自行选 scheduling。

**机制义务（提取要点；保留关键英文措辞）**：
- Keep policy scheduling separate from persistence durability; first-party persisted compositions mount both, specialized deployments may intentionally use a replacement or coarser loop checkpoints.
- Flush pre-step before deriving a request, logged request/header before adapter construction, and top-level tool/call after policy before body; nested dispatch reuses the outer call.
- Request/tool checkpoint rejection prevents dispatch; pending-tool cancellation returns ABORTED_BEFORE_DISPATCH. Between-step rejection closes the turn; final-checkpoint rejection is reported without blocking later queued work.
- Settle final turn/end before next queued turn/idle; the coordinator serializes concurrent checkpoints without duplicate sequences.
- Mount ACP bridge/policy/backend in one ordered effect: unload bridge, await agent quiescence and real step/end/turn/end durability, then detach checkpoint scheduling/persistence; concurrent sibling unload is not equivalent.
- TOOL_NOT_STARTED may retry if needed; TOOL_OUTCOME_UNKNOWN permits read-only/idempotent retry, otherwise verify external state or ask. Stable callId may support provider idempotency, never generic exactly-once.

**机制特定失败/例外/证据限制**：其他 pre-step listener 的先后受注册序影响，上一屏障后的部分流仍可能丢失。崩溃 harness 必须等 marker 内容而非仅 path 存在。分类 automatic 保留有挂载 policy 时的源效果，不代表本包已有目标 policy/composite；目标 dispatch/unload/crash 与条件处置证据仍缺失，全部场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-21-semantic-session-checkpoints.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-21-semantic-session-checkpoints.md:1-30@687f282e

<a id="serialized-nonreentrant-update"></a>
## 93. Serialized Nonreentrant Update

**机制 ID**：`rationale-bug-fix-2-serialized-nonreentrant-update`

**中文摘要**：非可重入 Include 必须串行全部 child-tree mutation/read，同时 main HMR watcher 排除重复 initial scan；只做任一半都不能恢复失败 boot 的 rollback/terminal 契约。

**何时适用/前提**：initial apply、HMR refresh 和 teardown-draining tasks 交错，出现 rollback→HMR→refresh→apply 环；registerConfig 的独立初扫仍有实际配置应用职责。

**机制义务（提取要点；保留关键英文措辞）**：
- initial apply、refresh、internal/update reapply 共用 per-Include promise queue；refresh 在队列内读并对比前驱 committed content。
- main watcher ignoreInitial:true；registerConfig 保持 ignoreInitial:false，使现有个人 config 恰应用一次。
- 两半都存在时失败 apply 应 dispose 树/终端，loader.create reject，boot 以包含 $.providers 的 labelled diagnostic exit1，而非静默 exit13。
- Reviewer 保留两个单独撤销控制和真实 invalid-provider PTY/terminal reset，不以调 timeout 或只 suppress startup 代替事务正确性。

**机制特定失败/例外/证据限制**：真实 config edit 若恰发生在 failing initial apply，仍可重建同样 deadlock；源把 teardown cancellation 留待该触发发生时处理，不是已完成义务。scan window edit 等下一 change，steady reload 不变。目标 queue/watcher/PTY 证据缺失且 planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-03-hmr-initial-scan-boot-deadlock.md:1-42@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-03-hmr-initial-scan-boot-deadlock.md:1-42@687f282e

<a id="shared-format-owner"></a>
## 94. Shared Format Owner

**机制 ID**：`rationale-bug-fix-2-shared-format-owner`

**中文摘要**：生产方和客户端共享一个 browser-safe notice 模块（formatSpillNotice/hasSpillNotice），不维护第二套正则；识别不是认证，匹配只选保守展示。

**何时适用/前提**：spill producer与Client需共享持久notice convention，但打印文本不提供进程/来源可信性；notice可follow或replace exit marker。

**机制义务（提取要点；保留关键英文措辞）**：
- browser-safe spill-policy/notice同管formatSpillNotice/hasSpillNotice/delimiters/describeOmitted；删UI独立regex，不引Host plugin。
- 固定历史字节与Session result，独立literal fixture而非formatter echo；不做format migration。
- actual root/PTC spill、notice-only、full text/programmatic values/byte caps不变，选择generic expandable/raw fallback，不猜成功exit。

**机制特定失败/例外/证据限制**：工具能伪造同文notice，match不是authentication，fallback不是fail-loud。源无retry/data recovery协议；目标actual producer→UI与failed-control repair仍planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-nested-terminal-cards.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-nested-terminal-cards.md:1-36@687f282e

<a id="shared-render-before-truncate"></a>
## 95. Shared Render Before Truncate

**机制 ID**：`rationale-bug-fix-2-shared-render-before-truncate`

**中文摘要**：通用卡片内容先经共享 Markdown 主题渲染，再折叠截断；terminal/diff 保持字面 renderer；原始工具输入保持字面。

**何时适用/前提**：generic result是presenter prose，fence/ack/error需与conversation共享Markdown；raw arguments/terminal/diff仍字面，不统统parse。

**机制义务（提取要点；保留关键英文措辞）**：
- shared Markdown theme/sanitization先render，隐藏fences、保留language/code body，再对visible rows做head-tail limit。
- terminal/diff specialized renderers和generic raw input不变；不用Bash单producer strip或source-line先truncate。
- Evidence owner检查真实TUI fence/language/body/collapse与assembled keyless transcript，并带literal控制。

**机制特定失败/例外/证据限制**：generic punctuation被解释是设计语义，需literal者用terminal intent；没有新增retry/recovery。目标TUI未绑定/运行，planned；未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-23-tui-generic-card-markdown.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-23-tui-generic-card-markdown.md:1-30@687f282e

<a id="single-composition-owner"></a>
## 96. Single Composition Owner

**机制 ID**：`rationale-bug-fix-2-single-composition-owner`

**中文摘要**：每会话 preset 成为 RL agent composition 的唯一所有者；移除进程级 patch；最终 assembly registry 强制 complete PromptSection 并拒绝重复；entry-local PTY/fs 仍独立。

**何时适用/前提**：per-agent composition与process patch竞争，early/cooperative filter可被后续listener绕过；负保证必须位于最终assembly authority。

**机制义务（提取要点；保留关键英文措辞）**：
- Minimal preset唯一拥有Web RL agent composition，删除core-web兼容patch；Host继续拥有cross-session services。
- ordinary waterfall后registry恢复detached complete section、丢弃dynamic contributions并拒绝多个effective complete；不是disable已知contributors清单。
- entry-local PTY/backend/persistent Bash300s+absolute editor，current successor为bare fs/no compaction；runtime context suppression与exact persona由preset给出。
- Reviewer用late mutation/duplicate负控制，actual assembled Web+独立SDK installed路径验证两次shell/env/cwd/editor及其他session隔离。

**机制特定失败/例外/证据限制**：Web minimal需POSIX，不支持Windows agents；standalone SDK prompt/launcher独立并可选Windows PowerShell。agent退出shell state消失。目标composition/runtime/correction证据planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-minimal-preset-owns-rl-composition.md:1-40@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-minimal-preset-owns-rl-composition.md:1-40@687f282e

<a id="single-source-of-durable-content"></a>
## 97. Single Source Of Durable Content

**机制 ID**：`rationale-bug-fix-2-single-source-of-durable-content`

**中文摘要**：修复 presenter 元数据与持久 tool/result.content 的拆分所有权；规范 registry pipeline 拥有最终模型可见内容，通用回退渲染它，删除过期元数据。

**何时适用/前提**：tool 有最终持久 rendered content，但 presenter 从 logs metadata 重建，或 mux 在 view 再复制一份；区分 July ACP/TUI nested event/card 边界与 September Web PTC terminal 例外。

**机制义务（提取要点；保留关键英文措辞）**：
- Registry owns logs→return/no-output、runtime/pre-policy error 和 post-policy/spill replacement；最终 tool/result.content 是 generic fallback 唯一内容源。
- 删除 run_code presentResult/logs-only metadata，保留 pending program title；Host 不把 event.data.content 再序列化到 result view，不 merge logs。
- July exec.parent 只发含完整值的 tool/code-dispatch，不发 tool/call/tool/result surface events；当时 ACP/TUI 一次 outer run_code 一张 card。
- 该历史规则不是当前 universal child-card ban：September 允许符合 eligibility 的 Client-derived Web PTC terminal cards，canonical value/metadata 仍不变。
- 实测 logs-only/result-only/both/no-output/spill/error 与 host call-only presenter，核对内容无丢失/重复；旧 optional metadata records 可读，不为此变更 format。

**机制特定失败/例外/证据限制**：runtime/pre-policy error 不跑 success renderer，post-execute block 可在 render 后替换结果；spill preview 最终持久投影优先。源无独立 retry/recovery 不免目标 C5 repair。目标 registry/mux/surface 尚未绑定或运行，场景 planned；源旧快照不冒充当前所有 UI。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-20-code-mode-result-card-completeness.md:1-40@687f282e`

**后续有界例外**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-05-nested-terminal-cards.md:12-36@687f282e`，详见 `presentation-eligibility-by-facts`；仅 terminal child 限制接续，不解禁其他 structured child cards。

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-20-code-mode-result-card-completeness.md:1-40@687f282e

<a id="snapshot-untrusted-metadata"></a>
## 98. Snapshot Untrusted Metadata

**机制 ID**：`rationale-bug-fix-2-snapshot-untrusted-metadata`

**中文摘要**：校验前把 namespace.global、errorClass.name 等各读一次到普通值并存储普通副本；引导帧序列化副本，使 getter 无法在校验与序列化之间改变或抛错。

**何时适用/前提**：untrusted namespace/errorClass metadata由getter产生，validation和boot JSON.stringify分阶段重复读取会产生TOCTOU差异。

**机制义务（提取要点；保留关键英文措辞）**：
- namespace.global/errorClass.name/memberNameProperty各读一次到plain locals，校验后存plain{name,memberNameProperty}，boot只序列化该副本。
- 只先读一次却仍保留原errorClass对象不够：stringify还会访问getter。
- Evidence owner让getter首次合法、第二次变化/抛错，实际boot/complete成功且每field access count1，撤销snapshot应失败。

**机制特定失败/例外/证据限制**：只保证不重复读取，不保证首个getter无副作用/深克隆/任意validation自愈；其他Python resource机制另归owner。目标worker/serializer/control repair planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-code-runtime-python-call-backlog-and-binding-metadata-snapshot.md:1-71@687f282e

<a id="snapshot-volatile-stability"></a>
## 99. Snapshot Volatile Stability

**机制 ID**：`rationale-bug-fix-2-snapshot-volatile-stability`

**中文摘要**：刷新写回以 normalizeSessionLog 为 volatile 值权威；保持叶级；仅当两图中 ID+fingerprint 度为 1 时才复用消息 ID；歧义保守回退。

**何时适用/前提**：record/refresh写回随机/host volatile但行为等价的raw fixtures；复用必须受graph uniqueness与logical alignment约束，不是无条件no-diff。

**机制义务（提取要点；保留关键英文措辞）**：
- 一个structural owner用权威surface predicate和inbox/spliced关联，跨parent/child fixture-ready logs去top-level id后fingerprint；fresh/old两图id与fingerprint均degree1才复用UUID。
- inherited重复same-id算一个candidate；new/changed/duplicate-content/malformed/conflicting保留fresh，不让positional leaf路径再分配complete message id。
- normalizer权威下aligned equivalent leaf保old raw，semantic leaf保fresh；record layout对齐（独立chunk/title等价例外）且fresh↔old changed strings为全log bijection。
- object按key、array仅同length、string atomic；mismatch/conflict关闭string reuse。保raw replay与生产randomness，不迁normalizedfixtures或整record假保留。

**机制特定失败/例外/证据限制**：ambiguity/resized array/mixed semantic+volatile等用fresh是安全结果，不是拒绝/错误恢复；目标writer/normalizer/actual refresh与控制修复证据planned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-stable-snapshot-refresh-volatiles.md:1-36@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-27-stable-snapshot-refresh-volatiles.md:1-36@687f282e

<a id="stable-prefix-placement"></a>
## 100. Stable Prefix Placement

**机制 ID**：`rationale-bug-fix-2-stable-prefix-placement`

**中文摘要**：固定身份与 persona 前缀在前，可复用指令在环境变化 suffix 之前；显式模板而非解析 prose；扩展顺序与监听器仍权威，因此只承诺条件性字节前缀，不承诺缓存命中。

**何时适用/前提**：first-party prompt registry 将 reusable instructions、显式 persona prefix/suffix 与变化环境分离；September 的 literal suffix 已有 October source/Web runtime-context 接续，不能用历史 rejected alternative 否定当前规则。

**机制义务（提取要点；保留关键英文措辞）**：
- 固定身份在前、DEPLOYMENT_PERSONA_PREFIX0；STRUCTURED_OUTPUT 后依次 HARNESS_SOURCE10000 → WEB_SURFACE10100 → DEPLOYMENT_PERSONA_SUFFIX10200，三项不可漏。
- 显式 global/scoped templates，不解析 prose；省略或空 scoped suffix 都屏蔽 global，不是 fallback。
- complete:true 只渲染 prefix，忽略 suffix/其他 system sections，但不因此禁用 tool schemas/runtime context。
- 前缀字节相等只在 model/persona/tools/config/preceding text 等相同且 assembly order/listeners 允许时成立；不承诺 provider cache hit。
- 当前 source/Web literals 走 October optional contexts200/210，system 只留 value-free guidance；旧格式兼容由 prefix-stability-migration 保留。

**机制特定失败/例外/证据限制**：extension order/listeners 仍权威；无 universal stable prefix 或测得 cache gain。源无独立 retry/recovery，目标仍需失败控制修正后实跑。目标 prompt/persona/context 未绑定/运行，planned；未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-06-environment-prompt-suffix.md:1-38@687f282e`

**当前位置接续**：`deepseek-harness/.agents/notes/implemented/bug-fix/2026-10-11-process-specific-prompt-values-in-runtime-context.md:19-43@687f282e`。

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-06-environment-prompt-suffix.md:1-38@687f282e

<a id="stable-presentation-anchors"></a>
## 101. Stable Presentation Anchors

**机制 ID**：`rationale-bug-fix-2-stable-presentation-anchors`

**中文摘要**：既有 Chat Node 的位置只依赖持久锚点、节点种类和开场人工输入，不依赖可变过程或正文边界；系统提示独立且始终在开场 User 上方。

**何时适用/前提**：stream/final qualification、tool/retry/later-step 或 pagination 改变 process eligibility，或 older-history replay 与 partial-window prompt 后来补齐；这些都不应移动既有 row。

**机制义务（提取要点；保留关键英文措辞）**：
- durable anchor/kind/opening User 决定每个已投影节点的 page-lifetime 位置，不用 mutable process/answer boundary。
- System 独立且不带 process-member/hidden；dependency replay 保持其旧 anchor，partial-window 首见的 later prompt 在补前史后保留首次位置。
- pre-User Context 从首次即在 User 后，control 可以插入 User 与已有 rows 之间；无 opening human input 时 control 在最早 candidate 前。
- completion/retry/step/pagination/disclosure 只改 visibility 或加 evidence；拒绝跨 React parents reparent keyed rows，保留原 folding 其他职责。

**机制特定失败/例外/证据限制**：语义 Context order 可不同于 raw event order，但不是后期重排；稳定范围是 page lifetime。目标 stateful row/remount/stream/replay 证据缺失且 planned；source 不新增 generic fail-loud/retry 恢复，不免目标 repair。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-26-stable-turn-process-order.md:1-30@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-26-stable-turn-process-order.md:1-30@687f282e

<a id="stale-while-revalidate-interaction"></a>
## 102. Stale While Revalidate Interaction

**机制 ID**：`rationale-bug-fix-2-stale-while-revalidate-interaction`

**中文摘要**：细化时保留旧行但标记 pending；新打开仍空；旧行仅展示，pick/tab 要求 ready，pending 期间 Enter 是显式 no-op；记录死 Enter 与索引键成本。

**何时适用/前提**：open trigger menu refinement fetch尚pending，保留旧row可消flicker但不能让旧数据变成可操作候选。

**机制义务（提取要点；保留关键英文措辞）**：
- hit保rows/highlight、groups标pending；fresh seed仍skeleton，settle allReadyEmpty仍close。
- pick/Tab仅ready；pending Enter明确consumed no-op，既不stale pick也不draft submit，不queue给未来 unseen rows。
- settle后需新的user action；index-keyed row会换content，pointer测试先等stale-only folderx/消失再click。

**机制特定失败/例外/证据限制**：pending Enter短暂dead、有意代价；pre-existing highlight blink仍deferred，不能宣称全无闪动。dedicated search dialog另有clearing策略。目标actualmenu/input/correctionplanned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-28-trigger-menu-stale-while-revalidate.md:1-28@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-28-trigger-menu-stale-while-revalidate.md:1-28@687f282e

<a id="structural-invariant-over-sync"></a>
## 103. Structural Invariant Over Sync

**机制 ID**：`rationale-bug-fix-2-structural-invariant-over-sync`

**中文摘要**：用单一 scrollport 让 caret/glyph 相等成为结构不变量，替代两层两偏移；测量在任务结束前、任何 scroll 监听之前完成；反空测要求真的溢出。

**何时适用/前提**：透明textarea caret与visible backdrop有两份offset，compositor先动、scroll listener后追造成运动中分离；静止截图与jsdom不证明同步。

**机制义务（提取要点；保留关键英文措辞）**：
- 一个data-input-scroll持14-line cap/offset，full-draft mirror在normal flow定高，textarea/backdrop同宽/同containing block，textarea无独立scroll overflow。
- 删除scrollTop/transform/sentinel同步，wheel-chaining唯一listener改指scrollport；未来layer在内部且full-height。
- paste/cut/session/late-draft显式最小reveal，mirror同metrics/width测caret；newline后测前一newline再下一行。programmaticfocus preventScroll，late reveal不focus/抢控件。
- Evidence owner用真overflow40-line draft，在同task/listener前测caret-own-frame与backdropRange差值，并检查width/zero textarea overflow/realclipboard/caret/wheel；必须current client-module build成功。

**机制特定失败/例外/证据限制**：Firefox/WebKit user click可把transcript带到底部，接受；Safari soft-wrap另有修复；旧undo/redo不reveal仍未改。不能用JS/native-scroll重写或unsupported animation/gutter冒充结构修复。源cross-engine测量与Chromium scenario是历史，目标browser/control repairplanned，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-composer-text-layers-share-one-scrollport.md:1-85@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-31-composer-text-layers-share-one-scrollport.md:1-85@687f282e

<a id="surface-signal-ownership"></a>
## 104. Surface Signal Ownership

**机制 ID**：`rationale-bug-fix-2-surface-signal-ownership`

**中文摘要**：favicon 跟随 prefers-color-scheme，因为浏览器 chrome 按浏览器 scheme 着色，不按应用内主题开关；一个 SVG 内嵌媒体查询 + PNG fallback。

**何时适用/前提**：favicon 位于由 OS/browser scheme 决定背景的 tab chrome，且部分 engine 不支持 SVG；应用内 theme 不是该 surface 的信号所有者。

**机制义务（提取要点；保留关键英文措辞）**：
- 一个 SVG 内嵌 prefers-color-scheme，源 light黑/dark白；不用 href-swapping JS 或重复 dark SVG。
- HTML PNG fallback 在 SVG 前，manifest 两者都有；源32×32 blue PNG 覆盖 pre26 Safari，迁移时用目标品牌而非复制 DeepSeek 标识。
- Reviewer 检查实际 shipped PNG format/dimensions、declaration 顺序和 media query；真实 light/dark/legacy browser visibility 另需观察。

**机制特定失败/例外/证据限制**：Chromium scheme 切换可能直到 reload 才重绘，源明确接受，app 不承诺修复；pre26 Safari 忽略 SVG，走 PNG。源无独立 retry 协议。目标 assets/browser surface 未绑定，visual proof 和故障修正证据 planned；未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-web-favicon-dark-mode.md:1-26@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-10-web-favicon-dark-mode.md:1-26@687f282e

<a id="synchronous-exit-teardown"></a>
## 105. Synchronous Exit Teardown

**机制 ID**：`rationale-bug-fix-2-synchronous-exit-teardown`

**中文摘要**：本地 provider 持有一个同步 exit listener，保留异步清理中的 live sets；普通进程用 POSIX group SIGKILL/Windows 同步 taskkill，PTY 先后代、root、再重扫。不得改变退出原因、创建异步工作或声称当场 quiescence；remote 与无 JS 致命路径另由外部所有者负责。

**何时适用/前提**：本地 subprocess/PTY provider 的异步 dispose 可能被 process.exit/default uncaught/rejection 截断。local service owner 管最终操作与 exact live identities，reviewer 检查正常生命周期不退化，parent observer/supervision owner 验证进程消失和无法覆盖的路径。

**机制义务（提取要点；保留关键英文措辞）**：
- Install one effect-scoped synchronous exit listener, retain live handles through pending cleanup and remove the listener only after normal disposal settles.
- Finalize ordinary trees with POSIX group SIGKILL or synchronous taskkill /PID <pid> /T /F; for terminals signal captured/observable descendants, kill PTY root and rescan once.
- Contain per-target failure and continue; create no promise/timer/diagnostic and do not change original exit code/error. Keep final ops private, not public handle APIs.
- On normal cleanup failure invoke final ops before clearing sets/listener. Normal TERM/grace/KILL disposal still awaits ordinary/terminal quiescence.
- Exclude remote providers. No-JS default signals/SIGKILL/fatal OOM/abort/native crash/power loss require external ownership unless an explicit eligible signal handler redirects to disposal/process.exit.
- Callback return is not tree-disappearance proof; parent observation is required and never-observed escaped terminal descendants remain undiscoverable.

**机制特定失败/例外/证据限制**：致命退出放弃 grace、output draining 与进程内 quiescence 证明；不能削弱正常 await 语义。Issue1726 的未观察后代逃逸仍是缺口。automatic 表达需保留的本地 effect，目标 binding、条件事实和原生正常/失败/恢复实测仍未提供；不是用 planned 文本代替已实现自动能力。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-synchronous-subprocess-exit-cleanup.md:1-52@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-11-synchronous-subprocess-exit-cleanup.md:1-52@687f282e

<a id="terminal-outcome-surfacing"></a>
## 106. Terminal Outcome Surfacing

**机制 ID**：`rationale-bug-fix-2-terminal-outcome-surfacing`

**中文摘要**：从持久 turn/end 事件派生独立 max-tokens 会话节点，在该轮渲染持续警告行，不伪造事件没有的 token 数；不复用 error 展示，因为数据不同。

**何时适用/前提**：Web chat flow 收到 durable turn/end reason.kind=max-tokens；ACP/SDK 的原 presentation 不在这次变更范围，不强加同一 Web node。

**机制义务（提取要点；保留关键英文措辞）**：
- 独立 turn-max-tokens keyed node 只由 durable reason 派生，在被截断的 turn 保留 warning StateDot/localized title/hint；refresh/restore/replay 同样重建。
- 保留截断输出，说明发送 continue 开始新 turn；event 没有 token/budget 数字，禁止编造。
- 不复用 provider-error node，不放入后续会折叠的 closing tail；保留 legacy chat-snapshot contribution。
- continue/retry button、same-turn splice/retention action contract 仍 deferred；不能把指导文字说成自动 resume。

**机制特定失败/例外/证据限制**：Web-only、ACP/SDK unchanged；fixture turn renumber 只是历史维护，不是业务 proof。目标 node/localization/live/reload/replay 未实现/运行，planned；不得凭 warning 存在宣称恢复动作已完成，未新读中文。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-max-tokens-turn-end-notice.md:1-28@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-12-max-tokens-turn-end-notice.md:1-28@687f282e

<a id="token-consumer-contract"></a>
## 107. Token Consumer Contract

**机制 ID**：`rationale-bug-fix-2-token-consumer-contract`

**中文摘要**：没有消费者的 token 不是主题；机械检查每 sheet 重新绑定，从 palette ladder 派生 elevated surfaces；用 @supports 门控互斥渲染；gutter 与宽度共同必要。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：A design token with no consumer is not a theme change. Each sheet must be mechanically rebound, elevated surfaces derive from the palette ladder rather than already-rebound sheets, mutually exclusive rendering is gated by @supports, and gutter plus width are jointly necessary.

**机制义务（提取要点；保留关键英文措辞）**：
- Require every token to have an identified consumer and a mechanical per-sheet rebinding check.
- Derive elevated surfaces from the palette ladder, never from an already-rebound sheet.
- Gate mutually exclusive rendering with @supports and test gutter and width together; keep a negative control.

**计划验证**：`ui-theme/tests/scrollbar-styles.spec.ts` 从 `design-platform.css` 扫描 token 集，断言每个 token 有消费者、每个 elevated surface 重新绑定完整 pair，并按源码偏移钉住 `@supports` 路径分割；`apps/web/tests/sidebar-scrollbar.e2e.ts` 在真实引擎中断言保留带宽与 `timeCoveredBy`，读取 resting/hover 的 indirection 变量，并断言 gate 下 `scrollbar-width: auto`；移除 `@supports` 包装或把标准属性移过 gate 必须让断言变红；插件 CSS 的负例必须先重建 `@deepseek-ai/dsh-client-ui-workspace` bundle 再 `build:web`，否则 stale bundle 会假通过。证据状态：`planned`。

**机制特定失败/例外/证据限制**：按上方共用失败处理与证据限制执行；源文未给出额外例外。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-themed-scrollbars-and-reserved-gutter.md:1-85@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-28-themed-scrollbars-and-reserved-gutter.md:1-85@687f282e

<a id="transient-vs-permanent-error"></a>
## 108. Transient Vs Permanent Error: TUI adapter deferral, Windows atomic replace, Windows lock probe

**机制 ID**：`rationale-bug-fix-2-transient-vs-permanent-error`

**中文摘要**：mount 时 NO_ADAPTER 视为瞬时：静默 park 并在 registry commit 通知时重解析，永不永久抑制；目标变化清除旧等待；其他错误保持响亮。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：NO_ADAPTER on mount is treated as transient: park silently and re-resolve on the registry's commit notification, never suppress permanently, clear stale wait on target change, keep all other errors loud. Rejects timer polling, config ordering, and Loader coupling. writeFileAtomic (shared primitive, narrow owner) retries only Windows EACCES/EBUSY/EPERM up to …

**机制义务（提取要点；保留关键英文措辞）**：
- event-driven deferral for known startup races while preserving the permanent-failure signal. classify transient vs permanent at the narrowest shared primitive
- preserve atomicity and final state on exhaustion. On Windows exclusive-create EPERM is ambiguous because the holder can release before a later lstat
- withFileLock therefore allows exactly one unconfirmed EPERM retry per acquisition using the existing backoff/deadline
- rethrows a second unconfirmed failure
- keeps confirmed contention waiting

**计划验证**：TUI：未注册 provider 的 mount 静默 park，不相关 commit 不打印，route commit 到达后完成；target 变化清除 stale wait；detach 后 commit 不再重入。Windows 原子替换：注入 EACCES/EBUSY/EPERM，推进 fake timer，观察同一 temp sibling 与 caller lock 下最多八次重试（不把初次尝试算成重试），最终成功；其他 code/OS 立即失败；耗尽后移除 temp、重抛最终错误、target 不变。锁探测：holder 在 contender lstat 前释放时，一次 unconfirmed EPERM 重试成功；第二次 unconfirmed 失败重抛；confirmed contention 继续等待；POSIX 不变；不取代 credential-registration 写入串行化。证据状态：`planned`。

**机制特定失败/例外/证据限制**：三个独立子合同共享的只是分类主题，触发、owner、retry bound 与 recovery 不同；不得把一个子合同的证据、平台结论或重试次数搬到另一个。TUI deferral 只针对 context-window 的 `NO_ADAPTER` 启动竞态，不是所有 adapter error；atomic replace 只重试命名 Windows rename code；lock acquisition 只允许一次 unconfirmed EPERM，不是通用权限重试。POSIX 行为不变；持续的 Windows 权限失败可能在一次退避后才报告。此获取锁规则不取代现有凭据注册笔记对写入串行化的所有权。The source records unresolved, unverified or explicitly non-promised behavior; preserve it rather than upgrading it to a guarantee.

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-tui-adapter-registration-race.md:1-30@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-windows-atomic-replace-retry.md:1-28@687f282e`；`deepseek-harness/.agents/notes/archived/bug-fix/2026-09-14-windows-lock-release-probe.md:1-22@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-07-30-tui-adapter-registration-race.md:1-30@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-29-windows-atomic-replace-retry.md:1-28@687f282e
来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-09-14-windows-lock-release-probe.md:1-22@687f282e

<a id="two-stage-checkpoint-recovery"></a>
## 109. Two Stage Checkpoint Recovery

**机制 ID**：`rationale-bug-fix-2-two-stage-checkpoint-recovery`

**中文摘要**：设置→凭据两段保存，以设置成功响应为提交检查点（新 redacted 子树/revision），重试只重复凭据写入；空 key 物化无引用 profile；删除只删精确页。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Two-stage settings-then-credential save treats the successful settings response as commit checkpoint (new redacted subtree/revision) so retry repeats only the credential write; blank key materializes reference-free profile; deletion removes only the exact page-derived configured+writable reference, unsets credential before profile, both idempotent; ambiguous…

**机制义务（提取要点；保留关键英文措辞）**：
- make cross-store multi-stage operations resumable from a checkpoint instead of replaying committed stages
- Two-stage settings-then-credential save treats the successful settings response as commit checkpoint (new redacted subtree/revision) so retry repeats only the credential write
- blank key materializes reference-free profile
- deletion removes only the exact page-derived configured+writable reference, unsets credential before profile, both idempotent
- 设置成功后先用返回的 redacted descriptor 替换比较子树/revision，再 `credentials.set`；真正的并发变更仍报 `settings-conflict`。
- 删除保留 custom/environment/missing/unidentified credential；稳定显示身份为 `Display Name (route-id)`，对话框说明 key 是否移除并拥有失败。

**计划验证**：设置成功、credential 失败 → 草稿 key/card 保留，重试零 settings ops、仅 credential write；空 pi-ai key → 无 derived `apiKeyEnv`、native discovery 可用；精确 page-derived configured+writable 删除 → 先 credential 后 profile、两次幂等；stale revision 重试 → `settings-conflict` 而非 replay；custom/env/missing/unidentified → 拒绝删除并保留；设置后崩溃 → 已提交设置 + 可观察 pending 第二阶段，重试只补 credential，不 rollback；删除 settings-stage 失败 → row/frozen target 留待重试。证据状态：`planned`。

**机制特定失败/例外/证据限制**：设置与凭据两个 durable store 不是原子事务；进程崩溃可停在两段之间，但顺序与幂等让状态可观察、可重试，不能声称 rollback。没有 cross-domain transaction RPC。源 Note archived/implemented；当前代码绑定未验证，全部场景 planned。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-provider-credential-lifecycle.md:1-28@687f282e`

来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-provider-credential-lifecycle.md:1-28@687f282e

<a id="validation-layer-placement"></a>
## 110. Validation Layer Placement

**机制 ID**：`rationale-bug-fix-2-validation-layer-placement`

**中文摘要**：按认识论地位与爆炸半径放置不变量与启发式：字符集不变量在所有层，粘贴形状启发式只在浏览器；缺失是配置状态，不是无效；INVALID_CREDENTIAL 不进入可重试码。

**何时适用/前提**：当变更、迁移、事故或评审涉及该机制，或某个消费者准备重复、绕过、按形状推断这条规则时。核心触发事实：Place invariants and heuristics by epistemic status and blast radius: the printable-ASCII charset invariant runs at browser, resolvers and credential reads, while the paste-shape heuristic runs only in the browser because a resolver false positive would lock out a gateway.

**机制义务（提取要点；保留关键英文措辞）**：
- Put strict invariants at every layer that can enforce them.
- Keep heuristic/interpretive checks at the layer where a false positive is recoverable.
- Do not let a heuristic failure become a credential lockout or permanent rejection.

**计划验证**：`packages/llm/llm/tests/api-key.spec.ts` 覆盖 empty/whitespace-only/padded/interior-space/C0/emoji/CJK/full-width/latin-1/printable-ASCII 边界，并断言 `INVALID_CREDENTIAL` 且不含 key 片段；`packages/llm/llm-deepseek/tests/dynamic-config.spec.ts` 走真实 credentials seam 覆盖 stored-key；`packages/llm/llm-pi-ai/tests/` 覆盖 discovery probe，包括无 key probe 不发 `authorization`；`packages/client/ui-settings-models/tests/` 覆盖同一输入表与 paste-shape，blank 提交不写 credential，whitespace-only 在字段上失败，illegal/wrapped 阻止提交与 interrogation，padded 先 trim 再 `credentials.set`/interrogation，hand-declared route 可无 key 创建；`apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts` 用无法进 header 的 stored key 断言 `INVALID_CREDENTIAL`、可操作消息、不含 key 与 `ByteString`。证据状态：`planned`。

**机制特定失败/例外/证据限制**：缺失/空白是配置状态，不是无效值：省略 `apiKeyEnv` 的 profile 可走 provider-native ambient/OAuth；网页 blank 字段表示保留已存 key，必须可提交且不写 credential；仅 whitespace 的已解析值在两个 adapter 都是无效。paste-shape 启发式只在浏览器运行；resolver 假阳性会锁死 hand-declared gateway，环境变量是逃生通道。printable-ASCII 比 HTTP transport 更严格；latin-1 key 需要放宽规则，这是有意用本地可解释拒绝换 opaque 401。`INVALID_CREDENTIAL` 在 `DEFAULT_RETRYABLE_CODES` 之外且不回显 key。`credentials-local` 不承担此校验，因为 printable-ASCII 是 header 约束而非 credential-storage 约束。客户端不能 import host predicate，镜像 charset 规则并拥有本地化消息，两侧互相点名。缺失/非重试规则的所有权见 `rationale-bug-fix-2-secret-absence-nonretryable`；本机制不覆盖它。证据状态：`planned`。

**引用**：`deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-api-key-format-validation.md:1-102@687f282e`


来源：deepseek-harness/.agents/notes/archived/bug-fix/2026-08-06-api-key-format-validation.md:1-102@687f282e