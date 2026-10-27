# benchmark-contracts：DeepSeek Harness benchmark 执行契约迁移参考

本文件是 `benchmark-contracts` 域的自包含操作参考。来源固定为 `deepseek-harness/` 的提交 `687f282e8625c6b8d11ff58211a90524be2e4317`；引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e`。本域覆盖 `benchmarks/` 下的 30 条分片指派路径（案例入口、编译型 worker、报告实现、fixture 生成器、session/corpus/terminal/browser 专用 worker 与构建配置），另有四个案例目录的 8 个中英 README 正文与 4 个生成的 `README.i18n.yaml` 也已作为 canonical inspected 记录进入覆盖账本。

本域**不**重复拥有 benchmark 目录政策与 CI job 的 canonical 规则（`testing-benchmark-gate`）、workload 隔离与原始样本的一般规则（`testing-benchmark-workload-hygiene`）、Web perf/stress lane（`testing-web-performance-and-stress`）。这些机制由 `testing` 域拥有；本文件只在需要时交叉引用。`benchmarks/AGENTS.md`、`benchmarks/package.json`、`benchmarks/session-open/session-open.bench.ts`、`benchmarks/support/calibration.ts` 与 `benchmarks/support/machine-profiles.ts` 的覆盖记录在 `research/testing-coverage.json`。

**证据限制。** 固定提交中没有 `benchmarks/README.md`；该目录的指令文件是 `benchmarks/AGENTS.md`。以下行号只对 `687f282e` 有效。所有 `verification` 条目均标为 `planned`，未在目标仓库执行，不得当作已通过的保证。

## Scope

**拥有：**

- 案例选择与排除：什么进 `benchmarks/`、什么留在包内 `.perf.ts`、Host/Client 后缀、support 提升阈值。
- 编译型 worker 与纯 Node 协议：`.dsh-build` 产物、无 TS loader、built `lib` 解析、单行 JSON、超时与退出码。
- 端点登记与报告：`BenchmarkCase`、`recordTimings`、`recordPeakMemory`、CPU/IO 份额、失败后仍渲染已记录端点的 `report.html`。
- 预算校准：参考机期望、CI 时间尺度、方差余量、内存/比值不缩放、recorded samples 校准测试、文件级时限。
- fixture 来源与自校验：只读常量、聚合分布、生产解析校验、parity、运行时拼装凭证、冻结旧代际 fixture。
- 生产入口保真：只替换 model/provider、私有适配器白名单、完成度计数、端点保留。
- 隔离单位：进程attempt私有child/root；纯同步fold每样本fresh对象图；重复list可有意复用同attempt的Host；清理错误按案例区分。
- 浏览器样本完整性：replay-only、私有 scaffold 世界、可见性等待、trusted input witness、独立清理。

**源范围事实。** 固定源有8个案例目录，两个include glob收集**10个文件：9个计时文件+1个`agent-continuation/synthetic-history.bench.ts`夹具自校验**。agent-continuation与session-corpus各有两个被收集文件，不能混用“计时数”和“完整清单”。政策归AGENTS，数值归案例/README/calibration。bench作业只监听PR；master串行聚合不含ci-bench。远端必需检查未核验。

**不拥有：** 产品算法本身；benchmark CI job 的机器与超时（`testing-benchmark-gate`）；snapshot 语料政策（`testing-snapshot-corpus-policy`）；发布流程与供应链策略。

**非治理记录：** `benchmarks/session-open/session-open.constants.ts` 是 12 行纯常量（Session id、cwd、存储目录、released-v0 文件名），没有规则、门禁或流程，因此 disposition 为 `non-governance`。

**案例 README 契约与补充记录。** 四个案例目录的中英 README 与 `vitest.bench.config.ts` 不在 30 条分片指派路径内，但它们是可达的 benchmark 契约：八个 README 正文已逐行通读（长行以 `:N:raw` 复核）并作为 canonical inspected 记录写入覆盖账本，映射到机制 1/3/4/5/6/7/8；四个 `README.i18n.yaml` 是生成的配对哈希记录，按 `generated` 记录且不携带独立义务；`vitest.bench.config.ts` 仍以补充契约记录在 `supplementalContracts`。案例 README 是预算、host 类别、余量、排除项、运行命令与端点表的公开契约，其数字是源机器事实，不能直接当作目标仓库的可迁移保证。

**推荐迁移顺序：** 先建立构建平面与 worker 协议（机制 2），再建立端点报告（机制 3），随后校准预算与文件时限（机制 4）；fixture 与生产入口保真（机制 5、6）必须与案例同时落地；浏览器案例最后接入（机制 8）。

## Mechanisms

<a id="m-benchmark-contracts-case-selection-and-layout"></a>
### `benchmark-contracts-case-selection-and-layout` — 按被测用户路径选案例、命名与 support 归属 {#benchmark-contracts-case-selection-and-layout}

**触发。** 新增性能门禁；判断脚本应放包内还是 `benchmarks/`；决定后缀；把 helper 提升为共享 support。

**前置条件。** 目标仓库能说清一条用户路径跨越哪些包，以及该路径是否值得阻断合并。

**义务。**

- `benchmarks/` 只承载跨包所有权、需要仓库级门禁的实测用户路径；包内本地诊断留在所有者旁边，用 `.perf.ts`，不加入 `test:bench`。
- 一个用户路径一个目录，不镜像包树。
- Host 案例用 `*.bench.ts`；Client-face 用 `*.bench.client.ts`；worker/fixture/support 不带 benchmark 后缀。
- 场景专用 helper 先留在案例目录；至少两个目录需要同一行为后才移入 `benchmarks/support/`。
- 只有被 bench 配置的 include glob 收集、并由 PR 的 `node 24 / benchmarks` 作业执行的案例才算门禁；本地诊断不得冒充阻断证据。master 串行聚合不含该作业。
- 在所属 Agent Note 记录 workload、计时边界、内存端点、校准参考、替代方案与已知排除项。

**步骤。**

1. 写清被测用户路径与跨包边界，而不是先选包。
2. 需要仓库级阻断 → `benchmarks/<user-path>/`；只是本地诊断 → 包内 `.perf.ts`。
3. 按 Host/Client 选择 `.bench.ts` / `.bench.client.ts`；worker 与 fixture 用无后缀名称。
4. 确认第二个消费者后再提升 helper 到 `support/`。
5. 在 Agent Note 写清边界与排除项；若加入内存压力清单，用手动 Linux cgroup 在 4 GiB 与 8 GiB 下重跑，预算不变。

**责任者与完成信号。** 性能作者负责归属与文案，模块所有者确认用户路径；完成信号是 bench glob 只收集应成为门禁的案例，PR bench 作业执行它们，且每个案例都有 workload/排除项记录。

**失败处理。** 诊断混入 `test:bench` 会让门禁随本地环境波动；镜像包树会把端到端拆成组件；support 过早集中会让单案例细节变成全局耦合。发现后按后缀或目录归位，不通过放宽预算解决。

**例外。** 包内诊断可以存在，但不得使用 `.bench.ts`；一个目录可以包含同一用户路径的多个 endpoint；内存压力清单只是手动重跑子集，不改变门禁归属，也不由 CI 执行。

**证据。**

<a id="m-benchmark-contracts-case-path"></a>
- `deepseek-harness/benchmarks/AGENTS.md:3-6@687f282e` — 本树拥有跨包性能门禁；包内诊断用 `.perf.ts`；按用户路径一目录，Host/Client 后缀分离。

<a id="m-benchmark-contracts-case-support"></a>
- `deepseek-harness/benchmarks/AGENTS.md:14-14@687f282e` — 场景 support 先留在案例旁，至少两个案例需要同一行为后才进 `benchmarks/support/`。

<a id="m-benchmark-contracts-case-note"></a>
- `deepseek-harness/benchmarks/AGENTS.md:17-17@687f282e` — workload、计时边界、内存端点、校准参考、替代方案与排除项写入所属 Agent Note。

<a id="m-benchmark-contracts-case-layout"></a>
- `deepseek-harness/benchmarks/tsdown.config.ts:15-52@687f282e` — 每个案例目录单独 entry/outDir，说明布局是一案例一目录。

<a id="m-benchmark-contracts-case-local-fixture"></a>
- `deepseek-harness/benchmarks/agent-continuation/workload.ts:1-30@687f282e` — 场景专用 workload 与常量留在案例目录。

<a id="m-benchmark-contracts-case-shared-helper"></a>
- `deepseek-harness/benchmarks/support/built-worker.ts:1-102@687f282e` — 多个案例共享的启动器才放进 `support/`。

<a id="m-benchmark-contracts-case-autodiscovery"></a>
- `deepseek-harness/benchmarks/agent-continuation/README.md:21-21@687f282e` — 契约写明必需基准通道自动发现本文件；案例靠 glob 进入门禁，不靠逐文件登记。
- `deepseek-harness/benchmarks/agent-continuation/README.zh.md:21-21@687f282e` — 中文契约同句：必需基准通道自动发现此文件。

<a id="m-benchmark-contracts-built-worker-protocol"></a>
### `benchmark-contracts-built-worker-protocol` — 编译型 worker、纯 Node 协议与 built lib 解析 {#benchmark-contracts-built-worker-protocol}

**触发。** 新增或修改受预算约束的案例；把计时拆进 worker；升级构建器/Node/Vitest；怀疑 benchmark 跑在 src 或 TSX 下。

**前置条件。** 有一个能产出 ESM `lib` 的构建平面，以及 plain Node 子进程启动能力。

**义务。**

- 计时放进 `benchmarks/.dsh-build/<case>/*.worker.js`；先构建 workspace lib 与 worker，再由 Vitest 编排。
- 启动器只接受 `.js`/`.cjs`；删除 `NODE_OPTIONS` 与 `TSX_TSCONFIG_PATH`。
- 每个 worker 调用 `assertBuiltBenchmarkRuntime(import.meta.url, entries)`：入口必须是 `benchmarks/.dsh-build/` 下的 `.js`，`execArgv` 不得含 tsx，声明包入口必须解析到 `/lib/....js`。
- 构建统一 `platform: node`、`target: es2024`、`dts: false`、`neverBundle: [/^@deepseek-ai\//]`；host 与 Client 分别用 `tsconfig.host.json` / `tsconfig.client.json`。
- 只有无公开 Node 导出的路径才允许 bundle 私有适配器；其余包保持 external。
- worker 用最后一行以 `{` 开头的 stdout 作为唯一 JSON 报告；只有 `exitCode === 0` 才解析。
- 每次运行有`timeoutMs`，超时SIGKILL；按timedOut/signal/exitCode失败并保留诊断。源并非统一截尾：session-corpus/projection-list截尾，agent-continuation输出outcome，reconnect将`run.stderr`作为`expect(actual,message)`的失败消息，不是断言stderr值，也不是缺少stderr诊断。

**步骤。**

1. 在案例目录写 worker 入口，测量逻辑留在 worker。
2. 在 `tsdown.config.ts` 增加 entry/outDir/tsconfig，保持 `@deepseek-ai/*` external。
3. 在 worker 末尾声明被测包入口并调用运行时断言。
4. bench 文件用 `runBuiltBenchmarkWorker` 指定编译路径、参数、timeout 与可选 GC/堆参数。
5. 先校验 child 结果，再读 report 并断言。
6. 运行 `test:bench`，确认 worker 从 `.dsh-build` 启动；构建产物是否新于源码需作者另行核对，运行时断言不检查 freshness，也不会检测 stale lib。

**责任者与完成信号。** 性能作者与构建维护者共同负责；完成信号是从 fresh checkout 运行 `test:bench` 时 worker 全部从 `.dsh-build` 启动。

**失败处理。** 入口为 `.ts`、execArgv 含 tsx、包解析到 `src` 时立即抛错；超时或非零退出让案例失败。不要通过保留 `TSX_TSCONFIG_PATH` 或放宽路径检查来“修复”。stale `.dsh-build`/`lib` 不会被断言识别，只能重新构建；源仓库没有 drift 或 freshness 检查。

**例外。** 内存案例可额外传 `--expose-gc`、`--max-old-space-size` 与固定 semi-space；私有适配器可被 bundle，但包 import 仍 external；纯同步 fold 也走编译 worker，不退回 src。

**证据边界。** 运行时断言只证明入口位于 `.dsh-build`、`execArgv` 无 tsx、声明的包入口解析到 `/lib/...js`，不证明构建产物新于源码，也不校验 worker 报告 schema。把“构建产物新于源码”作为门禁是目标仓库的可选增强，源提交未实现。

**证据。**

<a id="m-benchmark-contracts-built-compiled-only"></a>
- `deepseek-harness/benchmarks/support/built-worker.ts:30-38@687f282e` — 拒绝非 `.js`/`.cjs` worker，并从子进程环境删除 `NODE_OPTIONS` 与 `TSX_TSCONFIG_PATH`。

<a id="m-benchmark-contracts-built-timeout"></a>
- `deepseek-harness/benchmarks/support/built-worker.ts:58-61@687f282e` — 每次 child 都有 deadline，超时 SIGKILL。

<a id="m-benchmark-contracts-built-json"></a>
- `deepseek-harness/benchmarks/support/built-worker.ts:69-77@687f282e` — 只取最后一行 JSON，且只有退出码 0 才解析报告。

<a id="m-benchmark-contracts-built-assert"></a>
- `deepseek-harness/benchmarks/support/built-worker.ts:88-102@687f282e` — 强制 `.dsh-build` 路径、无 tsx loader、声明包入口匹配 `/lib/...js`。

<a id="m-benchmark-contracts-built-external"></a>
- `deepseek-harness/benchmarks/tsdown.config.ts:3-12@687f282e` — node/es2024、`neverBundle` workspace 包，保持 built lib 解析。

<a id="m-benchmark-contracts-built-percase"></a>
- `deepseek-harness/benchmarks/tsdown.config.ts:15-34@687f282e` — 每案例独立 entry/outDir/clean，Host 与 Client 使用不同 tsconfig。

<a id="m-benchmark-contracts-built-callsite"></a>
- `deepseek-harness/benchmarks/agent-continuation/agent-continuation.worker.ts:129-142@687f282e` — worker 末尾声明 AgentLoop/session/LLM/tools/persistence 的 built 入口。

<a id="m-benchmark-contracts-case-glob"></a>
- `deepseek-harness/vitest.bench.config.ts:19-22@687f282e` — bench 配置用 `benchmarks/**/*.bench.ts` 与 `*.bench.client.ts` 两个 glob 自动收集案例。

<a id="m-benchmark-contracts-report-worker-failure"></a>
- `deepseek-harness/benchmarks/agent-continuation/README.md:21-21@687f282e` — README 契约要求失败 worker 报告 exit、signal、timeout 与 stderr 末尾；实际调用方实现并不统一。
- `deepseek-harness/benchmarks/agent-continuation/README.zh.md:21-21@687f282e` — 中文契约重复该失败报告义务。
- `deepseek-harness/benchmarks/session-corpus/README.md:21-21@687f282e` — 同一失败报告规则也适用于语料 worker。

<a id="m-benchmark-contracts-measurement-attribution-and-report"></a>
### `benchmark-contracts-measurement-attribution-and-report` — 端点归属、CPU/IO 份额与失败后仍生成的报告 {#benchmark-contracts-measurement-attribution-and-report}

**触发。** 新增受预算约束的 wall-clock 或内存端点；迁移参考机器；失败后需要解释哪一段变慢；CI 缺少 benchmark-report。

**前置条件。** 有一个共享端点登记 API 与可写的报告目录。

**义务。**

- 源仓库对可缩放端点先 `recordTimings(case, timings, budgets)`，再断言；浏览器 first/input/streamWall 只断言不记录。若目标要求每个 verdict 都可从报告解释，应补齐这些记录。
- Timing 二选一：同区间进程 CPU `{ms,cpuMs}`，或带注释的存储等待份额 `{ms,ioShare}`；不要来源不明的 io。
- 含 paced/固定等待的端点不参与缩放；预算用绝对期望值加回固定等待。
- 整进程 peak RSS 走 `recordPeakMemory`；内存与无量纲比值不缩放。源仓库只有 session-corpus 调用 `recordPeakMemory`，其他案例的 retained/peak 内存只在本进程断言，没有报告行。
- `results.jsonl` 与 `report.html` 只保留传给 `recordTimings` 的聚合值（及预算）；原始 per-sample 数组只在 console JSON 与 CI 日志。必须写清 median/min/absolute/ratio。
- `setup()` 清空 `.dsh-report`，`teardown()` 在有结果时渲染 `report.html`；失败案例也保留已记录端点。
- 报告嵌入 CPU 型号、平台/架构、Node、并行度、`GITHUB_SHA` 与机器 profile；无匹配时 `measuredProfile` 为 undefined，Measured 选择回退到 `github-ubuntu-24.04` 并追加无匹配提示。
- 4/8 GiB 对照只是标尺，不是 OS 内存限制；不得声称测到 swap、reclaim 或容量认证。
- 浏览器 case 的 first/input/streamWall 有预算与 verdict，但不传给 `recordTimings`，`report.html` 没有这三行；只有 open/page/trajectory/streamTask 有缩放报告行，heap/DOM 只作诊断。
- 失败诊断按调用者区分：session-corpus/projection-list截取stderr尾部，agent-continuation输出完整outcome，reconnect在超时/信号/退出码断言失败时以`run.stderr`提供消息；不承诺成功时主动打印。

**步骤。**

1. 为每个端点写 `BenchmarkCase`（id/measures/affects）。
2. 在测量块收集样本、CPU 时间或声明 io 份额。
3. 先记录，再断言。
4. console 打印原始样本与聚合，供失败复盘；artifact 中只有聚合值。
5. 检查 `report.html` 与 CI artifact。
6. 失败时从 `results.jsonl` 定位端点。

**责任者与完成信号。** 性能作者登记端点，CI 维护者保证 artifact 上传；完成信号是失败运行仍产出包含该端点的 `report.html`。

**失败处理。** 漏记端点会让报告缺行；先断言后记录会在失败时丢数据；teardown 未跑则无报告；错误 ioShare 只影响跨机缩放，不应通过修改断言掩盖；浏览器 first/input/streamWall 与多数内存 verdict 本来没有报告行。

**例外。** paced replay 端点用绝对预算且不进入缩放集合；无法测 CPU 的 SDK/profile 案例可声明 ioShare 并注释依据；当案例决定记录内存且只取峰值时，用 `recordPeakMemory` 单一 endpoint。

**证据边界。** ioShare 是实测 CPU 补集或声明估计，HTML 允许读者覆盖；报告是诊断模型，不是容量认证，也没有 published-Host 运行证据。未匹配 CPU 时选择回退到 `github-ubuntu-24.04` 但仍显示无匹配提示。

**证据。**

<a id="m-benchmark-contracts-report-contract"></a>
- `deepseek-harness/benchmarks/support/scaling-report.ts:5-17@687f282e` — 每案例先记录再渲染；内存与无量纲比值不缩放；4/8 GiB 只作对照。

<a id="m-benchmark-contracts-report-case"></a>
- `deepseek-harness/benchmarks/support/scaling-report.ts:31-40@687f282e` — `BenchmarkCase` 要求 id、measures、affects。

<a id="m-benchmark-contracts-report-timing"></a>
- `deepseek-harness/benchmarks/support/scaling-report.ts:56-83@687f282e` — `Timing` 为 `ms+cpuMs` 或 `ms+ioShare`；`recordTimings` 同时写 budgetMs。

<a id="m-benchmark-contracts-report-memory"></a>
- `deepseek-harness/benchmarks/support/scaling-report.ts:96-108@687f282e` — peak memory 单独记录；setup 清空报告目录。

<a id="m-benchmark-contracts-report-teardown"></a>
- `deepseek-harness/benchmarks/support/scaling-report.ts:111-127@687f282e` — teardown 只在有 results 时渲染，并嵌入 CPU、平台、Node、revision、cores 与匹配 profile。

<a id="m-benchmark-contracts-report-profile-fallback"></a>
- `deepseek-harness/benchmarks/support/scaling-report.ts:247-248@687f282e` — 无匹配 CPU 时 Measured 选择回退到 `github-ubuntu-24.04`，并追加 “No profile matches this CPU” 提示。

<a id="m-benchmark-contracts-report-usecase"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:239-325@687f282e` — list/search/fork 分别记录 phase timing 与 peak RSS，然后断言预算。

<a id="m-benchmark-contracts-report-paced"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:439-454@687f282e` — 只把无 paced 等待的端点交给 `recordTimings`，streamWall 用绝对预算。

<a id="m-benchmark-contracts-budget-calibration-and-file-deadlines"></a>
### `benchmark-contracts-budget-calibration-and-file-deadlines` — 参考机期望、CI 时间尺度、方差余量与文件级时限 {#benchmark-contracts-budget-calibration-and-file-deadlines}

**触发。** 首次设定预算；CI runner 或参考机更换；benchmark flaky 或持续超预算；新增内存/比值型预算。

**前置条件。** 有稳定参考机或 hosted runner，能多次采样并保存历史结果。

**义务。**

- `ciTimeBudget(expectedMs) = ceil(expectedMs × CI_TIME_SCALE × PERFORMANCE_BUDGET_HEADROOM)`；源仓库 `CI_TIME_SCALE = 2`、headroom `1.25`，均为具名常量。
- 已经直接来自 CI 的期望值只乘方差余量，不再乘机器时间尺度。
- 内存只乘 headroom，不乘时间尺度；无量纲比值用独立余量（如 user-text 的 1.75）。
- 预算值是受评审源码常量；环境变量不得覆盖；改预算要同时更新参考记录与理由。
- 保留能解释 verdict 的原始样本与聚合；median/min/absolute/ratio 的选择写在常量附近或测试名中。
- 校准测试接受 recorded hosted samples，拒绝 `ceil(expected × 1.26)` 的合成回归，并断言预算数值本身。
- session-corpus 的文件总时限是运行结束后的 300 s 断言，child deadline 等于这 300 s；每个测试的 deadline 为 worker 数 × child timeout + 30 s，只能保证该测试内 child 先于测试超时。fork 测试 deadline 可达 21 min，超过 PR bench 作业 20 min timeout，故不存在通用的严格 deadline 排序保证。
- 单样本只用于成本主导的端点（如最长 fork），其余用多次 fresh 进程 median。
- 加入 `test:bench:memory` 的案例必须在 4/8 GiB 下满足同一预算；该重跑是 Linux-only 的手动 cgroup 工具（`scripts/run-memory-pressure-bench.ts`），不是 CI 作业。

**步骤。**

1. 在参考机记录多次样本，写出期望毫秒并注明机器与日期。
2. 选择 median/min/absolute/ratio，把预算写成常量表达式。
3. 为预算分支补校准测试：recorded 通过、`ceil(expected × 1.26)` 合成回归失败、数值被显式断言。
4. 分别设置文件总时限（结束后断言）和 per-test deadline；它们不保证早于 CI job timeout。
5. CI 失败先复跑并核对机器 profile，再判断回归或预算漂移。
6. 改预算时提交参考样本与理由，不用环境变量覆盖。

**责任者与完成信号。** 性能作者维护期望与校准测试，CI 维护者维护 runner；完成信号是校准测试在两类样本上分别通过/失败，且预算常量被显式断言。

**失败处理。** 预算过紧 → flaky；过松 → 回归漏过；静默调数或环境变量覆盖 → 失去可审计性；文件 deadline 是结束后断言，不能抢占失控 child；per-test deadline 超过 job timeout 时作业先被取消，清理与报告可能来不及。处理顺序是复跑、核对机器、再调参考样本。

**例外。** 内存压力重跑预算不变，但只在手动 Linux cgroup 下执行；最长 fork 允许单样本；浏览器 CI 期望不再乘 2× 时间尺度。

**证据边界。** 2× 与 1.25 是源仓库特定机器事实；recorded samples 有日期，源仓库没有 freshness/drift 检测。预算只在 `pull_request` 的 `node 24 / benchmarks` 作业执行（`.github/workflows/ci.yml:206-264`）；master 串行聚合不含 `ci-bench`（`scripts/run-gates.ts:400-426`），远端分支保护是否把该作业列为必需检查未验证。4/8 GiB 重跑是手动工具，不是 CI。

**证据。**

<a id="m-benchmark-contracts-budget-formula"></a>
- `deepseek-harness/benchmarks/support/calibration.ts:1-15@687f282e` — `CI_TIME_SCALE=2`、headroom `1.25`、`ciTimeBudget` 向上取整。

<a id="m-benchmark-contracts-budget-guidance"></a>
- `deepseek-harness/benchmarks/AGENTS.md:12-13@687f282e` — 参考机期望与 CI 尺度分离；内存/比值不乘时间尺度；预算用源码常量，环境变量不得覆盖。

<a id="m-benchmark-contracts-budget-calibration-tests"></a>
- `deepseek-harness/benchmarks/agent-continuation/agent-continuation.bench.ts:60-150@687f282e` — recorded hosted 样本被接受、合成回归被拒绝、预算数值被断言。

<a id="m-benchmark-contracts-budget-recorded-ci"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:44-78@687f282e` — 记录 CI 样本与四舍五入期望分开保存。

<a id="m-benchmark-contracts-budget-file-limit"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:20-31@687f282e` — 文件总时限 300 s，worker deadline 等于文件上限。

<a id="m-benchmark-contracts-budget-deadline"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:117-119@687f282e` — test deadline = workers × child timeout + 30 s；它只保证该测试内 child 先被回收，不等同于文件总时限或 job timeout。

<a id="m-benchmark-contracts-budget-reject"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:192-203@687f282e` — 11 个 recorded 值全部接受，+26% 期望值被拒绝。

<a id="m-benchmark-contracts-budget-browser"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:14-24@687f282e` — 浏览器预算来自 CI 期望 × headroom，另设回声放时长。

<a id="m-benchmark-contracts-budget-ratio"></a>
- `deepseek-harness/benchmarks/user-text/user-text.bench.client.ts:20-80@687f282e` — 未匹配比值单独使用 1.75 余量，adversarial 端点设独立预算。

<a id="m-benchmark-contracts-budget-allocation"></a>
- `deepseek-harness/benchmarks/user-text/user-text.bench.client.ts:140-161@687f282e` — allocation 预算由 floor + 每凭证 + 每换行 + 每字符项组成。

<a id="m-benchmark-contracts-budget-case-contract"></a>
- `deepseek-harness/benchmarks/agent-continuation/README.md:19-21@687f282e` — 五个 fresh-process 样本、catalog/tool 900 ms 期望与 1.25×；request-history 297 ms 是受评审托管上限（非实测期望）；不得与构建或其他 benchmark 重叠。
- `deepseek-harness/benchmarks/agent-continuation/README.zh.md:19-21@687f282e` — 中文契约给出同一组预算与不重叠义务。
- `deepseek-harness/benchmarks/active-stream-reconnect/README.md:5-7@687f282e` — 50 ms × 2× CI × 1.25 = 125 ms；retained heap 30 MiB 不随时间缩放；三个 fresh worker。
- `deepseek-harness/benchmarks/active-stream-reconnect/README.zh.md:5-7@687f282e` — 中文契约重复 125 ms 与 30 MiB 的分离缩放规则。
- `deepseek-harness/benchmarks/long-session-browser/README.md:13-13@687f282e` — open/page/trajectory 900/700/520 ms 期望，1.25× 后为 1125/875/650 ms；heap/DOM 只作诊断。
- `deepseek-harness/benchmarks/long-session-browser/README.zh.md:13-13@687f282e` — 中文契约给出同一组浏览器预算与诊断边界。
- `deepseek-harness/benchmarks/session-corpus/README.md:19-21@687f282e` — 1.5 GB 播种写入私有根、成功失败都删除、整文件含播种 300 s 上限。
- `deepseek-harness/benchmarks/session-corpus/README.zh.md:19-21@687f282e` — 中文契约重复 1.5 GB 私有根与五分钟失败规则。

<a id="m-benchmark-contracts-budget-serial"></a>
- `deepseek-harness/vitest.bench.config.ts:23-24@687f282e` — `fileParallelism: false` 与 `maxWorkers: 1` 保证测量不与另一个 benchmark 共享 CPU。

<a id="m-benchmark-contracts-budget-memory-manual"></a>
- `deepseek-harness/scripts/run-memory-pressure-bench.ts:1-25@687f282e` — 4/8 GiB 是 Linux cgroup 手动重跑工具，列出参与文件；不是 CI 作业。

<a id="m-benchmark-contracts-budget-ci-scope"></a>
- `deepseek-harness/.github/workflows/ci.yml:206-264@687f282e` — `node 24 / benchmarks` 只在 `pull_request` 运行，`timeout-minutes: 20`，失败也上传 `.dsh-report`。
- `deepseek-harness/scripts/run-gates.ts:400-426@687f282e` — `ciPrimaryGates` 不含 `ci-bench`；master 串行聚合因此不运行 benchmark。

<a id="m-benchmark-contracts-fixture-provenance-and-validity"></a>
### `benchmark-contracts-fixture-provenance-and-validity` — 合成输入的来源约束、测量分布与 fixture 自校验 {#benchmark-contracts-fixture-provenance-and-validity}

**触发。** 新增 corpus、synthetic history 或 adversarial 输入；要让 workload 代表性可审计；生产 Session 格式升级；比较两个 workload 的 scaling。

**前置条件。** 有生产解析/序列化 API 可校验 fixture，并有合法的聚合统计来源。

**义务。**

- 固定输入由受评审常量合成；禁止录制 Session、用户材料、ambient repository 或网络服务。
- 从真实语料提取分布时只保留计数与字节总量，不保留内容、身份或路径。
- corpus 在每个 rank 上不小于测得分布、覆盖全部 anchor；测试只断言 events 与 logicalBytes 单调，turns 由共享 anchor 构造保证而非独立断言；同一 anchor body 在多个 Session 间复用。
- author 后先用生产解析器与投影折叠校验，再写入 corpus；不要测未验证 body。
- fixture 保留生产不变量：turn-one system head 可恢复，title/tool result 的 `sourceEventSeqs` 正确。
- 比较 workload 时非目标维度必须相等（事件数与 compact record 数），否则 scaling 测到窗口大小。
- 凭证与对抗输入运行时拼装；仓库不保存完整凭证格式字面量；每个样本 fresh matcher。
- released 旧代际 fixture（版本 0）是冻结输入，由 builder 写出，不让被测运行时重新生成；它属于格式代际/冻结 fixture，不是发布或打包事务。
- 浏览器 scaffold 的 session id / cwd 用占位符替换，保证每样本私有世界。

**步骤。**

1. 确认来源：只用常量、聚合统计或运行时拼装数据。
2. 选 anchor 与 rank→anchor 映射，断言 events/logicalBytes 单调与 anchor 覆盖。
3. 用生产 Session API author，再用生产解析器校验。
4. 为 fixture 写自校验（保护头、sourceEventSeqs、字节数、parity）。
5. 写入私有 mkdtemp 世界，测量前不再读 ambient 数据。
6. 生产格式升级时更新 builder 并重新证明可通过解析。

**责任者与完成信号。** fixture 维护者负责来源与自校验，性能作者负责 parity；完成信号是分布断言、生产解析校验与 parity 检查全部通过。

**失败处理。** 分布偏低让 list/search/fork 偏乐观；未校验 body 会测到错误路径；泄漏真实内容或凭证是安全缺陷；parity 漂移让 scaling 失效。出现后修 fixture，不调预算。

**例外。** released-v0 是旧代际输入；LLM/provider 边界可 synthetic，但 tool 执行管线、session、persistence 仍走生产实现（integrated case 的 tool body 可为 fixture）；聚合分布不要求逐 Session 复刻。

**证据。**

<a id="m-benchmark-contracts-fixture-synthetic-rule"></a>
- `deepseek-harness/benchmarks/AGENTS.md:9-9@687f282e` — 只用受评审常量合成；禁止录制 Session、用户材料、ambient repository 与网络。

<a id="m-benchmark-contracts-fixture-aggregate"></a>
- `deepseek-harness/benchmarks/session-corpus/corpus-shape.ts:1-22@687f282e` — 22 个分位来自 1,650 个本地 Session 的聚合值，只保留计数与字节，无内容/身份/路径。

<a id="m-benchmark-contracts-fixture-shape"></a>
- `deepseek-harness/benchmarks/session-corpus/corpus-shape.ts:58-76@687f282e` — 每个 rank 取不小于其分位的下一个 anchor，保证不低于测量分布。

<a id="m-benchmark-contracts-fixture-deterministic"></a>
- `deepseek-harness/benchmarks/session-corpus/synthetic-corpus.ts:1-30@687f282e` — 确定性生成器与测得的本地结构常量（每项目 19 Session、每 6 个一个 child 等）。

<a id="m-benchmark-contracts-fixture-author"></a>
- `deepseek-harness/benchmarks/session-corpus/synthetic-corpus.ts:198-260@687f282e` — 通过生产 `AssistantStreamAccumulator` 与 append 语义务 author 事件。

<a id="m-benchmark-contracts-fixture-header"></a>
- `deepseek-harness/benchmarks/session-corpus/synthetic-corpus.ts:313-340@687f282e` — 子代理比例、创建时间置换与 header 归属由固定规则决定。

<a id="m-benchmark-contracts-fixture-write"></a>
- `deepseek-harness/benchmarks/session-corpus/synthetic-corpus.ts:455-484@687f282e` — 每个 rank 复用 anchor body，写出 header + body frames。

<a id="m-benchmark-contracts-fixture-replay"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.worker.ts:191-215@687f282e` — anchor 先经生产 `Session.create` 与 `coldSnapshot` 校验，再保存。

<a id="m-benchmark-contracts-fixture-seed"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.worker.ts:242-267@687f282e` — 从已校验 body 写 corpus，并直接写 projection 记录供 list 使用。

<a id="m-benchmark-contracts-fixture-distribution"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:169-190@687f282e` — 断言每个 corpus 在每个 rank 不低于测量分布、anchor 全覆盖、events/logicalBytes 单调；turns 由构造保证，不在该循环断言。

<a id="m-benchmark-contracts-fixture-credentials"></a>
- `deepseek-harness/benchmarks/user-text/user-text.worker.client.ts:110-135@687f282e` — 凭证运行时拼装，仓库不保存完整凭证格式。

<a id="m-benchmark-contracts-fixture-released"></a>
- `deepseek-harness/benchmarks/session-open/synthetic-released-v0-session.ts:1-40@687f282e` — 冻结 released-v0 输入，固定文件名与旧代际 header。

<a id="m-benchmark-contracts-fixture-released-write"></a>
- `deepseek-harness/benchmarks/session-open/synthetic-released-v0-session.ts:160-205@687f282e` — builder 写出 version 0 header 与每行一 frame 的 body。

<a id="m-benchmark-contracts-fixture-validity"></a>
- `deepseek-harness/benchmarks/agent-continuation/synthetic-history.bench.ts:1-39@687f282e` — 用生产 parser 校验两套 seed 的受保护 system head 与 sourceEventSeqs。

<a id="m-benchmark-contracts-fixture-parity"></a>
- `deepseek-harness/benchmarks/conversation-fold/conversation-fold.worker.client.ts:275-290@687f282e` — 被比较的 window 必须事件数与 compact record 数完全相等。

<a id="m-benchmark-contracts-fixture-workload"></a>
- `deepseek-harness/benchmarks/agent-continuation/workload.ts:9-30@687f282e` — workload 维度明确独立于环境和录制用户材料。

<a id="m-benchmark-contracts-fixture-history"></a>
- `deepseek-harness/benchmarks/agent-continuation/workload.ts:66-114@687f282e` — 通过生产 `Session.append`、stream compaction 与固定 id/时间生成历史。

<a id="m-benchmark-contracts-fixture-browser"></a>
- `deepseek-harness/benchmarks/long-session-browser/synthetic-history.ts:1-30@687f282e` — 浏览器 fixture 的固定轮数、marker 与 pace；文件头声明不读取用户数据。

<a id="m-benchmark-contracts-fixture-browser-placeholder"></a>
- `deepseek-harness/benchmarks/long-session-browser/synthetic-history.ts:80-95@687f282e` — session id 与 cwd 用占位符，交给每个私有 scaffold 替换。

<a id="m-benchmark-contracts-workload-fidelity-and-completion-proof"></a>
### `benchmark-contracts-workload-fidelity-and-completion-proof` — 生产入口保真、私有适配器边界与完成度证明 {#benchmark-contracts-workload-fidelity-and-completion-proof}

**触发。** 新增需要真实 tool/session/客户端组合的案例；某个案例耗时异常偏低；考虑为 benchmark 新增生产导出；使用 synthetic provider。

**前置条件。** 目标仓库有可由 plain Node 启动的生产入口，且 tool/session/persistence 可真实组合。

**义务。**

- 通过生产入口与构建产物测量；不得复制产品算法，也不得仅为测量新增生产导出。
- 不把 benchmark 完成变成重复语义断言；用计数或端点输出证明完成。
- 只有无公开 Node 导出的被测路径才允许编译私有集成适配器；包 import 仍 external。
- 合成只用于昂贵/非确定的 model/provider 边界；tool 执行管线、session、persistence、Agent loop 仍走生产实现。integrated agent-continuation case 可通过真实 tool 管线执行 fixture tool body（`defineContentToolFixture`）；SDK profile case 才用真实 `str_replace_editor` 与真实文件读取。
- 用计数证明路径走完（model 请求、tool 调用、session seq、catalog 长度、tool result 内容），不一致即抛错。
- 显式拒绝被测路径之外的服务调用（如 search）。
- 测量区间只含目标操作；fixture、seed、GC、warm-up、dispose 在计时外。
- retained-memory 端点在最后一次 GC 时仍被引用，dispose 前不得释放。
- 浏览器 case 走共享 shipped-composition scaffold，并按要求分开报告 source-resolved test Host 与 published Host；固定提交只有 test Host 运行，没有 published-Host 运行证据。
- 只按明示opt-in配置测量search等feature成本。shipped base/Web默认`openAt:never`已有配置断言，Node22compat在构建后用`DSH_REQUIRE_BUILT_CLI_SMOKE=1`启用；普通Vitest收集会跳过。不能写成只有README或把opt-in成本当默认体验。

**步骤。**

1. 定位真实用户入口，确认可由 built 产物启动。
2. 只替换 model/provider；保留 tool 执行管线、session、persistence 与组合层；integrated case 的 tool body 可为 fixture，SDK profile case 用真实 editor。
3. 为 workload 建立预期计数并在 result 返回前校验。
4. 把 setup、warm-up、GC、清理移出计时区间。
5. 需要私有导出时写最小 adapter，并注释原因。
6. 先看完成度计数，再解读时间与内存。

**责任者与完成信号。** 性能作者与模块所有者共同负责；完成信号是计数等于 workload 常量且测量端点仍被引用。

**失败处理。** 路径短路/部分执行 → 时间偏低假绿；复制算法 → 测到副本；新增生产导出 → 扩大 API；替换真实 tool/persistence → 结论不可迁移；过早释放端点 → 内存差值错误。发现后恢复真实组合，而不是调低预算。

**例外。** model/provider 可 synthetic；私有适配器允许 bundle；integrated case 的 tool body 可为 fixture，真实 editor 仅用于 SDK profile case；纯内存 fold 可不启动完整 Host，但必须用生产 fold 实现。

**证据边界。** 合成model不证明provider网络行为，完成度计数仅覆盖显式步骤；test Host不等于published Host。默认关闭既有文档也有条件启用的base/Web断言，本轮只核对静态测试与入口接线，没有运行Node22compat或证明远端阻断。

**证据。**

<a id="m-benchmark-contracts-fidelity-rule"></a>
- `deepseek-harness/benchmarks/AGENTS.md:15-16@687f282e` — 走生产入口，不复制算法、不为测量加导出；私有适配器仅在无公开 Node 导出时允许。

<a id="m-benchmark-contracts-fidelity-counts"></a>
- `deepseek-harness/benchmarks/agent-continuation/agent-continuation.worker.ts:96-120@687f282e` — 记录 CPU/retained heap，并断言 requests 与 toolCalls 等于 workload 常量，否则抛错。

<a id="m-benchmark-contracts-fidelity-tool-body"></a>
- `deepseek-harness/benchmarks/agent-continuation/agent-continuation.worker.ts:84-96@687f282e` — integrated case 通过真实 tool 管线注册 `defineContentToolFixture` 的 fixture tool body。

<a id="m-benchmark-contracts-fidelity-sdk"></a>
- `deepseek-harness/benchmarks/agent-continuation/profile-continuation.worker.ts:30-80@687f282e` — 启动 built CLI bin，私有 HOME/cwd，经 profile patch 挂载真实 `str_replace_editor` 并校验真实 tool result 与请求/调用计数。

<a id="m-benchmark-contracts-fidelity-adapter"></a>
- `deepseek-harness/benchmarks/agent-continuation/profile-adapter.ts:1-8@687f282e` — 合成 model 只替换 LLM 边界，tools 仍是生产插件。

<a id="m-benchmark-contracts-fidelity-adapter-register"></a>
- `deepseek-harness/benchmarks/agent-continuation/profile-adapter.ts:33-42@687f282e` — 只注册 bench provider adapter，不替换其他服务。

<a id="m-benchmark-contracts-fidelity-refuse"></a>
- `deepseek-harness/benchmarks/agent-continuation/child-catalog.worker.ts:20-100@687f282e` — 显式拒绝 search，避免非被测工作进入；两次读取断言完整 catalog。

<a id="m-benchmark-contracts-fidelity-private-client"></a>
- `deepseek-harness/benchmarks/active-stream-reconnect/reconnect.worker.client.ts:1-49@687f282e` — 无公开 Node 导出时只 bundle Client 私有适配器；只计 replace()，GC 后读 retained。

<a id="m-benchmark-contracts-fidelity-private-terminal"></a>
- `deepseek-harness/benchmarks/terminal-io/session-adapter.ts:1-2@687f282e` — 私有生产终端入口被显式 re-export 到 plain-Node worker。

<a id="m-benchmark-contracts-fidelity-terminal-endpoint"></a>
- `deepseek-harness/benchmarks/terminal-io/terminal-io.worker.ts:60-95@687f282e` — 计时 read 就绪与 bounded endpoint，断言 inferred_idle/truncated/字节数，finally 关闭 session。

<a id="m-benchmark-contracts-fidelity-retained"></a>
- `deepseek-harness/benchmarks/session-open/session-open.worker.ts:182-215@687f282e` — 测量后要求 measured endpoint 仍被引用，再取 after/retained；dispose 统一释放。

<a id="m-benchmark-contracts-fidelity-host"></a>
- `deepseek-harness/benchmarks/session-corpus/session-corpus.worker.ts:133-175@687f282e` — 挂载 shipped Web Host 的真实 list/search/fork 依赖，只替换外部 transport/upload/workspace 服务。

<a id="m-benchmark-contracts-fidelity-nowarm"></a>
- `deepseek-harness/benchmarks/session-corpus/projection-list.worker.ts:300-315@687f282e` — 断言 setup 不预热 wire view，确保第一次 list 是冷路径。

<a id="m-benchmark-contracts-fidelity-optin"></a>
- README第7行声明`openAt:first-search`为opt-in且shipped默认禁用；`deepseek-harness/apps/cli/tests/lazy-search-startup.compat.spec.ts:102-116@687f282e`断言base/Web均`openAt:never`。`deepseek-harness/scripts/run-gates.ts:429-440,462-472@687f282e`在Node22compat构建后以`DSH_REQUIRE_BUILT_CLI_SMOKE=1`启用；不是普通收集时自动运行，也不是本轮运行证据。
- `deepseek-harness/benchmarks/session-corpus/README.zh.md:7-7@687f282e` — 中文契约同句：已发布 profile 默认禁用该功能。

<a id="m-benchmark-contracts-per-sample-isolation-and-cleanup"></a>
### `benchmark-contracts-per-sample-isolation-and-cleanup` — 每次尝试独立世界、fresh 对象图与失败清理 {#benchmark-contracts-per-sample-isolation-and-cleanup}

**触发。** 新增需要 seed 或写盘的案例；多次 attempt 相互影响；重复 fold 的耗时递减；失败后残留临时目录或 worker 进程。

**前置条件。** 平台提供私有临时目录与可等待退出的子进程；能够复制一个已 seed 的源世界。

**义务。**

- 进程级 wall-clock 与 retained-memory 测量以 fresh child 为隔离单位；每次 attempt/run 使用私有 `mkdtemp` root。一个 attempt 内的多次 in-worker sample（如 projection-list 的 4 次 list 与 responsiveness 样本）共享该 attempt 的 root，不声称每个 in-worker sample 各有 child/root；不读 ambient repository、共享私有 home 或网络。
- 需要预置数据的案例先 seed 一个源世界，再为每次 attempt 复制独立 root；`finally` 删除 root，失败也清理。
- 纯同步 fold 每样本创建 fresh 对象图，不复用已变异的 assembler/client；不得修改进程全局状态。
- 确需临时全局钩子（例如计数 `scheduler.yield`）时，保存原 descriptor 并在 `finally` 恢复，恢复失败必须可见。
- 每个 child 有 deadline；调用方 await close/exit；测试 deadline 晚于 child deadline。
- 浏览器每轮 fresh browser + 私有 scaffold world，并按层 `finally` 关闭与删根。
- 浏览器案例在每层 `finally` 把清理/主错误推入 `failures[]`，最后抛 `AggregateError`；agent-continuation 与 projection-list 在被测调用失败时仍在 `finally` 直接 `await rm`，清理异常可覆盖主错误。统一聚合是目标可选增强。

**步骤。**

1. 建立一次 seed 源世界。
2. 每attempt复制/新建独立root；同attempt内按场景复用Host/controller/可变观测对象。projection-list的4次list及responsiveness刻意共享这些对象，不能为隔离重建而改变重复测量语义。
3. 纯同步 fold 每样本构造新对象图，避免跨样本缓存。
4. 需要临时全局改动时保存并恢复 descriptor。
5. child 设 deadline，await exit，再删除 root。
6. 源浏览器案例聚合主/清理错误；其他已读案例的finally清理可能掩盖主错误。统一保留或聚合是目标新增保证，选用时须另外实现并验证。

**责任与完成信号。** 作者声明实际隔离单位和有意复用边界；CI维护者负责child deadline。多attempt无状态泄漏并清理资源；纯fold对象图新建；冷/重复list仍按原设计分别测量，不要求所有样本耗时相同。

**失败处理。** 跨attempt泄漏、纯fold复用已变异图、未恢复钩子、资源残留或缺deadline分别定位；同attempt内有意Host复用不算违规。清理错误可能掩盖主错误，不能用失败清理存在推断主错误必被保留；修对应机制，不放宽预算。

**例外。** 纯fold可共享只读常量但不共享可变assembler/client；重复list可在同attempt有意共享Host/controller/观测对象，证据为`projection-list.worker.ts:301-310`。浏览器聚合错误，其他已读案例未统一，不能把浏览器保证推广为所有案例。

**证据边界。** 隔离只证明 attempt 之间没有共享可变状态；不证明 attempt 内每次 in-worker sample 都是独立世界，也不证明样本内部测的是生产路径。reconnect 的 retained-heap 预算使用 `expect.soft` 且不写入报告；清理失败聚合仅在浏览器案例实现。

**证据。**

<a id="m-benchmark-contracts-isolation-rule"></a>
- `deepseek-harness/benchmarks/AGENTS.md:10-10@687f282e` — fresh child + 私有 mkdtemp；纯同步 fold 每样本 fresh 对象图且不改进程全局状态；bound child、await exit、失败也删根。

<a id="m-benchmark-contracts-isolation-attempt-root"></a>
- `deepseek-harness/benchmarks/agent-continuation/agent-continuation.bench.ts:164-186@687f282e` — seed 一次源树，每次 attempt 复制独立 root，finally 删除。

<a id="m-benchmark-contracts-isolation-projection-root"></a>
- `deepseek-harness/benchmarks/session-corpus/projection-list.bench.ts:31-44@687f282e` — 每个 workload attempt 新建 mkdtemp，finally 删除。

<a id="m-benchmark-contracts-isolation-fresh-fold"></a>
- `deepseek-harness/benchmarks/conversation-fold/conversation-fold.worker.client.ts:160-180@687f282e` — `foldOnce` 每次新建 assembler，`bestOf` 不共享可变实例。

<a id="m-benchmark-contracts-isolation-preparing"></a>
- `deepseek-harness/benchmarks/conversation-fold/conversation-fold.worker.client.ts:207-250@687f282e` — preparing 样本新建 assembler 与订阅，测量后取消订阅并 GC。

<a id="m-benchmark-contracts-isolation-reconnect"></a>
- `deepseek-harness/benchmarks/active-stream-reconnect/reconnect.worker.client.ts:38-49@687f282e` — 每个 worker 进程内新建 Client 实例，GC 后只测一次 replace，避免跨样本状态。
- `deepseek-harness/benchmarks/active-stream-reconnect/reconnect.bench.client.ts:57-62@687f282e` — retained-heap 预算用 `expect.soft` 断言，且不调用 `recordPeakMemory`，没有报告行。

<a id="m-benchmark-contracts-isolation-hook"></a>
- `deepseek-harness/benchmarks/session-corpus/projection-list.worker.ts:220-295@687f282e` — 保存 `scheduler.yield` descriptor，计数后在 finally 恢复；事件循环直方图同样关闭。

<a id="m-benchmark-contracts-isolation-browser-world"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:344-360@687f282e` — 每个 sample 新建 mkdtemp、replay override、scaffold 与 browser。

<a id="m-benchmark-contracts-isolation-browser-cleanup"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:436-444@687f282e` — browser、scaffold、root 分层关闭/删除，错误聚合后再抛出。

<a id="m-benchmark-contracts-browser-measurement-integrity"></a>
### `benchmark-contracts-browser-measurement-integrity` — 浏览器样本世界、可见性等待与真实输入证据 {#benchmark-contracts-browser-measurement-integrity}

**触发。** 新增或修改 Web GUI 的打开、分页、Trajectory、流式回复基准；浏览器结果波动；从 DOM 断言改为可见性断言；需要证明流式期间仍可输入。

**前置条件。** 有 keyless replay scaffold、headless Chromium + CDP，以及每样本 mkdtemp/进程清理能力。源仓首次运行前要求通过 benchmark workspace 安装 Chromium，并先构建 library、worker 与 Web 产物；已有产物才可直接定向运行。迁移时绑定目标工具链的实际安装和构建入口，不能把未具备浏览器当作已执行样本。来源：`deepseek-harness/benchmarks/long-session-browser/README.md:7-17@687f282e`、`deepseek-harness/benchmarks/long-session-browser/README.zh.md:7-17@687f282e`。这里只保留源前提，未执行安装、构建或浏览器 benchmark。

**义务。**

- 必须 replay-only（`webSnapshotMode() === 'replay'`）；不得依赖真实网络或凭据。
- 每样本 fresh browser、私有 mkdtemp 根与私有 scaffold world；成功后失败后都关闭 browser/scaffold 并删根。
- 通过共享 shipped-composition scaffold 驱动 built Client bundle；分开报告 source-resolved test Host 与 published-Host 证据。固定提交只有 test Host 运行，没有 published-Host 运行证据。
- 两次 rAF 只证明渲染机会，不证明 GPU presentation。
- 等待可见文本/控件，而不是只等 DOM；隐藏元素不算完成。
- 分页时钟在控件就绪后开始，选择器准备在计时外；保留 trusted click，并校验 tail 数量。
- 流式期间输入必须 trusted 并记录 witness；晚输入加负向对照，不得报告 overlap。
- 同时记录 wall、CDP TaskDuration、GC 后 JSHeapUsedSize；open/page/trajectory/streamTask 设置预算并传给 `recordTimings`，first/input/streamWall 只断言不记录，`report.html` 没有这三行；heap/DOM 只作诊断。
- 断言 console 无 page error/warning；每样本失败聚合后统一抛出，清理仍执行。
- streamWall 含 paced replay，使用绝对预算，不参与缩放。

**步骤。**

1. 首次运行前通过 benchmark workspace 安装 Chromium；确认 built 产物、replay 与 keyless scaffold。已有产物时才选择定向运行入口。
2. 每样本新建 mkdtemp、replay override、scaffold、browser、page。
3. seed 合成历史，打开页面并等待可见 frame。
4. 用唯一控件执行 open/page/trajectory；计时前等待控件就绪。
5. 用可见 marker 等待回复；流式期间注入真实键盘输入并记录 witness。
6. 采集 wall、TaskDuration、GC 后 heap；断言 console 干净。
7. 聚合失败、清理资源，再算 median 与预算。

**责任者与完成信号。** Web 性能作者与 QA 维护者负责；完成信号是每个 sample 都有可见性/witness 证据、console 干净且资源全部释放。

**失败处理。** 只等 DOM → 绘制前停表；合成 input → 非用户路径；选择器准备计时 → 分页虚高；共享 browser/scaffold → 跨样本污染；不清理 → 孤儿进程/目录；忽略 console 错误 → 掩盖回归。出现后修等待/隔离，不改预算。first/input/streamWall 与 heap/DOM 即使有 verdict 或诊断值，也不产生报告行。

**例外。** paced streamWall 用绝对预算；晚输入负向对照故意失败以证明 witness；test Host 结果不得冒充 published Host，且固定提交没有 published-Host 运行证据。

**证据边界。** 两次 rAF 不证明 GPU 呈现；headless 结果与真实用户硬件存在差距。`report.html` 只有 open/page/trajectory/streamTask 行；heap 与 DOM 计数只作诊断。

**证据。**

<a id="m-benchmark-contracts-browser-rule"></a>
- `deepseek-harness/benchmarks/AGENTS.md:8-8@687f282e` — 走共享 shipped-composition scaffold；test Host 与 published Host 分开；两次 rAF 只是渲染机会；每样本 fresh browser/私有 world。

<a id="m-benchmark-contracts-browser-painted"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:34-38@687f282e` — 两次 rAF 判渲染机会，并注明不是 GPU 呈现时间。

<a id="m-benchmark-contracts-browser-visible-marker"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:81-100@687f282e` — 只接受最新 Assistant step 中可见的 marker 文本。

<a id="m-benchmark-contracts-browser-visible-trajectory"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:97-120@687f282e` — Trajectory 等待可见搜索框与可见行，忽略无关表格；输入 witness 只接受 trusted 事件。

<a id="m-benchmark-contracts-browser-helper-tests"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:152-190@687f282e` — 负向测试证明隐藏 marker/隐藏 Trajectory 不会被误判为就绪。

<a id="m-benchmark-contracts-browser-page-clock"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:214-290@687f282e` — 分页计时排除选择器准备，保留 trusted click 并校验 tail 增长。

<a id="m-benchmark-contracts-browser-ambiguity"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:300-340@687f282e` — 歧义或被替换的分页按钮在计时前失败。

<a id="m-benchmark-contracts-browser-replay"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:344-360@687f282e` — 强制 replay 模式；每 sample 私有 mkdtemp、replay override、scaffold 与合成历史。

<a id="m-benchmark-contracts-browser-openpage"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:361-400@687f282e` — open/page/trajectory 分端点计时，并等待可见 frame、tail 与 composer。

<a id="m-benchmark-contracts-browser-stream"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:401-435@687f282e` — 流式期间真实键盘输入、overlap witness、晚输入负向对照与 console 清洁断言。

<a id="m-benchmark-contracts-browser-cleanup"></a>
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:436-454@687f282e` — 每层失败聚合，browser/scaffold/root 依次清理，再聚合 median 并记录预算。
- `deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:446-453@687f282e` — 预算覆盖全部 REFERENCE 端点，但只有 `SCALED_ENDPOINTS`（open/page/trajectory/streamTask）传给 `recordTimings`；first/input/streamWall 仅断言。

<a id="m-benchmark-contracts-browser-fixture"></a>
- `deepseek-harness/benchmarks/long-session-browser/synthetic-history.ts:1-20@687f282e` — 固定 240 轮历史与 FIRST/DONE marker；私有 session id 与 pace 由常量控制。

<a id="m-benchmark-contracts-browser-diagnostics-not-budget"></a>
- `deepseek-harness/benchmarks/long-session-browser/README.md:13-17@687f282e` — 三个 fresh browser/scaffold；强制 GC 后 heap 与 DOM 计数只作诊断；分页逐页报告并门禁各样本最慢页中位数；Enter/focus、latest-step-only 观察器、witness 安装时序与 DONE 后负向按键由同一契约声明；fixture 组成与 120×16 ms pacing 也在此。
- `deepseek-harness/benchmarks/long-session-browser/README.zh.md:13-17@687f282e` — 中文契约重复上述诊断边界、逐页门禁与流式交互细节。

## References

- 源提交：`687f282e8625c6b8d11ff58211a90524be2e4317`。
- 本域知识：`knowledge/benchmark-contracts.json`。
- 本域覆盖账本：`research/benchmark-contracts-coverage.json`。
- 交叉域（canonical benchmark 政策、CI job、机器 profile、web perf lane）：`references/testing.md`、`knowledge/testing.json`、`research/testing-coverage.json`。
- 案例 README 契约（八个中英正文已逐行通读并记为 canonical inspected 记录，四个 `README.i18n.yaml` 为生成的配对哈希记录）：`benchmarks/active-stream-reconnect/README.{md,zh.md}`、`benchmarks/agent-continuation/README.{md,zh.md}`、`benchmarks/long-session-browser/README.{md,zh.md}`、`benchmarks/session-corpus/README.{md,zh.md}`。补充记录：`vitest.bench.config.ts`（不在 30 条指派路径内，已在 `supplementalContracts`）。
- 相关机制：`testing-benchmark-gate`、`testing-benchmark-workload-hygiene`、`testing-web-performance-and-stress`、`testing-source-built-entry-modes`、`testing-real-implementation-mock-boundary`、`testing-real-entry-composition`、`testing-snapshot-corpus-policy`、`testing-resource-isolation`。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `benchmark-contracts-case-selection-and-layout`：`deepseek-harness/benchmarks/AGENTS.md:1-6@687f282e`
- `benchmark-contracts-built-worker-protocol`：`deepseek-harness/benchmarks/AGENTS.md:1-18@687f282e`、`deepseek-harness/benchmarks/tsdown.config.ts:1-76@687f282e`
- `benchmark-contracts-measurement-attribution-and-report`：`deepseek-harness/benchmarks/support/scaling-report.ts:1-294@687f282e`、`deepseek-harness/benchmarks/session-corpus/projection-list.bench.ts:85-98@687f282e`
- `benchmark-contracts-budget-calibration-and-file-deadlines`：`deepseek-harness/benchmarks/agent-continuation/agent-continuation.bench.ts:16-33@687f282e`、`deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:20-78@687f282e`、`deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:116-119@687f282e`、`deepseek-harness/benchmarks/session-corpus/session-corpus.bench.ts:330-335@687f282e`、`deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:122-151@687f282e`、`deepseek-harness/benchmarks/active-stream-reconnect/reconnect.bench.client.ts:9-38@687f282e`
- `benchmark-contracts-fixture-provenance-and-validity`：`deepseek-harness/benchmarks/session-corpus/corpus-shape.ts:1-76@687f282e`
- `benchmark-contracts-workload-fidelity-and-completion-proof`：`deepseek-harness/benchmarks/agent-continuation/profile-continuation.worker.ts:1-88@687f282e`、`deepseek-harness/benchmarks/agent-continuation/profile-adapter.ts:1-42@687f282e`、`deepseek-harness/benchmarks/session-open/session-open.worker.ts:147-215@687f282e`
- `benchmark-contracts-per-sample-isolation-and-cleanup`：`deepseek-harness/benchmarks/AGENTS.md:10-10@687f282e`、`deepseek-harness/benchmarks/agent-continuation/agent-continuation.bench.ts:164-186@687f282e`、`deepseek-harness/benchmarks/session-corpus/projection-list.bench.ts:31-44@687f282e`、`deepseek-harness/benchmarks/active-stream-reconnect/reconnect.bench.client.ts:57-62@687f282e`、`deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:436-444@687f282e`
- `benchmark-contracts-browser-measurement-integrity`：`deepseek-harness/benchmarks/long-session-browser/long-session.bench.ts:1-454@687f282e`、`deepseek-harness/benchmarks/long-session-browser/synthetic-history.ts:1-95@687f282e`
