# policy-tests-1：测试分区、已提交 Session 语料与发布门禁的处置参考

本文件是 `policy-tests-1` 域的自包含参考。来源固定为 `deepseek-harness/` 的提交 `687f282e8625c6b8d11ff58211a90524be2e4317`，行号以该提交为准。该域是对 73 个测试/夹具/辅助脚本的**处置分区**：绝大多数路径验证产品行为，不产生新的治理机制；只有少数路径是仓库工具、发布或测试语料的执行点。真正拥有义务的机制仍归其原领域，本文件只记录本域新增的一条机制，并给出复用映射。

## 判定口径

- **governance**：测试或辅助脚本执行的义务约束仓库维护、发布、生成物、依赖安装或提交语料，而非产品运行时行为。
- **non-governance**：测试驱动产品 API/UI/存储/网络行为，即使文件名含 `policy`、`contract` 或 `admission`。分类理由来自正文断言，不来自文件名。
- **generated**：e2e 录制/生成的预期输出夹具；它们是被断言的数据，不是治理规则。
- 只有实际读取的区间会写入 `research/policy-tests-1-coverage.json`；长文件只声明已读的头部区间，未读部分列入 `unresolved`。

## 新增机制

<a id="policy-tests-1.committed-session-fixture-corpus-admission"></a>

## Committed session fixture corpus admission

**来源。** `deepseek-harness/packages/test-support/llm-replay/tests/session-format-corpus.spec.ts:1-138@687f282e`（测试全文）。该测试是 `packages/test-support/llm-replay` 的 committed-corpus gate，配套 inventory 提供 `expectedUnsupported` 与 `unversionedProtocolFixtures`。

**问题。** 仓库中有多代际的 `session*.jsonl`：`snapshots/`、`packages/` 与 `scripts/snapshots/python-sdk-single-exe/`。如果文件名代际、header 的 `version` 和实际恢复行为三者不一致，读取方会按错误代际解释数据；如果历史拒绝例外丢失、原因被改，或把当前代际登记为“历史不支持”，兼容性证据就不再可信；如果测试为了让 fixture 通过而改写源字节，原始证据被破坏。

**必须保持的义务。**

1. 递归发现上述三个根下的 `session*.jsonl`，跳过符号链接和 `dist`、`lib`、`node_modules`。
2. 文件名必须匹配 `^session(?:\.[1-9]\d*)?(?:\.v[1-9]\d*)?\.jsonl$`；非法名称立即失败并带绝对路径。
3. 非豁免语料的第一个非空行必须是 JSON 对象且含 `version`；文件名代际（无 `.vN` 时为 0）必须等于 `header.version`。
4. `expectedUnsupported` 与 `unversionedProtocolFixtures` 的每个键必须对应真实发现的语料，不能悬空。
5. 无版本协议夹具必须不声明 `version`、文件名代际为 0，且不得同时出现在历史拒绝清单。
6. 历史拒绝必须满足 `sourceVersion < SESSION_FORMAT_VERSION`，且等于 inventory 的 `sourceVersion`；恢复必须抛出 `SessionFormatUnsupportedMigrationError`，消息与 inventory 的 `reason` 完全相等。
7. 当前代际不得配置历史拒绝例外；任何其他异常都必须失败，且断言消息以语料的相对路径为 key，不能把损坏当作受支持的历史拒绝。异常文本本身不要求包含路径。
8. 恢复结束后必须逐字节比较源文件，证明读取过程没有改写提交语料。
9. 源测试还包含六项合成拒绝策略自测（未列入、成功开始恢复、reason 改变、普通 `Error` 伪装、代际不符、当前代际豁免）和一项精确 typed refusal 接受案例。它们证明 `assertRestoration` 策略本身，不证明真实语料已被增删或变异测试覆盖。

**执行方式。** Vitest 测试：`committedSessionFixtures` 做发现与文件名校验，`declaresFormat` 与 `filenameFormatVersion` 比较 header/文件名代际，`assertRestoration` 对每个语料执行恢复并比对 typed error 与精确 reason；`finally` 中的 `readFileSync` 比较保证字节不变。清单例外由人评审，测试只机械验证闭合性。另有 `corpus unsupported policy` describe 用 stub refusal 运行上述六项拒绝和一项接受，它不读取真实语料。

**失败与例外。** 非法名称、代际不一致、悬空清单键、协议夹具带版本、当前代际被列为 unsupported、错误类型/reason 不匹配、损坏伪装成历史拒绝、源字节变化都会失败；断言以语料 key 标识，但不要求异常文本含路径。唯一的正常例外是无版本协议夹具；它必须显式登记，不能靠“没有 header”自动获得豁免。真实语料的删除、重命名和字节改写负例没有被这六项合成自测覆盖。

**迁移建议。** 先固定发现根、文件名语法和 header 规则，再建立“路径 + 代际 + 错误类型 + 精确 reason”的拒绝清单；把 in-place 改写视为缺陷。若目标项目只有单一代际，可缩成单代际 golden，但仍应保留文件名/header 一致和读取不改字节两项；合成拒绝策略自测应从目标项目自己的 `assertRestoration` 生成，而不是照抄源测试的 stub。

**验证（全部为计划，未执行）。** 正向：现有语料全部被发现，支持代际恢复成功，协议夹具保持无版本；运行六项合成拒绝策略自测和一项精确接受案例。拒绝：构造代际不一致、悬空键、当前代际例外、错误 reason、损坏伪装和字节改写，测试必须失败；真实语料的删除/重命名/字节改写变异仍待执行。恢复：修正文件名/header/inventory，或从版本控制恢复被误改的字节后重跑。

## 复用的跨域机制

这些路径在本域被读取，但机制的义务与执行实现属于其他领域；本域只补充测试证据，不复制其规则。

| 本域路径 | 复用机制 ID | 归属领域 | 关系 |
|---|---|---|---|
| `packages/core/agent/tests/verify-export-jsdoc.spec.ts` | `documentation-comments-export-jsdoc` | documentation | 导出 JSDoc 门禁的 fixture 测试 |
| `packages/core/session/tests/gen-persistence-catalog.spec.ts` | `rationale-process-1-generated-reference-freshness` | rationale-process-1 | 持久化目录生成器的负路径测试 |
| `packages/experimental/webworker-runtime/tests/compile/transform-corpus-check.ts` | `policy-tests-2-built-corpus-node-oracle` | policy-tests-2 | 构建产物导入扫描脚本 |
| `packages/boot/plugin-manager/tests/build-approval.spec.ts` | `rationale-architecture-3.arch3-M06` | rationale-architecture-3 | 当前 profile 插件管理的构建批准负路径测试 |
| `apps/desktop/tests/installed-update-publication.spec.ts` | `release-desktop-test-publication` | release | 已安装更新的测试 feed 发布 |
| `apps/desktop/tests/desktop-publication-preflight.spec.ts` | `release-desktop-signed-publish` | release | 签名发布的 preflight |
| `apps/desktop/tests/desktop-publication-failure.spec.ts` | `runtime-residual-authority.desktop-publication-diagnostics`、`release-desktop-test-publication` | runtime-residual-authority / release | 失败脱敏与发布诊断 |
| `apps/desktop/tests/desktop-publication-summary.spec.ts` | `runtime-residual-authority.desktop-publication-diagnostics`、`release-desktop-test-publication` | runtime-residual-authority / release | 审批摘要与逐文件哈希 |
| `apps/desktop/tests/runtime-file-policy.spec.ts` | `package-contracts-2.desktop-runtime-file-policy`、`runtime-residual-authority.desktop-runtime-payload` | package-contracts-2 / runtime-residual-authority | 运行时载荷裁剪 allowlist |
| `apps/desktop/tests/desktop-policy-environment.spec.ts` | `runtime-residual-authority.desktop-packaging-environment` | runtime-residual-authority | 打包环境变量校验 |
| `apps/desktop/tests/runtime-manifests.spec.ts` | `runtime-residual-authority.desktop-runtime-payload` | runtime-residual-authority | 归档清单与 ASAR 校验 |

## 处置摘要

- 73 条路径：12 条 governance、59 条 non-governance、2 条 generated。
- 新增本域机制 1 条；复用 10 个跨域机制 ID。
- 59 条 non-governance 覆盖产品 UI、会话格式迁移、持久化 admission、工具沙箱、网络代理、重试、附件、PWA 与性能预算等；每条理由都写在 coverage 记录中。
- 两个 `session.expected.jsonl` 是录制/生成的预期输出，归为 `generated`；不把夹具内容当作规则。
- 长测试只读头部 1-143 行；`gen-persistence-catalog.spec.ts` 只读到 183/306。这些范围限制在 coverage 的 `unresolved` 中显式保留，没有用“已全文阅读”掩盖。
