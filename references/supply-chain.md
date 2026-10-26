# 供应链与包边界治理操作参考（supply-chain）

> 证据基线：`deepseek-harness` 仓库固定提交 `687f282e8625c6b8d11ff58211a90524be2e4317`。本文的 `deepseek-harness/<path>:<start>-<end>@687f282e` 引用均指向该提交。源仓库只读；文中命令是源仓库已有做法，不表示在迁移目标中已运行。
>
> 证据标记：
> - **[源义务]** 源仓库通过 gate、配置或明确文字强制，违反会安装/检查失败。
> - **[源事实]** 源仓库可观察到的约定或结构，但没有找到自动检查。
> - **[迁移设计]** 给目标仓库的落地设计，不是源仓库已实现的保证。
> - **[建议]** 超出源仓库的附加建议。
> - **[未验证]** 该提交下没有运行证据，或依赖外部服务/未提交产物。

## 0. 适用范围

本域覆盖：工作区成员与包管理器；依赖声明面；workspace 协议、版本家族与 release family；包 manifest 的 private/public/experimental/native 分类与发布文件；包目录迁移与文档路径漂移；ESM/exports/publint/NodeNext/顶层 await；可选依赖；vendored 框架同步与重命名；外部补丁；许可证与第三方 notices；可执行部署的运行时闭包；npm 双版本安装布局；packed tarball 安装与发布边界；消费者依赖目录；产品使用、默认产品隔离、实验包策略；配置来源与凭据；依赖更新；Node/pnpm/lockfile 锚定；Python SDK runtime wheel、锁定下载资源与双阶段 PyPI 发布。

总原则（源仓库实际体现）：

1. **声明面就是运行时契约。** `dependencies`/`devDependencies`/`optionalDependencies`/`peerDependencies` 分别回答"谁提供、是否会缺、是否由消费者提供"；源仓库用源码使用事实推导每个包应落在哪一段（第 4 节），而不是靠人工感觉。
2. **发布物必须按消费者视角验证。** workspace 测试通过不等于 tarball 可安装；源仓库在打包后临时目录安装、按 Node 解析规则加载入口（第 15 节），并单独模拟 npm 的双版本 hoisting（第 14 节）。
3. **默认拒绝，逐项放行。** 构建脚本、发布源码、私有实验包、例外 range、补丁都必须显式列出；未列出即失败或不可发布。
4. **版本家族是发布边界。** `dsh` 家族共享一个版本；`vendor` 每个包各自一条版本线；`native` 有自己的版本。一个家族发布不重新发布另一个（第 3 节）。
5. **检查存在不等于覆盖完整。** 很多 gate 只覆盖 `packages/*/*` 或 `vendor/*`，不覆盖 `apps/*`/`native/*`/`python/*`；本文逐项标注覆盖边界。

## 0.1 机制 ID 与锚点

本参考的每一节对应 `knowledge/supply-chain.json` 中的一个稳定机制 ID；迁移或审计时按 ID 绑定，不要只按标题匹配。

| 机制 ID | 本文锚点 |
|---|---|
| `supply-chain-workspace-topology` | `#sc-workspace-topology` |
| `supply-chain-workspace-protocol` | `#sc-workspace-protocol` |
| `supply-chain-dependency-faces` | `#sc-dependency-faces` |
| `supply-chain-manifest-publication` | `#sc-manifest-publication` |
| `supply-chain-package-paths` | `#sc-package-paths` |
| `supply-chain-esm-payload` | `#sc-esm-payload` |
| `supply-chain-optional-deps` | `#sc-optional-deps` |
| `supply-chain-vendor-sync` | `#sc-vendor-sync` |
| `supply-chain-vendor-rescope` | `#sc-vendor-rescope` |
| `supply-chain-vendor-patches` | `#sc-vendor-patches` |
| `supply-chain-licenses-notices` | `#sc-licenses-notices` |
| `supply-chain-runtime-closure` | `#sc-runtime-closure` |
| `supply-chain-install-layout` | `#sc-install-layout` |
| `supply-chain-packed-install` | `#sc-packed-install` |
| `supply-chain-dependency-catalog` | `#sc-dependency-catalog` |
| `supply-chain-product-use` | `#sc-product-use` |
| `supply-chain-default-product-isolation` | `#sc-default-product-isolation` |
| `supply-chain-experimental-policy` | `#sc-experimental-policy` |
| `supply-chain-config-source-ownership` | `#sc-config-source` |
| `supply-chain-secrets` | `#sc-secrets` |
| `supply-chain-dependency-updates` | `#sc-dependency-updates` |
| `supply-chain-node-manager-lock` | `#sc-node-manager-lock` |
| `supply-chain-release-consumer` | `#sc-release-consumer` |
| `supply-chain-python-runtime` | `#sc-python-runtime` |

---

<a id="sc-gate-map"></a>
## 1. Gate 地图：哪条流水线跑什么

聚合入口是 `deepseek-harness/scripts/run-gates.ts`。与供应链直接相关的 lane：

| Lane / 工作流 | 供应链 gate（代表性） | 证据 |
|---|---|---|
| `hygiene` | `rescope-vendor`、`publint`、`constraints`、`default-product-isolation`、`product-use`、`official-bundle-catalog`、`provider-data`、`package-dependencies`、`application-entrypoints`、`dsh-package-licenses`、`node-next-types`、sharedHygiene；再加 `cordis-config`、`runtime-closure`。**不含 `package-meta`，也不含 `vendor-manifest`** | `deepseek-harness/scripts/run-gates.ts:353-358, 784-803@687f282e` |
| `ci-static` | `ciSharedStaticGates`（runtime-closure、package-dependencies、dsh-package-licenses、package-meta、constraints 等）加**除 `doc-typecheck` 外的完整 `docSyncLeafGates`**（`package-paths`、`config-source-ownership`、`dependency-catalog` 都在内），再加 module-graph | `deepseek-harness/scripts/run-gates.ts:366-382, 487-501, 805-874@687f282e` |
| `ci-primary` | `ciSharedStaticGates`、完整 doc-sync、typecheck/lint/coverage/build/publint/node-next/built-bin；这是 PR 主 lane 中最完整的供应链覆盖 | `deepseek-harness/scripts/run-gates.ts:400-431@687f282e` |
| `ci-unit` / `test` | `ci-unit` 直接 `vitest run` 全量单测；`check-all` 也跑 `pnpm run test`。`gen-third-party-notices.spec.ts` 的 freshness 断言在全量 test inventory 内，但没有单独的 `verify-third-party-notices` lane | `deepseek-harness/scripts/run-gates.ts:332-352, 738-748@687f282e` |
| `doc-sync`（`pnpm run doc-sync`） | 完整 `docSyncLeafGates`；`ci-static` 也包含它（仅省略 doc-typecheck），所以它不是“只有 doc-sync 才跑”的专属覆盖 | `deepseek-harness/scripts/run-gates.ts:805-874@687f282e`、`deepseek-harness/.github/workflows/docs-pages.yml:73-75@687f282e` |
| `.git/hooks/pre-commit`（lefthook） | `vendor manifest guard`：仅当 staged 变更命中 `vendor/<pkg>/src/**` 或 `vendor/<pkg>/bin.js` 时，要求同一次提交 stage 了 `vendor/README.md`；不校验 README 内容 | `deepseek-harness/lefthook.yml:5-33@687f282e`、`deepseek-harness/scripts/check-vendor-manifest.sh:1-17@687f282e` |
| `release.yml` dependency job | `verify-package-dependencies`、`verify-npm-install-layout` | `deepseek-harness/.github/workflows/release.yml:80-88@687f282e` |
| `release.yml` pack job | `release:verify`、`release:pack --family dsh`、vendor/landlock tarball、`release:verify-packed-install` | `deepseek-harness/.github/workflows/release.yml:35-110@687f282e` |
| `release-publish.yml` | 对已上传 tarball 重跑 packed install，再发布；不在发布步骤重新构建 | `deepseek-harness/.github/workflows/release-publish.yml:90-131@687f282e` |

| Dependabot | npm（排除 vendor）、uv（`python/sdk`）、github-actions，每天 04:00 Asia/Shanghai，cooldown 30 天 | `deepseek-harness/.github/dependabot.yml:1-38@687f282e` |

Python wheel 的发布专用 gate 不经过 `run-gates.ts`：`build-exe-for-python-sdk.ts` 先跑 `verify-runtime-closure`（该脚本也在 hygiene 中运行），再由 `python-release.yml` 验证六个 wheel、100MB、`twine` 和 `SHA256SUMS`，并按 runtime→SDK 顺序发布（第 25 节）。

> 上表按当前 `run-gates.ts` 的聚合函数直接核对：`gatesForMode`（`:294-359`）、`ciSharedStaticGates`（`:366-382`）、`ciStaticGates`（`:487-501`）、`ciUnitGates`（`:738-748`）、`hygieneLeafGates`（`:784-803`）和 `docSyncLeafGates`（`:805-874`）。仍不等于对 1,697 行的逐行审计；本域未运行任何 lane。

必须知道的缺口：

- `config-source-ownership`、`dependency-catalog`、`package-paths` 属于 `docSyncLeafGates`；因为 `ci-static` 调用 `ciStaticGates` 时展开该函数，所以它们在 PR 的 `ci-static` 中会跑。旧说法“只在 doc-sync/手动”不成立；`hygiene` 才不跑这三项。
- `package-meta` 只在 `ciSharedStaticGates` 及其调用者（`ci-static`、`ci-primary`）中出现；`hygiene` 与 `check-all` 都不含 `package-meta`。不要用 `pnpm run check-all` 代替 PR 的 `ci-static`。
- `vendor-manifest` 不是 `run-gates.ts` 的 gate，也没有对应 `pnpm run` 脚本；它只由 lefthook pre-commit 调 `scripts/check-vendor-manifest.sh` 执行。单独复现要用 `bash scripts/check-vendor-manifest.sh`，且脚本读取的是**已 staged** 的路径。
- `verify-third-party-notices` 没有接入 `run-gates.ts` 或工作流；提交字节的 freshness 由全量 test inventory 中的 `gen-third-party-notices.spec.ts` 覆盖，standalone 命令是手工检查。
- `verify-npm-install-layout` 只在 release 工作流；本地/PR 默认不跑。
- `publint`、`package-meta`、`package-paths` 的覆盖目录不同：`publint`/`package-meta` 主要读 `packages/*/*`；`package-paths` 是文档/`packages/**/*.ts`；`publint` 不含 apps/vendor。
- `verify-dsh-package-licenses` 通过根 `package.json.workspaces` 找包，因此不覆盖 `benchmarks/`、`python/`（第 12 节）。
- `no-top-level-await` 只覆盖 `packages/*/*/src`，不覆盖 `vendor/`、`apps/`（第 7 节）。
- 源仓库没有专门的 `npm audit`/OSV 漏洞 gate；Dependabot 不是漏洞扫描（第 22 节）。

---

<a id="sc-workspace-topology"></a>
## 2. 工作区拓扑、包管理器与 Node 锚定

### 2.1 源事实

- 根 `package.json`：`private: true`、`type: "module"`、`packageManager: "pnpm@11.28.5"`、`engines.node: "^22.19.0 || >=24.0.0"`；`workspaces` 列出 `vendor/*`、`packages/*/*`、`native/system`、`native/system/packages/*`、`apps/*`、`website`（`deepseek-harness/package.json:1-19@687f282e`；`packageManager` 在 7 行，`workspaces` 在 11-19 行）。
- `pnpm-workspace.yaml` 是 pnpm 的真实成员清单，额外包含 `benchmarks` 与 `python/sdk-runtime`（`deepseek-harness/pnpm-workspace.yaml:1-15@687f282e`）。`package.json.workspaces` 不含 `benchmarks`、`python/sdk-runtime`；两份清单并不等价。
- pnpm 版本有三处锚：`packageManager`、根 devDependency `pnpm: 11.28.5`、`minimumReleaseAgeExclude` 中的 `pnpm@11.28.5`（`deepseek-harness/package.json:1-10@687f282e`、`deepseek-harness/package.json:275-275@687f282e`、`deepseek-harness/pnpm-workspace.yaml:105-105@687f282e`）。
- 文档要求 strict symlinked linker，未声明依赖不能靠 hoisting 成功；依赖构建脚本必须显式 allowlist（`deepseek-harness/docs/development.md:27-31@687f282e`）。
- `allowBuilds` 默认拒绝安装/构建脚本；注释说明 `strictDepBuilds` 默认 true，未列出的脚本是硬错误。允许的有 `esbuild`、`lefthook`、`node-pty`、`koffi`、`@deepseek-ai/dsh-subprocess-local@file:...`；明确拒绝的有 `@google/genai`、`protobufjs`、`node-addon-require-builtin`、`electron-winstaller`、`msgpackr-extract`（`deepseek-harness/pnpm-workspace.yaml:31-56@687f282e`）。
- `overrides` 固定 `extract-zip>yauzl: 3.4.0`，并把 `@deepseek-ai/cosmokit`/`schemastery` 链接到 `vendor/`（`deepseek-harness/pnpm-workspace.yaml:17-20@687f282e`）。
- `peerDependencyRules.allowedVersions.typescript` 为 `>=5 <7`（`deepseek-harness/pnpm-workspace.yaml:22-24@687f282e`）。
- release age 的配置边界：`pnpm-workspace.yaml` 只写 `minimumReleaseAgeExclude`，没有显式写 `minimumReleaseAge`；24 小时来自 pnpm 11 默认（`deepseek-harness/apps/desktop/packaging/README.md:227@687f282e`、`deepseek-harness/scripts/local-bundle-registry.spec.ts:513-515@687f282e`）。豁免条目覆盖 LibreOffice kit、pi-ai/telemetry、node-addon 系列、Claude Agent SDK 平台包、OpenAI Codex、CUA、Electron、pnpm 等（`deepseek-harness/pnpm-workspace.yaml:57-105@687f282e`）。列表是精确 `name@version`，不是范围；迁移时若 pnpm 主版本或目标策略不同，必须显式配置/重验默认值，不能把 24h 当成通用事实。
- 根 `postinstall` 是 `node scripts/install-lefthook.mjs`（`deepseek-harness/package.json:214-214@687f282e`）；CI 使用 `pnpm install --frozen-lockfile`（`deepseek-harness/.github/workflows/ci.yml:96-102@687f282e`）。
- `benchmarks` 与 `python/sdk-runtime` 是 pnpm 成员，但不在 `package.json.workspaces`，也不在发布/约束检查的 `workspaceGlobs` 中（`deepseek-harness/scripts/check-workspace-constraints.ts:28-36@687f282e`）。

### 2.2 操作程序：新增工作区成员

1. 判定层级：`vendor/`（上游复制）、`packages/<group>/<pkg>`（自有包）、`native/`、`apps/`、`benchmarks/`、`website/`、`python/sdk-runtime`。
2. 在 `pnpm-workspace.yaml.packages` 增加 glob；若该成员需要被 `package.json.workspaces` 感知（许可证扫描、npm workspace 工具），同步两份清单，并记录哪条 gate 读哪份。
3. 若成员带生命周期脚本，先读脚本；在 `allowBuilds` 写 `true`/`false`。不要用 `--ignore-scripts` 掩盖未审查的脚本。
4. 若需要固定传递依赖，加 `overrides`；若需要 peer range 例外，加 `peerDependencyRules.allowedVersions`。
5. 若是发布包，按第 5 节补齐 `private`、`type`、`main`、`types`、`exports`、`files`、`repository`、`publishConfig`、版本。
6. `pnpm install` 更新 lockfile；提交 `pnpm-lock.yaml`。CI 必须 `--frozen-lockfile`。
7. 运行 `pnpm run constraints`、`pnpm run package-dependencies`、`pnpm run publint`（构建后）、`pnpm run package-meta`、`pnpm run verify-dsh-package-licenses`；发布改动再跑 release lane。

**完成信号**：干净环境 `pnpm install --frozen-lockfile` 成功；未允许的安装脚本没有执行；`pnpm -r list` 能看到成员；`constraints`/`package-dependencies` 无错误。

**失败处理**：
- 安装报 ignored build scripts：补 `allowBuilds`，不要关闭 strict。
- lockfile 不同步：本地 `pnpm install --lockfile-only`，审查 diff 后提交。
- 成员只出现在一份清单：先确认使用该清单的 gate，再决定是否同步；不要假设另一份"肯定也会读到"。

**例外**：`benchmarks`、`python/sdk-runtime` 只属于 pnpm 成员；`native/` 在 `package.json.workspaces` 中但被许可证生成器标为 dev-only area（`deepseek-harness/scripts/gen-third-party-notices.ts:30-37@687f282e`）。迁移时若不用 `package.json.workspaces` 相关脚本，可以省略该字段，但不能让两份清单独自漂移。

**证据边界**：未验证 pnpm 的 `strictDepBuilds` 实际默认行为；`nodeLinker` 未在 `pnpm-workspace.yaml` 显式写出，文档只声明 strict symlinked linker。迁移时建议显式写 `nodeLinker: isolated`（或等价项），不要依赖默认值。

---

来源：deepseek-harness/package.json:1-20@687f282e
来源：deepseek-harness/pnpm-workspace.yaml:1-15@687f282e
来源：deepseek-harness/package.json:275-275@687f282e
来源：deepseek-harness/pnpm-workspace.yaml:31-56@687f282e
来源：deepseek-harness/pnpm-workspace.yaml:17-24@687f282e
来源：deepseek-harness/pnpm-workspace.yaml:57-105@687f282e
来源：deepseek-harness/apps/desktop/packaging/README.md:227-227@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:513-515@687f282e
来源：deepseek-harness/docs/development.md:27-31@687f282e
来源：deepseek-harness/.github/workflows/ci.yml:96-102@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:28-36@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:1-281@687f282e

<a id="sc-workspace-protocol"></a>
## 3. workspace 协议、版本家族与发布替换

### 3.1 源义务

`checkWorkspaceProtocol` 按**依赖目标**决定协议，而不是按消费者：

- `@deepseek-ai/dsh` 或以 `@deepseek-ai/dsh-` 开头的包：必须 `workspace:*`。
- `vendor/`、`native/system`、`native/system/packages/` 中的包：必须 `workspace:~`。
- 其他 workspace 成员：必须使用任意 `workspace:` 协议。

证据：`deepseek-harness/scripts/check-workspace-constraints.ts:628-647@687f282e`。

但 `verify-package-dependencies.ts` 另有一条**作用域不同、更严格**的 `workspaceRange`（`deepseek-harness/scripts/verify-package-dependencies.ts:32-34@687f282e`）：

- `@deepseek-ai/dsh`/`dsh-*` → `workspace:*`。
- **所有其他 workspace 包** → `workspace:~`，包括 `vendor`/`native` 之外的普通内部包。
- 该规则在 `collectPackageDependencyViolations` 中执行（`deepseek-harness/scripts/verify-package-dependencies.ts:807-870@687f282e`），`--fix` 也用它写回（`deepseek-harness/scripts/verify-package-dependencies.ts:967-1038@687f282e`）。
- 它的 manifest 覆盖面是 `WORKSPACE_MANIFEST_GLOBS = apps/*、packages/*/*、vendor/*`（`deepseek-harness/scripts/verify-package-dependencies.ts:35-42@687f282e`），不是全 workspace。

两条规则是**重叠范围上的分层**，不是逻辑冲突：

- `checkWorkspaceProtocol` 覆盖所有 pnpm workspace 成员（根、packages、apps、vendor、native、benchmarks、website、python/sdk-runtime、tools）；按依赖目标：DSH=`workspace:*`，vendor/native=`workspace:~`，其他 workspace 目标只要求以 `workspace:` 开头。测试覆盖了这些消费者目录和四个依赖段（`deepseek-harness/scripts/check-workspace-constraints.spec.ts:35-105@687f282e`）。
- dependency gate 只在 apps/packages/vendor 中运行，但对其中所有 workspace 目标都要求 DSH=`workspace:*`、其他=`workspace:~`。在重叠范围内，它是 constraints 的**加强**：DSH 的 `*` 和 vendor/native 的 `~` 都满足 constraints；普通目标在 gate 内被收紧为 `~`，在 gate 外 constraints 仍允许 `workspace:^`。两者没有互相排斥的义务。
- 因此不要称二者“冲突”，也不要声称 `workspace:^` 已被仓库全局退役。它是合法 pnpm 语法；是否违规取决于目标包和 manifest 是否在 dependency gate 范围。
- `checkWorkspaceProtocol` 620-623 的 `^0.0.1` 注释讲的是**手写 range**：`pnpm pack` 不会改写它，从版本 0.0.2 发布会指向不存在的版本。这条注释不是对 `workspace:^` 的描述；`workspace:` 协议会在 pack 时被替换。

**pack 替换由 pnpm 完成，不是 Harness wrapper**：

- pnpm 官方 Workspace 文档（`https://pnpm.io/workspaces#publishing-workspace-packages`，2026-10-23 查阅）规定：pack/publish 时，`workspace:`、`workspace:*` → 目标成员的确切版本；`workspace:~` → `~<version>`；`workspace:^` → `^<version>`；`workspace:<range>` → 对应 semver range；裸 `workspace:` 等价 `workspace:*`。别名/相对路径也有各自转换。
- Harness 的 `release/pack.ts` 只调用 `pnpm pack`，然后 `validatePackedMember` 检查 tarball 存在、payload、packed identity（`deepseek-harness/scripts/release/pack.ts:22-40`、`deepseek-harness/scripts/release/pack.ts:44-70@687f282e`）；发布路径没有自己的 workspace 改写逻辑。
- 但仓库另有一个 **benchmark-only** `publishWorkspaceRange`（`deepseek-harness/scripts/benchmark-npm-resolution.ts:171-182@687f282e`），用于 synthetic npm resolution benchmark 构造 registry-facing manifest：`workspace:*`→精确版本、`workspace:^`→`^版本`、`workspace:~`→`~版本`、其他 `workspace:<range>`→去掉前缀。它不是 release pack，不要把它当成发布时的替换实现；也不要因为看到它就声称发布路径自己重写 range。
- DSH family 的 `validatePackedManifest` 进一步要求 packed `dependencies`/`optionalDependencies`/`peerDependencies` 中每个 `@deepseek-ai/dsh*` 的 range **等于成员版本**（`deepseek-harness/scripts/release/families.ts:404-414@687f282e`）；所以 DSH sibling 用 `workspace:^` 在 pack 后会得到 `^<version>`，被该检查拒绝。vendor family 只校验 identity/payload（`deepseek-harness/scripts/release/families.ts:424-470@687f282e`），不要求所有 range 等于版本。
- `workspace:^` 会把发布 range 放宽到 caret 兼容范围，可能允许消费者安装比该 release 更新的兼容版本；这不是“打包失败”或“必然重复/无法解析”。需要精确共享身份时用 `workspace:*`；Harness 对非 DSH 选择 `workspace:~` 是范围策略，不是 pnpm 语义要求。

版本与 packed 检查：

- 所有 `@deepseek-ai/dsh`/`@deepseek-ai/dsh-*` 包的 `version` 必须等于根 `version`，包括 private 包（`checkDshFamilyVersion`，`deepseek-harness/scripts/check-workspace-constraints.ts:420-432@687f282e`）。
- 根版本允许 `X.Y.Z` 或 `X.Y.Z-<prerelease>`（`checkRepositoryVersion`，`deepseek-harness/scripts/check-workspace-constraints.ts:573-579@687f282e`）。
- `native/system/packages/*` 的版本必须等于 `native/system` 的版本（`deepseek-harness/scripts/check-workspace-constraints.ts:496-506@687f282e`）。
- 发布包 tarball 的 `validatePackedMember` 校验 tarball 存在、payload 与 packed identity；DSH family 另外要求 packed DSH 图精确等于成员版本（`deepseek-harness/scripts/release/pack.ts:22-40@687f282e`、`deepseek-harness/scripts/release/families.ts:404-414@687f282e`）。
- `release:verify` 在发布模式下要求：成员不得 `private: true`；运行 ref 必须是该家族的 `tagPrefix*`，且 tag 要匹配成员版本（`deepseek-harness/scripts/release/verify.ts:40-100@687f282e`）。

发布家族（`releaseFamily` **只有 `dsh` 与 `vendor`**）：

- `dsh`：`packages/*/*` + `apps/*` 中的公开成员，共享一个版本，tag 前缀 `dsh-v`；private 成员不发布，但版本仍跟随根（`deepseek-harness/scripts/release/families.ts:345-414@687f282e`）。
- `vendor`：`vendor/*`，每个包保留自己的版本线，发布时整族递增；payload 允许上游 `src`，只拒绝空 tarball（`deepseek-harness/scripts/release/families.ts:424-470@687f282e`）。
- **`native` 不是 `releaseFamily` 成员**：`releaseFamilies()` 只返回 dsh/vendor；`releaseFamily('native')` 会抛 `unknown release family`。`native/system` 与平台包由单独的 `node-addon-system-release.yml`/native 发布序列处理；`release:pack --family native` 不可用。`native` 包在依赖中仍使用 `workspace:~`。

`bump.ts` 的行为：

- `--family dsh <major|minor|patch|x.y.z>`：根 + 所有发布成员 + 所有 private DSH 包（`apps/*`、`packages/*/*` 中 `private: true` 的包）统一版本；然后 `pnpm install --lockfile-only`；`git add` + commit；不创建 tag（`deepseek-harness/scripts/release/bump.ts:274-345@687f282e`、`deepseek-harness/scripts/release/bump.ts:350-410@687f282e`）。
- `--family vendor`：没有显式版本参数；每个包根据 manifest 与最新 tag 计算下一个 patch/prerelease 版本；整族一起 bump（`deepseek-harness/scripts/release/bump.ts:140-215@687f282e`、`deepseek-harness/scripts/release/bump.ts:319-345@687f282e`）。
- `--dry-run` 只打印计划；`--prerelease` 只对 vendor 有效（dsh 的 prerelease 写在版本参数里）。

### 3.2 操作程序：版本发布

1. 确认 family：产品包走 `dsh`，vendored 框架走 `vendor`。`releaseFamily` 没有 `native`；原生包走 `node-addon-system-release.yml`，不要传 `--family native`。
2. 运行 `tsx scripts/release/bump.ts --family <family> <version>`（或 `--dry-run` 先看计划）。检查根、所有 DSH 成员、private DSH 包、lockfile 的 diff。
3. 运行 `pnpm run constraints`：版本一致性、workspace 协议、层级、实验包命名/依赖隔离。
4. 运行 `pnpm run release:verify`：publish order、版本基线、packed 前的 tag/publishable 条件（发布模式下）。
5. 打包后运行 `pnpm run release:pack --family <dsh|vendor> --out dist/npm`；该脚本调用 `pnpm pack`（由 pnpm 做 `workspace:` 替换），再执行 payload、packed identity 与 DSH 精确版本图校验。Harness 不自己改写依赖 range。
6. 用 `release:verify-packed-install` 验证临时消费者；发布工作流只上传已验证的字节。

**完成信号**：`constraints` 无错误；`release:verify` 的 publish order 覆盖所有成员；packed identity 与成员一致；临时消费者安装成功；tag 与版本匹配。

**失败处理**：
- 错误 workspace 协议：先看范围。`checkWorkspaceProtocol` 对普通 workspace 目标接受任意 `workspace:` 前缀；dependency gate 在 apps/packages/vendor 内把所有非 DSH 目标收紧为 `workspace:~`。这不是冲突，按更严范围改即可。`workspace:^` 在 gate 外合法，pack 后是 caret range；不要描述成全局禁止，也不要描述成必然重复/无法解析。需要 DSH sibling 精确同版时用 `workspace:*`。
- 版本不一致：运行 bump 脚本，不要手改多个 manifest；手改容易漏 private DSH 包和 lockfile。
- packed identity 不一致：检查 pack 前是否有自定义 manifest 写入/构建覆盖；这是发布阻断项。
- tag 不匹配：停止发布，修版本/tag；不要 force push tag。

**例外**：
- `dsh` 使用 `workspace:*`，发布后 peer 要求匹配的 release；`vendor`/`native` 使用 `workspace:~`，允许同一 minor 的 patch 升级（`deepseek-harness/.agents/notes/implemented/process/2026-08-26-published-dependency-faces.md:36-39@687f282e`）。
- private DSH 包版本跟随根，但不发布；`release:verify` 的 publishable 检查只针对 family 成员。
- `apps/desktop`、`apps/desktop-host`、`apps/plugin-market-generator` 不在 standard release member 中（`deepseek-harness/scripts/check-workspace-constraints.ts:69-72@687f282e`）；不要用 bump 把它们变成 npm 发布物。

**证据边界**：没有执行 bump/verify；`release/bump.ts` 只读了 1-30、140-345、350-416。`release:verify` 的 tag 读取依赖 `GITHUB_REF`，本地默认不触发 publish 检查。`pnpm pack` 的 `workspace:` 替换规则来自 pnpm 官方 Workspace 文档（2026-10-23 查阅），Harness wrapper 的 `release/pack.ts` 只调用 `pnpm pack`，没有独立替换实现；真正的消费验证在 packed install。分层的 workspace range 规则来自 `check-workspace-constraints.ts:628-647` 与 `verify-package-dependencies.ts:32-34,35-42,807-870,967-1038` 的源码对照；`check-workspace-constraints.spec.ts:35-105` 固定了目标包族与消费者目录/四个依赖段的行为。未运行任一 gate，因此规则是静态结论。

---

来源：deepseek-harness/scripts/check-workspace-constraints.ts:600-642@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.spec.ts:35-105@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:434-446@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:573-580@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:490-500@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:1-58@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:813-850@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:924-959@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1008-1028@687f282e
来源：deepseek-harness/scripts/release/pack.ts:1-108@687f282e
来源：deepseek-harness/scripts/release/bump.ts:274-345@687f282e
来源：deepseek-harness/scripts/release/bump.ts:350-416@687f282e
来源：deepseek-harness/scripts/release/families.ts:345-414@687f282e
来源：deepseek-harness/scripts/release/families.ts:424-470@687f282e
来源：deepseek-harness/scripts/release/verify.ts:40-100@687f282e
来源：deepseek-harness/scripts/release/tarball.ts:14-57@687f282e
来源：deepseek-harness/scripts/benchmark-npm-resolution.ts:171-182@687f282e
来源：deepseek-harness/scripts/benchmark-npm-resolution.ts:1-170@687f282e
来源：deepseek-harness/scripts/benchmark-npm-resolution.ts:183-553@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.ts:701-820@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:291-510@687f282e

<a id="sc-dependency-faces"></a>
## 4. 四个依赖面：按源码使用事实推导

### 4.1 源义务

`verify-package-dependencies.ts` 不是"禁止任意两段重复"的简单规则，而是先推导每个依赖**应属于哪一段**，再要求实际声明精确等于推导结果。

期望段推导（`expectedPackageDependencies`）：

- `@deepseek-ai/cordis` 固定为 `peer-dev`：`peerDependencies` + `devDependencies`。
- 源码中出现的依赖（`allSourceUses`）默认 `devDependencies`；如果它同时是 Host 运行时使用，则提升为 `dependencies`。
- Host 运行时使用（`hostRuntimeSourceUses`）且是 workspace 包、被标记为 peer-required：`peer-dev`；否则 `dependencies`。
- 非 configured-host 包的浏览器构建输入：`devDependencies`。
- workspace 包的 `dsh.client.inject`：`devDependencies`。
- 已有的非 Cordis peer：`devDependencies`（源注释：existing non-Cordis peer）。
- 没有源码使用但被声明为 required Cordis service：`peer-dev`。

证据：`deepseek-harness/scripts/verify-package-dependencies.ts:704-790@687f282e`；源码/角色/tsdown 事实读取在 `deepseek-harness/scripts/verify-package-dependencies.ts:59-592@687f282e`；`--fix` 的写回在 `deepseek-harness/scripts/verify-package-dependencies.ts:924-1038@687f282e`。

源码范围与角色事实（并非所有 workspace 包都被同一策略覆盖）：

- `readWorkspacePackageManifests` 的 glob：`apps/*/package.json`、`packages/*/*/package.json`、`vendor/*/package.json`；`release` 是 `packages/!(experimental)/*`，`policy` 是 `packages/*/*`（含 experimental）。`benchmarks/`、`python/`、`native/` 不在 dependency policy 内。
- `discoverPackageDependencyScope` 产生三种 role：`client-only`、`client-host`、`configured-host`。`clientFaceInclude`/`clientFaceExclude`/`hostPackages` 的重复项、未知包、同一包同时在 include/exclude、自动发现的 Client 包被冗余 include、`clientFaceExclude` 排除 `packages/client` 或无 `dsh.client` 声明的包，都会报 policy violation。
- Host 运行时事实不是只看 `src/index.ts`：`readHostBuildEntries` 会 import package-local `tsdown.config.ts`，分别在 `DSH_BUILD_FACE=host` 与 `client` 下求值，跳过 `platform: 'browser'` 的配置和 `src/client/` 条目；`readHostRuntimeUses` 从 Host 源码入口、`exports` 中的 Host 子路径、生成的 `typert.host` 递归本地 import；`readAllSourceUses` 扫描 `src/**/*.{ts,tsx,mts,cts}`。
- 生成 typert 在读取事实前完成；生成的 Host 模块也会被扫描，因此只在生成物里出现的 import 不能靠 `src/` 扫描漏掉。
- 证据：`deepseek-harness/scripts/verify-package-dependencies.ts:32-58@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:121-200@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:200-360@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:360-592@687f282e`。

实际声明校验（`collectPackageDependencyViolations`）：

- `peer-dev`：必须恰好是 `peerDependencies` + `devDependencies`，两者 range 相同，并且**不能有** `peerDependenciesMeta[name]`。证据：`deepseek-harness/scripts/verify-package-dependencies.ts:824-850@687f282e`。
- 其他段：实际声明必须恰好一段，且等于期望段；workspace 包的 range 必须等于 `workspaceRange` 结果。证据：`deepseek-harness/scripts/verify-package-dependencies.ts:824-850@687f282e`。
- `peerDependenciesMeta` 的每个键必须有对应 `peerDependencies` 条目；孤立的 meta 报错。证据：`deepseek-harness/scripts/verify-package-dependencies.ts:850-863@687f282e`。
- 根提供的 type 包 `@types/react`、`@types/react-dom`：根 `devDependencies` 必须声明；任何 workspace 包的任一依赖段出现即报错（`--fix` 不删除）。证据：`deepseek-harness/scripts/verify-package-dependencies.ts:853-880@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.spec.ts:1212-1240@687f282e`。

Host/Client 依赖面（`collectHostDependencyExportPolicyViolations`）：

- Host 运行时导出必须分类为 `safe`（可普通依赖）或 `peer-required`（共享/必须由宿主提供）；未分类的 workspace 运行时边报错。
- `duplicateSafePackages` 中的包冗余分类会报错；未使用/无界导出（`''`、命名空间、副作用）不能分类。
- 证据：`deepseek-harness/scripts/verify-package-dependencies.ts:596-655@687f282e`。

策略表（`deepseek-harness/scripts/package-dependency-policy.ts:1-105@687f282e`，源仓库当前值；迁移时应参数化，不要把具体包名当成通用默认）：

- `clientFaceInclude`：空。
- `clientFaceExclude`：`@deepseek-ai/dsh-api-session-controller`、`@deepseek-ai/dsh-api-workspace-controller`。
- `hostPackages`：`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-session`。
- `requiredServicePeers`：`@deepseek-ai/dsh-api-terminal-controller` → `@deepseek-ai/dsh-subprocess`。
- `configurationOnlyDevDependencies`：`client-locale`→`api-remotes`；`client-ui-conversation`→`api-remotes`+`client-ui-workspace`；`client-ui-model-selection`→`client-ui-input-trigger`；`client-ui-sidebar`→`client-ui-workspace`；`client-ui-subagent`→`client-ui-input-trigger`；`client-ui-theme`→`api-remotes`；`client-ui-tool`→`api-remotes`。
- `duplicateSafePackages`：`dsh-brand`、`dsh-lazy-require`、`dsh-typert-protocol`、`dsh-util-code-language`、`dsh-util-crypto`、`dsh-util-values`。
- `safeHostDependencyExports`：`dsh-credentials#credentialKey`、`dsh-deque#Deque`、`dsh-llm#callConfigEquals`、`dsh-session-format#sessionFormatLogFilename`、`dsh-timeout#MAX_TIMER_DELAY_MS`、`schemastery#default`。
- `peerRequiredHostExports`：`dsh-experimental-translator#TranslationError`；`dsh-scope#carrierKeyOf/createScope/scopeOf/scopeTarget`；`dsh-session#SESSION_FORMAT_VERSION`；`dsh-session-persistence#SessionPersistenceNotFoundError`。
- `safeHostDependencyExports` 的源注释明确：新增条目默认禁止，自动化代理不得添加例外；每次新增需要明确人工评审，并在 PR 描述中使用单独、醒目的标题。精确 roster 测试（`deepseek-harness/scripts/verify-package-dependencies.spec.ts:208-250@687f282e`）会挑战任何未经同步测试的改动。

重复安装/共享身份：

- `duplicateSafePackages` 的完整 runtime surface 被视为可跨副本；这些包会被跳过 safe/peer 分类，且不能再被 `safeHostDependencyExports`/`peerRequiredHostExports` 冗余分类（`deepseek-harness/scripts/verify-package-dependencies.ts:301-344@687f282e`）。
- 需要共享 `instanceof`/class 身份的导出必须进 `peerRequiredHostExports`，整条边修成 peer+dev；单元测试 `deepseek-harness/scripts/verify-package-dependencies.spec.ts:1062-1134@687f282e` 覆盖了"一个导入导出要求共享身份 → 整条边变 peer"的行为。
- `@deepseek-ai/cordis` 是共享 Cordis 运行时；`deepseek-harness/scripts/verify-npm-install-layout.ts:145-217@687f282e` 的 `assertDualDshInstallLayout` 断言合成双版本安装中**恰好一份** Cordis 位于 `node_modules/@deepseek-ai/cordis`，两个 DSH release 共享它。
- `deepseek-harness/scripts/verify-package-dependencies.spec.ts:1008-1028@687f282e` 接受 Host dependencies + development-only inputs + shared Cordis 的组合。
- **边界**：这是单元测试 + metadata-only 合成布局，不是真实重复安装/运行时 smoke。真实消费者验证在 packed install；不要把它当成"重复安装已验证"。

### 4.2 操作程序

1. 先写清楚这个依赖在运行时由谁提供：本包自带（`dependencies`）、可能缺失（`optionalDependencies`）、宿主提供（`peerDependencies`）、只构建/测试（`devDependencies`）。
2. 对 Host 运行时导入，确认它是否是共享服务/共享导出：是则 `peer-dev`，否则 `dependencies`。不要凭"peer 更安全"随意加 peer。
3. 对 Cordis 运行时：`peerDependencies` + `devDependencies`，range 相同，不写 `peerDependenciesMeta`。源策略要求如此。
4. 对 workspace 包：先确定该 manifest 是否在 `verify-package-dependencies` 的 apps/packages/vendor 范围。范围内按更严规则（dsh=`workspace:*`，其他=`workspace:~`）；范围外的普通内部包只需满足 constraints 的 `workspace:` 前缀，`workspace:^` 仍合法。不要把它写成“两套规则冲突”。
5. 根 type 包只在根声明；包内不要写 `@types/react`/`@types/react-dom` 的任一段。
6. 运行 `pnpm run package-dependencies`。`--fix` 只在 `policyViolations` 为空时工作；它会修 policy-owned 关系、刷新 `pnpm-lock.yaml` 并写 module graph。必须审查 manifest/lockfile/module-graph diff；root type 包不会被 `--fix` 删除。再跑 `pnpm run constraints`、`pnpm run runtime-closure`、packed install。
7. 在 packed install 中确认：所有 `dependencies` 可解析；`optionalDependencies` 缺失时降级；peer 由消费者提供；没有 workspace 协议残留；共享身份边与 duplicate-safe 包在真实安装中没有出现第二个实例（单元/合成布局通过不等于此项完成）。

**完成信号**：`package-dependencies` 无错误；`constraints` 无错误；packed install 成功；`peerDependenciesMeta` 无孤儿。

**失败处理**：
- 报 `must be dependencies-only`：把声明从 `devDependencies`/`peerDependencies` 移到唯一期望段；不要同时保留两段。
- 报 `must be matching peerDependencies + devDependencies`：两段都要写、range 相同、去掉 `peerDependenciesMeta`；如果该 peer 真是 optional，说明它不应走 peer-dev 策略，需要改的是策略/用途，而不是偷偷加 meta。
- 报 `must use workspace:`：先判断是 constraints 的族规则还是 dependency gate 的更严规则；dsh=`workspace:*`，其他 workspace=`workspace:~`。不要用 `workspace:^` 绕过。
- 报 Host export 未分类：在 `PACKAGE_DEPENDENCY_POLICY` 的 `safeHostDependencyExports`/`peerRequiredHostExports` 中精确登记导出；不要用空字符串/命名空间"一把梭"。
- 报根 type 包：从包内删除，只在根 `devDependencies` 保留。

**例外**：
- `peer-dev` 是唯一合法的"两段"形态；它不是"optional peer"。可选的 peer 应使用 `peerDependencies` + `peerDependenciesMeta.optional: true`，但源策略对 `peer-dev` 明确禁止 meta；迁移时要为 optional peer 建立单独策略，不能硬套。
- `configured-host` 包有额外的 Host 运行时边分类；不要把普通包的规则套到它。
- 源策略的 `policy` 子集不等于所有 workspace 包；`vendor`/`benchmarks`/`website`/`python` 的行为需要单独确认，不能假设它们也被覆盖。

**证据边界**：`verify-package-dependencies.ts` 1-1038 全读（含 593-595、701-703）；`package-dependency-policy.ts:1-105` 全读。没有找到"public 包不能依赖 private 包"的独立检查；如果目标仓库需要该规则，必须自行实现，不能引用本文件充当证据。未运行 `--fix`；未运行单元测试；`assertDualDshInstallLayout` 是 synthetic/metadata-only，不是真实重复安装。共享身份与 duplicate-safe 的运行时结论仍需真实消费者验证。

---

来源：deepseek-harness/scripts/verify-package-dependencies.ts:1-58@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:59-592@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:596-655@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:656-703@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:704-823@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:824-923@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.ts:924-1038@687f282e
来源：deepseek-harness/scripts/package-dependency-policy.ts:1-105@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:208-250@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:301-344@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1008-1038@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1062-1134@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1-207@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:345-999@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1135-1211@687f282e
来源：deepseek-harness/scripts/verify-package-dependencies.spec.ts:1241-1246@687f282e

<a id="sc-manifest-publication"></a>
## 5. 发布 manifest：分类、private/public、files、exports

### 5.1 发布树与排除

`check-workspace-constraints.ts` 的 `workspaceGlobs` 只覆盖：

- `vendor/`（深度 1）
- `packages/`（深度 2，即 `packages/<group>/<pkg>`）
- `native/`（深度 1）
- `native/system/packages/`（深度 1）
- `apps/`（深度 1）

`benchmarks/`、`website/`、`python/` 不在发布 manifest 检查范围。证据：`deepseek-harness/scripts/check-workspace-constraints.ts:28-36@687f282e`。

Release member 判定（`standardReleaseMemberDirectory`）：

- 包含 `packages/<非 experimental>/<pkg>`、`apps/<非 desktop/desktop-host/plugin-market-generator>`、`vendor/<pkg>`。
- 显式排除 `apps/desktop`、`apps/desktop-host`、`apps/plugin-market-generator`。
- `packages/ssh/ssh-helper-runtime` 被排除（以可执行归档分发，不作为 npm application）。
- 实验包另由 `isPublicExperimentalPackageDirectory` 决定。
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:62-88@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:399-402@687f282e`。

### 5.2 public release member 的必备字段

对每个 release member：

- `private` 不得为 `true`；
- `publishConfig.access` 必须为 `"public"`；
- `repository.type` 必须为 `"git"`，`repository.url` 必须是源仓库 URL，`repository.directory` 必须等于包目录；
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:452-477@687f282e`。

public native 包（5 个 `@deepseek-ai/node-addon-system*`）：

- 必须 public、`publishConfig.access: "public"`、repository 字段匹配；
- 版本必须等于 `native/system` 的版本；
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:469-503@687f282e`。

private 包：

- 必须 `private: true`（非实验、非 release member 的 packages/apps）；
- 不得有 `publishConfig`（实验包分支明确要求 omit）；
- 不得有 `dsh.client`（源码 public/private 分支中的检查；见 5.4）。
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:423-460@687f282e`。

### 5.3 实验包与 native 包

实验包判定：目录匹配 `packages/experimental/<one>`，或包名以 `@deepseek-ai/dsh-experimental-` 开头，或属于 11 个保留名：

`@deepseek-ai/dsh-cua`、`dsh-tool-session-query`、`dsh-session-title-all-prompts-llm`、`dsh-tool-terminal`、`dsh-tool-ralph`、`dsh-skill-badge`、`dsh-hook-protocol`、`dsh-hooks-claude-code`、`dsh-hooks-codex`、`dsh-webhook`、`dsh-webhook-github`。

证据：`deepseek-harness/scripts/experimental-package-policy.ts:5-18@687f282e`。

规则：

- 公开实验包（`packages/experimental/<one>` 且不在 `PRIVATE_EXPERIMENTAL_PACKAGE_DIRECTORIES`，当前为空）：必须 `publishConfig.access: "public"`，不得 `private: true`。
- 私有实验包：必须 `private: true`，必须省略 `publishConfig`。
- 包名必须以前缀开头，或精确匹配其目录对应的保留名；保留名必须恰好有一个 workspace owner 在声明目录，不能移动/重命名/重复。
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:361-410@687f282e`。

### 5.4 DSH 包的 ESM 与 files

对 `packages/` 下所有 `@deepseek-ai/dsh-*` 包（包括 private）：

- `type: "module"`；
- `main: "lib/index.js"`；
- `types: "lib/types/index.d.ts"`；
- `exports["."].types === "./lib/types/index.d.ts"`；
- `exports["."].default === "./lib/index.js"`；
- `@deepseek-ai/cordis` 必须同时是 `peerDependencies` 和 `devDependencies`，两者 range 相同；
- `files` 必须精确等于 `expectedDshPackageFiles(manifest)`。

证据：`deepseek-harness/scripts/check-workspace-constraints.ts:509-545@687f282e`。

`expectedDshPackageFiles` 不是固定列表，而是从 manifest 推导：

- `icon`/`exports` 中的 icon 文件；
- `exports` 中的 locale JSON；
- `lib/index.js`；
- 有 `bin` 时加 `lib/bin.js`；
- `./worker` 为 `lib/worker.cjs`/`lib/worker.js`；
- `./client` 为 `lib/client.js`/`lib/client.browser.js`，以及 `node` 条件的 `lib/client.node.js`；
- `./loader`、`./store`、`./startup` 的独立 bundle；
- `packageFileExtras` 的包特有条目；
- `lib/types/**/*.d.ts`；
- `./typert`/`./client/typert` 的生成对；
- `./remote` 的 `typert.remote-client` 对。
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:261-320@687f282e`。

`packageFileExtras` 是硬编码映射，覆盖 CUA、webhook 示例、worker bootstrap、CSS、Python 源码、assets、SSH、subprocess、hashed chunk 等（`deepseek-harness/scripts/check-workspace-constraints.ts:180-250@687f282e`）。新增发布文件必须改这里或让文件从 exports/bin/字段推导；否则 `files` gate 失败。

App 包的特例（`appPackageFiles`）：

- `@deepseek-ai/dsh`：`['lib/*.js', 'lib/types/*.d.ts']`；
- `@deepseek-ai/dsh-desktop-host`：`['lib/index.js', 'lib/cli.js']`；
- `@deepseek-ai/dsh-web-frontend`：`['dist', '!dist/**/*.map', '!dist/preview.html', '!dist/preview']`。
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:79-88@687f282e`。

### 5.4.1 标准 export key set：文档/评审约束，不是自动 gate

`deepseek-harness/docs/defensive-patterns/package-surface.md:75-113@687f282e` 规定标准键集合：`.`、`./package.json`、`./src/*`、`./client`、`./types`、`./typert`、`./remote`、`./locale/*.json`、`./cordis.patch.yml`。集合外键（如 `./brand`、`./worker`、`./startup`、`./runner`、`./protocol`）是待评审遗留，不是新先例；新增键要求同时改 owning document 与 check，并获 domain owner 确认。

但**没有找到自动执行完整 key-set allowlist 的 gate**：

- `checkWorkspaceManifest` 只强制根入口 `exports["."].types` 与 `exports["."].default`（`deepseek-harness/scripts/check-workspace-constraints.ts:509-545@687f282e`）。
- `expectedDshPackageFiles` 会读取 locale/icon 键和 `./client`、`./worker`、`./loader`、`./store`、`./startup`、`./typert`、`./remote` 等特定子路径来推导 `files`，但不会拒绝集合外的其他键（`deepseek-harness/scripts/check-workspace-constraints.ts:261-320@687f282e`）。
- `deepseek-harness/scripts/verify-package-meta.ts:128-253@687f282e` 只检查 locale/icon 资源与发布文件，不检查键集合。
- `deepseek-harness/scripts/publint-all.ts:1-245@687f282e` 是通用 package lint，没有本仓库的键 allowlist。
- 因此：**新增未文档化 export key 不会被 constraints 自动拒绝**。迁移评审必须显式检查；在目标仓库补上真正的 allowlist gate 之前，不要把文档声明当成已实现强制。

### 5.5 源码/map 禁令

- `isForbiddenPublicationFile` 拒绝：路径 `src`、`src/**`、`*.d.ts.map`、`*.js.map`（`deepseek-harness/scripts/publication-payload.ts:30-45@687f282e`）。
- `validateTarballPayload` 对 packed tarball 成员执行同样规则（`deepseek-harness/scripts/publication-payload.ts:47-55@687f282e`）。
- `checkWorkspaceManifest` 对 `manifest.files` 中列出的路径做同样检查，唯一允许的源文件是 `@deepseek-ai/node-addon-system` 的 `src/main.c`、`src/flock.c`（`publicationSourceAllowlist`；`deepseek-harness/scripts/check-workspace-constraints.ts:56-58@687f282e`）。
- **例外**：`checkWorkspaceManifest` 在检查 `files` 前，如果包名在 `vendoredPackages` 集合中会直接返回，因此 vendored 包的 manifest `files` 不受 source/map 扫描（`deepseek-harness/scripts/check-workspace-constraints.ts:478-505@687f282e`）。但 `release/pack.ts` 对每个成员的 tarball 调用 `family.validatePayload`，所以 packed tarball 仍受 payload 校验；不要把"manifest 豁免"误读成"tarball 豁免"。

### 5.6 操作程序：新增公开包

1. 选目录：`packages/<group>/<pkg>`；group 不得有 `package.json`（第 6 节）。
2. 写 name/version/license/repository；version 按第 3 节与根对齐（DSH 家族）。
3. 写 `private`/`publishConfig`：public 不写 `private`，写 `publishConfig.access: "public"`；private 写 `private: true`，不写 `publishConfig`。
4. 写 `type: "module"`、`main`、`types`、根入口 `exports["."]` 的 types/default；其他 export 键先对照标准 key set，新增键需改文档/检查/owner，不能只靠 gates。
5. 写 `files`：优先让 `expectedDshPackageFiles` 从 exports/bin/locale/icon 推导；确实需要额外文件时补 `packageFileExtras` 并写理由。
6. 对 DSH 包写 `@deepseek-ai/cordis` 的 peer+dev 同 range。
7. 构建后运行 `pnpm run constraints`、`pnpm run package-meta`、`pnpm run publint`、`pnpm run verify-package-paths`（文档路径，不是发布路径）。
8. 打包后运行 `release:pack` 与 `release:verify-packed-install`；检查 tarball 没有 `src`/map。

**完成信号**：`constraints` 无错误；`files` 与 tarball 清单一致；publint/package-meta 通过；packed install 可加载每个公开入口。

**失败处理**：
- `files` 不匹配：先判断文件是否应发布；应发布则补推导/extra，不应发布则从构建/复制步骤删除。不要为了让 gate 通过而把 `src` 加进白名单。
- `exports` 多入口：源仓库只支持单个 `.`；需要子路径导入时先扩展设计，不要在单包里偷偷加。
- 源码/map 进入 tarball：修构建器的 sourcemap/复制配置；不要在 `files` 里用负模式掩盖（负模式可能被 publint 的 files 视图忽略）。
- app 包 `files` 不匹配：用 `appPackageFiles` 的精确列表，不要套普通包模板。

**例外**：vendored 包在 manifest 检查中豁免 source/map 扫描，但 tarball 仍由 `validateTarballPayload` 检查；如果确实需要发布源码，必须扩展 allowlist 并记录审计理由。`@deepseek-ai/dsh-experimental-cua-macos` 的 `native/*` 文件通过 `packageFileExtras` 发布，不是通用 `src` 例外。

**证据边界**：未构建/打包；`expectedDshPackageFiles` 的完整 60 行只读了入口和代表项，未逐项验证所有导出条件。`validateTarballPayload` 对 vendor family 的调用路径需要看 `families.ts` 的 `validatePayload` 实现（源文件 390+ 行）；本文只确认 `pack.ts` 调用了它。

---

来源：deepseek-harness/scripts/check-workspace-constraints.ts:28-36@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:37-58@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:62-88@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:180-250@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:261-320@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:434-549@687f282e
来源：deepseek-harness/scripts/publication-payload.ts:1-55@687f282e
来源：deepseek-harness/scripts/release/pack.ts:22-35@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:91-361@687f282e
来源：deepseek-harness/docs/defensive-patterns/package-surface.md:75-113@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.spec.ts:288-475@687f282e
来源：deepseek-harness/apps/cli/package.json:5-7@687f282e
来源：deepseek-harness/apps/cli/package.json:14-19@687f282e
来源：deepseek-harness/apps/cli/package.json:165-172@687f282e

<a id="sc-package-paths"></a>
## 6. 包目录层级与文档中的包路径漂移

### 6.1 源义务

`checkHierarchyShape`：

- `packages/<group>/<pkg>` 恰好两层；
- `packages/<group>/` 下不能有 `package.json`；
- `packages/<group>/<pkg>/` 下必须有 `package.json`，不能更深；
- `localArtifactDirs`（如 `node_modules`）跳过。
- 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:549-570@687f282e`。

`verify-package-paths.ts` 是**文档/TypeScript 中的包路径漂移检查**，不是发布文件存在性检查：

- 扫描 `README.md`、`.agents/notes/**/*.md`、`docs/**/*.md`、`packages/*/*.md`、`packages/*/*/*.md`、`AGENTS.md`、`packages/AGENTS.md`、`packages/**/*.ts`；
- 匹配 `packages/<path>` 引用；glob/占位符/brace 会被终止符排除；
- 只有缺失路径的某个 segment 是当前真实包名时才算 drift（避免把提案/笔误当错误）；
- 排除 `vendor/`、`lib/`、`.d.ts`、归档 Agent Note；
- 未构建的 `lib/` 路径在已存在的 depth-two 包根下忽略；
- 持久化历史区域（`docs/persistence-changes/historical-formats/**` 中标记的 generated schema region）保留旧源码路径，不视为 drift；标记必须成对、顶格、非嵌套、非行内，否则退回严格检查（`deepseek-harness/scripts/verify-package-paths.spec.ts:1-73@687f282e`）。
- 证据：`deepseek-harness/scripts/verify-package-paths.ts:1-113@687f282e`。

`gen-tsconfig-paths.ts` 是 **TS 路径别名生成器**，不是另一个手写检查：

- 它只扫描 `packages/<group>/<pkg>`，选择 manifest `name` 以 `@deepseek-ai/dsh-` 开头且存在 `src/` 的包；
- 生成的 alias 只覆盖 `name === @deepseek-ai/dsh-<目录名>` 的包；名字与目录不一致的包（例如 `@deepseek-ai/dsh-typert-protocol`）必须由手写 alias 覆盖，生成器不会臆造映射；
- alias 写入 `tsconfig.base.json` 的 `// BEGIN generated package aliases — pnpm run gen-tsconfig-paths` / `// END generated package aliases` 标记区，标记外内容不动；标记缺失或顺序错误直接报错；
- 两个目录声明同一 specifier 时报错，因为显式 map 无法表达旧 wildcard 的 group 顺序 tiebreak；
- 生成后检查每个 `@deepseek-ai/dsh-` 包都被某个 alias 覆盖；未覆盖包会经 workspace symlink 解析到 `lib/` 构建产物，造成“源码/产物平面泄漏”，所以这是 gate 失败；
- `--check` 只在字节过期时报错；`pnpm run gen-tsconfig-paths` 写回；它已删除 `@deepseek-ai/dsh-*` 的 group wildcard（`deepseek-harness/scripts/gen-tsconfig-paths.ts:1-239@687f282e`、`deepseek-harness/scripts/gen-tsconfig-paths.spec.ts:1-96@687f282e`）。

`tsconfig.base.json` 同时是 `vite-tsconfig-paths` 的解析 facade：文件头明确禁止添加 `include`/`files`（否则会把 match-all 范围泄漏到每个继承包）；基础选项是 `module: esnext`、`moduleResolution: bundler`、`allowImportingTsExtensions: true`、`rewriteRelativeImportExtensions: true`、`verbatimModuleSyntax: false`，`paths` 中另有生成区。`tsconfig.base.client.json` 在它之上加 React JSX 与 DOM lib；`tsconfig.host.json`/`tsconfig.client.json` 是两个独立 typecheck 单元，并各自把 `rewriteRelativeImportExtensions` 设为 `false`（`deepseek-harness/tsconfig.base.json:1-30@687f282e`、`deepseek-harness/tsconfig.base.client.json:1-12@687f282e`、`deepseek-harness/tsconfig.host.json:1-10@687f282e`、`deepseek-harness/tsconfig.client.json:1-15@687f282e`）。迁移时若目标仓库不用 bundler/tsx，必须重新选择 moduleResolution；不要把这里的 bundler 配置当成 NodeNext 消费证明。

### 6.2 操作程序：移动/重命名包

1. 用 `git mv` 保留历史；确保新目录仍是 `packages/<group>/<pkg>` 两层。
2. 更新所有引用：`tsconfig.base.json` 生成区（若包名与目录名一致，运行 `gen-tsconfig-paths`；否则必须手写 alias）、`tsconfig.host.json`/`tsconfig.client.json` references、package.json 的 workspace 依赖、release family glob（若适用）、docs/AGENTS/notes。
3. 运行 `pnpm run verify-package-paths`（文档/TS 漂移）和 `pnpm run verify-tsconfig-paths`（即 `gen-tsconfig-paths --check`；检查 alias 字节与未覆盖包）。
4. 运行 `pnpm run constraints`（层级、workspace 协议、版本）。
5. 构建后运行 `pnpm run verify-package-meta` 与 `pnpm run publint`，确认发布文件引用仍然有效。
6. 运行 `pnpm run verify-doc-refs`、`verify-md-links` 等相关文档 gate（若目标仓库有）。

**完成信号**：`verify-package-paths` 无 broken refs；`verify-tsconfig-paths` 无错误；`constraints` 通过；构建/发布检查通过。

**失败处理**：
- 文档引用旧路径：更新文档；如果是提案中的未来包，给引用加反引号/占位符让 gate 跳过，或明确标注"planned"。
- `tsconfig` 引用旧路径：更新 base paths 与 project references；否则源码解析仍指向旧目录。
- 层级错误：把包移到正确 group；不要为了让 gate 通过而在 group 下加 `package.json`。

**例外**：`verify-package-paths` 只检查"缺失且 segment 命中真实包名"的引用；纯 typo/未来包不会报错。`lib/` 未构建路径在 depth-two 包根下被忽略，因此它不是构建产物存在性检查。`vendor/` 被排除，vendor 内部路径漂移不在该 gate 范围。持久化历史区域中的旧路径是有意保留的，但标记畸形会把该区域重新纳入严格检查。`gen-tsconfig-paths` 只为“包名等于目录名”的包生成 alias；名字不一致的包必须手写 alias，否则 `uncoveredPackages` 会失败，而不是静默回退到 `lib/`。

**证据边界**：未运行；`verify-package-paths.ts` 1-113 全读，`verify-package-paths.spec.ts` 1-73 全读；`gen-tsconfig-paths.ts` 1-239、`gen-tsconfig-paths.spec.ts` 1-96 全读。未单独逐行阅读 `repo-files.ts`/`historical-schema-region.ts` 的标记解析实现，标记规则依据 spec 的行为断言。`tsconfig.base.json` 只读 1-30，`tsconfig.host.json`/`tsconfig.client.json` 只读 1-80；其余 compilerOptions/references 未逐行核对。

---

来源：deepseek-harness/scripts/check-workspace-constraints.ts:549-570@687f282e
来源：deepseek-harness/scripts/verify-package-paths.ts:1-113@687f282e
来源：deepseek-harness/scripts/verify-package-paths.spec.ts:1-73@687f282e
来源：deepseek-harness/scripts/gen-tsconfig-paths.ts:1-239@687f282e
来源：deepseek-harness/scripts/gen-tsconfig-paths.spec.ts:1-96@687f282e
来源：deepseek-harness/package.json:100-160@687f282e
来源：deepseek-harness/tsconfig.base.json:1-30@687f282e
来源：deepseek-harness/tsconfig.base.client.json:1-12@687f282e
来源：deepseek-harness/tsconfig.host.json:1-10@687f282e
来源：deepseek-harness/tsconfig.client.json:1-15@687f282e
来源：deepseek-harness/tsconfig.base.json:207-214@687f282e
来源：deepseek-harness/tsconfig.base.json:333-365@687f282e
来源：deepseek-harness/tsconfig.base.json:366-366@687f282e
来源：deepseek-harness/tsconfig.base.json:560-560@687f282e

<a id="sc-esm-payload"></a>
## 7. ESM、exports、publint、NodeNext、顶层 await 与 package-meta

### 7.1 源义务

- 根与 DSH 包使用 ESM：根 `type: module`（`deepseek-harness/package.json:6-6@687f282e`）；`packages/` 下 DSH 包必须 `type: module`、`main: lib/index.js`、`types: lib/types/index.d.ts`、单个 `.` exports（`deepseek-harness/scripts/check-workspace-constraints.ts:509-545@687f282e`）。
- `AGENTS.md` 还要求不要从 `tsx` 可达路径引入仅 CJS 的包（`deepseek-harness/AGENTS.md:82-89@687f282e`）。这没有看到独立的自动 gate；主要靠构建/运行时测试暴露，属于 [源事实]/[未验证]。
- **顶层 await 禁止**：`verify-no-top-level-await` 用 TypeScript AST 扫描 `packages/*/*/src/**/*.{ts,tsx}`，检测模块作用域的 `await`、`for await`、`await using`。
  - 排除：以 `#!` 开头的可执行文件；manifest `bin` 指向的 `lib/<path>.js` 对应源码（仅当 `bin` 在 `lib/` 下）。
  - 没有 Cordis 特殊允许列表；`vendor/`、`apps/`、`native/` 不在 corpus。
  - corpus 完整性：glob 为空、没有 `.tsx`、或漏掉任一含 TS 源码的 `packages/*/*/src` 目录，直接失败。
  - 证据：`deepseek-harness/scripts/verify-no-top-level-await.ts:1-267@687f282e`。
- **publint**：`publint-all` 对 `packages/*/*`（仅此目录）构造 publication view：
  - 从 `package.json` + `files` 模式 + `README*`/`LICENSE*`/`CHANGELOG*`/`NOTICE*` 收集文件；
  - 递归包含 dotfiles（与 npm pack 一致）；
  - 用 `publint({ pkgDir: 'package', pack: { files } })` 检查；
  - 额外检查发布 JS 中的相对 import 是否都能在发布视图中解析；
  - 过滤 `isBrowserBundleFormatFalsePositive` 的已知误报；
  - 有 error 或 closure violation 即失败。
  - 证据：`deepseek-harness/scripts/publint-all.ts:1-245@687f282e`。
- **NodeNext 类型消费**：`verify-node-next-types`：
  - 包集合是 `vendor/*` + `packages/*/*`，不含 `apps/`；
  - 先检查 `lib/types/**/*.d.ts` 的相对 specifier 是否都有扩展名；
  - 从 `types` + 非通配 exports 的 `types` 条件收集公开 specifier；
  - 在临时目录建立 `node_modules` 软链（它自己软链 workspace 包），写 `type: module`、`module/moduleResolution: NodeNext`、`skipLibCheck: true`、`preserveSymlinks: true`，用 `tsc --noEmit` 编译所有公开入口；
  - 需要先 `pnpm run build`。
  - 证据：`deepseek-harness/scripts/verify-node-next-types.ts:1-164@687f282e`。
- **package-meta**：`verify-package-meta` 对 `packages/*/*` 检查：
  - locale JSON 的 `name`/`meta` 形状、`exports` 是否暴露 `locale/*.json`、`en.json` 基线、同一 locale 目录、`files` 是否包含这些源 JSON；
  - icon 导出/`icon` 字段是否解析到源 JSON；DSH 包的 SVG 必须 36x36、`viewBox="0 0 36 36"`、有几何、无 script/style/image/foreignObject/text/animation、id 唯一、引用本地 id；
  - 嵌套包/plugin 的 locale 资源必须被外层 exports 暴露。
  - 不验证构建输出（明确说"reading built output would make the result depend on stale artifacts"）。
  - 证据：`deepseek-harness/scripts/verify-package-meta.ts:1-285@687f282e`。

### 7.2 操作程序

1. 包只暴露一个 `.` 入口；`exports` 按 `types`、`default` 写。源仓库不支持子路径公开入口（`check-workspace` 强制单个 `.`）。
2. 源码用 `import type` 做类型导入；不要留下运行时对 devDependency 的引用。
3. 禁止模块作用域 await；把异步工作放进显式 `main()`/`initialize()` 或 Cordis 生命周期。
4. 构建后运行 `pnpm run publint`、`pnpm run verify-node-next-types`、`pnpm run verify-package-meta`、`pnpm run verify-package-dependencies`。
5. 打包后运行 `release:pack`、`release:verify-packed-install`；在临时消费者中 `import` 每个公开入口。
6. 新增 locale/icon 时，同时更新 `exports`、`files`、`expectedDshPackageFiles` 的推导/extra，并运行 package-meta。

**完成信号**：publint 无 error/closure；NodeNext 临时消费者编译通过；package-meta 无 locale/icon/files 错误；packed install 每个入口可加载；TLA 扫描零命中。

**失败处理**：
- NodeNext 报相对 specifier 无扩展名：修构建产物的 `.d.ts` 生成（源文件导入带 `.js`），不要加 `paths` 兜底。
- publint 报 types 不在 files：让 `files` 包含声明文件，或从 exports 移除该 types 条件。
- package-meta 报 locale 未暴露：在 `exports` 添加对应 `./locale/*.json`，并确保 `files` 包含；不要只把文件复制到 `lib`。
- TLA 报错：改成显式异步函数；如果确实需要 TLA，源仓库不支持该路径，迁移时要建立例外/评审机制。
- publint 浏览器字段误报：确认是已知 false positive 后，在 `publint-browser-format.ts` 的精确规则中排除；不要全局关闭 publint。

**例外与边界**：
- `publint`/`package-meta` 只覆盖 `packages/*/*`；`apps/*`、`vendor/*`、`native/*` 不在内。
- `node-next-types` 覆盖 vendor+packages，但不覆盖 apps；它用软链 workspace 包，不能证明真实安装/hoisting；真实安装由 packed install 证明。
- `no-TLA` 只覆盖 `packages/*/*/src`；`vendor/`、`apps/`、`native/` 的 TLA 不会被它发现。
- `package-meta` 只对 `@deepseek-ai/dsh-*` 的 SVG 执行官方图形规范；其他包/栅格图标只做元数据与发布检查。
- 顶层 await 的 `bin` 排除依赖 manifest 的 `bin` 映射；`bin` 指向 `lib/` 外时不会排除任何源码。

**证据边界**：未运行这些 gate；publint 的 `isBrowserBundleFormatFalsePositive` 细节未逐行阅读。NodeNext 的 `skipLibCheck: true` 会跳过第三方声明噪声，但源仓库另有显式扩展名扫描来补足。

---

来源：deepseek-harness/package.json:6-6@687f282e
来源：deepseek-harness/AGENTS.md:82-89@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:509-545@687f282e
来源：deepseek-harness/scripts/publint-all.ts:1-245@687f282e
来源：deepseek-harness/scripts/verify-node-next-types.ts:1-164@687f282e
来源：deepseek-harness/scripts/verify-no-top-level-await.ts:1-110@687f282e
来源：deepseek-harness/scripts/verify-no-top-level-await.ts:140-220@687f282e
来源：deepseek-harness/scripts/verify-package-meta.ts:1-285@687f282e

<a id="sc-optional-deps"></a>
## 8. 可选依赖：静态 value import 必须为零

### 8.1 源义务

`verify-optional-dependency-imports` 把"可选"定义为：

- `optionalDependencies` 中的包；或
- `peerDependencies` 中带 `peerDependenciesMeta[name].optional === true` 的包。

它只扫描**会发布**的源码：`packages/*/*/src/**` 与 `apps/*/src/**`，不含 `vendor/`。对每个静态 import/re-export：

- 裸 `import 'x'`：加载；
- `import type`：不加载；
- `import defer`：仍加载（phase modifier 不是 TypeKeyword；注释明确说它会解析/链接模块）；
- 默认导入、命名空间导入：加载；
- 命名导入：只有当至少一个绑定在值空间使用时才加载；`verbatimModuleSyntax` 关闭，所以仅类型使用的命名导入会被编译器擦除；
- `export *`/namespace export：加载；具名 re-export 的值绑定才加载；
- 无法解析的符号按"值"处理（fail closed）。
- 两个 compiler face（host/client）都扫描。
- 证据：`deepseek-harness/scripts/verify-optional-dependency-imports.ts:1-213@687f282e`。

### 8.2 操作程序

1. 在 manifest 中把包放到 `optionalDependencies`，或 `peerDependencies` + `peerDependenciesMeta.optional: true`。
2. 搜索静态 import；优先改成 `import type`（如果只是类型），或重构到函数/生命周期内。
3. 动态 `import()` 只作为最后手段：源注释明确"dynamic import 只把失败推迟到首次使用，属于真正需要该包并处理缺失的调用方，不应是默认答案"。
4. 确保降级路径有测试：未安装时功能可用/给出明确错误；已安装时正常。
5. 运行 `pnpm run verify-optional-dependency-imports`；再构建、打包、在临时消费者中分别测试安装/不安装可选依赖。
6. 在 packed install 中检查 `ignoredOptionalDependencies` 的 fixture 行为（`deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:170-190@687f282e`）。

**完成信号**：静态扫描零命中；两种消费者都能加载；缺失时错误可读；构建产物没有把可选依赖内联。

**失败处理**：
- 报静态加载：先判断是否真的需要运行时值；类型导入改 `import type`；不要用 `require` 绕过扫描。
- 动态导入后仍在模块顶层使用：把使用点移到函数内；否则捕获了导入错误仍会崩。
- 打包器把动态导入内联：检查 external 配置；可选依赖不应被 bundle 进主包。

**例外**：`peerDependenciesMeta.optional` 必须先有对应 `peerDependencies`，否则 `check-workspace-constraints` 会报孤儿；optional peer 的静态导入仍禁止。`import defer` 不会被当作类型导入。

**证据边界**：未运行；源文件 213 行已读。它不检查 `vendor/`，也不检查非 `src` 的脚本/测试文件。

---

来源：deepseek-harness/scripts/verify-optional-dependency-imports.ts:1-213@687f282e
来源：deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:130-190@687f282e

<a id="sc-vendor-sync"></a>
## 9. vendored 框架同步（vendor-sync）

### 9.1 源事实

`vendor/` 是 Cordis 框架及基础库的完整源码副本，以 workspace 包形式参与构建/发布。`vendor/README.md` 是权威清单，表头：

`Directory | npm name | Upstream name | Version | Upstream repo | Commit`

证据：`deepseek-harness/vendor/README.md:3-13@687f282e`。

当前 9 个包（`deepseek-harness/docs/rescope.md:18-30@687f282e`）：

| 目录 | npm 名 | 上游名 | 版本 |
|---|---|---|---|
| `vendor/cordis` | `@deepseek-ai/cordis` | `cordis` | 4.0.0-rc.7 |
| `vendor/cosmokit` | `@deepseek-ai/cosmokit` | `cosmokit` | 1.8.1 |
| `vendor/schemastery` | `@deepseek-ai/schemastery` | `schemastery` | 3.18.0 |
| `vendor/loader` | `@deepseek-ai/cordis-plugin-loader` | `@cordisjs/plugin-loader` | 1.0.0-rc.5 |
| `vendor/include` | `@deepseek-ai/cordis-plugin-include` | `@cordisjs/plugin-include` | 1.0.4 |
| `vendor/group` | `@deepseek-ai/cordis-plugin-group` | `@cordisjs/plugin-group` | 1.0.0 |
| `vendor/timer` | `@deepseek-ai/cordis-plugin-timer` | `@cordisjs/plugin-timer` | 1.1.2 |
| `vendor/hmr` | `@deepseek-ai/cordis-plugin-hmr` | `@cordisjs/plugin-hmr` | 1.0.15 |
| `vendor/logger-console` | `@deepseek-ai/cordis-plugin-logger-console` | `@cordisjs/plugin-logger-console` | 1.0.0 |

`vendor/README.md` 规定：

- 复制到 monorepo 的信号：需要接管框架层（调度、插件、schema 校验）与基础库的发布；这是发布决策，不是普通依赖升级。
- 同步流程：先在上游 workspace 同步，不直接在这个仓库改上游包；每个 vendored 包保留 `package.json`，写明版本、repository、exports。
- 本地修改必须记录在 `vendor/README.md` 的 "Local modifications"；`vendor/` 测试失败先判断是上游回归还是本地修改丢失。
- 证据：`deepseek-harness/vendor/README.md:15-57@687f282e`。

自动 guard 只有 lefthook pre-commit 的 `vendor manifest guard`：脚本读取 `git diff --cached --name-only`，只要命中 `^vendor/[^/]+/(src/|bin\.js)` 且同一 staged 批次没有 `vendor/README.md`，就退出 1。它**不**验证 README 是否记录了正确 delta，也不覆盖 `vendor/<pkg>/package.json`、tsconfig、README 等其他文件（`deepseek-harness/lefthook.yml:31-33@687f282e`、`deepseek-harness/scripts/check-vendor-manifest.sh:1-17@687f282e`）。因此“本地修改逐项 diff 为空”只能是人工完成信号，不是自动 gate；`vendor/README.md:37-57` 还要求同步后运行 `npm run test`、`pnpm run build` 并检查 `git diff -U0 vendor/<pkg>`，同样需要执行者实际运行。

本地修改日志（`vendor/README.md:59-73`）覆盖：HMR/timer locale 删除、package manifest、tsconfig、`.ts` 扩展名、tsdown 配置、fiber 生命周期、include refresh/patch、HMR readiness、ESM 条件导出、`applyEntryPatches`、loader observer、`writeTask` 类型、durable writes、延迟配置解析、rescope、禁用插值、loader shape detection、fiber identity、logger disposer、volatile config、module identity、timer locale 等。每一项都写明行为差异与测试覆盖。

`vendor/AGENTS.md` 说"Cordis 和 Cosmos 是 vendored upstream code；只有构建/打包问题才改，其他修改应重新评估"（`deepseek-harness/vendor/AGENTS.md:1-7@687f282e`）。这与 README 的本地修改日志并存，是源仓库的内部张力；迁移时应写成明确政策（允许的修改类别 + 审批 + 每次同步的 delta 审查）。

### 9.2 操作程序：同步一个 vendored 包

1. 在上游 workspace 同步/测试；记录上游 commit（short hash）与版本。
2. 把上游 `src/`（以及 `bin.js`、README、LICENSE）复制到 `vendor/<pkg>/`；保留本仓库的 `package.json` 字段（name、repository、exports、files、private/version）。
3. 按 `vendor/README.md` 的本地修改清单逐项重新应用；不要直接覆盖清单中列出的文件/片段。重新应用后逐项 diff。
4. 更新 `vendor/README.md` 的版本/commit 表；新增/删除本地修改要更新日志（原因、文件、行为、测试）。
5. 若 npm 名/上游名/目录变化，运行 `pnpm run rescope-vendor`（第 10 节）并检查 `docs/rescope.md` 映射。
6. `pnpm install` 更新 lockfile；运行 `pnpm run gen-third-party-notices` 更新 notices；若改 README，运行 translation pairing。
7. 先 stage 改动，再运行 `bash scripts/check-vendor-manifest.sh`（仓库没有 `pnpm run verify-vendor-manifest` 脚本；pre-commit 自动跑同一脚本）与 `pnpm run constraints`；运行该 vendor 包测试与全仓 build。该 guard 只证明 `vendor/README.md` 也被 stage，不证明 delta 记录正确。
8. 发布前运行 `release:pack --family vendor` 与 `release:verify-packed-install --family vendor`。

**完成信号**：staged 集合通过 vendor manifest guard（只证明 README 被 stage）；本地修改逐项 diff 为空；测试通过；notices 更新；lockfile 只含预期变化；vendor tarball 可安装。

**失败处理**：
- 上游覆盖本地修复：从 git diff 恢复，按清单重新应用；不要 `--theirs` 整体覆盖。
- 版本/目录不匹配：修 README 或 package.json，不要只修一边。
- `src/` 缺失：确认该包是否应发布源码；不要直接套用第 5 节的 source/map 规则（vendored 包在 manifest 检查中豁免，但 tarball 仍有 payload 校验）。
- notices 大幅变化：检查是否引入新传递依赖；按第 12 节重生成并审查。

### 9.3 新增 vendored 包清单

- `vendor/<pkg>/package.json`：name `@deepseek-ai/<pkg>`，version 与上游/发布策略一致，repository 指向本仓库，exports/files 指向 `lib`，private 按发布决策。
- `vendor/<pkg>/tsconfig.json`：继承仓库基座；需要时加入 `tsconfig.base.json` paths 与 `tsconfig.host.json` references。
- `vendor/<pkg>/tsdown.config.ts`：只有与仓库默认不同才添加。
- `vendor/README.md`：新增表行（目录、npm 名、上游名、版本、repo、commit）。
- 若发布：加入 vendor release family；运行 publint/node-next/package-meta（注意这些 gate 不自动覆盖 vendor 的 manifest files，需显式纳入）。
- 若带原生构建/安装脚本：加入 `allowBuilds` 并审查。
- 传递依赖：也 vendored，或显式声明 registry 依赖并说明为什么不用 vendoring。避免"一半 vendored、一半 registry"的混合闭包。

**证据边界**：未执行同步；`vendor/README.md` 1-73 与本地修改日志 59-73 已读，但未逐条验证每项修改与上游行为差异。`scripts/check-vendor-manifest.sh:1-17` 与 `lefthook.yml:31-33` 已读；仓库没有 `verify-vendor-manifest` 的 package script，guard 也不检查 README 内容。

---

来源：deepseek-harness/vendor/README.md:1-13@687f282e
来源：deepseek-harness/vendor/README.md:15-57@687f282e
来源：deepseek-harness/vendor/README.md:59-73@687f282e
来源：deepseek-harness/docs/rescope.md:18-30@687f282e
来源：deepseek-harness/vendor/AGENTS.md:1-7@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:37-47@687f282e
来源：deepseek-harness/scripts/check-vendor-manifest.sh:1-17@687f282e
来源：deepseek-harness/lefthook.yml:5-33@687f282e

<a id="sc-vendor-rescope"></a>
## 10. vendored 包重命名（vendor-rescope）

### 10.1 源事实

`scripts/rescope-vendor.ts` 把 9 个 vendored 包从上游 npm name 迁移到 `@deepseek-ai/*`：

| 目录 | 上游名 | 本地名 |
|---|---|---|
| `cordis` | `cordis` | `@deepseek-ai/cordis` |
| `cosmokit` | `cosmokit` | `@deepseek-ai/cosmokit` |
| `schemastery` | `schemastery` | `@deepseek-ai/schemastery` |
| `loader` | `@cordisjs/plugin-loader` | `@deepseek-ai/cordis-plugin-loader` |
| `include` | `@cordisjs/plugin-include` | `@deepseek-ai/cordis-plugin-include` |
| `group` | `@cordisjs/plugin-group` | `@deepseek-ai/cordis-plugin-group` |
| `timer` | `@cordisjs/plugin-timer` | `@deepseek-ai/cordis-plugin-timer` |
| `hmr` | `@cordisjs/plugin-hmr` | `@deepseek-ai/cordis-plugin-hmr` |
| `logger-console` | `@cordisjs/plugin-logger-console` | `@deepseek-ai/cordis-plugin-logger-console` |

运行模式必须区分：

- **无模式**（`pnpm run rescope-vendor`）是 dry run：只统计将要改的文件/行，不写文件。
- `--apply` 才写文件；`--check` 断言**post-state**：没有残留、每个 exact edit 都已落地、所有 postcondition 命中、再跑一次 `--apply` 是 no-op。
- `--reverse` 反转方向；它必须与 `--apply`/`--check` 组合，例如 `rescope-vendor --apply --reverse`。不要以为裸 `--reverse` 会写文件。

通用替换只改**被引号/`name:` 完整包围的包名 token**：`'old'`、`"old"`、反引号、`'old/subpath'`、YAML `name: old`。它不会改 `cordis.yml`、Loader 的 `cordis:` 前缀、`cordis-config-entry`、`@deepseek-ai/dsh-tool-cordis`、`cordiverse/cordis`；scoped 名中的 `cordis` 前面有 `/`，因此替换是幂等的。Markdown 的全部 fenced code 都跟随重命名；只有 `docs/` 下的 prose 跟随，其他目录的 prose 保留历史事实（例如 Python SDK 的 `cordis` 选项、未 vendoring 的 `@cordisjs/plugin-http`）。

无法用 token 规则表达的站点（点号访问、无引号对象键、正则字面量、vendor manifest 表）列入 `EXACT_EDITS`，每个都带**精确命中次数**；命中数不符、位置移动或重复插入会让整次运行失败，且**不写任何文件**。`GENERIC_SKIPS` 还保护：`schemastery` 的 `Symbol.for` 标识、`cordis` 的 agent preset id、`cordis/*` 事件域、目录名等。`POSTCONDITIONS` 对关键文件做精确计数断言。

排除规则：脚本自身、`.agents/notes/**`（历史记录）、`scripts/snapshots/**`（逐字模型载荷）、`docs/rescope.md`/`.zh.md`（映射文档同时列两名）、`*.i18n.yaml`（配对哈希）、`pnpm-lock.yaml`、`scripts/dependency-catalog/package-lock.json`、`vendor/*/README.md` 与 `vendor/*/LICENSE`（上游原文）不扫描；其他非文本扩展也不扫描。vendor README 的 manifest 表由 exact edit 更新，而不是通用替换。

`AGENTS.md` 要求改动 vendor 后运行 `pnpm run rescope-vendor`，再检查 `docs/rescope.md` 的映射（`deepseek-harness/AGENTS.md:88-89@687f282e`）。`rescope-vendor:check` 在 `hygiene` 中运行，不在 `ci-static`。

### 10.2 操作程序

1. 新增/重命名 vendored 包时，先在脚本 `RENAMES` 与 `docs/rescope.md` 同时加映射；只改一处会导致 dry-run 与文档不一致。
2. 先跑无模式 `pnpm run rescope-vendor`，检查将改的 file/line 分类计数；确认没有把产品 id、事件域或上游原文纳入。
3. 如果新增了 token 规则无法表达的站点，补 `EXACT_EDITS`（含精确 hit count）与必要 `POSTCONDITIONS`；不要靠手工改文件绕过。
4. 运行 `pnpm run rescope-vendor -- --apply`（pnpm 需要 `--` 透传；等价于 `tsx scripts/rescope-vendor.ts --apply`）。
5. 按脚本提示运行 `pnpm install`（更新 lockfile/workspace 链接）、`pnpm run gen-third-party-notices`、并重新录制受影响的 bilingual pairs。
6. 运行 `pnpm run rescope-vendor:check`，再 stage 改动并运行 `bash scripts/check-vendor-manifest.sh`（或依赖 pre-commit）、`constraints`、相关测试与 packed install。
7. 需要回退时用 `--apply --reverse`，再重新 install/notices/pairing；不要只 reverse 一半文件。

**完成信号**：dry-run 报告符合预期；`--apply` 后 `--check` 输出 "post-state verified — no residue, every exact edit landed, idempotent."；vendor manifest guard、constraints、测试通过；lockfile 只出现预期的 workspace 变化；旧 scope 的运行时导入为零（历史 prose/上游文档除外）。

**失败处理**：
- `exact edit ... neither pending nor cleanly applied`：源码站点被上游改动；先修 `find`/`replace`/`expect`，不要手工把文件改成半状态。脚本在写之前已拒绝整次运行。
- `residue: ... still carries a pre-rescope name token`：检查该文件是否被误排除、是否在 `GENERIC_SKIPS` 中、或 token 形态不是被引号完整包围；不要加宽泛 skip 掩盖。
- 文档 prose 没变：非 `docs/` 的 prose 按设计保留历史；如果它实际是用户要执行的配置，改放到 fenced code 或 `docs/`。
- reverse 后产品 id 被改坏：从 Git 恢复该文件，调整 `GENERIC_SKIPS`/`EXACT_EDITS`，再重新 apply；reverse 不是“万能撤销”。
- lockfile 大面积变化：检查是否误改了 registry 依赖；rescope 只应影响 vendored 包的名称/链接。

**例外**：rescope 只处理名称，不处理 API/行为变化；`--check` 的成功还依赖 exact edit 与 postcondition，不只是“搜不到旧名”。vendor 上游 `README`/`LICENSE` 永远保留原文。`docs/rescope.md` 自身同时列上游名和本地名，不能被通用替换。`--check` 不在普通 `ci-static` lane。

**证据边界**：`rescope-vendor.ts` 661 行全读；`docs/rescope.md` 1-31 全读。未执行 dry-run/apply/reverse/check；未跑 fixture。`EXACT_EDITS` 的每个站点未逐条在目标文件验证，命中数行为来自源码；reverse 的实际文件结果未观测。

---

来源：deepseek-harness/scripts/rescope-vendor.ts:1-661@687f282e
来源：deepseek-harness/docs/rescope.md:1-31@687f282e
来源：deepseek-harness/AGENTS.md:88-89@687f282e

<a id="sc-vendor-patches"></a>
## 11. 外部补丁（pnpm patchedDependencies）

### 11.1 源事实

`pnpm-workspace.yaml` 注册了 8 个补丁（`deepseek-harness/pnpm-workspace.yaml:108-116@687f282e`），每个键都是**精确包版本**：

| 包 | 补丁 | Desktop 决定 | 补丁作用（源码 diff 观察） |
|---|---|---|---|
| `@earendil-works/pi-ai@1.1.0` | `@earendil-works__pi-ai@1.1.0.patch` | shared；运行时 provider 需要流式参数修复 | 移除 6 个 provider adapter 在每次 delta 上调用 `parseStreamingJson` 的赋值，避免半截 JSON 被提前解析 |
| `@electron/osx-sign@1.3.3` | `@electron__osx-sign@1.3.3.patch` | workspace-only；签名只在 build host 执行 | `walkAsync` 把 `fs.stat` 改为 `fs.lstat`，不跟随 symlink |
| `@fortune-sheet/core@1.0.4` | `@fortune-sheet__core@1.0.4.patch` | workspace-only；补丁代码嵌入 client bundle | HTML 导出改用 `_.escape`；只读模式跳过 freeze line；只读 trackpad 双轴平移 |
| `@fortune-sheet/react@1.0.4` | `@fortune-sheet__react@1.0.4.patch` | workspace-only；补丁代码嵌入 client bundle | 只读公式栏用 `textContent`/`cell.f`；保留 sheet 选择；只读时把 tab 导航宽度计入 scroll 判定 |
| `@yao-pkg/pkg@6.21.0` | `@yao-pkg__pkg@6.21.0.patch` | workspace-only；可执行打包器只在 build host 执行 | 解包 addon 用同目录临时文件 + rename 原子写入；VFS `readdirSync(..., {withFileTypes:true})` 返回 `SEADirent`；worker bootstrap bundle 同步更新 |
| `app-builder-lib@26.17.0` | `app-builder-lib@26.17.0.patch` | workspace-only；DMG 格式校验只在 build host 执行 | 给 DMG `format` 增加 `ULMO`（类型 + scheme） |
| `exceljs@4.4.0` | `exceljs@4.4.0.patch` | workspace-only；补丁 parser 嵌入 client bundle 和 worker | XLSX 解析硬化：XML namespace 规范化、CDATA、关系图重解析、大小写不敏感 part 唯一性、拒绝 external/缺失/冲突 part、UTF-16 BOM |
| `node-pty@1.2.0-beta.15` | `node-pty@1.2.0-beta.15.patch` | shared；运行时终端需要 helper 解析和 Windows worker 清理 | `DSH_NODE_PTY_SPAWN_HELPER` 覆盖、`execPath + '-spawn-helper'` sibling、回退 `native.dir`；kill 后立即 dispose conout worker |

Desktop 不是简单复用整个 patch 列表，而是用 `apps/desktop/scripts/runtime-patch-policy.ts` 给**每个** workspace 补丁显式分类（`shared`/`workspace-only`/`runtime-only`），并写 reason：

- 每个 `pnpm-workspace.yaml.patchedDependencies` 键都必须有 policy 条目；漏一个报 `classify the workspace patch`。
- policy 里的 `shared`/`workspace-only` 条目如果已不在 workspace patch 中，报 `stale workspace patch decision`；`runtime-only` 可以引用仓库内的独立 patch 文件。
- `shared` 复用根 patch 字节，并要求其 sha256 等于根 `pnpm-lock.yaml.patchedDependencies[spec]`；`runtime-only` 用 `path` 指向仓库内文件；`workspace-only` 不进入 Desktop runtime。
- `prepareRuntimePatches` 只写临时 project（拒绝 `projectRoot === repositoryRoot`），把选中的补丁复制为 `patches/desktop-0.patch` 等，并写 `allowUnusedPatches: false`；依赖 override 单独声明，不从 patch 版本推断。当前唯一的 override 是 `@earendil-works/pi-ai@^1.1.0` → `1.1.0`。
- 安装后 `verifyRuntimePatches` 检查：选中的 patch 有实际 runtime 依赖、staged 字节/hash 未变、lockfile hash 匹配、`workspace-only` 包未进入 runtime、解析版本与 patch 版本匹配。

`allowUnusedPatches: true` 只出现在 packed-install fixture（`deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:170-190@687f282e`）；Desktop production 明确写 `false`。源仓库没有 `patches/README.md`，也没有上游 issue/移除版本字段；每个补丁的“为什么”只散落在 Desktop policy 的 reason（且那是 Desktop 范围理由，不完全是 patch 意图）。

### 11.2 操作程序

1. 升级被补丁包时，先确认补丁是否仍适用；`patchedDependencies` 用精确版本键，版本变了不会自动套用。先跑 frozen install 或 `pnpm install`，看是否报 unused patch/应用失败。
2. 用 `pnpm patch <pkg>@<version>` 生成临时目录，修改后 `pnpm patch-commit`；把 patch 放进 `patches/`，更新 `patchedDependencies` 的精确版本键。
3. 如果是 workspace 补丁，更新 `DESKTOP_RUNTIME_PATCHES`：每个新增/删除键都要有显式 `shared`/`workspace-only`/`runtime-only` 决定和 reason；不要用“默认 shared”省掉分类。
4. 审查 patch：只含必要修复，不夹带无关格式化/版本号/构建产物；确认它改的是上游发布文件路径（这些补丁多数直接改 `dist`/`lib`）。
5. 运行 `pnpm install --frozen-lockfile`，确认 patch 应用；再跑受影响测试。若是 Desktop 补丁，运行 `prepare-runtime-patches`/打包并确认 `verifyRuntimePatches` 的 hash/版本/workspace-only 检查通过。
6. 用 packed install/真实消费者验证补丁效果；补丁可能在 workspace 生效但在消费者安装中失效（尤其构建工具补丁）。发布物不包含 `patches/` 时，消费者不会得到补丁；需要推上游或运行时 shim。
7. 更新 notices（补丁不改变许可证，但可能改变分发文件）。
8. 记录移除条件：上游修复版本、目标升级日期、负责人、验证测试。**源仓库没有这些字段**；`patches/README.md` 是迁移建议，不是源码既有机制。

**完成信号**：安装成功；patch diff 只含预期文件；Desktop policy 覆盖所有键且无 stale；受影响测试/消费者验证通过；notices 无异常。

**失败处理**：
- 升级后 patch 不适用：重新生成；不要改 `patchedDependencies` 的版本键复用旧补丁。
- Desktop 报 `classify the workspace patch`：补 policy 条目；报 `stale workspace patch decision`：删除/更新过期条目。
- Desktop 报 shared hash 不等于根 lockfile：先确认根 patch 和 lockfile 是同一份字节；不要手改 lock hash 绕过。
- Desktop 报 workspace-only dependency entered the runtime：检查该包为何进入 runtime；不要把 `workspace-only` 改成 `shared` 图省事。
- patch 在本地生效但发布消费者失败：检查补丁是否只改 workspace 路径/构建脚本；发布物不包含 `patches/` 时消费者不会得到补丁效果。
- 多个包共享同一补丁目标：确认版本键精确匹配，避免升级导致静默失效。

**例外**：生产仓库若开启 `allowUnusedPatches: true`，补丁失效会被静默忽略，是供应链风险；Desktop 明确使用 `false`，不要把它当作便利开关。`workspace-only` 补丁**故意**不进入 Desktop runtime，不能因为 runtime 里没有它而报缺失。`runtime-only` 补丁可以不在根 `pnpm-workspace.yaml` 中，但必须位于仓库内且被 policy 显式引用。

**证据边界**：8 个 patch 文件均按 hunk/关键 diff 阅读；`exceljs` 806 行未逐行语义审阅，`@yao-pkg/pkg` 的巨型 worker bundle 行（patch 122-123）未展开逐字符比对。未运行安装/patch 应用/Desktop 打包/消费者测试。`prepareRuntimePatches`/`verifyRuntimePatches` 1-124 全读，Desktop policy 1-25 全读，`packaging/README.md` 261-265 全读。

---

来源：deepseek-harness/pnpm-workspace.yaml:108-116@687f282e
来源：deepseek-harness/patches/@earendil-works__pi-ai@1.1.0.patch:1-73@687f282e
来源：deepseek-harness/patches/@electron__osx-sign@1.3.3.patch:1-26@687f282e
来源：deepseek-harness/patches/@fortune-sheet__core@1.0.4.patch:1-76@687f282e
来源：deepseek-harness/patches/@fortune-sheet__react@1.0.4.patch:1-138@687f282e
来源：deepseek-harness/patches/@yao-pkg__pkg@6.21.0.patch:1-134@687f282e
来源：deepseek-harness/patches/app-builder-lib@26.17.0.patch:1-27@687f282e
来源：deepseek-harness/patches/exceljs@4.4.0.patch:1-806@687f282e
来源：deepseek-harness/patches/node-pty@1.2.0-beta.15.patch:1-45@687f282e
来源：deepseek-harness/apps/desktop/scripts/runtime-patch-policy.ts:1-25@687f282e
来源：deepseek-harness/apps/desktop/scripts/prepare-runtime-patches.ts:1-124@687f282e
来源：deepseek-harness/apps/desktop/packaging/README.md:261-265@687f282e
来源：deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:130-190@687f282e

<a id="sc-licenses-notices"></a>
## 12. 许可证、第三方 notices 与分发

### 12.1 源义务

- 根 `LICENSE` 是 MIT（`deepseek-harness/LICENSE:1-20@687f282e`）。
- `verify-dsh-package-licenses`：通过根 `package.json.workspaces` 找到所有匹配 `^@deepseek-ai/dsh(?:-|$)` 的包，要求 `license: "MIT"`；不检查根 LICENSE 是否存在，也不覆盖 `benchmarks/`、`python/`（因为 `package.json.workspaces` 不含它们）。证据：`deepseek-harness/scripts/verify-dsh-package-licenses.ts:1-89@687f282e`。
- `gen-third-party-notices` 从以下输入生成 `THIRD_PARTY_NOTICES.md`：
  - **workspace manifest 集合**：由 `pnpm-workspace.yaml.packages` 派生（根 `package.json` + 每个成员 glob），不是硬编码目录；若少于 100 个 manifest 直接报错，防止 glob 过期静默漏包。路径统一为 `/`，避免 Windows 反斜杠把 dev-area 误判为 runtime。
  - 四个依赖面（`dependencies`/`devDependencies`/`optionalDependencies`/`peerDependencies`）的全部外部包；workspace 包名与 `workspace:` range 被排除。
  - `vendor/README.md` 的 vendored manifest 表；**vendor 目录本身才是必须披露的集合**：每个有 `package.json` 的 vendor 目录都必须有表行，表行也必须对应真实目录；所有 vendored 包必须 `license: MIT`（否则生成器报错）。
  - `python/*/pyproject.toml` 的 build-system/project/optional/dependency-groups 需求；本地 project name 排除。
  - 共享 Python distribution lock：`scripts/primary-runtime/lock.json` 的 `pythonPackages`；每个 distribution 必须有 `PYTHON_METADATA` 条目，否则硬错误；同名不同版本/重复 normalized name 也报错。
  - pnpm patch 列表（`pnpm-workspace.yaml.patchedDependencies`）。
  - 浏览器构建实际打包的第三方包：`browserBundledExternals()` + `chrome-devtools-frontend`；若浏览器包没有 workspace 依赖声明，报错。
  - npm 元数据来自已安装的 store：先找 workspace 声明的本地链接，再找根 `node_modules`、`native/system/node_modules` 及 `.pnpm` 虚拟 store；license/repository 解析失败会报错，必须 `pnpm install` 或加 `OVERRIDES`。
  - 证据：`deepseek-harness/scripts/gen-third-party-notices.ts:1-99@687f282e`、`deepseek-harness/scripts/gen-third-party-notices.ts:100-424@687f282e`、`deepseek-harness/scripts/gen-third-party-notices.ts:425-545@687f282e`、`deepseek-harness/scripts/gen-third-party-notices.ts:632-763@687f282e`。
- 分层：
  - `DEV_ONLY_AREAS` 精确为：根 `package.json`、`packages/test-support/`、`packages/test-support/client-runtime/`、`website/`、`native/`；这些区域只做声明披露，不声称运行时可达。
  - 其他区域声明的 runtime 依赖（`dependencies`/`optionalDependencies`）被视为"用户可能从 `cordis.yml` 挂载的插件"，必须披露；同一包只要在任一非 dev-only 区域是 runtime，就标为 runtime。
  - `tsx` 被硬编码为 runtime（源码运行脚本经它的 ESM hook）。
  - `FIRST_PARTY` 原生包（`@deepseek-ai/node-addon-system*`）不列为第三方；`@deepseek-ai/libreoffice-kit*` 有单独段。
  - vendored 包单列，必须同时写本地名（`npmName`）、上游名（`upstreamName`）、上游仓库和 source directory；MIT 归属不能只写本地 scope。
  - Python SDK 直接依赖与 bundled distributions 分表；Chrome DevTools/LibreOffice/Claude Agent SDK 有专门段落。
  - 证据：`deepseek-harness/scripts/gen-third-party-notices.ts:30-99@687f282e`、`deepseek-harness/scripts/gen-third-party-notices.ts:721-763@687f282e`。
- **许可证策略是 fail-closed 的自动检查，不只是披露**：
  - permissive 集合精确为 `MIT, MIT-CMU, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, Unlicense, CC0-1.0, BlueOak-1.0.0, Python-2.0, PSF-2.0`。
  - SPDX `OR` 只要一个 permissive 分支；`AND` 必须全 permissive；带 `+`、exception、未知标识或解析失败一律 false。`/` 被当成 `OR` 兼容非标准 manifest。
  - runtime 包若不在 permissive 集合，必须有精确 owner 授权：仅 `@anthropic-ai/claude-agent-sdk`（身份级），或 `@deepseek-ai/libreoffice-kit*` 且 license 精确 `MPL-2.0`。授权不把条款重新分类为 permissive，也不覆盖相似包/新版本。
  - dev-only 的非 permissive 包不阻止生成，但会在 dev 表后生成“仅开发工具、不链接/分发”的说明。
  - 证据：`deepseek-harness/scripts/gen-third-party-notices.ts:652-706@687f282e`。
- `--check` 比较提交的 bytes 与生成结果；`verify-third-party-notices` 是 `gen-third-party-notices --check`。`gen-third-party-notices.spec.ts` 在 test lane 中执行 freshness 与输入/许可证分支检查。
- 源 notices 明确说：它是**直接依赖**披露；完整 npm 传递闭包在 `pnpm-lock.yaml`，用 `pnpm licenses list` 查看；Python 闭包在 `python/sdk/uv.lock`（`deepseek-harness/scripts/gen-third-party-notices.ts:778-780@687f282e`、`deepseek-harness/THIRD_PARTY_NOTICES.md:8-10@687f282e`）。
- **“complete notices” 的当前处置**：源仓库没有 `completeNotice`/`CompleteNotice` 标识符（全仓搜索无匹配）；唯一 “complete notices” 措辞是 `scripts/gen-third-party-notices.ts:742@687f282e` 的 JSDoc `Render the complete notices document`。这里的 “complete” 指按生成器定义的全部输入渲染完整文档，**不是**完整传递闭包许可证/notice 汇编。当前 `THIRD_PARTY_NOTICES.md` 是 304 行的直接依赖/特殊 payload 披露表：包名、SPDX 标识或声明、repo 链接、vendored/Python/Claude/LibreOffice/Chrome 等选定段落；它不包含每个 npm 包（尤其传递依赖）的完整 LICENSE/NOTICE 正文。`--check` 与 `gen-third-party-notices.spec.ts` 只验证生成字节与 freshness，不验证法律完整性。迁移若要求“完整 notices”，必须改生成器/分发物（例如逐包收集 license text）或在交付说明中明确该缺口，不能把当前文件改名或描述成 complete 法律汇编。
- 当前产物还包含 8 个 patch 条目、9 个 vendored 包、Chrome DevTools frontend、Claude 平台 payload、LibreOffice kit、Python 直接依赖与 bundled distributions，以及 first-party native 说明（`deepseek-harness/THIRD_PARTY_NOTICES.md:12-304@687f282e`）。这些段落有各自的源义务，不能用一个“完整”标签替代逐项审查。

### 12.2 操作程序

1. 新增/升级/删除依赖后，`pnpm install`（生成器读 installed store），再 `pnpm run gen-third-party-notices`。
2. 审查 diff：新增包名/版本/许可证/归属；删除不再使用的条目；vendored 上游 commit 是否更新。
3. 运行 `pnpm run verify-third-party-notices` 或对应 test spec。
4. 运行 `pnpm run verify-dsh-package-licenses`；新增 DSH 包必须 MIT。
5. 引入新许可证时，先看 `isPermissive` 是否接受；不在集合内且不是精确 owner 授权（Claude SDK/LibreOffice）的 **runtime** 包会让生成器直接失败。接受不等于完成法律审查：仍要确认 NOTICE、源码提供、专利/再分发条款。dev-only 非 permissive 只会得到说明，不会自动获得分发许可。
6. 发布前检查 tarball 是否包含必要 LICENSE/notice；普通包依赖 license 字段与根 LICENSE，少数包通过 `files` 带 LICENSE。

**完成信号**：notices check 通过；所有 DSH 包 MIT；tarball license 字段与 notices 一致；vendored 上游归属正确。

**失败处理**：
- notices 与生成结果不一致：重新生成并审查，不要手工编辑生成文件。
- `cannot resolve license for ...` / `cannot resolve repository for ...`：先 `pnpm install`，再检查该包的 manifest；确实缺失时加 `OVERRIDES` 并写清原因，不要伪造 license 字段。
- `runtime ... is not a permissive license`：确认是否真的进入 runtime；若是，取得精确 owner 授权或替换依赖。不要把 `devDependencies` 当成逃避 runtime 披露的开关。
- `vendor/README.md has no manifest-table row for ...`：表格式变了或 vendor 目录未同步；补行/修表，不能只改 notices。
- `vendored ... declares license ...; assumes MIT`：停止；vendored 段只接受 MIT，需重新评估分发条款。
- Python `missing from PYTHON_METADATA`：为已锁定的 distribution 补 license/repo 元数据；生成器不读 wheel 来猜。
- `browser package ... has no workspace dependency declaration`：把浏览器外部包写进某个 workspace manifest，或修正 `browserBundledExternals`；不要让它只在构建配置里出现。

**例外**：
- `native/` 被标为 dev-only area，但原生 prebuilds 可能实际分发；迁移时要确认不会漏掉原生二进制依赖。
- 生成器把 `@anthropic-ai/claude-agent-sdk`、LibreOffice kit 等作为窄授权特例；不要把这些特例扩大到相似包。
- vendored 包在 manifest `files` 检查中豁免 source/map，但 notices 仍必须保留上游许可证。

**证据边界**：未运行生成器/安装/测试；`gen-third-party-notices.ts` 870 行按段全读，`gen-third-party-notices.spec.ts` 1-471 全读，提交的 `THIRD_PARTY_NOTICES.md` 1-304 全读（但这不等于运行 `--check` 或法律审计）。未做法律审计；生成器的 permissive 判定只覆盖其允许列表和精确 owner 授权，不能证明条款兼容性。`license` 字段可能错误，`OVERRIDES` 是人工元数据而非上游事实。当前没有完整传递闭包的逐包 license text；不要把“complete notices document”的 JSDoc 误读成该保证。

---

来源：deepseek-harness/scripts/gen-third-party-notices.ts:1-99@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.ts:100-424@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.ts:425-545@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.ts:549-628@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.ts:632-706@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.ts:721-870@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.spec.ts:1-471@687f282e
来源：deepseek-harness/scripts/verify-dsh-package-licenses.ts:1-89@687f282e
来源：deepseek-harness/LICENSE:1-20@687f282e
来源：deepseek-harness/THIRD_PARTY_NOTICES.md:1-304@687f282e
来源：deepseek-harness/scripts/gen-third-party-notices.ts:741-745@687f282e

<a id="sc-runtime-closure"></a>
## 13. 可执行部署的运行时闭包（runtime-closure）

### 13.1 源义务

`verify-runtime-closure` 检查的是**单可执行部署 manifest** `python/sdk-runtime/package.json`，不是全仓 production graph：

- 读取 `python/sdk-runtime/package.json` 与 `python/sdk-runtime/platforms.json`（目标平台列表）。
- 读取 `packages/bundle/web-app/presets/*.patch.yml` 中的 agent preset。
- 对每个 preset 的 active plugin（按平台判断 `disabled`），要求它在 runtime manifest 的 `dependencies` 中以 `workspace:` 声明；如果声明了非 workspace range，也报错。
- 从 runtime manifest 的直接 workspace 依赖出发，遍历 workspace 包的 `dependencies`/`optionalDependencies`；每个 workspace peer 如果非 optional，且不是 runtime manifest 的直接 `workspace:` 依赖，则报"缺失 peer"。
- 预设为空、平台列表为空也失败。
- 证据：`deepseek-harness/scripts/verify-runtime-closure.ts:1-130@687f282e`。

它**不**检查：

- 普通 workspace 包的 devDependency 泄漏；
- `apps/cli`/`apps/web` 的 production graph；
- Python wheel 内的实际 import；
- 所有包的完整传递闭包（只沿 runtime manifest 可达的 workspace 包走）。

### 13.2 操作程序

1. 新增/重命名 agent preset，或新增 runtime 可达插件时，更新 `python/sdk-runtime/package.json` 的 `dependencies`，用 `workspace:` 指向对应包。
2. 如果插件只在某平台启用，确认 `disabled` 条件与 `platforms.json` 对齐；条件不匹配会导致 gate 把它当 active。
3. 若 workspace 包声明了非 optional peer，确保 runtime manifest 直接或传递地提供它；否则在 runtime manifest 加 `workspace:` 依赖，或把 peer 标记 optional 并确认运行时可缺。
4. 运行 `pnpm run verify-runtime-closure`；再跑 `release:pack --family dsh` 与 `release:verify-packed-install`。
5. 在 packed install 中驱动安装后的 CLI，确认插件加载；runtime-closure 通过不等于运行时能加载。

**完成信号**：gate 输出 preset 数/workspace 包数且无 failure；packed install 的 CLI 能启动并加载 shipped presets。

**失败处理**：
- 报 preset plugin 缺失：把包加入 runtime manifest `dependencies`；不要改 preset 去引用不存在的包。
- 报 required peer 缺失：加 runtime 直接依赖，或把 peer 改 optional 并验证降级；不要用 `peerDependenciesMeta.optional` 掩盖实际必需。
- 平台条件误判：检查 `disabled.__jsExpr` 只支持 `process.platform ===/!== 'win32'|'linux'|'darwin'` 的简单形式；复杂表达式不会被识别（`disabledOnPlatform`，`deepseek-harness/scripts/verify-runtime-closure.ts:160-190@687f282e`）。

**例外**：runtime manifest 直接依赖里的 workspace 包可以继续提供自己的 optional 依赖；gate 对 optional peer（`peerDependenciesMeta.optional: true`）跳过。平台包在 release 验证中可能被排除（musl 工具链），这是覆盖缺口。

**证据边界**：未运行；237 行中读了 1-130，未逐行读 preset 解析的剩余辅助函数。它不证明 Python 运行时真实 import 闭包，只证明 manifest/preset/peer 关系。

---

来源：deepseek-harness/scripts/verify-runtime-closure.ts:1-130@687f282e
来源：deepseek-harness/scripts/verify-runtime-closure.ts:131-237@687f282e

<a id="sc-install-layout"></a>
## 14. npm 双版本安装布局（双 release 共存）

### 14.1 源义务

`verify-npm-install-layout` 模拟**两个不兼容的 DSH release 同时安装**，检查 npm 的物理放置：

- 用当前 workspace 的 DSH 包清单构造合成 registry，把每个 DSH 包复制成两个版本：`0.1.0`（嵌套 alias `dsh-previous`）与 `0.2.0`（根）。
- 合成版本的内部 DSH 依赖统一改为 `^<version>`，外部依赖保持不变。
- 用 npm 解析出 package-lock（metadata-only，不下载 archive；`archiveRequests` 必须为 0）。
- 断言：
  - 两个版本的 DSH 包分别位于根 `node_modules/<name>` 和 `node_modules/dsh-previous/...`；
  - 每个 DSH 内部依赖边解析到**同一版本**；
  - 两个版本包含的包集合相同；
  - 只有一个共享的 `@deepseek-ai/cordis` 在根；
  - React/React-DOM 不能出现在这个 DSH-only 合成消费者中；
  - optional/optional peer 的缺失允许；普通依赖/peer 缺失报错。
- 预算：`dshPackagesPerVersion * checkedDshEdges <= 875_000`；超出需重新测量并修改 `MAX_RESOLUTION_WORK_UNITS`。挂起保护是预算的 4 倍。
- 证据：`deepseek-harness/scripts/verify-npm-install-layout.ts:1-275@687f282e`；共享 Cordis/双版本隔离断言在 `deepseek-harness/scripts/verify-npm-install-layout.ts:145-217@687f282e`。

### 14.2 操作程序

1. 发布前运行 `pnpm run verify-npm-install-layout`；它需要 workspace 版本与 `apps/cli` 版本。
2. 若新增 DSH 包/内部边，检查预算输出；不要在没有测量时直接提高 `MAX_RESOLUTION_WORK_UNITS`。
3. 若改变 Cordis 的 peer/依赖形态，确认仍然只有一个根 Cordis；否则双版本会各自带一份运行时。
4. 运行 `release:pack` 与 `release:verify-packed-install`；双版本布局通过不等于真实 tarball 安装通过。

**完成信号**：gate 输出两个版本、内部边数、预算使用；无错误；packed install 通过。

**失败处理**：
- 内部边解析到另一版本：检查 DSH 包是否把内部依赖写成 `^0.1`/`latest` 而不是 `workspace:*`/同版本；合成 registry 会把 DSH 内部 range 改成 `^<version>`，所以问题通常在原始 manifest 的 range 或额外 DSH 依赖。
- 只在一个版本出现某包：检查包是否被 private/实验排除，或依赖图不对称。
- Cordis 出现两份：检查 Cordis 是否被错误地作为普通 dependency 而非 peer/共享根。
- 超预算：测量新图，记录计数，再改常量；不要跳过 gate。

**例外**：这是合成 registry + metadata-only 解析，不验证 tarball 内容、bin、exports 或真实 npm 缓存；真实安装由 `release:verify-packed-install` 覆盖。React 被显式排除，因为它是浏览器构建输入，不是 DSH-only 消费者依赖。

**证据边界**：未运行；275 行已读。npm 的 hoisting 行为依赖 npm 版本；源代码通过 `benchmark-npm-resolution.ts` 调用 npm，具体版本可能随环境变化。

---

来源：deepseek-harness/scripts/verify-npm-install-layout.ts:1-275@687f282e
来源：deepseek-harness/.github/workflows/release.yml:80-88@687f282e
来源：deepseek-harness/scripts/verify-npm-install-layout.ts:129-217@687f282e

<a id="sc-packed-install"></a>

**补充源码引用（尾部区间复读分派实际读取）**：`deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:1-129@687f282e`

## 15. Packed tarball 安装与发布边界（packed-install）

### 15.1 源义务

- `release/pack.ts` 是发布边界：无凭据运行，从当前 checkout 生成所有 tarball，写出 `publish-order.txt`；脚本本身不校验 Git commit，CI 通过同一 checkout 提供一致性。它**调用 `pnpm pack`**，由 pnpm 负责把 `workspace:` 协议替换为目标成员版本；Harness 只做 `family.validatePayload` 和 `validatePackedMember`（tarball 存在、payload、packed identity）。DSH family 额外要求 packed DSH 依赖图精确等于成员版本（`deepseek-harness/scripts/release/pack.ts:22-70@687f282e`、`deepseek-harness/scripts/release/families.ts:404-414@687f282e`）。
- `release/verify.ts` 在 build 前解析 publish order；`RELEASE_PUBLISH=true` 时检查成员非 private、ref 是该 family 的 tag、tag 匹配成员版本。
- `release/verify-packed-install.ts`：
  - 在仓库外的临时目录创建消费者；
  - 把传入目录中的所有 `.tgz` 作为 `file:` 依赖；可传多个 `--from`（dsh + vendor + landlock）；
  - 使用独立 npm cache（随消费者删除）；
  - 安装后驱动 `installedEntry` 的 bin，检查版本/启动；
  - 对安装后的 entry 运行 `verifyInstalledProductIsolation`，沿实际安装的 `dependencies`/`optionalDependencies`/`peerDependencies` 遍历，拒绝实验包，允许 optional 缺失，但普通依赖/peer 缺失报错；
  - 允许 entry 的 `OPTIONAL_BUNDLES` 作为 `dependencies` 存在，但要求它们确实安装；其他位置的实验边界报错。
- `release/publish.ts` 逐包检查 registry：不存在则发布；已存在且 integrity 相同则跳过；已存在但 integrity 不同则失败（提示 bump version 或调查可重复构建）。`release-publish.yml` 只上传 `dist/npm`，vendor tarball 只用于验证。
- 证据：`deepseek-harness/scripts/release/pack.ts:1-108@687f282e`、`deepseek-harness/scripts/release/verify.ts:40-100@687f282e`、`deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e`、`deepseek-harness/scripts/release/installed-product-isolation.ts:18-73@687f282e`、`deepseek-harness/scripts/release/publish.ts:1-60@687f282e`。

### 15.2 操作程序

1. `pnpm run build:official`（或目标发布构建）。
2. `pnpm run release:pack --family dsh --out dist/npm`。
3. 若 dsh 依赖 vendor/landlock，另外 `--family vendor` 与 Landlock entry pack；把它们作为 `--from` 传给验证，但不要发布它们。
4. `pnpm run release:verify-packed-install --family dsh --from dist/npm --from dist/npm-vendor --from dist/npm-landlock`。
5. 检查临时消费者：入口 bin 可执行、版本正确、没有实验包、optional 缺失可降级、没有 workspace 软链/协议残留。
6. 发布：`release:publish`（或工作流）只使用已打包目录；不要重新 build。
7. 发布后核对 registry integrity 与本地 tarball；失败时 deprecate 而不是删除版本。

**完成信号**：packed install 零错误；所有入口可加载；bin 可执行；没有实验包泄漏；registry 上已存在同版本时 integrity 一致。

**失败处理**：
- 安装时 peer 冲突：检查 `autoInstallPeers`/peer range；发布物的 peer 必须由消费者提供，不要偷偷改成 dependency。
- native 包缺失：确认平台包是否被 `ignoredOptionalDependencies` 排除；如果排除，测试应覆盖降级路径。
- workspace 泄漏：真实的 `pnpm pack` 会替换 `workspace:`；若 tarball 仍含协议，说明产物不是 pnpm pack 生成的（或 packed manifest 被后续步骤覆盖）。检查 pack 调用路径/后处理，不要把“自己实现 range 重写”当成修复。
- DSH packed range 不是精确成员版本：DSH family 会拒绝。确认 `workspace:*`/`workspace:~` 经 pnpm 替换后的结果，以及是否有额外手写 range。
- integrity 不一致：停止发布，调查构建不可重复/缓存；不要覆盖已发布版本。

**例外**：`release.yml` 的 packed install 不安装平台 native 包（musl 工具链），这是已知覆盖缺口。`installed-product-isolation` 只沿安装后的实际依赖图；它不替代静态 `default-product-isolation`。

**证据边界**：未运行；`release/pack.ts` 1-108 全读，`release/families.ts` 404-470 全读，`verify-packed-install.ts` 1-126 全读；未逐行读消费者生成/缓存清理的剩余部分。`pnpm pack` 的 range 替换依据 pnpm 官方 Workspace 文档（2026-10-23 查阅），未执行实际 pack 观察 tarball。发布工作流的实际 environment/token 配置未验证。

---

来源：deepseek-harness/scripts/release/pack.ts:1-108@687f282e
来源：deepseek-harness/scripts/release/verify.ts:40-100@687f282e
来源：deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e
来源：deepseek-harness/scripts/release/installed-product-isolation.ts:18-73@687f282e
来源：deepseek-harness/scripts/release/publish.ts:1-235@687f282e
来源：deepseek-harness/scripts/release/families.ts:404-470@687f282e
来源：deepseek-harness/scripts/release/tarball.ts:14-57@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:282-290@687f282e
来源：deepseek-harness/.github/workflows/release.yml:1-180@687f282e
来源：deepseek-harness/.github/workflows/release-publish.yml:1-131@687f282e
来源：deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:1-129@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.ts:1-387@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.ts:471-700@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.ts:701-820@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:1-281@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:291-510@687f282e
来源：deepseek-harness/scripts/local-bundle-registry.spec.ts:518-559@687f282e

<a id="sc-dependency-catalog"></a>
## 16. 消费者依赖目录（dependency-catalog）

### 16.1 源事实

`gen-dependency-catalog` 生成 `docs/dependency-catalog.json`，记录**消费者**安装 `@deepseek-ai/dsh@latest` 时的 npm 解析树，不是 workspace 版本一致性检查：

- 输入是记录在 `scripts/dependency-catalog/package-lock.json` 的 npm lockfile v3，以及 `scripts/dependency-catalog/resolution.json` 元数据（capturedAt、npm、node、platform、arch、registry、installStrategy）。
- 要求：
  - lockfile v3；
  - 消费者只声明 `@deepseek-ai/dsh: latest`；
  - 每个包从公共 `https://registry.npmjs.org/` 解析，无 username/password；
  - 不接受 `link: true`（本地软链）；
  - 排除 dev 包，但保留 optional/peer 标记与 os/cpu/libc；
  - `installStrategy` 必须是 `hoisted`；
  - 去重为 name+version，保留每个安装位置/flags。
- `--check` 逐字节比较 `docs/dependency-catalog.json` 与记录输入；`--refresh` 会创建临时消费者，运行 `npm install --package-lock-only --lockfile-version=3 --ignore-scripts --no-audit --no-fund --include=prod --include=optional --include=peer --install-strategy=hoisted`，更新 lock/metadata/catalog。
- 证据：`deepseek-harness/scripts/gen-dependency-catalog.ts:1-304@687f282e`。

它**不**：

- 比较 workspace 内同一包的版本范围；
- 验证 tarball 可安装；
- 验证 bin/exports；
- 代表 `pnpm-lock.yaml` 的完整传递闭包。

### 16.2 操作程序

1. 需要更新消费者目录时，运行 `pnpm run gen-dependency-catalog --refresh`；它会访问公共 npm，需要网络。
2. 审查 `package-lock.json`/`resolution.json` 的变化：registry 必须是公共 npm，installStrategy 必须是 hoisted，不能出现本地 link。
3. 运行 `pnpm run gen-dependency-catalog` 重新生成 `docs/dependency-catalog.json`；再 `pnpm run verify-dependency-catalog` 做 `--check`。
4. 不要把 `--check` 放进需要离线/无 npm 的 PR lane；它只读记录文件，但 `--refresh` 需要网络。
5. 若目标仓库不用 npm 消费者目录，可以删除该机制；不要把它误当成版本统一 gate。

**完成信号**：`verify-dependency-catalog` 输出 "JSON matches the recorded npm resolution"；目录 diff 只含预期版本/平台变化。

**失败处理**：
- lockfile 有 `link: true`/非公共 registry：说明记录被本地/私有源污染；重新在隔离环境生成。
- 目录 stale：运行 `gen-dependency-catalog`（不 refresh）从记录输入重生成；若记录本身过期，再 `--refresh`。
- 版本与 workspace 不一致：这不是该 gate 的职责；用 `constraints`/`package-dependencies` 检查 workspace。

**例外**：`--refresh` 依赖外部 npm/registry，可能受网络/registry 状态影响；生成结果包含 capturedAt/npm/node/platform，换环境会产生 metadata diff。`--check` 不访问网络，但仍要求提交的记录文件存在。

**证据边界**：未运行；304 行只读了 1-180、180-304 的关键部分。`docs/dependency-catalog.json` 的实际内容未逐行核对。

---

来源：deepseek-harness/scripts/gen-dependency-catalog.ts:1-180@687f282e
来源：deepseek-harness/scripts/gen-dependency-catalog.ts:180-304@687f282e
来源：deepseek-harness/package.json:100-160@687f282e

<a id="sc-product-use"></a>
## 17. 产品使用：每个维护包必须有明确角色

### 17.1 源义务

`verify-product-use` 检查所有非实验 `packages/*/*` 包（以及 apps/vendor 的包清单）：

- 从实际 shipped profiles（`packages/boot/app-boot/src/profile.ts` 的 `PROFILE_TEMPLATES`、`DEFAULT_PROFILE_BUNDLES`）、on-demand bundles、optional bundles 组合运行时 entries。
- 沿 source imports（TypeScript 解析到源码，不读 `lib/`）、`cordis.yml` Include、group/agent preset、动态挂载声明遍历，得到 default/optional reachability。
- 每个 `packages/*/*` 非实验包必须满足其一：
  - 被 default 或 optional 组合可达；
  - 在 `PRODUCT_PACKAGE_POLICY` 中有显式 `category` + 非空 `reason`。
- 政策类别：`optional`、`test`、`sdk`、`build`、`web-distribution`、`declarations`；每类有目录约束（例如 `test` 必须在 `packages/test-support/`，`sdk` 只能是 `packages/sdk/client`）。
- stale policy 会失败：声明了 policy 但包已默认可达（除 `web-distribution`），或 `web-distribution` 但不可达，或目录不存在/在 experimental。
- 缺失源码路径、未映射的 workspace 导入、未知 `@deepseek-ai/dsh-*` 包、动态挂载非字面量都会失败。
- 证据：`deepseek-harness/scripts/verify-product-use.ts:1-317@687f282e`、`deepseek-harness/scripts/product-package-policy.ts:1-50@687f282e`。

### 17.2 操作程序

1. 新增非实验包时，先决定它是否应进入默认/可选产品组合；是则挂到 profile/bundle，否则在 `PRODUCT_PACKAGE_POLICY` 写 category + reason。
2. `reason` 必须解释"为什么不属于默认产品"，不能写"暂时没有使用"；stale policy 会被检查。
3. 若包只用于 SDK/构建/测试/web 分发/声明，选对应 category，并确保目录符合约束。
4. 更新 `tsconfig.base.json` paths，确保源码导入能解析到 workspace 源码；否则 gate 报 "does not resolve to workspace source"。
5. 动态挂载必须用字面量对象声明（`DYNAMIC_MOUNTS` 的 literal package targets），不能运行时拼接。
6. 运行 `pnpm run verify-product-use`；与 `pnpm run verify-default-product-isolation` 一起跑。
7. 发布前在 packed install 中验证实际入口；产品使用 gate 是源码/组合检查，不是安装检查。

**完成信号**：gate 输出 default/optional 包数与 source 数；无 "no product runtime use"、无 stale policy、无未解析导入。

**失败处理**：
- "no product runtime use"：挂到产品组合，或加 policy；不要把包移到 experimental 来逃避（会改变发布面）。
- "stale optional policy"：如果包已默认可达，删除 policy；不要保留过期声明。
- "does not resolve to workspace source"：补 tsconfig paths 或修正导入；不要用 `lib/` 产物绕过。
- "unknown workspace package"：包名拼写/发布状态错误；不要在源码里引用一个不存在的 `@deepseek-ai/dsh-*`。

**例外**：`web-distribution` 类别用于 `packages/client/web`、`packages/client/ui-dockkit`，它们被 bundle 进 Web 分发而不是运行时挂载；`sdk`/`build`/`test`/`declarations` 也不能默认可达。`vendor` 包只进入 inventory，不要求 policy。

**证据边界**：未运行；317 行已读。它依赖源码/配置的静态分析，不能发现运行时通过任意字符串/服务发现加载的包；这类路径需要额外测试。

---

来源：deepseek-harness/scripts/verify-product-use.ts:1-100@687f282e
来源：deepseek-harness/scripts/verify-product-use.ts:100-317@687f282e
来源：deepseek-harness/scripts/product-package-policy.ts:1-50@687f282e
来源：deepseek-harness/scripts/run-gates.ts:364-380@687f282e

<a id="sc-default-product-isolation"></a>
## 18. 默认产品隔离：实验包不能进入默认安装

### 18.1 源义务

`verify-default-product-isolation` 检查默认产品（`apps/*` 与 `python/sdk-runtime`）的实际可执行/源码/配置：

- 默认安装的 bundles 来自 `PROFILE_TEMPLATES`/`DEFAULT_PROFILE_BUNDLES`；每个 default bundle 必须有 `dsh.bundle.patch`，不能同时是 optional bundle。
- optional bundles 来自 `OPTIONAL_BUNDLES`/`ON_DEMAND_BUNDLES`：它们作为 `apps/cli` 的 runtime dependency 存在，但必须：
  - 有 `dsh.bundle.patch`；
  - 有 `icon` 或 `./icon` export；
  - 有 `./locale/*.json` 展示元数据；
  - 不是 default bundle。
- 默认依赖图（`dependencies`/`optionalDependencies`/`peerDependencies`）中不得出现实验包；`apps/cli` 的 `dependencies` 可以包含 optional bundles（它们被"shipped switched off"安装），其他位置/段不行。
- 扫描实际源码（`src/**/*.{ts,tsx,...}`，排除测试/声明）、bundle patch、`dsh.configTrees`、shipped presets、`apps/web/index.html` 的本地 module entry。
- 实验包通过名称或 `packages/experimental/` 目录判定；外部 `@deepseek-ai/libreoffice-kit` 是允许的外部 kit 特例。
- 证据：`deepseek-harness/scripts/verify-default-product-isolation.ts:1-413@687f282e`。

安装后的版本由 `release/installed-product-isolation.ts` 再验证：沿实际安装的依赖图拒绝实验包；entry 的 optional bundles 允许，但必须安装；别名 `npm:<experimental>` 也会被识别（`deepseek-harness/scripts/release/installed-product-isolation.ts:18-73@687f282e`）。

### 18.2 操作程序

1. 新增实验能力时，默认不挂到任何 shipped profile；若要"随产品安装但默认关闭"，把它加入 `OPTIONAL_BUNDLES`，并确保它是 `apps/cli` 的 runtime dependency，带 bundle patch/icon/locale。
2. 在默认 bundle 中添加依赖前，确认不是实验包；default 组合中不能出现 `packages/experimental/*`。
3. 若实验包必须被某个稳定包引用，改为接口/端口注入或把能力提升为稳定包；不要用 `peerDependencies` 绕过（peer 也会被检查）。
4. 更新 bundle patch/config tree/preset 后，运行 `pnpm run verify-default-product-isolation`。
5. 打包后 `release:verify-packed-install` 会再跑安装图检查；确保 optional bundle 在安装树中存在。
6. 运行 `pnpm run verify-product-use`，确保没有包因隔离而变成"无产品使用"。

**完成信号**：default isolation 零 failure；optional bundle 元数据完整；安装图无实验包；产品使用 gate 仍通过。

**失败处理**：
- "default product must not include experimental packages"：从默认依赖/配置中移除，或改为 optional bundle；不要改 `isExperimental` 判定来放行。
- optional bundle 缺 icon/locale/patch：补齐 manifest 与资源；这些是插件管理器的展示/加载契约。
- optional bundle 同时是 default：从 default 列表移除；不要两边都留。
- 安装后报可选 bundle 缺失：检查 `apps/cli` 的 runtime dependency 与 tarball 是否包含它。

**例外**：`EXTERNAL_KIT_PACKAGES`（`@deepseek-ai/libreoffice-kit`）是独立发布的 kit，不受实验隔离；`apps/web` 的 web preview 入口不在默认检查范围（明确排除 preview）。optional bundle 的 `dependencies` 是唯一允许的实验包 runtime 边。

**证据边界**：未运行；413 行已读。它不检查 `vendor` 内部的实验引用；安装图检查只从 entry 的 runtime sections 出发，不覆盖 devDependencies。

---

来源：deepseek-harness/scripts/verify-default-product-isolation.ts:1-180@687f282e
来源：deepseek-harness/scripts/verify-default-product-isolation.ts:180-413@687f282e
来源：deepseek-harness/scripts/release/installed-product-isolation.ts:18-73@687f282e
来源：deepseek-harness/scripts/run-gates.ts:364-380@687f282e

<a id="sc-experimental-policy"></a>
## 19. 实验包策略：命名、发布与依赖隔离

### 19.1 源义务

- 实验身份：
  - 包名以 `@deepseek-ai/dsh-experimental-` 开头；或
  - 属于 11 个保留名，且位于其声明目录（`EXPERIMENTAL_PACKAGE_NAME_EXCEPTIONS`）。
- 目录必须是 `packages/experimental/<one>`（不能更深）。
- 公开实验包（不在 `PRIVATE_EXPERIMENTAL_PACKAGE_DIRECTORIES`，当前为空）：
  - 不得 `private: true`；
  - 必须 `publishConfig.access: "public"`。
- 私有实验包：
  - 必须 `private: true`；
  - 必须省略 `publishConfig`。
- 保留名必须恰好有一个 workspace owner 在声明目录；移动/重命名/重复会失败。
- 依赖隔离（`checkExperimentalDependencyIsolation`）：
  - 对 standard release member + `python/sdk-runtime`，`dependencies`/`optionalDependencies`/`peerDependencies` 中不得引用实验包；
  - 唯一例外：`apps/cli`（包名 `@deepseek-ai/dsh`）的 `dependencies` 可以包含 `OPTIONAL_BUNDLES` 中的实验包；
  - `peerDependencies` 中的实验包不允许（即使它是 optional bundle）；
  - `npm:<experimental>@version`、`workspace:<experimental>@*` 等别名也会被识别；
  - 证据：`deepseek-harness/scripts/check-workspace-constraints.ts:361-410@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:592-609@687f282e`。
- 安装后的默认产品图由 `installed-product-isolation` 再检查：entry 的 optional bundles 允许，但必须安装；其他实验边拒绝（`deepseek-harness/scripts/release/installed-product-isolation.ts:18-63@687f282e`）。

### 19.2 操作程序

1. 新实验包用 `dsh-experimental-` 前缀；如果要保留旧 npm 名，必须加到 `EXPERIMENTAL_PACKAGE_NAME_EXCEPTIONS` 并在对应目录，且确保唯一 owner。
2. 决定公开/私有：公开则 `publishConfig.access: "public"`；私有则 `private: true` 且不写 `publishConfig`。
3. 不要从稳定 release member（非 `apps/cli`）或 `python/sdk-runtime` 依赖实验包；用产品装配/接口注入。
4. 若确实要随产品安装但默认关闭，把它放到 `OPTIONAL_BUNDLES`，只让 `apps/cli` 的 `dependencies` 引用；peer 不行。
5. 运行 `pnpm run constraints`（命名/发布/依赖隔离/保留名）与 `pnpm run verify-default-product-isolation`。
6. 打包后运行 `release:verify-packed-install`，确认安装图没有实验泄漏。

**完成信号**：constraints 无错误；默认隔离零 failure；保留名唯一；安装图只允许 optional bundles 的 entry 边。

**失败处理**：
- "must set publishConfig.access to public"：补字段；不要改成 private 来逃避（会改变发布面）。
- "retained experimental name must have exactly one workspace owner"：修目录/包名，删除重复 owner。
- "must not reference an experimental package"：从依赖中移除；如果是 optional bundle，只放在 `apps/cli.dependencies`，不要放 peer。
- 安装图报实验包：检查是否通过 `npm:` 别名或传递依赖进入；修根因，不要只改直接声明。

**例外**：`PRIVATE_EXPERIMENTAL_PACKAGE_DIRECTORIES` 当前为空，所以所有 `packages/experimental/<one>` 默认公开；要保留私有实验包，必须显式加入该列表并确保 release family 排除。`apps/desktop`/`desktop-host`/`plugin-market-generator` 不是 standard release member，但仍可能被安装图检查覆盖（如果它们进入 entry 图）。

**证据边界**：未运行；命名/发布规则来自 `check-workspace-constraints`，依赖隔离规则来自同文件 592-609。`installed-product-isolation` 只从 entry 出发，不检查开发依赖。

---

来源：deepseek-harness/scripts/experimental-package-policy.ts:1-67@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:361-410@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.ts:592-609@687f282e
来源：deepseek-harness/scripts/release/installed-product-isolation.ts:18-63@687f282e
来源：deepseek-harness/scripts/check-workspace-constraints.spec.ts:106-258@687f282e

<a id="sc-config-source"></a>
## 20. 配置来源所有权：只禁止内联凭据/端点

### 20.1 源义务

`verify-config-source-ownership` 是一个**窄检查**，不是"所有配置键只有一个真源"的通用 gate：

- 扫描 shipped Cordis 配置：
  - `apps/*/config/**/*.yml`
  - `packages/*/*/cordis.patch.yml`
  - `packages/*/*/presets/*.patch.yml`
  - `python/*/src/**/cordis.yml`
- 拒绝单行形式：`apiKey`、`baseURL`、`apiKeyEnv`、`authToken`、`headers` 后跟 `: !!js` 的配置。
- 原因：adapter 通过 `ctx.credentials` 解析 `apiKeyEnv`，通过环境快照解析 endpoint；在这里内联会绕过两条 ladder。
- 证据：`deepseek-harness/scripts/verify-config-source-ownership.ts:1-56@687f282e`；测试示例 `deepseek-harness/scripts/verify-config-source-ownership.spec.ts:17-30@687f282e`。

它**不**：

- 检查任意配置键的重复定义；
- 检查 schema 默认值/文档一致性；
- 检查业务代码里的 `process.env`；
- 解析完整 YAML（明确说 "not full YAML analysis"）。

### 20.2 操作程序

1. 在 shipped Cordis 配置中，凭据用 `apiKeyEnv` 指向环境变量名，端点通过环境快照/adapter 解析；不要写 `apiKey: !!js process.env.X`、`baseURL: !!js ...`。
2. 需要新配置项时，在 schema/默认配置中声明，再在文档/示例引用；不要把值直接写进 bundle patch。
3. 运行 `pnpm run verify-config-source-ownership`；它在 doc-sync lane，PR 不一定自动跑，迁移时建议加入 PR lane。
4. 如果要检查"配置键单一来源"，需要另写 gate；不要把这个脚本当成通用配置所有权检查。
5. 更新配置文档/示例；若双语，运行 translation pairing。

**完成信号**：gate 输出 "no credential or endpoint uses the ordinary inline environment form"；配置中无 `: !!js` 内联凭据/端点。

**失败处理**：
- 命中 `baseURL: !!js ...`：改成通过环境快照读取；如果必须支持动态值，放到 adapter 的解析逻辑，不要在 YAML 内联。
- 命中 `headers: !!js ...`：同上；headers 可能含 token，风险更高。
- 目标仓库没有该 gate：用 `rg` 检查 shipped config 的 `: !!js` 形式，并补一个窄脚本；不要扩大成"所有配置键唯一"的过度设计。

**例外**：该 gate 只覆盖单行形式；多行 YAML/锚点/合并键可能绕过。它是 source check，不证明运行时凭据 ladder 一定安全；还需要凭据注入/日志检查。

**证据边界**：56 行已读；未运行。源仓库没有通用配置来源 gate；本文不把第 19 节的窄检查外推为完整配置治理。

---

来源：deepseek-harness/scripts/verify-config-source-ownership.ts:1-56@687f282e
来源：deepseek-harness/scripts/verify-config-source-ownership.spec.ts:17-30@687f282e
来源：deepseek-harness/scripts/verify-config-source-ownership.spec.ts:1-16@687f282e

<a id="sc-secrets"></a>
## 21. 凭据、密钥与发布注入

### 21.1 源事实（按发布通道区分，不能一概说 OIDC）

- **dsh/vendor npm publish**：`workflow_dispatch` 手动触发；publish job 使用 `environment: npm-publish`，`permissions: contents: read`（没有 `id-token: write`）；`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`；checkout `persist-credentials: false`；安装 `--frozen-lockfile --ignore-scripts`；publish job 不重新 build（pack job 会从当前 tree 构建并上传 artifact）；`release/publish.ts` 调 `npm publish <tarball> [--tag]`，**没有 `--access`**（access 来自 manifest `publishConfig`），也**没有 `--provenance`**。证据：`deepseek-harness/.github/workflows/release-publish.yml:80-131@687f282e`、`deepseek-harness/.github/workflows/release-vendor-publish.yml:80-126@687f282e`、`deepseek-harness/scripts/release/publish.ts:124-200@687f282e`。
- **native npm publish**：`node-addon-system-release.yml` 的 publish job 使用 `environment: npm-publish`、`permissions: contents: read` + `id-token: write`；`NPM_TOKEN` 仅在非空时作为 `NODE_AUTH_TOKEN` fallback；发布走 `scripts/publish-release.mjs`。这是与 dsh/vendor 不同的凭据路径；OIDC 是否实际被 npm 采用未在本文验证。证据：`deepseek-harness/.github/workflows/node-addon-system-release.yml:140-188@687f282e`。
- **Python/PyPI publish**：`python-release.yml` 使用 `environment: pypi-runtime`/`pypi`、`permissions: id-token: write`、`pypa/gh-action-pypi-publish@release/v1`；发布前 `sha256sum -c SHA256SUMS`；显式 `attestations: false`，源注释说明公开 attestation 会暴露私有发布仓库。证据：`deepseek-harness/.github/workflows/python-release.yml:185-248@687f282e`。
- `release/publish.ts` 逐包检查 registry integrity：不存在才发布；已存在且 integrity 相同则跳过；不同则失败（提示 bump/调查可重复构建）。发布重试前重新读 registry，避免 E409 实际已落盘。证据：`deepseek-harness/scripts/release/publish.ts:146-200@687f282e`。
- 仓库中不提交 token；`vendor/` 不走 registry 自动更新（Dependabot 排除）。配置中的凭据 ladder 见第 20 节：shipped config 不允许内联 `apiKey`/`baseURL`/`authToken`/`headers: !!js`。

### 21.2 操作程序

1. 本地：凭据放未跟踪的 `.env`/OS keychain；`.gitignore` 覆盖 `.env*`、本地 `.npmrc`。
2. 先选发布通道，不要套用同一套凭据假设：
   - dsh/vendor npm：`environment: npm-publish` + `NPM_TOKEN` secret；publish job 只有 `contents: read`，没有 OIDC。
   - native npm：`environment: npm-publish` + `id-token: write`；`NPM_TOKEN` 仅作为非空 fallback。
   - Python/PyPI：`environment: pypi-runtime`/`pypi` + `id-token: write`，使用 `pypa/gh-action-pypi-publish`，`attestations: false`。
3. CI：token 只在 publish job 注入；checkout `persist-credentials: false`；安装 `--frozen-lockfile --ignore-scripts`；publish job 不重新 build（pack job 会重建）。dsh/vendor 的 `setup-node` 用 `registry-url` + `NODE_AUTH_TOKEN`；源工作流没有显式“发布后删除 .npmrc”步骤，不要伪造该保证。
4. npm 发布：不要加 `--access`（manifest `publishConfig.access` 决定）；源 `release/publish.ts` **没有** `--provenance`。如果目标仓库要求 provenance，必须显式加 `id-token: write`、`--provenance` 并验证 registry/仓库可见性；不要声称源仓库已有。
5. 轮换：记录 token 所有者/过期时间；泄漏先 revoke 再重发；已发布版本只能 deprecate，不能覆盖。
6. 配置：凭据用 `apiKeyEnv`/`ctx.credentials`；端点用环境快照；不要在 YAML/代码中硬编码。发布前检查日志/命令输出，确认没有 secret 回显。

**完成信号**（按通道）：
- dsh/vendor：`NPM_TOKEN` 只在 environment/publish job；无 token 回显；`persist-credentials:false`；`release/publish.ts` 的 integrity 检查生效。**不是**“已使用 OIDC provenance”。
- native：`id-token: write` 存在；fallback token 只在非空时注入；publish 脚本可重入。
- PyPI：OIDC 发布成功；`SHA256SUMS` 校验通过；`attestations:false` 是有意选择。

**失败处理**：
- 误提交 token：立即 revoke/rotate，清理历史（如果已推送）；不要只删文件。
- dsh/vendor 发布鉴权失败：检查 environment `npm-publish` 的 `NPM_TOKEN`/reviewer 设置；不要绕过 environment 或把 token 写进仓库。
- native/PyPI 权限失败：检查 `id-token: write` 与 environment；不要换长期 PAT 绕过 OIDC。
- npm 已存在同版本：用 integrity 比较；相同跳过，不同则 bump/调查，不能覆盖。

**例外**：`NODE_AUTH_TOKEN` 在 publish job 的环境变量中是允许的；`setup-node` 会写 npm 认证配置，源工作流没有显式清理步骤。`NPM_TOKEN` 的具体权限/环境设置不在仓库内，本文不能证明 reviewer 一定启用。PyPI `attestations:false` 是已知的可见性取舍，不是“已生成公开 attestation”。

**证据边界**：未扫描 git 历史；未验证 GitHub Environment 实际设置；未运行发布；native 的 OIDC 是否真正被 npm 采用未验证；dsh/vendor 没有 provenance。本文只描述源工作流可见步骤。

---

来源：deepseek-harness/.github/workflows/release-publish.yml:80-131@687f282e
来源：deepseek-harness/.github/workflows/release-vendor-publish.yml:80-126@687f282e
来源：deepseek-harness/.github/workflows/node-addon-system-release.yml:150-188@687f282e
来源：deepseek-harness/.github/workflows/python-release.yml:185-248@687f282e
来源：deepseek-harness/scripts/release/publish.ts:124-200@687f282e

<a id="sc-dependency-updates"></a>
## 22. 依赖更新节奏与缺口

### 22.1 源事实

`dependabot.yml`：

- npm：根目录，排除 `vendor/**`；cron 每天 04:00 Asia/Shanghai；cooldown 30 天；标签 `kind/dependency` + `area/infra`。
- uv：`/python/sdk`；同样 schedule/cooldown/标签。
- github-actions：根目录；同样 schedule/cooldown/标签。
- 没有 `groups`、`open-pull-requests-limit`、`reviewers`/`assignees`；PR 数量可能不受控。
- 不覆盖 `benchmarks/`、`website/` 或其他 Python 子项目（如果存在）。
- 证据：`deepseek-harness/.github/dependabot.yml:1-38@687f282e`。

另一层是 pnpm 的 24 小时 release age（第 2 节）；Dependabot cooldown 30 天不能替代它。版本豁免必须逐精确版本加入 `minimumReleaseAgeExclude`。

### 22.2 操作程序

1. 每日/每周查看 Dependabot PR；优先安全/运行时依赖；devDependency 可批量。
2. 每个 PR：读 changelog/breaking changes；确认 release age 已满足或有精确豁免；确认没有被 `allowBuilds` 阻断。
3. 本地：`pnpm install`、`pnpm run constraints`、`pnpm run package-dependencies`、`pnpm run runtime-closure`、`pnpm run build`、相关测试。
4. 更新 notices；检查 lockfile 是否引入新传递依赖/平台包。
5. 合并；发布依赖走 release 流程。
6. 每月审查：过期 `minimumReleaseAgeExclude`、可移除 override/patch、未合并 security advisory。

**完成信号**：PR 通过 gate；lockfile diff 可解释；notices 更新；没有新增未审查构建脚本。

**失败处理**：
- PR 太多：先合并基础依赖，再 rebase 其余；不要 `--force` 覆盖 lockfile。
- release age 阻断：等待或加精确豁免并记录原因；不要全局关闭。
- vendor 被尝试更新：确认 `exclude-paths` 生效；vendor 走同步流程。

**例外**：`minimumReleaseAgeExclude` 的精确条目是"已审查"声明，不是永久豁免；升级版本后旧条目应删除。Dependabot 的 `cooldown` 是 PR 冷却，不是安装时 release age。

**证据边界**：未查看实际 Dependabot PR 历史；未验证 GitHub cron/时区行为。`dependabot.yml` 38 行已完整阅读。

---

来源：deepseek-harness/.github/dependabot.yml:1-38@687f282e
来源：deepseek-harness/pnpm-workspace.yaml:57-105@687f282e

<a id="sc-node-manager-lock"></a>
## 23. Node、pnpm 与 lockfile 锚定

### 23.1 源义务

- Node：根 `engines.node` 为 `^22.19.0 || >=24.0.0`；根目录没有 `.nvmrc`/`.node-version`（源根文件列表未显示）。
- pnpm：`packageManager: pnpm@11.28.5` + 根 devDependency `pnpm: 11.28.5`；`minimumReleaseAgeExclude` 也豁免 `pnpm@11.28.5`。
- lockfile 提交；CI `pnpm install --frozen-lockfile`（`deepseek-harness/.github/workflows/ci.yml:96-102@687f282e`）。
- `pnpm-workspace.yaml` 的 `overrides`/`peerDependencyRules`/`allowBuilds`/`minimumReleaseAgeExclude`/`patchedDependencies` 都是解析输入；改它们必须更新 lockfile。
- 发布 job 用 `--ignore-scripts`；开发安装不能用它替代构建。

### 23.2 操作程序

1. 新仓库写 `packageManager`、`engines`；CI 使用对应版本，不要让默认 Node 漂移。
2. 修改解析相关字段后 `pnpm install` 更新 lockfile；不要手改 lockfile。
3. CI/发布安装用 `--frozen-lockfile`；本地可用普通安装，但提交前确保同步。
4. 升级 pnpm：同时更新 `packageManager`、devDependency、release age 豁免、CI action；一个 PR 完成。
5. 升级 Node：更新 `engines`、CI matrix、native 构建镜像；跑全量测试 + packed install。
6. 检查 `allowBuilds`：新增原生依赖必须显式审查；拒绝不需要的脚本。

**完成信号**：干净环境 frozen install 成功；CI 版本与 `packageManager` 一致；lockfile diff 只含预期变化。

**失败处理**：
- CI/本地 pnpm 不一致：以 `packageManager` 为准；Corepack 切换。
- lockfile 冲突：重新安装生成，不要手工合并。
- Node 不满足 engines：不要用 `--engine-strict=false` 绕过生产；升级或改 engines。

**例外**：`engines` 允许两个大版本，但 CI 可能只跑一个；迁移时应至少测试最低/最高支持版本。`--ignore-scripts` 只适用于已有构建产物的发布安装。

**证据边界**：未读取 CI 的 Node setup 全部；只从 `engines`/`packageManager`/release 工作流推断。Node 22.19 的具体行为（如 `require(esm)`）未验证。

---

来源：deepseek-harness/package.json:1-10@687f282e
来源：deepseek-harness/package.json:275-275@687f282e
来源：deepseek-harness/pnpm-workspace.yaml:105-105@687f282e
来源：deepseek-harness/.github/workflows/ci.yml:96-102@687f282e
来源：deepseek-harness/docs/development.md:27-31@687f282e

<a id="sc-release-consumer"></a>
## 24. 发布消费边界：verify → pack → publish

### 24.1 源事实

- `release.yml`（dsh 预演）：PR/push 上跑依赖策略、安装布局；pack job 跑 `release:verify --family dsh`（非发布模式）、构建、`release:pack --family dsh`，**另外** pack vendor 与 Landlock entry 仅供 packed install 验证；随后 `release:verify-packed-install --from dist/npm --from dist/npm-vendor --from dist/npm-landlock`；只上传 `dist/npm/*`，不发布。vendor/landlock tarball 不进入 artifact。
- `release-publish.yml`（dsh 发布，手动）：**pack job 从当前 tree 重新构建/打包**（不是复用 PR artifact）：frozen install、`RELEASE_PUBLISH=true release:verify --family dsh`、`build:official`、pack dsh、pack vendor/landlock 供验证、packed install、上传 dsh artifact。**publish job** 下载该 artifact，`pnpm install --frozen-lockfile --ignore-scripts`，运行 `release:publish --family dsh --from dist/npm`；publish job 没有 build 步骤。环境 `npm-publish` 是唯一可写 registry 的 job。
- `release-vendor-publish.yml`（vendor 发布，手动）：同样两段式；pack job 跑 `release:verify --family vendor`、`build:lib:host`、pack vendor、vendor packed install、上传；publish job 下载并 `release:publish --family vendor --from dist/npm-vendor`。vendor 有独立 tag/版本线；dsh 的发布不发布 vendor tarball。
- `release/pack.ts`：pack 是发布边界；无凭据；从同一 commit 产出所有 tarball；调用 `pnpm pack`；写 `publish-order.txt`；校验 payload 与 packed identity。
- `release/verify.ts`：解析 publish order；发布模式下检查非 private、tag/family/version。
- `release/verify-packed-install.ts`：临时消费者真实安装；允许 `--from` 多个目录；驱动 entry；检查安装图隔离。
- `release/publish.ts`：逐包检查 registry：不存在则发布；已存在且 integrity 相同则跳过；已存在但不同则失败。对 `E409/E429/E500/E502/E503/E504/ETIMEDOUT/ECONNRESET/EAI_AGAIN` 做最多 4 次重试，每次重试先重读 registry；显式 `--dist-tag` 在整批上传前校验占用。**源码没有 `--provenance` 参数**；不要把 provenance 当成已实现的发布保证。
- 证据：`deepseek-harness/scripts/release/pack.ts:1-108@687f282e`、`deepseek-harness/scripts/release/verify.ts:40-100@687f282e`、`deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e`、`deepseek-harness/scripts/release/publish.ts:1-235@687f282e`、`deepseek-harness/.github/workflows/release.yml:1-180@687f282e`、`deepseek-harness/.github/workflows/release-publish.yml:1-131@687f282e`、`deepseek-harness/.github/workflows/release-vendor-publish.yml:1-126@687f282e`。

### 24.2 操作程序

1. PR 中完成依赖/包变更；确保 dependency + pack 通过。
2. 合并后手动触发对应 workflow：dsh 用 `release-publish.yml`（无 version 输入），vendor 用 `release-vendor-publish.yml`（可选 `dist-tag` 输入）。确认 ref 是 family tag（`dsh-v*`/`vendor-*`）；tag 必须已存在，workflow 不会替你创建。
3. pack job 从当前 tree 重新构建/打包并上传 artifact；publish job 下载 artifact，不重新 build。不要以为 publish 会复用 PR 预演产物。
4. packed install 在 pack job 中完成（dsh 还带 vendor/landlock `--from`）；publish job 不再重跑。若 pack job 的 packed install 失败，publish 不会开始。
5. 发布前核对 `release:publish` 的 registry integrity/`dist-tag` 行为；发布后核对 registry tarball integrity 与 artifact。**源码不生成 provenance/attestation**；“检查 provenance”是迁移增强建议，不是源机制。
6. 发布前确认 tag/release/changelog 与版本一致；不要在发布后补一个不匹配的 tag。
7. 发布后发现坏包：deprecate，不要删除/重用版本；发修复版本。

**完成信号**：registry 可安装；integrity 一致；tag/release 匹配；packed install 在 pack job 已通过。provenance 只有在你额外实现/启用后才是完成信号。

**失败处理**：
- tag 已存在/不匹配：停止，修版本/tag；不要 force push。
- packed install 失败：回到 pack 阶段修复，不要跳过验证。
- integrity 不同：调查可重复构建/缓存；不要覆盖已发布版本。
- registry 权限失败：检查 environment/token；不要换个人 PAT。

**例外**：dsh 的 `release-publish.yml` 只发布 `dist/npm`；vendor/landlock tarball 仅用于验证。vendor 由 `release-vendor-publish.yml` 单独发布 `dist/npm-vendor`；不要把它当成 dsh 发布的一部分。`apps/desktop` 不走 npm 发布，走桌面安装包流程（不在本域展开）。发布 tag 规则依赖 `GITHUB_REF`，本地不会触发。

**证据边界**：未运行发布；`release.yml` 1-180、`release-publish.yml` 1-131、`release-vendor-publish.yml` 1-126、`release/publish.ts` 1-235 全读。publish job 的 environment reviewer/allowed-tag 配置属于 GitHub 远端设置，仓库文件只留注释，未验证。`release:verify` 的 tag 读取/本地行为未运行。

---

来源：deepseek-harness/scripts/release/pack.ts:1-108@687f282e
来源：deepseek-harness/scripts/release/verify.ts:40-100@687f282e
来源：deepseek-harness/scripts/release/verify-packed-install.ts:1-126@687f282e
来源：deepseek-harness/scripts/release/publish.ts:1-235@687f282e
来源：deepseek-harness/.github/workflows/release.yml:1-180@687f282e
来源：deepseek-harness/.github/workflows/release-publish.yml:1-131@687f282e
来源：deepseek-harness/.github/workflows/release-vendor-publish.yml:1-126@687f282e

<a id="sc-python-runtime"></a>
## 25. Python SDK runtime wheel、锁定资源与双阶段发布

### 25.1 源义务

Python 侧有两个发行物，不能混成一个 wheel：

- `deepseek-harness-sdk`：纯 Python wheel，`py3-none-any`，包含 SDK 模块、`LICENSE`，并精确依赖 `deepseek-harness-runtime-bin==<version>`。
- `deepseek-harness-runtime-bin`：平台 wheel，包含 `dsh` 可执行文件、ripgrep/macOS spawn-helper sidecar，以及一个 `downloads.json`/Office skills 资源目录；只发布 wheel，不发布 sdist。

`build-python-release.py` 的 `stage_sdk`/`stage_runtime` 是打包事实源：SDK wheel 写入 `LICENSE`；runtime wheel 写入 `LICENSE` + `THIRD_PARTY_NOTICES.md`；runtime 可执行文件必须与 `platforms.json` 的 `executable` 名称完全一致，平台 tag 由构建环境 `DSH_RUNTIME_PLATFORM_TAG` 指定（`deepseek-harness/scripts/build-python-release.py:128-215@687f282e`）。`hatch_build.py` 在构建时再次拒绝：

- `sdist`：runtime 包是 wheel-only；
- 非空但缺文件、或多出文件、或平台 tag 不唯一的 payload；
- 非可执行文件（Windows 除外）、缺失的 `-rg`/`-spawn-helper` sidecar；
- 平台 tag 与 `platforms.json` 不匹配。

`platforms.json` 精确列出五个 runtime 平台：`manylinux_2_28_x86_64`、`manylinux_2_28_aarch64`、`macosx_14_0_arm64`、`macosx_14_0_x86_64`、`win_amd64`；没有 Windows arm64（`deepseek-harness/python/sdk-runtime/platforms.json:1-22@687f282e`、`deepseek-harness/python/sdk-runtime/hatch_build.py:48-108@687f282e`）。`build-python-release.py` 还会解包检查：WHEEL `Tag` 必须恰好是 `py3-none-any` 或 `py3-none-<platform tag>`；`Name`/`Version` 必须匹配；`License-Expression` 必须是 `MIT`；`License-File` 集合必须是 SDK `[LICENSE]` / runtime `[LICENSE, THIRD_PARTY_NOTICES.md]`；SDK wheel 不得含 runtime payload；SDK 的 `Requires-Dist` 必须含精确 runtime pin；单文件不得超过 100,000,000 字节（`deepseek-harness/scripts/build-python-release.py:47-92@687f282e`、`deepseek-harness/scripts/build-python-release.py:217-295@687f282e`）。

**运行时资源不是构建时全部塞入 wheel。** `runtime-bootstrap.mjs` 只在显式 `DSH_RUNTIME_DOWNLOAD=office|primary` 时下载；普通 import/CLI 启动不下载。它要求 `DSH_RESOURCE_CACHE` 是绝对路径；`downloads.json.identity` 必须是 64 位 hex；下载先写临时目录，再 rename 到 `<cache>/<identity>/<kind>`，失败清理临时目录，已存在 `complete` 标记时复用。`_resources.py` 对最终目录再校验 `downloads.json` 的 `target`、64-hex `identity`、非空 `office`、`pnpm` 为对象，以及自动发现 Office cache 时 `complete` 内容与 `identity` 一致（`deepseek-harness/python/sdk-runtime/runtime-bootstrap.mjs:1-105@687f282e`、`deepseek-harness/python/sdk-runtime/src/deepseek_harness_runtime/_resources.py:1-121@687f282e`）。`scripts/python-runtime-download.spec.ts` 还验证：启动不创建缓存、primary/office 独立下载、失败清理、并发只发布一个完整缓存、非法 selector 被拒绝（`deepseek-harness/scripts/python-runtime-download.spec.ts:1-135@687f282e`）。

**资源内容由 lock 固定，不由下载时解析。** `scripts/primary-runtime/lock.json` 固定 Node/Python 版本、每个平台的 Node/Python archive SHA-256、每个目标平台的 Python wheels URL/SHA-256，以及共享 wheel 列表和 Python distribution 版本。Office sidecar 的每个 npm package 也由 `pnpm-lock.yaml` 的 `sha512-...` integrity 锁定，`officeSidecarArchives` 按包名/版本构造 registry tarball URL，并在解包时核对 package identity（`deepseek-harness/scripts/build-exe-for-python-sdk-office.ts:1-63@687f282e`）。示例源值：Node `24.21.0`、Python `3.12.14`、release `20260901`；迁移时应参数化，不要把这三个值当通用默认。`prepare.ts`：

- 按 SHA-256 校验 archive；npm tarball 先校验 `sha512-...` integrity，再解包并核对 `package.json.name/version`；
- 支持 `DSH_RESOURCE_DOWNLOAD_TIMEOUT_MS` 的 1..2147483647 整数边界；
- 拒绝 wheel 的 `.data` 安装 scheme（`scripts` 除外）；
- `primaryRuntimePayloadDigest` 把 `format: 7`、target、Python/Node 版本、wheels、Python packages、pnpm 版本一起哈希；提取/组装格式变化必须提升 format；
- 只删除 numpy/pandas 的 `tests` 目录并同步其 `RECORD`，不删测试 helper 或原生扩展（`deepseek-harness/scripts/primary-runtime/prepare.ts:1-287@687f282e`、`deepseek-harness/scripts/primary-runtime/prune-python-tests.ts:1-41@687f282e`、`deepseek-harness/scripts/primary-runtime/lock.json:1-180@687f282e`）。

`build-exe-for-python-sdk.ts` 在编译前先运行 `verify-runtime-closure`；以 `dsh-python-runtime-closure` 为 deploy root，使用 `--prod --config.allow-unused-patches=true --config.node-linker=hoisted --config.auto-install-peers=false --config.link-workspace-packages=true --config.hoist-workspace-packages=false`，把 staging 变成 symlink-free 目录；随后把 workspace symlink 物化为文件、按 pnpm identity 去重相同 workspace 包，并删除 README/CHANGELOG/HISTORY/map/d.ts 等非运行时文件。`allowUnusedPatches:true` 只允许“运行闭包外”的未使用 patch；闭包内 patch 必须仍能应用——这是第 11 节 patch 规则在 Python runtime 上的例外（`deepseek-harness/scripts/build-exe-for-python-sdk.ts:264-338@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:340-384@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk-staging.ts:1-103@687f282e`）。staging 生成 `downloads.json` 时用 `{version,target,office,pnpm,primaryLock}` 再哈希出 64-hex identity；`runtime-bootstrap.mjs` 是该 closure 的唯一入口；deploy root 的依赖清单来自 `python/sdk-runtime/package.json`（`deepseek-harness/scripts/build-exe-for-python-sdk.ts:417-423@687f282e`、`deepseek-harness/python/sdk-runtime/README.md:1-69@687f282e`、`deepseek-harness/python/sdk-runtime/package.json:7-160@687f282e`）。

**发布是两阶段，不是一次 `twine upload dist/*`。** `python-release.yml`：

1. `build` 生成六个 wheel（五个 runtime 平台 + 一个 SDK）；
2. `python-compat` 在 Python 3.10/3.14 安装本地 runtime wheel，跑 `smoke-python-runtime.py --scenario sdk-default` 和 `sdk-mcp`；
3. `validate` 严格要求六个文件名、每个文件 `<100000000` 字节，`twine check`，生成 `SHA256SUMS` 并上传 artifact；
4. `publish-runtime` 先发布五个 runtime wheel（`environment: pypi-runtime`、`id-token: write`、`sha256sum -c SHA256SUMS`、`attestations: false`）；
5. `publish-sdk` 再发布 SDK wheel（`environment: pypi`、同样校验 hash）；如果 SDK 上传失败，重跑失败 job 从 `publish-sdk` 继续，不会覆盖已 immutable 的 runtime 文件。

发布仅在手动 `workflow_dispatch`、tag `python-v<repository-version>`、`PYPI_PUBLISHER_REPOSITORY` 等于当前仓库且 `PUBLIC_PYPI_RELEASE_ENABLED=true` 时允许；`attestations:false` 的注释说明公开 attestation 会暴露私有发布仓库身份（`deepseek-harness/.github/workflows/python-release.yml:1-248@687f282e`）。Python SDK 自身用 `pyproject.toml` 固定 `requires-python >=3.10`、`pydantic>=2.12,<3` 和精确 runtime pin；`uv.lock` 提交版本/hash，runtime 包的 test group 用 Pillow/pytest；runtime wheel 的构建/发布与 SDK wheel 分离（`deepseek-harness/python/sdk/pyproject.toml:1-39@687f282e`、`deepseek-harness/python/sdk/uv.lock:1-45@687f282e`、`deepseek-harness/python/sdk-runtime/pyproject.toml:1-41@687f282e`）。

### 25.2 操作程序

1. **先改源 lock，不要手改 wheel**：需要升级 Node/Python/库时，更新 `scripts/primary-runtime/lock.json` 和/或 `python/sdk/uv.lock`；如需新平台，先加 `platforms.json`，确认目标 tag 与 `lock.targets` 一一对应。
2. **构建 runtime payload**：在目标架构主机（或 workflow 的 build job）运行 `python/sdk-runtime` 的构建，设置 `DSH_RUNTIME_PLATFORM_TAG`；`hatch_build.py` 会拒绝 sdist、缺文件、多文件、错误 sidecar、错误平台 tag。不要用 `--skip-build` 跳过构建；`verify-runtime-closure` 仍应先运行。
3. **构建 wheel**：`python scripts/build-python-release.py --package runtime --platform <target> --runtime-exe <exe> --output-dir dist` 和 `--package sdk ...`。每个命令都会检查 wheel tag、名称、版本、license 文件、MIT、runtime payload、SDK 的精确 runtime pin 和 100MB 上限。
4. **发布前验证**：用 `validate` 的六个文件名清单核对 `dist`；对每个 wheel 跑 `twine check`；生成 `SHA256SUMS`；在干净 venv 安装“SDK wheel + 对应平台 runtime wheel”跑 SDK 冒烟。只验证一个平台不够。
5. **发布**：手动触发 `python-release.yml`，先 runtime 后 SDK；发布只从 `python-v<version>` tag，且 repository 必须是配置的 publisher repository。不要把 runtime 与 SDK 合并成一个 job；immutable 文件不能靠重跑覆盖。
6. **运行期资源**：只通过 `download_primary_runtime()`/`download_office()` 显式下载；测试 `DSH_RESOURCE_DOWNLOAD` 只接受 `office`/`primary`，非法值必须失败并保持缓存为空；设置 `DSH_RESOURCE_CACHE` 时必须绝对路径。普通 `import`/`dsh` 启动不得触发下载。

**完成信号**：

- 五个平台 runtime wheel 的文件名/tag/payload 与 `platforms.json` 完全匹配，且每个 wheel 的 `LICENSE`/`THIRD_PARTY_NOTICES.md` 存在；
- SDK wheel 是 `py3-none-any`，无 runtime payload，且 `Requires-Dist` 精确 pin 同版本 runtime；
- `SHA256SUMS` 在 publish 前被 `sha256sum -c` 复核；runtime 先于 SDK 发布；
- 干净 venv 的 SDK 默认/MCP 场景可启动；显式下载失败不留下半成品缓存；并发下载只产生一个完整目录。

**失败处理**：

- wheel 超过 100MB：先拆 payload/裁掉测试资源；不要改上限绕过；
- WHEEL tag 或 runtime payload 不匹配：检查 `platforms.json`、`DSH_RUNTIME_PLATFORM_TAG`、源可执行文件 basename；不要手工重命名 wheel；
- `Requires-Dist`/license/版本检查失败：修 `stage_sdk`/`stage_runtime` 或 pyproject；不要 `--no-deps` 发布绕过；
- hash 不匹配：删除损坏缓存并重新下载；不要跳过 hash；
- runtime 已发布而 SDK 失败：只重跑 `publish-sdk`，不要重新上传 runtime；
- 普通启动尝试下载：说明 `downloads.json` 或 selector 泄漏，修 bootstrap；不要在 import 路径加隐式下载。

**例外**：

- `runtime/node/` 是 dev-only carrier，可从源码运行，但被排除在 wheel/sdist 之外；生产 wheel 不依赖它。
- 生产 deploy 允许闭包外的未使用 patch；仓库安装仍拒绝未使用 patch；不要把这个例外推广到整个 workspace。
- 仅发布已声明平台；其他平台应报 `unsupported ... platform`，不是静默生成错误 wheel。
- `DSH_RESOURCE_CACHE`、`DSH_OFFICE_SIDECAR`、`DSH_PRIMARY_RUNTIME` 是可配置覆盖；前两者必须是绝对路径，`DSH_PRIMARY_RUNTIME` 由 profile 解析（建议绝对路径，空值禁用），资源内容仍按 manifest/identity 校验。

**证据边界**：本节为静态源码分析；没有运行 `uv build`、wheel 安装、`twine check`、Python workflow 或真实 PyPI 发布。PyPI environment/reviewer、`PYPI_PUBLISHER_REPOSITORY`、`PUBLIC_PYPI_RELEASE_ENABLED` 的真实配置未验证。`uv.lock` 既有声明已由1-45扩展到另有46-419补读，本批只复读1-18及UV项目调用来源；它是保存解析版本/来源/hash的生成数据，不是手写政策，完整语义/锁一致性与实际冻结安装仍未证明。`build-exe-for-python-sdk.ts` 本域只声明关键段（27-43、167-172、197-235、256-338、340-384、417-423、480-519、600-622），Release另有1-622声明，不能把peer读取算成本批新读。`lock.json` 具体版本/hash是源快照，目标必须按实际依赖重新生成并验证。

来源：deepseek-harness/python/sdk/pyproject.toml:1-39@687f282e
来源：deepseek-harness/python/sdk/uv.lock:1-45@687f282e
来源：deepseek-harness/python/sdk-runtime/pyproject.toml:1-41@687f282e
来源：deepseek-harness/python/sdk-runtime/package.json:1-164@687f282e
来源：deepseek-harness/python/sdk-runtime/platforms.json:1-22@687f282e
来源：deepseek-harness/python/sdk-runtime/hatch_build.py:1-108@687f282e
来源：deepseek-harness/python/sdk-runtime/runtime-bootstrap.mjs:1-105@687f282e
来源：deepseek-harness/python/sdk-runtime/src/deepseek_harness_runtime/_resources.py:1-121@687f282e
来源：deepseek-harness/python/sdk-runtime/README.md:1-69@687f282e
来源：deepseek-harness/scripts/primary-runtime/lock.json:1-180@687f282e
来源：deepseek-harness/scripts/primary-runtime/prepare.ts:1-287@687f282e
来源：deepseek-harness/scripts/primary-runtime/prepare.spec.ts:1-169@687f282e
来源：deepseek-harness/scripts/primary-runtime/prune-python-tests.ts:1-41@687f282e
来源：deepseek-harness/scripts/build-python-release.py:1-295@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:27-43@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:167-172@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:197-235@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:256-338@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:340-384@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:417-423@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:480-519@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk.ts:600-622@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk-staging.ts:1-103@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk-office.ts:1-63@687f282e
来源：deepseek-harness/scripts/build-exe-for-python-sdk-resources.ts:1-17@687f282e
来源：deepseek-harness/.github/workflows/python-release.yml:1-248@687f282e
来源：deepseek-harness/scripts/python-runtime-download.spec.ts:1-135@687f282e
来源：deepseek-harness/python/development.md:7-17@687f282e
来源：deepseek-harness/python/development.md:92-98@687f282e

<a id="sc-migration"></a>
## 26. 迁移落地顺序

### 阶段 A：最小可运行内核（1-2 天）

1. 固定 Node/pnpm，提交 lockfile，CI frozen install。
2. 写 workspace 成员 glob；两份清单若并存，明确各自消费者。
3. 根 `private: true`、`type: module`；包有 name/version/license/private。
4. 检查 public 包 `main`/`types`/`exports`/`files`；private 包不能有 `publishConfig`。
5. 检查 packed tarball 无 `src`/map；临时安装并 import 每个公开入口。
6. 若使用 vendoring/patches，先建清单；没有就跳过，不要造空目录。

### 阶段 B：依赖与发布边界（3-5 天）

7. 依赖面策略（按源码使用推导，而不是简单禁重复）。
8. workspace 协议与版本家族。
9. 可选依赖静态导入扫描。
10. 许可证/notices 生成与 `--check`。
11. 实验包命名/发布/依赖隔离；默认产品隔离。
12. 运行时部署 manifest 闭包（如果目标有单可执行/离线部署）。

### 阶段 C：完整消费者验证（1-2 周）

13. publint + NodeNext + package-meta（需要构建）。
14. 双版本 npm 布局（如果目标有多 release 共存）。
15. packed install（真实 tarball、entry、optional 两种路径）。
16. 产品使用/默认隔离/实验策略。
17. 配置来源窄检查 + 凭据注入。
18. 发布工作流拆分：verify/pack 与 publish 分离；publish 只上传已验证 tarball；OIDC provenance。
19. 依赖目录（如果目标需要公开消费者解析快照）。

### 参数化表

| 源值 | 目标决策 |
|---|---|
| `@deepseek-ai/dsh*` | 目标 scope/前缀；用于版本家族、workspace 协议、release family |
| `packages/<group>/<pkg>` | 目标目录层级；group 不得有 package.json |
| `lib/index.js`、`lib/types/index.d.ts` | 目标构建输出目录；所有 gate 的路径常量 |
| `pnpm@11.28.5` | 包管理器/版本；release age/allowBuilds 的等价配置 |
| `^22.19.0 || >=24.0.0` | Node 支持矩阵 |
| `vendor/README.md` 的 9 个包 | 目标 vendored 闭包；没有就删相关 gate |
| `patches/` 的 8 个补丁 | 目标补丁清单；每个补丁的原因/移除条件 |
| `apps/desktop` 等排除项 | 目标不发布到 npm 的 app/工具清单 |
| `THIRD_PARTY_NOTICES.md` | 目标 notices 文件名/生成器/分层策略 |
| `python/sdk-runtime` | 目标部署 manifest；如果不用 Python，删 runtime-closure |

### 额外建议（非源义务）

- 用 pnpm `catalog:` 代替"多 manifest 同范围 + 目录检查"，从机制上减少版本漂移。
- 为每个 patch 写 `patches/README.md`（原因、上游 issue、移除条件、测试）；源仓库没有。
- 把 `config-source-ownership`、`dependency-catalog`、`verify-npm-install-layout` 加入 PR lane 或 nightly；源仓库的 lane 安排有缺口。
- 为 `vendor/` 建立机器可读的"上游 commit → 本地修改 → 同步日期 → 负责人"清单。
- 对 native 平台包做消费者机器矩阵测试；源仓库因 musl 工具链排除了部分平台包。
- 用 `npm audit`/OSV 或等价服务补充漏洞扫描；源仓库 gate 不含漏洞数据库检查。
- 如果目标仓库有 "public 包不能依赖 private 包" 的需求，单独实现；源 `verify-package-dependencies` 没有找到该独立检查。

---

<a id="sc-evidence-limits"></a>
## 27. 证据边界与未决项

1. **未运行任何 gate**：没有执行 `pnpm install`、`constraints`、`package-dependencies`、`publint`、`node-next-types`、`runtime-closure`、`npm-install-layout`、`release:verify`、`release:verify-packed-install`、`gen-third-party-notices`。本文的"完成信号"是程序性描述，不是运行证据。
2. **未逐行阅读的实现**：
   - `verify-package-dependencies.ts` 1-1038 全读（含此前遗漏的 593-595、701-703）；`package-dependency-policy.ts` 1-105 全读。
   - `check-workspace-constraints.ts` 1-666 全读；`verify-package-paths.ts` 1-113、`gen-tsconfig-paths.ts` 1-239、`gen-tsconfig-paths.spec.ts` 1-96、`verify-package-paths.spec.ts` 1-73 全读。
   - `verify-npm-install-layout.ts` 既有1-275声明；`verify-runtime-closure.ts` 原1-130已另有131-237补读声明。源码区间完整不等于closure执行、artifact存在或目标原生运行通过。
   - `release/pack.ts` 既有1-108、`release/publish.ts` 1-235、`release/verify-packed-install.ts` 1-126声明；本域`families.ts`为1-12、330-340、345-495，`verify.ts`为40-100，Release另有各自1-495/1-110声明。原分段/peer关系不当作本批新读，任何pack/publish/consumer效果仍须实际运行。
   - `vendor/README.md` 本域声明1-13、15-57、59-73，不称逐行全73行；`scripts/check-vendor-manifest.sh` 1-17、`lefthook.yml` 1-49、`rescope-vendor.ts` 1-661、`gen-third-party-notices.ts` 1-870、`THIRD_PARTY_NOTICES.md` 1-304已有声明，但未运行`--check`。`native/system`与四个平台manifest有既有声明，未作平台运行证明。
   - 8 个 patch 文件均按 hunk/关键 diff 阅读；`exceljs` 806 行未逐行语义审阅，`@yao-pkg/pkg` 的巨型 worker bundle 行未逐字符展开。
   - `.github/workflows/release.yml`、`release-publish.yml`、`release-vendor-publish.yml` 全读；GitHub Environment 的 reviewer/allowed-tag 是远端设置，未验证。
3. **未验证的外部依赖/运行行为**：
   - pnpm 的 `strictDepBuilds`/`minimumReleaseAge` 具体默认值与本地行为；`workspace:` 替换规则已查 pnpm 官方 Workspace 文档，但未实际跑 `pnpm pack` 观察 tarball。
   - npm 的 hoisting/peer 解析在具体版本下的行为；`release:publish` 的 registry 重试只读源码，未对真实 registry 运行。
   - GitHub Actions OIDC/provenance/Environment 的实际配置；源码没有 `--provenance`，provenance 只是迁移增强建议。
   - native 平台包的 musl/架构构建；`release.yml` 的 packed install 不安装这些平台包。
   - Python `uv` lock 与 `python/sdk/uv.lock`/notices 的一致性未运行验证。
4. **源仓库已知覆盖缺口**：
   - `publint`/`package-meta` 只覆盖 `packages/*/*`；`verify-package-paths` 只检查文档/TS 路径漂移，不检查发布文件存在性。
   - **标准 export key set 没有自动 allowlist gate**：`checkWorkspaceManifest` 只检查根 `exports["."]`，`expectedDshPackageFiles`/`verify-package-meta` 只检查特定 locale/icon/subpath，`publint` 是通用 lint。新增未文档化键必须靠评审；文档里"改 owning doc + check"的 check 在已读脚本中未找到。
   - **workspace range 是分层规则，不是冲突**：constraints 覆盖所有成员，对普通目标只要求 `workspace:` 前缀；dependency gate 只覆盖 `apps/*`、`packages/*/*`、`vendor/*`，但在其范围内把所有非 dsh 目标收紧为 `workspace:~`。`workspace:^` 在 gate 外合法；不要声称它已全局退役。
   - dependency gate 的 `WORKSPACE_MANIFEST_GLOBS` 只覆盖 `apps/*`、`packages/*/*`、`vendor/*`；`benchmarks/`、`python/`、`native/` 不在内。`--fix` 只在 policy 无违规时工作，且会刷新 lockfile/module graph。
   - 共享身份/duplicate-safe 证据是单元 fixture + `assertDualDshInstallLayout` 的 synthetic/metadata-only 布局；没有真实重复安装 smoke。
   - `safeHostDependencyExports` 的新增由精确 roster 测试和人工评审阻止，不是运行时禁止；不要写成"policy 会拒绝任何新条目"。
   - `no-TLA` 只覆盖 `packages/*/*/src`。
   - `verify-dsh-package-licenses` 使用 `package.json.workspaces`，不覆盖 `benchmarks/`、`python/`。
   - `verify-npm-install-layout` 只在 release 工作流；它是合成 registry/metadata-only，不是真实安装。
   - `config-source-ownership`/`dependency-catalog`/`package-paths` 在 `ci-static` 中会跑（它展开完整的 `docSyncLeafGates`，只省略 doc-typecheck）；`hygiene` 不跑它们。
   - `package-meta` 不在 `hygiene`/`check-all`；`vendor-manifest` 不是 `run-gates` gate，只在 lefthook pre-commit。
   - `verify-third-party-notices` 不是独立 lane；只有全量 test inventory 的 freshness spec 和手工命令。
   - 没有 `npm audit`/漏洞扫描 gate。
   - 没有 patch 原因/freshness 自动检查；Desktop policy 只记录范围 reason，不是上游 issue/移除版本。
   - `minimumReleaseAgeExclude` 列表长，容易积累过期条目。
   - `gen-third-party-notices` 依赖已安装 store，干净 checkout 不能单独运行；它的 permissive 检查是仓库策略，不是法律意见。
   - `release.yml` packed install 不安装部分平台 native 包。
   - **release family 只有 dsh/vendor**：`releaseFamilies()` 不返回 native；native 由 `node-addon-system-release.yml` 单独处理。不要把 `release:pack --family native` 写成可用命令。
   - **发布不生成 provenance**：`release:publish` 没有 `--provenance`；需要时是额外实现，不是源保证。
   - `release-publish.yml` 的 pack job 会从当前 tree 重新构建，不复用 PR 的 artifact；只有 publish job 不 build。
5. **源仓库内部不一致/待澄清**：
   - `vendor/AGENTS.md` 说"只有构建问题才改 vendored 源码"，`vendor/README.md` 记录大量行为修改；
   - `package.json.workspaces` 与 `pnpm-workspace.yaml.packages` 成员集合不同；
   - `docs/development.md` 说 "Keep dependency build scripts explicitly allowlisted in pnpm-workspace.yaml"，实际键是 `allowBuilds`；
   - `checkWorkspaceManifest` 对 vendored 包跳过 source/map 的 manifest 扫描，但 `release/pack` 仍做 tarball payload 校验；需要确认 vendor 发布策略是否与此一致；
   - `verify-package-dependencies` 没有找到 public→private 依赖检查，若目标需要必须另写；
   - `verify-config-source-ownership` 只做窄的单行检查，不是通用配置来源治理。
6. **未决问题（迁移决策）**：
   - 是否继续 vendoring，还是 registry + patch；
   - 是否维持 dsh/vendor 两个 `releaseFamily`、native 独立工作流，还是把 native 纳入统一 family；
   - 是否允许 app 发布到 npm；
   - 是否要求 provenance（需要公共仓库 + OIDC）；
   - 是否保留私有实验包；
   - 如何处理 Python/其他语言锁与 npm notices 的一致性。

这些未决项不应被隐藏；迁移评审时应逐项给出决策、负责人和验证方式。

---

## 机制→来源引用索引（完整）

本节按机制列出 `knowledge/` 账中登记的全部来源区间，使用固定提交 `687f282e`。它只补齐可回溯的引用坐标，不新增正文断言；正文解释仍以对应小节为准。

- `supply-chain-workspace-topology`：`deepseek-harness/package.json:1-20@687f282e`、`deepseek-harness/pnpm-workspace.yaml:17-24@687f282e`
- `supply-chain-workspace-protocol`：`deepseek-harness/scripts/check-workspace-constraints.ts:600-642@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:573-580@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:1-58@687f282e`、`deepseek-harness/scripts/release/bump.ts:350-416@687f282e`、`deepseek-harness/scripts/release/tarball.ts:14-57@687f282e`
- `supply-chain-dependency-faces`：`deepseek-harness/scripts/verify-package-dependencies.ts:656-703@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:704-823@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.ts:824-923@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.spec.ts:301-344@687f282e`、`deepseek-harness/scripts/verify-package-dependencies.spec.ts:1008-1038@687f282e`
- `supply-chain-manifest-publication`：`deepseek-harness/scripts/check-workspace-constraints.ts:37-58@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:434-549@687f282e`、`deepseek-harness/scripts/publication-payload.ts:1-55@687f282e`、`deepseek-harness/scripts/check-workspace-constraints.ts:91-361@687f282e`
- `supply-chain-package-paths`：`deepseek-harness/package.json:100-160@687f282e`
- `supply-chain-optional-deps`：`deepseek-harness/apps/cli/tests/profiles/packed-installation.ts:130-190@687f282e`
- `supply-chain-vendor-sync`：`deepseek-harness/vendor/README.md:1-13@687f282e`、`deepseek-harness/vendor/README.md:59-73@687f282e`
- `supply-chain-vendor-rescope`：`deepseek-harness/scripts/rescope-vendor.ts:1-661@687f282e`、`deepseek-harness/docs/rescope.md:1-31@687f282e`
- `supply-chain-vendor-patches`：`deepseek-harness/patches/@earendil-works__pi-ai@1.1.0.patch:1-73@687f282e`、`deepseek-harness/patches/@electron__osx-sign@1.3.3.patch:1-26@687f282e`、`deepseek-harness/patches/@fortune-sheet__core@1.0.4.patch:1-76@687f282e`、`deepseek-harness/patches/@fortune-sheet__react@1.0.4.patch:1-138@687f282e`、`deepseek-harness/patches/@yao-pkg__pkg@6.21.0.patch:1-134@687f282e`、`deepseek-harness/patches/app-builder-lib@26.17.0.patch:1-27@687f282e`、`deepseek-harness/patches/exceljs@4.4.0.patch:1-806@687f282e`、`deepseek-harness/patches/node-pty@1.2.0-beta.15.patch:1-45@687f282e`、`deepseek-harness/apps/desktop/scripts/runtime-patch-policy.ts:1-25@687f282e`、`deepseek-harness/apps/desktop/scripts/prepare-runtime-patches.ts:1-124@687f282e`、`deepseek-harness/apps/desktop/packaging/README.md:261-265@687f282e`
- `supply-chain-licenses-notices`：`deepseek-harness/scripts/gen-third-party-notices.ts:549-628@687f282e`、`deepseek-harness/scripts/gen-third-party-notices.ts:721-870@687f282e`、`deepseek-harness/scripts/gen-third-party-notices.spec.ts:1-471@687f282e`、`deepseek-harness/THIRD_PARTY_NOTICES.md:1-304@687f282e`
- `supply-chain-packed-install`：`deepseek-harness/scripts/release/families.ts:404-470@687f282e`、`deepseek-harness/scripts/local-bundle-registry.spec.ts:282-290@687f282e`
- `supply-chain-product-use`：`deepseek-harness/scripts/run-gates.ts:364-380@687f282e`
- `supply-chain-experimental-policy`：`deepseek-harness/scripts/experimental-package-policy.ts:1-67@687f282e`
- `supply-chain-python-runtime`：`deepseek-harness/python/sdk-runtime/package.json:1-164@687f282e`、`deepseek-harness/python/sdk-runtime/hatch_build.py:1-108@687f282e`、`deepseek-harness/scripts/primary-runtime/prepare.spec.ts:1-169@687f282e`、`deepseek-harness/scripts/build-python-release.py:1-295@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:27-43@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:167-172@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:197-235@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:256-338@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:480-519@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk.ts:600-622@687f282e`、`deepseek-harness/scripts/build-exe-for-python-sdk-resources.ts:1-17@687f282e`
