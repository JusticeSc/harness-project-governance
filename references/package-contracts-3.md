# package-contracts-3：包契约、能力边界与发布语义

本参考覆盖固定源提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中 53 个英文 `README.md` 及其 53 个中文对照、53 个 `README.i18n.yaml` 侧车。范围是**包级契约**：一个包承诺什么、拒绝什么、由谁拥有、如何装配、如何验证、哪些限制是已接受的。它不是 API 手册；API 细节以各 README 的 Use 段、源码与生成目录为准。

证据约定：

- `deepseek-harness/<path>:<start>-<end>@687f282e` 表示在固定提交上实际读取的行区间；行号以换行字节计数，文件末尾换行不额外加一行。
- **源义务**（source obligation）是源 README 明确要求的规则；**迁移设计**（migration design）是把该规则搬到新仓库时的实现选择；**额外建议**（extra recommendation）是源未要求、但采用者可以加的保护。三者不混写。
- `enforcement.mode` 是描述性自由文本，不是封闭枚举；`implementation`（代码路径直接拒绝/抛错）、`test`（契约测试/夹具）、`config`（清单、工作流、策略文件）、`review`（仅文档与评审，未被自动检查）只是常用取值。记录也可以写 `mixed`、`automatic` 或更具体的说明，但必须把自动保证与人工/评审职责分开。README 声称的自动性未在本提取中执行，`verification.*` 一律标为 `planned`。

## 触发索引

| 你正在做的事 | 先读 |
|---|---|
| 新建包或给包写 README | [包 README 即契约](#package-contracts-3.readme-package-contract) |
| 包会改变提示词、工具 schema 或 KV cache | [模型可见面披露](#package-contracts-3.model-experience-disclosure) |
| 设计可替换后端/多提供方 | [能力 seam 拆分](#package-contracts-3.capability-seam-split) |
| 某个服务可能没有提供方 | [可选能力缺失语义](#package-contracts-3.optional-capability-availability) |
| 不确定失败时该继续还是停止 | [失败关闭边界](#package-contracts-3.fail-closed-boundaries) |
| 持久化格式要升级 | [格式版本与迁移链](#package-contracts-3.format-versioning-and-migration) |
| 设计 append/flush/崩溃恢复 | [持久性与崩溃语义](#package-contracts-3.durability-and-crash-semantics) |
| 消费模型输出、远程内容或桌面输入 | [不受信任内容边界](#package-contracts-3.untrusted-content-boundary) |
| 处理密钥、Token、环境变量 | [凭据保管与脱敏](#package-contracts-3.credential-custody-and-redaction) |
| 默认开启遥测/自动审查/实验能力 | [同意与默认关闭](#package-contracts-3.consent-and-opt-in-defaults) |
| 把包放进/移出 experimental | [实验成熟度与晋升](#package-contracts-3.experimental-maturity-and-promotion) |
| 写测试替身、冒烟或契约测试 | [测试支持层](#package-contracts-3.test-support-tier) |
| 发布原生二进制或安装包 | [构建产物与平台矩阵](#package-contracts-3.build-artifact-and-platform-support) |
| 发布插件市场索引 | [市场索引发布](#package-contracts-3.market-index-publication) |
| 决定谁拥有启动器/进程/路由/退出 | [组合所有权](#package-contracts-3.composition-ownership) |
| 两个功能插件都要同一个控件/注册文件预览器 | [共享 UI 原子与预览注册](#package-contracts-3.shared-ui-atoms-and-renderer-registry) |
| 做只读视图或快照 | [只读投影与快照](#package-contracts-3.read-only-projection) |
| 给读取/结果/队列加上限 | [有界传输与显式截断](#package-contracts-3.bounded-transfer-and-truncation) |
| 加配置项或改默认值 | [配置契约](#package-contracts-3.configuration-contract) |

---

<a id="package-contracts-3.readme-package-contract"></a>

## 包 README 即契约

**何时读**：新增包、改动包的公开面、审查一个包是否"说完自己的事"、或需要判断某条限制是承诺还是待办。

**源义务**：

- 每个包 README 用 frontmatter 声明 `description` 与 `kind`。已观察到的 `kind` 取值为 `package-library`、`package-reference`、`package-bundle`、`package-group`；`kind` 决定读者预期（库/参考实现/应用组合/组地图）。
- README 必须给出：概述、目录、使用方式、实现说明（可折叠）、进一步探索、**模型体验**（含 KV Cache effect）、**已知限制与待实现事项**、开发备注。缺失这些段落会迫使读者去读源码才能知道边界。
- 限制段被明确声明为"当前的包约束，不是任务清单"（"They are current package constraints, not a task backlog"）。因此限制不是承诺将来修复；评审时不得把限制当成 TODO 接受。
- Dev Note 被明确声明为**非权威**（"explicitly non-authoritative"）：开放问题、未决定方向、工作队列写在这里；已发布行为、限制与已接受理由必须写在上文段落、源码与链接的 Agent Note 中。
- 英文与中文必须成对维护。`README.i18n.yaml` 是生成的逐标题哈希记录；其头部写明：编辑任一侧后，必须同步另一侧并运行 `pnpm run verify-translation-pairing --write <file>` 重新记录。
- 配置与工具 schema 不靠 README 枚举：README 必须指向生成目录（`docs/config-catalog.md#<package>`、`docs/tool-catalog.md#<package>`），生成目录才是穷尽来源。
- 独立消费方的构建与依赖义务必须写进限制或使用说明：`client/store` 明确"静态 ESM 为 Vite 保留第三方导入；独立消费方自行提供开发依赖"，并链接依赖声明规则。

**执行步骤**（actor: 包作者；reviewer 复核）：

1. 选 `kind`，写 `description`（一句话说明读者与边界）。
2. 写概述，明确"本包不做什么"（例：`dsh-api-workspace-files` 声明"本服务不提供修改操作"；`subprocess-local` 声明它只决定进程如何在宿主上运行）。
3. 写 Use，给出最小组合与具体的服务/入口标识。
4. 写实现说明与 source map，把文件角色列清楚。
5. 写 Model Experience：模型看到什么、token 影响、KV cache 影响；没有就写 None 并说明原因。
6. 写限制：逐条给出现状、触发条件、当前取舍；不要写成路线图。
7. 写 Dev Note：只放未决问题，并再次声明非权威。
8. 同步中文并重新生成 `README.i18n.yaml`。

**完成信号**：一个新读者只读 README 就能回答"何时用/如何挂/模型看到什么/哪里会失败/哪些事本包不做"；中英文标题集合与 `{#anchor}` 集合一致（本次机械核对 53/53 对一致）；i18n 侧车的每个标题都有 `en`/`zh` 两个 16 位哈希。

**失败处理**：缺少限制段或模型体验段时，评审直接拒绝，不以"代码里有"替代；中英文失配时先补齐再重新记录哈希，不得手改哈希。README 与生成目录冲突时以生成目录/源码为准，并修 README。

**例外与限制**：`apps/plugin-market-generator/README.md` 没有 frontmatter（它是独立 Node 程序，不是 Cordis 包），但仍有概述、用法、限制与安全段；`packages/ssh/README.md` 等组地图只有包表与相关文档，因为组地图不承诺运行行为。生成目录不会校验 README 叙述是否仍然正确，这部分只有评审。

**迁移设计**：把 README 模板化为固定段落；`kind` 用一个受控枚举；限制段用小标题禁止"backlog"措辞；Dev Note 用折叠块并在首句声明非权威；双语用标题哈希侧车。若采用者没有双语需求，可删去 i18n 侧车，但保留"限制不是待办"的文字约束。

**额外建议**：在 CI 加一个只检查"段落存在 + 锚点存在 + 链接可解析"的轻量检查；不要检查自然语言质量，否则会制造假阳性。

**验证**：正例——任取一个 `package-reference` 包，README 含全部段落且 i18n 哈希成对。反例——删掉限制段后检查应失败（需自行实现检查器；源未提供）。恢复——补回段落并重跑配对命令。

**证据**：`deepseek-harness/packages/client/store/README.md:1-46@687f282e`、`deepseek-harness/packages/telemetry/otel/README.md:1-72@687f282e`、`deepseek-harness/packages/credentials/credentials/README.md:1-190@687f282e`、`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`、`deepseek-harness/packages/test-support/README.md:1-53@687f282e`、`deepseek-harness/packages/experimental/README.md:1-109@687f282e`、`deepseek-harness/packages/telemetry/otel/README.i18n.yaml:1-4@687f282e`。

---

<a id="package-contracts-3.model-experience-disclosure"></a>

## 模型可见面披露

**何时读**：包会注册工具、添加系统提示段、注入用户消息、改变请求前缀，或声称"不影响模型"。

**源义务**：

- 每个包的 Model Experience 必须回答三件事：模型看到什么（原文或结构）、token 影响、KV cache 影响。即使没有影响也要写 `None` 并解释为什么（例如 `client/store`、`client/ui-primitives`、`host/webserver`、`host/plugin-inventory`）。
- 模型可见的提示段必须给出可核对的原文。`tool-lsp` 把系统提示逐字列出，并说明"普通导航继续用 search/read"；`tool-jobs` 列出后台任务提示；`acp-app` 说明 persona 模板使用 `{{model}}` 占位。
- 只有拥有该表面的包才能改变它：`session-title` 的标题是 log-only，绝不进入模型输入；`ui-secret-mask` 只改变绘制，消息原文、复制与模型输入保持原字符；`session-reference` 的快照是第二个 user-role 消息，带固定警告与 `\u003c` 转义，源文本不能拼出框架标签。
- 请求前缀稳定性是显式设计目标：`subagent-fork-in-process` 为保留父级前缀而禁用子 agent 路由选择；`acp-app` 说明 profile 改变在下一个进程生效；`tool-jobs`/`tool-lsp` 说明注册生命周期可能使前缀缓存从第一个变化的 schema token 起失效。
- 新模型可见输入必须有会话事件承载（客户端 AGENTS.md 的仓库级规则；本域 README 以"log-only/绝不进入模型输入"的方式呼应）。

**执行步骤**（actor: 包作者；reviewer 检查是否越权）：

1. 列出本包注册的每一个模型可见面：工具 schema、系统提示段、用户消息、上下文注入、标题/摘要等派生文本。
2. 对每个面写"模型看到什么"的原文或结构；无法逐字给出时给出稳定模板与变量。
3. 写 token 影响（固定/数据相关/零）与 KV cache 影响（前缀稳定/追加/可能失效）。
4. 若本包只影响显示或存储，明确写"不进入模型输入"，并指出真正拥有该表面的包。
5. 任何会改写既有前缀的改动都要在评审中单独标注，因为会破坏缓存复用。

**完成信号**：读者能判断"打开/关闭这个包会不会改变下一次请求"；提示段原文与代码常量一致；"None" 有原因而不是空白。

**失败处理**：缺少模型体验段时按契约缺陷处理；提示段与代码不一致时以代码为准并修 README；发现包偷偷注入模型内容而没有 Model Experience 说明，评审拒绝。

**例外与限制**：`packages/ssh/README.md`、`packages/telemetry/README.md`、`packages/typert/README.md`、`packages/test-support/README.md` 是组地图，只写"由消费方拥有模型面"；`packages/client/ui-settings-plugins` 等纯浏览器壳写 None。模型体验描述的是"当前实现"，不是兼容性承诺；`experimental` 包的 schema 跟随上游固定版本，无稳定性承诺。

**迁移设计**：把 Model Experience 设为 README 必填段；为每个模型可见面建立"所有者"字段；在提示段旁保存逐字文本常量，README 从常量生成或至少与之对照。对派生文本（标题、摘要、遮罩）明确"log-only/display-only"并加测试断言其不进入请求。

**额外建议**：用请求快照测试比较"包挂载前/后"的 system prompt 与 tool schema 字节；对声称零影响的包断言零差异。

**验证**：正例——`tool-lsp` 的提示原文与实现常量一致。反例——包新增提示段但 Model Experience 仍写 None，评审应拒绝。恢复——补写段落、更新 KV cache 说明并重跑快照。

**证据**：`deepseek-harness/packages/lsp/tool-lsp/README.md:1-179@687f282e`、`deepseek-harness/packages/jobs/tool-jobs/README.md:1-187@687f282e`、`deepseek-harness/packages/session/session-title/README.md:1-149@687f282e`、`deepseek-harness/packages/client/ui-secret-mask/README.md:1-99@687f282e`、`deepseek-harness/packages/context/session-reference/README.md:1-147@687f282e`、`deepseek-harness/packages/subagent/subagent-fork-in-process/README.md:1-155@687f282e`、`deepseek-harness/packages/bundle/acp-app/README.md:1-74@687f282e`。

---

<a id="package-contracts-3.capability-seam-split"></a>

## 能力 seam 拆分

**何时读**：需要一个可替换后端（持久化、凭据、遥测、沙箱、文件系统、子进程、LSP、标题生成），或要把"定义"与"实现"分给不同包。

**源义务**：

- seam 包只导出：抽象服务、句柄/请求契约、稳定错误类、纯校验辅助、品牌化 token；**不导出实现机械**。`session-persistence` 明确称自己是 "a seam, not a backend framework"，并声明"no implementation machinery crosses the package boundary"。
- 每个提供方拥有完整存储/运行时：句柄类、变更排序、单写者记账、活事件路由、拆卸。提供方之间可以长得像，但不能共享实现。
- seam 必须提供可复用的契约测试。`session-persistence` 有两套：`runPersistenceContract` 与 `runLiveWritePathContract`，钉住所有提供方必须一致的可观察行为。
- 消费方只通过注入的服务名使用能力；可选能力用 `ctx.get('<service>')` 逐次解析，而不是在模块顶层 import 提供方。`host/plugin-inventory` 对 `agentPresets` 与 `pluginPackages` 都是逐次可选解析。
- 服务定义/提供方/消费方三分解在 `credentials` 被写成明确教义：定义包导出品牌类型与事件，提供方拥有持久化与登录生命周期，消费方按操作解析。
- 客户端安全类型走子路径导出（`./types`），让 Host 与 Client 共用同一签名而不是各自复述。
- 跨包行为只能走注入服务或 slot；UI 插件不得运行时 import 或 re-export 另一个功能插件的值（客户端 AGENTS.md；本域 `ui-primitives` README 以"零 Cordis、只导出原子组件"呼应）。
- 与宿主并排安装的包必须把 `@deepseek-ai/dsh-scope`、`dsh-mcp-client` 等单例保持 `peerDependency`；`browser-use-runtime` 明确警告写成 `dependencies` 会装入第二份 `dsh-scope`，其作用域标记不被宿主注册表识别，所有 Agent 的 MCP 工具落到全局层，第二个 Agent 创建随即失败。

**执行步骤**（actor: seam 作者 + 提供方作者 + 消费方）：

1. 写服务定义包：抽象类/接口、品牌类型、错误联合、纯校验、契约测试。
2. 为每个不变量写契约测试（顺序、所有权、错误、恢复），提供方以同一套测试注册。
3. 提供方包注册服务名，拥有运行时与拆卸；不得让消费方看到存储细节。
4. 消费方声明注入；可选依赖用逐次解析并处理缺失（见下一机制）。
5. 客户端需要的类型从 `./types` 导出，禁止复制 wire 类型。
6. 评审检查：seam 包是否意外导出了实现类；提供方是否绕过契约测试。

**完成信号**：两个独立提供方能跑同一套契约测试；消费方无需知道提供方包名即可工作；替换提供方不需要改消费方。

**失败处理**：契约测试失败时禁止放宽测试来适应当前提供方；先判定是契约错还是实现错。发现 seam 包导出实现时，把实现移回提供方并删掉导出（无兼容别名）。

**例外与限制**：`telemetry/otel` 是"创建独立通道"的服务，通道归消费方所有，服务本身不设同意策略；`ssh` 家族把连接、helper、fs、subprocess、sandbox 拆成多个提供方，共享一个连接但不共享实现；`session-persistence` 的跨进程排除是提供方责任，seam 只保证单后端实例内的写者唯一。

**迁移设计**：先写"服务定义 + 契约测试 + 一个内存提供方"，再写真实提供方；消费方只依赖定义包。契约测试按不变量命名（append-only、flush-barrier、single-writer、fail-closed），不要按实现命名。

**额外建议**：给 seam 增加一个"最小可用提供方"作为测试夹具；在 CI 里对每个提供方跑全部契约套件，而不是只跑自家单测。

**验证**：正例——两个提供方均通过 `runPersistenceContract`。反例——提供方允许 `seq` 跳号，契约测试应失败。恢复——修提供方而非改测试。

**证据**：`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`、`deepseek-harness/packages/credentials/credentials/README.md:1-190@687f282e`、`deepseek-harness/packages/host/plugin-inventory/README.md:1-114@687f282e`、`deepseek-harness/packages/telemetry/otel/README.md:1-72@687f282e`、`deepseek-harness/packages/ssh/README.md:1-45@687f282e`、`deepseek-harness/packages/client/ui-primitives/README.md:1-221@687f282e`、`deepseek-harness/packages/experimental/browser-use-runtime/README.md:1-96@687f282e`。

---

<a id="package-contracts-3.optional-capability-availability"></a>

## 可选能力缺失语义

**何时读**：某个服务、后端、路由、提供方或平台工具可能没有装配；你需要决定"缺失时做什么"。

**源义务**：

- 缺失必须变成**具名、可分支的失败**，而不是静默降级。`sandbox-local` 在没有可用 runner 时以 `SANDBOX_UNAVAILABLE` 拒绝，命令绝不无隔离运行；`tool-lsp` 用 `LSP_WORKSPACE_REQUIRED`、`LSP_UNAVAILABLE`、`LSP_MALFORMED_RESPONSE`；`workspace-files` 用 `workspace-file/watch-unsupported` 等 RemoteError code，调用方按 code 分支而不是按消息文本。
- 唯一性席位重复注册必须抛错：`host/webserver` 的重复路由与第二个 fallback 都抛；`session-title` 的第二个 provider 在第一个开始 dispose 前抛；`permission-presets` 的 `custom`/`auto` 是保留名，配置表不得占用。
- 重载/卸载不得静默接管旧状态：`session-persistence` 说后端插件在活会话下重载会让写者大声失败，直到会话重启，且"nothing silently re-adopts the logs"；`subprocess-ssh` 在连接丢失时拒绝未确认工作，"automatic replay never follows an ambiguous launch or mutation"。
- 派生状态缺失必须显式失败：`permission-presets` 的投影键缺失时 `current()`/首次钉选显式失败；已存 `auto` 身份在 Auto 集成缺席时拒绝发布，不重写也不静默降级为 Full access。
- 可选服务缺失时应给出可执行指引，而不是只报错：`tool-lsp` 提示配置 provider；`web-deepseek-api` 用 `WEB_PROVIDER_CREDENTIAL_MISSING` 并给出端点/凭据字段；`sandbox-local` 命名平台可用的 runner 选项。

**执行步骤**（actor: 包作者；调用方作者）：

1. 列出本包所有可选依赖与唯一席位。
2. 为每种缺失定义稳定 code，并在类型里暴露；禁止用字符串消息做分支。
3. 决定该缺失是"拒绝操作"还是"只禁用该能力"（例如 watch 不支持时普通读取仍可用）。
4. 在装配期检查唯一席位冲突并抛错；不要等到第一次请求。
5. 写清重载/卸载后的归属：旧句柄失败、需要重启，还是可以被新实例接管。
6. 为每种缺失写测试；不要只测成功路径。

**完成信号**：调用方能在不读提供方源码的情况下按 code 处理；装配冲突在启动期而非请求期暴露；重载后没有"看似成功"的写。

**失败处理**：出现静默降级时视为缺陷；若确实需要降级，必须新增显式模式并在 README 的限制段声明。唯一席位冲突时让第二个注册失败，不要覆盖第一个。

**例外与限制**：`sandbox-ssh` 对 `danger-full-access` 直接绕过 `confine()`，这是设计而非缺失；`sandbox-local` 的 `runnerCommand` 是操作者断言，跳过功能探测并假定自定义 runner 诚实实现 bwrap 兼容 profile；`workspace-files` 的持久化是可选的，但没有它时冷会话无法解析，这是已知限制。

**迁移设计**：为每个可选能力建一张表：服务名、缺失 code、是否阻断、用户提示、重载语义。把这张表放进 README 的限制段，并让测试逐行覆盖。

**额外建议**：在启动日志里打印"已解析到的提供方/缺失的可选能力"快照；不要打印凭据或路径细节。

**验证**：正例——不挂 LSP provider 时 `lsp` 调用返回 `LSP_UNAVAILABLE`。反例——缺 provider 时静默使用空结果。恢复——装配 provider 后同一调用成功，且无需改消费方代码。

**证据**：`deepseek-harness/packages/sandbox/sandbox-local/README.md:1-149@687f282e`、`deepseek-harness/packages/lsp/tool-lsp/README.md:1-179@687f282e`、`deepseek-harness/packages/api/workspace-files/README.md:1-158@687f282e`、`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`、`deepseek-harness/packages/host/webserver/README.md:1-144@687f282e`、`deepseek-harness/packages/session/session-title/README.md:1-149@687f282e`、`deepseek-harness/packages/interaction/permission-presets/README.md:1-147@687f282e`、`deepseek-harness/packages/ssh/subprocess-ssh/README.md:1-87@687f282e`。

---

<a id="package-contracts-3.fail-closed-boundaries"></a>

## 失败关闭边界

**何时读**：实现签名、TLS、持久化、格式读取、桌面打包或任何"失败后是否还能继续"的判断。

**源义务**：

- 不产生未签名产物：Windows 打包在 SignTool、证书、容器、PIN、Token 或签名任一不可用时**失败而不是输出未签名产物**；签名失败写入 `fatal.json`，supervisor 立即请求终止该阶段进程树，失败阶段不能启动后续阶段或创建 release completion record。
- 硬件签名有持久失败联锁 `%USERPROFILE%/.dsh-desktop-signing/attempt.json`：只有成功签名并验证主签名后才释放；失败、中断、已存在联锁或审计存储不可用都会阻止后续硬件访问，包括同账号的其他 signer 实例/进程/checkout；**没有定时恢复或自动重试**，必须由管理员检查保留证据后显式授权恢复。
- 签名缓存不成为失败开放口：坏记录/identity、摘要、trust/时间戳/thumbprint 任一不符即拒绝，不修复、不替换目标、不回退硬件签名；命中仍逐次重验。迁移校验记录和摘要；维护只检查两份普通非链接文件的结构，不等于摘要或签名验证，`--clear` 显式 retire；无年龄失效/自动容量淘汰。目录所有权/DACL/固定盘与 stage 锁由相邻模块强制，缓存本身不获取该锁。
- TLS 不回落：`host/webserver` 在激活时读取证书与私钥，不可读、为空、格式错误、密钥不匹配或绑定失败都拒绝初始化；"a misconfigured certificate never falls back to HTTP"。通配地址在加载期被拒绝，不等到监听后才发现。
- 格式不猜测：`session-persistence` 对当前构建无法忠实解释的日志给出方向明确的错误，绝不误读；未知事件类型除非 envelope 标记 `ignorable` 否则拒绝；已提交前缀损坏以 `SessionPersistenceCorruptionError` 拒绝；更新的格式提示操作者升级 harness。
- 域不发布部分状态：`schedule` 在 JSON 后端遇到不可读文件、畸形文档、不支持版本或非法任务时**拒绝启动**，不发布部分任务目录；恢复失败保持 `schedule.json` 不变，原本不存在的文件才作为空域打开。
- 沙箱不静默放行：无 runner 时拒绝（见上一机制）；`partial` 执行必须如实报告为 `partial`，不得夸大为 `full`（Windows ACL 与旧 Landlock ABI）。
- 模糊的启动/变更不重放：`subprocess-local` 选定原生失败后不会把 argv 通过 fallback 重放；`subprocess-ssh` 在连接丢失后拒绝未确认工作，`done` 只证明直接进程退出，不证明托管进程范围已静止，必须另用 `waitForExit()`。
- 信任前提必须写明：`sandbox-ssh` 明确 SSH 主机与已安装 helper 是可信基础设施，摘要检查与文件效果限制**不对抗恶意主机**；这类限制只能在受信环境成立。

**执行步骤**（actor: 实现者；operator 处理硬件/TLS）：

1. 枚举"继续会产生不可接受后果"的状态：未签名产物、未隔离命令、误读日志、部分目录、错误的证书回落。
2. 为每个状态选择拒绝点（加载期优先于请求期）与稳定错误。
3. 保证拒绝路径不产生副作用；已经写下的证据保留而不是删除。
4. 对需要人工恢复的状态建联锁/标记，禁止自动清除。
5. 写清"失败证据在哪里"与"谁能恢复"。

**完成信号**：任何失败都不会产出"看起来成功"的产物；错误信息足以让操作者找到证据与恢复动作；重复失败不会累积更多硬件尝试。

**失败处理**：发现回落路径时移除它，而不是加警告；发现部分状态被发布时改为启动期拒绝并保留原文件；联锁存在时停止并升级给管理员，不尝试"再试一次"。

**例外与限制**：`session-persistence` 允许 `ignorable` 事件被跳过，这是显式逃生口；`schedule` 的 dispatch 准入失败只记录日志、不自动重试，也不使已持久化的管理结果失效；`windows-signing` 的时间戳完成允许最多三次、1s/2s 退避的重试，但只针对正常退出且返回失败/警告的命令，启动错误、终止不确定与验证失败立即停止；`hooks-codex` 的 `hooks.json` 不可读或不可解析时只记录警告并运行零个钩子，agent 仍启动——这是有意的失败开放例外，只适用于该桥接。

**迁移设计**：为每个安全关键路径写"失败矩阵"：状态 → 拒绝点 → 错误 → 证据 → 恢复人。把联锁做成文件/租约而不是内存标志，确保跨进程生效。让"部分成功"在类型上不可表达（要么完整句柄，要么错误）。

**额外建议**：给拒绝路径加"不得产生输出文件"的测试；对联锁加"第二个进程也不能绕过"的测试。

**验证**：正例——坏证书导致 webserver 初始化失败且没有 HTTP 监听。反例——坏证书时仍以 HTTP 服务。恢复——修复证书并 reload，路由恢复。

**证据**：`deepseek-harness/apps/desktop/windows-signing/README.md:1-103@687f282e`、`deepseek-harness/apps/desktop/tests/installed-update/README.md:1-132@687f282e`、`deepseek-harness/packages/host/webserver/README.md:1-144@687f282e`、`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`、`deepseek-harness/packages/session/session-format-catalog/README.md:1-110@687f282e`、`deepseek-harness/packages/schedule/schedule/README.md:1-172@687f282e`、`deepseek-harness/packages/sandbox/sandbox-local/README.md:1-149@687f282e`、`deepseek-harness/packages/subprocess/subprocess-local/README.md:1-168@687f282e`、`deepseek-harness/packages/ssh/sandbox-ssh/README.md:1-78@687f282e`、`deepseek-harness/packages/experimental/hooks-codex/README.md:1-190@687f282e`。

补读：`deepseek-harness/apps/desktop/scripts/windows-signature-cache.mjs:1-220@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-signature-cache.d.mts:1-76@687f282e`；源码声明不等于本轮已执行缓存或硬件签名。

---

<a id="package-contracts-3.format-versioning-and-migration"></a>

## 格式版本与迁移链

**何时读**：任何持久化记录、日志、缓存行、导出格式要改字段或改语义。

**源义务**：

- 发布过的格式是不可变历史。`session-format-catalog` 从最早支持格式装配到当前写入格式，**在模块初始化时校验完整且无缺口的迁移链**；低层构造器在任何 Session 读取前拒绝重复 codec、重复 edge、缺口与超出当前版本的条目。
- 迁移顺序是**生成期静态**的：`src/generated.ts` 是 codec 与 edge 顺序的静态所有者；profile 不能通过挂载功能插件增加、删除或重排 edge。`historicalSessionFormatCatalog` 用固定的 released-V3 词汇还原 V0–V3。
- 读写使用不同严格度：生产历史读取用 `{ recovery: 'recoverable', validation: 'transformed' }`；Worker 与 fixture 验证用 `{ recovery: 'strict', validation: 'current' }`。`transformed` 在迁移后跑 released-current 规则，但刻意跳过对已当前输入的 installed semantic validation。
- 当前句柄只暴露 `SESSION_FORMAT_VERSION` 标识的当前逻辑记录；提供方必须在返回句柄前把受支持历史存储转换完。`stat`/`list` 用 `formatStatus: current | migration-required` 描述存储状态，与内存中的准备/迁移任务区分。
- 后继发布不可覆盖：JSONL 后端为历史输入在同一目录写临时文件、分块编码、在 Worker Thread 验证、复查源 revision，然后**不覆盖地发布**当前后继；源文件保持字节不变。验证只接受 Worker 自然退出且 code 0，取消与 Worker 错误会终止并 join。
- 缓存行有独立身份：`session-projection-cache` 的记录必须同时匹配 live unit schema 与生命周期身份（`formatVersion`、`createdAt`、`cwd`、`isSeeded`），fold 面还要求精确 `inheritedEventCount`；来自其他格式代或 fork cut 的行不能 seed 调用方。
- **每个存储 schema 或 domain version 变更必须在同一个 PR 证明升级故事**：在 `tests/fixtures/` 放上一版已发布磁盘格式的归档夹具，并在 `tests/fixtures.spec.ts` 证明所选处置——read-compat 恢复（`compatibleVersions`）、当前版本重写、或 backup-and-skip 打捞；即使选择丢弃旧记录，也要证明丢弃不会导致启动失败或污染树。

**执行步骤**（actor: 格式所有者；provider 作者）：

1. 给每次持久化变更分配版本号；旧版本只读、不可改写。
2. 写相邻 edge（vN→vN+1），不要写跨版本大迁移；edge 的 codec、validator、fixture 同包拥有。
3. 在生成文件里固定 edge 顺序；模块初始化校验缺口与重复。
4. 对读路径提供 strict 与 recoverable 两种入口，并明确谁用哪种。
5. 历史迁移先准备、再验证、再以不覆盖方式发布后继；源保持字节不变。
6. 在同一个 PR 提交归档夹具与升级处置测试。
7. 更新 `formatStatus` 语义与 README 限制段。

**完成信号**：任一受支持历史文件都能被当前构建读成当前逻辑记录；未知/更新版本被明确拒绝；同一输入重复迁移结果确定；夹具测试能在旧格式上重复运行。

**失败处理**：出现缺口时构建期失败，不发布"能跑但会误读"的构建；迁移验证失败时保留源文件、拒绝写 open；schema 变更没有夹具时评审拒绝。

**例外与限制**：`session-format-catalog` 只支持第一方构建清单，外部迁移所有权与分发不受支持；运行时插件注册不能补缺失历史 edge。JSONL 的迁移保留配置的压缩编码，换压缩需要单独 root；保留的前代不提供自动回退或降级。缓存行的兼容版本可以结构读取用于重写，但缺失/过旧 `formatVersion` 永远不能 seed 当前 Session hydration。缓存不做冷重折叠；需要冷快照的消费者必须自行提供完整日志重新折叠。

**迁移设计**：把"格式"当成公开 API：版本号、fixture 语料、edge 表、严格/宽松读入口、后继发布协议都进包契约。新仓库若没有历史包袱，也先建立 v1 fixture 与"变更必须带夹具"的规则，避免第一次改字段就失控。

**额外建议**：给迁移加属性测试（随机旧记录 → 迁移 → 当前校验）；把 `formatStatus` 暴露到运维命令，便于在发布前发现待迁移存储。

**验证**：正例——v0/v1/v2 文件迁移到当前并通过 strict 验证。反例——手工构造缺口 edge，模块初始化应失败。恢复——补 edge、补 fixture、重新生成 catalog。

**证据**：`deepseek-harness/packages/session/session-format-catalog/README.md:1-110@687f282e`、`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`、`deepseek-harness/packages/session/session-persistence-jsonl/README.md:1-181@687f282e`、`deepseek-harness/packages/session/session-projection-cache/README.md:1-140@687f282e`。

---

<a id="package-contracts-3.durability-and-crash-semantics"></a>

## 持久性与崩溃语义

**何时读**：设计 append/flush、单写者、崩溃恢复、队列投递或任何"至少一次/恰好一次"声明。

**源义务**：

- 追加必须连续：`session-persistence` 要求 `append` 的首个 `seq` 等于已存 next-seq，缺口拒绝；已提交事件永不重写。
- `flush` 是持久性屏障：`append` 尽力而为，`flush`（句柄级或服务级）才承诺落盘，并会实体化空会话；`session/flush` 取消等待、排空到静默、再跑 `handle.flush()`，agent-loop 把它当排序与错误观察检查点。
- 撕裂尾部永不到达读者：它属于一次从未 resolve 的 append；写路径在首次新 append 前持久截断它；完整记录在截断前会被重写。
- 单写者：同一后端实例内 `create`/`open(id,'write')` 取得所有权，第二个写 open 以 `SessionAlreadyOwnedError` 拒绝，占用 id 的 `create` 以 `SessionAlreadyExistsError` 拒绝，读句柄变更以 `SessionReadOnlyError` 拒绝，关闭句柄任何操作以 `SessionHandleClosedError` 拒绝，永久失去所有权以 `SessionOwnershipLostError` 标记。跨进程排除是提供方责任；JSONL 用 `flock(2)`/Windows 命名内核信号量补足。
- 崩溃恢复是"关闭未完成轮次"而不是继续它：resume 计算 `interruptedTurnClosers`（合成的 `tool/result` 错误、打开的 `step/end`、`turn/end {interrupted}`），通过同一写句柄作为普通批次追加；`TOOL_NOT_STARTED` 与 `TOOL_OUTCOME_UNKNOWN` 告诉模型只重试只读/幂等操作，其余先验证副作用或询问用户。
- 非原子对必须声明：`schedule` 的 enqueue 与任务写不是原子，崩溃恢复不保证恰好一次；关机时兄弟 fiber 并发 dispose 可能让 storage 先关，导致同一投递重复。`session-projection-cache` 的日志领先、缓存跟随：崩溃可让缓存落后，但绝不领先于已提交事件。
- 后台写失败要保留事件并大声重试：`session-persistence` 的后台写失败保留顺序、暂停自动路径并记录，下一次显式 flush 重试并 reject；`projection-cache` 的每次后台写 fail-soft，下一次写自愈。
- 缓存只能落后，不能领先：`session-projection-cache` 的检查点先 flush 会话日志再写缓存行；崩溃可能让缓存落后，但不会让缓存包含未持久化事件。schema/生命周期身份不匹配的记录读作不存在，绝不用于 hydration。
- 远程退出不等于静止：`subprocess-ssh` 的 `done` 只报告直接进程退出，托管进程范围可能仍在运行；`waitForExit()` 单独观察静止，连接丢失后未确认操作一律拒绝而不是自动重放。

**执行步骤**（actor: provider 作者；消费方作者）：

1. 定义唯一持久性屏障（通常是 flush），并在 API 名与 README 中写死。
2. 定义顺序标识（seq）与缺口拒绝规则。
3. 定义单写者获取点、错误类、关闭时排空行为。
4. 定义撕裂尾部处理与崩溃修复动作（只关闭，不续写）。
5. 列出所有"两个持久写不是原子"的位置，明确可能的重复/丢失窗口。
6. 让后台失败可观察、可重试，且不丢事件。
7. 在 README 限制段写明"没有删除 API""没有恰好一次"等边界。

**完成信号**：崩溃后读者看不到撕裂记录；第二个写者被拒绝；重启后未完成轮次被显式关闭；文档不再暗示恰好一次。

**失败处理**：发现读者能看到部分尾部时修读取器或写路径，不能靠"重试一次"掩盖；发现静默丢事件时改为保留+暂停+大声失败；不能证明跨进程排他时在 README 标明"仅实例内"。

**例外与限制**：`session-persistence` 的 `list()` 未分页、未过滤；没有删除/保留 API；内部修复只关闭中断轮次，不提供部分轮次续跑。JSONL 的 POSIX 首次 append 依赖硬链接与 `node-addon-system` 的异步 flock，缺 addon 会拒绝写所有权；Windows 用写透 rename 与命名信号量。`tool-jobs` 的待领通知不跨 owner dispose 存活；`maxConsecutiveWakes` 用尽后只能等下一次用户输入恢复预算。

**迁移设计**：把"flush 是屏障"写进服务契约与测试；用单写者错误类而不是布尔返回；把崩溃修复实现为可重放的合成事件，保证同一日志多次恢复结果一致；对每个非原子对在 README 与测试中各留一条。

**额外建议**：加"崩溃注入"测试：在 append/flush/close 之间杀进程，断言读者永远看不到撕裂尾部；对 schedule 类队列声明"至少一次"而不是"恰好一次"。

**验证**：正例——flush 后杀进程，重启可读到完整前缀。反例——第二个写 open 成功。恢复——关闭旧句柄/进程后重新 open，未完成轮次被合成 closers 关闭。

**证据**：`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`、`deepseek-harness/packages/session/session-persistence-jsonl/README.md:1-181@687f282e`、`deepseek-harness/packages/schedule/schedule/README.md:1-172@687f282e`、`deepseek-harness/packages/session/session-projection-cache/README.md:1-140@687f282e`、`deepseek-harness/packages/jobs/tool-jobs/README.md:1-187@687f282e`、`deepseek-harness/packages/ssh/subprocess-ssh/README.md:1-87@687f282e`。

---

<a id="package-contracts-3.untrusted-content-boundary"></a>

## 不受信任内容边界

**何时读**：内容来自模型、网页、文件、远程会话、桌面应用或外部 hook；或你要声明"这个宿主是可信的"。

**源义务**：

- 跨会话引用是**不可信背景**：`session-reference` 在快照前放固定警告，禁止遵循其中的指令、权限声明或工具请求，除非当前用户明确重复；预览 JSON 把每个 `<` 转义为 `\u003c`，源文本不能拼出 `<referenced-sessions>` 框架标签；快照捕获后不可变，目标日志记录可读消息 + 来源上下文，源会话后续变更不能改变目标回放。
- UI 渲染不受信任输出：`ui-primitives` 的 Markdown 丢弃原始 HTML、限制链接、解析 ANSI；外部链接经 `MarkdownDelegateProvider` 的清洗 HTTP(S) 回调；`ui-sidebar-documentpreview` 的静态 HTML 用 DOMPurify 清洗后放入无 sandbox 权限的 iframe，CSP 阻断脚本/外部资源/连接/表单/嵌套框架，移除 `href`/`xlink:href`/refresh/声明式 shadow root；脚本模式用 `sandbox="allow-scripts"` 且**不含** `allow-same-origin`；SVG 只经 Blob URL 放进 `<img>`，脚本不能执行。
- 桌面操作要授权与可验证结果：`cua` 在 launch/observe/capture/input 前要求应用同意；保存的 grant 需要平台验证的可执行身份；撤销会关闭受影响的 Agent 连接；动作返回 `dispatched:true, verified:false`，必须读新状态验证；取消/超时/重连后不回放输入。`cua-driver-native` 要求宿主桌面权限，原生崩溃可终止宿主进程。
- hook 失败要包容：`hooks-codex` 的配置不可读/不可解析时记录警告并**不运行任何 hook**，agent 仍启动；hook 运行失败记录后继续；只有显式阻塞结果才改变流程；"adding context is not a veto"——纯上下文 hook 先 `next()` 再折叠消息，后续监听器仍可否决。
- 信任假设要写明：`sandbox-ssh` 说 SSH 主机与已安装 helper 是可信基础设施，摘要校验与文件效果隔离**不构成敌意主机安全边界**；`windows-signing` 说共享 runner 假设可信内部团队代码与操作者，残余风险已接受并跟踪在 #5973；`session-reference` 假设宿主有权读取 `ctx.sessionQuery` 暴露的每个会话，它不是面向模型的搜索工具。

**执行步骤**（actor: 包作者；安全评审）：

1. 给每个输入标注信任级别：可信宿主、用户、模型、远程内容、外部进程。
2. 对不受信任内容加固定警告/框架转义，确保内容不能伪造框架标签。
3. 在渲染/执行前做能力裁剪：sanitize、sandbox、只读、无网络、无同源。
4. 对会产生外部副作用的操作要求显式同意与可验证结果；取消后不回放。
5. 把无法消除的信任假设写进 README 限制段与评审清单。
6. 为注入尝试写反例测试（例如内容里写"忽略上述指令"）。

**完成信号**：不受信任内容不能改变系统指令、不能访问父文档、不能自动执行副作用；读者能指出每个信任假设及其边界。

**失败处理**：发现内容可伪造框架标签时改为结构化转义而不是黑名单；发现 iframe 有同源权限时移除；发现取消后仍回放输入时改为"检查新状态再决定"。

**例外与限制**：`ui-primitives` 的 `MarkdownText` 在流式期间可能把跨冻结边界的引用式链接渲染为字面文本，settle 后解析；`ui-secret-mask` 只遮挡 UserText 调用方，标题、预览、搜索摘要、工具卡、助手回复与未发送输入不遮挡；`cua` 的持久变量不预留应用，其他 Agent/用户可改变其状态；`hooks-codex` 只支持 5 个 Codex hook 点的命令子集，异步/非命令 hook 被跳过。

**迁移设计**：建立"内容类型 → 处理策略"表；对每类不受信任内容指定框架转义、sanitizer、sandbox 标志、同意点与验证方式。把信任假设写成显式条目，而不是散落在实现注释里。

**额外建议**：为 iframe/预览加 CSP 与 sandbox 的自动断言；为 Markdown 加"原始 HTML 不出现"的快照测试；为跨会话引用加"框架标签不可伪造"的属性测试。

**验证**：正例——快照里的 `<referenced-sessions>` 文本被转义，模型只看到数据。反例——HTML 预览能执行父页面脚本。恢复——收紧 sandbox/CSP 后同一内容变为静态展示。

**证据**：`deepseek-harness/packages/context/session-reference/README.md:1-147@687f282e`、`deepseek-harness/packages/client/ui-primitives/README.md:1-221@687f282e`、`deepseek-harness/packages/client/ui-sidebar-documentpreview/README.md:1-157@687f282e`、`deepseek-harness/packages/experimental/cua/README.md:1-94@687f282e`、`deepseek-harness/packages/experimental/hooks-codex/README.md:1-190@687f282e`、`deepseek-harness/packages/ssh/sandbox-ssh/README.md:1-78@687f282e`、`deepseek-harness/apps/desktop/windows-signing/README.md:1-103@687f282e`。

---

<a id="package-contracts-3.credential-custody-and-redaction"></a>

## 凭据保管与脱敏

**何时读**：配置里出现密钥、Token、密码、授权 grant，或日志/遥测/子进程环境可能泄露它们。

**源义务**：

- 配置只携带引用，不携带机密：`credentials` 让 settings 与 `cordis.yml` 引用 `DEEPSEEK_API_KEY` 等名称；`resolve` 按操作读取、无跨操作缓存，这正是热更新机制；`describe` 只报告是否设置、来源、是否可写，**绝不返回值**。
- 空值语义固定：空字符串不能存储；`resolve` 跳过空值、`describe` 报未配置——空白不能伪装成已配置机密。记录则相反：空记录是"所有者确认了环境认证"的有意声明，存在即事实。
- 记录写入必须读-决定-替换：`modifyRecord` 是唯一写路径，mutation 看到写独占瞬间的记录，返回 `undefined` 表示不改；后端支持时跨进程排他，防止两个进程轮换同一 refresh token 时丢写。
- 引用没有枚举：seam 只回答被给定的引用；记录可以 `listRecords()`，因为记录没有 schema 可发现。记录的 owner 是 scope，seam 不验证 scope 是否仍挂载——识别孤儿是调用方把 `listRecords()` 与注册表 join 的责任。
- Host-only 边界：`deepseek-account` 的 token 仅限 Host；`getPlatformSession` 只返回 origin/token 快照，退登时 null；`platformClientHeaders` 只带部署请求头，消费者必须从 renderer bootstrap 排除这些头并限制在配置来源；`rejectToken` 只移除匹配的当前登录，迟到的拒绝不能清掉替换后的凭据。
- 环境清理是名称启发式：`subprocess-local` 只清理 `*KEY*`/`*PASSWORD*`/`*SECRET*`/`*TOKEN*`，`*PASSPHRASE*` 等会通过；README 明确这是启发式，白名单是未来工作。
- 遥测头必须显式：`telemetry/otel` 不添加通道头，也不继承环境里的 authorization 或 TLS 身份；scope 名称/版本由每个消费者提供，传输共享不改变归属。
- 签名机密单独处理：`windows-signing` 要求 PIN 不含 `]`、引号或换行（SafeNet `/kc` 与 CMD 分隔符），CMD 关闭 delayed expansion 让 `!` 原样到达；打包从构建/运行时准备子进程撤回所有 `DSH_DESKTOP_WINDOWS_*`，只给签名 preflight、专用运行时签名阶段与 electron-builder 四个配置输入；SignTool 诊断被 redact；本地 `.env.windows` 或机器拥有的 `secrets/windows-signing.env` 保存 PIN。
- 显示遮罩不是安全边界：`ui-secret-mask` 只改变绘制，消息文本、复制与模型输入保留原字符；只对可识别格式生效，只覆盖 UserText 调用方。

**执行步骤**（actor: 包作者；部署者）：

1. 列出本包会接触的机密与它们的来源（环境、凭据存储、账号、硬件 Token）。
2. 配置面只接受引用名；UI/诊断只暴露 `configured/source/writable`。
3. 解析按操作进行，轮换无需重启；写入走独占 mutation。
4. 定义空值语义（引用为空=缺失；记录为空=有意）并写测试。
5. 子进程、日志、遥测、错误消息逐项检查：清理、redact、不继承、不打印。
6. 把无法保证的部分写进限制段（名称启发式、显示遮罩、跨进程排他依赖后端）。

**完成信号**：配置文件可以安全同步/渲染；轮换后下一请求生效；错误与遥测中不出现值；操作者知道哪些环境变量不会被清理。

**失败处理**：发现值进入日志/配置/遥测时按缺陷处理并加回归测试；发现空值被当成已配置时修解析顺序；发现显示遮罩被当作安全控制时在 README 与评审中纠正。

**例外与限制**：`credentials` 的引用命名空间是扁平 POSIX 标识符（因为它同时是环境变量名），记录才有 `<owner>/<id>`；进程环境变化不可观察，不会触发 `credentials/reference-updated`；`deepseek-account` 的账号 token 没有过期/刷新流程，退登先移除本地 grant 再后台撤销，远端失败不恢复本地登录；`ui-secret-mask` 不覆盖未发布的 composer、标题、搜索摘要等。

**迁移设计**：先做"引用 + describe"的最小 seam，再做记录；把所有机密接触点列成表并逐项决定清理/redact/不继承；对显示遮罩明确标注"仅为防肩窥，不是访问控制"。

**额外建议**：用 secret scanning 在 CI 检查提交与日志夹具；给子进程环境清理加"passphrase 不被清理"的已知缺口测试，避免误以为已覆盖。

**验证**：正例——`set` 后下一请求使用新值，`describe` 不返回值。反例——把空字符串当已配置。恢复——`unset` 后环境回退生效。

**证据**：`deepseek-harness/packages/credentials/credentials/README.md:1-190@687f282e`、`deepseek-harness/packages/credentials/deepseek-account/README.md:1-77@687f282e`、`deepseek-harness/packages/subprocess/subprocess-local/README.md:1-168@687f282e`、`deepseek-harness/packages/session/session-telemetry-otel/README.md:1-154@687f282e`、`deepseek-harness/packages/telemetry/otel/README.md:1-72@687f282e`、`deepseek-harness/apps/desktop/windows-signing/README.md:1-103@687f282e`、`deepseek-harness/packages/client/ui-secret-mask/README.md:1-99@687f282e`。

---

<a id="package-contracts-3.consent-and-opt-in-defaults"></a>

## 同意与默认关闭

**何时读**：你要默认开启遥测、上传、自动审查、实验能力、外部登录、桌面控制或任何"用户没要求但会发生"的行为。

**源义务**：

- 遥测默认 `FEEDBACK_ONLY`：只有新的显式反馈（文本反馈、评分创建/编辑、备注编辑、撤回）释放该反馈之前尚未处理的权威前缀，后续记录等待下一次反馈。`DISABLED` 不构造 coordinator、provider、processor 或 exporter，没有记录离开进程。`FULL` 被**拒绝而不是别名**。
- 直接 `ctx.sessionTelemetry.emit()` 在所有模式下都是 no-op，不能绕过反馈授权；父级反馈不授权子级导出：子级需要自己的新反馈，其授权前缀随后可包含继承上下文。模型请求、请求头、会话创建/收养、恢复、插件挂载或 HMR 都不授权捕获；仅存储反馈不触发任何事。
- 定时 flush 与 shutdown 可以完成**之前已授权**的批次，但绝不捕获新记录。
- 挂载共享 OTel 服务本身不创建传输、身份或发送：`telemetry/otel` 只创建通道，同意、脱敏、身份、关闭期限全归消费者。
- 自动审查默认关闭：`auto-review` 随安装提供但默认关闭，必须从 Plugins 页或显式安装开启；它明确承认可能放行不安全动作、拒绝有用工作并消耗额外 token；风险分类为低/中/高，模糊效果与未解决的授权冲突一律拒绝；高风险外泄始终拒绝。
- 实验 bundle 默认关闭：`badge-skill-bundle` 在 Web/Desktop 随附但默认关闭，必须在 Plugins 的 Official 组选择；开关添加/移除 Host 级 skill provider，不改 minimal preset 的工具目录。
- 选择即事实：`experimental/README` 区分 Experimental（成熟度）、Optional（用户显式选择）、Official（项目维护并在 Plugins 页列出），三者互不等价；发布、默认安装与 GUI 可见性都不决定成熟度。
- 安装期脚本授权必须显式：`ui-settings-plugin-inventory` 在 pnpm 构建权限待审时展示准确包名与持久授权范围，再用原包规格与选项重试；一次点击批准整个待审列表，其中可能包含此前安装遗留的包；**关闭页面不授予权限**。
- 桌面控制授权绑定实例：`cua` 的应用授权发生在启动/观察/截图/输入之前，任务许可绑定已选择的应用实例；长期许可要求平台验证可执行文件身份。撤销会关闭受影响的 Agent 连接；取消、超时或重连后都不重放输入。

**执行步骤**（actor: 包作者；部署者；用户）：

1. 写出默认状态与开启路径；默认必须是"不发送/不执行"。
2. 把授权绑定到具体事件（反馈、显式命令、GUI 选择），而不是挂载或模型请求。
3. 禁止隐式别名（如 `FULL`）；让非法模式在加载期失败。
4. 区分"完成已授权批次"与"捕获新记录"，前者可在后台发生，后者必须等待新授权。
5. 在 UI 与 README 中说明代价（token、误判、上传范围）。
6. 为每个默认关闭项写"未开启时无副作用"的断言。

**完成信号**：新部署在不做任何选择时不会上传会话、不会自动审查、不会启用实验能力；用户能指出开启点与关闭点；关闭后不再产生新的对外动作。

**失败处理**：发现挂载即上传时移除自动路径；发现 `FULL` 被接受为别名时改为显式拒绝；发现子级复用父级授权时改为要求子级自己的反馈。

**例外与限制**：`session-telemetry-otel` 的撤回只导出删除事件，不保证远端擦除；已授权批次的定时投递可能在无新交互时完成；反馈在插件禁用/卸载期间只记录在本地，重新挂载不会自动重放。`sharing` 属性只报告策略（`feedback-only`/`disabled`），**不代表投递回执**；没有持久 outbox、投递水位或重试承诺，接收方需按 session id、格式版本与 event seq 去重。`auto-review` 没有文件沙箱，PTC 外层 `run_code` 与直接 Node 副作用不经过内层审查；子 agent 进程内审查自己的调用，进程外保留原生权限系统。

**迁移设计**：默认值表（能力 → 默认 → 开启事件 → 关闭行为 → 代价）；把授权检查放在"记录构造"之前而不是发送之前；为每个能力加"未授权时零请求"的测试。

**额外建议**：在 GUI 中显示当前授权状态与最近一次授权时间；为遥测加本地可检查的"待发送/已发送"计数，避免用户只能相信文案。

**验证**：正例——未反馈时无 OTLP 请求；提交反馈后仅释放此前缀。反例——挂载插件即开始上传。恢复——切到 `DISABLED` 并卸载 exporter，确认无新发送。

**证据**：`deepseek-harness/packages/session/session-telemetry-otel/README.md:1-154@687f282e`、`deepseek-harness/packages/telemetry/otel/README.md:1-72@687f282e`、`deepseek-harness/packages/experimental/auto-review/README.md:1-129@687f282e`、`deepseek-harness/packages/experimental/badge-skill-bundle/README.md:1-78@687f282e`、`deepseek-harness/packages/experimental/README.md:1-109@687f282e`、`deepseek-harness/packages/client/ui-settings-plugin-inventory/README.md:1-109@687f282e`、`deepseek-harness/packages/experimental/cua/README.md:1-94@687f282e`。

---

<a id="package-contracts-3.experimental-maturity-and-promotion"></a>

## 实验成熟度与晋升

**何时读**：要把包放进 `packages/experimental/`、从实验组移出、或发布一个"预稳定"能力。

**源义务**：

- **Experimental** 表示完整公共能力仍在评估、不是产品支持承诺；行为或 API 可能变化，能力可能被撤回；但工程、安全、文档、测试与已发布数据义务**仍然适用**。
- 一个包只有在其**整个公共契约**都是实验性或仅内部时才能放在实验组；产品包里的实验性选项留在产品角色中。
- **Optional** 是用户显式选择；**Official** 是项目维护并在 Plugins 页列出；两者都不描述成熟度，发布、默认安装与 GUI 可见性也不决定成熟度。
- 晋升条件：具名产品角色、记录在案的公共行为与限制、当前消费者、发布内容、测试证据。晋升时把包移到产品组、应用该组命名规则，并一起更新受影响的消费者。
- 实验组有依赖隔离：发布包与应用不得在 `dependencies`、`optionalDependencies`、`peerDependencies` 中命名实验包；CI 还检查传递安装、运行时 import 与随附组合。实验包可以依赖发布包与其他实验包；测试可通过 `devDependencies` 使用实验包，示例可显式加载。
- 实验状态不放松工程、安全、文档、生命周期、测试或快照要求。
- 发布实验包不等于晋升，也不增加稳定性承诺；上游实验树（如 `@opentelemetry/sdk-logs`）的 churn 落在共享适配器，seam 契约不移动。
- 包内限制必须如实写"没有 DSH 稳定性承诺""工具 schema 跟随固定的上游 SDK"。
- Auto review 的卸载有迁移顺序：先关闭选择与 admission，把存活 Auto Session 迁移到 Full access 并持久化 `never`，再中止并等待在途 review，最后撤回 listener 与 contribution。重装只恢复选项，不把存活 Session 切回 Auto；持久 Auto Session 缺少完整 integration 时不能发布。

**执行步骤**（actor: 包作者；release owner）：

1. 判定整个公共契约是否实验/内部；只要有一部分是产品承诺，就不进实验组。
2. 按实验命名与发布策略设置 `private`/`publishConfig`；默认加入发布家族，只有策略列出的目录保持私有。
3. 在 README 写清实验状态、可能变化/撤回、仍适用的义务。
4. 加依赖隔离检查：发布包 → 实验包的任何边都失败；测试用 devDependency。
5. 晋升时逐项提交：产品角色、公共行为、限制、消费者、发布内容、测试证据；移动包、改命名、更新 import 与配置行。
6. 晋升后删除"实验"措辞与默认关闭逻辑（如适用），不要留双状态。

**完成信号**：读者能区分"实验"与"可选"与"官方"；发布包不依赖实验包；晋升有可核对的五项证据；实验包的限制没有被"预稳定"措辞掩盖。

**失败处理**：发现发布包依赖实验包时阻断发布；发现实验包获得产品消费者却没有晋升评审时，要么晋升要么移除消费者；发现"发布即稳定"的暗示时修文档。

**例外与限制**：`cua` 因 Windows 支持与平台验证未完成而留在实验组；`computer-use-cua-driver-native` 的原生运行时与宿主共享进程，崩溃可终止宿主；`hooks-codex` 只实现 Codex 命令 hook 子集，未支持事件被静默丢弃；`browser-use-runtime` 的独占附加只在一个 resource manager 内生效，不跨提供方/进程/外部浏览器客户端。

**迁移设计**：建立成熟度标签（experimental/optional/official）与依赖方向规则；把晋升做成清单而不是口头决定；用 CI 检查依赖隔离；实验包 README 必须有"可能变化/撤回"段。

**额外建议**：给实验包加 `exp` 标记与默认关闭的 bundle；给晋升加"删除实验默认关闭开关"的检查，避免晋升后仍默认关闭。

**验证**：正例——实验包只在 devDependencies 被测试使用。反例——发布包 `dependencies` 出现实验包，CI 应失败。恢复——移除边或把消费者改为显式示例。

**证据**：`deepseek-harness/packages/experimental/README.md:1-109@687f282e`、`deepseek-harness/packages/experimental/cua/README.md:1-94@687f282e`、`deepseek-harness/packages/experimental/hooks-codex/README.md:1-190@687f282e`、`deepseek-harness/packages/experimental/browser-use-runtime/README.md:1-96@687f282e`、`deepseek-harness/packages/experimental/computer-use-cua-driver-native/README.md:1-144@687f282e`、`deepseek-harness/packages/session/session-telemetry-otel/README.md:1-154@687f282e`。

---

<a id="package-contracts-3.test-support-tier"></a>

## 测试支持层

**何时读**：你要写夹具、mock、回放、冒烟或 seam 契约测试；或不确定某个包是否该进产品依赖。

**源义务**：

- `test-support` 是**支持层基础设施**，不是产品集成：它提供确定、无密钥的真实产品测试方式；当一个包获得产品契约与产品消费者时，它**移出本组**。
- 冒烟必须走真实入口：`loader-smoke` 从真实 bin 与 `cordis.yml` 启动，在隔离临时目录中运行，拥有 cwd、DSH homes、诊断、截止时间、终止、EOF 与清理；调用方提供的 cwd 不会被删除。
- 源码/构建两种消费路径都要能测：`resolveExampleLaunch` 的 `src` 模式用 tsx 与 `TSX_TSCONFIG_PATH` 走零构建开发路径；`lib` 模式跑构建后的 `lib/` bin，让裸包插件经真实 `exports` 解析，等同已安装消费者。模式来自显式值或 `DSH_EXAMPLE_MODE`（CI 设 `lib`，开发留空），其他值大声失败。
- 设计失败面要固定：`expectedExitCode` 用于"一次 turn 以错误结果结束"这类场景；任何其他退出方式（包括成功）都让冒烟失败。
- 冒烟只观察不内嵌：测试进程只观察与断言，子进程在隔离世界运行；`runFixtureTurn` 在进程内驱动唯一根 agent，等待 durable inbox、转发事件、flush 并返回最终文本与用量。
- seam 契约测试属于 seam 包（见能力 seam），例如 `runPersistenceContract`/`runLiveWritePathContract`；格式夹具用 strict/current 入口（见格式版本）。
- 测试替身不得替代真实入口证据：生产依赖不得指向 test-support；测试可用 devDependency。
- 集成 patch 与 helper 有边界：`production-profile` helper 仅限仓库内部；测试 `*.patch.yml` 只放测试提供方/模型、隔离持久化路径与被测对象专用改动。`lib` 模式要求先构建，且拥有该配置的 package manifest 必须声明配置中点名的每个包。

**执行步骤**（actor: 测试作者；包作者）：

1. 优先用真实 bin + 真实配置做冒烟；只 mock 模型/外部网络。
2. 为每次冒烟建隔离 cwd 与 homes，结束后只清理自己创建的目录。
3. 固定模式（src/lib）并在 CI 设 `lib`；构建缺失时大声失败。
4. 为设计失败写 `expectedExitCode`，不要用"非零即通过"。
5. 为每个 seam 写不变量级契约测试，让所有提供方共享。
6. 把测试支持包放在支持组；一旦它有产品消费者，按成熟度规则移出。

**完成信号**：冒烟在干净环境与已构建环境都能跑；失败时同时保留 stdout/stderr；契约测试能被第二个提供方直接复用；生产 manifest 不依赖 test-support。

**失败处理**：进程不退出时冒烟按截止时间终止并报告捕获流；构建模式缺构建时先构建而不是跳过；超时只杀直接子进程，逃逸进程树需要外部清理（README 明确此限制）。

**例外与限制**：`loader-smoke` 的捕获输出受 execa 默认 100MB `maxBuffer` 限制，超限会终止子进程；超时只杀直接子进程；`test-support` 的 `llm-mock-server` 是 OpenAI 兼容故障服务器，不是通用模型。`session-snapshot` 等包只服务仓库测试。

**迁移设计**：把"真实入口冒烟"和"seam 契约测试"作为两层；测试支持包单独分组，发布清单排除；为每层写清楚它证明什么、不证明什么。

**额外建议**：在 CI 中对安装后的 tarball 跑一次 `lib` 模式冒烟；为契约测试加"故意破坏"的对照提供方，确保测试真的会红。

**验证**：正例——`DSH_EXAMPLE_MODE=lib` 的冒烟通过且使用真实 exports。反例——把 test-support 放进生产 dependencies，依赖检查应拒绝。恢复——移除依赖并把夹具留在测试工程。

**证据**：`deepseek-harness/packages/test-support/README.md:1-53@687f282e`、`deepseek-harness/packages/test-support/loader-smoke/README.md:1-130@687f282e`、`deepseek-harness/packages/session/session-format-catalog/README.md:1-110@687f282e`、`deepseek-harness/packages/session/session-persistence/README.md:1-165@687f282e`。

---

<a id="package-contracts-3.build-artifact-and-platform-support"></a>

## 构建产物与平台矩阵

**何时读**：发布原生二进制、SSH helper、桌面安装包；或声明"消费方安装时不需要编译"。

**源义务**：

- 平台包携带预编译二进制，消费方安装**从不构建原生代码**。`@deepseek-ai/node-addon-system` 的 Linux x64/arm64 包含静态 Landlock 可执行文件与 glibc/musl 两份 `system.node`；macOS 只含 `system.node`；Windows 使用 Harness 既有锁实现。导入入口不加载 addon；缺失 Landlock 可执行文件时 probe 为不可用，缺失 flock 绑定时获取锁 reject——**不编译、不静默授予不支持的行为**。
- 平台支持要有矩阵与所有者：`docs/support-matrix.md` 命名 builders 与 verification owners；Landlock 还需要强制执行的 Linux 内核。
- SSH helper 是私有载体：每个 `dsh-ssh-helper-<version>-<platform>-<arch>.tar.gz` 配 `.sha256`；归档含 `dsh-ssh-helper`、`native/system/`、licenses、`manifest.json`（macOS 另有 spawn helper）；manifest 记录 source commit、source tree 是否 dirty、嵌入 Node 版本、protocol、每个 payload 文件的 digest 与权限。
- 产物必须能被独立验证：`verify-ssh-helper-artifact.ts` 接受 `--archive` 与可选 `--report`，验证并重定位归档、把安装文件设为只读，运行两个并发 Loader 组合共享新原生缓存，覆盖 files/processes/PTY/native flock/PTC；macOS 还跑一个拒绝 checkout 与宿主 Node 的 worker；`--sandbox=required` 要求真实隔离。`verify-ssh-helper-ssh.ts` 创建临时 glibc 2.28 SSH 服务器（无 Node），只挂载 release 与一次性公钥，走生产连接。
- 常规 PR/主干 CI 只跑源码与构建脚本检查，不构建 SSH 可执行文件；涉及 helper 启动、原生依赖或打包的改动必须手动运行 native workflow 后再合并。
- 发布工作流默认 `publish=false`：从选定 ref 构建全部四个目标并校验同一提交的干净构建证据；`publish=true` 要求匹配的 `dsh-v<version>` tag，并把测试过的归档与 `SHA256SUMS` 附到该 GitHub release。
- 平台限制要写清：Windows 与 musl Linux 不是构建目标；自动下载/部署/更新/连接 UI 不在这份归档生产里；可执行文件只接受私有 worker 调用，不是任意 Node CLI，项目 `node` 命令与嵌套 JS 子进程需要自己的 Node。
- 浏览器安全工具只能是词法的：`workspace-path` 的路径解析识别 POSIX/Windows drive/UNC，保留分隔符，不做文件系统访问或 `.`/`..` 规范化；不做 Windows home 推断。

**执行步骤**（actor: 构建 owner；release operator）：

1. 为每个目标平台定义产物、架构、基线（glibc/macOS deployment target）与验证 owner。
2. 归档内放 manifest（源提交、dirty、Node、protocol、摘要、权限）与独立校验和。
3. 写一个在干净消费环境中运行的验证器：重定位、只读安装、真实入口、隔离模式、PTY/flock/PTC 等能力。
4. 把"必须手动构建"的改动面写进贡献说明；CI 不假装覆盖。
5. 发布默认关闭；开启需要 tag 与同一提交的干净构建证据。
6. README 写清不支持目标与"可执行文件不是通用 Node"。

**完成信号**：消费方安装不触发编译；缺失平台二进制时能力 probe 为不可用而不是崩溃或静默；归档可被第三方用校验和与 manifest 验证；发布需要显式开关与 tag。

**失败处理**：校验和不匹配时停止安装；manifest 记录 dirty 时拒绝发布；验证器失败时保留归档与报告，不重试覆盖；缺 native addon 时写所有权拒绝，而不是退回不安全实现。

**例外与限制**：`ssh-helper-runtime` 只构建 Linux/macOS；沙箱可用性仍取决于目标内核与系统工具；`subprocess-ssh` 只承载请求与观察，SSH 本身不隔离 payload；`sandbox-local` 的 Windows ACL 与旧 Landlock 只是 `partial`。

**迁移设计**：把产物当不可变发布物：manifest + checksum + 独立验证器 + 发布开关。为每个平台写"基线 + 验证命令 + owner"。没有原生需求的包不要引入构建步骤。

**额外建议**：在安装后冒烟里检查 `manifest.json` 的 digest 与磁盘一致；为每个发布目标保存一次干净构建的验证报告。

**验证**：正例——下载归档、校验 `.sha256`、解包后运行验证器覆盖 files/PTY/PTC。反例——manifest 标记 dirty 仍允许发布。恢复——从干净提交重建并重新验证。

**证据**：`deepseek-harness/native/system/README.md:1-41@687f282e`、`deepseek-harness/packages/ssh/ssh-helper-runtime/README.md:1-107@687f282e`、`deepseek-harness/packages/ssh/subprocess-ssh/README.md:1-87@687f282e`、`deepseek-harness/packages/sandbox/sandbox-local/README.md:1-149@687f282e`、`deepseek-harness/packages/util/workspace-path/README.md:1-49@687f282e`。

---

<a id="package-contracts-3.market-index-publication"></a>

## 市场索引发布

**何时读**：你要生成或消费插件市场索引，或决定"索引里的声明由谁负责"。

**源义务**：

- 索引格式 1 是一个 JSON 文件；`dsh-plugin-market-index` 是其**可执行规则集**：`parseMarketIndex(value, indexUrl)` 在第一条违规规则上抛 `MarketIndexError`，携带 JSON path 与 reason；成功结果丢弃格式未定义的成员，补齐缺失的 metadata 组/`keywords`/`labels`/`sortKeys`/`engines`，按 SemVer 降序排列版本，并把相对 `icon` 换成绝对 URL。
- 安装必须精确：`marketInstallTarget(name, version)` 返回 npm 的 `name@version`，或 Git 的 commit 固定 `git+https` URL（可带 `path:`），以及需要先询问的 registry。
- 生成器只读：它读取 npm 包名与 Git URL 列表，写一个 `index.json`，**从不安装或运行所描述包的代码**。版本只在 `package.json` 声明 `dsh.bundle` 且 `patch` 是文件路径或路径列表时才列出。
- 生成器必须用校验器验证输出后再发布；校验器无法验证 `name`、`version`、`publishTimestamp`、`engines.dsh`、展示字段是否与包本身一致，也无法验证包是否声明 bundle——这些是**生成器义务，未被检查**。
- 安全边界：npm tarball 在内存读取，单个 tarball 与解包文件各不超过 64 MiB，字节必须匹配 registry integrity，只保留 `node_modules` 外的常规文件且不允许越界路径；Git 以 depth 1 取到私有临时裸仓库，按 blob 读取，不产生工作树，checkout filter/LFS/符号链接不生效，符号链接与 submodule 视为不存在；Git 禁用 hooks 与文件系统监视、禁用 submodule、只允许 https/ssh、除 `GIT_SSH`/`GIT_SSH_COMMAND` 外不继承 `GIT_*`。
- 确定性：缓存按不可变输入分区，原子写；损坏或被格式拒绝的缓存重建；输出按列表顺序，内容不变则不重写索引与图标。
- 退出码：0 表示每个来源都读到；1 表示某个来源读不到；2 表示参数或列表非法。不可读来源保留上一次成功结果，但仍报告失败。
- **索引内容是包对自己的声明**。发布前必须审查列表：一个被列出的仓库可以使用任意包名。
- 限制：Git 服务器必须允许按 SHA 取 commit；`.npmrc` registry token 不生效，只支持公开/未认证 registry；Git 从不提示凭据，需要凭据的仓库必须能通过 credential helper 或 ssh agent 读取。校验器**不限制索引文档本身的大小**，调用方必须在解析前限界；内联图标上限是 `MAX_INLINE_ICON_BYTES` = 32 KiB。

**执行步骤**（actor: 索引生成者；发布者；消费者）：

1. 写来源列表（每行一个 npm 名或 Git URL；空行与 `#` 注释忽略）。
2. 生成前确认每个候选声明 `dsh.bundle`；否则不会被列出。
3. 生成后先跑 `parseMarketIndex`；失败修来源或生成器，不手改索引。
4. 审查最终列表与展示字段；记住校验器不验证"包是否真的如其声明"。
5. 把输出目录通过 https 发布；图标过大时写入 `icons/`，清理不再引用的图标。
6. 消费者侧把 `index.json` URL 加为 Discover 的索引源；安装走 `marketInstallTarget` 的精确 spec。

**完成信号**：索引可被 `parseMarketIndex` 接受；重复运行输出字节不变；每个版本都能追到 registry/tag/commit；发布者能说出"哪些声明未被验证"。

**失败处理**：某来源不可读时保留上次成功结果并报告失败，不删除插件；列表行非法（`http:`、带凭据、query/fragment、少于两段路径、tarball URL）时按 exit 2 拒绝；生成器与校验器版本不一致时先升级再生成。

**例外与限制**：`engines.dsh` 的推导有细节（manifest `engines.dsh` 优先；否则合并 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` peer ranges；`workspace:*`/`^`/`~` 表示运行版本且不添加；全 `*` 不列出；空范围、非法范围、无法共同满足的范围会跳过并警告）。Git 标签规则：`vX.Y.Z`/`X.Y.Z` 适用于所有包，`<name>@X.Y.Z` 只适用于同名包；同名版本多标签时 `<name>@` 优先，再早提交优先。索引格式有 `MAX_INLINE_ICON_BYTES` 32 KiB 上限。

**迁移设计**：先写格式 + 校验器 + 夹具，再写生成器；生成器输出必须过校验器；为"未验证声明"写显式文档；把缓存与输出确定性写成测试。

**额外建议**：在发布流水线里对索引跑 schema 校验与链接检查；对来源列表做人工审查记录，因为内容真实性无法自动验证。

**验证**：正例——生成 → `parseMarketIndex` 通过 → 重复运行字节一致。反例——`http:` URL 或带凭据 URL 被接受。恢复——修列表后重新生成，旧索引保留。

**证据**：`deepseek-harness/apps/plugin-market-generator/README.md:1-78@687f282e`、`deepseek-harness/packages/util/plugin-market-index/README.md:1-74@687f282e`。

---

<a id="package-contracts-3.composition-ownership"></a>

## 组合所有权

**何时读**：决定谁拥有启动器参数、进程退出、stdin/stdout、路由、fallback 席位、设置标签页或 profile 组合。

**源义务**：

- 启动器只拥有自己的前缀：`cmdline` 的位置切分是"启动器不认识的第一个 token 开始应用参数"；`ctx.cmdlineArgs` 返回不可变快照且读取不消耗；`ctx.appExit` 接启动器关停控制器；`ctx.appReady` 只在 Loader 树与启动器自有 setup 成功后提交。应用拥有自己的 flag 家族、`--help` 文本与解析错误；`--help`/非法值打印后请求退出且**不发布任何值**，依赖解析值的行不会启动。
- flag 胜过配置：写在 `!!js` 表达式旁的值是 fallback；解析在启动时一次完成，后续配置 reload 不会静默重置 flag。
- 进程边界：`acp-app` 的 stdout 保留给换行分隔的 ACP JSON-RPC 帧；`sdk/server` 的 stdout 只承载 JSON-RPC，部署不得组合 stdout logger；`shutdown` 冲洗响应、dispose 根上下文到静默、再 exit 0；EOF 与信号退出归 app bin。`acp-app` 在 YAML 中禁用 HMR，让一个 stdio 连接永远看不到被替换的 bridge 或 Agent 依赖。
- 组合替换是整套的：`acp-app` 明确"部署通过 profile bundle 与 patch 文件选择另一个完整组合，而不是另一个 app bin"；后续 patch 可以替换某行的完整 config，但 base profile 拥有 adapters、tools、persistence、policy、settings、credentials 与 per-session workspace。
- 路由归功能插件：`host/webserver` 只提供具名 exact/prefix 路由、upgrade 路由、index 注入与唯一 fallback 席位；`/api` 桥、插件 bundle、HMR 事件流、SPA dist 都属于注册它们的插件；注册顺序没有请求语义，因为具名路由被设计为不相交。
- 单一席位：第二个 fallback 注册抛错；未注册 fallback 时 404；重复路由在两张表内都抛错。
- 生产方需要显式控制器：`tool-jobs` 注册的三个工具与控制器是 `ctx.jobs.start()` 得以启用的前提；组合中缺少它时，生产方仍可加载，但 agent 无法启动后台工作。
- 子 agent 不继承权限：`subagent-fork-in-process` 只传父级最后一个已完成轮次的对话前缀；子级获得全新工具作用域与 preset 代际，父级的权限与本地限制不会被复制。
- 共享宿主保持单例：与宿主并排安装的包必须把 `dsh-scope`、`dsh-mcp-client` 等声明为 `peerDependency`；写成 `dependency` 会装入第二份实例，作用域标记失效，工具注册到全局层并使第二个 Agent 创建失败。
- 只读投影不能成为第二生命周期真相：`host/plugin-inventory` 每次 `list()` 直接读 `ctx.loader.entries()`，不做缓存，因为 Cordis 的 `plugin/status` 已维护 fiber 状态。
- 设置壳只拥有导航与标签行：`ui-settings-plugins` 声明 `settings.plugins.tab` 根列表；每个标签页由功能插件注册，壳不填内容，单独存在时显示空行。

**执行步骤**（actor: 组合者；app bin 作者；插件作者）：

1. 画一张所有权表：启动器前缀、app 参数、进程退出、stdin/stdout、配置层、路由、fallback、设置标签、持久化。
2. 每个表面只设一个所有者；其他插件通过声明/注册/注入参与。
3. 在启动期检测重复席位并抛错；不要"后注册覆盖先注册"。
4. 把进程退出与信号处理放在 app bin；库插件只请求关停，不直接 `process.exit`。
5. 声明"改变配置需要重启"还是"热更新"，并让实现一致。
6. 在 README 写清"不要组合什么"（例如 stdout logger）。

**完成信号**：同一表面没有两个写者；`--help` 不占用 stdin/stdout；`shutdown` 后持久化与 agent 达到静默；路由冲突在启动期失败。

**失败处理**：出现两个 fallback/同名路由时让第二个失败；发现插件直接退出进程时改为请求 `ctx.appExit`；发现 stdout 被日志污染时移除 logger 或改走 stderr。

**例外与限制**：`cmdline` 的启动器 flag 必须在应用参数之前；需要字面 `--` 时用 `-- --`；应用自有服务没有静态声明的 provider，省略 provider 的 bundle 会在 settlement 以 pending 条目失败而不是加载期。`sdk/server` 的 wire 没有 per-session close 或 prompt-cancel，SDK 创建的 agent 活到进程关闭；stdout 纯度是部署责任，插件不检查兄弟 logger。`acp-app` 的用户插件仍可违反 stdout 纯度。

**迁移设计**：先写所有权表，再写组合；把"唯一席位"实现为启动期断言；把进程生命周期收口到 app bin；把可替换组合做成 profile/patch，而不是 fork bin。

**额外建议**：在启动时打印一张"已注册路由/席位/标签"清单，便于发现冲突；为 stdout 纯度加集成测试（解析每一行）。

**验证**：正例——`dsh --profile acp --help` 输出帮助并退出，不占用 stdin。反例——两个插件注册 fallback 都成功。恢复——移除重复注册并 reload。

**证据**：`deepseek-harness/packages/boot/cmdline/README.md:1-148@687f282e`、`deepseek-harness/packages/bundle/acp-app/README.md:1-74@687f282e`、`deepseek-harness/packages/sdk/server/README.md:1-143@687f282e`、`deepseek-harness/packages/host/webserver/README.md:1-144@687f282e`、`deepseek-harness/packages/host/plugin-inventory/README.md:1-114@687f282e`、`deepseek-harness/packages/client/ui-settings-plugins/README.md:1-79@687f282e`、`deepseek-harness/packages/jobs/tool-jobs/README.md:1-187@687f282e`、`deepseek-harness/packages/subagent/subagent-fork-in-process/README.md:1-155@687f282e`、`deepseek-harness/packages/experimental/browser-use-runtime/README.md:1-96@687f282e`。

---

<a id="package-contracts-3.shared-ui-atoms-and-renderer-registry"></a>

## 共享 UI 原子与预览注册

**何时读**：两个功能插件都需要同一个控件；要给工具结果新增卡片；要注册新的文件预览器；或要确认不可信 Markdown、终端与网页内容由谁负责清洗。

**源义务**：

- **单一控件席位**：功能插件不能运行时 import 或 re-export 另一个功能插件的组件；`ui-primitives` 是唯一可共享控件的地方。第二个包需要同一控件时把它上移进 `ui-primitives`，不得复制；只有真正特殊的控件才留在自己的包内。
- **原子组件零 Cordis、零 slot 知识**：它们只经 React 渲染并通过 props 接收文案；颜色取 `--dsw-*` 设计 token，因此不绑定主题或 slot 实现。
- **文案由渲染点拥有**：原子组件拿不到 `ctx.locale`，每个面向用户的 label 都必须通过类型化 prop 传入；遗漏会让类型检查失败，原子组件不提供语言回退。
- **不可信输出用共享渲染器**：`MarkdownText` 丢弃原始 HTML、限制链接、只把清洗后的 HTTP(S) URL 交给 `MarkdownDelegateProvider`；`TerminalBlock` 解析 ANSI 而不是执行终端控制序列；`DiffBlock` 在片段增删超过 256 行时退化为粗粒度替换；1,000 UTF-16 单元以上的源码行不着色。
- **预览以元数据 + 正文双注册**：`ctx.documentPreviews.register({ id, extensions, binaryExtensions?, priority, title, loading, wrap? })` 声明能力，同一 `id` 向 `sidebar.right.tab.document` 注册正文；两个注册都由 effect 持有。
- **档位固定**：`extension`（默认）优先于 `builtin`，随后按更长后缀、注册顺序排序；更窄 pattern（如 `*.png`）接走地址，其余落到 `fallback`。所选实现仍可用时，下拉选择保持不变。
- **内容身份是整个地址**：同名不同目录、或同一路径在不同 Session 下，是两个 tab；`canOpen` 只接受 Session 地址，裸 `absolute` 不认领；`hostFileOf(address)` 只从地址取 Session，不借用当前或 Tab Session。
- **失败空态有出路**：`not-text`、`too-large`、不支持预览与未知二进制容器分别显示说明，并可通过 `sidebar.right.tab.document.unpreviewable` 交出打开控件；载体或未分类失败保留重试，不存在或非普通文件只给说明，且不发起读取。
- **依赖资源包原子发布**：脚本 HTML 预览的本地 `.js`/`.css` 依赖受单个 4 MiB、总计 32 MiB、64 个不同资源的上限；任一读取失败、无效 UTF-8 或超限都使预览失败，不发布部分资源包；`sandbox="allow-scripts"` 不含 `allow-same-origin`。
- **只有渲染该表面的包才能改变它**：预览不提供编辑或共享搜索；字节只留瞬态视图状态，不进入布局或 Session JSONL；Excel 的 `maxBytes`/`maxCells`/`timeoutMs` 与 Office 缓存上限是 UI 侧补充，不是 Host 读取上限的替代。

**执行步骤**（actor: 客户端库作者；功能插件作者；预览器作者；reviewer）：

1. 先查 `ui-primitives` 组件目录；能复用就复用，视觉差异做成 prop，而不是复制一份。
2. 需要新原子时，在 `ui-primitives` 内实现，保持零 Cordis；所有 label 用带类型的 prop，由功能包传入本地化文案。
3. 渲染工具输出或模型 Markdown 时使用共享卡片、Markdown 与终端组件，不自行拼 HTML 或信任 `dangerouslySetInnerHTML`。
4. 注册预览器时声明扩展名、二进制后缀、`priority`、`loading` 模式与 `wrap` 能力；为未知扩展名保留纯文本 fallback。
5. 只为 Session 地址注册；把授权 Session 放进地址，不读取调用方当前 Tab。
6. 失败空态按原因给出重试或 `unpreviewable` 出口，不发布部分内容。
7. 在 README 的 Model Experience 写 `None` 并解释浏览器侧原因；限制段写清超长行、Diff 上限与依赖包上限。

**完成信号**：同一控件只存在于一个共享包；功能插件之间没有组件 import；类型检查能发现缺失 label；预览 tab 的地址包含 Session 且同名文件不串台；失败时没有部分内容进入 store 或模型历史。

**失败处理**：发现跨功能插件 import 组件时改为上移共享组件或走 slot/injection；发现复制控件时删除副本；发现硬编码文案时补类型化 label；发现裸 `absolute` 地址时改为 Session 地址；发现部分资源包被发布时改为全有或全无。

**例外与限制**：需求确实特殊时可以在自己的包内写组件，但不得复制已有控件；`MarkdownText` 流式期间跨冻结边界的引用式链接暂时显示字面文本，settle 后才解析；`TerminalBlock` 不是交互式终端模拟器，会剥离绝对光标定位、清屏与备用屏幕序列；HTML 本地依赖只支持直接引用的经典脚本与 CSS；Excel 上限不封顶浏览器进程内存与解压分配；预览不提供编辑。

**迁移设计**：先建立共享原子包与"组件目录"评审规则；把功能包之间的组件依赖改成基座 import 或 slot；建立预览注册表，把档位、内容身份与失败空态写进注册协议；用类型化 label 接口把本地化责任固定在渲染点。

**额外建议**：在 lint/依赖检查里禁止功能包之间的相对 import；给预览注册表加"重复 id/冲突档位"测试；给资源包加"任一依赖失败不得发布"的集成测试。

**验证**：正例——两个功能包复用 `Button` 与 `Tooltip`，各自传入本地化 label，类型检查通过。反例——功能包 A 从功能包 B import 组件，或复制一份控件；评审/依赖检查拒绝。恢复——删除跨包 import，把共享控件上移到 `ui-primitives` 并更新调用点。

**证据**：`deepseek-harness/packages/client/ui-primitives/README.md:1-221@687f282e`、`deepseek-harness/packages/client/ui-sidebar-documentpreview/README.md:1-157@687f282e`。

---

<a id="package-contracts-3.read-only-projection"></a>

## 只读投影与快照

**何时读**：你要给 UI/诊断提供"当前状态"视图，或要给模型提供其他会话/文件的只读内容。

**源义务**：

- 读服务不提供写：`workspace-files` 明确"本服务不提供修改操作"；文本按页读、字节按窗口或完整文件读、目录只列直接子项、变化订阅只报失效；目录列举与目录监听限定在 Session 工作区，文件读取与监听走文件系统后端的读取权限。
- 不借上下文：文件地址必须携带授权 Session；`absolute/<path>` 可解析但没有授权 Session，会以 `workspace-file/unknown-workspace` 失败，**不借用当前或 Tab Session**；冷 Session 用持久化 `stat` 解析，不激活 Agent、不读事件体、不借父 Session 根。
- 快照是时点的：`host/plugin-inventory` 每次调用读当前 Loader，返回点时间快照；没有历史、没有变更订阅、不能启用/禁用/增删插件；`null` 阶段不区分"从未启动"与"已 dispose"。
- 只读投影不声明第二入口：`host/plugin-inventory` 仅经 Remote 暴露，刻意不声明同进程 Cordis `Context` 合并；每次 `list()` 直接读 `ctx.loader.entries()`，不加缓存，因为 `plugin/status` 已维护 fiber 状态。`disposed` 折叠为 `null`，阶段不推断原因；它也不标识条目由哪个 bundle/profile/override 引入。
- UI 只读面不得越权：`ui-settings-plugin-inventory` 是 Host 快照的只读投影，插件激活时不发 Remote 读，首次选择才懒加载；它不改全局或预设启停，预设切换器只改列表显示、不写 settings。
- 快照不可变且可追溯：`session-reference` 的捕获在 `agent/pre-step` 对每个被引用会话读一次当前表面，预览与 spill 用同一捕获投影；快照插入在引用消息之后，目标日志记录可读直接消息 + 来源上下文；源后续变更不能改变目标回放；不伪造工具调用。
- 预览不是编辑：`ui-sidebar-documentpreview` 只预览，不提供文件编辑或共享搜索；字节留在瞬态视图状态，不持久化到布局或 Session JSONL；目录地址以 `not-regular-file` 失败。
- 受信任调用方边界：`session-reference` 假定宿主有权读取 `ctx.sessionQuery` 暴露的每个会话；它**不是面向模型的搜索工具**，也不为补全标题打开整份日志——发现只读实时投影/持久检查点，投影缺失时回退到会话 id。
- 未建立的事实不得编造：`schedule` 不存在的历史记录不重写、不重建、不从 Session 日志推断；`session-reference` 不搜索消息体；`plugin-inventory` 不推断 layer 归属。
- 归档准入是只读生命周期判断：`schedule` 规定有活动提醒的会话不能归档，直到提醒停止；停止会删除全部活动提醒，取消归档不会把它们带回来。投影层只能回答准入，不能替拥有者静默清理。

**执行步骤**（actor: 投影作者）：

1. 明确投影的权威源（日志、Loader、文件系统、会话表面），并只读它。
2. 定义快照边界：何时取、是否订阅、失效后如何刷新。
3. 每个地址/查询携带授权身份；缺失身份时失败，不借用环境默认。
4. 返回类型区分"未知/不支持/不存在"，不要用空值掩盖。
5. 不提供任何写方法；需要写时交给拥有写权限的服务。
6. 在 README 写清"点时间/无历史/不可变"语义。

**完成信号**：调用方无法通过读服务改变状态；同一快照在其生命周期内稳定；缺失授权时明确失败；UI 不需要为只读视图引入第二份状态。

**失败处理**：发现投影缓存成为第二真相时删除缓存并直接读权威源；发现借用当前 Session 时改为显式地址；发现 UI 写入 settings 时把写路径移回拥有者。

**例外与限制**：`workspace-files` 的 `maxEntries` 只限制返回数组，不限制底层 `listDir` 的全量列举成本；死 feed 在 Host 结束后保留最后元数据直到重开；`host/plugin-inventory` 的点时间快照在 Settings 挂载/重试之间不自动刷新；`session-reference` 不传播非文本块、不建立实时链接；`ui-sidebar-documentpreview` 的 HTML 预览依赖 Host 的 `/api/file` 路由与 HTTP(S) 应用基址。

**迁移设计**：把"读模型"与"写模型"分成不同服务/类型；快照带 `asOf`/版本；地址必须带授权主体；对不支持的能力返回 typed unsupported，而不是空结果。

**额外建议**：给只读服务加"无写方法"的接口测试；给快照加"源变更后旧快照不变"的测试；给地址解析加"无 Session 必须失败"的反例。

**验证**：正例——`absolute/` 文件地址返回 `workspace-file/unknown-workspace`，不借用当前 Session。反例——插件清单能启用/禁用插件。恢复——刷新快照或重新挂载 Settings，不重启 Host。

**证据**：`deepseek-harness/packages/api/workspace-files/README.md:1-158@687f282e`、`deepseek-harness/packages/host/plugin-inventory/README.md:1-114@687f282e`、`deepseek-harness/packages/client/ui-settings-plugin-inventory/README.md:1-109@687f282e`、`deepseek-harness/packages/context/session-reference/README.md:1-147@687f282e`、`deepseek-harness/packages/client/ui-sidebar-documentpreview/README.md:1-157@687f282e`、`deepseek-harness/packages/schedule/schedule/README.md:1-172@687f282e`。

---

<a id="package-contracts-3.bounded-transfer-and-truncation"></a>

## 有界传输与显式截断

**何时读**：读取文件、跨会话引用、LSP 结果、遥测批次、输出收集或任何可能无限增长的返回。

**源义务**：

- 每个读面有明确上限：`workspace-files` 的 `maxBytes` 2 MiB、`maxFileBytes` 32 MiB、`maxLines` 5000、`maxEntries` 2000；超过页/窗口/完整文件上限以 `workspace-file/too-large` 失败（带 `limit`），不静默截短；一页 `read` 永不返回整个文件。
- 文本与二进制的拒绝条件不同：文本页还拒绝无效 UTF-8 与 NUL（`not-text`），字节窗口不解码；完整文件读取受 `maxFileBytes` 约束，但显式 `range` 窗口只受 `maxBytes` 约束，更大窗口必须失败而不是截短。
- 失败必须可路由：`workspace-files` 用 `workspace-file/*` 类型化 code + details 表达失败，调用方按 code 分支，不按 message 文本。
- 区分"失败"与"截断"：LSP 的 `maxLocations` 先限条目数、`maxResultChars` 再限完整渲染文本；省略/截断标记计入字符上限；cap 只影响呈现，不影响 canonical result value。`session-reference` 的截断预览外另给 omission notice，包含精确 `omittedMessages`/`omittedBytes` 与保存位置或不可用结果；notice 属于同一持久上下文消息。
- 上限不得制造假象：`workspace-files` 的 `maxEntries` 只约束答案，不约束底层列举成本；一条超过 `maxBytes` 的巨行在每个包含它的窗口都 `too-large`，因为分页按行而不是按字节。
- 传输上限可下调不可上调：`session-telemetry-otel` 的 `maxRequestBytes` 默认 4,000,000，只允许降低；单个超大事件产生一条拒绝诊断而不截断；请求按保守大小贪心打包。
- 文档预览有独立上限：Excel `maxBytes` 16 MiB、`maxCells` 250000、`timeoutMs` 15000；Office 缓存 `maxCachedEntries` 8、`maxCachedBytes` 64 MiB、`maxPending`/`maxReaders` 8/32；HTML 依赖 4 MiB/资产、32 MiB 总计、64 个资产。
- 输出收集保留尾部并标记溢出：`subprocess-local` 的内存尾部为最后 `maxBytes`，可选 spill 完整流；超过 spill 上限的流丢弃不完整 spill，只返回带标记的截断尾部；读超过保留尾部为 `lossy` 并指向 spill。
- 通知也受限：`tool-jobs` 的 producer `outputLimitBytes` 限制完整模型可见结果；截断的完成通知在空间足够时保留完整 job id 与 `job_output` 动作，否则在至少 8 字节时指向 `job_list`，更小只能带前缀。

**执行步骤**（actor: 读服务作者）：

1. 为每个返回面定义上限与单位（字节/行/条目/字符/请求）。
2. 选择超限行为：拒绝（需要完整数据）或截断（可接受近似），并让类型可区分。
3. 截断时把标记/计数放进上限内；另给超出预算的 omission 元数据。
4. 保持 canonical 值与呈现分离：cap 只影响呈现。
5. 把上限做成配置时，明确可上调/可下调与默认值来源。
6. 测试边界：恰好等于上限、上限+1、超大单行/单事件。

**完成信号**：任何输入都不会让返回无界增长；调用方能区分"没有更多"与"被截断"；截断不伪装成完整。

**失败处理**：发现静默截短时改为显式错误或标记；发现标记不计入上限时修正；发现上限只约束答案不约束工作时在 README 声明成本。

**例外与限制**：`workspace-files` 的 `maxEntries` 不限制底层列举；`session-reference` 的自动预算是 `max(65536, floor(contextWindow × 4 × referenceContextFraction))` 字节，四字节每 token 是 sizing heuristic 而非精确转换；`ui-sidebar-documentpreview` 的 Excel 上限不封顶浏览器进程内存或解压分配；`subprocess-local` 的 spill 是 best-effort，目录被清理后退化为内存尾部。

**迁移设计**：建立"返回面 → cap → 超限行为 → 标记 → 是否影响 canonical"的表；默认拒绝而不是截断，除非调用方明确能处理近似；把 cap 放在服务边界而不是渲染层。

**额外建议**：为每个 cap 加属性测试（随机大小输入，断言返回值不超过 cap 且标记正确）；为"上限+1"加显式用例。

**验证**：正例——超过 `maxFileBytes` 的完整文件读取返回 `too-large` 而不是截断。反例——超大单事件被静默截断后仍标记成功。恢复——调用方改用分页/窗口读取。

**证据**：`deepseek-harness/packages/api/workspace-files/README.md:1-158@687f282e`、`deepseek-harness/packages/context/session-reference/README.md:1-147@687f282e`、`deepseek-harness/packages/lsp/tool-lsp/README.md:1-179@687f282e`、`deepseek-harness/packages/session/session-telemetry-otel/README.md:1-154@687f282e`、`deepseek-harness/packages/client/ui-sidebar-documentpreview/README.md:1-157@687f282e`、`deepseek-harness/packages/jobs/tool-jobs/README.md:1-187@687f282e`、`deepseek-harness/packages/subprocess/subprocess-local/README.md:1-168@687f282e`。

---

<a id="package-contracts-3.configuration-contract"></a>

## 配置契约

**何时读**：新增配置字段、改默认值、决定加载期还是请求期校验、或要保证生成目录与实现一致。

**源义务**：

- 生成配置目录是穷尽来源：每个包 README 指向 `docs/config-catalog.md#<package>`，其中的字段与 JSDoc 是完整列表；README 不重复枚举。
- 加载期失败优先：`host/webserver` 在加载期拒绝通配地址（不等到监听后才发现），TLS 文件在绑定前读取，坏证书/密钥不匹配/绑定失败都拒绝初始化；`tool-jobs` 的 `waitTimeoutMs > maxWaitTimeoutMs` 在加载期失败；`session-telemetry-otel` 的非法字节上限、非正队列/定时值、`maxExportBatchSize > maxQueueSize`、非法端点、非法关闭期限都在加载期失败。
- 没有普适默认值时要求显式配置：`session-title` 的三个上限全部必填（库不提供默认）；JSONL 的 `root` 必填且没有默认，因为 `process.cwd()` 默认会随进程 cwd 散落会话文件；`session-projection-cache` 的 `writeEveryEvents`/`writeIntervalMs` 必填，因为 flush 节奏是部署选择。
- 默认值必须写清来源与范围：`permission-presets` 的默认表是 `workspace-write` + `danger-full-access`，`defaultPreset` 在组合默认不匹配任何预设时必填；`web-deepseek-api` 的 `count` 1–50、`sendOriginalQuestion` 默认 true、`apiKeyEnv` 默认 `DEEPSEEK_API_KEY`；`sandbox-local` 的 `probeTimeoutMs` 5000、`runnerFailureSignatures` 与 `runnerCommand` 必须成对。
- 保留名与命名空间：`permission-presets` 的 `custom`（派生状态）与 `auto`（Auto 集成）不能出现在配置表；`permission` settings 命名空间只接受已配置预设，Auto 被有意排除；会话创建读取默认值并记录 `permission/preset`，后续 settings 变更不改既有会话。
- 失效的持久选择必须大声失败：存储的 `auto` 身份在 Auto integration 缺失或拒绝准入时不能发布；服务既不静默改写它，也不推导为 Full access。删除被引用的预设时，必须在同一次配置编辑中修改 `defaultPreset`。
- 单提供方席位：`session-title` 只接受一个 provider，第二次注册在前一个开始释放前立即抛错；替代者可在前一个排空期间激活，但前一个迟到的结果不得提交。
- 配置求值时机：`cmdline` 的 `!!js` 插值在声明注入激活后才解析，因此 flag 不会被后续 reload 静默重置；配置文本身可以引用凭据（见凭据机制），但不能包含值。
- 只允许收紧的字段要写明：`session-telemetry-otel` 的 `maxRequestBytes` 只能降低；`tool-jobs` 的模型等待超过 `maxWaitTimeoutMs` 会被 clamp 到上限。
- 服务端/客户端配置分离：`workspace-files` 的 Client 没有单独配置，由 bundle 的单行同时提供两面；`ui-sidebar-documentpreview` 的 Excel/Office 配置在 `ui-sidebar-documentpreview` 条目上，改变后需 reload 浏览器页面。

**执行步骤**（actor: 包作者；部署者）：

1. 为每个字段写类型、默认值（或"必填"）、范围、求值时机、失败模式。
2. 能在加载期判断的错误不要留到请求期。
3. 没有普适默认值的字段设为必填，并在错误消息里说明为什么。
4. 保留名在加载期拒绝；命名空间只接受声明的键。
5. 生成配置目录；README 只链接，不复制。
6. 为每个字段写"非法值在加载期失败"的测试。

**完成信号**：部署者只读生成目录就知道所有字段与默认值；非法配置在启动期失败且错误命名字段与路径；改变默认值不会静默改变既有会话。

**失败处理**：发现非法值到请求期才失败时前移到加载期；发现默认值导致文件散落或行为不可预测时改为必填；发现 README 与生成目录不一致时以目录为准并修 README。

**例外与限制**：`host/webserver` 的 `tls` 不做证书生命周期管理，替换文件需要 reload；`socket` backlog 等选项保持内部；`session-title` 的 provider 注册是运行时而非配置；`permission-presets` 的配置表在插件生命周期内固定，只有固定的 Auto 贡献能改变活目录。

**迁移设计**：schema 驱动：类型 → 校验 → 生成目录 → 测试。把"必填/默认/保留名/求值时机"作为 schema 元数据，生成文档与错误消息都从同一来源来。

**额外建议**：在启动日志打印生效配置的脱敏摘要；为配置目录加"每个字段都有 JSDoc"的 CI 检查。

**验证**：正例——通配 host 在加载期被拒绝。反例——非法 `waitTimeoutMs` 在第一次工具调用才失败。恢复——修正配置并重启/reload。

**证据**：`deepseek-harness/packages/boot/cmdline/README.md:1-148@687f282e`、`deepseek-harness/packages/host/webserver/README.md:1-144@687f282e`、`deepseek-harness/packages/jobs/tool-jobs/README.md:1-187@687f282e`、`deepseek-harness/packages/session/session-title/README.md:1-149@687f282e`、`deepseek-harness/packages/interaction/permission-presets/README.md:1-147@687f282e`、`deepseek-harness/packages/session/session-projection-cache/README.md:1-140@687f282e`、`deepseek-harness/packages/session/session-persistence-jsonl/README.md:1-181@687f282e`、`deepseek-harness/packages/session/session-telemetry-otel/README.md:1-154@687f282e`。

---

## 附录 A：53 个包的契约速查

| 包 | 读它解决什么 | 关键限制 |
|---|---|---|
| `apps/desktop/tests/installed-update` | Windows 已安装更新的人工验收序列 | 打包/签名成功不等于安装成功；证据需人工补齐 |
| `apps/desktop/windows-signing` | 签名 runner、EV Token、联锁与缓存 | 信任内部团队；残余风险 #5973；无定时恢复 |
| `apps/plugin-market-generator` | 生成市场 `index.json` | 只读下载；公开 registry；内容真实性需人工审查 |
| `native/system` | 预编译 Landlock/flock | 不编译；缺可执行文件时 probe 不可用 |
| `api/workspace-files` | 有界文件读取与目录监听 | 无写操作；目录限定工作区；无总行数 |
| `boot/cmdline` | 应用自有命令行 | 启动器 flag 必须先于应用参数 |
| `bundle/acp-app` | ACP stdio profile | stdout 只放协议帧；配置变更需重启 |
| `client/file-upload` | Session 寻址上传 | 不可续传；stream 一次性 |
| `client/store` | 无 React 的状态原语 | 持久化仅 localStorage |
| `client/ui-primitives` | 共享 React 原子与输出卡 | 零 Cordis；文案由调用方提供 |
| `client/ui-secret-mask` | 显示遮挡凭据 | 只影响绘制；只覆盖 UserText |
| `client/ui-settings-plugin-inventory` | 只读插件清单 | 点时间快照；不可启停 |
| `client/ui-settings-plugins` | 设置壳/标签行 | 自身无标签页 |
| `client/ui-sidebar-documentpreview` | 文档预览 | 只读；字节不持久化 |
| `context/session-reference` | 跨会话引用快照 | 不可信背景；无实时链接；只投影文本 |
| `credentials/credentials` | 凭据引用与记录 | 引用不可枚举；记录 owner 不校验 |
| `credentials/deepseek-account` | 账号登录/令牌 | 无过期/刷新；Host-only |
| `experimental` | 实验状态与晋升 | 不放松工程/安全/测试义务 |
| `experimental/auto-review` | 逐调用自动审查 | 默认关闭；可误判；无文件沙箱 |
| `experimental/badge-skill-bundle` | 徽章 skill | 默认关闭；需 preset 支持 skill |
| `experimental/browser-use-runtime` | 浏览器所有权/MCP 激活 | 独占仅限一个 manager |
| `experimental/computer-use-cua-driver-native` | 原生桌面工具 | 需要宿主权限；原生崩溃可终止宿主 |
| `experimental/cua` | 应用/窗口对象与同意 | 仅有 macOS 原生执行；动作未验证 |
| `experimental/hooks-codex` | Codex hook 子集 | 5/10 事件；多处 partial |
| `host/plugin-inventory` | Loader 只读投影 | 无历史/订阅/变更 |
| `host/webserver` | HTTP/TLS 与路由席位 | 无证书生命周期；无全局认证 |
| `interaction/permission-presets` | 权限预设 | 只捆绑两个 knob；custom 只读派生 |
| `jobs/tool-jobs` | 后台任务工具与通知 | 唤醒预算耗尽后需用户输入 |
| `lsp/tool-lsp` | 只读代码导航 | 无跨服务器完整性承诺 |
| `sandbox/sandbox-local` | 本机进程隔离 | Windows ACL/旧 Landlock 为 partial |
| `schedule/schedule` | 持久提醒 | 无恰好一次；无暂停/跨会话投递 |
| `sdk/server` | stdio JSON-RPC 服务 | 无 per-session close/cancel；stdout 纯度靠部署 |
| `session/session-format-catalog` | 格式编解码与迁移链 | 仅第一方构建清单；运行时不能补 edge |
| `session/session-persistence` | 持久化 seam | 单写者仅限后端实例；无删除 API |
| `session/session-persistence-jsonl` | 每会话 JSONL | 无删除；压缩不可直接行读 |
| `session/session-projection-cache` | 投影检查点 | 无淘汰；schema 变更须带夹具 |
| `session/session-telemetry-otel` | 反馈授权 OTLP 导出 | 无持久 outbox；撤回≠远端擦除 |
| `session/session-title` | 持久标题 | log-only；单 provider |
| `session/tool-working-directory` | 读取/切换 cwd | 需要 Agent；不改权限 |
| `ssh`（组） | POSIX 远程提供方家族 | 远端路径不能推断本地路径 |
| `ssh/sandbox-ssh` | 远端文件效果隔离 | 信任 SSH 主机/helper；partial 仍 partial |
| `ssh/ssh-helper-runtime` | 无 Node 的 helper 归档 | 仅 Linux/macOS；非通用 Node |
| `ssh/subprocess-ssh` | 远端进程/终端 | SSH 不隔离 payload；连接丢失未确认 |
| `subagent/subagent-fork-in-process` | 继承父级已完成轮次 | 一次性快照；路由选择被禁用 |
| `subprocess/subprocess-local` | 本机进程/PTY | fallback 观测性弱；清理是名称启发式 |
| `telemetry`（组） | 共享上报传输 | 业务方拥有同意/脱敏 |
| `telemetry/otel` | 独立 OTLP 通道 | 仅 best-effort 内存投递 |
| `test-support`（组） | 无密钥真实产品测试 | 支持层；获产品契约即移出 |
| `test-support/loader-smoke` | 真实 bin 冒烟 | 构建模式需先构建；超时只杀直接子进程 |
| `typert`（组） | 类型化 Host→Client 调用 | 生成物与注册表分离 |
| `util/plugin-market-index` | 索引格式校验 | 不验证声明真实性；无大小上限 |
| `util/workspace-path` | 浏览器安全路径/地址 | 仅词法；不做 Windows home 推断 |
| `web/web-deepseek-api` | Search/Fetch API 提供方 | 无自动重试/回退；凭据必须可解析 |

## 附录 B：证据限制与未决项

1. **长行截断**：英文正文中有 103 行超过 760 字符。机制结论只依赖已显示或已 `:raw` 读取的内容；未回源核对的长行，其尾部文字不作逐字断言。中文读取器的截断上限按**显示宽度**计算，CJK 字符占两列，因此极长的表格/HTML 单行即使在数字区间内也可能被 reader 截短；这些行只影响样式细节，不承载机制义务，引用原文时应回源读取整行。
2. **中文对照的检查粒度**：53 个 `README.zh.md` 均已按 `:raw` 区间从头读到 EOF，覆盖记录为完整 `1–EOF`；正文、限制与开发备注逐段与英文对照，未发现改变机制义务的语义分歧，少数独立细节（如 schedule 的归档准入、pnpm 构建脚本授权、CUA 应用授权）已并入对应机制。极长单行的 reader 截断见上一条；本参考仍不做逐句法律级等价审计，机制断言以英文正文与源码为准。机械检查确认中英文标题数与 `{#anchor}` 集合一致（53/53）；53 个侧车共享同一段 4 行生成器头，共 845 条被跟踪标题段记录，每条都有 `en`/`zh` 两个 16 位哈希。
3. **侧车是生成的，但已完整核对**：`README.i18n.yaml` 是逐标题哈希记录，不是独立叙述；本参考将全部 53 个侧车记为 `generated`，逐文件核对 1–EOF 的键/16 位哈希结构与头部再生成命令，不把它当作内容证据。
4. **README 声明 ≠ 已执行**：本参考中的失败关闭、契约测试、发布验证均来自 README 的源声明；本次提取没有运行构建、测试、签名、OTel 导出或网络操作。所有 `verification.*` 均为 `planned`。
5. **跨域依赖**：`packages/client/AGENTS.md`（依赖声明、slot/props、导出纪律）、`packages/experimental/AGENTS.md`（实验依赖隔离）、`scripts/experimental-package-policy.ts`、`docs/capability-seams.md`、`docs/config-catalog.md`、`docs/tool-catalog.md` 被本域 README 引用；它们属于其他域/生成物，本参考只在被引用处概述，不声称逐行审阅。
6. **两个桌面路径已被 release 域收录**：`apps/desktop/windows-signing/README.md` 与 `apps/desktop/tests/installed-update/README.md` 在 `research/release-coverage.json` 中已按 `governance` 收录；本域记录采用兼容的 `governance` 分类，并用本域机制（失败关闭、构建产物、凭据保管）重新引用，不与之冲突。
7. **未展开的包**：`packages/util/plugin-market-index` 与 `apps/plugin-market-generator` 的格式细节以 Agent Note 为权威；本参考只记录校验器/生成器契约与未验证声明。

## 附录 C：采用者最小落地清单

1. 选 3–5 个机制先落地：README 契约、能力 seam、失败关闭、格式版本、配置契约。它们覆盖大多数后续争议。
2. 为每个 seam 写定义包 + 契约测试 + 一个内存提供方；没有契约测试的 seam 不算完成。
3. 为每个持久化格式建 v1 fixture 与"变更必须带夹具"的评审规则。
4. 为每个安全关键路径写失败矩阵与联锁；不要用"重试一次"替代。
5. 把模型可见面、凭据接触点、信任假设列成表，逐项在 README 限制段落位。
6. 实验能力默认关闭并隔离依赖；晋升用五项证据清单。
7. 发布产物用 manifest + checksum + 独立验证器；发布默认关闭。
8. 只读投影与写路径分服务；地址必须带授权主体。
9. 每个返回面设 cap，并区分拒绝/截断/omission。
10. 最后再加自动检查器；先把契约与证据跑通，避免检查器制造虚假安全感。
