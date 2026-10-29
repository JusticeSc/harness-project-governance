# 项目治理机制参考：`rationale-feature-3`（feature 手记域）

> 来源：`deepseek-harness/` 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，`.agents/notes/**/feature/` 的 89 个英文 Note 及其 89 个中文对照（另含 `.i18n.yaml` 一致性记录）。引用统一写作 `deepseek-harness/<path>:<start>-<end>@687f282e`。 证据等级：本参考来自逐份 Note 正文的独立阅读与归类，不是运行时验证。每个机制在 knowledge JSON 中标记 `verification.evidence: "planned"`；Note 自带的 Testing/Verification 段落是源作者的声明，不是本参考执行过的测试。

## 0. 范围、方法与使用方式

本分区覆盖 89 个英文 Note，生命周期分布为：archived 77、implemented 11、proposed 1。英文正文与中文正文均已打开阅读；中文对照用于语义校验，未据中文新增机制；sidecar 声明两种语言同等权威，若出现差异应按 verify-translation-pairing 流程修复配对。为处理超长行，部分英文 Note 使用 raw 行读取，具体行号记录在 coverage 的 notes 字段。

阅读时区分三类陈述：

1. **当前义务**：`Decision`、`Safety contract`、`Ownership` 等段落中的规则，构成本参考的机制。
2. **历史/备选**：`Alternatives considered`、`Proposed`、延迟项与其拒绝理由；保留为迁移时的反例，不冒充现行要求。
3. **产品专属**：纯视觉、文案、平台交互或一次性实现细节；不提炼为跨项目治理机制，仅在 coverage 中给出 product-only 处置。

使用顺序：先在 knowledge JSON 中找到机制 ID 与触发条件，再读本参考的“前置条件—步骤—必须—完成信号—失败”，最后按 `sources` 回到原文核对。机制之间是组合关系，不是清单打勾；例如并发机制离开“有序提交”和“失败关闭分类”就不安全。

强度约定：**必须**对应源 Note 的硬约束或安全不变量；**应当**对应有明确理由的默认做法；**可以**对应源 Note 允许的部署选择。源 Note 未规定的实现细节不被补写。

来源义务与迁移设计的区分：`必须做到` 是源 Note 的当前约束/不变量；`执行步骤`、`责任者` 与 `完成信号` 中的平台原语选择、封装、测试与发布动作是迁移建议，除非该条明确引用原文。`失败、例外与证据限制` 中的验证同样属于计划，不是已执行的保证。

---

## 一、并发、持久化与发布

<a id="rationale-feature-3-kernel-write-lease"></a>
### `rationale-feature-3-kernel-write-lease` — 内核仲裁的跨进程写租约

**问题。** 同一会话日志可能被 CLI 与宿主等多个进程写打开；TTL/改名声明协议仍留下有界双写窗口，会撕裂压缩帧并破坏序号连续性。

**前置条件。** 同一持久日志可能被多个进程写打开，且目标平台提供可用的内核锁原语。

**责任者。** 持久化后端所有者、进程 supervisor、测试者。

**执行步骤。**
1. 选择平台原语（POSIX flock / Windows 命名信号量）。
2. 写句柄打开时取锁，并校验锁定 inode 仍是路径所指文件。
3. 争用返回类型化 already-owned 错误。
4. 句柄关闭或进程死亡时由内核释放。

**必须做到。**
- 把所有权仲裁放在所有写进程之外：用 OS 内核锁，并在写句柄整个生命周期内持有。
- 争用映射为类型化的 already-owned 错误；不得等待、重试或抢占。
- 依赖内核在描述符/句柄关闭（含进程死亡）时释放；不加入过期、续租或接管记录。
- POSIX 下取得锁后校验被锁 inode 仍是锁路径所指文件；不是则重试。
- 打开已有可写工件时取锁，或在新建工件首次落盘前取锁；取锁句柄即使落盘失败也保持锁。
- 释放不删除锁文件，保持 inode 稳定。
- 写明平台限制（例如部分网络文件系统上的 advisory flock）。

**完成信号。** 两个真实进程争用同一日志：只有一个取得写句柄，另一个得到类型化错误；杀死持有者后后继立即可取。

**失败、例外与证据限制。** 持锁者存活但卡死时该会话被阻塞，直到其退出；源实现拒绝窃取所有权，因为复活的写者仍会撕裂日志。浏览器 worker 部署仅在进程内已排除全部写者时打桩。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-id-reservation`、`rationale-feature-3-staged-atomic-publish`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-08-31-cross-process-session-write-lease.md:1-29@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-31-cross-process-session-write-lease.md:1-29@687f282e

<a id="rationale-feature-3-ordered-commit-concurrency"></a>
### `rationale-feature-3-ordered-commit-concurrency` — 按模型顺序提交的受限并发

**问题。** 独立兄弟调用并行可降延迟，但朴素并发会让结果、middleware 与取消顺序相关，并让未证明安全的工具参与竞争。

**前置条件。** 存在会并发执行兄弟调用的循环，且每个工具有可判定的 unary 安全分类。

**责任者。** 调度器所有者、工具作者、middleware 所有者。

**执行步骤。**
1. 为每次调用分类，未知/非法/抛错按独占。
2. 把连续并行调用分组，独占调用作屏障。
3. 用有界池执行，仅 dispatch 与操作体重叠。
4. 按模型顺序游标提交结果与上下文。
5. 中止时排空已启动调用并合成 aborted 对。

**必须做到。**
- 并发是宿主调度问题，不进入模型可见的工具元数据。
- 每次调用要求显式、同步、纯函数的 unary 分类器；缺失、非法、抛错或非 true 一律独占。
- true 是“可与任何其他 true 调用重叠”的承诺；unary 无法表达的资源/关系冲突继续独占。
- 只允许 dispatch 与操作体重叠；pre/post middleware 与提交保持模型顺序。
- 无论完成顺序，结果与上下文经单一游标按模型顺序提交。
- 池有上限；独占调用是屏障，池大小为 1 时即串行。
- 中止时停止补充、排空已启动调用、按序提交其真实结果，为未派发调用合成 aborted 对。
- 声明保持保守；未证明输入敏感安全的工具保持独占。
- 调度器失败是终态错误，不转成普通结果；等所有在途 dispatch 收敛后报告未知结果。

**完成信号。** 并行兄弟确实重叠；结果与 post 上下文按模型顺序到达；独占调用排空当前池并形成屏障。

**失败、例外与证据限制。** 未知工具、非法参数、分类器抛错或 false 都按独占处理；调度器失败停止新派发并在静默后重抛首个错误。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-fail-closed-classification`、`rationale-feature-3-single-owner-contract`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-07-10-parallel-tool-call-execution.md:1-107@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-10-parallel-tool-call-execution.md:1-107@687f282e

<a id="rationale-feature-3-id-reservation"></a>
### `rationale-feature-3-id-reservation` — 异步创建前预留身份；恢复只收养

**问题。** 创建请求可能超时或被重试；延迟的创建可能复活已关闭资源；错误 id 的 resume 可能静默打开空历史而调用者以为在续接。

**前置条件。** 创建/恢复是异步且可重试的，宿主能持久化 pending/closed 状态。

**责任者。** 客户端调用者、宿主资源所有者、supervisor。

**执行步骤。**
1. 调用者在请求前预留 id。
2. await 前写入 closed 墓碑或关闭意图。
3. create 按 owner+id 去重。
4. adopt 校验存在性与 cwd/preset。
5. 启动时重试未完成关闭。

**必须做到。**
- 调用者在创建前预留身份；同一存活 id 重复 create 不得分配第二个资源。
- 在等待分配前记录 closed id，使延迟 create 无法复活；持久化未完成的关闭意图并在启动时重试。
- 只有显式 close 才清理，unmount/teardown 信号不算。
- resume 采用 adopt-only：对象不存在或记录的上下文（cwd/preset）冲突时失败；绝不为外部 id 创建。
- 在首个机器可读事件中报告铸出的身份，便于 supervisor 持久化并回传。

**完成信号。** 同 owner/id 的两次 create 只分配一个资源；关闭请求先于延迟 create 响应时资源不复活。

**失败、例外与证据限制。** 未知 id 或 cwd/preset 不匹配的 adopt 以诊断失败且不创建；关闭重试在 not-found 时清除意图。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-committed-state-only`、`rationale-feature-3-bounded-remote-recovery`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-09-web-sidebar-terminal.md:1-55@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-09-headless-machine-readable-run-surface.md:1-101@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-09-web-sidebar-terminal.md:1-55@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-09-headless-machine-readable-run-surface.md:1-101@687f282e

<a id="rationale-feature-3-staged-atomic-publish"></a>
### `rationale-feature-3-staged-atomic-publish` — 先完整暂存，再原子发布并保留旧版

**问题。** 就地安装或替换受管运行时可能留下半写工件；替换中途崩溃会毁掉唯一可用副本。

**前置条件。** 有独立暂存目录、原子替换能力和可执行的最终烟测。

**责任者。** 安装器/更新器、发布构建者、烟测所有者。

**执行步骤。**
1. 构建完整暂存副本。
2. 校验摘要/签名。
3. 原子替换并保留旧目录。
4. 清理临时文件后烟测最终路径。

**必须做到。**
- 在暂存位置构建并校验完整 payload。
- 暂存成功后才替换发布；替换成功前保留旧目录。
- 仅在 manifest 身份匹配时复用已安装 payload；复用不得要求重装。
- 临时文件移除后对最终 payload 执行烟测；签名有效不等于可运行。
- 开发启动器必须等待准备完成，避免未完成构建以成功退出。

**完成信号。** 暂存并通过校验后才替换；最终路径烟测通过；模拟失败时旧目录仍可用。

**失败、例外与证据限制。** 暂存/校验失败不发布，旧 payload 保留；替换失败保留旧目录。全新安装没有旧目录，但仍不得发布半成品。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-artifact-identity-digest`、`rationale-feature-3-bounded-remote-recovery`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-14-desktop-primary-runtime.md:1-43@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-desktop-primary-runtime.md:1-43@687f282e

<a id="rationale-feature-3-artifact-identity-digest"></a>
### `rationale-feature-3-artifact-identity-digest` — 工件身份来自受锁输入摘要，而非目录名

**问题。** 版本字符串或目录名不能证明装配了哪些字节；同一标签的两次构建可能不同，静默的装配变更会伪装成同一工件。

**前置条件。** 构建输入可规范化，安装器能在复用前读取 manifest。

**责任者。** 发布构建者、安装器、缓存读取者。

**执行步骤。**
1. 规范化受锁输入集。
2. 计算所选目标+装配格式的摘要。
3. 把摘要写入 manifest。
4. 复用前比较身份；装配变更则升格式版本。

**必须做到。**
- 在 manifest（如 runtime.json）记录应用版本、顶层工具版本、发行映射与受锁输入的摘要，而不是放在目录名中。
- 摘要覆盖所选目标的归档、共享输入、发行版本、工具版本与装配格式；无关目标不得使其失效。
- 摘要包含语义相关的顺序、排除无关顺序，并明确写出该规则。
- 任何改变字节但不改变受锁输入的装配/extraction 变更都要求显式格式版本递增。
- 拒绝重复包前先规范化包名。

**完成信号。** 同一受锁输入的两次构建身份相同；更换归档会改变身份；无关目标不使其失效；共享 wheel、发行版本或 pnpm 版本变化会改变身份；Python-only 与含 pnpm 的身份不同。

**失败、例外与证据限制。** 缺少或不匹配身份时重建/重装，而不是静默复用；无摘要的旧 manifest 可读但绝不视为当前匹配；非 64 位小写 hex 的 `payloadDigest` 在校验时拒绝。**注意**：`format` 是源码中的字面值；装配/extraction 改变但未 bump 时，摘要本身无法发现，必须由变更审查拒绝，不能声称自动检测。证据限制：源 Note 的 Testing/Verification 未由本分区执行；固定提交的实现与测试源码已读，但测试未运行。

**关联机制。** `rationale-feature-3-staged-atomic-publish`、`rationale-feature-3-artifact-reference-store`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-14-desktop-primary-runtime.md:1-43@687f282e`
- `deepseek-harness/scripts/primary-runtime/prepare.ts:121-131@687f282e`
- `deepseek-harness/scripts/primary-runtime/prepare.spec.ts:25-47@687f282e`
- `deepseek-harness/packages/skill/tool-workspace-dependencies/src/index.ts:85-129@687f282e`
- `deepseek-harness/packages/skill/tool-workspace-dependencies/README.md:40-47@687f282e`

---

## 二、授权、拒绝与安全执行

来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-desktop-primary-runtime.md:1-43@687f282e

<a id="rationale-feature-3-model-authority-fixed-policy"></a>
### `rationale-feature-3-model-authority-fixed-policy` — 模型掌权时固定策略并失败关闭

**问题。** 把审批交给模型可能让误分类执行破坏或外泄动作；临时策略、缓存授权或按工具名豁免会移除安全上限。

**前置条件。** 存在 pre-execute 闸门、完整动作事实与可取消的 review 生命周期。

**责任者。** reviewer 集成、工具运行时、人类/直接父级授权、会话日志。

**执行步骤。**
1. 构建固定策略与完整 reviewer 请求。
2. 在 body 前发送一次 review。
3. 严格解析闭式结果。
4. allow 才派发；deny/失败不派发。
5. 卸载时停止准入并排空。

**必须做到。**
- 定义一份固定策略，按实际效果分类，而不是按工具名或声明的意图。
- 区分低（允许）、中（仅在当前人类/直接父级明确授权动作、目标与范围时允许）、高（拒绝，即使被请求）。
- 模糊或比既有授权更宽的效果按失败关闭处理。
- 给 reviewer 一份完整请求：固定策略、环境、项目约束、过滤后的有源历史，以及完整待执行动作（名称、描述、schema、解析后参数）。
- 授权身份相关时读取完整动作历史；有界窗口不足。
- 把不可信角色（assistant 文本、工具结果、项目指令作为权威）排除出授权集。
- 只接受一个闭式 JSON 结果，且仅允许已定义的 risk/decision 组合；多余字段、其他 block 或非终态输出一律拒绝。
- 缺失 step 所有权、动作事实不一致、缺 schema、超限请求都失败关闭；不得摘要或截断授权请求。
- 每次受支持调用都重新 review：不缓存授权、不按工具名豁免、不重试、不做第二次授权检查。
- 不把 reviewer trace 或风险标签持久化为状态。

**完成信号。** 低风险项目内动作被允许并执行；中风险动作在当前人类明确授权目标与范围后允许。

**失败、例外与证据限制。** 高风险外泄即使被明确要求也拒绝；多余 JSON 字段、重复成员、错误 block、缺 step 所有权、超限请求都在不执行 body 的前提下拒绝；reviewer 失败报告真实原因并拒绝。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-denied-body-never-executes`、`rationale-feature-3-policy-vs-failure`、`rationale-feature-3-fail-closed-classification`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:1-81@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:1-81@687f282e

<a id="rationale-feature-3-denied-body-never-executes"></a>
### `rationale-feature-3-denied-body-never-executes` — 拒绝绝不执行 body；审批提示置于其他闸门之后

**问题。** 晚到的 allow、被吞掉的拒绝，或在其他下游闸门之前发出的人类提示，都可能执行已被策略或监听器拒绝的 body。

**前置条件。** 所有执行都经过同一 dispatch 闸门，且审批服务可取消。

**责任者。** 工具运行时、审批服务、pre-execute 监听器、reviewer。

**执行步骤。**
1. 首个 await 前同步注册。
2. 按序运行监听器。
3. 任一拒绝即停止。
4. 仅在其余闸门允许后询问人类。
5. 卸载时 abort/drain。

**必须做到。**
- enrollment 与 active-review 注册在首个 await 之前同步完成。
- provider 结算后，生命周期 abort 对晚到 allow、deny 或失败都产生规范的 pre-dispatch cancellation。
- 调用方取消保持运行时优先级：晚到 allow 在派发前取消；晚到失败或最终 deny 保留该结果。
- 只有在后续 pre-execute 监听器允许后才询问人类，使下游拒绝/取消无需提示即获胜。
- 最终拒绝不得运行 body；只暴露稳定拒绝身份与“未执行”输出行，不暴露输入 body。
- 在程序内捕获拒绝不会把它提升为外层失败。

**完成信号。** 被拒绝调用产生结构化拒绝且无 body 执行；后续监听器拒绝时不会出现审批提示。

**失败、例外与证据限制。** 生命周期 abort 后的晚到 allow 在派发前取消；ask 下的晚到 deny 产生 cancelled approval 且不派发；不可用一律不执行。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-model-authority-fixed-policy`、`rationale-feature-3-policy-vs-failure`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:1-81@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-24-auto-review-user-approval-fallback.md:1-33@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:1-81@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-24-auto-review-user-approval-fallback.md:1-33@687f282e

<a id="rationale-feature-3-fail-closed-classification"></a>
### `rationale-feature-3-fail-closed-classification` — 未知、非法或模糊分类一律失败关闭

**问题。** 对未知工具、非法参数、未映射 provider 路径或失败 native 调用的乐观默认，会把不确定性变成权限。

**前置条件。** 决策依赖分类器、注册表或能力探测，且能返回类型化失败。

**责任者。** 策略所有者、工具注册表、provider/native 适配器。

**执行步骤。**
1. 解析实时定义/能力。
2. 校验输入。
3. 要求显式肯定证据。
4. 任何错误/缺失走限制分支。
5. 记录类型化失败。

**必须做到。**
- 只有显式肯定证据才启用较宽松路径；未知工具、非法参数、分类器抛错及其他返回值都走限制路径。
- 调用类型化分类器前先校验参数；非法参数按限制分类，只有实际执行时才暴露普通参数错误。
- 已有组合能力定义访问时，不另建并行 allowlist；策略从该能力派生。
- provider 路径缺失/未映射时拒绝，不用同名本地对象替代。
- 每个 native 调用失败都失败关闭；记录错误而非带部分效果继续。
- 幂等跳过必须匹配完整前置条件（例如精确 allow ACE、精确 deny ACE 与精确 label），不能只匹配子集。

**完成信号。** 显式 true/声明能力走宽松路径。

**失败、例外与证据限制。** 未知工具、非法参数、抛错分类器、未映射路径、native 错误都走限制路径；不完整前置条件不跳过。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-ordered-commit-concurrency`、`rationale-feature-3-trust-boundary-per-surface`、`rationale-feature-3-layered-enforcement`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-07-10-parallel-tool-call-execution.md:1-107@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-09-present-filesystem-access.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-19-windows-acl-mandatory-integrity-confinement.md:1-56@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-07-10-parallel-tool-call-execution.md:1-107@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-09-present-filesystem-access.md:1-28@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-19-windows-acl-mandatory-integrity-confinement.md:1-56@687f282e

<a id="rationale-feature-3-ownership-scoped-deletion"></a>
### `rationale-feature-3-ownership-scoped-deletion` — 只删除自己拥有的数据；共享数据受保护且遇锁继续

**问题。** 卸载/清理若删除共享用户数据、跟随链接或在首个锁定文件处中止，要么毁掉其他产品所需数据，要么留下大量残留。

**前置条件。** 卸载器有明确的自有根集合与受保护 home/安装路径。

**责任者。** 卸载器、native helper、安装器、用户。

**执行步骤。**
1. 计算自有根。
2. 拒绝受保护/重叠目标。
3. 持句柄遍历、不跟随链接。
4. 删除兄弟项并跳过锁定项。
5. 移除空父目录并报告残留。

**必须做到。**
- 只删除产品自有的 Electron/user-data 与 updater 缓存；绝不删除保存会话、凭据、设置与插件的共享 home。
- 仅移除空的普通父目录；绝不删除链接或非空范围目录。
- 拒绝受保护 OS 目录，以及与应用安装或受保护 home 重叠的路径。
- 遍历时持有目录句柄，防止路径被改名/替换；unlink reparse point 而不进入目标；清除只读属性；锁定文件后继续删除兄弟项。
- 要求固定本地盘；链接根或祖先保持不动。
- 失败留下残留但不中止其余删除，也不显示自定义提示。
- 支持 update/keep-data 标志；静默卸载删除同样的自有数据。
- 以环境变量发布的 home 路径保护所有重叠目标。

**完成信号。** 自有 Electron 数据被删，共享 home、会话与凭据保留；update/keep-data 保留数据。

**失败、例外与证据限制。** 受保护目录、重叠安装/home 路径、链接根与网络盘被拒绝或保持不动；锁定文件留残留但继续。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-staged-atomic-publish`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-08-desktop-uninstall-preserve-dsh-home.md:1-40@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-08-desktop-uninstall-preserve-dsh-home.md:1-40@687f282e

<a id="rationale-feature-3-layered-enforcement"></a>
### `rationale-feature-3-layered-enforcement` — 每一层强制都必须堵住一条独立绕过路径

**问题。** 访问控制层看似限制写入，但父目录删除权等第二条 OS 授权路径可绕过；不说明绕过路径的加层只是虚假保证。

**前置条件。** 能在真实 token/进程上复现绕过，并有 native ACL API。

**责任者。** 沙箱所有者、ACL helper、安全 reviewer。

**执行步骤。**
1. 建模第二条授权路径。
2. 加入最小堵漏层。
3. 测量附带影响。
4. 以精确前置条件实现幂等。
5. 逐层验证必要性。

**必须做到。**
- 枚举 OS 接受的所有授权路径，而不只是对象自身描述符。
- 每一层说明它堵住的具体绕过，以及为何其他层不能替代。
- 所有层都必须承重；逐层移除/收窄并测试。
- 把继承标志收窄到仍能堵住绕过的最小范围（如 container-only deny），并测量副作用。
- 策略的常驻部分必须幂等，并在授权重叠处可独立撤销。
- 每个 native 调用失败关闭，并记录外部性（常驻 label 扩大、WRITE_OWNER 要求、FullControl 打开被拒）。

**完成信号。** 通过 cmd、.NET、Remove-Item、libuv 的根外删除均被拒，同时宿主文件存活；一个已授权根不能删除另一个根内部。

**失败、例外与证据限制。** 任一 Win32 失败中止授权/操作；文件级 FullControl 打开仍成功，目录级 FullControl 打开被拒；Untrusted 完整性无法启动受限 shell，故不采用。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-fail-closed-classification`、`rationale-feature-3-trust-boundary-per-surface`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-19-windows-acl-mandatory-integrity-confinement.md:1-56@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-19-windows-acl-mandatory-integrity-confinement.md:1-56@687f282e

<a id="rationale-feature-3-trust-boundary-per-surface"></a>
### `rationale-feature-3-trust-boundary-per-surface` — 每个信任模型独立表面；绝不跨身份替换

**问题。** 把文档渲染器复用于任意网页，或把 provider 路径映射到同名本地文件，会隐藏不同信任模型并暴露用户未授权的数据或权限。

**前置条件。** 新内容类型的执行、网络或身份语义与既有查看器不同。

**责任者。** 表面所有者、地址解析器、sandbox/carrier、provider 适配器、用户。

**执行步骤。**
1. 声明信任模型。
2. 建立独立表面。
3. 在 wire 边界严格校验。
4. 默认拒绝能力，显式按次逃逸。
5. 诚实建模未知状态。

**必须做到。**
- 按信任模型分离表面（文档预览 vs 实时网页），不重载一个渲染器。
- 按严格 scheme allowlist 解析地址；拒绝凭据、应用自身 origin、畸形地址、file: 与未知 scheme。
- 不为任意目标增加宿主侧探测/代理；它会形成 SSRF 路径，并与后续重定向不一致。
- 默认 sandbox；任何逃逸按次授权、不持久、明确警告，且不被后续标签页继承。
- 诚实建模不支持的能力（如跨源历史未知），禁用平台无法支持的动作。
- 不自动激活已保存的第三方页面；需要显式恢复。
- 绝不用同名本地对象替代未映射 provider 对象。
- 同意范围受控：继承的父级反馈不授权子级导出。

**完成信号。** HTTP(S) 链接进入浏览表面，本地文件留在文档预览；跨源导航显示显式未知状态并禁用不支持的历史动作。

**失败、例外与证据限制。** file:、凭据、畸形 URL、应用 origin 被拒；无身份映射的 provider 路径被拒，同名本地文件绝不打开。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-fail-closed-classification`、`rationale-feature-3-claims-disclosed`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-16-sidebar-browser.md:1-74@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-09-present-filesystem-access.md:1-28@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-25-promote-open-anywhere-plugin.md:1-62@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-16-sidebar-browser.md:1-74@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-09-present-filesystem-access.md:1-28@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-promote-open-anywhere-plugin.md:1-62@687f282e

<a id="rationale-feature-3-policy-vs-failure"></a>
### `rationale-feature-3-policy-vs-failure` — 策略决定与执行失败必须分离

**问题。** 把拒绝当异常、或把失败当拒绝，会隐藏原因、诱发重试，并可能把拒绝洗成执行。

**前置条件。** 审批闸门与执行器都会产生结果，且子级可拒绝。

**责任者。** 闸门、执行器、子代理、UI。

**执行步骤。**
1. 分类 allowed/denied/cancelled/failed。
2. 携带稳定 reason/code。
3. 分别渲染。
4. 拒绝不自动重试。
5. 原样向上传播。

**必须做到。**
- 把拒绝/取消建模为正常结构化结果，与抛出的失败区分。
- 失败时报告真实原因，不捏造策略理由。
- 不重试拒绝；只在契约允许时重试瞬态失败。
- 子级不能自行提升权限；原因沿链保留。
- 只有下游闸门允许后才询问人类，避免后续拒绝/取消被洗成提示。

**完成信号。** reviewer 拒绝在 approval policy 为 ask 时返回 **tools pipeline 的** `ask` 决定（不是 approval service 的结果），随后才交给 approval service；`allowed-once` 执行，`rejected`/`cancelled`/`unavailable` 拒绝且 body 不运行；policy 为 `never` 时 reviewer 拒绝直接终结、不弹审批；下游拒绝阻止审批提示。

**失败、例外与证据限制。** 拒绝绝不自动重试；reviewer 失败以独立的 `Auto review of tool "<name>" failed; its body was not executed: <error>` 消息拒绝，并携带 finish kind、failure code 与 provider message；拒绝对该次尝试为终态。不可用审批者映射为已记录的保守结果，而非允许。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；固定提交的 auto-review 与 tools 审批映射源码已读，但测试未运行。

**关联机制。** `rationale-feature-3-denied-body-never-executes`、`rationale-feature-3-model-authority-fixed-policy`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:11-47@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-24-auto-review-user-approval-fallback.md:11-19@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-workflow-run-status-driven-disclosure.md:14-24@687f282e`
- `deepseek-harness/packages/experimental/auto-review/src/index.ts:634-725@687f282e`
- `deepseek-harness/packages/core/tools/src/index.ts:1725-1775@687f282e`

---

## 三、状态真源、投影与诚实呈现

来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:11-47@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-24-auto-review-user-approval-fallback.md:11-19@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-workflow-run-status-driven-disclosure.md:14-24@687f282e

<a id="rationale-feature-3-durable-vs-projection"></a>
### `rationale-feature-3-durable-vs-projection` — 持久状态与请求投影分离

**问题。** 把同一个已接纳工件既当持久历史又当每次请求的 payload，会让一个限制服务不相容的关切，并让拒绝或优化改写历史。

**前置条件。** 同一工件既持久保存又按请求派生，且存在多条路由或限制。

**责任者。** 附件后端、路由适配器、计量/压缩器、客户端披露层。

**执行步骤。**
1. 定义持久规范化形式。
2. 计算确定性 variant id。
3. 按 id 派生并缓存，命中校验 header 事实。
4. 历史保持引用。
5. 证据不完整则省略披露。

**必须做到。**
- 持久记录保持 provider 无关、规范化；历史只存引用。
- 派生确定性的按路由请求投影（variant 身份覆盖格式、尺寸、编码器、质量与全部参数）。
- 按身份缓存派生投影；命中时校验 header 事实，而非只信 key。
- inline 字节与 provider file id 只作瞬态；投影变化不重写既有历史。
- 只有每个贡献尝试都报告了总量时才发布精确总数，否则省略披露。
- 在测量时按生效路由计价/计量，存路由中立事实，不存预计算基线。

**完成信号。** 历史跨轮保留一个规范化引用；不同路由的派生 variant 不同但不重写历史；完整总量渲染，不完整则无该行。

**失败、例外与证据限制。** header 事实不匹配的缓存命中不可用；纯文本路由只对替换文本计价，不算幻影视觉 token；缺少/损坏的历史附件保持 fail-loud 并按附件身份报错；持久隔离与经验证恢复仍是 proposed、未实现（见 `.agents/notes/proposed/bug-fix/2026-08-20-attachment-read-quarantine.md`），不是当前恢复保证；投影失败回退到有界 inline 形式。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-committed-state-only`、`rationale-feature-3-bounded-remote-recovery`、`rationale-feature-3-batch-all-or-nothing`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-20-unified-image-request-pipeline.md:1-70@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-24-route-priced-image-request-pressure.md:1-40@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-24-web-per-turn-token-usage.md:1-32@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-20-unified-image-request-pipeline.md:1-70@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-24-route-priced-image-request-pressure.md:1-40@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-24-web-per-turn-token-usage.md:1-32@687f282e

<a id="rationale-feature-3-committed-state-only"></a>
### `rationale-feature-3-committed-state-only` — 只发布已提交的持久状态；忽略被丢弃尝试

**问题。** 把实时 delta、重试尝试或 UI 状态投影进持久/机器接口，会暴露日志中不存在的内容，并使 replay 不稳定。

**前置条件。** 持久日志有提交标记与 step 所有权，投影能区分实时 delta。

**责任者。** 日志投影器、agent loop、replay 消费者。

**执行步骤。**
1. 等待提交点。
2. 只投影已提交记录。
3. 按 block/event 去重。
4. replay 后重算。
5. 畸形记录响亮失败。

**必须做到。**
- 只从已提交消息投影文本/推理，绝不从实时尝试 delta；忽略被丢弃尝试。
- 每个已提交 content block 恰好产生一个事件；不要同时从 block 和事件重复发布工具调用。
- 只有追加到表面的工具结果才投影；compaction 替换旧历史时不投影。
- 最终文本与退出状态来自已落盘的持久结算，不来自进度呈现状态。
- 流式投影可以存在，但必须声明为瞬态，且不得喂给持久记录。
- replay 遇畸形持久记录必须响亮失败并保持失败，不静默修复。

**完成信号。** 重试步骤只发布提交的那次尝试；同一 id 的连续两次运行共享历史并一致 replay。

**失败、例外与证据限制。** 被丢弃尝试的文本/推理永不出现；compaction 替换不作为新工具结果发出；畸形日志以诊断失败而非静默丢弃。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-durable-vs-projection`、`rationale-feature-3-artifact-reference-store`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-09-headless-machine-readable-run-surface.md:1-101@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-19-persisted-same-session-goal-domain.md:1-64@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-09-headless-machine-readable-run-surface.md:1-101@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-19-persisted-same-session-goal-domain.md:1-64@687f282e

<a id="rationale-feature-3-complete-sequence-authority"></a>
### `rationale-feature-3-complete-sequence-authority` — 唯一完整顺序权威；过滤器只是投影

**问题。** 持久化过滤后或按视图的顺序会丢失隐藏成员的位置；独立 pin 序列制造第二顺序权威并破坏拖拽。

**前置条件。** 有序集合有单一 owner，且成员关系可枚举。

**责任者。** 列表/注册表所有者、客户端视图、持久化层。

**执行步骤。**
1. 存储完整序列。
2. 按视图派生显示。
3. 仅显式排序时写入。
4. 内存补齐缺失成员。
5. 串行化并拒绝陈旧回复。

**必须做到。**
- 每个 owner/account 保留一条完整序列（含隐藏成员），由成员集合限定。
- 过滤与分组只改显示，绝不重写存储位置。
- 内存中补齐缺失成员；只有下一次显式排序写入时才采纳补齐后的序列。
- 状态转换在一次持久写入中互斥（例如归档即取消 pin）。
- pin 是有意重排；unpin 不恢复旧槽位。
- 恢复/移除幂等；移除 id 不可能引入未知引用时不必探测存在性。
- 新请求或推送状态取代旧状态时忽略陈旧响应。

**完成信号。** 过滤隐藏行但不改其存储位置；pin 把一行移到完整序列前部，unpin 只清除标记。

**失败、例外与证据限制。** 基于显示索引的拖拽不能丢掉隐藏成员；归档行 pin 失败；缺失 id 移除是无写入的 no-op。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-stale-response-supersession`、`rationale-feature-3-id-reservation`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-18-session-pin-and-sidebar-archive.md:1-80@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-25-session-list-browsing-and-manual-order.md:1-61@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-18-session-pin-and-sidebar-archive.md:1-80@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-25-session-list-browsing-and-manual-order.md:1-61@687f282e

<a id="rationale-feature-3-stale-response-supersession"></a>
### `rationale-feature-3-stale-response-supersession` — 单一有序状态所有者；陈旧响应被取代

**问题。** 并发读与乐观写可能让旧快照覆盖新状态，或让两个表面就同一选择值不一致。

**前置条件。** 存在推送通道或乐观写，且状态可带版本/序号。

**责任者。** 状态所有者、客户端视图、transport。

**执行步骤。**
1. 读取快照+游标。
2. 按序应用推送。
3. 标记本地乐观写。
4. 比较 revision 后接受或丢弃。
5. 检测 gap 时全量刷新。

**必须做到。**
- 每个 account/session 有一个有序状态所有者；客户端只渲染单一来源的单一快照，不合并部分读。
- 推送更新携带顺序（sequence control 或 revision）；更新的推送/请求取代旧 unary 响应时忽略后者。
- 乐观更新必须有拒绝路径：回滚或重取，绝不静默保留乐观值。
- 重连或硬刷新后取新快照；未重新校验不得从旧游标续接。
- 本地选择在宿主确认/拒绝前获胜；之后以确认状态为准。

**完成信号。** 更高 sequence 的推送更新替换本地视图。

**失败、例外与证据限制。** 旧 revision 的晚到 unary 响应不能覆盖新状态；检测到 gap 触发全量刷新；被拒绝的乐观写恢复确认值。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-complete-sequence-authority`、`rationale-feature-3-single-owner-contract`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-07-24-web-session-model-selector.md:1-44@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-18-session-pin-and-sidebar-archive.md:14-35@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-workspace-sidebar-order-and-folding.md:1-60@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-07-24-web-session-model-selector.md:1-44@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-18-session-pin-and-sidebar-archive.md:14-35@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-workspace-sidebar-order-and-folding.md:1-60@687f282e

<a id="rationale-feature-3-no-fabricated-coverage"></a>
### `rationale-feature-3-no-fabricated-coverage` — 只展示观察到的事实；命名未知与不可用状态

**问题。** 用猜测填补缺口（缩短路径、伪造文件、占位预览、声称读取范围）会把证据缺失变成虚假陈述。

**前置条件。** UI/摘要可能遇到缺失、部分、过期或窗口外数据。

**责任者。** 渲染器、摘要器、inspector。

**执行步骤。**
1. 检查事实是否已知且在范围内。
2. 显示已知值或显式未知状态。
3. 标注预览/投影范围。
4. 在 coverage 中记录实际范围。
5. 测试缺失路径。

**必须做到。**
- 仅在精确前置条件成立时缩写或概括，否则显示完整值。
- 显式渲染空/未知/不支持状态，而非貌似合理的占位。
- 绝不从名称或期望伪造文件路径、coverage 范围或读取声明。
- 预览内容瞬态并明确标注；它不是工件持久的证据。
- 状态摘要/卡片派生自持久事实，不证明未发生或未执行的批准。
- 披露实际读取/检查范围；不得用样本暗示全读。
- 派生索引刷新必须失败关闭：根不可读或刷新失败时保留旧条目并重试，绝不发布空替换。
- 发现标签读取投影而非完整日志；缺失投影以 id 标注，不通过读日志回填。
- 仅加载部分历史/窗口的视图必须明示该限制，不得暗示完整历史已存在。

**完成信号。** 仅当路径精确匹配 home 前缀时缩写；缺失预览显示显式不可用；索引刷新失败时旧条目保留并可重试。

**失败、例外与证据限制。** Windows 盘符路径永不变成 ~；被拒绝调用的 plan card 仍显示计划，但不证明批准或执行；无持久证据的状态显示不可用；根不可读或刷新失败不得发布空索引，缺失投影以 id 标注。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-machine-identity-vs-label`、`rationale-feature-3-claims-disclosed`、`rationale-feature-3-preview-read-only`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-18-web-home-path-tilde.md:12-34@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-16-sidebar-browser.md:1-74@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-27-web-at-mention-discovery-and-row-content.md:20-32@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-25-loaded-turn-chat-navigation.md:1-46@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-17-persistent-plan-cards.md:12-28@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-web-home-path-tilde.md:12-34@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-16-sidebar-browser.md:1-74@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-27-web-at-mention-discovery-and-row-content.md:20-32@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-loaded-turn-chat-navigation.md:1-46@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-17-persistent-plan-cards.md:12-28@687f282e

<a id="rationale-feature-3-preview-read-only"></a>
### `rationale-feature-3-preview-read-only` — 预览只读；绝不改动草稿、来源或激活状态

**问题。** 预览若序列化草稿、提交、在渲染时抓取远程或改变激活，就把检查与副作用耦合。

**前置条件。** 预览与可编辑草稿共享状态，且来源 owner 可解析引用。

**责任者。** composer、预览来源、provider。

**执行步骤。**
1. 把引用路由给来源 owner。
2. 惰性获取元数据。
3. 渲染且不碰草稿。
4. 失效时丢弃瞬态数据。
5. 测试草稿不变且未提交。

**必须做到。**
- 点击/悬停预览不得序列化、提交或改动草稿。
- 预览数据是瞬态发现数据，不加入持久消息或状态。
- 来源所有者解析引用；composer 不实现 provider 策略。
- 发现阶段不加载完整 skill body/远程内容；只在显式预览时抓取。
- 预览可以不可用；显示该状态，不用替代内容。

**完成信号。** 点击文件 chip 预览后草稿逐字节不变。

**失败、例外与证据限制。** 预览绝不提交/序列化消息；发现阶段不加载 skill body；失效引用被移除且不碰草稿。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-no-fabricated-coverage`、`rationale-feature-3-artifact-reference-store`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-10-composer-reference-previews.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e`

---

## 四、单一权威与共享呈现

来源：deepseek-harness/.agents/notes/archived/feature/2026-09-10-composer-reference-previews.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e

<a id="rationale-feature-3-single-owner-contract"></a>
### `rationale-feature-3-single-owner-contract` — 每个资源、卡片、流程或设置一个显式所有者

**问题。** 两个组件各自以为拥有同一卡片、流程、设置或外观通道，会产生重复渲染、分歧默认值，或旧所有者清除新状态。

**前置条件。** 资源有可命名的 owner，贡献者可通过 slot/intent 接入。

**责任者。** owner 组件、贡献者、设置存储。

**执行步骤。**
1. 设计时声明 owner。
2. 所有写入经 owner。
3. 贡献者只传数据/intent。
4. 贡献者不得写 owner 的状态。
5. 测试重复挂载与贡献者冲突。

**必须做到。**
- 为每个资源/流程/slot 指定唯一所有者；其他贡献者只加数据或 intent，不加第二份表示。
- 一个组件拥有整张卡片/行；子部分是 children，不是独立工具行。
- 设置通过一条路径、在依赖表面 hydrate 前读取一次；每个表面不得自定义默认值。
- 预览/草稿读取不得改动自有状态；激活仍归来源所有者。

**完成信号。** 即使两个贡献者提供数据，每个资源也只渲染一张卡片；一个设置值作用于所有表面。

**失败、例外与证据限制。** 第二个独立写者被拒绝或无效果；第二个贡献者不能渲染第二张卡片/工具行；非所有者写入被拒。迁移建议（非源 Note 直接陈述）：可用 generation 保护 release，并在所有权移交时声明交接、使旧持有者的待处理工作失效。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-complete-sequence-authority`、`rationale-feature-3-single-flow-owner`、`rationale-feature-3-single-base-default`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-07-31-web-cards-toolrow.md:1-33@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:20-38@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-workflow-run-status-driven-disclosure.md:14-24@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-18-settings-font-size-control.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-16-unified-model-input-controls.md:1-30@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-web-cards-toolrow.md:1-33@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:20-38@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-workflow-run-status-driven-disclosure.md:14-24@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-settings-font-size-control.md:1-32@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-16-unified-model-input-controls.md:1-30@687f282e

<a id="rationale-feature-3-single-authority-geometry"></a>
### `rationale-feature-3-single-authority-geometry` — 唯一几何/布局权威；表面接收 slot 而非坐标

**问题。** 每个面板各自计算宽度、断点或 split 几何，会漂移、争抢 resize 并复制常量。

**前置条件。** 多面板布局需要共享几何，且有可序列化的布局状态。

**责任者。** 布局引擎、面板插件、持久化层。

**执行步骤。**
1. 定义节点模型与操作。
2. 集中计算几何。
3. 向面板传 slot。
4. 序列化操作支持 undo。
5. 持久化并恢复规范化状态。

**必须做到。**
- 保留一棵规范化布局树和一个计算几何的引擎；表面渲染由它派生的 slot。
- id 使用 branded 类型并只由引擎铸造，消费者不得伪造节点。
- 组件渲染快照并上报已结算 intent；手势本地预览但只提交一个操作。
- 布局 kit 只有一份 stylesheet；消费者编译源码，不 fork CSS。
- 布局持久化为引擎的规范化状态，而不是每个面板的像素副本。

**完成信号。** split 操作返回下一棵树及其 undo 操作，`replay(initial, ops)` 从同一起点复现同一棵树；拖拽只提交一个已结算操作；布局 kit 只有一份 stylesheet，`ui-sidebar-right` 按 session 保存一份规范化 `SurfaceState` 而非每面板像素副本。

**失败、例外与证据限制。** 面板不能伪造 node id 或直接写几何；失败操作保留旧树，replay 不读时钟或随机源。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-single-owner-contract`、`rationale-feature-3-shared-presentation-defaults`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-04-right-sidebar-docking-infrastructure.md:21-60@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-18-conversation-adaptive-content-width.md:1-36@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-04-right-sidebar-docking-infrastructure.md:21-60@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-conversation-adaptive-content-width.md:1-36@687f282e

<a id="rationale-feature-3-artifact-reference-store"></a>
### `rationale-feature-3-artifact-reference-store` — 持久工件以稳定句柄引用，不复制进每个表面

**问题。** 从第二份副本重渲染工件会让副本分歧；把字节嵌入每条消息既重复存储，又让模型拿到过期内容。

**前置条件。** 工件需跨重载/多表面出现，且有持久存储与稳定句柄。

**责任者。** 工件存储、日志、预览/侧栏、provider 适配器。

**执行步骤。**
1. 一次性写入并记录句柄。
2. 事件/卡片引用句柄。
3. 渲染时解析。
4. 预览保持瞬态。
5. provider 句柄按需重物化。

**必须做到。**
- 权威工件只存一份（持久日志/附件存储），以稳定句柄/id 引用。
- 派生表面读取引用，不持久化第二份副本。
- 预览可以瞬态、按浏览器生命周期存在，但不得声称持久。
- 日志拥有精确的已提交文本/字节；被拒绝的调用可以保留工件，但不得证明已批准。
- provider 侧文件句柄是瞬态的；需要时从持久形式重新物化。

**完成信号。** 计划卡通过解析已记录调用在重载后存活；一个附件只存一次并被多轮引用。

**失败、例外与证据限制。** 预览不能成为第二持久来源；缺失句柄显示不可用，而不是重新猜测推导文本。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-durable-vs-projection`、`rationale-feature-3-committed-state-only`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-17-persistent-plan-cards.md:12-28@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-20-unified-image-request-pipeline.md:16-32@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-17-persistent-plan-cards.md:12-28@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-20-unified-image-request-pipeline.md:16-32@687f282e

<a id="rationale-feature-3-machine-identity-vs-label"></a>
### `rationale-feature-3-machine-identity-vs-label` — 稳定机器身份与人类标签分离

**问题。** 把显示名当路由键会让身份随语言、改名或冲突变化，并使持久引用不稳定。

**前置条件。** 实体同时有显示名与持久引用，且可能改名或本地化。

**责任者。** 实体所有者、工具 API、UI 标签层。

**执行步骤。**
1. 定义稳定 id/key。
2. 写入持久记录。
3. 仅在渲染时本地化。
4. 只在名称即身份处校验唯一。
5. 显式迁移旧引用。

**必须做到。**
- 持久化与路由使用稳定不透明 id 或固定语言中立键；人类名称只是投影。
- 默认存储名是固定中立字符串；只有屏幕标签随读者语言变化。
- 改名改标签，不改身份或既有引用。
- 名称即身份处拒绝重名；否则允许重名并在显示层消歧。
- 有 id 时绝不从 basename、路径段或标题推断身份。

**完成信号。** 切换 UI 语言只改标签；存储键与路径不变。

**失败、例外与证据限制。** 按标签调用的路由/工具失败或规范化为 id；名称即身份处重名被拒。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-no-fabricated-coverage`、`rationale-feature-3-forward-compatible-strict-format`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-18-product-subagent-named-instances.md:12-22@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-23-language-neutral-default-workspace-naming.md:12-23@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-product-subagent-named-instances.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-23-language-neutral-default-workspace-naming.md:12-23@687f282e

<a id="rationale-feature-3-shared-presentation-defaults"></a>
### `rationale-feature-3-shared-presentation-defaults` — 跨表面共享一个呈现基线与 token 集

**问题。** Desktop 与 Web 各自定义默认值、焦点色或几何，会让同一功能外观/行为不同，修复也要重复。

**前置条件。** 多个表面呈现同一概念，且有共享 UI 包/token 层。

**责任者。** 设计系统所有者、表面所有者、i18n。

**执行步骤。**
1. 识别共享概念。
2. 定义 base/token。
3. 迁移表面。
4. 删除本地副本。
5. 测试一致性。

**必须做到。**
- 定义一个共享 base/default，表面特定选择从它派生。
- 每个角色一个 token（例如所有控件同一个键盘焦点色），而非按组件取值。
- 共享设置/偏好作用于所有渲染该功能的表面，不限定一个宿主。
- 偏离是带理由的显式例外，不是独立默认值。
- （迁移建议，非源 Note 直接陈述）字符串/文案默认值放在共享 i18n seat，而非各表面。

**完成信号。** 模型输入控件渲染一行共享默认值；所有控件读取 `--dsw-focus-ring-color`，焦点样式表拥有一个颜色与标准 2px 宽度（密集表格/工具栏可用 1px）；一个 settings-owned `ThemeSettingsSchema.fontSize`（12–17，默认 14）经 `--dsh-content-font-size` 作用于 transcript 与 composer。

**失败、例外与证据限制。** 某表面为共享角色（模型输入、焦点色、字号）引入私有默认值即失败；组件本地焦点色或私有字号默认值被拒；token 变更随重建传播到所有消费者，映射的设置值重载后保留并实时应用。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-single-authority-geometry`、`rationale-feature-3-single-base-default`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-16-unified-model-input-controls.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-20-focus-ring-brand-primary.md:12-26@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-18-settings-font-size-control.md:1-32@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-16-unified-model-input-controls.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-20-focus-ring-brand-primary.md:12-26@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-settings-font-size-control.md:1-32@687f282e

<a id="rationale-feature-3-single-flow-owner"></a>
### `rationale-feature-3-single-flow-owner` — 一个流程拥有披露状态与按键语义

**问题。** 让每个子级自持披露/键盘状态，会在父级卸载时丢失；重复按键处理让 Escape/Enter 跨表面不一致。

**前置条件。** 流程有嵌套 phase/披露/选择表面，且按键语义需一致。

**责任者。** 流程组件、子表面、键盘路由器。

**执行步骤。**
1. 把状态提升到流程根。
2. 按稳定 phase key 保存。
3. 定义转换规则。
4. 镜像按键。
5. 持久化 dismissal 身份。

**必须做到。**
- 流程根部保留一个披露状态所有者，并用按 phase 的 map 在父级隐藏/恢复后存活。
- 普通更新保留用户选择；只在定义好的转换（clean→activity）打开、在定义好的完成时关闭。
- 在多个选择表面一致镜像主流程按键（如 Enter/Tab 结算，Escape/Shift+Tab 关闭）。
- 用户关闭过的同一 token/query 命中保持关闭，直到其变化。
- 焦点感知完成：焦点在内容内时不关闭。
- 不为同一流程新增第二个 store/setting/timer。

**完成信号。** 隐藏并重开外层流程后每个 phase 选择恢复。

**失败、例外与证据限制。** 普通运行更新不覆盖用户折叠选择；已关闭命中不在同一 query 上重开；未知按键无动作。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-single-owner-contract`、`rationale-feature-3-complete-sequence-authority`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-workflow-run-status-driven-disclosure.md:14-24@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:20-30@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-14-composer-selection-keyboard.md:16-30@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-workflow-run-status-driven-disclosure.md:14-24@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:20-30@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-14-composer-selection-keyboard.md:16-30@687f282e

<a id="rationale-feature-3-completion-delivery-lane"></a>
### `rationale-feature-3-completion-delivery-lane` — 按所有者状态选择完成投递车道

**问题。** 只在运行中注入完成通知，空闲所有者永远收不到；无条件唤醒又会把用户中断洗成新轮次，并形成自激唤醒链。

**前置条件。** 后台任务、子代理或终端完成时，所有者可能忙碌、空闲或已取消。

**责任者。** 任务所有者、会话 driver、完成投递 ledger。

**执行步骤。**
1. 判定所有者状态。
2. 忙碌或取消收敛中的所有者走注入；仅 idle 所有者用 followup 唤醒。
3. 抑制 awaited、model-kill、teardown 与 unowned settlement。
4. 可选 cap 按所有者轮次计数，仅认领用户消息恢复预算。
5. 需要确定性时显式 quiet。

**必须做到。**
- 完成投递按所有者状态选道：忙碌所有者注入；空闲所有者用 followup 唤醒；不要忙等或睡眠轮询。
- 已取消的轮次是用户中断；不得代其重新打开。
- 唤醒默认无上限；可选 cap 按所有者轮次数计，不按时间；认领用户-authored 消息恢复预算，插件自己的通知不恢复。
- quiet 模式可恢复旧的注入车道，用于确定性 transcript；它是显式选择，不是默认。
- 投递是正确性规则，有一个所有者；完成不是单纯通知。
- 注册表/ledger 可以迁移，但车道规则不随实现搬家而改变。

**完成信号。** 忙碌所有者收到注入；空闲所有者被唤醒并继续；取消收敛中的所有者不被唤醒；awaited/model-kill/teardown/unowned 不产生通知；cap 耗尽后退化为注入。

**失败、例外与证据限制。** 唤醒链可能自激，故 cap 可选且不由时间恢复；quiet 模式牺牲即时性换确定性，超过 cap 的通知会静默等待下一轮。归档 Note 的 `reported` bit/`onJobDone` 已随 jobs seam consolidation 离开注册表；固定提交的当前 ledger 在 `tool-jobs`：`event.awaited` + model-kill set + teardown cause，cap 用按 Agent 的 `WeakMap`。不要恢复旧名。证据限制：源 Note 的 Testing/Verification 未由本分区执行；当前实现与 README 已读，但测试未运行。

**关联机制。** `rationale-feature-3-single-owner-contract`、`rationale-feature-3-single-flow-owner`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:20-38@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-21-continuable-background-subagents.md:1-127@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-first-continuable-delegation.md:1-46@687f282e`
- `deepseek-harness/packages/jobs/tool-jobs/README.md:38-42,92-94@687f282e`
- `deepseek-harness/packages/jobs/tool-jobs/src/index.ts:194-300@687f282e`

---

## 五、契约、格式与必需事实

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:20-38@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-21-continuable-background-subagents.md:1-127@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-first-continuable-delegation.md:1-46@687f282e

<a id="rationale-feature-3-machine-readable-contract"></a>
### `rationale-feature-3-machine-readable-contract` — 稳定的机器可读代码与事件形状；散文不是 API

**问题。** 脚本与 supervisor 解析人类散文或偶然字段顺序，文案或本地化一改就破坏自动化。

**前置条件。** 存在程序化消费者，且错误/事件需同时服务人类与机器。

**责任者。** CLI/API 所有者、事件生产者、自动化客户端。

**执行步骤。**
1. 定义稳定 code 与 schema。
2. 在首个事件发送身份。
3. 分离持久与显示事实。
4. 版本化变更。
5. 独立于散文测试解析。

**必须做到。**
- 暴露稳定 code/id 与类型化事件形状；散文只给人看。
- 区分持久错误码与瞬态显示文案。
- 机器可读/日志表面不得含凭据、账单 URL 或秘密。
- 机器可读流在首个事件报告身份，便于 supervisor 持久化复用。
- 不静默改字段含义/顺序；契约要版本化。

**完成信号。** supervisor 从首个事件解析 id 并恢复运行。

**失败、例外与证据限制。** 改文案不改 code；凭据绝不出现在事件/日志；未知 code 原样报告，不猜测修复。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-committed-state-only`、`rationale-feature-3-forward-compatible-strict-format`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-09-headless-machine-readable-run-surface.md:28-63@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-18-account-quota-top-up.md:12-20@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-08-web-background-job-display.md:20-26@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-09-headless-machine-readable-run-surface.md:28-63@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-18-account-quota-top-up.md:12-20@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-08-web-background-job-display.md:20-26@687f282e

<a id="rationale-feature-3-claims-disclosed"></a>
### `rationale-feature-3-claims-disclosed` — 披露来源、范围与已知限制；不背书第三方声明

**问题。** 把第三方后端、插件、遥测默认或延迟功能呈现为完全支持，会隐藏未测行为与暗示背书。

**前置条件。** 能力依赖第三方或实验路径，或默认值影响隐私。

**责任者。** 文档所有者、适配器所有者、reviewer。

**执行步骤。**
1. 列出能力与 owner。
2. 声明保证与限制。
3. 固定外部示例。
4. 披露隐私默认。
5. 标注延迟工作。

**必须做到。**
- 指明每项能力的实际 owner/provider 与产品真正保证的内容。
- 不因收录而暗示背书；固定示例/版本并标注为示例。
- 未签名的市场索引中，标题、作者、标签、评分都是市场声明；official 标签不等于 DSH 验证；客户端必须展示索引 URL 与每个版本的 source，installed manifest/source 才决定实际安装的是什么。
- 披露影响隐私/遥测的默认值，并明确 opt-in/opt-out。
- 延迟或未验证功能如实标注；不得声称已实现。
- 把来源引述的声明与项目自身已测行为分开。

**完成信号。** 每个外部后端标注 provider 与已测范围；市场索引展示索引 URL 与每个版本的 source，且不把 official 标签当作验证。

**失败、例外与证据限制。** 延迟功能不得描述为可用；shared base 在 `DSH_TELEMETRY_MODE` 未设置/为空时解析为 `FEEDBACK_ONLY`（仅显式反馈才释放，并非 `DISABLED`）；插件省略 `mode` 时为 `DISABLED`；非空 `DSH_TELEMETRY_DISABLED` 是硬 opt-out；`FULL` 被拒。未测声明降级并更正，而非静默删除。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-no-fabricated-coverage`、`rationale-feature-3-experimental-gate-default-off`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-07-31-third-party-memory-mcp-examples.md:1-79@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-04-claude-code-and-codex-subagent-backends.md:1-96@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-04-web-context-source-and-steer-marks.md:1-51@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:1-32@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-index-format.md:229-236@687f282e`
- `deepseek-harness/.agents/notes/proposed/feature/2026-09-08-desktop-update-extensions.md:11-30@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-third-party-memory-mcp-examples.md:1-79@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-04-claude-code-and-codex-subagent-backends.md:1-96@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-04-web-context-source-and-steer-marks.md:1-51@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:1-32@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-index-format.md:229-236@687f282e 来源：deepseek-harness/.agents/notes/proposed/feature/2026-09-08-desktop-update-extensions.md:11-30@687f282e

<a id="rationale-feature-3-forward-compatible-strict-format"></a>
### `rationale-feature-3-forward-compatible-strict-format` — 版本化格式严格校验已定义字段；仅在契约允许时容忍未知成员

**问题。** 宽松的读者若接受格式已定义字段中的拼写错误或非法值，会把生产者 bug 变成静默行为；无版本格式又无法演进。反过来，一刀切的闭式 schema 同样错误：有些格式明确承诺向前兼容，要求读者忽略自己未定义的成员。

**前置条件。** 格式在组件/生态间交换，且可版本化、可定义每种格式自己的未知成员策略。

**责任者。** schema 所有者、生产者、消费者。

**执行步骤。**
1. 定义版本化 schema。
2. 严格校验已定义字段、值与判别值。
3. 删除别名；每个概念一种表示。
4. 记录该格式的未知成员容忍策略。
5. 测试已定义字段违规、未知判别值与可忽略的可选成员。

**必须做到。**
- 版本化格式并严格校验每个已定义字段、值与判别值；拒绝已定义规则违规和封闭判别值的未知取值（例如未知 `source.type`）。
- 不推断未知成员的语义；仅当该格式契约明确授予向前兼容时，读者才可忽略它未定义的成员。
- 每个概念只允许一种表示；不接受两个可选别名。
- 标准名称/版本尽量复用维护中的 parser/validator。
- 格式定义与生成器分离；生成器可变而格式不变。
- 既有读者会误读的变更需要新 format 版本；读者可忽略的可选新增不需要。
- 记录每种格式的容忍决策，而不是套用一套全局闭式/开放规则。

**完成信号。** 当前版本 plugin-market 索引中已定义字段全部有效即可解析，未定义成员在每一层被丢弃；web diff card 遇未知 `card` 值走 generic 路径，而非猜测 diff。

**失败、例外与证据限制。** plugin-market 索引出现未声明的 category/label/sort key、未列出的 dist-tag 目标、重复 name/version 或 format 非 1 时整体失败并给出 JSON path 诊断；未知 `source.type` 被拒绝，已定义字段的拼写错误不被忽略；既有读者误读的变更使用新 format 值，旧读者报告不支持而非部分解析；可忽略的可选成员不要求新版本。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-machine-readable-contract`、`rationale-feature-3-required-not-optional`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-diff-card.md:16-30@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-index-format.md:144-179@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-07-30-web-diff-card.md:16-30@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-index-format.md:144-179@687f282e

<a id="rationale-feature-3-required-not-optional"></a>
### `rationale-feature-3-required-not-optional` — 必需事实必须必需；每个概念一种表示

**问题。** 可选字段让生产者省略消费者需要的事实，默认值随后静默发明它；两个可选别名迫使下游分支。

**前置条件。** 存在必须始终成立的事实，且边界可校验。

**责任者。** schema/工具所有者、生产者、消费者。

**执行步骤。**
1. 识别必需事实。
2. 在 schema 中标记 required。
3. 删除别名字段。
4. 测试缺失/空值。
5. 破坏性变更走版本。

**必须做到。**
- 把必须成立的事实标为 required，缺失即失败；不用默认替代。
- 一个概念只用一个字段/形状；不接受 query 与 queries、布尔与计数并存。
- 校验错误指明缺失字段，不吞成通用失败。
- 仅当每个消费者都能显式渲染缺失时，显示值才可可选。
- （迁移建议，非源 Note 直接陈述）向既有格式新增 required 字段需要版本/兼容计划。

**完成信号。** 完整 payload 校验并执行。

**失败、例外与证据限制。** 缺必需字段与双别名 payload 在副作用前被拒；消费者不得用默认值修补。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-forward-compatible-strict-format`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-18-product-subagent-named-instances.md:12-22@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:31-47@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-search-multiple-queries.md:12-18@687f282e`

---

## 六、边界、恢复与默认开关

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-18-product-subagent-named-instances.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-08-28-auto-review.md:31-47@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-search-multiple-queries.md:12-18@687f282e

<a id="rationale-feature-3-bounded-io"></a>
### `rationale-feature-3-bounded-io` — 为每次读取、扇出与展示 payload 设界

**问题。** 无界读取、查询扇出或预览会按不可信语料规模消耗内存/延迟并挂起调用者。

**前置条件。** 工具可读不可信规模的语料，或模型可选择数组大小/深度。

**责任者。** 工具所有者、部署配置、UI。

**执行步骤。**
1. 选择上限。
2. 在边界强制。
3. 写入 schema/文档。
4. 标记截断。
5. 测试超限。

**必须做到。**
- 对条目、行、字节、页与扇出施加显式部署级上限。
- 上限必须出现在工具描述/prompt 中，便于模型规划。
- 超限时返回带显式截断标记的有界结果，不静默部分返回。
- 大内容流式/分页，不物化无界 body。
- 预览上限与阅读上限可以不同，但都必须是显式常量。
- 固定费率下限是一个协议常量：`MIN_EVERY_INTERVAL_SECONDS = 60`，Host decoder、create/update 校验与工具描述共用；客户端保留自己的 `MIN_INTERVAL_SECONDS = 60`，部署不能通过配置提高协议下限。

**完成信号。** 上限内查询返回完整结果；超限数组在扇出前被拒；低于 60 秒的固定费率在 Host decoder/create/update 被拒。

**失败、例外与证据限制。** 任何请求都不能引发无界 provider 调用；截断预览提供显式展开路径，底层读取仍有界；需要更长固定费率下限的部署只能在创建接口另加限制，不能抬高协议常量。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-batch-all-or-nothing`、`rationale-feature-3-bounded-remote-recovery`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-10-minimal-read-image-tool.md:12-22@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-search-multiple-queries.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-index-format.md:96-130@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-24-fixed-rate-floor-one-minute.md:1-30@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-10-minimal-read-image-tool.md:12-22@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-search-multiple-queries.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-10-02-plugin-market-index-format.md:96-130@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-24-fixed-rate-floor-one-minute.md:1-30@687f282e

<a id="rationale-feature-3-bounded-remote-recovery"></a>
### `rationale-feature-3-bounded-remote-recovery` — 有界重连/重试、单一故障预算与静默销毁

**问题。** 无界重连风暴、短暂成功即重置的重试计数，或只发停止信号的销毁，会让资源抖动或泄漏。

**前置条件。** 远程连接/下载可瞬态失败，且 owner 可被销毁。

**责任者。** 连接 supervisor、provider 适配器、owner 生命周期。

**执行步骤。**
1. 用事件检测失败。
2. 在界内退避。
3. 一次故障共享预算。
4. 耗尽后禁用/注销。
5. 静默销毁。
6. 显式回退。

**必须做到。**
- 指数退避并以最大延迟封顶；一次故障共享一组连续失败尝试预算。
- 不因短暂成功重置预算；只有稳定恢复才重置。
- 一个队列串行化操作；每次尝试使用新的 transport/client generation。
- 预算耗尽后注销/禁用资源并停止，不无限循环。
- 销毁先翻 fence、取消定时器、关闭 client，再等待在途尝试与队列，然后释放。
- 回退到更小/本地形式必须显式；失败远程不得伪造成功。

**完成信号。** 崩溃的 stdio server 从 `initialDelayMs` 起以指数退避重连，延迟翻倍至 `maxDelayMs`；一次 outage 最多消耗 `maxAttempts` 次连续失败。

**失败、例外与证据限制。** 崩溃循环耗尽预算后停止，不因短暂连接重置；销毁后的晚到尝试不能注册工具；回退内容标注为回退。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-bounded-io`、`rationale-feature-3-artifact-reference-store`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-06-mcp-client-auto-reconnect.md:12-27@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-20-unified-image-request-pipeline.md:16-32@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-14-desktop-primary-runtime.md:11-27@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-06-mcp-client-auto-reconnect.md:12-27@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-20-unified-image-request-pipeline.md:16-32@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-05-sidebar-text-preview-and-file-tree.md:30-50@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-14-desktop-primary-runtime.md:11-27@687f282e

<a id="rationale-feature-3-batch-all-or-nothing"></a>
### `rationale-feature-3-batch-all-or-nothing` — 多项操作全有或全无，并只在界内扇出

**问题。** 批处理返回部分成功会让调用者误以为全部完成，而无界扇出会放大成本与失败。

**前置条件。** 一个调用接受数组，且 provider 是单项契约。

**责任者。** 工具消费者、provider、部署配置。

**执行步骤。**
1. 校验数组与上限。
2. 在界内扇出。
3. 失败时取消兄弟并丢弃成功。
4. 去重/标注。
5. 返回合并结果。

**必须做到。**
- 任一项失败即丢弃成功兄弟并返回失败；除非契约明确支持逐项结果，不得声称部分成功。
- 返回前等待兄弟取消达到静默。
- 用一个部署级上限同时约束数组与扇出。
- 共享 provider 契约保持单条；编排属于消费者。
- 按来源项标注/去重结果，使合并结果可归因。

**完成信号。** 上限内的批返回合并且带标签的结果。

**失败、例外与证据限制。** 一项失败则整个调用失败且不报告成功；超限数组在 provider 调用前被拒。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-bounded-io`、`rationale-feature-3-ordered-commit-concurrency`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-search-multiple-queries.md:12-36@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-08-17-web-search-multiple-queries.md:12-36@687f282e

<a id="rationale-feature-3-experimental-gate-default-off"></a>
### `rationale-feature-3-experimental-gate-default-off` — 风险功能置于一个显式、有文档的闸门之后；默认值由 owner 决定

**问题。** 实验性、隐私相关或增加复杂度的功能需要一个显式且有文档的闸门和当前默认值。名称前缀不是闸门，假值环境变量也不得启用实验命令。但不能假定默认关闭：开发者工具从最初的默认关闭选择被显式取代为默认开启决定，而共享遥测基线默认是 FEEDBACK_ONLY，不是 DISABLED。

**前置条件。** 功能未证明、隐私敏感或干扰日常，且有 flag/env 或设置入口。

**责任者。** 功能所有者、CLI/UI、部署。

**执行步骤。**
1. 选择闸门 owner 并记录当前默认值。
2. 在副作用前检查闸门。
3. 测试裸调用、false、true 与已保存偏好路径。
4. 共享设置作用于所有渲染该功能的表面。
5. 稳定化时删除闸门但不改名；保留前驱链接。

**必须做到。**
- 每个功能一个显式闸门，并文档化当前默认值；不要从机制名或被取代的旧 note 推断默认值。
- 实验命令要求每次调用的 `--experimental` flag 或 `DSH_EXPERIMENTAL=1`；`1` 是唯一启用值，裸命令以 exit 1 失败并点名两者。
- 开发者工具偏好解析已接受的 `ui-settings.enabled` 值；最初的默认关闭已被默认开启决定显式取代（`ui-developer-tools.enabled` schema 默认 `true`），已保存的 `false` 仍然优先。
- 遥测保留两个默认值：shared base 未设置/空 `DSH_TELEMETRY_MODE` -> `FEEDBACK_ONLY`；插件省略 `mode` -> `DISABLED`；非空 `DSH_TELEMETRY_DISABLED` 是硬 opt-out。
- 由一个所有者把关；不在纯解析深处读 process.env。
- 关闭时隐藏/移除活动内容（remount），而不只是控件。
- 稳定化是删除闸门，不是改名；显式保留被取代的历史默认值，而不是抹掉历史。

**完成信号。** `dsh meta --experimental` 与 `DSH_EXPERIMENTAL=1 dsh meta` 运行；`DSH_EXPERIMENTAL=0` 与裸命令以 exit 1 失败并点名两个 opt-in；`ui-developer-tools.enabled` Host schema 默认 `true`，偏好解析后 `ui-settings.enabled` 为 `true`，已保存 `false` 仍关闭脚本化 HTML/iframe；未设置/空 `DSH_TELEMETRY_MODE` 解析为 `FEEDBACK_ONLY`，插件省略 `mode` 为 `DISABLED`，`FULL` 被拒。

**失败、例外与证据限制。** 假值（0/false/空）不启用实验命令，只有 1 启用；已保存的开发者工具 false 不渲染脚本化内容，关闭时重挂载/移除活动内容；把 FEEDBACK_ONLY 当作 DISABLED 或声称普遍默认关闭的遥测配置失败。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-claims-disclosed`、`rationale-feature-3-scoped-enforcement`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-07-31-experimental-subcommand-gate.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-17-developer-tools-settings.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-09-20-developer-tools-default-on.md:12-16@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:12-20@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-experimental-subcommand-gate.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-17-developer-tools-settings.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-09-20-developer-tools-default-on.md:12-16@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:12-20@687f282e

<a id="rationale-feature-3-scoped-enforcement"></a>
### `rationale-feature-3-scoped-enforcement` — 在最窄所有者处强制，并明确范围

**问题。** 只隐藏 UI 而不改变底层能力会留下活动内容；全局施加策略又会破坏无关表面。

**前置条件。** 功能开关/沙箱/权限只影响部分系统，且能力 owner 可销毁活动实例。

**责任者。** 能力所有者、设置层、安全 reviewer。

**执行步骤。**
1. 识别能力边界。
2. 在 owner 处强制。
3. 关闭时 dispose。
4. 声明范围。
5. 测试关闭副作用。

**必须做到。**
- 在能力所有者（渲染器、sandbox、provider）处强制，不只在控件处。
- 关闭时必须 dispose/remount 活动内容，而不只是隐藏按钮。
- 把设置/策略限定到它真正治理的表面，并声明范围。
- 按会话的隐私/遥测选择只作用于该会话，不泄漏到其他会话。
- sandbox/权限模式明确列出允许与拒绝的内容。

**完成信号。** 关闭 developer tools 会移除活动 View/tab bar 并 dispose iframe。

**失败、例外与证据限制。** 隐藏但仍运行的脚本是缺陷；按会话遥测选择不影响另一会话；重新启用从当前设置重建，无残留活动内容。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-experimental-gate-default-off`、`rationale-feature-3-layered-enforcement`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-17-developer-tools-settings.md:12-18@687f282e`
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-19-windows-acl-mandatory-integrity-confinement.md:11-23@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:12-20@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-17-developer-tools-settings.md:12-18@687f282e 来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-19-windows-acl-mandatory-integrity-confinement.md:11-23@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-feedback-gated-telemetry-default.md:12-20@687f282e

<a id="rationale-feature-3-single-base-default"></a>
### `rationale-feature-3-single-base-default` — 无表面覆盖时使用唯一共享基线默认值

**问题。** 多个组合各自定义 fallback，会让新表面静默不同，修复也要重复。

**前置条件。** 多个组合共享默认值，且有组合合并机制。

**责任者。** 组合所有者、表面所有者。

**执行步骤。**
1. 抽取默认值。
2. 加入 base 层。
3. 覆盖显式化。
4. 测试继承。

**必须做到。**
- 把默认值放在一个共享 base 组合/层；表面组合只做显式覆盖。
- 不在每个组合复制默认值；缺少覆盖即用 base。
- 命名优先级：表面 > base > 缺失。
- 共享默认值的变化对所有消费者可见；至少测试一个覆盖与一个继承用例。
- 最小 profile 使用独立的 bare 运行时组合，而不是把完整组合的功能隐藏起来。

**完成信号。** 无覆盖的组合得到共享默认值。

**失败、例外与证据限制。** 重复的本地默认值在 review 中删除；显式移除能力的组合必须写明。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-shared-presentation-defaults`、`rationale-feature-3-single-owner-contract`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-01-shared-base-web-fetch-default.md:14-20@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-07-31-web-default-search.md:14-24@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-minimal-profiles-bare-two-tool-runtime.md:1-40@687f282e`

---

## 七、外部协议、诊断与治理迁移

来源：deepseek-harness/.agents/notes/archived/feature/2026-09-01-shared-base-web-fetch-default.md:14-20@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-07-31-web-default-search.md:14-24@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-minimal-profiles-bare-two-tool-runtime.md:1-40@687f282e

<a id="rationale-feature-3-predecessor-lineage"></a>
### `rationale-feature-3-predecessor-lineage` — 记录取代谱系并保留既有决定

**问题。** 新笔记或决定静默替换旧决定，读者无法判断哪些仍成立，旧约束无审计线索地消失。

**前置条件。** 新决定修改既有决定，且旧 Note 可保留与链接。

**责任者。** Note 作者、reviewer、后续维护者。

**执行步骤。**
1. 识别前驱。
2. 写 supersede/update 块。
3. 区分保留与替换的事实。
4. 归档双方。
5. 从当前 Note 链接。

**必须做到。**
- 点名前驱，说明哪些事实被取代、哪些仍成立。
- 保留前驱可读；归档而不是重写历史。
- update 块记录后来移除/改变了什么机制。
- 不静默改名规避谱系；迁移说明是变更的一部分。
- 当前权威是最近一次显式决定，不是未标记的旧笔记。

**完成信号。** 读者能从 update/supersedes 块读到前驱与恰好被取代的事实；ACP 第 9 行 blockquote 保留 editor-bridge 谱系并说明 multiplexing 决定未变。

**失败、例外与证据限制。** 与前任矛盾却未点名的笔记在 review 中退回；update/supersedes 块必须点名前驱与恰好被取代的事实；后来笔记可显式恢复被取代事实，同样带谱系。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-claims-disclosed`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-06-14-acp-multi-session.md:1-26@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:1-20@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-06-14-acp-multi-session.md:1-26@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-11-background-job-completion-wakes-an-idle-owner.md:1-20@687f282e

<a id="rationale-feature-3-maintained-protocol-owner"></a>
### `rationale-feature-3-maintained-protocol-owner` — 使用维护中的协议所有者；不 fork 或重写协商

**问题。** 手写协议协商或 fork SDK 会偏离标准、漏掉能力并放大维护。

**前置条件。** 连接外部协议，且存在维护中的 SDK/客户端。

**责任者。** 集成所有者、SDK 维护者、插件。

**执行步骤。**
1. 采用维护客户端。
2. 只拥有生命周期/配置。
3. 处理能力错误。
4. 对真实服务器测试协商。

**必须做到。**
- 连接、协商与 transport 生命周期委托给维护中的 SDK/库。
- 自有 seam 保持薄：配置解析、生命周期、策略。
- 所有者已提供版本协商时，不从零重写。
- 一个连接 generation 使用一个 protocol 实例；不跨 transport 复用。
- 不支持的能力显式报告，不假装。

**完成信号。** `dsh-mcp-client` 依赖官方 `@modelcontextprotocol/client`（固定提交 manifest 为 2.2.0；归档 Note 写 2.0.0，属历史），`new Client(..., { versionNegotiation: { mode: 'auto' } })` 把协商交给 SDK；发现调用高层 `client.listTools(undefined, { cacheMode: 'refresh' })`，每个工具调用委托 `client.callTool(..., { toolDefinition: tool })`；bridge 没有并行分页实现。

**失败、例外与证据限制。** 不支持能力被报告而非模拟；不存在第二份 wire 实现；协商失败报错，重连开新 generation。资源列表方法只原样传递 SDK cursor，不自行迭代。证据限制：源 Note 的 Testing/Verification 未由本分区执行；固定提交的实现与 manifest 已读，但测试未运行；版本号必须从当前 manifest 重取，不能照抄归档 Note。

**关联机制。** `rationale-feature-3-bounded-remote-recovery`、`rationale-feature-3-first-party-rewrite`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-09-12-mcp-sdk-protocol-negotiation.md:12-24@687f282e`
- `deepseek-harness/.agents/notes/archived/feature/2026-08-06-mcp-client-auto-reconnect.md:12-27@687f282e`
- `deepseek-harness/packages/mcp/mcp-client/package.json:31-52@687f282e`
- `deepseek-harness/packages/mcp/mcp-client/src/connection.ts:257-275@687f282e`
- `deepseek-harness/packages/mcp/mcp-client/src/tools.ts:118-143@687f282e`

---
来源：deepseek-harness/.agents/notes/archived/feature/2026-09-12-mcp-sdk-protocol-negotiation.md:12-24@687f282e 来源：deepseek-harness/.agents/notes/archived/feature/2026-08-06-mcp-client-auto-reconnect.md:12-27@687f282e

<a id="rationale-feature-3-diagnostic-reads"></a>
### `rationale-feature-3-diagnostic-reads` — 诊断只观察，不取得所有权或改动状态

**问题。** 以所有者身份订阅、写日志或带副作用 replay 的 inspector 会改变它测量的系统。

**前置条件。** inspector 读取实时状态/历史，且存在只读 API。

**责任者。** inspector、运行时、日志。

**执行步骤。**
1. 打开只读视图。
2. 有界读取。
3. 避免取得所有权或写订阅。
4. 关闭无副作用。
5. 标注范围。

**必须做到。**
- 诊断视图只读：不写被观察日志/状态、不取得所有权、不做带副作用 replay。
- 使用弱/惰性引用与有界读取，避免检查保活资源。
- 诊断事实标注来源与范围；不得把部分视图呈现为完整。
- 关闭/取消 inspector 不取消被观察工作，除非显式请求。
- 诊断路径不得成为第二渲染/推导权威。

**完成信号。** Session Inspector 不注册 resource provider、Conversation header slot、composer 或 product navigation API；Session Controller 与 Chat 保留数据所有权；只有选中的 table 订阅；日志读取使用既有 loaded window 与分页。

**失败、例外与证据限制。** 打开/关闭默认 inspector 不改变所有权或运行状态；缺失/部分记录显示不可用，不发生重建写入。**独立特权例外（不属于只读契约）：** 默认关闭的 `inspector-profile` optional bundle 的 patch 启用 `experimental-inspector` 并设 `captureFetch: true`；启用后会启动 NodeJS Inspector，允许本地代码执行并捕获未脱敏的 Host fetch（完整 URL、请求/响应头、body、状态、时序、错误、取消）；关闭调试窗口不停止捕获。脱敏是采纳要求，不是源行为。证据限制：源 Note 的 Testing/Verification 未由本分区执行；固定提交的 note、bundle patch、capture 实现与 README 已读，但测试未运行。

**关联机制。** `rationale-feature-3-no-fabricated-coverage`、`rationale-feature-3-committed-state-only`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/implemented/feature/2026-09-24-session-inspector.md:11-30,26-28@687f282e`
- `deepseek-harness/packages/experimental/inspector-profile/cordis.patch.yml:1-5@687f282e`
- `deepseek-harness/packages/experimental/inspector/src/host/inspection/network.ts:39-160@687f282e`
- `deepseek-harness/packages/experimental/inspector/README.md:136-137,143-151@687f282e`

---
来源：deepseek-harness/.agents/notes/implemented/feature/2026-09-24-session-inspector.md:11-30@687f282e

<a id="rationale-feature-3-first-party-rewrite"></a>
### `rationale-feature-3-first-party-rewrite` — 把晋升的第三方功能重写为一方代码

**问题。** vendoring 社区插件会保留其未测 JavaScript、外部版本闸门与外来所有权；给它豁免会制造第二包类。

**前置条件。** 社区/第三方功能被晋升，且仓库有 host/client 包 seam 与标准闸门。

**责任者。** 功能所有者、平台 reviewer、安全 reviewer。

**执行步骤。**
1. 映射第三方行为。
2. 重写到自有包。
3. 复用共享原语。
4. 删除外部闸门/插件依赖。
5. 运行标准闸门与信任围栏。

**必须做到。**
- 在仓库自有包中重写功能，遵守 typecheck、coverage、i18n 与 invariant 闸门。
- 按既有 host/client 包 seam 拆分所有权；复用共享工具，不 vendor lib/。
- 删除外部版本兼容闸门；一方包随仓库版本化。
- 每条新路由保留信任围栏（origin/auth）。
- 持久选择使用共享 snapshot store，不手写存储。
- 一方重写不得保留并行插件路径。

**完成信号。** 功能作为一方包通过 typecheck、coverage、i18n 与 invariant 闸门。

**失败、例外与证据限制。** 带豁免的 vendored lib/ 被拒；外部 DSH-version 闸门不再存在；重写回归时不以旧插件作静默回退。 证据限制：源 Note 的 Testing/Verification 未由本分区执行；平台相关行为需在采纳环境复验。

**关联机制。** `rationale-feature-3-maintained-protocol-owner`、`rationale-feature-3-trust-boundary-per-surface`。

**原文证据（commit `687f282e`）。**
- `deepseek-harness/.agents/notes/archived/feature/2026-08-25-promote-open-anywhere-plugin.md:12-31@687f282e`

---

## 附录 A：产品专属处置与未提炼内容

以下类型只保留为产品事实，不作为可迁移治理机制：

- 纯视觉/文案/布局细节（启动标语、无 banner、提示语主题、字号、圆角、焦点色、diff 卡片排版、宽度拖拽、菜单行内容等）：其治理价值仅在“共享默认值/单一权威”等机制中体现，具体像素与文案不外推。
- 单次产品功能（模型选择器、计划卡、反馈弹窗、配额充值、侧栏浏览器、终端、桌面运行时、插件市场索引等）：只有当它们暴露了并发、身份、信任边界、格式或恢复规则时才被提炼；其余实现细节留在 coverage 的 product-only 处置。
- 实验或延迟提案（Desktop update extensions 等）：保留为“未实现/未验证”，不得被引用为现行保证。

## 附录 B：证据边界与未决问题

- 本参考没有执行任何构建、测试、lint、格式化或远程操作；所有“验证”均为后续实施者应执行的计划。
- 源 Note 中提到的测试文件、快照与平台行为只作为源作者声明，未由本分区复核。
- 跨域依赖（例如会话日志、权限服务、UI 设计系统）尚未在本分区内绑定到实际代码；需要相应域的实施证据后才能声称端到端成立。
- 平台限制（Windows 文件锁语义、advisory flock、网络文件系统、Electron/浏览器差异）来自源 Note 的陈述；采用者必须在本机复验。
- 工具对超长源码行按约 768 字符截断；本分区对 16 处关键英文行使用 raw 重读，其余超阈值长行未逐字符核对。
- 抽查 sidecar 确认两种语言同等权威且 sidecar 只记录两侧 blob hash；未逐行打开全部 89 个 sidecar，配对哈希一致性未验证。

来源：deepseek-harness/.agents/notes/archived/feature/2026-08-25-promote-open-anywhere-plugin.md:12-31@687f282e