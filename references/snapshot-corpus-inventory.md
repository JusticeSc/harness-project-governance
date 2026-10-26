# snapshot-corpus-inventory

> 源仓：`deepseek-harness`，固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，只读。
> 本文件只覆盖分区内的 **250 份 `snapshot.yml`**（ACP 9、SDK 27、headless/session 150、Web 64）与 **3 个 `.snapshot.ts` 适配器**（ACP/SDK/headless；Web 适配器在 `apps/web/tests/`，不在本分区）。规范义务的 canonical 记录在 `testing` 与 `rationale-testing-1` 域；本域负责说明这 253 份文件如何把“场景清单”变成可执行的语料角色，以及哪些字节只是 fixture。
> 引用格式：`deepseek-harness/<path>:<start>-<end>@687f282e`。只标注实际读过的行；三个适配器为选读，覆盖范围逐条列在 `research/snapshot-corpus-inventory-coverage.json`。

## Scope

**适用对象.** 采用项目已经拥有 recorded-session replay，并把“场景声明、回放输入、期望输出、workspace 种子、补丁、辅助脚本”放在同一棵目录树里时，本域给出角色分界与入口纪律。典型树形是 `<corpus>/<profile>/<scenario>/snapshot.yml`；ACP/SDK/headless 各由一个 `.snapshot.ts` 适配器收集，Web 的适配器在 `apps/web/tests/`，不在本分区。

**不适用范围.**
- 没有模型/会话回放的普通 golden 测试；此时应使用 owner-local expected output，而不是伪造 `snapshot.yml`。
- 只有单个场景、没有 composition/pin 所有权冲突的测试。
- `snapshots/AGENTS.md` 与 `scripts/session-snapshot-corpus.corpus.ts` 不在本分区路径内；已对 `snapshots/AGENTS.md:1-17` 做 `:raw` 复读核对入口与 session 角色规则，但 coverage 仍只登记 253 个分配路径，不重复声明它们。

**读者入口.**
- 要判断“这个文件是输入还是 oracle” → 读 `manifest-role-taxonomy`。
- 要新增/修改适配器，或场景没有被执行 → 读 `adapter-entry-and-profile-selection`。
- 要新增 fixture server、workspace setup 或生成型种子 → 读 `fixture-helper-admission`。

**事实基数（本分区实测）.** 250 份 manifest 全部是 `version: 1`，`scenario` 与目录名一致；`profile` 分布为 `acp` 9、`sdk` 26、`sdk-minimal` 1、`headless` 150、`web` 64。清单中使用到的角色声明包括：`recording: live|authored`、`header.class`、`header.pin`、`header.changes`/`promptChanges`、`systemPromptSource`/`toolSchemasSource`、`childSystemPrompts`/`childToolSchemas`、`replay.override`、`workspace.final`/`setup`/`parent`、`session.source`、`sessionFormat`、`input.attachments`/`task`、`platform`、`permission`、`environment`。这些字段的语义由 `testing` 域的 M17/M18/M19/M20/M23/M24/M26/M38 定义；本域只记录它们在 250 个实例中的组合方式。

## Mechanisms

<a id="m-snapshot-corpus-inventory.manifest-role-taxonomy"></a>
### snapshot-corpus-inventory.manifest-role-taxonomy — 场景清单是输入、期望与夹具角色的权威声明 {#snapshot-corpus-inventory.manifest-role-taxonomy}

**问题.** 一个场景目录同时存放 replay 输入、期望持久化输出、header sidecar、workspace 种子、补丁与辅助字节。没有作者声明时，适配器和评审无法区分哪些字节是权威输入、哪些是 oracle、哪些只是惰性 fixture；fixture 里的 `AGENTS.md`、系统提示或 expected 散文还可能被误当成项目指令，record/refresh 也可能覆盖错误产物。

**触发.** 新增或修改快照场景；判断某个文件是输入、期望还是纯 fixture；评审 `snapshot.yml` diff；接入新 profile 或新场景作者。

**源义务.**
1. 每个场景目录恰好一份 `snapshot.yml`：`version: 1`、`scenario` 等于目录名、`profile` 与父目录匹配、`composition` 命名补丁族、`recording` 为 `live|authored`、`header.class` 必填；未知字段由 exact-key 解析拒绝。
2. 角色由清单而不是文件名决定：
   - `session*.jsonl` 同时是 replay 输入与期望持久化输出；
   - `writer*.expected.jsonl` 是独立 native-writer oracle；
   - `workspace/` 是运行前种子；`workspace.expected/` 只在 `workspace.final: true` 时作为完整最终树 oracle；
   - `input.attachments` 是内容寻址输入；`input.task` 只在没有可接受 session 提供任务时使用；
   - `replay.override: true` 声明行为补丁侧车；
   - `session.source` 表示借用者，目录不拥有 canonical session；
   - `sessionFormat` 保留历史代际与闭合 `coverage` 名。
3. `recording: authored` 表示手工声明，record 必须跳过；`live` 表示来自真实 provider 录制。`sessionFormat` owner 在 record/refresh 中不可被改写，期望改用独立 writer oracle。
4. fixture 字节不承载政策：workspace 内 `AGENTS.md`、JSONL 系统提示、expected 散文、prompt/schema sidecar 与 helper 文件都是数据，不得作为项目指令编辑或晋升为仓库规则。
5. 新增角色必须先扩展 schema 与适配器；不得复用现有字段或从文件名推断角色。

**步骤.**
1. 列出场景要证明的行为与对应证据产物。
2. 声明 `profile`/`composition`/`recording`/`header`。
3. 按需声明 pin 来源、`workspace.final/setup/parent`、`session.source`、`sessionFormat`、`replay.override` 与 `input`。
4. 把字节放入对应角色目录，避免同一事实保留两份。
5. 运行 manifest/fixture 守卫并逐个审查 oracle diff。

**角色与完成信号.**
- 场景作者：判断行为与证据产物，填写清单并放置字节。
- 适配器 owner：把新声明映射到真实执行入口。
- 评审者：检查角色边界、oracle 变化与借用关系。
- 完成信号：每份 manifest 通过 schema；每个 oracle 有明确 owner；fixture 文本没有进入指令加载；借用者没有本地 canonical session。

**失败处理.**
- 未知字段或角色歧义：修正 manifest；不要放宽解析器。
- 错误产物被断言：先判断是行为回归还是角色放错；角色放错移动文件并更新声明。
- fixture 文本被当指令：立即停止评审，把文本移回 fixture 角色；不要靠修改指令加载器“兼容”。

**例外.**
- `web/schedule-catalog` 的 catalog-only pin 没有 request/header 或 `system/message`，但保留历史 prompt/schema sidecar 供 UI inventory 检查。
- Web 可以跨 profile 借用 canonical session；借用者目录不拥有本地 canonical session，借用目标的 selected generation 由源场景决定。
- retained 场景的 `writer.expected.jsonl` 与 replay generation 分离，不能互相替代。

**证据边界.** 清单角色是声明，不证明场景语义覆盖或 fixture 内容质量；借用 session 依赖源场景的 selected generation，源场景迁移会改变借用者输入；本分区 coverage 不包含 `snapshots/AGENTS.md` 与 corpus gate；已对 `snapshots/AGENTS.md:1-17` 全文做 `:raw` 复读核对入口、session 角色/借用与 sessionFormat 语义，规则仍由 `testing` 域拥有，不能据此扩展 schema 之外的规则。

**迁移设计.** 先把字节角色表写成清单 schema，再让适配器只消费声明，最后加角色与唯一性守卫。最小落地顺序：角色分类 → closed manifest schema → 适配器读取 → sidecar/借用/workspace/retained 守卫 → oracle diff 评审。

**验证（计划）.** 逐份解析 250 个 manifest 并注入未知字段；删除 `image-compaction` 的附件或把 `session.source` 指向不存在的 owner；恢复后重跑并检查只恢复预期角色。

<a id="m-snapshot-corpus-inventory-roles"></a>
- **证据（附件输入）.** `deepseek-harness/snapshots/acp/image-compaction/snapshot.yml:1-16@687f282e` 同时声明 pin 来源与 `input.attachments`（`sha256:` id、`image/png`、base64 data），说明附件是清单声明的输入而不是 session 内容。
<a id="m-snapshot-corpus-inventory-roles-2"></a>
- **证据（最小手工场景）.** `deepseek-harness/snapshots/acp/handshake/snapshot.yml:1-7@687f282e` 只有 version/scenario/profile/composition/recording/header，证明 authored 场景可以没有 session、pin、workspace 与 input。
<a id="m-snapshot-corpus-inventory-roles-3"></a>
- **证据（跨 profile 借用）.** `deepseek-harness/snapshots/web/bash-abort-row/snapshot.yml:1-9@687f282e` 用 `session.source: ../../acp/cancel-tool-calls/session.v4.jsonl` 声明借用，目录本身不拥有 canonical session。
<a id="m-snapshot-corpus-inventory-roles-4"></a>
- **证据（多角色叠加）.** `deepseek-harness/snapshots/session/agent-instructions/snapshot.yml:1-14@687f282e` 同时使用 authored、pin、`replay.override`、`platform: posix` 与 `workspace.setup: delimiter-path`，展示一份清单可以声明多个正交角色。
<a id="m-snapshot-corpus-inventory-roles-5"></a>
- **证据（retained 代际）.** `deepseek-harness/snapshots/session/text-turn/snapshot.yml:1-10@687f282e` 用 `sessionFormat: {version: 1, coverage: [adjacent-migration]}` 保留历史代际。
<a id="m-snapshot-corpus-inventory-roles-9"></a>
- **证据（V0 覆盖名）.** `deepseek-harness/snapshots/session/subagent-multi/snapshot.yml:1-10@687f282e` 声明 v0 的 `multi-hop`/`shipped-profile`；`deepseek-harness/snapshots/session/packed-chunks/snapshot.yml:1-10@687f282e` 声明 v0 的 `packed-row`。
<a id="m-snapshot-corpus-inventory-roles-6"></a>
- **证据（catalog-only pin）.** `deepseek-harness/snapshots/web/schedule-catalog/snapshot.yml:1-10@687f282e` 的注释明确说该 v3 fixture 没有 request/header 或 system/message，但历史 prompt/schema sidecar 仍需 pin；这是“断言对象不是完整 header 序列”的例外。
<a id="m-snapshot-corpus-inventory-roles-7"></a>
- **证据（retired-tools 与 setup 叠加）.** `deepseek-harness/snapshots/session/office-render-tools/snapshot.yml:1-12@687f282e` 用 v4 + `retired-tools` 保留已移除工具的录制，同时用 `workspace.setup: office-skills` 生成运行种子。
<a id="m-snapshot-corpus-inventory-roles-8"></a>
- **证据（借用 + 最终树）.** `deepseek-harness/snapshots/web/default-workspace/snapshot.yml:1-11@687f282e` 同时声明 `workspace.final: true` 与 `session.source: ../fresh-round-trip/session.v4.jsonl`，说明最终树 oracle 与回放输入是两件事。

<a id="m-snapshot-corpus-inventory.adapter-entry-and-profile-selection"></a>
### snapshot-corpus-inventory.adapter-entry-and-profile-selection — ACP/SDK/headless 三个适配器是各自 profile 场景的唯一执行入口 {#snapshot-corpus-inventory.adapter-entry-and-profile-selection}

**问题.** 清单只声明意图，只有适配器把声明接进真实进程或浏览器。适配器若静默漏掉一份 manifest，或有人新增隐藏驱动绕过 suite，场景会在账面上存在却从未执行；composition/pin 所有权与 profile 选择也会变得不可判定。

**触发.** 新增某个 profile 的场景；新增或修改 `.snapshot.ts`；发现场景存在但未出现在 suite 中；改变 composition 或 header pin 所有权；切换 replay/record/refresh 模式。

**源义务.**
1. **ACP**：适配器持有闭合、有序的 9 场景 controller 表；`handshake` 与 `reject-extra-dirs` 明确无模型轮次；每个 manifest 必须有 `recording` 与 `header`；`replay.override`、`pin`、`changes`、sidecar 来源、`platform`、`permission`/`environment` 被映射进 suite 选项；ACP 本地 pin 来源只接受裸场景名。
2. **SDK**：适配器扫描 `session/` 与 `sdk/` 目录，按 `profile sdk|sdk-minimal` 过滤，要求 `composition`/`recording`/`header`；每个 composition 恰好一个 `cordis.yml` owner，每个 composition/header class 恰好一个 pin；sidecar 来源可为裸名或 corpus 相对路径；每个场景通过真实 CLI 的 stdio JSON-RPC 驱动一轮。
3. **Headless**：只自动收集 `profile: headless` 且带 `composition` 的 manifest，缺 `recording`/`header` 直接抛错；每个 composition 恰好一个 `cordis.yml` owner，每个 composition/class 恰好一个 pin；补丁层序为 base `cordis.yml` + 模式补丁（replay 用 `cordis.snapshot.yml`，record 用 `cordis.yml`）+ `model.cordis.yml` + 可选 `runtime.cordis.yml`。
4. `.snapshot.ts` 是可执行适配器而非 fixture；不得新增第二入口、隐藏 CLI 模式或可执行场景驱动，也不得手写与发布 composition 平行的孪生配置。
5. 适配器必须在未知 `DSH_SNAPSHOT` mode 上抛错；record 对 `authored` 与 `sessionFormat` 场景跳过，replay 默认 keyless。

**步骤.**
1. 新增 manifest 并确认 `profile`/`composition`/`header` 完整。
2. 为 composition 提供唯一 `cordis.yml` owner，为 class 注册唯一 pin。
3. 如新增 profile 或表项，扩展对应适配器并保持表闭合。
4. 按模式运行 replay/record/refresh，确认场景计数与所有权断言。
5. 检查未消费 replay 脚本、缺失 owner/pin 与隐藏入口。

**角色与完成信号.**
- 适配器 owner：维护 controller 表、收集逻辑与补丁层序。
- 场景作者：提供 manifest、composition owner 与 pin。
- 评审者：检查场景是否真的被执行以及补丁是否最小。
- 完成信号：场景数等于清单数；每个 composition/class 有唯一 owner/pin；未知模式与缺失 owner 都会失败；record 没有误跑 authored/retained。

**失败处理.**
- 缺 composition owner 或 pin：在收集期抛错，补齐 owner/pin，不要改为“默认继承”。
- 场景未被执行：检查 profile 过滤、`composition` 缺失或适配器表遗漏；补表并加计数断言。
- 未知模式：修调用方，不要在适配器里 fallback 到 replay。
- record 误跑 authored/retained：检查跳过条件，恢复场景字节并重跑。

**例外.**
- catalog-only pin 可以没有 header 块。
- `tool-call-turn` 在 replay 额外运行 retained V3 输入，用于 native writer parity。
- SDK 的 `dsh` 子进程使用单独 child config 与 `.child-dsh` home。
- ACP 只接受本地裸场景名作为 pin 来源；跨 profile 来源由 SDK/Headless 的相对路径解析承担。

**证据边界.** 适配器证明收集、接线与模式分派，不证明场景语义正确；SDK/Headless 适配器只选读关键段，场景专用断言未逐行审计；corpus gate 的 8 适配器名册不在本分区路径内。

**迁移设计.** 每个后端 profile（ACP/SDK/headless）一个薄适配器：枚举 manifest → 建立 composition/pin 所有权 → 按模式选择补丁 → 驱动真实入口。不要把场景清单复制到 adapter 的硬编码数组里；ACP 的 controller 表应显式列出“无模型轮次”的场景，其余后端 profile 用目录发现。

**验证（计划）.** 运行 snapshot lane 并核对 ACP 9、SDK 27、headless 150 个场景均被收集；删除 owner 或增加第二个 pin 观察收集期失败；恢复后重跑并检查无未消费 replay 脚本。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:109-192@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:274-496@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:664-787@687f282e`、`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:954-1179@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:164-479@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:644-898@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1014-1199@687f282e`


<a id="m-snapshot-corpus-inventory-adapters"></a>
- **证据（ACP 闭合表）.** `deepseek-harness/snapshots/acp/acp.snapshot.ts:26-42@687f282e` 列出 9 个 controller case，其中 `handshake` 与 `reject-extra-dirs` 的 `hasModelTurn` 为 false；`image-compaction` 额外指定 `configPath`。
<a id="m-snapshot-corpus-inventory-adapters-2"></a>
- **证据（ACP 映射）.** `deepseek-harness/snapshots/acp/acp.snapshot.ts:50-76@687f282e` 把 manifest 的 recording/header/pin/changes/sidecar/platform/permission/environment 映射为 suite 选项，并对带斜杠的 pin 来源返回 undefined（本地表只接受裸名）。
<a id="m-snapshot-corpus-inventory-adapters-3"></a>
- **证据（SDK 收集）.** `deepseek-harness/snapshots/sdk/sdk.snapshot.ts:204-226@687f282e` 只遍历 `session/` 与 `sdk/`，解析 `snapshot.yml`，要求 `composition`/`recording`/`header`，否则跳过或抛错。
<a id="m-snapshot-corpus-inventory-adapters-4"></a>
- **证据（SDK 所有权）.** `deepseek-harness/snapshots/sdk/sdk.snapshot.ts:228-264@687f282e` 按 profile 过滤，建立 `compositionOwners` 与 `headerPins`，重复 owner/pin 立即抛错，并对裸名/相对路径 sidecar 来源做二次解析。
<a id="m-snapshot-corpus-inventory-adapters-5"></a>
- **证据（SDK 补丁层序与跳过）.** `deepseek-harness/snapshots/sdk/sdk.snapshot.ts:551-565@687f282e` 区分 `sdk-*` composition 与默认 transport-neutral 的补丁层序；`deepseek-harness/snapshots/sdk/sdk.snapshot.ts:925-931@687f282e` 在 record 时跳过 authored 与 retained 场景。
<a id="m-snapshot-corpus-inventory-adapters-6"></a>
- **证据（Headless 收集与所有权）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:563-617@687f282e` 只收集 `profile: headless`，缺 recording/header 抛错，并建立 composition owner 与 header pin 的唯一映射；`deepseek-harness/snapshots/session/headless.snapshot.ts:955-960@687f282e` 断言每个 composition/class 恰好一个 current-writer pin。
<a id="m-snapshot-corpus-inventory-adapters-7"></a>
- **证据（Headless 跳过条件）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:1229-1240@687f282e` 在 posix/win32、缺 pwsh、record+authored、record+sessionFormat 时显式跳过，而不是静默返回。
<a id="m-snapshot-corpus-inventory-adapters-8"></a>
- **证据（Headless 补丁层序）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:1257-1290@687f282e` 组装 base `cordis.yml` + 模式补丁 + `model.cordis.yml` + 可选 `runtime.cordis.yml`，并按 profile 与 workspace.parent 选择运行参数。

<a id="m-snapshot-corpus-inventory.fixture-helper-admission"></a>
### snapshot-corpus-inventory.fixture-helper-admission — Fixture 辅助文件与 workspace setup 的准入规则 {#snapshot-corpus-inventory.fixture-helper-admission}

**问题.** 场景内的 `.mjs` HTTP server、生成的 workspace 与命名 setup 常被当作“只是 fixture”随手添加；固定监听端口会让并行 lane 撞端口，非确定的 seed 会让 replay 抖动，未注册的 setup 会在运行期才失败，helper 文本还可能被误当项目指令。

**触发.** 新增 fixture server 或辅助脚本；新增 `workspace.setup`；场景在端口、临时目录或文件时间上不稳定；评审 fixture 字节或 workspace 种子。

**源义务.**
1. `snapshots/` 下所有 `.mjs` 必须绑定 OS 分配端口：`listen(0)`、`listen({ port: 0, ... })` 或 `listen({ path })`；固定数字端口、动态 `port` 变量，以及 path 与非零数字 `port` 混用都失败。Headless 适配器对全部 fixture `.mjs` 做 AST 扫描并让 lane 变红。
2. `workspace.setup` 是适配器内闭合的字符串映射；未知 setup 在运行前抛错。当前集合覆盖 office skills、retired PTC wrapper、git worktree、delimiter path、固定搜索 mtime、Windows ACL skill 与 editing-cordis skill。
3. setup 种子必须确定且自包含：固定 mtime、局部 git config、复制技能资产、不依赖 ambient repo/网络；凭据或宿主秘密只用场景声明的哨兵值。
4. fixture helper 与 workspace 文件都是数据；其文本不得作为项目指令。`workspace/` 原样复制，`workspace.final` 仍是 oracle；helper 产生的运行期目录要么进入 capture 的忽略表，要么单独断言。

**步骤.**
1. 新增 helper 并让它绑定 `0` 或 Unix socket path。
2. 如需要生成 workspace，加入闭合 setup 映射并保持幂等。
3. 固定 mtime、git config 与输入资产，去除 ambient 依赖。
4. 声明 `workspace.final`/`parent` 并在 capture 中显式忽略运行期目录。
5. 运行端口扫描、setup 解析与 replay，审查最终树 diff。

**角色与完成信号.**
- fixture 作者：维护 server、种子与 setup。
- 适配器 owner：维护端口扫描、setup 映射与 workspace capture。
- 评审者：检查确定性与 fixture/指令边界。
- 完成信号：端口扫描零违规；所有 setup 可解析；最终树没有未解释的额外文件；helper 文本没有进入指令加载。

**失败处理.**
- 固定端口：改为 `listen(0)` 或 `{ port: 0, ... }`；不要用环境变量掩盖端口冲突。
- 未知 setup：注册到闭合映射或改用 `workspace/` 静态种子；不要静默 fallback。
- 最终树多出文件：先判断是运行期目录还是真实副作用；运行期目录加入 ignore，真实副作用更新 oracle 并审查。
- 凭据哨兵泄漏：只用假值并指向本地 fixture；不要提交真实 key。

**例外.**
- Unix socket path fixture 使用 `listen({ path })` 合法。
- `git-worktree` setup 保留 `.git`，并在最终树中单独过滤临时指针。
- `office-retired-ptc` wrapper 有意调用复制的 Node，以保留 removed-tool 错误而不带进程相关栈位置。

**证据边界.** AST 扫描只覆盖 `listen` 调用形态，不证明其它资源（临时目录、文件描述符、定时器）已清理；setup 的确定性由代码结构保证，未逐一执行全部 setup；本地 Windows 检出可能把 symlink 物化为普通文件，端口扫描与 workspace 捕获行为需在目标平台验证。

**迁移设计.** 把 fixture 资源当作受管输入：端口由 OS 分配、setup 闭合注册、seed 确定、运行期目录显式忽略。最小落地顺序：`.mjs` 端口扫描 → setup 映射 → 固定 mtime/git config → workspace capture ignore 表 → 负向测试。

**验证（计划）.** 对全部 fixture `.mjs` 运行端口扫描并注入 `listen(43118)`；把 `workspace.setup` 改为未注册名；恢复后重跑并检查最终树。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/snapshots/session/headless.snapshot.ts:817-835@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:146-158@687f282e`、`deepseek-harness/apps/web/tests/scaffold.ts:1728-1788@687f282e`


<a id="m-snapshot-corpus-inventory-fixtures"></a>
- **证据（端口扫描实现）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:137-163@687f282e` 用 TypeScript AST 识别 `listen` 调用，接受数值 0、`{ port: 0, ... }` 与 `{ path }`，对固定/动态/混合端口生成带行号的违规。
<a id="m-snapshot-corpus-inventory-fixtures-2"></a>
- **证据（setup 闭合映射）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:498-560@687f282e` 定义 `workspaceSetups`，覆盖 Windows ACL、office skills、office-retired-ptc、git-worktree、editing-cordis-skill、delimiter-path 与 fixed-search-mtimes；`seedWorkspace` 对未注册名直接抛错。
<a id="m-snapshot-corpus-inventory-fixtures-3"></a>
- **证据（扫描负向测试）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:962-995@687f282e` 先验证接受形态，再对 `listen(43118)`、动态 `port` 与 `path+port` 断言违规，并扫描 `snapshots/**/*.mjs` 全量。
<a id="m-snapshot-corpus-inventory-fixtures-4"></a>
- **证据（setup 实例）.** `deepseek-harness/snapshots/session/agent-instructions/snapshot.yml:12-13@687f282e` 声明 `workspace.setup: delimiter-path`；`deepseek-harness/snapshots/session/worktree/snapshot.yml:10-12@687f282e` 声明 `git-worktree` 且 `final: true`；`deepseek-harness/snapshots/session/office-progressive-ptc/snapshot.yml:10-11@687f282e` 声明 `office-retired-ptc`。
<a id="m-snapshot-corpus-inventory-fixtures-5"></a>
- **证据（确定性种子）.** `deepseek-harness/snapshots/session/fs-glob-sampling/snapshot.yml:9-11@687f282e` 用 `fixed-search-mtimes` 固定文件时间；`deepseek-harness/snapshots/session/headless.snapshot.ts:541-560@687f282e` 的 `fixed-search-mtimes` 实现用 `utimes` 写入 2000-01-01 的递增秒数，避免 ambient mtime 进入 golden。
<a id="m-snapshot-corpus-inventory-fixtures-6"></a>
- **证据（宿主秘密哨兵）.** `deepseek-harness/snapshots/session/ptc-python-read-only/snapshot.yml:10-11@687f282e` 只声明 `DSH_PYTHON_PTC_HOST_SECRET: host-only-sentinel`，证明宿主秘密以场景哨兵而非真实值进入 fixture。
<a id="m-snapshot-corpus-inventory-fixtures-7"></a>
- **证据（最终树捕获）.** `deepseek-harness/snapshots/session/headless.snapshot.ts:1448-1451@687f282e` 在 `workspace.final: true` 时用 `captureExpectedWorkspaceSnapshot` 比较完整最终树；否则要求最终树等于初始树，从而暴露 helper 遗留的运行期文件。

## References

**源事实（本分区实际读取）.**
- 250 份 `snapshot.yml`：ACP 9、SDK 27、headless/session 150、Web 64；每份都完整读取 1 至文件末行。
- 253 份声明范围内的读取行非 ASCII 计数为 0，且所有行 UTF-8 字节长度 <768；因此 reader 的 CJK 显示宽度截断不适用于这些文件，无需额外 raw 复读。
- `snapshots/acp/acp.snapshot.ts` 全文 1-92。
- `snapshots/sdk/sdk.snapshot.ts` 选读 1-108、193-273、497-663、788-953、1180-1241；未读 109-192、274-496、664-787、954-1179 的场景专用断言。
- `snapshots/session/headless.snapshot.ts` 选读 1-163、480-643、899-1013、1200-1456；未读 164-479、644-898、1014-1199 的场景专用断言。
- `snapshots/AGENTS.md:1-17` 全文另做 `:raw` 复读，消除 932/822 字符行的显示截断；该文件不在本分区 coverage，规则归 `testing` 域。

**跨域权威.**
- `knowledge/testing.json`：`testing-snapshot-manifest-and-guards`（M17 闭合 schema/守卫）、`testing-snapshot-selection-and-generations`（M18 命名/代际）、`testing-snapshot-corpus-policy`（M19 retained coverage）、`testing-snapshot-modes`（M20 replay/record/refresh）、`testing-snapshot-header-pins`（M23）、`testing-snapshot-workspace-oracle`（M24）、`testing-snapshot-network-fixtures`（M25 loopback HTTP 生命周期/fetch 映射）、`testing-llm-replay-scripts`（M26）、`testing-platform-skips-and-conditional-exemptions`（M38）。
- `knowledge/rationale-testing-1.json`：`rationale-testing-1.single-source-composition`（组合叠加派生）。
- `knowledge/agent-workflows.json`：fixture 内 `AGENTS.md` 是数据而非项目指令；本域不重新定义指令层级。

**未纳入本分区.**
- `snapshots/AGENTS.md`、`scripts/session-snapshot-corpus.corpus.ts`、`packages/test-support/session-snapshot/**`。这些文件的规范义务由 `testing` 域的既有 coverage 记录拥有；本文件只在需要解释 manifest 实例时引用其机制 id。分区描述提到的 corpus README 在固定树中不存在（`snapshots/` 下只有 `AGENTS.md` 这一份 corpus 级说明）。

**证据限制.** 本域是场景清单与适配器入口的清点，不是对 250 个场景语义覆盖的证明；没有运行任何 snapshot lane、fixture 守卫或浏览器测试。所有 verification 条目标记为 `planned`。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `snapshot-corpus-inventory.adapter-entry-and-profile-selection`：`deepseek-harness/snapshots/acp/acp.snapshot.ts:82-92@687f282e`
