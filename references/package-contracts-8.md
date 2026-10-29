# 包合同与 README 治理：采用方操作手册（package-contracts-8）

本手册只描述 `687f282e8625c6b8d11ff58211a90524be2e4317` 固定源码中 55 个英文包 README、53 个中文对应页与 53 个 `README.i18n.yaml` 所建立的治理机制。它面向要在另一个仓库复用这套做法的工程师：先按触发条件找到机制，再按“源义务 → 当前实现事实 → 迁移设计”的顺序落地。

阅读约定：

- **源义务**：源仓库 README/记录明确要求的行为或边界，采用方应保留其意图。
- **源实现事实**：源仓库代码或文档中已经存在的具体实现/常量/API；只作为证据，不是要求逐字复制。
- **迁移设计**：为达到同一治理效果，在目标仓库可执行的步骤。
- **额外建议**：源仓库没有明说、但迁移时值得补上的工程判断，不得伪装成源义务。

证据限制：

- 所有英文 README 正文已读；范围见 `research/package-contracts-8-coverage.json`。
- 53 个中文页已全文实际读取（1-EOF，含所有超宽单行的原始补读）；与英文页按节核对机制归属、限制段与 Dev Note 边界，但未逐句做语义等价审校，因此仍以英文页为机制证据基准。
- `README.i18n.yaml` 只读了头部与键结构，未执行 `verify-translation-pairing`，也未证明 CI 阻断。
- 未运行构建、测试、lint 或任何包；文中“运行时失败”均为源码声明，不是本手册的执行结果。
- 读取工具对超宽单行会按显示宽度截断；本域对所有超过 768 显示单元的英文/中文长行做了原始补读（含 2000 字符以上长行的尾部），不再把截断显示当作唯一依据。
- 引用格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。

## 读者触发索引

| 你正在做什么 | 先读 |
| --- | --- |
| 新建或改写一个包 README | [README 类型与页面职责](#package-contracts-8.readme-kind-contract) |
| 改英文或中文 README | [双语配对与哈希记录](#package-contracts-8.bilingual-pair-record) |
| 写 Known Limitations / Dev Note | [限制与 Dev Note 的权威边界](#package-contracts-8.limits-authority) |
| 拆契约包/实现包，或替换后端 | [能力 seam 与单一提供方](#package-contracts-8.seam-split-single-provider) |
| 向 slot/注册表/策略表加贡献 | [注册作用域与生命周期](#package-contracts-8.scoped-registration) |
| 加配置字段、默认值或 profile patch | [配置解析与整体替换](#package-contracts-8.explicit-config-resolution) |
| 把新能力加入默认组合 | [实验性能力默认关闭](#package-contracts-8.experimental-opt-in) |
| 把资源 id 暴露给模型或跨 agent 共享 | [所有者围栏](#package-contracts-8.owner-fencing) |
| 加缓存、索引、反馈或压缩 | [会话日志权威](#package-contracts-8.durable-log-authority) |
| 设计错误码与失败路径 | [失败分类与失败关闭](#package-contracts-8.failure-taxonomy) |
| 实现覆盖/编辑已有文件的工具或替换文件后端 | [写前观察与版本新鲜度门](#package-contracts-8.observation-before-write) |
| 给工具加超时、取消或重试语义 | [协作式超时](#package-contracts-8.cooperative-timeout) |
| 设计公共 API/schema | [最小能力面](#package-contracts-8.minimal-surface) |
| 改 bundle/profile 或 surface 默认值 | [组合分层与覆盖](#package-contracts-8.composition-layering) |
| 写测试 harness 或快照夹具 | [测试支持与夹具合同](#package-contracts-8.test-support-harness) |
| 处理 Windows/macOS/远程文件系统 | [平台差异与原生制品](#package-contracts-8.platform-native) |
| 加 locale/theme/provider 字段/标题策略 | [扩展注册表](#package-contracts-8.extension-registries) |

---

<a id="package-contracts-8.readme-kind-contract"></a>

## 1. README 类型与页面职责

**源义务**

- 每个 README 以 YAML frontmatter 开头，至少含 `description` 与 `kind`；`kind` 取 `package-reference`、`package-bundle`、`package-group`、`package-library`。
- `package-group` 页用 `## Packages` 表列出子包、角色与 `ctx` 键，并链接子包；它不复制子包契约。
- `package-bundle` 页说明组合方式、默认内容、覆盖点与加载失败条件，并明确不是可 import 的库。
- `package-reference` 页按 Use / Understand / Model Experience / Known Limitations 组织；正文给可观察行为，内部实现折叠。
- `package-library` 页说明直接 import 的入口与生命周期；没有 Cordis 挂载配置时必须明说。

源证据：

- `deepseek-harness/packages/computer-use/README.md:1-3@687f282e`（frontmatter `kind: package-group`）
- `deepseek-harness/packages/computer-use/README.md:23-30@687f282e`（Packages 表）
- `deepseek-harness/packages/extensions/README.md:23-31@687f282e`（包组表）
- `deepseek-harness/packages/bundle/base/README.md:1-3@687f282e`（`kind: package-bundle`）
- `deepseek-harness/packages/identity/anonymous-user-id/README.md:1-3@687f282e` 与 `deepseek-harness/packages/identity/anonymous-user-id/README.md:69@687f282e`（library 明确“不是插件”）
- `deepseek-harness/packages/session/session-format-v2-to-v3/README.md:39@687f282e`（无挂载配置）

**源实现事实**

- `computer-use`、`extensions`、`goal`、`interaction`、`llm`、`mcp`、`skill`、`terminal`、`todo` 都是 `package-group` 页，正文以子包表 + ctx 键为主，而不是实现细节。
- `darwin-x64` 用 HTML 注释声明 `package-library`，正文只讲预编译制品与构建所有者。

**迁移设计**

1. 先判定包角色，再写页面；不要先套模板再硬塞。
2. 为每种 kind 固定“必须回答的问题”：
   - group：有哪些子包？各自 ctx 键与角色？最小组合是什么？
   - bundle：默认装什么？覆盖哪一行？哪些行不能同时出现？
   - reference：用户能观察什么？内部怎么实现？限制是什么？
   - library：import 什么？谁调用？有无挂载/配置？
3. 包组页只保留索引、相关文档与 Dev Note；子包实现细节下沉到子包 README。
4. 评审问题：“这页的首要读者问题是什么？当前章节是否回答了它？”

**完成信号**：随机抽一个 group 页能在表里找到全部子包；随机抽一个 library 页能确认 import 入口与是否插件。

**失败处理**：kind 错标会让读者按错误预期阅读；改 frontmatter 并按正确骨架重排，保留原有事实。

**例外**：极小的平台制品页（如 `darwin-x64`）只需要制品边界与构建所有者，不强行补齐全部 reference 章节。

**证据限制**：本域没有发现对 `kind` 取值做机器校验的检查器；错标只能靠评审。

---

<a id="package-contracts-8.bilingual-pair-record"></a>

## 2. 双语配对与逐标题哈希记录

**源义务**

- 范围内 README 必须成对：`README.md`、`README.zh.md`、`README.i18n.yaml`。
- 英文页标题下有 `English | [中文](README.zh.md)`；中文页有 `[English](README.md) | 中文`。
- 修改任一侧后必须同步另一侧并重录逐标题哈希；不得只手改一侧。
- sidecar 按标题路径（`/`、`/<slug>/summary` 等）保存 en/zh 的 16 位十六进制哈希；代码块与生成区域不计入。

源证据：

- `deepseek-harness/packages/core/agent-loop/README.i18n.yaml:1-8@687f282e`（头部声明配对规则与 `pnpm run verify-translation-pairing --write`）
- `deepseek-harness/packages/computer-use/README.md:1-8@687f282e` 与 `deepseek-harness/packages/computer-use/README.zh.md:1-11@687f282e`（语言切换行）
- `deepseek-harness/packages/core/agent-loop/README.md:8@687f282e`（英语页切换行）

**源实现事实**

- sidecar 头部的注释写明了生成命令与“逐标题块哈希”的规则；键是标题 slug 路径，值是 en/zh 哈希。
- 53 个非 vendored 英文 README 都有对应 sidecar；`vendor/cordis` 与 `vendor/loader` 没有中文页，也没有 sidecar。

**迁移设计**

1. 先改英文页，形成唯一语义真源。
2. 逐标题同步中文页：标题层级、章节顺序、锚点、表格结构保持一致。
3. 检查两侧切换行与相对链接。
4. 运行生成器重录 sidecar；禁止手写哈希。
5. 评审时检查 sidecar 键集合等于两侧标题集合，且每个键 en/zh 都有哈希。

**完成信号**：生成器重录后无差异；渲染中文页能跳回英文页。

**失败处理**：只改一侧 → sidecar 过期；门禁执行时报告差异，不执行时只能靠评审。手工增删 sidecar 键 → 键覆盖不匹配。

**例外**：代码块、生成区域、标识符不计入哈希；纯链接修正仍需重录受影响标题。

**证据限制**：哈希证明“两侧一起被重录”，不证明译文语义正确；本域未执行生成器，也未证明 CI 阻断。

---

<a id="package-contracts-8.limits-authority"></a>

## 3. 限制清单与 Dev Note 的权威边界

**源义务**

- `Known Limitations and Deferred Work` 描述当前包约束，明确“不是任务积压/不是路线图”；不承诺交付时间。
- 每条限制写清触发条件、可观察后果、绕行或替代包；不要只写“不支持”。
- `Dev Note` 是维护者工作上下文，明确非权威；已交付行为、限制与理由以正文、代码和链接的 Agent Note 为准。
- 开放问题只写在 Dev Note；决定后迁移到正文并删除过期条目。

源证据：

- `deepseek-harness/packages/attachment/attachment/README.md:116-135@687f282e`
- `deepseek-harness/packages/experimental/tool-ralph/README.md:159-167@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:119-125@687f282e`
- `deepseek-harness/packages/compaction/compaction/README.md:152-163@687f282e`

**源实现事实**

- 这些页在限制段前用一句话声明“current package constraints, not a task backlog”，在 Dev Note 的 `<details>` 里放维护者问题。
- 限制条目通常包含现象、边界（如单单元溢出、未支持 shell/进程树）与替代方案。

**迁移设计**

1. 逐条列限制：现象、条件、影响、替代方案。
2. 确认每条限制在正文或代码中有对应事实。
3. 未决方向移入 Dev Note 并标注“非权威”。
4. 删除已解决条目，不保留历史修复叙事。
5. 评审区分“当前约束”和“未来计划”；出现承诺性措辞就要求改写。

**完成信号**：每条限制都能指出可观察行为或代码路径，并给出替代方案。

**失败处理**：把计划写进限制清单会让采用方误判可用性；把限制写成待办会掩盖真实边界。

**例外**：纯实验包的 Dev Note 可以保留较多开放方向，但仍不得作为已交付承诺。

**证据限制**：没有检查器验证“限制是否完整或仍准确”；文档会随实现演进过期。

---

<a id="package-contracts-8.seam-split-single-provider"></a>

## 4. 能力 seam：定义、提供方与消费者分离且单一提供方

**源义务**

- 能力拆成 Service Definition（契约包）、Service Provider（实现包）、Consumer（工具/UI）三角色；契约包不实现能力。
- 同一组合中每个能力只挂载一个提供方；第二个实现注册必须失败，不得覆盖。
- 抽象服务类被直接实例化/加载时应抛错，避免注册空服务。
- 消费者只依赖契约包 API 与 `ctx` key，不 import 具体实现。

源证据：

- `deepseek-harness/packages/shell/shell/README.md:56-64@687f282e` 与 `deepseek-harness/packages/shell/shell/README.md:81-90@687f282e`
- `deepseek-harness/packages/jobs/jobs/README.md:71-75@687f282e`
- `deepseek-harness/packages/spill/spill/README.md:99-103@687f282e`
- `deepseek-harness/packages/terminal/README.md:27-30@687f282e`
- `deepseek-harness/packages/llm/llm-deepseek/README.md:36@687f282e`（`DUPLICATE_ADAPTER`）

**源实现事实**

- shell 明确三角色，并只允许一个 executor provider。
- `JobRegistry` 是抽象服务；直接加载会抛错。
- spill 每个 context 只允许一个存储实现，第二个实现加载失败。
- llm 侧重复适配器抛 `DUPLICATE_ADAPTER`。

**迁移设计**

1. 先写契约：操作、请求/结果词汇、错误与生命周期。
2. 实现一个提供方并只注册一个 ctx key。
3. 消费者依赖契约包与注入服务。
4. 用“第二个提供方”加载测试验证失败。
5. README 写明最小组合与必须成对挂载的包。

**完成信号**：最小组合只加载契约包与一个提供方即可工作；替换提供方时消费者代码不变。

**失败处理**：重复注册导致组合加载失败或后写覆盖（取决于能力实现）；移除多余提供方后恢复。

**例外**：某些能力允许多个提供方按 scope 并存（如 MCP 按作用域），但共享工具仍只注册一次。

**证据限制**：“单一提供方”是能力级约定，不是框架全局约束；加载守卫只覆盖已实现的路径。

---

<a id="package-contracts-8.scoped-registration"></a>

## 5. 注册作用域与贡献生命周期

**源义务**

- 注册是调用方 fiber 的 Cordis effect，返回幂等 disposer；fiber 销毁时贡献自动移除。
- 注册表拒绝重复 key；保持注册顺序；贡献变化时重建既有 binding。
- 向其他插件声明的 slot 注册必须用 `ctx.slots.inject()`，等待声明出现，声明移除时取消并恢复后重注册。
- 作用域内注册只影响该 agent/session；全局与 agent-scoped 层分开合并。
- 为字段/名称预留独占所有权；重复或非法名称同步失败。

源证据：

- `deepseek-harness/packages/client/ui-conversation/README.md:31-33@687f282e`
- `deepseek-harness/packages/client/ui-workspace/README.md:171-176@687f282e`
- `deepseek-harness/packages/api/remote-access/README.md:29-36@687f282e`
- `deepseek-harness/packages/llm/deepseek-llm-api-extensions/README.md:26-28@687f282e`
- `deepseek-harness/packages/client/ui-directory-picker-browse/README.md:42@687f282e`

**源实现事实**

- UI Conversation 的事件/视图注册表拒绝重复键，返回幂等 disposer；binding 在贡献交集变化时重建。
- `remoteAccess.registerPolicy` 是 fiber effect。
- DeepSeek 扩展在注册时按 fiber 预留字段，重复/非法名同步失败。
- 目录拾取把 browse provider 与 picker interaction 作为一次事务安装。

**迁移设计**

1. 为每个贡献定义稳定 key 与 scope（全局/agent/session/slot）。
2. 用 effect 包裹注册并保存 disposer。
3. 需要他人的 slot 时统一走 inject，不直接塞 entry。
4. 写重复 key、卸载、声明移除/恢复测试。
5. README 写明贡献生命周期与拥有者。

**完成信号**：插件卸载后贡献全部消失；slot 声明恢复后贡献按顺序回来。

**失败处理**：重复 key 抛错；未用 inject 的贡献在声明替换后消失且不恢复。

**例外**：进程级注册（jobs registry、unscoped controller）可跨 fiber 存活，但必须说明所有者与清理时机。

**证据限制**：effect 只保证框架管理的资源；外部网络/文件副作用仍需提供方自行清理。

---

<a id="package-contracts-8.explicit-config-resolution"></a>

## 6. 配置解析、默认值与整体替换

**源义务**

- 包边界提供 `resolve(request)`，把可选请求解析成含显式默认值与上限的 spec；执行函数不再补默认值。
- README 给出字段、默认值与含义表；生成配置目录是字段穷尽真源。
- Patch 替换目标行整个 `config`，不合并；覆盖时必须重述所有想保留的设置。
- 无效配置在产生网络/文件副作用之前失败；区分可变字段与启动字段。
- 调用级覆盖不得超过部署配置声明的上限。

源证据：

- `deepseek-harness/packages/shell/shell/README.md:52-60@687f282e`
- `deepseek-harness/packages/bundle/base/README.md:72-78@687f282e`
- `deepseek-harness/packages/llm/llm-deepseek/README.md:55-74@687f282e` 与 `deepseek-harness/packages/llm/llm-deepseek/README.md:107@687f282e`
- `deepseek-harness/packages/core/agent-loop/README.md:46-55@687f282e`
- `deepseek-harness/packages/experimental/tool-ralph/README.md:32-45@687f282e`
- `deepseek-harness/packages/session-query/session-query-sqlite/README.md:43-53@687f282e`

**源实现事实**

- shell 的 `resolve()` 把请求变成显式 spec，执行器不再补默认值。
- llm-deepseek 在发出网络请求前校验配置；字段表列出默认值与边界。
- agent-loop 的 `maxParallelToolCalls` 被标为易变；其他字段启动时固定。
- tool-ralph 的 `maxRounds` 同时是默认值与上限。
- session-query 的 `openAt`、`limit` 等字段在 README 表中列出。

**迁移设计**

1. 列出字段、默认值、边界、是否可变。
2. 实现 resolve 步骤；执行入口只接受已解析 spec。
3. 为 patch 写整体替换说明与示例；新增覆盖时重述全部保留字段。
4. 用无效配置、越界覆盖、并发请求测试失败路径。
5. 让生成配置目录与字段表对齐，评审检查穷尽性。

**完成信号**：省略可选字段得到文档声明的默认值；越界覆盖被拒绝/截断。

**失败处理**：非法配置在加载/首次操作失败；遗漏重述让设置回默认值。

**例外**：`openAt: never` 等禁用态仍是显式配置，不是隐式回退。

**证据限制**：整体替换语义容易被误认为深合并；字段表与生成目录可能漂移。

---

<a id="package-contracts-8.experimental-opt-in"></a>

## 7. 实验性能力默认关闭、显式启用

**源义务**

- 实验 bundle 在随附 profile 中默认关闭或完全不挂载；启用必须由部署方显式加行/安装。
- README 写明“opt-in only”、前置包、启用与关闭方式。
- 实验包不得被默认 profile 隐式依赖，也不能作为默认能力的唯一提供方。
- 外部依赖与平台限制必须写清。
- 从实验转为默认需要单独决策与评审。

源证据：

- `deepseek-harness/packages/experimental/agent-team-profile/README.md:12@687f282e` 与 `deepseek-harness/packages/experimental/agent-team-profile/README.md:104-110@687f282e`
- `deepseek-harness/packages/experimental/cot-translation-bundle/README.md:12@687f282e`
- `deepseek-harness/packages/experimental/skill-badge/README.md:34-35@687f282e`
- `deepseek-harness/packages/experimental/client-ui-voice-input/README.md:12@687f282e`
- `deepseek-harness/packages/terminal/README.md:43@687f282e`

**源实现事实**

- agent-team profile 在 shipped profile 中关闭，README 标 opt-in only。
- cot-translation bundle 在随附 profiles 中保持禁用。
- skill-badge 默认 composition 不声明。
- terminal 页把某能力标为 experimental optional capability。

**迁移设计**

1. 把实验包放入 experimental 目录并声明前置依赖。
2. 确保默认 profile 不含该行；提供显式启用示例。
3. README 写 opt-in、外部依赖与限制。
4. 用未启用快照验证：无该行时能力不存在且基础 profile 不受影响。
5. 毕业时单独提交 profile 变更与评审。

**完成信号**：默认启动不出现实验工具/UI/服务；显式启用后按文档出现。

**失败处理**：被默认 profile 隐式加载会让用户承担外部依赖或不稳定行为；移除默认行并重启恢复。

**例外**：无外部依赖的可选 UI 仍应显式启用，但限制可较轻。

**证据限制**：没有自动“毕业”门槛；实验状态可能长期滞留。

---

<a id="package-contracts-8.owner-fencing"></a>

## 8. 按所有者会话/身份围栏资源访问

**源义务**

- 每个资源创建时记录 owner（通常是 Agent 会话 id）；所有读/控制操作校验 owner，不只依赖不可猜测 id。
- 工具层为执行中的 agent 自动填充 owner，禁止模型传任意 owner。
- 无 owner 的资源是全局资源，必须说明访问规则与生命周期。
- 策略失败必须 fail closed（拒绝/报错），不得放行。
- 文件权限或“模型不知道路径”只是威慑，不能宣称是安全边界。

源证据：

- `deepseek-harness/packages/jobs/jobs/README.md:38-46@687f282e` 与 `deepseek-harness/packages/jobs/jobs/README.md:71-75@687f282e`
- `deepseek-harness/packages/experimental/tool-terminal/README.md:10-14@687f282e`
- `deepseek-harness/packages/terminal/README.md:27-30@687f282e`
- `deepseek-harness/packages/api/terminal-controller/README.md:26-30@687f282e`
- `deepseek-harness/packages/api/remote-access/README.md:27-28@687f282e`
- `deepseek-harness/packages/credentials/credentials-local/README.md:113-118@687f282e`

**源实现事实**

- jobs 以 owner session id 授权每次控制；terminal 精确 owner fencing；tool-terminal 以执行 agent 为 owner。
- remoteAccess 对非 owner 逐资源判定，策略异常按拒绝。
- 凭据 README 明确同 UID 的其他进程仍可读文件，权限不是安全边界。

**迁移设计**

1. 为资源定义 owner 字段与默认值。
2. 所有入口汇聚到统一授权函数。
3. 工具层注入当前 agent，而不是从参数读 owner。
4. 为全局资源写明确规则。
5. 写跨 owner 拒绝测试。

**完成信号**：owner 能操作自己的资源；另一个 agent 即使知道 id 也被拒绝。

**失败处理**：策略抛错 → 拒绝；失败尝试不改变资源状态。

**例外**：无 owner 的全局资源对任何调用者开放，直到服务销毁；这是显式设计。

**证据限制**：同 UID 文件读取无法靠 API 围栏阻止；跨进程/跨重启的 owner 语义需后端重新定义。

---

<a id="package-contracts-8.durable-log-authority"></a>

## 9. 会话日志是权威，派生状态可重建

**源义务**

- 持久 Session 日志是权威；新数据以事件写入，由投影派生当前状态，不另建第二份权威存储。
- 派生索引单独存放、可丢弃、可由日志重建，且不写权威存储。
- 改变表层历史的操作在日志中留下可检测的括号/标记；崩溃留下未配对标记，不伪装成功。
- 日志只追加；修改通过替换事件表达；影子事件保留以便确定性重放。
- 接受的事实先写入日志，再让下一步从日志派生。

源证据：

- `deepseek-harness/packages/feedback/message-feedback/README.md:50-54@687f282e`
- `deepseek-harness/packages/compaction/compaction/README.md:71-74@687f282e` 与 `deepseek-harness/packages/compaction/compaction/README.md:93-105@687f282e`
- `deepseek-harness/packages/session-query/session-query-sqlite/README.md:87-90@687f282e`
- `deepseek-harness/packages/core/agent-loop/README.md:75@687f282e`

**源实现事实**

- feedback 以 `feedback/message-put` 事件写入 Canonical Session log，明确“no second store”。
- compaction 用 `compaction/start`/`compaction/end` 括号锁，单一 surface 替换，影子事件保留。
- session-query 是独立派生库，带应用 id/模式版本，可删除重建。
- agent-loop 在下一步前追加已接受事实。

**派生读模型边界（session-query 子契约）**

源 README 拥有搜索/游标的完整行为：literal phrase、filter、ranking、snippet 预算、`openAt` 生命周期、`SESSION_QUERY_STALE_CURSOR`/`SESSION_QUERY_INVALID_CURSOR` 与 generation-bound opaque cursor。日志权威侧只保留以下边界，不在这里复制搜索 API：

- live overlay 是连接内 TEMP 状态，重开即消失；persisted read 只观察、不得修改 store；同一 id 的 live owner 优先。
- live owner attach/replace、persistence binding 变化或 snapshot population 移动时，最多重试一次（`STABLE_OBSERVATION_ATTEMPTS = 2`，含首次）；仍不稳定报 `SESSION_QUERY_PERSISTENCE_FAILED`。
- 未变化的 generation 不重读；删除的 id 消失；重开的派生索引在底层 store 不同时，即使 opaque revision 相同也要重载。
- 模型面工具不得暴露 provider cursor、offset、page size 或 model-controlled limit（由 `package-contracts-6.model-facing-tool-result-contract` 拥有）。

证据：`deepseek-harness/packages/session-query/session-query-sqlite/README.md:57-71@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/README.md:102-108@687f282e`；`deepseek-harness/packages/session-query/session-query-sqlite/src/index.ts:85-86@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/index.ts:275-292@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/index.ts:303-322@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/index.ts:495-561@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/index.ts:975-1015@687f282e`；测试 `deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:991-1009@687f282e`（opaque revision 冲突仍重载）与 `deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1830-1879@687f282e`（重开索引：不变 revision 跳过读取，另一 store 重载）。

**迁移设计**

1. 定义事件类型与载荷，确认只追加。
2. 实现可由完整日志重建的投影。
3. 为跨事件操作加开始/结束标记，定义孤儿标记处理。
4. 缓存/索引放独立存储，启动时按需重建。
5. 用崩溃注入、fork、重启、重放测试。

**完成信号**：删除派生索引后能完整重建；压缩崩溃留下未配对标记并报告 busy。

**失败处理**：未配对标记表示上次操作未完成；索引损坏可删除重建，权威日志不变。

**例外**：纯 UI 瞬时状态可只在内存；跨重启/跨 fork 时必须进入日志或明确可丢弃。

**证据限制**：只追加会放大存储与扫描成本；删除当前反馈不等于删除历史，隐私擦除需另做。

---

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:1-37@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1-1318@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1376-1880@687f282e`


<a id="package-contracts-8.failure-taxonomy"></a>

## 10. 稳定错误码、失败关闭与可恢复提示

**源义务**

- 使用稳定错误码/分类并保留原始 cause。
- 策略判定异常必须 fail closed。
- 错误文本给出可执行恢复动作，同时保留机器可读代码。
- 区分“正常业务结果”（非零退出、超时、取消）与“基础设施失败”；只有后者 reject。
- 不得用静默 SPA 回退或空结果掩盖缺失资源。
- 数据/格式准入整体失败关闭：阶段部分输出不算成功；未知事件、未审计成员或畸形块拒绝整次迁移；拒绝时保留源字节、不修复、不回退代次、不发布后继代。

源证据：

- `deepseek-harness/packages/fs/fs-observation-policy/README.md:44-48@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:46-50@687f282e`
- `deepseek-harness/packages/llm/llm-deepseek/README.md:119@687f282e`
- `deepseek-harness/packages/session-query/session-query-sqlite/README.md:71-76@687f282e`
- `deepseek-harness/packages/host/frontend-static/README.md:48-53@687f282e`
- `deepseek-harness/packages/api/remote-access/README.md:42-47@687f282e`
- `deepseek-harness/packages/session/session-format-v2-to-v3/README.md:49@687f282e`
- `deepseek-harness/packages/session/session-format-v2-to-v3/README.md:120@687f282e`
- `deepseek-harness/packages/session/session-format-v2-to-v3/README.md:132-136@687f282e`

**源实现事实**

- fs 策略错误码：`FS_NOT_OBSERVED`、`FS_STALE_VERSION`。
- 超时映射为 `TOOL_TIMEOUT`，不重试业务结果。
- DeepSeek 错误分类：`AUTH`、`QUOTA`、`RATE_LIMIT`、`TRANSPORT`、`ABORTED`、`TIMEOUT`。
- session-query 使用 `SESSION_QUERY_*` 稳定码。
- frontend-static 明确 403/404/405，不做 SPA 静默回退。
- remoteAccess 策略异常返回 `policy-failed` 并拒绝。
- session-format-v2-to-v3 用 `SessionFormatUnsupportedMigrationError` 拒绝整次迁移；拒绝时持久化保留源字节且不发布后继代。

**迁移设计**

1. 枚举失败类别并分配稳定 code。
2. 为每类定义调用方动作：重试、修输入、换提供方、终止。
3. 实现 fail-closed 路径并记录首次/聚合失败。
4. 文本与 code 分离：文本可本地化，code 稳定。
5. 注入故障测试错误路径与恢复提示。
6. 为数据/格式准入定义“整次拒绝”边界，并验证拒绝后源字节、代次与后继代均未改变。

**完成信号**：不同原因返回不同 code 且保留 cause；按提示操作后请求成功；格式拒绝不产生部分结果。

**失败处理**：未分类错误导致误重试；策略异常被吞掉会变成越权；把阶段部分输出当成功会发布半迁移数据。

**例外**：纯展示层可用本地化文本，但必须保留可诊断日志。

**证据限制**：稳定 code 需要长期兼容；错误文本可执行性无法统一自动验证。

---

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:640-760@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:895-1110@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1570-1880@687f282e`、`deepseek-harness/packages/storage/storage-sqlite/tests/sqlite-backend.spec.ts:1-290@687f282e`、`deepseek-harness/apps/cli/tests/profiles/headless/tests/headless.expected.e2e.ts:415-534@687f282e`


<a id="package-contracts-8.minimal-surface"></a>

## 11. 最小能力面：不提供隐式回退或未声明操作

**源义务**

- 契约包只暴露必要操作；不为未被消费者需要的场景添加方法。
- 没有注册目标时不得渲染隐式 fallback；没有配置时可显式无操作，但不能假装成功。
- 不可处理的输入/单元明确报错或列为 out of contract。
- schema 不暴露未实现能力。
- 危险操作若未实现，用“没有该 API”表达，而不是文档劝阻。

源证据：

- `deepseek-harness/packages/spill/spill/README.md:82-84@687f282e` 与 `deepseek-harness/packages/spill/spill/README.md:135-137@687f282e`
- `deepseek-harness/packages/client/ui-conversation/README.md:182-184@687f282e`
- `deepseek-harness/packages/compaction/compaction/README.md:157-163@687f282e`
- `deepseek-harness/packages/experimental/tool-terminal/README.md:175-177@687f282e`
- `deepseek-harness/packages/client/ui-workspace/README.md:222-227@687f282e`
- `deepseek-harness/packages/shell/shell/README.md:135-137@687f282e`

**源实现事实**

- spill 只有 `saveText`，没有检索/删除 API。
- ui-conversation 没有隐式 fallback target。
- compaction 明确不可分单元越界属于 out of contract。
- tool-terminal 无 TUI/键序列 schema；ui-workspace 无 Session 删除；shell 无交互输入词汇。

**迁移设计**

1. 列出消费者真正需要的操作，删推测性 API。
2. 为缺失目标/提供方定义显式行为（空、错误、禁用）。
3. 检查 schema 是否暴露未实现字段。
4. 用“未注册/未配置”场景测试不出现隐式回退。
5. 在限制清单写明 out of contract。

**完成信号**：未注册 View 时无默认 target；spill 调用方只能保存文本。

**失败处理**：隐式回退把错误状态显示为成功；移除回退后调用方收到显式错误并按提示配置。

**例外**：兼容旧数据可保留只读路径，但必须标注 deprecated/兼容层，不能同时作为新写入路径。

**证据限制**：最小 API 可能增加调用方组合成本；“未实现”与“暂未实现”在外部看来相似。

---

<a id="package-contracts-8.composition-layering"></a>

## 12. bundle/profile 分层组合与覆盖规则

**源义务**

- 自定义 profile 以基础 bundle 为第一个 bundle。
- patch 按行 id 覆盖，后写胜出；每个 patch 条目替换目标行整个 config，必须重述保留字段。
- 不同 surface 的默认值放该 surface 的 bundle，不放进共享 core。
- 同一 ctx 服务只能由一个提供方注册；同时挂载会双重注册的包应使 profile 加载失败。
- bundle 运行时内容是 patch 文档，不导出可 import 的库 API。

源证据：

- `deepseek-harness/packages/bundle/base/README.md:30-44@687f282e`、`deepseek-harness/packages/bundle/base/README.md:84-96@687f282e`、`deepseek-harness/packages/bundle/base/README.md:133-136@687f282e`
- `deepseek-harness/packages/experimental/agent-team-profile/README.md:37-38@687f282e` 与 `deepseek-harness/packages/experimental/agent-team-profile/README.md:61-63@687f282e`
- `deepseek-harness/packages/client/ui-workspace/README.md:98-104@687f282e`
- `deepseek-harness/packages/client/ui-directory-picker-browse/README.md:28-30@687f282e`

**源实现事实**

- base 的 patch 示例显示 `config` 整体替换；页面明确双重 filesystem provider 会让 profile 失败。
- agent-team patch 依赖 base 的行 id，不能独立使用。
- 目录拾取行在可选 hook 缺席时保持声明状态，不伪造可用。

**迁移设计**

1. 写最小 profile：`dsh.profile.bundles` 首个为基础 bundle。
2. 追加 bundle 或用 `dsh plugin add`。
3. 覆盖时写完整 config，不假设深合并。
4. 确认没有两个提供方注册同一 ctx key。
5. 用加载测试验证启动、覆盖生效、移除回退。

**完成信号**：最小 profile 能启动；追加 bundle 生效，移除后回退。

**失败处理**：双重注册/缺失 base 行导致加载失败；遗漏重述导致设置回默认。

**例外**：mode 专属 bundle 可以重复声明完整配置，保持每行只有一个 bundle 层。

**证据限制**：没有自动提示 patch 未重述字段；行 id 是隐式契约，重命名会破坏下游。

---

<a id="package-contracts-8.test-support-harness"></a>

## 13. 测试支持包只提供骨架，测试拥有装配与清理

**源义务**

- 测试支持包只共享必要前置依赖与生产 harness；adapter、可选插件、加载顺序与 context 清理由测试自己拥有。
- 需要持久事件/投影/claim 语义时用生产 harness；只编辑队列时用 process-local stub；不得用 stub 冒充持久行为。
- 测试结束 dispose 所属 context，让 Agent 静止并回卷 scoped 注册。
- 快照目录有封闭 manifest、父子命名与版本规则；record/refresh 不得重命名或删除已完成的 generation。
- 夹具守卫在比较前拒绝孤儿目录、缺文件、重复 pin、未清洗的 prompt/schema 等漂移。

源证据：

- `deepseek-harness/packages/test-support/agent-loop-testkit/README.md:12-14@687f282e`、`deepseek-harness/packages/test-support/agent-loop-testkit/README.md:75-79@687f282e`、`deepseek-harness/packages/test-support/agent-loop-testkit/README.md:91-94@687f282e`
- `deepseek-harness/packages/test-support/session-snapshot/README.md:12-16@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/README.md:71-75@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/README.md:81-86@687f282e`、`deepseek-harness/packages/test-support/session-snapshot/README.md:95-98@687f282e`

**源实现事实**

- `mountAgentLoopTestDependencies` 固定六个服务的挂载顺序；`mountAgentLoopTestHarness` 暴露生产 claim。
- 快照套件使用封闭 manifest、身份规范化、fixture guard 与 record/replay/refresh 模式。
- README 明确 harness 要求 raw JSONL，压缩日志无法采集。

**迁移设计**

1. 抽出最小依赖顺序与生产 harness。
2. 让测试显式声明 adapter、可选插件、清理。
3. stub 明确能力边界；持久语义用 harness。
4. 快照先建 manifest 与守卫，再录数据。
5. record 模式单独运行，保留旧 generation。

**完成信号**：生产 harness 测试能观察持久事件与 claim，dispose 后无残留注册；replay 对已提交 fixtures 通过且无写入。

**失败处理**：漏 adapter 测试失败；stub 冒充持久语义会漏测；快照漂移被 guard 拒绝。

**例外**：探针测试可绕过 helper 直接装配，以验证注入失败或部分拓扑。

**证据限制**：本域未运行任何测试；以上为结构合同，不是通过证据。

---

<a id="package-contracts-8.platform-native"></a>

## 14. 平台差异显式化与原生制品边界

**源义务**

- 平台专用包声明制品内容与构建/验证所有者；原生包不夹带 JS loader 或安装构建脚本，除非明确需要。
- 平台分支在组合层用显式 `disabled` 或双行互斥表达，避免同时挂载两套执行器。
- 文件权限检查在支持的系统执行，在无法检查的系统跳过并说明，不得伪造通过。
- 路径拼接用平台分隔符，不硬编码 `/`。
- 远程/受限文件系统写明字节上限、缺失能力与错误语义。

源证据：

- `deepseek-harness/native/system/packages/darwin-x64/README.md:1-9@687f282e`
- `deepseek-harness/packages/bundle/base/README.md:88-92@687f282e`
- `deepseek-harness/packages/credentials/credentials-local/README.md:113-118@687f282e`
- `deepseek-harness/packages/host/frontend-static/README.md:64-68@687f282e`
- `deepseek-harness/packages/ssh/fs-ssh/README.md:67-72@687f282e`

**源实现事实**

- darwin-x64 只提供 `bin/system.node`，由 native workflow 构建并验证。
- base 用 `disabled: !!js process.platform === 'win32'` 门控 shell 行；Windows ACL 与 POSIX 语义不同。
- credentials 在 POSIX 拒绝他人可读文件；Windows 跳过权限检查。
- frontend-static 用 `sep` 检查子路径。
- fs-ssh 明确 8 MiB 上限与无 watch。

**迁移设计**

1. 列平台矩阵与制品内容。
2. 组合层为每平台只启用一套执行器。
3. 实现平台检查并写明跳过条件。
4. 用各平台路径/权限/缺失能力测试失败语义。
5. README 写平台限制与构建所有者。

**完成信号**：每平台只挂载预期行；POSIX 他人可读凭据被拒绝加载。

**失败处理**：权限检查失败拒绝加载；路径误判 403；远程能力缺失显式报错。

**例外**：Windows 没有可检查的文件 mode，检查跳过；这是明示的不可验证点。

**证据限制**：本域未执行平台构建或跨平台运行；Windows 权限存在平台缺口。

---

<a id="package-contracts-8.extension-registries"></a>

## 15. 扩展注册表：命名空间、回退链与失败隔离

**源义务**

- 扩展使用带命名空间的稳定标识（locale 类型化 namespace、theme id、DeepSeek 声明合并 field）。
- 注册同步校验：重复 id、未知 fallback、循环、非法名称直接失败。
- 回退链终止于默认（locale 终止于 `en`）；查找按链走，不静默返回空。
- 注册绑定生命周期；移除后不留半注册状态。
- 单个扩展准备失败被隔离：省略该字段/提供方并记录首次失败，其他继续；取消停止等待。

源证据：

- `deepseek-harness/packages/client/locale/README.md:38-40@687f282e` 与 `deepseek-harness/packages/client/locale/README.md:64-68@687f282e`
- `deepseek-harness/packages/client/ui-theme/README.md:40-44@687f282e`
- `deepseek-harness/packages/llm/deepseek-llm-api-extensions/README.md:26-32@687f282e`
- `deepseek-harness/packages/experimental/skill-badge/README.md:67-72@687f282e`
- `deepseek-harness/packages/mcp/mcp-resources/README.md:57-60@687f282e`
- `deepseek-harness/packages/session/session-title-first-prompt-llm/README.md:10-14@687f282e`

**源实现事实**

- locale 要求完整的 `zh`/`en` 字典并校验 fallback 终止于 `en`；缺键回退。
- theme 按注册顺序折叠 alias 覆盖，第三方主题不保证完整。
- DeepSeek 扩展注册时拒绝重复/非法 field；prepare 抛错只省略该字段。
- skill-badge 是不可变单 skill provider。
- MCP 首个 scope provider 注册共享工具，后续只解析自身 scope。
- 标题提供方注册 `first-prompt` cadence。

**迁移设计**

1. 定义 key 空间、类型与回退终点。
2. 实现注册校验。
3. 为每次请求快照已注册扩展并隔离单项失败。
4. 查找/渲染显式走回退链或报错。
5. 用重复、循环、未知 fallback、单扩展抛错、卸载测试边界。

**完成信号**：新语言包按链解析并回退 `en`；一个扩展 prepare 失败时其他字段仍发送。

**失败处理**：重复/循环注册失败；单 provider 失败只丢该字段；全部失败可能缺字段。

**例外**：第三方主题只覆盖同名 alias；这是明示的扩展点限制。

**证据限制**：失败隔离意味着请求可能缺字段，调用方需接受降级；本域未执行注册/请求测试。

---

<a id="package-contracts-8.observation-before-write"></a>

## 16. 写前观察与版本新鲜度门

**源义务**

- 覆盖已有文件的 `write` 与 `edit` 必须要求同一会话先读取目标；未观察目标拒绝并返回 `FS_NOT_OBSERVED`。
- 变更必须携带观察到的版本；文件自读取后变化时拒绝并返回 `FS_STALE_VERSION`，提示重新读取后重试。
- 读取不存在的路径记录“确认不存在”，允许受保护的创建；创建使用 `createIfAbsent` 之类原子操作，不能覆盖并发创建者。
- 观察记录按 owner 会话隔离且不跨会话持久化；恢复的会话必须重新读取目标。
- 策略应作为 `fs/*` 事件门而非 provider service：不注册 `ctx.fsPolicy`、不做自己的文件 I/O，由 provider 执行原子新鲜度检查。
- intent 槽只能有一个 decider，按注册顺序 first-wins；权限、审计、沙箱等分层拦截应挂在 `tools/execute`。
- 明确边界：无 agent 会话的 actor 无法满足策略；直接调用 `ctx.fs` 的读取不产生观察；窗口读取只证明版本新鲜，不等于全量视图完整。

源证据：

- `deepseek-harness/packages/fs/fs-observation-policy/README.md:12@687f282e`
- `deepseek-harness/packages/fs/fs-observation-policy/README.md:28-32@687f282e`
- `deepseek-harness/packages/fs/fs-observation-policy/README.md:40-46@687f282e`
- `deepseek-harness/packages/fs/fs-observation-policy/README.md:62-63@687f282e`
- `deepseek-harness/packages/fs/fs-observation-policy/README.md:74@687f282e`
- `deepseek-harness/packages/fs/fs-observation-policy/README.md:78@687f282e`
- `deepseek-harness/packages/fs/fs-observation-policy/README.md:126-129@687f282e`

**源实现事实**

- `dsh-fs-observation-policy` 用 owner-to-target 的 `WeakMap` 记录 unseen、confirmed absent、present@version 三种状态。
- `fs/write-intent` 把 unseen/absent 解析为 `{ kind: 'createIfAbsent' }`，把 present 解析为 `{ kind: 'replaceIfVersion', version }`。
- `fs/edit-intent` 对 unseen 返回 `FS_NOT_OBSERVED`，对 absent 返回 `FS_NOT_FOUND`，其余把观察版本作为 compare-and-swap 基准。
- `fs/observed` 在成功变更提交后同步记录 `present@version` 或 `absent`。
- 模型侧 `dsh-tool-fs` 归一化错误文本，但保留 code 与原始 cause；`FS_STALE_VERSION` 保留 provider 原因并追加重新读取提示。
- 观察状态不持久化，插件卸载时丢弃；恢复会话没有观察记录。

**迁移设计**

1. 定义观察状态与键：owner 会话加目标路径，状态至少覆盖 unseen、absent、present@version。
2. 定义写/编辑 intent 事件与观察事件，避免工具直接调用 provider 的裸写接口。
3. 让 provider 提供版本比较或原子创建；策略只把记录状态翻译成 guard，不自己做 I/O。
4. 把策略注册为 intent 槽的第一个（且唯一）decider；其他分层策略挂到执行瀑布。
5. 在模型侧统一错误包装：面向模型的文本可读，code 与 cause 原样保留。
6. 测试未观察、过期、确认不存在、并发创建、会话恢复五条路径。
7. 运维上明确：恢复会话必须重读；不要为了减少拒绝而持久化观察缓存。

**完成信号**：未读编辑被拒绝；读后编辑成功；外部修改后编辑返回过期码；读缺失后创建成功且并发创建者不被覆盖；重启后观察状态为空。

**失败处理**：策略未挂载或 intent 槽被抢占会静默失去保护；持久化观察会制造假阳性；直接 `ctx.fs` 读取不计入观察；窗口读取授权全文件覆盖是已知弱化。

**例外**：非 agent 调用者的写入总走 `createIfAbsent`，不能覆盖已有文件；只追加、不覆盖的写入可以不启用该门。

**证据限制**：只读 README，未执行插件或测试；“先加载策略”与首 decider 是组合约定，非事件强制；provider 的版本实现未读。

---

<a id="package-contracts-8.cooperative-timeout"></a>

## 17. 协作式超时：工具声明预算与取消结算

**源义务**

- 超时是协作式的：只对声明了 `timeoutMs` 且遵守 `exec.signal` 的工具生效；不得宣称能硬停工具。
- 只有在下游响应取消且 `next()` 结算后才返回超时错误；错误结果为 `TOOL_TIMEOUT`，文本为 `Error: tool call timed out after <ms>ms`；按时完成的调用保持不变。
- 预算属于工具定义/注册表：从 `ToolDefinition.timeoutMs` 读取，缺失或工具名错误时原样委托；不提供全局统一默认值。
- 超时分类必须按本包装器的 code 限定，嵌套的外层 deadline 应被读作普通上游取消。
- 派发时把派生的 deadline 信号换到 `exec` 上，并在 `finally` 恢复调用方信号；`tools/post-execute` 监听器不得看到可能已中止的派生信号。
- 多个 `tools/execute` 监听器按注册顺序决定语义：超时注册在外层覆盖整个重试操作，注册在内层覆盖每次尝试。
- 明确限制：忽略信号的工具有超时也无结果、调用方一直等待；未声明预算的工具永不被截断。

源证据：

- `deepseek-harness/packages/guard/timeout-policy/README.md:12@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:32@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:46@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:62-65@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:69@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:73@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:104@687f282e`
- `deepseek-harness/packages/guard/timeout-policy/README.md:121-122@687f282e`

**源实现事实**

- 插件：`@deepseek-ai/dsh-tool-call-timeout-policy`；计时与分类在 `dsh-timeout` 的 `deadline`/`timeoutOf`；包装点在 `tools/execute`。
- 预算从注册表读取：`ctx.tools.get(exec.name, exec.agent)?.timeoutMs`；工具名错误不会误配，未声明预算的工具直接委托。
- 派生信号通过 `deadline(exec.signal, timeoutMs, TOOL_TIMEOUT)` 构建，派发时替换、`finally` 恢复。
- 包装器自己的超时用 `timeoutOf(d.signal, 'TOOL_TIMEOUT')` 限定；嵌套外层 deadline 读作上游取消。
- 结算后把结果替换为 `isError: true`、文本 `Error: tool call timed out after <ms>ms` 和结构化 `TOOL_TIMEOUT`。
- 插件无配置，`dsh` base bundle 已包含；`web_fetch`/`web_search` 等工具声明预算，`bash`/`read`/`write`/`edit` 默认没有。

**迁移设计**

1. 让每个长耗时工具在 `ToolDefinition` 声明 `timeoutMs`，并实现 `exec.signal` 取消。
2. 在 `tools/execute` 包装器中从注册表读取预算；未声明则直接委托。
3. 用 `deadline` 构建派生信号，派发时替换、`finally` 恢复调用方信号。
4. 用本包装器的 code 限定分类，避免嵌套外层 deadline 被误判。
5. 在取消结算后用结构化错误替换结果；按时完成的调用原样通过。
6. 按重试语义选择包装器注册顺序，并测试外层/内层两种组合。
7. 测试忽略信号、未声明预算、按时完成、超时后重试四条路径。

**完成信号**：按时调用无超时错误；取消结算后返回带毫秒数的 `TOOL_TIMEOUT`；未声明预算的工具不被截断；嵌套外层取消不被误报；`finally` 后调用方信号已恢复。

**失败处理**：忽略信号会挂住调用方；强加全局默认会截断不该截断的工具；分类不限定会误读嵌套取消；信号不恢复会污染后续监听器。

**例外**：未声明 `timeoutMs` 的工具原样委托；需要硬停的工具体系应使用进程级终止，而不是本包装器。

**证据限制**：只读 README，未执行超时/取消测试；工具是否真正响应取消、注册表与 base bundle 的实际行为未在本域验证。

---

## 18. 采用方落地顺序（迁移设计，不是源义务）

建议按以下顺序把上述机制搬到一个新仓库，避免同时引入文档、运行时与门禁三类变更：

1. **先定页面类型**（机制 1）：为现有包补 `kind`，把包组页与 bundle 页分开。完成信号：每页能回答其角色问题。
2. **再建双语三件套**（机制 2）：英文真源、中文镜像、sidecar 生成器。完成信号：生成器可重复运行且键覆盖全部标题。
3. **补限制与 Dev Note 语义**（机制 3）：把“当前约束”和“未决方向”拆开。完成信号：每条限制有可观察后果与替代方案。
4. **拆能力 seam**（机制 4、5）：先契约包，再一个提供方，再迁移消费者；注册全部 effect 化。完成信号：第二提供方加载失败，卸载无残留。
5. **固定配置边界**（机制 6）：resolve 集中、字段表、patch 整体替换。完成信号：非法配置在副作用前失败。
6. **收紧默认组合**（机制 7、12）：实验能力默认关闭；bundle 以 base 为首，patch 重述完整 config。完成信号：默认 profile 不含实验行，双提供方加载失败。
7. **加资源围栏、写前观察、超时与失败语义**（机制 8、10、16、17）：owner 注入、read-before-write 版本门、协作式超时、fail closed、稳定错误码。完成信号：跨 owner 访问被拒绝，未观察或过期写被拒绝，超时在取消结算后返回，策略异常不放行。
8. **把持久化与派生分开**（机制 9）：日志权威、索引可重建。完成信号：删索引可重建，压缩崩溃可检测。
9. **最后收 API 与测试支持**（机制 11、13、14、15）：删隐式回退，建 harness/夹具，平台门控，扩展注册校验。完成信号：未注册目标无默认行为，夹具漂移被拒绝。

**不要一次全上**：每步都应有独立的可观察完成信号；没有信号的步骤说明还没定义清楚。

---

## 19. 已知未解与证据限制（采用前必读）

1. **哈希门禁未执行**：只读到 sidecar 头部规则；未运行 `verify-translation-pairing`，未证明 CI 阻断。采用方需自行把生成器接入提交/合并路径。
2. **kind 无机器校验**：四种 kind 是书面约定；错标只能靠评审。
3. **中文页未逐句语义审校**：53 个中文页已全文读取并按节核对机制归属；但未逐句做双语语义等价审校，英文页仍是本域机制证据基准。
4. **实验毕业无门槛**：没有自动成熟度判定；默认组合变更靠发布评审。
5. **部分合同只有运行时守卫**：重复适配器、双 filesystem provider、spill 第二实现等有加载失败声明；其他规则（patch 重述、限制完整性）仍属评审义务。
6. **未运行任何构建/测试/平台验证**：所有“失败/成功”描述来自源码声明或文档，不是本手册的执行结果。
7. **webhook-github 非治理**：该页是 HTTP 适配器合同，已在 collaboration-coverage 记为 non-governance；本域不引用其内容作为治理机制。
8. **vendor 两页非本仓库治理**：`vendor/cordis`、`vendor/loader` 是上游框架文档，按 vendor 分类。

采用方在引用本手册时，应把“源义务”与“迁移设计”分开转述；不要把建议写成源仓库已经自动执行的保证。
