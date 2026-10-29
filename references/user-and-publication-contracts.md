# 用户与发布契约操作参考

本参考面向“把 Harness 交给用户、把页面发给公众、把插件交给第三方”的工作，覆盖固定提交 `687f282e` 中 `docs/user/**`、`docs/cordis-tutorial/**` 与 `website/**` 体现的契约。它不解释全部产品功能，只回答：什么时候必须做什么、做到什么算完成、失败后从哪里恢复、哪些保证其实不存在。

## 0. 读者触发索引

<a id="reader-triggers"></a>

| 你要做的事 | 先读 | 必须完成的动作 | 设计上的完成信号 |
|---|---|---|---|
| 把 Web UI 放到反向代理/隧道后 | §1 | 分设公告与准入；配代理五项；决定 TLS 终止 | 受信 Host 可换会话；伪造 Host 得 403；HTTPS 链路 cookie 安全 |
| 在代理后启动 DSH 或排查“请求没走代理” | §2 | 只在启动环境导出代理变量；写 NO_PROXY；补 CA | 代理连接日志出现请求；诊断不打印代理密码 |
| 接入模型提供商或 MCP | §3 | 密钥只写；用 credential reference；谨慎用环境回退 | 接口只返回脱敏 descriptor；子进程无 DSH/凭据变量 |
| 打包/安装插件 | §4 | 写 `dsh.bundle`；维护 bundles 顺序；git 安装前固定 commit | `--dump-config` 出现对应层；安装期代码执行被显式授权 |
| 写插件、Tool、服务、事件 | §5 | schema 配置、effect 清理、waterfall `next()` | 非法配置 FAILED；卸载后注册与资源全部释放 |
| 接入 LLM 适配器 | §6 | 流式分片协议、稳定错误码、归因头 | 分片顺序正确；不支持字段抛 `LlmError` |
| 写/修教程 | §7 | 固定命令、预期输出、失败演示 | 干净 checkout 按章复跑一致 |
| 新增/改发布页或语言 | §8 | 只改 `docs/` 源与 `website/docs.ts` 清单 | 侧栏/导航/raw/llms 同步；未发布 raw 404 |
| 改构建输出目录 | §9 | 保持 `outDir` 在站点根内 | 清理前拒绝根/外部/链接逃逸 |
| 在 `website/` 放内容或跑检查 | §10 | 不在子树放 Markdown；跑 `docs:check` | 布局测试拒绝新增 `.md` |
| 改主题交互 | §11 | 渐进增强、保留源节点、单一模态、全部 dispose | 路由/语言/主题切换无残留 |
| 改网站行为与快照 | §12 | 双语言快照、mock 边界、失败路径 | `docs:check` 中五个 spec 通过 |
| 发布/消费插件市场索引 | §13 | 格式校验、https、失败关闭、安装确认 | 违规索引整份拒绝并给 JSON 路径 |
| 接入第三方 MCP 服务 | §14 | 默认关闭、secret 走 `config.env`、三步验证 | 新会话能召回唯一值 |
| 用 Python SDK 嵌入 | §15 | 显式 home、新 session、评估危险默认 | 不读 `~/.dsh`；关键默认被显式覆盖 |

**证据约定。** 源引用写作 `deepseek-harness/<path>:<start>-<end>@687f282e`；只列实际读过的行。显示层对超过 768 字符的行会截断，凡出现该情况的源行均已用 `:raw` 逐行补读，覆盖记录注明行号。

每条义务区分：

- **源义务**：源文档或源实现明确要求/执行的行为。
- **源实现事实**：代码实际怎么做，但不一定构成对外承诺。
- **迁移设计**：为采用方补充的落地方式，源仓库没有对应自动保证。
- **额外建议**：不属于源合同，可裁剪。

固定提交的网站/文档代码没有在本提取中执行；所有“完成信号”是设计上的可观察结果，不是已跑通的证据。

---

<a id="user-and-publication-contracts.public-deployment-trust"></a>

## 1. 公网部署：公告、信任栅栏与 TLS

**何时读。** 把 `dsh --profile web` 放到 Caddy/Nginx/隧道后面；新增公开域名、挂载前缀；在监听器上直接终止 TLS；所有 API 突然 403；cookie 不回传。

**源义务。**

1. 外部链路归反向代理：公开主机名、TLS、剥离挂载前缀；DSH 监听器只应答 origin-root 路由。`--public-url` 只做公告，不改变路由，也不等于准入。
2. 代理必须保留浏览器可见的 Host；栅栏用收到的 Host 比对 loopback、监听器自身绑定地址与 `--trusted-host` 列表，其余一律 403。
3. 代理必须转发 `Upgrade`/`Connection`；WebSocket 才能穿过。
4. 代理必须把后端 host-only `Path=/` cookie 改写为挂载前缀，并在 HTTPS 链路上补 `Secure`；监听器自身 TLS 已发 `Secure` 时只改 `Path`。
5. 裸挂载 `/ui` 必须以 `/ui/` 抵达；只有 `/ui/` 用启动 token 换会话 cookie，`/ui/` 或 `/ui/index.html` 才服务已持 cookie 的浏览器。
6. `--trusted-host` 必须逐项列出浏览器可见 authority；不带端口的条目匹配任意端口；`--public-url` 公告的地址不会自动准入。
7. 监听端口不受栅栏或公告保护，必须限制在可信代理/网络内。
8. 面向浏览器的 `http://` 根会明文暴露启动 token；公开腿部用 `https://`。
9. 原生 TLS 需要 `--tls-cert` 与 `--tls-key`（相对进程工作目录解析）：证书文件含完整链，私钥为无口令 PEM。DSH 不获取、不续期、不监视；读取一次；缺失或无效时启动失败，绝不回退 HTTP。
10. 证书必须覆盖用户实际打开的 hostname/IP；浏览器用自己的信任库校验。
11. 打印的 URL 携带进程凭据，只与预期用户分享。

**执行步骤。**

1. 列出浏览器可见根 URL 与 authority，分别写入 `--public-url` 与 `--trusted-host`。
2. 配置代理：保留 Host、剥离挂载、转发升级、改写 cookie、重定向裸挂载。
3. 决定 TLS 终止点；若用监听器，准备完整链与无口令私钥。
4. 限制监听端口。
5. 验证：受信 authority 经代理访问 `/ui/` 换会话；其他 Host 调 API 得 403；已持 cookie 时 `/ui/index.html` 可加载；确认没有 http 根。
6. 把打印 URL 当凭据分发。

**完成信号（计划验证）。** 受信 authority 下 API 正常且 cookie 带 `Path=/<挂载>/` 与 `Secure`；伪造 Host 或仅公告未准入的 authority 返回 403；缺证书时启动失败。

**失败与恢复。** 403 时先补 `--trusted-host` 并重载监听器，再查代理 Host 透传；不要放宽栅栏到任意 authority。TLS 启动失败时更换证书路径/权限并重载；不得加 HTTP 回退。

**例外。** 回环与监听器自身绑定地址默认接受；无端口条目匹配任意端口（适合每次绑定不同端口的隧道）；代理部署与 `--public-url` 可独立使用。

**迁移设计。** 把“公告”和“准入”做成两个独立配置与两个独立验证项；代理五项义务写成可勾选清单；TLS 失败关闭，不降级。发布检查至少包含一次伪造 Host 的拒绝用例。

**源证据。**

- `deepseek-harness/docs/user/guide/public-deployments.md:1-37@687f282e`
- `deepseek-harness/docs/user/guide/public-deployments.zh.md:1-37@687f282e`

**证据限制。** 代理五项义务与端口隔离只有部署评审，没有自动检查；证书续期/信任库/名称校验由外部系统负责；未执行真实代理或浏览器场景。

---

<a id="user-and-publication-contracts.proxy-egress-policy"></a>

## 2. 出站代理、直连白名单与凭据不外泄

**何时读。** 在受限网络/企业代理后启动；配置 `NO_PROXY`；代理需要凭据或 TLS 拦截；模型运行的命令读取环境变量。

**源义务。**

1. 代理只从启动时读取的 `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` 获得；导出的变量优先于 `$DSH_HOME/.env`。
2. 项目自己的 `.env` 不能设置代理变量：仓库随 `git clone` 到达，DSH 宁可拒绝启动也不让仓库决定流量去向。
3. DSH 不读取操作系统代理设置；需要变量方式或 TUN 模式。
4. 代理凭据写在 URL 中；诊断只点名被拒绝的变量，不回显 URL。
5. `NO_PROXY` 条目匹配主机及全部子域；前导 `.` 或 `*.` 等价；可带 `:port`；`*` 绕过全部；CIDR 写法无效。
6. loopback（`localhost`、`127.0.0.0/8`、`::1`、`0.0.0.0`）始终直连。
7. SOCKS 不支持：`socks5://` 在启动时报告并跳过，该 scheme 直连，不会借用另一个 HTTP 代理变量。
8. TLS 拦截代理需要 `NODE_EXTRA_CA_CERTS` 指向企业 CA；Node 只在进程启动时读取，必须在启动前导出。
9. bash 工具、git、gh 与作为子进程启动的 MCP 服务继承这些变量；Node 22.21 之前子进程不识别变量而直连。
10. 代理 URL 中的密码是普通环境变量，DSH 运行的任何命令（包括模型写的）都能读取；敏感时使用无凭据入口或其他认证。
11. 模型写的 workflow worker 与 Node PTC 运行时进程不接收代理设置；直连请求必须自行配置并仍受执行沙箱约束。
12. 遥测使用 Node 自带 HTTP 客户端直连；直连出口被封时仅遥测失败；`DSH_TELEMETRY_MODE=DISABLED` 可完全关闭。
13. `web_fetch` 指向字面私有地址（如 `http://10.0.0.5/`）时直接拒绝，不交给代理；无代理配置时同样拒绝。

**执行步骤。**

1. 在 shell profile 或 `$DSH_HOME/.env` 导出 `HTTP_PROXY`/`HTTPS_PROXY`（两者都设），确认导出项优先。
2. 用域名/域后缀设置 `NO_PROXY`，不要 CIDR；不要列 loopback。
3. 代理需认证时使用 URL 凭据，并评估模型命令可读该值。
4. TLS 拦截场景在启动前导出 `NODE_EXTRA_CA_CERTS`。
5. 用 headless fetch 触发请求，在代理连接日志确认；用 `env | grep -i proxy` 确认变量进入 DSH 环境。
6. 核对直连例外：本地服务、PTC、遥测、私有地址。

**完成信号（计划验证）。** 请求出现在代理日志；`NO_PROXY` 域及子域直连；loopback 始终直连；证书错误诊断不含代理用户名/密码；字面私有地址被拒绝。

**失败与恢复。** 代理未生效先确认变量是否进入 DSH 进程，不要改代码；SOCKS 场景改用 HTTP 端口；TLS 拦截失败时导出 CA 后重启，不要关闭校验。

**例外。** `ALL_PROXY` 可单独覆盖两个 scheme；`NO_PROXY=*` 绕过全部；TUN 模式无需变量；遥测可用 `DSH_TELEMETRY_MODE=DISABLED` 关闭。

**迁移设计。** 把代理配置当部署事实：变量来源白名单、直连例外表、凭据泄露说明三者同时交付；提供 headless fetch 验证法与 `env` 检查。

**源证据。**

- `deepseek-harness/docs/user/guide/network-proxy.md:1-85@687f282e`

**证据限制。** 企业代理、CA 分发与出口防火墙不在仓库控制内；模型命令读取环境变量只能靠无凭据入口缓解；未在真实代理环境执行验证。

---

<a id="user-and-publication-contracts.credential-boundary"></a>

## 3. 凭据只写、引用存储与环境回退边界

**何时读。** 新增/编辑提供商或自定义网关；使用环境变量作凭据回退；给 MCP stdio 子进程传秘密；审计页面/API 是否回显密钥。

**源义务。**

1. API 密钥字段只写：保存后页面只收到脱敏 descriptor，绝不返回字面密钥。
2. 密钥存放在 `$DSH_HOME/.credentials.yaml`；设置只保留 credential reference。
3. 凭据输入有眼睛按钮时才显示；改变输入立即重新遮罩；存储的凭据保持只写。
4. 环境回退检测只说明“是否检测到变量”，不验证凭据、不测试连接；绿/黄/未确认分别对应检测到、未检测到、状态读取失败。
5. 提供商自管凭据文件（AWS profile、Google ADC 等）不在检测范围。
6. 没有原生密钥认证的提供商（如 `openai-codex`）除非 profile 明确给出 credential reference，否则不显示密钥字段。
7. 自定义 Provider ID 永久：请求、已保存会话、模型默认值和凭据引用都用它；重命名需新增再删除旧提供商。
8. 自定义提供商标识一个 API 协议；同一网关提供两种协议时必须建两个提供商。
9. `input`/`compat` 等字段是对端点的声明而非检测；声明错误由提供商拒绝；未知/空值开关被 schema 拒绝而不是忽略。
10. 内置提供商的推理级别、请求兼容开关、headers/timeouts/retry 在 `$DSH_HOME/profiles/<profile>/cordis.patch.yml` 配置（与 Models 页写同一文档）；适配器下次请求重读，无需重启。
11. MCP stdio 的秘密放在行的 `config.env`，不直接写入 YAML；stdio 桥接在启动前移除名称像凭据的环境变量与所有 `DSH_*` 变量，其余环境仍继承。
12. 代理 URL 中的密码是普通环境变量，DSH 启动的命令都可读；敏感部署使用无凭据代理入口。

**执行步骤。**

1. 在 Settings → Models 输入密钥并保存；不通过截图/日志传播输入值。
2. 确认保存后页面/接口只显示脱敏 descriptor 与 credential reference。
3. 需要环境回退时明确变量名，理解检测不等于验证；绿色提示不代表连接可用。
4. 自定义网关按协议建提供商并永久确定 Provider ID；修改字段后重读配置目录。
5. MCP 秘密放入 `config.env`；不要把令牌写进 `cordis.yml` 文本或 overlay 注释。
6. 审计断言：任何 GET/设置响应、日志与子进程环境都不含明文密钥。

**完成信号（计划验证）。** 读取设置只得到 descriptor+reference；磁盘密钥只出现在 `.credentials.yaml`；MCP 子进程环境无令牌变量与 `DSH_*` 变量；空 `compat` 键/未知 modality 被拒绝。

**失败与恢复。** 密钥疑似泄露时轮换并检查 `.credentials.yaml` 与环境变量；不要依赖 UI 遮罩。`compat` 被拒时删除空键或补齐协议支持值，再重载。

**例外。** 提供商自管凭据文件不参与检测；无密钥字段的提供商仍可通过 credential reference 工作；代理凭据没有专门存储，只能靠无凭据入口缓解。

**迁移设计。** 把“秘密只写、只引用、不回显”做成存储 API 硬约束；把“检测不验证”写进 UI 文案；第三方子进程环境过滤做成默认。

**源证据。**

- `deepseek-harness/docs/user/guide/providers.md:1-227@687f282e`
- `deepseek-harness/docs/user/guide/network-proxy.md:1-85@687f282e`
- `deepseek-harness/docs/user/guide/mcp-memory.md:1-101@687f282e`

**证据限制。** 环境检测不验证凭据；页面遮罩与只写保证依赖服务端实现；未做端到端泄露测试；代理 URL 密码无法由 DSH 防住模型命令读取。

---

<a id="user-and-publication-contracts.plugin-packaging-contract"></a>

## 4. bundle/profile 双 manifest、层顺序与安装期代码执行

**何时读。** 把本地 `--patch` 插件分发为可安装 bundle；新增/重置 profile；从 git 或 tarball 安装；排查插件未生效、peer 重复或配置被整体替换。

**源义务。**

1. bundle 是携带配置层的 npm 包，manifest 声明 `dsh.bundle`（`patch` 为单文件或有序文件列表），回答“贡献什么”。
2. profile 是 `$DSH_HOME/profiles/<name>` 目录，manifest 声明 `dsh.profile.bundles` 有序列表，回答“按什么顺序组合”。
3. 一个包不能同时是 bundle 与 profile；profile 不手写，由 `--from-default-profile` 或 `dsh plugin` 创建/维护。
4. 没有 `dsh.bundle` 的包仍可安装，但只是普通依赖：`dsh plugin` 打印警告且不激活任何层。
5. bundle 用 `engines.dsh` SemVer 声明支持的 DSH 版本；安装与 profile 启动拒绝不满足范围的 bundle；未声明时改查其 `@deepseek-ai/dsh*` peer 依赖范围。
6. 有效配置由空根按序叠加：profile 的 `bundles` 列表顺序 → profile 自己的 `cordis.patch.yml` → `$DSH_HOME/cordis.patch.yml` → 每个 `--patch`（argv 顺序）。app 参数不是补丁层。
7. 后层按行覆盖，且 patch 整体替换该行的 `config`，不做深合并；覆盖别人的行必须重述它需要的每个键。
8. bundle 行用包名引用已安装代码；patch 文件中的相对插件路径相对该 patch 文件解析。
9. linked checkout 中，必须与宿主共享实例的 dsh 包同时列入 `peerDependencies` 与 `devDependencies`；无状态工具/独立第三方依赖放 `dependencies`。
10. 显式 `require.resolve(..., { paths })` 始终走原生解析；peer 拦截不验证版本范围。
11. surface bundle 的命令行通过 inject `cmdlineArgs` + `parseCmdline` 提供 app 自有服务；行用 `!!js` 读取注入服务并以部署值兜底；`--help` 时不发布服务，相关行不激活。
12. 从 git 安装只取源码不跑 build：作者必须提供自包含的 `prepare` 脚本产出入口；pnpm ≥10 要求用户在 profile 的 `pnpm-workspace.yaml` 写 `allowBuilds` 键。
13. `allowBuilds` 等于允许在安装期于本机执行包代码（不在 agent 沙箱内）；只信任源码并固定 commit；否则发布 npm 预构建物或 tarball。

**执行步骤。**

1. 建立 `package.json`：`dsh.bundle.patch`、`files`、`main`，必要时 `engines.dsh`。
2. 编写 `cordis.patch.yml`，行以包名引用；多文件时给有序 patch 数组。
3. `dsh plugin --profile demo add ./hello-plugin`，检查 `dsh.profile.bundles` 追加。
4. `dsh --profile demo --dump-config` 确认出现 `# == <bundle>` 层，再启动。
5. 覆盖早层行时重述完整 `config`；验证后层优先级。
6. git 安装：作者提供自包含 `prepare`；用户把 pnpm 打印的精确包键写入 `allowBuilds` 并固定 commit。
7. 移除：`dsh plugin --profile demo remove <pkg>`，确认依赖与层同时消失。

**完成信号（计划验证）。** 安装后 `bundles` 追加且 `--dump-config` 出现对应层；`remove` 后依赖与层同时消失；后层整行替换生效；列表外 `engines.dsh` 被拒绝。

**失败与恢复。** 插件未生效先查 `bundles` 与 `--dump-config`，不要重复 `add`；补丁键被吞时重述整行 `config`；git 安装失败按 pnpm 打印的精确包键补 `allowBuilds` 并固定 commit，或改发预构建物。

**例外。** in-box bundle 名始终从 dsh 安装解析，pnpm 只管 out-of-tree 包；app 参数不是补丁层；`--help` 时服务不发布。

**迁移设计。** 用两份 manifest 把“贡献”和“组合”分开；层序写成固定算法；整行替换给出显式警告；安装期代码执行必须逐包授权并固定版本。

**源证据。**

- `deepseek-harness/docs/user/develop/basic/publish.md:1-191@687f282e`

**证据限制。** peer 解析规则只由文档与实现约定描述，不验证版本范围；`allowBuilds` 的真实安全边界取决于 pnpm 行为与用户判断；未实际安装包或执行 pnpm。

---

<a id="user-and-publication-contracts.plugin-authoring-contract"></a>

## 5. 插件作者契约：apply/inject、Config schema、effect 与能力分层

**何时读。** 写第一个插件或 Tool；增加配置项；提供/消费服务或监听事件；拆分可替换能力；通过 Creator mode 持久化插件配置。

**源义务。**

1. 插件是导出 `apply(ctx[, config])` 的 TypeScript 模块；`name` 是诊断用可选元数据；必需服务写进 `inject`，框架在依赖就绪前保持 `PENDING`。
2. 插件可用函数、对象（带 `apply`）或 `Service` 子类三种形态；函数形态足够，只有提供跨插件服务时才用类形态。
3. 配置必须导出同名 `Config` 类型与运行期 schema；默认值写在 schema 字段上；普通对象不具备 Standard Schema 接口，不能作为 `Config`。
4. 配置在插件加载时校验；非法配置让 fiber 进入 `FAILED` 并给出可操作错误，不得半配置启动。
5. 任何两个部署可能设置不同的值都必须是配置字段；判据是能否只改 `cordis.yml` 而不改代码。`volatile` 字段用 `.volatile()` 声明在固定对象路径；仅 volatile 变化经 `internal/config` 校验并发一次 `loader/volatile-update`，不重挂载；无效候选记录日志并保持运行引用不变。
6. 通过 `ctx` 的注册（事件、工具、服务）都是 effect，卸载时自动撤销；Cordis 未管理的资源必须在 `ctx.effect()` 中获取并返回 disposer。
7. disposer 按注册逆序开始，但多个异步 disposer 并发执行、无串行完成保证；有顺序要求的清理放进单个 disposer 并串行 `await`。
8. 服务用 `Service` 子类 `super(ctx, name)` 注册；用 declaration merging 给 `ctx` 增加类型；服务名每应用一个扁平命名空间，自有服务应加有辨识度的前缀或命名空间（harness 占用 `tools`、`llm` 等普通名）；`cordis.yml` 的 `isolate` 可让不同 plugin group 看到同一服务的独立实例。
9. 硬依赖用 `inject`；可缺失能力不用 `inject`，在使用点 `ctx.get(name)` 探测并处理 `undefined`。
10. 事件名遵循 `namespace/action`；dispatch 模式是事件契约的一部分（`emit`/`parallel`/`serial`/`bail`/`waterfall`）；`waterfall` 监听器只观察或注释时必须调用 `next()`，不调用是故意短路。
11. `turn/*`、`step/*`、`tool/call`、`tool/result`、`compaction/*` 是持久化会话事件类型，不是同名 Cordis 事件；要观察它们，监听 `session/event` 并检查 `event.type`。
12. Tool 用 `defineTool`：`name`/`description`/`parameters`/`output.schema`/`output.render`/`execute`；参数按 spec 校验并推断，`execute` 返回 `output.schema` 声明的规范值，`render` 生成模型可见内容。
13. 可替换能力按三角色拆分：Service Definition、Service Provider、Consumer；只在角色需独立演进时拆包，Definition 拥有 Request/Result 类型，Provider 与 Consumer 互不依赖。
14. 默认值与解析放在显式 `resolve(request): Spec` 步骤，不把 `?? default` 藏进 `run()`。
15. Creator mode 的持久化配置属于当前 profile、影响其会话并跨重启保留；它写配置型 bundle，用 `plugin_manager install_bundle` 安装；验证 `application: applied` 与实际工具调用，`restart-required` 表示尚未激活；编辑前先读 bundle patch。

**执行步骤。**

1. 建立最小 `apply` + `name` + `inject`，确认依赖就绪后注册能力。
2. 需要配置时定义 `Config` 接口与 schema，默认值落在 schema；本地验证非法值 `FAILED`。
3. 为定时器/连接/watcher 写 `ctx.effect` 并返回释放函数；顺序敏感清理合并到一个 disposer。
4. 提供服务时用 `Service` 子类并声明类型；消费方 `inject` 或 `ctx.get`。
5. 观察/拦截事件时选正确 dispatch 模式；`waterfall` 非短路路径必须 `next()`。
6. 工具用 `defineTool`，先声明 `parameters` 与 `output`，再实现 `execute`/`render`。
7. 能力需可替换时按三角色拆包，组合只在 `cordis.yml`。
8. 持久化配置走 Creator mode，读 patch、`install_bundle`、验证 `applied` 与真实调用。

**完成信号（计划验证）。** 缺依赖插件保持 `PENDING` 且不报错；补 provider 后加载；非法 config `FAILED` 并输出带路径的 `ValidationError`；卸载/HMR 后监听、工具与 effect 资源全部释放。

**失败与恢复。** 插件无输出时先查 fiber 是否为 `PENDING` 并补齐 provider，而不是加日志猜测；清理顺序错误时把步骤合并进一个 disposer 并串行 `await`。

**例外。** `PENDING` 是合法状态，缺依赖不会自动报警；无 provider 的 `inject` 合法但永不加载；可选依赖用 `ctx.get` 而不写 `inject`。

**迁移设计。** 插件模板含 `name`/`apply`/`inject` 与 `Config`+schema；资源统一走 `ctx.effect`；服务提供方模板含 declaration merging；Tool 模板含 `output.schema`/`render`；评审清单覆盖命名空间与拆包判据。

**源证据。**

- `deepseek-harness/docs/user/develop/basic/index.md:1-144@687f282e`
- `deepseek-harness/docs/user/develop/basic/config.md:1-106@687f282e`
- `deepseek-harness/docs/user/develop/basic/tool.md:1-52@687f282e`
- `deepseek-harness/docs/user/develop/framework/index.md:1-137@687f282e`
- `deepseek-harness/docs/user/develop/framework/service.md:1-148@687f282e`
- `deepseek-harness/docs/user/develop/framework/events.md:1-143@687f282e`
- `deepseek-harness/docs/user/develop/practice/index.md:1-155@687f282e`
- `deepseek-harness/docs/user/develop/practice/dynamic-cordis.md:1-15@687f282e`
- `deepseek-harness/docs/cordis-tutorial/03-services.md:1-98@687f282e`
- `deepseek-harness/docs/cordis-tutorial/05-config.md:1-111@687f282e`
- `deepseek-harness/docs/cordis-tutorial/06-composition-and-hmr.md:1-113@687f282e`

**证据限制。** `PENDING` 缺依赖不自动报警；配置字段判据与拆包时机依赖评审；未运行插件或 HMR。

---

<a id="user-and-publication-contracts.llm-adapter-contract"></a>

## 6. LLM 适配器契约：StreamChunk 序列、稳定错误码与归因头

**何时读。** 接入新的 LLM 提供商/自定义网关；实现或修改 `LlmAdapter.stream()`/`resolveModel()`；排查流式响应、工具调用或推理强度错误。

**源义务。**

1. 适配器继承 `LlmAdapter` 并实现 `stream(options: GenerateOptions): AsyncIterable<StreamChunk>`。
2. 每个 `block-start` 必须有匹配的 `block-end`；`index` 从 0 递增并标识内容块顺序。
3. `tool-call-delta` 的 `argumentsDelta` 是原始 JSON 文本，可一次或分多片。
4. `usage` 在 `finish` 之前发出；`finish` 是最后一个分片，`reason.kind` 为 `stop` 或 `tool-calls`。
5. `GenerateOptions` 支持的字段必须映射到提供商 API；无法支持的字段抛带稳定 `code` 的 `LlmError`，不得静默丢弃。
6. `resolveModel(provider, model, signal?)` 一次查询返回精确 provider/model 身份与可选 context/reasoning 元数据；`reasoning` 保留适配器权威可选列表（含上游返回的 `off`），不要提升为核心枚举；异步查找遵循 `signal`。
7. 服务校验聚合结果并在 `stream()` 前拒绝不支持的显式 effort；省略 `reasoning` 表示该模型没有可选推理能力。
8. `registerAdapter(providers, adapter)` 的 `providers` 是路由列表；`GenerateOptions.provider` 选择适配器，`model` 是适配器自有 id；可选 `listModels()` 供选择器使用。
9. 每个提供商 HTTP 请求必须合并 `attributionHeaders()` 并转发 `options.signal`。
10. 传输/协议失败以 `LlmError` 稳定 code 抛出；agent loop 保留错误与 code，不自动转换普通 `Error`。

**执行步骤。**

1. 实现最小 `LlmAdapter` 子类与 `stream` 分片序列。
2. 映射 `GenerateOptions`；不能支持的字段抛 `LlmError`。
3. 实现 `resolveModel` 身份与 reasoning 元数据，处理 `signal`。
4. `registerAdapter` 注册路由；需要时实现 `listModels`。
5. HTTP 请求合并 `attributionHeaders` 并转发 `signal`。
6. 用 `cordis.yml` 行配置 `apiKey` 与 `providers`，agent-loop 指向 provider/model。
7. 测试分片顺序、工具调用、usage-before-finish、错误码与取消。

**完成信号（计划验证）。** `block-start/text-delta/block-end/usage/finish` 顺序可被 agent loop 消费；工具调用可执行；未声明的显式推理强度在 `stream()` 前被拒；HTTP 非 2xx 抛 `PROVIDER_HTTP_ERROR`。

**失败与恢复。** 流被截断时检查 `block-end`/`finish` 与 abort signal，不要在 agent loop 打补丁；网关拒绝时按稳定 code 与配置修正映射，禁止静默丢字段。

**例外。** 适配器可省略 `reasoning` 表示无推理能力；`listModels` 可选；`off` 是否可选用上游能力 API 决定。

**迁移设计。** 以分片协议与稳定错误码为验收面：先写协议测试，再写提供商映射；不支持字段必须失败而不是降级；模板包含 `attributionHeaders`+`signal`。

**源证据。**

- `deepseek-harness/docs/user/develop/practice/llm-adapter.md:1-189@687f282e`

**证据限制。** 分片协议正确性由服务消费与测试保证；提供商 API 差异可能超出示例，以 `@deepseek-ai/dsh-llm` 导出类型为准；未运行适配器。

---

<a id="user-and-publication-contracts.runnable-tutorial-contract"></a>

## 7. 可运行教程契约：无密钥、固定命令、预期输出与失败诊断

**何时读。** 新增/修改教程章节；教程引用的 API/命令/输出变化；读者按章节操作却无输出或输出不同；审查教程难度顺序。

**源义务。**

1. 教程从仓库 clone + `pnpm install` 开始，在 gitignored 的 `tmp/cordis-tutorial` 中工作，不触碰版本控制。
2. Cordis 教程不需要 API 密钥，每章都可在无密钥环境运行；命令固定为 `node --import tsx ../../vendor/cordis/bin.js`，由 `vendor/cordis/bin.js` 创建根 Context、挂载 Loader 并读取当前目录 `./cordis.yml`。
3. 每章给出可复制的完整文件、确切命令与预期输出；章节按依赖关系排序，后章复用前章概念。
4. 章节必须展示失败面：`apply` 抛错导致进程失败、无法解析的模块经 logger 报告且启动早期可能丢失、配置非法产生 `ValidationError` 并退出 1、`inject` 无 provider 时 `PENDING` 且无输出。
5. 第 6 章用 fiber 注册表诊断 `PENDING`；第 7 章组合真实 harness 服务并对 `tools/result` 观察，需同时列出 system-prompt provider 否则 tools 保持 `PENDING`。
6. basic 线的“第一个 Harness 插件”要求已按 run-from-source 完成；patch 中本地插件路径必须是绝对路径；patch 只贡献配置，不改变 profile 目录的模块解析基准。
7. 教程面向 agent 开发者，对非日常 TypeScript 语法（类型注解、`import type`、declaration merging、泛型）给出解释。
8. 教程中的“下一步”链接指向同语料的对应页面，保持可继续阅读。

**执行步骤。**

1. 从干净 checkout 按 Setup 安装依赖并创建 `tmp/cordis-tutorial`。
2. 逐章复制文件、写 `cordis.yml`、运行固定命令，对照预期输出。
3. 故意制造 `apply` 抛错、错误路径、非法 config 与无 provider 的 `inject`，确认文档描述的失败形态。
4. 修改代码/API 后同步更新所有受影响章节的命令、输出与 Next 链接。
5. 检查教程页与对应 zh 副本的配对记录并重录。

**完成信号（计划验证）。** 干净 checkout 按第 1 章得到预期输出；第 7 章得到两条工具行；第 6 章打印 `PENDING`；非法 config 退出 1。

**失败与恢复。** 按文档无输出时先查 fiber 状态与模块名拼写，再检查是否漏 provider；API 变更后批量更新受影响章节并重录配对。

**例外。** Cordis 教程刻意无密钥且不启动模型；第 7 章只执行工具管线，不调用模型；basic 线需要 run-from-source 环境。

**迁移设计。** 把每章当可执行验收用例：固定工作目录、固定命令、固定输出、固定失败演示；发布周期内从干净 checkout 至少复跑第 1 章与最后一章。

**源证据。**

- `deepseek-harness/docs/cordis-tutorial/index.md:1-60@687f282e`
- `deepseek-harness/docs/cordis-tutorial/01-first-plugin.md:1-95@687f282e`
- `deepseek-harness/docs/cordis-tutorial/02-lifecycle-and-effects.md:1-98@687f282e`
- `deepseek-harness/docs/cordis-tutorial/03-services.md:1-98@687f282e`
- `deepseek-harness/docs/cordis-tutorial/04-events.md:1-144@687f282e`
- `deepseek-harness/docs/cordis-tutorial/05-config.md:1-111@687f282e`
- `deepseek-harness/docs/cordis-tutorial/06-composition-and-hmr.md:1-113@687f282e`
- `deepseek-harness/docs/cordis-tutorial/07-into-the-harness.md:1-108@687f282e`
- `deepseek-harness/docs/user/develop/basic/index.md:1-144@687f282e`
- `deepseek-harness/docs/user/develop/basic/tool.md:1-52@687f282e`

**证据限制。** 教程正确性没有自动执行门禁，只有类型与链接检查；agent 教程的模型侧行为不在无密钥教程内；未执行任何章节。

---

<a id="user-and-publication-contracts.website-publication-surface"></a>

## 8. 发布面契约：清单路由、双语投影、raw 孪生与 llms.txt

**何时读。** 新增/改名/下架发布页；调整侧栏/导航；新增语言；agent 抓取 raw Markdown/`llms.txt`；排查 404、导航旧路由或 raw 404。

**源义务。**

1. 每个发布路由在 `website/docs.ts` 清单里有且仅有一条 `DocsPage`：`locale`、`contentLocale`、`source`、`route`、`label`、`sidebar`、`section`、`order`，可选 `outline` 与 `sourceAliases`。
2. `pairedPages` 由英文源自动派生中文源（`.md` → `.zh.md`）与 `en/` 前缀路由，并给两侧加对侧别名；缺译文时用 `mirroredPages` 让两个 locale 投影同一源，而不是复制文件。
3. Markdown 只留在 `docs/` 等拥有层，经清单投影；`website/` 只拥有 VitePress 配置、展示资产与发布清单。
4. 首页 `docs/user/index.md` 用 `layout: false` + meta refresh 指向 `guide/quickstart`；该目标不是文件，而是清单把 `docs/user/guide/index.md` 的 `route` 命名为 `guide/quickstart.md`（`docs.ts:117-118`）。
5. `sidebar` 集合必须在 `localeCollections` 声明；`section` 必须在 `sections` 声明，否则 `sectionSpec` 抛错；导航落地链接由 `landingLink` 从清单首项派生，集合为空时抛错。
6. `editLink` 从投影页 frontmatter 的 `editSource` 派生；缺 `editSource` 时构建抛错。
7. 生产构建在 `buildEnd` 为每个路由生成 raw 孪生（`index` 路由另有父级别名）与根 `llms.txt`；两者都从清单派生，绝不是本树中的文件。
8. 页面 URL 去掉尾斜杠再加 `.md` 即得到纯 Markdown；开发中间件必须匹配构建语义：显式 `?dsh-raw=1`、`text/markdown`（`llms.txt` 为 `text/plain`）、`HEAD` 不发 body、未发布路由的显式 raw 请求返回 404。
9. 脚本模块请求（`sec-fetch-dest` 非 `document`，且非 empty+显式 raw）必须交还 Vite，保留 Markdown 模块导入；畸形 URL 与 base 外路径也交还 Vite。
10. base 由 `DOCS_BASE` 决定（默认 `/`）；VitePress 不改写 head href，favicon 等 head 链接必须显式拼接 base。
11. 仓库专用参考页（如 `docs/deepseek-llm-api-wire-extensions.md`）不进入清单；若需引用，链接指向 GitHub 源而不是公开路由。

**执行步骤。**

1. 在 `docs/` 拥有层写正文（英文/中文成对，或明确单语镜像）。
2. 在 `docs.ts` 增加 `pairedPages`/`mirroredPages` 条目，填 `source`/`route`/`label`/`sidebar`/`section`/`order`，必要时 `outline` 与 `sourceAliases`。
3. 为集合/分组补 `localeCollections` 与 `sections` 声明。
4. 本地 `pnpm docs:dev`，检查侧栏顺序、导航落地、`editSource` 链接与 raw 链接。
5. 构建后验证 `/<route>.md` 与 `/llms.txt`，并检查 index 路由的父级别名。
6. 改名/下架时只改清单与源文件，不手写 `.generated`/`.dist` 内容。

**完成信号（计划验证）。** 构建后 `/<route>.md` 返回源 Markdown；`/llms.txt` 列出两 locale 的 raw 链接；改名后导航/侧栏自动跟随；缺 section 时构建抛错；未发布 raw 404；脚本 `.md` 请求被交还 Vite。

**失败与恢复。** raw 404 时检查清单是否包含该 route 与 source 是否存在，不要手写 `.dist`；导航失效时修 `landingLink`/清单顺序，不硬编码链接。

**例外。** `mirroredPages` 允许单语页面在两个 locale 下投影同一源；`sourceAliases` 支持目录式旧链接；非清单页面不生成 raw；dev 中普通 `.md` 导航即使没有 `?dsh-raw=1` 也返回源文本。

**迁移设计。** 把发布清单当唯一编辑面：新增页面只改源文件+清单；路由、导航、raw、llms 全部派生；缺省即失败（未声明分组、空集合、缺 `editSource`）。

**源证据。**

- `deepseek-harness/website/AGENTS.md:1-23@687f282e`
- `deepseek-harness/website/docs.ts:1-591@687f282e`
- `deepseek-harness/website/raw-markdown.ts:1-52@687f282e`
- `deepseek-harness/website/.vitepress/config.ts:1-386@687f282e`
- `deepseek-harness/website/tests/raw-markdown.spec.ts:1-83@687f282e`
- `deepseek-harness/docs/user/index.md:1-11@687f282e`

**证据限制。** 清单语义正确性（该不该公开）不由代码校验；raw 孪生会原样暴露源文件，仓库专用页必须显式排除；未构建站点。

---

<a id="user-and-publication-contracts.website-build-containment"></a>

## 9. 构建输出包含：清理前校验根、真实路径与链接形状

**何时读。** 修改 `docs:build`/`build.ts`/VitePress `outDir`；在 CI 或本地执行生产构建；出现陈旧输出、链接形状的 `.dist` 或跨平台路径差异；新增 MPA 构建。

**源义务。**

1. 生产构建入口是根 `package.json` 的 `docs:build` → `tsx website/build.ts`；`website/package.json` 的 `build` 脚本（第 8 行）只在子树内调用 `tsx build.ts`，不用裸 `vitepress build`。
2. `docSiteBuildOptions` 通过 `onAfterConfigResolve` 在 bundling 前清理解析后的 `outDir`，确保 VitePress 写文件时没有陈旧内容。
3. `cleanDocSiteOutput` 要求 `outDir` 是 `siteRoot` 的严格子目录：等于根、相对路径为 `..`、以 `../` 开头、或绝对路径逃逸时抛错。
4. 清理前对 `siteRoot` 与 `outDir` 最近已存在祖先做 `realpath`；真实父路径逃逸真实根时抛错，防止链接父目录。
5. `outDir` 本身是符号链接/junction 时只 `unlink` 链接，不递归其目标。
6. 非链接输出才用 `rmSync(recursive, force)` 清理。
7. `parseMpa` 只接受无参数或 `--mpa`；其他参数报错。
8. 站点配置固定 `srcDir=.generated`、`cacheDir=.cache`、`outDir=.dist`；因 `srcDir` 内的 `public/` 无法存放受版本控制资产，`vite.publicDir` 显式指向 `website/public`。
9. `.generated/`、`.cache/`、`.dist/` 被 gitignore，永不编辑或提交。

**执行步骤。**

1. 确认根 `docs:build` 调用 `tsx website/build.ts`、`website/package.json` 的 `build` 为 `tsx build.ts`（第 8 行），`docs:build` 先构建再跑片段校验。
2. 本地/CI 用干净工作树执行构建，检查 `.dist` 生成与陈旧文件消失。
3. 构造 `outDir`=根、外部目录、junction、父目录 junction 四种情况，确认拒绝或只 unlink 链接。
4. 修改 `outDir`/`srcDir`/`publicDir` 时同步检查 `.gitignore` 与评论。
5. MPA 构建用 `--mpa`；其他参数应失败。

**完成信号（计划验证）。** 陈旧 `.dist/stale.md` 构建前被清理；`outDir`=根/外部/链接父目录时在清理前抛错且源文件不变；junction 输出只移除链接。

**失败与恢复。** 清理报错时修 `outDir`/`srcDir` 配置，不要改 `rm -rf` 手删；链接输出被拒绝遍历时重建为真实目录。

**例外。** `outDir` 不存在时向上找最近已存在祖先；`force:true` 使缺失输出不报错；MPA 只改变构建模式，不改变清理规则。

**迁移设计。** 把“删除前证明目标是本根的子路径”做成构建库函数，并在配置解析钩子里调用；符号链接只解除不跟随；`parseMpa` 白名单。

**源证据。**

- `deepseek-harness/website/build.ts:1-86@687f282e`
- `deepseek-harness/package.json:134-137@687f282e`
- `deepseek-harness/website/.vitepress/config.ts:173-386@687f282e`
- `deepseek-harness/website/package.json:1-24@687f282e`
- `deepseek-harness/website/.gitignore:1-4@687f282e`

**证据限制。** 校验覆盖路径包含性与链接形状，不覆盖并发构建或网络文件系统竞态；未执行构建。

---

<a id="user-and-publication-contracts.website-content-ownership"></a>

## 10. `website/` 内容所有权与 `docs:check` Markdown 门禁

**何时读。** 在 `website/` 下新增文件；有人想把文档复制进站点树或建 locale/API 子目录；改动 website 配置/主题后跑检查；CI 运行 `docs:check`。

**源义务。**

1. `website/` 只拥有 VitePress 配置、展示资产与发布清单；`AGENTS.md` 是该子树唯一维护的 Markdown 文件。
2. 规范正文与生成目录留在 `docs/` 拥有层，再经 `docs.ts` 暴露选定页面。
3. 不得新增 `website/zh-CN/`、`website/en/`、`website/api/` 等 locale、路由或复制文档树。
4. 投影器把一次性 Markdown 写到被忽略的 `website/.generated/`；不得编辑或提交 `.generated/`、`.cache/`、`.dist/`。
5. 改完该子树运行 `pnpm docs:check`；门禁拒绝 `website/` 下额外的非忽略 Markdown。
6. 门禁用 `git ls-files --cached --others --exclude-standard -- website` 发现文件，只允许 `website/AGENTS.md` 以 `.md` 结尾，其余 `.md` 全部失败。

**执行步骤。**

1. 新增站点内容前确认它属于 `docs/` 源层；只有配置/资产/清单放 `website/`。
2. 需要新页面时在 `docs/` 建源并在 `docs.ts` 登记。
3. 本地运行 `pnpm docs:check`；确认没有新增 `.md`。
4. CI 保持 `docs:check` 覆盖该测试。
5. 若确需子树说明文件，只维护 `AGENTS.md`。

**完成信号（计划验证）。** 仅 `AGENTS.md` 时布局测试通过；新增任意 `website/**/x.md` 时测试列出路径并失败；生成目录不出现在发现结果。

**失败与恢复。** 被门禁拒绝时把内容移回 `docs/` 并在 `docs.ts` 登记，不要改白名单；生成文件误入版本控制时清理并确认 `.gitignore` 生效。

**例外。** `AGENTS.md` 是唯一允许项；被 gitignore 的生成目录不计入发现；若未来确需子树 Markdown，必须显式修改白名单并评审。

**迁移设计。** 用“子树只放非内容资产 + 门禁白名单”替代口头约定；把检查接入现成的 `docs:check`；文档写明生成目录。

**源证据。**

- `deepseek-harness/website/AGENTS.md:5-17@687f282e`
- `deepseek-harness/website/.gitignore:1-4@687f282e`
- `deepseek-harness/package.json:134-137@687f282e`
- `deepseek-harness/scripts/project-doc-site.spec.ts:20-65@687f282e`

**证据限制。** 门禁只按扩展名与 git 发现判断，无法识别非 `.md` 的复制内容；依赖测试脚本与 git 环境；未运行 `docs:check`。

---

<a id="user-and-publication-contracts.theme-interaction-contract"></a>

## 11. 默认主题扩展契约：渐进增强、源节点保留、单模态与释放

**何时读。** 修改默认主题、页面操作按钮或查看器；新增可交互 Markdown 增强；排查路由切换后模态残留、滚动锁死、图片重复按钮；排查搜索摘录改变代码组选择。

**源义务。**

1. 主题 `extends DefaultTheme`，仅在 `doc-before` 插入 `PageMarkdownActions`；客户端增强在 `onMounted` 后动态 import，避免 SSR 加载浏览器库。
2. SSR/未水合时输出可用的 raw 链接（`.page-markdown-static`，`target=_blank`、`rel=noopener`、本地化 `aria-label`），且不渲染按钮、不发起 fetch。
3. `PageMarkdownActions` 的 key 包含 `route.path`、`lang` 与 `rawMarkdownPath`，路径/语言变化时重建实例，旧实例请求被 abort。
4. Markdown 操作使用投影器提供的 `rawMarkdownPath` 与 site base（含 index 路由），fetch 目标为 `` `<base><path>?dsh-raw=1` ``。
5. 复制只在点击手势内调用 `clipboard.write(ClipboardItem)`，数据 promise 按需解析；缺 `ClipboardItem`/`navigator.clipboard` 时直接给手动复制提示，不发请求。
6. 接受 `text/markdown` 或 `text/plain`；非 2xx、其他 content-type、body 读取失败与剪贴板拒绝分别进入 `requestFailed`/`clipboardFailed` 本地化状态，失败后可重试。
7. 菜单支持 ArrowDown/ArrowUp/Home/End 循环、Escape 关闭并回到 toggle、外部 pointerdown、focusout 与再次点击关闭；卸载时移除监听并 abort 请求。
8. 图片增强只处理 `.vp-doc p > img`，且必须已加载（`complete`、`naturalWidth/Height>0`）、`alt` 非空、独占段落（仅空白文本与自身按钮），并排除链接/按钮内、`.mermaid` 内、`data-no-zoom`、`aria-hidden=true`、`role=presentation/none`。
9. 图片与 Mermaid 增强不得移动或替换源元素；只添加容器 class、可点击 class 与兄弟按钮；源 `SVG`/`img` 保持原样。
10. Mermaid 只处理 `.vp-doc .mermaid` 内具有正 `viewBox` 的 `SVG`；打开时 clone 到 shadow root，避免宿主样式与片段 id 解析到原图。
11. 图片与 Mermaid 共用一个 `MediaViewer`，打开新视图前关闭旧视图；同一时刻至多一个 dialog。
12. 查看器必须：聚焦关闭按钮、Tab/Shift+Tab 在控件间循环、Esc/cancel 关闭、锁 body 滚动并在关闭时恢复、恢复触发元素焦点、销毁 panzoom/ResizeObserver/监听器。
13. 路由、语言、主题、源 `src/srcset/currentSrc` 替换或源元素移除时关闭活动视图；dispose 后停止增强新图片/图。
14. code group 的 tab strip 包进 `<form @submit.prevent>`，使搜索摘录复用的同名 radio 不共享组；MPA 输出无客户端处理器时注入 fallback 样式显示全部 command block 并隐藏 tab/copy。

**执行步骤。**

1. 新增增强时先写 SSR 降级（无 JS 可用）与客户端挂载后的行为。
2. 选择增强目标的最窄选择器，并列出排除条件；绝不移动/替换源节点。
3. 所有监听器/观察器/控制器挂在可 dispose 的生命周期上，路由与语言变化先 close 再 refresh。
4. 需要全屏时复用 `MediaViewer`，不新建第二套模态。
5. 为键盘、焦点恢复、Esc 与滚动锁写测试。
6. 图片必须有非空 alt 且独占段落；装饰图/链接图/需禁用的图用 `data-no-zoom` 或语义属性。

**完成信号（计划验证）。** SSR 输出静态链接；水合后出现按钮/菜单；两语言切换后旧请求被 abort；图片全屏 Tab 循环、Esc 关闭、焦点回到触发按钮、body 滚动恢复；Mermaid 原 SVG 不变；链接图/空 alt/role/aria/data-no-zoom 不出现按钮。

**失败与恢复。** 出现重复按钮/泄漏时检查 refresh/dispose 与 entries 清理，不要重载页面掩盖；剪贴板失败时引导用户用菜单 raw 链接手动复制。

**例外。** 没有 alt、未加载、失败或非独占段落的图片不增强；`data-no-zoom` 是显式退出；MPA 下没有 tab 交互，改为全部展示；clipboard 不可用时只提供查看链接。

**迁移设计。** 渐进增强 + 源节点不可变：SSR 给可用链接，客户端只加兄弟控件；所有资源有 owner 与 dispose；全站只保留一个模态宿主。

**源证据。**

- `deepseek-harness/website/.vitepress/theme/index.ts:1-53@687f282e`
- `deepseek-harness/website/.vitepress/code-groups.ts:1-34@687f282e`
- `deepseek-harness/website/.vitepress/config.ts:255-269@687f282e`
- `deepseek-harness/website/.vitepress/theme/image-viewer.ts:1-127@687f282e`
- `deepseek-harness/website/.vitepress/theme/mermaid-viewer.ts:1-98@687f282e`
- `deepseek-harness/website/.vitepress/theme/media-viewer.ts:1-232@687f282e`
- `deepseek-harness/website/.vitepress/theme/page-markdown-actions.ts:1-215@687f282e`
- `deepseek-harness/website/.vitepress/theme/code-group.css:1-10@687f282e`
- `deepseek-harness/website/AGENTS.md:19-23@687f282e`

**证据限制。** jsdom 无法验证原生 dialog 焦点陷阱、SVG 实际布局与真实剪贴板权限；增强依赖 VitePress 生成的 DOM 结构与 class，升级主题时需回归；未运行浏览器或测试。

---

<a id="user-and-publication-contracts.website-test-snapshot-contract"></a>

## 12. 网站测试与文件快照契约：双语言可访问标记作为金标

**何时读。** 修改主题组件、查看器或页面操作；新增网站测试或更新快照；CI 运行 `docs:check`；排查快照差异或 jsdom 与浏览器差异。

**源义务。**

1. 每个默认主题扩展都有对应 jsdom spec；文件顶部声明 `@vitest-environment jsdom`（页面操作 spec 用注释形式）。
2. 外部边界用 `vi.mock` 固定：`@panzoom/panzoom`、`vitepress/useData`/`useRoute`、`vitepress/theme`、查看器模块；测试不加载真实浏览器库。
3. 页面操作在 en-US 与 zh-CN 两种语言下各产出 static/actions/menu 文件快照；快照是 ARIA、文案与结构的金标，必须提交。
4. 快照比对使用 `toMatchFileSnapshot('./expected/<name>.<locale>.html')`，内容为 `host.innerHTML` 加换行；不得在断言中内联大段 HTML。
5. 测试覆盖失败路径：404/HTML/网络错误、缺失 `ClipboardItem`/clipboard、写拒绝、body 读取拒绝、投影错误抛出不吞。
6. 测试覆盖资源生命周期：路由/语言/卸载 abort 请求、查看器关闭销毁 panzoom 与 ResizeObserver、dispose 后不再增强。
7. `raw-markdown` spec 覆盖显式 raw、普通 raw、Vite 让渡（script/empty/style/image）、未发布 404、HEAD 无 body、`llms.txt`、畸形 URL、base 不匹配与投影错误。
8. `code-groups` spec 用 JSDOM 与 VitePress 原生 CSS 验证搜索摘录 radio 隔离与 MPA fallback 的 display。
9. `docs:check` 在 `docs:build` 之前运行这五个 spec（加两个 scripts spec）；它们不是可选检查。

**执行步骤。**

1. 新增/修改增强时先加或改 spec，明确 jsdom 环境与 mock 边界。
2. 为两种语言渲染并生成快照，审查差异是否都是有意变更。
3. 补失败路径与生命周期断言，避免只测 happy path。
4. 本地运行 `pnpm docs:check`，确认测试与构建均通过。
5. 快照变更随组件变更一起提交；不要为过测删除断言。

**完成信号（计划验证）。** 两 locale 的 static/actions/menu 快照与组件输出一致；删除请求 abort 或改变 `aria-disabled` 后测试失败；`docs:check` 依次跑网站 spec 并完成构建。

**失败与恢复。** 快照 diff 先判断是否为有意 UI/文案变更，再更新 expected；不得盲更新。jsdom 与浏览器不一致时补浏览器测试，而不是放宽断言。

**例外。** 浏览器原生行为由注释声明由浏览器检查覆盖；快照更新需人工审查，不能盲接。

**迁移设计。** 以文件快照锁定可访问标记，以显式 mock 隔离浏览器库，以失败路径与生命周期断言补足异步；把 spec 接进单一 `docs:check`。

**源证据。**

- `deepseek-harness/website/tests/code-groups.spec.ts:1-71@687f282e`
- `deepseek-harness/website/tests/image-viewer.spec.ts:1-350@687f282e`
- `deepseek-harness/website/tests/mermaid-viewer.spec.ts:1-274@687f282e`
- `deepseek-harness/website/tests/page-markdown-actions.spec.ts:1-415@687f282e`
- `deepseek-harness/website/tests/raw-markdown.spec.ts:1-83@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-actions.en-US.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-actions.zh-CN.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-menu.en-US.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-menu.zh-CN.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-static.en-US.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/page-markdown-static.zh-CN.html:1-1@687f282e`
- `deepseek-harness/website/tests/expected/image-viewer.en-US.html:1-3@687f282e`
- `deepseek-harness/website/tests/expected/image-viewer.zh-CN.html:1-3@687f282e`
- `deepseek-harness/package.json:134-137@687f282e`

**证据限制。** jsdom 不执行真实布局、原生模态或剪贴板权限；快照只覆盖被渲染的局部 HTML，不覆盖整站导航/构建产物；未运行测试。

---

<a id="user-and-publication-contracts.plugin-market-index-contract"></a>

## 13. 插件市场索引：发布格式、失败关闭与第三方信任边界

**何时读。** 发布或生成插件市场索引；添加索引源或安装市场版本；排查索引被整份拒绝、图标不显示或安装源不对；审计第三方市场信任。

**源义务。**

1. 索引是 UTF-8 JSON，默认最大 128 MiB，必须以 2xx 返回且不经过重定向。
2. `format` 必须为 `1`；`title` 必填，`description` 与 `metadata` 可选；未知成员被忽略。
3. `LocalizedText` 是字符串或以小写语言 id 为键的对象，对象必须含 `en`。
4. 插件 `name` 是 npm 包名且在索引内唯一；`versions` 至少一项，`version` 为精确 SemVer 且在插件内唯一，`publishTimestamp` 为 Unix 秒。
5. `source.type=npm` 可带 `registry`；`type=git` 必须是 `https` URL、40 位十六进制 commit、可选 `path`；安装形式分别为 `name@version` 与 `git+<url>.git#<commit>`（子目录加 `&path:/<path>`）。
6. `engines.dsh` 是 SemVer 范围，应与包自身 `engines.dsh` 一致；缺失时安装器改查 `@deepseek-ai/dsh*` peer 依赖。
7. `icon` 可为内联 `data:` URL（SVG/PNG/JPEG/WebP，≤32 KiB）或 URL；相对 icon 相对索引 URL 解析；跨 origin 的绝对 icon 必须用 `https`。
8. 索引源 URL 必须用 `http:` 或 `https:`，不得含用户名、密码或 `#` 片段；网络不受控时使用 `https`，因为 http 索引（含其列出的安装源）可被路径上任何人改写。
9. 任一条规则违反时 DSH 拒绝整份索引，并在索引源下显示原因与违规值的 JSON 路径。
10. 市场是第三方内容：DSH 只检查文件格式，不核实标题/描述/图标/作者/来源等声明；只添加可信源，并在确认弹窗核对安装源。
11. 安装必须经确认，并继续走正常插件安装的兼容性与注册表检查；卡片推荐最高兼容的非预发布版本，否则最高兼容预发布。
12. 参考生成器只下载/读取文件，不安装包、不执行代码；缓存在列表旁的 `.plugin-market-cache`，重复运行只取新版本/提交。

**执行步骤。**

1. 按格式写/生成 `index.json`：`format`、`title`、`plugins`、`versions`、`source`、可选 `engines`/`icon`/`metadata`。
2. 把索引与 `icons/` 一起放到静态主机，确保 2xx、无重定向、体积在限内。
3. 用 `https` 提供索引；相对 icon 与索引同目录；跨 origin icon 用 `https`。
4. 在 DSH 中添加索引源，确认错误面板无输出；浏览并核对卡片来源。
5. 安装前在确认弹窗核对 npm 包/registry 或 git repo/commit/path；安装后由正常兼容性检查兜底。
6. 用参考生成器时每行一个 npm 包或 https git URL，发布生成的 `index.json` 与 `icons/`。

**完成信号（计划验证）。** 合法索引被加载，相对 icon 解析为索引同目录 URL；安装确认显示来源；缺 format/缺 en/重复 name/version/非法 commit/超限 icon/含 userinfo 的 URL 使整份索引被拒并给 JSON 路径；重定向或非 2xx 失败。

**失败与恢复。** 索引被拒时按 JSON 路径修字段并重新发布；不要删除校验绕过。安装源可疑时取消确认并移除索引源，而不是安装后补救。

**例外。** 未知成员忽略；无 `engines.dsh` 时按 peer 依赖判断；市场可列出预发布版本；相对 icon 依赖索引 URL 解析。

**迁移设计。** 把索引当受校验的发布契约：宁可整份拒绝也不部分加载；把“内容未经核实”写在用户看到的位置；安装前强制展示来源。

**源证据。**

- `deepseek-harness/docs/user/guide/plugin-market.md:1-148@687f282e`

**证据限制。** 市场内容真实性、插件安全性与长期可用性不在 DSH 保证内；https 只保护传输，不能证明发布者身份；未运行索引校验或安装。

---

<a id="user-and-publication-contracts.third-party-mcp-contract"></a>

## 14. 第三方 MCP 集成：默认关闭、环境隔离与三步验证

**何时读。** 接入第三方记忆/工具 MCP 服务；通过 Creator mode 持久化 MCP 配置；排查 MCP 工具未出现、断线重连或秘密不可见。

**源义务。**

1. 三个记忆 MCP 配置是默认关闭的参考配置；不传 `--patch` 时三者都不存在。
2. 这些配置只是互操作示例，不构成 DeepSeek 的背书、推荐、合作或持续支持。
3. DSH 只解析 overlay、启动配置的 stdio 命令或连接 Streamable HTTP URL、发现工具并以 `mcp__<serverName>__<tool>` 暴露；不下载服务器、不初始化数据库、不选模型/embedding、不建云账号、不迁移数据、不监管独立 HTTP 服务。
4. stdio 子进程随 DSH 插件生命周期启停；HTTP 上游必须已运行。
5. stdio 桥接在启动前移除名称通常表示凭据的环境变量与全部 `DSH_*` 变量，其余环境继承；额外秘密写入行的 `config.env`，不直接写 YAML。
6. 示例固定测试版本与 commit；上游安装、身份、认证、模型、embedding、持久化与许可由提供方负责。
7. 用 `--patch` 传入单个 overlay，或把其单一 insert patch 合并进用户补丁层（profile 的 `cordis.patch.yml` 或 `$DSH_HOME/cordis.patch.yml`）；不要覆盖已有文件。
8. 可选共用模型指令是附加指导，不替换 DSH 的系统提示词人格。
9. 验证必须用唯一值且保持存储范围不变：会话 A 写入并确认工具成功；同一 Host 的新会话 B 不复制上下文，搜索/召回得到该值；会话 B 用该偏好完成任务。新 DSH 会话必需，Host 重启不必需。
10. 初始发现是异步的，先等 `mcp__...` 工具出现再发验证提示。
11. 崩溃的 MCP 子进程按退避自动重连并重新同步工具；重连预算耗尽后工具注销并停止重连，直到重载或重启。
12. Creator mode 的持久化配置写配置型 bundle 并用 `plugin_manager install_bundle` 安装；验证 `application: applied` 与实际工具调用，`restart-required` 表示尚未激活。

**执行步骤。**

1. 选择参考配置并按其上游前置条件安装固定版本。
2. 用 `--patch` 加载，或把 insert patch 合并进用户补丁层且不覆盖现有内容。
3. 需要额外秘密时写入 `config.env`；不要把令牌放进 YAML。
4. 等 `mcp__` 工具出现，按三步法验证写入、跨会话召回与使用。
5. 通过 Creator mode 持久化时读 patch、`install_bundle`，检查 `applied` 与真实调用。
6. 断线时等待退避重连；预算耗尽后重载/重启。

**完成信号（计划验证）。** 不传 `--patch` 时无工具；传后工具以 `mcp__<serverName>__<tool>` 出现；会话 A 写入的唯一值在新会话 B 可召回并使用；子进程无凭据类/`DSH_*` 变量，`config.env` 项存在。

**失败与恢复。** 工具未出现时等待异步发现并检查重连预算/上游进程，不要重复 patch；验证失败时保持存储范围不变并新建会话重试，避免把上下文复制当召回。

**例外。** 上游可在无 LLM/embedding 的本地启发式模式运行；搜索可能是子串匹配而非语义检索；共享模型指令可选。

**迁移设计。** 示例默认关闭 + 明确免责声明 + 环境过滤默认开启 + 可复现三步验证；秘密通道固定为 `config.env`。

**源证据。**

- `deepseek-harness/docs/user/guide/mcp-memory.md:1-101@687f282e`
- `deepseek-harness/docs/user/develop/practice/dynamic-cordis.md:1-15@687f282e`

**证据限制。** 第三方服务的安全、许可与数据实践不受 DSH 控制；三步验证依赖具体提供方工具名与存储范围；未运行 MCP 服务。

---

<a id="user-and-publication-contracts.isolated-runtime-profile"></a>

## 15. SDK 运行隔离：显式 home、fresh session 与危险默认

**何时读。** 用 Python SDK 嵌入 Harness；创建/隔离 DSH home、profile 或会话；评估 SDK 默认权限与数据上传；排查 SDK 读到错误 home 或 web profile 不可用。

**源义务。**

1. SDK 要求 Python 3.10+、Git 与受支持平台；安装包含匹配的原生运行时 wheel 与 `dsh` 命令，正常执行不需要系统 Node.js。
2. 示例必须显式传 `--workspace` 与 `--dsh-home`，且 SDK 绝不隐式读取 `~/.dsh`；选定的 home 接收生成的 `sdk-minimal` profile、已安装插件与 `sessions/` 下的未压缩 JSONL。
3. 需要隔离 profiles/plugins/credentials/settings/sessions 时使用全新 home；独立工作使用全新 session id；只有继续同一 durable 对话及其会话资源时才复用 harness/home/id。
4. `sdk-minimal` 的 bundle 在空根上插入完整树、不包含 `dsh-base`，因此 base 的工具不会隐式出现；它含 SDK 协议、环境配置的 DeepSeek 适配器、本地执行与持久化，缺文本文件工具、设置、托管凭据、OTel、Web 工具、子智能体与本地指令发现。
5. `session-log-deepseek` 默认随 DeepSeek 请求上传未接受的日志事件，每请求至多 `maxBytes`（8 MiB）；用 profile patch 的 `session-log-deepseek.enabled: false` 关闭。
6. `sdk-minimal` pin 了 `danger-full-access`：持久 shell 可修改运行时可见的任何路径；必须使用一次性 checkout 或容器。
7. 图片读取需要 image-capable route；自动压缩保留完整 Session 日志；SDK prompt 不执行 `/compact` 等 slash 命令。
8. 安装的 wheel 仍打包完整 web profile 与前端资产；需要浏览器应用时对显式 `DSH_HOME` 运行 `dsh web`；web 是独立 CLI 应用，不能服务 Python SDK 客户端。
9. 另一 profile 只有包含 `@deepseek-ai/dsh-sdk-app` 或另一 JSON-RPC server 行时才有效；缺 server 行、未解析插件或非法 patch 在启动时失败，不回退到其他组合。
10. `str_replace_editor` 默认不在 `sdk-minimal` 树中；用 insert patch 加入后下一次启动生效；本地文件系统提供方使用运行时工作目录解析相对路径，且不像 minimal shell 那样限制在该目录内。

**执行步骤。**

1. 创建隔离 workspace 与空 DSH home，安装 SDK 并运行 `minimal.py` 示例。
2. 确认 home 下生成 `sdk-minimal` profile、插件与 `sessions/` JSONL，且未读取 `~/.dsh`。
3. 在程序中用 `DeepSeekHarness(provider/model/cwd/dsh_home/profile)` 并管理 context 生命周期。
4. 按需用 `dsh plugin` 安装 bundle，或把 patches 作为每次启动覆盖；敏感场景关闭 `session-log-deepseek` 上传。
5. 把 `danger-full-access` 视为不可信执行：使用一次性 checkout/容器，限制可写路径。
6. 需要 `str_replace_editor` 时加 insert patch 并理解其相对路径与无目录限制语义。
7. 需要 Web UI 时单独对显式 home 运行 `dsh web`，不假设 SDK 能服务它。

**完成信号（计划验证）。** home 下出现 profile/插件/sessions，未创建或读取 `~/.dsh`；同 context 多次 run 复用进程，不同 session 互不串话；错误 profile 启动失败不回退；未加 patch 时无 `str_replace_editor`；关闭日志上传后请求不含日志事件。

**失败与恢复。** SDK 读到错误状态时检查传入的 `dsh_home`/`profile`，不要依赖进程环境；隔离问题换新 home 与新 session id；权限过大时改用一次性 checkout/容器或自定义 profile。

**例外。** 正常 SDK 执行不需要系统 Node.js；管理插件需要 pnpm；image 读取依赖 image-capable route；web profile 与 SDK 客户端是不同应用。

**迁移设计。** 把隔离做成 API 必填项而非默认值：没有显式 home 就失败；示例与文档同时暴露危险默认（full access、日志上传）并给出关闭方法。

**源证据。**

- `deepseek-harness/docs/user/guide/python-sdk.md:1-185@687f282e`

**证据限制。** 权限与上传默认由 bundle 决定，示例不自证安全；平台/原生 wheel 兼容性未验证；未安装或运行 SDK。

---

<a id="migration-order"></a>

## 16. 迁移落地顺序

### 16.1 新项目（从零建立发布面）

1. **先定事实所有者。** 内容在 `docs/`，发布清单在站点子树，构建产物只写被 gitignore 的生成目录。对应 §8/§10。
2. **再建构建包含性。** 在写任何页面之前实现“清理前校验目标是站点根子路径”的库函数，并让生成器在配置解析钩子里调用。对应 §9。
3. **建发布清单与投影。** 一份 `DocsPage` 清单驱动页面、侧栏、导航、raw 与 `llms.txt`；缺 section/空集合/缺 `editSource` 直接失败。对应 §8。
4. **接入门禁。** `docs:check = 网站布局/投影/行为 spec + 构建`；新增 `.md` 到站点子树必须失败。对应 §10/§12。
5. **最后加交互。** 先有 SSR 静态链接，再加客户端增强；所有增强共享一个模态宿主并实现 dispose。对应 §11。
6. **部署文档与安全边界。** 公网发布、代理、凭据、插件安装、SDK 隔离分别有独立检查项。对应 §1/§2/§3/§4/§15。

### 16.2 既有项目（补齐已有站点/插件生态）

1. 清点所有发布页与 raw/llms 来源，建立“route → source → locale → sidebar/section”表；把复制进站点树的 Markdown 迁回内容层。§8/§10。
2. 为构建清理加包含性校验与四种拒绝用例（根、外部、junction、链接父目录）。§9。
3. 为每个主题增强补 jsdom spec 与双语言文件快照；把失败路径与 abort/dispose 断言补上。§11/§12。
4. 把插件分发改成 bundle/profile 双 manifest；给 `--dump-config` 加层序验证；git 安装改为固定 commit + 显式 `allowBuilds` 或预构建物。§4。
5. 凭据入口改成只写 + credential reference；MCP 秘密迁到 `config.env`；加一次子进程环境审计。§3/§14。
6. 公网部署补齐公告/准入分离、代理五项与 TLS 失败关闭；用伪造 Host 做拒绝测试。§1。
7. 代理与 SDK 部署补齐变量来源、直连例外、显式 home 与新 session 验证。§2/§15。

### 16.3 发布前最低证据包

- 一份伪造 Host 的 403 记录与一份受信 authority 的成功记录（§1）。
- 一份 `--dump-config` 层序输出与一次 `remove` 后层消失记录（§4）。
- 一份非法 config `FAILED` 与一份卸载后资源释放记录（§5）。
- 一份 `docs:check` 全绿输出；一份新增 `website/*.md` 被拒记录（§10/§12）。
- 一份未发布 raw 404、一份脚本 `.md` 让渡 Vite 的记录（§8）。
- 一份索引违规的 JSON 路径错误、一份安装确认展示来源的记录（§13）。
- 一份 MCP 跨会话唯一值召回记录与子进程环境缺失凭据变量的记录（§14）。
- 一份 SDK 新 home 未读取 `~/.dsh`、关闭日志上传后的请求记录（§15）。

---

<a id="cross-domain"></a>

## 17. 跨域边界

- **documentation 域**拥有站点发布清单/投影、raw+llms 生成与 `docs:check` 组合的规范化细节；本域记录同一文件时只保留发布面、构建包含性与内容所有权视角。其覆盖见 `research/documentation-coverage.json`。
- **engineering 域**拥有 effect/ownership、注册生命周期与可选服务访问的规范化机制；本域的 Cordis 教程记录只保留“可运行、无密钥、展示失败”的教学义务。其覆盖见 `research/engineering-coverage.json`。
- **collaboration 域**拥有 GitHub review webhook 的会话工作流治理，并已把 `docs/user/guide/github-review.md` 判为 non-governance；本域沿用该分类，不重复提取。其覆盖见 `research/collaboration-coverage.json`。
- 本域不声称拥有插件市场/依赖供应链的完整安全机制；`plugin-market` 页在这里只作为“索引格式 + 第三方信任边界”的用户契约。

---

<a id="evidence-limits"></a>

## 18. 未决与证据限制

1. **中文正文语义未逐段对照。** 28 个中文对侧页只读标题/切换/首段结构，`public-deployments.zh.md` 全读；其余正文以英文为机制证据。逐 heading 哈希由 documentation 域门禁保证，但哈希一致不等于语义一致。
2. **浏览器原生行为未验证。** 原生 dialog 焦点陷阱、SVG 实际布局、真实剪贴板权限不在 jsdom 覆盖内；本参考不宣称这些行为已通过。
3. **构建/测试/门禁未执行。** 任务合同禁止构建、测试、安装、网络与格式化；所有完成信号均为计划验证。
4. **`docs/user/guide/quickstart.md` 不在本分片。** 它被首页与静态快照引用，但当前 corpus 没有它的 inspected 记录；应由 documentation 域补读或在 source-disposition 中显式保留。
5. **超长源行已补读。** 所有超过 768 字符的源行（含 `expected/*.html` 单行快照）均已用 `:raw` 逐行重读，覆盖记录标注了行号；快照语义仍以生成它们的 spec 为准。
6. **代理/证书/SDK 平台矩阵未实测。** 代理变量继承、TLS 拦截、原生 wheel 兼容性依赖真实环境；不要把本参考的步骤当成已验证的跨平台承诺。
