# package-contracts-6：包契约与能力 seam 迁移参考

本文件是 `package-contracts-6` 域的操作性参考，覆盖来源仓库固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中 53 个英文包 README 所建立的契约、边界、生命周期、配置、扩展点、限制、组合与评审义务。每条断言都来自实际阅读；引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`。

**这份文档不替代源码或生成目录。** 配置字段的穷尽真源是 `docs/config-catalog.md`，工具 schema 的真源是 `docs/tool-catalog.md`；本参考给出的是“包应该承诺什么、必须写清什么、怎样验证承诺没有漂移”。

---

## 0. 先按触发器找章节

| 你正要做什么 | 先读 |
|---|---|
| 新增包 / 包组 / bundle / library 的 README | [§1 README 契约与 group map](#package-contracts-6.readme-contract-and-group-map) |
| 接入或替换一个后端（fs、shell、sandbox、picker、LSP、web、spill、telemetry） | [§2 能力 seam 与单一 provider](#package-contracts-6.capability-seam-one-provider)、[§12 注册生命周期](#package-contracts-6.registration-lifetime-and-scope) |
| 包会新增工具、提示词段、上下文或缓存影响 | [§3 Model Experience 披露](#package-contracts-6.model-experience-disclosure) |
| 包有明确的非目标、平台限制或未实现方向 | [§4 限制与 deferred work](#package-contracts-6.limitations-and-deferred-work) |
| 加配置字段、配置表或设置表单 | [§5 配置面](#package-contracts-6.configuration-surface-contract)、[§6 持久化与优先级](#package-contracts-6.settings-persistence-and-precedence) |
| 接 provider key、发布凭据、远程主机 | [§7 凭据与秘密边界](#package-contracts-6.credential-and-secret-boundary) |
| 发布实验/可选功能 | [§8 可选 bundle 生命周期](#package-contracts-6.optional-bundle-lifecycle) |
| 新增模型可调用工具或改结果格式 | [§9 模型面工具结果契约](#package-contracts-6.model-facing-tool-result-contract) |
| 包在组件缺失时必须拒绝而不是降级 | [§10 fail-closed](#package-contracts-6.fail-closed-enforcement) |
| 包名字里有 sandbox / scope / approval / isolation | [§11 信任边界与残余风险](#package-contracts-6.trust-boundary-and-residual-risk) |
| 包会持久化状态、恢复、冷启动或处理中断 | [§13 持久性与重启语义](#package-contracts-6.durability-and-restart-semantics) |
| 包有生成文件、补丁依赖或长时间诊断 | [§14 生成物与证据校验](#package-contracts-6.generated-artifact-and-evidence-verification) |
| 改持久格式、wire 协议、偏好 schema 或字段名 | [§15 兼容与版本迁移](#package-contracts-6.compatibility-and-version-migration) |
| 数据会离开进程（telemetry、翻译、浏览、抓取） | [§16 出站数据披露](#package-contracts-6.outbound-data-disclosure) |
| 操作不可逆、要升权或要发布 | [§17 人工审批与证据边界](#package-contracts-6.human-approval-and-evidence-limits) |
| 打 wheel / 原生插件 / 预构建运行时 | [§18 载荷与供应链](#package-contracts-6.packaging-payload-and-supply-chain) |

三类信息的标记约定：

- **【源义务】** 来源 README 明确要求或明确声明的行为；括号内给出来源范围。
- **【迁移设计】** 把该义务搬到另一个仓库时的建议实现；不是来源仓库的现有代码。
- **【额外建议】** 超出源文档的加固建议，可按项目风险取舍。

执行状态：本域只做了来源阅读与迁移设计。`verification` 中所有 positive/rejection/recovery 均为 `planned`，没有在目标仓库运行过任何构建、测试或网络操作。

---

## 1. README 契约与 package-group map {#package-contracts-6.readme-contract-and-group-map}

**何时读**：新增包、拆分包组、移动能力归属、评审 README。

**观察到的统一形态**（跨 53 个文件一致）：

- frontmatter 至少含 `description` 与 `kind`；`kind` 取值包括 `package-group`、`package-reference`、`package-library`、`package-bundle`。
- 正文第一行是语言切换：`English | [中文](README.zh.md)`（中文页反向）。
- 结构固定为 Summary / Table of Contents / 主体 / Related documentation / Dev Note（组页通常还有 Packages 表）。
- Packages 表列 Role 与 ctx key，或写“registers on `ctx.x`”/“mounts a backend”/“consumes `ctx.x`”这类关系。
- 组页只做地图：`deepseek-harness/packages/host/README.md:23-25@687f282e` 明确“each package README owns its contract and configuration”；`deepseek-harness/packages/core/README.md:23-36@687f282e` 明确 core 拥有可替换 spine，而 runnable compositions 在 `packages/bundle`。
- Dev Note 是可折叠的维护者工作上下文；多数组写 `None`（例：`deepseek-harness/packages/jobs/README.md:43-48@687f282e`）。

**【源义务】**

1. 每个包文档声明 kind 与一句 description；组页声明每个成员的 Role 与 ctx key/挂载关系。
2. 组页不得把包级 config 表再写一份“第二真源”。
3. 每篇英文 README 有对应中文 README 与 `.i18n.yaml` 一致性记录；编辑任一侧后必须同步另一侧并重跑配对工具（侧车头部示例：`deepseek-harness/packages/browser-use/README.i18n.yaml:1-25@687f282e`）。
4. Related documentation 只链接权威子系统页、生成目录和 Agent Note，不复制其内容。
5. Dev Note 不产生新义务；新义务写进正文。

**操作步骤**

1. 先定 kind，再写 description；description 描述能力，不写文件清单。
2. 写 Summary，回答“为什么组合这个包”，而不是“目录里有什么”。
3. 写 Packages 表；每个成员必须有 Role，并注明 `ctx.*` key 或 register/consume/mount 关系。
4. 写 Related documentation，优先链接 `docs/subsystems/*` 与生成目录。
5. 写中文对照；运行 `pnpm run verify-translation-pairing --write <README.md>` 生成或更新 `.i18n.yaml`（侧车头部即给出该命令）。
6. 评审时用“读者能否只靠本页决定挂载哪个包”作为完成信号。

**责任角色**：包作者、组 owner、文档评审、消费者。

**失败处理**：ctx key 写错会把消费者导向不存在的服务；组页复制配置表会与生成目录冲突。发现冲突时以包 README + 生成目录为准，回改组页。

**例外**：归档/实验包可以用更短的正文，但仍保留 kind、Model Experience 与 Known Limitations。

**证据限制**：结构可由 lint 检查，语义正确性（ctx key 是否真的存在）没有机械校验；配对 gate 只比较标题级哈希，不证明译文等义。

**【迁移设计】** 建一个 `docs/package-template.md` 与结构 lint（frontmatter、Summary、ToC、Packages、Related documentation、Dev Note、Model Experience、Known Limitations），再把“配置表链接生成目录”写成评审规则。

---

## 2. 能力 seam：每个服务一个 provider、独占命名、裸 seam 惰性 {#package-contracts-6.capability-seam-one-provider}

**何时读**：引入 `ctx.*` 服务、替换后端、注册 route/扩展名/provider 名。

**来源事实**

- directory picker：`DirectoryPicker` 是抽象 Cordis service，只有一个 `capability()`；第二个实现加载时抛标准 duplicate-service 错误。`DirectoryPickerCapabilities` 是 merge-extensible map，新后端通过 declaration merge 加自己的 kind，而不是改这个包（`deepseek-harness/packages/host/directory-picker/README.md:26-36,54-57,64-72@687f282e`）。
- LSP：seam 只拥有 `ctx.lsp` 与 provider registry；provider 注册“能力”而不是工具，`dsh-tool-lsp` 是唯一模型面 owner。四种操作封闭；同一扩展名只能被一个 provider 占用，冲突以 `LSP_CONFLICT` 在任何 route 发布前失败；注册与处置走 `ctx.effect()`（`deepseek-harness/packages/lsp/lsp/README.md:30-34,48-63,91-93@687f282e`）。
- spill：`dsh-spill-local` 注册 `ctx.spillStore`，`dsh-spill-policy` 是消费者；单独挂 seam 没有存储（`deepseek-harness/packages/spill/spill-local/README.md:26-32@687f282e`、`deepseek-harness/packages/spill/spill-policy/README.md:26-33@687f282e`）。
- subprocess：每个 composition 只能有一个 provider 注册 `ctx.subprocess`，加载第二个会“fail loudly (one service per context, Cordis standard)”（`deepseek-harness/packages/subprocess/subprocess/README.md:30-32@687f282e`）。
- telemetry：恰好加载一个 backend；重复加载抛错；`sharing` 只报告部署模式，不是投递回执（`deepseek-harness/packages/session/session-telemetry/README.md:30-32,44-48@687f282e`）。
- browser-use：组拥有“exclusive named provider registration”，必须选择一个 provider 并挂载共享注册服务（`deepseek-harness/packages/browser-use/README.md:10-13,23-31@687f282e`）。
- LLM：两个 adapter 可共存（route 名不冲突），但“registering a route another adapter already owns fails plugin loading”（`deepseek-harness/packages/llm/llm-pi-ai/README.md:34-34@687f282e`）。

**【源义务】**

1. seam 包定义服务契约、能力词汇、封闭错误码；不注册 provider，不注册模型工具。
2. 每个 context 恰好一个 provider；第二个注册必须抛错。
3. seam 单独存在时是惰性的：没有 provider 就没有能力；UI 隐藏入口，而不是假装可用。
4. provider 替换不能改变消费者的请求形状或模型可见响应；provider 自己的坐标系（workspace URI、terminal 类型）随结果返回。
5. 有独占语义的地方必须写出来：LSP 扩展名、telemetry backend、browser provider、LLM route、typert endpoint。
6. 重复 endpoint/namespace/schema key/invocation id 必须在任何状态改变前整批拒绝。

**操作步骤**

1. 先写 seam：抽象服务 + capability union + 封闭错误码 + 结果类型。
2. provider 注册必须带显式 id，并返回稳定的 capability 对象（directory-picker 要求 capability 对象在服务生命周期内稳定，因为消费者会缓存它）。
3. 消费者 `switch (kind)`；不认识的 kind 隐藏入口。
4. 注册函数先校验后提交；返回精确 disposer。
5. 写两个测试：第二个 provider 失败；只有 seam 时行为符合文档。

**责任角色**：seam owner、provider 作者、组合作者、消费者。

**完成信号**：同一 context 内只有一个 provider；替换 provider 后消费者调用与模型结果不变；裸 seam 的不可用路径有确定行为。

**失败处理**：duplicate load 直接失败，修 composition；缺少 provider 时报告“不可用”，不要静默重试或回退到另一个实现。

**例外与未实现**：LSP 文档明确说“deployment-configured selector above registrations”只是 intended extension，可放宽独占但不把 provider 选择塞进模型输入（`deepseek-harness/packages/lsp/lsp/README.md:125-127@687f282e`）。不要把这条当成已实现能力。

**证据限制**：独占性是同进程、协作式检查，不是安全边界；插件可以绕过 registry API。部分 seam 的 inert 行为只是 prose，不一定有统一测试。

**【迁移设计】** 用带 duplicate-service 语义的 DI 容器；把 capability map 做成可 declaration merge；为每个 registry 写 duplicate 与 unload 测试。**【额外建议】** 在组合启动后做一次“每个必需 seam 恰好一个 provider”的断言，并把 ctx key 清单纳入 CI 快照。

---

<a id="package-contracts-6.model-experience-disclosure"></a>
## 3. Model Experience 披露：模型看到什么、token 成本、KV cache 影响

**何时读**：包会注册工具、提示词段、runtime context、session event，或运行时会切换工具/提示词。

**【源义务】**（代表证据：`deepseek-harness/packages/fs/tool-fs/README.md:139-243@687f282e`、`deepseek-harness/packages/core/system-prompt/README.md:134-169@687f282e`、`deepseek-harness/packages/subagent/subagent/README.md:161-195@687f282e`）

1. 每个包 README 必须有 Model Experience 段；没有模型面时明确写 `None` 及原因（例：`deepseek-harness/packages/client/ui-sidebar-browser/README.md:90-97@687f282e`、`deepseek-harness/packages/workspace/workspace/README.md:145-160@687f282e`）。
2. 必须分开写 Token effect 与 KV Cache effect。
3. 直接贡献与间接贡献分开；间接贡献链接真正拥有 request-prefix 变化的包。
4. 明确 prefix-stable / append-only / 首次变更 token 处失效三种状态。
5. 工具 schema 的固定 per-request 成本、结果在 compaction 前重复计费、图片在后续请求持续计费，都要写明。
6. spill、offload、截断等改变模型可见文本的决定要写清，包括省略是否永久。
7. 图片 offload 的永久性必须写清：route 以 `IMAGE_OFFLOAD_REQUIRED` + `offloadImages` 拒绝时，插件按 model request 顺序把指定图片永久替换为含附件名与只读路径的文本占位符，记录选择后重试且不消耗 provider retry budget；后续请求在 route 切换、resume、replay 后仍保留该省略，provider cache 在首个变化消息处失效（`deepseek-harness/packages/compaction/compaction-image-offload/README.md:12,42,88,95-96@687f282e`）。

**操作步骤**

1. 枚举包贡献的每个模型可见 artifact。
2. 分类：每请求固定 / 到 compaction 前重复 / 条件触发 / 无。
3. 用 request prefix 与 append-only history 描述 cache 行为。
4. 效果属于别的包时，链接过去，不复制数字。
5. 工具新增、默认启用状态变化时重写本段。

**责任角色**：包作者、prompt/tooling owner、部署成本评审。

**完成信号**：读者能判断“挂上这个包后，下一次请求多了什么、缓存从哪里断”。

**失败处理**：漏写会导致意外 token 花费或缓存失效，但不阻断构建；评审必须抓住。

**例外**：纯库 seam 用 None；间接贡献链接 consumer。**证据限制**：token 估算不是精确 tokenizer 保证；cache 还受上游 provider 与 route 切换影响；这是 prose，没有测试保证代码改动后仍然为真。

**【迁移设计】** 把 Model Experience 做成 README 模板必填项，并在评审 checklist 中要求“新增 tool/section 时必须更新”。**【额外建议】** 对关键包做一次 prompt-assembly 快照 diff，作为文档断言的运行证据。

---

## 4. Known Limitations、Deferred Work 与非权威 Dev Note {#package-contracts-6.limitations-and-deferred-work}

**何时读**：包在远程、headless、Windows、崩溃、多进程、无持久化等条件下不能兑现保证；或要写“未来会做”。

**【源义务】**

1. 每篇 README 有 Known Limitations and Deferred Work，措辞是“当前包约束”，不是“通用比较”或“任务 backlog”（`deepseek-harness/packages/client/ui-input-trigger/README.md:73-83@687f282e`）。
2. 每条限制写清：什么条件下不适用、什么仍然可用、后果是什么。
3. 安全、持久性、兼容性非保证必须显式列出：例如 bash sandbox 只覆盖文件效果、SSH 无重连/重放、subagent 进程本地驻留（`deepseek-harness/packages/shell/bash-sandbox/README.md:163-175@687f282e`、`deepseek-harness/packages/ssh/ssh/README.md:91-99@687f282e`、`deepseek-harness/packages/subagent/subagent/README.md:197-215@687f282e`）。
4. Deferred work 只能写成 deferred，不能写成已交付。
5. Dev Note 明确“非权威”，不得承载新义务（`deepseek-harness/packages/workspace/workspace/README.md:176-187@687f282e`）。

**操作步骤**

1. 列出“这个包是 poor fit 的条件”。
2. 每条写可观察后果与可用的替代路径。
3. 未决定方向移到 Dev Note 并标非权威。
4. 实现变化后删除失效限制，避免累积陈旧声明。

**完成信号**：运维能在部署前判断自己是否落在限制内。

**失败处理**：未写限制会变成生产事故或不安全假设。

**证据限制**：完整性是人的判断；某些限制只能通过对抗性测试发现。

**【迁移设计】** README 模板加本段；评审规则区分“当前限制 / deferred / 接受的残余风险”。**【额外建议】** 安全相关包把 threat-model 非保证和限制写在同一段，方便一起评审。

---

## 5. 配置面：字段、默认值、校验边界与穷尽目录 {#package-contracts-6.configuration-surface-contract}

**何时读**：新增/修改配置字段；新部署挂载包；生成 settings 表单或配置目录。

**【源义务】**

1. README 列出它接受的字段、默认值、一句话含义、required/optional，或链接穷尽的生成目录；README 表是摘要，不是第二 schema（例：`deepseek-harness/packages/ssh/ssh/README.md:30-52@687f282e`、`deepseek-harness/packages/web/web-fetch-http/README.md:34-52@687f282e`）。
2. 生成配置目录是字段与 JSDoc 的穷尽真源；README 表只是摘要。
3. 校验边界必须写明：load/construction、assembly/first call、execution/request 三档。
4. 非法值必须 loudly fail；不得悄悄改成“合理”默认。
5. 需要重启才生效的字段、每请求解析的字段、只影响展示的字段要分别说明。
6. 退役字段声明“不读取、不重写”，不要静默忽略。
7. 有安全含义的上限必须显式并做范围校验：URL 长度固定 2048、重定向次数、响应字节/字符、图片字节、超时、frame 大小、lease 范围。
8. 提示词组装配置必须声明 `includeHarnessIdentity`、`includeRuntimeContext`、`personaPrefix`、`personaSuffix` 与 `toolOrder`；`complete: true` 段在组装后成为唯一完整提示词（多于一个有效 complete 段使组装失败），而 context/tools/variables 仍是独立输入；渲染为空时 loop 清除所有生效 system 节点。`toolOrder` 形状错误在加载时失败，未知工具名在首次 `assemble()` 失败（`deepseek-harness/packages/core/system-prompt/README.md:46-56,100@687f282e`）。

**具体锚点**

- `deepseek-harness/packages/extensions/cordis-host-runner/README.md:30-45@687f282e`：`vmTimeoutMs` 默认 5000，`clientInspectTimeoutMs` 默认 10000，整数范围 1–2147483647。
- `deepseek-harness/packages/ssh/ssh/README.md:30-52@687f282e`：`requestTimeoutMs` 默认 30000，`maxFrameBytes` 上限 64 MiB，`maxPending` 128，`leaseMs` 3000–600000。
- `deepseek-harness/packages/fs/tool-fs/README.md:52-66@687f282e`：`readLimit` 2000、`readMaxLineLength` 2000、`readMaxBytes` 51200、`readStreamMinSize` 10485760。
- `deepseek-harness/packages/core/system-prompt/README.md:49-60@687f282e`：`toolOrder` 必须恰好一个 `'<unlisted-tools>'` rest 项，重复或缺失在加载时失败；列出的名字没有注册工具则每次 `assemble()` 失败。

**操作步骤**

1. 先改 schema，再改文档。
2. 写 required/optional 与精确默认值。
3. 写校验时机与失败码/信息。
4. 重新生成配置目录并从 README 链接。
5. 每个校验边界至少一个非法值测试。

**责任角色**：包作者、schema 作者、部署者、settings UI 作者。

**失败处理**：load/assembly 抛错并指出字段；可编辑但不可服务的 route 保留诊断，不阻断其他 provider 编辑。

**例外**：省略字段表示“feature disabled”或“ambient provider discovery”时，必须把省略语义写进默认值列。

**证据限制**：README 表可能落后于 schema；校验时机因包而异；有些默认值依赖部署（OS temp、catalog）。

**【迁移设计】** schema → catalog 生成器 + CI diff；README 链接生成目录；为 load-time 与 assembly-time 失败各写测试。**【额外建议】** 给每个上限字段加 `minimum/maximum` 元数据，并用属性测试覆盖边界。

---

## 6. 设置持久化、优先级、reset 与旧文件导入 {#package-contracts-6.settings-persistence-and-precedence}

**何时读**：做设置表单、加配置层、迁移旧 settings、改偏好 schema。

**【源义务】**

1. 表单只暴露 active、唯一寻址 profile entry 的 `.volatile()` 字段；普通配置仍在 Cordis 配置文件里（`deepseek-harness/packages/settings/settings/README.md:22-40@687f282e`）。
2. 表单写入通过 active profile 的 Cordis patch 持久化；home patch 或命令行 overlay 会覆盖的写入被拒绝。
3. Reset 恢复 profile override 之下的值（含 schema 默认），不能删除更低层提供的值。
4. 旧 `settings.yaml` 在 Loader settle 后只导入一次：先把文件改名为 `settings.yaml.imported`，再写入；section 映射到具体 entry id（`ui-developer-tools` → `ui-settings`、`ui-onboarding` → `ui-settings-general`、`shell` → 平台 shell executor entry）；运行组合拒绝的 section 只留在改名文件里。
5. 用户 override 替换完整 child list，不会自动合并内置列表的未来变化。
6. 保存的覆盖在插件卸载后仍保留，但命令本身随插件消失（`deepseek-harness/packages/client/shortcuts/README.md:30-38@687f282e`）。
7. 偏好存储声明 schema version，并在下一次成功写入时迁移；不可读或未来版本数据不能被 reset 覆盖。

**操作步骤**

1. 只有需要 live 编辑的字段才标 volatile。
2. 写入前检查 overlay 优先级；被覆盖就拒绝并提示。
3. reset 实现为“恢复继承层”，不是盲删 key。
4. 旧文件导入放在 Loader settle 之后，且先改名再写。
5. 迁移只在下一次写入发生；不要启动即重写全部数据。

**完成信号**：编辑后重启仍在；被更高层覆盖时表单明确拒绝；旧文件导入幂等。

**失败处理**：stale revision 写入被拒；偏好文档不可读时禁用编辑直到修复；旧 section 被拒后保留在改名文件。

**例外**：设备本地存储（Web 的 `dsh.keybindings.v1`、Desktop 的 `userData/keybindings.json`）独立于 Harness home，不由 settings 服务迁移。

**证据限制**：Nested Includes 有独立配置，不能通过 active profile 表单编辑；跨 tab/进程仍可能 last-writer-wins。

**【迁移设计】** 一个 persistence owner per layer + 显式优先级表 + rename-before-write 导入器；测试覆盖拒绝、reset、幂等导入。**【额外建议】** 表单写入带 revision，服务端做 compare-and-set。

---

## 7. 凭据与秘密边界 {#package-contracts-6.credential-and-secret-boundary}

**何时读**：接 provider key、发布凭据、远程主机、对象存储。

**【源义务】**

1. 配置保存引用而非明文秘密：`apiKeyEnv` 是每请求通过 credential seam 解析的引用；引用解析为空则请求失败 `MISSING_CREDENTIAL`（`deepseek-harness/packages/llm/llm-pi-ai/README.md:36-39,117-119@687f282e`）。
2. secret role 在 value、继承值、profile override、schema 默认值中都被脱敏；客户端只收到 presence marker（`deepseek-harness/packages/settings/settings/README.md:49-49@687f282e`）。
3. 发布凭据放在 Git 之外、受文件系统权限保护的文件中；CI uploader 只接受永久 COS 凭据，不支持 STS session 凭据（`deepseek-harness/apps/desktop/publishing/ci/README.md:24-40@687f282e`）。
4. 缺少 CI 配置就停止发布，没有 personal-token fallback（`deepseek-harness/apps/desktop/publishing/ci/README.md:30-30@687f282e`）。
5. 匿名 fetch 不发送凭据（`deepseek-harness/packages/web/web-fetch-http/README.md:30-32@687f282e`）；SSH 使用部署方拥有的 alias、strict host-key checking，并以摘要校验 helper（`deepseek-harness/packages/ssh/ssh/README.md:30-34@687f282e`）。
6. 审计记录排除原始 provider 响应与凭据（`deepseek-harness/apps/desktop/publishing/ci/README.md:52-52@687f282e`）。
7. 存储登录记录只接受小写连字符 provider id；手工声明在语法之外的 route 无法登录，记录写入以 `LlmError('UNSTORABLE_PROVIDER_ID')` 拒绝，这类 route 改用 `apiKeyEnv` 或 ambient provider 设置。省略 `apiKeyEnv` 表示 configured-but-keyless，catalog route 交由 provider 原生 ambient discovery（`deepseek-harness/packages/llm/llm-pi-ai/README.md:38,95@687f282e`）。

**操作步骤**

1. 秘密进 credential store 或部署外部文件。
2. 配置只写字面引用名。
3. 在操作边界解析；缺失时用稳定码失败。
4. 表单与日志投影都做脱敏。
5. 验证“引用缺失”的负例，且不打印秘密。

**完成信号**：仓库 grep 不到秘密；缺引用能稳定失败；设置表单只显示存在标记。

**失败处理**：`MISSING_CREDENTIAL` / `INVALID_CREDENTIAL`；发布缺文件直接停止。

**例外**：route 不写凭据时允许 provider-native ambient discovery；README 要说明它可能读取 seam 之外的文件。登录态只在启动它的进程内有效，页面重载会放弃未完成的授权。

**证据限制**：provider 自己解析 `~/.aws/credentials` 时绕过 seam；`headers` 仍是明文字典，可能带 redactor 看不到的凭据；跨进程刷新锁只保护 store 记录。

**【迁移设计】** credential seam + per-request resolver + 表单脱敏投影；CI 配置在仓库外。**【额外建议】** 在审计事件里只记录引用名与解析结果码，不记录任何派生值。

---

## 8. 可选/实验 bundle 生命周期 {#package-contracts-6.optional-bundle-lifecycle}

**何时读**：发布实验功能、可选 UI、会花外部资源或改 workspace 的功能。

**【源义务】**

1. 可选/实验 bundle 随产品安装但默认关闭；README 写明默认状态（ralph、session-titles、voice-input、tool-worktree 均如此）。
2. 启用是 Plugins 里的显式用户动作；bundle patch 插入行，禁用移除该 profile layer。
3. 后续 profile patch 可以按 row id 覆盖或禁用 bundle，但“仅 override 不等于选择”（`deepseek-harness/packages/experimental/ralph-bundle/README.md:35-40@687f282e`）。
4. 禁用会移除工具/UI；已创建的 checkout 与分支不删除（`deepseek-harness/packages/experimental/tool-worktree/README.md:26-30@687f282e`）。voice bundle 的原生运行时即使在禁用时仍会安装，磁盘/下载成本不会因禁用消失（`deepseek-harness/packages/experimental/voice-input-bundle/README.md:60-65@687f282e`）。
5. 切换会改变工具列表或提示词的 bundle，说明缓存前缀只失效一次（`deepseek-harness/packages/experimental/ralph-bundle/README.md:54-60@687f282e`）。
6. 不增加模型工具的 bundle 写 `None`；增加工具的写 schema 成本与完成行为。
7. 开启/禁用会改变 live Host 的全局工具集，下一次请求即生效（包括 minimal preset），README 必须写明这一点（`deepseek-harness/packages/experimental/ralph-bundle/README.md:28-30@687f282e`）。
8. 替换 title provider 的 bundle 要写清切换范围与失败保留：session-titles 对现有和新建 Session 替换 first-prompt title provider，保留用户 pinned 标题，自动标题失败保留旧标题；4096-byte title-input 预算包含当前生成标题，超限拒绝而不是截断会话历史（`deepseek-harness/packages/experimental/session-titles-bundle/README.md:12,30,66@687f282e`）。

**操作步骤**

1. `cordis.patch.yml` 只放组合行，能力实现在普通包。
2. 文档写默认值、启用/禁用路径、删除后保留什么。
3. 写模型可见增量与缓存影响。
4. 验证禁用后基础组合仍有效、重新启用只注册一次。

**完成信号**：新 profile 默认没有该行与工具；启用/禁用/再启用无重复注册；禁用不删用户资产。

**失败处理**：行移除即注销；停用失败是组合错误，不是“部分启用”。

**例外**：base bundle 默认启用的功能（如 automatic compaction）在文档中写 default-on，不归类 optional。

**证据限制**：禁用不能撤销已产生的持久效果（生成的标题、worktree）；部分 bundle 即使关闭也安装原生依赖；浏览器半 bundle 在 headless 下会挂起等待页面。

**【迁移设计】** 能力包 + bundle 行分离；plugin manager 入口；enable/disable/re-enable 测试。**【额外建议】** 在插件清单投影里显示“已安装但未选择”，避免用户误以为已生效。

---

<a id="package-contracts-6.model-facing-tool-result-contract"></a>
## 9. 模型面工具结果契约

**何时读**：新增工具、改结果格式、返回大输出或跨会话数据。

**【源义务】**

1. 结果必须有界：行/字节/字符上限、分页 footer，或 spill 替换 + 取回提示。
2. 失败使用稳定、可路由的 code，并附恢复指令；消费者不解析 prose。
3. 搜索/查询结果 cursor-free：不向模型暴露 provider cursor、offset、page size 或模型可控 limit；达到上限时要求模型缩小查询（`deepseek-harness/packages/experimental/tool-session-query/README.md:43-53,69-74@687f282e`）。
4. 权限来自调用方身份，不来自模型参数；跨会话访问要求精确 `cwd` 相等；未授权边界以 marker 表示且不含隐藏 id。
5. 成功结果使用文档化的 envelope：`read` 带行号与精确 footer；`write`/`edit` 返回紧凑确认，完整文本留在 tool-call 参数里（`deepseek-harness/packages/fs/tool-fs/README.md:187-200,215-228@687f282e`）。
6. 通用 spill policy 拥有截断/恢复；单个工具不得自创第二套截断格式。
7. 工具名与字段名保持既有 schema 词汇（snake_case、规范名）；改名会改变展示分类，必须写文档。
8. 文件系统变更由 observation policy 门禁，而不是工具本地状态：写/编辑未读目标失败 `FS_NOT_OBSERVED`，文件已变失败 `FS_STALE_VERSION` 并附重读指令；成功读取发出 `fs/observed`，观察 listener 必须是同步、仅副作用的记录器，后续变更在目标锁内重新检查（`deepseek-harness/packages/fs/tool-fs/README.md:78-82@687f282e`）。

**具体标识**

- `FS_NOT_OBSERVED` → `cannot modify "<path>": file has not been read — read the file, then retry`
- `FS_STALE_VERSION` → 保留 provider 原因并追加 `— re-read the file, then retry`
- `SESSION_QUERY_TOOL_UNAUTHORIZED`、`SESSION_QUERY_TOOL_FAILED`
- `read` footer 三选一：`(Output capped. Showing lines <start>-<end>. Use offset=<next> to continue.)`、`(Showing lines <start>-<end> of <total>. Use offset=<next> to continue.)`、`(End of file - total <total> lines)`
- spill notice：`(Omitted N bytes. Full formatted result stored at: <path>. Use read with offset/limit, or grep this path to search within it.)`

**操作步骤**

1. 先定 envelope 与错误码。
2. 从执行上下文解析调用方身份与 workspace。
3. 加 caps 与精确续读/恢复文本。
4. 大结果交给共享 spill policy。
5. 测未授权与恰好达到上限两种情况。

**完成信号**：模型能按 code/续读提示自行恢复；无隐藏 cursor；未授权不泄露 id。

**失败处理**：拒绝返回可读 error result；超大结果 spill 或截断；能力缺失时拒绝执行。

**例外**：没有挂 spill policy 的自定义组合会内联完整载荷；README 要写明。

**证据限制**：caps 只是 token 成本估算；spill notice 是文本约定，不能证明策略真的保存了结果；同进程工具仍依赖 host 提供正确的调用方身份。

**【迁移设计】** 共享 envelope/错误码 + 一个 spill policy + 授权 helper；**【额外建议】** 为每个工具加“结果大小上限”属性测试和“跨 workspace 拒绝”测试。

---

## 10. Fail-closed：缺失执行器时拒绝，不降级 {#package-contracts-6.fail-closed-enforcement}

**何时读**：受限执行、远程传输、发布、任何“组件缺失会改变保证”的地方。

**【源义务】**

1. 需要受限模式但没有可用 runner：以 `SANDBOX_UNAVAILABLE` 拒绝，绝不无隔离运行（`deepseek-harness/packages/shell/bash-sandbox/README.md:62-67@687f282e`）。
2. runner 失败优先于 denial，并报告为 sandbox 问题而不是命令失败。
3. digest、协议版本、runtime kind、平台/架构不匹配在 readiness 前拒绝，不靠 fallback 修补。
4. DNS 答案集中只要有一个非 public 地址就整体拒绝；连接 pin 到已验证地址；跨源重定向失败（`deepseek-harness/packages/web/web-fetch-http/README.md:62-65,96-99@687f282e`）。
5. spill 使用独占创建 + owner-only 权限，拒绝符号链接或已存在目标（`deepseek-harness/packages/spill/spill-local/README.md:79-97@687f282e`）。
6. 发布缺少配置、调试包或签名/公证不完整时停止；没有 personal-token fallback。
7. fence 自己拥有决定的地方，拒绝是结构化 `FS_SANDBOX_DENIED`，不是从 stderr 猜测。
8. Gateway 每次调用与每条流都显式指明 Peer；已释放 Peer 在读取 payload 前以 `gateway/peer-disposed` 拒绝。非 owner principal 在参数校验后、lookup/Context 解析/Session 激活之前解析资源并询问 `ctx.remoteAccess.decide`；拒绝抛 `remote-access/denied`，资源非法以 `resource-invalid` 拒绝而不询问；owner 调用绕过判定。`$events` 与 `$events/result` 要求 `peer.interactions === 'answer'`；上行超过 `streamInboxBytes` 以 `gateway/uplink-overflow` 失败但不关闭 socket（`deepseek-harness/packages/api/gateway/README.md:33-35,43,47-49@687f282e`）。

**操作步骤**

1. 枚举执行器可能缺失的每条路径。
2. 缺失时返回稳定 unavailable/denied code，而不是执行原操作。
3. 保留区分“runner 失败”与“操作失败”的证据。
4. 写“移除 runner → 断言拒绝”的测试。
5. 文档写唯一允许的恢复路径：修 runner，或显式选择无限制执行器。

**完成信号**：移除组件后同一操作失败且错误可诊断；不存在静默降级路径。

**失败处理**：带 code 失败；后台 runner 失败记录在 settled process 上，等调用方读取时呈现。

**例外**：`danger-full-access` 显式绕过 sandbox 并标记 unconfined，这是选择而非 fallback。

**证据限制**：fail-closed 不能发现“被攻陷但报告成功”的 runner；bash denial 从 stderr 推断可能误分类；发布审批只覆盖 workflow，不覆盖同账户的任意代码。

**【迁移设计】** 每个组件定义 unavailable 码 + 移除组件测试；**【额外建议】** 在启动时断言“受限模式必须已挂载 runner”，而不是等到第一次调用。

---

## 11. 信任边界与残余风险 {#package-contracts-6.trust-boundary-and-residual-risk}

**何时读**：包名或 API 含 sandbox / isolation / scope / trust / approval。

**【源义务】**

1. 写清边界“不防什么”。fs-sandbox 是 trusted code 对 model-controlled path 的 policy fence，不是 kernel boundary；resolve-to-syscall TOCTOU 被缩小但接受（`deepseek-harness/packages/fs/fs-sandbox/README.md:62-65,77-80@687f282e`）。
2. 动态 Cordis vm 隔离 globals 但不是安全边界；它声明的服务能触达 live runtime，因此按 bash 访问对待（`deepseek-harness/packages/extensions/cordis-host-runner/README.md:60-66@687f282e`）。
3. scope 只隔离 scope-aware API 与事件：任意 Cordis service 不会因为经 scoped context 调用就变成隔离；一个 context 只携带最近的一个 scope key；交出 `Scope.ctx` 等于交出 minter 的注入服务（`deepseek-harness/packages/core/scope/README.md:92-102@687f282e`）。
4. iframe 沙箱用兼容性换隔离：逃逸的 popup 保留 opener、关闭 sandbox 后可在浏览器激活规则下导航顶层、private-network 过滤不是防火墙（`deepseek-harness/packages/client/ui-sidebar-browser/README.md:98-112@687f282e`）。
5. SSH 摘要校验发现安装物被替换，但不让可写部署文件变得可安全执行；TLS 流密钥不防远端进程内存检查，也不提供重连或重放（`deepseek-harness/packages/ssh/ssh/README.md:42-48,91-99@687f282e`）。
6. 审批环境只 gate workflow，不 gate 同机器账户下的任意代码；账户隔离与源分支限制是独立工作（`deepseek-harness/apps/desktop/publishing/ci/README.md:30-34@687f282e`）。
7. subagent 请求/描述/结果是借用的同进程不可变值；序列化与恶意输入校验属于进程/wire 边界（`deepseek-harness/packages/subagent/subagent/README.md:85-90@687f282e`）。
8. 指令候选的最后一个路径组件是 symlink 时会被解析并跨信任边界加载：克隆仓库可以把树外内容呈现为较低优先级的工作区指引（绝不覆盖 system、developer 或直接用户指令），因此加载不受信任仓库必须用 fs policy gate 或 OS sandbox 限制 `ctx.fs`（`deepseek-harness/packages/context/agent-instructions/README.md:225@687f282e`）。
9. 子进程环境先清洗 credential-shaped 名称与 ambient `DSH_*` 事实，再合并调用方显式 `env`；显式 `undefined` tombstone 移除普通条目，`argv` 从不经 shell 解释；自己拥有 spawn 的传输直接导入 `scrubbedParentEnv`，保持环境策略单一来源（`deepseek-harness/packages/subprocess/subprocess/README.md:80,84,104@687f282e`）。
10. SDK stdio profile 的 stdout 只承载 newline-delimited JSON-RPC；随附 bundle 无法约束任意插入的用户插件，自定义 profile 必须保留 `dsh-sdk-jsonrpc-server` 行，且 YAML 禁用 HMR 意味着配置变化需要重启（`deepseek-harness/packages/bundle/sdk-app/README.md:12,26,61-63@687f282e`）。

**操作步骤**

1. 写一段 threat model：什么不可信、什么可信、什么 out of scope。
2. 命名残余风险与接受理由。
3. 指向真正拥有 kernel-grade / 跨进程隔离的组件。
4. 禁止 README 与 UI 文案出现更强声明。

**完成信号**：评审者不会把 policy fence 当内核隔离；部署知道需要额外哪一层。

**失败处理**：过度声明导致不安全组合；修正是改文档，并在更高层补补偿控制。

**证据限制**：威胁模型会过期；review 不能证明没有逃逸，高保证场景仍需对抗测试/外部审计。

**【迁移设计】** README 强制问题“这个边界不防什么、谁拥有那个防护？”，并记录接受的残余风险。**【额外建议】** UI 文案也要走同一评审，避免营销语言覆盖技术限制。

---

## 12. 注册生命周期、作用域与原子贡献 {#package-contracts-6.registration-lifetime-and-scope}

**何时读**：注册 tool、prompt section、command、extension、provider、projection、module；卸载/替换插件；做 per-agent registry。

**【源义务】**

1. 注册走 scoped context 或 Cordis effect；disposer 精确撤回该贡献。
2. 贡献原子化：先校验 package-face identity、schema、invocation descriptor；重复项在任何状态改变前整批拒绝（`deepseek-harness/packages/typert/registry/README.md:44-49,66-70@687f282e`）。
3. 通过 scoped context 的注册同时是 scope-visible 与 scope-lifetime；不要让“可见于一个 scope、由另一个 scope 拆除”。
4. 子 scope 继承祖先贡献，最近定义优先；祖先 listener 可观察后代，反向不成立；dispose scope 移除它拥有的一切（`deepseek-harness/packages/core/scope/README.md:29-42@687f282e`）。
5. effect 注册在 fiber 卸载时消失；缺 registry 时单元保持 inert，而不是部分注册（`deepseek-harness/packages/session/session-turn-outline/README.md:49-51@687f282e`）。
6. merge-extensible 词汇（capability kind、resource kind、activity kind）由 owner declaration merge；现有条目保留注册顺序。
7. registry change 广播给订阅者；抛错的 listener 被记录且不影响后续 listener。
8. 条目所有权防止旧下载在目标变化后挂载：本地 generation 阻止旧 artifact 覆盖（`deepseek-harness/packages/client/modules/README.md:86-89@687f282e`）。
9. subagent 容量是每棵 activation tree 共享的池：`maxActiveSubagents` 默认 8，根父级不占槽；创建/冷恢复在让出前预留，等待、待处理 inbox 与正在停止的 activation 仍计数，接纳不排队；调低只拒绝新接纳、不驱逐驻留子级；容量是进程本地。达到上限时创建以 `ACTIVATION_LIMIT_REACHED` 拒绝（浏览器 prompt 得到 `subagent/delivery-unavailable`）（`deepseek-harness/packages/subagent/subagent/README.md:53-57@687f282e`）。
10. 命令注册拒绝重复 id 与受支持设备 profile 间重叠的默认键位；固定只读序列参与冲突校验，不能分配给可编辑命令，已保存绑定与已挂载固定操作冲突时仍显示但不能执行（`deepseek-harness/packages/client/shortcuts/README.md:30-36@687f282e`）。

**具体标识**

- `createScope(ctx, key)`、`scope.ctx`、`scope.dispose()`、`rawDispose`
- `scopeTarget(base, key)`、`ScopedLayers`、`NamedEntries`、`AnonymousEntries`
- `ctx.typert.register(contribution)`、`ctx.typert.remotes.register(...)`、`$mount(contribution)`
- `registerFixed()` / `observeFixedInput()`（shortcuts）
- `ctx.systemPrompt.section(...)` / `variable(...)` / `getSectionOrder(name)`

**操作步骤**

1. 铸取或接收与目标生命周期匹配的 scope。
2. 完整校验贡献后再写状态。
3. 通过一个 effect 注册，保留返回的 disposer。
4. scoped 数据按 `scopeOf()` 归档、事件通过 `scopeTarget()` 派发；不要只依赖 scoped context。
5. 测 unload 与 duplicate。

**完成信号**：卸载后注册消失；重载只有一个实例；重复项无部分状态。

**失败处理**：重复项在提交前拒绝；dispose 后移除；旧 module 不能在新 entry 下挂载。

**例外**：保存的用户数据（keybinding overrides、preset 选择）可以比贡献者活得更久；README 要写明。

**证据限制**：只有 scope-aware API 才隔离状态；一个普通 Cordis service 即使通过 scoped context 调用仍是 context-global；一个 context 只带一个最近 scope key。

**【迁移设计】** 用 effect 包装注册，引入 scope primitive，注册校验原子化；**【额外建议】** 在测试中做“注册→卸载→重注册”循环并断言 registry size 不增长。

---

## 13. 持久性与重启语义 {#package-contracts-6.durability-and-restart-semantics}

**何时读**：包保存状态、恢复会话、冷启动子 agent、发布多对象操作。

**【源义务】**

1. 明确状态类别：durable domain record、persisted cache、process-local registry、in-memory projection。
2. 恢复的 row 必须 schema 校验；坏 row 丢弃，不种下坏 fold（`deepseek-harness/packages/session/session-turn-outline/README.md:49-51@687f282e`）。
3. 多写 mutation 使用显式 pending marker，启动时恰好完成或回滚中断操作（`deepseek-harness/packages/workspace/workspace/README.md:91-97@687f282e`）。
4. 冷恢复写清前置条件（persistence、session query、preset definition），缺失时用稳定 code 拒绝。
5. 进程本地定义重启即消失；历史日志保留参数与 receipt，但不恢复 registry（`deepseek-harness/packages/extensions/cordis-host-runner/README.md:56-59@687f282e`）。
6. 浏览器只应用它启动时对应的 Host release；其他 release 的模块留在队列之外，直到 Host 回到该 release。
7. telemetry/audit 游标表示 handed-off 而非 delivered；缺 terminal result 表示中断而非成功。
8. 一次性 cleanup 在激活后执行，长进程不再扫描；README 要写明保留不是连续的（`deepseek-harness/packages/spill/spill-local/README.md:57-62@687f282e`）。
9. projection unit 是已提交会话事件的纯 fold；wire 值是 whole-value（完整数组、按 turn 严格递增），消费者整体替换、绝不 merge，纯草稿变化不得推进公开值；恢复的缓存行必须按 schema（含顺序）校验，坏行丢弃而不是喂坏 fold（`deepseek-harness/packages/session/session-turn-outline/README.md:47,112-115@687f282e`）。
10. archive admission 是能力 seam：`workspace/session-activity` 询问已组合 provider 还有什么在跑，非空答案以 `WorkspaceActiveSessionError` 拒绝；`stopActivity: true` 先持久化 archive 再派发 parallel stop，使持久集合拦住 wakeup，provider 停止错误只记日志而 archive 保留；移除项目绝不删除文件夹、文件或会话历史（`deepseek-harness/packages/workspace/workspace/README.md:103,168@687f282e`）。

**具体标识**

- `pendingMutation`、`archivedSessionIds`、`pinnedSessionIds`、`workspace` domain version 2
- `published-tag-pending`、`upload-records/`、`publish-locks/`、`events.jsonl`、`result.json`
- `SESSION_QUERY_TOOL_FAILED`（恢复失败时的稳定码示例）
- client module graph 的 `release` = version + commit

**操作步骤**

1. 给状态分类并写进 README。
2. 记录可能分叉的写之前先落 marker。
3. 恢复时校验，定义丢弃行为。
4. 文档写 resume 前置与失败码。
5. 测崩溃点：marker 前、第一写后、commit 后、cleanup 中。

**完成信号**：中断后重启能确定地完成或回滚；缺前置时失败可诊断。

**失败处理**：坏状态丢弃或明确报 corruption；缺 terminal result 按中断处理；锁目录需先确认无 writer 才能手动删除。

**例外**：本地 agent 失败且没有 committed `turn/end` 时按 error 结算；之后 committed turn ending 可提供恢复结果。

**证据限制**：持久存储不能让外部副作用成为事务；best-effort 队列与一次性 cleanup 仍有丢失窗口；多进程共享同一 store 在多个包中明确 out of scope。

**【迁移设计】** 状态分类表 + mutation marker + 每次 restore 校验；**【额外建议】** 为关键写路径注入崩溃点（写前/写后/提交后），验证启动恢复。

---

## 14. 生成物、漂移 gate 与保留证据 {#package-contracts-6.generated-artifact-and-evidence-verification}

**何时读**：改生成器/依赖/补丁；运行或决定不运行长诊断；发布构建物。

**【源义务】**

1. 生成文件有 owner 与再生成命令，禁止手改。
2. verify 命令从已安装依赖与当前生成器重算期望；pre-commit 比对 staged 文件，CI 对 lockfile 再验（`deepseek-harness/packages/llm/llm-pi-ai/README.md:167-181@687f282e`）。
3. 依赖或生成器变化必须与生成文件一起 stage；生成错误阻断提交。
4. 第三方包补丁用 `pnpm patch` / `pnpm patch-commit` 维护；排除生成的 launcher；依赖缓存测试前先用 `pnpm patch --edit-dir <new-directory>` 验证补丁可应用（`deepseek-harness/packages/client/ui-sidebar-documentpreview/tests/fuzz/README.md:41-46@687f282e`）。
5. 长诊断是显式战役，不属于默认套件；失败保留并非零退出；报告含输入 SHA-256、是否打开、worktree 状态（同文件 1-28 行）。
6. baseline 比较要写限制：使用当前依赖与共享 helper，不能声称复现未打补丁的历史 ExcelJS。
7. 保留 fixture 供单元/浏览器测试，避免测试依赖生成器运行时。

**具体命令**

```sh
pnpm run gen-provider-data
pnpm run verify-provider-data
git add packages/llm/llm-pi-ai/src/provider-data.generated.ts
pnpm patch
pnpm patch-commit
pnpm patch --edit-dir <new-directory>
pnpm exec vitest run packages/client/ui-sidebar-documentpreview/tests/excel-opening.client.spec.ts \
  packages/client/ui-sidebar-documentpreview/tests/excel-opc.client.spec.ts \
  packages/client/ui-sidebar-documentpreview/tests/excel-xml.client.spec.ts
```

**操作步骤**

1. 生成 → 审 diff → 与输入变更一起 stage。
2. 本地与 CI 都跑 verify/check。
3. 补丁在新鲜解包上验证应用。
4. 诊断保留 corpus 与报告，并写明不能证明什么。
5. 记录精确命令、seed、版本与结果状态。

**完成信号**：staged 生成文件与当前依赖/生成器一致；补丁可重放；失败诊断可复现且被保留。

**失败处理**：stale 生成文件使 check 失败；补丁不适用使构建/测试失败；fuzz 缺陷即使“已知”也非零退出。

**例外**：prior-generation source map 可能读当前 map 文件；被接受的损坏 ZIP 是 informational，需要单独检查。

**证据限制**：探测覆盖已安装 resolver，不覆盖所有值依赖分支；metadata-only revision 无法识别 mtime/ctime/size 之外的变化；green check 只证明与当前生成器一致，不证明语义正确。

**【迁移设计】** 生成器加 `--check`、pre-commit + CI、fixtures 目录、显式诊断脚本。**【额外建议】** 在报告里绑定 commit 与 lockfile 哈希，避免“昨天绿过”。

---

## 15. 兼容与版本迁移 {#package-contracts-6.compatibility-and-version-migration}

**何时读**：改持久格式、偏好 schema、wire 协议、工具 schema，或退役字段。

**【源义务】**

1. 旧值在读取时映射，不重写源文件：`normal`/`expanded` 显示为 `detailed`，不自动改写磁盘值（`deepseek-harness/packages/client/ui-chat/src/client/conversation-nodes/README.md:114-136@687f282e`）。
2. 偏好 store 声明 schema version，下一次成功写入时迁移；v1 只读不重写，v2 增加可选 `secondCode`（`deepseek-harness/packages/client/shortcuts/README.md:34-34@687f282e`）。
3. 退役字段声明不读取、不重写（preset registry 的 `modeSelectionEnabled`）。
4. wire 对端在 readiness 前拒绝 protocol version / runtime kind / digest 不匹配（SSH）。
5. client module graph 带 release 身份（version + commit）；页面只应用 boot release。
6. 持久记录带 version；旧读形态保持可读，schema 校验显式拒绝未知/损坏形态（workspace domain version 2）。
7. 工具/字段改名是兼容性变更：外部调用方依赖的 snake_case 与规范名要保留；改名会改变展示分类。

**操作步骤**

1. 写旧/新形态与读取时映射。
2. 给持久记录或协议加 version。
3. 旧 reader 保持工作直到迁移完成；不静默重写。
4. 加 version mismatch 负例。
5. 文档写升级路径与无法迁移的内容。

**完成信号**：旧数据仍可读；新写入使用新版本；不匹配的 peer 明确失败。

**失败处理**：协议不匹配 loudly fail；坏 row 丢弃；不可读偏好文档禁用编辑而不是覆盖。

**例外**：历史日志可能“可读但不可恢复”（动态定义）；README 要区分。

**证据限制**：有些历史 artifact 依赖已不可用的旧定义，只能拒绝而不是 fallback；兼容 shim 会累积，需写明何时可删。

**【迁移设计】** 每个持久形状/wire 消息带 version；读取端 legacy mapping；一次只写一个版本并测试边界两侧。**【额外建议】** 保留旧 fixture，升级 CI 同时跑旧 fixture 与新 schema。

---

## 16. 出站数据披露 {#package-contracts-6.outbound-data-disclosure}

**何时读**：挂 telemetry、把推理/对话发给外部服务、嵌入网页、抓取 URL。

**【源义务】**

1. 写清什么离开进程、发给谁；没有 backend 不能描述为已投递。
2. redaction 只作用于出站副本，canonical session log 永不重写。
3. 每条出站记录过 `sessionTelemetry/record` waterfall；没有规则时“as captured”离开；抛错 listener 使该条记录 fail-closed 扣留（`deepseek-harness/packages/session/session-telemetry/README.md:50-54@687f282e`）。
4. backend 披露 `sharing`：`full` / `feedback-only` / `disabled`；这是模式声明，不是每会话回执。
5. 投递 best-effort：游标表示 handed-off，崩溃时队列记录可能丢失。
6. feedback 是输出信号，永远不是模型输入；per-message rating 存会话但不进 model history 或 telemetry（`deepseek-harness/packages/feedback/README.md:12-30@687f282e`）。
7. 外部翻译披露“显示的推理可能含私有代码或对话细节”；请求失败不回退到另一个 provider（`deepseek-harness/packages/experimental/client-ui-cot-translation/README.md:11-24,70-80@687f282e`）。
8. 匿名 fetch 不发凭据；SSH alias、认证与流能力是私有部署细节。

**操作步骤**

1. 枚举每个出站通道与 payload。
2. 共享 collector 部署必须挂 redaction 规则。
3. 用抛错 listener 验证 fail-closed。
4. 验证 canonical log 与 model history 不变。
5. 文档写丢失窗口与去重键 `(session.id, session.format_version, event.seq)`。

**完成信号**：每条出站记录可追溯到规则；无规则时部署明确接受“原样导出”；重复记录可按去重键识别。

**失败处理**：redaction listener 抛错 → 该条扣留；外部服务不可用 → 翻译失败且不回退；非 public 目标 → fetch 拒绝。

**例外**：导出到可信 collector 的部署可以有意不挂规则；README 必须写清后果。

**证据限制**：没有内置规则，导出数据只和部署挂的规则一样干净；best-effort 仍可能丢；on-demand redaction 用捕获时的策略，不是事件发生时的策略。

**【迁移设计】** 一个 coordinator + redaction waterfall + 出站副本；每通道文档与测试。**【额外建议】** 默认不导出，把“接入 collector”作为显式配置项并要求 owner 签名。

---

## 17. 人工审批与本地证据边界 {#package-contracts-6.human-approval-and-evidence-limits}

**何时读**：发布/提升制品、升权、加载动态包、任何不可逆写。

**【源义务】**

1. 发布需要显式 operator 授权与 GitHub Environment approval；test 与 production 分离且各有 reviewer；只有 production 创建 release tag（`deepseek-harness/apps/desktop/publishing/ci/README.md:22-34@687f282e`）。
2. App token 短生命周期；缺配置停止发布，无 personal-token fallback。
3. 调试/未签名包不能发布；eligibility 需要新的已签名/公证包，重试不能把旧字节变合格。
4. 被拒绝的 sandbox 操作只能在审批提示被接受后，以最窄的更宽模式重试一次；审批前不执行（`deepseek-harness/packages/fs/tool-fs/README.md:74-79@687f282e`、`deepseek-harness/packages/shell/bash-sandbox/README.md:55-64@687f282e`）。
5. 带浏览器半的动态包等待页面 verdict；run 在批准或取消前挂起，且没有超时。
6. 写清 local evidence 不证明什么：本地 fixture 不证明 COS/CDN/admin 权限；成功 run 不代表 UI 已渲染；审批 gate 的是 workflow，不是同账户任意代码。
7. 保留 approval summary、operation identity、events、terminal result；缺 terminal result 表示中断而非成功。

**操作步骤**

1. 准备操作与证据（version、channel、target、hash、签名）。
2. 用精确身份请求审批。
3. 批准后执行；记录 identity 与 outcome。
4. 失败时复用精确 prepared attempt，或重新发起一个被授权的新操作；不要仅为重试上传而重建。
5. 完成报告写证据边界。

**具体锚点**

- `desktop-test` / `desktop-production` environments，required reviewers，allowed `master` branch
- `DESKTOP_PUBLISH_RUNNERS`（JSON map: runner name → {label, target}）
- `DSH_PACKAGING_CONFIG_DIR`、`DSH_DESKTOP_RELEASES_DIR`、`publish-locks/`、`upload-records/`
- `published-tag-pending`：feed 成功但 tag 失败；重试只做 tag recovery
- `apps/desktop/scripts/rollback-desktop-channel.ts`：`--record`、`--expected-version`、`--reason`、`--execute`

**完成信号**：有审批记录 + 精确 artifact identity + terminal audit result；恢复只触碰允许的对象。

**失败处理**：缺审批/配置停止；拒绝升权保留原 denial；挂起 run 等取消。

**例外**：test 环境允许 self-approval；但可发布 artifact 仍必须签名/公证。

**证据限制**：reviewer 可能不懂 artifact；审批不替代技术校验；挂起 run 无超时；本地检查不能证明远端权限。

**【迁移设计】** 不可逆操作放显式 approval environment；保留 dry-run/preview；审计记录 before/after。**【额外建议】** 审批页展示 hash 与签名结果，而不只是“Run workflow”。

---

## 18. 打包载荷与供应链身份 {#package-contracts-6.packaging-payload-and-supply-chain}

**何时读**：打平台 wheel、原生 addon、预构建运行时、客户端 bundle。

**【源义务】**

1. 发布目标显式；wheel tag 与载荷严格匹配；不发布不支持的平台（无 Windows arm64 wheel）（`deepseek-harness/python/sdk-runtime/README.md:11-21@687f282e`）。
2. 只发布 wheels；安装 `dsh` 命令 + Python 模块；import、启动 profile、处理 Office 文件从不下载资源（同文件 21-30 行）。
3. 下载是显式 API：校验 archive hash 与 package identity、保留可执行权限、原子发布完成目录；失败可重试。
4. 资源 identity 包含 release 的 locked inputs；缓存布局文档化，未使用版本需手动删除。
5. dev-only carrier（`runtime/node/`）从不自动选择，且排除出 wheel/sdist。
6. 原生平台包携带二进制、使用兼容依赖范围、缺失绑定拒绝而不在安装时编译；C 源随包供审计（`deepseek-harness/native/system/packages/entry/README.md:13-15@687f282e`）。
7. workspace-dependency payload 有校验过的 manifest（platform/arch 必须匹配进程）、稳定布局、in-place 或复制安装；非法 payload 在第一次工具调用失败（`deepseek-harness/packages/skill/tool-workspace-dependencies/README.md:30-50,60-70@687f282e`）。
8. 客户端 bundle 必须在启动前构建；缺 bundle 以一条构建指令 + package/path 列表 loudly fail（`deepseek-harness/packages/client/modules/README.md:52-54@687f282e`）。

**具体标识**

- `DSH_HOME`（必须非空）、`DSH_RESOURCE_CACHE`、`DSH_RESOURCE_DOWNLOAD_TIMEOUT_MS`（1–2147483647，默认 300000）
- `DSH_PRIMARY_RUNTIME`、`DSH_OFFICE_SIDECAR`
- `runtime.json`（`desktopVersion`、`platform`、`arch`、`payloadDigest`、`python`、`node`、`pnpm`、`pythonPackages`）
- `downloads.json`、`office-skills/`、`<platform>-<arch>/`

**操作步骤**

1. 声明发布矩阵与 payload manifest。
2. 构建时核对 tag/arch 与 payload。
3. 下载显式、哈希校验、导入路径无下载。
4. 排除开发 carrier 与 source tree。
5. 在 checkout 外的干净环境做安装冒烟。

**完成信号**：干净环境安装后可执行；import 无网络；平台/架构不匹配明确失败。

**失败处理**：tag/payload 不匹配、缺可执行、平台不符 → 带 build/install 指令拒绝；下载失败可重试。

**例外**：生产部署允许 runtime closure 之外包的 unused workspace patches；仓库安装仍拒绝 unused patches。

**证据限制**：摘要校验不让可写部署文件变安全；未使用缓存需手动清理；新 provider 在重新生成前可能缺元数据。

**【迁移设计】** manifest 驱动打包 + 哈希校验 + 原子缓存；CI 按目标矩阵；checkout 外安装冒烟。**【额外建议】** 把“导入无下载”写成测试，而不只是文档声明。

---

## 19. 跨域依赖与归并说明

这些路径同时被其它域拥有；本域保持兼容的 `governance` 分类，不声称独占：

| 路径 | 共同 owner | 本域负责 | 对方负责 |
|---|---|---|---|
| `apps/desktop/publishing/README.md`、`.../ci/README.md` | release | 包契约面：身份、凭据、审计、证据边界 | 发布流程与版本规则 |
| `packages/context/agent-instructions/README.md` | agent-workflows | 配置字段、预算、刷新、信任边界 | 指令层级、加载器、去重、符号链接 |
| `python/sdk-runtime/README.md` | supply-chain | 载荷 identity、布局、下载/缓存规则 | Python 运行时供应链策略 |
| `README.i18n.yaml` 全体 | documentation | 分类为 generated 并记录读取范围 | 配对 gate、哈希格式、再生成工具 |

---

## 20. 未解决项与证据边界（交付时保留）

1. **中文对照已全文读取，但未做独立逐句等价审计**：53 篇英文与 53 篇中文正文均按完整范围读取（中文超出显示上限的行已 raw 重读）；机制断言仍以英文正文为准。配对侧车只证明标题级哈希一致，不证明语义等价；若目标要求逐句等价，需单独审计。
2. **53 个 `.i18n.yaml` 已全部机器解析并逐路径记录**：每个文件按生成器头部与逐标题 en/zh 短哈希解析，disposition 记为 `generated`，不承载义务；哈希一致不能证明语义等价，生成器归 documentation 域所有。
3. **README 契约没有机械 gate**：真正自动的是配置目录、翻译配对、生成元数据、duplicate 注册与服务级校验；其余靠 review。不要把文档声明当成 CI 已覆盖。
4. **所有 verification 都是 planned**：本域没有在目标仓库执行构建、测试、安装或网络操作；`positive/rejection/recovery` 场景是待执行的验收脚本，不是已观察结果。
5. **跨域机制 id 不同**：同一文件在 release / agent-workflows / supply-chain 下有不同 mechanism id，但分类都为 `governance`，这是兼容而非矛盾；由集成方合并 assessments。
6. **显示截断已消除**：英文 24 个文件共 78 行、中文 14 个文件共 38 行（33 行超过 768 显示单元 + 5 行预防性检查）均已用 `read:<line>:raw` 逐行重读；另 raw 读取了 `packages/client/modules/README.zh.md:151` 的 `</details>` 末行。coverage 的每条记录注明了对应文件的重读行号；没有 raw 证据的行未声称全文。

---

## 21. 53 个来源包的归组索引（便于定位）

- **组地图 / group map**：`packages/core`、`packages/host`、`packages/browser-use`、`packages/feedback`、`packages/jobs`、`packages/workflow`、`packages/compaction`、`packages/compaction/compaction-image-offload`。
- **seam / registry**：`packages/host/directory-picker`、`packages/lsp/lsp`、`packages/spill/spill-local`、`packages/spill/spill-policy`、`packages/subprocess/subprocess`、`packages/session/session-telemetry`、`packages/typert/registry`、`packages/core/scope`、`packages/core/system-prompt`。
- **配置 / 设置 / 凭据**：`packages/settings/settings`、`packages/ssh/ssh`、`packages/llm/llm-pi-ai`、`packages/skill/tool-workspace-dependencies`、`packages/extensions/cordis-host-runner`、`packages/preset/agent-preset-registry`。
- **可选 bundle**：`packages/experimental/ralph-bundle`、`packages/experimental/session-titles-bundle`、`packages/experimental/voice-input-bundle`、`packages/experimental/tool-worktree`、`packages/experimental/client-ui-cot-translation`、`packages/bundle/sdk-app`。
- **模型面工具**：`packages/fs/tool-fs`、`packages/experimental/tool-session-query`、`packages/shell/bash-sandbox`、`packages/fs/fs-sandbox`。
- **UI / 客户端内核**：`packages/client/modules`、`packages/client/web`、`packages/client/shortcuts`、`packages/client/ui-deliverables`、`packages/client/ui-input-trigger`、`packages/client/ui-model-selection`、`packages/client/ui-sidebar-browser`、`packages/client/ui-chat/.../conversation-nodes`、`packages/client/ui-sidebar-documentpreview/tests/fuzz`。
- **持久化 / 恢复**：`packages/workspace/workspace`、`packages/session/session-turn-outline`、`packages/session/session-telemetry`、`packages/subagent/subagent`、`packages/experimental/session-inspector`。
- **扩展 / 动态运行**：`packages/extensions/cordis-host-runner`、`packages/preset/agent-preset-registry`、`packages/core/scope`。
- **原生 / 打包 / 发布**：`native/system/packages/entry`、`python/sdk-runtime`、`apps/desktop/publishing` 及其 `ci/`。

---

## 22. 一页式验收清单

- [ ] 每个包 README 有 kind、Summary、ToC、Packages 表（如适用）、Related documentation、Dev Note。
- [ ] 有中文对照，并在编辑后重跑 `pnpm run verify-translation-pairing --write <README.md>`。
- [ ] 有 Model Experience（或明确 None），分开 token 与 KV cache。
- [ ] 有 Known Limitations and Deferred Work；Dev Note 标非权威。
- [ ] 每个配置字段有默认值、required/optional、校验边界；链接生成目录。
- [ ] 表单只编辑 volatile；写入检查 overlay 优先级；reset 恢复继承值；旧文件 rename-before-write。
- [ ] 秘密只以引用出现；缺失时稳定失败；表单/日志脱敏。
- [ ] 可选 bundle 默认关闭；override 不等于选择；禁用保留/删除语义写清。
- [ ] 工具结果有界、错误码稳定、cursor-free、权限来自调用方。
- [ ] 受限模式无 runner 时失败 `SANDBOX_UNAVAILABLE`；没有静默降级。
- [ ] 安全相关 README 写明“不防什么”和残余风险。
- [ ] 注册走 effect/scope；重复项原子拒绝；卸载可逆。
- [ ] 持久状态分类、restore schema 校验、pending marker、resume 前置与失败码写清。
- [ ] 生成文件有 verify/check；补丁可重放；诊断失败保留并非零退出。
- [ ] 旧格式读取映射、版本迁移、协议 mismatch 拒绝。
- [ ] 出站数据通道清点；redaction 规则显式；canonical log 不变。
- [ ] 不可逆操作有审批环境与精确 artifact identity；证据边界写清。
- [ ] 平台/载荷匹配、显式下载、无导入期下载、开发 carrier 排除。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `package-contracts-6.readme-contract-and-group-map`：`deepseek-harness/packages/core/README.md:1-62@687f282e`、`deepseek-harness/packages/host/README.md:1-59@687f282e`、`deepseek-harness/packages/browser-use/README.md:1-40@687f282e`、`deepseek-harness/packages/feedback/README.md:1-42@687f282e`、`deepseek-harness/packages/jobs/README.md:1-50@687f282e`、`deepseek-harness/packages/workflow/README.md:1-53@687f282e`、`deepseek-harness/packages/compaction/README.md:1-55@687f282e`、`deepseek-harness/packages/settings/settings/README.md:1-84@687f282e`、`deepseek-harness/packages/experimental/ralph-bundle/README.md:1-78@687f282e`
- `package-contracts-6.capability-seam-one-provider`：`deepseek-harness/packages/host/directory-picker/README.md:1-111@687f282e`、`deepseek-harness/packages/lsp/lsp/README.md:1-139@687f282e`、`deepseek-harness/packages/spill/spill-local/README.md:1-141@687f282e`、`deepseek-harness/packages/subprocess/subprocess/README.md:1-163@687f282e`、`deepseek-harness/packages/session/session-telemetry/README.md:1-129@687f282e`、`deepseek-harness/packages/llm/llm-pi-ai/README.md:1-273@687f282e`、`deepseek-harness/packages/typert/registry/README.md:1-137@687f282e`
- `package-contracts-6.model-experience-disclosure`：`deepseek-harness/packages/fs/tool-fs/README.md:1-266@687f282e`、`deepseek-harness/packages/client/ui-input-trigger/README.md:1-91@687f282e`、`deepseek-harness/packages/subagent/subagent/README.md:1-227@687f282e`、`deepseek-harness/packages/client/ui-sidebar-browser/README.md:1-120@687f282e`、`deepseek-harness/packages/core/system-prompt/README.md:1-190@687f282e`、`deepseek-harness/packages/context/agent-instructions/README.md:1-236@687f282e`、`deepseek-harness/packages/workspace/workspace/README.md:1-187@687f282e`、`deepseek-harness/packages/compaction/compaction-image-offload/README.md:12-12@687f282e`、`deepseek-harness/packages/compaction/compaction-image-offload/README.md:42-42@687f282e`、`deepseek-harness/packages/compaction/compaction-image-offload/README.md:88-88@687f282e`、`deepseek-harness/packages/compaction/compaction-image-offload/README.md:95-96@687f282e`
- `package-contracts-6.limitations-and-deferred-work`：`deepseek-harness/packages/shell/bash-sandbox/README.md:1-183@687f282e`、`deepseek-harness/packages/extensions/cordis-host-runner/README.md:1-152@687f282e`、`deepseek-harness/packages/client/modules/README.md:1-150@687f282e`、`deepseek-harness/packages/client/ui-sidebar-documentpreview/tests/fuzz/README.md:1-46@687f282e`、`deepseek-harness/packages/bundle/sdk-app/README.md:1-74@687f282e`
- `package-contracts-6.configuration-surface-contract`：`deepseek-harness/packages/ssh/ssh/README.md:1-107@687f282e`、`deepseek-harness/packages/web/web-fetch-http/README.md:1-145@687f282e`、`deepseek-harness/packages/skill/tool-workspace-dependencies/README.md:1-127@687f282e`、`deepseek-harness/packages/preset/agent-preset-registry/README.md:1-109@687f282e`、`deepseek-harness/packages/experimental/tool-session-query/README.md:1-186@687f282e`、`deepseek-harness/packages/client/shortcuts/README.md:1-92@687f282e`
- `package-contracts-6.settings-persistence-and-precedence`：`deepseek-harness/apps/desktop/publishing/README.md:1-88@687f282e`
- `package-contracts-6.credential-and-secret-boundary`：`deepseek-harness/apps/desktop/publishing/ci/README.md:1-70@687f282e`
- `package-contracts-6.optional-bundle-lifecycle`：`deepseek-harness/packages/experimental/session-titles-bundle/README.md:1-78@687f282e`、`deepseek-harness/packages/experimental/voice-input-bundle/README.md:1-77@687f282e`、`deepseek-harness/packages/experimental/tool-worktree/README.md:1-96@687f282e`、`deepseek-harness/packages/experimental/client-ui-cot-translation/README.md:1-90@687f282e`、`deepseek-harness/packages/experimental/session-titles-bundle/README.md:12-12@687f282e`、`deepseek-harness/packages/experimental/session-titles-bundle/README.md:30-30@687f282e`、`deepseek-harness/packages/experimental/session-titles-bundle/README.md:66-66@687f282e`
- `package-contracts-6.model-facing-tool-result-contract`：`deepseek-harness/packages/spill/spill-policy/README.md:1-166@687f282e`
- `package-contracts-6.fail-closed-enforcement`：`deepseek-harness/packages/fs/fs-sandbox/README.md:1-135@687f282e`、`deepseek-harness/packages/api/gateway/README.md:33-35@687f282e`、`deepseek-harness/packages/api/gateway/README.md:43-43@687f282e`、`deepseek-harness/packages/api/gateway/README.md:47-49@687f282e`
- `package-contracts-6.trust-boundary-and-residual-risk`：`deepseek-harness/packages/core/scope/README.md:1-110@687f282e`
- `package-contracts-6.registration-lifetime-and-scope`：`deepseek-harness/packages/session/session-turn-outline/README.md:1-125@687f282e`
- `package-contracts-6.generated-artifact-and-evidence-verification`：`deepseek-harness/native/system/packages/entry/README.md:1-15@687f282e`
- `package-contracts-6.compatibility-and-version-migration`：`deepseek-harness/packages/api/gateway/README.md:1-108@687f282e`、`deepseek-harness/packages/client/ui-chat/src/client/conversation-nodes/README.md:1-331@687f282e`
- `package-contracts-6.packaging-payload-and-supply-chain`：`deepseek-harness/python/sdk-runtime/README.md:1-69@687f282e`

## 来源索引（固定提交）

来源：deepseek-harness/packages/bundle/web-app/presets/standard.patch.yml:1-3@687f282e
