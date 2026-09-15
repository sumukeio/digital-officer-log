# 变更总索引 (CHANGE.md)

> **状态**：[权威/现行]
> **更新规则**：每次完成 Phase 任务或阶段流转时，必须在本文件顶部同步更新。

---

## 🚀 当前进行阶段 (Active Phase)

- **阶段标识**：`phase-headline-brief-20260912`
- **阶段目标**：头条「问题—改善—收益」精简周简报（粘贴提炼、企微短文、海报、指标联动）
- **阶段目录**：[.phrase/phases/phase-headline-brief-20260912/](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-headline-brief-20260912/)
- **当前任务**：[task_headline_brief.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-headline-brief-20260912/task_headline_brief.md)
- **阶段变更**：[change_headline_brief.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-headline-brief-20260912/change_headline_brief.md)

---

## 📜 历史阶段回溯索引 (Phase History)

| 阶段目录 | 阶段目标 | 启动日期 | 结项日期 | 状态 | 详情链接 |
| --- | --- | --- | --- | --- | --- |
| `phase-headline-brief-20260912` | 头条问题—改善—收益精简周简报 | 2026-09-12 | 进行中 | 进行中 | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-headline-brief-20260912/) |
| `phase-tools-integration-20260901` | 智能工牌制作工作台与转班提醒小助手全栈融合 | 2026-09-01 | 进行中* | 进行中* | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-tools-integration-20260901/) |
| `phase-weekly-report-20260830` | 海铭德系统使用情况周报自动总结与企微推送 | 2026-08-30 | 2026-09-01 | 已结项 | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-weekly-report-20260830/) |
| `phase-scaffolding-20260824` | 落地 Doc-Driven 项目管理脚手架 | 2026-08-24 | 2026-08-30 | 已结项 | [查看阶段](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/phases/phase-scaffolding-20260824/) |

> \* `phase-tools-integration-20260901` 任务已全部完成，本阶段切换后以其为历史并行参考；未经人类结项确认不擅自 DONE 重命名。

---

## 📝 最近任务变更概览 (Recent Tasks)

- **2026-09-15** `issue007`：PM2 `start:bt` 无 `.next` 生产构建 — 文档落盘 + `ensure-production-build` 启动门禁。
- **2026-09-15**：文档迁移 — `docs/rcfs/问题与解决.md` 全文并入 `.phrase/docs/ISSUES.md`（issue002–issue006 索引），原文件已删。
- **2026-09-15** `[task021]`：工牌对齐参考工具（issue001）— 标准 QR+Logo、空列表、去载入数字官、PDF 导出（`phase-tools-integration-20260901`）。
- **2026-09-12** `[task015–task020]`：头条周简报全栈落地（Schema、规则提炼、Actions、工作台、海报、指标联动、文档闭环）。
- **2026-09-12** `[task015]`：初始化 `phase-headline-brief-20260912` 阶段文档集并更新项目研发总索引。
- **2026-09-01** `[task014]`：集成工作台主页导航与快捷入口，加固生产构建（`npm run build`）与全量单测（`npm test`），完成 Phase 闭环验收。
- **2026-09-01** `[task013]`：开发工牌制作前端画布与 A4 拼版打印系统（`/badge` 页面、BadgeCard、A4PrintSheet、QRCodeSVG）及单测。
- **2026-09-01** `[task012]`：开发工牌制作核心模块（数据结构、Excel 批量解析、员工数据转换、模板导出）并配齐 100% 通过的 Jest 单测。
- **2026-09-01** `[task011]`：开发转班小助手前端管理看板（`/shifts` 页面、排班表格、增删改/配置弹窗、企微测试推送）及单测。
- **2026-09-01** `[task010]`：实现转班小助手 Server Actions、持久化与系统 08:00 定时任务（`src/lib/cron.ts`）集成及单测。
- **2026-09-01** `[task009]`：开发转班小助手核心算法模块（自愈推算、班次翻转、企微 Markdown 消息构建）并配齐 100% 通过的 Jest 单测。
- **2026-09-01** `[task008]`：初始化 `phase-tools-integration-20260901` 阶段文档集（`spec_*`, `plan_*`, `task_*`, `change_*`）并更新项目研发总索引。
