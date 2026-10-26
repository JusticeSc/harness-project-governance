# 自动化域（automation）迁移参考

本文件是 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（下称“源”）中**本地钩子、门禁运行器、CI 工作流、runner/缓存/并发/取消与最终裁决**的可操作迁移参考。读者触发条件：需要在新仓库复刻提交前检查、统一门禁调度、PR/主干 CI、故障切换、缓存与临时目录策略，或需要判断一条自动化保证是否真的被执行。

约定：

- 引用格式：`deepseek-harness/` + 仓库相对路径 + `:起始行-结束行@提交号`，例如 `deepseek-harness/AGENTS.md:84-90@687f282e`；行号来自上述提交的实际文件。
- **【源义务】** 表示源仓库明确实现或明确写下的约束；**【迁移设计】** 表示本文为迁移方给出的落地方式，不是源义务；**【附加建议】** 表示源未强制、但可降低复刻风险的做法。
- 源只读。本域不修改源；所有结论均来自源码、配置、测试与源内 Agent Note。
- 本域与发布域的边界：`release*.yml`、`publish-*`、`build-exe-for-python-sdk.yml`、`docs-pages.yml` 的**发布语义**属于发布域；本域只拥有它们的 **runner 路由、缓存、并发/取消、job 依赖与工作流触发面**，并在交叉域一节标注。

---

## 1. 读者触发索引

| 你要做的事 | 先读 | 关键完成信号 |
| --- | --- | --- |
| 加/改提交前检查 | §2.1、§2.2 | `lefthook.yml` 的 job 命中 staged 文件；`pnpm install` 后钩子可执行且不污染其它 worktree |
| 新增一条门禁 | §3.1–§3.7 | 聚合名可从 `package.json` 调起；图校验通过；失败会把聚合退出码置 1 |
| 让门禁在 CI 中并行且可取消 | §3.4–§3.6、§7 | `DSH_GATE_FAIL_FAST=1` 时首个阻塞失败终止整棵进程树 |
| 修 “contracts-ready / 缺声明 / 缺构建产物” | §4 | `host-contracts` 先于 typecheck/lint/doc-typecheck；`build` 在读取产物前完成 |
| 加一个 PR 检查 | §5、§6 | `ci.yml` 的 job 出现在 `all-checks-passed.needs` 中（或明确说明为何不） |
| 主干/平台专属检查 | §5.1、§5.2 | 只在 `ci-master.yml`，不进入 PR check panel |
| 托管池故障 | §6.2 | 设置 `DSH_CI_FAILOVER_LINUX`/`_WINDOWS` 后重跑，作业改派到备用池 |
| 缓存变慢/被污染 | §6.3、§6.4 | PR 只 restore 不 save；自托管不复用托管缓存键 |
| 判定“全绿” | §5.4、§8 | 单一 required check `all checks passed` 失败于任何 failure/cancelled/skipped |

---

## 2. 本地 Git 钩子

### 2.1 lefthook 作业矩阵（源义务）

**问题**：本地钩子若与 CI 做同样的事，会把昂贵检查塞进每次提交；若什么都不做，廉价但高频的错误会漏到 CI。源把钩子限定为“快速检查点”，并明确“CI 拥有完整仓库级门禁矩阵”。

**前提**：仓库根有 `lefthook.yml`；`lefthook` 是 devDependency；`pnpm install` 会触发根 `postinstall: node scripts/install-lefthook.mjs`（`deepseek-harness/package.json:214@687f282e`）。

**作业定义**（`deepseek-harness/lefthook.yml:1-49@687f282e`）：

- `pre-commit`：
  1. `translation pairing (staged records)`：`glob: '*.i18n.yaml'`，排除 `.agents/notes/archived/**`，运行 `tsx scripts/verify-translation-pairing.ts --cached {staged_files}`。只校验**暂存区**记录，避免工作区改动干扰提交。`--cached` 只处理**命名对**；没有暂存 i18n 文件时检查 0 对并仍以 0 退出，脚本只提示“corpus-wide check still runs in doc-sync”（`deepseek-harness/scripts/verify-translation-pairing.ts:6-9@687f282e`、`deepseek-harness/scripts/verify-translation-pairing.ts:360-363@687f282e`）。因此干净检出上的钩子成功不是全库配对证据。
  2. `archived agent notes`：`glob: '.agents/notes/archived/**'`，运行 `tsx scripts/verify-archived-agent-notes.ts`。归档笔记是冻结面，钩子只把该目录的变更交给归档校验器。
  3. `lint (staged)`：`glob: '*.{ts,tsx,mts,cts,mjs}'`，排除 `vendor/*/src/**`；运行 `tsx scripts/run-oxlint.ts --config .oxlintrc.staged.json --fix --no-error-on-unmatched-pattern {staged_files}`；`stage_fixed: true` 把自动修复重新加入暂存区。
  4. `whitespace (staged)`：`git diff --cached --check`。
  5. `pi-ai provider metadata`：仅当 `pnpm-lock.yaml`、该包 `package.json`、生成脚本或生成文件被暂存时，运行 `gen-provider-data.ts --check --cached`。
  6. `vendor manifest guard`：无条件运行 `scripts/check-vendor-manifest.sh`。
- `pre-merge-commit`：仅重复第 1、2 项（Git 自动创建合并提交前再校验索引）。
- `pre-push`：运行 `pnpm run typecheck`（唯一较重的钩子）。

Oxlint 包装器的修复上限是首轮失败后再运行一次；非 fix 只调用一次。首轮成功或被 signal 终止不再重试；启动错误抛出，signal 传给父进程，null 退出状态按失败处理。这是有界修复行为，不是对所有检查故障泛用重试。`DSH_OXLINT_THREADS` 只接受规范表示的正安全整数，同时传给 `--threads` 和 `GOMAXPROCS`，并拒绝与调用者的 `--threads` 并用；未显式选择时，CI 留用工具默认，本地沿用仓库 worker budget（`deepseek-harness/scripts/run-oxlint.ts:1-112@687f282e`）。

**责任者**：提交者（本地执行）；仓库维护者（维护钩子清单与安装器）。

**完成信号**：钩子命令退出 0；`stage_fixed` 后暂存区包含修复。

**失败处理**：钩子非零即阻止提交/推送；按错误提示修复后重新 `git add`。`verify-translation-pairing` 的配对规则由文档域拥有（见 §11）。

**例外**：`vendor/*/src/**` 不做 staged lint（vendor 自带风格）；归档笔记不参与配对检查（冻结记录由归档校验器单独验证）；`CI=true`/`GITHUB_ACTIONS=true` 时安装器直接返回（见 §2.2），因此 CI 不执行贡献者钩子。

**证据限制**：钩子只在本地 Git 生命周期触发；它不证明 CI 通过，也不覆盖未暂存文件。`lefthook.yml` 的 CI 契约测试只固定了“归档目录排除”这一条（`deepseek-harness/scripts/ci-workflow.spec.ts:1516-1530@687f282e`），其余 job 的存在靠配置评审而非自动断言。

**迁移设计**：保留“staged-only、快速、可自动修复、与 CI 分工”的结构。新仓库把 `glob`/`exclude` 换成自己的文件类型；`{staged_files}` 是 lefthook 占位符，必须保留由钩子框架展开。不要把 `pnpm run test`、构建或全量文档检查放进 `pre-commit`；源在 `deepseek-harness/docs/development.md:147@687f282e` 明确“钩子有意不跑 tests/snapshots/docs/builds/hygiene”。

### 2.2 worktree-local 钩子安装器（源义务）

**问题**：链接 worktree 共享同一默认 hooks 目录；任一 worktree 执行 `lefthook install --force` 会重写所有 worktree 的钩子。Lefthook 生成的钩子还会优先使用安装时捕获的绝对二进制路径，导致其它 worktree 短暂运行错误版本的二进制，并发安装还会互相覆盖。

**前提**：Git ≥ 2.26（需要 `git config --show-scope`）；`node_modules/.bin/lefthook` 存在；根 `postinstall` 已注册安装器；仓库允许把 repository format 升到 1 并启用 `extensions.worktreeConfig`。

**步骤**（`deepseek-harness/scripts/install-lefthook.mjs:1-769@687f282e`，主流程在文末）：

1. CI 短路：`CI === 'true'` 或 `GITHUB_ACTIONS === 'true'` 时在 **Git 发现与任何变更之前**返回。
2. 探测 `git rev-parse --show-toplevel`；不在 Git 工作树则返回；解析 `lefthook` 二进制路径，缺失则返回。
3. `assertSupportedGit`：低于 2.26 抛错。
4. 解析 `--absolute-git-dir` 与 `--git-common-dir`，得到 `common/config`、当前 worktree 的 `config.worktree`、目标 `hooksPath = <git-dir>/dsh-hooks`。
5. 获取仓库级安装锁（见下）。
6. 安全校验：
   - 公共 `config` 必须是普通文件且非符号链接；
   - 每个已注册的 `config.worktree` 必须是普通文件且非符号链接；
   - 若 `extensions.worktreeConfig` 未启用，而有**非空**的 dormant worktree config，拒绝启用（否则会把用户设置在未审查时激活）；
   - 若 repository format 为 0，且公共 config 直接配置了任何 `extensions.*`，拒绝升级（Git 的仓库格式解析器不展开 include，必须要求显式迁移）；
   - 公共 config 直接含 `core.worktree` 或 `core.bare=true` 时拒绝；迁移会删除直接 `core.bare=false`（false 是默认值）。
7. 解析**有效** `core.hooksPath`（scope、origin、value，含 `config.worktree` 的 include）：
   - command scope：拒绝（`DSH_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE` 也不能覆盖临时命令配置）；
   - worktree scope 且非本安装器所有：拒绝；
   - system/global/local scope 且未被 `DSH_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE=1` 显式允许：拒绝，错误信息要求把用户钩子链接进 `lefthook.yml`。
8. 归属标记：`<hooksPath>/.dsh-lefthook-owned` 是 JSON `{version:1, owner:"deepseek-harness worktree-local lefthook hooks", hooksPath:<绝对路径>}`。目录不存在则 `mkdir 0700` 并以 `wx/0600` 写标记；已存在则必须是普通目录、标记必须是普通单链接文件，且目录内每个条目必须是普通单链接文件，否则拒绝。
9. 迁移并写入：format 0 → 1；启用 `extensions.worktreeConfig`；`git config --worktree core.hooksPath <钩子目录>`；确认它成为**有效的直接 worktree 值**；运行 `lefthook install --force`；最后更新标记。
10. 失败回滚：若 `core.hooksPath` 已改而 Lefthook 失败，恢复旧的 worktree 值（无旧值则 `--unset-all`）；回滚也失败时用 `AggregateError` 同时报告安装失败与回滚失败。锁释放失败同样与安装错误聚合。

**锁语义**（同文件）：`<common>/dsh-lefthook-install.lock`，`openSync(..., 'wx', 0o600)` 独占创建，内容 `"<pid> <uuid>\n"`；等待上限 30s、初始化观察窗 5s、轮询 50ms。释放前必须复核 `dev`/`ino` 与内容完全一致，否则拒绝删除；死锁或非法锁**要求人工确认后删除**，不自动破锁。Windows 上 `EPERM`（删除中的锁仍被读者占用）在截止前重试。

**责任者**：每个执行 `pnpm install` 的开发者/agent（自动触发）；需要人工恢复锁的人。

**完成信号**：当前 worktree 的有效 `core.hooksPath` 指向 `<git-dir>/dsh-hooks`；钩子可执行；重复安装幂等；其它 worktree 的钩子路径与字节不变。

**失败处理**：按错误文本处理——迁移拒绝要先迁移用户配置；锁错误要人工确认无安装器运行后删除；归属冲突要替换为普通文件/删除非本安装器目录后重试。安装器测试固定了这些拒绝与回滚路径（`deepseek-harness/scripts/install-lefthook.spec.ts:218-860@687f282e` 的用例名覆盖隔离、新 worktree 复制、并发、迁移拒绝、重定位、锁、回滚）。

**例外**：CI 完全跳过；`DSH_LEFTHOOK_ALLOW_HOOKS_PATH_OVERRIDE=1` 只放行**继承的** system/global/local 路径，不放行 command/worktree scope。公共 `$GIT_COMMON_DIR/hooks` 的既有文件永不删除或重写（保护未升级的 worktree）。

**证据限制**：安装器只在有 Git 元数据的 checkout 生效；它不证明钩子内容正确，只证明路径与文件归属安全。源未提供“钩子实际拦截一次坏提交”的仓库级自动证据；该证据属于本地行为，需在新仓库手工演练。

**迁移设计**：若新仓库不需要多 worktree 隔离，可以保留普通 `lefthook install`；一旦采用 worktree 并发（agent 工作树、CI 本地复现），应复用本安装器的**顺序**：CI 短路 → 版本门槛 → 只读校验 → 加锁 → 归属检查 → 迁移 → 安装 → 回滚。不要简化成“先改 config 再校验”。

---

## 3. 统一门禁运行器

### 3.1 聚合名与包脚本所有权（源义务）

**问题**：CI、文档、开发者需要稳定的“聚合入口”，但把依赖图写进 YAML 会让多处重复且无法本地复现。源把**公共聚合名**放在 `package.json`，把**经过校验的依赖图、调度环境与进程诊断**放在 `scripts/run-gates.ts`（文件头注释，`deepseek-harness/scripts/run-gates.ts:1-6@687f282e`）。

**前提**：`npm_execpath` 可用（必须通过 pnpm 脚本调起，`deepseek-harness/scripts/pnpm-invocation.ts:9-20@687f282e`）；否则 `pnpmInvocation` 直接抛错，避免在错误包管理器下静默运行。

**步骤**：

1. 在 `package.json` 增加形如 `"check:ci:static": "tsx scripts/run-gates.ts ci-static"` 的脚本（现有清单见 `deepseek-harness/package.json:87-101@687f282e`，文档/卫生聚合见 `deepseek-harness/package.json:130@687f282e`、`deepseek-harness/package.json:198-199@687f282e`）。
2. 在 `Mode` 联合类型与 `parseMode` 的 `switch` 中同时加入该名字；未知名字必须抛错并列出全部合法值（`deepseek-harness/scripts/run-gates.ts:19-40@687f282e`、`deepseek-harness/scripts/run-gates.ts:150-183@687f282e`）。两处必须同步，否则会出现“能解析但无图”或“有图但拒绝解析”。
3. 在 `gatesForMode` 中返回该聚合的 `Gate[]`（`deepseek-harness/scripts/run-gates.ts:292-364@687f282e`）。
4. 需要复用片段时写私有构造函数（如 `ciSharedStaticGates`、`sharedHygieneGates`、`docSyncLeafGates`），不要复制 gate 列表。

**责任者**：新增门禁的提交者；门禁矩阵维护者。

**完成信号**：`pnpm run <script>` 打印 `run-gates: <name> running N gate(s) ...` 并以聚合退出码结束。

**失败处理**：`parseMode` 抛错属于配置错误，先修脚本/枚举；图校验错误见 §3.3。

**例外**：`ci-windows-observational-ready` 会先构造 `ciWindowsObservationalGates()` 再**过滤掉 `build`**，并从所有 `needs`/`after` 中删除 `build`，因为调用方保证工作区已构建（`deepseek-harness/scripts/run-gates.ts:316-325@687f282e`）。这是“只复用构建、不重复构建”的显式例外。

**迁移设计**：保持“一个聚合名 = 一个可本地执行的图”。不要把聚合逻辑直接写进 CI YAML；CI 只设置环境并调用包脚本。

### 3.2 Gate 图模型（源义务）

每个 `Gate` 包含（`deepseek-harness/scripts/run-gates.ts:42-60@687f282e`）：

- `id`：聚合内唯一；`label`：日志名；`displayCommand`：失败时打印的可复制命令；
- `command`/`args`：**无 shell** 直接 spawn；
- `needs`：这些 gate 必须 `passed` 才能启动；
- `after`：这些 gate 必须**已结算**（passed/failed/skipped）才能启动，但结果不影响本 gate 是否启动；
- `env`：叠加到父环境；
- `allowFailure`：失败可见但聚合不失败；
- `streamOutput`：实时输出而不是缓冲；
- `quick`：仅用于从文档全集派生 `doc-quick`。

关键语义差异（`deepseek-harness/scripts/run-gates.ts:1142-1153@687f282e`）：

- `needs` 失败或跳过 → 依赖 gate 被标记 `skipped`，错误为 `dependency failed or skipped: <ids>`（`deepseek-harness/scripts/run-gates.ts:1078-1103@687f282e`）；
- `after` 失败或跳过 → 后继仍会运行（测试 `deepseek-harness/scripts/run-gates.spec.ts:750-772@687f282e` 固定“ordered follower runs after predecessor fails/skips”）。

注意：`allowFailure` **不改变** `needs` 传播——依赖一个失败 gate 的后继仍会被跳过；它只影响聚合退出码（§3.7）与 fail-fast 是否触发（§3.6）。

**迁移设计**：用 `needs` 表达“数据依赖”（构建产物、声明、覆盖率 blob）；用 `after` 表达“资源/噪声隔离”（例如浏览器池开始前让所有产物读者结算），因为资源冲突不要求读者成功。

### 3.3 图校验（源义务）

`validateGateGraph` 在任何子进程启动前执行（`deepseek-harness/scripts/run-gates.ts:921-979@687f282e`）：

- 空图 → 抛错；
- 重复 `id` → 抛错；
- `needs`/`after` 指向未知 id → 抛错；
- 深度优先检测环（`needs` 与 `after` 都参与），抛 `dependency cycle: a -> b -> a`。

`runGates` 还拒绝非正整数并发（`deepseek-harness/scripts/run-gates.ts:1004-1022@687f282e`），并拒绝 `forwardProcessSignals` 而无 `failFast`（`deepseek-harness/scripts/run-gates.ts:1023-1027@687f282e`），因为只有 fail-fast 才会 detach 子进程并传递 abort 信号。

**完成信号**：非法图在**启动任何子进程之前**失败；错误文本包含具体 gate 与依赖。

**迁移设计**：图校验必须留在运行器内，不能只靠 TypeScript 类型；聚合是运行时构造的，类型无法发现拼写错误。

### 3.4 调度与并发预算（源义务）

`runGates` 的循环（`deepseek-harness/scripts/run-gates.ts:1030-1136@687f282e`）：

1. 在未 abort 时，循环填充 `running` 到 `maxActive`：每次取 `gates` **数组顺序**中第一个 `pending` 且 `predecessorsReady` 的 gate。因此聚合列表的顺序就是同优先级下的启动顺序；文档聚合刻意把最长的 leaf 放在前面（`docSyncLeafGates` 注释，`deepseek-harness/scripts/run-gates.ts:805-880@687f282e`），测试固定了前 11 个 id 的顺序（`deepseek-harness/scripts/run-gates.spec.ts:392-399@687f282e`）。
2. 如果没有任何运行中的 gate 且仍有 pending：找第一个 `needs` 中含 failed/skipped 的 gate，标记 skipped 并记录原因；若找不到，说明图停滞，抛 `validated graph stalled without a failed dependency`（防止死锁静默）。
3. 否则 `Promise.race` 等待任一 gate 结算；观察结果、更新状态、触发 fail-fast（见 §3.6）。

并发默认值：

- `defaultParallelism`：`CI==='true'` 用 `availableParallelism()`；否则本地上限 12；Vitest fork 用单独上限 48（`deepseek-harness/scripts/parallelism.ts:14-40@687f282e`）。
- `defaultConcurrency`：`workers = min(gate 总数, 预算)`；`check-all`/`hygiene`/`doc-sync`/`doc-quick` 额外受 `PROGRAM_MODE_CAP = 8` 限制，因为多个文档 leaf 各自构建完整 `ts.Program`（`deepseek-harness/scripts/run-gates.ts:186-212@687f282e`、`deepseek-harness/scripts/run-gates.ts:96@687f282e`）。
- `DSH_GATE_CONCURRENCY` 显式覆盖默认值，必须是正整数；非法值在启动子进程前抛错（`deepseek-harness/scripts/run-gates.ts:249-257@687f282e`）。

**完成信号**：启动行打印 worker 数与来源（`$DSH_GATE_CONCURRENCY` 或 “N local default worker(s) of M CPU(s)”）。

**例外**：并行度是**运行器进程数**上限，不是 CPU 配额；每个 gate 内部还可能再起 Vitest/Oxlint 自己的 worker。共享自托管主机必须同时压 `DSH_GATE_CONCURRENCY` 与各工具预算（§6.2）。

**证据限制**：调度测试用注入的 executor，不证明真实子进程的耗时或内存；真实并发效果只能在目标 runner 上观测。

### 3.5 环境预算派生（源义务）

`ciWorkerEnvironment` 只在 `ci-*` 聚合、且不是 `ci-unit` 时注入默认值（`deepseek-harness/scripts/run-gates.ts:215-247@687f282e`）：

- `DSH_OXLINT_THREADS = max(1, floor(budget/2))`
- `DSH_PUBLINT_CONCURRENCY = 同上`
- `DSH_SNAPSHOT_MAX_WORKERS = 1`
- `DSH_SNAPSHOT_MAX_CONCURRENCY = shared`
- `DSH_WEB_SNAPSHOT_WORKERS = (DSH_GATE_CONCURRENCY==='1') ? 1 : budget`
- `DSH_COVERAGE_MAX_WORKERS = testBudget`（本地 cap 48）
- 若覆盖率总预算 `total` 合法且 `instrumented = total - max(1, floor(total/3)) > 1`，设 `DSH_COVERAGE_PARTITIONS = instrumented`

规则：**只填空值**，显式设置永远优先。`ci-unit` 被排除，因为它的 inventory 会读取这些变量；若注入 `DSH_COVERAGE_PARTITIONS=2`，`ci-unit` 自己的覆盖率门禁测试会误判为分区车道（`deepseek-harness/scripts/run-gates.spec.ts:223-226@687f282e`）。

**迁移设计**：把“工具预算”与“门禁并发”分开建模；不要用一个全局 `JOBS` 同时喂给调度器、linter、Vitest 和覆盖率分区，否则共享主机上会出现乘数级超订。

### 3.6 fail-fast、取消与进程树终止（源义务）

**开关**：`DSH_GATE_FAIL_FAST=1` 才启用；任何其它非空值（如 `'0'`）在 `flagEnabled` 中抛错（`deepseek-harness/scripts/run-gates.ts:777-782@687f282e`）。CI 在 Linux 静态/覆盖率/消费者、Node 兼容、Windows build/coverage 上设 `1`；Windows observational 显式设为空字符串以保持完整诊断（`deepseek-harness/.github/workflows/ci.yml:56@687f282e`、`deepseek-harness/.github/workflows/ci.yml:133@687f282e`、`deepseek-harness/.github/workflows/ci.yml:286@687f282e`、`deepseek-harness/.github/workflows/ci.yml:412@687f282e`、`deepseek-harness/.github/workflows/ci.yml:543@687f282e`、`deepseek-harness/.github/workflows/ci.yml:590@687f282e`、`deepseek-harness/.github/workflows/ci.yml:620@687f282e`；契约测试 `deepseek-harness/scripts/ci-workflow.spec.ts:520-560@687f282e`）。

**聚合层**（`runGates`）：

- 阻塞 gate（`allowFailure !== true`）失败时，设置 `abortCause = "<label> failed"`，调用 `abort.abort()`，把**所有仍 pending** 的 gate 立即写为 `skipped`，错误 `aborted by fail-fast: <cause>`（`deepseek-harness/scripts/run-gates.ts:1106-1125@687f282e`）。
- 已运行 gate 在 abort 后结算：只有 `result.aborted !== true` 才保留真实结果；否则改写为 skipped 并丢弃部分输出（`deepseek-harness/scripts/run-gates.ts:1090-1096@687f282e`、`deepseek-harness/scripts/run-gates.ts:1130-1140@687f282e`）。原因是 Windows 上“被杀”与“失败”仅凭退出码不可区分。
- `allowFailure` 的失败**不**触发 abort（测试 `deepseek-harness/scripts/run-gates.spec.ts:1072-1083@687f282e`）。
- `cliGateOptions` 把 `forwardProcessSignals` 与 `failFast` 绑定：CLI 入口两者同时开或同时关（`deepseek-harness/scripts/run-gates.ts:146-148@687f282e`；测试 `deepseek-harness/scripts/run-gates.spec.ts:1223-1226@687f282e`）。宿主 SIGINT/SIGTERM 走同一 abort 路径，确保 detach 的树被清理。

**进程层**（`runGate`，`deepseek-harness/scripts/run-gates.ts:1164-1396@687f282e`）：

- 仅当传入 abort signal 时才 `detached`（POSIX）；普通运行留在宿主进程组。
- 输出：`streamOutput` 直接写父 stdout/stderr；否则缓存为 `GateOutputChunk[]`，失败时统一打印。
- `terminate()`：先合并当前仍存活子进程的后代快照，再 `treeKill('SIGTERM')`；5 秒后 `treeKill('SIGKILL')`；10 秒后销毁 `stdout/stderr/stdin`，防止孙进程持有写端导致 `close` 永不触发。
- POSIX：`process.kill(-pid, signal)` 杀进程组，再对捕获的后代逐个发信号（因为 detach 的后代在组长退出后会被 reparent，无法再按父链枚举）。Windows：`taskkill /PID <pid> /T /F`，先根后每个捕获后代；`/F` 必需，否则无法终止控制台进程；taskkill 的退出状态**故意不检查**（投递与树退出存在竞争，ESRCH 等价情况可接受）。
- 后代采样：fail-fast 运行时每 5 秒异步枚举一次（Linux 读 `/proc/<pid>/stat`；Windows 用 PowerShell `Get-CimInstance Win32_Process` 并带 10s 超时；其它 POSIX 用 `ps -axo pid=,ppid=`），与缓存**合并**而非替换，避免中间进程退出后丢失后代；子进程结算时取消在途枚举。
- POSIX `close` 后还要确认进程组与后代全部消失；最长 8 秒，仍未静默则打印 `gate tree not quiescent after 8s (<label>)` 并继续结算（该 gate 无论如何记为 failed）。
- 结果：`passed` 当且仅当 `exitCode === 0 && signalCode === null && spawnError === undefined`；否则 `failed`。`aborted` 单独标记。

**责任者**：CI 配置者（决定哪些 lane fail-fast）、运行器维护者。

**完成信号**：首个阻塞失败后，日志出现 `run-gates: fail-fast aborting: <label> failed.`，剩余 gate 全部 `skipped`，总耗时明显短于完整聚合。

**失败处理**：若树未静默，检查孙进程是否忽略 SIGTERM/持有管道；运行器会升级 SIGKILL，但无法杀死不可中断 I/O。若“杀掉”被误报为失败，确认 abort 标记路径是否被绕过。

**例外**：`allowFailure` gate 不触发 abort；observational 聚合主动关闭 fail-fast；`forwardProcessSignals` 必须与 fail-fast 同开。子进程若在 abort 前已结算，保留真实结果（它确实产生了证据）。

**证据限制**：源测试用真实子进程验证 POSIX“kill 子进程”和“转发宿主信号”（`deepseek-harness/scripts/run-gates.spec.ts:1098-1226@687f282e`），但没有在真实 Windows runner 上验证 taskkill 全树；Windows 行为属于设计推断 + 单元测试覆盖 `taskkillArgs`/`collectDescendants` 的纯函数部分（`deepseek-harness/scripts/run-gates.spec.ts:1320-1371@687f282e`）。退出与信号分别呈现、fail-fast 的 skipped 文案已由源测试固定（`deepseek-harness/scripts/run-gates.spec.ts:1011-1071@687f282e`）；汇总计数、`NON-BLOCKING` 标记、`DSH_GATE_VERBOSE` 与聚合退出码由实现阅读确认，没有测试执行证据。

**迁移设计**：不要把 fail-fast 实现成“只停止调度新 gate”；必须同时终止已在运行的子进程树，否则 CI 仍会等最长任务结束。若目标平台没有进程组，复制 Windows 的“先枚举后代、后逐个 taskkill /T /F”策略，并在组长死亡后继续用缓存列表清理。

### 3.7 汇总、诊断与退出码（源义务）

- 每个失败 gate 打印 `command`、`outcome`（`error`、`exit N`、`signal X` 全部保留，互不遮盖；`formatGateResultReason`，`deepseek-harness/scripts/run-gates.ts:1646-1652@687f282e`），再打印缓冲输出。
- `DSH_GATE_VERBOSE=1` 时通过的 gate 也打印详情（bench 作业使用；`deepseek-harness/.github/workflows/ci.yml:249@687f282e`）。
- 汇总行：`run-gates: P passed, F failed, S skipped in T s.`；随后列出所有非成功 gate，`allowFailure` 前缀 `NON-BLOCKING`（`deepseek-harness/scripts/run-gates.ts:1672-1690@687f282e`）。
- 退出码：只要有任一**非 allowFailure** 的 gate `failed` 或 `skipped` 就返回 1；否则 0（`deepseek-harness/scripts/run-gates.ts:136-140@687f282e`）。`skipped` 被视为失败，防止“依赖失败导致跳过”被误判为绿。

**迁移设计**：CI 的 job 退出码必须直接来自聚合退出码；不要在 YAML 里 `|| true` 或解析日志。`skipped` 计失败是安全默认值，保留。

---

## 4. 源码面与产物面前置

### 4.1 contracts-ready：声明生成与消费者分层（源义务）

**问题**：仓库级 typecheck/lint/doc-typecheck 需要 Host-for-Client 的生成声明（Typert/Remote），但完整 `build` 太贵；直接跑内层脚本又会因缺声明报错。

**源规则**（`deepseek-harness/docs/development.md:110@687f282e`；`deepseek-harness/package.json:53-58@687f282e`）：

- 公共命令 `typecheck`、`lint`、`doc-typecheck` **先**生成声明，再调用 `*:contracts-ready` 内层脚本；
- 内层 `typecheck:contracts-ready` = `tsc -b tsconfig.client.json`；`lint:contracts-ready` = `run-oxlint.ts .`；`doc-typecheck:contracts-ready` = `doc-typecheck.ts`；
- 内层脚本**假设**调用方（公共命令或调度 gate）已依赖 Typert 契约生成；它们自己不做准备。

**契约生成实现**（`deepseek-harness/scripts/compile-referenced-projects.ts:197-273@687f282e`）：

- `contractSteps(root,'host')` = Host `tsc -b` 与 `tsx scripts/generate-typert.ts` **并行**；Typert 只读源码（`generate-typert.ts` 拒绝构建输出），因此二者无依赖；
- `buildHostContracts` 用 `Promise.allSettled` 等两者都结束；一个失败抛该错误，两个失败抛 `AggregateError`（不因先失败者取消另一个，保证诊断完整）；
- `contractSteps(root,'all')` 追加 Client `tsc -b`，它 `needs: ['host-src','host-typert']`。

**门禁接线**（`deepseek-harness/scripts/run-gates.ts:400-426@687f282e`、`deepseek-harness/scripts/run-gates.ts:653-657@687f282e`）：

- `ci-primary` 有独立 `typert-contracts` gate（`pnpm exec tsx scripts/compile-referenced-projects.ts host-contracts`）；
- `typecheck` gate（`typecheck:contracts-ready`）`needs: ['typert-contracts']`；
- `lint` gate（`lint:contracts-ready`）`needs: ['typert-contracts']`；
- `doc-typecheck`（`doc-typecheck:contracts-ready`）`needs: ['typert-contracts']`；
- `build` gate 的 `needs: ['typecheck','lint','doc-typecheck']`。注释给出原因：三者都驱动 Client tsc，`build` 还会重复 Host 契约 pass；让 build 等待它们，避免与 tsbuildinfo 竞争或替换正在被读取的声明（`deepseek-harness/scripts/run-gates.ts:417-424@687f282e`）。

**责任者**：新增公共检查命令的人；调度图维护者。

**完成信号**：内层 `*:contracts-ready` 在独立调用时若缺声明应报编译器诊断（而不是静默通过）；聚合中它们在 `typert-contracts` 之后启动。

**失败处理**：缺声明 → 先确认调用链是否绕过公共命令；若并行写 tsbuildinfo，检查是否把 `build` 与 typecheck/lint/doc-typecheck 排成 `needs`。`deepseek-harness/scripts/run-gates.spec.ts:800-846@687f282e` 固定了 primary/consumers/doc-sync 三种准备关系。

**例外**：`ci-consumers` 的 `lint-and-duplication` 使用 `check:ci:lint:contracts-ready`，它复用**已验证消费者构建**产出的契约，不再单独跑 `host-contracts`（`deepseek-harness/scripts/run-gates.spec.ts:827-838@687f282e`）。`doc-sync` 独立运行时自己负责准备，`needs` 为空；只有被 `ci-static` 复用且 `ownsBuild` 时才把 `doc-typecheck` 指向 `build`。

**证据限制**：契约生成正确性由 TypeScript 与 Typert 生成器测试保证；源没有“故意删除声明验证内层脚本失败”的自动证据。迁移时至少手工验证一次“无声明 → 内层脚本非零”。

### 4.2 产物面：build record、profile 与消费模式（源义务）

**构建顺序**（`deepseek-harness/scripts/build.ts:92-142@687f282e`）：

- `complete`/`artifacts` 作用域：`native` → `host-src` → `host-bundle`（含 Typert）→ `desktop-bundle` → `client-src` → `client-bundle` → `web`；每一步 `needs` 前一步。
- `typecheck` 作用域：只跑 `contractSteps`（Host 编译 + Typert，Client 编译），不写 bundle；随后 `host-check`/`client-check` 用 `tsc -b`（允许 tsbuildinfo 跳过）。
- `check` 作用域：只跑 `host-check`/`client-check`，用 `tsc -p`（项目模式，读取磁盘上已有声明，不编译引用）。

**client 产物记录**（`deepseek-harness/scripts/client-build-environment.ts:1-123@687f282e`）：

- 环境选择器 `DSH_BUILD_CLIENT_PROFILE`；官方 profile 要求 `DSH_CLIENT_BUILD_PROFILE=official`、`DSH_CLIENT_TITLE=DeepSeek Harness`；提交哈希默认取 `git rev-parse HEAD` 的前 7 位（可用 `DSH_CLIENT_COMMIT_HASH` 覆盖），版本取根 `package.json`；
- 构建成功且聚合退出 0 后写 `.dsh-build/client-build-environment.json`（`deepseek-harness/scripts/build.ts:168-180@687f282e`）；失败不写记录，避免“旧记录 + 新产物”混合；
- `ciBuildGate` 只给 `build` gate 自身注入 `DSH_BUILD_CLIENT_PROFILE=official`，不污染兄弟 gate 环境（`deepseek-harness/scripts/run-gates.ts:269-275@687f282e`）。
- 消费方必须比较公开变量的完整键集合和值；额外继承的 `DSH_CLIENT_*` 变量也会改变产物。子进程环境先清除公开变量和内部 selector，再注入选定 profile（尾部完整来源：`deepseek-harness/scripts/client-build-environment.ts:124-407@687f282e`）。
- build record 验证闭式 schema、格式版本、非空文件数与 SHA-256；按排序路径及长度分隔的路径/内容重算摘要，排除 `lib/client.node` 一类 Node-face 文件。缺记录、非法结构、环境不符或产物变化均拒绝并要求完整重建；这不证明产物来源于声明源码，也不证明授权（`deepseek-harness/scripts/client-build-environment.ts:271-407@687f282e`）。源写入使用 `writeFileSync`，没有原子替换保证。

**产物消费者模式**：

- `snapshot`/`expected-output`/`built-bin-smoke` 设置 `DSH_EXAMPLE_MODE=lib` 并 `needs:['build']`（`deepseek-harness/scripts/run-gates.ts:751-765@687f282e`、`deepseek-harness/scripts/run-gates.ts:885-919@687f282e`）。
- `doc-typecheck` 在构建后消费时可设 `DSH_DOC_TYPECHECK_USE_BUILD_OUTPUT=1`（`deepseek-harness/scripts/run-gates.ts:340-350@687f282e`、`deepseek-harness/scripts/run-gates.ts:518-556@687f282e`）。
- `node-next-types`、`publint` 都 `needs:['build']`。

**迁移设计**：把“源码面通过”和“产物面通过”分成两条声明链；任何读取 `lib/` 的 gate 必须显式 `needs` 构建，不要依赖“前一步恰好跑过”。若复刻 build record，保留“成功后才写、失败即删”的顺序。

### 4.3 原生、沙箱与运行时前置（源义务）

- `test`/`test:coverage` 脚本本身先 `build:native-system`（`deepseek-harness/package.json:60-63@687f282e`）；聚合仍把 `native-system` 作为独立 gate，并让覆盖率 gate `needs:['native-system']`（`deepseek-harness/scripts/run-gates.ts:696-735@687f282e`），避免重复构建与并发争用。
- Windows 覆盖率额外 `needs:['electron-install']`；该 gate 运行 `pnpm --filter @deepseek-ai/dsh-desktop exec install-electron` 并设 `ELECTRON_GET_USE_PROXY=1`，因为原生 Electron fixture 在 Vitest 移除环境代理前就需要锁定二进制（`deepseek-harness/scripts/run-gates.ts:615-623@687f282e`）。
- `prepare-ci-bubblewrap.sh`：只支持 Linux x86_64；要求 `RUNNER_TEMP` 与 `GITHUB_PATH`；从 Launchpad 固定 build 下载 `bubblewrap_0.12.0-1_amd64.deb`，校验 SHA-256，`dpkg-deb --extract` 到 runner temp，把 `usr/bin` 写入 `GITHUB_PATH`，best-effort 关闭 AppArmor userns 限制，最后跑 `bwrap --ro-bind / / ... true` 功能探针；失败即退出（`deepseek-harness/scripts/prepare-ci-bubblewrap.sh:1-34@687f282e`）。
- `prepare:primary-runtime` 在消费者作业中构建 Linux Office runtime 到 `$RUNNER_TEMP/office-runtime`，下载缓存也在 runner temp（`deepseek-harness/.github/workflows/ci.yml:386-388@687f282e`）。

**证据限制**：这些前置只证明“命令成功”；沙箱是否真的限制由 e2e 的 `Test Files 2 passed (2)` 断言另行证明（见 §8.2）。

### 4.4 覆盖率聚合与按耗时分区（源义务）

**问题**：单进程全量覆盖率过慢；把编译器/子进程重的套件也做 v8 instrumentation，会付出数倍运行时间却不改变阈值；分区若按文件数平均，最慢分区决定 wall clock。

**前提**：Vitest 覆盖率配置存在；需要 `DSH_COVERAGE_MAX_WORKERS`（可选 `DSH_COVERAGE_PARTITIONS`）；分区模式必须通过 `npm_execpath` 调起（`deepseek-harness/scripts/run-coverage-partitions.ts:1-25@687f282e`）。

**步骤**：

1. 聚合拆成两个并行 gate（`deepseek-harness/scripts/run-gates.ts:696-735@687f282e`）：
   - `native-system` 先构建原生 addon；
   - `coverage`（instrumented）与 `coverage-exempt-heavy` 都 `needs:['native-system']`；**instrumented** gate 在 win32 上还 `needs:['electron-install']`，exempt gate 始终只依赖 native-system。
   - instrumented gate 设 `DSH_COVERAGE_EXEMPT_HEAVY=1`，让 `vitest.config.ts` 从**所有项目**移除豁免套件；CLI `--exclude` 到不了 per-project include，因此必须用环境标记（`deepseek-harness/scripts/coverage-exempt.ts:1-25@687f282e`）。
2. 豁免成员资格（`deepseek-harness/scripts/coverage-exempt.ts:1-59@687f282e`）：只有当该套件执行的、受覆盖率测量的文件已被其它套件完全覆盖，移除它不改变阈值时才可加入；清单包含 Typert、webworker-runtime、install-lefthook/oxlint-contract/change-scope 三个脚本 spec、webworker-packer image-loadable。`filter` 与 `exclude` 必须选择同一批文件。
3. 未设置 `DSH_COVERAGE_PARTITIONS` 时，instrumented gate 直接 `vitest run --coverage`；设置时改跑 `pnpm run test:coverage:partitioned`，并把分区数写进 `displayCommand`（`deepseek-harness/scripts/run-gates.ts:696-735@687f282e`）。
4. 分区协调器（`CoveragePartitionCoordinator.run`，`deepseek-harness/scripts/coverage-partitions.ts:495-531@687f282e`）：
   - 清理拥有的 `coverage/` 树并创建 blob 目录；
   - `assignFiles`：有 inventory 时按记录耗时分配，最重桶先启动（`assignWeightedPartitions` 用最小堆，按 `(sum, fileCount)` 选择桶）；无耗时数据时退化为文件数均衡；
   - `assertNonEmptyAssignments`：空分区直接抛错——Vitest 对空 `include` 会执行全量，等于把整套跑 N 次；
   - 为每个分区写临时 Vitest 配置（避免 Windows `CreateProcess` 命令行长度限制），并行运行单 worker 进程；
   - 先持久化耗时（即使后续 blob 校验失败也保留已完成分区的测量），再校验 blob 集合完整、每个紧凑 timing report 恰好覆盖分配的文件一次；
   - 运行一次 merge 命令做统一阈值检查；只有全部分区与 merge 都成功才返回 0；
   - 成功才删除临时树，失败保留 `coverage/.partitioned` 诊断。
5. 预算联动：`DSH_COVERAGE_MAX_WORKERS` 决定 `--maxWorkers`；`exempt = max(1, floor(total/3))`，`instrumented = max(1, total - exempt)`；显式 `DSH_COVERAGE_PARTITIONS` 独立于该份额（`deepseek-harness/scripts/run-gates.ts:684-694@687f282e`）。`DSH_COVERAGE_PARTITIONS` 必须为 >1 的整数，否则在启动前抛错（`deepseek-harness/scripts/coverage-partitions.ts:84-90@687f282e`）。
6. 超时预算：`DSH_COVERAGE_TEST_TIMEOUT_MS` 由 `vitest.config.ts` 的每个 inline project 通过 `coverageTestTimeoutOptions` 读取，**不是** gate 参数；CI 在 Linux 覆盖率 lane 设 90000（`deepseek-harness/.github/workflows/ci.yml:124-131@687f282e`），Windows 覆盖率 lane 同样设 90000（`deepseek-harness/.github/workflows/ci.yml:618-626@687f282e`）。

**责任者**：测试/覆盖率维护者（阈值与豁免清单）；CI 配置者（worker/partition/timeout 数值）。

**完成信号**：instrumented 与 exempt gate 都通过；分区模式下 merge 通过；汇总中无 skipped。

**失败处理**：分区失败 → 先看保留的 `coverage/.partitioned` 中对应分区报告；blob 缺失/文件漏算 → 检查分配与 config 生成；空分区 → 降低分区数或修复 inventory；超时 → 调 `DSH_COVERAGE_TEST_TIMEOUT_MS` 或减少同宿主并发，不要只抬 `--maxWorkers`。

**例外**：不设置分区时走普通覆盖率；`DSH_COVERAGE_PARTITIONS=1` 被拒绝；耗时历史缺失时首次运行按文件数均衡。

**证据限制**：协调器保证“执行与合并完整性”，不保证阈值语义（测试域拥有）；耗时均衡依赖历史质量；源测试覆盖参数校验与预算派生（`deepseek-harness/scripts/run-gates.spec.ts:646-730@687f282e`），但没有真实四分区运行的仓库级证据。源测试还固定 worker/分区预算数学、Electron 先于覆盖率、测试超时变量归属与分区 opt-in/非法计数拒绝（`deepseek-harness/scripts/run-gates.spec.ts:166-238@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:577-591@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:654-669@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:699-715@687f282e`）；协调器本身仍无真实四分区运行证据。

---

## 5. CI 工作流拓扑

### 5.1 PR-only 与 master-only 的硬分离（源义务）

**源规则**（`deepseek-harness/.github/AGENTS.md:3-5@687f282e`；`deepseek-harness/.github/workflows/ci.yml:1-5@687f282e`；`deepseek-harness/.github/workflows/ci-master.yml:3-22@687f282e`）：

- `ci.yml` **只**监听 `pull_request`；`ci-master.yml` 监听 `push: branches:[master]` 与 `workflow_dispatch`，**从不**监听 `pull_request`；
- 分离的理由：master-only 的平台检查、自托管 standby、手动 runner 基准不应出现在 PR check panel；同时保证 PR 所需检查集合稳定；
- 两者都设 `permissions: contents: read`、`DSH_TELEMETRY_DISABLED: '1'`、`PRIMARY_NODE_VERSION: '24'`；
- 两者工作流级 `concurrency: {group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true}`（`deepseek-harness/.github/workflows/ci.yml:17-19@687f282e`；`deepseek-harness/.github/workflows/ci-master.yml:20-22@687f282e`）。

ci-master 的 `workflow_dispatch` 只有必填 suite choice（默认 `larger-runner-benchmark`，另有 `consolidated-runner-benchmark`、`ssh-helper`），一次只跑对应手工 job；push 实际只跑 `python-runtime`、`windows`、`serial-linux-selfhosted`、`serial-windows`，`serial-macos` 为 `if: false`。ci-master 没有 `needs`/汇总 job。同一 ref 的 manual suite 与 push run 共用 workflow-ref 取消组，启动一个 suite 会取消该 ref 上正在进行的 push 或另一个 suite；不同 ref 不共享该组（`deepseek-harness/.github/workflows/ci-master.yml:3-16,33-55,141-144,197-200,235-238,289-291,400-402,20-22@687f282e`）。契约测试只固定 on 键、并发和 push 可达集合（`deepseek-harness/scripts/ci-workflow.spec.ts:679-740@687f282e`）。

**测试强制**（`deepseek-harness/scripts/ci-workflow.spec.ts:679-740@687f282e`）：断言两个 workflow 的 `on` 键集合**精确**为 `['push','workflow_dispatch']` 与 `['pull_request']`，concurrency 完全相等，且 standby drill 不得有自己的 job 级 `concurrency`。这把“不要往 PR workflow 加 master job”变成可执行契约。

**迁移设计**：若新仓库只有一个 CI 文件，用 `if: github.event_name == ...` 分区仍会让 master-only job 出现在 PR 的 skipped 列表；源选择物理分离，复刻时优先保留。

### 5.2 平台策略（源义务）

`.github/AGENTS.md` 写明的平台事实：

- 原生 Windows job 跑在 `windows-*` 标签、原生 `pwsh`；原生 Windows 构建与进程检查计入 PR 的 `all checks passed`；
- Wine 只在 `ci-master.yml` 用托管 Linux 跑 Windows Node；
- Python runtime CI 在 PR 上覆盖 Linux/Windows x64，在 master push 上增加 Linux ARM64 与两种 macOS 架构；发布保留全部五个目标；
- `ci.yml` 的 `python-runtime` 通过 reusable workflow 只请求 `node24-linux-x64,node24-win-x64`，且 `needs: python-sdk`（`deepseek-harness/.github/workflows/ci.yml:514-528@687f282e`）；
- 手动 Windows 打包使用专用自托管标签 `dsh-win-package-trial`，与自动 CI 路由分开（`deepseek-harness/.github/workflows/windows-package.yml:55@687f282e`）；
- 手动 Desktop 发布先选择一个成功的 package run/attempt，再按 `DESKTOP_PUBLISH_RUNNERS` 把每个构建路由回原机器的唯一标签；Windows 步骤用原生 PowerShell，Mac 用默认 POSIX shell，共享入口是 Node 脚本；测试/生产分别使用 `desktop-test`/`desktop-production` approval Environment（`deepseek-harness/.github/workflows/desktop-publish.yml:24-99@687f282e`）。

ci.yml 的 `node-24-bench` 固定 `ubuntu-24.04`、单独 runner、20 分钟；ci-master 的两个手动矩阵基准各 12 行 Linux/Windows 4–96 核，15 分钟、`max-parallel: 12`；Blacksmith 只映射 4/8/16/32，64/96 行保留 fleet label。larger 跑 Linux typecheck/Windows `docs:build`，consolidated 跑 Linux `check:ci`/Windows `check:ci:windows-blocking`；不要把它与 node-24-bench 混为同一基准（`deepseek-harness/.github/workflows/ci-master.yml:289-395,399-531@687f282e`；`deepseek-harness/scripts/ci-workflow.spec.ts:580-607,610-620,639-645@687f282e`）。

master `serial-linux-selfhosted` 固定 `[self-hosted, linux, x64, vm-backup]`，没有 job `timeout-minutes`；checkout `fetch-depth: 0`，跑 `check:ci:linux-primary` 并注入 `DSH_ARCHIVE_BASE_REF=github.event.before`。归档校验语义属于 decisions 域，这里只记录接线（`deepseek-harness/.github/workflows/ci-master.yml:141-191@687f282e`；`deepseek-harness/scripts/run-gates.ts:290-310,399-426@687f282e`）。

**证据限制**：平台覆盖是**配置声明**；源内没有证明每个平台每次都实际执行的运行时记录。发布域拥有发布矩阵语义，本域只拥有路由。

### 5.3 PR 作业清单与依赖（源义务）

`ci.yml` 的阻塞作业（`all-checks-passed.needs`，`deepseek-harness/.github/workflows/ci.yml:737-763@687f282e`）：

1. `node-24`（static）：`check:ci:static`，`DSH_ARCHIVE_BASE_REF=${{ github.event.pull_request.base.sha }}`，`fetch-depth: 0` 保证冻结归档门禁能读可信 base；
2. `node-24-coverage`：`check:ci:coverage`；
3. `node-24-bench`：`check:ci:bench`，固定 `ubuntu-24.04`，`timeout-minutes: 20`；
4. `node-24-consumers`：`check:ci:consumers`；
5. `node-compat`：三版本矩阵，`max-parallel: 1`，`fail-fast: false`；
6. `python-sdk`：Python 3.10 keyless SDK 套件 + blame scoring 测试；
7. `python-runtime`：`needs: python-sdk`，reusable builder；
8. `windows-build`：`check:ci:windows-blocking` + observational；
9. `windows-native-tests`：Windows 专属 spec，文件串行。

**明确不在 PR 裁决中**：`windows-coverage`（临时非阻塞，契约测试固定 `aggregate.needs` 不含它，`deepseek-harness/scripts/ci-workflow.spec.ts:497-520@687f282e`）、`windows`（Wine，master-only）、`serial-*`、`windows-observational`。注释说明 `needs` 不能跨 workflow 文件，所以 Wine 与推迟的 Python 目标不参与 PR 裁决。

**作业数上限**：契约测试计算“普通 job 数 + node-compat 并行度”与“普通 job 数 - python-sdk + 并行度 + runtime targets”，要求都 ≤ 10（`deepseek-harness/scripts/ci-workflow.spec.ts:17-70@687f282e`）。这是**并发 worker 作业**上限，不是 job 总数。

**迁移设计**：把“哪些 job 进入 required verdict”写成显式 `needs` 列表，并用测试固定；不要用 `if` 让 job 在 PR 中 skipped 却仍留在 `needs`（`skipped` 会让裁决失败，除非有意）。

### 5.4 最终裁决 `all-checks-passed`（源义务）

`deepseek-harness/.github/workflows/ci.yml:737-763@687f282e`：

- 单一稳定 required check 名为 `all checks passed`，避免为每个矩阵 leg 维护分支保护；
- `needs: [node-24, node-24-coverage, node-24-bench, node-24-consumers, node-compat, python-sdk, python-runtime, windows-build, windows-native-tests]`；
- `if: ${{ !cancelled() && github.event_name == 'pull_request' }}`，确保在 needs 失败/跳过/取消后仍运行一个显式状态函数，而不是让“被取消的工作流”永久挂起裁决；
- 第一步在 `contains(needs.*.result,'failure') || contains(...,'cancelled') || contains(...,'skipped')` 时打印所有结果并 `exit 1`；第二步打印成功结果；
- `runs-on` 跟随 `DSH_CI_FAILOVER_LINUX`（不是 Windows 开关），因为聚合的是 Linux 必需 worker，且裁决本身不能依赖自定义池可用性——默认 `ubuntu-latest`。

**责任者**：分支保护管理员（把该 check 设为 required）；CI 维护者（维护 needs）。

**完成信号**：PR 面板只有一个 required check；任一被聚合 job 非 success 时该 check 红色。

**失败处理**：若裁决 job 自己没跑（workflow 被取消），分支保护应视为未满足，而不是绿；源用 `!cancelled()` 让它在取消时仍可运行，但 GitHub 对取消 run 的 required check 语义仍需在目标仓库验证。

**例外/证据限制**：分支保护配置本身**不在源码内**；无法从源证明 `all checks passed` 真的是 required check，也无法证明“取消的 run 不阻塞合并”。这属于仓库设置，迁移时必须单独核对（见 §9 与 coverage 的 unresolved）。

**迁移设计**：保留“单一聚合 check + 显式状态函数 + 不跨 workflow needs”的三件套；若新增阻塞 job，同时改 `needs` 与契约测试。

### 5.5 Windows 三车道（源义务）

- `windows-build`：60 分钟；启用 Developer Mode（symlink）；ReFS 卷上用 `corepack pnpm install --frozen-lockfile --package-import-method=clone`，否则普通 `pnpm install`；先跑阻塞 `check:ci:windows-blocking`（build + production site），再解析三个 runner supervision PowerShell 脚本，最后跑 `check:ci:windows-observational-ready`，该步 `continue-on-error: true`、`timeout-minutes: 15`、`DSH_GATE_FAIL_FAST=''`；失败时另一步输出 `::warning::` 并写 step summary（`deepseek-harness/.github/workflows/ci.yml:531-600@687f282e`）。
- `windows-coverage`：120 分钟；与 Linux 一样**不先构建**；`check:ci:coverage`；恢复/保存 `.coverage-times.json`；保存用 `if: !cancelled()`，即使分区失败也保留测量（`deepseek-harness/.github/workflows/ci.yml:602-678@687f282e`）。
- `windows-native-tests`：60 分钟；文件串行 `vitest run --no-file-parallelism --testTimeout 90000` 指定 pwsh loader、workflow-ptc、ralph integration、process-exit 四个 spec（`deepseek-harness/.github/workflows/ci.yml:680-735@687f282e`）。

聚合侧对应（`deepseek-harness/scripts/run-gates.ts:582-650@687f282e`）：

- `ci-windows-blocking` = `windows-build`（label 仍叫 build）+ `windows-site`（`docs:build`）；
- `ci-windows-complete` = 构建 + production site + 覆盖率（覆盖率 gate 都 `needs:['build']`，Electron gate 除外）+ observational gates，后者全部 `allowFailure: true` 且 `after` 覆盖率各 gate；
- `ci-windows-observational-ready` = 静态检查（自有 build）+ electron + duplication + publint + node-next-types + built-bin-smoke；built-bin smoke 额外 `after` 所有前驱，避免抢占启动测量。

ci-master 另有 master-only `serial-windows` standby：`runs-on [self-hosted, dsh-win-ci, windows]`、`timeout-minutes: 120`，启用 Developer Mode，store 固定在 workspace 卷根，仅 ReFS 使用 clone，跑 `check:ci:windows-complete`，`DSH_COVERAGE_TEST_TIMEOUT_MS=90000`，coverage/gate/publint workers 为 1，无 `DSH_GATE_FAIL_FAST`（`deepseek-harness/.github/workflows/ci-master.yml:235-285@687f282e`）。

**证据限制**：`windows-coverage` 当前非阻塞是**临时状态**（契约测试注释“temporarily non-blocking while Windows ACP half-close tests are stabilized”），不能当作永久设计；迁移时若稳定性已解决，应把它加入 `needs`。

### 5.6 Node 兼容矩阵（源义务）

- 版本：`22.19`、`24.9`、`26`；`24.9` 刻意固定在 24.0–24.11.1 内——这些版本报告 major 24 但携带 v1 internal loader，而其它 job 的裸 `24` 已覆盖最新 v2，避免重复测同一 v2（`deepseek-harness/.github/workflows/ci.yml:410-433@687f282e`）。
- 并发：`fail-fast: false`（一个版本失败不取消其它版本），`max-parallel: 1`（共享主机上逐个跑）；22.19 与 24.9 leg 设 `DSH_GATE_CONCURRENCY='1'` 串行，26 leg 不设该矩阵值、走默认预算。
- 自托管准入：`selfhosted` 分支要求 `head.repo.full_name == github.repository`、`fork == false`、作者非 `dependabot[bot]`；blacksmith 分支无这些谓词（ephemeral）。
- 隔离：自托管上设 `NODE_COMPILE_CACHE`、`npm_config_devdir`、`PNPM_CONFIG_STORE_DIR` 到 runner temp/home；`setup-node` 的 `NODE_OPTIONS=--import=./scripts/ci-compatible-toolcache.mjs` 在 setup-node **进程内**改写 `RUNNER_TOOL_CACHE`（`deepseek-harness/scripts/ci-compatible-toolcache.mjs:1-8@687f282e`）；随后显式验证 `process.execPath` 位于 `$RUNNER_TEMP/node-compat-toolcache/`，否则 `::error::` 退出。
- 聚合：`nodeCompatGates` 在 Node 22 上额外 `build:artifacts` 并启用 CLI smoke；`DSH_NODE_COMPAT_SKIP_TYPECHECK=1` 可去掉 typecheck；source smokes 以 `--no-file-parallelism --maxWorkers=1` + `VITEST_MAX_WORKERS=1` 串行。
- loader shape 检测**不在聚合内**：它只随 Node 版本变化，放在矩阵 job 的独立步骤（`deepseek-harness/.github/workflows/ci.yml:480-484@687f282e`）。

**迁移设计**：兼容矩阵的“版本轴”与“平台轴”分开；不要把所有版本塞进一个 job 的串行命令，否则一个版本卡住会拖死全部。

### 5.7 文档/卫生聚合（源义务）

- `doc-sync` 是完整文档门禁（类型检查、站点构建、链接、配对、目录、预算、Agent Note 等），`doc-quick` 由 `quick: true` 的 leaf 派生、**不**含 doc-typecheck / 站点构建（`deepseek-harness/scripts/run-gates.ts:805-883@687f282e`）；`test:docs` = `doc-quick`。
- `hygiene` = 卫生 leaf + `cordis-config` + `runtime-closure`；`check-all` = 全量（含 `test`、`build`、`build:web`、文档、模块图）。
- 文档聚合与卫生聚合都受 8 worker 上限（§3.4）。
- `check:all` 是**可选**的综合本地集合，不是 agent 指令（`deepseek-harness/docs/development.md:149@687f282e`）。

---

## 6. runner、缓存与故障切换

### 6.1 runner 拓扑与标签（源事实）

| 池/标签 | 性质 | 用途 |
| --- | --- | --- |
| `dsh-ubuntu-24-04-{4,8,16,32,64,96}core` | 托管企业级 larger runner | 默认 Linux 主作业、手动基准 |
| `[self-hosted, linux, x64, vm-backup]` | 单台共享 VM，多个常驻 runner 注册 | Linux 故障切换、master standby |
| `dsh-windows-2025-{4,8,16,32,64,96}core` | 托管企业级 Windows | 默认 Windows 作业 |
| `[self-hosted, dsh-win-ci, windows]` | 一台 96 核/580GB Windows，32 个常驻 runner（计划任务 `GH-Runner-01..32`） | Windows 故障切换、standby |
| `dsh-win-package-trial` | 专用自托管 Windows x64 | 手动 Windows 打包 |
| `blacksmith-{4,8,16,32}vcpu-ubuntu-2404` / `...-windows-2025` | 第三方按需 | `blacksmith` 故障切换值 |
| `ubuntu-latest` / `macos-latest` | 标准托管 | 裁决、基准、Wine、darwin 单测 |

**自托管镜像前置**（failover runbook）：`vm-backup` 需预装 Playwright Chromium/WebKit 的 Linux 系统包（CI 只下载 lockfile 选择的浏览器，从不在这台持久主机跑 `apt`）；`dsh-win-ci` 需预装 Node 24、pnpm、Git（含 Git Bash 在 PATH，`C:\Program Files\Git\bin`）、PowerShell 7，并启用 Developer Mode；Windows 工作区与 pnpm store 必须在同一 ReFS 卷（`F:`），以支持 `--package-import-method=clone` 与 `@reflink/reflink`。

**macOS 打包 runner 主机**：`setup-macos-packaging.mjs` 在绝对配置根创建/校验当前账户拥有的真实私有目录和缺失模板；`start-macos-packaging-runner.sh` 要求 Apple Silicon、Node 24、Xcode SDK/notarytool/stapler/C 编译器与 test preset/`macos-signing.env`，`--check` 只做环境预检（不查注册、凭据内容，不执行 svc/launchctl），实际启动用 `env -i` 清理 ambient 设置并由 `caffeinate` 托管；`macos-runner-service.sh install` 要求非 root、GUI 登录、已注册 runner，重写 `.path`、生成 0600 LaunchAgent 模板并 `plutil -lint`，启停/卸载委托 `svc.sh`，重启后要桌面登录（`deepseek-harness/apps/desktop/scripts/setup-macos-packaging.mjs:1-34@687f282e`、`deepseek-harness/apps/desktop/scripts/start-macos-packaging-runner.sh:1-42@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-runner-service.sh:1-61@687f282e`）。

**证据限制**：池容量、注册数、镜像内容来自 Agent Note 描述，不是可执行断言；`serial-*` standby 是唯一持续证明。

### 6.2 故障切换开关（源义务）

**开关**：`DSH_CI_FAILOVER_LINUX` 与 `DSH_CI_FAILOVER_WINDOWS`，仓库 Variables（writer 可管理，PR 不可设置），值：

- unset 或任何其它值 → 托管默认；
- `selfhosted` → Linux 用 `vm-backup`，Windows 用 `dsh-win-ci`；**排除 `dependabot[bot]`**（持久 VM 不执行依赖方代码）；
- `blacksmith` → 对应平台作业改派 Blacksmith 按 vCPU 尺寸的 runner；**无 Dependabot 排除**（ephemeral）。

**参与作业**：Linux 三个企业 worker（`node-24`、`node-24-coverage`、`node-24-consumers`）、`node-compat` 三 leg、`all-checks-passed`；Windows 三个 job（build/coverage/native-tests）；另有 `expected-filenames`（仅 blacksmith）、sandbox 的 bwrap leg（仅 blacksmith）、两个手动基准矩阵（4–32 vCPU 映射，64/96 保留 fleet 标签）。ci-master 两个手动矩阵基准的 `runs-on` 明确消费 `DSH_CI_FAILOVER_LINUX/_WINDOWS`（`deepseek-harness/.github/workflows/ci-master.yml:289-299,406-410@687f282e`）；只有 ci.yml 的 `node-24-bench` 固定托管且不参与。发布链保持自己的 runner（见下方 Note 出入）。

**Note 中的排除意图（不等于全部 YAML 已保证）**：`node-24-bench`（固定 `ubuntu-24.04`）、`python-sdk`、Wine、`release-publish`/`release-vendor-publish`、Cloudflare preview、weighted-approval、issue App-token、npm/PyPI 发布、需要宿主能力的 Landlock/Seatbelt/arm64 与整个发布链。以下实际差异必须保留，不能只复制这份清单。

**执行事实与设计意图的冲突（保留）**：`e2e.yml` 的 `runs-on` 含 `blacksmith` 分支，只有该值改派，`selfhosted` 仍回落 `ubuntu-latest`；`docs-pages.yml` 的 build 固定 `blacksmith-8vcpu-ubuntu-2404`，deploy 才用 `ubuntu-latest`。这证明当前路由，不证明 Note 中凭据/发布信任政策已撤销。迁移须逐 job 复核代码、凭据与 runner 信任边界；既不把旧排除清单谎称为自动保证，也不因 YAML 已如此就默许第三方执行凭据任务。

**切换步骤**（failover runbook，~1 分钟）：

1. GitHub Settings → Secrets and variables → Actions → Variables，创建/改对应变量为 `selfhosted`（或 `blacksmith`）；
2. 重触发作业：已**排队**在旧标签的 job 不会改派，也不能原地 re-run；必须取消整次 run 后 re-run all，或推新提交；“Re-run failed jobs”只在 job 已失败时有用；
3. 选择 `selfhosted` 时，Linux 消费者作业把 `DSH_SNAPSHOT_MAX_CONCURRENCY` 设为 12、跳过托管 pnpm/Playwright cache restore（持久 store 已暖）；覆盖率 lane 设 `DSH_COVERAGE_MAX_WORKERS=6`、`DSH_COVERAGE_PARTITIONS=4`（4 个 instrumented 分区 + 2 个 exempt worker）并把聚合并发降到 3；Windows 保留显式 worker 限制。

**切回**：删除变量或设为其它值；新 run 回到托管池；清理由事故期间额外注册的实例。

**前置/就绪证据**：设置前先看最新**已完成**的 `serial / linux (self-hosted standby)` 与 `serial / windows` 结果；取消的或仅排队的 run 不算就绪。standby 与主 CI 共享 `workflow-ref` 取消策略，master 快速更新可能饿死 drill。

**信任边界**：变量是 writer 可管理的仓库状态，不是 admin-only；在私有、禁用 fork 的仓库里，runner group 允许所有 workflow（为了让 PR-ref 故障切换可行），因此边界是“仓库成员身份”，变量只负责路由。不能把 runner group 固定到 master-ref workflow，否则 PR-ref 的 failover job 无法进入。

**责任者**：仓库 writer（切换）；on-call/CI 维护者（判断池健康与容量）。

**失败处理**：切换后作业仍排队 → 检查是否只 re-run failed（错）或变量拼写/权限；Dependabot PR 在 selfhosted 下持续排队是**预期**，不是切换失败；blacksmith 需注意费用与部分镜像能力（Landlock 不强制、macOS 未验证）。

**证据限制**：源不能验证远端 Variables 当前值、runner group 策略、池容量；切换演练需要真实仓库权限与隔离环境（BRIEF C5 要求授权），本域只记录机制，不主张已执行。

### 6.3 缓存姿态（源义务）

- **pnpm store**：先 `Configure pnpm store path` 把 `PNPM_CONFIG_STORE_DIR=$HOME/.local/share/pnpm/store` 写入 `GITHUB_ENV`，用 `pnpm store path --silent` 输出缓存路径；托管 runner 用 `actions/cache/restore`（键 `os-node-version-pnpm-lockhash`，前缀回退），PR **只 restore 不 save**，避免把压缩/上传放在延迟关键路径；自托管跳过 restore（持久 store）。
- **覆盖率时长历史**：`.coverage-times.json`；键 `coverage-times-<OS>-<runner.environment>-<failover值或 enterprise>-<run_id>-<run_attempt>`，`restore-keys` 用稳定前缀；保存用 `if: !cancelled()`，键含 run/attempt 保证不可变缓存总有新条目。
- **Playwright**：`PLAYWRIGHT_BROWSERS_PATH=${RUNNER_TEMP%/*}/ms-playwright`；托管 restore `os-playwright-lockhash`；自托管不 restore，改用镜像预装 + `playwright install chromium webkit`（不跑 `--with-deps`，不 apt 污染共享主机）。
- **Wine（ci-master windows）**：`~/wine-debs` 由 `actions/cache` 保存，键 `wine-debs-${ImageOS:-linux}-${ImageVersion:-v0}`；同 job 的 pnpm store 只用 `actions/cache/restore`，不 save。恢复的是 `apt-get install --download-only wine` 的完整依赖闭包，优先 `dpkg -i` 离线安装，失败再走 apt 网络；实现里把 deb 取回缓存目录的行不是 cache save 步骤。调用脚本后以 `if: always()` 执行 `wineserver -k`（`deepseek-harness/.github/workflows/ci-master.yml:79-94,124-129@687f282e`）。ci-master 的 serial Linux/Windows 无 cache 步骤；larger 基准仅 Linux 启用 pnpm cache，consolidated 两个平台均启用。
- **Node 编译缓存**：在**第一次 pnpm 调用前**把 `NODE_COMPILE_CACHE=${{ runner.temp }}/node-compile-cache` 写入 `GITHUB_ENV`（Linux 三个作业与 `serial-linux-selfhosted`；契约测试固定顺序 `deepseek-harness/scripts/ci-workflow.spec.ts:743-771@687f282e`）。
- **临时目录**：Linux 作业第一步 `TMPDIR=${{ runner.temp }}`；消费者作业额外把 Playwright 放到 runner temp 的父目录，确保 runner 清理拥有这些文件（包括取消的 run）。
- **工具缓存隔离**：`pnpm/action-setup` 的 `dest` 必须是 runner/run 私有路径；Windows 使用 `${{ runner.temp }}/setup-pnpm-js-${{ github.run_id }}-${{ github.run_attempt }}-${{ github.job }}`；契约测试断言每个 setup 步骤（`deepseek-harness/scripts/ci-workflow.spec.ts:218-283@687f282e`）。环境变量 `TMPDIR`/`npm_config_cache` 不得在步骤级覆盖。

**迁移设计**：区分三类缓存：包存储（可跨 run 共享）、测量历史（按平台/池分区、按 run 写入）、工具安装（必须 run 私有）。混用会导致“自托管路径污染托管缓存命名空间”（`deepseek-harness/.github/workflows/ci-master.yml:140@687f282e` 明确禁止在 standby 保存托管缓存）。

### 6.4 自托管主机隔离（源义务）

- `pnpm install` 使用 `--frozen-lockfile`；Windows 先探测卷文件系统，只有 ReFS 才加 `--package-import-method=clone`（NTFS 拒绝 copy-on-write，会 `ERR_PNPM_LINKING_FAILED`）；契约测试固定两个分支必须同时存在且 else 分支是普通 install（`deepseek-harness/scripts/ci-workflow.spec.ts:360-430@687f282e`）。
- Windows 自托管 store 放在工作区卷根（`[IO.Path]::GetPathRoot($env:GITHUB_WORKSPACE)\.pnpm-store`），保证 clone 同卷（`deepseek-harness/.github/workflows/ci-master.yml:258-275@687f282e`）。
- Node 兼容 job 在自托管上把版本安装、node-gyp devdir 限制在 runner temp，并验证安装路径；`RUNNER_TOOL_CACHE` 由 setup-node 进程内 shim 改写，避免污染宿主共享工具缓存。
- 自托管不做 `apt` 安装 Playwright 系统依赖；bubblewrap 用 pinned payload 而不是 apt 事务。

---

## 7. 并发、取消与最终裁决的关系

**源规则**：

- 同一 workflow/ref 的新 run 取消旧 run（`cancel-in-progress: true`），包括 `ci-master` 的 standby drill；这是为了不让新 head 排在过期 9-job run 后面。
- 取消是**工作流级**，与 `DSH_GATE_FAIL_FAST` 的**聚合级**终止是两层：前者停掉整个 run（所有 job），后者在单个 job 内停掉剩余 gate。二者不能互相替代。
- 需要保留的事务不随新 run 取消：`release-publish.yml` 与 `release-vendor-publish.yml` 的 `publish` job 设 `cancel-in-progress: false`（契约测试 `deepseek-harness/scripts/ci-workflow.spec.ts:163-179@687f282e`）；Desktop 发布的 publish job 也是 `false` 且按 runner/preset 分组（`deepseek-harness/.github/workflows/desktop-publish.yml:97-99@687f282e`）。
- 取消后的清理要区分条件：benchmark 报告、覆盖率时长缓存用 `!cancelled()` 上传/保存；Wine 用 `if: always()` 执行 `wineserver -k`（`deepseek-harness/.github/workflows/ci-master.yml:127-129@687f282e`）。不能把两者统一说成“取消后也执行”。
- 两个 reusable native builder 各有独立取消组：`build-single-exe-*` 与 `ssh-helper-*`，`cancel-in-progress: ${{ !inputs.release }}`；release 构建不被普通 CI 新 run 取消（`deepseek-harness/.github/workflows/build-exe-for-python-sdk.yml:44-50@687f282e`、`deepseek-harness/.github/workflows/build-exe-for-ssh-helper.yml:24-26@687f282e`）。
- 就绪证据：standby drill 的“最新一条**已完成** run”才算证据；被取消的 run 只证明取消策略生效，不证明环境可用。

**迁移设计**：把“取消策略”按工作流分类写死：PR/master CI 可取消；发布/部署不可取消；诊断上传 always/!cancelled。不要把 `concurrency` 放在 job 级（会与工作流级语义叠加），除非像 Desktop publish 那样按资源分组。

---

## 8. 辅助工作流与跨平台脚本

### 8.1 路径过滤的命名检查（源义务）

`expected-filenames.yml` 只在 PR 且路径匹配 `*golden*`（大小写不敏感、排除 `vendor/**`）时触发；运行 `scripts/check-expected-filenames.sh`，用 `git ls-files -z` + `:(icase,glob)` 查找，发现非 vendor 的 tracked 文件名含 `golden` 就失败，提示改用 `expected` 等准确术语（`deepseek-harness/.github/workflows/expected-filenames.yml:1-28@687f282e`；`deepseek-harness/scripts/check-expected-filenames.sh:1-25@687f282e`）。`runs-on` 仅响应 `DSH_CI_FAILOVER_LINUX == 'blacksmith'`，selfhosted 值不参与（契约测试 `deepseek-harness/scripts/ci-workflow.spec.ts:581-608@687f282e`）。

**迁移设计**：路径过滤 job 必须保证“没有匹配路径时不会长期 pending”；GitHub 对 path-filtered required check 的语义要在分支保护层验证。术语策略本身属于文档域。

### 8.2 Sandbox 的 false-green 防护（源证据，属测试域接线）

`sandbox.yml` 是 master-only，按内核能力 fan-out（bwrap/landlock×2/seatbelt）；每个 leg 断言 `Test Files 2 passed (2)`，因为没有 runner 的 e2e 会 self-skip，从而产生“假绿”；Landlock 的 pack rehearsal 在同一 leg 构建 `build:official` 并安装本地 tarball（`deepseek-harness/.github/workflows/sandbox.yml:46-150@687f282e`）。`unit-darwin` 单独 job，60 分钟上限，使用与覆盖率 lane 相同的 `DSH_COVERAGE_TEST_TIMEOUT_MS=90000`（`deepseek-harness/.github/workflows/sandbox.yml:150-168@687f282e`）。

**迁移设计**：对所有“缺能力就 self-skip”的 e2e，必须加“实际执行文件数/无 skip”断言，否则 CI 会把缺失能力当通过。

### 8.3 Wine Windows 门禁（源义务/可选本地）

`scripts/wine-windows-gates.sh` 在 Linux 上用真实 win-x64 Node 跑阻塞 Windows gate（workspace build + production site）。关键设计：

- 不修改工作树：把 tracked + untracked-unignored 快照到临时目录，把 Wine 专用 pnpm override 追加到**快照**的 `pnpm-workspace.yaml`，在快照里安装并运行；
- scratch 目录没有 Git 元数据，所以显式设 `DSH_CLIENT_COMMIT_HASH=$(git rev-parse HEAD)`；
- Wine prefix 与校验过的 Windows Node zip 持久在 `.cache/wine-windows/`；`DSH_WINE_NODE_MAJOR`/`DSH_WINE_GATE_CACHE_DIR`/`DSH_WINE_GATE_KEEP` 控制；
- 预检缺失工具（wine、curl、unzip、sha256sum/shasum、pnpm）一次性报全并退出；Node zip 从 nodejs.org 下载，失败回退校验和**不受信任**的 npmmirror 传输并最终用官方 `SHASUMS256.txt` 校验；离线时回退最新缓存 zip 并大声提示；
- 运行结束 `wineserver -k`；`DSH_WINE_GATE_KEEP=1` 保留 scratch 以便诊断（`deepseek-harness/scripts/wine-windows-gates.sh:1-143@687f282e`）。
- 安装只对已知 `ERR_PNPM_ENOENT.*rename.*_tmp_` hoisted-linker 竞态最多尝试三次，每次清除快照内的 `node_modules`。其它错误或最终失败直接失败；不能推广成通用错误重试（`deepseek-harness/scripts/wine-windows-gates.sh:147-186@687f282e`）。
- Node 准备、Wine 初始化、快照安装并发启动后先等待每个子进程，再汇总状态，避免首个失败导致 EXIT trap 删除其他子进程仍使用的 scratch（`deepseek-harness/scripts/wine-windows-gates.sh:188-212@687f282e`）。
- Wine Node 的 stdio 走文件；实际 smoke 必须报告 `win32 x64`。build 与 site 各自收集状态、日志并等待完成，任何一方失败都传播（`deepseek-harness/scripts/wine-windows-gates.sh:214-288@687f282e`）。这里只核对了代码，不声称 Wine 实跑通过。
- 尾部完整来源为 `deepseek-harness/scripts/wine-windows-gates.sh:144-288@687f282e`；安装、准备与门禁状态必须一起审查，不能只凭上半段说明推定退出和清理正确。
- ci-master `windows` job 为 `ubuntu-latest`、15 分钟；只 restore pnpm store，不 save；Wine deb 缓存由 `actions/cache` 保存；调用脚本与 `if: always()` 的 `wineserver -k` 分别在 `deepseek-harness/.github/workflows/ci-master.yml:124-125,127-129@687f282e`。
- 使用边界：`deepseek-harness/AGENTS.md:99@687f282e` 明确 `check:windows-wine` **只在诊断已知 Windows 失败时**运行；原生 Windows job 拥有该信号。

### 8.4 GitLab 发布流水线（源义务，发布语义跨域）

`.gitlab-ci.yml` 的 `workflow.rules` 只允许 `python-v<semver>` tag，其它一律 `never`；`stages: build → publish`；每个 wheel job 先校验 `CI_COMMIT_TAG == "python-v$DSH_VERSION"`（`package.json` 版本），否则退出；runtime wheel 额外 `pnpm install --frozen-lockfile`、`verify-runtime-closure`、单 exe 构建、`smoke-python-runtime.py --scenario all`、wheel 安装 smoke；Linux 用 `readelf` 检查最高 GLIBC ≤ 2.28 并在 `manylinux_2_28` 容器复测；macOS 用 `lipo -verify_arch` 与 `check-macos-deployment-target.py`；`publish-python` `resource_group: python-release`、`needs` 六个产物、断言恰好 6 个 wheel、`twine check`、`twine upload` 失败时提示 GitLab 不覆盖已存在版本（`deepseek-harness/.gitlab-ci.yml:1-191@687f282e`）。

**迁移设计**：标签与版本一致性、产物数量断言、不可变发布语义是发布域的核心；本域只记录“CI 入口/依赖/资源组”形态。

### 8.5 凭据型/发布型工作流的信任与不可取消性（源义务，发布/协作语义跨域）

**分类边界**：共同契约是按触发来源、实际执行代码、权限、凭据作用域与取消策略建立信任边界。下面三类不能套用“所有凭据 workflow 都禁止 PR 代码”或“一律 checkout 默认分支”的规则；具体边界如下。

- **真实 API e2e**（`deepseek-harness/.github/workflows/e2e.yml:1-127@687f282e`）：触发为 `workflow_dispatch`、`push: [main, master]`、`pull_request`、每日 00:17 UTC；**绝不允许改成 `pull_request_target`**。job-level `if` 排除 fork 与 Dependabot，判定用 `pull_request.user.login` 而非 `github.actor`；**可信同仓 PR 仍构建、执行 PR 关联代码**。key 只注入 preflight 与实际测试步骤，不注入 checkout/setup/install；缺 key 硬失败而非套件自跳过假绿。测试显式固定外部 API 地址并使用构建后的真实包导出。旧 run 可取消；`blacksmith` 值才改派，`selfhosted` 仍回落 `ubuntu-latest`；45 分钟、4 个文件 worker。
- **opt-in provider e2e**（`deepseek-harness/.github/workflows/pi-ai-provider-e2e.yml:1-63@687f282e`）：仅 `workflow_dispatch`，没有 push/PR/schedule 触发；preflight 一次性检查两个 provider key；20 分钟；不进入 required 集合。
- **Issue policy/lifecycle**（`deepseek-harness/.github/workflows/issue-policy.yml:1-58@687f282e`；`deepseek-harness/.github/workflows/issue-lifecycle.yml:1-52@687f282e`）：`pull_request`/`pull_request_review` 触发；`permissions` 只读；**checkout 默认分支**的 `policy.mjs`，PR 无法修改策略；只有需要 Project 时才创建 App token（issues/org-projects read）；lifecycle 用 `issue-lifecycle-<number>` 分组、`cancel-in-progress: false`，同一 issue/PR 的事件串行；自动 bot 可走预检豁免，但失败仍不能被 edit skip 掩盖。
- **Weighted approval**（`deepseek-harness/.github/workflows/weighted-approval.yml:1-66@687f282e`）：`pull_request_target` + `issue_comment` + `workflow_run`；**checkout 默认分支的策略**，只把 PR review/comment 当 API 数据；`statuses: write` + `pull-requests: write`；按 PR 分组且不取消；失败时发布 error status。
- **Docs Pages**（`deepseek-harness/.github/workflows/docs-pages.yml:1-93@687f282e`）：仅 `workflow_dispatch`，**从不**出现在 PR check；检出所选 ref，`release:verify` 要求 `dsh-v*` tag 与 `package.json` 版本一致，不能一律改为默认分支；`concurrency: github-pages`、`cancel-in-progress: false`；build 固定 Blacksmith，deploy 用 `ubuntu-latest` + `pages:write`/`id-token: write` + `github-pages` environment（required reviewers 由仓库设置，源注释声明但不在 YAML）。
- **PR preview**（`deepseek-harness/.github/workflows/build-preview-cloudflare.yml:1-73@687f282e`）：每 PR 分组、`cancel-in-progress: true`；`contents: read` + `pull-requests: write`；pnpm cache 只 restore；上传只含构建产物，Cloudflare Access 保护，生产分支名故意不对应任何部署。
- **SSH helper release**（`deepseek-harness/.github/workflows/publish-ssh-helper.yml:1-83@687f282e`）：手动 `publish` 输入；publish 要求 `GITHUB_REF_NAME == dsh-v<version>`；validate → build → verify（按 source commit 校验完整证据）→ publish；`publish-ssh-helper-<ref>` 组、不取消。发布语义归发布域，本域只记录触发/权限/并发/依赖形状。
- **Desktop publication**（`deepseek-harness/.github/AGENTS.md:7@687f282e`；`deepseek-harness/.github/workflows/desktop-publish.yml:23-99@687f282e`）：手动选择一次成功的 package run/attempt；准备 job 无凭据；test/production 分别使用 `desktop-test`/`desktop-production` approval Environments；每个保留 build 通过 `DESKTOP_PUBLISH_RUNNERS` 路由回其原机器的唯一标签；Windows 步骤用 pwsh、Mac 用 POSIX，共享入口是 Node 脚本；publish job `cancel-in-progress: false`（§7）。产物与审批内容归发布/桌面域。

**责任者**：workflow 作者（触发、权限、并发）；仓库管理员（environment reviewers、secrets、App 安装范围）。

**完成信号**：Pages 等仅手动发布 job 不出现在 PR check；e2e 仍有 PR 触发，fork/Dependabot 显示 skipped，可信同仓 PR 可进入执行；缺失 secret 时 job 失败而不是全 skip；发布 run 不被新 run 取消。默认分支策略与选定发布 ref 分别验证，不以一个替代另一个。

**失败处理/例外**：源 e2e 的 job-level `if` 跳过 fork/Dependabot，注释说明这种 skip 可作为成功 check；但 skip 不是实际 API 成功，未获授权并带 key 实跑的路径仍缺效果证据。`pull_request_target` 在这里的 approval publisher 中只用于默认分支受信策略，不能把此例外搬到执行 PR 代码的 e2e；该 publisher 的 `workflow_run` 仅在 review-event 成功时继续。

**证据限制**：environment required reviewers、App 安装范围、secret 是否存在、Cloudflare Access 规则都是远端状态；源只证明 workflow 侧的校验与注释意图。GitHub 对 job-level skip 的 check 语义要在目标仓库验证。

---

## 9. 迁移检查清单（参数化）

以下把源义务转成新仓库可执行步骤。方括号内是必须替换的参数。

1. **钩子**：创建 `[lefthook.yml]`，只放 staged/快速 job；根 `postinstall` 调 `[安装器]`；安装器实现 CI 短路、Git 版本门槛、只读校验、锁、归属标记、回滚。完成信号：`pnpm install` 两次幂等；两个 worktree 的 `core.hooksPath` 不同；`CI=true` 不产生任何 Git 变更。
2. **门禁**：在 `[package.json]` 注册聚合脚本；在 `[run-gates.ts]` 的枚举与 `switch` 同步加名；为每个 gate 标注 `needs`（数据）或 `after`（资源）；运行图校验。完成信号：未知聚合名抛错并列出合法值；环/未知依赖在子进程前失败。
3. **预算**：定义 `[CI]` 与本地两套 worker 预算；为每个工具设独立上限；共享主机显式压 `DSH_GATE_CONCURRENCY`。完成信号：启动行打印来源；显式值不被覆盖。
4. **fail-fast**：在 CI 的阻塞 lane 设 `DSH_GATE_FAIL_FAST=1`；observational lane 留空；实现 abort → 杀树 → 剩余 skipped → 退出码 1。完成信号：首个失败后无新 gate 启动，运行中 gate 被终止，汇总含 `aborted by fail-fast`。
5. **源码/产物前置**：公共命令先跑契约生成；内层脚本命名为 `*:contracts-ready` 且不在内部重复准备；读取产物的 gate `needs` 构建；构建成功才写 build record。完成信号：干净树上公共命令通过；删声明后内层脚本报错。
6. **CI 分区**：PR-only 与 master-only 物理分开；PR 裁决用单一 `all checks passed` + 显式 `needs`；新增阻塞 job 同步改契约测试。完成信号：PR check panel 不出现 master-only job；任一 needs 非 success 时裁决红。ci-master 没有 `needs`/汇总 job；`all checks passed` 是 ci.yml 的 PR 裁决，不能外推为 master required check。若目标仓库需要 master 门，必须单独设计并验证分支保护。
7. **平台**：确认每个平台的 runner 标签、Node/Python 版本、原生 shell；Windows 的 ReFS/Developer Mode 前置；Python 的目标矩阵与发布矩阵分开。完成信号：每个 job 的 `runs-on` 与 shell 与平台一致。
8. **故障切换**：定义 `[DSH_CI_FAILOVER_*]` 两个独立变量与三个值；为每个值写 `runs-on` 选择器；写切换/切回 runbook；准备 standby drill。完成信号：用测试对每个值求值，断言默认/selfhosted/blacksmith 的目标与 Dependabot 例外；standby 在 master 上持续运行。
9. **缓存/临时目录**：包存储、测量历史、工具安装三类分开；PR 只 restore；自托管不写托管键；`TMPDIR`/工具缓存指向 runner 临时区；setup 的 `dest` 每 runner/run 私有。完成信号：契约测试断言恢复/保存条件与 `dest` 形状。
10. **取消**：CI 工作流 `cancel-in-progress: true`；发布/部署 `false`；诊断上传用 `!cancelled()`/`always()`。完成信号：推新提交后旧 run 取消；发布 run 不被新 run 取消。
11. **裁决**：把 `all checks passed` 配为唯一 required check；核对取消/跳过语义。完成信号：分支保护面板只有该 check；手工制造 skipped need 时它变红。
12. **凭据/发布**：把 workflow 分类为普通 PR、凭据型、发布部署、issue 自动化；凭据型用 job-level `if` 排除 fork/Dependabot，缺 key 的 preflight 硬失败；写权限的策略脚本从默认分支检出；发布/部署 `cancel-in-progress: false`，PR preview 按 PR 可取消。完成信号：fork PR 的 e2e 为 skipped 而非 failed；缺 key 时 job 失败；发布 run 不被新提交取消。

---

## 10. 例外、反模式与证据限制（汇总）

**源明确保留的例外**：

- `allowFailure`（Windows observational gates）失败不使聚合失败，但仍打印并标注 `NON-BLOCKING`；Windows coverage 的临时非阻塞来自它不在 `all-checks-passed.needs`，不是 `allowFailure`；
- `after` 允许后继在前驱失败后运行（资源隔离，不是数据依赖）；
- `ci-windows-observational-ready` 过滤 `build`，由调用方保证已构建；
- `ci-unit` 不注入 worker 环境；
- `check:windows-wine` 仅诊断用，不替代原生 Windows 信号；
- `serial-macos` 当前 `if: false`，且源码 TODO 明确“发布前重新启用”（`deepseek-harness/.github/workflows/ci-master.yml:194-222@687f282e`）；
- 自托管 `selfhosted` 排除 Dependabot，blacksmith 不排除；
- 发布/部署不可取消；benchmark 与 observational 不 fail-fast。

**反模式（源通过实现或测试避免）**：

- 用 `|| true` 或日志解析代替退出码；
- 把 `after` 当 `needs` 用（会在依赖失败后继续消费坏数据）；
- 在 PR workflow 里加 master-only job；
- 在共享自托管主机上跑 `apt` 或写共享工具缓存；
- 在 PR lane 保存 pnpm/Playwright 缓存；
- 把 `DSH_GATE_CONCURRENCY` 设成非整数或 `0`；
- 只杀直接子进程（孙进程持有管道会让 job 挂到超时）；
- 依赖 path-filtered required check 而不验证“无匹配路径”的语义。

**证据限制**：

- 本参考基于**静态源码 + 源内测试**；没有在目标 runner 上执行 CI，也没有访问远端分支保护、Variables、runner group。
- 源测试本身是契约，不是运行时证明；例如 `ci-workflow.spec.ts` 用 Node `vm` 求值 `runs-on` 表达式，不是 GitHub Actions 求值器（`deepseek-harness/scripts/ci-compatible-selfhosted.spec.ts:24-36@687f282e` 明确说明）。
- 覆盖率阈值、Vitest 项目划分、文档配对规则属于其它域；本域只拥有它们的调度与失败传播。
- 远端授权/隔离实验（BRIEF C5）未执行；任何“已在远端生效”的说法都必须是 `[INFERENCE]`，除非有真实 run 记录。

---

## 11. 交叉域依赖

| 依赖 | 本域使用点 | 归属域 | 需要的契约 |
| --- | --- | --- | --- |
| 文档门禁脚本（`verify-translation-pairing`、`verify-md-*`、`verify-doc-budgets`、`verify-agent-note-*` 等） | `doc-sync`/`doc-quick`/`pre-commit` | 文档域 | 脚本名、退出码、`--cached`/`--check` 语义、quick 标记 |
| 测试/覆盖率策略（per-file 100%、Vitest 项目、self-skip 规则） | `ci-coverage`、`ci-unit`、`sandbox` | 测试域 | 阈值、exempt 清单、`DSH_COVERAGE_TEST_TIMEOUT_MS` 读取点 |
| 依赖/供应链（lockfile、vendor manifest、license、Dependabot） | pre-commit vendor guard、CI install、dependency policy | 供应链域 | vendor 修改日志格式、license 门禁、Dependabot 例外 |
| 发布/打包（`release*.yml`、`build-exe-for-python-sdk.yml`、`docs-pages.yml`） | runner 路由、缓存、并发、needs | 发布域 | 发布不可取消、目标矩阵、凭据边界 |
| 评审/协作（`weighted-approval*`、`review-ownership`） | `python-sdk` job 跑 blame scoring 测试 | 协作域 | 测试入口、required review 语义 |
| Agent Note 分类/归档 | `pre-commit` 归档校验、failover 文档引用 | 文档/流程域 | 归档目录约定、note 状态字段 |
| 根 `AGENTS.md` 命令与“CI 拥有穷尽覆盖”政策 | 本地检查边界、`check:all` 可选 | 工程规范域 | 命令清单、完成前 `build:check` 要求 |
| secret/environment 信任边界 | 凭据型 e2e、issue/approval 自动化、Pages/Release 发布 | 安全域（与发布/协作域共管） | secret 不下发 fork/Dependabot、environment reviewers、最小权限、默认分支策略检出 |

跨域调用原则：本域只依赖**命令名与退出码**，不复制其它域的判定逻辑；其它域改变脚本语义时，本域的 gate 图与契约测试需要同步更新。

---

## 12. 机制 ID 索引（稳定锚点）

`knowledge/automation.json` 的 28 个机制 ID 与本文章节一一对应；迁移方的覆盖清单、交叉引用和验证报告应使用这些完整 ID，而不是只写章节号。每条机制的语义支撑在对应章节的正文与引用中；**行号本身不构成支持**，也不证明远端已执行。源事实、源限制、未执行的迁移验证在 JSON 中分别是 `obligations`、`limitations`、`verification.*.evidence: "planned"`，不要混为一谈。

- `automation-local-check-boundary`（§1）：本地检查与 CI 穷尽覆盖的分工边界。主要源：`deepseek-harness/AGENTS.md:84-120@687f282e`、`deepseek-harness/docs/development.md:136-161@687f282e`。
- `automation-lefthook-hook-matrix`（§2.1）：lefthook 提交前/合并前/推送前钩子矩阵。主要源：`deepseek-harness/lefthook.yml:5-49@687f282e`、`deepseek-harness/package.json:214@687f282e`。
- `automation-lefthook-worktree-installer`（§2.2）：worktree-local Lefthook 安装器与安全迁移。主要源：`deepseek-harness/scripts/install-lefthook.mjs:1-769@687f282e`、`deepseek-harness/scripts/install-lefthook.spec.ts:218-860@687f282e`。
- `automation-gate-aggregate-registry`（§3.1）：统一门禁运行器的聚合注册与包脚本所有权。主要源：`deepseek-harness/scripts/run-gates.ts:1-40@687f282e`、`deepseek-harness/scripts/run-gates.ts:122-183@687f282e`。
- `automation-gate-dependency-graph`（§3.2）：Gate 图的 needs/after 语义与静态校验。主要源：`deepseek-harness/scripts/run-gates.ts:42-60@687f282e`、`deepseek-harness/scripts/run-gates.ts:921-979@687f282e`。
- `automation-gate-scheduler`（§3.4）：有界并发调度、启动顺序与聚合停滞保护。主要源：`deepseek-harness/scripts/run-gates.ts:96@687f282e`、`deepseek-harness/scripts/run-gates.ts:186-212@687f282e`。
- `automation-gate-env-budget`（§3.5）：工具级 worker 预算的派生与不覆盖原则。主要源：`deepseek-harness/scripts/run-gates.ts:215-257@687f282e`、`deepseek-harness/scripts/run-gates.ts:684-694@687f282e`。
- `automation-gate-failfast-cancel`（§3.6）：fail-fast 中止、宿主信号转发与进程树终止。主要源：`deepseek-harness/scripts/run-gates.ts:981-1140@687f282e`、`deepseek-harness/scripts/run-gates.ts:1164-1396@687f282e`。
- `automation-gate-result-reporting`（§3.7）：门禁诊断聚合、退出码与 NON-BLOCKING 标记。主要源：`deepseek-harness/scripts/run-gates.ts:62-84@687f282e`、`deepseek-harness/scripts/run-gates.ts:136-140@687f282e`。
- `automation-contracts-ready`（§4.1）：contracts-ready 声明前置与 Typert 契约生成。主要源：`deepseek-harness/package.json:53-58@687f282e`、`deepseek-harness/docs/development.md:110@687f282e`。
- `automation-build-artifact-record`（§4.2）：构建作用域、官方 client profile 与 build record。主要源：`deepseek-harness/scripts/build.ts:92-185@687f282e`、`deepseek-harness/scripts/client-build-environment.ts:1-123@687f282e`。
- `automation-native-sandbox-prerequisites`（§4.3）：原生 addon、Electron、bubblewrap 与运行时前置。主要源：`deepseek-harness/package.json:60-63@687f282e`、`deepseek-harness/scripts/run-gates.ts:615-623@687f282e`。
- `automation-coverage-partitioning`（§4.4）：覆盖率聚合、重负载豁免与按耗时分区。主要源：`deepseek-harness/scripts/run-gates.ts:665-735@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:1-140@687f282e`。
- `automation-node-compat-matrix`（§5.6）：Node 兼容版本矩阵与自托管工具缓存隔离。主要源：`deepseek-harness/scripts/run-gates.ts:428-484@687f282e`、`deepseek-harness/.github/workflows/ci.yml:393-484@687f282e`。
- `automation-windows-gate-lanes`（§5.5）：Windows blocking / complete / observational 三车道。主要源：`deepseek-harness/scripts/run-gates.ts:582-650@687f282e`、`deepseek-harness/scripts/run-gates.ts:885-919@687f282e`。
- `automation-pr-master-workflow-split`（§5.1）：PR-only 与 master-only 工作流物理分离。主要源：`deepseek-harness/.github/workflows/ci.yml:1-20@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:1-33@687f282e`。
- `automation-platform-policy`（§5.2）：平台覆盖策略与原生/兼容/Wine 的分工。主要源：`deepseek-harness/.github/AGENTS.md:3-7@687f282e`、`deepseek-harness/.github/workflows/ci.yml:206-264@687f282e`。
- `automation-pr-job-inventory`（§5.3）：PR 作业清单、并发上限与 required 集合。主要源：`deepseek-harness/.github/workflows/ci.yml:42-735@687f282e`、`deepseek-harness/scripts/ci-workflow.spec.ts:17-70@687f282e`。
- `automation-ci-runner-failover`（§6.2）：CI runner 故障切换开关（selfhosted / blacksmith）。主要源：`deepseek-harness/.github/workflows/ci.yml:26-49@687f282e`、`deepseek-harness/.github/workflows/ci.yml:109-116@687f282e`。
- `automation-runner-topology`（§6.1）：runner 池拓扑、标签与镜像前置。主要源：`deepseek-harness/.github/AGENTS.md:3-7@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-07-26-ci-failover-runbook.md:20-45@687f282e`。
- `automation-cache-posture`（§6.3）：缓存分类、PR 只读姿态与临时目录所有权。主要源：`deepseek-harness/.github/workflows/ci.yml:58-67@687f282e`、`deepseek-harness/.github/workflows/ci.yml:93-100@687f282e`。
- `automation-workflow-concurrency-cancellation`（§7）：工作流并发组、取消策略与发布事务保护。主要源：`deepseek-harness/.github/workflows/ci.yml:14-19@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:19-22@687f282e`。
- `automation-final-verdict`（§5.4）：单一 required check：all checks passed。主要源：`deepseek-harness/.github/workflows/ci.yml:737-763@687f282e`、`deepseek-harness/scripts/ci-workflow.spec.ts:17-70@687f282e`。
- `automation-ci-workflow-contract-tests`（§8）：工作流与安装器的契约测试（把策略变成可执行断言）。主要源：`deepseek-harness/scripts/ci-workflow.spec.ts:1-1565@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:1-1371@687f282e`。
- `automation-wine-windows-gates`（§8.3）：Wine 上的 Windows 阻塞门禁（诊断/主干信号）。主要源：`deepseek-harness/scripts/wine-windows-gates.sh:1-143@687f282e`、`deepseek-harness/package.json:98@687f282e`。
- `automation-auxiliary-filtered-workflows`（§8.1）：路径过滤的命名检查与沙箱 false-green 防护接线。主要源：`deepseek-harness/.github/workflows/expected-filenames.yml:1-28@687f282e`、`deepseek-harness/scripts/check-expected-filenames.sh:1-25@687f282e`。
- `automation-credentialed-workflow-trust`（§8.5）：凭据型/发布型工作流的分类信任边界与取消策略。主要源：`deepseek-harness/.github/workflows/e2e.yml:1-127@687f282e`、`deepseek-harness/.github/workflows/pi-ai-provider-e2e.yml:1-63@687f282e`。
- `automation-gitlab-python-release-pipeline`（§8.4）：GitLab Python 发布流水线的 tag 门槛、产物断言与资源组。主要源：`deepseek-harness/.gitlab-ci.yml:1-191@687f282e`、`deepseek-harness/scripts/ci-workflow.spec.ts:1182-1232@687f282e`。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `automation-local-check-boundary`：`deepseek-harness/docs/testing.md:9-21@687f282e`
- `automation-lefthook-worktree-installer`：`deepseek-harness/docs/development.md:35-45@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-07-27-worktree-local-lefthook.md:1-19@687f282e`
- `automation-gate-aggregate-registry`：`deepseek-harness/scripts/run-gates.ts:186-364@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:267-400@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:430-437@687f282e`
- `automation-gate-scheduler`：`deepseek-harness/scripts/run-gates.ts:1030-1136@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:166-238@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:731-736@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:929-943@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:141-191@687f282e`
- `automation-gate-failfast-cancel`：`deepseek-harness/scripts/run-gates.ts:981-1396@687f282e`、`deepseek-harness/scripts/run-gates.ts:1398-1620@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:1011-1039@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:1320-1356@687f282e`
- `automation-gate-result-reporting`：`deepseek-harness/scripts/run-gates.ts:1646-1697@687f282e`
- `automation-build-artifact-record`：`deepseek-harness/docs/development.md:88-90@687f282e`
- `automation-coverage-partitioning`：`deepseek-harness/scripts/run-gates.ts:665-735@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:144-330@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:341-420@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:461-538@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:549-693@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:695-756@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:166-238@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:577-591@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:654-669@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:699-715@687f282e`
- `automation-node-compat-matrix`：`deepseek-harness/.github/workflows/ci.yml:393-484@687f282e`、`deepseek-harness/scripts/ci-compatible-selfhosted.spec.ts:1-181@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:848-919@687f282e`
- `automation-windows-gate-lanes`：`deepseek-harness/.github/workflows/ci.yml:531-735@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:235-285@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:495-575@687f282e`、`deepseek-harness/scripts/run-gates.spec.ts:577-644@687f282e`
- `automation-pr-master-workflow-split`：`deepseek-harness/.github/AGENTS.md:1-7@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:34-531@687f282e`
- `automation-final-verdict`：`deepseek-harness/.github/workflows/ci.yml:737-763@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:1-531@687f282e`
- `automation-platform-policy`：`deepseek-harness/.github/workflows/ci-master.yml:34-51@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:141-191@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:289-531@687f282e`
- `automation-ci-runner-failover`：`deepseek-harness/.agents/notes/implemented/process/2026-07-26-ci-failover-runbook.md:1-62@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-09-09-blacksmith-failover-leg.md:1-27@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:289-299@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:406-410@687f282e`
- `automation-runner-topology`：`deepseek-harness/.github/workflows/windows-package.yml:54-56@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:141-145@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:235-239@687f282e`、`deepseek-harness/apps/desktop/scripts/setup-macos-packaging.mjs:1-34@687f282e`、`deepseek-harness/apps/desktop/scripts/start-macos-packaging-runner.sh:1-42@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-runner-service.sh:1-61@687f282e`
- `automation-cache-posture`：`deepseek-harness/.github/workflows/ci-master.yml:78-100@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:235-285@687f282e`、`deepseek-harness/.github/workflows/ci-master.yml:289-531@687f282e`
- `automation-wine-windows-gates`：`deepseek-harness/.github/workflows/ci-master.yml:53-129@687f282e`、`deepseek-harness/scripts/wine-windows-gates.sh:1-288@687f282e`
- `automation-auxiliary-filtered-workflows`：`deepseek-harness/.github/workflows/sandbox.yml:1-168@687f282e`

## 来源索引（固定提交）

来源：deepseek-harness/scripts/install-lefthook.spec.ts:1-217@687f282e
来源：deepseek-harness/scripts/install-lefthook.spec.ts:851-882@687f282e
来源：deepseek-harness/scripts/ci-compatible-selfhosted.spec.ts:41-181@687f282e
