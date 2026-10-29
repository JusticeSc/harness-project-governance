# 文档与流程规范：从页面义务到可执行检查

本参考把 DeepSeek Harness 在 `docs/` 页面中写明的文档与操作流程提炼成可迁移规范。它覆盖四类读者触发：改一页文档、新增一种能力、改 Session 格式或持久化类型、写复盘或回应评审；另含 UI 标准、wire 暴露面与扩展点映射。

证据标记：

- **【源义务】** 源页面明确要求或禁止的行为。
- **【源实现事实】** 源仓库实际存在的脚本、命令、文件或历史证据。
- **【迁移设计】** 把源做法移植到新项目时的建议设计，不是源仓库已声称的保证。
- **【额外建议】** 本参考补充的做法，源仓库未明确要求。

引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e`，行号指向固定提交。抽取期未运行 build/test/lint/format；所有 `planned` 验证项都仍需在目标仓库执行。长行按显示宽度截断的风险已单独处理：对 28 个中文页和对应英文页中超过 768 显示列或 385 码点的行做了 raw 重读，见 §9。

## 0. 按触发点选择入口

| 你现在要做的事 | 先读 |
|---|---|
| 新建或修改任何 `docs/` 页面 | §1.1 双语三件套；含代码块再加 §1.2 |
| 改工具/配置/事件/CLI 文档 | §1.3 生成参考 |
| 给新概念、包、类或 `ctx` key 命名 | §1.4 词汇与命名 |
| 写一个新的操作流程页 | §2.1 cookbook 写法 |
| 新增包 / 工具 / Remote API / 设置卡 / 配图 / vendored 包 / LLM 适配器 | §2.2–§2.8 对应小节 |
| 改 Session 格式数字或发布状态 | §3.1 |
| 改持久化类型 | §3.2 |
| 新增 Session 格式整数 | §3.3 |
| 写事故复盘 | §4.1、§4.2 |
| 回应堆叠 PR 评审 / 维护评审 skill | §5.1、§5.2 |
| 做 Web/Desktop UI | §6.1、§6.2 |
| 扩展 DeepSeek wire 或新增产品行为 | §7.1、§7.2 |

贯穿全部流程的三个判断：

1. **事实只有一个家。** 同一事实若在多个层级复述，必须迁到一个 owner，其余位置只链接。事故叙事只属于 postmortem；设计取舍只属于 Agent Note（`.agents/notes/`）；操作步骤属于 cookbook；类型定义属于 subsystems；包合同属于包 README。`docs/AGENTS.md` 的层级表拥有分层规则（`deepseek-harness/docs/AGENTS.md:15-37@687f282e`），本参考不重新定义分层。
2. **能机械检查的不要靠记忆。** 配对哈希、代码围栏、生成目录、manifest 不变量、vendor 守卫、格式记录结构都有对应门禁；判断类工作（译文好坏、命名是否贴切、事故是否值得复盘）才留给评审。
3. **检查通过不等于保证成立。** 每个机制都单列“证据限制”；不要把本地脚本通过说成远端 forge 已阻塞，也不要把结构一致说成语义正确。

---

## 1. 改文档：配对、围栏、生成页与词汇

<a id="documentation-procedures.translation-pairing-and-sidecar"></a>

### 1.1 双语三件套与逐标题 sidecar

**适用。** `docs/`、包 README、Agent Note 等被翻译范围覆盖的 Markdown 页。是否在范围由 `scripts/translation-pairing.manifest.json` 的 `excluded` 决定，而不是凭目录猜；该文件只列显式排除项，例如 `.agents/notes/AGENTS.md`、`docs/AGENTS.md`、`docs/i18n/terminology.md`（`deepseek-harness/scripts/translation-pairing.manifest.json:1-13@687f282e`）。

**前置条件。**

- 页面已有英文源；中文对应页命名为 `<name>.zh.md`；记录文件为 `<name>.i18n.yaml`。
- 两侧顶部有语言切换链接：英文页指向中文，中文页指回英文。
- 本地有 Node 与 Git，且 `verify-translation-pairing` 可运行。

**步骤（作者）。**

1. 先改英文页，再在同一次改动里改中文页。标题层级、顺序、代码围栏序列保持一致；代码块内的代码不翻译。
2. 运行 `pnpm run verify-translation-pairing --write docs/<page>.md`。它按每个标题节计算英文块与中文块的哈希，写入 sidecar（`deepseek-harness/scripts/verify-translation-pairing.ts:1-14@687f282e`）。
3. 运行不带 `--write` 的 `pnpm run verify-translation-pairing`。它检查三件套完整性、语言切换、结构签名与已记录哈希。
4. 提交。`lefthook` 的 `pre-commit` 与 `pre-merge-commit` 用 `--cached` 读取 Git 索引字节再查一次，避免“工作区已修、暂存区仍旧”（`deepseek-harness/docs/development.md:133-152@687f282e`；`deepseek-harness/scripts/verify-translation-pairing.ts:84-190@687f282e`）。
5. 人工评审译文语义、术语与语气。门禁不判断对错。

**完成信号。** 三件套齐全，check 通过，hook 通过，评审者确认译文。

**失败处理。**

- 缺中文页或 sidecar：补文件；不要用 manifest 排除来“修绿”一个应翻译的页。
- 结构签名不一致：对齐标题/围栏结构，不要改 gate。
- 哈希过期：重跑 `--write`，评审 diff 中只有预期节变化。
- 合并冲突：`deepseek-harness/docs/development.md:133-152@687f282e` 明确只在 Markdown 上解决，然后重录该对。`.i18n.yaml` 使用 Git 默认文本合并；冲突意味着两侧都改了同一标题节。
- hook 失败：修复后重新暂存；不要 `--no-verify` 绕过。

**例外。** manifest 显式排除项可以单语。归档笔记按自身历史规则处理，但不得作为当前权威。

**证据限制。** 【源实现事实】门禁校验的是结构签名与逐节哈希，不校验逐句语义；译文质量仍是评审责任（`deepseek-harness/scripts/verify-translation-pairing.ts:1-14@687f282e`）。本域已读 28 个中文页全文并比对结构，但不是专业译审。

---

<a id="documentation-procedures.doc-fence-typecheck-and-type-equiv"></a>

### 1.2 代码围栏与类型逐字校验

**适用。** 任何含 TypeScript 围栏、或粘贴源类型定义的 Markdown。

**前置条件。** 仓库能生成 host 类型声明；`scripts/type-equiv.manifest.json` 存在；文档范围被 glob 覆盖。

**围栏分类（【源义务】）。**

| 围栏 info-string | 含义 | 责任 |
|---|---|---|
| `` ```ts `` | 必须能编译的示例 | `doc-typecheck` |
| `` ```ts ignore-check `` | 无法编译的示意 | 显式 opt-out，计入比例 |
| `` ```ts type-equiv `` | 源类型声明 + 原 JSDoc 的逐字粘贴 | `verify-type-equiv` + manifest |
| `` ```ts public-api `` | 去实现体的公共类 API | 同上，`projection: public-api` |
| `` ```ts cordis-catalog `` / `persistence-catalog` / `config-catalog` | 生成片段 | 各自 owner 门禁 |

该分类表在 `deepseek-harness/scripts/doc-typecheck.ts:20-42@687f282e` 实现；`deepseek-harness/docs/AGENTS.md:38-48@687f282e` 规定 `ts` 围栏必须编译、类型粘贴必须登记 manifest。

**步骤（作者）。**

1. 判定示例能否运行。能运行就用普通 `ts`；不能运行就标 `ignore-check`，并在评审中说明原因。
2. 粘贴源类型时，从 source 复制完整声明与全部 JSDoc，不要改写成员文档；在 `scripts/type-equiv.manifest.json` 加 `{doc, symbol, source}`，需要合并声明时加 `augmentations`，公开类用 `projection: public-api`。
3. 运行 `pnpm run doc-typecheck` 与 `pnpm run verify-type-equiv`，或直接 `pnpm run doc-sync`（`deepseek-harness/scripts/run-gates.ts:812-829@687f282e`）。
4. 源类型或 JSDoc 改变时，同一变更内更新粘贴块或 manifest。

**完成信号。** 围栏编译通过；每个等价块与 manifest 条目一一对应；JSDoc 完整；中文页字节相同的围栏复用英文检查。

**失败处理。**

- 未登记块、漂移粘贴、缺 JSDoc：按源重新生成粘贴内容，补 manifest，不删除成员文档。
- `public-api` 投影不匹配：确认 manifest 的 `projection` 与围栏一致。
- 中文页改写了代码块：中文块会单独校验；若只是翻译注释，保持代码部分字节一致可复用英文检查。

**例外。** 生成 catalog 片段与 `type-equiv` 块由各自 owner 检查，`doc-typecheck` 跳过编译并排除在 opt-out 比例外（`deepseek-harness/scripts/doc-typecheck.ts:1-14@687f282e`）。

**证据限制。** 编译证明语法与类型可解析，不证明示例是推荐用法；`public-api` 省略实现体，读者看不到运行时行为。抽取期未执行 `doc-sync`。

---

<a id="documentation-procedures.generated-reference-freshness"></a>

### 1.3 生成参考的唯一真源与新鲜度

**适用。** 工具目录（`docs/tool-catalog.md`）、配置目录（`docs/config-catalog.md`）、持久化目录（`docs/persistence-catalog.md`）、模块图（`docs/module-graph.md`）、CLI 帮助（`docs/cli-help.md`）、子系统页中的 `cordis-surface` 生成区域，以及 Session 格式 catalog。

**源义务。**

- 生成参考只由源码/声明再生成；英文源与生成区域不得手改。
- 中文对应页通过 §1.1 的配对流程更新，不另写一套生成逻辑。
- 散文不复述可由生成器得到的清单；只描述当前值并链接生成页。
- 改声明后运行 `pnpm run doc-sync`。该聚合包含 `doc-typecheck`、`docs-site-build`、`doc-graphs`、`cli-help`、`markdown-links`、`type-equivalence`、Cordis/tool/config/dependency catalog、persistence 系列、`session-format-catalog`、`translation-pairing`、`markdown-wrap`、包 README、`doc-budgets` 与 `doc-standard` 测试（`deepseek-harness/scripts/run-gates.ts:812-860@687f282e`）。
- Session 格式 catalog 由 `gen-session-format-catalog` 生成；缺边或元数据错误时修声明，不手改 `packages/session/session-format-catalog/src/generated.ts`（`deepseek-harness/docs/cookbook/adding-a-session-format-version.md:36-49@687f282e`；`deepseek-harness/scripts/gen-session-format-catalog.ts:1-6@687f282e`）。
- 新事件用 `@mode` 标签声明分派模式，让生成的 catalog 能核对声明与分派点（`deepseek-harness/docs/cordis-primer.md:15-28@687f282e`）。

**步骤（作者）。**

1. 搜索该事实是否已有生成器；有则改输入（schema、manifest、源码声明、格式边）。
2. 运行生成命令，审阅 diff 是否只含本次变更。
3. 运行 `pnpm run doc-sync` 或针对性 `verify-*`。
4. 失败时修生成器/声明；不要回写生成结果或放宽检查。

**完成信号。** 生成 diff 可解释；所有 catalog/新鲜度检查通过；中文页已重录。

**失败处理。** 生成页过期 → 重新生成并评审；catalog 缺边 → 补相邻边声明；手工修改生成页 → 回滚并改源。

**例外。** 纯人工叙述页（architecture、cookbook、postmortem）不是生成参考；但其事实仍须链接 owner，而不是复制生成清单。

**证据限制。** 新鲜度可自动判定；“生成内容是否正确表达产品”仍需评审。抽取期未运行 `doc-sync`。

---

<a id="documentation-procedures.naming-and-vocabulary"></a>

### 1.4 规范术语与职责命名

**适用。** 命名新概念、包、类、`ctx` key，或在文档中发现同义词漂移。

**源义务。**

- 每个概念一个规范术语；术语用标准 Markdown 锚点链接到 glossary，实现细节留在包 README 与 Agent Note（`deepseek-harness/docs/glossary.md:3-10@687f282e`）。
- glossary 条目定义边界与反例。例如 `seam` 是包含 Service Definition、Service Provider、Consumer 三种角色的完整可替换能力，绝不是其中一个角色（`deepseek-harness/docs/glossary.md:9-9@687f282e`）。
- 包/类按稳定当前职责命名，不按首个实现、未来扩张或 Cordis 基类。接口包命名能力，实现包加机制/协议/环境/厂商限定（`deepseek-harness/docs/cookbook/adding-a-package.md:42-73@687f282e`）。
- `ctx` key：单引擎/运行时/策略/控制器/解析器/存储/当前配置用单数；注册表或拥有多个命名成员的服务用复数；类角色与 key 单复数一致。
- 职责词表：`Controller` 接受命令/意图并改变一个既有域或呈现状态；`Store` 拥有一个数据集与 CRUD/快照/订阅；`Directory` 暴露可发现条目；`Presenter` 纯转换；`Registry` 拥有动态命名注册及优先级/生命周期；`Runtime` 运行活工作并拥有 dispatch/cancel/生命周期；`Resolver` 计算一个答案但不拥有其生命周期；`Binder` 绑定一个声明接口到调用方上下文并返回绑定值；`Engine` 实现域算法；`Policy` 决定允许/选择/限制但不执行机制；`Executor` 执行一个显式请求；`Gateway` 适配进程/网络/RPC/API 边界；`Provider` 提供能力的一个实现；`Backend` 实现可替换底层存储/传输/执行；`Handle` 指一个活资源；`Config` 拥有一个解析配置；`Service` 只在没有更精确角色时使用。
- `SDK` 只指受支持的 Python/TypeScript JSON-RPC 协议；产品拼写用 `Typert`，不用 `TypeRT`/`typeRT`。
- 文档直接命名 actor 与事实；保留 `seam` 给已定义能力；用确切检查/类型/API/操作，而非隐喻性的 `gate`、`vocabulary`、`surface`（`deepseek-harness/docs/AGENTS.md:38-48@687f282e`）。

**步骤。** 先查 glossary；没有则写条目（定义、边界、反例、链接）；按职责词表选名；文档首次使用处链接 glossary；评审检查同义词与新隐喻。

**完成信号。** 新概念有一个可链接条目；名称与角色一致；没有第二个同义术语。

**失败处理。** 同义词漂移或错误角色命名通常能通过编译，只能靠评审要求改名；修正后补 glossary 条目，不要只在代码里改。

**例外。** 历史名称与上游 vendored 名称可保留；`deepseek-harness/docs/rescope.md:23-32@687f282e` 明确 `docs/` 之外的散文保留上游名。品牌与协议名不受职责词表约束。

**证据限制。** 没有自动词汇门禁；一致性完全依赖作者与评审。

---

## 2. 新增能力：cookbook 与文件清单

<a id="documentation-procedures.cookbook-procedure-standard"></a>

### 2.1 Cookbook 页的可执行步骤合同

**适用。** 任何 how-to、迁移步骤、评审流程与操作清单。

**源义务。**

- cookbook 是“带编号验证步骤的 how-to”；机制与理由属于 reference 或 Agent Note，cookbook 链接它们（`deepseek-harness/docs/AGENTS.md:15-37@687f282e`）。
- 页首说明前置条件、参考实现或模板；清单以真实包验证，发现漂移时在页内修正（`deepseek-harness/docs/cookbook/adding-a-package.md:3-6@687f282e`；`deepseek-harness/docs/cookbook/adding-a-vendored-package.md:3-5@687f282e`）。
- 不能直接运行的片段必须明示。`extension-cookbook` 声明片段省略 imports 与实现，不能直接复制（`deepseek-harness/docs/cookbook/extension-cookbook.md:3-5@687f282e`）。
- 收尾给验证命令或明确指向 testing policy 选择检查，而不是只说“测试一下”。
- 专门步骤链接 owner：Session 格式步骤链接格式权威；持久化类型步骤链接记录参考；包/工具/API 步骤链接对应 reference。

**步骤（作者）。**

1. 写清读者目标与前置条件，先链接机制 owner。
2. 按实际顺序写编号步骤；每步给命令、输入或可观察输出。
3. 对易漂移的清单注明模板包与“漂移时改本页”。
4. 末尾写 Verify：命令、预期结果、哪些由 CI 负责。
5. 运行该页涉及的文档检查与行为检查。

**完成信号。** 另一位工程师按页从干净检出完成操作，Verify 全部通过。

**失败处理。** 步骤过时 → 修本页而不是加脚注；机制变化 → 更新 owner 并只留链接；验证缺失 → 评审拒绝。

**例外。** `extension-cookbook` 是形态参考而非完整教程，允许只给模式与链接。

**证据限制。** 没有门禁能判断“这步是否真的可完成”；过时命令只会在执行时失败。

---

<a id="documentation-procedures.package-addition-procedure"></a>

### 2.2 新增 workspace 包

**适用。** 创建 `@deepseek-ai/dsh-<name>` 包、拆分或迁移包。

**前置条件。** 使用 pnpm workspace 与 TypeScript project references；存在 workspace 约束与 README 章节门禁。

**源义务（摘要，完整清单见 `deepseek-harness/docs/cookbook/adding-a-package.md:7-170@687f282e`）。**

1. 目录含 `package.json`、`tsconfig.json`、`src/index.ts`、可选 `locale/en.json` 与 `locale/zh.json`、`README.md`。
2. `package.json` 不变量：`private: true`；`version` 与根一致；`type: module`；`main: lib/index.js`；`types: lib/types/index.d.ts`；`exports["."].types/default` 指向对应产物；`@deepseek-ai/cordis` 同时在 `peerDependencies` 与 `devDependencies` 且范围一致；每个 dsh peer 在 devDependencies 镜像；`@deepseek-ai/schemastery` 在 `dependencies`；`files` 精确列出 `lib/index.js`、`lib/types/**/*.d.ts` 与包特定运行时产物。
3. `tsconfig.json` 继承根 base，设置 `rootDir: src`、`outDir: lib/types`，并 references 所需 vendored 包与 dsh 依赖。
4. 普通包只注册进一个聚合：Host 包进 `tsconfig.host.json`，Client 包进 `tsconfig.client.json`。`api/remotes` 的 Host/Client 拆分是特定例外，新包不得照抄。`packages/client/*` 还继承 `tsconfig.base.client.json`，声明 `dsh.client`，导出 `./client` 并使用共享 tsdown preset。
5. 新 group 是纯容器：无 `package.json`、无源文件，包仍恰好在 group 下一层。
6. 按 §1.4 的职责词表命名包、类与 `ctx` key。
7. README 写服务 API、配置、事件、扩展点、设计说明；Model Experience 与 `## Known Limitations and Deferred Work` 章节受门禁约束；审计为无限制的包必须登记在 `scripts/verify-package-readme-limitations.ts` 的 allowlist 并给出理由（`deepseek-harness/scripts/verify-package-readme-limitations.ts:1-21@687f282e`）。
8. 可选 display metadata：`locale/en.json` 与 `locale/zh.json` 的 `meta.title`/`meta.description`；导出 `./package.json` 与 `./locale/*.json`；图标受大小、格式与路径约束。

**验证序列（【源义务】）。**

```sh
pnpm install
pnpm run doc-sync
pnpm run constraints && pnpm run typecheck && pnpm run lint
pnpm run build && pnpm run hygiene
```

再按 `deepseek-harness/docs/testing.md:7-18@687f282e` 选择行为检查。

**完成信号。** 上述命令通过；评审确认 group、角色命名与 README 合同合理。

**失败处理。** `constraints` 指出 manifest/引用问题；`doc-sync` 指出 README 章节或配对问题；`typecheck` 指出聚合注册或类型问题。按错误修源，不要放宽约束。

**例外。** allowlist 中审计为无限制的包可省略 limitations h2，但必须给出理由；Client 包有额外 base/preset 要求。

**证据限制。** Model Experience 的语义正确性无法自动验证；本域未创建包或运行命令。README 合同细节与 package-contracts 域重叠，本参考只保留 cookbook 侧顺序。

---

<a id="documentation-procedures.tool-authoring-contract"></a>

### 2.3 面向模型的工具

**适用。** 任何注册到 `ctx.tools` 的模型可见能力，包括第一方工具、MCP 工具与动态工具。

**源义务（`deepseek-harness/docs/cookbook/adding-a-tool.md:40-98@687f282e`）。**

- **参数校验。** `defineTool` 在 `execute` 前按 `ParameterSchemaSpec` 校验类型、必需键、字面量、exact-one 联合与嵌套值；DSL 未表达的非空、正数、跨字段规则仍由 `execute` 检查。原始 JSON Schema 工具自行负责输入校验。
- **注册只读。** 注册借用定义；注册后不得改 schema 或替换回调。热换工具要 dispose owning effect 再注册替代。
- **身份冻结。** 注册表在一个递归 pass 中把 `arguments` 物化为 detached lossless JSON，冻结后分配 `exec.token`；`callId`、`name`、`arguments`、`agent`、`token`、必需的 `signal` 与可选 `parent` 在 dispatch 中不可变。只有 around-dispatch 包装可替换并恢复 `exec.signal`。
- **唯一规范值。** `output.schema` 用 `ValueSchemaSpec`；`execute` 只返回该值，注册表快照、校验、冻结后交给 `output.render(args, value)`。不得返回 content blocks，也不让调用方从散文解析 id/字段。
- **错误语义。** throw 或返回非法值即 `isError`；注册表捕获 throw 并在 observer 前收敛 schema/renderer/metadata/lossless-JSON 失败。成功域结果即使非理想（如非零退出）也放进规范值。
- **取消。** 遵守 `exec.signal`。
- **卡片数据。** 可选 `output.presentationMeta(args, value)` 从同一规范值派生可回放 JSON，持久化在 `tool/result`；嵌套 Code dispatch 跳过投影。
- **异步通知。** 用 `exec.agent`；`agent.inject` 追加的是下一个模型请求可见的持久上下文，不是唤醒。`kind` 必须通过 `MessageSourceMap` 声明；V4 拒绝已退役的 `{kind:'plugin',plugin:...}` 包装。
- **后台工作。** 由 producer config 控制 `run_in_background`，通过 `ctx.jobs.start({kind,label,owner:exec.agent,run})` 发布；成功分支返回带 `jobId` 的规范句柄。发布后用任务自己的取消信号，`exec.signal` 取消只停止等待，不杀死已发布工作。
- **策略分层。** allow/deny/ask 用 `tools/pre-execute`；单调最终拒绝用 `ctx.tools.guard()`；deadline/retry/metrics 用 `tools/execute`；结果变换用 `tools/post-execute`；不可变结果观察用 `tools/result`。
- **UI 呈现。** `presentCall`/`presentResult` 是 `args`（加结果）的纯函数，实时流与回放都运行；不得 I/O、读会话状态、用时钟/随机。UI-only 格式不进入模型结果。Web Client 的专门卡片由 Client 插件注册 `tool.call.toolview`，Host presenter 不会自动产生。
- **PTC。** 可见工具自动成为 `await tools.<name>(args)`；成功解析为策略后的最终规范 JSON，失败 reject 真实 `ToolCallError`。

**步骤。** 先写最小 `defineTool`；为失败选 throw 或规范错误值；需要后台时接 `ctx.jobs.start`；需要卡片时写纯 presenter；按 testing policy 增加组装/回放/快照。

**完成信号。** 类型检查、参数/输出校验、PTC 调用、回放卡片与组装测试通过。

**失败处理。** 返回 content blocks、修改已注册 schema、presenter 做 I/O、把 `exec.signal` 当任务生命周期，都会被运行时或评审拒绝。

**例外。** MCP 原始 schema 工具自行校验；嵌套 Code dispatch 不生成卡片。

**证据限制。** presenter 纯度很难完全自动化；本域未运行工具测试。

---

<a id="documentation-procedures.remote-api-addition-procedure"></a>

### 2.4 新增或修改 Remote API

**适用。** 任何通过 `ctx.remote` 暴露或消费的端点。会话事件流、分页、增量与 projection 明确不属于 Remote，不得伪装成 Remote 方法（`deepseek-harness/docs/api-gateway.md:162-172@687f282e`）。

**五步（【源义务】，`deepseek-harness/docs/cookbook/adding-a-remote-api.md:7-197@687f282e`）。**

1. **声明 API。** Host 侧服务继承 `TypertRemoteService`，绑定 service key 与 wire namespace；用 `@Remote` 标注对外方法。只有形状需调整（补 `signal`、换参数顺序、换导出名）才写 `remoteExport*` adapter。lookup 对象（`Agent`、`Session`）只能占顶层参数；协作取消的 `signal: AbortSignal` 必须在最后。
2. **声明失败。** 失败只有一个 `RemoteError`，领域码通过 declaration merging 合并进 `RemoteErrorDetailsMap`。码形如 `<domain>/<reason>`：单生产者就地声明；多包生产者在最低共同域声明；`gateway/bad-request`、`gateway/cancelled`、`gateway/internal` 与 gateway 基础设施码只使用不复制；不跨 wire 的本地失败不进码表。不要建领域错误类家族或 exit-mapping 函数；只把任意 provider 异常分类为一个域码并附 `cause`。
3. **在包上注册。** `@Remote` 必须位于 Loader 入口插件包；manifest 增加 `./typert` 与 `./remote` 导出及 protocol peer 依赖；Client 由 `@deepseek-ai/dsh-api-remotes` 组装并再导出类型词汇。
4. **在 Client 消费。** 调用方 `inject` 同时声明 `remote` 与 `remote.<namespace>`；直接调用 `ctx.remote.<namespace>.<method>(...)`；结果为 `RemoteResult<T>`，用 `if (!result.ok)` 与 `code` 分支，不用 `instanceof`。异常流用 `throw result.error`，捕获方用 `isRemoteFailure` 区分远端失败与本地缺陷。不要写防御性 catch。`ctx.remote.$host` 的 `home`/`isLoopback` 是普通读取，重连后通过 `connection/reset` 刷新。
5. **测试。** owner 侧用 `remoteErrorOf` 断言 `code` 与 details，不深比较错误对象；Client 侧从 `@deepseek-ai/dsh-client-test-runtime` 取真实 `RemoteError` 与 `TestRemote` 实例。

**收尾验证。** 修改签名、码表、namespace 或 export 名后必须 `pnpm run build:lib`；只改实现体不需要重新生成（`deepseek-harness/docs/api-gateway.md:144-161@687f282e`）。再跑 `pnpm run typecheck`、按名跑两侧 spec；产品可见时补录制会话快照。

**完成信号。** 生成契约与 Client codec 更新；两侧测试通过；错误码在正确的包。

**失败处理。** 非严格签名、缺 lookup/provider、未重生成、码表复制都会在构建或首次调用失败。`pnpm run build:lib:client` 只能在 Host 契约已刷新后运行；干净工作树不能跳过 Host 阶段。

**例外。** 只改实现体不重生成；SRC 回退只解决从源码运行的 Host 分派，不替代生成契约。

**证据限制。** 生成器与 Gateway 内部实现属于其他域；本域未运行 build 或测试。

---

<a id="documentation-procedures.settings-card-procedure"></a>

### 2.5 即时配置表单（设置卡）

**适用。** 插件需要运行时配置编辑，或需要向插件详情页贡献 UI。

**源义务（`deepseek-harness/docs/cookbook/adding-a-settings-card.md:7-72@687f282e`）。**

- 在 Config schema 中用 `Volatile<T>` 声明即时字段；运行时读 `.get()`，需要一致快照时只捕获一次。
- 跨字段校验用 `.check()`；它在 Host 持久化前运行，不进入序列化表单 schema。
- 每个实例使用唯一 profile entry id；自定义 profile 先读包 README 再挂载 settings/config-editor。
- `role('secret')` 阻止值进入表单响应；凭据引用交给 credentials 域；普通字段不放进 settings schema。
- 验证编辑：改字段保存后检查 profile patch、下一次消费、插件实例 identity 不变、重启恢复；拒绝非法值后文件与实时值都不变。
- 贡献其他插件页面时注册 `plugins.detail.actions` / `plugins.detail.badge` / `plugins.detail.section`；每个条目用页面 `subject`（bundle/row/item），对不关心的 subject 返回 `null`。
- 浏览器半侧由 client module system 扫描 `dsh.client` 提供，只附着在裸包名对应的 Loader 行；子路径行不带半侧；页面需比其它行长寿时拆成独立包。`whileServed` 可让页面恰好在 Host 服务该命名空间期间存在。

**完成信号。** 保存后 patch/实时值/identity/重启四项都符合预期；非法值被拒绝且无副作用；跨页贡献对未知 subject 返回 null。

**失败处理。** 值不热更新 → 检查是否用了 `Volatile` 与 `.get()`；secret 出现在响应 → 检查 `role('secret')` 或凭据引用；页面随错误行消失 → 检查半侧挂载的包名。

**例外。** 内置命名空间的伴生包可以是空 Host `apply` 的纯客户端包。

**证据限制。** UI 与 HMR 端到端行为未在本域执行；可访问性仍需 UI 评审。

---

<a id="documentation-procedures.plugin-preview-procedure"></a>

### 2.6 内置插件功能配图

**适用。** 编辑 Plugin Manager 的 `BUNDLE_PREVIEWS` 或资产。

**源义务（`deepseek-harness/docs/cookbook/adding-a-plugin-preview.md:7-52@687f282e`；实现校验见 `deepseek-harness/scripts/builtin-plugin-preview.spec.ts:1-77@687f282e`）。**

- 每个 bundle 零或一张逻辑配图；英文与中文是同一图的替代版本，不是图库。
- 仅 SVG：`width="640" height="300" viewBox="0 0 640 300"`（32:15）。不接受栅格预览或其他尺寸。
- 自包含：不得含字体、远程资源、script、事件 handler、animation、stylesheet、`text` 或 `foreignObject`；文字转路径。`image` 只能嵌入不变的官方品牌 PNG/JPEG/WebP base64 data URL。
- 两语言文件合计 ≤ 1 MiB（会被 base64 内嵌进 Client bundle）。
- 在 `packages/client/ui-plugin-manager/src/client/assets/` 放 `<feature>-preview.svg` 与 `.zh.svg`，导入并在 `BUNDLE_PREVIEWS` 加精确包名与 `{en, zh}`。
- 页面合同：描述与状态通知之下、组件与来源之上；上 24px、下 32px；单个 `<img>`，自然 640×300，最多可用宽、最高 320px，比例缩放；当前语言选一个文件；未激活也可见；解码失败显示本地化提示且不阻塞。
- 验证：运行 preview spec、Client component spec、CSS spec 与 `pnpm run build`；在真实页面检查英中、明暗、390px 无横向溢出，并覆盖无图与第三方插件。
- PR 证据从最终干净提交录制，并准确标注演示范围。

**完成信号。** spec/build 通过；真实页面双语与主题检查通过；证据可复核。

**失败处理。** 尺寸/禁用元素/超限/未注册都由 spec 指出；视觉问题由评审指出。

**例外。** 官方品牌图可作为 base64 image；小插件图标是纯几何；第三方插件没有配图接口。

**证据限制。** spec 只验证格式，不验证图像表达是否准确或美观。

---

<a id="documentation-procedures.vendored-package-procedure"></a>

### 2.7 新增 vendored 上游包

**适用。** 需要另一个上游 Cordis 包，或更新/修改已 vendored 包。

**源义务（`deepseek-harness/docs/cookbook/adding-a-vendored-package.md:7-59@687f282e`）。**

- 固定源码放在 `vendor/<dir>/`，不加 npm 依赖。
- 复制 `package.json`、`tsconfig.json`、`src/`，上游若有 `README.md`/`LICENSE` 一并保留。
- `tsconfig.json` 继承根 `tsconfig.base.json`，`rootDir: src`、`outDir: lib/types`，放宽上游所需严格项，并为每个被引用的 vendored 包加 `references`。
- `package.json`：按 `deepseek-harness/docs/rescope.md:7-21@687f282e` 的映射 rescope 名称；保留上游 `exports`/`type`；声明元数据指向 `lib/types`；发布 `.d.ts` 与 `.d.ts.map`；cordis 依赖放 `peerDependencies`。vendored 包是可发布 release member，因此不得 `private: true`，且要 `publishConfig.access: public`。
- 根配置：`tsconfig.base.json` 的 `paths` 加 `"<npm-name>": ["./vendor/<dir>/src"]`；`tsconfig.host.json` 的 `references` 加项目（位于 `packages/*` 之前）；`vendor/README.md` 加 manifest 行并记录本地修改；只有该包本身发布时才改 `scripts/publint-all.ts`。
- 源码相对导入使用显式 `.ts` 说明符；vendored 源码必须经自己的 `vendor/<dir>/tsconfig.json` 引用，不得拉进聚合的严格 program。
- `scripts/check-vendor-manifest.sh` 是 pre-commit hook：`vendor/*/src` 或 vendored `bin.js` 的暂存变更必须同时暂存 `vendor/README.md`（`deepseek-harness/scripts/check-vendor-manifest.sh:1-17@687f282e`）。失败时补 manifest 行，不跳过 hook。
- 验证：`pnpm install`、`pnpm run typecheck`、`pnpm run build && pnpm run constraints`，再按 testing policy 跑行为检查。
- 上游 sync 后重跑 `pnpm run rescope-vendor --apply`，并执行它打印的 `pnpm install`、`pnpm run gen-third-party-notices` 与 `pnpm run verify-translation-pairing --write`（`deepseek-harness/docs/rescope.md:42-53@687f282e`）。

**完成信号。** manifest 同步；hook/typecheck/build/constraints 通过；隔离边界保持。

**失败处理。** hook 拒绝 → 补 `vendor/README.md` 并重新暂存；编译进入聚合 → 修 references；rescope 后文档未同步 → 重录配对并跑再生成。

**例外。** vendored 依赖通常不发布，可跳过 publint 修改；每包 `tsdown.config.ts` 只在构建形态偏离根默认时需要。

**证据限制。** 本域未运行 hook/build；上游版本与本地 patch 的语义正确性无法由格式检查保证。

---

<a id="documentation-procedures.llm-adapter-procedure"></a>

### 2.8 新增 LLM 适配器

**适用。** 接入新模型提供方或修改其流协议翻译。

**源义务（`deepseek-harness/docs/cookbook/adding-an-llm-adapter.md:7-43@687f282e`）。**

- 继承 `LlmAdapter`，实现 `async *stream(options): AsyncIterable<StreamChunk>`，通过 `ctx.llm.registerAdapter` 注册。注册是 effect；同一 provider route 重复注册会抛错，多路由注册全有或全无。
- `usage` 必须在 `finish` 之前发出；`finish` 之后不得再发任何 chunk。推荐缓冲到提供方流结束标记再 flush。
- 工具调用 `arguments` 端到端是原始 JSON 字符串；流片段用 `argumentsDelta`；提供方给对象时在 `block-end` 重新字符串化。
- block `index` 按首次出现顺序分配；同一块的每个 delta 复用该 index。
- 错误只有两条合法路径：从 `stream()` 抛出（传输/协议失败，用带稳定 code 的 `LlmError`），或以 `finish {kind:'error'|'aborted'}` 结束（提供方 in-band 失败）。按失败类别选择并记录。
- 遵守 `options.signal`；把不支持 `GenerateOptions` 字段的情况抛 `LlmError(..., 'UNSUPPORTED_OPTION')`，不得静默丢弃。
- 需要原生 follow-up 元数据时，把最小无损 JSON 投影放进 `finish.replayState` 并在重建历史时校验；只在同一 adapter 实例仍拥有历史与目标路由时传回。
- `resolveModel()` 提供 provider/model 身份与可选 `context`/`reasoning`；只在确有时声明 `defaultEffort`；reasoning effort 是有序不透明 id，不暴露 wire 拼写、不钳制不支持值。
- 保持 wire 类型、请求序列化、传输解析、chunk 翻译与 adapter 类分离。

**完成信号。** 类型检查、适配器测试与真实提供方冒烟通过；顺序、索引、错误路径符合合同。

**失败处理。** `finish` 后再发 chunk、静默丢弃不支持选项、混淆错误路径，都会在消费方或测试暴露。

**例外。** 真实 API 测试在无密钥时自跳过；这证明无密钥环境不阻塞，不证明提供方行为。

**证据限制。** 提供方行为可能变化，需带密钥回归；本域未运行适配器测试。

---

## 3. Session 格式与持久化

<a id="documentation-procedures.session-format-authority"></a>

### 3.1 三类格式真源与发布推进

**适用。** 改当前 Session 格式、准备发布、判断页面上的格式数字是否可信。

**三类真源（【源义务】，`deepseek-harness/docs/session-format-status.md:1-63@687f282e`）。**

| 真源 | 位置 | 说明 |
|---|---|---|
| 代码 writer | `packages/core/session/src/types.ts` 的 `SESSION_FORMAT_VERSION` | 代码中唯一手工维护的当前写入器版本；catalog generator 推导 codec 顺序并要求相邻迁移到达它 |
| 定稿基线 | 同页 `session-format-finalization`：`latestFinalizedVersion: 4` | 已接受兼容性基线；V4 checkpoint 在 `docs/persistence-changes/finalized/v4.json`；不代表已发布，也不冻结未来的同版本增量 |
| 发布记录 | 同页 `session-format-release`：`latestReleasedVersion: 4`，`evidenceTag: dsh-v0.2.0-rc.2` | 只表示已发布格式；同页给出 tagged writer 路径 `packages/core/session/src/types.ts` |

- 包版本、codec 导出名、fixture 文件名、投影缓存版本都不是 writer 权威。
- 比较 writer 与发布记录：相等表示该格式已发布；writer 更高表示尚未记录为已发布；与较新分支的已核实记录比较时，较低 writer 表示旧格式。同一 checkout 内的反向大小关系由本地一致性门禁拒绝。不维护单独的 `released` 布尔。
- alpha、beta、RC 产品发布都确立已发布 Session 格式义务；GitHub 的 prerelease 标记不会让持久化用户数据成为可丢弃数据；缺少发布记录不等于未发布。
- 其他文档链接本页，不复述 writer/released/finalized 数字。

**发布推进。**

1. 实现升版时：更新代码常量与相邻 catalog；不得在产品发布前推进发布记录。
2. 产品首次发布更高格式时：确认发布事实与对应 tag 的 writer，然后在同一次双语更新中推进 `latestReleasedVersion`、`evidenceTag` 与 tagged writer 路径。
3. 后续携带相同格式的发布无需改记录；开发主干上的记录绝不降低。
4. 一般行为写“current format”/“next adjacent version”；固定迁移 I/O、wire schema、历史证据与针对特定版本的测试保留明确数字。
5. `doc-standard.spec.ts` 检查记录结构、双语相等、evidence tag 与 writer 路径一致性，以及记录中的发布版本不超过 checkout writer（`deepseek-harness/scripts/doc-standard.spec.ts:162-219@687f282e`；`deepseek-harness/scripts/doc-standard.spec.ts:220-299@687f282e`）。它是无密钥检查，不查询 GitHub，也不证明记录最新。

**完成信号。** 页面的 writer/finalized/released 三者关系与代码和已验证发布事实一致；其他页面只有链接。

**失败处理。** 页面数字过期 → 改页面或链接，不改代码常量；发布记录错 → 它已是历史，不能改，只能在下一条记录修正并在状态页说明；把“已定稿”当“已发布” → 回到本页区分两者。

**例外。** 代码中的格式常量仍是 writer 身份的一部分，必须随实现改；状态页描述的是发布语义。

**证据限制。** `doc-standard.spec.ts` 绑定状态页的记录结构、双语相等与 writer 上界；它不证明 `evidenceTag` 真的已发布、远端状态最新，也不覆盖其他页面中复述的数字。发布推进仍是人工流程；本域未运行该测试。

---

<a id="documentation-procedures.persistence-type-change-record"></a>

### 3.2 持久化类型变更的准入与决策记录

**适用。** 新增、修改或删除 `packages/core/session/src/types.ts` 中持久化的消息类型、内容块或元数据。

**前置条件。** 已读 `docs/session-format-status.md` 的当前格式与定稿基线；有可比较的 base/head；能生成持久化 catalog。

**步骤（【源义务】，`deepseek-harness/docs/cookbook/reviewing-persistence-type-changes.md:7-122@687f282e`）。**

1. **可选预览。** 在仓库根运行 `pnpm --silent run verify-persistence-changes --json`。读报告中的 `root`、`path`、change kind 与 `requiresCompatibilityReview`；消费 JSON 时用 `--silent`，否则 pnpm 会把生命周期失败文本追加到 stdout。失败命令仍以退出码 1 结束。
2. **读影响面。** 被引用类型可能影响多个事件摘要；检查每个受影响的 root。在历史覆盖新 schema 之前验证会失败；陈旧生成清单也会失败，记录命令会刷新它。若重排字段或联合分支后 `changes` 为空，运行 `pnpm run gen-persistence-catalog` 并重查。即使复制的声明或源码位置产生 catalog diff，未变的摘要无需新增确认记录。
3. **独立 base/head 评审。** 先把 base 与 head 的 catalog 保存为本地 JSON，再运行 `pnpm --silent run persistence-review --before .artifacts/base.schema.json --after docs/persistence-schema.json`；加 `--json` 取结构化输出；记录这些文件对应的 commit。`--check` 只比较当前源码与已确认历史，记录完成后不能替代 base/head 评审，也不能证明人类已评审。
4. **读基线并评估两个方向。** 先读 `docs/session-format-status.md#finalization-record` 的已接受基线，保留其锁定记录；按 `docs/persistence-changes/README.md#compatibility-rules` 评估读与写两个方向。
5. **写双语 prose。** 本地 JSON 的 `en` 与 `zh` 各含 `summary`、`compatibility`、`verification` 字符串。`verification` 必须是实际执行过的检查，不是猜测；CLI 不会证明这些声明。
6. **记录。** 运行 `pnpm --silent run persistence-changes --record <date-slug> --prose .artifacts/persistence-change.prose.json --json`。命令在写入前验证历史与双语说明、推断已明确允许的同版本决策、检查显式兼容性决策；它生成记录对、完整 after schema、两个 catalog、机器清单与配对记录。省略 `--prose` 会留下被验证拒绝的草稿。
7. **兼容性决策。** `requiresCompatibilityReview` 的变更必须在 Compatibility 说明两个读取方向，在 Verification 记录已执行检查。证据支持保持版本时提供 `--decision same-version`；记录或更新被标记的变更时，若头版本未变且缺少显式决策，会以 `decision-required` 失败。结构差异本身不推断升版；实际 header 版本递增可以推断 `version-bump`。若有效判别信息无法阻止不安全解释，按 §3.3 升版并选 `--decision version-bump`；该记录必须包含自身的 `SessionHeader.version` 递增转换。日常变更不创建另一条基线。
8. **验证。** 按 testing policy 选所属模块的行为检查，再运行 `pnpm run doc-sync`（持久化清单/目录新鲜度、完整历史、双语配对）。记录命令的 `ok: true` 不能替代 owner 行为与迁移测试。JSON 失败响应保留 `ok: false`、诊断 `code` 与退出码 1；结构化变更含稳定 kind 与逐根 before/after 摘要。
9. **更新未接受的尾部。** 记录后源码又变化时，用 `pnpm --silent run persistence-changes --update <id> --prose <file> --json` 刷新同一条未接受记录；省略 `--prose` 保留已有说明。按完整转换重评说明；被标记的同版本更新需 `--decision same-version`。更新会拒绝初始基线、其他记录所依赖的记录，以及已被定稿 checkpoint 锁定的记录。集成产生竞争尾部时，按剩余历史更新未接受记录并重评最终 diff；无关 root 的确认无需刷新。
10. **不要复用旧解释。** 已有属性的值类型变化需要评审时，先改 Compatibility/Verification，解释实际的新转换与已执行检查；不要为不同变更复用先前“必选改可选”的说明。

**完成信号。** 记录与报告一致；双语 prose 说明真实兼容性与已跑检查；基线/目录/配对已刷新；`doc-sync` 通过。

**失败处理。** 未审阅 → 只读重跑报告；记录与基线不一致 → 重新生成；竞争记录 → 保留双方，不抹除；需要兼容审阅却标 compatible → 评审拒绝；更新锁定记录 → 改为创建后继。

**例外。** 记录是设计决策，不是发布日志；不要把普通 bug 修复写成持久化格式变更。

**证据限制。** 兼容审阅本身是人工判断；`requiresCompatibilityReview` 是机器筛选，不是结论。抽取期未运行 CLI。

---

<a id="documentation-procedures.session-format-version-procedure"></a>

### 3.3 新增 Session 格式版本（格式链）

**适用。** 需要新增格式整数，或改变格式链/邻接边。

**六步（【源义务】，`deepseek-harness/docs/cookbook/adding-a-session-format-version.md:21-149@687f282e`）。**

1. **定版本与发布基线。** 只有有效判别信息无法阻止不安全解释时才升版；header、事件封装、事件语义或重建结构的变更按 reader-compatibility 规则评估，不会自动升版。区分 Session 格式整数与包发布、SQLite schema、投影单元、协议包装版本。N 取 `docs/session-format-status.md` 中已接受或已发布的最新版本；已接受 V4 后，即使尚未记录 V4 发布，此次升版也需要 V5；经评审的同版本演进不需要这一步。
   - 为 N+1 使用共享的 `release/*` 集成基线。基线变更添加 writer、codec、catalog 接线、恒等迁移与验证。从该基线创建各个独立子分支，PR 目标设为发布分支，而非另一个子分支。每个子分支在同一个相邻迁移包内添加自身的结构变换、校验器、消费方与测试；不要只为表示评审顺序而分配额外版本。评审后的子分支经 PR 合入发布分支，发布前验证组合结果；遵守发布分支的强制推送与删除保护，不要强制同步。
   - 已发布 codec 保留已接受的解释；当前 codec 可以接纳有明确判别信息的分支，同时保留历史可读性；不要为接纳当前功能而放宽旧 codec。N+1 发布后，只要输出仍兼容 N+1，N→N+1 转换器就可以修复或增加历史场景支持；记录映射变化及既有输出如何继续得到支持；任何新的目标表示都须应用读取器兼容性规则。
   - 同版本日志跳过相邻迁移，恢复后可以混合历史与较新的记录分支。每个整数标识一组受支持表示，而非固定 schema；所属读取器必须保留并区分这些分支，下一条向外迁移必须处理它们。不要添加同版本迁移，也不要仅依赖 `restoreCurrent` 做归一化。

2. **创建相邻迁移库。** 创建 N→N+1 库而非挂载插件；在 `package.json` 声明 `dsh.sessionFormatMigration` 的 `from`/`to`/`export`/`migration`/`sourceCodec`/`targetCodec`/`targetHeaderValidator`/`targetRestorer`。复用前一条边导出的源 codec，不复制。把 `SESSION_FORMAT_VERSION` 设为 N+1 并运行 `pnpm run gen-session-format-catalog`。生成器要求 0..writer 每步恰好一条相邻边、名称与导出匹配、依赖声明完整；缺边/重复/额外/未知成员都拒绝。修声明，绝不手改 `generated.ts`。

3. **实现迁移 Stage。** 使用 `Stage` 接口实现 `transformEvent`、`transformRun`、`finish`；每个 `createStage` 拥有独立状态，不跨 Session 复用；同步 emit，零/一/多输出皆可；继承的 `cut` 是逻辑事件数，未知时不得填 0。显式定义新边的事件准入与转换规则；V2→V3 与 alpha V0→V1 的规则只属于各自历史边，不推广到新边。保留 opaque 数据，无法映射时可显式拒绝。用原生写入器输出作 oracle：同一输入分别过旧/新 writer，比较迁移输出与原生输出（只掩码文档化的 volatile 字段）。

4. **追踪所有 current-version 消费方。** 包括创建/恢复、JSONL 命名与发布、catalog encoder/restorer、投影缓存 identity、回放/快照、fixture 布局、TS/Python SDK 录制；current 值使用 writer 常量，历史字面量留在旧 codec 与 fixture。

5. **快照后继。** 需要当前代际后继时，用目标版本规范命名新建 parent/child 快照，保留每个历史文件；不得把前代重命名为目标名或只改 header；验证前代字节不变、父子角色连续。

6. **验证与文档收尾。** 运行 `verify-session-format-catalog`、相关 Vitest、corpus 回放；新增边后把其测试路径加入。要求 strict restore、identity、拒绝畸形/未知必需事件、重复恢复确定性、独立并发 stage、seeded 多跳与无 fallback。
   - 发布前若仍是 V3 写入而集成已 V4，按 pinned 本地 commit 运行 `pnpm run verify-v3-event-vocabulary --source-ref "$V3_SOURCE_REF"`（`V3_SOURCE_REF="$(git rev-parse --verify 'origin/master^{commit}')"`）。校验器只读该 commit，要求事件名完全相等；拒绝遗漏的 V3 名称、额外复制的名称，以及不写入 V3 的源提交。不要把 V4 专有的 `developer/message` 放进冻结的 V3 集合。逐项核对 V3 payload、必要转换、目标接纳及消费方；只添加名称不能证明迁移完整。命令不 fetch，也不证明远端新鲜度；操作者必须确认所选 commit 是此次集成包含的最新 V3 写入，陈旧 ref 或旧 pin 的通过不足。把核验过的 id 记入发布验证；若 master 已写 V4，复用已记录的最终 V3 提交。V4 发布后，V3 词汇仍绑定该历史源，后续 V4 事件新增不更新它；常规静态 CI 不依赖可变的 master ref。
   - 更新 owning Agent Note；发布前保持 release record 不变，发布后按已验证证据推进；双语一起改并用 `--write` 重录，再跑 `test:docs`、`doc-sync`、`lint`、`git diff --check`。

**完成信号。** catalog 生成一致；每个后继可解释；新 writer 与 reader 互操作；快照/golden/文档检查通过；V3 词汇 pin 有操作者确认记录。

**失败处理。** 缺边 → 补迁移库声明；生成器拒绝手改 → 改声明；旧 reader 静默误读 → 加显式拒绝；V3 词汇漏新事件 → 更新 pin 并说明来源；快照前代被改写 → 恢复原字节并重建后继。

**例外。** 同一目标只保留一条 canonical 后继；额外 fixture 不得覆盖 golden；发布记录可先留到实际发布再推进。

**证据限制。** 快照与 vocab 只证明本地生成一致；远端最新 V3 与目标仓库 CI 未验证。本域未生成 catalog 或运行 corpus。

---

## 4. 事故复盘：准入、结构与防护栏

<a id="documentation-procedures.postmortem-admission"></a>

### 4.1 复盘准入与叙事边界

**适用。** 一个 bug 已修复，判断是否写 postmortem，或评审一篇复盘。

**准入门槛（三条全中，缺一不写；`deepseek-harness/docs/postmortem/README.md:3-11@687f282e`）。**

1. **隐蔽。** 机制非显而易见，细心的工程师也要费一番功夫才能重新推导。
2. **系统性。** 逃逸原因是测试/工具/约定的缺口，而不是单点笔误。
3. **重发现昂贵。** 它已经耗费真实调试时间，未来还会再次耗费。

**明确不是复盘的。** Agent Note（记录深思熟虑的设计决策、被拒替代或未来工作）；普通 bug 修复；能用单个回归测试完整表达的缺陷（修测试即可）。

**写作要求。**

- 编号 `NNNN-<topic>.md`，以 `## Executive summary` 开篇：一段 30 秒可读的说明，含坏了什么、平实根因、为何逃逸、可长期沿用的教训。
- 随后按 `Summary` / `Impact` / `Timeline` / `Root cause` / `Guardrails` / `Lessons` 组织；有多个根因时分别编号、分别解释。
- 链接该复盘推动的防护栏（测试、AGENTS.md 规则、ADR）；不要只写修复。
- 只写事故叙事与防护栏，不写设计取舍；设计理由交给 Agent Note（`.agents/notes/`），用链接交叉引用。
- 新复盘加入 `docs/postmortem/README.md` 索引并链接其防护栏；新增文件按序号命名并同时更新双语索引。
- 复盘中的事实必须可追溯（持久日志/事件序号、提交、测试名）；不写无法复核的推测为事实。

**步骤。** 对照三条准入门槛；收集时间线/提交/失败断言；写 Executive summary 与详细章节；为每条防护栏链接实际检查或测试；索引；走 §1.1 双语配对。

**完成信号。** Executive summary 与详细章节齐全；每条防护栏有 owner 与证据；索引更新；双语通过。

**失败处理。** 不满足准入 → 写普通 issue 或补测试，不占编号；只有叙事没有防护栏 → 评审要求补检查或删除；把设计理由搬进复盘 → 指回 Agent Note。

**例外。** 事故可能同时产生多个吃家：复盘 + Agent Note + cookbook 步骤，但每份只保留自己的事实。

**证据限制。** 三条门槛是编辑判断，不能自动检查；本域已读四篇复盘的中英文正文，但未重新运行其测试。

---

<a id="documentation-procedures.postmortem-evidence-and-guardrails"></a>

### 4.2 复盘证据与防护栏质量

**适用。** 写“Root cause / Guardrails”两节，或评审防护栏是否真的能阻止复发。

**源义务与源实现事实（以四篇已读复盘为证据）。**

- 0001：两个根因同时存在——ACP 的 `export default apply` 让 Loader 丢弃 `inject`，以及 optional service 在插件加载时经 traceable shadow 的祖先遍历失败。178 个绿测试、100% 行覆盖仍没发现，因为测试走 `ctx.plugin()` 而不走真实 Loader 边界，且唯一驱动 `session/new`/`session/load` 的测试被 key gate 跳过（`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:11-26@687f282e`）。防护栏是真实 Loader no-key e2e、正确 `TSX_TSCONFIG_PATH`、`ctx.get(name)` 读取 optional service、以及 `testing.md` 的真实入口规则（`deepseek-harness/docs/testing.md:37-40@687f282e`）。
- 0002：Include 只对 `entry.options.config` 插值 `!!js`，不插值 `Entry.disabled`，导致文件系统工具被 truthy 表达式对象永久禁用；快照刷新把 `UNKNOWN_TOOL` 当预期（`deepseek-harness/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:11-46@687f282e`）。防护栏是显式全权限 overlay、`verify-cordis-config` 守卫、快照结果守卫。
- 0003：Web agent 不知道当前 GUI 的 URL/进程/模式，把 HTTP 200 当验收，还验证了替代服务器（`deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:11-52@687f282e`）。防护栏是 `app:web-surface` 打印精确 URL、`$DSH_WEB_URL`、独立 Vite 拒绝启动、分层真实路径测试与浏览器 HMR 测试。
- 0004：共享 `landlock-run:` 前缀加任意非零退出被当 launcher 失败，ripgrep 的退出码被误分类为 launcher；bash 支撑的搜索又用 `SEARCH_FAILED` 遮蔽结构化错误（`deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:11-54@687f282e`）。防护栏是带退出码/精确排除的 `RunnerFailureRule`、settled classifier、ripgrep 经 `ctx.subprocess`、partial-landlock 回归与一个组装场景。

**防护栏写法（【迁移设计】）。**

1. 防护栏必须是可执行检查或明确的人工审查步骤；不要写“以后注意”。
2. 优先在真实入口/组装边界测试，而不是在单元替代物上重复绿色。
3. 检查失败要指向事故现象，而不是只断言某个内部字段。
4. 根因有多个就分别列防护栏；不要把两个根因合并成一个测试。
5. 明确防护栏的能力上限（例如快照只能证明 shape，不证明语义）。
6. 区分自动防护与人工评审；不要把“已写进文档”当成自动保证。

**完成信号。** 每条根因至少对应一条能在目标 checkout 运行的检查，或一条写明 reviewer/owner 的人工步骤。

**失败处理。** 防护栏测的是替代物 → 改到真实入口；快照把错误值当金标准 → 先删预期再生成并评审；防护栏太宽 → 拆到具体失败模式；防护栏在未修复代码上仍绿 → 它什么也没守住，重写。

**证据限制。** 复盘是历史叙述，防护栏的当前有效性要在目标提交重新运行；本域未运行任何一篇复盘的测试。

---

## 5. 评审协作

<a id="documentation-procedures.stacked-pr-review-response"></a>

### 5.1 堆叠 PR 的评审响应与修复归属

**适用。** 一个 PR 属于 GitHub stack，收到多个线程评审。

**源义务（`deepseek-harness/docs/cookbook/responding-to-pr-review-on-a-stack.md:3-32@687f282e`）。**

1. **每 PR 一个 worktree。** 并行修复不共享 checkout；同一 PR 复用同一 worktree。
2. **GitHub stack 对象是权威。** base 分支只给依赖顺序；必须检查 `PullRequest.stack` 与 `stackEntry.position` 才能称为官方 stack。不要手算 base 分支。
3. **修复归属。** 缺陷落在哪一层就改哪一层；修复落在引入问题的 PR，再沿子链向上传播。即使子 PR 也含该文件，也不能在下游起源修复。
4. **独立 commit。** 每项评审修复保留为独立 commit；只 amend 自己尚未推送且未评审的工作。
5. **改写安全。** merge-forward 与 rebase 都可接受；改写推送必须 lease-protected，远端前移时中止，禁止裸 `--force`。
6. **先复核论断。** 按代码事实复核每条意见；正确症状也可能伴随错误诊断。
7. **传播后逐层验证。** `gh stack sync` 可能先发布，因此需要同步后立即验证。
8. **线程回复。** 回复在线程内（review comment replies），说明修复与承载它的 commit/head；不发顶层评论。
9. **改写后重审。** 重新审计未解决线程、批准、可合并性与检查；旧 commit OID 或过期内联锚点不是当前证据。
10. **只通过官方 stack 流程落地。** 未链接时按作者规则自动链接或询问；缺少原生堆叠支持时硬停。

**完成信号。** 每条评论有答复；修复在正确层；stack 的 base/head 关系未被破坏；受影响 PR 已重新评审；旧批准失效时已请求复审。

**失败处理。** 改写覆盖了他人修改 → 停写、用 worktree 与 `git status` 恢复；base 错误 → 用官方 stack 视图校正，不手工改 base；旧批准失效 → 请求复审。

**例外。** 用户明确要求 squash/改写；否则保持独立 commit。

**证据限制。** GitHub stack 命令与权限在目标仓库需实跑验证；本域未执行任何 git/gh 操作。

---

<a id="documentation-procedures.code-review-skill-maintenance"></a>

### 5.2 仓库专用评审 skill 的维护流程

**适用。** 运行 `dsh-code-review` 的周期维护、处理候选、失败或陈旧窗口，或交接给新操作者。

**源义务与源实现事实（`deepseek-harness/docs/cookbook/maintaining-dsh-code-review.md:3-64@687f282e`）。**

- 这是单操作者周期工具；工具源码、评审适配器、提供方凭据与调度器是操作者的私有基础设施，位于仓库之外。仓库只记录工作流保证什么，不记录如何实现。
- 按窗口选择已合并且 merge commit 可从 `origin/master` 到达的 PR（每天默认 2 个 UTC 日，每周 7 日）。合并 commit 不可达（如父分支被 squash）或超出 250 个 commit 获取上限的 PR 记入 `skipped-pulls.json` 并跳过，不中止运行。
- 只收集带 commit 锚点的 pre-merge 人工反馈；比较反馈时间与最终 patch；不获取会话评论（没有 force-push 安全基线），排除仅目标分支变更。
- 两个独立配置的 reviewer adapter 先分类作者与是否采纳，再对照当前 skill；主 adapter 起草完整 `SKILL.md`，两者评审同一 diff，阻塞问题循环到双方批准。
- 声明成功前对候选运行 `pnpm run doc-sync` 与 `pnpm run lint`。
- 操作者必须按自身价值阅读 diff，检查清单膨胀、历史叙事、单事故外推、与现有 skill/权威文档重复；不得以“评审者已批准”代替决定。
- 候选三选一：**Discard** 删除；**Batch** 保留待合并，`master` 变化时重做或重评；**Promote** 从干净 `master` 运行 helper，校验 skill blob 未漂移后应用并开 draft PR。
- 晋升 PR body 列来源反馈 URL/ID、落地 commit 范围、来源 run、检查与操作者编辑；漂移时停止，而不是覆盖新指导。
- 不得逐字提交 adapter 输出；收紧措辞、去掉只有结合源 PR 上下文才有意义的示例、把规则并入现有规则，都是预期编辑。
- 无候选是正常结果：记录日志、不通知；适配器总故障必须失败并通知，不得折叠成 no candidate。
- 交接写后续 Agent Note 取代当前 note，记录迁入仓库或新操作者私有设置。

**运行产物。** 保存的 diff、候选 `SKILL.md` 与提升 manifest 按时间戳存放在 `~/dsh-code-review-outputs/`；manifest 记录源 master commit 与 skill blob、源反馈 ID/URL、已落地证据范围、适配器裁决与门禁结果。每个 adapter 的原始 I/O 留在私有临时目录（路径写入通知与 `~/Library/Logs/dsh-code-review-maintainer/` 的每日日志）。维护 worktree 每次运行后恢复干净。

**步骤。**

1. 确认窗口与基线；读上次结束位置。
2. 运行 skill；实际复核窗口 diff，不能只读摘要。
3. 按三选一处理候选；Promote 前从干净 `master` 运行 helper 并检查漂移。
4. 操作者自己评审 diff；核对 manifest 中链接的评论是否确实支持新增规则。
5. 更新日志/通知；失败保留 raw error，不折叠。
6. 交接时写后续 Agent Note。

**完成信号。** 报告可复核；候选有处置；检查已跑；失败/跳过有原因；提升项有可执行规则；交接有后续 note。

**失败处理。** 窗口不可复核 → 停止并说明，不把扫描当成功；适配器 schema/ID 校验失败 → 该批次 fail-closed，保留原始输出；总故障 → 失败并通知；skill 漂移 → Promote 停止，不覆盖。

**例外。** 错过每日运行可用 2 日重叠窗口覆盖；更长间隔用 `DSH_CODE_REVIEW_SINCE=<Nd>` 手动运行。单操作者允许无人值守；并发需求必须外部串行化。

**证据限制。** 该 skill 与私有基础设施不在本域源码范围；本域只读其维护页，未运行 skill。

---

## 6. UI 标准

<a id="documentation-procedures.ui-corner-radius-standard"></a>

### 6.1 圆角角色与嵌套几何

**适用。** 任何 Web/Desktop UI 的边框圆角、胶囊或圆形表面。

**范围（【源义务】，`deepseek-harness/docs/ui-radius.md:3-17@687f282e`）。** 本规范规定 DSH Web 与 Desktop 的圆角尺度及组件应用规则；局部视觉调整限定在指定组件或组件族内，不自动改变全局尺度。共享数值在 `packages/client/ui-theme/src/styles/base.css`，曲线行为在 `corner-shape.css`；修改规则时同步更新主题实现与中英文规范。

**角色表（先用途，后尺寸）。** H 是含边框的设计外部高度，R 是浏览器压缩重叠圆角前的 CSS `border-radius`。宽度、文字长度、偶发换行与内容展开不单独升级半径。

| 用途 | 典型尺寸/示例 | 圆角 | 共享 token |
|---|---|---|---|
| 小细节 | 低于 H20；键帽、行内代码、微型控件 | R4 | `--dsw-radius-xs` |
| 紧凑控件 | H20–28；小按钮、紧凑图标按钮、紧凑菜单项 | R8 | `--dsw-radius-sm` |
| 标准控件或单行 cell | H32–40；按钮、输入框、选择器、导航行 | R12 | `--dsw-radius-md` |
| 大控件或分组内容 | 大按钮、明确多行的 cell、嵌套表单组 | R16 | `--dsw-radius-lg` |
| 独立内容卡片 | 设置卡片、消息气泡、引导入口卡片 | R20 | `--dsw-radius-xl` |
| 主容器 | 输入框、对话框、主面板或悬浮面板 | R28 | `--dsw-radius-panel` |

- 尺寸落在档位之间时，优先复用已有公共尺寸变体；高卡片仍是卡片，不因高度超过按钮就升到 R28；专门设计为多行的 cell 用 R16；普通按钮文字换行时仍保留其按钮变体。
- 具体默认：`Button` 的 `sm` 用 H28/R8，`md` 用 H36/R12（含描边）；H32 输入框与 H36 选择器用 R12；“工作区文件”“新建终端”引导入口用 R20（含仅标题与带描述变体）；R28 留给包围它们的面板/对话框；输入框统计控件与上下文占用率入口用紧凑 R8 与主题曲线（含 hover、展开、焦点）。
- 代码块、diff 与预览卡片共用 R16：改动文件入口、交付文件、已提交计划、已创建任务、发送前后通用附件文件、悬停预览浮层。上述四类卡片内部的 40px 图标底框作为组件特例用 R10，明暗主题下共用相同中性底色与边框；各自 hover 保持同一轮廓。

**复用 token 与形状。**

- 优先复用 `ui-primitives` 控件；固定外尺寸用 `box-sizing: border-box`；filled/outline/ghost/loading/disabled 变体保持相同尺寸与圆角；hover/pressed/selected/focus 不改变半径。
- 使用具名 token；不得为普通控件/卡片新增 10/14/18/24px 局部值。计划任务控件、Desktop 引导、账号通知、快捷键控件保留所属包几何；`packages/client/ui-theme/tests/expected/radius-exceptions.expected.json` 逐项固定允许的文件、选择器与声明，不豁免整个包。组件族专用属性可引用共享 token（如 `--dsl-guide-entry-radius`）；真实内缩距离可用 `calc()`，不构成新尺度档位。
- 普通圆面在支持时使用主题 `superellipse(1.5)`；`corner-shape` 不继承，主题将其应用于元素与 `::before`/`::after`；不支持引擎退回普通圆弧。不要添加组件专用平滑规则，导致底色与外框使用不同曲线。
- 保留有意设计的圆形与胶囊：头像/状态点用 `50%`；明确的胶囊与全圆轨道可用 `999px`；每条此类 full-round 声明必须在同一规则配 `corner-shape: round`。不要因高度小就把所有按钮变成胶囊。细小绘制细节可保留既有局部几何，但不能据此给外围控件任意圆角。
- 头像容器与内部 `img` 都保持正圆；图片不能只继承 `border-radius`，还必须显式 `corner-shape: round` 或从正圆容器继承曲线；两者宽高相等。账号头像尺寸见账号设置包 README。
- 贴边停靠表面与相邻 cell 的共用边缘可用 R0；紧贴卡片的标题栏、底栏或图片只对外露的外围拐角设圆角，保留内部拼接处的直角，不要给每个子元素四角都加圆角。

**嵌套几何（三类关系）。**

| 关系 | 规则 | 示例 |
|---|---|---|
| 圆弧同心内缩 | 内层 R = max(0, 外层 R − 内缩距离)；两段圆弧同心且使用 `round` | 外层 R16、内缩 4、内层 R12 |
| 底色紧贴容器边缘 | 由外框决定可见圆角；裁切底色或继承相应圆角 | 两个独立 hover 区域组成的分体按钮卡片 |
| 容器内独立卡片/表单组 | 按子元素用途选档；不机械减去全部父级内边距 | R20 设置卡片内的 R16 编辑器 |

- 标准菜单：外层 R16 + 4px 内边距 + R12 菜单项（含命令选择、任务菜单、子会话/后台任务菜单外露高亮）；树形展开保留缩进；带底色任务行内控件保留紧凑几何。紧凑菜单：外层 R12 + 4px + R8。`SegmentedControl`：外层 R12、4px 内缩、R8 分段与指示器；`SegmentedTabs`：外层 R16、4px 内缩、R12。改内边距时同步保持指示器偏移、宽度计算、子菜单对齐与指针桥接一致。
- 半径相减也用于嵌套超级椭圆的名义尺寸关系；相同指数不意味着两条曲线严格等距，对角线间隙可能不同于侧边内缩。菜单与分段控件保留共享超级椭圆；要求径向严格等距时用圆弧。
- 单个可点击表面在自身绘制 hover；贴边伪元素/覆盖层使用与可见外框相同的圆角与曲线；避免只给底色设圆角，导致背景与边框之间出现月牙状空隙。
- 分体式引导卡片：外层卡片设共享圆角与裁切，贴边内部按钮用直角；各按钮可保留独立 hover 颜色，由外层裁切到同一轮廓；下拉菜单经既有 portal 放在裁切子树之外；保留可见键盘焦点，不要把外部焦点环一并裁掉。外层引导页设 `--dsl-guide-entry-radius: var(--dsw-radius-xl)`；外层卡片 R20 时，不要再给内部按钮设 R28。

**设置卡片材质。** 账号资料、余额、模型提供商、预设与插件卡片共用默认材质：

```css
.card {
  border-radius: var(--dsw-radius-xl);
  border: 0.5px solid var(--dsw-alias-settings-card-stroke);
  background: var(--dsw-alias-settings-card-fill);
}
```

主题在色板别名所在的 `body` 上把卡片底色解析为 `--dsw-alias-bg-layer-2`、描边解析为 `--dsw-alias-border-l4`；功能样式在明暗主题都使用这些别名。嵌套编辑器用 R16 与既有模块底色；账号查询用量/充值链接遵循 H36/R12 Button 几何，授权按钮使用公共 Button。平面中性边框用共享 0.5px 发丝线；有层级阴影的菜单/浮层/对话框/面板用 `border: 0` 与既有 `--dsw-elevation-*`（阴影已含发丝描边），不要再叠中性边框；不要仅为区分设置 tab 就给普通设置卡片加阴影；保留语义状态色边框与既有半透明菜单背景。

**应用与验证。**

1. 一并检查指定组件、其公共原语、覆盖层、伪元素与同类变体；先按用途分类再替换数值，不要把同一旧圆角的所有出现位置机械映射到同一 token。
2. 修改共享所有方，再对齐依赖它的底色、子元素圆角、裁切与状态样式；独立子卡片保留自己的用途档位。
3. 在明暗主题比较实际渲染的外部尺寸、圆角、曲线、底色与描边；检查默认、hover、按下/选中、禁用与键盘焦点；分体按钮悬停两侧；组件可能受影响时检查窄布局与长文案。
4. 使用既有 radius、corner-shape、elevation 样式表检查与最小浏览器场景。圆角检查拒绝未纳入尺度的字面量与未知 token，但不能判断合法 token 是否适合某组件，也不能判断两个渲染轮廓是否贴合；这些需视觉确认。
5. 按实际差异遵循仓库验证与文档要求；确认目标外观后再更新预期结果；报告最终规则、已测试界面与未验证状态；不要为简单局部调整添加只重复 CSS 数值的测试。

**完成信号。** 角色到 token 映射完整；无未记录例外；嵌套几何按三类关系；标准 CSS/spec 与真实页面检查通过。

**失败处理。** 测试报未映射 token → 补角色或改回 token；superellipse 无 fallback → 补普通圆角；例外检查覆盖不到 → 在评审中记录，不能声称已由 gate 覆盖；视觉贴合问题 → 人工确认，不靠 token 检查。

**例外。** 官方品牌/集成表面可有经记录的最小例外；计划任务控件、Desktop 引导、账号通知与快捷键控件保留所属包几何；菜单/分段控件保留共享超级椭圆。

**证据限制。** 例外检查只覆盖已知文件；新增文件需评审注意。视觉一致性无法完全由单元测试证明。

---

<a id="documentation-procedures.web-styling-ownership"></a>

### 6.2 Web 样式归属与组件边界

**适用。** 给 Web 功能写样式、新增 token、评审样式改动。

**源义务（`deepseek-harness/docs/web-styling.md:3-39@687f282e`）。**

- **归属。** `ui-theme` 拥有 `--dsw-*` 静态色阶、语义别名、排版、动效、渐变、阴影、滚动条与明暗偏好；`ui-layout` 应用解析后的主题快照。
- **样式位置。** 全局样式表只在 `ui-theme/src/styles/`；组件样式用 CSS Modules 并放在组件旁；组件可有局部自定义属性，但共享颜色/排版/层级/动效属于主题包。
- **先复用 primitive。** 跨功能包的视觉差异应做成 `ui-primitives` 的 prop，而不是复制组件。
- **语义 token。** 功能组件使用 `--dsw-alias-*`；不复制静态 palette、不写颜色字面量、不写主题选择器。
- **排版与滚动。** 字号与行高配对；源码/终端/diff 在合同要求时保持不换行；使用共享滚动条样式，不定义组件专用滚动条选择器。
- **表现放 CSS。** 内联 React style 只能传组件局部自定义属性，不编码主题分支。
- **可访问性。** 保留键盘焦点可见性与 reduced-motion；全圆角必须配 `corner-shape: round`。
- **提升表面。** 菜单、popover、modal、panel、浮动按钮、composer 用 `border: 0` + `--dsw-elevation-*`；0.5px 发丝线是阴影第一层；不得把 alias border 与 elevation shadow 配对。
- **菜单材质。** 菜单/上下文/子菜单/选择菜单用 `Menu` 或 `MenuSurface`；材质是主题拥有的 `--dsw-menu-surface-fill` + `--dsw-menu-backdrop-filter`；功能/平台 CSS 不得覆盖或重定义。
- **模态遮罩。** 设置、确认框等模态保留半透明深色遮罩且无模糊（`--dsw-mask-blur: none`）；菜单背景过滤放在隔离层以保留定位与 backdrop。
- **发丝线。** 中性 flat border/分隔线用 0.5px；虚线 affordance 与状态色边框保持 1px；spinner 轨道按 allowlist。
- **链接。** 可点击工件链接用 `--dsw-alias-link`、`font-weight: 500`、静止无下划线、hover/focus 时 3px offset 点状下划线；紧凑 Thinking Markdown 保持 tertiary 文字色和默认点状下划线。带文字的锚点另以 `LinkIconMedium`（随 `currentColor`）作前置；外部已知主机用站点自身标记而非地球；workflow 成员链接与只包图片的锚点不带图形；工具行文件链接保持灰色点线示能。
- **改共享 token。** 在 `ui-theme` 样式表中改，再由功能包消费其语义别名；公共样式合同变化时更新 owner 参考；视觉行为遵循 testing policy。

**步骤。** 判定归属（theme/layout/feature）→ 优先复用 primitive → 用 alias token 写组件样式 → 需要新 token 时先改 theme 并评审影响面 → 检查焦点/reduced-motion/发丝线/提升表面 → 跑样式与视觉检查。

**完成信号。** 样式归属清晰；无跨包内部变量引用；无新组件库/Tailwind；共享表面未被覆写；可访问性与 reduced-motion 检查通过。

**失败处理。** 功能包硬编码颜色/半径 → 回移到 theme token；跨包引用内部类名 → 改为公开 alias；共享表面被局部覆盖 → 删覆盖并给 theme 提变更；菜单材质被功能 CSS 重定义 → 删除覆盖，使用共享容器。

**例外。** 特定浏览器 hack 必须在使用处注释并集中记录；共享 primitive 的局部布局可由消费者组合，但不改变 primitive 的材质。

**证据限制。** 没有完全自动的“归属正确性”检查；本域未运行 UI 测试。

---

## 7. 协议、wire 暴露面与扩展点

<a id="documentation-procedures.wire-extension-exposure-and-receiver"></a>

### 7.1 DeepSeek wire 扩展的暴露面与接收方义务

**适用。** 给 DeepSeek official Messages 请求加 header/JSON 字段，或接收方要理解未知字段。

**范围（【源义务】，`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:3-8@687f282e`）。** 本参考定义 `@deepseek-ai/dsh-llm-deepseek` 在 `deepseek-official` Messages 请求上发送的每个 DSH 专属 HTTP header 与 additive JSON 字段；它不重定义上游 DeepSeek API 自有字段。provider-neutral LLM 接口与 `llm-pi-ai` 不实现这些扩展。扩展发送到解析后的 `baseURL`（包括配置的 gateway），位于 `messages`、系统提示词与工具 schema 之外，因此不增加模型输入 token，也不改变模型可见前缀。

**命名与版本（`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:9-21@687f282e`）。**

| 位置 | 命名 | 示例 |
|---|---|---|
| HTTP 字段名 | 小写 kebab；HTTP 匹配仍不区分大小写 | `user-agent`、`x-deepseek-harness-session-id` |
| DeepSeek 请求体扩展字段 | snake case + 保留 `dsh_` 前缀 | `dsh_plugin_packages`、`dsh_session_log` |
| DSH 自有嵌套成员 | camel case | `afterSeq`、`throughSeq`、`sessionId` |
| 带标签的值 | kebab-case 字符串；持久事件用 `domain/action` | `session-log-deepseek/delivery-accepted` |

每个 body 扩展独立拥有 `version`；版本只约束包含它的对象；不同字段的版本之间不存在兼容或排序关系；JSON 成员顺序不属于协议。`DeepSeekLlmApiExtensionRegistry` 为每个顶层扩展名保留一个 provider；空名称、两端带空白的名称、重复注册以及与基础 DeepSeek 请求冲突的名称都会在 HTTP 分派前失败。

**请求标头（`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:22-32@687f282e`）。**

| 标头 | 出现条件 | 值 |
|---|---|---|
| `user-agent` | 每个 provider HTTP 请求，包括 Files API 操作 | `product/version (+url)` 形式的应用身份；默认产品 `deepseek-harness` |
| `x-deepseek-harness-user-id` | 每个已授权的模型请求 | 已解析 Harness home 的稳定匿名 UUID |
| `x-deepseek-harness-session-id` | 携带 Session id 的模型请求 | 确切的请求 `sessionId` 字符串 |
| `x-deepseek-harness-compact` | 用途为 `compaction` 的模型请求 | 字面字符串 `1` |

凭据失败发生在解析匿名用户 id 之前，因此未授权请求既不发送这些标头，也不创建身份文件。没有 Session 的直接请求省略 session id。会话标题请求没有额外的用途标头；携带 `sessionId` 时仍适用普通规则。

**正文扩展事务（`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:33-40@687f282e`）。** 适配器先序列化包括确切 `messages` 在内的完整基础正文，再让已注册 provider 准备字段。provider 收到不可变正文、请求取消信号，以及可选的 `sessionId` 与辅助调用 `purpose`。返回 `undefined` 时省略该字段。准备好的 JSON 值与 provider 持有的状态分离，作为基础字段的顶层同级成员合并，并序列化到同一个 HTTP body。准备失败的贡献者从该请求省略，只记录首个失败，其他字段仍发送；与基础字段冲突会阻止请求。合并 body 序列化失败时，适配器发送不带任何扩展字段的基础 body，跳过 acceptance 事务以便贡献者稍后重发，并记录被省略的字段名。没有 registry 的组合发送未扩展的基础 body。

HTTP 2xx 后，适配器先运行准备好的 `accept()`，再读取 SSE。传输失败与非 2xx 不接受任何贡献；acceptance 失败只记录，不使模型请求失败，贡献者稍后重发。Acceptance 只表示端点级 HTTP 成功，不表示 SSE 完成或端点持久化了扩展。

**`dsh_plugin_packages`（`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:41-73@687f282e`）。** 该字段由 `@deepseek-ai/dsh-plugin-package-inventory-deepseek` 贡献，默认启用，发送完整的活跃 Loader-backed 插件包清单。

- 每次请求重新读取 host 树中的活跃非 group Loader 条目，以及（当请求 Session 存在时）其 standing agent-preset 树；相对/绝对模块用最近的所有者 manifest，裸包条目遵循激活它的 Loader 解析基准。
- 有名字但无非空字符串版本的 manifest 贡献 `{ name }`，不论是否 `private`；缺失名称与不可读 manifest 只省略受影响条目；包元数据不阻塞请求。
- 发送方按精确 `(name, optional version)` 去重，先按 `name`、再按 `version` 排序；使用与 locale 无关的文本比较，缺失版本排在前。同一包的多个同时活跃版本保留为独立条目，包括 name-only 条目。接收方必须接受缺失版本，不能按包名折叠数组，也不能从数组顺序推断包已激活。
- disabled、pending、failed、unloading、disposed、结构 Loader 条目不在清单中；普通依赖、没有具名所有者包的松散模块、程序化挂载的子 fiber、内存动态插件也因没有权威 Loader-backed 包身份而不出现。启用但无合格条目时发 `packages: []`；禁用贡献者时整个字段省略。包身份是 provider 元数据，绝不进入模型输入。

**`dsh_session_log`（`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:74-134@687f282e`）。** 该字段由 `@deepseek-ai/dsh-session-log-deepseek` 贡献，默认启用，发送 canonical Session log 的一个连续后缀。

- 适用于有 live Session 且至少一个事件的请求；直接请求、陈旧 Session id、空日志、首个 pending 事件单独超过 `maxBytes` 或无法序列化时省略；组合可用 `enabled: false` 关闭。
- 首次上传 `afterSeq: -1`；之后每次从该 Session id 的最大已接受 watermark 之后开始。每次上传携带从该点起最长的连续段，其序列化字段能放进 `maxBytes`（默认 8 MiB，UTF-8 字节，含 header 与数字字段）；超过上限的 backlog 跨多个已接受请求。发送方每个请求快照一次事件数组；快照后的追加属于后续请求。
- `session` 成员把逻辑 Session 元数据投影为 raw JSON primitives；seeded Session 发精确的 `Session.inheritedEventCount` 作为 `seedLength`，非 seeded 省略；逻辑 `isSeeded` 不上 wire。外层 `dsh_session_log.version` 选择扩展 schema，`session.version` 选择逻辑 Session 格式；改 Session header 投影需要扩展 schema 升版，即使内嵌逻辑格式也变。
- 每个 `events` 项携带 canonical 事件 raw JSON primitives，包含 `type`、numeric `seq`、`time`、`data`，保留 `ignorable: true`。Surface 事件要求 `surfaceOp`；替换范围用 numeric `startSeq`/`endSeq`；system/user/tool 事件可带 numeric `sourceEventSeqs`。Assistant provider metadata 留在其嵌入 stream 中；已知 log-only 事件省略 surface metadata；恢复的未知 ignorable 记录保留 opaque metadata，不当作 surface 操作。
- 端点返回 2xx 后，贡献者向同一 Session 追加 `session-log-deepseek/delivery-accepted` 事件；`throughSeq` 必须指向更早事件，`sessionId` 标识发送后缀的 Session，`sessionFormatVersion` 绑定该逻辑代际（缺失表示历史 v0）。
- 发送方按当前 Session id 与格式代际折叠最大匹配 `throughSeq`，因此并发已接受请求不能把游标回退，另一代际的 watermark 不能授权当前后缀。恢复后的进程从持久日志重建游标。fork 忽略命名其他 Session 的继承 watermark，因此从序号 0 上传自身的继承前缀，按 `maxBytes` 分多次请求，再以子 Session id 推进；watermark 事件自身属于下一段未发送后缀。
- 传输失败、非 2xx，以及序列化失败后不带扩展字段发出的请求，都不追加 watermark。端点接受后、本地持久化前崩溃时可能重发已接受范围；不确定性产生重复，绝不产生序号缺口。没有独立 upload store 或截断路径；`maxBytes` 只限制每次请求的字段大小。

**暴露面与接收方要求（`deepseek-harness/docs/deepseek-llm-api-wire-extensions.md:135-162@687f282e`）。**

- 请求标头暴露 Harness 应用版本、一个匿名 Harness-home 身份与可选的 Session 身份；`dsh_plugin_packages` 暴露活跃 npm 包名与版本。
- 除非组合禁用，`dsh_session_log` 可能暴露 Session 工作目录、系统提示词快照、用户与 Assistant 内容、嵌入的 Assistant stream、失败 attempt 输出、工具参数与结果、压缩摘要、反馈与插件事件。适配器 API key 不是 Session 事件，因此不进入该字段。通过 `baseURL` 选择的 gateway 收到与官方端点相同的值。
- 接收方按名称定位扩展字段，按各字段自己的 `version` 分派，保留不同的包版本，忽略 JSON 成员顺序。Session log 接收方必须先校验连续序号范围，再解释事件类型。遇到不带 `ignorable: true` 的未知 canonical 事件时，接收方无法无损重建。即使缺少 registry 或某项贡献，基础请求仍可用；字段缺失表示该贡献不适用于本次请求。Session log backlog 排空期间，`throughSeq` 落后于 Session 的最新事件，因此 2xx 不表示接收方已持有当前完整日志。

**步骤。** 设计字段名与版本 → 注册 provider → 实现 prepare/accept/回退 → 写插件包与 Session log 记录 → 两侧契约测试（未知字段、重复、非 2xx、watermark、序列缺口）→ 文档。

**完成信号。** 旧接收方忽略新字段；新接收方正确接受/拒绝；非 2xx 不解析；日志无字段值；重复接受幂等；暴露面已记录。

**失败处理。** 字段被塞进 `messages` → 移到顶层扩展；全局版本 → 改每字段版本；非 2xx 仍 accept → 修顺序；日志记录字段值 → 删除值、只留元数据；把 2xx 当持久化确认 → 修正文档与接收方。

**例外。** 同一字段版本升级可并存多个字段名；旧版本保留到 watermark 确认。组合可关闭任一贡献，基础请求仍可用。

**证据限制。** 本域只读该参考，未查看 registry/协议实现或运行互操作测试。不要把本文当 DeepSeek 官方协议规范；它描述 DSH 的扩展约定。

---

<a id="documentation-procedures.extension-point-map"></a>

### 7.2 架构地图与扩展点选择

**适用。** 新增产品行为，先找“应该放哪一层”，而不是先写代码。

**源义务与源实现事实（`deepseek-harness/docs/architecture.md:3-165@687f282e`）。**

- **读包前先读地图。** `docs/architecture.md` 是进入 `packages/` 的入口；它假设读者懂 Cordis，否则先读 primer 或 tutorial。
- **Cordis 是框架。** 插件向共享 context 贡献服务、类型化事件与可逆 effect；产品每一部分都是插件，包括模型适配器、工具注册表、Session log 与 agent loop；没有需要打补丁的特权核心，扩展方式是挂载插件，注册在插件卸载时回卷。
- **Profile 与 bundle。** 运行中的 `dsh` 是启动时按序叠加的插件树。profile 是 Harness home 中的具名组合，列出其堆叠的 bundle、树外插件与用户 `cordis.patch.yml`；`web`/`headless`/`sdk`/`sdk-minimal`/`acp` 是模板。bundle 是 Cordis 配置行及其挂载代码的分发格式，通过 `package.json` 的 `dsh.profile`/`dsh.bundle` 声明。层依次为 profile 的有序 bundle、`cordis.patch.yml`、home patch、`--patch` overlay；patch 按 id 替换整行 config 或插入新行；`preset` patch 在目标声明的 `config.plugins` 内应用同样优先级。
- **事件是扩展点。** Session 事件是追加到日志并经 `session/event` 广播的持久事实；Agent 事件（`agent/*`）携带 live Agent（inbox、step、status、request、validation、continuation）；能力事件（`fs/*`、`tools/*`、`telemetry/*`）把策略与适配器附着到 seam，而不导入 loop。
- **Session log 是模型所见上下文的来源。** “Model-visible means logged”：每个模型请求都必须能从日志重建；新的模型可见输入需要 Session 事件。改变既有消息内容的插件注册 pure message projections；detached reader 显式提供相同定义。工具变更与能力无关；Session tool history 提供 provider declarations。投影 seam `ctx.sessionProjections` 拥有增量折叠、`stateOf()` 与 `snapshot()`；host 读取方要么在激活时要求该服务，要么在缺失时明确失败。
- **Capability seam 三角色。** seam 是含 Service Definition（声明接口）、Service Provider（实现）与 Consumer（使用，通常是模型可见工具）的可替换能力；一个包可合并角色，但一个角色本身不是 seam；添加能力要设计全部三者。
- **Where new behavior goes。** 新行为附着到已文档化扩展点：模型提供方 → `ctx.llm` adapter；模型可见能力 → `ctx.tools`；每 Session 不同能力集 → agent preset（服务行需 `isolate` realm）；shell → `ctx.shell` backend（本地经 `ctx.subprocess`）；持久终端 → `ctx.terminals` backend + `dsh-tool-terminal`；人类命令 → `ctx.commands`；后台任务 → `ctx.jobs`；外部 webhook → `ctx.webhookRuntime` trusted rule + provider adapter；文件系统访问/策略 → `ctx.fs` provider 或 `fs/*` 事件；进程约束 → `ctx.sandbox` backend（消费者在 spawn 前包装 argv）；拦截 request/tool/turn → 对应 `agent/*` 或 `tools/*` 事件（`agent/turn-stopping` 停止 turn）；模型可见上下文 → `agent.inject()`（进入下一次准入请求）；UI/编辑器集成 → 驱动 `ctx.agents` 并从 `session/event` 渲染；Web Client Chat 节点 → `ConversationNodeDefinition` + keyed renderer；持久 Session 状态 → 扩展 `SessionEventMap` 并从日志渲染/回放；Session 标题 → 唯一 `ctx.sessionTitle` provider；同会话目标 → `ctx.goals` 并经 `agent/*` 续跑；轮次边界 fork → `ctx.agents.create({ sessionId, seed, meta: { parentSession, seedLength } })`（只有 agent-loop 发布的 Session 才持久化）；新 Session 后端 → 实现 `SessionPersistence`（`create`/`open`/`stat`/`list`/`export`）并复用共享 handle 脚手架；把注册限定到单个 agent → `agent.ctx`。
- **改变 loop 本身时更新扩展点地图**，不能让 map 与实现脱节。
- **extension-cookbook 映射 feature→capability**，并索引包/工具/LLM 适配器/设置页的分步指南；Conversation 子系统拥有 Chat node 组装。
- **新事件声明分派模式**（`@mode`），让生成的 catalog 核对声明与分派点；区分 durable Session event 与 live extension point。

**步骤。** 查 `Where new behavior goes` → 是否已有 seam（三 owner）→ 选最小层 → 写声明/生成 → 在该层加测试 → 更新地图/参考。

**完成信号。** 新行为落在表中对应层；seam 三角色齐；模型可见事实可从日志重建；生成目录已更新。

**失败处理。** 放错层 → 按表迁移；只加实现没有定义/消费 → 补一个真实 consumer 或不做 seam；绕过 Session log 存模型可见状态 → 改为事件派生；map 与实现脱节 → 在同一变更更新 map。

**例外。** 紧急修复可先落在最近层，但必须在同一变更里补归属说明；不得把例外变成第二套架构。

**证据限制。** 地图本身是产品描述；本域未逐包核对实现。`docs/AGENTS.md` 的层级/预算/链接规则由 documentation 域拥有，此节只保留扩展点选择流程。

---

## 8. 迁移到新项目的落地顺序

【迁移设计】以下顺序把本参考变成可执行治理，而不是一次复制全部规则。按目标仓库的规模裁剪，但不要跳过 owner 与检查。

1. **定层级。** 先写根 `AGENTS.md` 的常驻最小集，再定义 docs/cookbook/subsystems/postmortem/Agent Note 的层级与“一事实一家”。不要从预算数字开始。
2. **定文档形态。** 选定双语是否必需；若需要，先引入三件套与 sidecar 生成器，再批量迁移页面。没有翻译需求就不要引入哈希门禁。
3. **定生成参考。** 把能从源码/声明派生的事实列出来，写生成器与新鲜度检查；其余散文只链接。
4. **定操作模板。** 用 §2.1 写一个 cookbook 模板，再按 §2.2–§2.8 为每类能力建立清单；每页必须有 Verify。
5. **定格式/状态权威。** 建立一个 Session/数据格式状态页与单一 writer 常量；定稿基线、发布记录与 tagged writer 的边界写清。
6. **定复盘准入。** 先写三条门槛与 Executive summary + 详细章节结构；没有防护栏的复盘不编号。
7. **定评审协作。** 堆叠 PR/多 worktree/修复归属规则先于自动化；再引入 skill 维护流程。
8. **定 UI owner。** 先建立共享 token/主题包，再允许功能包写样式；例外表从第一天启用。
9. **定协议边界。** wire 扩展只走 per-field registry；先写接收方忽略未知字段的测试与暴露面清单。
10. **建立门禁分级。** 本地 hook（快、可绕过）→ CI（权威）→ 远端必需检查（若平台支持）。明确每一级的失败是否阻塞合并。
11. **做一次反例演练。** 故意破坏配对、围栏、生成页、vendor manifest、格式记录，确认检查拒绝；再恢复。
12. **记录证据限制。** 在目标仓库的治理文档中列出哪些是自动保证、哪些是评审责任、哪些尚未验证。

**裁剪原则。** 若目标仓库没有双语、vendored 包、UI 或 Session 格式，不要引入对应门禁；但“操作页必须有可执行 Verify”“一事实一家”“复盘必须有防护栏”不依赖具体产品，建议保留。

---

## 9. 未决与证据限制

1. **中文正文已读但未做专业译审。** 28 个 `.zh.md` 已读全文（含按 CJK 显示宽度对超长行的 raw 重读），并与英文标题/结构及 sidecar 条目数核对；但本域不是专业译审。`verify-translation-pairing` 只保证结构签名与逐节哈希，不判断术语、语气或语义是否忠实。目标项目仍应做逐节双语审校。
2. **未运行任何门禁。** `doc-sync`、`doc-typecheck`、`verify-type-equiv`、`verify-translation-pairing`、`persistence-changes`、`session-format-catalog`、`verify-v3-event-vocabulary`、UI/preview spec 的行为均来自源码阅读；`planned` 验证项需在目标 checkout 执行后才算通过。
3. **远端 forge 阻塞未知。** 文档描述本地/CI 脚本，未给出分支保护/必需检查配置；不能把“检查会失败”等同于“合并被阻止”。
4. **V3 词汇 pin 的远端新鲜度未知。** 脚本只读本地 pin；是否为最新 V3 写入需操作者人工确认。
5. **`docs/AGENTS.md` 的分区归属存在差异。** 任务说明将其列入英文集，但 `research/residual-source-partitions.json` 的 `documentation-procedures.paths` 不含它；本参考把它作为跨域支撑源阅读并引用（1-77），未在本域 inspected 中重复分类，避免与其他域冲突。
6. **其他域拥有的事实不在此重述。** 构建/TS/依赖、测试层级、发布迁移算法、包 README 细节、供应链理由、决策记录、Agent Note 边界分别由 engineering、testing、release、package-contracts、supply-chain、decisions、rationale 域拥有；本参考只保留操作步骤与读者触发点。
7. **源页面提供的是产品描述，不是通用标准。** 例如 `docs/api-gateway.md` 的 Typert 细节、`docs/ui-radius.md` 的具体像素、wire 扩展的字段名，都必须按目标项目实际重设，不能直接照搬为跨项目规范。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `documentation-procedures.doc-fence-typecheck-and-type-equiv`：`deepseek-harness/docs/development.md:206-214@687f282e`、`deepseek-harness/scripts/doc-typecheck.ts:1-42@687f282e`、`deepseek-harness/scripts/verify-type-equiv.ts:1-15@687f282e`、`deepseek-harness/scripts/type-equiv.manifest.json:1-12@687f282e`
- `documentation-procedures.generated-reference-freshness`：`deepseek-harness/docs/development.md:159-162@687f282e`
- `documentation-procedures.cookbook-procedure-standard`：`deepseek-harness/docs/cookbook/adding-a-remote-api.md:5-5@687f282e`、`deepseek-harness/docs/cookbook/extension-cookbook.md:94-97@687f282e`、`deepseek-harness/docs/cookbook/adding-a-session-format-version.md:3-7@687f282e`
- `documentation-procedures.package-addition-procedure`：`deepseek-harness/docs/development.md:57-121@687f282e`
- `documentation-procedures.tool-authoring-contract`：`deepseek-harness/docs/cookbook/adding-a-tool.md:3-5@687f282e`、`deepseek-harness/docs/cookbook/adding-a-tool.md:7-39@687f282e`、`deepseek-harness/docs/cookbook/adding-a-tool.md:99-101@687f282e`、`deepseek-harness/docs/cookbook/extension-cookbook.md:7-10@687f282e`
- `documentation-procedures.remote-api-addition-procedure`：`deepseek-harness/docs/api-gateway.md:100-123@687f282e`
- `documentation-procedures.settings-card-procedure`：`deepseek-harness/docs/cookbook/adding-a-settings-card.md:3-5@687f282e`
- `documentation-procedures.plugin-preview-procedure`：`deepseek-harness/docs/cookbook/adding-a-plugin-preview.md:3-5@687f282e`
- `documentation-procedures.llm-adapter-procedure`：`deepseek-harness/docs/cookbook/adding-an-llm-adapter.md:3-5@687f282e`
- `documentation-procedures.persistence-type-change-record`：`deepseek-harness/scripts/persistence-changes.ts:20-24@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:549-554@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:663-666@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:712-715@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:846-851@687f282e`、`deepseek-harness/scripts/persistence-review.ts:1-20@687f282e`
- `documentation-procedures.session-format-version-procedure`：`deepseek-harness/scripts/verify-v3-event-vocabulary.ts:1-12@687f282e`
- `documentation-procedures.postmortem-admission`：`deepseek-harness/docs/postmortem/README.md:1-18@687f282e`、`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:7-10@687f282e`、`deepseek-harness/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md:7-10@687f282e`、`deepseek-harness/docs/postmortem/0003-web-agent-gui-feedback-loop.md:7-10@687f282e`、`deepseek-harness/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md:7-10@687f282e`
- `documentation-procedures.postmortem-evidence-and-guardrails`：`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:89-112@687f282e`、`deepseek-harness/docs/testing.md:33-42@687f282e`
- `documentation-procedures.ui-corner-radius-standard`：`deepseek-harness/docs/ui-radius.md:19-24@687f282e`、`deepseek-harness/docs/ui-radius.md:26-44@687f282e`、`deepseek-harness/docs/ui-radius.md:46-59@687f282e`、`deepseek-harness/docs/ui-radius.md:61-92@687f282e`、`deepseek-harness/docs/ui-radius.md:94-109@687f282e`、`deepseek-harness/docs/ui-radius.md:111-117@687f282e`、`deepseek-harness/packages/client/ui-theme/tests/expected/radius-exceptions.expected.json:1-27@687f282e`
- `documentation-procedures.extension-point-map`：`deepseek-harness/docs/cookbook/extension-cookbook.md:98-132@687f282e`
- `documentation-procedures.naming-and-vocabulary`：`deepseek-harness/docs/glossary.md:11-22@687f282e`、`deepseek-harness/docs/glossary.md:23-46@687f282e`
