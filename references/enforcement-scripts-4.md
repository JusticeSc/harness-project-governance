# enforcement-scripts-4

本文件覆盖固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 `deepseek-harness/scripts/` 残差读取分区 `enforcement-scripts-4`。该分区包含 62 个路径：Client bundle 共享预设的契约测试、三个 Client 静态门禁、Web 开发循环 supervisor、Python/SSH 原生制品检查，以及翻译、持久化、覆盖率、发布与快照 fixture 的实现或测试。引用格式为 `deepseek-harness/<path>:<line>@687f282e`；行号以该提交为准。

**证据限制。** 本文件基于只读源码检查。标为 `planned` 的验证项没有在目标仓库执行，不能当作已通过的门禁证据。分区内 9 个 `scripts/snapshots/python-sdk-single-exe/` 文件是已归一的生成期望输出；5 个非治理文件是测试 fixture 或其回归测试；它们不定义维护者义务。

## Scope

本域只拥有从这些脚本中提取、且未被其他域覆盖的规则。复用既有机制的记录在覆盖台账中标注 `reviewedNoMechanism: true`，其义务本体仍由对应域拥有。新增机制共 6 个：

- 客户端 bundle 共享预设：纯度、实验隔离、external、资源 watch 与 sourcemap。
- Client UI 文案只能由 locale owner 提供。
- 浏览器可到达的 app 路由必须相对文档解析。
- 代理 dispatcher 只能由 `http-proxy` 包构造。
- `dev:web` 单写者构建/服务/watch 循环与原子停机。
- 原生制品的架构与最低 OS/GLIBC 不得超过声明。

本文件不重复拥有发布流水线、持久化 schema、翻译配对、覆盖率分区或包契约的完整规则；那些规则分别由 `release`、`documentation`、`testing`、`supply-chain` 与 `package-contracts-*` 域负责。这里的证据只说明脚本如何实现或测试它们。

## Mechanisms

<a id="m-enforcement-scripts-4-client-bundle-preset"></a>
### enforcement-scripts-4-client-bundle-preset — 客户端 bundle 共享预设：纯度、隔离、外部化、资源 watch 与 sourcemap

**问题。** 所有 Client 包共用一套 tsdown 预设。若纯度门禁、实验输入隔离、external 基线与 CSS/图片 loader 只靠评审，Host 代码会漏进浏览器 chunk，实验包会经静态库、sourcemap、别名或 external 运行时导入混入普通产物，虚拟 CSS 模块会隐藏物理 watch 依赖，sourcemap 也会失去回仓库的路径。

**义务。**

- 配置名与 loader 注册名必须由包目录的具名 manifest 派生；缺 manifest 时失败。
- `dualClient` 是 opt-in：只有调用方传 `dualClient: true` 时才生成隔离的 Node ESM 与浏览器 factory 入口，`import()` 编译为模块加载器异步操作；普通包只生成浏览器入口。spec 只对三个 shared Client 传 `true` 并断言双端 chunk 名不相交，未断言普通包的双入口。
- 开发模式 watch 源码；Client 构建消费已发射的 JavaScript 与类型。
- 纯度门禁拒绝退役的 `web-react`、未批准的 `@deepseek-ai` 泄漏、跨插件值导入（裸名与 `/client` 子路径）；包专属请求只对声明它的 bundle 放行。
- 默认 external 基线（React、zod、TanStack、dsh-client-store）独立于包 manifest；`dsh.client.external` 必须是字符串数组，malformed 声明失败。
- 实验输入不得经静态库发射、sourcemap 归属、导入别名或 external 运行时导入进入普通产物；只有实验包自己可以包含它们。
- CSS/图片 loader 必须把物理文件注册为 watch 依赖：副作用 CSS 变成样式注入，`?inline` 变成无副作用的默认导出文本，图片变成 data URL，其他模块返回 null。实现的图片类型是 `.svg`/`.png`/`.webp`；本分区 spec 只执行 SVG 分支，PNG/WebP 未断言。
- sourcemap 必须为 Vite 模块图外的 TS/TSX 生成，并串联 tsc map；第一方源码映射回仓库包路径。

来源：deepseek-harness/packages/client/tsdown.client.ts:1-780@687f282e 来源：deepseek-harness/scripts/client-bundle-purity.spec.ts:1-565@687f282e 来源：deepseek-harness/scripts/client-bundle-css.spec.ts:1-124@687f282e

<a id="m-enforcement-scripts-4-bundle-config-name"></a>
- 证据：预设从包目录 manifest 派生配置名与 loader 名，缺具名 manifest 的目录被拒绝。`deepseek-harness/scripts/client-bundle-purity.spec.ts:53@687f282e` <a id="m-enforcement-scripts-4-bundle-externals"></a>
- 证据：默认 external 基线独立于包 manifest 生效，`dsh.client.external` 的请求与声明一致，malformed 声明直接失败。`deepseek-harness/scripts/client-bundle-purity.spec.ts:261@687f282e` <a id="m-enforcement-scripts-4-bundle-experimental"></a>
- 证据：实验输入即使被静态库发射隐藏，或只由编译器 sourcemap 保留归属、或被别名/ external 运行时导入掩盖，仍必须被拒绝。`deepseek-harness/scripts/client-bundle-purity.spec.ts:386@687f282e` <a id="m-enforcement-scripts-4-bundle-sourcemaps"></a>
- 证据：TS/TSX 产物带 sourcemap，生产构建串联 tsc map，第一方 sources 映射到仓库包路径。`deepseek-harness/scripts/client-bundle-purity.spec.ts:477@687f282e` <a id="m-enforcement-scripts-4-bundle-dual-client"></a>
- 证据：预设的 `dualClient` 默认 false，只有 `dualClient === true` 才同时发射 Node 与浏览器配置；普通包只发射浏览器入口。`deepseek-harness/packages/client/tsdown.client.ts:125-129@687f282e` <a id="m-enforcement-scripts-4-bundle-image-types"></a>
- 证据：图片 loader 注册 `.svg`/`.png`/`.webp` 三种类型；本分区 spec 只用 `preview.svg` 断言 data URL，PNG/WebP 分支未被本 spec 执行。`deepseek-harness/packages/client/tsdown.client.ts:39@687f282e` <a id="m-enforcement-scripts-4-bundle-css-watch"></a>
- 证据：CSS/图片 loader 把被读取的物理样式表注册为 watch 依赖，虚拟模块不能隐藏它。`deepseek-harness/scripts/client-bundle-css.spec.ts:31@687f282e` <a id="m-enforcement-scripts-4-bundle-css-inject"></a>
- 证据：副作用 CSS 编译为样式注入，`?inline` 编译为 watched text 且无模块副作用，图片内嵌为 data URL。`deepseek-harness/scripts/client-bundle-css.spec.ts:55@687f282e`

**执行与失败。** 共享预设在 `packages/client/tsdown.client.ts`；`scripts/client-bundle-purity.spec.ts` 与 `scripts/client-bundle-css.spec.ts` 直接调用其插件钩子，在单元/覆盖率库存中执行。未批准的 resolveId 边会抛错；external 声明形状错误直接失败；实验输入残留使 spec 失败；漏注册 watch 会让开发模式保留旧模块。spec 只覆盖 fixture 与插件钩子，不证明每个真实包的完整 chunk 图；普通包确有反向断言（无 `/client-node` 配置，浏览器入口为 `client.js`，spec:93-98），PNG/WebP 图片分支只有实现阅读证据。以上是测试存在，不是本轮执行证明。

**验证。** positive：具名双端包、资源 watch、sourcemap 路径全部通过。rejection：退役包、未批准值导入、实验输入、malformed external、无 watch 的虚拟 CSS。recovery：移除泄漏依赖或改用远程贡献后重跑。证据标记为 `planned`。

**限制。** spec 基于最小 fixture 与插件钩子，不覆盖真实应用的全部动态导入、运行时字符串拼接或第三方 prebuilt bundle；允许名单本身仍需评审。`dualClient` 是 opt-in，普通包的单入口有反向断言但不是本轮执行证据；图片 loader 的 spec 只断言 SVG，`.png`/`.webp` 分支只有实现阅读证据。

<a id="m-enforcement-scripts-4-client-ui-copy-ownership"></a>
### enforcement-scripts-4-client-ui-copy-ownership — Client UI 文案只能由 locale owner 提供

**问题。** 组件中直接写用户可见文案会绕过语言字典与切换；JSX 文本、`aria-*`/`label` 属性、默认值和返回值都很容易新增。只靠评审或过窄 glob 会得到假绿：门禁报告无违规，但大量 UI 未被扫描。

**义务。**

- Client UI 文案必须来自 locale 字典；`locale.ts`、`locales.ts`、`locales/` 等 owner 文件整体豁免。
- 发现范围覆盖 `packages/client/*/src/**/*.tsx`、`packages/client/ui-*/src/**/*.{ts,tsx}`、任何 `src/client` TSX 组件根、`apps/web/src`、desktop 的 main/update-coordinator 与 renderer JS，排除 `.d.ts`。
- 检查 JSX 文本、copy-bearing 属性、命中文案词表的属性/绑定默认值、文案函数返回值，以及 TSX 显式字符串返回。对象属性分支只在 `.tsx` 文件或 `apps/desktop/` 路径生效；其他 `.ts` 面中的对象字面量可能漏检。
- 调用结果、短标识符、键形字符串和不可变语言 token 不算自然语言文案。
- 文件数少于 450 时以“discovery narrowed”失败。450 是固定绝对下限，不是历史比例或 shrink 检测：合法删除文件使其降到 450 以下同样会失败；spec 没有执行该下限分支。
- 违规按 `file:line:column` + 原因输出并以退出码 1 阻断；修复是补齐 locale 字典，不是关闭门禁。

来源：deepseek-harness/scripts/verify-client-ui-i18n.ts:1-361@687f282e 来源：deepseek-harness/scripts/verify-client-ui-i18n.spec.ts:1-90@687f282e

<a id="m-enforcement-scripts-4-ui-minimum-corpus"></a>
- 证据：门禁定义 `MINIMUM_CLIENT_UI_SOURCES = 450`，作为发现面的固定绝对下限，不是历史比例或 shrink 检测。`deepseek-harness/scripts/verify-client-ui-i18n.ts:15@687f282e` <a id="m-enforcement-scripts-4-ui-locale-owner"></a>
- 证据：`findUiI18nViolations()` 对 locale owner 直接返回空，避免把字典本身当成硬编码。`deepseek-harness/scripts/verify-client-ui-i18n.ts:69@687f282e` <a id="m-enforcement-scripts-4-ui-discovery"></a>
- 证据：`sourceFiles()` 组合多个 Client 面与 desktop 文件；文件数不足时 main() 抛出 discovery narrowed。`deepseek-harness/scripts/verify-client-ui-i18n.ts:343@687f282e` <a id="m-enforcement-scripts-4-ui-report"></a>
- 证据：违规以 `file:line:column reason: text` 打印并设置退出码 1。`deepseek-harness/scripts/verify-client-ui-i18n.ts:349@687f282e` <a id="m-enforcement-scripts-4-ui-spec"></a>
- 证据：spec 覆盖 JSX/属性、label 数据、helper 返回、Electron/DOM 文案、locale owner 豁免与路径归一化；没有执行 450 文件下限、真实 `sourceFiles()` 或对象属性分支外的 `.ts` 面。`deepseek-harness/scripts/verify-client-ui-i18n.spec.ts:1-90@687f282e`

**执行与失败。** `pnpm run verify-client-ui-i18n` 与 `run-gates` 聚合执行。发现硬编码文案时退出 1；发现面低于 450 文件时抛错。spec 只证明给定源码片段上的规则判定；450 下限、真实 `sourceFiles()` 与 run-gates 聚合没有在本分区 spec 中执行，也不证明翻译质量、占位符一致性或运行时动态拼装字符串。

**验证。** positive：所有 Client 面从字典取文案且扫描数 >450。rejection：JSX/属性/返回值中的自然语言，或 glob 被改窄。recovery：把文案移入 zh/en 字典后重跑。证据标记为 `planned`。

**限制。** 静态词表无法覆盖所有命名习惯，可能漏掉不含 copy 词汇的返回值；对象属性分支只在 `.tsx` 或 `apps/desktop/` 生效，其他 `.ts` 面可能漏检。450 是固定绝对下限，不做历史 shrink 检测：合法删除文件可能误报，discovery 部分失效也可能仍高于 450。spec 未执行该下限或真实 `sourceFiles()`。

<a id="m-enforcement-scripts-4-client-route-resolution"></a>
### enforcement-scripts-4-client-route-resolution — 浏览器可到达的 app 路由必须相对文档解析

**问题。** 根绝对或协议绝对的 `/api`、`/plugins`、`/open-in-app` 会把请求绑定到单一 origin 与挂载点；反向代理、桌面壳、多挂载与 iframe 预览会断链。把相对 app 路由解析到 `location` 重建 base，或把带前导斜杠的 Host route key 直接交给请求，会重新引入同一问题。

**义务。**

- app-owned 路由作为请求目标时必须文档相对；不得使用根绝对、协议相对或带 origin 的字面量。
- `location` 规则只拒绝 `new URL(相对 app 路由, location 表达式)` 这一形态；`location.origin`、`location.hostname` 等身份/传输读取本身允许，若拼成绝对请求目标则由 request-target 的字面量规则捕获。
- 名称以 `PATH`/`ENDPOINT` 结尾的 Host route key 只在请求目标内检查；裸使用或导出 key 本身不报。规范修复是 `KEY.slice(1)`，但检测器把任意 `.slice` 属性访问当作已剥离，不校验实参或结果，因此 `fetch(API_PATH.slice(0))` 会被放行；该绕过是从规则静态推导，未执行。
- 静态引用生产者 `packages/client/modules/src/index.ts` 的 `url/src/href/initialUrl` 字段不得携带绝对 app 路由。
- 发现器筛选带DOM lib的Client配置，跳过无`src/`的聚合壳及Host聚合同编译且有`src/client`半面的配置；后者由独立`src/client` glob补充。仅其余eligible face零贡献会失败；固定producer缺失另行失败。部分缩水仍非空不拒绝，无历史清单防缩保证。
- 违规按 `file:line:column` + 规则 + hint 输出，退出码 1。

来源：deepseek-harness/scripts/verify-client-route-resolution.ts:1-339@687f282e 来源：deepseek-harness/scripts/verify-client-route-resolution.spec.ts:1-199@687f282e

<a id="m-enforcement-scripts-4-route-prefixes"></a>
- 证据：门禁只治理 `api`、`plugins`、`open-in-app` 三类 app-owned 前缀，`/assets/x` 等外来路径不在此列。`deepseek-harness/scripts/verify-client-route-resolution.ts:38@687f282e` <a id="m-enforcement-scripts-4-route-producers"></a>
- 证据：静态浏览器引用生产者固定为 `packages/client/modules/src/index.ts`，其引用字段被单独扫描。`deepseek-harness/scripts/verify-client-route-resolution.ts:60@687f282e` <a id="m-enforcement-scripts-4-route-faces"></a>
- 证据：`browserFaceSources()`的DOM-lib筛选后先有无`src/`与Host/Client半面跳过分支，仅剩余eligible face零贡献抛“discovery is broken”；独立glob补充Client半面。`deepseek-harness/scripts/verify-client-route-resolution.ts:275-305@687f282e` <a id="m-enforcement-scripts-4-route-slice"></a>
- 证据：`unstrippedHostRouteKeys()` 对 `PATH`/`ENDPOINT` 标识符检查父节点是否为 `.slice` 属性访问；是则直接放行，不检查 slice 的实参或结果。`deepseek-harness/scripts/verify-client-route-resolution.ts:106-116@687f282e` <a id="m-enforcement-scripts-4-route-report"></a>
- 证据：违规以 `file:line:column pattern — hint` 打印并设置退出码 1。`deepseek-harness/scripts/verify-client-route-resolution.ts:325@687f282e` <a id="m-enforcement-scripts-4-route-spec"></a>
- 证据：spec 覆盖四类拒绝、identity 读取放行、固定 producer 与 face 空贡献失败；`location` 只测 `new URL(relative, location)` 形态，未执行 `.slice(0)` 绕过。`deepseek-harness/scripts/verify-client-route-resolution.spec.ts:1-199@687f282e`

**执行与失败。** 源入口与`run-gates`接线已读；实际源CLI曾因缺TypeScript依赖在加载阶段失败，不是门禁通过。四类路由违规设置退出码1；eligible face零贡献或固定producer缺失抛错。无`src/`壳及Host/Client分流配置跳过该零贡献检查，后者另由glob补充；部分缩水仍非空可通过。历史数量/预期清单防缩是可选目标增强，不是源自动保证。

**验证。** positive：所有 face 与 producer 使用文档相对 app 路由。rejection：根绝对/协议绝对请求、`new URL(relative, location)`、请求目标内未剥离的 Host key、producer 绝对字段。recovery：改为相对路径并按 `KEY.slice(1)` 剥离前导斜杠后重跑。证据标记为 `planned`。

**限制。** 静态字面量/有限表达式不覆盖运行时拼接、配置注入、第三方内部路由；location规则仅`new URL(relative, location)`，host-key仅请求目标内的key，`.slice`参数/结果未核实（slice(0)绕过只是静态推导）。producer白名单需人工维护；零贡献断言只适用上述eligible face，不适用跳过的聚合壳/Host分流，fixture和非空发现结果不能证明真实发现面完整。

<a id="m-enforcement-scripts-4-proxy-dispatcher-ownership"></a>
### enforcement-scripts-4-proxy-dispatcher-ownership — 代理 dispatcher 只能由 `http-proxy` 包构造

**问题。** 任何包都能从 undici 构造 `Agent`/`ProxyAgent`/`EnvHttpProxyAgent`，或给 fetch 传显式 `dispatcher`。统一代理会被绕过；重命名导入、命名空间访问、动态 import 解构与 shorthand 属性让评审很难稳定发现。

**义务。**

- 只有 `packages/util/http-proxy/` 可以构造 undici agent 类，或提供 `dispatcher` 属性；其他包与 apps 必须走该包的门面。
- 门禁解析 `import { Agent as X }`、`undici.Agent`、`import('undici')` 解构，以及 `dispatcher: x`、`{ dispatcher }`、`{ 'dispatcher': x }`。它标记任何含 `dispatcher` 属性的对象字面量，而不只 fetch 的请求选项。
- 扫描 `packages/*/*/src/**/*.ts` 与 `apps/*/src/**/*.ts`；`.tsx`/`.mjs`/`.cjs` 不在门禁内；语料为空时抛错。
- 确需绕过代理时必须在违规行或其上一行写 `proxy-exempt: <理由>`；标记只豁免该位置。
- 违规逐条输出 `file:line`、行为与源码行，给出 `proxyRouteFor` 修复建议并退出 1。
- 评审者必须逐条审查豁免理由；门禁只证明标记存在。

来源：deepseek-harness/scripts/verify-no-bare-dispatcher.ts:1-226@687f282e 来源：deepseek-harness/scripts/verify-no-bare-dispatcher.spec.ts:1-143@687f282e

<a id="m-enforcement-scripts-4-proxy-owner"></a>
- 证据：`DISPATCHER_OWNER = 'packages/util/http-proxy/'` 是唯一允许构造 agent 的包。`deepseek-harness/scripts/verify-no-bare-dispatcher.ts:29@687f282e` <a id="m-enforcement-scripts-4-proxy-marker"></a>
- 证据：`proxy-exempt:` 只在本行或上一行生效，注释锚定属性/`new` 表达式而非整条语句。`deepseek-harness/scripts/verify-no-bare-dispatcher.ts:36@687f282e` <a id="m-enforcement-scripts-4-proxy-corpus"></a>
- 证据：`scanRepository()` 在 glob 未匹配到任何文件时抛出“scanned an empty corpus”。`deepseek-harness/scripts/verify-no-bare-dispatcher.ts:206@687f282e` <a id="m-enforcement-scripts-4-proxy-object-literal"></a>
- 证据：dispatcher 识别覆盖任何对象字面量的 `dispatcher` 属性（含 shorthand 与引号键），不限于 fetch 的请求选项。`deepseek-harness/scripts/verify-no-bare-dispatcher.ts:185-211@687f282e` <a id="m-enforcement-scripts-4-proxy-spec"></a>
- 证据：spec 覆盖重命名/命名空间/动态导入解构、三种属性写法、行内与上一行豁免、owner 路径归一化、预过滤与当前树扫描。`deepseek-harness/scripts/verify-no-bare-dispatcher.spec.ts:1-143@687f282e`

**执行与失败。** `pnpm run verify-no-bare-dispatcher` 与 `run-gates` 执行。违规退出 1；空语料抛错。门禁只扫描 packages/apps 的 `.ts`，不覆盖 `.tsx/.mjs/.cjs`、生成 JS、测试或依赖内部；任何含 `dispatcher` 属性的对象字面量都会被标记，可能误报非请求对象。

**验证。** positive：owner 之外无 agent 构造/`dispatcher` 属性。rejection：重命名/命名空间/动态 import 构造或三种 dispatcher 写法。recovery：改用 `proxyRouteFor()`，或在必须直连处加可审查的 `proxy-exempt:`。证据标记为 `planned`。

**限制。** 只扫描 packages/apps 的 `.ts`，不覆盖 `.tsx/.mjs/.cjs`、生成的 JS、测试文件或依赖内部；任何含 `dispatcher` 属性的对象字面量都会被标记，可能产生非请求对象误报。无法判断豁免理由是否真实成立，也无法发现通过环境变量或自定义 fetch 实现绕过代理的路径。

<a id="m-enforcement-scripts-4-dev-web-single-writer"></a>
### enforcement-scripts-4-dev-web-single-writer — `dev:web` 单写者构建/服务/watch 循环与原子停机

**问题。** `dev:web` 与 `build`/`build:artifacts` 写同一批 `lib/dist` 树。并行运行会互相覆盖；某个 watcher 静默退出会让界面继续显示旧产物；普通子进程信号处理会留下孤儿或让 tsc/tsdown 在终端关闭后继续写盘。

**义务。**

- 默认先完整构建一次，再启动 watcher 与 `dsh web`；`--skip-build` 要求已有可信产物，`--no-serve` 只跑重建 watcher。
- watch 集合按声明发现：`dsh.client` 插件目录，加上 shell 静态链接的 Client-preset library 目录；排除 Loader 交付与 test-support；发现为空时退出 1。这里只有空集检查，没有最低数量、历史计数或缩小比例检测。
- 插件 watcher 监听源码；生产 Client 构建消费已发射 JS/类型；`--poll[=ms]` 也必须传达给 tsc watcher，裸 `--poll` 默认 500ms。
- 长驻 stage 的环境只在启动时采样一次；不得用 watcher 输出反推或验证环境。
- 停止前任一 stage 自行退出时，整个循环以非零码终止；启动阶段的 stage 提前退出同样报告。
- 停止请求先转发一次信号并等待 6 秒；未退出的 stage 收到 SIGTERM 再等 6 秒，仍未退出才 SIGKILL，因此最坏总等待约 12 秒（SIGKILL 后还要等实际退出）；终端已中断的 stage 不重复计数；最后恢复终端。
- `dev:web` 不得与 `build`/`build:artifacts` 并行运行。这是模块头的文档 MUST NOT，没有锁文件或进程检查强制执行。
- `dsh web` 必须经 `apps/cli/src/bin.ts` + tsx 启动，不得直接启动 package entry。

来源：deepseek-harness/scripts/dev-web.ts:1-440@687f282e 来源：deepseek-harness/scripts/dev-web.spec.ts:1-220@687f282e

<a id="m-enforcement-scripts-4-dev-build-first"></a>
- 证据：模块头声明“build once, serve through dsh web, and keep every stage alive”；顺序是构建后再 watch/serve。`deepseek-harness/scripts/dev-web.ts:2@687f282e` <a id="m-enforcement-scripts-4-dev-discovery"></a>
- 证据：`discoverPluginDirs()` 与 `discoverLibraryDirs()` 分别发现 dsh.client 包与 shell 链接的 Client-preset 库。`deepseek-harness/scripts/dev-web.ts:134@687f282e` <a id="m-enforcement-scripts-4-dev-stop-grace"></a>
- 证据：`STOP_GRACE_MS = 6_000` 是每一步升级之间的宽限期；`stop()` 依次转发初始信号、SIGTERM，最后 SIGKILL，每步等待 6 秒。`deepseek-harness/scripts/dev-web.ts:290@687f282e` <a id="m-enforcement-scripts-4-dev-supervisor"></a>
- 证据：StageSupervisor 报告停止前自行退出的 stage，并在停止时等待/升级幸存者。`deepseek-harness/scripts/dev-web.ts:237@687f282e` <a id="m-enforcement-scripts-4-dev-spec-signal"></a>
- 证据：spec 断言只转发一次信号、宽限后升级、且不把已中断的 stage 计入幸存者。`deepseek-harness/scripts/dev-web.spec.ts:50@687f282e` <a id="m-enforcement-scripts-4-dev-spec-env"></a>
- 证据：spec 断言启动时只采样一次本地环境，不用 watcher 输出做验证。`deepseek-harness/scripts/dev-web.spec.ts:111@687f282e`

**执行与失败。** 入口是 `pnpm run dev:web`；`scripts/dev-web.spec.ts` 用假 stage 覆盖 supervisor 状态机、参数、发现与环境采样。stage 自退会退出 1；发现集合为空会抛错；`--no-serve` 收到服务参数会拒绝。单测不证明真实子进程在所有 shell 上都按时退出，也不证明 `build`/`dev:web` 互斥被操作系统强制。

**验证。** positive：默认 build→watch→serve、`--skip-build`/`--no-serve`/`--poll` 生效、Ctrl+C 后全部退出。rejection：watcher 自退、幸存者不退出、空发现、`--no-serve` 收到服务参数。recovery：修复 stage 退出路径或清理孤儿后重跑。证据标记为 `planned`。

**限制。** supervisor 单测使用假 stage，不能证明真实子进程在 Windows、POSIX 或不同终端下的信号语义；也无法强制阻止用户另开终端运行 `build:artifacts`，互斥仍依赖流程与文档。发现集合只有空集检查，部分缩水不会被发现。升级窗口是每步 6 秒，总等待最坏约 12 秒（不含 SIGKILL 后的实际退出等待）。

<a id="m-enforcement-scripts-4-native-abi-baseline"></a>
### enforcement-scripts-4-native-abi-baseline — 原生制品的架构与最低 OS/GLIBC 不得超过声明

**问题。** Python runtime 可执行文件和 SSH helper 的 native payload 常在较新构建机上生成。若 Mach-O deployment target 或 ELF GLIBC 符号版本高于 wheel tag/target 声明，产物在旧系统上无法启动；而 otool 输出中相邻的 linked-library version 很容易被误读为 OS 最低版本。

**义务。**

- macOS runtime 可执行文件的 deployment target 取所有切片中最新 `LC_BUILD_VERSION minos` 或 `LC_VERSION_MIN_MACOSX version`，且不得高于 `macosx_<major>_<minor>_<arch>` 声明的版本；缺 load command 直接失败。
- 解析 otool 时必须区分 OS 最低版本与 linked library 的 current version。
- SSH helper 的每个原生 payload 必须与 target OS family 一致（ELF 对 Linux、Mach-O 对 macOS），arch 必须匹配 AArch64/x86-64 或 lipo 验证的 arm64/x86_64。
- SSH helper 的 Mach-O deployment target 不得超过 14.0；ELF 的 `GLIBC_` 符号版本不得超过 2.28。
- `verifyNativePayload()` 跳过 payload 中的非 ELF/Mach-O 文件，并在没有任何原生文件时返回空检查结果；它本身不把“原生文件缺失”判为失败。期望的原生文件缺失由 manifest/文件清单检查负责。不得把空检查结果当成 ABI 通过。
- Python checker 的 wheel platform 标签来自 `scripts/build-python-release.py` 的 `PLATFORMS`（经 runpy 读取，platforms.json 派生）；该依赖是检查输入的一部分，不在本分区单独审阅。
- `verifyNativePayload()` 由 `build-exe-for-ssh-helper.ts` 与 `verify-ssh-helper-artifact.ts` 在构建/验收时调用；`artifact.spec.ts` 只测试 `macosDeploymentVersions` 与 `prepareSshRelease`/`verifyPayload`，没有用原生文件调用 `verifyNativePayload`。
- 检查必须在发布/上传前执行；修复是换旧基线或提高声明目标，不是放宽检查或伪造 tag。

来源：deepseek-harness/scripts/check-macos-deployment-target.py:1-111@687f282e 来源：deepseek-harness/scripts/build-python-release.py:48@687f282e 来源：deepseek-harness/scripts/ssh-helper/native.ts:1-74@687f282e 来源：deepseek-harness/scripts/ssh-helper/artifact.spec.ts:1-117@687f282e

<a id="m-enforcement-scripts-4-native-otool-parse"></a>
- 证据：`parse_otool_deployment_target()` 只在 `LC_BUILD_VERSION` 读 minos、在 `LC_VERSION_MIN_MACOSX` 读 version，并返回最新值。`deepseek-harness/scripts/check-macos-deployment-target.py:37@687f282e` <a id="m-enforcement-scripts-4-native-compare"></a>
- 证据：`ensure_compatible()` 逐段比较实际版本与 wheel tag claimed 版本，超出即抛 RuntimeError。`deepseek-harness/scripts/check-macos-deployment-target.py:74@687f282e` <a id="m-enforcement-scripts-4-native-payload"></a>
- 证据：`verifyNativePayload()` 对每个 payload 检查 ELF/Mach-O family 与 arch，并在 Mach-O 上拒绝高于 14.0 的 deployment target。`deepseek-harness/scripts/ssh-helper/native.ts:42@687f282e` <a id="m-enforcement-scripts-4-native-glibc"></a>
- 证据：ELF 的 `GLIBC_` 符号版本逐个与 2.28 比较，超出即失败。`deepseek-harness/scripts/ssh-helper/native.ts:61@687f282e` <a id="m-enforcement-scripts-4-native-test"></a>
- 证据：artifact spec 断言 macOS 最低版本读取不会把 linked library version 当作 OS 版本；它调用 `prepareSshRelease`/`verifyPayload`，没有用原生文件调用 `verifyNativePayload`。`deepseek-harness/scripts/ssh-helper/artifact.spec.ts:79@687f282e` <a id="m-enforcement-scripts-4-native-empty"></a>
- 证据：`verifyNativePayload()` 遍历 payload，只对 ELF/Mach-O 执行 family/arch/版本检查，其他文件 `continue`；全部跳过时返回空数组。`deepseek-harness/scripts/ssh-helper/native.ts:38-72@687f282e`

**执行与失败。** Python 检查在 GitHub/GitLab 的 build-exe job 中运行；SSH helper 检查在 release 打包/验证路径中运行。超限、缺 load command、arch/family 不符都抛错/退出非零并阻断上传。检查读取已构建字节；本分区没有执行这些检查，也没有覆盖 native family/arch/GLIBC 的原生测试，不能把 artifact spec 的 otool 用例外推为完整 ABI 通过。

**验证。** positive：deployment target ≤ wheel tag，SSH helper 的 family/arch/GLIBC/macOS 全在声明内。rejection：更高 minos、只有 linked-library version、macOS 14.1、GLIBC_2.29、混入另一平台原生文件。recovery：换旧 SDK/构建机或提高声明目标后重构建。证据标记为 `planned`。

**限制。** 只检查显式 load command 与直接依赖符号；不覆盖运行时 dlopen、插件加载的更高版本库、代码签名/公证，也不能证明构建工具链的其他 ABI 属性（如 CPU 特性）与声明一致。native.ts 的 family/arch/GLIBC 断言没有本分区 spec 执行，空 native payload 返回空结果，原生文件缺失需由清单检查兜底；artifact.spec 的通过不能替代原生 payload 测试。

## References

固定提交引用（只读检查，不是执行证据）：

- `deepseek-harness/packages/client/tsdown.client.ts:1-780@687f282e` — 共享 Client 预设实现：manifest 命名、dualClient、纯度/external、实验隔离、CSS/图片 loader 与 sourcemap。
- `deepseek-harness/scripts/client-bundle-purity.spec.ts:1-565@687f282e` — 共享 Client 预设的纯度、external、实验隔离、sourcemap 与 watch fixture 断言。
- `deepseek-harness/scripts/client-bundle-css.spec.ts:1-124@687f282e` — CSS/图片 loader 的 watch、注入、内联与 data URL 断言。
- `deepseek-harness/scripts/verify-client-ui-i18n.ts:1-361@687f282e` — Client UI 文案 AST 门禁与 450 文件下限。
- `deepseek-harness/scripts/verify-client-ui-i18n.spec.ts:1-90@687f282e` — UI 文案规则片段、locale owner 豁免与路径归一化断言。
- `deepseek-harness/scripts/verify-client-route-resolution.ts:1-339@687f282e` — 四类浏览器路由规则与 fail-closed 发现。
- `deepseek-harness/scripts/verify-client-route-resolution.spec.ts:1-199@687f282e` — 路由规则、identity 读取放行、producer 与 face 发现断言。
- `deepseek-harness/scripts/verify-no-bare-dispatcher.ts:1-226@687f282e` — undici agent/dispatcher 所有权门禁与行级豁免。
- `deepseek-harness/scripts/verify-no-bare-dispatcher.spec.ts:1-143@687f282e` — 重命名/命名空间/动态解构与 dispatcher 属性写法断言。
- `deepseek-harness/scripts/dev-web.ts:1-440@687f282e` — 开发循环、watch 发现、stage supervisor 与停机宽限。
- `deepseek-harness/scripts/dev-web.spec.ts:1-220@687f282e` — supervisor/参数/发现/环境采样的单测。
- `deepseek-harness/scripts/check-macos-deployment-target.py:1-111@687f282e` — wheel tag 与 otool deployment target 比较。
- `deepseek-harness/scripts/build-python-release.py:48@687f282e` — PLATFORMS 平台表来源（未审阅其余逻辑）。
- `deepseek-harness/scripts/ssh-helper/native.ts:1-74@687f282e` — SSH helper 的 family/arch/GLIBC/macOS 基线检查与空 payload 返回。
- `deepseek-harness/scripts/ssh-helper/artifact.spec.ts:1-117@687f282e` — archive inventory、otool 解析与完整矩阵证据测试。
