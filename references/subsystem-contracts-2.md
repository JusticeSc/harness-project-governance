# 子系统契约（subsystem-contracts-2）操作参考

> 适用对象：要新增/修改 `docs/subsystems/*` 页面、维护包组到页面的链接、粘贴源码等价类型、更新生成的 Cordis API 区，或评审这类变更的代理与维护者。
>
> 固定源：`deepseek-harness/` @ `687f282e8625c6b8d11ff58211a90524be2e4317`。本文件中的 `路径:起-止@687f282e` 都可回到该提交核对；未标提交的数字只是本文件内的操作说明。
>
> 本文件不要求读者持有源仓库：命令、标记、清单字段、豁免表和失败文本都写在这里。目标仓库若没有同名脚本，按“机制”一节迁移，不要照抄命令名。

## 0. 五分钟上手

### 0.1 命令表（源仓库原名）

| 目的 | 命令 | 权威实现 |
|---|---|---|
| 检查包组 README 是否链接了存在的子系统页 | `pnpm run verify-subsystem-pages` | `scripts/verify-subsystem-pages.ts` |
| 检查 `type-equiv`/`public-api` 块与源码结构、JSDoc 是否一致 | `pnpm run verify-type-equiv` | `scripts/verify-type-equiv.ts` + `scripts/type-equiv.manifest.json` |
| 生成两侧 Cordis API 区；仅区域变化无需重录记录 | `pnpm run gen-cordis-catalog`；区域外正文变动确认两侧后另跑配对 `--write <page>` | Cordis CLI 只生成 API 输出；配对记录由独立配对命令负责 |
| 只检查生成物是否新鲜（不写文件） | `pnpm run verify-cordis-catalog` | 同上，`--check` |
| 一次跑完文档静态门（含以上三项） | `pnpm run check:doc-sync` | `scripts/run-gates.ts` 的 doc-sync 叶门 |
| PR 上的静态门入口 | `pnpm run check:ci:static` | `.github/workflows/ci.yml` |

`check:ci:static` 在 `pull_request` 上运行；doc-sync 叶门把 `verify-type-equiv`、`verify-cordis-catalog`、`verify-subsystem-pages` 都列为 `quick` 门。不要只跑其中一个就宣称文档一致。

### 0.2 文件地图

- 页面目录：`docs/subsystems/`。英文页是主文件；`*.zh.md` 是配对译文；`*.i18n.yaml` 是配对哈希记录。
- 页面索引：`docs/subsystems/README.md` 的 Page/Owns 表（本域 34 个页面，源仓库整表 66 行）。
- 文档分层与写作规则：`docs/AGENTS.md`。
- 类型等价清单：`scripts/type-equiv.manifest.json`；条目字段为 `doc`、`symbol`、`source`，可选 `augmentations` 与 `projection: "public-api"`。
- Cordis 生成器：`scripts/gen-cordis-catalog.ts`；标记名为 `cordis-surface`，生成区由 `<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->` 与对应 END 包围。
- 包组链接门：`scripts/verify-subsystem-pages.ts`；豁免常量是 `GROUPS_WITHOUT_SUBSYSTEM_PAGE`。

### 0.3 本域 34 页的结构快照

“手工正文至”是 BEGIN 标记前一行；`—` 表示整页都是手工正文（没有生成的 Cordis 区）。数字来自固定提交的页面结构，用于判断该读哪一段、该跑哪道门。

| 页面 | 手工正文至 | 生成区 | type-equiv | public-api | 备注 |
|---|---:|---|---:|---:|---|
| `llm-streaming.md` | 938 | 有 | 37 | 2 | 适配器 MUST 列表、流协议、模型请求 |
| `core.md` | 410 | 有 | 13 | 0 | 核心包、Agent 句柄、全仓类型模式 |
| `schedule.md` | 438 | 有 | 33 | 0 | 持久任务、历史变更、投递 |
| `typert.md` | 496 | 有 | 24 | 0 | Remote descriptor、资源访问控制 |
| `jobs.md` | 386 | 有 | 16 | 0 | 后台任务运行时 |
| `persistence.md` | 331 | 有 | 11 | 1 | 持久化 seam、共享 provider 套件 |
| `conversation.md` | 301 | — | 0 | 0 | 纯手工：组装、验证义务 |
| `boot.md` | 58 | 有 | 2 | 0 | profile/插件管理 |
| `session-projection.md` | 106 | 有 | 3 | 0 | 投影、stateVersion |
| `feedback.md` | 315 | 有 | 27 | 0 | 反馈持久化、边界清单 |
| `subprocess.md` | 255 | 有 | 13 | 0 | 终端与进程 provider |
| `attachment.md` | 170 | 有 | 12 | 0 | 品牌化附件 id |
| `extensions.md` | 5 | 有 | 0 | 0 | 几乎整页是生成区；手工前言很短 |
| `web-server.md` | 86 | 有 | 4 | 0 | HTTP server |
| `workflow.md` | 128 | 有 | 4 | 0 | dispose 与 fatal 纪律 |
| `web-client.md` | 100 | — | 0 | 0 | 纯手工架构页 |
| `ptc-runtime.md` | 207 | 有 | 9 | 0 | PTC 结果与沙箱证明边界 |
| `sandbox.md` | 158 | 有 | 8 | 0 | enforcement 报告、fail-closed |
| `goal.md` | 164 | 有 | 12 | 0 | 同会话目标 |
| `README.md` | 76 | — | 0 | 0 | 索引与类型等价说明 |
| `lsp.md` | 165 | 有 | 10 | 0 | 封闭操作联合、无逃生口 |
| `agent-team.md` | 125 | 有 | 7 | 0 | 实验性 Team 域 |
| `translation.md` | 33 | 有 | 0 | 0 | 实验性翻译 |
| `voice-input.md` | 31 | 有 | 0 | 0 | 实验性语音 |
| `session-title.md` | 154 | 有 | 11 | 0 | 持久标题与 catalog 所有权 |
| `ssh.md` | 105 | 有 | 2 | 1 | 不重放、如实报告 |
| `client-resources.md` | 92 | — | 0 | 0 | 纯手工：limits 段 |
| `settings.md` | 15 | 有 | 0 | 0 | 表单与完整 Config 校验 |
| `token-meter.md` | 54 | 有 | 2 | 0 | surface 顺序权威 |
| `webhook.md` | 37 | 有 | 0 | 0 | fire-and-forget 限制 |
| `worktrees.md` | 41 | 有 | 2 | 0 | 实验性 worktree |
| `working-directory.md` | 15 | 有 | 0 | 0 | catalog 拥有事件声明 |
| `otel.md` | 9 | 有 | 0 | 0 | 共享 OTel 通道 |
| `todo.md` | 32 | — | 1 | 0 | 纯手工：持久事件 |

生成区不是独立手工政策；原始 JSDoc 仍承载来源 API 契约，不能因生成而抹掉其约束。`type-equiv`/`public-api` 块在生成区之外。固定来源 `agent-team.md:127-231` 是生成区，含 `ctx.agentTeams` 和 11 个方法 JSDoc；其与中文侧仅配对链接路径不同。完整结构解析、源义务语义复核和目标运行效果是三种不同证据，不互相替代。

## 1. 读者触发索引

| 你要做什么 | 先读 |
|---|---|
| 新增子系统页、判断内容该放哪一层 | [§2.1 参考层与页面所有权](#subsystem-contracts-2.subsystem-reference-tier) |
| 新增包组，或门报 “no reader-visible direct link” | [§2.2 包组链接门](#subsystem-contracts-2.package-group-page-linkage) |
| 在页面粘贴接口/类型/类 | [§2.3 源码等价类型块](#subsystem-contracts-2.source-equivalent-type-blocks) |
| 改了 `@Remote` 方法、事件或服务，门报 stale | [§2.4 生成的 Cordis API 区](#subsystem-contracts-2.generated-cordis-region) |
| 改了一个公开类型，想知道要不要同批改页面 | [§2.5 同一变更更新页面](#subsystem-contracts-2.same-change-page-update) |
| 新能力是实验性的，或只有部分强制 | [§2.6 状态、边界与限制](#subsystem-contracts-2.documented-limits-and-status) |
| 改持久事件、Session 格式或投影缓存 | [§2.7 持久化契约版本化](#subsystem-contracts-2.durable-contract-versioning) |
| 新增 adapter/provider，或评审替代实现 | [§2.8 provider 契约与验证](#subsystem-contracts-2.provider-conformance-and-verification) |
| 评审整个 PR | [§3 评审清单](#review-checklist) / [§4 迁移清单](#migration-checklist) |

## 2. 机制

<a id="subsystem-contracts-2.subsystem-reference-tier"></a>

### 2.1 参考层：一页一子系统，页面拥有词汇/类型

**何时读**：新增子系统；把一段说明从 architecture/包 README/Agent Note 搬来搬去；发现同一契约有两份描述。

**规则（义务）**

1. 每个子系统有一个 `docs/subsystems/<name>.md` 页面，并在 `docs/subsystems/README.md` 的 Page/Owns 表中有一行，Owns 只写该页真正拥有的内容。
2. 页面拥有该子系统的**类型定义、语义、wiring** 和生成的 **Cordis API**；跨子系统的**行为叙事**归 `docs/architecture.md`。
3. 包级实现细节归 `packages/<group>/README.md`；设计理据归 Agent Notes。页面只保留当前契约并链接理据，不复制历史。
4. 事件声明若由生成的 persistence catalog 拥有，页面只链接该 catalog，不手写第二份事件表。
5. 中文页是同一页的配对译文，不得出现只存在于中文页的契约。

**操作**

1. 先确认包组和它在 README 表中的现有行；没有行就补行，Owns 用一句话写“该页拥有什么”，不要写“相关文档”。
2. 写页首：标题、`English | 中文` 切换、当前契约概述。
3. 类型/语义/wiring 留在本页；把生命周期叙事移到 `architecture.md`，把包内实现细节移到包 README，把“为什么这样设计”移到 Agent Note，并各留一行链接。
4. 若事件由 `docs/persistence-catalog.md` 拥有，写“generated persistence catalog owns the declaration”，只链接，不复制事件表。
5. 生成 Cordis 区（见 §2.4），同步中文页与 `.i18n.yaml`（配对流程属 documentation 域）。

**失败与恢复**

- 页面缺 README 索引行、Owns 写错、把行为叙事塞进页面：**现有门不会失败**。恢复方式是把内容移回正确层级，补索引行，并在评审中确认。
- 包组 README 没链接页面：由 §2.2 的链接门失败，按该节恢复。

**例外与评审**

- README 表是人工维护的索引入口，不是生成物。
- 页面可以链接外部 owner 而不复制内容。
- 纯描述性概述可以留在页首，只要它不形成第二份可执行契约。
- 评审重点：页面是否拥有“词汇/类型”而不是“行为故事”；同一事实是否在两个层级各有一份。

**证据（固定提交）**

- `deepseek-harness/docs/subsystems/README.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/README.md:7-74@687f282e`
- `deepseek-harness/docs/AGENTS.md:24-24@687f282e`
- `deepseek-harness/docs/AGENTS.md:33-33@687f282e`
- `deepseek-harness/docs/subsystems/core.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/todo.md:30-32@687f282e`
- `deepseek-harness/docs/subsystems/session-title.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/extensions.md:5-5@687f282e`

<a id="subsystem-contracts-2.package-group-page-linkage"></a>

### 2.2 包组链接门：直接链接、存在性与可评审豁免

**何时读**：新增/重命名 `packages/<group>`；新增/删除页面；门报 `subsystem pages`；想给某组加豁免。

**规则（义务）**

1. 每个包组必须有 `packages/<group>/README.md`；没有就是违规。
2. 该 README 必须含至少一个**直接** Markdown 链接，目标形如 `../../docs/subsystems/<page>.md`。
3. `README.md` 和 `.zh.md` 不计入链接；锚点可以带，但页面名必须是英文主文件。
4. 被链接的英文页面必须存在。
5. 没有独立页面的组必须在 `GROUPS_WITHOUT_SUBSYSTEM_PAGE` 中登记，理由非空且可评审；新组不能静默继承豁免。
6. 过期豁免必须删：组已不存在、组已链接页面、或理由为空都失败。
7. 类型应记录在其**声明包组**所链接的页面上，不是任意页面。

**操作**

1. 从 `packages/*/README.md` 与 `packages/*/*/package.json` 推导包组集合。
2. 在组 README 加直接链接；页面不存在就先建页。
3. 确实无独立页面时，向豁免常量加组名和一句话理由（不要写“legacy”）。
4. 运行 `pnpm run verify-subsystem-pages`，期望 `all conform`。
5. PR 上由 `check:ci:static` 触发 doc-sync。

**失败与恢复**

| 失败文本 | 含义 | 恢复 |
|---|---|---|
| `no reader-visible direct docs/subsystems/*.md link` | 没有直接链接且未豁免 | 加链接；或加有理由的豁免 |
| `package group has no group README` | 组 README 缺失 | 新建 README，声明子系统所有权 |
| `linked subsystem page does not exist` | 链接指向不存在的页 | 建页或改链接 |
| `links a subsystem page but remains exempt` | 豁免已过期 | 删除豁免 |
| `no matching package group; remove the stale entry` | 豁免组已消失 | 删除豁免 |
| `missing justification` | 理由为空 | 写可评审理由 |

**例外（源仓库的常量，按目标仓库重设）**

| 组 | 理由 |
|---|---|
| `acp` | 协议传输入口；互操作契约由 server 包 README 拥有 |
| `bundle` | 组合补丁载体；挂载的包拥有全部运行时契约 |
| `sdk` | 进程外协议与客户端包；SDK 契约由包 README 拥有 |
| `test-support` | 仓库测试夹具；测试策略由 `docs/testing.md` 拥有 |
| `util` | 底层原语；业务语义留在消费它的子系统 |

**评审注意**：门只证明“有一个存在的页面被链接”，不证明该页面覆盖了该组的类型/语义。豁免理由的质量只能评审。

**证据（固定提交）**

- `deepseek-harness/scripts/verify-subsystem-pages.ts:1-10@687f282e`
- `deepseek-harness/scripts/verify-subsystem-pages.ts:14-24@687f282e`
- `deepseek-harness/scripts/verify-subsystem-pages.ts:56-137@687f282e`
- `deepseek-harness/docs/AGENTS.md:44-44@687f282e`
- `deepseek-harness/scripts/run-gates.ts:836-856@687f282e`
- `deepseek-harness/package.json:114-114@687f282e`
- `deepseek-harness/.github/workflows/ci.yml:104-107@687f282e`
- `deepseek-harness/docs/subsystems/README.md:7-74@687f282e`

<a id="subsystem-contracts-2.source-equivalent-type-blocks"></a>

### 2.3 源码等价类型块：完整声明 + JSDoc、public-api 投影、1:1 清单与中文衍生

**何时读**：要在页面展示接口/类型别名/类/枚举；源类型字段或 JSDoc 变了；`verify-type-equiv` 报 orphan 或 DRIFT。

**规则（义务）**

1. 完整的类型声明及其**原始 JSDoc** 用 ```` ```ts type-equiv ```` 围栏；内容是源码声明的完整拷贝（可去掉 `export`）。
2. 只保留公开签名的类用 ```` ```ts public-api ````；私有/受保护成员与实现体被剥离，但类与成员的原始 JSDoc 保留。
3. 每个主块在 `scripts/type-equiv.manifest.json` 中有且仅有一条条目：`doc`、`symbol`、`source`；需要显式模块增强时列 `augmentations`；类投影用 `projection: "public-api"`。
4. 块与清单 **1:1**：无条目的块是 orphan block，无块的条目是 orphan entry。
5. 中文页对应块是**逐字节衍生块**，不单独登记；通过英文页的清单条目校验。
6. 普通 `ts` 围栏必须能编译（doc-typecheck）；`type-equiv`/`public-api` 不是绕过编译检查的通道。

**操作**

1. 在源文件确认 symbol 的完整声明与 JSDoc。
2. 在页面放围栏，粘贴完整声明；public-api 只留公开签名与 JSDoc。
3. 在清单加 `{doc, symbol, source}`；接口合并时补 `augmentations`。
4. 把同一块复制到中文页（逐字节一致；中文页不加清单条目）。
5. 运行 `pnpm run verify-type-equiv`。
6. 源声明变化时，先改源与页面块；symbol/doc 变化才改清单。

**失败与恢复**

| 失败文本 | 含义 | 恢复 |
|---|---|---|
| `type-equiv block <symbol> (<doc>:<line>) has no manifest entry` | 页面块未登记 | 加清单条目 |
| `manifest entry <symbol> (<doc>) has no matching type-equiv block` | 条目成了孤儿 | 删条目或补页面块 |
| `DRIFT: <doc>:<line> — ... does not match <source>` | 结构或 JSDoc 漂移 | 从源重新生成完整块（含 JSDoc），同步中文页 |
| `symbol ... not found in <source>` | 条目指向的源没有该 symbol | 修 `source`/`symbol`，或删条目 |
| `type-equiv block has no parseable interface/type/class declaration` | 块内容不是可解析声明 | 改回完整声明 |

**例外**

- 归档 Agent Note 不在扫描范围。
- 中文衍生块不要求独立清单条目，但必须与英文块逐字节一致。
- 清单可用 `augmentations` 合并显式模块增强，不要求在页面重复增强声明。

**评审注意**：规范化只忽略空白与非 JSDoc 注释；成员顺序和声明结构仍比较。清单只覆盖已登记 symbol；从未写入页面的新公开类型不会被发现（见 §2.5）。

**证据（固定提交）**

- `deepseek-harness/docs/subsystems/README.md:76-76@687f282e`
- `deepseek-harness/docs/AGENTS.md:43-43@687f282e`
- `deepseek-harness/scripts/verify-type-equiv.ts:1-10@687f282e`
- `deepseek-harness/scripts/verify-type-equiv.ts:316-391@687f282e`
- `deepseek-harness/scripts/type-equiv.manifest.json:1-9@687f282e`
- `deepseek-harness/scripts/run-gates.ts:836-856@687f282e`
- `deepseek-harness/package.json:125-125@687f282e`

<a id="subsystem-contracts-2.generated-cordis-region"></a>

### 2.4 生成的 Cordis API 区：一服务/事件一页，标记内替换，双语与 `--check` 新鲜度

**何时读**：新增/重命名 `ctx` 服务或事件作用域；新增/删除 `@Remote` 方法或事件成员；门报 stale/partition；要补页面骨架。

**规则（义务）**

1. 每个 `ctx.<key>` 服务和每个事件作用域必须映射到**恰好一个** `docs/subsystems` 页面；映射由生成器的 curated 表拥有。
2. 被映射页面必须恰好有一个 BEGIN/END `cordis-surface` 标记区；END 必须在 BEGIN 之后；只认本生成器的精确标记。
3. 生成器只替换标记内区域，保留页面其余字节；**不得手改生成区**。
4. 英文与中文两侧同时生成；中文侧只本地化配对文档路径，其余字节保持。
5. 仅生成区再生成不需要人工翻译或新 sidecar；区域外正文变化确认两侧后显式重录。头部说“仅区域外未变才重录”，但当前 `computeOutputs`/`main` 没有 writer；这是注释与实现的区别，不是要求为区域内变化再增加一个无用的 sidecar writer。
6. 渲染出的 key/scope 必须在映射表中；映射条目必须仍能渲染；声明但投影不可见的 key/事件必须有具名 walk exemption；豁免必须新鲜。投影渲染而独立扫描未发现的声明是扫描盲区，应修扫描，不得加豁免掩盖。
7. `--check` 逐字节比较实际输出。子系统页 `Source:` 链接去掉行号；runtime 等其他输出仍可携带源码位置并因插行 stale。原始方法/事件 JSDoc、具名 anchor 与类型链接由 renderer 产生，而不是另一套手抄 API。

**操作**

1. 确认目标服务/事件已有 `SERVICE_PAGE` / `EVENT_SCOPE_PAGE` 映射；新 key 先让投影可渲染。
2. 运行 `pnpm run gen-cordis-catalog`。
3. 检查两侧生成区；手工正文或配对记录需更新时，确认两侧后显式运行 `pnpm run verify-translation-pairing --write <page>`。Cordis CLI 本身不重录 sidecar。
4. 在 PR 上运行 `pnpm run verify-cordis-catalog`（即 `--check`）。
5. 页面不存在或标记缺失时，先补页面骨架/映射，再重跑。

**标记骨架**（页面只保留一次；生成器拥有内容）

```html
<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>
…generator-owned content…
<!-- END GENERATED cordis-surface -->
```

**失败与恢复**

| 失败文本 | 含义 | 恢复 |
|---|---|---|
| `stale — <files>. Run pnpm run gen-cordis-catalog and commit the result.` | 某实际输出与源码/投影不一致 | 重新生成并提交两侧输出；需要配对重录时先确认两侧，再运行配对 `--write` |
| `expected exactly 1 cordis-surface region, found N BEGIN/M END` | 标记缺失或重复 | 页面只保留一组精确标记 |
| `cordis-surface END marker precedes its BEGIN` | 标记顺序反了 | 调换/重写标记 |
| `service ctx.<key> (...) has no SERVICE_PAGE entry` | 渲染了未映射服务 | 加映射；或补 walk exemption（仅限不可渲染） |
| `SERVICE_PAGE maps 'ctx.<key>' but the projection discovers no such service` | 映射过期 | 删除过期条目 |
| `... is declared ... but invisible to the rendering projection` | 声明存在但投影看不到 | 让 key 可渲染并加映射，或写具名 walk exemption |
| `... is rendered ... but still listed in ..._WALK_EXEMPTIONS` | 豁免过期 | 删除豁免 |
| `... the scan has a blind spot ...` | 投影渲染了扫描看不到的 key/事件 | 修扫描，不是改映射 |

**例外**

- 继承的 vendor 层渲染到 `docs/cordis-api/inherited.md`，不是子系统页。
- 客户端面/不可达的 Events 合并没有渲染投影时，可用 `EVENT_WALK_EXEMPTIONS` 具名豁免并写明文档 owner；一旦可渲染必须删除豁免。
- 没有 Cordis 表面的页面不生成区域；生成器只处理被映射的页面。

**评审注意**：生成检查证明输出与投影一致，不证明区域外散文、产品调用权限或业务行为。页内 Source 链接是文件级；检查还包含 runtime/core API 等输出。目标尚缺等价 API 投影/检查的实际集成和运行证据，不能降级源自动门。仅生成区变化无需新配对记录；整页生成器写配对散文/sidecar 是另一个具体合同，不从 Cordis 头部推断。

**证据（固定提交）**

- `deepseek-harness/docs/subsystems/README.md:5-5@687f282e`
- `deepseek-harness/docs/AGENTS.md:33-33@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1-21@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1070-1081@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1106-1116@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1130-1196@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1198-1266@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1267-1307@687f282e`
- `deepseek-harness/scripts/run-gates.ts:836-856@687f282e`
- `deepseek-harness/package.json:162-163@687f282e`
- `deepseek-harness/docs/subsystems/feedback.md:289-289@687f282e`
- `deepseek-harness/docs/subsystems/extensions.md:7-9@687f282e`
- `deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:918-992@687f282e`
- `deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:1002-1036@687f282e`
- `deepseek-harness/docs/subsystems/agent-team.md:127-231@687f282e`


<a id="subsystem-contracts-2.same-change-page-update"></a>

### 2.5 同一变更更新页面：漂移自动抓，未文档化新类型靠评审

**何时读**：改公开类型/服务/事件；新增公开类型；评审含 API 变化的 PR。

**规则（义务）**

1. 重塑已文档化类型的**同一变更**必须更新 owning subsystems 页；不能留到后续 PR。
2. 新增公开类型必须在评审中决定归属页并写入；`verify-type-equiv` 不会发现从未出现的类型。
3. 类型记录在其声明包组所链接的页面上，不记录在无关页面。
4. 生成 API 变化时运行生成器并提交结果；不得手改生成区。
5. 页面只陈述当前状态；历史放提交/PR/Agent Note；不写 `implemented!`/`future:` 之类状态注解，不手抄 catalog。
6. 链接更新与页面更新同批；本地链接由 `verify-md-links` 检查。

**操作**

1. 在 PR 中识别公开类型/服务/事件的变化。
2. 找到声明包组链接的 owning 页面与现有块。
3. 更新页面块与清单；新类型先定归属页。
4. 运行 `pnpm run gen-cordis-catalog`、`pnpm run verify-type-equiv`、`pnpm run doc-typecheck`。
5. 评审确认：新公开类型有页面；页面没有复制历史/状态注解/第二份 catalog。

**失败与恢复**

- 只改源类型不改页面 → `DRIFT`；按 §2.3 恢复。
- 只改服务签名不生成 → `stale`；按 §2.4 恢复。
- 新增从未文档化的公开类型 → **所有自动门仍通过**。这是已知盲区；恢复方式是在评审中指定 owning page、补块与清单后再合并。

**例外**

- 机械/局部编辑可豁免 Agent Note，但不豁免 owning page 的类型更新。
- 仅内部使用、不构成公开契约的类型可不进页面；评审中说明理由。
- stale 必须通过重新生成解决，不能手改。

**证据（固定提交）**

- `deepseek-harness/docs/AGENTS.md:43-44@687f282e`
- `deepseek-harness/docs/subsystems/README.md:76-76@687f282e`
- `deepseek-harness/scripts/verify-type-equiv.ts:1-10@687f282e`
- `deepseek-harness/scripts/gen-cordis-catalog.ts:1267-1307@687f282e`
- `deepseek-harness/docs/AGENTS.md:65-68@687f282e`
- `deepseek-harness/docs/AGENTS.md:40-40@687f282e`
- `deepseek-harness/docs/AGENTS.md:77-77@687f282e`

<a id="subsystem-contracts-2.documented-limits-and-status"></a>

### 2.6 显式状态、边界与限制：experimental/partial/不可回放必须写清

**何时读**：新增实验性/可选能力；实现只提供部分强制；评审一个声称“支持”某能力的页面。

**规则（义务）**

1. 实验性能力在页首或状态段明确写 `experimental`/实验性，并说明是否默认关闭。
2. 区分 `full` 与 `partial` 强制；partial 必须说明覆盖面与消费方应如何处理，不能四舍五入成 full。
3. 明确写出没有的能力：无队列、无重试、无去重、无执行状态、无崩溃回放、无完成结果等。
4. 区分“成功运行”与“证明所有限制都已执行”；不得把成功结果当作强制证明。
5. 写信任边界（如无认证 actor、假设可信调用方）与不可回放/不可重连行为。
6. 限制集中成 Limits/Boundaries 段或紧邻相关契约，不散落。
7. 状态注解只描述当前事实；历史状态放提交/Note。

**操作**

1. 列出实际保证与不保证的能力。
2. 页首写状态（experimental/optional/default-off）。
3. Limits/Boundaries 段逐条写限制、失败模式与调用方责任。
4. 类型可表达的限制放进类型（如排除 `danger-full-access`），其余用散文。
5. 评审对照实现与测试，确认没有把 partial 写成 full。

**源仓库的具体措辞示例**（迁移时重写，不要照抄平台细节）

| 页面 | 写法 |
|---|---|
| `worktrees` | `The experimental ... service`，并写默认可关闭 |
| `translation` | `The experimental translator ...` |
| `voice-input` | `Experimental speech recognition ...` |
| `agent-team` | `the experimental implicit-root Team domain` |
| `webhook` | `no queue, retry, deduplication, execution status, crash replay, ...` |
| `sandbox` | `Enforcement is a reported fact.` + `full`/`partial` |
| `ptc-runtime` | 成功运行不证明每条限制都执行 |
| `ssh` | 如实报告未确认结果，绝不重连重放 |
| `client-resources` | `## Limits` 段 |
| `feedback` | `## Boundaries and limitations` 9 条 |

**失败与恢复**

- 删除 Limits 段或把 partial 写成 full：**现有门不会失败**。评审必须拒绝；恢复是补回限制段并如实写 partial/full。
- 把 `danger-full-access` 纳入 `ConfinedSandboxMode`：类型检查失败；恢复是保留排除。

**评审注意**：没有“限制段存在”的自动检查；限制会随实现过期；平台特定限制（Landlock/Windows ACL）不能直接迁移。

**证据（固定提交）**

- `deepseek-harness/docs/AGENTS.md:46-46@687f282e`
- `deepseek-harness/docs/AGENTS.md:40-40@687f282e`
- `deepseek-harness/docs/subsystems/worktrees.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/translation.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/voice-input.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/agent-team.md:5-5@687f282e`
- `deepseek-harness/docs/subsystems/webhook.md:23-23@687f282e`
- `deepseek-harness/docs/subsystems/sandbox.md:30-30@687f282e`
- `deepseek-harness/docs/subsystems/ptc-runtime.md:75-75@687f282e`
- `deepseek-harness/docs/subsystems/ssh.md:23-23@687f282e`
- `deepseek-harness/docs/subsystems/client-resources.md:90-92@687f282e`
- `deepseek-harness/docs/subsystems/feedback.md:305-316@687f282e`

<a id="subsystem-contracts-2.durable-contract-versioning"></a>

### 2.7 持久化契约版本化：单一事件类型、严格历史解码、缓存版本与历史非权威

**何时读**：新增/修改持久事件或 Session 格式；改历史解码器/fold；改投影序列化字段；判断历史能否作为当前状态权威。

**规则（义务）**

1. 内存事件日志是唯一事实来源；持久化是在既有 `SessionEvent` 上的一个抽象服务，不引入并行的持久事件类型。
2. provider 实现同一 `SessionPersistence` 契约并通过共享契约测试套件。
3. 历史解码器/fold 拒绝未知版本、额外字段、复用 id 和非法状态转换。
4. Session 历史不是活动任务的权威；活动视图从当前权威状态推导。
5. 投影 `stateVersion` 在序列化字段或 fold 语义变化时提升，使旧 `(sessionId, key, ver, seq, val)` 行被丢弃而不是前向应用。
6. 版本特定数字保留在契约旁；通用格式散文链接版本/状态权威页，不复制版本表。

**源仓库的严格解码示例**：`schedule` 的版本 1 存储域要求每条任务记录有非空、已 trim、至多 120 字符的 `title`；缺失、空白、带首尾空白或超长都会让整个 domain 打开失败，没有 backup-and-skip 策略。这条比“字段可选”更适合作为持久契约的默认写法：解码失败是显式的，不是静默丢记录。

**操作**

1. 判断变更是否触及持久事件、历史解码或投影缓存。
2. 复用既有事件类型与 `SessionPersistence` 契约，不新建平行持久类型。
3. 在解码器拒绝未知版本/额外字段/复用 id/非法转换，并补契约测试。
4. 序列化字段或 fold 语义变化时提升 `stateVersion`，验证旧缓存被丢弃。
5. 页面写清历史非权威、版本差异和 provider 共享套件。

**失败与恢复**

- 放松解码或不提升 `stateVersion` 可能不会立即让现有门失败；后果是旧数据被误读或缓存前向应用。恢复是提升版本/`stateVersion`、补迁移/解码测试、丢弃旧缓存。
- 把历史记录当作活动任务权威：评审拒绝；恢复是从当前记录重建视图。

**例外**

- 纯展示性、非持久字段变化不必提升 `stateVersion`。
- 历史可用于审计/回放展示，但不能作为活动任务权威。
- 可按发布线保留多个历史解码器，但旧解码器不得接受新字段。

**证据（固定提交）**

- `deepseek-harness/docs/subsystems/persistence.md:5-7@687f282e`
- `deepseek-harness/docs/subsystems/persistence.md:329-329@687f282e`
- `deepseek-harness/docs/subsystems/session-projection.md:60-66@687f282e`
- `deepseek-harness/docs/subsystems/schedule.md:239-239@687f282e`
- `deepseek-harness/docs/subsystems/schedule.md:9-9@687f282e`
- `deepseek-harness/docs/subsystems/schedule.md:265-265@687f282e`
- `deepseek-harness/docs/AGENTS.md:40-40@687f282e`

<a id="subsystem-contracts-2.provider-conformance-and-verification"></a>

### 2.8 可替换 provider 的契约与验证：MUST 列表、fail-closed、dispose 与页面枚举的测试结果

**何时读**：新增 adapter/provider/seam 实现；改 provider 错误/清理/超时；评审替代实现；为行为密集型页面补验证义务。

**规则（义务）**

1. LLM adapter 必须遵守页面 MUST：`usage` 在 `finish` 前、`finish` 后无块；工具参数保持原始 JSON 字符串；错误只走 throw 或 in-band finish；一次适配器调用 = 一次 provider 尝试；传输层有界 stall；上下文溢出用规范 code；空完成是 retryable error；每请求带归因头并用 wire-level 测试证明。
2. 持久化 provider 实现同一 `SessionPersistence` 契约并通过共享套件。
3. 沙箱 provider 报告 `full`/`partial`；对 confined policy 绝不允许静默无约束透传；无可用后端以 `SANDBOX_UNAVAILABLE` 失败。
4. 终端 provider 完整指定 argv/cwd/env/终端类型/尺寸/清理宽限，并记录 substrate-specific 可观测性限制。
5. LSP seam 是封闭操作联合，无协议逃生口；新增操作是跨 seam/provider/tool 的编译强制变更。
6. workflow 消费者在所有路径 `dispose`；hook 误用以 fatal 错误抛出并被组合器重新抛出。
7. 行为密集型页面列出聚焦测试要建立的结果，并链接实现文件；不能只写“已测试”。

**操作**

1. 在页面找到 seam 的 provider 契约/MUST 列表。
2. 每条实现映射到至少一个测试（wire-level、契约套件或聚焦单测）。
3. 测试错误路径：fail-closed、规范 code、清理。
4. 页面补验证义务（结果列表）与实现文件链接。
5. 评审对照页面义务与测试，确认没有“页面写了但没人测”或“测试测了但页面没写”。

**源仓库的验证义务示例**

- LLM adapter：8 条 MUST，其中归因头要求 `prove it with a wire-level test`。
- persistence：shipped provider `passes the shared persistence contract suite`。
- sandbox：`Silent unconfined passthrough is never legal for a confined policy.`
- subprocess：`providers document substrate-specific observability limits.`
- LSP：`no protocol escape hatch`；新增操作编译失败。
- workflow：`must dispose on every path`；fatal 错误 `RE-THROW`。
- conversation：8 条验证结果 + 实现文件链接。

**失败与恢复**

- 违反 MUST 的 provider 可能在自身测试中失败；若没有测试或页面没列，现有门不会发现。
- 页面删掉一条 MUST 但测试仍在，或测试删掉但页面仍声称覆盖：现有门不会自动发现；评审必须拒绝。
- 恢复：修实现或补测试；若是刻意的平台差异，写进 exceptions 并调整页面义务。

**例外**

- provider 可以有 substrate-specific 可观测性限制，但必须写明。
- 不同 provider 的错误文本可以不同，但规范 code 必须一致。
- 页面可链接包 README 的更长契约；子系统页保留消费者可依赖的最小集合。

**证据（固定提交）**

- `deepseek-harness/docs/subsystems/llm-streaming.md:296-305@687f282e`
- `deepseek-harness/docs/subsystems/persistence.md:329-329@687f282e`
- `deepseek-harness/docs/subsystems/sandbox.md:154-156@687f282e`
- `deepseek-harness/docs/subsystems/subprocess.md:245-247@687f282e`
- `deepseek-harness/docs/subsystems/lsp.md:11-11@687f282e`
- `deepseek-harness/docs/subsystems/lsp.md:142-143@687f282e`
- `deepseek-harness/docs/subsystems/workflow.md:95-95@687f282e`
- `deepseek-harness/docs/subsystems/workflow.md:116-116@687f282e`
- `deepseek-harness/docs/subsystems/conversation.md:288-301@687f282e`

<a id="review-checklist"></a>

## 3. 评审清单

对每个涉及 `docs/subsystems` 的 PR：

- [ ] 新增/修改的类型在 owning page 上，且包组 README 链接该页（§2.1、§2.2）。
- [ ] 改动的类型块与源码结构、JSDoc 一致；没有新增 orphan block/entry（§2.3）。
- [ ] 生成区不是手改的；`verify-cordis-catalog` 通过（§2.4）。
- [ ] 新公开类型有页面；不是“自动门通过所以一定覆盖”（§2.5）。
- [ ] 实验性/部分强制/不可回放/信任边界都写在页面旁（§2.6）。
- [ ] 持久事件没有平行类型；历史解码严格；`stateVersion` 在需要时提升（§2.7）。
- [ ] provider 的每条 MUST 有测试或明确豁免；页面列了验证结果（§2.8）。
- [ ] 中文页与 `.i18n.yaml` 已按配对流程更新（配对机制属 documentation 域；本域只负责页面内容同步）。
- [ ] 页面没有实现状态注解、历史叙述或手抄 catalog（`docs/AGENTS.md` 的 slop checklist）。

<a id="migration-checklist"></a>

## 4. 迁移清单

迁移到另一个仓库时，保留机制，不照抄名字：

1. **参数化路径**：subsystem 页面目录、README 索引文件、包组 glob、生成器命令、清单路径。
2. **保留四条自动门**（能实现几条就实现几条，其余明确标为评审）：
   - 包组 → 页面直接链接 + 显式豁免 + 过期清理；
   - 类型块 ↔ 源码 1:1 + 结构/JSDoc 比较；
   - 生成区标记 + 区域替换 + `--check` 逐字节；
   - 未文档化新类型的评审补位（没有自动门，必须在评审清单里写明）。
3. **状态词表**：experimental / optional / default-off / full / partial / unavailable；把“没有的能力”写成列表，而不是让读者推断。
4. **持久化规则**：单一事件类型、严格历史解码、缓存版本、历史非权威；按目标仓库的事件模型重写，不要照抄 `SessionEvent`。
5. **provider 契约**：把 MUST 列表与测试路径一起迁移；没有测试的 MUST 只能算愿望。
6. **验证**：先跑目标仓的链接门、类型门、生成检查；再用一个 fixture 验证每道门的**拒绝**路径（缺链接、orphan、stale、双标记），不要只验证通过路径。
7. **不要迁移**：源仓库的具体豁免组名、平台限制、LLM/沙箱专业规则，除非目标仓库有同样的包组和 seam。

## 5. 证据边界

- 本文件只声明在固定提交上实际读过的行；未读的生成区不当作手工契约。
- 中文长段落行会超过阅读器的显示宽度上限；这些行已用 `:raw:<line>` 按原始字节复核，不把截断前缀当作完整句子。英文超过 768 字符的行同样按 `:raw` 复核。
- “自动门”指源仓库中可运行的脚本/CI；目标仓库没有对应脚本时，该条只能按评审义务使用。
- 中文页与英文页是同一契约的配对；本文件不把中文页当作独立机制来源，迁移时仍要同步两侧。
- `docs/subsystems/README.md` 的 66 行索引覆盖整个目录；本域只负责其中的 34 个页面。其余页面属于其他域，不在本文件的证据范围。
