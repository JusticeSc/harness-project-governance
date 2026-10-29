# Task-board demonstration

[中文](#中文)

This is the actual application used by `npm run demo`, not a fake checker response. It returns unfinished task titles in input order. Run its acceptance checks from the repository root:

```bash
node --test examples/task-board/board.test.mjs
```

The full demo copies these two files into a temporary consumer, initializes `.governance/`, records the requirement and project facts, runs these checks, deliberately breaks the feature, observes rejection, restores it and reads the persisted handoff from a fresh process. The temporary consumer is then removed; these source files remain unchanged.

The script makes the edits explicitly. It does not demonstrate autonomous Agent reasoning, install CI, or configure remote protection. A populated `status` report is metadata readiness, not proof that checks were executed.

## 中文

这里是 `npm run demo` 实际使用的小应用和验收测试，不是模拟检查器输出。功能是按原顺序返回未完成任务的标题。

完整演示会把它们复制到临时项目，建立 `.governance/`，写入需求、验收与项目事实，运行真实测试，故意破坏功能并观察失败，再恢复并由新进程读取交接状态。演示后删除临时项目，不改这里的源码。

这证明的是可执行流程，不是 Agent 自主采用或远端门禁。`status` 只检查元数据是否填齐，测试是否执行须由独立的实际命令证明。
