# Package Contracts 4：包契约、seam 与执行边界参考

> 依据：deepseek-harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。
> 覆盖：本域分配的 54 个英文 README、53 个中文 counterpart、53 个 `.i18n.yaml` 侧车。
> 用途：让采用方在没有源仓 checkout 的情况下，仍能按触发场景落实包契约、边界、生命周期与评审义务。

## 0. 先读：证据等级与使用方式

本参考把三类内容分开，不得混用：

1. **源义务**：来自上述 README 正文的规则、默认值、错误码、所有权与限制。每条机制末尾给出实际读取的行范围。
2. **迁移设计**：写在“迁移设计（非源义务）”下，是把源规则移植到其他仓库时的建议，不是源仓已经强制的内容。
3. **额外建议**：本节的阅读顺序与落地清单，属于采用建议。

证据边界：
- README 的 Dev Note 在声明其为 working context 时是非权威的；本参考不把 Dev Note 当义务。少数 README 没有该声明，其正文仍按普通章节处理。
- `docs/config-catalog.md` 与 `docs/subsystems/*.md` 被多个包引用为“穷尽字段/子系统契约”，但不在本分区且未读取；本参考只声称 README 明示字段。
- 验证场景全部是 planned；没有安装、启动、网络、沙箱、MCP、Git、OAuth 或发布执行。
- 中英同权：两侧文件谁也不高于谁，约束是必须说同样的话（deepseek-harness/docs/i18n/README.md:9-9@687f282e；deepseek-harness/docs/i18n/README.zh.md:11-11@687f282e）。若两侧实质不一致，谁也不默认胜出，需修正错的一侧（deepseek-harness/docs/i18n/translation-rules.md:9-9@687f282e）。本参考逐文件核对（见 §4）；机制来源引用实际读取的正文行号，§4 的差异记录同时给两侧行号，不把任一侧当基准。

## 1. 按触发场景索引

| 你在做什么 | 先读 |
|---|---|
| `新增或调整 profile/bundle` / `为现有 profile 增加表面行` / `安装或移除 out-of-tree bundle` | [M01 · Profile bundle 的 patch 分层与组合契约](#package-contracts-4.profile-bundle-composition) |
| `新增服务提供者或执行器` / `替换 backend/engine` / `组合一个依赖某 ctx 服务的包` | [M02 · 能力 seam 的单一所有者与显式依赖](#package-contracts-4.service-seam-single-owner) |
| `新增共享工具包` / `判断某包应注册服务还是提供纯函数` / `移动业务语义到 util` | [M03 · 包角色、library 边界与业务语义归属](#package-contracts-4.package-role-and-library-boundary) |
| `新增 experimental 包` / `把实验 bundle 放入产品` / `决定默认开启/关闭` | [M04 · 实验包状态、默认关闭与晋升门槛](#package-contracts-4.experimental-status-opt-in-and-promotion) |
| `引入或升级 vendor 包` / `新增平台原生包` / `使用 timer、interval 或子进程句柄` | [M05 · vendor 与平台包的边界：无构建、随宿主生命周期释放](#package-contracts-4.vendor-and-platform-package-boundary) |
| `采集插件清单或诊断元数据` / `新增 Loader 插件` / `包升级或 manifest 变更` | [M06 · 运行时插件身份与包清单的尽力而为边界](#package-contracts-4.runtime-package-inventory) |
| `新增工具` / `增加 allow/deny/ask 策略` / `替换或包装工具结果` | [M07 · 工具注册、执行管线与单调策略护栏](#package-contracts-4.tool-registration-and-policy) |
| `工具返回可能超长的列表或文本流` / `增加 spill 文件或预览截断` / `设计模型可见的省略提示` | [M08 · 有界输出与“省略”诚实性](#package-contracts-4.output-retention-honesty) |
| `接入 MCP 服务器` / `服务器工具列表变更` / `重连或崩溃恢复` | [M09 · MCP 桥接的工具身份、整代同步与重连边界](#package-contracts-4.mcp-bridge-identity) |
| `选择 bash/pwsh 执行器或持久 shell` / `配置预算/超时` / `处理后台进程` | [M10 · 一次性/持久 shell 与终端后端的执行契约](#package-contracts-4.shell-execution-contracts) |
| `选择 sandboxing 执行器` / `无可用 runner` / `命令被拒绝` | [M11 · 沙箱执行器的 fail-closed、拒绝事实与单次提权](#package-contracts-4.sandbox-fail-closed-and-escalation) |
| `实现/组合文件写入或编辑工具` / `处理并发写与 stale 覆盖` / `配置 cwd/base directory` | [M12 · 文件变更的读前策略、版本防护与原子发布](#package-contracts-4.filesystem-mutation-integrity) |
| `创建或进入 worktree` / `隔离实验或并行任务` / `Git 过滤器、LFS 或部分克隆` | [M13 · Worktree 隔离创建、沙箱约束与保留语义](#package-contracts-4.worktree-isolation-and-retention) |
| `新增/替换 workflow engine` / `编写或调用 workflow 脚本` / `评估脚本隔离与资源上限` | [M14 · 工作流引擎的 holder-owned run 与沙箱执行边界](#package-contracts-4.workflow-engine-and-confinement) |
| `设置默认 provider/model` / `实现 selectModel 或模型设置页` / `排查“为什么这个 Session 换模型了”` | [M15 · 默认模型只填空、会话选择不回溯](#package-contracts-4.model-selection-and-session-pin) |
| `选择子代理后端` / `请求 agentPreset/agentOptions/outputSchema/depth` / `新增 provider` | [M16 · 子代理提供者的能力协商与拒绝而非静默省略](#package-contracts-4.subagent-capability-negotiation) |
| `委派到 ACP/Claude Code/Harness SDK 子进程` / `设计完成通知与诊断` / `排查子代理失败` | [M17 · 外部子代理的隔离与父级结果边界](#package-contracts-4.subagent-isolation-and-result-boundary) |
| `模型需要解释相对或未限定日期` / `配置 time-context` / `多时区或混合请求` | [M18 · 时钟上下文注入：按步、追加、可解释缺失](#package-contracts-4.time-context-injection) |
| `写入 durable 记录或事件` / `接受调用方时区` / `发布配置/快照给消费者` | [M19 · 持久值的无损 JSON、规范时区与快照/克隆](#package-contracts-4.durable-value-canonicalization) |
| `实现列表/搜索/历史预览` / `恢复或创建 Session` / `UI retain 子代理` | [M20 · Session 冷读不激活与单写者所有权](#package-contracts-4.session-activation-and-write-ownership) |
| `暴露 Remote 流或命令` / `新增模型侧查询/终止工具` / `多浏览器/多标签访问` | [M21 · Remote 访问控制、owner fence 与受信 seam 的授权责任](#package-contracts-4.trusted-seam-authorization-delegation) |
| `实现登录/凭证编辑` / `配置第三方 API key` / `处理 OAuth 回调或远程 token` | [M22 · 凭据来源、写-only 存储与 Origin 绑定](#package-contracts-4.credential-origin-and-secret-boundary) |
| `实现聊天与历史投影` / `本地提交与回声` / `热重载或换页` | [M23 · 客户端投影、局部回声与页面级故障边界](#package-contracts-4.client-projection-and-live-ownership) |
| `接入搜索、抓取或翻译等外部 API` / `映射供应商结果到统一模型` / `处理无答案或空字段` | [M24 · 外部提供者的原生结果、可移植片段与诚实缺失](#package-contracts-4.external-provider-provenance) |
| `发布或更新测试 feed` / `上传安装包与 blockmap` / `处理发布锁或失败恢复` | [M25 · 已安装产物发布的分离授权与证据链](#package-contracts-4.installed-artifact-test-provenance) |

按角色：
- 组合/插件/bundle 作者：§2A。
- 工具、shell、sandbox、文件、worktree、workflow 作者：§2B。
- 模型路由、子代理 provider、上下文注入：§2C。
- Session/Remote/凭据/安全评审：§2D。
- 外部 provider、发布与审计：§2E。
- 中文维护与侧车：§4。

关键标识速查：

| 标识 | 含义 |
|---|---|
| `dsh.bundle.patch` | bundle 声明的 patch 列表；按顺序叠加成具名 profile |
| `dsh-base` / `sdk-minimal` | 完整运行树 / 最小 SDK 树 |
| `dsh plugin --profile <name> add <package>` | 树外 bundle 安装入口 |
| `mcp__<server>__<tool>` | MCP 工具稳定公开名；serverName 为本地配置命名空间 |
| `tools/pre-execute` → guard → `tools/execute` → `tools/post-execute` | 工具执行固定管线 |
| `fs/write-intent` / `fs/edit-intent` / `fs/observed` | 文件 mutation 的策略与观察事件 |
| `FS_STALE_VERSION` / `FS_EDIT_NOT_FOUND` / `FS_AMBIGUOUS_EDIT` | 版本过期 / 无匹配 / 多重匹配 |
| `ABORTED_BEFORE_DISPATCH` | dispatch 前取消；dispatch 后为 `ABORTED` |
| `SANDBOX_UNAVAILABLE` | confined 模式无 runner，必须 fail closed |
| `[Command finished with exit code N]` / `[Command timed out or OOM]` | 持久命令结束/超时标记 |
| `session/writer-held` / `session/conflict` / `session/agent-busy` | 写者占用 / 目录冲突 / 子代理占用 |
| `job/not-found` | Session 看不到该 job；不泄露存在性 |
| `settings/conflict` | 设置 revision 冲突 |
| `WEB_PROVIDER_ERROR` / `WEB_ABORTED` | 外部搜索失败 / 中止 |
| `dsh_plugin_packages` | 运行时插件包清单字段（provider metadata） |
| `EXA_API_KEY` | Exa key 的环境回退名 |
| `DSH_PLATFORM_ORIGIN` | 私有 patch 中 Platform Origin 的环境变量 |
| `refreshIntervalMs=600000` | 时钟上下文默认 10 分钟抑制窗口 |
| `publication.lock` / `UPLOAD <version> <run-id>` / `PUBLISH <version> <run-id>` | 发布互斥与交互确认串 |
| `.agents/worktrees/<name>` | worktree 默认目录；pool 内含 `.gitignore` |
| `GIT_NO_LAZY_FETCH` | 防止部分克隆隐式拉取；需 Git 2.45 或指定维护版本 |
| `cancelled by the user` | 人工 kill 的原因；不抑制模型完成通知 |
| `session/wait` | SDK 子代理运行时必须实现的协议能力 |

## 2. 机制详解

## 2.A 组合、角色与依赖边界

### M01 Profile bundle 的 patch 分层与组合契约 {#package-contracts-4.profile-bundle-composition}

**问题**：同一份安装要服务 Web、headless、ACP、SDK 等不同表面，若每个表面复制完整插件树或在运行时随意改写配置，组合会漂移、重复挂载或丢失行配置。

**何时读**：
- 新增或调整 profile/bundle
- 为现有 profile 增加表面行
- 安装或移除 out-of-tree bundle
- 修改 preset 或 patch 顺序

**必须做到（源义务）**：
1. 每个 bundle 包必须声明 dsh.bundle.patch；launcher 按声明顺序堆叠 patch 文档来组装命名 profile。
2. web、headless、acp、sdk 等 profile 以 dsh-base 为基础；sdk-minimal 自带完整树，不依赖 base 或 Web。
3. patch 替换目标行的整个 config，因此每一行必须重述它拥有的全部键；新增行使用 insert，不能假设未写的键会继承。
4. presets/<id>.patch.yml 按 dsh.bundle.patch 顺序应用；后应用 profile patch 可按 id 覆盖先前行，profile composer 负责顺序与错误。
5. in-box bundle 从 dsh 安装解析；out-of-tree bundle 只能经 dsh plugin --profile <name> add <package> 装入 profile。
6. 启用 Profile Bundle 会安装对应目标并选中其 profile 层；切换 Off 只取消选择并保留包，Remove 是独立操作。
7. 同一组合中同一服务只能有一个实现；重复注册在加载期失败，而不是后者静默覆盖。
8. patch 的 replace 替换目标行的整个 config，因此该行必须重述它拥有的全部键；insert 只用于新增行。Web 的 Host/Origin fence 由 listener bind IP 与 trustedHosts 共同决定，TLS 只改变传输、不改变 authority。

**角色**：bundle 维护者、profile 作者、安装/运维操作者、评审者

**操作步骤**：
1. 先确定目标表面与基础 profile，列出需要新增、禁用或重述的行。
2. 在 bundle 包中声明 dsh.bundle.patch 顺序，并为每个被替换的行写出完整 config。
3. 用 insert 增加表面专属 host 行、transport 或 browser roster；把 agent 平面的差异放进 preset patch。
4. 在加载期验证重复服务与依赖缺失会显式失败；核对 in-box 与 out-of-tree 的解析路径。
5. 对启用/停用路径分别验证：启用安装并选中层，停用取消选择但保留包，移除单独执行。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-composition-plus-review`。实现：launcher/bundle installer 按 dsh.bundle.patch 堆叠 patch 并在加载期执行服务注册；README 把顺序、整行替换与 in-box/out-of-tree 路径规定为包契约。 可验证性：需要实际加载组合并观察重复注册/缺依赖失败；README 声明本身不能证明某个 profile 的最终行集。 失败模式：漏写被替换行的键会静默丢失配置；重复服务若未在加载期失败，会在运行时产生不确定的提供者。 例外：sdk-minimal 是完整树例外，不依赖 dsh-base；domain 包可在本目录外声明额外层。

**适用范围**：适用于任何以 patch 文档分层组装的 profile 组合。 若采用方没有 bundle/profile 机制，可保留“整行替换、显式新增、重复注册失败”的组合原则，而不照搬这些包名。

**相关机制**：
- 与 [service-seam-single-owner](#package-contracts-4.service-seam-single-owner) 共享“重复服务失败”约束。
- 文档形态由 documentation 域的包 README 机制约束。

**迁移设计（非源义务，采用时可选）**：
- 策略：把 profile 视为可审计的 patch 序列：先声明顺序，再逐行完整化，再用加载期失败暴露重复与缺失。
- 实施：在采用方建立 bundle 清单与 patch 顺序检查；对每个 profile 保存最终行集快照，变更时 diff 行与 config。
- 需要：launcher 按声明顺序应用 patch、加载期重复服务检测、安装/卸载的独立状态模型

**验证计划（status: planned；未执行）**：
- **正向**：新增一个 profile 行时，patch 中被替换的行写全 config，加载后服务唯一且行为符合预期。（planned）
- **正向**：停用一个已安装 bundle：层被取消选择、包仍存在，后续重新启用可恢复。（planned）
- **拒绝**：同一组合挂载两个 ctx.shell 执行器，或同一 scope 内重复 serverName。 → 加载期显式失败并指出冲突行。（planned）
- **拒绝**：patch 只写想改的键，期待其余键继承。 → 评审拒绝；整行 config 已被替换，缺键即缺配置。（planned）
- **恢复**：修复重复注册后重新加载；对已停用 bundle 重新选择层并验证工具/行恢复。（planned）

**已知限制**：本机制不证明某个 profile 的最终行集正确，只规定组装与失败方式。 各表面 bundle 的实际行清单未在本域完整枚举。

**源证据**：
- `deepseek-harness/packages/bundle/README.md:10-34@687f282e`（instruction）
- `deepseek-harness/packages/bundle/web-app/README.md:96-133@687f282e`（instruction）
- `deepseek-harness/packages/experimental/session-search/README.md:37-50@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-claude-code/README.md:26-58@687f282e`（instruction）
- `deepseek-harness/packages/preset/README.md:10-13@687f282e`（instruction）

---

### M02 能力 seam 的单一所有者与显式依赖 {#package-contracts-4.service-seam-single-owner}

**问题**：多个提供者同时注册同一 ctx 服务会让消费方看到不确定实现；缺少必需服务时若静默降级，会把配置错误推迟到首次请求。

**何时读**：
- 新增服务提供者或执行器
- 替换 backend/engine
- 组合一个依赖某 ctx 服务的包
- 排查加载期或首次调用失败

**必须做到（源义务）**：
1. 一个组合中每个能力 seam 只允许一个实现；重复服务注册必须在加载期大声失败。
2. 需要某服务的包必须在加载前确认该服务存在；缺失时显式失败，而不是在请求期静默省略能力。
3. 提供者在注册 scope 内使用唯一名称；同一 scope 的重名（如 MCP serverName、subagent providerName）在加载期失败。
4. 服务本身不承担跨提供者协调或回退：例如 session-query 只定义抽象搜索，必须挂载具体 backend。
5. observe-only 事件只提供快照，不得让监听者取得取消、处置或替换实现的权限。

**角色**：组合作者、提供者作者、评审者

**操作步骤**：
1. 列出该 seam 的消费方与提供者，确认谁拥有服务键。
2. 在加载期验证唯一注册；删除或合并重复提供者。
3. 为缺失依赖添加显式失败路径，并让错误指出缺失的服务/行。
4. 验证 observe-only 事件无法改变执行所有权。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-load-time`。实现：Cordis 服务注册与各包加载逻辑；README 把“第二个实现/重名失败”写成契约。 可验证性：加载器实际运行才能证明重复注册会失败；静态 README 与目录结构不构成证明。 失败模式：静默覆盖会让同一命令路由到不同实现，配置与权限语义随之改变。 例外：独立 Agent scope 可以复用同一 serverName 命名空间，因为工具与 transport 隔离；这不是同一 scope 重复。

**适用范围**：适用于所有以 ctx 服务为 seam 的组合。 采用方若无服务容器，仍需保留“唯一所有者 + 缺失即失败 + 无隐式回退”的可执行检查。

**相关机制**：
- 与 [profile-bundle-composition](#package-contracts-4.profile-bundle-composition)、[subagent-capability-negotiation](#package-contracts-4.subagent-capability-negotiation) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把 seam 所有权写成可加载断言：每个服务键恰好一个提供者，缺少依赖在启动期失败。
- 实施：在组合测试中断言注册表大小与重名错误；对每个 profile 记录实际提供者。
- 需要：服务注册表/加载期校验、启动失败可观测、每个 profile 的提供者清单

**验证计划（status: planned；未执行）**：
- **正向**：每个 profile 只注册一个执行器/引擎/backend，启动后消费方解析到预期实现。（planned）
- **拒绝**：同时挂载两个引擎或两个同名 provider。 → 加载期失败并命名冲突键。（planned）
- **拒绝**：缺少必需服务时尝试降级运行。 → 启动失败，而非请求期静默缺功能。（planned）
- **恢复**：移除重复提供者或改名后重新加载；确认消费方仍解析到唯一实现。（planned）

**已知限制**：未执行真实 Loader 组合；失败时点与消息以各包文档表述为准。

**源证据**：
- `deepseek-harness/packages/shell/README.md:10-42@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow/README.md:62-97@687f282e`（instruction）
- `deepseek-harness/packages/session-query/session-query/README.md:26-69@687f282e`（instruction）
- `deepseek-harness/packages/mcp/mcp-client/README.md:73-82@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-acp/README.md:34-62@687f282e`（instruction）

---

### M03 包角色、library 边界与业务语义归属 {#package-contracts-4.package-role-and-library-boundary}

**问题**：共享工具若注册服务或持有业务状态，会与能力包争夺所有权；把 library 当插件挂载也会制造隐藏生命周期。

**何时读**：
- 新增共享工具包
- 判断某包应注册服务还是提供纯函数
- 移动业务语义到 util
- 评审包角色与依赖方向

**必须做到（源义务）**：
1. util 组的根条目是 library：不注册产品服务或事件，不持有 ctx；消费它的能力包保留业务语义。
2. library 必须可在 Host 与浏览器安全使用（若声明 browser-safe），零依赖，仅从参数派生结果。
3. package-group README 只做家族映射与包角色说明；完整服务契约由对应子系统/包 README 拥有。
4. 需要 Cordis 挂载配置的包必须明确它是插件；library 不得要求挂载。
5. 平台包（native）只提供预构建 payload，不携带 JavaScript 或安装构建脚本。

**角色**：包作者、组合作者、评审者

**操作步骤**：
1. 先判断职责：纯计算/数据结构/编解码 → library；持有服务、事件或生命周期 → 插件。
2. 对 library 检查是否 import ctx、是否注册服务、是否有进程/浏览器状态。
3. 把业务错误、容量、重试、取消与恢复留给消费方；library 只提供机械不变量。
4. 在包 README 中写明“library, not a service or plugin”及不变量。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`review-plus-package-shape`。实现：包形态/导出与依赖方向检查属于工程域；本组 README 以“无 ctx、无注册、无状态”表述 library 契约。 可验证性：需要检查源码 import 与包导出，而不是只看 README 标题。 失败模式：library 注册服务会造成重复挂载与隐式生命周期；业务语义进入 util 会让多个消费方对同一错误给出不同解释。 例外：平台包是无 JS 的二进制 payload 例外；bundle 组是 patch-only，不注册服务。

**适用范围**：适用于共享工具、平台包与包家族映射。 若采用方没有 Cordis，仍适用“纯库不拥有业务生命周期”的划分。

**相关机制**：
- 与 [profile-bundle-composition](#package-contracts-4.profile-bundle-composition) 的 bundle/patch-only 角色互补。
- 与 [durable-value-canonicalization](#package-contracts-4.durable-value-canonicalization) 共享无状态值处理原则。

**迁移设计（非源义务，采用时可选）**：
- 策略：先按“是否拥有服务/生命周期”划分包角色，再决定导出与依赖方向。
- 实施：在评审清单中加入 library 禁用项（ctx 注册、全局状态、业务重试），并用包导出/依赖检查验证。
- 需要：包角色分类、依赖方向检查、README 角色声明

**验证计划（status: planned；未执行）**：
- **正向**：新增 util library 不注册服务、不读 ctx；消费包保留错误与容量语义。（planned）
- **拒绝**：在 util 包中注册 ctx 服务或引入业务重试/失败策略。 → 评审拒绝并要求把服务/业务语义移回能力包。（planned）
- **恢复**：把误放的服务注册移回能力包，util 仅保留纯函数与数据结构。（planned）

**已知限制**：未逐包检查源码 import；角色判断依据 README 与包形态声明。

**源证据**：
- `deepseek-harness/packages/util/README.md:10-50@687f282e`（instruction）
- `deepseek-harness/packages/util/crypto/README.md:25-31@687f282e`（instruction）
- `deepseek-harness/packages/util/deque/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/plan/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/session/session-format-v3-to-v4/README.md:41-66@687f282e`（instruction）
- `deepseek-harness/native/system/packages/linux-arm64/README.md:1-11@687f282e`（instruction）

---

### M04 实验包状态、默认关闭与晋升门槛 {#package-contracts-4.experimental-status-opt-in-and-promotion}

**问题**：实验能力若默认出现在产品中或暗示稳定 API，采用方会把可自由变更的契约当成兼容承诺；晋升若只看“能用”会绕过证据与所有权。

**何时读**：
- 新增 experimental 包
- 把实验 bundle 放入产品
- 决定默认开启/关闭
- 申请晋升为稳定包

**必须做到（源义务）**：
1. 实验包必须公开声明 experimental、无稳定性承诺，并明确需要显式挂载/选择才生效。
2. 实验 bundle 在 Web/Desktop 默认关闭；启用与停用应在运行中的 Host 注册/移除其全局工具，使所有 preset 在下一次请求看到变化。
3. 晋升必须评审：公开契约、限制、测试证据、发布 payload、运行时依赖方，以及具名稳定 owner；按 experimental 子树规则执行。
4. 实验包不得被宣传为默认产品能力或稳定 API；实验记录（plugin records）按实验契约保留，可能随格式迁移丢失。

**角色**：实验包作者、发布/产品维护者、评审者、具名稳定 owner

**操作步骤**：
1. 在 README 与安装面标注实验状态、默认关闭与显式启用方式。
2. 验证启用/停用对运行中 Host 与所有 preset 的实际影响，并记录缓存前缀失效一次等模型可见代价。
3. 准备晋升证据包：契约、限制、测试、发布 payload、依赖方、owner。
4. 由评审者按检查表逐项确认后才改变状态；未满足项保持实验并记录。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`review-plus-installation-default`。实现：安装/Plugins 选择面与包 README 的状态声明；晋升依赖 experimental 子树评审规则，本组 README 复述检查项。 可验证性：需要实际安装面与 bundle 选择状态；README 的 experimental 字样不能证明默认关闭。 失败模式：默认开启会让用户在未知风险下使用可变更契约；无 owner 的晋升会让后续破坏无人负责。 例外：已发布但按 experimental 处理的包仍可有公开文档与测试；状态不等于不可用。

**适用范围**：适用于 experimental 目录与任何标记 experimental 的 bundle。 采用方若没有实验目录，仍可用“默认关闭 + 显式启用 + 晋升检查表”治理。

**相关机制**：
- 与 engineering 的 experimental-isolation 机制、rationale-feature-3 的 gate-default-off 机制主题重叠；本机制只记录 README 所载门槛。
- 与 [runtime-package-inventory](#package-contracts-4.runtime-package-inventory) 的运行时启停相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把“实验状态”做成安装默认值与评审门槛，而不是文案标签。
- 实施：在安装清单中默认关闭实验 bundle；晋升时建立证据包与具名 owner，并验证启用/停用路径。
- 需要：安装面默认值、bundle 启停机制、晋升检查表与 owner 记录

**验证计划（status: planned；未执行）**：
- **正向**：实验 bundle 默认关闭；用户显式启用后工具出现，停用后移除。（planned）
- **拒绝**：把实验 bundle 设为默认开启，或在无 owner/证据时晋升。 → 评审阻断并保持实验状态。（planned）
- **恢复**：补默认关闭、限制说明与证据包后重新评审。（planned）

**已知限制**：未执行安装/Plugins 面；experimental 子树的完整规则由其他域负责，本机制只复述 README 明示部分。

**源证据**：
- `deepseek-harness/packages/experimental/agent-team/README.md:194-225@687f282e`（instruction）
- `deepseek-harness/packages/experimental/session-search/README.md:26-36@687f282e`（instruction）
- `deepseek-harness/packages/experimental/terminal-bundle/README.md:26-34@687f282e`（instruction）
- `deepseek-harness/packages/experimental/translator/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/experimental/browser-use-chrome-devtools-mcp/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/experimental/client-ui-agent-team/README.md:10-13@687f282e`（instruction）

---

### M05 vendor 与平台包的边界：无构建、随宿主生命周期释放 {#package-contracts-4.vendor-and-platform-package-boundary}

**问题**：把第三方代码当成本仓治理对象，或让平台包带安装脚本或 JS 包装，会让供应链与构建行为脱离审查；计时器或句柄若不属于创建它的 fiber，插件卸载后仍会触发。

**何时读**：
- 引入或升级 vendor 包
- 新增平台原生包
- 使用 timer、interval 或子进程句柄
- 审计第三方许可与构建脚本

**必须做到（源义务）**：
1. vendor 包只提供其上游 API 与生命周期语义，不额外声明本仓治理规则；引用时按依赖而非本地实现处理。
2. 平台包可以只含预编译二进制与 Node-API addon，不含 JavaScript 或安装 build script；prepack 校验完整载荷、ELF 架构、导出与可执行性。
3. 计时器、interval、throttle、debounce 句柄注册在创建它的 fiber 上，插件 dispose 时自动清除；使用方不得把句柄泄漏到更长生命周期。
4. 进程与原生句柄的取消与释放遵循创建者所有权；平台包行为验证属于 installed-artifact rehearsal，不是单元 mock。

**角色**：依赖维护者、平台包作者、评审者

**操作步骤**：
1. 把 vendor 内容与自研代码分开分类，记录来源与许可，不套用本地机制。
2. 平台包只发布运行所需二进制；用 prepack 与安装后 rehearsal 验证字节与行为。
3. 对每个 timer 或 handle 确认所属 fiber 与 dispose 清理。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`packaging-boundary-plus-runtime-lifecycle`。实现：vendor/timer 的 fiber 注册、native linux-arm64 的无脚本载荷与 prepack rehearsal 校验。 可验证性：需要安装产物与真实平台运行；README 不能证明二进制架构或清理。 失败模式：带安装脚本的平台包会在安装时执行未审查代码；未绑定 fiber 的 timer 会在卸载后触发。 例外：vendor 包的 bug 与限制由上游负责；本仓只记录使用约束。

**适用范围**：适用于任何 vendor 目录与预编译平台包。 采用方可用不同 timer，但必须保留创建者 fiber 拥有句柄。

**相关机制**：
- 与 [runtime-package-inventory](#package-contracts-4.runtime-package-inventory) 的包身份相关。
- 与 [installed-artifact-test-provenance](#package-contracts-4.installed-artifact-test-provenance) 的字节验证相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把第三方与平台内容隔离为依赖边界，并用安装产物验证替代源码假设。
- 实施：在打包清单中排除构建脚本；对 timer 写 dispose 后不触发测试；对平台包写架构与执行 smoke。
- 需要：包分类、prepack 校验、fiber 生命周期

**验证计划（status: planned；未执行）**：
- **正向**：插件 dispose 后其 timeout 或 interval 不再触发；平台包不含 JS 与安装脚本。（planned）
- **拒绝**：平台包添加 postinstall 构建步骤，或 timer 句柄注册到全局 root。 → 评审拒绝；越过平台与生命周期边界。（planned）
- **恢复**：把句柄迁回创建 fiber；移除安装脚本并以预编译载荷发布。（planned）

**已知限制**：未执行安装或原生 smoke；平台支持矩阵在源仓 docs/support-matrix.md。

**源证据**：
- `deepseek-harness/vendor/timer/README.md:5-23@687f282e`（instruction）
- `deepseek-harness/vendor/timer/README.md:24-36@687f282e`（instruction）
- `deepseek-harness/native/system/packages/linux-arm64/README.md:1-11@687f282e`（instruction）

---

### M06 运行时插件身份与包清单的尽力而为边界 {#package-contracts-4.runtime-package-inventory}

**问题**：把程序化 child fiber、内存插件或缺少 manifest 的模块伪造成 npm 包身份，会把诊断数据变成猜测；若清单失败阻塞请求，又会让观测能力反噬主路径。

**何时读**：
- 采集插件清单或诊断元数据
- 新增 Loader 插件
- 包升级或 manifest 变更
- 排查清单缺项

**必须做到（源义务）**：
1. 清单只包含 Loader 树中 root fiber 为 ACTIVE 且 effective state 启用的非 group 条目；disabled、pending、failed、disposed、unloading、cordis 结构行、普通依赖、无包身份的 loose 文件、程序化 child fiber 与内存动态插件排除。
2. 身份解析用权威运行时解析（PluginPackages）而非 package.json 导出；服务缺失时回退 Node 包搜索并保持该选择到进程结束，不中途切换。
3. 每个条目用其所属 Loader 树 base；standing preset 的 root 用 harness base；相对或绝对模块走到最近 manifest；manifest 无 name 则省略；无效 version 产生 name-only 条目。
4. 解析、manifest 或 JSON 失败只省略该条目并记一条警告；清单不得阻塞模型请求。
5. 按 name 去重；字段为 name 与可选 version，version 仅当非空字符串。
6. manifest 身份在进程生命周期内缓存；同进程替换已挂载包的 manifest 不受支持，需要重启。
7. 条目按 name 与可选 version 去重并以 locale-independent 比较排序；name-only 排在同名 versioned 之前，不同 version 保持分开。

**角色**：清单插件作者、Loader 与组合维护者、评审者

**操作步骤**：
1. 明确清单是 best-effort 诊断，不是授权或依赖完整性证明。
2. 在启动时采样 resolver；在组合顺序中让它先于 Loader 条目与本插件。
3. 为排除项与 name-only 或省略规则写断言。
4. 记录进程内不可变身份的升级限制。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`best-effort-runtime-metadata`。实现：plugin-package-inventory-deepseek 的 Loader 遍历、resolver 采样、manifest 读取与去重。 可验证性：需要构造各种 fiber 与 manifest 状态；README 不能证明排除规则完整。 失败模式：把无身份插件伪造成包会导致诊断误导；清单失败抛错会阻塞请求。 例外：清单可以部分缺失；这是明确允许的 best-effort。；进程内替换 manifest 不支持。

**适用范围**：适用于需要上报运行时插件身份的产品。 采用方若没有 Loader 树，仍应保留只报权威身份、失败不阻塞。

**相关机制**：
- 与 [vendor-and-platform-package-boundary](#package-contracts-4.vendor-and-platform-package-boundary) 共享包身份边界。
- 与 [client-projection-and-live-ownership](#package-contracts-4.client-projection-and-live-ownership) 的不伪造状态一致。

**迁移设计（非源义务，采用时可选）**：
- 策略：把清单定义为可选诊断投影，明确包含、排除与失败策略。
- 实施：为每个排除类别写 fixture；验证解析失败只产生警告；验证请求不依赖清单。
- 需要：Loader 树、运行时 resolver、manifest 读取

**验证计划（status: planned；未执行）**：
- **正向**：禁用、失败或内存插件不出现在清单；无效 version 只报 name。（planned）
- **正向**：一个 manifest 解析失败只省略该条目并记一条警告。（planned）
- **拒绝**：为程序化 child fiber 编造 name 与 version。 → 评审拒绝；应排除。（planned）
- **拒绝**：清单解析错误导致模型请求失败。 → 指出 metadata 不得阻塞请求。（planned）
- **恢复**：修复 manifest 后重启以刷新身份缓存；缺失条目按 best-effort 接受。（planned）

**已知限制**：未运行 Loader；排除规则以源码为准。

**源证据**：
- `deepseek-harness/packages/llm/plugin-package-inventory-deepseek/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/llm/plugin-package-inventory-deepseek/README.md:34-44@687f282e`（instruction）
- `deepseek-harness/packages/llm/plugin-package-inventory-deepseek/README.md:61-78@687f282e`（instruction）

## 2.B 工具、执行与文件边界

### M07 工具注册、执行管线与单调策略护栏 {#package-contracts-4.tool-registration-and-policy}

**问题**：工具参数、权限决定与结果内容若没有固定顺序，插件可以在拒绝之后重新放行、在日志与执行之间改写参数，或把 canonical value 与模型可见内容混为一谈。

**何时读**：
- 新增工具
- 增加 allow/deny/ask 策略
- 替换或包装工具结果
- 排查“为什么被拒绝又执行”或参数不一致

**必须做到（源义务）**：
1. 工具必须用 defineTool 声明类型化参数、输出与 execute；模型参数在执行前校验，非法输入作为普通错误结果返回。
2. 执行管线顺序固定：tools/pre-execute（可扩展 allow/deny/ask）→ 单调 guard → tools/execute 包装 → tools/post-execute → finalizeContent → 只读 tools/result。
3. guard 是单调的：返回原因即拒绝，后续监听者不得把拒绝改回许可。
4. pre-execute 不得改写 exec.arguments；已记录/渲染的参数必须与实际执行一致。
5. 只有 tools/execute 视图可替换必需 signal，registry 在调用 body 前重新融合调用方 signal；取消必须协作且静默。
6. canonical value 属于执行侧；Session 记录渲染内容与可选展示元数据。要禁止程序化访问 canonical value 的策略必须阻断执行或替换该值，不能只删除展示内容。
7. 工具定义的 timeoutMs 只是声明，registry 不强制截止时间；需要强制时使用 timeout policy 包装。
8. per-agent restrict 掩码取交集；scoped 注册保持可见；dispose 后限制解除。
9. PTC run_code 的 timeoutMs 默认 120,000ms、上限 600,000ms（含嵌套工具与审批等待）；sandbox_permissions 提权要求非空 justification 并在程序启动前批准，仅对该次执行有效；被拒绝程序不得自动重放，standing policy 与嵌套工具保留自己的权限。

**角色**：工具作者、策略插件作者、组合/预设作者、评审者

**操作步骤**：
1. 用 defineTool 声明 schema 与 canonical output；不要在 execute 之外假设参数已校验。
2. 决定策略放置：pre-execute 做可重排的 allow/deny/ask，guard 做不可撤回的 owner 策略，execute 包装做超时/重试，post-execute 做内容替换。
3. 检查取消：body 必须观察 exec.signal；区分 dispatch 前取消与 dispatch 后取消。
4. 若策略必须阻止 canonical 访问，实施执行阻断或值替换，并验证展示删除不构成阻断。
5. 用 restrict 验证交集语义与 dispose 后恢复。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-pipeline`。实现：ToolRuntime 的固定调用管线、guard 单调性、signal 重新融合与 schema 校验。 可验证性：需要执行真实工具调用并观察事件顺序；README 不能证明某插件的 guard 实现。 失败模式：可重排的拒绝会被后续监听者翻转；参数改写会让日志与实际执行不一致；只删展示内容会留下可被程序读取的原值。 例外：MCP 等外部工具经同一 registry 注册，继承管线；未知/抛错工具按错误结果处理。

**适用范围**：适用于所有模型可见工具与程序化工具调用。 采用方若没有事件管线，仍需保留“参数不可在执行前改写、拒绝单调、canonical 与展示分离”。

**相关机制**：
- 与 [output-retention-honesty](#package-contracts-4.output-retention-honesty) 共享结果内容边界。
- 与 [mcp-bridge-identity](#package-contracts-4.mcp-bridge-identity)、[model-selection-and-session-pin](#package-contracts-4.model-selection-and-session-pin) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把工具契约拆成 schema、策略、执行、内容四层，并用固定顺序与单调性保证审计一致。
- 实施：为管线每一阶段写契约测试：拒绝不可翻转、参数不可改写、取消可观察、canonical 阻断必须发生在执行层。
- 需要：类型化 schema 与校验、固定管线与 guard、canonical value 与展示分离

**验证计划（status: planned；未执行）**：
- **正向**：guard 拒绝后，后续 post-execute 监听者无法重新放行；调用返回拒绝结果。（planned）
- **正向**：pre-execute 试图改写参数时保持原参数执行，日志与执行一致。（planned）
- **拒绝**：只在 post-execute 删除展示内容，却仍允许程序读取 canonical value。 → 评审拒绝；必须阻断执行或替换值。（planned）
- **拒绝**：定义 timeoutMs 后假设 registry 会强制超时。 → 指出超时需 timeout policy 包装。（planned）
- **恢复**：把可翻转策略改为 guard 或执行阻断，并重新验证事件顺序。（planned）

**已知限制**：未运行工具管线或内存中的策略测试；具体错误码以源码与子系统参考为准。

**源证据**：
- `deepseek-harness/packages/core/tools/README.md:32-65@687f282e`（instruction）
- `deepseek-harness/packages/core/tools/README.md:87-92@687f282e`（instruction）
- `deepseek-harness/packages/core/tools/README.md:100-147@687f282e`（instruction）
- `deepseek-harness/packages/core/tools/README.md:225-250@687f282e`（instruction）
- `deepseek-harness/packages/fs/tool-str-replace-editor/README.md:60-85@687f282e`（instruction）
- `deepseek-harness/packages/shell/tool-bash-persistent/README.md:66-94@687f282e`（instruction）
- `deepseek-harness/packages/core/agent-tool-presentation/README.md:48-54@687f282e`（instruction）

---

### M08 有界输出与“省略”诚实性 {#package-contracts-4.output-retention-honesty}

**问题**：工具为控制上下文而截断结果时，若不精确报告被丢弃的内容，模型会把不完整结果当完整；把权限失败或上游不完整混入截断标记会污染语义。

**何时读**：
- 工具返回可能超长的列表或文本流
- 增加 spill 文件或预览截断
- 设计模型可见的省略提示
- 排查“结果为什么少了”

**必须做到（源义务）**：
1. 有界输出必须同时报告精确省略量（item 数或 byte 数）；调用方为得到精确计数应继续消费全部单元。
2. truncated 只是预算事实：表示因 cap 省略了本来可用的内容，绝不表示上游不完整、权限失败或 provider 部分失败。
3. 省略提示由库统一格式，恢复建议由工具自己提供；只有工具知道如何缩小范围或翻页。
4. 文本按字节保留 head/tail/headTail，切口不得留下孤立代理项或引入替换字符；返回文本保持有效编码。
5. read 的行窗口分页是文件专用渲染器，不能硬塞进单一省略计数。

**角色**：工具作者、评审者

**操作步骤**：
1. 选择 ItemRetainer（有序逻辑单元）或 TextRetainer（字节流），并确定 head/tail 策略。
2. 持续 push 所有观察到的单元以得到精确 omitted；只保留前 N 个给模型。
3. 用 formatRetentionNotice 组合统一省略子句与工具自己的恢复建议。
4. 把权限失败、跳过二进制、provider 失败保留在工具域字段，不折叠进 truncated。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`library-contract-plus-review`。实现：output-retention 库的 ItemRetainer/TextRetainer/formatRetentionNotice 与各工具的消费代码。 可验证性：需要检查工具是否 drain 完整输入、是否使用精确计数；仅看返回文本无法判断省略是否精确。 失败模式：把上游失败标成 truncated 会让模型误以为缩小范围即可恢复；不 drain 会给出错误的 omitted 计数。 例外：read 使用自有 line-window 渲染器，不套用单一 Omitted 值。

**适用范围**：适用于任何面向模型的有界结果：搜索、grep、bash、web_fetch 等。 采用方可用等价 retainer 实现，但必须保留“精确省略 + 预算事实分离”。

**相关机制**：
- 与 [tool-registration-and-policy](#package-contracts-4.tool-registration-and-policy) 的结果内容边界相关。
- 与 [durable-value-canonicalization](#package-contracts-4.durable-value-canonicalization) 共享“不伪造完整”的原则。

**迁移设计（非源义务，采用时可选）**：
- 策略：把“保留多少”和“报告省略多少”做成两个独立职责，并禁止把上游错误并入预算事实。
- 实施：在工具层接入 retainer 与统一 notice；测试覆盖精确计数、UTF-8 切口、失败字段不被折叠。
- 需要：精确计数能力、统一省略格式、工具自有恢复建议

**验证计划（status: planned；未执行）**：
- **正向**：glob 超过上限时继续 drain，返回前 N 项并报告精确 omitted。（planned）
- **拒绝**：把权限失败或上游未完成标记为 truncated。 → 评审拒绝；应使用工具域错误字段。（planned）
- **拒绝**：只保留前 N 项但不 drain，却报告精确省略数。 → 指出计数不成立。（planned）
- **恢复**：改为完整 drain 或明确 unknown 计数；恢复建议由工具补齐。（planned）

**已知限制**：未运行库测试；具体保留策略与预算由各工具配置决定。

**源证据**：
- `deepseek-harness/packages/util/output-retention/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/util/output-retention/README.md:81-84@687f282e`（instruction）
- `deepseek-harness/packages/util/output-retention/README.md:149-167@687f282e`（instruction）
- `deepseek-harness/packages/compaction/compaction-tool-result-pruner/README.md:42-45@687f282e`（instruction）
- `deepseek-harness/packages/shell/bash-local/README.md:30-52@687f282e`（instruction）

---

### M09 MCP 桥接的工具身份、整代同步与重连边界 {#package-contracts-4.mcp-bridge-identity}

**问题**：外部 MCP 服务器的名称不可信、可重复且会随升级变化；若直接把远端名称当模型可见工具名，历史与权限规则会在重连/升级后失效，部分同步会留下半套工具。

**何时读**：
- 接入 MCP 服务器
- 服务器工具列表变更
- 重连或崩溃恢复
- 两个服务器提供同名工具

**必须做到（源义务）**：
1. 模型可见工具名必须是 (serverName, rawName) 的纯函数：mcp__<serverName>__<rawName>；有损规范化附加 12 位 SHA-256 后缀，避免不同身份合并。
2. 命名是 pinned v1 契约；serverName 是本地配置命名空间，绝不使用远端 serverInfo.name。
3. tools/call 始终发送 raw name；公开名不得回传给服务器或用于反解 raw name。
4. 同步要么整代替换，要么保留上一代：fetch 失败保留旧代，注册冲突回滚整个尝试代，绝不发布部分工具集。
5. 同一注册 scope 内 serverName 唯一；不同 Agent scope 可复用命名空间，因为工具与 transport 隔离。
6. stdio 子进程环境先经 credential-shaped 变量与 DSH_* 清洗，再合并显式 env；显式覆盖保留。
7. 重连使用有上限的尝试预算；超过后注销工具并停止重连，直到重载配置或重启。
8. 重连退避从 500ms 翻倍到 30s；中断期间保留最后已知工具但调用失败；连续 10 次失败后移除工具并停止重连，直到重载配置或重启；稳定连接一段时间后重置计数。

**角色**：MCP 集成作者、部署者、评审者

**操作步骤**：
1. 为每个服务器分配唯一 serverName 与 transport；不要用远端名称做命名空间。
2. 实现/验证命名函数与哈希后缀，确保历史与权限规则在重连、HMR、其他服务器变化后仍匹配。
3. 以“代”为单位实现同步：先完整发现，再原子替换；失败保留旧代。
4. 配置并验证重连预算、退避上限与预算重置条件。
5. 核对 stdio 环境清洗与显式 env 合并。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-generation-swap`。实现：mcp-client 的连接监督器、工具桥与命名函数；命名由测试固定为 v1 契约。 可验证性：需要实际连接/断开服务器并观察工具集；README 与配置表不能证明整代替换。 失败模式：部分同步会让权限规则指向不存在的工具；用远端名称命名会在升级后静默重命名。 例外：server 若无 tools capability，可连接但工具集为空；这不是同步失败。

**适用范围**：适用于任何把外部工具注册进本地工具注册表的桥接。 采用方可换命名格式，但必须保留“本地命名空间 + 稳定映射 + 整代替换”。

**相关机制**：
- 与 [tool-registration-and-policy](#package-contracts-4.tool-registration-and-policy) 共享注册管线。
- 与 [credential-origin-and-secret-boundary](#package-contracts-4.credential-origin-and-secret-boundary) 共享环境清洗。

**迁移设计（非源义务，采用时可选）**：
- 策略：把外部身份映射成本地稳定标识，并把发现/同步做成可回滚的整代事务。
- 实施：建立命名函数与冲突检测；用故障注入验证 fetch 失败、注册冲突、超预算后的工具可见性。
- 需要：本地命名空间配置、稳定命名函数、整代注册/回滚、重连预算

**验证计划（status: planned；未执行）**：
- **正向**：两个服务器都提供 search，分别以 mcp__a__search 与 mcp__b__search 共存。（planned）
- **正向**：重连后工具列表未变，工具定义与历史权限规则保持匹配。（planned）
- **拒绝**：用远端 serverInfo.name 作为命名空间，或同步失败时发布部分工具。 → 评审拒绝；必须本地命名并整代替换。（planned）
- **恢复**：修正 serverName 冲突或回滚失败代，重新同步后旧工具集仍可用。（planned）

**已知限制**：未连接真实 MCP 服务器；命名算法与超时细节以源码为准。

**源证据**：
- `deepseek-harness/packages/mcp/mcp-client/README.md:73-82@687f282e`（instruction）
- `deepseek-harness/packages/mcp/mcp-client/README.md:89-97@687f282e`（instruction）
- `deepseek-harness/packages/mcp/mcp-client/README.md:105-112@687f282e`（instruction）
- `deepseek-harness/packages/mcp/mcp-client/README.md:135-143@687f282e`（instruction）

---

### M10 一次性/持久 shell 与终端后端的执行契约 {#package-contracts-4.shell-execution-contracts}

**问题**：命令执行若混用 rc 文件、无界输出或不确定的就绪判断，同一命令会因环境与平台不同而产生不同结果；持久 shell 若在不确定状态下继续复用，会污染后续调用。

**何时读**：
- 选择 bash/pwsh 执行器或持久 shell
- 配置预算/超时
- 处理后台进程
- 排查命令输出、退出码或就绪状态

**必须做到（源义务）**：
1. 一次性 bash 每次启动全新非登录 bash -c，不读 rc 文件，因此调用间无 shell 状态。
2. 预算由配置给出：默认超时、最大超时、每流输出上限、spill 上限与 grace；per-call 超时受配置上限约束。
3. 只有基础设施失败才 reject；非零退出、超时、取消都以描述性结果 resolve。结果分类按 first-cause：执行器自身超时才是 timedOut，上游取消是 aborted。
4. 环境分层固定：终端覆盖 → caller env → trusted dshEnv；subprocess 层独立清洗 ambience 凭据与 DSH_*。
5. 后台进程归 subprocess 服务所有：executor-only reload 仍存活，服务 dispose 时杀死并 join。
6. 持久 shell：每个 Agent 一个 shell，命令按 owner 队列串行；显式 exit、超时、发送失败、abort 都关闭 shell 并以全新状态开始，绝不“修复”半知状态。
7. 持久命令用唯一 start/end marker 包裹并轮询 scrollback 提取，避免 prompt/回显泄漏；取消不上报为命令输出。
8. 终端后端的 send 以 ready 证据结算（精确 stdin 等待、验证过的 prompt 标记、输出静默或绝对超时）；inferred_idle/timeout 不证明前台命令已退出。
9. 持久命令以 `[Command finished with exit code N]` 结束；shell 先退出则追加 exited/killed 事实并重置。长输出保留最早前缀加 clipping notice；PTY 已丢弃前缀时必须明说，不能把尾部当完整输出。超时返回有界部分输出并关闭不确定 shell。

**角色**：执行器作者、工具作者、终端后端作者、评审者

**操作步骤**：
1. 确定任务需要一次性干净环境还是跨调用状态；据此选 one-shot 或 persistent。
2. 配置预算并验证 per-call 覆盖不会超过上限。
3. 对 persistent shell 实现 owner 注册、串行队列、marker 提取与 reset-on-uncertainty。
4. 对终端后端实现 readiness 证据与取消/teardown；不要用  伪造中断。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-executor`。实现：bash-local、tool-bash-persistent、terminal-bash 与 subprocess seam 的实现。 可验证性：需要真实进程与 PTY 行为；README 不能证明 marker 提取或 ready 判定。 失败模式：共享半知 shell 会把上一条命令的状态带入下一条；无界输出会耗尽上下文；错误分类会让模型误判可重试性。 例外：交互式前台子进程在无 stdin-wait 证据时运行到 timeout，这是明确限制而非成功。

**适用范围**：适用于任何命令执行工具与持久会话。 采用方可用不同 shell，但必须保留“干净或显式持久”“预算”“不确定即重置”。

**相关机制**：
- 与 [sandbox-fail-closed-and-escalation](#package-contracts-4.sandbox-fail-closed-and-escalation) 共享执行边界。
- 与 [output-retention-honesty](#package-contracts-4.output-retention-honesty) 共享有界输出。

**迁移设计（非源义务，采用时可选）**：
- 策略：先决定状态模型（一次性/持久），再把预算、分类与重置规则写成执行器不变量。
- 实施：为每类结果写契约测试；对持久 shell 写“取消/退出后下一次调用状态干净”的测试。
- 需要：subprocess/PTY provider、预算配置、owner-scoped 注册、readiness 证据

**验证计划（status: planned；未执行）**：
- **正向**：一次性命令不继承上一条的 cd/export；持久 shell 保留状态直到 exit/timeout。（planned）
- **正向**：取消持久命令后 shell 重置，下一次调用从工作区干净开始。（planned）
- **拒绝**：persistent shell 在超时后继续复用同一进程。 → 评审拒绝；不确定状态必须关闭。（planned）
- **拒绝**：把 infered_idle 当“命令已退出”的证明。 → 指出它只证明就绪证据不足。（planned）
- **恢复**：超时/取消后让下一次调用新建 shell，并向模型说明状态已重置。（planned）

**已知限制**：未执行真实 PTY；平台差异与具体就绪证据以 README 限制节为准。 终端 README 的中英限制句不对齐：en:74 说 Shell discovery 会失败，zh:74 说默认 shell 会启动失败；实现 `TerminalGuide.tsx:14-18,28-46` 的 loadShells 失败路径证明 discovery 是真实失败类。两侧同权，采用方需同时覆盖 discovery 与 PTY 启动失败。

**源证据**：
- `deepseek-harness/packages/shell/bash-local/README.md:53-62@687f282e`（instruction）
- `deepseek-harness/packages/shell/bash-local/README.md:63-67@687f282e`（instruction）
- `deepseek-harness/packages/shell/bash-local/README.md:100-110@687f282e`（instruction）
- `deepseek-harness/packages/shell/tool-bash-persistent/README.md:55-58@687f282e`（instruction）
- `deepseek-harness/packages/shell/tool-bash-persistent/README.md:59-65@687f282e`（instruction）
- `deepseek-harness/packages/terminal/terminal-bash/README.md:64-67@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-sidebar-terminal/README.md:10-13@687f282e`（instruction）

---

### M11 沙箱执行器的 fail-closed、拒绝事实与单次提权 {#package-contracts-4.sandbox-fail-closed-and-escalation}

**问题**：沙箱不可用时若回退为无约束执行，命令会获得宿主完整权限；把拒绝伪装成成功或让执行器自行协商权限，会让模型与用户都失去真实边界。

**何时读**：
- 选择 sandboxing 执行器
- 无可用 runner
- 命令被拒绝
- 请求更宽 sandbox 模式

**必须做到（源义务）**：
1. confined 模式下若没有可用 runner，必须 fail closed（SANDBOX_UNAVAILABLE），绝不静默无约束运行。
2. 执行器只做拒绝，不在 seam 授予权限；审批流属于工具层。
3. 拒绝是结果事实：结果携带 sandbox { mode, denied }，工具层转换成标准 permission-denied 表面。
4. 提权只允许一次：模型用最窄的更宽模式重试完全相同的命令，并给出一句理由；审批提示询问用户，批准前不执行。
5. danger-full-access 明确不咨询 provider，并标记 denied:false。
6. 持久终端会话存在时，有效 sandbox mode 的降级写入必须被拒绝，直到会话关闭或 spawn 结束。

**角色**：执行器作者、工具层、用户/审批者、评审者

**操作步骤**：
1. 为每个 confined 模式解析 runner；解析失败返回结构化错误并保持命令未执行。
2. 在结果中记录 mode/denial/enforcement 事实；不要自行放行。
3. 实现单次 escalation：校验命令完全相同、模式更窄、理由非空，再由用户批准。
4. 对终端会话实现 mode 变更 fence，并在 provider 重载后仍保留。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-fail-closed`。实现：pwsh-sandbox/bash-sandbox 的 confine 调用与结果分类、sandbox seam、工具层 approval。 可验证性：需要真实的 runner 缺失与拒绝场景；README 的 fail-closed 声明不能证明没有 unconfined 回退。 失败模式：回退无约束会直接越过权限边界；把 denied 当普通失败会让模型反复重试同一命令。 例外：danger-full-access 是显式例外；Windows read-only 仍保留 hard-link、unconfined reads 与 AppContainer ACL 的部分边界。

**适用范围**：适用于任何把命令限制在文件策略内的执行器。 采用方若无 OS 沙箱，仍可保留“无隔离即拒绝”与“拒绝是事实”。

**相关机制**：
- 与 [filesystem-mutation-integrity](#package-contracts-4.filesystem-mutation-integrity)、[workflow-engine-and-confinement](#package-contracts-4.workflow-engine-and-confinement)、[shell-execution-contracts](#package-contracts-4.shell-execution-contracts) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把隔离可用性作为执行前置条件，把权限决定留在审批层。
- 实施：写 runner 缺失/拒绝/提权三组测试；对终端 mode fence 写并发写测试。
- 需要：sandbox provider 与 policy、结构化拒绝、单次审批流

**验证计划（status: planned；未执行）**：
- **正向**：无 confined runner 时命令以 SANDBOX_UNAVAILABLE 失败，未产生副作用。（planned）
- **正向**：denied 结果携带 mode/denied，工具层显示标准拒绝面。（planned）
- **拒绝**：runner 缺失时回退为无约束执行。 → 评审阻断；必须 fail closed。（planned）
- **拒绝**：执行器自行批准提权或多次重试更宽模式。 → 拒绝；审批属于工具层且只允许一次。（planned）
- **恢复**：安装/修复 runner，或由用户批准最窄更宽模式后重试同一命令。（planned）

**已知限制**：未执行真实 OS 沙箱；各平台边界（hard link、read）以 README 限制节为准。

**源证据**：
- `deepseek-harness/packages/shell/pwsh-sandbox/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/shell/pwsh-sandbox/README.md:58-61@687f282e`（instruction）
- `deepseek-harness/packages/shell/pwsh-sandbox/README.md:62-68@687f282e`（instruction）
- `deepseek-harness/packages/shell/pwsh-sandbox/README.md:69-102@687f282e`（instruction）
- `deepseek-harness/packages/shell/README.md:23-42@687f282e`（instruction）
- `deepseek-harness/packages/terminal/terminal-bash/README.md:68-71@687f282e`（instruction）
- `deepseek-harness/packages/shell/bash-local/README.md:132-152@687f282e`（instruction）

---

### M12 文件变更的读前策略、版本防护与原子发布 {#package-contracts-4.filesystem-mutation-integrity}

**问题**：并发写入、符号链接别名与过期观察会让“编辑”覆盖他人内容；把 cwd 当沙箱或绕过 policy waterfall 会同时破坏完整性与权限边界。

**何时读**：
- 实现/组合文件写入或编辑工具
- 处理并发写与 stale 覆盖
- 配置 cwd/base directory
- 排查 FS 错误码

**必须做到（源义务）**：
1. 每次 mutation 必须走 fs/write-intent 或 fs/edit-intent waterfall 取得 policy guard，再由挂载 provider 强制执行；成功记录 fs/observed。
2. 版本防护可选：省略为无条件 create-or-overwrite；提供时若文件自观察以来变化则失败（FS_STALE_VERSION）。编辑在字面匹配前先校验版本，避免把 stale 误报为 no-match。
3. 写入必须原子发布：目标旁私有 staging、fsync、发布；保留既有权限，Windows 保留 DACL。
4. per-target FIFO 锁序列化 read→guard→write；并发写者一个获胜，其余看到新版本并拒绝为 stale。
5. 错误必须用稳定 code（FS_NOT_FOUND、FS_NOT_TEXT、FS_STALE_VERSION、FS_EDIT_NOT_FOUND、FS_AMBIGUOUS_EDIT、FS_NOT_OBSERVED 等），调用方按 code 分支而非 message 文本。
6. config.cwd 只是相对路径解析默认值，不是 containment；绝对路径与 .. 可以逃逸，约束必须由 fs-sandbox 或 permission plugin 提供。
7. str_replace_editor：create 拒绝覆盖已有文件；str_replace 要求唯一字面匹配且无 replace_all；insert 使用零基边界且不添加隐式尾换行；相对路径拒绝。
8. view 返回一基编号并保留 tab，使显示文本可直接作为字面替换输入；create 拒绝覆盖已存在文件；insert 使用零基边界且不添加隐式尾换行；mutation 保留请求编辑之外的 tab。

**角色**：文件 tool/provider 作者、策略插件作者、评审者

**操作步骤**：
1. 确定 mutation 入口：先解析绝对路径，再走 policy intent waterfall。
2. 在 provider 内完成 probe、版本检查、staging、fsync 与原子发布；不要在工具层直接写宿主文件。
3. 用真实并发与符号链接场景验证 realpath 身份、per-target 锁与 stale 拒绝。
4. 验证错误 code 与恢复动作（重读后重试、先 read 再 create）。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-provider-plus-policy`。实现：fs-local 的 fsio/staging/per-target lock，fs-observation-policy 的 guard，str_replace_editor 的 mutation 流程。 可验证性：需要并发与崩溃场景的实际执行；README 的原子性声明不能替代故障注入。 失败模式：直接写会破坏原子性；先匹配后校验版本会把 stale 报成内容不存在；把 cwd 当沙箱会让绝对路径越界。 例外：guarded creation 需要 hard-link 支持；不支持的文件系统返回 FS_IO_ERROR。；进程内锁不序列化其他进程的 replacement；跨进程只靠版本防护观察元数据变化。

**适用范围**：适用于所有宿主文件写入/编辑。 采用方可用不同存储实现，但必须保留 read-before-edit、版本失败与原子发布语义。

**相关机制**：
- 与 [sandbox-fail-closed-and-escalation](#package-contracts-4.sandbox-fail-closed-and-escalation) 的 containment 分工相关。
- 与 [session-activation-and-write-ownership](#package-contracts-4.session-activation-and-write-ownership)、[worktree-isolation-and-retention](#package-contracts-4.worktree-isolation-and-retention) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把“观察—校验—发布”做成 provider 的不变量，工具层只表达意图。
- 实施：为 provider 写并发/符号链接/崩溃测试；为每个错误 code 定义调用方恢复动作。
- 需要：policy waterfall、原子发布与锁、稳定错误分类、可选版本 guard

**验证计划（status: planned；未执行）**：
- **正向**：两个并发写入同一文件：一个成功，另一个以 FS_STALE_VERSION 失败；文件内容完整。（planned）
- **拒绝**：编辑工具绕过 fs/write-intent 直接写 provider，或把 cwd 当 containment。 → 评审拒绝并指出越界路径。（planned）
- **拒绝**：create 已存在文件仍覆盖。 → 拒绝覆盖并返回明确错误。（planned）
- **恢复**：stale 后重读并重试；缺失文件先 view 记录 absence 再 create。（planned）

**已知限制**：未执行真实并发/崩溃测试；跨进程语义与平台差异以源码与限制节为准。

**源证据**：
- `deepseek-harness/packages/fs/fs-local/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/fs/fs-local/README.md:51-61@687f282e`（instruction）
- `deepseek-harness/packages/fs/fs-local/README.md:69-76@687f282e`（instruction）
- `deepseek-harness/packages/fs/fs-local/README.md:124-149@687f282e`（instruction）
- `deepseek-harness/packages/fs/tool-str-replace-editor/README.md:49-52@687f282e`（instruction）
- `deepseek-harness/packages/fs/tool-str-replace-editor/README.md:53-59@687f282e`（instruction）

---

### M13 Worktree 隔离创建、沙箱约束与保留语义 {#package-contracts-4.worktree-isolation-and-retention}

**问题**：在源 checkout 上直接实验会污染工作区；复制未提交文件或执行仓库配置的 clean 与 smudge 过滤器又会在隔离名义下引入未审查代码与隐式网络拉取。

**何时读**：
- 创建或进入 worktree
- 隔离实验或并行任务
- Git 过滤器、LFS 或部分克隆
- 清理 worktree

**必须做到（源义务）**：
1. 创建新命名分支与 checkout，源 checkout 保持不变；from 在创建前解析为本地 commit，默认 HEAD；staged、unstaged、untracked、ignored 文件不复制。
2. 所有 Git 与目录分配经 mounted subprocess 与 sandbox 以调用 Session 现有文件策略执行；不扩大目标或共享 Git 管理目录的写权限。
3. checkout 禁用配置的 clean、smudge、process filters，避免执行仓库配置程序或隐式下载；LFS 指针与加密 blob 保持原样。
4. 默认目录为 current checkout root 下的 .agents/worktrees/<name>；仅在本次分配创建 pool 时写 .gitignore（内容 * 加尾换行），保留既有文件与规则。
5. 目录创建独占声明目标；已存在 branch 或 checkout path 是错误；取消或失败可保留部分产物，错误中给出路径。
6. 离开 worktree 保留其文件与分支；删除、prune、branch 删除归用户或其他消费者。
7. subprocess 必须在与文件系统相同的执行世界提供 Git 与 Node；Git 需遵守 GIT_NO_LAZY_FETCH（2.45 与指定维护版本），旧版本会忽略并可能从 promisor remote 拉取。

**角色**：worktree 服务作者、工具作者、用户、评审者

**操作步骤**：
1. 确认 subprocess 与 sandbox 在同一执行世界，并满足 Git 版本要求。
2. 在创建前解析 revision；用独占目录创建与 sandbox 约束执行 git worktree。
3. 验证过滤器被禁用、未提交文件未复制、保留语义清晰。
4. 把删除与清理留给用户并文档化。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-sandbox-plus-git`。实现：experimental-worktree 的 process 与 directory 实现及 workingDirectory.set。 可验证性：需要真实 Git、沙箱与过滤器仓库；README 不能证明没有隐式 fetch 或越权写。 失败模式：复制未提交文件会泄露或污染；执行 filters 会运行未审查代码；旧 Git 会绕过 no-lazy-fetch。 例外：保留部分产物是刻意失败语义；linked checkout 的 pool 嵌套在调用方 checkout 内。

**适用范围**：适用于需要隔离 checkout 的编码代理。 采用方可用容器代替 worktree，但必须保留源不动、沙箱约束、保留可清理。

**相关机制**：
- 与 [filesystem-mutation-integrity](#package-contracts-4.filesystem-mutation-integrity)、[session-activation-and-write-ownership](#package-contracts-4.session-activation-and-write-ownership) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把隔离定义为新 checkout 加现有沙箱加不复制状态，并明确保留物归用户。
- 实施：用带 filter、未提交文件、部分克隆的仓库做负向测试；验证取消后错误路径。
- 需要：subprocess 与 sandbox、Git 版本要求、workingDirectory.set

**验证计划（status: planned；未执行）**：
- **正向**：源 checkout 的未提交修改不被复制；新 worktree 使用新分支；失败时错误含保留路径。（planned）
- **拒绝**：worktree 创建绕过 sandbox 直接写共享 Git 目录。 → 评审拒绝；必须经 mounted provider。（planned）
- **拒绝**：checkout 执行仓库配置的 smudge filter。 → 指出必须禁用 filters。（planned）
- **恢复**：修正 Git 版本或沙箱授权后重试；手动清理保留产物。（planned）

**已知限制**：未创建真实 worktree；Git 版本与平台细节以限制节为准。

**源证据**：
- `deepseek-harness/packages/experimental/worktree/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/experimental/worktree/README.md:26-41@687f282e`（instruction）
- `deepseek-harness/packages/experimental/worktree/README.md:42-61@687f282e`（instruction）
- `deepseek-harness/packages/experimental/worktree/README.md:81-98@687f282e`（instruction）

---

### M14 工作流引擎的 holder-owned run 与沙箱执行边界 {#package-contracts-4.workflow-engine-and-confinement}

**问题**：工作流脚本会扇出大量子代理；若 run 由服务而不是调用方持有，引擎卸载或调用方放弃会让子代理泄漏。脚本执行若只靠 VM 或合作式计数，也会被误当成安全边界。

**何时读**：
- 新增/替换 workflow engine
- 编写或调用 workflow 脚本
- 评估脚本隔离与资源上限
- 取消/卸载工作流

**必须做到（源义务）**：
1. 一个 context 只允许一个 workflow engine；第二个加载必须大声失败，替换引擎需改变组合。
2. run 归调用方所有：start() 先校验 meta 与脚本，再创建 run；调用方必须在每条路径 dispose()，dispose 取消剩余工作并等待脚本与子代理清理。
3. 事件 observe-only：payload 是 run 身份快照，监听者不能取得取消或处置权。
4. 脚本/选项错误必须 fatal，不能溶解为 null；普通子代理失败才解析为 null 交给脚本处理。
5. 脚本只能看到显式的 helper API；VM 不是安全边界，能到达 Node 的代码遵循所选运行时文件策略。
6. 执行必须捕获调用时 Session 的工作目录与 file policy；confined 模式在无可用 confinement 时应在执行前失败，仅 danger-full-access 允许无约束运行时。
7. workflow 没有整体 elapsed deadline；调用方 abort signal（含外层工具 deadline）仍适用，取消立即中止进程与子代理。

**角色**：引擎作者、工具/调用方、安全评审者

**操作步骤**：
1. 在组合中确认唯一 engine，并确认其依赖的 subagent/sandbox/ptc runtime 存在。
2. 在创建 run 前完成 meta/脚本/caps 校验；校验失败同步拒绝。
3. 把 run 生命周期交给调用方；在每个完成/失败/取消路径调用 dispose 并等待清理。
4. 验证 confined 模式的 fail-closed 与 danger-full-access 的显式例外。
5. 验证事件无法改变执行，以及 fatal 错误与子代理 null 的区分。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-ownership-plus-review`。实现：workflow 服务接口、workflow-ptc 引擎、PTC 运行时与 sandbox/subprocess provider。 可验证性：需要实际启动 run、卸载引擎并观察子代理清理；README 不能证明无泄漏。 失败模式：服务持有 run 会在卸载后留下不可取消的子代理；把 VM 当沙箱会执行未受限文件操作。 例外：danger-full-access 明确绕过 confinement；Ralph 等 opt-in 消费者仍需显式启用。

**适用范围**：适用于任何 holder-owned 的编排/批处理运行器。 采用方若无 PTC，可用其他隔离运行时，但必须保留 run 所有权与 fail-closed。

**相关机制**：
- 与 [sandbox-fail-closed-and-escalation](#package-contracts-4.sandbox-fail-closed-and-escalation)、[subagent-isolation-and-result-boundary](#package-contracts-4.subagent-isolation-and-result-boundary) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把 run 做成调用方拥有的资源，把隔离声明与执行运行时分离。
- 实施：在调用方统一 try/finally dispose；对 confined 模式写启动前拒绝测试；用取消测试验证子代理清理。
- 需要：唯一 engine 注册、run handle 与 dispose、sandbox/subprocess provider

**验证计划（status: planned；未执行）**：
- **正向**：run 完成后调用 dispose，子代理与脚本清理完成；引擎卸载后的已接受 run 仍可被持有者取消。（planned）
- **拒绝**：在 confined 模式无可用 sandbox provider 时仍执行脚本。 → 执行前失败，不能回退到无约束。（planned）
- **拒绝**：脚本参数错误被映射为 null 继续执行。 → fatal 错误终止脚本。（planned）
- **恢复**：补齐 sandbox provider 或显式选择 danger-full-access，并重新运行。（planned）

**已知限制**：未运行 workflow/PTC；清理边界继承 subprocess 与 sandbox provider。

**源证据**：
- `deepseek-harness/packages/workflow/workflow/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow/README.md:34-48@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow/README.md:62-97@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow/README.md:119-142@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow-ptc/README.md:57-65@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow-ptc/README.md:148-169@687f282e`（instruction）

## 2.C 模型、子代理与值语义

### M15 默认模型只填空、会话选择不回溯 {#package-contracts-4.model-selection-and-session-pin}

**问题**：把进程默认模型当成“全局当前模型”会在已有 Session 上静默换模型，改变请求前缀与可比性；反过来，每次请求都重新解析默认值也会让旧 Session 漂移。

**何时读**：
- 设置默认 provider/model
- 实现 selectModel 或模型设置页
- 排查“为什么这个 Session 换模型了”
- 配置 reasoningEffort

**必须做到（源义务）**：
1. 默认模型服务只回答“新建 Agent 该用什么”：provider 与 model 必填；它不校验目录成员，可用性诊断由打开请求的消费者负责。
2. 每个 Session 的模型选择归入口点（entry point）所有；Session 本地选择优先于进程默认。
3. 保存默认选择必须串行化并按提交顺序写 profile；失败只影响该调用者，不阻止后续保存。
4. 已有 Session 的请求日志若已命名选择，则继续使用该选择；改变默认不影响其已建立前缀。
5. selectModel 成功只确认 Session 本地选择，不等待默认设置保存；后台保存失败只记警告，Session 选择保持。
6. 没有配置编辑器时 saveSelection 是 no-op；持久化默认值需要 profile 配置编辑器。
7. 省略 reasoningEffort 会从 profile 的完整 config override 中移除该字段，而不是保留旧值。
8. Provider ID 是 settings key、日志引用与凭据引用词干，页面不得读回后移动；不存在 provider 级 reasoning-effort 字段，effort 是 per-model 能力；profile headers 保持部署配置，不在 Models 页编辑。

**角色**：入口点作者、设置 UI 作者、评审者

**操作步骤**：
1. 区分三个层级：进程默认、Session 选择、单次请求 route；按优先级解析并记录。
2. 把默认保存实现为有序写并处理冲突；测试并发保存与失败。
3. 在模型设置页固定 provider id（它是 settings key 与凭据引用词干），不允许改名。
4. 验证旧 Session 在默认改变后仍使用原选择。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-resolution-order`。实现：agent-default-model 的 currentSelection/saveSelection、session-controller 的 selectModel、Settings 页的 provider id 固定。 可验证性：需要跨 Session 实际验证；README 的“live Config”不能证明旧 Session 不被重解析。 失败模式：全局替换会静默改变历史请求语义；不串行保存会让并发编辑器互相覆盖。 例外：entry point 可以显式覆盖选择（如用户选择或子代理 route）；默认服务不阻止。

**适用范围**：适用于有进程默认与会话级覆盖的模型选择。 采用方若只有单一模型，仍应保留“旧会话固定选择”。

**相关机制**：
- 与 [tool-registration-and-policy](#package-contracts-4.tool-registration-and-policy)、[subagent-capability-negotiation](#package-contracts-4.subagent-capability-negotiation) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把默认值限制为“新会话填充器”，把持久选择与会话选择分开建模。
- 实施：写三层优先级测试；写并发保存与失败隔离测试；写旧会话 pin 测试。
- 需要：Session 选择存储、profile 编辑器、有序写

**验证计划（status: planned；未执行）**：
- **正向**：改变默认后旧 Session 仍用原模型；新 Session 使用新默认。（planned）
- **正向**：两个并发 saveSelection 按提交顺序落盘，后者获胜且前者失败可见。（planned）
- **拒绝**：进程默认变化导致活跃 Session 的请求模型改变。 → 评审拒绝；违反 Session pin。（planned）
- **拒绝**：并发保存静默丢弃一次写入且无错误。 → 指出失败必须对调用者可见。（planned）
- **恢复**：恢复 Session 本地选择或让用户显式切换；默认保存失败后重试。（planned）

**已知限制**：未运行模型路由；具体入口点覆盖语义以 core/agent-loop 文档为准。

**源证据**：
- `deepseek-harness/packages/core/agent-default-model/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/core/agent-default-model/README.md:30-47@687f282e`（instruction）
- `deepseek-harness/packages/core/agent-default-model/README.md:48-61@687f282e`（instruction）
- `deepseek-harness/packages/core/agent-default-model/README.md:108-126@687f282e`（instruction）
- `deepseek-harness/packages/api/session-controller/README.md:28-77@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-settings-models/README.md:50-63@687f282e`（instruction）

---

### M16 子代理提供者的能力协商与拒绝而非静默省略 {#package-contracts-4.subagent-capability-negotiation}

**问题**：不同子代理后端（进程内、ACP、Claude Code、Harness SDK）支持的能力不同；若父级请求了远端无法执行的 preset、结构化输出或深度上限却被静默忽略，调用方会得到看似成功但语义错误的结果。

**何时读**：
- 选择子代理后端
- 请求 agentPreset/agentOptions/outputSchema/depth
- 新增 provider
- 排查“为什么子代理没按请求执行”

**必须做到（源义务）**：
1. 每个 provider 必须声明支持的能力；seam 对不支持的请求显式拒绝，而不是静默省略。
2. providerName 在注册 scope 内唯一；每个挂载实例需要不同名称。
3. 进程内后端用于共享父组合或父级强制能力；进程外后端用于隔离，但不能应用父级 preset/深度/结构化输出。
4. route 选项只按显式白名单跨线；缺省字段不得被默认值悄然覆盖（例如 reasoningEffort 无 provider 级默认）。
5. 需要子运行时具备特定协议能力（如 session/wait）时，缺失应在执行前失败。

**角色**：provider 作者、seam 维护者、组合/工具作者

**操作步骤**：
1. 列出 provider 支持矩阵：agentOptions、agentPreset、outputSchema、depthLimit、inheritsParentContext。
2. 在 seam 入口校验请求；不支持时返回明确错误，不修改请求后继续。
3. 为每个挂载实例分配唯一 providerName。
4. 对跨线 route 字段使用白名单，并验证缺省语义。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-capability-check`。实现：subagent seam 的 capability 声明与请求校验；各 provider 在 README 中列出支持/拒绝项。 可验证性：需要调用不支持的组合并观察拒绝；README 矩阵不能证明 seam 实际拦截。 失败模式：静默省略会让父模型以为子任务按指定 preset/输出 schema 运行，实际结果不可比。 例外：provider-managed depth 表示子运行时自己管理递归预算，不是父级不限制。

**适用范围**：适用于任何多后端委派 seam。 采用方若只有一种后端，仍应声明能力并在请求超出时失败。

**相关机制**：
- 与 [service-seam-single-owner](#package-contracts-4.service-seam-single-owner)、[subagent-isolation-and-result-boundary](#package-contracts-4.subagent-isolation-and-result-boundary) 相关。
- 与 [model-selection-and-session-pin](#package-contracts-4.model-selection-and-session-pin) 共享“不替换/不静默改写选择”。

**迁移设计（非源义务，采用时可选）**：
- 策略：把后端差异显式化为能力矩阵，并让 seam 成为拒绝点。
- 实施：在启动时注册能力；对每个请求字段做支持性校验；测试覆盖每类不支持请求。
- 需要：能力声明、请求校验、每 provider 唯一名称

**验证计划（status: planned；未执行）**：
- **正向**：向 ACP provider 请求结构化输出，seam 返回明确不支持错误；向支持的 provider 请求则执行。（planned）
- **拒绝**：provider 静默忽略 outputSchema 并返回普通文本，调用方当作结构化结果。 → 评审拒绝；必须显式失败。（planned）
- **恢复**：改用支持该能力的后端，或移除请求字段后重试。（planned）

**已知限制**：未运行真实子代理；支持矩阵以各 README 表述为准。

**源证据**：
- `deepseek-harness/packages/subagent/README.md:10-39@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-acp/README.md:30-33@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-dsh-sdk/README.md:30-35@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-claude-code/README.md:77-80@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow-ptc/README.md:26-65@687f282e`（instruction）

---

### M17 外部子代理的隔离与父级结果边界 {#package-contracts-4.subagent-isolation-and-result-boundary}

**问题**：把子进程的推理、工具流量、stderr、usage 或工作区 diff 全部倒进父 Session 会污染上下文并泄露敏感信息；反过来，若失败只给“未知错误”，父级无法安全恢复。

**何时读**：
- 委派到 ACP/Claude Code/Harness SDK 子进程
- 设计完成通知与诊断
- 排查子代理失败
- 评估隔离与回滚

**必须做到（源义务）**：
1. 每次委派使用全新进程/运行时，拥有自己的 session、模型与工具；父级只提供任务、工作目录与（允许时的）route。
2. 父 Session 只保留最终答案或部分文本、stop reason 与安全诊断；子级推理、中间消息、工具流量、stderr、usage、产品标识、路径与原始协议载荷不得复制进父 Session。
3. 安全诊断只含固定 provider/stage/category 与闭集进程事实；不得含任务内容、工具输入、环境值、凭据或协议 payload；共享结果边界限制字节数。
4. 本地取消映射为 aborted；取消不撤销已发生的文件/外部副作用。
5. 外部产品设置与认证保持原生权威；provider 不创建账号、不改设置、不回退到宿主 CLI。

**角色**：provider 作者、父级工具作者、安全/评审者

**操作步骤**：
1. 定义父子边界：只传任务文本、工作目录、允许的 route；其余能力若不能强制执行则拒绝。
2. 只从协议终态提取最终文本与闭集 stop reason；其余消息不进入父历史。
3. 构造固定格式的安全诊断，并测试敏感字段不会出现。
4. 验证取消、部分输出与清理失败的分类。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`process-isolation-plus-review`。实现：各 provider 的进程/协议边界、结果提取与诊断构造；subagent seam 的 terminal result 语义。 可验证性：需要真实运行子进程并检查父 Session 事件；仅看 README 无法证明没有泄露。 失败模式：复制子级 trace 会泄露凭据并放大上下文；只给未知错误会让父级无法判断是否可重试。 例外：失败运行可以保留部分 assistant 文本并另附安全 diagnostic；这不是完整 trace。

**适用范围**：适用于跨进程/跨产品的委派。 采用方若在同进程委派，仍需定义哪些子级数据可进入父历史。

**相关机制**：
- 与 [subagent-capability-negotiation](#package-contracts-4.subagent-capability-negotiation)、[workflow-engine-and-confinement](#package-contracts-4.workflow-engine-and-confinement) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把“结果”缩小为可安全复用的终态事实，把诊断限制为闭集分类。
- 实施：在 provider 边界做提取与脱敏；用负向测试断言敏感字段不出现；记录部分输出与取消。
- 需要：进程/协议隔离、终态提取、固定诊断格式、取消与副作用说明

**验证计划（status: planned；未执行）**：
- **正向**：子代理成功后父 Session 只有 start ack、最终文本、stop reason；无 stderr/usage/trace。（planned）
- **拒绝**：诊断包含 stderr、任务内容或环境值。 → 评审拒绝并阻断发布。（planned）
- **恢复**：改为闭集诊断；父级依据 stop reason 决定重试或报告。（planned）

**已知限制**：未执行真实子代理；字节上限与错误分类以源码为准。 subagent-dsh-sdk README 将 activation receipt 写成“凭据”（en:106 / zh:106），同文 zh:48/79/114 的“凭据”指 credentials；实现 `SubagentActivation.dispose()` 才是取消并等待清理的句柄。该术语冲突是源限制；迁移不得把 credential 当取消句柄。

**源证据**：
- `deepseek-harness/packages/subagent/subagent-acp/README.md:71-77@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-acp/README.md:78-107@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-dsh-sdk/README.md:77-83@687f282e`（instruction）
- `deepseek-harness/packages/subagent/subagent-claude-code/README.md:162-190@687f282e`（instruction）
- `deepseek-harness/packages/workflow/workflow-ptc/README.md:148-169@687f282e`（instruction）

---

### M18 时钟上下文注入：按步、追加、可解释缺失 {#package-contracts-4.time-context-injection}

**问题**：模型不知道现在和用户时区时会误读未限定时间；每次请求都注入又会累积历史成本并干扰 KV cache；用进程时区冒充用户时区会把猜测当事实。

**何时读**：
- 模型需要解释相对或未限定日期
- 配置 time-context
- 多时区或混合请求
- 审查上下文注入成本

**必须做到（源义务）**：
1. 仅在 eligible entering pre-step 且注入到期时，追加一条 sourced UserMessage；source 固定为 kind 为 time-context、form 为 snapshot 的分节快照。
2. 读数含三行：带数字偏移与 IANA 名的 ISO 形时间戳、本次请求的 browser-zone 策略、自前一条模型可见消息（首步）或前一次 time-context（后续步）起的整秒时长。
3. 只有 open turn 恰有一个 Host 验证过的 browser zone 时才用请求本地时区；缺失或混合时用配置或进程 fallback 格式化，但面向模型的策略仍要求澄清。
4. 正 interval 抑制窗口内的注入；省略默认 600000ms，0 表示每个 eligible 步都注入；调度扫描 durable 事件（含被 compaction 遮蔽的）以跨 resume 存活。
5. 缺失基线报 unavailable；墙钟回退把 elapsed 夹到 0；时间戳与时长只显示整秒。
6. 注入是 prompt guidance，不静默填充其他工具必填的 zone 字段；fallback 不是用户权威。

**角色**：上下文插件作者、组合作者、评审者

**操作步骤**：
1. 确认组合是否需要时钟；Web 默认不含，standard、cordis、ptc 声明，minimal 不含。
2. 选择时区来源与 fallback，并验证 Intl 校验。
3. 按会话成本选择 refreshIntervalMs；用 durable 扫描实现调度。
4. 对混合或缺失 zone 写要求澄清的断言。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-pre-step-injection`。实现：time-context 的 agent/pre-step 监听、request-zone 推导、durable 事件扫描与 sourced UserMessage。 可验证性：需要真实多步、混合 zone 与 resume 场景；README 不能证明注入时机。 失败模式：用进程时区冒充用户时区会让模型错误解释时间；每步注入会累积 token；把注入当已发送请求会产生错误归因。 例外：读数记录进入步，准备失败可能留下历史记录；这是明确行为。；fallback 只用于显示，不改变澄清策略。

**适用范围**：适用于需要时间解释的对话代理。 采用方可用不同注入格式，但必须保留请求区优先、缺失可解释、成本可控。

**相关机制**：
- 与 [durable-value-canonicalization](#package-contracts-4.durable-value-canonicalization) 的时区规范化相关。
- 与 [output-retention-honesty](#package-contracts-4.output-retention-honesty) 的不伪造完整一致。

**迁移设计（非源义务，采用时可选）**：
- 策略：把时间作为可审计的 sourced 注入，而不是隐藏系统提示或工具副作用。
- 实施：实现 pre-step 注入与 durable 调度；测试混合 zone、resume、interval=0 与回退时钟。
- 需要：pre-step 钩子、browser zone 记录、durable 事件读

**验证计划（status: planned；未执行）**：
- **正向**：单一步骤只有一个 browser zone 时用该 zone；resume 后 interval 仍按 durable 事件计算。（planned）
- **拒绝**：混合 zone 时任选一个格式化并声称是用户时区。 → 评审拒绝；应要求澄清。（planned）
- **拒绝**：把注入记录当作请求已发送的证明。 → 指出读数只记录进入步。（planned）
- **恢复**：配置明确 fallback 并提示模型澄清；调整 interval 控制成本。（planned）

**已知限制**：未运行多时区会话；KV cache 效果由消费者请求前缀决定。

**源证据**：
- `deepseek-harness/packages/context/time-context/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/context/time-context/README.md:30-33@687f282e`（instruction）
- `deepseek-harness/packages/context/time-context/README.md:51-57@687f282e`（instruction）
- `deepseek-harness/packages/context/time-context/README.md:65-68@687f282e`（instruction）
- `deepseek-harness/packages/context/time-context/README.md:129-150@687f282e`（instruction）
- `deepseek-harness/packages/util/time/README.md:25-33@687f282e`（instruction）

---

### M19 持久值的无损 JSON、规范时区与快照/克隆 {#package-contracts-4.durable-value-canonicalization}

**问题**：别名时区、负零、稀疏数组、类实例或 live 引用一旦进入持久日志，另一进程重新计算时可能比较不等或改变语义；把可变对象发布给消费者则会产生隐蔽共享状态。

**何时读**：
- 写入 durable 记录或事件
- 接受调用方时区
- 发布配置/快照给消费者
- 跨进程比较或重放

**必须做到（源义务）**：
1. 只有 lossless JSON 根可持久化：null、布尔、非 `-0` 的有限数、字符串、密集 intrinsic 数组、plain 或 null-prototype 且仅可枚举字符串键的记录；拒绝环、稀疏数组、symbol/不可枚举属性、函数与类实例。
2. 快照写入使用 own data property（包括 __proto__ 这类名字）；验证用显式工作栈、只跟踪活动祖先链，深度嵌套不消耗调用栈。
3. 时区在进入 durable 值之前规范化：只接受 UTC 或 IANA Area/Location，返回平台规范拼写；别名不得进入持久记录。
4. 规范化库只校验/规范化，不格式化时间、不拥有失败词汇；调用方抛出自己的域错误码（如 session/invalid-time-zone）。
5. 发布的值必须 detached 或 deep-frozen；deepFreeze 只沿可枚举字符串键遍历并刻意保留 live AbortSignal 可变；deepEqualJson 只用于 JSON 兼容输入。
6. WeakMapWithValues 的强持有必须由拥有者在生命周期边界显式 delete/clear，且一个值不得被多个 key 共享。

**角色**：持久化作者、事件模型作者、评审者

**操作步骤**：
1. 在边界处校验 lossless JSON 并立即 snapshot；不要保存调用方对象引用。
2. 在写入前规范化时区；用平台 API 验证而非接受任意字符串。
3. 为发布值选择 deepFreeze 或快照，并记录例外（AbortSignal）。
4. 用 assertNever 关闭判别联合，新增变体时让编译失败。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`library-invariant-plus-review`。实现：util-values 的验证/快照/冻结/比较、util-time 的 canonicalClientTimeZone、各持久化消费者的边界校验。 可验证性：需要跨进程重放与别名时区测试；README 不能证明所有写路径都调用了校验。 失败模式：别名或非 JSON 值进入日志会导致重放不等；共享可变对象会让后来的修改改写历史。 例外：deepEqualJson 不定义 prototype/symbol/accessor/cycle 语义；调用方必须先验证。；weak 集合不自动清理。

**适用范围**：适用于事件日志、配置快照、跨进程缓存等一切 durable 值。 采用方可用不同序列化，但必须保留“无损 + 规范 + detached”。

**相关机制**：
- 与 [time-context-injection](#package-contracts-4.time-context-injection)、[session-activation-and-write-ownership](#package-contracts-4.session-activation-and-write-ownership) 相关。
- 与 [time-context-injection](#package-contracts-4.time-context-injection) 共享持久事件可重放要求。

**迁移设计（非源义务，采用时可选）**：
- 策略：把“可持久化”定义为强类型/运行时校验，并把规范化放在写入前而不是读取后。
- 实施：为每个持久化入口接入验证器；写负向测试（负零、稀疏数组、环、别名时区）；写跨进程重放断言。
- 需要：lossless JSON 校验、时区规范化、快照/冻结

**验证计划（status: planned；未执行）**：
- **正向**：Alias 时区写入前被规范化为同一 IANA 名；另一进程读回比较相等。（planned）
- **正向**：持久化入口拒绝负零、稀疏数组与类实例。（planned）
- **拒绝**：直接持久化调用方对象引用，后续修改污染日志。 → 评审拒绝；必须 snapshot/detach。（planned）
- **拒绝**：读取时再规范化时区并期望旧记录相等。 → 指出别名已进入持久层。（planned）
- **恢复**：迁移历史值或重新写入规范值；对非法值返回域错误。（planned）

**已知限制**：未运行跨进程重放；ICU 别名行为随 Node 版本变化。

**源证据**：
- `deepseek-harness/packages/util/values/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/util/values/README.md:27-39@687f282e`（instruction）
- `deepseek-harness/packages/util/values/README.md:46-51@687f282e`（instruction）
- `deepseek-harness/packages/util/values/README.md:86-102@687f282e`（instruction）
- `deepseek-harness/packages/util/time/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/util/time/README.md:34-44@687f282e`（instruction）
- `deepseek-harness/packages/util/time/README.md:53-68@687f282e`（instruction）

## 2.D 会话、信任与客户端投影

### M20 Session 冷读不激活与单写者所有权 {#package-contracts-4.session-activation-and-write-ownership}

**问题**：列表、搜索或 UI 预览若为了显示而激活冷 Session，会消耗资源、触发迁移或与真实 owner 争写；多个写者同时 resume 会让同一 Session 出现分叉。

**何时读**：
- 实现列表/搜索/历史预览
- 恢复或创建 Session
- UI retain 子代理
- 目录切换或 archived 状态

**必须做到（源义务）**：
1. 列表只读存储 header 与 projection cache 行，不得为每 Session 做 stat 或打开冷 body；缓存身份只能提供显示提示，不能作为权威 fold seed。
2. 搜索、附件、历史页、日志跟随、skill 发现与 workspace-path 打开可以检查持久化而不激活 Agent；需要 live state 的操作（如取消）才要求活跃。
3. resume 遇到既有写句柄返回 session/writer-held；named Session 只在空白、同目录、未归档、无其他写者时复用，否则新建且不改原 Session。
4. Session 的有效目录由 projection 暴露，冷读者无需激活 Agent；目录变更按 Session 串行、经 fs provider 校验、提交事件并排队 user-context notice。
5. archived Session 的 pre-step 必须被 gate 拒绝，包括其子代理后代；unarchive 解除整条 lineage。
6. 工作流/翻译等缓存读取不得打开写句柄或激活 Session；cache miss 只能通过活跃 Session 的既有 writer 追加。
7. UI retain 保留本地 Session 数据/流，不代表保留 Host Agent；final release 先撤回代际再 teardown。
8. create 只在命名 Session 仍空白、属于请求目录、是请求 Workspace 的未归档成员且无其他写者时复用；live 就地复用，persisted resume 保留写者锁；已开始、目录/Workspace 不符或被他写者持有则不改原 Session 而新建。
9. 命名 Session 在其他目录返回 session/conflict，被子代理路由占用返回 session/agent-busy；同一 identity 的创建按到达顺序执行，包括 preset 解析。
10. Client retain 保留本地 Session 数据、scoped Context 与历史流，不保留 Host Agent；普通 Session retain 不增加 catalog 行；final release 先撤回 generation 再 teardown。
11. ArchivedSessionGate 在 agent/pre-step 拒绝 archived Session 及其子代理后代的步进，使其以 blocked 结束且不发模型请求；unarchive 解除整条 lineage。

**角色**：Session 服务作者、查询/搜索实现者、UI 作者、评审者

**操作步骤**：
1. 为每个读操作标注是否允许激活；默认不激活。
2. 列表路径只读 header/投影缓存；需要 body 的接口显式命名并说明成本。
3. 写入前获取 writer；resume 失败按 writer-held 处理，不强制接管。
4. 为 archived 状态实现 lineage gate，并验证子代理后代。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-service-boundary`。实现：session-controller 的 activation policy、session-query 的 live-preferred corpus、working-directory projection、ArchivedSessionGate。 可验证性：需要观察冷 Session 是否被加载以及 writer 冲突；README 不能证明没有隐式激活。 失败模式：隐式激活会让列表变慢并触发迁移；强接管 writer 会造成同一 Session 双写。 例外：某些操作（cancel、queue mutation、prompt）明确要求 live state；这是设计允许的激活。

**适用范围**：适用于有冷/热两级存储的会话系统。 采用方若无 Agent 激活概念，仍可保留“只读路径不产生副作用/单写者”。

**相关机制**：
- 与 [trusted-seam-authorization-delegation](#package-contracts-4.trusted-seam-authorization-delegation)、[session-activation-and-write-ownership](#package-contracts-4.session-activation-and-write-ownership)、[durable-value-canonicalization](#package-contracts-4.durable-value-canonicalization) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把读路径按副作用分级，并把写者所有权做成显式锁。
- 实施：在 API 层标注激活策略；对 list/search 写“不打开冷 body”的测试；对 resume 写 writer-held 测试。
- 需要：header/projection 缓存、writer lock、archived gate

**验证计划（status: planned；未执行）**：
- **正向**：列出/搜索冷 Session 后，未创建 Agent、未打开写句柄。（planned）
- **正向**：第二个 resume 得到 session/writer-held，原 writer 不受影响。（planned）
- **拒绝**：列表实现为每行 stat 或打开冷 body。 → 评审拒绝；应只读 header/投影缓存。（planned）
- **拒绝**：archived Session 的 pre-step 仍发起模型请求。 → gate 拒绝并标记 blocked。（planned）
- **恢复**：关闭原 writer 后重新 resume；或对 archived Session 先 unarchive。（planned）

**已知限制**：未运行真实 Session 服务；activation 例外清单以 README 为准。

**源证据**：
- `deepseek-harness/packages/api/session-controller/README.md:28-77@687f282e`（instruction）
- `deepseek-harness/packages/session-query/session-query/README.md:26-69@687f282e`（instruction）
- `deepseek-harness/packages/session/working-directory/README.md:37-50@687f282e`（instruction）
- `deepseek-harness/packages/experimental/translator/README.md:54-73@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-subagent/README.md:38-41@687f282e`（instruction）

---

### M21 Remote 访问控制、owner fence 与受信 seam 的授权责任 {#package-contracts-4.trusted-seam-authorization-delegation}

**问题**：不同服务对“已授权”的假设不同：有的按 remote-access 策略逐资源鉴权，有的只做 owner fence 并把 per-session 约束留给调用方；若把后者当前者，任何连接的浏览器或新工具都能越权读取或终止。

**何时读**：
- 暴露 Remote 流或命令
- 新增模型侧查询/终止工具
- 多浏览器/多标签访问
- 实现 Session 列表与 lineage 预览

**必须做到（源义务）**：
1. session-controller 的每个 Remote endpoint 都受 dsh-api-remote-access 策略约束：非 owner 的 Peer 必须在调用触及的每个资源上获得列出该 action 的 role；owner 结果不过滤。
2. session/page、session/follow 声明 session 资源（普通地址读 sessionId，子代理地址读 childSessionId）；session/projections 读 request.sessionId；session/list、session/search、session/control 不读资源，因而需要 global role，且非 owner 只返回策略允许的行、命中与 baseline。
3. session/prompt 记录非 owner 的 principal；没有 principal 的 source 属于 owner。是否允许父 Session 访问覆盖其 children 由策略决定。
4. job-controller 不提供 per-session 鉴权：job.list、job.follow、job.kill 是 ctx.jobs 的投影，per-session fence 依赖调用方传入的 sessionId，Remote 层服务任何已连接浏览器；新消费者必须自行约束。
5. job 可见性由 owner fence 决定：Session 只看到自己的 job 与无主 job；不可见 id 返回 job/not-found；人工 kill 不抑制 Agent 完成通知，模型自己的 kill 才可抑制。
6. session-query 是受信上下文基础设施，不提供 caller authorization；模型工具或 UI 必须自行约束可检查的 Session 集合。
7. Session 媒体端点是特例：GET|HEAD /api/file 经 authenticated connection.fetch 读 ctx.fs，既不做目录 containment 也不做 MIME 分类；必须依赖认证通道、20 MiB 上限与 private/no-store、nosniff、sandbox CSP。
8. UI 的当前 Session 权限控制与 General settings 的未来默认必须分离，不得用一个写入另一个。
9. 需要 live Agent registry 与 job registry 的控制器在缺少依赖时应加载失败，而不是降级为无约束读。
10. `openWorkspacePath({ path, action })` 与 reveal 委托只允许当前组合的 `filesystem` 把请求的 Host 路径映射到同一规范进程路径；未映射的 remote path 在执行任何原生命令前拒绝。

**角色**：Remote/服务作者、模型工具作者、UI 作者、安全评审者

**操作步骤**：
1. 为每个入口标注信任级别：是否已鉴权、谁是 caller、需要什么 fence。
2. 把 sessionId 作为显式参数贯穿 registry get/readAt/kill，并测试不可见 id 的响应。
3. 区分人类动作与模型动作的通知语义，并在结果中保留原因。
4. 对每个 UI 控制确认它写的是当前 Session 还是未来默认。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`service-contract-plus-review`。实现：dsh-api-remote-access 的 resource/action 策略、Session Remote 资源声明、job registry owner fence 与 job 投影；媒体端点 CSP/上限。 可验证性：需要多 Session/多连接场景的实际验证；README 不能证明没有跨 Session 泄露。 失败模式：把 owner-fence-only 服务当逐资源鉴权会越权；把媒体端点当有目录 containment 会泄露任意宿主文件；混淆人工/模型 kill 会丢失或重复完成通知。 例外：无主 job 对所有 Session 可见是刻意设计；这是可见性规则，不是鉴权缺陷。

**适用范围**：适用于本地/远程 UI 共享 Host 服务的产品。 采用方若已有网关鉴权，仍需保留“服务内 per-resource fence”作为第二层。

**相关机制**：
- 与 [session-activation-and-write-ownership](#package-contracts-4.session-activation-and-write-ownership) 的 writer 所有权相关。
- 与 [trusted-seam-authorization-delegation](#package-contracts-4.trusted-seam-authorization-delegation) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：先标注每个端点的授权模型（逐资源策略 / owner fence / trusted caller），再为每类资源建立显式 fence 与负向测试。
- 实施：为 session/page/follow/projections/list/search/control 写非 owner 可见性断言；为 job 不可见 id 写 not-found；为媒体端点写无 containment、CSP 与上限测试。
- 需要：Remote 契约、owner fence、显式 caller 参数

**验证计划（status: planned；未执行）**：
- **正向**：会话 A 请求 job.list 只得到自己的与无主 job；kill 不可见 id 返回 job/not-found。（planned）
- **正向**：人工 kill 后 Agent 完成通知仍到期，并在工具结果中带 `[stopped: cancelled by the user]`。（planned）
- **拒绝**：Remote 层向任意浏览器返回所有 Session 详情且无 fence。 → 评审拒绝；必须由调用方参数 fence。（planned）
- **拒绝**：模型工具复用 session-query 却不限制可检查 Session。 → 指出 trusted 服务不提供授权。（planned）
- **恢复**：补上 sessionId fence 或工具层 allowlist，并重新验证不可见资源。（planned）

**已知限制**：未启动多客户端/Remote 场景；具体鉴权层次以子系统文档为准。

**源证据**：
- `deepseek-harness/packages/api/session-controller/README.md:28-77@687f282e`（instruction）
- `deepseek-harness/packages/api/job-controller/README.md:9-12@687f282e`（instruction）
- `deepseek-harness/packages/api/job-controller/README.md:23-42@687f282e`（instruction）
- `deepseek-harness/packages/api/job-controller/README.md:51-67@687f282e`（instruction）
- `deepseek-harness/packages/session-query/session-query/README.md:142-166@687f282e`（instruction）

---

### M22 凭据来源、写-only 存储与 Origin 绑定 {#package-contracts-4.credential-origin-and-secret-boundary}

**问题**：把密钥写进 patch、配置文件或日志，或让回调/重定向把凭据送到错误 Origin，都会造成不可撤回的泄露；删除凭据时误删非本页拥有的引用同样会破坏部署。

**何时读**：
- 实现登录/凭证编辑
- 配置第三方 API key
- 处理 OAuth 回调或远程 token
- 清理 provider 行

**必须做到（源义务）**：
1. API key 只经 credentials.set 写-only 存储；页面从不把存储值读回输入框，也不把 key 写入 cordis.patch.yml。
2. 凭据引用按导出的 `<ROUTE>_API_KEY` 目标派生；删除只在 profile 明确指向该精确目标时移除配置的、可写凭据；自定义引用、环境凭据与不可识别目标保留。
3. 端点/Origin 只有一个配置所有者；HTTPS 必需，仅显式 loopback 开发允许 HTTP；重定向必须失败且不转发头。
4. 账户 grant 的 issuer 必须匹配 platformOrigin；不匹配的本地 grant 在 provider 初始化时删除，启动继续以登出状态运行且不发远程 logout。
5. 敏感头、凭据值、请求/响应体、授权 URL 与原始异常不进入诊断；只记录端点路径、状态、失败阶段与校验码。
6. MCP stdio 子进程环境先清洗 credential-shaped 变量与 DSH_*，再合并显式 env；显式覆盖保留。
7. 空 key 或无可用 endpoint 时 provider 必须不可用并返回结构化错误，而不是以空凭据发起请求。
8. API key 在 trim 后必须非空且每个字符为可打印 ASCII（\\x21-\\x7E，HTTP header 可携带范围）；粘贴的 NAME=value 环境行或成对引号同样拒绝。登出重试最多 5 次、指数退避 1/2/4/8/16s，shutdown 中止并等待，未决撤销不持久化。

**角色**：provider 作者、UI 作者、部署者、安全评审者

**操作步骤**：
1. 确定 secret 的唯一写入路径（credentials.set）与唯一读取者（provider），UI 只拿 redacted 描述。
2. 把 Origin/endpoint 收敛为单一配置字段，并验证回调、重定向、token 使用都绑定该 Origin。
3. 为删除/冲突/失败设计幂等路径；测试自定义引用与环境凭据不会被误删。
4. 审计诊断输出与子进程环境，确认无 secret 字段。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`runtime-boundary-plus-review`。实现：deepseek-account-platform 的 grant/headers/诊断、ui-settings-models 的写-only 编辑与冲突处理、mcp-client 的环境清洗。 可验证性：需要真实登录/配置写入与环境检查；README 不能证明没有 header/body 泄露。 失败模式：key 进入源码控制或日志会长期泄露；不匹配 issuer 的 grant 会被错误 Origin 使用；误删自定义引用会破坏第三方部署。 例外：显式 requestHeaders 可携带部署 cookie，但必须存于私有配置/环境变量且排除在 UI 状态外。；loopback HTTP 仅用于开发，不能认证生产 API。

**适用范围**：适用于所有需要用户或部署者提供 secret 的集成。 采用方若使用平台密钥管理，仍必须保留写-only 与 Origin 绑定语义。

**相关机制**：
- 与 [mcp-bridge-identity](#package-contracts-4.mcp-bridge-identity)、[external-provider-provenance](#package-contracts-4.external-provider-provenance) 相关。
- 与 [trusted-seam-authorization-delegation](#package-contracts-4.trusted-seam-authorization-delegation) 共享显式信任边界。

**迁移设计（非源义务，采用时可选）**：
- 策略：把 secret 的写入、读取、删除与传输全部收敛到单一所有者，并用 Origin 校验约束使用。
- 实施：为 key 输入/保存/删除写字段级测试；为回调与 401 写 grant 生命周期测试；诊断做负向断言。
- 需要：写-only 凭据存储、Origin 配置、redacted 描述、错误分类

**验证计划（status: planned；未执行）**：
- **正向**：保存 API key 后输入框为空；凭据仅由 provider 读取；patch 中只有 apiKeyEnv 引用。（planned）
- **正向**：issuer 不匹配的 grant 启动时被本地删除，应用以 signed-out 继续。（planned）
- **拒绝**：把 key 写入 cordis.patch.yml 或在诊断中记录 Authorization/body。 → 评审阻断；属泄露。（planned）
- **拒绝**：删除 provider 时移除自定义引用或环境凭据。 → 拒绝；只能删除精确派生目标。（planned）
- **恢复**：轮换已泄露凭据，改回 credentials.set，并补充诊断脱敏测试。（planned）

**已知限制**：未执行登录/OAuth；Platform 端点与重试细节以 README 与源码为准。 账户平台的产品错误 UI 仍以 `TODO(product-error-ui)` 延期：业务失败暂用通用“操作失败，请重试”兜底，其他 code 与 HTTP 错误同；采用方需自行定义 biz_code 的本地化文案与交互。

**源证据**：
- `deepseek-harness/packages/credentials/deepseek-account-platform/README.md:33-70@687f282e`（instruction）
- `deepseek-harness/packages/credentials/deepseek-account-platform/README.md:91-108@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-settings-models/README.md:42-49@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-settings-models/README.md:92-97@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-settings-models/README.md:130-152@687f282e`（instruction）
- `deepseek-harness/packages/web/web-search-exa/README.md:30-33@687f282e`（instruction）
- `deepseek-harness/packages/mcp/mcp-client/README.md:135-143@687f282e`（instruction）

---

### M23 客户端投影、局部回声与页面级故障边界 {#package-contracts-4.client-projection-and-live-ownership}

**问题**：浏览器 UI 若持有 durable 运行状态、在重载后恢复旧 bundle，或把局部 echo 当成权威消息，会在重连、换页或多标签时显示错误状态甚至重复提交。

**何时读**：
- 实现聊天与历史投影
- 本地提交与回声
- 热重载或换页
- 多标签审批
- 设置页并发编辑

**必须做到（源义务）**：
1. 客户端状态来自 Host 投影；局部 transcript 与 steering echo 只暂存，authoritative 记录到达时原子替换；跨客户端 steering 顺序以 Inbox 为准。
2. 聊天显示模式只影响折叠与预览，不隐藏最终答案，也不改写已记录事件或 Trajectory。
3. 热重载重新执行 bundle 并重挂组件：插件内 React 状态丢失，session、workspace、connection 状态保留；替换失败不回滚旧 bundle，故障是页面局部且可从插件列表重试。
4. UI 不把 run 状态放组件 state；事实归可关闭它的 observable；面板全局是因为阻塞模型的审批不能只存在于某个 Session 的 transcript。
5. 审批是 frame-wide 的：任何标签可回答，第一个答案获胜，其余收敛；不声称按标签隔离。
6. 清单与目录读取必须 single-flight；连接 reset 丢弃在途读并释放槽位，重连不得发布旧 Host 的行。
7. 设置写入带 revision；并发或外部编辑以 settings/conflict 拒绝；保存后采用返回的 redacted 子树与 revision。
8. 当前 Session 控制与未来默认控制分离：斜杠命令改当前，General settings 只改未来；catalog 撤回时关闭待确认并显示当前值。
9. 权限 catalog 每个连接 generation 只发布最新完整成功；失败或 reset 清除旧快照并隐藏 composer seat，stale generation 与 disposed 结果忽略，slash picker 保留失败与重试。
10. 配额通知是 frame-wide 的：claim 条目可用 keepOpen() 持有，release 只释放自己的 hold；dismiss/sign-out 清空所有 hold，丢弃的通知不重放。
11. 显示扩展必须保留原始 reasoning 文本访问，不得替换 reasoning preview 或 disclosure policy；migration-required 行在展开前显示提示且保留历史打开动作，不得伪造 catalog。
12. 非人工轮次触发的独立通知必须是带边框、使用对比中性底色的 `notice`；其他 command row 留在 Chat。

**角色**：UI 作者、投影作者、评审者

**操作步骤**：
1. 为每类客户端状态标注权威来源（Host 投影、本地 echo、组件状态）与清除条件。
2. 把整页或整面板故障与单插件故障分开；重载失败保持页面其余部分工作。
3. 为多标签审批与设置冲突定义第一答案获胜与冲突可见。
4. 为 HMR 明确哪些状态必须跨重载保留，哪些允许丢失。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`client-runtime-contract`。实现：ui-chat 的 echo 替换与折叠、hmr 的 swap 与 failure、ui-cordis 的单飞清单、settings 的 revision 写。 可验证性：需要真实多标签、重载与断线场景；README 不能证明 UI 不持有运行状态。 失败模式：把 echo 当权威会重复或错序；失败回滚 bundle 会掩盖导入错误；组件持有 run 状态会在重挂后丢失审批上下文。 例外：页面局部故障不阻塞 Host 其他 Session；审批的 frame-wide 可见性是刻意设计。；HMR 的 React 状态丢失是明确取舍。

**适用范围**：适用于任何 Host 与 Client 分离、可重连的 UI。 采用方若不支持 HMR，仍应保留权威投影替换 echo 与故障局部化。

**相关机制**：
- 与 [session-activation-and-write-ownership](#package-contracts-4.session-activation-and-write-ownership)、[trusted-seam-authorization-delegation](#package-contracts-4.trusted-seam-authorization-delegation) 相关。
- 与 [durable-value-canonicalization](#package-contracts-4.durable-value-canonicalization) 共享快照语义。

**迁移设计（非源义务，采用时可选）**：
- 策略：把 UI 状态按权威性分层，并把重载、断线、多标签定义为契约而非实现细节。
- 实施：写 echo 替换、单飞读、revision 冲突与 HMR 失败测试；对多标签审批写收敛断言。
- 需要：Host 投影、可重连 transport、single-flight 读、revision 写

**验证计划（status: planned；未执行）**：
- **正向**：断线重连后本地 echo 被 Host 行替换且不重复显示；设置外部编辑触发 conflict 并刷新。（planned）
- **正向**：HMR 替换失败后页面其余插件继续工作，插件列表可重试。（planned）
- **拒绝**：把局部 echo 当权威并在 durable 记录到达后保留两份。 → 评审拒绝；必须原子替换。（planned）
- **拒绝**：HMR 失败时悄悄恢复旧 bundle 或整页崩溃。 → 指出故障必须页面局部且可见。（planned）
- **恢复**：重新读取清单或目录并让用户重试；冲突后采用服务端 revision 重放编辑。（planned）

**已知限制**：未运行浏览器与多标签测试；HMR 细节继承 client modules。 ui-chat README 的 notice 样式句只有英文承载（en:53：bordered notices / contrasting neutral background；zh:53 只写“独立通知”）；实现 `TurnTriggerNodeView.module.css` 确有 border 与专用背景。中文未否定该样式，但 pair 不完整；迁移需保留样式并记录源限制。

**源证据**：
- `deepseek-harness/packages/client/hmr/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/client/hmr/README.md:34-37@687f282e`（instruction）
- `deepseek-harness/packages/client/hmr/README.md:72-75@687f282e`（instruction）
- `deepseek-harness/packages/client/hmr/README.md:109-128@687f282e`（instruction）
- `deepseek-harness/packages/extensions/ui-cordis/README.md:54-57@687f282e`（instruction）
- `deepseek-harness/packages/extensions/ui-cordis/README.md:73-81@687f282e`（instruction）
- `deepseek-harness/packages/extensions/ui-cordis/README.md:103-126@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-chat/README.md:87-99@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-chat/README.md:100-128@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-chat/README.md:129-175@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-chat/README.md:184-206@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-permission-presets/README.md:30-35@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-permission-presets/README.md:36-42@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-permission-presets/README.md:75-94@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-settings-models/README.md:92-97@687f282e`（instruction）
- `deepseek-harness/packages/client/ui-chat/README.md:53-53@687f282e`（instruction）

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:757-1100@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1180-1318@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1376-1500@687f282e`


## 2.E 外部结果与发布

### M24 外部提供者的原生结果、可移植片段与诚实缺失 {#package-contracts-4.external-provider-provenance}

**问题**：把供应商专有字段或生成的答案伪装成统一结果，会制造不可引用的来源；省略无法映射的内容而不标注，会让调用方以为结果完整。

**何时读**：
- 接入搜索、抓取或翻译等外部 API
- 映射供应商结果到统一模型
- 处理无答案或空字段
- 排查结果数量少于请求

**必须做到（源义务）**：
1. 适配器只映射可移植字段：URL、标题、真实 highlight 作为 snippet、publication date；没有可移植片段的结果丢弃，不凭空生成。
2. 供应商不返回生成答案时，省略 content 而不是编造 prose；结果数量可以少于请求数，调用方必须容忍。
3. maxResults 先作为成本与延迟优化传给供应商，最终上限由服务截断并标记；两层限制都要可实现。
4. 失败分类稳定：HTTP、网络、不可解析或形状错误归 provider error；请求中止归 aborted；重定向在联系目标前失败。
5. 供应商原生控制面不泄漏进通用接口；需要新控制时先加 provider-neutral 字段，而不是供应商专用参数。
6. 实验性或非官方端点必须标注无保证；auth 环境变量缺失或 endpoint 不可解析时 provider 整体不可用并返回结构化错误。

**角色**：provider 适配器作者、服务 seam 维护者、评审者

**操作步骤**：
1. 列出供应商字段到统一字段的映射，以及不可映射时的丢弃规则。
2. 确保失败、中止、重定向走稳定错误码，而不是 message 文本。
3. 实现服务层最终上限与标记；不要只依赖供应商参数。
4. 在参考文档中记录结果可能少于请求的可操作后果。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`adapter-contract-plus-review`。实现：web-search-exa 的映射、错误分类与 redirect:error，web 服务的最终截断，translator 的端点与实验限制。 可验证性：需要真实供应商响应与异常；README 不能证明没有编造字段。 失败模式：伪造 snippet 或 answer 会让模型引用不存在的内容；把重定向或中止混入 provider error 会让重试策略错误。 例外：结果无 highlight 时丢弃是刻意取舍；调用方看到少于请求数不是 bug。

**适用范围**：适用于任何把第三方结果映射进内部统一模型的适配器。 采用方可用不同供应商，但必须保留可移植字段、诚实缺失与稳定错误。

**相关机制**：
- 与 [credential-origin-and-secret-boundary](#package-contracts-4.credential-origin-and-secret-boundary)、[experimental-status-opt-in-and-promotion](#package-contracts-4.experimental-status-opt-in-and-promotion) 相关。

**迁移设计（非源义务，采用时可选）**：
- 策略：把统一结果定义为可移植子集，无法映射就丢弃并计数，而不是补造。
- 实施：为映射、丢弃、错误与重定向写 fixture 测试；验证服务层最终上限。
- 需要：统一结果 schema、provider 注册、稳定错误码

**验证计划（status: planned；未执行）**：
- **正向**：无 highlight 的结果被丢弃；返回 3 条而非请求 5 条，且无 content 字段。（planned）
- **正向**：重定向在联系 Location 前以 provider error 失败。（planned）
- **拒绝**：用标题拼接一个 snippet，或伪造生成答案。 → 评审拒绝；属伪造来源。（planned）
- **拒绝**：把中止归类为普通 provider error 并允许自动重试。 → 指出分类错误。（planned）
- **恢复**：调整查询或 provider 配置以获取更多真实 highlight；重试仅在 provider error 时进行。（planned）

**已知限制**：未调用真实供应商；错误码与上限以 web 子系统为准。

**源证据**：
- `deepseek-harness/packages/web/web-search-exa/README.md:10-13@687f282e`（instruction）
- `deepseek-harness/packages/web/web-search-exa/README.md:55-58@687f282e`（instruction）
- `deepseek-harness/packages/web/web-search-exa/README.md:73-79@687f282e`（instruction）
- `deepseek-harness/packages/web/web-search-exa/README.md:119-142@687f282e`（instruction）
- `deepseek-harness/packages/experimental/translator/README.md:103-124@687f282e`（instruction）
- `deepseek-harness/packages/experimental/translator/README.md:10-13@687f282e`（instruction）

---

### M25 已安装产物发布的分离授权与证据链 {#package-contracts-4.installed-artifact-test-provenance}

**问题**：测试二进制上传若同时发布 feed，或复用未绑定材料的旧 receipt，就会把上传成功误当已发布；并发发布者或崩溃残留锁会造成不可复现的远程状态。

**何时读**：
- 发布或更新测试 feed
- 上传安装包与 blockmap
- 处理发布锁或失败恢复
- 审计发布证据

**必须做到（源义务）**：
1. 上传与发布分离：先上传两个已验证版本但不上架 v2；操作员启动已安装 v1 后才发布其 fixed feed。
2. 默认命令只做本地材料检查，无凭据与网络；实际 COS 写必须单独授权并在交互终端输入确认串。
3. 发布器重新校验 receipt 与当前 installer、blockmap、feed、manifest 字节；绝不签名或安装。
4. 二进制上传要求桶版本查询成功且非 enabled 或 suspended；feed 发布复用成功的上传 receipt，不重复查询或下载；缺失、失败或不匹配 receipt 停止发布。
5. 一个发布器跨所有机器；本地 publication.lock 只排除同材料目录的重叠操作，不跨机器；feed 读改写不是原子 CAS，禁止其他发布者并发写同一 feed。
6. 证据保留 plan、阶段时间戳、最终结果与 feed body；不含原始 SDK 错误或授权头；失败停止后续写，超时不证明服务器拒绝先前写。
7. 403 按精确 API 诊断（GetBucketVersioning、GetObject、PutObject 权限不同）；读取成功不证明写权限；不要为省一次预检扩大最小权限身份。
8. alreadyPublished:true 只表示对既有目标 feed 的对账，不是新发布；异常 feed 字节停止操作；崩溃残留锁需确认无发布者后由操作员删除精确空目录。
9. 只读 local-file planner 校验 qualification run 版本、`nightly.yml` 唯一 installer、installer/blockmap 存在非空以及 feed filename/path/size/SHA-512/releaseDate，再从验证值重建 feed。结果显式 `verified:'file-integrity-only'`、`publicationAuthorized:false`，不证明签名、应用身份、包内容、启动或发布授权。builder 生成计划，package verification 重新 plan；发布器也重新运行 planner，比对成功 receipt、`inputs.distribution`、`inputs.manifestSha512` 与当前字节，写前再次重验。

**角色**：发布操作员、发布工具作者、审计者

**操作步骤**：
1. 完成两个版本的本地验证并保留 result.json 与原始材料。
2. 分别授权上传，确认输出与回读；保持 feed 缺失并完成 404 用例。
3. 安装并启动 v1，确认版本与 journal；授权 v1 feed 并回读。
4. 保留证据、请求单独授权，再发布 v2；提供 journal 目录并独立确认 v1 仍在运行。
5. 失败时保留记录与远程对象，检查最后阶段与真实远程状态，再请求下一次授权。

**完成信号（迁移验收）**：义务清单全部有实现或评审载体；拒绝场景至少真实执行一次；例外与限制已记录。

**强制方式**：`operator-gated-release`。实现：publish-installed-update.ts 的默认 plan、--execute 确认、receipt 复用校验、lock 与证据记录。 可验证性：测试用内存 store 与替代 HTTP handler，不证明真实 COS 写；只有操作员授权运行才产生远程事实。 失败模式：上传即发布会让未验证版本被广告；复用旧 receipt 会把不同字节当同一材料；并发发布会产生不可审计覆盖。 例外：版本化桶中 x-cos-forbid-overwrite 不保护对象；已存在同字节对象回读而非覆盖，不同字节停止。

**适用范围**：适用于任何需要人工授权的外部发布或上传流程。 采用方可用不同存储，但必须保留上传与发布分离、receipt 绑定字节、证据保留、失败停止。

**相关机制**：
- 与 [vendor-and-platform-package-boundary](#package-contracts-4.vendor-and-platform-package-boundary) 的产物验证相关。
- release 域的发布门槛机制与本机制重叠，属 cross-domain。

**迁移设计（非源义务，采用时可选）**：
- 策略：把发布拆成可审计阶段，并把授权与证据做成工具强制而非操作员记忆。
- 实施：默认 dry-run；确认串绑定 run 与 version；receipt 与 plan 哈希绑定；锁与超时；负向测试覆盖缺 receipt、字节不匹配、403。
- 需要：本地验证 receipt、对象存储版本查询、操作员授权、证据目录

**验证计划（status: planned；未执行）**：
- **正向**：无 --execute 只打印 plan；上传后 feed 仍缺失；发布只接受匹配 receipt。（planned）
- **拒绝**：上传命令顺带发布 feed，或用旧 receipt 发布新字节。 → 评审阻断；违反分离与证据绑定。（planned）
- **恢复**：保留记录与对象，按精确 API 修权限后重新授权；确认无发布者后删除残留空锁。（planned）

**已知限制**：未执行任何 COS 或网络操作；测试不证明真实远程写；planner 与 package verification 的 re-plan 比较也未执行。`file-integrity-only` 不证明 installer 签名、应用身份、包内容或实际发布；发布门槛的 canonical 归属见 release 域。

**源证据**：
- `deepseek-harness/apps/desktop/tests/installed-update/publication/README.md:9-12@687f282e`（instruction）
- `deepseek-harness/apps/desktop/tests/installed-update/publication/README.md:22-33@687f282e`（instruction）
- `deepseek-harness/apps/desktop/tests/installed-update/publication/README.md:34-55@687f282e`（instruction）
- `deepseek-harness/apps/desktop/tests/installed-update/publication/README.md:56-67@687f282e`（instruction）
- `deepseek-harness/apps/desktop/scripts/installed-update-distribution.ts:1-74@687f282e`（implementation）
- `deepseek-harness/apps/desktop/scripts/installed-update-publication.ts:60-72@687f282e`（implementation）


## 3. 全量英文 README 证据索引

每个文件均为全文读取；行数为该文件 EOF（换行字节计数；无尾换行时计最后一行）。机制列链接到 §2。

| README | 行数 | 关联机制 |
|---|---:|---|
| `apps/desktop/tests/installed-update/publication/README.md` | 72 | [M25](#package-contracts-4.installed-artifact-test-provenance) |
| `native/system/packages/linux-arm64/README.md` | 11 | [M03](#package-contracts-4.package-role-and-library-boundary) [M05](#package-contracts-4.vendor-and-platform-package-boundary) |
| `packages/api/job-controller/README.md` | 67 | [M21](#package-contracts-4.trusted-seam-authorization-delegation) |
| `packages/api/session-controller/README.md` | 137 | [M15](#package-contracts-4.model-selection-and-session-pin) [M20](#package-contracts-4.session-activation-and-write-ownership) [M21](#package-contracts-4.trusted-seam-authorization-delegation) |
| `packages/bundle/README.md` | 45 | [M01](#package-contracts-4.profile-bundle-composition) |
| `packages/bundle/web-app/README.md` | 188 | [M01](#package-contracts-4.profile-bundle-composition) |
| `packages/client/hmr/README.md` | 128 | [M23](#package-contracts-4.client-projection-and-live-ownership) |
| `packages/client/ui-chat/README.md` | 206 | [M23](#package-contracts-4.client-projection-and-live-ownership) |
| `packages/client/ui-permission-presets/README.md` | 94 | [M23](#package-contracts-4.client-projection-and-live-ownership) |
| `packages/client/ui-settings-models/README.md` | 152 | [M23](#package-contracts-4.client-projection-and-live-ownership) [M22](#package-contracts-4.credential-origin-and-secret-boundary) [M15](#package-contracts-4.model-selection-and-session-pin) |
| `packages/client/ui-sidebar-terminal/README.md` | 88 | [M10](#package-contracts-4.shell-execution-contracts) |
| `packages/client/ui-subagent/README.md` | 128 | [M20](#package-contracts-4.session-activation-and-write-ownership) |
| `packages/compaction/compaction-tool-result-pruner/README.md` | 148 | [M08](#package-contracts-4.output-retention-honesty) |
| `packages/context/time-context/README.md` | 150 | [M18](#package-contracts-4.time-context-injection) |
| `packages/core/agent-default-model/README.md` | 126 | [M15](#package-contracts-4.model-selection-and-session-pin) |
| `packages/core/agent-tool-presentation/README.md` | 119 | [M07](#package-contracts-4.tool-registration-and-policy) |
| `packages/core/tools/README.md` | 250 | [M07](#package-contracts-4.tool-registration-and-policy) |
| `packages/credentials/deepseek-account-platform/README.md` | 108 | [M22](#package-contracts-4.credential-origin-and-secret-boundary) |
| `packages/experimental/agent-team/README.md` | 225 | [M04](#package-contracts-4.experimental-status-opt-in-and-promotion) |
| `packages/experimental/browser-use-chrome-devtools-mcp/README.md` | 116 | [M04](#package-contracts-4.experimental-status-opt-in-and-promotion) |
| `packages/experimental/client-ui-agent-team/README.md` | 102 | [M04](#package-contracts-4.experimental-status-opt-in-and-promotion) |
| `packages/experimental/session-search/README.md` | 82 | [M04](#package-contracts-4.experimental-status-opt-in-and-promotion) [M01](#package-contracts-4.profile-bundle-composition) |
| `packages/experimental/terminal-bundle/README.md` | 78 | [M04](#package-contracts-4.experimental-status-opt-in-and-promotion) |
| `packages/experimental/translator/README.md` | 124 | [M04](#package-contracts-4.experimental-status-opt-in-and-promotion) [M24](#package-contracts-4.external-provider-provenance) [M20](#package-contracts-4.session-activation-and-write-ownership) |
| `packages/experimental/worktree/README.md` | 98 | [M13](#package-contracts-4.worktree-isolation-and-retention) |
| `packages/extensions/ui-cordis/README.md` | 126 | [M23](#package-contracts-4.client-projection-and-live-ownership) |
| `packages/fs/fs-local/README.md` | 149 | [M12](#package-contracts-4.filesystem-mutation-integrity) |
| `packages/fs/tool-str-replace-editor/README.md` | 149 | [M12](#package-contracts-4.filesystem-mutation-integrity) [M07](#package-contracts-4.tool-registration-and-policy) |
| `packages/llm/plugin-package-inventory-deepseek/README.md` | 78 | [M06](#package-contracts-4.runtime-package-inventory) |
| `packages/mcp/mcp-client/README.md` | 229 | [M22](#package-contracts-4.credential-origin-and-secret-boundary) [M09](#package-contracts-4.mcp-bridge-identity) [M02](#package-contracts-4.service-seam-single-owner) |
| `packages/plan/README.md` | 49 | [M03](#package-contracts-4.package-role-and-library-boundary) |
| `packages/preset/README.md` | 44 | [M01](#package-contracts-4.profile-bundle-composition) |
| `packages/session-query/session-query/README.md` | 166 | [M02](#package-contracts-4.service-seam-single-owner) [M20](#package-contracts-4.session-activation-and-write-ownership) [M21](#package-contracts-4.trusted-seam-authorization-delegation) |
| `packages/session/session-format-v3-to-v4/README.md` | 350 | [M03](#package-contracts-4.package-role-and-library-boundary) |
| `packages/session/working-directory/README.md` | 90 | [M20](#package-contracts-4.session-activation-and-write-ownership) |
| `packages/shell/README.md` | 51 | [M11](#package-contracts-4.sandbox-fail-closed-and-escalation) [M02](#package-contracts-4.service-seam-single-owner) |
| `packages/shell/bash-local/README.md` | 152 | [M08](#package-contracts-4.output-retention-honesty) [M11](#package-contracts-4.sandbox-fail-closed-and-escalation) [M10](#package-contracts-4.shell-execution-contracts) |
| `packages/shell/pwsh-sandbox/README.md` | 152 | [M11](#package-contracts-4.sandbox-fail-closed-and-escalation) |
| `packages/shell/tool-bash-persistent/README.md` | 160 | [M10](#package-contracts-4.shell-execution-contracts) [M07](#package-contracts-4.tool-registration-and-policy) |
| `packages/subagent/README.md` | 50 | [M16](#package-contracts-4.subagent-capability-negotiation) |
| `packages/subagent/subagent-acp/README.md` | 176 | [M02](#package-contracts-4.service-seam-single-owner) [M16](#package-contracts-4.subagent-capability-negotiation) [M17](#package-contracts-4.subagent-isolation-and-result-boundary) |
| `packages/subagent/subagent-claude-code/README.md` | 190 | [M01](#package-contracts-4.profile-bundle-composition) [M16](#package-contracts-4.subagent-capability-negotiation) [M17](#package-contracts-4.subagent-isolation-and-result-boundary) |
| `packages/subagent/subagent-dsh-sdk/README.md` | 187 | [M16](#package-contracts-4.subagent-capability-negotiation) [M17](#package-contracts-4.subagent-isolation-and-result-boundary) |
| `packages/terminal/terminal-bash/README.md` | 183 | [M11](#package-contracts-4.sandbox-fail-closed-and-escalation) [M10](#package-contracts-4.shell-execution-contracts) |
| `packages/util/README.md` | 65 | [M03](#package-contracts-4.package-role-and-library-boundary) |
| `packages/util/crypto/README.md` | 69 | [M03](#package-contracts-4.package-role-and-library-boundary) |
| `packages/util/deque/README.md` | 103 | [M03](#package-contracts-4.package-role-and-library-boundary) |
| `packages/util/output-retention/README.md` | 167 | [M08](#package-contracts-4.output-retention-honesty) |
| `packages/util/time/README.md` | 68 | [M19](#package-contracts-4.durable-value-canonicalization) [M18](#package-contracts-4.time-context-injection) |
| `packages/util/values/README.md` | 102 | [M19](#package-contracts-4.durable-value-canonicalization) |
| `packages/web/web-search-exa/README.md` | 142 | [M22](#package-contracts-4.credential-origin-and-secret-boundary) [M24](#package-contracts-4.external-provider-provenance) |
| `packages/workflow/workflow-ptc/README.md` | 169 | [M16](#package-contracts-4.subagent-capability-negotiation) [M17](#package-contracts-4.subagent-isolation-and-result-boundary) [M14](#package-contracts-4.workflow-engine-and-confinement) |
| `packages/workflow/workflow/README.md` | 142 | [M02](#package-contracts-4.service-seam-single-owner) [M14](#package-contracts-4.workflow-engine-and-confinement) |
| `vendor/timer/README.md` | 36 | [M05](#package-contracts-4.vendor-and-platform-package-boundary) |

## 4. 中文 counterpart 与侧车记账

- 53 个中文 counterpart 与英文逐文件配对：行数一致、H2 数量一致（本轮脚本核对）；正文用只读并行审阅逐节比对；另按 CJK 2 列宽度扫描，17 行 ≥768 列的溢出行已 raw 复核（session-controller 7 行、settings-models 3 行等）。未发现需要新增机制的中文独立义务；5 处双侧差异见下，不以英文自动胜出。

中英同权（`deepseek-harness/docs/i18n/README.md:9-9@687f282e`；`deepseek-harness/docs/i18n/README.zh.md:11-11@687f282e`）。若两侧实质不一致，谁也不默认胜出，需修正错的一侧（`deepseek-harness/docs/i18n/translation-rules.md:9-9@687f282e`；中文同条 `deepseek-harness/docs/i18n/translation-rules.zh.md:9-9@687f282e`）。以下 5 处已按双侧行号与实现/契约复核；en:/zh: 行号分别指同名列的 README.md / README.zh.md；先前以英文为优先的旧标注作废。

| 文件（en / zh） | 类型 | 两侧差异 | 实现/契约证据 | 采用处理 |
|---|---|---|---|---|
| `deepseek-harness/packages/client/ui-chat/README.md` / `deepseek-harness/packages/client/ui-chat/README.zh.md` | 单侧缺句 | en:53 要求 bordered notices / contrasting neutral background；zh:53 只写“独立通知” | `deepseek-harness/packages/client/ui-chat/src/client/chat/TurnTriggerNodeView.module.css:1-6@687f282e`：border + 专用 turn-trigger 背景 | 中文未否定该样式，但 pair 不完整；迁移保留该样式并记录源限制 |
| `deepseek-harness/packages/client/ui-sidebar-terminal/README.md` / `deepseek-harness/packages/client/ui-sidebar-terminal/README.zh.md` | 失败类被改写 | en:74 为 Shell discovery or native PTY startup；zh:74 为“默认 shell 或原生 PTY 启动失败” | `deepseek-harness/packages/client/ui-sidebar-terminal/src/client/TerminalGuide.tsx:14-18@687f282e`、`deepseek-harness/packages/client/ui-sidebar-terminal/src/client/TerminalGuide.tsx:28-46@687f282e`：loadShells 失败进入 failed 状态 | 两侧同权；迁移同时覆盖 discovery 失败与 PTY 启动失败 |
| `deepseek-harness/packages/client/ui-subagent/README.md` / `deepseek-harness/packages/client/ui-subagent/README.zh.md` | 限定词丢失 + 单侧增补颜色 | en:28 为 local child，zh:28 无 local；en:36 只写 shared success/idle dots，zh:36 增加绿/灰 | `deepseek-harness/packages/client/ui-primitives/src/StateDot.tsx:1-8@687f282e`、`deepseek-harness/packages/client/ui-primitives/src/StateDot.module.css:14-32@687f282e`：done=success 绿、idle=中性灰 | 颜色为兼容增补，按两侧合并实现；local 限定在实现中未找到对应分支，保留为未消解措辞差异，不得据此推断 remote child 可选 |
| `deepseek-harness/packages/experimental/translator/README.md` / `deepseek-harness/packages/experimental/translator/README.zh.md` | 中文句法歧义（非矛盾） | en:67 的 before dispatch 同时约束 owner、model-config、credential-reference change；zh:67 语序可能只约束“所有者” | `deepseek-harness/packages/experimental/translator/src/deepseek.ts:79-85@687f282e`：unchanged() 在 dispatch 前比较 fiber、modelConfig、Official apiKeyRef | 三类变化都触发 `TRANSLATION_UNAVAILABLE`；中文存在同义读法，记录歧义即可 |
| `deepseek-harness/packages/subagent/subagent-dsh-sdk/README.md` / `deepseek-harness/packages/subagent/subagent-dsh-sdk/README.zh.md` | 术语冲突（真实源限制） | en:106 为 its receipt cancels execution；zh:106 用“凭据”取消/清理，而 zh:48/79/114 用“凭据”指 credentials | `deepseek-harness/packages/subagent/subagent/src/types.ts:46-58@687f282e` 的 `SubagentActivation.dispose()`；`deepseek-harness/packages/subagent/subagent-acp/tests/subagent-acp.spec.ts:594-604@687f282e` 的 run.dispose() | 取消/等待者是 activation handle，非 credential；迁移禁止把 credential 当取消句柄 |

其余 48 个 pair 未发现需要记录的实质差异。语言同权不等于取交集：中文额外写明、且实现支持的细节（如 success 绿 / idle 灰）应保留；一侧缺句（ui-chat 样式）或改写失败类（sidebar discovery）则按上表的源限制处理。

- 53 个 `.i18n.yaml` 侧车：共 900 对 `en`/`zh` 哈希，全部均衡；侧车仅证明配对记录，不证明语义等价。本参考把侧车按 `generated` 分类，不从中提取机制。

| 中文文件 | 行数 | 英文对应 | 核对方式 |
|---|---:|---|---|
| `apps/desktop/tests/installed-update/publication/README.zh.md` | 72 | `apps/desktop/tests/installed-update/publication/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `native/system/packages/linux-arm64/README.zh.md` | 11 | `native/system/packages/linux-arm64/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/api/job-controller/README.zh.md` | 67 | `packages/api/job-controller/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/api/session-controller/README.zh.md` | 137 | `packages/api/session-controller/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/bundle/README.zh.md` | 45 | `packages/bundle/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/bundle/web-app/README.zh.md` | 188 | `packages/bundle/web-app/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/client/hmr/README.zh.md` | 128 | `packages/client/hmr/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/client/ui-chat/README.zh.md` | 206 | `packages/client/ui-chat/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/client/ui-permission-presets/README.zh.md` | 94 | `packages/client/ui-permission-presets/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/client/ui-settings-models/README.zh.md` | 152 | `packages/client/ui-settings-models/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/client/ui-sidebar-terminal/README.zh.md` | 88 | `packages/client/ui-sidebar-terminal/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/client/ui-subagent/README.zh.md` | 128 | `packages/client/ui-subagent/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/compaction/compaction-tool-result-pruner/README.zh.md` | 148 | `packages/compaction/compaction-tool-result-pruner/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/context/time-context/README.zh.md` | 150 | `packages/context/time-context/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/core/agent-default-model/README.zh.md` | 126 | `packages/core/agent-default-model/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/core/agent-tool-presentation/README.zh.md` | 119 | `packages/core/agent-tool-presentation/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/core/tools/README.zh.md` | 250 | `packages/core/tools/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/credentials/deepseek-account-platform/README.zh.md` | 108 | `packages/credentials/deepseek-account-platform/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/agent-team/README.zh.md` | 225 | `packages/experimental/agent-team/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/browser-use-chrome-devtools-mcp/README.zh.md` | 116 | `packages/experimental/browser-use-chrome-devtools-mcp/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/client-ui-agent-team/README.zh.md` | 102 | `packages/experimental/client-ui-agent-team/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/session-search/README.zh.md` | 82 | `packages/experimental/session-search/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/terminal-bundle/README.zh.md` | 78 | `packages/experimental/terminal-bundle/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/translator/README.zh.md` | 124 | `packages/experimental/translator/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/experimental/worktree/README.zh.md` | 98 | `packages/experimental/worktree/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/extensions/ui-cordis/README.zh.md` | 126 | `packages/extensions/ui-cordis/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/fs/fs-local/README.zh.md` | 149 | `packages/fs/fs-local/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/fs/tool-str-replace-editor/README.zh.md` | 149 | `packages/fs/tool-str-replace-editor/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/llm/plugin-package-inventory-deepseek/README.zh.md` | 78 | `packages/llm/plugin-package-inventory-deepseek/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/mcp/mcp-client/README.zh.md` | 229 | `packages/mcp/mcp-client/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/plan/README.zh.md` | 49 | `packages/plan/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/preset/README.zh.md` | 44 | `packages/preset/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/session-query/session-query/README.zh.md` | 166 | `packages/session-query/session-query/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/session/session-format-v3-to-v4/README.zh.md` | 350 | `packages/session/session-format-v3-to-v4/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/session/working-directory/README.zh.md` | 90 | `packages/session/working-directory/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/shell/README.zh.md` | 51 | `packages/shell/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/shell/bash-local/README.zh.md` | 152 | `packages/shell/bash-local/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/shell/pwsh-sandbox/README.zh.md` | 152 | `packages/shell/pwsh-sandbox/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/shell/tool-bash-persistent/README.zh.md` | 160 | `packages/shell/tool-bash-persistent/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/subagent/README.zh.md` | 50 | `packages/subagent/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/subagent/subagent-acp/README.zh.md` | 176 | `packages/subagent/subagent-acp/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/subagent/subagent-claude-code/README.zh.md` | 190 | `packages/subagent/subagent-claude-code/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/subagent/subagent-dsh-sdk/README.zh.md` | 187 | `packages/subagent/subagent-dsh-sdk/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/terminal/terminal-bash/README.zh.md` | 183 | `packages/terminal/terminal-bash/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/util/README.zh.md` | 65 | `packages/util/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/util/crypto/README.zh.md` | 69 | `packages/util/crypto/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/util/deque/README.zh.md` | 103 | `packages/util/deque/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/util/output-retention/README.zh.md` | 167 | `packages/util/output-retention/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/util/time/README.zh.md` | 68 | `packages/util/time/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/util/values/README.zh.md` | 102 | `packages/util/values/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/web/web-search-exa/README.zh.md` | 142 | `packages/web/web-search-exa/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/workflow/workflow-ptc/README.zh.md` | 169 | `packages/workflow/workflow-ptc/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |
| `packages/workflow/workflow/README.zh.md` | 142 | `packages/workflow/workflow/README.md` | 逐节核对（只读并行审阅；≥768 列溢出行 raw） |

## 5. 跨域依赖

`release` 域同时覆盖以下路径，本域只保留包契约视角：
- `apps/desktop/tests/installed-update/publication/README.md` → 本域 M25；release 的 `release-desktop-test-publication` 拥有发布门槛的 canonical 流程。
- `packages/session/session-format-v3-to-v4/README.md` → 本域 M03（库/持久化边界）；release 的 `release-session-migrations` 拥有迁移细节。

## 6. 未决与证据边界

- 运行时行为未验证：本参考的所有 positive/rejection/recovery 都是 planned，不能当作已通过。
- 中文语义已完成逐节核对，并对 17 行显示宽度溢出行做了 raw 复核；5 处双侧差异按源限制记录（见 §4），不以英文或中文单侧自动胜出。
- 配置字段未穷尽：`docs/config-catalog.md` 未读。
- 平台差异（Windows/macOS/Linux、Git 版本、Bash/PowerShell、浏览器）未执行。
- 发布与 Session 迁移的 canonical 门槛归 release 域；i18n pair/翻译规则归 documentation 域；跨域表述需在整合时对齐。
