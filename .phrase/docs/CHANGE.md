# 变更总索引 (CHANGE.md)

> **状态**：[权威/现行]
> **更新规则**：每次完成 Phase 任务或阶段流转时，必须在本文件顶部同步更新。

---

## 🚀 当前进行阶段 (Active Phase)

- **阶段标识**：`phase-tools-integration-20260901`
- **阶段目标**：智能工牌制作工作台与转班提醒小助手全栈融合 (Next.js 16 + React 19 + TypeScript 5)
- **阶段目录**：[.phrase/phases/phase-tools-integration-20260901/](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-tools-integration-20260901/)
- **当前任务**：[task_tools_integration.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-tools-integration-20260901/task_tools_integration.md)
- **阶段变更**：[change_tools_integration.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-tools-integration-20260901/change_tools_integration.md)

---

## 📜 历史阶段回溯索引 (Phase History)

| 阶段目录 | 阶段目标 | 启动日期 | 结项日期 | 状态 | 详情链接 |
| --- | --- | --- | --- | --- | --- |
| `phase-tools-integration-20260901` | 智能工牌制作工作台与转班提醒小助手全栈融合 | 2026-09-01 | 进行中 | 进行中 | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-tools-integration-20260901/) |
| `phase-weekly-report-20260830` | 海铭德系统使用情况周报自动总结与企微推送 | 2026-08-30 | 2026-09-01 | 已结项 | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-weekly-report-20260830/) |
| `phase-scaffolding-20260824` | 落地 Doc-Driven 项目管理脚手架 | 2026-08-24 | 2026-08-30 | 已结项 | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-scaffolding-20260824/) |

---

## 📝 最近任务变更概览 (Recent Tasks)

- **2026-09-01** `[task014]`：集成工作台主页导航与快捷入口，加固生产构建（`npm run build`）与全量单测（`npm test`），完成 Phase 闭环验收。
- **2026-09-01** `[task013]`：开发工牌制作前端画布与 A4 拼版打印系统（`/badge` 页面、BadgeCard、A4PrintSheet、QRCodeSVG）及单测。
- **2026-09-01** `[task012]`：开发工牌制作核心模块（数据结构、Excel 批量解析、员工数据转换、模板导出）并配齐 100% 通过的 Jest 单测。
- **2026-09-01** `[task011]`：开发转班小助手前端管理看板（`/shifts` 页面、排班表格、增删改/配置弹窗、企微测试推送）及单测。
- **2026-09-01** `[task010]`：实现转班小助手 Server Actions、持久化与系统 08:00 定时任务（`src/lib/cron.ts`）集成及单测。
- **2026-09-01** `[task009]`：开发转班小助手核心算法模块（自愈推算、班次翻转、企微 Markdown 消息构建）并配齐 100% 通过的 Jest 单测。
- **2026-09-01** `[task008]`：初始化 `phase-tools-integration-20260901` 阶段文档集（`spec_*`, `plan_*`, `task_*`, `change_*`）并更新项目研发总索引。
- **2026-08-30** `[task007]`：集成工作台主页导航与快捷入口，加固生产环境构建（`npm run build`）与全量单测（`npm test`），完成 Phase 结项验收准备。
- **2026-08-30** `[task006]`：开发周报工作台前端页面与组件（多文件拖拽、数据透视、Recharts 图表、手写表单、预览与一键推送弹窗）及单测。
- **2026-08-30** `[task005]`：实现周报持久化、历史基准拉取、企微群机器人 Webhook 推送 Actions 与单测。
- **2026-08-30** `[task004]`：开发周报核心纯函数库（特征识别、Excel 解析、部门归一、指标与环比计算、周报文本生成）并配齐 100% 通过的 Jest 单测。
- **2026-08-30** `[task003]`：在 `prisma/schema.prisma` 中新增 `WeeklyReport` 模型并升级 `@prisma/client` 类型定义。
- **2026-08-30** `[task002]`：初始化 `phase-weekly-report-20260830` 阶段文档集（`spec_*`, `plan_*`, `task_*`, `change_*`）并更新项目研发总索引。
- **2026-08-24** `[task001]`：完成跨 Agent 规则库（`.agents/rules/`、`.cursor/rules/`）、`.phrase/` 研发管理体系以及 `docs/` 业务文档总索引与优雅归档治理。
