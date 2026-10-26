# 可选 Agent Note 分类、格式与冻结归档门禁

当项目确有代码、测试和现有文档无法解释的长期决策理由时，采用本模块；不是每个非平凡修改都必须新写 Note。机械或局部修改，包括局部 UI 展示/交互，没有新长期决策时可省略。先更新既有决策 owner，不建立第二套竞争记录。

模块将固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的五个 Note 验证程序转换为原生 Node ESM，安装后的运行不需要源仓、TypeScript 编译器或第三方依赖。MIT 许可见 Skill 根目录 `SOURCE-LICENSE.txt`。`research/build-agent-note-runtime.mjs` 仅供发布者重建，不是消费者运行依赖。

## 1. 激活与目录

所有命令从**目标项目根目录**执行，验证的是该项目的 `.agents/notes/`，不是 Skill 安装目录。Node 要求与核心包一致：≥22.19。

活跃路径是 `{proposed|implemented|rejected}/{feature|bug-fix|simplification|architecture|process|testing}/yyyy-mm-dd-topic.md`；中文对侧和配对记录由配对机制拥有。归档路径是 `archived/{class}/yyyy-mm-dd-topic.{md,zh.md,i18n.yaml}`，不再包含 implemented 段。归档根需要 `AGENTS.md` 和六个分类目录；已密封后还需要 `manifest.json`。

首次采用时，由执行者创建一个当前决策语料树，并在 `archived/AGENTS.md` 写入以下完整约束，不覆盖项目已有指令：

> 归档三元组是永久冻结的历史，不是当前权威。密封后不编辑、翻译、格式化、修复、移动或删除。首次归档只可移动完整中英/侧车，保留 implemented 状态，在其后插入相同有效归档日期，重录侧车并修复入站链接。当前事实、勘误与新决定写在活跃语料，不追改历史。普通文档检查跳过归档源和出站链接，但继续验证指向归档的链接。

Git 不保存空目录。以下目录准备命令在首次采用和每次干净 CI checkout 后执行，仅创建必要目录，不创建假 Note、不修改已有正文或密封清单：

```bash
node --input-type=module -e "import {mkdirSync} from 'node:fs'; import {AGENT_NOTE_CLASSES} from './.agents/skills/harness-project-governance/tools/agent-notes/agent-note-tree.mjs'; for (const lifecycle of ['proposed','implemented','rejected','archived']) for (const kind of AGENT_NOTE_CLASSES) mkdirSync('.agents/notes/'+lifecycle+'/'+kind,{recursive:true})"
```

如果此前只用 `.governance/decisions/` 存放同一批长期决策，采用 Note 树时迁移既有 owner 和入站链接，不保留两套同权威副本。需求与任务状态仍留在 `.governance/requirements.md` / `state.json`。

## 2. 活跃语料检查

```bash
node .agents/skills/harness-project-governance/tools/agent-notes/verify-agent-note-classification.mjs
node .agents/skills/harness-project-governance/tools/agent-notes/verify-agent-note-format.mjs
```

分类器拒绝未知生命周期/分类、错误路径深度、非日期主题文件名、中央 INDEX 和旧 `docs/rfc`/`docs/rfcs` 路径。格式器检查标题/唯一 Status、生命周期一致、Problem 开头、各状态必需章节、Alternatives 及 implemented 禁用的提案章节；围栏示例不被当作正文结构。仅在文件日期早于2026-07-05时接受源规则的精确 grandfather 注释，不能让新 Note 绕过备选方案。

这些程序保留源职责边界：活跃 `.zh.md` 的结构/翻译对应和 Markdown 链接由独立的[文档执行模块](documentation.md#markdown-gates)拥有。先完成下面的语料配置，再把配对、链接命令与上述两条分类/格式命令一起运行；不只安装分类器就声称整条 Note 治理链已建立。作者/评审者仍须检查实际 rationale、当前事实和完整/部分取代关系，程序不会判断“这个改动是否值得写 Note”。

在 `.doc-gates/translation-pairing.json` 中列出**活跃生命周期根**，不要把包含冻结三元组的 `archived/` 放进 `roots`，也不要用 `excluded` 表示“归档由别的门禁负责”：配对程序的 `excluded` 表示该页面不得有译文或侧车，并非忽略历史三元组。

```json
{
  "roots": [
    ".agents/notes/proposed",
    ".agents/notes/implemented",
    ".agents/notes/rejected"
  ]
}
```

若采用项目还有其他受管双语文档，把其真实根/文件纳入同一配置，不另建重复 owner。`.doc-gates/markdown-links.json` 则可声明 `{"roots":[".agents/notes"]}`；链接程序默认跳过归档出站检查但保留活跃→归档入站检查。活跃 Note 保留第3行唯一 Status、第4行空行，语言切换链接放在其后、首个 `## Problem` 之前。两侧修改后只对已确认的活跃配对重录，再做只读检查：

```bash
node .agents/skills/harness-project-governance/tools/doc-gates/verify-translation-pairing.mjs --write .agents/notes/implemented/process/2026-07-06-owner.md
node .agents/skills/harness-project-governance/tools/doc-gates/verify-translation-pairing.mjs
node .agents/skills/harness-project-governance/tools/doc-gates/verify-md-links.mjs
```

第一条中的路径须换成正在修改的真实 Note，不创建示例占位记录。配对通过只证明结构和记录新鲜度；译文含义仍须评审。归档的整文件 Git blob 配对和 SHA-256 seal 由归档执行器负责，不能拿活跃配对的逐节记录覆盖冻结侧车。


## 3. 冻结归档与可信历史

只有完整实现、低未来指导价值且仍有历史价值的记录可以归档。仍有用的安全、持久化、兼容、所有权、替代方案或重引入条件保持活跃；proposed 永不归档。纯机械/小 UI 旧记录的删除、rejected 保留价值和完全合并删除按[生命周期规则](rationale-process-1.md#rationale-process-1-agent-note-lifecycle)评审。

完成合规移动后，本地运行：

```bash
node .agents/skills/harness-project-governance/tools/agent-notes/verify-archived-agent-notes.mjs --write
node .agents/skills/harness-project-governance/tools/agent-notes/verify-archived-agent-notes.mjs
```

`--write` 先核对所有既有 seal 和真实文件，再只追加新三元组哈希；不是覆盖、修复旧历史或批准修改的开关。完整中英正文须有 implemented 状态、紧邻且一致的有效 Archived 日期，不能早于文件名日期。归档侧车格式为两个文件名各自对应当前 **Git blob SHA-1**；清单则是独立的 **SHA-256**，两者不能混用。错误元数据、不完整三元组、侧车漂移、旧 seal 改动/删除和不可读基线均非零退出，不写清单。恢复须还原历史字节或提供真实可读的受信基线，不能删清单再密封。

**首次封印的目标补强。** 搬移前，完整 implemented 三元组必须已存在于可信基线；新归档的三份活跃文件必须移走。执行器以基线 Git blob 比对两个语言文件，除了紧随 Status 的 Archived 行不允许任何字节变化，侧车只允许机械重录。若既有历史语料已提交但尚无 seal，基线中每份历史 artifact 都必须仍存在且字节相同；整组三元组消失也会拒绝。当前伪造空清单或新 seal 不会跳过库存与原文比对。缺原文、仍留活跃副本、历史缺失或正文变化均拒绝且不写清单。恢复须还原可信原字节，不得先提交被改写或删减的历史来制造“可信”基线。

可信基线的对象比对直接从已有 `git ls-tree -rz` 输出的完整对象 ID 推导格式：40 位为 SHA-1，64 位为 SHA-256，不额外调用 `rev-parse --show-object-format`。归档侧车仍按独立的旧式 SHA-1 blob 协议记录，清单仍为 SHA-256，不能用仓库对象 ID 直接替代侧车值。

**Git 版本边界。** 当前实际验证版本是 Git 2.48.1.windows.1；完整最低版本尚未通过旧二进制矩阵认证。SHA-1 路径不新增对象格式探测选项的版本要求，SHA-256 仓库则要求 Git 构建本身支持该格式（[Git 2.28 官方文档](https://github.com/git/git/blob/v2.28.0/Documentation/git-init.txt) 已记录条件支持）。[Git 2.29 文档](https://git-scm.com/docs/git-rev-parse/2.29.0) 也已记录 `--show-object-format`，但本模块不依赖该选项；能力故障注入不等于实际旧版本验证。

本模块继承源门禁的 LF 文本前提；采用方须在搬移前确认实际 Note/侧车与 Git 原文都为 LF，不能在归档时顺便规范化字节。源仓通过 `.gitattributes:1-7` 在 checkout 层保证这一点；其他 CRLF checkout 的兼容性尚未证明。未封印历史导入的库存保存以**所选可信基线已包含的文件**为界；它能拒绝当前整组遗漏，不能发现基线建立之前已经丢失的历史，也不证明 Git 基线、执行器或 CI 自身可信。

本地默认比较 committed `HEAD`；PR CI 必须以受信事件提供 `GOVERNANCE_ARCHIVE_BASE_REF`，checkout 完整历史后运行只读命令，不在 CI 自动 `--write`。例如现有 GitHub static job 的命令步骤：

```yaml
- name: Verify frozen Agent Notes
  env:
    GOVERNANCE_ARCHIVE_BASE_REF: ${{ github.event.pull_request.base.sha }}
  run: node .agents/skills/harness-project-governance/tools/agent-notes/verify-archived-agent-notes.mjs
```

该片段不是完整工作流：还要在同一真实 CI 路径准备 Node、安装 Skill、checkout `fetch-depth: 0`、重建必要空目录，执行前两条分类/格式及独立配对/链接检查。环境里的基线不能由 PR 自行选择；若规则程序、清单或 CI 自身可未经受信评审修改，单个脚本仍不能证明历史保护。

源仓有三条针对一次特定 Figma 链接移除的精确 old→new seal 授权。该批准只属于源仓，**不会随包授予其他项目**：迁移执行器默认对所有目标旧 seal 严格追加。目标若需要历史更正，须有独立明确授权及受信、精确、可审计的变更流程；本模块没有通用解封开关。

## 4. 验证与维护边界

本地退出1只说明程序拒绝；只有真实 required CI 和平台保护拒绝了合并，才算远端阻断。首次接入至少保存合法语料通过、非法生命周期/状态拒绝、篡改已密封内容拒绝、还原恢复，以及可信基线不可用、缺少可信 implemented 原文、任一活跃三元组成员未移走、未封印历史整组三元组遗漏和伪造当前清单时拒绝的真实输出；确认拒绝时未写清单。还需在获授权隔离环境证明 CI/平台层，不能从文件存在推断。

生成器保留类型擦除、导入后缀、目标 cwd、基线变量名及源专用 seal 授权隔离，并加入上述首次搬移、既有未封印历史的完整库存/原字节比对。这是目标补强，不是源校验器已有能力。升级时核对源义务和生成绑定，保留目标自己的 Note、清单、授权与 CI 保护；不要覆盖目标语料。归档不可修正文时，在活跃 owner 写勘误并链接历史。

来源：固定提交 `AGENTS.md:155`、`.agents/notes/README.md:7-125`、`.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:1-45`、`scripts/{agent-note-tree,verify-agent-note-classification,verify-agent-note-format,archived-agent-notes,verify-archived-agent-notes}.ts`；源 CI 关系见 `package.json:122-124`、`scripts/run-gates.ts:852-854`、`.github/workflows/ci.yml:104-107`。这是实际程序的迁移，不是来源 Testing 段落的通过声明。
