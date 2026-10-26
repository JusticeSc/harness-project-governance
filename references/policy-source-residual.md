# policy-source-residual：策略源残差

本域检查了 67 个此前无人认领的源码文件。结论是：**没有新的治理机制**。其中 30 个文件是既有机制的规范执行点，37 个是产品运行时实现。为它们另造机制 ID 会与既有机制重复；本参考因此按“既有机制在本域的落点”组织，并给出产品/治理的判别依据。

**源证据总览**：兼容性与启动降级见 `deepseek-harness/packages/boot/app-boot/src/compatibility-preflight.ts:1-187@687f282e`、`deepseek-harness/packages/boot/app-boot/src/plugin-compatibility.ts:1-117@687f282e`、`deepseek-harness/packages/boot/app-boot/src/profile-compatibility.ts:1-141@687f282e`；构建批准见 `deepseek-harness/packages/boot/plugin-manager/src/build-approval.ts:1-81@687f282e`；浏览器 release 一致性见 `deepseek-harness/packages/client/modules/src/client/manifest.ts:1-330@687f282e`、`deepseek-harness/packages/client/modules/src/client/release-change.ts:1-88@687f282e`、`deepseek-harness/packages/client/ui-settings-general/src/client/HostReleasePrompt.tsx:1-89@687f282e`。其余落点的路径与范围见同域 coverage 的 67 条记录。

## 判据与边界

- **治理**：文件本身是规范/门禁，或它是既有治理机制的实际执行点。判别标准不是文件名，而是它是否约束“维护者如何修改、发布、验证项目”，并且该约束是否已被某个既有机制陈述。
- **非治理**：纯产品运行时的授权、UI 呈现、浏览器偏好持久化、通信协议类型、错误文案转换、预览清单校验等。它们约束产品行为，不是维护者的变更流程。
- **复用优先**：若既有机制已经陈述了同一义务，只引用其 ID 并补上执行点证据；不要因为源码实现了更多分支就新建机制。本域三个最像“新机制”的候选，最终都落回既有机制：
  - 兼容性预检/豁免 → `package-contracts-2.plugin-compatibility-exemption` + `package-contracts-5.degraded-startup-and-retry`；
  - 构建脚本批准 → `rationale-architecture-3.arch3-M06`；
  - 客户端 release 一致性 → `package-contracts-6.compatibility-and-version-migration`。

- 另有若干执行细节（指令来源去重与 baseline 身份、Windows ACL 私有 temp 与 workspace 不重叠、webworker image manifest 的 lowering 版本校验）未被既有机制的 obligations 逐字列出；本域仍按执行细节处理，并在 coverage 的 `unresolved` 中留下审计入口，而不是新建机制。

## 兼容性准入与豁免

**既有机制**：`package-contracts-2.plugin-compatibility-exemption`（精确版本对、显式风险、不继承）与 `package-contracts-5.degraded-startup-and-retry`（启动时跳过不兼容 bundle、损坏豁免文件转只读）。本域源码是它们在 profile 组合入口的执行半边。

**执行顺序**：
1. 在组合树挂载前 `structuredClone` 行；`profileContext` 不存在时原样返回，非 profile 调用不启用该门禁。
2. 读取 `<profileDir>/compatibility.json`。不存在=无豁免；不可读/非法 JSON=授权为空、告警、`rewritable:false`，但**不阻止启动**。逐条只接受精确 `package-name@version` → 精确 DSH 版本数组；无效记录跳过并告警，其他有效记录仍生效。
3. 解析每行 manifest：`engines.dsh` 存在时单独决定；否则每个 `@deepseek-ai/dsh*` peer 都必须满足。peer 的 `workspace:^`/`~`/`*` 映射到当前运行时；`engines.dsh` 的 `workspace:` 前缀、空串、非法 range 一律不满足。预发布版本参与比较。
4. 不满足时要求插件 `name`/`version` 非空，用 `name@version` 查精确豁免，并要求列表包含**当前**运行时版本。缺 manifest 不是兼容性结论，保留给 Loader 报导入失败；requirement 元数据读坏则拒绝该行（fail-closed）。
5. 只把兼容冲突转成拒绝：普通行 `disabled:true`；group 同时取消 `group` 并递归 `config`；原生 Include 内任一行被拒则整个 Include 行被拒（该文件不会被改写）；动态 Include 不预判。诊断在插件加载前写 stderr。
6. 授予豁免要求精确包版本 + 精确当前运行时 + `acceptRisk:true`；撤销可命名历史运行时。写入在文件锁内重读，`rewritable:false` 时拒绝覆盖，原子写 0600。

**完成信号**：不兼容行被禁用并给出具体 reason；兼容行不变；坏权限文件只产生告警而不阻断 profile。**失败处理**：不要在异常时默认放行，不要把 `engines.dsh` 与 peers 合并判断，不要为被拒的 Include 改写源文件。**例外**：动态 Include、缺失 manifest、非 profile 上下文都保留原行为。**证据限制**：未读 CLI/插件管理器的 grant 交互，未执行 profile 启动；`package-contracts-2.plugin-compatibility-exemption` 与 `package-contracts-5.degraded-startup-and-retry` 的 grant/启动验证仍是目标仓库的 planned 工作。

## 构建脚本批准

**既有机制**：`rationale-architecture-3.arch3-M06` 已规定“构建批准只改 pending 的确切名称，保留无关 YAML，拒绝 anchor/alias，stale retry 不能覆盖后续拒绝”。本域源码补足了待决项的来源。

**执行顺序**：
1. 捕获非交互安装的失败输出，匹配 `Ignored build scripts:`；只接受逗号分隔的精确包名，排除 `*`/`?`。
2. 读取 `pnpm-workspace.yaml`；必须是 mapping；`allowBuilds` 若存在也必须是 mapping，且不得含 YAML anchor/alias。
3. 对未被记录的报告名写入字面占位 `set this to true or false`；保留其余内容与注释，原子写 0600。
4. 批准只接受当前待决列表中的名字；任一名字不再 pending 即整批拒绝并返回 stale-approval，不做部分写入。空列表不写。批准只改策略，不执行脚本。
5. 拒绝时保持占位或 `false`，下一次安装继续报告。

**完成信号**：每个报告名都有明确布尔值，无通配被当作单包批准。**失败处理**：YAML 形状、anchor/alias、过期批准都报错并保持文件不变。**例外**：文件不存在按空映射处理；通配规则可存在但不进 pending/可批准集合。**证据限制**：正则与占位文案未跨 pnpm 版本验证，未执行真实安装。

## 浏览器客户端 release 一致性

**既有机制**：`package-contracts-6.compatibility-and-version-migration` 已规定“客户端模块图携带 release identity（version + commit）；页面只应用自己的 boot release 并报告 release change”。本域源码是它的 wire 与 UI 执行点。

**执行顺序**：
1. 在 wire 边界解析 `window.__DSH_BOOT__`：`rev` 字符串；`release` 可缺省，存在时 `version` 字符串、`commit` 若存在为字符串；entries 的 `id`/`url`/`rev` 均为字符串且 id 唯一；可选的 `inject`/`external` 为字符串数组，`immediately` 为布尔。
2. batches：`phase` 只能是 `bootstrap`/`application`；`url`/`rev` 字符串；batch URL 唯一；`entries` 非空、只引用已知 entry、每个 entry 恰属一个 batch。任何畸形抛错，让页面启动失败。
3. 页面保存 boot release；收到 Host 图先 `observe(release)`；只有 `version` 与 `commit` 全部相等（两者都缺省也相等）才返回 true 并允许应用图/重建帧。
4. 不匹配时暂停所有插件更新并公告一次，不得只应用“兼容部分”。`dismiss()` 只停止公告并记住被 dismiss 的 release；页面仍保持 boot release，仍拒绝其他 release。刷新是唯一完成迁移的动作。
5. 提示框默认焦点放在“稍后”，避免无手势弹窗被 Enter 直接刷新；文案同时展示 Host 已完成切换与页面待完成切换。release 解码只取 version/commit 并容忍额外字段。

**完成信号**：跨 release 的图/帧从未被应用；用户明确刷新后新页面从新 release 启动。**失败处理**：畸形图硬失败；release 不匹配时保留旧图且不抛未处理异常。**例外**：Host 不发布 release 时两端都是 `undefined`，视为同一 release；页面本地直接注册、未经 boot graph 的模块不受 gate 约束。**证据限制**：Host 侧图生成器不在本域，未执行双 release 集成测试；若 Host 不写 release，gate 会永久视为同一 release。

## 其他既有机制的实现点

| 本域文件 | 既有机制 | 实现的义务 |
| --- | --- | --- |
| `packages/context/agent-instructions/src/{config,index,render}.ts` | `agent-workflows-instruction-tiers` | 项目根发现、候选顺序、单文件/批次字节预算、baseline identity、user-global/agents-global 去重、按字节截断与 omitted/truncated 记录 |
| `packages/core/session/src/types.ts` | `package-contracts-1.session-event-and-projection-contract`、`rationale-simplification-1-single-source-durable-truth`、`persistence-historical-finalized.named-adjacent-migrations` | SESSION_FORMAT_VERSION=4、ignorable 缺省 required、lossless JSON、SurfaceOp/sourceEventSeqs 限制、end-seed 仅构造器写入 |
| `packages/session/session-format-v{0-to-1,1-to-2,2-to-3,3-to-4}/src/migration.ts` | `persistence-historical-finalized.named-adjacent-migrations`、`release-session-migrations` | 具名相邻迁移、严格源/目标 header、稠密 seq、引用重映射、V3→V4 显式 child evidence、不默认/不 fallback |
| `packages/session/session-persistence-jsonl/src/{catalog-migration,migration-verifier}.ts` | `release-session-migration-preparation`、`release-session-authority` | 历史 child facts 先收集后发布、物理 witness 重验、Worker 隔离验证、并发上限 2 |
| `packages/session/session-persistence/src/storage-contract.ts` | `package-contracts-3.durability-and-crash-semantics`、`package-contracts-1.session-event-and-projection-contract` | 版本门禁、未知 required 事件拒绝、退休 fallback 拒绝、一次快照校验写入值、seq 连续 |
| `packages/storage/storage/src/index.ts` | `package-contracts-2.storage-domain` | 具名 backend 并存、重复 form 拒绝、stale disposer 保护、默认导出服务类 |
| `packages/sandbox/sandbox-windows-acl/src/path-boundary.ts` | `package-contracts-2.sandbox-fail-closed`、`package-contracts-4.sandbox-fail-closed-and-escalation` | realpath 后目录包含判断、temp 必须在 workspace 外、private temp 与 writable 双向不重叠 |
| `packages/experimental/hooks-codex/src/index.ts` | `package-contracts-2.hook-bridge-compat-subset`、`package-contracts-3.untrusted-content-boundary` | 五个 hook 点、regex-only、失败包容、只执行 blocking、context 不是 veto、Stop deny 强制继续 |
| `packages/llm/llm/src/retry-policy.ts` | `package-contracts-2.llm-retry-durable` | provider 所有策略、normal/always、未知键拒绝、backoff 边界、冻结结果 |
| `packages/ptc-runtime/ptc-runtime/src/types.ts`、`packages/experimental/ptc-runtime-python/src/index.ts` | `package-contracts-2.ptc-runtime-portable`、`package-contracts-2.sandbox-fail-closed` | lossless JSON、可移植绑定名、正交失败类别、fd3 协议、CPU/地址空间/输出/墙钟预算、进程组 teardown |
| `packages/experimental/webworker-runtime/src/image-manifest.ts` | `package-contracts-2.webworker-vfs-pack` | lowering 版本不匹配拒绝、相对路径无 traversal、archive/file 唯一、size 非负 |
| `packages/util/http-proxy/src/policy.ts` | `user-and-publication-contracts.proxy-egress-policy` | 大小写代理变量、回环 no_proxy 强制合并、只路由 http(s)、SOCKS/非法值诊断而非静默丢弃 |
| `packages/typert/generator/src/cordis-catalog.ts` | `documentation-cordis-catalog-partition`、`documentation-generated-reference-freshness` | 签名类型必须分类到 linked page/foundation/exemption，聚合抛错 |
| `packages/client/resources/src/client/contract.ts`、`packages/client/ui-commands/src/client/contract.ts` | `package-contracts-1.extension-seams-ui-and-resources` | 单 provider、重复注册抛错、命令冲突不 shadow、decoration 不制造行 |
| `packages/client/store/src/contract.ts` | `engineering-client-component-contract` | 声明式完整写集、每实例新状态、handle 不得模块级单例、组件不见实例 |

## 非治理的具体判据

以下文件不是“因为位于产品目录”而排除，而是逐一看过其导出与实现后判定：

- **归档会话/任务/subagent 授权**：`ArchivedSessionGate`、`installTurnArchiveAdmission`、`installJobArchiveAdmission`、`installSubagentArchiveAdmission` 阻止已归档 Session 及其后代继续运行；这是产品会话生命周期，不是发布流程。
- **上传/协议/错误**：`admitEncodedImages`/`admitEncodedFile` 的 canonical base64；`serviceBoundary.sanitizeError` 的模型安全错误映射；`parseFetchUrl`/`classifyContentType` 的 fetch 输入约束。它们保护产品输入，不约束项目变更。
- **客户端呈现与偏好**：审批面板/命令、聊天展示策略、快捷键与侧栏布局持久化、设置页 slot、Markdown 导航、数学语法、翻译显示控制器。它们是 UI 行为与浏览器状态。
- **开发/预览辅助**：HMR 的 Node package 缓存失效、插件显示元数据读取、WebPreview fixture 目录校验、侧栏浏览器状态。它们是开发或预览工具的正确性。

## 迁移检查清单

1. 不要把本域的 30 个治理执行点再拆成新机制；按上表引用既有 ID，并把本域 coverage 的范围作为新增证据。
2. 兼容性准入必须保留“挂载前、只拒冲突、坏权限文件不阻断启动、精确对不继承、Include 整树拒绝”。
3. 构建批准必须保留“精确名、原子写、锁内重读、过期整批拒绝、不执行脚本”。
4. 客户端 release 一致性必须同时改 Host 产出与浏览器消费端；只加 gate 不会产生 release 身份。
5. 产品运行时模块只有在目标项目确实要复用其产品行为时才迁移；不要把 UI/授权实现误写成治理门禁。
6. 本域所有验证均为 `planned`；目标仓库应补真实夹具后再声称通过。

## 证据限制

- 大文件只读选定区段：`ptc-runtime-python/index.ts` 1-40；`client/modules/manifest.ts` 1-330；`cordis-catalog.ts` 1-70；`settings-general/index.ts` 1-130；`settings-models/index.ts` 1-100；`ui-user-questions/index.ts` 1-100；`ui-workspace/index.ts` 1-100；`session-query/corpus.ts` 1-100；`http-proxy/policy.ts` 1-120；四个 migration 的前 110-120 行（V3→V4 全文）。
- 未运行构建、测试、格式化、pnpm 安装、profile 启动、浏览器或 Worker 验证。
- 分配路径全部为 TypeScript/TSX 源码，没有 `.zh.md` 手工对照正文；因此不存在需要补读的中文契约正文。
