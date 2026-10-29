# enforcement-scripts-1：脚本化门禁与验证器的迁移参考

本文件是 `enforcement-scripts-1` 域的自包含操作参考。来源固定为 `deepseek-harness/` 的提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e`。

## Scope

本域覆盖 `research/residual-reading-assignments.json` 中 `enforcement-scripts-1` 分区的全部 52 个路径：`scripts/` 下的构建、打包、发布、验证器测试、覆盖率与快照夹具，以及 `scripts/dependency-catalog/` 下的生成记录。

阅读方式：逐文件读取正文；`scripts/dependency-catalog/package-lock.json` 有 8539 行，只读取了表头与首批解析条目（1-40），coverage 中如实标注为抽样。其余文件读取到实际最后一行；6 个 Python SDK 快照中共 19 条达到 385 codepoints 的候选行已核对，其中 12 条超过 768 显示宽度的行逐行 `:raw` 重读，其余 7 条也 raw 复核；具体行号记录在 coverage notes。未运行构建、lint、formatter 或测试。

分域结果：

- 38 个路径为 `governance`：其中 30 个实现或断言已在其他域登记的机制，只记录复用关系（`reviewedNoMechanism: true`）；8 个路径支撑 7 个本域新机制（Office 运行时闭包由 `libreoffice-engine.spec.ts` 与 `libreoffice-packages.mjs` 共同支撑，`verify-packed-install.spec.ts` 同时复用 supply-chain 机制）。
- 9 个路径为 `generated`：依赖目录记录与 Python SDK 单文件可执行程序的 committed expected fixtures。
- 5 个路径为 `non-governance`：覆盖率/预算/快照夹具，以及 volatile config 的产品行为测试。

本域新增机制的 id 均以 `enforcement-scripts-1` 开头。复用机制包括 `supply-chain-licenses-notices`、`supply-chain-default-product-isolation`、`supply-chain-esm-payload`、`supply-chain-packed-install`、`supply-chain-runtime-closure`、`supply-chain-dependency-catalog`、`release-python-executable-builder`、`release-desktop-version-artifacts`、`release-other-delivery`、`release-persistence-schema-policy`、`persistence-release-history.*`、`automation-build-artifact-record`、`automation-coverage-partitioning`、`automation-ci-workflow-contract-tests`、`automation-gate-scheduler`、`engineering-compiler-faces`、`engineering-application-launch`、`engineering-no-unknown-assertions`、`engineering-experimental-isolation`、`documentation-generated-reference-freshness`、`documentation-repository-reference-policy`、`documentation-subsystem-page-ownership`、`documentation-i18n-pair-contract`、`documentation-markdown-links`、`rationale-process-2/clean-safety-guards`、`rationale-architecture-4-localization-rollout`、`package-contracts-2.session-plugin-records`、`testing-benchmark-workload-hygiene`、`testing-resource-isolation`、`testing-coverage-fork-diagnostics`、`testing-deterministic-synchronization`。

迁移时必须同时迁移被引用的 owner 域，或显式记录未迁移依赖；本文件不复制它们的完整规则。

<a id="m-enforcement-scripts-1-request-input-durable-boundary"></a>

<a id="enforcement-scripts-1-request-input-durable-boundary"></a>

### enforcement-scripts-1-request-input-durable-boundary — 请求态输入与持久消息的编译期边界

**问题**：provider 请求可以混合 durable `Message` 与轻量 `RequestUserInput`。如果持久写入、followup/inject、title 事件或投影函数接受后者，历史里就会出现没有 `source`/`id` 的记录，或者投影伪造身份与归属。运行时这种错误通常只是少一个字段，普通断言很难发现。

**触发**：修改 `RequestMessage`、`RequestUserInput`、`GenerateOptions`；新增接受消息列表的 API/事件；把请求输入写入 Session；改消息投影函数。

**义务**：

- 只有 `user` 角色存在 request-only 替代；`assistant`、`system`、`developer`、`tool` 必须保留 durable 身份与来源。
- `RequestUserInput` 不得携带 `id` 或 `source`；exact optional 语义下显式 `undefined` 也必须被拒绝。
- 仅给请求态输入补 `id`/`source` 不能把它变成 durable 消息；`session.append('user/message')`、`agent.followup`、`agent.inject` 与 title 事件只接受 durable 消息。
- 投影函数保留请求态输入性质，不得制造 identity/attribution；窄字面量内容类型不得假定投影会保留。
- 编译探针使用真实 `tsconfig.host.json`；每个拒绝边由 `@ts-expect-error` 覆盖，探针零诊断才算通过。

**执行步骤**：

1. 把 provider 请求面拆成 durable `Message` 与 `RequestUserInput` 两个类型。
2. 在所有持久写入与事件签名处要求 `Message`，而不是宽化的联合。
3. 让 `RequestUserInput` 的 `id`/`source` 在类型上缺失，并禁止显式 `undefined`。
4. 为每个拒绝边写 `@ts-expect-error` 编译探针，并断言探针没有意外诊断。
5. 把探针放进 unit/coverage 门禁。

**强制与信任**：`mode: compile-time contract probe`。`scripts/request-input-types.spec.ts` 在内存中创建 `ts.Program`，seed 真实 host 配置并编译正向与负向探针。它只证明列出的类型边界；运行时 JSON、跨进程 wire 与 provider 实际投影仍需另行测试。持久写入开始接受请求态输入、`@ts-expect-error` 失效或探针出现额外诊断时，spec 失败并阻断 unit/coverage 门。

**例外**：类型层面的 `unknown` 声明仍合法；本机制只约束直接断言和持久消息位置。

**完成信号与失败处置**：正向探针零诊断；删除任一保护后必须出现预期诊断。误放宽签名时恢复 `Message` 参数类型并重跑 spec。

**证据**：

<a id="m-enforcement-scripts-1-request-input-1"></a>
- `deepseek-harness/scripts/request-input-types.spec.ts:1-112@687f282e`：完整探针，包含混合请求、`@ts-expect-error` 负向边界、真实 `tsconfig.host.json` seed 与零诊断断言。

**限制**：只覆盖编译期；未证明运行时反序列化、wire 协议与所有投影函数。目标项目若没有 TypeScript，需要用等价的 schema/构造器约束重新落地。

<a id="m-enforcement-scripts-1-generated-workflow-guest"></a>

<a id="enforcement-scripts-1-generated-workflow-guest"></a>

### enforcement-scripts-1-generated-workflow-guest — 生成的 Workflow guest 必须自包含且 --check 不写回

**问题**：PTC workflow guest 在受限运行时加载，不能依赖生成时存在的源文件或外部依赖。若生成器允许未解析导入，产物在运行期才失败；若 `--check` 会写回，陈旧产物被静默修复，评审看不到真实 diff。

**触发**：修改 workflow guest 源或打包逻辑；新增 guest 依赖或相对导入；运行 `verify-workflow-guest`；审查生成源能否独立加载。

**义务**：

- bundle 必须把相对源码导入内联，使删除源文件后模块仍可加载；输出不得包含绝对 repository root。
- 无法解析的导入必须让生成失败，而不是生成依赖缺失的产物。
- `--check` 只比较已提交产物与当前源，不重写文件；stale 时失败并保留原文件。
- 生成产物由生成器拥有；手工编辑会在下一次 check 中暴露为 stale。
- 正向测试要在删除源文件后把 `bundleWorkflowGuest` 返回的字符串以 data URL 导入，证明的是 bundle 自包含；它没有执行生成的 guest-source.ts 模块。

**执行步骤**：

1. 用真实 bundler 配置打包 guest 入口。
2. 断言输出不含 repository root，并在删除源码后 import 成功。
3. 加入无法解析依赖的负向用例。
4. 生成一次产物；修改源；以 check 模式运行并断言失败且字节不变。
5. 把生成器接入 `verify-workflow-guest` 或等价门禁。

**强制与信任**：`mode: generator + freshness check + negative import test`。`bundleWorkflowGuest`/`generateWorkflowGuest` 负责生成与比较；spec 覆盖内联、未解析导入与 check 不写回。自包含用例把 `bundleWorkflowGuest` 的返回字符串以 data URL 导入，并未加载生成的 guest-source.ts 模块。自包含与 stale 检测是机械的；生成器是否覆盖全部运行时版本、产物语义是否正确仍靠评审与下游执行。单 chunk 与非内建 external 的拒绝只有生成器断言，spec 没有构造多 chunk 或非内建 external 负例。

**例外**：内置 `node:` 模块可以保留为外部导入；测试只验证声明范围内的导入图。

**完成信号与失败处置**：删除源码后模块仍可加载；未解析依赖与 stale 必须让 check 失败。产物过期时重新生成、审查 diff，再以 check 模式确认。

**证据**：

<a id="m-enforcement-scripts-1-generated-guest-1"></a>
- `deepseek-harness/scripts/gen-workflow-guest.ts:1-72@687f282e`：生成器实现，覆盖固定入口、只外置 Node 内建、拒绝未解析导入、单 chunk 断言、sourceURL、横幅与 `--check` 精确比较。 <a id="m-enforcement-scripts-1-generated-guest-2"></a>
- `deepseek-harness/scripts/gen-workflow-guest.spec.ts:1-43@687f282e`：三个测试分别覆盖自包含打包（导入 bundle 字符串的 data URL，不是 guest-source.ts）、未解析导入拒绝、以及 stale check 不重写文件。

**限制**：spec 只覆盖 `bundleWorkflowGuest` 与 `generateWorkflowGuest`；自包含用例导入 data URL 中的 bundle 字符串，没有执行生成的 guest-source.ts，也没有证明 PTC 运行时加载。多 chunk 与非内建 external 拒绝未构造负例；未证明所有 workflow 运行时版本、loader 查询或 sourcemap 组合。

<a id="m-enforcement-scripts-1-office-runtime-closure"></a>

<a id="enforcement-scripts-1-office-runtime-closure"></a>

### enforcement-scripts-1-office-runtime-closure — 独立 CLI 的 Office 运行时闭包与引擎选择

**问题**：独立 CLI 进程不能依赖 workspace 的 `node_modules` 布局。只复制顶层 Office kit 会漏掉传递依赖或平台引擎，问题到用户机器才暴露；可选依赖若不按目标 os/cpu 过滤，会把不兼容的原生包带进发布物。

**触发**：为 standalone executable 准备 Office 资源；新增 LibreOffice kit 依赖或平台；发布物在目标机器缺库；审查 `officePackageDirectories` 输出。

**义务**：

- 引擎选择：installed kit manifest 的 `optionalDependencies` 声明 `@deepseek-ai/libreoffice-kit-<platform>-<arch>` 时使用 native，否则使用 wasm；Linux 声明 native target 时无需改变策略。
- 从 `staging/node_modules/@deepseek-ai/libreoffice-kit` 开始，沿 `dependencies`、`optionalDependencies`、`peerDependencies` 递归收集闭包；遍历时跳过所有 `@deepseek-ai/libreoffice-kit-*` 边，最后只把选中的 engine 目录加入闭包，其他平台 kit 包不参与遍历。
- 任何解析结果逃出 staging 立即失败，不能把宿主路径带进发布物。
- 必需依赖缺失必须失败；optional 依赖只有在目标 os/cpu 受支持时才纳入。
- 选中的 engine 包必须存在；结果按绝对路径排序，保证输出稳定。
- 闭包函数只负责定位，不执行 LibreOffice；执行验证属于渲染/导出测试。

**执行步骤**：

1. 读取 installed kit manifest 并选择 engine。
2. 从 kit 入口遍历依赖图，按目标平台过滤 optional/peer。
3. 拒绝逃出 staging 的路径与缺失的必需依赖。
4. 确认 engine 目录存在并排序返回。
5. 把返回目录复制进 executable 资源目录，并用真实入口 smoke。

**强制与信任**：`mode: closure walker + platform matrix test`。`officePackageDirectories`/`selectOfficeEngine` 负责闭包与选择；`libreoffice-engine.spec.ts` 只覆盖 `selectOfficeEngine` 的 darwin/win32/linux/freebsd 与声明 native 的 Linux 情形。引擎选择是机械矩阵测试；闭包完整性、staging 边界、必需/optional 过滤只有实现阅读证据，没有 spec 执行，也不证明真实安装布局。LibreOffice 实际可执行性、字体与渲染结果不由该函数证明。

**例外**：未声明的平台回退 wasm；optional peer 仅按 manifest 的 os/cpu 元数据过滤。

**完成信号与失败处置**：目标平台选出正确 engine 且闭包完整；缺依赖或路径逃逸时函数抛错。发布物缺库时用同一闭包函数重算目录，补齐依赖或修正 optional 元数据后重新打包。

**证据**：

<a id="m-enforcement-scripts-1-office-1"></a>
- `deepseek-harness/scripts/libreoffice-engine.spec.ts:1-24@687f282e`：引擎选择矩阵，覆盖 darwin-arm64、darwin-x64、win32-arm64、win32-x64、Linux 回退与声明 native 的 Linux target。 <a id="m-enforcement-scripts-1-office-2"></a>
- `deepseek-harness/scripts/libreoffice-packages.mjs:1-80@687f282e`：`selectOfficeEngine` 与 `officePackageDirectories` 的完整实现，包括 staging 边界、必需/可选依赖分类、os/cpu 过滤与 engine 存在性检查。

**限制**：只验证 `selectOfficeEngine` 的引擎选择；`officePackageDirectories` 没有 spec 执行，闭包、路径边界与 optional 过滤只是实现阅读证据。不证明 LibreOffice 在目标机器可启动、渲染正确或 PDF 导出成功。未覆盖所有 npm 安装布局。

<a id="m-enforcement-scripts-1-packed-install-cache-ownership"></a>

<a id="enforcement-scripts-1-packed-install-cache-ownership"></a>

### enforcement-scripts-1-packed-install-cache-ownership — packed-install 验证器独占 npm 缓存写入并清理消费者

**问题**：packed-install 验证器会在仓库外创建临时消费者并运行 `npm install` 与 lifecycle。若它继承 ambient 或 npmrc 配置的 cache，会污染宿主缓存、把外部状态带进验证结果；失败路径还可能留下消费者目录与私有缓存。

**触发**：修改 `release/verify-packed-install.ts` 的 npm 调用或环境；新增 packed-install 失败路径；在共享 runner 排查 npm 缓存污染；审查发布预演的资源清理。

**义务**：

- 验证器必须让 npm 把 tarball 内容写入 consumer-private 的 `.npm-cache/_cacache`。
- 继承的 `npm_config_cache` 与 npmrc 指定的 cache 必须保持不变；两者中的 sentinel 文件在运行后仍存在且内容不变。
- success、install failure、entry failure 三种结果都必须在 finally 删除临时消费者；verifier 无条件 `rmSync` 整个 consumer 树，consumer-private cache 因位于其中一并删除。
- 测试 harness 在启动 verifier 前过滤继承的 `npm_config_*`，显式设置 `npm_config_offline=true`、`npm_config_ignore_scripts=false`、`npm_config_userconfig` 与 `TMPDIR`/`TMP`/`TEMP`；这是测试 setup，不是 verifier 行为。
- verifier 自身只向 npm 传 `--cache <consumer>/.npm-cache` 与 `--omit=optional` 等参数，并在 `consumerEnvironment` 中删除 `npm_config_user_agent`、`NODE_OPTIONS`、`NODE_PATH`，设置 consumer 内的 `DSH_HOME`/`DSH_AGENTS_HOME` 与 telemetry off。
- 成功路径退出 0；install 或 entry 失败路径退出 1，且清理仍然发生。

**执行步骤**：

1. 用 `tar` 构造真实 tarball 与带 `postinstall` 的包。
2. 记录 ambient/configured cache 的 sentinel。
3. 在隔离环境中调用真实 verifier 入口，并在 lifecycle 中记录 consumer 与 cache 内容。
4. 分别跑 success、install failure、entry failure。
5. 断言退出码、cache 写入位置、sentinel 未变、consumer 与私有 cache 已删除。

**强制与信任**：`mode: real-entry subprocess test with filesystem oracle`。spec 通过 `spawnSync` 调用真实 verifier；`probe.cjs` 在 `postinstall` 记录 consumer 与 cache 文件。它真实调用 verifier 并观察文件系统，但 offline 由测试环境注入 `npm_config_offline`，不是 verifier 或测试独立证明的离线保证。只覆盖 POSIX 与 `tar` 可用环境，不证明 registry 行为或 Windows npm shim。

**例外**：Windows 上跳过，因为 verifier 直接调用 POSIX npm 而非 `npm.cmd` shim。

**完成信号与失败处置**：三种结果都删除 consumer 与私有 cache，ambient/configured sentinel 不变。共享 runner 出现污染时分别检查 test harness 的 `npm_config_*` 清理和 verifier 的 `--cache`/finally 删除路径，再重跑。

**证据**：

<a id="m-enforcement-scripts-1-cache-1"></a>
- `deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e`：验证器实现，使用 `mkdtemp` consumer、`--cache <consumer>/.npm-cache`、`--omit=optional`、consumer 环境清理与 finally `rmSync`。 <a id="m-enforcement-scripts-1-cache-2"></a>
- `deepseek-harness/scripts/release/verify-packed-install.spec.ts:1-82@687f282e`：真实 verifier 入口、三种结果、cache 观测 probe、ambient/configured sentinel 与 consumer 清理断言；测试 harness 另行提供 offline/ignore-scripts/TMPDIR 等环境。

**限制**：spec 在 Windows 跳过；使用 `tar` 构造输入；offline 仅来自测试 harness 的 `npm_config_offline`；未覆盖 registry 网络、pnpm、workspace link 或 npm 版本差异。

<a id="m-enforcement-scripts-1-translation-link-locale"></a>

<a id="enforcement-scripts-1-translation-link-locale"></a>

### enforcement-scripts-1-translation-link-locale — 译文正文链接的目标语言选择与切换行豁免

**问题**：中文页面若把正文链接指向英文 sibling，读者会在无提示的情况下离开目标语言；普通 Markdown 链接检查只验证目标存在，不验证 locale。语言切换行本身必须指向另一语言，因此需要精确豁免，否则要么误报切换行，要么放过正文中的错误链接。

**触发**：编辑 `.zh.md` 或英文源中的正文链接；新增或重命名双语配对页面；翻译 PR 的链接检查失败；修改 `translation-links` 归一化逻辑。

**义务**：

- 中文源（`.zh.md`）的文档链接必须指向对应的 `.zh.md` sibling；英文源必须指向英文 sibling。
- 只有语言切换行的 counterpart 链接豁免，且形态精确：H1 后、下一个 heading 前的首个整段匹配段落，文本须为 `English | [中文](...)` 或 `[English](...) | 中文`，段落内恰好一个链接且目标被接受；其他切换器形态不豁免。
- 只重写链接 destination，保留 query、fragment、title 与 label 的原字节。
- percent-encoded 文件名先解码再精确匹配；重编码到 RFC 3986 unreserved 字符只发生在 `relativeExpectedPath`，直接 `.md`/`.zh.md` 后缀替换保留 authored path 字节。
- 不把目录目标推断为 index 页面；只访问 mdast 的 link/definition 节点，代码围栏文本因此不会成为链接（解析器行为，不是单独断言）；图片 definition 与 GFM autolink 不处理。
- 重复 reference definition 只使用第一个。
- 目标存在性使用所选 content plane 的查询函数；pair activity 由 `isTranslationPairSource` 谓词决定，活动语料中缺 sibling 的目标仍报告违规（期望 sibling），非活动/不可解析目标保持原样。
- normalize 只折叠已配对页面的 locale 路径，保留 query 的原始转义字节。

**执行步骤**：

1. 解析 Markdown AST，识别 link 与 reference definition。
2. 按源文件 locale 选择期望的 sibling 文件名。
3. 对 destination 拆分 path/query/fragment，只改 path。
4. 豁免切换行的精确位置或链接形态。
5. 报告违规时给出源文件、行号、原 URL 与期望 URL。
6. normalize 仅生成用于比较的规范形式，不回写 authored 正文。

**强制与信任**：`mode: pure validation/rewrite functions exercised by spec`。`translationLinkLocaleViolations`、`rewriteTranslationLinkLocales`、`normalizeTranslationMarkdownLinks` 是纯函数；spec 覆盖中英文、编码、definition、图片、autolink、目录与 content plane。切换器识别要求精确文本形态、H1 后且下一个 heading 前、恰好一个链接和目标可接受；代码围栏排除依赖 mdast 访问，不是单独断言。locale 选择与字节保留是确定性的；re-encoding 仅适用于 `relativeExpectedPath`，直接后缀替换保留 authored 字节。翻译语义与网站最终路由仍需评审/站点测试。

**例外**：切换行豁免；非文档链接（图片、autolink）不处理；目录目标不改写。

**完成信号与失败处置**：正文链接指向正确 sibling 且 normalize 字节稳定；错误 locale 返回含 `sourcePath`/`line`/`url`/`expectedUrl` 的违规。页面重命名后用 `rewriteTranslationLinkLocales` 只改 destination，再跑配对与链接门禁。

**证据**：

<a id="m-enforcement-scripts-1-translation-1"></a>
- `deepseek-harness/scripts/translation-links.ts:1-384@687f282e`：真实链接解析、同语言期望路径、RFC 3986 重编码、字节级 destination 替换与 merge token 归一化实现。 <a id="m-enforcement-scripts-1-translation-2"></a>
- `deepseek-harness/scripts/translation-links.spec.ts:1-281@687f282e`：完整 spec，覆盖错误 locale、编码文件名、query/fragment/title 保留、definition、图片、autolink、目录、切换行精确豁免、活动语料缺 sibling 仍报违规与 content plane。

**限制**：spec 使用临时 fixture，不覆盖网站投影后的最终 URL；percent-encoding 只覆盖列出的 RFC 3986 边界；切换器豁免是 source-product 的精确文本形态；代码围栏排除来自 mdast，未单独断言；不判断译文内容是否正确。

<a id="m-enforcement-scripts-1-snapshot-workspace-placement"></a>

<a id="enforcement-scripts-1-snapshot-workspace-placement"></a>

### enforcement-scripts-1-snapshot-workspace-placement — 快照工作区必须位于自动临时写授权之外

**问题**：如果快照 workspace 落在 `/tmp` 等自动临时写授权内，workspace-write 沙箱测试会在没有真实 workspace grant 的情况下通过，产生假绿；平台 tmp 还可能是 symlink、系统目录或不可写父目录。

**触发**：新增需要真实 sandbox workspace grant 的快照场景；调整临时目录或 home 回退策略；在 macOS/Windows 排查快照 workspace 权限；审查 `assertWorkspaceOutsideTemp` 调用点。

**义务**：

- 默认选择 tmpdir 的父目录作为 sibling parent，让 workspace 与系统临时写授权分离。
- 当 tmp 就是系统 `/tmp`、父目录是文件系统根、或父目录落在系统临时目录内时，回退到 home。
- 父目录不可写（`EACCES`/`EPERM`/`EROFS`）时回退 home；其他 access 错误必须继续抛出。
- 调用者负责原子分配 workspace 并拥有清理；本函数只选父目录。
- `assertWorkspaceOutsideTemp` 必须先 canonicalize（解析 symlink），再对 workspace-write 模式的 `writableRoots` 做包含检查；`writableRoots({mode:'workspace-write', workspaceRoot:'/tmp'})` 的 `workspaceRoot` 是硬编码的合成值，实际覆盖根来自该函数固定加入的 `/tmp` 与 platform tmpdir，不是调用者的项目根。
- 命中自动临时写授权时抛出明确错误，而不是跳过或改用更宽松的 sandbox 模式。

**执行步骤**：

1. 用 `outsideTempWorkspaceParent` 选择父目录。
2. 用 `mkdtemp` 原子分配 workspace，并注册清理。
3. 在启动被测进程前调用 `assertWorkspaceOutsideTemp`。
4. 若回退 home，确认 home 不在 sandbox 自动授予的临时写根内。
5. 在目标平台验证 symlink 与不可写父目录分支。

**强制与信任**：`mode: placement helper + fail-closed assertion`。`outsideTempWorkspaceParent` 与 `assertWorkspaceOutsideTemp` 使用 sandbox 包的 `writableRoots`。只对 `writableRoots` 实际返回的临时根是机械的；`workspaceRoot:'/tmp'` 是合成值，检查不能证明调用者真实项目根的隔离。没有 cited test 执行这些分支；其他 sandbox 模式、平台策略或未来新增写根不由本函数覆盖。workspace 位于自动临时写根内时抛错；不可写父目录静默使用会让分配失败或权限测试失真。

**例外**：home 回退是允许的，但必须仍通过 `assertWorkspaceOutsideTemp`。

**完成信号与失败处置**：workspace 位于 tmp sibling 或 home 且不在自动临时写根内；命中临时写根时抛出 `must be outside temporary writable root`。平台 tmp 是系统目录导致回退时，确认 home 可写且不在 `writableRoots` 内再重跑。

**证据**：

<a id="m-enforcement-scripts-1-snapshot-workspace-1"></a>
- `deepseek-harness/scripts/snapshot-workspace-parent.ts:1-46@687f282e`：父目录选择、系统临时目录/根/不可写回退、canonicalize 后的 writableRoots 包含检查与 fail-closed 错误。

**限制**：这是测试资源放置，不证明 snapshot replay 语义。只检查 workspace-write 模式与 `writableRoots` 返回的 `/tmp`、platform tmpdir；`workspaceRoot` 传的是合成 `/tmp`，不是调用者真实项目根。其他 sandbox 模式、容器内路径映射与未来新增写根未覆盖；无测试执行。

<a id="m-enforcement-scripts-1-local-bundle-registry"></a>

<a id="enforcement-scripts-1-local-bundle-registry"></a>

### enforcement-scripts-1-local-bundle-registry — 本地 bundle registry：catalog 根打印、当前构建检查、唯一运行目录与完成标记

**问题**：官方按需 bundle 在发布到 npm 前需要被 packaged test app 安装。如果本地 registry 服务旧构建、任意包或半打包目录，测试会验证错误字节；如果运行目录可被后续运行覆盖，失败现场也无法复现。

**触发**：在发布前用 packaged test app 安装官方 on-demand bundle；新增或修改 bundle catalog 成员；调试本地 registry 的 manifest 或安装列表；审查 prepare 阶段的信号与清理行为。

**义务**：

- bundle catalog 是唯一打印为可安装 spec 的 root 列表；registry 实际服务本次选择闭包的全部 archive，workspace inventory 只用于区分本地包与外部依赖。
- 服务前必须运行 `build:official`；`verifyBuiltBundles` 只检查 catalog root 的 `main` 与 bundle patch 文件存在，不能证明这些字节来自本次构建或未被更早产物替代。
- pack 到 run-owned 的唯一目录 `<REGISTRY_OUTPUT_ROOT>/<timestamp>-<uuid>`；目录名不重用，但代码没有独占创建、只读权限或不可变文件系统保证。
- manifest 是完成标记：只有全部成员都成功 pack 的运行才写 manifest；registry 与 spec 都不读取或校验 manifest 来证明完成。
- 只有 catalog roots 作为可安装 spec 打印；闭包其余包由 installer 解析并留在 run manifest。
- registry监听成功才打印summary。准备阶段取消以130结束；服务阶段首个信号正常close、打印stopped并自然返回，不主动设非零退出码；第二次信号强制退出130，不保证完成清理。
- 该工具不启动 agent、不需要凭据；packing/manifest/validation 仍由既有 release owner 负责。

**执行步骤**：

1. 从 catalog 生成 root 列表并读取 workspace/release 成员。
2. 构建并验证当前 official bundle 产物。
3. 在唯一运行目录中 pack 闭包成员。
4. 写入 registry manifest 作为完成标记。
5. 启动 loopback registry，打印 source/artifact/registry/roots。
6. 收到信号时关闭 registry 与子进程，保留磁盘产物供复查。

**强制与信任**：`mode: build/test utility CLI with completion markers`。`dev-bundle-registry.ts` 组合 `generateOfficialBundleCatalog`、`verifyBuiltBundles`、`packBundleArtifacts`、`writeRegistryManifest`、`startBundleRegistry`；`local-bundle-registry.ts` 实现闭包选择、archive 读取/校验、HTTP 与 manifest 写入，`local-bundle-registry.spec.ts` 覆盖这些 helper。闭包选择、必需/可选边、foreign-target 拒绝、archive 内容校验、manifest 结构与 HTTP 响应由 spec 机械验证；CLI 编排（build 顺序、信号清理、摘要打印）、端口冲突与并发运行没有 spec。`verifyBuiltBundles` 只查文件存在，不查构建新鲜度。

**例外**：工具只服务本地 loopback，不替代 npm registry 或发布验证；summary 中的 roots 不是完整依赖闭包。

**完成信号与失败处置**：manifest已生成、registry已监听且summary打印catalog roots，才证明本工具准备就绪；产品安装运行仍另证。缺构建输出、pack失败或错误root按相应检查失败；`verifyBuiltBundles`不检测旧输出新鲜度。服务阶段首个Ctrl+C正常关闭并自然返回，manifest/产物保留；准备阶段取消才设置130；第二次信号直接强退130，不宣称清理到静止。三种阶段分别验证，不能用一个退出码概括。

**证据**：

<a id="m-enforcement-scripts-1-registry-1"></a>
- `deepseek-harness/scripts/local-bundle-registry.ts:1-183,225-355,400-500,745-770@687f282e`：闭包选择、archive 校验、manifest 写入与 HTTP 服务实现；目录只是唯一命名，不是独占创建。 <a id="m-enforcement-scripts-1-registry-2"></a>
- `deepseek-harness/scripts/local-bundle-registry.spec.ts:1-123,300-559@687f282e`：覆盖真实 catalog 闭包、必需/可选/peer 边、foreign-target、archive main/patch、manifest 结构、HTTP 响应、同版本重建与缓存失效需要清理 stale resolution。 <a id="m-enforcement-scripts-1-registry-3"></a>
- `deepseek-harness/scripts/dev-bundle-registry.ts:1-170@687f282e`：CLI 编排，包括 catalog-only printed roots、`build:official`/`verifyBuiltBundles`、唯一运行目录、manifest 完成标记、summary 与信号清理；其自身没有专用 spec。

**限制**：`local-bundle-registry.spec.ts` 覆盖 helper，`dev-bundle-registry.ts` 的 CLI 编排、信号处理、端口冲突与并发运行没有专用 spec。构建/安装成功仍依赖外部 pnpm 与 packaged app；registry 本身不验证产品行为。这是 known-source-limitation，不作为已执行的自动保证。

## References

- 源仓库：`deepseek-harness/`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。
- 覆盖账本：`research/enforcement-scripts-1-coverage.json`（52 个分配路径的 inspected 记录、本域机制引用的跨分区源文件、实际读取范围与 disposition）。
- 域知识：`knowledge/enforcement-scripts-1.json`（7 个新机制；复用机制列在上方 Scope）。
- 抽取契约：`research/BRIEF.md`；编排与分域：`research/residual-reading-assignments.json`。
- 相关 owner 域参考：`references/automation.md`、`references/engineering.md`、`references/documentation.md`、`references/supply-chain.md`、`references/release.md`、`references/testing.md`、`references/rationale-process-2.md`、`references/rationale-architecture-4.md`。

本文件中的验证项均为 `planned`：内容来自固定提交的只读检查，未在目标仓库执行。不得把本参考的阅读或锚点存在当作自动门禁已通过的证据。
