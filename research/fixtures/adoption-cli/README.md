# 独立采用实验的可复现消费项目

这是用户授权新建的本地任务清单项目的公开代码快照，用来让审阅者实际运行应用和黑盒验收，而不是只能读取本机报告。公开版本以本目录为代码归属；原工作区中的独立消费仓库只保留为历史实验载体，不要求克隆或同步它。

## 运行

需要 Node.js >=22.19.0，不需要安装依赖、凭据或治理 Skill。

从本仓库根目录执行：

```bash
npm --prefix research/fixtures/adoption-cli test
```

也可以进入本目录运行工具：

```bash
node bin/tasks.mjs add "写周报"
node bin/tasks.mjs list
node bin/tasks.mjs done 1
node bin/tasks.mjs reopen 1
node bin/tasks.mjs list --all
```

默认数据文件为当前工作目录的 `tasks.json`，也可以用 `TASKS_FILE` 指定；不要把重要数据用于实验。工具是单进程本地用途，无网络、同步、服务端或并发写保证。测试使用独立临时目录，不修改上述实际运行数据。

## 能复现与不能复现的内容

- [CONTRACT.md](CONTRACT.md) 给出应用行为；`bin/` 与 `test/` 保留经验证的代码和独立黑盒断言。
- [observations.json](observations.json) 及 [evidence/](evidence/) 保留当时的首跑失败、修复后回归、接续验收和直接 CLI 观察。日志仅替换绝对本机路径并移除内部 artifact 链接，没有改断言或把失败改成通过。
- `npm test` 重新运行的是应用契约，不会重新启动模型会话。独立执行者如何读取 Skill、拒绝撤销动作等是已记录的有界观察，不能由测试通过推导出普遍保证或因果收益。
- 初始需求、owner、`npm test`、CI 以及 Skill 安装由协调者预置。本目录不携带 `.agents/`、嵌套 `.git`、私有状态文件、探针或完整会话。
- 工作流文件、保留的本地输出和当前 PR 的 CI 状态分别是不同证据；远端 required check 与生产采用没有在该实验中验证。

需要审查完整实验过程与保证边界时，见仓库根 [METHODS.zh.md 第 11 节](../../../METHODS.zh.md#11-持久测试项目中的独立执行与接续)。
