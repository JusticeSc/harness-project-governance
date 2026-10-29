# 工程域治理迁移参考（engineering）

本文件是 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 中“工程实现治理”的独立迁移参考。目标读者是另一个仓库的维护者或编码代理：不需要原始 checkout，也能按本文件复现同等强度的结构约束、类型安全、生命周期、包边界、配置组合、源/产物平面、产品/实验隔离和防御性模式。

引用格式为 `deepseek-harness/<path>:<start>-<end>@<commit>`；本文件实际提交为 `687f282e8625c6b8d11ff58211a90524be2e4317`。每个机制的完整机器可读记录在 `knowledge/engineering.json`，实际检查范围与未检查候选在 `research/engineering-coverage.json`。

## 0. 使用约定与证据边界

- **【源仓义务】**：源仓明确要求或由源码门禁执行的内容。迁移时默认保留；只有原文给出例外或审批路径时才可偏离。
- **【迁移设计】**：为了让机制在另一个仓库可运行而补充的步骤、命名或接线。它不声称源仓已有同样实现。
- **【建议】**：可选强化，不构成源仓义务。
- **证据状态**：本参考作者只做静态源码阅读，未运行源仓的任何构建、测试、lint、formatter 或远程 CI。凡涉及“验证”的文字都是迁移后必须执行并留证的动作，不是已经通过的结果。`knowledge/engineering.json` 中所有 verification 证据均标为 `planned`。
- **适用性参数**：源仓的技术选择（Cordis、pnpm、TypeScript、Vite、Electron、Python SDK）不是治理目标本身。迁移时按“机制效果”映射到目标工具链；无法映射时保留规则和再激活条件，不要用更弱的手工评审冒充自动保证（见 `research/BRIEF.md` C2）。
- **迁移裁剪的边界**：下文每节的“迁移裁剪”只说明如何映射实现，不构成对源仓义务的豁免。目标缺少某项设施时，必须把它列为前置条件、实现等价物，或在迁移记录中明确阻塞；不得把“没有工具”写成“不适用”。每项裁剪都要记录保留的义务、替代证据、缺口、批准人和再激活触发。
- **最小可信单元**：每条机制都记录触发条件、义务、角色、步骤、执行方式、失败表现、例外、迁移策略和限制。只有“自动门禁 + 失败样例”才可声称自动保证；只有“评审清单”则明确标为人工保证。

<a id="engineering-instruction-tiers"></a>
## 1. 指令层级、单一事实归属与文档预算（engineering-instruction-tiers）

**触发**：新增或修改根级/子树级 `AGENTS.md`、`CLAUDE.md`、Agent Note、README、`docs/` 页面、技能说明；出现同一规则在多处复述；文档超出预算。

**角色与前置**：改动者负责把事实放到唯一归属层级；文档 owner 决定预算调整；评审者检查是否复制了别处的权威内容。

**【源仓义务】**
- 根 `AGENTS.md` 只放“每个会话都需要在上下文中的常驻命令”，每条 1–3 行并链接其归属文档；故事、完整示例、情境化流程不放根文件。子树 `AGENTS.md` 只放该子树特有规则，不重复根规则。`deepseek-harness/docs/AGENTS.md:15-36@687f282e`
- 文档按层归属：架构图放 `docs/architecture.md`；类型与语义放 `docs/subsystems/`；决策理由放 Agent Notes；评审强制规则放 `docs/defensive-patterns/`；事故叙事放 `docs/postmortem/`；步骤式操作放 `docs/cookbook/`；每包契约放包 README；生成目录只由生成器写入。`deepseek-harness/docs/AGENTS.md:15-36@687f282e`
- 编辑指令时编辑真实文件：根和 `packages/` 的 `CLAUDE.md` 是指向 `AGENTS.md` 的符号链接；保持每条规则自包含并链接高层文档；在清晰度不损失时压缩。`deepseek-harness/AGENTS.md:179-181@687f282e`
- 已实现 Agent Note 用现在时描述“实际已交付的现实”，不写迁移计划、验收清单或“should”；归档 Notes 冻结，永不编辑，也不作为当前权威。`deepseek-harness/.agents/notes/implemented/AGENTS.md:5-13@687f282e`、`deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e`
- 文档字数有显式上限；`scripts/doc-budgets.manifest.json` 列出被预算的 7 个文件（根 `AGENTS.md` 2080、`docs/AGENTS.md` 1430、`docs/architecture.md` 2410、`docs/cordis-primer.md` 600、`docs/testing.md` 1350、`packages/AGENTS.md` 810、`packages/README.md` 994），`scripts/verify-doc-budgets.ts` 按空白分词计数，拒绝超限、缺失文件和非正整数上限。`docs/AGENTS.md` 的目标值与 manifest 不完全相同（architecture 2400、testing 1300、examples/AGENTS 310 未在 manifest），迁移时以 manifest 为实际门禁，目标值只作评审预算。`deepseek-harness/docs/AGENTS.md:49-59@687f282e`、`deepseek-harness/scripts/verify-doc-budgets.ts:1-58@687f282e`、`deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e`。超限时先迁移内容到正确层级，再压缩，最后才在 PR 中说明理由后提高上限；未列入 manifest 的文档由评审治理，不是自动豁免。
- 归档 Notes 的改动由 pre-commit 与 pre-merge-commit 钩子单独校验（`verify-archived-agent-notes.ts`）；同一 `lefthook.yml` 的 7–11 行和 36–40 行是翻译配对任务，不是归档任务。`deepseek-harness/lefthook.yml:7-11@687f282e`、`deepseek-harness/lefthook.yml:13-15@687f282e`、`deepseek-harness/lefthook.yml:36-40@687f282e`、`deepseek-harness/lefthook.yml:42-44@687f282e`
- 维护文档的引用纪律：当前文件用相对 Markdown link，历史引用用 tag/PR 号；`verify-md-links` 检查本地目标，`verify-repository-references` 拒绝实际 commit 标识和不允许的组织 URL。`deepseek-harness/docs/AGENTS.md:75-77@687f282e` 本参考按 BRIEF 使用完整 commit anchor 作为来源坐标；这些 anchor 属于治理证据层，不应原样复制进目标仓库的维护文档。
- 文件卫生：每个文件恰好一个尾随换行；pre-commit 的 `git diff --cached --check` 拒绝 staged whitespace 错误。`deepseek-harness/AGENTS.md:165-165@687f282e`、`deepseek-harness/lefthook.yml:24-25@687f282e`

**子树指令矩阵（本域实际读过的源仓文件；只取与本域机制相交的义务）**

| 子树文件 | 本域读取的治理点 | 归属/不复制 |
|---|---|---|
| `packages/AGENTS.md:1-29` | 插件导出两种形态、`ctx.get`、产品可见插件的 REAL-composition 测试、initiator 私有链先 derive 再 capture、一个异步操作一个生命周期控制器、Service Definition 面向所有当前 Consumer、当前 owner/need/公共选择证据、共享状态 owner、业务规则归包、model-facing 契约、在执行操作中强制决策、commit point 发布、完整结果边界、registry disposal、并发 spec 自持端口/路径/子进程、包 tsconfig/命名/README。 | 测试细节归 Testing；文档细节归 Documentation；本域只把它们作为包级横向不变量。 |
| `scripts/AGENTS.md:1-5` | gate 脚本 shell-free 调 pnpm、路径归一化为 `/`、平台适配留在需要的 gate、语法感知发现、拒绝空/被缩窄语料、测试每个 admitted/excluded 边界；spec 自持端口/临时路径/子进程，单独跑才过是 spec 缺陷。 | 测试执行模型归 Testing；本域把它作为“检查必须可证伪”的证据规则。 |
| `packages/web/AGENTS.md:1-5` | 凭据承载的 provider 请求必须拒绝 redirect；回归证明 redirect 目标未被联系，且每个 credentialed provider opt-in。 | 安全/HTTP 细节归 Security 或 Web；本域只记录这条网络边界。 |
| `packages/schedule/AGENTS.md:1-11` | Host storage 拥有 active/ended task；原 Session id + 全局唯一 task id；只有显式删除移除；管理不激活 Session；一个 runtime 扫描；保留 `after/at/every/daily/weekly/cron`；daily 用显式时间和 IANA zone；跳过缺失本地时间、重叠取较早一次；recurring 只补 latest missed；enqueue 后等待持久化再 retire/advance；失败保留 task、无通用 retry；shutdown drain。 | 产品领域规则，不上升为通用工程机制；迁移时若复制调度能力再引用。 |
| `vendor/AGENTS.md:1-7` | 不随意编辑 `vendor/*/src`；每个 divergence 必须登记到 `vendor/README.md`；`vendor/*/tsconfig.json` 是可再生的例外。 | Supply/Release 拥有 vendoring 与同步流程。 |
| `.github/AGENTS.md:1-7` | Windows job 用原生 `pwsh` 与 `windows-*`；`ci.yml` 只跑 PR，master-only 与 manual workflow 分离；Windows packaging 使用专用 self-hosted label；Desktop publication 用 `desktop-test`/`desktop-production` approval Environments。 | Automation/Release 拥有 workflow 图。 |
| `website/AGENTS.md:1-23` | `website/` 只拥有 VitePress 配置、展示资产、发布 manifest；canonical prose 留在 `docs/`；`.generated/`/`.cache/`/`.dist/` 不编辑不提交；生产构建拒绝逃出 site root 的输出并按 link 删除而非穿越；raw Markdown/`llms.txt` 由 manifest 派生；改子树跑 `docs:check`。 | Documentation 拥有站点与投影。 |
| `snapshots/AGENTS.md:1-17` | 该树只放以提交的 session JSONL 为 replay 输入/期望输出的测试；进程经 `dsh` CLI + shipped profile；不新增应用入口/隐藏 CLI/场景驱动；session 文件名版本规则、保留多代、replay/record/refresh 选最高代、不重命名/删除已提交代；committed sessions 是 normalization fixed points；workspace seed 用 `workspace.expected/`；record/refresh 结果逐项 review。 | Testing/Release 拥有 snapshot 语料与迁移覆盖。 |
| `native/system/AGENTS.md:1-28` | Node-API v8、禁用 NAN/V8 C++/实验接口；launcher 只依赖 libc、静态 musl；glibc/musl/macOS 各自二进制；flock 只在异步 worker 尝试 `LOCK_EX|LOCK_NB` 并捕获 errno；无环境变量覆盖运行时二进制；无 install-time compile fallback；platform matrix、prepack 校验、npm pack 保权限、packed-install 验证。 | Native/Release 拥有二进制构建与发布。 |
| `apps/cli/tests/profiles/AGENTS.md:1-7` | profile 集成测试从 `apps/cli/src/bin.ts` + `--profile` 或 shorthand 启动；只有公共 profile 输出无法暴露内部证据时才允许 test-only Loader driver；包特定 fixture 留在包的 `tests/fixtures/`；recorded replay 放顶层 `snapshots/`。 | Testing 拥有 profile 测试与 fixture 放置。 |
| `.agents/notes/AGENTS.md:1-7`、`.agents/notes/implemented/AGENTS.md:1-13`、`.agents/notes/archived/AGENTS.md:1-9` | 每个新 Note 触发 supersession 检查；实现 Note 随实际交付更新事实，不追加变更史；归档 triplet 冻结，不编辑/翻译/修复/删除/移动，只用新 Note 记录变化；归档只允许完整 triplet 迁移 + `Archived` 行 + sidecar 重录 + 入链修复。 | Documentation/Decisions 拥有 Agent Note 生命周期；本域只引用与机制相关的决定。 |

**步骤**
1. 先判定事实的归属层；若已有归属，只写一行链接，不复述。
2. 根规则必须能独立读懂；细节链接到架构、子系统、README 或 Note。
3. 修改真实 `AGENTS.md`，不要改符号链接；保持链接相对路径可解析。
4. 文档行为变化后运行文档门禁；预算超限按“迁移 → 压缩 → 提额”顺序处理。
5. 归档 Note 只读；需要新结论时写新的实现/提议 Note 并声明取代关系。

**完成信号**：同一事实只有一个权威位置；根文件无故事化细节；`verify-doc-budgets`、链接检查、归档检查通过；评审能指出每条规则的家。

**失败处理**：预算红不是“删到目标以下”，而是“把内容送回其归属层”；链接红修目标或路径，不改检查器；归档被改则恢复并用新 Note 记录变化。

**例外**：机械性/局部编辑可免写 Agent Note；局部 UI 改动也在豁免内。`deepseek-harness/AGENTS.md:155-155@687f282e`。文档 owner 可批准提高预算，但必须在 PR 说明理由。

**迁移裁剪**：没有 `docs/` 分层的小仓库仍保留“根/子树两级 + 单一事实归属”和“每个事实一个家”的不变量；把预算机制映射到目标仓库的 markdown lint 或等价字数门禁，并把阈值、缺失文件检查和失败行为纳入迁移记录。层级可以简化，但“同一规则不得在多处复述”“超限先迁移再压缩”不可删除。若目标仓库不允许符号链接，则用一个受检的生成/同步步骤保证 `CLAUDE.md` 与 `AGENTS.md` 内容一致；这是“替代实现 + 检查”，不是删除单源编辑义务。

**证据与限制**：层级归属是人工评审保证；预算和归档有自动门禁（若迁移后实现）。仅通过字数检查不证明内容正确。

来源：deepseek-harness/AGENTS.md:179-181@687f282e 来源：deepseek-harness/AGENTS.md:155-155@687f282e 来源：deepseek-harness/docs/AGENTS.md:15-36@687f282e 来源：deepseek-harness/docs/AGENTS.md:38-48@687f282e 来源：deepseek-harness/docs/AGENTS.md:49-59@687f282e 来源：deepseek-harness/.agents/notes/implemented/AGENTS.md:5-13@687f282e 来源：deepseek-harness/.agents/notes/archived/AGENTS.md:1-9@687f282e 来源：deepseek-harness/lefthook.yml:7-11@687f282e 来源：deepseek-harness/lefthook.yml:13-15@687f282e 来源：deepseek-harness/lefthook.yml:24-25@687f282e 来源：deepseek-harness/lefthook.yml:36-40@687f282e 来源：deepseek-harness/lefthook.yml:42-44@687f282e 来源：deepseek-harness/scripts/verify-doc-budgets.ts:1-58@687f282e 来源：deepseek-harness/scripts/doc-budgets.manifest.json:1-9@687f282e 来源：deepseek-harness/docs/AGENTS.md:75-77@687f282e 来源：deepseek-harness/AGENTS.md:165-165@687f282e 来源：deepseek-harness/package.json:132-132@687f282e

<a id="engineering-check-selection"></a>
## 2. 按改动面选择检查（engineering-check-selection）

**触发**：提交、推送、PR、修复 CI、声称“完成”。

**角色与前置**：改动者选择覆盖改动面的最小检查；CI 负责穷举覆盖和平台矩阵。

**【源仓义务】**
- 推送前按 `dsh-pre-push-checks` 选择检查；只报告真正运行过的命令。`deepseek-harness/AGENTS.md:113-121@687f282e`
- 工具链由根 manifest 固定：`packageManager: pnpm@11.28.5`，`engines.node: ^22.19.0 || >=24.0.0`；所有命令按 pnpm 脚本调用，不混用 npm/yarn 生成的安装状态。`deepseek-harness/package.json:7-10@687f282e`
- 证据必须匹配表面：行为改动跑聚焦行为测试；模型/用户可见输出跑快照；文档跑 `doc-sync`；发布路径跑构建后 smoke；provider 跑真实 API e2e。`deepseek-harness/AGENTS.md:117-118@687f282e`
- 不要把全量测试当默认，也不要为提交/推送重复已通过的检查；只有显式要求、诊断 CI 或不可约的仓库级改动才本地重演全部。`deepseek-harness/AGENTS.md:118-118@687f282e`
- CI 覆盖率门禁是 `test:coverage`（逐文件 100% on `packages/*/*/src`），不是 `test`。`deepseek-harness/AGENTS.md:119-119@687f282e`
- TypeScript 工作声明完成前：最新 `build:artifacts` 之后跑 `build:check`，或直接跑 `build`。`deepseek-harness/AGENTS.md:120-120@687f282e`
- 测试解析只走源码平面；构建产物只由显式 `lib` 模式或 built smoke 消费。`deepseek-harness/docs/testing.md:43-46@687f282e`
- 钩子是快速本地检查点，不是完整测试：`pre-commit` 只做 staged pairing record、staged Oxlint（一次 bounded retry）、whitespace、pi-ai provider metadata、vendor manifest guard；`pre-merge-commit` 重跑 pairing；`pre-push` 跑 `typecheck`（先生成 Typert contracts，再双聚合 tsc）。hooks 有意不跑 tests/snapshots/docs/build/hygiene；`pnpm run check:all` 是显式选择而不是代理指令；CI 拥有 exhaustive 覆盖、built smokes 与 Node 版本矩阵。`deepseek-harness/docs/development.md:135-152@687f282e`
- gate 脚本 shell-free 调 pnpm，在 ingestion 把 repo-relative glob 归一化为 `/`，平台适配留在需要的 gate；源 ownership gate 用 syntax-aware discovery，拒绝空或被缩窄的语料，并对每个 admitted/excluded 边界有测试。spec 并发执行时自持端口、临时路径和子进程；单独跑才过是 spec 缺陷。`deepseek-harness/scripts/AGENTS.md:1-5@687f282e`
- gate 聚合与模式库存由 `scripts/run-gates.ts` 拥有；本域只读了 333-397、790-795、818-832 的片段（product-use、package-meta、client-packages、no-top-level-await 等接线），不能把局部列表当作完整 CI 矩阵；完整模式归 Automation。`deepseek-harness/scripts/run-gates.ts:333-397@687f282e`、`deepseek-harness/scripts/run-gates.ts:790-795@687f282e`、`deepseek-harness/scripts/run-gates.ts:818-832@687f282e`

**步骤**
1. 列出改动面：源码/类型/文档/配置/发布产物/真实 provider。
2. 选择最小覆盖集；记录命令、版本、环境和结果。
3. 若失败与改动无关，不要静默修复或忽略；在交接中标注并让它进入下一 PR 窗口。
4. 声称完成前补跑该表面要求的最后一道检查（典型是 `build:check`）。

**完成信号**：证据清单与改动面一一对应；没有未运行的“应该会过”；全量套件只在有理由时出现。

**失败处理**：沙箱阻塞 `gh`/`pnpm`/构建/测试时，用最窄的主机提权重试同一命令，并保留沙箱证据；绝不绕过失败或产品沙箱。`deepseek-harness/AGENTS.md:109-111@687f282e`

**例外**：不可约的仓库级改动、CI 诊断、显式用户要求可本地重演全部。

**迁移裁剪**：把“按表面选证据”映射到目标仓库的测试分层，但**证据义务本身不可删除**。若目标缺少快照、e2e 或真实 API harness，这是“需要实现或阻塞”的前置条件，不是自动不适用：必须保留同等的可观察证据（契约测试、集成测试、fixture 回放、人工协议测试等），并在迁移记录中写明替代证据、覆盖缺口、批准人和再激活触发（例如引入快照设施、发布路径变化、provider 变更）。具体命令名可以换，但“行为改动、用户可见输出、文档、发布路径、provider”各自需要哪类证据的映射必须逐项保留并重新验证；不得因为设施缺失而把行为改动降级为只跑单测或只做静态检查。

**证据与限制**：检查选择本身是人工判断；自动门禁只证明被运行的检查通过，不证明选择充分。

来源：deepseek-harness/AGENTS.md:113-121@687f282e 来源：deepseek-harness/AGENTS.md:109-111@687f282e 来源：deepseek-harness/docs/testing.md:7-12@687f282e 来源：deepseek-harness/docs/testing.md:43-46@687f282e 来源：deepseek-harness/docs/development.md:91-103@687f282e 来源：deepseek-harness/docs/development.md:135-152@687f282e 来源：deepseek-harness/scripts/AGENTS.md:1-5@687f282e 来源：deepseek-harness/package.json:7-10@687f282e 来源：deepseek-harness/package.json:23-23@687f282e 来源：deepseek-harness/package.json:61-61@687f282e

<a id="engineering-architecture-extension-map"></a>
## 3. 架构地图、扩展点与“插件优先”（engineering-architecture-extension-map）

**触发**：新增跨包行为、修改 `packages/`、修改 agent loop、增加工具/适配器/命令/UI/持久状态、评审架构改动。

**角色与前置**：改动者必须先读架构文档；架构 owner 维护扩展点地图；评审者检查是否把行为放进了中心层。

**【源仓义务】**
- 改 `packages/` 前读 `docs/architecture.md`；架构文档是所有插件、profile/bundle、核心包、事件域、turn flow、能力缝和扩展点地图。`deepseek-harness/AGENTS.md:3-3@687f282e`、`deepseek-harness/docs/architecture.md:1-5@687f282e`
- 新行为附着到已文档化的扩展点；“插件，而不是改 loop”；改 `agent-loop` 必须同步更新 `docs/architecture.md` 的地图。`deepseek-harness/AGENTS.md:138-138@687f282e`、`deepseek-harness/docs/architecture.md:138-140@687f282e`
- 先选事件域：会话事件是持久事实（必须能从日志重建）；agent 事件携带活 Agent（观察或拦截飞行中的工作）；能力事件把策略/适配器接到 seam 上而不 import loop。`deepseek-harness/docs/architecture.md:67-77@687f282e`
- “Where new behavior goes”表逐项目标给机制：模型 provider→`ctx.llm`；模型可见能力→`ctx.tools`；单会话能力集→preset（服务行需 `isolate` realm）；shell/terminal/command/jobs/webhook/fs/sandbox/UI/session state 等各有指定注册面。`deepseek-harness/docs/architecture.md:138-165@687f282e`
- 业务能力拥有自己：中心 runtime/controller/manager/gateway 只承担通用编排和生命周期，业务条目由拥有它的包注册；中心层不得硬编码业务行。`deepseek-harness/docs/defensive-patterns/general.md:124-148@687f282e`、`deepseek-harness/packages/AGENTS.md:14-14@687f282e`
- API 层（controller/gateway/remotes）只做传输、调用形状、Session 生命周期等通用编排；业务分支必须在拥有包内决策，以投影数据或注册条目进入该层。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:83-115@687f282e`

**步骤**
1. 在架构地图中定位目标能力与现有扩展点；没有合适扩展点时先设计 seam，而不是在中心层加分支。
2. 选择事件域；持久事实进 session log，飞行中拦截进 agent/capability 事件。
3. 在拥有包内实现并注册；中心层只转发和管生命周期。
4. 若确实要改 loop，同一改动更新架构地图并说明为何扩展点不足。

**完成信号**：新行为能在“Where new behavior goes”找到对应行；中心层 diff 不含业务常量/分支；架构文档与实现一致。

**失败处理**：若只能在中心层加分支，先补架构决策（Agent Note）并让 domain owner 确认；不要把“先放进去再说”当作完成。

**例外**：纯基础设施（日志、传输、存储）不通过业务注册面，属于合理的中心层内容。`deepseek-harness/docs/defensive-patterns/general.md:124-148@687f282e`

**迁移裁剪**：若目标不是 Cordis，保留“扩展点目录 + 业务拥有自己 + 中心层只编排”的判定；把具体 `ctx.*` 映射为目标框架的注册 API。没有扩展点目录的项目必须先建立一页地图/注册表，否则该机制不可审计；建立地图是前置条件，不是可选项。目标框架一旦新增扩展机制，重新审计地图与归属。

**证据与限制**：源仓主要靠评审和架构文档约束；没有自动“业务分支在中心层”检查器。真实组合测试是补充证据（见 Testing 域）。

来源：deepseek-harness/AGENTS.md:3-3@687f282e 来源：deepseek-harness/AGENTS.md:138-138@687f282e 来源：deepseek-harness/docs/architecture.md:1-5@687f282e 来源：deepseek-harness/docs/architecture.md:67-77@687f282e 来源：deepseek-harness/docs/architecture.md:106-106@687f282e 来源：deepseek-harness/docs/architecture.md:118-128@687f282e 来源：deepseek-harness/docs/architecture.md:130-134@687f282e 来源：deepseek-harness/docs/architecture.md:138-165@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:124-148@687f282e 来源：deepseek-harness/packages/AGENTS.md:14-14@687f282e 来源：deepseek-harness/docs/defensive-patterns/remote-and-api.md:83-115@687f282e 来源：deepseek-harness/packages/README.md:94-101@687f282e

<a id="engineering-capability-seam"></a>
## 4. 能力缝三角色（engineering-capability-seam）

**触发**：设计可替换能力（shell、LLM、fs、sandbox、subagent、compaction 等），或决定是否拆包。

**角色与前置**：Service Definition owner 定义词汇与 `ctx.<key>`；Provider owner 实现；Consumer owner 使用；domain owner 裁决边界。

**【源仓义务】**
- seam 是完整三角色：**Service Definition**（拥有 `ctx.<key>` 与词汇类型的 Cordis `Service`，可以是 abstract class 或具体 registry，绝不是 TypeScript `interface`）、一个或多个 **Service Provider**、一个或多个 **Consumer**。`deepseek-harness/docs/glossary.md:7-9@687f282e`、`deepseek-harness/docs/architecture.md:130-134@687f282e`
- 角色通常分开包当它们独立演化；若三个角色确实是同一关注点，可以合并在一个包（LLM seam 就是定义+Consumer 合一、adapters 为 providers）。不要预防性拆分；只有一个可设想 provider 和一个 Consumer 时保持单包。`deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:13-30@687f282e`
- Service Definition 为所有当前 Consumer 设计：tool schema、Loader、UI、transport、provider 特有行为留在 Consumer/provider，不能让一个 Consumer 决定服务契约。`deepseek-harness/packages/AGENTS.md:10-10@687f282e`
- 扩展插件依赖 Service Definition，不依赖具体 Provider；组合 bundle 可以依赖 spine plugins。`deepseek-harness/packages/README.md:94-101@687f282e`
- 公共 service 方法只有一个内部调用者是反向气味：改为私有 capability closure，而不是公开方法。`deepseek-harness/packages/AGENTS.md:10-10@687f282e`

**步骤**
1. 写出三角色表：Definition 的 `ctx.<key>`/类型/错误；Provider 的机制；Consumer 的模型/用户可见契约。
2. 判断角色演化速率；独立演化才拆包，否则保留单包。
3. Definition 只暴露契约需要的词汇；Provider 与 Consumer 不互相 import 具体实现。
4. 为每个角色规划真实组合测试和 disposed/HMR 测试。

**完成信号**：存在明确的 Definition 类/registry、至少一个 Provider、至少一个 Consumer；替换 Provider 不需要改 Consumer 的模型可见契约；包依赖图只指向 Definition。

**失败处理**：若一个包同时是定义、provider、consumer 且没有独立演化理由，保留合并并写清理由；若 Provider 泄漏类型到 Consumer，回到 Definition 补词汇，而不是让 Consumer import Provider。

**例外**：`dsh-user-approval` 这类一个包拥有定义与具体实现的 seam 是允许的，因为角色是同一关注点。`deepseek-harness/docs/glossary.md:7-9@687f282e`

**迁移裁剪**：目标框架没有 `Service` 类时，用“接口/抽象类 + 注册表 + 消费者注入”映射，但必须保留“定义不是纯类型别名”的意图（有运行时注册身份）。若目标仓库确实没有多 provider 需求，可以只记录 seam 设计规则而不强行拆包；这是范围裁剪，不是降低定义标准。一旦出现第二个 provider/consumer，重新拆包并验证替换路径。

**证据与限制**：架构评审是主要保证；真实组合测试可证明替换路径。仅存在一个 interface 不构成 seam。

来源：deepseek-harness/docs/glossary.md:7-9@687f282e 来源：deepseek-harness/docs/architecture.md:130-134@687f282e 来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:13-30@687f282e 来源：deepseek-harness/packages/AGENTS.md:10-10@687f282e 来源：deepseek-harness/packages/README.md:94-101@687f282e

<a id="engineering-registrations-effects"></a>
## 5. 注册即效果与可逆生命周期（engineering-registrations-effects）

**触发**：注册工具、prompt section、provider、adapter、listener、slot、命令、任何贡献；实现 unload/HMR/teardown。

**角色与前置**：插件作者拥有每个注册的 disposer；评审者追踪从 `apply` 到释放的完整链路。

**【源仓义务】**
- 每个贡献都通过 `ctx.effect()` / `ctx.on()`；registry 的 `register()` 返回 disposer，并附着到调用插件，卸载时自动回卷。`deepseek-harness/AGENTS.md:133-133@687f282e`
- Cordis 管理的注册本身就是效果：`ctx.on`、`ctx.plugin`、service 注册、harness registry 都自动回卷；Cordis 不管理的资源（timer、connection、watcher）必须包在 `ctx.effect()` 里并返回 disposer。`deepseek-harness/docs/cordis-tutorial/02-lifecycle-and-effects.md:1-40@687f282e`
- 每个注册都应有 disposer；若 teardown 顺序重要，把相关工作放进同一个 effect，使释放按预期顺序展开。`deepseek-harness/docs/cordis-primer.md:41-45@687f282e`
- 每个 registry 需要 HMR 安全测试：dispose 贡献 fiber 并观察移除。`deepseek-harness/packages/AGENTS.md:19-19@687f282e`、`deepseek-harness/docs/testing.md:7-12@687f282e`
- 不要在模块级制造单例/缓存来承载注册；共享状态挂在 service 或 instance 上（见 ownership 机制）。

**步骤**
1. 列出 `apply` 中每个注册与资源获取点。
2. 用 `ctx.effect`/`ctx.on`/registry disposer 覆盖；同步 disposer 返回值。
3. 对顺序敏感的 teardown，把多个 effect 组合进一个 generator effect，并 yield 精确的 disposer。
4. 写 HMR/卸载测试：dispose 后注册消失、资源关闭、后续调用不落到死对象。

**完成信号**：插件卸载后无 listener/timer/process/file 残留；HMR 测试从红到绿能证明移除；没有模块级 handle。

**失败处理**：若卸载后仍有活动，按 `cordis-styling-nitpicking` 的 P0 规则定位“未回卷副作用”；不要用 `process.exit` 或测试清理掩盖。

**例外**：有意保留的 durable writes/remote mutations 不回滚；但其临时资源与活动监听仍需 owner。`deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:31-35@687f282e`

**迁移裁剪**：非 Cordis 框架用“注册返回 dispose/AbortSignal/Closeable”实现同等效果；关键是每个贡献有可审计的释放路径，而不是照搬 API 名。

**证据与限制**：HMR 测试是自动证据；没有测试的插件只能算评审保证。dispose 调用次数不等于 quiescence。

来源：deepseek-harness/AGENTS.md:133-133@687f282e 来源：deepseek-harness/docs/cordis-tutorial/02-lifecycle-and-effects.md:1-40@687f282e 来源：deepseek-harness/docs/cordis-primer.md:41-45@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:12-27@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:39-49@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:59-83@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:104-123@687f282e 来源：deepseek-harness/packages/AGENTS.md:19-19@687f282e 来源：deepseek-harness/docs/testing.md:7-12@687f282e 来源：deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:31-35@687f282e

<a id="engineering-explicit-state-contracts"></a>
## 6. 显式状态、正交结果与公共契约（engineering-explicit-state-contracts）

**触发**：设计异步结果、可选参数、状态表示、错误/超时/退出组合、公共 API 返回值、发布/提交流程。

**角色与前置**：API owner 在类型定义处写清契约；评审者判断调用者能否仅凭公共 API 命名失败来源和状态；实现者不得用时间/回调顺序补偿设计。

**【源仓义务】**
- **正交结果独立报告**：一个结果可以同时是“超时”和“退出码 0”（信号被捕获）；`timedOut`、`signal`、`exitCode` 各自独立暴露，不能把一个事实嵌进另一个分支。评审看报告形状，而不是杀进程机制。`deepseek-harness/docs/defensive-patterns/general.md:7-12@687f282e`
- **公共契约两侧都兑现**：多种内部表示（throw 或 `finish {kind:'error'|'aborted'}`）在公共 API 边界归一化；文档在类型定义处写明归一化契约；内部 helper 仍可 throw。`deepseek-harness/docs/defensive-patterns/general.md:13-18@687f282e`
- **异步状态不是同步状态**：`agent.followup()` 没有逐消息完成；后台任务完成会与 turn 边界竞争；`reader.close()` 同时表示 EOF 和 dispose。不要把 `agent/status`/`whenIdle()` 当作单次 follow-up 的结果。调用者若拥有一个运行区间，必须显式定义区间（例如从持久 inbox receipt 到下一次 whole-agent `idle`），并把输出描述为区间级而非因果归属。`deepseek-harness/docs/defensive-patterns/general.md:19-24@687f282e`
- **时间不承载正确性**：正确性来自显式调用点和显式状态，不来自 callback 落在事件循环的哪个位置；`microtask`/`setTimeout`/`queueMicrotask` 决定正确性会在负载下静默失败。React effect 也不能提供“渲染后刚刚好”的顺序。`deepseek-harness/docs/defensive-patterns/general.md:25-47@687f282e`
- **可选输入同时说明两种行为**：接口契约要写“存在时返回什么、缺失时返回什么、各自副作用”；累积的 `?.` 是信号——它替代了“字段是否应存在”的决定。`deepseek-harness/docs/defensive-patterns/general.md:48-70@687f282e`
- **一个值只表达一个事实**：未知、空集合/空串、真正缺失是三种事实，用三种表示（判别联合/显式枚举），不要用一个 `undefined`/`null` 全包。`deepseek-harness/docs/defensive-patterns/general.md:71-86@687f282e`
- **在提交点发布状态**：通知和派生状态只在操作成功后发出/更新；cache、prompt、UI echo、replay、query 都从一个权威源派生。`deepseek-harness/packages/AGENTS.md:17-17@687f282e`

**步骤**
1. 为公共结果画“独立事实表”（成功/失败/取消/超时/信号/未知）。
2. 在边界归一化内部表示；类型与 JSDoc 写清两侧行为。
3. 若调用者需要区间语义，显式命名区间；不要把它塞进共享 `running` 标志。
4. 用状态机/显式调用点替代 timing 技巧；在提交点之后才发布。
5. 为每个“可选/未知/空”写测试，证明调用者能区分。

**完成信号**：调用者仅凭公共 API 能说出失败来源和状态；没有嵌套条件才可读的事实；没有依赖微任务顺序的正确性；判别联合覆盖三种“无值”。

**失败处理**：若无法在边界归一化，缩小公共 API 或拆出独立结果类型；不要加 fallback 把未知吞成空。

**例外**：测试超时预算用于等待失败，不是 timing 正确性；纯为节奏的用户可见延迟不属于该规则。`deepseek-harness/docs/defensive-patterns/general.md:25-47@687f282e`

**迁移裁剪**：把“正交结果/显式状态”映射到目标语言的结果类型或错误分类；保留判定句“调用者能否独立命名每个事实”。没有异步 API 的项目可以先应用可选参数与一值一事实部分；一旦引入异步取消/超时/信号，必须补齐相应的独立结果与 quiescence 证据，不能把“当前无异步”当成永久豁免。

**证据与限制**：主要是评审保证；可用契约测试补充。公共契约测试通过不证明所有调用者都正确使用。

来源：deepseek-harness/docs/defensive-patterns/general.md:7-12@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:13-18@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:19-24@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:25-47@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:48-70@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:71-86@687f282e 来源：deepseek-harness/packages/AGENTS.md:17-17@687f282e

<a id="engineering-ownership-teardown"></a>
## 7. 共享状态所有权、单一生命周期控制与静默拆卸（engineering-ownership-teardown）

**触发**：引入共享缓存、单例、全局 current/active 选择、模块级 handle；实现取消/关闭/进程退出；多个异步阶段共享 readiness/disposal 状态；provider 与 consumer 的清理顺序。

**角色与前置**：状态 owner 必须是命名 service/instance；生命周期 owner 明确谁等待谁；评审者按 P0 规则追踪 disposer 身份。

**【源仓义务】**
- **共享状态有 owner**：挂在 service 或 instance 上，owner 是有生命周期命名的对象；模块级 cache、singleton、global `WeakMap`、`Symbol.for`/`globalThis`/`window.__X__` 都是隐藏 owner，且活得比 teardown 久。`deepseek-harness/docs/defensive-patterns/general.md:104-123@687f282e`、`deepseek-harness/packages/AGENTS.md:13-13@687f282e`
- **拒绝新的 active/current 单例**：全局唯一选中状态是代码库不做的设计陈述；同一数据的多个视图各自持有引用或 key。确实每 service 唯一的概念用 service/instance 字段 + `inject`，不用模块级字段。`deepseek-harness/docs/defensive-patterns/general.md:87-103@687f282e`
- **一个异步操作一个生命周期控制器/事务**：readiness、cancellation、disposal、reservation、sentinel 若需要独立 owner/结算点就拆；否则折叠，同时保留 rollback、callback containment、quiescence。`deepseek-harness/packages/AGENTS.md:9-9@687f282e`
- **Dispose 必须达到 quiescence，而不只是请求**：kill/abort 后 await 子进程退出；可选通知可以早停，但完成/最终持久化所需的资源和 listener 必须活到消费者结算。`deepseek-harness/docs/defensive-patterns/general.md:192-197@687f282e`
- **回调异常在 dispatcher 内隔离**：捕获并报告每个 listener 的异常，不让 dispatch promise reject 或饿死后续 listener；listener 的 owner 仍要按错误处理规则处理它改动的状态。`deepseek-harness/docs/defensive-patterns/general.md:198-211@687f282e`
- **清理依赖必须活到消费者完成**：当前 Cordis fiber unload 并发启动 sibling disposers；service withdrawal 在自己的 disposer 里 await 依赖 fiber，但 sibling 资源可能已经开始关闭。需要显式所有权和 awaited 顺序：停止新 admission → 结算已接收消费者 → drain/release 资源。`deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:37-60@687f282e`
- **Provider 发布的推荐顺序**：function plugin + 一个 `ctx.effect(function*(){...})`；先获取资源与完成 listener 并 yield 精确 disposer，最后 `yield ctx.provide(name, service)`；若需 admission gate，最后 yield 其清理，使 disposal 先停止新 admission。`deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:45-60@687f282e`
- **生命周期 disposer 是能力，不是观察者权利**：`ctx.agents.create`/`resume` 返回 `AgentHandle = { agent, dispose(): Promise<void> }`；持有裸 `Agent` 的注册表观察者不能拆卸它。调用方 fiber 与注册的 factory provider 是结构共有人：调用方卸载执行结构化所有权，provider 卸载必须停掉所有依赖其 scoped 表面的旧实例；所有路径到同一个 memoized teardown（停 loop → await 退出与 idle flush → detach agent → detach session → unwind scope）。public id 在其精确注册表项 detach 后可复用。`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:10-24@687f282e`
- **Teardown 顺序是耐久性的一部分**：把 session 生命周期折叠进 agent 的单个 composite Cordis effect；fiber 卸载会并发 dispose sibling effects（`Promise.all`），若拆成 sibling 会把“移除 session store 的 append publication hooks”和 loop 的 closing `session/flush` 竞态，丢掉 closing `turn/end`。单 effect 内的 disposer 走有序 LIFO：先停 loop 并 `await agent.done`，再 detach session，因此 handle `dispose()` 与 fiber 卸载都能捕获最后一次 flush。`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:24-24@687f282e`
- **后台任务的 owner token 放在能力边界**：`ShellExecRequest.owner?: string` 在解析后的 `ShellExecSpec` 中变成 required-but-nullable `owner: string | undefined`（忘记传是可见的 `undefined`，不是静默缺字段）；executor 用 `ownerOf(id)` 暴露 owner，access policy（token 比较）留在 Consumer `tool-bash`，capability 只保留不透明 token。session/agent id 在 live agent 中唯一，`SessionStore.enter()` 拒绝重复 live id；HMR reload 不会让旧后台任务被别的 session 读取或杀死。`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:28-41@687f282e`
- **归档说明不是当前权威**：上述 Note 已于 2026-09-04 归档；它解释已实现行为与顺序，但当前契约仍以 `docs/subsystems/core.md`、`packages/core/agent` 的类型和测试为准。迁移时保留“capability disposer + 结构共有人 + LIFO + quiescence”的判定，不要照搬归档文件的时态。`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:3-6@687f282e`

**步骤**
1. 给每个共享值命名 owner（service/instance/keyed record），删除模块级 handle。
2. 画异步操作的状态机：readiness/cancel/dispose/reservation/sentinel；若多个 owner 能独立结算则拆，否则折叠。
3. 写 cleanup 依赖图：谁在完成前需要哪个 listener/service/writer；用组合 effect 或显式 await 保证顺序。
4. 在失败路径也测试：cleanup 错误不能跳过 abort/settlement/resource release。
5. 用受控 promise 构造“消费者最后使用依赖时开始 provider disposal”的回归。

**完成信号**：能指出每个共享值的 owner；没有模块级单例；dispose 后达到静默；回调异常不破坏后续 listener；清理依赖在消费者结算前可用。

**失败处理**：若无法证明顺序，先停止新 admission，再收敛到显式 enclosing owner；不要靠“注册顺序”或“加 inject”假装同步。

**例外**：不可变标量常量、纯冻结表、无状态函数、显式 scoped owner 内分配的对象不属于单例问题。排除缺失 inject、仅可能但不可达的晚调用、有意抑制可选通知。`deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:25-30@687f282e； deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:57-57@687f282e`

**迁移裁剪**：非 Cordis 运行时用“容器/作用域 + Closeable + 显式 await”实现；保留 P0 判定“是否有活副作用在 dispose 后残留”和“cleanup 依赖是否早于消费者完成”。没有 HMR 的项目仍应保留 teardown 回归。

**证据与限制**：HMR 测试和受控 promise 回归是证据；静态搜索只能发现候选，不能证明安全。源仓自己也说 Cordis 的 workaround 不是完整 enclosing-owner 修复。

来源：deepseek-harness/docs/defensive-patterns/general.md:87-103@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:104-123@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:192-197@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:198-211@687f282e 来源：deepseek-harness/packages/AGENTS.md:9-9@687f282e 来源：deepseek-harness/packages/AGENTS.md:13-13@687f282e 来源：deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:25-60@687f282e 来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:1-51@687f282e

<a id="engineering-error-handling"></a>
## 8. 错误处理：类型化失败、所有权与可见报告（engineering-error-handling）

**触发**：设计/评审失败、恢复、重试、后台任务、用户可见错误报告、空 `catch`。

**角色与前置**：API owner 在文档中定义失败类型、处理/报告 owner、containment 与保证；实现者不得只记日志就声称恢复。

**【源仓义务】**
- 预期失败需要声明类型、稳定判别值、与处理相关的细节；复用包内错误约定，保留 cause，机器身份与展示文本分离；绝不通过解析 message 路由。意外缺陷（如 `assertNever`）可以是普通 `Error`，但 containment 不能把它变成成功。`deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:10-12@687f282e`
- 对每个失败定义处理/报告 owner、containment 和保证：有效不变量、缺失/部分/已提交/未知副作用、清理责任。后台工作同样适用。`deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:14-18@687f282e`
- 捕获只限制异常传播，不修复已发生的 mutation。只有受影响状态的 owner 能建立安全继续；否则停止依赖工作、丢弃无效状态/实例或升级。日志不是恢复；重试需要安全重复、取消和显式 owner；有限操作需要预算，持续监督需要生命周期 owner 和可观察降级。`deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:16-18@687f282e`
- 最终报告需要可读摘要、受影响操作、安全下一步；有应用 locale 时通过其 locale 机制本地化；用户可见文本不含敏感内部细节。未知/不可信状态必须通过 UI 或默认开启的可访问日志可见，报告影响、不确定性、系统处置和安全下一步；持久无效状态需要持久可见。没有保证时不得声称成功、回滚或安全重试。报告失败需要独立 fallback。`deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:20-26@687f282e`
- 空 `catch` 必须命名错误和原因，`try` 只含一条语句。`deepseek-harness/AGENTS.md:149-150@687f282e`
- dispatcher 必须隔离 listener 异常；listener owner 仍要处理被修改状态。`deepseek-harness/docs/defensive-patterns/general.md:198-211@687f282e`

**步骤**
1. 定义错误类型/判别值和细节字段；写清可重试性、取消、幂等性。
2. 标出处理 owner 与报告 owner；说明失败后哪些状态已提交/部分/未知。
3. 选择 catch/recover/stop；若不能建立安全继续，停止依赖工作并丢弃无效状态。
4. 写用户/日志报告，含摘要、操作、安全下一步和未知性。
5. 用“验证结果状态与可见结果”的测试，不只断言异常被捕获。

**完成信号**：没有 message 解析路由；失败后状态可命名；用户看到可行动报告；日志不是唯一恢复；空 catch 有理由。

**失败处理**：若无法保证回滚/重试，明确报告“未知/不可安全重试”；不要用 fallback 把失败变成成功。

**例外**：`assertNever` 等意外缺陷可保持普通 Error；非 Error throw 只在测试中允许。`deepseek-harness/.oxlintrc.json:220-225@687f282e`

**迁移裁剪**：映射到目标语言的 Result/Exception 分类和日志/UI 通道；保留“owner + 状态保证 + 可见性”三要素。没有 UI 的库至少提供结构化错误和调用者可见的失败语义。

**证据与限制**：评审是主要保证；测试可验证状态与报告。仅“有错误类型”不等于处理正确。

来源：deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:10-26@687f282e 来源：deepseek-harness/AGENTS.md:149-150@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:198-211@687f282e 来源：deepseek-harness/.oxlintrc.json:220-225@687f282e

<a id="engineering-config-tunables"></a>
## 9. 配置化而非硬编码可调项（engineering-config-tunables）

**触发**：插件里出现部署相关常量、`DEFAULT_*`、测试 hook、超时/并发/路径/端点选择；新增配置字段。

**角色与前置**：插件作者声明 `Config` schema；部署者通过 `cordis.yml` 改；评审者区分“部署可变”与“协议/安全不变量”。

**【源仓义务】**
- 插件中不得硬编码可调项：部署可变选择必须是经校验的 `Config` 字段，可从 `cordis.yml` 修改；`DEFAULT_*` 常量或测试 hook 不是配置化。协议常量、外部规范、安全不变量保持固定。`deepseek-harness/AGENTS.md:142-142@687f282e`
- 显式优于隐式：包边界的 defaulting 是拥有实现里的显式 `resolve(request): Spec` 步骤，不是 `run()` 里隐藏的 `?? default`；`dsh-shell` 的 request/spec split 是模板。`deepseek-harness/AGENTS.md:141-141@687f282e`
- 误配置要响亮失败：自包含时在 load 失败，否则在最早期可解析点失败；绝不静默跳过缺失 referent。`deepseek-harness/AGENTS.md:143-143@687f282e`
- 公共选择需要证据：配置化不能为不支持默认值、公共操作集、格式或引入外部概念背书；用当前 Consumer 证据或相关先例，否则要求显式值或推迟。`deepseek-harness/packages/AGENTS.md:12-12@687f282e`
- Function plugin 的 `Config` 同时以 `interface` 和 Schemastery schema 值导出（Loader 四件套之一）。`deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e`
- 凭据不走通用 `Config` schema：真实 adapter/demos 从环境或 repo-root 的 gitignored `.env` 读取 `DEEPSEEK_API_KEY` 与可选 `DEEPSEEK_BASE_URL`（省略时用公共 API）；绝不提交真实凭据；没有 key 时真实 API e2e 自跳过，key policy 由 Testing 拥有。`deepseek-harness/AGENTS.md:125-130@687f282e`、`deepseek-harness/docs/development.md:122-132@687f282e`

**步骤**
1. 列出部署可变项；为每项建 schema 字段、默认策略和校验错误。
2. 把默认解析集中到 `resolve(request): Spec`，让 `run()` 只执行已解析 spec。
3. 协议/安全常量加注释说明为何不可配置。
4. 写“缺失/非法/未知 referent”失败测试，确认在最早点响亮失败。
5. 更新配置目录/文档（若目标有生成目录）。

**完成信号**：没有 `DEFAULT_*` 冒充配置；请求到 spec 的默认步骤可命名；错误配置有明确诊断；配置目录与 schema 一致。

**失败处理**：若默认值依赖环境，显式建模为配置层并在启动时校验；不要用 `??` 吞掉缺失。

**例外**：协议常量、外部规范、安全不变量不可配置；测试 hook 不是配置。凭据是环境/秘密输入，不是通用 Config 默认可调项；没有 key 的真实 API e2e 自跳过，不能把缺少凭据误报为通过。

**迁移裁剪**：没有 Schemastery 时用目标 schema 库或显式 validator；保留“interface + runtime schema”双导出。若项目没有配置文件，仍保留 `resolve` 步骤和 fail-loud。

**证据与限制**：配置目录/评测可自动检查 schema 文档；没有门禁时靠评审。配置字段存在不证明默认值有证据。

来源：deepseek-harness/AGENTS.md:141-143@687f282e 来源：deepseek-harness/packages/AGENTS.md:12-12@687f282e 来源：deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e 来源：deepseek-harness/AGENTS.md:125-130@687f282e 来源：deepseek-harness/docs/development.md:122-132@687f282e

<a id="engineering-loader-composition-validation"></a>
## 10. Loader/组合元数据与预设平面校验（engineering-loader-composition-validation）

**触发**：编辑 `cordis.yml`/`cordis.patch.yml`/profile/bundle/preset；新增具名插件行；新增测试 Loader fixture；修改 `!!js` 表达式。

**角色与前置**：组合 owner 保证每个具名插件能从拥有者 manifest 解析；preset owner 保证 host/preset 平面不重复；评审者检查表达式的可插值位置。

**【源仓义务】**
- 语法是 `!!js`，**绝不用 `!js`**。Loader 只在 entry `config`（声明 inject 激活后、该插件 context）和 `disabled`（每次 mount、loader context）插值；其他 entry 元数据保持字面量，条件组合还用overlay，不能将表达式塞进不求值字段。`deepseek-harness/AGENTS.md:127@687f282e`、`deepseek-harness/scripts/verify-cordis-config.ts:1-12@687f282e`、`deepseek-harness/docs/cordis-primer.md:37-39@687f282e`
- `disabled` 字段本身允许 `!!js` 表达式且必须可解析（parse-only）；嵌套在 `disabled` 之下的表达式不会求值，必须保持字面量。`deepseek-harness/scripts/verify-cordis-config.ts:517-578@687f282e`
- 具名插件必须从拥有 manifest 解析：shipped/test overlay 从 CLI application manifest；package-owned fixture 从该包 manifest；bundle patch 行从 bundle 自己 manifest；fixture 模块的 bare import 也要声明。`deepseek-harness/scripts/verify-cordis-config.ts:240-412@687f282e`
- 每个配置中指向本地 workspace 包的 specifier 必须通过 `tsconfig.base.json` 的 `paths` 解析到 `.ts`/`.tsx` 源文件；解析到 `lib`/`.d.ts` 说明依赖了构建产物，clean checkout 会失败。`deepseek-harness/scripts/verify-cordis-config.ts:413-448@687f282e`
- 每个 preset 行只属于一个平面：host composition 与 per-session preset 不得同时激活同一 row id（否则 host singleton 注册两次或 isolate provider 遮蔽 host）；shipped Web 表面是 host patch + 每 preset 一个 patch 文件。`deepseek-harness/scripts/verify-cordis-config.ts:139-180@687f282e`
- `packages/client` 包导出 `./client` 必须同时声明 `dsh.client`，否则浏览器半永不服务且无错误；只检查该组，Host 包的 `./client` 是 typed wire face。`deepseek-harness/scripts/verify-cordis-config.ts:106-136@687f282e`
- 组合层顺序：profile 的有序 bundles → 其 `cordis.patch.yml` → home patch → `--patch` overlay；patch 按 id 替换整段 config 或插入新行；preset patch 在 `config.plugins` 内做同样操作。`deepseek-harness/docs/architecture.md:13-40@687f282e`

**HMR 重载路径（Loader 的运行时补充）**
- 启用/禁用 HMR 是组合配置，不是代码分支：base 在 launcher 提供 `profileContext` 时以 `root: []` 启用；没有 profileContext 的 host 保持该 entry disabled；headless/SDK/ACP 在 YAML 禁用，后续 profile patch 可重新启用；禁用或省略意味着改动在重启后生效。要监听源码模块，在 profile patch 里配置 `root`；`root: []` 只保留显式 config watch，`awaitWriteFinish` 默认 2 秒，关闭会漏掉快速连续编辑。`deepseek-harness/packages/boot/hmr/README.md:12-12@687f282e`、`deepseek-harness/packages/boot/hmr/README.md:27-27@687f282e`、`deepseek-harness/packages/boot/hmr/README.md:39-49@687f282e`
- 一条队列串行化模块替换、Include 刷新、profile 配置变更；包安装/移除在队列外；`runExclusive()` 串行化配置变更与 Loader 更新并拒绝嵌套事务；HMR 不获取 package writer lock；manifest 通知只在有序 `dsh.profile.bundles` 列表变化时重载；Plugin Manager 的直接操作不等文件事件。`deepseek-harness/packages/boot/hmr/README.md:59-59@687f282e`
- `reconcileProfile()` 由 HMR 的 profile watch 与 Plugin Manager 共享，调用方必须持有 `runExclusive()`；Config Editor 经 app-boot recompose 而不替换模块；app-boot 在缓存或运行中 entry 变化前准备并 preflight 新 generation。`deepseek-harness/packages/boot/hmr/README.md:63-63@687f282e`
- app-boot 拥有 profile 解析与 patch 优先级；HMR 只读 launcher 的 data-only `profileContext`，启动时注册 profile manifest 与两个 user patch watch，等应用 ready 后再处理变更；disposal 关闭 watcher 并取消等待启动的 reload；配置 watcher 在活动事务 context 之外启动，后续通知才能进入队列。`deepseek-harness/packages/boot/hmr/README.md:61-61@687f282e`
- 替换语义：Loader 在 generation 启动 entry 时才 import 当前文件，所以 disabled/removed/incompatible rows 不会执行；替换失败会停掉旧插件并报 `failed`，后续 recomposition 再试；失败替换不恢复旧版本（Known Limitations）。兼容性检查只在 startup、profile recomposition、preset mounting 运行，Loader import 本身不检查；profile 外的 row（preset row、`ctx.loader.create()`）会用替换后的代码重启而不检查。HMR 不重启进程；module replacement 依赖 Node loader internals；仅 `package.json` 变更不被检测；动态 `import()` 的 stale 模块在下一次调用时求值新文件；浏览器 Client module graph 有独立的加载机制；packed worker 只能配置 recomposition，代码替换需重启。`deepseek-harness/packages/boot/hmr/README.md:67-83@687f282e`、`deepseek-harness/packages/boot/hmr/README.md:104-123@687f282e`
- 注册必须可被 HMR 安全撤销：每个贡献都是 `ctx.effect`，dispose fiber 后必须观察到移除；这是 registry contribution 的强制测试。`deepseek-harness/packages/AGENTS.md:19-19@687f282e`、`deepseek-harness/docs/cookbook/extension-cookbook.md:132-132@687f282e`

**步骤**
1. 为每个 entry 检查 `!!js` 只在 `config` 和 `disabled`；其他元数据保持静态字面量。
2. 解析每个具名插件到正确 manifest；为本地包补 `paths` 源映射。
3. 对每个 preset 行做平面归属检查；重复 id 要么删除，要么显式 disable 一个平面。
4. 检查 client 包的 `./client` 与 `dsh.client` 一致。
5. 运行组合校验门禁；把失败诊断定位到 manifest/行/字段。
6. 在 profile patch 中显式决定 HMR 是启用、仅配置监听还是禁用；需要源码监听时配置 `root`，不要依赖“省略即热重载”。
7. 把每个注册写成可撤销的 `ctx.effect`；用 dispose fiber 的测试证明贡献被移除；对 reload 失败、`restart-required`、不支持的替换路径写明处理与证据。

**完成信号**：所有组合文件通过；没有“本地能 boot、clean checkout 失败”的源映射；没有跨平面重复行；client half 声明一致；HMR enabled/root 有明确决定；dispose 测试通过；不支持热替换的路径已被记录为重启或阻塞，而不是默认为可用。

**失败处理**：缺 manifest 依赖补 manifest，不改门禁；表达式放错位置就移动到 `config` 或删除；preset 重复就把行移到正确平面；reload 失败时保留旧实例/报告 `failed` 并让后续 recomposition 重试，不要把失败伪装成成功重启。

**例外**：`disabled` 自身表达式是唯一允许插值的元数据字段。普通插件 config 数据不被解释为新的 Loader entry list（只递归已知 group/preset/include 结构）。`deepseek-harness/scripts/verify-default-product-isolation.ts:140-220@687f282e`

**迁移裁剪**：目标不是 Cordis 时，映射为“组合文件 schema + 表达式允许位置 + 依赖解析 + 平面归属 + 重载/重启语义”。没有 profile/preset 概念时保留单一组合入口和平面归属，不要删掉依赖解析或静态元数据检查；没有 HMR 设施时把它列为前置条件或阻塞，保留“重启后配置/模块刷新可验证”的路径，并记录替代验证与再激活触发。不得因为目标没有 HMR 就把“注册可撤销”降级为可选。

**证据与限制**：`verify-cordis-config` 是自动门禁，覆盖元数据、解析、fixture、源平面、preset 平面、client half；它不执行组合后的运行时行为（由测试/启动 smoke 负责）。HMR 的源码监听、queue、替换失败与兼容性检查依赖 Node loader internals 和测试；README 自述仅 `package.json` 变更不检测、动态 `import()` 的 stale 模块、浏览器 Client graph 独立、packed worker 代码替换需重启等限制；dispose 测试只证明被覆盖的贡献路径。README 还有一处需按阶段解读的张力：实现段说替换失败会移除部分激活并恢复旧模块/插件实现（77），Known Limitations 说 import/start 失败时旧版本不恢复（113）；迁移时不要把“失败自动回滚”当保证，必须用失败替换测试记录旧代码是否仍可运行。`deepseek-harness/packages/boot/hmr/README.md:77@687f282e`、`deepseek-harness/packages/boot/hmr/README.md:113@687f282e`

来源：deepseek-harness/scripts/verify-cordis-config.ts:1-12@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.ts:106-136@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.ts:139-180@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.ts:240-412@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.ts:413-448@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.ts:517-578@687f282e 来源：deepseek-harness/docs/cordis-primer.md:37-39@687f282e 来源：deepseek-harness/docs/architecture.md:13-40@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:12-27@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:39-49@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:59-83@687f282e 来源：deepseek-harness/packages/boot/hmr/README.md:104-123@687f282e 来源：deepseek-harness/scripts/verify-default-product-isolation.ts:140-220@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.spec.ts:49-155@687f282e 来源：deepseek-harness/packages/bundle/web-app/presets/standard.patch.yml:21-26@687f282e

<a id="engineering-application-launch"></a>
## 11. 唯一应用启动通道（engineering-application-launch）

**触发**：新增应用、CLI、demo、package `bin`、root script、SDK argv 入口、可执行 fixture。

**角色与前置**：应用 owner 使用命名 `dsh` profile；评审者检查是否有绕过 profile 的 Node 应用路径；构建/测试工具必须显式分类。

**【源仓义务】**
- 只有 `dsh` profile 启动受支持的 Node 应用；package bin、demo、公共 SDK argv 逃逸都被禁止。shipped profiles 为 `web`、`headless`、`sdk`、`sdk-minimal`、`acp`，用 `dsh --profile <name>` 或 `dsh <name>` 选择；`plugin` 是管理命令，同名 profile 需 `--profile plugin`。`deepseek-harness/AGENTS.md:13-13@687f282e`、`deepseek-harness/docs/architecture.md:41-47@687f282e`
- 自定义插件组合仍是 profile + 有序 patch 文件，不是另一个 executable 或 inline application tree；`sdk-minimal` 是仓库拥有的 standalone bundle，仍走同一 launcher。`deepseek-harness/docs/architecture.md:41-47@687f282e`
- vendored CLI、build-only/test-only executable、直接 in-process mount、私有 browser WebWorker preview 不是 Harness application launcher。`verify-application-entrypoints` 把每个 package bin、可执行源、root demo、`start:web`/`dev:web` 放进显式分类，并拒绝绕过 `dsh` 的 Node 应用路径。`deepseek-harness/scripts/verify-application-entrypoints.ts:1-12@687f282e`
- package `bin` 只允许 `apps/cli` 的 `dsh` 和 WebWorker packer；任何带 shebang 的源必须出现在显式分类表（supported launcher/build-only/test-only/private packaging）；root `demo:*` 必须有分类，`start:web` 直接引用 `apps/cli/src/bin.ts`，`dev:web` wrapper 也必须引用它且不得直接启动 package entry。`deepseek-harness/scripts/verify-application-entrypoints.ts:21-89@687f282e； deepseek-harness/scripts/verify-application-entrypoints.ts:102-174@687f282e`

**步骤**
1. 新应用先建 profile/bundle，不建新 executable；选择或新增 shipped profile。
2. 若必须有可执行文件，把它加入显式分类并说明是 build/test/packaging，非产品入口。
3. root launcher script 直接或经 wrapper 引用 `apps/cli/src/bin.ts`；不得引用 `packages/.../src|lib/...` 作为应用启动。
4. 运行 `verify-application-entrypoints`；为新增分类补负向测试。

**完成信号**：`package bin`/shebang/root scripts 全部分类；没有绕过 profile 的 Node 应用；`--dump-config` 可打印实际插件树。

**失败处理**：若新入口确实需要，先改架构/启动策略并获得 owner 确认；不要把分类表当橡皮图章。

**例外**：build-only/test-only/packaging 可执行文件允许，但必须有显式 allowlist 条目和理由。`deepseek-harness/scripts/verify-application-entrypoints.ts:36-58@687f282e`

**迁移裁剪**：目标没有 profile 概念时，保留“单一受支持启动器 + 所有其他可执行文件显式分类”的效果；把 `dsh` 替换为目标应用入口。

**证据与限制**：门禁是自动的，负向测试覆盖新增 bin/shebang/root script。它不证明 profile 内部组合正确（由组合/隔离/测试门禁负责）。

来源：deepseek-harness/AGENTS.md:13-13@687f282e 来源：deepseek-harness/docs/architecture.md:41-47@687f282e 来源：deepseek-harness/scripts/verify-application-entrypoints.ts:1-12@687f282e 来源：deepseek-harness/scripts/verify-application-entrypoints.ts:21-89@687f282e 来源：deepseek-harness/scripts/verify-application-entrypoints.ts:102-174@687f282e 来源：deepseek-harness/scripts/verify-application-entrypoints.ts:175-203@687f282e

<a id="engineering-plugin-export-forms"></a>
## 12. 插件导出形态：四件套 vs 服务默认导出（engineering-plugin-export-forms）

**触发**：新增/修改插件 `src/index.ts`；把 helper 暴露给测试；为 `/client` 加导出；使用 default export。

**角色与前置**：插件作者选择两种形态之一；评审者检查 Loader 的 `unwrapExports` 行为；测试作者用同包相对导入而非扩大公共 API。

**【源仓义务】**
- **Function plugin** 命名导出 `name`、`inject`、`Config`、`apply`：`name`/`inject`/`apply` 小写，`Config` 大写且同时是 `interface` 和 Schemastery schema 值；不得再有 default export。**Service plugin** 默认导出 service class，由 Loader 加载；在四件套旁加 default 会让 Loader 丢弃 function plugin 的 namespace。`deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e`、`deepseek-harness/packages/AGENTS.md:5-5@687f282e`
- Host entry 除四件套外，只可导出其他包需要 extend/throw 的 Service Definition class 和 error type；绝不导出 test-convenience value。`deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e`
- `/client` entry 更严格：只导出 cordis 加载需要的值（`apply`/`inject`/`Config`），以及组件 type-only 消费的 store factory 返回类型；实现组件、helper、常量、store handle 保持内部。新增值导出需要用户签字，而不是“有消费者”即可。`deepseek-harness/packages/client/AGENTS.md:34-40@687f282e`
- 同包测试直接相对导入 `../src/...`（或 `./src/*` subpath），不要为测试扩大公共 API；fixture 不得用相对路径进入另一个包的 `src`（绕过 exports map 和包边界检查）。`deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e`、`deepseek-harness/packages/client/AGENTS.md:34-40@687f282e`
- **事故证据**：`export default apply` 让 Cordis `unwrapExports` 取到裸函数，丢掉 `inject`/`name`/`Config`，插件在无注入的 fiber 中运行并崩溃；178 个单测和 100% 覆盖率未发现，因为测试手工 `ctx.plugin({name,inject,apply})` 绕过了 Loader。`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:27-55@687f282e； deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:89-99@687f282e`
- `verify-export-jsdoc` 把 `Config`/`inject`/`name`/`reusable`/`apply` 视为插件协议槽，允许其免于普通导出 JSDoc 规则；这也是形态的一部分。`deepseek-harness/scripts/verify-export-jsdoc.ts:16-21@687f282e； deepseek-harness/scripts/verify-export-jsdoc.ts:278-313@687f282e`

**步骤**
1. 选定形态；function plugin 只写四件套，service plugin 只 default export。
2. 检查 `src/index.ts` 无第五个值导出、无 default + 四件套混用。
3. `/client` 只保留加载必需值和类型；测试改相对导入。
4. 加真实 Loader 组合测试：通过 `cordis.yml`/profile 启动，断言 `inject` 生效；对无 inject 的 bundle 插件加 `expect('default' in mod).toBe(false)` 和 `unwrapExports` round-trip（见 Testing 域）。
5. 为回归证明：临时加回 default export 应使测试变红。

**完成信号**：Loader 加载路径测试通过；入口无多余值；测试不靠公共 API；`default` 不存在于 function plugin。

**失败处理**：若测试需要内部 helper，改测试导入路径；若 Loader 加载失败，检查 `unwrapExports` 与 namespace，而不是加 fallback。

**例外**：Host entry 的 Service Definition class/error type 是预期导出；内部模块/helper/hook 仍可导出值。`deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e`

**迁移裁剪**：非 Cordis Loader 也要明确“插件的模块形态与加载器解包规则”；把“四件套/默认导出”映射为目标框架的注册契约，但保留“不要混用两种形态”和“测试不扩大公共 API”。

**证据与限制**：真实 Loader 测试是必要证据；仅 typecheck/单测不覆盖加载路径。`verify-export-jsdoc` 只覆盖文档，不覆盖形态。

来源：deepseek-harness/docs/defensive-patterns/package-surface.md:7-43@687f282e 来源：deepseek-harness/packages/AGENTS.md:5-5@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:34-40@687f282e 来源：deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:27-55@687f282e 来源：deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:89-99@687f282e 来源：deepseek-harness/scripts/verify-export-jsdoc.ts:16-21@687f282e 来源：deepseek-harness/scripts/verify-export-jsdoc.ts:278-305@687f282e

<a id="engineering-optional-service-access"></a>
## 13. 可选服务用 `ctx.get(name)`（engineering-optional-service-access）

**触发**：插件读取一个不在 `inject` 中的服务；实现可降级/可选后端；跨 fiber 调用 service 方法；怀疑 shadow/traceable proxy。

**角色与前置**：插件作者区分硬依赖（`inject`）与可选探测（`ctx.get`）；评审者检查属性代理是否被用于未声明服务。

**【源仓义务】**
- 可选服务用 `ctx.get(name)`；`ctx.<name>` 只保留给已声明 injection。属性代理对拓扑敏感，strict `ctx.get` 读全局 service store。`deepseek-harness/packages/AGENTS.md:6-6@687f282e`
- Cordis 服务访问经 context proxy：从 foreign fiber 获得的 traceable proxy 会把 `this` 重绑到 shadow，属性读取从 shadow 的 fiber 开始“仅祖先”walk；sibling 分支的服务走到 root 就 throw。`ctx.get(name)` 用全局 isolate-keyed store，保持 active-state 检查，拓扑无关。`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:56-88@687f282e`
- 教程层面：`inject` 是硬要求；可活在没有该能力时，跳过 `inject` 并在使用点 probe（`ctx.get('greeter')`，可能是 `undefined`）。`deepseek-harness/docs/cordis-tutorial/03-services.md:56-65@687f282e`
- 事故：`AgentLoop.resume` 通过 `this.ctx.sessionPersistence` 读未声明服务，经 shadow 的祖先 walk 失败；修为 `this.ctx.get('sessionPersistence')`。手工 flat mount 测试因顶层 `!runtime` bypass 而漏掉。`deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:56-99@687f282e`

**步骤**
1. 列出插件读取的每个服务；硬依赖进 `inject`，可选探测用 `ctx.get`。
2. 对可选服务写“缺失时”的行为与报告；不要假设存在。
3. 在真实 Loader/fiber 拓扑下测试，不只顶层手工 mount。
4. 若必须跨 shadow 调用，验证 `ctx.get` 的 active/disposal 语义。

**完成信号**：没有未声明服务的属性读取；缺失后端有显式降级/失败；真实拓扑测试通过。

**失败处理**：若属性代理抛 “without inject”，先判断是硬依赖漏声明还是可选读取；前者补 `inject`，后者改 `ctx.get`，不要用 try/catch 吞。

**例外**：已声明 injection 的服务继续用 `ctx.<name>`；不要把所有读取都改成 `ctx.get` 而丢失依赖等待。

**迁移裁剪**：非 Cordis 框架映射为“声明的依赖注入 vs 容器探测”；保留“可选能力不得伪装成硬依赖，也不得用拓扑敏感代理”的判定。

**证据与限制**：事故和教程是强证据；真实 Loader 测试是验证。静态代码搜索无法证明 fiber 拓扑。

来源：deepseek-harness/packages/AGENTS.md:6-6@687f282e 来源：deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:56-88@687f282e 来源：deepseek-harness/docs/postmortem/0001-acp-default-export-drops-inject.md:89-99@687f282e 来源：deepseek-harness/docs/cordis-tutorial/03-services.md:56-65@687f282e

<a id="engineering-typed-events"></a>
## 14. 类型化事件、分派模式与 waterfall 契约（engineering-typed-events）

**触发**：新增事件、修改 payload、实现 listener、选择 emit/waterfall/parallel/serial/bail、生成事件目录。

**角色与前置**：Service owner 用 declaration merging 声明事件；listener 作者遵守 `next()`；评审者检查分派模式与 JSDoc。

**【源仓义务】**
- 类型化事件用 declaration merging 和可合并扩展的 map；事件 JSDoc 必须有 `@mode`，payload 参数有 `@param`；公共 service 方法记录参数和非 void 返回。`deepseek-harness/AGENTS.md:134-134@687f282e`
- 分派模式是事件公共契约的一部分：`emit` 不 await、按注册顺序观察、无返回；`waterfall` 不 await、有返回；`parallel` await、并行；`serial` await、按顺序且有返回；`bail` 不 await、按顺序直到一个 listener bail 并有返回。新事件用 `@mode` 让生成目录核对声明；运行时分派点仍需测试证明。`deepseek-harness/docs/cordis-primer.md:12-12@687f282e； deepseek-harness/docs/cordis-primer.md:15-27@687f282e`
- 目录 freshness 是自动门禁：`deepseek-harness/package.json:163-163@687f282e` 的 `verify-cordis-catalog` 运行 `deepseek-harness/scripts/gen-cordis-catalog.ts --check`。生成器头声明投影强制 event mode、JSDoc 参数/返回完整性和签名类型链接覆盖；`deepseek-harness/scripts/gen-cordis-catalog.ts:1119-1170@687f282e` 对每个 service/event scope 做双向 fail-closed 分区检查；`deepseek-harness/scripts/gen-cordis-catalog.ts:1280-1291@687f282e` 对全部 generated artifact 做字节 freshness 失败。生成 region 同时更新双语 pair 与 `.i18n.yaml`，但仅当 region 外无变化（`deepseek-harness/scripts/gen-cordis-catalog.ts:1-18@687f282e`）。
- waterfall 是 around-middleware：listener 收到 `(...args, next)`；调用 `next()` 委托可能被包装的结果，不调用就短路；值通过 `next()` 返回传播；合作式 listener 通常改共享请求/决策对象再委托；只有必须早于普通注册时才用 `prepend: true`。`deepseek-harness/docs/cordis-primer.md:29-35@687f282e`
- 单决策事件短路是设计：拥有决策的 policy listener 可不调用 `next()`；只注解/观察的 listener 必须委托。`deepseek-harness/docs/cordis-primer.md:29-35@687f282e`
- `agent/pre-step`、`agent/request`、`llm/stream`、三个 `tools/*` 是 waterfall，listener 必须 `next()`；`agent/turn-stopping` 是 serial 且没有 `next()`。`deepseek-harness/docs/architecture.md:106-106@687f282e`

**步骤**
1. 在拥有包里用 map→union 声明事件与 payload；写 `@mode` 和 `@param`。
2. 选择分派语义；在事件目录/代码中保持声明与调用点一致。
3. listener 只注解就 `next()`；拥有决策才短路；需要先运行用 `prepend: true` 并说明。
4. 为顺序、短路、异常隔离写测试；生成目录 freshness 门禁。

**完成信号**：事件目录与分派点一致；waterfall listener 不丢 `next()`；payload 类型由声明合并扩展；短路有明确 owner。

**失败处理**：若 listener 静默短路，检查是否漏 `next()`；若是策略决定，文档化 owner 和决策语义。

**例外**：`agent/turn-stopping` 是 serial，不使用 `next()`；只观察的 listener 在 serial 中按顺序执行。

**迁移裁剪**：事件框架不同则映射“声明合并/map→union/分派模式”；保留“模式是公共契约 + around-middleware 必须委托”的规则。没有生成目录时，用等价的、可失败的测试/类型检查替代 freshness；若没有等价检查，把它列为前置条件或阻塞，并记录缺口与再激活触发（例如引入生成器或事件目录）。

**证据与限制**：生成目录门禁可自动核对 event mode、JSDoc 完整性、类型链接、分区覆盖与字节 freshness；它不核对运行时分派点，顺序/短路仍需测试。仅类型/目录正确不证明 waterfall 语义正确。

来源：deepseek-harness/AGENTS.md:134-134@687f282e 来源：deepseek-harness/docs/cordis-primer.md:12-12@687f282e 来源：deepseek-harness/docs/cordis-primer.md:15-27@687f282e 来源：deepseek-harness/docs/cordis-primer.md:29-35@687f282e 来源：deepseek-harness/docs/architecture.md:106-106@687f282e 来源：deepseek-harness/docs/architecture.md:67-77@687f282e 来源：deepseek-harness/package.json:163-163@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1-18@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1119-1170@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1188-1259@687f282e 来源：deepseek-harness/scripts/gen-cordis-catalog.ts:1280-1291@687f282e

<a id="engineering-typescript-strictness"></a>
## 15. TypeScript 严格编译与类型感知 lint（engineering-typescript-strictness）

**触发**：新增包/文件、修改类型、处理 `any`/非空断言/浮空 promise、调整 tsconfig/lint。

**角色与前置**：包作者继承共享 compilerOptions；评审者检查每个 `any` 是否有窄抑制理由；CI 负责全量。

**【源仓义务】**
- 全仓 `strict: true`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`、`noFallthroughCasesInSwitch`、`noUnusedLocals`、`noUnusedParameters`、`composite`/`incremental`。`deepseek-harness/tsconfig.base.json:5-26@687f282e`
- 每个剩余 `any` 解释为何无法收窄。`deepseek-harness/AGENTS.md:173-173@687f282e`
- Oxlint 类型感知规则为 error：`no-explicit-any`（有意 any 需窄抑制和理由）、`no-floating-promises`（agent loop 最高价值 bug 类）、`no-unsafe-*`、`no-non-null-assertion`、`no-unnecessary-condition`、`only-throw-error`、`require-await`、`switch-exhaustiveness-check` 等。`deepseek-harness/.oxlintrc.json:69-146@687f282e； deepseek-harness/.oxlintrc.json:160-182@687f282e`
- 测试文件的放宽是显式的：非空断言、unnecessary-condition、only-throw-error、require-await、restrict-template-expressions 在测试 glob 下关闭并带理由；不允许把测试放宽扩散到生产。`deepseek-harness/.oxlintrc.json:200-229@687f282e`
- 包级 tsconfig 继承共享 base，只做局部覆盖（`rootDir: src`、`outDir: lib/types`、workspace references）；`src/types.ts` 只含类型，无运行时代码。`deepseek-harness/packages/AGENTS.md:24-25@687f282e`

**步骤**
1. 从共享 base 继承；每包只设 `rootDir: src`、`outDir: lib/types`、references 和必要 face 覆盖。
2. 新增 `any` 时写窄抑制注释和理由；优先用 typed value/validation 替代。
3. 修复浮空 promise、非空断言、unsafe 调用，不要全局关规则。
4. 测试放宽只放在测试 glob，保持生产严格。
5. 运行 `typecheck` 和 `lint`；保留诊断输出。

**完成信号**：生产无未解释 `any`；类型感知规则无例外扩散；`src/types.ts` 无运行时；包 tsconfig 只做局部覆盖。

**失败处理**：若规则误报，收窄抑制到单行并写理由；不要关闭整类规则。若类型无法收窄，回到边界 validation。

**例外**：测试 glob 的放宽是源仓显式例外；合并扩展的 empty object type 被关闭（`no-empty-object-type` off）。`deepseek-harness/.oxlintrc.json:83-83@687f282e； deepseek-harness/.oxlintrc.json:200-229@687f282e`

**迁移裁剪**：目标不是 TS 时映射到等价静态检查（严格 null、未使用、穷尽 switch、浮空异步）；保留“严格默认 + 窄抑制 + 测试例外隔离”。

**证据与限制**：tsc/lint 是自动证据；它们不证明运行时行为。`any` 理由只能评审。

来源：deepseek-harness/tsconfig.base.json:5-26@687f282e 来源：deepseek-harness/.oxlintrc.json:69-146@687f282e 来源：deepseek-harness/.oxlintrc.json:160-182@687f282e 来源：deepseek-harness/.oxlintrc.json:200-229@687f282e 来源：deepseek-harness/AGENTS.md:173-173@687f282e 来源：deepseek-harness/packages/AGENTS.md:24-25@687f282e 来源：deepseek-harness/.oxlintrc.json:253-358@687f282e

<a id="engineering-no-unknown-assertions"></a>
## 16. 禁止新增 `as unknown` 断言与精确基线（engineering-no-unknown-assertions）

**触发**：写 `as unknown`/`<unknown>`、处理 parser 结果、修类型错误、搬迁/重命名断言、编辑 baseline。

**角色与前置**：改动者只能用 typed value 或 validation 替代；评审者拒绝新增文件/指纹/计数；baseline 只可删/减。

**【源仓义务】**
- 新的一手 JS/TS（含 tests、fixtures、benchmarks、scripts）禁止直接断言到 `unknown`，覆盖 `as unknown` 和 `<unknown>`、带括号目标、含直接 `unknown` 成员的 union。`unknown` 声明仍合法（如 `const value: unknown = JSON.parse(text)`），但必须进入声明的 parser 再使用。`deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:13-22@687f282e`
- 现有断言用精确 baseline：仓库相对路径 + 断言语法 token 的 SHA-256 + 出现次数。AST 命令相对于当前可信 baseline 拒绝未列/超额断言；baseline 编辑本身只可删/减，新增文件、指纹或次数由**评审者**拒绝。源实现不比较 base ref/历史 baseline，不能宣称手动扩张会被这条命令自动识别。文件级 allowance 或宽松总量预算不能授权替代债务。`deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:13-22@687f282e`、`deepseek-harness/scripts/verify-no-unknown-casts.ts:138-185@687f282e`
- `--prune` 只在没有新违规时机械删除/降低；没有任何命令可添加新例外。`deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:13-22@687f282e`
- 检查器用 TypeScript AST 扫描 tracked + 非忽略 untracked source；排除 vendor 和冻结 archived notes；忽略注释/字符串/`unknown` 声明。`deepseek-harness/scripts/verify-no-unknown-casts.ts:1-25@687f282e； deepseek-harness/scripts/verify-no-unknown-casts.ts:76-134@687f282e`
- 语法指纹对 token 变化敏感：标识符重命名、引号、尾逗号、括号变化都会使旧条目失效；仅空白/注释变化不影响。移除断言后必须 prune，否则红。`deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:31-35@687f282e`

**步骤**
1. 遇到类型不匹配，先判断是边界输入还是内部类型错误。
2. 边界输入用 `unknown` 声明 + parser/validator，输出 typed value。
3. 内部类型错误修类型或调用点，不用双重断言。
4. 若必须保留遗留断言，确保它在 baseline 精确条目内；不要新增。
5. 删除断言后运行 `--prune`，让 baseline 同步收缩。

**完成信号**：`verify-no-unknown-casts` 绿；baseline 无新增指纹/计数；没有用 `any`/helper 隐藏转换。

**失败处理**：新断言被拒时修类型或使用已有 parser。旧指纹因重命名/移动等失效时，必须先消除或重构该断言，再 prune 旧条目；不得把“更新基线”理解为新增替代指纹。基线被手动扩张时，即使命令对当前文件自洽，评审仍必须拒绝。`deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:13-35@687f282e`、`deepseek-harness/scripts/verify-no-unknown-casts.ts:138-185@687f282e`

**例外**：vendor、archived notes、`unknown` 声明、`unknown[]`/`Promise<unknown>` 等容器类型、JS JSDoc `@type` 不在语法规则内。`deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:13-35@687f282e`

**迁移边界**：有一手 JS/TS 时，自动 AST 检查、精确既有基线与只减不增的变更评审都必须保留。其他语言应先判断是否存在对应的强制断言语法及结构化分析器；不适用时保留知识，并以引入 JS/TS 或对应断言机制为再激活条件。需要该自动保证却尚无分析器时记为未实现/阻塞，不能用文本搜索或临时人工审计冒充等价门禁；人工审计只能是另列的补充证据。

**证据与限制**：源码有自动比较和只减不增的 `--prune` 实现，本次没有执行。命令通过只说明当前可信 baseline 下没有未列出的直接 `unknown` 断言；不认证 baseline 历史，不证明总体类型安全，也不解析 alias/intersection。`any`/隐藏转换 helper 的违规需要另行评审，不在这条 AST 检查的自动保证内。`deepseek-harness/scripts/verify-no-unknown-casts.ts:138-185@687f282e`

来源：deepseek-harness/.agents/notes/implemented/process/2026-09-19-no-unknown-casts.md:13-35@687f282e 来源：deepseek-harness/scripts/verify-no-unknown-casts.ts:1-25@687f282e 来源：deepseek-harness/scripts/verify-no-unknown-casts.ts:76-134@687f282e 来源：deepseek-harness/scripts/verify-no-unknown-casts.ts:138-185@687f282e 来源：deepseek-harness/AGENTS.md:146-146@687f282e

<a id="engineering-discriminant-brands"></a>
## 17. 判别标签、穷尽 switch 与品牌化 id（engineering-discriminant-brands）

**触发**：新增可辨识联合、扩展事件/内容/结果、switch 一个 tag、跨边界传 id、导出 map。

**角色与前置**：类型 owner 定义 map 与 brand；插件通过 declaration merging 扩展；评审者检查 switch 是否穷尽、id 是否裸 `string`。

**【源仓义务】**
- switch 判别标签；封闭联合以 `assertNever` 结尾（新增变体在每个消费者处编译失败）；可合并扩展的联合走文档化 default。`deepseek-harness/AGENTS.md:135-135@687f282e`
- 大多数可扩展 sum type 用 `…Map → derived-union`：interface 以判别 tag 为 key，union 由 `keyof` 派生，插件用 declaration merging 加变体，不改拥有包。五个 canonical map：`ContentBlockMap`、`MessageSourceMap`、`FinishReasonMap`、`TurnEndReasonMap`、`SessionEventMap`。`deepseek-harness/docs/subsystems/core.md:358-395@687f282e`
- 跨包 id 品牌化：结构上是 string，但类型上不可互换（`SessionId` 不能传给 `ToolCallId`）；用 `brandString<T>()` 或 owner 定义的 validating factory；比较/日志/JSON 仍是普通 string。`deepseek-harness/docs/subsystems/core.md:397-408@687f282e`
- `Branded<B>` 原语与无状态构造在 `dsh-brand`，无 harness capability 依赖。`deepseek-harness/docs/subsystems/core.md:401-408@687f282e`
- 流式 `ContentBlock` 是封闭判别联合：`switch` over `type` 以 `assertNever` 结尾，新增变体破坏所有必须处理的消费者。`deepseek-harness/docs/subsystems/llm-streaming.md:169-169@687f282e`
- Oxlint `switch-exhaustiveness-check` 为 error，`considerDefaultExhaustiveForUnions: true`。`deepseek-harness/.oxlintrc.json:177-182@687f282e`

**步骤**
1. 新增变体先加到拥有 map，用 declaration merging，不改 union 文件。
2. 消费者 switch tag；封闭联合 default 用 `assertNever`；可扩展联合写文档化 default。
3. 跨边界 id 定义 `type XId = Branded<'XId'>`，构造集中在 brand 函数/factory。
4. 避免裸 string 参数；在签名、事件 payload、持久字段统一 brand。
5. 用编译器/测试验证新增变体使消费者失败。

**完成信号**：map→union 扩展无需改拥有包；封闭 switch 穷尽；跨包 id 不混用；无裸 string 表示不透明 id。

**失败处理**：若新增变体没让消费者编译失败，检查是否用了 default 吞掉；若是可扩展联合，确认 default 有文档和 owner。

**例外**：可合并扩展的联合有意走 default；`merge-extensible maps` 的 empty object type 允许。`deepseek-harness/AGENTS.md:135-135@687f282e`、`deepseek-harness/.oxlintrc.json:83-83@687f282e`

**迁移裁剪**：目标语言用 sealed union/enum + exhaustive match 映射；品牌化可用 nominal type/opaque type。保留“扩展不改中心类型 + 封闭联合穷尽 + 不透明 id 不裸传”。

**证据与限制**：编译器和 lint 是自动证据；运行时分派正确性还需测试。品牌只在编译期，运行时无保护。

来源：deepseek-harness/AGENTS.md:135-135@687f282e 来源：deepseek-harness/docs/subsystems/core.md:358-408@687f282e 来源：deepseek-harness/docs/subsystems/llm-streaming.md:169-169@687f282e 来源：deepseek-harness/.oxlintrc.json:177-182@687f282e

<a id="engineering-typed-boundaries"></a>
## 18. 类型信任与验证边界（engineering-typed-boundaries）

**触发**：决定是否加运行时校验、fallback、敌意输入测试；处理 JSON/YAML/模型输出/文件/worker/进程/网络。

**角色与前置**：边界 owner 在进入系统处校验；内部同进程调用信任静态类型；评审者拒绝为满足静态接口而加的无用防御。

**【源仓义务】**
- 在**有类型的同进程边界**信任 TypeScript：不要仅为静态接口要求的值添加运行时校验、fallback 行为或敌意输入测试。`deepseek-harness/AGENTS.md:145-145@687f282e`
- 在这些边界校验：parser/config、排队输入、模型/工具 JSON、durable/file、worker、进程、wire。`deepseek-harness/AGENTS.md:145-145@687f282e`
- 公共契约两侧归一化（内部 throw/terminal chunk → 公共只暴露归一化形式），让消费者仅凭公共 API 命名失败来源。`deepseek-harness/docs/defensive-patterns/general.md:13-18@687f282e`
- 决策要在执行它的操作里强制：schema omission、prompt filtering、facade、wrapper、listener order 在直接/替代调用者可绕过时都不是强制；通过 executor 测试 denial。`deepseek-harness/packages/AGENTS.md:16-16@687f282e`
- 对完整结果应用边界：byte/token/item/time 限制要在完整 emitted/retained value（含 wrapper/metadata）已知处执行；测试极小/精确限制、超大单 chunk、多字节 byte 限制。`deepseek-harness/packages/AGENTS.md:18-18@687f282e`

**步骤**
1. 标记每个数据入口是否跨信任边界。
2. 边界输入声明为 `unknown`/raw，交给 parser/validator；输出 typed value。
3. 内部接口不重复校验；若需要校验，说明它防的是哪个边界失败。
4. 把限制放在能看到完整结果的位置，测试边界值。
5. 拒绝“只在 facade 里判断”的强制；把判断放进真正执行操作的地方。

**完成信号**：每个校验都能对应一个边界；内部调用无防御性 fallback；denial 通过 executor 测试；限制覆盖完整结果。

**失败处理**：若不确定输入是否跨边界，先画数据流；不要用 `??` 把未知变默认。若安全策略在 wrapper，移到执行器。

**例外**：可信的进程内、无外部输入代码不受“必须校验”约束；但仍受类型与契约约束。

**迁移裁剪**：映射到目标语言的 decoder/schema 边界；保留“边界列表”和“内部信任”。没有动态输入的库可以只保留边界分类，但要记录“为什么当前没有 parser/IO/wire”以及分类清单；一旦引入动态输入，恢复完整边界验证与拒绝样例，不能把“当前无输入”当成永久豁免。

**证据与限制**：评审为主；边界测试可补充。类型系统不覆盖运行时输入，运行时校验也不证明业务正确。

来源：deepseek-harness/AGENTS.md:145-145@687f282e 来源：deepseek-harness/docs/defensive-patterns/general.md:13-18@687f282e 来源：deepseek-harness/packages/AGENTS.md:16-16@687f282e 来源：deepseek-harness/packages/AGENTS.md:18-18@687f282e

<a id="engineering-performance-evidence"></a>
## 19. 性能改动的测量证据（engineering-performance-evidence）

**触发**：改动可能移动热路径成本；声称性能中性/优化；新增 benchmark；内存/延迟回归。

**角色与前置**：改动者测量改动路径 before/after；benchmarks owner 拥有场景；domain owner 批准架构性性能代价。

**【源仓义务】**
- 可能移动热路径成本的改动，要在同一环境、同一输入下测量所改代码 before/after，并报告数字与条件。三个指标：运行时、峰值内存、稳态内存；粒度是改动路径，不是整机分数。“总体没变慢”不是证据；别处优化不能抵消此处回归。`deepseek-harness/docs/defensive-patterns/general.md:149-159@687f282e`
- 基线是**不带测量 hook 的同一路径**（通常是 native implementation），不是“旧实现 + 同样 hook”；两边都带 hook 会稀释差异直到消失。`deepseek-harness/docs/defensive-patterns/general.md:149-159@687f282e`
- 测量由 `benchmarks/` 拥有，一个用户路径一个目录；场景是入口；包内诊断用 `.perf.ts` 后缀，不加入 `test:bench`。CI 门禁 `check:ci:bench`（job `node 24 / benchmarks`）发布缩放报告；该门禁是**警报，不是通过**：回归要本地重跑 owning scenario 并 profile。保留内存声明用 `test:bench:memory 4g|8g`，在无 swap cgroup 中按不变预算重跑。`deepseek-harness/docs/defensive-patterns/general.md:149-172@687f282e`
- 边界：不触运行路径的改动（注释、文档、纯测试）不需要测量；生产性能代码不是可随意删除的 benchmark instrumentation（`performance.now()`/`scheduler.yield()` 是生产 decode/encode 调度的一部分）。架构改动确实有性能代价时，说明测得代价和理由，由 domain owner 批准。`deepseek-harness/docs/defensive-patterns/general.md:149-172@687f282e`
- benchmarks 规则：按测量用户路径组织；Host 用 `*.bench.ts`，Client 用 `*.bench.client.ts`；合成的固定输入，不用录制 Session/用户材料/网络；进程级 wall-clock/retained-memory 在 fresh children + private `mkdtemp`；每个预算端点先 `recordTimings`，声明测量什么/影响哪个用户场景；预算由评审常量决定，环境变量不得覆盖。`deepseek-harness/benchmarks/AGENTS.md:1-18@687f282e`

**步骤**
1. 识别被改动的热路径与用户场景。
2. 用不带 hook 的基线测 before；用同一环境/输入测 after。
3. 报告 runtime、peak RSS、steady RSS，附命令、环境、输入大小。
4. 若回归显著，profile 分段定位；架构性代价交 domain owner 批准。
5. 保留/更新 owning scenario；不要把包内诊断塞进 `test:bench`。

**完成信号**：PR 含可重建的数字和条件；基线无测量 hook；回归被定位或批准；预算不被环境变量覆盖。

**失败处理**：CI benchmark 绿不等于性能中性；若报告绿但怀疑回归，重跑 owning scenario。若无法测，明确“未测量”而不是宣称中性。

**例外**：不触运行路径的改动免测；故意性能代码不删。

**迁移裁剪**：目标没有 benchmark 设施时，保留“before/after + 同环境/输入 + 三指标 + 基线无 hook”的方法；可以用临时脚本，但不要把它伪装成持续门禁。缺少测量设施是前置条件或阻塞，不是自动豁免；临时脚本必须记录环境、输入、指标和未覆盖路径，发布前仍需可复现的测量证据。

**证据与限制**：测量是经验证据，不是证明；CI 警报不是通过。源仓明确说 benchmark 不建模所有路径。

来源：deepseek-harness/docs/defensive-patterns/general.md:149-172@687f282e 来源：deepseek-harness/benchmarks/AGENTS.md:1-18@687f282e

<a id="engineering-migration-behavior"></a>
## 20. 迁移保持可观察行为（engineering-migration-behavior）

**触发**：迁移、包拆分、移动代码、重写、导出路径变化、迁移中发现缺陷。

**角色与前置**：迁移 owner 逐项比较可观察行为；domain owner 批准不可避免的差异；评审者分离移动与语义变化。

**【源仓义务】**
- 迁移/包拆分保持外部可观察行为相等：错误码、诊断、数据流顺序、UI 时序逐项比较。优先移动代码而不是删除重写；重写适合语义本来就要变的代码，并列出差异。包/导出路径变化是载体变化，不是行为变化；行为变化是独立改动。`deepseek-harness/docs/defensive-patterns/general.md:174-180@687f282e`
- 无法完全相等时，改动要说明不同项及各自如何验证，并由 domain owner 批准。迁移中发现的缺陷作为独立改动修复，不折进移动。`deepseek-harness/docs/defensive-patterns/general.md:174-180@687f282e`
- 跨域边界：涉及 public API 或已提交 Session 持久格式时，迁移规则不等于版本策略。公开 API 仍是 pre-stable，必须同一改动更新所有 consumer；外部可感知 breaking change 立即记入 upgrade guide；已提交的 Session generation 不得移动、覆盖或删除，前代不意味着 fallback/downgrade；SQLite 使用单调 `SCHEMA_VERSION`。这些由 Release 域展开，本域只保留触发条件。`deepseek-harness/AGENTS.md:7-11@687f282e`

**步骤**
1. 列出可观察面：错误码、诊断文本、数据流顺序、UI 时序、公共导出。
2. 优先 `git mv`/移动；保持路径和错误码。
3. 若必须重写，逐项列出差异与验证。
4. 迁移中发现的缺陷单独 PR/改动。
5. 用 before/after 测试或快照证明相等。

**完成信号**：diff 主要是移动；错误码/顺序/时序逐项有证据；差异有 owner 批准；缺陷不混入。

**失败处理**：若行为变化不可避免，拆成独立改动并写迁移说明；不要用“迁移需要”自我批准。

**例外**：语义本来就要变的重写可列差异；包/导出路径变化本身不算行为变化。`deepseek-harness/docs/defensive-patterns/general.md:174-190@687f282e`

**迁移裁剪**：任何语言/仓库都适用；把“可观察行为”映射到目标公共 API/错误/时序。没有快照设施时用契约/集成测试替代，但替代必须覆盖公共 API、错误与时序；若做不到，把它列为前置条件或阻塞，并记录缺口与再激活触发（引入快照或回放设施）。

**证据与限制**：评审为主；测试/快照补充。移动 diff 小不证明行为相等。

来源：deepseek-harness/docs/defensive-patterns/general.md:174-190@687f282e 来源：deepseek-harness/AGENTS.md:7-11@687f282e

<a id="engineering-untrusted-subprocess"></a>
## 21. 不受信边界：子进程环境、临时路径与凭据重定向（engineering-untrusted-subprocess）

**触发**：spawn 命令、写临时/溢出文件、清理 link-shaped path；配置凭据承载的 provider HTTP 客户端或 redirect 策略。

**角色与前置**：执行器 owner 清洗 env、使用私有目录和独占打开；清理代码区分 link 与真实目录；provider owner 在 HTTP 客户端层关闭自动 redirect，安全评审确认覆盖所有 credentialed provider。

**【源仓义务】**
- spawned command 得到清洗过的 env（丢弃 `*KEY*`/`*SECRET*`/`*TOKEN*`/`*PASSWORD*`），防止 harness 凭据泄漏到 output、`env`、spill 文件。`deepseek-harness/docs/defensive-patterns/general.md:212-217@687f282e`
- 临时/溢出文件用私有（0700）目录、随机名、独占 owner-only 打开（`'wx'`、`0o600`）；可预测、world-readable 路径会招来 symlink race 和泄露。`deepseek-harness/docs/defensive-patterns/general.md:212-217@687f282e`
- 可能是 symlink 或 Windows junction 的路径，用 `lstatSync().isSymbolicLink()` 然后 `unlinkSync`：unlink 只删链接、拒绝真实目录，不会跟随到目标。Windows `rmSync(link)` 对 junction 抛 `ERR_FS_EISDIR`；递归删除可能穿过链接到目标。递归 `rmSync` 只用于已知真实目录。`deepseek-harness/docs/defensive-patterns/general.md:218-222@687f282e`
- 凭据承载的 provider 请求必须在 HTTP 客户端层配置为“跟随任何 redirect 之前失败”。回归必须证明 redirect 目标未被联系，并证明每个 credentialed provider 都 opt-in 该策略。配置的 endpoint 必然收到初始请求；本条防的是凭据/请求数据被自动转发到另一 origin，不是配置 endpoint 自身被攻陷。`deepseek-harness/packages/web/AGENTS.md:1-5@687f282e`
- 测试/进程资源 owner：spec 并发运行，每个 port/path/child process 通过 teardown 拥有；只在单独运行时通过的 spec 是缺陷。`deepseek-harness/packages/AGENTS.md:20-20@687f282e`

**步骤**
1. 列环境变量白名单/黑名单；spawn 前构造清洗 env。
2. 临时目录用 0700 + 随机名；文件用独占创建 + 0600。
3. 删除前 `lstat`；link 用 unlink，真实目录才递归。
4. 为泄漏/符号链接/并发写测试。
5. 为 credentialed provider 关闭自动 redirect，并测试目标 origin 未被联系、所有 provider 都采用该策略。

**完成信号**：子进程无凭据；临时路径不可预测；删除不跟随链接；测试可并发；credentialed 请求不自动跨 origin。

**失败处理**：若必须传凭据，通过受限 fd/环境白名单并说明；不要 `...process.env` 全量继承。

**例外**：可信、进程内、无外部输入的代码不受该规则约束；但它仍受最小权限建议。

**迁移裁剪**：映射到目标平台的安全临时文件 API；Windows 需单独处理 junction。保留判定“路径是否可预测/可替换”和“删除是否跟随链接”。任何带凭据的 HTTP provider 都要在客户端层关闭自动 redirect；若目标 HTTP 栈不能关闭，必须换成能关闭的栈或在请求前显式拒绝，不能只靠“不配置 redirect”的默认值。

**证据与限制**：评审为主；安全测试可补充。未发现泄漏不等于没有竞争；redirect 目标未被联系需要真实 HTTP 回归，不能由配置代码推断。

来源：deepseek-harness/docs/defensive-patterns/general.md:212-222@687f282e 来源：deepseek-harness/packages/AGENTS.md:20-20@687f282e 来源：deepseek-harness/packages/web/AGENTS.md:1-5@687f282e

<a id="engineering-source-artifact-plane"></a>
## 22. 源平面 vs 产物平面（engineering-source-artifact-plane）

**触发**：静态门禁/测试、局部开发、构建、依赖解析、Typert 生成、发布 smoke、clean checkout。

**角色与前置**：门禁作者声明消费源还是构建产物；开发者按 surface 选命令；CI 拥有完整构建。

**【源仓义务】**
- 模块系统契约：全仓 ESM（`"type": "module"`）；跨包 import 用包名，局部相对 import 带 `.ts`；配置子进程用构建后的 `lib/` 在 plain Node 运行，源回归用声明的 launcher；`dsh` source launch 走 `node --import tsx/esm`，其可达模块必须保持 ESM（不得有 CJS-only exports），因为 engines 范围内不能用 Node 原生 TypeScript 模式。`deepseek-harness/AGENTS.md:132-132@687f282e`
- 静态分析与测试通过 base `paths` 把 workspace import 解析到 `src`，必须在 clean tree 通过；消费 built `lib/` 的门禁必须显式声明该依赖。`deepseek-harness/AGENTS.md:147-147@687f282e`、`deepseek-harness/docs/development.md:110-110@687f282e`
- 测试解析只走源码平面：每个 vitest config 指向 `tsconfig.base.json`；裸 workspace import 解析到 `src`，绝不通过 package `exports` 到 built `lib/`——陈旧产物会加载第二个 module singleton。`deepseek-harness/docs/testing.md:43-46@687f282e`
- 构建/检查命令按目的选择：迭代源码用 `build:artifacts`；检查 tests/scripts/benchmarks/website 用最新构建后的 `build:check`；声明 TS 完成前用 `build:check` 或 `build`；完整验证用 `build`；无 Web/Desktop 产物的类型检查用 `typecheck`。`deepseek-harness/docs/development.md:91-103@687f282e`
- `build:artifacts` 按生成依赖顺序：native → Host tsc → Host tsdown（内含 Typert）→ Desktop bundle → Client tsc → Client tsdown → Web。`build:check` 只并发跑 `tsc -p tsconfig.host.json` 与 `tsc -p tsconfig.client.json`，读磁盘上已有声明，不编译 reference；缺产物表现为编译错误。`build` 把两组步骤作为一个调度依赖图。`deepseek-harness/docs/development.md:77-90@687f282e`
- `build`/`build:artifacts` 把 root package version、七位 source commit、Git 本地改动 dirty marker 嵌入客户端产物，并写 gitignored record；release packing 和 built Web tests 拒绝缺失 record 或被后续部分构建改动的产物。`deepseek-harness/docs/development.md:108-108@687f282e`
- Typert 从 Host 类型生成 Host 反射和 Host-for-Client Remote 投影；Client tsdown 不启动 Typert；`generate-typert.ts` 无 bundle 运行同一生成并写 byte-identical 文件；bundle-free pass 只从 source 读 workspace 包，若 Host program 会加载 `lib/` 则失败并命名需补的 import/paths alias。`deepseek-harness/docs/development.md:106-106@687f282e`
- 本地 workspace specifier 必须通过 `paths` 到 `.ts`/`.tsx`；解析到 `lib`/`.d.ts` 是产物回退，clean checkout 会坏。`deepseek-harness/scripts/verify-cordis-config.ts:413-448@687f282e`

**步骤**
1. 给每个门禁标注 plane：source / built-lib / mixed-but-explicit。
2. 源测试只解析 `src`；构建后 smoke 才用 `lib`，并声明需要 `build`。
3. 日常开发用 `build:artifacts`；完成前 `build:check`；发布/完整验证用 `build`。
4. 生成器（Typert/module graph/config catalog）从 source 运行，输出 freshness 检查。
5. 检查 clean checkout：删除 `lib`/`dist`/tsbuildinfo 后跑源门禁。

**完成信号**：clean tree 源门禁通过；产物门禁显式依赖 build；构建 record 绑定版本/commit/dirty；无“本地有陈旧 lib 才过”的门禁。

**失败处理**：若源门禁依赖构建，补 `paths` 或把门禁标为 built-lib；不要用已有 `lib` 掩盖。若 build record 缺失，重跑完整 build。

**例外**：生成的 Host-for-Client Remote 声明是显式例外：公共 `typecheck`/`lint`/`doc-typecheck` 先生成它们；内部 `*:contracts-ready` 假定调度器已依赖 Typert 生成。`deepseek-harness/docs/development.md:110-110@687f282e`

**迁移裁剪**：目标构建系统不同则映射“源码解析优先 + 产物显式消费 + 生成物 freshness + 构建身份记录”。没有生成器的项目可省略 Typert 部分，但必须先确认确实没有生成物/freshness 边界并记录该判断；一旦引入生成器，恢复 source/artifact 分离与 freshness 检查，不能把“当前没有生成器”当成永久豁免。

**证据与限制**：`build:check`/`typecheck`/clean checkout 是自动证据；它们不证明发布包内容（由 hygiene/publint/smoke 负责）。

来源：deepseek-harness/AGENTS.md:132-132@687f282e 来源：deepseek-harness/AGENTS.md:147-147@687f282e 来源：deepseek-harness/docs/development.md:59-110@687f282e 来源：deepseek-harness/docs/testing.md:43-46@687f282e 来源：deepseek-harness/scripts/verify-cordis-config.ts:413-448@687f282e 来源：deepseek-harness/package.json:23-23@687f282e 来源：deepseek-harness/package.json:61-61@687f282e

<a id="engineering-compiler-faces"></a>
## 23. 显式编译面与 Host/Client 聚合隔离（engineering-compiler-faces）

**触发**：新增包、拆分 Host/Client、改 tsconfig、repo-wide `ts.Program` 脚本、Project Reference。

**角色与前置**：包作者把包注册到恰好一个聚合；face owner 维护 leaf configs；脚本作者从 face 聚合 seed，不用 root solution。

**【源仓义务】**
- Host 与 Client 是两个隔离聚合：普通包只在 `tsconfig.host.json` 或 `tsconfig.client.json` 之一；三个共享 leaf（`host/webserver`、`compaction/compaction`、`typert/registry`）被两边引用以 type-check 同一源码。`deepseek-harness/docs/development.md:59-59@687f282e`
- 分成两个聚合的原因：两边都在相同 key 上 declaration-merge cordis `Context`，一个 program 同时看到两种 merge 会报冲突；冲突只在 `ts.Program` 内，模块解析不触发，所以 solution 可引用两个聚合，一个 paths facade 可跨两边。`deepseek-harness/docs/development.md:69-69@687f282e`
- 三条纪律：`tsconfig.base.json` 永不加 `include`/`files`（会泄漏到每个扩展包并收窄 facade 的 match-all）；repo-wide `ts.Program` 脚本显式 seed `tsconfig.host.json` 或 `tsconfig.client.json`，绝不用 root solution；新包只注册到一个聚合，只有六个 split 包带两个 leaf config，共享 leaf 两边注册。`deepseek-harness/docs/development.md:71-75@687f282e`
- 六个 split 包：`api/remotes`、`api/gateway`、`api/session-controller`、`api/workspace-controller`、`client/connection`、`session-query/session-log-export`；split 包根 `tsconfig.json` 只是 solution，两个聚合并直接消费者分别引用 `tsconfig.host.json`/`tsconfig.client.json`。`deepseek-harness/docs/development.md:75-75@687f282e`
- `tsconfig.base.client.json` 提供浏览器 compiler 设置（`jsx: react-jsx`、DOM libs、`types: [client-build-environment]`），由 Client 聚合和每个 `packages/client/*` 扩展。`deepseek-harness/tsconfig.base.client.json:1-12@687f282e`
- `constraints` 门禁遍历可达 Project Reference 图，检查每个引用项目自己的 compiler face：单 config target 从任一边引用都有效；split target 必须引用与遍历起点匹配的 `tsconfig.<face>.json`；从无 face 的 config 进入 split project 失败。`deepseek-harness/scripts/project-reference-faces.ts:1-129@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:649-659@687f282e`
- `faceConfigs`/`TypeScriptProject` 只从 `tsconfig.<face>.json` seed 并递归 references；根 solution 永远不是 program。`deepseek-harness/scripts/ts-project.ts:1-120@687f282e`

**步骤**
1. 判断包属于 Host、Client 还是真 split；普通双入口 Client 插件仍是一个 Client 包，不拆。
2. 在恰好一个聚合 references 里注册；split 包建 solution-only root + 两个 leaf config。
3. 包 tsconfig 继承 base（Client 继承 base.client），设 `rootDir: src`/`outDir: lib/types`，references workspace 依赖。
4. repo-wide 脚本用 `faceConfigs`/`TypeScriptProject` 从 face seed；禁止 flatten root。
5. 运行 `constraints` + `tsc -b`；修复 face mismatch。

**完成信号**：每个包只在一个聚合（除声明共享/split）；base 无 include/files；脚本不 seed root；`constraints` 绿；两个聚合各自可编译。

**失败处理**：若 Context merge 冲突，检查是否把 Host+Client flatten 进一个 program；拆分或改用 face 聚合。若 split target 被错引用，按 face 选择 leaf。

**例外**：六个 split 包和三个共享 leaf 是显式例外；`api/remotes` 的 Host entry 参与 Host Typert graph，Client entry import 生成的 `/remote` 声明。`deepseek-harness/docs/development.md:75-75@687f282e`

**迁移裁剪**：目标没有 declaration merging 冲突时可合并聚合，但保留“显式 face + 一个包一个 face + 脚本不 flatten”的可维护性。若没有 Project References，用等价的模块边界检查；该检查必须能拒绝跨 face 泄漏，否则把它列为前置条件或阻塞，并记录缺口与再激活触发。

**证据与限制**：`constraints`/tsc 是自动证据；它们不证明运行时分包正确（由 build/bundle 检查负责）。

来源：deepseek-harness/tsconfig.base.json:1-29@687f282e 来源：deepseek-harness/tsconfig.client.json:1-30@687f282e 来源：deepseek-harness/tsconfig.base.client.json:1-12@687f282e 来源：deepseek-harness/AGENTS.md:148-148@687f282e 来源：deepseek-harness/docs/development.md:59-75@687f282e 来源：deepseek-harness/scripts/project-reference-faces.ts:1-129@687f282e 来源：deepseek-harness/scripts/ts-project.ts:1-120@687f282e 来源：deepseek-harness/scripts/check-workspace-constraints.ts:649-659@687f282e 来源：deepseek-harness/tsconfig.host.json:220-223@687f282e 来源：deepseek-harness/tsconfig.host.json:533-536@687f282e 来源：deepseek-harness/tsconfig.client.json:47-53@687f282e 来源：deepseek-harness/tsconfig.client.json:65-75@687f282e 来源：deepseek-harness/tsconfig.client.json:155-155@687f282e

<a id="engineering-package-shape-exports"></a>
## 24. 包形态与标准导出键（engineering-package-shape-exports）

**触发**：新增包、改 package.json、加 export subpath、改构建输出、加 `/client`。

**角色与前置**：包作者选择 Host 或 Host+Client 形态；评审者检查是否有第三种形态或手写 external/roster。

**【源仓义务】**
- 新包只有两种形态：Host 包，或 Host+Client 包；两者都是 dynamic plugin package，无第三种、无例外。静态 client 库（`client-store`、`ui-slots`、`ui-primitives`、`ui-dockkit`）和 `packages/util/` 零依赖库是历史封闭集合，新包不得加入。`deepseek-harness/docs/defensive-patterns/package-surface.md:45-73@687f282e`
- 只有真正双面包拆 compiler faces；构建输出到 `lib`；`include`、`external`、roster 列表由扫描 workspace 派生，不手写。`deepseek-harness/docs/defensive-patterns/package-surface.md:45-73@687f282e`
- 包 manifest 不变量（`constraints`）：`private: true`（发布成员例外）、版本匹配 root、`type: module`、`main: lib/index.js`、`types: lib/types/index.d.ts`、`exports["."].types`/`.default` 精确、`@deepseek-ai/cordis` 同时在 peer+dev 且同范围、`files` 精确、`src/types.ts` 只类型。`deepseek-harness/docs/cookbook/adding-a-package.md:7-40@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:420-542@687f282e`
- 包层次严格为 `packages/<group>/<pkg>`；group 目录不得有 package.json；包不得更深嵌套。`deepseek-harness/scripts/check-workspace-constraints.ts:551-570@687f282e`
- `exports` 只用标准键集，每个键仓库级一个含义：`.`、`./package.json`、`./src/*`、`./client`、`./types`、`./typert`、`./remote`、`./locale/*.json`、`./cordis.patch.yml`。集合外的键（`./brand`、`./worker`、`./startup` 等）没有文档化含义，是待评审，不是可复制先例。新增键要先改拥有文档和检查，再落地，并获 domain owner 确认。`deepseek-harness/docs/defensive-patterns/package-surface.md:75-113@687f282e`
- Client 插件包还需 `dsh.client`、`./client` export、`tsconfig.base.client.json`、共享 tsdown preset；新包 checklist 的三个注册面（tsconfig 聚合、`packages/bundle/web-app/cordis.patch.yml`、bundle dependency）缺一会在不同后期点失败。`deepseek-harness/packages/client/AGENTS.md:142-152@687f282e`、`deepseek-harness/docs/cookbook/adding-a-package.md:31-40@687f282e`
- Client 新包 bring-up：`dsh.client` 必须同时有 `./client`；`platform: 'web'`；`immediately: true` 只给 stage-one-prefetch 基础设施；`dsh.client.inject` 只是 informational package edge，不排序 activation；非 baseline `external` 会序列化其动态 supplier；改 bundle 后先重建再 probe live `dsh web`。注册到别的包的 slot 用 `ctx.slots.inject(name, () => ctx.slots.register(...))`，裸 `slots.register` 到未声明 slot 仍是错误；多个注册需要原子回滚时返回 generator。`deepseek-harness/packages/client/AGENTS.md:145-161@687f282e`
- Client 包的 published payload 必须闭合：每个相对 runtime import 和 emitted asset 都要被 `files` 覆盖；仓库 publint pass 检查精确 publication view。`deepseek-harness/packages/client/AGENTS.md:71-71@687f282e`
- `verify-package-meta` 是资源/发布面的自动门禁：扫描 `packages/*/*/package.json`（空语料直接失败），从源 JSON（排除 `node_modules`/`lib`/`tests`）解析 `meta`；locale 资源必须经 exports 解析到源 JSON、以 `en.json` 为 baseline、与英文同目录、被 `files` 覆盖；display manifest/icon 也必须解析到源 JSON 而非 built `lib`；`@deepseek-ai/dsh-*` 的 SVG 必须是 36×36、SVG namespace、仅自包含 geometry、无 script/style/image/foreignObject/text/animation、唯一 id、无 `on*` handler、`href`/`url(...)` 只引用本地 id；嵌套 package 拥有未声明资源，但外层显式 exports 仍要校验。`deepseek-harness/scripts/verify-package-meta.ts:1-285@687f282e`
- `verify-client-packages` 是 Client 包形态自动门禁：每个 client 包必须是 dynamic `dsh.client` 或 `staticLinked` 之一，不能两者都有或都没有；`PLATFORM_MODULES` seeded workspace module 的 owner 必须使用 staticLinked preset；parser-preloaded external 必须有 dynamic `dsh.client` row 和对应 `PARSER_PRELOAD_IDS` row；`dsh.client` 的 external/inject 数组不得为空或重复，external 不得重复 baseline、不得命名自己的 row、feature 包不得请求 runtime external（只共享类型或注入 Cordis service）、必须有生产 runtime import/re-export、supplier 必须存在且无循环；malformed `dsh.client` 对象/数组失败。`deepseek-harness/scripts/verify-client-packages.ts:1-713@687f282e`

**步骤**
1. 选两种形态之一；不要创建静态链接包或第三种 tsconfig。
2. 用标准 manifest 字段和 `files`；让 `include`/`external`/roster 由扫描派生。
3. 只加标准 export 键；需要新键时先改文档/检查并获 owner 确认。
4. 新包加入现有 group；目录严格两层。
5. Client 包补齐三个注册面和 `dsh.client`。

**完成信号**：`constraints`/`verify-client-packages` 绿；manifest 字段精确；无手写派生列表；新增 export 键经过标准键集合评审（该集合没有完整自动 allowlist，不能把 constraints 绿当成键集合已证明）。

**失败处理**：若构建需要手写 external，先修扫描或包形态；不要用局部配置绕过。新增键被拒时改公共 API 或把内部路径留作 internal。

**例外**：已存在的非标准键是待评审遗留，不是新先例；真正需要时按“改文档 + 检查 + owner 确认”处理。`deepseek-harness/docs/defensive-patterns/package-surface.md:75-113@687f282e`

**迁移裁剪**：目标包管理器不同则映射等价 manifest 不变量；保留“两种形态 + 派生列表 + 标准导出键评审”。没有 client/server 分包的项目可省略 `/client`，但不得把“省略 `/client`”外推成“export 键随便加”；没有自动 allowlist 时把键集合评审列为必需证据，并记录缺口与再激活触发（例如引入 manifest schema 检查）。

**证据与限制**：`constraints`/client gate 是自动证据；它们只精确校验根 `exports["."].types`/`.default`、`files` 派生和 `/client` 声明，**不校验完整标准键集合**；`verify-package-meta` 已读全文（`deepseek-harness/scripts/verify-package-meta.ts:1-285@687f282e`），校验 locale/icon/resource export 与 `files`；`verify-client-packages` 已读全文（`deepseek-harness/scripts/verify-client-packages.ts:1-713@687f282e`），校验 client 包形态与 external/supplier 图；两者都不证明运行时 client boot，也不校验完整标准键集合。publint 是通用包 lint。标准键集合目前主要靠评审（源仓明确说计数不写死）；新增键的兼容性仍需消费者测试。

来源：deepseek-harness/docs/defensive-patterns/package-surface.md:45-73@687f282e 来源：deepseek-harness/docs/defensive-patterns/package-surface.md:75-113@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:71-71@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:142-152@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:145-161@687f282e 来源：deepseek-harness/docs/cookbook/adding-a-package.md:7-40@687f282e 来源：deepseek-harness/scripts/verify-package-meta.ts:1-285@687f282e 来源：deepseek-harness/scripts/verify-client-packages.ts:1-713@687f282e 来源：deepseek-harness/scripts/check-workspace-constraints.ts:362-381@687f282e 来源：deepseek-harness/scripts/check-workspace-constraints.ts:420-542@687f282e 来源：deepseek-harness/scripts/check-workspace-constraints.ts:551-570@687f282e

<a id="engineering-dependency-policy"></a>
## 25. 包依赖声明与 workspace 范围策略（engineering-dependency-policy）

**触发**：新增/修改依赖、修 dependency scan、加 Host/Client import、提升包、peer 关系。

**角色与前置**：包作者按 faces 声明；`verify-package-dependencies` 和 policy file 拥有规则；domain owner 批准策略/扫描变更。

**【源仓义务】**
- 内部依赖语法按包族：`@deepseek-ai/dsh` 和 `@deepseek-ai/dsh-*` 用 `workspace:*`，其他内部包用 `workspace:~`；策略上 `workspace:^` 已退役。`verify-package-dependencies` 对 `packages/*/*` 强制该规则；`check-workspace-constraints` 对普通包只要求任意 `workspace:` 前缀，因此不要把前者的覆盖外推到 `apps/*`/`vendor/*` 全部。同一依赖名在每个 workspace 写法一致；策略不匹配是硬失败，但自动门禁的覆盖面有上述差异。`deepseek-harness/docs/defensive-patterns/package-surface.md:148-186@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:32-34@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:600-642@687f282e`
- Harness 包在 `peerDependencies` 和 `devDependencies` 同时声明 `@deepseek-ai/cordis`，范围相同。`deepseek-harness/AGENTS.md:131-131@687f282e`
- `@types/react`/`@types/react-dom` 只在 root `devDependencies`；`verify-package-dependencies` 拒绝 `apps/*`、`packages/*/*`、`vendor/*` 中的声明，但包仍声明自己 import 的 `react`/`react-dom`。`deepseek-harness/scripts/verify-package-dependencies.ts:28-34@687f282e； deepseek-harness/scripts/verify-package-dependencies.ts:853-867@687f282e`
- Host 运行时 import 只有在其精确 specifier + runtime export 出现在 `safeHostDependencyExports` 时才进 `dependencies`；需要共享身份的 export 进 `peerRequiredHostExports`，整条边同时保留在 peer+dev。未分类 export 在 `--fix` 写 manifest 前被拒。`deepseek-harness/packages/client/AGENTS.md:61-73@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:593-655@687f282e`
- Browser/type 关系是 development-only：workspace/第三方 Client import、type-only import、module augmentation、TS references、`dsh.client.inject`、metadata-only peer 只进 `devDependencies`；配置专用条目在 policy 里列。`deepseek-harness/packages/client/AGENTS.md:61-73@687f282e`
- 策略由 `package-dependency-policy.ts` 拥有：`clientFaceInclude`（空）、`clientFaceExclude`（2 个 API controller）、`hostPackages`（`llm`、`session`）、`requiredServicePeers`（terminal-controller→subprocess）、`configurationOnlyDevDependencies`（7 项）、`duplicateSafePackages`（6 个 util/protocol 包）、`safeHostDependencyExports`（6 个精确 export）、`peerRequiredHostExports`（4 个共享身份 export）。`safeHostDependencyExports` 新条目默认禁止，自动化代理不得添加例外；每次新增需显式人工评审并在 PR 描述中设醒目标题。`deepseek-harness/scripts/package-dependency-policy.ts:1-105@687f282e`
- 修红的方式是修 manifest 它命名的 section，不是改扫描或放宽 policy；改扫描/policy 不是普通编辑，需 domain owner 确认并把理由记录在 change 上。`deepseek-harness/docs/defensive-patterns/package-surface.md:115-147@687f282e`
- `vendor/` 是固定上游 SHA 的 source copy，不是普通 workspace 依赖：只按 `vendor/README.md` 的同步流程更新，重新应用或退役已记录的本地修改，并重跑 `pnpm run test && pnpm run build`。具体 vendoring 目录/补丁/升级策略由 Supply 域展开；本域只规定“不要把它当可随手编辑的包”。`deepseek-harness/AGENTS.md:183-185@687f282e`

**步骤**
1. 判断包的 role（client-only/client-host/configured-host）和 import 的 runtime/type 性质。
2. 按 face 放入 dependencies/devDependencies/peer+dev；workspace 范围用族规则。
3. 新增 Host runtime export 前查 policy 分类；未分类则不要用 `--fix` 写。
4. `--fix` 只用于修复 owned relationships；写前校验整批，失败不改任何 manifest。
5. 运行 `verify-package-dependencies` 和 `constraints`。

**完成信号**：扫描绿；同一依赖名/范围一致；peer+dev 成对；root type 包不泄漏；policy 无新增未评审 export。

**失败处理**：诊断命名 manifest/section/dependency/expected range；改 manifest；若需要新策略，单独评审。

**例外**：非 workspace 成员的 same-namespace 包用普通第三方范围（如 `@deepseek-ai/libreoffice-kit`）；`duplicateSafePackages` 的完整运行时 surface 可跨重复安装。`deepseek-harness/docs/defensive-patterns/package-surface.md:148-186@687f282e`

**迁移裁剪**：包管理器不同则映射 workspace 协议/peer 规则；保留“按 face 声明 + policy 拥有例外 + 不改检查器过关”。没有 peer 概念时用共享实例检查或等价的重复安装测试替代；若替代设施也不存在，把它列为前置条件或阻塞，并记录缺口与再激活触发，不能把“没有 peer”写成“无需验证共享身份”。

**证据与限制**：扫描/`--fix` 是自动证据；`--fix` 不证明语义正确。`safeHostDependencyExports` 的新增由精确 roster 测试 + 人工评审阻止（policy 注释要求 PR 醒目标题），不是运行时禁令；不要把它描述成运行时强制。重复安装/共享身份在源仓只有单元测试 + `verify-npm-install-layout` 的合成 registry/metadata 布局断言，没有真实消费者安装 smoke；`scripts/release/verify-packed-install.ts` 是另一条未执行的打包安装检查。迁移时必须分别记录“策略/单元/合成布局/真实安装”的证据等级，不能把前三者当成真实安装已通过。peer 关系仍需要真实重复安装 smoke（Release/Supply 域）。

来源：deepseek-harness/AGENTS.md:131-132@687f282e 来源：deepseek-harness/docs/defensive-patterns/package-surface.md:115-186@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.ts:28-34@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.ts:593-655@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.ts:853-867@687f282e 来源：deepseek-harness/scripts/package-dependency-policy.ts:1-105@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:61-73@687f282e 来源：deepseek-harness/AGENTS.md:183-185@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1-207@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:345-999@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1039-1061@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1135-1211@687f282e 来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1241-1246@687f282e

<a id="engineering-resolve-hook-ban"></a>
## 26. 禁止新增 resolve hook（engineering-resolve-hook-ban）

**触发**：新增 Node loader `resolve` hook、包装已有 hook、为某个 specifier 改解析、修源/产物混合。

**角色与前置**：改动者证明两个前置条件同时成立；domain owner 确认；作者自判“这个 case 特殊”不算确认。

**【源仓义务】**
- 新 `resolve` hook 默认拒绝——是明确禁止，不是“尽量避免”。包括包装已有 hook 且重写同一 specifier 的等价形态。`deepseek-harness/docs/defensive-patterns/package-surface.md:188-225@687f282e`
- 真正需要时两个前置条件同时成立：整体重新审计 resolve 策略（解析、热重载、插件管理职责一起，而不是只补当前 specifier）；domain owner 在落地前确认。`deepseek-harness/docs/defensive-patterns/package-surface.md:188-225@687f282e`
- 唯一解析路径是 `dsh` source launch 注册的 tsx ESM hook；其理由在 source-launch Agent Note。`deepseek-harness/docs/defensive-patterns/package-surface.md:188-225@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:15-23@687f282e`
- 源仓选择 `node --import tsx/esm`：tsx 的 ESM-only hook 同时负责 TypeScript transform 和 tsconfig `paths`；CJS hook 关闭因为 CLI source graph 是 ESM-only。tsx 不检查 importer 是否声明了 runtime dependency，声明完整性由静态门禁承担。`deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:15-23@687f282e`

**步骤**
1. 先问是否能用现有 `paths`/包导出/构建修复；能用则不新增 hook。
2. 若仍需要，写整体解析策略审计（解析、HMR、插件管理）和 owner 确认。
3. 把确认记录链接到 change；只在此后加 hook。
4. 为解析行为加 smoke，并证明没有把 `src` 与 `lib` 混用。

**完成信号**：没有新 hook；或有两个前置条件记录 + owner 确认 + 全链路审计。

**失败处理**：若只是某个 specifier 不解析，补 `paths`/manifest/构建，不加 hook。

**例外**：仅上述两个前置条件同时成立；没有“这个 case 特殊”例外。

**迁移裁剪**：任何运行时都有解析层；保留“默认禁止新增解析分支 + 整体审计 + owner 确认”。若目标用原生解析且没有 hook/loader 分支，规则可以记录为不适用，但必须实际核验运行时的解析入口与扩展点；一旦引入 hook、alias 或虚拟请求，恢复禁令与整体审计，并保留再激活记录。

**证据与限制**：评审为主；没有自动门禁。解析 smoke 可证明现有路径，不证明未来 hook 安全。

来源：deepseek-harness/docs/defensive-patterns/package-surface.md:188-225@687f282e 来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:15-24@687f282e

<a id="engineering-no-top-level-await"></a>
## 27. 包源码禁止模块级 await（engineering-no-top-level-await）

**触发**：包 `src/**/*.ts|tsx` 出现 `await`、`for await`、`await using`；写模块初始化；可执行文件/`bin`。

**角色与前置**：模块作者把异步工作放进被调用的函数（显式 `main()` 并自己处理 rejection）；门禁解析 AST。

**【源仓义务】**
- 包源模块不得在模块作用域使用 `await`、`for await`、`await using`：模块级等待会让每个 importer 的求值等待，把 rejection 变成模块求值失败，且无法降级到 browser-worker image 的同步 CommonJS wrapper。`deepseek-harness/docs/defensive-patterns/package-surface.md:226-231@687f282e`
- 异步工作放进函数里调用，例如显式 `main()` 并自己处理 promise 失败。`deepseek-harness/docs/defensive-patterns/package-surface.md:226-231@687f282e`
- 门禁解析 `packages/*/*/src/**/*.{ts,tsx}`；只按声明排除可执行文件：源码以 `#!` 开头，或该源是包 `bin` 字段命名的 `lib/` 输出的源。`deepseek-harness/scripts/verify-no-top-level-await.ts:1-22@687f282e； deepseek-harness/scripts/verify-no-top-level-await.ts:64-97@687f282e`
- 门禁证明 corpus 完整：空 corpus、无 `.tsx`、漏掉任何含 TS 源但不在 corpus 的包 `src/` 都抛错，防止“扫少了所以通过”。`deepseek-harness/scripts/verify-no-top-level-await.ts:179-233@687f282e`
- 检测覆盖 `await` 表达式、带 `await` 的 `for...of`、`await using`；函数体/参数内的 await 不算模块级；method 的 computed name/decorator 仍在模块级。`deepseek-harness/scripts/verify-no-top-level-await.ts:100-177@687f282e`

**步骤**
1. 把模块初始化异步逻辑移到 `main()`/`start()`；在调用处 catch/report。
2. 可执行文件用 shebang 或 `bin` 声明排除，不要靠路径特判。
3. 运行 `verify-no-top-level-await`；确认 corpus 计数覆盖所有包。
4. 新增包时确保 glob 能覆盖；门禁会因漏包而红。

**完成信号**：门禁绿；corpus 覆盖所有包；没有 `await` 在模块顶层；可执行排除有声明。

**失败处理**：若门禁报空 corpus/漏包，修 glob/包结构，不要缩小扫描；若报违规，移动代码到函数。

**例外**：shebang 源、包 `bin` 命名的构建输出源；仅此两类。`deepseek-harness/scripts/verify-no-top-level-await.ts:64-97@687f282e`

**迁移裁剪**：映射到目标语言的模块求值规则；若语言允许 top-level await 且经验证不影响 importer/打包，可记录为不适用，但必须用 importer/打包证据证明这一点，并保留“异步启动显式化 + 失败处理”。一旦引入异步初始化或打包器对求值顺序敏感，恢复禁令与负向样例，不能只凭语言允许就豁免。

**证据与限制**：门禁自动且负向测试覆盖；它只检查语法位置，不证明初始化逻辑正确。

来源：deepseek-harness/docs/defensive-patterns/package-surface.md:226-231@687f282e 来源：deepseek-harness/scripts/verify-no-top-level-await.ts:1-22@687f282e 来源：deepseek-harness/scripts/verify-no-top-level-await.ts:64-97@687f282e 来源：deepseek-harness/scripts/verify-no-top-level-await.ts:100-177@687f282e 来源：deepseek-harness/scripts/verify-no-top-level-await.ts:179-233@687f282e 来源：deepseek-harness/scripts/verify-no-top-level-await.ts:234-267@687f282e

<a id="engineering-product-classification"></a>
## 28. 非实验包的产品使用或显式分类（engineering-product-classification）

**触发**：新增/移动 `packages/<group>/<pkg>`、包不再被默认组合使用、发布包清理、政策条目陈旧。

**角色与前置**：包 owner 证明产品 runtime 使用或声明受维护角色；政策 owner 维护 `product-package-policy.ts`；评审者拒绝“装了但没用到”的孤儿。

**【源仓义务】**
- 非实验 runtime 包必须有产品使用或显式分类；SDK、build、test、声明基础设施有单独分类。`deepseek-harness/AGENTS.md:79-79@687f282e`、`deepseek-harness/packages/README.md:87-92@687f282e`
- `PRODUCT_PACKAGE_POLICY` 键是仓库相对包目录，值含 `reason` 和 category：`optional`、`sdk`、`build`、`test`、`web-distribution`、`declarations`。`optional` 不得用于 `test-support`；`test` 只用于 `test-support`；`sdk`/`build`/`web-distribution`/`declarations` 有精确路径约束。`deepseek-harness/scripts/product-package-policy.ts:1-50@687f282e`、`deepseek-harness/scripts/verify-product-use.ts:277-304@687f282e`
- `verify-product-use` 从真实产品入口构建 effective runtime 图：读取 `tsconfig.base.json` paths，按源 import 递归；读 shipped profiles 的 bundle 列表、bundle patch、Include（应用后）、preset、Web HTML module entry、Desktop main；把 default reachability 与 optional（`OPTIONAL_BUNDLES`/`ON_DEMAND_BUNDLES`）分开。`deepseek-harness/scripts/verify-product-use.ts:58-249@687f282e`
- 不读 built workspace outputs；若 workspace specifier 不能解析到 source，失败并提示加 `tsconfig.base.json` paths；生成 Remote 贡献只按声明识别，不加载 Host 实现。`deepseek-harness/scripts/verify-product-use.ts:58-249@687f282e`
- 每个非实验包必须满足：default 或 optional 可达，或 policy 有条目；否则失败“no product runtime use; mount it, declare its maintained role, or move it to experimental”。policy 条目若目录缺失、位于 experimental、reason 为空、category 非法、default 使用却仍声明（除 web-distribution）都失败。`deepseek-harness/scripts/verify-product-use.ts:250-275@687f282e`
- 负向测试覆盖（已读测试体，不只标题）：即使 app manifest 安装孤儿也拒绝；type-only import/export 不计数，runtime import/export/await import/require 计数；相对跨包 import 归到一个 source owner；只跟随 reached local modules（含 cycles/worker URLs）；Desktop/Web 入口可达；acp/headless/sdk/sdk-minimal profile 独立组合；disabled Include children/group/preset/nested initial/conditional disabled 表达式都尊重；Include patch 先应用；未匹配/后被替换/disabled 行忽略；只访问启用 preset 的 nested entries；optional shipped/on-demand 选择与 runtime closure 和 default 分开，target 缺失的 optional patch 不计数；生成 Remote metadata 只按声明识别；on-demand catalog 必须有 `dsh.bundle.patch`；缺失 workspace source mapping 被拒而不是查 built exports；bundle 内相对插件按声明位置解析；directory-picker 动态 mount 及其 client face 可达；declaration-only 基础设施/非法 policy category/stale policy 被拒；`web-distribution` 必须 source-reachable；shipped profile corpus 不能被缩窄。`deepseek-harness/scripts/verify-product-use.spec.ts:1-302@687f282e`

**步骤**
1. 新增包先接入真实产品入口（profile/bundle/UI/tool），或明确它是 optional/sdk/build/test/declaration。
2. 在 policy 写 reason；不要用 policy 掩盖“忘记挂载”。
3. 运行 `verify-product-use`；看 diagnostic 的包和修正建议。
4. 移动/删除包时同步删 policy 条目，否则 stale 红。
5. 对 optional 能力验证它只在显式选择后可达。

**完成信号**：每个非实验包 default/optional 可达或有合法分类；policy 无 stale/空 reason；source graph 无缺失 paths；optional 不混入 default。

**失败处理**：孤儿先挂载或移 experimental；不要先加 policy。若 source import 不解析，补 paths，不要让门禁去读 `lib`。

**例外**：`web-distribution` 包可以不在 default 图但仍是产品角色；`optional` 不得用于 test-support。`deepseek-harness/scripts/verify-product-use.ts:277-304@687f282e`

**迁移裁剪**：目标没有 profile 概念时，用“真实入口 + 依赖图 + optional 目录”的等价分析；保留“无使用即分类或移实验”的判定和“分类必须有 reason/当前角色”的义务。小型仓库可以缩小扫描面，但仍必须从真实入口出发并覆盖 default/optional 分离；若没有可分析的入口或运行时，先把“建立入口图”列为前置条件或阻塞，不能把“仓库小”当作免检，也不能只看 manifest 安装关系。

**证据与限制**：门禁自动且负向测试覆盖上述断言；它不执行运行时，不证明 reachable 包真的工作。测试体已确认覆盖 source reachability 与 effective Loader composition 的边界，但不覆盖真实 provider/API、打包产物或用户触发的每一条路径；这些仍需 Testing/Release 证据。

来源：deepseek-harness/AGENTS.md:79-79@687f282e 来源：deepseek-harness/packages/README.md:87-92@687f282e 来源：deepseek-harness/scripts/product-package-policy.ts:1-50@687f282e 来源：deepseek-harness/scripts/verify-product-use.ts:58-249@687f282e 来源：deepseek-harness/scripts/verify-product-use.ts:250-275@687f282e 来源：deepseek-harness/scripts/verify-product-use.ts:277-304@687f282e 来源：deepseek-harness/scripts/verify-product-use.spec.ts:1-302@687f282e

<a id="engineering-experimental-isolation"></a>
## 29. 实验包状态、发布与默认产品隔离（engineering-experimental-isolation）

**触发**：新增/提升 experimental 包、加依赖、加 optional bundle、改默认 profile/Web 入口、发布检查。

**角色与前置**：experimental owner 维护状态与发布策略；release owner 保证默认安装不依赖实验包；Testing/Release 拥有 runtime smoke。

**【源仓义务】**
- **Experimental** 表示完整公共能力仍在评估、不是产品支持承诺；行为/API 可变、能力可撤回；工程、安全、文档、测试、released-data 义务仍适用。包只有在完整公共契约都是 experimental/internal-only 时才放这里；产品包里的 experimental 选项留在产品角色。`deepseek-harness/packages/experimental/README.md:24-34@687f282e`
- **Optional** 是用户显式选择；**Official** 是项目维护并列入 Plugins 页面；两者都不描述成熟度；发布、默认安装、GUI 可见性也不决定成熟度。`deepseek-harness/packages/experimental/README.md:24-34@687f282e`
- Promotion 需要：命名产品角色、文档化公共行为和限制、当前 consumer、release 内容、测试证据；把包移到产品组、应用该组命名规则、同步更新受影响 consumer。`deepseek-harness/packages/experimental/README.md:24-34@687f282e`
- Release 包和 apps 不得在 `dependencies`/`optionalDependencies`/`peerDependencies` 中命名 experimental 包；默认产品隔离还检查传递安装、runtime import、shipped composition。Experimental 包可以依赖 release 包和彼此；测试可用 `devDependencies`；examples 可显式加载。`deepseek-harness/packages/experimental/AGENTS.md:5-9@687f282e`
- 发布 experimental 不提升状态、不加稳定性承诺；命名默认 `@deepseek-ai/dsh-experimental-*`，保留名例外表；`PRIVATE_EXPERIMENTAL_PACKAGE_DIRECTORIES` 中的目录才 `private: true` 并省略 `publishConfig`，其他公共实验包省略 `private` 并设 `publishConfig.access: public`。`deepseek-harness/scripts/experimental-package-policy.ts:1-67@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:362-381@687f282e`
- 默认产品隔离 `verify-default-product-isolation` 跟随 runtime/optional/peer 依赖、解析 workspace/npm alias、按 npm 前缀或目录识别 experimental；检查源 import、installation-owned profile bundle 列表、bundle patch、shipped presets、declared config trees；用生产 patch parser/composer 计算 effective rows 和 patched Include；disabled 行仍检查，普通插件 config 不被当 entry list。`deepseek-harness/scripts/verify-default-product-isolation.ts:1-30@687f282e； deepseek-harness/scripts/verify-default-product-isolation.ts:45-300@687f282e`
- Web 默认源图从实际 HTML module scripts 出发，含 inline modules 和本地 Worker entries；独立 experimental preview 可以在，但默认入口 import 它就失败。构建期检查覆盖两个 browser bundling stage：client preset 拒绝非实验输出中的实验输入，Web graph 检查跟随 Vite 实际输出边（lazy chunks、workers、CSS、assets）。`deepseek-harness/.agents/notes/implemented/process/2026-09-12-default-product-experimental-isolation.md:11-36@687f282e`
- 运行时 smoke 用真实 Web profile/Chromium 读取实际 Loader/fiber/module cache，要求所有交付 entry 处于 active，并用显式 negative control 验证会拒绝实验插件；这些属于 Testing/Release 证据。`deepseek-harness/.agents/notes/implemented/process/2026-09-12-default-product-experimental-isolation.md:11-36@687f282e`
- Optional bundles 是唯一声明例外：`OPTIONAL_BUNDLES` 拥有安装默认关闭的选择；每个 bundle 必须声明 `icon` 和导出 `./locale/*.json` 的 `meta.title`/`meta.description`；必须是 `apps/cli` runtime dependency、声明 `dsh.bundle.patch`、不是 default bundle；隔离检查仍拒绝非实验 bundle 的实验依赖。`deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md:11-30@687f282e`、`deepseek-harness/scripts/verify-default-product-isolation.ts:80-110@687f282e`
- `constraints` 的 `checkExperimentalDependencyIsolation` 对 release 成员和 Python runtime 检查 runtime sections；`@deepseek-ai/dsh` 的 `dependencies` 可保留 `OPTIONAL_BUNDLES` 中的实验 bundle，其他引用失败。`deepseek-harness/scripts/check-workspace-constraints.ts:593-613@687f282e`

**步骤**
1. 判断包完整公共契约是否 experimental/internal-only；若是，放 experimental，按命名策略发布。
2. 保证 release 包/apps 不依赖它（含 alias/传递）；需要用户选择就做 optional bundle（默认关闭、icon/locale、bundle patch、app runtime dependency）。
3. 改变默认 profile/Web 入口时，运行 default-product isolation 的静态/source/composition/build-input 检查。
4. 在真实 Web/CLI smoke 中观察实际 Loader/module cache；用 negative control 证明拒绝。
5. Promotion 时一并移动包、改命名、更新 imports/config、重审公共契约/限制/测试/发布 payload/runtime dependents/owner。

**完成信号**：静态图和真实 runtime 都不含实验依赖；optional bundle 元数据/开关正确；实验包发布但不进默认安装；promotion 有完整证据。

**失败处理**：若默认图出现实验包，先删除/替换依赖或把它降为 optional；不要用 `disabled: true` 逃避检查（disabled 行仍检查）。若 bundle 缺元数据，补 icon/locale/patch，不要改隔离检查。

**例外**：`OPTIONAL_BUNDLES` 是唯一声明例外；`sdk-minimal` 不应用 `dsh-base` 是另一个组合例外。`deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md:11-30@687f282e`、`deepseek-harness/docs/architecture.md:13-40@687f282e`

**迁移裁剪**：目标没有 experimental 组时，保留“成熟度 ≠ 发布/可选/可见性”的定义和“默认产品不得依赖实验”的隔离；把 optional bundle 映射为目标功能开关，但要求默认关闭 + 元数据 + 隔离检查。没有多阶段打包时，必须确认确实没有构建产物边界后再省略 build-input 检查，并记录该判断与再激活触发；source/composition 检查、真实入口的运行时 smoke 和 negative control 只要存在交付组合就仍然适用，缺少 harness 时列为前置条件或阻塞，不能自动降级为“只做 source”。

**证据与限制**：静态隔离、构建输入、真实 runtime smoke 是相互独立的证据；它们不覆盖每个后续用户触发路径或显式安装的 profile 扩展（源仓自己声明）。发布策略不决定成熟度。

来源：deepseek-harness/packages/experimental/README.md:24-34@687f282e 来源：deepseek-harness/packages/experimental/AGENTS.md:5-9@687f282e 来源：deepseek-harness/scripts/experimental-package-policy.ts:1-67@687f282e 来源：deepseek-harness/scripts/verify-default-product-isolation.ts:1-30@687f282e 来源：deepseek-harness/scripts/verify-default-product-isolation.ts:45-300@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-09-12-default-product-experimental-isolation.md:11-36@687f282e 来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md:11-30@687f282e 来源：deepseek-harness/scripts/check-workspace-constraints.ts:362-381@687f282e 来源：deepseek-harness/scripts/check-workspace-constraints.ts:593-613@687f282e

<a id="engineering-client-component-contract"></a>
## 30. 客户端组件：注入、数据流与身份（engineering-client-component-contract）

**触发**：写/评审 `packages/client/*` 组件、slot、store、hook、effect、资源读取、样式/构建。

**角色与前置**：插件作者遵守 slot/inject/store 契约；评审者检查组件是否持有 ctx、订阅外部源、传 ReactNode、模块级 handle。

**【源仓义务】**
- 组件通过自己注册的 inject face 接收所有渲染数据：plain data、action callback、保留的 `hooks` 隔间（renderer 绑定为 `use<Name>`）；父渲染点通过 `renderSlot` 传 owner data。不要从树顶读一个大 global state 再往下传。`deepseek-harness/docs/defensive-patterns/client-components.md:7-54@687f282e`
- props 是数据或回调；React node 通过声明的 child slot 传递。不要在 props/inject 里放 `ReactNode`/`ReactElement`/`() => JSX.Element`；需要宿主提供 markup 时声明 child slot。`deepseek-harness/docs/defensive-patterns/client-components.md:55-94@687f282e`
- slot 注册的是模块作用域的稳定函数组件；render 期间创建组件函数会每次产生新类型，React 会卸载/重挂并重置展开/焦点/滚动。注册时参数通过 props 到达，不闭包 render-time 变量。`deepseek-harness/docs/defensive-patterns/client-components.md:95-134@687f282e`
- 组件永不接收 Cordis `ctx`、不 import service class poke、不读 React context；业务组件看到零 context。bare observable 只有 Injection 包成 hook 后才能到组件；组件不自己 `subscribe`/`useSyncExternalStore`。`deepseek-harness/docs/defensive-patterns/client-components.md:135-169@687f282e`
- 上下文来自当前 scope（provider/injected member/framework hook）；不用全局 `current`/`active`/`selection`/`viewId`；同一 session 的多个 composer/conversation 必须独立。`deepseek-harness/docs/defensive-patterns/client-components.md:170-187@687f282e`
- 资源消费者走注入的 `useResource`；domain wrapper 可以在其上组合自己的 hook，但不重建 fetch/cache/subscription。`deepseek-harness/docs/defensive-patterns/client-components.md:188-228@687f282e`
- store 只承载共享 viewing/interaction state；spec 声明 init/actions/persist key；inject face 只给窄接口/selector/actions，不给整个 store；handle 在 `apply` 内创建，模块级 handle 禁止。业务数据在 object layer，不在 store；设置变更走 settings interface。`deepseek-harness/docs/defensive-patterns/client-components.md:229-272@687f282e`
- 切换状态不 remount 控件或替换 DOM；初始状态在第一次 flow 建立，不由 effect 后填；组件收到 hooks/selectors/actions，而不是整个 service。`deepseek-harness/docs/defensive-patterns/client-components.md:273-309@687f282e`
- `useLayoutEffect` 不是默认，换成 `useEffect` 也不是修复；layout measurement 先回答为何必须在此、为何 CSS 不行、为何必须像素级，再进注入的 measurement hook 并获 domain expert 确认。effect 不用来记录状态/绑定逻辑。`deepseek-harness/docs/defensive-patterns/client-components.md:310-347@687f282e`
- effect 不用来把 render 可推导数据推回父级；在 render 决定、通过 render-time channel 交给 host，或由用户手势更新。`deepseek-harness/docs/defensive-patterns/client-components.md:348-381@687f282e`
- build 调整走该包的 tsdown plugin；样式走 CSS Modules；只 inline images/GIF/SVG 且 inline 到 CSS 而非 JSX；大文本不进 TSX；`style` 只放运行时计算值。`deepseek-harness/docs/defensive-patterns/client-components.md:382-416@687f282e`
- `key` 只在命名实体/实例身份时传；`key={index}` 对可变列表失败；key 不用来消 warning 或编码顺序。`deepseek-harness/docs/defensive-patterns/client-components.md:417-449@687f282e`
- `packages/client/AGENTS.md` 补充：三通道 live data（owner props/local state/declared store）、数据访问阶梯、store 读写、inject 只从 apply closure 的 ctx、Factory 稳定身份、组件测试直接 props；`ctx` 只在 apply world。`deepseek-harness/packages/client/AGENTS.md:7-33@687f282e； deepseek-harness/packages/client/AGENTS.md:42-45@687f282e`

**步骤**
1. 设计 registration：name/children/store/inject；列出组件订阅的每个子状态和稳定 props。
2. inject 只返回窄数据/回调/hooks；不返回 store/service/ctx/ReactNode。
3. 组件用框架 hook 读数；写走 actions；派生用纯函数/useMemo。
4. 资源和共享状态走 `useResource`/declared store；handle 留在 `apply`。
5. 检查身份/初始状态/effect/key；样式走 CSS Module；组件测试直接喂 props。

**完成信号**：组件不持有 ctx/服务/订阅；props 无 ReactNode；slot 注册稳定；store 窄且 handle 不模块级；effect 不推数据；key 有业务身份；测试不依赖渲染机制。

**失败处理**：若需要全局状态，提升为 service/store 并注入；若组件要 ctx，改为在 apply 里准备数据；若 effect 在同步状态，移到 render/inject。

**例外**：已发布的 node-valued props 在触碰时转换，不扩展；`useLayoutEffect` 只有在三问通过 + domain expert 确认后保留；真正需要 remount 时由调用者拥有并说明。`deepseek-harness/docs/defensive-patterns/client-components.md:55-94@687f282e； deepseek-harness/docs/defensive-patterns/client-components.md:310-347@687f282e`

**迁移裁剪**：目标不是 React 时，映射为“注入数据/回调 + 稳定组件身份 + 无全局选中 + 资源单读路径 + 窄 store”；保留判定。没有 slot 机制时可把 children 组合映射为目标组合 API。

**证据与限制**：评审为主；组件行为测试可补充。通过渲染测试不证明没有隐藏订阅。

来源：deepseek-harness/docs/defensive-patterns/client-components.md:7-54@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:55-94@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:95-134@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:135-169@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:170-187@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:188-228@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:229-272@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:273-309@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:310-347@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:348-381@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:382-416@687f282e 来源：deepseek-harness/docs/defensive-patterns/client-components.md:417-449@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:7-33@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:42-45@687f282e

<a id="engineering-client-layering"></a>
## 31. 客户端分层与域图（engineering-client-layering）

**触发**：新增 client domain 目录、跨域 import、改 shared layer（ui-primitives/layout/renderer/object layer）、评审 UI 改动。

**角色与前置**：feature owner 在自己的包吸收需求；shared layer owner 批准真正通用的变更；`verify-client-domain-graph` 检查目录级依赖。

**【源仓义务】**
- 每层隔离级别：`ui-primitives` 消费目录控件，新控件先在 feature 包，第二个消费者才提升；`ui-layout`/shell 消费并通过 wrapper/覆盖样式适配；`ui-renderer` 业务代码无 value 依赖，只通过 slots/provide-inject hooks/declared stores 扩展；另一个 feature plugin 无 runtime import/re-export，UI 走 slots、行为走 injected services，共享 runtime 只放窄静态 owner；data object layer 通过文档化 surface 读，feature 概念不进入；自己的包内不受限。`deepseek-harness/docs/defensive-patterns/client-components.md:450-493@687f282e`
- 三层红线：data object layer（React-free：connection、session-controller/client、workspace-controller/client、client/store snapshot engine）；render machinery（ui-renderer/dynamic plugin：所有 ctx→React 集成、slot renderer、SessionProvider、uSES adapter）；presentation components（plugin 包 `src/client/`，纯 props，可整体重写）。`deepseek-harness/packages/client/AGENTS.md:46-60@687f282e`
- 业务数据在 object layer，不在 store；store 只放共享 viewing/interaction state。`rpcId` 严格双向：发起者 mint、响应者 echo、mint 留在 Connection。notifier 发布：`notifyNow` 只是用户手势的直接 echo；结构更新用 microtask-batched `markDirty`；可见 streaming chunk 用 cumulative `markFrameDirty`。Web 层是纯展示：不把“怎么画”写进 session log；tool card 从 raw call/result + persisted metadata 派生；未知/畸形 tool data 回退 generic form；新的 model-visible input 仍需 session event。`deepseek-harness/packages/client/AGENTS.md:46-60@687f282e`
- 目录 regime：一个 UI feature = 一个 plugin package；多域包按未来可拆包切分（`contract/` 是唯一共享 API，domain 目录互不 import，`apply.ts` 是唯一跨域 assembly）；注册走 `slots.register`/`registerFactory`，不用模块级副作用。`deepseek-harness/packages/client/AGENTS.md:111-114@687f282e`
- 门禁 `verify-client-domain-graph`：`contract/` 层可被所有域 import；domain 目录不得 import sibling domain；只有顶层 `apply.ts`/`index.ts`/`index.tsx` 可跨域 assembly；违规给出 file/imported/reason。`deepseek-harness/scripts/verify-client-domain-graph.ts:1-104@687f282e`

**步骤**
1. 判定改动属于 feature 还是 shared layer；feature 需求留在自己的包。
2. 跨包 UI 走 slot，行为走 injected service；不 runtime import/re-export feature 值。
3. 多域包建 `contract/` + domain 目录 + `apply.ts`；域间只通过 contract。
4. 改 shared layer 时列所有消费者并回归；真正通用才提升。
5. 运行 `verify-client-domain-graph` + client tests。

**完成信号**：门禁绿；无 sibling-domain import；shared layer 无 feature 概念；object layer 无 React；业务数据不在 store。

**失败处理**：若需要共享，先建 contract 或提升到窄静态 owner；不要给 feature plugin 加导出。若门禁报 top-level 非 assembly 跨域，移动 assembly 点。

**例外**：shared layer 的通用改动（排序、虚拟化、可访问性）不是业务修改；真正的 shared 改动需 owner 确认并回归所有消费者。`deepseek-harness/docs/defensive-patterns/client-components.md:450-493@687f282e`

**迁移裁剪**：映射到目标前端的分层/目录 lint；保留“feature 拥有自己 + contract 唯一共享 + shared 需 owner”。没有 slot 时用组合/依赖注入替代。

**证据与限制**：目录门禁自动；组件/集成测试补充。门禁只查相对 import 的目录级边界，不查语义。

来源：deepseek-harness/docs/defensive-patterns/client-components.md:450-493@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:46-60@687f282e 来源：deepseek-harness/packages/client/AGENTS.md:105-114@687f282e 来源：deepseek-harness/scripts/verify-client-domain-graph.ts:1-104@687f282e

<a id="engineering-remote-capability"></a>
## 32. 远程能力：每能力一个 service 与 `@Remote` 纪律（engineering-remote-capability）

**触发**：新增 `@Remote` 方法、改 API controller/service、迁移 remote 能力、处理资源/调用者身份。

**角色与前置**：能力 owner 建自己的 service；API 层只做通用编排；评审者逐条检查五项纪律。

**【源仓义务】**
- 新远程业务能力是**新 service**（自己的包或对象），`@Remote` 标在该 service 的具体方法上；不要往已有大 service 上加方法。按业务边界拆，不按调用者数量；迁移时方法出现在新 owner 上。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:7-44@687f282e`
- `@Remote` 五项纪律：标在真正执行能力的具体方法（不是转发 wrapper）；client-facing 类型从生成器推断/别名（如 `TypertClientRemote['session']`），不手写第二套；wire payload 是 JSON，binary 字段级表达，方法出站不做 decode（生成 codec + Gateway 校验结果）；已发布方法/字段名只增不改，重命名是独立改动；每个方法声明它触碰的所有 `resources`，多资源返回逐项 `this.ctx.remoteAccess.allows(resource)` 过滤，调用者只从 `this.ctx.invocation.peer.principal` 读，不从参数读。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:45-82@687f282e`
- `packages/api` 的 controller/gateway/remotes 只承载传输、调用形状、Session 生命周期等通用编排；业务分支不得聚合在这里；业务决策在拥有包，以 projected data 或注册条目进入。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:83-115@687f282e`
- 没有 decorator 的方法仍是普通 service 方法；五项纪律只治理“什么成为 Remote 方法”。重命名或新 decode 路径要先说明收益和现有调用者影响，并获 domain owner 确认；作者不能自批。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:45-82@687f282e`
- `@Remote` 支持 Host 已有的 lookup 参数、尾部 `AbortSignal`、`@Remote({ mode: 'stream' })` 流；出站不 decode。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:45-82@687f282e`

**步骤**
1. 按业务边界建 service；把 `@Remote` 放在 concrete 方法。
2. Client 类型用生成器别名；payload 保持 JSON；binary 字段级。
3. 为方法列 `resources`；返回多资源逐项 filter；principal 只从 invocation 读。
4. 不改已发布名称；重命名单独改动 + owner 确认。
5. 生成 Typert 产物并编译/测试 Client 调用。

**完成信号**：新能力在新 service；decorator 不在 wrapper；类型无手写重复；无输出 decode；资源/principal 正确；API 层无业务分支。

**失败处理**：若方法需要 wrapper，检查是否该把 decorator 移到实现；若类型手写，改为生成别名；若资源漏列，补 `resources` 并测试 denial。

**例外**：一个 service 的所有方法服务同一业务边界时保持整体；需要独立协议的数据（事件流、分页、增量 reduce、投影、实体子流）走各自注册模型，不做成 Remote 方法。`deepseek-harness/docs/defensive-patterns/remote-and-api.md:7-44@687f282e`

**迁移裁剪**：目标没有 `@Remote`/Typert 时，映射为“每能力一个 RPC service + 生成类型 + JSON payload + 资源授权 + principal 来源”。保留五项纪律的判定。

**证据与限制**：生成产物编译/类型测试是自动证据；访问控制需要 denial 测试。没有真实调用路径的静态正确不等于运行时安全。

来源：deepseek-harness/docs/defensive-patterns/remote-and-api.md:7-44@687f282e 来源：deepseek-harness/docs/defensive-patterns/remote-and-api.md:45-82@687f282e 来源：deepseek-harness/docs/defensive-patterns/remote-and-api.md:83-115@687f282e

<a id="engineering-conversation-render"></a>
## 33. 会话读取与渲染：投影单路径、增量计算、无业务分支（engineering-conversation-render）

**触发**：读 Session 数据、加 conversation node、改分组引擎/列表/seat/Markdown/UserMessage、客户端缓存/retention、流式渲染。

**角色与前置**：session/UI owner 维护 projection 与 renderer；业务包注册自己的 unit/renderer；评审者检查是否出现第二读路径或业务分支。

**【源仓义务】**
- Session 数据只通过 Projection 读取与计算：client 读 projection value，不在组件里拉 log；属于 Session 的计算注册为 projection unit 并发布结果，不按需重算。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:7-49@687f282e`
- `stateVersion` 从 1 开始；序列化 state 字段或 fold 语义变化就 bump（兼容与否都 bump）；同一 key 用不同 `stateVersion` 注册两次会 throw。默认全量计算；缩小计算范围需 domain expert 确认。部分 projection view 可以服务接口可用性，但绝不决定外部可见结果。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:7-49@687f282e`
- 冷读是最后手段：先读可用 cache；只有没有 projection 覆盖时才 cold read；“小 Session 可全量读”的例外已移除且不再考虑。cache 与 official 不等价时，miss/stale 产生显式结果，不静默切慢路径。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:50-84@687f282e`
- Retention 一条生命周期规则：client 通过显式 `SessionReference` 持有；引用计数到 0 释放；idle reclamation 谓词是 `refCount == 0 && inflight == 0`，不枚举业务状态。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:85-127@687f282e`
- 新 node 计算必须声明复杂度；高频 streaming chunk 不立即发布、不每 chunk 全量重算。append path 成本是 `D` 个 Definition 的 `D` 次 match + 一次常量 Context-key lookup；发布词汇 `none`/`animation-frame`/`immediate`；高频 delta 禁止 `immediate` 和全量重算；结构/终态变化可选 `immediate`。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:128-161@687f282e`
- 分组引擎（`ProcessState`、group hierarchy、group semantics）无业务规则；业务计算 placement enum，引擎只按 enum 放置；新增 enum 值是支持的扩展。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:162-196@687f282e`
- `ChatNodeList`/`ChatNodeSeat`/`ChatGroupSeat` 无业务分支/字段；新 node 把 kind 加进 `ChatNodeDataMap` 并注册 renderer；列表继续按 kind dispatch。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:197-232@687f282e`
- `AssistantMarkdown` 及渲染管线无业务分支；展示需求注册 renderer 或把语义放进 data；官方默认内容也走同一注册面，不做 host-side inline fallback；wrapper 调官方 entry 并保留 fallback，不重渲染 slot、不 import 私有 React 组件。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:233-278@687f282e`
- `UserMessage` 和 UI `user` kind 渲染无业务字段/分支；业务差异走 payload（自己的 merge-extensible source kind 或 content field）或注册 renderer；`MessageSourceMap` 可 declaration-merge 扩展。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:279-316@687f282e`
- 架构侧：session log 是模型上下文唯一来源，`deriveMessages()` 从 log 投影；新 model-visible 输入需要 session event（模型可见 ⟺ 已记录）；`dsh-session-projection` 拥有 `ctx.sessionProjections`，host 消费者读 typed state，carrier 批量裁剪 client view。`deepseek-harness/AGENTS.md:137-137@687f282e`、`deepseek-harness/docs/architecture.md:118-128@687f282e`

**步骤**
1. 找现有 projection/read path；没有才加 cold read，并把 miss 作为显式状态。
2. 新计算注册 unit，声明 stateVersion 和复杂度；变化就 bump。
3. 高频 chunk 只增量更新受影响子树；发布用 batching，不用 immediate。
4. 业务包注册 node kind/renderer；shared engine/list/Markdown 不加分支。
5. retention 用显式 reference；reclamation 只用一个谓词。
6. 为 streaming 性能、cache miss、版本冲突写测试。

**完成信号**：只有一条 read path；无每 chunk 全量；shared engine/list/Markdown 无业务分支；retention 可审计；stateVersion 正确。

**失败处理**：若出现第二读路径，删除并接 projection；若 cache miss 落全量，改成显式 state；若 shared 层要分支，注册 renderer 或把语义放进 data。

**例外**：结构/终态 publication 可 `immediate`；host 可有 cold read（client 的限制不要求 host 绝对禁止）；部分 projection view 只服务可用性。`deepseek-harness/docs/defensive-patterns/conversation-and-session.md:50-84@687f282e； deepseek-harness/docs/defensive-patterns/conversation-and-session.md:128-161@687f282e`

**迁移裁剪**：目标没有 projection 框架时，映射为“单一读模型 + 注册计算 + 缓存 miss 显式 + 增量/批量发布 + shared renderer 注册”。保留“无业务分支”的判定。

**证据与限制**：评审 + 性能测试；快照可证明输出。投影版本冲突要运行时测试；类型不覆盖。

来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:7-49@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:50-84@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:85-127@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:128-161@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:162-196@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:197-232@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:233-278@687f282e 来源：deepseek-harness/docs/defensive-patterns/conversation-and-session.md:279-316@687f282e 来源：deepseek-harness/AGENTS.md:137-137@687f282e 来源：deepseek-harness/docs/architecture.md:118-128@687f282e

<a id="engineering-jsdoc-prose"></a>
## 34. 导出 JSDoc、契约措辞与禁用词（engineering-jsdoc-prose）

**触发**：新增/修改导出、service 方法、README/JSDoc、注释、命名、文档措辞。

**角色与前置**：作者在声明处写完整契约；评审者检查文档是否覆盖行为/失败/时序/所有权；`verify-export-jsdoc` 与 `verify-concrete-terms` 自动检查可机械化的部分。

**【源仓义务】**
- 每个模块和导出都有简洁 JSDoc 说明非显然契约；function-like 导出包含 `@param`/`@returns`；`verify-export-jsdoc` 强制。可继承的 base 成员文档留在声明处；constructor 不被该 gate 检查；类静态协议槽与顶层协议导出按 gate 的例外处理。`deepseek-harness/AGENTS.md:173-173@687f282e`、`deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e`
- 注释和文档陈述完整契约与上下文，不是推理过程；直接、具体；不用隐喻。写 `contract`/`boundary`/`shape` 前先问是否有更精确词（`response fields`、`JSON validation`、`ESM exports`）；`contract` 只用于前置/后置/不变量/兼容承诺/义务；保留字面的 process/wire/security/transaction/lifecycle boundary。不叙述控制流/测试、不保留评审历史、不复述代码；保留行为、失败、时序、所有权和安全使用事实。`deepseek-harness/AGENTS.md:175-175@687f282e`
- `verify-export-jsdoc` 的精确范围：扫描 `packages/*/*/src/**/*.ts`；若 package.json 没有 `./src/*` export，只检查从 exports 条目可达的名字，否则检查所有 module-level exports；无 import/export 的 script-style `.d.ts` 作为 ambient implicit-export scope。`deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e`
- 该 gate 的规则：导出声明要有 descriptive prose；函数/公共 class 方法每个参数一个 `@param`（排除 `this`，前导下划线名字归一化），非 void 返回要有 `@returns`；class 本身和 public property/accessor 要有 prose（get/set 对由 getter 覆盖）；overload implementation 豁免，constructor 不检查。类静态协议槽 `Config`/`inject`/`name`/`reusable` 豁免，顶层协议导出另行适用。继承成员只有在 base 是 public、override 不加参数且不写具体返回类型时才继承文档；public override 一个 protected base 成员算新 API。import-alias 到 callable/class/namespace 被拒；只写 prose 的 alias 文档自身；`export =` 被拒；带 module specifier 的 re-export 跳过（走定义模块）；无 specifier 的 `export {…}` 解析本地声明；string-literal module / `declare global` augmentation 跳过；未知 export statement kind fail closed；mixed call/construct/other-member callable literal fail closed（要求命名类型）。inline callable annotation 只接受单一 call signature；命名引用类型把文档留给声明；命名 declarator annotation 可豁免 arrow 的返回契约。`deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e`
- 禁止一个歧义 origin 标签 `provenance`（十字母 ASCII token，任意大小写变体）出现在 maintained tracked path/text；每处替换为精确本地概念（source-event references、provider metadata、model identity、context producer、configuration source、artifact identity、recorded evidence）。覆盖 source/tests/docs/active Notes/prompts/snapshots/workflows/scripts/identifiers/fields/exported types/filenames；vendor 和 archived Notes 排除；兼容 reader 可在运行时重建旧 durable key，但 maintained text 不嵌入 token。**自指警告**：源仓自己的 Agent Note 刻意把它分写为 `prove` + `nance` 以通过同一 gate；若采用方把本参考或类似治理文档放进被扫描的 tracked tree，必须同样分写，或把该治理文档明确纳入例外，否则 gate 会命中说明本身。`deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:13-39@687f282e`
- `verify-concrete-terms` 对 `git ls-files` 的 tracked filenames、symlink targets 与文本行做 NFKC 归一化后 lowercase 匹配，排除 `vendor/`、`.agents/notes/archived/`、release schema JSON 与 historical-format schema/i18n 的标记区内 schema；作为 `doc-sync` 的 quick leaf。`deepseek-harness/scripts/verify-concrete-terms.ts:1-105@687f282e`
- 文档写当前状态，不写历史/状态注解；一个事实一个 home；`docs/AGENTS.md` 的 writing rules 适用于所有 in-scope 文档。`deepseek-harness/docs/AGENTS.md:38-48@687f282e`

**步骤**
1. 在声明处写描述性 JSDoc；function/public method 补 `@param`/`@returns`。
2. 检查是否用隐喻/模糊词；换成精确名词或具体字段。
3. 搜索禁用 token（含路径/标识符）；按本地含义替换，不统一换成更宽的 umbrella term。
4. 运行 `verify-export-jsdoc` 和 `verify-concrete-terms`；历史 schema 例外不手改。
5. 文档变更同步 README/JSDoc 契约，不写推理过程。

**完成信号**：门禁绿；导出有契约；无禁用 token；注释不叙述控制流/测试；术语精确。

**失败处理**：若 gate 报未知导出形态，改成受支持的 ESM named export 或扩展 gate（需 owner）；若是历史 schema 例外，确认在允许区域；不要用 alias 保留 token。

**例外**：类静态协议槽/顶层协议导出、可继承的 base 文档、constructor 不检查；vendor/archived/historical schema 排除。`deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e`、`deepseek-harness/scripts/verify-concrete-terms.ts:1-105@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:13-39@687f282e`

**迁移裁剪**：目标没有 AST gate 时，把它列为前置条件或阻塞；可用 lint/API doc 工具做部分替代，但必须保留导出范围、参数/返回、继承/alias/unsupported 形态的可审计规则与负向样例。禁用词是源仓特定历史，迁移时作为可配置词表；词表缺失不是“不适用”，只是尚未实现。

**证据与限制**：JSDoc/terminology gate 自动；语义质量仍靠评审。Gate 通过不证明文档完整；constructor 不检查、prose-only alias、re-export 跳过、unknown fail-closed 都是 gate 的边界，不能解读为这些位置已有语义文档。

来源：deepseek-harness/AGENTS.md:173-173@687f282e 来源：deepseek-harness/AGENTS.md:175-175@687f282e 来源：deepseek-harness/docs/AGENTS.md:38-48@687f282e 来源：deepseek-harness/scripts/verify-export-jsdoc.ts:1-607@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-ban-ambiguous-origin-label.md:13-39@687f282e 来源：deepseek-harness/scripts/verify-concrete-terms.ts:1-105@687f282e

<a id="engineering-dependency-over-handrolling"></a>
## 35. 依赖优先、当前 owner 与对称性（engineering-dependency-over-handrolling）

**触发**：手写协议/解析/重试/glob/SSE；新增依赖；移除抽象；发现并行值不对称；评审“Not Invented Here”。

**角色与前置**：改动者证明依赖净删除 owned code/tests；评审者区分“特性决策”与“简化”；supply-chain owner 看健康度/传递足迹。

**【源仓义务】**
- 引入维护良好的外部依赖（或引擎下限内的 Node builtin）覆盖手写表面时，替换是首选方向；但必须真正缩小 owned 面（实现 + 专用测试 + 文档/契约），不是把复杂度搬到 wrapper 后面。`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:11-25@687f282e`、`deepseek-harness/AGENTS.md:140-140@687f282e`
- 新依赖门槛：净删除（替换真实 owned code，不是假想未来代码；纯加能力是特性决策）；健康（活跃维护、广泛使用、合理传递足迹）；边界契合（包语义覆盖实际契约，仍需手写的残余语义算反对）；不是已定 seam（schemastery、vendored Cordis、twin adapters 等已记录决策不被此策略重开）。`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:11-25@687f282e`
- `packages/util/` 的“零依赖” charter 是**导出纪律**（不依赖 harness 包），不是禁外部包；若外部包更好，替换而不是为 charter 保留。`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:11-25@687f282e`
- 每个抽象、状态机、选项、防御性拷贝、兼容路径都要绑定当前契约或生产 consumer；行为留在拥有插件/service。`deepseek-harness/packages/AGENTS.md:11-11@687f282e`
- 并行值优先对称；无法解释的不对称通常意味着漏了提取。`deepseek-harness/AGENTS.md:153-153@687f282e`
- 命名要命名“存在的稳定职责”，不是第一个实现、未来扩展或 Cordis 基类；interface 包命名能力，实现包加机制/协议/环境/vendor；`ctx` key 单数用于一个 engine/runtime/policy/controller/resolver/store/current config，复数用于 registry/多命名成员；class role 与 key 数一致；不重用同一 Context key 给不兼容 host/client 声明。`deepseek-harness/docs/cookbook/adding-a-package.md:46-75@687f282e`

**步骤**
1. 先搜索已有依赖/内置能力；列出可删除的实现 + 专用测试 + 文档。
2. 评估健康度和残余语义；若只是“加能力”，走特性决策而非简化。
3. 用 dependency-swap 提案记录候选、可删表面、残余语义、supply-chain 考虑。
4. 删除 owned 代码/测试，不保留 wrapper 兼容层（除非有当前契约）。
5. 检查并行值对称性；命名按角色表。

**完成信号**：净删除可量化；依赖健康/边界契合；无当前 owner 的抽象被删；并行的值解释得通；命名与实际职责一致。

**失败处理**：若无法净删除，保留手写并记录理由；若依赖只包一层，拒绝迁移。若不理解不对称，先找漏提取。

**例外**：已记录 seam/依赖决策不被重开；纯加能力是特性决策。`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:11-25@687f282e`

**迁移裁剪**：任何仓库都适用；supply-chain 评审可映射到目标策略。没有 util charter 的项目可以省略该例外，但只省略例外本身，不省略净删除、健康度、边界与当前 owner 的判定；在迁移记录中写明为何没有 charter，以及新增共享工具时的再激活路径。

**证据与限制**：评审为主；净删除可量化。依赖健康度是判断，不是自动证明。

来源：deepseek-harness/AGENTS.md:140-140@687f282e 来源：deepseek-harness/AGENTS.md:153-153@687f282e 来源：deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:11-31@687f282e 来源：deepseek-harness/packages/AGENTS.md:11-11@687f282e 来源：deepseek-harness/docs/cookbook/adding-a-package.md:46-75@687f282e

<a id="engineering-todo-markers"></a>
## 36. TODO 标记的紧迫性语义（engineering-todo-markers）

**触发**：在代码里留已知问题；发布前扫描；评审 `FIXME`。

**角色与前置**：作者按紧迫性选标签；评审者同意 `FIXME` 是否可随发布合并。

**【源仓义务】**
- `FIXME`：应阻塞新发布的问题；发布不应带 open `FIXME`，除非评审者明确同意该改动仍可合并。`deepseek-harness/docs/development.md:196-204@687f282e`
- `TODO`：资源允许时应尽快修。`deepseek-harness/docs/development.md:196-204@687f282e`
- `XXX`：也许 someday 修，最低优先级、无承诺。`deepseek-harness/docs/development.md:196-204@687f282e`
- 选与紧迫性匹配的标签，让扫描者能区分发布阻塞和 someday-maybe。`deepseek-harness/docs/development.md:196-204@687f282e`、`deepseek-harness/AGENTS.md:164-164@687f282e`

**步骤**
1. 判断是否阻塞发布；是则 `FIXME`，否则 `TODO`/`XXX`。
2. 在注释里写清问题与触发条件，不只是标签。
3. 发布前扫描 `FIXME`；需要保留时记录评审者同意。
4. 修复后删除标记。

**完成信号**：标签与紧迫性一致；发布无未同意 `FIXME`；扫描者能区分优先级。

**失败处理**：若不确定，按更低紧迫性并写清条件；发布阻塞项必须升级到评审。

**例外**：评审者明确同意可合并的 `FIXME` 可随发布；但必须记录同意。

**迁移裁剪**：可直接采用；若目标用 issue tracker，保留三档语义并映射标签。

**证据与限制**：人工/扫描；没有自动语义检查。

来源：deepseek-harness/AGENTS.md:164-164@687f282e 来源：deepseek-harness/docs/development.md:196-204@687f282e

<a id="engineering-duplication"></a>
## 37. 跨文件重复检测门禁（engineering-duplication）

**触发**：复制粘贴实现、提取共享 helper、修改 `packages/`/`scripts/` 的相似代码。

**角色与前置**：作者在提交前跑 `duplication`；评审者判断重复是应提取还是有意保留。

**【源仓义务】**
- `pnpm run duplication` 用 jscpd 检测跨文件 TypeScript 克隆；配置 `minTokens: 60`、`minLines: 6`、`mode: mild`、格式 `typescript`/`tsx`、忽略 `**/tests/**` 和 `**/tsdown.config.ts`、`exitCode: 1`。`deepseek-harness/.jscpd.json:1-15@687f282e`
- 复制粘贴不自动等于错误；但 unexplained duplication 是提取信号（与“对称性”规则一致）。`deepseek-harness/AGENTS.md:153-153@687f282e`（【迁移设计】把两者关联）

**步骤**
1. 提交前跑 `pnpm run duplication`。
2. 对报告：若是同一职责，提取共享 helper/包；若是有意分叉，记录原因。
3. 提取后重跑；不要在测试/配置里用 ignore 掩盖生产重复。

**完成信号**：duplication 绿；重复要么消除要么有理由；共享 helper 有 owner。

**失败处理**：若报告是测试/生成代码，确认 ignore 规则合理；不要为过门禁复制 ignore 到生产。

**例外**：`tests/` 和 tsdown config 被配置排除；生成代码/有意分叉需评审。

**迁移裁剪**：映射到目标 clone detector；阈值按语言调整，但保留“生产重复需解释”。

**证据与限制**：自动门禁；它不判断重复是否应共享。

## 38. 跨域依赖、证据绑定与未决候选（导航）

本域不复制其他 owner 的规则；这里记录实际绑定到的证据、仍由 owner 负责的部分，以及未审阅候选。跨域“已读”是 owner 的 coverage 或本域实际读过的范围，不是本作者对 owner 全文的独立逐行审计；本作者亲自读过的范围只以 `research/engineering-coverage.json` 为准。本节的 `path:range` 是 coverage 导航坐标，均属于同一固定提交；为紧凑省略 `@687f282e` 后缀，机制正文的源仓义务仍使用完整 citation 格式。

**已绑定且可追溯**
- **Documentation**：`docs/AGENTS.md:1-77`（Documentation 全读，本域也读全文）、`scripts/verify-doc-budgets.ts:1-58`、`scripts/doc-budgets.manifest.json:1-9`、`scripts/verify-export-jsdoc.ts:1-607`（Documentation 全读；本域复核 1-10、16-21、160-238、278-313、362-371）、`scripts/verify-concrete-terms.ts:1-105`、`scripts/verify-md-links.ts:1-203`、`.agents/skills/dsh-prose-standard/SKILL.md:1-81`。相关机制：`documentation-tier-placement`、`documentation-prose-budgets`、`documentation-comments-export-jsdoc`、`documentation-markdown-links`、`documentation-repository-reference-policy`、`documentation-slop-checklist`、`documentation-current-state`、`documentation-complete-proposition`。
- **Testing**：`docs/testing.md:1-55`（本域全读）、`packages/AGENTS.md:19-19`、`benchmarks/AGENTS.md:1-18`；测试 owner 另有 `snapshots/AGENTS.md:1-17`、CI 矩阵与 snapshot/e2e 规则。相关机制：`testing-tiered-evidence-selection`、`testing-execution-topology`、`testing-resource-isolation`、`testing-real-entry-composition`、`testing-source-built-entry-modes`、`testing-snapshot-required-and-placement`、`testing-benchmark-gate`、`testing-coverage-per-file-100`。
- **Release**：`AGENTS.md:7-11`（本域已读）只提供触发边界；session format/version、`SCHEMA_VERSION`、upgrade guide、packed install 与 release sequence 由 Release 展开。Release coverage 已读 `scripts/release/verify-packed-install.ts:1-126`，但没有执行；不能把“已读源码”写成“安装已验证”。相关机制：`release-session-authority`、`release-session-migrations`、`release-upgrade-guides`、`release-npm-rehearsal`。
- **Automation**：`lefthook.yml:1-49`（本域全读）只用于 pre-commit/pre-merge 与 whitespace/translation/archived-note 证据；gate 调度、CI 平台矩阵、workflow 必需 job 由 Automation coverage 负责。相关机制：`automation-lefthook-hook-matrix`、`automation-gate-aggregate-registry`、`automation-gate-dependency-graph`、`automation-gate-scheduler`、`automation-build-artifact-record`、`automation-local-check-boundary`。
- **Supply（已绑定）**：本域实际读 `scripts/verify-package-dependencies.ts:1-58、593-655、694-739、797-867、909-960`（非全文；59-592、656-693、740-796、868-908、961-1038 未读）、`scripts/package-dependency-policy.ts:1-105`、`scripts/check-workspace-constraints.ts:1-24、25-90、362-399、401-542、551-570、573-579、585-646、649-664`（非全文；其余区间未读）。Supply owner 的 `research/supply-chain-coverage.json` 已生成，并对 `verify-package-dependencies.ts` 近全文（1-58、59-592、596-700、704-823、824-923、924-1038）、`check-workspace-constraints.ts` 的 91-361/423-545/600-642、`verify-npm-install-layout.ts:1-275`、`scripts/release/pack.ts:1-108`、`scripts/release/verify-packed-install.ts:1-126`、`scripts/release/publish.ts:1-235`、`vendor/README.md:1-73` 做过读取；这些是 owner 证据，不是本域独立逐行审计。相关机制：`supply-chain-workspace-protocol`、`supply-chain-dependency-faces`、`supply-chain-manifest-publication`、`supply-chain-vendor-sync`、`supply-chain-vendor-patches`、`supply-chain-install-layout`、`supply-chain-packed-install`。
- **AgentFlows / Decisions / Collaboration**：只做导航，不复制。AgentFlows 负责 agent loop、session log/projection、turn/tool/LLM 事件语义；Decisions/Rationale 负责 Agent Note 生命周期、替代方案与 supersession；Collaboration 负责 PR 历史/标签/评审流程。本域只引用与本域机制直接相关的契约，不把它们的 coverage 当作本域证据。

**本域已读的子树指令（只取相交义务；完整矩阵见 §1）**
- `packages/AGENTS.md:1-29`、`scripts/AGENTS.md:1-5`、`packages/web/AGENTS.md:1-5`、`packages/schedule/AGENTS.md:1-11`、`vendor/AGENTS.md:1-7`、`.github/AGENTS.md:1-7`、`website/AGENTS.md:1-23`、`snapshots/AGENTS.md:1-17`、`native/system/AGENTS.md:1-28`、`apps/cli/tests/profiles/AGENTS.md:1-7`、`.agents/notes/AGENTS.md:1-7`、`.agents/notes/implemented/AGENTS.md:1-13`、`.agents/notes/archived/AGENTS.md:1-9`。这些文件的实际完整范围见 coverage；本域未把它们的产品/CI/站点/测试细节复制进工程机制。
- 中文 defensive-pattern 的六个 `.zh.md` 与六个 `.i18n.yaml` 已逐一读取；只做结构/语义 spot-check，没有重新计算 per-heading 哈希，也没有把 sidecar 存在当成配对验证通过。

**仍未独立审阅/未决（不得当作已覆盖）**
- `docs/subsystems/*` 除 `core.md:1-300、358-408`、`llm-streaming.md:169` 之外的逐子系统语义；`docs/api-gateway.md`、`docs/module-graph.md`、`docs/config-catalog.md`、`docs/cordis-tutorial/04-07`、`docs/web-styling.md`、`docs/subsystems/slots.md`。
- `packages/*/README.md` 的逐包契约（本域只读 `packages/README.md:1-101`、`packages/client/AGENTS.md:1-162`、`packages/experimental/*`、`packages/boot/hmr/README.md:1-129`）；`vendor/cordis/*`（`vendor/README.md:1-73` 已由 Supply owner 全读，本域未独立复核）。`scripts/gen-client-catalog.ts`、`scripts/gen-config-catalog.ts` 只从 package/grep 看到入口，未逐行读。
- `apps/*` 的真实启动/profile 实现与例外；`.github/workflows/*` 的完整 job 图（Automation/Release）。
- `scripts/run-gates.ts` 的完整模式/聚合图；本域只读 333-397、790-795、818-832 的片段。`packages/boot/hmr/README.md` 的替换失败回滚表述存在源内张力（77 说恢复旧模块/插件实现，113 说 import/start 失败不恢复旧版本），已列为 source-conflict；未执行失败替换实验，不能把“失败自动回滚”当保证。
- `snapshots/` 下 fixture 的 AGENTS（fixture 不是根治理指令）；`.agents/notes` 中未被本域引用的历史 Note。
- `verify-archived-agent-notes.ts` 的实现仍未逐行读；本域只从 `archived/AGENTS.md` 读到它拒绝被改/缺失的 sealed artifact、不完整 triplet、未知 kind、非法 archive metadata，并把完整实现归 Documentation。

**证据边界**：`research/engineering-coverage.json` 记录 93 条去重后的 inspected 条目（同一文件的不同区间已合并），并补充本次实际读过的（部分文件仅读区间，精确范围见 coverage）`docs/AGENTS`、`packages/client`、`verify-client-packages`、`verify-cordis-config`、`gen-cordis-catalog`（选区）、`check-workspace-constraints`、`verify-package-dependencies`、`verify-application-entrypoints`、`verify-product-use.spec`、`verify-client-domain-graph`、`verify-package-meta`、`packages/boot/hmr/README`、`vendor/loader/README` 与 lifecycle Note；未列出的路径不得视为已读。跨域证据不与本域证据合并计数。

## 39. 迁移落地顺序（建议）

1. **先冻结事实源**：建立根/子树指令层级，选定一个架构地图和 defensive-patterns 目录；把“单一事实归属”写进贡献指南。
2. **先做自动门禁的骨架**：应用启动、组合解析、源/产物平面、编译面、包形态/依赖、TLA、unknown cast、产品/实验隔离。每个门禁必须有正向、拒绝、恢复样例；没有负向样例的门禁不算自动保证。
3. **再补评审型规则**：seam、扩展点、生命周期、错误处理、客户端/会话渲染、性能证据、迁移行为。把它们写成可判定的 review checklist，而不是口号。
4. **按目标工具链参数化**：Cordis→目标 DI/插件；pnpm→目标包管理器；tsc/tsx→目标编译器；Vite/Typert→目标代码生成；React→目标 UI。保留判定句，不照搬命令。
5. **做一次干净消费者演练**：新项目 + 既有项目 + 第二种工具链；记录首次失败并修复，不要只演示成功路径。
6. **最后再声称自动保证**：只有门禁实际运行、负向样例变红、恢复后变绿，才在迁移记录中把证据从 `planned` 改为 `executed`。本参考作者没有执行这些验证。

## 40. 证据边界与禁止声称

- 本参考没有运行 `pnpm`、`tsc`、`vitest`、Oxlint、jscpd、Cordis Loader、浏览器或任何远程 CI。所有命令和预期输出都是源码阅读得到的“应执行义务”。
- 自动门禁存在不等于它在目标仓库已接线；评审规则存在不等于代理会遵守。迁移后必须逐条建立证据。
- “评审通过”“测试绿”“覆盖率 100%”都不证明机制有效；源仓事故 `docs/postmortem/0001-acp-default-export-drops-inject.md` 明确说明 178 个绿单测 + 100% 覆盖率仍漏掉真实 Loader 路径。
- 远程实验、生产发布、保护分支/审批变更不在本域授权范围内；需要用户显式授权和隔离环境。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `engineering-instruction-tiers`：`deepseek-harness/package.json:132-132@687f282e`
- `engineering-check-selection`：`deepseek-harness/package.json:23-23@687f282e`、`deepseek-harness/package.json:61-61@687f282e`
- `engineering-registrations-effects`：`deepseek-harness/packages/boot/hmr/README.md:12-27@687f282e`、`deepseek-harness/packages/boot/hmr/README.md:59-83@687f282e`
- `engineering-ownership-teardown`：`deepseek-harness/.agents/skills/cordis-styling-nitpicking/SKILL.md:25-60@687f282e`、`deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:1-51@687f282e`
- `engineering-error-handling`：`deepseek-harness/.agents/skills/dsh-error-handling/SKILL.md:10-26@687f282e`
- `engineering-config-tunables`：`deepseek-harness/AGENTS.md:141-143@687f282e`
- `engineering-application-launch`：`deepseek-harness/scripts/verify-application-entrypoints.ts:175-203@687f282e`
- `engineering-typed-events`：`deepseek-harness/scripts/gen-cordis-catalog.ts:1188-1259@687f282e`
- `engineering-no-unknown-assertions`：`deepseek-harness/AGENTS.md:146-146@687f282e`
- `engineering-discriminant-brands`：`deepseek-harness/docs/subsystems/core.md:358-408@687f282e`
- `engineering-untrusted-subprocess`：`deepseek-harness/docs/defensive-patterns/general.md:212-222@687f282e`
- `engineering-source-artifact-plane`：`deepseek-harness/docs/development.md:59-110@687f282e`
- `engineering-compiler-faces`：`deepseek-harness/tsconfig.base.json:1-29@687f282e`、`deepseek-harness/tsconfig.client.json:1-30@687f282e`、`deepseek-harness/AGENTS.md:148-148@687f282e`
- `engineering-dependency-policy`：`deepseek-harness/AGENTS.md:131-132@687f282e`、`deepseek-harness/docs/defensive-patterns/package-surface.md:115-186@687f282e`
- `engineering-resolve-hook-ban`：`deepseek-harness/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:15-24@687f282e`
- `engineering-client-layering`：`deepseek-harness/packages/client/AGENTS.md:105-114@687f282e`
- `engineering-dependency-over-handrolling`：`deepseek-harness/.agents/notes/implemented/process/2026-07-26-dependencies-over-hand-rolling.md:11-31@687f282e`
- `engineering-duplication`：`deepseek-harness/package.json:59-59@687f282e`

来源：deepseek-harness/.jscpd.json:1-15@687f282e 来源：deepseek-harness/package.json:59-59@687f282e 来源：deepseek-harness/AGENTS.md:153-153@687f282e 来源：deepseek-harness/.oxlintrc.json:230-252@687f282e