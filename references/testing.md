# 测试域治理迁移参考（testing）

> 源仓：`deepseek-harness`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，只读。 引用格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。引用只标出实际检查过的范围；未检查的文件列入 `research/testing-coverage.json` 的 `uninspectedCandidates`。 标记约定：**[源规则]** 表示源仓有明确文字、配置或代码要求；**[迁移设计]** 表示为了让这些要求在采用项目中可执行而设计的落地步骤；**[建议]** 表示源仓未强制、但采用时可降低风险的附加做法。迁移设计不冒充源规则。 本文只覆盖测试域。发布流水线、文档配对、会话格式语义、安全审批等只在测试域需要时引用，交叉依赖汇总在文末。

## 0. 使用契约与读者入口

这套治理解决的不是“有没有测试”，而是：**在什么风险下选哪一层证据、用什么执行拓扑、怎样让失败可复现、怎样证明真实入口而不是 mock 的自证、以及哪些豁免仍然可审计**。

先按触发条件选入口：

| 触发 | 先读 | 典型命令 | 完成信号 |
|---|---|---|---|
| 改了一个包的局部行为 | M01、M02 | `pnpm run test <focused>` | 聚焦用例通过；若触及覆盖率范围，再跑聚焦覆盖率 |
| 改的是异步、子进程、端口、临时目录、全局状态 | M02-M05、M35 | 聚焦用例 + 并发/恢复证据 | 资源释放到静止；拒绝 flake 掩盖 |
| 改的是运行时代码且要合入 | M06-M09、M37 | `pnpm run test:coverage` 或 `check:ci:coverage` | 合并后的 per-file 100% 门槛通过 |
| 改的是模型/用户可见输出 | M16-M27、M01 | `pnpm run test:snapshot` | keyless 回放差异被审查 |
| 改的是 CLI/进程装配但无会话回放 | M28 | `pnpm run test:expected` | owner-local 期望输出通过 |
| 改的是 Web UI | M29-M30 | `pnpm run test:web`（必要时 `test:web:built`） | Chromium/WebKit 语义断言通过 |
| 改的是 provider/真实 API 行为 | M10-M11、M12 | `pnpm run test:e2e` | 有 key 的真实运行；无 key 只说明管线可跑 |
| 改的是 Python SDK/wheel/运行时 | M40、M14-M15 | `uv run --project python/sdk pytest`；installed-wheel keyless | pytest + 干净 venv black-box 通过；real API 只在 trusted 环境 |
| 改的是性能敏感路径 | M31-M32 | `pnpm run test:bench` 或聚焦 benchmark | 预算内中位数；原始样本与机器信息齐全 |
| 改的是测试基础设施/夹具/CI | M02-M09、M33-M38 | 对应 lane + 负对照 | 新守卫能让被拒绝的回归变红 |
| 推送/重写历史前 | M36 | `pnpm run change-scope --base <ref>` | 只运行覆盖出站 diff 的最小证据 |

**[源规则]** 测试分层和命令总表在 `docs/testing.md`；命令清单在根 `AGENTS.md` 的 Commands。不要把“我跑了 `pnpm run test`”当成覆盖率门禁：源仓明确规定 CI 覆盖率门禁是 `test:coverage`，不是 `test`。`deepseek-harness/docs/testing.md:7-17@687f282e`、`deepseek-harness/AGENTS.md:113-121@687f282e`。

**[源规则]** 测试跟着它验证的代码区域走：包测试在包自己的 `tests/**`，仓库脚本测试在 `scripts/**/*.spec.ts`，profile 级集成测试在 `apps/cli/tests/profiles/`，包级 Loader 组合留在该包测试内。`deepseek-harness/docs/testing.md:7-17@687f282e`、`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:35-43@687f282e`。

**[迁移设计]** 采用项目先建立自己的“触发 → 层级 → 命令 → 所有者 → 证据”表，不要直接照抄命令名。表中每一行必须能回答：谁运行、在哪个环境运行、失败时谁修、允许哪些例外、哪些结论这层证据不能证明。

<a id="m01-tiered-evidence"></a>

## 1. M01 证据层级与命令选择

**机制 ID.** `testing-tiered-evidence-selection`。

**问题.** 全量套件慢且噪声大；只跑单测又会把“绿单测、坏产品”放过去。层级必须由**风险面**决定，而不是由“方便”决定。

**触发.** 任何行为改动、PR、CI 失败诊断、发布前检查。

**前提.**
- 已确认改动是否触及模型/用户可见输出、真实入口、构建产物、provider、平台语义或公共契约。
- 已确认要证明的失败模式；没有失败模式的“多跑一点”不是证据选择。

**步骤.**
1. **先选最低但足够的层级**：聚焦单测 → 聚焦覆盖率 → owner-local expected → recorded-session snapshot → Web 浏览器 → 真实 API e2e。层级越高，环境依赖和成本越大。
2. **按表面匹配证据**：模型/用户输出用 keyless snapshot；文档用 `doc-sync`；已发布/构建路径用 built smoke；provider 用真实 e2e；包/脚本行为用 owning Vitest 文件。`deepseek-harness/AGENTS.md:117-121@687f282e`。
3. **把测试放在所有者旁边**：包测试跟包走；profile 组合放 `apps/cli/tests/profiles/`；非会话驱动的期望输出放 `tests/expected/`；会话驱动放顶层 `snapshots/`。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:35-43@687f282e`。
4. **验证“守卫真的能变红”**：新增静态/语料守卫时，临时引入被拒绝的回归并观察目标失败；没有负对照的守卫只是文档。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:101-115@687f282e`。
5. **报告实际运行的命令和结果**：跳过、待定、重试都不能写成通过。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:25-31@687f282e`、`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:127-131@687f282e`。

**角色与完成信号.**
- 作者：选择层级、运行聚焦证据、保留失败/修复/重跑记录。
- 评审者：检查“这层证据能否覆盖这个失败模式”，而不是只看绿色。
- 完成信号：证据的**被测对象**与改动的**风险面**一致；报告里能指出具体命令、具体用例、实际观察。

**失败处理.**
- 聚焦测试失败：先修行为或测试假设；不要用放宽断言、加 sleep、重试、全量串行来掩盖。
- 证据层级不够：升级一层，并说明为什么低层不能证明。
- CI 与本地不一致：记录命令、平台、失败用例和具体差异；按 M35 的 flake 诊断流程处理。

**例外.**
- 仓库级、不可分割的改动，或用户明确要求完整本地演练时，才运行完整近似（`pnpm run check:all` 或当前 workflow 的完整 lane）。`deepseek-harness/AGENTS.md:119-121@687f282e`。
- 真实 provider 的重试只允许在外部边界，且必须记录为瞬态外部依赖处理，不得扩散到本地确定性测试。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:117-125@687f282e`。

**证据限制.** 源仓能证明测试分层、命令和审查文字存在；不能证明每个 PR 实际都按此执行。采用项目必须用自己的 CI 日志、审查记录和失败样本证明执行力。

<a id="m02-topology"></a>

## 2. M02 执行拓扑：四层并发与资源所有权

**机制 ID.** `testing-execution-topology`。

**问题.** 测试文件不是一个孤立的进程。Vitest 文件、worker、同一 job 的其他 gate、同一宿主上的其他 job 都可能重叠；进程隔离并不隔离端口、可预测路径、外部命名空间或继承的子进程。

**触发.** 新增/修改任何异步测试、子进程、端口、临时目录、数据库、socket、共享输出目录，或调整 worker/分区配置。

**前提.** 已读当前 Vitest 配置和当前 workflow；不能用记忆中的旧拓扑推断。

**步骤.**
1. 按四层建模：同一文件内用例 → 不同文件/worker → 同一 job 的独立 Vitest/gate 进程 → 共享宿主上的不同 Actions job。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:17-27@687f282e`。
2. 对每个获取的资源写出五个事实：**所有者、原子分配方式、可观察就绪信号、注册的清理、静止完成信号**。
3. 不要因为一个夹具缺隔离就把整套串行化；缩小独占范围或改分配方式。串行 block 保护不了另一个文件、进程或 job。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:25-27@687f282e`。
4. 配置层显式设 worker/分区：coverage 的 instrumented 分区数、exempt heavy、snapshot 并发、Web snapshot worker、gate 并发。`deepseek-harness/scripts/run-gates.ts:210-260@687f282e`。
5. 对进程全局的测试使用 process-bound 项目/独立 fork；不要与 thread-safe 用例混跑。两个项目都用 `pool: 'forks'`。源 `vitest.config.ts:186-200@687f282e` 的注释记录 Node 24 从 worker threads 进入 CJS lexer 时在 macOS/Linux/Windows 均出现 `v8::ToLocalChecked Empty MaybeLocal` in `cjs_lexer::Parse`；该注释没有给出精确受影响版本区间或上游 issue，升级 Node 后必须重新取得复现或测试证据再改变 fork 策略，不能把这条快照观测当作永久平台事实。`deepseek-harness/vitest.config.ts:166-230@687f282e`。

**角色与完成信号.** 作者建模并写资源所有权；评审者按四层追问“另一个 job 同时跑会怎样”；完成信号是并发运行下仍通过，且清理后宿主没有残留。

**失败处理.** 只在单独运行时通过、并发时失败，是测试缺陷，不是“runner 不稳定”。先定位共享资源，再考虑缩小独占范围；不要先加长超时。

**例外.** 真正全局且无法命名空间的资源可以串行，但必须写明资源和范围；不能把“整个套件串行”当作默认修复。

**证据限制.** 源仓的配置和共享 runner 说明能证明拓扑存在；具体宿主的 CPU/内存竞争、容器配额和外部服务状态需要采用项目自己的运行记录。

<a id="m03-resources"></a>

## 3. M03 资源分配与清理

**机制 ID.** `testing-resource-isolation`。

**问题.** “先检查空闲再占用”会产生 TOCTOU 竞争；可预测路径会被并行用例踩踏；只调用 `close()`/`kill()` 而不等待完成信号会留下晚到回调。

**触发.** 端口、临时目录、数据库、socket、session、输出目录、子进程、浏览器、文件监听。

**前提.** 已确认资源的所有者和生命周期；已知道该资源在失败/重试/超时路径上也要释放。

**步骤.**
1. **用所有者分配器，不要扫描后占用**：网络夹具 `listen(0)` 并在 server 报告 listening 后读取分配地址；临时根用 `mkdtemp`；共享数据库/socket/session/输出位置用每测试唯一命名空间；必须不存在的路径用独占创建。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:29-40@687f282e`。
2. **稳定记录标识与临时传输地址分离**：录制 fixture 里的固定 id 是解析输入，不是要占用的资源；在夹具内部翻译成实时值，不要为了“真实”去改录制值。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:38-40@687f282e`。
3. **获取后立刻注册清理**，让断言失败也能释放；清理顺序是：停止新回调/请求 → 解绑监听 → 恢复全局钩子 → 终止自有工作 → 等待 child exit/server close/worker terminate。
4. **等待静止**：`abort()`、`close()`、`kill()` 只是请求；必须 await 对应的完成信号。晚到完成可能污染下一个测试时，要证明处置能阻止它。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:90-99@687f282e`。
5. **固定路径清理**：snapshot 的 `.tmp`/workspace 旁路目录由所有者删除；不要留下未注册目录或孤儿夹具。`deepseek-harness/packages/test-support/session-snapshot/README.md:50-60@687f282e`。

**角色与完成信号.** 作者实现分配/清理；评审者检查失败路径和超时路径；完成信号是并发运行后端口、临时目录、子进程、全局状态均无残留。

**失败处理.** 清理失败要区分“产品没退出”和“测试没等待”；前者修产品，后者补完成信号。不要用固定 sleep 等待退出。

**例外.** 纯解析用的字面路径/URL 不是获取的资源，不要为了“看起来固定”而重写。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:38-40@687f282e`。

**证据限制.** 源仓能证明分配/清理规则和辅助代码；不能证明每个夹具在任意宿主上都无泄漏。采用项目需要并发压力和残留检查。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:1-129@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:462-475@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:620-700@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:967-990@687f282e`


<a id="m04-global-state"></a>

## 4. M04 进程全局状态与平台语义

**机制 ID.** `testing-global-state-and-platform-semantics`。

**问题.** `process.env`、`cwd`、fake timers、locale/timezone、module mocks、registry、console hook、`globalThis`、全局 `fetch` 拦截都是独占可变资源。Windows 与 POSIX 对环境变量大小写、文件句柄释放、mtime 精度、权限和信号的语义不同。

**触发.** 修改环境变量、cwd、时钟、locale、全局对象、模块注册表、fetch/console hook；编写跨平台断言。

**前提.** 已列出会被修改的全局状态；已确认测试结束后原值是“不存在”还是“存在”。

**步骤.**
1. 优先注入依赖或实例级 adapter；必须修改全局时，捕获**原值是否存在**，恢复完全相同的状态。
2. 修改范围最小化：`try/finally` 包住最小范围；获取后立刻注册恢复；对“失败可能早于局部 finally”的情况加 `afterEach` 兜底。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:43-51@687f282e`。
3. 只拦截夹具拥有的最窄请求/调用；不要把整个 `fetch` 或整个模块替换成宽泛 mock。
4. **平台断言取新鲜值**：恢复 mtime 后再读一次，用读回值做期望，不要假设写入值能无损往返（NTFS 100ns tick）。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:53-70@687f282e`。
5. Windows 环境变量名大小写不敏感；seed `http_proxy` 与 `HTTP_PROXY` 两个键在 Windows 上只有一个条目。Windows 文件句柄异步释放；rename/remove 需要按观测到的竞争做有界重试。POSIX 权限/信号语义不能靠弱化断言跨平台；确实无法跨平台时显式跳过并写原因。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:57-70@687f282e`。
6. **代理基线**：Vitest setup 删除 ambient proxy 名称，让每个套件从已知环境开始；需要代理的测试显式设置它要验证的名称。`NODE_USE_ENV_PROXY` 在进程启动时已被 Node 采样，setup 删除无效，必须在 shell 中 unset。`deepseek-harness/scripts/test-proxy-environment.ts:1-60@687f282e`。
7. **DOM 环境**：jsdom 的 `ResizeObserver` 默认实现只在缺少时安装，并由 `vi.unstubAllGlobals` 恢复；几何/时序套件自己提供 observer。`deepseek-harness/scripts/test-dom-environment.ts:1-41@687f282e`。

**角色与完成信号.** 作者写恢复/平台分支；评审者检查“原值不存在”路径和失败路径；完成信号是全局状态在用例后与用例前完全一致，平台差异有显式理由。

**失败处理.** 跨平台失败先判断是产品语义还是测试假设；产品语义问题修产品，测试假设问题修测试。不要为了绿而在所有平台弱化断言。

**例外.** 确有平台专属能力（POSIX 权限、信号、pwsh、ConPTY）时，按 M38 显式跳过并命名原因。

**证据限制.** 源仓能证明规则和示例；不能证明所有平台组合都被覆盖。采用项目需要 Windows/macOS/Linux 至少各一条真实 lane。

<a id="m05-synchronization"></a>

## 5. M05 同步、超时预算与静止处置

**机制 ID.** `testing-deterministic-synchronization`。

**问题.** 固定 sleep 不能证明 setup 完成或 teardown 静止；过小的 case timeout 会覆盖 runner 已给的 lane 预算；只发取消信号不等待完成会把失败转移成下一个测试的污染。

**触发.** 任何异步等待、race 测试、超时断言、子进程/服务关闭、expect.poll。

**前提.** 已知要等待的**状态**（不是“过多久”）；已知该用例所在 lane 的预算。

**步骤.**
1. 等待显式就绪事件、握手、状态转移、拥有的 promise 或外部可观察条件；超时只用于**限制**等待，不能成为断言正确的原因。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:72-88@687f282e`。
2. `describe`/case timeout 会覆盖 runner 的 `--testTimeout`，低于 lane 预算就是收窄；需要收窄时写明原因。hook 预算与 test 预算一起抬高；只抬 case 会把竞争失败推到 `afterEach`。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:74-80@687f282e`。
3. 当超时本身是被测对象时，外层等待要远大于被测超时，避免 harness 自己的等待先触发。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:80-82@687f282e`。
4. 用 barrier/deferred 把 race 放在确定点并证明重叠；不要断言调度相关顺序，除非该顺序就是产品行为；时间本身是被测对象时注入/伪造时钟并恢复真实 timer。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:84-88@687f282e`。
5. **观测不能先于被观测状态**：不要用“开始时启动的 wall-clock 窗口”去读一个前面还有长前缀的状态；应等待 hand-over/状态写入，再开始有界等待。`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-observation-waits-on-observed-state.md:5-12@687f282e`。
6. 当一个状态是**最终态**时，轮询可能在点击提交前就被初值满足；先把选择/布局动作放在断言前，再用一个能区分初值与目标值的观察。`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-spreadsheet-selection-by-keyboard-before-reflow.md:5-14@687f282e`。
7. 需要重试时，先命名被等待的工作；重试只能是有界的外部瞬态处理，不能是本地确定性测试的修复。
8. **超时预算可被机械验证**：`DSH_COVERAGE_TEST_TIMEOUT_MS` 必须是正整数；它同时约束 per-test、hook 和 `expect.poll`。格式错误在 config load 阶段失败，不进入任何测试。`deepseek-harness/scripts/lane-test-budget.spec.ts:56-122@687f282e`、`deepseek-harness/vitest.config.ts:360-406@687f282e`。
9. CI coverage lane 在共享宿主上给 90s 预算（并发/分区/兄弟 gate 争用），Windows coverage lane 同理；这是“恢复 lane 已给的预算”，不是凭空加余量。`deepseek-harness/.github/workflows/ci.yml:126-140@687f282e`。

**角色与完成信号.** 作者写等待/预算；评审者追问“这个等待在什么条件下会永远不返回/过早返回”；完成信号是重复运行和负载下都能稳定收敛，且超时失败能看到被等待的状态。

**失败处理.** 超时：先定位没到达的状态和诊断输出；不要先加时间。竞态：用 barrier 证明重叠，再用确定性断言。清理未静止：补 await，不要用 sleep 掩盖。

**例外.** 真实 provider 的瞬态重试（M10）；诊断已知 Windows 失败的 wine（M38）；两者都必须在外部边界并保留记录。

**证据限制.** 源仓能证明预算代码、lane 值和诊断规则；不能证明任意负载下都不 flake。采用项目需要保留失败样本、重跑记录和压力证据。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/web/tests/scaffold.ts:964-1000@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1516-1709@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1376-1880@687f282e`


<a id="m06-coverage"></a>

## 6. M06 覆盖率门禁：per-file 100%

**机制 ID.** `testing-coverage-per-file-100`。

**问题.** 聚合覆盖率会让一个文件的高覆盖掩盖另一个文件的死代码。源仓把覆盖率当成“删死代码”的门禁，而不是“补测试”的 KPI。

**触发.** 合入运行时代码；修改 `packages/*/*/src`；调整覆盖率配置或排除项；CI coverage 失败。

**前提.** 已区分运行时源码、测试、脚本、文档、应用、生成物、类型声明、平台专属代码。

**步骤.**
1. CI 覆盖率命令是 `pnpm run test:coverage`（根脚本先构建 native-system，再 `vitest run --coverage`），不是 `pnpm run test`。`deepseek-harness/package.json:60-70@687f282e`、`deepseek-harness/docs/testing.md:10@687f282e`。
2. 只对运行时源码设门槛：`packages/*/*/src/**/*.ts`（以及明确列出的 client 源）；每个文件要求 100% statements/branches/functions/lines，`perFile: true`。`deepseek-harness/vitest.config.ts:101-166@687f282e`。
3. 覆盖率 include 范围之外的文件（测试、脚本、应用、生成物、vendor、配置、平台二进制、类型-only、进程入口 bootstrap）必须有理由；见 M07。
4. 未覆盖行先判断是不是**死代码**；是死代码就删除，不要为了数字补无意义测试。`deepseek-harness/docs/testing.md:10@687f282e`。
5. 每次覆盖率运行输出未覆盖位置的 `file:line:column`（statement/function/branch），让失败可定位。`deepseek-harness/scripts/coverage-uncovered-locations.cjs:61-116@687f282e`。
6. 分区运行由 coordinator 合并后统一执行 thresholds；单个分区不各自决定全局通过。见 M08。
7. 聚焦覆盖率时同时指定**测试文件**和**源码范围**：`vitest run <test> --coverage --coverage.include='<src>'`；不要用 `--passWithNoTests`、降低阈值或缩窄 include 来隐藏未覆盖文件。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:61-83@687f282e`。
8. 行为正确性不能由覆盖率替代：line coverage 只证明行跑过，不证明产品按发布形态工作。`deepseek-harness/docs/testing.md:10@687f282e`。

**角色与完成信号.** 作者保证新源码被真实行为覆盖或删除；评审者检查排除项和“为覆盖率而写”的测试；完成信号是合并后的 per-file 100% 通过，且未覆盖位置为空。

**失败处理.** 未覆盖：先判断死代码/不可达/仅在子进程运行/平台专属，再决定删除、补测试或按 M07 记入豁免。不要直接加 `/* v8 ignore */`。

**例外.** 平台专属源码（如 `pwsh-local`）在没有 pwsh 的宿主上自跳过并条件排除；CI 有 pwsh 时恢复完整门槛。`deepseek-harness/docs/testing.md:10@687f282e`、`deepseek-harness/vitest.config.ts:118-150@687f282e`。

**证据限制.** 源仓能证明阈值和 include/exclude；不能证明每个文件的行为都被有效断言。覆盖率必须与 M12/M14 的世界断言配合。

<a id="m07-exclusions"></a>

## 7. M07 覆盖率排除台账与重套件

**机制 ID.** `testing-coverage-exclusion-ledger`。

**问题.** 宽泛的 exclude、无理由的 `/* v8 ignore */`、以及“重套件不跑覆盖率”都会让死代码/回归消失。豁免必须可审计、可机械核对、仍然被执行。

**触发.** 新增覆盖率排除；新增 `v8 ignore`；把套件移出 instrumented 运行；平台条件豁免。

**前提.** 已确认被排除的代码确实不是可测运行时逻辑，或确实无法在 instrumented 进程中运行。

**步骤.**
1. **每个 exclude 写理由**：测试/脚本/应用/生成物/vendor/配置/平台二进制/类型-only/进程 bootstrap 分别说明为什么不属于覆盖率分母。`deepseek-harness/vitest.config.ts:101-166@687f282e`。
2. **`/* v8 ignore next -- reason */` 只包最小表达式**，并写明不可达/平台/注册保证的原因；不要包整段逻辑。源仓在 snapshot 注册保证处使用带原因的 ignore。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1410-1430@687f282e`。
3. **重套件单独跑、但不消失**：`scripts/coverage-exempt.ts` 维护 `filter` + `exclude` 的套件清单；CI 在 instrumented coverage 之外用 `vitest run <filter...>` 执行它们，标为 `test:coverage-exempt-heavy`。`deepseek-harness/scripts/coverage-exempt.ts:1-59@687f282e`、`deepseek-harness/scripts/run-gates.ts:696-730@687f282e`。
4. **机械核对**：每个 entry 的 positional filter 与 exclude glob 必须从仓库 spec 清单中选出**同一个非空文件集**；entry 之间不能重叠；所有 Typert 套件必须被覆盖。`deepseek-harness/scripts/coverage-exempt.spec.ts:1-62@687f282e`。
5. **普通覆盖率运行排除这些套件**（`DSH_COVERAGE_EXEMPT`），重套件运行不设该变量；这样它们不会双跑，也不会被当成通过覆盖率门槛。`deepseek-harness/vitest.config.ts:116-135@687f282e`。
6. 重套件失败仍然是失败；它们只是不计入覆盖率分母，不是“允许失败”。

**角色与完成信号.** 作者维护 entry 和理由；评审者检查 filter/exclude 是否仍然指向真实文件；完成信号是 guard 测试通过、重套件实际执行、覆盖率合并结果没有被豁免污染。

**失败处理.** filter 与 exclude 不一致：修 entry，不要放宽 guard。套件改名：guard 会因非空/一致性问题变红。平台缺失：用条件豁免并保留探测，不要永久删除。

**例外.** 源仓的重套件包括 memory-limited benchmarks、scaled benchmark report、session corpus performance、session-open performance gate、frontend performance budgets、benchmark-next-package-dependency、benchmark-npm-resolution、Typert 全套。具体名单随源变化，迁移时以项目自己的配置为准。`deepseek-harness/scripts/coverage-exempt.ts:1-59@687f282e`。

**证据限制.** guard 能证明“filter 和 exclude 选到同一批文件”，不能证明这些套件本身有意义；仍需 M31/M32 的预算和 M02 的并发证据。

<a id="m08-partitioning"></a>

## 8. M08 覆盖率分区、合并与计时

**机制 ID.** `testing-coverage-partitioning`。

**问题.** 大型仓库的覆盖率运行在单进程里会超出 CI 时限；简单按文件哈希分片会让重文件堆在一个分片；分区后如果只合并数字而不校验文件清单，会静默漏跑。

**触发.** coverage 文件数/时长超过单 lane；CI 需要并行分区；调整 worker 数或分区数。

**前提.** 已有 `vitest list --filesOnly` 可枚举的 instrumented 文件清单；已区分 thread-safe 与 process-bound 项目；已有可合并的 coverage blob 机制。

**步骤.**
1. **从真实清单取文件**：`vitest list --filesOnly`，位置过滤参数放在 `--` 之后，避免把 `--testTimeout 5000` 之类当成过滤；在这里移除 exempt heavy 套件。`deepseek-harness/scripts/coverage-partitions.ts:202-222@687f282e`。
2. **按记录时长做 LPT 分配**：重文件先放入当前最轻的分区；同权重按路径稳定排序；未知权重按 1；min-heap 保持 O(log partitions)。`deepseek-harness/scripts/coverage-partitions.ts:300-390@687f282e`。
3. **拒绝空分区**：Vitest 对没有匹配文件的 config 会“跑全部”，空分区会静默把整套跑一遍。`deepseek-harness/scripts/coverage-partitions.ts:520-546@687f282e`。
4. **每个分区用独立 config**：按项目拆分 include（thread-safe vs process-bound）；process-bound 保持专用 pool；命令行参数过长在 Windows 会撞 CreateProcess 限制，所以用短 config 路径而不是把几百个文件塞进 argv。`deepseek-harness/scripts/coverage-partitions.ts:430-450@687f282e`。
5. **每个分区单 worker 跑 coverage**，输出 blob、file-times、canonical locations；`--coverage.reportOnFailure` 保留失败证据。`deepseek-harness/scripts/coverage-partitions.ts:610-650@687f282e`。
6. **合并后再判 thresholds**：coordinator 用 `vitest --merge-reports=<blobs> --coverage` 合并，per-file 100% 在合并结果上执行。`deepseek-harness/scripts/coverage-partitions.ts:655-675@687f282e`。
7. **校验完整性**：blob 集合必须与分区命令一一对应；每个分区的 timing report 必须恰好覆盖分配的文件一次（缺失、意外、重复都失败）。`deepseek-harness/scripts/coverage-partitions.ts:676-700@687f282e`。
8. **计时历史**：`.coverage-times.json` 在 CI cache 中跨 run 保存；新测量覆盖旧值，已删除文件被剔除；本地可回退到 Vitest results cache。`deepseek-harness/scripts/coverage-partitions.ts:238-310@687f282e`。
9. **失败保留诊断**：失败时保留 `coverage/.partitioned` 的分区 config、inventory、报告；只有成功才删除。`deepseek-harness/scripts/coverage-partitions.ts:500-520@687f282e`。
10. **CI 分配 worker/分区**：`DSH_COVERAGE_MAX_WORKERS` 决定 instrumented worker；分区数默认为 `total - max(1, floor(total/3))`，仅当 >1 时设置；self-hosted CI 显式给 6 workers / 4 partitions。`deepseek-harness/scripts/run-gates.ts:210-252@687f282e`、`deepseek-harness/.github/workflows/ci.yml:111-140@687f282e`。

**角色与完成信号.** 作者维护分区算法和清单；CI 维护者给 worker/分区/缓存；完成信号是所有分区非空、blob 完整、timing 完整、合并覆盖率达到 per-file 100%。

**失败处理.** 空分区：检查清单/过滤。blob 缺失：看分区输出尾部。文件重复/缺失：看 timing report 和 project 分配。分片过慢：调整 worker/分区或检查重套件。

**例外.** 小仓库可以不分区（partitions < 2 直接走普通 coverage）；但一旦启用，完整性和非空校验不能跳过。

**证据限制.** 源仓能证明算法、校验和 CI 变量；不能证明任意 CI 机器上的时长分布。采用项目需要自己的 timing 基线和失败样本。

<a id="m09-fork-diagnostics"></a>

## 9. M09 覆盖率 worker 退出诊断

**机制 ID.** `testing-coverage-fork-diagnostics`。

**问题.** coverage 分区在 fork worker 被杀/崩溃时，Vitest 可能只给出一个模糊的失败；没有 PID、文件、退出码和信号，无法区分 OOM、超时、产品崩溃和测试崩溃。

**触发.** coverage 分区出现无法解释的 worker 退出；需要判断是资源压力还是具体测试。

**前提.** 使用 fork pool；不改变 Vitest 的调度和失败语义。

**步骤.**
1. 用 `coverageForkPool` 包装 `ForksPoolWorker`；只在有未完成 `run`/`collect` 请求时报告。`deepseek-harness/scripts/coverage-fork-diagnostics.ts:1-85@687f282e`。
2. 日志字段至少包含 `pid`、`project`、`workerId`、正在处理的 `files`、`exitCode`、`signalCode`。
3. 正常 `stop` 的退出静默；`stop` 前已发生 worker error 的退出仍然报告；`cancel` 不误报。`deepseek-harness/scripts/coverage-fork-diagnostics.ts:20-80@687f282e`。
4. 诊断层不改调度、不改失败处理；它只增加可观察性。

**角色与完成信号.** 测试基础设施维护者；完成信号是意外退出日志能定位到项目和文件，正常退出没有噪声。

**失败处理.** 看到 `coverage-worker-exit`：先看文件列表和 signal；区分 OOM/外部 kill/断言失败。不要用重试掩盖。

**例外.** 非 coverage fork pool 不需要该包装；其他 lane 可用各自的进程退出诊断。

**证据限制.** 诊断不是根因证明；仍需复现、资源监控和失败测试输出。

<a id="m10-e2e-key"></a>

## 10. M10 真实 API e2e：key 策略与信任边界

**机制 ID.** `testing-e2e-real-api-key-policy`。

**问题.** 无 key 的 e2e 只能证明管线可跑；有 key 才能证明 agent 对真实模型工作。另一方面，把 key 暴露给 fork PR 会泄露，把“全部跳过”当成绿色会假绿。

**触发.** 修改 provider/agent/工具/文件写入/多轮/取消行为；发布前；真实 API 回归。

**前提.** 已有真实 key（本地 `.env` 或 CI secret）；已确认运行环境允许外网；已确认不会产生生产副作用。

**步骤.**
1. 本地/无 key CI 运行 `pnpm run test:e2e`，套件按 key 自跳过；这把 secretless CI 和 keyless contributor 解锁，但**不是成本信号，也不是产品证明**。`deepseek-harness/docs/testing.md:23-25@687f282e`。
2. 有 key 时覆盖高价值 smoke：启动 shipped `dsh` profile、发一个 prompt、检查世界（文件、多轮、工具、取消）；这能抓住“绿单测、坏产品”。`deepseek-harness/docs/testing.md:23-25@687f282e、deepseek-harness/docs/testing.md:37-41@687f282e`。
3. CI 的 e2e workflow 只在可信事件运行；fork PR 和 Dependabot PR 被 job-level `if` 跳过，GitHub 不向它们提供 secret。`deepseek-harness/.github/workflows/e2e.yml:1-25@687f282e`、`:52-60@687f282e`。
4. **preflight 必须硬失败**：job 运行时 secret 为空则报错退出，否则自跳过会产生假绿。`deepseek-harness/.github/workflows/e2e.yml:82-99@687f282e`。
5. secret 只映射到 preflight 和 e2e step；`DEEPSEEK_BASE_URL` 显式固定，避免 repo-root `.env` 重定向；telemetry 关闭。`deepseek-harness/.github/workflows/e2e.yml:23-27@687f282e`、`:100-122@687f282e`。
6. 真实 provider 的瞬时失败可以有界重试（源仓 e2e 配置 retry 2），但这是外部边界例外；本地确定性测试不适用。`deepseek-harness/.github/workflows/e2e.yml:52-60@687f282e`。
7. 失败时报告命令、目标、实际 provider 响应/退出；不要打印 key。

**角色与完成信号.** 作者/发布负责人运行；完成信号是**有 key 的真实运行**通过，且断言检查了世界（M12），不是只看模型自述。

**失败处理.** 无 key：只能声明“管线通过/跳过”，不能声明产品通过。preflight 空：修 secret，不要放宽 preflight。provider 失败：区分外部瞬态和产品回归。

**例外.** fork/Dependabot PR 的 job-level skip 会报告为成功检查；这表示“未验证”，不是“已验证”。采用项目若把它设为 required check，必须知道这一点。

**证据限制.** 源仓能证明 workflow 和 preflight；不能证明远端 secret、分支保护或 required check 已配置。真实 key 的运行结果必须由采用项目自己保存。

<a id="m11-e2e-isolation"></a>

## 11. M11 e2e 凭据、网络与副作用隔离

**机制 ID.** `testing-e2e-credential-and-egress-isolation`。

**问题.** 真实 API 测试同时带来 key 泄露、外部网络依赖、生产遥测、代理干扰和不可控副作用。

**触发.** 新增/修改真实 API 测试、provider 配置、CI secret、网络夹具。

**前提.** 已列出测试会触达的外部端点、会写入的本地/远端状态、会继承的环境变量。

**步骤.**
1. **最小权限**：e2e workflow `permissions: contents: read`；不要给写权限。`deepseek-harness/.github/workflows/e2e.yml:29-32@687f282e`。
2. **禁止 `pull_request_target`**：它会在 base 上下文带 secret 运行不可信 fork 代码，是典型 key 泄露向量。源仓在 workflow 注释中明确禁止。`deepseek-harness/.github/workflows/e2e.yml:17-22@687f282e`。
3. **secret 作用域最小化**：只放在 preflight 和 e2e step；checkout/setup/install 步骤看不到。`deepseek-harness/.github/workflows/e2e.yml:82-99@687f282e`、`:100-122@687f282e`。
4. **固定端点**：显式设 `DEEPSEEK_BASE_URL`，避免 root `.env` 或环境把请求重定向到非预期服务。`deepseek-harness/.github/workflows/e2e.yml:23-27@687f282e`。
5. **关闭生产遥测**：CI 运行不应向生产 telemetry 端点上报。`deepseek-harness/.github/workflows/e2e.yml:23-27@687f282e`。
6. **清除 ambient proxy**：测试 setup 删除代理变量，让本地 fixture 请求不会被开发者代理截获；需要代理的测试显式设置。`deepseek-harness/scripts/test-proxy-environment.ts:1-60@687f282e`。
7. **子进程自己清环境**：spawn 真实 `dsh` 的套件不能依赖父 Vitest setup 已清代理；子进程也要清。`deepseek-harness/scripts/test-proxy-environment.ts:28-34@687f282e`。
8. **限制并发**：e2e 的 `DSH_E2E_MAX_WORKERS: 4`，避免多个完整 dsh 子进程树/PTY 争用。`deepseek-harness/.github/workflows/e2e.yml:100-122@687f282e`。

**角色与完成信号.** workflow 维护者、测试作者；完成信号是 key 不出现在日志/夹具/模型输出，测试只触达声明的端点，运行后无生产副作用。

**失败处理.** 发现 key 进入日志：立即轮换，删除日志/缓存，修 redaction；不要只删文本。代理干扰：在 setup 和子进程两侧清。外部端点不可达：区分网络/凭据/产品。

**例外.** 本地可以读 root `.env`；该文件必须 gitignore 且永不提交。`deepseek-harness/AGENTS.md:123-127@687f282e`。

**证据限制.** 源仓能证明 workflow 隔离和代理清理；不能证明 GitHub secret 的实际权限、fork 策略或历史提交中没有旧 key。采用项目需要自己的 secret 审计和历史扫描。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:457-620@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:380-475@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:849-949@687f282e`


<a id="m12-world-verification"></a>

## 12. M12 世界验证：不要相信自述

**机制 ID.** `testing-world-verification`。

**问题.** 对 agent 自己输出的关键词探针，可能被“会作弊的 agent”满足；mock 只证明桥接层移动了字节，不证明发布工具行为。

**触发.** e2e、真实入口、工具调用、文件写入、多轮、取消、持久化。

**前提.** 已明确测试要证明的**外部可观察事实**；已列出未触碰文件/目录。

**步骤.**
1. e2e 断言要**重跑命令或外部重读文件**；不要只检查 agent 的文本。未触碰文件必须字节相同。`deepseek-harness/docs/testing.md:33-35@687f282e`。
2. e2e 自己拥有资源：测试内创建，`afterEach` 处置（失败/重试/超时也执行）；共享夹具放普通 `tests/harness.ts`，不要 import 另一个 `*.e2e.ts`（会重复注册 describe、重复真实 API 调用）。`deepseek-harness/docs/testing.md:33-35@687f282e`。
3. Bridge 工具调用测试保留真实 tool registry 和 pipeline，只把模型 adapter 换成 `MockAdapter`；loop、session store、JSONL persistence 保持真实。`deepseek-harness/docs/testing.md:27-31@687f282e`。
4. Recovery 测试按 step 区分 pre/post-chunk 失败，证明失败 chunk 不产生 message/tool 副作用；覆盖耗尽、取消、策略组合、持久化、状态、wire 计数、transport idle timeout、shipping Loader composition。`deepseek-harness/docs/testing.md:33-35@687f282e`。
5. 对“missing config 应退出非零”这类失败面，断言退出码，不要断言模糊错误文本。

**角色与完成信号.** 作者写世界断言；评审者检查“如果产品什么都不做，这个断言会不会仍然通过”；完成信号是外部事实改变，而不是自述改变。

**失败处理.** 断言只读自述：改成外部读取/重跑。共享夹具被多个 e2e import：抽到 harness。未触碰文件被改：先判断产品副作用，再修。

**例外.** 纯协议解析测试可以只验证字节/帧，不需要世界断言；必须标明边界。

**证据限制.** 世界断言能证明被观察的事实；不能证明未观察的副作用。采用项目要按风险列观察面。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/snapshots/session/headless.snapshot.ts:644-672@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:817-898@687f282e`


<a id="m13-mock-boundary"></a>

## 13. M13 mock 边界：只 mock 昂贵/不确定的边界

**机制 ID.** `testing-real-implementation-mock-boundary`。

**问题.** 过度 mock 会让测试证明“mock 和 mock 一致”，而不是产品行为；mock 不足又会让测试依赖外部网络/模型/时钟。

**触发.** 新增 mock、替换 adapter、引入 test harness、修改真实入口测试。

**前提.** 已列出下游真实组件；已确认 mock 只包住外部/非确定边界。

**步骤.**
1. **只 mock 昂贵或非确定边界**：LLM adapter、网络、时钟；下游 loop、session、tool registry、persistence 尽量真实。`deepseek-harness/docs/testing.md:27-31@687f282e`。
2. 手写 stand-in 只能证明桥接层移动字节；如果断言的是 shipping tool 行为，必须保留真实工具/管线。`deepseek-harness/docs/testing.md:27-31@687f282e`。
3. 选择 harness 时写清“它替换了什么、保留了什么、不能证明什么”。见 M33 的包选择表。
4. Remote mock 只用于 HTTP Remote 表面；测试专用 `any` 是显式本地 fallback，不是严格证据；交付前跑 `pnpm run typecheck`，不要把例外带进生产 Remote 类型/ambient flag/复制签名。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:33-35@687f282e`。
5. `llm-mock-server` 只作为无凭据的远端协议替身；它不证明真实 provider 的 wire/限流/认证。`deepseek-harness/packages/test-support/llm-mock-server/README.md:10-80@687f282e`。

**角色与完成信号.** 作者选择边界并记录；评审者问“如果真实实现坏了，这个 mock 测试会不会仍然绿”；完成信号是断言点落在真实下游行为上。

**失败处理.** mock 测试绿但真实入口坏：升级到 M14/M10。mock 类型不严格：跑 typecheck，修类型而不是加 `any`。

**例外.** 纯单元测试可以用 fake 替代整个协作者；但必须明确它不证明集成。

**证据限制.** 任何 mock 都不能证明被替换边界之外的现实；采用项目要记录 mock 清单和未覆盖风险。

<a id="m14-real-entry"></a>

## 14. M14 真入口组合：Loader + app/process

**机制 ID.** `testing-real-entry-composition`。

**问题.** 手工 `ctx.plugin(...)` 组合能证明服务能拼起来，但不能证明 shipped profile、Loader 配置、默认导出、进程启动和持久化在真实入口下工作。

**触发.** 产品可见插件、Loader 组合、profile、CLI/headless/SDK/ACP 入口、默认导出/命名导出变更。

**前提.** 有可启动的 test-only `cordis.yml` 或 shipped profile；已确认哪些外部服务要 mock；已确认进程退出码/输出/持久化位置。

**步骤.**
1. 产品可见插件需要**非单元的真实组合测试**：通过 Loader 和 app/process 启动 test-only `cordis.yml`，只 mock 外部服务/非确定输入，断言模型可见请求/日志、持久状态或用户可见输出；opt-in 不要放进 shipped defaults。`deepseek-harness/docs/testing.md:37-41@687f282e`。
2. Loader smoke 要能抓住“默认导出替换命名导出”这类回归：加 `expect('default' in mod).toBe(false)` 和 `unwrapExports` 往返断言，并实际引入回归观察变红。`deepseek-harness/docs/testing.md:40-41@687f282e`。
3. “真实入口”指**发布产物**：包 `bin` 在 plain `node` 下运行 built `lib/bin.js`，暴露 tsx 掩盖的 settle race、模块解析、被吞掉的加载失败；非 index runtime entry（如 `lib/process.js`）和跨 bundle 单例同样要 built smoke。`deepseek-harness/docs/testing.md:41@687f282e`。
4. 子进程启动模式：有 build 的 lane 通过 shared dual-mode launcher 从 built `lib/` 启动 profile/Cordis 子进程，不要手写 `--import tsx`；不加载 Cordis 的协议/OS 夹具直接用 Node 跑 erasable `.ts`；只有测试主题是 source-path resolution 时才选 `src`，并在测试里声明该契约。`deepseek-harness/docs/testing.md:47-51@687f282e`。
5. 断言真正缺失的配置退出非零，而不是只断言“有错误输出”。

**角色与完成信号.** 作者/评审者；完成信号是真实入口进程启动、外部事实被断言、构建产物被使用，而不是只调用服务方法。

**失败处理.** 手工组合绿、Loader 红：修默认导出/配置，不要退回手工组合。built smoke 红、source 绿：检查构建/导出/模块解析。

**例外.** 纯逻辑单元测试不需要真入口；协议/OS 夹具不需要 Cordis。

**证据限制.** 真入口测试仍可能 mock 外部 provider；不能替代 M10 的真实 API 证据。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:300-1211@687f282e`


<a id="m15-source-built"></a>

## 15. M15 源平面与构建平面：两套入口，不混用

**机制 ID.** `testing-source-built-entry-modes`。

**问题.** 源码测试通过不等于发布产物可用；构建产物过期会让测试加载第二份单例；而所有测试都走构建又会慢且掩盖源码问题。

**触发.** 修改 package exports、bin/worker 入口、构建配置、公共类型、发布路径；编写 built smoke；CI artifact lane。

**前提.** 已确认测试要证明的是源码行为还是发布产物行为；已确认构建产物是否存在/是否最新。

**步骤.**
1. **源平面是默认**：每个 Vitest config 都把 `vite-tsconfig-paths` 指向 `tsconfig.base.json`；bare workspace import 解析到 `src`，绝不通过 package `exports` 到 built `lib/`——过期的 lib 会加载第二份 module singleton。`deepseek-harness/docs/testing.md:43-45@687f282e`。
2. **构建平面显式选择**：lib-mode子进程、built smokes、`DSH_EXAMPLE_MODE=lib`。`built-bin-smoke`注册于`ci-primary`、`ci-artifacts`、`ci-consumers`及Windows observational等路径，分别等待`build`或该lane声明的builtTree前提，并非只属于consumers。`deepseek-harness/scripts/run-gates.ts:420-425@687f282e`、`deepseek-harness/scripts/run-gates.ts:510-555@687f282e`、`deepseek-harness/scripts/run-gates.ts:637-645@687f282e`
3. **构建检查不是构建**：`build:check` 只对现有 artifacts 跑 `tsc -p` 两个 aggregate，检查 tests/scripts/benchmarks/website；它不编译 reference，也不会重建缺失/过期的 `build:artifacts`；缺失会以编译器错误出现。`deepseek-harness/docs/development.md:94-120@687f282e`。
4. 正确顺序：改包源码 → `pnpm run build:artifacts`（或 `pnpm run build`）→ `pnpm run build:check`；只改测试/脚本类型时，在最新 artifacts 上跑 `build:check`。`deepseek-harness/AGENTS.md:117-121@687f282e`。
5. **构建记录绑定公共值**：`build`/`build:artifacts` 写入版本、7 位 commit、dirty 标记（`build:official` 省略 dirty）；release packing 和 built Web tests 拒绝缺失或被后续 partial build 改动的记录。`deepseek-harness/docs/development.md:112-120@687f282e`。
6. **built Web snapshot** 用 `DSH_SNAPSHOT=replay pnpm run test:web:built`，由 `ci-consumers` 在 build 后运行；`test:web` 会先 build，再跑 built。`deepseek-harness/scripts/run-gates.ts:574-578@687f282e`、`deepseek-harness/package.json:76-80@687f282e`。
7. built smoke 在未构建的 e2e lane 自跳过；**跳过不是证明**。`deepseek-harness/scripts/run-gates.ts:903-906@687f282e`。

**角色与完成信号.** 作者选择平面；CI 维护者保证 build→consumer 依赖；完成信号是 built smoke 实际运行（不是 skip），且 source tests 在干净树上通过。

**失败处理.** source 绿/build 红：查 exports、bin、模块解析、单例。build:check 报缺失：先 build，不要改测试绕过。built smoke skip：确认 lane 是否真的构建。

**例外.** benchmark 准备可用 `--noCheck` 生成一次性 lib，依赖 required build 提供诊断；其他 artifact builder 保留包检查。`deepseek-harness/docs/development.md:110-116@687f282e`。

**证据限制.** 源平面测试不能证明发布 tarball；built smoke 能证明选中的入口，不能证明所有发布组合。采用项目需要自己的打包/安装测试。

<a id="m16-snapshot-required"></a>

## 16. M16 快照何时必需、放在哪里

**机制 ID.** `testing-snapshot-required-and-placement`。

**问题.** 单元测试、mock 测试和 e2e 都可能绿，但组装后的模型可见转录、工具 schema、系统提示和持久化结果已经变了；反过来，把非会话输出塞进顶层 `snapshots/` 又会让“快照 = 会话驱动”的所有权失效。

**触发.** 任何非平凡的模型、协议或人可见改动；`SessionEventMap`、agent-loop、session-lifecycle、能力缝、生命周期/转录变体。

**前提.** 已确认改动是否有组装后的 transcript；已确认它是否由 recorded session 驱动。

**步骤.**
1. **同一 PR 增加/更新 keyless recorded-session 场景**；package、e2e、mock-only 和 rationale 证据不能替代组装 transcript。`deepseek-harness/docs/testing.md:53-55@687f282e`。
2. 按入口放目录：headless → `snapshots/session/`；SDK → `snapshots/sdk/`；ACP → `snapshots/acp/`；Web → `snapshots/web/`；Web 渲染可以显式借用另一个场景的 canonical session。`deepseek-harness/docs/testing.md:53-55@687f282e`。
3. **非 recorded-session 驱动的期望输出留在所有者旁边**：`tests/expected/`，不要放 `snapshots/`，不要用 `*.snapshot.ts` 后缀；browser expectations 用 `test:web`，package/script expectations 用 `test`。`deepseek-harness/docs/testing.md:53-55@687f282e`、`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:35-39@687f282e`。
4. **两个 SDK 同 PR**：agent-loop/session-lifecycle/`SessionEventMap` 改动更新 TypeScript 和 Python 期望输出；`pnpm run test` 不覆盖这两套期望输出，须选择各自 owning lane；Python runtime 的相关车道使用 `scripts/snapshots/python-sdk-single-exe/`。`deepseek-harness/AGENTS.md:161@687f282e`。
5. 计划阶段就列出 unit/e2e/snapshot 覆盖：能力缝、生命周期路径、transcript 输出；缺 snapshot harness 支持要在同一改动里补。`deepseek-harness/AGENTS.md:161-163@687f282e`。
6. Web 渲染若借用场景，必须在 manifest/注释中写明借用关系，不要复制一份会漂移的 session。
7. **跨平台夹具而非适配夹具的归一化**：源要求夹具在macOS/Linux回放，修夹具而非修改normalizer来迁就它。M21仍只去除真正环境噪声，不得normalize掉行为差异；这一要求不等于已观察到两平台运行。`deepseek-harness/AGENTS.md:158@687f282e`。

**角色与完成信号.** 作者判断是否必需并放对位置；评审者检查“这改动是否改变了用户/模型可见的组装输出”；完成信号是 keyless replay 场景存在、通过、差异被审查。

**失败处理.** 不确定是否必需：看是否改变模型请求/持久化/用户可见输出；是则加。放错目录：移动并更新 manifest/配置，不要留副本。

**例外.** 机械/局部编辑、无模型或用户可见输出的改动可以不加；但要在 PR 说明理由。`deepseek-harness/AGENTS.md:158-160@687f282e`。

**证据限制.** 快照证明录制 transcript 的组装结果，不证明真实 provider 接受该请求（M10）或发布产物可运行（M15）。

<a id="m17-manifest-guards"></a>

## 17. M17 Snapshot manifest 与机械守卫

**机制 ID.** `testing-snapshot-manifest-and-guards`。

**问题.** 目录重命名会留下无用的旧快照；sidecar 可以悄悄漂移；header pin 可以为零或重复；committed JSONL 可以不是 canonical；仅靠人工审查无法保证。

**触发.** 新增/重命名/删除场景；修改 `snapshot.yml`；修改 sidecar；修改 fixture 存储格式。

**前提.** 场景目录已注册；`snapshot.yml` 能被严格解析。

**步骤.**
1. **`snapshot.yml` 只写声明字段**：`profile`（`headless`/`sdk`/`sdk-minimal`/`acp`/`web`）、`composition`、`header`、`recording`、workspace facts 等；`session` 是**只读借用者引用**（目录自己拥有 selected parent 时省略），不是 ACP 专用；`workspace.final: true` 表示最终 workspace 与初始不同。解析器用 `exactKeys` 拒绝未知/不一致字段。`deepseek-harness/snapshots/AGENTS.md:7-9@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/manifest.ts:100-125@687f282e`, `deepseek-harness/packages/test-support/session-snapshot/src/manifest.ts:213-231@687f282e`, `deepseek-harness/packages/test-support/session-snapshot/src/manifest.ts:374-380@687f282e`。
   - **字段值守卫**：YAML 用 `JSON_SCHEMA`，拒绝自定义 tag；`replay.override` 只能 `true`；`platform` 只能 `posix|pwsh`；`permission` 只能 `read-only|workspace-write|danger-full-access`；environment 键匹配 `^[A-Z][A-Z0-9_]*$` 且值为 string；workspace 非空，`final` 只能 `true`、`parent` 只能 `outside-temp`。
   - **输入形状**：input 声明非空 task 或非空 attachments；每个 attachment 只含 id/mediaType/data，id 以 `sha256:` 开头且不重复、mediaType 含 `/`、data 是非空 string。源诊断称 MIME/base64，但没有验证完整 MIME/base64 语法，也不证明摘要正确。
   - **历史借用边界**：session.source 非空，拒绝绝对路径、反斜杠与 NUL；sessionFormat.version 是非负 safe integer 且不为 `-0`，coverage 是非空、唯一的 supported 名称；借用 session 时不能同时声明 sessionFormat。依据：`deepseek-harness/packages/test-support/session-snapshot/src/manifest.ts:204-206,285-405@687f282e`；`deepseek-harness/packages/test-support/session-snapshot/tests/manifest.spec.ts:181-207@687f282e`。这些 parser 单测不证明 suite/disk 守卫或场景语义；本次未执行。
2. **目录注册守卫**：`snapshots/<dir>` 必须与场景表一一对应；重命名/删除场景留下的孤儿目录必须失败。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1604-1612@687f282e`。
3. **场景角色与命名**：每个场景 own 或显式 reference 一个 primary Session role 加 contiguous child roles；parent 为 `session[.vN].jsonl`，child 为 `session.<ordinal>[.vN].jsonl`；`v0` 省略、正版本小写、文件名与 header 一致；replay/record/refresh 选最高代际；普通 one-shot 从 selected JSONL 派生 user task 和 replay script，不要重复写 `input.json`；shared reference 只读、无环、指向 owner 的 selected parent generation，record/refresh 不重命名或删除已提交代际。`deepseek-harness/snapshots/AGENTS.md:7-9@687f282e`。守卫还要求每个场景目录有 `snapshot.yml`、`input.json`、`stdout.expected.jsonl` 和 primary session fixture；`profile` 必须等于 agent profile 或 `acp`，ACP 场景的 `manifest.session` 必须为 undefined（自己拥有 session）。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1613-1650@687f282e`。
4. **sidecar 与声明一致**：`pinsChildToolSchemas`/`pinsChildSystemPrompts` 的索引必须与磁盘上的 `tool-schemas.<n>.expected.json`/`system-prompt.<n>.expected.md` 完全一致；`pinsNativeWindowsStdout` 控制 Windows stdout 文件；`overridden` 控制 `replay.override.json`；prompt/schema sidecar 只能由 owner 持有。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1615-1650@687f282e`。
5. **header pin 守卫**：每个 header class 恰好一个 pinning 场景；零 pin 会丢掉该类的结构表面，两个会把表面拆开；所有场景的 class 必须有 pin。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1660-1676@687f282e`。
6. **pin 组合守卫**：pinning fixture 的 header 序列、prompt 序列、tool-schema 序列、`expectedHeaderChanges`、`expectedPromptChanges` 必须互相匹配；prompt 非空且以 newline 结尾；schema 用 canonical JSON；每个不同 prompt/schema 只存一份。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1678-1710@687f282e`。
7. **child pin 守卫**：声明的 child 索引必须指向真实 `session.<n>.jsonl`；sidecar 必须 canonical，且 prompt pin 与 class pin 的初始 prompt 一致。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1712-1735@687f282e`。
8. **committed JSONL 存储守卫**：prompt 文本/tool schema 离开 JSONL；每个模型请求前有 logged system prompt；portable cwd token 不保留平台 realpath 前缀；固定点检查失败即报。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1737-1745@687f282e`。
9. **文件名守卫**：`expected-filenames.yml` 在 PR/push 运行 `scripts/check-expected-filenames.sh`；它禁止 tracked non-vendor 文件名包含 `golden`，要求改用 `expected` 等准确术语；这不是 `.jsonl` 语法校验。`deepseek-harness/.github/workflows/expected-filenames.yml:1-28@687f282e`、`deepseek-harness/scripts/check-expected-filenames.sh:1-26@687f282e`。
10. **fixture 布局脚本**：`canonicalSessionFixture()` 对当前格式重排为 one-event-per-row、去掉 seq/time envelope；对历史版本严格解码但**保持字节不变**；重写后做 payload 等价和幂等检查；错误带物理行/事件行。`deepseek-harness/scripts/session-fixture-layout.ts:220-275@687f282e`。

**角色与完成信号.** 作者维护 manifest/sidecar；评审者看守卫是否覆盖新增表面；完成信号是 snapshot fixture 守卫套件全绿，孤儿/缺失/不一致都显式失败。

**失败处理.** 孤儿目录：注册或删除，不要留。sidecar 不匹配：改声明或文件，不要放宽守卫。canonical 失败：看脚本给出的行号，修 fixture 或迁移逻辑。

**例外.** ACP 场景拥有自己的 session；Web 可以借用 canonical session；physical fixture（WebWorker/installed runtime）不由布局脚本改写。`deepseek-harness/scripts/session-fixture-layout.ts:20-50@687f282e`。

**证据限制.** 机械守卫证明结构和声明一致，不证明场景语义覆盖了真实风险；仍需 M16/M19 的选择判断。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/session-fixture-layout.ts:61-219@687f282e`、`deepseek-harness/scripts/session-fixture-layout.ts:276-294@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1728-1788@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1200-1225@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1135-1192@687f282e`


<a id="m18-selection"></a>

## 18. M18 场景选择、命名与代际

**机制 ID.** `testing-snapshot-selection-and-generations`。

**问题.** 同一角色有多个父/子 session 时，选错代际会让 replay 输入和期望输出不匹配；命名不一致会让发现逻辑漏文件。

**触发.** 新增/迁移 session fixture；格式版本升级；子代理场景。

**前提.** 每个文件 header 的 version 已知；manifest 已列出角色。

**步骤.**
1. **命名**：父角色 `session[.vN].jsonl`；子角色 `session.<ordinal>[.vN].jsonl`；`v0` 省略（不要写 `.v0`）；正版本用小写 `.vN`；文件名必须与 header version 一致。`deepseek-harness/docs/testing.md:53-55@687f282e`。
2. **选择最高代际**：replay、record、refresh 都按角色选最高 `vN`；同一角色出现重复 generation 要失败；只发现 manifest 声明的文件，不能靠 glob `session-*` 猜。`deepseek-harness/docs/testing.md:53-55@687f282e`、`deepseek-harness/snapshots/AGENTS.md:7-9@687f282e`。
3. **主 fixture 必需**：每个场景至少一个 primary session；child 索引从 1 开始；`session.<n>` 必须对应真实 child。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1613-1650@687f282e`。
4. **当前格式与历史格式分开**：当前 writer 格式在文件名/header 中声明，one row per event，embedded compact Assistant streams；历史 fixture 保留 released representation；显式 `sessionFormat` owner 保留迁移覆盖，不要为了整齐把历史字节重写。`deepseek-harness/docs/testing.md:17@687f282e`、`deepseek-harness/docs/testing.md:53-55@687f282e`、`deepseek-harness/scripts/session-fixture-layout.ts:230-270@687f282e`。
5. **物理 fixture**：WebWorker VFS 和 installed-runtime 的 session JSONL 保留物理编码，不参与 canonical 投影。`deepseek-harness/scripts/session-fixture-layout.ts:20-50@687f282e`。

**角色与完成信号.** 作者命名/放置；评审者检查版本和 header 一致；完成信号是发现逻辑只读到预期文件，最高代际被使用，重复/缺失显式失败。

**失败处理.** 文件名与 header 不一致：改名或改 header，不要只改一侧。重复 generation：删除/合并，不要赌排序。历史 fixture 被重写：从源恢复，修脚本的跳过条件。

**例外.** 无版本号的协议 fixture 和当前 projected snapshot 使用 scalar event rows；仍然走同一发现/校验。`deepseek-harness/scripts/session-fixture-layout.ts:130-145@687f282e`。

**证据限制.** 命名/代际守卫不证明内容语义；见 M19/M20。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/test-support/session-snapshot/src/session-files.ts:84-253@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:145-199@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1131-1172@687f282e`


<a id="m19-corpus"></a>

## 19. M19 录制语料政策（corpus）

**机制 ID.** `testing-snapshot-corpus-policy`。

**问题.** 只保留“最新的一个”会话会让格式迁移、旧工具、旧 profile 的兼容性失去输入；但把所有历史都塞进 replay 又会让语料无限膨胀。corpus 政策定义“保留哪些代际、每个代际必须覆盖什么”。

**触发.** 修改 session 格式/持久化/模型可见输出；新增/重录 corpus 场景；升级默认格式版本。

**前提.** 场景目录有 `corpus: true` 标记；每个 retained 代际声明 coverage；当前版本已知。

**步骤.**
1. **corpus 目录**：`corpus: true` 的场景必须在 `snapshot.yml` 中声明保留代际和 coverage；不是所有快照都是 corpus。`deepseek-harness/snapshots/AGENTS.md:9-17@687f282e`。
2. **角色独立计数**：parent 和 child 的 current/baseline 角色分别计数；混合代际不能把一个角色的覆盖算到另一个。`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:43-58@687f282e`。
3. **V3 baseline 作为迁移输入**：源仓要求保留 V3 多数作为 migration input，不要求每个 V3 都有 current successor；current writer owner 可以并存。`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:17-33@687f282e`。
4. **相邻迁移边直接覆盖**：每个 adjacent version（如 v1/v2）必须由该代际的 fixture 直接覆盖，不能借用另一个代际的 coverage 标签；缺边即失败。`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:75-100@687f282e`。
5. **V0 覆盖**：V0 retained fixture 必须声明 `multi-hop`、`packed-row`、`retry-failure`、`shipped-profile`；缺少即失败。`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:75-100@687f282e`。
6. **retired tools**：可以在 current format 中保留 retired tool 场景，但不能声称 migration coverage；retained version 必须早于 current。`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:60-74@687f282e`。
7. **重录/刷新不能洗掉 corpus**：replay/refresh 选择最高代际，但 corpus suite 必须继续覆盖所有 retained 代际；refresh 掉最后的 V3 输入会被政策测试拒绝。`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:60-74@687f282e`。
8. 运行完整 corpus suite，而不是只跑 `-t` 过滤；改变格式/持久化/模型可见输出时尤其如此。

**角色与完成信号.** 作者维护 corpus 标记/coverage；评审者检查“这次重录是否删掉了迁移输入”；完成信号是 corpus policy 测试 + 完整 snapshot 套件通过。

**失败处理.** 缺 v3/v0/相邻边：补 fixture，不要改政策标签绕过。retained 版本晚于 current：修正声明。重录导致覆盖丢失：恢复旧 fixture 或补替代。

**例外.** 新生成、尚未进入 corpus 的场景可以不标；一旦标记，就必须满足角色/代际/覆盖约束。

**证据限制.** 政策检查的是标签和生成关系，不证明 fixture 语义质量；需要人工审查 + replay 通过。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1200-1225@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1746-1760@687f282e`


<a id="m20-modes"></a>

## 20. M20 快照模式：replay / record / refresh

**机制 ID.** `testing-snapshot-modes`。

**问题.** 录制模式会写入真实 provider 输出；刷新模式可能在“看起来只是更新 fixture”时把回归一起批准；回放模式必须 keyless 且能发现不一致。

**触发.** 模型转录变化；行为修复后 replay 输入仍有效；新增场景；格式迁移。

**前提.** replay 无需 key；record 需要可用 provider；refresh 要求旧 replay 输入仍有效。

**步骤.**
1. **默认 replay**：`pnpm run test:snapshot`，keyless，通过 shipped profile 回放 recorded session；CI 用 `DSH_EXAMPLE_MODE=lib` 启动 built lib。`deepseek-harness/AGENTS.md:88-93@687f282e`、`deepseek-harness/scripts/run-gates.ts:747-754@687f282e`。
2. **record**：`DSH_SNAPSHOT=record pnpm run test:snapshot:record`（`--update`），需要真实 provider；只用于新增/模型转录变化。`deepseek-harness/package.json:69-72@687f282e`。
3. **refresh**：`DSH_SNAPSHOT=refresh pnpm run test:snapshot:refresh`，在 replay 输入仍有效时刷新期望输出；不要用它掩盖行为变化。`deepseek-harness/package.json:71@687f282e`。
4. **并发语义**：replay 用 `describe.concurrent`；record/refresh 串行，避免共享 provider/端口/输出竞争。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1226-1234@687f282e`。
5. **record 不依赖旧输出**：record 的 `fixtureFiles` 为空，写入版本化输出；refresh 读取旧 fixture 以保留 volatile 值（identity/catalog time 等）。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1360-1405@687f282e`。
6. **只读保留**：authored-only 场景在 record 时跳过（没有 live run 可录）；retained sessionFormat 不被 refresh 改写。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1300-1360@687f282e`。
7. **record/refresh 写**：session logs、stdout、sidecars；replay 比较所有输出。`snapshot.yml` 的 `workspace.final` 决定是否比较 `workspace.expected/`；record/refresh **不**重写 workspace oracle。`deepseek-harness/docs/testing.md:53-55@687f282e`。
8. **每个 fork 的退出必须断言**：子进程被信号/超时结束时，报告“超时/被杀”，不要伪装成 status mismatch。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:105-108@687f282e`。
9. **审查每个 diff**：record/refresh 的输出是人工审查对象，不是自动批准。`deepseek-harness/docs/testing.md:53-55@687f282e`。

**角色与完成信号.** 作者选择模式并审查 diff；评审者检查是否有“refresh 批准回归”；完成信号是 replay keyless 通过，record/refresh 的 diff 有解释。

**失败处理.** replay 失败：先判断行为变化还是 fixture 过期；行为变化修代码，fixture 过期才 refresh。record 失败：看 provider/凭据/场景；不要改成 skip。workspace 差异：先判断产品副作用，再决定是否声明 `workspace.final`。

**例外.** 真实 provider 不可用不能伪造 record；可以只提交 replay fixture（来自已有录制）并在 PR 说明。retained 历史格式不因 refresh 重写。

**证据限制.** record 捕获的是当时 provider 输出；refresh 只证明新输出与旧输入一致，不证明产品正确。replay 不证明真实 wire（M26）。

10. **按适配器与 composition 分支核对 replay/live 补丁**：headless 按“基础 `cordis.yml` → 选中 composition 的 live `cordis.yml` 或 replay `cordis.snapshot.yml` → 基础 `model.cordis.yml` → 可选场景 `runtime.cordis.yml`”组合；选中基础 composition 且为 live 时不重复追加它。SDK 必须先分支：`composition` 以 `sdk-` 开头时，保留该 owner 的 `cordis.yml`，replay **再追加**同 owner 的 `cordis.snapshot.yml`，不追加默认 `model.cordis.yml`；其他 transport-neutral composition 才使用默认基础、选中 live/replay overlay、默认 model 的顺序，默认 owner 的 live 不重复追加。不能将通用 launcher 的“replay 替换选中 patch”套到 SDK 专用分支：launcher 的 `profileArgs()` 使用 `[base, replayPatchPath(selected)]`，app-boot 的 `resolveConfigPath()` 则只在 replay 改写请求 config 的 basename；两者各有自己的调用范围。`deepseek-harness/snapshots/session/headless.snapshot.ts:1252-1262@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:551-562@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/launcher.ts:343-369@687f282e`、`deepseek-harness/packages/boot/app-boot/src/index.ts:95-112@687f282e`。
11. **overlay 语义审阅仍未闭合**：overlay 文件仍没有逐文件语义审阅记录；本参考只保留这一未闭合事实，具体批次读取清单属于研究取证，不作为操作参考的机制属性。组合顺序有代码引用，不等于全部配置语义或与 manifest composition 名称的一致性已验；简单行扫描也不能代替 YAML 或语义审查。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/web/tests/scaffold.ts:132-140@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:1097-1145@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1135-1192@687f282e`


<a id="m21-normalization"></a>

## 21. M21 归一化：只抹环境噪声

**机制 ID.** `testing-snapshot-normalization`。

**问题.** 不归一化会让 cwd、session id、时间戳、spill 路径在不同机器上产生 diff；归一化过头会把真实行为差异一起抹掉。

**触发.** 新增/修改 fixture；跨平台 replay 失败；spill/temp 路径变化；身份 token 调整。

**前提.** 已列出“环境拥有”的字段和“行为拥有”的字段。

**步骤.**
1. **cwd**：替换所有已知拼写（含 macOS `/private` 前缀），最长优先，边界匹配，避免误伤共享前缀；只对 cwd-rooted path 做分隔符规范化，不全局重写反斜杠（会破坏正则/命令/模型文本）。`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:100-190@687f282e`。
2. **spill 路径**：`{{spillLocator:<name>}}` 只替换 harness 拥有的本地/snapshot spill 路径；不要把任意临时路径都 token 化。`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:180-205@687f282e`。
3. **event-read 时间**：只对 exact event-read 结果的 fenced target 区域替换 `{{eventTime}}`/`{{eventOmittedBytes}}`，邻居/模型/bash 文本保持可见。`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:195-215@687f282e`。
4. **identity**：session/child id、UUID、`messageId` 按 `identityMode` 处理；`preserve` 保留已 redact 的 typed id 和任意 UUID-like prose，`legacy` 做全局替换。`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:25-45@687f282e`、`:205-220@687f282e`。
5. **两边同 context**：actual 和 expected 都用 `fixtureContext`/同一 `NormalizeContext` 归一化；不要只归一化 actual。`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:60-75@687f282e`。
6. **保留行为**：模型文本、工具参数、错误、未触碰文件内容保持原样；不要为了让 diff 变短而扩大 token。`deepseek-harness/packages/test-support/session-snapshot/README.md:30-70@687f282e`。
7. **canonical/fixed point**：fixture 重写要幂等，payload 等价；历史版本不重写。`deepseek-harness/scripts/session-fixture-layout.ts:230-270@687f282e`。
8. **native writer output**：捕获平台原生 writer 输出时用 `nativeWriterOutput: true`，不要套用 source-vs-migrated 的默认比较。`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:15-25@687f282e`。

**角色与完成信号.** 作者维护 token 列表；评审者检查“这个 diff 被抹掉的是环境还是行为”；完成信号是跨平台 replay 稳定，真实行为差异仍可见。

**失败处理.** 新环境噪声：加最小 token，并写测试。差异是行为：修代码/审查，不要加 token。token 误伤：收窄边界/路径根。

**例外.** 平台专属 golden 可以保留 native 分隔符（`cwdPathMode: 'native'`）；但要在说明中写清楚。`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:1-15@687f282e`。

**证据限制.** 归一化测试能证明 token 的局部行为；不能证明所有环境噪声都被覆盖。采用项目需要跨平台 fixture 证据。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/web/tests/scaffold.ts:1010-1198@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:301-665@687f282e`


<a id="m22-identity"></a>

## 22. M22 身份、凭据与 typed token

**机制 ID.** `testing-snapshot-identity-and-credentials`。

**问题.** 录制 transcript 会包含 session/child id、工具名、schema、凭据引用；直接提交会泄露秘密或让父子关系失真。

**触发.** 新增 fixture；修改工具/schema/身份；auth recovery 场景；凭据相关测试。

**前提.** 已列出需要保留的身份关系（parent/child、tool owner、schema owner）。

**步骤.**
1. **typed token 只用于稳定身份**：session/child id、工具名、tool schema、认证恢复标记等；token 必须能还原父子关系，不能把两个不同 child 合并。`deepseek-harness/packages/test-support/session-snapshot/README.md:30-70@687f282e`。
2. **只有 header pin 拥有 prompt/schema sidecar**：其他场景引用 owner，不要复制；sidecar 内容用 canonical 格式，且唯一。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1678-1710@687f282e`。
3. **凭据不落盘**：fixture 中不出现真实 key/token/密码；mock key 只用于本地 mock server。`deepseek-harness/AGENTS.md:123-127@687f282e`、`deepseek-harness/packages/test-support/llm-mock-server/README.md:40-50@687f282e`。
4. **auth recovery**：恢复场景要断言认证恢复后的 header/请求形状，而不是只断言“重试了”。工具 schema 用 token 引用，避免把整个 schema 复制进 JSONL。`deepseek-harness/packages/test-support/session-snapshot/README.md:50-70@687f282e`。
5. **提交前扫描**：检查 expected/fixture 中的 `sk-`、`Authorization`、`apiKey`、环境变量值；不确定时按秘密处理并轮换。

**角色与完成信号.** 作者维护 token/owner；评审者检查秘密和父子关系；完成信号是 fixture 不含真实凭据，identity 关系可还原，sidecar 唯一。

**失败处理.** 发现秘密：轮换、删除/重写历史、修 token 化；不要只删当前文件。父子关系错：修 token/owner，不要复制 fixture。

**例外.** 测试专用的假 key（如 `mock-key`）可以存在；必须明显不是生产凭据，且只指向本地 mock。

**证据限制.** token 化能降低泄露面，但不能证明历史提交/日志没有秘密；需要独立 secret 扫描。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:611-786@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1280-1373@687f282e`


<a id="m23-header-pins"></a>

## 23. M23 Header pins：系统提示与工具 schema 的单一所有者

**机制 ID.** `testing-snapshot-header-pins`。

**问题.** 每个场景都存一份 system prompt/tool schema 会漂移；没有 pin 又会丢掉某类请求的结构表面；多个 pin 会拆分同一表面。

**触发.** 修改系统提示、工具 schema、header class、请求组装；新增 profile。

**前提.** 已枚举 header class（默认/子代理/profile 变体）；知道每个 class 的 owner 场景。

**步骤.**
1. 每个 header class **恰好一个** `pinsHeader: true` 场景；零个失败，两个失败。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1660-1676@687f282e`。
2. pin 场景声明 `systemPromptSource`、`toolSchemasSource`、`expectedHeaderChanges`、`expectedPromptChanges`；这些字段只允许出现在 pin 场景，非 pin 出现即失败。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1240-1255@687f282e`。
3. pin sidecar 存**完整但 token 化**的 prompt/schema：初始 + 每次变化；schema 用 canonical JSON；prompt 非空且以 newline 结尾；不同 class 的 sidecar 内容唯一。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1678-1710@687f282e`。
4. pin fixture 的 header 数 = `1 + expectedHeaderChanges`；prompt 数 = `1 + expectedPromptChanges`；schema 序列长度与 header 数一致；每个 header 的 tools 用 sidecar token。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1678-1710@687f282e`。
5. 子代理场景可以额外 pin child schema/prompt；索引必须指向真实 child，且 prompt 与 class pin 的初始 prompt 一致。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1712-1735@687f282e`。
6. 修改 header 时同时更新 pin sidecar、`expected*Changes` 和 fixture；不要只改 fixture 让 replay 绿。

**角色与完成信号.** 作者维护 class→pin 映射；评审者检查“这个新 header 变体有没有 owner”；完成信号是 pin 守卫全绿，header 变化有可见 diff。

**失败处理.** 零 pin：加一个 owner。两个 pin：合并/删除。sidecar 漂移：改 owner 或引用，不要复制。计数不匹配：修 fixture/声明。

**例外.** header class 可以继承；pinning 场景可以是某个 class 的唯一场景，此时没有非 pin 的 live run 来发现未声明变化，所以必须直接断言 committed pin。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1684-1692@687f282e`。

**证据限制.** pin 证明组装后的 header 形状，不证明 provider 接受；真实 provider 仍由 M10 覆盖。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1411-1584@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:442-443@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:279-325@687f282e`


<a id="m24-workspace"></a>

## 24. M24 Workspace oracle：完整最终树

**机制 ID.** `testing-snapshot-workspace-oracle`。

**问题.** 只断言“某个文件存在”会漏掉额外文件、残留临时目录、错误内容；record/refresh 又可能顺手把产品副作用写进期望。

**触发.** 场景会改 workspace；工具写文件；子代理/持久化；新增 `.tmp`/spill 行为。

**前提.** 场景声明了初始 workspace；已确认最终 workspace 是否应改变。

**步骤.**
1. **默认最终 = 初始**：非 mutating 场景断言 `finalWorkspace` 与 `initialWorkspace` 完全相等；出现任何额外/修改文件即失败。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1585-1605@687f282e`。
2. **mutating 场景显式声明** `workspace.final: true`，并提交完整的 `workspace.expected/` 树；断言最终树与期望树完全相等。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1590-1605@687f282e`。
3. **record/refresh 不重写 oracle**：`workspace.expected/` 是独立的人工审查产物；录制/刷新只写 session/stdout/sidecar。`deepseek-harness/docs/testing.md:53-55@687f282e`。
4. **等待静止后捕获**：先等子进程/工具/持久化完成，再捕获树；不要用固定 sleep。`deepseek-harness/packages/test-support/session-snapshot/src/workspace.ts:1-113@687f282e`。
5. **清理自有临时目录**：`.tmp`/spill/owned tree 在断言前删除；不要让 harness 自己的残留进入 oracle。`deepseek-harness/packages/test-support/session-snapshot/README.md:50-60@687f282e`。
6. **隐藏/未跟踪文件**：捕获要覆盖完整树（含隐藏文件），但排除明确不属于 workspace 的外部路径；规则要写在 manifest/owner 文档。

**角色与完成信号.** 作者声明 mutating 并提交期望树；评审者检查“这个额外文件是产品行为还是测试残留”；完成信号是完整树比较通过，失败能指出具体路径。

**失败处理.** 额外 `.tmp`：先修清理，不要加 ignore。真实新输出：更新 oracle 并审查内容。非 mutating 场景改了文件：判断产品副作用，必要时改声明并解释。

**例外.** 只读场景不需要 `workspace.final`；没有 workspace 的场景不适用。

**证据限制.** oracle 证明该 workspace 内的文件树，不证明外部文件系统/网络副作用。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/web/tests/scaffold.ts:146-158@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1199-1220@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:817-835@687f282e`


<a id="m25-network"></a>

## 25. M25 Loopback HTTP fixture：生命周期、映射与代理隔离

**机制 ID.** `testing-snapshot-network-fixtures`。

**问题.** Snapshot fixtures 需要 loopback HTTP，但 ambient proxy 会把请求送错、启动/销毁竞争会留下 listener/连接、fetch 映射会丢失 method/headers、后来的 wrapper 会被覆盖。

**触发.** 场景触达外部 HTTP；search/loopback fixture；auth recovery/download；Vitest proxy 环境。

**前提.** 已确认 fixture 只需要本地 loopback authority；已声明哪些请求属于 recorded authority。

**步骤.**
1. **loopback effect 自己拥有 listener**：绑定 `127.0.0.1:0`；在 Cordis effect 中注册 cleanup；`unref()` 防止 fixture 持有进程；cleanup 先跑 owner callback，再 `close()` + `closeAllConnections()`，两者错误合并为 `AggregateError`；setup 失败也要 cleanup。`deepseek-harness/snapshots/session/loopback-fixture-server.mjs:1-75@687f282e`。
2. **dispose 在启动中获胜**：用 `started` barrier；dispose 不提前完成，等 `finishListening` 后关闭 server/连接/unref；spec 断言 `closed/connectionsClosed/unreferenced` 且 fetch 恢复。`deepseek-harness/scripts/snapshot-http-fixtures.spec.ts:91-141@687f282e`。
3. **fetch 映射保真**：string/URL/Request 三种输入都映射到 loopback authority；`Request` 的 method/headers 必须保留；无关 URL 原样传递；同一 recorded authority 的意外 path 必须 reject。`deepseek-harness/scripts/snapshot-http-fixtures.spec.ts:143-181@687f282e`。
4. **所有权冲突要报告**：fixture 安装 fetch 后又被后来的 wrapper 替换时，dispose 保留后来的 wrapper，并报告 ownership error；不能静默覆盖。`deepseek-harness/scripts/snapshot-http-fixtures.spec.ts:183-203@687f282e`。
5. **清 ambient proxy**：Vitest setup 删除 proxy names 和 `NODE_USE_ENV_PROXY`；需要代理的测试显式设置；`NODE_USE_ENV_PROXY` 必须在 shell 启动前 unset（Node 在进程启动时采样，setup 删除不能解绑）；real-API e2e 也清。`deepseek-harness/scripts/test-proxy-environment.ts:1-60@687f282e`。
6. **真实网络只走 e2e**：本地 loopback fixture 不录；需要真实 provider/网络时用 M10/M11，不要用 fixture 冒充 live 证据。`deepseek-harness/docs/testing.md:27-31@687f282e`。

**角色与完成信号.** 场景作者/网络 owner；完成信号是 loopback lifecycle spec 通过、proxy 环境已知、真实网络证据单独运行。

**失败处理.** listener 挂住：检查 effect cleanup 和 `closeAllConnections`；proxy 干扰：清 ambient 并让需要代理的测试显式设置；映射错：检查 recorded authority 和 path 白名单。

**例外.** 真实 e2e 走真实网络（M10/M11）；本地 fixture server 的 loopback 交互不录。

**证据限制.** loopback fixture 证明本地服务器生命周期、fetch 映射和所有权；不证明 live 网络、CDN、限流或 provider 保真。

<a id="m26-replay"></a>

## 26. M26 LLM replay：脚本、覆盖与消费校验

**机制 ID.** `testing-llm-replay-scripts`。

**问题.** 回放脚本与真实会话调用顺序不一致时，测试可能读错脚本、少跑调用，或者用“没抛错”掩盖未消费的 fixture。

**触发.** 新增 recorded session；模型流变化；工具调用重试；子代理。

**前提.** 有主 session（及可选 child session）的 JSONL；知道每个模型调用的 turn/step。

**步骤.**
1. **派生脚本**：从 `assistant/message`/`assistant/attempt` 的 stream 展开 chunks；`compaction/summary` 的 `llmStreamCall` 用 `rawOutput` 重建；每个调用必须以 `finish` 结束，否则说明是抛出的流，需要 `replay.override.json`。`deepseek-harness/packages/test-support/llm-replay/src/index.ts:462-505@687f282e`。
2. **覆盖/补丁**：`ReplayOverrideDoc` 可以是整脚本数组或 `{ patches }`；`at` 是 0-based 调用索引，等于派生长度时追加（如注入瞬态错误后的重试）。`deepseek-harness/packages/test-support/llm-replay/src/index.ts:507-540@687f282e`。
3. **会话绑定**：每个 live session 绑定一个脚本；脚本按绑定顺序分配；匿名调用用单独 key；多出未录制的 session 或脚本耗尽都抛错并提示重录。`deepseek-harness/packages/test-support/llm-replay/src/index.ts:1031-1100@687f282e`。
4. **消费校验**：`assertConsumed()` 要求所有脚本都绑定且每个脚本的调用都被消费；未消费会失败并列出 session/数量。`deepseek-harness/packages/test-support/llm-replay/src/index.ts:1100-1125@687f282e`。
5. **provider catalog 校验**：input modalities 只能是 text/image；imageRequestTokens 必须正安全整数且含 image；systemPromptUpdate 只能是 `in-history`；toolUpdate 只能是 `in-history`/`addition-only`。`deepseek-harness/packages/test-support/llm-replay/src/index.ts:1125-1209@687f282e`。
6. **post-2xx 副作用**：DeepSeek official provider 的 replay 仍调用 extensions 的 `prepare/accept`，重现 2xx 后的副作用；但它不重现 provider wire body。`deepseek-harness/packages/test-support/llm-replay/src/index.ts:1075-1095@687f282e`。
7. **节奏**：`paceMs` 可逐 chunk 延迟；默认 burst；用于时序敏感场景，不改变内容。
8. **child files**：`DSH_SNAPSHOT_CHILD_FILES` 用 path delimiter 分隔；每个 child 对应一个 recorded subagent session log。

**角色与完成信号.** 作者维护脚本/override；评审者检查未消费/多消费；完成信号是 replay 通过且 `assertConsumed` 通过。

**失败处理.** 脚本耗尽/未录制 session：重录或补 override，不要放宽。`finish` 缺失：补 override 或修录制。provider 校验失败：修 catalog 配置。

**例外.** 单 session 匿名调用可以不绑 id；trace/非流式 replay 不适用。

**证据限制.** replay 证明脚本消费和下游行为，不证明真实 provider 的 wire/认证/限流。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/test-support/llm-replay/src/index.ts:1-1030@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:849-949@687f282e`


<a id="m27-replay-corpus"></a>

## 27. M27 回放语料的 token 还原

**机制 ID.** `testing-replay-corpus-token-restoration`。

**问题.** 提交的 replay JSONL 为了脱敏用了 token；回放时必须把 token 还原成当前 live 值，但不能改 fixture 或猜错关系。

**触发.** replay fixture 含 `{{...}}` token；子代理/身份关系；新增 scrub token。

**前提.** 已登记 token 的语义和 owner；已确认 fixture 是 replay 输入。

**步骤.**
1. 用共享的 `materializeSessionTokens`/`restoreReplayCorpus` 还原 token；每个 token 映射到当前 live session/child/tool/schema，不修改文件。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:850-950@687f282e`。
2. **父子关系**：child token 必须映射到同一个 child live id；不要因为两个 child 文本相似就合并。
3. **长度/形状**：还原后允许 fixture 与 live 值长度不同（例如 id 长度），但结构/关系必须一致；不匹配要抛出并指出 token/位置。
4. **override 与 corpus 分离**：`replay.override.json` 是行为补丁，不是身份 token；presence 必须与 `overridden` 一致。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1615-1650@687f282e`。
5. **不重写历史**：replay corpus 文件是只读输入；还原只发生在内存/进程内。

**角色与完成信号.** 作者维护 token 映射；评审者检查“token 是否泄露/合并身份”；完成信号是 replay 通过，还原后的请求/状态与录制关系一致。

**失败处理.** token 不识别：加映射或报错，不要猜。父子错：修 token/录制。fixture 需要改：回到 record/refresh，不要在 replay 时改。

**例外.** 纯本地、无身份关系的 fixture 可以不用 token；但一旦提交，必须能解释每个 token。

**证据限制.** token 还原证明关系映射，不证明真实 provider 会接受这些值。

<a id="m28-expected"></a>

## 28. M28 Owner-local expected output

**机制 ID.** `testing-expected-output-placement`。

**问题.** 不是所有组装行为都需要 recorded session。CLI 进程、配置转储、启动失败、插件兼容性这类“有真实进程但没有模型回放”的输出，放在 `snapshots/` 会污染会话语料；放在普通单测里又缺少完整进程。

**触发.** CLI/进程装配、启动/退出、配置 schema、插件兼容性、Web 的非 session 输出。

**前提.** 输出不是由 recorded session 驱动；有可启动的真实 profile/进程。

**步骤.**
1. 用 `*.expected.e2e.ts` 命名，放在 owning app/package/script 的 `tests/expected/` 旁；不要放顶层 `snapshots/`，不要用 `*.snapshot.ts`。`deepseek-harness/docs/testing.md:12@687f282e`、`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:35-39@687f282e`。
2. `vitest.expected.config.ts` 只包含 `apps/cli/tests/**/*.expected.e2e.ts`；用 proxy 清理 setup；120s test/30s hook；最多 5 worker。`deepseek-harness/vitest.expected.config.ts:1-19@687f282e`。
3. 通过真实 Loader/profile 启动（如 `runLoaderSmoke` + headless driver），断言 stdout/stderr、退出码、持久化文件；CI 用 built exports（`DSH_EXAMPLE_MODE=lib`）。`deepseek-harness/scripts/run-gates.ts:757-766@687f282e`。
4. 两边都用同一归一化 context；比较解析后的 JSONL/文本，而不是逐字节（除非协议要求字节）。`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:60-75@687f282e`。
5. 需要刷新时用 `pnpm run test:expected:refresh`，人工审查 diff；不要手改期望来掩盖行为。`deepseek-harness/package.json:73-76@687f282e`。
6. 进程被信号/超时结束时，先断言不是信号/超时，再断言退出码，避免“被杀”伪装成普通失败。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:105-108@687f282e`。

**角色与完成信号.** 作者放对目录、启动真实进程；评审者检查输出是否被世界断言覆盖；完成信号是 `pnpm run test:expected` 通过且无 session 回放。

**失败处理.** 输出差异：先判断是环境噪声还是行为；环境加最小归一化，行为修代码/审查。放错目录：移动并更新配置，不要留副本。

**例外.** 一旦场景需要 recorded session 的模型输入/持久化，改用 `snapshots/`（M16）。纯包/脚本期望用 `test`，浏览器期望用 `test:web`。

**证据限制.** expected 证明该进程的输出，不证明真实 provider；keyless 仍是 mock/脚本模型。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:84-1211@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1697-1720@687f282e`


<a id="m29-web"></a>

## 29. M29 Web 浏览器 lane

**机制 ID.** `testing-web-browser-lane`。

**问题.** DOM 单测不能证明真实浏览器、布局、ARIA、网络和插件 CSS 的组合；截图 diff 又会因字体/像素而不稳。

**触发.** Web UI、客户端插件、ARIA/键盘/布局、session-driven Web 渲染。

**前提.** 已安装 Playwright Chromium/WebKit；已确认要断言语义状态而不是像素。

**步骤.**
1. `test:web` 先构建（CSS/插件/client），再跑 `vitest.web.config.ts`；浏览器模式为 headless，Chromium 为主，model/reasoning picker 额外跑 WebKit。`deepseek-harness/package.json:76-80@687f282e`、`deepseek-harness/vitest.web.config.ts:1-37@687f282e`。
2. 用真实 Chromium 页面和 app bootstrap；不要用 CDP 注入/mock 替换被测产品路径。`apps/web/tests/scaffold.ts` 的入口注释明确要求真实浏览器和 keyless 组装。`deepseek-harness/apps/web/tests/scaffold.ts:1-90@687f282e`。
3. 等待字体/布局/动画的可观察就绪，不使用固定 sleep；用可访问角色/名称/label 定位，断言 ARIA/可见状态/焦点，而不是截图。`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-20@687f282e`。
4. session-driven Web 输出放 `snapshots/web/`；UI-only 输出放 `apps/web/tests/expected/`；Web 可以借用 canonical session，但不要复制。`deepseek-harness/docs/testing.md:15@687f282e`。
5. CI 用 `DSH_SNAPSHOT=replay` 只读；`test:web:refresh` 只在本地、人工审查。`deepseek-harness/docs/testing.md:15@687f282e`。
6. built Web snapshot 用 `test:web:built`，由 `ci-consumers` 在 build 后运行；不要在未构建时把 skip 当通过。`deepseek-harness/scripts/run-gates.ts:574-578@687f282e`。
7. 可访问性/键盘交互要有确定性：在 reflow 前用键盘建立选择，避免“点击后立即 reflow”让断言落在旧值上。`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-spreadsheet-selection-by-keyboard-before-reflow.md:5-14@687f282e`。
8. **CI 的 Web 执行器先串行、再有界并发**：`scripts/run-web-snapshots.ts` 要求 `DSH_WEB_SNAPSHOT_WORKERS` 是正安全整数且十进制文本与原始环境值一致，否则直接抛错；先串行跑两个 browser-owner 文件（`hmr-live.e2e.ts`、`client-plugin-live.e2e.ts`），任一失败即停止整条 lane；通过后再用 `--fileParallelism --maxWorkers` 跑其余文件。子进程被信号终止按失败上报。`deepseek-harness/scripts/run-web-snapshots.ts:1-44@687f282e`。

**角色与完成信号.** 作者写语义断言；评审者检查“像素/文本关键词是否能被作弊满足”；完成信号是 Chromium（及需要的 WebKit）真实通过，ARIA/状态断言稳定。

**失败处理.** 布局 flake：等显式就绪/状态，不要加 sleep。跨浏览器差异：判断产品语义，必要时显式 skip。快照差异：审查，不要盲目 refresh。

**例外.** 需要视觉审查时可以另存截图，但不要把它作为 CI 门禁；截图不是源仓的默认证据。`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-20@687f282e`。

**证据限制.** 浏览器 lane 证明选定浏览器/视口的行为，不证明所有设备/浏览器；不证明真实 provider。

<a id="m30-web-perf"></a>

## 30. M30 Web 性能与压力 lane

**机制 ID.** `testing-web-performance-and-stress`。

**问题.** 性能/压力测试会放大机器噪声和资源竞争；把它们混进默认 Web 套件会让日常反馈不稳定。

**触发.** 前端渲染/滚动/长会话性能；并发浏览器压力；性能预算变更。

**前提.** 有独立perf/stress诊断配置，机器、浏览器和负载可记录；不要把手动诊断误认成预算型CI门禁。

**步骤.**
1. `test:web:perf`先build，再以`DSH_SNAPSHOT=replay`运行`vitest.web.perf.config.ts`。该高基数诊断配置明确位于所有默认Vitest清单之外，因此也不进入CI执行lane。`deepseek-harness/package.json:81-83@687f282e`、`deepseek-harness/vitest.web.perf.config.ts:5-19@687f282e`
2. `test:web:stress` 先 build，再跑 `vitest.web-stress.config.ts`，用于并发/浏览器进程压力；它是 opt-in，不作为默认门禁。`deepseek-harness/package.json:83-85@687f282e`、`deepseek-harness/vitest.web-stress.config.ts:1-15@687f282e`。
3. 必需预算型性能门禁由`benchmarks/`另行拥有，测量用户路径、采用校准常量并输出报告；不能将本节手动诊断的计时当作CI阻断。若目标要新增预算门禁，按下一节benchmark机制独立落实。`deepseek-harness/benchmarks/AGENTS.md:3-18@687f282e`
4. 压力结论只补充确定性回归，不替代它；压力通过不能证明没有 race。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:109-115@687f282e`。

**角色与完成信号.** 作者维护诊断负载，评审者核对机器、测量边界及结论；完成信号是选定手动诊断确实执行且结果被分析，perf/stress的opt-in身份明确。预算型benchmark通过是另一份证据。

**失败处理.** 超预算：先看机器/浏览器/负载，再判断产品回归；不要直接放宽。压力失败：定位资源竞争，不要改成串行掩盖。

**例外.** 本机数字不能当作发布容量。目标如另接CI诊断runner属于显式迁移设计，不是源Web perf既有自动保证；预算型必需门禁另按benchmark机制证明。

**证据限制.** 源仓能证明 lane 和配置；不能证明任意机器上的绝对性能。

<a id="m31-benchmark-gate"></a>

## 31. M31 性能基准门禁

**机制 ID.** `testing-benchmark-gate`。

**问题.** 性能回归不会让功能测试变红；把 benchmark 混进包测试又会让计时受测试框架/并发影响。

**触发.** 修改热路径、持久化、会话打开、工具管线、前端预算；发布前。

**前提.** benchmark 在 `benchmarks/` 独立目录；预算已校准；CI 有独立 idle runner。

**步骤.**
1. 预算型 benchmark 放 `benchmarks/*.bench.ts`；不要放包 `tests/`，也不要用 `.bench.ts` 混进普通测试。`deepseek-harness/benchmarks/AGENTS.md:1-18@687f282e`。
2. 单个 benchmark 用 `pnpm run bench <path>`；完整门禁用 `pnpm run test:bench`（先 build bench/web，再跑 `vitest.bench.config.ts`），CI 用 `pnpm run check:ci:bench`。`deepseek-harness/benchmarks/AGENTS.md:5-12@687f282e`、`deepseek-harness/package.json:65-68@687f282e`。
3. `vitest.bench.config.ts` 只包含 `benchmarks/**/*.bench.ts`；process-bound/plain Node；不在 TSX 下跑计时。`deepseek-harness/vitest.bench.config.ts:1-29@687f282e`。
4. CI 的 `node 24 / benchmarks` job 单独跑、`timeout-minutes: 20`、无并发 gate；失败也上传 `benchmarks/.dsh-report/`。`deepseek-harness/.github/workflows/ci.yml:206-265@687f282e`。
5. 预算用未四舍五入的中位数；同时保存原始样本 min/median/max，避免只看一个数。`deepseek-harness/benchmarks/session-open/session-open.bench.ts:120-180@687f282e`。
6. 失败是门禁失败；不要把 benchmark 改成 `test.skip` 或删除预算。

**角色与完成信号.** 作者维护 benchmark/预算；CI 维护者保证 idle runner；完成信号是 PR benchmark job 通过，报告含机器信息和样本。

**失败处理.** 超预算：先复跑/看机器，再定位回归；不要先放宽阈值。报告缺失：检查 teardown/上传路径。

**例外.** 内存受限案例走 `test:bench:memory` 单独进程；不能与普通 benchmark 共享堆。`deepseek-harness/package.json:67@687f282e`。

**证据限制.** benchmark 证明该机器/负载下的时间/内存，不证明生产容量；容器 CPU 配额会让数字偏离。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/benchmarks/session-open/session-open.bench.ts:311-495@687f282e`


<a id="m32-benchmark-hygiene"></a>

## 32. M32 Benchmark 工作负载卫生

**机制 ID.** `testing-benchmark-workload-hygiene`。

**问题.** 计时区间里混入构建、fixture 生成、冷启动、GC 或环境探测，会把准备成本算成产品成本；使用 ambient repo/network 又会让结果不可复现。

**触发.** 新增/修改 benchmark；预算校准；内存/扩展性案例。

**前提.** 有每 benchmark 独立的临时根；输入可合成；计时端点明确。

**步骤.**
1. **每 benchmark 自有树/身份/哨兵**：不读 ambient repo、不共享私有 Harness home、不依赖网络；需要 built 模块时自己 build。`deepseek-harness/benchmarks/AGENTS.md:3-12@687f282e`。
2. **准备在计时外**：合成 session、迁移模板、冷 resume 等放在 unmeasured setup；计时只覆盖目标端点。`deepseek-harness/benchmarks/session-open/session-open.bench.ts:200-260@687f282e`。
3. **每个样本 fresh worker**：避免前一样本污染；worker 报告退出码/信号/超时，失败要给 stderr 尾部。`deepseek-harness/benchmarks/session-open/session-open.bench.ts:180-240@687f282e`。
4. **报告原始值 + 聚合**：min/median/max、总 wall、CPU user/system、peak RSS、retained heap/external/arrayBuffers/RSS；budget 用中位数。`deepseek-harness/benchmarks/session-open/session-open.bench.ts:120-180@687f282e`。
5. **机器信息**：CPU 型号、可用并行度、平台、架构、Node/V8 版本；这些在计时 worker 退出后记录。`deepseek-harness/benchmarks/support/machine-profiles.ts:1-58@687f282e`。
6. **内存压力**：旧空间上限、独立进程、显式 GC、retained heap 与 fresh host 对比；报告 peak RSS。`deepseek-harness/scripts/run-memory-pressure-bench.ts:1-147@687f282e`。
7. **报告失败也要生成**：teardown 在预算失败后仍渲染 `benchmarks/.dsh-report`；若在记录任何 timing 前失败，则没有报告，上传步骤应 warn 而不是二次失败。`deepseek-harness/.github/workflows/ci.yml:236-265@687f282e`。
8. **校准**：用固定机器/多次采样校准参考值；不要把一次热运行当基线。`deepseek-harness/benchmarks/support/calibration.ts:1-15@687f282e`。

**角色与完成信号.** 作者维护隔离/端点/报告；评审者检查“准备是否在计时内”“是否有 ambient 输入”；完成信号是报告可复现、预算可解释。

**失败处理.** 计时包含准备：移动端点。报告缺失/不完整：修 harness/teardown。样本噪声：增加样本/校准，不要删异常值。

**例外.** shipped SDK workflow 变体需要 built dsh/SDK；仍然只把启动/请求/关闭的声明端点计入预算。`deepseek-harness/.agents/notes/implemented/testing/2026-09-06-backend-continuation-performance.md:5-20@687f282e`。

**证据限制.** 合成输入/声明端点不等于公共工作负载；报告不能外推为生产 SLA。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/benchmarks/session-open/session-open.bench.ts:261-495@687f282e`


<a id="m33-support-roster"></a>

## 33. M33 测试支持包选择

**机制 ID.** `testing-support-harness-roster`。

**问题.** 测试支持包如果互相嵌套或各自造 mock，会让“哪一层是真实”不可追踪；一个包也不能解决所有边界。

**触发.** 需要录制会话、回放 LLM、启动 Loader、真实 loop、客户端 runtime、Remote HTTP、无凭据 provider。

**前提.** 已明确要替换的边界和要保留的真实下游。

**步骤.**
1. 按边界选包（源仓七个包各有唯一职责）：
   - `session-snapshot`：recorded session 的存储、归一化、profile adapter；不是通用断言库。
   - `llm-replay`：按调用顺序回放 recorded LLM chunks；不是真实 provider。
   - `loader-smoke`：真实 Loader + app/process 启动；不是 UI/browser。
   - `agent-loop-testkit`：真实 loop/session/tool registry/JSONL，fake model/tools；不是 fake loop。
   - `client-runtime`：真实 client 组装 + fake remote；REPL/heads 示例；不是 Web 浏览器 lane。
   - `remote-mock`：HTTP Remote 表面；测试专用 `any` fallback；不是 production Remote 类型。
   - `llm-mock-server`：无凭据远端 provider 替身；不是 provider 保真。
2. **只保留一个 mock 边界**：例如 `makeBridgeHarness()` 保留 loop/session/tool registry/JSONL，只把模型 adapter 换掉；不要让 replay 再套 mock server。`deepseek-harness/docs/testing.md:27-31@687f282e`。
3. 在测试/README 写清“替换了什么、保留了什么、不能证明什么”；评审者按这个清单检查。`deepseek-harness/packages/test-support/README.md:1-53@687f282e`。
4. 选择 built/source 模式：Loader smoke/built smokes 走 M15；session/LLM replay 走 replay；Web 走 M29。

**角色与完成信号.** 作者选包并记录边界；评审者检查嵌套/重复 mock；完成信号是测试断言落在真实下游，且未替换部分有证据。

**失败处理.** 两个 harness 冲突：保留一个边界，另一个降为 fixture。mock 证明不了产品：升级到 M14/M10。

**例外.** 纯单元测试可以用简单 fake，不需要引入完整 harness；但不要声称集成证据。

**证据限制.** 每个包只证明其边界；组合使用不会自动变成端到端证明。

<a id="m34-llm-mock-server"></a>

## 34. M34 `llm-mock-server` 的无凭据协议替身

**机制 ID.** `testing-llm-mock-server-contract`。

**问题.** 真实 provider 的凭据/网络/限流让恢复和流式测试难以稳定；但 mock server 如果被当成 provider 保真，会掩盖 wire/认证差异。

**触发.** provider 恢复、流式 chunk、工具调用、认证错误、无 key 的客户端/服务端联调。

**前提.** 服务可以被指向本地 `DEEPSEEK_BASE_URL`；使用假 key。

**步骤.**
1. 启动本地 mock server，设置 `DEEPSEEK_BASE_URL=http://127.0.0.1:<port>/v1` 和 `DEEPSEEK_API_KEY=mock-key`；不要把真实 key 传给它。`deepseek-harness/packages/test-support/llm-mock-server/README.md:40-50@687f282e`。
2. 用它的故障注入/恢复模式验证客户端在错误、重试、流中断下的行为；断言外部请求次数/顺序/最终状态，而不是只看 mock 日志。
3. 它是**外部边界**替身：保留真实 loop/tool/persistence；不要再用另一个 mock 包住下游。
4. 不要把它当作 provider 兼容性/限流/真实 wire 的证据；这些需要 M10。

**角色与完成信号.** 作者配置本地 server/假 key；评审者检查是否泄漏真实 key、是否断言了下游；完成信号是恢复场景稳定通过且外部效果正确。

**失败处理.** 连接失败：检查端口/路径/假 key。行为差异：判断是客户端还是 mock 协议，不要直接改 mock 让测试绿。

**例外.** 需要真实 provider 的测试用 M10；mock server 不替代。

**证据限制.** 只证明被 mock 的协议子集和客户端行为，不证明 provider 实现。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:97-217@687f282e`


<a id="m35-reliability-skill"></a>

## 35. M35 测试可靠性 Skill：设计与诊断

**机制 ID.** `testing-reliability-skill`。

**问题.** 异步/并发/全局状态/子进程/平台问题反复以“flake”出现；没有统一的设计和诊断流程，修复会退化成加超时/重试/串行。

**触发.** 新增或修改有上述风险的测试；调查 flaky CI；评审测试隔离。

**前提.** 已读当前测试策略、defensive patterns、当前 Vitest 配置和 workflow。

**步骤.**
1. 用 Skill 的顺序：读 owning rules → 建模四层拓扑 → 原子分配 →  Contain 全局状态 → 平台语义 → 预算 → 同步 → 静止处置 → 证明回归 → 拒绝掩盖 → 诊断 → 验证报告。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:5-131@687f282e`。
2. 预测失败：先写“在哪个并发/失败路径会坏”，再写测试；不要只写 happy path。
3. 拒绝 flake 掩盖清单：加超时但不命名等待状态、加重试、全文件串行、吞错误、弱化断言、归一化掉不稳定行为、清理/断言前加 sleep。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:117-125@687f282e`。
4. 诊断只读请求保持只读：报告原因和证据，除非用户也要求修复。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:127-129@687f282e`。
5. 证据按风险补：全局恢复、静止 teardown、并发独立进程、负对照；stress 只补充确定性回归。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:109-115@687f282e`。

**角色与完成信号.** 作者/评审者；完成信号是测试在并发/失败/平台路径下有可解释行为，且没有用掩盖手段。

**失败处理.** 无法解释的 flake：按 `references/ci-flake-diagnosis.md` 分类，保留失败样本；不要反复重跑碰运气。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/references/ci-flake-diagnosis.md:1-60@687f282e`。

**例外.** 文档化的外部 provider 瞬态重试；lane 预算恢复（不是凭空加余量）。`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:117-125@687f282e`。

**证据限制.** Skill 是指导和审查框架，不是自动检查器；采用项目需要自己的 lint/review/CI 证据。

<a id="m36-pre-push"></a>

## 36. M36 推送前检查 Skill

**机制 ID.** `testing-pre-push-evidence-selection`。

**问题.** 每次推送都跑全量既慢又浪费；只跑一个不相关的测试又会把回归放过去。历史重写还会让旧哈希/旧审查锚点失效。

**触发.** push、force-push、mark ready、`gh stack sync` 后、声称 checks 通过。

**前提.** 已确认 base/stack parent；已 fetch 最新 ref；已知道工作区/暂存/未跟踪状态。

**步骤.**
1. 检查 checkout/branch；用 `pnpm run change-scope --base <verified-base-ref>` 得到完整出站范围；不要猜 base。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:11-27@687f282e`。
2. 按表面选最小证据：包/脚本跑 owning Vitest；文档跑 `doc-sync`；模型/CLI/终端输出跑 keyless snapshot/真实可运行场景；manifest/exports/build/bin 跑 `build` + hygiene + built smoke；测试/脚本类型跑 `build:check`；provider 跑 e2e。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:29-49@687f282e`。
3. **不要重复已通过的检查**，尤其不要在 push 前重复 pre-push hook 的 typecheck。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:51-55@687f282e`。
4. 聚焦覆盖率同时指定 tests + source include；不要用 `--passWithNoTests`/降阈值/缩窄 include 隐藏未覆盖。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:61-83@687f282e`。
5. 完整本地演练只在用户明确要求、诊断 CI 失败、或改动不可分割地跨仓库时做。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:85-89@687f282e`。
6. 历史重写用 `--force-with-lease=<branch>:<observed-oid>`，禁止 raw `--force`；`gh stack push/sync` 自带 lease。重写后重新审计 heads/threads/approvals/checks。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:91-112@687f282e`。
7. 失败：普通 push 前停止并修复；post-sync 失败则阻止 merge，修复后重新验证；不要“push 了看 CI 会不会不同”。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:114-123@687f282e`。
8. 报告 pending 为 pending；不要把待定/跳过写成通过。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:125-137@687f282e`。
9. **分别记录本地 hook 的实际矩阵**：`pre-commit` 跑 staged 双语配对、归档笔记校验、staged oxlint（`--fix` + `stage_fixed`）、`git diff --cached --check`、pi-ai provider 数据检查与 vendor manifest 守卫（`lefthook.yml:5-32`）；`pre-merge-commit` **只有** staged 双语配对与归档笔记校验（34-44）；`pre-push` **只跑** `pnpm run typecheck`（46-49）。安装走 `scripts/install-lefthook.mjs`（postinstall 自动执行）。因此第 3 条“不要重复 pre-push 的 typecheck”有直接文件依据，但不能把 pre-commit 的额外检查算到 merge checkpoint 上。`deepseek-harness/lefthook.yml:1-49@687f282e`。

**角色与完成信号.** 作者运行并报告；评审者检查证据覆盖；完成信号是出站 diff 的每个风险面都有最小证据，history rewrite 有 lease 和 post-sync 审计。

**失败处理.** 环境相关失败：记录命令/用例/平台差异，先证明再归因；本地 hook 绕过只在用户明确同意时，并报告失败原因。

**例外.** `gh stack sync` 可能先发布后验证；必须立即补验证并保持 PR 未 merge。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:91-106@687f282e`。

**证据限制.** `change-scope` 依赖正确 base；本地环境不等于 CI；Skill 不能替代 CI 的平台矩阵。

<a id="m37-ci"></a>

## 37. M37 CI 编排与证据信任

**机制 ID.** `testing-ci-orchestration-and-trust`。

**问题.** 测试门禁如果都在一个 job 里串行，会慢；如果彼此不等待构建，会读到半成品；如果失败不互相中止，会浪费多分钟；如果观测 lane 与阻断 lane 混淆，会把“有诊断”当成“已阻断”。

**触发.** 新增/调整 lane、gate、worker、缓存、build 依赖、平台矩阵。

**前提.** 已读当前 workflow 和 `scripts/run-gates.ts`；知道哪些 job 是 required、哪些是 observational。

**步骤.**
1. **分组 lane**：coverage、consumers、bench、unit、windows blocking/complete/observational；artifact consumers 等待同一个 build；snapshot/expected/web built 在 build 后跑。`deepseek-harness/.github/workflows/ci.yml:109-391@687f282e`、`deepseek-harness/scripts/run-gates.ts:392-556@687f282e`。
2. **coverage 分区 + exempt heavy**：见 M07/M08；CI PR coverage job 只跑 PR，缓存 `.coverage-times.json`，给共享宿主 90s 预算。`deepseek-harness/.github/workflows/ci.yml:109-205@687f282e`。
3. **bench 单独 idle runner**：不与并发 gate 共享；20 分钟上限；报告 artifact 即使失败也上传。`deepseek-harness/.github/workflows/ci.yml:206-265@687f282e`。
4. **fail-fast**：`DSH_GATE_FAIL_FAST=1` 让一个 gate 失败中止兄弟；否则失败只跳过依赖它的 gate，独立错误都报告。`deepseek-harness/.github/workflows/ci.yml:284-291@687f282e`、`deepseek-harness/docs/development.md:105-110@687f282e`。
5. **worker 环境**：`DSH_GATE_CONCURRENCY`、`DSH_COVERAGE_MAX_WORKERS`、`DSH_SNAPSHOT_MAX_CONCURRENCY`、`DSH_WEB_SNAPSHOT_WORKERS`、`DSH_OXLINT_THREADS` 等由 scheduler 设置；shared host 上不要用 `availableParallelism()` 无界。`deepseek-harness/scripts/run-gates.ts:210-260@687f282e`、`deepseek-harness/docs/development.md:148-156@687f282e`。
6. **runner-owned 临时存储**：TMPDIR/Playwright/Node compile cache 指向 runner temp；PR 恢复 pnpm/Playwright cache，master 不保存这些 key；self-hosted 复用持久 store。`deepseek-harness/.github/workflows/ci.yml:274-340@687f282e`。
7. **本地完整演练是 opt-in**：`pnpm run check:all` 独立于 Git hooks；CI 拥有 exhaustive coverage/platform matrix。`deepseek-harness/docs/development.md:143-148@687f282e`。
8. **信任边界**：源仓能证明 job/gate 定义；**不能证明**远端 required check、分支保护、secret 权限或组织策略已开启。把“checker 会失败”与“forge 会阻断 merge”分开报告。
9. job-level `if` 跳过的 check 会报告为成功；对 fork/Dependabot 的 e2e skip 要标为未验证，不是通过。`deepseek-harness/.github/workflows/e2e.yml:1-25@687f282e`。

**角色与完成信号.** CI 维护者编排；作者按 lane 提供证据；完成信号是 required lane 全绿、observational 诊断可查、失败能定位到 gate/文件。

**失败处理.** 依赖错乱：修 needs/after，不要用 sleep。缓存污染：清 key/临时目录。平台专属失败：按 M38 显式 skip 或修。

**例外.** Dependabot/fork 的 keyless skip；self-hosted failover 的并发/缓存差异。`deepseek-harness/.github/workflows/ci.yml:109-205@687f282e`。

**证据限制.** 无法从源仓确认远端保护；采用项目必须提供自己的 required-check 截图/配置/运行记录。

<a id="m38-skips"></a>

## 38. M38 平台跳过与条件豁免

**机制 ID.** `testing-platform-skips-and-conditional-exemptions`。

**问题.** 平台能力差异（Windows ACL、pwsh、ConPTY、POSIX 权限/信号）会让同一断言在不同平台失败；弱化所有平台的断言会降低证据；静默跳过会让门槛消失。

**触发.** Windows/macOS/Linux 差异；pwsh 缺失；平台专属 bin/PTY/ACL；CI 平台矩阵。

**前提.** 已确认是平台语义而非产品缺陷；已找到能代表该平台行为的 lane。

**步骤.**
1. **显式跳过并命名原因**：使用配置中的平台排除列表或场景的 `posixOnly`/`pwshOnly`，不要用 `if (platform) return` 静默返回。`deepseek-harness/vitest.config.ts:100-160@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1300-1340@687f282e`。
2. **平台专属守卫仍要跑**：例如快照 fixture 的存储/命名守卫在跳过记录场景时仍执行；不要把整个 suite 跳过。`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1604-1745@687f282e`。
3. **条件覆盖率豁免与探测耦合**：pwsh coverage 只有在缺少真实 `pwsh` 时才排除；CI runner 有 pwsh 时恢复完整门槛。`deepseek-harness/vitest.config.ts:118-150@687f282e`。
4. **Windows lane 分级**：blocking / complete / observational；观测 lane 提供诊断但不阻断；不要把观测绿当成阻断证据。`deepseek-harness/scripts/run-gates.ts:316-330@687f282e`。
5. **wine 只用于诊断**：`pnpm run check:windows-wine` 只在诊断已知 Windows 失败时用；CI 拥有该信号。`deepseek-harness/AGENTS.md:121-123@687f282e`。
6. **测试结果只适用于运行环境**：WSL/原生 Windows/Linux 的工具链和文件系统不同；不要跨环境推断。`deepseek-harness/docs/development.md:15-30@687f282e`。

**角色与完成信号.** 作者写跳过理由/条件；评审者检查“是否弱化了所有平台”；完成信号是跳过有原因、对应平台有真实 lane、条件豁免在能力存在时自动恢复。

**失败处理.** 平台失败：先复现/定位差异，再决定修产品还是显式跳过。跳过列表过期：guard/CI 应发现，不要永久保留。

**例外.** 无 pwsh 的本地主机；无 Windows ACL 的 POSIX；仅诊断的 wine。

**证据限制.** 源仓能证明列表/条件；不能证明每个平台的 CI 都实际运行。采用项目需要平台矩阵运行记录。

<a id="m39-secrets"></a>

## 39. M39 秘密与凭据卫生

**机制 ID.** `testing-secret-and-credential-hygiene`。

**问题.** 测试需要真实 key/凭据，但 key 进入日志、fixture、模型输出或历史提交就会泄露；mock key 与真实 key 混用会让隔离失效。

**触发.** 新增 e2e/凭据测试；录制 fixture；CI secret 配置；日志/错误输出。

**前提.** 已列出会接触秘密的进程/文件/日志；已确认哪些是假 key。

**步骤.**
1. **永不提交真实凭据**：root `.env` 只用于本地且必须 gitignore；CI 用 secret；不要把 key 写进 fixture/expected/注释。`deepseek-harness/AGENTS.md:123-127@687f282e`。
2. **最小暴露**：secret 只映射到需要的 step（M11）；checkout/setup/install 不拿 key；不要 `env` 全局导出。
3. **不打印**：日志/错误/模型输出都可能带 key；错误信息只报 env 名称/缺失，不报值。`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:47@687f282e`。
4. **fixture token 化**：身份/请求头/工具 schema 用 typed token；真实 key 不进入 JSONL/expected。`deepseek-harness/packages/test-support/session-snapshot/README.md:30-70@687f282e`。
5. **mock key 明确**：`llm-mock-server` 用 `mock-key` 这类明显假值，只指向 loopback。`deepseek-harness/packages/test-support/llm-mock-server/README.md:40-50@687f282e`。
6. **CI 关闭生产副作用**：telemetry 禁用、端点固定、只读权限；e2e 不写生产数据。`deepseek-harness/.github/workflows/e2e.yml:23-32@687f282e`。
7. **泄露处置**：立即轮换、清理日志/缓存、检查历史；不要只删当前文件。

**角色与完成信号.** 作者/CI 维护者；完成信号是 secret 只在需要的 step、日志/fixture 无真实值、假 key 可识别、泄露有轮换记录。

**失败处理.** 发现泄露：按事故处理，先轮换再修；不要静默删除。误报：确认是假 key 后记录。

**例外.** 本地 `.env`、CI secret、mock key；都必须与生产隔离。

**证据限制.** 源仓能证明策略/隔离代码；不能证明历史提交、第三方日志或远端 secret 没有被泄露。采用项目需要独立扫描/审计。

<a id="m40-python-sdk"></a>

## 40. M40 Python SDK：pytest、installed-wheel keyless、trusted real API

**机制 ID.** `testing-python-sdk-keyless-blackbox`。

**问题.** Python SDK 的 fake runtime peer 测试能证明 SDK 逻辑，但不能证明 wheel 安装、发行物内的可执行文件选择、干净解释器，以及真实 provider。把真实 API 测试放进 fork PR 又会泄露 key；把缺 key 当成 skip 会假绿。

**触发.** 改 Python SDK/runtime、wheel、入口解析、provider 场景、Office sidecar；发布前。

**前提.** 已把 venv 放在 `python/` 外；已安装 `test` group；已区分 fake runtime、installed wheel 和 trusted real API 三种证据。

**步骤.**
1. **pytest 只收集 SDK 测试**：根 `pytest.ini` 把 `testpaths` 限为 `python/sdk/tests`，并排除 `node_modules/.git/dist-exe`，避免递归收集到 worktree/venv 的同名模块。`deepseek-harness/pytest.ini:1-5@687f282e`。
2. **测试组与 pytest 配置随包**：`[dependency-groups].test = pytest + Pillow`；pytest 的 `testpaths = tests`、`addopts = -q`；`uv sync --project python/sdk --group test` 后 `uv run --project python/sdk pytest`。`deepseek-harness/python/sdk/pyproject.toml:24-29@687f282e`、`deepseek-harness/python/development.md:18-30@687f282e`。
3. **fake runtime peer 层**：pytest 套件用 fake runtime peers 验证 SDK 逻辑；`test_bundled_runtime.py` 对 `exe`/`node` carrier 各自 `pytest.skip`，dummy key 只满足 adapter 加载，initialize/shutdown 不调用模型。`deepseek-harness/python/development.md:34@687f282e`、`deepseek-harness/python/sdk/tests/test_bundled_runtime.py:1-40@687f282e`。
4. **installed-wheel keyless 层**：在临时目录建新 venv，安装本地构建的 SDK wheel + runtime wheel；在 checkout 外运行，清空 `PYTHONPATH` 和 `DSH_RUNTIME_MODE`，证明模块和可执行文件都来自发行物，再跑 `--scenario all --installed-wheel`。`deepseek-harness/.github/workflows/build-exe-for-python-sdk.yml:323-380@687f282e`。
5. **场景快照**：比较 `scripts/snapshots/python-sdk-single-exe/` 的 committed expected；`minimal`/`authoring` 的 `model-visible.json` pin system prompt、tool schema、model-visible messages（含 Windows/PowerShell 变体），`advanced` pin 复杂进程的 SDK 结果与父子 session 日志，`scheduler-recovery` 保留失败工具轮和后续完成轮；比较不重写录制。`deepseek-harness/python/development.md:41-48@687f282e`。
6. **trusted real API 层**：只对 trusted PR 和 master push 跑 `--scenario sdk-live --installed-wheel`；两轮真实工具调用，第一轮创建文件并检查，第二轮复制 host-only 随机挑战内容到新 receipt 且不改源文件；两轮都要精确 sentinel 和 model-requested tool call，外部字节比较检查文件。`deepseek-harness/python/development.md:47-48@687f282e`、`deepseek-harness/.github/workflows/build-exe-for-python-sdk.yml:381-453@687f282e`。
7. **缺 secret 失败，不 skip**：real API preflight 检查 `DEEPSEEK_API_KEY_EXTERNAL`，为空直接 `exit 1`/throw；fork 和 Dependabot PR 只跑完整 keyless installed-wheel 路径，不拿 key。`deepseek-harness/.github/workflows/build-exe-for-python-sdk.yml:392-410@687f282e`、`deepseek-harness/python/development.md:47-48@687f282e`。
8. **CI 编排**：PR 的 `python-sdk` job 在 Python 3.10 跑完整 keyless pytest；`python-runtime` 依赖 `python-sdk`，PR 覆盖 Linux/Windows x64，master 由 `ci-master.yml` 覆盖 Linux ARM64 + macOS；最终 aggregate job 的 `needs` 包含 `python-sdk`/`python-runtime`，任一未成功即失败。`deepseek-harness/.github/workflows/ci.yml:486-521@687f282e`、`deepseek-harness/.github/workflows/ci.yml:753-758@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:42-50@687f282e`。
9. **诊断保留（声明的策略 vs 已实现的行为）**：把 `DSH_OFFICE_TEST_ARTIFACTS` 指向一个新目录时，`scripts/smoke-python-runtime.py` 的 Office smoke 会把输入文档、PNG 批次、manifest 与 `error.txt` 写进该目录，并排除临时运行时文件（`scripts/fixtures/office-render.py:14-41` 的 `workspace` 助手：先 `mkdir(exist_ok=False)`，失败时写 `error.txt`，`finally` 里只复制 `color-blocks.{docx,pptx,xlsx}` 与 `cli-*`/`node-pptx` 批次的 PNG/manifest）。`python/development.md:32` 另外声明“CI 在成功和失败都上传这些文件”，但固定提交的工作流没有任何 Office step 设置该变量或上传这些诊断文件（其他 `upload-artifact` 用于 benchmark report、wheel/发行包等，不是 Office 诊断目录；本批对 `.github/workflows/**` 做了结构性检索匹配 `DSH_OFFICE_TEST_ARTIFACTS|upload-artifact`）；因此**本地保留可证，Office CI 上传是未实现的声明**。采用方若需要该义务，必须自己加“设置变量 + 上传 artifact（含失败分支）”的工作流步骤，不能引用本文当作已具备的保证。`deepseek-harness/python/development.md:32@687f282e`、`deepseek-harness/scripts/smoke-python-runtime.py:971-977@687f282e`、`deepseek-harness/scripts/fixtures/office-render.py:14-41@687f282e`。

**角色与完成信号.** Python SDK 作者、CI 维护者、发布/安全负责人。完成信号是：pytest + 干净 venv keyless black-box 通过；需要真实 provider 时 trusted real API 通过；设置 `DSH_OFFICE_TEST_ARTIFACTS` 后本地诊断目录与场景差异可查；fork 无 key 时仍跑 keyless 且不假绿。**源仓 CI 不设置该变量也不上传 Office artifact，所以“CI 上可查 artifact”不是可用的完成信号。**

**失败处理.** wheel 安装失败先查本地发行物/版本固定；入口解析失败查 runtime resolution 和发行物内容；real API 失败先确认 secret/配额/网络，再判断产品；缺 secret 按阻塞处理，不改成 skip。

**例外.** fork/Dependabot 只跑 keyless；本地缺 carrier 时 pytest 独立 skip；manual smoke 用内部 `_launch_args` adapter，不暴露公共 API；Office 可见内容由 LibreOffice Kit CI 拥有，Harness 只验证 installed-wheel smoke。

**证据限制.** keyless 证明发行物和入口，不证明真实 provider；real API 证明该 key/网络/模型/平台，不证明所有 provider；场景覆盖有限；源仓没有证明所有平台每次同时运行。Python 期望输出与 runtime/打包/发布是 Supply 域的交叉依赖。

<a id="migration-plan"></a>

## 41. 迁移实施顺序（采用项目执行）

以下是 **[迁移设计]**，不是源仓命令。目标是把上述机制落到一个真实项目，而不是复制 deepseek-harness 的目录。

### 阶段 0：盘点与参数化
1. 列出测试表面：单元、覆盖率、expected、snapshot、Web、e2e、bench、平台矩阵。
2. 列出运行时源码根、测试根、脚本根、生成物根、vendor/第三方根。
3. 列出真实入口：CLI/bin、server、worker、desktop、Web、SDK；标出哪些有 built 产物。
4. 列出外部边界：provider、网络、时钟、文件系统、数据库、子进程、浏览器。
5. 列出平台：Linux/macOS/Windows/WSL；哪些能力是平台专属。
6. 为每个参数给默认值：per-file 覆盖率、worker/分区、超时预算、样本数、预算、并发。

### 阶段 1：最小可信单元与覆盖率
1. 建立 Vitest 配置：source paths、process-bound 项目、setup（proxy/DOM）、reporter。
2. 设 per-file 100% 覆盖率，只 include 运行时源码；写排除台账和 `v8 ignore` 规则。
3. 建 `test`、`test:coverage`、聚焦覆盖率命令；确认 `test` 不等于覆盖率门禁。
4. 加未覆盖位置报告；让失败可定位到 file:line。

### 阶段 2：隔离与可靠性
1. 建资源助手：`listen(0)`、`mkdtemp`、唯一命名空间、清理注册。
2. 建全局状态恢复助手：env/cwd/timer/locale/fetch/registry；capture absence。
3. 设 lane 超时预算；加 per-test/hook/poll 的机械 guard。
4. 建可靠性 Skill/审查清单；禁止 sleep/retry/串行掩盖。
5. 加并发/恢复/负对照证据。

### 阶段 3：真实入口与快照
1. 建 Loader smoke / real composition；覆盖默认导出/命名导出回归。
2. 建 owner-local expected 与 `test:expected`。
3. 建 snapshot harness：manifest、fixture discovery、normalization、identity tokens、modes、workspace oracle、HTTP fixtures、replay。
4. 建 corpus 政策与守卫；把格式迁移输入纳入。
5. 让两个 SDK/消费者输出同 PR 更新（如果有多语言 SDK）。

### 阶段 4：Web、bench、e2e
1. 建真实浏览器 lane；语义/ARIA 断言；CI replay 只读。
2. 建手动perf/stress opt-in诊断lane，保留机器/负载/测量记录；不声称其默认进入CI预算阻断。
3. 建 benchmark 目录/配置/报告；CI idle runner；内存案例独立。
4. 建 e2e workflow：key 自跳过、preflight、fork/Dependabot 排除、secret 最小作用域、端点固定、telemetry 关闭。

### 阶段 5：CI 编排
1. 画 lane 依赖图：build → consumers；coverage 分区；bench 独立；platform 分级。
2. 设 fail-fast、worker/分区、缓存、runner temp、artifact 上传。
3. 区分 required 与 observational；把“checker 失败”和“forge 阻断”分开验证。
4. 加 expected-filenames/fixture guard/coverage-exempt guard。

### 阶段 6：采用验证（C4/C5 要求）
1. 选一个**新项目**和一个**既有项目**，覆盖两种工具链。
2. 用全新会话的 agent 只依赖本 Skill/参考执行；记录第一次失败和修复。
3. 覆盖功能、bug、文档/接口变更、review、fresh-session continuation。
4. 对未被案例覆盖的机制补案例。
5. 每个“enforcement”收集 positive/rejection/recovery 证据；区分“检查器能失败”和“forge 真的阻断”。
6. 远程实验需显式授权与隔离；不做生产发布/保护变更。

### 验收清单（逐项勾）
- [ ] 每个机制在采用项目有对应命令/配置/文件，而不是只有文字。
- [ ] 每个门禁至少有一个**拒绝样本**（故意引入回归，观察失败）。
- [ ] 每个恢复路径有证据（失败后修复/重跑）。
- [ ] 证据绑定源提交、目标版本、实际命令、观察输出。
- [ ] 未执行/未知项明确标为 planned/unknown，不写成 verified。
- [ ] 远端 required check/分支保护/secret 权限有独立证据，未验证就写未知。

<a id="applicability"></a>

## 42. 适用范围与明确不适用

**适用.**
- 多包/多入口的 TypeScript/JavaScript 仓库，尤其有 CLI、server、Web、SDK、子进程。
- 需要 keyless CI + 有 key 的真实 provider 证据。
- 有模型/用户可见输出，需要 recorded-session 回归。
- 有共享 CI runner，需要并发/资源隔离。
- 有性能/内存预算。

**不适用/需缩减.**
- 单文件脚本、无运行时门禁的小项目：不需要 40 个机制；至少保留 M01/M02/M06/M12/M15/M36。
- 没有 recorded session/多语言 SDK：M16-M27 可缩减为普通 golden + 归一化。
- 没有独立 benchmark runner：M31-M32 可先做本地诊断，不要把本机数字当门禁。
- 没有 Web/浏览器：M29-M30 不适用。
- 没有真实 provider：M10/M11 只保留 keyless 管线，不声称产品通过。

**参数化，不要照抄.**
- `packages/*/*/src` → 你的运行时源码根。
- `snapshots/session|sdk|acp|web` → 你的场景分类。
- `DSH_COVERAGE_TEST_TIMEOUT_MS=90000` → 你的 lane 实测预算。
- 6 workers / 4 partitions / 4 e2e workers → 你的 runner CPU/内存。
- per-file 100% → 你的门槛；源仓的选择不是普遍真理，但“per-file 而非聚合”是关键。
- `mock-key`/`127.0.0.1` → 你的本地 mock 端点。

<a id="limits"></a>

## 43. 证据限制与未决项

1. **远端信任未验证**：源仓能证明 workflow/gate 定义，不能证明 GitHub 分支保护、required checks、secret 权限、组织策略。采用项目必须单独提供。
2. **不是全量审阅**：本次审阅覆盖测试策略、配置、核心守卫、支持包 README、Skills 和关键 CI；没有逐行读完全部 `packages/*/tests/**`、所有 workflow、所有 benchmark case、所有 Web e2e。覆盖率报告列出未检查候选。
3. **历史示例有时效性**：Agent Notes 是当时的决策/验证记录；当前代码可能已变化。引用它们只作为机制来源，不当作当前状态。
4. **snapshot corpus 标签是人工声明**：政策测试验证标签/代际/角色，不验证 fixture 是否真的覆盖了标签声称的行为。
5. **benchmark 数字依赖机器**：源仓的预算/校准值不能直接移植；容器 CPU 配额、共享宿主、Node 版本都会改变结果。
6. **mock 边界不是端到端**：任何 harness 都有未覆盖的真实边界；README 的“not proof”必须保留。
7. **平台矩阵未穷举**：源仓有 Windows/macOS/Linux 的多条 lane，但本次没有逐条运行/审阅所有 workflow；平台结论只到“存在显式机制”。
8. **秘密审计未做**：没有扫描历史提交/第三方日志；只审阅了 secret 隔离和 fixture 规则。
9. **机制数量不是目标**：40 个是按源仓证据归纳的可操作单元；采用项目应按风险合并/删减，不要为了数量造检查器。

<a id="cross-domain"></a>

## 44. 交叉域依赖

| 依赖域 | 本文使用点 | 需要对方域确认 |
|---|---|---|
| CI/发布 | M15 built 产物、M37 lane、M31 benchmark job | required check、发布/打包、runner 配置 |
| 文档 | M16 文档输出、M36 `doc-sync` | 文档配对/链接/生成物规则 |
| 会话格式 | M18 代际、M19 corpus、M20 record/refresh | 格式版本语义、迁移 codec、writer 行为 |
| 安全 | M11/M22/M39 key/secret | 审批、secret 管理、泄露响应 |
| 桌面/安装器 | 跨域测试笔记（installed update/download） | 安装、更新、签名、平台打包 |
| Python SDK | M40 Python pytest/installed-wheel/real API；M16 Python 期望输出 | Python runtime/打包/发布、wheel 平台矩阵 |
| 供应链 | benchmark-npm-resolution 等 | 依赖/打包策略 |

**绑定状态.** `research/testing-coverage.json` 的 `crossDomain` 已把 automation、release、engineering、documentation、rationale、agent-workflows、collaboration 绑定到 sibling coverage 的**实际 inspected 路径与 ranges**；session-format、security、supply-chain 在编写时没有 sibling coverage artifact，显式标为 `unbound-no-sibling-coverage`，不伪造绑定。

**跨域边界.** 本文只负责“测试如何证明”；不重新定义发布策略、会话格式规范、安全审批或文档配对规则。遇到这些域的具体决策，回到对应 owner；测试域只提供证据要求和失败处理。

---

### 附：最小可执行命令卡（以源仓为例，采用时替换路径）

```sh
pnpm run test <focused>                 # 单元；不设覆盖率门禁
pnpm run test:coverage                  # per-file 100% 覆盖率门禁
pnpm run test:coverage:partitioned      # 分区覆盖率（CI）
pnpm run test:expected                  # owner-local 进程期望
pnpm run test:snapshot                  # keyless recorded-session replay
pnpm run test:snapshot:record           # 需要 key，新增/模型转录变化
pnpm run test:snapshot:refresh          # replay 输入仍有效，刷新期望
pnpm run test:web                       # build + Chromium/WebKit
pnpm run test:web:built                 # 已 build 的 Web snapshot
pnpm run test:e2e                       # 有 key 才证明 provider；无 key 自跳过
pnpm run test:bench                     # build + 预算 benchmark
pnpm run test:bench:memory              # 内存压力案例
pnpm run build:check                    # 在最新 build:artifacts 上检查 tests/scripts 类型
pnpm run doc-sync                       # 文档门禁
pnpm run check:all                      # 本地完整演练（opt-in）
```

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `testing-tiered-evidence-selection`：`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:25-61@687f282e`
- `testing-execution-topology`：`deepseek-harness/docs/testing.md:19-21@687f282e`、`deepseek-harness/vitest.config.ts:1-50@687f282e`
- `testing-resource-isolation`：`deepseek-harness/scripts/test-proxy-environment.ts:1-63@687f282e`
- `testing-global-state-and-platform-semantics`：`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-plugin-manager-git-child-environment.md:5-20@687f282e`
- `testing-coverage-per-file-100`：`deepseek-harness/vitest.config.ts:57-100@687f282e`、`deepseek-harness/vitest.config.ts:230-260@687f282e`
- `testing-coverage-exclusion-ledger`：`deepseek-harness/scripts/coverage-uncovered-locations.cjs:1-121@687f282e`
- `testing-coverage-partitioning`：`deepseek-harness/scripts/coverage-partitions.ts:1-16@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:200-300@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:300-400@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:430-520@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:560-700@687f282e`
- `testing-e2e-real-api-key-policy`：`deepseek-harness/.github/workflows/e2e.yml:52-99@687f282e`、`deepseek-harness/.github/workflows/e2e.yml:100-127@687f282e`
- `testing-e2e-credential-and-egress-isolation`：`deepseek-harness/.github/workflows/e2e.yml:1-32@687f282e`、`deepseek-harness/.github/workflows/e2e.yml:82-127@687f282e`
- `testing-real-implementation-mock-boundary`：`deepseek-harness/packages/test-support/remote-mock/README.md:1-80@687f282e`
- `testing-real-entry-composition`：`deepseek-harness/packages/test-support/loader-smoke/README.md:1-130@687f282e`、`deepseek-harness/apps/cli/tests/profiles/headless/tests/workspace-context-resume.expected.e2e.ts:1-80@687f282e`
- `testing-source-built-entry-modes`：`deepseek-harness/docs/testing.md:37-45@687f282e`、`deepseek-harness/docs/development.md:65-120@687f282e`、`deepseek-harness/tsdown.config.ts:1-30@687f282e`
- `testing-snapshot-required-and-placement`：`deepseek-harness/snapshots/AGENTS.md:1-17@687f282e`
- `testing-snapshot-manifest-and-guards`：`deepseek-harness/packages/test-support/session-snapshot/src/manifest.ts:1-432@687f282e`、`deepseek-harness/scripts/session-fixture-layout.ts:1-60@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/tests/manifest.spec.ts:1-207@687f282e`
- `testing-snapshot-selection-and-generations`：`deepseek-harness/scripts/session-fixture-layout.ts:130-270@687f282e`
- `testing-snapshot-corpus-policy`：`deepseek-harness/scripts/session-snapshot-corpus.corpus.ts:1-216@687f282e`、`deepseek-harness/scripts/session-snapshot-corpus-policy.spec.ts:1-146@687f282e`
- `testing-snapshot-modes`：`deepseek-harness/docs/testing.md:53-55@687f282e`、`deepseek-harness/package.json:69-76@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1226-1234@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1300-1405@687f282e`、`deepseek-harness/scripts/run-gates.ts:747-754@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:132-140@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:1097-1145@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1135-1192@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1252-1262@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:551-562@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/launcher.ts:343-369@687f282e`、`deepseek-harness/packages/boot/app-boot/src/index.ts:95-112@687f282e`
- `testing-snapshot-normalization`：`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:1-45@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/src/normalize.ts:100-220@687f282e`
- `testing-snapshot-identity-and-credentials`：`deepseek-harness/packages/test-support/session-snapshot/src/identity.ts:1-135@687f282e`
- `testing-snapshot-header-pins`：`deepseek-harness/packages/test-support/session-snapshot/src/suite.ts:1226-1255@687f282e`
- `testing-snapshot-network-fixtures`：`deepseek-harness/scripts/snapshot-http-fixtures.spec.ts:1-203@687f282e`
- `testing-llm-replay-scripts`：`deepseek-harness/packages/test-support/llm-replay/README.md:1-100@687f282e`、`deepseek-harness/packages/test-support/llm-replay/src/index.ts:1031-1209@687f282e`
- `testing-web-performance-and-stress`：`deepseek-harness/package.json:80-85@687f282e`
- `testing-benchmark-workload-hygiene`：`deepseek-harness/benchmarks/session-open/session-open.bench.ts:120-260@687f282e`
- `testing-support-harness-roster`：`deepseek-harness/packages/test-support/session-snapshot/README.md:1-30@687f282e`、`deepseek-harness/packages/test-support/agent-loop-testkit/README.md:1-70@687f282e`、`deepseek-harness/packages/test-support/client-runtime/README.md:1-70@687f282e`、`deepseek-harness/packages/test-support/llm-mock-server/README.md:1-60@687f282e`
- `testing-llm-mock-server-contract`：`deepseek-harness/packages/test-support/llm-mock-server/README.md:1-169@687f282e`
- `testing-reliability-skill`：`deepseek-harness/.agents/skills/dsh-ci-test-reliability/SKILL.md:1-131@687f282e`
- `testing-pre-push-evidence-selection`：`deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md:1-137@687f282e`、`deepseek-harness/docs/development.md:133-148@687f282e`、`deepseek-harness/AGENTS.md:113-121@687f282e`、`deepseek-harness/lefthook.yml:1-49@687f282e`
- `testing-web-browser-lane`：`deepseek-harness/docs/testing.md:15-15@687f282e`、`deepseek-harness/vitest.web.config.ts:1-37@687f282e`、`deepseek-harness/package.json:76-80@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1-90@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-07-24-web-gui-browser-e2e-lane.md:1-20@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-09-27-spreadsheet-selection-by-keyboard-before-reflow.md:5-14@687f282e`、`deepseek-harness/scripts/run-web-snapshots.ts:1-44@687f282e`
- `testing-ci-orchestration-and-trust`：`deepseek-harness/.github/workflows/ci.yml:737-763@687f282e`、`deepseek-harness/scripts/run-gates.ts:280-391@687f282e`、`deepseek-harness/docs/development.md:148-160@687f282e`
- `testing-secret-and-credential-hygiene`：`deepseek-harness/.github/workflows/e2e.yml:1-127@687f282e`
- `testing-python-sdk-keyless-blackbox`：`deepseek-harness/python/development.md:18-58@687f282e`、`deepseek-harness/python/development.md:59-75@687f282e`

## 来源索引（固定提交）

来源：deepseek-harness/scripts/lane-test-budget.spec.ts:1-55@687f282e 来源：deepseek-harness/vitest.config.ts:229-403@687f282e 来源：deepseek-harness/scripts/smoke-python-runtime.py:1139-1300@687f282e 来源：deepseek-harness/python/sdk/tests/test_bundled_runtime.py:84-106@687f282e
