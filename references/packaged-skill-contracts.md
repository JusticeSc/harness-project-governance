# 打包技能合同：从源码机制到可迁移实现

> 证据基线：DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。文中 `deepseek-harness/<path>:<start>-<end>@687f282e` 指向源仓库中的实际行号；迁移设计段落是建议，不冒充源义务。本域没有运行任何测试、构建、生成器或远程操作，所有“验证”默认是待执行计划。

本参考面向“随产品打包的技能（packaged product skills）”：它们有 provider、`source`/`provider`/`rank`/`resourceBase`，会被 `skill` 工具渲染给模型，并受发布包与安装流程约束。仓库内 `.agents/skills/**` 的治理技能是另一类对象；`tests/fixtures/**` 下的 SKILL.md 只是夹具，不构成第二套技能系统。

## 读者触发索引

| 你正在做什么 | 先读 |
|---|---|
| 新增/修改任何 SKILL.md，担心被工具结果裁剪 | [渲染预算](#packaged-skill-contracts.render-budget) |
| 在正文里引用 references/templates，或新增 icon/locale | [资源完整性](#packaged-skill-contracts.referenced-resource-integrity) |
| 维护可复制的插件/预设/MCP 模板 | [模板解析与复制](#packaged-skill-contracts.template-parse-and-copy) |
| 让模型读取技能文件，或想禁止读源码 | [禁止 shell 路由](#packaged-skill-contracts.no-shell-file-routing) |
| 设计多格式/多操作技能族 | [Office 路由与渐进加载](#packaged-skill-contracts.office-router-progressive) |
| 写文档/表格/演示的内容与交付步骤 | [Office 创作与交付](#packaged-skill-contracts.office-authoring-delivery) |
| 决定何时做视觉检查、预览空白怎么办 | [视觉升级与止损](#packaged-skill-contracts.office-render-escalation) |
| 需要下载 LibreOffice sidecar | [Sidecar 同意与安装](#packaged-skill-contracts.office-sidecar-consent) |
| 注册技能资产失败或 frontmatter 报错 | [无效资产拒绝](#packaged-skill-contracts.invalid-asset-rejection) |
| Windows sandbox 出现非预期文件访问拒绝 | [Windows ACL 一次修复](#packaged-skill-contracts.windows-acl-one-shot-repair) |
| 区分模型加载与用户 `/name` 注入 | [调用策略](#packaged-skill-contracts.invocation-policy) |
| 同一技能既有仓库发现路径又要发布 | [单一来源与分发](#packaged-skill-contracts.single-source-distribution) |
| 创建/启用/调试插件、预设、UI、MCP | [插件创建流程](#packaged-skill-contracts.plugin-creator-procedure) |
| 维护可安装插件包列表 | [生成式包索引](#packaged-skill-contracts.generated-package-index) |
| 写模型可见工具定义/参数/系统提示 | [工具定义卫生](#packaged-skill-contracts.tool-definition-hygiene) |

## 三类对象先分清（分类前置）

源仓库里出现的 `SKILL.md` 至少有三类，义务不同：

1. **打包产品技能**：`packages/preset/agent-preset/skills/**`、`packages/skill/skill-office/assets/**`、`packages/sandbox/sandbox-windows-acl/assets/**`。由包内 provider 注册，设置 `source: 'bundled'`、provider 名与 `rank: BUNDLED_SKILL_RANK`（600），并通过 `resourceBase` 暴露旁路资源。它们承担渲染预算、资源存在/打包、调用策略与发布验证义务。证据：`deepseek-harness/packages/skill/skill/src/index.ts:23-33@687f282e`、`deepseek-harness/packages/skill/skill-office/src/index.ts:69-95@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/src/acl-skill.ts:44-76@687f282e`。
2. **仓库治理技能**：`.agents/skills/**`，由 skill-filesystem 从仓库根发现，服务开发者。它们有自己的跨产品元数据门禁（`agents/openai.yaml` 与 frontmatter 策略对齐），该门禁不扫描打包资产。证据：`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e`。
3. **测试夹具**：例如 `packages/experimental/webworker-runtime/tests/fixtures/vfs-example/workspace/.agents/skills/preview-tour/SKILL.md`，全文 8 行，只证明 dot 目录能随镜像打包。它没有 provider、发布义务或预算测试，不得计入 12 个产品技能头（13 个 SKILL.md 头中有 1 个是夹具）。证据：`deepseek-harness/packages/experimental/webworker-runtime/tests/fixtures/vfs-example/workspace/.agents/skills/preview-tour/SKILL.md:1-8@687f282e`。

**迁移建议（非源义务）**：在目标仓库的覆盖清单中给每个 SKILL.md 标注 `product | repository-governance | fixture`，并在 CI 中按类别选择检查器；不要让夹具继承发布预算，也不要让仓库治理门禁冒充产品门禁。

---

## 渲染预算：8192 码点与更紧的家族预算 {#packaged-skill-contracts.render-budget}

**触发**：新增/修改 SKILL.md；新增整文件 references；正文接近阈值；调整标准 preset 的 pruner 配置。

**源义务**
- 标准 preset 的 `tool-result-pruner` 配置为 `thresholdChars: 8192`、`headChars: 4096`、`tailChars: 1024`；超过阈值的工具结果会被裁尾。证据：`deepseek-harness/packages/bundle/web-app/presets/standard.patch.yml:76-83@687f282e`。
- 创作者技能的完整渲染（`renderSkillContent` 的 `<skill_content>` 包装、资源提示与正文）必须严格低于 8192 个 Unicode 码点；测试用 `codePointLength(rendered)`，不是 `.length` 或字节数。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:20-26@687f282e`、`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:71-81@687f282e`、`deepseek-harness/packages/skill/skill/src/index.ts:170-203@687f282e`。
- `references/` 整文件按 read 工具会渲染的 `行号: 文本` 形式计算长度，也必须低于 8192 码点。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:82-90@687f282e`。
- Windows ACL 诊断技能正文额外要求 `< 7_000` 字符，为工具包装留余量。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/acl-skill.spec.ts:36-43@687f282e`。
- Office 家族使用渐进预算：router 的 `description` ≤ 50 token、正文 ≤ 200 token（`Math.ceil(length/4)`）；docx/pptx/xlsx 正文的新 token 数 ≤ floor(上一版 token 数 × 0.65)（基线 1688/1879/2330），且不得含 `read_image|transparent|DPI` 或 `dsoffice`，必须含 `office-render`。证据：`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:20-37@687f282e`。
- 发布说明也明确“每个 shipped SKILL.md 渲染后保持在 8192 字符阈值之下”。证据：`deepseek-harness/packages/preset/agent-preset/README.md:48-52@687f282e`。

**步骤**
1. 去掉 frontmatter，得到 `skill` 工具真正返回的正文。
2. 用产品同款包装估算完整渲染长度（含资源提示与标签）。
3. 对每个 references 文件按“行号前缀”形式估算。
4. 超限时把长表格、模板、排障细节迁到按需读取文件；正文只留触发、顺序、完成标准。
5. 重新测量并记录码点数/token 估计。

**负责角色**：技能所有者；评审者复核拆分是否让发现路径仍然清楚。

**完成信号**：对应测试通过，且交付说明记录测量值与迁移去向。

**失败处理**：不要把包装缩短、不要把 frontmatter 算进正文、不要删掉资源提示来“压线”；应拆分内容。若运行时 pruner 阈值被改，应同步更新测试常量和文档。

**例外**：测试夹具不受预算约束；纯仓库治理技能若从不经过该 pruner，也不构成硬约束。

**证据限制**：未运行测试；8192 只对标准 preset 成立；其他 preset 需按实际配置复核；token 估算不是真实分词；`codePointLength` 实现未阅读。

---

## 引用资源的存在性、可发现性与打包完整性 {#packaged-skill-contracts.referenced-resource-integrity}

**触发**：正文新增 `references/...`/`templates/...` 引用；新增模板 manifest、locale、icon、客户端文件；把技能搬到 Desktop/SEA；provider 以目录作为 `resourceBase`。

**源义务**
- 正文中每个反引号 `references/<file>` 或 `templates/<file>` 必须在技能目录真实存在；测试用正则提取并 `statSync`。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:71-81@687f282e`。
- 模板的每个非通配 export、每个 locale 文件与 bundle patch 必须在正文 Read next 表被点名；测试断言正文包含 `templates/<name>/<file>`。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:105-134@687f282e`。
- `files` 必须覆盖 patch、locale、icon 与全部运行时文件；通配符要匹配实际路径。发布包还应核对真实 packed file list。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:20-42@687f282e`。
- `exports` 暴露 `./locale/*.json` 与 `./icon`；子路径插件用 `./<subpath>/locale/*.json` 与 `./<subpath>/icon`。图标支持 SVG/PNG/JPEG/WebP，≤256 KiB，必须在包内；绝对路径、URL、逃逸符号链接被拒绝。缺失字段回退到 package.json 的 name/description，畸变元数据产生诊断并保留有效文本。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:20-42@687f282e`。
- 技能正文必须说明“技能 base directory”“不要枚举该目录”“按需读取”“复制到工作区后再用”。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:36-50@687f282e`。
- provider 必须提供可解析的 `resourceBase`：Office 用绝对目录并把分隔符统一为 `/`；ACL 技能把 SKILL.md 与 .ps1 复制到自有临时目录（`flag: 'wx', mode: 0o600`），因为技能资源目录会在卸载时删除。证据：`deepseek-harness/packages/skill/skill-office/src/index.ts:69-95@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/src/acl-skill.ts:44-63@687f282e`。
- 工作脚本、中间文件、最终文档只能放任务工作区；运行时与技能目录是只读共享资源。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:8-12@687f282e`。
- 技能资源与执行工具必须位于同一主机；跨主机拆分资源与 Node/CLI 会使操作技能无法工作。证据：`deepseek-harness/packages/skill/skill-office/README.zh.md:42-42@687f282e`。

**步骤**
1. 列出正文反引号资源引用与 Read next 表行。
2. 逐路径解析并确认是普通文件。
3. 检查模板 `package.json` 的 `exports`、`files`、`dsh.bundle.patch`、locale/icon。
4. 检查 provider 的 `resourceBase` 与 ASAR/SEA 下的复制策略。
5. 在安装后的形态核对实际文件清单与渲染图标。

**负责角色**：技能所有者；发布核对者复读 packed 清单。

**完成信号**：资源测试通过 + 安装后能读到文件 + 图标渲染正确。

**失败处理**：缺文件就补回并在正文点名；未打包就修 `files`/`exports`；ASAR 不可读就改用 Host 复制或临时目录。

**例外**：可丢弃夹具或显式要求无元数据包可省略展示资源，但必须逐项解释；Host-only/configuration-only bundle 仍有可见 inventory 条目。

**证据限制**：测试只看源码树，不看真实 tarball/ASAR；`verify-package-meta` 实现未读；图标大小/格式限制来自指令文本，未看到对应断言。

---

## 模板可解析、可复制、不得原地执行 {#packaged-skill-contracts.template-parse-and-copy}

**触发**：新增/修改 `templates/**`；模型按技能复制模板；模板安装或 Loader 激活失败。

**源义务**
- 每个模板目录必须有 `package.json`，其 `dsh.bundle.patch` 指向的 YAML 必须能被 Loader 的 `entryListSchema` 解析为数组。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:92-103@687f282e`。
- 模板中所有 `.js` 必须通过 `node --check`；manifest 必须是合法 JSON。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:92-103@687f282e`。
- 先把模板文件读取并复制到工作区目录，再修改、安装；绝不在技能目录内安装或语法检查。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:36-50@687f282e`。
- Desktop 的技能目录在 `app.asar` 内，shell、glob/search、`node`、`pnpm` 都无法打开；必须用文件读取/写入工具。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:38-46@687f282e`。
- 模板文本与图标必须改写为实际能力，不能留模板文案。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:20-42@687f282e`。

**可复制模板的最小结构**
- decoration：`package.json` 同时声明 `exports`（`.`、`./client`、`./locale/*.json`、`./icon`）、`files`、`dsh.bundle.patch` 与 `dsh.client`（`platform: "web"`、`immediately: true`、`inject`）；`client.js` 用 `window.__ModuleLoader__.load({ id, factory })`，在 `factory` 内 `ctx.slots.inject('conversation.composer.dock', ...)`。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/templates/decoration/package.json:1-21@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/templates/decoration/client.js:1-22@687f282e`。
- MCP：配置型 bundle 无 Host/Client 入口；patch 插入 `@deepseek-ai/dsh-mcp-client`，`serverName`、`transport: streamable-http`、`url`、`failOnStartupError: true`。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/templates/mcp/cordis.patch.yml:1-8@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/templates/mcp/package.json:1-9@687f282e`。

**步骤**：选模板 → 文件读取全部内容 → 文件写入工作区新目录 → 改名称/patch/locale/icon/运行时 → JSON/YAML 解析 + `node --check` → `install_bundle` 安装 → 读 `application`/`warnings`。

**负责角色**：模板维护者保证源文件可解析；执行者保证复制后仍可解析。

**完成信号**：模板 parse 测试通过；工作区副本安装后 `application: applied`；live 能力可见。

**失败处理**：源文件错误修源文件并重跑测试；模型改写错误回到工作区副本修正；不要在技能目录原地改。

**例外**：无；可按请求增删字段，但 parse 与复制后安装不变。

**证据限制**：`node --check` 只查语法；未验证模块解析/React 运行时/Loader 激活；未在 Desktop/ASAR 实测。

---

## 禁止用 shell 读取技能文件，也禁止封杀源码阅读 {#packaged-skill-contracts.no-shell-file-routing}

**触发**：编写技能正文的文件访问指令；运行环境是 Desktop/打包应用；正文出现“不要读源码”。

**源义务**
- 技能 Markdown 不得出现 `` `cat ` ``、`` `cp ` ``、`` `ls ` `` 这类反引号命令；测试正则 `\`(cat|cp|ls) ` 拒绝。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:136-145@687f282e`。
- 正文必须说明：用文件读取工具读技能文件，用文件写入工具复制到工作区，并用读回验证副本；在所有部署（含源码 checkout）都如此。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:36-50@687f282e`。
- 不得写“do not read DSH sources / package sources”；测试正则 `/do not read (DSH |package |DSH package )?sources/i` 拒绝。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:136-145@687f282e`。
- Desktop 中 `app.asar` 只有 Host 进程自己的文件读取能打开；shell、glob/search（原生 ripgrep）、`node`、`pnpm` 都会失败。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:38-46@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md:10-14@687f282e`。

**步骤**：搜索三类命令与英文禁令 → 改成显式“file-read tool / file-write tool”步骤 → 写明 ASAR 限制与复制顺序 → 区分“读技能文件”和“执行任务命令”。

**负责角色**：技能作者；评审者补充 PowerShell/ripgrep 等正则未覆盖写法。

**完成信号**：扫描测试通过；在 ASAR 环境实际读取一次成功。

**失败处理**：命中即改；未命中的错误写法在 ASAR 中表现为工具失败，需按部署环境复现。

**例外**：可以指导用 shell 执行 LibreOffice Kit CLI、`node --check` 等任务命令；限制只针对读取技能自身文件。

**证据限制**：正则只覆盖 `cat`/`cp`/`ls` 三个小写命令，`Get-Content`、`type`、`rg`、`tar` 未覆盖；英文禁令只覆盖特定措辞；未实测 ASAR。

---

## Office 路由技能与渐进加载预算 {#packaged-skill-contracts.office-router-progressive}

**触发**：创建/编辑/检查/转换 Office 文档；需要图片或视觉检查；需要刷新公式或导出 PDF；新增 Office 能力。

**源义务**
- `office` 只做路由：正文说明先用 `skill` 工具加载对应格式技能，并分派 docx/pptx/xlsx/render/recalculate/export-pdf；不复制各格式库用法。证据：`deepseek-harness/packages/skill/skill-office/assets/office/SKILL.md:1-15@687f282e`。
- 独立操作技能（render/recalculate/export-pdf）无需先加载 router；显式 `/office-xlsx` 调用不应带出 router。证据：`deepseek-harness/packages/skill/skill-office/tests/progressive-loading.spec.ts:92-114@687f282e`。
- router `description` ≤ 50 token、正文 ≤ 200 token；docx/pptx/xlsx ≤ floor(上一版 × 0.65)（基线 1688/1879/2330），不含 `read_image|transparent|DPI`/`dsoffice`，必须含 `office-render`。证据：`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:20-37@687f282e`。
- 新文件、内容编辑、公式和附带基础格式默认不触发渲染；只有视觉/外观目标才加载 `office-render`。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:34-40@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:44-52@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:58-64@687f282e`。
- 用户明确要求跳过渲染时必须遵守；不要重复加载已加载技能。证据：`deepseek-harness/packages/skill/skill-office/assets/office/SKILL.md:15-15@687f282e`。

**渐进加载的实际断言**：native 与 ptc 两种模式下，第一次请求含 router 与 `office-docx` 名称；加载 router 后请求含 “Office task routing” 但不含 `python-docx`；加载 authoring 后含 `python-docx` 与 `office-render`，不含 `dsoffice` 或 render 内部细节；resume/fork 保留这些指令；直接加载三个操作技能时只含 `libreofficeKit` 与对应内容。证据：`deepseek-harness/packages/skill/skill-office/tests/progressive-loading.spec.ts:78-114@687f282e`。

**步骤**：判定任务类别 → 按 router 选格式/操作技能 → 只加载当前需要者 → 内容与结构检查 → 按外观条件决定是否 render → 不重复加载。

**负责角色**：Office 技能维护者设计分派；执行者按分派加载。

**完成信号**：请求内容断言符合“加载了什么/没加载什么”；任务按格式技能完成。

**失败处理**：router 过胖则把细节移回格式技能；操作技能互相泄漏则拆正文；模型选错则改 description/触发词并重测。

**例外**：用户显式跳过渲染；显式 `/name` 调用作者技能时不需要 router。

**证据限制**：token 是 `length/4` 估算；未运行测试；未验证真实模型总按 router 选择。

---

## Office 内容创作、校验与交付纪律 {#packaged-skill-contracts.office-authoring-delivery}

**触发**：创建/读取/编辑 docx/xlsx/pptx；需要保留格式、公式、图表或宏；准备交付。

**源义务**
- 默认用 `load_workspace_dependencies` 返回的 Python 与其捆绑库（python-docx/openpyxl/pandas/python-pptx）；不安装包、不找系统 Python。用户或 AGENTS.md 明确要求其他环境时从其要求。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:8-8@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:8-8@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:8-8@687f282e`。
- 脚本、中间文件、最终文件只在任务工作区；运行时与技能目录只读。脚本按任务命名（`edit_docx.py`），避免 `inspect.py`、`docx.py`、`zipfile.py` 等遮蔽库名。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:10-12@687f282e`。
- 默认保存新文件，除非用户要求原地编辑；重新打开验证请求内容、相关格式与必须保留的未改动内容。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:14-40@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:44-52@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:58-64@687f282e`。
- DOCX：按文本/位置定位目标，只检查 runs 与格式；不要用段落 `.text` 赋值破坏 run 格式；不要伪造修订/批注；直接写 package parts 时新建 ZIP，每个未改成员只复制一次。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:14-32@687f282e`。
- XLSX：公式用 `data_only=False` 保留；写入公式不会计算；`data_only=True` 只返回可能缺失/过期的缓存；需要刷新时加载 `office-recalculate`，不得用常量替换请求的公式；DataFrame 不是工作簿，不要覆盖既有文件；不要仅改扩展名处理 `.xls`/`.xlsb`/加密/宏文件。证据：`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:16-42@687f282e`。
- PPTX：只改请求内容，保留混合文本格式；重建幻灯片可能丢失动画/SmartArt；图表内嵌工作簿属于交付物；居中对齐需同时处理段落与文本框。证据：`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:16-56@687f282e`。
- 交付调用 `present`，`files` 数组的 `path` 指向实际最终文件；不交付中间脚本/报告，除非用户要求；`present` 不可用时用会话支持的文件交付方式。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:40-40@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:52-52@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:64-64@687f282e`。
- 重算/导出失败时保留可用源文件并报告限制；不反复转换未变源，不用转换排查失败预览。证据：`deepseek-harness/packages/skill/skill-office/assets/office-recalculate/SKILL.md:14-18@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-export-pdf/SKILL.md:14-18@687f282e`。

**步骤**：确认环境 → 读取目标结构 → 在副本上最小修改 → 保存新文件 → 重开验证 → 按条件调用 render/recalculate/export-pdf → `present` 交付。

**负责角色**：执行者；请求发起者验收。

**完成信号**：重开验证通过；交付的是最终文件路径；报告已完成的检查范围。

**失败处理**：格式丢失/公式未计算时从原始文件重做；不要用常量或覆盖原文件“修复”；交付前报告未覆盖风险。

**例外**：用户明确要求原地编辑；用户/AGENTS.md 指定其他库或环境；纯 PDF 导出或纯重算只需对应操作技能。

**证据限制**：未运行 docx/xlsx/pptx 端到端验证器；`load_workspace_dependencies` 实现未读；LibreOffice 兼容性由引擎决定。

---

## 视觉升级、空白预览止损与单句状态 {#packaged-skill-contracts.office-render-escalation}

**触发**：用户要求图片/视觉检查；任务主要目标是布局、间距、颜色、对齐、字号；渲染返回空白/透明图；模型不接受图片输入。

**源义务**
- 外观类目标必须加载 `office-render` 并检查变更页，即使没有单独视觉请求；用户明确跳过时例外。证据：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:36-38@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:46-50@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:60-62@687f282e`。
- 新文件、内容编辑、公式与附带基础格式不因这些原因触发渲染。证据：`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:48-50@687f282e`。
- 检查用预览必须创建私有、唯一命名的临时父目录，并把尚不存在的子路径作为 `--output-dir`；POSIX 用 `mktemp -d "./.dsh-office.XXXXXXXX"`，PowerShell 用 `.dsh-office-` + GUID；完成后只删该父目录，绝不用固定名或删工作区；报告用文本，回复不得链接或嵌入已删除的预览图。证据：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:12-16@687f282e`。
- 命令成功或图片读取成功不等于可用预览；必须检查裁剪、对齐、标题、表格宽度、对比度、图表标签、数字格式。证据：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:23-24@687f282e`。
- 有内容的文档渲染出全透明/均匀空白图像 = 渲染器失败；检查一次即可，不得重读同一图像。空白后立即停止该任务视觉检查：不再次渲染/读取，不换范围/页/sheet/DPI/格式/诊断导出/打印设置，不改环境修复。证据：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:25-28@687f282e`。
- 内容与结构检查通过时，视觉状态只写恰好一句：英文 “Content and structure checks passed; visual inspection was not completed.” 或中文 “内容与结构检查通过；视觉检查未完成。” 不加 bullet、不解释停止、不描述像素；不得说“全部检查通过”或“视觉已验证”。证据：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:29-30@687f282e`。
- 当前模型不接受图片时，完成内容/结构检查并报告视觉不可用；请求的图片导出仍可交付。证据：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:10-10@687f282e`。

**步骤**：判定外观触发 → 确认图片能力 → 保存最终文件 → 用绝对 node/cli 调用 render（精确 pages/sheet/range）→ 读 manifest + 图片检查具体项 → 空白则一次检查后停止并写单句状态 → 按需交付文件。

**负责角色**：执行者；请求发起者决定是否接受视觉未完成。

**完成信号**：视觉项检查完成，或按规则停止并给出规定单句；内容/结构失败单独报告。

**失败处理**：空白后停止，不重试；命令失败时保留源文件与已请求输出；不要搜替代渲染器或改环境。

**例外**：用户明确跳过渲染；纯图片导出可交付图片但不声称布局检查完成。

**证据限制**：空白止损与措辞没有自动测试；未运行渲染/图片检查；模型图像能力需运行时探测。

---

## Sidecar 缺失时的用户同意与安装边界 {#packaged-skill-contracts.office-sidecar-consent}

**触发**：render/recalculate/export-pdf 需要 sidecar 但缺失；`dsoffice` 不在 PATH；安装失败或平台不匹配。

**源义务**
- 先检查现有 LibreOffice Kit 安装能否服务任务；PATH 上没有 `dsoffice` 不等于 sidecar 缺失。证据：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:3-3@687f282e`。
- 确实缺失且用户未授权时，用可用提问工具询问是否下载；工具不可用时在对话中询问；等待明确同意后才下载/安装；用户拒绝时继续不依赖引擎的工作并报告不可用。证据：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:3-3@687f282e`。
- 同意后安装 `@deepseek-ai/libreoffice-kit` 与匹配 engine，版本取主包 optional dependencies。证据：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:5-5@687f282e`。
- 在任务本地 tools 目录用 npm/pnpm 安装，带 `--ignore-scripts`；cache/store 也放该目录（npm 用 `--cache <task-tools-directory>/.npm-cache`）。证据：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:5-5@687f282e`。
- 平台映射：Windows x64 → `@deepseek-ai/libreoffice-kit-win32-x64`；Windows ARM64 → `...-win32-arm64`；macOS Apple Silicon → `...-darwin-arm64`；macOS Intel → `...-darwin-x64`；无匹配原生包（含 Linux）→ `...-wasm`。优先原生；WASM 需其包支持当前平台；安装前检查平台限制。证据：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:7-15@687f282e`。
- 复用 `load_workspace_dependencies` 的 Node/pnpm 或用户配置版本；下载许可不含安装 Python/Node/包管理器；缺前置时解释。按路径运行 `dsoffice` 或 `lib/cli.js`，不假设 PATH 更新；继续前检查 `dsoffice capabilities`。证据：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:17-17@687f282e`。
- 不得调用系统 soffice、npx、安装替代渲染器或构建替代管线绕过已安装 sidecar 的失败。证据：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:8-8@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-export-pdf/SKILL.md:8-8@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-recalculate/SKILL.md:8-8@687f282e`。

**步骤**：探测现有能力 → 缺失则提问并取得同意 → 平台/架构选包 → 任务本地安装（`--ignore-scripts`、本地 cache）→ 绝对路径运行 → `dsoffice capabilities` → 执行原操作。

**负责角色**：执行者；用户授权。

**完成信号**：`dsoffice capabilities` 成功，原操作完成。

**失败处理**：安装失败/平台不匹配时保留源文件、清理失败产物、报告所需平台/前置；不切换系统渲染器。

**例外**：已有可用安装无需下载；用户拒绝时只做不依赖引擎的工作。

**证据限制**：未实际安装/运行；版本与平台矩阵来自指令文本；用户同意流程依赖具体会话工具；没有自动检查 `--ignore-scripts` 是否传入。

---

## 无效技能资产在注册前拒绝 {#packaged-skill-contracts.invalid-asset-rejection}

**触发**：新增/移动资产目录；修改 frontmatter；配置 `assetRoot`；卸载/重新加载。

**源义务**
- `assetRoot` 必须是绝对目录；相对路径在注册前抛 `assetRoot must be an absolute directory`。证据：`deepseek-harness/packages/skill/skill-office/src/index.ts:69-72@687f282e`、`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:150-153@687f282e`。
- 每个技能目录必须有 SKILL.md；缺失时抛错并包含路径。证据：`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:154-157@687f282e`。
- SKILL.md 必须以 YAML frontmatter 开头且解析为对象；缺失/未闭合/非对象都拒绝。证据：`deepseek-harness/packages/skill/skill-office/src/index.ts:37-45@687f282e`、`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:158-166@687f282e`。
- `description` 必须是非空字符串；空、null、标量、数字等一律 `has no description`。证据：`deepseek-harness/packages/skill/skill-office/src/index.ts:41-44@687f282e`、`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:167-184@687f282e`。
- frontmatter 解析必须支持引号、折叠块与 CRLF；正文中类似元数据的行不得被误当 frontmatter。证据：`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:121-143@687f282e`。
- 注册原子：任一资产无效时不得留下部分候选；失败后 `ctx.skills.list()` 为空。证据：`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:185-186@687f282e`。
- provider 卸载移除候选与自有资源副本；ACL 技能把资源复制到临时目录并在 dispose 删除，重新挂载重新注册。证据：`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:39-62@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/skill-composition.spec.ts:1-63@687f282e`。
- 操作技能的 node/cli 路径在加载时校验：绝对路径且是文件；SEA/Electron 未提供 standalone Node 时拒绝；`cli: false` 明确禁用并在正文说明。证据：`deepseek-harness/packages/skill/skill-office/src/index.ts:47-66@687f282e`、`deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:187-207@687f282e`。
- ACL 技能从提取资源加载时，缺失 frontmatter/非对象/空 description 都拒绝。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/acl-skill.spec.ts:56-69@687f282e`。

**步骤**：注册前读取并解析每个 SKILL.md → 校验绝对路径/文件存在/frontmatter 对象/非空 description → 构造候选并统一 resourceBase → 失败前抛错 → 断言目录为空 → dispose 清理临时资源。

**负责角色**：provider 维护者；资产作者修复格式。

**完成信号**：有效资产全部注册；无效资产整批拒绝且无残留；卸载后目录与资源消失。

**失败处理**：修路径/frontmatter/description 后重试；不要加空描述回退或部分注册。

**例外**：`cli: false` 是显式禁用，不是无效资产；正文应显示 disabled 说明。

**证据限制**：未运行测试；YAML 边缘行为未逐项验证；`mode: 0o600` 在 Windows 的语义未验证；打包后缺失路径未覆盖。

---

## Windows ACL 诊断：一次运行内诊断、修复、验证与回滚 {#packaged-skill-contracts.windows-acl-one-shot-repair}

**触发**：Windows 上 DSH sandbox 出现非预期拒绝（工作区写入/列目录失败，或本应可读的路径读不了）；sandbox 在工作区根报告 provisioning 失败。

**源义务（安全边界）**
- 脚本没有模式开关：`-Path`、`-AllowRoot`、`-Out` 一次读取路径与祖先并修复；不得拆成诊断+修复，不得为同一次修复询问两次。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:10-16@687f282e`。
- `-Out` 必须持久且用户自有，优先放失败工作区旁；绝不能用技能资源目录（卸载时删除）；一次调用只传一个路径。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:24-25@687f282e`。
- 必须在非受限上下文运行并请求一次审批；受限运行会把 sandbox 自身限制误报为缺权；非受限不等于提权，禁止 UAC/runas。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:27-31@687f282e`。
- 只诊断非预期拒绝；工作区外写入、read-only 写入、受限 token `spawn EPERM`、ConstrainedLanguage 错误是预期拒绝，应解释。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:31-31@687f282e`。
- 每次 DACL 修改前备份（`acl-backup-<id>.json` + `.ps1` + `ROLLBACK`），修改后重读验证；只信 `verification`，不信 `completed`。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:339-399@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:39-40@687f282e`。
- 失败/拒绝/验证失败时按逆序恢复本次所有已尝试 DACL 修改并停止；不重复调用；不手工删除 deny ACE。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:735-798@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:45-53@687f282e`。
- `RECAP` 是 stdout 尾部必读摘要；完整记录在 `acl-report-*.jsonl`。`nextAction`：`verify_original_confined_operation`、`stop`、`restore_pending_then_stop`。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:33-43@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:745-796@687f282e`。
- deny ACE 存在本身不证明因果，脚本永不删除 deny；DSH `S-1-4-*` grants 与 Everyone `DeleteSubdirectoriesAndFiles` deny 是预期项。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:43-43@687f282e`。
- 审批请求用用户语言的平实措辞：碰哪个文件夹、加入当前用户 full-control、移除外部包条目、文件内容与所有者不变、打印的恢复命令可撤销；不要出现错误码、`WRITE_DAC`/`WRITE_OWNER`、`S-1-15-2-*`、`icacls`、ACL/ACE、verdict 名称或开关。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:8-8@687f282e`。
- 提取的诊断脚本与恢复脚本用户可写，不得作为提权入口；诊断无法修复 Low 完整性标签、调用者缺少 `WRITE_DAC` 或非正常退出后的资源残留。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.zh.md:177-177@687f282e`。
- 停止的运行仍欠用户一个决定：阻塞对象与缺少的权利/ACE、改了什么/回滚了什么、按序恢复命令与报告路径；请用户临时切 full access（完全权限）并把会话作为反馈发出。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:53-55@687f282e`。

**源实现要点**
- `-AllowRoot` 约束所有修改：对象只能是该目录本身或严格位于其下；重解析点、盘符根、用户 profile 根、Windows 目录、`Packages`/`WindowsApps` 等受管应用树拒绝。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:236-275@687f282e`。
- 子树扫描上限 `SCAN_LIMIT = 2000`，只进目录，不进重解析点/受管树；报告 `truncated` 与不可读计数。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:58-74@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:277-321@687f282e`。
- 只写 DACL 与继承保护，绝不写 owner/group/SACL；`SET_NAMED_SECURITY_INFO` 用 `DACL_SECURITY_INFORMATION` + protection 标志。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:145-210@687f282e`。
- 撤销外部包 allow ACE 时按祖先优先排序；保留 deny ACE；恢复时只比较 own ACE 与保护状态（继承项随父级变化）。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:370-399@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:700-734@687f282e`。

**步骤**
1. 受限环境重复失败操作，确认症状；区分预期/非预期。
2. 用平实语言请求一次审批。
3. 非受限运行：`-Path <失败路径> -AllowRoot <授权目录> -Out <恢复目录>`。
4. 先读 `RECAP`，必要时查 JSONL 具体记录。
5. 按 `nextAction`：修复已验证 → 回受限环境重跑原操作；`stop` → 报告阻塞与恢复信息；`restore_pending_then_stop` → 按序运行恢复命令后停止。
6. 已修复但原操作仍失败 → 从新观察继续；更深路径仍拒 → 对该路径再运行一次同一命令（一次调用、一次审批）。

**负责角色**：执行者；用户审批与 full access 决策；权限/安全评审者。

**完成信号**：`verification grant/fix` 为 verified；`nextAction` 明确；原受限操作成功或已解释剩余原因。

**失败处理**：`REPAIR_REFUSED`/`GRANT_FAILED`/`FIX_FAILED` 触发逆序回滚并停止；回滚失败打印 `restore_pending_then_stop`，按序运行恢复命令。

**例外**：`-Restore` 只恢复一个路径且需要 `-AllowRoot` 与 WRITE_DAC；`-AllowRoot` 等于对象本身允许修复自身；用户拒绝审批则报告未诊断并停止。

**证据限制**：本域未运行测试；测试在非 Windows 或缺 pwsh 时跳过；未验证真实 UAC/提权场景；合成 `S-1-15-2-*` SID 不覆盖全部安装包形态；审批 UI 依赖具体产品。

---

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:126-175@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:176-243@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:244-297@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:298-376@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:377-420@687f282e`


## 模型选择加载与宿主注入的调用策略 {#packaged-skill-contracts.invocation-policy}

**触发**：frontmatter 声明 `disable-model-invocation`/`user-invocable`；模型调用 `skill`；用户输入 `/name`；技能目录变化。

**源义务**
- 每个技能有 `invocation: { modelInvocable, userInvocable }`；注册表保持 invocation-neutral，由消费边界过滤。证据：`deepseek-harness/packages/skill/skill/src/index.ts:44-54@687f282e`、`deepseek-harness/packages/skill/skill/src/index.ts:470-490@687f282e`。
- `disable-model-invocation: true` → `modelInvocable=false`；`user-invocable: false` → `userInvocable=false`；省略允许对应表面。只接受 YAML 布尔与大小写不敏感 true/false、yes/no、on/off、1/0；非法值丢弃整个技能并告警。证据：`deepseek-harness/packages/skill/skill-filesystem/README.md:36-38@687f282e`（跨域依赖，agent-workflows 已检查该实现）。
- 模型目录只列 `modelInvocable` 技能；`skill` 工具在加载前检查候选策略，加载后再次检查定义策略；被拒返回错误且不泄露正文。证据：`deepseek-harness/packages/skill/tool-skill/src/index.ts:140-150@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:905-1019@687f282e`。
- 目录只携带 name 与截断/归一化 description（默认上限 500 字符），不含 whenToUse/source/resourceBase/正文；durable `skill-catalog` 源记录用 entries 摘要判断重发。证据：`deepseek-harness/packages/skill/tool-skill/src/index.ts:256-320@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:239-334@687f282e`。
- `/name` 只扫描 `source.kind === 'user'` 的消息文本块；未知或 `userInvocable=false` 保持普通行文；正则要求空白边界，排除路径、分数、断边界。证据：`deepseek-harness/packages/skill/tool-skill/src/index.ts:196-232@687f282e`、`deepseek-harness/packages/skill/tool-skill/src/index.ts:411-433@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:1022-1128@687f282e`。
- `disable-model-invocation` 技能唯一入口是用户显式 `/name`；目录与 `skill` 工具永不暴露它。证据：`deepseek-harness/packages/skill/tool-skill/src/index.ts:176-179@687f282e`。
- 注入顺序：背景（工作区规则、runtime policy、目录）在前，被调用技能正文最后；源为 `skill-invocation`、`form: 'instructions'`；目录结尾提示遵循该块而不要再次调用。证据：`deepseek-harness/packages/skill/tool-skill/src/index.ts:196-232@687f282e`、`deepseek-harness/packages/skill/tool-skill/src/index.ts:256-320@687f282e`。
- 同名工具遮蔽时目录不附加到别的定义；工具被 restrict 掉时目录不出现。证据：`deepseek-harness/packages/skill/tool-skill/src/index.ts:222-230@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:751-789@687f282e`。
- get 加载后定义 name 与候选不一致 → 缓存失效并返回 undefined。证据：`deepseek-harness/packages/skill/skill/src/index.ts:500-535@687f282e`。
- PTC/程序化工具调用必须输出或返回完整的 `tools.skill(...)` 结果，说明才进入模型上下文；恢复/fork 使用既有会话历史与工具声明更新机制。证据：`deepseek-harness/packages/skill/skill-office/README.zh.md:90-90@687f282e`。

**步骤**：声明策略 → 模型侧列目录并按名加载（前后各查策略）→ 用户侧 `/name` 手势只从用户文本注入 → 目录变化用 entries 摘要重发 → 恢复/分叉从 durable entries 识别。

**负责角色**：registry/tool-skill 维护者；技能作者声明策略。

**完成信号**：目录与用户命令各自只显示允许的技能；被拒加载不泄露正文；注入位置正确。

**失败处理**：策略竞态时加载后再查并拒绝；目录摘要未变不重发；来源不合法不注入。

**例外**：`disable-model-invocation` 仍可用户显式调用；`user-invocable: false` 仍可由模型加载。

**证据限制**：未运行测试；frontmatter 解析实现在 skill-filesystem（跨域）；未验证真实模型是否总先加载；打包技能没有跨产品元数据门禁。

---

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:353-396@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:397-482@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:483-526@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:527-630@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:631-685@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:686-751@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:752-803@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:804-904@687f282e`


## 单一来源、别名分发与产品/仓库技能边界 {#packaged-skill-contracts.single-source-distribution}

**触发**：同一技能同时出现在 `.agents/skills/` 与包内 skills；修改 agent-experience；为测试创建 SKILL.md 夹具；给仓库技能加 Codex/Claude 元数据。

**源义务**
- agent-experience 唯一正文在 `packages/preset/agent-preset/skills/agent-experience/SKILL.md`；`.agents/skills/agent-experience/SKILL.md` 是相对符号链接，发布包放普通文件。证据：`deepseek-harness/packages/preset/agent-preset/README.md:52-52@687f282e`。
- 不得维护第二份正文；测试断言 canonical 是普通文件、alias 解析后指向 canonical，并从 package/repository 两个根加载到同一内容。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:41-69@687f282e`。
- Windows `core.symlinks=false` 会把链接物化为包含相对目标的普通文件；alias-not-copy 测试允许 `win32` 下非符号链接并要求内容解析后等于 canonical，但 repository-root 加载用例在该形态下跳过，package-root 仍加载。证据：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:44-53@687f282e`。
- 仓库发现 `agent-experience` 要求 checkout 启用符号链接；`core.symlinks=false` 时 Git 写纯文本，仓库发现不可用；创造模式使用包内普通文件，不依赖别名。证据：`deepseek-harness/packages/preset/agent-preset/README.zh.md:85-85@687f282e`。
- 打包技能由 provider 显式设置 `source: 'bundled'`、provider 名、`rank: BUNDLED_SKILL_RANK`（600）与 `resourceBase`；运行时 rank 250。证据：`deepseek-harness/packages/skill/skill/src/index.ts:23-33@687f282e`、`deepseek-harness/packages/skill/skill-office/src/index.ts:74-82@687f282e`。
- ACL 技能的资源复制目录是 provider 私有并在 dispose 删除；不得把仓库技能或夹具当资源来源。证据：`deepseek-harness/packages/sandbox/sandbox-windows-acl/src/acl-skill.ts:44-76@687f282e`。
- 测试夹具（preview-tour）只证明 dot 目录/打包行为，不承担发布、预算或调用策略义务；不得计入产品技能头。证据：`deepseek-harness/packages/experimental/webworker-runtime/tests/fixtures/vfs-example/workspace/.agents/skills/preview-tour/SKILL.md:1-8@687f282e`。
- 仓库治理技能与打包产品技能分属不同发现根；`verify-skill-invocation-metadata` 只检查 `.agents/skills/<name>` 下同时有 `agents/openai.yaml` 的仓库技能（frontmatter 对象、布尔键、Codex policy 布尔、两产品 manual-only 一致、manual-only 仍 user-invocable）。证据：`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e`。
- 打包产品技能没有等价跨产品门禁；需要时另行实现，不能声称现有脚本覆盖。证据：同上（脚本只扫描 `.agents/skills`）。

**步骤**：确定 canonical → 仓库发现路径只放相对链接/可物化别名 → 发布包放普通文件 → provider 设置 source/provider/rank/resourceBase → 夹具放 tests/fixtures 并在覆盖记录标非治理 → 仓库技能跑跨产品门禁，打包技能单独核对 frontmatter/调用策略。

**负责角色**：技能发布维护者；仓库治理维护者；测试维护者。

**完成信号**：双根加载同一内容；发布包形态正确；仓库门禁通过；夹具未被计入产品清单。

**失败处理**：删除第二份正文并恢复链接；修正 openai.yaml 对齐策略；修正 provider 元数据。

**例外**：Windows 无符号链接可物化；夹具可最小。

**证据限制**：未验证发布 tarball 中 agent-experience 是普通文件；未运行元数据门禁；本机 alias 是 70 字节普通文件（Windows 检出），非符号链接。

---

## 插件/预设创建技能的操作流程与交付标准 {#packaged-skill-contracts.plugin-creator-procedure}

**触发**：新增/启用/配置/调试插件、bundle、页面、面板、tool、MCP；创建/修改 agent preset；无其他目的地的视觉对象；设计评审。

**源义务**
- 用普通工作区文件编写 bundle，再通过 `plugin_manager` `action: install_bundle` 与绝对包目录安装；不要手写 profile 的 `package.json`/`cordis.patch.yml`、不要在 `$DSH_HOME` 下创建包、不要在 profile 目录跑 pnpm。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:7-10@687f282e`。
- 每个 `plugin_manager` 动作（含 `list_plugins`/`list_bundles`）在非 Full access 下都需审批；只在结果决定下一步时调用。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:10-11@687f282e`。
- 设计/评审只报告发现，不写文件/不安装/不改 profile（除非用户要求实现）。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:12-14@687f282e`。
- 启用 shipped plugin：查 shipped patch 的 disabled 行与原因，在工作区 bundle 中 override `disabled: false` 并插入依赖 Host 行；shipped 包从 dsh 安装解析，bundle 不声明依赖。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:16-18@687f282e`。
- 先交付可工作的最小版本，再做视觉细化；未指定视觉目的地是当前 Web UI；独立图片/HTML 不算完成。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:20-26@687f282e`。
- 知识来源顺序：`cordis_inspect_query`（Service/Event/Config/Tool/Slots/Theme）→ `Config.listConfigs` 返回的 `packageDir` 下 README → 构建后的 `lib/index.js` 与 `lib/types`/源码 checkout；不要从 `$DSH_PROFILE_DIR` 猜路径。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:28-34@687f282e`。
- 安装后读 `application` 与 `warnings` 判断是否生效，不看日志/进程列表/页面 boot payload；用免审批的 `cordis_inspect_query` 确认新行，而不是 `list_plugins`。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:22-24@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:44-70@687f282e`。
- `application: applied` 后实际执行能力或检查 live Client 注册；验证展示元数据与图标；使用已连接页面；恢复测试改动；报告验证限制。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:24-26@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/verification.md:1-7@687f282e`。
- 展示清单：locale title/description 描述实际能力；图标原创/有再分发许可；export `./locale/*.json` 与 `./icon`；`files` 覆盖运行时资源；不得留模板文案。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:20-42@687f282e`。
- 预设：声明行 config 必填 `id`（小写字母/数字/连字符）与 `plugins`，可选 name/description/order；Loader 行 id 约定 `preset-<id>`；override 替换完整 config，必须重述所有字段。证据：`deepseek-harness/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md:16-66@687f282e`、`deepseek-harness/packages/preset/agent-preset/src/index.ts:1-30@687f282e`。
- 旧版预设迁移：从 `$DSH_HOME/.agent-presets/<id>/` 读 `preset.yml` 与 `agent.cordis.yml`，按新 bundle 声明迁移，核对重命名插件，安装验证后删除旧目录。证据：`deepseek-harness/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md:68-70@687f282e`。
- Host/Client 分离：Host 提供共享服务；预设插件贡献 scoped tools/persona/prompt/policies；提供服务的预设插件把 provider 与 consumer 隔离在同一 realm；`!!js` 只用于 config 或 disabled。证据：`deepseek-harness/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md:76-80@687f282e`。
- UI 插件：slot 内渲染 React，不 iframe；只用 `--dsw-alias-*` token；不 require Harness Client 包；需要原语行为时从 DSH 源码、已安装 `lib/index.js` 或 live 页面复制 markup/CSS/behavior，类名加插件前缀，并保留 Modal 焦点/Escape、`role="switch"`/`aria-checked`、Tooltip 定位；`ctx.slots.inject/register` 并在 effect 清理。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/ui-plugin.md:1-13@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/practices.md:35-35@687f282e`。

**步骤**：解析结果/目的地 → inspect 最小 API → 复制模板或写文件 → 展示清单 + parse 检查 → install_bundle → 读 application/warnings → live 验证 → 恢复用户状态 → 报告限制。预设按声明/override/迁移流程走。

**负责角色**：执行者；用户审批；评审者。

**完成信号**：installed 能力在 live 环境可用；展示元数据/图标正确；预设在新会话激活；报告验证限制。

**失败处理**：`application` 非 applied 时修工作区 bundle 重装；`overridden` 调整层级；`restart-required` 重启后复验；`failed` 诊断。

**例外**：用户明确设计/评审时不安装；显式无元数据包可省略展示资源但需解释。

**证据限制**：未实际安装；`plugin_manager`/`cordis_inspect_query` 实现不在本域；审批语义来自技能正文；视觉验证依赖已连接页面。

---

## 生成式插件包索引与新鲜度门禁 {#packaged-skill-contracts.generated-package-index}

**触发**：包新增/删除/改名/描述变化；config-catalog 分类变化；查找可安装插件；doc-sync 失败。

**源义务**
- `references/packages.md` 是生成文件，头行标注 GENERATED、生成脚本与新鲜度命令；不得手改。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-composition-reference/references/packages.md:1-5@687f282e`。
- 生成器从 workspace manifest 与 config-catalog 的 `config`/`no-config` 条目收集，按 group 与包名排序，输出 group 分节表格。证据：`deepseek-harness/scripts/gen-plugin-packages.ts:1-60@687f282e`。
- `--check` 在提交文件过期时非零退出；`verify-plugin-packages` 是 `doc-sync` 的一部分。证据：`deepseek-harness/scripts/gen-plugin-packages.ts:3-4@687f282e`、`packages.md:3-3@687f282e`。
- seam（抽象 Service Definition）与 library（不导出插件）不进入 Loader 行列表。证据：`deepseek-harness/scripts/gen-plugin-packages.ts:20-22@687f282e`。
- 技能正文指导用 `grep -n <keyword>` 搜索该文件，而不是整文件读；列表外插件由 `plugin_manager list_bundles` 提供。证据：`deepseek-harness/packages/preset/agent-preset/skills/cordis-composition-reference/SKILL.md:27-29@687f282e`。

**步骤**：改 manifest/分类 → `pnpm run gen-plugin-packages` → `pnpm run verify-plugin-packages` → 技能按关键词 grep。

**负责角色**：agent-preset/技能维护者；包维护者。

**完成信号**：`--check` 退出 0；提交文件与 manifest 一致。

**失败处理**：撤销手改并重新生成；manifest 描述错误先修 manifest。

**例外**：实验包标 pre-stable 但仍进列表。

**证据限制**：未运行生成器/`--check`；`collectConfigCatalog` 未读；doc-sync 实际范围未知；packages.md 的 514 行、50 分组、259 行包条目来自机读结构计数（可由生成器重算），未逐行语义阅读，计数随生成变化而不是稳定契约。

---

## 模型可见工具定义与上下文预算卫生 {#packaged-skill-contracts.tool-definition-hygiene}

**触发**：新增/修改模型可见工具名称、描述、参数 schema 或系统提示段；设计技能/上下文加载/多步工作流；发现重复搜索/读取。

**源义务**
- 最小上下文优先：先目的、可用动作、约束；详细说明按需加载。
- 每个延迟资源有清晰描述与可靠获取方式；关键约束（权限、破坏性效果、必需验证）出现在相关动作前。
- 优先有界输出：简洁结果 + 可检索标识/路径，不倾倒日志/文档。
- 利用局部性：结果附带有界相关上下文（如线程回复带前几条消息）；显式标记省略/截断并提供获取更多的方法。
- 评估总工作量：节省上下文只有在不导致更多搜索/重复读取/错误时才有价值。
- 工具定义：删除可从结果学习的显而易见约束；描述行为而非实现；参数规则放参数描述/schema；每个事实只说一次；比较改动前后首轮 prompt token。证据：`deepseek-harness/packages/preset/agent-preset/skills/agent-experience/SKILL.md:1-19@687f282e`。

**步骤**：列出重复事实 → 删除可学习约束/实现细节 → 参数规则移入 schema → 为延迟资源写描述与获取方式 → 测量首轮 token。

**负责角色**：工具/技能作者；评审者。

**完成信号**：token 下降或持平；模型仍能正确调用并处理失败。

**失败处理**：token 增加或行为退化则回退；不要为了短而删除安全/权限约束。

**例外**：安全/权限/破坏性效果属于关键约束，即使“显而易见”也保留。

**证据限制**：无自动门禁；token 测量方法未实现；“显而易见”判断主观。

---

## 端到端验收剧本

以下剧本用于迁移后的独立验收；本域未执行，证据状态均为 `planned`。每条至少覆盖一个正向、一个拒绝、一个恢复。

### 1. 渲染预算
- 正向：对目标仓库全部产品技能运行渲染测量，均 `< 8192` 码点；references 按行号前缀也 `< 8192`。
- 拒绝：把某技能正文扩到 9000 码点，测量必须失败并指出技能名。
- 恢复：把长内容迁到 references/templates，正文保留索引；复测通过并记录新值。

### 2. 资源与打包
- 正向：所有正文引用可 `stat`；模板 export/files/locale/icon 被正文点名。
- 拒绝：删除一个被引用模板文件，或从 `files` 移除 locale，检查必须失败。
- 恢复：补文件/补 Read next 行/修 manifest；在安装后的产物复读清单。

### 3. 模板解析与复制
- 正向：`node --check` 全部模板 JS，JSON/YAML 解析通过；工作区副本安装后 `application: applied`。
- 拒绝：注入 JS 语法错误或非数组 patch，解析必须非零/抛错。
- 恢复：修源模板并重新复制；模型改写错误只改工作区副本。

### 4. 禁止 shell 路由
- 正向：扫描全部技能 Markdown，无 `cat`/`cp`/`ls` 反引号命令与源码禁令。
- 拒绝：加入 `` `cat SKILL.md` `` 或 “do not read package sources”，扫描必须失败。
- 恢复：改成文件读取/写入工具步骤，并在 ASAR 环境读取一次。

### 5. Office 路由
- 正向：router→docx 的请求序列符合预算与内容排除；直接加载操作技能不含 router；resume/fork 保留。
- 拒绝：把 `python-docx` 用法塞进 router，或让 authoring 含 `dsoffice`，断言失败。
- 恢复：细节移回格式技能，router 只留分派。

### 6. Office 创作与交付
- 正向：新文件保存后重开验证；公式用 `data_only=False` 保留；`present` 指向最终文件。
- 拒绝：DataFrame 覆盖工作簿导致图表丢失，重开验证失败。
- 恢复：从原始文件重做，交付前报告未覆盖风险。

### 7. 视觉升级与止损
- 正向：外观改动加载 render，检查具体视觉项；空白后只检查一次并写规定单句。
- 拒绝：空白后换 DPI 重试，或声称视觉已验证。
- 恢复：保留源文件与已请求输出，报告视觉未完成。

### 8. Sidecar 同意
- 正向：缺失时先问，同意后本地安装匹配 engine，`dsoffice capabilities` 成功。
- 拒绝：未同意自动下载；或调用系统 soffice/npx。
- 恢复：失败时清理任务本地产物，报告所需平台/前置。

### 9. 无效资产
- 正向：有效资产全部注册；无效资产整批拒绝且目录为空；dispose 清理。
- 拒绝：相对 assetRoot、缺 SKILL.md、缺 frontmatter、空/数字 description。
- 恢复：修资产后重试，确认无残留候选/临时目录。

### 10. Windows ACL
- 正向：一次运行修复并验证；`nextAction` 正确；恢复命令可回滚。
- 拒绝：越界、junction、`Packages`/`WindowsApps`、观察不完整、deny 阻塞；都必须拒绝/停止且不改 ACL。
- 恢复：回滚失败时按序运行 `rollbackCommands`，验证 restore。

### 11. 调用策略
- 正向：目录/用户命令各自过滤；`/hidden-demo` 注入为用户可调用技能；恢复会话从 entries 识别。
- 拒绝：模型加载 `disable-model-invocation` 技能；伪造非 user 来源；路径/分数误识别为手势。
- 恢复：修正 frontmatter 或改用显式 `/name`。

### 12. 单一来源
- 正向：双根加载同一 canonical；仓库技能跨产品门禁通过。
- 拒绝：维护第二份正文；Claude/Codex manual-only 不一致。
- 恢复：删第二份、恢复链接、修正 openai.yaml。

### 13. 插件创建
- 正向：模板→install_bundle→`application: applied`→live 能力/展示验证。
- 拒绝：手写 profile；只看安装成功就声称可见；override 丢字段。
- 恢复：修工作区 bundle 重装；`overridden` 调层；`restart-required` 重启复验。

### 14. 生成索引
- 正向：生成后 `--check` 退出 0；grep 能找到目标包。
- 拒绝：手改一行或新增包不生成，`--check` 非零。
- 恢复：撤销手改并重新生成；修 manifest 后重生成。

### 15. 工具定义卫生
- 正向：首轮 token 下降/持平，行为不退化；参数规则只在 schema。
- 拒绝：同一规则三处重复；删除权限约束导致误操作。
- 恢复：回退改动，按目的/动作/约束最小化。

---

## 迁移到新仓库的最小内核（设计建议，非源义务）

1. **渲染与预算**：实现与产品一致的技能渲染包装，按 Unicode 码点测量；CI 对每个 SKILL.md 与 references（行号前缀）断言阈值。
2. **资源清单**：正文反引号路径必须存在；manifest 的 `exports`/`files` 必须覆盖资源；provider 必须给 `resourceBase`；安装后复读文件。
3. **模板**：JSON/YAML/JS 解析测试；技能正文规定“复制到工作区再安装”；ASAR/只读部署只走文件工具。
4. **调用策略**：注册表保留 `modelInvocable`/`userInvocable`；模型目录只投影 name/description；工具加载前后检查；用户 `/name` 只扫描用户文本并做空白边界。
5. **资产校验**：注册前校验绝对根、文件存在、frontmatter 对象、非空 description；失败整批拒绝；dispose 清理。
6. **家族拆分**：薄 router + 独立操作技能；为 router/authoring 设 token 预算；用请求捕获测试“加载了什么/没加载什么”。
7. **视觉/外部引擎**：明确升级触发与空白止损；外部 sidecar 必须用户同意、本地安装、绝对路径、能力检查。
8. **高风险权限操作**：一次运行、授权边界、先备份后修改、重读验证、失败逆序回滚；报告与恢复命令必须可独立执行。
9. **分发边界**：产品技能、仓库治理技能、测试夹具三分；单一来源 + 别名；生成索引 + `--check`；不要用一个门禁冒充另一个。

---

## 未解决与证据限制

- **发布产物**：未验证 npm tarball/ASAR 中每个引用资源、locale、icon、脚本都存在；源码树测试不等于发布包测试。
- **预算覆盖**：8192 码点测试覆盖 agent-preset 创作者技能；ACL 用 7000 个 UTF-16 代码单元；Office 用 token 预算；未发现对所有第三方打包技能的共享运行时检查。
- **跨产品元数据**：`verify-skill-invocation-metadata` 只覆盖带 `agents/openai.yaml` 的仓库技能，不覆盖打包产品技能；是否有意未知。
- **doc-sync**：`run-gates.ts`、`doc-sync` 组合与远程 CI 未检查；`verify-plugin-packages` 是否必需未确认。
- **Windows**：ACL 测试在非 Windows/缺 pwsh 时跳过；本域未运行，未声称通过；真实 UAC/提权未验证。
- **`codePointLength`**：未读 pruner 实现，只按测试与命名认定为 Unicode 码点。
- **Sidecar**：未安装/运行，平台矩阵与 WASM 支持来自指令文本。
- **中文包 README**：只复核了与技能相关的行（agent-preset:85、skill-office:42/90、ACL:177）；完整包级契约与翻译配对归 package-contracts-2/7，本域不重复声明。
- **测试与生成器**：本域未执行任何测试、构建或生成；所有 `verification` 证据均为 `planned`。

---

## 源证据索引

- 创作者技能与预算/资源/模板/别名测试：`deepseek-harness/packages/preset/agent-preset/tests/skills.spec.ts:1-146@687f282e`。
- 技能注册表与调用策略：`deepseek-harness/packages/skill/skill/src/index.ts:1-868@687f282e`。
- 模型工具与 `/name` 注入：`deepseek-harness/packages/skill/tool-skill/src/index.ts:1-433@687f282e`，测试 `deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:239-352@687f282e`、`deepseek-harness/packages/skill/tool-skill/tests/tool-skill.spec.ts:905-1129@687f282e`。
- Office provider 与资产校验：`deepseek-harness/packages/skill/skill-office/src/index.ts:1-95@687f282e`，测试 `deepseek-harness/packages/skill/skill-office/tests/skill-office.spec.ts:1-208@687f282e`、`deepseek-harness/packages/skill/skill-office/tests/progressive-loading.spec.ts:1-115@687f282e`。
- Office 技能正文：`deepseek-harness/packages/skill/skill-office/assets/**/SKILL.md`（7 个）与 `assets/office/references/sidecar.md:1-17@687f282e`。
- Windows ACL 技能与脚本：`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/SKILL.md:1-63@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/assets/diagnose-windows-sandbox-acl/scripts/diagnose-windows-sandbox-acl.ps1:1-798@687f282e`，测试 `deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:1-123@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/diagnose-script.spec.ts:421-848@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/acl-skill.spec.ts:1-69@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/tests/skill-composition.spec.ts:1-63@687f282e`。
- 生成索引：`deepseek-harness/packages/preset/agent-preset/skills/cordis-composition-reference/references/packages.md:1-514@687f282e`、`deepseek-harness/scripts/gen-plugin-packages.ts:1-60@687f282e`。
- 仓库/产品边界：`deepseek-harness/scripts/verify-skill-invocation-metadata.ts:1-122@687f282e`、`deepseek-harness/packages/preset/agent-preset/README.md:48-52@687f282e`。
- 中文包 README 的技能相关复核：`deepseek-harness/packages/preset/agent-preset/README.zh.md:85-85@687f282e`、`deepseek-harness/packages/skill/skill-office/README.zh.md:42-42@687f282e`、`deepseek-harness/packages/skill/skill-office/README.zh.md:90-90@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.zh.md:177-177@687f282e`。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `packaged-skill-contracts.template-parse-and-copy`：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/templates/decoration/cordis.patch.yml:1-3@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:1-18@687f282e`
- `packaged-skill-contracts.office-router-progressive`：`deepseek-harness/packages/skill/skill-office/assets/office-recalculate/SKILL.md:1-18@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-export-pdf/SKILL.md:1-18@687f282e`
- `packaged-skill-contracts.office-authoring-delivery`：`deepseek-harness/packages/skill/skill-office/assets/office-docx/SKILL.md:6-40@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-xlsx/SKILL.md:6-52@687f282e`、`deepseek-harness/packages/skill/skill-office/assets/office-pptx/SKILL.md:6-64@687f282e`
- `packaged-skill-contracts.office-render-escalation`：`deepseek-harness/packages/skill/skill-office/assets/office-render/SKILL.md:1-31@687f282e`
- `packaged-skill-contracts.office-sidecar-consent`：`deepseek-harness/packages/skill/skill-office/assets/office/references/sidecar.md:1-17@687f282e`
- `packaged-skill-contracts.invalid-asset-rejection`：`deepseek-harness/packages/sandbox/sandbox-windows-acl/src/acl-skill.ts:26-42@687f282e`
- `packaged-skill-contracts.plugin-creator-procedure`：`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/SKILL.md:1-50@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md:1-84@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md:1-70@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/mcp-bundle.md:1-5@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/practices.md:1-38@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-plugin-development/references/user-actions.md:1-15@687f282e`、`deepseek-harness/packages/preset/agent-preset/skills/cordis-composition-reference/SKILL.md:1-29@687f282e`
