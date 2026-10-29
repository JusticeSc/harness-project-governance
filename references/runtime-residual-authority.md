# runtime-residual-authority：原生启动器、Python 发布与 Desktop 打包治理迁移参考

本文件是 `runtime-residual-authority` 域的自包含操作参考。来源固定为 `deepseek-harness/` 的提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。引用格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。行号以该提交为准。

本域拥有三组彼此独立、但都属于“运行时残留权威”的规则：原生 `native/system` 的启动器/flock 契约、宿主构建与 prepack 载荷门禁；Desktop 的打包环境、强制更新策略、运行时载荷、已安装更新验证、发布诊断与 macOS 签名缓存；Python wheel 的版本身份与平台表。相邻域已经完整审计的发布流水线、供应链 manifest 规则、会话事件日志与通用凭据边界只在需要时引用，不在本文件重复。

**真实性分级。** 文中 `【源义务】` 表示固定提交中可定位的规则/脚本行为/冻结契约；`【源事实】` 表示当前实现、阈值或示例；`【迁移设计】` 表示源仓库没有等价物、由本参考补充的落地建议。所有 `verification` 证据均为 `planned`，本次没有执行任何编译、打包、签名、发布或 pytest。

## Scope

覆盖 39 个固定源路径：`native/system/docs/*`（7 个契约/说明文档）、`native/system/scripts/*`（7 个构建/发布/打包脚本）、`native/system/test/release-packing.test.js`、`apps/desktop` 的 13 个打包脚本/声明、3 个 `src` 模块、2 个 `.cmd` 启动/签名 shim、`packages/context/agent-instructions` 的 manifest 与中文 locale，以及 `python/sdk/tests` 下的发布版本测试、CoT 投影测试与 golden fixture。

不覆盖：C 源 `packages/entry/src/*.c` 的实现细节、`pack-release.mjs`/`verify-packed-install.mjs`/`assemble-prebuilds.mjs`、Desktop 的 `installed-update-*.ts`/`desktop-publish*.ts`/`desktop-release-store.ts`、`scripts/build-python-release.py` 本体。它们由相邻分区/域拥有；本文件只记录这些被调用模块所约束的外部行为。

## Mechanisms

<a id="m-runtime-residual-authority.native-launcher-cli-contract"></a>

<a id="runtime-residual-authority.native-launcher-cli-contract"></a>

### runtime-residual-authority.native-launcher-cli-contract — landlock-run CLI 契约：跨仓兼容面、125 归因与 probe 三态

**问题。** `landlock-run` 是原生二进制与所有消费者之间的跨仓兼容面。退出码 `125` 既可能来自启动器，也可能是被包装命令自身的退出码；partial-ABI 内核仍能执行部分 Landlock，仅凭内核版本判断“不可用”会错误降级；argv、报告行或 probe 语义的静默变更会破坏 entry 的 `launcherPath`/`probe`/`grantArgs`。

**触发。** 修改启动器参数、退出码、stdout/stderr 报告行或 probe 输出；新增原生能力并考虑复用该协议；排查 125 退出；在 partial 内核上判断是否运行；为新平台打包。

**源义务。**
- 调用语法只有 `landlock-run [--ro <path>]... [--rw <path>]... -- <argv>...` 与 `landlock-run --probe`；`--probe` 与 grant/命令互斥；`--` 是强制分隔符；不接受其他 flag 或环境变量输入。
- Landlock 规则集是 allowlist：未授予即拒绝；`--rw` 授予协商 ABI 能治理的全部访问；对非目录的 grant 只保留文件兼容位；命令通过 `execvp` 执行并继承启动器环境。
- 退出码 125 只表示启动器级失败，此时被包装命令未运行；exec 成功后子进程状态原样透传，包括 125。消费者必须同时看到状态 125 和 `landlock-run: ` fatal 行才可归因。
- `--probe` 在 fully/partially enforced 时退 0，否则退 125；成功只打印一行 `landlock: fully enforced` 或 `landlock: partially enforced (older ABI)`；entry 的 `probe()` 映射 `full`/`partial`，非零映射 `unusable`。
- partial 内核上的受限运行只打印一行 stderr `landlock-run: partial enforcement (older Landlock ABI)` 并继续；每个 fatal 错误只打印一行带前缀的 stderr 后退出 125。
- 启动器设置 `no_new_privs`，对自身安装规则集后 exec；规则集跨 `execve` 继承；只治理协商到的 ABI（最高 5），更新 ABI 的访问不受治理，这正是 full/partial 的差别。
- 本文件任何内容变更都要求整个包家族版本提升，并在 release notes 记录。

**执行步骤。**
1. 判断变更影响 launcher 协议、entry API 还是仅内部实现；外部可观察变更走家族版本与 release notes。
2. 在 enforcing 内核验证 probe=full；在 partial 内核验证 probe=partial、仍拒绝 allowlist 外路径、仍允许 `--ro`/`--rw` 内路径。
3. 用不可打开的 grant 根验证 125 + fatal 行；用一个自身退 125 的子命令验证不会被误归因。
4. 运行 packed-install 预演，驱动已安装 entry 的 launcherPath/probe。
5. 按 publish-order 先平台包、后 entry 包发布。

**失败模式与例外。** 把 partial 当 unusable 会不必要地降级；只看退出码会把子进程失败当启动器失败；把 allowlist 改成 denylist 会静默放行。非 Linux 没有 launcher，probe 必须是 unusable；不支持的内核返回 125/unusable，不能假装受限；browser worker 复用 JS API，但不经过该二进制。

**证据。** 来源：deepseek-harness/native/system/docs/cli-contract.md:1-34@687f282e 来源：deepseek-harness/native/system/docs/architecture.md:1-25@687f282e 来源：deepseek-harness/native/system/docs/support-matrix.md:1-14@687f282e 来源：deepseek-harness/native/system/scripts/build.ts:54-56@687f282e

<a id="m-runtime-residual-authority-native-launcher-01"></a>
- `deepseek-harness/native/system/docs/cli-contract.md:3-3@687f282e`：跨仓兼容面定义，以及“任何变更需家族版本提升 + release notes”的强制句。 <a id="m-runtime-residual-authority-native-launcher-02"></a>
- `deepseek-harness/native/system/docs/cli-contract.md:14-24@687f282e`：allowlist、非目录 grant、强制 `--`、125 的启动器级含义与“状态 125 + 前缀行”双信号归因、probe 三态。 <a id="m-runtime-residual-authority-native-launcher-03"></a>
- `deepseek-harness/native/system/docs/cli-contract.md:28-34@687f282e`：probe/partial 报告行、fatal 前缀、`no_new_privs` 与跨 exec 继承、ABI 上限。 <a id="m-runtime-residual-authority-native-launcher-04"></a>
- `deepseek-harness/native/system/docs/support-matrix.md:12-14@687f282e`：probe 是可用性 oracle，Windows 没有 launcher/POSIX addon，未发布平台组合 probe unusable/flock 拒绝，新平台需要原生 builder 与已安装产物验证。

<a id="m-runtime-residual-authority.native-flock-binding-contract"></a>

<a id="runtime-residual-authority.native-flock-binding-contract"></a>

### runtime-residual-authority.native-flock-binding-contract — POSIX flock 绑定：异步 errno、fd 所有权与独立 syscall oracle

**问题。** `flock` 是 advisory 且以 open file description（OFD）为单位。把它实现成阻塞等待、在 JS 线程执行、由绑定关闭 fd，或用固定 sleep/毫秒阈值测试，都会产生“看似加锁成功”但语义错误的行为；异步回调的 errno 归属也容易在 C 与 JS 之间丢失。

**触发。** 修改 `system.node` 的 flock 实现或 Node-API 版本；设计新的文件锁 API；排查 EAGAIN/EBADF、进程退出后残留锁；为锁行为增加测试或替换 oracle。

**源义务。**
- `tryLockExclusive(fd)` 只做一次 `flock(fd, LOCK_EX | LOCK_NB)` 尝试；不提供阻塞等待 API，也不提供共享锁 API。
- 系统调用在 JS 线程之外执行，errno 在该 worker 上记录；原生回调只接收 0 或该请求的正 errno。JS 拥有 promise 与 syscall Error 构造；setup 错误抛入 promise；原生参数校验失败必须返回 rejected promise 而不是同步 throw。
- 回调抛出的异常交给 Node 的 uncaught-exception handler；意外的 Node-API 失败终止进程；终止中的环境可以抑制 JS 完成，但清理必须等待排队/运行中的原生工作结束后再释放存储。
- 描述符属于调用方，必须在完成前保持打开；绑定不 open、不 duplicate、不 close；关闭该 OFD 的最后一个描述符才释放锁。
- flock 是 advisory：其他进程普通读写仍被允许；同一 OFD 再次获取成功且不产生第二份所有权；不同 open 的同一文件只有一个排他持有者，竞争者得到 EAGAIN/EWOULDBLOCK；共享 flock 持有者会与排他尝试冲突。
- 无关描述符关闭不影响真正持有者；子进程继承的描述符保持同一 OFD 锁；最后持有描述符关闭后，已打开的竞争者可以获取；持有进程退出或被杀后无需 stale-lock 超时即可获取。
- 无效描述符以 EBADF 和正 errno 拒绝；并发成功/失败调用各自拿到自己的 errno。
- 测试使用真实描述符与独立进程，并用独立 C oracle 直接调用操作系统；同步通过 IPC 或已 flush 的行协议，断言前等待进程退出；不得用固定 sleep 或毫秒阈值证明非阻塞。
- syscall oracle 只用于测试，永不进入发布的平台包。
- 写明限制：锁跟随宿主文件系统的 flock 语义；删除/替换路径不会把锁转移给新 inode；网络文件系统可能有不同或不支持语义；Windows 不使用该 API 而保留既有 semaphore；browser worker 使用单进程替代。

**执行步骤。**
1. 用真实 fd 完成一次非阻塞排他尝试，确认 promise resolve 为 void。
2. 用两个独立 open 验证唯一持有者与 EAGAIN/EWOULDBLOCK，并验证关闭最后一个描述符后竞争者成功。
3. 分别启动独立 C oracle 与 addon 持有者，双向验证互斥。
4. 验证 advisory 语义、无效 fd 的 EBADF、原生参数校验的 rejected promise、回调异常的 uncaught-exception 路径。
5. 用进程退出/被杀验证无 stale 超时；用子进程继承 fd 验证 OFD 语义。
6. 在 POSIX CI 上按 libc 变体构建 oracle，并确认它不在任何发布 tarball 中。

**失败模式与例外。** 在 JS 线程阻塞会冻结宿主；绑定关闭 fd 会提前释放锁；把 errno 留在 C 会丢失结构化失败；用 sleep 测试会把调度延迟误当锁语义。Windows/browser 有替代实现；测试只在 linux/darwin 构建 oracle。

**证据。** 来源：deepseek-harness/native/system/docs/flock-contract.md:1-36@687f282e 来源：deepseek-harness/native/system/docs/architecture.md:1-25@687f282e 来源：deepseek-harness/native/system/scripts/build-test-oracle.mjs:1-23@687f282e

<a id="m-runtime-residual-authority-native-flock-01"></a>
- `deepseek-harness/native/system/docs/flock-contract.md:18-28@687f282e`：advisory 语义、OFD 继承/关闭、进程退出无 stale 超时、EBADF、回调 errno 与异常、并发与终止清理。 <a id="m-runtime-residual-authority-native-flock-02"></a>
- `deepseek-harness/native/system/docs/flock-contract.md:30-30@687f282e`：IPC/进程退出同步、禁止固定 sleep/毫秒阈值、oracle 永不发布。 <a id="m-runtime-residual-authority-native-flock-03"></a>
- `deepseek-harness/native/system/docs/architecture.md:15-19@687f282e`：stable Node-API v8、异步 worker 记录 errno、JS 拥有 promise、fd 所有权、Windows koffi semaphore 与 browser 单进程替代。 <a id="m-runtime-residual-authority-native-flock-04"></a>
- `deepseek-harness/native/system/scripts/build-test-oracle.mjs:8-18@687f282e`：oracle 仅 POSIX、按 glibc/musl 选择编译器、macOS 11.0 目标与 musl 静态链接。

<a id="m-runtime-residual-authority.native-family-release-versioning"></a>

<a id="runtime-residual-authority.native-family-release-versioning"></a>

### runtime-residual-authority.native-family-release-versioning — 原生包家族单版本、bump/commit、命名与 tag/publish-order 约束

**问题。** 一个 entry 包加多个平台包必须共用一个版本。手工改 manifest 会漏掉平台包或根 lockfile；tag、dist-tag、发布顺序或命名不一致会让 entry 先于平台包出现、把预发布推到 `latest`，或让 npm 把包识别成另一个作用域。

**触发。** 发布新补丁/次要/主要版本；新增平台包或改变包名；创建/校验 `node-addon-system-v*` tag；排查 dist-tag、workspace 协议或 lockfile 漂移；首次发布新的 scoped 包名。

**源义务。**
- `native/system/package.json` 与每个 `native/system/packages/*` manifest 共用一个版本；发布前所有已发布包版本必须已经相等。
- `release:bump major|minor|patch` 要求当前版本是纯 `x.y.z`；显式目标版本接受完整 semver（含 prerelease）；非法输入失败。
- bump 必须重写根 manifest 与每个 packages/* manifest，刷新仓库根 lockfile（`pnpm install --ignore-scripts --lockfile-only`），然后运行 `verify-release`。
- `release:commit` 只 stage `package.json`、`packages/*/package.json` 与 `../../pnpm-lock.yaml`，提交信息为 `release(node-addon-system): <version>`。
- tag 由人工在合并后的 release commit 上创建，命名空间为 `node-addon-system-vX.Y.Z`；发布工作流校验 tag 与每个 launcher 包版本一致。
- 发布只使用最终 packed tarball，按 `publish-order.txt` 平台包先于 entry；entry 的公开版本不得领先于其平台包。
- prerelease 进入 `next` dist-tag，`latest` 永不指向测试构建；源 manifest 保留 `workspace:*`，由 pnpm 在 pack 时转成具体版本。
- 新 scoped 包名必须先用 `@deepseek-ai` 组织 token 经 `NPM_TOKEN` fallback 引导发布（npm 要求包先存在才能配置 trusted publisher），之后配置 trusted publisher 再按组织策略移除 fallback。
- 不得提交含 token 或 registry override 的 `.npmrc`；不得直接 `pnpm publish`（会剥掉 launcher 可执行位），必须走 `pack-release.mjs`。
- 命名固定为 `@deepseek-ai` scope + `node-addon-system` 前缀；平台包只追加 OS/CPU 信息；Linux libc 变体放在同一平台包的 `prebuilds.json` 中；二进制路径为 `bin/landlock-run`、`bin/glibc/system.node`、`bin/musl/system.node`、macOS `bin/system.node`。
- `NALR_` 前缀只保留给构建/测试编排；运行期二进制和 entry 不读环境变量；环境变量名不含 npm scope。

**执行步骤。**
1. 从仓库根运行 `pnpm --dir native/system release:bump <type|version>`，确认所有 manifest 与根 lockfile 更新且 `verify-release` 通过。
2. 打开并合并 release PR/commit。
3. 从合并后的 commit 创建 `node-addon-system-vX.Y.Z` tag 并推送。
4. 用 `publish=false` 运行发布工作流，检查全平台 payload 与 packed-install 预演。
5. 用同一 tag 以 `publish=true` 运行，确认按 publish-order 发布；预发布检查 `latest` 未移动。
6. 首次新包名先用组织 token 引导，再配置 trusted publisher 并移除 fallback。

**失败模式与例外。** 漏改 manifest 或 lockfile 会让 verify 失败；tag 不匹配阻断发布；直接 pnpm publish 会丢可执行位；平台包晚于 entry 会让公开 entry 指向不存在的可选依赖。`--current-platform-only` 只用于每架构 CI leg；本地无 workflow 上下文时保留公开 source URL；预发布只进 next。

**证据。** 来源：deepseek-harness/native/system/docs/release.md:1-63@687f282e 来源：deepseek-harness/native/system/docs/naming.md:1-30@687f282e 来源：deepseek-harness/native/system/docs/packaging.md:1-26@687f282e 来源：deepseek-harness/native/system/scripts/bump-release.mjs:1-91@687f282e 来源：deepseek-harness/native/system/scripts/commit-release.mjs:1-42@687f282e

<a id="m-runtime-residual-authority-native-version-01"></a>
- `deepseek-harness/native/system/docs/release.md:7-15@687f282e`：单版本、bump 更新全部 manifest/根 lockfile/verify-release、显式 prerelease 与 next、人工命名空间 tag 及 workflow tag 校验。 <a id="m-runtime-residual-authority-native-version-02"></a>
- `deepseek-harness/native/system/docs/release.md:51-53@687f282e`：publish-order（平台先于 entry）、OIDC/`NPM_TOKEN` fallback、新 scoped 包 bootstrap 与 trusted publisher 配置。 <a id="m-runtime-residual-authority-native-version-03"></a>
- `deepseek-harness/native/system/docs/release.md:63-63@687f282e`：禁止提交含 token 或 registry override 的 `.npmrc`。 <a id="m-runtime-residual-authority-native-version-04"></a>
- `deepseek-harness/native/system/scripts/bump-release.mjs:32-48@687f282e`、`deepseek-harness/native/system/scripts/bump-release.mjs:66-89@687f282e`：全部包 manifest、纯 x.y.z 增量的限制、完整 semver 显式版本、版本一致性检查、lockfile-only 刷新与 verify-release。 <a id="m-runtime-residual-authority-native-version-05"></a>
- `deepseek-harness/native/system/scripts/commit-release.mjs:31-42@687f282e`：精确 stage 三处路径、固定提交信息、tag 保持人工。 <a id="m-runtime-residual-authority-native-version-06"></a>
- `deepseek-harness/native/system/docs/naming.md:5-26@687f282e`：npm scope/前缀/平台后缀、固定二进制路径、NALR_ 仅测试、运行期不读环境变量。

<a id="m-runtime-residual-authority.native-pack-payload-staging"></a>

<a id="runtime-residual-authority.native-pack-payload-staging"></a>

### runtime-residual-authority.native-pack-payload-staging — 原生 prepack 载荷校验与 workflow 打包 staging 隔离

**问题。** npm `files` 使用 glob 时，匹配不到任何文件不会报错，而是打出没有 JS 的 tarball；平台包若缺少二进制或复制了别的架构，直到消费者运行才暴露。workflow 打包会改写 manifest 的 repository URL，若不隔离 staging，就会污染源 manifest、丢掉 license 或删除既有输出。

**触发。** 新增/修改 entry 或平台包的 `files`/`exports`/`prebuilds.json`；在未运行 `build:ts`/`build:native` 的 checkout 上打包；设置 `GITHUB_REPOSITORY`/`GITHUB_SERVER_URL`；排查 tarball 缺文件/错误架构/repository 链接。

**源义务。**
- 平台包定义为带 `prebuilds.json` 的 `packages/<name>`；其余带 `package.json` 的是 entry；发布顺序平台包先于 entry。
- entry 的 `prepack` 必须检查 `exports` 中每个 `./lib/...` 文件存在；不能依赖 glob 匹配失败来发现漏构建。
- 平台包 `prepack` 必须校验 `os`/`cpu` 元数据（仅 linux/darwin 与 x64/arm64），且 `prebuilds.platform` 等于 `<os>-<cpu>`。
- 二进制路径必须匹配 `bin/(<小写目录>/)?<文件名>`，不得重复；只允许 `static-musl`+`landlock-run`+Linux 的可执行文件，或 `node-api`+`flock`+`napi: 8` 的 addon。
- Linux addon 必须声明 `glibc` 或 `musl`；macOS addon 不得声明 Linux libc；声明文件必须存在且是普通文件；launcher 必须有可执行位。
- Linux 二进制必须是 little-endian ELF64，`e_machine` 与 cpu 匹配（x64=62，arm64=183），`e_type` 为 2（可执行）或 3（共享对象）；macOS 必须是 Mach-O 64-bit bundle（magic `0xfeedfacf`），cputype 匹配，filetype=8。
- addon 必须同时包含 `napi_register_module_v1` 与 `node_api_module_get_api_version_v1`；`bin/` 下不得有未声明文件。
- 平台 tarball 用 `npm pack` 保留 launcher 可执行位；entry 用 `pnpm pack` 转换 workspace 依赖版本。
- 设置 `GITHUB_REPOSITORY` 时必须复制 packages 与 prepack 脚本到临时 workspace，只用 workflow repository 与 `GITHUB_SERVER_URL`（默认 `https://github.com`）改写副本 manifest；源 manifest 保留公开 source home。
- 临时 workspace 必须携带仓库根 LICENSE；打包成功或 prepack 失败后都删除 staging；发布消费生成的 tarball 不再改写。
- 非法 `GITHUB_REPOSITORY`（非 `owner/repo`）或 `GITHUB_SERVER_URL`（带 path/非 HTTPS origin）必须在删除既有输出前失败。
- 包内 LICENSE 优先于 workspace LICENSE；成功打包后源 manifest、workspace LICENSE 与 staging 目录保持不变。

**执行步骤。**
1. 运行 `build:ts`/`build:native` 生成 lib 与平台二进制。
2. 对每个包执行 prepack，确认 exports 的 lib 文件与 prebuilds 声明的二进制都存在且格式/架构正确。
3. 在无 workflow 上下文与有 `GITHUB_REPOSITORY` 两种情况下各打一次包。
4. 检查 publish-order、tarball 内 manifest repository URL、可执行位与 LICENSE。
5. 故意删除一个二进制并重跑，确认 prepack 失败且源 manifest/staging 未变。
6. 提供非法 workflow 变量并重跑，确认在删除既有输出前失败。

**失败模式与例外。** 空 lib/ 会打出无 JS 的 entry；错误架构/缺二进制会在消费者运行时失败；manifest 改写泄漏会污染源仓库；非法变量若先删输出会毁掉上一次可发布产物。`--current-platform-only` 只用于本地预演；本地无 workflow 上下文时保留公开 URL。

**证据。** 来源：deepseek-harness/native/system/docs/packaging.md:1-26@687f282e 来源：deepseek-harness/native/system/scripts/repo.mjs:1-122@687f282e 来源：deepseek-harness/native/system/scripts/verify-entry-lib.mjs:1-28@687f282e 来源：deepseek-harness/native/system/scripts/verify-launcher-binary.mjs:1-30@687f282e 来源：deepseek-harness/native/system/test/release-packing.test.js:1-151@687f282e

<a id="m-runtime-residual-authority-native-pack-01"></a>
- `deepseek-harness/native/system/scripts/verify-entry-lib.mjs:4-7@687f282e`：glob 空匹配会静默打包无 JS tarball，因此必须在 prepack 显式拒绝。 <a id="m-runtime-residual-authority-native-pack-02"></a>
- `deepseek-harness/native/system/scripts/repo.mjs:58-76@687f282e`、`deepseek-harness/native/system/scripts/repo.mjs:88-120@687f282e`：os/cpu 与 prebuilds 一致、bin 路径/重复/kind/libc、ELF/Mach-O/NAPI 导出与未声明 bin 文件检查。 <a id="m-runtime-residual-authority-native-pack-03"></a>
- `deepseek-harness/native/system/docs/packaging.md:22-26@687f282e`：prepack 拒绝规则、npm vs pnpm pack、workflow 仓库改写与 license/staging 清理、已安装产物预演。 <a id="m-runtime-residual-authority-native-pack-04"></a>
- `deepseek-harness/native/system/test/release-packing.test.js:96-103@687f282e`、`deepseek-harness/native/system/test/release-packing.test.js:125-151@687f282e`：publish-order、workflow/local repository 重写、非法身份先失败且保留旧输出、prepack 失败清理 staging。

<a id="m-runtime-residual-authority.native-host-build-integrity"></a>

<a id="runtime-residual-authority.native-host-build-integrity"></a>

### runtime-residual-authority.native-host-build-integrity — 宿主原生构建：libc 选择、Node 头文件、原子落盘与测试 oracle 构建

**问题。** 原生 addon 不能跨平台编译；Linux 的 glibc 与 musl 是不同二进制，macOS 需要 Mach-O bundle；并发构建时读到截断文件会得到难以诊断的加载失败。若构建脚本猜测主机或静默跳过，就会产出错误平台载荷或空包。

**触发。** 新增/修改 C 源码、编译 flag 或支持平台；在本地或 CI 构建 host addon；排查 libc/头文件/格式问题；并发运行源码检查与构建；构建 flock oracle。

**源义务。**
- 构建只在 linux/darwin 上进行；其他平台仅 `--host-addon-only` 可以退 0（用于不需要原生产物的检查），否则必须失败。
- host 固定为 `process.platform-process.arch`；Linux libc 由 `process.report` 的 `glibcVersionRuntime` 判定为 glibc，否则 musl；不做交叉编译。
- Node 头文件来自运行脚本的 Node 安装的 `../include/node`；缺少 `node_api.h` 必须失败并提示使用带开发头文件的 Node。
- landlock-run 用 `musl-gcc`、`-static -s`、`-std=c11 -Os -Wall -Wextra -Werror` 构建。
- flock 用 `-DNAPI_VERSION=8`、`-std=c11 -O2 -Wall -Wextra -Werror -fPIC -fvisibility=hidden`；Linux 按声明的 libc 选择 `musl-gcc` 或 `cc` 并 `-shared`；macOS 用 `-bundle -undefined dynamic_lookup -mmacosx-version-min=11.0` 且不得声明 Linux libc。
- 不支持的 tool/kind/NAPI 组合必须报错，不能静默跳过。
- 构建先写 `.release` 下的临时目录，再 `rename` 到目标路径，确保并发读取者永远看不到截断的 addon；临时目录在 finally 中删除。
- 本 host 没有任何声明二进制时必须失败，不能产出空平台包。
- 测试 oracle 仅 POSIX：Linux 分别构建 glibc 与 musl（musl 静态），macOS 构建 Mach-O；oracle 只用于测试，永不发布。

**执行步骤。**
1. 在目标原生 runner 上确认 Node 开发头文件与 musl-gcc（Linux 完整构建）可用。
2. 运行 host 构建，检查日志中每个声明二进制的编译命令与 libc 选择。
3. 用 prepack/file/readelf/otool 校验格式与架构。
4. 并发运行一次源码检查，确认不会读到半写文件。
5. 在非 linux/darwin 上运行 `--host-addon-only`，确认退 0 且不产出二进制。
6. 构建 oracle 并确认它不在任何包目录或 tarball 中。

**失败模式与例外。** 交叉编译或错误 libc 会产生无法加载的 addon；缺头文件会失败；非原子写入会让并发检查读到截断文件；静默跳过会打出空平台包。`--host-addon-only` 允许非原生主机退 0；macOS 使用 `cc`，Linux 完整构建需要 `musl-gcc`；仓库测试只为宿主机构建。

**证据。** 来源：deepseek-harness/native/system/scripts/build.ts:1-92@687f282e 来源：deepseek-harness/native/system/scripts/build-test-oracle.mjs:1-23@687f282e 来源：deepseek-harness/native/system/docs/support-matrix.md:1-14@687f282e 来源：deepseek-harness/native/system/docs/architecture.md:1-25@687f282e

<a id="m-runtime-residual-authority-native-build-01"></a>
- `deepseek-harness/native/system/scripts/build.ts:28-35@687f282e`：非 linux/darwin 的拒绝、host 判定、process.report libc 选择与 Node 头文件路径。 <a id="m-runtime-residual-authority-native-build-02"></a>
- `deepseek-harness/native/system/scripts/build.ts:54-73@687f282e`：landlock 静态 musl flags、Node-API v8/头文件缺失、Linux libc 选择、macOS bundle/11.0 与不支持目标失败。 <a id="m-runtime-residual-authority-native-build-03"></a>
- `deepseek-harness/native/system/scripts/build.ts:83-92@687f282e`：临时文件 rename 的原子落盘、finally 清理与“本 host 无声明二进制”失败。 <a id="m-runtime-residual-authority-native-build-04"></a>
- `deepseek-harness/native/system/scripts/build-test-oracle.mjs:8-18@687f282e`：oracle 仅 POSIX、按 libc 变体构建、musl 静态与 macOS 11.0 目标。

<a id="m-runtime-residual-authority.desktop-packaging-environment"></a>

<a id="runtime-residual-authority.desktop-packaging-environment"></a>

### runtime-residual-authority.desktop-packaging-environment — Desktop 打包环境：应用标识、registry 与 macOS 签名/公证凭据解析

**问题。** appId、registry、签名与公证设置若未在准备前校验，会把配置错误推迟到硬件或公证阶段。公证解析器负责按优先级选取完整凭据，mode-aware package preflight 才负责多策略排他；二者不是同一保证。

**触发。** 首次配置或轮换 Desktop 打包凭据；新增平台 target 或 npm 镜像；打包在签名/公证阶段失败；排查 appId/Team ID/registry；迁移 CI secret 存储。

**源义务。**
- `DSH_DESKTOP_APP_ID` 必须非空且匹配反向 DNS 标识（至少一个点，段字符为字母/数字/连字符）。
- `DSH_DESKTOP_NPM_REGISTRY` 缺省为 `https://registry.npmjs.org/`；若配置则必须是 HTTPS origin，且无 userinfo、path、query、hash。
- `DSH_DESKTOP_MACOS_SIGNING_IDENTITY` 必须非空且不得带 `Developer ID Application:` 前缀。
- `DSH_DESKTOP_MACOS_TEAM_ID` 必须恰好 10 位大写字母或数字。
- 公证解析器按 Apple ID → API key → Keychain profile 顺序选择；某组任意变量存在即要求该组完整，Keychain profile 可带可选 keychain，三种策略均无有效值则失败。解析器本身不拒绝同时存在的其他完整策略；非 unsigned macOS 且未 `skipNotarization` 的 package preflight 先拒绝混用，再解析所选策略并检查引用的本地文件。
- 凭据解析必须在准备产物或访问签名硬件之前完成；不完整的策略不能留到后续步骤才发现。
- 解析后的签名身份只包含 signingIdentity 与 teamId；公证凭据不包含待提交 artifact 路径。
- 环境变量名与返回类型通过 `.d.mts` 公开，调用方不得自行猜测或复制第二套解析逻辑。

**执行步骤。**
1. 在打包环境中设置 appId、registry（可选）与一套公证凭据。
2. 调用 `resolveDesktopAppId`、`resolveNpmRegistry`、`resolveMacOSSigningEnvironment`、`resolveMacOSNotarizationEnvironment`。
3. 按平台与 `unsigned`/`prepareOnly`/`skipNotarization` 模式调用 `validateDesktopPackageEnvironment`；需要公证时由此入口拒绝策略混用，不把四个解析函数成功当成相同保证。
4. 用错误 appId、带前缀的签名身份、9 位 Team ID 与非 HTTPS registry 做负向检查。
5. 将 secret 只注入打包 job，不写入仓库或日志。

**失败模式与例外。** 被选择策略缺成员时解析失败；需要公证的 macOS package preflight 拒绝混用策略；registry/appId/Team ID 畸形在环境校验处失败。绕过 package preflight 单独调用解析器不会获得多策略排他保证。macOS 非 unsigned preparation-only 仍要求签名，并默认要求公证，`skipNotarization` 只跳过公证、不跳过签名；测试产物不得当作生产证据。解析成功不证明证书、私钥或 Apple 服务可用；本轮未执行打包。

**证据。** 来源：deepseek-harness/apps/desktop/scripts/desktop-release-environment.mjs:1-121@687f282e 来源：deepseek-harness/apps/desktop/scripts/desktop-release-environment.d.mts:1-71@687f282e 来源：deepseek-harness/apps/desktop/scripts/desktop-package-environment.mjs:1-173@687f282e 来源：deepseek-harness/apps/desktop/scripts/desktop-package-environment.d.mts:1-37@687f282e

<a id="m-runtime-residual-authority-desktop-env-01"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-release-environment.mjs:46-55@687f282e`：默认公共 registry 与配置值的 HTTPS origin/无凭据/path/query/hash 校验。 <a id="m-runtime-residual-authority-desktop-env-02"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-release-environment.mjs:63-85@687f282e`：反向 DNS appId、无 `Developer ID Application:` 前缀、10 位大写字母数字 Team ID。 <a id="m-runtime-residual-authority-desktop-env-03"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-release-environment.mjs:88-121@687f282e`：Apple ID/API key/Keychain 按顺序选取，所选策略缺成员时失败；不自行拒绝其他完整策略。`deepseek-harness/apps/desktop/scripts/desktop-package-environment.mjs:142-170@687f282e`：mode-aware 的多策略拒绝与凭据文件检查。 <a id="m-runtime-residual-authority-desktop-env-04"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-release-environment.d.mts:3-15@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-release-environment.d.mts:52-71@687f282e`：变量名、签名身份与三种公证凭据类型的公开契约。

<a id="m-runtime-residual-authority.desktop-mandatory-update-policy"></a>

<a id="runtime-residual-authority.desktop-mandatory-update-policy"></a>

### runtime-residual-authority.desktop-mandatory-update-policy — 强制更新策略运行时：部署选择、阻塞保留、来源白名单与隔离测试登录

**问题。** 强制更新判定不能由渲染层或一次网络失败决定：瞬时传输/JSON/协议错误若清掉已知阻塞，会让受限客户端继续运行；若把测试登录 cookie 放进产品会话，会污染真实账户；若直接打开服务端返回的页面链接，会跳出允许来源。

**触发。** 接入或修改 Desktop 强制更新策略；配置 test/production 策略服务或登录来源；排查“强制更新提示消失/误出现”；处理 401、超时、40005 或 no-force；新增 fallback 页面或测试登录 flow。

**源义务。**
- 策略判定独立于本地业务流量与 updater 产物；已安装身份（platform win32|darwin、arch x64|arm64、bundledDshVersion、channel nightly|latest）由构建固定，任何字段都不得由 renderer 提供；win32 只允许 x64。
- 未配置策略时不查询；配置时必须提供 origin 与非空 `allowedPageOrigins`。
- 轮询参数必须是 1000..2147483647 的整数；默认 interval 600000、timeout 15000、maxBackoff 3600000；jitter 在 [0,1]，maxBackoff 必须覆盖 interval。
- 认证模式只能是 `anonymous` 或 `feishu-test`；feishu-test 必须提供非空 `allowedAuthOrigins`；anonymous 不得配置 `allowedAuthOrigins`。
- origin 必须是 HTTPS origin 且无凭据/path/query/hash；只有显式 `allowLoopback` 且 anonymous 时才允许 `http://127.0.0.1`。
- 已知阻塞必须跨传输、JSON 与协议失败保留；只有一次新鲜的合法 no-force 成功才能清除。
- code 40005 产生 blocking，title 最多 256、detail 最多 16384、page 最多 2048 且 origin 必须在 allowedPageOrigins；no-force 必须是 HTTP ok + code 0 + biz_code 0 + biz_data null，否则视为协议错误。
- 请求只发往选定 origin 的 `/api/v0/check_client_update`，`redirect:'error'`、`cache:'no-store'`；只有 feishu-test 使用 `credentials:'include'`。
- 请求受 timeout 中止；401 + `UNAUTHENTICATED` 产生 `authentication-required`，不得清掉已知阻塞；并发 check 共享同一 pending；manual 只绕过调度不绕过合并；disposed 后拒绝新 check 且迟到响应不得发布或重排。
- 失败后按 `interval * 2^min(failures,20)` 指数退避，受 maxBackoff 与 jitter 限制；不得无界增长。
- 测试登录必须使用 UUID 命名、`cache:false` 的非持久 partition；拒绝所有权限、设备权限与下载；取消不在 allowlist 的 document 请求。
- 登录窗口只允许精确 origin + `/api/v0/check_client_update` 的 fetch，且同样 `credentials:'include'`、`redirect:'error'`、`cache:'no-store'`；导航/重定向只允许 HTTPS 且 origin 在 policy/auth allowlist；拒绝 window.open、webview、basic auth。
- 登录窗口必须 `nodeIntegration:false`、`contextIsolation:true`、`sandbox:true`、`webSecurity:true`、`webviewTag:false`；登录只能由用户动作触发，重复调用 focus 并 join 同一 promise。
- 占位页只作为首个 document，且只有请求过滤器与 did-fail-load 识别它；远程页面不能把窗口导航回本地文件。
- dispose 必须销毁窗口、等待 pending、关闭连接、清空 storage 与 auth cache；之后的请求不得再发布状态。
- 部署选择：test/production 各自使用自己的 origin 变量；config JSON 必须是不含 origin/authentication 的对象；test 选择 feishu-test，production 选择 anonymous 且禁止 auth origins。

**执行步骤。**
1. 在打包配置中选择 test 或 production，并只配置该部署的 origin。
2. 提供 allowedPageOrigins；test 额外提供 allowedAuthOrigins，production 不提供。
3. 启动策略轮询，验证首次 check、手动 check 与并发 check 共享请求。
4. 断开网络/返回非法 JSON，确认已知阻塞保留且 error=unavailable。
5. 返回合法 no-force，确认阻塞清除；返回 401 UNAUTHENTICATED，确认 error=authentication-required 且阻塞保留。
6. 触发测试登录，确认独立 session、权限拒绝、导航白名单与关闭后清理。
7. 销毁策略对象，确认迟到响应不发布。

**失败模式与例外。** 瞬时错误清阻塞会放行受限客户端；renderer 提供身份会伪造版本；测试 cookie 进入产品 session 会串号；无来源校验的 page/window.open 会跳出允许站点。未配置策略的构建不查询；打包应用的身份嵌入构建、忽略环境覆盖；loopback HTTP 只用于显式 unpackaged/test 的 anonymous 模式；测试登录允许 F12 打开独立 devtools。

**证据。** 来源：deepseek-harness/apps/desktop/scripts/desktop-policy-environment.mjs:1-44@687f282e 来源：deepseek-harness/apps/desktop/scripts/desktop-policy-environment.d.mts:1-15@687f282e 来源：deepseek-harness/apps/desktop/src/mandatory-update-policy.ts:1-235@687f282e 来源：deepseek-harness/apps/desktop/src/policy-test-auth.ts:1-159@687f282e

<a id="m-runtime-residual-authority-desktop-policy-01"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-policy-environment.mjs:18-43@687f282e`：部署选择、HTTPS origin、config JSON 禁止 origin/authentication、test/production 的 auth origins 与模式。 <a id="m-runtime-residual-authority-desktop-policy-02"></a>
- `deepseek-harness/apps/desktop/src/mandatory-update-policy.ts:26-33@687f282e`、`deepseek-harness/apps/desktop/src/mandatory-update-policy.ts:59-91@687f282e`：已知阻塞跨失败保留、配置字段/时长/jitter/认证模式约束。 <a id="m-runtime-residual-authority-desktop-policy-03"></a>
- `deepseek-harness/apps/desktop/src/mandatory-update-policy.ts:116-125@687f282e`、`deepseek-harness/apps/desktop/src/mandatory-update-policy.ts:176-227@687f282e`：40005/no-force 解析、check 合并/超时/401/退避/dispose。 <a id="m-runtime-residual-authority-desktop-policy-04"></a>
- `deepseek-harness/apps/desktop/src/policy-test-auth.ts:17-61@687f282e`、`deepseek-harness/apps/desktop/src/policy-test-auth.ts:73-110@687f282e`、`deepseek-harness/apps/desktop/src/policy-test-auth.ts:136-139@687f282e`：隔离 partition、请求/导航限制、沙箱窗口与 dispose 清理。

<a id="m-runtime-residual-authority.desktop-runtime-payload"></a>

<a id="runtime-residual-authority.desktop-runtime-payload"></a>

### runtime-residual-authority.desktop-runtime-payload — Desktop 运行时载荷：显式裁剪 allowlist、manifest 变换一致性与 ASAR 完整性

**问题。** 桌面运行时是带原生依赖的 node_modules 闭包。用排除规则或启发式裁剪会删掉运行时资源；electron-builder 在打包时会改写 package.json 字节，若先封存清单再变换 manifest，归档校验必然不一致；ASAR 链接或未声明的 unpacked 文件也会破坏不可变载荷。

**触发。** 修改运行时裁剪规则或新增依赖；electron-builder 升级导致 manifest 变换变化；新增 unpacked 资源或可执行文件；排查 ASAR 完整性/执行位失败；替换 Office/LibreOffice 引擎或 node-pty/fs-ext/koffi 版本。

**源义务。**
- 只允许裁剪明确识别的类别：包管理器元数据（`.bin`、`.pnpm`、`.modules.yaml`、`.pnpm-workspace-state-v1.json`）、source map、`.d.ts`、`.tsbuildinfo`、未选中的 LibreOffice kit 平台、fs-ext 的 Release/Debug obj 与 exp/lib/pdb/iobj/ipdb、fs-ext 构建配置、Domino test/.yarn、非目标平台的 node-pty prebuilds 与 PDB、Koffi win32_x64 导入库。
- 未识别的资产与目标平台二进制必须保留；裁剪函数只能返回上述原因或 undefined。
- 封存完整性清单前，必须用 electron-builder 同一个 `fileTransformer` 物化它将写入归档的 package.json 字节。
- 归档中的 `dsh/desktop-runtime.json` 必须与期望 descriptor 的 `JSON.stringify(expected, undefined, 2) + '\\n'` 字节完全相等。
- ASAR 中不得有 link；每个 unpacked 条目必须是普通文件且已声明；不得有未声明的 unpacked 文件。
- 每个归档文件必须记录 bytes、SHA-256 与 executable；POSIX 上只有 owner-execute 有意义，group/other-only 可执行位会导致清单不匹配。
- 文件清单按路径排序后与期望清单做完整 JSON 比较；任何多余/缺失/字节差异都失败。

**执行步骤。**
1. 准备生产 node_modules 闭包，按 allowlist 裁剪并记录保留/省略原因。
2. 调用 `prepareRuntimeManifests` 物化 electron-builder 的 manifest 变换。
3. 生成 sealed descriptor（完整文件清单 + bytes + sha256 + executable）。
4. electron-builder 打包后读取 ASAR，比较 descriptor 字节。
5. 遍历 ASAR 与 unpacked 目录，核对链接、文件类型、字节、hash 与执行位。
6. 任何差异都重新生成闭包而不是放宽校验。

**失败模式与例外。** 过宽裁剪会删掉运行时资源；manifest 变换不一致会让每次校验失败；ASAR link 或未声明 unpacked 文件会绕过清单；执行位误判会让已安装产物不可执行。Windows 不检查 executable 位；没有 unpacked 条目时 `.unpacked/dsh` 可以不存在；未识别资产一律保留。

**证据。** 来源：deepseek-harness/apps/desktop/scripts/runtime-file-policy.ts:1-48@687f282e 来源：deepseek-harness/apps/desktop/scripts/prepare-runtime-manifests.ts:1-26@687f282e 来源：deepseek-harness/apps/desktop/scripts/verify-runtime-archive.ts:1-53@687f282e

<a id="m-runtime-residual-authority-desktop-runtime-01"></a>
- `deepseek-harness/apps/desktop/scripts/runtime-file-policy.ts:4-6@687f282e`、`deepseek-harness/apps/desktop/scripts/runtime-file-policy.ts:16-46@687f282e`：未识别资产保留与逐类裁剪 allowlist。 <a id="m-runtime-residual-authority-desktop-runtime-02"></a>
- `deepseek-harness/apps/desktop/scripts/prepare-runtime-manifests.ts:6-24@687f282e`：复用 electron-builder transformer 物化最终 package.json 字节。 <a id="m-runtime-residual-authority-desktop-runtime-03"></a>
- `deepseek-harness/apps/desktop/scripts/verify-runtime-archive.ts:16-18@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-runtime-archive.ts:23-52@687f282e`：descriptor 字节相等、拒绝 link/未声明 unpacked、bytes/hash/执行位排序比较。

<a id="m-runtime-residual-authority.desktop-installed-update-verification"></a>

<a id="runtime-residual-authority.desktop-installed-update-verification"></a>

### runtime-residual-authority.desktop-installed-update-verification — 已安装更新包验证：不执行安装器、归档路径安全、输入不变与签名/时间戳

**问题。** 用“运行安装器”来验证安装包会改变机器状态，也无法证明签名字节；把不可信归档直接解压会遭遇链接/重解析点/Windows 保留名/大小写重复路径；验证过程中输入被替换会让记录与产物脱节；签名 shim 若把 PIN/容器变量留给子进程，会泄露凭据。

**触发。** 生成或复核 Windows/macOS 测试安装包；新增/修改归档格式或 7-Zip 版本；排查签名者/时间戳/内容校验失败；处理自动化签名凭据；设计不执行安装器的资格验证。

**源义务。**
- 验证过程不得运行安装器，也不得执行签名；只使用公开证书，不读取 `.env` 或 PIN；7-Zip 必须是评审过的本地可执行文件，绝不能从待验证安装包中解出。
- 版本必须属于该 run；记录初始 `passed:false`、`installerExecuted:false`、`published:false`，并列出仍需人工的检查 `installer-registration`、`startup`、`upgrade`、`data-retention`。
- 无论成功或失败，结果文件都必须以 `wx`/flush 写一次；失败保留部分记录，绝不报告 passed。
- 归档列表必须非空；拒绝 Symbolic Link/Hard Link/Reparse Point 与 `lrwx` 属性；拒绝大小写不敏感的重复 Windows 路径。
- 拒绝控制字符、`:*?\"<>|`、空段、`.`、`..`、结尾点/空格，以及 Windows 保留设备名 CON/PRN/AUX/NUL/COM1-9/LPT1-9。
- 解压到新目录；子进程环境必须剔除 KEY/SECRET/TOKEN/PASSWORD/NODE_OPTIONS/NODE_PATH。
- 验证安装器签名者、应用 exe 签名与每个重新签名的可执行文件；验证前后重新计算 installer、7-Zip、证书、manifest 的 hash 并重跑 distribution plan，任何变化都失败。
- Windows 签名使用 signtool `/fd sha256`、`/f <cer>`、`/kc [{{<pin>}}]=<container>`、eToken CSP；仅当 APPEND=1 时加 `/as`。
- 签名脚本必须在调用 signtool 前清空所有 `DSH_DESKTOP_WINDOWS_*` 签名变量，避免子进程继承 PIN/证书路径。
- 已发布安装包验证必须要求 Authenticode 状态 Valid、签名者证书存在、thumbprint 等于配置值、且存在时间戳证书。

**执行步骤。**
1. 选定一个 run、版本、公开证书与评审过的 7-Zip 路径。
2. 记录输入 hash 与 distribution plan，验证安装器签名。
3. 用 7-Zip 技术列表做路径/链接/保留名检查，再解压到新目录。
4. 验证应用 exe 与所有重新签名文件；重算输入 hash 并重跑 plan。
5. 写出 `result.json`（passed 仅在全部检查后为 true）。
6. 由操作员另行完成安装注册、启动、升级与数据保留检查。

**失败模式与例外。** 执行安装器会改变机器且无法证明签名；路径检查缺失会写出归档外/链接目标；输入被替换会让记录与产物脱节；未清理的签名变量会泄露 PIN。人工安装注册/启动/升级/数据保留不在自动脚本内；公开证书验证不证明私钥持有者；7-Zip 是外部评审工具。

**证据。** 来源：deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:1-125@687f282e 来源：deepseek-harness/apps/desktop/scripts/verify-published-windows.ps1:1-16@687f282e 来源：deepseek-harness/apps/desktop/scripts/windows-sign.cmd:1-17@687f282e

<a id="m-runtime-residual-authority-desktop-update-01"></a>
- `deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:20-28@687f282e`：链接/重解析点、大小写重复与 Windows 保留名/尾部点空格检查。 <a id="m-runtime-residual-authority-desktop-update-02"></a>
- `deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:38-51@687f282e`：公开证书/本地 7-Zip、不执行安装器、初始 passed=false 与人工检查清单。 <a id="m-runtime-residual-authority-desktop-update-03"></a>
- `deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:57-101@687f282e`：安装器/应用/运行时签名、输入重哈希与 plan 不变性检查。 <a id="m-runtime-residual-authority-desktop-update-04"></a>
- `deepseek-harness/apps/desktop/scripts/verify-published-windows.ps1:7-16@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-sign.cmd:9-16@687f282e`：Authenticode 状态/签名者 thumbprint/时间戳，以及 signtool `/fd sha256`、eToken CSP、`/as` 与变量清理。

<a id="m-runtime-residual-authority.desktop-publication-diagnostics"></a>

<a id="runtime-residual-authority.desktop-publication-diagnostics"></a>

### runtime-residual-authority.desktop-publication-diagnostics — Desktop 发布诊断与审批摘要：安全失败码、实际字节 SHA-256 与公开风险声明

**问题。** 发布失败时直接输出 SDK/HTTP 错误会泄露响应体或凭据；审批者若只看到版本号和 URL，无法确认实际要上传的字节；test release ID 是随机路径前缀，容易被误当作访问鉴权。

**触发。** 新增发布阶段或失败路径；调整审批摘要字段；排查 COS 上传/读取失败；为公开仓库发布 test/production；评审审批摘要是否可作为发布证据。

**源义务。**
- 只允许白名单错误码通过：AccessDenied、InternalError、NoSuchBucket、BadDigest、SignatureDoesNotMatch、RequestTimeout、TimeoutError、AbortError、ECONNRESET、ETIMEDOUT、ENOTFOUND、ENOSPC、EACCES、EPERM、ENOENT；其余折叠为 `operation-failed`。
- 原始 provider 响应体、凭据与堆栈不得进入诊断；只保留阶段、码、可执行建议、可选 requestId 与 httpStatus。
- AccessDenied 必须提示检查 `name/cos:<operation>` 权限与显式 deny，并说明发布已停止、重试前先对账远端状态。
- requestId 只有匹配 `^[\\w+/=.-]{1,256}$` 才保留；httpStatus 只有 100..599 的整数才保留。
- ZodError 只输出字段路径与 issue code；SyntaxError 输出 `invalid-json`；只有以 `desktop ...` 或 `Usage:` 开头的自有错误消息可原样保留。
- COS 操作错误必须保留 cause，并区分 GetObject/PutObject；写入失败可能远端结果未知。
- 审批摘要只能在包、目标与签名验证成功后渲染；必须包含环境、版本、通道、平台、test release ID（仅 test）、下载/feed URL 预览、打包 run/attempt、sourceRef@commit、runner、签名状态与 tag 计划。
- 每个文件必须显示实际将上传字节的 size 与 SHA-256，包括更新后的 YAML 内容；摘要必须包含 approval digest；不得包含凭据或本地路径。
- production 摘要必须说明批准后会重校验、上传缺失文件、跳过相同文件、冲突即停、更新 YAML 并创建 `desktop-v<version>` tag（失败则“已发布，待补 tag”）；test 摘要必须声明只发布 test、不修改 production、不创建 tag。
- 公开仓库必须在摘要中声明下载路径与 test release ID 会公开，随机前缀不能替代访问鉴权。

**执行步骤。**
1. 在 preflight 与 publish 阶段用同一失败格式化函数记录阶段与安全码。
2. 确认 AccessDenied/超时/JSON 错误不包含 provider 响应体。
3. 用验证后的 retained source 与 upload plan 计算 approval digest。
4. 逐文件读取实际内容或路径，计算 size 与 SHA-256。
5. 渲染摘要并让审批者核对环境/版本/来源/签名/文件清单。
6. 批准后重新校验摘要与远端状态，再执行上传。

**失败模式与例外。** 泄露响应体会暴露凭据/远端细节；摘要不含实际字节哈希会让审批与上传脱节；把随机前缀当鉴权会高估 test 下载的保密性。test 摘要包含 release ID，production 不包含；摘要只做展示，不执行上传或回滚；白名单之外的信息只以通用 operation-failed 呈现。

**证据。** 来源：deepseek-harness/apps/desktop/scripts/desktop-publication-failure.ts:1-57@687f282e 来源：deepseek-harness/apps/desktop/scripts/desktop-publication-summary.ts:1-71@687f282e

<a id="m-runtime-residual-authority-desktop-publish-01"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-publication-failure.ts:5-16@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publication-failure.ts:21-56@687f282e`：错误码白名单、AccessDenied 指引、requestId/status 范围、Zod/JSON 映射与原始输出省略。 <a id="m-runtime-residual-authority-desktop-publish-02"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-publication-summary.ts:16-21@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publication-summary.ts:29-35@687f282e`：验证后渲染、逐文件 size/SHA-256 与无凭据/本地路径。 <a id="m-runtime-residual-authority-desktop-publish-03"></a>
- `deepseek-harness/apps/desktop/scripts/desktop-publication-summary.ts:43-69@687f282e`：审批环境/版本/来源/签名/tag 计划、approval digest、test 摘要与公开仓库声明。

<a id="m-runtime-residual-authority.desktop-macos-signature-cache"></a>

<a id="runtime-residual-authority.desktop-macos-signature-cache"></a>

### runtime-residual-authority.desktop-macos-signature-cache — macOS 薄 Mach-O 签名缓存：证书/工具/标识/entitlement/OS 绑定

**问题。** 为了加速重复打包而缓存已签名文件时，若缓存键只看路径或 mtime，证书轮换、entitlement 变化、签名脚本升级或 OS 变化都可能复用旧签名，产出无法通过 Gatekeeper/公证的运行时。

**触发。** 启用或修改 macOS 运行时签名缓存；轮换 Developer ID 证书或更改 entitlement；升级 codesign/签名脚本/缓存实现；排查缓存命中后签名校验失败；新增需要签名的原生可执行文件。

**源义务。**
- 缓存策略必须从本次调用临时 keychain 签出的 probe 推导；证书取 `codesign --extract-certificates` 后第一个证书的 SHA-256。
- 工具指纹必须包含 `/usr/bin/codesign`、`verify-macos-signature.mjs`、`macos-cache-policy.ts`、`macos-signature-cache.ts` 的字节 SHA-256。
- 缓存键必须包含证书、identifier、期望签名身份、entitlements（base64 或 null）、工具指纹与 `os.release()`；不得包含凭据。
- 缓存 policy 的验证器只接受薄 Mach-O（magic `cefaedfe`/`cffaedfe`/`feedface`/`feedfacf`）；runtime 对 fat Mach-O 绕过缓存、每次直接签名并验证，不拒绝整个构建。
- 命中后必须执行 `codesign --verify --strict --verbose=2`，并校验证书、`Identifier=<identifier>` 行与 entitlements 深度相等；任一不符拒绝。
- 签名必须走 `signMacOSRuntimeCode(path, identifier, expected, entitlements)`，不得在缓存层自行拼 codesign 参数。
- 对外验证 API 必须覆盖完整 .app 签名、公证后的 .app（stapled ticket + spctl execute）、DMG（stapled ticket + spctl install）与 electron-builder afterSign hook。
- 存储键另含 schema、输入 SHA-256 和 mode。命中校验 record key、payload SHA-256 与签名 policy；损坏命中直接失败，不自动重签。
- 未命中在输入同目录私有候选上签名；候选验证前后以及输入摘要/mode 必须不变才可 rename 替换。缓存另以 `.pending-*` 写 code/record 后 rename 发布；竞争的 `EEXIST`/`ENOTEMPTY` 只能接受已重新验证的赢家。
- runtime 最多四个 signer，全部 settle 且无失败后才修剪：按 64 位十六进制目录中 code 的 mtime 降序累计 payload，超过 1 GiB 的当前及后续条目删除。不计 record/staging，不验证 record/签名，不是总磁盘占用上限；可驱逐活动读者并令其失败，崩溃遗留 `.pending-*` 不清理。

**执行步骤。**
1. 用临时 keychain 签出一个薄可执行 probe。
2. 从 probe 提取证书摘要并计算签名工具/脚本摘要。
3. 为每个待签文件构造 identifier 与 entitlements，生成 policy key。
4. 命中的文件先做 codesign strict + 证书/identifier/entitlements 校验。
5. 只有未命中才签名私有候选并发布缓存；损坏命中或验证失败直接拒绝，不自动重签。
6. 打包后对完整 .app、公证 ticket 与 DMG 再做外层验证。

**失败模式与例外。** 过期缓存会复用错误证书/标识/entitlement；只校验文件头会接受非薄 Mach-O；不校验工具版本会在脚本升级后继续用旧策略；缓存键含凭据会泄露 secret。entitlements 缺省时视为 `{}`；缓存按调用与 OS release 生效，不跨机器共享；外层公证/Gatekeeper 验证不在缓存层完成。

**证据。** 来源：deepseek-harness/apps/desktop/scripts/macos-cache-policy.ts:1-61@687f282e 来源：deepseek-harness/apps/desktop/scripts/verify-macos-signature.d.mts:1-89@687f282e 来源：deepseek-harness/apps/desktop/scripts/macos-signature-cache.ts:1-121@687f282e 来源：deepseek-harness/apps/desktop/scripts/macos-signature-cache-directory.mjs:1-38@687f282e 来源：deepseek-harness/apps/desktop/scripts/macos-signature-cache-directory.d.mts:1-15@687f282e 来源：deepseek-harness/apps/desktop/scripts/macos-runtime.ts:1-85@687f282e 来源：deepseek-harness/apps/desktop/tests/macos-signature-cache.spec.ts:1-139@687f282e 来源：deepseek-harness/apps/desktop/tests/macos-signature-cache-directory.spec.ts:1-63@687f282e

<a id="m-runtime-residual-authority-desktop-macos-01"></a>
- `deepseek-harness/apps/desktop/scripts/macos-cache-policy.ts:36-45@687f282e`：probe 证书摘要、四个签名工具/脚本摘要与包含证书/identifier/identity/entitlements/tools/OS 的 policy key。 <a id="m-runtime-residual-authority-desktop-macos-02"></a>
- `deepseek-harness/apps/desktop/scripts/macos-cache-policy.ts:47-57@687f282e`：仅薄 Mach-O、codesign strict、证书/Identifier/entitlements 全等校验。 <a id="m-runtime-residual-authority-desktop-macos-03"></a>
- `deepseek-harness/apps/desktop/scripts/verify-macos-signature.d.mts:4-30@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-macos-signature.d.mts:50-89@687f282e`：display/runtime 签名断言、逐文件 codesign、完整 app/公证 app/DMG 与 afterSign 验证 API。

<a id="m-runtime-residual-authority.python-release-version-identity"></a>

<a id="runtime-residual-authority.python-release-version-identity"></a>

### runtime-residual-authority.python-release-version-identity — Python 发布身份与平台表：根版本单一来源、PEP 440 拼写与 wheel 自检

**问题。** Python wheel 的版本/标签/平台若与仓库版本或发布 tag 漂移，会在 PyPI 上产生无法安装或错误平台的产物；构建后端会把 prerelease 规范化成另一种拼写，若校验仍用仓库版本就会误判。测试若读取嵌套库的 dist-info 也会把错误 wheel 当成通过。

**触发。** 修改 Python SDK/runtime 版本或发布 tag；新增/调整 wheel 平台或可执行文件名；升级构建后端（hatchling）或 wheel 校验逻辑；排查 PyPI wheel 版本/标签/大小失败。

**源义务。**
- Python 发布版本必须从根 `package.json` 的 `version` 读取，并与 `scripts/build-python-release.py` 的 `repository_version()` 一致；不得在 Python 侧维护第二份版本。
- 非发布构建允许没有 release tag；提供 tag 时必须等于 `python-v<repository-version>`。
- 根版本必须是 `X.Y.Z` 或 `X.Y.Z-<prerelease>`；`v1.2` 等格式必须拒绝；prerelease 可以被接受。
- wheel 身份使用 PEP 440 拼写：`1.2.3-rc.1`→`1.2.3rc1`、`-alpha.2`→`1.2.3a2`、`-beta.10`→`1.2.3b10`；无法拼写的 `-nightly` 必须失败。
- 平台表每一项必须同时有 tag 与 executable；缺一即拒绝。
- macOS arm64/x64 使用 `macosx_14_0_arm64`/`macosx_14_0_x86_64`，不得声明不支持的 Node 平台；Windows 只允许 `win-x64`/`win_amd64`，不得存在其他 `win-*`。
- wheel 校验必须读取顶层 distribution 的 `*.dist-info/WHEEL` 与 `METADATA`，不能读取嵌套库的 dist-info；SDK wheel 必须是 `py3-none-any` 且只精确 pin 同版本 runtime。
- wheel 超过 100000000 字节必须失败；SDK staging 必须保留 distribution 模块与单一 runtime pin、LICENSE；runtime staging 必须带 LICENSE + THIRD_PARTY_NOTICES，并复制平台 executable/ripgrep/spawn-helper/office 资源。
- 复制包时必须先剔除生成的 carrier（runtime 目录、node 包、win exe），只保留 `__init__.py` 与 `_resources.py`；`stage_runtime` 必须拒绝非规范 executable 名。

**执行步骤。**
1. 修改根 `package.json` 版本（或由 bump 流程更新）。
2. 确认 `repository_version()` 与根版本一致，release tag 仅在发布构建提供。
3. 运行 pytest 的发布版本测试，覆盖 tag/平台/PEP 440/staging 负向用例。
4. 构建 wheel 后由 `verify_wheel` 检查顶层 dist-info、tag、大小、license、runtime pin。
5. 在 PyPI 发布前确认 runtime 与 SDK 的版本/平台表一致。

**失败模式与例外。** 版本/tag 漂移会产生错误文件名或发布拒绝；PEP 440 拼写错误会让 wheel 名校验失败；嵌套 dist-info 会让错误 wheel 通过；非规范 executable 名会破坏 runtime 查找。非发布构建可以没有 tag；测试用临时 zip/pyproject fixture，不构建真实 wheel；平台表只列声明支持的平台。

**证据。** 来源：deepseek-harness/python/sdk/tests/test_release_version.py:1-199@687f282e

<a id="m-runtime-residual-authority-python-version-01"></a>
- `deepseek-harness/python/sdk/tests/test_release_version.py:19-26@687f282e`：根 package.json 版本与 `repository_version()` 相等、非发布构建可无 tag。 <a id="m-runtime-residual-authority-python-version-02"></a>
- `deepseek-harness/python/sdk/tests/test_release_version.py:41-70@687f282e`：tag 必须等于 `python-v<version>`、prerelease 接受、malformed 拒绝、PEP 440 拼写与不可拼写 prerelease 失败。 <a id="m-runtime-residual-authority-python-version-03"></a>
- `deepseek-harness/python/sdk/tests/test_release_version.py:73-93@687f282e`：macOS 14.0 平台 tag、Windows 仅 x64、平台表必须同时有 tag 与 executable。 <a id="m-runtime-residual-authority-python-version-04"></a>
- `deepseek-harness/python/sdk/tests/test_release_version.py:96-121@687f282e`、`deepseek-harness/python/sdk/tests/test_release_version.py:181-199@687f282e`：顶层 distribution metadata、SDK/runtime staging 分离、生成 carrier 剔除、规范 executable 名与 100 MB 上限。

<a id="m-runtime-residual-authority.desktop-windows-packaging-runner"></a>
### runtime-residual-authority.desktop-windows-packaging-runner — Windows 机器目录与有界 runner 任务

**触发与归属。** 目标采用 Windows 自托管打包 runner 时启用；机器目录、runner 注册、Task Scheduler 任务和签名失败状态不能混成一套可随重装清空的状态。没有该发布面是未触发；已经需要却缺主机权限则是阻塞，不是降为建议。

**源侧约束。** `setup` 要求固定本地盘绝对根、既存祖先无 reparse point；列举的 packaging 子目录与 cache 子目录必须真实、由当前 SID 所有，Allow ACE 仅限当前 SID、SYSTEM、Administrators。新目录建受保护 DACL，既存目录只验证这些条件；不声称根目录自身或所有祖先都经过 ACL 检查。`-CheckOnly` 不创建目录或模板，普通 setup 仅补缺失 `.env.example`。

启动器清空 OS 白名单以外的继承环境，PATH 重建为 runner 的 `pwsh-7.6.6` 加机器/用户 PATH；固定盘绝对 `ConfigRoot`、工具行为和 Visual C++ 预检后才可启动。启动器 `-CheckOnly` 不检查第二个 listener、注册或凭据内容；真正启动发现任意 `Runner.Listener` 则拒绝，随后运行 `run.cmd`。任务管理器另检查 RunnerRoot 的本地盘绝对路径、无 reparse 祖先与 `.runner` 叶文件，文件存在不证明 GitHub 注册有效。

任务名绑定大写规范化根的 SHA-256 前 16 位，Description 精确绑定根与当前 SID，不接管外属任务。install 只在未安装时运行，重写 `dsh-task` 脚本、配置及计数器；注册为当前用户 Interactive/Limited、初始 Disabled、IgnoreNew、无执行时长上限，登录触发加默认一分钟重复触发。RestartMinutes 范围 1..1440，RestartCount 范围 1..999；后者是额外重启数，总实际启动上限是 `1 + RestartCount`。launcher 持久记录 PID/StartTime ticks、计数和日志；配置、计数异常或预算耗尽使任务禁用。子启动器退出无论成功失败都记任务失败，但重启来自重复触发，不是退出码重试设置。

**维护与恢复。** Running 时再次 start 只输出已运行、保留计数并正常返回；否则显式 start 才清零预算并启用。必须读日志确认真实 Connected/Listening。维护前先暂停远端派单；stop 拒绝活动或位置不可读的 worker，禁用自动启动后以 PID+StartTime 确认 launcher，再终止其树。后代快照只用于等待，不是按子 PID 杀进程的授权；每个捕获进程和最终任务状态分别可等待 30 秒，不是全 stop 总计 30 秒。无法确认身份/静止就保持禁用并人工调查。uninstall 只接受 Disabled，保留注册、配置、日志和外部签名状态。

**迁移与验证边界。** 参数化产品前缀、根、工具版本和预算，保留干净环境、任务归属、持久预算与身份绑定停止。当前账户可修改配置/脚本，不能声称隔离该账户或管理员；本地 worker 检查也不能预留 GitHub 的下一次派单。本次仅静态读源码，未注册任务、改 ACL、启动 runner 或执行真实停止。

来源：deepseek-harness/apps/desktop/scripts/setup-windows-packaging.ps1:1-49@687f282e 来源：deepseek-harness/apps/desktop/scripts/start-windows-packaging-runner.ps1:1-38@687f282e 来源：deepseek-harness/apps/desktop/scripts/windows-runner-task.ps1:1-122@687f282e 来源：deepseek-harness/apps/desktop/scripts/run-windows-runner-task.ps1:1-31@687f282e

<a id="m-runtime-residual-authority.desktop-windows-signing-preflight"></a>
### runtime-residual-authority.desktop-windows-signing-preflight — 构建前一次签名探针

**触发与顺序。** 只有非 unsigned、非 prepare-only 的 Windows 签名构建运行此探针；调用方在正式构建前取得 Windows signing stage 锁，准备缓存目录，再用监督器启动 preflight，子进程工作预算 60 秒。该预算不包括取锁与终止/静止清理；preflight main 本身没有 stage 锁。

**源侧约束。** CLI 要求 win32 和有效 run 环境；函数要求 `run.json` 存在，发现 `fatal.json` 或用户签名 `attempt.json` 即拒绝，无自动恢复。固定 .NET Framework x64 `csc.exe` 必须为常规文件，公钥证书当前有效；记录编译器、SignTool、证书 SHA-256。新私有目录中以 `wx`/flush 写固定 C# 源，编译子进程剥除签名环境及 `NODE_OPTIONS`/`NODE_PATH`，自身 30 秒 timeout。探针绝不执行，签前必须 `NotSigned`，只调用一次生产 signer，固定 SHA-256、非嵌套；时间戳重试不能再次硬件签名。

签后同时要求 `Valid`、有效 timestamp 标志及匹配配置证书的 thumbprint，才记录签后 SHA-256 与 `probeExecuted:false` 并允许构建。仅 Valid 不够。main 在有效 run 的 try 内失败会调用 `failPackagingRun(..., 'windows-signing-preflight-failed')` 并抛出；导出函数直接调用只 reject，不自写 fatal，非 win32/缺 run 的入口拒绝也不在该 catch 内。迁移时必须保留调用方和函数各自责任，不能把所有入口写成自动持久化。

**恢复与信任。** 保留失败证据，经授权修复配置、设备和既有 interlock，在新 run 再做一次探针；不自动删 fatal 或循环硬件签名。工具摘要不代替供应链信任，成功不构成新 PIN/设备授权，也不证明完整构建、安装、启动或后续设备健康。当前只有原始源码和 mock spec 阅读，没有编译、真实 Authenticode、时间戳或硬件验证。

来源：deepseek-harness/apps/desktop/scripts/windows-signing-preflight.ts:1-98@687f282e 来源：deepseek-harness/apps/desktop/tests/windows-signing-preflight.spec.ts:1-119@687f282e 来源：deepseek-harness/apps/desktop/scripts/package-target.ts:447-474@687f282e

## References

- `deepseek-harness/native/system/docs/cli-contract.md`（1-34）：launcher 调用语法、allowlist、125 归因、probe 三态与继承语义。
- `deepseek-harness/native/system/docs/flock-contract.md`（1-36）：flock 行为表、OFD/fd 所有权、独立 oracle 与测试同步。
- `deepseek-harness/native/system/docs/architecture.md`（1-25）：包家族、懒加载、Node-API v8、Windows/browser 替代与构建/发布概览。
- `deepseek-harness/native/system/docs/naming.md`（1-30）：scope/前缀/平台后缀、二进制路径、NALR_ 与无运行期环境变量。
- `deepseek-harness/native/system/docs/packaging.md`（1-26）：载荷、prepack、npm/pnpm pack、workflow 仓库改写与已安装产物预演。
- `deepseek-harness/native/system/docs/release.md`（1-63）：单版本、bump/commit、tag、publish-order、trusted publishing 与 .npmrc 禁令。
- `deepseek-harness/native/system/docs/support-matrix.md`（1-14）：平台矩阵、Node 版本、macOS 11.0、libc 与 probe oracle。
- `deepseek-harness/native/system/scripts/build.ts`（1-92）：宿主构建、libc/头文件、编译 flags、原子落盘与失败条件。
- `deepseek-harness/native/system/scripts/build-test-oracle.mjs`（1-23）：POSIX/libc oracle 构建。
- `deepseek-harness/native/system/scripts/bump-release.mjs`（1-91）、`commit-release.mjs`（1-42）：版本一致性、manifest/lockfile 更新、精确 commit 与人工 tag。
- `deepseek-harness/native/system/scripts/repo.mjs`（1-122）、`verify-entry-lib.mjs`（1-28）、`verify-launcher-binary.mjs`（1-30）：prepack 载荷与 lib/ 存在性门禁。
- `deepseek-harness/native/system/test/release-packing.test.js`（1-151）：workflow/local 打包、manifest 还原、license 优先与失败清理。
- `deepseek-harness/apps/desktop/scripts/desktop-release-environment.mjs`（1-121）、`.d.mts`（1-71）：appId、registry、签名身份、Team ID 与公证凭据策略。
- `deepseek-harness/apps/desktop/scripts/desktop-policy-environment.mjs`（1-44）、`.d.mts`（1-15）、`apps/desktop/src/mandatory-update-policy.ts`（1-235）、`apps/desktop/src/policy-test-auth.ts`（1-159）：部署选择、阻塞保留、来源白名单与隔离测试登录。
- `deepseek-harness/apps/desktop/scripts/runtime-file-policy.ts`（1-48）、`prepare-runtime-manifests.ts`（1-26）、`verify-runtime-archive.ts`（1-53）：运行时裁剪 allowlist、manifest 变换一致性与 ASAR 完整性。
- `deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts`（1-125）、`verify-published-windows.ps1`（1-16）、`windows-sign.cmd`（1-17）：不执行安装器、归档路径安全、输入不变与签名/时间戳。
- `deepseek-harness/apps/desktop/scripts/desktop-publication-failure.ts`（1-57）、`desktop-publication-summary.ts`（1-71）：安全失败码与审批摘要。
- `deepseek-harness/apps/desktop/scripts/macos-cache-policy.ts`（1-61）、`verify-macos-signature.d.mts`（1-89）：薄 Mach-O 签名缓存键与验证 API。
- `deepseek-harness/apps/desktop/src/release.ts`（1-35）：DesktopRelease descriptor 校验（已由 release 域拥有）。
- `deepseek-harness/packages/context/agent-instructions/package.json`（1-65）：发布 manifest 实例（已由 supply-chain 域拥有）。
- `deepseek-harness/python/sdk/tests/test_release_version.py`（1-199）：Python 版本身份、PEP 440、平台表与 wheel/staging 自检。
- `deepseek-harness/python/sdk/tests/test_cot_translation_projection.py`（1-75）、`tests/expected/cot-translation-projection.json`（1-106）：原始审计事件保留（已由 package-contracts-2 域拥有）。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `runtime-residual-authority.native-launcher-cli-contract`：`deepseek-harness/native/system/docs/cli-contract.md:1-34@687f282e`、`deepseek-harness/native/system/docs/architecture.md:1-25@687f282e`、`deepseek-harness/native/system/docs/support-matrix.md:1-14@687f282e`
- `runtime-residual-authority.native-flock-binding-contract`：`deepseek-harness/native/system/docs/flock-contract.md:1-36@687f282e`、`deepseek-harness/native/system/scripts/build-test-oracle.mjs:1-23@687f282e`
- `runtime-residual-authority.native-family-release-versioning`：`deepseek-harness/native/system/docs/release.md:1-63@687f282e`、`deepseek-harness/native/system/docs/naming.md:1-30@687f282e`、`deepseek-harness/native/system/docs/packaging.md:1-26@687f282e`、`deepseek-harness/native/system/scripts/bump-release.mjs:1-91@687f282e`、`deepseek-harness/native/system/scripts/commit-release.mjs:1-42@687f282e`
- `runtime-residual-authority.native-pack-payload-staging`：`deepseek-harness/native/system/scripts/repo.mjs:1-122@687f282e`、`deepseek-harness/native/system/scripts/verify-entry-lib.mjs:1-28@687f282e`、`deepseek-harness/native/system/scripts/verify-launcher-binary.mjs:1-30@687f282e`、`deepseek-harness/native/system/test/release-packing.test.js:1-151@687f282e`
- `runtime-residual-authority.native-host-build-integrity`：`deepseek-harness/native/system/scripts/build.ts:1-92@687f282e`
- `runtime-residual-authority.desktop-packaging-environment`：`deepseek-harness/apps/desktop/scripts/desktop-release-environment.mjs:1-121@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-release-environment.d.mts:1-71@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-package-environment.mjs:1-173@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-package-environment.d.mts:1-37@687f282e`、`deepseek-harness/apps/desktop/scripts/setup-macos-packaging.mjs:1-34@687f282e`、`deepseek-harness/apps/desktop/scripts/package-target.ts:236-243@687f282e`
- `runtime-residual-authority.desktop-mandatory-update-policy`：`deepseek-harness/apps/desktop/scripts/desktop-policy-environment.mjs:1-44@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-policy-environment.d.mts:1-15@687f282e`、`deepseek-harness/apps/desktop/src/mandatory-update-policy.ts:1-235@687f282e`、`deepseek-harness/apps/desktop/src/policy-test-auth.ts:1-159@687f282e`
- `runtime-residual-authority.desktop-runtime-payload`：`deepseek-harness/apps/desktop/scripts/runtime-file-policy.ts:1-48@687f282e`、`deepseek-harness/apps/desktop/scripts/prepare-runtime-manifests.ts:1-26@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-runtime-archive.ts:1-53@687f282e`
- `runtime-residual-authority.desktop-installed-update-verification`：`deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:1-125@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-published-windows.ps1:1-16@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-sign.cmd:1-17@687f282e`
- `runtime-residual-authority.desktop-publication-diagnostics`：`deepseek-harness/apps/desktop/scripts/desktop-publication-failure.ts:1-57@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publication-summary.ts:1-71@687f282e`
- `runtime-residual-authority.desktop-macos-signature-cache`：`deepseek-harness/apps/desktop/scripts/macos-cache-policy.ts:1-61@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-macos-signature.d.mts:1-89@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-signature-cache.ts:1-121@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-signature-cache-directory.mjs:1-38@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-signature-cache-directory.d.mts:1-15@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-runtime.ts:1-85@687f282e`、`deepseek-harness/apps/desktop/tests/macos-signature-cache.spec.ts:1-139@687f282e`、`deepseek-harness/apps/desktop/tests/macos-signature-cache-directory.spec.ts:1-63@687f282e`
- `runtime-residual-authority.python-release-version-identity`：`deepseek-harness/python/sdk/tests/test_release_version.py:1-199@687f282e`
- `runtime-residual-authority.desktop-windows-packaging-runner`：`deepseek-harness/apps/desktop/scripts/setup-windows-packaging.ps1:1-49@687f282e`、`deepseek-harness/apps/desktop/scripts/start-windows-packaging-runner.ps1:1-38@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-runner-task.ps1:1-122@687f282e`、`deepseek-harness/apps/desktop/scripts/run-windows-runner-task.ps1:1-31@687f282e`
- `runtime-residual-authority.desktop-windows-signing-preflight`：`deepseek-harness/apps/desktop/scripts/windows-signing-preflight.ts:1-98@687f282e`、`deepseek-harness/apps/desktop/tests/windows-signing-preflight.spec.ts:1-119@687f282e`、`deepseek-harness/apps/desktop/scripts/package-target.ts:447-474@687f282e`
