# 测试强度、回放拓扑与可靠性治理：迁移参考

来源：`deepseek-harness`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。本文只依据该提交中 `.agents/notes/` 的 59 个 testing Note（英文与中文正文）及其直接引用的原始事实编写，不把旧 Skill、旧提取物或其他作者的结论当作设计输入。正文保留迁移所需事实，读者无需 checkout 源仓库。

## 0. 如何使用本文

- **证据等级。** 每个程序开头标注证据等级：
  - `[源义务]`：Note 状态为 implemented 或 archived，正文描述了已落地机制、失败复现和验证结果。本文复述其义务，但不声称本次提取重新执行过。
  - `[源提案，未实现]`：Note 状态为 proposed，或正文明确说机制未交付。只能作为历史与理由，不能作为现行门禁或自动保证。
  - `[迁移设计]`：为落地到新仓库而做的组合、顺序或参数化建议，不是源仓库已经执行的义务。
- **Note 是决策记录，不是运行时证明。** 正文中的 CI run id、before/after 计数、红→绿检查都是源报告；除非后续实现/采纳者实际执行，否则一律视为 planned/claimed，不视为本次验证。
- **迁移时先读触发索引，再按程序执行。** 不建议按机制 id 逐条照搬；先判断你遇到的是哪类失败，再选择最小程序集。
- **项目特有教训要参数化保留。** 例如 `DSH_COVERAGE_TEST_TIMEOUT_MS`、`TMPDIR=runner.temp`、`seedLength` 是源项目标识符；迁移时应替换为等价的环境变量、路径和格式字段，而不是删掉教训。

## 1. 触发索引

| 你遇到的情况 | 先执行 | 相关机制 |
|---|---|---|
| 要为用户可见输出或整条协议路径建立可重复测试，且不能每 PR 调真实模型 | §2.1 录制-回放金标 | `record-once-replay-corpus`、`expected-output-authority` |
| 金标被测试自己改写、diff 噪声大、或 refresh 误入 CI | §2.2 金标权威与刷新 | `expected-output-authority`、`redaction-fixed-points` |
| 一个进程里有父子 agent、fork 子会话或后台子会话 | §2.3 嵌套会话键控 | `replay-script-keying`、`tripwire-failures` |
| 测试配置是生产配置的手工镜像，已开始漂移 | §2.4 单一来源组合 | `single-source-composition` |
| 终端/富渲染器的最终画面无法用事件日志或写片段证明 | §2.5 语义状态投影 | `semantic-state-projection` |
| 工具执行了，但无法证明模型实际收到了 schema、系统段或上下文 | §2.6 模型可见表面 | `model-visible-surface-snapshot` |
| 大提示词/schema 在 fixture 中重复，评审 diff 被淹没 | §2.7 脱敏固定点 | `redaction-fixed-points` |
| fixture 集出现孤儿、缺文件、重复 pin 或 envelope 噪声 | §2.8 封闭清单与投影 | `fixture-hygiene-guards` |
| 要在浏览器中覆盖真实 Host、wire 和 bundle 组装 | §2.9 浏览器组装通道 | `replay-assembled-lane`、`real-assembly-over-hand-built-bench` |
| 包能安装但安装后入口坏了，或 PR 只测源码 | §2.10 安装产物入口 | `real-entry-path-gate`、`installed-artifact-qualification` |
| 测试用手搭 bench 或可编程 fake，可能允许真实系统禁止的状态 | §2.11 真实组装与边界 mock | `real-assembly-over-hand-built-bench`、`boundary-mock-not-contract-reimplementation` |
| 多个测试各自 spawn 子进程，settlement 和 kill 行为不一 | §2.12 子进程统一管线 | `subprocess-plumbing` |
| 测试单独跑是绿的，整条 lane 并行时红；固定端口/路径/全局态冲突 | §2.13 并发隔离 | `test-isolation-hermeticity` |
| 测试超时后留下子进程、watcher、临时目录或未恢复的工厂 | §2.14 fixture 生命周期 | `fixture-lifecycle-ownership` |
| 用 sleep、冻结时钟或瞬时 DOM 断言来“稳定”测试 | §2.15 确定性屏障 | `determinism-barriers` |
| golden 记录了 hover/focus/后续读取的状态，但捕获时该状态只是被隐含 | §2.16 观察已观察状态 | `observation-waits-on-observed-state` |
| 在 HTTP 202、进程启动或终止请求之后就断言完成 | §2.17 完成信号归属 | `owned-completion-observation` |
| 进程创建尖峰让套件超时；抬高 testTimeout 后又在 teardown 超时 | §2.18 预算归属 | `timeout-budgeting` |
| Windows/macOS/Linux 上同一语义测试表现不同 | §2.19 平台中立 fixture | `platform-neutral-fixtures` |
| 新测试从未失败过，无法证明它能抓住目标回归 | §2.20 负向对照 | `negative-control-calibration` |
| guard 的预期输出与无 guard 时字节相同，或 harness 静默错路由 | §2.21 会咬人的 tripwire | `tripwire-failures` |
| 协议形态代码的输入空间是组合性的，示例测试只覆盖想到的情况 | §2.22 属性不变式 | `property-invariants` |
| 必需 lane 因缺 secret/浏览器/运行时能力而 skip，却仍显示绿色 | §2.23 防假绿预检 | `no-false-green-preflight`、`secret-and-trigger-isolation` |
| 需要真实 API 覆盖，但 fork PR 不能拿 secret | §2.24 带密钥真实 API 门禁 | `with-key-real-api-gate` |
| 概率性失败被 retry、加大超时或 skip 掩盖 | §2.25 可靠性治理 | `test-reliability-governance` |
| 性能回归到 master 才发现；单点测量掩盖阶段间转移 | §2.26 性能预算门禁 | `performance-budget-gate` |
| 压力测试结果被当成合并门禁，或 socket backlog 被当成渲染成本 | §2.27 证据与门禁分离 | `perf-diagnostics-separation` |
| 报告把单机、单平台、单 runner、单 corpus 的结果说成普遍结论 | §2.28 声明边界 | `evidence-scoped-claims` |
| 覆盖率门禁只测包源码，测试框架/浏览器驱动逻辑在门外 | §2.29 覆盖平面诚实 | `coverage-plane-honesty` |
| 适配器、更新器或网络层需要区分多种故障并验证恢复策略 | §2.30 故障注入 | `fault-injection-and-recovery` |
| 外部下载偶发超时，一次失败就让整个 job 红；想加重试 | §2.31 有界瞬时重试 | `bounded-transient-retry` |

## 2. 程序

### 2.1 录制-回放金标 {#proc-replay}

`[源义务]` 录制真实模型的一次会话，提交每个逻辑会话的日志与规范化预期输出，在默认门禁中无密钥回放。模型是唯一被 mock 的边界；agent loop、工具、presenter、持久化和传输都走生产实现。源实现由 `dsh-llm-replay` 从持久 `assistant/message` 或 `assistant/attempt` settlement 派生每个 `stream()` 调用一条 replay entry。

**前置条件**
- 有一个能在测试中运行的生产组合，以及一个可替换的模型 adapter。
- 能在受信任环境持有 API key；默认 PR 路径无 key。

**步骤**
1. 场景只替换模型 adapter，记录模式启动真实组合。
2. 用 `pnpm run test:snapshot:record` 录制，得到 `session[.vN].jsonl` 与 ACP stdout 等 wire 输出。
3. 从每个持久 settlement 派生 replay 脚本；规范化 id、路径、时间戳等易变值。
4. 提交 fixture 与预期输出；无 key 时 record 必须自行跳过，不能生成空 fixture。
5. 用 `DSH_SNAPSHOT=replay`（web lane 的 `test:web:ci` 也显式注入）回放，确认不写文件。
6. 只有确认用户可见输出有意变化后，才运行 refresh，逐项评审 diff，再用 replay 复验工作树无写入。

**责任者**：场景作者负责录制与解释 fixture；评审者负责 golden diff；CI 只回放；维护者持有 key 与录制流程。

**完成信号**：无密钥回放与已提交预期输出逐字节一致，且工作树无写入。

**失败处理**：replay 不一致即失败；缺 key 的 record 是 skip，不得伪造绿色；缺 refresh 必须在改变组装的那个 PR 内失败。

**例外**：错误/取消等场景可用 `replay.override.json` 手工编写；没有模型轮次的场景可无密钥编写，但其事件仍须来自真实代码路径。

**证据边界**：一次录制只是模型行为的一个样本，不证明模型质量；fixture 会老化；keyless skip 若放进必需门禁就会变成假绿（见 §2.23）。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-06-19-acp-snapshot-tests.md:1-87@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-98@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-06-22-subagent-snapshot-replay.md:1-59@687f282e`。

### 2.2 金标权威与刷新 {#proc-golden}

`[源义务]` 已提交的规范化预期输出是断言权威；refresh 是独立的开发者动作，不能出现在断言路径或 CI 中。快照比较使用普通相等，不在比较时写回 fixture；`fixtureContext()` 从各自 header 派生上下文，使已规范化 fixture 幂等。

**前置条件**
- 有独立的 compare 与 refresh 入口。
- 有明确的易变字段列表；normalizer 只动这些字段。

**步骤**
1. 选择能表达契约的语义投影：终端行/换行/样式区间、web aria 树、wire 消息序列。
2. 用显式 token 替换易变值；不得把两个不同事实折叠成同一个 token。
3. 提交预期输出；CI 只调用 compare。
4. 有意变更后运行 refresh，逐项评审 diff，再运行 replay 证明无写入。
5. 一个场景最多保留一份会话日志产物；不要同时维护 `session.jsonl` 与 `session.expected.jsonl`。

**责任者**：作者生成并解释 golden；评审者确认 diff 属于本次变更；CI 拒绝写入。

**完成信号**：compare 通过且 `git status` 无 fixture 变化。

**失败处理**：不一致失败；过期 golden 在改变组装的同一 PR 内失败；refresh 误入 CI 会把回归变成通过的更新，因此模式必须显式注入。

**例外**：override 场景可把预期日志提交为 `session.jsonl`；瞬态渲染状态可直接编写，因为完成后的日志无法保留它。

**证据边界**：normalizer 过宽会隐藏真实差异；大 golden 仍需要评审制度，机制本身不评审。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-06-20-remove-redundant-snapshot-log-expected-output.md:1-38@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-08-18-session-snapshot-envelope-projection.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-30-web-browser-snapshot-ci-gate.md:1-40@687f282e`。

### 2.3 嵌套会话键控 {#proc-nested}

`[源义务]` 回放按调用方会话键控，而不是按全局调用顺序。父会话与进程内 subagent 在同一个 context 上交错流式输出时，单一全局游标会把父脚本发给子会话。fork 子会话的日志还以父会话的已播种前缀开头，从整份日志派生脚本会把父响应当作子模型调用重放。

**前置条件**
- 模型请求可携带可选的 `sessionId`，且该类型不造成包导入环。
- harness 能枚举每个持久 Session 目录并解析 header。
- fork 生产者能持久化继承前缀的精确边界。

**步骤**
1. 在请求组装时从 `agent.session.id` 写入 `GenerateOptions.sessionId`；adapter 忽略它，`llm/stream` 监听器用它路由。
2. fixture 命名：父 `session[.vN].jsonl`，子 `session.<ordinal>[.vN].jsonl`；每个角色选数值最高的 generation。
3. 子 fixture 按 header `createdAt` 排序，时间相同用 recorded id 决胜。
4. 活跃会话按首次调用顺序绑定：第一个发起模型调用的会话认领第一份脚本（父会话最早 `createdAt`，且必然先运行一轮才能委派），后续新会话依次认领；每个会话独立推进游标。
5. 无 `sessionId` 的调用视为一个匿名会话绑定主脚本，保持单会话路径字节不变。
6. fork 子会话从 `inheritedEventCount` 及之后的事件派生；边界由生产者在 `session/end-seed { inherited: true }` 中标记，解码取最后一个 marker；v0 的 `seedLength` 由 codec 翻译为同一逻辑对。
7. 活跃会话数多于录制脚本数时明确报错，绝不静默错路由。

**责任者**：replay adapter 所有者实现键控与 fail-loud；Session/fork 后端所有者发出边界；场景作者录制父与每个子日志。

**完成信号**：混合 spawn+fork 场景中两个子会话都拿到自己的脚本；单会话路径逐字节不变。

**失败处理**：多出的活跃会话是错误；继承边界缺失时不得用启发式猜测。

**例外**：并发或后台子会话必须引入显式首次调用序号，不能依赖时间戳；进程外 ACP subagent 是另一种回放形态，源中仍以 `TODO(acp-subagent-replay)` 跟踪。

**证据边界**：首次调用顺序假设兄弟会话严格顺序；边界必须贯穿 resume/load 路径，否则恢复时会退化为全长 seed。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-06-22-subagent-snapshot-replay.md:1-59@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-06-22-fork-child-replay-seed-boundary.md:1-45@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-06-22-fork-snapshot-scenarios.md:1-32@687f282e`。

### 2.4 单一来源组合 {#proc-composition}

`[源义务]` 不维护生产配置的手工镜像。测试/回放组合用 include overlay 引入生产配置，只 patch 必须不同的条目。源实现中 `cordis.snapshot.yml` include `cordis.yml`，按 id 与 name 禁用 `llm-deepseek`，插入 `llm-replay`；录制仍启动 `cordis.yml`。

**前置条件**
- 配置加载器支持 include 与 `patches`。
- 被 patch 的条目有稳定 `id`；disable patch 同时断言 `name`。
- 加载守卫允许被有意禁用的条目。

**步骤**
1. 写 overlay：include 正式配置，禁用生产 adapter（按 id 与 name），插入回放 adapter。
2. 录制使用基础配置，回放使用 overlay。
3. 回放全部既有场景，确认预期输出逐字节不变。
4. 基础配置新增插件后，确认它自动出现在回放树，无需第二次编辑。

**责任者**：配置所有者维护 base 与 overlay；测试作者用 base 录制；评审者检查 delta 保持最小。

**完成信号**：所有场景在 overlay 上原样通过，expected outputs 不变。

**失败处理**：id 被重命名时 patch 退化为 skip，可能出现一条无效的无密钥 adapter 条目；由于 replay adapter 拥有流短路，回放输出仍可能正确，这属于配置腐烂，必须由评审发现。若 patch 打错目标，`name` 断言应阻止禁用错误插件。

**例外**：overlay 依赖 include 在加载时应用 patch、后续 refresh 路径不重新 patch；这适用于一次性 replay boot，不加载 HMR、运行中不重写配置。未来第二个差异只加一行 patch，不再 fork 文件。

**证据边界**：overlay 解决形状漂移，不证明每个插件行为；id 冲突由 loader 的 last-wins 规则处理，当前配置无冲突。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-04-single-source-acp-replay-config.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-04-hook-snapshot-matrix.md:15-25@687f282e`。

### 2.5 语义状态投影 {#proc-render}

`[源义务]` 有状态渲染器的最终画面不能由 `Terminal.write()` 片段、组件行或栅格截图证明。源实现用 `HeadlessTerminal` 实现与生产相同的 pi-tui `Terminal` 接口，把每次 ANSI 写入交给固定版本 `@xterm/headless`，读取状态前等待同步帧稳定。

**前置条件**
- 有一个能解析生产 ANSI 的 headless 模拟器。
- 能驱动生产 TUI 组合并收集写入。
- 有稳定的语义投影格式和评审流程。

**步骤**
1. 驱动生产组合，收集 ANSI 写入。
2. 等待帧静默；流式检查点冻结 loader interval，但允许跨一次动画 tick 的真实时间流逝，以固定语义状态而非调度器选中的 spinner 字形。
3. 投影终端尺寸、活动缓冲与视口坐标、生命周期与光标状态、各行、换行标记、非默认样式区间为文本；文本与样式分开。
4. 滚动较多的卡片捕获已使用缓冲，浮层捕获可见视口。
5. 每个检查点强制主题无关：禁止 RGB、禁止 ANSI 0–15 之外的调色板项、禁止显式背景；选择行可用终端默认色的反显。
6. 用封闭清单拒绝缺失场景、缺失检查点、遗留预期文件。

**责任者**：包测试所有者维护模拟器与投影；评审者阅读单元格与样式 diff；部署所有者负责 PTY smoke 与组装产品覆盖。

**完成信号**：呈现回归产生可读的单元格/样式 diff；主题检查通过；清单完整。

**失败处理**：raw 写入会因差分渲染改变边界而误报；组件行漏掉 ANSI 解析、光标、浮层、重排；栅格截图带入字体/平台噪声。只在完成后的会话事件上手工追加流程会与真实 loop/工具执行漂移。

**例外**：瞬态状态可直接编写；已完成的完整流程必须由组装部署测试覆盖，包测试不得声称产品覆盖；PTY 测试保留真实 Loader/输入/teardown 边界，但不替代广泛状态覆盖。

**证据边界**：模拟器使用 xterm 的 proposed buffer API，升级必须重跑并评审投影；终端特有行为仍需部署方 PTY smoke；固定尺寸会有意编码换行与视口行为。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-18-tui-terminal-state-snapshots.md:1-62@687f282e`。

### 2.6 模型可见表面 {#proc-modelsurface}

`[源义务]` 功能工具断言证明工具执行了，但不证明模型实际收到了 system 段、tool schema 或 user context。源实现用最小 profile 记录 `minimal/model-visible.json`：对每个模型请求保存逐字 tool schema 与有序 message list；system 与 user 消息保留全文，只对临时目录做 token；assistant 与 tool 消息只保留调用身份，因为 PTY/FS 文本跨回放平台不同；profile 省略动态 runtime context，因此每条发出的消息都可比较。

**前置条件**
- 能在真实 adapter/proxy 处捕获请求而不改写请求。
- 有一个可抑制动态上下文的 minimal profile。

**步骤**
1. 启动 shipped profile。
2. 捕获每个请求的 tool schema 序列与有序消息列表。
3. 对易变路径做 token，省略动态 runtime context。
4. 写 `minimal/model-visible.json`；按完整目录与文件集比较，不取子集。
5. 变更后刷新并评审完整 diff。

**责任者**：runtime/profile 所有者定义可见表面；测试作者录制并评审；评审者确认请求就是发布形态。

**完成信号**：组合后的 system prompt 与工具目录在一个可评审 artifact 中；schema 变化产生结构化 diff。

**失败处理**：只断言工具执行会漏掉“模型没被告知”；只取子集会漏掉新增/删除消息；动态上下文会使比较不可能。

**例外**：assistant/tool 文本有意只留调用身份；故意变化动态上下文的场景不能用 minimal profile。

**证据边界**：minimal profile 不证明动态 runtime-context 注入；平台特有文本不比较；artifact 完整度取决于捕获点。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-08-13-python-minimal-model-visible-snapshot.md:1-32@687f282e`。

### 2.7 脱敏固定点 {#proc-redaction}

`[源义务]` 大提示词或 schema 在每个 JSONL 中重复时，一次编辑会改写几十条巨型单行记录。源实现把内容分类 token 化：`session.jsonl` 保留 config、reason、模型可见前缀，把 `header.system`/`header.tools` 存为 `"{{system}}"`/`"{{tools}}"`；每组请求头组合类别恰好一个 `pinsHeader` 场景，把完整 prompt 序列写入 `system-prompt.expected.md`、完整 schema 序列写入 `tool-schemas.expected.json`。

**前置条件**
- 有纯 scrubber（只依赖输入，不依赖外部状态）。
- record/refresh 与 compare 共享同一 normalizer。
- 有 sidecar 生成器与文件对称性守卫。

**步骤**
1. 分类要 token 化的内容：system prompt、tool schemas、session prefix。
2. 实现独立与组合 scrubber；组合 scrubber 还 token 化非 pin 场景的 prefix，但保留请求头数量、字段存在性、config、reason 与前缀消息数。
3. 每个 `session*.jsonl` 必须是 prompt/schema scrubber 的固定点；只有非 pin fixture 必须是 full-header scrubber 的固定点。
4. 两个 sidecar 从规范化的 live 完整请求头序列重新生成；record/refresh 写入前应用清理。
5. 存储 token 诚实表示该 JSONL 没有 pin 什么；不要留下陈旧重复内容。

**责任者**：fixture 所有者定义 scrubber 与 sidecar；record/refresh 路径负责写入前清理；评审者阅读 Markdown/JSON diff。

**完成信号**：system prompt 变化只在每个受影响组合类别产生一个行导向 Markdown diff；tool 描述变化只产生结构化 JSON diff；普通 fixture 不动。

**失败处理**：绕过 scrubber 的写入会在下一次固定点检查中失败；陈旧 sidecar 被 orphan/symmetry 守卫拒绝。

**例外**：live 产品日志必须保持逐 bit 可重建，测试产物才脱敏；真正不同的组合类别各自拥有 pin，相同类别由一致性守卫捕获。

**证据边界**：scrubber 过宽会隐藏有意义差异；token 化后的 fixture 不再是逐字节有效的生产日志，消费方必须使用匹配 parser；守卫证明声明固定点，不证明 scrubber 语义完备。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-08-24-session-log-snapshot-corpus.md:1-78@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-06-20-remove-redundant-snapshot-log-expected-output.md:1-38@687f282e`。

### 2.8 封闭清单与 envelope 投影 {#proc-inventory}

`[源义务]` 每个场景的必需文件由封闭清单管理：拒绝缺失场景、缺失检查点、缺失必需文件、遗留预期文件；override sidecar 与会话日志必须互相一致；每类恰好一个 pin。提交的快照还投影掉非行为 envelope 字段：正文记录去掉 `seq`、`time`、`seq0`、`time0`，但保留每条正文记录的判别字段、payload 与其他顶层字段；嵌套 payload 中同名字段不变；第一条 `session` header 不投影。

**前置条件**
- 每个场景类型有必需文件表。
- snapshot writer 能在写入每行前从已解析对象省略声明键。
- replay parser 能在解码时为缺失序号赋值。

**步骤**
1. 写 required-file 表，包括可选的 override 文件。
2. writer 序列化时省略投影键；reader 使用 `parseSessionLog` 并在解码时补序号；synthetic 事件时间从零开始，打包行的 `data.dt` 保留相对间隔。
3. 运行 orphan、missing-file、symmetry、single-pin、scrubber 固定点检查。
4. 迁移时通过投影重写已提交 fixture，防止旧录制重新引入字段。

**责任者**：fixture 所有者维护表与守卫；writer 在自身文件边界应用投影；parser 所有者接受投影形态；评审者阅读缩减后的 diff。

**完成信号**：新增/删除/移动事件不再改写后续每条记录的 envelope；payload 与 header 变化仍可见。

**失败处理**：重复 pin、缺文件、孤儿、未 token 化头部都会被 meta-test 拒绝；陈旧 sidecar 不得被静默忽略。

**例外**：仓库 fixture 布局检查使用 replay parser 并保留规范打包行；运行时持久化格式不变，只有快照表示被投影。

**证据边界**：守卫证明文件集与固定点，不证明语义正确；投影文件不是逐字节有效生产日志；按事件类型写投影规则成本高，源实现选择不改 payload 引用。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-06-19-acp-snapshot-tests.md:1-87@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-08-18-session-snapshot-envelope-projection.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-04-hook-snapshot-matrix.md:27-33@687f282e`。

### 2.9 浏览器组装通道 {#proc-browser}

`[源义务]` 无密钥 Web 浏览器 lane 通过 `dsh-llm-replay` 回放 fixture，驱动真实 in-process web 组合：Chromium 跑完整套件，WebKit 只覆盖模型/推理强度选择器需要的原生鼠标焦点行为。`launchWebScaffold` 通过 Loader include 加载 shipped `cordis.yml`/web 配置，patch 临时持久化根、三个 skill 根（固定并关闭 watching）、agent instructions、session-title-llm 等测试专属项；浏览器驱动代码不能诚实地维持 per-file 100%，因此门禁逻辑放进受门禁的包。

**前置条件**
- 能构建并服务 `apps/web/dist` 与包 `lib/`。
- 有真实 Host、HTTP JSON-RPC/SSE 与浏览器自动化运行时。
- 有规范化 aria/语义树的 golden 与 worker 预算。

**步骤**
1. 用 shipped 配置启动组合，patch 仅限测试根与关闭 watch。
2. 回放模型脚本，驱动真实浏览器。
3. 等待语义表面稳定；规范化易变值；与已提交 golden 比较。
4. 状态会修改构建产物的场景（如 `hmr-live.e2e.ts`）单独串行运行，其余进入有界 worker 池。
5. 在必需 PR job 中显式注入 replay 模式；PR 只跑 Linux 消费方 job。

**反假绿与屏障**：轮次完成只认 Host 的 idle 信号（在持久化落盘之后）加语义表面安定；单独的 `turn/end`、轮询持久化文件、`networkidle` 都不是完成屏障。任何 pageerror 或连接丢失/间隙修复控制台警告都直接失败；teardown 断言每个回放脚本与游标都被消费，未耗尽即失败。车道不设 vitest retry；每场景一个 browser 与 host、fresh context、固定 viewport、语义选择器与显式 locale。

**责任者**：web lane 所有者维护 scaffold、fixture 与 normalizer；场景作者录制并评审；CI 以 replay 模式和显式 worker 预算运行。

**完成信号**：无密钥回放通过真实 wire 与真实 bundle 组装，渲染出已提交语义树。

**失败处理**：独立 client fixture 可能在 Host wire 损坏时仍绿；jsdom 不覆盖 HTTP/SSE 承载与真实插件包组合；worker 预算变化必须用完整端到端测量，不能用运行中耗时猜测。

**例外**：第二引擎只覆盖其独有行为；纯服务端或纯函数问题放低层测试。

**证据边界**：门禁不声称跨平台浏览器一致；Playwright/浏览器升级改变 ARIA 格式时必须显式 refresh 并评审 churn；HMR 不能在并行池内运行；回放的首次调用顺序绑定使每个场景至多一个发起提示的会话，共享游标仅在发布的目录窗口下保持闲置。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-98@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-30-web-browser-snapshot-ci-gate.md:1-40@687f282e`。

### 2.10 安装产物入口与更新资格 {#proc-installed}

`[源义务]` 源码测试可能通过 fake peer 而打包产物已坏。必需 workflow 先构建 SDK wheel 与每个平台 runtime wheel，再把两个本地产物安装进新的 Python 3.10 venv；切换到仓库外目录，清空 `PYTHONPATH` 与 `DSH_RUNTIME_MODE`，只调用公共模块与打包可执行文件。黑盒 harness 拒绝非 venv 进程、仓库相对 cwd、源码/editable 导入与不相等版本。

**前置条件**
- 有一个先构建、后安装的 CI job。
- 有干净 venv/容器与每个目标平台的产物。
- 有更新器/安装器的真实 coordinator 与 loopback 服务能力。

**步骤**
1. 构建 SDK 与各平台 runtime 分发物。
2. 为每个 native target 建新 venv，安装两个本地文件。
3. 移出仓库，清除源码解析变量。
4. 导入公共模块并运行打包入口。
5. 断言 SDK/runtime 版本一致，拒绝任何源码导入。
6. 更新资格：准备两个递增版本（共享 app identity，测试专用 manifest 使用随机身份与 distribution namespace），复制已校验 runtime，只改 release-family 版本与匹配依赖；封存并校验 inventory；不覆盖既有输出；失败复制保留失败记录且不能生成完成 receipt。
7. 在真实 Electron 中运行生产 update coordinator（真实 HTTP executor 与 updater），用隔离 app adapter、loopback server 提供 feed/policy/inert bytes；安装器/浏览器/剪贴板替换为观察；每次调用原子分配临时目录与 OS 端口，用请求屏障而非 sleep。

**责任者**：打包/发布所有者生产产物并准备材料；CI 建干净环境并运行黑盒；资格工程师运行更新 walkthrough。

**完成信号**：干净环境导入安装 SDK 并运行打包入口；安装应用启动、从 loopback feed 更新并保持身份；journal/receipt 与安装状态一致。

**失败处理**：源码/editable 导入、仓库 cwd、版本不一致、缺失平台产物都失败；复制成功但无签名安装器、身份不匹配、inventory 缺失都失败。

**例外**：开发套件可继续用源码导入做快速反馈，但不能替代安装门禁；私有 fixture 可省略 publisher verification，但绝不能出现在生产配置；没有分发物的平台不得被声称覆盖。

**证据边界**：门禁只覆盖它实际调用的平台与入口；干净环境不证明所有可选集成；更新资格在源中主要是 Windows 路径，其他平台需自己的证据。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-08-23-installed-python-wheel-black-box-ci.md:1-51@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-14-desktop-installed-update-materials.md:1-49@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-10-desktop-local-updater-qualification.md:1-51@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-08-12-required-python-runtime-pull-request-ci.md:1-32@687f282e`。

#### 更新生命周期资格 {#proc-update}

`[源义务]` 已安装更新需要两个递增版本与共享 app identity。测试专用 manifest 使用随机身份与 distribution namespace；复制已校验 runtime 到派生版本，只改 release-family 版本与匹配依赖；封存并校验 inventory；原始 source 重新校验且 descriptor hash 不变；不覆盖既有输出；失败复制保留 failure record 且不能创建 completion receipt。生成的 bootstrap 在 import 生产 main 前校验安装包身份。

**完成信号**：安装应用启动、通过 loopback feed 完成更新、保持身份；journal 记录更新且 receipt 与安装状态一致。

**失败处理**：复制成功但无签名安装器、身份不匹配、inventory 缺失、失败却生成 receipt，全部失败。

**例外**：私有 fixture 配置可省略 publisher verification，但绝不能进入生产；其他平台需要自己的资格路径。

**证据边界**：源资格主要是 Windows/Electron 路径；一次 loopback 更新不证明生产 feed、签名链或所有平台。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-09-14-desktop-installed-update-materials.md:1-49@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-10-desktop-local-updater-qualification.md:1-51@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-14-desktop-installed-update-journal.md:1-29@687f282e`。

### 2.11 真实组装与边界 mock {#proc-assembly}

`[源义务]` 手搭 bench（裸 context、stand-in、slot 声明）断言的是 bench，不是产品；可编程 Remote fake 重新实现 Gateway 语义（follow-stream opening snapshots、page cuts、pumps、envelope），还可能允许真实系统禁止的 unary reject。源实现把组装层放进 `dsh-client-test-runtime` 的 `src/assembly`，用 `dsh-remote-mock` 按 endpoint name 回答；roster 从 bundle 读取（include 自己的 `entryListSchema`/`applyEntryPatches`），过滤 `dsh.client.platform: web`，携带 `inject`/`immediately`；`webApp` 在 import 时计算，用 closure/pick/without；不 import Host、不动态 import，只为 `fs` 用 node types。

**前置条件**
- 存在生产 boot + mount 路径。
- 有一个 contract-shaped 的远端/插件边界，可按 endpoint 回答。
- bundle 能暴露 roster 与 inject metadata。

**步骤**
1. 用生产 boot 路径与一次 connect 启动组装。
2. 从 bundle 读取 roster，按平台过滤并保留 inject 信息。
3. mount client。
4. 远端按 endpoint name 返回契约形状的响应。
5. 通过组装树断言用户可见行为。

**责任者**：client 组装所有者维护 boot/mount；test-runtime 所有者提供真实组装与 endpoint mock；场景作者驱动。

**完成信号**：一个聚焦源码测试启动真实 boot+mount，roster 来自 bundle。

**失败处理**：手搭 context 会漏掉 boot/mount 回归；可编程 fake 允许不可能调用，会掩盖协议回归；边界 mock 若要写传输失败，应注入 narrow writer，而不是改变连接契约。

**例外**：纯 helper 可直接单测；PTY/真实子进程等边界测试保留真实进程。

**证据边界**：组装层本身必须作为产品路径维护，不能变成第二实现；endpoint mock 仍需每个回答形状的契约覆盖；无法 import Host 的测试需要另一条边界。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-06-client-assembly-test-line.md:1-99@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-08-shared-acp-snapshot-package.md:1-41@687f282e`。

#### 边界 mock 的判定 {#proc-boundary}

`[源义务]` mock 只放在最窄的外部边界（socket、HTTP server、model stream、message writer）；shipping adapter、loop、retry、framing 与 parsing 留在测试路径中；不要在测试里重新实现 Gateway 语义。需要制造传输失败时，注入 connection 的 message writer 并传入真实 Node stream 会报告的异步 write callback error，保持真实 child 存活，不触碰平台 pipe 内部。边界 double 只报告事实，不替产品决定 retryability。源实现中 `dsh-llm-mock-server` 的 `random` profile 是可配置压力，不是生产事故频率；`connection_refused` 需要 listener-lifecycle 阶段，因为 bound handler 不能拒绝自己的连接。

**完成信号**：请求数、重试步骤、请求体一致性与失败 chunk 隔离都由真实 stack 断言，而不是由 fake 自己报告。

**失败处理**：in-process adapter mock 绕过 fetch、HTTP status/header、SSE framing、socket termination 与 idle watchdog；generic mock failure 掩盖故障分类；可编程 fake 允许真实系统禁止的 unary reject。

**证据边界**：double 仍需要自己的测试；arrival-ordered 共享 script 会让并发断言含糊；它不证明远程生产行为，只证明它建模的契约。

### 2.12 子进程统一管线 {#proc-subprocess}

`[源义务]` 约十个 e2e/smoke 文件各自重写 spawn、stdout 收集、`setTimeout` 到 `SIGKILL`、`once exit/error` settlement，变体改变 settlement 顺序并泄漏子进程。源实现统一用 Execa；publint 测试直接用 Execa 与 Vitest test-context signal，不再自带独立子进程 timeout，预算由 workflow/coverage 参数所有者负责；每个直接 Node 子进程在创建时立即登记，取消请求 `SIGKILL`，teardown 等待每个自有子进程的 result 与 close 后才移除资源；子 agent teardown 在 lane test budget 内等待 disposal，并在移除私有目录前等待 child 完成。

**前置条件**
- 一个共享 spawn/collect/timeout/kill helper。
- 子进程登记表与取消信号。
- 标准的 CLI 与 env 解析器（如 `node:util parseArgs`、`process.loadEnvFile`）。

**步骤**
1. 用共享 helper 启动，设置预算。
2. 单次结算 exit/error。
3. 超时或失败时终止进程树，并等待结算。
4. 在 teardown 中等待所有自有 child 的 result 与 close。
5. 清理临时目录与 listener。

**责任者**：测试基础设施所有者维护 helper；场景作者使用；CI 依赖有界 teardown。

**完成信号**：所有 spawn 点使用同一 helper；超时测试终止并回收子进程。

**失败处理**：手写 collector 可能在 stdout 关闭时提前 resolve；未等待的 kill 会留下孤儿；teardown 失败必须暴露资源名，不能 retry 掩盖。

**例外**：测试进程生命周期本身可需要直接控制，但仍须恢复与释放；PTY harness 可包装 helper，但 settlement 规则相同。

**证据边界**：helper 不使无界子进程安全，调用方必须设预算；平台特有 tree kill 仍需自己的证据。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-26-execa-for-test-subprocess-plumbing.md:1-38@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-07-publint-test-subprocess-lifetime.md:1-26@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-07-subagent-teardown-test-budgets.md:1-29@687f282e`。

### 2.13 并发隔离 {#proc-isolation}

`[源义务]` 并发 Vitest 文件/worker/gate/job 共享 host 端口、可预测路径、外部 namespace 与继承子进程。进程隔离不隔离这些资源；全局 mutation 与不完整 teardown 会污染后续测试；测试可能单独跑对、整条 lane 错。适用场景：测试/fixture 获取 host 资源、修改进程全局态、依赖异步 readiness、拥有子进程/网络 listener，或出现概率性 CI 失败。

**前置条件**
- 能列出测试拥有的资源与最大并发。
- 有唯一临时目录、OS 分配端口、cleanup registry。
- 能在 workflow/runner 边界设置进程级环境。

**步骤**
1. 建模资源与并发（files/workers/gates/jobs/sibling runners）。
2. 用唯一目录与 OS 端口替换固定值；每个 root 与产生它的 run result 配对，不假设分配顺序。
3. 在 runner/workflow 边界设置环境（如 `TMPDIR=runner.temp` 经 `GITHUB_ENV` 在首个 step 导出），让 Node/Vite/tsx/临时消费者继承。
4. 进程全局态在 finally 中恢复，setup 失败也要恢复。
5. 共享缓存仅在包管理器支持并发访问时保留；容量与残留归运维。
6. 在真实并发拓扑下运行，不只单独运行。

**责任者**：测试作者声明资源与清理；基础设施所有者提供 allocator/guard；CI 运维拥有容量、临时存储与缓存。

**完成信号**：多 worker、共享卷 runner 上通过；每个目录/子进程有单一 cleanup owner。

**失败处理**：固定端口/路径会碰撞；泄漏 child/listener 污染后续测试；共享临时目录耗尽会让无关 PR 在测试开始前失败。

**例外**：包管理器支持并发访问时可保留共享缓存，但容量与残留仍归运维；测试进程全局行为必须恢复且不能与依赖默认值的测试并发。

**证据边界**：进程隔离仍不隔离 host 资源；缓存容量/文件系统故障不是测试能修的；源明确把历史残留与磁盘配置留给运维。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-08-28-ci-test-reliability-skill.md:1-44@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-06-pr-ci-runner-temporary-storage.md:1-52@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-26-web-conversation-clock-fixture-day.md:1-48@687f282e`。

### 2.14 fixture 生命周期 {#proc-lifecycle}

`[源义务]` fixture 在 setup 失败、超时或断言失败时也必须释放。用户 patch 测试即使初始化在进入局部清理块前失败，也会恢复 watcher 工厂并销毁 Context；plugin-install 拦截器在导航前注册并保留到浏览器关闭，每个阶段替换 typed handler，delivery/cancellation barrier 保持顺序；Windows 上 Git 子进程的环境要从自身进程删除索引式命令行配置组（`GIT_CONFIG_COUNT`、`GIT_CONFIG_KEY_n`、`GIT_CONFIG_VALUE_n`），否则清洗逻辑删掉 key 却留下 counter，Git 在打开配置前就以 exit 128 失败；测试结束后还原。

**前置条件**
- cleanup registry 与 setup-failure 路径。
- 可等待的 disposal（child exit、watcher close、目录移除）。
- 需要修改的进程环境有显式隔离/还原函数。

**步骤**
1. 成功获取资源后立即登记 cleanup。
2. setup 用 try/finally 包住，失败也恢复工厂/环境。
3. 超时或断言失败时请求终止，并等待实际结算。
4. 在移除私有目录前等待 disposal 与 child 完成。
5. 失败信息带资源名与预算。

**责任者**：fixture 所有者定义获取与释放；测试作者使用登记 hook；CI 执行 hook/test 预算。

**完成信号**：强制 setup 失败后 watcher 关闭、工厂恢复；teardown 等待 child 完成再删目录。

**失败处理**：只请求 kill 不等待会留孤儿；setup 失败路径会泄漏 watcher/工厂覆盖；teardown 失败不带资源名不可诊断。

**例外**：teardown 延迟测试应断言结算契约，而不是竞争某一方获胜；真实后代树 kill 使用平台机制，失败仍是失败。

**证据边界**：cleanup 断言在严重争抢的 host 上仍可能超时，提高 hook 预算是另一个决策；有些资源账号无权删除；机制不修容量或文件系统故障。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-09-user-patch-hmr-test-delivery.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-27-plugin-install-interceptor-lifetime.md:1-36@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-plugin-manager-git-child-environment.md:1-29@687f282e`。

### 2.15 确定性屏障 {#proc-determinism}

`[源义务]` 用 sleep 近似 readiness 会在快 host 通过、慢 host 失败；永久冻结的浏览器时钟会让“读两次 `Date.now()` 计算保持时长”的产品逻辑永远等不到保持结束；断言瞬时 DOM 会捕获错误状态。源实现用 `pinHostClock()`（从锚点起按真实流逝时间推进的 `Date.now` spy）与 `pinBrowserClock(page)`（按固定间隔从锚点重新施加同一冻结时刻），因为产品会在 `PROCESS_TITLE_MINIMUM_MS = 150` 与输入框 `compositionend` 后 10ms 合成守卫中读取两次时间；`remaining = Date.now() - previousReading` 在永久冻结时钟下永不推进。

**前置条件**
- 有事件驱动的 wait/barrier。
- 页面/进程时钟可控，且不会改变产品交互语义。
- 有稳定的语义状态可断言。

**步骤**
1. 识别真正完成信号。
2. 暴露 barrier 或 awaited event；能不用 fake timer 就不用。
3. 若产品读两次时间，使用“锚点 + 真实流逝”的时钟，不要永久冻结。
4. 渲染器等待帧静默；只断言稳定语义状态。
5. 删除固定 settling delay。

**责任者**：fixture 作者提供 barrier/clock；场景作者在 barrier 后断言；评审者拒绝 sleep 同步。

**完成信号**：同一场景在不同 host 速度下渲染同一语义状态；两次读取的保持逻辑仍会结束。

**失败处理**：sleep 会 flake；永久冻结会让 settled 文案永不出现；瞬时断言会捕获过渡态。

**例外**：测试 timer 服务本身时可用 fake timer；有意记录带日期/状态形式的 golden 是真实断言，不要在 normalizer 中折叠。

**证据边界**：产品不暴露的 barrier 可能需要受控测试 seam；clock 注入会改变时序敏感行为，优先事件等待；静默不证明语义正确。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-26-web-conversation-clock-fixture-day.md:1-48@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-98@687f282e`。

### 2.16 观察已观察状态 {#proc-observe}

`[源义务]` golden 记录的 hover、focus、后续 Host 读取等状态必须由捕获自己确立，不能继承环境。源修复三类缺陷：折叠场景在侧栏捕获前 hover Workspace 行、在 first-batch 捕获前 hover 该批次第一行；turn-tail 先按一个不移动焦点的键清除 pointer-input flag，再聚焦 Copy 并等待 running golden 记录的 tooltip；install-cancel 改为轮询 `data-plugin-status`，因为 highlight 先于 directory reload 提交，三次本地运行中状态在 highlight 后 61ms 才从 `disabled` 变为 `running`。`captureStableAria` 已经等待连续两次快照相等，但错误状态同样能满足它，因此稳定性不是正确性。

电子表格场景追加第四类缺陷：对初始状态的点击在 commit 前就已满足轮询。点击 `A1` 与 workbook 初始选择相同，`SheetOverlay` 的 updater 用按下时的 `getBoundingClientRect` 与 page 坐标解析 cell，React 在 render 中重执行该 updater；重排后 `B1` 成为 committed selection，但轮询只看到 click 前的 `A1`。修复不是等待渲染器 idle，而是先聚焦 overlay 并用 `ArrowRight`/`ArrowLeft` 在重排前建立 `B1` 再回到 `A1`：键盘路径从 committed selection 计算，重执行不改变结果，且 `B1` 与初始选择不同，使交互可观察。指针点击仍可用，条件是目标不同于当前选择且效果在布局变化前断言，或重执行到新布局可证明解析同一 cell。

**前置条件**
- golden 明确记录的是哪个状态。
- fixture 能执行 hover/focus、清除输入模态、轮询值或控制事件投递。
- 有独立来源的 token（如从另一个元素读警告色）。

**步骤**
1. 写下 golden 代表的状态。
2. 捕获前执行输入或等待精确发布值。
3. 轮询 computed 值到独立 token，而不是只检查存在。
4. 原生事件无法保证时，用受控 watcher 投递 add/change/unlink；原生投递由独立测试覆盖。
5. 绝不用更长 timeout 替代缺失的观察。

**责任者**：场景作者命名并确立输入状态；fixture 所有者提供受控投递与精确观察；评审者检查断言拥有前置条件。

**完成信号**：三个浏览器场景无论 harness 以何种状态进入，都渲染 golden 记录的 aria；连接测试轮询计算颜色到独立 token。

**失败处理**：单次采样落在 transition 窗口会读旧值；稳定快照的错误状态会通过稳定检查却 golden 失败；从未发出的事件无论等多久都不会到达。

**例外**：真实 OS 投递保证属于专门原生测试；超时测试仍需有界预算，预算是预算，不是投递证据。

**证据边界**：轮询仍可能在产品从不发布值时超时；受控 watcher 不测原生投递；transition 结束后仍需用 computed 值确认。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-27-web-lane-assertions-name-their-input-state.md:1-52@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-09-user-patch-hmr-test-delivery.md:1-28@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-12-connection-and-compaction-fixture-preconditions.md:1-28@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-spreadsheet-selection-by-keyboard-before-reflow.md:1-37@687f282e`。

### 2.17 完成信号归属 {#proc-completion}

`[源义务]` HTTP 202、投影 UI、进程启动、durable completion 是不同观察。源测试在 HTTP 202 后 hold 住真实 Workspace 创建，先断言 Agent 与 model request 都不存在，再释放并等待匹配 Session 的 `turn/end`；PowerShell 测试接受任一受支持 readiness tier，拒绝 timeout 与 exit settlement，并在 scrollback 中观察格式化 child 输出以证明 env persistence/cwd/credential scrubbing；ACP 覆盖测试在 transport failure 后不能只等 registry 消失，因为 disconnect cleanup 包含 cancellation、drain、persistence 与 owner disposal；worker-runtime 的慢绑定预算把 worker init 计入 active、delayed binding 计入 idle。

**前置条件**
- 能识别操作的 owning signal（durable log、journal、child exit、scrollback）。
- 有 barrier 能 hold 中间阶段。
- cleanup 在 timeout 时仍会释放 barrier、恢复方法、移除 listener。

**步骤**
1. 映射阶段：acceptance、projection、durable completion。
2. 选择能证明断言的 owning signal。
3. hold 前阶段并断言后阶段 artifact 不存在。
4. 释放并等待 owning signal。
5. finally 清理。

**责任者**：fixture 作者暴露信号与 barrier；测试作者只断言 owning signal；CI 提供有界等待预算。

**完成信号**：HTTP 测试确实等到匹配 turn end；PowerShell 观察到真实 child 输出而非 echoed 命令。

**失败处理**：202 后 1s poll 会在慢但成功的创建上失败；启动 marker 不证明命令执行；termination request 不证明进程树退出。

**例外**：测延迟本身可以测前缀，但必须写明；协议定义的 inferred-idle 是可接受 tier，timeout settlement 不是；teardown 必须等待 disposal 与 child completion。

**证据边界**：并非每个操作都有 durable signal，此时必须声明有界推断；readiness tier 可能宽于单一精确状态；真实进程退出仍可能留下 namespace 外副作用。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-08-ci-readiness-and-completion.md:1-46@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-08-ci-completion-observations.md:1-46@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-07-pwsh-ci-observable-completion.md:1-28@687f282e`。

### 2.18 预算归属 {#proc-budget}

`[源义务]` `describe` 层 timeout 会覆盖 lane 传入的 `--testTimeout`：`translation-pairing-merge` 的 23 个用例全部继承 15s，而 Windows coverage lane 已给 90s；`install-lefthook` 的 30s describe 值还被复制成五个用例的常量。`coverageTestTimeoutArgs` 抬高了 `--testTimeout` 与 `--expect.poll.timeout`，却把 `--hookTimeout` 留在 Vitest 默认 10s，而 `removeFixtureSafely` 会在注释写明的 10s 窗口内重试 Windows 句柄释放，于是 setup/teardown 撞上 hook 默认值。源决策：套件取 `{ timeout: 90_000 }`，删除重复的 per-case 常量，`coverageTestTimeoutArgs` 同时发出 `--hookTimeout`；一个环境变量管一份预算，覆盖 case 与 setup/teardown。

**前置条件**
- 一个 lane 级环境变量（源：`DSH_COVERAGE_TEST_TIMEOUT_MS`）。
- 覆盖参数构造器与 workflow 赋值。
- 知道套件是受断言约束还是受进程创建约束。

**步骤**
1. 在空闲 host 测最慢用例，理解余量。
2. 套件值对齐 lane test budget。
3. 删除仅重述 describe 值的 per-case 常量。
4. 从同一变量发出 hook timeout、test timeout 与 poll timeout。
5. 在争抢 lane 上运行，确认失败从预算变为真实断言。

**责任者**：测试所有者选套件预算；lane 所有者设环境值；CI 运维拥有 host 容量。

**完成信号**：进程创建受限套件不再因预算失败；慢 fixture teardown 不再让全绿用例失败。

**失败处理**：低于 lane cap 的 describe 值会静默压低预算；缺 hook timeout 会在 teardown 复现失败；retry 会掩盖真实回归或容量问题。

**例外**：真正测延迟契约的测试可带更小显式预算并说明原因；在没有全局 testTimeout 的配置下（plain `pnpm test`、darwin parity），每个 spawn 用例可能需要显式携带 lane 同值预算——`oxlint-contract-spawn-case-budgets` 就是这种例外，因为该文件在多种 lane 下运行且根配置无默认值。未设置该变量的 lane 保留全部 Vitest 默认值。

**证据边界**：更宽预算会接受从几百毫秒退化到几十秒的真实变慢；它不让 host 变快，也不修容量；冷启动成本可能超出任何合理预算，需要单独观察。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-08-27-translation-pairing-merge-budget.md:1-32@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-08-29-windows-lane-hook-and-lefthook-budget.md:1-36@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-27-oxlint-contract-spawn-case-budgets.md:1-28@687f282e`。

### 2.19 平台中立 fixture {#proc-platform}

`[源义务]` 单元与覆盖率套件在 Windows/macOS/Linux 运行，但平台无关行为可能被平台特有 fixture 掩盖：字面 POSIX 路径在 Windows 变成 drive-relative；hosted `file:` URI 可能是合法 UNC；child-pipe 关闭或 event-loop 调度在不同 host 不同；FIFO、可执行位、目录搜索位没有直接 Windows fixture。源决策：用 host 的 `node:path`/`node:url` 构造绝对路径与 `file:` URI，断言原生绝对输出或稳定 workspace 相对输出；无效 URI 用所有平台都会被 `fileURLToPath()` 拒绝的编码；传输失败注入 connection message writer，传入真实 Node stream 会报告的异步 write callback error，保持真实 child 存活；语言服务器 teardown 在 POSIX 用负 process-group id，在 Windows 用同步 `taskkill /T /F`，只忽略 already-absent-tree 状态，其他失败仍是 teardown 失败；只对真正 POSIX-only 的单用例做窄 Windows 排除，并保留相邻跨平台断言；受支持 Windows 路径仍在 per-file coverage gate 内。

**前置条件**
- 支持平台矩阵与在每台 host 运行同一语义测试的能力。
- 有 writer 注入点与平台 tree-kill 机制。

**步骤**
1. 用 host API 替换字面路径/URI。
2. 断言契约要求的输出形态。
3. 传输失败走 writer callback 注入。
4. 进程树用平台机制终止，真实失败上抛。
5. 只排除不可能状态的单用例，补相邻断言。

**责任者**：测试作者选择原生构造；fixture 所有者提供 writer/tree-kill helper；评审者拒绝宽泛排除。

**完成信号**：同一语义测试在三平台通过；传输失败测试保持真实 child 并区分 failure 与 exit。

**失败处理**：字面 POSIX 路径在 Windows 失败或断言错误；pipe 内部 hack 测试未文档化机制；整文件排除隐藏受支持行为。

**例外**：真正 POSIX-only 的原语可排除单个 Windows case；Windows teardown 可在 graceful shutdown 失败后依赖 `taskkill`。

**证据边界**：原生期望路径必须从共享常量派生；平台-only 排除需要相邻跨平台断言才诚实；Windows tree kill 依赖 host 命令，失败仍可见。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-22-cross-platform-test-fixtures.md:1-34@687f282e`。

### 2.20 负向对照与阈值校准 {#proc-controls}

`[源义务]` 一个新 guard 只有先被证明会失败才可信。源实践用负向对照复现记录到的失败签名，再用正向对照证明修复：折叠场景改为 hover New Session 行而非 Workspace 行时，`sidebar.expected.md` 以缺失 actions 文本失败；turn-tail 只做裸鼠标按下、不按键时，running 捕获缺少 `tooltip "Copy"`；时钟场景只固定一个时钟时，`steering` 以 `9/26 {{clock}}` 失败，`message-actions` 以日期前缀加 `now` 替代 `1min` 失败；性能预算先测端点与基线，再以 1.25x 余量设阈值；凭据匹配同时包含匹配与不匹配输入；更新器资格用失败复制必须留失败记录来证明 receipt 不会被伪造。

**前置条件**
- 能运行 pre-fix 状态或构造错误输入。
- 能记录失败签名、速率与运行环境。
- 阈值有端点测量与余量。

**步骤**
1. 写下观察到的失败签名。
2. 用错误输入或 pre-fix fixture 复现；确认断言因该原因失败。
3. 应用修复或 fixture 变更。
4. 确认同一断言通过。
5. 记录本地/CI 运行与速率；必要时在真实拓扑重复。
6. 阈值变更同时给出正、负控制。

**责任者**：测试作者构建对照；评审者确认对照匹配记录签名；性能所有者校准阈值。

**完成信号**：负向对照以记录签名失败，正向对照通过；阈值有测量依据。

**失败处理**：从未失败的测试可能在断言恒真或 fixture 无法到达分支；无测量的阈值可能接受回归或误报噪声。

**例外**：纯结构断言可不需运行时负控制，但仍需一个违反结构的 case；提案机制没有已执行对照，必须标 proposed。

**证据边界**：负向对照可能太人工而漏掉真实失败模式；本地速率不是 CI 速率；对照证明能失败，不证明覆盖所有失败。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-27-web-lane-assertions-name-their-input-state.md:1-52@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-26-web-conversation-clock-fixture-day.md:1-48@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:1-125@687f282e`。

### 2.21 会咬人的 tripwire {#proc-tripwire}

`[源义务]` guard 必须能产生可区分失败。hook 矩阵为每个有确定性 transcript 足迹的 hook point 建 `hook-<dialect>-<point>-<outcome>` 场景；`SessionStart`/`SubagentStart` 的注入是 detached、无 turn binding 的 `void runPoint(...).then(agent.inject())`，`context/message` 会与它应先于的工作竞速，记录的预期输出在自己的 replay 中 10/10 次失败，因此不纳入快照，留在单元覆盖；`SubagentStop` 只观察、不写 transcript，预期输出会与无 hook 运行字节相同，永远无法证明失败，因此也不纳入。harness 对“活跃会话数多于录制脚本数”明确报错，绝不静默错路由。

**前置条件**
- 能判断 guard 是否改变 transcript/输出/状态。
- 有 fail-loud 的 cardinality 检查。
- 能移除或篡改被 guard 的行为做红→绿验证。

**步骤**
1. 检查被 guard 行为是否有可观察足迹。
2. 若没有，留在低层测试并记录排除理由。
3. 若有，移除/篡改行为，确认场景变红。
4. 对 harness 基数做 live vs recorded 比较，超额即错误。
5. 恢复行为，确认变绿。

**责任者**：harness 所有者实现 fail-loud；场景作者证明会咬；评审者拒绝无可观察足迹的 guard。

**完成信号**：篡改 hook 配置输出会在 replay 中变红，因为 hook 进程在 replay 时真实运行（只有模型被重放）；移除 `slice(seedLength)` 会让两个 fork 场景都红。

**失败处理**：静默 fallback 会把子会话错路由到父脚本；observe-only 预期输出等于无 hook 运行；只检查存在性的 guard 可能在错误值上通过。

**例外**：observe-only 的 hook point 可留在单元覆盖并直接断言调用；非确定性注入点不得录成稳定 golden，10/10 replay 不稳定检查可作为排除依据。

**证据边界**：guard 可能因错误原因变红，必须配签名检查；有些真实行为没有确定性 transcript，无法端到端守护；fail-loud 会在新场景录制前阻塞它。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-04-hook-snapshot-matrix.md:1-53@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-06-22-fork-child-replay-seed-boundary.md:1-45@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-06-22-fork-snapshot-scenarios.md:1-32@687f282e`。

### 2.22 属性不变式 {#proc-property}

`[源义务]` 每个协议形态包有一个 `fast-check` 驱动的 `tests/properties.spec.ts`，生成器偏向逼真但对抗性的输入（小索引池、短字符串、畸形形状），`numRuns` 控制在本地套件远低于约 10 秒，失败打印可复现 seed。`BlockAssembler` 的任意 chunk 流不变式包括：`blocks()` 计数 ≤ 已见不同索引数；重组幂等；不抛异常且只产出合法内容块标签；`finish` 反映最后一个 finish，缺省 `{kind:'stop'}`。`dsh-session`：`deriveMessages` 确定性、从 seed 回放一致、seq 严格单调、非消息事件不影响推导历史、推导内容与日志解耦。`dsh-tools`：JSON Schema `required` 等于每层 `required:true` 键集、转换对合法声明全函数、与 `validateArgs` 组合时满足 spec 的参数通过而定向破坏被拒绝。`dsh-agent-loop`：任意 send 调度对永不耗尽 adapter，以 `agent/status` settle 驱动而非 sleep；无消息丢失、轮次严格递增、状态转换在合法状态机。

**前置条件**
- 有一个属性测试库。
- 有可执行的 invariant 和确定性驱动信号。
- 属性套件运行时间可接受。

**步骤**
1. 为协议输入写生成器。
2. 把 invariant 写成可执行断言。
3. 以有界 `numRuns` 运行，失败打印 seed。
4. 最小化失败并加聚焦回归用例。
5. 让异步属性以事件/状态 settle，而不是 sleep。
6. 保持在普通测试 lane；高迭代夜间 job 是可选、独立的。

**责任者**：包所有者声明 invariant 与生成器；测试作者添加套件；评审者检查生成器能到达对抗形状。

**完成信号**：BlockAssembler 属性首次运行发现同一索引重复 `block-end` 改写已完成块的真实 bug；修复采用 first-close-wins 并加专用回归；session/schema 属性断言确定性、单调性与全函数性。

**失败处理**：只生成合法形状会漏掉畸形交错；属性 flake 说明真实竞态或 invariant 无效，retry 会掩盖；`numRuns` 过大会拖慢默认 lane。

**例外**：没有有意义 invariant 的操作不适合属性测试；源中夜间 100x job 未交付；变异测试只是提案，不是现行机制。

**证据边界**：生成器质量是价值杠杆，弱生成器给假信心；属性测试不替代固定分支的示例测试；变异测试与 nightly race stress 未实现，不能声称。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-06-11-property-based-testing.md:1-30@687f282e`、`deepseek-harness/.agents/notes/proposed/testing/2026-06-11-mutation-testing.md:1-36@687f282e`、`deepseek-harness/.agents/notes/proposed/testing/2026-06-11-deterministic-and-stress-testing.md:1-35@687f282e`。

### 2.23 防假绿预检 {#proc-preflight}

`[源义务]` 必需 lane 在缺 secret、缺浏览器、缺 runner 能力或缺运行时版本时必须大声失败，不能让 suite 自行 skip 后仍显示绿色。源实现把真实 API e2e 放进独立 `e2e.yml`，preflight 把缺失 secret 转为 loud failure；Node 兼容性汇总在每条声明支持的版本线上跑专用 jsdom smoke，同时断言条件 worker 参数与可用存储；Windows 文件夹对话框冒烟通过 PowerShell 探测 `CoCreateInstance(CLSID_FileOpenDialog)`，回答 `CLASS_E_CLASSNOTAVAILABLE (0x80040111)` 时跑 clean-rejection case 并跳过 real-dialog case，完全无法探测则保留 win32 假设。

**前置条件**
- 能区分必需门禁与可选记录/诊断 lane。
- 有 secret/能力探测与 per-runtime smoke。
- 能接受 skip 的 lane 与不能接受 skip 的 lane 分开。

**步骤**
1. 识别前置条件（secret、浏览器、系统库、运行时 flag）。
2. 把依赖套件移到具备该条件的 workflow。
3. 加 preflight，缺失即失败。
4. 对兼容矩阵每行加聚焦 smoke。
5. 对 host 能力做真实探测并选择干净 fallback case。
6. 记录 lane 未覆盖的平台。

**责任者**：CI 所有者分离 workflow 与 preflight；测试作者提供能力探测；评审者确认 skip 不能满足必需 verdict。

**完成信号**：缺 secret 的 keyed workflow 明确失败；每条 Node 线都跑 jsdom smoke；能力拒绝只选择对应 fallback。

**失败处理**：keyless self-skip 会假绿；单 runtime 绿会让其他声明线未验证；只按平台名分支可能跑错 containment case。

**例外**：record workflow 无 key 可 self-skip，因为它不是必需门禁；能力拒绝可跳过 real-dialog case 并保留文件覆盖。

**证据边界**：preflight 只证明前置条件，不证明每个测试结果；无法运行的探测保留保守假设；门禁仍不覆盖未 provision 的平台。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md:1-100@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-30-vitest-jsdom-webstorage-ownership.md:1-27@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-10-hosted-image-test-assumptions.md:1-42@687f282e`。

### 2.24 带密钥真实 API 门禁 {#proc-secret}

`[源义务]` 策略曾依赖真实 API 测试，但默认 `ci.yml` 对 fork 无 key，`test:e2e` 无 key 会 self-skip；把它加进 `ci.yml` 会在未执行时报告绿色。源决策：单独 `e2e.yml`，只跑 `test:e2e`，使用 repository secret，只接受 trusted events；触发器包括 `workflow_dispatch`、push main/master、nightly schedule，以及每个 trusted PR；运行每个匹配的 `*.e2e.ts`。成本不是约束，可靠性才是。`ci.yml` 保持 keyless/forkable/always-green；secret 消费 job 不与 always-green gate 耦合。缺少 secret 由 preflight 转为 loud failure。

**前置条件**
- 托管平台支持 repository secret 与 trusted event 过滤。
- 有独立的 keyed e2e 命令。
- 有 keyless 门禁与 keyed 门禁分离的 workflow 文件。

**步骤**
1. 建 `e2e.yml`，只放 keyed 测试命令。
2. 绑定 repository secret，限制到 trusted 事件。
3. 在 dispatch、protected push、nightly、trusted PR 上运行。
4. 加缺失 secret 的 preflight。
5. 保持 `ci.yml` keyless 且 always-green。

**责任者**：CI 所有者拥有 triggers 与 secret scope；维护者拥有 key；评审者确认 trusted PR 真的运行该 lane。

**完成信号**：每个匹配的 e2e 文件在 trusted trigger 上运行；keyless gate 仍可 fork。

**失败处理**：把 self-skipping 套件加进 keyless gate 会假绿；fork 读不到 secret；缺 preflight 会把缺失 secret 变成令人困惑的 skip。

**例外**：贡献者无 key 仍可本地跑 keyless；record workflow 可 self-skip；必需 keyed gate 不可以。

**证据边界**：live 运行有外部非确定性；lane 只覆盖它 provision 的服务与平台；成本与凭据轮换仍是运维责任。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md:1-100@687f282e`。

#### 带密钥 lane 的执行 {#proc-live}

`[源义务]` 该 lane 在 manual dispatch、protected branch push、nightly schedule 与 trusted PR 上运行每个匹配的 `*.e2e.ts`；成本不是约束，可靠性是。它不把 keyless 套件混入 keyed job，也不把 keyed job 混入 always-green `ci.yml`。

**完成信号**：trusted trigger 上所有匹配 e2e 文件实际运行；缺 secret 由 preflight 明确失败。

**失败处理**：fork 无法读取 secret 是设计；把 self-skipping 套件放进 keyless gate 会假绿；把 keyed job 塞进 always-green gate 会让 gate 依赖凭据可用性。

**证据边界**：live 运行有外部非确定性；lane 只覆盖它 provision 的服务与平台；凭据轮换与成本是运维责任。

### 2.25 可靠性治理 {#proc-governance}

`[源义务]` 测试跨并发文件、worker、gate、job 运行；进程隔离不隔离 host 资源；全局 mutation 与不完整 teardown 污染后续测试；测试可能只在单独运行时通过。源实现由 `dsh-ci-test-reliability` Skill 拥有测试隔离与 CI flake 诊断，适用于测试/fixture 获取 host 资源、修改进程全局态、依赖异步 readiness、拥有子进程/网络 listener，或出现概率性 CI 失败。要求建模并发资源、分类失败（确定性产品 bug、隔离缺陷、时序/readiness、host 容量、外部服务），修复所有权或观察，而不是 retry、加大预算或 skip。proposed 的 lint 规则、通用 replay fixture、nightly stress job 明确未实现。

**前置条件**
- 有一份维护中的测试隔离/诊断指南。
- 有资源清单、失败率证据与真实并发拓扑。
- 评审能拒绝 masking fix。

**步骤**
1. 在真实拓扑复现或记录失败率。
2. 识别共享资源或缺失观察。
3. 应用所有权/barrier 修复。
4. 用负向对照或重复运行证明失败因命名原因消失。
5. 若失败类是新类型，更新指南。

**责任者**：测试作者建模资源并复现；CI 所有者提供拓扑与日志；评审者拒绝 masking。

**完成信号**：资源拥有型测试在设计时声明并发与 cleanup；概率失败被分类并用证据修复。

**失败处理**：retry 掩盖原因；更大预算掩盖容量问题；skip 隐藏受支持路径；无复现的修复可能改错东西。

**例外**：外部服务故障可在明确策略下重试，不能作为通用测试修复；proposed 治理机制在实现前仍是 proposal。

**证据边界**：指南不是自动检查器；有些失败取决于测试无法控制的 host 容量；lint/通用 fixture/nightly stress 未实现，不能声称。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-08-28-ci-test-reliability-skill.md:1-44@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-07-subagent-teardown-test-budgets.md:1-29@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-27-oxlint-contract-spawn-case-budgets.md:1-28@687f282e`。

### 2.26 性能预算门禁 {#proc-perf}

`[源义务]` 性能回归可能 unnoticed 到 master：first open 在 127,400-event 合成日志上从 35ms 退化到 5s，在 575,000-chunk 真实日志上从 0.3s 退化到 26s，2.7GB RSS，512MB 限制下 heap exhausted。单次 `open()` 不够，因为工作会在 open/read/restore/projection 间移动，endpoint `heapUsed` 无 GC 不能区分 retained 与 reclaimable。必需 Linux PR `node24/benchmarks` job 跑 `check:ci:bench` → `run-ci-bench.ts`；benchmark-only 依赖放 private workspace；构建 libs+workers；`vitest.bench.config.ts`；在 plain Node 下跑编译后 JS，移除 `NODE_OPTIONS`，不用 TS loader。gate 按 measured user path 分组，`*.bench.ts` 为主机侧，`*.bench.client.ts` 为客户端；package-local `.perf.ts` 是非门禁诊断。每个 sample 复制 source 到 private root、起 fresh compiled worker；seed 进程用生产 append/stream/persistence 生成 current-generation Zstd session，固定 timestamp/id；不依赖 recorded session、ambient repo、network、private home 或 deployed GUI 输入。endpoint budget 例：当前 generation `open` 用 50ms 标准 runner 预期，1.25x 余量得 63ms。memory-pressure 脚本先在无限制下构建，再在 cgroup v2 `memory.max` 4 或 8 GiB、`memory.swap.max=0` 下重跑固定 benchmark 列表；case 错过 normal budget 或 cgroup kill 进程即失败。

**前置条件**
- 有构建产物与在 plain Node 跑编译 JS 的 benchmark 配置。
- 有 endpoint 工作负载与真实分布锚点。
- 有标准 hosted runner、cgroup 能力与 raw sample 保留。

**步骤**
1. 从生产代码与真实分布锚点写 workload。
2. 先构建，再 benchmark 编译输出。
3. 每个 sample 用 private copy 与 fresh worker。
4. 测 workflow 的每个 endpoint，而不是独立冷场景。
5. 校准 budget 与 headroom，记录 raw sample。
6. 在 memory clamp 下重跑，normal budget 仍须成立。
7. threshold 变更需 endpoint 测量与正/负控制。

**责任者**：性能所有者拥有 workload/budget/校准；benchmark 作者写 seed/scenario；CI provision runner 并保留 raw sample；评审者拒绝无测量阈值变更。

**完成信号**：session-open gate 能抓住上述 35ms→5s 与 0.3s→26s 回归；corpus benchmark 以 1,650 个真实 session 的上分位锚点测 list/search/fork endpoint。

**失败处理**：无 endpoint 测量的 budget 被拒绝；cgroup kill 或 normal-budget miss 失败；单冷场景会掩盖工作转移到另一阶段。

**例外**：`.perf.ts` 是非门禁诊断；hardware-comparison workflow 可用不同 runner 规格但不替代标准 gate；terminal/fold/reconnect/continuation 可因 in-process 小而排除 memory clamp。

**证据边界**：budget 测的是一个 runner class，不是每台机器；合成 corpus 不是生产内容；4/8 GiB clamp 不泛化到所有部署。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:1-125@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-06-frontend-performance-budgets.md:1-107@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-28-session-corpus-performance.md:1-80@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-10-07-memory-limited-benchmarks.md:1-42@687f282e`。

### 2.27 证据与门禁分离 {#proc-stress}

`[源义务]` 浏览器压力 lane `pnpm run test:web:stress` 保持无密钥、显式 opt-in；测试持有的 adapter 通过真实 Host、Gateway、WebSocket、Session 归并和 live Think 行发 100,000 个 `reasoning-delta`。每批 128 个 chunk 等一次浏览器 timer turn 再发下一批，因此 50ms heartbeat 与预调度 DOM 事件按 250ms budget 测一个有界 ingestion/render interval，而不是累积 socket backlog；结尾 marker 证明所有 chunk 到达 UI；`DSH_WEB_STRESS_HEADFUL=1` 用可见浏览器 Performance 面板分析同一场景。该 lane 是手动性能诊断与修复验收证据，不是默认 CI gate，也不替代确定性调度单测。确定性 focused tests 固定 `Notifier` 的 per-frame coalescing、结构事件抢占、失效回调、无 rAF fallback，并在 `Session` 层证明一帧只发布一次最新累计文本且 finalization 不被旧帧回调重复通知。

**前置条件**
- 有真实 Host/transport 与浏览器压力场景。
- 有测试持有 adapter、批量 pacing、timer ack 与 terminal marker。
- 有独立确定性测试守护机制本身。

**步骤**
1. 判断 claim 是确定性正确性还是响应性证据。
2. 压力场景用 timer ack 分批，不用 animation frame 给 producer 隐式背压。
3. 发 terminal marker，精确计数。
4. 手动/opt-in 运行；headful profiling。
5. 把确定性断言留在普通套件。

**责任者**：性能作者设计场景；CI 所有者决定 gate vs evidence；评审者拒绝无界拓扑的 gate 使用。

**完成信号**：100,000 chunk 到达 UI 且 terminal marker 证明；focused tests 固定发布契约。

**失败处理**：按 animation frame pacing 会让 producer 随渲染变慢，掩盖主线程饥饿；无 ack 会测成 socket backlog；外部模型引入非确定性；压力 lane 当 gate 会被硬件噪声阻塞。

**例外**：有 endpoint 测量与固定 runner 的 benchmark 可作为 required gate，那是 §2.26 而非本证据 lane；可见 profiling 可用同一场景不同观察。

**证据边界**：硬件/调度差异使该 lane 不适合默认 gate；它降低 snapshot rebuild 与 React 工作，不解决 raw-stream parsing 成本；terminal marker 证明交付，不证明每个用户的响应性。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-08-03-opt-in-reasoning-chunk-browser-stress.md:1-45@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-04-session-open-performance-gate.md:1-125@687f282e`。

### 2.28 声明边界 {#proc-claims}

`[源义务]` green run 只覆盖它实际执行的 runtime、platform、runner class、corpus 与拓扑。源文档明确：web gate 不声称跨平台浏览器一致；benchmark runner 变更需要实际 hosted run 才能认定 job timeout 经过验证，本地 workflow 断言不能证明执行耗时；`ci-workflow.spec.ts` 的 YAML 解析用例要求三个 worker 都含 assignment 并拒绝 step-level override，但它们只证明配置，不证明 host capacity；corpus benchmark 只从一个开发者本地 DSH home 取 1,650 个 session 的聚合计数（22 个上分位锚点：p50 53 events/86,195 bytes/1 turn，p90 709/1,849,503/3，p99 7,229/8,479,554/18，max 84,467/48,139,877/2,181；rank r of n 取第一个 ≥ (r+1)/n 的锚点），不保留内容/身份/路径；memory clamp 的 4/8 GiB 结果不泛化；桌面更新资格在源中主要是 Windows 路径；proposed 机制不是已执行保证。

**前置条件**
- 每次 claim 都有 topology、run id、计数与 raw sample。
- 有明确的不覆盖清单。

**步骤**
1. 命名拓扑与精确断言。
2. 记录 run id、计数、raw sample。
3. 列出未覆盖项。
4. 依赖其他 domain 或未检查目标时标 unbound。
5. 只在 claim 被实际执行后升级证据等级。

**责任者**：测试作者写 scoped claim；评审者拒绝过度概括；CI 所有者保留 run id 与日志。

**完成信号**：每个 claim 都能追溯到 exercised topology；未覆盖项保持 planned/unknown。

**失败处理**：本地绿冒充 CI 覆盖、固定 runner benchmark 冒充普遍、YAML 断言冒充 host capacity，都是假声明。

**例外**：宽平台 claim 可由矩阵支持，但必须逐行列出；历史 note 可报告自己的 run，那是 source-report evidence，不是本次提取执行。

**证据边界**：scoping 不创造证据；正确 scoping 的弱测试仍弱；历史 run id 会过期。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-30-web-browser-snapshot-ci-gate.md:29-33@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-06-standard-hosted-benchmark-runner.md:1-27@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-09-06-pr-ci-runner-temporary-storage.md:45-52@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-28-session-corpus-performance.md:13-19@687f282e`。

### 2.29 覆盖平面诚实 {#proc-coverage}

`[源义务]` per-file 100% coverage gate 只测 `packages/*/*/src`；浏览器驱动代码、test harness、support module 在门外。快照层从一个示例测试目录里的三个模块起步，逐文件 100% gate 完全测不到这些机制，正是同类缺口推动 `dsh-llm-replay` 从 `examples/` 移入 `packages/support`。源决策：可复用机制放进受门禁的 support 包；浏览器驱动代码不能诚实维持 per-file 100%，因此只把 gate-worthy 逻辑放进门禁包；TUI 包测试不声称组装产品覆盖，产品入口移除后由部署拥有 journey/PTY；窄平台排除只排除单用例，受支持 Windows 路径仍在 gate 内；每个声明 runtime line 跑聚焦兼容 smoke，避免 Node 24 成为唯一信号。

**前置条件**
- 知道 coverage glob 的精确平面。
- 有包布局能承载决策逻辑。
- 有 per-file 报告与 per-runtime smoke。

**步骤**
1. 列出 measured 与 excluded harness 路径。
2. 把纯决策逻辑移进 measured 包。
3. 只留 driver/environment glue 在门外。
4. 记录 excluded 平面与 owner。
5. 对单 lane 会成唯一信号的地方加 per-line smoke。

**责任者**：coverage 所有者定义平面；测试作者把逻辑放对位置；评审者拒绝从包测试声称产品覆盖。

**完成信号**：gate-worthy 逻辑在 measured 包内被 per-file 覆盖；每条 runtime 线有兼容 smoke。

**失败处理**：未测 harness 中的机制会被消费者“看起来覆盖”；入口移除后的包快照不是产品覆盖；单 runtime 绿会让其他声明线未验证。

**例外**：浏览器驱动代码可诚实排除，但逻辑必须移走；包级快照仍守护包契约，只是不守护组装部署。

**证据边界**：覆盖率只证明行执行，不证明断言能发现错误；移动逻辑会增加耦合；per-file gate 若成为唯一质量信号会鼓励浅测试。

来源：`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-98@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-08-shared-acp-snapshot-package.md:1-41@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-18-tui-terminal-state-snapshots.md:17-21@687f282e`、`deepseek-harness/.agents/notes/archived/testing/2026-07-22-cross-platform-test-fixtures.md:23-34@687f282e`。

### 2.30 故障注入与恢复 {#proc-faults}

`[源义务]` connection refusal、首个事件前 reset、无 `[DONE]` 的 clean EOF、合法无内容 completion、partial output 后 reset 有不同 adapter/recovery 结果；统一成一个 generic mock 会掩盖边界是否保留区别，以及失败 chunk 是否留在 committed history 之外。源实现 `@deepseek-ai/dsh-llm-mock-server`：可导入 Node HTTP server，`pnpm run mock:llm` 源码入口用于手动注入，不暴露可安装 binary；接受 OpenAI-compatible root 与 `/v1` chat-completions，校验 optional bearer，捕获请求，每个 accepted request 消耗一个显式 behavior；script exhaustion fail loud，重复需 `repeatLast`。behavior 覆盖 socket reset、post-header disconnect、partial disconnect、stall、valid empty completion、clean truncated stream、malformed payload、representative HTTP failure、complete text/reasoning/tool-call、slow streaming、max-token completion；真正 `connection_refused` 是 CLI listener-lifecycle phase，因为 bound handler 不能拒绝自己的 TCP 连接。`random` 每个请求重新加权选择，暴露/记录 unsigned 32-bit seed，接受 caller 权重，内置 success-heavy stress profile；该 profile 是可配置测试压力，不是生产事故频率估计，`connection_refused` 不在 request-level pool。server 只报告 wire facts，不判断 retryability。真实组合测试经 `dsh-llm-deepseek`、`dsh-agent-loop`、`dsh-llm-retry`：refusal、hard disconnect、partial reset、idle timeout、valid content-less completion 按现有默认策略恢复；clean partial EOF 仍是 `STREAM_CLOSED`，默认不重试。package 不改变这些策略。

**前置条件**
- 有一个 shipping adapter/loop/retry 能指向本地 peer。
- 有显式 fault vocabulary 与 request 计数断言。
- 有 seed/权重与 lifecycle cleanup。

**步骤**
1. 枚举 fault class 与预期分类。
2. 每个 class 实现为显式 script entry。
3. 用显式 script 驱动 shipping stack。
4. 断言分类、请求数、重试步骤、失败输出隔离。
5. 加 seeded random profile，记录 seed。
6. recovery 断言与 class 断言分开。

**责任者**：测试基础设施所有者维护 fault source；adapter 所有者拥有分类；retry 所有者拥有恢复策略。

**完成信号**：refusal、hard disconnect、partial reset、idle timeout、valid content-less completion 按现有策略恢复；clean partial EOF 保持 `STREAM_CLOSED` 且默认不重试。

**失败处理**：generic mock 掩盖区别；无 seed 的 random 不可复现；fault harness 改变 policy 会把观察变成产品决策；in-process adapter mock 绕过 fetch/HTTP/SSE/socket/idle watchdog。

**例外**：in-process adapter mock 仍可测 closed-step recovery，但不能覆盖 wire framing；平台特有 updater 可用私有 fixture 省略 publisher verification，但必须说明。

**证据边界**：wire facts 不是生产事故频率；random profile 需 seed，仍不是生产分布；精确 refusal 需要客户端尝试与 pre-listen interval 协调；安装器资格可能平台特定。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-07-25-scriptable-llm-wire-fault-server.md:1-44@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-10-desktop-local-updater-qualification.md:1-51@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-10-07-memory-limited-benchmarks.md:1-42@687f282e`。

### 2.31 有界瞬时重试 {#proc-retry}

`[源义务]` `Install (immutable)` 每个 target 跑 `pnpm install`；install-time native build 从 nodejs.org 下载 Node headers，endpoint 偶发 stall。2026-09-06 `node24-macos-x64` 在 10s connect timeout 后以 `fs-ext node-gyp ConnectTimeoutError` 失败，整个 install 中止，除了人工 rerun 没有恢复。源决策：`pnpm install --frozen-lockfile` 最多三次总尝试，失败间 10s pause，所有平台用 bash（Windows 镜像用 Git Bash）；任一次成功立即结束该 step；lockfile 检查或会在每次尝试都失败的原生构建错误，在有界预算耗尽后仍失败。它镜像 Wine lane 的 bounded-transfer policy，但没有 mirror，因为 install 还必须验证真实 registry 行为。

**前置条件**
- 已观察并命名一个瞬时失败类别。
- 有可移植 shell 与日志化的最终错误。
- 该 step 不是测试断言或性能 gate。

**步骤**
1. 识别瞬时错误签名与受影响 step。
2. 用有界循环加固定 pause 包住命令。
3. 成功立即退出。
4. 让确定性错误穿过预算并最终失败。
5. 记录最终失败与尝试次数。

**责任者**：CI 所有者实现并设界；评审者确认不会掩盖确定性失败；运维诊断耗尽预算后的残留。

**完成信号**：瞬时 connect timeout 可被重试并成功；确定性 native-build 错误在预算耗尽后仍失败。

**失败处理**：宽泛重试会掩盖 lockfile/native-build 失败；无界重试浪费容量并模糊原因；把重试套在测试上会掩盖产品/测试缺陷。

**例外**：外部服务故障可在明确策略下有界重试；测试 flake 绝不用 retry 修复，改用 §2.20/§2.25。

**证据边界**：重试增加 wall time，也可能掩盖持续外部退化；分类依赖观察到的错误文本；它不让外部服务变可靠。

来源：`deepseek-harness/.agents/notes/archived/testing/2026-09-06-python-runtime-install-retry.md:1-26@687f282e`。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/web/tests/scaffold.ts:351-475@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:620-1000@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1574-1796@687f282e`


**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/test-support/llm-replay/src/index.ts:315-350@687f282e`、`deepseek-harness/packages/test-support/llm-replay/src/index.ts:820-853@687f282e`、`deepseek-harness/packages/test-support/llm-replay/src/index.ts:968-1030@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:849-949@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1280-1373@687f282e`


## 3. 迁移落地顺序（迁移设计，不是源义务）

以下顺序把源机制组合成一个可实施的最小路径。它是 `[迁移设计]`，不是源仓库已经按此顺序执行过。

1. **先停止假绿。** 把 keyed 真实 API lane 与 always-green PR lane 分开；必需 lane 加 preflight；CI 显式使用 replay/compare 模式；记录 coverage 的 measured plane。对应 §2.23、§2.24、§2.29。
2. **建立回放底座。** 生产组合 + 单一 overlay + 录制/回放/刷新三模式 + 规范化 expected outputs + 每场景一份日志 + 封闭清单。对应 §2.1、§2.2、§2.4、§2.7、§2.8。
3. **让回放能表达真实拓扑。** 每调用方会话键控、fork 边界、嵌套日志收集、fail-loud 基数。对应 §2.3、§2.21。
4. **证明 guard 会失败。** 每个新 guard 配负向对照；为协议形态包加属性套件；不把 proposed 机制当已实现。对应 §2.20、§2.22。
5. **消除非确定性。** 资源清单、唯一目录/端口、lane 级环境、fixture 生命周期、事件等待、时钟锚点、完成信号归属、预算归属。对应 §2.13–§2.18。
6. **扩大到组装边界。** 浏览器通道、TUI 语义投影、安装/更新产物、真实组装与边界 mock。对应 §2.9–§2.12、§2.19。
7. **加性能门禁与证据分离。** 先有端点测量和标准 runner，再加 budget；压力 lane 只作证据。对应 §2.26、§2.27。
8. **维护声明边界。** 每次报告写 topology/run id/raw sample/未覆盖项；跨 domain 依赖标 unbound。对应 §2.28。

**若只能做最小集**：先做 §2.23（preflight + replay-only CI）与 §2.2（compare/refresh 分离），再做 §2.13/§2.14（资源与生命周期）和 §2.20（一个负向对照）。没有这些，其他机制即使写得漂亮也可能是假绿。

## 4. 历史提案、已拒绝做法与不再有效的形态

这一节保留历史，避免迁移者把已否决或已移除的做法重新引入。标注为“已拒绝”的内容来自源 Note 的 alternatives；标注为“已移除”的内容来自后续决策；标注为“提案”的内容没有实现。

### 4.1 提案，未实现

- **变异测试作为覆盖率制衡**（`2026-06-11-mutation-testing.md`）：Stryker over `packages/*/src`，PR 增量、nightly 全量、mutation score ratchet、等价变异体注释排除。全部是 proposed；正文没有实现证据。迁移者可以把它作为未来工作，但不能声称现有覆盖率已被 mutation score 守护。
- **通用回放 fixture、禁 `setTimeout` lint、nightly `--repeat=200 --shuffle`**（`2026-06-11-deterministic-and-stress-testing.md`）：proposed，且正文自述 CI 可靠性 Skill 没有实现这些机制。不要把它当成现行规则。
- **属性套件 nightly 100x**（`2026-06-11-property-based-testing.md`）：未交付；属性套件只在普通 push/PR CI 运行。nightly 高迭代仍是可能的未来工作。

### 4.2 已拒绝的做法

- **保留完整双配置 + 对称性 verify gate**：能消除静默漂移，但保留 125 行近乎复制品，随插件增长；选择 overlay。
- **在 bin 侧做 YAML 手术**：把 YAML 手术放进发布产物，并把回放差异藏到视线外；选择声明式 overlay。
- **CI 以 refresh 模式运行后检查工作树**：把断言机制变成生成器；工作树检查接错会把回归变成通过的预期输出更新；选择 replay 直接比较。
- **新建独立 browser job 并重建全仓**：重复依赖安装与发布构建；选择现有 Linux 消费方 job。
- **在并行池中运行 HMR**：它会修改共享构建产物；单独串行。
- **用 jsdom 快照代替真实 Chromium**：不覆盖浏览器、HTTP/SSE 承载和真实客户端插件包组合；jsdom 只作低层快速反馈。
- **raw terminal writes / 组件行 / 栅格截图 / 仅 PTY**：分别因差分写边界、缺失 ANSI 效果、平台噪声、不可查询最终状态被拒绝；选择语义终端投影 + 部署方 PTY smoke。
- **手工构造完整会话流程**：会与真实 loop/工具执行/子会话绑定/worker 行为漂移；直接事件只用于渲染器瞬态。
- **在 aria normalizer 中折叠 hovered/unhovered 或日期前缀**：两种渲染陈述不同事实，折叠是删除断言而非稳定断言。
- **提高 timeout/retry 来“稳定”捕获**：不能确立捕获的是哪个状态；错误状态同样满足 `captureStableAria` 的连续两次相等。
- **禁用 hover 样式或 tooltip 模态规则**：测试的是产品不提供的页面。
- **整文件/整包 Windows 排除**：隐藏受支持行为；只排除无法构造状态的单用例，并保留相邻断言。
- **pipe 内部 hack 制造写入失败**：测试未文档化的 fixture 机制；改用 narrow writer callback 注入。
- **Python mock server / 各测试内联 mock / 仅 in-process adapter / 可安装 workspace binary / 随 harness 改 retry 默认**：分别因第二运行时、无法被现有 app 启动、绕过 wire 边界、耦合 clean install、混淆观察与策略被拒绝。
- **给 translation suite 每个 case 单独 allowance**：23 个值重述同一机器属性，后续新增 case 会静默继承更低上限；改用 describe/lane 预算。
- **缩短 `removeFixtureSafely` 重试窗口**：用清理失败换共享 `/tmp` 残留，而残留已两次耗尽 inode。
- **给 `--hookTimeout` 单独环境变量**：两个旋钮描述同一 host 属性，抬高一个会在另一方向复现失败。
- **把 coverage lane 排除出 hosted leg / 只抬高每用例预算 / 削减非法 UTF-8 载荷**：分别隐藏真实 host 依赖、不改变确定性成本、让断言无法为它点名的 undercount 失败。
- **只增大压缩合成上下文窗口**：模型仍可把读取合并成一个 retained tool group，旧历史不足以摘要。
- **固定延迟或禁用浏览器过渡**：固定延迟不观察完成，禁用过渡移除失败涉及的生产行为。
- **按动画帧 pacing 压力 producer / 无 ack 发送 / 外部模型或 HTTP 录制**：分别引入隐式背压、测成 socket backlog、引入非确定性和第二 fixture 格式。
- **在测试中重新实现 Gateway/协议语义**：允许真实系统禁止的状态；改用 endpoint-named contract-shaped mock + 真实组装 boot/mount。

### 4.3 已移除或已被取代的形态

- **`session.expected.jsonl` 作为第二份预期日志**：已移除。每个场景最多一份会话日志 `session.jsonl`；记录场景将它同时用作 replay fixture 与比较对象，override 场景将它用作预期日志。stdout 预期输出仍保留，因为它保护 editor transcript。
- **手工维护的 `cordis.snapshot.yml` 全量镜像**：已被 overlay include 取代。
- **产品 TUI 组合、recorded application journeys、PTY suite 作为包测试的一部分**：已随显式配置入口决策移除；部署拥有这些层。
- **逐条复制 envelope 的会话快照**：已改为投影 `seq`/`time`/`seq0`/`time0`，运行时持久化不变。
- **`findSessionLog` 只返回第一份 `.jsonl`、`dsh-llm-replay` 单一全局游标**：已被逐会话键控 + harvest every log 取代。
- **fork 子会话从整份日志派生脚本**：已被显式 `inheritedEventCount`/`seedLength` 边界切片取代。
- **在 `examples/` 中维护快照 harness/client/normalizer**：已提取到受 coverage gate 覆盖的 support 包；示例只保留场景表、agent 路径与一次工厂调用。
- **`hooks.e2e.ts` 只覆盖单个 hook point、ACP 示例不加载 Codex bridge**：已被 13 个 `hook-<dialect>-<point>-<outcome>` 场景与双 bridge 加载取代；三个无可观察/非确定性 hook point 明确排除。

## 5. 源证据与限制

- **已检查范围。** 本参考对应 `research/rationale-testing-1-coverage.json` 中 118 个条目：59 个英文 Note 正文与 59 个中文对应正文，逐文件记录实际行范围。没有代表性采样；没有把未读文件算作覆盖。
- **正文读取完整性。** 初读时部分 Note 的极长单行（>768 字符或 CJK 双宽列）被读取工具截断显示；随后对 41 个文件中的全部 109 条超限行逐行使用精确 `:raw` 模式重读，coverage 中相应记录逐条记录了行号。正文读取不再存在工具截断缺口；重读内容未产生超出既有机制的新义务。其余声称截断但实际最长行未超限的中文文件已核实并记录无截断。
- **未重新执行。** 源 Note 中的本地运行、CI run id、before/after 计数、红→绿检查都是源报告。本提取没有运行构建、测试、lint、格式化、远程调用或目标仓库变更。所有 verification 证据等级均为 source-reported/planned，除非后续实现者实际执行。
- **未检查的跨域目标。** Note 链接到 process、architecture、simplification、bug-fix、feature 决策，以及 `docs/testing.md` 与 `dsh-ci-test-reliability` Skill。它们未在本分区检查，已登记为 cross-domain references；本参考不声称其内容。
- **未解决项。** 两个 proposed Note 的机制未实现；`TODO(acp-subagent-replay)` 仍未关闭；部分 Note 描述的机制位于 Note 正文之外的实现文件中，未在本分区核对；安装/更新资格在源中主要是 Windows 路径。详见 coverage 的 `unresolved`。
- **引用格式。** 源内引用使用 `deepseek-harness/<path>:<start>-<end>@687f282e`；`<path>` 相对源仓库根。机制级结构化记录见 `knowledge/rationale-testing-1.json`。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `rationale-testing-1.observation-waits-on-observed-state`：`deepseek-harness/.agents/notes/archived/testing/2026-09-28-detail-close-waits-on-observed-state.md:1-45@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-observation-waits-on-observed-state.md:1-39@687f282e`
- `rationale-testing-1.negative-control-calibration`：`deepseek-harness/.agents/notes/implemented/testing/2026-10-11-user-text-credential-matching.md:1-70@687f282e`
- `rationale-testing-1.performance-budget-gate`：`deepseek-harness/.agents/notes/implemented/testing/2026-09-06-backend-continuation-performance.md:1-70@687f282e`
- `rationale-testing-1.perf-diagnostics-separation`：`deepseek-harness/.agents/notes/implemented/testing/2026-10-07-scaled-benchmark-report.md:1-43@687f282e`

---

## 机制 ID 索引（稳定标识与锚点）

本表把 `knowledge/` 中的稳定机制 ID 对应到本文锚点；正文按主题叙述，这里只提供可检索的标识映射。

| 机制 ID | 锚点 |
|---|---|
| `rationale-testing-1.record-once-replay-corpus` | `#proc-replay` |
| `rationale-testing-1.expected-output-authority` | `#proc-golden` |
| `rationale-testing-1.replay-script-keying` | `#proc-nested` |
| `rationale-testing-1.single-source-composition` | `#proc-composition` |
| `rationale-testing-1.semantic-state-projection` | `#proc-render` |
| `rationale-testing-1.model-visible-surface-snapshot` | `#proc-modelsurface` |
| `rationale-testing-1.redaction-fixed-points` | `#proc-redaction` |
| `rationale-testing-1.fixture-hygiene-guards` | `#proc-inventory` |
| `rationale-testing-1.replay-assembled-lane` | `#proc-browser` |
| `rationale-testing-1.real-entry-path-gate` | `#proc-installed` |
| `rationale-testing-1.installed-artifact-qualification` | `#proc-update` |
| `rationale-testing-1.real-assembly-over-hand-built-bench` | `#proc-assembly` |
| `rationale-testing-1.boundary-mock-not-contract-reimplementation` | `#proc-boundary` |
| `rationale-testing-1.subprocess-plumbing` | `#proc-subprocess` |
| `rationale-testing-1.test-isolation-hermeticity` | `#proc-isolation` |
| `rationale-testing-1.fixture-lifecycle-ownership` | `#proc-lifecycle` |
| `rationale-testing-1.determinism-barriers` | `#proc-determinism` |
| `rationale-testing-1.observation-waits-on-observed-state` | `#proc-observe` |
| `rationale-testing-1.owned-completion-observation` | `#proc-completion` |
| `rationale-testing-1.timeout-budgeting` | `#proc-budget` |
| `rationale-testing-1.platform-neutral-fixtures` | `#proc-platform` |
| `rationale-testing-1.negative-control-calibration` | `#proc-controls` |
| `rationale-testing-1.tripwire-failures` | `#proc-tripwire` |
| `rationale-testing-1.property-invariants` | `#proc-property` |
| `rationale-testing-1.no-false-green-preflight` | `#proc-preflight` |
| `rationale-testing-1.secret-and-trigger-isolation` | `#proc-secret` |
| `rationale-testing-1.with-key-real-api-gate` | `#proc-live` |
| `rationale-testing-1.test-reliability-governance` | `#proc-governance` |
| `rationale-testing-1.performance-budget-gate` | `#proc-perf` |
| `rationale-testing-1.perf-diagnostics-separation` | `#proc-stress` |
| `rationale-testing-1.evidence-scoped-claims` | `#proc-claims` |
| `rationale-testing-1.coverage-plane-honesty` | `#proc-coverage` |
| `rationale-testing-1.fault-injection-and-recovery` | `#proc-faults` |
| `rationale-testing-1.bounded-transient-retry` | `#proc-retry` |
