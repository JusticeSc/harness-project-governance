# 项目治理迁移参考：架构决策分区 rationale-architecture-1

本参考从固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 94 篇架构类 Agent Note（英文 48 篇 implemented、44 篇 archived、2 篇 proposed，逐篇配对中文正文）中提取可迁移的项目治理机制。它不是对源项目的赞美式总结，而是一组可由其他项目采纳的操作程序：每节给出触发、义务、角色、步骤、完成信号、失败处理、例外、迁移实现、验证义务与证据限制。

## 如何解读来源权威

- **implemented**：记录的是源项目当前已交付的决定，可作为"当前做法"的事实证据；仍不等于每个部署都已配置或每个检查都已执行。
- **archived**：冻结的历史快照，**不是当前权威**。其中的机制可作为历史经验或设计选项；采纳时不得声称源项目仍在强制它。
- **proposed**：提案，**不是当前权威**。只保留其问题分析、已定案但未实现的施工规范、不做清单与风险；不得写成现有保证。
- 每节末尾列出实际阅读的英文正文引用；中文正文逐篇完整阅读，未发现需要另立机制的实质性分歧。链接的当前政策文档未逐篇阅读，不作为已核实证据。

## 适用方式

1. **触发盘点。** 对每个机制检查其 triggers 是否在目标项目出现；不要因为项目小、没有工具、没有凭据就删除仍然适用的义务。
2. **指定唯一所有者。** 每个机制至少有一个对完成信号负责的角色；跨包时按"定义/实现/消费"或"策略/执行/展示"拆分。
3. **保留效果，不照搬形状。** 包名、目录和 API 可以不同；触发条件、义务、强制点、失败语义与证据必须等价。
4. **记录未激活。** 若触发事实不存在（而非仅仅缺少设施），记录理由与重新激活条件。
5. **先实现强制，再谈自动保证。** 过程、评审或文档不能替代源机制中的自动门禁；若只能人工执行，必须明确声明信任边界。
6. **证据分级。** 本参考中的所有验证均为**计划**；只有目标项目实际执行并保留输出后，才能声称通过。

## 术语

- **seam（能力缝）**：Service Definition、Provider、Consumer 三角色组成的最小可替换边界；不是单个 TS interface。
- **principal / peer**：principal 是授权身份（可合并扩展、无凭据、可落盘）；peer 是一条连接的生命周期（ctx、signal、交互模式、dispose）。一个 principal 可有多个 peer。
- **PDP / PEP**：策略判定点（业务包注册 role/binding/policy，通用层计算 allow/deny）与策略执行点（Gateway 在分派前解析资源并强制执行）。
- **projection（投影）**：从持久事件派生的读模型；Host 是唯一计算点，客户端只读成品值。
- **whole-value event**：状态型日志事件携带变更后的完整状态，而非裸增量。
- **claim / owner token**：创建时显式记录的所有权凭证；拆卸与取消围绕它进行。
- **preset / profile 组合**：部署时选择挂载哪些包与行的显式清单；能力可用性由它决定。
- **durable boundary**：持久化/协议入口；在这里做 schema 校验、版本声明与迁移。
- **slot（槽位）**：按区域声明的扩展点；贡献者依赖域契约，不依赖彼此。
- **不可逆动作**：退出、删除、覆盖安装等无法自动回滚的操作；必须先收集中断事实。

## 机制索引

| 机制 | 标题 | 来源权威 |
|---|---|---|
| `rationale-architecture-1.ownership-and-disposal` | 显式所有权、单一复合拆卸与可完成取消 | 历史（非当前权威） |
| `rationale-architecture-1.capability-seam-contract` | 能力 seam 的三角色、原子 provider 与有界外部实现 | 含当前权威 |
| `rationale-architecture-1.registration-lifecycle` | 注册即生命周期事件：typed 增删、最后发布/最先撤销 | 历史（非当前权威） |
| `rationale-architecture-1.composition-scoped-capability` | 能力可用性由组合作用域决定，而非宿主服务存在 | 含当前权威 |
| `rationale-architecture-1.single-config-owner` | 单一配置所有者、字段归属按生效时机与最少重建 | 含当前权威 |
| `rationale-architecture-1.authority-and-elevation` | 权限升级按调用授予并绑定保留环境 | 含当前权威 |
| `rationale-architecture-1.boundary-validation` | 边界验证：编译期只是声明，入口必须重建与拒绝 | 含当前权威 |
| `rationale-architecture-1.canonical-vocabulary` | 单一规范词汇与展示投影，生产者门控 | 含当前权威 |
| `rationale-architecture-1.identity-and-correlation` | 稳定业务身份、赋值只收窄与面域范围校验 | 含当前权威 |
| `rationale-architecture-1.security-boundary` | 统一认证、principal/peer 分层与单一策略判定点 | 含当前权威 |
| `rationale-architecture-1.durable-projection-single-truth` | 持久投影单一真源、句柄写路径与版本化追加 | 含当前权威 |
| `rationale-architecture-1.structured-state-preservation` | 结构化状态恢复：语义快照先于消费者返回 | 含当前权威 |
| `rationale-architecture-1.recovery-and-failure-domains` | 失败域分类、有界重试与单调恢复证明 | 含当前权威 |
| `rationale-architecture-1.derived-state-single-source` | Host 唯一计算派生状态，客户端只读序号守卫的值 | 提案（非当前权威） |
| `rationale-architecture-1.whole-value-events` | 状态事件携带完整变更后值，禁止裸增量 | 提案（非当前权威） |
| `rationale-architecture-1.single-domain-truth-ledger` | 领域归属由单一账本持有，结构上阻止双重记账 | 提案（非当前权威） |
| `rationale-architecture-1.migration-and-compatibility` | 兼容性显式声明、迁移按请求可选与弃用允许列表 | 含当前权威 |
| `rationale-architecture-1.change-transaction` | 变更单事务：预检、快照、单次重组合与回滚 | 含当前权威 |
| `rationale-architecture-1.distribution-and-target-binding` | 发现与安装分离，目标由运行中的安装决定 | 含当前权威 |
| `rationale-architecture-1.behavior-locked-refactor` | 行为保持重构以先录制夹具锁定，禁止重录 | 历史（非当前权威） |
| `rationale-architecture-1.versioned-artifact-contract` | 构建期降级、产物版本契约与开发覆盖隔离 | 含当前权威 |
| `rationale-architecture-1.package-hierarchy-and-layering` | 按角色分层、派生清单与单向依赖门禁 | 含当前权威 |
| `rationale-architecture-1.startup-and-readiness` | 单次启动真实后端，显式就绪/失败恢复面 | 历史（非当前权威） |
| `rationale-architecture-1.extension-surface-contract` | 扩展面：声明式槽位、最小主体投影与单一注册即暴露 | 历史（非当前权威） |
| `rationale-architecture-1.meaningful-invariants` | 运行时不变式必须跨时间/可变状态，并提供伴随证据 | 历史（非当前权威） |
| `rationale-architecture-1.real-artifact-qualification` | 以真实实现、真实产物与明示证据范围验证 | 含当前权威 |
| `rationale-architecture-1.executable-coverage-contract` | 把人工维护的覆盖属性变成可执行模型、门禁与探测 | 含当前权威 |
| `rationale-architecture-1.fail-loud-and-diagnostics` | 致命失败不恢复，诊断有界且先落盘 | 含当前权威 |
| `rationale-architecture-1.bounded-output-and-diagnostics` | 有界输出：存储 seam、定位器与独立后处理策略 | 含当前权威 |
| `rationale-architecture-1.closed-intent-union` | 用封闭判别联合替代可选字段袋，穷尽桥接 | 含当前权威 |
| `rationale-architecture-1.deterministic-scheduling` | 确定性候选调度、区间缓存与按实际读取失效 | 含当前权威 |
| `rationale-architecture-1.structural-taxonomy` | 结构位置词表取代业务 kind 名单 | 含当前权威 |
| `rationale-architecture-1.explicit-units-and-routes` | 显式单位模式、最小干扰路径与单一投影函数 | 含当前权威 |
| `rationale-architecture-1.fail-safe-irreversible-actions` | 不可逆动作先收集中断事实，失败按"有工作"处理 | 含当前权威 |
| `rationale-architecture-1.settled-vs-future` | 已定案设计、未来实现与不做清单分离 | 提案（非当前权威） |

## 采用工作流

1. **建立清单。** 把本参考的 35 个机制与目标项目的实际入口、包、持久化面、API、UI 扩展点、构建与发布流程逐项对照。
2. **标记触发。** 每个机制记录出现/未出现的具体事实；未出现时写重新激活条件。
3. **分配所有者。** 对每个已触发机制指定一个创建者/生命周期所有者、一个执行点和一个证据所有者。
4. **实现最小等价。** 优先实现自动门禁（类型、注册事务、运行时拒绝、静态扫描、测试）；人工评审只作为补充。
5. **处理迁移。** 对已有数据/调用方声明读兼容、按请求迁移、保留回退；不得用"自动迁移所有对象"掩盖不兼容。
6. **补验证。** 按每节的 positive/rejection/recovery 设计实际场景；保留命令与输出，区分未执行与通过。
7. **评审例外。** 每个例外必须有事实触发、影响范围与再评估条件；不得用"项目小/时间紧"替代。

## 评审检查表

- 所有权是否显式，拆卸是否单一逆序，取消是否只结算一次？
- 能力 seam 是否有定义/实现/消费三角色，provider 注册是否原子，外部进程是否有界？
- 注册表是否发 typed 增删事件，是否最后发布/最先撤销？
- 能力可用性是否由组合作用域决定，而不是宿主服务存在？
- 每项配置是否只有一个权威来源，字段归属是否按生效时机？
- 提权是否逐次批准，保留环境是否绑定策略并在变化时丢弃？
- 外部输入是否在边界精确验证，恶意帧是否丢弃而不抛错？
- 规范词汇与展示投影是否单一来源，是否只接纳有生产者的变体？
- 身份是否稳定、只收窄、由拥有它的边界显式携带？
- 认证是否统一、principal/peer 是否分层、策略是否单点判定且默认拒绝？
- 持久化是否单一真源、句柄写路径唯一、读兼容显式？
- 失败是否分类、重试是否有界且有进展证明、恢复是否幂等收敛？
- 派生状态是否只在 Host 计算，客户端是否按 seq 采用最后值？
- 迁移是否按请求可选，弃用是否有允许列表？
- 变更是否单事务、预检、可回滚？
- 发现与安装是否分离，目标是否由运行中安装决定？
- 行为保持重构是否先录制夹具且禁止重录？
- 构建产物是否版本化并在加载前校验，开发覆盖是否隔离？
- 包分层是否单向、清单是否派生、跨实例身份是否单实例？
- 启动是否只初始化真实后端一次，就绪/失败是否有显式界面？
- 扩展面是否最小主体、同一注册路径、注册即暴露？
- 运行时不变式是否跨时间关系并有伴随证据？
- 真实实现/真实产物是否覆盖声明，未测平台是否记录？
- 覆盖属性是否有可执行模型、门禁、真实车道与人工矩阵？
- 致命失败是否不恢复、诊断是否有界且先落盘？
- 输出是否有界、定位器是否不暴露路径、存储失败是否降级？
- 意图是否封闭联合且穷尽桥接？
- 候选调度是否最左确定、缓存区间显式、依赖按实际读取？
- 结构层是否不点名业务 kind？
- 单位/路径是否显式，映射是否在元数据校验后发布？
- 不可逆动作是否先收集中断事实，查询失败是否按有工作处理？

## 规模化与参数化

- 小项目可以把多个包合并，但必须保留**单一所有者、显式契约、运行时拒绝、失败路径与证据**；合并不能删除边界。
- 单人项目仍可用测试、脚本与清单实现同样的强制；把评审事项改写成可执行检查或明确的发布前清单。
- 无外部 provider 时可只保留 seam 的定义与边界说明，但必须记录未来替换触发条件。
- 无多进程/多租户时可暂不实现介质锁，但必须声明单进程假设与升级触发。
- 无 GUI 时可省略视觉覆盖车道，但不能省略其可执行模型与人工矩阵的等价物。

## 证据限制（全局）

- 本参考只阅读了决策正文，没有执行源项目的构建、测试、lint、格式化或远端操作；所有验证均为计划。
- 引用行号是固定提交下的实际阅读范围；行号有界不代表该范围自动支撑每一条推断，机制描述以正文语义为准。
- archived/proposed 来源不构成当前权威；混合来源的机制已在节内标注。
- 链接的 docs/packages README 未逐篇阅读；跨域绑定未声明，不能把"某 owner 负责"当作已核实保证。
- 源项目明确的限制（平台、凭据、录制回放、单进程假设等）保留在各节 limitations 中，不因迁移而消失。


<a id="rationale-architecture-1.ownership-and-disposal"></a>
## rationale-architecture-1.ownership-and-disposal — 显式所有权、单一复合拆卸与可完成取消

**来源权威。** 历史，非当前权威（archived=2）。

**适用与触发。** 适用于有生命周期、并发取消或可部分失败的对象。无状态纯函数不适用。 触发条件：创建持有清理器、owner token 或写句柄的对象；Agent、会话或执行器进入终态；取消、超时、压缩或失败路径需要停止在途工作。

**问题。** 资源、Agent 与执行器之间的所有权若只靠惯例，重建、取消与部分失败会留下孤儿、双重释放或悬挂句柄。

**前置条件。** 所需支持：需要可注入的时钟/调度器以测试超时，以及能断言残留的测试运行时。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 所有权在创建时显式记录为句柄/令牌/owner token，读者不得从注册表或上下文反推所有者。
2. 拆卸顺序是契约的一部分：消费者、订阅、句柄、注册、父级依次释放；同一创建点登记一个有序复合 effect，禁止散落的 finally。
3. 取消是排队感知的完整操作：清除队列、标记类型化原因、只结算一次，且取消后不得再产生普通结果。
4. 策略留在消费者；能力层只保存不透明 owner 与最小操作，不解释业务取消原因。
5. 部分创建失败必须回滚已创建部分；已发布对象最后发布、最先撤销。

**角色与责任。**
- 创建者是唯一生命周期所有者，负责发布与拆卸。
- 执行器持有不可伪造的 owner token，只向创建者报告完成/失败。
- 能力层保存不透明所有权，不决定业务策略。

**步骤。**
1. 创建资源前确定 owner 与清理顺序。
2. 在同一个 effect/事务内注册所有拆卸步骤，按逆序释放。
3. 发布点放在所有依赖就绪之后；失败时回滚到未发布状态。
4. 取消时先停止接收新工作，再清空队列并发出类型化原因，最后等待在途工作到达安全点。
5. 终态后验证无剩余句柄、订阅或计时器，并保持幂等。

**完成信号。** 对象进入终态后无剩余句柄/订阅/计时器，且重复拆卸幂等。

**强制与信任边界。** 模式：结构强制 + 代码评审。实现：句柄/owner token 类型、唯一有序 effect、取消返回类型化原因；测试覆盖部分失败与重复拆卸。 信任：类型只能防止遗漏显式参数，不能证明所有路径都走同一 effect；评审检查创建/发布/撤销三点。 失败处理：未注册清理或顺序错误表现为测试/运行时残留断言失败；取消不完整表现为重复结算。 例外：只读的进程级常量无需所有权；外部进程若由操作系统回收仍需显式关闭协议。

**迁移实现。** 策略：先建立 owner/句柄抽象，再逐创建点迁移，最后删除隐式全局单例。 实现：为每个创建点引入返回 disposer 的工厂；把零散清理合并为逆序 effect；取消改为队列感知并保留类型化原因。 所需支持：需要可注入的时钟/调度器以测试超时，以及能断言残留的测试运行时。

**关联机制。** `rationale-architecture-1.capability-seam-contract`、`rationale-architecture-1.registration-lifecycle`、`rationale-architecture-1.recovery-and-failure-domains`

**验证（全部为计划，未执行）。**
- 正向：部分创建失败后不留下句柄或订阅；取消在排队、执行、结算三个时点都只结算一次；终态后重复拆卸幂等
- 拒绝：从注册表反推所有者的调用被类型或评审拒绝；散落的清理顺序导致消费者先于句柄释放时测试失败
- 恢复：发布失败回滚后可用新 owner 重建；取消后新工作被拒绝且旧工作不产生普通结果

**限制。** 无法证明外部系统真的释放了资源；跨进程所有权仍需协议级关闭确认。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:1-51@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-10-after-call-compaction-pressure-and-overflow-recovery.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-18-agent-lifecycle-and-ownership-contracts.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-10-after-call-compaction-pressure-and-overflow-recovery.md:1-62@687f282e

<a id="rationale-architecture-1.capability-seam-contract"></a>
## rationale-architecture-1.capability-seam-contract — 能力 seam 的三角色、原子 provider 与有界外部实现

**来源权威。** 含当前权威（implemented=4, archived=2, proposed=1）。

**适用与触发。** 适用于会被替换、外包或跨进程的能力。纯内部纯函数不需要。 触发条件：引入可替换后端、外部引擎或第二种实现；注册 provider、启动外部进程或暴露模型工具。

**问题。** 可替换能力若把契约、实现与模型界面混在一起，替换 provider 会泄漏协议细节，或在缺少 provider 时静默失败。

**前置条件。** 所需支持：需要能够替换 provider 的组装层，以及外部进程测试夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 拆分为 Service Definition（ctx 键与词汇）、Provider（实现）、Consumer（模型/调用方）三角色；seam 指完整三件套。
2. provider 注册原子化：重复注册或启动失败必须回滚，不留下半注册状态。
3. 对外暴露封闭操作联合，禁止协议逃生口；结果归一化为封闭联合。
4. 外部进程必须有边界：超时、输出上限、退出协议、崩溃分类与显式拒绝，而非重试到成功。
5. 模型工具包只负责参数、身份与错误映射，不拥有存储或协议。
6. 两个真实实现（不同内部结构）验证词汇中立；单一 mock 不算。

**角色与责任。**
- Definition 包拥有 ctx 键、词汇与类型，不实现 IO。
- Provider 包拥有实现与注册清理。
- Consumer/工具包拥有调用策略与错误映射。

**步骤。**
1. 先定义封闭操作与规范化结果，不暴露 provider 对象。
2. 为 provider 注册建立原子事务与 disposer。
3. 实现外部边界：启动、超时、输出限制、关闭与失败分类。
4. 用两个真实实现跑同一契约测试，发现词汇缺口。
5. 把模型工具作为独立 consumer，只在显式挂载时注册。

**完成信号。** provider 可替换、重复注册被拒、外部进程失败被分类，两个真实实现通过同一契约。

**强制与信任边界。** 模式：类型/运行时注册强制 + 契约测试。实现：ctx 服务定义、封闭联合穷尽 switch、原子注册回滚、共享契约套件在两个真实实现上运行。 信任：共享测试证明已测行为，不证明任意新 provider 正确；注册强制防止两个实现并存。 失败处理：缺失 provider 应在调用点显式失败；重复注册抛错；外部进程超时/超限被分类拒绝。 例外：仅有一个进程内实现且无替换需求时可以暂不拆包，但必须保留 seam 三件的边界说明与未来触发条件。

**迁移实现。** 策略：按 Definition→Provider→Consumer 顺序拆分，最后迁移调用方并删除直连。 实现：先提取词汇与 ctx 键；把现有实现包成 provider；把模型入口移出存储包；加共享契约套件。 所需支持：需要能够替换 provider 的组装层，以及外部进程测试夹具。

**关联机制。** `rationale-architecture-1.ownership-and-disposal`、`rationale-architecture-1.composition-scoped-capability`、`rationale-architecture-1.bounded-output-and-diagnostics`

**验证（全部为计划，未执行）。**
- 正向：两个真实实现通过同一契约套件；provider 注册失败后旧实现仍可用；外部进程超时被分类处理
- 拒绝：模型工具直接 import provider 内部被依赖门禁拒绝；第二个 provider 注册被拒绝
- 恢复：注册回滚后可重新注册；provider 崩溃后 consumer 得到显式错误而非挂起

**限制。** 契约测试只能覆盖声明的操作；未声明的协议差异仍是替换风险。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-15-lsp-capability-seam.md:1-199@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-11-node-office-kit.md:1-66@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-23-client-plugin-loading-model.md:1-123@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-12-computer-use-provider-registration.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-creator-persistent-plugin-management.md:1-31@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md:1-329@687f282e8625c6b8d11ff58211a90524be2e4317（proposed）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-15-lsp-capability-seam.md:1-199@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-11-node-office-kit.md:1-66@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-capability-seams.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-23-client-plugin-loading-model.md:1-123@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-12-computer-use-provider-registration.md:1-35@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-creator-persistent-plugin-management.md:1-31@687f282e
来源：deepseek-harness/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md:1-329@687f282e

<a id="rationale-architecture-1.registration-lifecycle"></a>
## rationale-architecture-1.registration-lifecycle — 注册即生命周期事件：typed 增删、最后发布/最先撤销

**来源权威。** 历史，非当前权威（archived=2）。

**适用与触发。** 适用于运行时增删的注册表、插件、provider、槽位与事件源。 触发条件：注册表成员被其他组件派生；插件/服务加载、卸载、替换；创建跨作用域可见的对象。

**问题。** 跨 fiber 的注册表若让消费者推断成员变化，加载顺序、热重载与卸载会产生悬挂订阅或错误快照。

**前置条件。** 所需支持：需要可重复加载/卸载的测试装置。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 注册表在成员增加/移除时发出类型化事件，消费者镜像注册而不是轮询或假设加载顺序。
2. 增加失败要显式抛错；移除按监听器隔离，一个监听器失败不影响其他监听器。
3. 创建时最后发布，处置时最先撤销；中途失败回滚发布。
4. 注册来源决定可见性与清理，不决定授权；作用域是扁平且无父子继承的。
5. 不存在就是诚实状态，不用空对象或占位实现掩盖。

**角色与责任。**
- 注册表拥有成员表与事件。
- 消费者订阅事件并维护自己的派生镜像。
- 创建者负责发布/撤销顺序。

**步骤。**
1. 定义 add/remove 事件与成员身份。
2. 创建时先完成内部初始化，再发布。
3. 消费者订阅事件建立镜像，并在自身卸载时退订。
4. 移除时逐个通知并隔离失败。
5. 撤销时先从可见表摘除，再关闭资源。

**完成信号。** 成员增删事件按序到达，消费者镜像一致，卸载后无残留订阅。

**强制与信任边界。** 模式：事件契约 + 清理测试。实现：typed add/remove、每监听器 try/catch、发布/撤销顺序断言、重复注册抛错。 信任：事件保证通知，不保证消费者正确处理；镜像测试验证。 失败处理：订阅泄漏表现为卸载后仍收到事件；发布过早使消费者看到半初始化对象。 例外：纯静态常量表无需事件；单进程单消费者且无重载时可简化，但需记录触发条件。

**迁移实现。** 策略：先给现有注册表加事件，再迁移消费者，最后删除轮询。 实现：在 add/remove 路径发事件；消费者以订阅替代读取快照；把发布点后移。 所需支持：需要可重复加载/卸载的测试装置。

**关联机制。** `rationale-architecture-1.ownership-and-disposal`、`rationale-architecture-1.composition-scoped-capability`、`rationale-architecture-1.extension-surface-contract`

**验证（全部为计划，未执行）。**
- 正向：增删事件按序到达且镜像一致；一个监听器抛错不影响其他监听器；卸载后无残留订阅
- 拒绝：消费者依赖加载顺序的测试失败；重复注册被拒绝
- 恢复：回滚发布后注册表无该成员；热重载后消费者重新镜像

**限制。** 事件不提供跨进程一致性；进程崩溃后的成员恢复仍需持久化或重建。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-05-subagent-provider-lifecycle-events.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-08-agent-scope-contexts.md:1-176@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-05-subagent-provider-lifecycle-events.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-08-agent-scope-contexts.md:1-176@687f282e

<a id="rationale-architecture-1.composition-scoped-capability"></a>
## rationale-architecture-1.composition-scoped-capability — 能力可用性由组合作用域决定，而非宿主服务存在

**来源权威。** 含当前权威（implemented=4, archived=1）。

**适用与触发。** 适用于可选工具、实验 bundle、模型界面与部署组合。 触发条件：能力对应模型工具或可选 bundle；多个 preset/profile 需要不同能力集；默认关闭的实验能力。

**问题。** 把工具或能力注册在拥有数据的宿主服务里，会让所有 profile（包括能力克制的 minimal）自动获得它，并把组合选择藏进服务配置。

**前置条件。** 所需支持：需要可枚举 preset 工具列表的测试与 bundle 清单。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 可用性声明在组合/preset 层；拥有数据的服务不注册模型界面。
2. Consumer 包声明 inject 工具并在服务的 inject 作用域内注册，挂载作用域拥有定义与清理。
3. 随安装交付的可选能力默认关闭，只有显式选择才注册；安装成本（依赖、凭据、冲突）纳入准入。
4. 权限与可用性分离：被委派的子 agent 可继承 schema，但执行仍按身份拒绝。
5. 不引入第二套 patch 语言或 preset 专用注册路径。

**角色与责任。**
- 组合/profile 拥有者决定挂载哪些行。
- Consumer 工具包负责参数校验与错误映射。
- 宿主服务只提供数据与执行原语。

**步骤。**
1. 把模型工具移出存储服务，建立独立 Consumer 包。
2. 在 preset/profile 行中显式挂载该 Consumer。
3. 让 Consumer 在服务 inject 作用域内注册工具，随挂载清理。
4. 为默认关闭能力建立目录、元数据与准入检查。
5. 验证 minimal 的工具列表不含该 schema。

**完成信号。** 目标 preset 的工具列表与挂载行一致；未挂载时能力不存在。

**强制与信任边界。** 模式：组合快照 + 工具列表测试。实现：preset 工具列表快照、bundle 准入检查、inject 作用域清理、默认关闭目录。 信任：快照证明已测组合；部署仍可能自定义 profile。 失败处理：未挂载即不注册；宿主服务存在但 consumer 未挂载时无工具；依赖缺失时安装被拒。 例外：所有 preset 都需要的基础能力可直接挂在基础行，但仍需在组合清单中可见。

**迁移实现。** 策略：先把注册从宿主服务迁到 Consumer，再在目标 preset 挂载，最后删除服务配置开关。 实现：新增 tool-* 包并声明 inject；把 exposeTools 配置删掉；为 minimal 快照加断言。 所需支持：需要可枚举 preset 工具列表的测试与 bundle 清单。

**关联机制。** `rationale-architecture-1.registration-lifecycle`、`rationale-architecture-1.capability-seam-contract`、`rationale-architecture-1.distribution-and-target-binding`

**验证（全部为计划，未执行）。**
- 正向：minimal 不含可选工具 schema；挂载行时工具出现并随卸载消失；子 agent 继承 schema 但执行被拒绝
- 拒绝：宿主服务存在但未挂载 consumer 时无工具；未准入的 bundle 安装被拒
- 恢复：卸载 consumer 后定义清理；移除 bundle 后保存的选择显式报告兼容性缺口

**限制。** 组合快照不能证明每个部署都按预期挂载；运行时自定义仍可能引入未列出的组合。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-08-agent-scope-contexts.md:1-176@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-experimental-voice-input.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md:1-33@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-preset-scoped-schedule-tools.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-08-agent-scope-contexts.md:1-176@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.md:1-35@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-experimental-voice-input.md:1-35@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-experimental-capabilities-as-optional-bundles.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-preset-scoped-schedule-tools.md:1-34@687f282e

<a id="rationale-architecture-1.single-config-owner"></a>
## rationale-architecture-1.single-config-owner — 单一配置所有者、字段归属按生效时机与最少重建

**来源权威。** 含当前权威（implemented=3, archived=2）。

**适用与触发。** 适用于插件、桌面壳、部署 profile 与任何有用户覆盖的配置。 触发条件：新增用户设置、壳层设置或部署配置；配置在启动前/宿主不可用时需要读取；热更新、密钥引用或跨进程配置。

**问题。** 第二套设置存储会复制 schema/默认值/持久化/通知并压过部署覆盖；按构造冻结配置会让热更新失效，或为改一个值重建整个插件。

**前置条件。** 所需支持：需要能模拟启动顺序与热重载的测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 每项配置只有一个所有者与一个权威来源；统一 UI 可以聚合多个所有者，但迁移必须转移旧值并定义生效时机，不能有含糊优先级。
2. 配置归属按运行依赖与生效时机决定，不按 UI 展示位置决定。
3. 分层顺序固定：schema 默认 < 组合 base < 用户 section；部署覆盖优先。
4. 只在操作时解析可变配置；进行中的工作保留起始事实，两个跨越请求看到两代配置。
5. 密钥在配置中是引用，值留在安全存储。
6. live 字段是稳定引用：只改其值不重建插件；结构差异才重建。

**角色与责任。**
- Loader/Config 解析器是唯一配置所有者。
- 插件声明字段与默认值，不另建设置库。
- UI 只枚举已声明字段。

**步骤。**
1. 列出每个设置的消费进程与生效时机。
2. 选定唯一权威存储并删除第二套写入者。
3. 定义分层与覆盖顺序，写迁移路径。
4. 把构造期快照改为操作期解析；live 字段使用稳定引用比较。
5. 把密钥替换为引用解析器。

**完成信号。** 每项设置只有一个权威来源，迁移后旧值可用，live 变更不重建插件。

**强制与信任边界。** 模式：单一 schema + 重建测试。实现：Config schema、字段枚举、live 引用比较、迁移测试、禁止第二存储的评审规则。 信任：schema 完整性不证明设置真的到达消费点；需重建/生效测试。 失败处理：第二写入者导致值漂移；错误归属导致宿主不可用时无法读取。 例外：壳层功能确实需要在 Host 启动前读取时可拥有独立设置文件，但不得复制 Host 插件默认值。

**迁移实现。** 策略：先命名唯一所有者，再迁移值，最后删除旧存储。 实现：把设置读取集中到 Loader；live 字段声明为引用；壳层设置独立文件。 所需支持：需要能模拟启动顺序与热重载的测试。

**关联机制。** `rationale-architecture-1.distribution-and-target-binding`、`rationale-architecture-1.package-hierarchy-and-layering`

**验证（全部为计划，未执行）。**
- 正向：只改 live 值不重建插件；两个跨越请求看到各自配置代；旧值迁移后行为一致
- 拒绝：第二设置库的写入被评审拒绝； shell 直接读取 Host patch 被拒绝
- 恢复：无效保存值只回退该字段；迁移失败保留原值并报告

**限制。** 无法自动判断某个新设置的正确所有者；仍依赖设计评审。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-28-user-settings-seam.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-29-request-level-llm-config-credentials.md:1-30@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md:1-33@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-profile-owned-live-configuration.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-08-desktop-shell-configuration.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-28-user-settings-seam.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-29-request-level-llm-config-credentials.md:1-30@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-profile-owned-live-configuration.md:1-29@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-08-desktop-shell-configuration.md:1-29@687f282e

<a id="rationale-architecture-1.authority-and-elevation"></a>
## rationale-architecture-1.authority-and-elevation — 权限升级按调用授予并绑定保留环境

**来源权威。** 含当前权威（implemented=2）。

**适用与触发。** 适用于 agent 自主安装、沙箱提权、长期执行环境。 触发条件：agent 可安装能力或执行提权操作；保留进程/变量跨调用存活；沙箱模式或工作区策略变化。

**问题。** 把安装/提权工具永久暴露，或让保留执行环境在策略变化后继续运行，会让一次性授权变成持续权限。

**前置条件。** 所需支持：需要可模拟策略变化与临时环境释放的测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 管理/安装类工具整体受完整访问或逐次审批门控，走共享升级通道，不新建生成代码生命周期。
2. 保留环境在创建时绑定一个已解析模式、工作区根与会话身份，直到释放。
3. 策略变化必须丢弃保留环境，因为运行中的后端无法把句柄与后台工作迁移到新策略。
4. 一次性提权使用全新临时环境，返回前释放，不能访问原变量或保留声明。
5. 提供方拒绝策略不一致的复用；权限变化同步提交并取消在途执行。

**角色与责任。**
- 审批/升级通道授予一次性权限。
- 执行器绑定环境与策略。
- provider 拒绝不一致复用。

**步骤。**
1. 识别需要提权的操作边界。
2. 通过共享升级通道取得逐次批准。
3. 为批准创建临时环境，执行完立即释放。
4. 常规保留环境记录模式/工作区/会话身份。
5. 策略变化时取消并丢弃环境，重新创建。

**完成信号。** 一次批准只覆盖一次执行；策略变化后无旧环境可复用。

**强制与信任边界。** 模式：审批门控 + 运行时拒绝。实现：逐次审批、环境身份断言、策略版本检查、临时环境释放测试。 信任：审批记录证明授权事实，不证明环境已隔离；需运行时拒绝测试。 失败处理：提权环境泄漏表现为可访问旧变量；策略变化未丢弃导致旧权限继续。 例外：无提权能力的只读工具不需要逐次审批；但其注册仍受组合作用域约束。

**迁移实现。** 策略：先引入逐次审批，再引入环境身份绑定，最后删除永久提权路径。 实现：把安装工具挂到审批门控；为执行环境加策略身份；策略事件触发丢弃。 所需支持：需要可模拟策略变化与临时环境释放的测试。

**关联机制。** `rationale-architecture-1.ownership-and-disposal`、`rationale-architecture-1.security-boundary`、`rationale-architecture-1.composition-scoped-capability`

**验证（全部为计划，未执行）。**
- 正向：一次批准只影响该次执行；策略变化后保留变量被丢弃；提权程序不能读取原环境变量
- 拒绝：无审批的安装调用被拒绝；策略不一致的复用被 provider 拒绝
- 恢复：临时环境释放后可重新申请；策略切换后新执行使用新环境

**限制。** 无法证明操作系统级隔离；仍需后端沙箱的既有边界与平台限制。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-creator-persistent-plugin-management.md:1-31@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-08-persistent-ptc-sandbox.md:1-31@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-16-creator-persistent-plugin-management.md:1-31@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-08-persistent-ptc-sandbox.md:1-31@687f282e

<a id="rationale-architecture-1.boundary-validation"></a>
## rationale-architecture-1.boundary-validation — 边界验证：编译期只是声明，入口必须重建与拒绝

**来源权威。** 含当前权威（implemented=1, archived=3）。

**适用与触发。** 适用于 API、WebSocket、IPC、URL 路由、持久化读取与任何模型输出。 触发条件：接收模型生成 JSON、主机帧、文件/网络输入；注册端点或解析 URL/路由；校验后需要持久化或分发数据。

**问题。** 类型、schema 或生成器只描述意图；模型 JSON、外部帧、路由与存储数据在运行时仍可能伪造、缺字段或丢键。

**前置条件。** 所需支持：需要能构造畸形帧与属性测试的 harness。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 在边界按声明的精确字段集校验；多余/缺失字段显式失败，不以宽松转换吞掉。
2. 宿主输入按不可信处理：逐字段形状校验并重建，恶意帧丢弃而不是在消息处理器抛错，绝不回显未验证标识符。
3. 校验必须无损：不得重建对象而丢掉自有键（如 __proto__）；只读谓词优于复制。
4. 编译期类型与运行时校验由同一语义走查器/生成器保证一致，并有属性测试钉住。
5. 路由只接受具体字面量/相对形式；静态门禁检查请求目标与资源引用，防止绕过注册表。

**角色与责任。**
- 入口适配器负责解码一次并产生已验证值。
- 生成器/编译器产出描述符与校验器。
- 静态门禁检查代码中的资源字面量。

**步骤。**
1. 列出每个外部入口与精确字段集。
2. 生成或复用同一校验器，在读取 payload 前验证。
3. 对恶意/超大帧设置丢弃或上限策略。
4. 验证后只向下传已验证值，下游不重复猜测。
5. 用静态门禁扫描路由字面量与禁止的绝对形式。

**完成信号。** 所有外部输入在入口被精确验证，非法输入被结构化拒绝且不产生副作用。

**强制与信任边界。** 模式：运行时拒绝 + 静态门禁 + 属性测试。实现：精确参数断言、封闭 schema、hostile-frame codec、路由字面量扫描、validator/compiler 一致性属性测试。 信任：校验器只能保证已声明字段；未声明语义仍需业务检查。 失败处理：多余字段/畸形帧被结构化拒绝；校验器重建丢键被视为失败；错误路由在构建期失败。 例外：受信任的进程内常量可在类型层约束，但凡跨 wire 仍须运行时验证。

**迁移实现。** 策略：先建立单一解码入口，再替换宽松解析，最后加静态门禁。 实现：抽取 codec/descriptor；在入口一次性 decode；删除下游字段嗅探；加入路由字面量检查。 所需支持：需要能构造畸形帧与属性测试的 harness。

**关联机制。** `rationale-architecture-1.identity-and-correlation`、`rationale-architecture-1.security-boundary`、`rationale-architecture-1.migration-and-compatibility`

**验证（全部为计划，未执行）。**
- 正向：合法输入只解码一次并复用；恶意帧被丢弃且连接继续；无损校验保留自有键
- 拒绝：多余参数、缺字段、绝对路由字面量被拒绝；重建型校验丢键的测试失败
- 恢复：坏帧丢弃后下一帧正常处理；校验失败返回可纠正的结构化错误

**限制。** 无法证明所有外部系统都遵守同一 schema；静态门禁只覆盖它识别的写法。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-06-11-runtime-arg-validation.md:1-25@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-17-web-feature-routes-and-route-gate.md:1-32@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-19-lossless-projection-checkpoint-json.md:1-25@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-31-ptc-runtime-python-fd3-protocol.md:1-45@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-11-runtime-arg-validation.md:1-25@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-17-web-feature-routes-and-route-gate.md:1-32@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-19-lossless-projection-checkpoint-json.md:1-25@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-31-ptc-runtime-python-fd3-protocol.md:1-45@687f282e

<a id="rationale-architecture-1.canonical-vocabulary"></a>
## rationale-architecture-1.canonical-vocabulary — 单一规范词汇与展示投影，生产者门控

**来源权威。** 含当前权威（implemented=3, archived=6）。

**适用与触发。** 适用于跨适配器内容块、错误分类、命令语法、UI 文案与展示表格。 触发条件：跨包/跨适配器共享内容、错误或展示语义；新增变体、别名或本地化文案；解析 CLI/命令/用户输入。

**问题。** 同一概念在多处各自定义字段、文案或解析规则，会让适配器、展示与日志漂移，且无法判断哪些变体真的有人生产。

**前置条件。** 所需支持：需要多实现契约测试与源码扫描器。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 规范词汇由一个定义包拥有；合并可扩展映射，适配器承担翻译成本。
2. 执行局部规范值与确定性展示投影分离；注册时必须声明展示，渲染前验证无损 JSON。
3. 一个概念只有一个解析前门；下游不得重读 argv/原始行。
4. 自然语言文案由来源包拥有；存在性/对齐检查不算使用证据，需源码级门禁拒绝散落文案。
5. 只在有真实生产者时接纳新词汇/变体；无生产者的表面应删除而非移植。

**角色与责任。**
- 定义包拥有类型、词汇与默认展示。
- 适配器/生产者负责翻译与产生规范值。
- 展示层只消费投影，不重新解释语义。

**步骤。**
1. 确定概念的唯一定义包与规范表示。
2. 把解析集中到一个前门并返回封闭联合。
3. 注册时强制提供展示投影并验证无损。
4. 删除无生产者的别名/变体；保留需记录触发条件。
5. 用源码门禁检查散落文案与重复解析。

**完成信号。** 同一概念只有一个规范表示与一个解析入口，展示投影确定且无生产者的变体已删除。

**强制与信任边界。** 模式：类型/注册强制 + 源码门禁。实现：合并映射、必填展示声明、单解析入口、AST 文案门禁、生产者清单。 信任：类型防止形状漂移，不证明语义等价；需跨实现测试。 失败处理：缺失展示在注册时失败；重复解析在评审/门禁失败；无生产者词汇被删除。 例外：临时迁移期可保留旧别名，但必须有移除条件与单一转换点。

**迁移实现。** 策略：先收敛定义与解析，再迁移展示，最后删除别名。 实现：建立定义包；把解析集中；注册时要求投影；加文案 AST 门禁。 所需支持：需要多实现契约测试与源码扫描器。

**关联机制。** `rationale-architecture-1.boundary-validation`、`rationale-architecture-1.real-artifact-qualification`

**验证（全部为计划，未执行）。**
- 正向：两个真实适配器产生同一规范值；展示投影确定且无损；命令只解析一次
- 拒绝：无展示声明的注册被拒绝；散落自然语言文案被源码门禁拒绝
- 恢复：新增变体无生产者时被移除；旧别名经单一转换点迁移

**限制。** 规范词汇无法表达实现特有的全部差异；这些差异必须留在适配器并记录。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-06-11-content-block-vocabulary.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-20-canonical-tool-output-contract.md:1-80@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-24-dsh-commander-argument-adapter.md:1-54@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-28-consolidated-tui-presentation.md:1-64@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-08-20-web-composer-lexical-editor.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-10-command-identities-and-composer-file-action.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-27-compiler-independent-typert-model.md:1-55@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-08-23-locale-owned-client-ui-copy.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-scheduled-message-framing.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-11-content-block-vocabulary.md:1-29@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-20-canonical-tool-output-contract.md:1-80@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-24-dsh-commander-argument-adapter.md:1-54@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-28-consolidated-tui-presentation.md:1-64@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-20-web-composer-lexical-editor.md:1-62@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-10-command-identities-and-composer-file-action.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-27-compiler-independent-typert-model.md:1-55@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-23-locale-owned-client-ui-copy.md:1-44@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-scheduled-message-framing.md:1-29@687f282e

<a id="rationale-architecture-1.identity-and-correlation"></a>
## rationale-architecture-1.identity-and-correlation — 稳定业务身份、赋值只收窄与面域范围校验

**来源权威。** 含当前权威（implemented=5, archived=3）。

**适用与触发。** 适用于流式调用、命令、图片、缓存、跨标签页与任何事件关联。 触发条件：事件需要跨流/跨视图关联；流式工具调用分片、图片卸载、命令生命周期；读取缓存或投影并决定是否复用。

**问题。** 用位置、附件索引或可变对象关联事件，会在流式续传、重放、跨窗口截断与多标签页中错配；从上下文反推身份也会制造隐式耦合。

**前置条件。** 所需支持：需要可重放/截断的流测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 每个参与关联的事件携带同一稳定业务 ID；不得用名称、位置或瞬时对象代替。
2. 身份字段只允许赋值/收窄：空或 null 的续传不得擦除已建立身份。
3. 身份由拥有它的边界显式携带（创建/恢复参数、事件载荷、服务请求、传输请求），不提供反向访问器。
4. 校验范围按读取/写入面需要决定：写入/折叠面比对完整身份，纯只读面可只比对生命周期字段。
5. 全局命令必须由能解析实时焦点的 owner 路由，并在行动前捕获精确目标身份；过期目标不得静默回退。

**角色与责任。**
- 生产者铸造并携带稳定 ID。
- 消费者按 ID 关联，不推断。
- owner 负责解析焦点并冻结目标身份。

**步骤。**
1. 定义稳定 ID 与生命周期。
2. 在产生事件/请求时显式传入。
3. 续传路径只允许收窄，不覆盖已有值。
4. 缓存/投影按面域选择身份字段集。
5. 命令执行前捕获并验证目标身份，过期则拒绝。

**完成信号。** 跨流/跨视图/冷恢复都能用同一稳定 ID 关联，过期目标显式拒绝。

**强制与信任边界。** 模式：类型 + 关联测试 + 评审。实现：branded ID、必填参数、续传收窄逻辑、面域身份函数、过期目标拒绝测试。 信任：类型防止遗漏参数，不保证所有生产者都用同一 ID；跨实现测试验证。 失败处理：缺失/过期 ID 导致显式拒绝；续传覆盖导致关联测试失败。 例外：一次性、无跨事件关联的局部对象可使用局部 ID。

**迁移实现。** 策略：先引入 branded ID，再替换位置关联，最后删除反向访问器。 实现：为事件加 ID 字段；把附件索引改为节点+occurrence；命令捕获目标快照。 所需支持：需要可重放/截断的流测试。

**关联机制。** `rationale-architecture-1.boundary-validation`、`rationale-architecture-1.derived-state-single-source`、`rationale-architecture-1.security-boundary`

**验证（全部为计划，未执行）。**
- 正向：跨分片续传保持同一 ID；冷恢复后仍能关联；缓存面域校验按预期复用
- 拒绝：缺失 ID 或过期目标被拒绝；续传擦除身份被测试拒绝
- 恢复：关联丢失时显式重建而非猜测；命令目标过期后要求重新选择

**限制。** 稳定 ID 不能修复生产者给出错误 ID；跨进程仍需协议保证唯一性。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-08-11-trajectory-conversation-context-assembly.md:1-108@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-01-streamed-tool-call-identity.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-10-command-identities-and-composer-file-action.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-explicit-agent-runtime-identity.md:1-47@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-image-offload-events.md:1-49@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-projection-cache-listing-identity-and-cached-rows.md:1-163@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-desktop-page-close-shortcuts.md:1-27@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-01-replace-changed-package-modules-on-recomposition.md:1-86@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-11-trajectory-conversation-context-assembly.md:1-108@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-01-streamed-tool-call-identity.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-10-command-identities-and-composer-file-action.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-explicit-agent-runtime-identity.md:1-47@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-image-offload-events.md:1-49@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-projection-cache-listing-identity-and-cached-rows.md:1-163@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-21-desktop-page-close-shortcuts.md:1-27@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-01-replace-changed-package-modules-on-recomposition.md:1-86@687f282e

<a id="rationale-architecture-1.security-boundary"></a>
## rationale-architecture-1.security-boundary — 统一认证、principal/peer 分层与单一策略判定点

**来源权威。** 含当前权威（implemented=5, archived=1）。

**适用与触发。** 适用于任何多调用方 API、分享/远程访问、自动化连接与权限模型。 触发条件：新增 API/Remote 方法、转发事件或精确路由；非 owner 调用方（分享、CLI、自动化）；撤权、连接关闭或交互参与。

**问题。** 按方法维护白名单、把身份放进请求体或在 gateway 内写规则，会让新端点绕过检查，或让所有者身份被伪造/静默继承。

**前置条件。** 所需支持：需要认证测试夹具、可伪造 wire 的 gateway 测试、快照流客户端测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 完整 API 在分派前统一认证；一个操作使用一个应用凭据，不以路由事实或按方法特权列表决定调用方。
2. 身份（principal）与连接生命周期（peer）分层：principal 可合并扩展、无凭据、可落盘；peer 拥有 ctx/signal/交互模式/dispose，一连接一 peer。
3. 身份只由进程内 Host 在创建 peer 时赋予；wire 的 args/envelope/header/query/cookie 都不能设置或覆盖；未知 kind 永远不是 owner。
4. 每条调用路径显式传 peer，删除默认 owner 回退；已 dispose 的 peer 在读取 payload 前拒绝，流结束、在途 unary 不取消、后续调用拒绝。
5. 方法级权限在一个 PDP 计算、一个 PEP 执行，默认拒绝；资源解析只读已验证参数；每个资源都需匹配 binding（AND），global 不继承。
6. 业务包拥有 role/binding/policy 与拒绝原因；通用层拥有解析、AND、原因优先级与失败隔离；policy 抛错按拒绝处理且不破坏共享流。
7. 列表/聚合在 global 放行后逐项 allows；转发事件整条放行或拒绝、每个事件至多一个资源；非 owner 不得回答 waterfall。
8. 非 owner 身份随用户消息由生产者记录，owner 省略字段（旧日志即 owner）；身份不进入模型请求。

**角色与责任。**
- Host 准入赋予 peer/principal。
- Gateway 解析端点与资源并调用 PDP；PDP 返回 allow/deny 与原因。
- 业务包注册 policy、条件与拒绝说明。
- 客户端读 Host 推送的快照显示/隐藏入口，不自行判定。

**步骤。**
1. 统一认证所有入口，精确路由先默认拒绝非 owner。
2. 创建 peer 时绑定 principal，删除隐式回退。
3. 为 @Remote 声明 resources 或依赖自动解析；确保覆盖所有触达资源。
4. 注册每 principal kind 唯一 policy，派生 binding 与条件。
5. 在分派前解析资源并 decide；资源非法不询问 decide。
6. 推送快照与增量；客户端仅读快照。
7. 按 producer 记录调用身份；撤权时 invalidate 并 dispose 该 principal 的 peers。

**完成信号。** 所有调用路径统一认证、显式 peer、单一策略判定；非 owner 只获显式授权，快照与调用一致。

**强制与信任边界。** 模式：运行时强制 + 类型 + 安全不变量测试。实现：统一准入、必填 peer、peer-disposed 检查、默认拒绝 RBAC、资源解析完整性规则、policy 失败隔离、快照/调用同源、wire 伪造测试。 信任：测试证明已覆盖路径；未声明的资源仍可能越权，需作者完整性与评审。 失败处理：伪造身份字段被参数/载荷校验拒绝或视为业务数据；无 policy/无 binding/资源非法/策略抛错均拒绝；过期 peer 拒绝。 例外：owner 直通不解析资源；精确非 Gateway 路由暂统一 403，直到逐路由声明规则；交互模式独立于授权。

**迁移实现。** 策略：先统一认证与显式 peer，再引入 PDP/资源解析，最后迁移业务策略与前端快照。 实现：删除 operator 与默认回退；给 @Remote 加 resources；建立 remote-access 包；producer 记录 principal；精确路由默认 403。 所需支持：需要认证测试夹具、可伪造 wire 的 gateway 测试、快照流客户端测试。

**关联机制。** `rationale-architecture-1.boundary-validation`、`rationale-architecture-1.identity-and-correlation`、`rationale-architecture-1.authority-and-elevation`、`rationale-architecture-1.fail-safe-irreversible-actions`

**验证（全部为计划，未执行）。**
- 正向：owner 直通且不读 policy；非 owner 仅获显式 binding 的资源；快照答案与 decide 一致；列表逐项过滤；撤权后调用拒绝且 peers 被 dispose
- 拒绝：wire 各位置伪造 principal 均失败；无 policy/无 binding/资源非法/策略抛错被拒；非 owner 订阅 waterfall 或回答被拒
- 恢复：策略修正后 invalidate 恢复调用；peer 重建后重新连接；快照流重连保留最后快照

**限制。** 资源完整性依赖方法作者；日志保存调用方身份，因此 principal 不得携带凭据；共享浏览器 peer 无法区分标签页；按名默认字段可能误触资源。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-08-12-plugin-owned-settings-surface.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-28-api-browser-trust-boundary.md:1-33@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-08-24-browser-token-authentication.md:1-51@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-concrete-web-bind-address.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-operator-scoped-connect-handshake.md:1-55@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-12-peer-principal-and-remote-access.md:1-675@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-12-plugin-owned-settings-surface.md:1-62@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-28-api-browser-trust-boundary.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-24-browser-token-authentication.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-concrete-web-bind-address.md:1-35@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-09-operator-scoped-connect-handshake.md:1-55@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-12-peer-principal-and-remote-access.md:1-675@687f282e

<a id="rationale-architecture-1.durable-projection-single-truth"></a>
## rationale-architecture-1.durable-projection-single-truth — 持久投影单一真源、句柄写路径与版本化追加

**来源权威。** 含当前权威（implemented=6, archived=2）。

**适用与触发。** 适用于会话日志、投影缓存、系统提示、反馈与任何派生持久化。 触发条件：派生消息/投影、系统提示或反馈需要持久化；打开/恢复会话、并发写同一 id；读取旧版本持久化数据。

**问题。** 派生展示若另存一份可变状态，或写路径绕过单一所有者，重放、导出、并发写与格式变更会产生两份不一致的真相。

**前置条件。** 所需支持：需要崩溃/并发/重放测试与旧版本夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 每个模型可见事实只有一个持久表示；派生投影按序从该表示生成，不另存第二份提交关系。
2. 每次变更携带必需 placement 标记并引用被替换的源事件，使重放可验证决定。
3. 存储 seam 收缩为少量方法，返回按 id 的句柄；获取点是生命周期所有者，发布前打开、同一拆卸关闭，一个 id 只有一个活动写句柄。
4. 追加必须显式版本化并保留人判断/删除语义；不同事件种类区分备注与条目增删。
5. 持久边界读取时按 schema 校验，无效快照只清除受影响部分；身份与内容分开保存，先恢复身份再恢复内容。
6. 兼容性按域显式声明（接受旧版本读、写总是当前版本），不靠通用放宽。

**角色与责任。**
- 会话/领域所有者拥有唯一持久表示与写句柄。
- 投影/派生层只读并重建。
- 迁移/恢复逻辑按声明版本处理。

**步骤。**
1. 确定唯一持久表示与派生链。
2. 引入按 id 句柄，绑定打开/关闭生命周期。
3. 为每次写加 placement/源引用与版本。
4. 在 seed/恢复/每次读时验证 schema。
5. 声明读兼容范围并加迁移门禁。

**完成信号。** 每个事实只有一个持久表示，写路径唯一，重放可验证且旧版本按声明读取。

**强制与信任边界。** 模式：类型/时序 + 重放与并发测试。实现：句柄 API、单写句柄断言、版本戳、迁移允许列表、schema 校验、重放验证。 信任：验证证明结构，不证明语义等价；身份/内容顺序需测试。 失败处理：并发第二写句柄被拒绝；无效数据只清受影响快照；版本不符显式拒绝。 例外：只读派生缓存可丢弃重建，但不得成为写入真源。

**迁移实现。** 策略：先收窄为句柄 API，再迁移写入方，最后删除第二真源。 实现：提取 handle 方法；把投影改为只读派生；加版本字段与迁移允许列表。 所需支持：需要崩溃/并发/重放测试与旧版本夹具。

**关联机制。** `rationale-architecture-1.identity-and-correlation`、`rationale-architecture-1.migration-and-compatibility`、`rationale-architecture-1.derived-state-single-source`

**验证（全部为计划，未执行）。**
- 正向：重放产生同一投影；单句柄串行写；无效快照只清受影响部分；旧版本按声明读取
- 拒绝：第二写句柄/未版本化追加被拒绝；无效 schema 被拒绝
- 恢复：写失败后句柄关闭可重开；迁移失败保留原数据

**限制。** 无法证明外部导出完整；跨进程并发仍需介质锁。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-08-17-settings-describe-mirror.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-14-sidebar-layout-provider-recovery.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-06-18-session-surface.md:1-68@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-08-27-handle-based-session-persistence.md:1-43@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-02-system-prompt-as-surface-node.md:1-94@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-canonical-feedback-log.md:1-33@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-image-offload-events.md:1-49@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-projection-cache-listing-identity-and-cached-rows.md:1-163@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-17-settings-describe-mirror.md:1-35@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-14-sidebar-layout-provider-recovery.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-18-session-surface.md:1-68@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-27-handle-based-session-persistence.md:1-43@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-02-system-prompt-as-surface-node.md:1-94@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-canonical-feedback-log.md:1-33@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-10-image-offload-events.md:1-49@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-projection-cache-listing-identity-and-cached-rows.md:1-163@687f282e

<a id="rationale-architecture-1.structured-state-preservation"></a>
## rationale-architecture-1.structured-state-preservation — 结构化状态恢复：语义快照先于消费者返回

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于草稿、编辑器、结构化输入与异步资源到达。 触发条件：恢复草稿、编辑器状态或带引用的输入；异步创建会话/工作区并携带内容；词典/远程资源延迟到达。

**问题。** 只保存文本投影会丢失引用来源、目标和展示字段；挂载后由 effect 填字又会让首次读取为空，并可能被旧稿覆盖。

**前置条件。** 所需支持：需要往返/生命周期/e2e 测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 快照由文本加有序、不重叠的引用跨度组成，保留 source/ref/label/appearance/clipboardText；排除运行时 ID/DOM/函数。
2. 初始化在输入所有者返回对象前完成，不由 React effect 事后恢复；已存在对象不重复恢复。
3. 公开 API 只接受文本；结构化恢复走内部路径并复用编辑器既有恢复能力。
4. 同一存储键兼容旧字符串并写新结构；单一写入者，引用变化即使文本不变也持久化。
5. 词典到达后只重匹配当前文档，不重写正文/引用、不抢光标、不增加撤销步骤。

**角色与责任。**
- 输入 hub 拥有初始化与持久化。
- 编辑器运行时负责结构恢复。
- 远程词典提供异步匹配，不阻塞输入。

**步骤。**
1. 定义语义快照与校验规则。
2. 在创建/复用对象时决定目标 binding。
3. 在返回前导入文档；失败不先清空。
4. 异步创建前复制选项；导航取消不写稿。
5. 词典到达后按当前文本重匹配。

**完成信号。** 输入所有者在首次返回前已持有完整结构状态，往返语义相等且异步到达不重写正文。

**强制与信任边界。** 模式：类型 + 生命周期测试 + 往返属性。实现：DraftSnapshot 校验、单一 writer、import/export 往返语义、首次读取断言。 信任：往返测试证明结构等价，不证明所有编辑器行为；e2e 验证真实交互。 失败处理：非法跨度/重叠引用被拒绝；提交中初始化拒绝；旧字符串按纯文本恢复。 例外：附件文件对象、上传状态与跨浏览器同步不在该状态内。

**迁移实现。** 策略：先定义快照，再迁移单一存储键，最后删除 effect 恢复。 实现：加 DraftSnapshot；setDraft 内部接受结构；公开 API 保持文本。 所需支持：需要往返/生命周期/e2e 测试。

**关联机制。** `rationale-architecture-1.durable-projection-single-truth`、`rationale-architecture-1.boundary-validation`、`rationale-architecture-1.derived-state-single-source`

**验证（全部为计划，未执行）。**
- 正向：首次读取即完整文档；导入导出往返语义相等；词典重匹配不改变快照/撤销
- 拒绝：重叠或越界引用被拒绝；运行时 ID 进入快照被类型拒绝
- 恢复：旧字符串恢复为纯文本；初始化失败保留原稿

**限制。** 旧数据缺失的引用信息无法无损推断；不承诺跨浏览器同步。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-30-structured-draft-initialization.md:1-88@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-30-structured-draft-initialization.md:1-88@687f282e

<a id="rationale-architecture-1.recovery-and-failure-domains"></a>
## rationale-architecture-1.recovery-and-failure-domains — 失败域分类、有界重试与单调恢复证明

**来源权威。** 含当前权威（implemented=2, archived=2）。

**适用与触发。** 适用于 provider normal 暂态请求、压缩/溢出与已领取输入/回答的 durable 结算；不声称实现 Session 删除级联。

**问题。** 混淆暂态预算、溢出进展证明和输入/回答结算，会重复副作用、掩盖原始失败或制造第二条结算路径。

**前置条件。** 所需支持：需要可控时钟、故障注入与崩溃重跑夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 适配器报告结构化失败事实，不在适配器内决定重试策略。
2. normal 默认仅对明确暂态集合在有限预算内重试；扩大集合需夹具与策略决定，不能把 normal 上限推广给显式 always。
3. 只有溢出压缩恢复依赖 `surface.replaceGeneration` 前进；普通暂态 backoff 不要求改变模型可见代际。溢出无进展便委托后续策略，无人恢复时保留原始错误。
4. normal 保留 durable 调度/失败尝试记录，不同恢复插件各有预算；输入与回答按各自 durable 事实结算，不借用未来 Session 删除能力。
5. 原子领取完整输入批次后才做唯一决定；拒绝/结算各只有一条路径，且 durable 事件拥有结果。
6. 溢出进展用可见代际的单调变化证明；回答 reservation 可在 discard 或未准入的 Turn 结束后解除并重新回答，不能用通用的状态只许前进规则禁止这条路径。

**角色与责任。**
- 适配器分类失败。
- 恢复策略在既有失败扩展点决定。
- 主循环只传输不解释。

**步骤。**
1. 定义失败域与可重试码表。
2. 在适配器产出结构化事实。
3. normal 暂态预算与溢出进展证明分开；取消/释放优先于并发恢复完成。
4. 记录尝试与原始错误。
5. 原子领取完整批次，拒绝不隐式回填；迟到回答只有 durable 准入后才结算。

**完成信号。** normal 有有限预算，溢出 retry 有可见进展证明，输入/回答只有明确的 durable 结算路径。

**强制与信任边界。** 模式：策略表 + 有界循环 + 恢复测试。实现：normal 预算、溢出代际谓词、原子领取与 durable 准入/结算；只覆盖枚举路径。normal 不 eligible/预算耗尽或溢出无进展时委托，无人恢复则保留原始 provider 错误。显式 always 是独立策略，详见 `package-contracts-2.llm-retry-durable`；Session 删除级联仍是另一提案能力。

**迁移实现。** 先按失败域分类，再把各自策略接入现有失败扩展点；normal 用预算，溢出用可见代际证明，输入/回答用领取和 durable 准入结算。所需支持：可控时钟、故障注入与 durable 回放夹具。

**关联机制。** `rationale-architecture-1.ownership-and-disposal`、`rationale-architecture-1.durable-projection-single-truth`、`rationale-architecture-1.fail-loud-and-diagnostics`、`package-contracts-2.llm-retry-durable`

**验证（全部为计划，未执行）。**
- 正向：normal 暂态请求不修改表面也可有限重试；溢出无进展不授权 retry；领取后新增输入独立，前台 pending 后只由迟到回答的 durable 准入结算。
- 拒绝：normal 不 eligible/耗尽不能继续调度，显式 always 不套该上限；durable inbox 拒绝越界坐标或跨列表重复 MessageId，公共 Inbox 不暴露领取。
- 恢复：pruning 已推进代际而 summary 随后失败仍可恢复，取消/释放优先；迟到回答被 discard 或 Turn 未准入结束时释放 reservation，允许再次回答而不改写原 pending tool/result。

**限制。** 无法证明所有瞬态都被正确分类，策略表需随 provider 维护。固定提交内旧 Note 与 llm-retry 包 README 在默认次数、turn 边界上有文档漂移；本机制不声称来源一致，normal/always 与 open-turn 包契约见关联机制。

**来源（固定提交声明依据；不声称本次重核中文全文，也不是已执行的目标产品验证）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-10-after-call-compaction-pressure-and-overflow-recovery.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-31-claimed-pre-step-inbox-lifecycle.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-06-21-bounded-llm-request-recovery.md:1-139@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-timed-user-question-two-settlements.md:1-116@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-10-after-call-compaction-pressure-and-overflow-recovery.md:1-62@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-31-claimed-pre-step-inbox-lifecycle.md:1-44@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-21-bounded-llm-request-recovery.md:1-139@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-timed-user-question-two-settlements.md:1-116@687f282e

<a id="rationale-architecture-1.derived-state-single-source"></a>
## rationale-architecture-1.derived-state-single-source — Host 唯一计算派生状态，客户端只读序号守卫的值

**来源权威。** 提案，非当前权威（proposed=1, archived=1）。

**适用与触发。** 适用于会话标题、todo、goal、plan 与任何多领域派生状态。 触发条件：多领域从同一会话日志派生状态；分页/重连/跨标签页同步；注册/卸载领域插件。

**问题。** 每个领域在客户端各自折叠事件，会复制状态转移逻辑、产生多层栅栏，并在分页窗口缺失历史时给出错误基线。

**前置条件。** 所需支持：需要可控尾页/推送夹具与 headless 组合。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. Host 是派生状态唯一计算点；领域注册纯 init/apply/view 单元，框架驱动订阅、水位线、缓存与检查点。
2. 状态从不写入日志；缓存行带 seq，永不错误、只可能陈旧，读取配方=缓存或 init+只对水位线之后事件 apply。
3. 未变化引用不产生下游工作；只有完整成功求值才发布。
4. 基线只在尾页同步遍历注册表生成一个一致切面，asOfSeq 为最后事件 seq；不新增独立 RPC，也不让客户端决定何时重取。
5. 客户端维持通用 key→{value,seq} 仓，seq 高者胜；领域零客户端代码，快照/推送共用同一 DTO 表。
6. 注册是 effect，卸载即能力缺失；重复 key 抛错；headless 组合可不挂注册表。

**角色与责任。**
- 领域提供纯单元与可选视图。
- 框架驱动、缓存、推送。
- 载体只读并转发。

**步骤。**
1. 定义 init/apply/view 与 schema/version。
2. 注册单元并让框架逐事件驱动。
3. 在尾页生成 baseline 与 asOfSeq。
4. 推送成品值帧，客户端按 seq 合并。
5. 卸载时移除 key，客户端视为缺失。

**完成信号。** 派生值只在 Host 计算，客户端按 seq 采用最后值，注册/卸载表现为能力存在/缺失。

**强制与信任边界。** 模式：单一计算点 + 序号测试。实现：纯单元契约、Object.is 闸门、watermark、尾页一致切面、seq 高者胜、零客户端折叠检查。 信任：序号保证不乱序，不保证业务语义；领域测试验证折叠。 失败处理：陈旧基线不能覆盖新帧；缺失基线时非 owner 视为无能力；同步 await 破坏切面被评审拒绝。 例外：纯 host-only 单元可省略客户端视图；headless 可不注册。

**迁移实现。** 策略：先建 host 注册表与尾页块，再建客户端值仓，最后逐领域删除客户端折叠。 实现：新增 projection 包；api-proxy 同步遍历；客户端 useProjection；删除专用 RPC/字段。 所需支持：需要可控尾页/推送夹具与 headless 组合。

**关联机制。** `rationale-architecture-1.whole-value-events`、`rationale-architecture-1.durable-projection-single-truth`、`rationale-architecture-1.identity-and-correlation`

**验证（全部为计划，未执行）。**
- 正向：刷新等于全新求值；陈旧基线不回滚新帧；仅读取者失效；headless 无该块时键缺失
- 拒绝：客户端重复折叠/await 单元被评审拒绝；重复 key 被拒绝
- 恢复：断线重连从基线恢复；插件卸载后键消失

**限制。** 字段级失效仍可能重扫文档；每个尾页携带所有注册键，载荷可能增长。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-25-web-client-session-scope-and-provide-channel.md:1-142@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/proposed/architecture/2026-07-27-session-projection-and-command-log.md:1-191@687f282e8625c6b8d11ff58211a90524be2e4317（proposed）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-25-web-client-session-scope-and-provide-channel.md:1-142@687f282e
来源：deepseek-harness/.agents/notes/proposed/architecture/2026-07-27-session-projection-and-command-log.md:1-191@687f282e

<a id="rationale-architecture-1.whole-value-events"></a>
## rationale-architecture-1.whole-value-events — 状态事件携带完整变更后值，禁止裸增量

**来源权威。** 提案，非当前权威（proposed=1）。

**适用与触发。** 适用于可恢复状态、命令生命周期、跨标签页同步与缓存。 触发条件：日志事件承载状态；推送/快照/重放消费同一状态；命令或领域变更需要可恢复。

**问题。** 增量事件让消费方必须维护折叠顺序、处理丢失帧与乱序，并迫使每个客户端/服务重复实现状态转移。

**前置条件。** 所需支持：需要乱序/丢帧测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 每个状态型日志事件携带变更后的完整状态；清除用整值墓碑，不用差分。
2. 消费方把最近值视为最终值；乱序用 seq 比较，丢失帧由下一次更新自愈。
3. 状态转移保持廉价：未命中的事件返回同一引用。
4. 命令调用与其结论也按配对事件完整落盘，结构化字段由生产者切分，消费方不重解析；重复载荷用 recordInput:false 省略。
5. 呈现永不进入日志；结果文本是事实数据，布局由客户端计算。

**角色与责任。**
- 领域生产完整值事件。
- 日志/推送传输。
- 消费方按 seq 采用最后值。

**步骤。**
1. 把差分事件改为完整快照/墓碑。
2. 为事件加单调 seq。
3. 消费方保存最后 seq 并忽略更旧值。
4. 命令执行器在调用前/结算时追加配对事件。
5. 用结构化字段替代行文本重解析。

**完成信号。** 每个状态事件可独立作为最终值使用，乱序/丢帧不会产生错误状态。

**强制与信任边界。** 模式：事件契约 + 恢复测试。实现：schema 要求完整值、seq 单调、命令配对、recordInput 去重、重放测试。 信任：契约保证形状，不保证领域真的发送了完整状态；评审/测试验证。 失败处理：裸增量被 schema/评审拒绝；丢失帧表现为暂时陈旧而非错误。 例外：纯追加的不可变事实（如工具结果）无需整值墓碑。

**迁移实现。** 策略：先给事件加完整值与 seq，再迁移消费方，最后删除增量折叠。 实现：改领域事件；加命令配对；客户端按 seq 合并。 所需支持：需要乱序/丢帧测试。

**关联机制。** `rationale-architecture-1.derived-state-single-source`、`rationale-architecture-1.durable-projection-single-truth`、`rationale-architecture-1.canonical-vocabulary`

**验证（全部为计划，未执行）。**
- 正向：乱序帧按 seq 采用最新；丢失帧后下帧自愈；命令刷新/另一标签页可见
- 拒绝：裸增量事件被拒绝；重复命令载荷未省略被测试拒绝
- 恢复：重放重建同一状态；冷读返回准确完整值

**限制。** 整值事件可能增大载荷；超大状态仍需分页或惰性键。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/proposed/architecture/2026-07-27-session-projection-and-command-log.md:1-191@687f282e8625c6b8d11ff58211a90524be2e4317（proposed）

来源：deepseek-harness/.agents/notes/proposed/architecture/2026-07-27-session-projection-and-command-log.md:1-191@687f282e

<a id="rationale-architecture-1.single-domain-truth-ledger"></a>
## rationale-architecture-1.single-domain-truth-ledger — 领域归属由单一账本持有，结构上阻止双重记账

**来源权威。** 提案，非当前权威（proposed=1）。

**适用与触发。** 适用于工作区、分组、sidecar 元数据与任何跨对象归属。 触发条件：引入跨会话/跨对象实体（工作区、分组、元数据）；存在路径、cwd 或外部列表可推导归属；删除注册记录与删除底层数据语义不同。

**问题。** 从 cwd、路径或外部索引推导归属会产生第二真相源；路径规范化会变化，同一对象可能被两处同时声称拥有。

**前置条件。** 所需支持：需要文件系统夹具与并发/崩溃测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 归属是实体侧事实，由单一账本保存；不得从 cwd/路径回退推导或合并。
2. 记录键使用稳定生成 id，路径只做规范化值（realpath）；唯一性按规范化后字符串。
3. 写入时做结构校验阻止一个对象进入两本账；加载时发现重复显式抛错，不掩盖手改数据。
4. 账中 id 在底层不存在时过滤并 prune，不报错；底层缺失目录只报告状态，不自动删除。
5. 当前 Workspace 注册删除只删元数据并保留 Sessions/日志。独立 `session.delete` 仍是未来能力：若实现，先拒绝运行中目标，默认仅叶子，显式 recursive 才自底向上；已不存在项跳过，其他错误中止并可重跑收敛。

**角色与责任。**
- 领域注册表拥有账本与实体缓存。
- 消费者只读接口。
- 删除编排者负责运行中检查与顺序。

**步骤。**
1. 定义稳定 id、路径规范与记录 schema。
2. attach 时校验 cwd/路径并写入账本。
3. 加载时校验重复与缺失，分别 prune/抛错。
4. Workspace 元数据删除保留 Sessions/日志；未来 `session.delete` 若进入范围，再单独实现 running 检查与叶子/递归编排。
5. 为损坏/手改数据记录显式失败路径。

**完成信号。** 归属只能由一个账本产生，重复归属在写入/加载被拒，删除语义与底层数据分离。

**强制与信任边界。** 模式：写入校验 + 加载校验 + 删除编排测试。realpath、attach、重复账本校验属于账本部分；Session 幂等级联/自底向上删除仍是独立未来方案，不声称已有可调用路径。写入校验依赖单进程，多进程需介质锁；缺失目录保留记录。

**迁移实现。** 策略：先建立账本与唯一键，再迁移派生归属，最后删除 cwd 推断。 实现：新增注册表包；写入 attach/detach；删除改为元数据删除。 所需支持：需要文件系统夹具与并发/崩溃测试。

**关联机制。** `rationale-architecture-1.durable-projection-single-truth`、`rationale-architecture-1.recovery-and-failure-domains`、`rationale-architecture-1.settled-vs-future`

**验证（全部为计划，未执行）。**
- 正向：同一 cwd 只能 attach 到一处；路径规范化后唯一；缺失目录保留记录
- 拒绝：重复账本加载抛错；attach cwd 不符被拒绝
- 恢复：未来 `session.delete` 实现后再验证级联中断重跑；当前 Workspace 元数据删除必须保留 Sessions/日志；账中缺失 id 被 prune。

**限制。** 单进程校验无法阻止外部手改，跨进程需额外锁。Session 删除、deleted 事件、递归与 running 检查仍是源提案的未来范围，不能算作现有可执行路径。

**来源（固定提交声明依据；不声称本次重核中文全文，也不是已执行的目标产品验证）。**
- deepseek-harness/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md:1-329@687f282e8625c6b8d11ff58211a90524be2e4317（proposed）

来源：deepseek-harness/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md:1-329@687f282e

<a id="rationale-architecture-1.migration-and-compatibility"></a>
## rationale-architecture-1.migration-and-compatibility — 兼容性显式声明、迁移按请求可选与弃用允许列表

**来源权威。** 含当前权威（implemented=3, archived=2）。

**适用与触发。** 适用于日志格式、投影缓存、协议、客户端 wire 与 API 弃用。 触发条件：持久化格式/协议版本演进；读取旧快照或旧客户端格式；弃用 API 使用模式。

**问题。** 通用放宽、自动迁移所有冷对象或静默改写旧数据，会把不兼容变成隐式行为；调用方也无法表达"这次不能迁移"。

**前置条件。** 所需支持：需要旧版本数据夹具与协议回放。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 读兼容按域显式声明（接受哪些旧版本），写入总打当前版本；迁移只在其能担保的版本上运行。
2. 不冒充另一客户端或推断任意 JSON；只支持已知 wire 格式集合，兼容差异集中在一处。
3. 迁移与驻留区分；需要迁移的对象由调用方按请求选择 allowMigration:false，而不是全局禁止。
4. 失败只影响需要迁移的对象，普通加载/取消/存储错误不进入迁移分支。
5. 弃用先于实现变更：禁止新调用与新别名/包装，保留旧调用者临时可用，并要求领域状态重建。

**角色与责任。**
- 域所有者声明版本与读兼容。
- 调用方按请求选择是否允许迁移。
- 迁移器只在可担保版本上执行。

**步骤。**
1. 为持久化/协议加版本与读兼容声明。
2. 列出明确支持的格式集合。
3. 把迁移入口改为按请求可选。
4. 为拒绝迁移提供打开/继续的显式操作，不自动重试。
5. 弃用 API 并加允许列表。

**完成信号。** 版本/格式显式声明，迁移按请求可选，拒绝路径保留原对象。

**强制与信任边界。** 模式：版本戳 + 允许列表 + 迁移测试。实现：写当前版本、读兼容表、allowMigration、弃用扫描、格式集合。 信任：版本声明证明结构，不证明语义兼容；需跨版本夹具。 失败处理：版本不符/未知格式显式拒绝；迁移被拒时保留原对象。 例外：全新项目无旧数据时可暂不实现迁移，但必须保留版本字段。

**迁移实现。** 策略：先加版本/读兼容，再把迁移改为可选，最后移除弃用调用。 实现：版本字段；格式集合；allowMigration 参数；弃用允许列表。 所需支持：需要旧版本数据夹具与协议回放。

**关联机制。** `rationale-architecture-1.durable-projection-single-truth`、`rationale-architecture-1.settled-vs-future`、`rationale-architecture-1.versioned-artifact-contract`

**验证（全部为计划，未执行）。**
- 正向：当前格式冷读正常；旧版本按声明可读；拒绝迁移时保留对象
- 拒绝：未知格式/版本被拒绝；新弃用调用被允许列表拒绝
- 恢复：打开源对象后完成迁移；迁移失败保留原数据

**限制。** 无法证明所有旧客户端都兼容；跨多个版本可能需要逐级迁移。

**来源（固定提交英文依据；不声称本次独立核对中文全文）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-09-02-projcache-cross-version-read-compat.md:1-79@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-deprecate-synchronous-session-event-reads.md:1-51@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-persistence-attribution-policy.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-02-protocol-specific-model-listing-discovery.md:1-44@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-02-projcache-cross-version-read-compat.md:1-79@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-deprecate-synchronous-session-event-reads.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-17-persistence-attribution-policy.md:1-35@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-02-protocol-specific-model-listing-discovery.md:1-44@687f282e

<a id="rationale-architecture-1.change-transaction"></a>
## rationale-architecture-1.change-transaction — 变更单事务：预检、快照、单次重组合与回滚

**来源权威。** 含当前权威（implemented=2）。

**适用与触发。** 适用于插件安装、profile 重组合、包替换与配置迁移。 触发条件：安装/升级/替换包或 profile；重新组合插件图；文件被原地修改。

**问题。** 安装/升级/重组合被拆成多个顺序未定义的事务，会让新组合包 patch、模块替换与 activation 各自生效，失败后留下半套状态。

**前置条件。** 所需支持：需要可模拟 pnpm 失败、文件变化与 activation 失败的夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. HMR profile watch 与 Plugin Manager 共用 `runExclusive()` 内的 `Hmr.reconcileProfile()`；Config Editor 当前仍直接经 app-boot 重组合，不声称所有调用方已统一。
2. 在修改前预检规则（包能否被表示、兼容性、资源）；不能表示时在任何写入前拒绝。
3. 快照权威 profile 文件，失败时恢复；已停止的行与发布的 resolution 在无新组合时恢复。
4. 检测已加载代码变化用文件身份而非版本；替换集合在重组合前一次性逐出且无备份。
5. 覆盖安装需先卸载再安装，每步一次重组合；拒绝无法确定归属的覆盖。

**角色与责任。**
- HMR/重组合器拥有单事务。
- Plugin Manager 只编辑 profile 并运行包管理器。
- app-boot 在一次调用中应用新一代组合。

**步骤。**
1. 读取新 profile patch 并与磁盘比较。
2. 在任何模块变化前预检；失败即报错。
3. 逐出受影响模块与导入方，停止被替换 entry。
4. 调用一次 app-boot：记录激活、移除旧行、发布 resolution、兼容性预检、应用新组合。
5. 结算 activation；失败则恢复 resolution 与已停止行。

**完成信号。** 一次 profile 变更是一个事务：预检、替换、应用、结算；失败恢复旧组合。

**强制与信任边界。** 模式：独占锁 + 预检 + 快照恢复。HMR/Plugin Manager 的 `runExclusive/reconcileProfile`、文件身份比较、无备份逐出与失败补偿保障进程内顺序，不保证包管理器成功；需失败注入。预检失败不改文件，无法替换报告 pending。Config Editor 当前仍经 app-boot，源码 HMR 原地替换保留独立回滚路径。

**迁移实现。** HMR profile watch 与 Plugin Manager 共用独占 reconcile，再加预检、安装前快照与补偿；包替换先卸载，失败恢复 resolution。Config Editor 的现有 app-boot 路径需显式注明，不能宣称所有入口已统一。所需支持：pnpm、文件变化与 activation 故障夹具。

**关联机制。** `rationale-architecture-1.distribution-and-target-binding`、`rationale-architecture-1.recovery-and-failure-domains`、`rationale-architecture-1.startup-and-readiness`

**验证（全部为计划，未执行）。**
- 正向：原地升级无需重启；新行只启动一次；共享依赖保持单实例
- 拒绝：无法表示的安装在任何写入前被拒；覆盖安装被拒绝
- 恢复：应用失败恢复旧组合；替换失败报告 failed 并保留诊断

**限制。** 不跟踪动态 import 边；仅 package.json 变化可能不被检测。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-guided-plugin-installation.md:1-47@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-01-replace-changed-package-modules-on-recomposition.md:1-86@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-15-guided-plugin-installation.md:1-47@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-01-replace-changed-package-modules-on-recomposition.md:1-86@687f282e

<a id="rationale-architecture-1.distribution-and-target-binding"></a>
## rationale-architecture-1.distribution-and-target-binding — 发现与安装分离，目标由运行中的安装决定

**来源权威。** 含当前权威（implemented=1, archived=0）。

**适用与触发。** 适用于插件市场、按需运行时、开发版与发布版共存。 触发条件：可选/按需 bundle 的发现与安装；已发布应用与源码/开发 checkout 共存；同一版本字符串内容不同。

**问题。** 把发现元数据绑定到注册表查询、或用 cwd/预发布后缀推断目标，会让离线发现失效或把错误版本装进运行中的应用。

**前置条件。** 所需支持：需要发布流水线与离线安装测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 发现元数据内嵌于安装方维护的目录，离线可用，不解析/导入运行时。
2. 选择复用普通安装器、依赖、行 patch、兼容性、进度、取消、回退与脚本审批；官方/可选/成熟度是独立属性。
3. 目标由运行中的安装决定：发布版提供精确版本与精确注册表 pin；源码版链接当前 checkout，不由 cwd/预发布后缀决定；不完整 checkout 不回退。
4. 同版本不证明同内容：替换时同时比较来源与版本。
5. 替换显式触发、保留选择并报告是否重启；启动时不下载；无回滚需明说。
6. 发布顺序：先发布目录包，再发布宣传它的 DSH 包；不把运行时加入生产依赖。

**角色与责任。**
- 安装方拥有目录与目标。
- 普通安装器执行选择。
- 发布流程保证顺序与版本族。

**步骤。**
1. 为发现建立安装方目录与本地化元数据。
2. 选择时解析当前安装目标（发布版 pin 或源码 link）。
3. 比较来源+版本后显式替换。
4. 保留选择并报告重启需求。
5. 按发布顺序发布目录与 DSH。

**完成信号。** 发现离线可用，目标由运行中安装决定，替换显式且来源+版本一致。

**强制与信任边界。** 模式：目录校验 + 目标解析 + 发布顺序检查。实现：离线元数据、精确 pin/link、来源版本比较、显式替换、目录校验、发布族版本。 信任：校验证明目录完整，不证明运行时可用；激活失败仍可保留选择。 失败处理：缺失/过期元数据拒绝；不完整 checkout 不回退；启动不下载。 例外：随安装交付的轻量可选 bundle 仍由普通组合管理。

**迁移实现。** 策略：先建立离线目录，再接入普通安装器，最后区分发布/源码目标。 实现：内嵌元数据与图标；解析安装目标；比较来源+版本。 所需支持：需要发布流水线与离线安装测试。

**关联机制。** `rationale-architecture-1.composition-scoped-capability`、`rationale-architecture-1.change-transaction`、`rationale-architecture-1.versioned-artifact-contract`

**验证（全部为计划，未执行）。**
- 正向：离线可发现；发布版装精确 pin、源码版链接当前 checkout；替换报告重启
- 拒绝：缺失/过期元数据被拒绝；不完整 checkout 不回退注册表
- 恢复：激活失败保留选择；替换取消保留原选择

**限制。** 注册表交付需可达；开发交付需预构建 checkout；同版本源不证明构建相同。

**来源（固定提交英文依据；不声称本次独立核对中文全文）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-official-on-demand-bundles.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-05-official-on-demand-bundles.md:1-37@687f282e

<a id="rationale-architecture-1.behavior-locked-refactor"></a>
## rationale-architecture-1.behavior-locked-refactor — 行为保持重构以先录制夹具锁定，禁止重录

**来源权威。** 历史，非当前权威（archived=3）。

**适用与触发。** 适用于任何声称行为不变的拆分/重写。 触发条件：拆分大模块、重写渲染器/编辑器/解析器；替换实现但声称行为不变；流式/增量行为需要等价。

**问题。** 重构时同时改变行为，或用更新夹具让测试变绿，会把回归伪装成通过。

**前置条件。** 所需支持：需要可重放的流式/交互夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 交换前录制旧输出夹具；任何夹具差异都视为用户可见变更，需单独评审。
2. 等价是每个流式/边界状态的性质，不只最终输出。
3. 把有意的行为变更与保持项分开记录；删除无生产者的表面而不是移植。
4. 保留原有控制流语义（如回调晚绑定）以免测试通过但交互改变。
5. 验收要求旧夹具全绿，不允许为重构重录。

**角色与责任。**
- 重构者负责先录制夹具。
- 评审区分行为变更与保持。
- 测试拥有旧输出基线。

**步骤。**
1. 在旧实现上录制覆盖流式/边界的夹具。
2. 执行结构重构，不改行为。
3. 逐步运行旧夹具；差异即停。
4. 把有意变更拆成独立变更并重新评审。
5. 删除无生产者代码并记录休眠字段。

**完成信号。** 旧夹具全绿，任何差异作为行为变更单独评审，未重录。

**强制与信任边界。** 模式：黄金夹具 + 评审。实现：旧输出快照、流式状态断言、行为变更单独提交、无生产者删除。 信任：夹具只覆盖已录场景；未录路径仍需评审。 失败处理：夹具差异阻断重构；重录被评审拒绝。 例外：纯内部且无外部可观察行为的重构可缩小夹具，但需说明等价论证。

**迁移实现。** 策略：先补夹具，再重构，最后删除旧路径。 实现：录制旧输出；提取子机器与显式依赖；保持晚绑定。 所需支持：需要可重放的流式/交互夹具。

**关联机制。** `rationale-architecture-1.real-artifact-qualification`、`rationale-architecture-1.versioned-artifact-contract`

**验证（全部为计划，未执行）。**
- 正向：旧夹具全绿；流式每个状态等价；共享依赖单实例
- 拒绝：夹具差异未评审即失败；重录基线被拒绝
- 恢复：发现交互差异可回退到旧实现；行为变更拆出后重新基线

**限制。** 无法证明所有未录路径等价；性能可能变化但不在夹具内。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-27-tui-chat-channel-module-split.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-08-06-web-markdown-incremental-ast-renderer.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-08-20-web-composer-lexical-editor.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-27-tui-chat-channel-module-split.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-06-web-markdown-incremental-ast-renderer.md:1-34@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-20-web-composer-lexical-editor.md:1-62@687f282e

<a id="rationale-architecture-1.versioned-artifact-contract"></a>
## rationale-architecture-1.versioned-artifact-contract — 构建期降级、产物版本契约与开发覆盖隔离

**来源权威。** 含当前权威（implemented=1, archived=2）。

**适用与触发。** 适用于 worker pack、代码生成、预览与开发插件。 触发条件：编译/降级产物（worker pack、生成模型）；预览/构建产物与运行时约定；开发专用挂载。

**问题。** 在加载期做兼容降级会把损坏镜像变成慢启动；发布包依赖未发布包或把开发覆盖混入发布清单，会让安装不可复现。

**前置条件。** 所需支持：需要可复现构建与打包测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 在产物构建期完成降级/编译，加载期不回退；版本化产物与运行时契约，不匹配在挂载前拒绝。
2. 生成模型/描述符必须在构建期提取为编译器无关的规范表示；不能无损表示的构造显式失败。
3. 开发专用能力通过每次启动的覆盖文件挂载，不进入发布 manifest；发布包不得依赖未发布包（包括禁用行）。
4. 预览从同一产物派生；不引入隐藏兼容路径。
5. 产物校验覆盖缺失/不支持/过期条目。

**角色与责任。**
- 构建流水线负责降级与版本戳。
- 运行时在挂载前校验版本。
- 开发者使用 per-launch overlay。

**步骤。**
1. 定义产物格式与运行时契约版本。
2. Host/Client 分开分析，提取不保留 AST/checker 的编译器无关模型；后续生成器/扫描器只消费该模型，不支持的无损构造或 emitter 能力明确失败。
3. 在构建期生成并戳版本。
4. 加载前校验版本，不匹配拒绝。
5. 把开发覆盖放在启动参数而非 manifest。
6. 依赖门禁拒绝未发布依赖。

**完成信号。** 产物在构建期完成降级并带版本，加载前校验，开发覆盖不进入发布清单。

**强制与信任边界。** 模式：构建期生成 + 加载前校验 + 依赖门禁。实现：版本戳、挂载前拒绝、overlay 文件、发布依赖检查。 信任：校验证明版本匹配，不证明产物正确；需构建测试。 失败处理：版本不匹配/缺失产物拒绝启动；开发覆盖缺失不影响发布。 例外：纯源码开发可不生成产物，但不能声称与发布产物等价。

**迁移实现。** 先把运行时降级移到构建期，提取编译器无关规范模型，再加版本戳与开发覆盖隔离；构建脚本生成 pack，加载器校验版本，per-launch overlay 注入。所需支持：可复现构建与打包测试。

**关联机制。** `rationale-architecture-1.migration-and-compatibility`、`rationale-architecture-1.change-transaction`、`rationale-architecture-1.package-hierarchy-and-layering`

**验证（全部为计划，未执行）。**
- 正向：构建产物在运行时直接挂载；版本匹配才启动；开发覆盖不出现在发布清单
- 拒绝：版本不匹配在挂载前拒绝；发布包依赖未发布包被门禁拒绝
- 恢复：重新构建产物即可恢复；覆盖移除后发布组合正常

**限制。** 产物版本不能证明行为正确；构建可复现性依赖工具链。

**来源（固定提交英文依据；不声称本次独立核对中文全文）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-08-20-webworker-pack-lowering-and-preview.md:1-45@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-08-27-inspector-development-mount.md:1-27@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-27-compiler-independent-typert-model.md:1-55@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-20-webworker-pack-lowering-and-preview.md:1-45@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-27-inspector-development-mount.md:1-27@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-27-compiler-independent-typert-model.md:1-55@687f282e

<a id="rationale-architecture-1.package-hierarchy-and-layering"></a>
## rationale-architecture-1.package-hierarchy-and-layering — 按角色分层、派生清单与单向依赖门禁

**来源权威。** 含当前权威（implemented=1, archived=5）。

**适用与触发。** 适用于 monorepo 包布局、客户端分层与插件包。 触发条件：新增包/移动包/重分组；客户端 Controller/UI/renderer 分层；跨包身份需要单实例。

**问题。** 按主题堆包、允许聚合 facade 或双向依赖，会让边界模糊、循环出现，且移动后路径引用悄悄失效。

**前置条件。** 所需支持：需要依赖图工具与包管理器 peer 配置。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 包角色编码在统一深度-2 布局中，尽可能派生清单；TypeScript aggregate project references 无 wildcard 形式，当前仍显式列举，生成另属未来工作。
2. 分层门禁检查依赖图；禁止聚合 facade 与兼容导出；每个事实只有一个所有者。
3. 双面包（runtime+UI）依赖定义协议包而非装配器，UI 参数用 type-only 入口，保持编译图无环。
4. 跨实例身份重要的包使用 peerDependency + 匹配 devDependency，且 profile 不安装 peer。
5. 移动用纯 git mv 保留历史；枚举移动影响与不影响的范围；陈旧路径引用由门禁失败。

**角色与责任。**
- 包所有者维护角色与入口。
- 依赖门禁执行图规则。
- 评审检查事实所有者。

**步骤。**
1. 确定包角色与深度-2 路径。
2. 从布局派生可派生的清单/入口；TypeScript aggregate 保留显式 references，声明其生成尚未完成。
3. 加依赖图与路径门禁。
4. 把双面包依赖指向协议包。
5. 用 git mv 移动并修复引用。

**完成信号。** 包角色与布局一致，依赖图无环，跨实例身份保持单实例。

**强制与信任边界。** 模式：图门禁 + 派生清单 + 路径检查；layout、依赖图 lint、peer 与旧路径扫描证明声明关系，不证明运行时单实例。循环/反向依赖/旧路径失败，重复事实需评审。TypeScript aggregate references 仍显式列举；预发布重分组的协调 churn 须在同一变更完成。

**迁移实现。** 策略：先定义角色与派生清单，再移动包，最后加门禁。 实现：统一目录层级；脚本生成清单；git mv；加图检查。 所需支持：需要依赖图工具与包管理器 peer 配置。

**关联机制。** `rationale-architecture-1.capability-seam-contract`、`rationale-architecture-1.startup-and-readiness`、`rationale-architecture-1.composition-scoped-capability`

**验证（全部为计划，未执行）。**
- 正向：清单与布局一致；双面包图无环；peer 不被装进 profile
- 拒绝：反向/循环依赖被门禁拒绝；聚合 facade 被评审拒绝
- 恢复：移动后路径门禁指出遗漏；单实例集成测试恢复

**限制。** 派生清单仍需布局约定；门禁不覆盖运行时动态加载。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-06-20-package-hierarchy.md:1-79@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-web-client-architecture.md:1-129@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-07-29-package-regrouping.md:1-82@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-07-workspace-files-dual-face-package.md:1-37@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-18-profile-plugin-host-runtime-instances.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-08-20-client-session-conversation-ownership.md:1-462@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-06-20-package-hierarchy.md:1-79@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-19-gui-web-client-architecture.md:1-129@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-29-package-regrouping.md:1-82@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-07-workspace-files-dual-face-package.md:1-37@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-18-profile-plugin-host-runtime-instances.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-20-client-session-conversation-ownership.md:1-462@687f282e

<a id="rationale-architecture-1.startup-and-readiness"></a>
## rationale-architecture-1.startup-and-readiness — 单次启动真实后端，显式就绪/失败恢复面

**来源权威。** 历史，非当前权威（archived=1）。

**适用与触发。** 适用于桌面应用、CLI 服务与任何有就绪面的启动。 触发条件：桌面/服务启动与就绪探测；启动前需要显示窗口；启动失败需要恢复。

**问题。** 为预测就绪而重复初始化插件，或显示假进度，会延长启动、产生双实例并掩盖真实失败。

**前置条件。** 所需支持：需要启动计数与平台夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 不要运行重复的分阶段健康检查来预测就绪；立即显示壳层拥有的进度面，真实后端只启动一次。
2. 窗口响应性与后端就绪分开声明；失败/恢复在同一窗口呈现。
3. 启动前不重复探测可由启动结果直接回答的事实。
4. 启动失败在同一窗口显示诊断与明确恢复；此启动 Note 不单独保证持久报告的字节/份数上限，致命报告由关联 fail-loud 机制拥有。

**角色与责任。**
- 壳层拥有窗口与进度。
- Host 只启动一次。
- 恢复面展示失败与操作。

**步骤。**
1. 立即显示壳层窗口。
2. 启动真实后端一次。
3. 把进度映射到实际阶段。
4. 失败时展示诊断与恢复操作。
5. 就绪后切换内容。

**完成信号。** 真实后端只初始化一次，窗口先可用，失败在同一窗口可见并可恢复。

**强制与信任边界。** 模式：启动测试 + 单实例断言。实现：启动计数、阶段事件、失败注入、窗口可用性测试。 信任：测试证明计数，不证明所有平台时序；需真机验收。 失败处理：重复初始化被计数测试拒绝；失败无恢复面时测试失败。 例外：无界面的 headless 启动可省略进度面，但仍只启动一次。

**迁移实现。** 策略：先删重复探测，再把真实启动一次化，最后接恢复面。 实现：合并启动路径；加阶段事件；窗口先显示。 所需支持：需要启动计数与平台夹具。

**关联机制。** `rationale-architecture-1.package-hierarchy-and-layering`、`rationale-architecture-1.change-transaction`、`rationale-architecture-1.fail-loud-and-diagnostics`

**验证（全部为计划，未执行）。**
- 正向：后端只初始化一次；窗口先可用；失败显示恢复
- 拒绝：重复健康检查被测试拒绝；假进度被评审拒绝
- 恢复：失败后从同一窗口重试；恢复后进入就绪

**限制。** 无法消除所有平台启动时序差异；仍需真机验收。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-immediate-window-and-direct-start.md:1-34@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-immediate-window-and-direct-start.md:1-34@687f282e

<a id="rationale-architecture-1.extension-surface-contract"></a>
## rationale-architecture-1.extension-surface-contract — 扩展面：声明式槽位、最小主体投影与单一注册即暴露

**来源权威。** 历史，非当前权威（archived=5）。

**适用与触发。** 适用于设置页、行菜单、详情页扩展、数据注入与任何插件扩展点。 触发条件：新增 UI 槽位/设置页/行菜单；第三方贡献需要扩展；注册命名空间或数据行注入。

**问题。** 所有者渲染封闭列表、把页面 store 传给贡献者，或维护第二份白名单，会让扩展耦合、越权并产生双重真相。

**前置条件。** 所需支持：需要可卸载插件的渲染测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 槽位按页面区域声明，贡献者依赖域契约而非彼此；声明者卸载时贡献级联移除。
2. 贡献者只收到最小主体投影（身份/必要字段），不收到页面 store 或特权能力包。
3. 条目自行决定可见性并可返回 null；所有者通过同一注册路径加入，不设特权组。
4. 注册即暴露：不维护第二份白名单；缺失即信号，渲染为两个实时账本的交集。
5. 数据行注入用纯数据行+确定性渲染器，每集合重新发出，订阅者读实时状态并随 fiber 清理。

**角色与责任。**
- 域所有者声明槽位与类型。
- 贡献者注册条目并自己决定可见性。
- 渲染器只组合交集。

**步骤。**
1. 按区域声明槽位与最小主体类型。
2. 贡献者通过 injection 注册。
3. 所有者用同一路径注册自身条目。
4. 渲染时取两个账本交集，无通用 fallback。
5. 卸载时级联移除贡献。

**完成信号。** 贡献者只依赖域契约与最小主体，声明者卸载时贡献级联消失。

**强制与信任边界。** 模式：类型 + 注册清理 + 交集渲染。实现：slot 泛型、最小 subject、同一注册路径、无 fallback、fiber 清理。 信任：类型限制主体，不证明贡献者不越权；需运行时 store 隔离检查。 失败处理：未注册即不渲染；声明者卸载后贡献消失；重复注册拒绝。 例外：纯展示、无交互的静态内容可直接由所有者渲染。

**迁移实现。** 策略：先声明槽位，再迁移贡献者，最后删除封闭列表。 实现：定义 slot 类型；收窄 subject；统一注册路径；移除白名单。 所需支持：需要可卸载插件的渲染测试。

**关联机制。** `rationale-architecture-1.registration-lifecycle`、`rationale-architecture-1.composition-scoped-capability`、`rationale-architecture-1.canonical-vocabulary`

**验证（全部为计划，未执行）。**
- 正向：贡献随声明者卸载消失；所有者条目走同一路径；条目可自行隐藏
- 拒绝：传入页面 store 的贡献被类型拒绝；第二白名单被评审拒绝
- 恢复：声明者重载后贡献重建；空交集不渲染占位

**限制。** 最小投影仍需设计判断；槽位类型演进会影响所有贡献者。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-08-11-plugin-settings-tabs.md:1-38@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-08-12-plugin-owned-settings-surface.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-08-19-web-index-injection-table.md:1-31@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-17-plugin-detail-page-extension-slots.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-17-session-row-menu-actions-slot.md:1-36@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-11-plugin-settings-tabs.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-12-plugin-owned-settings-surface.md:1-62@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-08-19-web-index-injection-table.md:1-31@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-17-plugin-detail-page-extension-slots.md:1-36@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-17-session-row-menu-actions-slot.md:1-36@687f282e

<a id="rationale-architecture-1.meaningful-invariants"></a>
## rationale-architecture-1.meaningful-invariants — 运行时不变式必须跨时间/可变状态，并提供伴随证据

**来源权威。** 历史，非当前权威（archived=1）。

**适用与触发。** 适用于缓存、订阅、并发、持久化与长期状态。 触发条件：包声明运行时不变式；订阅/缓存/并发状态需要长期关系；省略不变式。

**问题。** 把编译期或单元测试已保证的事实重复成"运行时不变式"，会制造噪音；而没有证据的断言无法发现真实漂移。

**前置条件。** 所需支持：需要能持续运行的测试/诊断。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 不变式必须描述跨时间或可变状态的关系（如订阅与缓存一致、序号单调），不能复述编译/加载/单元契约。
2. 只在这种关系存在时发布伴随证据（断言/测试）；否则允许省略，但需包特定理由。
3. 中心服务拥有注册与证据收集，包不各自维护第二套。
4. 不变式应可观察、可失败，并有失败时的诊断。

**角色与责任。**
- 包作者声明关系。
- 中心服务收集/执行证据。
- 评审拒绝同义反复。

**步骤。**
1. 识别跨时间关系。
2. 写成可观察断言并附加测试。
3. 在中心注册。
4. 失败时输出诊断。
5. 无关系时记录省略理由。

**完成信号。** 每条不变式描述跨时间关系并有可执行伴随证据，失败可诊断。

**强制与信任边界。** 模式：注册 + 断言/测试。实现：invariant registry、companion tests、失败诊断。 信任：断言证明已执行路径，不证明未执行路径；需持续运行。 失败处理：同义反复被评审拒绝；关系破裂使断言失败。 例外：纯函数包无运行时关系可省略，并记录理由。

**迁移实现。** 策略：先识别关系，再补断言，最后删除重复契约。 实现：注册不变式；加 companion 测试；删除编译期复述。 所需支持：需要能持续运行的测试/诊断。

**关联机制。** `rationale-architecture-1.ownership-and-disposal`、`rationale-architecture-1.real-artifact-qualification`

**验证（全部为计划，未执行）。**
- 正向：跨时间关系被断言；省略有理由
- 拒绝：复述编译契约的断言被拒绝
- 恢复：关系失败输出诊断并可定位

**限制。** 无法覆盖未观察到的状态；断言本身可能滞后于实现。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-07-19-package-invariant-runtime-contracts.md:1-79@687f282e8625c6b8d11ff58211a90524be2e4317（archived）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-07-19-package-invariant-runtime-contracts.md:1-79@687f282e

<a id="rationale-architecture-1.real-artifact-qualification"></a>
## rationale-architecture-1.real-artifact-qualification — 以真实实现、真实产物与明示证据范围验证

**来源权威。** 含当前权威（implemented=2, archived=2）。

**适用与触发。** 适用于 provider 契约、外部引擎、性能优化与平台能力。 触发条件：声称 provider 中立、可替换或性能提升；验证外部引擎/原生能力；录制回放与真实会话。

**问题。** mock 第二实现、单元基准或"理论更快"会被当成真实保证；单一适配器无法暴露词汇缺口。

**前置条件。** 所需支持：需要平台/凭据；缺失时必须记录。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 用两个基于不同内部结构的真实实现验证契约；mock 不算。
2. 性能声明必须区分工作模型、计时测量与功能证据；没有端到端测量就不声称端到端加速。
3. 必须列出仍未覆盖的成本与平台限制；实验性/录制证据不等于自动可接入任意应用。
4. 缺少后端/凭据/平台时明确记录不可验证步骤，而不是跳过并标绿。
5. 真实产物（打包应用、录制会话、真实 CLI）优先于合成夹具。

**角色与责任。**
- 实现者提供两个真实实现与可重放证据。
- 评审区分声明与证据范围。
- 测试记录未覆盖平台。

**步骤。**
1. 列出待证明的契约/性能声明。
2. 为每个声明选择真实实现与测量。
3. 记录工作模型、计时与功能证据的边界。
4. 列出未覆盖成本/平台。
5. 用真实产物做验收。

**完成信号。** 每个声明都有真实实现/真实产物证据，未测平台被明确记录而非标绿。

**强制与信任边界。** 模式：证据审查 + 多实现测试。实现：双实现契约套件、真实产物夹具、声明/证据边界表、平台缺口记录。 信任：证据只支持已测范围；未测路径仍未知。 失败处理：单一 mock 或未测平台被评审拒绝；把合成夹具当真实证据被拒绝。 例外：无法获取第二实现时明确记录为未验证，不冒充中立。

**迁移实现。** 策略：先建立双实现契约，再补真实产物，最后记录缺口。 实现：第二真实实现；真实会话/打包夹具；证据边界表。 所需支持：需要平台/凭据；缺失时必须记录。

**关联机制。** `rationale-architecture-1.executable-coverage-contract`、`rationale-architecture-1.capability-seam-contract`、`rationale-architecture-1.behavior-locked-refactor`

**验证（全部为计划，未执行）。**
- 正向：两个真实实现通过契约；真实产物上行为一致；声明范围与证据一致
- 拒绝：mock 被当作第二实现时评审失败；无测量的加速声明被拒绝
- 恢复：实现差异暴露词汇缺口并修正；平台缺口记录后不阻塞其他验证

**限制。** 真实实现仍可能共享同一误解；无法覆盖未获取的平台。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/archived/architecture/2026-09-11-node-office-kit.md:1-66@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/archived/architecture/2026-09-18-chat-navigation-performance.md:1-62@687f282e8625c6b8d11ff58211a90524be2e4317（archived）
- deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-twin-llm-adapters.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-scheduled-message-framing.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-11-node-office-kit.md:1-66@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-18-chat-navigation-performance.md:1-62@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-06-13-twin-llm-adapters.md:1-29@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-24-scheduled-message-framing.md:1-29@687f282e

<a id="rationale-architecture-1.executable-coverage-contract"></a>
## rationale-architecture-1.executable-coverage-contract — 把人工维护的覆盖属性变成可执行模型、门禁与探测

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于拖拽区、命中测试、覆盖层、路由可见性与任何布局/样式交叉属性。 触发条件：覆盖属性横跨布局/样式/运行时；人工清单需要与实现一致；视觉/交互属性难以单元断言。

**问题。** 靠两处手工描述保持一致（如拖拽面与布局、选择器与样式）会漂移；金标准快照会同时冻结缺陷。

**前置条件。** 所需支持：需要真实浏览器车道与原生人工验收。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 把合成规则发布为可执行模型，并让运行时/样式使用同一选择器源；样式表断言声明的正是该模型。
2. 只在一处声明表面；每个行用标记声明自身几何，门禁把标记与样式/高度/选择器配对并拒绝未点名标记。
3. 在真实浏览器/平台车道逐项探测，断言没有交互盒落入拖拽面，并包含"行可拖、正文不可拖"的正反例。
4. 保留人工状态矩阵用于无法无密钥自动化的原生半边，并明确每次改动必须跑。
5. 不把当前覆盖钉成一个 golden snapshot；manifest 分开表达不变量与只能缩小的缺口预算，避免把错误覆盖一同冻结。

**角色与责任。**
- 模型/样式所有者维护单一来源。
- 门禁检查标记清单。
- 浏览器车道与人工矩阵验证平台行为。

**步骤。**
1. 把合成规则写成可执行函数与选择器列表。
2. 让样式表引用同一列表并加断言。
3. 为每行加标记并在清单钉住几何。
4. 加真实浏览器探测与人工矩阵。
5. 改动时同时更新清单/矩阵。

**完成信号。** 模型、样式、标记、门禁与真实车道一致，人工矩阵覆盖不可自动化部分。

**强制与信任边界。** 模式：可执行模型 + 门禁 + e2e/人工矩阵。实现：合成函数、选择器唯一来源、样式断言、标记清单、e2e 探测、人工矩阵。 信任：e2e 证明无密钥可达平台；原生窗口服务器仍需人工。 失败处理：未标记行/标记内容容器/几何变化使门禁失败；交互盒落入拖拽面使 e2e 失败。 例外：无 GUI 的项目可将该模式用于路由/可见性覆盖，但需等价的可执行模型。

**迁移实现。** 策略：先建模型与单一来源，再加门禁，最后加真实车道。 实现：抽取合成函数；样式引用；标记清单；e2e。 所需支持：需要真实浏览器车道与原生人工验收。

**关联机制。** `rationale-architecture-1.real-artifact-qualification`、`rationale-architecture-1.meaningful-invariants`、`rationale-architecture-1.boundary-validation`

**验证（全部为计划，未执行）。**
- 正向：模型/样式/标记一致；e2e 无交互盒被吞；人工矩阵覆盖平台状态
- 拒绝：标记在内容容器或未在清单被拒绝；行高变化未更新清单时门禁失败
- 恢复：新行加标记+清单即可；车道发现缺口后模型修正

**限制。** 原生窗口服务器无法无密钥自动化；人工矩阵仍依赖执行纪律。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-window-drag-coverage-contract.md:1-64@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-19-window-drag-coverage-contract.md:1-64@687f282e

<a id="rationale-architecture-1.fail-loud-and-diagnostics"></a>
## rationale-architecture-1.fail-loud-and-diagnostics — 致命失败不恢复，诊断有界且先落盘

**来源权威。** 含当前权威（implemented=2）。

**适用与触发。** 适用于桌面/CLI 进程、插件加载、子进程输出与诊断。 触发条件：未捕获异常/未处理拒绝；子进程 spill/日志写入失败；桌面致命对话框。

**问题。** 捕获未捕获异常后继续运行，会让未知的残缺状态产生静默错误；只打印控制台或截断日志会让打包应用无法定位。

**前置条件。** 所需支持：需要故障注入与报告写入夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 未捕获异常与未处理拒绝共享一条致命路径：写带标签、含可枚举属性与 cause 链的诊断，等待有界 release，退出；绝不恢复失败操作。
2. 诊断用 util.inspect 而非 stack，保留 code/syscall/path/cause。
3. 崩溃报告在弹窗前写，包含来源、就绪状态、版本、完整错误与最近 console 尾部；有界、仅所有者可读、保留有限份数。
4. 关闭过程只写报告不弹窗；报告路径单独一行显示。
5. 可失败的辅助步骤（spill）尽力而为：失败丢弃、记录一次、继续主路径，不重建已知名称的敏感目录。

**角色与责任。**
- 启动器安装致命 handler。
- 桌面壳写报告并展示路径。
- 辅助步骤按尽力而为降级。

**步骤。**
1. 注册 uncaughtException 与 unhandledRejection 同一 handler。
2. 输出完整诊断并等待 release。
3. 尝试写有界崩溃报告，设硬上限。
4. 弹出对话框并显示路径。
5. 退出，不回到失败操作。

**完成信号。** 致命失败写完整有界诊断后退出；辅助步骤失败降级但不掩盖主结果。

**强制与信任边界。** 模式：进程级 handler + 报告测试。实现：共享退出闩锁、util.inspect、报告大小/保留策略、权限、spill 失败隔离。 信任：handler 覆盖同步抛出；异步/原生崩溃可能绕过。 失败处理：未捕获异常导致进程退出；spill 失败只记录；报告失败仍弹窗。 例外：可恢复的预期错误走普通错误路径，不触发致命 handler。

**迁移实现。** 策略：先统一致命 handler，再加崩溃报告，最后隔离辅助步骤。 实现：安装 handler；写报告；spill 失败回调；限制报告大小/份数。 所需支持：需要故障注入与报告写入夹具。

**关联机制。** `rationale-architecture-1.recovery-and-failure-domains`、`rationale-architecture-1.bounded-output-and-diagnostics`、`rationale-architecture-1.startup-and-readiness`

**验证（全部为计划，未执行）。**
- 正向：异常与拒绝走同一退出路径；报告含完整 cause 与 console 尾部；spill 失败不影响输出
- 拒绝：捕获后继续运行被评审拒绝；未标来源的报告被拒绝
- 恢复：报告写入超时仍弹窗；目录删除后 spill 降级不崩溃

**限制。** 原生崩溃/断电可能不经过 handler；报告本身可能失败。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-23-client-plugin-loading-model.md:1-123@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-fatal-diagnostics-and-crash-reports.md:1-61@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-23-client-plugin-loading-model.md:1-123@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-22-fatal-diagnostics-and-crash-reports.md:1-61@687f282e

<a id="rationale-architecture-1.bounded-output-and-diagnostics"></a>
## rationale-architecture-1.bounded-output-and-diagnostics — 有界输出：存储 seam、定位器与独立后处理策略

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于工具输出、诊断、日志与大型附件。 触发条件：工具输出、日志或诊断可能超限；需要保存完整输出供后续读取；流式/并发输出。

**问题。** 把无限工具输出/日志直接交给模型或调用方会耗尽上下文/内存；把检索工具硬编码进存储层又会耦合。

**前置条件。** 所需支持：需要大小边界与读取测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 模型可见输出有上限；超限时由薄存储 seam 保存文本并返回不透明定位器+后端提供的检索提示，消费方不硬编码检索工具名。
2. 存储拥有安全路径、权限、清理与并发；后处理策略独立于存储。
3. spill/日志失败尽力而为，不阻塞主结果；失败可观察一次。
4. 工具 spill 不等于致命诊断报告；具体 crash report cap 与保留规则由关联 fail-loud-and-diagnostics 机制拥有，不从 spill Note 推导。
5. 输出/报告的时序与截断标记要稳定，便于重建。

**角色与责任。**
- 工具层产生输出。
- 存储 seam 保存并返回定位器。
- 策略层决定何时溢出/保留。

**步骤。**
1. 定义输出上限与定位器类型。
2. 把保存实现为独立 seam。
3. 超限时写存储并返回定位器+提示。
4. 调用方按提示读取；不得假设工具名。
5. 清理/保留按策略执行。

**完成信号。** 超限输出可经定位器读回，存储失败时主结果仍返回，硬编码检索名不存在。

**强制与信任边界。** 模式：上限 + 类型 + 清理测试。实现：branded locator、输出大小检查、存储权限、保留策略、失败隔离。 信任：上限证明截断，不证明内容完整；需读取回放。 失败处理：超限未溢出被测试拒绝；存储失败仍返回原输出/截断结果。 例外：明确有界的结构化结果可直接返回。

**迁移实现。** 策略：先定义上限与定位器，再抽存储 seam，最后接策略。 实现：加 locator；实现存储；超限路径；清理。 所需支持：需要大小边界与读取测试。

**关联机制。** `rationale-architecture-1.capability-seam-contract`、`rationale-architecture-1.fail-loud-and-diagnostics`、`rationale-architecture-1.durable-projection-single-truth`

**验证（全部为计划，未执行）。**
- 正向：超限输出保存并可读回；定位器不暴露路径；失败时主结果仍返回
- 拒绝：硬编码检索工具名被评审拒绝；无限输出被测试拒绝
- 恢复：存储失败降级为截断；清理后定位器显式失效

**限制。** 截断可能丢失模型所需信息；存储可用性影响可读回性。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-08-tool-output-spill-files.md:1-172@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-08-tool-output-spill-files.md:1-172@687f282e

<a id="rationale-architecture-1.closed-intent-union"></a>
## rationale-architecture-1.closed-intent-union — 用封闭判别联合替代可选字段袋，穷尽桥接

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于渲染意图、执行结果、错误分类与协议消息。 触发条件：渲染/执行意图有多种形态；新增变体或桥接目标；需要编译期保证每个变体被处理。

**问题。** 可选字段组合让非法状态可表示，新增变体时桥接遗漏只在运行时暴露。

**前置条件。** 所需支持：需要类型测试/编译夹具。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 使用必需 tag 的封闭判别联合，不用可选字段袋。
2. 每个消费点用穷尽 switch；新增变体在补齐桥接前是编译错误。
3. 让非法状态不可表示；延迟的架构需求在联合外记录，不塞进可选字段。
4. 变体到目标模型的桥接集中，避免多处条件分支。

**角色与责任。**
- 定义者维护联合与 tag。
- 桥接者实现每个 arm。
- 编译器执行穷尽性。

**步骤。**
1. 列出所有合法形态与 tag。
2. 删除互斥可选字段。
3. 为每个消费点写穷尽 switch。
4. 新增变体先加 arm 再发布。

**完成信号。** 每个变体都有穷尽桥接，非法组合无法构造。

**强制与信任边界。** 模式：类型穷尽 + 评审。实现：判别联合、never 检查、集中桥接、非法组合无法构造。 信任：类型保证已编译分支；动态输入仍需边界校验。 失败处理：漏 arm 编译失败；非法组合无法构造。 例外：确实开放的扩展点用注册表而非联合，但需明确边界。

**迁移实现。** 策略：先把可选袋改为 tag 联合，再逐消费点穷尽。 实现：加 tag；删除可选字段；补 switch；集中桥接。 所需支持：需要类型测试/编译夹具。

**关联机制。** `rationale-architecture-1.boundary-validation`、`rationale-architecture-1.canonical-vocabulary`

**验证（全部为计划，未执行）。**
- 正向：每个变体都有桥接；非法组合不可构造
- 拒绝：漏 arm 编译失败；新增可选字段被评审拒绝
- 恢复：新增变体按编译错误逐个修复

**限制。** 联合封闭会阻碍外部扩展；开放场景需注册表方案。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-07-02-tool-render-intent-union.md:1-82@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-07-02-tool-render-intent-union.md:1-82@687f282e

<a id="rationale-architecture-1.deterministic-scheduling"></a>
## rationale-architecture-1.deterministic-scheduling — 确定性候选调度、区间缓存与按实际读取失效

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于文本识别、增量解析、依赖推导与任何多生产者候选调度。 触发条件：多个业务在同一原文/坐标上识别候选；Facts 变化需要复用无关工作；需要可解释的调度测试。

**问题。** 按文档顺序变换、手工依赖列表或时钟基准，会让最左匹配不确定、失效过度或测试依赖性能。

**前置条件。** 所需支持：需要确定性输入与调用记录测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 所有候选在同一原始坐标空间竞争；最早起点优先，order/稳定 ID 只裁定同起点。
2. 查询缓存有显式有效区间：候选 q<=c<=s、无候选 c>=q、不能证明 q 之前；失败只在同偏移可复用。
3. 先前输出是可复用结果，不是"无匹配"的证据；赢家消失后落败者可重新出现。
4. 依赖集合按当前缓存代次的实际读取（含 undefined/落败/无匹配/失败）取并集；字段级 Object.is 比较，外层对象换引用不失效。
5. 单一协调循环；只有完整成功才发布；禁止重入与逃逸读取上下文。
6. 测试断言有序调用与 from 偏移，不用时钟或性能阈值。

**角色与责任。**
- 业务提供纯候选匹配器与读取。
- 通用协调器选择赢家与维护缓存。
- 测试用 spy 钉住调度。

**步骤。**
1. 定义原始坐标与候选协议。
2. 实现带缓存的向前查询。
3. 按最左+order+ID 选择并推进游标。
4. 记录实际读取并按字段失效。
5. 用确定性调用断言验证。

**完成信号。** 最左候选确定，缓存/依赖失效只影响实际读取者，确定性调用断言通过。

**强制与信任边界。** 模式：算法不变量 + 确定性测试。实现：区间缓存、游标单调、实际读取集合、Object.is、发布原子性、调用计数测试。 信任：测试证明已覆盖场景，不证明任意正则线性；内部扫描成本仍存在。 失败处理：越界/重叠候选被拒绝；部分求值不发布；缓存失效不足会重复查询。 例外：单规则、无 Facts 的简单场景可退化为直接匹配，但需保持最左语义。

**迁移实现。** 策略：先统一坐标与候选协议，再引入缓存/依赖，最后替换按序变换。 实现：抽取 match(from)；加查询记录；记录 context.read；按字段失效。 所需支持：需要确定性输入与调用记录测试。

**关联机制。** `rationale-architecture-1.derived-state-single-source`、`rationale-architecture-1.whole-value-events`、`rationale-architecture-1.boundary-validation`

**验证（全部为计划，未执行）。**
- 正向：最早起点优先；缓存命中不重复调用；只失效实际读取者；等价刷新复用引用
- 拒绝：游标倒退/越界候选被拒绝；未搜索区间被当作无匹配时测试失败
- 恢复：赢家消失后落败者重新竞争；失败查询依赖变化后重试

**限制。** 字段级失效仍可能重扫；查询历史内存随搜索位置增长。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-10-user-text-json-nodes.md:1-91@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-10-user-text-json-nodes.md:1-91@687f282e

<a id="rationale-architecture-1.structural-taxonomy"></a>
## rationale-architecture-1.structural-taxonomy — 结构位置词表取代业务 kind 名单

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于聊天分组、折叠、列表分段与任何结构/业务分离。 触发条件：通用机制需要按业务类型分组/折叠；同一 kind 在不同上下文位置不同；外部定义需要放置自己的行。

**问题。** 在通用分组/折叠机制里点名业务类型，会把业务语义埋进结构层，新增 kind 需要改核心，且无法表达同 kind 的不同位置。

**前置条件。** 所需支持：需要真实会话时序夹具（含空窗）。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 用有序结构位置词表（如 outermost→inner）声明节点位置；位于某位置即具有所有内层效果。
2. 由一个谓词读取顺序；分组/折叠层不点名任何业务 kind。
3. 业务定义自行选择位置；结构层只描述结构，不声明业务角色。
4. 分段增量计数，起点移动只返回进入/离开的项。
5. 标记"开启"放在真正的开启者（如人类认领输入）而非唤醒通知，避免空窗期误折叠。

**角色与责任。**
- 结构层拥有位置词表与谓词。
- 业务定义声明位置。
- 分段器增量计算。

**步骤。**
1. 定义位置顺序与谓词。
2. 把 kind 名单改为节点位置声明。
3. 让分组/折叠只读谓词。
4. 标记开启者，未标记者续接。
5. 增量维护分段与增量返回。

**完成信号。** 结构层不点名业务 kind，位置变化触发正确分组，空窗不误折叠。

**强制与信任边界。** 模式：类型 + 属性测试 + 评审。实现：有序位置类型、单一谓词、无 kind 分支、分段增量测试、开启/空窗 e2e。 信任：类型保证位置合法，不保证业务选对位置；需行为测试。 失败处理：kind 分支被评审拒绝；空窗误折叠由 e2e 捕获。 例外：通用层自身拥有的少数行可保留明确放置规则，但需最小化并说明。

**迁移实现。** 策略：先定义位置，再迁移内置 kind，最后删除分支。 实现：加 groupTree 字段；单一谓词；分段增量；开启标记。 所需支持：需要真实会话时序夹具（含空窗）。

**关联机制。** `rationale-architecture-1.canonical-vocabulary`、`rationale-architecture-1.derived-state-single-source`、`rationale-architecture-1.explicit-units-and-routes`

**验证（全部为计划，未执行）。**
- 正向：同 kind 可在不同位置；分段增量只返回变化；空窗不折叠
- 拒绝：结构层按 kind 分支被评审拒绝；业务角色写入结构层被拒绝
- 恢复：位置变化触发重新分组；窗口无开启项时全部属于最新段

**限制。** 位置词表本身需要演进；错误位置仍是业务设计问题。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-11-chat-group-tree-exchanges.md:1-56@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-11-chat-group-tree-exchanges.md:1-56@687f282e

<a id="rationale-architecture-1.explicit-units-and-routes"></a>
## rationale-architecture-1.explicit-units-and-routes — 显式单位模式、最小干扰路径与单一投影函数

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于 GUI 自动化、截图坐标、图像缩放与多适配器投影。 触发条件：模型提供坐标或操作路径；截图/缩放/Retina 与原生点不同；多种适配器共享图像投影。

**问题。** 从数值猜坐标单位、每次操作都移动用户指针，或在每个适配器重复几何换算，会造成误操作与重复规则。

**前置条件。** 所需支持：需要 Retina/缩放夹具与指针采样。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 坐标单位显式选择（截图像素/相对千分比），不按数值猜；Host 负责换算原生点。
2. 优先最小干扰路径（如同窗口辅助功能揭示），不可用才回退系统指针；记录路径与是否移动指针。
3. 效果不确定的动作失败要传播，不声称成功。
4. 观察按窗口作用域，刷新一个窗口保留其他映射；尺寸变化失效、移动保留局部坐标。
5. 发布映射前校验原始元数据与解码尺寸；返回字节与模型请求图像一致，原图只存一次。
6. 一个投影函数由适配器复用，不重复提供方几何公式。

**角色与责任。**
- 工具层声明单位模式。
- Host 做坐标换算与映射校验。
- 适配器复用投影函数。

**步骤。**
1. 定义单位模式与端点校验。
2. 选择最小干扰路径并记录。
3. 观察窗口映射并按 resize 失效。
4. 校验元数据后发布映射。
5. 复用同一投影函数。

**完成信号。** 单位/路径显式且可验证，映射在元数据校验后发布，投影只实现一次。

**强制与信任边界。** 模式：类型/校验 + 平台测试。实现：显式模式、端点范围、路径记录、映射校验、单投影函数、指针采样。 信任：测试证明已测平台/分辨率；后台路径不保证任意应用可达。 失败处理：非法单位/端点被拒绝；元数据不符不发布映射；动作失败传播。 例外：无可用后台路径时必须回退系统指针并记录。

**迁移实现。** 策略：先显式化单位，再引入最小干扰路径，最后统一投影。 实现：加 relative 模式；host 映射；窗口观察；单函数。 所需支持：需要 Retina/缩放夹具与指针采样。

**关联机制。** `rationale-architecture-1.boundary-validation`、`rationale-architecture-1.canonical-vocabulary`、`rationale-architecture-1.real-artifact-qualification`

**验证（全部为计划，未执行）。**
- 正向：两种单位模式行为正确；移动窗口保留坐标；返回字节等于请求图像
- 拒绝：按数值猜单位被拒绝；尺寸不符仍发布映射被拒绝
- 恢复：后台路径不可用回退系统指针；resize 后重新截图映射

**限制。** 后台路径只覆盖支持辅助功能的应用；平台差异仍需真机。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-cua-hover-routes-and-coordinates.md:1-29@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-10-13-cua-hover-routes-and-coordinates.md:1-29@687f282e

<a id="rationale-architecture-1.fail-safe-irreversible-actions"></a>
## rationale-architecture-1.fail-safe-irreversible-actions — 不可逆动作先收集中断事实，失败按"有工作"处理

**来源权威。** 含当前权威（implemented=1）。

**适用与触发。** 适用于桌面退出、破坏性删除、覆盖安装与任何不可逆操作。 触发条件：退出应用、删除数据、覆盖安装；需要确认运行中任务/定时提醒；查询超时或失败。

**问题。** 退出/删除/覆盖等不可逆动作在未确认运行中工作时执行，会无声中断任务；查询失败时默认放行会扩大损害。

**前置条件。** 所需支持：需要平台对话框与 IPC 超时测试。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 区分窗口关闭与进程生命周期；关闭只隐藏并保留页面/Host。
2. 所有普通退出入口先向 Host 查询会中断的事实（运行中任务按既定重启口径、已挂定时提醒）；都没有才直接退出。
3. 有中断事实时显示原生、无父窗口的确认；默认按钮为退出，Esc 为取消；重复请求合并，弹框期间文案冻结，批准后不再查询。
4. Host 未就绪视为无任务；查询失败或超时按"有工作"处理，因为多提示一次优于无声中断。
5. 更新重启、致命恢复、开发重启、OS 会话结束跳过确认。

**角色与责任。**
- 壳层拥有退出流程。
- Host 提供事实查询。
- 用户做最终确认。

**步骤。**
1. 关闭改为隐藏。
2. 退出前查询两类事实。
3. 无事实直接退出；有事实弹确认。
4. 失败/超时按有工作处理。
5. 批准后执行，不再二次查询。

**完成信号。** 不可逆动作在有中断事实时确认，查询失败按有工作处理，受控重启跳过。

**强制与信任边界。** 模式：IPC 查询 + 原生确认 + 跳过表。实现：两事实查询、关联 id/超时、合并请求、原生对话框、入口跳过表。 信任：查询证明 Host 报告的事实，不证明外部进程；超时保守处理。 失败处理：查询失败按有工作；未就绪直接退出；确认取消保留窗口。 例外：安装更新/致命恢复等已知受控重启可跳过。

**迁移实现。** 策略：先关闭改为隐藏，再加事实查询，最后接原生确认。 实现：两事实 IPC；原生 dialog；入口跳过表；超时上限。 所需支持：需要平台对话框与 IPC 超时测试。

**关联机制。** `rationale-architecture-1.security-boundary`、`rationale-architecture-1.recovery-and-failure-domains`、`rationale-architecture-1.change-transaction`

**验证（全部为计划，未执行）。**
- 正向：四种查询结果对应正确路径；失败/超时按有工作；跳过入口不弹框
- 拒绝：查询失败直接退出被拒绝；确认期间重复请求产生多个弹框被拒绝
- 恢复：取消后窗口仍可用；批准后任务被停止并退出

**限制。** Host 不知道的外部进程无法计入；Windows 托盘行为需人工验收。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/implemented/architecture/2026-09-23-desktop-close-to-background-and-quit-confirmation.md:1-35@687f282e8625c6b8d11ff58211a90524be2e4317（implemented）

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-23-desktop-close-to-background-and-quit-confirmation.md:1-35@687f282e

<a id="rationale-architecture-1.settled-vs-future"></a>
## rationale-architecture-1.settled-vs-future — 已定案设计、未来实现与不做清单分离

**来源权威。** 提案，非当前权威（proposed=1）。

**适用与触发。** 适用于提案、分阶段迁移、实验能力与架构决策记录。 触发条件：提案包含分阶段交付；设计已定但实现未开始；存在明确不做项与触发条件。

**问题。** 把未实现的设计写成现状，或把未来工作藏在散文里，会让采纳者误以为已有保证，并在条件变化时重复设计。

**前置条件。** 所需支持：需要能核对代码/发布状态的评审流程。 所需角色见下；若触发事实不存在，记录未激活理由而不是删除义务。

**义务。**
1. 每个阶段标注已交付/未来工作，验收线只覆盖本期；不得把未来阶段写成当前能力。
2. 已定案但未实现的设计保留完整施工规范，说明语义不变、只改代码。
3. 不做清单记录：不做什么、触发条件、返工点、现有预埋；触发条件出现前不实现。
4. 风险显式记录（新先例、规模前提、弱依赖、预留形状），并给缓解与再评估触发。
5. 当前权威与历史提案分开；提案不覆盖现有实现。

**角色与责任。**
- 作者标注阶段与验收线。
- 评审检查未实现项没有被写成保证。
- 采纳者按触发条件决定何时实现。

**步骤。**
1. 列出本期交付与明确不做项。
2. 为每个不做项写触发/返工/预埋。
3. 把已定案未实现部分写成独立施工规范。
4. 验收标准只检查本期。
5. 记录风险与再评估条件。

**完成信号。** 验收只覆盖已交付阶段，每个未来/不做项都有触发条件与返工点。

**强制与信任边界。** 模式：文档结构 + 验收范围。实现：阶段表、未来工作节、不做清单、风险节、验收线限定。 信任：结构不能证明实现状态；需代码/发布事实核对。 失败处理：未来能力被写成本期保证时评审拒绝；不做项无触发条件视为遗漏。 例外：纯探索记录可以没有实现计划，但必须标明不是承诺。

**迁移实现。** 策略：把现有混合文档拆为当前事实、已定案未来、不做清单。 实现：加阶段标记；验收只列本期；未来项写触发与返工点。 所需支持：需要能核对代码/发布状态的评审流程。

**关联机制。** `rationale-architecture-1.migration-and-compatibility`、`rationale-architecture-1.change-transaction`、`rationale-architecture-1.distribution-and-target-binding`

**验证（全部为计划，未执行）。**
- 正向：验收标准只覆盖本期；每个不做项有触发与返工点；风险有缓解
- 拒绝：未来阶段被列为当前保证时评审失败；已定案设计缺少施工规范
- 恢复：触发条件出现后按预埋启动；范围变化时更新清单

**限制。** 文档标记不等于实现被验证；仍需独立验收。

**来源（英文正文实际阅读范围；中文逐篇完整阅读）。**
- deepseek-harness/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md:1-329@687f282e8625c6b8d11ff58211a90524be2e4317（proposed）


来源：deepseek-harness/.agents/notes/proposed/architecture/2026-07-24-domain-kv-storage-and-workspace.md:1-329@687f282e