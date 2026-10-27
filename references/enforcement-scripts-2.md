# enforcement-scripts-2

## Scope

本域覆盖 `deepseek-harness` 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317` 的 `scripts/` 残余分区 2：61 个构建、生成、校验、发布、打包、快照与测试辅助文件。目标不是复述目录，而是把脚本里已经存在的维护者义务变成可迁移的操作规则：何时触发、谁负责、必须满足什么、失败长什么样、证据在哪一行。

阅读范围以本域coverage逐路径记录为准，不宣称除baseline外均全文读完。baseline只读1-40、2121-2127；coverage-partitions.spec.ts只声明1-43、315-465、498-578，coverage-partitions.ts只声明1-300、590-650，未补读区间不回填。既往快照长行raw复读也不把其他脚本变成全文语义阅读。本分区是代码、配置、脚本与录制资料；这些范围说明不认证其语义完整、程序执行或中文契约覆盖。

本域新增 9 条机制；其余文件都已由既有域拥有对应规则，覆盖记录中用 `reviewedNoMechanism: true` 说明“读过、实现/测试了既有规则、但没有新规则”。脚本自身的命令接线与 CI 触发属于集成事实，规则文本仍以机制义务为准。

## Mechanisms

<a id="m-enforcement-scripts-2.locale-dictionary-key-parity"></a>
### enforcement-scripts-2.locale-dictionary-key-parity — 已发布语言字典的 zh/en 键集必须对称 {#enforcement-scripts-2.locale-dictionary-key-parity}

**何时适用。** 新增或修改任何带 `locales.ts`、`locales/` 目录或插件内联 `register()` 字典的包；新增语言；把一份字典拆成 `zh.ts` / `en.ts`；修改 fallback locale 或字典解析顺序。

**问题。** 语言运行时先按 active locale 查键，再查唯一的 fallback locale（通常是 `en`），最后把 key 本身显示出来。若一份字典只在 `zh` 或 `en` 增加 key，另一语言的读者会看到裸 key（例如 `list.aria`），而不是文本。这类缺口通常直到 UI 才暴露，代码评审也很难逐键比对。

**义务。**

1. 每个随产品发布的字典必须同时声明 `zh` 与 `en`，且键集相同。同文件内配对优先；否则必须在同一目录找到兄弟文件。
2. 发现阶段覆盖 `packages/<group>/<pkg>/src` 下 `.ts`（排除 `.d.ts`），不得只扫 `packages/client`；`.tsx`、其他目录布局与不在两层结构中的包不会被发现。`locales.ts`、`locales/` 目录和插件体内联声明都要被发现。
3. 缺失对侧文件是错误而不是跳过；同一 pair 被两个文件声明也是错误，不能静默取其一。
4. `register(ns, tag, dict)` 只在 `tag` 是字符串字面量 `'zh'`/`'en'` 时解析；字典参数必须是可静态解析的对象字面量/模块常量，解析失败要报错。`tag` 不是字符串字面量的调用被跳过，不报错。
5. 扫描用绝对下限守卫发现范围：文件数 >500、已配对字典数 >25；没有与上次运行比较，也没有斜率/缩水检测，小幅减少不会触发。
6. 失败时补齐缺失键，而不是删除另一侧或把缺口留给 fallback。

**责任人与完成信号。** 客户端/插件作者补键；UI 文案维护者确认语义；评审者检查是否只改了一侧；CI 运行该 spec。完成信号是 `problems` 为空且两个数量下限仍成立。

**失败处理。** 测试失败并阻断单元/覆盖率门禁。先看输出中的缺失键、缺失对侧文件或重复声明，再决定补键、合并字典或新增对侧文件；不要用删除另一侧键来换绿。

**证据。**

<a id="m-enforcement-scripts-2-locale-rationale"></a>
- `deepseek-harness/scripts/locale-dictionary-parity.spec.ts:2-20@687f282e` — 说明 fallback locale 的解析顺序、裸 key 的后果，以及“发现范围被静默缩小比没有门禁更糟”。

<a id="m-enforcement-scripts-2-locale-readentries"></a>
- `deepseek-harness/scripts/locale-dictionary-parity.spec.ts:55-64@687f282e` — `readEntries` 只把 `ENOENT` 当“目录不存在”，其他 I/O 错误重新抛出，避免扫描面变窄。

<a id="m-enforcement-scripts-2-locale-parsefail"></a>
- `deepseek-harness/scripts/locale-dictionary-parity.spec.ts:137-140@687f282e` — `register(ns, tag, ...)` 的字典无法解析时直接抛错。

<a id="m-enforcement-scripts-2-locale-discovery-guards"></a>
- `deepseek-harness/scripts/locale-dictionary-parity.spec.ts:247-248@687f282e` — 断言扫描到的文件数 >500。

<a id="m-enforcement-scripts-2-locale-pairing"></a>
- `deepseek-harness/scripts/locale-dictionary-parity.spec.ts:263-266@687f282e` — 同一 pair 被两个文件声明时抛出。

<a id="m-enforcement-scripts-2-locale-assertions"></a>
- `deepseek-harness/scripts/locale-dictionary-parity.spec.ts:287-305@687f282e` — 汇总缺失对侧、zh-only、en-only，并断言已配对字典数 >25。

**边界。** 不检查值是否为空、翻译是否正确或占位符是否一致；只发现 `packages/<group>/<pkg>/src` 下的 `.ts`，`.tsx` 与其他布局不在范围内；不覆盖仓库外第三方插件；非字面量 locale tag 被跳过；静态发现可能漏掉运行时拼装的字典，届时应扩展发现规则而不是放宽断言。

<a id="m-enforcement-scripts-2.coverage-location-equivalence"></a>
### enforcement-scripts-2.coverage-location-equivalence — 跨编译面的覆盖率位置必须先归一化再合并 {#enforcement-scripts-2.coverage-location-equivalence}

**何时适用。** 一个源文件被多个 Vitest project/编译面同时覆盖；启用覆盖率 blob 合并；修改 partition reporter；升级 istanbul-lib-coverage、Vitest 或合并实现。

**问题。** 同一源码语句在 ssr 与 client/jsdom 两个 Vite 环境里可能得到不同的列：一个停在标识符，另一个停在嵌套调用；行尾列可能是 `Infinity`（JSON 序列化后变成 `null`）。istanbul 合并时失去区间包含关系，留下一个永不命中的“幻影”语句，使每文件 100% 门禁假失败，或反过来掩盖真实缺口。

**义务。**

1. 每个分区在写 blob 之前，对 `CoverageMap.data` 的 `statementMap`、`fnMap` 的 `decl`/`loc`、`branchMap` 的 `loc` 以及每个 `locations` 做行尾列归一化。
2. 归一化任何非 `number` 或非 finite 的 `end.column`（不只是字面量 `Infinity`），统一改为有限的 `END_OF_LINE_COLUMN = Number.MAX_SAFE_INTEGER`；其他列、行号与命中计数保持原样。
3. 每个分区命令都显式带 `--reporter=./scripts/coverage-canonical-locations.ts`；实现注释记录 Vitest 的 reporter ordering 会在 blob 序列化前调用 `onCoverage`，但本仓 spec 只断言命令接线，顺序未由协调器构造或测试证明。不能依赖默认 reporter 顺序。
4. 收到不含 istanbul `data` 的 payload 必须抛错，不能静默跳过，否则所有位置都未归一化。
5. 归一化后仍由统一的 merge 执行每文件 100% 阈值；归一化不能替代阈值检查。
6. 不得为通过门禁而删除语句、改写源码或放宽 per-file 阈值。

**责任人与完成信号。** 覆盖率门禁维护者实现并接线 reporter；CI 维护者确认每个分区命令都带上它；评审者确认没有放宽阈值。完成信号是两种拼写合并后只剩一个已命中身份，且所有位置类型都被归一化。

**失败处理。** 如果幻影语句仍在，先检查 reporter 是否在 blob 写出前运行；如果门禁变绿但 reporter 未接线，把缺参当作缺陷修复，而不是接受“碰巧通过”。

**证据。**

<a id="m-enforcement-scripts-2-coverage-canonicalizer"></a>
- `deepseek-harness/scripts/coverage-canonical-locations.ts:1-94@687f282e` — 导出 `canonicalizeEndOfLineColumns` 与 `END_OF_LINE_COLUMN`，把任何非 number/非 finite 的 `end.column` 写成 `MAX_SAFE_INTEGER`，并在缺少 istanbul `data` 时抛错。

<a id="m-enforcement-scripts-2-coverage-reporter-wiring"></a>
- `deepseek-harness/scripts/coverage-partitions.ts:20-35,590-650@687f282e` — 每个 partition 命令携带 canonicalizing reporter，随后运行一个 merge 命令；顺序由 Vitest reporter ordering 决定，不是协调器构造。

<a id="m-enforcement-scripts-2-coverage-merge"></a>
- `deepseek-harness/scripts/coverage-partitions.spec.ts:360-375@687f282e` — 说明 JSON 序列化把非有限行尾列变成 `null`，从而剥离 istanbul 的区间包含关系。

<a id="m-enforcement-scripts-2-coverage-phantom"></a>
- `deepseek-harness/scripts/coverage-partitions.spec.ts:407-419@687f282e` — 复现“33 条语句、32 条命中”的幻影语句，并证明归一化后未命中集合为空。

<a id="m-enforcement-scripts-2-coverage-kinds"></a>
- `deepseek-harness/scripts/coverage-partitions.spec.ts:421-448@687f282e` — 同时覆盖 statement、function 的 `decl`/`loc`、branch 的 `loc`/`locations`，并断言有限列不被改写。

<a id="m-enforcement-scripts-2-coverage-failclosed"></a>
- `deepseek-harness/scripts/coverage-partitions.spec.ts:450-460@687f282e` — `undefined` 与 `{}` 都必须抛 `not an istanbul CoverageMap`。

<a id="m-enforcement-scripts-2-coverage-reporter"></a>
- `deepseek-harness/scripts/coverage-partitions.spec.ts:500-526@687f282e` — 断言每个分区命令都带有根相对路径的 canonicalizing reporter，并说明执行顺序依赖 Vitest。

**边界。** 依赖 istanbul-lib-coverage 的合并语义；不同版本的列/区间处理可能变化。归一化处理所有非有限 `end.column`，不处理其他位置漂移；reporter 相对 blob 的实际执行顺序未由本仓证明；合并 fixture 是 synthetic。

<a id="m-enforcement-scripts-2.bilingual-link-locale"></a>
### enforcement-scripts-2.bilingual-link-locale — 双语对内的相对链接必须指向同语言兄弟 {#enforcement-scripts-2.bilingual-link-locale}

**何时适用。** 新增或修改 `.md` / `.zh.md` 中的仓库内相对链接；拆分、合并或移动双语对；运行双语配对门禁、合并驱动或链接归一化。

**问题。** 中文页若从英文页复制链接，读者会被带到英文页；而严格按字节比较的双语配对门禁/合并驱动又会把两侧不同的链接目标判成结构漂移。链接需要在“读者语言正确”和“结构可比较”之间同时成立。

**义务。**

1. 只处理仓库内相对路径，且目标必须存在；外部 URL、协议相对、根绝对路径、空路径与纯 `#` 跳过。
2. 目标属于活动双语语料时：`.zh.md` 页面链接 `.zh.md`，`.md` 页面链接 `.md`；pair 成员由调用方的 `isTranslationPairSource` 谓词决定，非配对目标保持原样。
3. 语言切换器只在精确形态下豁免：H1 后、下一个 heading 前的首个整段匹配段落，文本须为 `English | [中文](...)` 或 `[English](...) | 中文`，段落内恰好一个链接且目标被接受。
4. 保留query/fragment后缀；直接`.md`/`.zh.md`替换保留其余路径字节，fallback允许`relativeExpectedPath`重建并逐段RFC3986编码。`reference%2Emd`可规范化为`reference.zh.md`，不能笼统承诺百分号编码不变；只替换destination，不重排整篇Markdown。
5. 不存在、不可解析或非活动 pair 的目标保持原样；但活动语料中缺 sibling 的目标仍报告违规（期望 sibling）。引用式定义只在被引用时检查，重复定义只用第一个。
6. 合并驱动把两侧 destination 归一化为 `dsh-translation-target:<source><suffix>` 语义 token，使同语言链接差异不被误判为结构漂移。

**责任人与完成信号。** 文档本地化维护者修链接；合并驱动维护者确认 token 归一化；评审者确认没有重排无关字节。完成信号是链接目标语言正确、目标存在、pair 结构比较不再因语言差异产生假冲突。

**失败处理。** 链接越界时按输出定位具体 destination，只改该区间；若合并驱动报告结构漂移，先确认是否绕过了语义 token 归一化，再决定改链接还是改归一化。

**证据。**

<a id="m-enforcement-scripts-2-link-contract"></a>
- `deepseek-harness/scripts/translation-links.ts:1-10@687f282e` — 模块契约：locale-aware 解析与 byte-preserving 重写。

<a id="m-enforcement-scripts-2-link-switcher"></a>
- `deepseek-harness/scripts/translation-links.ts:65-88@687f282e` — 只把 H1 后唯一、目标匹配的规范切换器识别为豁免；遇到后续 heading 停止。

<a id="m-enforcement-scripts-2-link-resolution"></a>
- `deepseek-harness/scripts/translation-links.ts:176-200@687f282e` — 跳过外部/绝对/空目标，解析仓库目标与 pair，按源页面后缀计算期望路径与 URL，并保留 suffix。

<a id="m-enforcement-scripts-2-link-expected"></a>
- `deepseek-harness/scripts/translation-links.ts:163-174@687f282e` — `.md` → `.zh.md`、`.zh.md` → `.md` 的期望语言映射。

<a id="m-enforcement-scripts-2-link-rewrite"></a>
- `deepseek-harness/scripts/translation-links.ts:297-308@687f282e` — 只对语言不正确的已解析链接生成替换，应用字节级替换。

<a id="m-enforcement-scripts-2-link-normalize"></a>
- `deepseek-harness/scripts/translation-links.ts:338-353@687f282e` — 合并归一化使用 `dsh-translation-target:<source>` 语义 token，并报告每个被替换 destination 的区间。

**边界。** 不检查锚点是否存在、不检查目标语言页面是否真的有对应章节；不处理 HTML 内联链接或非 Markdown 链接语法。切换器形态是 source-product 特定的；pair 发现依赖调用方谓词，活动语料中缺 sibling 仍会报违规。

<a id="m-enforcement-scripts-2.pinned-v3-vocabulary"></a>
### enforcement-scripts-2.pinned-v3-vocabulary — 历史迁移词汇必须绑定不可变提交并核对写入器版本 {#enforcement-scripts-2.pinned-v3-vocabulary}

**何时适用。** 修改 `RELEASED_V3_EVENT_TYPES`；升级 V4 写入器或迁移包；准备历史迁移发布、复核 V3 词汇。

**问题。** V3→V4 迁移必须知道“V3 写入器到底写过哪些事件”。若从当前工作树、分支或远端读取，V4 新增的事件会被误当成 V3，迁移就会接受它无法转换的输入；而一次不可复现的读取又会让检查结果随环境漂移。

**义务。**

1. `--source-ref` 只接受 40 或 64 位小写十六进制完整 commit；分支、tag、缩写都拒绝。
2. 源对象必须在本地已存在；使用 `GIT_NO_LAZY_FETCH=1` 禁止隐式拉取，缺失时提示先准备验证过的 source pin。
3. 对象必须是 commit，不能是 tree；从该提交读取 writer 的 `SESSION_FORMAT_VERSION`，必须是数字字面量 3，否则拒绝。
4. `KNOWN_SESSION_EVENT_TYPES` 必须恰好有一个初始化导出（允许括号或 `as const` 包裹），值是 `new Set([...])` 且全部元素为字符串字面量；重复名、动态表达式、非数组实参与 `new Set()`/`new Set(undefined)`/`Map` 都拒绝。`new Set([])` 结构上被接受，随后才对非空期望集报 missing/extra。
5. 源词汇与迁移侧 `RELEASED_V3_EVENT_TYPES` 双向比较，分别报告 missing 与 extra；V4-only 事件不得进入 V3 集合。
6. 测试 fixture 必须剥离 `GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE` 等环境、禁用 hooks/gpg，避免宿主 Git 配置改变结果。

**责任人与完成信号。** 迁移包维护者固定 commit 并审查差异；发布工程师准备本地对象；CI 运行 verifier。完成信号是命令输出事件数并声明“未检查远端新鲜度”，且 missing/extra 都为空。

**失败处理。** 报告可变 ref、缺失对象或 tree 对象时，修正 source pin；报告 writer 不是 V3 时，换用正确的历史提交；报告 missing/extra 时先审查源 payload 转换，再更新迁移集合。

**证据。**

<a id="m-enforcement-scripts-2-v3-pin-format"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.ts:12@687f282e` — 只接受 40/64 位小写十六进制完整 commit 的正则。

<a id="m-enforcement-scripts-2-v3-local-object"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.ts:14-22@687f282e` — `git show` 读取固定路径，`GIT_NO_LAZY_FETCH=1`，缺失时给出可操作错误。

<a id="m-enforcement-scripts-2-v3-writer-version"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.ts:67-95@687f282e` — 校验 commit 类型、writer 必须为 V3、事件集合双向比较与错误文本。

<a id="m-enforcement-scripts-2-v3-fixture-env"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.spec.ts:20-27@687f282e` — fixture 的 git 调用剥离 Git 位置环境变量，并禁用 gpg 与 hooks。

<a id="m-enforcement-scripts-2-v3-fixture"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.spec.ts:29-38@687f282e` — 在临时仓库写入 writer/事件模块并创建 commit。

<a id="m-enforcement-scripts-2-v3-rejections"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.spec.ts:97-113@687f282e` — 拒绝可变/缩写 ref、本地缺失对象、tree 对象与缺失生成文件。

<a id="m-enforcement-scripts-2-v3-declarations"></a>
- `deepseek-harness/scripts/verify-v3-event-vocabulary.spec.ts:123-145@687f282e` — 拒绝非字面量/歧义 writer 声明，以及非 Set、动态、重复与未被识别的集合声明；识别名下的 `new Set([])` 会在双向比较时报 missing/extra，而不是解析错误。

**边界。** 不检查远端是否存在更新提交；不验证事件 payload 的字段级转换；依赖 Git 与 TypeScript。测试只用 synthetic V3 commit，不覆盖真实 release pin；`new Set([])` 不是解析错误，只会在双向比较时报 missing/extra。

<a id="m-enforcement-scripts-2.workflow-guest-single-module"></a>
### enforcement-scripts-2.workflow-guest-single-module — Workflow guest 必须打成只依赖 Node 内建的单模块 {#enforcement-scripts-2.workflow-guest-single-module}

**何时适用。** 修改 `workflow-ptc/src/guest.ts` 或其依赖；升级打包器、`tsconfig` 或 Node 版本；提交生成的 guest-source 文件。

**问题。** workflow guest 被序列化为源码字符串，送进挂载的 PTC runtime 执行。若它仍 import workspace 文件，或被打成多个 chunk，运行时没有对应模块可解析；这类错误会推迟到用户会话才暴露。

**义务。**

1. 以仓库 `tsconfig.base.json` 打包固定 guest 入口，`platform` 为 `node`。
2. `external` 只能是 Node 内建模块；出现 `UNRESOLVED_IMPORT` 立即失败，不能降级为警告。
3. 输出必须恰好一个 ESM 模块，禁用 code splitting 与 sourcemap。
4. 模块的静态 `imports` 与 `dynamicImports` 过滤内建后必须为空；不得引入 workspace 或第三方文件。
5. 在代码末尾追加 `sourceURL`，便于运行时定位。
6. 生成文件必须带 “Generated ... Do not edit directly” 横幅，并以 JSON 字符串化源码。
7. `--check` 只验证不写文件；生成物与当前源码不一致时失败并提示重新生成。
8. 自包含测试必须在删除源文件后导入 `bundleWorkflowGuest` 返回的字符串（data URL），不得声称执行了生成的 guest-source.ts 模块。

**责任人与完成信号。** workflow/PTC 运行时维护者维护入口与依赖边界；构建脚本维护者维护打包约束；CI 用 `--check` 检查提交副本。完成信号是单 chunk、无外部 import、`--check` 通过。

**失败处理。** 出现多 chunk 或外部 import 时，改为内联纯函数或使用 Node 内建；出现 stale 时重新运行生成命令，不要手改生成物。

**证据。**

<a id="m-enforcement-scripts-2-guest-bundle"></a>
- `deepseek-harness/scripts/gen-workflow-guest.ts:17-44@687f282e` — 固定入口与 tsconfig、仅内建 external、把 `UNRESOLVED_IMPORT` 转为错误、断言单 chunk 与无外部 import、追加 `sourceURL`。

<a id="m-enforcement-scripts-2-guest-headers"></a>
- `deepseek-harness/scripts/gen-workflow-guest.ts:51-67@687f282e` — 生成横幅与 JSON 字符串化模块，并用 `--check` 比较后拒绝 stale。

<a id="m-enforcement-scripts-2-guest-spec"></a>
- `deepseek-harness/scripts/gen-workflow-guest.spec.ts:1-43@687f282e` — 覆盖 bundle 自包含（data URL 导入 bundle 字符串，不是 guest-source.ts）、未解析导入拒绝与 `--check` 不写回。

**边界。** 不验证 guest 逻辑、运行时 API 或 PTC 沙箱安全；只保证交付形状。单 chunk 与非内建 external 的拒绝只有生成器断言，spec 未构造多 chunk 或非内建 external 负例；自包含测试不执行生成的 guest-source.ts。

<a id="m-enforcement-scripts-2.windows-packaging-dispatch"></a>
### enforcement-scripts-2.windows-packaging-dispatch — Windows 桌面打包只走手动专用 runner 且只上传被选中的安装包 {#enforcement-scripts-2.windows-packaging-dispatch}

**何时适用。** 修改 `.github/workflows/windows-package.yml`；修改桌面打包命令、签名/通道输入或 checkout 清理逻辑；新增 Windows 打包 preset 或 runner 标签。

**问题。** PR 或 push 触发桌面打包会把未审阅的安装包变成发布候选；在共享 runner 上清理 checkout 时跟随依赖 junction 会删除工作区外文件；把多个签名模式/版本的产物一起上传会让下游选错安装包。

**义务。**

1. workflow 只允许 `workflow_dispatch`；`runs-on` 固定专用标签 `dsh-win-package-trial`；`permissions` 仅 `contents: read`。
2. `concurrency` 使用固定组且 `cancel-in-progress: false`，避免打包被并发取消。
3. 输入提供 `signing`（默认 `signed`）、`version_mode`（默认 `default`）、`source_ref`（默认 `master`）、`update_channel`（默认 `nightly`）、`preset` 等；命令不得直接插值 `${{ inputs.* }}`，一律经 `env`。
4. checkout 使用 `clean`、`persist-credentials: false`，并检出指定 `source_ref`；pnpm setup 的 `dest` 包含 `run_id`/`run_attempt`，避免共享缓存串用。
5. settings step 必须先于两条 `package:desktop:win:x64` 命令；打包先 `--check` 再正式执行，两步使用相同 version 与 signing mode，并传播退出码。spec 没有断言独立的 build 步骤，只断言 settings 位于 package 命令之前。
6. 不得读取 `.env.windows` 等本地文件作为打包输入。
7. 在 checkout 成功后用 `always()` 上传诊断目录并包含隐藏文件；每个签名模式只上传选中的成功目录，`if-no-files-found: error`。
8. 清理 checkout 时只重置 `RUNNER_WORKSPACE` 下分配的目录，拒绝工作区外路径以及符号链接/junction 根。

**责任人与完成信号。** 发布工程师维护打包入口；CI 维护者维护 runner、权限与并发；Windows 打包维护者维护清理脚本。完成信号是 workflow 契约测试通过，且 Windows 上的 junction 清理用例不触碰外部目录。

**失败处理。** 触发方式、runner 标签、输入插值、上传范围或清理边界任一漂移都会使契约测试失败；修复 workflow 或清理脚本，不要放宽断言。

**证据。**

<a id="m-enforcement-scripts-2-windows-yaml"></a>
- `deepseek-harness/.github/workflows/windows-package.yml:1-167@687f282e` — 实际 workflow：手动触发、专用 runner、权限/并发、输入经 env、checkout 与清理边界、settings 先于 package、选择性上传。

<a id="m-enforcement-scripts-2-windows-checkout"></a>
- `deepseek-harness/scripts/windows-package-workflow.spec.ts:29-58@687f282e` — 在 Windows 上执行清理步骤：不跟随 `node_modules` junction，拒绝 `RUNNER_WORKSPACE` 外路径与 junction 根，外部文件保持不变。

<a id="m-enforcement-scripts-2-windows-dispatch"></a>
- `deepseek-harness/scripts/windows-package-workflow.spec.ts:60-82@687f282e` — 断言仅 `workflow_dispatch`、专用 runner、固定并发/权限、输入默认值、env 映射、checkout 参数与 pnpm setup dest。

<a id="m-enforcement-scripts-2-windows-order"></a>
- `deepseek-harness/scripts/windows-package-workflow.spec.ts:84-98@687f282e` — 断言 settings 在打包前、两次打包命令、`--check` 先行、相同 version/mode、退出码传播、命令不直接插值 inputs、不读 `.env.windows`。

<a id="m-enforcement-scripts-2-windows-upload"></a>
- `deepseek-harness/scripts/windows-package-workflow.spec.ts:100-109@687f282e` — 诊断目录 `always()` 上传且包含隐藏文件；每个签名模式只上传选中目录，缺失即失败。

**边界。** 不验证签名证书、安装包可安装性或真实发布；spec 不检查独立 build 步骤，只检查 settings 在 package 命令之前。YAML 断言依赖 workflow 结构，重命名 step id 需同步测试。

<a id="m-enforcement-scripts-2.ssh-helper-container-acceptance"></a>
### enforcement-scripts-2.ssh-helper-container-acceptance — SSH helper 发布前必须在无 Node 的隔离容器里跑真实 OpenSSH {#enforcement-scripts-2.ssh-helper-container-acceptance}

**何时适用。** 构建或发布 ssh-helper archive；修改 `verify-ssh-helper-ssh`、`ssh-helper-runtime` 或 PTC worker；变更 sandbox profile、目标 glibc 或容器镜像。

**问题。** 只验证 archive 解包或在本机构建树里运行，无法证明交付的 helper 在没有 Node、没有 checkout、只有 glibc 2.28 的目标环境可用；容器 readiness、host key 与清理处理不当还会制造假绿或残留资源。

**义务。**

1. archive 必须匹配同名 `.sha256`；`manifest.target` 必须包含 `-linux-`，镜像平台按 arm64/amd64 选择。
2. 只从已验证 archive 安装 helper，不把构建树当运行时；在容器内以密钥登录、绑定 `127.0.0.1` 临时端口，并用固定容器 host key 写 `known_hosts`。
3. readiness 只从容器日志的 `Server listening on` 判定，30 秒超时；sshd 提前退出必须失败。
4. driver 使用新建的空 HOME 目录（不是 unset HOME）、`DSH_HOME`、`DSH_VERIFY_NO_NODE=1`、telemetry 关闭；report 必须通过 `runtimeReportSchema`。
5. 断言容器 glibc 为 2.28；失败时附容器日志。
6. macOS restricted worker 用 `sandbox-exec` 拒绝读取/执行 checkout 与宿主 Node，并断言进程环境为空、两个受保护路径都以 `EPERM`/`EACCES` 被拒。
7. 无论成功失败都尝试删除 container、image 与临时目录；实现使用嵌套 finally，`docker rm`/`image rm`/临时目录失败会替换主错误。若目标是保留主错误，必须显式 suppress/log cleanup errors，source 没有这样做。

**责任人与完成信号。** SSH helper 维护者提供 archive；发布工程师运行验收；CI 维护者提供 Docker 与 macOS 受限环境。完成信号是真实 SSH 传输成功、report 通过 schema、glibc 断言成立，且容器/镜像/临时目录已清理。

**失败处理。** checksum/manifest 不符时不要继续；readiness 超时先看容器日志；受限 worker 读到受保护路径时检查 Seatbelt profile 与路径参数；清理失败要单独报告。

**证据。**

<a id="m-enforcement-scripts-2-ssh-readiness"></a>
- `deepseek-harness/scripts/verify-ssh-helper-ssh.ts:19-33@687f282e` — 只从日志 `Server listening on` 判定 readiness，30 秒超时，sshd 提前退出则失败。

<a id="m-enforcement-scripts-2-ssh-archive"></a>
- `deepseek-harness/scripts/verify-ssh-helper-ssh.ts:39-60@687f282e` — 校验 `.sha256`、解包并验证 payload/manifest、要求 Linux artifact、按 manifest 平台构建并启动容器。

<a id="m-enforcement-scripts-2-ssh-driver"></a>
- `deepseek-harness/scripts/verify-ssh-helper-ssh.ts:78-94@687f282e` — 空 HOME、`DSH_VERIFY_NO_NODE=1`、telemetry off、report schema 与 glibc 2.28 断言。

<a id="m-enforcement-scripts-2-ssh-cleanup"></a>
- `deepseek-harness/scripts/verify-ssh-helper-ssh.ts:95-105@687f282e` — 失败附容器日志，finally 嵌套删除 container、image 与临时目录；清理错误会替换主错误。

<a id="m-enforcement-scripts-2-ssh-probe"></a>
- `deepseek-harness/scripts/ssh-helper/worker-probe.ts:22-31@687f282e` — 生成 Seatbelt profile，拒绝 checkout 与 hostNode 的读取/执行，并以受限环境启动 worker。

<a id="m-enforcement-scripts-2-ssh-probe-assertions"></a>
- `deepseek-harness/scripts/ssh-helper/worker-probe.ts:33-66@687f282e` — 解析 worker 结果，断言 executable、空 env、两个拒绝码，并在 finally 清理进程与超时。

**边界。** 不覆盖生产 SSH 配置、网络故障注入或非 Linux 平台；容器平台映射只处理 arm64/amd64。HOME 是新建空目录而非 unset；嵌套 finally 的清理失败可能替换主错误。

<a id="m-enforcement-scripts-2.office-render-content-oracle"></a>
### enforcement-scripts-2.office-render-content-oracle — Office 渲染证据必须检查内容而不是只看命令成功 {#enforcement-scripts-2.office-render-content-oracle}

**何时适用。** 变更 Office 渲染路径或升级 LibreOffice/渲染库；为 Python runtime 或打包 skill 增加 Office 冒烟；修改 color-blocks fixture 或 manifest 字段。

**问题。** 渲染器可能返回成功但输出空白、透明、颜色块顺序颠倒，或 manifest 声称的 backend/rasterEngine/source 与实际不符。只看退出码或“图片能打开”会把坏预览当成证据。

**义务。**

1. 把 `color-blocks.docx/pptx/xlsx` 复制到私有测试目录，一次只渲一页/一张表；输出目录按引擎隔离。
2. 固定 `dpi=72`、`timeout-ms=120000`，并为每类文档选择正确范围（docx/pptx 第一页，xlsx `Render!A1:B2`）。
3. manifest 必须 `backend == expected`、`rasterEngine == 'libreoffice'`、`source == 'saved'`，且 `images` 恰好一个。
4. 对唯一图片先合成到白底，再统计红/蓝/黑/非白像素：红、蓝各 ≥1%，黑 ≥0.02%，非白 ≥4%。
5. 红块质心必须与蓝块保持严格间隔：实现要求 `red centroid + width*0.1 < blue centroid`，否则失败；这是必需的严格方向间隔，不是对称的“允许 10% 宽度”容差。
6. 任一引擎失败要聚合全部错误后统一抛出；成功后 artifacts 保留三份输入文档、`cli-docx`/`cli-pptx`/`cli-xlsx`/`node-pptx` 四个 PNG batch 与各自 manifest；`error.txt` 只在异常时写入。

**责任人与完成信号。** Python runtime 维护者维护 payload；Office 渲染路径维护者维护 CLI/manifest；打包 skill 维护者维护 fixture 与升级说明。完成信号是三种格式都通过 manifest 与像素检查。

**失败处理。** 错误信息包含 counts；先区分“渲染器失败”“manifest 字段漂移”“内容空白/顺序错误”，再修渲染路径或更新 fixture 阈值（阈值变更必须有新 fixture 依据）。

**证据。**

<a id="m-enforcement-scripts-2-office-workspace"></a>
- `deepseek-harness/scripts/fixtures/office-render.py:14-41@687f282e` — 私有临时根；失败写 `error.txt`；成功后保留三份输入文档与四个 PNG batch（含 manifest）。

<a id="m-enforcement-scripts-2-office-fixtures"></a>
- `deepseek-harness/scripts/fixtures/office-render.py:44-52@687f282e` — 把三种一页 color-blocks 文档复制到隔离目录。

<a id="m-enforcement-scripts-2-office-image"></a>
- `deepseek-harness/scripts/fixtures/office-render.py:55-78@687f282e` — 白底合成、颜色/非白像素阈值与严格红蓝质心间隔，错误带 counts。

<a id="m-enforcement-scripts-2-office-manifest"></a>
- `deepseek-harness/scripts/fixtures/office-render.py:81-92@687f282e` — manifest 的 backend/rasterEngine/source/images 断言。

<a id="m-enforcement-scripts-2-office-cli"></a>
- `deepseek-harness/scripts/fixtures/office-render.py:95-118@687f282e` — 逐引擎运行真实 CLI、固定 dpi/timeout/选择范围，聚合并统一抛出错误。

**边界。** 像素阈值依赖 fixture、dpi 与字体；不检查文本内容是否正确，只检查存在可见非白像素。红蓝规则是严格 10% 宽度间隔。没有本分区的 spec 证明该 oracle 被 installed-runtime 测试实际调用。

<a id="m-enforcement-scripts-2.lifecycle-entrypoint-resolution"></a>
### enforcement-scripts-2.lifecycle-entrypoint-resolution — pnpm 生命周期入口按类型解析而不是拼 shell 字符串 {#enforcement-scripts-2.lifecycle-entrypoint-resolution}

**何时适用。** 新增通过 `pnpm run` 调用的脚本或 gate；支持 Windows/带空格路径；替换 pnpm 安装方式或 `npm_execpath` 形态。

**问题。** 脚本在 `pnpm run` 下通过 `npm_execpath` 找 pnpm。Windows 路径可能包含空格、`$`、分号或非 ASCII 字符；把命令拼成 shell 字符串会被截断或执行错误命令，而直接 spawn JS 入口又缺少 Node 解释器。

**义务。**

1. `npm_execpath` 以 `.js`/`.cjs`/`.mjs`（大小写不敏感）结尾时，`command = process.execPath`，`args = [entrypoint, ...args]`。
2. 其他入口（无扩展名、`.exe` 等）直接执行 entrypoint，args 原样传递。
3. 空格、`$`、分号、非 ASCII 字符必须作为独立 argv 元素原样传递，不能经 shell 拼接。
4. `npm_execpath` 为 `undefined` 或空字符串时抛出可操作错误，提示通过 `pnpm run` 调用。
5. 调用方必须使用该解析结果，不得自行拼接 pnpm 命令字符串。

**责任人与完成信号。** 脚本/gate 维护者统一使用解析函数；CI 维护者确认跨平台 runner；评审者检查没有 shell 拼接。完成信号是参数化测试覆盖 JS/可执行入口、特殊字符与缺失入口。

**失败处理。** 路径被截断或执行错误解释器时，改为 argv 数组；缺失入口时给出明确错误，而不是回退到当前进程。

**证据。**

<a id="m-enforcement-scripts-2-pnpm-implementation"></a>
- `deepseek-harness/scripts/pnpm-invocation.ts:1-21@687f282e` — `pnpmInvocation` 纯函数：`.js/.cjs/.mjs`（大小写不敏感）走 `process.execPath`，其他入口直接执行，缺失或空 `npm_execpath` 抛出可操作错误。

<a id="m-enforcement-scripts-2-pnpm-js"></a>
- `deepseek-harness/scripts/pnpm-invocation.spec.ts:5-16@687f282e` — `.js/.cjs/.mjs/大写扩展名` 都经 `process.execPath` 执行。

<a id="m-enforcement-scripts-2-pnpm-special"></a>
- `deepseek-harness/scripts/pnpm-invocation.spec.ts:18-27@687f282e` — 带空格、`$`、分号、非 ASCII 的无扩展名/`.exe` 入口直接执行，argv 保持完整。

<a id="m-enforcement-scripts-2-pnpm-missing"></a>
- `deepseek-harness/scripts/pnpm-invocation.spec.ts:29-32@687f282e` — `undefined`/空入口抛出 `npm_execpath is unavailable; invoke the script through pnpm run`。

**边界。** 不验证 pnpm 版本、脚本本身、shell 重定向或真实安装；只覆盖 `npm_execpath` 的入口分类。非 JS 入口直接交给操作系统，不处理 Windows `.cmd` shim；不能替代 installed-artifact 或跨平台 launch 证据。

## References

- 源提交：`687f282e8625c6b8d11ff58211a90524be2e4317`。
- 覆盖账本：`research/enforcement-scripts-2-coverage.json`。
- 领域账本：`knowledge/enforcement-scripts-2.json`。
- 机制：`enforcement-scripts-2.locale-dictionary-key-parity`、`enforcement-scripts-2.coverage-location-equivalence`、`enforcement-scripts-2.bilingual-link-locale`、`enforcement-scripts-2.pinned-v3-vocabulary`、`enforcement-scripts-2.workflow-guest-single-module`、`enforcement-scripts-2.windows-packaging-dispatch`、`enforcement-scripts-2.ssh-helper-container-acceptance`、`enforcement-scripts-2.office-render-content-oracle`、`enforcement-scripts-2.lifecycle-entrypoint-resolution`。
- 跨域所有者：`documentation`、`testing`、`release`、`supply-chain`、`engineering`、`automation`、`package-contracts-2`、`package-contracts-6`、`persistence-historical-finalized`、`packaged-skill-contracts`、`rationale-process-2`；对应覆盖产物见覆盖账本 `crossDomain`。
- 证据未执行：本参考只读源仓并记录 `planned` 验证；没有在目标仓库运行构建、测试、格式化或 Git 命令。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `enforcement-scripts-2.locale-dictionary-key-parity`：`deepseek-harness/scripts/locale-dictionary-parity.spec.ts:1-308@687f282e`
- `enforcement-scripts-2.coverage-location-equivalence`：`deepseek-harness/scripts/coverage-canonical-locations.ts:1-94@687f282e`、`deepseek-harness/scripts/coverage-partitions.ts:1-300,590-650@687f282e`、`deepseek-harness/scripts/coverage-partitions.spec.ts:1-43,315-465,498-578@687f282e`
- `enforcement-scripts-2.bilingual-link-locale`：`deepseek-harness/scripts/translation-links.ts:1-384@687f282e`、`deepseek-harness/scripts/translation-links.spec.ts:1-281@687f282e`
- `enforcement-scripts-2.pinned-v3-vocabulary`：`deepseek-harness/scripts/verify-v3-event-vocabulary.ts:1-105@687f282e`、`deepseek-harness/scripts/verify-v3-event-vocabulary.spec.ts:1-146@687f282e`
- `enforcement-scripts-2.workflow-guest-single-module`：`deepseek-harness/scripts/gen-workflow-guest.ts:1-72@687f282e`、`deepseek-harness/scripts/gen-workflow-guest.spec.ts:1-43@687f282e`
- `enforcement-scripts-2.windows-packaging-dispatch`：`deepseek-harness/.github/workflows/windows-package.yml:1-167@687f282e`、`deepseek-harness/scripts/windows-package-workflow.spec.ts:1-109@687f282e`
- `enforcement-scripts-2.ssh-helper-container-acceptance`：`deepseek-harness/scripts/verify-ssh-helper-ssh.ts:1-108@687f282e`、`deepseek-harness/scripts/ssh-helper/worker-probe.ts:1-67@687f282e`
- `enforcement-scripts-2.office-render-content-oracle`：`deepseek-harness/scripts/fixtures/office-render.py:1-118@687f282e`
- `enforcement-scripts-2.lifecycle-entrypoint-resolution`：`deepseek-harness/scripts/pnpm-invocation.ts:1-21@687f282e`、`deepseek-harness/scripts/pnpm-invocation.spec.ts:1-33@687f282e`
