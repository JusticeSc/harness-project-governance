# harness-project-governance

**[English](README.md) | [中文](README.zh.md)**

**面向编码 Agent 的可移植项目治理 Skill。** 它把“Agent 说已经做完了”变成可追溯的声明：需求在哪里、哪些检查真的运行过、还有哪些结论未验证。

## 它解决什么问题

新仓库里最容易失控的不是代码，而是“完成”的定义。Agent 可能读不到项目事实，只凭聊天记录猜进度，把类型检查当作行为验证，或者把“应该能过”写成“已通过”。

本项目的目标是把 DeepSeek Harness 中可迁移的治理方法做成可自举、用于持续开发的项目初始化包：Skill 指导行动，程序和 CI 承担适合机械执行的要求。当前交付提供带来源的操作参考、可选检查工具，以及知识完整性和项目元数据 CLI；目标项目的规则选择、配置和 CI 接入仍需要明确适配。安装并不等于目标项目已经落实治理。

## 它带来什么

- **陌生仓库的起点。** 目标、验收条件与下一步动作存放在项目已有的状态 owner（或按触发启用的 `.governance/`），不再依赖上一轮对话。
- **可定位的参考。** 每个机制都有 ID、参考章节和固定提交的来源行号，Agent 能说明为什么采用某个程序。
- **可见的缺口。** `init` 与 `status` 在开工前列出缺失的项目事实、负责人、检查项与验收条件。
- **克制的完成声明。** 没运行的检查写“未验证”；完成结论必须附真实命令与退出码。
- **渐进采用。** 核心只有一个 Skill 和零依赖 CLI；审批、Agent Note、文档门禁等模块按前提条件单独启用。

它不是托管式治理平台、安全审计，也不能替代项目自己的测试与评审。

## 开发状态

`1.1.0-rc.1` 是本包的预发布候选，不是稳定版，也不发布到 npm registry。它包含零依赖核心 CLI（`verify`、`list`、`cite`、`show`、`init`、`status`、`check`）、独立安装器、协助式采用程序、全仓 Markdown 基线修复和一处 Agent Note 诊断修正。可选的审批、Agent Note、文档门禁与 OMP 前置检查模块只在各自的依赖、配置和权限内可用。候选通过本仓库的 GitHub Release/tarball 路径分发；`package.json` 保持 `private: true`。在对应的 GitHub Release 与 Actions 运行存在之前，本文不宣称发布或 CI 已通过。

采用是协助式、由 owner 评审的：记录目标事实与本次变更实际触发的全部义务，把本包已发布的迁移决定（[SKILL §3.2a](SKILL.md) 与分域迁移小节，例如[文档迁移](references/documentation.md#migration)）适配到目标的 owner、命令、语料、依赖与权限，再由项目负责人或独立评审接受决定后才实施。已撤下的逐语义单元新上下文采用程序不是默认流程。此前的候选——冷会话 PowerShell 与 Node 练习、评审决定、引用取证、拆分上下文与来源绑定尝试——均未满足各自必需条件，原失败判定保持；历史见 [METHODS 第14节](METHODS.zh.md#a07-adoption-candidate)，不在快速开始中展开。本候选没有完整的独立采用结果，不构成自主 Agent 采用、跨项目或跨语言认证，也不构成完整来源认证。

维护者的会话进度、下一动作及本机查证记录归产品检出目录之外的开发工作空间。新克隆不依赖私有记录或父目录布局，按 `AGENTS.md`、当前请求与仓库事实接手；`AGENTS.md` 不安装到消费者项目。[公开验证记录](PUBLIC-VERIFICATION.md)区分版本特定的发布检查与历史观察；两者都不认证完整采用。

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

创建元数据前，先检查目标是否已有唯一状态 owner（任务板、Issue/PR 台账、交接文件或 `PROJECT.md`）。已有则把需求、验收、采用决定与下一动作留在该 owner；不要运行 `init`，也不要新建 `.governance/`。

仅当目标没有状态 owner，且以下条件至少满足一项时运行 `init`：用户要求初始化治理；工作需跨会话继续或交接；或需在压缩前保存进度：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs init .
node .agents/skills/harness-project-governance/bin/governance.mjs status .
```

`init` 创建 `.governance/policy.json`、`state.json`、`requirements.md`、`README.md` 和 `decisions/`，不覆盖已有文件。安装成功或改动跨多步本身不构成初始化元数据的理由。在项目名、工具链、负责人、检查项、当前需求、验收条件和下一步动作填写完整之前，`init` 与 `status` 以退出码 2 结束。这是“元数据尚未填完”的预期信号，不是安装损坏。`status` 只检查元数据是否存在，不执行 `policy.checks`，也不能证明工作完成。若 `.governance/` 尚不存在，`status` 以退出码 1 结束并提示先运行 `init`。

## 给 Agent 的提示词

安装后可以直接把下面的提示词交给编码 Agent：

```text
遵循 .agents/skills/harness-project-governance/SKILL.md。
先查项目是否已有唯一状态 owner（如 PROJECT.md、任务板或交接文件）；有则读它，不再新建第二套。
用户要求初始化治理，或任务需要跨会话继续/交接/压缩前保存时：已有状态 owner 就用它，否则读取或创建 .governance/requirements.md 与 state.json；单会话内的多步改动不因此新建状态文件。
修改前，把可观察的验收条件写进当前状态owner或本次交付，并按任务路由到相应参考。
首次/渐进采用按 SKILL §3.2a：核实目标事实与本次变更实际触发的全部义务，再把本包已发布的迁移决定（例如[文档迁移](references/documentation.md#migration)）适配到目标的参数、既有 owner、命令、语料、依赖与权限。维护者负责来源义务核对、例外、分类与工具保证；你负责项目事实、配置、执行与准确报告。发现具体来源疑点就带影响回报维护者，不得断言等价或删掉义务。实施前由项目负责人或独立评审接受采用决定；随后实施，在同一本地/CI 入口给出正常、拒绝与恢复证据，从同一 owner 跨会话接续，并报告每条真实命令的退出码。
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
| `show <精确id> [--part mechanism\|reference] [--cursor token]` | 无损分页返回完整机制对象或其登记的参考文件，附来源、字节区间、内容摘要和继续游标。 | 裁定适用性、提供未分发的上游正文、证明理解或认证采用。 |
| `init [仓库]` | 创建缺失的 `.governance/` 元数据文件，从不覆盖。 | 替项目填写事实。 |
| `status [仓库]` | 报告缺失的项目、需求、验收、负责人、检查项与下一步动作。 | 运行检查或认证完成。 |
| `check [仓库] [--policy 路径]` | 按策略中的 `checks` 顺序执行已配置命令，逐项报告退出码；任一失败退出 1；策略缺失、无效、`checks` 为空，或某项不是非空命令字符串时退出 2。默认策略和显式 `--policy` 都按仓库根与策略文件的真实路径校验归属，不新建状态文件。 | 推导检查、证明语义完整或平台强制；通过 symlink/junction 读取真实位置在仓库外的策略。 |

对已安装的 Skill 示例：

```bash
node .agents/skills/harness-project-governance/bin/governance.mjs cite decisions-durable-rule-admission
```

用`show documentation-prose-budgets`读取完整条目（含`migration`及新增字段），用`--part reference`读取其参考文件。每次取`next`，以相同ID/part加`--cursor`继续；连接`chunks`，核对连续字节区间、身份/摘要及显式末页。整页至多4096个UTF-8字节，每行至多512字节；缺页、重复、乱序或工具截断不算完整读取。无效/过期游标及不可读引用退出1，不输出成功页。完整分页契约见[SKILL第5节](SKILL.md)；传输完整不等于语义接受。

## `verify` 究竟证明什么

`verify` 证明包内自洽：JSON 机制账可解析，机制 ID 唯一，引用的 Markdown 文件存在，机制 ID 与锚点确实出现在该文件中，并且每条机制都有来源的 `path`、`start`、`end` 字段。任一项不满足时退出码为 1，并指出有问题的机制。

它不读取固定提交的上游仓库，不重新核对引用的源码行，不判断参考语义是否正确，不检查可选工具是否配置，也不能证明目标项目遵守了程序。

## 最小采用走查

采用从目标出发，不按每条义务重读上游来源。记录目标事实与本次变更实际触发的全部义务，再把本包已发布的迁移决定——[SKILL §3.2a](SKILL.md)、分域迁移小节（如[文档迁移](references/documentation.md#migration)）及机制记录中的 `migration` 字段——适配到目标：保留机制及其作用，只替换路径、阈值、门禁名、语言对和工具实现等参数。文档迁移小节是一个入口，不是封闭清单；按目标事实实际触发的分支继续读取。维护者负责核对已发布决定是否覆盖来源义务及其例外、分类、参数化和工具保证；消费者负责真实项目事实、既有 owner、命令、语料、依赖与权限，以及执行和报告。已发布材料有缺口或与项目冲突时，带具体影响回报维护者；不得猜测等价、虚构上游依据或静默取消义务。

在既有 owner 记录采用决定、实际命令与观察到的退出码。实施前由项目负责人或独立评审按目标事实和全部触发义务（含阻塞与不适用项）核对决定；元数据、引用或机械检查通过都不授权实施。依赖或权限缺失是前提阻塞，不是不适用；scratch、缓存和测试内部安装效果须与记录的权限相容。记录接受后才在同一本地/CI 入口实施并验证；决定完成不等于采用完成，仅初始化元数据不需要这套采用流程。

参考位置定位本包解释，不等于上游来源。迁移设计按真实类别标注；记录参数替换，不把来源阈值直接当成目标参数。

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

实施已接受决定后，在共用入口保留消费者可见的正常和无效输入断言，而不只留下临时探针。若采用需要跨会话继续，把已接受决定、已运行与未运行的命令、原始证据位置及一个可执行下一动作留在唯一 owner 中。新会话从 Skill、仓库和当前请求接续真实变更，重新评估触发义务，不依赖本轮对话。

**证据与层级。** 两条路径都先运行正常命令并观察通过；在可恢复副本或获授权的文件中注入本次义务应拒绝的真实错误；从同一顶层入口确认非零退出；精确恢复字节后再次观察通过。将原始 stdout/stderr 与命令/退出收据保留在 owner 所属证据位置，从日志引用诊断，不凭记忆重构数字。报告真实安装/临时写入效果，区分本地执行、工作流接线、远端 CI 和服务端合并阻断。采用验收须满足全部适用义务、行为、原报告与权限条件，事后更正不追认失败原件。`check` 只执行登记命令，不替项目选择规则、不证明语义完整，也不建立平台强制。策略命令以本机权限执行，和项目脚本一样需要信任。

Node.js 只是 CLI 的宿主，不代表支持或验证了所有目标语言：登记命令可以调用仓库自己的工具链，但本包实际覆盖的是 Node.js 执行；其他语言与平台除非项目自行测试，否则保持未验证。采用报告中要把实际命令与退出码、来源依据的推断、未验证事项分开；一次有界交付练习在明确要求时区分了这三类；它是单次干预、没有对照组，不构成因果证明或普遍认证。

## 可选模块

- `tools/github-approval/`：可选的加权审批安装器与工作流包，需要 Node.js；生产归属分析另需 Python >= 3.10 和 Pygments。安装器只写入文件，不修改 GitHub 分支保护，也不代替人工批准；见 [references/github-approval.md](references/github-approval.md)。
- `tools/agent-notes/`：Agent Note 的格式、分类、生命周期树与归档校验器；见 [references/agent-notes.md](references/agent-notes.md)。
- `tools/doc-gates/`：Markdown 链接、换行、翻译配对、预算与包 README 门禁，依赖另行固定的解析器。先运行 `npm run install-doc-gates`，再只配置仓库真正需要的门禁；不要照搬本仓库的全部阈值。

### 可选的 OMP 前置检查适配器

`tools/omp-preflight/simplification.mjs` 是目标新增的 OMP 适配器，不是恢复出的上游行为，也不属于零依赖的 `bin/governance.mjs` CLI。它只使用 Node 内置模块。历史探测在 Windows 上的 OMP 18.13.1 加 `--mode rpc` 下运行；该版本特定证据只覆盖宿主机制，不是来源工作流的语义验收或普遍采用声明。交互 TUI 和未列明的宿主/模式/版本组合未获认证。在开发 checkout 中可用仓库的 localhost 夹具执行另行安装的 OMP；确切安装版本、命令与结果归按版本保存的 [PUBLIC-VERIFICATION.md](PUBLIC-VERIFICATION.md)，不把一个版本的结果外推到另一个版本。真实模型候选的失败及后续有界结果另记于 [METHODS](METHODS.zh.md)。

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

可选参考解释来源机制与迁移边界。复用的是要求，不是整套配置。

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

只报告实际运行过的命令及其退出码。本地命令通过不等于本候选的 CI 或发布已通过；请核对候选提交对应的 GitHub Actions 运行与 Releases 条目。

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
