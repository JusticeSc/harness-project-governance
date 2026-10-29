# 持久化变更记录（persistence-current-records）操作参考

本参考面向维护“当前仍有效的持久化类型变更记录”的编码代理与评审者，内容来自 `docs/persistence-changes/` 下 16 条带日期记录、双语对侧文件、配对侧车（`*.i18n.yaml`）、生成的 after-schema 快照（`*.schema.json`）以及目录 README。目标：让安装后的消费者不依赖源仓检出，也能判断“某次持久化类型改动是否需要记录、记录长什么样、如何通过本地验证器、以及哪些结论验证器根本无法证明”。

**证据约定**：`deepseek-harness/<path>:<start>-<end>@687f282e` 指向固定提交的源仓。`【源仓义务】` 表示文档明确要求；`【源仓实现事实】` 表示在该提交中观察到的结构/数据；`【迁移设计】`、`【额外建议】` 是本参考给出的适配建议。生成的 JSON/YAML 侧车未被逐行散文阅读，按“机器解析”标注。

## 目录与读者触发器

| 你正在做什么 | 先读 |
|---|---|
| 改了会被写进 Session 的字段/事件类型，想知道要不要记录 | [兼容性决策](#persistence-current-records.compatibility-decision) |
| 要新建一条变更记录 | [四件套](#persistence-current-records.record-quadruple)、[机器声明](#persistence-current-records.machine-declaration) |
| 要写 Compatibility / Verification 段落 | [同版本证据](#persistence-current-records.same-version-evidence) |
| 要给普通事件加 `data.version` 载荷分支 | [载荷版本演进](#persistence-current-records.payload-version-evolution) |
| 新增/修改消息来源 kind | [归属策略](#persistence-current-records.attribution-policy) |
| 要禁止一个旧 JSON 字段 | [禁止字段保留](#persistence-current-records.reserved-field) |
| 记录之间的前驱/后继关系出错 | [历史图](#persistence-current-records.history-graph)、[当前根一致](#persistence-current-records.current-root-agreement) |
| 摘要（digest）对不上或想确认“什么不算变化” | [摘要口径](#persistence-current-records.digest-scope) |
| 要冻结一个已接受的格式基线 | [定稿检查点](#persistence-current-records.finalized-checkpoint) |
| 要修正一条还没被接受的末端记录 | [末端刷新](#persistence-current-records.terminal-refresh) |
| 中文侧或 `*.i18n.yaml` 不一致 | [双语配对](#persistence-current-records.bilingual-pairing) |
| 想拿旧 tag/RC 归档当兼容性依据 | [归档分离](#persistence-current-records.archive-separation) |
| 要提升 `SessionHeader.version` | [版本提升与迁移边](#persistence-current-records.version-bump-migration) |
| 想知道自动检查到底保证了什么 | [验证器信任边界](#persistence-current-records.verifier-trust-boundary) |

## 0. 范围与非范围

**范围内（本域 67 个文件）**

- `docs/persistence-changes/README.md` 与 `README.zh.md`：所有权、兼容性规则、历史与限制（`deepseek-harness/docs/persistence-changes/README.md:1-90@687f282e`）。
- 16 条 `YYYY-MM-DD-slug.md`：英文确认记录，含 `kind: persistence-change` 前置元数据、机器声明、兼容性说明、验证证据（例：`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:1-52@687f282e`）。
- 16 条 `.zh.md`：中文对等契约，正文已逐行 raw 阅读并与英文机制对照；机器声明必须与英文逐字节相同（`deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.zh.md:22-45@687f282e`）。
- 17 个 `.i18n.yaml`（16 条记录 + README）：按标题分段的英/中哈希侧车（`deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:1-28@687f282e`）。
- 16 个 `.schema.json`：受影响根在变更后的完整规范化快照（例：`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.schema.json:1-76@687f282e`）。

**范围外（由其他域拥有，不要在本域重复实现）**

- `docs/persistence-changes/finalized/vN.json`、`releases/`、`historical-formats/`：发布域。
- `scripts/persistence-changes.ts`、`scripts/persistence-schema.ts`、`scripts/persistence-schema-model.ts`、`scripts/persistence-finalization.ts`：验证器/生成器实现，发布域。
- `docs/persistence-catalog.md`、`docs/persistence-schema.json`、`scripts/gen-persistence-catalog.ts`：生成物与生成器，文档域。
- `.agents/skills/dsh-doc/templates/persistence-change.md`、`scripts/translation-pairing*.ts`、`scripts/verify-translation-pairing.ts`、`docs/i18n/*`：文档域。
- CI 是否真的挂了这些检查：自动化/发布域；本域只能证明文档声明了这条门禁。

<a id="persistence-current-records.record-quadruple"></a>
## 1. 记录四件套与所有权

### 触发
新增、修改或删除任何被 Session 持久化的声明类型；补一条历史遗漏；准备把一个格式标记为已接受。

### 源仓义务
每条带日期的记录恰好有四个同目录文件（`deepseek-harness/docs/persistence-changes/README.md:31-44@687f282e`）：

| 文件 | 所有者与内容 |
|---|---|
| `YYYY-MM-DD-slug.md` | 英文确认文档：`kind: persistence-change`、**一份**机器声明、兼容性推理、验证证据 |
| `YYYY-MM-DD-slug.zh.md` | 中文对侧：机器声明必须与英文相同 |
| `YYYY-MM-DD-slug.i18n.yaml` | **生成**的双语一致性记录（按标题分段的哈希） |
| `YYYY-MM-DD-slug.schema.json` | **生成**的完整 after schema，只含仍存在的受影响根 |

英文记录的固定骨架：前置元数据 `description` + `kind: persistence-change`；H1 为记录 id；`English | [中文](<id>.zh.md)` 链接；`## Summary`；`## Table of Contents`；`<a id="declaration"></a>## Declaration`；`<a id="compatibility"></a>## Compatibility`；`<a id="verification"></a>## Verification`；`<a id="dev-note"></a>## Dev Note`。中文侧使用相同锚点 id（`declaration`/`compatibility`/`verification`/`dev-note`），标题文字可为中文（`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.md:1-48@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.zh.md:1-48@687f282e`）。

记录模板由 `.agents/skills/dsh-doc/templates/persistence-change.md` 定义；记录创建命令接受**双语散文输入**并生成机器声明、快照、目录对和一致性记录（`deepseek-harness/docs/persistence-changes/README.md:44-44@687f282e`）。本域文件没有给出该创建命令的确切命令名，不要臆造。

### 步骤
1. 确认改动影响哪些根（见 [根清单](#persistence-current-records.root-inventory)）。
2. 选定记录 id：`YYYY-MM-DD-<slug>`，文件名与声明 `id` 一致。
3. 生成/编写四个文件；英文与中文的声明块必须逐字节相同。
4. 生成 after-schema 快照；若某根被删除，快照中不出现该根，并在声明用 `after: null` + 显式 tombstone 表达。
5. 运行常规验证器与 `doc-sync`，再提交（`deepseek-harness/docs/persistence-changes/README.md:42-44@687f282e`）。
6. 评审者核对 Compatibility 与 Verification 是否描述真实读取器行为、是否给出实际执行的命令（`deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e`）。

### 完成信号
- 验证器只从英文文件读取一次声明，并检查中文声明相等（`deepseek-harness/docs/persistence-changes/README.md:44-44@687f282e`）。
- 生成侧车与声明中的 `after` 摘要逐根一致（本域 16 份快照全部核对通过，见 coverage 记录）。
- 双语配对哈希与标题分段一致（`*.i18n.yaml`）。

### 失败处理
- 中文声明与英文不一致：先修声明，不要手改 `.i18n.yaml` 掩盖。
- 快照根集合与声明根集合不一致：重新生成快照；不要手写节点。
- 记录被后续记录依赖后再改：见 [历史图](#persistence-current-records.history-graph) 与 [定稿检查点](#persistence-current-records.finalized-checkpoint)。

### 例外
- 基线记录没有前驱，但仍遵守四件套。
- 删除根没有 after schema，只有显式 tombstone。
- `.i18n.yaml` 与 `.schema.json` 永远由工具生成，人工只改 `.md`/`.zh.md`。

来源：deepseek-harness/docs/persistence-changes/README.md:31-44@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:31-44@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:1-52@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.md:1-48@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:1-28@687f282e

<a id="persistence-current-records.machine-declaration"></a>
## 2. 机器声明

### 触发
任何记录的新建、修订、复制或评审。

### 源仓义务
声明是一个围栏代码块 ` ```yaml persistence-change `，字段固定（`deepseek-harness/docs/persistence-changes/README.md:40-44@687f282e`）：

```yaml persistence-change
schemaVersion: 1
id: 2026-09-12-auto-review-error-metadata
baseline: false
changes:
  - root: "event:tool/ptc-dispatch"
    previous: "2026-09-11-initial"     # 前驱记录 id；新根为 null
    after: "b5d66e…d06796"             # 64 位十六进制摘要；删除为 null
    decision: same-version             # same-version | version-bump
```

- `root` 取值：`SessionHeader`、`JsonlHeaderLine`、`SessionEventEnvelope`，或 `event:<事件类型>`（例如 `event:tool/result`）。
- `previous` 指向**记录 id**，不是根名；新根写 `null`。
- `after` 是该根在变更后的完整摘要；删除写 `null` 并保留显式 tombstone。
- `baseline: true` 只用于初始清单，所有根 `previous: null`；其余记录为 `false`。
- 声明列出每个受影响根；一次记录可以同时改多个根（初始记录 59 个根；`2026-09-16-session-format-v4` 14 个根；`2026-09-14-image-offload` 13 个根）。
- 验证器从英文读取一次，检查中文声明相等；它不判断记录是生成还是手工编辑（`deepseek-harness/docs/persistence-changes/README.md:44-44@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）。

### 【源仓实现事实】
本域 16 条记录的 `schemaVersion` 全为 1；声明条目共 110 条（96 条 `same-version`、14 条 `version-bump`）；英文与中文声明块逐字节相等（16/16）。

### 步骤
1. 从模板复制骨架。
2. 为每个受影响根写一行；从该根的**最新**记录取 `previous`。
3. 从生成快照取 `after`，不要手算。
4. 同步中文声明（逐字节相同）。
5. 检查 `id` 与文件名去扩展名后一致。

### 完成信号
声明能被 YAML 解析；每个 `previous` 指向存在的记录；每个 `after` 与该记录快照中同名根的 `digest` 一致。

### 失败处理
- `previous` 缺失/成环/同一前驱有两条后继：验证器拒绝（见 [历史图](#persistence-current-records.history-graph)）。
- `after` 与快照摘要不一致：重新生成快照；若当前源码已变化，先决定是否需要新记录。

### 例外
删除、基线、新根三种形状见上；`version-bump` 记录里也可以出现 `previous: null` 的新根（`event:developer/message` 在 v4 记录中即如此）。

来源：deepseek-harness/docs/persistence-changes/README.md:40-44@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:40-44@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:24-265@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:24-37@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.zh.md:1-60@687f282e

<a id="persistence-current-records.compatibility-decision"></a>
## 3. 兼容性决策：同版本 vs 版本提升

### 触发
检测到任何结构性变化；分类器报告“需要兼容性评审”；准备写 `decision:`；CI 拒绝 `same-version`。

### 源仓义务（判定标准）
保持 Session 版本，当且仅当旧读取器满足其一（`deepseek-harness/docs/persistence-changes/README.md:49-49@687f282e`）：

1. 保留已接受数据的**必要含义**；
2. 安全忽略可选功能，同时保留不透明记录；
3. 在执行、修改或恢复截断**之前**拒绝不受支持的必要数据。

新读取器必须保留历史含义与可读性。只有“不安全解释无法被有效判别信息阻止”时才提升版本。未知字段/值只有在现有读取器**实际**安全处理时才计入；类型差异本身不能证明行为。

### 记录要求表（逐字保留）
| 检测到的变化 | 记录要求 |
|---|---|
| 添加可选事件体属性（含完整子树） | `same-version` |
| 必选事件体属性改为可选 | `same-version` |
| 添加普通事件类型 | `same-version` |
| 为普通事件增加更高数字 `data.version`，且按现有规则保留所有旧载荷分支 | `same-version` |
| 在 before/after 携带相同受支持策略的 user/developer 源槽上添加显式归属 kind | `same-version` |
| 可选改必选、加必选属性、改已有类型、删除/重命名属性或事件 | 兼容性评审后 `same-version`，或显式 `version-bump` |
| 改 Session header 或 event envelope | 兼容性评审后 `same-version`；header 版本变化要求 `version-bump` |

来源：`deepseek-harness/docs/persistence-changes/README.md:51-59@687f282e`。 来源：deepseek-harness/docs/persistence-changes/README.md:46-63@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:46-63@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.md:36-40@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-14-workspace-changes-event.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-30-job-session-lifecycle.md:40-44@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-106@687f282e

### 分类器与人的分工
- 分类器只识别“已确立的同版本情形”和“需要评审的变更”，**不能判定语义安全**（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。
- 需要评审的变更若仍想同版本，记录或更新时必须显式 `--decision same-version`；CLI 在生成被标记记录前要求该选择（`deepseek-harness/docs/persistence-changes/README.md:61-63@687f282e`）。
- CI 读取已记录的 `decision: same-version`，只要历史、schema、header 版本约束成立就接受，无论记录是生成还是手工编辑（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）。
- 显式 `version-bump` 必须自带递增的 `SessionHeader.version` 转换；同版本决策**不能**豁免 header 版本变化（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。
- 定稿记录不可变，后续记录不能复用已接受的 3→4 转换（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。

### 步骤
1. 列出每个受影响根与变化类别。
2. 对照上表得到“已确立 same-version / 需评审 / 必须 bump”。
3. 需评审时，在 Compatibility 写双向读者行为，再决定同版本（显式 CLI 选择）或 bump。
4. 选择 bump 时，同时给出 header 版本递增与迁移边（见 [版本提升](#persistence-current-records.version-bump-migration)）。
5. 把决策写进机器声明；CI 只做形式接受，语义由评审负责。

### 完成信号
- 每个变化根都有 `decision`，且与表一致。
- `same-version` 记录能指出旧读取器的三种安全行为之一。
- `version-bump` 记录的 header 版本确实递增。

### 失败处理
- 分类器标记为需评审但没有 `--decision`：CLI 不生成记录；补决策。
- 想用 `same-version` 绕过 header 变化：验证器拒绝；只能 bump。
- 记录已定稿又需要新变化：新增后继记录，不复用旧转换。

### 例外与边界
- 新增“读取时必需”的事件仍是 `same-version`，前提是旧读取器会**拒绝**整条日志而不是误解（`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.md:36-40@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-14-workspace-changes-event.md:36-40@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-30-job-session-lifecycle.md:40-44@687f282e`）。
- 必选改可选也可以 `same-version`，但必须说明缺失值的处理（`deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.md:36-40@687f282e`）。
- “类型不同”不是自动不安全，也不是自动安全；必须给读取器行为证据。

<a id="persistence-current-records.same-version-evidence"></a>
## 4. 同版本说明与验证证据

### 触发
写 `decision: same-version`；评审一条同版本记录；判断“旧读取器会不会误解”。

### 源仓义务
每条同版本记录都必须说明**两个方向**：旧记录如何仍可读；旧读取器如何处理新记录。包括无需显式 CLI 决策的已确立情形（`deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e`）：

- 日志里没有某功能时，必须保留旧行为；
- 可舍弃功能必须能安全忽略；
- 必要功能必须有**有效的拒绝信号**；
- 不受支持功能的拒绝**不得**变成损坏恢复或尾部截断；
- 必选改可选时，说明读取器如何处理缺失值。

Verification 段落记录**实际执行**的检查；评审者判断行为与证据，检查器只校验声明与类型分类（`deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e`）。

### 【源仓实现事实：可用作范例的四种写法】
- 纯可选字段新增：省略即旧行为；PTC dispatch 不进模型历史，原生工具结果回放只投影 `data.message`（`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:40-49@687f282e`）。
- 新必需事件：旧日志没有它仍有效；旧构建拒绝含该事件的日志；当前读取器需要其投影（`deepseek-harness/docs/persistence-changes/2026-09-14-image-offload.md:84-93@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-14-workspace-changes-event.md:36-45@687f282e`）。
- 必选改可选：旧日志可无 `title` 解码/折叠；缺省按未命名任务；宿主任务记录仍要求该成员（`deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.md:36-45@687f282e`）。
- 来源字段新增但 `kind` 不变：缺字段即 owner；旧读取器忽略；该字段不进模型请求（`deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.md:48-57@687f282e`）。
- 纯展示元数据：缺 `meta` 的旧记录有效；历史调用安全禁用导航；写入器与基线保持 V4（`deepseek-harness/docs/persistence-changes/2026-10-05-ptc-operation-metadata.md:36-45@687f282e`）。
- 仅日志事件：缺失表示请求省略字段并使用提供方默认值，没有读取方回放该字段（`deepseek-harness/docs/persistence-changes/2026-10-13-deepseek-search-thinking.md:36-45@687f282e`）。

### 步骤
1. 在 Compatibility 先写“旧 → 新”方向（旧日志在新读取器下的含义）。
2. 再写“新 → 旧”方向（旧读取器遇到新记录：忽略？拒绝？截断？）。
3. 对照三种安全行为给出结论；若依赖拒绝，证明拒绝发生在执行/修改/恢复截断之前。
4. 在 Verification 写实际命令与观察结果（测试文件/数量/SDK 快照），不要写“应当通过”。
5. 评审者独立检查证据是否覆盖两个方向与同时发生的变化。

### 完成信号
Compatibility 同时覆盖两个方向；Verification 有可复现命令与结果；没有把“类型兼容”当作行为证据。

### 失败处理
- 旧读取器会静默丢弃必需数据：不能同版本；改判别信息或 bump。
- 拒绝发生在恢复截断之后：视为不安全，不能同版本。
- 证据只覆盖新读取器：补旧读取器/历史日志证据。

### 例外
已定稿的历史记录不要求重写说明；新记录必须引用/保留其声明与快照。

来源：deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:69-69@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:40-49@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-14-image-offload.md:84-93@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.md:48-57@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-05-ptc-operation-metadata.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-13-deepseek-search-thinking.md:36-45@687f282e

<a id="persistence-current-records.payload-version-evolution"></a>
## 5. `data.version` 载荷分支演进

### 触发
普通事件要新增一种载荷形状；想给现有事件加字段但不想 bump Session 版本。

### 源仓义务
普通事件可以新增载荷分支，条件是（`deepseek-harness/docs/persistence-changes/README.md:65-65@687f282e`）：

- 使用**必需、非负整数** `data.version`，且新版本**大于**所有已有载荷版本；
- 所有旧分支在既定同版本规则下仍可读；
- 可选属性新增与必选改可选可以伴随新版本；**每个保留分支独立比较**；
- 其他载荷改动需要兼容性评审；
- 旧读取器可能拒绝新载荷版本——这是允许的。

### 【源仓实现事实：catalog 的三步演进】
机器解析 `event:subagent/catalog` 快照可见：
- `2026-09-20-unknown-child-catalog`：`data` 联合有 5 个分支，覆盖 `continuable`/`one-shot` 的 v0、v1，并新增 `mode: "unknown", version: 1`（`deepseek-harness/docs/persistence-changes/2026-09-20-unknown-child-catalog.schema.json:1-250@687f282e`）。
- `2026-09-19-external-subagent-catalog`：在前述分支上增加 `mode: "external", version: 2`，旧分支全部保留（`deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.schema.json:1-290@687f282e`）。
- 兼容性说明明确：“旧读取器拒绝 v1”；“分类器仅在所有旧载荷分支保持不变时允许更高载荷版本；同版本扩展与移除旧读取支持仍属破坏性变更”（`deepseek-harness/docs/persistence-changes/2026-09-20-unknown-child-catalog.md:36-45@687f282e`）。

### 步骤
1. 确认事件是“普通事件”，不是 header/envelope。
2. 给新分支一个严格更大的非负整数 `version`。
3. 保留每个旧分支的完整形状；不要借机改旧分支。
4. 在 Compatibility 说明旧读取器会拒绝新版本、新读取器接受哪些版本。
5. 重新生成快照；核对联合分支数与版本字面量。

### 完成信号
快照中旧分支逐字段不变；新分支 `version` 最大；记录声明该根 `same-version`。

### 失败处理
- 新分支版本不大于旧值/不是整数/负数：验证器拒绝。
- 改了或删了旧分支：不能按本机制同版本；走兼容性评审或 bump。
- header/surface 结构变化：不属于本机制。

### 例外
旧读取器拒绝新载荷是预期行为，不是缺陷；但拒绝不得表现为损坏恢复或尾部截断（与 [同版本证据](#persistence-current-records.same-version-evidence) 联用）。

来源：deepseek-harness/docs/persistence-changes/README.md:65-65@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:65-65@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-20-unknown-child-catalog.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-20-unknown-child-catalog.schema.json:1-250@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.schema.json:1-290@687f282e

<a id="persistence-current-records.attribution-policy"></a>
## 6. 归属来源策略（`@persistenceSource` / `@persistenceAttribution`）

### 触发
新增消息来源 kind；把生产者私有信息写进用户/开发者消息源；比较两个带策略的 schema 快照。

### 源仓义务
- 提取器接受核心拥有的 source 属性上的**显式** `@persistenceSource` 绑定（字面量 user 或 developer 角色）；**不会**从无注解类型推断绑定（`deepseek-harness/docs/persistence-changes/README.md:67-67@687f282e`）。
- 生产者用 `@persistenceAttribution` 限定其 `MessageSourceMap` 成员。限定承诺：
  1. 未知 kind 及其 JSON 元数据在**没有生产者**的情况下也能被读取并保留；
  2. 该 kind 不引入校验、回放或权限要求。
- 生产者可以检查自己的 kind 以恢复去重状态；其他读取器必须在不使用该投影的情况下保留并派生已记录消息。
- 记录 schema 保留：绑定、策略版本、字面量 `kind` 判别字段、保留承诺、符合条件的 kind 集合。
- 清单 format 2 保存这些承诺；没有绑定策略的提取保持 format 1。**Session 格式版本独立于策略版本**。
- 比较双方快照必须携带兼容的策略状态。已有 kind 分组仍做常规结构比较；**删除、未标记新增、策略更改、无关结构变更需要兼容性评审**。同一 wire kind 的多个上下文形式分支归为一组。

### 【源仓实现事实：三个落地例子】
- 迟到回答来源 `user-question-reply`：`kind` 仍是 `user`；没有 `dsh-user-questions` 的读取器保留消息并从内容派生历史；只有 `userQuestions` projection 读该来源；answer RPC 是唯一生产者，关闭面板不持久化回复（`deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:48-57@687f282e`）。
- 工作目录通知归属：新增来源种类只做归属；策略保留未知归属而不解释（`deepseek-harness/docs/persistence-changes/2026-10-05-working-directory-attribution.md:48-52@687f282e`）。
- 非 owner 调用方：owner prompt 不写 `principal`，缺省即 owner；`kind` 保持 `'user'`；字段不进模型请求（`deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.md:48-57@687f282e`）。
- V4 的 PTC 生产者写 `source.kind: 'ptc-mode'`；迁移边保留 `tools-code-mode`/`tools-ptc` 作为历史查找键；策略保留 `ptc-mode`，不允许把它只当归属（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:104-104@687f282e`）。

### 步骤
1. 判定是核心拥有（写 `@persistenceSource`）还是生产者拥有（写 `@persistenceAttribution`）。
2. 写下字面量 `kind` 判别字段与保留承诺；不要依赖运行时推断。
3. 确认未知 kind 的 JSON 元数据能被完整保留。
4. 更新策略版本与符合条件 kind 集合；记录中声明 before/after 策略状态兼容。
5. 若删除 kind、未标记新增或改变策略：按需评审，不能用普通可选字段新增糊弄。

### 完成信号
快照携带策略状态；记录声明同一 Session 版本；未知 kind 的读取测试覆盖“无生产者仍保留”。

### 失败处理
- 无注解类型被当作已绑定：提取器不会推断，记录会缺策略，比较失败。
- 删除/未标记新增：分类器要求评审。
- 策略状态不兼容的两个快照：不能直接比较。

### 例外
System/model/tool source 保持严格语义规则，不能套用归属宽松策略（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:100-100@687f282e`）。

来源：deepseek-harness/docs/persistence-changes/README.md:67-67@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:67-67@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:48-57@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-05-working-directory-attribution.md:48-52@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.md:48-57@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:98-104@687f282e

<a id="persistence-current-records.reserved-field"></a>
## 7. 禁止字段保留（可选 `never` + `@persistenceReserved`）

### 触发
读取器按属性名拒绝某个旧 JSON 字段；想把这个事实固化进 schema；以后可能重新允许该字段。

### 源仓义务
- 当读取器按名称拒绝某 JSON 属性时，把该属性声明为**可选 `never`**，并加**无参数** `@persistenceReserved`（`deepseek-harness/docs/persistence-changes/README.md:71-71@687f282e`）。
- 提取器保留该禁止字段；因此以后允许 JSON 值属于**已有字段类型变更**（需兼容性评审或 bump），不是普通可选字段新增。
- 必选属性或允许 JSON 值的属性**不能**携带该标记。
- 未标记的可选 `never` 与 `undefined` 属性保留既有省略行为。

### 【源仓实现事实】
- `2026-09-16-session-format-v4` 的 `request/header` 根把退役的 `system` 键记录为可选 `never`；该声明只是在记录**已有**的原生读取拒绝，不改变存储数据或提示词重建（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:96-96@687f282e`）。
- 机器解析 v4 快照：`event:request/header` 的对象节点有 `system`（optional，primitive `never`）；另有 11 个消息根存在可选 `never` 属性 `tool`。初始基线快照没有 `never` 节点（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e`，机器解析）。
- 快照不携带注解文本，因此从快照本身无法区分哪些 `never` 由 `@persistenceReserved` 标记、哪些是普通省略；注解事实来自 README 规则与 v4 记录的散文。

### 步骤
1. 把拒绝规则写成可选 `never` 属性，保留字段名。
2. 加无参数 `@persistenceReserved`；不要加参数或条件。
3. 在记录中说明这是“记录既有拒绝”，不是新增行为。
4. 以后允许值时，按“已有字段类型变更”评审，而不是当作可选新增。

### 完成信号
快照含该可选 `never` 属性；记录声明没有改变存储语义；分类器把“允许该字段值”标为需评审。

### 失败处理
- 把 `never` 写成必选：非法。
- 允许 JSON 值却仍按普通可选新增：会被判为已有字段类型变更并拒绝。
- 去掉标记：该属性的省略语义改变。

### 例外
未标记 `never`/`undefined` 保持既有省略行为；不要把它们当成禁止字段。

来源：deepseek-harness/docs/persistence-changes/README.md:71-71@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:71-71@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:96-96@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e

<a id="persistence-current-records.history-graph"></a>
## 8. 前驱链与历史图

### 触发
新增后继；合并两条改同一根的分支；验证器报告缺失前驱/环/重复后继/摘要不匹配。

### 源仓义务
- **一条**基线记录完整初始清单；后续记录把前驱的 after schema 当作 before schema（`deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e`）。
- 验证器拒绝：缺失前驱、环、同一根的重复后继、摘要不匹配、当前根与最新记录不一致（`deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e`）。
- 独立根可以独立演进；同一前驱上的两个变更在集成后必须形成**一条有序历史**（`deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e`）。
- 已接受记录描述历史转换；添加后继时保留其机器声明与 schema 快照（`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）。
- 基线不依赖 Git 引用、远端服务或已发布版本的检出目录（`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）。

### 【源仓实现事实：当前图】
- 16 条记录、110 条变更条目、65 个不同根；基线 59 个根；没有缺失前驱或重复后继（按声明核对）。
- 每个 `previous` 都是记录 id；`null` 只出现在基线与 6 个新根上。
- `event:subagent/catalog` 的链是 `2026-09-11-initial → 2026-09-20-unknown-child-catalog → 2026-09-19-external-subagent-catalog`：后一条记录的 id 日期**早于**其前驱。日期只是标签，**声明中的 `previous` 才是链**；不要按文件名日期重排历史（`deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.md:24-33@687f282e`）。

### 步骤
1. 找到该根的最新记录；`previous` 指向它。
2. 新根写 `previous: null`。
3. 若同一根在本分支已有未合并记录，先把两者整理成一条有序历史（必要时把后一条的 `previous` 改指前一条）。
4. 重新生成快照并核对摘要。
5. 运行验证器；不要手改他人已接受记录的声明。

### 完成信号
每个根的链无环、无重复后继、前驱存在、摘要逐跳匹配；当前根等于最新记录的 after。

### 失败处理
- 缺失前驱：补记录或修 `previous`；不要删声明了事。
- 重复后继（两个 PR 各自加一条）：集成时合并为一条历史，保留两条的语义。
- 摘要不匹配：先确认是否只是生成物过期（见 [摘要口径](#persistence-current-records.digest-scope)）；否则补记录。

### 例外
已定稿记录不可改；删除根用 `after: null` 保留 tombstone；独立根不需要互相等待。

来源：deepseek-harness/docs/persistence-changes/README.md:76-78@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:76-78@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:24-265@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:24-37@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-14-image-offload.md:24-81@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.md:24-33@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e

<a id="persistence-current-records.current-root-agreement"></a>
## 9. 当前根与最新记录一致

### 触发
改完类型后本地检查；CI 报“当前根与最新记录不一致”；准备只跑 `--check`。

### 源仓义务
- 验证器拒绝“当前根与最新记录不一致”（`deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e`）。
- 评审者用 `persistence-review` 比较 base 与 head 清单；`--check` 只验证**当前树**一致性，**无法**显示已被某条确认记录覆盖的转换（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）。
- 摘要描述声明的持久化类型，不描述运行时验证或行为（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）。

### 步骤
1. 重新生成目录/清单（`pnpm exec tsx scripts/gen-persistence-catalog.ts`）。
2. 运行验证器；若报当前根不一致，比较“当前生成的根摘要”与“该根最新记录的 after”。
3. 若只是生成物过期：重新生成，不新增确认。
4. 若类型真的变了：新增一条记录（走 [兼容性决策](#persistence-current-records.compatibility-decision)）。
5. 评审时用 `persistence-review` 比较 base/head，避免只看 `--check` 漏掉已覆盖转换。

### 完成信号
当前生成清单逐根等于最新记录 after；`--check` 通过；base/head 差异与新增记录一一对应。

### 失败处理
- 只跑 `--check` 就宣称“没有未记录变化”：不成立；它看不见已被确认覆盖的转换。
- 当前根不一致但不想记录：还原类型改动。

### 例外
生成文本/源码位置变化不影响摘要，重新生成即可；见下一节。

来源：deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e 来源：deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:63-63@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:76-76@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-10-05-ptc-operation-metadata.md:36-45@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:107-117@687f282e

<a id="persistence-current-records.root-inventory"></a>
## 10. 根清单与传递类型

### 触发
决定一个改动影响哪些根；新增事件类型；评审快照根集合。

### 源仓义务
生成的目录提供可读声明与摘要；schema 清单包含规范化类型。根覆盖：逻辑 Session 头、物理 JSONL 头行、事件封装，以及**每个仓库内声明的事件**；被引用类型传递地贡献到每个受影响根的摘要（`deepseek-harness/docs/persistence-changes/README.md:29-29@687f282e`）。

### 【源仓实现事实：快照形状】
每个 `.schema.json` 是：

```json
{
  "formatVersion": 1,
  "roots": [
    {
      "key": "event:working-directory/change",
      "kind": "event",              // header | envelope | event
      "event": "working-directory/change",
      "surface": false,             // 观察：仅消息承载根为 true
      "digest": "124aa6…dca3",
      "schema": { "root": 0, "nodes": [ ... ] }
    }
  ],
  "types": []
}
```

节点种类（机器解析全部 16 份快照）：`object`（`properties[{name,type,optional}]`、`indices[]`）、`union`（`types[]`）、`literal`（`value`）、`primitive`（`type`，含 `"never"`）、`array`（`element`）、`tuple`（`elements[{type,optional,rest}]`）、`opaque`（`reason`）。`types` 在本域全部 16 份快照中为空数组，类型通过根内节点图内联。

基线 `2026-09-11-initial`：59 个根 = 2 个 `header`（`SessionHeader`、`JsonlHeaderLine`）+ 1 个 `envelope`（`SessionEventEnvelope`）+ 56 个 `event`；节点计数 object 392 / literal 446 / primitive 129 / union 76 / array 49 / opaque 8 / tuple 4（`deepseek-harness/docs/persistence-changes/2026-09-11-initial.schema.json:1-13557@687f282e`，机器解析）。

### 步骤
1. 从事件类型映射到根：`event:<type>`；header/envelope 单独命名。
2. 找出被引用类型，传递地标记所有受影响根（共享 `Message`/`ContentBlock` 会一次影响多个事件根）。
3. 新增事件类型：加入清单并写新根记录（`previous: null`）。
4. 生成快照；核对根集合与声明根集合完全一致。

### 完成信号
声明根集合 = 快照根集合；每个根有 `key/kind/digest/schema`。

### 失败处理
- 只改了共享类型却只记录一个事件根：验证器会在其他根报摘要不一致。
- 新增事件没进清单：当前根与历史都不覆盖它，评审会漏。

### 例外
`opaque` 类型不暴露内部结构，无法比较隐藏结构；行为变化不在本机制范围。基线快照的根对象省略 `event`/`surface` 字段（较早生成器形态），不要据此回填旧文件；以声明摘要为准（`deepseek-harness/docs/persistence-changes/2026-09-11-initial.schema.json:1-13557@687f282e`，机器解析）。

来源：deepseek-harness/docs/persistence-changes/README.md:29-29@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:29-29@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:24-265@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.schema.json:1-13557@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.schema.json:1-76@687f282e

<a id="persistence-current-records.digest-scope"></a>
## 11. 摘要口径与例外类

### 触发
生成物看起来“过期”；重排声明后摘要没变/变了；判断某改动要不要新增确认。

### 源仓义务（逐条）
摘要描述**声明的持久化类型**，不是运行时验证或行为（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）。

**不影响摘要（例外类）**
- 普通注释；
- 源码位置；
- 别名名称；
- 无害的声明重排；
- 目录文本与源码位置变化。

**影响摘要**
- 兼容性注解（它们是记录下来的策略数据）；
- 对象字段、联合分支、交叉操作数、索引签名**只有在解析类型不变时**才可重排；
- 元组位置与数字枚举值始终显著。

**其他口径**
- 未注解的 version-1 快照保留原有规范化与指纹；带策略的图使用独立指纹域。
- `unknown` 等不透明类型不暴露可比较的隐藏结构。
- 纯行为变更与不透明值中隐藏的结构不在本机制范围。
- 目录文本/源码位置可能变化：重新生成陈旧产物，**不需要**为未变摘要新增确认。

### 步骤
1. 先重新生成，排除“只是文本/位置过期”。
2. 比较摘要：变了才考虑记录。
3. 若只是重排：确认解析类型相同；元组位置/数字枚举值不算“无害重排”。
4. 若加入/修改兼容性注解：按策略数据变更处理，摘要会变。

### 完成信号
同一解析类型重排后摘要不变；注解变化后摘要变化且有对应记录。

### 失败处理
- 为未变摘要新增确认：制造冗余历史，评审应拒绝。
- 把行为变化当成类型变化：本机制不覆盖，走运行时/测试证据。
- 手改摘要：验证器会与其他产物/声明冲突。

### 例外
不透明值、纯行为变化、被别名掩盖的重排；后者的判断依赖提取器的规范化规则，而实现属于发布域。

来源：deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:80-80@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.schema.json:1-13557@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.schema.json:1-910@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.schema.json:1-302@687f282e

<a id="persistence-current-records.finalized-checkpoint"></a>
## 12. 定稿检查点与不可变历史

### 触发
要把一个已同意的格式标记为已接受；写入器要继续演进但需保护已接受声明；有人想改已定稿记录。

### 源仓义务
- `finalized/vN.json` 记录一个已接受兼容性基线的**完整根分类/摘要**，以及其已接受记录的**语义哈希**（`deepseek-harness/docs/persistence-changes/README.md:40-40@687f282e`）。
- 定稿记录要求其检查点存在（README 链接到 `docs/session-format-status.md` 的 finalization-record 小节）。
- 当前 V4 schema 可以兼容演进；检查点保护已接受的机器声明与 after schema，即使写入器已推进；记录哈希**排除**散文、别名和源码位置（`deepseek-harness/docs/persistence-changes/README.md:40-40@687f282e`）。
- 维护者用 `createPersistenceFinalizationCheckpoint` 捕获已同意格式；写入**按版本命名的新检查点而不替换旧文件**，并推进配对（双语）文档中的 `latestFinalizedVersion`（`deepseek-harness/docs/persistence-changes/README.md:42-42@687f282e`）。
- 该 helper 要求当前 schema 与**完整确认历史**一致；提交前运行常规验证器（`deepseek-harness/docs/persistence-changes/README.md:42-42@687f282e`）。
- 定稿记录不可变；后续记录不能复用已接受的 3→4 转换（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。
- 验证检查保留的检查点哈希；但它**不证明**检查点与其权威记录从未被一起修改（`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）。

### 步骤
1. 确认该格式的所有转换都有已接受记录，且当前 schema 与历史一致。
2. 运行常规验证器。
3. 调用 `createPersistenceFinalizationCheckpoint` 生成新的 `finalized/vN.json`；不要覆盖旧 `vM.json`。
4. 在英/中双语文档同时推进 `latestFinalizedVersion`。
5. 提交前再跑验证器；把新检查点视为只追加。

### 完成信号
新版本文件存在且旧文件未变；双语文档版本字段一致；验证器通过保留哈希检查。

### 失败处理
- helper 报当前 schema 与历史不一致：先补记录/修生成物，不要绕过 helper。
- 想改已定稿记录：新增后继记录；旧声明与快照保留。
- 想复用 3→4：被不可变性拒绝；必须新的 header 转换。

### 例外与限制
检查点只覆盖机器声明与 after schema；散文可改（只要配对哈希同步）。验证器无法证明检查点与权威记录未被联合篡改——这是评审/权限问题，不是自动保证。

来源：deepseek-harness/docs/persistence-changes/README.md:40-42@687f282e 来源：deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e 来源：deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:40-42@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e

<a id="persistence-current-records.terminal-refresh"></a>
## 13. 末端未接受记录刷新

### 触发
一条记录还没被接受，但其 after schema/声明需要按最新源码刷新；记录被后续记录依赖；记录已被检查点锁定。

### 源仓义务
未被接受的**末端**记录可以显式刷新；命令在产出物之前拒绝：基线、带依赖者的记录、被检查点锁定的记录（`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）。

### 步骤
1. 确认目标记录是末端（没有后继）。
2. 确认它不是基线、不是任何记录的 `previous`、未被 `finalized/*.json` 锁定。
3. 显式刷新并重新生成快照/侧车。
4. 重新运行验证器与 doc-sync。

### 完成信号
只有目标记录及其生成物变化；依赖它的记录/检查点未动。

### 失败处理
- 有依赖者：不能刷新；新增后继记录。
- 被检查点锁定：不可刷新；新增后继或走新版本。
- 基线：永不刷新。

### 例外
“未接受”是前提；已接受但未定稿的记录仍按历史处理（保留声明与快照，新增后继）。

来源：deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:78-78@687f282e

<a id="persistence-current-records.bilingual-pairing"></a>
## 14. 双语配对与侧车哈希

### 触发
编辑英文或中文任一侧；`*.i18n.yaml` 缺失/过期；doc-sync 报翻译配对失败。

### 源仓义务
- 每条记录有中文对侧，机器声明必须相同；验证器从英文读一次并检查中文相等（`deepseek-harness/docs/persistence-changes/README.md:35-44@687f282e`）。
- `*.i18n.yaml` 是生成的双语一致性记录；文件头写明：按标题分段，对**代码块与生成区域之外**的英/中块取哈希；编辑任一侧后要带另一侧并重新记录（`deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:1-4@687f282e`）。
- 重新记录命令：`pnpm run verify-translation-pairing --write docs/persistence-changes/<file>.md`（同上文件头）。
- doc-sync 包含持久化历史与翻译配对门禁（`deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:53-57@687f282e`，记录称 42 项检查全部通过）。

### 【源仓实现事实：侧车键语法】
- `/`：首个标题之前的块；记录文件该哈希在 16 条记录中完全相同（`3d5a424ae7d7e46b` / `c22a8e4a62d8cc1a`），说明前置元数据/语言链接的差异被规范化。
- `/<h1-slug>`、`/<h1-slug>/<section-slug>`：逐标题段。README 的 H1 slug 是 `persistence-type-change-records`；记录的 H1 slug 是记录 id。
- 所有 16 条记录的 `/…/declaration` 哈希相同（`6907136f28e48c90` / `02f8298485f3d8e7`），尽管声明内容不同：声明在围栏代码块内，被排除在哈希之外。TOC 与 dev-note 段也全部相同。
- 结论：配对侧车证明“不应翻译的代码块未被改动 + 两侧散文按段同步”，**不**证明中文语义等价；声明相等由验证器单独检查。

### 步骤
1. 先改英文，再改中文（保持声明逐字节相同）。
2. 运行 `pnpm run verify-translation-pairing --write <英文文件>` 重记侧车。
3. 运行验证器与 doc-sync。
4. 评审时看侧车分段哈希是否只在你改动的段落变化。

### 完成信号
侧车分段与两侧标题对应；声明相等；doc-sync 通过。

### 失败处理
- 只改一侧：配对检查失败；补齐另一侧后重记。
- 手改侧车哈希：下次重记会覆盖；不要手改。
- 中文声明漂移：验证器报错；以英文为准修正。

### 例外与边界
标题文字可不同（英/中各一套 slug 在侧车中成对）；代码块内容不参与配对哈希。哈希算法细节由文档域实现拥有，本域未复算。

来源：deepseek-harness/docs/persistence-changes/README.md:35-44@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:1-90@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:53-57@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:1-28@687f282e 来源：deepseek-harness/docs/persistence-changes/README.i18n.yaml:1-28@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.zh.md:1-120@687f282e

<a id="persistence-current-records.archive-separation"></a>
## 15. 归档分离与发布比较冻结

### 触发
想用旧 tag、alpha/RC 归档或历史格式参考来证明当前兼容性；准备改归档比较。

### 源仓义务
- 较早的 tag 使用预发行归档；它重建 alpha/RC 类型差异，供**历史阅读与格式校验**；其观察**不作为当前兼容性确认**（`deepseek-harness/docs/persistence-changes/README.md:13-13@687f282e`）。
- 按 Session 格式查看完整 schema 时使用格式参考；其覆盖由写入器常量决定，包括没有发布 tag 的中间格式（`deepseek-harness/docs/persistence-changes/README.md:15-15@687f282e`）。
- 已发布的 V0–V3 校验器与已记录的前驱代际保持不变；V3 读取器拒绝更新的 generation（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:94-94@687f282e`）。
- 已有 V4 文件不会重新运行迁入边（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:98-98@687f282e`）。

### 步骤
1. 当前兼容性只看当前树的记录 + 最新记录 + 定稿检查点。
2. 归档只用于回答“旧版本当时长什么样/如何校验旧文件”。
3. 需要引用旧版本差异时，在记录中明确标注为历史证据，不写成当前决策依据。
4. 不改动已冻结的归档比较与旧 generation 校验器。

### 完成信号
记录中的兼容性论证不依赖归档观察；归档文件保持只读。

### 失败处理
- 用 RC 归档证明“现在兼容”：评审应拒绝，要求当前读取器行为证据。
- 想“顺手更新”旧 generation：不必要且破坏冻结；新增 generation 而非改旧。

### 例外
格式参考可以覆盖未打 tag 的中间格式；这仍是历史阅读材料，不是当前确认。

来源：deepseek-harness/docs/persistence-changes/README.md:11-15@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:11-15@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:94-94@687f282e

<a id="persistence-current-records.version-bump-migration"></a>
## 16. 版本提升与迁移边

### 触发
分类器/评审决定必须 bump；需要改 `SessionHeader.version`；需要写 V3→V4 这类迁移。

### 源仓义务
- 显式 `version-bump` 必须自带递增的 `SessionHeader.version` 转换；同版本决策不能豁免 header 版本变化（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。
- 版本提升记录按 Session 格式流程处理（README 指向 `../cookbook/adding-a-session-format-version.md`）。
- 记录必须覆盖**整个转换**，包括同时发生的多个根变化（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。

### 【源仓实现事实：V3→V4 的完整案例】
`2026-09-16-session-format-v4` 一个记录改了 14 个根：`SessionHeader` + 13 个事件根；全部 `decision: version-bump`（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e`）。关键行为：

- **共享类型导致多根变化**：从内容块联合移除 `tool-result` 并按角色细化消息，会改变 inbox、消息事件、compaction 摘要、标题请求、团队消息、PTC dispatch 等可达 schema；这不是新增十套协议（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:90-90@687f282e`）。
- **header 版本**：快照中 `SessionHeader.version` 从字面量 3 变为 4（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e`，机器解析）。
- **迁移保留**：V3→V4 把已发布的 user 角色工具结果提升为 tool 角色消息（必需 `toolCallId`、可选 `isError`）；保留每个已接纳源事件与继承切分点；从同一持久化根的直属子日志补缺失的父级 `subagent/catalog` 记录。
- **子日志证据集**：历史正文恢复要求显式 child-evidence 集合，没有子日志也要传空集合；descriptor 缺失/多条/版本未知则跳过该子项补全；身份、时间戳或模式冲突则**拒绝迁移且不发布**。
- **打开语义**：历史读取打开在内存准备结果；写入打开重新校验子成员与修订后，把当前后继发布到未修改的前代文件旁；delivery-generation 检查防止历史确认变成活动 V4 水位。
- **fork 结果**：迁移为 forked 的 `turn/end.reason` 增加变体；精确切分的 fork 在继承标记后追加子自有错误结果与结束事件；V4 接纳经校验的 not-started fork 结果，使用确定性分支 ID 与措辞（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:94-94@687f282e`）。
- **developer 事件与历史 header**：developer 事件保留角色并要求 open step；每次新增存 `toolName`，`developer/message.headerSeq` 指向此前恰好包含一个完整匹配 `ToolSchema` 的历史 request/header；同一事件的所有新增共享该历史 header 修订，纯删除与其他 developer 消息省略 `headerSeq`；准入拒绝缺失/前向/非 header/未知/歧义/不完整/已退役内联定义；替换、重启、fork、surface replacement 与压缩保留历史 schema 身份，不咨询最新 header 或 registry（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:102-102@687f282e`）。
- **退役字段**：`request/header` 的 `system` 键记录为禁止（见 [禁止字段](#persistence-current-records.reserved-field)）。
- **生产者来源**：未知生产者归属保留每个自有 JSON 属性；原生读写打开在暴露 Session 前校验 source 字段；已有 V4 文件不重跑迁入边。
- **PTC kind**：`tools-code-mode`/`tools-ptc` 作为历史查找键映射到 `ptc-mode`。
- **验证**：报告 1,523 / 447 / 884 等测试与 100% 覆盖率；比较生成清单报告 4 个变化根、447 个未变指纹（`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:107-117@687f282e`）。

### 步骤
1. 在声明中列出**所有**受影响根，并统一 `decision: version-bump`。
2. 修改 `SessionHeader.version` 字面量，生成快照确认递增。
3. 实现迁移边：保留旧事件/切分点；定义缺失/冲突时的跳过与拒绝条件；拒绝时不得发布。
4. 明确读写打开的语义（内存准备 vs 发布后继）。
5. 保持已发布校验器与旧 generation 不变。
6. 记录迁移中退役/保留的字段与查找键映射。
7. 运行聚焦测试与清单比较，把实际数字写进 Verification。

### 完成信号
header 版本递增；所有受影响根在同一 bump 记录中；迁移对缺失/冲突有明确、可测试的拒绝；旧 generation 未改。

### 失败处理
- 只 bump header 不处理迁移：读取旧文件失败或语义丢失。
- 多根变化拆成多条 bump 记录：历史链允许，但同一转换应可被一条记录完整解释；评审要求覆盖完整转换。
- 迁移冲突时发布后继：违反“拒绝且不发布”。

### 例外
没有 shipped profile 发出的记录类型（如 developer 记录）可以只定义持久化形状，provider 序列化/自动发出/UI 支持延后；但读取接纳必须明确。

来源：deepseek-harness/docs/persistence-changes/README.md:51-61@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:51-61@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-106@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:107-117@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e

<a id="persistence-current-records.verifier-trust-boundary"></a>
## 17. 验证器信任边界

### 触发
准备说“验证通过所以兼容/安全”；评审 CI 绿灯；设计迁移验收。

### 源仓义务与实现事实
自动检查能证明：
- 历史图结构正确、摘要匹配、当前根与最新记录一致（`deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e`）；
- 英文/中文机器声明相等（`deepseek-harness/docs/persistence-changes/README.md:44-44@687f282e`）；
- 记录中写下的 `decision: same-version` 满足历史/schema/header 版本约束（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）；
- 保留检查点的哈希未被改动（`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）；
- 当前树一致性（`--check`）（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）。

自动检查**不能**证明：
- 记录是如何编写的、是否有**人**评审过（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）；
- 兼容性说明中的读取器行为真的成立（检查器只校验声明与类型分类，`deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e`）；
- 类型之外的运行时验证/行为（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）；
- 检查点与其权威记录没有被**一起**修改（`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）；
- 已被某条确认记录覆盖的转换（`--check` 看不见，`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`）；
- 基线来自某个 Git ref/远端/发布检出（基线只在树内，`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`）。

### 使用规则
1. 把验证器当“形式一致性门禁”，不是语义安全证明。
2. 记录里的 Verification 段落是**证据索引**，评审要能复跑命令。
3. 涉及安全解释的结论必须由人给出双向读取器论证。
4. 不把 CI 绿灯写成“兼容性已被证明”。

### 失败处理
- 验证器通过但语义可疑：评审阻塞，要求行为测试/旧读取器证据。
- 检查点哈希通过但怀疑联合篡改：走权限/审计，不是重跑验证器。
- `--check` 通过但 base/head 有差异：用 `persistence-review` 补看。

来源：deepseek-harness/docs/persistence-changes/README.md:61-63@687f282e 来源：deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e 来源：deepseek-harness/docs/persistence-changes/README.md:76-80@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:63-63@687f282e 来源：deepseek-harness/docs/persistence-changes/README.zh.md:78-78@687f282e 来源：deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:96-96@687f282e

<a id="persistence-current-records.commands"></a>
## 18. 命令、字段与文件速查

| 名称 | 类型 | 用途/出处 |
|---|---|---|
| `kind: persistence-change` | 前置元数据 | 标识变更记录（`deepseek-harness/docs/persistence-changes/README.md:35-35@687f282e`） |
| `schemaVersion: 1` | 声明字段 | 当前声明格式版本 |
| `baseline: true/false` | 声明字段 | 仅初始清单为 true |
| `previous` / `after` / `decision` | 声明字段 | 前驱记录 id / after 摘要 / `same-version`\|`version-bump` |
| `pnpm exec tsx scripts/gen-persistence-catalog.ts` | 生成 | 生成当前目录/清单（`deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:273-277@687f282e`） |
| `pnpm run persistence-changes --baseline <id>` | 生成 | 创建基线及其快照（同上） |
| `--decision same-version` | CLI | 对被分类器标记的变更显式选择同版本（`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`） |
| `--check` | CLI | 只验证当前树一致性（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`） |
| `persistence-review` | 评审工具 | 比较 base/head 清单（`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`） |
| `createPersistenceFinalizationCheckpoint` | helper | 写新版本检查点并推进 `latestFinalizedVersion`（`deepseek-harness/docs/persistence-changes/README.md:42-42@687f282e`） |
| `pnpm run verify-translation-pairing --write <file.md>` | 生成 | 重记双语配对侧车（`deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:4-4@687f282e`） |
| `pnpm run doc-sync` | 门禁 | 含持久化历史与翻译配对（`deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:57-57@687f282e`） |
| `finalized/vN.json` | 生成/只追加 | 已接受基线的根分类/摘要与记录语义哈希（`deepseek-harness/docs/persistence-changes/README.md:40-40@687f282e`） |
| `YYYY-MM-DD-slug.{md,zh.md,i18n.yaml,schema.json}` | 四件套 | 见 [四件套](#persistence-current-records.record-quadruple) |

**快照节点速查**：`object`（`properties`/`indices`）、`union`（`types`）、`literal`（`value`）、`primitive`（`type`，含 `never`）、`array`（`element`）、`tuple`（`elements`）、`opaque`（`reason`）。根对象字段：`key`、`kind`、`event?`、`surface?`、`digest`、`schema{root,nodes}`；顶层为 `formatVersion`、`roots`（根数组）、`types`（本目录 16 个快照中均为空数组）。

<a id="persistence-current-records.adoption"></a>
## 19. 迁移到其他项目（参数化）【迁移设计】

1. **保留四件套与声明语义**，替换命名：`root` 用你的 header/envelope/event 命名；`previous` 用你的记录 id；摘要算法可换，但必须只覆盖声明类型。
2. **先立基线**：一次性为完整根清单写 `baseline: true` 记录，所有 `previous: null`。
3. **把决策表本地化**：把“可选新增/必选改可选/新事件/载荷版本/归属 kind”列为自动 `same-version`；“可选改必选/加必选/改类型/删改属性/header 或 envelope 变化”列为需评审；header 版本变化必须 bump。
4. **实现最小验证器**：检查声明 YAML 可解析、`previous` 存在且无环/无重复后继、`after` 与快照摘要一致、当前生成清单与最新记录一致、中英声明相等。
5. **生成快照**：根 + 规范化节点图 + 每根摘要；删除根用 tombstone。
6. **配对侧车**：按标题分段哈希，代码块排除；提供 `--write` 重记命令。
7. **定稿检查点**：只追加 `finalized/vN.json`，记录不变的根摘要与记录语义哈希；双语文档同步版本字段。
8. **CI 接线**：把上述检查放进必过 job；注意 CI 只做形式接受，语义评审另设。
9. **归档分离**：历史 tag 比较单独存放，明确标注“不作为当前确认”。

**必需支持**：可解析的 YAML 声明、确定性摘要、生成器、前驱图校验、双语/分段哈希工具、只追加检查点存储、评审清单。**不具备**这些支持时，至少保留：基线 + 声明 + 当前根一致检查 + 人工双向兼容性评审。

<a id="persistence-current-records.limits"></a>
## 20. 证据限制

- 本域只覆盖 `docs/persistence-changes/` 的 67 个当前记录文件；验证器、生成器、定稿 helper、发布归档、模板与配对实现均由其他域拥有，行为以 README 的声明为据，未在本域复跑。
- 16 份 `.schema.json` 采用结构解析（根集合、节点种类、摘要、`never`/union 分支、与声明逐根比对），**不是**逐行散文阅读。
- 本域无法验证：CI 是否真的挂了这些门禁；检查点与权威记录是否被联合篡改；记录是否经人评审；中文与英文的逐句翻译质量（16 份中文正文与 `README.zh.md` 已逐行 raw 阅读并与英文机制对照，长行按 768 显示单元上限单独复读——中文 v4 第 94/102 行、中文 README 第 67 行；机器声明逐字节相等，但未做翻译质量审计）。
- 记录 id 的日期不保证等于历史顺序：`2026-09-19-external-subagent-catalog` 的 `previous` 是 `2026-09-20-unknown-child-catalog`；以声明图为准。
- `--check` 不能发现已被确认记录覆盖的转换；必须配合 base/head 清单比较。
- 摘要不是运行时验证，也不覆盖纯行为变化或不透明值内部结构。

## 附：最小记录骨架（可直接复制）

````markdown
---
description: "Records a persistence type transition and its compatibility acknowledgement."
kind: persistence-change
---

# <YYYY-MM-DD-slug>

English | [中文](<YYYY-MM-DD-slug>.zh.md)

## Summary

<一句话说明变化与是否保持 Session 版本。>

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: <YYYY-MM-DD-slug>
baseline: false
changes:
  - root: "<RootName 或 event:type>"
    previous: "<前驱记录 id 或 null>"
    after: "<64 位摘要或 null>"
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

<旧记录在新读取器下如何；旧读取器遇到新记录如何；缺失/忽略/拒绝信号；同时变化。>

<a id="verification"></a>
## Verification

<实际运行的命令、文件/用例数量、观察结果。>

<a id="dev-note"></a>
## Dev Note

None.
````

中文侧使用相同锚点 id，并保持声明逐字节相同；随后重记 `.i18n.yaml` 并重新生成 `.schema.json`。

## 附：源证据索引（逐机制）

下表把每个机制声明的每个源范围写成固定提交引用，便于评审时逐条回查；正文中的引用可与此表交叉核对。

- `persistence-current-records.record-quadruple`：`deepseek-harness/docs/persistence-changes/README.md:31-44@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:31-44@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:1-52@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.md:1-48@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:1-28@687f282e`
- `persistence-current-records.machine-declaration`：`deepseek-harness/docs/persistence-changes/README.md:40-44@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:40-44@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:24-265@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:24-37@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.zh.md:1-60@687f282e`
- `persistence-current-records.compatibility-decision`：`deepseek-harness/docs/persistence-changes/README.md:46-63@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:46-63@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.md:36-40@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-14-workspace-changes-event.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-30-job-session-lifecycle.md:40-44@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-106@687f282e`
- `persistence-current-records.same-version-evidence`：`deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:69-69@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:40-49@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-14-image-offload.md:84-93@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.md:48-57@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-05-ptc-operation-metadata.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-13-deepseek-search-thinking.md:36-45@687f282e`
- `persistence-current-records.payload-version-evolution`：`deepseek-harness/docs/persistence-changes/README.md:65-65@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:65-65@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-20-unknown-child-catalog.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-20-unknown-child-catalog.schema.json:1-250@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.schema.json:1-290@687f282e`
- `persistence-current-records.attribution-policy`：`deepseek-harness/docs/persistence-changes/README.md:67-67@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:67-67@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:48-57@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-05-working-directory-attribution.md:48-52@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-13-user-rpc-principal.md:48-57@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:98-104@687f282e`
- `persistence-current-records.reserved-field`：`deepseek-harness/docs/persistence-changes/README.md:71-71@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:71-71@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:96-96@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e`
- `persistence-current-records.history-graph`：`deepseek-harness/docs/persistence-changes/README.md:76-78@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:76-78@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:24-265@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.md:24-37@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-14-image-offload.md:24-81@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-19-external-subagent-catalog.md:24-33@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e`
- `persistence-current-records.current-root-agreement`：`deepseek-harness/docs/persistence-changes/README.md:63-63@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:76-76@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:63-63@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:76-76@687f282e`、`deepseek-harness/docs/persistence-changes/2026-10-05-ptc-operation-metadata.md:36-45@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:107-117@687f282e`
- `persistence-current-records.root-inventory`：`deepseek-harness/docs/persistence-changes/README.md:29-29@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:29-29@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.md:24-265@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.schema.json:1-13557@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-13-working-directory.schema.json:1-76@687f282e`
- `persistence-current-records.digest-scope`：`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:80-80@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.schema.json:1-13557@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-12-auto-review-error-metadata.schema.json:1-910@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-18-schedule-optional-title.schema.json:1-302@687f282e`
- `persistence-current-records.finalized-checkpoint`：`deepseek-harness/docs/persistence-changes/README.md:40-42@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:40-42@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-85@687f282e`
- `persistence-current-records.terminal-refresh`：`deepseek-harness/docs/persistence-changes/README.md:78-78@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:78-78@687f282e`
- `persistence-current-records.bilingual-pairing`：`deepseek-harness/docs/persistence-changes/README.md:35-44@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:1-90@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-21-user-question-reply.md:53-57@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-11-initial.i18n.yaml:1-28@687f282e`、`deepseek-harness/docs/persistence-changes/README.i18n.yaml:1-28@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.zh.md:1-120@687f282e`
- `persistence-current-records.archive-separation`：`deepseek-harness/docs/persistence-changes/README.md:11-15@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:11-15@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:94-94@687f282e`
- `persistence-current-records.version-bump-migration`：`deepseek-harness/docs/persistence-changes/README.md:51-61@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:51-61@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:24-106@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:107-117@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.schema.json:1-16212@687f282e`
- `persistence-current-records.verifier-trust-boundary`：`deepseek-harness/docs/persistence-changes/README.md:61-63@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:69-69@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:76-80@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:63-63@687f282e`、`deepseek-harness/docs/persistence-changes/README.zh.md:78-78@687f282e`、`deepseek-harness/docs/persistence-changes/2026-09-16-session-format-v4.md:96-96@687f282e`
