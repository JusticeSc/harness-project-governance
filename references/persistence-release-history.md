# 预发布持久化历史归档（persistence-release-history）迁移参考

本文件覆盖 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（下称“源”）中 `docs/persistence-changes/releases/` 的 108 个文件：3 个 README 侧、26 个 alpha/RC tag 各自的 `.md`/`.zh.md`/`.i18n.yaml`/`.schema.json`，以及 `manifest.json`。读者触发条件：要解释某个旧 tag 实际写出什么结构、要新增/补录一个预发布 tag 的历史、要审查有人拿“历史记录”当当前兼容授权、或要判断快照能证明/不能证明什么。

标注约定：**【源义务】** 来自源内文档或机器声明；**【源实现】** 来自验证器/生成器代码的实际行为；**【迁移设计】** 是本参考给出的可移植做法；**【额外建议】** 是超出源义务的建议。引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`。

本参考**没有**运行 `pnpm run verify-persistence-releases`、`--write` 或 `doc-sync`；所有“会失败/会刷新”的描述来自源码阅读，不是执行证据。`.schema.json` 是机器快照，本参考对其做的是**全文件结构检查**（键、roots/types 数量、digest 形状、可达性声明），不是逐行散文阅读。

## 0. 读者触发索引

| 你要做的事 | 先读 | 完成信号 |
| --- | --- | --- |
| 解释“这个 tag 到底有哪些持久化根类型” | §1、附录 A | 能从空前驱开始重放出该 tag 的 root/digest 集合 |
| 解释某个 root digest 为什么变了 | §2 | before/after 能对齐前驱和本 tag 快照 |
| 新增一个 tag 记录或补录历史 | §1、§3、§4 | manifest 追加、四件套齐全、默认验证无 stale |
| 判断“历史记录能否授权当前 PR” | §6 | 明确当前决策走 writer/released record，不走归档 |
| 评估快照证据强度 | §5 | 能列出快照证明与不证明的清单 |
| 迁移到另一个产品 | §7 | 参数化 capture 范围、writer 常量来源、生成区域 |

## 1. 冻结基线 + 增量重放 {#persistence-release-history.frozen-baseline-and-delta}

**问题。** 只保留“当前 schema”会让旧 tag 的类型信息永久丢失；只保留每个 tag 的 diff 而不声明前驱，则无法从任何单条记录恢复该 tag 的完整状态；反过来，用当前 schema 回填旧 tag 会制造伪历史。

**【源义务】** 归档是 26 条记录的链，不是 26 份独立快照：

- 记录按 manifest 的语义版本顺序排列；每条声明的 `previous` 必须等于 manifest 中的紧邻前驱，第一条为 `null`。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:62-69@687f282e`、`deepseek-harness/scripts/persistence-releases.ts:137-153@687f282e`。
- 第一条记录建立历史比较起点，其 `changes` 列出**全部**提取到的 root：`dsh-v0.0.1-rc.1` 为 42 roots / 341 types，42 条 after、before 全为 `null`。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.1.md:24-201@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.1.schema.json:1-39868@687f282e`。
- 后续记录只列“仍存在且发生变化/新增”的 root 及其可达类型。`dsh-v0.0.1-rc.2` 声明 45 个变化 root、快照 45 roots / 370 types；但该 tag 的完整清单是 47 roots / 374 types——因为 2 个未变 root 不在增量快照里。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.2.md:36-192@687f282e`。
- 无变化的 tag 必须写 `changes: []`，且快照是**空对象** `{"formatVersion":1,"roots":[],"types":[]}`（5 行）；26 条中有 12 条这样的记录（rc.4、rc.5、v0.1.0-rc.1/2/3/5/6、v0.1.2-alpha.3/alpha.5、v0.1.2-rc.1、v0.1.5-rc.1/rc.2）。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.4.md:36-75@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.5-rc.2.md:24-75@687f282e`。
- 删除用 `after: null`，重放时从累计状态移除。26 条记录共 262 个 change 条目，其中 7 个 `after: null`。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.3.md:44-126@687f282e`（4 个 `compact/*` 删除 + 4 个 `compaction/*` 新增）。

**【源实现】** 验证器从空前驱开始逐 tag 重放：对每条 change，`before` 必须等于累计状态中该 root 的当前 digest（不存在则 `null`），`after` 必须等于本 tag 快照中的 root digest（删除则 `null`）；快照的 root key 集合必须恰好等于本记录中 `after !== null` 的 root 集合；每个声明的 change 必须至少产生一个结构差异。依据：`deepseek-harness/scripts/persistence-releases.ts:187-231@687f282e`。

**【迁移设计】** 重放算法（语言无关）：
1. `state = {}`。
2. 对 manifest 中每个 tag：读取机器声明，断言 `previous === 上一个 tag`。
3. 对每条 `{root,before,after}`：断言 `state[root] ?? null === before`；随后 `after === null ? delete state[root] : state[root] = after`。
4. 加载该 tag 的 `.schema.json`，断言 `roots` 的 key 集合 = 本记录 `after !== null` 的 key 集合，且每个 root digest 等于 `after`。
5. 累计 `state` 的 root 数与可达类型数就是 README 索引里的 `Roots / types`（例如最后一条为 59 / 462），它与单条快照的 roots/types 通常不相等，这是设计而非错误。

**责任者 / 完成信号。** 归档作者负责写链；评审者负责确认第一条确实全量、后续确实只含变化 root；完成信号是默认验证通过且索引/清单单元格与快照一致。**失败处理。** `before digest mismatch`、`snapshot roots do not match changed after schemas`、`unchanged transition`、重复 root、`previous` 错误都会使验证失败；按错误路径修记录或快照，不要改验证器放宽。

**例外。** 首个 tag 没有比较输入，不对更早版本作兼容性判断；空记录不是“没有采集”，而是“相邻 tag 的类型图相同”。

**证据上限。** 链只能证明声明之间自洽；它不能证明被捕获的 tag 在远端真实存在，也不能证明抽取器没有漏类型。

## 2. Digest 绑定、null 语义与图规范化 {#persistence-release-history.digest-and-union-binding}

**问题。** 如果 digest 是对源文件文本做哈希，那么格式化、注释或相邻文件变化都会污染历史；如果 digest 没有方向绑定，before/after 可以互换或复制粘贴而不被发现。

**【源实现】** digest 是**规范化后的 schema 图**的 SHA-256（`schemaDigest(canonicalizeSchema(root.schema.nodes, index))`），既用于 root，也用于每个可达类型。依据：`deepseek-harness/scripts/persistence-releases.ts:155-167@687f282e`。

**【源义务】** 绑定规则：

- 每条 change 的 `before` 必须等于前驱累计状态中该 root 的 digest；根不存在时为 `null`。
- `after` 必须等于本 tag 快照中该 root 的 digest；删除时为 `null`。
- 快照 `types[]` 必须**恰好**覆盖从 roots 可达的类型集：不得有未引用类型、不得重复、不得遗漏。依据：`deepseek-harness/scripts/persistence-releases.ts:155-167@687f282e`。
- root key 只能是 `SessionHeader`、`JsonlHeaderLine`、`SessionEventEnvelope` 或 `event:*`；同一 tag 不得重复声明同一 root。依据：`deepseek-harness/scripts/persistence-releases.ts:137-153@687f282e`。
- `SessionHeader.version` 必须是 required 字段，且为 `number` 原语（历史宽声明）或等于记录版本的字面量；最终重放状态必须同时含三个 header root。依据：`deepseek-harness/scripts/persistence-releases.ts:169-182@687f282e`。

**【源实现/事实】** 快照结构可直接核对：`formatVersion: 1`，`roots[]` 每项含 `key/kind/digest/schema`，`types[]` 每项含 `digest/schema/names/sources`，`sources` 只保留文件路径（基线快照的 341 类型中 164 个有来源、共 178 条路径引用，41 个不同文件，无行号）。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.1.schema.json:1-39868@687f282e`。

**具体例子（可用于测试断言）：**

- 事件键重命名：`dsh-v0.0.1-rc.3` 把 4 个 `event:compact/*` 置为 `after: null`，同时新增 4 个 `event:compaction/*`；12 个 change 产生 12 项结构差异。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.3.md:44-126@687f282e`。
- 回归/回退会恢复旧 digest：`event:permission/preset` 在 v0.1.1-rc.1 从 `5c45bf4c…` 变为 `7271e4b7…`，在 v0.1.1-rc.2 又变回 `5c45bf4c…`。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.1-rc.1.md:44-82@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.1-rc.2.md:44-119@687f282e`。
- 信封是 union 节点：新增/删除事件会改变 `SessionEventEnvelope` digest（v0.1.5-alpha.1 中 `04184edc…` → `5776e555…`）；该 tag 的 `assistant/message.surfaceOp` 也已从 optional 变为 required。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.5-alpha.1.schema.json:1-24597@687f282e`。
- 大增量：`dsh-v0.1.2-alpha.1` 有 52 个变化 root、61 项结构差异，主要是 envelope/event 上的 `ignorable` 移除与 3 个新事件。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.2-alpha.1.md:10-61@687f282e`。

**能证明什么。** digest 相等 = 规范化结构相等；digest 变化 = 规范化结构变化。普通注释、源位置、别名与无害声明重排不影响 digest；兼容性注解是被记录的策略数据，会改变 digest；未注解的 v1 快照保留原归一化与指纹域，带策略的图使用独立指纹域。依据：`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`。规范化覆盖与例外类的 canonical 机制由 `persistence-current-records.digest-scope` 与 `persistence-historical-finalized.schema-fingerprint-equivalence` 拥有；本域只负责历史 release 链的 before/after 绑定。**不能证明什么。** digest 不变不证明运行时行为、编解码或迁移安全不变；digest 也不是源码文本哈希。

**【迁移设计】** 若无法复用源抽取器，至少实现：稳定 canonical form（字段排序、类型引用内联/编号一致）、对 root 与每个可达类型分别哈希、把 `before/after` 存为可重放的显式值、null 表示缺失、删除必须以 `after: null` 表达。

## 3. 不可变发布与“只刷新有界区域” {#persistence-release-history.immutable-publication}

**问题。** 历史记录一旦被人手改（补一句“其实兼容”、把旧 digest 更新成当前值、把生成表格删掉），它就不再是发布证据。反过来，如果每次验证都重写整页，人工撰写的摘要与来源证据会丢失。

**【源义务】** `--write` 只在**完整验证通过后**刷新有界生成区域和配对 sidecar；它保留人工撰写的概述、源码证据、机器声明和 `.schema.json`。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:82-94@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/persistence-release.md:24-30@687f282e`。

**【源实现】** 生成器只替换三类 marker 区域，且要求每类 marker 恰好一对；缺失或重复即报错：

- README 索引：`persistence-release-index:start/end`。
- 每条记录的清单：`persistence-release-inventory:start/end`。
- 每条记录的结构变化事实：`persistence-release-changes:start/end`。
依据：`deepseek-harness/scripts/persistence-release-facts.ts:16-24@687f282e`、`deepseek-harness/scripts/persistence-release-facts.ts:53-95@687f282e`。

**【源实现】** 默认验证（不带 `--write`）把重新生成的 `.md` 内容与磁盘内容比较，任何差异都报 `Stale persistence release facts` 并失败；`--write` 才写入全部 changed artifacts。依据：`deepseek-harness/scripts/persistence-releases.ts:232-257@687f282e`。

**【源义务】** 发布集合是精确的：目录必须恰好包含 `manifest.json`、`README.md/.zh.md/.i18n.yaml` 和每个 tag 的 `.md/.zh.md/.i18n.yaml/.schema.json`；缺文件与“未引用文件”都失败。依据：`deepseek-harness/scripts/persistence-releases.ts:187-205@687f282e`。

**【源义务】** 每条记录：

- frontmatter `kind: persistence-release`；
- 恰好一个 ```yaml persistence-release``` 机器块；
- 中英文机器块**逐字相等**；
- 历史源码引用**禁止行号**（验证器正则拒绝 `.ts:12` 这类引用）。
依据：`deepseek-harness/scripts/persistence-releases.ts:123-135@687f282e`。

**【源义务】** 配对 sidecar 记录每个 heading 的 en/zh 哈希；编辑任一侧后必须同步另一侧并重新记录。依据：`deepseek-harness/docs/persistence-changes/releases/README.i18n.yaml:1-31@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.1.i18n.yaml:1-31@687f282e`。

**责任者 / 完成信号。** 作者只改人工区域与机器数据；发布前运行默认验证；需要刷新生成区域时先完整验证再 `--write`。完成信号：默认验证通过、无 stale、配对记录匹配。**失败处理。** stale → 先确认机器数据无误再 `--write`；sidecar 不匹配 → 同步两侧文本后重录；unreferenced artifact → 删除或补进 manifest，不能留在目录里。

**例外。** `--write` 允许刷新生成区域与 pairing；不允许改机器声明、schema 或人工概述。历史记录不能用“当前 schema 更好看”为理由重写。

## 4. 捕获范围、tag 生命周期与 writer 常量 {#persistence-release-history.capture-scope-lifecycle}

**问题。** 归档必须声明“覆盖到哪里”，否则读者会把“没记录”误当“没发生”。同时，产品 tag 的 writer 版本是源码常量，不能从 schema 的宽泛 `number` 声明推出来。

**【源义务】** `manifest.json` 的机器契约：

- `schemaVersion: 1`；`capturedAt` 是 `YYYY-MM-DD` 且为真实日期；`releases` 非空。
- tag 匹配 `^dsh-v<major>.<minor>.<patch>-(alpha|rc).<N>$`（无前导零），严格按语义版本递增且不重复。
- 每条含 `tag`、`sourceDate`（必填 ISO 时间戳）、`publishedAt`（可为 `null`）、`sessionFormatVersion`（非负安全整数）。
依据：`deepseek-harness/docs/persistence-changes/releases/manifest.json:1-162@687f282e`、`deepseek-harness/scripts/persistence-releases.ts:103-122@687f282e`。

**【源实现/事实】** 本归档捕获于 `2026-09-12`，共 26 个 tag：

- 最早的 10 个没有发布事实（`publishedAt: null`）；后 16 个有 `publishedAt`。前 10 个是 v0.0.1-rc.1..rc.5、v0.1.0-rc.1/2/3/5/6。
- 语义顺序中缺失的 tag **不补造**：例如没有 `dsh-v0.1.0-rc.4`，捕获中也没有 v0.1.4 系列。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:24-60@687f282e`。
- 写入版本生命周期：writer 0 覆盖到 `dsh-v0.1.2-rc.1`；`dsh-v0.1.3-alpha.1` 与 alpha.2 为 2；从 `dsh-v0.1.5-alpha.1` 起为 3。**没有任何捕获 tag 使用 writer 1**；0→2 的跳变发生在 v0.1.2-rc.1 与 v0.1.3-alpha.1 之间。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.3-alpha.1.md:10-43@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.5-alpha.1.md:10-43@687f282e`。
- writer 值来自该 tag 的源码常量 `packages/core/session/src/types.ts` 的 `SESSION_FORMAT_VERSION`，并在记录中单独写出；不能从 schema 的 `version: number` 反推。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:62-79@687f282e`。

**生命周期（新增/补录时）：**
1. 确认 tag 在捕获范围之后；按语义版本插入 manifest 末尾（中间补录必须保持全序唯一）。
2. 为 tag 生成 `.schema.json`（只含变化 root 及其可达类型）与双语记录/机器声明/sidecar。
3. 运行默认验证；需要刷新索引/清单/结构变化时 `--write`。
4. 发布事实已经存在的 tag 填 `publishedAt`；只有 tag 时保持 `null`。

**责任者 / 完成信号。** 归档作者维护 manifest 与四件套；评审者确认 `capturedAt`/tag 顺序/缺失 tag 未被补造。**失败处理。** tag 格式/顺序/重复、缺失 artifact、`publishedAt` 非日期都会失败；按 manifest 契约修正，不要放宽正则。

**证据上限。** 离线检查不会发现捕获日期之后才出现的新 tag；“完整性”只相对于 manifest 声明的范围。tag 是否真实存在、`publishedAt` 是否准确，需要联网或 Git 侧证据。

## 5. 版本快照能证明与不能证明什么 {#persistence-release-history.snapshot-evidence-limits}

**问题。** 快照看起来像“当年的 schema”，很容易被当成运行时兼容、迁移安全或源码逐字复现的证明。

**【源义务】** 源明确划定边界：这是“近似历史视图”，用于阅读与格式校验；不建立历史运行时兼容，也不替代当前源码确认链。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:62-79@687f282e`。

**能证明：**

- 在该 tag 上，按当时源码 + TypeScript 6.0.3 + 已合入的 schema 抽取器得到的**规范化、规范化后可达**类型图；
- root digest 与可达类型 digest 之间的自洽；
- 声明的 writer 常量作为**单独的源码事实**被记录（不是 schema 推导）；
- 相邻 tag 之间的规范化结构差异（含 262 个 change 条目、256 项结构差异，其中 207 项按当前规则标 `review-required`、49 项 `not-required`）。

**不能证明：**

- 逐字源码文本或当时工具链的逐字重现；
- 旧应用能被重放、完整 codec 行为、迁移安全；
- 历史运行时兼容性；
- 摘要/概述的完备性（记录自己说明摘要只是粗略结构上下文）；
- digest 不变 ⇒ 行为不变；
- tag 的真实存在或版本提升曾经合规。

依据：`deepseek-harness/docs/persistence-changes/releases/README.md:71-80@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.1.md:24-42@687f282e`。

**【源义务/事实】** 两个刻意保留的历史差异：

- 前 22 个 tag 的 surface 事件允许可选 `surfaceOp`；历史解析保留 optional，当前解析要求 required。结构上可验证：rc.1 的 `event:assistant/message` 顶层 `surfaceOp` 为 `optional: true`，v0.1.5-alpha.1 的同一属性为 `optional: false`（结构表记为 `property-made-required`）。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:71-79@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.5-alpha.1.md:10-24@687f282e`。
- 早期 `SessionHeader.version: number` 按原声明保留；实际常量为 0。不能从宽泛 `number` 声明推出版本常量。快照中 rc.1 与 v0.1.2-alpha.4 是 required `primitive/number`，v0.1.3-alpha.1 与 v0.1.5-alpha.1 是字面量 2/3。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.1.schema.json:1-39868@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.3-alpha.1.md:10-24@687f282e`。

**历史事实（可用来反驳“旧版本一定守规矩”）：** writer 0 期间确实发生过不升版本的结构变化——rc.2 的 48 项差异、v0.1.2-alpha.1 的 61 项差异都发生在 `sessionFormatVersion: 0`。依据：`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.2.md:190-248@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.1.2-alpha.1.md:10-61@687f282e`。

**证据上限。** 结构比较由当前分类器执行；它标出的 `review-required` 只是当前规则的阅读辅助，不是历史合规判决，也不是迁移义务。writer 推进时的只读全量归档另由 `persistence-historical-finalized.format-snapshot-archive` 与 `persistence-historical-finalized.historical-evidence-limits` 承担；本域的逐 tag 增量链不能替代它。

## 6. 与当前兼容决策的边界 {#persistence-release-history.historical-vs-current-compatibility}

**问题。** 两套东西长得很像：`docs/persistence-changes/` 根目录是**当前**的类型变更确认链（每个 dated change 一份 acknowledgement），`releases/` 是**历史** tag 快照。混淆会导致当前 PR 用一条回填记录逃避版本提升或 acknowledgement。

**【源义务】**

- 历史记录“不是当时的兼容性确认”，与父目录的当前确认链**分开校验**。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:62-69@687f282e`。
- 回填记录**不能**授权当前 PR 省略 acknowledgement 或必需的版本提升；也不能为了容纳旧发布而重写已提交基线。依据：`deepseek-harness/.agents/skills/dsh-doc/templates/persistence-release.md:24-30@687f282e`。
- 当前规则对旧变化的 `review-required` 分类只用于比较，不表示旧版本曾遵守、不证明迁移正确性或运行时兼容性。依据：`deepseek-harness/scripts/persistence-releases.ts:183-186@687f282e`、`deepseek-harness/docs/persistence-changes/releases/dsh-v0.0.1-rc.2.md:190-196@687f282e`。

**正确的分工（【迁移设计】）：**

| 问题 | 权威来源 | 本归档的角色 |
| --- | --- | --- |
| 某 tag 实际写出什么结构 | 本归档 + 该 tag 源码 | 提供规范化对比基线 |
| 当前 writer 是什么 | `SESSION_FORMAT_VERSION`（当前源码） | 只能看历史值，不能代替当前值 |
| 哪些格式已定稿/已发布 | 当前 finalized/released record 与 evidenceTag | 不参与判定 |
| 某个当前改动是否需要版本提升/确认 | 当前 dated change 记录与 schema 策略 | 不能作为豁免依据 |
| 旧 Session 的迁移是否安全 | 迁移实现与真实回放测试 | 不证明 |

父目录当前链、writer/released 权威与 schema 策略分别由发布域的 `release-persistence-records`、`release-session-authority`、`release-persistence-schema-policy` 机制承担；当前/历史分离的 canonical 机制由 `persistence-current-records.archive-separation` 承担。本域只负责历史快照，不重复定义它们。依据：`deepseek-harness/docs/persistence-changes/README.md:1-90@687f282e`。

**责任者 / 完成信号。** 发布经理负责判定当前兼容状态；评审者负责拒绝“历史记录即授权”的论证。**失败处理。** 若发现当前 PR 引用 `releases/` 作为兼容证据，应要求补当前 acknowledgement/版本决策；若历史记录与当前链冲突，以当前链为准并检查是否有人把回填写进了当前目录。

**例外。** 历史归档可以作为“旧 tag 实际写出过该结构”的证据，用于设计迁移与回归 fixture；它不能作为“因此当前可以不做版本提升”的证据。

## 7. 迁移到另一个产品 {#persistence-release-history.migration-checklist}

**【迁移设计】** 参数化清单：

1. **定义 capture 范围**：产品 tag 前缀、捕获日期、哪些 tag 无发布事实（`publishedAt: null`）、哪些有发布时间。写入 manifest 的 `capturedAt` 与 `publishedAt`；不补造缺失 tag。
2. **确定 writer 权威**：仓库中唯一的 hand-written 格式常量；每条记录单独记录该 tag 的常量值，不从 schema 推导。
3. **选择规范化与抽取器**：必须能输出 root + 全部可达类型；保留 `any/unknown` 为不透明，不做猜测性替换；历史源码引用去行号。
4. **建立增量约定**：首条全量；后续只存变化 root；无变化写空 `changes` 与空快照；删除用 `after: null`。
5. **把 digest 绑定做成验证器**：before 对前驱、after 对快照、types 对可达集合、root 集合对非空 after；每个 change 必须有结构差异。
6. **分离人工与生成**：三个 marker 区域 + 默认拒绝 stale + `--write` 仅在完整验证后刷新；sidecar 记录双语 heading 哈希。
7. **划清当前/历史边界**：历史目录单独验证；当前 acknowledgement 与版本决策不得引用历史记录作为豁免。
8. **写明证据上限**：近似回填、不重放旧应用、不证明 codec/迁移/运行时兼容、不证明 tag 真实存在。

**【额外建议】** 若产品没有 26 个预发布 tag，仍建议保留“第一条全量 + 后续增量 + 空记录”三态，因为空记录能区分“没采集”和“确实没变”。若产品没有多语言要求，可去掉 `.zh.md`/`.i18n.yaml`，但必须保留机器声明与 schema 的逐字/结构一致性检查。

## 附录 A：26 个捕获 tag 的机器事实

`已发布` 为“有”表示 manifest 的 `publishedAt` 非空；“无”表示 `publishedAt: null`。manifest 没有 release 对象字段。`roots/types` 是该 tag 的**累计**重建清单（README 索引列），不是单条快照的增量大小；`changes` 是声明条目数；`diffs` 是结构变化表行数。

| Tag | 日期(UTC) | writer | 已发布 | roots/types | changes | diffs |
| --- | --- | --- | --- | --- | --- | --- |
| dsh-v0.0.1-rc.1 | 2026-08-10 | 0 | 无 | 42 / 341 | 42 | 0（基线） |
| dsh-v0.0.1-rc.2 | 2026-08-11 | 0 | 无 | 47 / 374 | 45 | 48 |
| dsh-v0.0.1-rc.3 | 2026-08-12 | 0 | 无 | 47 / 374 | 12 | 12 |
| dsh-v0.0.1-rc.4 | 2026-08-12 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.0.1-rc.5 | 2026-08-12 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.1.0-rc.1 | 2026-08-13 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.1.0-rc.2 | 2026-08-13 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.1.0-rc.3 | 2026-08-13 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.1.0-rc.5 | 2026-08-13 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.1.0-rc.6 | 2026-08-13 | 0 | 无 | 47 / 374 | 0 | 0 |
| dsh-v0.1.0-rc.7 | 2026-08-17 | 0 | 有 | 47 / 376 | 1 | 1 |
| dsh-v0.1.0-rc.8 | 2026-08-19 | 0 | 有 | 51 / 403 | 8 | 8 |
| dsh-v0.1.1-rc.1 | 2026-08-21 | 0 | 有 | 51 / 407 | 1 | 1 |
| dsh-v0.1.1-rc.2 | 2026-08-21 | 0 | 有 | 51 / 404 | 10 | 11 |
| dsh-v0.1.2-alpha.1 | 2026-08-27 | 0 | 有 | 54 / 417 | 52 | 61 |
| dsh-v0.1.2-alpha.2 | 2026-08-30 | 0 | 有 | 54 / 417 | 52 | 52 |
| dsh-v0.1.2-alpha.3 | 2026-08-31 | 0 | 有 | 54 / 417 | 0 | 0 |
| dsh-v0.1.2-alpha.4 | 2026-09-01 | 0 | 有 | 54 / 415 | 4 | 5 |
| dsh-v0.1.2-alpha.5 | 2026-09-02 | 0 | 有 | 54 / 415 | 0 | 0 |
| dsh-v0.1.2-rc.1 | 2026-09-03 | 0 | 有 | 54 / 415 | 0 | 0 |
| dsh-v0.1.3-alpha.1 | 2026-09-04 | 2 | 有 | 54 / 425 | 17 | 25 |
| dsh-v0.1.3-alpha.2 | 2026-09-07 | 2 | 有 | 56 / 435 | 2 | 2 |
| dsh-v0.1.5-alpha.1 | 2026-09-08 | 3 | 有 | 57 / 443 | 12 | 25 |
| dsh-v0.1.5-alpha.2 | 2026-09-09 | 3 | 有 | 59 / 462 | 4 | 5 |
| dsh-v0.1.5-rc.1 | 2026-09-10 | 3 | 有 | 59 / 462 | 0 | 0 |
| dsh-v0.1.5-rc.2 | 2026-09-10 | 3 | 有 | 59 / 462 | 0 | 0 |

聚合：26 条记录、262 个 change、7 个删除、12 条零变化记录、256 项结构差异（207 `review-required` / 49 `not-required`）；快照合计约 7.99 MB，全部 `.schema.json` 的 `formatVersion` 为 1。

## 附录 B：命令、失败矩阵与恢复

源内命令：`pnpm run verify-persistence-releases`（默认校验）、`pnpm run verify-persistence-releases --write`（完整验证后刷新生成区域与 pairing）、`pnpm run doc-sync`（文档门）。依据：`deepseek-harness/docs/persistence-changes/releases/README.md:82-94@687f282e`。

| 现象 | 根因 | 动作 | 禁止 |
| --- | --- | --- | --- |
| `missing release artifact` | 四件套缺一 | 补文件或从 manifest 移除该 tag | 保留半套 |
| `unreferenced persistence release artifact` | 目录里有 manifest 外文件 | 删除或写入 manifest | 让验证器忽略 |
| `release tags must be unique and in semantic-version order` | 顺序/重复 | 按 semver 重排 | 改比较器 |
| `predecessor must be …` | previous 错 | 对齐 manifest 顺序 | 复制相邻值 |
| `before/after digest mismatch` | 记录与重放/快照不符 | 重新抽取并修记录 | 只改 digest 让检查过 |
| `snapshot roots do not match changed after schemas` | 快照多/少 root | 只保留非空 after roots | 用全量快照冒充增量 |
| `unchanged transition` | 声明了实际未变的 root | 删除该 change 或确认抽取 | 放宽为允许空变化 |
| `Stale persistence release facts` | 生成区域过期 | 确认机器数据后 `--write` | 手改生成表格 |
| `bilingual machine records differ` | 中英机器块不一致 | 同步为逐字相同 | 只改一侧 |

## 附录 C：证据边界与未决项

- 本参考未执行任何验证/生成命令；命令行为来自实现阅读。若要声称“归档通过”，必须在目标仓库实际运行并保留输出。
- 未联网核对 tag 存在性、`sourceDate`/`publishedAt` 真实性；离线检查按设计也不做这些事。
- 未重放旧应用，未验证 codec、迁移或运行时兼容；归档本身也不声称这些。
- 结构与计数（26 条、262 change、7 删除、12 空记录、256 差异、基线 42/341 与末条 59/462）来自对 108 个文件的结构化检查；`.schema.json` 未逐行散文阅读。
- 中文页与英文页的机器块经脚本比对为逐字相同；26 条中文正文均已全文阅读，较长的四页用两次显式区间读完（rc.1、rc.2、v0.1.2-alpha.1、v0.1.2-alpha.2）。
- 历史分类器的 `review-required` 语义只作当前规则比较；不要把它写成历史迁移义务。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `persistence-release-history.frozen-baseline-and-delta`：`deepseek-harness/docs/persistence-changes/releases/README.md:24-69@687f282e`
- `persistence-release-history.digest-and-union-binding`：`deepseek-harness/scripts/persistence-releases.ts:155-182@687f282e`
- `persistence-release-history.immutable-publication`：`deepseek-harness/docs/persistence-changes/releases/README.md:82-103@687f282e`、`deepseek-harness/scripts/persistence-release-facts.ts:1-95@687f282e`
- `persistence-release-history.snapshot-evidence-limits`：`deepseek-harness/docs/persistence-changes/releases/README.md:62-94@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/persistence-release.md:14-30@687f282e`
- `persistence-release-history.historical-vs-current-compatibility`：`deepseek-harness/docs/persistence-changes/releases/README.md:1-103@687f282e`
