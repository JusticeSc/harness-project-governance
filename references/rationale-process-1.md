# DeepSeek Harness 项目治理机制迁移参考（rationale-process-1）

本参考只依据固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中各 Agent Note 的正文提取，覆盖 `rationale-process-1` 分区的 80 篇英文 Note 及其 80 篇中文对侧。它面向要把这些治理机制迁移到另一个代码库的维护者与编码 agent，不要求读者持有原仓库。

## 如何使用

1. 先按“触发”定位机制；不要一次套用全部机制。每个机制都给出前置条件、步骤、责任角色、完成信号、失败处理和证据边界。
2. 标注 `【源义务】` 的是源 Note 明确要求或实现的行为；`【迁移设计】` 是为了在新仓库落地而建议的实现方式，源仓库没有逐字规定；`【额外建议】` 是可选项。
3. 源 Note 中的项目名、路径、命令、runner 标签和实测数字是**源示例**，迁移时应参数化；不要因为新项目规模不同而删除仍然适用的义务。
4. 所有验证场景在本文中都是 **planned**。提取阶段没有运行目标仓库的构建、测试、lint、格式化、远程操作或发布；任何“自动保证”都必须等目标实现与独立验证真实执行后才能声称。
5. 引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`。只读源码路径是相对原仓库根目录的路径。

## 机制索引

| 机制 ID | 解决的问题 | 主要强制方式 |
|---|---|---|
| rationale-process-1-agent-note-lifecycle | 决策 rationale 丢失、笔记互相竞争 | 评审 + 格式/配对门禁 |
| rationale-process-1-frozen-archive-integrity | 历史记录被删或漂移 | 归档验证器 + 追加式哈希清单 |
| rationale-process-1-quality-gates-and-verification | 口头约定无法阻止回归 | 可执行检查 + 必需 CI |
| rationale-process-1-change-scope-and-reviewability | 改动范围/证据不可评审 | 范围报告 + 具体化文本审查 |
| rationale-process-1-unknown-cast-baseline | 新增 unknown 断言掩盖类型错误 | AST 检查 + 精确基线 |
| rationale-process-1-work-budget-and-test-determinism | 超时测 runner、固定 sleep、临时目录泄漏 | 结构预算 + 确定性等待 + 自清理 |
| rationale-process-1-document-taxonomy-and-ownership | 文档重复、无主、预算失控 | 分层/预算/生成门禁 |
| rationale-process-1-bilingual-pairing-and-links | 双语漂移、链接指向错误语言 | 配对哈希 + 本地化链接检查 |
| rationale-process-1-documentation-publication | 站点复制语料、导航漂移 | 单一投影 + 构建失败 |
| rationale-process-1-document-content-contracts | README 缺限制、API 文档不全 | 包集合/标题/AST 检查 |
| rationale-process-1-generated-reference-freshness | 生成参考过期或漏项 | 生成器 + 测试 lane 字节断言 |
| rationale-process-1-package-manager-and-workspace-policy | 安装不可复现、隐式依赖 | 版本固定 + 严格链接 + 允许清单 |
| rationale-process-1-dependency-selection-policy | 手写标准能力或引入未审查依赖 | 评审清单 + 锁文件 |
| rationale-process-1-product-isolation-and-classification | 实验代码泄漏、休眠包 | 静态隔离/用途检查 |
| rationale-process-1-build-command-separation | 构建/检查职责混乱 | 命令拆分 + 依赖图调度 |
| rationale-process-1-typecheck-source-only | 为声明生成而打包 | 源码声明生成 + 构建输出守卫 |
| rationale-process-1-gate-performance-optimization | 重复解析/遍历/探测拖慢门禁 | 测量 + 等价性测试 |
| rationale-process-1-built-artifact-validation | 源码模式掩盖打包失败 | 纯 Node 构建产物执行 + face 命名 |
| rationale-process-1-ci-topology-and-portability | 必需检查排队、平台矩阵浪费 | 可分配 runner + 独立 job |
| rationale-process-1-native-platform-evidence | Wine 不能证明原生行为 | 原生 CI + 完整分母 |
| rationale-process-1-release-integrity | 部分发布、版本身份丢失 | 候选验证 + 可信发布 |
| rationale-process-1-signed-runtime-supply-chain | 重复硬件签名/时间戳误判 | 验证式缓存 + 签名分离 |
| rationale-process-1-installer-and-source-plane | 安装器二次克隆/源码平面回退 | checkout 检测 + 单布局 + 源解析门禁 |
| rationale-process-1-worktree-local-hooks | 共享 hooks 互相改写 | worktree 局部配置 + 锁 |
| rationale-process-1-issue-and-label-workflow | 标签歧义、评审状态漂移 | 分类法 + 事件命令 |
| rationale-process-1-pull-request-stack-and-review | 依赖 PR 链手动落地、评审权重失真 | 官方 stack + lease + blame 权重 |
| rationale-process-1-repository-tooling-hygiene | linter 迁移丢规则、双重格式化 | 单 runner + 规则清单 |
| rationale-process-1-design-token-system | 设计值漂移、偏离无记录 | 活规范 + 偏离表 |
| rationale-process-1-public-api-reporting | 公开 API 变更不可见 | （提案/未实现）报告 diff |
| rationale-process-1-transition-retirement | 临时命令永久化 | 实时清单 + 永久检查 |
| rationale-process-1-audience-first-documentation | 文档机械通过但读者失败 | 部分门禁 + 提案切片 |

---

## 一、知识与审计

<a id="rationale-process-1-agent-note-lifecycle"></a>
### rationale-process-1-agent-note-lifecycle — 只为长期决策理由维护记录

**触发**：代码、测试与现有文档无法解释的长期决策理由需要新增或改变时。同一决策更新既有owner，不复制一篇。机械/局部编辑（包括局部UI展示和交互）可不写；归档07-19的“每项非平凡变更”是历史，不是当前触发器。

**前置条件**：一个生命周期/分类/日期主题路径树；可执行classification、format、配对及可信基线archive门禁。语义理由和取代关系仍有明确作者/评审者负责，不能因语料少而推迟源仓已有自动约束。

**步骤**

1. 【源义务】按当前README为长期理由在生命周期/分类树创建或更新owner Note，用相对链接关联受影响代码/文档；不建立生成的全局索引或第二套笔记目录。
2. 【源义务】在正文中写清问题、决策、备选方案、后果，并给出明确状态：`proposed`、`implemented` 或 `rejected`。
3. 【源义务】同PR检查全部重叠活跃决策。完全合并并删除旧Note前保留独有理由、替代方案、后果、必需验证和已知覆盖缺口，修复全部入站链接并删除完整三元组；部分取代继续交叉链接。仅在完整实现、低未来指导价值且仍有历史价值时归档；小UI/纯机械旧记录按规则删除，有用的安全/持久化/重引入边界保持活跃。
4. 【源义务】proposed Note 不得归档；rejected Note 只有在仍能阻止一个可信的错误重现时才保留，否则随其链接一起删除。
5. 【迁移设计】把 Note 链接到受影响的代码/文档；评审清单增加“是否缺少 Note、状态是否真实、是否检查了取代关系”。
6. 【源义务】如果仓库维护双语正文，英文与中文必须同权威、同结构并保持配对；不要只改一侧。

**角色与完成信号**：作者负责触发判断、正文和取代检查；评审者负责语义时效与状态真实性；文档门禁负责格式、配对和链接。完成信号是：活跃语料中只有一个当前权威，状态与实现一致，归档/删除符合生命周期规则。

**强制与信任**：源仓classification、format、archive检查在doc-sync/static CI执行，PR提供受信base SHA。迁移的三个真实Node执行器、目标cwd和激活步骤见[Agent Note门禁](agent-notes.md)；接入真实CI和完整历史基线后才能声明该目标的CI效果。配对和链接另有必需门禁，不能用本模块冒充；语义由评审负责。归档自动合同见[冻结完整性](#rationale-process-1-frozen-archive-integrity)。

**失败与恢复**：缺少 Note 时由评审拒绝或要求补充；Note 过期时更新状态并交叉链接取代者；配对失败时补齐对侧并重录记录；发现完全取代时归档旧 Note 或删除不再有保留价值的 rejected Note。

**例外**：机械或局部修改，包括局部UI展示/交互，无新长期决策时可省Note；不再防止可信错误的rejected提案可整组三元组删除；归档是永久冻结历史，不能更新或当作现行权威。小实现若仍有命名、兼容、所有权、安全或重引入理由，不因行数少自动删除。

**证据边界**：源 Note 没有规定统一的篇幅阈值或“每篇都必须有 Note”的自动检查；不要声称存在这样的保证。归档的完整性由下一个机制负责。

**来源**

- `deepseek-harness/AGENTS.md:155-155@687f282e`（当前触发）
- `deepseek-harness/.agents/notes/README.md:7-125@687f282e`（当前路径、生命周期与格式）
- `deepseek-harness/package.json:122-124@687f282e`、`deepseek-harness/scripts/run-gates.ts:852-854@687f282e`、`deepseek-harness/.github/workflows/ci.yml:104-107@687f282e`（源CI执行关系，非目标执行证明）
- `deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:1-47@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-19-remove-generated-agent-note-index.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:1-45@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:1-47@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-remove-generated-agent-note-index.md:1-32@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:1-45@687f282e

<a id="rationale-process-1-frozen-archive-integrity"></a>
### rationale-process-1-frozen-archive-integrity — 冻结归档：完整三元组与追加式密封清单

**触发**：一篇 implemented Note 的决策已经完成、其 rationale 不太可能指导未来工作；或者需要定位/引用一条历史决策；或者分支要新增、移动、修改归档文件。

**前置条件**：存在归档路径（源示例为 `.agents/notes/archived/<kind>/`）；有可重复运行的归档验证器；CI 能取得可信基线提交并检出完整历史。

**步骤**

1. 【源义务】只接收完整的implemented三元组：英文、中文、配对记录侧车；两种正文的Archived日期必须相同、有效且不早于文件名日期，不要求归档日期等于最初创建日期；proposed永不归档。
2. 【源义务】移动完整三元组；在两种语言正文的 `Status: implemented` 下插入 `Archived: YYYY-MM-DD`；只允许移动、该元数据行、侧车重录和机械的入站链接修复。
3. 【源义务】归档后冻结字节：不再为改名的包、行为变化、翻译标准、格式、断掉的外链或后来的文档约定更新它。活跃正文可以链接归档、重定向到当前权威或删除链接，但归档本身不改。
4. 【源义务】普通格式、配对、换行、Markdown 链接、包路径、Mermaid、文档 TypeScript、类型等价门禁把归档源排除；改为验证“指向归档的链接”。
5. 【源义务】按路径与 SHA-256 把每个归档产物封入追加式清单；`--write` 先证明所有既有封印未变，再只追加新归档产物。
6. 【源义务】PR CI 使用可信 base SHA 并检出完整历史；浅检出不能作为有效基线。
7. 【迁移设计】使用[已交付的Node执行器](agent-notes.md#3-冻结归档与可信历史)：默认无参数为只读验证，`--write`仅在本地核对旧seal后追加新项；受信CI不自动重写清单。按完整激活步骤配置归档指令、历史基线和普通文档门禁的排除清单。

**角色与完成信号**：归档作者执行移动与重录；归档验证器证明完整性与追加性；CI 提供可信基线；评审者确认决策确实完成且仍有历史价值。完成信号是：清单只增不改、三元组完整、活跃门禁跳过归档源且指向归档的链接仍有效。

**强制与信任**：清单证明字节完整和追加式行为，不证明归档决策正确、摘要准确或链接仍有意义。只读权限和分支保护是外部信任边界，需另行验证。

**失败与恢复**：哈希变化、三元组不完整、日期错误或基线缺失时验证失败；恢复方式是还原字节/改用归档写入路径/提供可信基线。若发现归档内容本身有误，不直接改归档；在活跃文档中给出勘误并链接历史。

**例外**：活跃正文的入站链接可以机械修复。源仓针对一次Figma链接移除的精确seal转换授权仅属于源仓，不转授目标；迁移执行器默认严格追加，没有通用解封开关。目标若需改历史，必须另有明确受信授权与精确审计流程。冻结文件不参与普通文档门禁。

**证据边界**：归档可以保留过时事实与断链，这是设计而非缺陷；不要把“归档存在”当作“历史结论仍正确”。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:1-45@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:1-45@687f282e

<a id="rationale-process-1-quality-gates-and-verification"></a>
### rationale-process-1-quality-gates-and-verification — 把仓库承诺变成可执行、可恢复的检查

**状态**：主体来自归档 Note（2026-06-11）；该 Note 明确说明其 hook/CI 对称性已被后续 fast-local-git-hooks 决策取代，只有“CI 是穷尽强制路径”继续作为当前要求。精确基线、标签禁令和 unknown 断言限制来自 implemented 记录。

**触发**：一个不变量重要到评审者可能遗漏、贡献者可能合理忘记；新增/删除/迁移检查；用截图、视频、生成物或运行结果作为评审证据；提出门禁例外、基线或抑制。

**前置条件**：检查能读取确定性输入；有本地入口和 CI 入口；团队能控制必需检查/分支保护；失败能给出可操作的补救信息。

**步骤**

1. 【源义务】把重要承诺编码为可执行检查：违反时非零退出，而不是只写在文档里。
2. 【源义务】把可执行检查同时接入本地钩子与 CI，但按明确预算运行不同子集：本地钩子优先快速缺陷，CI 运行穷尽集合并拥有最终判定；必需结果依赖实际检查，不依赖可能永远排队的聚合壳。不要把归档 Note 中的“hook/CI 完全对称”当作当前义务；它已被后续决策取代，只有 CI 的穷尽强制仍是当前要求。
3. 【源义务】独立检查并行/分别报告，让一次运行看到所有独立失败；只在源定义的场景用 fail-fast；未完成/被跳过的步骤绝不能记为通过。
4. 【源义务】每个声称的验证都要有正例、反例和恢复证据；绿色摘要、历史回放、缩略图或派生的 GIF 不是证据。
5. 【源义务】浏览器/运行时证据只执行一次，保留原始产物和可重复验证路径；不要从缩略图推断成功。
6. 【源义务】例外必须窄、可解释、可机械约束；优先精确基线，而不是整文件放行或数量预算；删除检查前先让替代者接管不变量。
7. 【迁移设计】为每个检查写“验证的谓词、输入、失败信息、补救命令、正/反/恢复测试”；让贡献者在出站前检查 diff、只运行覆盖其行为的最窄检查一次，把完整本地彩排留给显式请求、CI 诊断或无法用窄证据可信验证的全仓变更。

**视觉证据补充（来自浏览器录制与视频决策）**

- 【源义务】一份 storyboard 固定到精确 PR head：要求 clean worktree 并记录 commit SHA；每次运行使用 fresh app/agents home、workspace、session 和隔离浏览器状态；所有已发布帧来自同一个 server 与 model-backed run；失败运行丢弃并从头重跑，不把两次运行的帧拼成一次成功。
- 【源义务】等待唯一、精确的语义状态；当 claim 涉及工具调用、拒绝或恢复时，storyboard 要有 detail/trajectory 帧显示工具、状态或稳定错误码以及下游结果。最终编码 GIF 是验证对象；查看器不能播放时，从该 GIF 解码代表帧，而不是把源截图当作等价证据。
- 【源义务】发布后再验证边界：优先在 `gh --attach` 可用时（v2.99.0+、github.com、≤10MB）让 body 引用本地文件、上传并改写为 URL，然后重新读取 live body，确认 URL 返回 `200` 与 `image/gif`；不满足这些条件时走 assets-branch 路径，校验 path、字节数、checksum、状态和 media type。上传或 push 成功本身不是证据。
- 【源义务】浏览器控制流程优先；不可用时用仓库声明的 Playwright 在隔离 headless 浏览器中录制，不另装 driver，也不打开用户浏览器。原生 production surface 只能用正常应用配置切到官方、可浏览器操作的后端，并在 GIF 旁说明该覆盖；fixture、mock transport、synthetic event 或 test-only hook 不能支撑“真实生产路径”claim。
- 【源义务】视频捕获时 viewport 与录制尺寸显式一致；保留原始 WebM，等待 context 关闭后再编码；编码器只选一个连续区间，记录源时长、所选区间、播放倍速、末尾停留、编码尺寸/时长/帧数/大小；裁剪和倍速不证明模型响应延迟；失败录制不能贡献帧；依赖 ffmpeg/ffprobe 的媒体测试显式运行，CI 不 provision 这些二进制。
- 【源义务】fail-fast 只用于源定义的聚合：第一个 blocking gate 失败会终止进程树，未运行的 gate 记为 `skipped`，被终止却退出 0 的子进程也绝不能记为 passed；建议性诊断 lane 保持完整，不能为了省时截断其证据。
- 【已知限制】源中的 per-file 100% coverage 可能产生无断言的测试，mutation testing 只是计划中的反制，不能把覆盖率当作测试有效性证明。

**角色与完成信号**：贡献者运行本地门禁；评审者判断语义范围；CI 执行必需检查；门禁所有者维护检查本身。完成信号是：失败可复现、必需结果真的被 forge 阻塞、修复后检查转绿，且反例仍会失败。

**强制与信任**：检查只证明其编码的谓词和实际读取的输入；绿灯不等于设计正确、文档友好或人已准备好。检查器失败不等于 forge 已阻塞；必需检查配置、权限和分支保护是独立的信任边界。

**失败与恢复**：失败时保留完整缓冲输出、命令、退出原因和失败步骤；修复输入或实现后重跑；跳过/未运行按未验证处理；检查本身失效时先恢复不变量或明确记录移除与替代 owner。

**例外**：明确标注且可见的建议性诊断可以不在必需判定内；精确历史基线可以保留已知债务，但不得提供新增债务的命令；被替代的检查只有在替代者通过等价性证据后才能删除。

**证据边界**：不要把本地通过当作远端阻塞，不要把一次成功当作长期保证，不要把“没有报告失败”当作“检查覆盖了该行为”。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-06-11-quality-gates.md:1-31@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-08-browser-gif-evidence-chain.md:1-38@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-19-remove-knip.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-27-gate-runner-fail-fast.md:1-38@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-08-playwright-video-gif.md:1-30@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:1-39@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:1-35@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-06-11-quality-gates.md:1-31@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-08-browser-gif-evidence-chain.md:1-38@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-19-remove-knip.md:1-28@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-27-gate-runner-fail-fast.md:1-38@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-08-playwright-video-gif.md:1-30@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:1-39@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:1-35@687f282e

<a id="rationale-process-1-change-scope-and-reviewability"></a>
### rationale-process-1-change-scope-and-reviewability — 明确改动范围、具体化文本与可判定评审

**触发**：改动跨越多个关注点、删除代码、声称“清理/简化/等价”；评审者需要判断一个断言是否有来源、测试或运行证据；正文或标识符使用含义依赖上下文的宽泛词；预发布阶段要重命名公开符号或持久字段。

**前置条件**：评审模板或 Note 中有范围/证据位置；仓库能搜索调用点、动态注册和历史决策；团队接受“不知道”可以写进证据而不是猜。

**步骤**

1. 【源义务】在请求评审前写清：意图行为、受影响 owner、已验证内容、推断内容、明确不在范围内的内容。
2. 【源义务】把改动保持为可独立评审的单元；不要把一个执行决策与无关的批量重设计混在一起。
3. 【源义务】删除/简化前先做证据调查：调用方、运行时路径、测试、历史决策、替代 owner；报告不确定性，不要把不确定转成删除。
4. 【源义务】正文点名行动者、动作、对象和已记录事实；用局部精确概念，不用一个抽象总括词覆盖多种含义。
5. 【源义务】只对一个已经扩散到互不相关契约的歧义 token 加机械禁令；逐处换成局部概念，并保留语义评审。若预发布，优先协调重命名公开符号和当前持久字段，而不是保留别名；运行期兼容读取可以在不嵌入退役 token 的前提下重建旧键。
6. 【迁移设计】评审清单的每一项都要可观察：命名产物、命令、测试、报告或失败；拒绝“更清晰”“更友好”这类不可判定项。
7. 【额外建议】对“简化调查”产出表格：候选、证据、风险、处置、剩余未知；只在证据支持时删除。

**角色与完成信号**：作者提供范围与证据；评审者逐项核对；领域 owner 确认替代 owner。完成信号是：删除/重命名有可复现依据，清单项都有产物，剩余未知被明确记录。

**强制与信任**：范围报告和评审仍是人工判断；token 扫描只证明某个词不存在，不证明替换后语义精确；别名可能让两种含义继续共存。

**失败与恢复**：无依据的删除被拒；发现动态路径漏查时恢复代码并补调查；扫描命中时按历史/当前边界修复；不可判定清单项改写为可观察项。

**例外**：历史持久化证据可在受限 schema 标记内保留旧标识符；vendored/archived 内容按其 owner 规则排除；一个真正只有一个局部含义的宽泛词可以保留，但评审要记录该含义。

**证据边界**：不要把“搜索不到引用”当作“没有运行时使用”；不要把“通过 token 禁令”当作“文本已具体”；范围报告是作者声明，除非评审者核对了证据。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-27-explicit-change-scope-report.md:1-42@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-19-web-styling-system.md:1-62@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-09-concrete-prose-names-actors-and-recorded-facts.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-19-evidence-led-simplification-surveys.md:1-67@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:1-39@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-27-explicit-change-scope-report.md:1-42@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-web-styling-system.md:1-62@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-concrete-prose-names-actors-and-recorded-facts.md:1-40@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-19-evidence-led-simplification-surveys.md:1-67@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:1-39@687f282e

<a id="rationale-process-1-unknown-cast-baseline"></a>
### rationale-process-1-unknown-cast-baseline — 对新增 unknown 断言采用精确基线

**触发**：第一方 JavaScript/TypeScript 新增 `as unknown` 或 `<unknown>`（包括测试、fixture、benchmark、脚本）；既有断言被编辑、移动、改名或删除；基线条目变旧；有人提出整文件或数量预算的例外。

**前置条件**：语言解析器可生成语法树；能枚举已跟踪和未忽略的未跟踪源文件；有稳定的指纹格式（路径 + 语法 token 的 SHA-256 + 出现次数）。

**步骤**

1. 【源义务】禁止新增直接断言到 `unknown`，包括带括号的目标类型和直接包含 `unknown` 成员的联合目标。
2. 【源义务】保留 `unknown` 声明：外部数据可以 `const value: unknown = JSON.parse(text)` 进入并先交给声明的解析器；已有类型的进程内值仍不得添加不必要的运行时校验。
3. 【源义务】用 AST 扫描，而不是文本搜索；忽略注释、字符串和声明，避免空白/注释/尖括号语法漏检。
4. 【源义务】为每个既有断言记录仓库相对路径、断言语法 token 的 SHA-256、出现次数；基线编辑只能删除条目或减少计数。
5. 【源义务】提供 `--prune`：删除条目/减少计数；存在新增违规时拒绝写入；不提供添加例外的命令。
6. 【迁移设计】把检查接入 CI 静态/主模式和本地 hygiene/check-all；按 owner 分派现有债务。

**角色与完成信号**：作者解决类型/解析/fixture 问题；评审者拒绝新增指纹或计数；检查器维护者维护指纹格式。完成信号是：基线只减不增，检查只报未登记的未知断言。

**强制与信任**：检查证明“没有未登记的、直接的 unknown 断言”，包括被直接 unknown 成员吸收的联合目标；不证明整体类型安全，不解析别名/交叉类型，也不覆盖 JSDoc `@type`、`unknown[]`、`Promise<unknown>` 等容器类型。

**失败与恢复**：新增/变化/未登记/陈旧条目都失败；改名、引号、尾随逗号、括号变化会改变指纹，即使运行行为不变；删除断言后必须 prune，防止无效例外积累。

**例外**：vendored 源码和冻结归档 Note 保留 owner 规定的排除；把断言换成 `any`、另一种未检查断言或隐藏转换的 helper 不算解决类型问题。

**证据边界**：不要声称“零 unknown 断言”或“类型安全”；只声称受检范围内没有未登记的直接断言。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:1-35@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:1-35@687f282e

<a id="rationale-process-1-work-budget-and-test-determinism"></a>
### rationale-process-1-work-budget-and-test-determinism — 用图结构预算代替墙钟判定，并修掉测试的不确定性

**触发**：门禁的通过/失败使用耗时阈值，但真正断言的是输入规模/布局；测试用固定 sleep 等待 fire-and-forget 写入、子进程退出、watcher 事件或 dispose 阶梯；测试/helper 在共享主机创建临时目录。

**前置条件**：能取得被断言图的实际汇总计数（例如每个版本的包数 × 被检查的内部边数）；能在代表性快/慢 runner 上测量；测试有可等待的完成信号或可探测的前置条件。

**步骤**

1. 【源义务】用结构预算判定增长：从实际产出的图计算计数，与一个常量上限比较；失败信息给出计数、预算和“先测量新成本再调常量”的指示。
2. 【源义务】保留独立的墙钟“挂起保护”，由预算推导（源示例为 4 × 预算 × 每单位秒数）；它是保护，不是增长判据，避免慢 runner 决定结果。
3. 【源义务】调高预算是一次刻意修改：必须附新的测量；不能只调大超时。
4. 【源义务】用可等待的完成/事件或带回退上限的就绪探测替代固定 sleep；真实挂起仍要被挂起保护终止。
5. 【源义务】每个测试在 teardown 删除自己创建的临时根（成功和失败都删）；不要依赖机器级 sweep。
6. 【迁移设计】把重要的但易受争用的 lane 保持可见；不要为了绿灯把它永久改成建议性；若确实无法修复，明确记录限制。

**角色与完成信号**：测试作者修同步点；门禁 owner 维护预算与常量注释；CI 维护者提供代表性 runner。完成信号是：同一输入在快/慢 runner 上判定一致，失败能区分“图变大”和“runner 慢”。

**强制与信任**：预算证明产出图不超过一个实测结构上限；不证明不会挂起，挂起保护仍可能耗尽完整上限。固定 sleep 的移除只有在真正等待完成信号时才算修复。

**失败与恢复**：超预算时测量新成本、决定拆分/优化/调常量；挂起保护到期才失败时，区分真实挂起与预算未覆盖的形态变化；临时目录残留时修生产者，不用 sweep 掩盖。

**例外**：按保留策略持久化的产品 spill 目录不是测试临时目录；挂起保护可以比较宽松，因为它不参与实质判定。

**证据边界**：预算可能漏掉“改变图形状但不改变所选乘积”的增长；测试仍可能有环境相关失败，应记录而不是声称全绿。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-08-28-test-temp-dir-self-cleanup.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-31-windows-coverage-flaky-test-budgets.md:1-52@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:1-50@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-08-28-test-temp-dir-self-cleanup.md:1-40@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-31-windows-coverage-flaky-test-budgets.md:1-52@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:1-50@687f282e

<a id="rationale-process-1-document-taxonomy-and-ownership"></a>
### rationale-process-1-document-taxonomy-and-ownership — 文档分层、预算、包锚定与维护模式

**触发**：新增文档/章节/生成页；一个事实将出现在多个文档；包的公开面或子系统边界移动；文档是提案、RFC 还是当前规范。

**前置条件**：有文档层级/目录约定；能把 owner 映射到包或领域；有预算清单或可测量的词数/结构指标。

**步骤**

1. 【源义务】按文档层级给每个持久事实一个 owner；其他位置链接而不是复制枚举、路径和默认值。
2. 【源义务】每层有明确预算：目标值和临时上限；保留余量并用棘轮，不要静默抬高上限。
3. 【源义务】子系统页锚定到包/ownership 布局，导航随代码结构移动。
4. 【源义务】标明维护模式（人工撰写、生成、混合、冻结、提案），不要让读者猜。
5. 【源义务】区分提案/RFC 与活规范；决策落地后更新活 owner，并归档/退役提案。
6. 【源义务】生成的关系图/索引来自源元数据，不手工维护链接清单。
7. 【迁移设计】先盘点文档、定义层级/owner/预算，再按一个内聚主题迁移；不要为文件数对称拆散紧密耦合的规则。

**角色与完成信号**：文档 owner 选层级/模式；包 owner 确认事实 owner；评审者检查重复与预算；生成器维护关系图。完成信号是：每个事实一个当前 owner，预算有余量，生成页可重建。

**强制与信任**：预算检查证明上限，不证明目标/余量规则被尊重；生成图证明覆盖，不证明关系有意义；owner 标签可能被错误选择。

**失败与恢复**：发现复制事实时确定唯一 owner 并改链接；超上限时拆分/迁移或记录经评审的例外；包移动时更新锚点、导航和重定向；提案落地后更新活规范并退役提案。

**例外**：穷尽式生成参考可以在定义入口层和拆分规则后超过普通正文预算；冻结历史文档保持原样。

**证据边界**：层级和 owner 仍是判断；预算上限不是质量证明；生成关系不等于读者能理解。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-03-documentation-graph-atlas.md:1-70@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-04-doc-tiers-and-budgets.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-19-web-styling-system.md:1-62@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-03-package-anchored-subsystem-pages.md:1-38@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-03-documentation-graph-atlas.md:1-70@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-04-doc-tiers-and-budgets.md:1-35@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-web-styling-system.md:1-62@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-03-package-anchored-subsystem-pages.md:1-38@687f282e

<a id="rationale-process-1-bilingual-pairing-and-links"></a>
### rationale-process-1-bilingual-pairing-and-links — 双语配对、章节记录与本地化链接完整性

**触发**：文档有英文和中文正文，或被提议翻译；只编辑了一侧，或两个分支编辑同一配对的不同章节；链接目标属于双语语料；新的文档类/索引可能落在链接检查器的发现范围之外。

**前置条件**：有配对文件命名（源示例为 `foo.md`、`foo.zh.md`、`foo.i18n.yaml`）；有能计算章节哈希/结构签名的验证器；有 Markdown 解析器；站点/GitHub 的链接解析行为已知。

**步骤**

1. 【源义务】两种语言同权威，没有 canonical locale；一致性记录必须能检测“只改一侧”的内容差异，并支持同 PR 编辑。
2. 【源义务】优先按顶层章节记录内容哈希，而不是整文件 blob 哈希；这样不同章节的独立编辑不会在同一记录行冲突。记录由机器计算，显式 `--write` 产生可评审的 yaml diff。
3. 【源义务】为每个发现且未排除的源要求完整配对、匹配的语言切换器（除已记录的单语生成页）和相同结构签名；用显式 manifest 记录排除项，而不是隐式跳过。
4. 【源义务】仓库内文档链接按源文件语言解析：英文指向 `.md`，中文指向 `.zh.md`；两侧保持同一语义目标和 query/fragment；目标在双语语料中但缺对侧是配对错误，不是回退到英文。
5. 【源义务】链接检查只处理相对路径目标（跳过 scheme、协议相对、根绝对路径和纯 fragment），去掉 query/fragment 后相对链接文件目录解析，存在性失败即非零退出。
6. 【源义务】发现范围必须包含根/包索引等所有可能含目标链接的源；检查器与测试共用同一个发现函数。
7. 【迁移设计】把配对写入/校验接入 doc-sync；为移动的路由保留别名；评审检查语义翻译，而不只哈希。

**角色与完成信号**：作者同时改两侧并重录章节；译者负责语义；文档门禁负责配对/结构/链接；合并 owner 处理记录冲突。完成信号是：双方完整、章节记录一致、结构签名相同、所有相对链接存在且语言正确。

**强制与信任**：门禁证明配对、哈希、结构和目标存在；不证明翻译准确、语义等价或译文可读。GitHub 的可合并性不会运行 worktree 本地 merge driver，因此不能依赖它解决 PR 记录冲突。

**失败与恢复**：缺对侧/哈希过期/结构不符/断链/错误语言时失败；补齐或重录；记录冲突时按章节重建或本地合并后重录；断链修复源，不手改生成产物。

**例外**：生成的英文单语参考、纯指令文件、构造上双语的文档可由 manifest 排除；外链、图片、纯 fragment 和范围外目标保持原行为；归档 Note 不参与普通配对。

**证据边界**：通过检查不等于翻译正确；章节记录仍可能在同一章节并发编辑时冲突；站点投影可能掩盖源级链接差异，所以源级检查必须独立运行。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-06-18-markdown-cross-link-lint.md:1-34@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-02-bilingual-docs-and-pairing-gate.md:1-45@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-18-localized-bilingual-links.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-08-package-index-link-discovery.md:1-24@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-23-section-keyed-translation-pairing-records.md:1-57@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-06-18-markdown-cross-link-lint.md:1-34@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-02-bilingual-docs-and-pairing-gate.md:1-45@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-18-localized-bilingual-links.md:1-40@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-08-package-index-link-discovery.md:1-24@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-23-section-keyed-translation-pairing-records.md:1-57@687f282e

<a id="rationale-process-1-documentation-publication"></a>
### rationale-process-1-documentation-publication — 单一源投影、原始 Markdown 孪生与自包含资产

**触发**：规范 Markdown 发布到网站；导航/章节顺序/路由清单变化；agent 或外部消费者需要源 Markdown 而非渲染 HTML；页面引用图片或另一文档。

**前置条件**：有唯一的规范语料；站点生成器支持显式 manifest/路由；能生成原始 `.md` 文件；有链接/锚点检查。

**步骤**

1. 【源义务】把规范 Markdown 投影到站点，不维护第二份人工副本。
2. 【源义务】章节放置和导航顺序由一个源拥有（源示例为 `website/docs.ts`）；某个 locale 声明了未放置的分组时构建必须抛错，而不是按 `indexOf(-1)` 排到前面。
3. 【源义务】导航路由与 manifest 发布路径必须一致；导航指向不存在的页面是构建失败，不是上线后的 404。
4. 【源义务】投影时去掉 GitHub 读者 chrome（语言切换器、仓库徽章），但源文件仍保留给 GitHub 读者。
5. 【源义务】在同一 manifest/投影过程生成原始孪生：页面路由加 `.md`，去掉渲染 frontmatter、保留正文，链接能文件到文件解析；提供 agent 面向的索引（源示例为 `llms.txt`）。
6. 【源义务】把被引用图片复制到孪生旁并随站点交付；不要依赖源 checkout 或热链。
7. 【迁移设计】在源级验证链接/锚点，不只用站点 locale 投影验证；把 unprefixed 链接迁移为能在 GitHub 和站点都正确的形式前，先证明目标/锚点检查覆盖。

**角色与完成信号**：作者更新规范文档；站点 owner 维护唯一导航源；生成器产出渲染页和孪生；CI 检查路由/链接/资产。完成信号是：导航、渲染路由和原始孪生三者同源且都通过链接检查。

**强制与信任**：构建成功证明声明路由可渲染；不证明内容质量、翻译正确或孪生包含所有章节。路由映射必须与页面同步。

**失败与恢复**：未声明分组时抛错；路由/链接/资产缺失时构建或检查失败；孪生漂移时修生成器而不是手改输出；页面移动时加重定向/别名并更新链接。

**例外**：frontmatter 是 VitePress 渲染配置，原始孪生有意去掉；冻结/生成页可有受限导航。

**证据边界**：不要用站点投影替代源级链接检查；不要把“构建通过”当作“文档完成任务”。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-03-documentation-graph-atlas.md:1-70@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-20-generated-cordis-core-api.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-06-doc-site-carries-its-images.md:1-44@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-12-documentation-site-navigation-and-chrome.md:1-42@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-20-doc-site-raw-markdown-twins.md:1-40@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-03-documentation-graph-atlas.md:1-70@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-20-generated-cordis-core-api.md:1-32@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-06-doc-site-carries-its-images.md:1-44@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-12-documentation-site-navigation-and-chrome.md:1-42@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-20-doc-site-raw-markdown-twins.md:1-40@687f282e

<a id="rationale-process-1-document-content-contracts"></a>
### rationale-process-1-document-content-contracts — README 限制、模型体验与公开 API 文档契约

**状态**：来源中的 core-data-structures 页面归属规则已被 package-anchored subsystem pages 取代；其 `ts type-equiv` 漂移门禁与 JSDoc/README 契约仍是当前内容契约。

**触发**：工作区包有 README 或公开 API；包改变模型可见上下文、token/cache 行为或生命周期；公开类型、事件 payload 或服务方法变化；发现持久消费者限制或延期工作。

**前置条件**：能从 manifest 推导包集合；能解析声明和 JSDoc；有 canonical 标题/顺序/字段约定；有显式 allowlist 机制。

**步骤**

1. 【源义务】每个包 README 有 canonical 的 `Known Limitations and Deferred Work` h2，至少一个顶层 bullet；无限制的包由显式 allowlist 点名，新增限制时删除该条目。近似标题（Limitations、Non-goals 等）判失败。
2. 【源义务】面向模型或模型相邻的包在 Known Limitations 之前有 canonical `Model Experience` 段：每个 context surface 一个 H3，H4 顺序为 What the model sees / Token effect / KV Cache effect；模型无关包用显式排除。
3. 【源义务】文档化机器定义的公开面：事件 payload 参数、公共服务方法、参数和返回；`@param` 指向不存在的参数、空 tag 描述失败。
4. 【源义务】类型等价目录与 manifest 一一对应；解析声明结构并比对 JSDoc，未登记的 block 作为 orphan 失败。
5. 【源义务】中文对侧只有在整个受跟踪 fence 序列的顺序/类型/字节体完全一致时才复用条目；否则独立检查。
6. 【迁移设计】机器检查只覆盖存在/形状/参数/返回/manifest 对应；限制是否完整、模型影响分析是否正确、正文是否清晰仍由评审负责。

**角色与完成信号**：包 owner 写章节；API owner 写公开面；门禁检查包集合/标题/AST；评审者检查语义。完成信号是：每个包有 README 与限制段或有效排除，公开面有文档，目录一致。

**强制与信任**：检查证明章节存在/形状、参数/返回已写、目录对应；不证明限制覆盖完整、Model Experience 分析正确或文档可读。

**失败与恢复**：缺 README/近似标题/空段/陈旧 allowlist/未文档化参数/未登记 block/中文 fence 不一致都失败；修复标题/内容/参数/目录；限制解决后删除 bullet 或更新 allowlist。

**例外**：`NO_LIMITATIONS` 和模型无关排除必须点名受扫描包；语义质量和限制覆盖仍由评审负责。

**证据边界**：不要把“有 Known Limitations 段”当作“限制完整”；不要把 JSDoc 存在当作 API 语义稳定。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-06-20-core-data-structures-catalog.md:1-62@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-04-cordis-jsdoc-completeness-gate.md:1-42@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-10-readme-known-limitations-gate.md:1-30@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-12-package-model-experience-contract.md:1-34@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-06-20-core-data-structures-catalog.md:1-62@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-04-cordis-jsdoc-completeness-gate.md:1-42@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-10-readme-known-limitations-gate.md:1-30@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-12-package-model-experience-contract.md:1-34@687f282e

<a id="rationale-process-1-generated-reference-freshness"></a>
### rationale-process-1-generated-reference-freshness — 生成参考、目录与声明的新鲜度强制

**触发**：参考描述来自源的值、默认值、API、事件、持久化格式、声明或 CLI 帮助；生成器输入变化；生成页发布或被 agent 读取。

**前置条件**：能访问权威输入（manifest、lockfile、声明、真实 help、vendor 元数据）；有确定性生成器；有可运行 `--check` 或测试 lane。

**步骤**

1. 【源义务】从真实源生成参考，不维护第二份手写清单。
2. 【源义务】在测试 lane 断言已提交字节，或运行确定性 `--check`；如果已有必需 lane 能断言同样的新鲜度，不要再加独立门禁进程/调度槽/CI 步骤。
3. 【源义务】失败信息指出重新生成命令，并列出所有需要重新生成的输入类别。
4. 【源义务】缺失/重复元数据、重复规范化名、冲突版本必须生成失败；只对“发布元数据无法回答”的包使用经评审的 `OVERRIDES`，不渲染空许可证。
5. 【源义务】依赖分层看“是否随产品交付”而不是 manifest 段；包含所有可挂载插件/运行时输入；非宽松许可证默认失败，除非有窄的精确身份授权例外。
6. 【源义务】当一个生成契约喂给后续构建阶段时，明确生成顺序。
7. 【源义务】大型生成参考先有紧凑入口层（范围、查询意图、分组/索引、概念指南链接、生成/检查命令），并报告页面词数/条目数/标题数/最大章节；按稳定源领域拆分，不按任意词数切片。
8. 【迁移设计】为静默漏项形状加 fixture（vendor 表不再覆盖目录、extras、无版本 requirement、workspace 成员缺失等）；让检查本身有测试。

**角色与完成信号**：生成器 owner 维护输入与分类；CI 断言字节；依赖/许可证 owner 审查例外；文档 owner 维护入口层。完成信号是：提交字节与当前生成一致，失败可操作，穷尽事实仍在。

**强制与信任**：新鲜度证明字节匹配当前生成；不证明生成器的分类策略正确或法律充分。测试 lane 的 spec 断言不是独立调度门禁。

**失败与恢复**：过期时运行生成命令并审查 diff；元数据缺失时加 override 或修 manifest；非宽松运行时依赖默认失败；入口层不降查询成本时不拆分。

**例外**：窄的精确身份例外可覆盖官方授权 payload 集；穷尽生成参考可以很长；vendored/历史证据按 owner 规则排除。

**证据边界**：生成器仍可能漏掉输入类别；fixture 降低但不消除该风险；入口层质量在源中只是部分交付/提案。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-04-persistence-log-catalog.md:1-37@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-06-generated-config-catalog.md:1-41@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-20-generated-cordis-core-api.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-08-api-remotes-generated-contract-build.md:1-81@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-07-30-generated-third-party-notices.md:1-59@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-09-14-generated-cli-help-reference.md:1-25@687f282e`
- `deepseek-harness/.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:1-139@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-04-persistence-log-catalog.md:1-37@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-06-generated-config-catalog.md:1-41@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-20-generated-cordis-core-api.md:1-32@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-08-api-remotes-generated-contract-build.md:1-81@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-07-30-generated-third-party-notices.md:1-59@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-09-14-generated-cli-help-reference.md:1-25@687f282e 来源：deepseek-harness/.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:1-139@687f282e

<a id="rationale-process-1-package-manager-and-workspace-policy"></a>
### rationale-process-1-package-manager-and-workspace-policy — 固定包管理器、严格工作区链接与无 shell 重入

**触发**：仓库安装依赖或运行 package scripts；工作区包声明依赖或新增成员；脚本需要从包内重新进入包管理器。

**前置条件**：有 `packageManager`/锁文件；CI 能 provision 同一版本；工作区支持严格/隔离链接；有 build-script 允许清单。

**步骤**

1. 【源义务】通过 manifest `packageManager` 固定一个包管理器和版本；CI 用同一 provision 方式。
2. 【源义务】使用严格、隔离的工作区链接，让未声明依赖的 import 暴露；不要依赖 hoisting 偶然成功。
3. 【源义务】只允许显式清单中的依赖 lifecycle/build scripts 执行；不要执行任意传递安装脚本。
4. 【源义务】用机械检查验证工作区约束（依赖段、版本范围、禁止的运行时边）。
5. 【源义务】包内重入包管理器时用 API 或直接可执行文件 + 参数数组，不用 shell 字符串；保持环境与退出行为跨平台。
6. 【迁移设计】把迁移视为全仓变更：锁文件、脚本、CI provision、干净安装证据一起提交。

**角色与完成信号**：维护者选型/固定版本；CI provision；包作者声明依赖；安全评审看 build script。完成信号是：干净 checkout 可复现安装，未声明边和禁止边失败，重入跨平台。

**强制与信任**：pin/锁文件证明解析图，不证明每个依赖可信；允许清单不是安全审计；严格性可能在采用时暴露大量历史未声明 import。

**失败与恢复**：版本不匹配时 provision/锁文件失败；未声明 import/禁止工作区边时约束检查失败；非允许 build script 不运行，评审决定是否加入；迁移失败时保留旧锁文件并逐项修复。

**例外**：经评审的依赖可加入 build-script 允许清单；放宽工作区约束需要显式政策变更和证据。

**证据边界**：锁文件不是供应链信任证明；包管理器专有行为需在目标环境重测。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-06-16-pnpm-over-yarn.md:1-47@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-06-16-pnpm-over-yarn.md:1-47@687f282e

<a id="rationale-process-1-dependency-selection-policy"></a>
### rationale-process-1-dependency-selection-policy — 标准能力优先使用维护中的依赖

**触发**：出现标准关注点（解析、glob、重试、锁、schema 校验、CLI、HTTP、文件监听）；提议新依赖或考虑移除；手写 helper 超出窄局部需求。

**前置条件**：能评估维护状态、许可证、安全、体积、运行时兼容、传递重量和生态适配；有锁文件和依赖审查。

**步骤**

1. 【源义务】对标准关注点优先使用维护中的合适依赖，除非有文档化约束使依赖不适用。
2. 【源义务】依赖替换必须产生净删除：替换真实 owned 代码（实现 + 专用测试 + 文档），不是假设的未来代码。只增加能力的依赖是功能决策，不是简化。
3. 【源义务】评估健康与边界适配：活跃维护、广泛使用、传递足迹合理；包语义要覆盖真实契约，仍围绕它手写的残余语义计入交换成本。
4. 【源义务】不要把已记录的设计 seam 当作本政策可重开的对象（源示例：schema 标准、vendored 源码、twin adapters）；要重开必须击败原 rationale，而不只是引用“优先依赖”。
5. 【源义务】交换提案按 `proposed/simplification` Note 记录候选包、可删除 surface、残余语义和供应链考量；`util` 的零依赖 charter 只约束 harness 依赖，不禁止简化外部包。
6. 【源义务】固定并锁定依赖；审查安装脚本和供应链面；不要为一行代码或避免一个小适配层而引入大依赖，并记录判断。
7. 【迁移设计】把依赖放在窄本地接口后，便于替换；依赖失去维护/出现漏洞时重新评估。

**角色与完成信号**：作者提出候选并记录；评审者审查取舍；依赖 owner 跟踪风险。完成信号是：选择有证据、依赖已锁定、例外有记录。

**强制与信任**：评审和元数据检查降低风险，不证明依赖长期安全/维护；许可证和体积判断可能是主观的。

**失败与恢复**：未审查/不宽松/高风险依赖被拒；依赖失效时修补、替换或记录接受的风险；替换改变行为时先补兼容证据。

**例外**：平台、体积、许可证或 API 约束可以证明手写窄实现合理；临时本地 helper 可以先于提取依赖。

**证据边界**：源偏好是默认而非普遍规则；不要把它变成“必须引入依赖”的机械要求。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:1-36@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:1-36@687f282e

<a id="rationale-process-1-product-isolation-and-classification"></a>
### rationale-process-1-product-isolation-and-classification — 默认产品隔离、产品用途分类与随附可选 bundle

**触发**：包或实验能力加入安装/运行时依赖；随附 profile、preset、动态挂载或可选 bundle 变化；Client 功能插件从另一个功能插件 import；包没有明显的默认消费者。

**前置条件**：能静态分析依赖边、profile/preset 组成、源码 import 和显式动态挂载；有包策略文件/allowlist；默认产品边界已定义。

**步骤**

1. 【源义务】把实验包排除在默认产品的运行时依赖图之外；拒绝运行时 import、随附组合、preset 或默认模板点名它。
2. 【源义务】安装随附的可选 bundle 由一个带类型的启动器列表声明；每个必须是 CLI app 的运行时依赖且声明 bundle patch；任何随附模板都不得选中它。
3. 【源义务】运行时披露覆盖所有可挂载插件，即使默认装配不 import；少披露是更危险的方向。
4. 【源义务】非实验包必须有有效产品用途，或显式分类（可选集成、SDK、构建/测试工具、Web 分发、纯声明基础设施），每个例外记录维护角色。
5. 【源义务】有效用途从随附 profile、preset 子项、运行时源码 import 和显式动态挂载计算；保留 group/Include 禁用状态，先应用 patch；manifest 依赖和纯类型引用不算。
6. 【源义务】分类每个 Client 跨包引用：删除无用/转发值，类型用 type-only import，行为用注入服务；功能插件之间不得声明运行时外部值边。
7. 【源义务】可选 bundle 可达性与默认可达性分开；实验成熟度与安装/选择/发现分开。
8. 【迁移设计】把包策略变更与组成变更放在同一评审；禁用子树/无效 patch/陈旧分类加回归 fixture。

**角色与完成信号**：包 owner 分类角色；产品 owner 定默认/可选组成；发布工程师确认运行时披露；CI 检查有效组成。完成信号是：实验代码不在默认图，休眠包有用途/分类，可选 bundle 只在声明列表。

**强制与信任**：静态检查证明声明和静态可达边；不能证明动态挂载永不发生；allowlist/策略可能变旧。

**失败与恢复**：实验 import/组合/模板、未列实验依赖、休眠包、禁止 Client 值边、列表 bundle 缺运行时依赖都失败；修复组成或分类；禁用行不应被计数。

**例外**：列出的可选 bundle 只跳过其 `dependencies` 边，但 import/组成/模板仍禁止；经评审的策略条目记录非默认角色；昂贵原生运行时可走按需 bundle 例外。

**证据边界**：动态能力无法被静态证明“永不使用”；产品用途分类是政策判断，不是自动真理。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-08-23-client-cross-package-value-dependencies.md:1-50@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-09-15-shipped-optional-bundles.md:1-29@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-10-05-product-package-classification.md:1-29@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-08-23-client-cross-package-value-dependencies.md:1-50@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-09-15-shipped-optional-bundles.md:1-29@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-10-05-product-package-classification.md:1-29@687f282e

<a id="rationale-process-1-build-command-separation"></a>
### rationale-process-1-build-command-separation — 拆分产物构建、类型检查与完整 build

**触发**：build 同时含产物步骤和独立的 no-emit 类型检查程序；开发者只需要产物，或只需要检查；CI job 需要构建子集。

**前置条件**：有依赖图调度器；能记录构建完成状态；有编译器诊断可报告缺失前置产物；CI 必需 lane 可运行完整命令。

**步骤**

1. 【源义务】每个命令只做自己的工作：`build:artifacts` 产出全部产物并完整检查包 project；`build:check` 只检查聚合根程序；`build` 运行两者。
2. 【源义务】`build` 必须保持完整，且其聚合检查诊断与 `build:check` 相同。
3. 【源义务】`build:check` 不检测/重建/校验前置产物，不加守卫/回退；缺失或过期由编译器诊断（如 TS6305/TS2307）报告。
4. 【源义务】步骤用 `needs` 表达依赖；并发受配置上限约束；单 worker 时按拓扑顺序串行，输出仍需一致。
5. 【源义务】只有所有步骤通过才写 client build record；任何失败/跳过都不写。
6. 【源义务】本地默认报告所有独立失败；CI 可设 fail-fast，外层 fail-fast 要传播到内层调度。
7. 【源义务】保留调用方矩阵；删除/改变必需 lane 的完整 build 前，先把两个聚合检查转交另一个阻塞 owner。
8. 【迁移设计】删除旧 flag/别名并迁移所有调用方；用字节一致和编译 dry-run 证明并发/串行等价。

**角色与完成信号**：构建 owner 维护步骤表；开发者用 artifacts/check；CI 跑完整 build；发布工程师确认 record。完成信号是：命令职责与调用方矩阵一致，失败不写 record，串并行产物一致。

**强制与信任**：字节一致和 dry-run 证明受测图无损；不证明未来所有调用方都用完整命令。并发提高内存/争用，可能改变调度敏感行为。

**失败与恢复**：失败/跳过时非零退出且不写 record；非法 scope/profile 冲突在参数解析失败；缺失前置是诊断，不是绿色构建；内存紧张时用单 worker 或分开运行。

**例外**：开发启动和 lint/doc 前置可有意省略聚合检查；调用方矩阵记录完整性 owner；单 worker 仍须字节一致。

**证据边界**：源的具体 TS 项目布局/数字是项目特定；并发不是无条件更快；`build:check` 不检测陈旧声明。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-10-11-build-artifacts-check-split.md:1-157@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-10-11-build-artifacts-check-split.md:1-157@687f282e

<a id="rationale-process-1-typecheck-source-only"></a>
### rationale-process-1-typecheck-source-only — 类型检查所需的声明生成不必经过打包器

**触发**：type-check、lint 或文档 type-check 需要生成的声明；声明 writer 能从源码运行；完整 build 仍须在打包器内生成同样声明。

**前置条件**：生成器与打包器共用同一个 writer/face；有源码路径 facade；能检测加载了工作区 `lib/` 构建输出。

**步骤**

1. 【源义务】用打包器相同的生成器和 writer，但不运行打包器、Desktop bundle 或 Web build。
2. 【源义务】当 face program 加载工作区包的 `lib/` 产物或无法解析工作区 import 时失败，并指出缺失的源码别名。
3. 【源义务】Host 源码编译与源码声明生成可并行（生成器不读构建输出）；Client 编译依赖两者。
4. 【源义务】聚合检查在本侧包编译之后以 build mode 运行，只检查根程序，当前 tsbuildinfo 可跳过。
5. 【源义务】完整 build 仍在打包器内运行同一生成器；不要因为 check-only 的收益而把 build 的生成移出打包器。
6. 【源义务】文档说明 check-only 命令不刷新可运行 bundle，`lib/` JS 可能落后于声明。
7. 【迁移设计】用字节一致测试覆盖“同一组文件”和“同一组被检查程序”；记录增量失效的已知缺口。

**角色与完成信号**：构建 owner 加 scope；生成器 owner 加 guard/别名；CI 跑检查；开发者先跑 artifacts 再用构建产物。完成信号是：声明字节一致、检查程序一致、构建输出 guard 生效。

**强制与信任**：字节一致和 guard 支持无损性；不覆盖所有可能的构建输出读取；增量 `tsc` 仍可能漏掉经 `exports` 到达的 Remote 声明（源示例 Issue #6022）。

**失败与恢复**：加载 `lib/` 或无法解析工作区 import 时失败并给别名补救；声明分析错误使步骤失败；check-only 缺 bundle 时运行 artifact build。

**例外**：打包器插件可在 Host 编译后关闭 guard；check-only 有意不产出 bundle/record。

**证据边界**：不要把 check-only 当作完整构建；不要把“字节一致”当作“增量永远正确”。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-10-12-local-gate-speedups.md:1-158@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-10-12-local-gate-speedups.md:1-158@687f282e

<a id="rationale-process-1-gate-performance-optimization"></a>
### rationale-process-1-gate-performance-optimization — 以测量和等价性证明做无损门禁提速

**触发**：本地门禁/钩子/测试的大部分时间花在重复工作而非独有断言；默认 worker 数来自宿主 CPU 而非配额；门禁逐候选启动子进程、重复解析 Markdown 或重复探测文件系统；测试大部分时间在磁盘 fixture 上。

**前置条件**：能测 wall/CPU/内存；有代表性共享主机/容器、CPU 配额、网络文件系统等条件；有字节/输出等价测试和 seeded fault。

**步骤**

1. 【源义务】每个优化都记录优化前后的 wall/CPU/内存，并证明输出与诊断不变，或明确列出有意的行为差异。
2. 【源义务】在代表性条件下测量，报告样本数和噪声，不用单次最佳值。
3. 【源义务】优先消除重复工作：每个文档只解析一次、每个目录只列一次、候选对照一次对象列表、只读探测 memo、等待真实完成信号。
4. 【源义务】复用解析时必须用守卫证明归一化不会改变语法树；否则回退完整解析。
5. 【源义务】本地默认从实际配额或实测上限来；CI 行为明确；提供覆盖变量。
6. 【源义务】内存测试工作区必须保持相同 case 名/断言，并记录 stub/快照差异；产品源码不得有测试专用路径。
7. 【源义务】保留已知缺口与代价（内存峰值、陈旧 bundle、stub、增量失效），不要声称完全等价。

**角色与完成信号**：门禁 owner 分析热点；性能作者一次移除一项重复；评审者检查等价性；CI 提供测量环境。完成信号是：输出字节一致/文件列表一致/诊断一致，wall 下降，覆盖变量可用。

**强制与信任**：等价测试覆盖已测仓库和 fixture，不覆盖未来所有输入；性能数字是主机特定且有噪声；更快的门禁如果漏文件/诊断就是回归。

**失败与恢复**：输出变化/seed 失败/漏文件时等价测试失败，修 discovery/cache；本地 255 fork 在 64 配额上 flake 时设上限/覆盖；解析复用可能改树时回退。

**例外**：有意差异（跳过不可读 `lib`、某 case 外用 stub）可接受但必须列出；高于本地上限的机器可显式覆盖。

**证据边界**：不要用单次最快值或另一台机器的数字；不要把“输出相同”推广到所有输入；内存/陈旧产物代价必须披露。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-10-11-build-artifacts-check-split.md:1-157@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-10-12-local-gate-speedups.md:1-158@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-10-11-build-artifacts-check-split.md:1-157@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-10-12-local-gate-speedups.md:1-158@687f282e

<a id="rationale-process-1-built-artifact-validation"></a>
### rationale-process-1-built-artifact-validation — 严格运行构建产物，并按编译 face 命名测试

**触发**：CI 或发布检查启动打包/示例代码；签入的 Cordis 或等价配置解析裸模块；拆分包有多个编译 face 的测试。

**前置条件**：构建步骤在测试前完成；有 src/lib 两种执行模式；示例配置放在能向上解析到正确 `node_modules` 的工作区成员；TypeScript 聚合能表达 face 归属。

**步骤**

1. 【源义务】保留两种模式：源码/本地可用 tsx 和路径映射；严格 CI 用纯 Node 启动构建产物，不用 tsx/tsconfig 路径映射。
2. 【源义务】所有启动示例或签入配置的 CI 子进程都从构建 `lib` 运行；源码路径测试只作为显式回归例外。
3. 【源义务】把测试配置放在 examples 工作区成员的 `node_modules` 解析范围；包自有 fixture 放在可预测的 group/package 路径。
4. 【源义务】Client 测试文件名标明 face，用互斥后缀（如 `*.client.spec.ts`、`*.host.spec.ts`）；helper/fixture 也标明归属。
5. 【源义务】每个聚合用一条宽 glob，只纳入自己的 face；不要让 Host-face 测试落进 Client program。
6. 【迁移设计】在严格 lane 里验证构建二进制/安装消费者路径，不只验证工作区源码 import。

**角色与完成信号**：测试作者选择模式/命名；CI 在构建后跑严格 lane；包 owner 维护 fixture 位置；发布工程师验证打包路径。完成信号是：构建产物在纯 Node 下可启动，测试归属正确。

**强制与信任**：严格 lane 证明受测构建产物能在该 CI runtime 启动；不证明所有发布产物/平台。face 后缀证明文件归属，不证明测试质量。

**失败与恢复**：需要 tsx/路径映射才能启动时严格 lane 失败，修打包/路径；Host 测试进 Client 聚合时项目引用规则拒绝，改名/移动；配置在错误 node_modules 解析时重定位。

**例外**：只实现 peer 协议、不依赖 Cordis 的 TypeScript fixture 可直接用 Node；显式源码回归可保留在 src 模式。

**证据边界**：严格模式只测当前 job 构建的产物；命名约定可能误用；原生进程行为需要原生证据。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-17-run-ci-examples-from-built-lib.md:1-43@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-12-face-named-client-test-files.md:1-62@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-17-run-ci-examples-from-built-lib.md:1-43@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-12-face-named-client-test-files.md:1-62@687f282e

<a id="rationale-process-1-ci-topology-and-portability"></a>
### rationale-process-1-ci-topology-and-portability — 可移植的必需 CI、独立 job 与实测 runner 策略

**触发**：必需 PR job 依赖特殊 runner 池/job 级依赖；提议新平台/目标进每个 PR；一次 push 取代在途 run；runner 池故障或重配；新增 CI cache/包管理器 setup。

**前置条件**：能控制分支保护/必需检查；知道 runner 池的真实可分配性；有标准托管/企业 runner；能测量 job wall/成本。

**步骤**

1. 【源义务】让必需 PR 判定跑在确实能分配的 runner 上；计费健康、runner 定义 Ready、自动扩缩上限都不证明命名池能接收 job。
2. 【源义务】实质 job 独立进入 runner 分配；移除不是真实数据依赖的 job 级依赖；聚合判定只依赖已完成的必需 job。独立性只避免排队耦合，不降低最终判定：任一必需失败仍使聚合失败，且一个 job 失败不应阻止另一个独立 job 产出自己的诊断证据。
3. 【源义务】必需 PR 的 Windows 正确性由原生 `windows-build` 与 `windows-native-tests` 承担；`windows-coverage` 留在 `needs` 外，保持可见/红色但不延迟判定。2026-07-27 的 Wine PR lane 已被 2026-08-08 原生 Windows PR CI 取代；Wine 现在只提供 post-merge/master 的 toolchain 证据。原生容量不可用时，用显式 failover 选择一个真实原生池，不要用 Wine 冒充等价 pre-merge 证据；可移植托管环境只适用于确实与平台无关的必需检查。
4. 【源义务】昂贵平台/目标矩阵只在 master 跑，当前提 PR 已由必需原生面覆盖。
5. 【源义务】按 `workflow + ref` 组启用 `cancel-in-progress`，让新的验证取代同组旧 run；不同 PR ref、不同 workflow 互不取消。发布/部署/元数据/发布包验证按自己的策略豁免（发布拥有的构建属于有意的发布事务）；取消是请求，不保证立即终止或固定队列延迟。PR 聚合用 `!cancelled()` 保留对失败/跳过的评估，覆盖率历史不上传被取消 run 的数据，Wine 清理等资源回收不能被简化掉。
6. 【源义务】升级 runner 前测量真实工作量；不要买不能改善端到端门禁的核数。
7. 【源义务】显式 provision 包管理器与 cache；把 CI cache/temp 放到预期的数据盘，不占系统盘。
8. 【源义务】发布依赖可信自托管路径时，要演练该路径并保留 fail-loud 负测试；本地与 CI 门禁共用同一脚本。
9. 【迁移设计】用 failover 变量切换池，记录切换证据与回滚；把“工作流绿”与“forge 真的阻塞”分开验证。

**角色与完成信号**：CI owner 维护拓扑；release engineer 验证发布路径；runner admin 保证分配；评审者看证据。完成信号是：健康 PR 能到达聚合判定，必需 job 不因无关依赖排队，平台矩阵只在有证据时运行。

**强制与信任**：工作流绿证明运行过的 job；不证明分支保护真的要求它、明天池仍可分配、托管/自托管硬件相同。runner 测量和缓存收益是环境特定。

**失败与恢复**：必需 job 无法分配时聚合保持 pending，切 failover 或改用可移植环境；cache 放错盘时修配置；原生-only 失败不能被静默移出必需证据。

**例外**：建议性原生覆盖可以非阻塞，但必须有必需的 build/process 检查；master-only 矩阵可跳过 PR；failover 池可由显式变量选择。

**证据边界**：不要把 workflow 绿当作 forge enforcement；不要把“现在能跑”当作容量保证；hosted/self-hosted 信任不同。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-23-portable-required-pull-request-ci.md:1-36@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-26-pnpm-action-setup-for-symmetric-ci-caching.md:1-35@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-27-wine-windows-gates-experiment.md:1-48@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-30-independent-ci-consumer-build.md:1-36@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-28-ci-node-compile-cache-data-disk.md:1-44@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-06-master-only-platform-ci.md:1-34@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-06-preview-hosted-runner-sizing.md:1-47@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-06-release-rehearsal-selfhosted.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-09-cancel-superseded-ci.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-07-26-ci-failover-runbook.md:1-62@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-08-08-native-windows-pull-request-ci.md:1-57@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-23-portable-required-pull-request-ci.md:1-36@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-26-pnpm-action-setup-for-symmetric-ci-caching.md:1-35@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-27-wine-windows-gates-experiment.md:1-48@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-30-independent-ci-consumer-build.md:1-36@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-28-ci-node-compile-cache-data-disk.md:1-44@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-06-master-only-platform-ci.md:1-34@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-06-preview-hosted-runner-sizing.md:1-47@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-06-release-rehearsal-selfhosted.md:1-28@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-09-cancel-superseded-ci.md:1-40@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-ci-failover-runbook.md:1-62@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-08-08-native-windows-pull-request-ci.md:1-57@687f282e

<a id="rationale-process-1-native-platform-evidence"></a>
### rationale-process-1-native-platform-evidence — 在可移植 Wine 检查之外提供原生平台证据

**触发**：产品支持的原生平台在文件系统、进程、权限或终端行为上与构建主机不同；平台专用 lane 缩窄源码清单；兼容层被当作唯一 pre-merge 证据。

**前置条件**：有原生 runner；能启用 Developer Mode/符号链接；有完整源码清单和逐文件阈值；能区分阻塞与建议性 lane。

**步骤**

1. 【源义务】保留可移植/Wine 检查用于合并后或广泛工具链证据，并为 pre-merge 正确性增加独立的原生 build/process 检查。
2. 【源义务】在原生平台按同一逐文件阈值运行完整受支持源码清单；不要为平台方便缩小分母。
3. 【源义务】把阻塞的原生 build 和定向原生进程检查放进必需依赖；把完整原生 coverage 放在必需 needs 之外，让它保持可见/红色但不延迟判定。
4. 【源义务】在必需 build job 内保留建议性诊断，设 `continue-on-error` 且禁用 fail-fast；失败在步骤/警告/摘要可见，但 Linux 仍拥有无关的阻塞判定。
5. 【源义务】诊断清单禁用 fail-fast 并有显式超时；built-bin smoke 等其他建议性门禁都结束后再启动。
6. 【源义务】保留两种有意的执行拓扑（可移植快照 vs 原生不可变工作区）；只属于某一拓扑的失败要按边界分类，不得削弱/跳过。
7. 【源义务】测量 runner 尺寸；不要假设更多核会改善端到端门禁。

**角色与完成信号**：平台 owner 分类证据；CI owner 配置 lane/needs；测试作者修原生路径/进程 fixture；评审者检查拓扑分类。完成信号是：原生 build/process 阻塞，coverage 可见但不延迟，诊断失败不伪装成通过。

**强制与信任**：原生执行证明该主机行为；绿色聚合可能同时有 pending/red 原生 coverage；建议性诊断可以在 PR check 绿时失败，失败只在步骤输出/摘要。

**失败与恢复**：原生 build/process 失败阻塞；coverage 在 needs 外保持红；无窄标注就排除受支持文件是评审失败；原生-only 失败按拓扑调查，不跳过。

**例外**：peer-platform-only 分支可以用窄标注忽略，但行为要在所属平台覆盖；完整原生 coverage 可以非必需以保持判定速度。

**证据边界**：原生证据是主机特定的，不证明所有平台；coverage 红/聚合绿是设计；runner 测量环境特定。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-08-08-native-windows-pull-request-ci.md:1-57@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-08-native-windows-pull-request-ci.md:1-57@687f282e

<a id="rationale-process-1-release-integrity"></a>
### rationale-process-1-release-integrity — 发布候选验证、可信发布与版本身份

**触发**：发布多个必须同版本的产物；实验包需要已安装消费者访问；桌面/测试构建从基础发布派生版本；发布 workflow 可以在无凭据下验证。

**前置条件**：能构建全部目标产物；有 registry 元数据 API、artifact 存储、OIDC 信任配置；能访问既有发布记录；有安装消费者测试。

**步骤**

1. 【源义务】无 registry 凭据验证完整候选：构建所有目标、下载/校验精确文件名与元数据、执行 registry 大小限制、记录 SHA-256、保留一个聚合候选。
2. 【源义务】实际发布用可信发布/OIDC，验证 job 只有仓库读权限；dry run 不能进入发布路径。
3. 【源义务】从打包/解压产物验证已安装消费者，不只源码 checkout；包含安装消费者需要的运行时文件和 import。
4. 【源义务】在同一 release family/本地 baseline 发布所有预期的实验包，同时保持实验名称、opt-in 组成、隔离和支持限制不变；用显式 denylist 处理未来私有例外。
5. 【源义务】从完整基础发布身份派生测试/预发布版本；把派生版本作为参数传给打包，不写回 manifest；不要追加第二个日期后缀。
6. 【源义务】分发 feed 地址独立于版本派生；测试分发不发布无后缀基础版本，现有客户端禁用降级。
7. 【源义务】发布前检查既有 release 记录/对象，避免重复/不可逆上传。

**角色与完成信号**：release engineer 组装候选；CI 验证；publisher 用 OIDC 发布；package owner 确认实验包。完成信号是：候选完整/不可变，验证不能发布，实际发布身份可信，版本语义正确。

**强制与信任**：验证证明候选的受测产物/元数据；不证明 registry 原子接收每个文件；可信发布证明 workflow 身份，不证明版本意图正确。

**失败与恢复**：文件名/元数据/hash/大小/重复上传失败时停止；部分上传时按记录的文件名/hash 评估 registry 状态，用候选和缺失 artifact 指导恢复，不声称原子性。

**例外**：未来私有包可加入 denylist；测试 feed 可以有意不发布无后缀基础版本。

**证据边界**：公共 registry 上传非原子；可信发布依赖外部身份配置；安装消费者测试只覆盖受测平台/入口。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-08-11-python-publication-workflow.md:1-52@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-12-publish-all-experimental-packages.md:1-30@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-16-desktop-release-version-derivation.md:1-30@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-08-11-python-publication-workflow.md:1-52@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-12-publish-all-experimental-packages.md:1-30@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-16-desktop-release-version-derivation.md:1-30@687f282e

<a id="rationale-process-1-signed-runtime-supply-chain"></a>
### rationale-process-1-signed-runtime-supply-chain — 签名运行时缓存与分离的时间戳完成

**触发**：构建签名未变化的原生/运行时文件；签名或时间戳失败；缓存条目被恢复/发布/迁移；并发构建签同一输入。

**前置条件**：有硬件签名 token；有 Windows 信任/时间戳验证工具；有固定本地卷与账户专属 DACL；能取得 SignTool 字节/签名脚本字节/证书。

**步骤**

1. 【源义务】缓存完整签名运行时文件，key 包含原始内容、公开证书、SignTool 字节、签名脚本字节、缓存格式；保留有效厂商签名。
2. 【源义务】恢复前检查输入记录、签名文件摘要、Windows 信任、时间戳、配置证书；无效条目直接失败，不自动修复或回退硬件。
3. 【源义务】完整条目原子发布；并发发布冲突保留已有有效条目。
4. 【源义务】缓存只在当前账户共享；要求固定本地盘、当前账户所有权、私有目标 DACL；拒绝链接/重定向路径；不作为不可信远程缓存分发格式。
5. 【源义务】每个完整签名阶段/缓存维护用独占 Windows 文件句柄串行；锁分别覆盖预检、主运行时签名、应用运行时签名、产物创建；编译/准备并行；等待者取锁后重查。
6. 【源义务】对私有 PE 副本只签名一次、不请求时间戳；成功执行且 Windows 验证主签名后才释放硬件互锁；失败保留互锁，任何路径不自动恢复。
7. 【源义务】对冻结签名文件的新副本请求时间戳，不传签名凭据；只有正常失败/警告退出才重试，最多三次、1s/2s 延迟；启动失败、终止不确定、存储变化、验证失败立即停止。
8. 【源义务】验证 Windows 信任、时间戳、证书身份；用配置 SignTool 删除未签名属性并比较完整规范化字节；只有字节不变时才接受删除警告。
9. 【源义务】访问硬件前检查 SignTool 最长生成路径；私有临时目录用保留扩展名的短文件名，日志记录原→暂存映射；跨卷时复制已验证字节、比哈希、重查原文件、同卷重命名、再验证提交字节。
10. 【源义务】时间戳尝试耗尽后停止打包/排队，不再调用硬件；清理前把失败证据复制到受监督运行目录；证据/审计失败保留暂存。

**角色与完成信号**：构建工程师维护 cache/lock；发布工程师验证签名；签名服务 owner 提供 token/信任；CI 跑故障测试。完成信号是：缓存命中仍验证信任，失败不替换目标/不重试硬件，时间戳与签名分离。

**强制与信任**：验证证明缓存字节在恢复时匹配配置身份/时间戳/信任；不授权清除互锁或重试失败 token；缓存完整性依赖构建账户控制文件。

**失败与恢复**：损坏/不完整/不可信/时间戳不合格条目失败，不替换目标、不回退硬件；并发发布保留有效条目；时间戳不确定终止立即停止，避免接受部分输出。

**例外**：同一输入/策略 key 下不同时间戳字节不要求替换，但每次恢复仍验证信任；隔离构建存储可用经验证的显式目录。

**证据边界**：缓存占本地盘，依赖账户所有权；不是不可信远程缓存格式；时间戳服务故障仍可能中断冷构建；规范化/SignTool 是平台特定。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-09-17-windows-runtime-signature-cache.md:1-49@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-09-17-windows-signature-completion.md:1-35@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-17-windows-runtime-signature-cache.md:1-49@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-09-17-windows-signature-completion.md:1-35@687f282e

<a id="rationale-process-1-installer-and-source-plane"></a>
### rationale-process-1-installer-and-source-plane — 安装器 checkout 检测、单一托管布局与源码平面解析

**触发**：安装器从 stdin 或从 checkout 的脚本运行；升级既有安装；源码模式启动加载配置中的包说明符；工作区包新增被配置使用的 subpath。

**前置条件**：安装器是 shell 脚本；支持 Git worktree；有 launcher 与稳定 current 指针；配置说明符通过 tsconfig paths facade 解析。

**步骤**

1. 【源义务】从 `$0` 检测 in-repo：curl|sh 时脚本在 stdin、`$0` 是 shell 名；checkout 运行时 `$0` 是脚本文件，父目录 `scripts/` 位于同时含 launcher 与 install.sh 的树中。
2. 【源义务】in-repo 模式不 clone/fetch/checkout、不修改工作树；复用现有 checkout，任何 ref 只作 advisory。
3. 【源义务】把 checkout 纳入与托管安装相同的单一布局（staging worktree + 稳定 current 指针）；容器拥有 staging/current，仓库只是被发现的，不被拥有。
4. 【源义务】所有安装使用同一布局；不要保留直接 PATH 链接到会移动的 checkout，避免升级悬空。
5. 【源义务】每个配置的本地工作区说明符必须经源码 path facade 解析到 `.ts/.tsx`；回退到 `.d.ts`/`lib` 产物时失败。
6. 【源义务】在 e2e 中实际测试源码启动路径，不只测试 built-lib 模式。
7. 【迁移设计】为新增 subpath 加解析测试；移动 checkout 后验证 current 指针仍有效。

**角色与完成信号**：安装器 owner 实现检测/布局；CLI owner 维护配置映射；CI 跑源解析/启动测试。完成信号是：in-repo 不二次克隆、不改进工作树，稳定 launcher 指向托管布局，源码配置不回退产物。

**强制与信任**：`$0` 检测证明调用形态，不证明用户意图；源码解析证明映射的 `.ts/.tsx` 存在，不证明模块能启动；托管 adoption 依赖 Git worktree 行为。

**失败与恢复**：缺映射/回退 `.d.ts`/`lib` 时配置检查失败；in-repo 修改工作树是缺陷；checkout 移动时 current 指针应仍解析；新增 subpath 时补映射并测试。

**例外**：checkout 不被安装器拥有，不自动清理；构建产物安装与源码启动使用不同平面。

**证据边界**：检测依赖 shell 调用语义；托管 adoption 依赖 Git worktree/current 指针；源平面检查只覆盖配置说明符，不覆盖所有动态 import。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-22-installer-in-repo-skip-clone.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-30-cordis-config-source-plane-resolution-gate.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-07-31-installer-adopts-existing-checkout.md:1-52@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-22-installer-in-repo-skip-clone.md:1-28@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-30-cordis-config-source-plane-resolution-gate.md:1-28@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-07-31-installer-adopts-existing-checkout.md:1-52@687f282e

<a id="rationale-process-1-worktree-local-hooks"></a>
### rationale-process-1-worktree-local-hooks — worktree 局部 Git hooks、所有权与迁移守卫

**触发**：包安装的 hook installer 在可能是 linked worktree 的仓库运行；仓库仍是 Git format 0、没有 `extensions.worktreeConfig`；hook 目录有先前安装的 ownership marker，或工作树配置是从主工作树复制的。

**前置条件**：Git ≥2.26（`--show-scope`）；Lefthook 或等价 hook manager；能用仓库级锁；能测试 linked worktree/并发。

**步骤**

1. 【源义务】把 hook 安装限定在当前 worktree；绝不删除/改写 common hooks 目录。
2. 【源义务】CI 中在 Git discovery/mutation 之前返回，因为自动化 job 不消费贡献者 hooks。
3. 【源义务】改 `core.hooksPath` 前要求能报告 config scope 的 Git 版本；format 0 升级前拒绝冲突的直接 `extensions.*`、`core.worktree`、`core.bare` 值；禁用 include 展开（Git 的 format parser 也忽略 included targets），并要求 common config 与每个 `config.worktree` 是 regular file。
4. 【源义务】用仓库级锁串行化迁移与 hook 写入；释放时校验进程身份/随机 token/文件身份/内容；死锁/无效锁要求人工恢复，不自动删除。
5. 【源义务】每个 hook 目录有 JSON ownership marker；checkout 移动后只替换完全匹配的 stale owned 值；新工作树从主工作树 seed 的 config 只在指向注册工作树的保留 marker 路径时替换。Lefthook 运行前，marker 和每个已生成的 hook 必须是 unaliased regular file。
6. 【源义务】拒绝 command-scoped、unowned worktree-scoped、unowned reserved 路径；继承的 system/global/common hooks 需要显式 `DSH_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE=1` 才 opt-in。
7. 【源义务】改 `core.hooksPath` 后 Lefthook 失败时恢复之前的工作树值；回滚失败与安装失败一起报告。
8. 【源义务】用测试固定隔离、复制配置、迁移拒绝、所有权/重定位、并发、自定义路径、回滚。

**角色与完成信号**：installer owner 实现/测试；贡献者安装；CI 跳过；Git 管理员处理死锁。完成信号是：两个 worktree 并发安装互不影响，重复安装幂等，共享 hooks 不变。

**强制与信任**：安装器证明在受测 Git 行为下只改当前 worktree 的有效 hooks；不能保证自定义 hook manager 串联它们；锁身份校验降低但不能消除跨进程竞争。

**失败与恢复**：冲突配置/unowned 路径/stale 锁/不安全迁移/Lefthook 失败都阻塞；回滚失败单独报告；legacy common hooks 保留给未升级 worktree，不自动删除。

**例外**：环境变量可让当前 worktree opt-in 继承路径；旧 common hooks 可保留并变旧。

**证据边界**：依赖 Git worktree/config 语义与版本；自定义 hook manager 需显式集成；旧 hooks 可能过时。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-07-27-worktree-local-lefthook.md:1-41@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-07-27-worktree-local-lefthook.md:1-41@687f282e

<a id="rationale-process-1-issue-and-label-workflow"></a>
### rationale-process-1-issue-and-label-workflow — Issue/PR 标签分类与事件驱动的生命周期

**触发**：PR 打开、打标签或评审；Issue 创建/导入 Project；请求评审或提出修改要求；分类法/生命周期策略迁移标签/字段。

**前置条件**：forge 支持标签、Issue 类型/Project 字段、review webhook；有 lifecycle actor 身份；有事件映射测试。

**步骤**

1. 【源义务】每个开放/已合并 PR 恰好一个 canonical `kind/*` 和至少一个实质受影响的 `area/*`；未合并即关闭的 PR 保留迁移后的历史标签，不凭空补分类。
2. 【源义务】kind 集合封闭互斥；保留所有已移除别名，防止旧同义词以“无关运营标签”重现。
3. 【源义务】area 可扩展：没有诚实覆盖持久领域的现有说明时，可创建简洁 kebab-case area，但不得为单个 PR、偶然路径、临时项目、状态、人或团队创建；应用后报告。
4. 【源义务】Issue 用原生 Issue Type，不用 `kind/*`；`source/*` 只记录创建方式；优先级/自动化触发器独立。
5. 【源义务】迁移标签先添加 canonical 值、核验对象、再移除旧值；只有无人使用才删除标签。
6. 【源义务】把 review webhook 当命令：`review_requested` → In review；`changes_requested` → In progress；approved/commented 不分配 lifecycle runner；dismissed 不订阅。
7. 【源义务】In review → In progress 回退只在目标 Project 最新状态事件由 lifecycle actor 写入时允许；人类/未知 actor 保留现状。
8. 【源义务】普通 PR 事件保持只向前；`ready_for_review` 的必需检查由独立 policy 触发器拥有。
9. 【源义务】只在 `pull_request.opened` 初始化组织级 `Start date`：读取 live PR body 中所有同仓库 Issue 引用（含 resolving 与 informational），按配置时区把 `created_at` 转成日期，并确保 Issue 是 Project item；只有当前值为空时才写入。后续事件、已有日期或后加引用都不补写、不覆盖。缺失配置在 policy 加载时失败；字段缺失、非 Date、Project-local 字段、无效时间戳或 API 失败在首个相关 PR 失败。
10. 【源义务】注意该日期 mutation 没有 compare-and-set：两个 PR 同时引用同一个空 Issue 时都可能写入，最后的写入者胜；per-PR 并发不会序列化同一 Issue。
11. 【源义务】Issue 模板只保留 Bug/Feature/Task；Idea/Research 归入 Task，除非未来有不同生命周期。模板 frontmatter 只含 `name`/`about`/`type`，用 Markdown 标题定义层级、HTML 注释解释内容。PR 模板含 `Motivation`、`Changes`（公开接口与行为变化的相邻占位）和 `Testing`（每种方法直接展示，证明放局部 `details`）。政策不检查 `details` 展示、可见正文长度、标题语言/前缀或 `Owner:` 行；不做自动 metadata repair、Issue 分类或数据迁移。
12. 【迁移设计】测试事件映射、runner 分配条件、终态保护和人类覆盖；不声称有定时 reconciler 或原子 CAS。

**角色与完成信号**：贡献者分类；评审者发命令；自动化工具有限回退；维护者审计标签。完成信号是：两个维度完整，事件映射可复现，人类状态不被覆盖。

**强制与信任**：投影是事件驱动的，不修复从未运行的事件；ProjectV2 没有原子 compare-and-swap；标签检查证明词汇，不证明分类正确。

**失败与恢复**：不支持的 kind/缺 area/无效 Issue 标签/错误 review 命令被修正或失败；人类状态不被覆盖；approved/commented 不消耗 runner。

**例外**：重复 review request 可把自动化 Issue 移回 In review，即使 GitHub 仍显示旧阻塞评审；运营标签可并存；迁移可保留已关闭 PR 的历史。

**证据边界**：无定时协调器；webhook 回放可能重放旧命令；标签描述/模板需维护；GitHub 特定行为迁移到其他 forge 要适配。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-08-08-review-driven-issue-lifecycle-triggers.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-31-pr-opened-issue-start-dates.md:1-42@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-03-semantic-issue-templates-and-policy.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md:1-76@687f282e`
- `deepseek-harness/.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md:1-41@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-08-08-review-driven-issue-lifecycle-triggers.md:1-32@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-31-pr-opened-issue-start-dates.md:1-42@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-03-semantic-issue-templates-and-policy.md:1-40@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md:1-76@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md:1-41@687f282e

<a id="rationale-process-1-pull-request-stack-and-review"></a>
### rationale-process-1-pull-request-stack-and-review — 官方 PR stack、lease 保护刷新与 blame 加权评审

**触发**：两个或更多同仓库 PR 相互依赖；已评审分支被 rebase/merge-forward/sync；评审批准被用于合并判定。

**前置条件**：forge 有官方 stack 对象/CLI；能取 live stack 成员/顺序；能使用精确 lease；能取得 merge base 和 blame，并把提交映射到评审者账户。

**步骤**

1. 【源义务】落地前用官方 stack 对象表示每个 2+ 依赖 PR 链；以 live 成员/顺序为权威。
2. 【源义务】未形成 stack 的同作者链按自底向上自动 link；混合/不可用作者需确认；原生不支持或跨 fork 硬停。
3. 【源义务】冲突成员/官方顺序与分支拓扑不一致时，先取得用户指示再解散/重建。
4. 【源义务】落地整个官方 stack；部分落地必须指定边界 PR 并合并底部前缀；绝不回退到逐个 `gh pr merge` + 手动 retarget。
5. 【源义务】验证每个所选 PR 独立达到 MERGED 才算完成。
6. 【源义务】允许 rebase/merge-forward 刷新独立和官方 stack PR，但远端改写必须用精确 lease 或 lease 保护的 stack push；远端移动则中止；禁止裸 `--force`。
7. 【源义务】sync 后先验证每个被改写层，再允许受影响的 PR 合并；随后重新审计 heads、未解决 review threads、批准、可合并性、检查。
8. 【源义务】批准权重 = `min(2, 1 + 4 * ownedLines / totalLines)`，按 merge base 的旧生产行和 blame 计算；0%→1、12.5%→1.5、25%+→2；比较两点阈值前不四舍五入；未关联作者留在分母；新增行没有 prior owner 且不计入分母；空分母不加成。
9. 【源义务】在依赖安装/历史评估前把批准 head 标为 pending，避免中断的 history fetch 保留旧批准。

**角色与完成信号**：PR 作者 link/refresh；评审者批准；合并自动化 land/verify；release engineer 确认最终状态。完成信号是：stack 顺序权威、每个所选 PR MERGED、改写后评审/检查重新有效。

**强制与信任**：官方 stack 元数据证明成员/顺序，不证明每层正确；lease 证明 push 时远端未动，不证明旧评审仍有效；blame 证明行所有权，不证明评审质量/独立性。

**失败与恢复**：缺原生支持/跨 fork/冲突成员/lease 移动/未达 MERGED/批准失效都阻塞；改写后重新评审；stack sync 可短暂发布本地验证未完成的代码，但受影响 PR 在验证前不合并。

**例外**：merge-forward 在保留冲突解决检查点比线性历史更重要时可用；同作者 legacy 链可自动 link，混合所有权需人工；新增行没有 prior owner 且不计入分母，因此不产生加权贡献。

**证据边界**：原生 stack/merge queue 是 forge 特定；lease 不保留评审有效性；blame 权重依赖账户关联和旧行分类。

**来源**

- `deepseek-harness/.agents/notes/implemented/process/2026-08-02-native-github-stacks-and-optional-rebases.md:1-43@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-09-11-production-blame-approval-weight.md:1-36@687f282e`

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-02-native-github-stacks-and-optional-rebases.md:1-43@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-09-11-production-blame-approval-weight.md:1-36@687f282e

<a id="rationale-process-1-repository-tooling-hygiene"></a>
### rationale-process-1-repository-tooling-hygiene — linter 迁移等价、staged/full 分离与手动专属重流程

**触发**：替换/移除 linter、formatter 或死代码工具；pre-commit 需要全量检查的快速子集；autofix 返回非零；常规文档编辑需要翻译。

**前置条件**：能盘点旧规则/检查；新 linter 支持类型感知；能维护 staged 配置继承；有 fix 重试包装；能判断旧死代码工具是否拥有唯一不变量。

**步骤**

1. 【源义务】显式迁移旧规则清单；不要依赖继承 preset 或内容会变的宽泛类别作为等价证据。
2. 【源义务】保留一个权威 full config 和一个 staged config：staged 继承源规则、只关闭昂贵分析、重新纳入快速后端不能分析的文件。
3. 【源义务】lint/fix 共用一个 runner，使配置、启动和依赖边界唯一。
4. 【源义务】fix 模式捕获第一次调用；若完成但非零，丢弃可能过时的诊断，继承输出重跑一次并停止；不要为一个 pass 保留第二个 formatter。
5. 【源义务】移除死代码/门禁工具前确认它没有拥有唯一不变量；记录例外理由。
6. 【源义务】把扩展翻译/委派流程设为手动专属；常规编辑只翻译变化内容、一次完成，不生成 brief、不委派、不加独立评审 pass。
7. 【迁移设计】用 fixture 覆盖旧规则；让 staged 配置与 full 配置共享同一源；CI 跑 full，本地钩子跑 staged。

**角色与完成信号**：工具 owner 维护规则/runner；贡献者用 staged；CI 跑 full；文档 owner 判断常规/扩展翻译。完成信号是：无规则丢失，local/CI 同一 runner，fix 残留诊断可见。

**强制与信任**：parity fixture 证明已映射规则的受测行为，不证明未来规则完全等价；fix 重试仍可能留下语义问题；死代码移除依赖替代覆盖。

**失败与恢复**：未映射规则/staged 配置错误/第二个 formatter/fix 非零未报告/移除门禁后不变量无主都失败；fix 重试后仍失败要报告；常规文档编辑误触发扩展流程时改回一次翻译。

**例外**：staged 可关闭类型分析以提速，但继承源规则；高风险/大更新仍可手动使用扩展翻译流程。

**证据边界**：parity 不覆盖所有未来规则；staged 可能漏类型感知问题；手动流程依赖贡献者纪律。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-29-oxlint-linter.md:1-46@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-08-lightweight-routine-documentation-translation.md:1-31@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-09-oxlint-only-fix-workflow.md:1-38@687f282e`
- `deepseek-harness/.agents/notes/archived/process/2026-08-19-remove-knip.md:1-28@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-29-oxlint-linter.md:1-46@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-08-lightweight-routine-documentation-translation.md:1-31@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-09-oxlint-only-fix-workflow.md:1-38@687f282e 来源：deepseek-harness/.agents/notes/archived/process/2026-08-19-remove-knip.md:1-28@687f282e

<a id="rationale-process-1-design-token-system"></a>
### rationale-process-1-design-token-system — 设计 token、活样式规范与偏离记录

**状态**：源 Note 为 archived（2026-07-19），并带有 2026-07-22 的 token-system 更新：框架级裁决（CSS Modules + clsx、无组件库、无 Tailwind、颜色只用 token）继续有效，但旧的两层 `--bg-*`/`--text-*` token 表和 `web-ui/src/style/global.css` 位置已被 `--dsw-*` static + alias sheets 取代。不要把旧两层表当作当前权威；迁移时使用目标仓库当前的 living token 源。

**触发**：引入/修改 Web 样式框架或 token 体系；组件需要偏离基线的值；新增 dark mode、边框、elevation 或交互 token；重新考虑框架级决策。

**前置条件**：有视觉基线调查；有 RFC 与活规范两个位置；有评审清单；有 token 表/偏离表。

**步骤**

1. 【源义务】框架决策放在 RFC（很少变化）；权威 token 值、编码清单、偏离记录放在活规范。
2. 【源义务】token/新规则变化改活规范；推翻框架需要 superseding RFC。
3. 【源义务】从调查的视觉基线出发；偏离必须在落地代码前记录在偏离表（日期、项、原因）。
4. 【源义务】框架级裁决（CSS Modules + clsx、无组件库、无 Tailwind、颜色只用 token）保留；但不要复制已退役的两层 `--bg-*`/`--text-*` 表。当前源使用 `--dsw-*` static + alias sheets；迁移时读取目标仓库的当前 token 表，而不是按旧 Note 重建。
5. 【源义务】默认不把 font size/spacing 全部 token 化（源经验：px + 配对行高，如 16/24、14/22、12/18，和 4 倍数 spacing）；具体 token 名、层级和覆盖范围以当前 living spec 为准，目标已有不同 token 体系时不要强行复刻源表。
6. 【源义务】边框/交互/暗色规则从当前 living spec 读取；源 Note 的“单一 dark-mode override、不要散落覆盖”原则保留，但不要从已退役的 `--bg-*`/`--text-*` 表推导实现。
7. 【迁移设计】把新组件评审指向活规范和清单；定期清理不再需要的偏离。

**角色与完成信号**：设计 owner 维护活规范/偏离表；前端工程师实现；评审者检查 token 使用。完成信号是：框架裁决、当前 living token 源和偏离记录一致，暗色由单一 override 表驱动。

**强制与信任**：规范证明记录的值/偏离；不证明视觉质量或可访问性；评审仍检查实际使用。

**失败与恢复**：未记录偏离、未登记 token、RFC/活规范冲突时评审失败；框架级变更只改活规范时要求 RFC；偏离不再需要时同时清理表和代码。

**例外**：有理由的偏离可记录后使用；font size/spacing 在不增加复用时可以保持字面值。

**证据边界**：源的具体视觉基线/token 名是项目特定；清单不证明可访问性/审美；偏离表可能积累。

**来源**

- `deepseek-harness/.agents/notes/archived/process/2026-07-19-web-styling-system.md:1-62@687f282e`

---

来源：deepseek-harness/.agents/notes/archived/process/2026-07-19-web-styling-system.md:1-62@687f282e

<a id="rationale-process-1-public-api-reporting"></a>
### rationale-process-1-public-api-reporting — 签入公开 API 报告（已推迟的提案）

**状态**：`proposed` / deferred；固定提交中没有实现或门禁。以下只作为条件性方案保留，不能声称当前有效。

**触发**：包对外发布或外部消费，公开 API 稳定性成为真实契约；评审必须检测导出面变化，而不只是源码 diff。

**前置条件**：能生成声明报告；有签入位置（源示例 `etc/<pkg>.api.md`）；CI 能比较重新生成结果。

**步骤**

1. 【提案】用 api-extractor 或 `tsc --emitDeclarationOnly` + 规范化公开 API dump，为每个包生成签入报告。
2. 【提案】CI 在重新生成与已提交报告不一致时失败。
3. 【提案】让每次公开 API 变化成为评审必须看到的报告 diff 行。
4. 【提案】如果重依赖不合适，选择更轻的规范化 dump，但保留“签入、可 diff”的形态。

**角色与完成信号**：API owner 生成/审查；CI 比较；评审者看 diff。完成信号（若激活）是：报告与声明一致，API 变化可见。

**强制与信任**：报告 diff 只证明声明面变化，不证明兼容性或意图；当前没有自动保证。

**失败与恢复**：若实现，过期报告应失败；手改报告与声明不一致应失败；编译器升级导致格式漂移需要稳定格式/迁移。

**例外**：源因内部 monorepo 评审已能看到源码 diff、依赖重且格式易变而推迟；包未外部发布时不激活。

**证据边界**：这是提案，不是已实现机制；不要把它写成当前 CI 门禁或发布保证。

**来源**

- `deepseek-harness/.agents/notes/proposed/process/2026-06-11-api-extractor-reports.md:1-32@687f282e`

---

来源：deepseek-harness/.agents/notes/proposed/process/2026-06-11-api-extractor-reports.md:1-32@687f282e

<a id="rationale-process-1-transition-retirement"></a>
### rationale-process-1-transition-retirement — 在实时证据后退役临时迁移命令

**状态**：`proposed`；固定提交中没有执行该移除。以下是条件性退役流程。

**触发**：过渡期引入了一个临时 mutation 命令，并与永久只读门禁并存；迁移窗口可能已关闭；仍有分支携带过渡前数据。

**前置条件**：能列出开放 PR；永久 canonicalizer、单元测试、只读 snapshot/gate 已存在；有分支收敛程序。

**步骤**

1. 【提案条件】只有实时清单确认没有开放 PR 仍需要临时命令后才移除；时间流逝不是证据。
2. 【提案条件】保留永久 canonicalizer、单元测试和只读检查；只移除面向分支的 writer。
3. 【提案条件】同一变更移除根命令、分支收敛链接、文档和命令特定诊断；把补救文字改为与命令无关的 canonical 布局指引。
4. 【提案条件】移除前，每个受影响分支合并当前 main、运行一次迁移器、单独提交仅 fixture 的重写、验证仓库级 snapshot 检查。
5. 【提案条件】更新当前文档，只描述永久默认和强制。
6. 【迁移设计】把移除做成独立可评审变更；失败的实时清单缺口要显式记录并保留回退路径。

**角色与完成信号**：迁移 owner 做清单/移除；merge owner 提供分支程序；贡献者执行收敛；评审者验证永久检查仍在。完成信号是：临时 CLI/链接/诊断消失，永久检查通过。

**强制与信任**：实时 PR 清单证明已知迁移集；不能证明未打开分支不需要；snapshot 证明 canonical 布局，不证明迁移完整。

**失败与恢复**：无清单移除可能搁浅分支；保留命令留下第二维护路径；移除 canonicalizer 会失去强制。遗漏分支时使用文档化手动/重新生成路径或恢复命令。

**例外**：已关闭/被取代分支不需迁移；保留更久运营成本较低但会模糊永久机制。

**证据边界**：这是提案；源的具体 fixture 格式/命令名是产品特定；实时清单可能漏掉未打开工作。

**来源**

- `deepseek-harness/.agents/notes/proposed/process/2026-07-26-remove-packed-session-fixture-migrator.md:1-38@687f282e`

---

来源：deepseek-harness/.agents/notes/proposed/process/2026-07-26-remove-packed-session-fixture-migrator.md:1-38@687f282e

<a id="rationale-process-1-audience-first-documentation"></a>
### rationale-process-1-audience-first-documentation — 以受众为先的文档质量（部分交付的提案）

**状态**：`proposed`；源说明切片 1–3 已交付（`dsh-doc`、`session-persistence-jsonl` README 对、`test:docs` 的元数据/配对/快速检查），切片 4–5 和全语料应用仍未完成。不要把未完成部分写成当前保证。

**触发**：文档机械通过但读者无法完成任务或找到一个答案；生成参考压垮检索或单页主导 agent 上下文；常驻标准到达预算上限；包 README 入口缺受众/结果信息。

**前置条件**：有一份 canonical 质量参考；能按文档职责分类；有包 README 元数据/Summary 检查；能在原型页测量查询步骤/规模。

**步骤**

1. 【提案】按文档职责定义五个可评审结果：brief（常用路径只含达成结果所需事实，穷尽契约在链接/生成细节后，不删除必要行为/失败/所有权/限制）、intuitive（确定起始状态、前置先于依赖概念、一个明确下一步、使用读者会搜索的术语）、friendly（可识别成功、行动前理解风险、从常见失败恢复、无需无关架构即可进入下一层）、accurate（每个持久事实一个 owner 和与风险相称的验证路径；生成事实来自源；手写工作流值链接/消费 owner 而非复制枚举/路径）、agent-readable（标题/锚点/术语/所有权/当前-vs-提案状态足以检索所需章节，不加载全语料或重建评审历史）。
2. 【提案】按文档职责给出主结果、必需入口信息和验证：产品快速开始、用户任务指南、贡献者教程、架构概览、包/子系统参考、生成参考、agent 指令/skill、提案/实现 Note。把这套标准放在一份 canonical 质量参考；常驻标准只保留短规则并链接。
3. 【提案】生成参考先有紧凑入口层（范围、查询意图、分组/索引、概念指南、生成/检查命令），生成器报告页面词数/条目数/标题数/最大章节；一次查询需要扫无关分组或单页主导上下文时，按源元数据稳定领域拆分，并保留旧锚点别名。
4. 【提案】每个 authored 包 README 用可搜索 YAML：Skill 风格 description + 机械推导 kind；四种 kind 对应 package-group/package-reference/package-library/package-bundle 模板；路径/哈希/行对齐由 sidecar 拥有；标题/manifest 拥有名称，文档职责表达受众；标签在受治理分类和搜索消费方证明价值前不添加。
5. 【提案】页面先 3–5 句 Summary + 链接 ToC；英文包 Summary ≤100 个 `wc -w` 词；描述读者可见能力而非 Cordis 角色/注册/内部组件；省略读者不直接在配置/命令/公开 API 使用的源码标识符。格式拥有的 Note/复盘/生成片段/机器文件保留骨架。
6. 【提案】每个实质章节先给短引导；页面从基础用户用法进展到高级开发者/维护者细节；英文技术正文做 ASD-STE100-inspired 非认证清晰度评审（明确行动者/动作、稳定术语、直接动词、拆分指令与条件、保留情态/例外/时序/数字）；20 词指令/25 词描述只是提示，准确性优先。
7. 【提案】包契约留在代码旁；跨包材料向 docs/learn/*、docs/user、docs/developer、docs/scratch、docs/subsystems 迁移；英中同权威、同结构/链接/代码/frontmatter 布局/精确物理行数。
8. 【提案】内联配对元数据是 sidecar 的目标替代；在 verifier/merge driver/恢复/生成区域记录/归档检查都消费非自引用摘要前可并存；根级内部链接是目标模型，但相对链接在证明根级形式能同时通过 GitHub/站点/锚点检查前保留。
9. 【提案】Further Exploration 可选 3–7 个相邻页；每个 authored 页以 Dev Note 结尾，作为活跃粗略上下文唯一位置，非权威，链接而不复制任务状态，工作关闭时提升/清理。
10. 【迁移设计】按切片推进：1) 建/验证 dsh-doc 并改写一个 README 对为行对齐原型；2) 用新人/用户/开发者/agent 任务评审原型，先改 skill；3) 加元数据/Summary 长度/章节顺序/行对齐/链接解析/配对 fixture，迁移违规 Summary，保留 sidecar 到替代支持齐全；4) 提取 canonical 质量参考、压缩常驻标准、一次整理一个 docs 主题；5) 在一个大目录和一个混合子系统页做入口/细节原型，测量查询成本下降且不丢事实/不扰动路由后再推广。

**角色与完成信号**：文档 owner 维护标准/入口；包 owner 写 README；评审者做读者任务验证；生成器维护检索规模报告。完成信号（切片 1–3）是：dsh-doc/README 示例/test:docs 生效；切片 4–5 必须有实测证据。

**强制与信任**：元数据/Summary/行对齐检查证明形状，不证明读者成功；审计使用仓库结构/门禁/代表页，不是用户研究；提案明确未证明全语料改动。

**失败与恢复**：Summary 超限/缺 canonical 参考/预算无余量时失败或评审拒绝；生成参考无测量就拆分的方案被拒；行对齐导致不自然翻译时同时修订两侧保护含义。

**例外**：格式拥有的 Note/生成片段/机器文件保留骨架；穷尽参考可在入口层后保持长；相对链接在根级形式验证前保留。

**证据边界**：切片 1–3 已交付，4–5 开放；元数据可能样板化；句长限制可能割裂解释；读者成功未被自动证明；不要声称完整采用。

**来源**

- `deepseek-harness/.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:1-139@687f282e`

---

## 二、源权威状态与本参考的边界

### 2.1 生命周期分类

- **implemented（当前决策记录，19 篇）**：frozen-archive、CI failover、dependencies-over-hand-rolling、worktree hooks、generated notices、native stacks、native Windows CI、label taxonomy、review status、ambiguous token ban、generated CLI、optional bundles、signature cache/completion、no-unknown-casts、dual-release work budget、product package classification、build split、local gate speedups。这些是固定提交中的当前机制；本参考按原文迁移其义务，但不声称目标仓库已执行。
- **archived（历史记录，当前权威可能不同）**：其余多数 process Note。归档表示“已实现的决策被冻结为历史”，不表示其机制仍然有效或已废弃。凡涉及当前策略，优先查看同目录 implemented Note 或代码；归档内容只作为设计与教训来源。
- **proposed（未执行）**：`rationale-process-1-public-api-reporting`（deferred，无实现）、`rationale-process-1-transition-retirement`（未执行移除）、`rationale-process-1-audience-first-documentation`（切片 1–3 已交付，4–5 开放）。不要把这三者写成当前自动保证。

### 2.2 跨域所有者与未验证边界

已复读下列三篇源 Note 的依赖条款，并用实际 GFM 链接、固定源清单和现有 coverage 登记所有者。登记的是实际文件与读取声明，不是本分区新增的外域全文语义审阅，更不是目标实现证明：

- 签名缓存引用的 primary-runtime 与 desktop release identity 分别有 `rationale-feature-3`、`rationale-architecture-4` 的读取声明；缓存不能覆盖其运行时内容、厂商签名、监督预检、硬件互锁与最终产物验证职责。时间戳分离等其它 Note 的全部依赖不因这批缓存条款绑定而自动关闭。
- build 拆分引用的 serial CI、PR artifact 和 lossless 决策有 `rationale-process-2` 的声明；`rationale` 对 lossless 的前30行仍只是局部，不充当136行全文证明。Typert 顺序决策归 `rationale-architecture-3`。这些绑定不证明目标构建无损或真实 CI 已阻断。
- 可选 bundle 的隔离、组成、显示和按需 native 边界分别登记 `rationale-process-2`、`engineering`、`rationale-architecture-1` 与 `package-contracts-8` 的实际路径/范围；局部声明保持局部，不能借用别人的机制名冒充重新验证。
- 第三方声明/许可证引用共享 runtime lock、vendor README 和 patch 记录；本参考迁移生成与失败关闭逻辑，具体依赖清单不在本分区。

实际跨域记录见本域 coverage 的 `crossDomain`；原始“未绑定”问题保留并增加当前处置。独立来源语义审阅、具体实现完整性和目标正/反/恢复证据仍是各 owner 的门，不能因链接能解析就写成已通过。第三方 lock/vendor/license 依赖没有因这三篇 Note 的绑定而自动关闭。

### 2.3 验证状态

**原始提取时**，本参考中所有 `positive/rejection/recovery` 场景都是 **planned**。这批来源处置没有执行本分区31个机制的目标场景；相关文档编译门禁后来已有自己的有界执行与复核证据，也不能通借为本分区全部生效。提取阶段没有：

- 运行目标仓库的构建、测试、lint、formatter 或 smoke；
- 修改远端仓库、分支保护、发布或 registry；
- 执行签名硬件、原生 runner、浏览器或发布流程；
- 证明任何检查在目标 forge 上真的阻塞合并。

因此，“通过”只能描述本参考/知识 JSON 的内部一致性与源覆盖，不能描述目标运行时行为。目标实现者必须逐项执行并保留命令、输出、失败与恢复证据；独立验证者应重新运行，而不是接受作者自报。

### 2.4 迁移落地顺序（迁移设计）

1. 先建立决策记录/状态与范围报告，让后续变更可评审。
2. 选择一项高价值不变量，做成一个本地与 CI 共用的可执行门禁，并写正/反/恢复测试。
3. 建立生成/配对/文档的单一 owner 与最小门禁，再按测量结果扩展。
4. 拆分构建/检查职责，先证明字节等同，再迁移调用方；随后处理 CI 独立 job 与原生证据。
5. 发布/签名/安装器等高风险路径先做无凭据候选验证与故障测试，再做受信任执行。
6. 最后处理标签/Issue/stack 等协作工作流；它们依赖 forge 能力与人类决策边界。

每一步都保留“源义务 / 迁移设计 / 额外建议”的区分；发现目标事实与源不同（规模、工具、forge、平台）时，参数化实现，不要删除触发条件仍存在的义务。

## 三、本分区的证据边界与已知限制

1. **Note 是决策记录，不是运行时证明。** 源 Note 描述的实现、测量和 CI 证据属于固定提交的作者陈述；本分区没有重新执行。
2. **归档 Note 有意冻结。** 其中的路径、符号、链接和数字可能过时；不要据此推断当前行为。
3. **提案不是保证。** 公开 API 报告、临时迁移器移除、audience-first 的切片 4–5 都未完成；本参考用“提案/未执行/部分交付”标注。
4. **产品特定内容不普遍化。** Typert、Cordis、DSH、pnpm、GitHub、Windows、Lefthook 等是源实现示例；迁移时保留机制（例如“源码平面解析”“worktree 局部配置”“事件命令”），替换具体命令/路径/标签。
5. **测量是主机特定的。** wall/CPU/内存和 runner 数字用于说明取舍，不是目标 SLA；目标必须重测。
6. **跨域声明不等于完整验证。** 见 2.2；已登记实际 peer owner，但不声称本分区重新通读了它们的正文或执行了其目标行为。
7. **侧车只作机器结构检查。** 本批完整消费80个实际侧车：58个冻结整文件 Git-blob 记录、22个当前逐章节哈希记录。冻结记录的两侧40位 SHA1 与固定源正文 bytes 相符；当前格式按原解析器/渲染器核对完整数据与注释模板，未重算章节新鲜度或证明翻译语义。12个冻结头部保留缺失参数/归档前路径的历史提示，不为满足新格式而重写封印。原候选及理由仍保留，新增 `currentDisposition` 和明确标为机器结构读取的 inspected 记录，不冒充正文语义阅读。

## 四、覆盖与引用

- 分区：`rationale-process-1`；分配 80 篇英文 Note，实际读取 80 篇英文与 80 篇中文正文，共 160 个正文文件。
- 上述160个正文声明保持原样；新增80个 `generated` 机器数据检查与之分列。元数据角色检查不增加正文/机制语义覆盖，也不证明任何目标门禁、签名硬件、runner 或 forge 效果。
- 覆盖记录：`research/rationale-process-1-coverage.json`（每个 inspected 条目是单个文件，ranges 为数值 `{start,end}`，mechanismIds 为数组）。
- 知识记录：`knowledge/rationale-process-1.json`（31 个机制，每个机制含 sources、problem、triggers、obligations、actors、steps、enforcement、applicability、relationships、migration、reference、verification、limitations）。
- 本参考中的机制链接由知识记录中的 `reference` 字段指向 `references/rationale-process-1.md#<mechanism-id>`；每个小节都有显式 `<a id>` 锚点。

来源：deepseek-harness/.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:1-139@687f282e