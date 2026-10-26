# 过程与理由类治理机制迁移参考（rationale-process-2）

本参考覆盖固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中 `.agents/notes/{archived,implemented,proposed}/process/` 的 80 篇英文决策笔记及其 80 篇中文对照正文，共归纳 76 个机制；80 篇中 79 篇映射到这些机制（多篇共享同一机制），另 1 篇（web 语法高亮）经正文审阅判定为 product-specific，未新增治理机制。它不是口号清单：每个条目给出触发条件、前置、可执行步骤、责任角色、完成信号、失败与恢复、例外和证据边界，并附精确来源行号。落地时必须按目标项目重命名命令、路径和阈值；源项目中的具体工具选择（tsdown、pnpm、Vitest、GitHub Actions、npm）只是参数，不是迁移义务。

## 使用方式

1. 先按“读者触发”定位：改文档找文档门禁与引用；改依赖/发布找 release 系列；改 CI 找泳道、调度器、failover；改持久化 schema 找 acknowledgement；改评审权限找 approval 系列。
2. 每个机制先核对前置是否具备；缺少前置时只能落地其“可迁移部分”，不得声称已获得同等自动保证。
3. 所有验证在本文中均标记为 planned：来源笔记描述的是源项目已发生或计划中的执行，不代表目标项目已运行。标为“提案”的机制尚未实施，不能当作自动保证。
4. “源义务”指笔记明确规定的行为；“迁移设计”指为落地而做的工程选择，二者在文中分开表述。

## 状态与证据约定

- 来源中 `implemented` 表示源项目已采纳；`archived` 表示已归档但仍记录当时有效的机制；`proposed` 表示仅为提案，本文明确标注。
- 引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`，路径相对源仓库根。
- 任何“自动阻止”必须以实际运行的正例、反例和恢复证据为准；仅有脚本或工作流文件不构成运行时证明。
<a id="doc-code-sync-gates"></a>
**机制 ID**：`rationale-process-2/doc-code-sync-gates`

**角色**：doc author、doc-sync owner、CI。
**前置**：文档包含可编译示例、规范命令清单或分类表；比例参数与聚合命令名需按项目重定。

### 文档同步机械门禁

**何时用**：文档含可执行 TypeScript 围栏、命令清单或分类表时。**做法**：用共享 `doc-sync` 聚合校验围栏能否针对真实工程编译、检查 ignore-check 注解比例（超过一半即失败）、要求每个自然段只占一个物理行；本地按面选择，CI 跑全集。**完成信号**：聚合退出 0，诊断带 `path:line`。**失败/例外**：编译失败、比例超限或段落未回卷即失败；围栏可显式 ignore，但受比例上限约束，生成目录围栏不计入比例。**证据限制**：只证明被编码的表面，不证明正文正确；分类表部分已被后续生成目录取代。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-11-doc-sync-enforcement.md:1-33@687f282e；deepseek-harness/.agents/notes/archived/process/2026-07-22-cordis-tutorial-docs.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-06-11-doc-sync-enforcement.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-cordis-tutorial-docs.md:1-33@687f282e

<a id="build-tool-risk-selection"></a>
**机制 ID**：`rationale-process-2/build-tool-risk-selection`

**角色**：build owner、reviewer、release owner。
**前置**：任何考虑替换构建/测试工具的项目；数值阈值因项目而异。

### 构建工具的维护证据选型

**何时用**：准备替换构建/测试工具时。**做法**：先用下载量、维护者数量、bus factor、升级风险等维护证据比较；在发布前或天然切换点以最低成本替换；显式收窄 workspace glob，并在所有权 README 记录每包 override；保持入口和声明产物形状不变。**完成信号**：原型产物与旧工具逐字节兼容，旧配置删除。**失败/例外**：无证据或改变产物形状的提案在评审被拒；具体选型不是普遍命令。**证据限制**：维护指标会过期，重大升级需重评。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-11-tsdown-over-dumble.md:1-31@687f282e

<a id="vendored-source-manifest"></a>
**机制 ID**：`rationale-process-2/vendored-source-manifest`

**角色**：vendoring owner、author、pre-commit/CI。
**前置**：Vendor 依赖或内嵌上游源码的项目；清单格式与钩子可调整。

### Vendor 源码来源清单

**何时用**：把上游源码复制进仓库，或修改已 vendored 文件时。**做法**：记录上游仓库与精确 commit；在清单中登记每处本地修改及理由；pre-commit 守卫要求 vendored 路径变更与清单更新出现在同一提交；workspace 解析固定到 vendored 副本，lint 排除该目录。**完成信号**：提交同时包含源码与清单变更。**失败/例外**：只改源码不改清单被拒绝；显式路径例外需评审。**证据限制**：只验证“清单被更新”，不证明修改记录完整；除非另有漂移重建，否则不验证上游等价性。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-11-vendor-cordis-as-source.md:1-29@687f282e

<a id="compiler-single-ownership"></a>
**机制 ID**：`rationale-process-2/compiler-single-ownership`

**角色**：build owner、package author、release verifier。
**前置**：具有多个构建面的 TypeScript monorepo；命令名与聚合形状可变。

### 单一编译器所有权

**何时用**：TypeScript 同时被 tsc、打包器和声明生成器处理时。**做法**：让一个 TypeScript 编译器负责类型检查、转换和声明输出；用 project references 表达按目录 strictness；打包器只消费已生成文件；发布前从外部消费者视角校验声明 specifier。**完成信号**：`tsc -b` 通过，打包产物可被外部 fixture 消费。**失败/例外**：第二个声明发射器或缺失 reference 视为缺陷；生成的/vendor 文件需显式 owner 例外。**证据限制**：归档决策，后续命令顺序可能变化，但所有权原则仍有效。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-17-ts-build-config.md:1-91@687f282e

<a id="clean-safety-guards"></a>
**机制 ID**：`rationale-process-2/clean-safety-guards`

**角色**：build owner、author。
**前置**：任何带破坏性 clean 脚本的项目。

### clean 命令的安全护栏

**何时用**：仓库有会删除生成物的 clean 命令。**做法**：从实时引用图和已知输出目录推导目标；解析父路径逃出仓库时拒绝删除；保留现有 manifest 的 `node_modules`；manifest 缺失目录出现未知文件时停止；绝不自动执行 clean。**完成信号**：只删除已知生成物。**失败/例外**：任何越界或未知文件都会中止；显式 force 必须文档化且非默认。**证据限制**：无法防止人工裸 `rm`；并发写入仍可能竞争。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-17-ts-build-config.md:1-91@687f282e

<a id="agent-note-classification"></a>
**机制 ID**：`rationale-process-2/agent-note-classification`

**角色**：note author、CI。
**前置**：使用持久决策记录的仓库；类别名属于本地策略。

### 决策笔记的路径分类

**何时用**：新增或移动决策笔记时。**做法**：把生命周期与类别编码为封闭集合的路径；拒绝散落文件、未知类别目录和集中索引；在代码中维护规范集合并谨慎修改；扫描代码注释里的根相对 docs/notes 引用并断言目标存在。**完成信号**：分类门禁通过且引用可解析。**失败/例外**：未知目录/散落笔记失败；历史笔记可按日期明确豁免。**证据限制**：不判断内容质量或类别是否恰当；引用扫描是路径级，漏掉散文提及。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-20-agent-note-classification.md:1-49@687f282e

<a id="generated-reference-catalogs"></a>
**机制 ID**：`rationale-process-2/generated-reference-catalogs`

**角色**：catalog owner、doc author、CI。
**前置**：文档或清单由代码派生的项目；生成器语言与路径可变。

### 生成式参考目录与漂移校验

**何时用**：文档重复枚举 AST/配置中可完整获得的表面时。**做法**：AST/配置是完整真源时生成而非人工校验；要求显式 mode 标签并做结构交叉检查；类型映射失败即关闭，例外必须具名；生成围栏标记为跳过文档类型检查；在共享门禁跑 `--write`/`--check` 字节比对。**完成信号**：重新生成字节一致。**失败/例外**：陈旧或结构不完整失败；无法提取的 pinned vendor 表可分层处理。**证据限制**：生成器也可能漏掉运行时构造的条目。

来源：deepseek-harness/.agents/notes/archived/process/2026-06-20-generated-cordis-catalog.md:1-42@687f282e

<a id="runtime-surface-cataloging"></a>
**机制 ID**：`rationale-process-2/runtime-surface-cataloging`

**角色**：tooling owner、doc author、CI。
**前置**：具有运行时注册机制的插件/工具系统。

### 启动采集运行时表面目录

**何时用**：工具/插件在运行时注册 schema，静态分析不可信时。**做法**：启动真实注册表采集已注册 schema；glob 所有候选包，任何包未出现在采集清单即硬失败；启动配方保持手写、可评审；输出确定性序列化，并在 doc-sync 校验新鲜度。**完成信号**：目录完整且字节稳定。**失败/例外**：遗漏包或输出不稳定失败；排除只能通过显式启动配方决策。**证据限制**：只看到启动路径执行的代码；不证明每个 schema 可用。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-02-tool-schema-catalog.md:1-56@687f282e

<a id="agent-note-format-gate"></a>
**机制 ID**：`rationale-process-2/agent-note-format-gate`

**角色**：note author、CI。
**前置**：任何带生命周期状态的决策记录语料。

### 统一决策笔记格式门禁

**何时用**：团队用生命周期状态维护决策记录时。**做法**：要求 H1 + 无日期 Status，且与目录一致；按生命周期套用正文骨架，implemented 中禁用 proposal 时代标题；强制 Alternatives considered；只在格式迁移前日期允许 grandfather 注释，绝不编造理由；一次性规范化全库，不维持双格式。**完成信号**：结构检查通过。**失败/例外**：缺标题/状态不符/缺替代方案失败；格式化器只用于 check。**证据限制**：无法发现“有正确标题但内容是编造的替代方案”。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md:1-31@687f282e

<a id="export-documentation-gate"></a>
**机制 ID**：`rationale-process-2/export-documentation-gate`

**角色**：package author、API owner、CI。
**前置**：发布公共 API 的 TypeScript 库。

### 导出 API 文档门禁

**何时用**：库发布公共 API 时。**做法**：与目录生成器共享“已文档化”定义；覆盖每种声明形态（命名空间、re-export、`export =`）；未知形态 fail-closed；记录显式豁免族；在同一变更中补齐基线缺口。**完成信号**：所有公共导出有文档或已评审豁免。**失败/例外**：新未文档化导出失败；三类显式豁免。**证据限制**：不判断文档质量；保留名/动态导出可能漏检。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-06-export-jsdoc-gate.md:1-46@687f282e

<a id="ci-parallel-lane-topology"></a>
**机制 ID**：`rationale-process-2/ci-parallel-lane-topology`

**角色**：CI owner、reviewer、branch protection。
**前置**：任何多泳道、单一合并门禁的 CI。

### 必需 CI 泳道与聚合裁决

**何时用**：CI 拆成多泳道、分支保护依赖单一聚合状态时。**做法**：为每个平台/面命名泳道并显式声明门禁清单；必需聚合依赖所有阻塞泳道；拒绝缺失/重复分片；发布视图做结构校验而非每泳道重复打包。**完成信号**：聚合覆盖全部阻塞泳道。**失败/例外**：缺泳道或分片不完整阻止合并；诊断/仅 master 泳道不进入保护。**证据限制**：历史拓扑已被后续 runner 证据取代，原则仍可用；聚合不能证明泳道测对了东西。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-06-parallel-github-ci-gates.md:1-51@687f282e

<a id="gate-scheduler"></a>
**机制 ID**：`rationale-process-2/gate-scheduler`

**角色**：gate owner、CI、developer。
**前置**：检查项很多且本地与 CI 都会调用的 monorepo。

### 声明式门禁调度器

**何时用**：大量独立门禁同时被本地与 CI 调用时。**做法**：用一份声明式叶子清单作为模式真源；执行前拒绝无效/歧义依赖图；区分 `needs` 与 `after`，`allowFailure` 只报告不失败聚合；仅为有归属子进程的协调器流式输出，其余按门禁缓冲；并发上限按实测资源成本设定。**完成信号**：稳定 summary 行 + 退出码。**失败/例外**：重复/未知叶子或必需门禁失败即失败；`allowFailure` 例外。**证据限制**：依赖图需持续维护；缓冲会隐藏进度。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-06-parallel-github-ci-gates.md:1-51@687f282e；deepseek-harness/.agents/notes/archived/process/2026-07-06-parallel-pre-push-gates.md:1-47@687f282e；deepseek-harness/.agents/notes/archived/process/2026-07-21-doc-sync-through-gate-scheduler.md:1-26@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-06-parallel-github-ci-gates.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-06-parallel-pre-push-gates.md:1-47@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-21-doc-sync-through-gate-scheduler.md:1-26@687f282e

<a id="single-source-site-projection"></a>
**机制 ID**：`rationale-process-2/single-source-site-projection`

**角色**：doc owner、site owner、release operator。
**前置**：将自有文档发布到站点生成器的项目。

### 单一源文档站点投影

**何时用**：文档既要留在所属层级又要发布到站点时。**做法**：规范文档留在原层级，显式发布清单映射到稳定路由；投影到一次性目录后再渲染，绝不编辑副本；重写链接并对缺失目标失败；拒绝清单外的站点 Markdown；生产构建在 doc-sync，发布用 release tag 触发的独立工作流；base path 取自托管元数据。**完成信号**：渲染页面可访问、链接有效。**失败/例外**：站点私有文件或坏链失败；外部链接/生成资源需显式处理。**证据限制**：不校验正文；路由规则需按宿主参数化。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-13-documentation-site-projection.md:1-52@687f282e；deepseek-harness/.agents/notes/archived/process/2026-07-22-cordis-tutorial-docs.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-13-documentation-site-projection.md:1-52@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-cordis-tutorial-docs.md:1-33@687f282e

<a id="program-semantic-gates"></a>
**机制 ID**：`rationale-process-2/program-semantic-gates`

**角色**：gate owner、author、CI。
**前置**：具有注册表或 API 表面的 TypeScript 系统。

### 基于 Program 的语义门禁

**何时用**：规则涉及可赋值性、注册表或 API 兼容性时。**做法**：从完整 solution 图构建一个 no-emit Program，禁止门禁自建局部 Program；用类型检查器而非命名约定；只把有限字面量集合视为封闭，泛型转发归属到具体调用点；局部性证明必须有全量索引回退，优化不得改变结果；每个声明事件必须有发现的 producer，歧义即失败。**完成信号**：诊断带 file:line，缺失/拓宽/producer 不明均失败。**失败/例外**：保留注解需经审核分类。**证据限制**：Program 构建昂贵；无法证明纯运行时分发。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-14-typescript-program-backed-semantic-gates.md:1-66@687f282e

<a id="layered-test-evidence"></a>
**机制 ID**：`rationale-process-2/layered-test-evidence`

**角色**：feature author、test owner、reviewer。
**前置**：同时具有 UI 与宿主/运行时层的应用。

### 按架构层划分的测试证据

**何时用**：功能跨越 unit、Host、浏览器多层时。**做法**：沿架构钩子切层，每层只测自己的行为，上层不重复下层；维护 lane map 说明何时必须跑哪层；真实 carrier 语义不同后，进程内 mock 全绿不算完成；红灯立即对合同复核，而不是放宽断言。**完成信号**：改动所属层有断言，必要时真实链路通过。**失败/例外**：显式 skip 需跟踪理由与归属层。**证据限制**：lane map 会老化；真实浏览器测试慢且环境依赖。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-20-gui-testing-system.md:1-61@687f282e

<a id="regression-pinning"></a>
**机制 ID**：`rationale-process-2/regression-pinning`

**角色**：fix author、reviewer。
**前置**：所有缺陷修复。

### 回归用例钉住

**何时用**：修复缺陷时。**做法**：先在所属 spec 中增加/加强断言；在可行时证明该断言在无修复版本失败；把断言放在能复现缺陷的最低层；在测试或提交中关联 issue/PR。**完成信号**：新增断言在父提交失败、修复后通过。**失败/例外**：无钉住用例的修复被退回；不可复现环境需记录替代证据。**证据限制**：并非所有缺陷都易复现；评审证据不会自动归档。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-20-gui-testing-system.md:1-61@687f282e

<a id="capacity-evidence-benchmarking"></a>
**机制 ID**：`rationale-process-2/capacity-evidence-benchmarking`

**角色**：CI owner、reviewer、operator。
**前置**：CI 机队与 runner 规格决策。

### 容量决策依赖实测基准

**何时用**：准备更换 runner 规格或 CI 拓扑时。**做法**：对候选规格测完整作业（含 setup/cache）以及实际硬件报告，使用 exact-head、多档对比和样本方差；时限只作为观测，不作为取消截止；内层 worker 与外层作业并发分开，并按确定性而非核数设限；删除休眠拓扑；failover 用一个仓库变量预接线并演练。**完成信号**：选定规格在完整作业计时上达标。**失败/例外**：仅凭核数推断或无完整计时被拒；紧急 failover 可临时覆盖但需演练与回滚。**证据限制**：托管 runner 方差大；基准不是正确性证明。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-evidence-based-larger-hosted-runners.md:1-88@687f282e

**当前预览规格实验的源合同。** 比较候选runner时，固定检出SHA、锁文件、Node/pnpm版本、完整workspace build和preview/VFS packing命令；各runner起步时均无构建产物。冷安装不恢复依赖缓存（pnpm bootstrap文件可能已存在）；热安装恢复同一个精确缓存，不使用prefix fallback。这是规格实验的条件规则，普通PR缓存fallback政策不因此改变。逐次记录实际镜像、CPU、RAM、磁盘、cache outcome、各阶段耗时、退出状态和内存峰值；GNU time最大RSS是进程最大值，不是构建进程树同时占用的内存总量。

**费用核对与拒绝。** CI owner交付逐作业表，评审者计算每个已完成作业的 `ceil(elapsed minutes) × runner rate` 后求和，不能对总分钟数只取整一次。执行时间须包含setup、cache restore、cleanup、失败作业和测量上传开销；seed/缓存预热作业单独报告。queue delay是延迟观测，不计为作业执行；套餐内included minutes和storage另列，gross compute估算不能写成invoice total。评审者拒绝漏失败/开销、合计取整、把queue计入compute或混入seed而不单报的选型；作者修正原始表与计费边界，必要时重测后再提交，不能靠降低证据范围恢复通过。

**仅构建与发布分界。** build-only实验不部署、不访问Cloudflare凭据、不发PR评论，不能证明完整preview publication成本、deployment latency或protected-image交付。选定runner后须用实际preview workflow确认这些发布声明；runner改动保留PR events、按PR cancellation、immutable install、restore-only依赖缓存、完整workspace build、preview packing、sourcemap removal与复制到部署根的preview page。Cloudflare仅上传built site到PR branch alias；protected image必须HTTP200、无transport content encoding且有gzip magic bytes；URL comment幂等，Dependabot及其他PR作者仍走GitHub-hosted机器。目标可按实际供应商命名凭据/分支，但保持同一实验隔离与发布检验边界。

**执行与证据边界。** 采用方把上述材料挂到已有runner变更评审，由CI owner提供日志和费率、独立reviewer核对并拒绝违规方法；方法通过仍须真实候选runner测量及preview确认。这是已交付的人审程序，不是本包已执行实验或自动费用校验。原独立F1/F2遗漏报告保留于 `_working/audit/p1-reviewed-no-mechanism-reverse-independent.json`，本次修复待复审。

来源：deepseek-harness/.github/preview-sizing/README.md:1-35@687f282e；deepseek-harness/.github/preview-sizing/README.zh.md:1-35@687f282e


<a id="tiered-local-ci-evidence"></a>
**机制 ID**：`rationale-process-2/tiered-local-ci-evidence`

**角色**：developer、agent、reviewer、CI。
**前置**：具有昂贵穷举矩阵的仓库。

### 本地钩子与 CI 的分层证据

**何时用**：仓库同时有 pre-commit/pre-push 与昂贵 CI 矩阵时。**做法**：pre-commit 只保留廉价高置信检查（staged lint、空白、vendor 清单）；pre-push 只做增量类型检查；穷举套件/构建/矩阵在 CI 每个已推送 revision 跑一次；agent 只跑覆盖改动的最窄证据并由 reviewer 判断选择；完整本地排练仅在明确要求、诊断 CI 或全仓改动时进行；钩子延迟用观测而非计时测试。**完成信号**：钩子快，CI 拥有完整证据。**失败/例外**：钩子可被跳过，CI 是阻塞证据。**证据限制**：agent 可能选错测试范围。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md:1-37@687f282e

<a id="readme-entry-point-maintenance"></a>
**机制 ID**：`rationale-process-2/readme-entry-point-maintenance`

**角色**：maintainer、doc owner、reviewer。
**前置**：任何作为入口的根 README。

### 产品优先的根 README 维护

**何时用**：根 README 被当作产品/贡献入口时。**做法**：保持简短入口定位；保留已审核的准确措辞，区分事实刷新与编辑性重写；当命令、入口、发布阶段或能力族变化时更新；细节链接到所属指南，不复制站点首页。**完成信号**：入口声明与实际命令一致。**失败/例外**：陈旧命令或重复手册内容是评审问题；重大定位调整可整体重写。**证据限制**：无自动检查器，依赖评审。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-product-first-root-readme.md:1-32@687f282e

<a id="tsconfig-graph-boundaries"></a>
**机制 ID**：`rationale-process-2/tsconfig-graph-boundaries`

**角色**：build owner、package author。
**前置**：同时具有浏览器与宿主面的 TypeScript monorepo。

### 双聚合 Program 的 solution 根

**何时用**：仓库同时有 Host/Client 编译面或 DOM/Node 库冲突时。**做法**：保留无 program 的 solution 根，仅引用显式聚合；绝不直接构建根，而是构建聚合；每个包只注册进一个聚合；生成的合同在 Host/Client 间流动时保持两阶段串行。**完成信号**：每个包在所属聚合中被检查。**失败/例外**：直接构建根或包只被根引用会漏诊断；共享 base 只能放 compilerOptions，不能放 include/files。**证据限制**：两聚合有配置重复；生成合同顺序需维护。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-tsconfig-solution-root-two-aggregates.md:1-46@687f282e
来源：deepseek-harness/tsconfig.json:1-15@687f282e

<a id="demo-evidence-provenance"></a>
**机制 ID**：`rationale-process-2/demo-evidence-provenance`

**角色**：demo author、reviewer、attachment operator。
**前置**：用作 PR 证据的 UI/产品演示。

### 带来源标注的演示录制

**何时用**：为评审录制 demo/GIF 时。**做法**：先确认并声明流程是真实、fixture 还是模拟；缺前置时报告并停止，绝不静默切换；捕获语义 storyboard 状态；用 ffprobe 等验证编码结果；录制保持无副作用；附件授权与录制分离；帧文件放在 gitignore 的工具根，不进 PR 分支。**完成信号**：演示文件可播放且来源标注清楚。**失败/例外**：缺前置中止；只有用户明确要求才允许 fixture 并标注。**证据限制**：来源是自述；不证明所有用户路径。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-23-browser-demo-gif-recording.md:1-30@687f282e

<a id="atomic-staging-cutover"></a>
**机制 ID**：`rationale-process-2/atomic-staging-cutover`

**角色**：operator、maintenance tool、launcher。
**前置**：从检出安装并原地维护的工具。

### 已安装检出的原子维护切换

**何时用**：就地维护一个已安装、由 launcher 指向的 checkout 时。**做法**：从 launcher/进程环境推导目标；除既有合并锁外把运行中的 checkout 视为不可变；clone、准备/暂存分支、refs 与 launcher 备份共用一个 UTC 时间戳身份，冲突即失败不加后缀；在独立 clone 验证；只做一次原子 launcher 移动；切换前失败保持原状，切换后失败恢复并验证备份；重启证明新分支并获明确批准后才清理。**完成信号**：重启后新分支生效，备份仍可用。**失败/例外**：并发维护锁阻止第二次切换；上游发布独立进行。**证据限制**：文件系统上并非真正原子；单操作者假设。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-23-personal-staging-maintenance-skills.md:1-36@687f282e

<a id="calibrated-translation-pipeline"></a>
**机制 ID**：`rationale-process-2/calibrated-translation-pipeline`

**角色**：translation owner、translator、CI。
**前置**：结构化文档的 LLM 翻译。

### 作为可执行资产的校准翻译流水线

**何时用**：用 LLM 翻译结构化文档时。**做法**：把提示词当作带验证器与请求/响应快照的可执行资产；渲染器只注入语言与术语，拒绝畸形占位符；文件名留在提示词外，提供已审核整文档对照；声明优先级（意义/结构 > 术语 > gold-pair 语气 > 通用指引），要求显式 review pass；解析器严格校验顺序、数量与信封，保留分隔符无损转义。**完成信号**：响应通过结构与术语校验。**失败/例外**：畸形占位符/响应形状在写文件前失败；校准修订必须保留可执行协议。**证据限制**：不证明翻译语义正确；模型行为会漂移。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-23-translation-prompt-v4-contract.md:1-40@687f282e

<a id="translation-pairing-maintenance"></a>
**机制 ID**：`rationale-process-2/translation-pairing-maintenance`

**角色**：doc author、translator、CI。
**前置**：需维护的双语文档对。

### 带 brief 的最小翻译更新

**何时用**：双语对的单侧发生小改动时。**做法**：给译者完整工作集，并在上下文不足时按 unit → section → document 确定性扩围；不足则拒绝而非猜测；仅代码围栏的机械修改可直接应用并按门禁签名校验；门禁参数限定到改动文件，全库 sweep 留在 doc-sync/CI；裸 `--write` 必须拒绝，使批量重录可见；用内容寻址 ref 钉住精确字节。**完成信号**：仅受影响区域更新，配对签名有效。**失败/例外**：上下文不足拒绝；全文档级变更可整体重译。**证据限制**：盲评证据是抽样的；部分术语仍需人工。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-26-briefed-minimal-translation-updates.md:1-52@687f282e

<a id="visual-change-evidence"></a>
**机制 ID**：`rationale-process-2/visual-change-evidence`

**角色**：PR author、reviewer、assets operator。
**前置**：具有可评审视觉行为的 UI 产品。

### 用户可见 GUI 改动的证据

**何时用**：PR 改变产品用户可见的 GUI 行为时。**做法**：附演示 GIF，并在嵌入旁声明真实来源（真实分支树、真实 key、真实模型轮次）；只有用户明确要求才用 fixture；媒体发到只追加的 orphan assets 分支（每 PR 系列一个，永不重写/删除）；在浅 scratch clone 中用固定提交信息和 raw 链接发布，绝不把二进制提交进 PR 分支；录制无副作用，仅在任务包含附件时发布。**完成信号**：评审能看到与改动匹配的真实演示。**失败/例外**：缺失或错标证据阻止接受；非视觉改动/明确要求的 fixture 例外。**证据限制**：评审级证据；不证明未测路径。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-26-gui-pr-gif-evidence-and-assets-branch.md:1-40@687f282e

<a id="merge-forward-checkpoints"></a>
**机制 ID**：`rationale-process-2/merge-forward-checkpoints`

**角色**：merge author、reviewer。
**前置**：采用 merge-forward 策略的长生命周期 PR。

### 合并前进检查点

**何时用**：选择 merge-forward 且合并期间 base 前进时。**做法**：完成、验证并提交当前合并；获授权则推送；把更新后的 base 作为独立提交再合并；绝不丢弃或重写检查点；只有明确选择 rebase 时才用 lease 保护；合并树变化后重跑相关检查。**完成信号**：历史中保留两个检查点，第二次合并后检查通过。**失败/例外**：丢失/重写检查点被拒；rebase 需 lease 且另有决策所有。**证据限制**：增加提交噪音；依赖远端权限。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-26-incremental-pr-base-retargeting.md:1-28@687f282e

<a id="dependency-update-quarantine"></a>
**机制 ID**：`rationale-process-2/dependency-update-quarantine`

**角色**：dependency owner、automation、reviewer。
**前置**：使用自动依赖更新的项目。

### 带发布年龄隔离期的依赖更新

**何时用**：启用自动依赖/安全更新时。**做法**：对 registry/Actions 版本更新统一施加发布年龄下限（如 30 天）；安全更新立即处理，不因 transitive 太新而放宽；vendor 源排除版本扫描，改动走 vendoring 流程；使用标签、正常 PR 检查和维护者评审，不自动合并；固定包管理器，workspace 只维护一个 lockfile。**完成信号**：更新通过完整检查后人工合并。**失败/例外**：过新版本被年龄检查阻止；安全公告绕过冷却；vendor 用同步程序。**证据限制**：发布年龄不是安全保证；生态工具支持不同。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-27-dependabot-version-updates.md:1-35@687f282e

<a id="generated-region-pairing"></a>
**机制 ID**：`rationale-process-2/generated-region-pairing`

**角色**：catalog owner、doc author、pairing gate。
**前置**：同时含生成清单与翻译对的文档。

### 自有页面中的生成区域与配对保护

**何时用**：生成目录要嵌入人工维护页面，或双语对需保持一致时。**做法**：只在显式 BEGIN/END 标记内注入生成内容；双向映射失败即报错（发现未映射项、已映射项消失）；保留独立 AST 兜底与具名、非陈旧豁免，渲染出的内容必须对扫描可见；两语言区域逐字节一致；仅当写入局限于区域时才自动记录配对，散文漂移和新配对永不自动记录。**完成信号**：区域一致且配对侧车有效。**失败/例外**：未映射、陈旧豁免或区域分歧失败；AST 盲区需具名豁免。**证据限制**：手工编辑可绕过标记；AST 兜底有盲点。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-28-per-subsystem-cordis-surface-regions.md:1-37@687f282e

<a id="coverage-instrumentation-split"></a>
**机制 ID**：`rationale-process-2/coverage-instrumentation-split`

**角色**：test owner、CI。
**前置**：带覆盖率阈值的大型测试套件。

### 覆盖率插桩分离而不减少测试

**何时用**：重型套件重复支付插桩成本，而阈值只需一条测量通道时。**做法**：拆成 instrumented（拥有全部阈值）与 uninstrumented（仍执行测试）两条门禁；通过门禁环境注入而非全局，保持本地运行不变；成员资格与 filter/exclude 配对集中在单一 roster 模块；要求被测量文件已在别处覆盖或被阈值排除，错误成员会让 per-file 阈值响亮失败。**完成信号**：所有测试仍运行，阈值由 instrumented 通道满足。**失败/例外**：遗漏测量文件或 roster 不匹配失败；阈值排除需评审。**证据限制**：重复执行时间仍在；环境注入可能与本地行为分叉。

来源：deepseek-harness/.agents/notes/archived/process/2026-07-31-coverage-exempt-heavy-suites.md:1-69@687f282e

<a id="monotonic-status-projection"></a>
**机制 ID**：`rationale-process-2/monotonic-status-projection`

**角色**：automation、issue owner。
**前置**：具有有序阶段的问题/PR 生命周期自动化。

### 只向前的 issue 状态投影

**何时用**：PR/review 事件自动更新关联 issue 状态时。**做法**：只沿固定顺序向前投影；只更新能解析该 PR 的同仓 issue，绝不为无状态 issue 添加状态；终态不后退；生命周期投影与 PR 元数据策略分离为独立必需检查；接受晚创建 issue 等待后续事件或手工更新。**完成信号**：状态只前进，策略测试覆盖转移。**失败/例外**：非法转移被忽略；手工可推进遗漏 issue。**证据限制**：不调度对账，漏事件不会自动修复；跨仓 issue 排除。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-04-forward-only-pr-issue-status.md:1-40@687f282e

<a id="actionable-gate-diagnostics"></a>
**机制 ID**：`rationale-process-2/actionable-gate-diagnostics`

**角色**：test owner、developer、CI。
**前置**：具有逐文件覆盖率门禁的项目。

### 覆盖率失败的可操作诊断

**何时用**：覆盖率阈值失败但摘要不指出具体位置时。**做法**：对每个未覆盖 statement/branch/function 输出一条可点击的 `path:line:col`，确定性排序并置于阈值摘要之上；绿色时零输出；CI、本地与聚焦运行共用同一 reporter；列号 1-based，对 Infinity span 与隐式分支降级；门槛要求零缺口时不截断列表。**完成信号**：红色运行给出可定位记录。**失败/例外**：仅摘要无位置被视为诊断不完整；istanbul 的 CJS reporter 加载是明确例外。**证据限制**：无法修复 sourcemap 歧义；依赖 CI 的路径跳转。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-06-coverage-uncovered-locations.md:1-43@687f282e

<a id="release-artifact-verification"></a>
**机制 ID**：`rationale-process-2/release-artifact-verification`

**角色**：release owner、CI、reviewer。
**前置**：原生或多平台包族。

### 发布前构建、打包并实际运行产物

**何时用**：发布原生/多平台包家族时。**做法**：在匹配的原生 runner 上构建各平台二进制，传输并组装家族；验证组装结果，打不可变 tarball，在干净消费者中安装并驱动入口，之后才允许受保护发布；平台 tarball 先于入口，tag 加命名空间；用外部纯 Node 排练证明可执行、字节一致、ELF 架构正确。**完成信号**：干净消费者可安装并运行入口。**失败/例外**：缺平台、架构错误或安装/运行失败阻止发布；预发布演练仍打包安装。**证据限制**：只驱动入口，不覆盖每个行为；原生 runner 可能不可用。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-06-in-repository-landlock-release.md:1-45@687f282e

<a id="translation-pairing-merge-driver"></a>
**机制 ID**：`rationale-process-2/translation-pairing-merge-driver`

**角色**：pairing owner、merge author、CI。
**前置**：使用哈希配对双语产物的仓库。

### 翻译配对侧车的自定义合并驱动

**何时用**：双语配对使用 hash 侧车并需要合并时。**做法**：安装并探测驱动运行时；运行时缺失时让 Git 文本合并但返回冲突，绝不接受未验证元数据；要求双方 owner 的三方合并都干净，校验切换器与结构签名；只有双方与结构一致才记录合并 blob，绝不记录单边修改；畸形/缺失/其他策略/冲突一律 unresolved；提供 post-merge resolver，证明侧车未被改动且工作树字节等于独立合并。**完成信号**：干净合并后侧车记录正确。**失败/例外**：任一不确定即冲突并非零退出。**证据限制**：依赖结构签名正确性；运行时探测因平台而异。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-08-automatic-translation-pairing-merges.md:1-56@687f282e

<a id="terminology-authority"></a>
**机制 ID**：`rationale-process-2/terminology-authority`

**角色**：terminology owner、translator、doc author。
**前置**：共享概念的双语技术文档。

### 双语文档的单一术语权威

**何时用**：双语对共享领域概念时。**做法**：每个概念在术语源中只有一个绑定译法；迁移所有活跃配对并重录侧车，归档笔记冻结；校准资产/提示词正文也遵循该表，不能教会已被取代的译法；维护语义时不得改标识符、路径、API 名或机器可读值；只有真正合同术语才加全局行，重叠的常规词就地消歧。**完成信号**：活跃配对使用绑定译法，门禁通过。**失败/例外**：归档/冻结文档保留历史译法；常规重叠词不加全局行。**证据限制**：术语表覆盖靠人工；归档漂移是设计选择。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-chinese-contract-terminology.md:1-34@687f282e

<a id="committed-artifact-citations"></a>
**机制 ID**：`rationale-process-2/committed-artifact-citations`

**角色**：note author、reviewer、CI。
**前置**：引用会话或瞬时证据的决策记录与文档。

### 只引用已提交且可解析的工件

**何时用**：决策笔记或文档引用证据时。**做法**：只引用已提交、仓库内可解析的工件（笔记路径/名称、文档页路径、issue 编号）；把 session 序号替换为决策名，或删除并独立重述事实；回归用现在时反事实钉住；implemented 笔记陈述已交付现实；fixture/snapshot/归档笔记可豁免，但禁止索引式时间戳；用正例与近失例校准词法探测。**完成信号**：所有引用在当前树可解析。**失败/例外**：不可解析引用是评审问题；已知缺口是没有门禁禁止新增 session 序号。**证据限制**：探测是词法的，不验证引用内容。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-committed-artifact-citations.md:1-40@687f282e

<a id="fragment-anchor-integrity"></a>
**机制 ID**：`rationale-process-2/fragment-anchor-integrity`

**角色**：doc author、CI、site builder。
**前置**：文档站点与 Markdown 链接语料。

### Markdown 片段与渲染锚点完整性

**何时用**：Markdown 链接带 fragment，或文档要渲染成站点时。**做法**：校验 fragment（含同文件链接）对应真实 HTML 流中的 heading slug 或显式 `<a id>`；代码/注释不注册锚点；处理内联标记、下划线、占用集后缀、大小写；站点构建后对每个输出 HTML 再验证，失败于缺页/缺 id/歧义路由/畸形 href；源码校验与发布后校验相互独立。**完成信号**：源码与渲染输出中的锚点都可解析。**失败/例外**：外部/非 Markdown/根绝对目标不在范围；渲染器差异用显式别名。**证据限制**：JS 动态锚点不覆盖；slug 算法随渲染器变化。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-md-fragment-anchor-gate.md:1-33@687f282e；deepseek-harness/.agents/notes/archived/process/2026-08-13-published-document-fragments.md:1-30@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-md-fragment-anchor-gate.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-08-13-published-document-fragments.md:1-30@687f282e

<a id="publication-identity-normalization"></a>
**机制 ID**：`rationale-process-2/publication-identity-normalization`

**角色**：release owner、author、CI。
**前置**：以新 scope 发布 fork/vendor 包的项目。

### 发布身份规范化

**何时用**：vendored/分叉包要发布，且不能占用上游 npm 名时。**做法**：用带分隔的完整 token 规则批量改到自有 scope；显式枚举不可见站点（属性访问、名字即数据的常量、文档正文），冻结历史/vendor 正文；打包时断言发布集；在第三方 notices 保留上游名；把已移除名字排除出版本年龄检查；提供幂等映射脚本与 `--check`（零残留、每处精确编辑都落地），在 hygiene 运行；rebase 时重放脚本而非解冲突。**完成信号**：活跃 manifest/代码全用新 scope，notices 保留上游。**失败/例外**：残留旧 scope 或漏改失败；历史正文可保留旧名。**证据限制**：不可见站点靠枚举而非发现；正文可能有意保留旧名。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-10-vendor-package-rescope.md:1-52@687f282e

<a id="release-access-sequences"></a>
**机制 ID**：`rationale-process-2/release-access-sequences`

**角色**：release owner、author、CI。
**前置**：发布多个 scope/序列的 monorepo。

### 访问级别属于发布序列而非 scope

**何时用**：同一 npm scope 下有不同可见性序列时。**做法**：在 manifest 中按序列声明 access，并用 workspace 约束阻止新成员漂移；任何发布路径都不传 `--access`；兼容范围用 `workspace:^`，二进制必须匹配入口时用精确 `workspace:*`；明确记录“转公开不可逆”。**完成信号**：每个成员按所属序列打包。**失败/例外**：错误 access 的成员或 `--access` 调用失败；可见性变更需序列级决策。**证据限制**：公开后难撤回；依赖 registry 语义。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-13-public-vendor-and-native-sequences.md:1-46@687f282e

<a id="scoped-publication-credentials"></a>
**机制 ID**：`rationale-process-2/scoped-publication-credentials`

**角色**：asset publisher、security owner。
**前置**：向 CDN/对象存储发布资产的项目。

### 前缀受控的资源发布凭据

**何时用**：向 CDN/对象存储发布二进制或媒体资源时。**做法**：只接受允许列表中的文件名并验证文件类型；写入固定前缀，设置明确 content-type/缓存策略，检查响应；凭据只作用于该前缀；资源仓作为回滚源；拒绝通用 uploader，即使更方便。**完成信号**：允许列表内资源可上传并解析。**失败/例外**：名单外名称/类型在上传前中止；新增资源需更新名单与前缀策略。**证据限制**：各提供商 scope 语义不同；前缀内被攻破的 token 无法防。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-17-readme-assets-on-cdn.md:1-36@687f282e

<a id="partitioned-test-execution"></a>
**机制 ID**：`rationale-process-2/partitioned-test-execution`

**角色**：test owner、CI。
**前置**：需合并覆盖率的大型 Vitest/Jest 风格套件。

### 作业内测试分区与合并阈值

**何时用**：测试套件很慢但覆盖率必须在一次作业内完整。**做法**：固定分区数，不用耗时自适应；从测试 lister 构建清单（收窄并剔除豁免项）；按持久化历史耗时用 LPT 最小堆分配，最重优先；每分区一个 worker 和临时配置，拒绝空分区；子进程抑制阈值并各写一个 blob；协调器校验精确 blob 集合，再由一次合并运行拥有全部阈值；spawn/信号/缺失/多余/合并失败均失败。**完成信号**：每个测试恰好运行一次，合并阈值通过。**失败/例外**：测试失败仍通过 reportOnFailure 报告；缺失/多余 blob 失败。**证据限制**：耗时历史可能过期；分区启动有开销。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-18-in-job-partitioned-coverage.md:1-54@687f282e

<a id="release-gated-publication"></a>
**机制 ID**：`rationale-process-2/release-gated-publication`

**角色**：release operator、docs owner、reviewer。
**前置**：与发布绑定的公开文档。

### 发布标签触发的公开文档发布

**何时用**：公开文档与版本发布绑定。**做法**：只用 `workflow_dispatch` 从 release tag 触发，绝不由 PR/master 检查触发；构建前运行与 npm 发布相同的 release:verify（refs/tags、家族前缀、树中存在版本），并使用完整历史 checkout；environment 的 tag 策略加必需评审作为第二层；公开源链接保留 master，因为镜像只在发布时推进；生产文档构建仍由 PR/master CI 覆盖。**完成信号**：tag 分派通过校验并部署。**失败/例外**：分支分派或 tag 不匹配在构建前失败；hotfix 也必须打 tag。**证据限制**：不校验文档内容；依赖宿主环境保护。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-21-documentation-site-tag-release.md:1-42@687f282e

<a id="resolution-alias-completeness"></a>
**机制 ID**：`rationale-process-2/resolution-alias-completeness`

**角色**：build owner、CI。
**前置**：采用路径别名解析的 TypeScript/node monorepo。

### 生成显式解析别名并断言完整性

**何时用**：workspace 包需要 path alias，且通配符解析过慢或会静默漏包。**做法**：把每包显式别名生成到标记区域，保留手写别名；只为目录名匹配的包生成，歧义即抛错；删除 wildcard 回退，并断言每个含 src 的包都已映射；`--check` 命名缺口并在 static 门禁运行；保留 JSONC 注释；入口守卫在含空格/Windows 路径时不得静默 no-op。**完成信号**：所有源包有显式映射且启动改善。**失败/例外**：漏映射/歧义/漂移失败；标记外手写别名保留。**证据限制**：目录名耦合是约定；启动测量依赖环境。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-27-explicit-workspace-path-aliases.md:1-62@687f282e

<a id="environment-conditional-install"></a>
**机制 ID**：`rationale-process-2/environment-conditional-install`

**角色**：CI owner、developer。
**前置**：具有文件系统特定包管理器行为的跨平台仓库。

### 按文件系统条件选择安装方式

**何时用**：CI/宿主机工作区使用非标准文件系统，或安装因解析错误失败时。**做法**：检测工作区文件系统（例如仅 ReFS 用 block-clone，NTFS 用默认）；记录底层机制与工具来源（哪个 pnpm 构建支持该 flag）；验证实际 CLI flag 生效，因为此版本可能忽略 `.npmrc`/环境变量；记录 runner 镜像依赖及布局变化后的失败模式。**完成信号**：对应文件系统安装成功且解析冒烟通过。**失败/例外**：把一种策略强加给另一文件系统会失败；重建 runner 后需重验。**证据限制**：高度环境特定；工具 flag 会变化。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-30-windows-refs-store-block-clone-install.md:1-48@687f282e

<a id="test-timeout-budget"></a>
**机制 ID**：`rationale-process-2/test-timeout-budget`

**角色**：test owner、CI owner。
**前置**：反复出现超时的 CI 泳道。

### 修复超时根因并对齐泳道预算

**何时用**：某泳道反复超时，或同类套件预算不一致。**做法**：先定位并移除算法成本（例如 O(names×manifests) 的重复加载），优先显式传递已加载数据而不是隐藏第二层缓存；确认输出逐字节一致；之后才把预算对齐到同类泳道；在 workflow spec 中钉住环境值并加负向对照。**完成信号**：套件在共享预算内完成。**失败/例外**：只调预算不降成本被拒；确实更重的泳道可有单独预算。**证据限制**：超时可能多因；共享 runner 波动。

来源：deepseek-harness/.agents/notes/archived/process/2026-08-31-serial-windows-notices-timeout-budget.md:1-31@687f282e

<a id="project-field-ownership"></a>
**机制 ID**：`rationale-process-2/project-field-ownership`

**角色**：automation owner、security owner。
**前置**：基于 GitHub Projects 的规划自动化。

### 项目规划元数据的单一所有者

**何时用**：自动维护 issue 规划字段时。**做法**：只存于一个 Project 字段系统；拒绝 issue-backed 字段或错误类型；读用仓库 token，Project 查询用只读 App token，生命周期变更才用可写 token；只在定义事件且字段为空时初始化，按 Project 时区；字段重命名/类型变化 fail-closed；记录无 CAS 的 last-write-wins。**完成信号**：读取用只读凭据，写入仅限生命周期事件。**失败/例外**：错误 schema/凭据失败；遗留字段加前缀且不读。**证据限制**：无 CAS，并发会覆盖；Project API 会变化。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-02-project-local-issue-planning-fields.md:1-44@687f282e

<a id="version-coherence-gate"></a>
**机制 ID**：`rationale-process-2/version-coherence-gate`

**角色**：release owner、CI、reviewer。
**前置**：共享单一发布版本的 monorepo。

### 工作区版本一致性门禁

**何时用**：monorepo 共享一个发布版本时。**做法**：用名称谓词（与 bump writer 的写入范围一致）声明版本不变量；在始终运行的 static 泳道检查，而非只在 release 泳道；接受与 writer 一致的预发布段；明确该门禁不能替代分支保护的 up-to-date base/merge queue。**完成信号**：所有命名包版本等于根版本。**失败/例外**：任一命名包版本漂移失败；非该谓词的包不在范围。**证据限制**：不防 stale base；谓词与 writer 可能各自漂移。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-03-workspace-version-coherence-gate.md:1-30@687f282e

<a id="evidence-driven-performance"></a>
**机制 ID**：`rationale-process-2/evidence-driven-performance`

**角色**：performance author、reviewer、CI。
**前置**：任何性能敏感变更。

### 证据驱动的性能工作

**何时用**：提出性能优化或修改预算时。**做法**：优化前测量；聚焦归因结合独立计时的后端/浏览器端点，比较冷/热、保留内存和合成负载，收紧预算有负向对照；日志、生成/发布、顺序、取消、释放等行为证据独立于时间。历史声明区分 merged/superseded/author-reported/estimate，以最终 diff/源码为准；紧预算随优化提交，基线层可独立合并。**执行边界**：这是候选筛选与测量卡程序，源 Skill 不提供基准实现或新CI政策，每次优化由真实归属方补齐可执行测量。源文没有紧急事后补测豁免。无基线/无对照或行为削弱的结论应退回；共享主机噪声与生产差异仍需披露。

**指导本身的验证**：文档/链接一致性与Skill元数据；真实优化的基准和功能证据由其归属方执行，不能把指导文件检查当作性能收益证明。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-06-evidence-driven-performance-skill.md:1-49@687f282e

<a id="self-hosted-trust-routing"></a>
**机制 ID**：`rationale-process-2/self-hosted-trust-routing`

**角色**：CI owner、security owner。
**前置**：处理 PR 的自托管 CI runner。

### 自托管 runner 的信任谓词与隔离

**何时用**：把 PR 作业路由到自托管/第三方 runner 时。**做法**：要求显式信任谓词：非 Dependabot 作者、非 fork 且 head repo 与当前仓库一致；即使仓库设置改变也保留；临时 runner 可刻意去掉持久 VM 规则；在 runner temp 内隔离 toolcache/安装路径，执行路径检查拒绝外部安装；禁止全局链接；每作业清理临时状态；用真实路由表达式加负向对照测试。**完成信号**：受信 PR 在隔离环境中运行，未受信上下文被拒。**失败/例外**：fork/Dependabot 或路径逃逸失败；临时 provider 可豁免持久 VM 规则。**证据限制**：谓词无法识别所有被攻破账号；provider 行为不同。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-06-node-compatibility-selfhosted.md:1-36@687f282e

<a id="selective-policy-evaluation"></a>
**机制 ID**：`rationale-process-2/selective-policy-evaluation`

**角色**：automation owner、reviewer。
**前置**：带作用域令牌的事件驱动仓库自动化。

### 先判资格再执行昂贵策略

**何时用**：Issue/PR事件可能消耗Project凭据时。**做法**：先判断策略资格再读取引用/创建验证token；信息性引用的策略验证只用REST，解析性引用须指向真实Issue；用受信默认分支能力标记选择preflight或完整legacy路径，执行错误不触发fallback；剪掉无关生命周期订阅/无效review，保留required job。**边界**：信息性引用免Project验证读取，不等于免生命周期写入；opened事件仍由planning owner为每个实际引用Issue（包括信息性引用）在空值时初始化Start Date，不覆盖既有值。缺marker保留旧human完整路径及Bot/App豁免；新策略不能据此承诺零runner成本、无竞争或节省了实际Actions费用。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-07-selective-issue-policy-evaluation.md:1-44@687f282e

<a id="dependency-face-classification"></a>
**机制 ID**：`rationale-process-2/dependency-face-classification`

**角色**：package author、verifier、reviewer。
**前置**：从单一 manifest 同时发布浏览器与 Node 表面的包。

### 按分发内容分类依赖区段

**何时用**：同一包分发浏览器与Node表面时。**做法**：仅浏览器实现/静态输入/共享React放 devDependencies；实际第三方Host运行时值依赖优先放 dependencies；纯类型引用放 devDependencies，不产生Host运行时依赖，绝不是“两边都不放”。双面包保留Host库；被分发代码的许可披露独立于npm区段，依真实构建配置解析；分类基于源码且幂等，发布检查拒绝React安装泄漏。共享身份的workspace导出仍按 published-dependency-faces 的peer+dev/审核分类处理。**验证**：目标清洁树类型检查、Host闭包与分发披露均须符合；banner注入和第三方许可不由该机制自动解决。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-08-browser-third-party-build-inputs.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:23-35@687f282e

<a id="approval-status-semantics"></a>
**机制 ID**：`rationale-process-2/approval-status-semantics`

**角色**：approval bot、reviewer、merge queue。
**前置**：自定义批准/积分合并门禁。

### 区分待满足条件与发布器故障

**何时用**：加权审批状态被用作合并门禁时。**做法**：草稿、点数不足、或来自可写评审者的有效 CHANGES_REQUESTED 都发布 pending；阻塞评审优先于点数；只有 ready + 达阈值 + 无阻塞才 success；发布器运行健康用独立作业；消费者必须查看 description/reviews 区分阻塞与其他 pending；必需状态仍然阻塞合并。**完成信号**：状态矩阵与具体条件一致。**失败/例外**：驳回/委托会重算；发布器异常应发布 error 而非 pending。**证据限制**：消费者可能误读描述；评审状态可能在发布中变化。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-09-blocked-weighted-approvals-remain-pending.md:1-34@687f282e

<a id="workflow-identity-verification"></a>
**机制 ID**：`rationale-process-2/workflow-identity-verification`

**角色**：publisher owner、security reviewer。
**前置**：由其他工作流触发的特权工作流。

### 按路径而非显示名识别受信工作流

**何时用**：`workflow_run` 事件触发特权发布器时。**做法**：匹配精确 `workflow_run.path`，不用显示名；要求 `pull_request_review` 触发且运行成功；从 `display_title` 解析 PR 编号并验证关联；比较当前 head 拒绝过期评审；负向测试覆盖编号名称、错误路径/事件、失败运行、非法标题、被取代 head；移动工作流必须同步更新期望路径。**完成信号**：路径/事件/成功/当前 head 全部匹配才发布。**失败/例外**：任一不匹配拒绝。**证据限制**：路径可被重命名复用；依赖事件载荷完整性。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-10-approval-review-workflow-identity.md:1-26@687f282e

<a id="precompiled-asset-release"></a>
**机制 ID**：`rationale-process-2/precompiled-asset-release`

**角色**：release owner、packager、reviewer。
**前置**：以包形式发布重型二进制依赖的项目。

### 历史预编译资产要求与独立引擎归属

**状态与作用**：早期Note要求独立版本、asset-only export、无install编译、显式dispatch/版本tag/受保护环境发布，以及receipt、源码pin/patch/full diff、许可证与notices验证。其链接的 `native/libreoffice-wasm/package.json`、release工作流和包装测试在固定提交不存在，不能当成现有可执行门禁。后续独立LibreOffice kit由外部仓库拥有API/Worker/引擎资格与发布；Harness精确消费npm版本和锁文件，不编译或发布kit。**迁移要求**：保留发布侧编译、来源核验与真实引擎/安装/offline资格，不把移除的产品构建复制为假门禁；缺少实际发布者/合格产物时记为实现阻塞。首次发布未完成是历史限制，不是允许未资格产物上线的例外；源文也未证明receipt是加密签名。目标产品验证仍planned。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-11-independent-libreoffice-package.md:1-32@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-14-independent-libreoffice-kit.md:11-31@687f282e

<a id="publication-default-policy"></a>
**机制 ID**：`rationale-process-2/publication-default-policy`

**角色**：release owner、package author、CI。
**前置**：有公开 release 的实验包族。

### 实验包默认公开 + 私有 denylist

**何时用**：实验包发布策略需要同时避免隐藏与误发私有原型。**做法**：实验包默认“可发现的公开发布”；只维护一份具名私有 denylist；私有原型必须同时有 denylist 条目和 private manifest；workspace 约束要求公开 manifest 省略 private 且设置 access public，并拒绝不一致；保留命名前缀；声明发布既不承诺稳定性也不承诺支持。**完成信号**：manifest 与 denylist 一致。**失败/例外**：冲突状态失败；私有原型必须两处同时改。**证据限制**：公开几乎不可逆；denylist 需要 owner。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-12-experimental-publication-denylist.md:1-28@687f282e

<a id="repository-reference-policy"></a>
**机制 ID**：`rationale-process-2/repository-reference-policy`

**角色**：doc author、CI。
**前置**：具有长期文档与被改写历史的仓库。

### 长期可用的仓库引用形式

**何时用**：长期正文引用与原生包发布元数据。**做法**：历史正文用release tag/PR/run/job ID，当前文件用相对链接；扫描tracked及未忽略新文件，在本地Git对象库拒绝明确commit，保留blob/schema/branch等其他hex，不联网（包括partial-clone懒取）。原生源manifest保留public source home；workflow打包只在可丢弃输入中投影真实workflow仓库身份，交付并发布经核验的原tarball，不改源manifest。无workflow的本地打包仍保留public元数据。**验证**：引用门禁、源文件未改、workflow/local身份差异及核验后tarball不变分别举证；不宣称远端tag不可变或本地对象完整。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-12-maintained-repository-references.md:1-32@687f282e

<a id="approval-delegation"></a>
**机制 ID**：`rationale-process-2/approval-delegation`

**角色**：delegating reviewer、recipient、approval bot。
**前置**：允许评审者授权的自定义批准系统。

### PR 级审批委托与单跳计分

**何时用**：审批系统允许评审者转交权限时。**做法**：只允许可写、非作者的账号在 PR 内委托；转移点数按发送者权重只计一次，绝不链式；驳回发送者既有 approvals/change requests 使原生评审状态一致；最新存活的合格命令生效；编辑需作者不可变账号 id；自委托或提交新 review 恢复自己的决定；同时间戳偏向 review，后续驳回不能复活；编辑/删除重算；过滤评论、解析 live open head、跳过 closed/merged、缺失历史即失败；每 PR 并发控制。**完成信号**：有效委托只转移一次并重算状态。**失败/例外**：链式/自委托/过期 head 拒绝。**证据限制**：评论排序竞争；委托语义属项目政策。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-15-pr-approval-delegation.md:1-34@687f282e

<a id="approval-scoring"></a>
**机制 ID**：`rationale-process-2/approval-scoring`

**角色**：approval bot、PR author、reviewer、maintainer。
**前置**：加权批准系统；权重因项目而异。

### 审批评分中的作者封顶信用

**何时用**：PR 作者在同仓库有已合并贡献时。**做法**：作者（不是评审者）按不可变账号累计 `min(100, merged PR count) × 11 / 1000`，上限1.1，到100个匹配 PR 即停；作者自己的 review 不计，作者信用不能单独达默认2分。普通1分批准在无归属加成时，90个历史 PR 合计1.99仍 pending，91个为2.001；阻塞评审不受总分影响，显示舍入不能授予准入。draft、blocker 或评审分已足够时跳过历史查询，缺失/不完整历史则 fail closed。**迁移执行**：使用 [可选审批模块](github-approval.md)，另行部署受信 publisher、App 绑定与原生保护。**完成信号**：同仓库作者匹配、cap、90/91边界、作者单独拒绝与 blocker 交互均有真实对应证据。这里的完整目标验证仍为 planned；局部算术测试不等于服务端批准。贡献历史不代表评审质量。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-16-author-approval-credit.md:1-26@687f282e

<a id="build-provenance"></a>
**机制 ID**：`rationale-process-2/build-provenance`

**角色**：release engineer、packager、uploader。
**前置**：带更新源、需要打包的桌面/CLI 发布。

### 将构建版本作为显式输入

**何时用**：打包产物需要版本，且上传要校验产物时。**做法**：用显式参数（或确定性 auto-next index）解析版本，并让同一输入流经打包、更新 feed 与上传校验；绝不改写被跟踪 manifest 来打版本；auto 编号必须查询真实 feed 并丢弃不完整列表，避免覆盖已发布安装包；每个产物记录 commit 与 dirty；production 只在上传成功后打 tag，且绝不把已完成上传改为失败；上传版本从打包完成记录读取，而非变量。**完成信号**：干净树构建产物带版本+commit 且仓库无 diff。**失败/例外**：索引冲突拒绝；dirty/test/local 构建不打 tag。**证据限制**：feed 列表可能不完整；dirty 构建仍可能存在。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-21-desktop-build-version-as-input.md:1-38@687f282e

<a id="clean-tree-build-invariant"></a>
**机制 ID**：`rationale-process-2/clean-tree-build-invariant`

**角色**：build owner、CI、packager。
**前置**：消费 workspace 包的打包应用。

### 干净检出构建不变量与打包导入检查

**何时用**：bundle依赖workspace构建产物时。**做法**：先构建所需输出，再顺序bundle，清洁树复现不依赖stale lib；独立与旧workspace模式的字节一致是显式对比证据，不是源文已有的持续自动字节门禁。真正自动守卫是 `moduleParsed`：按main/preload允许列表检查static/dynamic import/require裸specifier，读module import records而非chunk元数据，拒绝时不输出、签名或公证。目标仍须执行清洁构建与对比；该门禁只证明打包导入合同，不证明运行时业务。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-22-desktop-main-bundle-after-workspace-tsdown.md:1-30@687f282e

<a id="release-range-policy"></a>
**机制 ID**：`rationale-process-2/release-range-policy`

**角色**：package author、release owner、CI。
**前置**：各包族独立发布的 workspace。

### 按发布家族确定依赖范围

**何时用**：workspace 内包有不同发布节奏。**做法**：同一次产品发布的包用精确 `workspace:*`，独立发布的 vendor/native 用仅补丁的 `workspace:~`；按依赖目标而非消费者目录适用，覆盖根工具、apps、peer、dev 和可选平台依赖；workspace 门禁拒绝错误范围形式；打包后校验实际输出版本。**完成信号**：各目标按家族范围声明，packed manifest 正确。**失败/例外**：DSH 使用 tilde 或 vendor 使用 caret/精确都失败；新家族需更新政策而非目录豁免。**证据限制**：家族语义依赖维护纪律；打包工具行为可能变化。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md:1-28@687f282e

<a id="runtime-support-contract"></a>
**机制 ID**：`rationale-process-2/runtime-support-contract`

**角色**：runtime owner、CI、dependency owner。
**前置**：发布 engines 范围声明的库/应用。

### 将运行时范围视为安装后工作区合同

**何时用**：声明 engines/运行时下限时。**做法**：下限同时由源码特性引入点和已安装依赖的最高 engine 声明推导；排除 EOL/不支持线而非宣传死线；CI 钉住精确下限而非浮动大版本；类型定义钉在同一线，使仅新版本 API 在所有环境编译失败；引擎范围、兼容矩阵与文档同一变更更新。**完成信号**：floor 版本 CI/安装通过且文档一致。**失败/例外**：依赖下限高于宣传范围会导致 engine-strict 安装失败。**证据限制**：依赖下限会移动；EOL 政策在外部。

来源：deepseek-harness/.agents/notes/implemented/process/2026-07-06-node-engine-floor.md:1-39@687f282e

<a id="ci-completeness-reference"></a>
**机制 ID**：`rationale-process-2/ci-completeness-reference`

**角色**：CI owner、release owner、reviewer。
**前置**：单一必需聚合门禁的高优化 CI。

### 独立串行 CI 完整性参考

**何时用**：优化后的PR聚合可能遗漏工作时。**做法**：master push上按主机运行无选择器、并发1的完整聚合，诊断内核矩阵不冒充required PR状态；延迟从完成的作业时间测量，不把目标写成超短timeout；平台归属和外部崩溃进程边界明确。**当前容量事实**：serial Linux依赖vm-backup，Windows依赖dsh-win-ci；hosted macOS被禁用，没有standard-hosted serial Linux。源文的“组织池不可用时仍能运行”目标尚未由这些活动引用实现，必须保留为可移植性缺口。目标只有真正提供并运行替代容量后才能声称满足；失败用于调查，不削弱完整聚合。合并后检测窗口与重复setup是已披露代价。

来源：deepseek-harness/.agents/notes/implemented/process/2026-07-21-serial-cross-platform-ci-reference.md:1-52@687f282e

<a id="release-families"></a>
**机制 ID**：`rationale-process-2/release-families`

**角色**：release owner、publisher、release manager、CI。
**前置**：多包族发布。

### 独立发布家族与 registry 驱动发布

**何时用**：多包族发布节奏不同。**做法**：家族独立版本/tag/bump/工作流；本地写版本并提交，CI只检查上传、人工合并后打tag；逐tarball查registry：缺失发布、同版本同integrity跳过、同版本不同integrity失败，退避后先重查。dist-tag override对整族预检，任一错误拒绝整次。**每个PR和master push**均无凭据pack整族；publish仅manual dispatch，经人工审批与全局并发组。重跑同一artifact应跳过，新版本只发布一次；不得覆盖registry。tag漂移、可复现字节假设与旧集合回退latest的风险须披露。

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:1-186@687f282e

<a id="optional-dependency-load-gate"></a>
**机制 ID**：`rationale-process-2/optional-dependency-load-gate`

**角色**：package author、verifier。
**前置**：含可选 peer/依赖的已发布包。

### optional 依赖绝不在模块作用域加载

**何时用**：manifest 声明 optionalDependencies 或 optional peer 时。**做法**：绝不静态 import 一个允许缺失的包；只允许类型导入/会被擦除的绑定；拒绝裸 import、值绑定和 star re-export；不要把动态 `import()` 当解法，它只把失败推迟到首次使用；只有确实必需、初始化与启动无关的 CJS Host 依赖可用 `createLazyRequire`；报错点名包、使其 optional 的声明和两条出路。**完成信号**：所有 optional 依赖在模块作用域无值加载。**失败/例外**：类型导入与声明的 lazy require 允许。**证据限制**：不覆盖 vendor；某些动态形式无法静态阻止。

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:1-186@687f282e

<a id="published-artifact-verification"></a>
**机制 ID**：`rationale-process-2/published-artifact-verification`

**角色**：release verifier、CI。
**前置**：已发布的包族。

### 验证已安装产物而不仅是 workspace

**何时用**：发布 tarball 时。**做法**：把整族打进一个目录并记录上传顺序；装进带独立 npm cache 的一次性消费者，驱动已安装入口；缺失必需依赖失败，允许省略 optional（除非指向被排除包）；目录里有跨序列 tarball 时按内容读取；失败时输出 npm HTTP 诊断。**完成信号**：tarball 在干净消费者中安装且入口可运行。**失败/例外**：安装失败/入口失败阻止发布；optional 缺失允许。**证据限制**：单条命令只证明 payload 完整与范围可解析，不证明行为；不经过真实 registry。

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:1-186@687f282e

<a id="published-dependency-faces"></a>
**机制 ID**：`rationale-process-2/published-dependency-faces`

**角色**：package author、dependency verifier、reviewer。
**前置**：发布具有多个构建面的包的 monorepo。

### 依赖区段跟随已发布产物归属

**何时用**：包同时有 client/Host/类型关系时。**做法**：按发布面区分：client/纯类型/仅元数据 → devDependencies；Host 运行时值导入 → 仅当 duplicate-safe 或已做导出分类时进 dependencies；需要共享身份的导出 → peer + dev；选包机械化（client 目录 + 显式标记）并维护窄的 include/exclude/host 名单；拒绝未知/陈旧/冗余/重复/重叠/无效策略项；实验包不享受组级豁免；从构建配置扫描 worker/子进程入口而非猜源码；在无新构建产物的源码树运行，存在未分类导出时阻止 `--fix` 写入。**完成信号**：所有导入有分类，区段与安装图一致。**失败/例外**：经评审的包/导出分类与配置专用 dev 边例外。**证据限制**：banner 注入导入不可见；Host-only 覆盖依赖显式名单；改分类会改变安装图。

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:1-97@687f282e；deepseek-harness/.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md:1-40@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:1-97@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md:1-40@687f282e

<a id="ci-runner-failover"></a>
**机制 ID**：`rationale-process-2/ci-runner-failover`

**角色**：CI owner、operator、security owner。
**前置**：具有多个 runner 池/提供方的 CI。

### 显式且受控的 CI runner failover

**何时用**：runner 池降级，或评估第三方 runner 时。**做法**：failover 是写者可管理的显式变量，绝不默认；只重定向具名参与作业；排除持凭据、发布形态、spec 钉死基准和需要特殊宿主能力的作业；正确性泳道不得耦合到无关 failover 状态，失败实验回到 hosted；路由前在实际池重验吞吐与失败可复现性，并记录未来约束；用 workflow spec 钉住路由并演练回退。**完成信号**：设置变量后仅名单内作业迁移且通过隔离检查。**失败/例外**：凭据/发布作业始终 hosted；池故障不成为默认。**证据限制**：休眠分支会老化；provider 行为与费用不同。

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-06-python-runtime-windows-hosted.md:1-25@687f282e；deepseek-harness/.agents/notes/implemented/process/2026-09-09-blacksmith-failover-leg.md:1-27@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-06-python-runtime-windows-hosted.md:1-25@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-09-blacksmith-failover-leg.md:1-27@687f282e

<a id="artifact-promotion-gate"></a>
**机制 ID**：`rationale-process-2/artifact-promotion-gate`

**角色**：packager、release verifier。
**前置**：多产物发布流水线。

### 并行产物泳道在提升前汇合

**何时用**：一个构建产出多个产物，或工具在签名/公证时修改产物。**做法**：工具会修改时给每条泳道独立不可变副本；打包器对目录目标跳过 hook 时，显式写入并验证配置；两泳道都结束后才传播错误和清理；只有两泳道都成功且 feed/config 校验通过才提升产物集；完成记录最后写，使既有上传校验拒绝不完整发布；独立输出目录避免并发写 metadata。**完成信号**：两泳道成功，产物集整体提升且完成记录最后落地。**失败/例外**：任一泳道失败则不提升、不写完成记录；目录-only 构建仍可公证 App。**证据限制**：磁盘/带宽成本；单次计时样本不能归因提速。

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-09-parallel-macos-notarization.md:1-37@687f282e

<a id="schema-change-acknowledgement"></a>
**机制 ID**：`rationale-process-2/schema-change-acknowledgement`

**角色**：schema owner、author、reviewer、CI。
**前置**：有兼容性承诺的持久化格式。

### 逐根 schema 变更确认

**何时用**：持久化 schema/类型或 writer 版本变化时。**做法**：规范化传递类型图，排除源码位置、别名、注释、属性顺序；把确认绑定到受影响根的 after schema，并串成 predecessor → successor；保守分类：可选新增、必选改可选、普通事件新增可同版本；其他结构变化需显式 same-version 决策或 header bump；同版本要求读取器证据（旧读取器恢复、安全忽略可选、或执行/修改/尾部修复前拒绝必需特性）；每个结构差异都要确认，写清双向读取与已执行检查；生成器绝不编造说明或测试结果；冻结已接受的机器记录/检查点，历史格式由 writer 常量推导。**完成信号**：当前源码匹配终端记录，链无歧义。**失败/例外**：未确认、陈旧链或缺 header bump 失败。**证据限制**：只证明当前树一致，不证明历史未被改写或说明符合运行行为；opaque 结构不可见。

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e；deepseek-harness/.agents/notes/implemented/process/2026-09-17-persistence-schema-review.md:1-39@687f282e；deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-39@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-17-persistence-schema-review.md:1-39@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-39@687f282e

<a id="product-boundary-isolation"></a>
**机制 ID**：`rationale-process-2/product-boundary-isolation`

**角色**：product owner、verifier、CI。
**前置**：具有可选/实验插件族的产品。

### 证明可选包留在默认产品之外

**何时用**：发布 optional/experimental 包，或默认入口/配置变化时。**做法**：从每个 app/runtime 出发遍历 runtime/optional/peer 依赖并解析 alias；用生产 patch 引擎组合有效配置，检查 disabled 行与 patch 后的 include 树；检查两个打包阶段的输入图和最终 HTML 图；从产品入口遍历已安装 packed 图；运行真实 Host 启动与 Client 激活 smoke，并用真实实验插件做负向对照；只有声明的 optional bundle 是例外，缺失默认根即失败。**完成信号**：默认产品不依赖可选包，负向对照能被检出。**失败/例外**：任何把可选包带入默认入口的边失败；独立 preview 在产品图外。**证据限制**：不覆盖后续每条用户触发路径；计算路径 patch 可能逃过静态发现。

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-12-default-product-experimental-isolation.md:1-39@687f282e

<a id="build-artifact-check-split"></a>
**机制 ID**：`rationale-process-2/build-artifact-check-split`

**角色**：build owner、CI、reviewer。
**前置**：存在重复编译产物消费者的 CI。

### 将产物发射与完整诊断所有权分离

**何时用**：多个 CI 作业都需要编译产物，但完整诊断重复昂贵时。**做法**：必需普通构建和公开 build/typecheck 保留完整 aggregate 检查；artifact 构建用一个串行 `tsc -b` 编译全部 project reference，只省略各 root 额外的 test/script program，保留包诊断、emit 字节和 Host→Client 顺序；只有另一个分析器拥有语义时才用 `--noCheck` 发射，并记录 pending checks 以便后续增量构建仍能诊断；fixture 证明两条路径都拒绝包错误并比较 JS/声明/map/build-info；删除完整构建前必须把 aggregate 检查转交另一阻塞 owner。**完成信号**：两条路径包产物一致，完整构建仍诊断 aggregate 错误。**失败/例外**：artifact 路径有意不诊断 aggregate-only 错误。**证据限制**：单主机计时；fixture 不是完整行为证明。

来源：deepseek-harness/.agents/notes/implemented/process/2026-10-05-pr-artifact-typechecks.md:1-45@687f282e

<a id="lossless-performance-change"></a>
**机制 ID**：`rationale-process-2/lossless-performance-change`

**角色**：optimizer、reviewer、CI。
**前置**：编译器/打包器优化工作。

### 以字节与诊断平价约束的构建提速

**何时用**：优化构建/类型检查，或为速度改变工具行为时。**做法**：建立基线；交叉运行变体并保留同代码对照组与多样本；用代表性文件哈希证明输出逐字节一致，诊断集合不变；任何有意的行为/诊断所有权变化必须单独声明并记录新 owner；为每项加守卫和一个“移除守卫即失败”的负向对照；记录 RSS、关键路径与测量限制。**完成信号**：所有哈希一致，增益超过对照波动。**失败/例外**：未声明的字节/诊断变化阻止。**证据限制**：共享主机噪声；并非所有输出都可比较。

来源：deepseek-harness/.agents/notes/implemented/process/2026-10-11-lossless-build-speedups.md:1-136@687f282e

<a id="module-evaluation-invariant"></a>
**机制 ID**：`rationale-process-2/module-evaluation-invariant`

**角色**：package author、verifier。
**前置**：被其他模块导入的 ESM/CommonJS 包。

### 可导入包源码禁止顶层 await

**何时用**：包源码可被其他模块导入，或入口需要异步启动时。**做法**：入口使用显式 `async function main()`；定义失败行为（退出码、stderr、就绪信号、清理）；用 AST 规则覆盖模块作用域的 `await`、`for await`、`await using`，包括顶层 if/块/try/循环/switch/条件/export 初始化/计算成员名；只排除 bin（`#!` 或 manifest bin 指向），并钉住排除清单；为空语料/缺 `.tsx`/缺 `src/` 增加 corpus guard；在共享 hygiene 注册。**完成信号**：所有可导入源码同步求值，入口自行处理失败。**失败/例外**：bin 与已记录范围例外；第三方/apps 不在范围。**证据限制**：banner 注入/生成代码可能逃过；不覆盖应用层。

来源：deepseek-harness/.agents/notes/implemented/process/2026-10-14-no-top-level-await-in-packages.md:1-45@687f282e

<a id="supply-chain-verification"></a>
**机制 ID**：`rationale-process-2/supply-chain-verification`

**角色**：supply-chain owner、CI、maintainer。

### 供应链漂移、公告与许可证验证（提案）

**只作提案，未实施，不得声称自动保证。** 目标：从 manifest 记录的 SHA 加签入 patch 重建 vendor 并 diff，任何无法解释的差异失败；按计划与 lockfile 变更 PR 扫描安全公告；断言许可证文件与 manifest license 字段匹配清单；用 Renovate 或定时 agent 提交小型依赖更新 PR 并走完整门禁，vendor 排除并走同步流程。**前置**：上游仓库访问（可能是私有镜像并需 token）、patch 文件转换、扫描器选择。**失败/例外**：上游不可达时降级为本地定时任务；不把 vendored 包交给自动更新。

**做法**：① 从 manifest 记录的 SHA 加签入 patch 重建 vendor 并 diff，逐条解释或失败；② 对计划发布与 lockfile 变更 PR 跑安全公告扫描；③ 核对许可证文件与 manifest license；④ 用 Renovate/定时 agent 提小型依赖更新 PR 并走完整门禁，vendored 包排除并转入同步流程。

**完成信号**：许可证、漂移与公告三项检查在目标 CI/定时任务落地并分别通过正例与反例；落地前只能按提案记录。**证据限制**：本条目只有提案与验收标准，没有执行证据；私有上游仓库可能需要凭据或降级为本地任务。

来源：deepseek-harness/.agents/notes/proposed/process/2026-06-11-supply-chain-and-vendor-drift.md:1-35@687f282e

<a id="generated-inventory-drift"></a>
**机制 ID**：`rationale-process-2/generated-inventory-drift`

**角色**：build owner、doc owner、CI。

### 生成包/门禁清单而非维护静态列表（提案）

**只作提案。** 目标：以包层级结构加 manifest 为唯一真源，驱动聚合 references、模块图和其他全量列表；生成器配 `--check` 在 hygiene/doc-sync 发现陈旧提交副本即失败；doc-sync 成为定义并打印子门禁的唯一命令，文档链接它而非重述；只有编码策略的静态列表保留。**前置**：可读取 manifest 的生成器、CI 检查位。**失败/例外**：发现脚本不要过度精巧；应读 manifest、按显式字段过滤、打印解析结果、响亮失败。

**做法**：① 以包树与 manifest 为唯一真源生成 references、模块图等全量清单；② 加 `--check`，在 hygiene/doc-sync 中对陈旧提交副本失败；③ 让 doc-sync 成为定义并打印子门禁的唯一命令，文档链接它；④ 仅保留编码策略的静态列表，发现脚本读 manifest、按显式字段过滤、打印结果并响亮失败。

**完成信号**：生成器与 `--check` 在共享门禁落地，新增包不再需要编辑任何静态清单。**证据限制**：本条目未实施；此前的通配符路径方案因解析开销被回退，说明“发现”并非无条件更优。

来源：deepseek-harness/.agents/notes/proposed/process/2026-06-20-discover-package-inventory.md:1-32@687f282e

<a id="review-feedback-maintenance"></a>
**机制 ID**：`rationale-process-2/review-feedback-maintenance`

**角色**：maintainer、two reviewer adapters、promotion helper。
**可用性/前置**：本包保留提案协议，不提供私有扫描器、双评审适配器、调度器或晋升 helper；来源也将这些实现与凭据留在维护者机器，未提交到固定源仓。缺任一组件时由目标维护者记录阻塞并停止本工作流，不能把“未执行”报告成“无候选”，也不能把来源中的私有命令当作本包入口。实际部署还须干净完整历史、获授权的分页 GitHub 历史访问、独立提供方/模型与凭据、目标 docs/lint 门及持久通知。

### 从人工评审反馈做定期双评审维护（提案）

**只作提案（有部分已观察的验收证据，但未晋升为 implemented）。** 目标：仓库外工具在刷新后的默认分支干净检出上定期扫描已合并 PR；唯一资格是 merge commit 可达，单个坏 PR 跳过而不中止，搜索超上限响亮失败；只接受 actor 为 User 且创建/最后编辑严格早于合并的反馈；合并、线程解决、作者“已修复”回复都不算采纳，作者自己的评论永不进入适配器；采纳证据使用 PR 专属 B/T/M 快照，使目标分支独有变更不出现在任一快照；两个独立适配器必须在“human-authored + adopted”上一致，再在 candidate/covered/specific/not-feedback 上一致；分歧一次有界复评，schema/id 失败按批次 fail-closed，无有效结果非零退出而非报告“无候选”；主适配器只从结构化共同指引起草，不接收原始文本，返回完整候选内容且保持无工具/只读；两评审者对同一 diff 批准，阻塞项进入有界修订；工具在门禁前后拒绝暂存和越界编辑，失败用 best-effort CAS 回滚；只写唯一目标，绝不提交/推送/合并；晋升 helper 在源 blob 变化时拒绝陈旧候选，开 draft PR 列出反馈 ID/URL、落地范围、运行、门禁与操作者编辑。**风险/限制**：时间戳因果推断、适配器独立性仅是部署合同、CAS 非真原子、单维护者 bus factor；机制与凭据私有不入库。

**部署后程序（当前不可直接运行）**：① 目标维护者先提供并验证上述组件；② 在刷新后的默认分支干净检出上扫描已合并 PR，只按 merge commit 可达性判定资格，坏 PR 跳过、超上限响亮失败；③ 只取 actor=User 且创建/最后编辑严格早于合并的反馈，排除合并/线程解决/作者自述，作者评论不进适配器；④ 用 PR 专属 B/T/M 快照收集采纳证据；⑤ 两个独立适配器先在 human-authored+adopted 上一致，再分类 candidate/covered/specific/not-feedback，分歧一次有界复评，schema/id 错误按批 fail-closed；⑥ 两评审者批准同一候选 diff，门禁前后检查唯一目标/暂存区，CAS 写入或回滚；⑦ 操作者检查后由 helper 复核源 blob 并开草稿 PR，普通 PR 评审才可晋升。

**重新触发与完成信号**：维护者提出实际部署或交接且组件/授权可得时，重新打开实现与验证；交接须另写后续决策 Note，不能静默移交。只有真实端到端运行满足全部来源晋升标准才可声称激活：干净刷新检出、无候选或仅目标文件 diff；双适配器独立完成；无交互调度与持久投递；受控证据排除目标分支独有变更；陈旧候选被拒、当前候选开草稿 PR；至少一个操作者检查的候选经普通 PR 评审落地。**证据限制**：来源 Note 仍为 proposed，来源报告的局部观察不是本包执行证据；当前保留的是协议知识而非可执行保证，时间戳因果、适配器独立性与 CAS 原子性仍受来源限制。

**例外**：仅面向单用户定期维护，不处理并发编辑器；无法验证两个适配器背后的提供方/模型是否独立，只把它作为部署合同；单维护者存储接受 bus factor 风险，凭据与私有数据不入库。

来源：deepseek-harness/.agents/notes/proposed/process/2026-07-13-human-review-skill-maintenance.md:1-85@687f282e

## 未决问题与跨域边界

- 本分区所有 `verification` 均为 planned；尚未在目标项目执行正例、反例与恢复。
- 三个 proposed 机制（`supply-chain-verification`、`generated-inventory-drift`、`review-feedback-maintenance`）没有或只有部分实施证据，必须保持提案状态，不能用于声称自动阻止。
- 源笔记引用的架构、测试、发布、文档等其他领域决策未在本分区独立审阅；本参考不把“另一个 owner 已覆盖”当作已绑定证据。
- 源项目特定的命令名、路径、阈值与工具（tsdown/pnpm/Vitest/npm/GitHub Actions）必须在迁移时重新参数化；不要直接复制数值阈值。
- 不可自动验证的语义（说明是否真实、评审是否人工、历史是否被改写）保持为人工评审职责。