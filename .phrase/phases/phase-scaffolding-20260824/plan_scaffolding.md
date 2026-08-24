# [阶段计划] plan_scaffolding.md — 脚手架建设与文档治理实施计划

> **阶段标识**：`phase-scaffolding-20260824`  
> **状态**：[进行中]  
> **责任 Agent**：Antigravity Agent  

---

## 一、阶段里程碑计划 (Milestones)

| 里程碑 | 关键产出 | 预期完成时间 | 对应 Task 范围 | 状态 |
| --- | --- | --- | --- | --- |
| M1: 规则与主干规范 | `.agents/rules/`、`.cursor/rules/`、`AGENTS.md` 补全 | 2026-08-24 | `task001` | 已完成 |
| M2: .phrase 体系与模板 | `.phrase/docs/`、`.phrase/templates/`、active phase | 2026-08-24 | `task001` | 进行中 |
| M3: docs 体系与既有文档治理 | `docs/README.md`、`docs/CHANGELOG.md`、`docs/guide/`、`README.md` | 2026-08-24 | `task001` | 进行中 |
| M4: 验证与闭环交付 | `npm test` 自动化验证，出具报告并刹车等待 | 2026-08-24 | `task001` | 待验证 |

---

## 二、架构边界与实施规则

1. **零业务代码修改**：仅新增/调整规范、脚手架、索引与说明文档。
2. **单一事实来源**：`AGENTS.md` 为最高仲裁基准，`docs/README.md` 为业务文档总路由。
3. **优雅归档**：历史文档保留原始内容上下文，仅增加状态头部并归入 `docs/guide/` 或 `docs/archive/`。
