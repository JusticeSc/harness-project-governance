# Session 历史格式与 finalized 检查点操作参考

本文把 DeepSeek Harness 中"历史 Session 格式快照 + finalized 兼容性检查点"这一套治理实践，整理成可迁移到其他项目的操作手册。读者对象是：要读取旧 Session、要推进持久化格式版本、要审阅兼容性声明、或要判断一份历史 schema 到底能证明什么的维护者。

证据提交固定为 `687f282e8625c6b8d11ff58211a90524be2e4317`；引用一律写 `deepseek-harness/<path>:<start>-<end>@687f282e`。本文区分四类陈述：

- **【源义务】** 源项目明确规定、且由检查器或评审执行的要求；
- **【源实现事实】** 源项目当前代码/产物呈现的事实，不自动等于规范要求；
- **【迁移设计】** 把机制搬到新项目时的建议结构；
- **【额外建议】** 源项目没有承诺、但迁移时值得补的加固项。

## 按触发条件选择阅读路径

| 你的处境 | 先读 | 关键产物 |
|---|---|---|
| 拿到一份旧 Session，判断它属于哪个格式、能查哪份完整 schema | §1、§8 | `docs/persistence-changes/historical-formats/README.md`、`vN.md`、`vN.schema.json` |
| 即将把写入器常量从 N 推到 N+1，需要先冻结 N 的证据 | §2、§5 | `vN.schema.json`、`docs/cookbook/adding-a-session-format-version.md` |
| 要写/审一份新的历史格式双语记录 | §1、§7 | `vN.md`、`vN.zh.md`、`vN.i18n.yaml` |
| 两个格式的声明看起来一样，但不确定嵌套类型是否变了 | §3 | `yaml persistence-format` 的 root digest、`vN.schema.json` |
| 要解释 `finalized/v4.json`、接受基线、为什么不能改旧记录 | §4 | `docs/persistence-changes/finalized/v4.json` |
| 要做 V0→V1→V2→V3→V4 的相邻迁移 | §5 | 各 `session-format-v*-to-v*` codec/spec |
| 有人拿历史文档当"迁移安全/运行时行为"的证据 | §6 | 各 `vN.md` 的 Verification and limitations |
| 改了英文或中文一边，生成表/配对哈希过期 | §7 | `*.i18n.yaml`、`--write`、`--archive` |
| 要追溯某份快照到底来自哪个 tag/PR/中间树 | §8 | Source evidence 段、release archive |

## 0. 术语与四个权威

【源义务】源项目把四件事分开，任何一件都不能替代另一件：

| 权威 | 位置/载体 | 回答的问题 |
|---|---|---|
| checkout writer | `SESSION_FORMAT_VERSION`（`packages/core/session/src/types.ts`） | 当前工作树写出的格式号是多少 |
| finalized baseline | `docs/session-format-status.md` 的 `yaml session-format-finalization` + `docs/persistence-changes/finalized/vN.json` | 哪个格式已被接受为兼容基线 |
| released format | `docs/session-format-status.md` 的 `yaml session-format-release` + `evidenceTag` | 哪个格式已经随产品发布 |
| historical references | `docs/persistence-changes/historical-formats/` | 每个旧整数对应的完整声明快照 |

源文档明确：`SESSION_FORMAT_VERSION` 是代码中唯一手工维护的当前写入器数字；包版本、codec 导出名、fixture 文件名、projection-cache 版本都不是写入器权威。历史参考覆盖 `0..SESSION_FORMAT_VERSION-1`，当前格式由生成的 catalog 描述。参见 `deepseek-harness/docs/session-format-status.md:18-26@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/README.md:23-46@687f282e`。

【源实现事实】本域涉及四代历史格式和一代当前格式（数字来自索引与解析结果）：

| 格式 | 来源检查点 | 根/类型 | 文档 |
|---|---|---|---|
| 0 | tag `dsh-v0.1.2-rc.1`（writer 0，最后一个 V0 tag） | 54 / 415 | `v0.md` |
| 1 | PR #3349 的中间源码树（无 V1 tag） | 54 / 415 | `v1.md` |
| 2 | tag `dsh-v0.1.3-alpha.2`（writer 2） | 56 / 435 | `v2.md` |
| 3 | PR #4320 的初始树（writer 3，V4 改动前） | 60 / 467 | `v3.md` |
| 4 | current checkout / current catalog | 65 / 614（索引） | `docs/persistence-catalog.md` |
| 4 finalized | `finalized/v4.json` 记录的接受基线 | 62 个根（59 event + header/envelope），5 条 accepted record | `finalized/v4.json` |

注意最后一个数字：finalized 检查点不是"当前 catalog 的镜像"。本域结构化解析 `finalized/v4.json` 得到 62 个根；当前 `docs/persistence-schema.json` 有 65 个根，多出 `event:job/registered`、`event:job/settled`、`event:working-directory/change`，另有 8 个根的当前 digest 与检查点不同。finalized 锁定的是接受时的基线，后续兼容增量由新的 change record 承接——这正说明"finalized ≠ 当前格式冻结"。

## 1. 写入器版本驱动的历史格式全集 {#persistence-historical-finalized.historical-format-coverage}

### 触发

- `SESSION_FORMAT_VERSION` 增加；
- 新增/修改任何 `vN.md`、`vN.zh.md`、`vN.schema.json`；
- 需要回答"旧 Session 的某个字段在当年声明成什么"；
- 发布前检查历史参考是否完整。

### 前置条件

- 已确定当前写入器整数 N；
- 有一个"归一化类型模型"能生成完整声明清单（root 集合 + 所有可达类型）；
- 有稳定的双语模板和配对记录工具；
- 检查器只依赖工作树，不 fetch Git、不查询远端。

### 源义务

1. **每个低于 writer 的整数都必须有独立完整记录。** 不能只写"最新旧版"或把多个版本合并。索引明确列出 0–3，当前 4 使用 catalog；`verify-persistence-formats` 从 `SESSION_FORMAT_VERSION` 推导必需范围，缺一个就失败（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:51-51@687f282e`）。
2. **每条记录四件套齐全**：`vN.md` / `vN.zh.md` 双语参考、`vN.i18n.yaml` 配对记录、`vN.schema.json` 完整机器 schema、以及 `vN.md` 内的 `yaml persistence-format` 机器声明。声明为每个 root key 绑定捕获时的 digest，且必须与 schema、生成指纹表一致（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:42-42@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:46-113@687f282e`）。
3. **root 覆盖面固定**：逻辑 `SessionHeader`、物理 `JsonlHeaderLine`、`SessionEventEnvelope`、以及该检查点所有第一方事件；每个 root 包含所有可达声明类型（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:42-42@687f282e`）。
4. **历史事实原样保留**：历史可选字段、opaque 值不被当前类型替换；历史标识符只在 schema JSON 与已验证的生成 schema 区域中原样保留，人工正文使用当前术语（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:44-44@687f282e`）。
5. **历史来源不带行号**：历史记录保留文件路径、不保留源码行号，因为选中的历史树与当前 checkout 不同（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:44-44@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:30-30@687f282e`）。
6. **保留所有更早记录**，不得用后继记录替换前驱（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:60-60@687f282e`）。
7. **索引由已验证快照与 writer 常量生成**，不是手工版本清单（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:25-25@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/README.md:62-62@687f282e`）。

### 步骤

1. 读 `SESSION_FORMAT_VERSION`，算出 `0..N-1` 的缺口。
2. 对每个缺口确定检查点：已发布 tag、PR 树、或已捕获的中间树；写清"这是 tag 还是中间树"（见 §8）。
3. 用归一化类型模型提取 root 与全部可达类型；生成 `vN.schema.json`。
4. 在 `vN.md`/`vN.zh.md` 写：Summary、Source evidence、Format characteristics、机器声明、生成区、Verification and limitations、Dev Note。
5. 机器声明中每个 root 写 64 位小写十六进制 digest；与 schema 中对应 root 的 digest 相等。
6. 生成指纹表与完整类型区；检查 `<!-- persistence-format-schema:start -->` / `end` 标记完整。
7. 生成/刷新 `vN.i18n.yaml`（见 §7）。
8. 刷新索引表（格式、来源、参考、机器 schema、root/type 计数）。
9. 跑 `pnpm run verify-persistence-formats`；再跑 `pnpm run doc-sync`（若项目有对应命令）。
10. 提交；旧记录不动。

### 角色

- 格式维护者：选择检查点、写双语叙述、解释差异；
- schema 提取器：生成归一化类型和 digest；
- 验证器/CI：检查范围、声明、schema、生成表和配对记录；
- 评审者：判断"选中的检查点是否具有代表性"以及格式特征是否解释正确。

### 完成信号

- `pnpm run verify-persistence-formats` 退出 0；
- 索引中每个 `0..N-1` 都有链接，root/type 计数与 schema 解析结果一致；
- 机器声明 roots 数 = schema roots 数 = 指纹表行数；
- 任一历史 schema 的 types 数量与文档"contains X roots and Y reachable types"一致。

### 失败处理

- **缺记录**：补记录，不要放宽范围；检查器不接受"用当前 catalog 顶替旧记录"。
- **编号错误/多余记录**：删除多余项或改正编号，再跑验证。
- **schema 不完整/不一致**：重新从检查点提取；不要手改 JSON 让计数对上。
- **生成区过期**：先修机器数据，再 `--write` 刷新；不要手改生成表。

### 例外

- V0/V2 来自已发布 tag；V1 来自中间树；V3 来自 V4 改动前的初始树。来源类型不同，但都必须是"完整记录"。
- 当前格式（N）本身不使用 `vN.md` 快照，而使用生成的 catalog/schema；但 finalized 检查点是另一条独立权威（§4）。
- 如果某旧格式从未被任何已发布产品写出，仍然保留记录（V1 就是例子），只是明确它不是产品发布。

### 证据边界

- 完整 ≠ 逐行语义审阅。机器 schema 的 415/435/467 个类型在本文中已被穷举结构化解析、与 schema.types 绑定并全量重算 digest，但未逐条语义阅读每个类型定义；"完整"指结构消费完整，不是语义审阅完整。
- 同版本内的事件新增/可选载荷变化可以产生"另一份同样有效"的清单；一份快照不排除同格式的其他有效变体（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:46-46@687f282e`）。
- 格式号不标识该格式内每一次 payload 修订（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:25-25@687f282e`）。

### 迁移设计

【迁移设计】把"必需的旧格式数量"从一个手工清单改成**单一常量 + 派生范围**。产物目录建议：

```
docs/<area>/formats/
  README.md / README.zh.md           # 索引 + 维护规则
  vN.md / vN.zh.md                   # 双语参考
  vN.i18n.yaml                       # 配对哈希
  vN.schema.json                     # 完整归一化 schema
```

检查器伪逻辑：`writer = readConstant(); required = [0..writer-1]; current = parseCurrentCatalog(); assert current.version == writer; for n in required: assert artifacts(n) && declaration(n).roots == schema(n).roots && table(n) == declaration(n)`。

【额外建议】如果项目没有 `doc-sync` 等价物，至少加一个本地链接检查；如果历史格式数量会长期增长，给索引表加"source kind"列（tag / PR / tree），避免后人把中间树误当发布。

### 验证（计划）

- 正向：writer=4 时存在 v0–v3 四套四件套，命令退出 0。
- 拒绝：删除 `v2.schema.json` 或把 v2 编号改成 v5，命令非零并指出缺失/编号错误。
- 恢复：补回 v2 后重跑，退出 0，且 v0/v1/v3 的字节不变。

## 2. 推进写入器前的只读归档与拒绝式写入 {#persistence-historical-finalized.format-snapshot-archive}

### 触发

- 准备把 writer 从 N 推到 N+1；
- 需要补一份缺失的 `vN.schema.json`；
- 生成表/配对记录需要刷新；
- 有人要求"顺手把旧快照改成新类型"。

### 前置条件

- 当前 writer 仍等于要归档的 N；
- 当前 catalog 与当前 schema 描述同一份 N 清单；
- `pnpm run verify-persistence-catalog` 已通过；
- 目标 `vN.schema.json` 不存在（归档命令不覆盖）。

### 源义务

1. **先验证当前 catalog，再归档**：`pnpm run verify-persistence-catalog`，然后 `pnpm run verify-persistence-formats --archive N`；两条命令都必须在 writer 与 current schema 仍描述 N 时运行（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:53-60@687f282e`）。
2. **归档是只读派生产物**：`--archive N` 从当前 inventory 创建 `vN.schema.json`，只保留从 roots 可达的类型，移除源码行号（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:60-60@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5619-5621@687f282e`）。
3. **拒绝而不是修复/覆盖**。命令必须拒绝：
   - 目标已存在；
   - N 不等于当前 writer；
   - schema 无效或不完整；
   - 与 `--write` 组合使用。
   （`deepseek-harness/docs/persistence-changes/historical-formats/README.md:60-60@687f282e`）
4. **随后补双语记录与来源证据**：用 persistence-format 模板添加 snapshot 的双语记录和 source evidence；保留所有更早记录（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:60-60@687f282e`）。
5. **后继格式使用当前 catalog**；复制一份新的当前 catalog 不能满足"归档前驱"的要求（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:60-60@687f282e`）。
6. **`--write` 先验证机器数据，再更新生成 Markdown 与配对记录**；它保留人工说明、机器声明和 schema（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:70-70@687f282e`）。
7. **默认验证拒绝过期配对记录**；标准文档检查验证翻译与本地链接；current catalog 新鲜度由 `verify-persistence-catalog` 单独负责（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:70-70@687f282e`）。

### 步骤（V3→V4 实例）

```sh
# 仍在 writer=3、current schema 描述 V3 时
pnpm run verify-persistence-catalog
pnpm run verify-persistence-formats --archive 3
```

然后：补 `v3.md`/`v3.zh.md` 的来源证据与格式特征 → 生成配对记录 → 推进 writer 到 4 → 刷新当前 catalog/schema → 跑：

```sh
pnpm run verify-persistence-formats --write
pnpm run verify-persistence-formats
pnpm run doc-sync
```

### 角色

- 维护者：在正确的时间窗口执行归档；
- 归档命令：做版本/完整性/目标存在性拒绝；
- 评审者：确认归档后的记录没有替换旧证据。

### 完成信号

- `vN.schema.json` 存在，root/type 计数正确，source 条目只有文件路径、没有行号；
- 机器声明与 schema 的 roots/digests 一致；
- 后继格式的 catalog 版本等于新 writer；
- 验证命令全绿。

### 失败处理

- **目标已存在**：停止。检查是否已归档；若需修订，走显式变更流程，不要删旧文件重来。
- **版本不匹配**：说明 writer 已推进或选错 N；回到正确 checkout/提交，或在当前树上重新确定可归档版本。历史缺失不能靠"从 Git 重新生成"补——验证器设计上不 fetch Git。
- **schema 无效/不完整**：先修提取器或当前 catalog，再归档；不要手改 JSON。
- **与 `--write` 组合被拒**：拆成两步：先归档，再刷新生成区。

### 例外

- 没有历史 checkout 时，**不能**凭空生成旧格式；只能使用事先捕获的 tag/树快照。
- V0/V2 使用预发布归档中的 tag；V1 使用中间树；这类来源的历史 schema 可能不是由 `--archive` 现场生成，但同样必须完整并标明来源。
- 归档失败不是"可以手工修 JSON"的授权；失败意味着证据链条件不满足。

### 证据边界

- 归档只证明"当前 checkout 在 N 时的声明清单被复制并裁剪"，不证明运行时行为、不证明迁移安全（`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5621-5625@687f282e`）。
- 移除行号是设计要求，不是信息丢失事故；历史树与当前 checkout 行号不可比。
- 归档命令自身不判断"这份格式是否值得接受"；接受由 finalized 检查点/评审负责（§4）。

### 迁移设计

【迁移设计】把归档做成"单向、不可覆盖、只读输出"的 CLI：
- `archive(outgoingVersion)` 读取当前 inventory，断言 `inventory.version == outgoingVersion == SESSION_FORMAT_VERSION`；
- 目标文件存在即抛错；
- 写临时文件后原子 rename，避免半成品；
- 输出对象只含 `formatVersion`、`roots`、`types`，types 只保留 root 可达闭包；
- source 字段序列化时删除 `line/start/end`。

【额外建议】在 CI 中把"归档后的文件 hash"记入构建产物；在 writer bump 的 PR 模板里加一行"已运行 --archive N"。

### 验证（计划）

- 正向：writer=3 时 `--archive 3` 生成 `v3.schema.json`，root 可达类型数 = 467。
- 拒绝 A：再次 `--archive 3` → 非零并拒绝（目标已存在）。
- 拒绝 B：writer=3 时 `--archive 2` → 非零并拒绝（版本不等于当前 writer）。
- 拒绝 C：`--archive 3 --write` → 非零并拒绝（与 `--write` 组合）。
- 恢复：不覆盖旧文件，改用已有快照或正确版本；验证器保持绿。

## 3. 传递性类型指纹与声明/快照/生成表等价 {#persistence-historical-finalized.schema-fingerprint-equivalence}

### 触发

- 比较两个历史格式的 root 是否"真的相同"；
- 判断某个字段改动是否只是 alias/注释/顺序变化；
- 生成表、机器声明、schema JSON 三者对不上；
- 兼容性评审需要引用 digest。

### 前置条件

- 有归一化类型模型：对象字段、联合、交叉、索引签名、tuple、enum、literal、opaque 都有稳定表示；
- digest 函数确定"哪些元数据参与、哪些不参与"；
- 生成区有明确标记，人工区与生成区可分离。

### 源义务

1. **digest 覆盖完整可达结构**：每个定义只出现一次；引用保留共享与递归；定义旁的 SHA-256 包含其完整可达结构；源码名称和位置标识声明来源，但**不参与** digest（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:183-183@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:195-195@687f282e`）。
2. **root digest 覆盖所有引用字段**：完整 schema 的说明明确"Digests include all referenced fields"（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:117-117@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:123-123@687f282e`）。
3. **等价规则**（源项目在兼容性文档中给出完整版本）：
   - 普通注释、源码位置、alias 名称、无害的声明重排**不影响** digest；
   - 对象字段、联合分支、交叉操作数、索引签名可以在 resolved type 不变时重排；
   - tuple 位置、数字 enum 值仍然重要；
   - 兼容性注解/策略数据是记录下来的 policy，**会**影响 digest；
   - 未注解的 version-1 快照保留原归一化与指纹；带 policy 的图使用独立指纹域（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）。
4. **三处一致**：`yaml persistence-format` 的每个 root digest = `vN.schema.json` 中该 root 的 digest = 生成指纹表中的 SHA-256；生成区之外的人工表不得与生成区矛盾（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:119-179@687f282e`、`v0.schema.json` 结构）。
5. **过期生成区必须失败**，不能静默重写；`--write` 先验证机器数据，再更新生成 Markdown 与配对记录，并保留 authored/machine/schema（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:62-70@687f282e`）。
6. **历史标识符只保留在 schema JSON 与已验证生成区**；人工正文使用当前术语（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:44-44@687f282e`）。

### 可操作判据

- 两个 root digest 相同 ⇒ 在声明的归一化模型下，二者完全可达结构相同（不是"运行时行为相同"）。
- SessionHeader 每代都变是正常的：V0 `001ed6f6…`、V1 `88b77fa5…`、V2 `15918d78…`、V3 `2a8b1146…`、V4 `1a3440e3…`。
- JsonlHeaderLine 在 V0/V1 同为 `63496702…`，在 V2/V3/V4 同为 `18ee62b8…`——说明 V1→V2 改了物理 header，而 V2 之后保持。
- SessionEventEnvelope 在 V0/V1/V2 同为 `04184edc…`，在 V3/V4 同为 `5776e555…`——说明 V2→V3 改了信封，V3→V4 未再改。
- 同一 digest 可以出现在不同版本的 root 中（如 `event:agent-preset/selected` 在 V0–V3 都是 `a10c1747…`），这是"声明未变"的证据。

### 步骤

1. 解析 `vN.schema.json`：`roots[].key/kind/digest/schema`、`types["<id>"].digest/schema/names/sources`。
2. 对每个 root 计算/读取 digest；若手工比较，先确认比较的是同一归一化域（policy vs 非 policy）。
3. 比较两代：root 集合增删、root digest 变化、types 增删/变化。
4. 对 digest 变化做兼容性分类：可选字段新增、required→optional、普通事件新增可 same-version；required 化、类型改变、删除/重命名需要评审或 version bump（跨域规则，见 `deepseek-harness/docs/persistence-changes/README.md:49-63@687f282e`）。
5. 若声明/表/schema 不一致：先修机器数据，再 `--write`。
6. 提交后跑 `verify-persistence-formats` 与文档检查。

### 角色

- 提取器：生成归一化类型与 digest；
- 验证器：比较声明、schema、生成表；
- 评审者：解释 digest 变化的语义，不能把"digest 没变"当成"行为没变"。

### 完成信号

- 声明 roots = schema roots = 指纹表行；
- 每个 root digest 为 64 位小写十六进制；
- 生成区之外没有手写 digest；
- `verify-persistence-formats` 退出 0。

### 失败处理

- **digest 不匹配**：检查是否选了错误的检查点、是否把当前类型替换进旧快照、是否跨指纹域比较；不要改 digest 迁就文档。
- **生成表过期**：修 schema/机器声明后 `--write`；若 `--write` 也拒绝，先修机器数据。
- **alias/源码位置导致差异**：按等价规则应从 digest 中排除；若没有排除，修归一化器，而不是在文档里解释"这是等价变化"。
- **opaque 类型**：`unknown` 等不暴露内部结构，digest 无法发现其内部变化；需要运行时/编解码器测试补充。

### 例外

- 历史 version-1 快照与带 policy 的图的指纹域不同；跨域比较无意义。
- 普通注释/源码位置变化可以导致 catalog 文本或行号变化，但不应导致 digest 变化；这类"文本变了但 digest 没变"不需要新增兼容性确认（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）。
- 生成区的 HTML 注释标记是边界；标记外的内容由作者负责。

### 证据边界

- digest 只描述**声明的持久化类型**，不描述运行时校验、默认值、恢复逻辑或行为（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）。
- 同一段声明文本可能引用不同的嵌套类型；只看显示表达式会漏掉变化，这是采用传递性 digest 的原因。
- 本域对 415/435/467 个类型做了穷举结构与全量 digest 重算：每个 root 与 type 的 digest 都用 `schemaDigest(canonicalizeSchema(...))` 重算并与记录值比对，0 不匹配；但这证明的是"记录值等于按当前算法重算的值"，不是该算法在产品语义上正确，验证仍依赖项目的提取器测试。

### 生成区的生产者与消费者

【源实现事实】`<!-- persistence-format-schema:start/end -->` 之间的内容不是人工维护的表，而是从 `vN.schema.json` 渲染出来的：

- 生产者：`scripts/persistence-format-facts.ts:21-47` 的 `historicalSchema()` 拼装"完整 schema"标题、简介、`<details>` 包装，并调用 `scripts/render-persistence-schema.ts:273-320` 的 `renderPersistenceSchemaIndex()`（指纹表）与 `renderPersistenceSchemaDefinitions()`（每个类型的 anchor/标题/SHA-256/声明）。区域替换本身由 `scripts/persistence-format-facts.ts:12-19` 的 `replaceRegion()` 完成，它要求标记恰好出现一次（`deepseek-harness/scripts/persistence-format-facts.ts:12-19@687f282e`、`deepseek-harness/scripts/render-persistence-schema.ts:273-320@687f282e`）。
- 消费者：`scripts/persistence-formats.ts:59-135` 的 `machineBlock()`（两侧声明逐字节相等）、`parseRecord()`（root 键与 digest 形态）、`validateInventory()`（root/可达类型闭包、版本字段）与 `validateDocument()`；`scripts/persistence-formats.ts:207-231` 的 `runPersistenceFormats()` 比较重渲染结果与磁盘内容，只读模式下报 stale，`--write` 才写回。
- 因此"生成区过期"的判据是**重渲染结果与磁盘字节不等**，而不是某种语义检查；生成器未运行过就不存在对产物正确性的独立证明。

【本域结构化核对】对 V0-V3 的四个区域做了逐行穷举解析（不是抽样、不是计数）：八份文档（EN/ZH 各四份）的生成区内部共 41352 行（每语言 20676 行）全部由有序语法逐行消费，每个被消费行都带一个 ledger 类别（空行/锚点/标题/散文/表头分隔/root 行/wrapper/SHA 行/来源行/表格行/union 项/单行体），未分类 0 行、未消费尾部 0 行，ledger 计数再与独立行正则计数交叉核对。3464 个渲染定义（每语言 1732）逐一按 anchor 顺序、label 与 digest 绑定到 `vN.schema.json` 的 `types`，并把每个定义体与该类型自身 schema 节点重导出的 body 逐行比对（0 差异）。三个投影对齐：`yaml persistence-format` 声明 roots、生成指纹表行、`vN.schema.json` 的 `roots[]`，四代均 0 差异：54/54/56/60 个 root，key、kind、digest 三处一致；`types` 分别为 415/415/435/467 个且无重复 digest；schema 顶层键恰为 `formatVersion`/`roots`/`types`，source 条目不含行号；每个 root 与 type 的 digest 都用 `schemaDigest(canonicalizeSchema(...))` 重算一致。每份文件另按"声明栅栏 + 生成区 + 人工正文"三分且无重叠（合计等于文件行数）。中英区域比较的是机器投影（root 行、定义 digest/anchor/label/bodyKind/facts、声明块哈希、ledger 类别串），四代全部相等；但**区域字节不等**——本地化标签使两侧 interior SHA-256 不同，因此不主张字节相等。作为补充（不是替代）把生成区与 `renderPersistenceSchemaIndex()`+`renderPersistenceSchemaDefinitions()` 的纯渲染输出逐行比对，8/8 完全相等（证据：`verification/evidence/raw/p1-historical-payload-complete-structure.json`）。

【已纠正的先前缺陷】此前同名的"完整结构解析"由 `payload()` 循环完成，它只匹配 root 行、类型 anchor、标题与 SHA-256 行，静默丢弃解析类型体、属性/索引/tuple 表、union 项与 `<details>` wrapper，因此"每一行内部行都被分类"并未被那个探针证明（独立评审 P2，见 `_working/audit/p1-tail-independent-review-before.json`，该 adverse 记录原样保留）。同一轮 coverage 曾记 `zhRegionInteriorEqualsEn: true`，与两侧不同的 interior SHA-256 矛盾；现更正为 false 并保留字节差异。旧 sidecar 证据仍然有效：四份配对记录的 427/427/447/479 个 section 被重新解析并从当前双语文本重算，0 差异，旧字段逐项复现。

【声明解析的独立追查修复】探针会覆盖声明source中的重复 `tag`/`pullRequest` 键。V0/V3双语四例修复前均误接受；赋值前检查重复键后全部拒绝，连同原23项共27/27拒绝，八份原始文档仍通过。当前证据为 `verification/evidence/raw/p1-historical-declaration-duplicates-after.json`；before与不利复核保留。原complete-structure的正文ledger仍有效，但不是重复键拒绝的证明；这不是生产检查器运行或历史真实性证明。

### 迁移设计

【迁移设计】定义 `normalize(type) -> canonical graph`，再 `digest(graph)`；明确 exclusion 集合（source names/locations、aliases、comments、order-insensitive containers），明确 significance 集合（tuple index、enum numeric value、policy annotations）。把 `declaration.roots`、`schema.roots`、`generated.table` 三者做成同一函数的三个投影，验证器只比较投影结果。

【额外建议】给 digest 算法加版本号（如 `fingerprintDomain: 1|2`），避免未来改变归一化规则时把历史 digest 误判为内容变化。

### 验证（计划与已观测）

已观测（只读探针 + 内存变异控制，未运行生产检查器）：上述八份文档的 41352 行生成区内部行全部被消费、3464 个定义全部绑定 schema.types、纯渲染 8/8 相等；23 个内存变异（属性行类型/存在性、类型体、属性表头、union 项、指纹表 kind、定义 SHA、wrapper、尾部多余行、重复锚点、重复标记、声明 root/多余标量、schema 缺类型/重复类型/改属性/改 root digest）全部被拒绝，原始文件同时通过。证据：`verification/evidence/raw/p1-historical-payload-complete-structure.json#/controls`。

仍为计划（CLI 级，本域未执行）：
- 正向：V0/V1 的 `JsonlHeaderLine` digest 相同；V2/V3 的相同；V3/V4 的 `SessionEventEnvelope` 相同。
- 拒绝：只改生成指纹表中的一个 SHA-256 → `verify-persistence-formats` 非零（生成区过期）。
- 拒绝：只改声明中的 root digest → 验证非零；只改 schema 中嵌套类型 → digest 变化被检出。
- 恢复：`--write` 从已验证 schema 重建生成表，人工说明与机器声明不变，再验证通过。

## 4. finalized/vN.json 的接受基线与不可变记录 {#persistence-historical-finalized.finalized-checkpoint-immutability}

### 触发

- 某格式被接受为兼容基线；
- 已经 finalized 之后又出现 schema 变更；
- 需要决定"same-version 还是 version bump"；
- 有人想"更新一下已接受的旧记录/旧快照"。

### 前置条件

- 存在完整、已验证的 history（baseline + 后续 acknowledgement）；
- 当前 schema 与已确认的 history 匹配；
- 状态记录里有配对的 `latestFinalizedVersion`；
- 目标文件名 `finalized/vN.json` 尚不存在（新版本用新文件，不覆盖旧文件）。

### 源义务

1. **检查点结构固定**：顶层键恰为 `schemaVersion`、`sessionFormatVersion`、`roots`、`acceptedRecords`；`roots` 是 `key -> {kind, digest, event?, surface?}`；`acceptedRecords` 是 `record id -> 64 位小写十六进制语义哈希`（`deepseek-harness/docs/persistence-changes/finalized/v4.json:1-13@687f282e`、`deepseek-harness/docs/persistence-changes/finalized/v4.json:371-379@687f282e`；`deepseek-harness/docs/persistence-changes/README.md:40-40@687f282e`）。
2. **检查点记录的是接受基线的完整 root 分类/digest 与已接受记录的语义哈希**；不含 prose、alias、source location；`finalized/vN.json` 不复制完整 schema，完整 after schema 由记录自身保留（`deepseek-harness/docs/persistence-changes/README.md:40-40@687f282e`）。
3. **已接受的机器记录与 after schema 不可变**；后续兼容的 V4 变更可以继续，但不得重写已接受的机器声明，也不得复用已接受的 3→4 过渡（`deepseek-harness/docs/session-format-status.md:35-37@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:61-61@687f282e`）。
4. **新版本用新的版本命名检查点**，不替换旧检查点；同时推进配对的 `latestFinalizedVersion`；helper 要求当前 schema 与完整已确认 history 匹配，提交前跑普通验证器（`deepseek-harness/docs/persistence-changes/README.md:42-42@687f282e`）。
5. **finalization 与 publication 分离**：finalized 不表示已发布；release record 独立保留已发布版本与 `evidenceTag`（`deepseek-harness/docs/session-format-status.md:35-39@687f282e`）。
6. **finalization 不冻结 V4 之后的所有新增**：普通注释、alias、源码位置、保留已接受含义的实现修复不改变基线（`deepseek-harness/docs/session-format-status.md:37-37@687f282e`）。
7. **验证器检查保留的检查点哈希**，拒绝缺失/被改动的 accepted record；但它不能证明检查点与其权威记录"从未被一起编辑"（`deepseek-harness/docs/persistence-changes/README.md:76-78@687f282e`）。

### 本域解析到的 v4 检查点事实

- `roots` 共 62 个：3 个非 event root（`SessionHeader`、`JsonlHeaderLine`、`SessionEventEnvelope`）+ 59 个 `event:*`；其中 5 个 `surface: true`：`assistant/message`、`developer/message`、`system/message`、`tool/result`、`user/message`。
- `acceptedRecords` 共 5 条：
  - `2026-09-11-initial` → `1257b73faa71fda3504b42af8ef7fa6a8c608a1aafe4fc77f21b8cd1c30e0ec1`
  - `2026-09-12-auto-review-error-metadata` → `a98f6eb5d28618a355a358bddf7b278a25ab8aa08288c85e32c2031d7994b865`
  - `2026-09-14-image-offload` → `ec2ac7c3e20842e33870307384200b893a3ec0b0028882858abb0ac9dfc002c6`
  - `2026-09-14-workspace-changes-event` → `b5455973864a92f227f4af0c8eae2182dc33a20d22d2121083652aa0e61af83d`
  - `2026-09-16-session-format-v4` → `0d854cc665bea188f82b6b8d2298a7e484fd138dfdf1d1e974b8be2c9f15c6ac`
- 根键按字典序排序；`event` 字段与 key 的 `event:` 后缀一致；digest 均为 64 位小写十六进制。
- 与当前 catalog 的差异（结构化比较）：当前多 3 个根，8 个根 digest 与检查点不同。这证明 finalized 是"接受时基线"，不是"当前值缓存"；后续变更应由新的记录链承接。

### 步骤

1. 确认 history 完整：baseline + 每个受影响 root 的前驱链，无环、无重复后继、无 digest 不匹配。
2. 跑普通验证器（catalog、schema、history）。
3. 用 helper（源项目为 `createPersistenceFinalizationCheckpoint`）生成 `finalized/vN.json`；不要手写 root 映射，除非逐项核对。
4. 新增文件，不覆盖任何已有 `finalized/vM.json`。
5. 更新 `latestFinalizedVersion`（yaml block），保持发布记录不变。
6. 跑验证器；提交。
7. 后续变更：新增 change record（same-version 或 version-bump），刷新当前 catalog；不得编辑被 acceptedRecords 锁定的记录。

### 角色

- 维护者：确认基线、生成检查点；
- helper/验证器：断言 schema 与 history 匹配、accepted record 哈希未变；
- 评审者：对"same-version 是否安全"和"检查点与状态记录是否被协同篡改"做人工判断。

### 完成信号

- `finalized/vN.json` 结构/字段/排序/哈希长度全部通过；
- 所有 accepted record id 在 history 中存在且语义哈希匹配；
- `latestFinalizedVersion == N`；
- 后续记录能指向前驱，当前 roots 与最新记录一致。

### 失败处理

- **修改已接受记录**：停止；改为新增 successor record。删除/改写 accepted record 会使后续验证失败（缺失或哈希不匹配；具体错误由 release 域实现确认）。
- **版本 bump 想复用 3→4**：拒绝；version bump 需要自己的更高 writer 与 header transition。
- **检查点与状态记录不一致**：以完整 history + schema 重新生成；不要手改其中一边。
- **检查点缺失**：finalization record 要求检查点；补生成，不要用"当前 catalog"替代。
- **检查点哈希通过但 reflog 显示被协同编辑**：验证器无法发现；评审必须基于独立证据（提交历史、评审记录）判断。

### 例外

- 普通注释、alias、源码位置、保留语义的实现修复不需要新检查点（`deepseek-harness/docs/session-format-status.md:37-37@687f282e`）。
- 新版本可以新增根/事件；只要兼容性规则满足，仍可留在同一 writer（如当前 V4 的 65 根 vs 检查点 62 根）。
- 旧检查点可以继续存在并被加载；`finalized/v4.json` 保留，不因 writer 前进而删除。

### 证据边界

- 检查点只记录声明 root 分类/digest 与 accepted record 哈希，不包含运行时校验、恢复或 unknown-event 处理逻辑，也不能发现"声明不变但行为变了"。
- 检查点哈希只证明"与记录内容一致"；不能证明 accepted history 从未被重写，也不能证明解释在语义上正确。
- 本域对 `finalized/v4.json` 做的是完整结构解析 + 关键区段阅读，没有执行 `loadPersistenceFinalization`；执行证据属于 release 域。

### 迁移设计

【迁移设计】把"接受"做成独立于发布的不可变账本：
- `finalized/vN.json` 只存 root identity + accepted record 哈希；
- loader 在启动/CI 中验证：文件名版本 = `sessionFormatVersion`、metadata 键集合精确、accepted record 存在且哈希匹配、至少包含 baseline、前驱闭包完整；
- 新版本写新文件，旧文件只读；
- 单独的 release record 记录 `latestReleasedVersion`/`evidenceTag`，禁止用 finalized 代替。

【额外建议】在 CI 里把 `finalized/` 设为 CODEOWNERS 保护路径；对"检查点与状态记录同一提交修改"加人工审批规则，因为自动检查发现不了协同篡改。

### 验证（计划）

- 正向：加载 `finalized/v4.json`，5 条 accepted record 均可解析，roots 62 个，退出 0。
- 拒绝：删除 `2026-09-14-image-offload` 或修改其哈希 → loader 非零（拒绝缺失/哈希不匹配）。
- 拒绝：把 `sessionFormatVersion` 改成 3 或删掉 baseline → 非零（拒绝无效/缺失元数据）。
- 恢复：从 history 重新生成检查点（新文件）或恢复记录；不得手改旧 JSON。

## 5. V0→V1→V2→V3→V4 具名转换与边界 {#persistence-historical-finalized.named-adjacent-migrations}

### 触发

- 需要把旧 Session 读成当前格式；
- 评审某个迁移 codec/spec；
- 判断"类型声明差异"是否等于"迁移步骤"；
- 准备 V4 的写入器变更。

### 前置条件

- 已确定源格式和目标格式；
- 有对应 codec/spec（不是只看 schema 文档）；
- 有 fixture 或真实旧日志样本；
- 明确"物理编码"与"声明类型"的边界。

### 源义务与具名转换

**V0（writer 0）**

- 逻辑/物理 header 的 `version` 都是 `number`；写入器常量决定 V0，数值类型本身不限制为 0。
- 逻辑 header 要求 `isSeeded`；物理 header 用可选 `seedLength`，要求 `delegationDepth` 与 `type: "session"`。
- `assistant/chunk` 是独立事件，`data` 含 `chunk`/`turn`/`step`；`assistant/message` 无内嵌 `stream`；无 `assistant/attempt`。
- 物理 body 使用 packed rows：`text-chunks`/`reasoning-chunks`/`tool-call-chunks`，字段 `seq0`、`time0`、`data.turn`/`step`/`index`/`dt`；文本/推理行带 `texts`，工具调用行带 `id`、可选 `name`、`args`；N 个成员有 N−1 个时间间隔，可为负；成员 k 的 seq 为 `seq0+k`，time 为 `time0` 加前 k 个间隔。
- V0/V1 共享 codec 拥有 packed rows 与范围编码的 `sourceEventSeqs`；物理 body 不是声明类型清单里的额外 root（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:33-43@687f282e`）。

**V1（writer 1，无 tag）**

- 沿用 V0 物理布局；`SessionHeader.version` 解析为字面量 1；物理 `JsonlHeaderLine.version` 仍为 `number`。
- 逻辑 header 要求 `isSeeded`，物理 header 仍用可选 `seedLength`；重建历史 header 时必须保留这一区别。
- `assistant/chunk` 仍是顶层事件；`assistant/message` 无 `stream`；无 V2 的 `assistant/attempt`。
- V1→V2 migration reference 拥有：chunk 消耗、内嵌 stream、序号重映射；这些转换**不能**从类型 digest 推断（`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:33-43@687f282e`）。

**V2（writer 2）**

- `SessionHeader.version` 为字面量 2；逻辑与物理 header 都要求 `isSeeded`，物理 header 无 `seedLength`。
- `assistant/chunk` 不存在；`assistant/message.data` 与仅日志用途的 `assistant/attempt.data` 都要求内嵌 `stream`。
- surface 替换声明保留 `start`/`end`；系统提示词文本仍在 `request/header.data.header.system`；无 V3 的 `system/message`。
- V2 codec 拥有 one-event-per-row framing、范围编码 source refs、从 `session/end-seed` 推导的 inherited cuts。
- V2→V3 spec 拥有 system-message 插入、PTC 事件名称、canonical envelope conversion。
- seeded V2：最后一个携带 `data.inherited: true` 的 `session/end-seed` 事件按序号位置标识 inherited cut（`deepseek-harness/docs/persistence-changes/historical-formats/v2.md:33-43@687f282e`）。

**V3（writer 3，V4 改动前）**

- `SessionHeader.version` 为字面量 3；逻辑与物理 header 都要求 `isSeeded`，物理 header 无 `seedLength`。
- `system/message`、`user/message`、`assistant/message`、`tool/result` 要求 `surfaceOp`；替换端点为 `startSeq`/`endSeq`；Assistant 消息不携带 `sourceEventSeqs`。
- Assistant stream 仍内嵌在 message/attempt；系统提示词文本属于 `system/message`；PTC 分派事件用 `tool/ptc-dispatch-start` 与 `tool/ptc-dispatch`。
- V3 codec 拥有 canonical event framing 与 source-event range encoding；V2→V3 spec 定义历史转换，其 native V3 admission 规则区分扩展处理与历史来源验证（`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:33-43@687f282e`）。

**V3→V4**

- V3 检查点捕获于 PR #4320 的初始树（writer 3，V4 源码改动前）；V4 finalized 检查点的 acceptedRecords 键序最后一条为 `2026-09-16-session-format-v4`。
- 结构化比较 V3 schema 与 V4 检查点：新增 `event:developer/message`、`event:workspace/changes`；13 个 root digest 变化：`SessionHeader`、`event:agent/inbox/spliced`、`event:assistant/attempt`、`event:assistant/message`、`event:compaction/summary`、`event:request/header`、`event:session/title-llm-request`、`event:system/message`、`event:team/message/queued`、`event:tool/ptc-dispatch`、`event:tool/result`、`event:turn/end`、`event:user/message`。
- 这些差异只说明"声明层变了"；具体转换由 `session-format-v3-to-v4` codec 与其规范拥有，不能从 digest 推断。

**共同禁令**

- 不能把类型 schema 当作迁移算法；不能跳过 codec/spec 直接改 JSON；不能让物理 body 编码成为声明 root；不能把 `surfaceOp` 在旧版可选当成"可以省略 codec/validator 要求的字段"（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:5092-5092@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5623-5623@687f282e`）。

### 步骤

1. 识别源格式（§8）与目标 writer。
2. 找到相邻 codec/spec；确认它覆盖源→目标的全部转换（framing、stream、event rename、envelope、sequence、surface endpoints、PTC）。
3. 用源格式 fixture 跑迁移，记录输出；对 seeded Session 特别检查 inherited cut。
4. 校验输出能通过目标格式 validator；不能只比较类型。
5. 对迁移失败采用拒绝：不要 fallback、不要截断日志、不要"修复"成可解析。
6. 在 change record / cookbook 中写清实际执行过的检查。

### 角色

- 迁移 codec 所有者：实现/维护转换；
- 迁移作者：选择正确源格式、运行 fixture；
- 评审者：检查双向可读性、拒绝语义、是否误用 schema 当作算法。

### 完成信号

- 迁移后的日志通过目标格式 validator；
- 源日志未被修改（迁移是派生/预写准备，不是原地修补）；
- 失败样本以明确错误退出，而不是静默产出半截日志。

### 失败处理

- **类型 digest 相同但迁移失败**：说明 digest 不能证明语义/物理布局；回到 codec/spec。
- **V2 seeded cut 错位**：按最后一个 `data.inherited: true` 的 `session/end-seed` 序号定位；不要按时间或数组下标猜测。
- **V3 surface 端点不合法**：检查 `startSeq`/`endSeq` 与 `surfaceOp`；不要退回 V2 的 `start`/`end`。
- **V4 新事件缺失**：确认 migrate 链确实包含 developer/workspace changes；检查 accepted record 链，而不是手改 schema。

### 例外

- 同一格式内可能还有 payload 修订；相邻迁移只保证格式号相邻，不保证覆盖所有同版本变体。
- 外部插件事件、packed body、运行时关系不在类型清单内，需要各自 owner 的 validator。
- 迁移安全性不由历史格式文档建立；失败时必须有独立测试/回放证据。

### 证据边界

- 本域只读到 codec/spec 的"所有权声明"与格式特征，未逐行审阅 `packages/session/session-format-*` 实现；实现证据归 release 域。
- V3→V4 的增删/变更清单是本域对两个 JSON 做结构化比较的结果，不是对 PR diff 的逐行审阅。
- schema 快照不能证明迁移可逆、不能证明旧 reader 的行为。

### 迁移设计

【迁移设计】为每对相邻格式建立 `migrate_N_to_N+1`，输入/输出都是"事件流 + header"，显式列出：
- 物理 framing 变化（packed/one-event-per-row）；
- 载荷位置变化（chunk → embedded stream；system prompt → system/message）；
- 事件重命名（`tool/code-dispatch*` → `tool/ptc-dispatch*`）；
- 信封/端点变化（`start`/`end` → `startSeq`/`endSeq`，`surfaceOp`）；
- 序号/继承切点规则（`session/end-seed` + `data.inherited`）。
每步先断言源格式版本，再转换，再对目标格式做完整校验；任一步失败即拒绝，不写回源日志。

【额外建议】建立"格式特征表"作为迁移 checklist 的单一来源；为每对迁移保留至少一个真实旧日志 fixture 和一个损坏样本（验证拒绝）。

### 验证（计划）

- 正向：V0 fixture 经 V0→V1 codec 后进入 V1 形状；V1 fixture 经 V1→V2 后 chunk 被消费、stream 内嵌；V2 fixture 经 V2→V3 后出现 `system/message`、PTC 名称、canonical envelope；V3 fixture 经 V3→V4 后新增事件可用。
- 拒绝：对 V2 seeded 日志伪造 inherited cut → 迁移/验证失败；对损坏日志 → 明确拒绝，不产生截断输出。
- 恢复：修正输入或使用正确 codec；不得通过改 schema/digest 让坏数据"通过"。

## 6. 历史快照能证明与不能证明的边界 {#persistence-historical-finalized.historical-evidence-limits}

### 触发

- 有人引用历史格式文档支持"迁移安全"；
- 发布说明/兼容性评审要引用旧 schema；
- 需要判断某个字段在旧版本是否 required；
- 需要决定是否为旧格式补测试。

### 前置条件

- 已读过对应 `vN.md` 的 Verification and limitations；
- 已区分"声明类型"、"codec/恢复不变量"、"运行时行为"三层。

### 源义务

1. **历史参考只描述选定的 schema**，不是历史应用回放，也不建立迁移安全（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:46-46@687f282e`）。
2. **同版本内的事件新增/可选载荷变化可以产生其他有效清单**；一份快照不排除其他有效变体（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:46-46@687f282e`）。
3. **更早的 tag 可能有额外类型差异**，当前快照不替代它们（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:28-28@687f282e`）。
4. **V1 不是发布**：选中树是中间树，归档中没有 V1 tag；不得虚构产品发布（`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:28-28@687f282e`）。
5. **V3 不是最终 PR 树、也不是产品发布**：它是 V4 改动前的初始树；发布证据由 release-status 负责（`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:28-28@687f282e`）。
6. **schema 完整性不等于迁移安全**：声明字段/可选性不覆盖 codec/restoration 不变量；外部插件 payload、物理范围编码、运行时关系需要各自 validator（`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5623-5623@687f282e`）。
7. **历史 `surfaceOp` 可选只是声明证据**，不允许省略 codec/迁移 validator 要求的字段（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:5092-5092@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:5094-5094@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v2.md:5349-5349@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5623-5623@687f282e`）。
8. **verification 只用当前 checkout**：不 replay 历史应用、不查 Git/远端；它验证每个格式到 writer 的范围、schema 完整性、双语声明与生成表（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:51-51@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:5098-5098@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5627-5627@687f282e`）。
9. **opaque 值/未知结构不可见**：`unknown` 等不暴露内部结构；类型图不能证明行为（`deepseek-harness/docs/persistence-changes/README.md:80-80@687f282e`）。
10. **finalization 不表示发布**（`deepseek-harness/docs/session-format-status.md:37-37@687f282e`）。

### 可引用的"能证明"

- 在选定检查点，某 root 的声明结构/字段可选性是什么；
- 某事件在该格式是否存在；
- 两个格式的声明结构是否相同（digest 相同）或哪些 root 变了；
- 旧格式的完整类型清单覆盖了哪些 root/type；
- 某份快照来自哪个 tag/PR/中间树。

### 明确"不能证明"

- 旧应用能否正确回放该日志；
- 迁移是否安全、是否可逆；
- 运行时 validator/恢复逻辑是否接受该数据；
- 外部插件事件、packed body 编码、运行时关系；
- unknown/opaque 值内部是否变化；
- 某个同格式变体是否被快照覆盖；
- 产品是否已发布该格式（看 release record）；
- 检查点与状态记录是否被协同篡改。

### 失败处理

如果评审问题的答案需要上述"不能证明"的项，停止引用历史文档，改为：
1. 运行 owning codec/validator；
2. 用真实旧日志做迁移/回放测试；
3. 在 compatibility/verification 段落记录实际命令与输出；
4. 若仍无法证明，明确写"未验证"，不要用文档存在性代替证据。

### 角色

- 评审者：拒绝把文档当运行时证据；
- 发布作者：区分"已接受基线"、"已发布"、"历史声明"；
- 读者：按"能证明"清单提问，按"不能证明"清单补测试。

### 完成信号

- 任何关于旧格式的结论都附有层级标签（声明/实现/运行时）；
- 兼容性声明的 Verification 段有实际执行证据，而不是"文档说……"；
- 发布记录与 finalized 记录没有被混用。

### 例外

- 只做"字段考古"（查声明）时，历史文档就是正确证据；
- 历史文档可以证明"源项目当时这样声明"，但不能证明"现在仍然这样运行"。

### 证据边界

本域对 8 份双语历史格式文档完整阅读了人工正文段（标题、摘要、来源、特征、验证/限制、开发备注）；`<!-- persistence-format-schema:start/end -->` 内的中文类型区是生成载荷，机器声明块已与英文逐字节比对。两者都不是独立手动契约，未逐行翻译审阅不列为 blocker。对每份 415–467 个生成类型定义做了逐行穷举结构消费与 schema 绑定（不是抽样），但未做语义审阅；本文所有"不能证明"的结论来自源文档自身的限制声明，而不是我们额外做的运行时实验。

### 迁移设计

【迁移设计】在每份历史记录中强制两个段落：
- `Verification and limitations`：列出该快照覆盖/不覆盖的维度；
- `Compatibility`（若项目有 change record）：分别写旧 reader 看新数据、新 reader 看旧数据的行为，以及实际执行的检查。

【额外建议】在 CI 中加一个"文档措辞"检查：历史格式页若出现"safe"/"compatible"/"verified"等词，必须同时出现实际命令或明确免责声明。

### 验证（计划）

- 正向：用 `v0.md` 的 Characteristics 回答"V0 是否有 assistant/chunk"→有；用 `v3.md` 回答 V3 surface 端点→`startSeq`/`endSeq`。
- 拒绝：在评审中仅凭 `vN.md` 声称"V2→V3 迁移安全"→评审拒绝，要求 codec/spec 测试证据。
- 恢复：补跑迁移/回放测试并记录输出，或在结论中降级为"未验证"。

## 7. 双语记录与配对哈希：围栏代码块与 BEGIN/END GENERATED 区之外 {#persistence-historical-finalized.bilingual-pairing}

### 触发

- 编辑 `vN.md` 或 `vN.zh.md` 任一边；
- 新增历史格式记录；
- `--write` 刷新生成表；
- 默认验证报告配对记录过期。

### 前置条件

- 有一对 `X.md` / `X.zh.md`；
- 有 `X.i18n.yaml`（或项目等价配对记录）；
- 生成区有明确标记（如 `<!-- persistence-format-schema:start/end -->`）；
- 机器声明在两侧完全一致。

### 源义务

1. **每对文档有配对记录**：`vN.i18n.yaml` 按 heading section 记录英文/中文块的哈希。实际剔除范围是**围栏代码块**与 `<!-- BEGIN GENERATED <slug> -->` / `<!-- END GENERATED <slug> -->` 区；`generatedRegions()` 只识别这一种标记语法；其他标记家族不被识别，其内容（除其中的围栏代码块）仍进入哈希（`deepseek-harness/scripts/translation-pairing.ts:20-25@687f282e`、`:47-83@687f282e`；`deepseek-harness/scripts/translation-pairing-record.ts:148-162@687f282e`）。sidecar 头部把范围概括为“代码块与生成区之外”，该概括只在生成区使用上述语法时成立（`deepseek-harness/docs/persistence-changes/historical-formats/README.i18n.yaml:1-3@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.i18n.yaml:1-3@687f282e`）。
2. **机器声明两侧相同**：`yaml persistence-format` 声明必须在 `vN.md` 与 `vN.zh.md` 完全一致；README 明确 pair 有"identical declaration"（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:42-42@687f282e`）。
3. **围栏代码块与识别到的生成区不参与配对哈希，其他生成标记仍参与；翻译区块仍会不同**：`vN.md` 的完整类型区在 `<details>` + `persistence-format-schema` 标记内，但该标记不是 `generatedRegions()` 识别的 `BEGIN/END GENERATED` 语法，因此它的标题、表格与 SHA 行进入配对哈希，只有围栏代码块被剔除。简单类型（如 `"1"`）两侧没有可翻译内容，`en == zh`（`deepseek-harness/docs/persistence-changes/historical-formats/v0.i18n.yaml:35-37@687f282e`）；事件类型含 `required`/`必需`、`Sources`/`来源` 等标签，两侧哈希不同（`deepseek-harness/docs/persistence-changes/historical-formats/v0.i18n.yaml:182-184@687f282e`）。不要用"哈希相等"判断生成区或声明是否一致；机器声明一致性与 schema 完整性由 `verify-persistence-formats` 检查。
4. **改一边必须同步另一边并重录**：头注释给出命令 `pnpm run verify-translation-pairing --write <file>`（`deepseek-harness/docs/persistence-changes/historical-formats/README.i18n.yaml:4-5@687f282e`）。
5. **`verify-persistence-formats --write` 刷新生成 Markdown 与配对记录**，并保留人工说明、机器声明、schema（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:70-70@687f282e`）。
6. **默认验证拒绝过期配对记录**；`doc-sync` 验证翻译与本地链接（`deepseek-harness/docs/persistence-changes/historical-formats/README.md:70-70@687f282e`）。

### 本域解析到的配对记录事实

| 文件 | 行数 | 条目数 | en≠zh | en==zh（全部为类型 section） |
|---|---|---|---|---|
| `README.i18n.yaml` | 28 | 8 | 8 | 0 |
| `v0.i18n.yaml` | 1285 | 427 | 266 | 161 |
| `v1.i18n.yaml` | 1285 | 427 | 266 | 161 |
| `v2.i18n.yaml` | 1345 | 447 | 279 | 168 |
| `v3.i18n.yaml` | 1441 | 479 | 298 | 181 |

`v0` 的 427 条 = 12 个结构 section + 415 个类型 section；`v2` 的 447 条 = 12 + 435；`v3` 的 479 条 = 12 + 467。161 条 en==zh 全部落在类型 section，但并非所有类型 section 都相等：含翻译表格/来源标签的条目两值不同（例如 `event:agent-preset/selected` 的 `required`/`必需`、`Sources`/`来源`）。相等只说明该 section 没有可翻译差异，不能证明生成区或机器声明一致。

【本域复核】用配对解析器逐条解析四份 sidecar 的全部 427/427/447/479 个键，并从当前双语文本重算：与文件记录 0 差异，键层级为 2 个根键、8 个一级 heading、2 个二级、415-467 个生成类型。`v0`/`v1`/`v2`/`v3` 的 en≠zh 分别为 266/266/279/298，en==zh 分别为 161/161/168/181。

【源实现事实·标记语法边界】"配对哈希剔除生成区"只对 `BEGIN/END GENERATED` 标记成立，对**历史格式页不适用**：`generatedRegions()` 只识别 `<!-- BEGIN GENERATED <slug> -->` / `<!-- END GENERATED <slug> -->` 形式的标记（`deepseek-harness/scripts/translation-pairing.ts:20-25@687f282e`、`deepseek-harness/scripts/translation-pairing.ts:47-83@687f282e`），而历史页用的是 `<!-- persistence-format-schema:start/end -->`。对 `v0.md` 逐行变异实测：改指纹表某行 digest、改类型定义旁的 SHA-256 行、改类型标题、改 anchor id，都会改变对应 section 的 en 哈希；只有围栏代码块（` ```yaml persistence-format `）被剔除。因此对这些页面，生成区**参与**配对记录，sidecar 头部与"只覆盖人工正文"的表述在这四份文件上只是概括而非边界（证据：`verification/evidence/raw/p1-historical-payload-structure.json#/pairingCoverageProbe`）。这不是要求改源文档的理由——源标记形式与检查器行为一致且能通过验证——但迁移时必须知道：想真正排除生成区，标记必须用 `BEGIN/END GENERATED` 形式。

### 步骤

1. 修改英文侧正文（摘要/特征/限制等）。
2. 同步修改中文侧，保持语义一致；机器声明逐字节一致。
3. 运行 `pnpm run verify-translation-pairing --write <md 路径>` 重录哈希。
4. 若改了 schema/生成区来源，运行 `pnpm run verify-persistence-formats --write`。
5. 运行 `pnpm run verify-persistence-formats` 与 `pnpm run doc-sync`。
6. 检查配对记录中新 heading 的 en/zh 哈希；不要以相等判断正确性，含翻译标签的 section 两值不同是正常的，只有没有可翻译差异的简单类型才相等。

### 角色

- 作者：双语内容与机器声明；
- 配对工具：生成/更新哈希；
- 验证器：拒绝过期配对；
- 评审者：判断翻译语义，而非只看哈希。

### 完成信号

- `X.i18n.yaml` 无过期条目；
- 两侧机器声明完全相同；
- 新 heading 有对应条目；
- `verify-persistence-formats` 与 `doc-sync` 退出 0。

### 失败处理

- **只改英文**：默认配对检查失败；补中文并重录，不要手改哈希。
- **手改生成区**：`--write` 会用已验证 schema 覆盖；若 `--write` 拒绝，先修机器数据/schema。
- **新增 heading 未进配对**：重跑 `verify-translation-pairing --write`。
- **en/zh 机器声明不一致**：这是硬错误；以 schema/声明为准统一，不能靠配对哈希掩盖。

### 例外

- 纯生成 section 若没有可翻译表格/标签，两侧哈希可能相等；含 `required`/`必需`、`Sources`/`来源` 等标签的 section 两值不同是正常翻译差异，不能据此判断生成区错误。
- 代码块内容不参与配对哈希，但仍需两侧语义一致。
- 配对哈希只覆盖被剔除的围栏代码块与识别到的生成区之外的内容，不覆盖代码块内的命令/字段名；未被 `generatedRegions()` 识别的生成区仍被覆盖。

### 证据边界

- 哈希相等只证明"两侧块内容相同/同步重录"，不证明翻译质量、术语正确或技术内容正确。
- 配对记录不验证 schema 与声明的一致性；那由 `verify-persistence-formats` 负责。
- 本域对 i18n 文件是全文结构化解析 + 头部/尾部抽样，没有逐条人工阅读 400+ 个哈希。

### 迁移设计

【迁移设计】配对记录生成器按 heading slug 递归记录 `{en, zh}` 哈希；剔除围栏代码块与工具识别的生成标记区间（默认只认 `BEGIN/END GENERATED`；其他标记不会自动豁免）；提供 `--write` 与只读检查两种模式。把"机器声明必须一致"作为独立检查，不要依赖配对哈希。

【额外建议】给配对记录加 `generatorVersion`，避免升级哈希算法后全量误报；对生成区标记做嵌套/闭合检查。

### 验证（计划）

- 正向：同时修改 en/zh 后 `--write`，再检查退出 0，配对条目更新。
- 拒绝：只改 `v0.md` 的 Summary → 配对检查非零（过期条目）。
- 恢复：补 `v0.zh.md` 并重录，再跑 `--write`/验证/`doc-sync`，退出 0。
- 拒绝：手改 `v0.schema.json` 的生成表 → `--write` 从 schema 重建，人工说明不变。

## 8. 来源检查点声明与"不虚构发布" {#persistence-historical-finalized.source-checkpoint-provenance}

### 触发

- 新增历史格式记录；
- 评审来源证据；
- 需要判断某快照能否代表"该版本"；
- 发布说明引用历史检查点。

### 源义务

1. **V0**：来源是已发布 tag `dsh-v0.1.2-rc.1`，writer 0；它是预发布归档中最后一个 V0 tag；tag record 保留发布背景；更早 V0 tag 有额外类型差异，不被本快照替代（`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:28-28@687f282e`）。
2. **V1**：来源是 `dsh-v0.1.3-alpha.1` 祖先中"首次 V2 writer 变更之前"的最后一个 V1 树，关联 PR #3349（分支 `worktree/session-format-03-v0-v1-migration`），源码变更日期 2026-09-02，标题 `fix(session): close live assistant framing races`；这是中间树，不是最终合并 PR 树；归档没有 V1 tag，不得虚构产品发布（`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:28-28@687f282e`）。
3. **V2**：来源是已发布 tag `dsh-v0.1.3-alpha.2`，writer 2；tag record 描述相邻发布变化；完整清单同时包含未变化和变化的 root（`deepseek-harness/docs/persistence-changes/historical-formats/v2.md:28-28@687f282e`）。
4. **V3**：来源是 PR #4320 在 `release/session-log-v4` 上的初始树，空提交日期 2026-09-16，标题 `chore(session): initialize V4 release integration PR`；它包含 writer 3 的 master 树、V4 源码改动之前；catalog freshness 检查通过后，V3 archive 在 writer 推进前捕获清单；它既不是最终 PR 树，也不是新产品发布；发布证据由 release-status reference 负责（`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:28-28@687f282e`）。
5. **来源位置语义**：历史记录的 source locations 指向历史树，不是当前文件；V3 明确"without line numbers"（`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:28-30@687f282e`）。
6. **区分发布与检查点**：alpha/beta/RC 产品发布也建立 released 义务，GitHub prerelease 标记不使持久数据可丢弃；缺失 release record 不是"未发布"的证据（`deepseek-harness/docs/session-format-status.md:24-24@687f282e`）。

### 步骤

1. 确定检查点是 tag、PR 树还是本地捕获树。
2. 写清标识：tag 名、PR 号、分支、提交日期/标题；如果是中间树，明确"不是最终合并树/不是发布"。
3. 写清 writer 常量。
4. 写清与 release archive/tag record 的关系；没有 tag 就直说。
5. 在 Verification/limitations 中写清该检查点的代表性与缺口。
6. 评审时把"来源声明"与"发布声明"分开检查。

### 角色

- 作者：精确记录来源；
- 评审者：拒绝把中间树/初始 PR 树写成发布；
- 发布维护者：在真正发布后更新 release record，而不是改历史来源。

### 完成信号

- 每条记录都有 Source evidence 段；
- 中间树/无 tag 的情况有明确否定句；
- writer 常量与索引一致；
- 发布状态只在 release record 中声明。

### 失败处理

- **虚构 tag/发布**：删除发布声明，改为"中间树/无 tag"，并引用归档证据。
- **来源树无法复现**：明确写"来源为历史树，当前 checkout 无行号/无法直接 diff"；不要用当前文件冒充。
- **writer 与来源不一致**：以检查点实际 `version` 为准，修索引/声明。

### 例外

- 历史来源可以是 PR 初始树；这不降低其"声明快照"价值，但降低其"发布证据"价值。
- 同一 writer 可能有多个树；记录必须指明选中的检查点，不能声称代表整个格式号。

### 证据边界

- 本域无法从当前 checkout 验证 Git 历史事实（无 fetch、无 reflog）；来源声明是源文档的记录，不是本域独立证明。
- V1 的中间树识别、V3 的空提交信息均来自源文档；若迁移项目无法访问历史，需保留原始 tag/commit 元数据作为附件。

### 迁移设计

【迁移设计】给每份历史记录加结构化来源字段：

```yaml
source:
  kind: tag | pullRequest | tree
  tag: <name>            # kind=tag
  pullRequest: <number>  # kind=pullRequest
  branch: <name>
  commit: <sha>
  date: <YYYY-MM-DD>
  title: <commit title>
  isRelease: false
```

生成索引时把 `kind` 显示出来，避免把中间树当发布。

【额外建议】在 release archive 中为每个 tag 保存 manifest（tag、commit、writer 常量、捕获时间），历史格式记录的 source 只引用 manifest 条目，不重复叙述。

### 验证（计划）

- 正向：V0/V2 记录指向 tag；V1 明确"无 tag/中间树"；V3 明确"初始 PR 树，非发布"。
- 拒绝：把 V1 的 Source evidence 改成"发布 tag"→评审拒绝，因为没有 tag record。
- 恢复：改回中间树描述并引用 PR/日期/标题；发布状态留给 release record。

## 9. 端到端维护清单

推进一次格式版本时，按顺序执行：

1. 确认 `SESSION_FORMAT_VERSION` 与当前 catalog/schema 一致。
2. `pnpm run verify-persistence-catalog`。
3. `pnpm run verify-persistence-formats --archive N`（writer 仍为 N）。
4. 补 `vN.md`/`vN.zh.md` 的来源、特征、声明、限制。
5. 生成/刷新 `vN.i18n.yaml`。
6. 推进 writer、更新当前 catalog/schema。
7. `pnpm run verify-persistence-formats --write`。
8. `pnpm run verify-persistence-formats`。
9. `pnpm run doc-sync`。
10. 若格式被接受：生成新的 `finalized/vN.json`，更新 `latestFinalizedVersion`，不覆盖旧检查点。
11. 若已发布：单独更新 release record 与 `evidenceTag`。
12. 代码评审：来源真实性、same-version 解释、验证证据、检查点/发布分离。

## 10. 证据表与已知限制

### 关键原始证据

- 历史格式索引与维护规则：`deepseek-harness/docs/persistence-changes/historical-formats/README.md:23-70@687f282e`
- 中文索引：`deepseek-harness/docs/persistence-changes/historical-formats/README.zh.md:23-70@687f282e`
- V0 来源/特征：`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:26-43@687f282e`
- V1 来源/特征：`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:26-43@687f282e`
- V2 来源/特征：`deepseek-harness/docs/persistence-changes/historical-formats/v2.md:26-43@687f282e`
- V3 来源/特征：`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:26-43@687f282e`
- 各代验证/限制：`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:5090-5101@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:5092-5103@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v2.md:5347-5358@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:5619-5630@687f282e`
- finalized 检查点：`deepseek-harness/docs/persistence-changes/finalized/v4.json:1-379@687f282e`
- finalized 产物契约：`deepseek-harness/docs/persistence-changes/README.md:40-42@687f282e`
- 兼容性/不可变性：`deepseek-harness/docs/persistence-changes/README.md:49-63@687f282e`
- history/digest 限制：`deepseek-harness/docs/persistence-changes/README.md:76-80@687f282e`
- 四个权威与 finalized 记录：`deepseek-harness/docs/session-format-status.md:18-39@687f282e`
- 配对记录示例：`deepseek-harness/docs/persistence-changes/historical-formats/README.i18n.yaml:1-28@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.i18n.yaml:1-20@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.i18n.yaml:1274-1285@687f282e`
- 机器 schema 结构：`deepseek-harness/docs/persistence-changes/historical-formats/v0.schema.json:1-49308@687f282e`（JSON 结构化解析，非逐行阅读）、`deepseek-harness/docs/persistence-changes/historical-formats/v3.schema.json:1-61307@687f282e`
- 生成区穷举解析与拒绝控制：`verification/evidence/raw/p1-historical-payload-complete-structure.json`（八份文档 41352 行内部行逐行消费、3464 个定义绑定 schema.types、纯渲染 8/8 相等、23 个内存变异全部拒绝；探针源码内嵌）
- 被取代的旧证据：`verification/evidence/raw/p1-historical-payload-structure.json`（`payload()` 只取 root/锚点/标题/SHA 行；保留原样作为历史记录，其区域哈希与 sidecar 观察在新证据中复现）

### 已知限制（本域）

1. **生成类型区只做结构检查（但已穷举）**：415/415/435/467 个类型定义（每语言）未逐条语义审阅；但每份文档的生成区内部行已被逐行消费，每个渲染定义都与 `schema.types` 绑定并重导出 body，root 集合、digest（全量重算）、source 路径、配对条目均为机器核对。结构穷举不等于语义正确。
2. **i18n 配对文件只抽样人工阅读**：全文件结构化解析（条目/哈希对），头部与尾部逐行读过；未逐条翻译审阅。
3. **finalized 检查点的执行语义属于 release 域**：本域读产物与契约，未运行 `loadPersistenceFinalization`。
4. **v4 检查点 62 根 vs 当前 catalog 65 根**：差异已记录；后续 V4 增量是否应进入新检查点由项目的 release/finalization 流程决定。
5. **来源的 Git 事实不可在无历史 fetch 的环境中复核**：tag/PR/提交信息来自源文档。
6. **本域未执行任何 build/test/lint/网络操作，也未运行生产检查器**：已有实际运行输出的只有两个只读探针（旧 payload 探针与新穷举探针）及其内存变异控制；`verify-persistence-formats`、`--archive`、`--write`、`verify-translation-pairing`、生成器 main 仍只是"计划"，没有 CLI 级运行输出。
7. **中文手动正文已全读，生成区不是独立契约**：四份 `.zh.md` 的标题/概述/来源/特征/验证限制/开发备注已读；`<!-- persistence-format-schema:start/end -->` 内的中文类型区由 schema 生成，机器声明块与英文逐字节相同（已比对），因此未逐行翻译审阅不构成 blocker。
8. **生成区不是配对哈希的例外区**：历史页用 `persistence-format-schema` 标记，检查器只剔除 `BEGIN/END GENERATED` 区域，所以这四份 sidecar 的哈希实际覆盖了生成区（变异实测见 §7）。这不影响现有验证通过，但否定了"配对只覆盖人工正文"的强表述。
9. **本域未执行生成器**：生产者的行为来自源码阅读（`persistence-format-facts.ts`、`render-persistence-schema.ts`、`persistence-formats.ts`），不是运行观测；`verify-persistence-formats` 也没有在本域运行。
10. **三处投影一致只是当前 checkout 的事实**：声明 roots、指纹表、`vN.schema.json` 在 V0-V3 上 0 差异，但这不证明历史 Git 树、迁移算法或运行时行为。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `persistence-historical-finalized.historical-format-coverage`：`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:10-45@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:10-45@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v1.schema.json:1-49411@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v2.schema.json:1-56466@687f282e`
- `persistence-historical-finalized.format-snapshot-archive`：`deepseek-harness/docs/persistence-changes/historical-formats/v3.zh.md:5619-5630@687f282e`
- `persistence-historical-finalized.schema-fingerprint-equivalence`：`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:115-117@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:121-123@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.md:193-195@687f282e`
- `persistence-historical-finalized.named-adjacent-migrations`：`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:26-45@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v2.md:26-45@687f282e`
- `persistence-historical-finalized.historical-evidence-limits`：`deepseek-harness/docs/persistence-changes/historical-formats/v0.zh.md:5086-5105@687f282e`
- `persistence-historical-finalized.bilingual-pairing`：`deepseek-harness/docs/persistence-changes/historical-formats/v1.i18n.yaml:1-20@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v2.i18n.yaml:1-20@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.i18n.yaml:1-20@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.md:1-4@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v0.zh.md:1-4@687f282e`
- `persistence-historical-finalized.source-checkpoint-provenance`：`deepseek-harness/docs/persistence-changes/historical-formats/v0.zh.md:26-31@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v1.zh.md:26-31@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v2.zh.md:26-31@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v3.zh.md:26-31@687f282e`、`deepseek-harness/docs/persistence-changes/historical-formats/v1.md:10-12@687f282e`
