# 删除、收敛与所有权：可迁移的简化治理手册

本手册从 61 篇 simplification 类 Agent Note 的英文/中文正文及其一致性侧车中提取，来源固定为 `deepseek-harness` 提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。它面向需要在其他项目中执行「删除表面、合并路径、收敛状态、保留效果」的编码代理与审查者。手册是提取者编写的可操作参考，不是源仓库的逐字政策；源仓库的 `AGENTS.md`、`packages/AGENTS.md` 和笔记正文优先于本手册。**本手册不声称任何删除、构建、测试或目标项目运行已经发生。**

## 0. 先读：证据等级与适用边界

- **来源义务**：笔记正文明确记录的决策、验证、接受损失和拒绝理由。本手册用「源记录」标注。
- **迁移设计**：为了在别的项目可执行而补的模板、清单、角色和完成信号。它们是建议，不是源仓库已实现的自动门禁。
- **证据等级**：知识库中的 `verification` 全部是 `planned`；本手册不把「计划验证」写成「已验证」。目标项目必须自己运行构建、测试、迁移与回滚演练。
- **权威顺序**：当前代码与当前政策 > 本手册 > 历史笔记。已归档笔记是冻结的历史证据，不是当前行为权威。
- **不适用范围**：纯视觉装饰且无交互/信息承载的取舍可走更轻流程，但仍需真实 UI 检查；安全修复可以缩短流程，但不能伪造历史或重写已发布数据。

## 1. 触发索引

| 你正在做什么 | 先读机制 | 最小完成信号 |
|---|---|---|
| 以「没人用」为由删除导出/事件/字段 | `rationale-simplification-2-consumer-evidence` | 四类消费者均有结论，测试适配器已改写 |
| 删除一个符号后不知道还要删什么 | `rationale-simplification-2-removal-closure` | 符号—合同—测试—文档—生成物—依赖清单全勾销 |
| 旧测试失败，想恢复被删表面 | `rationale-simplification-2-removal-verification` | 失败测试已分类，行为断言有生产承载者 |
| 删除公开 API/配置键/持久化格式 | `rationale-simplification-2-compatibility-cut` | 代码/数据已分类；旧数据可导出；无别名/双写 |
| 同一操作有两个入口/传输/生命周期 | `rationale-simplification-2-single-route-owner` | 一个权威主路径，适配器只转发 |
| 同一事实有两份缓存/排序/投影 | `rationale-simplification-2-derived-authority` | 一个权威源；派生可重建；第二 writer 删除 |
| 新增可选字段/配置/依赖替换 | `rationale-simplification-2-current-owner-bar` | 当前所有者/消费者证据；无证据则延后 |
| 某段代码「看起来没用」但可能承载契约 | `rationale-simplification-2-load-bearing-exceptions` | 承载检查完成；保留项有一行原因 |
| 默认值/身份/生命周期逻辑出现两份 | `rationale-simplification-2-single-semantic-home` | 每个共享规则有唯一 owner |
| 加平台回退/双 provider/环境探测 | `rationale-simplification-2-fallback-platform-scope` | 外部缺失证据 + 窄触发 + 自有依赖显式失败 |
| 决定默认启用哪些工具/预设 | `rationale-simplification-2-minimal-default` | 核心默认 + 完整 opt-in 四件套 |
| 改 prompt/tool schema/模型可见状态 | `rationale-simplification-2-model-surface-minimalism` | 只给任务概念；显示层不成为事实源 |
| 删 UI 提示/拖拽反馈/布局探测 | `rationale-simplification-2-visual-preserves-behavior` | 交互承载保留/替代；真实 UI 验证 |
| 以性能为由加缓存/优化 | `rationale-simplification-2-measurement-evidence` | 作用域、基线、负控制、校准、失效条件 |
| 归档/合并/部分取代决策记录 | `rationale-simplification-2-supersession-memory` | 归档冻结；部分取代点名剩余 owner |
| 一个简化同时改 UI/wire/持久化 | `rationale-simplification-2-reviewable-boundaries` | 每个切口完整且可独立回滚 |

## 1b. 执行前置、角色与证据限度

每个机制在动手前先确认下列三项；详细步骤见对应小节。

- `rationale-simplification-2-consumer-evidence`：**前置**：能搜索完整仓库、生成物与包导出边界；知道该表面的真实入口和注册机制。**角色**：变更作者：制作消费者矩阵与搜索证据；代码所有者：确认动态/外部调用与保留例外。**证据限度**：不能证明出树调用方不存在；不能替代运行期追踪。
- `rationale-simplification-2-removal-closure`：**前置**：知道该包的导出/注册边界；能重建生成目录与文档。**角色**：变更作者：维护删除清单并逐项勾销；包/模块所有者：确认导出与依赖边界。**证据限度**：文本搜索不能覆盖动态字符串、外部文档和出树消费者；未执行目标项目的构建/测试。
- `rationale-simplification-2-removal-verification`：**前置**：能运行相关测试/类型检查/快照重录；知道哪些测试是合同测试、哪些是适配器。**角色**：变更作者：分类失败测试并迁移行为断言；测试所有者：确认快照/契约测试的覆盖边界。**证据限度**：未运行目标测试；不能保证快照差异审查一定发现语义回归。
- `rationale-simplification-2-compatibility-cut`：**前置**：知道哪些数据已发布/提交；有版本/格式状态文档。**角色**：变更作者：区分代码/数据并写迁移说明；发布所有者：确认已发布数据与升级路径。**证据限度**：未验证目标项目的真实旧数据/旧构建；未执行升级/导出。
- `rationale-simplification-2-single-route-owner`：**前置**：能枚举所有注册点/入口/传输；知道每个入口的独有能力。**角色**：产品/UI 所有者：决定唯一入口；服务所有者：决定主传输与生命周期控制器。**证据限度**：未执行 UI/e2e/协议验证；「唯一主路径」的边界依赖架构判断。
- `rationale-simplification-2-derived-authority`：**前置**：能枚举权威源与所有派生视图；知道哪些事实是用户显式选择。**角色**：数据所有者：指定权威源与派生边界；服务所有者：保证单写入者/单投影。**证据限度**：未执行重放/快照/排序测试；派生等价性需要领域知识。
- `rationale-simplification-2-current-owner-bar`：**前置**：能列出当前消费者/所有者；能量化可选字段的 schema/缓存/回放成本。**角色**：提案者：给出消费者/所有者证据；模块所有者：判断是否属于当前合同。**证据限度**：「真实消费者」需人工判断；出树/未来消费者无法完全排除。
- `rationale-simplification-2-load-bearing-exceptions`：**前置**：能跟踪间接/生命周期调用；有平台矩阵与测试时钟知识。**角色**：模块所有者：证明承载关系；测试所有者：提供确定性/平台证据。**证据限度**：未执行平台/生命周期/恢复测试；「承载」判断可能受未知出树使用影响。
- `rationale-simplification-2-single-semantic-home`：**前置**：能画出包/服务边界；知道哪些规则是业务语义、哪些是协议格式。**角色**：模块所有者：定义语义与默认值；调用方：删除本地副本。**证据限度**：未执行跨包/并发/平台测试；所有权边界需架构判断。
- `rationale-simplification-2-fallback-platform-scope`：**前置**：有平台矩阵与失败样本；知道外部/自有依赖边界。**角色**：平台所有者：提供失败证据；运行时所有者：决定自有依赖失败语义。**证据限度**：未执行多平台/故障注入；外部工具行为可能随版本变化。
- `rationale-simplification-2-minimal-default`：**前置**：能测量每轮/启动成本；知道核心工作流。**角色**：产品/预设所有者：定义默认组合；模块所有者：保证 opt-in 路径完整。**证据限度**：未执行 TUI/e2e/token 测量；「核心」需产品判断。
- `rationale-simplification-2-model-surface-minimalism`：**前置**：能捕获模型请求/结果；知道任务所需最小概念。**角色**：模型接口所有者：定义 schema/文本；服务所有者：保留内部精确状态。**证据限度**：未执行模型请求捕获/评估；「最小」需任务判断。
- `rationale-simplification-2-visual-preserves-behavior`：**前置**：能运行真实 UI/e2e 或截图；知道元素的交互/信息承载。**角色**：UI 所有者：区分装饰/交互；设计/可访问性审查者：检查命中区与可发现性。**证据限度**：未执行真实 UI/截图/可访问性测试；「装饰 vs 交互」需设计判断。
- `rationale-simplification-2-measurement-evidence`：**前置**：有基线/负控制/样本采集；知道缓存 owner 与失效条件。**角色**：性能/平台所有者：设计测量；模块所有者：提供缓存 owner/失效。**证据限度**：未执行目标项目的性能测量/CI 校准；统计显著性与业务收益需所有者判断。
- `rationale-simplification-2-supersession-memory`：**前置**：有 Agent Note 生命周期/归档政策；能访问 git/历史。**角色**：笔记所有者：执行归档/合并；当前模块所有者：确认仍有效决策。**证据限度**：未运行归档验证器；未逐条核对当前代码是否仍实现每个 implemented 决策。
- `rationale-simplification-2-reviewable-boundaries`：**前置**：能识别合同边界/所有者；有分支/回滚/CI 能力。**角色**：变更作者：划分合同边界；各域所有者：审查自己的切口。**证据限度**：未执行分支/CI/回滚验证；合同边界需架构判断。

## 2. 来源义务与迁移设计的区分

源笔记反复出现的**义务**可归纳为六条：

1. 删除前要有消费者证据，不能把「搜索为空」当全局不存在。
2. 删除要清算闭包，不能只删入口而留下类型、文档、测试、生成物和第二写入者。
3. 测试描述行为，不描述被删表面的内部形状；测试不是生产消费者。
4. 代码 API 可以快切，已发布数据不能被原地重写；不要用别名/墓碑/双写假装兼容。
5. 一个操作/事实/共享语义只保留一个权威 owner；其它表示必须派生或明确为适配器。
6. 拒绝/提案/归档都是决策记忆：保留理由、条件和剩余 owner，不把历史改写成当前权威。

本手册中的**流程、角色、模板、完成信号**是迁移设计。它们把上述义务变成可执行的检查，但没有证据表明目标项目已经具备这些门禁。采用时应按项目规模裁剪，不能把「模板存在」当成「控制已运行」。

**产品决策不升级为规则**：readline 前端、`/cancel`、侧栏 pill、todo opt-in、PTC preset、E2B、desktop cleanup、native/PTC、preset 组合等具体选择是 DeepSeek 产品证据；本手册只迁移其消费者/所有权/测试/兼容机制，不要求采用项目复制这些产品决定。

**政策来源（精确行）**：

- `deepseek-harness/AGENTS.md:5-7@687f282e`：pre-stable API、已发布 Session 数据、类型确认。
- `deepseek-harness/AGENTS.md:137-140@687f282e`：模型可见⟺可记录、能力 seam、依赖优先、显式边界。
- `deepseek-harness/AGENTS.md:155-156@687f282e`：测试描述行为、归档笔记冻结且不是当前权威。
- `deepseek-harness/packages/AGENTS.md:9-16@687f282e`：一个生命周期控制器、当前所有者、共享状态 owner、业务规则归属、模型面向合同、在操作中强制决定。
- `deepseek-harness/.agents/notes/README.md:38-42@687f282e`：归档三件套冻结、归档元数据、不得视为当前行为权威。
- `deepseek-harness/docs/i18n/README.md:1-22@687f282e`：英文/中文/侧车三件套与逐标题一致性记录。

## 3. 标准删除流程（七步）

1. **定义表面**：写下精确符号/事件/字段/目录项及其同义名。不要用模糊的「清理某模块」。
2. **消费者证据**：分别搜索生产入口、测试、文档/生成目录、发射方；对每个命中分类。外部/动态调用不明时保留不确定性。
3. **选择收敛策略**：删除、合并到一个主路径、改为派生、保留并记录承载例外，或延后为提案。不要先决定「删」再找理由。
4. **执行闭包**：按符号—合同—测试—文档—生成物—依赖六列清单逐项处理；共享测试工具迁回测试，不随产品删除。
5. **兼容/发布切口**：区分代码 API 与已发布数据。代码更新所有消费者；数据提供导出/升级路径，不原地重写；不保留别名/双写。
6. **验证**：失败测试分类并迁移行为断言；重录快照并解释差异；补「被删路径不可达/不再宣称」的检查；运行项目已有的构建/测试/文档门禁。
7. **记录**：在 PR/Agent Note 中写消费者矩阵、保留例外、兼容决定、验证证据、回滚方式和未决项。部分取代要点名剩余 owner。

完成信号：七步都有产物；没有「以后再说」的隐藏半成品；未执行项被明确标为未执行，而不是写成通过。

## 4. 机制详解

<a id="consumer-evidence"></a>
### 4.1 `rationale-simplification-2-consumer-evidence` — 消费者证据先于删除

**何时用**：准备删除导出、方法、事件、类型、配置字段、目录条目或兼容分支；或有人以「看起来没人用」推动收缩。

**规则**：

- 枚举四类消费者：生产代码/真实入口、测试与测试基础设施、文档与生成目录、运行时发射方。**生产入口为空是删除的硬前提**；其余三类可以存在，但必须分类处理（迁移测试、更新文档、处理发射方），不能因为存在就保留表面。
- 测试不是生产消费者。唯一调用者是契约测试/类型测试/mock 时，把测试改为走保留的生产路径，而不是保留表面。
- 接口完整性、对称性或「seam 应该完整」不是消费者证据；每个方法/字段仍需当前调用者或合同。
- 区分「声明但无人发射」与「发射但无人监听」。两者都未消费，但删除范围不同；不能因为一个事件死掉就删掉同族仍有消费者的通知。
- 同名 API、动态注册、字符串查找、外部包/出树调用方保留不确定性。证据不足时缩窄删除范围或保留并记录条件。
- 缺失比拒绝更诚实：无法被任何路径履行的类型/字段应删除，让调用方在编译/加载期失败；保留一个会静默丢数据的表面不是兼容。

**操作**：写候选符号与同义名 → 四类搜索并分类 → 对测试适配器做改写判断 → 检查动态/外部/生成物 → 证据充分才删，否则保留并写明缺哪类证据。

**完成信号**：四类均有结论；测试适配器已改写或说明不可改写；外部未知项没有被写成「不存在」。

**失败/例外**：发现遗漏的生产调用方时回滚并补齐矩阵；发布者/适配器若只转发到真实实现，仍算消费者；仅证明旧表面存在的测试不算。

**反模式**：把测试当唯一消费者；把一次仓库搜索为空当全局不存在；为保持类型表完整而保留无法履行的字段。

**源记录**：事件删除（`2026-06-20-drop-unconsumed-llm-adapter-change-event.md`）、便利表面（`2026-06-20-drop-unconsumed-llm-assembled-surfaces.md`）、seam 方法（`2026-06-20-prune-dead-seam-methods.md`）、图像块（`2026-07-04-drop-image-content-block.md`）、词汇变体（`2026-07-04-prune-producerless-vocabulary-variants.md`）、测试包（`2026-07-19-retire-subagent-mock-package.md`）、CLI demo（`2026-08-08-remove-cli-demo.md`）、SDK 工具链（`2026-08-11-remove-sdk-project-toolchain.md`），以及 proposed 的 55–58。精确行号见 `research/rationale-simplification-2-coverage.json`。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:8-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:16-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:22-27@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:8-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:29-34@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:18-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-prune-producerless-vocabulary-variants.md:8-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:8-13@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md:8-11@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:8-13@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:8-15@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-17-defer-office-background-scheduling.md:15-22@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-trim-session-query-convenience-api.md:13-20@687f282e

<a id="removal-closure"></a>
### 4.2 `rationale-simplification-2-removal-closure` — 删除闭包

**何时用**：消费者证据已支持删除，准备提交；或审查一个只删实现、留下类型/文档/测试/配置的「半删除」。

**六列清单**：

1. **符号**：入口、同义名、导出。
2. **合同**：类型、接口、协议描述、默认值、错误分支。
3. **测试**：专属测试、fixture、快照、契约测试。
4. **文档**：README、JSDoc、示例、计数、链接、生成目录。
5. **生成物**：由源生成的目录/清单/类型，需要重建而不是手改。
6. **依赖**：包导出、依赖项、锁文件、构建配置、工作流。

**操作**：以被删符号为根建清单 → 删除或迁移每一项 → 搜索旧名字并重建生成物 → 运行类型/构建/相关测试 → 把不属于本闭包的项单列。

**完成信号**：六列全勾销；旧名字在源码/生成物/文档中无残留；构建与相关测试通过或明确未执行。

**失败/例外**：共享测试工具、跨包稳定接口和仍被其他功能使用的辅助函数不属于本闭包；应迁移或保留。发现无关死代码时单列，不塞进本次删除。

**反模式**：只删实现；把共享测试 helper 当产品代码；把无关死代码混入同一次删除。

**源记录**：hook 协议（`2026-07-04-tighten-hook-protocol-contract.md`）、mock 包（`2026-07-19-retire-subagent-mock-package.md`）、CLI demo、SDK 工具链、spine demo（`2026-08-26-remove-agent-spine-demo.md`）、catalog 投影（`2026-09-08-web-subagent-catalog-projections.md`）、membership-only（`2026-09-16-subagent-catalog-membership-only.md`）、log-only turns（`2026-07-28-remove-synthetic-log-only-turns.md`）、preset 组合（`2026-10-09-preset-owned-subagent-composition.md`）。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:22-25@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:34-40@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-tighten-hook-protocol-contract.md:17-20@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-tighten-hook-protocol-contract.md:27-30@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:24-29@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:14-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:33-35@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:16-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:24-27@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:18-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-08-web-subagent-catalog-projections.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-16-subagent-catalog-membership-only.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-07-28-remove-synthetic-log-only-turns.md:15-26@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e

<a id="removal-verification"></a>
### 4.3 `rationale-simplification-2-removal-verification` — 让测试跟随行为

**何时用**：删除后测试失败，或需要决定保留/迁移/删除哪些测试。

**失败测试四分类**：

- **行为测试**：保护保留路径的用户可见/合同行为 → 迁移到生产路径。
- **实现细节测试**：断言缓存内部形状、旧字段、旧调用顺序 → 删除或改写。
- **纯适配器测试**：只证明旧表面存在 → 随表面删除，或改为生产路径的契约测试。
- **无主测试**：没有生产承载者 → 删除决定需重新评估；若行为仍重要，先补生产路径。

**测试介质**：按被测界面选择介质；PTY 只用于 TUI，非 TUI 用普通子进程。不要为测试方便保留产品兼容层，也不要把测试介质选择当成运行时支持。

**操作**：列失败/受影响测试 → 分类 → 迁移行为断言 → 重录快照并逐条解释差异 → 补「被删路径不可达/不再被文档宣称」的检查。

**完成信号**：每个测试有分类与处置；行为断言有生产承载者；快照差异有解释；缺失有验证。

**失败/例外**：无法判断时先保留表面或改写为行为级；不得删断言/跳过测试换绿色。纯类型测试可在删除类型时删除，但公共契约应迁移为编译期/运行时行为测试。

**反模式**：测试当唯一消费者；删断言求绿；接受所有快照差异不解释。

**源记录**：缓存摘要的测试教训（`2026-06-19-drop-mutable-session-summary.md`）、readline 的 PTY 测试政策（`2026-07-20-retire-readline-front-door.md`）、Workspace 路由测试（`2026-07-31-one-route-to-add-a-workspace.md`）、Agent Teams 测试（`2026-08-12-trim-agent-teams-read-and-lifecycle-surface.md`）、E2B 验证（`2026-09-11-remove-e2b-providers.md`）。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:32-36@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:30-33@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:35-38@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:24-27@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-20-retire-readline-front-door.md:24-32@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-20-retire-readline-front-door.md:33-37@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:33-38@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:33-35@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-cmdline-program-action.md:26-30@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-12-trim-agent-teams-read-and-lifecycle-surface.md:50-53@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:18-21@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-07-28-remove-synthetic-log-only-turns.md:37-40@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:47-51@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-trim-session-query-convenience-api.md:27-32@687f282e

<a id="compatibility-cut"></a>
### 4.4 `rationale-simplification-2-compatibility-cut` — 代码快切，数据不可重写

**何时用**：删除公开 API、配置键、持久化格式或升级路径；决定是否保留别名/墓碑/迁移器。

**规则**：

- **代码 API**：pre-stable 时可以更新所有消费者后快切；更新调用方、文档、测试和示例。
- **已发布数据**：会话日志、发布产物、已提交的持久化代际不得移动、覆盖或删除；只能增加带版本名的后继读取/导出路径。
- **不保留别名/墓碑/双写**：别名让旧调用方绕过新合同，双写制造第二真相。
- **无回退/降级承诺要写明**：若删除旧格式，提供旧构建导出或显式升级路径；不要静默改写数据。
- **重新引入条件**：真实需求、完整合同、迁移/回滚成本；不要因「曾经支持」保留半实现。

**操作**：分类代码/数据 → 更新代码消费者 → 为数据提供读取/导出/升级 → 删除兼容壳 → 写迁移说明与重新引入条件。

**完成信号**：代码/数据已分类；消费者迁移路径明确；旧数据可导出/升级；无别名/墓碑/双写；重新引入条件已写。

**失败/例外**：内部未发布格式可快切并重录 fixture；安全修复可立即停用旧路径，但仍需数据导出/恢复。已发布数据没有例外。

**反模式**：别名冒充兼容；为删格式原地重写用户数据；把「pre-stable」当丢弃已发布数据的理由。

**源记录**：根部 pre-stable/released-session 政策；`2026-06-19-drop-mutable-session-summary.md` 的 No migration；`2026-08-08-remove-cli-demo.md`；`2026-08-11-remove-sdk-project-toolchain.md`；`2026-08-30-jsonl-only-session-persistence.md`；`2026-09-11-remove-e2b-providers.md`；`2026-10-05-native-or-ptc-presentation.md`；`2026-10-09-preset-owned-subagent-composition.md`。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:28-31@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:14-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:27-32@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:16-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:28-37@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:16-23@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:29-36@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:21-26@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:35-40@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:41-46@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-19-remove-desktop-profile-core-cleanup.md:13-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-truncate-interrupted-turns.md:28-31@687f282e

<a id="single-route-owner"></a>
### 4.5 `rationale-simplification-2-single-route-owner` — 一个操作一条主路径

**何时用**：同一操作有两个以上入口/传输/状态管理器/生命周期控制器；或在 UI 增加第二个按钮/菜单/命令做同一件事。

**规则**：

- 为每个用户可见操作选一个权威入口；其它入口删除，或明确标为适配器并只转发。
- 只有两个以上真实、互斥选择时才显示菜单；没有选择就直接执行。
- 同一异步操作只保留一个生命周期控制器/事务。readiness、取消、释放、预留、哨兵状态需要独立所有者或结算点时，才允许拆分。
- 一个语义只保留一个传输/格式/服务面；只剩一个实现时，删除通用 dispatcher/包装层。
- 合并路由时保留必要 UI 可达性与宿主能力；删除重复 affordance 不等于删除功能。
- 框架已有原生扩展点时，使用其注册/分派（例如程序自己的 commander action），不要另造第二套 callback/usage；对未注册扩展做加载期校验。

**操作**：画「入口→主路径→适配器」图 → 标出第二权威 → 选唯一主路径 → 迁移独有能力 → 删除重复入口/控制器 → 验证。

**完成信号**：入口图只有一个权威主路径；适配器只转发；菜单只在真实多选时出现；生命周期控制器有唯一边界。

**失败/例外**：第二路径仍承载独有能力时先迁移，不强行合并；协议适配器/平台实现/测试替身可存在，但不得成为第二权威。

**反模式**：为未来多选保留菜单；适配器写第二套业务逻辑；用「抽象」保留单实现 dispatcher。

**源记录**：stop API（`2026-06-20-public-agent-stop-api.md`）、boot glue（`2026-07-04-share-app-bin-boot-glue.md`）、surface manager（`2026-07-19-use-one-session-surface-manager.md`）、readline（`2026-07-20-retire-readline-front-door.md`）、Workspace 路由、Web steer、source installer、cmdline、spine demo、catalog 投影、Messages-only（`2026-09-19-deepseek-messages-only.md`）、id 统一、log-only turn、JSONL、native/PTC。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-public-agent-stop-api.md:8-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-public-agent-stop-api.md:16-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-share-app-bin-boot-glue.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-use-one-session-surface-manager.md:12-26@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-20-retire-readline-front-door.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md:12-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:14-28@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-web-ui-no-steer-entry-or-interjection-chrome.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-10-source-run-without-managed-installer.md:14-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-cmdline-program-action.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-08-web-subagent-catalog-projections.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-19-deepseek-messages-only.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-07-28-remove-synthetic-log-only-turns.md:15-26@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e

<a id="derived-authority"></a>
### 4.6 `rationale-simplification-2-derived-authority` — 从权威派生，不维护第二真相

**何时用**：增加/保留摘要、缓存、索引、排序、投影、目录或状态字段；发现两个地方维护同一事实。

**规则**：

- 指定唯一权威源（事件日志、当前服务状态、持久化记录、用户显式选择）；其它表示必须可重放/计算。
- 删除可变摘要、重复缓存、第二排序账本、第二投影；显示层只读权威或共享投影。
- 只保留不可派生事实：用户显式手工顺序、配置选择、审计/回执。写成显式字段，读取时区分「派生默认」与「用户覆盖」。
- 线性化/快照是派生视图，必须带来源/版本并可丢弃重建；不得成为第二写入目标。
- 时间/时区等边界值必须在工具边界显式：请求携带 IANA 时区并在 Host 转换；不要把浏览器本地时区持久化为共享事实，缺值就报错而不是猜。
- 异步投递/调度只定义一种用户可见语义（如到点作为新 turn 进入），不要把它与运行中 steer/回执/重试混用；接受的不确定性（at-least-once）要写明。
- 一个独立事实一个状态维度；不要把正交维度压成一个大 enum，也不要用内部 phase 事件冒充可观察状态。

**操作**：指定权威源 → 列所有派生/缓存/排序/投影 → 逐项证明可重建或标为不可派生 → 删除第二表示/第二 writer → 用重放/快照验证等价。

**完成信号**：每个表示有权威源或不可派生理由；第二 writer/排序/投影删除；重放/快照验证等价；时间/投递边界显式。

**失败/例外**：无法证明派生等价时保留两套但标记临时并设收敛条件；用户手工选择/审计事实必须持久化；有证明的缓存可保留（见测量机制）。

**反模式**：显示层自行排序/过滤目录；用对象身份或全局 map 当缓存证明；把用户手工选择也派生掉。

**源记录**：SessionSummary（`2026-06-19-drop-mutable-session-summary.md`）、surface manager、flush（`2026-07-23-collapse-persistence-flush-state.md`）、状态机（`2026-07-24-agent-loop-observable-state-machine.md`）、Schedule delivery（`2026-08-09-conversational-schedule-delivery.md`）、Agent Teams、catalog 投影、Workspace recency（`2026-09-10-derived-workspace-recency.md`）、membership-only、id 统一、时区（`2026-08-09-explicit-schedule-time-zone.md`）、JSONL。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:8-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:20-27@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-use-one-session-surface-manager.md:8-11@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:14-25@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-24-agent-loop-observable-state-machine.md:16-32@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-capability-neutral-sandbox-policy-context.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-09-conversational-schedule-delivery.md:14-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-12-trim-agent-teams-read-and-lifecycle-surface.md:18-33@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-08-web-subagent-catalog-projections.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-10-derived-workspace-recency.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-16-subagent-catalog-membership-only.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-07-28-remove-synthetic-log-only-turns.md:15-26@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-09-explicit-schedule-time-zone.md:13-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e

<a id="current-owner-bar"></a>
### 4.7 `rationale-simplification-2-current-owner-bar` — 当前所有者门槛

**何时用**：新增导出、配置项、可选字段、菜单、兼容路径、抽象层或依赖替换；或提案以「将来可能有用」为理由。

**规则**：

- 每个抽象、状态机、选项、防御性拷贝、兼容路径都要绑定当前合同或生产消费者；没有所有者/消费者就不实现。
- 公共选择（默认值、操作集、格式、外部概念）要有当前消费者证据或相关先例；否则要求显式值、延后或删除该选择。
- 可选字段/空槽不是免费的：进入 schema、缓存、回放、校验和审查面；没有真实生产者就删槽位。
- 菜单只在真实选择时存在；不要预建 shell。依赖替换算净收益：删除的自有代码/测试是否真的大于新依赖、适配和维护成本。
- proposed 仍是 proposed：没有消费者/验收前，不把提案写成现有能力，也不预建半实现。
- 发布 companion/断言前要有独立观测；没有独立观测就省略并在 README 明确，而不是为了对称性制造无观测断言。

**操作**：写消费者/所有者 → 写为什么现在与删除条件 → 检查可选字段完整成本 → 无证据则延后/删除 → 有证据则实现最小面。

**完成信号**：每个新表面有所有者/消费者与现在理由；可选字段无空槽；无证据项延后；依赖替换净收益为正。

**失败/例外**：证据不足默认不新增；安全/合规防御面可无当前消费者但要有合同；当前支持矩阵内的平台适配器算所有者。

**反模式**：为未来保留空配置槽；把「类型上可能」当生产者；用整体「减少依赖」口号替代逐项净收益。

**源记录**：事件死表面、seam 方法、图像块、词汇变体、todo opt-in、Workspace 路由、beta notice、PTC、availability、membership-only、E2B、native/PTC、preset 组合，以及 proposed 55–57、dependency-swaps 拒绝（`2026-07-26-dependency-swaps-rejected-by-nih-audit.md`）。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:8-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:29-34@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:18-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-prune-producerless-vocabulary-variants.md:8-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-todo-write-opt-in.md:12-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:14-28@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:12-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-01-ptc-omits-workflow-tool.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-15-model-agent-availability-and-team-targets.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-16-subagent-catalog-membership-only.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:15-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-17-defer-office-background-scheduling.md:15-22@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-provider-only-instruction-reads.md:13-22@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-shell-env-key-declarations.md:13-18@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:11-73@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-28-omit-unneeded-invariant-companions.md:16-23@687f282e

<a id="load-bearing-exceptions"></a>
### 4.8 `rationale-simplification-2-load-bearing-exceptions` — 承载例外

**何时用**：搜索显示某方法/依赖/平台分支没有调用，但删除会改变生命周期、平台兼容、测试确定性或真实工作保留。

**规则**：

- 删除前验证「未使用」前提：间接调用、生命周期编排、平台矩阵、测试时钟/确定性、错误恢复、真实用户工作。
- 承载当前合同的原语要保留并写明原因；不要为了表面整洁删除承载能力。
- 恢复/截断不得删除真实工作或伪造不存在的事件；宁可显示未完成，也不合成历史。
- 依赖/手写替换必须验证语义等价与测试可确定性；破坏 fake timer、取消语义或错误边界就拒绝。
- 承载例外必须有当前证据/合同；「以后可能有用」不是例外。

**操作**：验证未使用前提 → 查间接/生命周期/平台/测试依赖 → 能证明承载则保留并写原因 → 不能证明则删除 → 用针对性测试验证。

**完成信号**：保留项有当前承载证据；删除项无承载；恢复策略不伪造历史；替换通过确定性/语义验证。

**失败/例外**：真正无合同/调用/平台/测试依赖的原语仍删除；安全/合规承载优先。

**反模式**：把「以后可能有用」当承载；为会话好看截断真实工作；为减行数换掉破坏测试确定性的依赖。

**源记录**：whenIdle 保留（`2026-06-20-public-agent-stop-api.md`）、JSON 树（`2026-07-28-local-json-tree-renderer.md`）、PowerShell、Windows 修复、E2B、拒绝截断（`2026-06-20-truncate-interrupted-turns.md`）、拒绝 timer promises（`2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md`）、依赖审计。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:29-34@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-06-20-public-agent-stop-api.md:16-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-28-local-json-tree-renderer.md:21-30@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-04-drop-windows-powershell-picker-fallback.md:18-25@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-28-windows-only-absent-probe-repair.md:14-17@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:15-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:41-46@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-truncate-interrupted-turns.md:28-31@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:15-24@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:11-73@687f282e

<a id="single-semantic-home"></a>
### 4.9 `rationale-simplification-2-single-semantic-home` — 共享语义只有一个家

**何时用**：同一规范化/默认值/身份转换/生命周期逻辑出现在两个包或两层；客户端与服务端各自实现校验/默认。

**规则**：

- 共享规范化、默认值、身份生成、生命周期语义放在拥有该合同的模块；调用方只传原始输入/读结果。
- 共享状态挂 service/instance，不用模块级 cache、全局 WeakMap 或 window 全局；需要跨调用共享时显式注入。
- 业务规则放在自己的包；runtime/controller/manager 只做通用编排。
- 身份/协议字段只在权威边界转换一次；显示名/label 可以不同，但不得成为第二身份。
- 客户端只做展示所需描述符处理，不复制 Host 的安全/正确性校验；Host 在权威边界强制。

**操作**：列重复规则/默认值/身份映射 → 指定语义所有者 → 删除副本并把差异变成参数/owner 分支 → 验证跨包/平台/多实例。

**完成信号**：每个共享规则有唯一 owner；无重复默认值/身份映射/全局状态；Host/Client 边界明确。

**失败/例外**：无法确定所有者时先指定临时 owner 并记录；协议适配器可做格式转换，但不定义第二套业务默认值；平台差异可在 owner 内分支。

**反模式**：客户端复制 Host 校验当安全；全局 map 共享 session 状态；bridge 里再定义默认值。

**源记录**：boot glue、hook 协议、mock 包、surface manager、flush、状态机、sandbox policy、cmdline、Agent Teams、diagnostics、spine demo、freeze evidence、catalog 投影、Host 校验（`2026-09-15-host-only-remote-input-validation.md`）、availability、id 统一、preset 组合、shell env。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-share-app-bin-boot-glue.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-04-tighten-hook-protocol-contract.md:17-20@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-19-use-one-session-surface-manager.md:12-26@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:14-25@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-24-agent-loop-observable-state-machine.md:16-32@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-capability-neutral-sandbox-policy-context.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-cmdline-program-action.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-12-trim-agent-teams-read-and-lifecycle-surface.md:18-33@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:14-44@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:45-54@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-08-web-subagent-catalog-projections.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-15-host-only-remote-input-validation.md:14-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-15-model-agent-availability-and-team-targets.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-shell-env-key-declarations.md:13-18@687f282e

<a id="fallback-platform-scope"></a>
### 4.10 `rationale-simplification-2-fallback-platform-scope` — 回退与平台范围

**何时用**：增加平台回退、双 provider、环境探测或 workaround；发现自有依赖缺失被静默替换。

**规则**：

- 回退只用于外部工具/运行时确实可能缺失且有明确替代；自有依赖/合同缺失应失败并报告。
- 平台 workaround 限定触发条件（仅 Windows/某版本/某探测器），用失败证据支持；不要在所有平台执行。
- 优先在权威边界（Host/parser/config）验证一次；客户端不复制安全校验/默认值。
- 回退/探测的收益与成本要测量；无效 workaround 删除或缩窄。
- 为重新引入写条件：真实平台需求、完整合同、维护成本。

**操作**：列回退/探测点 → 验证外部缺失证据 → 限定平台/版本 → 自有依赖失败改显式错误 → 测量并写重新引入条件。

**完成信号**：每个回退有外部缺失证据、触发条件、替代路径与成本；自有依赖缺失显式失败；无重复客户端校验。

**失败/例外**：无法证明外部缺失时不回退；安全/可用性要求的受控回退可保留，但要有所有者与测量。

**反模式**：回退当默认；自有依赖缺失静默换实现；平台 workaround 推广到所有平台。

**源记录**：PowerShell（`2026-08-04-drop-windows-powershell-picker-fallback.md`）、Windows probe（`2026-08-28-windows-only-absent-probe-repair.md`）、Host-only validation、E2B、provider-only reads（`2026-09-19-provider-only-instruction-reads.md`）。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-04-drop-windows-powershell-picker-fallback.md:8-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-04-drop-windows-powershell-picker-fallback.md:18-25@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-28-windows-only-absent-probe-repair.md:14-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-15-host-only-remote-input-validation.md:14-21@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:15-24@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-provider-only-instruction-reads.md:13-22@687f282e

<a id="minimal-default"></a>
### 4.11 `rationale-simplification-2-minimal-default` — 最小默认组合

**何时用**：决定产品默认启用哪些工具/子代理/预设/UI 表面；把功能移出或加入默认。

**规则**：

- 默认只保留核心工作流所需最小组合；高成本/低频/有争议能力用一行显式 opt-in。
- opt-in 必须是完整一等路径：注册、查找、展示、测试都存在；不能只在文档写「支持」。
- 默认不含不等于实现删除；保留引擎供显式使用，禁用发生在注册行，不在展示层。
- 预设/组合差异写明（哪些工具/子代理/为什么）；不要把两种调用形态同时开启造成模型歧义。
- 评估每个默认项成本：每轮 token、启动时间、审查面、误触发风险；默认项持续覆盖。

**操作**：列默认项与成本 → 定义核心最小集 → 为移出项写一行 opt-in → 在注册行禁用并保证查找/展示/测试 → 测量并复审。

**完成信号**：默认组合最小且有理由；每个 opt-in 四件套完整；成本已测量；无展示层伪禁用。

**失败/例外**：opt-in 路径不完整时不移出默认；安全/合规必需项可默认开启但写理由；核心工作流依赖的能力不是 opt-in。

**反模式**：只在 UI 隐藏但默认仍注册；opt-in 只写文档；两种调用形态同时默认开启。

**源记录**：todo opt-in（`2026-07-21-tui-todo-write-opt-in.md`）、Workspace 路由、PTC（`2026-09-01-ptc-omits-workflow-tool.md`）、catalog 投影、availability、native/PTC、preset 组合。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-todo-write-opt-in.md:8-11@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-todo-write-opt-in.md:12-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:14-28@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-01-ptc-omits-workflow-tool.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-08-web-subagent-catalog-projections.md:12-21@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-15-model-agent-availability-and-team-targets.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e

<a id="model-surface-minimalism"></a>
### 4.12 `rationale-simplification-2-model-surface-minimalism` — 模型可见面最小化

**何时用**：设计/修改 prompt、tool schema、tool result、diagnostic、catalog 投影或模型可见状态。

**规则**：

- 模型可见内容只含任务所需概念，不含 UI/传输/实现词汇；稳定文本逐字固定，动态行为用快照/e2e 覆盖。
- 给模型可用/可寻址标识与少量状态，不给内部枚举全量、近似清单或原始 JSON；Team/agent target 用稳定 id。
- 诊断按可行动类别分桶，避免泄漏敏感原文/大对象；内部精确状态留 owner。
- 权威 schema/result 是事实源；显示层只投影，不解析显示字符串重建状态。
- 不把安全/重试/权限决策下放给模型可见文本；执行器/服务端仍是权威。

**操作**：列模型可见字段 → 删除 UI/传输/实现词汇与近似清单 → 给稳定 id/可用状态/可行动诊断 → 内部精确状态留 owner → 用快照/请求样本验证。

**完成信号**：模型可见字段均有任务理由；无原始大对象/近似清单；显示层读权威投影；安全边界在执行器。

**失败/例外**：模型无法行动时补最小可行动信息，不倾倒内部状态；显式调试模式可更多但不得默认进入请求；稳定文本变更需版本化/快照。

**反模式**：内部 JSON 全量塞给模型；显示字符串解析重建状态；让模型决定权限/重试。

**源记录**：envelopes（`2026-07-20-unwrap-injected-content-envelopes.md`）、sandbox policy、diagnostics、PTC、availability、membership-only、native/PTC、preset、shell env。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-20-unwrap-injected-content-envelopes.md:8-16@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-20-unwrap-injected-content-envelopes.md:17-24@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-capability-neutral-sandbox-policy-context.md:14-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:8-13@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:14-44@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-01-ptc-omits-workflow-tool.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-15-model-agent-availability-and-team-targets.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-16-subagent-catalog-membership-only.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-shell-env-key-declarations.md:13-18@687f282e

<a id="visual-preserves-behavior"></a>
### 4.13 `rationale-simplification-2-visual-preserves-behavior` — 视觉简化保留行为

**何时用**：删除/弱化 UI 元素、提示、拖拽反馈、布局探测或首启文案。

**规则**：

- 区分装饰与交互承载：命中区、光标、拖拽捕获、取消能力、可发现性必须保留或有等价替代。
- 删除不承载信息的 chrome（重复提示、自解释 caption、错误框架的 beta 提示）是简化；删除唯一反馈/入口不是。
- 布局/宽度优先 CSS 表现层，避免 JS 逐像素探测；接受合理近似。
- 删除提示可能让人误以为能力消失时，保留一行真实状态或改由结构表达；不要用「再措辞」掩盖错误框架。
- 视觉变更至少用真实组合/截图/交互测试证明可用性。

**操作**：列元素与承载 → 删除纯装饰 → 保留/替代交互承载 → 用真实 UI 验证 → 记录接受的近似/损失。

**完成信号**：交互承载有保留/替代；命中区/光标/取消可用；布局无 JS 探测；错误框架已删除而非改写。

**失败/例外**：纯装饰可直接删除；已有等价入口且测试覆盖时可删重复 affordance；无法证明交互可用时保留或加反馈。

**反模式**：删除唯一反馈还宣称简化；JS 逐像素替代 CSS；把 beta 提示改得更委婉但不真实。

**源记录**：/cancel（`2026-07-21-tui-remove-cancel-command.md`）、侧栏 pill（`2026-07-30-sidebar-resize-without-visible-pill.md`）、steering caption（`2026-08-10-web-remove-steering-interjection-caption.md`）、beta notice（`2026-08-13-remove-first-run-beta-notice.md`）、CSS width（`2026-09-01-css-produced-file-layout.md`）。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md:8-11@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md:12-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-30-sidebar-resize-without-visible-pill.md:8-11@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-30-sidebar-resize-without-visible-pill.md:12-17@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-10-web-remove-steering-interjection-caption.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:8-11@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:12-15@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-01-css-produced-file-layout.md:8-13@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-01-css-produced-file-layout.md:14-19@687f282e

<a id="measurement-evidence"></a>
### 4.14 `rationale-simplification-2-measurement-evidence` — 优化要有证明

**何时用**：引入缓存/优化/平台 workaround，或以性能为由保留/删除代码。

**规则**：

- 写清收益假设与作用域：缓存只证明某个 owner/循环的重复计算，不证明对象身份、全局 map 或所有调用受益。
- 测量有负控制、基线、保留污染/异常样本、校准 CI 差异；不要挑有利样本或推广一次结果。
- 缓存有 owner、失效条件、回退；没有证明就不缓存。弱引用/对象身份不能替代 owner 证明。
- 替换测试相关实现时验证确定性（fake timer）与语义等价；性能收益不能抵消测试不确定性。
- 工具输出（如 knip）只回答其覆盖范围，不能当全局删除授权。

**操作**：写假设与作用域 → 采基线/负控制/污染样本 → 实现最小优化并绑定 owner → 测量/校准 → 不显著则回退，写失效条件。

**完成信号**：收益假设有作用域；基线/负控制/样本/校准齐全；缓存有 owner/失效；不显著项回退。

**失败/例外**：测量不显著/样本受污染时不引入；纯布局近似不需要缓存证明，但不能宣称精确性能收益。

**反模式**：对象身份证明缓存；只报有利样本；knip 未使用列表当删除授权。

**源记录**：freeze evidence（`2026-09-06-agent-request-freeze-evidence.md`）、Windows probe、timer promises 拒绝、knip（`2026-08-19-knip-config-cleanup.md`）。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:12-19@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:20-37@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:38-59@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-28-windows-only-absent-probe-repair.md:18-30@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:15-24@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:35-37@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-19-knip-config-cleanup.md:12-20@687f282e

<a id="supersession-memory"></a>
### 4.15 `rationale-simplification-2-supersession-memory` — 取代与决策记忆

**何时用**：归档/删除/合并 Agent Note，或新决策只取代旧决策的一部分；重新提出曾被拒绝的方案。

**规则**：

- 归档三件套冻结：不编辑、不翻译、不重排、不移动、不删除；归档只保留历史价值，不是当前行为权威。
- 状态与生命周期一致：proposed 未实现、implemented 记录已发布决策、rejected 记录拒绝理由；不得把提案写成现有能力。
- 部分取代点名剩余 owner 和仍有效决策；完全取代才可合并/删除，并保留独特理由、替代、后果、验证、覆盖缺口。
- 拒绝理由只保留到它仍能阻止一个诱人的错误；重新提出必须正面击败记录理由，而不是忽略。
- 当前代码/政策与历史笔记冲突时，以当前代码/政策为准；历史解释「为什么」，不是「现在是什么」。
- 过时的防御性清理/兼容代码也是历史决策：当产生条件已消失时，删除它并保留字节不变/回归验证，而不是继续运行无对象的工作。

**操作**：判状态（proposed/implemented/rejected/archived）→ 判完全/部分取代 → 保留三件套与拒绝理由 → 点名剩余 owner/交叉链接 → 用当前代码/政策复核。

**完成信号**：三件套冻结；状态与生命周期一致；部分取代点名剩余 owner；拒绝理由可查；新提案回应旧理由；过时清理有删除/保留证据。

**失败/例外**：无法确认完全取代时保留两份并交叉链接；机械/本地 UI 改动可豁免新笔记；已有记录仍受冻结保护。

**反模式**：编辑归档笔记「跟上」当前行为；部分取代却删旧笔记；重新提案忽略记录的拒绝理由。

**源记录**：flush 的 superseded cadence、Web steer 的部分取代、Workspace recency 的 owner gap、id/JSONL/E2B/desktop/preset 的取代或重新引入条件，以及四条 proposed（`2026-09-17-defer-office-background-scheduling.md`、`2026-09-19-provider-only-instruction-reads.md`、`2026-09-19-shell-env-key-declarations.md`、`2026-09-19-trim-session-query-convenience-api.md`）与三条 rejected（`2026-06-20-truncate-interrupted-turns.md`、`2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md`、`2026-07-26-dependency-swaps-rejected-by-nih-audit.md`）；归档/生命周期政策来自 `.agents/notes/README.md` 与 `.agents/notes/AGENTS.md`。

来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:26-35@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:46-50@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-web-ui-no-steer-entry-or-interjection-chrome.md:22-29@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-09-10-derived-workspace-recency.md:32-37@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:41-46@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-09-19-remove-desktop-profile-core-cleanup.md:13-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:21-28@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-17-defer-office-background-scheduling.md:15-22@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-provider-only-instruction-reads.md:13-22@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-shell-env-key-declarations.md:13-18@687f282e 来源：deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-trim-session-query-convenience-api.md:13-20@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-truncate-interrupted-turns.md:28-31@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:35-37@687f282e 来源：deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:74-78@687f282e 来源：deepseek-harness/.agents/notes/README.md:38-50@687f282e 来源：deepseek-harness/.agents/notes/AGENTS.md:1-7@687f282e

<a id="reviewable-boundaries"></a>
### 4.16 `rationale-simplification-2-reviewable-boundaries` — 可审查边界

**何时用**：一个简化同时触及 UI、wire、CLI、持久化或发布契约；或为了「一次做完」把独立变更塞进同一 PR。

**规则**：

- 把独立合同拆成独立可审查变更：UI 行为、wire 格式、CLI 参数、持久化格式各有所有者与回滚边界。
- 拆分不等于半成品：每个切口必须自身完整（代码、测试、文档、迁移、回滚）；不能把未完成部分留给「后续」却不命名。
- 两个变更必须原子落地时，在同一变更中说明耦合理由与回滚顺序。
- 被推迟部分命名 owner/后续项；当前变更不宣称它已完成。
- 审查者按合同边界检查 diff，不把跨域改动藏在「清理」里。

**操作**：列合同边界 → 判断是否独立 → 拆分并补完整每个切口 → 为耦合写理由/回滚顺序 → 命名后续项并审查。

**完成信号**：每个切口完整且可独立回滚；耦合有理由/顺序；后续项有 owner；无隐藏跨域改动。

**失败/例外**：原子耦合可合并，但需回滚顺序；纯机械重命名可随主变更。

**反模式**：独立 wire/UI 改动塞进清理 PR；拆出半成品说「后续」；以「一次做完」隐藏跨域风险。

**源记录**：Workspace wire/CLI（`2026-07-31-one-route-to-add-a-workspace.md`）、SDK 工具链、source launch/build（`2026-08-12-separate-source-launch-from-build.md`）、id 统一、JSONL、native/PTC。

## 5. 评审清单（可直接贴到 PR）

- [ ] 候选表面有精确符号/同义名，而不是模糊模块名。
- [ ] 四类消费者（生产/测试/文档生成/发射方）都有结论；测试适配器已改写或说明。
- [ ] 六列删除闭包全勾销；生成物已重建；旧名字无残留。
- [ ] 失败测试已分类；行为断言有生产承载者；快照差异逐条解释。
- [ ] 代码 API 与已发布数据已分类；无原地重写；无别名/墓碑/双写；旧数据可导出/升级。
- [ ] 每个操作/事实/共享语义有唯一 owner；适配器不成为第二权威。
- [ ] 保留的承载例外有一行当前证据；没有「以后可能有用」。
- [ ] 默认组合最小；opt-in 的注册/查找/展示/测试四件套完整；禁用点在注册行。
- [ ] 模型可见面只有任务概念；无原始大对象；显示层不解析字符串重建状态。
- [ ] UI 删除保留命中区/光标/取消/可发现性；布局用 CSS；真实 UI 已验证。
- [ ] 性能/缓存有作用域、基线、负控制、校准、失效条件；不显著项已回退。
- [ ] 时间/调度/投递边界显式（IANA 时区、单一投递语义、缺值报错），不是由客户端猜测或持久化。
- [ ] 过时的防御性清理/兼容代码有产生条件；条件消失后删除并保留字节不变/回归验证。
- [ ] 部分取代点名剩余 owner；归档三件套未被修改；拒绝理由仍可查。
- [ ] 独立合同已拆分；每个切口完整；耦合有理由/回滚顺序；后续项有 owner。
- [ ] 未执行项明确写「未执行」，不是「通过」。

## 6. 已知限制与未决问题

1. **当前代码未复核**：本提取只读了 61 篇笔记的英文/中文正文与侧车，没有逐条验证 archived/implemented 决策在固定提交的代码中仍然成立。历史笔记不是当前行为权威；采用前必须读当前代码/政策。
2. **外部消费者未知**：proposed 的 55–58 以及 SDK/依赖类删除依赖「无消费者」的结论；出树/外部调用方无法由本仓库搜索证明。相关删除应保留不确定性，不能宣称全局安全。
3. **共享排序 owner 缺口**：`2026-09-10-derived-workspace-recency.md` 明确记录旧的共享排序策略没有活跃笔记 owner；这是源记录披露的治理缺口，不是本手册能补上的绑定。
4. **验证全部为计划**：本手册和知识 JSON 的 `verification` 都是 planned；没有运行目标项目的构建、测试、快照、迁移、回滚、性能或多平台检查。第 5 节清单是待执行项，不是通过证据。
5. **翻译侧车**：46 篇 archived 笔记的英文/中文/侧车 git blob 与清单一致；15 篇非 archived 侧车只核对了标题键数与英文标题数一致，没有重算 per-heading 哈希。侧车是结构/一致性元数据，不是语义权威。
6. **范围**：本手册只覆盖 `rationale-simplification-2` 的 61 篇英文笔记（另有 60 篇同域笔记属于另一分区，未读）。它不声称覆盖全部 simplification 语料，更不声称覆盖其他领域。
7. **跨域未绑定**：根部 `AGENTS.md` 与 `packages/AGENTS.md` 的政策仅作为本域上下文阅读；没有把工程、测试、发布、文档、供应链等其他 owner 的 coverage 当作已绑定证据。相关跨域义务需由对应 owner 实际检查后建立 handoff。

## 7. 快速决策树

1. 这个表面有真实生产消费者吗？有 → 不要删；没有 → 进入 2。
2. 唯一消费者是测试/文档/声明吗？是 → 改写测试/文档，或删除声明；不是 → 进入 3。
3. 它承载生命周期/平台/测试确定性/真实工作吗？是 → 保留并记录承载例外；不是 → 进入 4。
4. 删除闭包能完整清算吗？不能 → 缩窄范围或拆后续；能 → 进入 5。
5. 涉及已发布数据吗？涉及 → 提供导出/升级、禁止原地重写；不涉及 → 快切并更新所有消费者。
6. 有第二入口/缓存/状态/语义家吗？有 → 先收敛到唯一 owner；没有 → 进入 7。
7. 验证包含行为测试、缺失检查、快照/请求样本吗？没有 → 补齐；有 → 记录证据并评审。

保守默认：证据不足时**保留表面、缩小删除范围、把提案留在 proposed**。不要把「删得更多」当成治理成熟度。

## 8. 精确来源索引（固定提交）

格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。路径相对源仓库根，范围是实际正文行（不含 EOF 合成空项）。每个机制列出覆盖不同证据面的代表性来源；完整来源数组见 `knowledge/rationale-simplification-2.json`。

### rationale-simplification-2-consumer-evidence

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:8-15@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:8-21@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:29-34@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:18-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-prune-producerless-vocabulary-variants.md:8-15@687f282e`

### rationale-simplification-2-removal-closure

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:22-25@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-tighten-hook-protocol-contract.md:17-20@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:14-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:14-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:16-23@687f282e`

### rationale-simplification-2-removal-verification

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:32-36@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:30-33@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:35-38@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:24-27@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:14-23@687f282e`

### rationale-simplification-2-compatibility-cut

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:28-31@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:14-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:16-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:16-23@687f282e`
- `deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:29-36@687f282e`

### rationale-simplification-2-single-route-owner

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-public-agent-stop-api.md:8-15@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-share-app-bin-boot-glue.md:12-17@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-19-use-one-session-surface-manager.md:12-26@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-20-retire-readline-front-door.md:14-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md:12-15@687f282e`

### rationale-simplification-2-derived-authority

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:8-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-19-use-one-session-surface-manager.md:8-11@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:14-25@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-24-agent-loop-observable-state-machine.md:16-32@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-31-capability-neutral-sandbox-policy-context.md:14-23@687f282e`

### rationale-simplification-2-current-owner-bar

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:8-15@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:29-34@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-drop-image-content-block.md:18-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-prune-producerless-vocabulary-variants.md:8-15@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-todo-write-opt-in.md:12-15@687f282e`

### rationale-simplification-2-load-bearing-exceptions

- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-prune-dead-seam-methods.md:29-34@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-06-20-public-agent-stop-api.md:16-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-28-local-json-tree-renderer.md:21-30@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-04-drop-windows-powershell-picker-fallback.md:18-25@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-28-windows-only-absent-probe-repair.md:14-17@687f282e`

### rationale-simplification-2-single-semantic-home

- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-share-app-bin-boot-glue.md:12-17@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-04-tighten-hook-protocol-contract.md:17-20@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:14-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-19-use-one-session-surface-manager.md:12-26@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:14-25@687f282e`

### rationale-simplification-2-fallback-platform-scope

- `deepseek-harness/.agents/notes/archived/simplification/2026-08-04-drop-windows-powershell-picker-fallback.md:8-17@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-28-windows-only-absent-probe-repair.md:14-17@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-15-host-only-remote-input-validation.md:14-21@687f282e`
- `deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:15-24@687f282e`
- `deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-provider-only-instruction-reads.md:13-22@687f282e`

### rationale-simplification-2-minimal-default

- `deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-todo-write-opt-in.md:8-11@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:14-28@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-01-ptc-omits-workflow-tool.md:12-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-08-web-subagent-catalog-projections.md:12-21@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-15-model-agent-availability-and-team-targets.md:12-19@687f282e`

### rationale-simplification-2-model-surface-minimalism

- `deepseek-harness/.agents/notes/archived/simplification/2026-07-20-unwrap-injected-content-envelopes.md:8-16@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-31-capability-neutral-sandbox-policy-context.md:14-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:8-13@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-01-ptc-omits-workflow-tool.md:12-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-15-model-agent-availability-and-team-targets.md:12-19@687f282e`

### rationale-simplification-2-visual-preserves-behavior

- `deepseek-harness/.agents/notes/archived/simplification/2026-07-21-tui-remove-cancel-command.md:8-11@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-30-sidebar-resize-without-visible-pill.md:8-11@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-10-web-remove-steering-interjection-caption.md:12-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:8-11@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-01-css-produced-file-layout.md:8-13@687f282e`

### rationale-simplification-2-measurement-evidence

- `deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:12-19@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-28-windows-only-absent-probe-repair.md:18-30@687f282e`
- `deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:15-24@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-19-knip-config-cleanup.md:12-20@687f282e`

### rationale-simplification-2-supersession-memory

- `deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:26-35@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-07-31-web-ui-no-steer-entry-or-interjection-chrome.md:22-29@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-09-10-derived-workspace-recency.md:32-37@687f282e`
- `deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e`
- `deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e`

### rationale-simplification-2-reviewable-boundaries

- `deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:29-32@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:16-23@687f282e`
- `deepseek-harness/.agents/notes/archived/simplification/2026-08-12-separate-source-launch-from-build.md:8-13@687f282e`
- `deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e`
- `deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e`

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `rationale-simplification-2-consumer-evidence`：`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:16-19@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-adapter-change-event.md:22-27@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:8-13@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:8-13@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:8-15@687f282e`、`deepseek-harness/.agents/notes/proposed/simplification/2026-09-17-defer-office-background-scheduling.md:15-22@687f282e`、`deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-trim-session-query-convenience-api.md:13-20@687f282e`
- `rationale-simplification-2-removal-closure`：`deepseek-harness/.agents/notes/archived/simplification/2026-06-20-drop-unconsumed-llm-assembled-surfaces.md:34-40@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-04-tighten-hook-protocol-contract.md:27-30@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-19-retire-subagent-mock-package.md:24-29@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:33-35@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:24-27@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:12-17@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-26-remove-agent-spine-demo.md:18-21@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-16-subagent-catalog-membership-only.md:12-17@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-07-28-remove-synthetic-log-only-turns.md:15-26@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:11-20@687f282e`
- `rationale-simplification-2-removal-verification`：`deepseek-harness/.agents/notes/archived/simplification/2026-07-20-retire-readline-front-door.md:24-32@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-20-retire-readline-front-door.md:33-37@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:33-38@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-cmdline-program-action.md:26-30@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-12-trim-agent-teams-read-and-lifecycle-surface.md:50-53@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-07-28-remove-synthetic-log-only-turns.md:37-40@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:47-51@687f282e`、`deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-trim-session-query-convenience-api.md:27-32@687f282e`
- `rationale-simplification-2-compatibility-cut`：`deepseek-harness/.agents/notes/archived/simplification/2026-08-08-remove-cli-demo.md:27-32@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:28-37@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:21-26@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:35-40@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-09-11-remove-e2b-providers.md:41-46@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-09-19-remove-desktop-profile-core-cleanup.md:13-22@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-06-20-truncate-interrupted-turns.md:28-31@687f282e`
- `rationale-simplification-2-single-route-owner`：`deepseek-harness/.agents/notes/archived/simplification/2026-07-31-web-ui-no-steer-entry-or-interjection-chrome.md:12-21@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-10-source-run-without-managed-installer.md:14-19@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-11-cmdline-program-action.md:12-17@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-19-deepseek-messages-only.md:12-17@687f282e`
- `rationale-simplification-2-derived-authority`：`deepseek-harness/.agents/notes/archived/simplification/2026-06-19-drop-mutable-session-summary.md:20-27@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-09-conversational-schedule-delivery.md:14-21@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-12-trim-agent-teams-read-and-lifecycle-surface.md:18-33@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-10-derived-workspace-recency.md:12-21@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-08-09-explicit-schedule-time-zone.md:13-22@687f282e`
- `rationale-simplification-2-current-owner-bar`：`deepseek-harness/.agents/notes/archived/simplification/2026-08-13-remove-first-run-beta-notice.md:12-15@687f282e`、`deepseek-harness/.agents/notes/proposed/simplification/2026-09-19-shell-env-key-declarations.md:13-18@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:11-73@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-28-omit-unneeded-invariant-companions.md:16-23@687f282e`
- `rationale-simplification-2-single-semantic-home`：`deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:14-44@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-08-21-product-subagent-minimal-diagnostics.md:45-54@687f282e`
- `rationale-simplification-2-model-surface-minimalism`：`deepseek-harness/.agents/notes/archived/simplification/2026-07-20-unwrap-injected-content-envelopes.md:17-24@687f282e`
- `rationale-simplification-2-visual-preserves-behavior`：`deepseek-harness/.agents/notes/archived/simplification/2026-07-30-sidebar-resize-without-visible-pill.md:12-17@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-01-css-produced-file-layout.md:14-19@687f282e`
- `rationale-simplification-2-measurement-evidence`：`deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:20-37@687f282e`、`deepseek-harness/.agents/notes/archived/simplification/2026-09-06-agent-request-freeze-evidence.md:38-59@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md:35-37@687f282e`
- `rationale-simplification-2-supersession-memory`：`deepseek-harness/.agents/notes/archived/simplification/2026-07-23-collapse-persistence-flush-state.md:46-50@687f282e`、`deepseek-harness/.agents/notes/implemented/simplification/2026-10-09-preset-owned-subagent-composition.md:21-28@687f282e`、`deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-dependency-swaps-rejected-by-nih-audit.md:74-78@687f282e`
- `rationale-simplification-2-reviewable-boundaries`：`deepseek-harness/.agents/notes/archived/simplification/2026-08-12-separate-source-launch-from-build.md:14-21@687f282e`

来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:29-32@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-07-31-one-route-to-add-a-workspace.md:33-38@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:16-23@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:28-37@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-12-separate-source-launch-from-build.md:8-13@687f282e 来源：deepseek-harness/.agents/notes/archived/simplification/2026-08-12-separate-source-launch-from-build.md:14-21@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-06-20-unify-agent-and-session-id.md:17-24@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:13-20@687f282e 来源：deepseek-harness/.agents/notes/implemented/simplification/2026-10-05-native-or-ptc-presentation.md:11-14@687f282e