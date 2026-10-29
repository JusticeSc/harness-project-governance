# CLI 与规则查询参考

需要安装/校验、查询命令保证、读取完整机制或选择专项分区时读本参考。命令面与分页协议说明工具实际做什么以及失败如何退出，末节提供未知机制 ID 时的主题入口；任务执行与采用程序仍按 [SKILL.md](../SKILL.md) 第 3–5 节执行。

## 1. 安装与完整性

<a id="installation"></a>

核心命令是 `bin/governance.mjs`；它通过 `bin/show.mjs` 实现分页读取，两者只使用 Node 内置模块，需要 Node.js ≥ 22.19.0，无第三方运行依赖。`tools/` 下的可选工具不在此列，其依赖、配置和执行前提按各自参考单独准备。

Skill 的安装座是目标仓库的 `.agents/skills/harness-project-governance/`。从本包仓库安装时运行 `node scripts/install-skill.mjs <目标仓库>`；安装器拒绝覆盖已有安装座，不修改目标应用、`.governance/` 状态或远端设置。下载和发布版本信息见 [README.zh.md](../README.zh.md)。

安装后先校验包内完整性：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs verify
```

`verify` 解析 `knowledge/*.json` 机制账，检查机制 ID 唯一、每条机制的 `reference` 是可解析的 `路径#锚点`、参考文件存在且同时包含该机制 ID 和锚点，并要求 `sources` 非空且每项含 `path`、`start`、`end`。锚点可来自 Markdown 标题生成的 slug、标题末尾的 `{#id}`，或行内的 `<a id="...">` 与 `<h1>`–`<h6>` 的 `id`/`name`；围栏代码中的示例和普通链接不算定义。失败时退出 1 并逐项列出问题。

`verify` 只证明当前安装座内的知识与引用自洽：不读取固定提交的上游仓库、不重新核对引用源码行、不判断参考语义是否正确、不执行目标项目的检查，也不证明治理已经落实。

## 2. 命令面

<a id="commands"></a>

以下示例都从目标仓库根目录、按安装座路径运行。退出码是工具实际返回的状态，不是对目标项目质量的判断。

| 命令 | 行为与退出码 | 不证明什么 |
|---|---|---|
| `verify` | 见第 1 节：检查机制账、ID 唯一、参考文件、锚点和 `sources` 字段；失败退出 1。 | 上游内容真实完整、参考语义正确，或目标项目已采用治理。 |
| `list` | 按域输出机制数量，最后输出 `total`。 | 当前任务应选择哪些域。 |
| `cite <id或片段>` | 先精确匹配机制 ID，否则按子串匹配；每条输出标题、`reference`、所属域和来源数量，最多 12 条，更多时提示收窄。 | 输出参考正文、上游摘录或迁移结论。 |
| `show <精确ID> [--part mechanism\|reference] [--cursor token]` | 无损分页返回完整机制对象或登记的参考文件。只接受精确 ID；未知或重复 ID、不可读引用、无效或过期游标退出 1。字段与协议见第 4 节。 | 裁定适用性、返回未分发的上游正文、证明理解或认证采用。 |
| `init [仓库]` | 在目标仓库创建缺失的 `.governance/policy.json`、`state.json`、`requirements.md`、`README.md` 和 `decisions/`，已有文件跳过；随后运行 `status`，元数据未填时退出 2。 | 替项目填写事实、形成采用决定或授权后续改动。 |
| `status [仓库]` | 只检查元数据是否齐备：`policy.project.name`，非空 `toolchains`、`owners`、`checks`，`state.requirement`、`acceptance`、`nextAction`，以及 `requirements.md` 的验收条目。`.governance/` 不存在时退出 1 并提示 `init`；仍有缺口时退出 2；字段齐全时退出 0，并说明这没有运行检查。 | 执行 `policy.checks`、判断 `nextAction` 是否已撤销、证明当前权威或任务完成。 |
| `check [仓库] [--policy 路径]` | 默认读取 `.governance/policy.json`；已有其他状态 owner 时用 `--policy` 指向仓库内的检查清单。按 `checks` 的插入顺序从仓库根目录通过 shell 执行命令，逐项打印观察到的退出码；任一非零退出 1，全部通过退出 0。策略缺失、无法读取或解析、`checks` 不是非空对象，或某项不是非空命令字符串时退出 2。默认和显式策略都先解析仓库根与策略的真实路径；真实位置在仓库外（包括经由 symlink/junction）时退出 2。不创建状态文件。 | 推导检查、证明语义完整、平台强制或采用完成。 |

常用调用（安装座路径）：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs status .
node .agents/skills/harness-project-governance/bin/governance.mjs show documentation-prose-budgets
node .agents/skills/harness-project-governance/bin/governance.mjs show documentation-prose-budgets --cursor <next>
node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
```

`check` 执行的命令继承当前环境和本机权限，风险与直接运行项目脚本相同；清单只登记命令，不增加隔离或权限控制。`verify`、`status`、`check` 分别覆盖包内知识完整性、目标元数据齐备度和已配置命令的执行结果；任一通过都不能替代采用决定、语义评审、权限核对或平台强制。

## 3. 机制记录字段

<a id="mechanism-fields"></a>

`knowledge/<domain>.json` 保存机制记录，`references/<domain>.md` 提供同一域的操作解释。以下是常用字段的用途，不是统一必填 schema；以实际完整对象为准：

| 字段 | 用途 |
|---|---|
| `problem` / `triggers` | 防哪种失败、什么条件下触发 |
| `obligations` / `actors` / `steps` | 要求什么、谁执行、顺序与责任边界 |
| `enforcement` | 失败如何传播、由谁阻断、可信边界与例外 |
| `applicability` | 目标项目何时激活；不激活时保留判据和重新评估触发条件 |
| `migration` | 原样保留、参数化还是替代；为什么没有削弱作用 |
| `verification` | 正向、应拒绝、恢复三种证据要求 |
| `limitations` | 尚未证明或未覆盖的部分 |
| `sources` / `reference` | 固定提交中的路径和行号、可读解释位置 |

`show <精确ID>` 默认读取机制对象，`--part reference` 切换到其登记的参考文件；`show` 分页返回记录的完整 JSON，保留全部字段，包括 `migration` 和账内新增键；不要根据展示顺序或常见字段推断记录只有这些内容。`sources` 与 `sourceCommit` 是出处元数据，不是工具返回的正文；要核对来源原句，仍需按记录中的路径和行号读取可访问的来源。`reference` 指向本包参考，`--part reference` 只返回该文件的分页字节，不替你选择适用小节、条件、依赖或例外；也可以用文件读取工具读取已核对的小节及交叉引用。

## 4. `show` 的分页协议

<a id="paging"></a>

`show` 每次只输出一页 JSON，字段如下：

- `version`：读取器版本。
- `resource`：`id`、`part`、`file`、`domain`、`sourceCommit`、`sha256`、`bytes`；`sha256` 和 `bytes` 覆盖完整资源，不是当前页。
- `range.start` / `range.end`：本页覆盖的 UTF-8 字节区间，含 `start`、不含 `end`。
- `chunks`：本页字节按 UTF-8 边界切成的字符串数组；长值跨 chunk 分片，不省略。
- `next`：下一页游标；末页为 `null`。
- `complete`：本页是否到达资源末尾。
- `limits`：`pageBytes: 4096`、`lineBytes: 512`。

机制资源的载荷是 `JSON.stringify(record)` 的字节，连接各页后应能解析为完整 JSON 对象；参考资源的载荷是其登记文件的原始字节，按 UTF-8 解码后连接，应等于原文件文本。整页（含换行）至多 4096 字节，每行至多 512 字节；超长值分片而不截断。

继续读取时：

1. 第一次不带 `--cursor`；之后每次使用同一 `id`、同一 `part`，并把上一页的 `next` 作为 `--cursor`。
2. 每页核对 `resource` 的身份与摘要字段（`id`、`part`、`file`、`domain`、`sourceCommit`、`sha256`、`bytes`）与首页一致，且 `range.start` 等于上一页的 `range.end`。
3. 连接全部 `chunks`，核对总字节数等于 `resource.bytes`、sha256 等于 `resource.sha256`；机制内容可解析为完整 JSON 对象，参考内容等于原文件文本。
4. 只有显式 `complete: true` 且 `next: null` 才是末页。缺页、重页、乱序、跳页或工具截断都不算读取完成；工具显示省略时必须读取明确遗漏的部分。

未知或重复机制 ID 退出 1。`--part reference` 要求机制的 `reference` 形如 `路径#锚点`，文件真实路径位于包内 `references/`、是有效 UTF-8 且包含该锚点，否则退出 1。游标不是签名或授权凭据：它绑定当前资源指纹和偏移；格式错误、非规范 base64url、版本不符、偏移越界、不在 UTF-8 边界或与当前资源不匹配的游标都退出 1。收到无效或过期游标时，从同一当前来源的第一页重新读取，不混合不同快照或不同 id/part 的页。

`show --part reference` 只做整文件分页，不替代参考内的条件、依赖和例外选择。完整分页与散列只证明返回了哪些字节，不证明理解、适用性或没有遗漏；保留实际读取的机制 ID、字段和参考位置，供决定与评审核对。同一资源可以在已完整读取后按摘要复用，但不能用摘要、`cite` 元数据或部分页代替按任务所需进行的首次完整读取。

## 5. 专项分区的查询入口

<a id="domain-routing"></a>

编号分区不是主题边界，不能用某页的首个主题排除其余内容。以下搜索范围相对本 Skill 的目录；先按任务概念与触发事实跨文件发现候选，再只读相关小节。尚不能确定参考家族时，先在 `references/*.md` 的标题、触发索引和触发条件中检索，而不是猜一个编号。`list` 的域数量和 `cite` 的 ID 搜索不能代替这一步。

### 5.1 包合同

<a id="package-domains"></a>

1. 将 `references/package-contracts-*.md` 的所有编号分区纳入搜索，用当前任务的中英概念、实际接口名或路径检索标题、触发索引和触发条件；不要先按每份文件的首个主题缩小范围。
2. 查看所有相关命中；搜索输出被截断时继续读取结果。无命中时调整同义词或接口标识，必要时扩大到 `references/*.md` 的标题与触发条件；关键词未命中本身不是“不适用”的依据。
3. 按命中的标题或锚点读完整机制小节，包括触发、必须项、角色、完成信号、失败边界与交叉引用；相关内容落在多个分区时分别读取，并继续核对依赖和例外。完整机制记录按 Skill 第 5 节查询，不以搜索摘要代替正文。

完成条件：本次变更涉及的行为都已核对相关命中与依赖；未能确认的适用条件明确保留为未决，不能在只读到首个命中时结束。搜索跨分区进行，正文仍只按命中小节加载。

### 5.2 门禁实现与测试政策

沿用 5.1 的检索与完成程序，在下列家族的全部编号分区内查询；家族可能同时适用，不按某一分区的首个主题选页。

| 参考家族 | 搜索范围（相对 Skill 目录） |
|---|---|
| 门禁实现 | `references/enforcement-scripts-*.md` |
| 测试政策 | `references/policy-tests-*.md` |

### 5.3 决策理由

<a id="rationale-domains"></a>

只在需要设计取舍、适用条件或既有失败教训时查下列家族，并沿用 5.1 的跨分区检索程序；多类相关时一并检索，不以编号区分主题。当前状态与本次验收仍由目标项目拥有，参考中的历史证据不能替代本次运行。

| 参考家族 | 全部编号分区 |
|---|---|
| 架构决策 | [一](rationale-architecture-1.md)、[二](rationale-architecture-2.md)、[三](rationale-architecture-3.md)、[四](rationale-architecture-4.md) |
| 过程决策 | [一](rationale-process-1.md)、[二](rationale-process-2.md) |
| 功能决策 | [一](rationale-feature-1.md)、[二](rationale-feature-2.md)、[三](rationale-feature-3.md)、[四](rationale-feature-4.md) |
| 缺陷修复决策 | [一](rationale-bug-fix-1.md)、[二](rationale-bug-fix-2.md) |
| 简化决策 | [一](rationale-simplification-1.md)、[二](rationale-simplification-2.md) |
| 测试决策 | [测试专题](rationale-testing-1.md) |

