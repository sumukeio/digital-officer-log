# [变更回溯] change_<purpose>.md — 阶段任务变更日志

> **阶段标识**：`phase-<purpose>-<YYYYMMDD>`  
> **记录原则**：时间倒序，记录每个 `taskNNN` 的实质变动、验证凭据与影响面。

---

## 变更流水记录

### [YYYY-MM-DD] `[taskNNN]` [任务名称简述]

- **任务编号**：`taskNNN`
- **执行时间**：YYYY-MM-DD HH:MM
- **改动文件清单**：
  - `[NEW]` `path/to/new-file.ts`
  - `[MODIFY]` `path/to/modified-file.ts`
  - `[DELETE]` `path/to/deleted-file.ts`
- **核心逻辑说明**：
  - 简述实现的业务或技术逻辑。
- **验证凭据 (Verification Evidence)**：
  - 运行命令：`npm test`
  - 输出结果摘要：`Pass ... tests`
- **关联文档更新**：
  - 已同步更新 `docs/CHANGELOG.md`
  - 已同步更新 `docs/guide/...`
