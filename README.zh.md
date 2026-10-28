# harness-project-governance

**[English](README.md) | [中文](README.zh.md)**

**面向编码 Agent 的可移植项目治理 Skill。** 它把“Agent 说已经做完了”变成可追溯的声明：需求在哪里、哪些检查真的运行过、还有哪些结论未验证。

## 它解决什么问题

新仓库里最容易失控的不是代码，而是“完成”的定义。Agent 可能读不到项目事实，只凭聊天记录猜进度，把类型检查当作行为验证，或者把“应该能过”写成“已通过”。

本项目的目标是把 DeepSeek Harness 中可迁移的治理方法做成可自举、用于持续开发的项目初始化包：Skill 指导行动，程序和 CI 承担适合机械执行的要求。当前交付提供带来源的操作参考、可选检查工具，以及知识完整性和项目元数据 CLI；目标项目的规则选择、配置和 CI 接入仍需要明确适配。安装并不等于目标项目已经落实治理。

## 它带来什么

- **陌生仓库的起点。** 目标、验收条件与下一步动作存放在 `.governance/`，不再依赖上一轮对话。
- **可定位的参考。** 每个机制都有 ID、参考章节和固定提交的来源行号，Agent 能说明为什么采用某个程序。
- **可见的缺口。** `init` 与 `status` 在开工前列出缺失的项目事实、负责人、检查项与验收条件。
- **克制的完成声明。** 没运行的检查写“未验证”；完成结论必须附真实命令与退出码。
- **渐进采用。** 核心只有一个 Skill 和零依赖 CLI；审批、Agent Note、文档门禁等模块按前提条件单独启用。

它不是托管式治理平台、安全审计，也不能替代项目自己的测试与评审。

## 开发状态

当前开发树包含恢复出的、尚未发布的来源修正。安装与单项检查已有可用实现，完整的目标项目自举和自主 Agent 采用尚未建立。仓库包含 Skill、配套程序、测试和公共文档；维护者的会话进度、下一动作及本机查证记录归产品检出目录之外的开发工作空间。新克隆不依赖私有记录或父目录布局，按 `AGENTS.md`、当前请求与仓库事实接手；`AGENTS.md` 不安装到消费者项目。[公开验证记录](PUBLIC-VERIFICATION.md)保留历史发布观察，不是当前检出的新认证。

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

可直接查看[示例应用与验收测试](examples/task-board/README.md)，以及[历史发布观察和边界](PUBLIC-VERIFICATION.md)。临时演示目录会自动删除，不修改你的项目。

当前开发树上，`verify` 输出 `governance: 1196 mechanisms in 55 domains; references and anchors verified`。这个数字描述已提取的机制账，不代表上游每一行源码都被审阅，也不代表机制账完整无缺。

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
先查项目是否已有唯一状态 owner（如 PROJECT.md、任务板或交接文件）；有则读它，不再新建第二套。
用户要求初始化治理，或任务需要跨会话继续/交接/压缩前保存时，读取或创建 .governance/requirements.md 与 state.json；单会话内的多步改动不因此新建状态文件。
修改前，把可观察的验收条件写进当前状态 owner 或本次交付，并按任务路由到相应参考。
然后实施任务，用 `governance check` 执行 policy.checks 中登记的真实命令，逐条报告命令与退出码。
没有运行的检查写“未验证”；不要只凭元数据宣称工作已完成，也不要执行记录中已被当前请求撤销的动作。
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
| `check [仓库] [--policy 路径]` | 按策略中的 `checks` 顺序执行已配置命令，逐项报告退出码；任一失败退出 1；策略缺失、无效或检查为空退出 2。默认策略和显式 `--policy` 都按仓库根与策略文件的真实路径校验归属，不新建状态文件。 | 推导检查、证明语义完整或平台强制；通过 symlink/junction 读取真实位置在仓库外的策略。 |

对已安装的 Skill 示例：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

## `verify` 究竟证明什么

`verify` 证明包内自洽：JSON 机制账可解析，机制 ID 唯一，引用的 Markdown 文件存在，机制 ID 与锚点确实出现在该文件中，并且每条机制都有来源的 `path`、`start`、`end` 字段。任一项不满足时退出码为 1，并指出有问题的机制。

它不读取固定提交的上游仓库，不重新核对引用的源码行，不判断参考语义是否正确，不检查可选工具是否配置，也不能证明目标项目遵守了程序。

## 最小采用走查

先选一条目标仓库已经在乎的不变量，再按状态归属选择入口：

- **已有状态 owner**：继续在该 owner 中维护需求、验收与下一动作；不要运行 `init`。在旁边保存检查清单，例如 `governance-checks.json`：

  ```json
  {
    "checks": {
      "docs": "node .agents/skills/harness-project-governance/tools/doc-gates/verify-doc-budgets.mjs"
    }
  }
  ```

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs check . --policy governance-checks.json
  ```

- **没有状态 owner，且决定采用 `.governance/` 协议**：

  ```bash
  node .agents/skills/harness-project-governance/bin/governance.mjs init .
  # init 首次退出 2：按真实项目填写 policy、requirements 和 state
  node .agents/skills/harness-project-governance/bin/governance.mjs status .
  node .agents/skills/harness-project-governance/bin/governance.mjs check .
  ```

以上预算命令还需要 `.doc-gates/doc-budgets.json`，例如 `{"README.md":60}`；60 是示例，不是默认政策。两条路径都先观察通过，再故意超过上限确认退出 1，恢复后再次通过。将**同一条已验证的 `check` 命令**接入项目现有 CI（既有 owner 路径保留 `--policy`）。工作流文件存在不等于远端 required check 已生效；`check` 只执行登记命令，不替项目选择规则。策略命令以本机权限执行，和项目脚本一样需要信任。

## 可选模块

- `tools/github-approval/`：可选的加权审批安装器与工作流包，需要 Node.js；生产归属分析另需 Python >= 3.10 和 Pygments。安装器只写入文件，不修改 GitHub 分支保护，也不代替人工批准；见 [references/github-approval.md](references/github-approval.md)。
- `tools/agent-notes/`：Agent Note 的格式、分类、生命周期树与归档校验器；见 [references/agent-notes.md](references/agent-notes.md)。
- `tools/doc-gates/`：Markdown 链接、换行、翻译配对、预算与包 README 门禁，依赖另行固定的解析器。先运行 `npm run install-doc-gates`，再只配置仓库真正需要的门禁；不要照搬本仓库的全部阈值。

### 可选的 OMP 前置检查适配器

`tools/omp-preflight/simplification.mjs` 是目标新增的 OMP 18.13.1 适配器，不是恢复出的上游行为，也不属于零依赖的 `bin/governance.mjs` CLI。它只使用 Node 内置模块。支持且已探测的范围是 Windows 上的 OMP 18.13.1 加 `--mode rpc`；脚本化本地 provider 探测只覆盖宿主机制，不是来源工作流的语义验收或普遍采用声明。交互 TUI、其他模式、宿主与版本均未验证。真实模型候选的失败及后续有界结果另记于 [METHODS](METHODS.zh.md)。

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

在开发 checkout 中，将 `OMP_BIN` 设为已安装的 OMP 18.13.1 可执行文件，再运行 `npm run test-omp-preflight`。六项集成使用 localhost 脚本化 provider，不调用付费模型或使用模型凭据；缺少该宿主前提时会明确跳过。它们验证机械机制，不验证语义采用。

可选参考解释来源机制与迁移边界。复用的是要求，不是整套配置。

## 仓库结构

```text
SKILL.md                 Agent 操作程序、硬规则与任务路由
bin/governance.mjs       verify / list / cite / init / status / check；零依赖
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
npm run smoke
npm run test-adoption
```

`npm run smoke` 检查全新打包与安装路径，包括拒绝覆盖已有 Skill 席位。可选文档门禁另需：

```bash
npm run install-doc-gates
npm run test-doc-gates
```

只报告实际运行过的命令及其退出码。

独立编写的消费项目契约验收、首次失败与修复记录见[公开采用快照](research/fixtures/adoption-cli/README.md)，不需要安装 Skill 或依赖即可运行。`test-adoption` 是仓库贡献者命令，research 夹具不进入 npm 运行包或 Agent 安装座；重跑验证的是应用行为，不是重新启动自主 Agent 会话。[方法说明](METHODS.zh.md)另行区分这些观察、生产采用与完整来源迁移。


## 接入你的项目

从零依赖核心开始，再按仓库特点接入需要的治理检查：

- **让工作可追溯。** 把 Skill 的需求、验收、验证与交接流程融入现有开发方式。
- **按项目选择检查。** 为文档、Agent Note 与审批模块配置实际规则，并接入项目自己的检查命令和 CI；GitHub 审批与分支保护由项目策略统一管理。
- **方便获取与分发。** 可以直接使用本仓库，或下载 [Releases 页面](https://github.com/JusticeSc/harness-project-governance/releases)的离线包。

[历史发布记录](PUBLIC-VERIFICATION.md)保留了 Windows/Linux、Node.js 22.19/24 的核心安装与演示观察，不代表本轮对当前开发树重新跑过该平台矩阵。详细操作参考以中文为主，同时提供英文 CLI 输出和入门文档。

## 许可与致谢

本项目独立维护，借鉴并提取了 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/687f282e8625c6b8d11ff58211a90524be2e4317) 的项目治理实践，不是 DeepSeek 官方产品。

采用 [MIT 许可](LICENSE)，来源归属与原始 MIT 声明保留在 [SOURCE-LICENSE.txt](SOURCE-LICENSE.txt)。
