# policy-tests-2:测试中的治理义务(独立提取)

本域审查了 `research/residual-contract-assignments.json` 分配给 `policy-tests-2` 的 75 个测试、基准脚本、测试夹具与测试数据文件,固定源提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。判断依据是实际 setup/assertions,不是文件名中的 `policy`、`guard` 或 `contract`。多数文件是产品行为回归(网关协议、UI、沙箱、模型请求/插件兼容、附件、凭据迁移等),已在 `research/policy-tests-2-coverage.json` 中逐条记录非治理理由,不在此重复。

本域新增三个机制;其余治理测试复用其他域已有的机制,仅在来源记录中绑定,不复制其全文。

## pt2-macos-signing-cache-identity

来源:`apps/desktop/tests/macos-cache-policy.spec.ts:1-59`(kind=test) 与 `apps/desktop/scripts/macos-cache-policy.ts:1-61`(kind=implementation);运行时导入的签名详情断言位于 `apps/desktop/scripts/verify-macos-signature.mjs:14-39`(kind=implementation)。

机制:`macOSCachePolicy(label)(identifier, identity, entitlements?)` 同时产生 signer 的缓存 `policy`、`sign` 与 `verify(candidate)`。测试证明四件事:

1. 预期签名通过 `verify`;`verify` 调用 `codesign --verify --strict --verbose=2`,非零即拒绝,不是只看文件存在。
2. 九类不匹配分别被拒绝:叶证书、bundle identifier、TeamIdentifier、Authority、Timestamp、hardened runtime flag、entitlements、strict verify 结果、universal/fat Mach-O header。
3. 缓存键包含 bundle identifier、签名身份/TeamIdentifier、叶证书的 SHA-256 摘要、entitlement 文件内容(base64)、codesign/verify helper/policy/cache 脚本的摘要与 `os.release()`;它不保存原始证书字节。证书轮换、bundle identifier 或 entitlements 改变都会改变键。
4. `plutil` 提取的 entitlements 与 `codesign --extract-certificates` 提取的证书进入比较,而不是只比较文本输出;Authority/Team/Timestamp/runtime 由导入的 `assertMacOSRuntimeSignatureDetails` 检查。

适用边界:仅 macOS Desktop 签名缓存。测试 mock 了 `spawnSync` 与部分 `readFileSync`,因此它证明策略与字段比较,不证明真实 Developer ID 签名、notarization、Gatekeeper 或实际打包缓存实现。签名身份与发布身份只是相关依赖:本机制不证明发布流程使用该缓存,也不证明 release 门禁已核验身份。目标仓库必须用自己的 identity、Team、bundle id 与 entitlements 重设;真实 runner 上至少做一次正反例。相关发布机制:`release-desktop-signed-publish`(发布时真实签名/公证验证)、`release-desktop-version-artifacts`(构建版本与 runtime descriptor)、`release-desktop-retention`(保留包不可变存储)。

验证状态:源测试存在且为普通 `it`,本次未执行;所有 positive/rejection/recovery 均为 `planned`。

## pt2-built-corpus-node-oracle

来源:`packages/experimental/webworker-runtime/tests/compile/transform-corpus.spec.ts:1-90`(kind=test) 与 `packages/experimental/webworker-runtime/tests/compile/transform-corpus-check.ts:1-152`(kind=implementation)。

机制:构建产物导入扫描必须把 `transform-corpus-check.ts` 作为 Node 子进程运行:

```
spawnSync(process.execPath, ['--import', 'tsx/esm', runner])
```

不能在 Vitest 进程内 `import` 它。原因写在测试头注释里:Vitest 用 vite module runner,能解析 Node 不能解析的 `.css`,`koffi` 也会被二次加载;因此进程内跑会得到不同的 loader 结论,并把固定 baseline 豁免误报为 stale。

判定规则:

- 输出中以 `- ` 开头的 finding 必须为空,退出码必须为 0。
- 没有 built bundles 时,直接运行 `transform-corpus-check.ts` 打印 `no built bundles found` 并 `exitCode = 1`;spec 包装器检测该输出并显式 `skip`。直接调用脚本的 CI 不能把无构建树当通过,跳过也不是通过。
- baseline exemption 是四个 bundle 的固定清单:`ui-dockkit`、`ui-primitives`、`web`、`client-runtime`。只有 `ui-dockkit` 额外要求 Node 对 `.css` 的 `ERR_UNKNOWN_FILE_EXTENSION`(消息前缀不绑定具体 stylesheet);其他三个豁免接受任意失败原因。另一个扩展名、另一个错误码或不同消息对 dockkit 都是 `UNEXPECTED BASELINE FAILURE`。
- 被豁免的 bundle 若已能干净导入,必须报 `STALE EXEMPTION`。
- `baselineExempt=1 unexpectedBaselineFailure=0` 只是 dockkit 注入控制(只把 dockkit bundle 传给 check)的摘要;全语料摘要按实际 `files/ok/baselineExempt/unexpectedBaselineFailure` 输出,不能把 1 当作全语料基线计数。
- dockkit 负例覆盖 `expected-css`、`other-css`、`other-extension`、`error`、`other-code`、`clean` 六种分类;负例用 `registerHooks` 注入,仍由 Node 子进程运行。

适用边界:任何构建产物导入扫描。测试只证明 dockkit 的分类,不证明全语料,也不验证另外三个豁免 bundle 的真实失败原因;第一个测试超时为 900 秒,第二个测试复用当前测试超时(文件未给出数值)。目标仓库必须按自己的扩展名、原生依赖和构建布局重设豁免,不能照抄 `baselineExempt=1`。相关机制:`testing-source-built-entry-modes`(源平面/构建平面分离)、`testing-real-entry-composition`(真实进程/真实入口)。

验证状态:本次未构建、未运行 gate;所有验证为 `planned`。无构建产物时 spec 会 skip、直接脚本会 exit 1,因此“通过”必须在有 built output 的 lane 上取得。

## pt2-readonly-observation-benchmark

来源:`packages/experimental/cua-macos/native/tests/observation_benchmark.py:1-424`(kind=test;本次全读)。

机制:只读观察 A/B 基准把“可比较证据”写成硬约束:

- `READ_ONLY_METHODS` 只含 `getCapabilities`、`getApp`、`listWindows`、`getState`;`ObservationHelper.call` 对任何其他方法立即 `AssertionError`。
- 每个响应必须只含 `id` 与 `result`,id 必须匹配;否则失败。
- 请求与完整响应原文写入 artifact,并记录 requestId、helper `sha256`、responseBytes 与 responseSHA256;帧不完整时只保存 `pipe.pending` 字节并记录 partialResponseFile/partialResponseBytes,不计算 responseSHA256。
- 观察结果必须绑定 fixture PID 与 window ID,包含 `appHandle/snapshotId/pid/windowId/tree/elements/windows/focusedWindowId/truncated`;`truncated` 必须为 false;树中 `Scroll row N` 的集合必须精确等于 1..rowCount。
- reference 与 candidate 各一次 warm-up,随后三轮交替测量;只有 helper 生成的 `appHandle` 与 `snapshotId` 从逐字段比较中排除,其他字段必须同型同值。
- 响应上限 32 MiB;超时、部分帧、EOF 后多余输出都失败。
- 每个 helper 与 fixture 都是自有进程:`OwnedProcess` 记录 pid、cleanup 结果、cleanup 前后退出码,并用 `stop_group` 清理;清理错误不被吞掉。
- 观察前后 fixture state 必须逐值相同;helper binary 与 fixture source 的 SHA-256 不得改变。
- 前置条件:仅 macOS;session 未锁、Accessibility 已授权;`--request-timeout` 与 `--timeout` 必须为正有限数。

适用边界:只读原生 GUI/API 的 A/B 观察。脚本是 opt-in,不在默认 CI;本次未运行。它是条件式人工产品证据,保证方法论,不证明性能结论或产品正确性;没有持久事实、实时权限或重启再激活模型。与 `testing-benchmark-workload-hygiene` 的关系:后者拥有通用基准隔离/合成输入/原始样本/内存预算;本机制补充只读方法白名单、fixture 身份绑定、artifact 哈希与自有进程清理。自有进程的分配/清理/等待静止与 `testing-resource-isolation` 同向;本机制不另立通用资源清理规则。目标仓库可保留方法论,但行数、helper 路径、授权前提与预算必须参数化。

验证状态:本次未运行 native benchmark;所有验证为 `planned`。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `policy-tests-2-macos-signing-cache-identity`：`deepseek-harness/apps/desktop/tests/macos-cache-policy.spec.ts:1-59@687f282e`、`deepseek-harness/apps/desktop/scripts/macos-cache-policy.ts:1-61@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-macos-signature.mjs:14-39@687f282e`
- `policy-tests-2-built-corpus-node-oracle`：`deepseek-harness/packages/experimental/webworker-runtime/tests/compile/transform-corpus.spec.ts:1-90@687f282e`、`deepseek-harness/packages/experimental/webworker-runtime/tests/compile/transform-corpus-check.ts:1-152@687f282e`
- `policy-tests-2-readonly-observation-benchmark`：`deepseek-harness/packages/experimental/cua-macos/native/tests/observation_benchmark.py:1-424@687f282e`
