# 可选 GitHub 加权审批执行模块

本模块把固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 `.github/review-ownership/` 评分器和两条 `weighted-approval` 工作流作为独立治理程序交付。它不是 `governance status` 的别名，也不把项目单元测试当作审批门禁。安装 Skill 不会自动部署本模块或修改 GitHub 权限。

## 1. 安装到真实项目

先确认项目真实发布的生产代码目录，以及哪些账号拥有目标仓库的 write/admin 权限。生产目录是迁移参数，必须按项目事实指定，不能为了提高归属权重而只选有利子集，也不能把测试或生成代码宣称为生产代码。

在目标仓库根目录运行：

```bash
node .agents/skills/harness-project-governance/tools/github-approval/install.mjs . --production-root src
```

可重复 `--production-root` 指定多目录；`.` 表示仓库根目录确实就是生产根。目录必须已存在；路径规范化为仓库内相对 POSIX 路径。安装器一次预检全部文件：完全相同的文件保持不变，不同内容、符号链接或重定向目录使安装退出2，预检失败不写任何文件。它不覆盖自有策略，不修改 Git 配置，不调用 GitHub API。

安装结果是 `.github/review-ownership/` 内的评分器、归属分析器、策略、生产目录配置、固定依赖和许可证，以及 `.github/workflows/` 内的 publisher/review-event 工作流。输出 `enforcementActive: false`：文件就位仍不是服务端阻断。

核心安装器需要 Node ≥22.19。生产归属分析另需 Python ≥3.10 与 `Pygments==2.21.0`；完整依赖在 `.github/review-ownership/requirements.txt`，不依赖发布者路径或原始 Harness 仓库。GitHub 工作流按该固定依赖自行准备 Python。若要本地运行，可在项目内创建隔离环境：

```bash
python3 -m venv .governance/approval-venv
.governance/approval-venv/bin/python -m pip install -r .github/review-ownership/requirements.txt
```

将环境目录从版本控制排除。Windows 使用对应的 `Scripts/python.exe`；本地 Node publisher 调用其他位置的 Python 时设置 `PYTHON` 为可执行文件路径，未设置则执行 `python3`。凭据通过受信运行环境传入，不写进仓库或聊天。

## 2. 源义务与迁移差异

**原样保留。** `check-approval.mjs`、`author-weight.mjs` 和两条工作流保留源程序。默认阈值2分、普通有写权限的审批1分。有效 `CHANGES_REQUESTED` 与 draft 保持 `pending`，不足分也是 `pending`；评分/依赖准备失败才是 `error`。PR 作者自己的 review 不计入，read-only 与失去权限的账号不计入。

作者信用不是评审者经验：同一仓库、同一不可变作者账号的已合并 PR 数贡献 `min(100, count) × 11 / 1000`，最多1.1分，不能单独达标；普通1分 review 与90个历史 PR 合计仍不足2分，91个才跨过阈值。当前 PR、其他作者和不完整历史不能充数。阻塞 review、draft 或已有足够评审分时跳过不需要的查询。

普通评审的归属权重使用**活跃 base 与精确 head 的 merge base 上，被修改/删除的旧生产代码行**：默认曲线为 `min(2, 1 + 4 × ownedLines / totalLines)`。新增行不进入分母，空分母不加分；未知 GitHub 作者仍占分母。使用未舍入分数判定，显示舍入不改变准入。

**目录参数化。** `production-roots.json` 替代 Harness 专有发布目录和文件名单；明确的根目录自身不因同名祖先被排除，例如真实生产根 `lib/` 仍可分析。测试、fixture、generated、依赖、文档等排除在所选生产根内部生效，文件名/扩展名过滤和 Pygments 注释/空行/生成头识别仍保留。识别使用旧路径、旧内容；PR 把文件移到排除目录或新增 generated 头，不能抹掉旧生产行。完整历史、解析、blame 或账号查询失败时拒绝评分，不以部分分母继续。

**权限名单重新绑定。** 模板 `reviewerPoints` 为空，不把原仓库的特权用户名复制为目标授权。若目标需要固定高权重维护者，应先按真实账号和当前权限核对，再通过受信评审配置。普通权限过滤、阈值和归属加权仍运行，不能把缺少维护者权限或配置当作“不适用”。

## 3. 委托与结算

PR conversation comment 整条为 `/delegate @username` 才是命令；sender 和 recipient 都必须当前有 write/admin 权限，且不是 PR 作者。匹配大小写不敏感。sender 的最新有效存活命令按创建顺序决定，编辑旧 comment 不提高优先级。

sender 只贡献自己的固定/归属分，不转发收到的分；作者信用不可委托。recipient 的有效批准才使分数生效，sender 的旧决策 review 经 GitHub 确认 dismissed 后才解除其阻塞。sender 在命令之后提交任何已提交 review（包括 comment-only）会收回委托；同一时刻 review 优先，dismissal 不恢复旧委托。缺失或不一致的作者/最新编辑者不可变身份信息使评分失败，其他账号编辑的命令被忽略。

dismissal 失败产生 `error`，不继续请求 review；请求 reviewer 失败单独记录，不改已计算分数，在后续订阅事件重评。待审批、历史拉取或请求失败不是伪造批准的理由。

## 4. 受信发布与平台接入

publisher 只 checkout **目标仓库默认分支**的程序、策略和生产目录配置；PR 的文件只作为 Git blob/API 数据读取，不执行。pending 在 Python/lexer 安装之前发布，防止先前 success 留存。Git fetch 的 token 仅在子进程环境里，不写 Git 配置。review-event 工作流无 token 权限；publisher 校验 workflow 文件路径、事件、成功结论、十进制 PR run title 和当前 head，跳过关闭/过时的 PR。

源评分器不按 review 的 commit 自动撤销批准；**原生分支规则负责 stale review 与 latest-push 要求**。接入顺序：

1. 经授权将模块和目标配置提交到受信默认分支，检查 Actions 权限与工作流实际运行；本地安装不执行这一步。
2. 把 `weighted approval` **commit status**设为 required，并绑定 GitHub Actions 为 expected source。不要只要求 `weighted approval publisher` job：job 成功只说明发布完成，评分可能仍 pending。
3. 保留严格检查、管理员约束、禁止 force push/delete；按项目要求启用 stale-review dismissal 与 latest-push approval。模板不会替你修改这些平台设置。
4. 【迁移设计】用真实有权维护者的原生 review/CODEOWNERS 约束策略、评分程序、工作流及 CODEOWNERS 自身的变更。expected App 不是工作流专属身份，不能仅凭 App 绑定宣称所有自修改路径安全。
5. 观察实际缺批准拒绝、有效受信批准恢复、策略自修改未经批准拒绝、历史改写拒绝，并保存服务端返回、保护前后状态、head/ref、审批人权限/时间与产物绑定。缺权限就是阻塞，不写成已执行或不适用。

工作流有文件不等于分支受保护；CI job 的退出码也不等于审批结果。特别是正常的不足分评估故意保持 pending，可能伴随成功的 publisher job。`governance verify/status` 不替代本模块评分或服务端规则。

## 5. 本地检查与维护

已部署目录的归属 CLI：

```bash
python3 .github/review-ownership/blame-production.py BASE_SHA HEAD_SHA --repo .
```

`BASE_SHA`/`HEAD_SHA` 必须是完整 commit SHA；分析自动取 merge base，仓库必须有完整历史。此命令返回旧生产行归属，不提交 review、不发布 status，也不是平台合并授权。

publisher 的真实入口为 `node .github/review-ownership/check-approval.mjs`，需要受信 `GITHUB_EVENT_PATH`、`GITHUB_TOKEN` 和 HTTPS `GITHUB_RUN_URL`。`pending`/`error` 参数用于工作流准备阶段，不是离线通过开关。不要将真实 token 写入命令参数、证据或测试 fixture。

升级不提供覆盖开关：在隔离副本生成新版本，比较所有变更，保留经过批准的项目权限/生产目录，评审后把程序、配置和工作流一起合入默认分支。不同文件使安装器退出2并保留原内容，不能用删除用户文件来绕过冲突。源义务变化应同步知识/参考及真实拒绝、恢复证据。

源码范围：固定提交 `.github/review-ownership/{check-approval.mjs,author-weight.mjs,blame-ownership.mjs,blame-production.py,requirements.txt,README.md}` 与 `.github/workflows/{weighted-approval.yml,weighted-approval-review-event.yml}`。随附 `SOURCE-LICENSE.txt` 保留 DeepSeek MIT 许可。目标根目录配置、`PYTHON` 选择和非覆盖安装器是本迁移新增设计，不冒称源仓原有接口。
