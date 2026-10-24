# [任务清单] task_headline_brief.md — 阶段原子任务跟踪

> **阶段标识**：`phase-headline-brief-20260912`  
> **任务推进原则**：三位递增（接续全局 task015 起），每任务验证后闭环回写。

---

## 任务拆解与状态

- [x] **`task015`**: 初始化 `phase-headline-brief-20260912` 阶段文档集并更新项目索引
  - **状态**：已完成 (Pass)

- [x] **`task016`**: Schema 扩展与核心纯函数库（提炼/Markdown/校验/指标骨架/海报布局）
  - **产出**：`prisma/schema.prisma`、`src/lib/headline-brief/*`、`src/__tests__/lib/headline-brief.test.ts`
  - **验证**：`npx prisma generate`；相关单测通过
  - **状态**：已完成 (Pass)

- [x] **`task017`**: Server Actions（存档、查询、企微推送、指标骨架）
  - **产出**：`src/app/actions/headline-brief.ts`、`src/__tests__/actions/headline-brief.test.ts`
  - **验证**：Actions 单测全绿
  - **状态**：已完成 (Pass)

- [x] **`task018`**: 头条周简报工作台 MVP 前端与导航入口
  - **产出**：`/headline-brief` 页面与组件；Dashboard 入口
  - **验证**：组件单测通过
  - **状态**：已完成 (Pass)

- [x] **`task019`**: 一页竖版海报 PNG 导出
  - **产出**：`poster.ts`、`PosterExport.tsx`
  - **验证**：海报布局纯函数单测通过
  - **状态**：已完成 (Pass)

- [x] **`task020`**: 与 WeeklyReport 指标联动 + 全量验证与文档闭环
  - **产出**：指标骨架接入 UI；guide/CHANGELOG/模块全景更新
  - **验证**：`npm test` + `npm run build`
  - **状态**：已完成 (Pass)
