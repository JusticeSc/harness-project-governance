# 升级指南（upgrade guide）治理参考

本文件覆盖 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（下称“源”）中 `docs/upgrade-guide/**` 的主要治理形态：触发、同改动写入、路径与三件套、frontmatter、标题节序、500 词上限、Change/Migration 内容、双语配对、校验器边界、评审责任、版本目录分类，以及迁移到其他仓库时的设计参数。它是静态提取的迁移参考，不证明目标项目已经配置并执行相关治理。读者触发条件：判断一次破坏是否需要升级指南、写/改指南、处理版本 bump 或回滚、审查指南 PR、移植或重建 `verify-upgrade-guides`、解释“门禁绿灯”到底证明了什么。

约定：

- 本文引用格式为 `deepseek-harness/<path>:<start>-<end>@687f282e`；所有范围都是实际读取的行，单行写作 `:n-n` 或 `:n`。
- 标签含义：`【源义务】` 是源仓库明确要求并需要保留的规则；`【源事实】` 是源码/语料的实现或形态；`【迁移设计】` 是把机制搬到其他项目时的设计选择；`【额外建议】` 是源仓库没有强制、但采用方应补的工程建议；`【证据限制】` 说明本次没有证明什么。
- 本域只拥有升级指南的**形态、生命周期、内容合同与校验边界**。双语配对合同、术语/散文标准属于文档域；release 边界与版本 bump 属于发布域；代理工作流入口属于代理工作流域。跨域依赖见文末。

---

## 0. 先看哪里

| 你的处境 | 读 |
|---|---|
| 不确定某次改动是否要写指南 | §1 触发与免写例外 |
| 破坏已识别，准备写 | §2 生命周期、§3 路径布局、§4 frontmatter、§5 标题、§7 Change、§8 Migration |
| 英文写超了 500 词 | §6 超限外移策略 |
| 已有指南被后续改动触及 / 破坏被回滚 / 版本 bump | §2 |
| 写中文或配对记录 | §9 |
| 评审指南 PR，或想引用“门禁通过” | §10 校验器边界、§11 评审清单 |
| 决定新破坏进哪个版本目录 | §12 版本分类 |
| 在另一个项目落地这套治理 | §13 迁移设计 |
| 需要可执行的验证剧本 | §14 |
| 想直接运行形态门/配对门 | §9.5（配对命令与语料配置）、§10.3（形态门与接线）、§13.2（已实现的语义摘要） |

【迁移设计】本包交付了两个可执行移植：`tools/doc-gates/verify-upgrade-guides.mjs`（路径/frontmatter/标题/词数）与 `tools/doc-gates/verify-translation-pairing.mjs`（三件套、记录、结构、switcher，含 `--write`/`--list`/`--cached`）。二者都需要 `npm install --prefix tools/doc-gates --ignore-scripts` 安装固定的 `js-yaml`/`mdast`/GFM 依赖；未安装时退出 2 并打印安装命令，不会静默通过。命令从目标仓库根运行，默认操作 `docs/upgrade-guide` 与 `.doc-gates/translation-pairing.json`，不会自动挂进任何 CI。

### 0.1 源语料的版本分类（证据，不是模板）

【源事实】固定提交下 `docs/upgrade-guide` 有 6 个版本目录、42 个 item 目录、126 个文件（每个 item 恰好 `guide.md`、`guide.zh.md`、`guide.i18n.yaml`），没有目录索引或附件。根 `package.json` 的 `version` 是 `0.2.1-rc.2`（`deepseek-harness/package.json:3@687f282e`），但树中没有 `v0.2.1-rc.2` 目录；最新目录是 `v0.2.1-alpha.4`。这说明目录只为“发生过外部可观察破坏的 release”建立，不要求每个 release 都有目录。

| 版本目录 | item 数 | 主要破坏面（代表 item） |
|---|---:|---|
| `v0.1.7-rc.2` | 2 | Web 组合/Schedule bundle；设置展示语义 |
| `v0.2.0-rc.2` | 6 | 登录错误码；Python 运行时与测试包；运行时不变式包/子路径导出；子路径插件清单 |
| `v0.2.1-alpha.1` | 22 | CLI 选项；配置键；SDK 导出；子代理 activation/preset；PTC/sandbox；标题 provider；Web listener；工作目录 |
| `v0.2.1-alpha.2` | 10 | 账号 watch/模型目录；凭据优先级；插件安装；Desktop 快捷键；Azure/pi-ai 路由；operator connect |
| `v0.2.1-alpha.3` | 1 | 插件兼容性 `engines.dsh` |
| `v0.2.1-alpha.4` | 1 | 账号通知字段 |
| **合计** | **42** | **126 个文件** |

【源事实】42 个英文 guide 的正文合计 9,612 个空白分隔 token（中文 guide 不计入；全树 84 个 guide 文件中只有英文侧参与词数上限）；最短 130 词（`v0.2.0-rc.2/account-sign-in-errors`），最长 497 词（`v0.2.1-alpha.1/subagent-activations`）。上限是 500，语料最大值的余量只有 3 词，说明这是紧约束而非宽松建议。该统计来自 `wc -w docs/upgrade-guide/v*/*/guide.md`，不是校验器运行结果。

42 个 item 的完整清单见 §16；迁移时不要复制这些版本号或 item 名，只复制它们表达的边界语义。

---

## 1. 触发：只为仓库外可观察的破坏写指南 {#upgrade-guides.required-trigger}

### 1.1 源义务

`dsh-create-upgrade-guide` 的 frontmatter description 把触发写成：当变更破坏一个外部可感知表面（CLI、profiles、`cordis.yml` 或 settings 键、持久用户数据、SDK 或 wire API、已发布包入口），或改动一个未发布升级指南已经覆盖的表面时，写或更新 `docs/upgrade-guide/v<version>/<item>/guide.md`（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:2-3@687f282e`）。根 `AGENTS.md` 把它提升为常驻命令：每个外部可感知的破坏性变更立即记录到升级指南（`deepseek-harness/AGENTS.md:11@687f282e`）。

正文给出的判定句是：“只为一个仓库外的人在升级后能观察到的破坏写指南”（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:10-12@687f282e`）。SKILL.md 列举的五类（主要类别，不是封闭清单）是：

1. `dsh` 命令、flag、profile 名；
2. `cordis.yml`、patch、overlay、settings 键或它们接受的取值；
3. 持久用户数据：Session 日志、SQLite store、用户数据目录；
4. TypeScript 与 Python SDK 导出、JSON-RPC、HTTP、ACP 消息；
5. 已发布包名与 entry point。

（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:14-18@687f282e`）

【源事实】语料还包含不在这五类逐字列举中的条目：Desktop 测试更新策略弹窗的本地开关（`v0.2.1-alpha.1/desktop-test-auth-popup`）、Desktop 字号快捷键保留（`v0.2.1-alpha.2/desktop-font-size-shortcuts`）、Web/Desktop 的 New Session 行为（`v0.2.1-alpha.1/new-session-generations`）。这些是“仓库外用户可观察”判定的示例，不是 SKILL.md 新增的类别，也不能把五类改写成封闭清单。实际操作标准是“仓库外用户升级后能观察到”；该解释来自语料，不是脚本可验证事实。

### 1.2 唯一明示的免写例外

【源义务】预稳定内部 API，如果所有消费者都在同一次改动里更新，不需要指南（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:20@687f282e`）。这不是“内部 API 都不用写”：只要存在仓库外消费者，或消费者不能在同一次改动内全部更新，就仍需要指南。

Session 格式或声明式持久类型的变化有两条并行记录：仍要走 `docs/cookbook/reviewing-persistence-type-changes.md` 的类型确认；指南只写读者要做的动作，并链接该记录（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:20@687f282e`，`deepseek-harness/docs/cookbook/reviewing-persistence-type-changes.md:1-22@687f282e`）。不要把 schema 说明抄进指南。

### 1.3 操作步骤与角色

| 步骤 | 负责人 | 完成信号 |
|---|---|---|
| 列出改动触及的全部对外表面 | 改动作者 | 一张“表面 → 仓库外是否可观察 → 是否有指南/免写理由”的表 |
| 对每项判断是否存在仓库外消费者且不能在本次改动内更新 | 作者 + 评审 | 免写结论写进 PR 说明，而不是默不作声 |
| 若涉及 Session/持久类型，先生成类型确认 | 作者 | 确认记录存在，指南链接它 |
| 为一个破坏面建一个 item | 作者 | §3 的三件套出现 |
| 复核触发判断 | 评审/发布审计 | 没有“外部破坏但无指南”的项 |

【源义务】“立即写”指在识别到破坏的同一次改动中写，不推迟到 release 准备（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:8@687f282e`）。

【迁移设计】表中的“评审/发布审计”角色是本参考为落地补的职责分工；源 SKILL.md 只规定谁写、写什么，没有定义发布负责人或审计流程。可以把这些角色写进目标项目流程，但不要声称源仓库已有该自动/强制机制。

### 1.4 失败处理与证据限制

- 漏写不会被 `verify-upgrade-guides` 发现：目录整体缺失时它返回空；有树但少一个 item 也照样通过（`deepseek-harness/scripts/verify-upgrade-guides.ts:55-57@687f282e`）。
- 评审发现漏写：在引入破坏的同一 PR 内补三件套，重录配对，跑 §9.5（配对）与 §10.3（形态/链接）列出的命令。
- 【证据限制】本域没有“源码变更 → 指南”的自动映射证据，也没有审计全部历史 release；触发完整性只能由评审或额外检查器证明。

### 1.5 迁移设计

【迁移设计】把“外部可观察表面”参数化为目标产品的真实接口清单，并把免写条件写成可审计的字段（消费者位置、是否同改动更新）。如果采用方是纯内部单仓且没有外部消费者，可以把本机制标为不激活；但不要保留一个空的 `docs/upgrade-guide` 树并声称有治理。

【额外建议】增加一个迁移期检查：从 PR 标签/变更文件路径推导可能的外部表面，要求每个标签映射到 guide item 或免写理由。源仓库没有这个检查，因此它属于补偿控制，不是源义务。

---

## 2. 生命周期：同改动写入、原位更新、回滚删除、bump 冻结、单 release 跨度 {#upgrade-guides.same-change-lifecycle}

### 2.1 源义务（原文语义）

`SKILL.md` 的 Maintenance 段是完整规则（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:30-32@687f282e`）：

- 根版本未变时，当前版本目录描述“从 vT 到当前 master”的 delta；
- 后续改动触及该目录中某指南覆盖的表面时，**在同一次改动中更新那份指南**；
- 破坏被回滚时，**删除**那份指南；
- 版本 bump 后，旧版本目录中的指南**冻结**；新的破坏进入新版本目录；
- **绝不**写跨越一个 release 以上的指南。

写作时 `<version>` 取根 `package.json` 的 `version`，指南描述从该 release 到下一个 release 的升级（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:26@687f282e`）。中文 counterpart 也在同一次改动中维护（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:46@687f282e`）。

### 2.2 状态机

```
识别外部破坏
   │ 根版本 = X，目录 vX 不存在
   ▼
新建 vX/<item>/{guide.md,guide.zh.md,guide.i18n.yaml}   ← 同改动
   │ 根版本仍 = X，另一改动触及同一表面
   ▼
原位更新 vX/<item>（不新建目录）                        ← 同改动
   │ 破坏被回滚
   ▼
删除三件套
   │ 根版本 bump 到 Y
   ▼
vX/** 冻结；Y 的新破坏写入 vY/<item>；不再修改 vX
```

### 2.3 角色、完成信号与失败处理

【迁移设计】下列职责分工是把源规则落到流程时补的角色；SKILL.md 没有定义“评审”或“发布负责人”的正式职责。

- 作者：判断目录、写入/更新/删除；完成信号是“目录版本等于写入时根版本，且只描述一个 release”。
- 评审：核对是否原位更新、是否误改冻结目录、回滚是否删除、是否存在重复 item。
- 发布负责人（迁移设计角色）：bump 后确认旧目录不再变化；新破坏没有落进旧目录。

常见失败：

| 失败 | 处理 |
|---|---|
| 同一表面在未发布期间新建第二个 item | 合并回第一个 item，删除重复目录 |
| bump 后继续改旧目录 | 还原旧目录；在新的当前版本目录重建条目 |
| 破坏回滚但指南保留 | 删除三件套并重录配对；不要留“已回滚”注记 |
| 一份指南描述两个 release | 拆成两个版本目录，各自单跨度 |
| 更新了英文但没更新中文/记录 | 按 §9 同改动更新并 `--write` |

### 2.4 校验边界

【源事实】`verify-upgrade-guides` 不读取 `package.json`，不比较目录版本，不检测冻结/跨度/原位更新/删除（`deepseek-harness/scripts/verify-upgrade-guides.ts:55-75@687f282e`）。它只对已存在文件做形态检查。生命周期是人工流程：同改动、原位更新、回滚删除和冻结都不能从静态目录结果推断，只能由评审/发布流程记录。

【证据限制】固定提交是只读快照：能看到 `v0.2.1-alpha.4` 与根版本 `0.2.1-rc.2` 的差异，但看不到“某次更新是否发生在同改动”“某份指南是否被原位更新过”的过程证据；Git 历史未审计。

### 2.5 迁移参数化

【迁移设计】目录键可以换成日期、release train、包版本；但必须保留四个语义：同改动写入、未发布期间原位更新、回滚删除、发布后冻结且单跨度。若目标项目没有“未发布/已发布”边界，应显式定义一个（例如“合并到 main 即冻结”），否则本机制退化。

---

## 3. 路径、版本目录与三件套布局 {#upgrade-guides.item-layout}

### 3.1 源义务

唯一路径是 `docs/upgrade-guide/v<version>/<item>/guide.md`（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:24@687f282e`）：

- `<version>`：写指南时根 `package.json` 的 `version`，例如 `v0.1.7-rc.2`；描述该 release 到下一个 release（`:26`）。
- `<item>`：变更面的 kebab-case 名，例如 `profile-flag-rename`（`:27`）。
- 每个 item 目录恰好 `guide.md`、`guide.zh.md`、`guide.i18n.yaml`；**没有 index、没有附件**（`:28`）。

### 3.2 校验器的精确规则

【源事实】`GUIDE_ROOT = 'docs/upgrade-guide'`；布局正则接受：

```text
^v<SEMVER>/[a-z0-9]+(?:-[a-z0-9]+)*/(guide\.md|guide\.zh\.md|guide\.i18n\.yaml)$
```

其中 `SEMVER` 是：

```text
(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?
```

（`deepseek-harness/scripts/verify-upgrade-guides.ts:21-22@687f282e`）

含义：

- 必须有 `v` 前缀；核心三段数字不允许前导零；预发布后缀可含字母/数字/连字符，可多段；**不接受 build metadata（`+...`）**。
- item 名只能是小写字母数字与连字符；`Item_Name`、`item_name`、空段都不合法。
- 目录树被 `readdirSync(..., { recursive: true })` 递归枚举，路径统一成 `/` 后排序；任何非匹配文件都报同一条消息（`deepseek-harness/scripts/verify-upgrade-guides.ts:59-68@687f282e`）。
- 只对 `guide.md` / `guide.zh.md` 跑内容检查；`guide.i18n.yaml` 只参与文件名匹配（`deepseek-harness/scripts/verify-upgrade-guides.ts:70-72@687f282e`）。

拒绝示例（测试逐条断言，`deepseek-harness/scripts/verify-upgrade-guides.spec.ts:64-80@687f282e`）：

- `docs/upgrade-guide/README.md`
- `docs/upgrade-guide/0.1.7/item/guide.md`（缺 `v`）
- `docs/upgrade-guide/v0.1/item/guide.md`（semver 不完整）
- `docs/upgrade-guide/v0.1.7/Item_Name/guide.md`（非 kebab）
- `docs/upgrade-guide/v0.1.7/item/notes.md`（第四种文件）
- `docs/upgrade-guide/v0.1.7/item/extra/guide.md`（额外层级）

【已交付】移植回归还增加 `docs/upgrade-guide/v0.1.7+build/item/guide.md`（build metadata）作为第七类布局拒绝；源测试没有这个 fixture，但源正则同样拒绝。

### 3.3 正例与缺失边界

【源事实】测试确认：空树返回空；预发布版本目录、CRLF 文件、内容不被该门解析的 `guide.i18n.yaml` 都通过（`deepseek-harness/scripts/verify-upgrade-guides.spec.ts:54-62@687f282e`）。正例中的 CRLF item 只放了 `guide.md`，因此**一个 item 缺 `guide.zh.md` 或 `guide.i18n.yaml` 也会通过布局门**：它只验证已存在文件的文件名，不要求三件套齐全，也不校验配对。空树通过意味着**删除整棵目录树不会触发这个门**；迁移时必须补“必需文件/变更映射”检查或评审清单，并把配对缺失交给独立配对门。

### 3.4 迁移设计

【迁移设计】若使用其他目录键，保留“固定文件名集 + 无索引/无附件 + 递归拒绝未知文件”。如果目标项目把指南放在站点内容目录，仍需一个独立的物理布局门，否则作者会把图片、索引和草稿放进同目录。

【已交付】`node <skill>/tools/doc-gates/verify-upgrade-guides.mjs --guide-root <dir>` 就是该门；`--guide-root` 只改根路径，路径正则（semver/kebab/三件套文件名）不变。移植版退出码为 0（通过/空树）、1（违规）、2（参数、根或解析依赖不可用）；源 CLI 只显式使用 0/1，2 是移植版增加的调用失败通道，不要反推源也有 2。空树仍通过并打印提示。

【额外建议】在 CI 外再加一个“目录文件清单”断言（例如期望 3×N 个文件），因为布局门只检查已存在文件的名字，不检查某个 item 是否少了中文或记录。

---

## 4. frontmatter：恰好两个键，kind 固定，description 非空 {#upgrade-guides.frontmatter}

### 4.1 源义务

【源义务】frontmatter 恰好 `kind: upgrade-guide` 与一句 `description`，description 说明“什么破坏、什么替换”；增加一个键必须同时增加对应门禁并回填所有指南（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:38@687f282e`）。模板给出骨架（`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:5-12@687f282e`）：

```yaml
---
kind: upgrade-guide
description: "The externally perceptible surface that breaks and what replaces it."
---
```

### 4.2 校验器实际行为

【源事实】`verify-upgrade-guides`：

1. 用 `/^---\r?\n([\s\S]*?)\r?\n---\r?\n/u` 提取首个 frontmatter；不匹配直接报 `must start with YAML frontmatter`（`deepseek-harness/scripts/verify-upgrade-guides.ts:30-31@687f282e`）。
2. 用 js-yaml `JSON_SCHEMA` 解析；对象必须是普通对象，数组/null 报 `frontmatter must be a YAML object`（`:32-33`）。**YAML 语法错误没有被捕获**：异常会从 `guideViolations` 抛出，命令不会把它转成一条违规，也不是移植版的退出码 2 调用错误路径。
3. 键名排序后必须恰好等于 `description,kind`；多/少/缺都报 `frontmatter keys must be exactly description, kind; got ...`（`:35-36`）。
4. `kind !== 'upgrade-guide'` 报错（`:37`）。
5. `description` 不是字符串或 trim 后为空报错（`:38`）。
6. `guide.zh.md` 走同一函数：中文也必须恰好两个键、`kind: upgrade-guide`、非空 description（`:70-71`；键集/kind/description 的拒绝测试见 `deepseek-harness/scripts/verify-upgrade-guides.spec.ts:82-95@687f282e`；中文节名与 wrong-kind 测试是另一条，见 `:112-120@687f282e`，它不证明键集规则）。

### 4.3 写作规则与失败处理

- description 用一句具体的话，点名破坏面和替换物；不要写 “Various fixes” 或只写内部模块名。
- 键顺序不影响结果（脚本先排序），但为可读性保持 `kind` 在前、`description` 在后。
- 失败处理：恢复恰好两个键；不要通过增加 `version`、`owner` 等键“解释”问题。真要新增字段，先实现门禁并回填全部指南，再在模板中记录。

### 4.4 迁移设计

【迁移设计】保留“一个机器 kind + 一句人类断言语义”的最小元数据。若有外部消费者需要 owner/date，把它们放进独立索引或文件名，不要污染 guide frontmatter；否则每个新字段都会成为未检查的漂移点。

【已交付】frontmatter 检查在 `tools/doc-gates/verify-upgrade-guides.mjs` 的 `guideViolations` 中，中英共用；新增字段必须同时改 `FRONTMATTER_KEYS` 与所有既有指南。

【证据限制】脚本只证明键集/kind/非空，不证明 description 是“一句”或语义准确；中文 description 与英文的语义一致也靠评审。

---

## 5. 标题结构：一个 H1 加 Change/Migration（中文 变更/迁移） {#upgrade-guides.heading-structure}

### 5.1 源义务

【源义务】`guide.md`：一个 `#` 标题，然后恰好 `## Change`、`## Migration`，按序；`guide.zh.md`：一个 `#` 标题，然后恰好 `## 变更`、`## 迁移`，按序（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:39@687f282e`）。模板还给出紧跟在 H1 后的语言切换行 `English | [中文](guide.zh.md)`（`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:17-19@687f282e`）。

### 5.2 校验器的精确算法

【源事实】`guideViolations` 从 frontmatter 之后取 body，用 mdast 解析，只收集 `heading.depth <= 2` 的节点，按文档顺序切片；要求：

- 长度 = 期望节数 + 1；
- 第一项以 `# ` 开头；
- 其余项用换行连接后与 `## Change\n## Migration`（或中文）**字符串完全相等**。

（`deepseek-harness/scripts/verify-upgrade-guides.ts:40-46@687f282e`）

这不是独立的“H1 计数”断言，而是对整段 depth<=2 outline 的形状比较：首项只检查 `# ` 前缀（H1 文本不校验），两个 H2 的文本与顺序必须逐字相等。“恰好一个 H1”是长度约束的后果。

因此：

- 第二个 `#`、任何额外 `##`（References、Notes、Background）、改名、单复数变化、顺序颠倒都会失败。
- `###` 及更深标题不参与该检查，可以在节内使用；但它们不能替代 Change/Migration。语料 42 个 item 全部没有 H3，默认应保持扁平；模板也只给了 H1/H2。
- 语言切换行是段落，不是标题，不会触发额外 H2；但它是配对合同要求的 switcher，见 §9。
- 中文文件用自己的期望节名，不会接受英文 `## Change`（测试 `deepseek-harness/scripts/verify-upgrade-guides.spec.ts:112-120@687f282e`）。

拒绝消息形如：

```text
headings must be one "#" title followed by "## Change", "## Migration"; got "# ...", "## Change", "## Migration", "## References"
```

（`deepseek-harness/scripts/verify-upgrade-guides.spec.ts:109@687f282e`）

### 5.3 写作与恢复

- 标题写具体破坏，例如 ``# `--profile` replaces `--preset` ``，不要写 “Upgrade notes”。
- 把背景、理由、参考链接并入 Change 或 Migration 的段落/步骤，不新增 H2。需要长理由时链接 Agent Note 或 owner 文档。
- 失败处理：按报告中的 `got` 重排标题；中文改用 `## 变更`、`## 迁移`；因结构变化重录配对记录（§9）。

### 5.4 迁移设计

【迁移设计】把“影响 → 行动”两节视为合同；若目标产品确实需要“回滚”节，把它作为 Migration 的一个步骤，而不是第三个 H2。若必须增加固定节，先扩展校验器和所有既有指南，否则会立刻产生全树红灯。

【已交付】标题门在 `tools/doc-gates/verify-upgrade-guides.mjs`：`depth <= 2` 的 mdast heading 切片与精确字符串比较；`--sections guide.md=<H2>,<H2>` / `--sections guide.zh.md=<H2>,<H2>` 可替换这两个固定文件期望的节名，但不能新增 `guide.ja.md` 之类的 locale 文件名——`--sections guide.de.md=...` 会以 2 退出，布局正则也只接受 `guide.md`/`guide.zh.md`/`guide.i18n.yaml`。若目标真的要第三语言文件，必须改代码、正则与回归，不是加一个参数。

【证据限制】脚本不检查标题是否具体、H3 的内容/顺序，也不检查语言切换行的存在（那是配对门的事）。

---

## 6. 英文 500 词上限与超限外移 {#upgrade-guides.word-ceiling}

### 6.1 源义务

【源义务】`guide.md` 最多 500 词，frontmatter 也包括在内（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:40@687f282e`）。超过 500 词时，额外文本必须外移：用源码文件/符号链接替代代码复述；把理由移入 Agent Note；把重复机械步骤做成脚本或 `dsh` 命令，由指南调用（`:46`）。

中文 `guide.zh.md` 没有词数上限（`deepseek-harness/scripts/verify-upgrade-guides.ts:16-20@687f282e`）。但“中文不计数”不等于可以把英文删掉的语义倾倒到中文；配对仍要求两侧说同一件事。

### 6.2 校验算法

【源事实】脚本对整份 source 计算：

```ts
source.split(/\s+/u).filter(Boolean).length
```

并对 `guide.md` 使用 `maxWords: 500`；对 `guide.zh.md` 使用 `maxWords: undefined`（`deepseek-harness/scripts/verify-upgrade-guides.ts:16-28@687f282e`）。因此：

- frontmatter、代码块、链接文本都计入；
- 计数与 `wc -w` 等价；
- 只对英文文件执行上限；
- 超限消息形如 `501 words exceeds the 500-word ceiling`（测试 `deepseek-harness/scripts/verify-upgrade-guides.spec.ts:122-129@687f282e`）。

### 6.3 语料证据与超限处理

【源事实】42 个英文 guide 共 9,612 词；最短 130，最长 497（`subagent-activations`），全部在 500 以内，但最大值只剩 3 词余量。这说明：

- 500 是可用上限，不是宽松目标；
- 复杂迁移（如委派 activation）仍能在上限内表达，因为代码细节被链接/片段化；
- 想要“把设计理由也写进去”几乎必然超限。

超限处理顺序（与源技能的“外移”一致）：

1. 删除内部实现叙述和替代方案；
2. 把源码复述替换为文件/符号链接；
3. 把理由移到 Agent Note 或决策记录；
4. 把重复机械步骤抽成脚本/CLI，并让指南只写调用与确认；
5. 不要把“提高阈值”当作默认补救。源技能要求超出时外移；源仓库把 500 硬编码在 verifier 中（`deepseek-harness/scripts/verify-upgrade-guides.ts:18@687f282e`），指南也不在 `doc-budgets.manifest.json` 的预算体系内（`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`）。本域**没有发现**针对该上限的书面提额程序，但“未发现”不等于源仓库禁止提额，也不能证明存在某个程序；不要写成“源仓库没有提额路径”。

【迁移设计】迁移版的 `--max-words` 是显式参数，不是“可以悄悄放宽”的开关。若提高一个已生效项目的上限，要有 owner 论证并记录在变更说明中（可借用源仓库 `doc-budgets` 的 “Raise … justify the manifest diff in the PR” 纪律，`deepseek-harness/docs/AGENTS.md:53-59@687f282e`，但该纪律属于常规文档预算，不是升级指南的现成程序）。500 是源项目参数，不是普适常数。

### 6.4 迁移设计

【迁移设计】对主要读者语言设上限，并明确另一语言是否计数。若两种语言都是正式读者语言，建议两侧同限；源仓库只限制英文，中文靠评审防止成为“超长侧”。

【已交付】词数门在 `tools/doc-gates/verify-upgrade-guides.mjs`：同一 `split(/\s+/u).filter(Boolean).length`，默认 `guide.md=500`、`guide.zh.md=undefined`；可用 `--max-words guide.md=<n>` 调阈值，也可给第二语言声明上限。

【证据限制】词数不等于可读性；脚本无法发现“为了压词数删掉失败模式/例外/权限”的退化。评审必须检查精简后是否仍保留受影响者、症状、精确标识符与确认方法。

---

## 7. Change：旧/新行为、受影响者、可观察症状 {#upgrade-guides.change-section}

### 7.1 源义务

【源义务】`Change` 陈述该表面的旧行为和新行为，以及谁受影响/谁观察得到（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:42@687f282e`）。模板的占位句是 “State the old and new behavior of the surface and who observes it.”（`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:21-23@687f282e`）。

### 7.2 可操作的四元结构

【迁移设计】源义务只有三项：旧行为、新行为、谁受影响。下面的“症状”是语料正例归纳出的可操作补充，不是 SKILL.md 逐字列出的独立义务。

把 Change 写成四件事：

1. **旧行为**（源义务）：在哪个版本/条件下是什么；
2. **新行为**（源义务）：从下一版本起变成什么；
3. **受影响者**（源义务）：谁会在升级后观察到（客户端调用方、profile 作者、插件作者、Desktop/Web 用户……）；
4. **症状**（示例推断）：错误码、警告字符串、缺失的工具/页面、加载/编译失败、默认值变化。

语料正例：

- `account-sign-in-errors`：`SignInErrorCode` 新增 `no-response`；此前 fetch 在返回 Response 前失败报 `network`，HTTP 错误仍报 `network`，授权到期仍报 `expired`；受影响的是账号 API/`@deepseek-ai/dsh-deepseek-account` 客户端（`deepseek-harness/docs/upgrade-guide/v0.2.0-rc.2/account-sign-in-errors/guide.md:1-18@687f282e`）。
- `schedule-optional-bundle`：v0.1.7-rc.2 的 Web 组合带三行且默认关闭；下一版本移除三行并改由可选 bundle 插入；症状是 loader 警告 `patch: entry schedule not found`、工具/页面消失、提醒停止投递，但磁盘记录保留（`deepseek-harness/docs/upgrade-guide/v0.1.7-rc.2/schedule-optional-bundle/guide.md:1-22@687f282e`）。
- `deepseek-account-model-catalog`：路由改用账号的 `GET /models`，列表加载前使用内置目录，单模型只能经 `modelOverrides` 调整；遗留 `models` 字段会让插件加载时报 `llm-deepseek-account: models is no longer configurable` 并停止，Desktop/Web 不显示账号模型；要求更新版本的模型被隐藏，请求它以 `CLIENT_UPGRADE_REQUIRED` 失败（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/deepseek-account-model-catalog/guide.md:1-27@687f282e`）。
- `web-listener-trust-config`：注入 `webRuntime` 的 profile 会等待一个永不挂载的服务，读取 `ctx.webRuntime.trustedHosts` 的表达式求值失败，必需 Connection 无法启动（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/web-listener-trust-config/guide.md:1-36@687f282e`）。

### 7.3 不该出现的内容

【迁移设计/示例推断】以下是评审与写作建议，不是 SKILL.md 的逐字禁令；源技能只在超过 500 词时明确要求把理由外移。

- 设计理由、替代方案、评审讨论 → Agent Note 或链接；
- 完整源码/类型定义 → 链接或最小片段；
- “提升了健壮性”“优化了体验”等不可观察描述；
- 把内部模块名当作受影响者；受影响者应是仓库外的角色或调用面。

### 7.4 评审与证据限制

【源事实】没有脚本检查 Change 的语义；`verify-upgrade-guides` 只确认节存在且标题正确。评审必须独立判断四元结构是否齐全、症状是否真实。语料中的行为声明来自文档作者，本域没有执行登录、升级或插件安装来验证它们。

【迁移设计】把四元结构做成 Change 的评审模板；目标产品的症状应替换为实际错误码、日志行或 UI 元素，不要照抄源产品。

---

## 8. Migration：有序步骤、精确标识符、可执行确认 {#upgrade-guides.migration-steps}

### 8.1 源义务

【源义务】`Migration` 列出有序步骤，点名精确文件、键、命令或符号；当片段比散文更短时给 before/after；并说明如何确认迁移成功（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:44@687f282e`；模板 `deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:25-28@687f282e`）。

### 8.2 语料中的步骤模式

【源事实】高质量指南普遍采用“编号步骤 + 精确标识符 + 最后一步确认”：

- `web-listener-trust-config`：4/5 步给出 `inject: [webRuntime]` → `inject: [webStartup]` 的 before/after YAML；把 patch 整体替换 `config` 的陷阱写出来；最后用 `dsh --profile web --patch ./extra.yml --no-open` 与 `--dump-config` 确认（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/web-listener-trust-config/guide.md:1-36@687f282e`）。
- `subagent-activations`：5 步，含 `startActivation({ provider, label, request, signal, delivery: 'caller' })` 的 TypeScript 片段、`result` 生命周期、`dispose()` 取消语义、外部 provider 的 id 唯一性；最后确认 activation 结果变体/完成通知/caller delivery（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/subagent-activations/guide.md:1-59@687f282e`）。
- `stored-credentials-precedence`：4 步，先比较 `$DSH_HOME/.credentials.yaml` 的 `refs` 与导出变量，再决定保留/删除，最后确认请求使用预期账户且不打印凭据值（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/stored-credentials-precedence/guide.md:1-25@687f282e`）。
- `primary-runtime-python-aliases`：3 步，要求 `readlink` 只返回同目录解释器文件名，再移动 payload、改 `DSH_PRIMARY_RUNTIME`、验证 `load_workspace_dependencies`（`deepseek-harness/docs/upgrade-guide/v0.2.0-rc.2/primary-runtime-python-aliases/guide.md:1-18@687f282e`）。
- `from-default-profile-replaces-target`：把不可逆替换写成“先复制 patch、再执行、再装插件/恢复 patch”，并给出 `--help` + `package.json` 无依赖的确认（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/from-default-profile-replaces-target/guide.md:1-20@687f282e`）。

### 8.3 规则清单

【源义务】1、3、4 直接来自 SKILL.md/模板；“编号列表”“链接 owner 文档”“不要求编辑历史 Session”“备份/恢复”“失败分支”是模板示例、源语料正例或从根 AGENTS.md 的 released Session data 规则推导的落地要求。

1. 每一步只做一个决定/一个编辑；按读者执行顺序排列。模板骨架用编号列表展示，但源义务只要求“有序”，没有独立要求必须是编号列表。
2. 写清路径、键、命令、符号；不要用“相关配置”“相应文件”。
3. 能用一个更短的 before/after 说清时用片段；不要把整份源码贴进来。这是条件性要求，不是每步都必须有片段。
4. 必须有一个“如何确认”步骤：命令输出、重启后日志、编译结果或行为观察。
5. 需要 owner 细节时链接对应 README/子系统页；不要复述。
6. 不得要求读者移动、覆盖或删除已提交的 Session 代际；源根 `AGENTS.md` 的 released Session data 规则禁止这类操作（`deepseek-harness/AGENTS.md:7-9@687f282e`）。自动迁移场景可写“无需手动编辑”。
7. 对破坏性/不可逆操作写备份与恢复路径；`from-default-profile-replaces-target` 的正例就是先复制 `cordis.patch.yml` 再执行替换（`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/from-default-profile-replaces-target/guide.md:1-20@687f282e`）。
8. 对失败分支给出识别与处理（例如 `sandbox-unavailable` 与文件操作被拒绝分开处理）；这是语料正例，不是源技能逐字要求。

### 8.4 评审与证据限制

【源事实】没有脚本检查步骤内容；链接由 `verify-md-links` 检查（`deepseek-harness/scripts/verify-md-links.ts:1-35@687f282e`），其余靠评审。评审应在 fixture/临时 checkout 中实际执行关键步骤；不能执行时，作者必须提供替代证据并标注限制。

【迁移设计】把“确认”视为步骤的一部分而不是可选建议；把重复步骤抽成脚本可同时降低词数（§6）。【额外建议】为每条指南保留一个可复现的迁移 fixture（最小 profile/配置），评审时执行而不是只读。

---

## 9. 双语配对：三件套、记录、同改动维护 {#upgrade-guides.bilingual-pair}

### 9.1 源义务

【源义务】双语文档的配对合同：

- 一对是三个同目录文件：`foo.md`、`foo.zh.md`、`foo.i18n.yaml`；没有 locale 目录、没有独立翻译仓库、没有交错双语；PR 不允许只落一种语言（`deepseek-harness/docs/i18n/README.md:9-11@687f282e`）。
- 记录按“仍含语言特定内容的 heading section”保存 en/zh 哈希；键是英文 heading-slug 路径（`/` 表示首个标题前文本，重复路径用 `~2`、`~3`）；section `i` 对应 section `i`；每个 section 的哈希覆盖除 fenced code block 与 generated region 外的所有顶层块，这两类必须两侧逐字一致，但内容相同仍会被哈希；没有剩余块的 section 没有条目（`deepseek-harness/docs/i18n/README.md:11-22@687f282e`）。
- 中文文件在 H1 后紧跟 `[English](foo.md) | 中文`；English authored 文件对应 `English | [中文](foo.zh.md)`（`deepseek-harness/docs/i18n/README.md:24-26@687f282e`）。
- 结构镜像：heading 深度与顺序、列表种类/起始/条目数、表格行列数、语义链接目标（含 query/fragment）、verbatim 代码块一一对应（`:25-26`）。
- 任意一侧改动后，同一次 PR 更新另一侧，并用 `pnpm run verify-translation-pairing --write <pair>` 重录；`--write` 只对完整 pair 生效且必须点名已确认的 pair，`--write --all` 是显式的 corpus-wide 形式（`:22`、`:42`；`deepseek-harness/scripts/verify-translation-pairing.ts:145-171@687f282e`）。
- 不同步的 pair 通过对照已编辑侧的 diff 对 counterpart 做最小补丁来更新，绝不整篇重译；配对门会点名每个变化的 section（`deepseek-harness/docs/i18n/README.md:22@687f282e`）。
- 用户显式调用扩展工作流时，`pnpm run gen-translation-brief <pair>` 从“内容能产生已记录条目”的最新提交恢复最后确认文本，按最窄安全粒度组装更新；`--apply` 只能在结构校验后拼接仅代码围栏变化的补丁（`:22`）。这是源仓扩展能力，本包未移植；目标项目不要假设该命令存在。
- 记录按 section 分行，使 Git 默认文本合并可以组合不同 section 的改动；只有同一 section 两侧都改了被哈希内容时才冲突；解决 Markdown 冲突后重录该 pair（`:22`）。
- `docs/**` 在配对范围内，升级指南没有排除项（`deepseek-harness/docs/i18n/README.md:48@687f282e`；`deepseek-harness/docs/i18n/README.md:65@687f282e`）。
- 升级指南的校验器明确不拥有中文配对：`verify-upgrade-guides` 的模块注释写明 “verify-translation-pairing owns the Chinese sibling's pairing record”（`deepseek-harness/scripts/verify-upgrade-guides.ts:1-5@687f282e`），实现中也不解析 `guide.i18n.yaml`（`:70-72`）。

### 9.2 配对记录的形态

【源事实】42 份 `guide.i18n.yaml` 都是 16 行，结构一致：

```yaml
# Bilingual-pair consistency record for guide.md (docs/i18n/README.md): per heading
# section, a hash of its English and Chinese blocks outside code blocks and generated regions.
# After editing either side, bring the other along and re-record with:
#   pnpm run verify-translation-pairing --write docs/upgrade-guide/v<version>/<item>/guide.md
/:
  en: <hash>
  zh: <hash>
/<title-slug>:
  en: <hash>
  zh: <hash>
/<title-slug>/change:
  en: <hash>
  zh: <hash>
/<title-slug>/migration:
  en: <hash>
  zh: <hash>
```

四个 section 键对应 `/`（frontmatter/标题前）、标题、Change、Migration；语料本身没有 H3，但记录格式对 H3 的行为未在本次读取中验证，不要据此推断。源记录由命令生成并由配对门机器解析；本域读取了 16 行内容，但没有重算哈希。

### 9.3 校验、最小修补与失败处理

【源事实】`verify-translation-pairing`：

- 枚举 `**/*.md`、`**/*.i18n.yaml` 等模式，再按语料谓词过滤（`deepseek-harness/scripts/verify-translation-pairing.ts:76-83@687f282e`、`:119-122`）。
- Check 1（`:188-196@687f282e`）要求每个非排除 source 存在 `.zh.md`；Check 2（`:198-203`）以 `.zh.md` 与 `.i18n.yaml` 的并集为锚点，捕获半删除的 pair；后续检查哈希与规范形式（`:252-257`）。
- `--write` 对完整 pair 计算并写入记录；点名的 pair 缺 counterpart 时以 2 退出（源实现如此），`--all` 则跳过无 counterpart 的 source（`:145-171`）。
- `--list` 是 corpus-only 状态报告，不接受 pair paths 或其他 flag，且永不失败；`--cached <pairs...>` 读 Git index 字节做只读检查，必须点名已暂存的 pair，不能与 `--write` 组合（`deepseek-harness/scripts/translation-pairing.ts:259-279@687f282e`，CLI 头注释另见 `scripts/verify-translation-pairing.ts:5-9`）。
- scoped 的 `--cached`/显式 pair 路径是有意只查指定范围；corpus 级检查是另一次调用。`--write --all` 会重录每个完整 pair，包括未逐一人工确认的内容，因此“写成功”不是语义确认；重录后仍需评审（E02）。
- 记录必须 canonical，且与当前内容重算结果一致，否则报 `not in canonical form (re-record with --write)`（`:255-257`）。
- 中文文件缺 backlink、英文 authored 文件缺中文链接、结构签名不符都会失败（`deepseek-harness/docs/i18n/README.md:32-34@687f282e`）。
- 失败输出会点名每个变化的 section；修复用“对 counterpart 的最小补丁”，不是整篇重译（`:22`）。
- 同一 section 两侧都改哈希内容时记录冲突；解决 Markdown 冲突后重录该 pair。不同 section 的改动按记录行组合，不要手工拼接哈希（`:22`）。
- scoped 检查只覆盖命名的 pair；corpus 级（无参数）才是 `doc-sync`/CI 运行的形式，scoped green 不能替代 PR 级 corpus 检查（`deepseek-harness/docs/i18n/README.md:40@687f282e`）。

处理顺序：

1. 判断是缺文件、结构漂移，还是仅内容过期；
2. 缺文件补齐 counterpart 与记录；结构漂移按镜像修正；仅内容过期则对照已编辑侧 diff 做最小补丁，不整篇重译；
3. 源仓在用户显式要求扩展工作流时可运行 `pnpm run gen-translation-brief <pair>`；`--apply` 仅用于结构校验后的仅代码围栏变更。该命令未随本包移植，目标项目改用最小手工补丁，不要假设它存在；
4. 修正 switcher；中文用 `[English](guide.md) | 中文`，英文用 `English | [中文](guide.zh.md)`；
5. 运行 `pnpm run verify-translation-pairing --write <guide.md>`（点名该 pair；corpus 用 `--write --all`）；
6. 运行 scoped 检查与 corpus 级检查；
7. 评审语义、术语与自然度。

### 9.4 门的限制

【源事实】配对门的明示限制：绿色只表示“在这些确切内容上记录被确认一致”，不表示两侧说同一件事，也不表示措辞准确、术语正确、自然（`deepseek-harness/docs/i18n/README.md:44@687f282e`）。重录一份劣质翻译仍能通过门，但不能通过评审。

【迁移设计】若只维护一种语言，把本机制标记为不激活并移除配对记录要求；不要保留空 `.i18n.yaml` 或伪造哈希。若维护双语，保留三件套与同改动规则，并把“确认一致”做成可评审的 yaml diff。

### 9.5 随包命令与目标语料配置（可执行，不是规格）

本包交付了源 `scripts/verify-translation-pairing.ts` 及其依赖模块（`translation-pairing`、`translation-pairing-record`、`translation-pairing-git`、`translation-links`、`markdown`）的原生 Node ESM 移植：`tools/doc-gates/verify-translation-pairing.mjs`。保留的源语义：三文件 pair 完整性、以 `.zh.md`/`.i18n.yaml` 并集为锚点的半删除检测、canonical 记录与 `out of sync` diff、两侧 switcher 方向、链接 locale、generated region 归一化后等价、结构签名（heading 深度/顺序、列表、表格、代码块）、scoped `--write` 与显式 `--all`、`--list`、`--cached`（读 Git index 字节）。flag 约束与源一致：`--list` 只做 corpus 状态报告且不失败；`--cached` 必须点名已暂存的 pair 且不能与 `--write` 组合；点名 `--write` 缺 counterpart 时退出 2，`--write --all` 跳过无 counterpart 的 source。**未移植**：`gen-translation-brief`；目标项目没有等价命令，最小补丁需手工完成。命令本身不会挂进任何 CI；本包 CI 的 documentation-tools job 只跑 `test-doc-gates` 回归，没有在真实消费者语料上运行配对门。

语料参数化：源仓把 `docs/**`、README 与根文档集合硬编码为产品事实；移植版要求目标项目自己声明语料，缺省路径 `.doc-gates/translation-pairing.json`：

```json
{
  "roots": ["docs"],
  "files": [],
  "excluded": ["docs/generated/"],
  "generatedSources": [],
  "publicRepositoryBlobRoot": "https://github.com/<owner>/<repo>/blob/<branch>/"
}
```

`roots` 是目录（不存在或不是目录即退出 2，不是通过）；`files` 是单个文件；`excluded` 以结尾 `/` 表示整棵子树；未知字段被拒绝（避免拼错的 `exclude` 静默失效）；`roots` 与 `files` 同时为空即退出 2。

命令（从目标仓库根执行；`<skill>` 为安装位置，通常 `.agents/skills/harness-project-governance`）：

```bash
npm install --prefix <skill>/tools/doc-gates --ignore-scripts   # 固定 js-yaml / mdast / GFM 解析依赖
node <skill>/tools/doc-gates/verify-translation-pairing.mjs                       # corpus 级检查
node <skill>/tools/doc-gates/verify-translation-pairing.mjs --list                # 每 pair 状态；corpus-only，永不失败
node <skill>/tools/doc-gates/verify-translation-pairing.mjs docs/upgrade-guide/v1.0.0/flag-swap/guide.md
node <skill>/tools/doc-gates/verify-translation-pairing.mjs --write docs/upgrade-guide/v1.0.0/flag-swap/guide.md
node <skill>/tools/doc-gates/verify-translation-pairing.mjs --write --all
node <skill>/tools/doc-gates/verify-translation-pairing.mjs --cached docs/upgrade-guide/v1.0.0/flag-swap/guide.md   # 读 Git index；需已暂存 pair，不能配 --write
```

退出码：0 一致（或已写入记录）、1 违规、2 调用/配置/依赖不可用。`--repo <dir>` 可指向另一仓库根（默认当前工作目录）。命令本身不挂载到任何 CI：目标必须把它接进 corpus 级 CI 步骤，并用 `--cached <pair>` 做 pre-commit，才可声称阻断。

---

## 10. `verify-upgrade-guides` 到底检查什么 {#upgrade-guides.verifier-scope}

### 10.1 自动检查与边界（可证明）

| 检查 | 行为 | 依据 |
|---|---|---|
| 树不存在 | 返回 `[]`，命令通过 | `deepseek-harness/scripts/verify-upgrade-guides.ts:55-57@687f282e` |
| 路径/文件名 | 只允许 `v<semver>/<kebab>/guide.{md,zh.md,i18n.yaml}`；递归扫描；多余文件报错 | `:21-22`、`:59-68` |
| frontmatter | 从首行开始、YAML 对象、键集恰为 `description,kind`、`kind: upgrade-guide`、description 为非空字符串；YAML 语法错误会抛出而不是产生诊断 | `:30-38` |
| 标题 | depth<=2 outline 的形状：首项以 `# ` 开头、其后两个精确 H2 且顺序一致；不单独统计 H1 数量，不校验 H1 文本 | `:40-46` |
| 词数 | 英文 `guide.md` ≤500 个空白 token（含 frontmatter）；中文不计数 | `:16-28` |
| 缺文件 | 不检查：一个 item 缺 `guide.zh.md` 或 `guide.i18n.yaml` 仍通过；只校验已存在文件名 | `:59-72` |
| CRLF | 接受 | 测试 `deepseek-harness/scripts/verify-upgrade-guides.spec.ts:54-62@687f282e` |
| 预发布版本 | 接受（`v0.1.7-rc.2`） | 测试 `:54-62` |
| `guide.i18n.yaml` 内容 | 不解析，只匹配文件名 | 测试 `:59`；实现 `:70-72` |

### 10.2 不检查清单（必须由评审/其他门覆盖）

- 是否应该有一份指南（触发判断）；
- 目录版本是否等于写入时根 `package.json` 版本；
- 冻结、原位更新、回滚删除、单 release 跨度；
- 标题是否具体、description 是否一句且点名破坏；
- Change 的旧/新行为、受影响者、症状是否准确；
- Migration 的步骤是否可执行、标识符是否精确、确认是否有效；
- 双语是否语义一致/术语正确（配对门只查哈希与结构）；
- 指南内部相对链接是否可解析（由 `verify-md-links` 单独检查）；
- 是否存在重复 item、缺失条目或覆盖空洞；
- 某个 item 是否缺 `guide.zh.md` 或 `guide.i18n.yaml`（布局门只检查已存在文件）；
- 目录中缺少整个 item（布局门只检查已存在文件）。

【源事实】布局门在缺失整棵树时返回空，因此删除 `docs/upgrade-guide` 不会让它变红（`deepseek-harness/scripts/verify-upgrade-guides.ts:56-57@687f282e`，测试 `deepseek-harness/scripts/verify-upgrade-guides.spec.ts:54-55@687f282e`）。这意味着“绿色”不能证明指南存在。

### 10.3 门禁接线

【源事实】

- `package.json` 暴露 `verify-upgrade-guides`（`:127`）、`verify-translation-pairing`（`:129`）、`test:docs`（`:130`）、`doc-sync`（`:198`）（`deepseek-harness/package.json:127-132@687f282e`、`:198@687f282e`）。
- `run-gates.ts` 把 `upgrade-guides` 注册为 `quick: true` 的叶子门（`deepseek-harness/scripts/run-gates.ts:858@687f282e`）；`docSyncLeafGates` 包含它，`docQuickLeafGates`（`:881-883`）再按 `quick === true` 过滤出测试文档聚合。
- 升级指南不是 `doc-budgets.manifest.json` 的条目；500 词上限由 verifier 自己执行（`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`）。

【迁移设计】本包把该形态门交付为 `tools/doc-gates/verify-upgrade-guides.mjs`，并在 `package.json` 暴露 `verify-upgrade-guides`（`node tools/doc-gates/verify-upgrade-guides.mjs`）与 `test-doc-gates`（回归测试）。它是**目标可激活**的门：命令存在、可失败、可复现，但不会自动出现在目标 CI 里。采用方要自行加入真实 CI/钩子步骤，并保存一次真实失败输出；命令名与包内 `verify-upgrade-guides` 是迁移设计，不是源仓的 `pnpm` 脚本名。

本包 CI 只有 `documentation-tools` job 运行 `test-doc-gates`（对临时 fixture 的回归），没有对真实消费者语料运行形态门或配对门；因此当前包不能声称“目标门已在消费者 CI 激活”。门禁接线也不是 forge 必需检查：仓库里的命令、workflow 或本地通过都不等于分支保护会阻断合并。

【额外建议】本地脚本失败不等于 forge 阻断。要声称“合并会被阻止”，需要记录 CI 必需检查/分支保护的真实配置与一次被阻止的运行；本域没有查询远端配置。

### 10.4 迁移设计：把门禁拆成两层

【迁移设计】

1. **形态自动层**：本包已交付 `tools/doc-gates/verify-upgrade-guides.mjs`（同一 `collectUpgradeGuideViolations` 语义：递归枚举、路径正则、frontmatter、标题、词数），并保留“空树通过 + i18n 不解析”的已知行为（空树时命令会打印提示）。用它，不要重写。
2. **覆盖/语义评审层**：增加 §11 的评审清单；若条件允许，再加一个“变更标签 → guide item 存在”的补偿检查。
3. **独立门**：链接解析、双语配对、Markdown 换行、TS 代码块编译分别由各自的门负责，不要在升级指南门里重复实现；配对门见 §9.5。

【额外建议】为移植后的校验器保留与原实现同构的测试：合法树、源测试的六类布局加 build metadata 第七类、五类 frontmatter、五个 heading 用例加中文节名用例、词数上/下界、空树、CRLF、预发布版本、i18n 内容不被解析。这样“已知盲区”本身也有回归保护。本包的 `research/doc-gates.test.mjs` 就是这组回归测试（需要先安装 `tools/doc-gates` 的固定依赖，未安装时显式 skip 而不是假绿）。

---

## 11. 评审拥有的完整性、版本正确性与可执行性 {#upgrade-guides.review-completeness}

### 11.1 为什么必须有这一层

【源事实】自动门只覆盖 §10.1；触发、版本、生命周期、语义、双语质量、步骤有效性都不在脚本里。把这些当作已由门禁保证，会把风险留到用户升级时。源仓库把散文标准、术语和翻译质量明确交给评审（`deepseek-harness/docs/i18n/README.md:44@687f282e`；`deepseek-harness/docs/AGENTS.md:45-47@687f282e`）。

### 11.2 评审清单

【迁移设计】下面是目标项目的评审清单，不是源仓库已存在或自动执行的检查表；其中“发布前审计”和“发布负责人”是落地角色。

对包含外部可观察破坏的 PR：

- [ ] **触发**：列出本次改动触及的外部可观察面；每一项有 guide item 或免写理由。
- [ ] **版本**：目录名等于写入时根 `package.json` 版本；只描述一个 release；bump 后没有改旧目录。
- [ ] **生命周期**：未发布期间原位更新；回滚已删除；没有重复/互相矛盾的 item。
- [ ] **frontmatter**：恰好 `kind`/`description`；description 是一句且点名破坏与替换。
- [ ] **标题**：具体；恰好一个 H1 + 两节；中文节名正确。
- [ ] **Change**：旧行为/新行为/受影响者/可观察症状齐全；没有把理由或实现细节混进来。
- [ ] **Migration**：步骤有序；文件/键/命令/符号精确；有确认步骤；不可逆操作有备份/恢复；不要求读者编辑已提交的 Session 代际。
- [ ] **双语**：三件套齐全；switcher 正确；结构镜像；`--write` 已运行；中文语义/术语经人工复核。
- [ ] **命令**：记录 `pnpm run verify-upgrade-guides`、`pnpm run verify-translation-pairing <guide.md>`、`pnpm run verify-md-links` 的输出；发布前跑 `doc-sync`。
- [ ] **证据表述**：在结论中区分“自动验证”和“人工判断”；不把绿灯写成“完整/正确”。

### 11.3 角色与失败处理

【迁移设计】源仓库在本域只规定写作与触发规则，没有给出下列角色的正式授权流程；“发布负责人”是落地角色，不应当作源仓库自动义务。

- 作者：在评审前完成自检与命令运行；对无法执行的平台步骤提供替代证据与限制。
- 评审者：有权拒绝缺少指南、错误版本、跨 release、回滚残留、不可执行步骤；必要时在 fixture 中执行 Migration。
- 发布负责人（迁移设计角色）：发版前审计指南覆盖；把缺口记录为发布风险并修复。

失败处理：

| 发现 | 处理 |
|---|---|
| 外部破坏缺指南 | 同 PR 补三件套；若已合并，按 §2 进入当前版本目录 |
| 版本目录错误 | 移到正确目录；旧目录还原 |
| 指南覆盖两个 release | 拆分 |
| 回滚残留 | 删除；重录配对 |
| 步骤不可执行 | 修步骤/补 fixture；不能执行则标注限制，不能声称已验证 |
| 中文语义漂移 | 重译并 `--write`；配对绿灯不豁免语义评审 |

### 11.4 证据限制

【证据限制】本域没有观察真实评审记录、发布审计日志或 forge 分支保护；清单来自源规则与脚本盲区的组合。评审质量无法从静态仓库证明。迁移时必须把“谁有权拒绝”写成组织事实，而不是文档愿望。

---

## 12. 版本分类：按 release 边界分目录（证据与参数化） {#upgrade-guides.version-taxonomy}

### 12.1 源规则

- 目录是 `v<version>`，`<version>` 取写入时根 `package.json` 的 version（`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:26@687f282e`）。
- 一个目录对应一个 release 边界；指南描述该 release 到下一个 release，不跨多个 release（`:32`）。
- bump 后旧目录冻结；新破坏进新目录（`:32`）。
- 预发布版本可以作为目录键；固定提交的 6 个目录全部是 `rc`/`alpha` 预发布（`v0.1.7-rc.2`、`v0.2.0-rc.2`、`v0.2.1-alpha.1`…`alpha.4`）。

【源事实】布局正则允许预发布后缀，不允许 build metadata（`deepseek-harness/scripts/verify-upgrade-guides.ts:21@687f282e`）。它不验证目录是否对应真实 tag，也不要求目录连续。

### 12.2 语料证据的含义

【语料推断】以下是从 6 个目录与 42 个 item 的形态归纳出的操作结论，不是 SKILL.md 的逐字规则；不要把“无破坏的 release 不建目录”“item 不跨版本复制”写成源仓库校验器会强制的模板。

- 只为发生外部破坏的 release 建目录：根版本 `0.2.1-rc.2` 没有目录，最新目录是 `v0.2.1-alpha.4`。
- 同一 release 的多条破坏拆成多个 item：`v0.2.1-alpha.1` 有 22 个，`v0.2.0-rc.2` 有 6 个，`v0.1.7-rc.2` 有 2 个。
- 版本号不是“最终发布才写”的标记：语料中的指南写在 alpha/rc 阶段，说明指南随开发中的破坏产生。
- 【迁移设计】不复制具体版本序列：采用方应使用自己的版本来源（根 `package.json`、release tag、train 编号），但保留“目录 = 写入时 release 边界 + 单跨度 + bump 后冻结”。

### 12.3 失败与迁移

| 失败 | 后果 | 处理 |
|---|---|---|
| 为无破坏的 release 建空目录 | 读者找不到实际内容；噪声 | 删除空目录 |
| 两个 release 混在一个目录 | 无法判断升级区间 | 拆分到各自目录 |
| 目录版本与写入时根版本不符 | 读者按错误版本执行 | 移动；旧目录还原 |
| 复制同一 item 到多个版本 | 重复/漂移 | 只在新破坏真的再次发生时保留新条目 |
| 用日期/编号替代 semver 但不改校验器 | 门禁全红 | 同步替换路径正则与文档 |

【迁移设计】先定义“release 边界的可机械读取来源”，再决定目录键。若使用 monorepo 多包版本，选择一个权威版本或引入显式 release train 字段；不要让作者凭记忆选目录。

【额外建议】在发布清单中记录“目录 → release”的映射；迁移期可用脚本比对根版本与目录，作为源校验器没有的补偿检查。

---

## 13. 迁移到其他项目的落地蓝图

### 13.1 最小可用组件

1. **指南树**：`docs/upgrade-guide/v<version>/<item>/guide.md` + 中文 + 配对记录（若双语）。
2. **模板**：frontmatter + H1 + Change + Migration + switcher。
3. **写入规则**：触发面清单、同改动、原位更新、回滚删除、bump 冻结、单跨度、500 词/目标语言上限。
4. **校验器**：路径/文件名、frontmatter、标题、词数；空树/i18n 不解析的行为要显式记录。
5. **独立门**：链接解析；若双语，配对检查；若含 TS 片段，类型检查。本包的 `verify-md-links` 需要目标项目用 `.doc-gates/markdown-links.json`（`roots`/`files`/`archiveRoots`）声明语料，且同样不会自动挂进 CI。
6. **评审清单**：§11；这是覆盖触发与语义的唯一层。
7. **补偿检查**（建议）：变更标签/文件路径 → 指南存在的映射。

### 13.2 校验器实现规格（按源语义）

【迁移设计】以下规格**已由 `tools/doc-gates/verify-upgrade-guides.mjs` 实现**，此处保留为可审阅的语义摘要，不是待移植的待办。参数化差异：`GUIDE_ROOT` 与仓库根变为 `--guide-root`/`--root`，每语言节名可经 `--sections` 覆盖（只限 `guide.md`/`guide.zh.md` 两个固定文件名），词数上限可经 `--max-words` 覆盖；默认值等于源常量。移植版还增加调用失败退出码 2（参数、根、解析依赖），源 CLI 只显式使用 0/1；这不是源行为。

```text
GUIDE_ROOT = docs/upgrade-guide
FRONTMATTER_KEYS = [description, kind]（排序后比较）
LANGUAGES = {
  guide.md:    { sections: [Change, Migration], maxWords: 500 },
  guide.zh.md: { sections: [变更, 迁移],     maxWords: null }
}
SEMVER = (0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?
PATH = ^v<SEMVER>/[a-z0-9]+(-[a-z0-9]+)*/(guide\.md|guide\.zh\.md|guide\.i18n\.yaml)$

collect(root):
  if root/docs/upgrade-guide absent: return []
  files = recursive files, normalized to '/', sorted
  for file in files:
    if PATH doesn't match: violation "only ... files belong"
    else if basename is guide.md or guide.zh.md:
      parse frontmatter, keys, kind, description
      parse headings depth<=2; compare exact
      count whitespace tokens if maxWords
  return violations
```

关键边界：

- frontmatter 正则允许 CRLF；`---` 必须在文件开头。
- frontmatter 缺失或 YAML 不是对象时函数提前返回，不再检查标题；YAML 语法错误未被捕获，源与移植版都会抛异常而不是产生诊断（移植版不会把它归入退出码 2）。键集/kind/description 的错误不会阻止标题检查，一次运行可能同时列出这些类别。
- 标题比较是字符串完全相等；H3+ 忽略。
- 词数统计整份 source，包含 frontmatter 与代码块。
- `guide.i18n.yaml` 只匹配文件名，不解析内容。

### 13.3 不能照搬的部分

- 版本号、42 个 item 名、具体错误码/包名：这些是源产品事实，不是治理模板。
- 中文/英文节名：如果目标项目主语言不是中文，替换为对应语言，但保留“每语言一套精确节名”的机制。
- 门禁命令名：替换为目标项目脚本名；语义保留。
- 500 词：源参数，可为目标项目调整；保留“含元数据计数 + 超限外移”的语义。提高一个已生效项目的上限要有 owner 论证，不是静默放宽；不要把它写成普适常数。

### 13.4 上线顺序

1. 先写模板与规则文档（触发、生命周期、内容合同）。
2. 加形态校验器；用 §14 的正/反例锁定行为。
3. 加链接门；若双语，加配对门。
4. 加评审清单与证据模板。
5. 若要声称“自动阻断”，配置 CI 必需检查并记录一次真实阻断；本地脚本通过不等于 forge 阻断。
6. 用一次真实破坏走完整流程（写、评审、升级演练、确认），保留输出。

---

## 14. 验证剧本（正例/拒绝/恢复，均为 planned）

以下剧本来自知识库 `verification` 字段；本域没有执行任何命令，证据状态均为 `planned`，独立验证者需在干净 checkout 中运行并记录真实输出。

### 14.1 形态门

- **正例**：合规树（含预发布目录、CRLF、H3）→ `node <skill>/tools/doc-gates/verify-upgrade-guides.mjs` 输出 `verify-upgrade-guides: upgrade guides conform.`，退出 0。空树也退出 0，但输出 absent 提示。
- **拒绝**：放入 `README.md`、`0.1.7/item/guide.md`、`v0.1/item/guide.md`、`v0.1.7/Item_Name/guide.md`、`v0.1.7/item/notes.md`、`v0.1.7/item/extra/guide.md`、`v0.1.7+build/item/guide.md` → 七条布局违规，退出 1；再分别用错误 frontmatter、错误 heading、501 词 fixture 触发对应消息。
- **拒绝（调用）**：`--nonsense`、`--sections guide.de.md=...` 或 `--root` 指向不存在目录 → 退出 2，不当作通过；解析依赖未安装 → 退出 2 并打印安装命令。YAML 语法错误不在这一路径：它会抛出未捕获异常。
- **恢复**：移走/重命名违规文件，修正元数据/标题/词数，重跑直到 0。

### 14.2 空树与完整性盲区

- **拒绝（设计上的）**：删除整棵 `docs/upgrade-guide`，`verify-upgrade-guides` 仍退出 0（移植版会打印 `is absent; nothing to check`）。记录该行为，不要把它当 bug 静默修掉；如果要“缺树即失败”，必须另写检查。
- **恢复**：恢复目录；若采用方需要“必须存在”，增加 `docs/upgrade-guide` 必需文件/目录断言，并把它与布局门分开报告。

### 14.3 双语

- **正例**：先声明 `.doc-gates/translation-pairing.json`，维护完整三件套、switcher 正确，`node <skill>/tools/doc-gates/verify-translation-pairing.mjs --write <guide.md>` 后记录与内容一致 → scoped 与 corpus 级配对检查均通过。
- **拒绝**：删 `guide.zh.md` 或 `guide.i18n.yaml`、只改一侧不重录、中文用英文 H2、代码块/结构不镜像、switcher 缺失 → 配对门失败；缺配置或空语料 → 退出 2。
- **恢复**：补齐/重译、修正结构、`--write <guide.md>`、重跑 scoped 与 corpus；语义由评审复核。

### 14.4 评审剧本

- **正例**：一个含两个外部破坏的 PR，评审列出两个面、映射两个 item、核对版本与单跨度、在 fixture 执行 Migration、记录三个命令输出与人工结论。
- **拒绝**：只改英文不重录、写入冻结目录、Migration 无可执行确认，但形态门通过 → 评审拒绝，并把“形态门未覆盖”写入结论。
- **恢复**：作者补写/更新/删除并重跑；评审复核；发布审计记录缺口与修复。

---

## 15. 证据限制与未决项

1. **只读静态审计**：126 个分配文件全部逐文件读取（42 个英文 guide、42 个中文 guide、42 个配对记录）；42 个中文正文逐行读取并与英文逐项对照，未发现中文独立义务。3 条超过 768 字符的源行（含 `docs/i18n/README.md:22` 与两条英文 guide 第 12 行）以及 2 条按 CJK 显示宽度复检的中文长行（578/401 码点，估算 697/599 列）已用 `path:line:raw` 重读，记录见 coverage 的 `rereadLog`；42 个中文 guide 的宽度扫描未发现超过 768 列的行。但没有运行 `pnpm`、`vitest`、`verify-upgrade-guides`、`verify-translation-pairing`、`verify-md-links`、`doc-sync` 或任何升级操作。
2. **哈希未重算**：42 份 `guide.i18n.yaml` 的 en/zh 哈希只被读取，未与当前内容重算；配对一致性是源码声明，需独立验证者运行。
3. **产品行为未验证**：指南中的命令、错误码、默认值、平台差异是文档作者声明；本域没有执行登录、插件安装、profile 启动或平台测试。
4. **历史完整性未审计**：没有“变更日志/release note → 指南”的映射，也没有逐条审计 Git 历史；不能声称每个历史破坏都有指南。
5. **当前版本目录缺失**：根版本 `0.2.1-rc.2` 没有对应目录；这是合法状态，但“新建当前目录”的行为只能由 SKILL 规则与评审证明。
6. **CI 强制未验证**：`run-gates.ts`/`package.json` 证明门被注册，不证明 forge 分支保护会阻断合并。本包的 `documentation-tools` job 只运行 `test-doc-gates`（临时 fixture 回归），没有对真实消费者语料运行形态门或配对门；因此目标工具尚未在消费者 CI 激活。
7. **数量口径**：任务说明提到“41 items”，但按分区实际是 42 个 item 目录 × 3 = 126 个文件；本域按 126 个分配路径逐条记录。
8. **未发现**：`docs/upgrade-guide` 下没有 README、索引或附件；没有生成式指南（guide.md/guide.zh.md 为手写/评审内容，guide.i18n.yaml 配对记录由命令生成）。
9. **移植代码已交付但未执行**：`tools/doc-gates/verify-upgrade-guides.mjs`、`verify-translation-pairing.mjs` 及其同源模块、`research/doc-gates.test.mjs` 已写入本包，并通过 `node --check` 语法校验；但本次没有安装 `tools/doc-gates` 的依赖、没有运行测试，也没有在任何目标树上运行这两条命令。§14 的剧本仍是 `planned`，需独立执行者安装依赖后运行并记录真实输出。源仓的 `pnpm`/`vitest`/`doc-sync` 同样未运行。
10. **未移植的源能力**：`gen-translation-brief`（配对恢复助手）没有移植；它不参与配对门的判定，但源仓的“从最后确认文本恢复最小补丁”工作流在目标项目中没有等价命令。
11. **目标工具行为未作为源事实**：移植版新增的退出码 2、`--sections` 只支持两个固定文件名、`--max-words` 可覆盖等属于迁移设计；源 CLI 没有这些参数。YAML 语法错误在两边都会抛出异常，不是可列举的违规。

---

## 16. 42 个 item 速查（源语料事实）

| 版本 | item | 一句话表面 |
|---|---|---|
| v0.1.7-rc.2 | schedule-optional-bundle | Web 组合移除三行，改由 Automation tasks bundle 插入 |
| v0.1.7-rc.2 | transcript-view-legacy-normal | 旧值 `normal` 与非 Desktop 未设置值改为 detailed |
| v0.2.0-rc.2 | account-sign-in-errors | `SignInErrorCode` 新增 `no-response` |
| v0.2.0-rc.2 | bundled-python-tests | NumPy/pandas 内置分发包裁掉 tests |
| v0.2.0-rc.2 | primary-runtime-python-aliases | Python 别名必须是同目录解释器链接 |
| v0.2.0-rc.2 | remove-runtime-invariants | 移除 invariants 包与 `./invariant` 导出 |
| v0.2.0-rc.2 | schedule-bundle-retired | 移除 Automation tasks bundle，Web 自挂 Schedule |
| v0.2.0-rc.2 | subpath-plugin-display-manifest | 子路径插件改用 locale/icon，不读 package.json |
| v0.2.1-alpha.1 | deepseek-model-discovery | API-key 路由无凭据时返回空目录 |
| v0.2.1-alpha.1 | desktop-test-auth-popup | 测试鉴权弹窗默认关闭，需本地开启 |
| v0.2.1-alpha.1 | experimental-package-composition | 可选 hooks/webhooks 需显式安装 peer 与 bundle |
| v0.2.1-alpha.1 | instruction-home-override | `agent-instructions` 移除 `dshHome` |
| v0.2.1-alpha.1 | job-id-identity | JobId 改短 UUID 并跨注册表生命周期 |
| v0.2.1-alpha.1 | jsonl-persistence-plugin | JSONL 持久化改命名空间函数插件 |
| v0.2.1-alpha.1 | mock-messages-events | Messages mock 发布具名 SSE 事件 |
| v0.2.1-alpha.1 | native-subagent-bundle-tools | 子代理 bundle 增加全局工具与新 BundleInfo 字段 |
| v0.2.1-alpha.1 | new-session-generations | New Session 创建全新 Agent |
| v0.2.1-alpha.1 | plugin-option-placement | `dsh plugin` 只在前置位置读 `--profile` |
| v0.2.1-alpha.1 | python-optional-resources | Office/创作环境需显式下载 |
| v0.2.1-alpha.1 | python-ptc-sandbox | Python PTC 需要 sandbox/sandboxPolicy |
| v0.2.1-alpha.1 | session-title-adapters | 标题路由需注册 adapter，efforts 升序 |
| v0.2.1-alpha.1 | session-title-provider-strategy | provider 直接注册并共享执行函数；移除三个导出，targetWords 移入 provider Config |
| v0.2.1-alpha.1 | ssh-helper-launch | SSH/PTC 改 launch 模式，要求协议 2 |
| v0.2.1-alpha.1 | subagent-activations | 委派改 managed activation，移除 background 模式 |
| v0.2.1-alpha.1 | subagent-preset-composition | 用 Agent Preset 取代 persona/toolFilter |
| v0.2.1-alpha.1 | team-direct-inbox | Team 消息直达 inbox，移除队列上限 |
| v0.2.1-alpha.1 | terminal-command-labels | TerminalBlockLabels 新增 commandLine |
| v0.2.1-alpha.1 | tool-presentation-mode | mode 仅接受 native/ptc |
| v0.2.1-alpha.1 | web-listener-trust-config | webRuntime → webStartup，拒绝通配 host |
| v0.2.1-alpha.1 | working-directory | 移除 `{{cwd}}`/`config.cwd`，改用 Session working directory |
| v0.2.1-alpha.2 | deepseek-account-identity-watch | `watch(signal, true)` 才订阅身份变化 |
| v0.2.1-alpha.2 | deepseek-account-model-catalog | 账号路由用 `GET /models` + `modelOverrides`；遗留 `models` 报错；`CLIENT_UPGRADE_REQUIRED` |
| v0.2.1-alpha.2 | desktop-font-size-shortcuts | 字号快捷键占用自定义组合键 |
| v0.2.1-alpha.2 | from-default-profile-replaces-target | `--from-default-profile` 替换已有 profile |
| v0.2.1-alpha.2 | operator-connect | 非页面 Connection 默认 `interactions:none` |
| v0.2.1-alpha.2 | pi-ai-azure-provider | Azure provider key 改为 `azure` |
| v0.2.1-alpha.2 | pi-ai-model-discovery | 缺凭据的 pi-ai 路由隐藏模型 |
| v0.2.1-alpha.2 | plugin-install-over-installed | HMR 下已安装包返回 `already-installed` |
| v0.2.1-alpha.2 | sdk-minimal-image-compaction | 默认新增 read_image 与自动压缩 |
| v0.2.1-alpha.2 | stored-credentials-precedence | 存储凭据优先于导出变量；headless 变化 |
| v0.2.1-alpha.3 | plugin-engines-dsh | 兼容性先读 `engines.dsh`，`peers` 改 `requirements` |
| v0.2.1-alpha.4 | account-notification-fields | 通知增加可选元数据/标题，空 expiresAt 永不过期 |

---

## 17. 跨域边界与维护

- **文档域**：拥有 `docs/AGENTS.md`（current-state、one physical line、pairs、wordcount、link 规则）、`docs/i18n/README.md`（三件套合同、记录格式、门禁限制）、`dsh-doc` 的 kind→模板系统、`dsh-prose-standard`。本域引用这些规则，不重复拥有其通用实现。
- **发布域**：拥有 release 边界、版本 bump、tag 与发布证据，以及 `release-upgrade-guides` 机制。release 事务只是本域版本目录的相邻依赖；本域拥有版本目录形态、三件套与生命周期，不把两者当作同一机制，也不改变发布域的分类。
- **代理工作流域**：拥有 `dsh-create-upgrade-guide` 的技能入口与工作流编排（`agent-workflows-upgrade-guide`）。本域不改变该分类。
- **自动化域**：拥有 gate 调度、CI lane 与“失败是否阻断合并”的强制语义。本域只描述脚本注册位置，不声称分支保护。

维护本参考时：任何“源义务”段落变更都要重新核对 `SKILL.md`、模板、verifier 与 `docs/AGENTS.md`；任何“源事实”计数都要重新枚举目录/词数；任何“迁移设计/额外建议”都不应写成源仓库已实现。

---

## 机制→来源引用索引（代表区间）

本节按机制列出代表性来源区间，使用固定提交 `687f282e`。完整 `sources` 数组以 `knowledge/upgrade-guides.json` 为准；本索引不重复全部条目，也不新增正文断言；正文解释仍以对应小节为准。

- `upgrade-guides.required-trigger`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:2-3@687f282e`、`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:8-20@687f282e`、`deepseek-harness/AGENTS.md:11-11@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/instruction-home-override/guide.md:1-20@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.0-rc.2/remove-runtime-invariants/guide.md:1-23@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/desktop-test-auth-popup/guide.md:1-18@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/desktop-font-size-shortcuts/guide.md:1-18@687f282e`
- `upgrade-guides.same-change-lifecycle`：`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.4/account-notification-fields/guide.md:1-18@687f282e`
- `upgrade-guides.item-layout`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:22-28@687f282e`、`deepseek-harness/scripts/verify-upgrade-guides.ts:13-22@687f282e`、`deepseek-harness/scripts/verify-upgrade-guides.spec.ts:54-80@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:3-3@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.1.7-rc.2/schedule-optional-bundle/guide.zh.md:1-22@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.1.7-rc.2/schedule-optional-bundle/guide.i18n.yaml:1-16@687f282e`
- `upgrade-guides.frontmatter`：`deepseek-harness/scripts/verify-upgrade-guides.ts:30-38@687f282e`、`deepseek-harness/scripts/verify-upgrade-guides.spec.ts:82-95@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/working-directory/guide.zh.md:1-25@687f282e`
- `upgrade-guides.heading-structure`：`deepseek-harness/scripts/verify-upgrade-guides.spec.ts:97-120@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:14-29@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/working-directory/guide.md:1-25@687f282e`
- `upgrade-guides.word-ceiling`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:40-46@687f282e`、`deepseek-harness/scripts/verify-upgrade-guides.ts:18-18@687f282e`、`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/native-subagent-bundle-tools/guide.md:1-31@687f282e`、`deepseek-harness/docs/AGENTS.md:49-59@687f282e`
- `upgrade-guides.migration-steps`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:44-44@687f282e`、`deepseek-harness/AGENTS.md:7-9@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/from-default-profile-replaces-target/guide.md:1-20@687f282e`
- `upgrade-guides.bilingual-pair`：`deepseek-harness/docs/i18n/README.md:9-11@687f282e`、`deepseek-harness/docs/i18n/README.md:22-22@687f282e`、`deepseek-harness/docs/i18n/README.md:40-44@687f282e`、`deepseek-harness/scripts/translation-pairing.ts:259-279@687f282e`、`deepseek-harness/scripts/verify-translation-pairing.ts:5-9@687f282e`、`deepseek-harness/scripts/verify-translation-pairing.ts:185-203@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.4/account-notification-fields/guide.zh.md:1-18@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.4/account-notification-fields/guide.i18n.yaml:1-16@687f282e`
- `upgrade-guides.verifier-scope`：`deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e`、`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:48-54@687f282e`、`deepseek-harness/scripts/run-gates.ts:804-883@687f282e`、`deepseek-harness/package.json:127-132@687f282e`、`deepseek-harness/package.json:198-198@687f282e`、`deepseek-harness/scripts/verify-doc-budgets.ts:1-12@687f282e`
- `upgrade-guides.review-completeness`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:42-48@687f282e`、`deepseek-harness/docs/AGENTS.md:45-47@687f282e`、`deepseek-harness/docs/AGENTS.md:75-77@687f282e`
- `upgrade-guides.version-taxonomy`：`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.1/deepseek-model-discovery/guide.md:1-17@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.2/deepseek-account-identity-watch/guide.md:1-18@687f282e`、`deepseek-harness/docs/upgrade-guide/v0.2.1-alpha.3/plugin-engines-dsh/guide.md:1-21@687f282e`
