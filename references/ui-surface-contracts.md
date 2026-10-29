# UI 表面契约：从归档 Agent Note 迁移的可操作参考

> 范围：本文件只处理 `ui-surface-contracts` 域分配的 19 组英文/中文 Agent Note（共 38 个正文）加 `.agents/notes/README.zh.md`。它提炼的是**可迁移的维护者义务**：共享呈现派生、渐进降级、派生状态、时间与范围语义、单一焦点、受限面板可达性、反馈分类与并发、shell 呈现对齐、插件提示符信任边界。
>
> 证据绑定：所有源引用写作 `deepseek-harness/<path>:<start>-<end>@687f282e`，指向固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。行号是实际阅读的换行行号；尾随换行不额外计行。
>
> 权威边界：`docs/ui-radius.md` 与 `docs/web-styling.md` 是仓库中央 UI 标准，拥有 token、圆角尺度、组件复用、焦点与动效、超级椭圆等规则。本文件**交叉引用**它们，不重述、不扩写其全部规则，也不把 Note 的历史决策冒充为当前中央标准。Note 中被取代、被删除表面或被后续决策覆盖的部分，按“适用性/重启条件”保留，而不是当作现行保证。

## 0. 使用方式、强制力与证据层级

### 0.1 何时使用本参考

在以下任一情形读取对应机制：

- 新增或修改结构化工具结果卡、代码块、读取卡、终端卡，或同一快照在多个位置渲染；
- 为长列表/长历史做视口延迟、懒加载、语法白名单或能力守卫；
- 增加阅读模式、折叠、时钟、耗时、统计、分页/窗口计数；
- 自定义菜单、命令面板、消息操作栏，或混合键盘/指针输入；
- 新增反馈入口、分类、备注、评分，或把反馈写入事件/日志/遥测；
- 让两个可互换工具（bash/pwsh 等）呈现一致；
- 让插件向终端提示符或状态行贡献可变片段。

### 0.2 源义务与迁移设计的分界

- **源义务**：Note 正文明确写出的决策、约束、否决理由、测试固定项和已知缺口。本文件用“必须/不得”表述，并给出行号。
- **迁移设计**：为让另一个项目落地而补充的步骤顺序、责任角色、完成信号、参数化建议。它们不是源仓已经自动执行的保证，标为“迁移建议”。
- **强制力**：只有源仓中真实存在的门禁/测试/编译器检查才算自动强制；其余标为评审或人工验证。Note 中的“测试固定”说明测试文件存在，但本域未运行它们，不能声称通过。
- **历史来源与现行性**：本域十个机制的来源都是 `.agents/notes/archived/` 中的归档 Agent Note（`kind: history`）。它们是条件性迁移经验，不是固定提交的现行产品政策或普适硬约束；每条 knowledge 记录的 `applicability` 也带同一 provenance。涉及 TUI 的条目在固定提交已无该表面，Web 条目也必须在目标实现上重验；不得把本参考当作当前源义务清单。

### 0.3 强制力图例

| 记号 | 含义 |
|---|---|
| 自动（编译器） | 类型/完备性检查会在构建期失败，例如 `Record<FeedbackCategory, true>` |
| 自动（spec/gate） | 源仓有单测、快照、样式扫描或 keyless e2e 固定行为；本域未执行 |
| 评审 | 只能靠代码评审、设计评审、真实浏览器/终端或人工可访问性检查 |
| 文档 | 规则写在中央标准或 README，靠读者遵守 |

### 0.4 中央标准的交叉引用

- `deepseek-harness/docs/web-styling.md:14-31@687f282e`：组件规则，含“先复用控件”、语义 token、CSS Modules、焦点/减少动效、超级椭圆与全圆配对、elevation、菜单容器、0.5px 发丝线。
- `deepseek-harness/docs/ui-radius.md:19-21,52-56,70-75,110-117@687f282e`：范围与局部调整权威、`corner-shape: superellipse(1.5)`、全圆/胶囊配对、嵌套几何、应用与验证。
- 本域只引用与 Note 机制直接相关的段落（复用控件、焦点/reduced-motion、降级臂几何、全圆退出）；其余圆角/token 细节以这两份文档为准。

<a id="ui-surface-contracts-single-render-derivation"></a>

## 1. 唯一渲染派生：同一 wire 契约只允许一个 model

### 触发条件

- 一个结构化结果（`card: 'read'`、`card: 'terminal'`、diff、render-intent 联合）要在聊天行、详情面板、回退卡片等多个位置渲染。
- 新增 primitive 与既有 primitive 的职责边界不清（例如是否给 `CodeBlock` 加行号栏）。
- 空态与常驻态都要输入框，但设计上只应有一套 chrome。

### 前置条件

- 已能拿到快照中的结构化视图（而不是只有渲染后的字符串）。
- 已确认所有渲染点及其 keyed/fallback 路径。
- 已有一个可复用的底层（语法高亮单例、终端块、按钮/输入框 primitive）。

### 步骤

1. 列出该 wire 变体的全部渲染点，以及每个点当前如何从 args/content 派生。
2. 写**唯一** model/派生函数：输入是快照视图，输出是 primitive props；在 model 内集中处理 null、未知 `card`、运行中、错误、通用回退。
3. 判断是否需要新 primitive：只有结构/chrome 真正不同才新增；读取卡的行号栏、窗口计数、高度上限不得塞进通用代码块。
4. 让所有渲染点消费同一 model 与 primitive；keyed 行与 `GenericToolCard` 回退都走同一路径。
5. 用 `card` 标签分派，而不是按工具名写每工具 UI；工具孪生只加必要的分类行。
6. 空态与常驻态共享同一输入框组件，用 `variant`/位置区分，不复制第二套 chrome。
7. 为每个渲染点、每个 null 分支写组件 spec；用 fixture/快照覆盖组装后的表面。

### 责任角色与完成信号

- **实现者**：提交唯一 model + primitive + 所有渲染点替换。
- **评审者**：确认没有第二处从原始字段派生；确认未知 wire 变体退通用表示。
- **完成信号**：两处渲染对同一输入产生一致输出；新增渲染点只 import model/primitive，不重新解析字段；spec 覆盖 null/未知分支。

### 失败处理

- 两处显示不一致：先统一 model，再改组件；不要在两处各打补丁。
- 未知 `card` 导致崩溃：model 返回 null，渲染点退通用/扁平卡片并记录版本差异。
- 新 primitive 污染通用组件：把专属关切移回新 primitive，恢复通用组件的单一职责。

### 例外

- 后端已提供通用 `content` 回退、UI 不需要结构化卡片的旧版本，可直接消费回退。
- 只有单一渲染点、且没有跨位置一致性要求的局部卡片，可暂不抽 model，但要在变更记录中说明。

### 证据限制

- 源 Note 明确说 `read-card-model.ts` 是“唯一位置”；Note 未声明机械门禁，本域也未读实现/测试来确认是否存在额外门禁，因此按现有证据记为评审义务。
- 本域未读 model/primitive 实现，只读 Note 与中央文档；不能证明当前代码仍保持该形态。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.md:10-26@687f282e`（`ReadBlock`、唯一 model、两个渲染点、未知 card null、空窗口隐藏 copy）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.zh.md:10-26@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-26-web-syntax-highlighting-shiki.md:14-21,33@687f282e`（一个 `ui-primitives` 单例；未来表面 import `CodeBlock` 继承高亮/主题/纯文本回退）
- `deepseek-harness/.agents/notes/archived/process/2026-07-26-web-syntax-highlighting-shiki.zh.md:14-21@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.md:12-18@687f282e`（按 `card: 'terminal'` 桥接，无需每工具代码）
- `deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.zh.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-new-session-clears-to-empty-state.md:12-18@687f282e`（一个 `InputBar` 移动位置，不互换组件）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-new-session-clears-to-empty-state.zh.md:12-18@687f282e`
- `deepseek-harness/docs/web-styling.md:14-16@687f282e`（先复用控件；ui-primitives 目录是唯一跨包通道）

<a id="ui-surface-contracts-progressive-fallback-parity"></a>

## 2. 渐进增强的降级臂必须保持几何与内容等价

### 触发条件

- 按视口相交延迟语法高亮，或按语法白名单懒加载。
- 使用 `IntersectionObserver`、`corner-shape` 等可能缺失的浏览器能力。
- 纯文本臂与增强臂共存，或全圆/胶囊与全局曲率共存。

### 前置条件

- 能明确列出“增强臂”和“降级臂”各自的 DOM/盒模型。
- 有能力检测点（`@supports`、特性检测、语法白名单）。
- 有可注入/可替换的全局对象用于测试（如 `IntersectionObserver`）。

### 步骤

1. 确定能力检测点和回退行为；缺失能力时不得报错、空白或阻塞挂载。
2. 让两臂共享源码文本、代码字体、内边距、换行规则和行高；只改变 token 颜色/字重/斜体/下划线。
3. 视口激活采用单向转换：首次相交后保持激活，离开视口不回退；共享 observer 在没有未激活块时断开。
4. 懒加载语法首帧渲染纯文本；加载完成后通过订阅/计数器触发重渲染，而不是同步等待。
5. 在 `@supports` 内应用全局能力；守卫外保持原行为；不要为不支持的引擎写第二套 fallback 代码。
6. 全圆（`50%`、`100%`、胶囊 ≥99px）在同一规则内配对 `corner-shape: round`；不要用组件级平滑覆盖全局曲线。
7. 为“缺失能力、未知语言、离开视口、重复激活、observer 释放”写测试；在真实浏览器/终端复核几何。
8. 对 assistant 可控的语言标签使用不会命中 inherited 属性的查找（源实现用 `Map`；null-prototype 是等价迁移选项，但不得用普通对象字面量）；只注入 tokenizer 生成的静态 span tree，不接受用户 HTML。

### 责任角色与完成信号

- **实现者**：提交共享排版常量、能力守卫、单向激活/懒加载订阅、清理路径。
- **评审者/验证者**：在无能力引擎、窄视口、明暗主题下目视确认无跳动/裁切/空白。
- **完成信号**：无能力时功能退化为纯文本/普通圆弧/挂载后激活；激活前后盒模型不变；测试证明离开视口不移除增强。

### 失败处理

- 激活瞬间跳动：检查两臂字体/内边距/行高是否完全一致；不要用固定像素高度掩盖。
- 未知语言报错：让高亮函数返回 undefined/纯文本，不抛异常。
- observer 泄漏：每个测试恢复全局并卸载组件；无未激活块时断开。

### 例外

- 设计明确要求的组件专用平滑曲线，需有设计批准并记录为什么不使用全局曲线。
- 不支持某能力的引擎允许功能缺席，但不得出现空白块或错误页。

### 证据限制

- 源 Note 明确说 jsdom 不测量浏览器几何；几何稳定性依赖共享样式与人工/浏览器验证。
- 本域未运行浏览器测试，不能证明当前实现仍无跳动。
- 超级椭圆的权威规则在 `docs/web-styling.md:24` 与 `docs/ui-radius.md:52-56`；本机制只保留“守卫 + 全圆退出 + 不另造平滑”的迁移要点。

### 来源

- `deepseek-harness/.agents/notes/archived/architecture/2026-08-31-viewport-activated-syntax-highlighting.md:10-20,24,40@687f282e`
- `deepseek-harness/.agents/notes/archived/architecture/2026-08-31-viewport-activated-syntax-highlighting.zh.md:10-20@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-26-web-syntax-highlighting-shiki.md:18-21@687f282e`（白名单；未知语言回退到几何一致的纯文本，绝不报错）
- `deepseek-harness/.agents/notes/archived/process/2026-07-26-web-syntax-highlighting-shiki.zh.md:18-21@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.md:16-26@687f282e`（lazy 语法首帧纯文本，加载后重渲染）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.zh.md:16-26@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-01-web-superellipse-corner-smoothing.md:10-18,32-33@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-01-web-superellipse-corner-smoothing.zh.md:10-18@687f282e`
- `deepseek-harness/docs/web-styling.md:23-24@687f282e`
- `deepseek-harness/docs/ui-radius.md:52-56@687f282e`

<a id="ui-surface-contracts-derived-view-state"></a>

## 3. 阅读模式与派生展示状态从日志/快照重算，不写回持久层

### 触发条件

- 增加折叠/隐藏模式、工具卡隐藏、按轮次聚合显示。
- 显示消息时间、日历日、耗时、token/缓存统计。
- transcript 会重建：恢复、压缩替换、resize、主题切换、流式 chunk、结算、失败撤回。

### 前置条件

- 能区分“持久事实”（事件、日志、消息内容）与“展示派生”（折叠、格式化、统计）。
- 有统一的日志重放/快照输入，而不是各组件各自保留副本。

### 步骤

1. 把阅读模式实现为展示标志或 selector，不写入 session log、`deriveMessages` 或持久化格式。
2. 在每个会改变输入的时点重算：Ctrl+O、流式 text/reasoning chunk、消息结算、失败流撤回、重建。
3. 重建时清空派生映射并重放日志，使恢复、压缩替换、resize、主题切换收敛到同一结果。
4. 时钟/日历日刷新用组件本地 tick（如下一个本地午夜），不新增全局 store 或后端事件。
5. 统计/耗时从已有快照折算（assistant `timing`、tool call/result 时间对），不为展示新增 session event 或 host 投影。
6. 为“同一日志多次重建结果一致”“派生不进入持久化”“午夜后 memo 行更新”写测试。

### 责任角色与完成信号

- **实现者**：提交派生 selector + 重算触发点 + 不写回证明。
- **评审者/会话格式所有者**：确认没有 schema/日志字段为 UI 模式服务；确认重建路径覆盖。
- **完成信号**：隐藏/折叠、时钟、统计都能从同一输入重算；日志保持原形状；无新增持久化字段。

### 失败处理

- 发现展示状态进入日志/schema：回退为派生，并在同一变更修正读取方。
- 重建后不一致：以重放日志为唯一输入，清除残留映射；不要在组件间传递折叠结果。
- 统计与窗口不符：补范围说明或改用全量数据源，见机制 4。

### 例外

- 真正需要持久的用户偏好（显式配置、主题选择）不是派生状态。
- 服务端已经提供的权威时间/计数可直接消费，但仍需标注窗口。

### 证据限制

- 源 TUI 在固定提交时已被移除；本机制作为通用派生状态规则保留，TUI 细节需在目标表面重验。
- 本域未读 session log/schema 实现，不能证明当前代码没有展示字段。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.md:10-14,20-22,26@687f282e`（fold 是重算状态、从不存储；日志保持 step-shaped；重建清空映射重放）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.zh.md:10-14,26@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.md:10-18,36@687f282e`（`useCalendarDay` 组件本地日 tick）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.zh.md:10-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.md:16-20,34@687f282e`（`StatsLine` 从快照客户端派生；不新增事件/投影）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.zh.md:16-20@687f282e`

<a id="ui-surface-contracts-temporal-truthfulness"></a>

## 4. 时间、耗时与窗口计数必须说明测量范围

### 触发条件

- 消息气泡/assistant 消息显示时钟或步骤耗时。
- 页脚/ composer 显示 turns、steps、LLM/工具耗时、token、缓存命中。
- 读取/输出窗口化，需显示“第几行到第几行/共多少”。

### 前置条件

- 有稳定的时间源（事件时间、`stepStartTime`、`completedTime`）。
- 有窗口/分页的真实边界（已加载事件窗口、读取窗口）。
- 有可测试的格式化函数。

### 步骤

1. 把身份标签（`Assistant`/`You`）置顶；把计时等测量元数据放在被测内容之后；不要改变计时内容、桶隐藏或完成时间语义。
2. 定义时钟加宽规则：同一日历日 `HH:mm`；同年更早 `M月D日 HH:mm`；跨年 `YYYY年M月D日 HH:mm`；用户与 assistant 共用同一规则。
3. 用本地日 tick 在下一个本地午夜重格式化 memo 行；不要依赖消息 mutation 或一次性 `Date.now()`。
4. 统计只覆盖已加载事件窗口时，必须在 README/提示中声明“窗口内”，不能暗示全量。
5. 窗口化内容显示计数/范围（`showing N of M`、`lines A-B/N`、`↑ N more`），并保留展开/分页入口。
6. 只在已结算、非流式、有非空文本内容的消息上挂动作/时钟 chrome；Think-only、轮次中间叙述、流式尾部不挂。
7. 用快照/spec 固定每种时钟形态、午夜加宽、内容门控、窗口计数。

### 责任角色与完成信号

- **实现者**：提交格式化函数、日 tick、挂载门控、范围文案。
- **评审者/文档所有者**：确认限制写进 README/文档；确认没有把部分窗口说成全量。
- **完成信号**：时间随日历距离加宽并在午夜刷新；耗时贴近被测内容；窗口计数可见；流式期间不闪 chrome。

### 失败处理

- 昨日消息仍显示 `HH:mm`：检查 memo 行是否订阅日 tick，而不是只在 mount 时格式化。
- 统计误导：补“仅已加载窗口”说明，或改用全量数据源。
- 计时被埋：把测量移到消息尾部，但保留身份标签在顶部。

### 例外

- 纯装饰性时间、显式全量统计可省略范围说明。
- 不同 locale 的日期单位需参数化，不能把 `M月D日` 硬编码到非中文界面。

### 证据限制

- 源 Note 的时钟格式含中文日期单位；迁移时必须按目标 locale 改写。
- 本域未执行跨午夜/时区边界测试；源 Note 只有组件测试声明。
- 源 TUI 已移除；assistant 计时行位置规则作为通用排版语义保留。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-07-27-assistant-timing-header-trailing.md:10-16,26@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-27-assistant-timing-header-trailing.zh.md:10-16,26@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.md:10-18,36@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.zh.md:10-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.md:16-20,34@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.zh.md:16-20@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.md:14-26,44@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.zh.md:14-26@687f282e`

<a id="ui-surface-contracts-single-focus-ownership"></a>

## 5. 指针与键盘共享唯一高亮，动作 chrome 不得只靠 hover 发现

### 触发条件

- 自定义下拉/触发菜单、命令面板、引用选择器。
- 新增消息操作栏、图标动作、行内工具条。
- 键盘方向键与鼠标同时可能移动高亮。

### 前置条件

- 有一个 reducer/状态持有“当前高亮项”。
- 列表容器支持 `aria-activedescendant` 或等价的焦点管理。
- 能访问真实指针事件（`mousemove`）而不是只靠 CSS。

### 步骤

1. 找出所有高亮来源：CSS `:hover`、组件 state、DOM focus、父级 hover selector。
2. 收敛到单一 reducer/state；让视觉高亮与 `aria-activedescendant` 指向同一项。
3. 指针移动通过 `mousemove`（不是 `mouseenter`）路由到同一 state；对已高亮项 no-op，避免 mousemove 风暴。
4. 删除与共享高亮冲突的 CSS `:hover` tint；不要保留两套焦点外观。
5. 动作 chrome 一旦挂载就保持可见/可发现；不要用 opacity/hover-only 揭示。
6. 候选 kind 的图标必须来自封闭的 `InputTriggerCandidateIcon` 联合并选一个图标，不能传任意字符串或字形。
7. 键盘提示（Tab keycap、快捷键说明）只在对应行持有高亮时显示，避免空闲行噪音。
8. 保留可见焦点环与 reduced-motion 行为；裁切容器不得裁掉外部焦点环。
9. 用组件 spec 固定键盘循环、鼠标移动、混合输入；用 aria golden 固定组装后的可访问名称/状态；在明暗主题和窄视口目视复核。

### 责任角色与完成信号

- **实现者**：提交单一高亮 state、指针路由、删除冲突 CSS、按高亮显示的提示。
- **评审者/可访问性检查者**：确认 `aria-activedescendant` 唯一、焦点可见、提示不噪音。
- **完成信号**：任一时刻只有一行看起来被选中；Enter/Tab 作用于该行；鼠标移动不抢走键盘刚移动的高亮。

### 失败处理

- 两行同时高亮：删除 CSS 来源，或让 CSS 只反映 reducer 状态。
- 键盘滚动后高亮被抢：把 `mouseenter` 改为 `mousemove`。
- 提示噪音：只在拥有共享高亮的行显示 keycap/caption。

### 例外

- 原生 `<select>`、系统菜单保留平台行为，不强行接管。
- 移动端无 hover 时以 tap/focus 为准；不要用 hover-only 作为唯一入口。

### 证据限制

- 本域未读到自动可访问性门禁；源 Note 只声明 aria golden 与组件 spec，主要靠评审/人工验证。
- 本域未运行屏幕阅读器或真实键盘遍历。
- `docs/web-styling.md:23` 只规定“保留焦点可见与 reduced-motion”，不提供自动检查。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.md:10-22,26-30,36@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.zh.md:10-22,36@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.md:20-28@687f282e`（拒绝 hover-reveal：行一旦存在就应保持可发现）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.zh.md:20-28@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.md:14-26,44@687f282e`（`aria-expanded` 切换）
- `deepseek-harness/docs/web-styling.md:23@687f282e`

<a id="ui-surface-contracts-bounded-panel-reachability"></a>

## 6. 宽高受限的交互面板必须让决策内容、校验与控件保持可达

### 触发条件

- 问题/确认/计划评审面板出现在终端或窄视口。
- 读取卡、终端卡、长输出需要高度上限。
- 选项、描述、校验信息可能超过面板预算。

### 前置条件

- 有明确的宽度/高度配置（`questionDialogWidth`、`questionDialogMaxHeight`、`maxQuestionOptions`、高度上限）。
- 有选中的选项/行，且必须保持可见。
- 有编辑器/输入框，且必须在面板下方保留。

### 步骤

1. 列出必须可见的语义区域：问题/详情、选项标签、描述、校验、控件、选中项、选项省略标记。
2. 先为编辑器/输入保留空间，再按当前视口钳制面板高度；resize 时编辑器仍位于面板下方。
3. 内容超限用换行、分页或展开，不用静默省略；显示 `↑ N more`/`↓ N more`、`lines A-B/N`、`showing N of M`。
4. 选项行预算先扣除内边距、头部、位置行、页脚；窗口同时遵守数量上限和剩余行预算，保持选中项可见。
5. Page Up/Page Down 覆盖所有语义区域；向前先翻完 header/detail 再进入超大选中项，向后反向。
6. 固定 chrome 不足时压缩头部/转为分页器，而不是隐藏控件或校验。
7. `↑ N lines hidden` 这类整体隐藏只在低于配置最小值、无法容纳语义布局时作为最后回退，并保留输入控件/编辑器。
8. 高度上限与头/尾展开算法在同类卡片间沿用同一实现或同一算法（源实现中 `ReadBlock` 从 `TerminalBlock` 照抄），避免同一处折叠不同。

### 责任角色与完成信号

- **实现者**：提交预算计算、分页/标记、选中项保持、编辑器预留。
- **评审者**：在窄/矮视口检查所有区域可达；确认没有静默丢失。
- **完成信号**：任何配置范围内，选项标记、校验、控件、选中内容都能通过换行/分页到达；编辑器仍在。

### 失败处理

- 内容丢失：改为换行/分页；不要只加省略号。
- 控件被遮：压缩头部/chrome，或把面板转为分页器。
- 极端矮视口：显示显式 hidden 标记并保留输入/编辑器；记录为已知限制。

### 例外

- 单行不可分内容（前缀、编号）允许省略号作为安全边界。
- 低于配置最小值的极端视口允许折叠上部 transcript 行，但必须显示 hidden 标记。

### 证据限制

- 源 TUI 已移除；终端几何需在目标表面重验。
- 本域未读 `windowBlocks`/`InlineModalComponent` 实现，只读 Note。
- 语义快照能固定组装布局，但不能证明真实字体度量下每个视口都可读。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-question-dialog-multiline.md:10-23,38-41@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-question-dialog-multiline.zh.md:10-23,38-41@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.md:14-26,44@687f282e`（高度上限、`aria-expanded`、窗口计数、空窗口隐藏 copy）
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-read-card-frontend.zh.md:14-26@687f282e`

<a id="ui-surface-contracts-feedback-taxonomy"></a>

## 7. 反馈分类由单一所有者定义、写入校验，客户端重述必须编译期完备

### 触发条件

- 新增/修改反馈分类、反馈弹窗、消息评分或 Session 备注。
- 客户端需要展示/提交 Host 拥有的分类。
- 发布/回放旧载荷，或客户端 bundle 与 Host 分离。

### 前置条件

- 有一个客户端安全的类型导出（`./types`）。
- Host 事件/schema 能携带可选 `category`。
- 有词典/文案与发布载荷清单。

### 步骤

1. 由单一包拥有分类联合与元组（`FeedbackCategory`、`FEEDBACK_CATEGORIES`）；事件载荷 `{text?, category?}` 允许空文本/仅分类。
2. Host 按元组校验已存值；分类变化算实质编辑。
3. 客户端 bundle 不得从 Host 包做值导入；用 `Record<FeedbackCategory, true>` 重述分类，键序=chip 序，编译器检查完备。
4. 路由消息目标与 Session 目标到同一事件生产方（`recordFeedback` / `sessionFeedback.record`），不复制事件形状。
5. 打开/关闭表单不写反馈事件；提交才写一条；空白文本记为缺省。
6. 日志随每个反馈事件投递且不可选；反馈内容不进入模型上下文/遥测。
7. 不要用自由文本前缀编码分类；不要在客户端另造第二张分类表。
8. 更新词典、goldens、冻结载荷清单；旧代际载荷不能携带新成员时按版本化恢复处理。

### 责任角色与完成信号

- **反馈包所有者**：定义分类、事件载荷、校验。
- **UI 实现者**：重述分类、路由、弹窗/菜单入口、提交行为。
- **发布所有者**：冻结载荷清单与旧代际兼容。
- **完成信号**：编译器在分类缺失时失败；打开/关闭无事件；提交一条；日志投递不可选；模型上下文/遥测无反馈内容。

### 失败处理

- 分类漂移：改所有者与重述表，不在两处各加一项。
- 旧载荷不兼容：按版本化恢复/已安装词汇处理，并在清单记录。
- 反馈插件未加载：入口消失，导出/其他菜单仍可用。

### 例外

- 冻结的旧代际载荷只有 `text`；同版本恢复使用已安装词汇。
- 反馈日志的“内容”是授权投递本身；空文本/仅分类仍可记录。

### 证据限制

- 源 Note 的隐私声明是“sidecar 不进入 Session log、模型上下文、telemetry”；本域未做运行时遥测验证。
- 本域未读 Host 校验实现与载荷迁移代码。
- 客户端完备性由编译器检查；服务端所有写入路径是否都校验，Note 未完全证明。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-09-08-feedback-dialog-and-categories.md:10-22,38@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-08-feedback-dialog-and-categories.zh.md:10-22,38@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.md:46-54@687f282e`（反馈对模型不可见；不进入 Session log/模型上下文/telemetry）
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.zh.md:46-54@687f282e`

<a id="ui-surface-contracts-feedback-target-cas"></a>

## 8. 反馈目标身份可选且不可伪造，逐条版本冲突从回复收敛

### 触发条件

- 消息级评分/备注需要指向具体 `MessageId`。
- 多个标签页/并发编辑可能竞争同一反馈条目。
- 重连/reset、可选反馈插件、延迟加载列表。

### 前置条件

- Host 接受 append-origin `assistant/message`，按 `MessageId` 寻址。
- 客户端节点有稳定的 turn/step 身份，但不能把消息身份塞进 `id`。
- 有 per-item 版本字段（`ifVersion`）与冲突回复形状。

### 步骤

1. 给 `AssistantMessageNode` 加**可选** `messageId`，只在 finalized `assistant/message` 物化时复制；中断 partials 与合成 sentinel 保持缺失，使无效目标不可表示。
2. 声明 `conversation.chat.assistant-actions`（list、session scope、owner `{messageId}`）；`messageId` 缺失时渲染点整体跳过。
3. 反馈包只贡献 slot entry，不 import conversation 实现；插件从组装中移除时该条渲染为空，不影响其他动作。
4. 每个 Session 一个 controller，按 `MessageId` 存条目；mutation 带最后观察到的 `ifVersion`（未知为 null）。
5. 冲突回复携带权威 `current`（或 null）；`current:null` 删除本地条目；mutation 在 per-Session 尾部串行。
6. list 延迟到首次 hover/focus；`connection/reset` 只刷新非 cold Session。
7. 再次点击已记录评分=delete；切换=put 并携带备注；清除未知条目=无调用成功。
8. 为缺失身份、冲突、重连、双标签页写测试；E2E 记录“重载后先 hover 再断言恢复”的延迟读取顺序。

### 责任角色与完成信号

- **客户端状态所有者**：节点身份、controller、CAS、序列化。
- **反馈包所有者**：slot entry、dialog/toggle 行为。
- **完成信号**：未完成消息不显示控件；冲突后本地状态与回复 `current` 一致；双标签页删除能收敛；重连不预热 cold Session。

### 失败处理

- 目标身份缺失却渲染控件：在渲染点跳过 slot，而不是用占位 id。
- 冲突时全量刷新：改为用回复 `current` 收敛；`current:null` 删除本地条目。
- 并发覆盖：把 mutation 串行到 per-Session tail，按已提交版本比较。

### 例外

- sidecar 不发布 live frame，第二标签页在重连/冲突时更新；不要声称实时同步。
- 备注长度不在输入时预校验；保存失败用 `note-too-large` 并保留草稿。

### 证据限制

- 源 Note 明确 sidecar 无 live frames；本域未执行多标签页实时同步。
- 未读 controller 实现；只读 Note。
- `AssistantMessageNode` 有两个并行物化点，第三个视图可能忘记复制 id，且“没有机制强制”。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.md:14-34,46-54,58@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.zh.md:14-34,46-54@687f282e`

<a id="ui-surface-contracts-shell-presentation-parity"></a>

## 9. 可互换 shell 工具必须共享解析并呈现为同一种卡片

### 触发条件

- 新增/对齐 bash、pwsh 或其他行为可互换的 shell 工具。
- 跨平台默认 shell 切换。
- 新增 `card` 标签消费方或工具分类行。

### 前置条件

- 两个工具已共享执行语义、marker、后台任务契约。
- 有一个两个工具都已依赖的 Service Definition 包可放共享解析。
- 客户端有按 `card` 标签桥接的卡片模型。

### 步骤

1. 列出孪生工具的执行/呈现差异；先对齐行为，再对齐人类可见呈现。
2. 把 `parseExitStatus`/`ParsedExitStatus` 抽到共享 Service Definition 包，并让两个工具都从该包复用；不得从兄弟工具私有模块 import（构建后是硬依赖）。
3. 让孪生 `presentResult` 逐调用镜像：完成前台=terminal 卡（去 marker 文本 + 解析 exitCode/signal）；后台 ack 与 `isError` 保持 generic console；非单一文本块不改。
4. 客户端按 `card: 'terminal'` 标签桥接，不为每个工具写 UI；必要时只加分类行（如 `classifyTool('pwsh')` → shell family，`Pwsh` 标题）。
5. 跑双边 presenter 套件：干净/非零/信号/超时往返、marker-like 输出、后台/错误通用卡片、多块回退。
6. 跑 keyless 浏览器 e2e：预置会话，api-proxy 从日志 args/result 重算视图，钉住 terminal 卡 golden（exit pill、run-state dot、红色失败）。

### 责任角色与完成信号

- **工具所有者**：共享解析、presenter 对齐。
- **客户端呈现所有者**：card 桥接、分类行。
- **完成信号**：两个工具的完成前台调用在 UI 中结构一致；解析/marker 只有一份实现；e2e golden 覆盖。

### 失败处理

- 呈现漂移：先统一解析实现；若不能共享，记录为兼容缺口，不复制第三份。
- 兄弟依赖：把共享函数移到共同依赖包，而不是 import 兄弟源码。
- Windows 默认组合未交付：作为独立 roadmap 缺口跟踪，不宣称完成。

### 例外

- 只有行为不同、没有共同结果语义的工具不适用。
- 后台 ack 与 error 明确保持 generic，不要强行 terminal 卡。

### 证据限制

- 源 Note 明确 Windows 默认组合（stage 1）仍未完成；阶段 2 的 TUI 已移除。
- 本域未读 presenter 实现，只读 Note。
- 未运行任何 e2e 或覆盖率门禁。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.md:10-18,30-32@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.zh.md:10-18,30-32@687f282e`

<a id="ui-surface-contracts-prompt-registry-trust"></a>

## 10. 插件提示符值用存储字符串 + 合并通知，并明确 ANSI 信任边界

### 触发条件

- 插件向终端提示符/状态行贡献可变片段（Powerline、模型、cwd、git、token、队列、指示符）。
- 主题允许替换输入前缀或占位符。
- 需要在不求值插件回调的情况下重绘。

### 前置条件

- 有上下文全局注册表服务。
- 渲染器能读取当前值并订阅变更。
- 有可见宽度工具处理 ANSI。

### 步骤

1. 注册表存字符串而非回调；`set` 显式更新，未变化忽略；一次注册/变更/dispose 合并一次通知。
2. 渲染器 `get` + `subscribe`；订阅是服务内直接回调，不走全局事件；订阅与注册由调用方 Cordis effect 拥有，dispose 时移除。
3. 拒绝重名；通知容错每个观察者（同步 throw、rejected promise、字符串渲染错误），派发中重新校验存活。
4. 只有注册的提示符插件片段可携带 ANSI/终端控制；模板字面量与普通外部内容仍清洗。
5. 宽度计算使用 ANSI-aware 可见宽度；未知/不可用值连同相邻分隔空白消失。
6. 替换输入前缀保持编辑器文本、光标、历史、补全、焦点；前缀等宽。
7. 为注册/更新/dispose/重名/容错/ANSI/前缀替换写测试；部署方负责组装后的加载顺序验收。

### 责任角色与完成信号

- **终端 UI 所有者**：注册表 API、通知、渲染订阅。
- **插件作者**：只通过注册表贡献字符串，遵守 ANSI 契约。
- **安全/评审者**：确认信任边界与清洗范围。
- **完成信号**：值变化触发一次合并重绘；卸载后订阅/值消失；普通外部内容不被当作 ANSI；Powerline 片段可组合。

### 失败处理

- 布局被 ANSI 破坏：限制为受支持序列或退回纯文本；记录信任决策。
- 观察者饥饿：检查通知容错与 liveness 重新校验。
- 加载顺序问题：由部署方验收，不在注册表内猜。

### 例外

- 任意 ANSI 是有意信任决策；不支持的光标序列可破坏布局，只有 pi-tui 可见宽度工具理解的序列能保证对齐。
- 源 TUI 包在固定提交时已移除；迁移前必须重验目标表面，不能把 TUI 结论直接当现行实现。

### 证据限制

- 本机制只保留 Note 的设计/信任语义；未验证任意 ANSI 的实际布局行为。
- 未读注册表实现；只读 Note。
- TUI 已 EOL，属于“重启条件”而非当前自动保证。

### 来源

- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.md:10-20,34,40@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.zh.md:10-20,34,40@687f282e`

## 11. 39 份正文的处置总览

下表按英文正文列出；每个 `.zh.md` 对侧文件使用相同范围、相同处置，作为独立正文记录（不是“翻译注记”替代）。`README.zh.md` 单独列出。

| 正文 | 处置 | 机制 | 理由（来自正文） |
|---|---|---|---|
| `archived/architecture/2026-08-31-viewport-activated-syntax-highlighting.md` | governance | 2 | 单向视口激活、共享 observer、纯文本/高亮臂同排版、无 IntersectionObserver 回退；测试还要求恢复全局。 |
| `archived/architecture/2026-09-18-agent-teams-single-bundle.md` | governance | 外部记录：`rationale-architecture-1`（无正式 mechanism id） | 正文含可迁移的组合/加载器义务：单一可选 bundle、保留 per-row id、通用 loader/presenter 不感知 feature 包名、明示 saved profile 选择已移除 bundle 时启动失败且无自动迁移。它不是 UI 表面机制，本域记 `reviewedNoMechanism` 并交叉引用 owner。 |
| `archived/feature/2026-07-20-tui-startup-slogans.md` | non-governance | — | 启动文案与动画的产品决策；TUI 在固定提交前已移除；残留的 ASCII/生命周期细节只服务于该已移除表面，不构成当前可迁移义务。 |
| `archived/feature/2026-07-21-tui-no-banner.md` | non-governance | — | 纯 TUI 启动呈现选择；该 Note 本身取代了 banner sweep，随后 TUI 移除；没有跨表面维护者规则。 |
| `archived/feature/2026-07-24-configurable-tui-prompt-theme.md` | governance | 10 | 注册表字符串/合并通知/effect 所有权/重名拒绝/ANSI 信任边界/前缀替换保持编辑器状态；虽 TUI 已移除，仍保留重启条件。 |
| `archived/feature/2026-07-24-new-session-clears-to-empty-state.md` | governance | 1 | 除了产品状态行为，正文明确“一个 InputBar 移动位置而非互换组件”，是可迁移的共享呈现规则。 |
| `archived/feature/2026-07-24-tui-question-dialog-multiline.md` | governance | 6 | 宽高预算、分页顺序、选项标记、编辑器预留、hidden-line 最后回退；属于受限面板可达性规则。 |
| `archived/feature/2026-07-27-assistant-timing-header-trailing.md` | governance | 4 | 身份标签置顶、计时尾随被测内容；计时内容/桶隐藏不变。 |
| `archived/feature/2026-07-27-tui-tool-card-header.md` | non-governance | — | 正文明确 `Tool / <name>` 形态是 TUI 局部、不是任何跨包契约，其他桥保留各自呈现；TUI 已移除。 |
| `archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.md` | governance | 3 | 折叠是重算展示状态、从不存储；日志保持 step-shaped；重建重放收敛。 |
| `archived/feature/2026-07-29-web-message-icon-actions-and-clock.md` | governance | 3,4,5 | 日 tick/时钟加宽、结算门控、拒绝 hover-only chrome；都是可迁移的展示/可访问性规则。 |
| `archived/feature/2026-07-30-web-composer-stats-and-input-polish.md` | governance | 3,4 | 统计从快照客户端派生、不新增后端字段；窗口限制必须声明；固定节奏/实时高度是布局细节。 |
| `archived/feature/2026-07-30-web-read-card-frontend.md` | governance | 1,2,4,6 | 唯一 model、第二 primitive、lazy 纯文本首帧、高度上限/计数/aria-expanded、空窗口隐藏 copy。 |
| `archived/feature/2026-08-05-pwsh-ui-bash-parity.md` | governance | 9 | 孪生 presenter 镜像、共享解析、按 card 标签桥接、分类行、双边测试与 e2e。 |
| `archived/feature/2026-08-11-message-feedback-web-surface.md` | governance | 7,8 | 可选 messageId 使无效目标不可表示、slot 跳过、per-item CAS、冲突回复收敛、延迟 list、隐私边界。 |
| `archived/feature/2026-08-26-web-trigger-menu-presentation-polish.md` | governance | 5 | 单一高亮/last input wins、mousemove、aria-activedescendant、删除 CSS hover、按高亮显示提示。 |
| `archived/feature/2026-09-01-web-superellipse-corner-smoothing.md` | governance | 2 | `@supports` 守卫、非继承属性的通用选择器、全圆配对 `corner-shape: round`、由样式扫描 spec 强制；中央规则见 docs。 |
| `archived/feature/2026-09-08-feedback-dialog-and-categories.md` | governance | 7 | 分类单一所有者、Host 元组校验、客户端编译期完备重述、打开/关闭不写、提交一条、日志不可选。 |
| `archived/process/2026-07-26-web-syntax-highlighting-shiki.md` | governance | 1,2 | 一个 singleton/一个代码表面、白名单纯文本回退、Map 别名避免原型碰撞、工具输出不猜语法、CSS 变量主题。 |
| `.agents/notes/README.zh.md` | governance | 外部：`counterpart-residual` 的 `decisions-*` Note 生命周期机制（`documentation-agent-note-*` 规则以 README.md 为正本） | 这是 Agent Note 生命周期/格式/归档规则的中文正文；机制属于 decisions/documentation 域，本域只记录并交叉引用，不另造 UI 机制。 |

### 11.1 非治理判定与跨域治理的说明

- 判定依据是正文内容，不是目录名。`archived/feature/` 下的多份 Note 仍可含可迁移规则；`archived/architecture/` 下的单包组合也可只是打包决策。
- 非治理不等于“无价值”：它们是产品决策、历史依据或被后续决策取代的呈现选择。保留其适用性与重启条件，但不把它们写成维护者必须执行的跨项目规则。
- 对 `agent-teams-single-bundle`，正文的 UI 陈述（Host 入口惰性、浏览器入口只在 Web Client 挂载、headless 不启动 Web 服务）不是表面呈现契约；但正文另有两个可迁移的打包/加载器义务，因此本域记录为 governance（`reviewedNoMechanism`），由 `rationale-architecture-1` 记录可迁移点（source-disposition 中该正文没有正式 mechanism id），而不是把它判为纯产品决策。
- 对 `tui-tool-card-header`，正文自己声明形态是 TUI 局部、不是跨包契约；把它提升为跨包规则会与源意图冲突。
- 对两份启动 Note，TUI 已在固定提交前移除；`no-banner` 自己取代了 banner sweep，`startup-slogans` 的文案/动画只服务于该已移除表面。它们没有当前可执行的 UI 义务。

## 12. 未决、交叉域与证据限制

### 12.1 交叉域分类冲突（需要父级/其他域处理）

本域按正文把 3 组英文/中文 Note（6 个正文）判为 `non-governance`。当前 `source-disposition` 把这 6 个正文合并为 `unclassified`；integration03 的粗分类回退此前又曾把它们读成 `governance`。两种表现来源相同：`rationale-feature-3` 的原始处置明确说它们是 product-only / UI 细节，并给了 `reviewedNoMechanism: true`，但自由文本 disposition 不是完成类，也没有显式 `classification` 字段。按正文语义，那些自由文本与本域判定一致（都是“仅产品决策”）；差异只来自缺少显式分类，不是语义分歧。需要把对应 rationale 记录的处置规范化为 `non-governance`（或补 `classification: "non-governance"`），同时保留原自由文本。涉及：

- `2026-07-20-tui-startup-slogans.md` / `.zh.md`（`rationale-feature-3`）
- `2026-07-21-tui-no-banner.md` / `.zh.md`（`rationale-feature-3`）
- `2026-07-27-tui-tool-card-header.md` / `.zh.md`（`rationale-feature-3`）

`2026-09-18-agent-teams-single-bundle.md` 不再列为冲突：本域与 `rationale-architecture-1` 都按正文判为 governance，只是本域不为它建 UI 机制。

其余 33 个正文判为 `governance`，与既有 rationale 自由文本的粗分类兼容。

### 12.2 未决问题

- **docs 的完整机制归属**：本域完整阅读了 `docs/ui-radius.md` 与 `docs/web-styling.md`，但只在机制 1、2、5 中引用“复用控件/焦点”“降级/全圆退出”等段落；两份文档的 token/尺度/菜单/elevation 等完整规则仍由中央文档与文档域拥有。若集成要求单一所有者，可把这两份文档的覆盖记录迁给文档域。
- **TUI 表面移除**：`configurable-tui-prompt-theme`、`tui-question-dialog-multiline`、`assistant-timing-header-trailing`、`tui-hidden-mode-assistant-fold` 的源表面在固定提交时已不存在。机制按“重启条件/设计先例”保留；迁移到新终端表面时必须重新验证几何、ANSI 与生命周期。全部十个 knowledge 记录的 `applicability` 现均带归档 Note（`history`）与条件性迁移 provenance；Web 条目是历史经验而非现行产品政策，同样须在目标实现重验。
- **未读实现**：本域只读 Note 与中央文档，未读 `read-card-model.ts`、`ReadBlock`、`windowBlocks`、`MessageFeedbackController`、presenter 实现或测试文件。所有“测试固定”都是源 Note 的声明，不是本域的运行结果。
- **未执行**：没有构建、测试、lint、格式化、安装或网络操作；所有验证证据标为 planned。

### 12.3 证据限制

- 行号来自固定提交的实际正文。本域对 24 个 display-width >768 的行逐一用 `:raw` 重读（另有 20 个较短的关键中文行也用 `:raw` 核验；具体行号见 coverage 的 `rawReread`），并据此补入 Map/null-prototype 查找与封闭图标联合义务；不能从行号或 hash 推导语义正确性。
- Note 的“Testing”章节描述测试存在，但本域没有运行它们；不能把测试声明当作通过证据。
- 浏览器几何、真实终端字体度量、屏幕阅读器体验、跨午夜时区边界、多标签页实时同步都未被本域验证。
- `docs/ui-radius.md` 与 `docs/web-styling.md` 的权威性来自其正文；本域没有重新审计它们的 token 值与全部组件映射。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `ui-surface-contracts-single-render-derivation`：`deepseek-harness/.agents/notes/archived/process/2026-07-26-web-syntax-highlighting-shiki.md:14-21@687f282e`、`deepseek-harness/docs/web-styling.zh.md:14-16@687f282e`
- `ui-surface-contracts-progressive-fallback-parity`：`deepseek-harness/.agents/notes/archived/architecture/2026-08-31-viewport-activated-syntax-highlighting.md:10-20@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-01-web-superellipse-corner-smoothing.md:10-18@687f282e`、`deepseek-harness/docs/web-styling.zh.md:23-24@687f282e`、`deepseek-harness/docs/ui-radius.zh.md:52-56@687f282e`
- `ui-surface-contracts-derived-view-state`：`deepseek-harness/.agents/notes/archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.md:10-14@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.zh.md:10-14@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.md:20-26@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-29-tui-hidden-mode-assistant-fold.zh.md:20-26@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-29-web-message-icon-actions-and-clock.md:10-18@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.md:16-20@687f282e`
- `ui-surface-contracts-temporal-truthfulness`：`deepseek-harness/.agents/notes/archived/feature/2026-07-27-assistant-timing-header-trailing.md:10-16@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-27-assistant-timing-header-trailing.zh.md:10-16@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.md:34-34@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-composer-stats-and-input-polish.zh.md:34-34@687f282e`
- `ui-surface-contracts-single-focus-ownership`：`deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.md:10-22@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.zh.md:10-22@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.md:26-30@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.zh.md:26-30@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-26-web-trigger-menu-presentation-polish.md:36-36@687f282e`
- `ui-surface-contracts-bounded-panel-reachability`：`deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-question-dialog-multiline.md:10-23@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-question-dialog-multiline.zh.md:10-23@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-question-dialog-multiline.md:38-41@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-tui-question-dialog-multiline.zh.md:38-41@687f282e`
- `ui-surface-contracts-feedback-taxonomy`：`deepseek-harness/.agents/notes/archived/feature/2026-09-08-feedback-dialog-and-categories.md:10-22@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-08-feedback-dialog-and-categories.zh.md:10-22@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-08-feedback-dialog-and-categories.md:38-38@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-09-08-feedback-dialog-and-categories.zh.md:38-38@687f282e`
- `ui-surface-contracts-feedback-target-cas`：`deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.md:14-34@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.zh.md:14-34@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.md:58-58@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-11-message-feedback-web-surface.zh.md:58-58@687f282e`
- `ui-surface-contracts-shell-presentation-parity`：`deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.md:10-18@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.zh.md:10-18@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.md:30-32@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-08-05-pwsh-ui-bash-parity.zh.md:30-32@687f282e`
- `ui-surface-contracts-prompt-registry-trust`：`deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.md:10-20@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.zh.md:10-20@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.md:34-34@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.zh.md:34-34@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.md:40-40@687f282e`、`deepseek-harness/.agents/notes/archived/feature/2026-07-24-configurable-tui-prompt-theme.zh.md:40-40@687f282e`
