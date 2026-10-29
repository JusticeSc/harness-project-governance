# harness-project-governance

**[English](README.md) | [中文](README.zh.md)**

**面向编码 Agent 的可移植项目治理 Skill。** 它把“Agent 说已经做完了”变成可追溯的声明：需求在哪里、哪些检查真的运行过、还有哪些结论未验证。

## 它解决什么问题

新仓库里最容易失控的不是代码，而是“完成”的定义。Agent 可能读不到项目事实，只凭聊天记录猜进度，把类型检查当作行为验证，或者把“应该能过”写成“已通过”。

这是一个面向编码 Agent 的项目治理 Skill：核实项目事实与工具链，明确需求和验收，按任务选择规则，通过项目真实命令与评审验证变更。它提供操作参考、零依赖 CLI 和可选检查工具；项目检查与 CI 仍需按目标配置。

## 它带来什么

- **陌生仓库的起点。** 目标、验收条件与下一步动作存放在项目已有的状态 owner（或按触发启用的 `.governance/`），不再依赖上一轮对话。
- **可定位的参考。** 每个机制都有 ID、参考章节和固定提交的来源行号，Agent 能说明为什么采用某个程序。
- **可见的缺口。** `init` 与 `status` 在开工前列出缺失的项目事实、负责人、检查项与验收条件。
- **克制的完成声明。** 没运行的检查写“未验证”；完成结论必须附真实命令与退出码。
- **渐进采用。** 核心只有一个 Skill 和零依赖 CLI；审批、Agent Note、文档门禁等模块按前提条件单独启用。

它不是托管式治理平台、安全审计，也不能替代项目自己的测试与评审。

## 开发状态

当前发布版本为 [`1.1.0-rc.1`](https://github.com/JusticeSc/harness-project-governance/releases/tag/v1.1.0-rc.1)，通过 GitHub 分发，不发布到 npm registry。它提供核心 CLI、Skill 安装器，以及可选的审批、Agent Note、文档检查和 OMP 工具；各模块分别需要自己的依赖、配置与权限。

按[接入流程](references/adoption.md#adoption)把相关规则适配到项目已有的 owner、检查和权限，实施前由项目负责人或独立评审接受采用决定。安装不等于治理已落实，本预发布版不保证自主采用。

[公开验证记录](PUBLIC-VERIFICATION.md)保存版本特定的命令、结果与限制。贡献者按 [AGENTS.md](AGENTS.md) 开发；该文件不安装到消费者项目，使用 Skill 不依赖维护者的会话记录。

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

可查看[示例应用与验收测试](examples/task-board/README.md)，以及[验证命令和限制](PUBLIC-VERIFICATION.md)。临时演示目录会自动删除，不修改你的项目。

## 把 Skill 安装到目标仓库

```bash
node scripts/install-skill.mjs path/to/your-repo
node path/to/your-repo/.agents/skills/harness-project-governance/bin/governance.mjs verify
```

把 `path/to/your-repo` 换成目标路径；PowerShell 也可以使用正斜杠。安装器只创建新的 `.agents/skills/harness-project-governance` 席位，遇到已有席位会拒绝，不提供强制覆盖。它不修改应用代码、`.governance/` 状态或 GitHub 设置。

创建元数据前，先检查目标是否已有唯一状态 owner（任务板、Issue/PR 台账、交接文件或 `PROJECT.md`）。已有则把需求、验收、采用决定与下一动作留在该 owner；不要运行 `init`，也不要新建 `.governance/`。

仅当目标没有状态 owner，且以下条件至少满足一项时运行 `init`：用户要求初始化治理；工作需跨会话继续或交接；或需在压缩前保存进度：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs init .
node .agents/skills/harness-project-governance/bin/governance.mjs status .
```

`init` 创建 `.governance/policy.json`、`state.json`、`requirements.md`、`README.md` 和 `decisions/`，不覆盖已有文件。安装成功或改动跨多步本身不构成初始化元数据的理由。在项目名、工具链、负责人、检查项、当前需求、验收条件和下一步动作填写完整之前，`init` 与 `status` 以退出码 2 结束。这是“元数据尚未填完”的预期信号，不是安装损坏。`status` 只检查元数据是否存在，不执行 `policy.checks`，也不能证明工作完成。若 `.governance/` 尚不存在，`status` 以退出码 1 结束并提示先运行 `init`。

## 给 Agent 的提示词

指定安装后的 Skill、实际任务与允许的操作即可，例如：

```text
遵循 .agents/skills/harness-project-governance/SKILL.md。
审查本仓库的本地检查与 CI 是否覆盖现有验收条件。
只报告发现和证据，不修改文件或远端设置。
```

实施或接入任务改用你的实际交付物与授权范围。操作流程由 Skill 承担，不需要在提示词中重抄。

## 命令面

| 命令 | 做什么 | 不做什么 |
|---|---|---|
| `verify` | 解析全部机制账，检查 ID 唯一、参考文件存在、锚点存在及来源区间字段。 | 证明上游内容完整为真，或目标项目已经落实治理。 |
| `list` | 按域输出机制数量。 | 判断当前任务应优先使用哪些域。 |
| `cite <id或片段>` | 输出匹配机制的标题、参考路径、所属域和来源数量。 | 输出参考正文或来源摘录。 |
| `show <精确id> [--part mechanism\|reference] [--cursor token]` | 无损分页返回完整机制对象或其登记的参考文件，附来源、字节区间、内容摘要和继续游标。 | 裁定适用性、提供未分发的上游正文、证明理解或认证采用。 |
| `init [仓库]` | 创建缺失的 `.governance/` 元数据文件，从不覆盖。 | 替项目填写事实。 |
| `status [仓库]` | 报告缺失的项目、需求、验收、负责人、检查项与下一步动作。 | 运行检查或认证完成。 |
| `check [仓库] [--policy 路径]` | 按策略中的 `checks` 顺序执行已配置命令，逐项报告退出码；任一失败退出 1；策略缺失、无效、`checks` 为空，或某项不是非空命令字符串时退出 2。默认策略和显式 `--policy` 都按仓库根与策略文件的真实路径校验归属，不新建状态文件。 | 推导检查、证明语义完整或平台强制；通过 symlink/junction 读取真实位置在仓库外的策略。 |

对已安装的 Skill 示例：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

用 `show documentation-prose-budgets` 读取完整机制，加 `--part reference` 读取其参考文件。按 [CLI 分页协议](references/cli.md#paging)读完全部页面并核对连续区间和完整内容摘要；`cite` 或部分页面不能代替完整记录。传输完整不等于语义接受。

## `verify` 究竟证明什么

`verify` 证明包内自洽：JSON 机制账可解析，机制 ID 唯一，引用的 Markdown 文件存在，机制 ID 与锚点确实出现在该文件中，并且每条机制都有来源的 `path`、`start`、`end` 字段。任一项不满足时退出码为 1，并指出有问题的机制。

它不读取固定提交的上游仓库，不重新核对引用的源码行，不判断参考语义是否正确，不检查可选工具是否配置，也不能证明目标项目遵守了程序。

## 最小采用走查

下面的例子用于**项目负责人或独立评审接受采用决定之后**配置执行。先按[接入流程](references/adoption.md#adoption)识别全部触发要求、适配目标参数与权限，并处置冲突和阻塞前提。文档可从[项目接入小节](references/documentation.md#migration)开始，但它不是全部规则清单。下列命令只是示例，不是默认项目政策或采用完成的证明。

- **已有状态 owner**（任务板、Issue/PR 台账、交接文件或 `PROJECT.md`）：采用决定、需求、验收与下一动作继续写在该 owner；不要运行 `init`，也不要新建 `.governance/`。决定被接受后，只把执行配置放进仓库内的清单，例如 `governance-checks.json`：

  ```json
  {
    "checks": {
      "docs": "node .agents/skills/harness-project-governance/tools/doc-gates/verify-doc-budgets.mjs"
    }
  }
  ```

  每个值必须是非空命令字符串，并指向项目真实可执行的命令（例如 `"tests": "npm test"`）。`check` 不读取其他字段，按文件顺序在仓库根目录通过 shell 执行这些命令。

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
  ```

- **没有既有状态 owner，且用户要求初始化治理、跨会话继续/交接或确需他人接续时**：只运行一次 `init`；仅缺少 owner 本身不触发初始化，单会话内完成的多步改动也不需要它。

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs init .
  # init 首次退出 2：按真实项目填写 policy、requirements 和 state
  node .agents/skills/harness-project-governance/bin/governance.mjs status .
  node .agents/skills/harness-project-governance/bin/governance.mjs check .
  ```

以上预算示例还需要 `.doc-gates/doc-budgets.json`，例如 `{"README.md":60}`；60 是示例，不是默认政策。目标和剩余余量须与硬上限分开评审，未预算文档须有评审 owner、理由与重新激活条件。修改 Markdown 还会触发适用链接/换行检查和语义评审；准备其锁定解析器依赖与完整适用语料，不能把一个零依赖预算命令当作全部覆盖。[文档参考](references/documentation.md#prose-budgets) 给出具体义务与 [Markdown 准备方式](references/documentation.md#markdown-gates)。

两条路径都应使用同一个顶层入口。把**已在本地验证过的同一条命令**作为现有 CI 的一个步骤，保留原有的安装、矩阵和其他检查，并按所用 CI 改写语法：

```yaml
- run: node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
```

既有 owner 路径保留 `--policy`；初始化后使用默认 policy。CI 步骤必须继承非零退出；`continue-on-error: true` 或总是成功的兜底会让拒绝失效。清单条目若再次对同一 policy 调用 `governance check` 会递归，应登记项目自己的真实命令。仓库已有运行这些检查的顶层脚本时，本地命令与 CI 步骤都调用该脚本，并让脚本不出现在它自己的清单里。工作流文件存在不等于远端 required check 已生效。

两条路径都需从同一入口观察正常通过、真实违规被拒绝与字节精确恢复，并在共用入口保留消费者可见的正常和无效输入断言。[收据程序](references/adoption.md#adoption-receipts)说明原始证据和执行层级，[交接与完成条件](references/adoption.md#adoption-continuation)说明跨会话工作及其余验收。`check` 通过只证明登记命令通过，不证明语义完整或平台强制。

Node.js 是 CLI 的宿主，登记命令可以调用目标自己的工具链。其他语言与平台除非实际运行，否则保持未验证。报告中将观察到的命令与退出码、来源依据的推断和未验证项分开。

## 可选模块

- `tools/github-approval/`：可选的加权审批安装器与工作流包，需要 Node.js；生产归属分析另需 Python >= 3.10 和 Pygments。安装器只写入文件，不修改 GitHub 分支保护，也不代替人工批准；见 [references/github-approval.md](references/github-approval.md)。
- `tools/agent-notes/`：Agent Note 的格式、分类、生命周期树与归档校验器；见 [references/agent-notes.md](references/agent-notes.md)。
- `tools/doc-gates/`：Markdown 链接、换行、翻译配对、预算与包 README 门禁，依赖另行固定的解析器。先运行 `npm run install-doc-gates`，再只配置仓库真正需要的门禁；不要照搬本仓库的全部阈值。

### 可选的 OMP 前置检查适配器

`tools/omp-preflight/simplification.mjs` 是可选的 OMP 适配器，与核心 CLI 分开，只使用 Node 内置模块，需要另行安装 OMP。Windows RPC 检查、实际执行的版本及限制见 [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md)；这些检查不认证交互 TUI、其他宿主/模式/版本组合或 Agent 决定的语义正确性。

在消费仓库根目录（或传入 `--cwd`）按会话启动：模块须在 OMP 的精确允许列表中，并指定仓库内已有 Markdown 状态 owner：

```powershell
$module = (Resolve-Path '.agents/skills/harness-project-governance/tools/omp-preflight/simplification.mjs').Path
omp --mode rpc --trusted-extension $module --governance-owner PROJECT.md
```

```bash
omp --mode rpc --trusted-extension "$PWD/.agents/skills/harness-project-governance/tools/omp-preflight/simplification.mjs" --governance-owner PROJECT.md
```

需要 RPC 客户端通过 stdio 驱动提示；仅加 `--mode rpc` 不会自行开始对话。`--trusted-extension` 只接受存在的绝对文件，绕过环境扩展发现，且不能与 `-e`/`--extension`、`--hook` 同时使用。普通 `-e`/`--hook` 加载与非严格扩展错误处理可能 fail-open，不是等价启动方式。适配器不修改设置、profile 或已安装文件，不需要全局配置。它是同进程模块，不是沙箱；其他能力或中间件仍可改写工具输入与结果，不要与改写 read 或工具调用的扩展同时使用。

`--governance-owner` 必须在解析真实路径后指向当前会话 cwd 根内已有 Markdown 文件；仓库相对或绝对拼写只有在规范结果仍位于该根内时才被接受。适配器不会创建 owner，缺失、越界或经 junction 逃逸的路径都会被拒绝。不需要初始化 `.governance/`，也不需要第二个 owner。检查点建立前，根会话只能使用原生 `read`、`grep`、`glob`；`write`、`edit`、`bash`、`eval`、`task` 与未知工具都被阻止，因此委派与可执行工作不能先行。

检查点工具 `governance_preflight` 作为 essential 工具直接暴露，不需要额外的 `--tools` 覆盖；它接收非空的 `constraints` 与 `acceptance` 字符串。只有对已安装 `references/agent-workflows.md` §18（`aw-18` 起、`aw-19` 前）的原生 `read` 返回该节全部非空行、且路径与规范参考一致时才会成功；记录检查点时会再次核对该参考是否变化。即使整节已返回，只要文件后面还有未读内容，OMP 也可能标记 truncation；该标志本身不构成拒绝。缺少或头部截断所需行的读取仍不合格。成功后将映射及正常/拒绝条件追加到 owner，并允许根会话继续调用工具。新的用户输入、排队用户任务实际激活、会话切换、分支或树导航会重置检查点。记录只能证明阅读顺序与内容存在，不证明语义正确；成功后不持续重验参考。

在其处理器已绑定的范围内，适配器拒绝非根会话变更；但 OMP 子会话、恢复会话与 advisor 会话不获普遍保证：源码核对显示子扩展工厂错误可能被吞掉、子扩展工具被排除、子 CLI 标志会丢失。普通子会话绑定成功不等于子失败时 fail-closed。只承诺根会话检查点。允许的可执行调用一旦开始，其内部不再受门控。

在开发 checkout 中，将 `OMP_BIN` 设为另行安装的 OMP 可执行文件，再运行 `npm run test-omp-preflight`。六项集成使用 localhost 脚本化 provider，不调用付费模型或使用模型凭据；缺少该宿主前提时会明确跳过。它们验证机械机制，不验证语义采用；实际执行的版本属于按版本保存的证据记录，不构成受支持版本声明。

可选参考分别说明各模块的前提、配置与限制。按项目适配，不照搬整套配置。

## 仓库结构

```text
SKILL.md                 Agent 操作程序、硬规则与任务路由
bin/governance.mjs       verify / list / cite / show / init / status / check；零依赖
knowledge/*.json         机器可读机制账（55 个域）
references/*.md          分域解释、来源区间与迁移说明
tools/                   可选的 GitHub 审批、Agent Note、OMP 前置检查与文档门禁模块
scripts/                 install-skill 与仓库 demo/smoke 辅助脚本
research/fixtures/       仅供仓库使用的可复现采用快照与验收证据
package.json             Node >= 22.19.0；MIT；private 包
LICENSE                  本包许可
SOURCE-LICENSE.txt       固定上游来源归属与 MIT 声明
```

## 贡献者验证

```bash
npm run verify
npm run demo
npm run smoke
npm run test-adoption
```

`npm run smoke` 检查全新打包与安装路径，包括拒绝覆盖已有 Skill 席位。可选文档门禁需要其锁定解析器依赖和仓库内的配置：

```bash
npm ci --prefix tools/doc-gates --ignore-scripts
npm run test-doc-gates
npm run verify-md-links
npm run verify-md-wrap
```

只报告实际运行过的命令及其退出码。本地通过不证明远端 CI 或发布状态；核对与你使用的提交相匹配的 GitHub Actions 运行和 Releases 条目。

独立编写的消费项目契约验收、首次失败与修复记录见[公开采用快照](research/fixtures/adoption-cli/README.md)，不需要安装 Skill 或依赖即可运行。`test-adoption` 是仓库贡献者命令，research 夹具不进入 npm 运行包或 Agent 安装座；重跑验证的是应用行为，不是重新启动自主 Agent 会话。[方法说明](METHODS.zh.md)另行区分这些观察、生产采用与完整来源迁移。


## 接入你的项目

从零依赖核心开始，再按仓库特点接入需要的治理检查：

- **让工作可追溯。** 把 Skill 的需求、验收、验证与交接流程融入现有开发方式。
- **按项目选择检查。** 只接入仓库真正需要的检查，复用项目自己的命令；文档、Agent Note 与审批模块仅在前提存在时启用。GitHub 审批与分支保护由项目策略统一管理。
- **方便获取与分发。** 可以直接使用本仓库；离线包以 [Releases 页面](https://github.com/JusticeSc/harness-project-governance/releases)存在对应条目为前提。

[历史发布记录](PUBLIC-VERIFICATION.md)保留了 Windows/Linux、Node.js 22.19/24 的核心安装与演示观察，不代表本轮对当前开发树重新跑过该平台矩阵。详细操作参考以中文为主，同时提供英文 CLI 输出和入门文档。

## 许可与致谢

本项目独立维护，借鉴并提取了 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317) 的项目治理实践，不是 DeepSeek 官方产品。

采用 [MIT 许可](LICENSE)，来源归属与原始 MIT 声明保留在 [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt)。
