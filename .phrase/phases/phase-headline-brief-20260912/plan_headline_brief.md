# [里程碑计划] plan_headline_brief.md — 头条周简报落地计划

> **阶段标识**：`phase-headline-brief-20260912`  
> **权威状态**：[权威/现行]  
> **最后更新**：2026-09-12

---

## 1. 里程碑

| 里程碑 | 内容 | 对应任务 |
| --- | --- | --- |
| M0 文档门禁 | 初始化 phase 文档与索引 | task015 |
| M1 Schema + 核心库 | HeadlineBrief 模型、规则提炼、Markdown、校验、指标骨架 | task016 |
| M2 Actions | 存档、按周查询、企微推送、指标骨架拉取 | task017 |
| M3 工作台 MVP | `/headline-brief` 粘贴编辑预览推送存档 + 导航 | task018 |
| M4 海报 | Canvas 一页竖版 PNG 下载 | task019 |
| M5 指标联动与闭环 | 从 WeeklyReport.metrics 生成问题骨架 + 文档闭环 | task020 |

## 2. 架构边界

- **数据**：新建 `HeadlineBrief`（按 year/weekNumber/user 存档，modules JSON）。
- **纯函数**：`src/lib/headline-brief/*`（可单测）。
- **Actions**：`src/app/actions/headline-brief.ts`；Webhook 复用周报配置键 `WECOM_WEBHOOK_URL`。
- **UI**：`src/app/headline-brief/*` + `src/components/headline-brief/*`。

## 3. 风险

| 风险 | 缓解 |
| --- | --- |
| DeepSeek 标题格式漂移 | 多模式标题正则 + 人工改稿兜底 |
| 企微 Markdown 过长被截断 | 硬上限校验 + 分模块推送开关 |
| 海报中文换行 | Canvas 自绘换行算法 + 单测对文本布局纯函数 |

## 4. Rollback

删除路由入口与 `HeadlineBrief` 表不影响指标周报；Webhook 配置共用不变。
