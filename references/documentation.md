# 文档治理迁移参考

本参考描述 DeepSeek Harness 在固定提交中的文档治理实践，并给出可迁移到其他仓库的操作步骤。源证据统一写作 `deepseek-harness/<path>:<start>-<end>@687f282e`。文中的“源义务”指源仓库规则；“迁移设计”指本参考为采用方补充的实施建议，不冒充源仓库已自动执行的能力。

## 1. 读者触发索引

<a id="reader-triggers"></a>

先按改动对象定位动作，再读对应章节。不要从工具清单反推流程。

| 你要做的事 | 必读 | 必须执行 | 完成信号 |
|---|---|---|---|
| 新增或改写人类文档 | 第 3、4、6 节 | 判定分层、教程/参考、单一归属；跑写作门禁 | 文档归属正确且预算/换行/链接门禁通过 |
| 改包对外行为 | 第 5 节 | 同一变更更新 README 合同、JSDoc、受影响文档 | README 各类门禁与 JSDoc 门禁通过 |
| 改导出 API 或类型 | 第 7、12 节 | 更新 JSDoc；更新 `ts type-equiv`/`public-api` 粘贴与清单 | `verify-export-jsdoc`、`verify-type-equiv`、`doc-typecheck` 通过 |
| 改双语文档 | 第 8 至 11 节 | 两侧同改，按结构重录一致性记录，跑配对门禁 | 配对门禁对当前内容通过 |
| 新增生成参考 | 第 13、14 节 | 从真源生成两种语言，保留共享区域，跑 `--check` | 生成器 `--check` 无差异 |
| 新增文档链接或锚点 | 第 15、16 节 | 相对链接、可解析锚点、无提交号引用 | 链接、锚点、引用策略门禁通过 |
| 记录设计决策/事故/升级 | 第 17、18、19 节 | 选对生命周期与模板，写替代方案与验证 | 格式/归档/升级指南门禁通过 |
| 修改 Skill | 第 20 节 | 同步 frontmatter 与 `agents/openai.yaml` | 调用元数据门禁通过 |
| 修改网站发布面 | 第 16 节 | 改发布清单与源文档，不手改生成站 | 投影测试与构建通过 |
| 接入新仓库 | 第 23 节 | 建立完整真源/分层映射，并为全部适用义务实现等价检查；仅当事实类别不存在时标记非激活 | 新项目能重复执行并通过自己的验收 |

## 2. 真源与优先级

<a id="source-of-truth"></a>

**源义务。** 事实只有一个家：所有者层级或代码/生成器。文档不得手抄权威目录、JSDoc、测试清单、包状态或版本状态；需要时链接到所有者。`docs/AGENTS.md` 把根 `AGENTS.md` 定为“常驻命令”，子树 `AGENTS.md` 只放该子树特有规则，架构图只放组成与扩展点地图，子系统页只放类型与语义，Agent Note 只放决策理由与被放弃项，postmortem 只放事故叙事，cookbook 只放步骤，包 README 只放该包合同，生成参考只放可再生产物。`deepseek-harness/docs/AGENTS.md:7-36@687f282e`

**源义务。** 文档写当前状态，不写变更史或“已实现/未来”状态。历史留在提交、PR、Agent Note、postmortem 或受范围约束的持久化记录。通用 Session 格式叙述链接到版本/状态权威页，只有版本特定合同、示例或证据才保留具体数字。`deepseek-harness/docs/AGENTS.md:37-39@687f282e`、`deepseek-harness/AGENTS.md:173-177@687f282e`

**迁移设计。** 为每个事实指定唯一所有者，并在采用方仓库写一张“事实→所有者→检查”表。所有者可以是源文件、生成器、清单或人审记录。没有所有者的新事实先补所有者，再写文档。检查只能验证其覆盖的形态，不能把“门禁绿”解释成“事实正确”。

**失败处理。** 发现两处互相矛盾的权威叙述时，不要挑一处改字；先判定哪一处是所有者，删除或降级另一处为链接，再补一个能拒绝重复叙述的检查（若可机械化）。

## 3. 分层与放置

<a id="tier-placement"></a>
<!-- mechanism-ids: documentation-tier-placement -->

**源义务。** 文档按“主题 + 树位置”确定作用域：只以适当细节描述自己的主题，直接子主题只描述目的、职责和高层行为，更低层细节链接到拥有它的后代。文档类型不能扩大作用域；参考只可对自己的主题穷尽。测试机制、夹具和 harness 放在最低拥有层，高层只链接。`deepseek-harness/docs/AGENTS.md:7-13@687f282e`

**源义务。** 每篇范围内文档必须归为教程或参考。教程按达成结果的顺序组织，只引入当前步骤所需概念；参考定义查找范围和当前行为，不承担教学顺序。两者内容都较多时分开；任一部分较小时显式标注。教程写作前先私下判定读者起点和每个概念的初/中/高级，先修前置再讲依赖，逐步提高难度，把不必要的进阶材料移到后续教程或参考。`deepseek-harness/docs/AGENTS.md:15-19@687f282e`

**放置决策。** 缺陷→postmortem；理由→Agent Note；操作步骤→cookbook；类型定义→subsystems；包合同→包 README；常驻命令→根 `AGENTS.md` 并链接理由；评审强制规则→`defensive-patterns/`。`deepseek-harness/docs/AGENTS.md:36@687f282e`

**源义务。** 不要把以下内容放错层：

- 根 `AGENTS.md` 不收故事、完整示例、情境流程或已链接家中的重复规则。
- 子树 `AGENTS.md` 不收根文件已有的全仓规则。
- 架构页不收类型定义、逐包细节、决策理由、实现状态标注。
- 子系统页不收行为叙述。
- 已实现 Agent Note 不收迁移计划、验收清单、夹具走查或“should”式规格语。
- defensive-patterns 不收类型定义与语义、决策理由。
- postmortem 是唯一允许“战史叙事”的层。
- 包 README 不收 JSDoc 复述、生成目录复述、其他包关切。
- 生成参考的英文真源与区域禁止手改。

`deepseek-harness/docs/AGENTS.md:21-35@687f282e`

**迁移设计。** 采用方必须映射全部事实类别（命令、架构、子系统、决策、事故、流程、包合同、生成参考等）；合并文档时必须保留每类事实的唯一所有者、边界和链接，不能因规模省略类别。对每一类写一句“这里放什么/不放什么”，这比目录约定更能阻止漂移。

**完成信号。** 新文档能回答“读者何时来、第一段看到什么、下一层去哪”；同一事实在别处只有链接。**失败处理。** 若无法判定归属，先问“读者在哪个触发点需要它”，再把内容放到该触发点的最低层。

## 4. 教程、参考与页面骨架

来源：deepseek-harness/docs/AGENTS.md:7-36@687f282e 来源：deepseek-harness/AGENTS.md:170-178@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/SKILL.md:79-125@687f282e

<a id="authoring-quality"></a>
<!-- mechanism-ids: documentation-tutorial-vs-reference, documentation-page-skeleton -->

**源义务。** 在格式所有者允许时，人工页按YAML元数据、H1、双语切换行、Summary、目录、正文和最终Dev Note组织；生成片段、Agent Note、事故复盘和解析器定义格式遵循各自具名骨架。包README的元数据测试要求`kind`和非空`description`，不统一要求`title`字段。`deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:19-30@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:142-159@687f282e`

**源义务。** Summary用三至五个解释性句子说明读者能做什么、为何关心、运行模型和重要边界；英文包README另有100词门禁，不能当作所有页面的普遍阈值。目录指向H2。Dev Note是显式非权威的活动工作上下文，允许假设、粗略备选、进度与未决；稳定行为、限制和已接受理由归普通所有者。关闭后提升持久结论、保存适当决策/复盘或删除已解决讨论。包README最后两个H2是Model Experience与Known Limitations and Deferred Work，最终Dev Note置于限制节内H3。空白写`None.`，具名机器/解析器格式可省略。`deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:19-30@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:79-87@687f282e`

**源义务。** 标题是描述具体主题的名词短语，不是口号、问句或“深入理解 X”。首段在展开前给出导航：这段是什么、读者何时用、下一节去哪。`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:123-124@687f282e`

**源义务。** 写完教程后做新手测试：只读首屏能否判断是否来对地方；跳过目录能否在三次点击内到达目标；是否在不假设内部历史的情况下可完成。`deepseek-harness/.agents/skills/dsh-doc/references/review.md:10-17@687f282e`

**迁移设计。** 保留读者首屏导航、稳定内容与非权威活动上下文的分层；章节名称和元数据按目标格式所有者确定。模板与实际执行合同一致，具名例外不强套另一格式。**证据边界。** 包README元数据/选定骨架受`doc-standard.spec`检查，Summary语义、新手测试和其余格式仍需评审；结构通过不是内容正确。

## 5. 包 README 合同

来源：deepseek-harness/docs/AGENTS.md:15-19@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:4-87@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/style.md:5-49@687f282e 来源：deepseek-harness/scripts/doc-standard.spec.ts:18-24@687f282e 来源：deepseek-harness/scripts/doc-standard.spec.ts:40-49@687f282e 来源：deepseek-harness/scripts/doc-standard.spec.ts:57-160@687f282e 来源：deepseek-harness/scripts/doc-standard.spec.ts:339-406@687f282e 来源：deepseek-harness/scripts/doc-standard.spec.ts:443-456@687f282e 来源：deepseek-harness/scripts/verify-package-readme-summaries.ts:1-77@687f282e 来源：deepseek-harness/scripts/verify-package-readme-model-experience.ts:1-638@687f282e 来源：deepseek-harness/scripts/verify-package-readme-limitations.ts:1-95@687f282e 来源：deepseek-harness/scripts/run-gates.ts:805-885@687f282e 来源：deepseek-harness/package.json:119-120,130,140@687f282e

<a id="package-readme"></a>
<!-- mechanism-ids: documentation-package-readme-kinds, documentation-package-readme-summary, documentation-package-readme-model-experience, documentation-package-readme-limitations -->

**源义务。** 每个 `packages/<group>/<pkg>/package.json` 必须有同目录 README；包 README 是“该包合同”：配置、语义、限制、扩展点和 Model Experience。不得复述 JSDoc、生成目录或其他包的关切。`deepseek-harness/docs/AGENTS.md:33@687f282e`、`deepseek-harness/scripts/verify-package-readme-limitations.ts:47-53@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:366-370@687f282e`

**种类判定。** `dsh-doc` 按包形态选模板：路径深度不超过三层的 `packages/<group>/README.md` 是 group；有 `dsh.bundle.patch` 的是 bundle；登记为 library 的是 library；其余插件包是 reference。模板分别规定骨架、Metadata、Model Experience 与限制节。`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:18-31@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:3-10@687f282e`

**机器校验的 kind。** `doc-standard.spec.ts` 对 glob 匹配的 `packages/README.md`、`packages/README.zh.md` 及两级包 README 读取 YAML frontmatter，按路径段数、`package.json` 的 `dsh.bundle.patch` 和 `PACKAGE_LIBRARIES` 推导 expected kind 并断言相等；`description` 必须非空，出现 `name`、`audience`、`tags` 或 `i18n` 任一字段即失败。该测试还断言 persistence 文档 kind：`docs/persistence-changes/*.md` 为 `persistence-change`、`releases/dsh-*.md` 为 `persistence-release`、`historical-formats/v*.md` 为 `persistence-format` 且数量为当前 writer 版本×2。`deepseek-harness/scripts/doc-standard.spec.ts:18-24@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:40-49@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:57-160@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:339-406@687f282e`

**自动骨架。** 路径深度恰为四段的包 README（英文与中文）还受精确标题检查：英文必须含 `## Summary`、`## Table of Contents`、`## Dev Note`（`Dev Note` 允许 H2/H3），中文必须含 `## 概述`、`## 目录`、`## 开发备注`（`开发备注` 允许 H2/H3）。`deepseek-harness/scripts/doc-standard.spec.ts:154-160@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:401-406@687f282e`

**自动执行。** 这些不是仅评审建议：`run-gates.ts:850-862,872,881-885` 把 Summaries、Model Experience、Limitations 与 `vitest run scripts/doc-standard.spec.ts` 标为 quick，`package.json:130` 的 `test:docs` 运行 doc-quick；`package.json:119-120,140` 暴露对应单门禁脚本。门禁失败以退出码 1 结束。`deepseek-harness/scripts/run-gates.ts:850-862@687f282e`、`deepseek-harness/scripts/run-gates.ts:872@687f282e`、`deepseek-harness/scripts/run-gates.ts:881-885@687f282e`、`deepseek-harness/package.json:119-120@687f282e`、`deepseek-harness/package.json:130@687f282e`、`deepseek-harness/package.json:140@687f282e`

**源义务（Metadata）。** 包 README 以 YAML frontmatter 开始，`description` 与 `kind` 必填；`kind` 必须与机械推导一致，并选择唯一 README 模板。除 `name`、`audience`、`tags`、`i18n` 这四个会被测试拒绝的字段外，其他自定义字段不由该测试治理；仍不要重复文件名、包清单或门禁已经拥有的字段；除非有仓库 taxonomy 与搜索消费者，不要加 `tags`。`.i18n.yaml` 是 YAML 一致性记录，不是 TOML。`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:50-60@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:3-30@687f282e`

**源义务（Summary）。** 英文包 README 的 `## Summary` 最多 100 个 `wc -w` 式单词；超出即失败，并提示先读对应模板。摘要写用户或 agent 能用包“做什么”、何时选、主要代价、最重要边界；不要写“这是一个用于……的包”。`deepseek-harness/scripts/verify-package-readme-summaries.ts:8-17@687f282e`、`deepseek-harness/scripts/verify-package-readme-summaries.ts:44-75@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/package-reference.md:19-25@687f282e`

**目标Summary入口。** 已交付零外部依赖的 `tools/doc-gates/verify-package-readme-summaries.mjs`。在目标 `.doc-gates/package-readme-summaries.json` 写真实布局，例如 `{"packagesRoot":"packages","readme":"README.md"}`；字段省略使用这两个默认值，但配置文件必须存在。扫描包根README、每组README和每包README，与源三层范围对应；普通仓库最外层README不因此自动纳入。项目布局不同可改包根/英文文件名，不能配置单文件清单或提高100词上限来规避扫描。

```bash
node .agents/skills/harness-project-governance/tools/doc-gates/verify-package-readme-summaries.mjs
```

在目标根运行，异地用 `--root <目标根>`，另一个配置用 `--config <仓库相对JSON>`。发布者包入口为 `npm run verify-package-readme-summaries -- --root <目标根>`。包作者收到超限/缺节/空扫描退出1后，按完整包kind合同及目标真实模板重写、恢复语料并重跑；配置/参数/读取失败退出2，先修前提。源诊断指向源自己的dsh-doc模板，目标诊断显示kind并指向本已安装参考，不声称那些源模板已安装。计数通过不证明用户结果、选型代价或命题无损，评审者仍须检查；把实际入口接入目标已有顶层检查及适用CI，并另取CI必跑/平台阻断证据。

`verification/evidence/raw/p1-package-readme-summary-installed.json` 保存默认隐藏安装座的物理模块、两模块hash、完整探针和10条实际顶层npm命令：恰100词正常0，101词/缺组Summary/空扫描拒绝1，对应修改后恢复0，缺配置2及恢复0。原始文本H2正则也会接受代码围栏里的伪Summary（实际0），这是源边界，不是AST骨架验证；不以它替代仍待落实的Model Experience、限制节、Metadata/kind及双语语义检查。3项CLI行为回归通过；临时目标和探针删除后源码保留于证据。这不是完整Skill安装、独立采用或可信CI证明。

**目标限制节入口。** 已交付 `tools/doc-gates/verify-package-readme-limitations.mjs`，以目标包清单发现两级包而不是沿用来源包名。在 `.doc-gates/package-readme-limitations.json` 声明真实布局与逐包审计豁免：

```json
{
  "packagesRoot": "packages",
  "manifest": "package.json",
  "readme": "README.md",
  "exemptions": {}
}
```

执行 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-package-readme-limitations.mjs`（异地 `--root`，另一配置 `--config`；发布者包入口 `npm run verify-package-readme-limitations -- --root <目标根>`）。包必须有唯一原文H2 `## Known Limitations and Deferred Work` 且至少一个读者可见顶层列表项；标题变体、深度错误、多个近似节、只在代码围栏或HTML注释里的条目都被拒绝。确实无延迟工作的包须逐项登记理由，指向不存在包或理由为空同样失败。退出1按诊断修文档或审计豁免，退出2先修配置/解析器前提。

目标比源多做一处显式适配：用 Markdown AST 删除代码块和渲染消失的HTML注释后再要求可见`- `行，因此围栏里的伪条目不会冒充限制。`verification/evidence/raw/p1-package-readme-limitations-installed.json` 保留物理模块、5个模块hash、既有本地解析器消费与13条实际顶层npm命令（正常0、九类拒绝1、修复恢复0、缺解析器2）；4项行为回归通过。临时目标与探针已删除。形态通过仍不证明限制真实、完整、最新，也检查不到中文侧；不是完整Skill安装、独立采用或可信CI。

**源义务（Model Experience 入口）。** 每个含 `packages/*/*/package.json` 的包 README 要么有唯一 H2 `## Model Experience`，要么在 `NO_MODEL_EXPERIENCE_SECTION` 审计白名单中（模型无关包；白名单条目必须仍对应扫描包并保留理由）。有该节时它必须是最后 H2，或倒数第二 H2 且紧跟唯一 `## Known Limitations and Deferred Work`。H2 名称必须逐字符匹配；大小写或深度变体失败。扫描集来自 `packages/*/*/package.json`，且只读英文 `README.md`。`deepseek-harness/scripts/verify-package-readme-model-experience.ts:1-31@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:32-45@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:366-427@687f282e`

**源义务（短形式）。** 只有 `SENTENCE_MODEL_EXPERIENCE` 白名单可使用短形式：恰好一句 `None, as … .` 或 `Indirectly, through … .`，空行，精确 `#### KV Cache effect`，空行，一个非空段落。白名单条目必须保留理由且不能与“无该节”白名单重叠；不在白名单却写 `None.` 或短句失败。白名单本身覆盖 47-250，并校验成员存在、理由非空且不与无节白名单重叠。`deepseek-harness/scripts/verify-package-readme-model-experience.ts:47-250@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:345-364@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:429-480@687f282e`

**源义务（结构化）。** 其余包有一个或多个 `###` 模型上下文条目；条目标题非空且 fragment 唯一。条目下恰好三个 H4，按顺序 `#### What the model sees`、`#### Token effect`、`#### KV Cache effect`；每个 H4 后空行加一个非空段落，字段不得用本地 `](#...)` 链接。字段段落之后可选接 `#####` 标题加精确的非空 `markdown` 语言围栏；每个 H5 恰好一个围栏，标题在条目内唯一，标题前空行。标题含 system prompt 的条目在 `What the model sees` 下必须有嵌套围栏；标题含 schema/schemas 的条目必须在 `What the model sees` 链接 `../../../docs/tool-catalog.md#<存在的 H2 fragment>`；至少一个条目用行内代码、嵌套 markdown 或工具目录锚点落到具体文字。`deepseek-harness/scripts/verify-package-readme-model-experience.ts:252-330@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:481-627@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:629-638@687f282e`

**源义务（限制）。** 每个非白名单包必须有唯一 H2 `## Known Limitations and Deferred Work`，且至少一个顶层 `- ` 列表项；不得出现变体标题（含 limitations、deferred work、non-goals 等近似写法）。确实无限制的包必须加入 `NO_LIMITATIONS` 白名单并逐包写理由；白名单条目若指向已重命名/删除的包也失败。`deepseek-harness/scripts/verify-package-readme-limitations.ts:1-95@687f282e`

**迁移设计。** 采用方必须对每个适用包实现完整 README 合同：Summary、Model Experience（含 H3 条目、三个 H4 字段、H5 `markdown` 围栏、白名单/短形式、system-prompt 与 schema 证据）和限制节；包数量少不是省略理由。若项目确实没有包 README 或 Model Experience（事实类别不存在），记录不适用与重新激活条件，不得用简化三节冒充等价。**证据边界。** Summary、Model Experience 与限制节门禁只读英文 `README.md`；`doc-standard.spec` 的 frontmatter/kind 与包骨架检查按 glob 同时覆盖 `README.md` 与 `README.zh.md`。中文限制节/Model Experience 的结构与语义不由这三个内容门禁检查；配对门禁只比较结构与逐节哈希，不证明语义等价。结构通过也不证明 README 描述与代码一致。

## 6. 写作、预算与审查

来源：deepseek-harness/.agents/skills/dsh-doc/SKILL.md:18-31@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/SKILL.md:59-62@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:3-10@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:50-61@687f282e 来源：deepseek-harness/scripts/doc-standard.spec.ts:18-24,40-49,57-160,339-406@687f282e 来源：deepseek-harness/scripts/verify-package-readme-summaries.ts:8-17@687f282e 来源：deepseek-harness/scripts/verify-package-readme-summaries.ts:44-75@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/package-reference.md:19-25@687f282e 来源：deepseek-harness/scripts/verify-package-readme-model-experience.ts:1-638@687f282e 来源：deepseek-harness/docs/cookbook/adding-a-package.md:1-170@687f282e 来源：deepseek-harness/scripts/verify-package-readme-limitations.ts:1-95@687f282e

<a id="prose-budgets"></a>
<!-- mechanism-ids: documentation-prose-budgets, documentation-slop-checklist, documentation-complete-proposition, documentation-current-state, documentation-fact-check-evidence, documentation-one-physical-line -->

**源义务（当前状态与直接表达）。** 写当前事实；点名行为者；保留可搜索的机制名与有意义的模态、时间、否定强调；装饰性强调要收敛。禁止用“gate”“vocabulary”“surface”等隐喻替代确切术语；在写 `contract`、`boundary`、`shape` 前先问是否有更精确词；`contract` 只留给前置/后置条件、不变量、兼容承诺等义务。`deepseek-harness/AGENTS.md:173-177@687f282e`、`deepseek-harness/docs/AGENTS.md:37-39@687f282e`、`deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:14-63@687f282e`

**源义务（完整命题）。** 删除一句话必须能指出它不属于本主题、由别处拥有、重复、已过时或不可核验；不能只因为“读起来像废话”。保留否定、条件、例外、范围、时序、所有权、失败方向与量词。改写时不得把“可能”写成“会”，不得把“默认”写成“总是”。`deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:14-63@687f282e`

**源义务（反 slop 清单）。** 审查以下九类：重复规则；历史越层；正文/图中的实现状态标注；手抄目录、JSDoc、测试/包/状态清单；推理流水账；兄弟方法旁重复理由；段落墙；强调膨胀；已实现 Agent Note 中的规格语。`deepseek-harness/docs/AGENTS.md:65-71@687f282e`

**源义务（一处一段）。** 每个散文段落在源文件中占一个物理行；使用编辑器软换行。标题保持单行是评审义务；列表/引用内形成 `paragraph` 的正文由自动门禁检查，非 `paragraph` 结构保持原格式，代码注释遵守 linter 列宽。**实际自动边界：** `verify-md-wrap` 只拒绝跨行的 AST `paragraph`，包括列表/引用内段落；不检查 `heading` 节点，也不 blanket 排除生成区域。标题规则仍须评审，不能把它误标为该脚本自动保证。`deepseek-harness/docs/AGENTS.md:41@687f282e`、`deepseek-harness/scripts/verify-md-wrap.ts:40-86@687f282e`

**源义务（预算）。** `scripts/doc-budgets.manifest.json` 对常驻文档设上限；`verify-doc-budgets` 拒绝超限或清单指向的缺失文件。超限时按“迁移到其他层→压缩→有理由地提高上限”顺序处理；上限是护栏不是缩减目标。低于目标时至少保留 5% 余量；高于目标时冻结上限，直到迁移或压缩把文档带回目标以下；只有在文档仍有空间时才降低上限。未列入预算的层级由评审治理，不是自动豁免。`deepseek-harness/docs/AGENTS.md:51-63@687f282e`、`deepseek-harness/scripts/verify-doc-budgets.ts:1-58@687f282e`

**源写作目标，不是所有目标项目的默认阈值。** `docs/AGENTS.md:59` 给出 root2080、architecture2400、默认子树 AGENTS600（具名 packages810、docs1430、examples310）、packages README994、cordis-primer600、testing1300。这些目标与 manifest 硬上限分别保留；目标项目按自身常驻上下文与必要内容评审上限，不默认扫描所有子树并强制600。降低上限须仍有空间；未登记层仍须评审。

**源义务（审查顺序）。** 先把变更与 `origin/master` 的旧文档对照，确认旧文档未覆盖的事实；再跑操作/示例/代码片段；无法复现的说法要么重跑要么删除；证据按“源文件/测试/运行输出/生成器”优先于“相邻文档/记忆”。`deepseek-harness/.agents/skills/dsh-doc/references/review.md:4-67@687f282e`

**迁移设计。** 预算清单只应列“必须常驻上下文”的文档。源仓库只对清单中的常驻文档设上限；未列入预算的层级仍由评审清单治理，不是自动豁免。采用方必须写明哪些常驻文档由预算约束、哪些非驻留层级由评审覆盖，并记录未预算文件的理由、所有者与重新激活条件；不能把“未列预算”当成无审查或无限扩张许可。**证据边界。** 预算门禁只算空白分隔词数并只检查清单内文件；它不判断内容质量，也不阻止新增未列入清单的膨胀文档。

**目标执行器。** 已交付零额外依赖的 `tools/doc-gates/verify-doc-budgets.mjs`。采用方在目标仓库写 `.doc-gates/doc-budgets.json`：JSON 对象的键是常驻文档的仓库相对路径，值是评审后的正整数上限，例如 `{ "AGENTS.md": 2000 }`；示例数值不是源仓上限或自动建议。安装后从目标 cwd 执行 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-doc-budgets.mjs`；从其他目录调用时可用 `--root <目标目录> --config <仓库相对清单>`。普通模式在超限、列入清单但缺失文件或非法上限时退出 1，配置缺失/不可读/非对象/空清单或调用无效时退出 2；`--list` 只列用量，即使有 OVER/MISS/BAD 也退出 0，所以 CI 应运行普通模式。空清单拒绝是目标激活前提，不是源空清单行为的声明。

**已观察与仍缺失。** `verification/evidence/raw/p1-installed-doc-budget.json` 记录离线 npm 消费者在默认隐藏 Skill 路径的实际正常、超限/缺文件/非法上限拒绝、诊断列表及不提高上限的恢复；22 项文档门禁测试全部通过。清单、词数与退出码可自动检查；源文中的目标、至少 5% 余量、内容应否迁移与升限理由仍须按上述程序评审。数值目标与执行上限是两个概念，源文明确允许超目标时冻结上限，不能仅因两者不等就判目标过时。该局部运行不证明目标 CI 必跑、平台阻断、全仓预算覆盖、实际评审已执行或独立验收完成。

## 7. 注释与导出 JSDoc

来源：deepseek-harness/docs/AGENTS.md:51-63@687f282e 来源：deepseek-harness/scripts/verify-doc-budgets.ts:1-58@687f282e 来源：deepseek-harness/scripts/doc-budgets.manifest.json:1-8@687f282e 来源：deepseek-harness/docs/AGENTS.md:65-71@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/SKILL.md:79-125@687f282e 来源：deepseek-harness/.agents/skills/dsh-prose-standard/SKILL.md:14-63@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/review.md:4-67@687f282e 来源：deepseek-harness/docs/AGENTS.md:37-39@687f282e 来源：deepseek-harness/AGENTS.md:173-177@687f282e 来源：deepseek-harness/docs/AGENTS.md:41-41@687f282e 来源：deepseek-harness/scripts/verify-md-wrap.ts:1-86@687f282e 来源：deepseek-harness/docs/i18n/translation-rules.md:25-32@687f282e 来源：deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e 来源：deepseek-harness/packages/core/agent/tests/verify-export-jsdoc.spec.ts:1-561@687f282e

<a id="comments-jsdoc"></a>
<!-- mechanism-ids: documentation-comments-export-jsdoc -->

**源义务。** 注释和 JSDoc 写完整合同，不写推理过程；保留行为、失败、时序、所有权、模态、例外、后果和非显然方向；删除逐步实现叙述、测试走查、评审分析和代码复述。局部合同就地写，理由链接到 Agent Note。`deepseek-harness/AGENTS.md:173-177@687f282e`、`deepseek-harness/docs/AGENTS.md:43@687f282e`

**源义务（范围）。** 每个非 vendor 包的 `packages/*/*/src/**/*.ts` 都要有 JSDoc；声明需描述性文字；函数和公共类方法需每个参数一个 `@param`、非 void 结果需 `@returns`。`this` 参数不要求，参数名前导下划线按 lint 约定归一化。类还要求类级说明、公共属性/访问器说明（get/set 对由 getter 覆盖）；重载实现免检（签名承担文档），构造器不检查。内联可调用注解只接受单一 call signature；混合 call/construct 与其它成员的 callable literal 失败关闭，要求抽成命名类型。`deepseek-harness/scripts/verify-export-jsdoc.ts:1-43@687f282e`、`deepseek-harness/scripts/verify-export-jsdoc.ts:140-180@687f282e`、`deepseek-harness/scripts/verify-export-jsdoc.ts:188-260@687f282e`

**源义务（例外与导出形态）。** 框架协议槽 `Config`、`inject`、`name`、`reusable` 作为类的静态成员免检；顶层导出还可含 `apply`。继承成员仅在基类公开且本次没有新增参数/具体返回时继承文档；公共覆写受保护基类视为新 API。`import x =` 别名若指向 callable/class/namespace，拒绝，要求直接导出声明；仅指向纯 prose 目标时别名自身写说明。`export =` 拒绝；带 `moduleSpecifier` 的再导出跳过（定义模块自会遍历）；无 specifier 的 `export { … }` 解析到本地声明；string-literal module / `declare global` 增强跳过；未识别的导出语句失败关闭。`deepseek-harness/scripts/verify-export-jsdoc.ts:260-430@687f282e`、`deepseek-harness/scripts/verify-export-jsdoc.ts:430-540@687f282e`

**源义务（公共面裁剪）。** 仅在包没有 `./src/*` 导出时，按 package.json `exports` 指向的入口收集可达名称，只检查这些名称；其余包遍历全部模块级导出。脚本式 `.d.ts`（无 import/export）视为环境作用域，成员隐式导出。`deepseek-harness/scripts/verify-export-jsdoc.ts:540-607@687f282e`

**迁移设计。** 采用方必须对完整公共导出面启用：公共入口、公共类方法、重载、命名空间、内联 callable、属性/访问器、别名与协议槽都按源规则检查；若没有 AST 检查器，用等价的人工/结构化检查并明确其非自动化状态，不能把“先检查入口”当作完成。不要把“有 JSDoc”当成“合同完整”：检查器只能看标签存在和描述非空，不能判断语义是否准确。**证据边界。** `verify-export-jsdoc` 不检查注释中的行为真假，也不替代类型检查。

**源义务（失败关闭与继承覆盖，测试证据）。** 非标识符 default export 与括号/`satisfies` 包裹的函数初始化器仍按函数合同检查；ambient `declare namespace` 成员隐式导出并逐个检查；`export import` 别名自身需说明，指向 callable/class/namespace 时拒绝；`export =`、混合 callable literal、hybrid call/construct 签名失败关闭。继承覆盖时，基类未命名的参数（含 binding pattern）必须由覆写补 `@param`；下划线重命名视为同一参数；公共覆写 protected-only 基类成员按新 API；基类 void 而覆写产生具体返回值（含 checker 推导）时恢复 `@returns` 义务；基类已承担 `@returns` 时保留完整豁免。`deepseek-harness/packages/core/agent/tests/verify-export-jsdoc.spec.ts:334-561@687f282e`

## 8. 双语配对

来源：deepseek-harness/AGENTS.md:170-178@687f282e 来源：deepseek-harness/docs/AGENTS.md:43-43@687f282e

<a id="i18n-pairing"></a>
<!-- mechanism-ids: documentation-i18n-pair-contract, documentation-i18n-consistency-record, documentation-i18n-pair-gate -->

**源义务（三文件合同）。** 范围内每篇文档有英文、中文和 `.i18n.yaml` 一致性记录，同目录、无本地化子目录。两侧权威相等；任一侧都可先写，另一侧必须跟上。英文侧用 `English | [中文](X.zh.md)`，中文侧用 `[English](X.md) | 中文`。中文不是英文的从属译文，而是同一合同的另一种语言表达。`deepseek-harness/docs/i18n/README.md:3-17@687f282e`、`deepseek-harness/docs/AGENTS.md:45@687f282e`

**源义务（结构）。** 两侧必须同标题层级与顺序、同列表种类与项数、同表格行列、同链接语义目标、同代码块；段落边界可在同一结构单元内按目标语言调整。语言切换行必须存在且方向正确。`deepseek-harness/docs/i18n/translation-prompt.md:53-62@687f282e`

**源义务（范围与排除）。** 配对范围是仓库内人类文档，包括包 README、指南和 Agent Note。生成参考的英文真源没有语言切换行；中文对应页由生成器渲染并写记录。排除项包括 `vendor/`、`node_modules`、网站生成物、归档 Agent Note、部分历史/发布记录。排除必须显式，不能在发现模式下用“看起来像生成物”推断。`deepseek-harness/docs/i18n/README.md:45-69@687f282e`、`deepseek-harness/scripts/verify-translation-pairing.ts:99-170@687f282e`

**源义务（记录格式）。** `.i18n.yaml` 按英文标题 slug 路径分节；每节三行：`/key`、`  en: <16-hex>`、`  zh: <16-hex>`，键唯一、顺序固定。渲染必须带 canonical 头注释、恢复命令 `pnpm run verify-translation-pairing --write <source>`、稳定排序和恰好一个尾换行。diff 区分“当前新增节（unconfirmed）”“任一侧变更”“记录中已被删除的节”；只有两侧当前哈希与记录都一致才算确认。`deepseek-harness/scripts/translation-pairing-record.ts:1-299@687f282e`、`deepseek-harness/docs/i18n/README.md:21-43@687f282e`

**源调用范围。** 不带pair参数的普通只读检查覆盖工作树语料；命名pair只检查该pair，`--cached`必须带pair路径且读取暂存内容。`--all`只与`--write`同用，不是额外的全量只读模式；不能与命名pair混用。先评审当前内容，再重录已确认pair；全量重录会把未审内容记为已确认，不是翻译修复或语义证明。范围不同的通过结果不得互换。`deepseek-harness/scripts/translation-pairing.ts:252-280@687f282e`

**迁移设计。** 只有项目事实类别中确实没有中文对侧时，才能声明单语并记录非激活条件；不能创建空 `.zh.md` 或跳过记录来冒充完成。若维护双语，范围内每一对文档都必须有三文件、切换行、结构签名和记录；可以分批排期，但未迁移页必须显式列为单语/未配对，不能声称双语覆盖。

## 9. 术语与风格校准

来源：deepseek-harness/docs/i18n/README.md:3-17@687f282e 来源：deepseek-harness/docs/AGENTS.md:45-45@687f282e 来源：deepseek-harness/scripts/verify-translation-pairing.ts:99-170@687f282e 来源：deepseek-harness/scripts/translation-pairing-record.ts:1-299@687f282e 来源：deepseek-harness/docs/i18n/README.md:21-43@687f282e 来源：deepseek-harness/scripts/verify-translation-pairing.ts:1-368@687f282e

<a id="terminology"></a>
<!-- mechanism-ids: documentation-i18n-translation-rules, documentation-i18n-terminology, documentation-i18n-style-samples -->

**源义务（术语表）。** `docs/i18n/terminology.md` 是绑定表：每条给英文、中文、处理方式与约束。首次出现按表处理；表中要求保留英文的术语（如 `agent`、`tool`、`session`、`turn`、`step`、`compaction` 等）不得意译成自造词；禁止的译法要明确。表未收录的新术语先按“保留英文/自然中文”的最小规则处理，并在同一 PR 补表；不要静默自创。`deepseek-harness/docs/i18n/terminology.md:1-17@687f282e`、`deepseek-harness/docs/i18n/translation-rules.md:39-44@687f282e`

**源义务（首次出现）。** 中文正文首次出现英文术语时，若表要求注释，使用表中给出的中文注释；之后不重复注释。缩写首次出现给全称与缩写；不要给已通用的 API/CLI 名称加多余翻译。`deepseek-harness/docs/i18n/terminology.md:3-17@687f282e`

**源义务（翻译规则）。** 忠实：保留每个命题，不增不减；保留行为者、对象、条件、例外、否定、模态、因果与概念区分；合同强度不得削弱、加强、反转或合并。语气：目标语言原生技术写作，正式、精确，不口语化；不因避免被动而虚构责任者。结构：长句可按目标语言断句，但逻辑范围必须保留；代码块注释逐字节保留，不翻译。`deepseek-harness/docs/i18n/translation-rules.md:1-38@687f282e`、`deepseek-harness/docs/i18n/translation-prompt.md:63-127@687f282e`

**源义务（风格样例）。** `style-samples.md` 是校准材料，不是额外规则源。它按“先准确后自然”的顺序给出中英对照；样例只校准其示范的规则，不覆盖具体文档上下文或更高优先级要求。样例本身由人工评审，保持双语并随规则 PR 更新。`deepseek-harness/docs/i18n/style-samples.md:1-12@687f282e`、`deepseek-harness/docs/i18n/style-samples.md:16-87@687f282e`、`deepseek-harness/docs/i18n/translation-rules.md:13-19@687f282e`

**迁移设计。** 术语表按合同影响建立，而不是按词频抽样：凡是会改变合同强度、歧义或禁止译法的词都必须有条目；普通名词可以不成条。每个词写“必须译成/必须保留/禁止”，并给一个反例。把术语表接入翻译提示词，而不是只放在文档里靠人记。

## 10. 翻译工作流与简报

来源：deepseek-harness/docs/i18n/translation-rules.md:1-69@687f282e 来源：deepseek-harness/docs/i18n/translation-prompt.md:63-127@687f282e 来源：deepseek-harness/docs/i18n/terminology.md:1-215@687f282e 来源：deepseek-harness/docs/i18n/translation-rules.md:39-44@687f282e 来源：deepseek-harness/docs/i18n/style-samples.md:1-87@687f282e 来源：deepseek-harness/docs/i18n/translation-rules.md:13-19@687f282e

<a id="translation-workflow"></a>
<!-- mechanism-ids: documentation-i18n-routine-extended, documentation-i18n-briefing -->

**源义务（常规 vs 扩展）。** 常规双语更新由单次翻译工作在同一改动内完成：按术语表定位首次出现，保留未触碰的散文，重录记录；只有用户显式调用 `dsh-translate-docs` 才运行扩展工作流。扩展工作流用于新页、整篇重译、术语迁移、结构重排等，包含发现、分块、简报、翻译、审阅、重录和门禁。`deepseek-harness/docs/i18n/README.md:67-69@687f282e`、`deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-74@687f282e`

**源义务（扩展流程）。** 先确认范围、当前分支/PR 基线和适用的 `AGENTS.md`；读取文档标准、术语表、风格样例和目标页；按结构单元分块；用简报说明“哪些段落变了、为什么、术语约束”；翻译整篇而不是只译 diff；完成后自审、结构校验、重录、跑配对门禁。`deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:10-74@687f282e`

**源义务（简报）。** `gen-translation-brief` 读取一致性记录中最后确认的源/目标 blob，计算变更区间，按 `mechanical`、`units`、`sections`、`document` 范围输出。`--apply` 只校验结构，不写译文；它输出结构错误供修正。简报必须覆盖双侧，不能只给英文 diff。`deepseek-harness/scripts/gen-translation-brief.ts:1-331@687f282e`、`deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:26-34@687f282e`

**完成信号。** 简报范围与实际改动一致；两侧结构校验通过；记录重录到当前内容；配对门禁报告这对文档一致。**失败处理。** 若 `--apply` 报结构错误，先修结构再翻译；不要用“译文更自然”为由改变标题层级、列表项数或表格列。**例外。** 纯机械变更（路径、链接目标、数字）可按 `mechanical` 范围处理，但仍要两侧同改并重录。

## 11. 翻译提示词流水线

来源：deepseek-harness/docs/i18n/README.md:57-69@687f282e 来源：deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:1-74@687f282e 来源：deepseek-harness/scripts/gen-translation-brief.ts:1-331@687f282e 来源：deepseek-harness/.agents/skills/dsh-translate-docs/SKILL.md:26-34@687f282e

<a id="translation-prompt"></a>
<!-- mechanism-ids: documentation-i18n-prompt-pipeline -->

**源义务。** `docs/i18n/translation-prompt.md` 是机器消费的提示词，不是给人看的说明文。只有三个占位符：`{{source_lang}}`、`{{target_lang}}`、`{{terminology}}`；模板正文取自 `## 模板正文` 的四反引号 `text` 围栏，渲染后不得残留占位符。待译文档不是占位符，而是在固定消息序列末尾追加；源/目标文件名必须是 basename 且方向匹配（`.md`→`.zh.md`，反向亦然）。few-shot 使用五组整篇中英对照（按列出顺序，上下文不足从后往前删），前四组随当前文档更新，第五组保留冻结历史样例；示例只校准语气，不是翻译记忆，也不能覆盖源义/结构/术语表。`deepseek-harness/docs/i18n/translation-prompt.md:3-31@687f282e`、`deepseek-harness/scripts/translation-prompt.ts:1-120@687f282e`

**源义务（输出协议与转义）。** 模型必须只返回三个原始 XML 区段：`<translation>`、`<review>`、`<final>`，顺序固定、各一次；提示词要求不要包 Markdown 围栏，但解析器容忍整体 `xml` 代码围栏，区段外不得有正文。若段体内出现只由框架标签构成的行，必须多写一个反斜杠转义；解析器只去掉一个框架转义。解析后 `correctLanguageSwitcher` 保留 frontmatter、要求 H1、把切换行替换为目标 canonical 行；缺 H1 或 frontmatter 未闭合失败。`deepseek-harness/docs/i18n/translation-prompt.md:128-157@687f282e`、`deepseek-harness/scripts/translation-prompt.ts:120-259@687f282e`

**源义务（验证）。** `verify-translation-prompt` 检查占位符表、双向渲染、示例组装顺序、响应 round-trip、录制响应前缀与 expected snapshot；模板/示例改动必须同步快照。提示词是代码资产，不能只靠运行效果判断。`deepseek-harness/scripts/verify-translation-prompt.ts:1-98@687f282e`、`deepseek-harness/scripts/translation-prompt.expected.spec.ts:1-32@687f282e`

**迁移设计。** 采用方可把提示词拆成“规则 + 输出协议 + few-shot”，但必须让规则与检查器同源；不要在同一提示词里既要求“保留所有列表项”又要求“合并重复项”而不给优先级。**证据边界。** 提示词验证只证明模板形态符合约定，不证明某次模型输出忠实；忠实仍由配对结构与人工/模型审阅承担。

## 12. 代码等价与可编译示例

来源：deepseek-harness/scripts/translation-prompt.ts:1-259@687f282e 来源：deepseek-harness/scripts/verify-translation-prompt.ts:1-98@687f282e 来源：deepseek-harness/scripts/translation-prompt.expected.spec.ts:1-32@687f282e 来源：deepseek-harness/docs/i18n/translation-prompt.md:1-263@687f282e

<a id="code-equivalence"></a>
<!-- mechanism-ids: documentation-doc-typecheck, documentation-type-equiv, documentation-subsystem-page-ownership -->

**源义务（可编译围栏）。** `doc-typecheck` 扫描根 `README.md`、`.agents/notes/**/*.md`、`docs/**/*.md`、`packages/*/*.md`、`packages/*/*/*.md`，排除归档 Agent Note；只编译 info 恰为 `ts` 的围栏。`ts ignore-check` 记为 opt-out；`ts type-equiv`/`public-api`/`cordis-catalog`/`persistence-catalog`/`config-catalog` 跳过，由 type-equiv 或对应生成器门禁负责。字节相同的 `.zh.md` 副本复用无后缀英文兄弟的编译结果，内容不同则独立编译。`deepseek-harness/scripts/doc-typecheck.ts:1-73@687f282e`、`deepseek-harness/scripts/doc-typecheck.ts:200-252@687f282e`

**源义务（诊断与 opt-out 比例）。** 编译诊断映射回原 Markdown 文件、围栏起始行和块内位置；类型、语法或导入解析错误使门禁失败。没有待编译块时提前退出0，全部都是`ignore-check`时也不会执行比例检查。只在存在待编译块时计算`ignored / (checked + ignored)`，分母≥4且比例>0.5才失败；其它owner的围栏不稀释分母。理由属于评审义务，脚本不校验；Markdown解析器补全未闭合围栏也不等于本编译器会拒绝。`deepseek-harness/scripts/doc-typecheck.ts:196-252@687f282e`

**源义务（类型等价）。** ` ```ts type-equiv ` 保存“原始类型声明 + 原 JSDoc”，用于证明文档粘贴与源声明等价；` ```ts public-api ` 保存去掉函数体的公共类声明。两者必须登记在 `scripts/type-equiv.manifest.json`，清单与围栏一对一；任何未登记围栏、孤儿清单项、结构/JSDoc 差异、投影差异都失败。`deepseek-harness/scripts/verify-type-equiv.ts:1-120@687f282e`、`deepseek-harness/scripts/verify-type-equiv.ts:214-391@687f282e`、`deepseek-harness/scripts/type-equiv.manifest.json:1-3@687f282e`

**源义务（何时用哪种）。** 教程式用法示例用普通 `ts`；逐字重述源类型用 `type-equiv`；展示公共类形状用 `public-api`；不要为了绕过编译把真实示例标成 `type-equiv`。源码改名/改字段时，先改源声明，再运行等价检查定位所有粘贴。`deepseek-harness/docs/AGENTS.md:41-43@687f282e`、`deepseek-harness/docs/development.md:99-110@687f282e`

**迁移设计。** 采用方必须为所有声明可运行的文档代码块提供真实编译（真实编译器或等价虚拟文件编译）；无法编译的块必须标注为非可运行/未验证，不能声称示例可运行。不要用 `// ...` 省略关键 API 后仍声称示例可运行。**证据边界。** `doc-typecheck` 不运行示例，只编译；`type-equiv` 不证明语义正确，只证明声明与源一致。

**目标执行器。** 从目标项目根目录运行，不从Skill目录推断项目。目标须已有自己的TypeScript开发依赖和可加载的真实tsconfig；本模块不下载编译器，也不回退使用Skill的发布者测试依赖。准备文档模块的固定Markdown解析器后，在目标的`.doc-gates/typecheck.json`声明实际语料，例如：

```json
{
  "roots": ["docs"],
  "tsconfig": "tsconfig.json",
  "mode": "project"
}
```

```bash
node .agents/skills/harness-project-governance/tools/doc-gates/doc-typecheck.mjs
```

将这条命令接入目标现有的顶层检查入口和适用CI，不另建一套竞争检查清单。`--root`指定真实目标根，`--config`指定根内配置；语料复用本模块的`roots`/`files`/`archiveRoots`规则，默认不把冻结Note当源。空语料、缺解析器/编译器、坏配置退出2，不冒充通过；非空语料里没有受编译`ts`块则保留源规则的退出0边界。

`project`模式继承目标编译选项和真实项目引用，由目标的`tsc -b`构建引用并检查临时文档项目。临时配置与所选tsconfig处于同一目录，保留`${configDir}`的所有者语义；用明确的`files`选择每个提取块，不依赖跨目录glob再次发现。该模式须能写目标根、所选配置目录以及真实引用项目的构建产物；临时片段不发射输出，结束后删除自有临时目录和配置文件，不覆盖同名既有文件。目标原有`include`/`exclude`不会吞掉文档输入，项目引用仍由TypeScript按其owner配置解析。

`declarations`模式用于已有协调构建产物的源式布局：将tsconfig别名的`/src`、`/src/*`、`/src/file.ts`和`/src/dir`映射到`/lib/types`对应声明，源例外`/examples/`保留原路径。无法映射会阻塞，不猜替代目录；其它布局用`project`模式。该模式不发射文件、不重建依赖，也不证明声明新鲜度；调用者须先实际完成自己的协调构建。字节相同的**完整受识别围栏序列**才使中文复用英文，部分或变化序列独立编译。

两种模式对文档输入都强制`noCheck:false`，不能因目标采用只发射配置而静默跳过类型检查；引用项目仍保留各自选项。`declarations`模式在禁用声明发射时同时清除`emitDeclarationOnly`，避免把有效的声明构建配置变成无效组合。这是目标配置适配，不是声称固定来源已覆盖这些选项。

**编译器证据边界。** 初始12条命令保留原始版本观察。独立复核发现配置缺陷后，新增物理默认安装座的7条目标顶层命令，观察嵌套`${configDir}`别名/typeRoots、真实引用重建、继承`noCheck`时的类型错误拒绝、`emitDeclarationOnly`兼容、两模式修复恢复与每次临时产物清理；当前证据绑定修复后的模块及目标编译器/解析器分发文件。初始比例、缺编译器和显式目标根观察不重复运行，也不把旧模块hash当作当前产物认证。已实际验证TypeScript6.0.3，其它版本未认证。这些是本地编译效果，不是示例行为执行、独立采用、完整安装认证或真实required-CI/平台阻断；catalog owner的执行缺口仍分别保留，类型等价由下述独立owner检查。

**类型等价目标入口。** `tools/doc-gates/verify-type-equiv.mjs`复用相同的目标语料和固定GFM解析器；TypeScript必须由目标的`package.json`位置解析，不下载或回退使用发布者编译器。采用方在`.doc-gates/type-equiv.json`声明适用的全部语料，例如`{ "roots": ["docs"], "manifest": ".doc-gates/type-equiv.manifest.json" }`。配置缺省清单即该路径；支持相同的`files`、`archiveRoots`、`--root`和`--config`规则。清单是`entries`数组，每项声明目标根相对的`doc`、`source`和`symbol`；完整声明不写`projection`，公共类写`"projection": "public-api"`。显式模块合并只用于完整接口：可加`"augmentations": [{ "source": "src/runtime.ts", "module": "./api.ts" }]`，其中module精确匹配源码的字符串字面量模块名，而不是自动发现所有扩展。

```bash
node .agents/skills/harness-project-governance/tools/doc-gates/verify-type-equiv.mjs
```

将该命令并入目标现有顶层检查/适用CI。门禁扫描全部声明语料，不只扫描清单中的文件；完整声明和公共投影分别以文档、符号、投影为键，重复围栏/清单、孤儿、缺源码符号、未闭合围栏、结构或原JSDoc漂移退出1。缺真实语料/编译器/解析器、坏配置或清单退出2。非空语料里没有等价围栏且清单为空时退出0；未要求全部新类型必须写文档。只有字节相同、顺序/数量/投影均相同的完整等价围栏族才使中文复用英文；变化的中文围栏仍需自己的清单/源匹配，不是翻译语义认证。

完整声明保留原声明与JSDoc；公共类保留源码附着的类/成员JSDoc、泛型、继承、公开字段/构造/方法/访问器签名，去掉实现体、字段初始化、私有/受保护成员与静态块。显式接口合并保留原附着JSDoc、基接口泛型及所有指定成员。**目标适配。** 使用TypeScript解析后的真实token比较结构，普通注释与token间空白忽略，字符串/模板里的空白和注释样文本不擦除；只移除声明级export/default。JSDoc仅规范空白，内容与顺序保留。多个接口继承类型合为一个有效extends列表。这比固定来源的全字符串正则归一化更适合任意目标；不冒充来源实现，也不证明这些声明本身类型正确或示例已经执行。

**类型等价证据边界。** 六条实际CLI回归覆盖字面量/JSDoc漂移、公共类、显式合并、清单双射、中文序列和GFM围栏。`verification/evidence/raw/type-equiv-physical-consumer-after.json`观察默认隐藏安装座的物理可选模块副本、单独物理目标编译器、11条正常/漂移拒绝/源先改再同步文档恢复/孤儿/重复/缺目标编译器/异地指定根命令，绑定140编译器和918解析器分发文件。真实源码和方法体含会抛错的表达式但没有被执行；本门禁只读/解析/比对声明，不执行或类型检查。初次物理探针的字面量分号不一致结果保留，修正探针后通过，不放宽门禁。现已观察TypeScript6.0.3，其它版本、完整安装/独立采用、全目标适用范围及真实CI阻断均未认证。

### 子系统页归属：组链接检查与类型完整性分开

**来源义务与自动边界。** 新增包组、重塑已文档化类型或调整归属时，类型作者先确定声明包组的 owning 页，文档作者在同一变更更新该页，评审者检查语义、类型和双语完整性。来源门禁用 `packages/*/README.md` 与 `packages/*/*/package.json` 的组名并集发现检查对象：即使组只由子包 manifest 发现，也必须有英文组 README。每组须链接至少一个存在的独立 `docs/subsystems/*.md` 页，或有显式非空理由豁免。代码、注释、图片、子系统索引 `README.md` 和 `.zh.md` 对应页不计 owning 页；空理由、已删除组的孤儿豁免、已有页链接却保留豁免都失败。来源五个豁免组的理由是项目政策，不是“纯内部组均豁免”的通用规则。`deepseek-harness/scripts/verify-subsystem-pages.ts:1-137@687f282e`、`deepseek-harness/docs/AGENTS.md:43-44@687f282e`

**目标配置与入口。** 已交付 `tools/doc-gates/verify-subsystem-pages.mjs`；不依赖源仓、不需要目标 TypeScript 编译器。准备可选文档模块的固定解析器后，在目标 `.doc-gates/subsystem-pages.json` 写真实布局，例如：

```json
{
  "packagesRoot": "packages",
  "docsRoot": "docs",
  "pageRoot": "docs/subsystems",
  "groupReadme": "README.md",
  "manifest": "package.json",
  "pageSuffix": ".md",
  "exemptions": {}
}
```

`exemptions` 必须是“组名→具体理由”的对象，不是数组；没有豁免就保留 `{}`。包组所有者确认确实没有独立 owning 页后才能登记理由，不能为恢复绿色随意加豁免。字段省略时采用上述目录/文件名默认值；配置文件本身仍须存在。布局不同就改字段并核对发现的组数，不能把“0组通过”当作完整目标覆盖证据。

```bash
npm ci --prefix .agents/skills/harness-project-governance/tools/doc-gates --ignore-scripts --omit=dev
node .agents/skills/harness-project-governance/tools/doc-gates/verify-subsystem-pages.mjs
```

从目标项目根目录运行；异地调用用 `--root <目标根>`，`--config <配置路径>` 默认相对该根解析。若使用发布者包目录，可运行 `npm run verify-subsystem-pages -- --root <目标根>`。采用者须把同一命令加入目标既有顶层检查和适用 CI；上述本地入口存在不等于可信 CI 已必跑或 forge 已阻断合并。

**落点适配。** 固定来源只接受 `../../docs/subsystems/<page>.md`（可带 fragment）的字面形式。目标把 Markdown AST 中的直接 `link` 从组 README 所在目录解析，去掉 query/fragment，规范化后必须处于配置的 `pageRoot`、具有指定后缀且是存在的文件；不读取已废弃的 `linkPrefix`。规范化后等效的相对路径可以通过，离开页目录的 `../` 不会因文本“看起来像” owning 页而通过。这是目标布局适配，不声称与源程序逐输入完全等价，也不是任意链接、锚点、页面内容或生成区域的完整校验。

`groupReadme` 可以是嵌套文件，例如 `docs/OWNERS.md`；链接基准是该文件所在目录，而不是包组目录。`components/compute/docs/OWNERS.md` 指向 `guide/owners/compute.md` 的正确相对链接是 `../../../guide/owners/compute.md`，不能少一个 `../`。已修复独立复核发现的这一落点误判，仍按实际文件检查，不限制配置来回避问题。

**失败与恢复。** 合同违反退出1，诊断列出组 README、缺失 owning 页或无效豁免：补组 README/正确链接/真实 owning 页，或移除过期豁免后重跑同一入口。坏配置、缺配置、错误参数或缺安装座解析器退出2：先恢复输入/依赖，不将不可运行状态记为通过。成功退出0并报告发现组数、已链接数和显式豁免数；评审者还须核对未被配置发现的实际包组。

**已观察。** `verification/evidence/raw/subsystem-pages-installed-consumer.json` 保存默认隐藏安装座的物理可选模块副本、926个分发文件绑定、完整探针源码与每步目标输入；在非源产品布局上实际运行同一个顶层 `npm run check` 11次，观察正常、缺链接/实际落点越界/缺页/过期豁免的退出1及修复恢复，以及缺安装座解析器的退出2和恢复。临时目标已删除；这是局部模块消费，不是完整 Skill 安装或独立采用。`subsystem-pages-physical-consumer.json` 另保留固定源树的只读52组（47链接、5豁免）观察及移除豁免后的5组拒绝，不是源脚本执行或源生产设置证明。

嵌套路径修复另见 `verification/evidence/raw/subsystem-pages-nested-readme-installed.json`：物理默认隐藏安装座执行4条顶层 `npm run check:owners`，错误落点拒绝1、正确链接恢复0、删除实际页拒绝1、恢复实际页通过0。原11条命令与52组结果是修复前版本的历史观察，不是当前执行器的相同字节绑定；新增拒绝/恢复回归修复前失败，修复后全部15项行为测试通过。

**不能由门禁推出的结论。** 实际临时目标含一个未文档化的新导出类型，链接检查仍成功，证明本门禁不枚举所有类型。类型粘贴漂移归 `type-equiv`，是否遗漏新类型、页语义是否完整、中文是否正确、同一变更是否联动、豁免理由是否合理由对应程序和评审承担。组链接/文件检查不替代索引内容、生成标记或 freshness gate；本地正常/拒绝/恢复不替代真实 required-CI、平台阻断、完整安装、独立采用或源仓反向查漏。



## 13. 生成参考

来源：deepseek-harness/scripts/doc-typecheck.ts:1-252@687f282e 来源：deepseek-harness/scripts/doc-typecheck-paths.ts:1-24@687f282e 来源：deepseek-harness/scripts/verify-type-equiv.ts:1-120@687f282e 来源：deepseek-harness/scripts/verify-type-equiv.ts:214-391@687f282e 来源：deepseek-harness/scripts/type-equiv.manifest.json:1-3@687f282e 来源：deepseek-harness/docs/AGENTS.md:43-43@687f282e 来源：deepseek-harness/docs/subsystems/README.md:74-76@687f282e 来源：deepseek-harness/scripts/verify-subsystem-pages.ts:1-137@687f282e 来源：deepseek-harness/docs/subsystems/README.md:1-76@687f282e

<a id="generated-references"></a>
<!-- mechanism-ids: documentation-generated-reference-freshness -->

**源义务。** 生成参考的英文是“从源再生成并做新鲜度门禁”的穷尽事实源；中文对应页按配对工作流维护。禁止手改英文生成页或生成区域。生成器必须从代码、清单或运行时 schema 读取，不得从相邻文档反推。`deepseek-harness/docs/AGENTS.md:33@687f282e`

**生成器族。** 典型入口包括：`gen-config-catalog`（配置项、类型、JSDoc、schemastery 形态）、`gen-tool-catalog`（启动插件、运行时 schema、工具清单一致性）、`gen-doc-graphs`（文档图与清单）、`gen-module-graph`（工作区包与 peer 依赖）、`gen-cordis-catalog`（Cordis 服务/事件与页面分区）、`gen-cli-help`（CLI 帮助）、`gen-persistence-catalog`/`gen-session-format-catalog`（持久化与 Session 格式目录）。每个都有 `--check` 形式，在 `test:docs`/`doc-sync` 中运行。`deepseek-harness/scripts/gen-config-catalog.ts:1-120@687f282e`、`deepseek-harness/scripts/gen-tool-catalog.ts:1-133@687f282e`、`deepseek-harness/scripts/gen-module-graph.ts:1-191@687f282e`、`deepseek-harness/scripts/gen-doc-graphs.ts:1-103@687f282e`

**源义务（失败关闭，分族）。** 生成器不是统一的“空扫描/未知输入都失败”，实际准入面如下。配置：遍历 `packages/*/*/package.json`，缺 `name` 或入口 `src/index.ts` 缺失/不可读失败；有 `os` 与 `cpu` 的 per-platform 原生包跳过。按默认类/函数、导出 `apply`、否则 library 分类，abstract 默认类为 seam；config 参数必须是命名类型引用且 config 类型必须在本包。粘贴包内传递类型闭包；同名声明冲突、包内声明与导入冲突、既非本地声明也非导入/全局类型失败；导入类型只记 ref，不要求可粘贴；每个粘贴类型检查成员 JSDoc。运行时 schemastery 仅接受可静态遍历的 object/array/intersect/union/refinement/const alias；递归 alias、非 plain key、动态表达式、无法解析的 intersect/union 元素失败。schema key 在声明类型上确定缺失时失败；未知类型路径记为 `unknown` 而不是报缺失；composed 包必须在本轮扫描中。工具：`assertManifestComplete` 要求 `packages/*/tool-*` 全部在 `TOOL_PACKAGES`；每个条目在独立 Context 中启动并必须在 `finally` dispose，`assertToolsHarvested` 要求至少注册一个工具；每个工具必须有 source mapping；默认 config 之外，无默认的必填 config 字段必须由生成器选分支并在页面注记，`examples/` 不在范围。失败信息解释 PENDING/inject 常见原因。文档图：服务角色分类必须无缺失/过期，且索引逐页声明 generated/hybrid/curated 模式；事件矩阵由真实 TypeScript Program 收集，声明事件必须有 dispatcher（Client 声明因只种 Host 聚合程序而豁免），未声明但出现的 event string 必须单列；事件收集器测试覆盖 local/alias/global script 与文件系统 memo。CLI：实际启动 launcher 的每个 `--help`，使用独立临时 Harness/agents homes、禁用遥测/颜色并清除 NODE_OPTIONS/FORCE_COLOR；空输出、stderr 诊断、超时/非零退出失败。按 `Commands:` 遍历嵌套与 alias，同文帮助去重并列出全部 invocation；启动器、plugin、每个 profile 的短名与 `--profile` 形式都覆盖；`--check` 同时查英文/中文/sidecar，内容差异即 stale，读取失败直接抛错且不会通过。Session：从 `SESSION_FORMAT_VERSION` 读当前版本，迁移清单从 0 到 current 每个版本恰一条相邻迁移；`from/to` 必须非负安全整数且 `to=from+1`，包名/目录匹配，metadata 无未知字段，source codec 延续前驱 target 且依赖前驱包，catalog 以 peer+dev 依赖 Session；生成的 catalog 用直接 import，独立于已挂载插件。持久化：`SessionEventMap` 顶层接口必须只在本包导出且唯一，成员必须是显式 payload 的 string-literal property，禁止 `plugin:` 命名空间、继承和重复；envelope 类型必须单家、导出、有文档、无 `@mode`；`SurfaceEventType` 必须恰有一个字面量联合，成员不得指向未声明事件，且不能与 `messageProjection` 同时声明。生成事件对/插件记录/运行时 known-types 与 schema JSON；`--check` 对缺失/不可读/不同都按 stale。`deepseek-harness/scripts/gen-config-catalog.ts:1-1074@687f282e`、`deepseek-harness/scripts/gen-tool-catalog.ts:1-898@687f282e`、`deepseek-harness/scripts/gen-doc-graphs.ts:1-1861@687f282e`、`deepseek-harness/scripts/gen-cli-help.ts:1-298@687f282e`、`deepseek-harness/scripts/gen-session-format-catalog.ts:1-261@687f282e`、`deepseek-harness/scripts/gen-persistence-catalog.ts:1-267@687f282e`、`deepseek-harness/scripts/persistence-catalog-source.ts:134-310@687f282e`

**源义务（新鲜度与证据）。** 每个入口都有 `--check`：默认写文件，`--check` 逐字节比较已提交内容并失败于 stale；成功后打印计数，便于发现扫描意外变窄。`--check` 只证明 bytes 与当前生成结果一致，不证明生成结果完整或语义正确；空语料/未知输入覆盖并不统一——配置、CLI、Session、Persistence 有专用 spec（Persistence 为 `packages/core/session/tests/gen-persistence-catalog.spec.ts:1-306`），doc-graphs spec 覆盖事件收集器与 memo 而非完整页面；tool 的专用 spec 为 `packages/core/tools/tests/gen-tool-catalog.spec.ts:1-158`，覆盖真实树收集、空清单漏包、启动零工具、PATH 独立与 render，但没有空磁盘扫描用例。不能宣称所有生成器都有统一的空扫描失败。`deepseek-harness/scripts/gen-config-catalog.ts:930-1074@687f282e`、`deepseek-harness/scripts/gen-tool-catalog.ts:850-898@687f282e`、`deepseek-harness/scripts/gen-config-catalog.spec.ts:1-195@687f282e`、`deepseek-harness/scripts/gen-cli-help.spec.ts:1-134@687f282e`、`deepseek-harness/scripts/gen-session-format-catalog.spec.ts:1-167@687f282e`、`deepseek-harness/scripts/gen-doc-graphs.spec.ts:1-165@687f282e`、`deepseek-harness/packages/core/session/tests/gen-persistence-catalog.spec.ts:1-306@687f282e`、`deepseek-harness/packages/core/tools/tests/gen-tool-catalog.spec.ts:1-158@687f282e`

**源义务（Persistence 专用 spec 证据）。** 该 306 行 spec 覆盖：`SessionEventMap` 仅一个 owning 包导出，非 owning/未导出/两处导出/`extends`/重复/非字面量/方法式/无显式 payload 类型/无描述/`@mode`（含额外缩进）/`plugin:` 命名空间都是硬错误，且违规聚合为一条错误；envelope 四类型 `SessionEventType`、`SurfaceEventType`、`SurfaceOp`、`SessionEvent` 必须存在、单家、导出、有描述、无 `@mode`，并按规范顺序报告；`SurfaceEventType` 必须恰为一个闭合 string-literal union，成员不得指向未声明事件，`@messageProjection` 与 surface 操作互斥；render 输出 generated header、declaration fence 与 surface/log-only 标记。`deepseek-harness/packages/core/session/tests/gen-persistence-catalog.spec.ts:1-306@687f282e`

**操作步骤。** 改源→运行对应生成器（非 `--check`）→审查 diff 只含预期事实→两侧语言与记录按生成器规则更新→运行 `--check`。不要在生成页上手工补表；若生成器缺字段，先改生成器和测试。**完成信号。** `--check` 无差异且计数与预期范围一致。**失败处理。** 差异可能来自源变更未提交、生成器版本不一致或手改生成页；先定位真源，不要直接接受生成输出。

**迁移设计。** 采用方必须为每个生成事实族建立生成器与 `--check`：配置、工具/命令、模块依赖、Session 格式、CLI 帮助、图/关系等；逐族声明“空扫描/未知输入/清单变窄”时的行为，优先在这些情况下失败，但不得把某一族的 guard 推及全部。可以按依赖顺序落地，但在声称覆盖前全部适用族必须落地；未落地族记录非激活与重新激活条件。生成器输出应带稳定标记（文件名或区域标记），让手改检查可机械执行。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/persistence-catalog-source.ts:1-133@687f282e`、`deepseek-harness/scripts/persistence-catalog-source.ts:311-311@687f282e`


## 14. 共享生成区域

来源：deepseek-harness/scripts/gen-doc-graphs.ts:1-103@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.ts:104-944@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.ts:981-1504@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.ts:1531-1759@687f282e 来源：deepseek-harness/scripts/gen-tool-catalog.ts:1-133@687f282e 来源：deepseek-harness/scripts/gen-tool-catalog.ts:134-699@687f282e 来源：deepseek-harness/scripts/gen-tool-catalog.ts:700-849@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.ts:1-120@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.ts:121-239@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.ts:240-310@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.ts:311-929@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.ts:930-1074@687f282e 来源：deepseek-harness/scripts/gen-tool-catalog.ts:111-119@687f282e 来源：deepseek-harness/scripts/gen-tool-catalog.ts:850-898@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.ts:945-980@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.ts:1505-1530@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.ts:1760-1861@687f282e 来源：deepseek-harness/scripts/gen-cli-help.ts:1-229@687f282e 来源：deepseek-harness/scripts/gen-cli-help.ts:230-298@687f282e 来源：deepseek-harness/scripts/gen-persistence-catalog.ts:1-209@687f282e 来源：deepseek-harness/scripts/gen-persistence-catalog.ts:210-267@687f282e 来源：deepseek-harness/packages/core/session/tests/gen-persistence-catalog.spec.ts:1-306@687f282e 来源：deepseek-harness/scripts/persistence-catalog-source.ts:134-310@687f282e 来源：deepseek-harness/scripts/gen-session-format-catalog.ts:1-199@687f282e 来源：deepseek-harness/scripts/gen-session-format-catalog.ts:200-261@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.spec.ts:1-195@687f282e 来源：deepseek-harness/scripts/gen-cli-help.spec.ts:1-134@687f282e 来源：deepseek-harness/scripts/gen-session-format-catalog.spec.ts:1-167@687f282e 来源：deepseek-harness/scripts/gen-doc-graphs.spec.ts:1-165@687f282e 来源：deepseek-harness/scripts/persistence-catalog-source.ts:1-133@687f282e 来源：deepseek-harness/scripts/persistence-catalog-source.ts:311-311@687f282e

<a id="generated-regions"></a>
<!-- mechanism-ids: documentation-generated-region-grammar, documentation-generated-source-pairing, documentation-cordis-catalog-partition -->

**源义务（区域语法）。** 使用整行 `<!-- BEGIN GENERATED <slug> … -->` / `<!-- END GENERATED <slug> -->`；BEGIN 可带说明，END slug 必须匹配。共享 parser 拒绝未开启 END、未闭合 BEGIN、嵌套和畸形标记；区域替换要求目标 slug 恰好一个。区域外字节是作者内容，生成器不得改写；这项作者边界不能单凭配对区域比较证明。`deepseek-harness/scripts/translation-pairing.ts:20-101@687f282e`

**源义务（分区与记录）。** Cordis 服务/事件按 key→页面失败关闭，映射两侧完整性由独立声明扫描兜底；中英文均注入区域。仅区域再生成不需人工翻译或新记录；区域外正文变动先确认两侧，再显式配对 `--write`。头部声称条件化重录，但当前 `computeOutputs`/`main` 没有 sidecar writer，不能把注释当成已实现效果。整页生成器可另有配对散文与sidecar输出，不与混合页混同。`deepseek-harness/scripts/gen-cordis-catalog.ts:1198-1303@687f282e`、`deepseek-harness/docs/i18n/README.md:50-54@687f282e`

**源义务（配对归一化）。** 只把配对文档链接的 locale 路径归一化为同一语义目标，再按区域顺序逐字节比较；一般空白、代码、标记、散文和非 locale URL 漂移都不能靠重录消除。区域外正文按普通翻译/记录义务处理。`deepseek-harness/scripts/verify-translation-pairing.ts:283-313@687f282e`

**迁移设计。** 只要页面有生成区域，即使只有一个生成器，也必须保留完整标记语法、精确边界、双语locale链接以外的字节同源、映射失败关闭和新鲜度检查。配对程序已承载其区域比较；它不能证明API投影输入完整、产品运行语义或作者区未被错误确认。目标等价API投影/生成门仍需实际实现与CI证据，不能因缺支持降为人工建议。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/gen-cordis-catalog.ts:84-1118@687f282e`、`deepseek-harness/scripts/gen-cordis-catalog.ts:1171-1187@687f282e`、`deepseek-harness/scripts/gen-cordis-catalog.ts:1260-1279@687f282e`、`deepseek-harness/scripts/gen-cordis-catalog.ts:1292-1307@687f282e`


## 15. Markdown 链接、锚点与换行

来源：deepseek-harness/scripts/translation-pairing.ts:18-80@687f282e 来源：deepseek-harness/scripts/gen-config-catalog.ts:930-1074@687f282e 来源：deepseek-harness/scripts/verify-translation-pairing.ts:99-140@687f282e 来源：deepseek-harness/docs/i18n/README.md:49-56@687f282e 来源：deepseek-harness/scripts/translation-pairing.ts:80-139@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1-83@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog-partition.spec.ts:1-211@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:84-1118@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1171-1187@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1260-1279@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1292-1307@687f282e

<a id="markdown-gates"></a>
<!-- mechanism-ids: documentation-markdown-links, documentation-source-doc-refs, documentation-mermaid-syntax, documentation-markdown-corpus-model -->

**源义务（受检语料）。** 所有 Markdown 门禁共享 GFM 解析与行模型：散文行排除围栏/缩进代码块和 HTML 注释，保留 1-based 行号与原文本；围栏保留 info string 与 `closed`，mdast 在 EOF 静默闭合的围栏不得当成已闭合；标题支持 ATX/Setext，slug 用渲染文本（原始 HTML 注释不进入）。链接目标用作者源偏移定位，兼容 `<...>`、转义、嵌套括号和引用定义，定位失败抛错。仓库发现只模型化 `*`、`?`、`**`；字符类、brace/extglob、反斜杠、`..`、空段、尾随 `**` 显式抛错，不能静默返回空集；`**` 只展开真实目录，最终段可匹配文件/符号链接，最终段的断链/环链在 realpath 处失败，非最终 literal 断链匹配为空（与 node glob 一致）；多个 pattern 共享目录列表，按 canonical realpath 去重符号链接。归档 Agent Note 不作为源扫描，但指向它们的链接仍作为目标检查。`deepseek-harness/scripts/markdown.ts:1-277@687f282e`、`deepseek-harness/scripts/repo-files.ts:1-295@687f282e`

**源义务（相对链接）。** 当前文件用相对 Markdown 链接；历史引用用 tag 或 PR 号。`verify-md-links` 只检查本地目标：查询串/片段剥掉后目标必须存在；外部 URL、协议相对 `//host` 和根绝对 `/path` 被排除。目标是非 Markdown 文件时（如 `file.ts#L10`），片段交给渲染器，不判锚点。`deepseek-harness/docs/AGENTS.md:75-77@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:34-73@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:204-233@687f282e`

**源义务（锚点）。** 锚点按 GitHub slug 规则解析：转小写、删去字母/数字/下划线/空格/连字符以外的字符、空格变连字符；显式 `<a id="...">` 也算目标，但 fenced/inline code 和 HTML 注释里的锚点不算。重复标题按 GitHub 占用集加 `-1`、`-2`；匹配大小写敏感。标题改名会破坏入站锚点，必须同改引用；没有自动别名放行表。`deepseek-harness/scripts/verify-md-links.ts:99-160@687f282e`

**源义务（禁止网站路由，评审）。** Markdown 中不要写 `/docs/...` 之类的站内绝对路由；这些链接在 GitHub 上不可解析，且检查器会跳过根绝对路径，因此该禁令只能由写作评审执行，不是 `verify-md-links` 的自动拒绝。写源相对链接，网站投影负责转换。`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:60-64@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:45-73@687f282e`

**源义务（源注释引用）。** 源码注释/字符串中的文档路径必须是从仓库根开始的完整 `docs/...` 路径，带扩展名，不能 `./`/`../`；`verify-doc-refs` 扫描非 vendor、非 `lib`、非 `.d.ts` 的源码，去重符号链接后验证目标存在。`deepseek-harness/scripts/verify-doc-refs.ts:1-45@687f282e`

**源义务（换行）。** 第6节的一行写作要求保留；脚本只检查 GFM AST 的跨行 `paragraph` 节点，包含列表/引用内段落，非段落的标题/围栏/表格/HTML 等不由该谓词检查。LF frontmatter 与 `:::` 容器分隔行先遮盖；冻结归档源不扫描；生成区域内 prose 没有一概豁免。`deepseek-harness/scripts/verify-md-wrap.ts:40-86@687f282e`

**源义务（Mermaid）。** 每个 Mermaid 围栏都被解析和校验，单图边数上限 64；只验证语法/结构，不渲染。不要在 Mermaid 中依赖未定义节点或超限复杂度。`deepseek-harness/scripts/verify-mermaid.ts:1-106@687f282e`

**迁移设计。** 采用方必须把本地目标、锚点、换行、仓库引用与 Mermaid 语法作为同一链接/文档完整性合同落地；如果站点使用非 GitHub 锚点算法，替换 slug 实现而不是跳过锚点。可以分批修复存量，但门禁覆盖范围和失败条件不得缩小。解析器/依赖缺失、配置未声明、语料未纳入或 CI 未接入是**阻塞或未落实**，须记录缺什么与解除条件，不能记成“非激活”；只有该事实类别在目标确实不存在（如确无 Markdown 或确无归档树）才记**不适用**与重新激活条件。两类状态与[§23](#migration)的判据一致。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/verify-md-links.spec.ts:1-29@687f282e`、`deepseek-harness/scripts/verify-md-links.spec.ts:64-140@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:204-254@687f282e`

### 15.1 已交付的目标链接执行器

安装后的 `tools/doc-gates/verify-md-links.mjs` 使用同一组固定版本 GFM 解析器。先按 [配对执行模块](upgrade-guides.md) §9.5 准备 `tools/doc-gates/package-lock.json` 中的依赖；消费者不需要源仓。以下命令从目标项目根目录执行：

```bash
npm ci --prefix .agents/skills/harness-project-governance/tools/doc-gates --ignore-scripts
node .agents/skills/harness-project-governance/tools/doc-gates/verify-md-links.mjs
```

先在目标的 `.doc-gates/markdown-links.json` 声明真实受管 Markdown 语料。例如确实同时存在文档和 Note 树的项目：

```json
{
  "roots": ["docs", ".agents/notes"],
  "files": ["README.md", "README.zh.md", "AGENTS.md"],
  "archiveRoots": [".agents/notes/archived"]
}
```

这是把源产品的硬编码发现路径参数化，不是减少覆盖：执行者与评审者须纳入所有适用的文档、包说明、指令和技能文档。`roots` 递归扫描真实目录中的 Markdown，`files` 声明单文件；缺失路径、空语料、错误配置或不可用解析器退出2，不伪装成通过。声明根可显式包含隐藏目录，递归发现不进入隐藏或符号链接目录；匹配的文件按真实路径去重，断链报错。归档根只跳过源扫描，活跃页面指向归档的目标/锚点继续验证。没有 `archiveRoots` 时默认使用上述源归档路径；项目更换归档位置时必须同步此字段。

成功输出受检文件数并退出0；缺目标或 `.md` 锚点时逐项输出 `file:line`、URL 与原因并退出1，不重写文件。保留源的 rendered-heading slug、重复标题占用集、真实 HTML anchor、query/percent-decoding 和外部/根绝对/非 Markdown 片段边界。`/docs/...` 仍属于禁止使用的源写作规则，但不是本程序能拒绝的错误；由文档评审负责。源码注释引用、换行、Mermaid、预算与站点发布仍由其各自的适用门禁拥有，不能用此命令替代。

本模块已在默认 Skill 安装位置的离线 npm 消费者中与 Note 分类、格式、配对、冻结程序组合运行，观察到正常、拒绝与恢复；首次缓存缺失和错误归档配置造成的失败也保留。该局部观察不证明真实目标 CI、required protection、语义翻译或独立来源等价通过。

### 15.2 已交付的目标换行执行器

在目标 `.doc-gates/markdown-wrap.json` 按§15.1同一结构声明 `roots`、`files`、`archiveRoots`；独立配置是因为源换行/链接程序的发现语料并不完全相同。纳入所有适用文档、指令与 expected Markdown 输出，不以示例路径代替完整目标语料。准备同一固定解析器后，从目标 cwd 运行 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-md-wrap.mjs`；异地调用支持 `--root`、`--config`。成功退出0，跨行段落逐项输出 `file:line` 并退出1；前提、配置或语料不可用退出2。程序只检查，不重写内容。

`verification/evidence/raw/p1-installed-markdown-wrap.json` 记录默认隐藏 Skill 位置的实际离线安装、普通/列表/引用段落拒绝及保留内容的合行恢复，并复测了共享语料模块后的链接拒绝/恢复；23项文档门禁回归全部通过。多行Setext标题通过是源谓词的实际边界，不是标题写作规则的豁免。该证据尚不证明真实目标全仓覆盖、可信CI必跑、平台阻断或独立来源等价。




## 16. 仓库引用与网站投影

来源：deepseek-harness/scripts/verify-md-links.ts:1-254@687f282e 来源：deepseek-harness/docs/AGENTS.md:75-77@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:60-64@687f282e 来源：deepseek-harness/scripts/verify-md-links.spec.ts:1-29@687f282e 来源：deepseek-harness/scripts/verify-md-links.spec.ts:64-140@687f282e 来源：deepseek-harness/scripts/verify-md-links.ts:204-254@687f282e 来源：deepseek-harness/scripts/verify-doc-refs.ts:1-45@687f282e 来源：deepseek-harness/scripts/verify-mermaid.ts:1-106@687f282e 来源：deepseek-harness/scripts/markdown.ts:1-277@687f282e 来源：deepseek-harness/scripts/repo-files.ts:1-295@687f282e

<a id="reference-policy"></a>
<!-- mechanism-ids: documentation-repository-reference-policy, documentation-website-publication-manifest, documentation-website-link-projection, documentation-website-raw-llms -->

**源义务（仓库引用策略）。** `verify-repository-references` 拒绝维护文件中指向实际 Git 对象的提交号（7 到 40 位十六进制、且对象存在于本地对象库）和 `github.com/deepseek-harness` 组织 URL；只排除 `vendor/` 与 `.agents/notes/archived/`，并对 kit 仓库 URL 有一个精确例外。历史引用用 tag 或 PR 号。检测按“唯一前缀”解析对象，浅克隆中不存在的对象无法匹配，因此不能把绿门禁当成“没有提交号”。`deepseek-harness/scripts/verify-repository-references.ts:1-155@687f282e`

**执行边界。** 组织URL检查先使用`canonicalReferenceText`标准化，但提交候选仍直接在原始行上匹配`commitCandidate`再对照本地提交集合。不能把URL解码的抗绕过能力误记为提交号检查也先解码。`deepseek-harness/scripts/verify-repository-references.ts:46-54@687f282e`

**源义务（公开仓库链接）。** 维护文件不得出现旧仓库 `deepseek-ai/deepseek-harness-sdk`；检测会先解码 `%2F`、`%23`、`%3A`、HTML 实体等转义再判断，防止用编码绕过。它只排除归档来源，不禁止 `deepseek-harness/...` 简写。`deepseek-harness/scripts/verify-public-repository-links.ts:1-99@687f282e`

**源义务（具体术语）。** `verify-concrete-terms` 禁止在维护文件中使用 `provenance` 这个笼统词（按 `prove`+`nance` 构造匹配）；排除 `vendor/`、归档、发布快照 `docs/persistence-changes/releases/dsh-v*.schema.json`、历史格式 `docs/persistence-changes/historical-formats/v*.schema.json`/`.i18n.yaml` 及其生成区域；提示改用更具体术语。`deepseek-harness/scripts/verify-concrete-terms.ts:1-105@687f282e`

**目标执行入口。** 采用方在目标根目录声明 `.doc-gates/repository-references.json`，运行安装座的 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-repository-references.mjs`；也可用本包 `npm run verify-repository-references -- --root <目标根>`。维护者负责审核语料与三类规则，真实 CI 接入者必须使用普通检查而非诊断 `--list`。

```json
{
  "gitRoot": ".",
  "roots": ["."],
  "files": [],
  "excludePrefixes": [".agents/notes/archived", ".doc-gates/repository-references.json"],
  "commitIdentifiers": true,
  "forbiddenUrls": ["github.com/deepseek-harness", "deepseek-ai/deepseek-harness-sdk"],
  "allowedUrlLiterals": ["github.com/deepseek-harness/libreoffice-kit"],
  "bannedTerms": ["provenance"],
  "gitDiscovery": {
    "commitIdentifiers": "tracked-and-untracked",
    "forbiddenUrls": {
      "github.com/deepseek-harness": {"files": "tracked-and-untracked", "skipNul": false},
      "deepseek-ai/deepseek-harness-sdk": {"files": "tracked", "skipNul": true}
    },
    "bannedTerms": "tracked",
    "requiredAreas": ["AGENTS.md", "packages/", "docs/", "vendor/", ".agents/notes/archived/"]
  },
  "ruleExclusions": [
    {"rule": "commit", "pathPrefixes": ["vendor"]},
    {"rule": "url", "urlLiteral": "github.com/deepseek-harness", "pathPrefixes": ["vendor"]},
    {"rule": "term", "pathPrefixes": ["vendor"], "pathPatterns": [
      "^docs/persistence-changes/releases/dsh-v\\d+\\.\\d+\\.\\d+-(?:alpha|rc)\\.\\d+\\.schema\\.json$",
      "^docs/persistence-changes/historical-formats/v(?:0|[1-9]\\d*)\\.(?:schema\\.json|i18n\\.yaml)$"
    ]}
  ],
  "generatedRegions": [{
    "rule": "term",
    "pathPattern": "^docs/persistence-changes/historical-formats/v(?:0|[1-9]\\d*)(?:\\.zh)?\\.md$",
    "startMarker": "<!-- persistence-format-schema:start -->",
    "endMarker": "<!-- persistence-format-schema:end -->"
  }]
}
```

`gitRoot` 相对 `--root`，必须指向实际 Git 工作树根；`roots/files` 是相对目标根的字面路径，不接受 glob 或父目录。规则数组必须显式给出；空数组或 `commitIdentifiers:false` 是关闭对应规则，不得声称仍有该保证。例外按完整路径前缀排除语料；URL 允许项匹配完整仓库名称，可带 `.git` 或后续路径，不放行 `libreoffice-kit-other`。新项目应替换组织、旧仓库和禁用词为其自身政策，不盲抄来源组织。

**Git 发现模式。** `gitDiscovery` 一旦启用，必须逐条声明提交、术语及每个禁用 URL 的 `tracked` / `tracked-and-untracked` 范围，并逐 URL 声明 `skipNul`；缺项、未知 URL、错误值退出2。执行器使用 NUL 分隔的 `git ls-files --cached` 和 `--cached --others --exclude-standard`，再与 `roots/files` 字面范围求交：已跟踪文件不会因后来被 ignore 而漏扫，未跟踪且被 ignore 的新文件不会被纳入。已跟踪但已删除/变为非文件的发现路径跳过；显式声明的缺文件或缺根仍是配置错误。Git 模式的目标根与 `gitRoot` 必须是同一真实仓库根。省略该对象则保留递归显式语料模式，并默认仅 URL 规则跳过 NUL；不能把这个默认误称为源三个脚本的共同边界。

**必需仓库区域守卫。** 来源术语脚本要求跟踪清单含精确 `AGENTS.md` 及 `packages/`、`docs/`、`vendor/`、`.agents/notes/archived/` 的成员。目标以 `gitDiscovery.requiredAreas` 声明同等条件：不以 `/` 结尾的条目要求精确跟踪路径，以 `/` 结尾的条目要求该目录下至少一个跟踪成员。`AGENTS.md/child.md` 不能替代 `AGENTS.md`，单个名为 `packages` 的文件也不能替代 `packages/`。缺项退出2，报 `tracked-file discovery omitted a required repository area: <区域>`；补回并跟踪后恢复。路径先归一化，再拒绝重复、glob、`..`、空串和根目录 `.`。如来源一样，它检查完整Git跟踪清单（已删除但仍在索引中的路径仍满足存在条件），不替代语料范围或实际文件可读性。目标布局可用自己的确切区域，须评审核对完整性；省略此字段不启用守卫，不得据此宣称取得同等发现保证。

**按规则区分的例外与生成区。** 来源三个脚本各自排除不同范围：提交及组织链接排除 vendor 与归档；旧仓库链接只排除归档；术语还排除上例精确发布/历史 schema 和 pairing 文件及其生成区。`ruleExclusions` 支持三条规则之一、字面前缀/文件及 Unicode 正则 `pathPatterns`；URL 项可用 `urlLiteral` 只豁免某一个已声明禁用 URL，不影响其他 URL、提交或术语。没有 `urlLiteral` 则该项豁免全部 URL。历史版本必须用 `(?:0|[1-9]\\d*)`，不能用宽泛 `v[0-9]+` 放行 `v01`；中文 Markdown 可以有 `.zh`，schema/pairing 路径不因此有中文变体。`generatedRegions` 也可指定三条规则之一，但来源 schema 区只豁免术语。生成区仅在路径匹配、两标记各出现一次、分别独占整行且起在止前时豁免内部行。对 `<!-- name:start -->` / `<!-- name:end -->` 配对，还要求全文该 marker family 只出现两次；额外未知、大小写变体、分行或不完整标记均撤销豁免。配置规则、路径、正则或标记不可用退出2；内容标记缺失、重复或倒序不授予豁免，仍检查所有行。全局 `excludePrefixes` 同时放弃三条规则，不能用来替代按规则例外。上例表达固定来源路径政策；实际采用方必须核对自己的完整语料与适用政策，不从一个例子推断完整等效。

**拒绝与恢复。** 普通检查无违规退出0；检测到提交引用、禁用链接或词项退出1并定位文件/行；配置缺失、空语料、不可读文件或 Git 前提缺失退出2。改为可维护的 tag/PR、允许的完整 URL 或具体措辞后，重跑同一普通命令直到0。`--list` 即使列出违规也退出0，只供诊断，不能作为 CI 阻断。仅本地对象库存在且前缀唯一的 commit 才拒绝；blob、歧义前缀及浅历史中缺失的对象不算已识别提交，仍须完整历史前提。

**历史实测与证据边界。** 执行器读取文本或符号链接的存储目标，不跟随链接读外部文件。源组织链接与提交/术语扫描 NUL 载荷，旧仓库链接的读取路径跳过 NUL；上例逐 URL 声明保留此区别。`verification/evidence/raw/repository-references-git-discovery-installed.json` 保存物理隐藏安装座、模块hash、完整探针及18条真实顶层 npm 调用：新文件提交/组织拒绝，同文件跟踪后旧链接/术语拒绝，被忽略新文件排除但被强制跟踪后拒绝，NUL 分界、中文历史生成区、畸形标记、前导零路径、精确 schema 仅术语豁免及修复恢复。只复制模块与包清单，不是完整 Skill 安装。上一批独立复核为 correct（80独立探针，含8条安装座 npm 命令），只绑定上一批修复字节；本批Git发现/逐URL/精确历史扩展的独立复核为 correct：`_working/audit/reference-discovery-runtime-independent.json`，74条真实安装座 npm 探针全部符合预期且无偏差，17个冻结文件前后hash一致。这些历史观察不证明当前目标覆盖、源脚本自身必需仓库区域守卫、完整来源等效、平台必需检查、远端链接存活或语义用词质量。

`verification/evidence/raw/repository-references-required-areas-exact-before.json` 保存首版错误接受目录替代精确文件的真实失败；最终实现区分两种匹配。28项回归与10条物理隐藏安装座npm调用分别记录在 `verification/evidence/raw/repository-references-required-areas-exact-regressions.json` 和 `verification/evidence/raw/repository-references-required-areas-installed-current.json`。省略或空数组不启用守卫，不能据此声称取得同等发现保证；这些局部证据也不是全来源等效或真实CI证明。本批守卫待独立复核，上一批74项正确结论不覆盖新增字节。来源：deepseek-harness/scripts/verify-concrete-terms.ts:52-62@687f282e

**策略文件自身。** 示例与实际策略文件都包含禁用URL字面量；若语料覆盖策略文件（如 `roots: ["."]` 且未排除 `.doc-gates`），普通检查会拒绝策略文件自身并退出1（独立复核控制记录 `.doc-gates/repository-references.json:12/24/44`）。实际采用方把策略路径加入 `excludePrefixes` 或收窄 `roots`，使声明与被检正文分开；整树示例必须配正确排除才能直接使用。

**源义务（发布清单）。** 发布面由`website/docs.ts`的显式清单控制，不从文件系统自动推断。清单选择人工页及部分生成参考；生成器拥有生成内容，清单拥有发布选择。移动源、路由、语言、对侧及别名要同步维护，不能靠手改生成站补洞。`deepseek-harness/website/AGENTS.md:1-23@687f282e`、`deepseek-harness/website/docs.ts:403-428@687f282e`

**源义务（链接投影）。** 已存在的仓库相对目标若已发布则映射站点路由，否则回退配置的公开仓库ref；`DOCS_REPOSITORY_REF`缺省为`master`，不是不可变版本绑定。实际发布也故意选`master`：公开仓库历史不同、只保留最近的tag，追随旧tag会使旧部署链接失效；代价是旧页面的源链接可随分支前移。图片可由资源放置回调处理；无法解析的相对目标失败，站点片段另查。`rewriteMarkdown`跳过外部/绝对URL及空路径，不是自动拒绝所有绝对链接。`deepseek-harness/scripts/project-doc-site.ts:30-38@687f282e`、`deepseek-harness/scripts/project-doc-site.ts:134-190@687f282e`、`deepseek-harness/.github/workflows/docs-pages.yml:23-31@687f282e`、`deepseek-harness/scripts/verify-doc-site-fragments.ts:1-181@687f282e`

**源义务（raw 与 llms）。** `rawDocsPages` 允许的页面生成 `.md` 原始孪生文件，根路由也提供 canonical raw；`llms.txt` 从同一清单生成；开发中间件在重写前提供 raw；预构建不得覆盖手写页面；合成片段也过链接门禁。`deepseek-harness/website/docs.ts:123-591@687f282e`、`deepseek-harness/website/build.ts:1-86@687f282e`

**操作步骤（网站改动）。** 显式选择发布页，原子维护源与清单；运行`pnpm run docs:check`并核对生成物。引用未发布目标时确认仓库路径存在、所配置的公开ref可访问且符合该项目发布策略；不必为每个被引用目标新建站点路由。不可变引用是额外要求，需显式提供可用的公开不可变ref并验证，不能从默认`master`推断。**失败处理。** 根据缺目标、片段或路由诊断修源/清单，不手补生成站。**例外。** 内部页可不发布而被公开页通过配置ref的源链接引用；这不授权自动发布私有或草稿内容。

**迁移设计。** 采用方若不用 VitePress，仍应保留“发布清单是唯一入口”和“链接投影单向转换”两点。不要用文件系统 glob 自动发布，否则草稿、归档和内部页会泄露。

## 17. Agent Note 生命周期

来源：deepseek-harness/scripts/verify-repository-references.ts:1-155@687f282e 来源：deepseek-harness/scripts/verify-public-repository-links.ts:1-99@687f282e 来源：deepseek-harness/scripts/verify-concrete-terms.ts:1-105@687f282e 来源：deepseek-harness/website/AGENTS.md:1-23@687f282e 来源：deepseek-harness/website/docs.ts:1-123@687f282e 来源：deepseek-harness/scripts/project-doc-site.ts:1-263@687f282e 来源：deepseek-harness/scripts/project-doc-site.ts:263-577@687f282e 来源：deepseek-harness/scripts/verify-doc-site-fragments.ts:1-181@687f282e 来源：deepseek-harness/website/docs.ts:123-591@687f282e 来源：deepseek-harness/website/build.ts:1-86@687f282e 来源：deepseek-harness/scripts/project-doc-site.ts:473-577@687f282e

<a id="agent-notes"></a>
<!-- mechanism-ids: documentation-agent-note-lifecycle, documentation-agent-note-format-gates -->

**源义务（何时写）。** 只有代码、测试和现有文档无法解释的持久决策理由才写 Agent Note；机械/局部改动豁免，包括局部 UI 表现和交互。已有所有者笔记时更新它，不建重复笔记。提议重大未来工作放 `proposed/`；已决策放 `implemented/`；被拒绝的提案放 `rejected/`。`deepseek-harness/.agents/notes/README.md:65-75@687f282e`

**源义务（路径与分类）。** 路径 `{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`；生命周期为 `proposed`、`implemented`、`rejected`；类为 `feature`、`bug-fix`、`simplification`、`architecture`、`process`、`testing`。`architecture` 关于交付源码结构，`process` 关于工具/政策/流程；`refactor` 不设类，归入 `simplification`。不要新增 `INDEX.md`。`deepseek-harness/.agents/notes/README.md:5-63@687f282e`、`deepseek-harness/scripts/agent-note-tree.ts:1-83@687f282e`

**源义务（格式）。** 第 1 行 `# Agent Note: <title>`，第 2 行空，第 3 行状态（`Status: proposed` / `Status: implemented` / `Status: rejected — <one line>`），第 4 行空。正文首节必须是 `## Problem`。`proposed` 还须 `## Proposal`、`## Alternatives considered`、`## Acceptance criteria`、`## Risks`；`implemented` 须 `## Decision`、`## Alternatives considered`、`## Consequences`，禁止 `## Proposal`、`## Plan`、`## Migration plan`、`## Acceptance criteria`；`rejected` 须 `## Proposal`，保留提案时结构。每个笔记必须有 `## Alternatives considered`；2026-07-05 前无法重建替代方案的旧笔记可用精确祖父注释替代。`deepseek-harness/scripts/verify-agent-note-format.ts:1-86@687f282e`、`deepseek-harness/.agents/notes/README.md:77-125@687f282e`

**源义务（移动与更新）。** 生命周期移动必须同改状态行并满足目标骨架；`proposed`→`implemented` 要把 Proposal 改写成现在时 Decision，把验收/风险折入 Consequences 或 Testing；`implemented` 笔记必须随代码改名、路径、默认值更新事实，但不得改成另一个决策。被完全取代的笔记可合并后删除，删除前保留所有独有理由、替代方案、后果、验证和覆盖缺口，并修复入站链接；删除时英文/中文/记录三文件一起删。`deepseek-harness/.agents/notes/README.md:75-105@687f282e`、`deepseek-harness/.agents/notes/implemented/AGENTS.md:1-13@687f282e`

**迁移设计。** 采用方必须建立触发判定，而不是按“有没有决策记录传统”决定是否记录：这个决定会被重新争论吗？替代方案会再次出现吗？代码能表达取舍吗？三者有“是”才建笔记。没有传统不是省略理由；不要用笔记代替 ADR 模板堆砌，笔记的价值在“为什么没选另一个”。

## 18. 归档与冻结

来源：deepseek-harness/.agents/notes/README.md:5-75@687f282e 来源：deepseek-harness/scripts/agent-note-tree.ts:1-83@687f282e 来源：deepseek-harness/.agents/notes/README.md:77-125@687f282e 来源：deepseek-harness/scripts/verify-agent-note-format.ts:1-86@687f282e 来源：deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e

<a id="archive"></a>
<!-- mechanism-ids: documentation-agent-note-archive -->

**源义务（何时归档）。** 只归档已实现、决策已完成、理由不太可能指导未来工作、但仍有历史价值的笔记。若替代方案、所有权边界、负向保证、持久/线格式语义、安全规则或重新引入条件仍有用，保持活跃。`proposed` 永不归档；过时提案应拒绝。拒绝笔记只在能阻止可信错误时保留。`deepseek-harness/.agents/notes/README.md:47-63@687f282e`

**源义务（归档变更）。** 移动完整英文/中文/记录三件套到 `archived/{class}/...`；保留 `Status: implemented`；在两侧状态行正下方插入相同 `Archived: YYYY-MM-DD`（不早于源文件名日期）；sidecar 每个归档文件一行 `<filename>.md: <40-hex Git blob>`，英文/中文两侧都必须是当前 blob 哈希，不能沿用活动记录的节哈希；重录记录；修复或删除入站链接。这是唯一允许的归档内容变更。归档后永久冻结：不编辑、不翻译、不重排、不修复、不移动、不删除，也不作为当前行为权威。`deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e`、`deepseek-harness/scripts/archived-agent-notes.ts:1-204@687f282e`

**源义务（封印）。** `archived/manifest.json` 记录每个冻结文件的 sha256 内容哈希；普通校验拒绝未封印新增、变更或缺失、不完整三件套、缺失/未知类目录和无效归档元数据。写入用 `pnpm run verify-archived-agent-notes --write`；CI 用受信任的变更前提交作基线（`DSH_ARCHIVE_BASE_REF`），本地默认 `HEAD`；校验读取基线 manifest 并只允许清单列出的精确新增/变更。`deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e`、`deepseek-harness/scripts/archived-agent-notes.ts:1-204@687f282e`

**迁移设计。** 采用方的归档清单必须保存“路径→哈希”并纳入代码评审；不要把归档目录当作可随意修补的旧文档。只读权限和“归档目录禁止修改”的 CI 路径过滤只能作为补充，不能替代哈希封印；若目标平台无法提供哈希清单，记录该机制非激活及重新激活条件，不能声称冻结等价。

## 19. 升级指南

来源：deepseek-harness/scripts/archived-agent-notes.ts:1-204@687f282e 来源：deepseek-harness/scripts/verify-archived-agent-notes.ts:1-115@687f282e

<a id="upgrade-guide"></a>
<!-- mechanism-ids: documentation-upgrade-guide -->

**源义务（触发）。** 只有当现有用户必须修改配置、代码或数据才能继续时，才写升级指南；普通发布说明、内部重构和无需动作的变更不写。`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:10-27@687f282e`

**源义务（位置与格式）。** 路径 `docs/upgrade-guide/v<semver>/<kebab-item>/guide.md` 及 `guide.zh.md`；无目录索引。frontmatter 恰为 `kind: upgrade-guide` 与非空 `description`。英文节为 `## Change`、`## Migration`，上限 500 词；中文节为 `## 变更`、`## 迁移`，无词数上限。先说明旧/新行为和受影响者，再给可执行的迁移步骤与验证。`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e`、`deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e`

**源义务（维护）。** 版本目录一经发布不重写历史；后续修正用新版本/新条目；同一破坏面变更时更新对应指南并跑 `verify-upgrade-guides`。指南中的链接用相对链接，中文侧按配对合同维护。`deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e`

**迁移设计。** 采用方可以不按版本分目录，但必须保留“一个破坏面一个可执行条目”和“迁移步骤含验证”。不要把变更日志改名为升级指南；没有用户动作的条目应删除。

## 20. Skill 调用元数据

来源：deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e 来源：deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e 来源：deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e

<a id="skills"></a>
<!-- mechanism-ids: documentation-skill-invocation-metadata -->

**源义务。** 每个 Skill 的 frontmatter `disable-model-invocation` 与其 `agents/openai.yaml` 的 `policy.allow_implicit_invocation` 必须表达同一策略；手动专用 Skill 还必须 `user-invocable: true`，否则用户也无法调用。检查器同时验证 frontmatter 形态、目录名与名称一致、描述非空和策略配对。`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e`

**迁移设计。** 采用方若没有 `openai.yaml`，至少在一个机器可读清单中声明“可隐式/仅手动”，并让生成器或检查器校验 frontmatter 与清单一致。**证据边界。** 该检查只验证元数据一致，不验证 Skill 内容质量或运行时发现顺序。

## 21. Session 格式状态记录

来源：deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e

<a id="session-status"></a>
<!-- mechanism-ids: documentation-session-format-status -->

**源义务。** `docs/session-format-status.md` 同时记录检查点写入版本、已完成兼容基线、最新发布版本与证据 tag。写入版本由代码常量拥有；发布记录只声明已发布事实。`latestReleasedVersion` 必须是非负安全整数且不得超过当前写入版本；`evidenceTag` 必须匹配 `dsh-v<semver>` 形式且不含 URL 定界符；正文必须同时出现该 tag 和 `packages/core/session/src/types.ts` 路径作为证据。`deepseek-harness/scripts/doc-standard.spec.ts:162-299@687f282e`、`deepseek-harness/docs/session-format-status.md:1-50@687f282e`

**源义务（双语与唯一性）。** 英文/中文各恰好一个 ` ```yaml session-format-release ` 记录，字段恰为 `latestReleasedVersion` 与 `evidenceTag`；两侧记录相等。重复、未闭合、多文档、额外字段、错误类型都失败。`deepseek-harness/scripts/doc-standard.spec.ts:214-299@687f282e`

**操作步骤。** 格式升级先改代码常量和相邻目录，不提前推进发布记录；产品发布后确认 tag 与 tagged writer，再同改两侧记录和证据行；后续发布携带同一格式时不改记录；开发主干永不降低版本。**证据边界。** 这是无网络检查，只证明记录结构、双语一致和不超前于写入版本；它不查询 GitHub，也不证明记录是最新发布。

**迁移设计。** 只有项目事实类别中确实没有持久化格式时，才能非激活；一旦有，必须实现完整记录：写入版本常量、发布基线/最新 tag、证据路径、双语一致和“不超前于写入版本”检查。不要用一个布尔 `released` 代替可核验证据。

## 22. 门禁组合与执行顺序

来源：deepseek-harness/scripts/doc-standard.spec.ts:162-299@687f282e 来源：deepseek-harness/docs/session-format-status.md:1-56@687f282e

<a id="gate-composition"></a>
<!-- mechanism-ids: documentation-gate-composition -->

**源义务（快速集）。** `pnpm run test:docs` 运行 `doc-quick`：所有标记 `quick` 的文档门禁，包括 `verify-package-readme-summaries`、`verify-package-readme-model-experience`、`verify-package-readme-limitations` 与 `vitest run scripts/doc-standard.spec.ts`；排除 `doc-typecheck`，也不构建网站。适合编辑循环，不是合并前完整证据。`deepseek-harness/package.json:130@687f282e`、`deepseek-harness/scripts/run-gates.ts:850-862@687f282e`、`deepseek-harness/scripts/run-gates.ts:872@687f282e`、`deepseek-harness/scripts/run-gates.ts:881-883@687f282e`

**源义务（完整集）。** `pnpm run doc-sync` 运行完整文档门禁：`doc-typecheck`、网站构建、生成图/CLI/链接/类型等价/Cordis 目录/工作流 guest/Mermaid/配对/换行/客户端目录/导出 JSDoc/工具/配置/插件包/依赖/持久化目录与历史/发布引用/具体术语/文档引用/子系统页/包路径/README 三类/Agent Note 三类/Skill 元数据/翻译提示词/预算/升级指南/文档标准测试/网站投影与片段/包限制。`deepseek-harness/scripts/run-gates.ts:805-875@687f282e`

**源义务（网站专用）。** `pnpm run docs:check` 是网站投影测试、构建和片段检查的聚焦入口；`pnpm run docs:build` 只构建并验片段。它不等于 `doc-sync`，不能替代文档类型/配对/引用等检查。`deepseek-harness/package.json:134-137@687f282e`

**操作步骤。** 编辑时跑受影响单门禁；提交前跑 `pnpm run doc-sync`；CI 运行同一组（或更广的 `check-all`）。若某门禁不可用，必须报告不可用，而不是用“已人工检查”替代自动保证。**完成信号。** 命令退出 0 且输出覆盖预期文件数/范围；对生成器还要看计数未意外缩小。**失败处理。** 先修根因；不要通过扩大排除、降低预算或删除测试来变绿。

**迁移设计。** 采用方应把门禁分成“编辑循环、提交前、CI”三层，但三层的规则来源必须相同。为每个门禁记录：检查什么、不检查什么、失败如何修。**证据边界。** `doc-sync` 通过只证明该组检查通过；远程 CI 是否真正阻塞合并仍需分支保护/工作流证据。

## 23. 迁移到新项目

来源：deepseek-harness/package.json:104-140@687f282e 来源：deepseek-harness/scripts/run-gates.ts:805-883@687f282e

<a id="migration"></a>

**本节的地位。** 这里是文档域首组可直接消费的**迁移决定**（迁移设计），不是自动接入器、不是所有项目的封闭义务清单，也不把维护者的来源判断改写成消费者的实施许可。维护者负责源义务→保留项/例外→分类→参数化→机械工具能力的判断；采用方负责目标真实事实、现有 owner/语料/命令/权限、参数值、运行与报告。参数是可配置值，不是可取消的义务；任何一项都不会因为“不在本组”或“目标没有现成工具”而消失。

**采用流程（普通首次或渐进）。** ①核实目标事实：读目标现有规则、唯一状态 owner、工具链、脚本和 CI，实际运行相关入口；区分已有事实、本次将创建的文件与未知项，事实不是提议。②套用已发布决定：对每个决定填写目标参数与 owner，判断触发是否成立，选用本文已交付的真实入口；本组未列的义务按其章节条件继续核对。消费者不需要为每条来源重做提取，也不需要为每个语义单元新开上下文。③接受：由项目负责人或独立评审按目标事实核对触发、保留义务、参数/owner、入口、权限和拒绝/恢复；接受记录绑定决定、目标事实和评审者。④实施与回归：在目标既有入口落地，保留原有行为和验收；正常、拒绝、恢复在同一入口观察。接受不代表实施完成，元数据齐全也不是许可。

**参数化。** 源仓库的路径、包前缀、预算数字、门禁名、语言对和网站框架都是参数。替换参数或实现必须保留机制效果；例如“每段一行”保留，格式器实现可替换；“生成参考不可手改”保留，生成器实现可替换。

**状态判据（全组共用）。** **已落实**要求触发事实已登记、义务有 owner 和真实入口、入口可运行，且正常/拒绝/恢复证据已记录；入口已接入但验收尚未复验，或触发后入口尚未接入，都是**未落实**（对应 Skill 的“已接入且待复验”“待接入”）；缺依赖、权限、语料或 CI 接入，是**阻塞**（“触发但阻塞”），须写明缺什么与解除条件；只有该事实类别在项目中确实不存在时才记**不适用**，并写重新激活条件。缺工具、缺凭据、未接入 CI、仓库或页面规模小都不是不适用。

**来源核对边界。** 本组核心义务定向复读了固定提交中的 `deepseek-harness/docs/AGENTS.md:7-59,75-77@687f282e`、`deepseek-harness/AGENTS.md:175@687f282e`、`deepseek-harness/package.json:104-140@687f282e`、`deepseek-harness/scripts/run-gates.ts:805-883@687f282e`、`deepseek-harness/scripts/verify-doc-budgets.ts:1-58@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:34-73@687f282e` 与 `deepseek-harness/scripts/verify-md-wrap.ts:40-86@687f282e`；其余决定沿用各小节已登记的坐标，不声称完整源审核。发现来源支持不足、相互冲突或工具行为与描述不符时，带具体坐标交回维护者；影响验收的未决项保持阻塞，不能用改弱义务或断言通过来收场。

### 23.1 事实归属与文档分层

**触发。** 新增、搬迁、合并或重写人类文档；新增事实类别；发现同一事实存在两处权威叙述。纯代码注释的局部修正不触发分层迁移，但仍受[§7](#comments-jsdoc)约束。

**保留的义务与例外。** 每个事实只有一个家：所有者层级、代码或生成器；别处只链接，不手抄目录、JSDoc、测试/包/状态清单或版本状态。范围内每篇文档归为教程或参考；作用域由主题加树位置固定，只描述自己的主题，直接子主题只写目的、职责和高层行为，更低层细节链接到 owning descendant。每类文档写“这里放什么/不放什么”；历史理由、事故、操作步骤、类型定义、包合同、常驻命令和生成参考各自归层，不能因规模省略类别。生成参考的英文真源与区域不得手改，中文侧按配对/生成更新。`deepseek-harness/docs/AGENTS.md:7-40@687f282e`

**消费者参数与 owner。** 在目标仓库提供“事实→所有者→检查”表，列出目录/模板和每类的唯一 owner（文件、生成器、清单或人审记录）；事实类别按目标实际枚举，不能只抄本组五项。新事实先补 owner，再写文档。

**机械入口与限制。** 没有自动判定“归属正确”的工具；可机械部分只有链接（§23.4）、生成区域标记（[§14](#generated-regions)）等。层级、类别和重复叙述由评审负责。

**语义评审。** 核对每个事实是否只有一处权威、别处是否只有链接；新页能否回答读者触发点、第一段看到什么、下一层去哪。发现两处矛盾叙述时，先判定 owner，删除或降级另一处为链接，再补能拒绝重复的检查（若可机械化）。

**正常、拒绝与恢复。** 完成信号是所有事实类别都有 owner、抽查事实在唯一 owner、重复处已链接。拒绝信号是同一事实两处权威或手抄生成内容；恢复为判定 owner、降级另一处、必要时新增重复叙述检查。只有目标确实没有该事实类别时才记不适用。

### 23.2 条件性状态 owner

**触发与保留义务。** 状态协议属于迁移设计，完整触发条件与唯一owner复用规则由[Skill 3.0–3.1](../SKILL.md#3-改动型任务走同一循环)和[交接的连续会话补充](agent-workflows.md#aw-11)拥有：用户要求初始化、跨会话继续/暂停/交接、压缩前保存，或同一目标确需多个会话/另一位执行者接续。没有这些触发的单会话采用不新建状态文件，初始化也不自动扩展为完整采用。已有状态、nextAction和完成声明须按当前请求与仓库事实复核，不创造执行许可。

**消费者参数与 owner。** 只登记既有 owner 的路径与格式（或明确不启用状态协议）、记录者与复核者；字段、写入/读取时机和完成信号按所链接协议与既有 owner 执行，本节不复述。

**机械入口与限制。** `node .agents/skills/harness-project-governance/bin/governance.mjs status` 只对 `.governance` 布局检查元数据是否齐备，不执行 `policy.checks`，也不判断 `nextAction` 是否已撤销或归档项是否仍现役。元数据齐全不是执行许可，`phase: complete` 不证明交付已完成。

**语义评审。** 核对现有 owner 是否真正权威、状态与仓库事实是否一致、未完成项是否有 owner、下一命令能否被独立执行。

**正常、拒绝与恢复。** 完成信号是唯一 owner 可读、下一命令可执行、当前已撤销动作不在队列。拒绝信号是双状态源、状态与仓库冲突后仍继续，或把 status 绿灯当完成。恢复为以仓库和当前请求修正记录，保留原失败记录，不追认原状态。没有所链接Skill §3.0的任一启用条件时不启用该协议，这不是“治理不适用”。

### 23.3 常驻文档预算

**触发。** 修改预算清单内的常驻文档，或新增必须常驻上下文的规则。未列入预算的层级不触发此计数器，但仍由评审治理，不是自动豁免。

**保留的义务与例外。** 根据文档职责与目标工作上下文确定受预算文件，不照搬源清单或给全部文档套同一阈值；超限按“迁移到其他层→压缩→有理由提高上限”处理。上限是护栏不是缩减目标：在目标或以下时至少保留 5% 余量；高于目标时冻结上限，直到迁移或压缩回到目标以下；只有文档仍有空间时才降低上限。源数值（如 root 2080、architecture 2400、子树 600 等）是源事实，不是所有采用项目的默认阈值。未列入预算的层级记录理由、owner 和重新激活条件。`deepseek-harness/docs/AGENTS.md:51-59@687f282e`、`deepseek-harness/scripts/verify-doc-budgets.ts:1-58@687f282e`

**消费者参数与 owner。** 非空 `.doc-gates/doc-budgets.json`，键为常驻文档的仓库相对路径，值为评审后的正整数上限；同时登记未预算层的 owner/理由。预算 owner 与内容 owner 可以不同，但都要写清。

**机械入口与限制。** 从目标 cwd 执行 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-doc-budgets.mjs`；异地可用 `--root <目标> --config <仓库相对清单>`。普通模式在超限、清单指向的缺失文件或非法上限时退出 1；配置缺失/不可读/非对象/空清单或调用无效退出 2。`--list` 只列用量并退出 0，即使存在 OVER/MISS/BAD，因此不能用于 CI 阻断。它只统计空白分隔词数和清单内文件，不判断内容质量，也不阻止新增未列入清单的膨胀文档。

**语义评审。** 判断文档是否必须常驻、超限内容应迁移到哪一层、提高上限的理由、5% 余量是否保留，以及未预算层的理由与重新激活条件。

**正常、拒绝与恢复。** 完成信号是清单非空且覆盖已决定纳入预算的受约束文档、普通模式在真实语料上退出 0、未预算层有 owner/理由。拒绝与恢复：制造真实超限或缺失条目应退出 1，按迁移/压缩恢复后退出 0；提高上限须有理由，不能靠放宽上限变绿。依赖或配置不可用导致的退出 2 是阻塞，不是通过或不适用。

### 23.4 完整 Markdown 语料：链接、锚点与换行

**触发。** 任何 Markdown 链接、标题或文件移动；受检 Markdown 的散文编辑；归档移动。源码注释中的文档路径、Mermaid 语法和网站投影各由[§16](#reference-policy)等小节拥有，不由此决定替代。

**保留的义务与例外。** 当前文件用相对 Markdown 链接，历史引用用 tag 或 PR 号；不写 `/docs/...` 之类站内绝对路由，该禁令只由写作评审执行。锚点按 GitHub slug 规则匹配，显式 `<a id="...">` 也算目标，标题改名视为接口变更并须同改入站引用。每个散文段落占一个物理行；自动谓词只拒绝 GFM AST 中跨行的 `paragraph`（含列表/引用内段落），标题、围栏、表格、HTML 和代码注释不在该谓词内，标题单行仍是评审义务。冻结归档源不作为扫描语料，但活跃页指向归档的目标/锚点继续验证；生成区域内的 prose 不是一概豁免。链接与换行共享同一组固定版本解析器和语料模型，但发现配置独立。`deepseek-harness/docs/AGENTS.md:42,75-77@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:34-73@687f282e`、`deepseek-harness/scripts/verify-md-wrap.ts:40-86@687f282e`

**消费者参数与 owner。** 分别为 `.doc-gates/markdown-links.json` 与 `.doc-gates/markdown-wrap.json` 声明真实语料：`roots`（递归目录）、`files`（单文件）、`archiveRoots`（只跳过源扫描；缺省为源归档路径，目标更换归档位置时同步）。纳入全部适用文档、包说明、指令、技能文档和 expected Markdown 输出，不以示例路径代替完整语料；归档树不存在时省略相应字段，不伪造目录。

**机械入口与限制。** 先按[§15.1](#markdown-gates)准备固定解析器依赖，再从目标 cwd 执行 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-md-links.mjs` 与 `node .agents/skills/harness-project-governance/tools/doc-gates/verify-md-wrap.mjs`；异地可用 `--root/--config`。成功退出 0，缺目标/`.md` 锚点或跨行段落逐项输出 `file:line` 并退出 1，配置、语料、解析器或调用不可用退出 2；两个程序只检查不重写。链接程序跳过外部 URL、协议相对地址和根绝对路径，因此 `/docs/...` 误用抓不住；非 Markdown 片段交给渲染器，不判锚点。

**语义评审。** 核对语料是否完整、链接文字与目标语义是否相符、标题是否单行、是否依赖站内绝对路由、归档外的出站链接是否仍应维护。

**正常、拒绝与恢复。** 完成信号是两个执行器在声明的完整语料上退出 0，且正常、拒绝、恢复都观察到。拒绝与恢复：制造断链或跨行段落应退出 1 并给出 `file:line`，精确恢复后退出 0。解析器/依赖无法安装或配置不可读导致的退出 2 是阻塞，记录解除条件；不得把缺依赖记成“没有触发面”，也不得用局部语料通过冒充全量。

### 23.5 本地与 CI 同入口

**触发。** 任何文档改动、提交前、CI 或发布前；新增或变更文档检查。纯代码改动仍可能触发 JSDoc、类型等其他域检查。

**保留的义务与例外。** 编辑循环、提交前和 CI 三层可以不同宽度，但规则来源必须相同；quick 是完整集的子集，不能替代完整集；网站专用入口不能替代完整文档组。本地脚本可被绕过，只有 CI 必需检查与分支保护才是强制。分别记录“检查器存在”“CI 运行”“合并被阻塞”三种证据，不能混为一谈。失败先修根因，不通过扩大排除、降低预算或删除测试来变绿；门禁不可用时报告不可用，不用“已人工检查”替代自动保证。`deepseek-harness/package.json:104-140@687f282e`、`deepseek-harness/scripts/run-gates.ts:805-883@687f282e`

**消费者参数与 owner。** 复用目标已有顶层入口（脚本、`verify.ps1`、`npm run check` 等），或使用 `node .agents/skills/harness-project-governance/bin/governance.mjs check <repo> --policy <仓内清单>`；新的初始化才用默认 `.governance/policy.json`。清单只登记命令，不复制需求或进度。另需 CI 工作流、分支保护/required checks 的配置权限与负责人。

**机械入口与限制。** 同一命令应在本地和 CI 调用。`check` 只按清单顺序执行命令并报告退出码：策略缺失/无效/检查为空退出 2，任一命令失败退出 1；它不推导检查、不证明语义完整、不证明平台强制。工作流文件存在不等于远端已配置；没有授权不改生产保护或凭据。

**语义评审。** 核对 quick 子集是否覆盖本组决定、每条触发义务是否有入口、失败诊断是否指向规则 owner、是否有入口被排除后仍宣称完整。

**正常、拒绝与恢复。** 完成信号是同一命令在本地与 CI 覆盖全部已声明检查、正常退出 0，且真实义务破坏在同一入口被拒绝、精确恢复后通过。拒绝信号是靠排除门禁、降低预算或删除断言变绿；恢复为修根因后在原入口复跑。缺远端权限时保留平台层“未验证”的阻塞状态，不把工作流文件当强制。没有 CI 平台时记录本地入口与重新激活条件，不能宣称合并阻断。

**其余按事实触发的条件。** 本组不是封闭清单：文档类型/页面骨架（[§4](#authoring-quality)）、包 README 合同与三类门禁（[§5](#package-readme)、[§6](#prose-budgets)）、注释与导出 JSDoc（[§7](#comments-jsdoc)）、双语三文件与配对/翻译（[§8](#i18n-pairing)至[§11](#translation-prompt)）、类型等价与可编译示例（[§12](#code-equivalence)）、生成参考与共享区域（[§13](#generated-references)、[§14](#generated-regions)）、仓库引用与网站投影（[§16](#reference-policy)）、Agent Note/归档/升级指南（[§17](#agent-notes)至[§19](#upgrade-guide)）、Skill 元数据与 Session 格式状态（[§20](#skills)、[§21](#session-status)），被目标事实触发时按对应小节保留全套条件、例外、参数与评审。没有工具、没有权限或尚未接入 CI 是阻塞，不是没有触发；只有事实类别确实不存在才不适用。

**采用完成。** 每项已触发义务均须有 owner、真实检查或评审入口及所需的正常/拒绝/恢复证据，所有影响当前验收的未落实、阻塞或争议已解决；真正不适用项有事实依据与重新激活条件。最后按[Skill采用验收](../SKILL.md#3-改动型任务走同一循环)核对冷接续、实际接入层级及准确原交接，不能仅因缺口已列理由而报完成。检查器存在、单次绿灯、页面数量或引用计数都不单独证明语义采用。

## 24. 已知限制与未决问题

<a id="limits"></a>

以下均来自源仓库实际状态，不是迁移建议。采用方不应把源门禁的绿色输出解释为超过其覆盖范围的保证。

1. **行对齐不是通用门禁。** `dsh-doc/references/metadata-links-i18n.md` 和 `dsh-doc` 检查步骤要求“精确物理行数”，但 `verify-translation-pairing` 的结构签名只比较标题层级、列表种类/项数、表格行列、代码块和链接语义目标，不比较行数；`doc-standard.spec` 也只对参考 README 做精确行断言。因此“两侧行行对应”是评审/模板要求，不是全仓自动保证。`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:66-70@687f282e`、`deepseek-harness/scripts/translation-pairing.ts:99-170@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:443-456@687f282e`

2. **预算目标与执行上限不同。** `docs/AGENTS.md` 的目标是 `architecture.md` ≤ 2400、`testing.md` ≤ 1300、`examples/AGENTS.md` ≤ 310；清单上限分别为 2410、1350，且没有 examples 条目。散文明确区分目标与上限，并规定高于目标时冻结上限，所以不能仅从数字差异断言目标过时或规范矛盾。门禁只按清单检查词数、正整数上限与列入文件存在性，不自动检查目标、5% 余量、升限理由或未列文件的内容增长；这些评审义务仍保留。`--list` 无论有无超限都只是退出 0 的报告模式。`deepseek-harness/docs/AGENTS.md:51-63@687f282e`、`deepseek-harness/scripts/doc-budgets.manifest.json:1-8@687f282e`、`deepseek-harness/scripts/verify-doc-budgets.ts:23-55@687f282e`

3. **风格样例含旧机制描述。** `style-samples.md` 的“一致性记录”样例仍说系统采用文件 blob hash、记录模板为 `Foo.md`/`Foo.zh.md`/`Foo.i18n.yaml`；当前活动配对记录是随内容变化的节键哈希（16 位十六进制），归档校验才要求 40 位 Git blob 哈希。样例是校准材料而非规则源，但直接照抄会得到旧机制。`deepseek-harness/docs/i18n/style-samples.md:53-63@687f282e`、`deepseek-harness/scripts/translation-pairing-record.ts:79-243@687f282e`、`deepseek-harness/scripts/archived-agent-notes.ts:140-204@687f282e`

4. **归档 sidecar 与活动 sidecar 哈希格式不同。** 活动记录写 16 位节键哈希；归档校验要求 40 位 blob 哈希。归档时的“重录”必须使用归档序列化，不能直接跑活动 `--write` 后假定归档通过。`deepseek-harness/scripts/translation-pairing-record.ts:79-243@687f282e`、`deepseek-harness/scripts/archived-agent-notes.ts:140-204@687f282e`

5. **生成页语言切换行靠硬编码清单。** 生成英文页不写切换行，是因为 `verify-translation-pairing.ts` 中有一份生成源清单；新增生成页若忘记加入，门禁会要求切换行，生成器却不会生成。该耦合没有从生成器元数据自动推导。`deepseek-harness/scripts/verify-translation-pairing.ts:99-140@687f282e`

6. **根绝对链接不被检查。** `verify-md-links` 跳过 `/...` 形式的站内绝对路径，因为它们属于网站路由；但 GitHub 上这类链接不可解析。写作规范要求相对链接，检查器无法替你抓住所有误用。`deepseek-harness/scripts/verify-md-links.ts:45-73@687f282e`

7. **提交号检测依赖本地对象库。** 浅克隆或缺失对象时，`git cat-file` 无法确认某个十六进制串是提交，因而可能漏报；这是代码注释承认的信任边界。`deepseek-harness/scripts/verify-repository-references.ts:30-105@687f282e`

8. **类型等价只覆盖登记的粘贴。** 未登记的新类型不会被要求文档化；`verify-subsystem-pages` 只检查组 README 是否链接子系统页或给出豁免，不证明每个类型都有页面。源规范明确说“未文档化的新类型不会被抓住”。`deepseek-harness/docs/AGENTS.md:43@687f282e`、`deepseek-harness/scripts/verify-subsystem-pages.ts:1-137@687f282e`

9. **README 内容检查只扫英文，但 kind/骨架检查覆盖双语。** Summary、Model Experience 和限制节的门禁读取英文 `README.md`；中文 `README.zh.md` 不重复“100 词”“精确短形式”或限制节标题/bullet 检查。`doc-standard.spec` 的 frontmatter/kind 与包骨架检查则按 glob 同时覆盖英文和中文 README，因此不能概括为所有 README 检查只读英文。配对门禁只证明结构与逐节哈希，不证明中文语义等价。`deepseek-harness/scripts/verify-package-readme-summaries.ts:1-77@687f282e`、`deepseek-harness/scripts/verify-package-readme-model-experience.ts:1-638@687f282e`、`deepseek-harness/scripts/verify-package-readme-limitations.ts:1-95@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:18-24@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:154-160@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:348-356@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:401-406@687f282e`

10. **归档外链不检查。** 归档源（包括其出站链接）被文档门禁跳过；活跃文档可以有意链接进归档，但归档自身不再维护链接。`deepseek-harness/scripts/verify-md-links.ts:45-73@687f282e`、`deepseek-harness/docs/i18n/README.md:45-69@687f282e`

11. **提示词/翻译质量不能由结构门禁证明。** 配对门禁证明结构与记录一致，提示词门禁证明模板形态；两者都不证明译文忠实、术语正确或示例可运行。需要人工/模型审阅和真实运行证据。`deepseek-harness/docs/i18n/README.md:21-43@687f282e`

12. **文档代码块只编译不运行。** `doc-typecheck` 的完成信号是编译器通过；它不执行示例，也不验证示例输出。涉及行为的示例仍需测试或真实运行。`deepseek-harness/scripts/doc-typecheck.ts:1-73@687f282e`

13. **源仓库的门禁不等于平台强制。** 本参考只根据固定提交的脚本、清单和文档判断“存在什么检查”；没有断言远程分支保护、必需检查或发布权限已配置。采用方必须单独收集 CI/分支保护证据。

14. **文档图的事件覆盖偏 Host。** 关系扫描只种 Host 聚合 TypeScript Program；源码注释明确承认 Client 侧监听者会少报（`connection/reset` 漏 `ui-skill`/`ui-agent-preset`），且 Client 声明事件因结构不可见而豁免“必须有 dispatcher”检查。服务角色表是人工分类，`assertServiceRolesComplete` 只保证角色 key 与 Cordis 发现集合对齐，不证明实现/消费者/备注语义完整。`deepseek-harness/scripts/gen-doc-graphs.ts:1098-1103@687f282e`、`deepseek-harness/scripts/gen-doc-graphs.ts:1505-1530@687f282e`、`deepseek-harness/scripts/gen-doc-graphs.ts:958-974@687f282e`

15. **中文 CLI 页不翻译帮助正文。** `gen-cli-help` 从同一组实际 `--help` 输出渲染英文和中文页；中文页只翻译标题、说明、目录和标签，帮助正文保留 launcher 输出原文。因此中文页的存在不证明 CLI 帮助已本地化，也不覆盖帮助文本的语义正确性。`deepseek-harness/scripts/gen-cli-help.ts:230-298@687f282e`

16. **README 结构门禁不证明语义真实、限制完整或译文等价。** Model Experience 门禁断言 H2/H3/H4/H5 形态、白名单、空行、围栏和 tool-catalog 锚点存在；限制节门禁断言唯一标准标题和至少一个顶层 bullet；`doc-standard` 断言 kind/元数据与骨架标题。它们都不判断 README 文字是否真实描述模型可见面、限制是否完整、kind 事实是否合理，也不判断中文译文是否语义等价。`README.i18n.yaml` 的逐节哈希只证明两侧内容块在记录时相同，不证明译文忠实。本提取对 package-contracts-3 的 53 个中文 README 中所有超过 512 字符的行做了逐字符分块复读（30 行、22,300 字符，含 8 行超过先前约 768 字符的显示上限），因此超长行不再构成未读理由；但该复读只覆盖超长行，不等于逐句双语审校。`deepseek-harness/scripts/verify-package-readme-model-experience.ts:366-638@687f282e`、`deepseek-harness/scripts/verify-package-readme-limitations.ts:34-95@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:142-160@687f282e`、`deepseek-harness/scripts/translation-pairing-record.ts:79-243@687f282e`、`deepseek-harness/scripts/verify-translation-pairing.ts:99-170@687f282e`

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `documentation-tier-placement`：`deepseek-harness/AGENTS.md:170-178@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:79-125@687f282e`
- `documentation-tutorial-vs-reference`：`deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:4-87@687f282e`
- `documentation-page-skeleton`：`deepseek-harness/.agents/skills/dsh-doc/references/structure-hierarchy.md:4-87@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/style.md:5-49@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:110-118@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:154-160@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:401-406@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:443-456@687f282e`
- `documentation-package-readme-kinds`：`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:18-31@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/SKILL.md:59-62@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:3-10@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:50-61@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:18-24@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:40-49@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:57-160@687f282e`、`deepseek-harness/scripts/doc-standard.spec.ts:339-406@687f282e`
- `documentation-package-readme-summary`：`deepseek-harness/scripts/verify-package-readme-summaries.ts:8-17@687f282e`、`deepseek-harness/scripts/verify-package-readme-summaries.ts:44-75@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/package-reference.md:19-25@687f282e`
- `documentation-package-readme-model-experience`：`deepseek-harness/scripts/verify-package-readme-model-experience.ts:1-638@687f282e`、`deepseek-harness/docs/cookbook/adding-a-package.md:1-170@687f282e`
- `documentation-package-readme-limitations`：`deepseek-harness/scripts/verify-package-readme-limitations.ts:1-95@687f282e`
- `documentation-comments-export-jsdoc`：`deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e`、`deepseek-harness/packages/core/agent/tests/verify-export-jsdoc.spec.ts:1-561@687f282e`
- `documentation-generated-reference-freshness`：`deepseek-harness/scripts/gen-persistence-catalog.ts:1-267@687f282e`、`deepseek-harness/packages/core/session/tests/gen-persistence-catalog.spec.ts:1-306@687f282e`、`deepseek-harness/packages/core/tools/tests/gen-tool-catalog.spec.ts:1-158@687f282e`、`deepseek-harness/scripts/gen-config-catalog.spec.ts:1-195@687f282e`、`deepseek-harness/scripts/gen-cli-help.spec.ts:1-134@687f282e`、`deepseek-harness/scripts/gen-session-format-catalog.spec.ts:1-167@687f282e`、`deepseek-harness/scripts/gen-doc-graphs.spec.ts:1-165@687f282e`
- `documentation-markdown-links`：`deepseek-harness/scripts/verify-md-links.ts:1-254@687f282e`、`deepseek-harness/scripts/verify-md-links.ts:204-254@687f282e`、`deepseek-harness/docs/AGENTS.md:75-77@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/references/metadata-links-i18n.md:60-64@687f282e`、`deepseek-harness/scripts/verify-md-links.spec.ts:1-29@687f282e`、`deepseek-harness/scripts/verify-md-links.spec.ts:64-140@687f282e`
- `documentation-doc-typecheck`：`deepseek-harness/scripts/doc-typecheck.ts:1-252@687f282e`、`deepseek-harness/scripts/doc-typecheck-paths.ts:1-24@687f282e`
- `documentation-type-equiv`：`deepseek-harness/docs/subsystems/README.md:74-76@687f282e`
- `documentation-subsystem-page-ownership`：`deepseek-harness/docs/subsystems/README.md:1-76@687f282e`
- `documentation-i18n-pair-gate`：`deepseek-harness/scripts/verify-translation-pairing.ts:1-368@687f282e`
- `documentation-i18n-translation-rules`：`deepseek-harness/docs/i18n/translation-rules.md:1-69@687f282e`
- `documentation-i18n-terminology`：`deepseek-harness/docs/i18n/terminology.md:1-215@687f282e`
- `documentation-i18n-style-samples`：`deepseek-harness/docs/i18n/style-samples.md:1-87@687f282e`
- `documentation-i18n-prompt-pipeline`：`deepseek-harness/scripts/translation-prompt.ts:1-259@687f282e`、`deepseek-harness/docs/i18n/translation-prompt.md:1-263@687f282e`
- `documentation-agent-note-lifecycle`：`deepseek-harness/.agents/notes/README.md:5-75@687f282e`
- `documentation-agent-note-format-gates`：`deepseek-harness/scripts/verify-agent-note-classification.ts:1-27@687f282e`
- `documentation-upgrade-guide`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e`
- `documentation-gate-composition`：`deepseek-harness/package.json:104-140@687f282e`、`deepseek-harness/scripts/run-gates.ts:805-883@687f282e`
- `documentation-session-format-status`：`deepseek-harness/docs/session-format-status.md:1-56@687f282e`
