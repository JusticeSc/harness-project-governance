# 包契约域治理迁移参考（package-contracts-7）

> 源仓：`deepseek-harness`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，只读。
> 引用格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。只引用实际读过的范围；未读的脚本与实现源码列入证据限制。53 个中文正文已 1-EOF 全文阅读；20 个中文文件的 44 行 display width >700（其中 35 行 >768）与 27 个英文文件的 95 行 >768 字符长行已用 `:raw` 重读。
> 标记约定：**[源规则]** 表示源仓有明确文字、配置或脚本引用；**[源事实]** 表示从源 README 观察到的实现行为；**[迁移设计]** 表示为了让这些要求在采用项目可执行而设计的落地方式；**[建议]** 表示源仓未强制、但采用时可降低风险的附加做法。迁移设计不冒充源规则。

## 0. 使用契约与读者入口

这套治理解决的是：**一个包在进入真实 composition 之前，采用者能否从包自己的材料判断它做什么、怎么配、扩展点在哪、会怎样改变模型请求、哪些边界不能碰，以及失败时会不会静默放宽。** 它不是“README 写作风格指南”，而是包级契约、边界、生命周期与发布面的组合。

先按触发条件选入口：

| 触发 | 先读 | 典型产物 | 完成信号 |
|---|---|---|---|
| 新增一个包 / 把包移组 | M01、M02、M03 | README 五节、组表行、状态分类 | 采用者只读 README 能判断用途/配置/模型影响/限制 |
| 新增模型可见文本、工具或 prompt | M12、M01 | Model Experience、KV Cache effect | 请求字节与声明一致，缓存前缀稳定 |
| 新增配置字段 / profile patch | M06、M07 | 字段表、加载期校验、预算 | 非法配置加载期失败，默认值与上限齐全 |
| 包在真实组合里“装了没效果” | M05、M10 | 最小 composition、加载期错误 | 缺依赖时明确失败或明确不注册 |
| 新增服务实现 / 替换 provider | M04、M11 | Service Definition、槽位契约 | 消费者不依赖具体 provider，模型面只有一个 owner |
| 权限、沙箱、审批、hook 失败 | M08、M09 | 拒绝分支、错误码、凭据通道 | 失败不扩大权限，secret 不出现在配置/日志/URL |
| 新增生成器 / 修改发布面 | M13、M18 | 生成命令、freshness、`files` | 安装后 import 成功，CI diff 为空 |
| 写“已知限制” | M14、M01 | 限制节 | 每条限制绑定当前行为，不是路线图 |
| 写测试替身 / 回放 | M15、M17 | mock、语料、拒绝清单 | 缺场景大声失败，假凭据不出 loopback |
| Windows/macOS/Linux 平台分支 | M16、M08 | 平台后端、支持矩阵 | 不可用时明确报错，不静默 fallback |
| 迁移历史会话格式 | M17 | 相邻版本 upcast、语料测试 | 历史字节不变，未知字段透传 |
| vendor 上游代码 / 同步 | M18 | 清单、修改账本、同步步骤 | 按账本重放后测试通过 |
| 长事务、压缩、上传 | M19、M10 | start/end/水位、恢复状态机 | 崩溃后能判定重放或 busy，不丢不卡 |

**[源规则]** 包 README 的契约在 `packages/README.md`：每个包 README 覆盖 purpose、configuration、extension points 与 Model Experience，除非 model-agnostic omission allowlist 豁免；同时带 `## Known Limitations and Deferred Work`，或使用 limitations allowlist。`deepseek-harness/packages/README.md:102-105@687f282e`。

**[源规则]** 包分组、发布期望、依赖方向与 README 契约都在 `packages/README.md`；模块图由 `pnpm run gen-module-graph` 生成并在 CI 做 freshness 检查。`deepseek-harness/packages/README.md:12-27,86-98@687f282e`。

**[证据限制]** 本次只做静态阅读：没有运行任何构建、测试、lint、formatter、安装、CI 或真实组合启动；README 检查脚本、allowlist、生成器、凭据存储、沙箱实现均未读源码。凡是“脚本会拒绝”“CI 会失败”的表述，都只能说明源 README 如此声明，不能说明在当前提交真的执行过。

---

## 1. 包 README 契约：采用者先看什么 {#package-contracts-7.readme-contract}

**什么时候读.** 新建包、改包能力、改配置面、发布前审阅，或者采用者问“这个包能不能直接用”。

**问题.** 包 README 是采用者唯一稳定的契约面。缺 Model Experience 会把模型行为藏起来；缺 Known Limitations 会让未验证平台被当成已支持；只有英文正文会让中文采用者读不到同一契约。

**源规则（义务）.**

1. 每个包 README 覆盖 purpose、configuration、extension points、Model Experience；只有 model-agnostic omission allowlist 能豁免 Model Experience。`deepseek-harness/packages/README.md:102-105@687f282e`。
2. 每个包 README 必须带 `## Known Limitations and Deferred Work`，或进入 limitations allowlist。`deepseek-harness/packages/README.md:102-105@687f282e`。
3. Model Experience 要写模型看到什么、注入点与 KV cache 影响；没有模型影响时明确写 None 并给原因。示例：`package-manifest` 写 “None, as this package only exports types”，并说明类型声明不改变 provider cache 复用。`deepseek-harness/packages/util/package-manifest/README.md:79-86@687f282e`；`ui-session` 写 “None, as this package adapts browser-side Session state”。`deepseek-harness/packages/client/ui-session/README.md:29-36@687f282e`。
4. 限制节写当前约束与已推迟工作，不写泛泛的任务清单。`deepseek-harness/packages/experimental/browser-use-playwright-mcp/README.md:94-105@687f282e` 的措辞是 “The integration retains the pinned server's browser and tool restrictions”，随后逐条列 Chromium-only、启动失败不重试等。
5. README 与中文正文成对；源仓每个英文 README 都有 `README.zh.md` 语言链接，本次对 53 对正文做了 1-EOF 全文对照（标题数与代码块数一致，且未发现中文独有的额外义务）。这是**[源事实]**，不是源规则文本。

**实施步骤.**

1. 先写 frontmatter `description` 与 Summary：一句话说明包的存在理由、适用面和不适用面。
2. 写 configuration 与 extension points，链接到配置目录/槽位声明；不要让读者从源码猜字段。
3. 写 Model Experience：模型可见文本、注入位置（system prompt/tool schema/runtime context/tool result）、顺序、KV cache 影响；无影响写 None 并解释。
4. 写 Known Limitations and Deferred Work：每条包含触发条件、可观察后果、补救或退出条件。
5. 补 `README.zh.md` 与 `README.i18n.yaml`，保持标题结构与代码块数量一致。
6. 运行仓库的 README 检查脚本；如果使用 allowlist，登记包路径、理由、owner 与复核日期。

**角色与完成信号.**
- 包作者：写五节与双语正文。
- 包 owner/reviewer：确认限制是行为约束，不是路线图；确认 allowlist 仍然成立。
- 完成信号：一个不读源码的采用者能从 README 回答“它做什么、怎么配、模型看到什么、哪里不能用”。

**失败处理.**
- 缺节：先判断是否真的 model-agnostic / 真无限制；是则走 allowlist，否则补写。
- 限制空泛：要求作者给出具体平台、模式或失败码；不接受“后续改进”。
- 双语漂移：以英文正文为准重译，并重新生成 sidecar；不要手改哈希。

**例外.**
- model-agnostic 包可经 `scripts/verify-package-readme-model-experience.ts` 的 allowlist 免除 Model Experience。
- 确实没有限制的包可经 `scripts/verify-package-readme-limitations.ts` 的 allowlist 免除限制节。
- 观察到的例外：`native/system/packages/linux-x64/README.md:1-11@687f282e` 与 `python/README.md:1-20@687f282e` 没有这两节；源正文没有解释它们由哪个 allowlist 覆盖，因此只能记录为观察事实，不能推断豁免理由。

**[迁移设计]** 在采用项目里把模板、检查脚本与 allowlist 一起落地；检查脚本只保证“节存在/格式对”，内容质量仍由 owner 评审。allowlist 必须可审计：路径、理由、owner、复核日期、退出条件，避免变成永久豁免。

**[证据限制]** 检查脚本本体未读，不能证明它检查了内容质量；没有运行脚本，不能证明 CI 真的执行。

---

## 2. 包分组与依赖方向：每个包恰好一个组 {#package-contracts-7.group-map}

**什么时候读.** 新包选目录、包职责变化、跨组依赖、读者找不到包。

**源规则（义务）.**

1. 每个包使用 `@deepseek-ai/dsh-*` 作用域，并恰好属于一个组；新包优先加入已有组。`deepseek-harness/packages/README.md:12-12@687f282e`。
2. 新组必须同时更新自己的 README 与 `packages/README.md` 的组表行。`deepseek-harness/packages/README.md:27-27@687f282e`。
3. 组 README 是该能力族的权威包地图：列出包、角色、ctx key 或注册点。示例：credentials 组列出 `ctx.credentials` 与 `ctx.authorization`。`deepseek-harness/packages/credentials/README.md:27-31@687f282e`；LSP 组列出 `ctx.lsp`、`ctx.tools` 并说明 provider 只注册能力。`deepseek-harness/packages/lsp/README.md:24-30@687f282e`；schedule 与 session-query 组同样以表格给出角色。`deepseek-harness/packages/schedule/README.md:25-30@687f282e`、`deepseek-harness/packages/session-query/README.md:25-31@687f282e`。
4. 依赖图是生成物：`docs/module-graph.md` 由 `pnpm run gen-module-graph` 生成，CI 做 freshness。`deepseek-harness/packages/README.md:96-96@687f282e`。

**实施步骤.**

1. 判断包属于哪个能力组；同职责已有包时优先复用，而不是新建组。
2. 在组 README 的包表中加行，写清角色与 ctx key/注册点。
3. 若新建组，补组 README 与顶层组表行。
4. 重新生成模块图，确认没有反向依赖或循环。
5. 在包 README 的 Summary 回链组 README。

**角色与完成信号.**
- 包作者：选组、更新组表。
- 组 owner：裁决跨组依赖与职责边界。
- 完成信号：组表、组 README、模块图三处一致；读者能从组 README 找到包与 ctx key。

**失败处理.**
- 组表漏行：补行并检查是否还有同批新增包漏登记。
- 反向依赖：先判断是否能力缝放错层，再改依赖；不要用“先合入再拆”掩盖。
- 模块图 diff：重新生成并审查边变化，不手工改生成图。

**例外.**
- SDK、build、test、declaration 基础设施有独立分类，不必强行塞进运行时能力组。`deepseek-harness/packages/README.md:86-89@687f282e`。
- 平台二进制包位于 `native/`，使用 support matrix，而不是 `packages/` 组表。`deepseek-harness/native/system/packages/linux-x64/README.md:9-11@687f282e`。

**[迁移设计]** 把组表当作人工维护的语义地图，把模块图当作机器维护的依赖事实；两者都进评审，但不互相冒充。为每个组指定 owner，新增包 PR 模板要求勾选“已更新组 README 与顶层组表”。

**[证据限制]** 组表本身没有看到“每包一行”的自动检查；模块图只证明依赖边，不证明分组语义正确。

---

## 3. 包状态与默认交付：实验 ≠ 已发布 ≠ 默认挂载 {#package-contracts-7.status-classification}

**什么时候读.** 新增包、把包移入/移出 `experimental/`、修改 shipped profile、发布说明。

**源规则（义务）.**

1. 非实验运行时包必须有产品用途，或在 `scripts/product-package-policy.ts` 中有显式分类；SDK、build、test、declaration 基础设施有单独分类。`deepseek-harness/packages/README.md:86-89@687f282e`。
2. 实验状态独立于是否发布、是否可安装、是否可选交付。`deepseek-harness/packages/README.md:86-89@687f282e`。
3. 实验包只有在被显式挂载时才激活。browser-use 的原文是 “This published experimental package activates only when explicitly mounted.” `deepseek-harness/packages/experimental/browser-use-playwright-mcp/README.md:12-12@687f282e`。
4. shipped profile 不默认挂载实验包。CUA 的原文是 “Enable this experimental provider through explicit source composition on macOS 14 or later. Windows support is in development. Shipped profiles do not mount it.” `deepseek-harness/packages/experimental/cua-macos/README.md:28-28@687f282e`。inspector bundle 则是 “off by default in Plugin Manager”。`deepseek-harness/packages/experimental/inspector-profile/README.md:12-12@687f282e`。
5. Plugin Manager 把实验插件放在单独入口，不与稳定内置插件混排。`deepseek-harness/packages/client/ui-plugin-manager/README.md:30-30@687f282e`。

**实施步骤.**

1. 查 package policy 分类：产品运行时、SDK、build、test、declaration 基础设施。
2. 如果是实验包，确认 shipped profile 不挂载，并写出显式启用步骤（profile patch / source composition）。
3. 在 README 与 Plugin Manager 元数据中标注 experimental，不只靠目录名。
4. 发布前检查默认 profile 的挂载列表，确认没有意外加入实验包。
5. 写清退出实验的条件（例如平台支持完成）。

**角色与完成信号.**
- 包作者：声明状态与启用方式。
- release owner/profile 维护者：确认默认挂载。
- 完成信号：实验、发布、默认挂载三个轴分别有明确答案。

**失败处理.**
- 实验包进了默认 profile：立即从默认列表移除，补显式启用文档，并检查是否有用户已依赖默认行为。
- 分类缺失：运行 package policy 检查；不要用目录位置代替分类。

**例外.**
- 实验包可以发布、可安装，只是不默认激活。
- 显式分类为基础设施的包不要求产品用途。

**[迁移设计]** 建立包状态表（实验性、发布形态、默认挂载、owner、退出条件），默认 profile 变更必须引用它；状态从同一源生成 Plugin Manager 分组，避免两处标注。

**[证据限制]** 未读 `scripts/product-package-policy.ts`；未启动 profile，不能证明默认挂载的真实行为。

---

## 4. 能力缝：扩展依赖 Service Definition，模型面只有一个 owner {#package-contracts-7.capability-seam}

**什么时候读.** 同一能力有多个实现（LSP provider、skill provider、shell executor、sandbox policy），或消费者开始直接 import 具体 provider。

**源规则（义务）.**

1. 扩展插件依赖 Service Definitions，不依赖具体 providers；`dsh-agent-loop` 可替换，UI/hook/tool 插件使用 `dsh-agent`。`deepseek-harness/packages/README.md:93-98@687f282e`。
2. Provider 注册能力，不注册模型工具。LSP 组原文：“Providers register capabilities, not tools: `tool-lsp` is the only owner of the model-facing name, schema, prompt guidance, and presentation, so swapping a provider never changes how the model asks for navigation.” `deepseek-harness/packages/lsp/README.md:24-30@687f282e`。
3. Skill registry 只负责合并、胜出解析与校验；provider 负责来源，本地 provider 与模型消费者是分开的包。`deepseek-harness/packages/skill/skill/README.md:26-32@687f282e`。
4. Shell executor 是 `ctx.shell` seam 的 Service Provider，拥有 pwsh 形状的解析、默认值、deadline 融合、UTF-8 输出与后台合并；managed-range 机制属于 subprocess 服务。`deepseek-harness/packages/shell/pwsh-local/README.md:84-90@687f282e`。
5. 沙箱策略只有一个 policy home：所有受限能力（bash/filesystem/terminal）消费同一份部署默认与 per-session override。`deepseek-harness/packages/sandbox/sandbox-policy/README.md:30-32@687f282e`。
6. `summarize()` 是 compaction 的唯一子类钩子；压力、保留、引用事件、shrink 校验与 token 记账仍在 token meter。`deepseek-harness/packages/compaction/compaction-basic/README.md:106-109@687f282e`。

**实施步骤.**

1. 先定义 Service Definition 与 ctx key，写清输入/输出/错误。
2. 实现 provider，只注册能力，不注册模型工具。
3. 由单独的 tool/consumer 包拥有模型面名称、schema、prompt 与展示。
4. 组合中只挂一个 provider；替换时保持 ctx key 与工具契约不变。
5. 用类型检查或依赖图证明消费者没有 import 具体 provider。

**角色与完成信号.**
- 服务定义 owner：维护接口与 ctx key。
- provider 作者：只实现能力。
- 消费者作者：只依赖定义。
- 完成信号：替换 provider 不需要改模型工具契约；消费者不 import 具体实现。

**失败处理.**
- 消费者绑死 provider：先加接口包，再迁移消费者；不要用 re-export 掩盖。
- 两个 provider 抢同一 ctx key：在组合加载期报错，或明确“只允许一个”的规则。
- 模型工具随 provider 变化：把工具面移入独立包，provider 只留能力。

**例外.**
- SDK 管理的 transport 可以直接 spawn，不走 `dsh-subprocess` 服务（源文档记录的 seam 例外）。`deepseek-harness/packages/sdk/client/README.md:74-74@687f282e`。
- 没有消费者的组合里，sandbox policy 解析出来也没有效果。`deepseek-harness/packages/sandbox/sandbox-policy/README.md:30-32@687f282e`。

**[迁移设计]** 先把 ctx key 与接口写出来，再迁移消费者；provider 与 tool 包分开评审；在依赖图中标注 definition → provider → consumer 的边。

**[证据限制]** 未读 src，不能证明运行时真的只允许一个 provider；“不依赖具体实现”主要靠评审与类型系统，来源未给出自动依赖禁令。

---

## 5. 组合装配：能在加载期失败，就不要拖到运行期 {#package-contracts-7.composition-wiring}

**什么时候读.** 插件“装了没效果”、宿主/客户端只挂一半、profile/preset 组合、诊断缺服务。

**源规则（义务）.**

1. 声明必需服务；组合永远无法满足时在加载期失败，而不是运行期静默跳过。compaction 的最小组合缺 LLM、session storage 或 token measurement 时 “the plugin fails to load”。`deepseek-harness/packages/compaction/compaction-basic/README.md:34-46@687f282e`。
2. 可选子图要有明确降级行为。session-stats 只在 projection registry 存在时注册；其他组合 “serve no `sessionStats` key”，消费者回退到 window-scoped counting。`deepseek-harness/packages/session/session-stats/README.md:28-28,118-122@687f282e`。
3. 插件只在所有注入服务存在时激活。harness-dev-context 要求 `systemPrompt`、`sessionProjections` 与 Web runtime 的 `webApp` 都存在，因此 `--help` 与非 Web 组合不会挂载它。`deepseek-harness/packages/context/harness-dev-context/README.md:28-28@687f282e`。
4. 宿主半与浏览器半成对交付；宿主半即使是空 `apply`，也要为 Loader 行提供落点。ui-settings-shell 的宿主半是 “an empty `apply`, present only so the package holds a Loader row the client module system serves the browser half for”。`deepseek-harness/packages/client/ui-settings-shell/README.md:36-38@687f282e`。
5. 缺后端时给出可操作错误。tool-pwsh 缺 `ctx.shell` executor 时不激活；缺 jobs 的后台调用失败信息指名要加载 `@deepseek-ai/dsh-jobs` 与 `@deepseek-ai/dsh-tool-jobs`。`deepseek-harness/packages/shell/tool-pwsh/README.md:69-69@687f282e`。
6. Loader 对没有生成导出的包静默跳过；显式 `packages` 条目无法解析/缺导出则大声失败。`deepseek-harness/packages/typert/loader/README.md:12-12,47-53@687f282e`。

**实施步骤.**

1. 列出 `ctx.inject` 的必需服务与可选服务。
2. 为不可工作的组合写加载期检查，错误信息指名缺什么。
3. 为可选能力写降级路径，并在 README 的 Composition 节说明。
4. 宿主/浏览器包成对加入 profile；确认浏览器半能被 Loader 服务。
5. 用最小 composition 启动一次，验证失败路径与成功路径都可观察。

**角色与完成信号.**
- 插件作者：声明依赖与失败模式。
- profile 维护者：保证成对与顺序。
- 完成信号：缺服务时加载期失败或明确不注册；最小组合能产生预期行为。

**失败处理.**
- 静默不注册：判断是设计降级还是缺陷；设计降级要在 README 明写，缺陷要在加载期报错。
- 宿主/客户端只挂一半：补 Loader 行或修正 profile；不要用“浏览器端自己兜底”掩盖。
- 缺后端错误不具体：把包名、服务名与补救命令写进错误。

**例外.**
- 可选服务缺失时的“安静不注册”是设计行为（session-stats），不能推广成所有包都应静默。
- SDK transport 可直接 spawn，不走 subprocess 服务。

**[迁移设计]** 为每个插件建立最小 composition 与失败矩阵；把加载期错误当作产品行为测试，而不是只在文档里写“需要 X”。

**[证据限制]** 未执行任何组合启动；所有“会失败/会注册”的结论来自 README 文字。

---

## 6. 配置面：可枚举、可校验、可解释优先级 {#package-contracts-7.configuration-surface}

**什么时候读.** 新增/删除配置字段、修改默认值、profile/patch/CLI/表单优先级、诊断“设了没生效”。

**源规则（义务）.**

1. 每个接受的字段在配置表中列出默认值与语义；有约束的字段写出约束。compaction 的 `thresholdRatio`、`retainRatio`、`retainTokens`、`summarizationProvider/Model`、`maxTokens` 都有默认值与约束。`deepseek-harness/packages/compaction/compaction-basic/README.md:65-78@687f282e`。
2. 无效配置在加载期拒绝：未知设置、重复 per-model 覆盖、非法 token 数、同时使用两种 retention、retention ratio ≥ threshold ratio 都 reject。`deepseek-harness/packages/compaction/compaction-basic/README.md:78-78@687f282e`。
3. 非法 mode 在插件加载时拒绝，避免拼写错误静默改策略。`deepseek-harness/packages/sandbox/sandbox-policy/README.md:58-58@687f282e`。
4. 区分 volatile 与持久字段；volatile 字段在每次解析时采样，表单写入前仍做完整校验。`deepseek-harness/packages/shell/pwsh-local/README.md:74-75@687f282e`。
5. 生成配置目录是字段的穷举来源；README 只解释常用字段。`deepseek-harness/packages/shell/tool-pwsh/README.md:46-53@687f282e`。
6. manifest 可选字段省略时读者不推断默认值；`dsh.manifestVersion` 与 `engines.dsh` 是声明式的，当前安装器/加载器不强制。`deepseek-harness/packages/util/package-manifest/README.md:46-57,92-93@687f282e`。
7. 进程级只有一个答案的配置（如 HTTP 代理）不做插件配置，由启动器解析环境。`deepseek-harness/packages/util/http-proxy/README.md:26-28@687f282e`。
8. 子进程要清除会覆盖配置的继承环境。browser-use 的子进程清除继承的 `PLAYWRIGHT_MCP_*`。`deepseek-harness/packages/experimental/browser-use-playwright-mcp/README.md:48-48@687f282e`。

**实施步骤.**

1. 把字段加入 schema 与生成配置目录，写默认值、类型、约束。
2. 实现加载期校验，错误信息指名字段与非法值。
3. 在 README 表格中解释常用字段及影响，链接穷举目录。
4. 写清 profile/patch/CLI/表单优先级与冲突处理。
5. 为 volatile 字段写采样时机；为持久字段写写入校验。
6. 在 spawn 前清除会覆盖配置的继承环境变量。

**角色与完成信号.**
- 包作者：维护 schema 与默认值。
- 配置目录维护者：保证生成物与 schema 一致。
- 完成信号：字段可从生成目录穷举；非法值加载期失败；优先级有文档与测试。

**失败处理.**
- 未知字段被忽略：改为加载期拒绝，避免用户以为配置生效。
- 默认值缺失：补默认值并写进 schema，不在 README 里另写一份。
- 优先级冲突：明确“谁覆盖谁”，对冲突表单写入报错而不是最后写入者获胜。

**例外.**
- manifest 的兼容范围当前不强制；声明不等于拒绝不兼容宿主。
- 进程级单一策略不提供插件配置，避免同一进程出现两个答案。

**[迁移设计]** 先建立单一 schema 与生成目录，再让 README、表单与校验都从 schema 派生；禁止手写第二份字段表。

**[证据限制]** 未运行配置解析；未读生成配置目录，无法证明 README 表格与 schema 完全一致。

---

## 7. 预算、超时与取消：默认值必须配硬上限 {#package-contracts-7.budget-limits}

**什么时候读.** 新增外部进程、网络请求、模型调用、长输出、请求体或可取消操作。

**源规则（义务）.**

1. 每个超时字段同时给默认值与上限；请求值要校验并夹到 ceiling。PTC runtime：`timeoutMs` 默认 120,000，`maxTimeoutMs` 600,000；`maxOutputBytes` 67,108,864；`maxOldGenerationSizeMb` 512。`deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:49-54@687f282e`。
2. 超时只约束调用方等待，不等于终止工作；PTC 明确 “An enabled deadline covers runtime setup and execution … It is not a CPU meter.” `deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:92-92@687f282e`。
3. 取消要在资源获取后再次检查，避免提供者在取消后仍启动进程。PTC “Cancellation is checked again after confinement, so a provider returning after cancellation cannot start the program.” `deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:110-110@687f282e`。
4. 输出有字符/字节上限；诊断与截断提示可超出主上限，但必须有界。pwsh 的 `maxOutputChars` 默认 16,000，固定诊断追加在后。`deepseek-harness/packages/shell/tool-pwsh-persistent/README.md:50-53@687f282e`；`deepseek-harness/packages/shell/tool-pwsh/README.md:163-163@687f282e`。
5. 请求体、日志字段与队列有独立上限。connection 的 `maxRequestBodyBytes` 默认 300 MiB；session-log 的 `maxBytes` 默认 8 MiB，超限事件会阻塞后续。`deepseek-harness/packages/client/connection/README.md:80-80@687f282e`；`deepseek-harness/packages/session/session-log-deepseek/README.md:30-31,42-42@687f282e`。
6. 队列/预算语义要写清：round cap 不是资源预算，token/时间/配额仍各自独立。`deepseek-harness/packages/goal/goal-round-driver/README.md:128-128@687f282e`。
7. 浏览器工具的 per-call timeout 有默认值，且继承的 `PLAYWRIGHT_MCP_*` 不能覆盖配置。`deepseek-harness/packages/experimental/browser-use-playwright-mcp/README.md:46-48@687f282e`。

**实施步骤.**

1. 列出所有外部等待与输出面，给每项写默认值与硬上限。
2. 实现请求值校验与 ceiling 夹取。
3. 写清超时后的行为：杀进程、转后台、保留部分输出或重置会话。
4. 实现取消检查点，尤其是启动/获取资源之后。
5. 为输出与请求体加 cap，并把截断/超限写进结果。
6. 用长命令、超大输出与取消竞态做负向验证。

**角色与完成信号.**
- 包作者：声明默认值/上限/超时后行为。
- 运行时 owner：保证取消与清理。
- 完成信号：请求值不超过 ceiling；超时/取消后资源回到基线；超限事件可见。

**失败处理.**
- 只释放 await 不终止进程：加终止/后台策略；不要声称“已取消”。
- 超限事件被跳过：改为阻塞或显式失败，保留水位。
- 无 ceiling：在 schema 中补 `max*`，并加校验。

**例外.**
- PTC 服务调用者可显式传 `timeoutMs: null` 省略计时器；`run_code` 仍只接受正数覆盖。`deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:92-92@687f282e`。
- 诊断/截断提示不受主输出 cap 约束，但需要 bounds。

**[迁移设计]** 为每个外部面建立“默认值/上限/超时后行为/取消检查点/输出上限”五列表，再逐项实现与测试；不要用一个 `timeout` 名称同时表示等待上限与工作上限。

**[证据限制]** 未执行超时、取消或压力测试；不同包对“超时后是否杀进程”的语义并不统一。

---

## 8. 失败关闭：安全边界不能回退到更宽权限 {#package-contracts-7.fail-closed-security}

**什么时候读.** 权限、沙箱、审批、hook、动态代码、浏览器控制或任何“失败后是否继续”的分支。

**源规则（义务）.**

1. 任何 Win32/沙箱初始化失败都必须阻止 spawn；`init()` “throws on ANY Win32 failure — never spawns unrestricted”。`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:57-57,76-76@687f282e`。
2. `read-only` 就是零写授权；不能因为“没有显式 deny”而回退到可写。`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:70-70@687f282e`。
3. 运行器失败要以可分类错误退出（`windows-acl-run: <detail>` + 127），不能被当成普通拒绝。`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:76-76@687f282e`。
4. 无法解释的拒绝要暴露诊断路径；诊断自身需要未受限调用者时，没有审批就失败关闭。`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:78-80,191-191@687f282e`。
5. 锁定的 Session/不可用的沙箱要返回明确失败码。CUA 的 “Locked……” 拒绝路径见 `deepseek-harness/packages/experimental/cua-macos/README.md:37-37@687f282e`；PTC 把不可用 confinement 归为 `sandbox-unavailable`。`deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:96-96@687f282e`。
6. Hook 的所有失败模式都收敛为受控结果或 non-match，绝不向调用轮次抛异常。`deepseek-harness/packages/experimental/hook-protocol/README.md:77-77@687f282e`。
7. 动态包的浏览器半只拿到白名单符号与已声明服务；守卫是白名单，不是黑名单。`deepseek-harness/packages/extensions/cordis-client-runner/README.md:54-54@687f282e`。
8. 浏览器启动失败/取消要拒绝 Session 创建或恢复并清理；断开的 client 不自动重试。`deepseek-harness/packages/experimental/browser-use-playwright-mcp/README.md:98-105@687f282e`。

**实施步骤.**

1. 为每个失败分支标注“拒绝 / 降级 / 继续”并说明理由。
2. 在 spawn 前完成所有可能失败的初始化，失败即返回。
3. 为拒绝写可分类错误码与诊断提示。
4. 在 hook/动态包边界做兜底捕获，返回受控结果。
5. 为锁定/不可用状态写明确拒绝路径。
6. 用故意失败的负向用例验证不会回退到未受限执行。

**角色与完成信号.**
- 安全边界 owner：定义拒绝语义与错误码。
- 沙箱实现者：保证 init/spawn 的失败顺序。
- 完成信号：故障注入下没有未受限 spawn；拒绝信息可操作。

**失败处理.**
- 失败开放：立即改为拒绝；如果业务需要继续，必须显式降级并让用户/调用方知道。
- 错误分类不清：把“沙箱坏了”和“命令被拒绝”分开，避免调用方误重试。
- 清理失败：聚合/记录，不要吞掉；残留要让下一次启动可识别。

**例外.**
- 清理是 best-effort，失败会聚合但不阻塞进程退出。`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:76-76@687f282e`。
- 读、网络和进程可见性不在 `WRITE_RESTRICTED` 范围内，必须另配读侧策略。`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:125-125,188-188@687f282e`。

**[迁移设计]** 先把失败分支列成表，再实现拒绝与错误分类；每个安全边界至少有一个负向故障注入用例。失败关闭不是“所有错误都抛给用户”，而是“默认不获得更多权限”。

**[证据限制]** 未运行 Windows ACL 或 macOS 权限测试；行为来自 README。读侧与网络限制明确不在该后端范围内，不能把写限制当成完整沙箱。

---

## 9. 凭据通道：配置只存名称，值走服务/环境 {#package-contracts-7.credentials-channel}

**什么时候读.** 新增 provider、登录流、外部服务、代理或测试替身。

**源规则（义务）.**

1. 配置文件只出现凭据名称；本地秘密值只对同一 OS 用户可读；stored value 优先于 `DEEPSEEK_API_KEY=... dsh`。`deepseek-harness/packages/credentials/README.md:10-12,27-31@687f282e`。
2. provider 的 key 走专用包与 `apiKeyEnv`（默认 `DEEPSEEK_API_KEY`）；credential service 存在时按服务优先级，只有没有该服务的组合才直接读启动环境。`deepseek-harness/packages/llm/llm-deepseek-api-key/README.md:29-38@687f282e`。
3. 缺凭据返回 `MISSING_CREDENTIAL`，格式错误返回 `INVALID_CREDENTIAL`，其他查询失败继续传播；模型发现缺凭据时返回空目录，保留 settings 入口。`deepseek-harness/packages/llm/llm-deepseek-api-key/README.md:29-38@687f282e`。
4. 浏览器 cookie 签名秘密存放在 owner-scoped 凭据记录 `client-connection/browser-session`；删除/替换在下次 Connection 激活生效。`deepseek-harness/packages/client/connection/README.md:39-43,80-83@687f282e`。
5. PTC 子进程只保留可执行搜索、Windows 系统与临时路径，并替换程序可见环境；代理 URL 可能含 `user:password` 时不传给模型编写程序。`deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:110-110@687f282e`；`deepseek-harness/packages/util/http-proxy/README.md:108-112@687f282e`。
6. 测试替身使用假 key 与 loopback；mock server 的 `DEEPSEEK_API_KEY=mock-key`。`deepseek-harness/packages/test-support/llm-mock-server/README.md:91-91@687f282e`。
7. 账号控制器不把 token/PKCE 返回浏览器；cancellation 命名 attempt ID，watch 断开只停止观察。`deepseek-harness/packages/api/account-controller/README.md:23-23@687f282e`。

**实施步骤.**

1. 确定凭据名称与来源（凭据服务/环境变量/登录流）。
2. 在 schema 中只接受名称或引用，不接受明文 secret。
3. 实现解析优先级与错误码，避免把底层错误文本当凭据泄漏。
4. 在子进程/浏览器边界清洗环境与 URL。
5. 为轮换写“下一次请求生效”的语义。
6. 测试使用假 key；断言日志与模型请求不含 secret。

**角色与完成信号.**
- provider 作者：声明 key 名称与错误码。
- 凭据服务 owner：实现优先级与存储。
- 完成信号：轮换后新值生效；配置/日志/URL/模型上下文都没有 secret。

**失败处理.**
- 明文 secret 进入配置/日志：立即轮换，改为名称引用，并加 secret 扫描。
- 优先级错误：把服务解析放在环境读取之前，并为无服务组合保留显式分支。
- 子进程继承代理凭据：清洗环境，或在启动前拒绝含凭据的 URL。

**例外.**
- 没有 credentials 服务的组合允许直接读启动环境。
- 本地凭据文件是默认 on-machine store，仍受 OS 用户权限保护。

**[迁移设计]** 建立凭据名称表、解析优先级与错误码；在配置、子进程、URL 和日志四个出口分别做清洗。不要用“环境变量也是配置”来模糊 secret 与普通配置的边界。

**[证据限制]** 未读凭据存储与登录实现，未执行 secret 扫描；账号控制器的 wire 字段未逐行核对。

---

## 10. 所有权与生命周期：注册返回 disposer，关闭要等静止 {#package-contracts-7.ownership-lifecycle}

**什么时候读.** 插件卸载/热重载、注册服务/槽位/provider/监听、关闭客户端/Session/后台任务、诊断重复注册或泄漏。

**源规则（义务）.**

1. 每个注册返回 disposer；注册与撤销走同一条生命周期轴。ui-slots 的 entry disposer 递归折叠声明的子槽、贡献与 store mount。`deepseek-harness/packages/client/ui-slots/README.md:48-48@687f282e`。
2. 卸载时撤销服务/槽位/贡献；晚到的异步导入若 owner 已消失必须丢弃。typert loader 的注册随 entry 生命周期撤销，晚到导入被丢弃。`deepseek-harness/packages/typert/loader/README.md:47-47,71-75@687f282e`。
3. 关闭是幂等的升级阶梯：请求关闭、等待、必要时强制终止，直到实际退出。SDK `close()` 是 stdin-EOF→SIGTERM→SIGKILL，幂等，closed client 拒绝复用。`deepseek-harness/packages/sdk/client/README.md:60-60,90-92@687f282e`。
4. 取消工作后等待 driver/agent 静止；teardown 关闭 admission、取消并等待静止，事件栅栏保持。`deepseek-harness/packages/goal/goal-round-driver/README.md:72-74@687f282e`。
5. 缓存没有 TTL 时，失效只能由注册方调用 `invalidate()` 或注册/卸载触发；晚到的 invalidate 不能影响已替换的 provider。`deepseek-harness/packages/skill/skill/README.md:100-102@687f282e`。
6. 控制器不维护独立状态；watch 断开只停止观察，不取消登录。`deepseek-harness/packages/api/account-controller/README.md:23-23,34-34@687f282e`。
7. 压缩事务在关闭时只做一次 `compaction/end` 尝试；失败会故意留下阻塞 orphan。`deepseek-harness/packages/compaction/compaction-basic/README.md:107-107,125-125@687f282e`。
8. UI 页面注册随页面存续；`ctx.slots.inject()` 等声明，页面卸载时撤销。`deepseek-harness/packages/client/ui-plugin-manager/README.md:119-119,129-131@687f282e`。
9. CUA 的 disposal 等待完整调用与图像写入，取消的调用不能返回成功截图。`deepseek-harness/packages/experimental/cua-macos/README.md:60-60@687f282e`。

**实施步骤.**

1. 为每个注册获取 disposer，并在 owner 的卸载路径上调用。
2. 在注册时捕获 epoch/generation，异步回调回来先校验 owner 仍活着。
3. 实现幂等关闭阶梯，记录每一步结果。
4. 取消后等待静止，再释放资源或允许下一次挂载。
5. 对缓存失效写 revision/事件，避免 TTL 猜测。
6. 用重复挂载/卸载测试验证没有重复行与孤儿。

**角色与完成信号.**
- 插件作者：返回 disposer。
- 服务 owner：定义关闭阶梯与静止条件。
- 完成信号：重复挂载/卸载后注册行与资源数量回到基线；晚到回调被丢弃。

**失败处理.**
- 缺 disposer：重复注册；补 disposer，并在 owner 卸载路径统一调用。
- 关闭不等待：旧任务写入新会话；加静止等待与事件栅栏。
- 缓存不失效：读者看到过期目录；加 revision 失效或明确 TTL。

**例外.**
- 清理可能是 best-effort，但失败要聚合/可见，不能静默。
- 压缩关闭失败会故意留下孤儿锁，供下一次启动识别。

**[迁移设计]** 把每个注册改成“返回 disposer + owner epoch 校验”，再为每类资源写关闭阶梯与静止等待；生命周期所有者要唯一，父级拥有子级。

**[证据限制]** 未执行卸载/重载测试；生命周期行为来自 README。

---

## 11. 扩展点：声明式槽位、优先级与整项替换 {#package-contracts-7.extension-points}

**什么时候读.** 新增 UI 面板、按钮、设置项、详情区，或第三方包需要贡献到宿主页面。

**源规则（义务）.**

1. 扩展点必须是声明式命名槽位；声明槽位即认领 key，只有声明者能渲染该 key。`deepseek-harness/packages/client/ui-slots/README.md:32-34,48-48@687f282e`。
2. 注册未声明槽位、重复声明子槽、把同一 handle 挂到两个 scope、无 `select` 的链式注册都在加载期抛错。`deepseek-harness/packages/client/ui-slots/README.md:48-48@687f282e`。
3. 优先级默认 100，数字小者先；替换条目是整项替换，不是字段合并。`deepseek-harness/packages/client/ui-slots/README.md:32-34@687f282e`。
4. 子槽位由父注册声明；页面存在期间槽位才存在，registrant 的 `inject` 等待声明。`deepseek-harness/packages/client/ui-plugin-manager/README.md:131-131@687f282e`。
5. 宿主组件保持包内私有，公开的只有 slot 注册与契约类型。`deepseek-harness/packages/client/ui-sidebar/README.md:68-70@687f282e`。
6. 功能预览没有第三方声明接口；图片由内部 map 与 asset test 约束：每种语言一张 640×300 SVG，中英文都必须有。`deepseek-harness/packages/client/ui-plugin-manager/README.md:105-105@687f282e`。
7. Provider 不拥有模型工具名；模型面只由 tool 包拥有。`deepseek-harness/packages/lsp/README.md:30-30@687f282e`。
8. 目录选择器 UI 与 native carrier 是两个槽位；同一个按钮可以组合两种选择器。`deepseek-harness/packages/client/ui-directory-picker-native/README.md:34-34@687f282e`。

**实施步骤.**

1. 在宿主注册中声明槽位与子槽位，写清 required/optional 与 key。
2. 扩展方用 `ctx.slots.inject()` 等待声明，再用 `register` 提供条目。
3. 为竞争条目设置 priority，并说明数值含义。
4. 需要替换时提供完整条目，不做局部字段覆盖。
5. 把内部组件与树推导留在包内，只导出契约类型。
6. 用重复注册/未声明槽位负向用例验证加载期抛错。

**角色与完成信号.**
- 宿主页面 owner：声明槽位与生命周期。
- 扩展作者：注册完整条目与 priority。
- 完成信号：未声明/重复注册加载期失败；替换行为可预测；内部组件未泄漏。

**失败处理.**
- 注册未声明槽位：加声明或改用正确槽位；不要绕过检查直接 render。
- 重复注册：同一 key 只能有一个声明者；用 priority 解决竞争，不用重复声明。
- 顺序随机：明确 priority 默认 100、低者先，并写测试。

**例外.**
- 包没有预览声明接口，预览只能走内置 map。
- 动态包的 slot admission 没有 per-deployment 允许/拒绝载体（cordis-client-runner 限制）。`deepseek-harness/packages/extensions/cordis-client-runner/README.md:132-135@687f282e`。

**[迁移设计]** 先列宿主需要开放的座位与替换语义，再实现声明/注册/优先级/卸载四件事；内部组件默认不导出。

**[证据限制]** 未运行 UI 槽位测试；优先级与抛错行为来自 README。

---

## 12. 模型体验：可见字节、注入位置与缓存影响 {#package-contracts-7.model-experience}

**什么时候读.** 新增/修改模型可见文本、工具 schema、system prompt、runtime context 或工具结果。

**源规则（义务）.**

1. Model Experience 要说明模型看到什么、在哪个 order/位置注入、影响哪些请求。harness-dev-context 给出两个 system-prompt 段落（first-party order 10000/10100）与两个 runtime-context 行（context order 200/210）。`deepseek-harness/packages/context/harness-dev-context/README.md:79-85@687f282e`。
2. 写 KV cache 影响：system prompt 跨 checkout/port/install 保持一致，进程值变化只追加一个 runtime-context snapshot。`deepseek-harness/packages/context/harness-dev-context/README.md:105-109@687f282e`。
3. 没有模型影响时写 None 并解释原因。`deepseek-harness/packages/util/package-manifest/README.md:79-86@687f282e`、`deepseek-harness/packages/client/ui-session/README.md:29-36@687f282e`。
4. 模型可见文本要稳定；隐藏字段不能被插值进 prompt。hook 的模型可见效果只通过显式 consumer 渲染。`deepseek-harness/packages/experimental/hook-protocol/README.md:113-115@687f282e`。
5. 压缩要写 preface/preamble、token effect 与不可分割单元限制：preamble 是 “This is an automatically generated checkpoint…”；token effect 说明替换减少未来输入，而不是追加第二份。`deepseek-harness/packages/compaction/compaction-basic/README.md:168-176@687f282e`。
6. 间接注入要说明哪个 consumer 渲染、哪些输出进入模型上下文。skill 的 Model Experience 是 “Indirectly, through `dsh-tool-skill`”。`deepseek-harness/packages/skill/skill/README.md:121-128@687f282e`。
7. goal 的 round prompt 是自包含 header + JSON-quoted objective，并进入历史；round cap 不是资源预算。`deepseek-harness/packages/goal/goal-round-driver/README.md:49-53,128-128@687f282e`。

**实施步骤.**

1. 列出模型可见文本与注入点（system prompt、tool schema、runtime context、tool result）。
2. 写清 order/位置与前缀稳定性。
3. 给出 KV cache 影响与失效条件。
4. 没有影响时写 None 并给原因。
5. 把进程相关值移到运行时上下文，保留旧格式 Session 的稳定段落。
6. 在测试/评审中检查模型请求字节是否与声明一致。

**角色与完成信号.**
- 包作者：声明可见字节与注入点。
- prompt owner：保证顺序与稳定性。
- 完成信号：抓取一次请求，文本/顺序/缓存效果与 README 一致。

**失败处理.**
- 隐藏插值：把值移到 runtime context，或显式声明为用户可见。
- 进程值写入 system prompt：改为 runtime context；旧 Session 保留旧段落以维持字节稳定。
- 把 None 写空泛：补“为什么无影响”的具体理由。

**例外.**
- 模型无关包可用 None，但必须说明为什么（只导出类型、只读日志等）。
- 间接注入的包可以把渲染责任交给明确的 consumer。

**[迁移设计]** 为每个包建立“模型可见字节清单 + 注入点 + 缓存影响”三列表；没有影响也要显式登记 None。Model Experience 是对请求字节的契约，不是营销段落。

**[证据限制]** 未抓取真实模型请求；README 声明的 prompt 文本未与真实请求字节逐字核对（>768 字符与宽 CJK 长行已 raw 重读，但未做请求抓取）。

---

## 13. 生成物与发布面：从源生成、freshness 门禁、`files` 齐全 {#package-contracts-7.generated-artifacts}

**什么时候读.** 新增生成器/模板/协议、修改导出映射或 npm `files`、升级 Typert/双语 sidecar/预览图。

**源规则（义务）.**

1. 生成物从源生成，不手工编辑；生成器失败要让构建失败。Typert generator 在声明缺失、指向错误文件、Remote 方法缺失时失败。`deepseek-harness/packages/typert/generator/README.md:44-44@687f282e`。
2. 生成器校验 `./typert`、`./client/typert`、`./remote` 指向精确生成文件，且 `files` 包含它们。`deepseek-harness/packages/typert/generator/README.md:112-114@687f282e`。
3. Loader 只注册有生成导出的包；缺导出的包静默跳过，显式 `packages` 条目无法解析则大声失败。`deepseek-harness/packages/typert/loader/README.md:12-12,47-53@687f282e`。
4. 生成 cache 是进程级且不自动过期；新增导出需要重启。`deepseek-harness/packages/typert/loader/README.md:53-53,75-75@687f282e`。
5. 模块图由 `pnpm run gen-module-graph` 生成并在 CI 做 freshness；`references/packages.md` 由 `scripts/gen-plugin-packages.ts` 生成并在 `doc-sync` 做 freshness。`deepseek-harness/packages/README.md:96-96@687f282e`；`deepseek-harness/packages/preset/agent-preset/README.md:50-50@687f282e`。
6. 功能预览图只能走内部 map 与 asset test，包没有预览声明接口。`deepseek-harness/packages/client/ui-plugin-manager/README.md:105-105@687f282e`。
7. 双语 sidecar 用逐节 en/zh 哈希绑定；生成/更新后要重新生成而不是手改。`deepseek-harness/packages/credentials/README.i18n.yaml:1-3@687f282e`；本次对 53 个 sidecar 的 830 个节做了 en/zh 16 位哈希存在性检查（**[源事实]**，非源规则）。
8. 原生协议表由脚本生成，测试 lane 检查 freshness 并拒绝 Host-only 字段进入模型准入。`deepseek-harness/packages/experimental/cua-macos/README.md:117-117@687f282e`。
9. 共享子路径（如 open-in-app 的 `./shared`）只放常量与类型，路由/载荷变更只改 `src/shared.ts`，两端自动同步。`deepseek-harness/packages/host/open-in-app/README.md:66-68@687f282e`。

**实施步骤.**

1. 把 schema/协议/清单定义为唯一源。
2. 生成代码、声明、配置目录、模块图或双语 sidecar。
3. 在构建期校验生成物与声明/`files` 一致，失败即停止。
4. 在 CI 中重跑生成并检查 diff 为空（freshness）。
5. 为生成物写使用说明与“不要手改”标记。
6. 在安装/发布 rehearsal 中执行生成物，而不是只比对字节。

**角色与完成信号.**
- 生成器维护者：定义源与生成命令。
- 包作者：声明 export 与 `files`。
- 发布者：运行 rehearsal。
- 完成信号：重新生成 diff 为空；安装后 import 成功。

**失败处理.**
- 漏 `files`：补 `files` 并加发布 rehearsal；不要只修本地。
- 手改生成物：恢复生成；在文件头加标记并在评审中拒绝手改。
- cache 不刷新：重启或加显式 invalidate；文档写清生效时机。

**例外.**
- 没有生成导出的包被 Loader 静默跳过，这是安全默认。
- 预览图只支持内置 map，第三方不能声明。

**[迁移设计]** 先为每类生成物指定唯一源与生成命令，再把 freshness 检查放进 CI 与发布 rehearsal；生成物的契约包括“如何生成”“如何校验”“如何发布”三部分。

**[证据限制]** 未运行 Typert/模块图/双语生成器；sidecar 只读头部与哈希形态，未逐节核对翻译内容。

---

## 14. 限制披露：写当前约束，不写路线图 {#package-contracts-7.limitations-disclosure}

**什么时候读.** 新增包/能力、平台/权限/性能边界变化、发布前审阅。

**源规则（义务）.**

1. 每个包带 Known Limitations and Deferred Work，逐条写当前约束；没有限制也要走 allowlist，而不是空节。`deepseek-harness/packages/README.md:102-105@687f282e`。
2. 限制要绑定行为：哪个平台、哪个模式、哪个失败码、哪个未实现分支。directory-picker 的限制直接写 “Linux requires desktop tooling”“Windows has no mechanism fallback”。`deepseek-harness/packages/host/directory-picker-native/README.md:98-103@687f282e`。
3. 明确区分“当前不支持”和“计划支持”；不要把 roadmap 写成已交付能力。package-manifest 明确 “Static typing only”“Compatibility is declarative”，并说明当前安装器不强制。`deepseek-harness/packages/util/package-manifest/README.md:92-93@687f282e`。
4. 安全/平台限制要写清后果与补救：http-proxy 列无自定义 CA、Node 版本差异、遥测直连、模型程序不继承代理。`deepseek-harness/packages/util/http-proxy/README.md:108-112@687f282e`。
5. 已知失败模式要写清是否自动重试、是否保留部分结果、是否会阻塞后续：session-log 写 crash-window duplicates、oversized event stalls upload、provider rejection fails the request。`deepseek-harness/packages/session/session-log-deepseek/README.md:74-77@687f282e`。
6. 平台/权限/签名未完成要写进限制：CUA “Native binaries require a local build. Signing, distribution, and system-permission onboarding remain deferred.” `deepseek-harness/packages/experimental/cua-macos/README.md:205-213@687f282e`。

**实施步骤.**

1. 列出当前不支持/未验证/仅单平台的边界。
2. 为每条写触发条件、可观察后果与补救路径。
3. 把 deferred work 与 limitation 分开标注。
4. 在发布评审中确认没有把路线图写成承诺。
5. 用 allowlist 处理确实没有限制的包。

**角色与完成信号.**
- 包作者：写具体限制。
- 评审者：拒绝空泛/路线图式限制。
- 完成信号：采用者能据此决定是否上线；限制与失败行为一致。

**失败处理.**
- 缺限制：先判断是否真无限制；否则补写并加检查。
- 限制空泛：要求具体平台/模式/失败码；不接受“后续改进”。
- 限制与行为不一致：以行为为准修正文档，并排查是否还有同类遗漏。

**例外.**
- 确实没有限制的包可经 allowlist 免除限制节。
- Dev Note 中的开放问题不等于已交付能力，必须与限制节分开。

**[迁移设计]** 把限制节当作发布契约的一部分：每条限制有触发条件、后果、补救与 owner；路线图另放。限制不是自我否定，而是采用者做风险决策的输入。

**[证据限制]** 节存在性可自动检查，但完整性与真实性无法自动证明；未执行各平台复现。

---

## 15. 测试支撑边界：假凭据、确定性回放、失败大声 {#package-contracts-7.test-support-boundary}

**什么时候读.** 新增测试替身、回放场景、mock provider，或诊断“本地过、真实调用失败”。

**源规则（义务）.**

1. 测试支撑包默认不进入生产组合；mock server 只用于 scratch/loopback，不提供 provider 保真。`deepseek-harness/packages/test-support/llm-mock-server/README.md:48-50,109-111,155-158@687f282e`。
2. mock 使用假 key（如 `DEEPSEEK_API_KEY=mock-key`），不读取真实凭据。`deepseek-harness/packages/test-support/llm-mock-server/README.md:91-91@687f282e`。
3. 回放按确定性顺序匹配；未录制的 Session 调用要大声失败并提示重新录制。`deepseek-harness/packages/test-support/llm-replay/README.md:84-86@687f282e`。
4. 脚本占位符解析失败（无匹配、非法正则、未闭合）要大声失败，不静默跳过。`deepseek-harness/packages/test-support/llm-replay/README.md:84-86@687f282e`。
5. 回放只覆盖已集成状态；一次性状态不应加回放夹具。`deepseek-harness/packages/test-support/llm-replay/README.md:68-70@687f282e`。
6. 提交的语料测试要固定历史拒绝清单（路径、代际、错误类型、原因）；拒绝消失或变化即失败。`deepseek-harness/packages/test-support/llm-replay/README.md:102-104@687f282e`。

**实施步骤.**

1. 明确测试替身的边界（只服务测试，不发布为产品能力）。
2. 使用假凭据与 loopback，确保不会打到真实服务。
3. 实现确定性匹配与“未消费脚本/无匹配”失败。
4. 为历史兼容写固定拒绝清单，禁止当前代际获得例外。
5. 在 CI 中运行语料测试并对源字节做只读断言。

**角色与完成信号.**
- 测试作者：维护 mock/回放/语料。
- CI 维护者：保证测试包不进入生产 profile。
- 完成信号：缺失场景大声失败；假 key 不出 loopback；历史拒绝清单稳定。

**失败处理.**
- mock 漂移：不要把 mock 当保真；补真实 e2e 或契约测试。
- 静默跳过：改为失败；回放必须消费所有脚本。
- 真实凭据进入 mock：立即轮换并加环境检查。

**例外.**
- mock server 明确不追求 provider 保真，只验证协议面。
- 历史拒绝是固定清单，当前代际不能获得例外。

**[迁移设计]** 把测试替身限制在 test-support 包与测试 profile；用假凭据、loopback、确定性回放和固定拒绝清单建立边界。

**[证据限制]** 未运行回放/语料测试；失败语义来自 README。

---

## 16. 平台后端：拆开实现，声明矩阵，不静默 fallback {#package-contracts-7.platform-backends}

**什么时候读.** 新增平台/架构支持、原生依赖、目录选择器、shell 执行器或二进制包。

**源规则（义务）.**

1. 平台相关能力拆成独立包/后端；每个后端声明支持的 OS/架构/运行条件。native linux-x64 声明静态 musl 可执行文件与 glibc/musl 两套 Node-API v8 addon。`deepseek-harness/native/system/packages/linux-x64/README.md:9-11@687f282e`。
2. 原生包不做 JS/安装构建脚本；预打包校验完整负载、ELF 架构、Node-API 导出与可执行性，安装后 rehearsal 执行真实行为。`deepseek-harness/native/system/packages/linux-x64/README.md:9-11@687f282e`。
3. 宿主选择后端时写清 try order；不可用时明确报错或由组合层提供 browse fallback，不在原生层静默降级。`deepseek-harness/packages/host/directory-picker-native/README.md:36-46,98-103@687f282e`。
4. Windows 与 POSIX 的执行器语义分开；不翻译 bash/pwsh 方言。pwsh-local 是 `ctx.shell` 的 PowerShell provider；tool-pwsh 明确 PowerShell 方言与无持久 shell。`deepseek-harness/packages/shell/pwsh-local/README.md:12-12@687f282e`；`deepseek-harness/packages/shell/tool-pwsh/README.md:208-210@687f282e`。
5. 原生二进制需要本地构建时，把签名、分发、权限 onboarding 作为 deferred 写明。`deepseek-harness/packages/experimental/cua-macos/README.md:205-213@687f282e`。
6. 平台专属 UI 用本地化的平台词典，不把未支持平台伪装成可用。`deepseek-harness/packages/client/ui-open-in-app/README.md:36-36@687f282e`。
7. 应用目录是固定白名单与编译期表；每平台定位链固定，解析一次/进程。`deepseek-harness/packages/host/open-in-app/README.md:54-68@687f282e`。

**实施步骤.**

1. 列出目标平台/架构与不可用条件。
2. 为每个平台实现独立后端或原生助手。
3. 写宿主 try order 与失败错误；组合层决定 fallback。
4. 为原生负载写校验与安装后 rehearsal。
5. 把未支持的平台/权限写入限制节。
6. 在对应平台 CI 上运行真实行为测试。

**角色与完成信号.**
- 平台后端 owner：维护实现与支持矩阵。
- 发布者：保证 payload/`files`。
- 完成信号：目标平台走预期后端；不可用时明确报错；原生行为有真实执行证据。

**失败处理.**
- 静默 fallback：改为明确错误或组合层 fallback，并写进 README。
- 原生负载漏文件：补 `files` 与 rehearsal；不要只修本地。
- 权限未完成：写进限制节，并在 UI 上提示需要 onboarding。

**例外.**
- 浏览后端可以作为组合层 fallback，但原生层自身不 fallback。
- Windows 支持未完成时包保持 experimental，而不是假装稳定。

**[迁移设计]** 先写支持矩阵与失败边界，再拆后端；原生负载的校验与 rehearsal 与代码同仓维护。平台支持是矩阵不是布尔值：OS、架构、libc、权限、桌面环境都可能单独限制。

**[证据限制]** 未运行任何平台测试；原生包的预打包/rehearsal 脚本未读，只记录其声明的检查项。

---

## 17. 会话格式兼容：相邻版本的纯升级，历史字节不改写 {#package-contracts-7.session-format-compat}

**什么时候读.** 新增 Session 事件字段/版本、迁移历史记录、诊断旧会话无法读取或字段丢失。

**源规则（义务）.**

1. 格式升级是纯函数：每个版本只负责把 vN upcast 到 vN+1，不跨代际合并逻辑。`deepseek-harness/packages/session/session-format-v0-to-v1/README.md:12-12@687f282e`。
2. 读取时先固定 source generation，再按该代际的规则解释事件。`deepseek-harness/packages/session/session-format-v0-to-v1/README.md:45-47@687f282e`。
3. 未知事件类型与未预期载荷保持 opaque，不参与结构校验或重写。`deepseek-harness/packages/session/session-format-v0-to-v1/README.md:45-47@687f282e`。
4. 冻结的历史记录不迁移；需要迁移时只在新写入路径上转换。`deepseek-harness/packages/session/session-format-v0-to-v1/README.md:104-110@687f282e`。
5. 历史拒绝清单固定路径、代际、错误类型与原因；拒绝消失或改变即失败。`deepseek-harness/packages/test-support/llm-replay/README.md:102-104@687f282e`。

**实施步骤.**

1. 为每个版本写独立的 upcast 函数与测试。
2. 读取时记录 source generation，按代际分派。
3. 对未知字段保持透传，不推断语义。
4. 为历史拒绝建立清单与语料测试。
5. 禁止在读取路径上原地改写旧文件。

**角色与完成信号.**
- 格式 owner：维护版本边界与 upcast。
- 持久化实现者：保证只读读取。
- 完成信号：每个历史代际的语料输出字节不变；拒绝清单稳定。

**失败处理.**
- 跨代际逻辑：拆成相邻边；升级必须可组合。
- 读取时改写：把迁移移到写入路径；旧文件保持只读。
- 未知字段被丢弃：改为 opaque 透传，并加语料断言。

**例外.**
- 当前代际不能获得历史拒绝例外。
- 只覆盖相邻边，不承诺任意版本直接互转。

**[迁移设计]** 先冻结现有格式与代际边界，再为每个相邻版本写 upcast 与语料测试；读取路径只读。兼容性靠“版本 + 纯函数 + 语料”三件事，不靠口号。

**[证据限制]** 未运行语料测试；只检查了 v0→v1 的说明，未覆盖所有历史版本。

---

## 18. vendor 账本：上游清单、修改记录、可重放同步 {#package-contracts-7.vendor-ledger}

**什么时候读.** 新增/升级 vendored 包、修改 vendored 源码、发布前审计许可证与版本、上游同步。

**源规则（义务）.**

1. 每个 vendored 包在清单中记录 upstream 名称、版本、commit、许可证与 npm 名称。`deepseek-harness/vendor/README.md:1-29@687f282e`。
2. 所有本地修改必须在修改账本中逐条列出；上游同步后重放，或确认上游已修复后删除并更新账本。`deepseek-harness/vendor/README.md:31-33,65-73@687f282e`。
3. 上游 LICENSE 必须保留；scope 重命名不能改上游运行时标识。`deepseek-harness/vendor/README.md:31-33,51-51@687f282e`。
4. 同步步骤固定：记录上游 HEAD、覆盖 `src`/`bin.js`/README/LICENSE、重放本地修改、更新版本与 commit、运行 install/test/build。`deepseek-harness/vendor/README.md:65-73@687f282e`。
5. publish 面要包含 `src`（若 export map 指向它），否则 tarball 缺文件。`deepseek-harness/vendor/README.md:51-51@687f282e`。
6. scope 重命名用 `pnpm run rescope-vendor --apply`，避免手改漏项。`deepseek-harness/vendor/README.md:51-51@687f282e`。

**实施步骤.**

1. 在清单中登记 upstream 身份与许可证。
2. 把本地修改写入账本，按文件/行为描述原因。
3. 同步时记录 `git rev-parse HEAD`，覆盖源码。
4. 逐条重放修改；上游已修复的删除并更新账本。
5. 更新版本/commit，运行 install/test/build。
6. 检查 publish `files` 与 export map。

**角色与完成信号.**
- vendor 维护者：维护清单/账本/同步。
- 发布者：检查 `files` 与 export map。
- 完成信号：按账本同步后测试通过；发布包可 import。

**失败处理.**
- 漏记修改：同步时丢失补丁；补账本并重新同步。
- 许可证缺失：补 LICENSE 并做合规审阅。
- 漏 `src`：补 `files`，加安装 rehearsal。

**例外.**
- 上游已包含原补丁时可以删除本地修改，但必须更新账本。
- 只有构建输出的包可能没有可匹配的 payload 路径，发布判断需单独处理。

**[迁移设计]** 把 upstream 身份、修改账本、同步步骤与发布检查放在同一份文档；每次同步按账本重放并更新。vendor 账本是同步流程的输入，不是事后说明。

**[证据限制]** 未运行同步/发布；账本完整性只能靠评审；没有自动上游 diff gate。

---

## 19. 持久水位：先写意图，完成写水位，崩溃后按水位恢复 {#package-contracts-7.durable-watermarks}

**什么时候读.** 长事务、后台任务、压缩、上传、轮次驱动、崩溃恢复与重放。

**源规则（义务）.**

1. 在工作前同步追加 start/intent；完成后追加 summary/acceptance 与替换，并只做一次 end 尝试。compaction 的 bracket-first 事务见 `deepseek-harness/packages/compaction/compaction-basic/README.md:107-107,125-125@687f282e`。
2. 未匹配的 start 就是持久锁；只有跨越新的 `session/end-seed` 边界才判定为陈旧证据，否则报 busy。`deepseek-harness/packages/compaction/compaction-basic/README.md:125-125@687f282e`。
3. 日志上传只在 HTTP 2xx 后写 acceptance watermark；未确认的区间会在重启后重放，宁可重复不跳过。`deepseek-harness/packages/session/session-log-deepseek/README.md:40-49@687f282e`。
4. 水位按 Session 格式代际折叠；没有 live Session 时不伪造水位。`deepseek-harness/packages/session/session-log-deepseek/README.md:40-42,51-51@687f282e`。
5. 在排队工作前 flush，并在 await 后重新检查 revision/竞争输入；flush 失败要 disarm。`deepseek-harness/packages/goal/goal-round-driver/README.md:73-73@687f282e`。
6. 超限事件不能被跳过：阻塞后续并保留水位，直到容量允许。`deepseek-harness/packages/session/session-log-deepseek/README.md:74-77@687f282e`。

**实施步骤.**

1. 定义 start/end/水位事件与作用域。
2. 在工作前同步写 start；失败则不开始。
3. 完成后写结果与水位，再尝试一次 end。
4. 恢复时读取未匹配 start 与代际边界，决定重放或 busy。
5. 在排队前 flush，await 后复查 revision。
6. 为超大事件/失败关闭写阻塞与可见错误。

**角色与完成信号.**
- 事务 owner：定义日志协议与水位。
- 持久化实现者：保证同步写入与代际折叠。
- 完成信号：崩溃后能判定重放或 busy；不丢数据、不永久卡死。

**失败处理.**
- 没有 start：无法区分未开始与进行中；补 intent 记录。
- 跳过未确认区间：改为重放；at-least-once 优于丢数据。
- 水位不按代际折叠：把 format generation 写入水位键。

**例外.**
- 崩溃窗口允许重复（at-least-once），不允许跳过。
- 压缩关闭失败会故意留下 orphan 锁，由下次启动识别。

**[迁移设计]** 为每个长事务定义 start/结果/水位三类记录与代际边界，再写恢复状态机与崩溃注入测试；水位的目标是“可判定”，不是“零重复”。

**[证据限制]** 未执行崩溃注入；恢复行为来自 README；不同事务的锁/水位语义不同，迁移时需逐项定义。

---

## 20. 交叉域依赖

| 域 | 共享路径/主题 | 关系与边界 |
|---|---|---|
| engineering | `packages/README.md` | engineering 已记录该路径为 `mechanism-source`，机制 `engineering-architecture-extension-map`、`engineering-capability-seam`、`engineering-product-classification`。本文的 M02/M03/M04 引用同一正文，但不替代 engineering 对模块图与依赖方向的完整审阅。 |
| supply-chain | `vendor/README.md` | supply-chain 已记录为 `instruction-history`，机制 `supply-chain-vendor-sync`、`supply-chain-vendor-patches`、`supply-chain-licenses-notices`。本文 M18 只从包契约角度重述同步/账本/发布，不独立证明供应链审计。 |
| testing | `packages/test-support/llm-replay/README.md`、`packages/test-support/llm-mock-server/README.md` | testing 已记录两者为 `governance`，机制覆盖回放脚本与 secret/credential hygiene。本文 M15/M17 引用同一正文，测试执行与覆盖率语义归 testing。 |
| documentation | `README.zh.md` / `README.i18n.yaml` 配对 | 双语结构、哈希与生成流程归 documentation；本文只记录包 README 必须成对，以及本次 53 对标题/代码块/语言链接的结构一致性事实。 |
| release | npm `files`、export map、生成物发布 | 发布流水线、tarball 校验与版本判断归 release；本文 M13/M18 只声明包契约与发布面要求。 |
| automation | CI freshness、README 检查脚本 | workflow 与 gate 拓扑归 automation；本文只引用脚本名称与 freshness 声明，不能证明 CI 实际执行。 |

**跨域原则.** 一个路径在一个域被判为 governance，不意味着其他域可以把它改判为 generated/vendor；本文的所有共享路径都保持 governance 兼容分类。跨域记录只补充机制视角，不覆盖原域的完整审阅结论。

---

## 21. 采用核对表（最小可执行内核）

### 21.1 新增包

- [ ] 选定能力组；更新组 README 与顶层组表（M02）。
- [ ] 确定状态：实验/稳定、是否发布、是否默认挂载（M03）。
- [ ] 写 README 五节：purpose、configuration、extension points、Model Experience、Known Limitations（M01/M12/M14）。
- [ ] 如果是 provider，先定义 Service Definition 与 ctx key，模型面放独立 tool 包（M04）。
- [ ] 给出最小 composition 与缺依赖失败模式（M05）。
- [ ] 配置字段进 schema/生成目录，写默认值与约束（M06）。
- [ ] 外部等待与输出有默认值/上限/取消语义（M07）。
- [ ] 权限/沙箱/审批/hook 有失败关闭路径（M08）。
- [ ] secret 只以名称进配置，值走凭据服务/环境（M09）。
- [ ] 每个注册返回 disposer，卸载等待静止（M10）。
- [ ] UI 扩展只通过声明式槽位注册（M11）。
- [ ] 生成物有源、freshness 与 `files` 检查（M13）。
- [ ] 测试替身只在 test-support，使用假凭据/回放（M15）。
- [ ] 平台相关能力拆后端并声明矩阵（M16）。
- [ ] 持久格式只做相邻 upcast，历史只读（M17）。
- [ ] 长事务有 start/end/水位与恢复状态机（M19）。

### 21.2 发布前

- [ ] README 检查脚本通过；allowlist 条目仍成立（M01/M14）。
- [ ] 组表、状态表、模块图一致（M02/M03）。
- [ ] 默认 profile 不含实验包（M03）。
- [ ] 最小 composition 启动成功；缺依赖路径也验证过（M05）。
- [ ] 配置目录与 schema 一致；非法配置加载期失败（M06）。
- [ ] 预算字段有 ceiling；超时/取消有恢复证据（M07）。
- [ ] 安全负向用例没有未受限 spawn（M08）。
- [ ] secret 扫描通过；轮换后新值生效（M09）。
- [ ] 卸载/重载后资源回到基线（M10）。
- [ ] 槽位负向用例通过；预览 asset test 通过（M11）。
- [ ] 请求字节/缓存影响与 Model Experience 一致（M12）。
- [ ] 重新生成 diff 为空；安装后 import 成功（M13）。
- [ ] 限制节具体且与行为一致（M14）。
- [ ] 回放/语料测试通过；假 key 不出 loopback（M15）。
- [ ] 目标平台真实行为通过；不可用平台明确报错（M16）。
- [ ] 历史语料只读且拒绝清单稳定（M17）。
- [ ] vendor 账本可重放；LICENSE/`files` 齐全（M18）。
- [ ] 崩溃注入后水位可判定，不丢不卡（M19）。

### 21.3 最小治理内核（如果只能先做五件事）

1. **README 五节 + 检查脚本 + allowlist**（M01/M12/M14）——先让采用者能判断能力边界。
2. **组表 + 状态表 + 模块图 freshness**（M02/M03/M13）——先让包的位置与默认交付可审计。
3. **配置 schema + 加载期校验 + 默认值/上限**（M06/M07）——先消灭静默配置漂移与无界等待。
4. **失败关闭 + 凭据名称通道**（M08/M09）——先保证故障不扩权、secret 不扩散。
5. **注册 disposer + 最小 composition 启动**（M05/M10）——先让插件在真实组合里可装卸、可诊断。

其余机制按风险增量启用：UI 槽位（M11）、平台后端（M16）、会话格式（M17）、vendor（M18）、持久水位（M19）。不要在第一版就复制全部 19 条硬约束；先把触发面最大、失败代价最高的五组落地，再逐组加证据。

---

## 22. 证据限制与未决问题

**证据限制.**

- 本次只读 README/正文，没有运行构建、测试、lint、formatter、安装、CI、浏览器或真实 provider；所有“会拒绝/会失败”的说法都来自源文字。
- README 检查脚本、allowlist、package policy 脚本、生成器、凭据存储、沙箱实现、回放/语料测试均未读源码。
- 中文正文已 1-EOF 全文阅读并与英文逐节对照；20 个文件、44 行 display width >700 的 CJK 长行（含 35 行 >768）已 raw 重读；未发现中文独有的额外义务。翻译措辞的母语审校仍未做。
- 所有 >768 字符英文长行（27 个文件、95 行）已用 `:raw` 逐行重读，机制判断不再依赖被截断的显示；513-768 字符的英文行处于 768 显示宽度以内（抽样 600 字符行完整显示），正文仍按 1-EOF 读取。
- sidecar 只读头部与哈希形态；830 个节的 en/zh 哈希存在性做了机械检查，未验证翻译语义。
- 未验证 CI 是否真的执行 README/模块图/生成物/语料检查，也未验证默认 profile 的实际挂载。

**未决问题（非阻塞）.**

1. README allowlist 当前包含哪些包、是否有过期条目？——未读 allowlist 文件；需要在采用项目中建立 owner/复核日期。
2. `scripts/product-package-policy.ts` 如何分类一个既非产品又非基础设施的包？——未读脚本；采用时需按自己的分类表落地。
3. 中文翻译的措辞是否需要母语审校？——正文语义已逐节对照且未发现独立义务；术语一致性与语言质量仍需人工审校。
4. 各包 README 的 Model Experience 是否与真实请求字节一致？——需要抓取请求/快照验证。
5. vendor 账本是否与当前源码的本地修改完全一致？——需要上游 diff 或逐文件审计。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `package-contracts-7.readme-contract`：`deepseek-harness/packages/util/package-manifest/README.md:79-93@687f282e`、`deepseek-harness/packages/client/ui-session/README.md:29-40@687f282e`、`deepseek-harness/native/system/packages/linux-x64/README.md:1-11@687f282e`、`deepseek-harness/python/README.md:1-20@687f282e`
- `package-contracts-7.group-map`：`deepseek-harness/packages/README.md:27-72@687f282e`
- `package-contracts-7.composition-wiring`：`deepseek-harness/packages/session/session-stats/README.md:28-28@687f282e`、`deepseek-harness/packages/session/session-stats/README.md:118-122@687f282e`、`deepseek-harness/packages/typert/loader/README.md:12-12@687f282e`
- `package-contracts-7.configuration-surface`：`deepseek-harness/packages/sandbox/sandbox-policy/README.md:34-47@687f282e`、`deepseek-harness/packages/util/package-manifest/README.md:46-57@687f282e`、`deepseek-harness/packages/experimental/browser-use-playwright-mcp/README.md:40-48@687f282e`、`deepseek-harness/packages/experimental/cua-macos/README.md:39-54@687f282e`
- `package-contracts-7.budget-limits`：`deepseek-harness/packages/shell/pwsh-local/README.md:49-53@687f282e`、`deepseek-harness/packages/shell/pwsh-local/README.md:101-103@687f282e`、`deepseek-harness/packages/ptc-runtime/ptc-runtime-node/README.md:88-96@687f282e`、`deepseek-harness/packages/session/session-log-deepseek/README.md:30-31@687f282e`
- `package-contracts-7.fail-closed-security`：`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:57-57@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:70-76@687f282e`、`deepseek-harness/packages/sandbox/sandbox-windows-acl/README.md:173-192@687f282e`
- `package-contracts-7.credentials-channel`：`deepseek-harness/packages/credentials/README.md:10-12@687f282e`、`deepseek-harness/packages/client/connection/README.md:39-43@687f282e`、`deepseek-harness/packages/client/connection/README.md:80-83@687f282e`
- `package-contracts-7.ownership-lifecycle`：`deepseek-harness/packages/typert/loader/README.md:47-47@687f282e`、`deepseek-harness/packages/typert/loader/README.md:71-75@687f282e`、`deepseek-harness/packages/sdk/client/README.md:60-60@687f282e`、`deepseek-harness/packages/sdk/client/README.md:90-92@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:119-119@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:129-131@687f282e`、`deepseek-harness/packages/api/account-controller/README.md:34-34@687f282e`
- `package-contracts-7.extension-points`：`deepseek-harness/packages/client/ui-slots/README.md:62-66@687f282e`、`deepseek-harness/packages/client/ui-attachment/README.md:52-52@687f282e`、`deepseek-harness/packages/client/ui-sidebar/README.md:30-30@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:73-73@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:87-90@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:119-121@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:129-134@687f282e`
- `package-contracts-7.model-experience`：`deepseek-harness/packages/experimental/hook-protocol/README.md:113-130@687f282e`、`deepseek-harness/packages/goal/goal-round-driver/README.md:49-53@687f282e`、`deepseek-harness/packages/goal/goal-round-driver/README.md:126-129@687f282e`、`deepseek-harness/packages/context/harness-dev-context/README.md:12-36@687f282e`、`deepseek-harness/packages/context/harness-dev-context/README.md:79-109@687f282e`
- `package-contracts-7.generated-artifacts`：`deepseek-harness/packages/typert/generator/README.md:28-44@687f282e`、`deepseek-harness/packages/typert/loader/README.md:47-53@687f282e`
- `package-contracts-7.limitations-disclosure`：`deepseek-harness/packages/util/http-proxy/README.md:105-112@687f282e`、`deepseek-harness/packages/skill/skill/README.md:130-140@687f282e`、`deepseek-harness/packages/client/ui-plugin-manager/README.md:162-165@687f282e`、`deepseek-harness/packages/compaction/compaction-basic/README.md:244-246@687f282e`
- `package-contracts-7.test-support-boundary`：`deepseek-harness/packages/test-support/llm-replay/README.md:113-115@687f282e`、`deepseek-harness/packages/test-support/llm-mock-server/README.md:48-50@687f282e`、`deepseek-harness/packages/test-support/llm-mock-server/README.md:85-91@687f282e`、`deepseek-harness/packages/test-support/llm-mock-server/README.md:109-111@687f282e`、`deepseek-harness/packages/test-support/llm-mock-server/README.md:155-158@687f282e`
- `package-contracts-7.platform-backends`：`deepseek-harness/packages/host/directory-picker-native/README.md:36-46@687f282e`
- `package-contracts-7.vendor-ledger`：`deepseek-harness/vendor/README.md:31-33@687f282e`
