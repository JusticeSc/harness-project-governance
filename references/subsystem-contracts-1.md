# 项目治理迁移参考：子系统契约页（subsystem-contracts-1）

本参考从固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 33 个英文子系统参考页、33 个中文页、33 个 `.i18n.yaml` 配对记录，以及实际强制它们的生成器/验证器中提取可迁移的文档治理机制。它不是对页面内容的摘要，而是一组操作程序：每节给出触发、前置条件、义务、角色、步骤、完成信号、失败处理、例外、迁移实现、验证义务与证据限制。

**证据边界。** 所有验证均为“计划”，未在源仓执行任何构建、测试、门禁、格式化或生成器；本文不声称任何门禁曾在本次提取中运行。生成区行号由机器扫描 `BEGIN/END GENERATED` 标记得到；生成区内部只抽样阅读（见 coverage 的逐文件 ranges）。33 个英文页的**作者区**逐页阅读；33 个中文页的作者区与页首也逐页阅读（其中 `scope`、`slots`、`sidebar-right` 无生成区，全文阅读），中文生成区只读抽样与边界。33 个 `.i18n.yaml` 侧车全文逐行读取，但只作为配对哈希结构证据，不作为译文质量证据。阅读器单行上限按显示列计（CJK/全宽按 2 列），整次读取另有 50KB 输出上限；凡声称读过的行中源码点 ≥385（保守 2 列上限）或显示宽度 ≥768 的候选行均以 `read <path>:<line>:raw` 重读，中文长页按输出上限分段（`session.zh.md` 1-815 分 1-810 与 811-815 两次读完）。coverage 的 `method.longLineRereads` 列出英文、中文与支撑文档的实际行号，不用哈希代替阅读证据。逐页对照后未发现中文页新增或冲突于英文契约的强制规则；中文页仍按同等权威副本记录，而不是纯翻译噪音。

**本次接续补充。** 上段保留原作者阶段的阅读方法；当前另对 53 个候选尾部完成了整个生成区的结构解析，并对 26 组 EN/ZH 生成区做了严格比较，而非只沿用抽样。严格比较复现源消费者算法（`deepseek-harness/scripts/verify-translation-pairing.ts:283-313@687f282e`）：只用源谓词归一化配对文档链接目标，再要求整区逐字节相等、0 行豁免（`verification/evidence/raw/p1-subsystem-one-strict-locale.json`）。**旧的“逐行比较、仅允许本地化链接”表述已撤回**：旧探针把任何含 `](` 或以 `Types:` 开头的差异行整行排除，26 对虽都记为 `localizedLinkOnly: true`，实际 67/67 条差异行从未比较；旧记录 `verification/evidence/raw/p1-subsystem-one-tails-structure.json` 原样保留，不作现役证据。原始 JSDoc 含义仍未逐定义语义审阅，源生成器/门禁未执行；结构观察不替代目标效果或独立验收。

## 适用方式

1. **先判定页面形态。** 目标项目的“子系统参考页”是否同时含生成区与作者区？源仓 30/33 页含 `cordis-surface` 生成区，3 页（`scope`、`slots`、`sidebar-right`）没有。不要给纯作者页硬造生成区。
2. **保留效果，不照搬工具名。** 关键效果是：单一所有权索引、类型粘贴漂移检查、生成区新鲜度、三件套配对、同变更更新义务。目标项目可以用不同脚本实现，但必须分别有对应的失败行为。
3. **区分强制模式。** 自动门禁与“仅评审”不得混写。源仓明确声明：`verify-type-equiv` 只能抓“已粘贴但漂移”的类型，抓不到“从未被记录的新类型”（`deepseek-harness/docs/AGENTS.md:44-44@687f282e`）；配对门禁通过也不等于译文正确（`deepseek-harness/docs/i18n/README.md:44-44@687f282e`）。
4. **记录未激活。** 若目标项目没有 `ctx` 服务/事件目录，`SERVICE_PAGE` 等价映射与生成区新鲜度就不适用；写下触发事实与重新激活条件，而不是静默删除。
5. **例外必须可审计。** 例如包组豁免要带理由字符串，陈旧豁免本身是错误（`deepseek-harness/scripts/verify-subsystem-pages.ts:1-30@687f282e`）。

## 术语与固定标识

- **子系统页**：`docs/subsystems/<name>.md`，一篇只讲一个子系统的词汇、语义与生成 API。索引页为 `docs/subsystems/README.md`。
- **作者区**：生成标记之外的 Markdown；可翻译、可人工编辑。
- **生成区**：`<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->` 与 `<!-- END GENERATED cordis-surface -->` 之间；由 `scripts/gen-cordis-catalog.ts` 写入。
- **`ts type-equiv` 块**：逐字粘贴的完整类型声明及其原始 JSDoc，必须与源声明结构/JSDoc 一致。
- **`ts public-api` 块**：去掉方法体、保留公开签名的类声明，用于 `Session` 之类的公开类。
- **`ts cordis-catalog` 围栏**：生成区内展示签名与原始 JSDoc 的代码块，不是作者手写内容。
- **三件套**：`foo.md`、`foo.zh.md`、`foo.i18n.yaml` 三个同目录兄弟文件。
- **配对记录**：`.i18n.yaml`，每个“仍含语言相关内容的标题节”一条 `en`/`zh` 哈希。

## 快速判定表

| 你要做的事 | 先读 | 必须运行的检查（源仓名称） |
|---|---|---|
| 改一个已文档化类型的字段/JSDoc | §类型权威与同变更义务 | `pnpm run verify-type-equiv`、`pnpm run doc-typecheck` |
| 新增一个从未文档化的类型 | §类型权威与同变更义务 | 无自动覆盖；手工补页 + `verify-type-equiv`（补块后才有约束） |
| 改 `ctx` 服务、事件或 JSDoc | §生成区边界与新鲜度 | `pnpm run gen-cordis-catalog`，再 `pnpm run verify-cordis-catalog` |
| 新增/拆分子系统页或包组 | §所有权索引 | `pnpm run verify-subsystem-pages`、`pnpm run verify-cordis-catalog` |
| 改任一侧正文 | §双语三件套 | `pnpm run verify-translation-pairing --write docs/subsystems/<page>.md`，再全量 `pnpm run verify-translation-pairing` |
| 提交文档 PR 前 | §doc-sync 门禁组合 | `pnpm run doc-sync`（CI 另跑全量组合） |
| 判断一条规则放哪一层 | §事实单一归属 | 无自动检查；评审判断 |

## 33 页形态清单（机器扫描 + 作者区阅读 + 生成区结构解析）

“生成区”为英文页行号；“配对节”为 `.i18n.yaml` 条目数（文件行数减去 4 行文件头后除以 3）。“equiv”为 `ts type-equiv` 块数（不含 `public-api`；`session` 另含 1 个 `public-api` 块）。这些计数用于定位，不是质量评分。

| 页面 | 生成区 | equiv | 配对节 | 备注 |
|---|---|---|---|---|
| `session.md` | 812-1339 | 22 | 22 | 事件词汇 + `Session` 公开类；含 `public-api` |
| `tools.md` | 496-747 | 27 | 7 | 工具定义、schema DSL、执行瀑布 |
| `workspace.md` | 173-647 | 4 | 8 | 工作区实体与归档准入 |
| `subagent.md` | 395-686 | 16 | 8 | 提供方契约与目录 |
| `filesystem.md` | 280-530 | 14 | 10 | 文件 seam + 观察策略 |
| `sidebar-right.md` | 无 | 0 | 11 | 纯作者页；无 `ctx` 服务 |
| `credentials.md` | 65-489 | 3 | 7 | 生成区后仍有作者尾段（490-493） |
| `skills.md` | 239-352 | 14 | 8 | 注册表分层与发现优先级 |
| `session-query.md` | 367-511 | 25 | 8 | 查询词汇与错误码 |
| `compaction.md` | 135-284 | 6 | 6 | 合并声明的事件不能用 `type-equiv` |
| `shell.md` | 237-314 | 6 | 7 | 请求/spec 拆分 |
| `claude-code-mods.md` | 100-146 | 0 | 8 | 兼容差异表 |
| `storage.md` | 155-259 | 6 | 7 | 枢纽/后端/领域三层 |
| `user-questions.md` | 207-307 | 13 | 8 | 定时提问与投影 |
| `slots.md` | 无 | 0 | 8 | 纯作者页 |
| `client-modules.md` | 124-198 | 6 | 5 | Web 插件表 |
| `web.md` | 141-206 | 6 | 8 | 搜索/抓取两操作一能力 |
| `system-prompt.md` | 108-254 | 5 | 5 | 贡献者与装配上下文 |
| `session-telemetry.md` | 146-212 | 6 | 6 | 捕获/脱敏 waterfall |
| `permission-presets.md` | 77-167 | 3 | 5 | 两个 knob 捆成预设 |
| `session-reference.md` | 125-224 | 7 | 5 | 跨会话引用 |
| `commands.md` | 123-223 | 6 | 5 | 命令注册表 |
| `mcp.md` | 114-139 | 2 | 10 | MCP 客户端/资源服务 |
| `approval.md` | 90-170 | 4 | 5 | 一次性审批 |
| `deliverables.md` | 140-178 | 6 | 8 | 声明交付与轮末变更 |
| `terminal.md` | 93-184 | 6 | 5 | 持久 PTY |
| `plan.md` | 41-87 | 1 | 6 | 计划模式是软指引 |
| `office-to-pdf.md` | 44-87 | 0 | 5 | 无模型工具 |
| `spill.md` | 94-124 | 5 | 4 | 溢写存储 |
| `browser-use.md` | 41-67 | 0 | 5 | 唯一提供方槽 |
| `product-telemetry.md` | 25-81 | 2 | 2 | 显式产品埋点 |
| `computer-use.md` | 33-59 | 0 | 4 | 唯一提供方槽 |
| `scope.md` | 无 | 4 | 4 | 纯作者页；注册作用域原语 |

**迁移设计：** 目标项目应维护同样的“页面→所有权→生成区→配对记录”清单，但列名、路径与计数由目标仓库事实决定。**额外建议：** 清单从实际扫描生成，不要手工维护第二份计数；源仓的 README 表格本身是手工维护的，因此存在漂移可能。

**生成器覆盖保证与不保证（本域实测）。** 保证：每个映射页的两语言区域与继承层页、运行时 API 模块在 `--check` 下逐字节新鲜；映射并集之外的页面（`scope`、`slots`、`sidebar-right`）不会获得区域；区域内的锚点、服务/事件标题、`ts cordis-catalog` 围栏、`Types`/`Source` 尾部形状与页面归属可被完整结构核对。不保证：区域文字与 JSDoc 的含义正确性、被投影服务/事件在目标产品的真实行为、映射选择是否合理、页面是否应该有该服务、作者区散文与生成区是否语义一致。

<a id="subsystem-contracts-1-page-ownership-and-index"></a>
## subsystem-contracts-1-page-ownership-and-index — 子系统页所有权索引与包组归属

**来源事实。** 索引页声明“每个子系统一页”，并由 `Page | Owns` 表逐页写明该页拥有什么（`deepseek-harness/docs/subsystems/README.md:5-70@687f282e`）。文档分层表把 `subsystems/` 的职责定为“每个子系统一篇参考：类型定义、语义、生成的 Cordis API”，并明确“行为叙述 → architecture.md”（`deepseek-harness/docs/AGENTS.md:17-33@687f282e`）。

**触发。** 新增包组；新增 `ctx.<key>` 服务或事件作用域；拆页/合页；评审发现某页无人链接；某包的契约只存在于代码里。

**义务（源义务）。**

1. 每个子系统恰有一个主页；页首说明它拥有什么，索引表同步一行。
2. 每个包组要么从英文组 README 直接链接至少一个存在的 `docs/subsystems/*.md`，要么在 `GROUPS_WITHOUT_SUBSYSTEM_PAGE` 里带非空理由；包组没有组 README 本身是违规。
3. 每个被发现的 `ctx.<key>` 服务必须出现在 `SERVICE_PAGE`，每个事件作用域必须出现在 `EVENT_SCOPE_PAGE`，且各映射到恰好一个子系统页；反向也失败：映射了但投影发现不到，是陈旧条目。
4. 声明了 Context 合并但投影不可见的键，必须带具名 `SERVICE_WALK_EXEMPTIONS`/`EVENT_WALK_EXEMPTIONS` 理由；已被渲染却仍在豁免表中，是陈旧豁免。
5. 索引表的“Owns”描述准确性没有机械检查，属评审义务。

**角色。** 子系统所有者（页面与“Owns”描述）、包组所有者（README 链接）、文档评审者（索引准确性）、CI（链接/映射门禁）。

**步骤。**

1. 用 `packages/*/README.md` 与 `packages/*/*/package.json` 找出包组；确认它是否已有拥有页。
2. 在索引表加行；页首写清拥有的词汇、类型、服务/事件。
3. 在英文组 README 写直接链接 `../../docs/subsystems/<page>.md`（验证器只认这种相对形态，且忽略 `README.md`、`.zh.md`、代码块）。
4. 若新增服务/事件，在 `scripts/gen-cordis-catalog.ts` 的 `SERVICE_PAGE`（第 52 行起）或 `EVENT_SCOPE_PAGE`（第 221 行起）加条目。
5. 运行 `pnpm run verify-subsystem-pages` 与 `pnpm run verify-cordis-catalog`。
6. 评审“Owns”是否与页面实际内容一致。

**完成信号。** 审计输出 `N group(s) checked (M linked, K explicitly exempt), all conform.`（`deepseek-harness/scripts/verify-subsystem-pages.ts:123-136@687f282e`）；目录门禁报告所有生成文件/区域新鲜。

**失败处理。** 验证器以退出码 1 打印逐条违规：`no reader-visible direct docs/subsystems/*.md link`、`linked subsystem page does not exist`、`no matching package group; remove the stale entry`、`missing justification`、`links a subsystem page but remains exempt; remove the stale exemption`（`deepseek-harness/scripts/verify-subsystem-pages.ts:72-118@687f282e`）。目录侧会打印 `service ctx.<key> ... has no SERVICE_PAGE entry`、`SERVICE_PAGE maps 'ctx.<key>' but the projection discovers no such service` 等（`deepseek-harness/scripts/gen-cordis-catalog.ts:1131-1190@687f282e`）。

**例外。** `acp`、`bundle`、`sdk`、`test-support`、`util` 五个包组有显式理由（`deepseek-harness/scripts/verify-subsystem-pages.ts:17-23@687f282e`）；理由为空是错误；新包组不能“继承”豁免。

**迁移设计。** 保留“单一所有权 + 双向映射 + 陈旧条目失败”的语义；把包组发现 glob、页目录、豁免表参数化。**额外建议：** 目标项目若没有 `ctx` 概念，可把 `SERVICE_PAGE` 映射换成“模块/导出符号 → 页面”的映射，仍保持双向失败。

**证据限制。** 本机制未执行门禁；`verify-subsystem-pages` 只检查英文组 README 的直接链接，不检查索引表与页首描述是否同义。本域只覆盖 33 页；索引页列出的其余页面不在本域证据范围。

来源：deepseek-harness/docs/subsystems/README.md:1-76@687f282e 来源：deepseek-harness/docs/AGENTS.md:17-33@687f282e 来源：deepseek-harness/scripts/verify-subsystem-pages.ts:1-30@687f282e 来源：deepseek-harness/scripts/verify-subsystem-pages.ts:34-61@687f282e 来源：deepseek-harness/scripts/verify-subsystem-pages.ts:62-137@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:40-52@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1131-1190@687f282e 来源：deepseek-harness/scripts/run-gates.ts:846-846@687f282e

<a id="subsystem-contracts-1-tier-home-and-page-scope"></a>
## subsystem-contracts-1-tier-home-and-page-scope — 事实单一归属：参考层级与页作用域

**来源事实。** “每个事实只有一个家”（`deepseek-harness/docs/AGENTS.md:17-17@687f282e`）。分层表的完整分工是：根/子树 `AGENTS.md` 放常驻命令；`architecture.md` 放行为地图；`subsystems/` 放类型定义、语义与生成 API；Agent Notes 放决策理据；包 README 放包契约；生成引用由生成器拥有（`deepseek-harness/docs/AGENTS.md:19-33@687f282e`）。页面自身也复述边界：子系统页与 `architecture.md` 互补，后者描述跨子系统的*行为*（`deepseek-harness/docs/subsystems/README.md:5-5@687f282e`）。

**触发。** 想在一页里解释“为什么这样设计”；想把某能力写进 `core.md`；发现同一规则在架构页、包 README、子系统页各写了一遍；评审质疑“这段该放哪”。

**义务（源义务）。**

1. 子系统页只描述自己的主题，子目录只按用途/职责/高层行为提及并链接到拥有者；不得展开后代细节。
2. 行为叙述（服务地图、会话/轮/步生命周期、事件分类）去 `architecture.md`；决策理据去 Agent Note；单包配置/限制/扩展点去包 README。
3. 可选能力的词汇定义在子系统页而非 `core.md`：`web`、`compaction`、`storage`、`skills` 都明确写“不属于 agent loop 主干，因此词汇定义在此而非 core.md”（`deepseek-harness/docs/subsystems/web.md:1-7@687f282e`、`deepseek-harness/docs/subsystems/compaction.md:1-5@687f282e`、`deepseek-harness/docs/subsystems/storage.md:1-7@687f282e`、`deepseek-harness/docs/subsystems/skills.md:1-6@687f282e`）。
4. 跨页重复的规则要搜同一措辞，保留一个家，其余改链接（`deepseek-harness/docs/AGENTS.md:67-70@687f282e`）。
5. 文档写当前状态，不写历史、迁移计划或“已实现/未来”状态标注（`deepseek-harness/docs/AGENTS.md:41-42@687f282e`）。

**角色。** 页面作者（选择层级）、子系统所有者（页作用域）、评审者（重复与错层判断）。

**步骤。**

1. 先定位：这条事实的拥有者是谁（类型/行为/理据/包契约/生成数据）。
2. 若属于类型或子系统词汇，写进拥有页；行为段落移到 `architecture.md` 并在此留一句链接。
3. 若属于包配置/限制，写包 README；子系统页只保留跨包契约。
4. 全库搜索独特短语，删除重复副本。
5. 评审确认没有“同义两处”。

**完成信号。** 评审通过“单一家庭”检查；页面能回答“这是什么、移动哪些数据结构”，而不是复述实现故事。

**失败处理。** 无自动失败。错层的典型症状：`architecture.md` 出现字段级定义；子系统页出现逐包安装步骤；同一事件语义在两页措辞不一致。

**例外。** 跨页通用模式可留在 `core.md`（如 branded id 模式）并被其他页引用；包 README 拥有生成目录之外的配置细节。生成区内的 API 文字不参与“作者事实”判断，它由生成器拥有。

**迁移设计。** 保留五层分工与“可选能力词汇留在能力页”的规则；目标项目可改名，但必须给每一层写“这里不放什么”。**额外建议：** 把“同义两处”做成评审清单项，而不是新门禁；源仓没有事实归属检查器。

**证据限制。** 分层表是散文规则，无机械校验；本机制为评审强制。“哪些页真正做到了单一归属”需要评审判断；本域已逐页阅读 33 个英文页与 33 个中文页的作者区，但阅读本身不能证明全库无重复。

来源：deepseek-harness/docs/AGENTS.md:17-33@687f282e 来源：deepseek-harness/docs/AGENTS.md:41-42@687f282e 来源：deepseek-harness/docs/AGENTS.md:67-70@687f282e 来源：deepseek-harness/docs/subsystems/README.md:5-5@687f282e 来源：deepseek-harness/docs/subsystems/compaction.md:1-5@687f282e 来源：deepseek-harness/docs/subsystems/storage.md:1-7@687f282e 来源：deepseek-harness/docs/subsystems/web.md:1-7@687f282e 来源：deepseek-harness/docs/subsystems/skills.md:1-6@687f282e

<a id="subsystem-contracts-1-same-change-type-authority"></a>
## subsystem-contracts-1-same-change-type-authority — 类型权威与同变更更新义务

**来源事实。** 文档标准要求：重塑一个已文档化类型时，拥有它的子系统页**在同一变更内**更新；`verify-type-equiv` 只抓漂移的粘贴，抓不到从未被记录的新类型；类型记录在声明它的包组页上（`deepseek-harness/docs/AGENTS.md:44-44@687f282e`）。索引页底部给出机制细节：页上的类型声明及其 JSDoc 与源等价，由 `pnpm run verify-type-equiv` 检查；普通块保留完整声明，`public-api` 块保留去方法体的公开类声明（`deepseek-harness/docs/subsystems/README.md:76-76@687f282e`）。

**触发。** 改 `packages/**/src/**` 的导出类型；新增公开类型；改类型 JSDoc（参数/返回/失败语义）；把代码块粘贴进子系统页；评审发现页上类型与源不一致。

**义务（源义务）。**

1. 完整类型 + 原始 JSDoc 用 ` ```ts type-equiv `；去方法体的公开类用 ` ```ts public-api `；两者都要登记到 `scripts/type-equiv.manifest.json`。
2. 块与清单 1:1：每个块要有条目，每个条目要有块；同一文档同一符号同一投影重复出现是错误。
3. 清单条目引用不存在或在扫描范围外的文档是错误；符号在源文件中找不到是错误。
4. 比较是“规范化结构 + 规范化 JSDoc”：源与文档的声明结构必须相等，JSDoc 数组必须逐项相等；不等即 `DRIFT`。
5. 中文页的同一块是“派生副本”，必须字节一致，不单独登记；由未加 `.zh.md` 的兄弟块经派生检查。
6. 新增类型没有自动发现机制，必须由作者主动补页；这是评审义务，不是门禁保证。
7. 合并声明（`declare module`）里的变体不能用 `type-equiv` 粘贴，因为提取器只按名字匹配顶层声明；改在散文表格/目录中记录并链到目录所有者（`deepseek-harness/docs/subsystems/compaction.md:23-23@687f282e`）。

**角色。** 类型所有者（源声明与 JSDoc）、页面作者（粘贴与清单条目）、评审者（是否漏记新类型）、CI（漂移/孤儿/重复）。

**步骤。**

1. 改源类型后，找到声明包组拥有的子系统页。
2. 用完整声明块替换旧块；同步 JSDoc（含 `@param`/`@returns`/`@throws`）。
3. 在 `scripts/type-equiv.manifest.json` 增加/更新 `{doc,symbol,source}`；`public-api` 条目加 `projection`。
4. 同步中文页的同一块，保持字节一致。
5. 运行 `pnpm run verify-type-equiv`；必要时运行 `pnpm run doc-typecheck` 证明围栏可编译。
6. 评审确认“没有从未记录的新类型”。

**完成信号。** `verify-type-equiv: N type-equiv block(s) match source structure and JSDoc (1:1 with manifest); M paired derivative(s).`（`deepseek-harness/scripts/verify-type-equiv.ts:384-384@687f282e`）。

**失败处理。** 逐条错误：`DRIFT: <doc>:<line> — type-equiv block for <symbol> does not match <source>` 并打印两侧结构与 JSDoc；`has no manifest entry — add one`；`manifest entry ... has no matching type-equiv block — remove it or add the block`；`duplicate type-equiv block`；`manifest references ..., which does not exist`；`symbol ... not found in ...`（`deepseek-harness/scripts/verify-type-equiv.ts:293-381@687f282e`）。修复方式是改块或改清单，不得放宽比较。

**例外。** 合并声明的事件负载（如 `SessionEventMap` 的插件扩展）不走 `type-equiv`；`Session` 这类公开类用 `public-api`。源仓的清单在本快照含 493 条 `docs/subsystems/` 条目（机器读取 JSON 统计，非散文声明），说明该义务是逐符号登记的，不是整页级。

**迁移设计。** 保留“逐字粘贴 + 清单 1:1 + 结构/JSDoc 比较 + 派生翻译副本”的语义。目标项目若语言不同，可用 AST 比较替代 TS 编译器；必须保留“孤儿块/孤儿条目/重复”三类失败。**额外建议：** 给新类型加一条评审清单项（“是否新增了公开类型但未登记？”），因为自动检查永远看不到不存在的东西。

**证据限制。** 未运行验证器；未逐条核对 493 条清单条目；本域 33 页中只有 27 页含 `type-equiv` 块。`public-api` 仅 `session` 页出现 1 次。

来源：deepseek-harness/docs/AGENTS.md:43-44@687f282e 来源：deepseek-harness/docs/subsystems/README.md:76-76@687f282e 来源：deepseek-harness/docs/subsystems/compaction.md:23-23@687f282e 来源：deepseek-harness/docs/subsystems/session.md:250-523@687f282e 来源：deepseek-harness/scripts/verify-type-equiv.ts:280-391@687f282e 来源：deepseek-harness/scripts/type-equiv.manifest.json:1-3@687f282e 来源：deepseek-harness/scripts/type-equiv.manifest.json:588-614@687f282e 来源：deepseek-harness/scripts/run-gates.ts:824-824@687f282e

<a id="subsystem-contracts-1-generated-cordis-region"></a>
## subsystem-contracts-1-generated-cordis-region — 生成区边界与 Cordis API 新鲜度

**来源事实。** 索引页说明：当 `ctx` 服务或事件作用域支撑某子系统时，该页有一段生成的 **Cordis API**（`deepseek-harness/docs/subsystems/README.md:5-5@687f282e`）。生成器头注释说明它把每个 `ctx.<key>` 服务和事件作用域映射到恰好一个子系统页，把区域注入两语言侧、只本地化配对文档路径、其余字节保留，并且“仅当区域外没有变化时”才重录该对的 `.i18n.yaml`（`deepseek-harness/scripts/gen-cordis-catalog.ts:1-16@687f282e`）。生成区内的固定样板（含生成命令与新鲜度命令）见 `deepseek-harness/docs/subsystems/session.md:812-820@687f282e` 与 `deepseek-harness/docs/subsystems/credentials.md:65-68@687f282e`。

**声明与实现不一致（保留，不按声明推导义务）。** 头注释的“重录 `.i18n.yaml`”只是设计声明：`computeOutputs` 的产物清单是继承层页、运行时 API 模块、每个映射页的两语言文档（`deepseek-harness/scripts/gen-cordis-catalog.ts:1198-1260@687f282e`），`main` 再追加 core API 页（`deepseek-harness/scripts/gen-cordis-catalog.ts:1267-1271@687f282e`）；生成器全文只有一处 `writeFileSync`（`deepseek-harness/scripts/gen-cordis-catalog.ts:1294-1301@687f282e`），没有任何侧车写入者。区域变化不需要新记录，是因为配对记录按设计排除生成区（`deepseek-harness/scripts/translation-pairing-record.ts:152-163@687f282e`），而不是因为生成器重录；源文档也明确写“regeneration never requires a manual Chinese update or a new record”（`deepseek-harness/docs/i18n/README.md:50-54@687f282e`）。因此本域不要求目标项目补一个 Cordis 侧车写入者。

**触发。** 改任何被投影记录的源文件（服务类、事件声明、JSDoc、文件行号）；新增/删除服务或事件；页面新增生成标记；生成区出现手工改动；CI 报 stale。

**义务（源义务）。**

1. 作者只改标记之外；标记内“do not edit between markers”。生成区属于生成器，不属于页面作者。
2. 修改任何被记录源文件后必须重新生成；`--check` 逐字节比较**全部**产物，其中继承层页保留 `file:line`（`deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:1056-1067@687f282e`），**在符号上方插入行**会让该产物陈旧，进而让整次检查失败。页面生成区本身不含位置：`sourceLink` 剥掉 `:line`，只输出文件链接（`deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:958-962@687f282e`），并有测试固定该行为（`deepseek-harness/packages/typert/generator/tests/cordis-catalog.spec.ts:41-64@687f282e`）。
3. 映射页缺少标记是聚合错误；未映射的服务/作用域、映射指向不存在的页、投影不再发现的陈旧映射，都会失败（`deepseek-harness/scripts/gen-cordis-catalog.ts:1189-1196@687f282e`）。
4. 生成器同时写英文与中文两侧；语言侧只在配对文档链接的 locale 上不同。仅生成区变化时**不需要**新配对记录，也不需要人工翻译：生成器不写 `.i18n.yaml`，配对记录按设计排除生成区（`deepseek-harness/docs/i18n/README.md:50-54@687f282e`，`deepseek-harness/scripts/translation-pairing-record.ts:152-163@687f282e`）。区域外正文变化或记录实际漂移才需要 `pnpm run verify-translation-pairing --write <pair>` 重录。
5. 新鲜度检查在 `doc-sync` 中执行：`pnpm run verify-cordis-catalog` 就是 `gen-cordis-catalog --check`（`deepseek-harness/package.json:162-163@687f282e`，`deepseek-harness/scripts/run-gates.ts:825-825@687f282e`）。

**角色。** 生成器所有者（模板与投影策略）、服务/事件所有者（源声明和 JSDoc 完整性）、页面作者（只改作者区并重跑生成）、CI（stale 失败）。

**步骤。**

1. 改源声明/JSDoc；确保事件模式、参数/返回 JSDoc 完整（投影会强制）。
2. 运行 `pnpm run gen-cordis-catalog`。
3. 检查 diff：生成区变化；区域外未变时配对记录不变（生成器不写 `.i18n.yaml`），无需重录。
4. 运行 `pnpm run verify-cordis-catalog`。
5. 若页面本应有区却无标记，先补 `BEGIN/END` 标记，再重新生成。

**完成信号。** `gen-cordis-catalog: N generated file(s)/region(s) are up to date.`（`deepseek-harness/scripts/gen-cordis-catalog.ts:1286-1288@687f282e`）。

**失败处理。** `gen-cordis-catalog: stale — <paths>. Run \`pnpm run gen-cordis-catalog\` and commit the result.` 并以 1 退出（`deepseek-harness/scripts/gen-cordis-catalog.ts:1290-1291@687f282e`）。不要手工修补区域文字来“让它变绿”。

**例外。** 30/33 页有生成区；`scope`、`slots`、`sidebar-right` 没有。这一点已由结构核对：生成器只渲染 `SERVICE_PAGE` 与 `EVENT_SCOPE_PAGE` 的并集页（`deepseek-harness/scripts/gen-cordis-catalog.ts:1227-1257@687f282e`），这两张表（`deepseek-harness/scripts/gen-cordis-catalog.ts:52-52@687f282e`、`221-221@687f282e`）没有任何条目指向这三页；因此“没有区”是映射表的直接后果，而不是逐页声明。若以后给它们加服务，必须先在 `SERVICE_PAGE` 加映射并补标记。`credentials` 证明生成区**不必在文件末尾**：493 行文件在 `END GENERATED`（489）之后还有 4 行作者尾段（`deepseek-harness/docs/subsystems/credentials.md:490-493@687f282e`）。

**迁移设计。** 保留“标记边界 + 单一生成器 + 双向映射 + `--check` 新鲜度 + 两语言同写”的语义；把区域标记字符串、生成命令、映射表参数化。**额外建议：** 在目标项目 CI 中把“生成器重跑后 git diff 为空”作为独立 job，避免与快照测试混淆。

**证据限制。** 未运行生成器。53 个被报告的生成区缺口（26 个英文页 + 27 个中文页，含 `skills.zh.md`）已做**完整结构解析**：逐个消费区域内的每一行，按 `renderPageRegion`/`renderService`/`renderEvent` 语法核对锚点、标题、JSDoc 围栏、`Types`/`Source` 尾部与映射归属；53/53 通过，0 行未归类，区域行合计 7720 行、84 个服务条目、79 个事件条目。两语言侧另有严格比较：26 对只归一化配对文档链接目标后整区逐字节相等（87 处替换、190051 字节、0 行豁免），并由 364 条内存变异对照验证允许集合（含链接行上的散文/标签/空格/片段/非配对 URL 改动必须失败、只替换全部配对目标必须通过、只替换其中一个目标仅由独立 locale 检查拒绝）。区域逐字节比较的证据见 `verification/evidence/raw/p1-subsystem-one-strict-locale.json`；对照的当前输入证据见 `verification/evidence/raw/p1-partial-localization-after.json`（旧 strict-locale 的 18 项部分本地化输入有误，见下段）。这只证明结构与来源角色成立，**不是**对生成区文字、JSDoc 含义或产品行为的语义审阅；作者区阅读范围仍以 coverage ranges 为准。`docs/cordis-api/inherited.md` 的内核/继承层不在本域范围（但它保留 `file:line`，是位置敏感性的来源）。

**部分本地化对照的独立追查修复。** 主26对严格比较有效，但旧364项对照中的18项误把非首个URL换成内部规范化值。新 `verification/evidence/raw/p1-partial-localization-after.json` 保留其余原始英文目标：18项均确认原始目标保留、内部规范化URL数为0，且仅由独立locale检查拒绝；8个单目标区域明确不适用。总数与主比较结论不变，旧raw、不利复核及before保留；相同绿色计数不能代替核实变异输入。

来源：deepseek-harness/docs/subsystems/README.md:5-5@687f282e 来源：deepseek-harness/docs/AGENTS.md:33-33@687f282e 来源：deepseek-harness/docs/subsystems/session.md:812-820@687f282e 来源：deepseek-harness/docs/subsystems/credentials.md:65-68@687f282e 来源：deepseek-harness/docs/subsystems/credentials.md:490-493@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1-32@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1189-1200@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1262-1307@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1198-1260@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1227-1257@687f282e 来源：deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:958-962@687f282e 来源：deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:1056-1067@687f282e 来源：deepseek-harness/packages/typert/generator/tests/cordis-catalog.spec.ts:41-64@687f282e 来源：deepseek-harness/scripts/translation-pairing-record.ts:152-163@687f282e 来源：deepseek-harness/docs/i18n/README.md:50-54@687f282e 来源：deepseek-harness/scripts/run-gates.ts:825-825@687f282e

<a id="subsystem-contracts-1-bilingual-triplet"></a>
## subsystem-contracts-1-bilingual-triplet — 双语三件套与外区哈希配对

**来源事实。** 每个在范围内的文档必须维护英文与简体中文；一对是三个兄弟文件：`foo.md`、`foo.zh.md`、`foo.i18n.yaml`；一对整体合并，PR 不得只落一种语言（`deepseek-harness/docs/i18n/README.md:8-13@687f282e`）。配对记录按标题节保存两侧哈希，哈希覆盖“该节所有顶层块，但排除围栏代码块与生成区”，因此重新生成区域或两侧同时改代码块不会改记录（`deepseek-harness/docs/i18n/README.md:13-24@687f282e`）。结构必须镜像：标题深度/顺序、列表种类、有序列表起点、条目数、表格行列数、语义链接目标（含查询/片段）、逐字代码块（`deepseek-harness/docs/i18n/README.md:26-26@687f282e`）。门禁的明确限制：绿灯只表示“在这些确切内容上确认过一致”，不表示译文正确（`deepseek-harness/docs/i18n/README.md:44-44@687f282e`）。扩展流程才使用 `gen-translation-brief`：它从最近一次内容能产生记录条目的提交恢复已确认文本，按最窄安全粒度组装更新，`--apply` 只能在校验结构后拼接仅代码围栏变化；例行更新则由当前代理直接完成、不调用翻译技能（`deepseek-harness/docs/i18n/README.md:69-69@687f282e`）。`--write` 要求点名已确认的 pair，`--write --all` 是显式全语料确认；yaml diff 本身是“确认一致”的可评审动作（`deepseek-harness/docs/i18n/README.md:22-22@687f282e`）。

**触发。** 改任一侧正文；改标题/表格/列表；新增页面；生成区变化；合并冲突发生在同一节；评审发现中文缺少英文回链。

**义务（源义务）。**

1. 三件套齐全；同目录；禁止 locale 目录、独立翻译仓、交错双语文件。
2. 编辑一侧后，在同一 PR 内用术语表指导的一次性流程更新另一侧；对另一侧按已编辑侧的 diff 做最小补丁，不得整篇重译。
3. 例行更新由当前代理加载 `terminology.md` 后直接完成，不调用翻译技能、不生成简报、不做独立翻译评审，也不委派子代理；`pnpm run gen-translation-brief <pair>` 只在用户显式调用扩展流程时使用。
4. 中文页 H1 后立即保留 `[English](foo.md) | 中文` 回链；作者编写的英文页在对应位置写 `English | [中文](foo.zh.md)`；被列为生成源的英文页豁免该行，以保持与生成器输出字节一致。
5. 相对文档链接按活动语料换 locale：英文用 `.md`，中文用 `.zh.md`；语料内缺对应页是配对完整性错误，不是回退。
6. 配对记录必须规范且与当前内容计算值相等；`--write` 必须逐对点名已确认的 pair，`--write --all` 是显式的全语料确认，yaml diff 就是确认动作。
7. 生成区由生成器同时写两侧；仅区域变化时不需要人工中文更新或新记录。
8. 门禁检查配对完整性、记录哈希、中文回链/英文作者源切换器（生成源例外）与文档化结构签名；签名未编码的译文含义、术语与自然度由评审负责。
9. PR 级必须跑无参数全量检查；局部 `--write`/`<pair>` 的绿不能替代。

**角色。** 工作代理（单次术语指导更新）、译者/评审者（含义与术语）、CI（完整性/结构/哈希）、生成器（区域两语言同写；不写侧车记录）。

**步骤。**

1. 读 `docs/i18n/terminology.md`（术语权威）。
2. 改英文或中文正文；保持标题结构与代码块逐字一致。
3. 更新另一侧；修正链接 locale 与语言切换器。
4. 运行 `pnpm run verify-translation-pairing --write <pair>` 重录该对。
5. 用 `pnpm run verify-translation-pairing <pair>` 做局部检查；PR 级再跑无参数全量形式。
6. 评审译文含义与术语。

**完成信号。** 局部检查对该对通过；全量检查报告无 `missing`/`out-of-sync`。侧车样例格式见 `deepseek-harness/docs/subsystems/filesystem.i18n.yaml:1-12@687f282e`。

**失败处理。** 缺失文件、结构签名不符、链接 locale 不符、记录与内容不符都会失败；`--list` 只报告状态、不失败（`deepseek-harness/docs/i18n/README.md:33-40@687f282e`）。冲突只在两个分支改了同一节哈希内容时发生：解决 Markdown 后重录该对。

**例外。** 排除清单包括 `docs/AGENTS.md`、`docs/i18n/terminology.md`、`style-samples.md`、`translation-prompt.md`、`.github/review-ownership/README.md`、`docs/cordis-api/inherited.md`、冻结的 `.agents/notes/archived/`；这些**不**适用于本域 33 页（33 页都有三件套）。生成英文源豁免语言切换器。手动维护的中文对应页可以改写“生成/维护”自指陈述，但技术内容仍须忠实。

**迁移设计。** 保留“三文件 + 按标题哈希 + 结构签名 + 重新录制 + 生成区豁免”的语义；哈希算法与 CLI 名称可换。**额外建议：** 把 `--write <pair>` 纳入编辑循环，而不是 PR 末尾一次性补录；局部绿不能替代 PR 级全量。

**证据限制。** 未运行配对门禁。33 个中文页的作者区已逐页读取；中文生成区只读抽样与边界；侧车逐文件全文读取但只作为哈希/结构证据，不当作译文质量证据。33 页的配对节计数由行数机械推算。超过显示宽度上限的行（英文含 `docs/i18n/README.md:22`、`:69`；中文候选行见 coverage）已用 `:raw` 重读。

来源：deepseek-harness/docs/i18n/README.md:8-44@687f282e 来源：deepseek-harness/docs/i18n/README.md:50-50@687f282e 来源：deepseek-harness/docs/i18n/README.md:69-69@687f282e 来源：deepseek-harness/docs/AGENTS.md:45-45@687f282e 来源：deepseek-harness/docs/subsystems/session.md:1-3@687f282e 来源：deepseek-harness/docs/subsystems/session.zh.md:1-3@687f282e 来源：deepseek-harness/docs/subsystems/filesystem.i18n.yaml:1-12@687f282e 来源：deepseek-harness/scripts/verify-translation-pairing.ts:1-80@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:5-8@687f282e

<a id="subsystem-contracts-1-doc-sync-gates"></a>
## subsystem-contracts-1-doc-sync-gates — doc-sync 门禁组合与按触发执行

**来源事实。** `doc-sync` 是文档聚合门禁，由 `docSyncLeafGates()` 构造（`deepseek-harness/scripts/run-gates.ts:805-874@687f282e`）。与子系统页直接相关的叶子包括：`doc-typecheck`、`docs-site-build`、`verify-md-links`、`verify-type-equiv`、`verify-cordis-catalog`、`verify-translation-pairing`、`verify-md-wrap`、`verify-subsystem-pages`、`verify-doc-budgets`、`verify-doc-refs` 等（`deepseek-harness/scripts/run-gates.ts:817-857@687f282e`）。配对门禁的散文契约说它“属于 doc-sync”，贡献者在文档变更时本地运行，CI 穷尽运行（`deepseek-harness/docs/i18n/README.md:30-32@687f282e`）。

**触发。** 任意文档改动；新增页面；改类型；改生成区；改配对；准备 PR；CI 红灯定位。

**义务（源义务）。**

1. 文档变更本地运行 `pnpm run doc-sync`；CI 跑穷尽组合；局部 `verify-translation-pairing <pair>` 的绿不能替代 PR 级全量。
2. 围栏 `ts` 块必须可编译（`doc-typecheck`）；否则文档代码会腐烂。
3. 每段一个物理行（`verify-md-wrap`）；代码块、表格、列表保持格式。
4. 本地链接由 `verify-md-links` 检查；维护文件中的真实提交 ID 与被禁组织 URL 由参考验证拒绝（`deepseek-harness/docs/AGENTS.md:76-76@687f282e`）。
5. 子系统页不在 `scripts/doc-budgets.manifest.json` 的 7 个受预算文件里，因此没有字面预算；`Review governs unbudgeted tiers.`（`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`、`deepseek-harness/docs/AGENTS.md:61-61@687f282e`）。不要给它们编造上限。
6. 快速循环可用 `doc-quick`：它过滤 `quick: true` 的叶子并省略 `doc-typecheck`（`deepseek-harness/scripts/run-gates.ts:881-883@687f282e`），但不能当成完整验证。

**角色。** 文档作者（本地跑）、CI（穷尽跑）、评审者（预算外质量）、门禁所有者（叶子增删）。

**步骤。**

1. 编辑后先跑最相关叶子（例如 `verify-type-equiv`）。
2. 跑 `pnpm run verify-translation-pairing --write <pair>` 重录配对。
3. 跑 `pnpm run gen-cordis-catalog` 并提交生成结果。
4. 提交前跑 `pnpm run doc-sync`。
5. 失败时按叶子消息修复，不要跳过或降级门禁。

**完成信号。** 聚合运行以 0 退出，且每个阻塞叶子都通过；任一阻塞叶子失败或被跳过，聚合返回非零（`deepseek-harness/scripts/run-gates.ts:122-134@687f282e`）。

**失败处理。** 聚合打印每个门禁结果与总结；被信号中止的门禁单独标记。不要把 `allowFailure` 的叶子当成阻塞通过。

**例外。** 生成英文页省略语言切换器；`.zh.md` 仍受 `verify-md-wrap`/`verify-md-links` 相同约束。只改一个配对时允许用参数化配对检查加速，但 PR 必须全量。

**迁移设计。** 保留“单一聚合入口 + 叶子可单独运行 + 局部绿不替代全量”的语义；把脚本名、聚合名参数化。**额外建议：** 在目标项目把“生成器输出无 diff”和“配对全量检查”作为两个独立 required check，便于定位。

**证据限制。** 未运行任何门禁；未验证 CI 配置或分支保护。门禁清单是固定提交的事实，目标项目会演化，迁移时应以目标 `package.json`/runner 为准。

来源：deepseek-harness/docs/i18n/README.md:30-40@687f282e 来源：deepseek-harness/docs/AGENTS.md:42-48@687f282e 来源：deepseek-harness/docs/AGENTS.md:61-61@687f282e 来源：deepseek-harness/scripts/run-gates.ts:122-134@687f282e 来源：deepseek-harness/scripts/run-gates.ts:805-874@687f282e 来源：deepseek-harness/scripts/run-gates.ts:881-883@687f282e 来源：deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e

<a id="subsystem-contracts-1-capability-seam-ownership"></a>
## subsystem-contracts-1-capability-seam-ownership — 可选能力 seam 的 Definition/Provider/Consumer 归属

**来源事实。** 多个子系统页把能力 seam 写成三角色：Service Definition（`ctx.<key>`）、Service Provider、Consumer；并声明该能力是可选的、不属于 agent loop 主干，所以词汇定义在子系统页而非 `core.md`。例子：文件系统四包拆分与“替换后端不改变策略或工具 schema”（`deepseek-harness/docs/subsystems/filesystem.md:1-7@687f282e`）；Web 的 search/fetch 两操作同属一个 `ctx.web` 中间层（`deepseek-harness/docs/subsystems/web.md:1-7@687f282e`）；压缩的 Definition/Provider/Command Consumer（`deepseek-harness/docs/subsystems/compaction.md:1-5@687f282e`）；存储的 hub/backend/data-form 三层与“hub 自身不做 IO”（`deepseek-harness/docs/subsystems/storage.md:1-7@687f282e`）；Skills 的注册表分层（`deepseek-harness/docs/subsystems/skills.md:1-6@687f282e`）；Shell 的 Definition 与提供方/消费者分属包组（`deepseek-harness/docs/subsystems/shell.md:1-4@687f282e`）；Spill 的 Definition/本地 Provider/消费方（`deepseek-harness/docs/subsystems/spill.md:1-5@687f282e`）；Client Modules 的 Node 半与浏览器半分开记录（`deepseek-harness/docs/subsystems/client-modules.md:1-4@687f282e`）；Credentials 的“配置只携带引用，值归提供方”（`deepseek-harness/docs/subsystems/credentials.md:1-5@687f282e`）。存储还用共享一致性套件逐条检查每个后端（`deepseek-harness/docs/subsystems/storage.md:47-47@687f282e`）；Web 的重复 provider id 在注册期以 `WEB_DUPLICATE_PROVIDER` 失败（`deepseek-harness/docs/subsystems/web.md:135-135@687f282e`）。

**触发。** 新增可选能力；把 provider 换实现；把消费方从 provider 解耦；评审发现工具 schema 绑定到了 provider；文档把可选能力写进主干页。

**义务（源义务）。**

1. 页首写清 Definition 包与 `ctx` 键、至少一个 Provider、Consumer，以及“可选/不在主干”的事实。
2. 能力词汇定义在能力页；`core.md` 只保留跨能力模式并链接。
3. 替换 provider 不得改变模型提交查询的方式或工具 schema；工具层拥有模型可见名称、schema、提示与展示。
4. seam 级不变式必须显式写出：例如“空存储值在任何地方视为不存在”（credentials）、“spill 原样保存全文，不负责保留策略/检索/替换”（spill）、“hub 不做 IO，后端拥有介质，数据形式拥有语义”（storage）。
5. 引用能力 seam 的决策记录（Agent Note）作为理据，不在页内重写历史。
6. 消费方拥有边界：例如 Web 的 `maxResults` 由消费方配置、seam 在返回时截断；Office-to-PDF 的消费者拥有源文件授权与展示，共享提供方只做转换与有界复用（`deepseek-harness/docs/subsystems/web.md:9-14@687f282e`、`deepseek-harness/docs/subsystems/office-to-pdf.md:1-8@687f282e`）。
7. 多 provider 的 seam 必须用共享一致性套件验证每个实现（storage 的 `tests/contract.ts` 逐条检查每个后端）；重复注册在注册期失败；单槽决策 waterfall 为按注册顺序 first-wins，且“由策略插件占据”是部署约定而非强制不变量（`deepseek-harness/docs/subsystems/filesystem.md:185-185@687f282e`）。

**角色。** 能力所有者（Definition 与不变量）、Provider 所有者（实现与配置）、Consumer 所有者（模型契约/渲染/边界）、页面评审者（角色是否写全）。

**步骤。**

1. 列三角色及包路径；确认 `ctx` 键与页所有权映射一致。
2. 写“可选/主干外”的判定与依赖例外（如 compaction 必然依赖 session/llm）。
3. 写 seam 级不变量与失败语义；把 provider 特有细节链接到包 README。
4. 写消费方拥有的模型可见契约与边界；链接生成区而不是复制签名。
5. 评审替换 provider 的影响面是否被隔离。

**完成信号。** 页首能让读者回答“谁是 Definition/Provider/Consumer、哪些是可选、换 provider 会不会改工具 schema”；代码评审确认消费者没有 import provider 实现。

**失败处理。** 无专用门禁。症状：同一词汇在 `core.md` 与能力页各定义一次；工具 schema 因 provider 更换而变；provider 配置写进消费者 README。

**例外。** 某些能力必然依赖核心包（compaction 依赖 `dsh-session`/`dsh-llm`），但仍声明为可选能力；`tools.md` 这类核心词汇页不属于可选能力页。

**迁移设计。** 保留三角色与“词汇留在能力页”的规则；目标项目可用不同包名。**额外建议：** 为每页加一个“替换测试”评审问题——换掉 provider 后哪些文档需要改？答案应只落在 provider 页。

**证据限制。** 三角色完整性没有机械校验；33 个英文页与 33 个中文页的作者区已逐页阅读，但“页首三角色是否同等完整”仍由评审判断。Provider 实现是否真的解耦，本域未读实现代码。

来源：deepseek-harness/docs/subsystems/filesystem.md:1-7@687f282e 来源：deepseek-harness/docs/subsystems/web.md:1-7@687f282e 来源：deepseek-harness/docs/subsystems/compaction.md:1-5@687f282e 来源：deepseek-harness/docs/subsystems/storage.md:1-7@687f282e 来源：deepseek-harness/docs/subsystems/skills.md:1-6@687f282e 来源：deepseek-harness/docs/subsystems/shell.md:1-4@687f282e 来源：deepseek-harness/docs/subsystems/spill.md:1-5@687f282e 来源：deepseek-harness/docs/subsystems/client-modules.md:1-4@687f282e 来源：deepseek-harness/docs/subsystems/credentials.md:1-5@687f282e 来源：deepseek-harness/docs/subsystems/office-to-pdf.md:1-8@687f282e

<a id="subsystem-contracts-1-exclusive-provider-registration"></a>
## subsystem-contracts-1-exclusive-provider-registration — 唯一提供方槽与会话资源所有权

**来源事实。** Browser-use 页规定：共享服务只注册名称，拒绝任何第二次提供方注册（包括同名实例）；它不包含通用操作方法、浏览器资源或模型控制的选择器；同一组合中挂载一个提供方（`deepseek-harness/docs/subsystems/browser-use.md:1-18@687f282e`）。启动的浏览器属于使用它的确切实时 Agent 与 Session，跨轮复用；Session 运行时释放时关闭自有资源；重载/fork 创建全新状态；附加浏览器仍归外部所有，提供方在同一提供方实例内保留给一个 Session 并拒绝并发附加；清理只断开不杀外部浏览器；关闭时先停止接收工具调用、等待自有工作与资源清理，再释放注册；取消无法撤销已交付的浏览器操作（`deepseek-harness/docs/subsystems/browser-use.md:20-40@687f282e`）。Computer-use 页同样规定唯一注册槽，并明确“已注册提供方不为某个 Session 预留桌面；调用方负责跨 Session 与独立进程协调；取消无法撤销已收到的桌面输入”（`deepseek-harness/docs/subsystems/computer-use.md:1-32@687f282e`）。两页的生成 JSDoc 复述契约：`register(name)` 保留唯一槽直到贡献被 dispose；同名重复注册也失败；提供方必须先停止工具并等待自有工作（`deepseek-harness/docs/subsystems/browser-use.md:41-67@687f282e`、`deepseek-harness/docs/subsystems/computer-use.md:33-59@687f282e`）。

**触发。** 接入第二个浏览器/桌面提供方；热重载提供方；Session fork/恢复；同一浏览器被两个 Session 附加；关闭时仍有工具调用在飞；跨进程共享桌面。

**义务（源义务）。**

1. 共享服务只持有一个提供方槽；第二次注册失败，即使名字相同；槽在 effect 生命周期内保留。
2. 提供方释放注册前必须停止接收工具调用并等待自有工作/资源清理完成；关闭顺序不得颠倒。
3. 浏览器：启动资源按 Session 所有权关闭；跨轮复用；fork/重载得到全新浏览器状态；附加资源保持外部所有权；一个提供方实例内同时只允许一个 Session 附加。
4. 取消只停止等待，不撤销已交付给浏览器的动作；文档必须写明这一不可逆性。
5. Computer-use：注册不等于为某 Session 预留桌面；调用方协调跨 Session/跨进程；不承诺独占。
6. MCP 提供方的初始化有排序：为每个活动 Agent 创建一个客户端，`agent/created` 等待连接与发现结束，创建/恢复才完成；附加连接被占用时本次激活不使用浏览器但继续运行，后续轮次不重试（`deepseek-harness/docs/subsystems/browser-use.md:26-32@687f282e`）。

**角色。** 共享服务所有者（槽与失败语义）、提供方所有者（启动/附加/清理）、Session/Agent 所有者（生命周期与取消）、部署者（组合中只挂一个提供方）。

**步骤。**

1. 组合时只选一个提供方；提供方声明 `type`/`name` 与启动或附加模式。
2. 注册时占用唯一槽；用 effect disposer 绑定生命周期。
3. Session 释放时关闭自有资源；附加模式只断开。
4. 关闭流程：停止接收 → 等待自有工作 → 释放注册。
5. 文档写清取消不可逆与会话所有权；用生成 JSDoc 固化 `register` 契约。

**完成信号。** 第二次注册抛出；关闭后没有自有进程/浏览器残留；Session 重载后得到新状态；附加总线被占用时激活继续但不静默重试。

**失败处理。** 重复注册是编程错误，应在加载期失败；若清理失败，保留已捕获的执行结果并单独报告清理失败（源页对 browser 的生命周期描述；实现细节本域未读）。不要用“最后注册者获胜”掩盖冲突。

**例外。** 独立 DSH 进程与其他客户端不受 Session 保留约束（browser-use）；computer-use 明确不预留桌面。两者都不把“注册”当“已连接/已可用”。

**迁移设计。** 保留“单一槽 + 同失败 + 关闭顺序 + 会话所有权/不可逆取消”的语义。目标项目若允许多提供方，必须改为显式多实例模型并定义选择与清理，而不是放宽唯一槽。**额外建议：** 给唯一槽写一个“第二次注册必须失败”的测试，并在文档中引用该测试，而不是只写散文。

**证据限制。** 本机制读的是页面与生成 JSDoc，未读实现或测试，因此“抛错”是文档契约而非本次观测。MCP 初始化排序、截屏/附件路由等细节只按页面事实记录。

## 迁移到目标仓库的最小清单

1. **建立索引。** 一页一子系统；每页写“拥有什么”；索引表与页首同义。
2. **建立层级。** 类型/语义 → 子系统页；行为 → 架构页；理据 → 决策记录；包配置/限制 → 包 README；生成数据 → 生成器。
3. **建立类型检查。** 逐字粘贴块 + 清单 1:1 + 结构/JSDoc 比较 + 重复/孤儿失败；承认“新类型漏记”只能评审。
4. **建立生成区。** 标记边界 + 单一生成器 + 映射双向失败 + `--check` + 两语言同写。
5. **建立三件套。** `.md`/`.zh.md`/`.i18n.yaml`；按标题哈希排除代码块与生成区；重录命令；结构签名；翻译质量评审。
6. **建立聚合门禁。** 单一 `doc-sync` 入口；叶子可单独跑；局部绿不替代全量；预算外层级由评审治理。
7. **建立能力页规则。** Definition/Provider/Consumer 三角色；能力词汇留在能力页；替换 provider 不改消费者契约。
8. **建立唯一槽契约。** 若能力是单例，第二次注册必须失败；关闭顺序与取消不可逆写进契约。

## 例外与已知限制

- **仅评审的规则：** 事实层级归属、索引“Owns”描述准确性、新类型是否漏记、译文含义/术语、能力页三角色完整性、唯一槽测试是否存在。以上没有源仓门禁证据。
- **自动规则的盲区：** `verify-type-equiv` 只匹配顶层命名声明；合并声明变体走散文表格；`verify-subsystem-pages` 只看英文组 README 的直接链接；配对门禁只比结构与哈希。
- **生成区阅读：** 区域内部是机器产物。本域已对 53 个被报告的缺口做**完整结构解析**（语法、锚点、映射归属、Source 文件角色），并对 26 对 EN/ZH 区域做“只归一化配对文档链接目标 + 整区逐字节相等”的严格比较（53/53 与 26/26 通过），但那是结构核对，不是语义阅读：不要把生成区文字当作作者政策证据，也不要把它当作目标产品实现了这些操作的证据。旧记录里“逐行比较、仅允许本地化链接”的说法已撤回（旧探针整行丢弃差异行）。
- **版本绑定：** 所有行号与命令绑定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`；目标项目演进后必须重新定位。
- **未执行声明：** 本次没有运行构建、测试、lint、格式化、生成器、配对门禁或任何 CI；所有 verification 条目都是计划。

## 跨域依赖

- **documentation 域**拥有通用文档政策与门禁实现：`docs/AGENTS.md`、`docs/i18n/README.md`、`scripts/verify-type-equiv.ts`、`scripts/verify-translation-pairing.ts`、`scripts/gen-cordis-catalog.ts`、`scripts/verify-subsystem-pages.ts`、`scripts/type-equiv.manifest.json`、`scripts/run-gates.ts`、`package.json`。本域只拥有它们对 33 个子系统页的应用与页面级义务；不要在本域重复声明这些脚本的完整契约。
- **persistence 域**拥有 `SessionEventMap` 的权威事件目录与持久化格式；`session.md` 的事件词汇是页面级参考，合并声明变体的目录权威在持久化目录侧。
- **各子系统实现包**拥有 provider/consumer 的真实行为；本域只记录页面写出的契约。

## 来源引用（实际阅读）

- 索引与分层：`deepseek-harness/docs/subsystems/README.md:1-76@687f282e`；`deepseek-harness/docs/AGENTS.md:1-77@687f282e`；`deepseek-harness/docs/i18n/README.md:1-69@687f282e`。
- 生成器/验证器：`deepseek-harness/scripts/gen-cordis-catalog.ts:1-32@687f282e`、`40-52@687f282e`、`1119-1200@687f282e`、`1255-1307@687f282e`；`deepseek-harness/scripts/verify-subsystem-pages.ts:1-137@687f282e`；`deepseek-harness/scripts/verify-type-equiv.ts:280-391@687f282e`；`deepseek-harness/scripts/verify-translation-pairing.ts:1-80@687f282e`；`deepseek-harness/scripts/run-gates.ts:355-425@687f282e`、`805-883@687f282e`；`deepseek-harness/scripts/type-equiv.manifest.json:1-3@687f282e`、`588-614@687f282e`、`2446-2460@687f282e`；`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`。
- 英文页面作者区：本域 33 页的阅读范围逐条记录在 `research/subsystem-contracts-1-coverage.json`；生成区边界为机器扫描。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `subsystem-contracts-1-page-ownership-and-index`：`deepseek-harness/scripts/gen-cordis-catalog.ts:40-52@687f282e`
- `subsystem-contracts-1-same-change-type-authority`：`deepseek-harness/docs/subsystems/session.md:250-523@687f282e`、`deepseek-harness/scripts/type-equiv.manifest.json:588-614@687f282e`
- `subsystem-contracts-1-generated-cordis-region`：`deepseek-harness/scripts/gen-cordis-catalog.ts:1189-1200@687f282e`、`deepseek-harness/scripts/gen-cordis-catalog.ts:1262-1307@687f282e`、`deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:958-962@687f282e`、`deepseek-harness/packages/typert/generator/src/cordis-catalog.ts:1056-1067@687f282e`、`deepseek-harness/packages/typert/generator/tests/cordis-catalog.spec.ts:41-64@687f282e`、`deepseek-harness/scripts/translation-pairing-record.ts:152-163@687f282e`、`deepseek-harness/docs/i18n/README.md:50-54@687f282e`
- `subsystem-contracts-1-bilingual-triplet`：`deepseek-harness/docs/subsystems/session.md:1-3@687f282e`、`deepseek-harness/docs/subsystems/session.zh.md:1-3@687f282e`
- `subsystem-contracts-1-exclusive-provider-registration`：`deepseek-harness/docs/subsystems/browser-use.md:1-40@687f282e`

来源：deepseek-harness/docs/subsystems/browser-use.md:1-40@687f282e 来源：deepseek-harness/docs/subsystems/browser-use.md:41-67@687f282e 来源：deepseek-harness/docs/subsystems/computer-use.md:1-32@687f282e 来源：deepseek-harness/docs/subsystems/computer-use.md:33-59@687f282e 来源：deepseek-harness/docs/subsystems/README.md:43-44@687f282e