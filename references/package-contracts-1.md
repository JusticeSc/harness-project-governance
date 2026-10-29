# package-contracts-1：包合同、双语配对、组合与模型面的迁移参考

本参考面向要把 DeepSeek Harness 的“包合同”实践迁移到自己仓库的维护者。它覆盖 `apps/desktop`、`native/` 与 `packages/**` 下 52 个有中文对照的英文 README、对应的 `.i18n.yaml` 记录，以及 `vendor/group/README.md`（第三方、无中文页与配对记录，共 53 个英文页）。所有源事实都绑定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`。

阅读约定：

- **【源义务】** 是 README 明确要求作者/部署者遵守的规则；即使只由评审执行，也仍是义务。
- **【源实现事实】** 是 README 描述的运行时行为，用来判断义务是否可自动执行。
- **【迁移设计】** 是本参考给出的落地做法，不是源仓库已有实现。
- **【额外建议】** 是可选增强，采用时需要自行验证。

本域的自动执行证据仅限 README 自述；作者没有运行配对脚本、构建、测试或任何 profile。凡标“未验证”的，不要当作通过。

---

<a id="package-contracts-1.readme-as-package-contract"></a>

## 1. 包 README 即包合同

### 触发条件

新增包、拆分/合并 bundle、修改公开行为/配置/工具 schema/限制，或评审要求说明“何时不该使用”。

### 【源义务】

每个包 README 的 front matter 至少包含：

```yaml
---
description: "一句话职责与边界。"
kind: "package-reference"   # package-reference | package-bundle | package-group | package-library
---
```

`kind` 在源仓库中对应四种文档形态：可挂载插件/服务用 `package-reference`，可启动 profile 用 `package-bundle`，只做导航用 `package-group`，纯库用 `package-library`。正文的固定信息顺序是：

1. 标题行与英中互链；
2. `## Summary`：职责 + 边界/不适用；
3. `## Table of Contents`；
4. `## Use this package`：何时选/不选、最小 YAML、配置表；
5. `## Understand the implementation`：可折叠的内部说明与 source map；
6. `## Further Exploration`：指向子系统参考/决策记录；
7. `## Model Experience`：模型看到什么、token、KV cache；
8. `## Known Limitations and Deferred Work`；
9. `### Dev Note`：折叠且非权威。

组 README 只做包地图。`packages/context/README.md` 明确“本页概述本组；包级约定由各包 README 负责”，并在表中给出角色与 ctx key。`packages/deliverables/README.md`、`packages/document/README.md`、`packages/sdk/README.md`、`packages/spill/README.md` 采用同一形态。

证据：`deepseek-harness/packages/attachment/attachment-local/README.md:1-152@687f282e`（front matter、Summary、配置表、Model Experience、Known Limitations 的完整顺序）；`deepseek-harness/packages/context/README.md:1-54@687f282e`（组页职责边界）；`deepseek-harness/native/README.md:1-11@687f282e`（跨包所有权与发布边界的短文档示例）。

### 【迁移设计】

1. 为四种 `kind` 各建模板，模板只放标题骨架与必填提示，不预填虚假内容。
2. 摘要强制两句：第一句职责，第二句边界（“不做什么/不适合谁”）。
3. 配置表只列常用字段，并写“生成配置目录是穷尽来源”。
4. `Model Experience` 即使为 None 也要写，并说明为什么没有模型面。
5. 每个标题加 `{#stable-anchor}` 或英文 slug，供目录、`reference` 与中文页复用。
6. 组 README 只保留“包 → 角色 → ctx key”表和成员链接。

### 完成信号

读者仅凭摘要与 Use this package 就能判断是否该挂载、需要哪些服务、有哪些限制；组页没有复制成员细节；所有标题都有锚点。

### 失败处理

- 缺少边界/限制：退回补写，不以“功能已实现”替代。
- 组页复述成员配置：删除并改为链接。
- `kind` 选错：先改元数据再改正文结构。

### 例外

`vendor/group/README.md:1-21@687f282e` 是第三方 `@cordisjs/plugin-group` 的用法说明，没有 front matter、没有中文页；它不承担本仓库包合同。其余 52 个英文 README 均带 `description`/`kind`（两个 Desktop 测试 README 只有 `description`，属于操作文档而非包合同，但同样有双语配对）。

### 证据限制

章节集合是惯例，不是单一自动 schema；本域未对 53 个文件逐项跑“章节齐全”检查。

---

<a id="package-contracts-1.bilingual-pair-and-sidecar"></a>

## 2. 双语配对与 `.i18n.yaml` 逐标题哈希

### 触发条件

改动任一 `README.md` / `README.zh.md` 的正文或标题；新增页面；中文页新增指向 `.zh.md` 的链接。

### 【源义务】

1. 每个英文页有中文页，首行互链：
   - 英文：`English | [中文](README.zh.md)`
   - 中文：`[English](README.md) | 中文`
2. 每个配对有 `README.i18n.yaml`，头部说明它是“逐标题一致性记录”，并给出重录命令：

   ```text
   pnpm run verify-translation-pairing --write <english-path>
   ```

3. 记录按标题层级嵌套，例如 tool-skill 的记录：

   ```yaml
   /deepseek-ai-dsh-tool-skill/use-this-package/minimal-configuration:
     en: 440b17442e431e27
     zh: f8e6d8ef9a954e86
   ```

   每个条目同时有 `en` 与 `zh` 的 16 位十六进制哈希；哈希覆盖代码块与生成区域之外的块。
4. 修改一侧后必须同步另一侧并重录；不得手改哈希。
5. 中文标题可翻译，但显式 `<a id="..."></a>` 锚点与英文 slug 保持稳定；中文正文的仓库内链接指向 `.zh.md` 对应页。

证据：`deepseek-harness/native/README.i18n.yaml:1-10@687f282e`（文件头、命令、路径与层级）；`deepseek-harness/packages/skill/tool-skill/README.i18n.yaml:1-136@687f282e`（44 个标题层级与 en/zh 哈希）；`deepseek-harness/packages/attachment/attachment-local/README.i18n.yaml:1-61@687f282e`；52 篇中文正文均全文读取（含 45 条超过 768 显示单元的 raw 行），代表全文样本 `deepseek-harness/packages/attachment/attachment-local/README.zh.md:1-152@687f282e`、`deepseek-harness/packages/client/ui-approval/README.zh.md:1-47@687f282e` 与 `deepseek-harness/packages/client/ui-schedule/README.zh.md:1-108@687f282e`。

本轮机械核对（作者执行，只读）：

- 52 篇中文正文全文阅读；英文 101 条、中文 45 条超过 768 显示单元的长行均以 raw 读取补齐；
- 52 组英文/中文文件的标题数量一致；
- 数字默认值与反引号标识符逐对比较：除 `64 million`→`6400 万` 等语言化表达和本地化 UI 标签外未发现漂移；
- 52 个 sidecar 共 818 个 section，全部同时具备 `en` 与 `zh` 16 位十六进制哈希；
- 52 个 sidecar 的 `--write` 命令都指向正确的英文路径；
- 规范化后的链接目标、代码块内容、显式锚点在 52 对中完全一致（仅互链条目与 `.zh.md` 本地化后缀不同）；
- 中文正文中 274 个 `.zh.md` 链接目标全部存在。

### 【迁移设计】

1. 先提供 `verify-translation-pairing` 的“检查”和 `--write` 两种模式；CI 对改动路径跑检查。
2. 页面模板固定首行互链与 sidecar 命名 `<page>.i18n.yaml`。
3. 翻译时保持代码块逐字不变、链接改为对应语言页、显式锚点不变。
4. 评审 diff 必须同时看到正文两侧与 sidecar 的同一标题更新。

### 完成信号

检查命令对改动文件通过；sidecar 每个标题都有 en/zh 哈希；中文页锚点与英文页一致；无只改一侧的 diff。

### 失败处理

- 哈希不匹配：同步另一侧后 `--write`，不改哈希。
- 中文链接指向英文页：改回 `.zh.md` 并确认目标存在。
- 翻译与英文行为矛盾：以权威英文/代码为准，重建中文段落。

### 例外

`vendor/group/README.md` 无中文页与 sidecar；第三方 vendored 文档不纳入配对。生成目录、代码块与显式标记的生成区域不计入哈希。

### 证据限制

哈希只证明“两侧与记录一致”，不证明翻译语义正确；作者没有运行配对脚本，未重算 818 个哈希。52 篇中文正文均已全文阅读并与英文页做机械对照（标题/锚点、数字默认值、反引号标识符），但未做逐句双语语义等价审校；英文 101 条、中文 45 条超过 768 显示单元的长行已用 raw 读取补齐。

---

<a id="package-contracts-1.configuration-catalog-and-fail-loud"></a>

## 3. 配置契约：生成目录、默认值与 fail-loud

### 触发条件

新增/删除配置字段或默认值；新增环境变量；settings UI 写入；部署者报告配置未生效。

### 【源义务】

1. README 的配置表是“常用字段 + 默认值 + 含义”，并明确：

   > The generated configuration catalog is the exhaustive source for every accepted field and its JSDoc.

   中文页对应“生成的配置目录完整列出了所有受支持的字段及其 JSDoc”。
2. 默认值必须显式、可解释：
   - `attachment-local` 的 `dshHome` 省略时按 `$DSH_HOME` → `~/.dsh`；
   - `storage-json` 的 `root` 必填，明确“不回退到 `process.cwd()`”；
   - `shell-env` 的 `dshHome` 按“配置 → 环境 → 用户目录”。
3. 非法配置在挂载/加载时失败：
   - `repeat-tool-reminder`：空 `thresholds`、计数 <2、重复阈值都在 `apply` 抛错，绝不静默改行为；
   - `claude-code-mods`：非 Unix、非可执行 `pythonBin`、无法解析的裸名等都在加载期拒绝；
   - `storage-domain`：路由到未注册后端时 `backend-not-found`；
   - `directory-picker-browse`：`maxEntries` 有默认但与截断标志一起工作。
4. 运行时可变字段通过 settings 命名空间写入 profile 条目，不重挂载即可生效；部署默认值在保存覆盖前持续适用（`plugin-market.indexes`、`speech-to-text.defaultProvider` 等）。
5. 打包后的应用忽略运行时覆盖；本地 dotenv 只影响打包/准备阶段（Desktop 强制更新策略）。
6. 敏感值优先环境引用（`apiKeyEnv`），字面量只是最后手段；打包拒绝策略 JSON 中的 `origin`/`authentication`。

证据：`deepseek-harness/packages/attachment/attachment-local/README.md:1-152@687f282e`；`deepseek-harness/packages/boot/config-editor/README.md:1-79@687f282e`；`deepseek-harness/packages/boot/plugin-market/README.md:1-117@687f282e`；`deepseek-harness/packages/guard/repeat-tool-reminder/README.md:1-185@687f282e`；`deepseek-harness/packages/storage/storage-domain/README.md:1-158@687f282e`；`deepseek-harness/packages/shell/shell-env/README.md:1-139@687f282e`；`deepseek-harness/packages/document/office-to-pdf/README.md:1-105@687f282e`。

### 【迁移设计】

1. 代码里的 `Config` schema 是单一事实源；默认值只写在那里。
2. 用生成器产出 `docs/config-catalog.(md|zh.md)`，README 只链接。
3. 对“空/重复/越界/未知键/缺必填”写负向测试，断言加载失败而非回退。
4. volatile 字段声明：命名空间、写回位置、生效时机、是否需要重启。
5. 打包校验拒绝运行时覆盖与策略中的禁止字段。

### 完成信号

新增字段只改 schema 与生成目录；非法值在启动阶段失败；settings 写入后无需重挂载即可读回；打包产物不接受运行时覆盖。

### 失败处理

- 字段只在 README 出现：补 schema 或删除文档。
- 配置被静默替换：改成显式失败，并在错误里指出字段。
- 打包仍读环境覆盖：修打包校验，不以文档提醒代替。

### 例外

纯表现层尺寸/文案可不校验；未挂载的命名空间其设置页不存在。实验包字段可随原型变化，但仍应 fail loud。

### 证据限制

本域未核对生成目录与代码逐字段一致，也未运行任何加载期校验。

---

<a id="package-contracts-1.composition-and-patch-surface"></a>

## 4. 组合行、patch 覆盖与 profile 归属

### 触发条件

新增插件行、bundle、profile、patch 层，或改变服务依赖。

### 【源义务】

1. 行形如：

   ```yaml
   - id: tool-goal
     name: '@deepseek-ai/dsh-tool-goal'
     config:
       blockedAfterConsecutiveRounds: 3
   ```

   `name` 必填，`id` 可省略，`config` 按包 schema。
2. 声明必需的同级服务；缺失时明确失败。`file-reference` 无 provider 时只有空补全面；`storage` 的 `form-not-mounted` 要求先挂域行。
3. 组用 `group: true`，子 id 用 `:`（如 `tools:logger`）；禁用组阻止子条目；组自身总被视为启用。
4. bundle 两种形态：
   - 自带完整树（`sdk-minimal` 不继承 `dsh-base`，每个额外行都是显式改动）；
   - patch 叠加在 base 上（`headless` 的 `cordis.patch.yml`、`claude-code-mods` 的 `cordis.source.patch.yml`）。
5. 覆盖顺序：profile patch、home patch、有序 `--patch`。`config-editor` 只写当前 profile patch，home/CLI 只读；完整 override 会钉住普通字段的当前原始值。
6. 随附模板只在启动时应用 patch；运行中编辑需 HMR 支持。
7. 可选 bundle 无 profile 时行禁用；插件顺序由 `dsh.profile.bundles` 决定。
8. Desktop 独占 `$DSH_HOME/profiles/desktop` 且不共享可执行包；CLI 不能启动该 profile。

证据：`deepseek-harness/packages/boot/config-editor/README.md:1-79@687f282e`；`deepseek-harness/packages/bundle/headless/README.md:1-172@687f282e`；`deepseek-harness/packages/bundle/sdk-minimal/README.md:1-108@687f282e`；`deepseek-harness/packages/storage/storage/README.md:1-141@687f282e`；`deepseek-harness/packages/terminal/terminal/README.md:1-151@687f282e`；`deepseek-harness/packages/experimental/claude-code-mods/README.md:1-220@687f282e`；`deepseek-harness/vendor/group/README.md:1-21@687f282e`（第三方组语义）。

### 【迁移设计】

1. 先画“服务提供者 → 消费者”图，再写 YAML。
2. 每个 bundle README 写清继承/独立树、patch 文件名、必需服务。
3. 把覆盖层写成显式表：层、可写否、优先级、生效时机。
4. 负向测试：缺服务、重复挂载、禁用组、在错误 profile 运行。
5. 多宿主部署明确“共享产品数据、不共享可执行包/锁文件”。

### 完成信号

最小 YAML 可启动；缺服务时报错指向包名；config-editor 只改 profile；禁用组后子条目不运行。

### 失败处理

- 半挂载：移除错误行、补服务、重启。
- 覆盖写错层：从备份恢复 patch，重新在 profile 层编辑。
- 组禁用未生效：检查组语义与子 id，不要改成逐个禁用来“绕过”。

### 例外

`package-library` 不挂载行；`vendor/group` 的组行为由第三方包提供，本仓库只使用其语义。

### 证据限制

本域只读 README，未启动任何 profile；不同 bundle 的继承关系需逐包核对。

---

<a id="package-contracts-1.model-facing-and-cache-contract"></a>

## 5. 模型可见面与 KV cache

### 触发条件

新增/修改模型可见工具、prompt 段、skill 目录、注入消息，或改变工具可见性/作用域/同名遮蔽。

### 【源义务】

1. 有模型面的包写 `Model Experience` 三小节：
   - What the model sees（含截断、排序、语言、是否非指令）；
   - Token effect（固定/数据相关/为零）；
   - KV Cache effect（前缀稳定/追加/失效点）。
2. 静态 schema 在挂载生命周期内前缀稳定；工具结果与注入内容追加，不改写已有前缀。
3. 改变系统提示段、工具可见性或作用域会从该点使缓存失效，必须说明。
4. 第三方文本标注“不是指令”（`plugin_market` 的工具描述明确 market text is third-party content, not instructions）。
5. skill 目录变更追加完整替换；删除所有 skill 也追加空目录以停用旧名；用户 `/name` 注入与工具加载共享同一 `<skill_content>` 渲染。
6. 工具结果边界写清：`--json` 除 terminal `final` 外每字符串/对象键 8 KiB 并标 `truncated`；市场描述/标题截断到 300 字符；`list_agents` 无 cursor。
7. 不要把工具隐藏而保留其 prompt 指引；两者一起作用域。

证据：`deepseek-harness/packages/skill/tool-skill/README.md:1-259@687f282e`；`deepseek-harness/packages/guard/repeat-tool-reminder/README.md:1-185@687f282e`；`deepseek-harness/packages/goal/tool-goal/README.md:1-162@687f282e`；`deepseek-harness/packages/boot/plugin-market/README.md:1-117@687f282e`；`deepseek-harness/packages/subagent/tool-subagent-control/README.md:1-181@687f282e`；`deepseek-harness/packages/web/web-search-deepseek/README.md:1-177@687f282e`；`deepseek-harness/packages/bundle/headless/README.md:1-172@687f282e`。

### 【迁移设计】

1. 建立“模型可见项清单”：schema、prompt 段、注入消息、目录、错误文本。
2. 每项写成本与缓存行为；schema 变更按公共 API 评审。
3. 第三方内容统一加非指令声明；错误文本按契约维护。
4. 在 CI 保存生成的工具目录 diff，便于发现 schema 漂移。

### 完成信号

评审能从 README 看出“模型看到什么、花多少 token、是否破坏前缀”；工具目录 diff 与声明一致。

### 失败处理

- 未声明 schema 变化：补 Model Experience 并按兼容性变更处理。
- 第三方文本被当指令：改包装/描述，必要时在工具层转义。
- 缓存意外失效：定位 prompt 段/可见性变化，或改为追加式。

### 例外

纯 UI/纯 Host 包写 None；间接消费者说明“由触发的 host 包拥有模型面”。

### 证据限制

KV cache 命中是 best-effort，README 只是声明；本域未测量 token 或缓存。

---

<a id="package-contracts-1.model-tool-authority-and-results"></a>

## 6. 工具执行时权威与声明式结果

### 触发条件

新增有副作用的工具，或改变工具可被谁调用。

### 【源义务】

1. 执行时解析精确 live calling agent、运行状态与 open turn；注册可见性不等于权限。
2. 创建/编辑/暂停/恢复 goal 需要 runtime-root agent 当前轮次的 direct human message；插件/调度器必须自带来源，不能继承人类权威。
3. 子代理不能创建/编辑 goal；durable paused goal 的 `resume` 被工具拒绝（`GOAL_TOOL_RESUME_PAUSED`），由用户路径恢复。
4. 更新携带先前读取的精确 id + revision；过期 revision 拒绝覆盖。
5. 工具声明完整结果 schema 并以紧凑 JSON 渲染；`send_message` 只返回接收 `messageId`，不返回对方答复。
6. 区分“接受请求”与“完成工作”：`interrupt_agent` 接受即返回，子代理仍可能运行；`send_message` 成功不等于对方处理。
7. 资源所有权围栏：终端按精确 agent 隔离，`FOREIGN_SESSION` 即使知道 id 也拒绝。
8. advisory guard 只追加提醒，不阻断、不替换 tool result；被拒绝的调用也计数。

证据：`deepseek-harness/packages/goal/tool-goal/README.md:1-162@687f282e`；`deepseek-harness/packages/subagent/tool-subagent-control/README.md:1-181@687f282e`；`deepseek-harness/packages/guard/repeat-tool-reminder/README.md:1-185@687f282e`；`deepseek-harness/packages/terminal/terminal/README.md:1-151@687f282e`；`deepseek-harness/packages/interaction/user-questions/README.md:1-70@687f282e`；`deepseek-harness/packages/deliverables/tool-present/README.md:1-102@687f282e`。

### 【迁移设计】

1. 抽一个 `authorize(exec, {requireHuman, requireRoot, requireOpenTurn})` 辅助，在 execute 首行调用。
2. 写操作一律 revision/owner 检查；错误区分“缺失/过期/越权/不可恢复”。
3. 结果 schema 与渲染函数同源；测试未授权、过期、跨 agent、已关闭轮次。
4. 文档明确“接受≠完成”，避免调用方等待不存在的回复。

### 完成信号

越权调用在 execute 阶段失败；过期 revision 不覆盖；结果形状可被调用方稳定解析。

### 失败处理

- 只做参数校验：补执行期身份检查。
- 后写覆盖：补 revision 并提供重新读取路径。
- 伪造完成：删除隐藏回复通道，要求显式再调用。

### 例外

无 agent 的程序化提问仅对本地非作用域 waterfall 开放；纯读取工具可简化权限但仍需结果 schema。

### 证据限制

“请求是否值得创建 goal”“阻塞条件是否持续”仍是模型判断；列表是快照。本域未运行工具测试。

---

<a id="package-contracts-1.extension-seams-ui-and-resources"></a>

## 7. UI/Slot/资源协议扩展点

### 触发条件

新增 UI 面板、设置页、命令、资源协议或 tab，或让浏览器包读取另一包的数据。

### 【源义务】

1. 业务插件通过 slot/服务注册，接收类型化 props 与框架绑定 hook；不直接导入 renderer 内部。
2. 一个资源协议恰好一个 provider；第二个注册抛错；provider 在 `signal` abort 时停止；dispose 结束流。
3. 资源记录按地址保留到页面生命周期；holder 归零只重置状态；provider 忽略 abort 会继续工作（写入限制）。
4. 命令通过 `ctx.commandUi` 注册；与 host 命令同名冲突显式失败；装饰器没有 host 行不触发；带附件提交只允许声明 `input.attachments` 的 host 命令。
5. 设置页只在 Host 服务对应命名空间时出现（`ctx.configForms.whileServed`）；离开丢草稿；保存按 revision 分栏，冲突不覆盖。
6. 内部引擎（`ui-dockkit`）声明“因静态链接而发布，非稳定 API”；其导出不出现在服务接口。
7. UI 只呈现；数据/持久化/模型语义属于 Host 包。

证据：`deepseek-harness/packages/client/resources/README.md:1-105@687f282e`；`deepseek-harness/packages/client/ui-renderer/README.md:1-105@687f282e`；`deepseek-harness/packages/client/ui-commands/README.md:1-105@687f282e`；`deepseek-harness/packages/client/ui-settings-subagent/README.md:1-81@687f282e`；`deepseek-harness/packages/client/ui-dockkit/README.md:1-115@687f282e`；`deepseek-harness/packages/client/ui-user-questions/README.md:1-131@687f282e`；`deepseek-harness/packages/context/file-reference/README.md:1-111@687f282e`。

### 【迁移设计】

1. 先选扩展点，再写组件；注册必须返回 disposer。
2. 资源协议实现 `open(address, { signal })`，以 frame 表达失败而不是 throw。
3. 设置页按命名空间与 revision 保存，禁止覆盖新值。
4. 内部/不稳定包在 README 第一段警告，并禁止其类型进入服务接口。
5. 测试重复 provider、无 host 行、附件提交不支持、卸载后注册残留。

### 完成信号

组件无需导入 renderer 即可工作；最后一个 holder 离开后流停止；设置页冲突可恢复。

### 失败处理

- 重复 provider：移除一个或改用服务。
- 注册残留：补 owned effect disposer。
- 跨包直连：改为资源/服务，更新依赖方向。

### 例外

Web shell 与 boot kernel 是 renderer 的直接消费者；dockkit 可被 Sidebar 静态链接但非公共 API。

### 证据限制

资源记录内存增长、abort 合规、部分可访问性缺口是已声明限制；本域未运行浏览器测试。

---

<a id="package-contracts-1.state-storage-and-ownership"></a>

## 8. 状态所有者、持久化与生命周期

### 触发条件

新增持久/半持久状态、缓存、清理或迁移；多宿主共享 `DSH_HOME`。

### 【源义务】

1. 声明状态类别与精确位置：
   - 附件 `<DSH_HOME>/attachments/v1`，永不自动删除；
   - Desktop profile `$DSH_HOME/profiles/desktop`，Electron 独占；
   - 终端会话进程内，重启消失；
   - workspace-changes 摘要随 Session 释放；
   - 请求图片缓存 `<DSH_HOME>/cache/attachments/request-images/`，可清空且不影响持久对象。
2. 持久写入 resolve 前已 durable：原子替换、fsync/目录同步、写链串行；失败不让内存领先介质。
3. 域数据只经 `ctx.storageDomain`；hub 不做 IO；域配置路由后端；消费者不直接碰后端。
4. 版本不匹配拒绝打开（`version-mismatch`），不自动迁移。
5. 清理等待静默：dispose 取消/汇合，失败报告而非宣称成功。
6. CLI 与 Desktop 共享产品数据，但不共享可执行包、插件激活、锁文件或 node_modules。

证据：`deepseek-harness/packages/attachment/attachment-local/README.md:1-152@687f282e`；`deepseek-harness/packages/storage/storage/README.md:1-141@687f282e`；`deepseek-harness/packages/storage/storage-domain/README.md:1-158@687f282e`；`deepseek-harness/packages/storage/storage-json/README.md:1-152@687f282e`；`deepseek-harness/packages/deliverables/workspace-changes/README.md:1-106@687f282e`；`deepseek-harness/packages/terminal/terminal/README.md:1-151@687f282e`。

### 【迁移设计】

1. 建状态表：owner / path / lifetime / cleanup / version / multi-process。
2. 复用后端契约与 conformance suite；单进程写链+原子发布。
3. 对 restart、dispose、缓存清空写恢复测试。
4. 多宿主部署只共享产品数据，不共享可执行包。

### 完成信号

写入后崩溃可读到最后成功值；Session 释放清理临时目录；清缓存不丢附件。

### 失败处理

- 版本不符：显式迁移或新建域，不手改。
- 跨进程写冲突：按限制承认 last-completion-wins，或路由到支持并发的后端。
- 清理失败：报告并保留可重试状态。

### 例外

`single` 每次重写整单元；`per-record` 坏文档读作缺失；两者是显式取舍。无跨进程锁、无事务、无自动迁移是已知缺口。

### 证据限制

本域未运行存储/崩溃恢复测试。

---

<a id="package-contracts-1.failure-codes-and-recovery"></a>

## 9. 稳定错误码与恢复

### 触发条件

新增公开操作或改变失败语义；引入重试/超时/取消/沙箱。

### 【源义务】

1. 公开失败用稳定、可路由代码/类型：
   - `StorageError`：`backend-not-found`、`form-not-mounted`、`duplicate-backend`、`duplicate-mount`、`version-mismatch`；
   - `DomainError`：`already-open`、`facet-unsupported`、`invalid-record`、`missing-key`、`closed`；
   - Terminal：`NO_BACKEND`、`NO_SESSION`、`FOREIGN_SESSION`、`SEND_ACTIVE`、`OWNER_NOT_LIVE`；
   - Web search：`WEB_PROVIDER_CREDENTIAL_MISSING`、`WEB_ABORTED`、`WEB_PROVIDER_ERROR`；
   - Plugin market：`plugin-market/invalid-query|invalid-index-url|unknown-index|fetch-failed|invalid-index`；
   - PTC：`sandbox-unavailable` + `PtcRunFailure.kind` 分类。
2. 区分调用方误用与运行时失败；误用不重试。
3. 缺服务/配置 fail loud；不静默换后端/识别器/无沙箱执行。
4. 取消/撤销后拒绝迟到答案；dispose 取消并汇合。
5. 错误文本给出可执行恢复，但不泄漏 secrets/远程原文。
6. 严格失败优先于降级：搜索无结构化结果应报错，而不是抓取散文。

证据：`deepseek-harness/packages/storage/storage/README.md:1-141@687f282e`；`deepseek-harness/packages/storage/storage-domain/README.md:1-158@687f282e`；`deepseek-harness/packages/terminal/terminal/README.md:1-151@687f282e`；`deepseek-harness/packages/host/directory-picker-browse/README.md:1-121@687f282e`；`deepseek-harness/packages/web/web-search-deepseek/README.md:1-177@687f282e`；`deepseek-harness/packages/experimental/ptc-runtime-python/README.md:1-157@687f282e`。

### 【迁移设计】

1. 每包建错误码表：触发、可重试、用户文案、恢复。
2. 统一四类：误用 / 运行时 / 取消 / 不可用。
3. 负向测试固化迟到、dispose、缺服务、无沙箱。
4. UI 只翻译展示，不改底层代码。

### 完成信号

调用方能按代码分支；不可重试错误不会被自动重试；错误文本能指导下一步。

### 失败处理

- 通用 message：补代码并映射。
- 重试误用：改分类并停用重试。
- 迟到写回：加请求锁/撤销状态。

### 例外

实验包错误码不承诺稳定；部分分类依赖平台/launcher。

### 证据限制

本域未触发任何运行时错误路径。

---

<a id="package-contracts-1.compatibility-versioning-deprecation"></a>

## 10. 兼容性、版本与弃用

### 触发条件

发布新版本、改 wire/存储格式、重命名工具/协议方法、实验转正、升级独立依赖。

### 【源义务】

1. 插件兼容性由 `engines.dsh` + profile 版本豁免共同决定；列表与安装用同一判定；无兼容版本时禁用安装并解释。
2. 没有升级动作时，升级=卸载后安装，不得暗示自动升级（`plugin-market` 明确 no upgrade）。
3. 稳定性等级写清：
   - 实验包无稳定性保证（`tool-agent-team`）；
   - 内部引擎因静态链接发布但非 API（`ui-dockkit`）；
   - 协议无版本协商（`sdk/protocol` 只带 `serverInfo.version`，不验证）。
4. 镜像实现同变更更新：Python SDK 复现 TS 协议形状但不导入；改方法/载荷/`serverInfo.name` 必须同时更新。
5. 已发布 Session 格式冻结：新迁移不改历史语义；未知事件拒绝；迁移保持派生消息序列不变；无自动降级。
6. 独立 kit 固定兼容范围（`@deepseek-ai/libreoffice-kit` `^0.1.5`）；缺声明原生引擎时拒绝打包，不静默选 WASM。
7. 旧工具名被替换时，组合必须禁用旧定义避免同名冲突（`tool-agent-team` 取代 legacy subagent controls）。

证据：`deepseek-harness/packages/boot/plugin-market/README.md:1-117@687f282e`；`deepseek-harness/packages/sdk/protocol/README.md:1-132@687f282e`；`deepseek-harness/packages/session/session-format-v1-to-v2/README.md:1-118@687f282e`；`deepseek-harness/packages/experimental/tool-agent-team/README.md:1-155@687f282e`；`deepseek-harness/packages/client/ui-dockkit/README.md:1-115@687f282e`；`deepseek-harness/packages/document/office-to-pdf/README.md:1-105@687f282e`；`deepseek-harness/native/README.md:1-11@687f282e`。

### 【迁移设计】

1. 包元数据写稳定性等级与兼容范围。
2. 变更分类：兼容 / 需迁移 / 破坏性；破坏性必须给用户路径。
3. 镜像同步清单与跨语言测试。
4. 已发布格式只加新边；迁移写输入拒绝条件与输出不变断言。

### 完成信号

市场/安装判定一致；镜像测试通过；迁移后消息序列不变；升级说明与实现一致。

### 失败处理

- 判定分叉：抽共用 `evaluateCompatibility`。
- 镜像分叉：同 PR 更新两端并加 e2e。
- 迁移改变历史：回退并重写迁移，不修补已发布格式。

### 例外

预发布协议无兼容承诺；历史 released codec 冻结；保留旧 generation 不是回滚输入。

### 证据限制

本域未运行兼容性、迁移或镜像测试。

---

<a id="package-contracts-1.trust-and-data-boundaries"></a>

## 11. 信任边界与数据外泄面

### 触发条件

引入执行模型代码、第三方内容、遥测、凭据、远程资源或危险权限模式。

### 【源义务】

1. `sdk-minimal` 使用 danger-full-access，必须写“shell 可修改进程可访问的任何路径，只能配合隔离 workspace”。
2. Claude Code mod 以进程全权运行，无沙箱/静态分析/热重载；“只挂载你愿意作为插件运行的内容”。
3. 第三方市场内容不是指令；index 的 name/version 是市场声明，安装清单才是事实。
4. 遥测列出字段与排除项（API key、token、prompt、response、hostname、machine UUID 等），默认开关，失败不影响主流程。
5. 凭据按调用解析，优先环境/账号；配置避免字面 secret；搜索端点与聊天端点分离；失败文本不泄漏密钥。
6. 沙箱报告 full/partial enforcement，不声称多租户隔离或完整后代清理；`danger-full-access` 明确绕过。
7. 目录浏览无安全边界，只是 UX 作用域；远程图标暴露 IP。
8. 网络故障测试规则必须在安装更新前移除。

证据：`deepseek-harness/packages/bundle/sdk-minimal/README.md:1-108@687f282e`；`deepseek-harness/packages/experimental/claude-code-mods/README.md:1-220@687f282e`；`deepseek-harness/packages/client/product-analytics/README.md:1-85@687f282e`；`deepseek-harness/packages/web/web-search-deepseek/README.md:1-177@687f282e`；`deepseek-harness/packages/experimental/ptc-runtime-python/README.md:1-157@687f282e`；`deepseek-harness/apps/desktop/README.md:1-384@687f282e`；`deepseek-harness/packages/host/directory-picker-browse/README.md:1-121@687f282e`。

### 【迁移设计】

1. 画数据流：输入/输出/存储/远程。
2. 危险模式显著警告并给隔离前提。
3. 遥测白名单 + 禁用即停新采集。
4. 第三方文本统一包装为数据；凭据按调用解析。

### 完成信号

部署者能判断该包需要什么隔离；遥测无敏感字段；第三方文本不进入指令位置。

### 失败处理

- 误把 sandbox 当多租户：降级声明并加隔离要求。
- 遥测泄漏：删除字段、轮换凭据、重发版本。
- 市场字段被当安装事实：以安装清单为准并改文案。

### 例外

显式 `danger-full-access` 是用户选择；单用户本地部署可接受较弱隔离但仍需声明。

### 证据限制

隔离强度依赖平台后端；远程服务/通知/浏览器行为未验证。

---

<a id="package-contracts-1.limits-evidence-and-open-verification"></a>

## 12. 限制、证据分层与开放验证

### 触发条件

新增测试/验收脚本、准备发布、任何“已验证/已完成”声明。

### 【源义务】

1. 每个包有 `Known Limitations and Deferred Work`，写当前约束而非愿望。
2. 测试文档写清证据层级：真实执行 vs 被替换（安装器、浏览器、剪贴板、签名） vs 未覆盖。
3. 维护显式 `Open verification` 列表，声明这些不是通过证据。
4. 本地回环/夹具不认证已安装升级、发布签名、远程服务或多平台。
5. 无关失败不得把整体门禁标绿（如文档站点符号链接 EPERM）。
6. 限制写适用条件与再激活标准；实验包说明原型状态。

证据：`deepseek-harness/apps/desktop/tests/README.md:1-88@687f282e`（Open verification 与证据表）；`deepseek-harness/apps/desktop/tests/installed-update/network/README.md:1-58@687f282e`（真实规则创建未验证）；`deepseek-harness/apps/desktop/README.md:1-384@687f282e`（本地更新资格与“不执行安装器”）；`deepseek-harness/packages/experimental/webworker-runtime/README.md:1-84@687f282e`（覆盖缺口）；`deepseek-harness/packages/experimental/ptc-runtime-python/README.md:1-157@687f282e`（分类降级与残余风险）。

### 【迁移设计】

1. 测试文档固定三栏：已观察 / 被替换 / 未验证。
2. 发布清单逐项引用报告路径与命令。
3. 包限制小节与测试文档互链。
4. 评审禁止把局部绿色当发布认证。

### 完成信号

每条“已验证”都能指向报告与层级；开放项仍在文档中；发布说明不夸大。

### 失败处理

- 局部证据被夸大：降级声明并补真实测试。
- 开放项被删：恢复并说明为何仍可推进。
- 无关门禁失败：单独记录，不合并成“全绿”。

### 例外

纯内部一次性调试无需正式证据，但不得对外声明发布质量。

### 证据限制

证据分级靠人工；开放项会过期。本域未执行任何测试。

---

<a id="package-contracts-1.dev-note-non-authoritative"></a>

## 13. Dev Note 非权威

### 触发条件

记录未决设计、未来方向或维护者上下文。

### 【源义务】

1. Dev Note 位于 `<details>` 折叠块，并显式声明“非权威/工作上下文”。
2. 已交付行为、限制与理由只以上文章节、代码和链接的 Agent Note/决策记录为准。
3. 未决方向不得用承诺性措辞，不得作为实现/验收依据。
4. 方向落地后把结论迁入权威章节或决策记录。

证据：`deepseek-harness/packages/attachment/attachment-local/README.md:1-152@687f282e`（Dev Note 声明与非权威句）；`deepseek-harness/packages/guard/repeat-tool-reminder/README.md:1-185@687f282e`；`deepseek-harness/packages/goal/tool-goal/README.md:1-162@687f282e`；`deepseek-harness/packages/session-query/session-log-export/README.md:1-145@687f282e`；`deepseek-harness/packages/terminal/terminal/README.md:1-151@687f282e`；`deepseek-harness/packages/web/web-search-deepseek/README.md:1-177@687f282e`。

### 【迁移设计】

1. 模板固定折叠块与免责句。
2. 评审清单禁止引用 Dev Note 作为验收标准。
3. 定期把已落地内容迁走。

### 完成信号

读者能从免责声明找到权威位置；Dev Note 不含“将支持”式承诺。

### 失败处理

- 被当合同：改为权威章节或明确标为未决。
- 内容落地：迁移并删除重复。

### 例外

没有维护者上下文时写 None，不强制有内容。

### 证据限制

纯语义约定，无脚本验证；各包使用密度不同。

---

<a id="package-contracts-1.package-boundary-single-role"></a>

## 14. 单包单一职责与依赖方向

### 触发条件

新增/拆分包，或跨包共享状态/类型。

### 【源义务】

1. 每包一个角色并暴露 ctx key/注册点；组 README 表列“角色 → ctx key”。
2. 分层：服务拥有身份/授权/清理；后端只拥有介质；工具只做适配；UI 只呈现；协议库无插件/配置/注册。
3. hub 不做 IO；域形式路由后端；消费者依赖域 API 而非具体后端。
4. SDK 不创建开发者项目、不定义另一个应用；Python/TS 共享协议。
5. 因静态链接发布的内部引擎声明无稳定 API，类型不出现在服务接口。
6. 独立 kit 拥有转换保真度与资产；宿主只声明兼容版本与责任。
7. 第三方 vendored 包保持独立说明。

证据：`deepseek-harness/packages/context/README.md:1-54@687f282e`；`deepseek-harness/packages/deliverables/README.md:1-50@687f282e`；`deepseek-harness/packages/document/README.md:1-50@687f282e`；`deepseek-harness/packages/sdk/README.md:1-49@687f282e`；`deepseek-harness/packages/storage/storage/README.md:1-141@687f282e`；`deepseek-harness/packages/storage/storage-domain/README.md:1-158@687f282e`；`deepseek-harness/packages/client/ui-dockkit/README.md:1-115@687f282e`；`deepseek-harness/packages/sdk/protocol/README.md:1-132@687f282e`。

### 【迁移设计】

1. 维护包→角色→ctx key 表。
2. 介质/协议/UI 分层；消费者只依赖域 API。
3. 评审检查反向依赖与内部类型泄漏。
4. 组地图随包变更更新。

### 完成信号

替换后端只改路由；UI 不写持久化；服务接口不出现内部引擎类型。

### 失败处理

- 角色重叠：把状态/授权移回所有者层。
- 反向依赖：引入域 API/事件，不直接导入实现。
- 内部类型泄漏：改为公开类型或删除导出。

### 例外

`package-library` 可无 ctx key；组包不提供运行时服务。

### 证据限制

无全仓依赖图检查；组地图可能滞后。

---

<a id="package-contracts-1.session-event-and-projection-contract"></a>

## 15. Session 事件、投影与日志

### 触发条件

新增持久事件、客户端可见状态、导出或格式迁移。

### 【源义务】

1. 区分 log-only 与模型可见；log-only 只被客户端读取。
2. 投影从已记录 tool call/PTC dispatch/消息推导，不维护第二份状态。
3. 已完成/continued 调用不得重开；迟到答案走明确 Remote 路径，不伪造原 tool result。
4. 目录/摘要变更完整替换追加（含空目录停用旧名），不就地改写。
5. 导出按 generation 用规范文件名（`session.jsonl`/`session.vN.jsonl`），导出前 flush 活跃 Session；未知 payload 原样保留。
6. 迁移保持派生消息序列不变；诊断尝试保留但不进入 `deriveMessages()`。
7. 遥测不进 Session/模型上下文。

证据：`deepseek-harness/packages/deliverables/workspace-changes/README.md:1-106@687f282e`；`deepseek-harness/packages/deliverables/tool-present/README.md:1-102@687f282e`；`deepseek-harness/packages/session/session-format-v1-to-v2/README.md:1-118@687f282e`；`deepseek-harness/packages/session-query/session-log-export/README.md:1-145@687f282e`；`deepseek-harness/packages/interaction/user-questions/README.md:1-70@687f282e`；`deepseek-harness/packages/skill/tool-skill/README.md:1-259@687f282e`。

### 【迁移设计】

1. 先问“能否从既有事件投影”；不能才加事件，优先 log-only。
2. 事件清单标注模型可见/log-only。
3. 导出/迁移写 canonical 断言；禁止投影外保存问题/交付状态。
4. 测试重启、重复回答、关闭后回答、导出活跃 Session。

### 完成信号

重启后 UI 从日志恢复；没有第二份状态；导出文件名正确；迁移后消息序列不变。

### 失败处理

- 平行状态：删除并改投影。
- 伪造结果：回退，走显式 reply/Remote。
- 迁移改变历史：重写迁移。

### 例外

纯浏览器草稿可留本地，但声明不同步、不权威。

### 证据限制

投影可能不建模所有事件；早于当前 Host 的摘要不可重建。

---

<a id="package-contracts-1.cli-and-headless-contract"></a>

## 16. CLI/headless 契约

### 触发条件

新增 CLI 入口/子命令/`--json`、Desktop 命令注册、用 session id 继续。

### 【源义务】

1. 退出码：完成最终 `turn/end` 为 0；中止/错误/无 turn 为 1。
2. 默认 stdout 只有最终答案；诊断走 stderr（`dsh: <code>: <message>`）；`--json` 用 NDJSON 替代最终文本行，stderr 保留诊断。
3. 空白位置参数是用法错误，即使 stdin 非终端也不吞管道；唯一 stdin 标记是单独 `-`。
4. `--session-id` 采纳要求持久 Session、cwd/preset/父子作用域匹配、未在本进程存活；未知 id 在任务前失败。
5. headless 一次任务、不监听端口、自行退出；依赖 `dsh` launcher，换启动方式启动时失败。
6. Desktop CLI 注册可选；卸载前手动 Remove；卸载器不清 CLI；已有命令切换需确认。
7. `/export` 只产生浏览器下载，不接受目标路径，不伪造模型轮次。

证据：`deepseek-harness/packages/bundle/headless/README.md:1-172@687f282e`；`deepseek-harness/apps/desktop/README.md:1-384@687f282e`；`deepseek-harness/packages/session-query/session-log-export/README.md:1-145@687f282e`；`deepseek-harness/packages/bundle/sdk-minimal/README.md:1-108@687f282e`。

### 【迁移设计】

1. 表驱动测试：成功/中止/错误/无 turn/空输入/管道/未知 id。
2. 明确 stdout 消费者与 stderr 诊断；`--json` 事件词汇表。
3. Session 采纳按最严格作用域校验。
4. Desktop 命令管理提供 Install/Repair/Remove 并保留无关 PATH；文档写卸载顺序。

### 完成信号

脚本能按退出码分支；stdout 可直接解析；未知 session id 不创建空历史。

### 失败处理

- 失败退出 0：修映射并加测试。
- 诊断混入 stdout：拆分通道。
- 采纳越界：拒绝并提示可用的 session。

### 例外

SDK 通过 JSON-RPC 驱动同一 profile，不走 headless 文本契约。

### 证据限制

退出依赖 launcher；平台命令注册行为不同；最终后台任务结算可能不在持久历史。

---

**补充源码引用（断言定义与尾部区间实际读取）**：`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:222-228,358-1211@687f282e`


## 附：跨域与证据边界

- **documentation**：`docs/i18n/README.md` 拥有双语规则、记录与门禁；本域只记录 52 个包页对规则的实际应用。`dsh-doc` 的元数据/链接规则也属于 documentation。
- **release**：`research/release-coverage.json` 已以 `instruction` 分类检查 `apps/desktop/tests/README.md` 与 `tests/installed-update/network/README.md`；本域以 `governance` 记录同一正文（内容分类相容），并新增“限制/证据分层”机制。
- **testing**：桌面更新资格、安装器/签名未验证项由 testing/release 域继续拥有；本域只提取 README 中的证据纪律。
- **persistence**：Session 格式、存储后端与迁移的更深契约在 persistence 域；本域记录包 README 暴露的义务。
- **本域证据限制**：53 个英文正文与 52 个中文正文均全文阅读，146 条超长行（英文 101、中文 45）已 raw 补读；做了标题/代码块/锚点/链接的结构等价、数字与反引号标识符对照，以及 818 个 sidecar 哈希对的结构核对；未重算哈希，未逐句审校双语语义，未运行任何脚本、构建、测试或远程操作。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `package-contracts-1.readme-as-package-contract`：`deepseek-harness/packages/spill/README.md:1-51@687f282e`
- `package-contracts-1.model-facing-and-cache-contract`：`deepseek-harness/packages/client/ui-plan/README.md:1-104@687f282e`
- `package-contracts-1.extension-seams-ui-and-resources`：`deepseek-harness/packages/client/ui-plugin-market/README.md:1-72@687f282e`、`deepseek-harness/packages/client/ui-settings-agent-loop/README.md:1-77@687f282e`、`deepseek-harness/packages/client/ui-schedule/README.md:1-108@687f282e`
- `package-contracts-1.compatibility-versioning-deprecation`：`deepseek-harness/packages/experimental/plugin-market-bundle/README.md:1-68@687f282e`
