# website-contracts

本参考覆盖 `deepseek-harness` 提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中 `website/` 的 28 个实现、样式、测试与期望输出文件。引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`；行号只对应该提交。

## Scope

本域拥有 **VitePress 站点配置、主题增强、开发期 raw 请求路由与主题契约测试**。它解释：站点如何从发布清单派生导航并失败关闭缺失的 `editSource`；正文与行内代码如何避免被 Vue 当作模板；原生代码组如何在搜索摘要与 MPA 构建中保持可用；开发服务器如何在不劫持 Vite 模块导入的前提下提供 raw Markdown 与 `llms.txt`；页面上的 Markdown 复制/查看动作如何满足浏览器手势、取消与本地化要求；图片与 Mermaid 查看器如何共享一个模态并完整释放资源；这些行为由哪些 JSDOM 测试和按语言提交的 expected HTML 守卫。

本域 **不拥有**:发布清单的字段与路由树(`documentation-website-publication-manifest`)、源相对链接到站点路由的投影算法(`documentation-website-link-projection`)、生产构建中的 raw 孪生/`llms.txt` 生成(`documentation-website-raw-llms`)、文档门禁组合(`documentation-gate-composition`)、owner-local expected 输出的通用放置规则(`testing-expected-output-placement`)、真实浏览器 lane(`testing-web-browser-lane`)以及 `website/package.json` 的构建入口与固定工具链(`user-and-publication-contracts.website-build-containment`)。这些机制在本文件中只作为依赖或交叉引用出现。

证据限制：全部结论来自只读源码检查，没有运行 `docs:build`、网站测试或真实浏览器。`verification` 中的正/反/恢复场景在知识文件中均标为 `planned`，不得当作已执行结果。

## Mechanisms

<a id="m-website-contracts-config-single-source"></a>

<a id="website-contracts-config-single-source"></a>

### website-contracts-config-single-source — 站点配置的单一来源：清单派生导航、editSource 失败关闭与可处置输出目录

**问题。** 站点导航、侧栏、模块标签与编辑链接若在配置里各写一份，发布清单新增/移动页面后就会缺页或指向旧路由。输出目录、缓存与公开资源若混放，生成物会被跟踪或因清理而丢失。

**源义务。**

<a id="m-website-contracts-config-sidebar"></a>
- 侧栏分组来自 `orderedPages(locale, collection)`，组内页面顺序也由该函数决定；`sectionSpec` 只决定分组是否可折叠。`deepseek-harness/website/.vitepress/config.ts:13-42@687f282e`

<a id="m-website-contracts-config-modules"></a>
- `guideModules` 是 guide 集合与 develop/reference 模块标签的唯一来源；导航栏与 guide 侧栏都从这里读取，不各写一套标签。`deepseek-harness/website/.vitepress/config.ts:46-107@687f282e`

<a id="m-website-contracts-config-editsource"></a>
- 两个 locale 的 `editLink.pattern` 都要求 `frontmatter.editSource` 是字符串；否则 `throw new Error('Projected documentation page has no editSource frontmatter.')`。base 由 `process.env.DOCS_BASE ?? '/'` 解析一次。`deepseek-harness/website/.vitepress/config.ts:160-175@687f282e`

<a id="m-website-contracts-config-identity"></a>
- 站点标题与描述放在共享的 `siteIdentity` 中；wordmark 从 `../public/wordmark.svg` 读取后内联并加 `dsh-wordmark` 类，使 `currentColor` 跟随主题。`deepseek-harness/website/.vitepress/config.ts:177-189@687f282e`

<a id="m-website-contracts-config-buildend"></a>
- `buildEnd` 从同一清单生成 raw Markdown 孪生和 `llms.txt`；`srcDir: '.generated'`、`cacheDir: '.cache'`、`outDir: '.dist'` 都是可处置目录。`deepseek-harness/website/.vitepress/config.ts:271-284@687f282e`

<a id="m-website-contracts-config-publicdir"></a>
- 因为 Vite 根位于生成树内，`publicDir` 必须显式指向 `../public`；否则受跟踪的 favicon/wordmark 无处可放。`deepseek-harness/website/.vitepress/config.ts:340-352@687f282e`

**执行步骤。**

1. 在发布清单中声明或移动页面，保持路由、locale 与对侧一致。
2. 确认投影器给每个发布页写入字符串 `editSource`。
3. 只通过 `orderedPages`/`localeCollections`/`routeLink`/`landingLink`/`sectionSpec` 构建导航与侧栏；模块标签只改 `guideModules`。
4. 新增 favicon、图片等公开资源时放进 `website/public`，不要放进 `.generated`。
5. 在根 base 与子路径 base 下分别检查 favicon、编辑链接和 raw 路由。
6. 确认工作区没有 `.generated`、`.cache`、`.dist` 的受跟踪变更。

**失败与例外。** 缺 `editSource` 时渲染/构建抛错；清单与 locale 集合不一致时导航缺页或链接 404；把资源放进 `.generated` 会随清理丢失；子路径部署未使用 base 时 favicon 与 raw 链接失效。未发布页面不需要 `editSource`，因为它不进入站点。链接投影算法不在本机制内。

<a id="m-website-contracts-vue-interpolation-safety"></a>

<a id="website-contracts-vue-interpolation-safety"></a>

### website-contracts-vue-interpolation-safety — 正文与行内代码的 Vue 插值转义，以及围栏渲染的失败关闭与构建期缓存

**问题。** VitePress 的 Markdown 输出会进入 Vue 编译；正文或行内代码中的字面量 `{{ }}` 会被当作模板表达式。全局替换 HTML 又会破坏代码围栏与 Mermaid。

**源义务。**

<a id="m-website-contracts-vue-escape"></a>
- `escapeVueInterpolation` 只把 `{{` 与 `}}` 替换为 `&#123;&#123;` / `&#125;&#125;`；该函数只用于 `text` 与 `code_inline` 两个渲染规则。`deepseek-harness/website/.vitepress/config.ts:125-127@687f282e`

<a id="m-website-contracts-vue-rules"></a>
- `markdown.config` 包装 `text` 与 `code_inline`；`text`、`code_inline`、`fence` 任一原生规则缺失时立即抛错，不允许静默跳过。`deepseek-harness/website/.vitepress/config.ts:355-364@687f282e`

<a id="m-website-contracts-vue-cache"></a>
- `fence` 包装先放行 `mermaid`/`mmd` 与带 `src` 的 snippet；其余围栏只有 `NODE_ENV === 'production'` 才按 `[content, info, markup, attrs]` 缓存，开发渲染器可跨 HMR 存活，因此不缓存。`deepseek-harness/website/.vitepress/config.ts:365-378@687f282e`

**执行步骤。**

1. 确认原生 `text`、`code_inline`、`fence` 规则存在。
2. 只包装 `text` 与 `code_inline`，转义双花括号。
3. 在 `fence` 包装中先放行 Mermaid 和 snippet token。
4. 只在生产环境缓存围栏输出，键包含内容、info、markup 与 attrs。
5. 用含字面量 `{{ }}` 的正文、行内代码、普通围栏和 Mermaid 页面做渲染验证。

**失败与例外。** 未转义时正文出现空白或表达式被执行；误转义围栏会破坏代码示例；缺原生规则时静默跳过会让转义整体失效。作者写在原始 HTML 块里的内容不经过这两条规则，需自行保证安全。本域在固定提交的 `website/tests`、`website/.vitepress` 与全仓 `*.spec.ts` 中对 `escapeVueInterpolation`、`Interpolation`、`code_inline`、`&#123;` 及字面量 `{{` 做了有界检索，未发现专门回归测试；这是有界检索，不是逐行全审或“绝无测试”的证明，且测试未运行。

<a id="m-website-contracts-code-group-isolation"></a>

<a id="website-contracts-code-group-isolation"></a>

### website-contracts-code-group-isolation — 代码组分组的表单隔离、MPA 全量可见与搜索摘要可见性

**问题。** VitePress 本地搜索会把编译后的代码组 HTML 重新挂载到摘要；原生 radio 复用相同 `name`，摘要中点选平台会清掉正文的选择。MPA 构建没有客户端 tab 处理器，非活动块会永久隐藏。

**源义务。**

<a id="m-website-contracts-cg-mpa"></a>
- `codeGroupFallbackHead(mpa)` 只在 MPA 时返回一段 `<style>`：隐藏 `.vp-code-group .tabs` 与 `button.copy`，并让 `.blocks > div { display: block; }`；非 MPA 返回空数组。`deepseek-harness/website/.vitepress/code-groups.ts:10-15@687f282e`

<a id="m-website-contracts-cg-form"></a>
- `isolateCodeGroupRadios` 把 `<div class="tabs">` 替换为 `<form class="tabs" @submit.prevent>`，把 `</div><div class="blocks">` 替换为 `</form><div class="blocks">`；规则缺失或标记不含预期片段时抛错。`deepseek-harness/website/.vitepress/code-groups.ts:22-33@687f282e`

<a id="m-website-contracts-cg-css"></a>
- 搜索摘要没有 tab 控件，所以 `.VPLocalSearchBox .vp-code-group .blocks > div` 强制 `display: block`，每个匹配命令都可见；同时保留键盘 focus-visible 样式。`deepseek-harness/website/.vitepress/theme/code-group.css:1-10@687f282e`

<a id="m-website-contracts-cg-test-selection"></a>
- 测试用真实 `createMarkdownRenderer` 生成 HTML，在 JSDOM 中先选中正文 radio，再把同一 HTML 挂到摘要并选中摘要 radio，断言正文选择不变、两个 radio 的 `form` 不同、tab 条是 form。`deepseek-harness/website/tests/code-groups.spec.ts:12-40@687f282e`

<a id="m-website-contracts-cg-test-mpa"></a>
- MPA 测试加载 VitePress 原生 CSS，断言默认只有一个块可见；注入 fallback 后两个块都为 `block`，三个 `.tabs`/`button.copy` 控件都为 `none`，且 `codeGroupFallbackHead(false)` 为空。`deepseek-harness/website/tests/code-groups.spec.ts:46-67@687f282e`

**执行步骤。**

1. 确认代码组输出包含 `<div class="tabs">` 与 `</div><div class="blocks">`。
2. 用渲染规则把 tab 条包进独立 form，保留 `@submit.prevent` 与 radio 的 name/id。
3. 在 `transformHead` 中按 `siteConfig.mpa` 注入 fallback。
4. 保持搜索摘要的全量可见 CSS。
5. 运行真实 renderer + JSDOM 测试，覆盖正文/摘要同时选中与 MPA computed display。

**失败与例外。** 摘要选择清空正文选择；MPA 只显示第一个命令；VitePress 标记变化时未抛错会静默失去隔离。普通代码围栏不属于代码组，不应用本机制；非 MPA 构建不得注入 fallback。

<a id="m-website-contracts-raw-dev-serving"></a>

<a id="website-contracts-raw-dev-serving"></a>

### website-contracts-raw-dev-serving — 开发服务器 raw Markdown 请求路由：显式 404、Vite 模块直通与 HEAD 语义

**问题。** 开发服务器若把所有 `.md` 请求都当 raw 文档，会劫持 Vite 的页面模块导入；反过来，对未发布页面返回 200 会泄露草稿。

**源义务。**

<a id="m-website-contracts-raw-routing"></a>
- 只处理 GET/HEAD；URL 无法解析、路径不以 base 开头或方法不符时 `next()`。`dsh-raw=1` 仅在路径以 `.md` 结尾时成立。`sec-fetch-dest` 为 script/style/image 等非 document 请求时交给 Vite，唯一例外是 `empty` 且显式 raw。`deepseek-harness/website/raw-markdown.ts:14-38@687f282e`

<a id="m-website-contracts-raw-content"></a>
- `llms.txt` 由当前清单渲染回调提供，其他 `.md` 由 `rawMarkdownRoute` 提供；显式 raw 未命中返回 404，非显式未命中 `next()`。Markdown 用 `text/markdown; charset=utf-8`，`llms.txt` 用 `text/plain; charset=utf-8`；HEAD 只发头。`deepseek-harness/website/raw-markdown.ts:39-50@687f282e`

<a id="m-website-contracts-raw-test-explicit"></a>
- 请求矩阵测试覆盖显式 raw 的 document/empty/undefined destination、普通 raw 导航、未发布显式 404，以及 llms.txt/HEAD。`deepseek-harness/website/tests/raw-markdown.spec.ts:22-60@687f282e`

<a id="m-website-contracts-raw-test-delegation"></a>
- script/style/image 的 `.md` 请求、缺失路径、其他 base、POST 与非显式请求都只调用 `next()`；投影函数抛错时测试断言异常向上传播，而不是 200。`deepseek-harness/website/tests/raw-markdown.spec.ts:55-81@687f282e`

<a id="m-website-contracts-raw-config"></a>
- 开发服务器在 Vite 插件 `configureServer` 中注册 `rawMarkdownMiddleware(base, () => llmsTxt(...))`，并监听清单源文件变化重新投影。`deepseek-harness/website/.vitepress/config.ts:108-123@687f282e`

**执行步骤。**

1. 在 `configureServer` 中先注册 raw 中间件。
2. 按 base 剥离前缀，区分 `llms.txt` 与 `.md`。
3. 用 `sec-fetch-dest` 区分文档导航与脚本/模块请求。
4. 显式 raw 未命中返回 404，非显式未命中调用 `next()`。
5. 运行请求矩阵测试，覆盖 GET/HEAD、query、错误 base 与投影异常。

**失败与例外。** 脚本导入被 raw 响应劫持会使页面白屏；未发布 raw 泄露；投影异常被吞掉会返回 200 空内容；错误 content-type 会让复制动作拒绝内容。该中间件只服务开发服务器；生产 raw 孪生由 `buildEnd` 生成。

<a id="m-website-contracts-page-markdown-actions"></a>

<a id="website-contracts-page-markdown-actions"></a>

### website-contracts-page-markdown-actions — 页面 Markdown 操作：rawMarkdownPath 门槛、水合前直链、复制请求与页面级取消

**问题。** 复制原始 Markdown 是异步浏览器权限操作；若在 `await` 之后才写剪贴板、或在路由切换后继续更新旧页状态，会出现权限失败、串页或错误内容。

**源义务。**

<a id="m-website-contracts-pma-lifecycle"></a>
- 每个挂载实例拥有自己的复制状态；`onBeforeUnmount` 关闭菜单并 abort 当前 controller。路由或语言变化通过 key 重建实例。`deepseek-harness/website/.vitepress/theme/page-markdown-actions.ts:60-110@687f282e`

<a id="m-website-contracts-pma-copy"></a>
- 复制请求为 `${props.path}?dsh-raw=1`，只接受 2xx 且 content-type 为 `text/markdown` 或 `text/plain`；其他响应归为 `requestFailed`。缺少 `ClipboardItem` 或 `clipboard.write` 时归为 `clipboardFailed`。`deepseek-harness/website/.vitepress/theme/page-markdown-actions.ts:113-151@687f282e`

<a id="m-website-contracts-pma-render"></a>
- 未水合时只渲染真实静态链接 `href=props.path`、`target=_blank`、`rel=noopener` 和本地化可访问名称；水合后提供复制按钮、菜单、`role=status` 状态区和键盘/指针关闭路径。`deepseek-harness/website/.vitepress/theme/page-markdown-actions.ts:154-213@687f282e`

<a id="m-website-contracts-pma-mount"></a>
- 布局仅在 `!page.isNotFound` 且 `frontmatter.rawMarkdownPath` 是字符串时渲染；key 由 `route.path`、`lang`、`path` 组成，值用 `site.base + path`。`deepseek-harness/website/.vitepress/theme/index.ts:40-52@687f282e`

<a id="m-website-contracts-pma-test-snapshots"></a>
- 两种 locale 分别对 hydrated 控件与打开菜单做 `toMatchFileSnapshot`；SSR 测试确认水合前没有按钮、静态链接带 base，并且不触发 fetch。`deepseek-harness/website/tests/page-markdown-actions.spec.ts:98-121@687f282e`

<a id="m-website-contracts-pma-test-route"></a>
- 路由变化关闭菜单并移除 outside-pointer 监听；根 base 与子路径 base 都从清单路径构造直链，不受可见 URL 的 query/hash 影响；home/404 不渲染任何操作。`deepseek-harness/website/tests/page-markdown-actions.spec.ts:232-275@687f282e`

<a id="m-website-contracts-pma-test-copy"></a>
- 点击时立即调用 `clipboard.write`；404/HTML/网络失败、content-type 缺失、body 读取失败都报告失败；路由/语言/卸载会 abort 旧 fetch 并让旧完成不再影响新页。`deepseek-harness/website/tests/page-markdown-actions.spec.ts:277-412@687f282e`

**执行步骤。**

1. 投影器为页面写入 `rawMarkdownPath`；布局只在存在该字段时挂载操作。
2. 服务端渲染输出静态直链，客户端挂载后启用复制与菜单。
3. 点击复制时立即调用 `clipboard.write`，并把 fetch 的 Blob promise 传入 `ClipboardItem`。
4. 在路由、语言、卸载变化时 abort 当前请求并清空状态。
5. 按 en-US 与 zh-CN 分别更新并审查 expected HTML。

**失败与例外。** `await` 后再写剪贴板会丢用户手势；旧请求完成会污染新页面状态；缺 `rawMarkdownPath` 仍渲染会导致 404 直链；不校验 content-type 会把 HTML 错误页复制成 Markdown。没有 `rawMarkdownPath` 的页面是正常无操作页，不是错误；静态宿主把 `.md` 作为 `text/plain` 返回是允许的。

<a id="m-website-contracts-media-viewer"></a>

<a id="website-contracts-media-viewer"></a>

### website-contracts-media-viewer — 共享图片/图表查看器：增强资格、单一模态、焦点与资源生命周期

**问题。** 图片与 Mermaid 图需要全屏查看，但增强逻辑若移动源元素会破坏 Markdown 投影；若每个图各自创建模态，会出现多个 dialog、滚动锁泄漏、焦点丢失与旧内容残留。

**源义务。**

<a id="m-website-contracts-mv-image-eligibility"></a>
- 图片只有 `complete`、`naturalWidth/Height > 0`、`alt.trim()` 非空、独占段落（同级只有空白与查看按钮），且不在 `a, button, .mermaid, [data-no-zoom], [aria-hidden="true"], [role="presentation"], [role="none"]` 内时才增强。`deepseek-harness/website/.vitepress/theme/image-viewer.ts:78-83@687f282e`

<a id="m-website-contracts-mv-image-open"></a>
- 增强不移动源图片；打开时新建 `img`，复制 `currentSrc || src`、`alt` 与固有尺寸，并标记为不可拖动。`deepseek-harness/website/.vitepress/theme/image-viewer.ts:106-124@687f282e`

<a id="m-website-contracts-mv-mermaid"></a>
- Mermaid 仅接受 viewBox 宽高有限且为正的 SVG；标题取 `.vp-doc h1` 的文本，空白或缺失时用本地化回退标题；内容用 `cloneNode(true)` 交给共享查看器。`deepseek-harness/website/.vitepress/theme/mermaid-viewer.ts:17-20@687f282e`、`deepseek-harness/website/.vitepress/theme/mermaid-viewer.ts:59-80@687f282e`

<a id="m-website-contracts-mv-modal"></a>
- 打开新视图前先 `this.close()`；dialog 用 `aria-labelledby`，Close 按钮 `autofocus`，body 滚动设为 `hidden`，内容放进 shadow root 以隔离 Mermaid 样式与片段 ID。`deepseek-harness/website/.vitepress/theme/media-viewer.ts:89-161@687f282e`

<a id="m-website-contracts-mv-cleanup"></a>
- 关闭时 abort 监听器、断开 ResizeObserver、destroy panzoom、移除 dialog、恢复 body overflow，并在 trigger 仍连接时把焦点还给它；`cleanup` 幂等。`deepseek-harness/website/.vitepress/theme/media-viewer.ts:191-225@687f282e`

<a id="m-website-contracts-mv-mount"></a>
- 主题在 `onMounted` 后动态导入并安装 viewer；`watch([route.path, lang, isDark])` 调用 refresh；`onBeforeUnmount` 设置 disposed、dispose viewer 并 close media。`deepseek-harness/website/.vitepress/theme/index.ts:20-39@687f282e`

<a id="m-website-contracts-mv-test-eligibility"></a>
- 测试断言链接、空 alt、装饰角色、`aria-hidden`、`data-no-zoom`、行内、同段多图、图外、Mermaid 内与加载失败图片都不被增强，HTML 保持原样。`deepseek-harness/website/tests/image-viewer.spec.ts:141-196@687f282e`

<a id="m-website-contracts-mv-test-lifecycle"></a>
- 测试覆盖替换活动视图时旧 dialog 消失、旧 panzoom destroy、仍只有一个 dialog；src/srcset/currentSrc 变化关闭旧内容；refresh/dispose/remove/error 释放资源并恢复焦点与滚动。`deepseek-harness/website/tests/image-viewer.spec.ts:228-328@687f282e`

<a id="m-website-contracts-mv-test-mermaid"></a>
- 测试确认 shadow root 中的副本保留 `marker-end="url(#arrow)"`，源文档只有一个 `#diagram`，源 SVG outerHTML 不变，body 滚动被锁而 documentElement 不被锁。`deepseek-harness/website/tests/mermaid-viewer.spec.ts:131-154@687f282e`

**执行步骤。**

1. 在主题 `onMounted` 后安装 viewer，避免 SSR 访问浏览器对象。
2. 扫描 `.vp-doc` 内的独立图片与 Mermaid 容器，按资格条件加查看按钮。
3. 通过共享 `MediaViewer` 打开克隆内容，设置标题、尺寸与是否显示原尺寸控件。
4. 在 route/lang/theme 变化时 refresh，卸载时 dispose 并 close。
5. 用 JSDOM 测试资格、替换、焦点、滚动锁与资源释放；真实浏览器补充原生 dialog 与 SVG 布局检查。

**失败与例外。** 移动源图片会破坏投影；多个模态会泄漏滚动锁；`srcset` 变化未关闭会显示旧图；dispose 不彻底会留下监听器或孤儿按钮。链接图片、行内图片、装饰图片、`data-no-zoom` 容器内图片与失败图片保持原交互；Mermaid 尺寸不可用时不加按钮。

<a id="m-website-contracts-theme-test-evidence"></a>

<a id="website-contracts-theme-test-evidence"></a>

### website-contracts-theme-test-evidence — 主题契约测试：JSDOM 行为断言、按 locale 的 expected 快照与真实浏览器边界

**问题。** 主题行为、可访问名称与本地化标记容易在重构中退化；人工点页面无法稳定回归，而把 JSDOM 结果当真实浏览器证明又会漏掉原生模态、布局与剪贴板差异。

**源义务。**

<a id="m-website-contracts-te-raw"></a>
- raw 中间件测试使用真实 `rawMarkdownMiddleware`，只 mock `rawMarkdownRoute`，覆盖显式/非显式、Vite 直通、404、HEAD 与异常传播。`deepseek-harness/website/tests/raw-markdown.spec.ts:22-52@687f282e`

<a id="m-website-contracts-te-codegroup"></a>
- 代码组测试用真实 VitePress renderer 生成 HTML，再用 JSDOM 读取原生 CSS 与 fallback 样式，断言 computed display 与 form 身份。`deepseek-harness/website/tests/code-groups.spec.ts:46-67@687f282e`

<a id="m-website-contracts-te-snapshots"></a>
- Markdown 动作测试按 `en-US`/`zh-CN` 对 hydrated 控件与打开菜单分别做文件快照；SSR 测试对水合前静态链接做快照。`deepseek-harness/website/tests/page-markdown-actions.spec.ts:98-120@687f282e`

<a id="m-website-contracts-te-image-snapshot"></a>
- 图片查看器测试在每个 locale 下对按钮、dialog 与克隆图片的 outerHTML 做 `toMatchFileSnapshot`，并同时断言焦点、滚动锁与 cancel 行为。`deepseek-harness/website/tests/image-viewer.spec.ts:191-192@687f282e`

<a id="m-website-contracts-te-jsdom-boundary"></a>
- Mermaid 测试头明确 `browser checks cover native modal focus and SVG layout`；两个 viewer 测试都 mock dialog/panzoom/ResizeObserver，不能把 JSDOM 绿灯当作浏览器证明。`deepseek-harness/website/tests/mermaid-viewer.spec.ts:1-2@687f282e`

<a id="m-website-contracts-te-expected-files"></a>
- expected HTML 是提交到 `website/tests/expected/` 的 owner-local 输出，文件名带 locale：`page-markdown-actions.<locale>.html`、`page-markdown-menu.<locale>.html`、`page-markdown-static.<locale>.html`、`image-viewer.<locale>.html`。`deepseek-harness/website/tests/expected/page-markdown-actions.en-US.html:1-1@687f282e`、`deepseek-harness/website/tests/expected/page-markdown-static.zh-CN.html:1-1@687f282e`

**证据角色。** 这些 expected HTML 是 `toMatchFileSnapshot`/SSR 快照刷新生成的文件，不是手写规则；覆盖账本将其源角色记为 `generated`，但它们就是测试断言的金标，因此仍以机制 ID 保留为本机制的测试证据。分类不等于证据适用性。

**执行步骤。**

1. 为行为写 role/name 级断言，并在需要时加 expected HTML 快照。
2. 按 locale 生成/刷新快照，并逐字审查 diff，不盲目接受。
3. 涉及 VitePress 内部标记时使用真实 renderer，不手写预期 DOM。
4. 运行主题测试，区分契约失败与环境/浏览器边界。
5. 对 JSDOM 无法覆盖的行为补真实浏览器检查或另建 lane。

**失败与例外。** 快照过期会掩盖 UI 文案/结构回归；无条件刷新会接受错误输出；把 JSDOM 绿灯当浏览器验证会在真实环境暴露焦点/剪贴板问题。纯视觉样式可不由快照覆盖；本域没有像素门禁。真实浏览器 lane 的规则属于 testing 域。

## References

**源文件（本域覆盖的 28 个路径）。**

- `deepseek-harness/website/.vitepress/code-groups.ts:1-34@687f282e`
- `deepseek-harness/website/.vitepress/config.ts:1-386@687f282e`
- `deepseek-harness/website/.vitepress/theme/code-group.css:1-10@687f282e`
- `deepseek-harness/website/.vitepress/theme/css.d.ts:1-2@687f282e`
- `deepseek-harness/website/.vitepress/theme/image-viewer.ts:1-127@687f282e`
- `deepseek-harness/website/.vitepress/theme/index.ts:1-53@687f282e`
- `deepseek-harness/website/.vitepress/theme/media-viewer.css:1-149@687f282e`
- `deepseek-harness/website/.vitepress/theme/media-viewer.ts:1-232@687f282e`
- `deepseek-harness/website/.vitepress/theme/mermaid-viewer.ts:1-98@687f282e`
- `deepseek-harness/website/.vitepress/theme/page-markdown-actions.css:1-144@687f282e`
- `deepseek-harness/website/.vitepress/theme/page-markdown-actions.ts:1-215@687f282e`
- `deepseek-harness/website/package.json:1-24@687f282e`
- `deepseek-harness/website/public/favicon.svg:1-3@687f282e`
- `deepseek-harness/website/public/wordmark.svg:1-19@687f282e`
- `deepseek-harness/website/raw-markdown.ts:1-52@687f282e`
- `deepseek-harness/website/tests/code-groups.spec.ts:1-71@687f282e`
- `deepseek-harness/website/tests/expected/image-viewer.en-US.html:1-3@687f282e`
- `deepseek-harness/website/tests/expected/image-viewer.zh-CN.html:1-3@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-actions.en-US.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-actions.zh-CN.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-menu.en-US.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-menu.zh-CN.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-static.en-US.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-static.zh-CN.html:1-1@687f282e`
- `deepseek-harness/website/tests/image-viewer.spec.ts:1-350@687f282e`
- `deepseek-harness/website/tests/mermaid-viewer.spec.ts:1-274@687f282e`
- `deepseek-harness/website/tests/page-markdown-actions.spec.ts:1-415@687f282e`
- `deepseek-harness/website/tests/raw-markdown.spec.ts:1-83@687f282e`

**跨域参考。**

- 发布清单、链接投影、raw 孪生与 `llms.txt` 生成、门禁组合：`references/documentation.md#reference-policy`；机制 ID 为 `documentation-website-publication-manifest`、`documentation-website-link-projection`、`documentation-website-raw-llms`、`documentation-gate-composition`。
- owner-local expected 输出与真实浏览器证据边界:`references/testing.md`;机制 ID 为 `testing-expected-output-placement`、`testing-web-browser-lane`。
- `website/package.json` 的构建入口与固定工具链:`references/user-and-publication-contracts.md`;机制 ID 为 `user-and-publication-contracts.website-build-containment`。
- Mermaid 围栏语法：`documentation-mermaid-syntax`。UI/UX 评审入口：`agent-workflows-ui-review`。
