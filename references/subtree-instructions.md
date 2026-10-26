# 子树常驻指令治理迁移参考（subtree-instructions）

> 源提交：`687f282e8625c6b8d11ff58211a90524be2e4317`
> 覆盖：三个曾被读取但未进入来源账的子树 `AGENTS.md`，以及八个快照工作区夹具指令。夹具 `AGENTS.md` 只作为测试输入，不是项目指令。

## 机制 1：定时任务是持久 Host 状态 {#subtree-instructions.schedule-durable-tasks}

**何时读**：修改 `packages/schedule` 的存储、扫描器、重复规则、投递、关停或历史事件时。

**硬性要求**

1. Host `schedule` 存储域拥有 active 与 ended 任务；每条记录保存原始 Session id 与全局唯一 task id。只有显式删除才移除任务；读/删除不得激活 Session。
2. 只有一个 Host 运行时在启动时扫描 active 任务并调度下一目标；ended 任务永不重新武装。到期 Session 通过既有 Session controller 恢复，保持 preset 组合与并发激活的单一所有者。
3. 保留 `after`、`at`、`every`、`daily`、`weekly`、`cron`。`daily` 保存显式时间与 IANA 时区，不是固定 86,400 秒。缺失的本地日期/时间跳过；重叠时每个日期只取较早一次。
4. 重复任务只贡献最近一次错过的发生，然后推进到未来目标；同一 Session 内同时到期的重复任务共享一条消息。
5. 以 producer kind `schedule` 入队，等待 Session 持久化，再 retire 或 advance。写入不是原子的：崩溃可能重复投递；不得把入队说成模型完成，也不得新增执行记录状态机。
6. 投递失败保留任务并报告；不得加入通用重试循环。关停先排空已接受工作再关闭存储。
7. 历史 `schedule/change` 事件保留原始三 kind `LegacyScheduleRecord`；加载含活动历史提醒的 Session 时告警，不隐式迁移所有历史 Session，也不从一次性提示推断 `daily` 意图。
8. 重复计算保持纯函数；生产用平台墙钟与分段定时器，测试用显式样本或恢复的 fake timers。

**完成信号**：重启后任务仍被唯一扫描器发现并按规则恢复一次；失败可见且记录仍在。
**失败处理**：内存定时器、隐式重试、隐式迁移历史事件、把投递当完成，均视为设计失败。
**证据边界**：仓库未观察到针对重复语义与时区的专用校验器；产品测试覆盖范围需在目标项目复核。

## 机制 2：原生能力以契约、矩阵与打包验证为中心 {#subtree-instructions.native-contract-first}

**何时读**：修改 `landlock-run` 的参数/退出码/诊断/限制，或 `system.node`、`flock`、平台包、发布流程时。

**硬性要求**

1. Landlock 的 argv、退出码、诊断与 fail-closed 限制定义在 `docs/cli-contract.md`；扩展其他能力时不得改动。
2. 启动器只依赖 libc，静态链接 musl；内核 UAPI 定义保留在受评审的 C 源中。
3. Node 绑定使用稳定 Node-API v8；禁止 NAN、V8 C++ API 或实验性 Node 接口。Linux glibc 与 musl 是不同二进制；macOS 使用 Mach-O。
4. `flock` 只在异步工作中尝试 `LOCK_EX | LOCK_NB`，在该 worker 捕获 errno；调用方在完成前拥有 fd，通过关闭释放锁。
5. `./landlock-run` 与 `./flock` 是独立导出；包没有根导出；导入不加载 addon；`./flock` 仅在调用时加载；Windows 保留既有 semaphore。
6. 运行期二进制选择没有环境变量覆盖；`NALR_REQUIRE_LANDLOCK` 仅测试用。没有安装期编译回退；缺失载荷探测不可用或拒绝，绝不静默授予。
7. `os`/`cpu` 与 `prebuilds.json` 是签入矩阵；CI 从矩阵派生 runner，按架构原生构建，并在多个 Node 版本测试相同 addon 字节。
8. Linux 包恰好包含 `bin/landlock-run`、`bin/glibc/system.node`、`bin/musl/system.node`；macOS 包包含 `bin/system.node`。
9. prepack 拒绝缺失、未声明、格式错误、架构错误与非 Node-API 载荷；启动器可执行位单独检查。平台 tarball 用 `npm pack` 保留可执行位；entry 用 `pnpm pack` 转换 workspace 版本。
10. packed-install 验证检查 manifest、无 registry 安装本地 tarball、字节固定载荷，并实际运行 flock 与 Landlock 探测。构建输出保持忽略；源与行为测试同批落地；保留双语 README 与独立发布。

**完成信号**：目标平台原生构建、prepack 通过、无 registry 安装后两个能力实际可用。
**失败处理**：安装期编译回退、环境变量覆盖、缺失载荷静默授予、契约漂移、错误平台载荷，均阻断发布。
**例外**：macOS 用 cc；Linux 完整构建需 musl-gcc；仓库测试只为宿主机建 addon；syscall 夹具仅测试用。

## 机制 3：Profile 集成测试按证据边界放置 {#subtree-instructions.profile-test-placement}

**何时读**：新增跨包 profile 行为测试，或决定入口、夹具、快照与 expected 输出位置时。

**硬性要求**

1. 产品场景通过 `apps/cli/src/bin.ts` 加 `--profile <name>` 或 `<name>` 简写启动。
2. 仅当公开 profile 输出无法暴露所断言内部证据时，才允许测试专用 Loader 驱动。
3. 只有当 CLI profile 组装本身是被测对象时，才在此保留 composition。
4. 包专用 Loader 配置与驱动移到该包 `tests/fixtures/`。
5. 录制会话回放放在顶层 `snapshots/`；其他 expected 输出使用 `*.expected.e2e.ts` 与 owner 本地 `expected/`。
6. 面向用户的可选 overlay 放在 `apps/cli/config/examples/`，并在 `docs/user/` 有发布指南；它们是产品资产，不是测试夹具。

**完成信号**：测试经真实入口启动，目录归属与证据类型一致。
**失败处理**：用包内夹具冒充跨包行为、把回放放进包测试、把用户 overlay 当夹具，均应在评审阻断。
**证据边界**：该规则明确没有机械强制；放置正确性只能由评审确认。

## 采用参数化

- 把 `packages/schedule`、`apps/cli`、`native/system` 替换为目标项目对应边界；保留“持久状态、单一扫描器、真实入口、契约优先、失败关闭”的约束效果。
- 目标项目若没有原生 addon 或 profile 体系，保留知识但标注不激活，并写明重新触发条件。
- 本域不宣称已运行任何定时、原生构建或 profile 测试。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `subtree-instructions.schedule-durable-tasks`：`deepseek-harness/packages/schedule/AGENTS.md:1-11@687f282e`
- `subtree-instructions.native-contract-first`：`deepseek-harness/native/system/AGENTS.md:1-28@687f282e`
- `subtree-instructions.profile-test-placement`：`deepseek-harness/apps/cli/tests/profiles/AGENTS.md:1-7@687f282e`
