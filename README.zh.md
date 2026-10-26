# harness-project-governance

**[English](README.md) | [中文](README.zh.md)**

**面向编码 Agent 的可移植项目治理 Skill。** 它把“Agent 说已经做完了”变成可追溯的声明：需求在哪里、哪些检查真的运行过、还有哪些结论未验证。

## 它解决什么问题

新仓库里最容易失控的不是代码，而是“完成”的定义。Agent 可能读不到项目事实，只凭聊天记录猜进度，把类型检查当作行为验证，或者把“应该能过”写成“已通过”。

本 Skill 给 Agent 一套可执行的治理程序：先读取持久化的需求、验收与下一步动作，按任务路由到带来源的参考，再实施、运行真实检查、记录证据并交接。它不承诺自动修好项目，也不把写好的元数据当成已完成。

## 它带来什么

- **陌生仓库的起点。** 目标、验收条件与下一步动作存放在 `.governance/`，不再依赖上一轮对话。
- **可定位的参考。** 每个机制都有 ID、参考章节和固定提交的来源行号，Agent 能说明为什么采用某个程序。
- **可见的缺口。** `init` 与 `status` 在开工前列出缺失的项目事实、负责人、检查项与验收条件。
- **克制的完成声明。** 没运行的检查写“未验证”；完成结论必须附真实命令与退出码。
- **渐进采用。** 核心只有一个 Skill 和零依赖 CLI；审批、Agent Note、文档门禁等模块按前提条件单独启用。

它不是托管式治理平台、安全审计，也不能替代项目自己的测试与评审。

## 快速开始（无需 `npm install`）

要求：Git、Node.js >= 22.19.0，以及用于仓库脚本的 npm。核心 CLI 没有运行时依赖。

```bash
git clone https://github.com/JusticeSc/harness-project-governance.git
cd harness-project-governance
node --version
npm run verify
npm run demo
```

Windows PowerShell 中使用相同命令。`npm run demo` 会在临时目录创建一个一次性示例项目，初始化治理、根据示例填写元数据、运行真实的 Node 应用与测试命令、故意破坏功能以观察拒绝、恢复后再打印状态并演示交接。它是一段本地可重复的走查：通过 demo 证明工作流能跑通，不证明其他仓库或自主 Agent 已经采用。

可直接查看[示例应用与验收测试](examples/task-board/README.md)，以及[本次验证结果和边界](PUBLIC-VERIFICATION.md)。临时演示目录会自动删除，不修改你的项目。

当前检出上，`verify` 输出 `governance: 1195 mechanisms in 55 domains; references and anchors verified`。这个数字描述已提取的机制账，不代表上游每一行源码都被审阅，也不代表机制账完整无缺。

## 把 Skill 安装到目标仓库

```bash
node scripts/install-skill.mjs path/to/your-repo
node path/to/your-repo/.agents/skills/harness-project-governance/bin/governance.mjs verify
```

把 `path/to/your-repo` 换成目标路径；PowerShell 也可以使用正斜杠。安装器只创建新的 `.agents/skills/harness-project-governance` 席位，遇到已有席位会拒绝，不提供强制覆盖。它不修改应用代码、`.governance/` 状态或 GitHub 设置。

在目标仓库根目录启动项目元数据：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs init .
node .agents/skills/harness-project-governance/bin/governance.mjs status .
```

`init` 创建 `.governance/policy.json`、`state.json`、`requirements.md`、`README.md` 和 `decisions/`，不覆盖已有文件。在项目名、工具链、负责人、检查项、当前需求、验收条件和下一步动作填写完整之前，`init` 与 `status` 以退出码 2 结束。这是“元数据尚未填完”的预期信号，不是安装损坏。`status` 只检查元数据是否存在，不执行 `policy.checks`，也不能证明工作完成。若 `.governance/` 尚不存在，`status` 以退出码 1 结束并提示先运行 `init`。

## 给 Agent 的提示词

安装后可以直接把下面的提示词交给编码 Agent：

```text
遵循 .agents/skills/harness-project-governance/SKILL.md。
运行 `node .agents/skills/harness-project-governance/bin/governance.mjs status .`，并读取 .governance/requirements.md 与 state.json。
如果 .governance/ 不存在，只根据仓库中的事实初始化。
修改前，把可观察的验收条件写入 state.acceptance，并按任务路由到相应参考。
然后实施任务，运行 policy.checks 中的真实命令，逐条报告命令与退出码。
没有运行的检查写“未验证”；不要只凭元数据宣称工作已完成。
```

评审或高风险变更可以使用：

```text
用 harness-project-governance 审查这次变更。
引用你依据的机制与参考，运行已配置的检查，并区分已观察结果与未验证声明。
```

## 命令面

| 命令 | 做什么 | 不做什么 |
|---|---|---|
| `verify` | 解析全部机制账，检查 ID 唯一、参考文件存在、锚点存在及来源区间字段。 | 证明上游内容完整为真，或目标项目已经落实治理。 |
| `list` | 按域输出机制数量。 | 判断当前任务应优先使用哪些域。 |
| `cite <id或片段>` | 输出匹配机制的标题、参考路径、所属域和来源数量。 | 输出参考正文或来源摘录。 |
| `init [仓库]` | 创建缺失的 `.governance/` 元数据文件，从不覆盖。 | 替项目填写事实。 |
| `status [仓库]` | 报告缺失的项目、需求、验收、负责人、检查项与下一步动作。 | 运行检查或认证完成。 |

对已安装的 Skill 示例：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

## `verify` 究竟证明什么

`verify` 证明包内自洽：JSON 机制账可解析，机制 ID 唯一，引用的 Markdown 文件存在，机制 ID 与锚点确实出现在该文件中，并且每条机制都有来源的 `path`、`start`、`end` 字段。任一项不满足时退出码为 1，并指出有问题的机制。

它不读取固定提交的上游仓库，不重新核对引用的源码行，不判断参考语义是否正确，不检查可选工具是否配置，也不能证明目标项目遵守了程序。

## 可选模块

- `tools/github-approval/`：可选的加权审批安装器与工作流包，需要 Node.js；生产归属分析另需 Python >= 3.10 和 Pygments。安装器只写入文件，不修改 GitHub 分支保护，也不代替人工批准；见 [references/github-approval.md](references/github-approval.md)。
- `tools/agent-notes/`：Agent Note 的格式、分类、生命周期树与归档校验器；见 [references/agent-notes.md](references/agent-notes.md)。
- `tools/doc-gates/`：Markdown 链接、换行、翻译配对、预算与包 README 门禁，依赖另行固定的解析器。先运行 `npm run install-doc-gates`，再只配置仓库真正需要的门禁；不要照搬本仓库的全部阈值。

可选参考解释来源机制与迁移边界。复用的是要求，不是整套配置。

## 仓库结构

```text
SKILL.md                 Agent 操作程序、硬规则与任务路由
bin/governance.mjs       verify / list / cite / init / status；零依赖
knowledge/*.json         机器可读机制账（55 个域）
references/*.md          分域解释、来源区间与迁移说明
tools/                   可选的 GitHub 审批、Agent Note 与文档门禁模块
scripts/                 install-skill 与仓库 demo/smoke 辅助脚本
package.json             Node >= 22.19.0；MIT；private 包
LICENSE                  本包许可
SOURCE-LICENSE.txt       固定上游来源归属与 MIT 声明
```

## 贡献者验证

```bash
npm run verify
npm run smoke
```

`npm run smoke` 检查全新打包与安装路径，包括拒绝覆盖已有 Skill 席位。可选文档门禁另需：

```bash
npm run install-doc-gates
npm run test-doc-gates
```

只报告实际运行过的命令及其退出码。

## 已知限制与延后工作

- 本版本没有通过原始迁移任务完整的 C1–C6 验收。它交付可用命令、参考与明确边界，不是已经完成的全量审计。
- 1,195 条机制来自一个固定提交；不声称上游全部源码都被语义审阅，也不声称机制账完整穷尽。
- `verify` 是完整性检查，不是真值检查或采用检查。它不执行项目检查，不能证明某个仓库已经受到治理。
- 可选检查与工具需要目标项目显式配置和依赖：`policy.checks` 在你填写前为空；文档门禁需要各自固定的解析器；GitHub 审批模块的归属分析需要 Python 与 Pygments。
- 安装 Skill 不会部署分支保护、必需评审、审批工作流或其他远端强制。可选审批安装器只写入候选文件并报告 `enforcementActive: false`；远端设置必须另行配置并验证。
- 本初始公开版本的 Node 与操作系统证据有限。文档同时给出 Windows 与 POSIX 命令形式，但不声称每个受支持操作系统都经过独立执行验证；请以随版本发布的验证证据为准。
- 机制标题、`SKILL.md` 与参考正文目前以中文为主。CLI 与这份入门文档提供英文版本，但详细操作指南尚未完整英译。
- `package.json` 设置了 `"private": true`，因此没有 npm registry 发布。分发通过本 GitHub 仓库或 `npm pack --ignore-scripts --offline` 生成的离线 tarball 进行。
- Demo 是带真实示例应用和测试命令的受控走查，不是自主 Agent 采用的证据，也不会在其他仓库运行检查。

## 来源、许可与独立性

本项目是独立提取，与 DeepSeek 没有隶属关系，也未获得其背书或赞助。“DeepSeek Harness”仅指上游来源。

知识与参考材料提取自 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。来源衍生材料与被复制的摘录保留上游 MIT 声明，见 [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt)。本包自身代码与文档使用 [LICENSE](LICENSE)。归属声明只记录来源，不表示未审阅的上游内容经过了语义核对，也不表示上游保证已被完整重新实现。

由于包为 private，请使用 GitHub 克隆、安装辅助脚本或离线 tarball，而不要期待从 npm registry 安装。tarball 包含 `package.json` 声明的运行文件；安装到 `.agents/skills/harness-project-governance` 仍是 Agent 发现该 Skill 的受支持路径。
