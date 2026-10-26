# 发布域（release）迁移参考

本文件覆盖 DeepSeek Harness 固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`（下称“源”）中**npm 发布序列、原生/Python/Desktop 交付、GitHub/GitLab 发布工作流、Session 持久化兼容、类型变更确认与升级指南**的可操作治理机制。读者触发条件：准备发版、改版本号、改持久化类型或 Session 格式、新增发布渠道、审查发布工作流、判断某个“已发布/已兼容”声明是否有真实证据。

约定：

- 引用格式 `deepseek-harness/<path>:<start>-<end>@687f282e`；行号来自上述提交。
- **【源义务】**：源明确实现或写下的约束；**【迁移设计】**：本文给迁移方的落地建议，不是源义务；**【附加建议】**：源未强制但可降低复刻风险。
- 源只读；本域不修改源。所有“已验证”均需真实命令输出；本文不把源码存在当成执行通过。
- 发布域与自动化域的边界：工作流的 runner 路由、缓存、并发/取消、job 依赖图属于自动化域；本域拥有发布语义、版本/标签、凭据门、产物验证与发布证据。
- 发布域与文档域：双语配对、链接检查、`doc-sync` 的通用规则属于文档域；本域只拥有升级指南与持久化记录的**发布语义和格式门**。
- 发布域与测试域：测试策略、覆盖率与 e2e 预算属于测试域；本域拥有发布前必须出现的正/反/恢复证据。

---

<a id="index"></a>
## 0. 读者触发索引

| 你要做的事 | 先读 | 关键完成信号 |
| --- | --- | --- |
| 发 dsh / vendor npm 包 | §1、§2、§3、§4 | 本地 bump 已提交；从正确 tag 手工 dispatch；`npm-publish` 已批准；注册表三态逐包结算 |
| 新增/移动 workspace 包或改版本 | §2.3 | dsh 家族 manifest 均等于 root 版本；dsh 用 `workspace:*`、vendor/native 用 `workspace:~`；`constraints` 通过 |
| 改发布依赖面或新增 Host 运行时导出 | §2.4 | 每个导出已分类；Cordis peer+dev 匹配；`verify-package-dependencies` 与 `verify-npm-install-layout` 通过 |
| 把发布预演路由到 self-hosted Linux | §3.3 | 仅 writer-controlled 变量 + 可信 master/同仓非 fork 非 Dependabot PR；checkout 清理/临时卷/packed-install 隔离；publish 仍 hosted |
| 发 native/system 包 | §5 | `node-addon-system-v<version>` tag；全平台 prebuild 与 Node 20/22/24/26 测试通过；OIDC 权限下逐包发布 |
| 发 Python SDK/runtime 到 PyPI | §6 | `python-v<repo-version>` tag；六个 wheel 精确匹配且逐件通过构建自检；`pypi-runtime` 先于 `pypi`；哈希复核 |
| 发 Desktop 安装包 | §7–§10 | 从 master dispatch；生产包签名验证；审批摘要一致；锁内先二进制后 feed；生产 tag 或显式 pending；回滚只改 feed |
| 改 Session 持久化类型 | §14 | 生成 record + schema + catalog；兼容性决策有证据；`doc-sync` 通过 |
| 改 schema 注解/保留 optional 名字 | §14.2a | binding 有 literal role；qualified kind 双侧 promise；`@persistenceReserved` 只用于 optional never；歧义不强行配对 |
| 归档历史 Session 格式 / 预发布 tag | §12.3–§12.4 | 每个历史整数有完整 schema+双语声明；tag 顺序/digest/类型完整；`verify-persistence-formats` / `verify-persistence-releases` 通过 |
| 准备 Desktop 测试 feed 或网络故障 | §10.3–§10.4 | upload/publish 分离；TTY 精确确认；v2 journal；版本查询/read-back；owned 防火墙规则可恢复 |
| 选择 Desktop 发布包 / 保留产物 | §7.5、§9.1 | 精确 run/attempt；唯一成功 package job 与原 runner；retained manifest 全等；attempt 不可覆盖 |
| 改 Session 格式版本 | §12–§13 | 相邻迁移包齐全；严格迁移测试；旧代际字节不变；发布后才更新 release record |
| 只读打开历史 Session / 并发 resume | §13.2a–§13.2b | read 只准备不落盘；write 前发布一次；单飞/取消/源漂移；Sidebar fork 的 migration gate |
| 写升级指南 | §15 | 在引入破坏的同一次改动中写；英文 ≤500 词；双语配对；`verify-upgrade-guides` 通过 |
| 判断“是否已发布/已兼容” | §12、§16 | writer、finalized、latestReleased、evidenceTag 四者分开核对，不以分支或 tag 猜 |

**机制 ID 索引（供知识库与审计绑定；每个 ID 在对应章节有稳定 anchor）**

| 机制 ID | 章节 anchor | 核心固定提交证据 |
| --- | --- | --- |
| `release-three-sequence-model` | `#npm-sequences` | `deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:8-32@687f282e`；`scripts/release/families.ts:322-438@687f282e`；`scripts/release/bump.ts:1-416@687f282e` |
| `release-publish-order-payload` | `#publish-order` | `scripts/release/families.ts:93-271@687f282e`；`scripts/publication-payload.ts:1-55@687f282e`；`scripts/release/verify.ts:17-110@687f282e`；`scripts/release/tarball.ts:1-63@687f282e` |
| `release-workspace-version-ranges` | `#workspace-version-ranges` | `.agents/notes/archived/process/2026-09-03-workspace-version-coherence-gate.md:1-30@687f282e`；`.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md:1-28@687f282e`；`scripts/check-workspace-constraints.ts:407-427@687f282e`、`:573-644@687f282e` |
| `release-published-dependency-faces` | `#published-dependency-faces` | `.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:1-97@687f282e`；`scripts/verify-package-dependencies.ts:1-1038@687f282e`；`scripts/verify-npm-install-layout.ts:1-275@687f282e`；`.github/workflows/release.yml:80-88@687f282e` |
| `release-npm-rehearsal` | `#npm-rehearsal` | `.github/workflows/release.yml:1-180@687f282e`；`scripts/release/verify-packed-install.ts:1-126@687f282e`；`scripts/release/installed-product-isolation.ts:1-73@687f282e` |
| `release-rehearsal-runner-trust` | `#rehearsal-runner-trust` | `.agents/notes/archived/process/2026-09-06-release-rehearsal-selfhosted.md:1-28@687f282e`；`.github/workflows/release.yml:1-180@687f282e`；`.github/workflows/release-vendor.yml:1-107@687f282e` |
| `release-npm-manual-publish` | `#npm-rehearsal` | `.github/workflows/release-publish.yml:1-131@687f282e`；`.github/workflows/release-vendor-publish.yml:1-126@687f282e`；`scripts/release/verify.ts:45-110@687f282e` |
| `release-npm-registry-idempotency` | `#npm-registry` | `scripts/release/publish.ts:1-235@687f282e`；`.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:96-125@687f282e` |
| `release-native-addon` | `#native` | `.github/workflows/node-addon-system-release.yml:1-188@687f282e`；`.github/workflows/node-addon-system.yml:1-170@687f282e`；`native/system/scripts/verify-release.mjs:1-54@687f282e`；`native/system/scripts/publish-release.mjs:1-165@687f282e` |
| `release-native-artifact-assembly` | `#native` | `native/system/scripts/github-matrix.mjs:1-69@687f282e`；`assemble-prebuilds.mjs:1-54@687f282e`；`pack-release.mjs:1-118@687f282e`；`verify-packed-install.mjs:1-238@687f282e` |
| `release-python-pypi` | `#python` | `.github/workflows/python-release.yml:1-248@687f282e`；`.github/workflows/build-exe-for-python-sdk.yml:1-512@687f282e`；`scripts/build-python-release.py:1-295@687f282e` |
| `release-python-executable-builder` | `#python` | `scripts/build-exe-for-python-sdk.ts:1-622@687f282e`；`.github/workflows/build-exe-for-python-sdk.yml:1-512@687f282e` |
| `release-desktop-version-artifacts` | `#desktop-version` | `apps/desktop/scripts/desktop-build-version.mjs:1-104@687f282e`；`apps/desktop/scripts/desktop-upload-plan.ts:1-294@687f282e`；`apps/desktop/packaging/README.md:86-140@687f282e`；`.github/workflows/macos-package.yml:1-142@687f282e`；`.github/workflows/windows-package.yml:1-167@687f282e` |
| `release-desktop-package-selection` | `#desktop-publish` | `.github/workflows/desktop-publish.yml:1-154@687f282e`；`preflight-desktop-publish.mjs:1-47@687f282e`；`resolve-desktop-publish-ci.ts:1-68@687f282e`；`desktop-publish-route.ts:1-70@687f282e`；`resolve-retained-desktop-publish-ci.ts:1-52@687f282e` |
| `release-desktop-retention` | `#desktop-retention` | `desktop-ci-version.mjs:1-34@687f282e`；`retain-desktop-ci.ts:1-79@687f282e`；`desktop-release-store.ts:1-145@687f282e`；`.github/workflows/macos-package.yml:1-142@687f282e`；`.github/workflows/windows-package.yml:1-167@687f282e` |
| `release-desktop-signed-publish` | `#desktop-publish` | `.github/workflows/desktop-publish.yml:1-154@687f282e`；`apps/desktop/scripts/desktop-publish.ts:1-132@687f282e`；`apps/desktop/scripts/publish-desktop-ci.ts:1-129@687f282e`；`apps/desktop/scripts/desktop-publish-record.ts:1-110@687f282e`；`apps/desktop/scripts/desktop-rollback.ts:1-58@687f282e`；`apps/desktop/scripts/desktop-publish-cos.ts:1-81@687f282e`；`verify-macos-signature.mjs:1-214@687f282e`；`apps/desktop/scripts/windows-signature-cache.mjs:1-220@687f282e`；`apps/desktop/scripts/windows-signature-cache.d.mts:1-76@687f282e` |
| `release-desktop-qualification` | `#desktop-qualification` | `apps/desktop/tests/README.md:1-88@687f282e`；`apps/desktop/tests/installed-update/README.md:1-132@687f282e`；`apps/desktop/scripts/installed-update-distribution.ts:1-74@687f282e` |
| `release-desktop-test-publication` | `#desktop-test-publication` | `apps/desktop/tests/installed-update/publication/README.md:1-72@687f282e`；`installed-update-publication.ts:1-217@687f282e`；`publish-installed-update.ts:1-40@687f282e`；`apps/desktop/scripts/installed-update-distribution.ts:1-74@687f282e` |
| `release-desktop-network-fault` | `#desktop-network-fault` | `apps/desktop/tests/installed-update/network/README.md:1-58@687f282e`；`prepare-installed-update-network.ts:1-62@687f282e`；`installed-update-network.ps1:1-89@687f282e` |
| `release-other-delivery` | `#other-delivery` | `.github/workflows/publish-ssh-helper.yml:1-101@687f282e`；`.github/workflows/docs-pages.yml:1-93@687f282e`；`.gitlab-ci.yml:1-191@687f282e`；`scripts/ssh-helper/release.ts:1-76@687f282e`；`scripts/ssh-helper/artifact.ts:1-88@687f282e` |
| `release-session-authority` | `#session-authority` | `docs/session-format-status.md:1-63@687f282e`；`.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:1-42@687f282e`；`scripts/doc-standard.spec.ts:162-300@687f282e` |
| `release-session-migrations` | `#session-migration` | `.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:1-251@687f282e`；`scripts/gen-session-format-catalog.ts:1-261@687f282e`；`docs/cookbook/adding-a-session-format-version.md:1-153@687f282e`；`packages/session/session-format-v3-to-v4/README.md:1-350@687f282e` |
| `release-session-migration-preparation` | `#session-migration-preparation` | `.agents/notes/implemented/architecture/2026-09-05-read-only-session-migration-preparation.md:1-170@687f282e`；`.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e`；`packages/session/session-persistence-jsonl/src/migration-verifier.ts:1-198@687f282e`；`packages/session/session-persistence-jsonl/tests/migration-verifier.spec.ts:1-273@687f282e` |
| `release-session-batch-migration-cli` | `#session-batch-migration` | `scripts/migrate-sessions-to-v4.ts:1-303@687f282e`；`scripts/migrate-sessions-to-v4.spec.ts:1-450@687f282e`；`scripts/migration-failure-summary.ts:1-43@687f282e` |
| `release-persistence-records` | `#persistence-records` | `docs/persistence-changes/README.md:1-90@687f282e`；`docs/cookbook/reviewing-persistence-type-changes.md:1-122@687f282e`；`.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-39@687f282e`；`scripts/persistence-finalization.ts:1-168@687f282e`；`scripts/persistence-changes.ts:535-716@687f282e`、`:793-879@687f282e` |
| `release-persistence-schema-policy` | `#persistence-schema-policy` | `.agents/notes/implemented/process/2026-09-17-persistence-schema-review.md:1-39@687f282e`；`.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e`；`scripts/persistence-schema.ts:210-360@687f282e`、`:400-480@687f282e`；`scripts/persistence-source-policy.ts:1-69@687f282e`；`scripts/persistence-review.ts:20-183@687f282e` |
| `release-sqlite-schema-compatibility` | `#persistence-sqlite-schema` | `AGENTS.md:7-7@687f282e`；`packages/storage/storage-sqlite/src/schema.ts:9-20@687f282e`、`:55-105@687f282e`；`packages/session-query/session-query-sqlite/src/schema.ts:7-11@687f282e`、`:38-66@687f282e`、`:96-138@687f282e`；`packages/storage/storage-sqlite/tests/sqlite-backend.spec.ts:69-85@687f282e`；`packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1319-1375@687f282e` |
| `release-persistence-format-archive` | `#persistence-format-archive` | `docs/persistence-changes/historical-formats/README.md:1-75@687f282e`；`scripts/persistence-formats.ts:1-230@687f282e`；`docs/cookbook/adding-a-session-format-version.md:23-68@687f282e` |
| `release-persistence-release-archive` | `#persistence-release-archive` | `docs/persistence-changes/releases/README.md:1-103@687f282e`；`docs/persistence-changes/releases/manifest.json:1-162@687f282e`；`scripts/persistence-releases.ts:1-257@687f282e` |
| `release-upgrade-guides` | `#upgrade-guides` | `.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e`；`scripts/verify-upgrade-guides.ts:1-85@687f282e` |

---

<a id="npm-sequences"></a>
## 1. 三条 npm 序列与“版本先落库、CI 只检查上传”

### 1.1 问题与结构

**【源义务】** 仓库有三组互不共享版本、触发和等待关系的可发布包：

| 序列 | 成员 | 版本基线 | tag | 工作流 |
| --- | --- | --- | --- | --- |
| dsh | `packages/*/*` 与 `apps/*` 的公开成员；私有包只跟随版本 | 整个公开集 + 私有 dsh 包 + workspace root 共用一个版本 | `dsh-v<version>` | `release.yml`（打包）/`release-publish.yml`（发布） |
| vendor | `vendor/*` 的九个 Cordis 框架包 | 每包独立版本线 | `vendor-<unscoped-name>-v<version>` | `release-vendor.yml` / `release-vendor-publish.yml` |
| native | `native/system/packages/*` | 自有 `0.0.x` | `node-addon-system-v<version>` | `node-addon-system-release.yml` |

依据：`deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:8-32@687f282e`；`scripts/release/families.ts:322-438@687f282e`。

发布 dsh 不应重发 vendor 或 native；三条序列各自打包、各自 tag、各自审批。`families.ts` 只拥有 dsh 与 vendor 两类对象，native 由自己的工作流和脚本管理。

### 1.2 版本从哪里来

**【源义务】** 版本由本地 bump 命令写进 manifest 和 lockfile，然后人工提交、人工打 tag；CI 不写仓库、不需要 `contents: write`。发布版本因此可从仓库读出，tag 只是一个已提交版本的指针。

- dsh：`release:dsh major|minor|patch|<explicit>` 把同一版本写入公开集、`packages/*/*` 下私有包和 workspace root，再运行 `pnpm install --lockfile-only` 并提交。私有包不进入 pack/publish，只跟随版本以满足版本一致性门。依据：`deepseek-harness/scripts/release/bump.ts:1-416@687f282e`；`deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:36-52@687f282e`。
- vendor：以 manifest 版本与“最新已打 tag 版本”的较高者为基线，稳定版后 patch +1；`--prerelease rc.1|alpha.1` 选择预发布。一次 release 推进全部九个包，每包独立版本与 tag；不能只发有 diff 的目录，因为从另一仓库状态重打包可能改变依赖范围或构建字节。依据：`deepseek-harness/scripts/release/bump.ts:1-416@687f282e`；同 Note `:54-76@687f282e`。
  vendor 的基线比较只看 release numbers。只有 tag 是预发布，且其 numbers 更高、或 numbers 相同且 manifest 仍为预发布时，才复用基线 numbers；否则 patch+1，再按请求追加预发布标识。例如源测试中 `4.0.0-rc.7` 首次预演为 `4.0.1-rc.1`，随后稳定版复用 `4.0.1`；已有稳定 `4.0.1` 则下一次为 `4.0.2`。最新 tag 由 `compareVersions` 比较，而非 Git refname 版本排序：同 numbers 下 stable 高于 prerelease，预发布数字字段按数值、数字低于非数字、相同前缀的短列表较低。依据：`deepseek-harness/scripts/release/bump.ts:105-130,168-185,211-216@687f282e`；`deepseek-harness/scripts/release/families.spec.ts:409-458@687f282e`。
- native：`native/system` 自己的 bump 脚本把版本写进包 manifest 并提交；tag 由人工创建。依据：`deepseek-harness/native/system/scripts/verify-release.mjs:1-54@687f282e`；`deepseek-harness/.github/workflows/node-addon-system-release.yml:1-188@687f282e`。

**【源义务】** 标签不证明发布成功：它只保留版本并标识提交。发布失败时 tag 仍可能存在；release manager 必须另外核对注册表。这是源明确接受的成本，不能把“tag 存在”当作“包已发布”。依据：`deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:77-81@687f282e`、`:181-186@687f282e`。

### 1.3 npm dist-tag 规则

- dsh：`alpha` → `alpha`，`canary` → `canary`，其他预发布（含 `rc`）→ `next`，稳定版不传 `--tag`，由 npm 落到 `latest`。依据：`deepseek-harness/scripts/release/families.ts:367-374@687f282e`。
- vendor：预发布默认 `next`，稳定版默认 `latest`；发布工作流可传一个未占用的 `--dist-tag` 覆盖。依据：`deepseek-harness/scripts/release/families.ts:288-296@687f282e`；`deepseek-harness/.github/workflows/release-vendor-publish.yml:8-16@687f282e`。
- 显式 dist-tag 必须非空、不以 `-` 开头、无需 URI 编码、不是 semver range；发布前对整个批次逐包检查“该 tag 尚不存在，或已指向本版本”。已发布版本但没有该 tag、或 tag 指向别版本，整批在首个上传前拒绝。依据：`deepseek-harness/scripts/release/publish.ts:83-122@687f282e`。
- **【源义务】** 不加 `--access`：每个包的 `publishConfig.access` 自己拥有公开级别；命令行 flag 会覆盖 manifest，而三条序列可能不同意。依据：`deepseek-harness/scripts/release/publish.ts:148-153@687f282e`；同 Note `:28-32@687f282e`。

### 1.4 责任者、完成信号与失败

**责任者**：发布者/版本管理员（本地 bump、提交、打 tag）；release manager（核对注册表、发布后更新 Session record）；CI（只验证和上传）。

**完成信号**：bump 提交包含所有目标 manifest 与 `pnpm-lock.yaml`；`release:verify` 打印完整发布顺序且无未解释的 dropped peer edge；tag 存在且指向该提交；注册表逐包返回 published 或 already-present 且 integrity 一致。

**失败处理**：版本已发布但内容不同 → 必须 bump，不可覆盖；tag 已存在但发布失败 → 用同一 tag 重跑发布（注册表三态幂等），并单独核对完成；bump 后发现错误 → 在发布前重新 bump，发布后只能下一个版本。

**例外**：当前所有 `packages/experimental/` 包都在 dsh family 与本地 npm baseline 发布；manifest 省略 `private` 并设 `publishConfig.access: public`，私有 denylist 当前为空。实验命名、opt-in 组合、依赖隔离、兼容预期与支持限制不变；公开不等于产品支持承诺。`families.members()` 仍默认跳过 `private: true`，其他私有包只跟随 dsh 版本、不发布。依据：`deepseek-harness/.agents/notes/archived/process/2026-09-12-publish-all-experimental-packages.md:1-30@687f282e`；`scripts/experimental-package-policy.ts:1-67@687f282e`。

**证据限制**：上述是脚本和工作流的结构性保证；真正发布需要 `npm-publish` 环境审批、npm 凭据/OIDC 和注册表状态，仓库内无法证明。

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:1-186@687f282e
来源：deepseek-harness/scripts/release/families.ts:1-495@687f282e
来源：deepseek-harness/scripts/release/bump.ts:1-416@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-12-publish-all-experimental-packages.md:1-30@687f282e
来源：deepseek-harness/packages/experimental/README.md:1-24@687f282e
来源：deepseek-harness/scripts/experimental-package-policy.ts:1-67@687f282e

<a id="publish-order"></a>
## 2. 成员发现、发布顺序与 payload 政策

### 2.1 成员与顺序

**【源义务】** dsh 的成员模式是 `packages/*/*/package.json` + `apps/*/package.json`；vendor 是 `vendor/*/package.json`。发现时：

1. 跳过 `private: true`；
2. 拒绝 workspace root 包名 `@deepseek-ai/dsh-root`；
3. 要求包名以 `@deepseek-ai/` 开头；
4. 同一 family 内重复包名直接报错；
5. 版本基线按 family 校验（dsh 单一版本；vendor 每包可发布 semver）。

依据：`deepseek-harness/scripts/release/families.ts:144-183@687f282e`。

发布顺序的算法（`publishOrder`）：

- `dependencies`/`optionalDependencies` 是**绝对边**：消费者必须在其安装依赖之后发布。若这些边成环，直接报错，不擅自打破。
- 该排序器将 `peerDependencies` 作为**可丢弃的排序边**，不是绝对安装边。若 peer 边与安装边矛盾或形成环，就丢弃，但逐个报告 dropped edge，供发布者判断是否预期；这不构成对任意 npm 版本安装行为的保证。
- 最终顺序还会逐条检查所有安装边都在消费者之前；混合 peer/安装环导致无法满足时，整次 verify 报错。
- 平局按包名排序，保证确定性。
- `@deepseek-ai/dsh` 还有 publication prerequisite：Official on-demand bundles 必须先于它发布；这些不是它的安装依赖，但安装后会按名提供。
- Official on-demand prerequisite 必须存在于当前 dsh 公开发布 family；缺失时 `publishOrder` 拒绝。provider 即使反向声明 dsh peer，也仍先于 dsh 发布，该反向 peer 边进入 dropped list。依据：`deepseek-harness/scripts/release/families.ts:269-285,398-401@687f282e`；`deepseek-harness/scripts/release/families.spec.ts:254-267@687f282e`。
- `devDependencies` 不参与发布排序；排序器只读取 dependencies/optionalDependencies 与 peerDependencies。这不意味着打包会删除 manifest 的 devDependencies 字段。依据：`deepseek-harness/scripts/release/families.ts:26-35@687f282e`；`deepseek-harness/scripts/release/families.spec.ts:372-385@687f282e`。

依据：`deepseek-harness/scripts/release/families.ts:93-141@687f282e`、`:185-271@687f282e`、`:387-397@687f282e`；`scripts/release/verify.ts:17-43@687f282e`。

**完成信号**：`release:verify` 在 PR 上就打印 `1..N` 的完整顺序及所有 dropped peer edge；`pack` 把这个顺序写入 pack 目录的 `publish-order.txt` 文件，publish 只按该文件逐项处理。

**packed 目录的证据链**：`readPublishOrder` 只读 `publish-order.txt`（按换行切分、过滤空行）；`packedIdentity` 从 tarball 内的 `package/package.json` 读取 `name`/`version`，不读 checkout；`tar` 以 tarball 所在目录为 cwd，避免 GNU tar 把 Windows 盘符冒号解释成 remote host。`process.ts` 的 `capture` 对非零退出立即抛错并附 stdout/stderr，`attempt` 只返回退出码/流而不判定，`runConcurrent` 用继承流并发等待，`pnpmCommand` 优先复用当前 pnpm 的 JS 入口以避免 Windows `.cmd` shim，并拒绝把参数交给 npm/yarn。依据：`deepseek-harness/scripts/release/tarball.ts:1-63@687f282e`；`scripts/release/process.ts:1-129@687f282e`。

**失败处理**：安装边成环是代码/依赖缺陷，必须先修 manifest；peer 边被丢弃不是失败，但必须在发布记录里解释新增丢弃；顺序覆盖数不等于成员数时 verify 直接失败。

### 2.2 tarball payload 政策

- dsh family：`validateTarballPayload` 拒绝任何 `src`、`src/**`、`*.d.ts.map`、`*.js.map`。理由是发布后的 source map 无法解析回源，源目录也不应进入运行时包。依据：`deepseek-harness/scripts/publication-payload.ts:1-55@687f282e`；`scripts/release/families.ts:376-380@687f282e`。
- vendor family：保留上游 payload，包括 `src`。`vendor/cordis` 的 export map 声明 `"./src/*"`，删掉 `src` 会让消费者解析到不存在的文件；这里只要求 tarball 非空。依据：`deepseek-harness/scripts/release/families.ts:421-438@687f282e`；同 Note `:77-80@687f282e`。
- packed manifest 的 `name`/`version` 必须与源成员一致。dsh 还要求 packed 的 `dependencies`/`optionalDependencies`/`peerDependencies` 中所有 `@deepseek-ai/dsh*` 范围**精确等于**本版本，防止发布出指向别版本的运行时图。依据：`deepseek-harness/scripts/release/families.ts:331-365@687f282e`。

**【迁移设计】** 把“哪些文件允许发布”做成 family 级策略函数，而不是散落在工作流 grep；payload 政策必须能对单包单独测试。迁移到别的 registry 时，source/map 政策可保留，但 `workspace:` 改写和 peer 语义要按目标包管理器重新验证。

来源：deepseek-harness/scripts/release/families.ts:93-438@687f282e
来源：deepseek-harness/scripts/publication-payload.ts:1-55@687f282e
来源：deepseek-harness/scripts/release/verify.ts:1-110@687f282e
来源：deepseek-harness/scripts/release/tarball.ts:1-63@687f282e
来源：deepseek-harness/scripts/release/process.ts:1-129@687f282e

<a id="workspace-version-ranges"></a>
### 2.3 dsh 家族版本一致性与 workspace 范围

**【源义务】** `constraints` 不是“包形状检查”的附带项，而是 dsh 发布版本线的静态门：

- `checkDshFamilyVersion` 按**名字**判定：任何被扫描的 workspace manifest，名称为 `@deepseek-ai/dsh` 或以 `@deepseek-ai/dsh-` 开头，`version` 必须等于 workspace root 的 `version`。目录位置不豁免，因此 `packages/`（公开、私有、实验）、`apps/` 与根 manifest 都在边界内；vendor 与 native 留在各自版本线。这正是 `release:dsh` 写入的边界。
- root version 必须是 `X.Y.Z` 或带预发布段的 `X.Y.Z-<prerelease>`。
- `checkWorkspaceProtocol` 按**依赖目标**决定范围，而不是按消费者目录：dsh 目标必须 `workspace:*`；`vendor/` 或 `native/system` 家族目标必须 `workspace:~`；其他 workspace 目标必须使用 `workspace:` 协议。手写 `^0.0.1` 在 `pnpm pack` 时不会被替换，可能发布一个不存在的版本。
- `workspace:~` 打包时替换为目标当前版本（例如 Cordis `4.0.3` → `~4.0.3`），因此 vendor/native 的补丁可被消费者接收，但仍要求同一 minor；dsh 的 `workspace:*` 保持精确。vendor/native 补丁必须保持消费者 API 与二进制接口。
- `constraints` 在 `ci-static`、`ci-primary`、`hygiene` 的零构建静态 lane 与发布 lane 运行；发布 lane 的 `verifyVersions` 仍检查发布成员集一致，二者是不同快照上的互补检查。

依据：`deepseek-harness/.agents/notes/archived/process/2026-09-03-workspace-version-coherence-gate.md:1-30@687f282e`；`.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md:1-28@687f282e`；`scripts/check-workspace-constraints.ts:407-427@687f282e`、`:573-644@687f282e`；`scripts/check-workspace-constraints.spec.ts:51-100@687f282e`、`:259-287@687f282e`；`scripts/run-gates.ts:373-375@687f282e`、`:789-795@687f282e`。

**失败处理**：版本漂移会在静态 lane 失败并给出 manifest、期望 root 版本与实际版本；范围错误会给出 section、依赖名、期望范围与实际范围。修正 manifest 后重新运行 `pnpm run constraints`，不要删除静态 gate 或只在发布 lane 补救。**关键限制**：静态 gate 只观察本次触发的快照，不能阻止 stale-base merge；要求 base 最新或使用 merge queue 是仓库设置，不在脚本内。源内未执行真实发布，vendor/native 的 API/二进制兼容仍由真实补丁测试与评审证明。

**【迁移设计】** 把版本线写成按名字判定的单一纯函数，把范围规则写成按依赖目标判定的纯函数；不要让目录列表决定哪一个 package 属于哪条版本线。迁移到非 pnpm 包管理器时，`workspace:` 协议、`~` 替换和 lockfile 行为都要重新验证。

来源：deepseek-harness/.agents/notes/archived/process/2026-09-03-workspace-version-coherence-gate.md:1-30@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md:1-28@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:407-427@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:573-644@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.spec.ts:51-100@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.spec.ts:259-287@687f282e
来源：deepseek-harness/scripts/run-gates.ts:373-375@687f282e
来源：deepseek-harness/scripts/run-gates.ts:789-795@687f282e
来源：deepseek-harness/scripts/release/verify.ts:1-110@687f282e

<a id="published-dependency-faces"></a>
### 2.4 发布依赖面：section 分类与双版本安装布局

**【源义务】** 发布 tarball 的依赖 section 由**发布面**决定，不是由源码目录或统一规则决定：

- **选择范围**：`packages/client/` 下的包与声明 `dsh.client` 的包属于 Client/Host；仅声明 `"./client"` 导出不构成依赖策略选择。目录外的 `dsh.client` 也选中 Client/Host；Host-only 包由显式 `hostPackages` 列表加入。`clientFaceInclude`/`clientFaceExclude` 只处理已评审例外，验证器拒绝未知、陈旧、冗余、重复、重叠或无效项。
- **导出分类**：每个被覆盖 Host 入口的运行时 workspace 导出必须归入三类之一：整包 `duplicateSafePackages`、精确导出 `safeHostDependencyExports`、或整包 peer `peerRequiredHostExports`。未分类导出给出一条 `path:line:column` 诊断并阻断 `--fix`；同一导出不能同时属于 safe 与 peer-required。
- **section 规则**：`@deepseek-ai/cordis` 必须同时出现在匹配的 `peerDependencies` 与 `devDependencies`。Host 运行时值导入归 `dependencies`；peer-required 的 Host 包边在两个 section 保留同范围。Client bundle、类型导入、module augmentation、`dsh.client.inject` 与既有 metadata-only peer 归 `devDependencies`。browser-only 第三方构建输入归 `devDependencies`；Host 运行时值导入优先。
- **范围与修复**：dsh 目标用 `workspace:*`，vendor/native 目标用 `workspace:~`；所有 workspace 运行时依赖不得停留在错误的 section 或 `peerDependenciesMeta` 的无匹配条目。`--fix` 只有在零 policy violation 时写 manifest，随后刷新 `pnpm-lock.yaml`、生成两种语言的 module graph 与配对记录；有违规时一个文件都不写。
- **双版本安装布局**：`verify-npm-install-layout` 用两个互不兼容的合成 DSH 版本（`0.1.0`/`0.2.0`）替换工作区 release，调用 npm 只生成 package lock，然后要求：每个 DSH 包按版本隔离在预期路径；两个 release 的包名集合相等；每个 release 恰有一个共享 Cordis 安装；消费者的 DSH 依赖边解析到同一 release；不出现 `react`/`react-dom` 这类浏览器构建输入；npm 不请求任何 package archive。可选平台包在本地索引不可用时报告但不失败。
- **预算**：双版本图的解析工作量 = 每个 release 的包数 × 检查的内部边数，不得超过 `MAX_RESOLUTION_WORK_UNITS`（当前 875000）。新增 peer relay 必须重新测量，并在 `scripts/verify-npm-install-layout.ts` 显式提高预算；benchmark 是诊断证据，不是 release-time 性能承诺。
- **工作流位置**：`release.yml` 的 pack job 在打包前运行 `verify-package-dependencies` 与 `verify-npm-install-layout`；静态 lane 也运行 `verify-package-dependencies`。因此错误的 section 或 peer relay 在产生 tarball 前失败。

依据：`deepseek-harness/.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:1-97@687f282e`；`scripts/package-dependency-policy.ts:1-105@687f282e`；`scripts/verify-package-dependencies.ts:1-105@687f282e`、`:157-212@687f282e`、`:593-659@687f282e`、`:694-749@687f282e`、`:807-853@687f282e`、`:967-1038@687f282e`；`scripts/verify-npm-install-layout.ts:1-275@687f282e`；`.github/workflows/release.yml:80-88@687f282e`。

**完成信号**：`verify-package-dependencies` 零违规并打印 package 角色计数；`verify-npm-install-layout` 打印每个 release 的 DSH 包数、内部边数、work unit 预算与共享 Cordis 结论。**失败处理**：未分类导出 → 先补显式分类，不要用 `--fix` 掩盖；section/范围错误 → 按诊断修正 manifest；布局跨 release 或额外 Cordis → 修依赖选择/分类，不要放宽断言；超预算 → 测量新图并决定是否接受更高的解析成本。**关键限制**：分类表是人工评审决策，不自动证明运行时值可跨安装共享；布局探针只证明 npm 的包路径/版本解析，不证明插件实际加载，也不证明真实 registry 的安装体验。

**【迁移设计】** 先把发布面与依赖 section 分类写成可审阅的显式表，再用纯函数生成期望 section；布局探针作为独立、确定性的检查，不要把它变成 wall-clock CI 门槛。迁移到不自动安装 peer 的包管理器时，peer 分类与布局断言必须重新设计。

---

来源：deepseek-harness/.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:1-97@687f282e
来源：deepseek-harness/scripts/package-dependency-policy.ts:1-105@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:1-105@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:157-212@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:593-659@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:694-749@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:807-853@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:967-1038@687f282e
来源：deepseek-harness/scripts/verify-npm-install-layout.ts:1-275@687f282e
来源：deepseek-harness/.github/workflows/release.yml:80-88@687f282e
来源：deepseek-harness/scripts/run-gates.ts:373-375@687f282e
来源：deepseek-harness/scripts/run-gates.ts:789-795@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:1-50@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md:1-40@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1-207@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:345-999@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1039-1061@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1135-1211@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1241-1246@687f282e

<a id="npm-rehearsal"></a>
## 3. npm 的“无凭据打包预演”与“人工发布”分界

### 3.1 pack 预演（每个 PR / master push）

**【源义务】** `release.yml` 与 `release-vendor.yml` 在 `pull_request`、`push: master` 和 `workflow_dispatch` 上运行，权限只有 `contents: read`，不接触 registry 凭据。pack job：

1. `checkout` 必须 `fetch-depth: 0`，因为 release 脚本要读 tag；`persist-credentials: false`。
2. `pnpm install --frozen-lockfile`。
3. `release:verify --family dsh`：版本基线、发布顺序、tag 命名在**构建前**先算；安装边成环要在写 tarball 前失败。
4. 构建：PR 用 `pnpm run build:artifacts --profile official`，master 用 `pnpm run build:official`；dsh 还会检查 official client build record。
5. `release:pack --family dsh --out dist/npm --concurrency 8`。并发 8 仅限预演；正式发布工作流不加该 flag，保持严格串行。
6. 为验证额外打包 vendor 与 Landlock entry：harness 包把 vendor 当 peer，但 PR 可能同时 bump 两个 family 且都未发布，所以不能依赖 registry；Landlock entry 是 `dsh-sandbox-local` 的普通运行时依赖，但其平台包是 optional、需要 musl 逐架构构建，故只打包 entry。
7. `release:verify-packed-install` 只从 `--from` 安装所有 tarball，外部依赖才走 registry；在临时 consumer 内用 plain Node 驱动 `dsh --version`，并验证默认产品图中不含 experimental 包。
8. 只上传 `dist/npm/*`（dsh 自己的 tarball）；vendor/Landlock 只用于验证，不进入发布 artifact。

依据：`deepseek-harness/.github/workflows/release.yml:1-180@687f282e`；`scripts/release/verify-packed-install.ts:1-126@687f282e`；`scripts/release/installed-product-isolation.ts:1-73@687f282e`。

**packed-install 证明什么**：`files` 选出了完整 payload，且发布后的依赖范围能解析并启动。它**不证明**交互行为、完整工作区或安装后升级。临时 consumer 使用自己的 npm cache，设置隔离的 `DSH_HOME`/`DSH_AGENTS_HOME`，删除 `NODE_OPTIONS`/`NODE_PATH`，并在结束时删除整个 consumer；`--omit=optional` 是刻意选择。依据：`deepseek-harness/scripts/release/verify-packed-install.ts:28-62@687f282e`、`:86-121@687f282e`。

**失败处理**：pack 预演失败阻止合并/发布准备；不要用“registry 已有匹配版本”掩盖跨 family 未发布的问题；packed-install 失败先看 `npm --loglevel=http` 诊断，区分外部依赖失败与自家 tarball 缺失。

### 3.2 正式发布（manual-only，从 tag dispatch）

**【源义务】** `release-publish.yml` 和 `release-vendor-publish.yml` 只有 `workflow_dispatch`，**不监听** `pull_request`/`push`，因此永远不会出现在 PR check 面板。发布必须从对应 tag 手工触发：

1. `checkout` 同样 `fetch-depth: 0`、`persist-credentials: false`。
2. `pnpm install --frozen-lockfile`。
3. `RELEASE_PUBLISH=true pnpm run release:verify --family <dsh|vendor>`：除版本/顺序外，还要求所有成员非 private、`GITHUB_REF` 是 `refs/tags/...`、tag 属于该 family 前缀、且 tag 精确等于某个成员的 `<prefix><version>`。
4. 重新构建（`build:official` 或 `build:lib:host`）并重新 pack；**发布上传的是本次 dispatch 产生的字节**，不是 PR 预演 artifact。
5. 发布 job `needs: pack`，只做 checkout + `pnpm install --frozen-lockfile --ignore-scripts` + 下载 `dsh-npm-tarballs`/`vendor-npm-tarballs`，不构建。
6. `environment: npm-publish` 提供人工审批与允许 tag 策略；`concurrency.group: Release-publish` 且 `cancel-in-progress: false`，所有 family 共享同一注册表写锁。
7. `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`；若仓库采用 npm OIDC，`id-token: write` 等需按目标 registry 单独配置。

依据：`deepseek-harness/.github/workflows/release-publish.yml:1-131@687f282e`；`release-vendor-publish.yml:1-126@687f282e`；`scripts/release/verify.ts:45-110@687f282e`。

**审批信任边界**：required reviewers、允许部署的 tag、environment secret 都在 GitHub environment 设置里，**不在仓库文件中**。源码只能证明 workflow 引用了 `npm-publish`，不能证明审批人数量、是否禁止自审、tag 策略是否真实启用。必须把这一项标为“仓库外配置，需在目标仓库核对”。

**完成信号**：publish 日志逐包给出 `[i/N] name@version published` 或 `already published, skipping`；最终汇总 `published`/`already present` 数；`npm view` 的 integrity 与本地 tarball 一致。

来源：deepseek-harness/.github/workflows/release.yml:1-180@687f282e
来源：deepseek-harness/.github/workflows/release-vendor.yml:1-107@687f282e
来源：deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e
来源：deepseek-harness/scripts/release/installed-product-isolation.ts:1-73@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:111-140@687f282e
来源：deepseek-harness/.github/workflows/release-publish.yml:1-131@687f282e
来源：deepseek-harness/.github/workflows/release-vendor-publish.yml:1-126@687f282e
来源：deepseek-harness/scripts/release/verify.ts:45-110@687f282e
来源：deepseek-harness/scripts/release/publish.ts:122-235@687f282e
来源：deepseek-harness/scripts/ci-workflow.spec.ts:1401-1515@687f282e

<a id="rehearsal-runner-trust"></a>
### 3.3 发布预演的持久 Linux runner 信任边界

**【源义务】** 发布预演本身不需要 registry/API 凭据，但把任意 PR 代码或未清理的 checkout 放到持久共享 host，会把不可信代码引入持久信任域，并让 packed-payload 证明退化。源对 `release.yml` 两个 job 与 `release-vendor.yml` 的 pack job 采用同一套条件：

- 只有 writer-controlled 仓库变量 `DSH_CI_FAILOVER_LINUX=selfhosted` 才选择自托管 Linux 池；否则（包括变量未设、值不是 `selfhosted`）回退 `ubuntu-24.04`。
- 自托管选择要求 canonical repository 与非 Dependabot actor；事件只允许 master push，或同仓、非 fork、作者非 Dependabot 的 PR。manual `workflow_dispatch` 始终 hosted；其他被拒绝的上下文也 hosted。
- runner labels 是 `[self-hosted, linux, x64, vm-backup]`；注册共享一台 VM，不假设独立机器容量。Node 编译缓存、node-gyp header、pnpm setup 目标放在 runner 私有临时卷，pnpm 目标用 run/attempt/job 限定；`TMPDIR` 指向 `runner.temp`。
- 持久 pnpm store 留在 checkout 清理之外；只有 hosted runner 恢复远程 store cache；预演 workflow 不保存远程 cache。checkout 在 immutable install/现有 build 前显式清理 ignored 与 untracked 输出；完整 tag 历史、pack 并发、依赖检查、tarball 验证与 artifact retention 不变。
- packed-install verifier 在 checkout 外创建新 consumer，删除继承的 Node resolution hook，并在 `finally` 删除 consumer；暖 pnpm store 不能替代 workspace link 或旧构建产物。
- 两个 manual publish workflow 保持完全 hosted，不获得凭据或 registry 变更；该机制没有自动 runner 健康检测，也不迁移已排队 job。

依据：`deepseek-harness/.agents/notes/archived/process/2026-09-06-release-rehearsal-selfhosted.md:1-28@687f282e`；`.github/workflows/release.yml:1-180@687f282e`；`.github/workflows/release-vendor.yml:1-107@687f282e`。

**失败处理**：变量/actor/event 不满足 → 该 job 回 hosted，不要手工改 runner label 绕过；checkout 清理缺失或继承 Node hook → packed-install 失败，先修清理/隔离，不要用暖 store 或旧 build 产物补证据；共享 VM 竞争不是失败，但会延长排队/执行时间。**关键限制**：selector 测试不等于真实 release build/packed-install 执行；仓库 writer 对进入持久信任域的代码负责，共享 VM 仍可能与其他可信 job 竞争。

**【迁移设计】** 默认 hosted 并保留回退；self-hosted 只对 writer-controlled 变量 + 可信事件开放；临时目录/缓存/pnpm store 必须按 run 隔离；发布 workflow 永远不进入持久 host。

---

来源：deepseek-harness/.agents/notes/archived/process/2026-09-06-release-rehearsal-selfhosted.md:1-28@687f282e
来源：deepseek-harness/.github/workflows/release.yml:1-180@687f282e
来源：deepseek-harness/.github/workflows/release-vendor.yml:1-107@687f282e

<a id="npm-registry"></a>
## 4. 注册表三态、重试与可恢复发布

### 4.1 三态决策

对每个 tarball，发布脚本先读 `npm view <name>@<version> dist.integrity --json`：

| 注册表状态 | 动作 |
| --- | --- |
| 没有该版本 | `npm publish` |
| 有该版本，且 `dist.integrity` 等于本地 tarball 的 `sha512-<base64>` | 跳过，计入 `already present` |
| 有该版本，但 integrity 不同 | 失败，报告“内容变了但没有 bump” |

依据：`deepseek-harness/scripts/release/publish.ts:1-29@687f282e`、`:122-157@687f282e`、`:195-228@687f282e`。

这个规则让“同一 artifact 重跑”幂等，同时抓住最危险的静默错误：版本没变、字节变了。它依赖“同一提交重打包字节可复现”；源 Note 明确说这是**假设，尚未测量**，若构建嵌入绝对路径或时间戳，重跑会误报失败。迁移时必须先测字节可复现性，或退回逐文件 hash 比较。依据：`deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:181-186@687f282e`。

### 4.2 重试与 backoff

- 每次发布尝试之间至少间隔 2 秒；连续发布会跑赢 registry 的 packument 提交，产生 `E409 Failed to save packument`。
- 每个 tarball 最多 4 次尝试；退避为 2s、4s、8s。
- 只对 `E409/E429/E500/E502/E503/E504/ETIMEDOUT/ECONNRESET/EAI_AGAIN` 重试；`E403`、manifest 格式错误等永久失败立即抛出。
- **每次重试前重新读注册表**：报告失败可能其实已经写入；若该版本现已存在且 integrity 等于本地，算成功继续，不重复上传。
- 只跳过时不等待；间隔只发生在真正 publish 之间。

依据：`deepseek-harness/scripts/release/publish.ts:30-45@687f282e`、`:159-193@687f282e`。

### 4.3 部分发布与恢复

**【源义务】** 发布顺序保证“中断只留下一个前缀”：前面的包不会依赖后面尚未出现的包，因此部分发布的已上传部分仍可安装。恢复时用同一 tag 重跑；三态会跳过已落地且一致的包，从第一个缺失包继续。依据：`deepseek-harness/scripts/release/families.ts:185-202@687f282e`；`scripts/release/publish.ts:195-228@687f282e`。

**已知不对称**：`latest` 是可变 dist-tag。用旧 artifact 重跑，可能把 `latest` 移回旧稳定版；源把预演固定在预发布版本以避免该问题。迁移时要么禁止对旧 artifact 重跑稳定版，要么在发布前记录并核对 dist-tag。依据：同 Note `:183-185@687f282e`。

**失败处理**：
1. 先查 `npm view <pkg>@<version> dist.integrity`，不要直接重发。
2. 已存在且一致 → 跳过；已存在且不一致 → 只能 bump，不可删/覆盖。
3. tag 指向错误提交 → 不要移动已发布 tag；从正确提交重新 bump/打新 tag。
4. 发布中断 → 不改变 `publish-order.txt`，不手工挑包；重跑完整命令。

**证据限制**：脚本不原子预留 dist-tag；外部发布者可在检查后改变绑定。release manager 仍需协调并核对最终 `npm dist-tag ls`。

---

来源：deepseek-harness/scripts/release/publish.ts:1-235@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:96-125@687f282e
来源：deepseek-harness/scripts/release/families.ts:288-374@687f282e

<a id="native"></a>
## 5. native/system 发布序列

### 5.1 触发与构建矩阵

**【源义务】** `node-addon-system.yml` 在 `native/system/**`、两个相关 workflow、根 `package.json`、lockfile、workspace 文件的 PR 和 master push 上运行，且有 `workflow_dispatch`。`node-addon-system-release.yml` 只有 `workflow_dispatch`，输入 `publish` 决定是否发布。

发布工作流：

1. `matrix` 用 `scripts/github-matrix.mjs release-prebuild` 生成 prebuild 矩阵。
2. `build-prebuilds` 在矩阵 runner 上 `pnpm install --filter @deepseek-ai/node-addon-system-workspace... --frozen-lockfile`，装 musl 工具链，`pnpm build:native`，用 `verify-launcher-binary.mjs` 检查二进制元数据，再 `build:ts`、`build:test-oracle`、`test:flock`、`test:packaging`，上传每个平台 artifact。
3. `pack` job 重新检出，`verify-release.mjs` 验证所有已发布包共用一个版本；当 `RELEASE_PUBLISH=true` 时，`GITHUB_REF` 必须以 `refs/tags/node-addon-system-v` 开头，且 tag 版本等于包版本。下载所有 prebuild，`assemble-prebuilds.mjs` 组装，`verify-release.mjs --prebuilds` 检查每个平台二进制存在且格式/架构正确，`pack-release.mjs` 打包，`verify-packed-install.mjs` 安装；`NALR_REQUIRE_LANDLOCK=1` 让 Linux 上未启用 Landlock 的内核失败而不是跳过。
4. `publish` job 只有 `inputs.publish` 为真才运行，`needs: pack`，`environment: npm-publish`，`permissions: id-token: write`，只下载 `npm-tarballs`。它调用 `scripts/publish-release.mjs`，该脚本读取 `publish-order.txt`，但对每个 tarball 先从包内 `package.json` 取 `name/version`，再查 registry：不存在 → 发布；存在且 `dist.integrity` 与本地 `sha512` 相同 → 跳过；存在但不同 → 失败并提示 bump。预发布版本加 `--tag next`，稳定版本不传 tag；不传 `--access`；连续发布间隔 2 秒；`E409/E429/E500/E502/E503/E504/ETIMEDOUT/ECONNRESET/EAI_AGAIN` 最多 4 次、退避 2/4/8 秒，且每次重试前重读 registry；若写失败但 registry 已出现同 integrity，视为已落地。

依据：`deepseek-harness/.github/workflows/node-addon-system.yml:1-170@687f282e`；`node-addon-system-release.yml:1-188@687f282e`；`native/system/scripts/verify-release.mjs:1-54@687f282e`；`native/system/scripts/publish-release.mjs:1-165@687f282e`。

### 5.2 CI 必须证明“同一批字节在多个 Node 上可用”

**【源义务】** 每个平台 job 构建一次，然后对**同一批二进制**测试 Node 24、20、22、26；Linux 还要在无编译器的 `node:24-alpine`、`node:20-alpine`、`node:22-alpine` 容器中测试 musl addon。pack 预演使用当前平台 pack → install → confine；Landlock 内核不满足时整个 leg 失败，不能 skip。

**责任者**：native 维护者（矩阵/脚本）；发布者（版本、tag、dispatch、审批）；release manager（注册表完成核对）。

**完成信号**：`verify-release.mjs --prebuilds` 打印每个平台验证的二进制数；`verify-packed-install.mjs` 成功；发布日志逐包 published/skip；tag 与版本精确一致。

**失败处理**：平台缺二进制 → 重新构建该 artifact，不要手工补文件；`tag/version mismatch` → 修正 tag 或 manifest，不能带着不匹配发布；注册表已有同版本不同字节 → bump，不可覆盖；Landlock 内核不支持 → 该 Linux leg 失败是预期，需换合格内核或明确记录不可发布。

**例外**：`publish` 不传 `--access`，访问级别由各包 `publishConfig` 决定；预发布版本的 dist-tag 由包脚本/工作流决定，源内没有统一覆盖。

**证据限制**：真实 npm provenance/OIDC 需要 `id-token: write` 与 registry 信任配置；仓库外设置不可见。`publish-release.mjs` 只证明脚本行为：它不校验 tag、不查 dist-tag 占用、不比较 git 历史；这些仍由 pack job/workflow 与人工核对承担。真实发布未执行。

### 5.3 打包、组装与安装预演的硬条件

`github-matrix.mjs` 只从 `packages/<name>/prebuilds.json` 派生矩阵；平台到 runner 的映射是固定表（`linux-x64`→`ubuntu-24.04`、`linux-arm64`→`ubuntu-24.04-arm`、`darwin-x64`→`macos-15-intel`、`darwin-arm64`→`macos-latest`），未知平台直接失败。新增平台包因此同时扩展 CI 与 Release，不需要在两个 workflow 里再写条件分支。`assemble-prebuilds.mjs` 要求每个平台恰好一个 `prebuild-<package>` artifact；缺失、额外、或目标 `bin/` 下声明的二进制缺失/格式/架构不符都会失败；`static-musl` 二进制补 `0755`。依据：`deepseek-harness/native/system/scripts/github-matrix.mjs:1-69@687f282e`；`native/system/scripts/assemble-prebuilds.mjs:1-54@687f282e`。

`pack-release.mjs` 先平台包、后 entry 包，按该顺序把 tarball 名写入 `publish-order.txt`；平台包用 `npm pack`、entry 用 `pnpm pack`，两者都产生 publish 将上传的 tarball 并运行包自己的 `prepack` gate，所以缺二进制或未构建 `lib/` 在这里就拒绝。`--current-platform-only` 只用于每架构 CI leg（本机平台包 + entry）；`GITHUB_REPOSITORY` 存在时只把 workflow repository 元数据投影到临时 staging 的 manifest，源 manifest 保留公开 source home，staging 完成后删除。依据：`deepseek-harness/native/system/scripts/pack-release.mjs:1-118@687f282e`。

`verify-packed-install.mjs` 进一步检查：

- 全平台 tarball 存在（除非 `--current-platform-only`）；packed entry 的 `optionalDependencies` 名称集合恰好等于所有平台包名。
- 所有 packed manifest 不含 `preinstall`/`install`/`postinstall`/`prepare` lifecycle，也不含 `workspace:` 范围；这个家族故意没有 install fallback。
- 在仓库外临时 consumer 只用本地 tarball `npm install --offline`；本机平台二进制逐文件 SHA-256 与 workspace 构建 byte-pin。
- 驱动已安装 entry（不是源码）：解析必须落在平台包内；Linux 上探测 Landlock，并在可执行时做“拒绝写 + 允许写”的真实 confinement world-proof；`NALR_REQUIRE_LANDLOCK=1` 时 probe 为 `unusable` 直接失败。非 Linux 验证 launcher 不存在且 probe 为 `unusable`。
- POSIX 上验证 flock 排他、关闭释放；临时 consumer 与锁目录最终删除。

依据：`deepseek-harness/native/system/scripts/verify-packed-install.mjs:1-238@687f282e`。

**完成信号**：`assemble` 打印各平台二进制数；`pack` 打印包数并写 `publish-order.txt`；`verify-packed-install` 打印 byte-pin、world-proof、flock 成功。

**证据限制**：这组 helper 只做源码审阅，未执行；byte-pin 只覆盖本机平台，其他平台由各自 CI leg 证明；不证明 registry 安装后的真实消费者行为。

---

来源：deepseek-harness/.github/workflows/node-addon-system-release.yml:1-188@687f282e
来源：deepseek-harness/.github/workflows/node-addon-system.yml:1-170@687f282e
来源：deepseek-harness/native/system/scripts/verify-release.mjs:1-54@687f282e
来源：deepseek-harness/native/system/scripts/publish-release.mjs:1-165@687f282e
来源：deepseek-harness/native/system/scripts/github-matrix.mjs:1-69@687f282e
来源：deepseek-harness/native/system/scripts/assemble-prebuilds.mjs:1-54@687f282e
来源：deepseek-harness/native/system/scripts/pack-release.mjs:1-118@687f282e
来源：deepseek-harness/native/system/scripts/verify-packed-install.mjs:1-238@687f282e

<a id="python"></a>
## 6. Python SDK/runtime 的 PyPI 序列

### 6.1 构建六个 wheel

**【源义务】** `python-release.yml` 的 `build` job 调用 `build-exe-for-python-sdk.yml`，固定 `targets: node24-linux-x64,node24-linux-arm64,node24-macos-arm64,node24-macos-x64,node24-win-x64`、`release: true`。builder：

- `build-exe-for-python-sdk.yml` 的 `targets` 输入为空时构建全部五个受支持目标；直接调用 builder 且不给 `--targets` 时只构建 host（见 6.1b）。
- 每个目标生成 runtime wheel 和 shared SDK wheel；macOS 用 `macos-15-intel` 跑 x64、`macos-latest` 跑 arm64，Windows 用 `windows-2025`，Linux arm64 用 `ubuntu-24.04-arm`。
- 平台 wheel 名称固定：`manylinux_2_28_{aarch64,x86_64}`、`macosx_14_0_{arm64,x86_64}`、`win_amd64`。
- 在干净 venv 安装本地 SDK + runtime wheel，跑 `smoke-python-runtime.py --scenario all --installed-wheel`；发布路径（`release: true`，`ci` 未开）只跑 keyless black-box，不跑 live API。安装前 harness 先做 installed-artifact identity：进程必须在 venv 内、cwd 在仓库外、`PYTHONPATH` 与 `DSH_RUNTIME_MODE` 未设置；拒绝源码/editable 导入、SDK 与 runtime 版本不等、SDK 未精确 pin runtime、可执行文件在 runtime wheel 外或不在 distribution records 中。该身份检查在第一个模型请求前完成，行为通过不能掩盖错误的代码来源。keyless 场景覆盖默认 profile、patch overlay、外部 bundle、持久 PTY/editor、PTC Node、ripgrep 搜索、stdio MCP、快照、Zstandard 持久化、JSON-RPC 与重启；live 场景另跑真实模型。
- live API 只在可信同仓 PR 与 master push 运行：`DEEPSEEK_API_KEY_EXTERNAL` 只映射到 preflight 与 live step，preflight 为空即失败，不允许静默 skip；fork/Dependabot 跳过密钥步骤，禁止 `pull_request_target` 执行不可信代码。
- Windows x64 的 Python runtime 构建固定使用 hosted `windows-2025`；`DSH_CI_FAILOVER_WINDOWS=selfhosted` 只重定向 native Windows job，不重定向 Python runtime。Windows 的失败重试/自托管实验必须重新验证吞吐与故障复现，不能直接改路由。
- `ci` 输入控制是否跑 Python runtime CI 验证；PR/master 的 `ci` 调用（由 `ci.yml`/`ci-master.yml` 传入）才启用 live API 条件。`release` 为真时 macOS 使用更大的 release runner，`cancel-in-progress` 为 false，避免发布事务被并发取消。

依据：`deepseek-harness/.github/workflows/python-release.yml:25-44@687f282e`；`build-exe-for-python-sdk.yml:1-512@687f282e`；`scripts/smoke-python-runtime.py:802-893@687f282e`、`:1077-1138@687f282e`；`.agents/notes/implemented/testing/2026-08-23-installed-python-wheel-black-box-ci.md:1-51@687f282e`；`.agents/notes/implemented/process/2026-09-06-python-runtime-windows-hosted.md:1-25@687f282e`。

### 6.1a 单个 wheel 的构建自检（`build-python-release.py`）

**【源义务】** 工作流之外，构建脚本在 wheel 交给 `validate` 前先做单件 admission；任一项不符即抛错，不把“工作流会再检查”当替代：

- `--tag` 若给出，必须精确等于 `python-v<package.json version>`；仓库版本必须匹配 `X.Y.Z` 加可选预发布段。PEP 440 只映射 `a|b|c|rc|alpha|beta|pre|preview`，无法映射的预发布段直接失败；wheel 用 PEP 440 拼写，tag 用仓库拼写。
- 平台清单 `python/sdk-runtime/platforms.json` 必须是非空对象；每项必须恰好有字符串 `tag` 和 `executable`，没有额外键。runtime 文件名集合必须精确：Windows 为 `<exe>` 与去掉 `.exe` 的 `-rg.exe`；POSIX 为 `<exe>` 与 `-rg`，macOS 再加 `-spawn-helper`；同时复制同名资源目录。
- SDK staging 只复制 `python/sdk`，license 文件恰为 `LICENSE`，并把唯一一条 `deepseek-harness-runtime-bin==<version>` 依赖 pin 改到本版本；runtime staging 复制 `python/sdk-runtime`，license 文件恰为 `LICENSE` 与 `THIRD_PARTY_NOTICES.md`。
- 构建必须产出预期文件名：SDK 为 `deepseek_harness_sdk-<pep440>-py3-none-any.whl`；runtime 为 `deepseek_harness_runtime_bin-<pep440>-py3-none-<platform-tag>.whl`。脚本随后自检 wheel：单文件 ≤100000000 字节；`WHEEL` 的 `Tag` 列表恰好一个预期值；`METADATA` 的 `Version`、`Name`、`License-Expression: MIT`、`License-File` 列表全部匹配。
- runtime wheel 的 `deepseek_harness_runtime/runtime/` 顶层文件集合必须精确；调用 `_resources.py` 的 `validate_downloads()` 检查资源清单/哈希；非 Windows 的顶层可执行文件必须保留 executable bit。SDK wheel 不得包含任何 runtime 文件。

依据：`deepseek-harness/scripts/build-python-release.py:1-295@687f282e`。

**失败处理**：平台清单缺字段/多字段、wheel 名与 platform tag 不符、依赖 pin 不唯一、license 文件不符、runtime payload 多/少文件、POSIX 执行位丢失，都在上传前失败；不要用 `--no-verify` 或手改 wheel 绕过。

### 6.1b 可执行文件构建链的硬条件（`build-exe-for-python-sdk.ts`）

`build-python-release.py` 只负责把已存在的 executable 装进 wheel；executable 本身由 `build-exe-for-python-sdk.ts` 生成。该脚本的准入条件同样属于发布证据：

- target 必须是 `<nodeRange>-<platform>-<arch>`；platform 仅 `linux|macos|win`，arch 仅 `x64|arm64`，nodeRange 必须 `node<major>`；Windows 只支持 x64；空 target 列表、重复 `platform-arch` 都失败；缺省 target 取 host（Node 24）。
- `--skip-build` 与 `--build-artifacts` 互斥；`--dry-run` 只打印命令/文件变更；正常构建先跑 `verify-runtime-closure`，再 `pnpm run build`（或 `build:artifacts`），然后 `pnpm deploy --legacy --prod ...` 到 Python runtime 的 node carrier。
- staging 目录若包含 repo root 则拒绝清空；deploy 后恢复开发依赖，materialize 所有 staged links 并去重 workspace 包，保证 symlink-free；注入 pkg `bin`/assets/ignore，bundle helper imports，并检查 staged bootstrap 存在。
- 每个 target 单独 `pkg --sea`（SEA 一次只接受一个目标）；必须产出预期 executable；ripgrep sidecar 复制到 executable 旁（pkg 虚拟文件系统不能 spawn 内部 rg）；macOS 另复制 node-pty spawn-helper 并 chmod `0755`；资源目录写 `downloads.json`，identity 由 version/target/office/pnpm/primaryLock 哈希决定。
- Linux/Windows 必须在目标 host 上构建（脚本检查 target 与 host platform/arch 相等）；Windows 另外强制 x64；macOS 没有同等 host 断言，不能据此声称可任意交叉构建。
- 构建失败、缺产品、缺 ripgrep/spawn-helper、deploy 未产生 staged package 都会在上传前失败；`--skip-build` 只允许在 `lib/` 已由同一提交构建时使用。

依据：`deepseek-harness/scripts/build-exe-for-python-sdk.ts:1-622@687f282e`；`scripts/smoke-python-runtime.py:1-183@687f282e`、`:780-920@687f282e`、`:3010-3110@687f282e`。

**完成信号**：目标列表解析通过；`verify-runtime-closure` 成功；staged closure 无 symlink；每个 target 产出 executable、ripgrep（macOS 还有 spawn-helper）和资源目录；wheel 安装后的 keyless black-box 通过。

**证据限制**：builder 未执行；`--skip-build` 复用已有构建时，无法从脚本本身证明 `lib/` 来自同一提交，必须由 CI 的构建顺序或人工记录补足。macOS 的 host 断言弱于 Linux/Windows，交叉构建能力不能从本脚本推断。

### 6.2 验证与发布门

`python-compat` 在 Python 3.10 和 3.14 上安装本地 wheel，跑 `sdk-default` 与 `sdk-mcp` 两个场景。`validate`：

1. 用 `scripts/build-python-release.py` 的 `repository_version()` 和 `pep440_version()` 解析版本；wheel 版本是 PEP 440 拼写，tag 用仓库版本拼写（如 `0.0.1-rc.1` → `0.0.1rc1`）。
2. 若 `publish=true`，要求：`PYPI_PUBLISHER_REPOSITORY` 已设置且等于 `github.repository`；`PUBLIC_PYPI_RELEASE_ENABLED=true`；`github.ref_type=tag` 且 `github.ref_name=python-v<repository_version>`。
3. 下载全部 `deepseek_harness_*` artifact，精确比对六个 wheel 文件名（顺序固定、`diff -u`）；每个 wheel 必须小于 100,000,000 字节（public PyPI 默认上限）。
4. `twine check dist/*.whl`；生成排序后的 `SHA256SUMS`；上传 `python-release-<version>` artifact，保留 7 天。

依据：`deepseek-harness/.github/workflows/python-release.yml:45-184@687f282e`。

### 6.3 两个环境、顺序发布

**【源义务】** 发布拆成两个 job，且 SDK 依赖 runtime：

- `publish-runtime`：`needs: validate`，`environment: pypi-runtime`，`id-token: write`；下载 artifact，`sha256sum -c SHA256SUMS`，把 runtime wheels 移到 `dist/runtime/`，用 `pypa/gh-action-pypi-publish@release/v1` 发布。
- `publish-sdk`：`needs: [validate, publish-runtime]`，`environment: pypi`；再次校验哈希，把 SDK wheel 移到 `dist/sdk/` 后发布。
- 两个 job 都设 `attestations: false`。原因写在注释里：public attestations 会暴露私有 publisher repository；OIDC 认证仍开启，只是不上传该 repository 身份。
- SDK 放在依赖 job 中，是为了 runtime 已上传后若 SDK 失败，可以“re-run failed jobs”从 SDK 继续，而不尝试覆盖不可变的 runtime 文件。
- 两个 publication job 都不 checkout 源码、不重建 wheel；只消费同一次 `validate` 产生并校验过的 aggregate artifact。PyPI 上传不是原子的，已上传文件名不可替换；runtime-first 让 SDK 失败时留下“runtime 可用但 SDK 未发布”的可恢复状态，而不是一个指向缺失 runtime 的 SDK。
- Trusted Publishing 的身份包含私有 automation repository 的 owner/name、workflow 文件名，以及每个 job 的 environment（`pypi-runtime` / `pypi`）。仓库转移、workflow 改名或 environment 改名都必须同步更新 PyPI publisher 与 `PYPI_PUBLISHER_REPOSITORY`；只读 public mirror 不运行 release Actions，也不是 publisher 身份，改 mirror 只改变包的 metadata URL。
- Python 构建依赖固定 Hatchling 1.30.1；后续 Hatchling 会产出 Core Metadata 2.5，而固定的 Twine 6.2.0 validator 拒绝该版本。升级必须同时验证 metadata 与 Twine，不能只改一个构建依赖。

依据：`deepseek-harness/.github/workflows/python-release.yml:185-248@687f282e`；`.agents/notes/archived/process/2026-08-11-python-publication-workflow.md:1-52@687f282e`。

**完成信号**：两个 environment 均批准；`sha256sum -c` 成功；PyPI 上六个文件与 `SHA256SUMS` 一致；`pip install` 干净环境可运行 `sdk-default`/`sdk-mcp`。

**失败处理**：runtime 已发布但 SDK 失败 → 只重跑 `publish-sdk`；runtime 上传部分失败 → PyPI 不允许同版本覆盖，检查哪些文件已落地，必要时 bump；tag 不匹配 → 不要移动 tag，修正版本后重新 bump；`PUBLIC_PYPI_RELEASE_ENABLED` 未设置 → 这是显式发布开关，不是配置缺失可忽略。

**例外**：`python/`、`docs/`、`website/` 不是 npm release family 成员；它们可以有自己的发布路径，但不在 dsh/vendor/native 三序列内。

**证据限制**：`pypi`/`pypi-runtime` 的 required reviewers、trusted publisher 配置在 PyPI/GitHub 环境设置中，仓库不可见；`attestations: false` 是发布策略选择，不能据此推断供应链证明不存在。

---

来源：deepseek-harness/.github/workflows/python-release.yml:1-248@687f282e
来源：deepseek-harness/.github/workflows/build-exe-for-python-sdk.yml:1-512@687f282e
来源：deepseek-harness/scripts/build-python-release.py:1-295@687f282e
来源：deepseek-harness/scripts/smoke-python-runtime.py:802-893@687f282e
来源：deepseek-harness/scripts/smoke-python-runtime.py:1077-1138@687f282e
来源：deepseek-harness/.agents/notes/implemented/testing/2026-08-23-installed-python-wheel-black-box-ci.md:1-51@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-08-11-python-publication-workflow.md:1-52@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-06-python-runtime-windows-hosted.md:1-25@687f282e
来源：deepseek-harness/scripts/smoke-python-runtime.py:1-801@687f282e
来源：deepseek-harness/scripts/smoke-python-runtime.py:894-1076@687f282e
来源：deepseek-harness/scripts/smoke-python-runtime.py:1139-3110@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:1-622@687f282e
来源：deepseek-harness/.github/workflows/python-release.yml:25-44@687f282e

<a id="desktop-version"></a>
## 7. Desktop 的版本、产物与发布前验证

### 7.1 三个受支持目标与产物

Desktop 只发布三个目标：`mac-arm64`（darwin/arm64）、`mac-x64`（darwin/x64）、`win-x64`（win32/x64）。依据：`deepseek-harness/apps/desktop/scripts/desktop-upload-plan.ts:20-35@687f282e`。

一个 Desktop 发布包含：

- macOS：DMG 安装包、ZIP 更新包、ZIP blockmap、`latest-mac.yml` 类 feed 元数据；
- Windows：EXE 安装包、EXE blockmap、`latest.yml` 类 feed 元数据；
- 另有 `dsh-latest-<macos|windows>-<arch>.<dmg|exe>` 的“最新安装包”别名，可从固定 URL 直接下载。

feed 元数据必须恰好一个 target 文件；URL 由发布器改写为最终二进制路径；feed 的 `version` 必须等于构建版本。依据：`desktop-upload-plan.ts:210-294@687f282e`。

**【源义务】** Shell 与 runtime descriptor 是一起安装的，但版本/目标兼容的责任在**打包验证器**：descriptor schema、shell version、platform、architecture、声明的 Host protocol version，以及 Node/pnpm semver 都由打包侧校验。启动只读取 profile 准备需要的字段，Host ready 消息仍校验自己的 protocol；启动不再仅因 descriptor 的 release schema/target/Host protocol 不同，或 Node/pnpm 版本字符串不是 semver 就拒绝。不要重新引入启动期 release 比较，除非有具体安装故障是打包验证和 Host 诊断无法解释的；这类比较也不能证明已安装可执行文件字节与 descriptor 一致。依据：`deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-build-release-validation.md:1-24@687f282e`。

### 7.2 版本规则

**【源义务】** Desktop 构建版本可以不同于 manifest 中的产品版本：

- 生产发布：使用 manifest 版本，必须与 dsh 包版本一致。
- 测试构建：在产品版本后追加日期与序号，例如 prerelease 基座 `0.1.6-alpha.1.20260916.1`；稳定基座 `0.1.6-test.20260916.1`。
- 手工 Desktop CI 可用 UTC 日期、run number、attempt 组成 `.YYYYMMDD.run.attempt`，这些标识未发布构建，不是发布序列。
- 构建版本不能带 build metadata；electron-updater 用 `semver.gt` 与安装版本比较，build metadata 不参与优先级，两个构建会相等。
- 稳定版的测试后缀必须以 `test` 开头，且该形式低于稳定基座，因此只能进测试 feed，不能进生产 feed。
- 生产 tag 是 `desktop-v<version>`，与 npm 的 `dsh-v*` 不同。
- 发布版本是**参数**，不是 manifest 改写：`--build-version` 指定值，`--build-version auto` 提议当天下一个序号；该值经 `extraMetadata`、update feed 与 upload validation 作为同一输入。manifest 保持产品版本，打包不修改 tracked files，因此不会留下 dirty tree，也不会让 tag 指向被回滚的版本。
- 每个产物记录 `dshBuildCommit` 与 `dshBuildDirty`。生产上传在产物公开**之后**由操作者把打包 commit 打成 `desktop-v<version>` tag；dirty checkout 不打 tag；测试与本地构建刻意不打 tag。upload 从 completion record 读取已发布版本，而不是从变量重算。
- `--build-version auto` 即使在 `--check` 下也会访问目标 bucket 提议序号；只有目标 bucket 未配置或列表在 deadline 内无法完成时才退回本地输出目录，部分列表会被丢弃，以免复用序号覆盖已发布 installer。

依据：`deepseek-harness/.agents/notes/archived/process/2026-09-21-desktop-build-version-as-input.md:1-38@687f282e`；`.agents/notes/archived/process/2026-09-16-desktop-release-version-derivation.md:1-30@687f282e`；`apps/desktop/scripts/desktop-build-version.mjs:1-104@687f282e`；`apps/desktop/scripts/desktop-release-tag.ts:25-80@687f282e`；`apps/desktop/packaging/README.md:86-140@687f282e`。

**完成信号**：`validateDesktopBuildVersion` 返回规范 semver；packaging completion record 的 `version` 能通过同一校验；上传计划里的 `dshVersion == desktopVersion`。

**失败处理**：版本不扩展产品版本 → 修正；带 build metadata → 改用日期/序号；`latest` feed 收到 prerelease 版本 → 直接拒绝；产品版本不匹配 → 先 bump，不要改上传参数绕过。

### 7.3 发布前本地验证（不接触上传凭据）

`createDesktopUploadPlan` 在**任何网络上传前**：

1. 检查 target 受支持；
2. 读取根 `package.json` 与 Desktop `package.json`，要求版本一致；
3. 读取 completion record，要求 `schemaVersion=1`、`target` 匹配、channel/environment/publicUrl 与配置匹配；
4. 若 channel 是 `latest`，构建版本不得含 `-`；
5. feed 元数据必须存在、version 匹配、`files` 恰一个；
6. 更新文件与 blockmap/DMG/EXE 必须存在、非空，size 与 SHA-512 必须匹配 feed；
7. 生成 artifact 列表：macOS 为 DMG、ZIP、ZIP blockmap；Windows 为 EXE、EXE blockmap；feed 元数据带 `channelMetadata=true`，**排在最后**。

依据：`deepseek-harness/apps/desktop/scripts/desktop-upload-plan.ts:174-294@687f282e`。

**失败处理**：completion record 不匹配 → 重新打包，不要手改 record；hash/size 不匹配 → 产物损坏或被替换，重新构建；feed 多文件 → 生成逻辑错误，先修打包；`latest` 收到 prerelease → 改 channel 或版本。

### 7.4 手工打包工作流（macOS / Windows）

**【源义务】** `macos-package.yml` 与 `windows-package.yml` 都只 `workflow_dispatch`，输入 `preset`（test/production）、`source_ref`、`update_channel`（nightly/latest，latest 只接受稳定版本）、`version_mode`（default/product/auto/manual）、可选 `build_version`，以及 macOS 的 `skip_notarization` 或 Windows 的 `signing`（signed/unsigned）。打包前：

- `source_ref` 在 production 只能是 `master` 或 `dsh-v*` tag；tag 必须等于根 manifest 的产品版本且 checkout commit 等于 tag；test 允许仓库内分支或 tag，但拒绝 SHA 与 PR ref。
- 源码必须含 `desktop-ci-version.mjs` 的 `PACKAGE_VERSION_MODE` 适配，否则要求选更新的 release。
- 两个 workflow 各有自己的 `concurrency`（`macos-desktop-package`/`windows-desktop-package`），`cancel-in-progress: false`；Windows 先清空并校验 checkout 是 `RUNNER_WORKSPACE` 直接子目录且无 reparse point。
- 先 `--check` 打包配置，再构建；`retain-desktop-ci.ts` 把完整包保留到 checkout 外，artifact 名含 mode/signature/version/run/attempt，保留 14 天；Windows signed/unsigned 分开发布 artifact。
- `skip_notarization`/`unsigned` 只是内部调试开关，发布资格会拒绝；不能把未签名包当测试包混入。

依据：`deepseek-harness/.github/workflows/macos-package.yml:1-142@687f282e`；`.github/workflows/windows-package.yml:1-167@687f282e`。

**完成信号**：preset/source/版本校验通过；`--check` 与构建成功；retained package 目录存在，artifact 可下载且命名包含 mode/version/run/attempt。**失败处理**：source_ref 是 SHA/PR → 重新选分支或 tag；tag 与产品版本/checkout 不符 → 修正 tag，不改参数；缺适配脚本 → 换包含适配的 release；签名/公证开关不符合发布要求 → 重新打包，不能靠发布门补救。

来源：deepseek-harness/apps/desktop/packaging/README.md:86-140@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-build-version.mjs:1-104@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-upload-plan.ts:1-294@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-release-tag.ts:25-80@687f282e
来源：deepseek-harness/.github/workflows/macos-package.yml:1-142@687f282e
来源：deepseek-harness/.github/workflows/windows-package.yml:1-167@687f282e
来源：deepseek-harness/.agents/notes/archived/architecture/2026-09-09-desktop-build-release-validation.md:1-24@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-21-desktop-build-version-as-input.md:1-38@687f282e
来源：deepseek-harness/.agents/notes/archived/process/2026-09-16-desktop-release-version-derivation.md:1-30@687f282e

<a id="desktop-retention"></a>
### 7.5 构建版本解析与保留产物库的原子性

`desktop-ci-version.mjs` 的版本模式不是自由文本：

- 未显式设置 `PACKAGE_VERSION_MODE` 时，production preset 默认 `product`，其他 preset 默认 `auto`。
- `auto` 用 UTC 日期 + `GITHUB_RUN_NUMBER` + `GITHUB_RUN_ATTEMPT`；后两者必须是正整数，否则失败。
- `manual` 必须有显式 `PACKAGE_BUILD_VERSION`，且不能是 `auto`；`latest` channel 的候选版本不得含 `-`，因此 prerelease 只能进 nightly/测试 channel。
- 任何模式最后都过 `validateDesktopBuildVersion(candidate, productVersion)`；失败信息只提示 auto、产品版本或示例，不把内部异常泄漏成可用版本。

`retainDesktopCi` 在保留前还会：

- 要求 machine preset 为 `test` 或 `production`；Windows 只接受 `signed|unsigned`，macOS 只接受 `notarized|unnotarized` 的选择；
- 读取 product `package.json`，用 `PACKAGE_VERSION` 过同一版本校验；
- 记录 repository/run/attempt/source commit/workflow commit/sourceRef/channel/runnerName/target/preset/productVersion/version/testReleaseId/qualification；production 的 `sourceRef` 只能是 `master` 或 `dsh-v*`（schema 级）；
- 只把显式文件清单交给 `retainDesktopRelease`；signed/notarized 才包括 blockmap、build record 与 update metadata，unsigned/unnotarized 只保留安装包，避免把调试包伪装成完整 feed；
- 不读取签名 secret；完成后写 `GITHUB_OUTPUT directory` 与 step summary；unsigned/unnotarized 会带发布资格错误和内部调试警告。

`desktop-release-store.ts` 保证“保留”不是普通拷贝：

- `retainDesktopRelease` 只接受显式、非空、无重复的文件清单；`manifest.json` 是保留文件名；每个源文件先 `lstat` 为普通文件、非空，复制后再 SHA-512/size 对比；源在复制期间变化就失败。
- 每个 attempt 先 `mkdir` 一个 `.lock`，目标已存在直接拒绝，绝不覆盖旧 attempt；写入临时 `.retaining-*` 目录，manifest 用 `wx`、`flush` 写入，最后 `rename` 原子暴露。
- `verifyRetainedDesktopRelease` 重新解析 strict manifest、校验 run/attempt 身份、文件清单无重复，并逐文件重新 hash；缺失、符号链接、被改动都拒绝。
- 这些都不需要凭据；凭据只在后续 `--publish` 读取。

依据：`deepseek-harness/apps/desktop/scripts/desktop-ci-version.mjs:1-34@687f282e`；`apps/desktop/scripts/retain-desktop-ci.ts:1-79@687f282e`；`apps/desktop/scripts/desktop-release-store.ts:1-145@687f282e`；`apps/desktop/scripts/prepare-macos-ci.mjs:1-25@687f282e`；`apps/desktop/scripts/prepare-windows-ci.mjs:1-28@687f282e`。

**失败处理**：preset/signing 选择不合法、`PACKAGE_VERSION` 不是规范 semver、source 元数据不匹配、重复/保留文件名、源文件在复制中变化、attempt 已存在、manifest/文件 hash 不符，都在上传前失败。不要删除旧 attempt 或手改 manifest 来“重试”；新建 run/attempt。

---

来源：deepseek-harness/.github/workflows/macos-package.yml:1-142@687f282e
来源：deepseek-harness/.github/workflows/windows-package.yml:1-167@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-ci-version.mjs:1-34@687f282e
来源：deepseek-harness/apps/desktop/scripts/retain-desktop-ci.ts:1-79@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-release-store.ts:1-145@687f282e
来源：deepseek-harness/apps/desktop/scripts/prepare-macos-ci.mjs:1-25@687f282e
来源：deepseek-harness/apps/desktop/scripts/prepare-windows-ci.mjs:1-28@687f282e
来源：deepseek-harness/apps/desktop/packaging/README.md:86-140@687f282e

<a id="desktop-signing"></a>
## 8. Desktop 签名、保留产物复验与凭据隔离

### 8.1 生产签名不是可选项

**【源义务】** 生产 Windows 包必须 `qualification === 'signed'` 且有签名配置；生产 macOS 包必须 signed 且有签名配置。`verifyRetainedDesktopSignatures` 在**原平台**上：

- Windows：用 Authenticode 验证 EXE，要求签名者、时间戳等满足配置；
- macOS：验证 DMG 和 ZIP；ZIP 先检查路径安全（拒绝绝对路径、反斜杠、`..`），用 `ditto -x -k` 解压后验证归档 App 的 notarization；DMG 验证签名、stapled ticket 与 Gatekeeper；
- 任一不满足直接失败，不能把未签名包“当成测试包”混入生产 feed。

macOS 的具体断言不是一次 `codesign --verify`：

- `verifyMacOSSignature` 先 `codesign --verify --deep --strict`，再要求 `Authority=Developer ID Application: <signingIdentity>` 与 `TeamIdentifier=<teamId>` 精确出现。
- `verifyMacOSNotarizedApplication` 在签名之外跑 `xcrun stapler validate` 与 `spctl --assess --type execute`；`verifyMacOSDiskImage` 对 DMG 跑签名、`stapler validate` 与 `spctl --assess --type install`。
- 嵌入的 runtime Mach-O 由 `signMacOSRuntimeCode` 用 `CSC_KEYCHAIN`、`--timestamp`、`--options runtime` 和稳定 identifier 签名；`verifyMacOSRuntimeCode` 要求签名含 secure timestamp 与 hardened runtime flag。缺 `CSC_KEYCHAIN` 时直接拒绝签名，不退回 ad-hoc。
- `verifyRetainedDesktopSignatures` 在验证前过滤掉名称含 `KEY|SECRET|TOKEN|PASSWORD` 的环境变量，子进程超时 120 秒；解压目录无论成功失败都删除。

依据：`deepseek-harness/apps/desktop/scripts/verify-retained-desktop.ts:1-44@687f282e`；`apps/desktop/scripts/verify-macos-signature.mjs:1-214@687f282e`；`apps/desktop/packaging/README.md:164-209@687f282e`。

### 8.2 签名配置与失败处理

- macOS release 配置必须使用显式 release 环境，拒绝空值、非法 Team ID、带 `Developer ID Application:` 前缀的 identity、不完整的 notarization 凭据；`CSC_LINK` 必须是本地 p12（URL/Base64 不支持），`CSC_KEY_PASSWORD` 是导出密码而非 Apple 账号密码。
- 签名前创建并解锁私有临时 keychain，导入 p12、授权签名、签一个探针；子进程只拿到 keychain 路径，不拿 p12 密码；成功后/普通失败后删除 keychain；强制终止后 CI 必须清理临时凭据。
- Windows 使用 SafeNet EV token；签名前做 supervised preflight（证书有效期、审计存储、编译器、保留的 interlock），用真实 signer 签一个不执行的探针并验签+时间戳；60 秒总 deadline 包含时间戳尝试。
- `SignTool Error: No private key is available.` 必须停止所有签名尝试，由操作员检查配置和 token；不得自动重试或探测 PIN 剩余次数。
- 时间戳只对“正常退出但返回失败/警告”的命令重试，最多 3 次，间隔 1s/2s；启动错误、终止不确定、验签失败立即停止。
- 签名失败写 `fatal.json`，supervisor 终止 stage 进程树，后续 stage 与 release completion record 都不产生。

依据：`deepseek-harness/apps/desktop/packaging/README.md:164-209@687f282e`；`apps/desktop/windows-signing/README.md:1-103@687f282e`。

### 8.2a 运行时签名缓存与恢复边界

**【源义务】** 缓存复用完整签名文件，不替代签名信任检查；调用方先校验本地状态目录，并在签名 stage 锁内使用。

- **policy identity**：调用方按公共证书、SignTool、`windows-sign.cmd`、`windows-sign.mjs`、`windows-timestamp.mjs` 的固定顺序对文件摘要再取 SHA-256，不含安装路径或 PIN；条目 key 绑定 version 1、未签名输入摘要与 identity。非 SHA-256 或 nested 签名配置拒绝。
- **命中恢复**：条目目录与两个文件不能是链接；校验记录、输入/identity、payload 摘要。复制到目标同目录 `.signature-restore-*` staging 后再次验摘要、Windows `Valid`、时间戳与配置 thumbprint，目标输入未变才 rename。任一失败停止，不修复条目、不回退硬件签名。
- **签名发布**：普通请求经 `pending` 串行，首次拒绝后该链保持拒绝，不自动重试后续签名；新签名验签后，以 `.publish-*` staging、`wx`/flush 记录与 rename 发布。有效并发条目保留，坏条目失败。`restore()` 绕过该链，其 worker 并发由调用方在 stage 锁内安排。
- **迁移与维护不是同一校验**：迁移重读记录与 payload 摘要、拒绝同源同目标、保留有效已有条目且源不变。维护只检查命名、恰好 `record.json`/`payload` 两份普通非链接文件，不解析记录、重算摘要或验签；`--clear` 先 rename retire 再删除。非完整条目名只计数、不处理；无自动容量淘汰或按年龄失效。
- **信任边界**：目录所有权、固定本地盘、DACL 与 stage 锁由相邻模块承担；缓存信任同账户进程与 Windows trust 服务，不对抗管理员，也不是不可信远程分发格式。命中不证明包内容、安装或生产发布；本轮未运行缓存/硬件签名/并发恢复。

依据：`deepseek-harness/apps/desktop/scripts/windows-signature-cache.mjs:1-220@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-signature-cache.d.mts:1-76@687f282e`、`deepseek-harness/apps/desktop/scripts/sign-primary-runtime.ts:52-93@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-runtime-signature.mjs:118-147@687f282e`、`deepseek-harness/apps/desktop/windows-signing/README.md:81-93@687f282e`。

### 8.3 保留产物与凭据隔离

- 发布前不重新构建：上传 job 下载已有 package artifact，验证本地 inventory、completion record、签名；`publish-desktop-ci.ts --check` 在 `prepare` 和 `publish` 两个 job 都运行，且不带上传凭据。
- 生产 tag token 只在 production preset 下读取机器上的 GitHub App key，并通过 `actions/create-github-app-token` 生成短时 `contents: write` token；测试 preset 不读该 key。
- 上传 COS 的凭据由机器配置/环境提供；源码不包含 secret。
- `withDesktopChannelLock` 按目标 bucket+channel 哈希成 machine-local 锁目录；锁已存在时拒绝，要求操作员显式检查 stale lock，不做自动超时夺取。
- `desktop-publish-record` 写 durable、无凭据的 publication record；同一 attempt 可通过记录判断是否已完成，避免重复更新 feed。
- 生产上传成功后 tag 失败不让上传“变成失败”：返回 `published-tag-pending`，并给出按顺序的 `git tag`/`git push` 恢复命令；因为产物已公开，报告失败无法修复。

依据：`deepseek-harness/apps/desktop/scripts/desktop-publish.ts:1-132@687f282e`；`desktop-publish-record.ts:1-80@687f282e`；`desktop-release-tag.ts:1-80@687f282e`；`.github/workflows/desktop-publish.yml:92-154@687f282e`。

**完成信号**：`verifyRetainedDesktopSignatures` 无异常；`createDesktopUploadPlan` 产出有序 artifact；channel lock 获取成功；每个对象上传后 read-back hash 一致；feed 最后写并读回；production tag 为 `created`/`present`，或明确 `published-tag-pending` 且有恢复命令。

**失败处理**：
- 签名失败 → 停止，保留 `fatal.json` 与 token 状态，人工检查后显式恢复 interlock；不要重跑签名。
- 上传中断 → 重新执行同一 package/attempt；publish 会先读远端对象，已存在且字节一致则跳过；不一致则报错，需人工判断是否新 attempt。
- feed 写失败 → 不重写二进制；按记录重试 feed，必要时回滚 channel（`rollback-desktop-channel.ts`）。
- tag 失败 → 按返回的 recovery 命令补 tag；不要重传。
- stale lock → 人工确认没有活跃发布后删除；不得自动清理。

**例外**：unsigned/test/本地构建可以存在，但不能进入生产 feed；`desktop-test` environment 用于 test preset；production 必须 `desktop-production`。具体 required reviewers 在仓库外。

---

<a id="desktop-publish"></a>
## 9. Desktop 发布编排：master-only、preflight、审批摘要与上传

### 9.1 触发与 preflight

**【源义务】** `desktop-publish.yml` 是 `workflow_dispatch`，输入 `package_run_id` 与可选 `package_run_attempt`。`route` job 第一件事是：

```
if [ "$GITHUB_REF" != "refs/heads/master" ]; then error
```

即 Desktop 发布只能从 master dispatch，不能从 PR 或 tag。随后 `preflight-desktop-publish.mjs`：

- 校验 repository、run id、attempt 格式；
- 若未指定 attempt，读取该 run 的最新 attempt；
- 分页读取该 run 的 artifacts；
- 只检查名字以 `-<run_id>-<attempt>` 结尾的 artifact；
- 若名字以 `windows-x64-unsigned-` 或 `macos-arm64-unnotarized-debug-` 开头，直接拒绝，并给出 qualification 诊断；
- 返回精确 attempt 供后续路由。

后续 route 不是只信这个 selection。`resolve-desktop-publish-ci.ts` 读取 GitHub 的 run/attempt 与 jobs，要求 run 为 `completed`/`success`/`workflow_dispatch`、path 精确是 `macos-package.yml` 或 `windows-package.yml`、repository 全等；恰好一个名为 `package` 且成功的 job 带 `runner_name`；管理员维护的 runner→label 表中 label 必须唯一且 target 匹配。`resolve-retained-desktop-publish-ci.ts` 再要求本机 `RUNNER_NAME` 等于该 runner、retained manifest 的 run/attempt/source commit/workflow commit/target/qualification 全等，source commit 存在，`sourceRef` 为分支时 compare 状态必须是 `ahead` 或 `identical`，为 `dsh-v*` tag 时 tag 的 sha 必须等于 commit，最后只检查 `desktop-<preset>` environment 有至少一条 `required_reviewers` 且人数 >0；它**不**验证 reviewer 身份、是否 prevent self-review，也不读取批准时间。

依据：`deepseek-harness/.github/workflows/desktop-publish.yml:19-46@687f282e`；`apps/desktop/scripts/preflight-desktop-publish.mjs:1-47@687f282e`；`apps/desktop/scripts/resolve-desktop-publish-ci.ts:1-68@687f282e`；`apps/desktop/scripts/desktop-publish-route.ts:1-70@687f282e`；`apps/desktop/scripts/resolve-retained-desktop-publish-ci.ts:1-52@687f282e`。

**失败处理**：artifact 名字只用于拒绝，不用于授权；真正的授权仍是本地 inventory + 签名验证。若用户选了失败 attempt，不会回退到旧包，必须重新打包。

### 9.2 prepare 与 approval digest

`route` 解析原 package run 和机器；`prepare` 在对应 self-hosted runner 上：

1. checkout 到 `desktop-publisher`，安装；
2. `resolve-retained-desktop-publish-ci.ts` 解析 retained package 与 approval environment；
3. `publish-desktop-ci.ts --check` 在不带上传凭据的情况下验证本地包；
4. 输出 `route`、`preset`、`approval`、`label`。其中 `approval` 是被批准包的摘要，`label` 用于 environment 显示。

`publish` job 通过 `needs.prepare.outputs.approval` 把该摘要写入 `DESKTOP_APPROVED_PACKAGE`，再次 `--check`，然后才 `--publish`。environment 由 preset 决定：production → `desktop-production`，其他 → `desktop-test`；并发组按 runner+preset 串行，`cancel-in-progress: false`。

依据：`deepseek-harness/.github/workflows/desktop-publish.yml:48-154@687f282e`。

**完成信号**：prepare 的 `--check` 成功且 approval 非空；publish 的 `--check` 仍成功；environment 已批准；最终日志给出 publication record 路径；artifact 保留 30 天。

**失败处理**：prepare 失败 → 不进入审批；publish 的 `--check` 失败 → 即使已批准也不上传；标签/环境不匹配 → 修正 preset，不要手工改 approval 摘要。

### 9.3 上传顺序与发布记录

**【源义务】** 发布算法不是“先写 feed 再传文件”，而是：

1. 对每个 artifact 先读远端（只有确认不存在才返回 null）；
2. 对 immutable 二进制使用 COS overwrite prevention；对 channel metadata 允许覆盖；
3. 上传后再次读取并比较 size+SHA-512；不一致立即失败；
4. 记录 `put-verified`；
5. 所有二进制成功后才写 feed（channel metadata 最后）；
6. 写 `feeds-complete`；
7. 生产环境才打 tag；tag 失败记录 `tag-pending` 并返回 `published-tag-pending`，不把已完成上传标为失败；
8. 最后记录 `complete`。

依据：`deepseek-harness/apps/desktop/scripts/desktop-publish.ts:1-132@687f282e`。

**恢复语义**：同一 attempt 重跑时，已存在且字节一致的对象被跳过；已存在但字节不同则失败，提示 reconcile。channel metadata 是唯一允许覆盖的对象，因为它表达“当前 feed 指向哪个版本”。发布记录和 channel lock 共同防止并发发布和重复完成。

**完成信号**：返回 `complete`，或 `published-tag-pending` 且有明确 recovery；`feeds-complete` 记录存在；远端 read-back 一致；生产 tag 已创建/已存在。

**失败处理**：verification-failed → 不要重传覆盖，先查远端对象是否被外部修改；feed 不一致 → 用 rollback 流程回到上一 channel，再重新 prepare；tag pending → 按 recovery 命令补，不要重跑整个上传。

### 9.4 锁、审计、回滚与机器配置的硬边界

**【源义务】** 9.2/9.3 的“摘要、锁、记录、feed-last”在实现里还有一组必须单独核对的边界：

- **resolver 只证明选择，不证明个人批准**：`resolve-retained-desktop-publish-ci.ts` 要求 dispatch 的 `RUNNER_NAME` 与 selection 一致，校验 retained package 的 run/attempt、调用机器上的 retained store，再解析 route；source commit 必须存在。若 `sourceRef` 不是 `dsh-v*` tag，必须能 compare 到所选分支且状态为 `ahead` 或 `identical`；若是 tag，tag 的 sha 必须等于 commit。最后只检查 `desktop-<preset>` environment 存在至少一条 `required_reviewers` 且 reviewer 数 >0；它不核对具体 reviewer 身份、是否 prevent self-review，也不读取批准时间。依据：`deepseek-harness/apps/desktop/scripts/resolve-retained-desktop-publish-ci.ts:1-52@687f282e`。
- **prepare 的资格与审批摘要**：route schema 精确；retained manifest 的 repository/runner/target/channel/sourceRef/commit/preset 必须与 route 全等；`qualification` 不得为 `unsigned`/`unnotarized`，且 Windows 必须 `signed`、macOS 必须 `notarized`。`createDesktopUploadPlan` 后要求 `plan.version`/`commit` 匹配 source、`dirty === false`；签名验证通过后计算 `approval = sha256(JSON.stringify({ manifest, plan }))`。publish 时 `DESKTOP_APPROVED_PACKAGE` 必须存在且等于该摘要，否则报“package or destination changed after approval”。`--check` 不读上传凭据、不访问 COS；`--publish` 在生产环境还必须先有 `DESKTOP_TAG_TOKEN`，然后才读上传凭据。依据：`deepseek-harness/apps/desktop/scripts/publish-desktop-ci.ts:1-129@687f282e`。
- **channel lock 是机器本地目录锁，不自动恢复 stale lock**：锁路径是 `sha256(destination)`；先 `mkdir` 一个 0700 目录，成功后在内部 `owner.json` 写 pid/startedAt/destination，失败抛“channel is locked or inaccessible; inspect <path>”。`finally` 删除锁；进程崩溃会留下锁，代码没有 age/TTL/owner 存活检测，也没有自动夺取。依据：`deepseek-harness/apps/desktop/scripts/desktop-publish-record.ts:12-40@687f282e`。
- **journal 在 checkout 外，terminal result 只写一次**：`createDesktopPublicationRecord` 在持久 root 建 `.initializing-*` 临时目录，写 `operation.json` 与空 `events.jsonl`，再 `rename` 成 `publish-*`；`events.jsonl` 以 `flush: true` 追加；`result.json` 以 `wx` 写一次。记录不带凭据。依据：同文件 `:42-88@687f282e`。
- **tag-only recovery 只认 `feeds-complete`**：`wasDesktopAttemptPublished` 只扫描 `publish-*`，要求 `operation` 精确为 publish 且 repository/runId/attempt/destination 全等；只读取以换行结尾的完整事件行，发现 `feeds-complete` 就返回 true，允许后续只补 tag。它不读 `result.json` 的终态，也不证明 feed 当前仍指向该版本；因此“可补 tag”不等于“上传已验证完成”。依据：同文件 `:89-110@687f282e`；`publish-desktop-ci.ts:86-116@687f282e`。
- **rollback 只改 feed，不改二进制、不动 tag**：`rollback-desktop-channel.ts` 要求成功 publication 目录里的 `operation.json` 与 `result.json`（status 为 `complete` 或 `published-tag-pending`），并要求 route 的 runId/attempt、repository、destination 全等。取得同一把 channel lock 后写 rollback journal；`rollbackDesktopChannel` 先逐个校验历史 immutable 文件的 size/SHA-512，再读当前 feed 的 `version`，必须等于操作员 `--expected-version`；只对 feed 做写前重新读取、`put-intent`、覆盖、read-back；tag 操作被替换成直接抛错，绝不移动 tag。没有 `--execute` 时只 preview，不写远端；中途失败会留下已记录的部分写入，但 record 不重建单个已完成动作，需人工结合 journal/read-back 判断。依据：`apps/desktop/scripts/rollback-desktop-channel.ts:1-60@687f282e`；`apps/desktop/scripts/desktop-rollback.ts:1-58@687f282e`。
- **配置与 COS 的隐含信任**：`readDesktopPublishConfig` 用 strict object 校验 bucket 正则、HTTPS origin（必须无 userinfo/path/query/hash）、绝对 credentials 文件；production 还要求固定 `https://download.deepseek.com` 与 GitHub App 配置。`readDesktopUploadCredentials` 只在上传授权/本地验证之后读绝对路径文件，凭据不进入 journal。COS transport 只接受 plan 内的精确 key；channel metadata 读取上限 1 MiB；只有 `NoSuchKey` 被当作缺失，其他错误上抛；`put` 先重算本地 digest，发送 `Content-MD5`，二进制再带 `x-cos-forbid-overwrite: true`。**桶必须关闭 versioning；代码不查询桶配置**，所以“不可覆盖”依赖管理员与对象存储侧，不能由本仓库证明。单次操作超时 900 秒。依据：`apps/desktop/scripts/desktop-publish-config.ts:1-46@687f282e`；`apps/desktop/scripts/desktop-publish-cos.ts:1-81@687f282e`。
- **资格诊断是发布门的一部分**：`desktopPublishQualificationError` 对 `unsigned`/`unnotarized` 返回中文修复指令，并明确“仅限内部调试，不能发布到 test 或 production，也不能用于自动更新；必须用新的 run/attempt 重新打包，重跑当前发布任务无效”。依据：`apps/desktop/scripts/desktop-publish-qualification.mjs:1-15@687f282e`。

**完成信号**：resolver 的 runner/source/environment 全过；prepare 的 digest 非空且与 publish 的 `DESKTOP_APPROVED_PACKAGE` 相等；锁目录在操作期间存在、结束后删除；journal 有 `feeds-complete`；rollback preview 只报告 before/after，`--execute` 时每个 feed 写后 read-back 一致且 tag 未变。

**失败处理**：锁已存在 → 人工检查 `owner.json`/进程，不得删除未知锁后并发写；`operation.json`/`result.json` 与 route 不匹配 → 拒绝 rollback，重新选择原成功记录；历史二进制缺失/不同 → 先修对象存储，不要改 feed；当前 feed 版本不是 expected → 停止，不做“强制回滚”。

---

来源：deepseek-harness/.github/workflows/desktop-publish.yml:1-154@687f282e
来源：deepseek-harness/apps/desktop/scripts/preflight-desktop-publish.mjs:1-47@687f282e
来源：deepseek-harness/apps/desktop/scripts/resolve-desktop-publish-ci.ts:1-68@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-publish-route.ts:1-70@687f282e
来源：deepseek-harness/apps/desktop/scripts/resolve-retained-desktop-publish-ci.ts:1-52@687f282e
来源：deepseek-harness/apps/desktop/scripts/verify-retained-desktop.ts:1-44@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-publish.ts:1-132@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-publish-record.ts:1-110@687f282e
来源：deepseek-harness/apps/desktop/scripts/publish-desktop-ci.ts:1-129@687f282e
来源：deepseek-harness/apps/desktop/scripts/rollback-desktop-channel.ts:1-60@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-rollback.ts:1-58@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-publish-config.ts:1-46@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-publish-cos.ts:1-81@687f282e
来源：deepseek-harness/apps/desktop/scripts/desktop-publish-qualification.mjs:1-15@687f282e
来源：deepseek-harness/apps/desktop/packaging/README.md:164-209@687f282e
来源：deepseek-harness/apps/desktop/windows-signing/README.md:1-103@687f282e
来源：deepseek-harness/apps/desktop/scripts/verify-macos-signature.mjs:1-214@687f282e

<a id="desktop-qualification"></a>
## 10. Desktop 安装升级与“未验证”清单

### 10.1 本地自动化能证明什么

`apps/desktop/tests/README.md` 明确分层：

- 本地 updater 命令用真实 Electron、HTTP updater、policy client、sandboxed preload、mandatory renderer，覆盖 same/older-version 拒绝、SHA-512 拒绝、传输中断、stall deadline、显式重试、合并请求、同地址 feed 替换、安装交接等；但它**不执行安装器**，下载字节不是可执行安装包。
- mandatory 窗口覆盖文本服务内容、嵌入式 Windows shell frame、Escape 阻止、直接下载、任务确认、deferral、恢复页、无 force 校验等；这些是窗口行为，不是完整 Host 工作负载。
- signed-download runner 用真实 `NsisUpdater` 验证 wrong publisher、unsigned、corrupt transfer、重试到 signed readiness；合成 feed 和 test adapter 不证明已安装版本兼容。
- Windows signature runner 用真实 electron-builder metadata generator 与 `NsisUpdater` verifier，验证 publisher 匹配、不同 publisher 拒绝、unsigned 拒绝；不下载/安装/签名。
- open verification 列表明确：不执行安装器、不覆盖已安装应用、不证明新版本启动；已签名 Windows/macOS 安装升级仍需操作员验证；live policy origins、CDN Range、macOS 浏览器/剪贴板等未验证。

依据：`deepseek-harness/apps/desktop/tests/README.md:1-88@687f282e`。

### 10.2 安装升级操作员清单

`installed-update/README.md` 给出 Windows 安装升级的完整人工序列，关键治理点：

1. 准备两个递增的测试版本、共享 bootstrap、两个私有 runtime、冻结 application files；每一步拒绝覆盖已有 per-run 输出；记录 source commit 与 dirty flag，但明确它们只标识起始 checkout，不标识后续包内容。
2. 包验证器检查 installer 的真实归档身份、entry、冻结字节、updater 依赖版本、feed/cache/publisher 配置、bundled runtime；拒绝不安全归档路径；`passed` 只覆盖这些检查，不覆盖注册、启动、升级、数据保留。
3. 操作员：安装 v1，记录路径/hash/签名/时间；确认 `started` 和 `workspace-ready`；先测 404 feed，再发布 v1 测同版本 feed，再发布 v2；只中断测试应用的传输，记录失败与持久重试；移除故障后自己点重试；确认单独安装确认与任务警告；安装并自动重启到 v2；核对会话与设置保留。
4. 证据必须成组保存：URL、UTC 时间、HTTP 状态、feed body/hash、截图、journal 快照；journal inspector 退出 0 只表示有序 milestone 存在，`recordedFlow: complete` 不是整体验收；报告始终要求独立操作员检查。
5. 失败即停：签名失败停止打包并保留记录；feed 不匹配在下载前停止；故障影响远程控制时只恢复自有改动；不得卸载、清 cache、删证据或覆盖失败批次来“让下次看起来成功”；干净重试要新建 run。

依据：`deepseek-harness/apps/desktop/tests/installed-update/README.md:1-132@687f282e`。

**完成信号**：两个 installer 都完成签名验证；404 与同版本 feed 场景符合预期；故障注入只影响测试应用；重试后到达 ready；安装确认与实际安装完成；自动重启进入 v2；会话/设置保留；journal、截图、feed 证据齐全且 `operatorAcceptance` 仍为 pending（直到人工签署）。

**证据限制**：这是操作员程序，不是自动 gate；源明确说完整签名包生产、隔离网络故障工具、晚发布 feed、安装器触发重启和完整序列仍需单独资格验证。迁移时不能把它标成 CI 已执行。

来源：deepseek-harness/apps/desktop/tests/README.md:1-88@687f282e
来源：deepseek-harness/apps/desktop/tests/installed-update/README.md:1-132@687f282e
来源：deepseek-harness/apps/desktop/packaging/README.md:164-279@687f282e

<a id="desktop-test-publication"></a>
### 10.3 测试 feed 的上传与发布（操作员授权）

**【源义务】** 安装资格使用独立的 test COS 桶和私有 Windows 路径，**上传二进制与发布 feed 是两个分开的操作**：

- `publish-installed-update.ts upload-binaries` 只上传 installer/blockmap，不发布 feed；`publish-feed` 只发布 feed。默认（不带 `--execute`）只生成并打印本地 plan，不发起任何网络请求。
- 带 `--execute` 时必须有交互式 TTY，操作员逐字输入 `UPLOAD <version> <run-id>` 或 `PUBLISH <version> <run-id>`；不匹配即拒绝。v2 feed 还必须传原安装应用的 `dsh-update-qualification/<run-id>/journals` 目录。
- 凭据来自机器 `.env.windows` 的 `DOWNLOAD_TEST_*`；只有 secret id/key 进入 COS 客户端，不写进命令或记录。传输只允许 test bucket 与固定的私有 qualification 路径。
- `upload-binaries` 必须先查询 bucket versioning，只有确认既未启用也未暂停才允许写；查询被拒或状态未知都不等于允许。`publish-feed` 复用成功的 upload-binaries receipt，不重复查询 versioning，也不重新下载二进制。
- 每个对象先读 origin；已存在且字节一致则回读，不覆盖；字节不同即失败。二进制 PUT 用 forbid-overwrite；首次 feed 必须不存在或含精确 v1 字节；v2 feed 允许覆盖，但写前必须读到精确的 v1 feed，并重新验证 v1 的 startup journal 与本地 inputs 未变。
- 每次写后做 public read-back（size+SHA-512）；feed 写后还要读回公共 URL。SDK 写入没有自动重试；超时不证明服务端未落盘。
- `publication.lock` 是 material 目录内的空目录锁，只排除同机同目录的并发，不是跨机器互斥；feed 的读-改-写不是原子 CAS，必须只有一个 publisher。
- `verifiedInstalledUpdateDistribution` 在无凭据/无网络下重新验证 receipt：schema/run/version/stage/passed、appId/version、installer signature valid/timestamped/updaterVerificationInvoked、signature SHA-512 与当前 distribution、inputs 的 manifest hash 与完整 distribution 全等；receipt 路径必须匹配 `check-*/result.json`。
- 只读 `planInstalledUpdateDistribution` 无凭据/无网络：版本属于 qualification run，`nightly.yml` 精确描述该版本与唯一 installer；installer/blockmap 存在非空；feed filename/可选 path 匹配固定 Windows 文件名，size/SHA-512 与 installer 一致，可选 releaseDate 可解析；feed body 从验证值重建。结果固定 `verified:'file-integrity-only'`、`publicationAuthorized:false`，不证明签名、应用身份、包内容、启动或发布授权。它使用 `stat`，不提供文件级 symlink 拒绝保证；blockmap 计算自身摘要而非与 feed 的另一声明比对。
- 成功 builder 将计划写入 `artifact-files.json`，package verification 在提取/签名/内容检查后重新 plan；发布器的 `verifiedInstalledUpdateDistribution` 也重新调用 planner，比对 `inputs.distribution`、`inputs.manifestSha512` 与成功 receipt。二进制写前、feed 写前再次重验；successor 的前态 feed 另按原版本重新 plan。读取计划本身不是发布授权或实际安装证据，本轮未运行这些流程。
- 记录保留 `publication-records/operation-*` 的 plan、stage、result 与 feed body；`alreadyPublished: true` 只表示对既有目标 feed 的对账，不是一次新发布。失败即停，保留部分记录与远端对象；超时后先检查远端状态，再取得单独授权重试。
- 时间预算：version 查询总 deadline 30 秒；对象读/PUT 总 deadline 15 分钟；到期会中止底层 HTTP 并等待关闭后才释放锁。

依据：`deepseek-harness/apps/desktop/tests/installed-update/publication/README.md:1-72@687f282e`；`apps/desktop/scripts/installed-update-publication.ts:1-217@687f282e`；`apps/desktop/scripts/publish-installed-update.ts:1-40@687f282e`。

**完成信号**：两个版本各自有成功 receipt；upload-binaries 的所有二进制 public read-back 一致；v1 feed 与 v2 feed 按顺序发布且回读一致；记录中可看到复用 receipt 的路径与 hash；`alreadyPublished` 的语义被正确解释。

**证据限制**：源明确说这些是 pending manual steps；2026-09-14 的凭据能读 probe，但 `GetBucketVersioning` 返回 403，未尝试 PUT。真实 COS 写入、跨机器并发、CDN 缓存与安装器消费仍需独立资格验证。

来源：deepseek-harness/apps/desktop/tests/installed-update/publication/README.md:1-72@687f282e
来源：deepseek-harness/apps/desktop/scripts/installed-update-publication.ts:1-217@687f282e
来源：deepseek-harness/apps/desktop/scripts/publish-installed-update.ts:1-40@687f282e
来源：deepseek-harness/apps/desktop/scripts/installed-update-distribution.ts:1-74@687f282e
来源：deepseek-harness/apps/desktop/scripts/installed-update-packaging.ts:112-115@687f282e
来源：deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:55-101@687f282e

<a id="desktop-network-fault"></a>
### 10.4 仅针对测试应用的网络故障

**【源义务】** `prepare-installed-update-network.ts` 不接受“任意 exe”：

- 必须有 v1 的成功 package receipt，且 application signature valid/timestamped/updaterVerificationInvoked、SHA-512 为 86 字符 base64；
- executable 必须是绝对路径、文件名精确为 `<productName>.exe`（实际 plan 规则为 `DSH Update Test <run-id>.exe`）、是普通文件、realpath 不在 material run 内、当前 SHA-512 等于 receipt；
- 它只以 `wx` 写 `network-fault/plan.json`，不改变网络状态；plan 记录 runId、executable、十六进制 hash、`DSH-Update-Qualification-<runId>` 规则名、manifest/receipt 路径与 `networkChanged: false`。

`installed-update-network.ps1` 的 `Status` 是只读默认动作；`Block`/`Restore` 都要求交互式确认：

- 解析 plan 前先校验 schema、24 位十六进制 runId、规则名、128 位十六进制 SHA-512、盘符绝对路径、文件名与全路径规范化；不符即失败，不做任何网络修改。
- 只按精确规则名在 `PersistentStore` 查找；多于一条要求人工检查；已有规则必须同时匹配 ownership description、`Outbound`、`Block`、单一 application filter、精确 program path，否则视为外来规则，不修改。
- `Block` 在确认前再次确认规则不存在、exe hash 未变；确认后再次检查，再创建一个 program-specific、`Profile Any`、`Enabled True`、`PersistentStore` 的出站阻断规则，并确认 enabled。`blocked-rule-present` 明确记录 `trafficInterruptionVerified: false`：规则存在**不等于**流量已被有效阻断。
- `Restore` 只删除该 exact owned rule；规则不存在是安全 no-op；删除后再查一次，仍存在即失败。`rule-absent` 记录 `downloadRecoveryVerified: false`，下载恢复仍需操作员观察。
- 失败不自动重试、不静默删除规则；每次调用写新的 `network-fault/records/<id>/events.jsonl`，事件 flush。规则会跨重启保留；测试期间必须保持应用打开并观察到失败与实际恢复，否则记录为 incomplete；绝不能带着测试规则安装更新。

依据：`deepseek-harness/apps/desktop/tests/installed-update/network/README.md:1-58@687f282e`；`apps/desktop/scripts/prepare-installed-update-network.ts:1-62@687f282e`；`apps/desktop/scripts/installed-update-network.ps1:1-89@687f282e`。

**完成信号**：plan 通过严格校验；`Status` 报告规则是否存在；`Block` 只创建一条 owned rule；观察到真实下载失败；`Restore` 删除后 `Status` 报告 absent；随后操作员显式重试并观察到恢复。

**证据限制**：本地 plan 校验与 PowerShell 控制流只有 inert tests；真实防火墙规则、实际流量中断、恢复与跨重启行为仍需授权操作员执行；规则存在不能替代流量证据。

---

来源：deepseek-harness/apps/desktop/tests/installed-update/network/README.md:1-58@687f282e
来源：deepseek-harness/apps/desktop/scripts/prepare-installed-update-network.ts:1-62@687f282e
来源：deepseek-harness/apps/desktop/scripts/installed-update-network.ps1:1-89@687f282e

<a id="other-delivery"></a>
## 11. SSH helper、文档站点、预览与 GitLab

### 11.1 SSH helper

**【源义务】** `build-exe-for-ssh-helper.yml` 是 `workflow_call`/`workflow_dispatch`，构建 Linux/macOS x64/arm64 的 Node 24 单文件可执行，上传带 `SHA256SUMS` 的 artifact。构建约束：
- 构建 plan 只接受四个 target id（`node24-linux-x64`、`node24-linux-arm64`、`node24-macos-x64`、`node24-macos-arm64`），拒绝未知或重复项；每个 target 固定 runner，`timeout-minutes: 40`，`fail-fast: false`，所以一个 target 失败不会掩盖其他 target 的证据。
- 每个 target 只允许一个 `.tar.gz`；`verify-ssh-helper-artifact.ts` 先拒绝链接、`..`、反斜杠、重复项、非 `dsh-ssh-helper/` 前缀和缺失 manifest 的条目，再校验 `.sha256`、manifest 的 target/version/commit/dirty、文件清单/摘要/mode、平台 target，make install readonly，跑两个并发 cold start；Linux 还要验证 `landlock-run` 后端，glibc 2.28 无 Node 的 OpenSSH 路径。只有这些通过才 upload artifact。

`publish-ssh-helper.yml` 只有 `workflow_dispatch`，输入 `publish`；发布前：

- 从根 `package.json` 读取版本；若 `publish=true`，要求 `GITHUB_REF_TYPE=tag` 且 `GITHUB_REF_NAME` 精确等于 `dsh-v<version>`；
- `verify` job 下载全部 `ssh-helper-node24-*` artifact，运行 `scripts/ssh-helper/release.ts --directory=... --version=<root version> --commit=<validate commit>`，要求来自所选提交的完整证据，并上传 `SHA256SUMS`；
- `publish` job 用 `gh release create "$TAG" --verify-tag --draft --title "$TAG" --notes ...` 创建 **draft** GitHub Release（若已存在则跳过创建），再 `gh release upload` 附上 `*.tar.gz` 与 `SHA256SUMS`；
- 不自动发布 draft；人工检查后再 publish。

依据：`deepseek-harness/.github/workflows/publish-ssh-helper.yml:1-101@687f282e`；`build-exe-for-ssh-helper.yml:1-127@687f282e`。

**SSH 证据链的实际检查**：`prepareSshRelease` 只接受四个 target 的 archive；每个 archive 的 sha256 必须与 `.sha256` 文件一致；解包后 `verifyPayload` 要求 `manifest.json` 的 target/version/commit 与发布参数全等、`dirty=false`，文件清单与 manifest 精确一致（拒绝符号链接/非普通文件），且 `dsh-ssh-helper` 与 `native/system/package.json` 必须存在；逐文件重算 SHA-256 并比较 mode。每个 target 还要 runtime report 含 `executable-handshake`、`guarded-files-and-streams`、`managed-process-output`、`process-cancellation`、`native-pty`、`native-flock`、`embedded-ptc-and-deadline` 与 target 专属 check；Linux 额外要求 `ssh` 的 `target-has-no-node`、`glibc 2.28` 和 Landlock 的 `landlock-run`/`sandboxLane=required`，macOS 要求 `restrictedWorker=true`；`readonlyInstall=true`、`concurrentColdStarts=2`。最后才写 `SHA256SUMS`。依据：`scripts/ssh-helper/release.ts:1-76@687f282e`；`scripts/ssh-helper/artifact.ts:1-88@687f282e`。

**完成信号**：`ssh-helper/release.ts` 验证通过并生成 `SHA256SUMS`；draft release 存在且由 `--verify-tag` 确认 tag 指向所选提交；人工确认后发布。**失败处理**：证据不完整 → 重新构建，不要补 checksum；draft 已存在 → 先检查是否同一 tag/commit，再决定 upload；不要创建重复 release。

### 11.2 文档站点

**【源义务】** `docs-pages.yml` 是 manual-only，不监听 PR/push，因此不会成为 PR check。它从 `dsh-v*` tag 构建已发布快照；`release:verify` 拒绝其他 ref，`github-pages` environment 再重复限制。构建使用 `DOCS_REPOSITORY_REF=master` 生成源码链接，这是“文档内容来自 tag、源码链接指向 master”的刻意分裂。部署 job 使用 `github-pages` environment、`id-token: write`、`pages` 权限。

依据：`deepseek-harness/.github/workflows/docs-pages.yml:1-93@687f282e`。

**完成信号**：dispatch 的 ref 是 `dsh-v*` tag；构建产物通过链接检查；environment 批准；部署 URL 可访问。**失败处理**：ref 不是 tag → 重新从 tag dispatch；链接检查失败 → 修文档，不要绕过；部署失败 → 重跑 deploy job，不要重建不同 ref。

### 11.3 PR 预览

`build-preview-cloudflare.yml` 在 PR 上构建预览并部署到 Cloudflare preview 目标；它不是生产发布，不应把预览 URL 当发布证据。其治理价值是：PR 可以在合并前看到真实构建，但预览不改变发布 tag/feed；是否复用生产 token/项目必须从 secrets 与项目名单独核对，源码只证明工作流结构。依据：`deepseek-harness/.github/workflows/build-preview-cloudflare.yml:1-170@687f282e`。

具体约束：
- 仅 `pull_request`（opened/synchronize/reopened），同一 PR 的并发构建 `cancel-in-progress: true`；每个 PR 使用自己的 branch alias，因此跨 PR 不争同一 URL。
- 上传的是构建产物，不是源码：删除 `*.map`（sourcemap 含完整源码），并用 `preview.html` 替换 `index.html`，让部署根成为可启动入口；`DSH_TELEMETRY_DISABLED=1` 防止 CI 上报生产遥测。
- Cloudflare 项目的 production branch 故意设成没有任何 deployment 使用的名字，避免出现未受 Access 保护的 URL；部署后必须用 Service Auth 凭据请求受保护镜像 URL，断言 HTTP 200（302 表示 Access 缺 Service Auth 规则）、响应无 `content-encoding`、字节以 gzip magic `1f 8b` 开头；失败重试 5 次。
- PR 评论用 `<!-- dsh-preview-url -->` marker 幂等；已存在就不重复评论。

**证据限制**：Cloudflare token、项目名、预览域名、Access 策略在仓库外；源码只能证明工作流结构与断言，不能证明实际 Access 配置或部署成功。

### 11.4 GitLab 镜像/交付

`.gitlab-ci.yml` 是 tag-only 流水线：`workflow.rules` 只在 `CI_COMMIT_TAG` 匹配 `dsh-v*` 时创建 pipeline，合并请求不运行。job 包括版本检查、`dist:check`（构建并校验 dist）、bundle 构建；bundle job 使用 `resource_group` 串行，避免并发写共享产物。依据：`deepseek-harness/.gitlab-ci.yml:1-191@687f282e`。

**信任边界**：源内没有 GitLab protected tags、protected environments、variables、runner 权限配置；只能证明“tag-only + resource_group”的流水线形状。迁移时必须把 GitLab 侧的保护规则单独列为前置条件。

---

来源：deepseek-harness/.github/workflows/publish-ssh-helper.yml:1-101@687f282e
来源：deepseek-harness/.github/workflows/build-exe-for-ssh-helper.yml:1-127@687f282e
来源：deepseek-harness/.github/workflows/docs-pages.yml:1-93@687f282e
来源：deepseek-harness/.github/workflows/build-preview-cloudflare.yml:1-170@687f282e
来源：deepseek-harness/.gitlab-ci.yml:1-191@687f282e
来源：deepseek-harness/scripts/ssh-helper/release.ts:1-76@687f282e
来源：deepseek-harness/scripts/ssh-helper/artifact.ts:1-88@687f282e
来源：deepseek-harness/scripts/verify-ssh-helper-artifact.ts:1-167@687f282e

<a id="session-authority"></a>
## 12. Session 版本的四个权威与“已发布”判定

### 12.1 四个不同事实

**【源义务】** 不要把“代码里的版本”“已定稿兼容基线”“已发布格式”“某个产品 tag”混成一个布尔值：

| 事实 | 权威 | 说明 |
| --- | --- | --- |
| checkout writer | `SESSION_FORMAT_VERSION` in `packages/core/session/src/types.ts` | 唯一手写的当前 writer 数字；catalog generator 据此检查相邻迁移恰好到达它 |
| finalized compatibility | `docs/session-format-status.md` 的 `latestFinalizedVersion` + `finalized/vN.json` | 已接受的兼容基线与机器记录/after schema 的 checkpoint；不表示已发布 |
| latest released format | `latestReleasedVersion` + `evidenceTag` | 证据 tag 的 tagged writer 具有该值；不必是首个携带该格式的发布 |
| release status | 比较 writer 与已验证 release record | 相等 = 该 writer 格式已发布；writer 更大 = 尚未记录为已发布；不得维护单独 `released` 布尔 |

依据：`deepseek-harness/docs/session-format-status.md:1-63@687f282e`；`.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:1-42@687f282e`。

**源文件当前声明（只作固定提交事实，不作联网验证）**：`latestFinalizedVersion: 4`，`latestReleasedVersion: 4`，`evidenceTag: dsh-v0.2.0-rc.2`，entry writer path `packages/core/session/src/types.ts`。迁移时不要把这些数字硬编码为永恒值；从目标仓库自己的 record 读取。

**关键条件**：alpha/beta/RC 产品发布也建立已发布 Session 格式义务；GitHub 的 prerelease 标志不使持久化用户数据变成可丢弃。缺失 release record 不是“未发布”的证据。比较旧 checkout 与新分支记录时，较低 writer 只说明它是旧 writer；同一 checkout 内顺序矛盾会被本地一致性门拒绝。依据：`docs/session-format-status.md:20-27@687f282e`。

### 12.2 更新 release record 的时机

- 实现 Session bump 时：同时改 `SESSION_FORMAT_VERSION` 与相邻 catalog；**不要**提前推进 release record。
- 产品发布首次携带更高格式时：确认发布与该 tag 的 writer，然后在同一次双语更新中推进 `latestReleasedVersion`、`evidenceTag` 与 tagged writer path。
- 后续产品发布携带同一格式：不需要改 record。
- 开发主干上永远不要把 record 降低。
- `scripts/doc-standard.spec.ts` 检查 record 结构、双语相等、evidence tag/writer path 一致、记录版本不超过 checkout writer；它是 keyless 的，不查询 GitHub，也不证明 record 最新。依据：`deepseek-harness/scripts/doc-standard.spec.ts:162-300@687f282e`。发布验证仍是 release operator 的义务。

依据：`deepseek-harness/docs/session-format-status.md:20-27@687f282e`、`:45-55@687f282e`。

**完成信号**：`verify-session-format-catalog` 通过；`doc-standard` 通过；release record 的 `evidenceTag` 指向真实已发布 tag，且该 tag 的 writer 等于记录值；双语文件一致。

**证据限制**：没有网络检查；record 可能滞后。发布者必须自己核对 `git show <tag>:packages/core/session/src/types.ts` 与 registry/release 状态。

**相邻但未展开的持久化面**：根 `AGENTS.md` 还规定 SQLite 使用单调 `SCHEMA_VERSION`。本域只审计 Session JSONL/类型记录，没有逐行审计 SQLite schema/migration；迁移时把 SQLite 版本化归入持久化/存储域，并保留“只增不减、旧库可读/可迁移”的等价约束，不能因为本文覆盖 Session 就认为 SQLite 已覆盖。依据：`deepseek-harness/AGENTS.md:8-18@687f282e`。

来源：deepseek-harness/docs/session-format-status.md:1-63@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:1-42@687f282e
来源：deepseek-harness/docs/persistence-changes/README.md:1-90@687f282e
来源：deepseek-harness/scripts/doc-standard.spec.ts:162-300@687f282e

<a id="persistence-format-archive"></a>
### 12.3 历史格式参考：v0 到 checkout writer 的完整声明

**【源义务】** `docs/persistence-changes/historical-formats/` 不是“旧版本说明”，而是每个历史格式的完整声明快照：

- 对每个整数 `0 <= version < SESSION_FORMAT_VERSION`，必须有 `vN.md`、`vN.zh.md`、`vN.schema.json` 与 `vN.i18n.yaml`；目录里不能有未在范围内的 `v*` 文件。当前格式（writer）使用 `docs/persistence-catalog.md` 与 `docs/persistence-schema.json`，而不是 `vN.*`。
- 每个历史页有 frontmatter `kind: persistence-format`，恰好一个 `yaml persistence-format` 机器块；中英文机器块必须逐字相等；块内 `schemaVersion`、`sessionFormatVersion`（等于文件名）、`source`（`tag` 或正整数 `pullRequest`）与 `roots` 必填。
- `roots` 的 key 只能是 `SessionHeader`、`JsonlHeaderLine`、`SessionEventEnvelope` 或 `event:*`，值为 64 位小写 hex；必须覆盖完整 schema 的所有 roots，不能多/少。
- schema 必须包含三个 header roots 与至少一个 event root；`SessionHeader.version` 必须是 required，且为匹配版本的字面量（历史快照允许 legacy `number`）；所有列出类型必须从 roots 可达、无重复、无遗漏。历史快照不得含未引用类型；当前 inventory 允许提取器保留被规范化擦除的类型，由 catalog generator 另行检查。
- 文档必须链接同名 schema；当前 catalog 文档还要包含每个 root 的索引行 `| \`key\` | kind | \`digest\` |`。
- 历史源码引用必须省略行号（正则拒绝 `file.ts:12` / `#L12` 一类形式）；源标签或 PR 只是来源指针，检查不 checkout 历史。

**推进 writer 时的强制动作**：在新 writer 生效前，先跑 `verify-persistence-catalog`，再用 `verify-persistence-formats --archive <旧 writer>` 把当前 inventory 归档为 `vN.schema.json`。`--archive` 只接受当前 writer、拒绝已存在目标、不能与 `--write` 组合；它只保留从 roots 可达的类型，并去掉源码行号。随后补双语记录/来源证据，再运行 `verify-persistence-formats --write` 刷新生成区域与 pairing，最后跑 `verify-persistence-formats` 与 `doc-sync`。默认验证拒绝 stale facts。

依据：`deepseek-harness/docs/persistence-changes/historical-formats/README.md:1-75@687f282e`；`scripts/persistence-formats.ts:1-230@687f282e`。

**完成信号**：`verify-persistence-formats` 打印 v0 到当前 writer 的完整引用数；每个历史 schema 的 root/type digest、双语机器块、来源与文档链接均通过；归档命令只在 writer 推进前成功一次。

**证据限制**：该检查不 Git fetch、不查询服务、不重放历史应用，也不证明迁移安全；它只证明“选定的完整声明快照与当前 writer 边界一致”。快照可以保留历史可选字段与 opaque 值，不能把当前类型回填成旧格式。

来源：deepseek-harness/docs/persistence-changes/historical-formats/README.md:1-75@687f282e
来源：deepseek-harness/scripts/persistence-formats.ts:1-230@687f282e
来源：deepseek-harness/docs/cookbook/adding-a-session-format-version.md:23-68@687f282e

<a id="persistence-release-archive"></a>
### 12.4 预发布标签快照：tag-by-tag 的历史差异

**【源义务】** `docs/persistence-changes/releases/` 是固定日期的 alpha/RC 标签归档，不是当前 acknowledgement 链：

- `manifest.json` 使用 `schemaVersion: 1`、日期型 `capturedAt`，`releases` 按语义版本严格递增且不能重复；tag 必须匹配 `dsh-v<major>.<minor>.<patch>-(alpha|rc).<N>`，`sourceDate` 必填，`publishedAt` 可为 null，`sessionFormatVersion` 为非负安全整数。
- 目录必须恰好包含 README 三件套、manifest 与每个 tag 的 `.md/.zh.md/.i18n.yaml/.schema.json`；不能有未被 manifest 引用的 artifact。
- 每个 tag 的英文/中文文档必须有 `kind: persistence-release`，且恰好一个 `yaml persistence-release` 机器块，两边逐字相等；记录字段精确为 `schemaVersion/tag/previous/sessionFormatVersion/changes`，`previous` 必须等于按 manifest 顺序的前一个 tag（首个为 null）。
- 每个 change 的 root 只能是 `SessionHeader|JsonlHeaderLine|SessionEventEnvelope|event:*`；同一 tag 不能重复 root；`before`/`after` 为 null 或 64 位小写 hex；历史源码引用同样禁止行号。
- `.schema.json` 必须只包含该 tag 的 **changed after roots**；每个 root 的 before/after digest 必须与前置状态/当前快照一致；每个声明的 change 必须至少产生一个结构变化；无结构变化的 release 保持空 `changes` 与对应空 snapshot；所有列出的类型必须从 roots 可达、无重复且完整覆盖。
- 最终状态必须包含三个 header roots；`SessionHeader.version` 必须是 required 且为记录版本的字面量（历史允许 `number`）。
- `verify-persistence-releases` 只读 manifest/records/snapshots，不访问 Git/网络，验证 manifest 覆盖、predecessor、before/after、类型完整性与双语机器声明；默认拒绝 stale 生成事实，`--write` 在完整验证后刷新 marker 区域与 pairing。

依据：`deepseek-harness/docs/persistence-changes/releases/README.md:1-103@687f282e`；`docs/persistence-changes/releases/manifest.json:1-162@687f282e`；`scripts/persistence-releases.ts:1-257@687f282e`。

**关键限制**：这些记录是**历史结构快照**，不是历史运行时兼容性证明，也不替代当前源码 acknowledgement。历史 V0 确实存在结构变化但未升版本；回填的 release record 不能授权当前 PR 省略 acknowledgement 或跳过版本提升。归档完整性只相对于 manifest 捕捉的范围；离线检查不会发现之后新增的 tag。未被检查的 per-tag 页面仍可能包含人工摘要错误。

**完成信号**：`verify-persistence-releases` 输出 26 条记录、25 个相邻迁移并全部通过；`doc-sync` 通过；任何 `--write` 都只刷新已验证的生成区域。

---

来源：deepseek-harness/docs/persistence-changes/releases/README.md:1-103@687f282e
来源：deepseek-harness/docs/persistence-changes/releases/manifest.json:1-162@687f282e
来源：deepseek-harness/scripts/persistence-releases.ts:1-257@687f282e

<a id="session-migration"></a>

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/benchmarks/session-open/session-open.bench.ts:340-400@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:173-185@687f282e`、`deepseek-harness/snapshots/session/headless.snapshot.ts:1014-1129@687f282e`

## 13. 相邻迁移、代际保留与读写规则

### 13.1 一个整数、方向感知、无降级承诺

**【源义务】**

- 一个单调整数，不做 major/minor；某一步是否可自动升级由“是否存在该 adjacent upgrader”表达，不由编号形状承诺。
- 同版本：正常读。
- 读到**更新**版本：拒绝，消息必须指出方向（“written by a newer harness — upgrade”），并指向 raw log，让用户仍能看文本；使用 `SessionFormatUnsupportedError`，与“损坏”区分。
- 读到**更旧**版本：每个 event-body 操作先在内存跑完整相邻链；源路径、字节、inode 不变。read handle 可直接消费当前逻辑结果；write open 必须在 append 前把最终当前代际以其规范版本文件名**独占发布**。
- header-only `stat`/`list` 不打开 body、不发布，只翻译支持的历史 header，并报告数值最高的规范代际。
- catalog 生成和模块初始化拒绝缺失相邻步；已发布的首方构建不得暴露部分历史链。
- 保留低代际不是自动 fallback，也不是 downgrade 兼容承诺。

**【源义务】未知 event 的处理是读侧安全边界。** 事件词汇由 mounted plugins 决定，一个版本整数描述不了它。reader 遇到不在已知集合里的 event type 时，默认**拒绝解释**；只有 envelope 明确带 `ignorable: true` 才可跳过。默认必须是 required：忘记 marker 只会过度拒绝一个本可恢复的 session（可见的不便），而默认 ignorable 会把同一错误变成静默恢复一个被掏空的 session（安全失败）。已知集合由 `gen-persistence-catalog` 从所有 `SessionEventMap` merge 生成 `KNOWN_SESSION_EVENT_TYPES`，`verify-persistence-catalog` 保持其新鲜；首方 writer 不通过 `Session.append` 设置 `ignorable`，外部插件是当前消费者。危险 unknown 恰好是非 surface event，因为它们改变其余日志的读法。依据：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:21-31@687f282e`。

依据：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:14-31@687f282e`；`.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:114-118@687f282e`、`:240-240@687f282e`。

### 13.2 代际保留

**【源义务】** 迁移**从不移动、替换或删除已提交代际**，只写最终当前目标；中间版本只存在于 stage 状态。规范文件名编码物理代际：v0 是 `session.jsonl[.zstd]`，正整数代际是 `session.vN.jsonl[.zstd]`。POSIX 发布用 hard-link + directory sync；Windows 用 no-overwrite、write-through `MoveFileExW`。目标已存在时，只有已验证迁移前缀等于 staged 字节才接受；append tail 属于当前代际读取，不参与 migration winner 验证。依据：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:114-118@687f282e`。

**失败处理**：发布过程中一旦 `publish()` 开始，编码、Worker 验证、发布不接收调用方取消，必须跑到结算；已发布代际永不回滚。写入源不变；拒绝时不得截断、覆盖或发布 successor。依据：同 Note `:106-108@687f282e`、`:174-176@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:1-251@687f282e
来源：deepseek-harness/scripts/gen-session-format-catalog.ts:1-261@687f282e
来源：deepseek-harness/docs/cookbook/adding-a-session-format-version.md:1-153@687f282e
来源：deepseek-harness/packages/session/session-format-v3-to-v4/README.md:1-350@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e
来源：deepseek-harness/benchmarks/session-open/session-open.bench.ts:340-400@687f282e
来源：deepseek-harness/snapshots/session/headless.snapshot.ts:173-185@687f282e
来源：deepseek-harness/snapshots/session/headless.snapshot.ts:1014-1129@687f282e

<a id="session-migration-preparation"></a>
### 13.2a 准备先于发布：只读打开不落盘，写入前才发布

**【源义务】** 历史读取与首次写入的时序被拆成两个阶段；拆分本身有硬约束：

- **read open 只做逻辑准备**：读取一个稳定历史 revision，跑完整 Stage 链一次，返回当前 artifact；不编码、不写临时文件、不 sync、不启动完整 Worker、不发布、不重开 committed generation。只读消费者不需要可写存储，也不会为了显示历史而创建 successor。
- **PreparedJsonlMigration** 暴露 `sourceIdentity`、`artifact` 与 `publish()`。`publish()` 幂等：并发/后续调用共享一个 terminal Promise（包括 rejection），同一 prepared artifact 不能编码两次。
- **发布协议**：流式写同目录独占临时文件 → sync → 有界 Worker verifier → 比较 prepare 时捕获的 source identity → 以 no-overwrite 发布 canonical path。成功发布者复用 prepared logical artifact，不重新 Decode 目标；竞争失败者必须验证 winner 以精确的 staged migration prefix 开头，append tail 仍由 current reader 校验。
- **Worker permit 的生命周期**：publication verifier 当前进程级并发上限为 2。成功 message 只暂存结果，必须等 natural zero exit 才成功；operation 成功或拒绝后都释放 permit，直接交给最早 waiter，后来者不插队。排队 abort 移除 waiter 且不启动 Worker。active abort/error 等失败路径先等待 `terminate()` 结算，清理失败用 `AggregateError` 保留原始与清理错误；首个终止路径获胜，迟到事件不改变结果。
- **Worker 响应边界**：只先检查非 null object 与 boolean `ok`；`ok:false` 用 message 构造错误、可选保留 stack；invalid response、Worker error、未报结果便 exit 或成功报告后 nonzero exit 都拒绝。依据：`deepseek-harness/packages/session/session-persistence-jsonl/src/migration-verifier.ts:21-198@687f282e`；`deepseek-harness/packages/session/session-persistence-jsonl/tests/migration-verifier.spec.ts:121-259@687f282e`。
- **write open 必须发布后才能 append**：先取得 process-local claim 与跨进程 lease，重解析 generation；若仍是历史格式，加入/复用 preparation 并 await `publish()`，之后才返回写 handle。`append`/`flush`/`close` 保持普通 current-generation 行为，不需要 “publishing” 分支；service `flush()` 不把只读 preparation 变成写。
- **单飞与取消**：准备按 Session id + source path + stat-derived revision 单飞；新 open 只有在 path 与 revision 仍匹配时加入。每个调用者的 `AbortSignal` 与共享 Promise 竞速，但不转发给共享工作；只有最后一个 waiter 离开且准备仍在运行时才 abort backend-owned controller。已完成结果进入有界 `coldLogMemo`；in-flight map 只拥有运行中的工作。
- **源漂移是终止条件**：source identity 变化抛 `JsonlGenerationSourceChangedError`，删除临时文件，不重复 Decode/迁移；已展示给读者的逻辑历史不能被静默替换。winner collision 也按 prefix 验证，不覆盖。
- **read handle 过渡**：初始服务 `state.primed` 的 prepared events；current generation 出现后清空 primed、读 current 并强制 non-shrinking history。`resolveCurrentLog()` 返回 `undefined` 只表示没有 current canonical file，不表示 Session 不可读。
- **follow 与 promotion**：`session.follow` 先用 read path 恢复 Session/projection 并发出 opening snapshot，再启动 Agent promotion；Agent resume 走 write open，因此必须等发布完成才接受新 turn。
- **验证边界**：只读 restoration 只验证 runtime 需要的 event/settlement 字段，不展开每个 embedded Assistant stream；publication Worker 仍做完整 stream replay 并校验 content/usage/replay-state agreement。
- **只有 write open 调用 `publish()`**：没有自动后台发布，避免无人拥有的任务、shutdown 清理和第二个 durability 状态。

依据：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-read-only-session-migration-preparation.md:1-170@687f282e`。

**完成信号**：只读打开历史不产生 successor；并发 read/write 共享一次 Decode/Stage；发布后 read handle 切到 current 并能观察 append tail；source 漂移/Worker 失败/winner 冲突时 write open 拒绝且源不变。**关键限制**：prepared artifact 会保留一个有界迁移 event array；dispose 对未返回的 create/open 仍无所有权；116MB 性能数字是历史测量，本次未重跑。

Worker scheduler/取消测试替换了 `node:worker_threads`：它们证明 permit/FIFO/结算顺序和 `terminate()` 调用，不证明真实线程在 abort 后已拆除或资源已释放，也未直接断言失败后的 permit 复用。本次只读源测试，未执行。

### 13.2b 迁移触发的 UI/投影门

**【源义务】** 并非所有冷 Session 都必须先迁移。侧边栏 row-menu fork 的请求带 `allowMigration: false`，Host 先读 `stat` format：只有源格式**需要迁移**时拒绝，并给 app-wide Toast 提供“打开原 Session”；打开只导航，不自动重试 fork。缺失 live Session 或未打开的 Client history 不是拒绝理由；其他 fork 调用者省略该选项，允许自动迁移。

`session.projections` 也先检查 stored format：current cold history 仍走原 observation flow；需要迁移时返回 `kind: migration-required` 提示，Client 保留该 read state，cached hint 不能替代 history/control 发布的 sequenced 值。`stat` 的 `formatStatus` 描述 stored format，`header` 仍是 current logical format；它不表示迁移任务进度。create/adopt、full-text search 与普通 history opening 允许自动迁移。依据：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e`。

### 13.3 相邻迁移包与 catalog 校验

`gen-session-format-catalog.ts` 对每个 `packages/session/session-format-v*-to-v*/package.json`：

- 必须有 `dsh.sessionFormatMigration`，且只允许 `from/to/export/migration/sourceCodec/targetCodec/targetHeaderValidator/targetRestorer`；
- `to === from + 1`；包名必须 `@deepseek-ai/dsh-session-format-v<from>-to-v<to>`；目录名必须匹配；
- 从 v0 到 current 每个整数**恰好一个**迁移包，且声明数恰好等于 current；
- 相邻包：后一个的 `sourceCodec` 必须等于前一个的 `targetCodec`，且必须依赖前一个包以共享 codec；
- catalog 包必须通过 peer + dev 共享 `@deepseek-ai/dsh-session`，并依赖每个迁移包；
- 生成文件包含直接 import，使历史可读性不依赖 mounted plugins；`--check` 比较字节，stale 即失败。

依据：`deepseek-harness/scripts/gen-session-format-catalog.ts:49-261@687f282e`。

**完成信号**：`pnpm run verify-session-format-catalog` 通过；`pnpm exec vitest run scripts/gen-session-format-catalog.spec.ts packages/session/session-format/tests packages/session/session-format-v2-to-v3/tests packages/session/session-format-catalog/tests` 通过；新增边的测试路径已加入 focused run。

### 13.4 新增一个格式版本的步骤（源内 cookbook）

**【源义务】** 顺序不可省：

1. **写 worker/codec**：新增 `SESSION_FORMAT_VERSION=N+1` 的所有读写路径，保持旧 codec 为不可变历史；旧 reader 不得 fallback。
2. **加相邻边**：新增 `session-format-vN-to-vN+1` 包，声明 header migration、target header validation、`createStage()`；RESTORE 只走 catalog，不复制旧 codec。
3. **实现 per-stage 与验证**：stateful synchronous stage，`emitEvent`/`emitRun`，`finish()`；每个 artifact 独立 stage，不跨 Session 共享；严格恢复用 `sessionFormatCatalog.createRestore(header, { recovery: 'strict', validation: 'current' })`，按行喂入并 `finish()`。
4. **更新当前消费者**：Session 创建/恢复、JSONL 文件名选择与发布、catalog current encoder/restorer、projection-cache 生成身份、replay/snapshot 归一化、物理 fixture 布局、TS/Python SDK recordings。用 writer 常量表示“当前”；历史 codec/fixture 保留字面版本。请求 wrapper 的 `sessionFormatVersion` 与外侧 schema 版本不同；projection 状态版本也不替代缓存身份。
5. **生成 snapshot successor**：读 `snapshots/AGENTS.md` 和 snapshot library；每个历史文件保留；用目标版本的 canonical parent/child 文件名；不得把前代重命名成目标文件名或只改 header。未变输入用 keyless refresh，再 replay without write-back；先实现并接线 N+1 再用它生成。用 `test:snapshot:refresh`/`test:snapshot` 只跑 owning scenario。
6. **验证**：`verify-session-format-catalog`、focused Vitest、`test:snapshot scripts/session-snapshot-corpus.corpus.ts`；再加 changed JSONL/replay/projection/SDK tests 与 built publication-Worker smoke（若该路径变了）。必须覆盖 strict 迁移、骨架身份保留、malformed/unknown-required 拒绝、重复恢复确定性、并发 stage 独立、seeded multi-hop cuts、前代字节不变、无 fallback。
7. **文档**：更新 owning Agent Note，不新增重复决策记录；release record 在发布前不动；发布后按 §12 更新；双语同步，`verify-translation-pairing --write`，再 `test:docs`、`doc-sync`、`lint`、`git diff --check`。

依据：`deepseek-harness/docs/cookbook/adding-a-session-format-version.md:1-153@687f282e`。

来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-read-only-session-migration-preparation.md:1-170@687f282e
来源：deepseek-harness/.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e

<a id="session-batch-migration"></a>
### 13.4a 批量迁移命令的运维契约

**【源义务】** `pnpm run migrate:sessions-to-v4` 是一次性 contributor command，不是后台自动迁移。它默认根 `~/.dsh/sessions`，不使用模型或 API key；扫描前断言 `SESSION_FORMAT_VERSION===4` 且 `sessionFormatCatalog.currentVersion===4`，否则直接失败。依据：`deepseek-harness/scripts/migrate-sessions-to-v4.ts:1-38@687f282e`、`:174-188@687f282e`。

**发现与打开**

- 只接受 `<root>/<project>/<session>/<generation>`；根级或 project 内直接出现的 `.jsonl`/`.jsonl.zstd` 记为 `unsupported flat-file layout`；不跟随 project 或 Session symlink；无 canonical generation 的目录计为 `skipped`。依据：同文件 `:84-137@687f282e`。
- 每个 Session 选择数值最高的 generation（同版本按文件名排序）；目录名必须能由 `encodeSegment` 规范还原，否则报错。依据：同文件 `:84-100@687f282e`、`:139-146@687f282e`。
- 已 V4 的 Session 以 `read` 打开；旧代际以 `write` 打开，由 persistence 发布 successor。命令不移动、覆盖或删除任何源代际。依据：同文件 `:220-232@687f282e`。

**并发、失败与重试**

- `--jobs` 必须是正 safe integer；默认 `min(availableParallelism(), 16)`。worker 数不超过输入数；单个 Session 失败记录后继续处理后续 Session。依据：同文件 `:148-170@687f282e`、`:286-300@687f282e`。
- 只有 `JsonlGenerationSourceChangedError` 的首次尝试会延迟；等所有初始 worker 结算后，按索引升序**串行重试一次**。其他 worker 的意外 rejection 会 drain 活动 worker 并中止 retry pass。依据：同文件 `:148-170@687f282e`。
- 失败分类器只从既有错误文本提取 `reason`（`unexpected_member`/`unknown_event`/`sequence_gap`/`source_changed`/`write_locked`/`unsupported_input`/`corrupt_log`/`other`）、错误名、event/member/child 与 sequence 坐标；**分类不改变 admission**，也不推断历史原因。依据：`scripts/migration-failure-summary.ts:1-43@687f282e`。

**证据与退出码**

- log 与 summary 写入 `mkdtemp` 的私有临时目录；log 以 `wx` 0600 创建，summary 以 `wx` 0600 创建。log 记录 git HEAD、node/platform/arch、root、jobs、逐输入 START/DEFERRED/RETRY/FAILED 与完整错误栈；summary 是 schemaVersion 1、targetVersion 4、inputCount、jobs、started/finished、checkoutCommit、runtime、textLogPath、summaryPath、totals、bySourceVersion、failureGroups（每组含逐项 inputPath）。依据：同文件 `:170-270@687f282e`。
- 任何 failure 使 exit code 为 1；缺根目录记为 failed；已成功的 successor 不回滚，失败输入源文件不变。重跑时已 V4 的 Session 只读打开，目标字节不变。依据：同文件 `:230-270@687f282e`；`scripts/migrate-sessions-to-v4.spec.ts:180-243@687f282e`。

**测试覆盖**（已读，未执行）：并发峰值不超过 `--jobs`、10k 输入不越界、单 job FIFO、source-change 在初始 pass 后只 retry 一次、V0/V3→V4 且源字节不变、重跑只读且目标字节不变、parent/child catalog 串行/并行一致、坏 Session 不阻断后续、失败按 sourceVersion 分组、sequence 坐标保留、torn V4 tail 不修复、symlink/flat-file 拒绝、`--help`/非法参数/缺根。依据：`scripts/migrate-sessions-to-v4.spec.ts:1-450@687f282e`。

**完成信号**：日志与 summary 已写；totals/bySourceVersion 与逐输入状态一致；失败分组可定位到 inputPath；退出码与是否有 failure 一致；重跑不改变已迁移字节。**失败处理**：按 failureGroups 修复/排除输入后重跑，不要改源或删摘要；source-change retry 仍失败按 FAILED 处理；缺根/非法参数在扫描前失败。**证据限制**：本次未执行上述测试；真实用户损坏语料、超大目录、Windows symlink/junction 语义与日志权限未实测。命令只面向 V4，是版本升级工具，不承担降级/回滚。

### 13.5 最终 V3 词汇（格式切换期）

当发布格式仍是 V3、集成 writer 已是 V4 时，master 仍可增加合法 V3 event。每次 master 集成后、首次 V4 发布前，用 `verify-v3-event-vocabulary --source-ref <commit>` 比较迁移拥有的 `RELEASED_V3_EVENT_TYPES` 与“最后一个 V3 writer 提交”。它只读该本地 commit，要求 event 名精确相等；拒绝缺失、额外复制、source writer 不是 V3。V4-only 的 `developer/message` 不得进入冻结 V3 集。命令不 fetch、不证明远端新鲜；release operator 必须确认该 commit 是集成中包含的最后一个 V3 writer，并记录 checked id。依据：`docs/cookbook/adding-a-session-format-version.md:68-153@687f282e`。

**例外**：V4 发布后，V3 词汇绑定到该历史 source；后续 V4 event 新增不更新它。常规静态 CI 不依赖可变 master ref。

### 13.6 V3→V4：命名转换、证据补全与拒绝面

**【源义务】** 完整规格在 `packages/session/session-format-v3-to-v4/README.md`。该边只做下列**具名**转换，并补足有证据的 parent catalog / interrupted turn；它不创建 system prompt、developer event、tool execution 或 replacement message。V0–V2 输入先走自己的边到 V3，再进入本边。每个 restore 有独立 stage；partial emission 不是成功，后续 row 或 `finish()` 仍可拒绝。依据：`deepseek-harness/packages/session/session-format-v3-to-v4/README.md:1-350@687f282e`。

- **Header/framing**：逻辑 V3 header 的 `version: 3` 改为 `4`，其他字段保留；先跑 released V3 header validation。V3 physical rows 由前一包 codec 解码；V4 physical rows 复用 released V2 framing 并做 native V4 admission，不把 V4 event 投进 V3 semantic validator。不重命名 preset id、PTC dispatch event、file attachment 或物理文件名；stream 顺序/index 不变。
- **Tool-result lift**：只转换 source role 为 `user` 的 `tool/result` message。要求非空 message id、`source: { kind: 'tool', callId }` 且 callId 非空、恰好一个同名 `tool-result` block、block content 为数组、可选 `isError` 为 boolean。结果：role 改 `tool`，`toolCallId`、content、`isError` 上移；删除 wrapper；wrapper 其他字段变 `plugin:result:<原名>`，message 其他外层字段变 `plugin:message:<原名>`；不 mint id。malformed wrapper 报错；嵌套 tool-result 不支持并拒绝，不发布 successor。
- **Extension/stream**：未知 V3 content tag 变 `plugin:<原 type>`；stream start 的 `blockType` 同规则；已有前缀会再次加前缀，保持旧名区分。arguments、replay state、plugin content 字段不遍历。request-tool definition 若自身顶层有 `deferLoading`，拒绝 V3 迁移（该字段只在 V4 定义）；嵌套 parameter 不变。
- **Message source**：walker 只访问具名位置：`user/message.data`；`system|assistant|tool/result` 的 `data.message`；`agent/inbox/spliced` 的 `data.inserted[]`；`session/title-llm-request` 的 `data.messages[]`；`developer/message` 仅 native walker。plugin source 要求字符串 `plugin`（含空串），转换删除该属性、替换 kind、保留其他字段；direct source kind 必须非空字符串。精确映射：`compact`→`compact-checkpoint`，`tools-code-mode|tools-ptc`→`ptc-mode`，`dsh-compaction-basic`→`compact-basic`，系统提示插件按 role 分 `system-prompt`/`runtime-context`；同名 first-party producer（`agent-instructions`、`session-reference`、`team-message`、`goal`、`skill-invocation`、`skill-catalog`、`coordinator`、`subagent-report`、`subagent-settled`、`webhook`、`agent-message`、`model-selection`、`plan-mode`、`time-context`、`tmux-context`、`user-approval`、`repeat-tool-reminder`、`tool-cordis`、`cordis-host-runner`、`tool-goal`、`tool-jobs`、`hooks-codex`、`hooks-claude-code`、`schedule`、`dsh-session-title-llm`）保留原名；其他一律 `plugin:<完整原名>`。不从 message 文本、tool 参数、配置或当前文件推断缺失元数据；不做递归搜索。
- **Parent catalog**：只收集直接 subagent child 的 id、creation time、inherited cut 后自己的 descriptor 数量与首个 descriptor。descriptor 恰一个 v1 → 要求 provider/label 字符串并派生 `continuable`；一个 v2/v3 → 按 provider/mode/optional label；零个或 unsupported version → 保留已有 parent entry，否则追加 unknown-mode；多于一个 → 保留已有 entry（不比较 mode/label），否则 unknown-mode。已有 own parent entry 保留及其 extensions，并要求 child creation time 与恰一个 supported own descriptor 的 mode/label 匹配（若有）。缺失 entry 且有完整证据 → v0 catalog fact；无完整证据 → v1 unknown。catalog v0/v1 要求 childId、非负安全整数 childCreatedAt、mode `continuable|one-shot`（v1 另可 `unknown`）、continuable 的 string label；v2 只允许 `external` + optional string label。重复 child id 拒绝。继承 cut 前的 catalog 候选全部丢弃；缺失项在所有 source event 之后按 creation time、child id 排序，用 dense 新 sequence（time 为最后 source event 的时间，空日志用 header creation time）；不进入 model surface、不改 inherited count。storage 负责识别 direct child、在 preparation/memo/publication 重查 membership 与物理 revision；本迁移不迁移 child catalog、不从 tool 参数恢复已删除 child。
- **Interrupted turn/reference**：只有“open turn 且无 open step；下一个 numbered `turn/start` 紧跟在为该 `next-turn` 的非空 `agent/inbox/spliced` 之后”才插入 `turn/end`（reason `interrupted`，使用该 start 的时间戳）。其他 turn 顺序错误、unresolved tool、active compaction 仍由 target validation 拒绝；open tail 保持 open，native V4 不做此修复。插入会 dense 重编号后续 envelope，并只重映射同 artifact 的审计引用：`sourceEventSeqs`、replacement 的 `startSeq/endSeq`、command completion `sourceEventSeq`、title `messageSeqs`、compaction `shadowedRange/shadowedSeqs`、image-offload target `seq`；Session 引用、generation-qualified delivery 坐标、turn/step 号、stream/image index、id 和任意 JSON 保持原值；未知 ignorable event 只改 envelope seq。无插入时 source 坐标不变；追加 catalog 只扩展 suffix。
- **Seed cut**：最后一个 `inherited: true` 的 `session/end-seed` 定义 inherited event count（不含该 marker）；target count 包含 marker 前插入的事件。supplied source cut 必须与原始 V3-stage marker 位置一致（即使前面 V0–V2 已重映射）；缺失 tagged marker、unseeded Session 带 inherited marker、cut 越界都拒绝。unseeded stage 在 EOF 前暴露 0；seeded 在 `finish()` 前未知；未标 `inherited` 的 marker 不定义 fork inheritance。
- **Delivery generations**：任何被解释的 `session-log-deepseek/delivery-accepted` 的 generation 必须是非负安全整数，省略表示 V0。V3 source marker 声称 generation 4 → 拒绝（推进 header 不能激活 target generation watermark）；声称 3 → 要求非空 Session id 与 marker 前的非负安全整数 `throughSeq`，外来 id 只允许在 inherited cut 前且带 `parentSession`；其他 generation（含 >4）保留 event type/payload 坐标，在 V4 中不激活。native V4 的 generation 4 marker 做同样的 earlier-coordinate/Session ownership 检查；历史 marker（含 3）保留坐标与身份，不作为 V4 acceptance watermark。delivery payload/event type 不被改写；更高版本 migration 拥有未来激活检查。
- **Source audit/refusal**：stage 前先做 V3 physical decoding 与 header validation；stage 检查 dense sequence、source cut、canonical tool-result wrapper、named plugin source、delivery ownership、supplied catalog evidence。它**不**跑完整 released V3 semantic restorer，也不复制 V2→V3 的 event/content allowlist；physical parsing、stage conversion、target restoration 是三个不同检查。固定 `RELEASED_V3_EVENT_TYPES` 独立于当前 writer；未知 required V3 event type 在解释 payload 或查 V4 词汇**之前**拒绝（包括 V4 也认识的名字）；未知 ignorable 变 `plugin:<原名>`、payload 不变。没有通用 source-schema validation，也没有递归 numeric-field inference。只有 canonical V3 `tool/result` wrapper 有 preserving conversion；retired `tool-result` block 出现在其他被解释位置时，由 target admission 拒绝，不保留成非法 V4 block；native V4 在 recoverable suffix suppression 前做同样 tag 拒绝。检查只覆盖直接 block tag，不扫描 arguments/replay/schema/nested metadata/unknown ignorable payload。direct stage 对 malformed data 抛 `SessionFormatError`，对无可 preserving conversion 抛 `SessionFormatUnsupportedMigrationError`；catalog 把 stage 失败包装为 unsupported migration，transformed-target 失败也归该类；strict current 直接报 target failure。
- **Native V4 admission**：输入已标 V4 时**永不运行** V3→V4；native validation 保留原事件/同一 artifact，不合成 catalog、fork result、developer change 或修复字段。逻辑 header 必须恰有 `version,id,createdAt,isSeeded,delegationDepth`，可选 `cwd,parentSession,origin,agentPreset`，无其他 key；version=4，id 字符串，时间/深度非负安全整数，seeded boolean，cwd 绝对，origin 只可为 `subagent`。Event envelope 必须有 `type,seq,time,data`，只允许可选 `surfaceOp,sourceEventSeqs,ignorable`；seq dense 非负，time 安全整数，`ignorable` 出现时必须恰为 true。五个 surface event 都要求 `surfaceOp`；`sourceEventSeqs` 必须是非空、唯一、更早的非负 seq 数组，且 `assistant/message` 必须省略它；replacement 必须恰有 `op:'replace',startSeq,endSeq`，旧 endpoint 名/混合拼写/额外 key 拒绝。
- **Native message/tool/developer/fork**：tool result 要求 role `tool`、非空 message/call id、匹配的 `source.kind:'tool'`/`source.callId`、直接数组 content、无 retired wrapper、`isError` 存在时为 boolean；`data.error` 要求 `isError:true`。interpreted message source 必须是对象、非空且非 `plugin` 的 kind；unknown attribution 与自有 JSON 保留，但不授予 producer runtime authority。developer `tool-addition/removal` 要求非空 toolName；addition 拒绝任何自有 inline `tool` 字段。含 addition 的 event 必须有 `headerSeq`，指向更早的已知 `request/header`，每个名字必须在该 header 恰好一个 definition 中匹配 string description + object parameters；缺失/forward/类型错/未知/歧义/不完整都拒绝；无 addition 的 event 必须省略 `headerSeq`。request header 中 `deferLoading` 出现时必须恰为 true。fork 的 synthetic `TOOL_NOT_STARTED`/`TOOL_OUTCOME_UNKNOWN` result 按其专门规则校验，不推断 ancestry、不执行 tool。
- **Validation entry points**：native catalog `validation:'transformed'` 只做 codec 检查、跳过 restoration，**不是**完整 native validation；historical catalog transformed 做 conversion + generation-owned V4 restoration，跳过 installed common Session validation；`validation:'current'` 再加 installed current Session header/envelope/message/surface/projection 检查。fixtures 与 publication verification 用 strict recovery。native JSONL scanner 在 suppression 前提供 installed vocabulary，并在暴露 accepted prefix 前跑 mandatory V4 relationships。
- **已知限制**：unsupported source form 可失败且源不变；first-party recordings 不枚举第三方扩展；nested historical tool results 当前拒绝；parent 无法从自身恢复未记录的 child id/creation/descriptor，删除的 child 不能从 tool 参数重建；unknown historical mode 会写 unknown；facts 只覆盖同一 persistence root 内可识别 child；cross-root import 与 corrupt-log repair 不在本迁移。native common admission 不按完整生成 schema 校验每个 user/tool/developer content block；unknown block kind/未检查字段可能通过 storage，但仍被 provider 拒绝。

**完成信号**：V3→V4 strict restore 成功且旧代际字节不变；tool-result/消息 source/extension 转换逐项符合上表；所有 inserted/renumbered 引用一致；native V4 current validation 通过；拒绝时无 source mutation、无 partial successor、无 fallback。

**失败处理**：unknown required event / malformed wrapper / nested result / unsupported descriptor / duplicate child id / delivery generation 4 → 保留原日志并明确拒绝；不要通过放宽 `ignorable`、删事件或复制 V3 validator 来“修好”。需要新增支持时先加 converter 测试与 V4 可兼容输出，再按 §13.4 走新边。

---

来源：deepseek-harness/scripts/migrate-sessions-to-v4.ts:1-303@687f282e
来源：deepseek-harness/scripts/migrate-sessions-to-v4.spec.ts:1-450@687f282e
来源：deepseek-harness/scripts/migration-failure-summary.ts:1-43@687f282e

<a id="persistence-records"></a>

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/persistence-changes.ts:1-22@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:41-534@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:636-645@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:717-792@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:880-923@687f282e`

## 14. 持久化类型变更：记录、兼容决策与定稿

### 14.1 每个结构差异都要确认

**【源义务】** 根覆盖 logical Session header、physical JSONL header line、event envelope、每个仓库声明 event；被引用类型传递进入受影响 root 的 digest。每个 dated record 有四个 sibling：英文 acknowledgement（`kind: persistence-change`，一个 machine declaration，Compatibility/Verification 证据）、中文对照（machine declaration 必须相等）、生成的 `.i18n.yaml`、生成的完整 after schema。新 root 无 predecessor；删除无 after schema，但保留显式 tombstone。依据：`deepseek-harness/docs/persistence-changes/README.md:25-52@687f282e`。

第一次 baseline 记录完整初始 inventory；后续以 predecessor 的 after schema 为 before。verifier 拒绝缺失 predecessor、环、同一 root 的重复 successor、digest 不匹配、当前 root 与最新记录不一致。独立 root 可独立前进；同一 predecessor 两个变更必须在集成后合并成单一有序历史。依据：同 README `:83-90@687f282e`。

当前 acknowledgement 扫描只读 `docs/persistence-changes/` 顶层英文 `.md`（排除 README、AGENTS 和 `.zh.md`）及 `.schema.json`，不递归读取 `historical-formats/` 等嵌套归档；嵌套文档/schema 不进入当前链的双语机器块或未引用 snapshot 检查。依据：`deepseek-harness/scripts/persistence-changes.ts:645-650@687f282e`；`deepseek-harness/scripts/persistence-changes.spec.ts:674-682@687f282e`。

### 14.2 兼容性决策表

| 检测到的变化 | 记录要求 |
| --- | --- |
| 增加 optional event-body property（含完整子树） | `same-version` |
| required event-body property 改为 optional | `same-version` |
| 新增普通 event root（`kind=event` 且 `surface=false`） | `same-version` |
| 新增 surface event root、新增非 event root，或删除任意 root | 兼容性审查后 `same-version`，或显式 `version-bump` |
| 普通 event 增加更高数值 `data.version`，同时保留所有旧 payload alternative 且旧规则下仍可读 | `same-version` |
| 给 user/developer source slot 增加显式限定的 attribution kind，before/after schema 的 supported policy 相同 | `same-version` |
| optional 改 required、增加 required property、改变现有类型、删除/重命名 property 或 event | 兼容性审查后 `same-version`，或显式 `version-bump` |
| 改 SessionHeader / JsonlHeaderLine / SessionEventEnvelope（包括增加 optional property） | 兼容性审查后 `same-version`；header version 变化必须 `version-bump` |

依据：`deepseek-harness/docs/persistence-changes/README.md:47-75@687f282e`。

root 添加/删除及 header/envelope optional property 的精确边界见 `deepseek-harness/scripts/persistence-changes.ts:385-390@687f282e`、`deepseek-harness/scripts/persistence-changes.spec.ts:568-577@687f282e`。

**判定标准**：以 reader 行为为准，不以“schema 有差异”自动 bump。same-version 允许三种情况：旧 reader 能正确恢复；能安全忽略 optional feature 并保留记录；能在执行、变更或 tail repair 前拒绝 required feature。feature 缺失必须保持旧行为；required refusal 必须有 upgrade diagnostic。新 reader 必须保留历史含义并接受同一 Session 内 old/new 混合表示。没有有效 discriminator 阻止不安全解释时才 bump。依据：`.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:6-23@687f282e`。

**重要限制**：classifier 只识别“需要审查”的结构变化，不能证明语义安全；same-version 需显式 `--decision same-version`。checker 只校验 decision 与 schema，不证明解释符合运行时行为；reviewer 必须比较 base/head inventory，而不是只跑 current-tree `--check`。依据：同 Note `:17-31@687f282e`；README `:66-75@687f282e`。

来源：deepseek-harness/docs/persistence-changes/README.md:1-90@687f282e
来源：deepseek-harness/docs/cookbook/reviewing-persistence-type-changes.md:1-122@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-39@687f282e
来源：deepseek-harness/docs/session-format-status.md:1-63@687f282e
来源：deepseek-harness/scripts/persistence-finalization.ts:1-168@687f282e
来源：deepseek-harness/docs/persistence-changes/finalized/v4.json:1-20@687f282e
来源：deepseek-harness/docs/persistence-changes/finalized/v4.json:340-379@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:23-40@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:535-635@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:646-716@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:793-879@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:1-22@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:41-534@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:636-645@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:717-792@687f282e
来源：deepseek-harness/scripts/persistence-changes.ts:880-923@687f282e

<a id="persistence-schema-policy"></a>
### 14.2a schema 策略：指纹域、显式 binding 与 `@persistenceReserved`

**【源义务】** 结构指纹只回答“是否变了”，schema 策略回答“这个变化是否被 reader 明确承诺、以及如何避免把展示细节当身份”：

- **inventory format 2** 把 supported compatibility metadata 与受影响 property 绑定：binding、policy version、literal discriminator、unknown-kind preservation promise、qualified attribution kinds。带 policy 的图使用**独立 fingerprint domain**；没有绑定 policy 的图保持 format-1 normalization/fingerprint。inventory version 描述 schema tooling，独立于 Session format version。
- **canonical graph + digest**：`canonicalizeSchema` 按 name 排序 object properties、按 key/value 排序 indices、去重并排序 union arms、丢弃不可达/双相似节点；`schemaDigest` 对 `dsh-persistence-schema-v1\n` 或 `v2\n` + canonical JSON 做 SHA-256。property/type names 与 source locations 是 metadata，不进入结构身份。依据：`scripts/persistence-schema-model.ts:100-185@687f282e`、`:277-294@687f282e`。
- extractor 只接受 **core-owned source declaration** 上的显式 binding，并要求每个 use 有 literal `user` 或 `developer` role。Producer annotations 只限定完整 wire-kind 组；classifier 只有**两份 saved schema 都带 matching promise** 时才允许 qualified new attribution kind。现有 kind 仍参与结构比较；removal、retroactive qualification、reserved identities 与无关 breaking change 仍严格分类。
- **保留 producer kind**：`RESERVED_SOURCE_KINDS` 中的身份（包括 `auto-review`、`compact-basic`、`ptc-mode`）不能出现在 `attributionKinds`；saved snapshot 声明即按 invalid source compatibility 拒绝。依据：`deepseek-harness/scripts/persistence-source-policy.ts:7-11,49-68@687f282e`；`deepseek-harness/scripts/persistence-changes.spec.ts:1017-1022@687f282e`。
- runtime owner 必须在激活 binding 前建立并测试 promised preservation behavior；tooling 不推断也不执行该行为。
- **`@persistenceReserved`** 只在 optional `never` 属性上保留一个无参数注解，使 reader 禁止的名字仍出现在 extracted graph；mapped use 使属性 required 或给 JSON 值时拒绝。被保留属性后来出现 JSON-valued 定义时，必须分类为“现有类型变化”，不能当成 additive optional field。
- current inventory 保留 authored names 与 source locations 作为描述性 metadata；structural digest 识别类型并提供 catalog anchors；catalog 按 literal `kind` 分组，保留每个 form alternative、required field、index signature 与完整定义链接。Bounded array label 描述元素，不继承第一个到达数组的 event；historical reference 保留 frozen rendering。
- `persistence-review` 接受显式 before/after inventory：digest 相同即 unchanged；changed alternative 只有在 literal discriminator 唯一识别时才匹配；**歧义保持为分开的 addition/removal**，不根据相似字段推断 rename。共享证据列出所有受影响 root，并保留 classifier 的权威诊断。普通注释、label、source location 不进入 structural identity。

依据：`deepseek-harness/.agents/notes/implemented/process/2026-09-17-persistence-schema-review.md:1-39@687f282e`；`.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e`。

**失败处理**：无 literal role 的 binding、mapped reserved 属性 required/JSON-valued、qualified kind 缺少双侧 promise、reserved identity/removal/retroactive qualification → 拒绝或严格分类；歧义 alternative 不得强行配对。**关键限制**：工具不证明运行时 preservation 或解释语义；`@persistenceReserved` 只覆盖 reader 禁止的 optional never 名字；历史 frozen rendering 不重写。本次未执行 persistence-review/inventory 生成或 runtime 测试。

### 14.3 生成、更新与定稿流程

**【源义务】** 推荐流程：

1. 把双语说明保存为 `.artifacts/persistence-change.prose.json`（`en`/`zh` 各含 `summary`、`compatibility`、`verification`）。
2. `pnpm --silent run persistence-changes --record YYYY-MM-DD-slug --prose <file> --json`：校验 history、双语 prose，推断已确立的 same-version 决策，检查显式兼容决策，然后生成 record pair、完整 after schemas、两边 catalog、machine inventory、pairing 记录。省略 `--prose` 会生成未完成 draft，verifier 拒绝，直到补全。
3. 对 `requiresCompatibilityReview` 的变更：Compatibility 必须解释两个 reader 方向，Verification 记录已执行检查；需要 `--decision same-version` 时显式传入。仅结构差异不自动 bump；header version 真增加可推断 `version-bump`；若没有有效 discriminator，走新增格式版本并 `--decision version-bump`，该记录必须包含自己的 `SessionHeader.version` 增长。
4. `pnpm run doc-sync`：检查 persistence inventory/catalog freshness、完整 history、双语配对。record 命令的 `ok: true` 不替代这些检查，也不替代 owner 的行为/迁移测试。
5. 提交/推送走正常 staged lint、pairing、whitespace hooks 与 pre-push typecheck。

依据：`deepseek-harness/docs/cookbook/reviewing-persistence-type-changes.md:1-122@687f282e`。

**更新未接受记录**：源码变了，用 `--update <id> --prose <file> --json` 刷新同一未接受 terminal record；不带 `--prose` 保留原解释。必须重新评估完整 transition，并对 flagged same-version 传 `--decision same-version`。update 拒绝 initial baseline、有依赖者的记录、finalized checkpoint 记录。finalized 之外，树不推断“已接受”；保留已接受历史并创建 successor。竞争 terminal records 时，先对剩余 history 更新未接受记录，再重评 diff。依据：同 cookbook `:80-122@687f282e`。

**定稿**：`createPersistenceFinalizationCheckpoint` 要求当前 schema 与完整已确认历史匹配；维护者写新的 `finalized/vN.json`，不替换旧 checkpoint，并推进 `latestFinalizedVersion`。finalized 保护 accepted machine declaration 与 after schema，排除 prose、alias、source location；它不冻结未来 V4 兼容新增，也不表示已发布。依据：`docs/persistence-changes/README.md:47-52@687f282e`；`docs/session-format-status.md:36-44@687f282e`。

### 14.3.1 finalized checkpoint 的实际机器契约

**【源义务】** `finalized/vN.json` 不是“所有已接受记录的列表”，而是一份**选定基线集合 + 语义摘要 + 该集合的根身份**。当前 `finalized/v4.json` 只锁 5 条记录（`2026-09-11-initial` 加 4 条后续），不是目录里全部 dated record。字段必须精确为：

- `schemaVersion: 1`
- `sessionFormatVersion: N`（必须等于文件名里的 N）
- `roots`: `{ [rootKey]: { kind, digest, event?, surface? } }`
- `acceptedRecords`: `{ [recordId]: sha256Hex }`

**摘要算法**（`recordDigest`）：对 `'dsh-persistence-finalization-record-v1\n'` 加一个 JSON 对象做 SHA-256；对象只含 `record` 与 `snapshot`。`record` 含 `schemaVersion`、`id`、`baseline`、按 root 排序的 `changes[{root,previous,after,decision}]`；`snapshot` 含 `formatVersion`、按 key 排序的 `roots[{key,...,schema}]`。prose、alias、source location 不进入摘要；root schema 进入。依据：`deepseek-harness/scripts/persistence-finalization.ts:1-68@687f282e`。

**创建**（`createPersistenceFinalizationCheckpoint`）：从 history 取所有非 null tip roots，必须与当前 inventory 的 roots 完全一致（排序后逐项 JSON 相等），否则拒绝；`SessionHeader` 的 schema 必须能解析出 literal、非负安全整数 `version`，否则拒绝。它只返回 checkpoint 数据，不写文件；写新 `vN.json` 是维护者流程。依据：同文件 `:71-84@687f282e`。

**加载**（`loadPersistenceFinalization`）按以下顺序拒绝：

1. `docs/session-format-status.md` 与 `.zh.md` 都没有 finalization 块、且 `finalized/` 无 `.json` → 返回 `undefined`；只要任一存在，英文与中文 `latestFinalizedVersion` 必须存在且相等。
2. 状态文件必须恰有一个闭合的 ` ```yaml session-format-finalization ` 块，块内**唯一** key 是 `latestFinalizedVersion`，值为非负安全整数；否则失败。
3. 必须存在 `v<latestFinalizedVersion>.json`；任何文件名捕获版本 > 当前状态版本、不是 `v(0|[1-9]\d*).json`、或 checkpoint 顶层 key 不是 `acceptedRecords,roots,schemaVersion,sessionFormatVersion`，失败。
4. 每个 accepted record id 必须匹配 `YYYY-MM-DD-slug`，digest 必须是 64 位小写 hex；对应 history entry 必须存在且 `recordDigest(entry)` 相等（记录被删除/改动即失败）。selected 不能为空，且至少一条 `record.baseline`。
5. selected records 的每个 `previous` 必须也在本 checkpoint 的 `acceptedRecords` 中（evaluated 形成 predecessor closure）；从 selected 计算 tip roots、排除已被 predecessor 覆盖的 `(recordId,root)`，再检查 checkpoint 的 `roots` 与该 tip 集合的 key/identity 完全一致；`writerVersion(tips)` 必须等于 checkpoint 的 `sessionFormatVersion`。

依据：同文件 `:86-168@687f282e`。

**关键限制**：该加载器只验证 checkpoint 所选的子集及其 predecessor 闭包，不要求包含目录中所有后续记录；因此“`v4.json` 通过”不等于“当前所有 V4 记录都已定稿”。它也不检查 Git 历史，不会阻止覆盖旧 checkpoint；“旧 checkpoint 不可替换”是流程/评审义务，不是这段代码的自动保证。checkpoint 不证明已发布，也不冻结未来兼容的 V4 新增。依据：`deepseek-harness/docs/persistence-changes/finalized/v4.json:1-20@687f282e`、`:340-379@687f282e`；`docs/session-format-status.md:36-44@687f282e`。

### 14.4 保留字段与 attribution

- reader 按名字拒绝某 JSON property 时，声明为 optional `never` 并标 `@persistenceReserved`（无参数）；extractor 保留 forbidden field，之后允许该 JSON value 必须走 existing-field type change。required 或 JSON-valued property 不能带该 marker。未标记的 optional `never`/`undefined` 保持既有 omission 行为。依据：`docs/persistence-changes/README.md:76-81@687f282e`。
- `@persistenceSource` 只对 literal user/developer role 的 core-owned source property 显式绑定，不能从无注解类型推断；producer 用 `@persistenceAttribution` 限定 `MessageSourceMap` entry，承诺 unknown kind + JSON metadata 在没有 producer 时仍可读，且该 kind 不施加 validation/replay/authority 要求。多项 context-form alternative 同 wire kind 视为一组。依据：同 README `:66-75@687f282e`。

**完成信号**：record 的 machine declaration 与中文完全相等；after schema 完整；catalog/pairing 生成；`doc-sync` 通过；兼容性解释覆盖 old-reader 与 new-reader 两个方向；Verification 是真实命令输出。

**失败处理**：`decision-required` → 补 `--decision same-version` 或改 version-bump；digest mismatch → 重新生成，不要手改 digest；predecessor 缺失/环 → 先修 history；已 finalized 记录被改 → 恢复 checkpoint 保护内容，创建 successor；record 生成成功但 doc-sync 失败 → 完成未完成的解释/配对，不能只删检查。

**证据限制**：digest 描述声明类型，不描述运行时校验/行为；注释、source location、alias、无害重排不影响 digest；opaque `unknown` 内部结构不可见；behavior-only change 不在该机制范围。checkpoint 不能证明“checkpoint 与 authority record 从未一起被编辑”。依据：同 README `:83-90@687f282e`。

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/scripts/persistence-review.ts:1-19@687f282e`、`deepseek-harness/scripts/persistence-review.ts:184-230@687f282e`、`deepseek-harness/scripts/persistence-schema-model.ts:1-99@687f282e`、`deepseek-harness/scripts/persistence-schema-model.ts:186-276@687f282e`、`deepseek-harness/scripts/persistence-schema-model.ts:295-321@687f282e`、`deepseek-harness/scripts/persistence-schema.ts:1-41@687f282e`、`deepseek-harness/scripts/persistence-schema.ts:134-209@687f282e`、`deepseek-harness/scripts/persistence-schema.ts:361-399@687f282e`、`deepseek-harness/scripts/persistence-schema.ts:481-512@687f282e`


来源：deepseek-harness/.agents/notes/implemented/process/2026-09-17-persistence-schema-review.md:1-39@687f282e
来源：deepseek-harness/.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:42-133@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:210-360@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:400-480@687f282e
来源：deepseek-harness/scripts/persistence-source-policy.ts:1-69@687f282e
来源：deepseek-harness/scripts/persistence-review.ts:20-183@687f282e
来源：deepseek-harness/scripts/persistence-schema-model.ts:100-185@687f282e
来源：deepseek-harness/scripts/persistence-schema-model.ts:277-294@687f282e
来源：deepseek-harness/scripts/persistence-review.ts:1-19@687f282e
来源：deepseek-harness/scripts/persistence-review.ts:184-230@687f282e
来源：deepseek-harness/scripts/persistence-schema-model.ts:1-99@687f282e
来源：deepseek-harness/scripts/persistence-schema-model.ts:186-276@687f282e
来源：deepseek-harness/scripts/persistence-schema-model.ts:295-321@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:1-41@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:134-209@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:361-399@687f282e
来源：deepseek-harness/scripts/persistence-schema.ts:481-512@687f282e

<a id="persistence-sqlite-schema"></a>
### 14.5 SQLite：物理库拒绝不兼容，派生索引只重置自己

**【源义务】** `AGENTS.md` 只说“SQLite uses monotonic `SCHEMA_VERSION`”，但仓库有两类 SQLite 数据库，兼容承诺不同，不能合并处理。依据：`deepseek-harness/AGENTS.md:7-7@687f282e`。

**A. canonical 物理存储（`storage-sqlite`）**

- `STORAGE_SQLITE_SCHEMA_VERSION = 1` 存在 `PRAGMA user_version`，描述物理表布局；它与 unit 自己的 `version`（存在 `units` 行）正交。只有 breaking table-layout change 才提升物理版本；注释明确当前 unreleased format “no migrations”。依据：`packages/storage/storage-sqlite/src/schema.ts:9-20@687f282e`。
- 打开顺序：`mkdir` 目录 `0700` → 文件以 `wx`、`0600` 独占创建（已存在则保留原 mode；非 `EEXIST` 错误传播）→ `DatabaseSync` 打开 → `foreign_keys=ON` → `journal_mode` → 读 `user_version`。0 表示未定型，仅在 `units`/`unit_globals` 建完后才盖当前版本；任何非 0 且非当前版本抛 `StorageError('version-mismatch')`，**不原地迁移、不重建、不降级**。失败时关闭句柄。依据：同文件 `:55-105@687f282e`。
- 权限限制：`DatabaseSync` 按路径重开；若另一主体能替换父目录中的数据库 entry，`0600` 不保证机密性/完整性。迁移文档不要把“独占创建”写成对恶意父目录的防护。依据：同文件 `:23-40@687f282e`。
- 测试：新库盖当前 `user_version`、建 STRICT 表；`user_version=999` 的库被 `version-mismatch` 拒绝。依据：`packages/storage/storage-sqlite/tests/sqlite-backend.spec.ts:69-85@687f282e`。

**B. 可重建派生索引（`session-query-sqlite`）**

- `SESSION_QUERY_SQLITE_SCHEMA_VERSION = 8` 描述全文检索派生索引；`SESSION_QUERY_SQLITE_APPLICATION_ID = 0x44534851` 保护无关数据库。派生索引可丢弃重建，canonical Session JSONL 仍是权威。依据：`packages/session-query/session-query-sqlite/src/schema.ts:1-11@687f282e`。
- 打开时先读 `application_id`、`user_version` 和 user tables，再决定：application id 非 0 且不等于本应用 → 拒绝；application id 为 0 且已有任何 user table → 拒绝（不认领“看起来空的”外来库）；application id 匹配但含未知 user table → 拒绝；只有 application id 匹配且表集合均在 `DERIVED_USER_TABLES` 白名单、版本不等于当前时，才 drop 这些派生表、把 `user_version` 归 0，随后重建。**绝不 reset canonical/foreign 文件**。依据：同文件 `:38-66@687f282e`、`:96-138@687f282e`。
- 先完成 foreign/canonical 拒绝，再应用 `journal_mode` 等 mutating pragmas；`journalMode` 是已验证的 closed union，不拼接任意 SQL。依据：同文件 `:59-66@687f282e`。
- 测试覆盖：把已识别派生库的 `user_version` 降一版 → 重建并升回当前；带无关表的库即使 `user_version=999` 也被拒绝且无关表/版本保留；当前版本但带无关表也拒绝；foreign canonical 表库拒绝。依据：`packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1319-1375@687f282e`。

**【源义务的边界】** “monotonic `SCHEMA_VERSION`”不是“自动迁移”。物理库的承诺是拒绝旧布局，派生索引的例外是允许受限重置。迁移到新仓库时，先给每个 SQLite 数据库写清“拒绝/重置/重建”策略及身份字段；不要把 Session JSONL 的相邻代际规则套到 SQLite，也不要把派生重置套到 canonical 存储。

**证据限制**：实现与 focused tests 已读，但本次未执行测试；未做损坏文件、部分写入、崩溃中断、并发打开、父目录替换或跨平台文件系统实验。测试通过也不证明所有 SQLite 版本行为一致。依据：上述文件。

---

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:1-8@687f282e`、`deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:21-54@687f282e`、`deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:106-119@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:1-37@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:67-95@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:139-173@687f282e`、`deepseek-harness/packages/storage/storage-sqlite/tests/sqlite-backend.spec.ts:1-290@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1261-1318@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1376-1500@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1570-1880@687f282e`


来源：deepseek-harness/AGENTS.md:7-7@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:9-20@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:55-105@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/tests/sqlite-backend.spec.ts:69-85@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:7-8@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:10-11@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:38-66@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:96-138@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1319-1375@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:1-8@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:21-54@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:106-119@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:1-37@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:67-95@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:139-173@687f282e
来源：deepseek-harness/packages/storage/storage-sqlite/tests/sqlite-backend.spec.ts:1-290@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1261-1318@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1376-1500@687f282e
来源：deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1570-1880@687f282e

<a id="upgrade-guides"></a>
## 15. 升级指南（upgrade guide）的写入与验证

### 15.1 何时写

**【源义务】** 当变更破坏**仓库外部可观察**的表面时，必须在引入破坏的同一改动中写指南，不能推迟到发版准备：

- `dsh` 命令、flag、profile 名；
- `cordis.yml`、patch、overlay、settings key 或其可接受值；
- 持久化用户数据：Session logs、SQLite stores、用户数据目录；
- TypeScript/Python SDK export、JSON-RPC、HTTP、ACP 消息；
- published package 名与 entry point。

预稳定内部 API 若所有消费者在同一次改动中更新，不需要指南。Session-format 变化仍要走类型确认；指南只写 reader 的行动，并链接该 record。依据：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-18@687f282e`。

### 15.2 位置与生命周期

路径：`docs/upgrade-guide/v<version>/<kebab-item>/guide.md`。

- `<version>` 是写指南时根 `package.json` 的 version；指南描述从该 release 到下一个 release 的升级。
- 目录只放 `guide.md`、`guide.zh.md`、`guide.i18n.yaml`；不放 index/附件。
- 根版本未变时，当前 version 目录描述“从 vT 到当前 master”的 delta；后续改动触及已覆盖表面时，在同一次改动更新该指南；破坏被回滚时删除指南。
- 版本 bump 后，旧 version 目录冻结；新破坏写入新目录；绝不写跨多个 release 的指南。

依据：SKILL `:19-35@687f282e`。

### 15.3 格式与自动门

`verify-upgrade-guides` 强制：

- 路径只能 `v<semver>/<kebab-case>/guide.{md,zh.md,i18n.yaml}`；其他文件即违规；
- frontmatter 必须恰好 `description`、`kind` 两个 key，`kind: upgrade-guide`，`description` 非空；
- `guide.md` 恰好一个 `#` 标题，然后 `## Change`、`## Migration`；`guide.zh.md` 用 `## 变更`、`## 迁移`；
- 英文 `guide.md`（含 frontmatter）最多 500 词；中文无词数上限；
- 中文配对的 pairing record 由 `verify-translation-pairing` 拥有，不在该 verifier 里。

依据：`deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e`。

**关键条件（目录缺席）**：`collectUpgradeGuideViolations` 在 `docs/upgrade-guide` 不存在时直接返回空；因此删掉整棵树不会触发该 verifier。它也不判断某个 breaking change 是否“应该”有指南，只验证已存在的文件。迁移时必须另设目录/必需文件与变更映射检查，不能把本 verifier 当作完整性证明。

内容要求：

- `Change`：旧行为、新行为、谁受影响。
- `Migration`：有序步骤，点名精确文件、key、命令或符号，并说明如何确认迁移成功。
- 超过 500 词时：链接源文件/符号，不重述代码；理由移到 Agent Note；重复机械步骤做成脚本或 `dsh` 命令，由指南调用。

依据：SKILL `:36-49@687f282e`。

**完成信号**：`pnpm run verify-upgrade-guides`、`pnpm run verify-translation-pairing <guide.md>`、`pnpm run verify-md-links` 全部通过；英文与中文在同一改动中提交。

**失败处理**：路径不对 → 移到规范目录；heading 不符 → 按模板重排；超 500 词 → 删减/链接/抽脚本，不要提高阈值；配对缺失 → `verify-translation-pairing --write` 生成/更新；链接失效 → 修链接，不能用纯文本替代。

**例外**：`package.json` 版本未变的同版本内更新是常态；指南必须描述“到当前 master”的 delta。旧版本目录冻结后，即使发现错误也不改历史指南，除非是明确的历史更正流程。

---

来源：deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e
来源：deepseek-harness/scripts/verify-upgrade-guides.ts:1-85@687f282e
来源：deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e

<a id="release-operator"></a>
## 16. 发布操作手册与 Session record 的交接

### 16.1 npm 发布序列（dsh）

1. 确认本次 release 的所有变更已合并，`release:verify --family dsh` 在本地/PR 通过，版本 bump 已提交。
2. 人工创建 `dsh-v<version>` tag 并 push；确认 tag 指向 bump 提交。
3. 从该 tag 手工 dispatch `release-publish.yml`；在 `npm-publish` environment 完成审批。
4. 观察 pack job：`RELEASE_PUBLISH=true` 的 verify、build、pack、vendor/Landlock 验证、packed install 全通过。
5. 观察 publish job：逐包三态结算；任何 integrity mismatch 立即停止。
6. 用 `npm view`/`npm dist-tag ls` 核对每个包和 channel。
7. **发布后**：核对已发布 tag 的 `packages/core/session/src/types.ts` 的 writer；若高于 release record，按 §12 同一次双语更新推进 record；不要因为“发布流程成功”就跳过这一步。

依据：`release-publish.yml:1-131@687f282e`；`.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:111-125@687f282e`；`docs/session-format-status.md:45-55@687f282e`。

### 16.2 vendor / native / Python / Desktop

- vendor：`release:vendor` bump 全部九包 → 每包 tag（`vendor-<name>-v<version>`）→ 从对应 tag dispatch `release-vendor-publish.yml`；可选 `dist-tag` 必须未占用；发布后逐包核对 registry。依据：`release-vendor-publish.yml:1-126@687f282e`。
- native：bump + `node-addon-system-v<version>` tag → dispatch `node-addon-system-release.yml`，`publish=true` → `npm-publish` 审批 → 逐包 publish/skip。依据：`node-addon-system-release.yml:1-188@687f282e`。
- Python：bump 根版本，创建 `python-v<repository-version>` tag → dispatch `python-release.yml`，`publish=true` → 先 `pypi-runtime` 后 `pypi` 审批 → 核对六个 wheel 与 `SHA256SUMS`。依据：`python-release.yml:1-248@687f282e`。
- Desktop：master 上成功打包（production preset）→ dispatch `desktop-publish.yml` 指定 run id/attempt → prepare `--check` → 对应 environment 审批 → publish → 核对 `complete`/`published-tag-pending` 与 publication record；生产 tag 必须存在，否则按 recovery 补。依据：`desktop-publish.yml:1-154@687f282e`。

### 16.3 发布后证据包

至少保留：

- tag 名、commit、dispatch run id/attempt、审批 environment 与批准时间；
- pack 日志、`publish-order.txt`、tarball 列表与 sha512；
- registry 查询结果（per package version + integrity）；
- Python 的六个 wheel 名、SHA256SUMS、两个 environment 记录；
- Desktop 的 publication record、feed read-back、signature verification、安装升级 journal/截图（如做了）；
- Session 的 writer 值、release record diff、evidence tag；
- 任何失败/重试的原始日志，不删除失败批次。

**证据限制**：审批记录在 GitHub/PyPI 侧；本地日志不能替代 forge 的 environment 记录。真正的“审批发生过”必须由平台 API/UI 证明，不能由 workflow 文本推断。

---

<a id="failures"></a>
## 17. 失败与恢复矩阵

| 现象 | 根因 | 立即动作 | 禁止动作 |
| --- | --- | --- | --- |
| `release:verify` 报安装边环 | manifest 依赖成环 | 修依赖图，重新 bump/verify | 任意打破边或跳过 verify |
| `tag ... names no version this family carries` | tag 与包版本不一致 | 修正 tag 或 bump；重新从正确 tag dispatch | 在发布脚本里放宽 tag 检查 |
| registry 有同版本但 integrity 不同 | 未 bump 改代码 / 构建不可复现 | 停止，bump 新版本或修可复现性 | 覆盖/删除已发布版本 |
| publish `E409` | registry packument 未提交 | 等 backoff 自动重试；不要并发加速 | 并行发多包 |
| dist-tag 已指向别版本 | 通道被占用 | 换未占用 tag，或先核对是否同一版本 | 强行移动 tag |
| Python runtime 已发、SDK 失败 | 两段发布 | 只重跑 `publish-sdk` | 重传 runtime |
| Python wheel 名/数量不符 | 构建/下载 artifact 混入 | 清理 artifact，重新 build；精确比对六个名字 | 手工改名绕过 |
| Desktop unsigned/debug artifact | 打包 preset 错 | 重新 production 打包 | 把它放进生产 feed |
| Desktop retained attempt 已存在 | 重跑同一 run/attempt 或旧目录未清理 | 用新的 run/attempt 重新打包 | 删除/覆盖旧 attempt |
| Desktop 测试 feed 前态不符 | v2 之前 feed 不是精确 v1，或 journal 缺失 | 恢复精确 v1 feed，补原安装 journal；新建操作 | 直接覆盖 feed 或复用旧 receipt |
| Desktop 网络故障规则非 owned | 外来/重复 PersistentStore 规则 | 人工检查，不修改非 owned 规则 | 强删规则或继续 Block |
| Desktop tag pending | 上传成功、tag 失败 | 按 recovery 命令补 tag | 重传/回滚已公开产物 |
| Desktop feed hash 不符 | 对象被外部改/产物损坏 | 停止，查远端与本地 inventory | 覆盖 immutable 对象 |
| Desktop stale lock | 上次异常退出 | 人工确认无活跃发布后删除 | 自动超时夺取 |
| Session `unsupported` | 读到更新格式 | 升级 reader；保留 raw log 可读 | 当损坏截断/跳过 |
| Session 缺失相邻迁移 | catalog 链不完整 | 补 `vN-to-vN+1` 包并重新生成 catalog | 运行时 fallback 到前代 |
| persistence `decision-required` | 结构变化需兼容决策 | 补 `--decision` 或改 bump | 编辑 digest 绕过 |
| upgrade guide 超 500 词 | 把理由塞进指南 | 链接/抽 Agent Note/脚本 | 提高阈值 |
| 文档站点 ref 非 tag | 从分支 dispatch | 从 `dsh-v*` tag 重跑 | 把 docs 加回 PR check |

---

<a id="migration-checklist"></a>
## 18. 迁移到新仓库的检查清单

### 18.1 先决定边界

- [ ] 列出所有可发布家族：成员 glob、版本基线、tag 前缀、dist-tag 策略、是否允许 private 例外。
- [ ] 为每个家族写一个 `ReleaseFamily` 类/等价策略对象；不要在一个 workflow 里用大量 `if family ==` 分支。
- [ ] dsh 家族按名字统一到 root 版本；dsh 目标用 `workspace:*`、vendor/native 目标用 `workspace:~`；`constraints` 在静态 lane 与 release lane 都跑。
- [ ] 发布依赖面：Client/Host 选择、Host 导出三分类、Cordis peer+dev、section/range 规则、双 DSH 版本安装布局与 work budget；不要只按 source import 猜 section。
- [ ] 明确“版本写回仓库”还是“CI 生成版本”。源选择前者；若选后者，必须重新设计 tag/审批/可追溯性，不能照搬。
- [ ] 明确 registry 是 npmjs、私有 registry 还是多 registry；`--access`/OIDC/provenance 的支持不同。

### 18.2 先做无凭据预演

- [ ] PR 上 pack + 安装探针 + payload 政策；不接触 registry 凭据。
- [ ] `fetch-depth: 0` 与 `persist-credentials: false`。
- [ ] 若用 self-hosted 预演：默认 hosted；仅 writer-controlled 变量 + 可信 master/同仓非 fork 非 Dependabot PR 才路由；临时目录/缓存/pnpm store 按 run 隔离；checkout 清理；packed-install 在 checkout 外并在 finally 删除；publish 永远 hosted。
- [ ] 跨 family 依赖用本地 pack 输出验证，不依赖 registry 已有版本。
- [ ] 临时 consumer 隔离 HOME/cache，删除 `NODE_OPTIONS`/`NODE_PATH`，用 plain Node 驱动入口。
- [ ] 检查包内没有 `src`/map（若采用 dsh 政策）或明确保留（vendor 类）。

### 18.3 再做人工发布

- [ ] 发布 workflow 只 `workflow_dispatch`，不出现在 PR check。
- [ ] tag 前缀、版本精确匹配、成员非 private、发布顺序在构建前验证。
- [ ] `environment` 有 required reviewers 和 tag 限制；记录这是仓库外配置。
- [ ] `concurrency` 串行写 registry，`cancel-in-progress: false`。
- [ ] 注册表三态 + 重试前重读 + integrity 比较。
- [ ] 记录 `publish-order.txt`，部分发布只可能是前缀。

### 18.4 持久化与文档

- [ ] 一个 writer 常量；一个 catalog generator；v0 到 current 每个整数恰好一个相邻包。
- [ ] 旧代际不移动/不覆盖/不删除；write open 只发布最终当前代际；header-only 不发布。
- [ ] 只读打开只做准备、不落盘；write open 在 append 前发布一次；单飞/取消/源漂移/winner prefix/primed read-handle 规则齐全。
- [ ] schema 策略：inventory format 2 的显式 binding/literal role、双侧 promise、`@persistenceReserved` 只用于 optional never、歧义不强行配对；runtime owner 测试 preservation。
- [ ] SQLite 分类：canonical 物理库版本不匹配即拒绝、不自动迁移；派生全文索引只在 application id/表白名单匹配时重置；文件/目录权限与父目录威胁模型写清。
- [ ] 批量迁移：布局/最高代际发现、symlink/flat-file 拒绝、有界 jobs、source-change 单次串行 retry、不删源、私有日志/摘要、失败 exit 1。
- [ ] 每个结构差异有 record（英文+中文+pairing+schema）；兼容决策有 old/new reader 证据。
- [ ] 每个历史 writer 有完整 vN schema+双语声明；推进 writer 前先 archive 旧 inventory，归档目标不可覆盖。
- [ ] 预发布 tag 归档按 manifest 语义顺序/前后 digest 验证；回填记录不替代当前 acknowledgement。
- [ ] finalized checkpoint 不可变；新变化创建 successor，不改历史。
- [ ] 每个外部可观察破坏在同一次改动写 upgrade guide，≤500 词，双语。
- [ ] 发布后更新 release record；不要提前，不要降低。

### 18.5 桌面/原生/Python 专属

- [ ] Desktop：三目标、completion record、feed 顺序、immutable object、签名验证、channel lock、publication record、安装升级人工清单。
- [ ] Desktop 构建版本：`--build-version`/auto 作为参数，不重写 manifest；产物记录 commit/dirty；生产上传成功后打 tag，dirty/测试构建不打 tag；打包验证器拥有 descriptor/协议/semver 检查，启动只读所需字段。
- [ ] Python：安装后 wheel 身份检查先于首个模型请求；keyless + 可信 PR/master 的 live 分流；Windows runtime 保持 hosted；publication 不重建、校验 SHA256SUMS、runtime 先于 SDK；Trusted Publisher 身份含 repo/workflow/environment。
- [ ] Desktop 发布选择：精确 run/attempt、唯一成功 package job、原 runner 唯一 label、retained manifest 全等；不接受“最新成功 run”或 artifact 名授权。
- [ ] Desktop 保留：版本 mode/preset/channel 校验、显式文件清单、attempt 不覆盖、SHA-512 复制校验、原子 rename、消费前重 hash。
- [ ] Desktop 测试资格：upload-binaries/publish-feed 分离、TTY 精确确认、receipt 复用、versioning 查询、v1/v2 前态与 journal、public read-back。
- [ ] Desktop 网络故障：plan 绑定 receipt/exe hash、精确 owned PersistentStore 规则、Block/Restore 确认、失败不自动清理、规则存在不等于流量证据。
- [ ] Native：全平台 prebuild、同字节多 Node 测试、Landlock 不跳过、provenance、矩阵从 prebuilds.json 派生、packed-install 仓库外安装与 byte-pin。
- [ ] Python：六 wheel 精确名、大小上限、twine、SHA256SUMS、双 environment、attestations 策略；executable builder 的 target/host/侧车/staging 检查。
- [ ] 所有平台：区分“自动化通过”与“生产就绪”；安装/签名/审批证据不能由本地测试替代。

---

<a id="evidence-limits"></a>
## 19. 证据边界与未决项

以下不是“源没做”，而是**本参考在源内无法证明**，迁移时必须单独核对：

1. **GitHub environment 配置**：`npm-publish`、`pypi`、`pypi-runtime`、`desktop-production`、`desktop-test`、`github-pages` 的 required reviewers、允许 tag/branch、prevent self-review、environment secrets 均在仓库外。源码只证明 workflow 引用了这些 environment。
2. **GitLab 保护规则**：`.gitlab-ci.yml` 只证明 tag-only 与 `resource_group`；protected tags、protected variables、runner 权限、environment 审批不可见。
3. **npm 信任模式**：dsh/vendor 工作流用 `NODE_AUTH_TOKEN`；native 用 `id-token: write` 与发布脚本；Python 用 OIDC + `attestations: false`。实际 registry 信任配置、token 轮换、provenance 是否启用需目标平台核对。
4. **真实发布**：本参考未执行任何 `npm publish`、PyPI upload、COS upload、GitHub release、GitLab pipeline。所有 `verification` 均为 `planned`。
5. **Session release record**：`latestReleasedVersion: 4` 与 `evidenceTag: dsh-v0.2.0-rc.2` 是源文件声明；未联网核对该 tag 的 writer 或发布状态。
6. **Desktop 签名/安装**：Windows EV token、macOS notarization、真实安装升级、自动重启、数据保留均需操作员/硬件；源内测试明确列出未验证项。
7. **构建可复现性**：npm 三态依赖“同一提交重打包字节一致”；源 Note 明确说尚未测量。迁移前必须实测，否则 skip 可能误判。
8. **`desktop-publish-record`/lock 的并发边界**：只做了源码审阅；未做真实并发/崩溃恢复实验。锁不自动过期，stale lock 需人工。
9. **Python/native 发布脚本**：`build-python-release.py`、`scripts/build-exe-for-python-sdk.ts` 与 `native/system/scripts/publish-release.mjs` 已逐行读取；结论是源码审阅，不是执行通过。wheel 构建、executable 生成、registry publish、provenance/attestation 仍需目标环境实测。
10. **发布脚本的测试**：`scripts/release/*.spec.ts`、`scripts/verify-upgrade-guides.spec.ts`、`scripts/gen-session-format-catalog.spec.ts` 等未执行；不能把“存在 spec”当成通过。
11. **Desktop 外部状态**：COS 桶 versioning/禁止覆盖配置、GitHub environment reviewer 身份、真实签名硬件/公证、安装升级/自动重启/数据保留均未执行；resolver 只证明环境有 `required_reviewers` 规则，不证明具体批准。
12. **Finalized checkpoint 子集**：`finalized/v4.json` 只锁五条记录；加载器不要求后续记录全部进入 checkpoint，因此不能据此推断所有 V4 记录已定稿。
13. **Desktop 打包/保留 helper**：`retain-desktop-ci.ts`、`prepare-macos-ci.mjs`、`prepare-windows-ci.mjs`、`desktop-ci-version.mjs`、`desktop-release-store.ts` 已逐行读取；但没有真实构建、保留、多机并发或文件系统崩溃实验。SSH helper 的 build/verify/release 脚本已读，但没有执行四目标构建、沙箱或 GitHub Release 上传；解包安全由源码与测试推断。
14. **Desktop 测试 feed 与网络故障**：publication/network README 与脚本已逐行读取；源记录显示 `GetBucketVersioning` 返回 403、未尝试 PUT；没有真实 COS 写入、CDN、防火墙拦截/恢复或跨重启规则实验。`trafficInterruptionVerified`/`downloadRecoveryVerified` 不能由脚本置真。
15. **持久化历史归档**：`persistence-formats.ts` 与 `persistence-releases.ts` 已逐行读取，但未执行两个 verifier/`--write`；26 个 per-tag 记录/快照未逐份审计，生成事实与 pairing 未独立刷新。
16. **依赖面 gate**：`verify-package-dependencies`、`verify-npm-install-layout`、`package-dependency-policy` 已读，但没有执行 gate/benchmark/双版本探针；真实 npm 安装布局、resolver 预算与 registry 行为未验证。
17. **迁移准备与 schema 策略**：准备先于发布、单飞/取消/源漂移、`@persistenceReserved`、inventory format 2 与 persistence-review 只做了 Note/源码审阅；未跑 focused runtime/inventory 测试或 116MB 语料。
18. **Desktop 构建版本参数**：`--build-version`/auto、dshBuildCommit/dshBuildDirty、上传后打 tag 只做了 Note 审阅；未执行打包/上传/tag 或 bucket 列表失败回退实验。
19. **self-hosted 预演路由**：selector 条件、checkout 清理、临时卷与 packed-install 清理只做了 Note/workflow 结构审阅；负例测试与真实 release build 未执行。
20. **workspace 版本/范围 gate**：`constraints` 的版本/范围分支只做了源码与 spec 阅读；未运行 `pnpm run constraints` 或 release-lane `verifyVersions`。
21. **SQLite 兼容边界**：`storage-sqlite` 与 `session-query-sqlite` 的 open/reset 实现与 focused tests 已读，但未执行；未做损坏/部分写入/崩溃/并发/父目录替换/跨平台实验。
22. **SSH helper 与 PR 预览**：build/verify/release 与 preview workflow 已逐行读取，但未执行四目标交叉构建、沙箱/Landlock/OpenSSH 运行、Cloudflare 部署或 Access 断言；token、项目、域名与 Access 策略在仓库外。
23. **批量迁移 CLI**：`migrate-sessions-to-v4` 的发现/并发/retry/日志实现与 450 行测试已读，但未执行 10k/并发/source-change/torn-tail/日志权限测试；真实大语料与 Windows symlink/junction 行为未验证。

**【迁移设计】** 在新仓库中，把上述未决项做成 `release-evidence` 检查表：每项标记 `verified`/`planned`/`not-applicable`，并附平台 API 输出或审批记录。没有证据的项保持 `planned`，不得用文档措辞填充。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `release-three-sequence-model`：`deepseek-harness/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md:1-186@687f282e`、`deepseek-harness/scripts/release/families.ts:1-495@687f282e`、`deepseek-harness/packages/experimental/README.md:1-24@687f282e`、`deepseek-harness/scripts/experimental-package-policy.ts:1-67@687f282e`
- `release-publish-order-payload`：`deepseek-harness/scripts/release/verify.ts:1-110@687f282e`、`deepseek-harness/scripts/release/process.ts:1-129@687f282e`
- `release-workspace-version-ranges`：`deepseek-harness/.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md:1-28@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:407-427@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:573-644@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.spec.ts:51-100@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.spec.ts:259-287@687f282e`、`deepseek-harness/scripts/run-gates.ts:373-375@687f282e`、`deepseek-harness/scripts/run-gates.ts:789-795@687f282e`
- `release-published-dependency-faces`：`deepseek-harness/scripts/package-dependency-policy.ts:1-105@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:1-105@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:157-212@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:593-659@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:694-749@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:807-853@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:967-1038@687f282e`、`deepseek-harness/scripts/verify-npm-install-layout.ts:1-275@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-09-28-dual-release-install-layout-work-budget.md:1-50@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md:1-40@687f282e`
- `release-npm-rehearsal`：`deepseek-harness/.github/workflows/release-vendor.yml:1-107@687f282e`、`deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e`、`deepseek-harness/scripts/release/installed-product-isolation.ts:1-73@687f282e`
- `release-npm-manual-publish`：`deepseek-harness/.github/workflows/release-vendor-publish.yml:1-126@687f282e`、`deepseek-harness/scripts/release/publish.ts:122-235@687f282e`
- `release-npm-registry-idempotency`：`deepseek-harness/scripts/release/publish.ts:1-235@687f282e`
- `release-native-addon`：`deepseek-harness/native/system/scripts/publish-release.mjs:1-165@687f282e`
- `release-native-artifact-assembly`：`deepseek-harness/native/system/scripts/assemble-prebuilds.mjs:1-54@687f282e`
- `release-python-pypi`：`deepseek-harness/.github/workflows/python-release.yml:1-248@687f282e`、`deepseek-harness/.github/workflows/build-exe-for-python-sdk.yml:1-512@687f282e`、`deepseek-harness/scripts/smoke-python-runtime.py:802-893@687f282e`、`deepseek-harness/scripts/smoke-python-runtime.py:1077-1138@687f282e`、`deepseek-harness/.agents/notes/implemented/testing/2026-08-23-installed-python-wheel-black-box-ci.md:1-51@687f282e`、`deepseek-harness/.agents/notes/archived/process/2026-08-11-python-publication-workflow.md:1-52@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-09-06-python-runtime-windows-hosted.md:1-25@687f282e`
- `release-desktop-version-artifacts`：`deepseek-harness/apps/desktop/packaging/README.md:86-140@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-build-version.mjs:1-104@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-upload-plan.ts:1-294@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-release-tag.ts:25-80@687f282e`、`deepseek-harness/.github/workflows/windows-package.yml:1-167@687f282e`、`deepseek-harness/.agents/notes/archived/process/2026-09-16-desktop-release-version-derivation.md:1-30@687f282e`
- `release-desktop-package-selection`：`deepseek-harness/.github/workflows/desktop-publish.yml:1-154@687f282e`、`deepseek-harness/apps/desktop/scripts/preflight-desktop-publish.mjs:1-47@687f282e`、`deepseek-harness/apps/desktop/scripts/resolve-desktop-publish-ci.ts:1-68@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publish-route.ts:1-70@687f282e`
- `release-desktop-retention`：`deepseek-harness/apps/desktop/scripts/retain-desktop-ci.ts:1-79@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-release-store.ts:1-145@687f282e`、`deepseek-harness/apps/desktop/scripts/prepare-macos-ci.mjs:1-25@687f282e`、`deepseek-harness/apps/desktop/scripts/prepare-windows-ci.mjs:1-28@687f282e`
- `release-desktop-signed-publish`：`deepseek-harness/apps/desktop/scripts/desktop-publish-record.ts:1-110@687f282e`、`deepseek-harness/apps/desktop/scripts/rollback-desktop-channel.ts:1-60@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-rollback.ts:1-58@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publish-config.ts:1-46@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publish-cos.ts:1-81@687f282e`、`deepseek-harness/apps/desktop/scripts/desktop-publish-qualification.mjs:1-15@687f282e`、`deepseek-harness/apps/desktop/windows-signing/README.md:1-103@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-macos-signature.mjs:1-214@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-signature-cache.mjs:1-220@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-signature-cache.d.mts:1-76@687f282e`、`deepseek-harness/apps/desktop/scripts/sign-primary-runtime.ts:52-93@687f282e`、`deepseek-harness/apps/desktop/scripts/windows-runtime-signature.mjs:118-147@687f282e`
- `release-desktop-qualification`：`deepseek-harness/apps/desktop/packaging/README.md:164-279@687f282e`、`deepseek-harness/apps/desktop/scripts/installed-update-distribution.ts:1-74@687f282e`、`deepseek-harness/apps/desktop/scripts/installed-update-packaging.ts:112-115@687f282e`、`deepseek-harness/apps/desktop/scripts/verify-installed-update-package.ts:55-101@687f282e`
- `release-desktop-test-publication`：`deepseek-harness/apps/desktop/scripts/installed-update-publication.ts:1-217@687f282e`、`deepseek-harness/apps/desktop/scripts/publish-installed-update.ts:1-40@687f282e`、`deepseek-harness/apps/desktop/scripts/installed-update-distribution.ts:1-74@687f282e`
- `release-desktop-network-fault`：`deepseek-harness/apps/desktop/scripts/prepare-installed-update-network.ts:1-62@687f282e`、`deepseek-harness/apps/desktop/scripts/installed-update-network.ps1:1-89@687f282e`
- `release-other-delivery`：`deepseek-harness/.github/workflows/build-exe-for-ssh-helper.yml:1-127@687f282e`、`deepseek-harness/scripts/ssh-helper/release.ts:1-76@687f282e`、`deepseek-harness/scripts/ssh-helper/artifact.ts:1-88@687f282e`、`deepseek-harness/scripts/verify-ssh-helper-artifact.ts:1-167@687f282e`
- `release-session-authority`：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md:1-42@687f282e`、`deepseek-harness/docs/persistence-changes/README.md:1-90@687f282e`
- `release-session-migrations`：`deepseek-harness/.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md:1-251@687f282e`、`deepseek-harness/scripts/gen-session-format-catalog.ts:1-261@687f282e`
- `release-session-migration-preparation`：`deepseek-harness/.agents/notes/implemented/architecture/2026-09-05-read-only-session-migration-preparation.md:1-170@687f282e`、`deepseek-harness/.agents/notes/implemented/architecture/2026-09-29-explicit-session-history-preparation.md:1-43@687f282e`、`deepseek-harness/packages/session/session-persistence-jsonl/src/migration-verifier.ts:1-198@687f282e`、`deepseek-harness/packages/session/session-persistence-jsonl/tests/migration-verifier.spec.ts:1-273@687f282e`
- `release-session-batch-migration-cli`：`deepseek-harness/scripts/migrate-sessions-to-v4.ts:1-303@687f282e`、`deepseek-harness/scripts/migrate-sessions-to-v4.spec.ts:1-450@687f282e`、`deepseek-harness/scripts/migration-failure-summary.ts:1-43@687f282e`
- `release-persistence-records`：`deepseek-harness/.agents/notes/implemented/process/2026-10-08-session-reader-compatibility-review.md:1-39@687f282e`、`deepseek-harness/scripts/persistence-finalization.ts:1-168@687f282e`、`deepseek-harness/docs/persistence-changes/finalized/v4.json:340-379@687f282e`、`deepseek-harness/.agents/notes/implemented/process/2026-09-11-persistence-type-history.md:1-51@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:23-40@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:535-635@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:646-716@687f282e`、`deepseek-harness/scripts/persistence-changes.ts:793-879@687f282e`
- `release-persistence-schema-policy`：`deepseek-harness/scripts/persistence-schema.ts:42-133@687f282e`、`deepseek-harness/scripts/persistence-schema.ts:210-360@687f282e`、`deepseek-harness/scripts/persistence-schema.ts:400-480@687f282e`、`deepseek-harness/scripts/persistence-source-policy.ts:1-69@687f282e`、`deepseek-harness/scripts/persistence-review.ts:20-183@687f282e`、`deepseek-harness/scripts/persistence-schema-model.ts:100-185@687f282e`、`deepseek-harness/scripts/persistence-schema-model.ts:277-294@687f282e`
- `release-sqlite-schema-compatibility`：`deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:9-20@687f282e`、`deepseek-harness/packages/storage/storage-sqlite/src/schema.ts:55-105@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:38-66@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/src/schema.ts:96-138@687f282e`、`deepseek-harness/packages/session-query/session-query-sqlite/tests/sqlite.spec.ts:1319-1375@687f282e`
- `release-persistence-format-archive`：`deepseek-harness/scripts/persistence-formats.ts:1-230@687f282e`
- `release-persistence-release-archive`：`deepseek-harness/docs/persistence-changes/releases/manifest.json:1-162@687f282e`、`deepseek-harness/scripts/persistence-releases.ts:1-257@687f282e`
- `release-upgrade-guides`：`deepseek-harness/.agents/skills/dsh-create-upgrade-guide/SKILL.md:1-54@687f282e`、`deepseek-harness/.agents/skills/dsh-doc/templates/upgrade-guide.md:1-29@687f282e`
