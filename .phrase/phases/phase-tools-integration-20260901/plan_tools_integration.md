# [阶段计划] plan_tools_integration.md — 智能工牌制作与转班提醒小助手实施计划

> **阶段标识**：`phase-tools-integration-20260901`  
> **所属版本**：v0.3.0  
> **状态**：[权威/现行]

---

## 一、架构设计与边界

```
Next.js 全栈应用架构 (digital-officer-log)
├── src/lib/shifts/                  # 转班助手核心算法与企微推送模块 (纯函数)
│    ├── types.ts                    # 数据契约类型定义
│    ├── shift-algorithm.ts          # 自愈推算、班次翻转与状态推导
│    └── wecom-notifier.ts           # 企微 Markdown 消息组装与 Webhook 调用
├── src/app/actions/shifts.ts        # 转班小助手 Server Actions
├── src/app/shifts/                  # 转班小助手前端界面
│    ├── page.tsx                    # 服务端页面接入与鉴权
│    └── shift-client.tsx            # 排班状态看板、CRUD 弹窗、即时推送
├── src/lib/badge/                   # 工牌制作核心模块
│    ├── types.ts                    # 工牌模板与人员数据类型
│    ├── excel-importer.ts           # Excel 批量解析与模板生成
│    └── layout-calculator.ts        # A4 拼版与毫米网格计算
├── src/app/badge/                   # 工牌制作工作台前端界面
│    ├── page.tsx                    # 服务端页面接入
│    ├── badge-client.tsx            # 数据表格、卡片预览与打印控制
│    └── components/
│         ├── BadgeCard.tsx          # 1:1 矢量工牌卡片 (含 SVG/Canvas 二维码)
│         └── A4PrintSheet.tsx       # A4 拼版打印页 (带裁切辅助线)
└── src/lib/cron.ts                  # 定时任务统一调度 (每天 08:00 转班扫描)
```

---

## 二、里程碑计划与任务拆解

- **Milestone 1: 阶段初始化与规范对齐 (Task 008)**
  - 建立阶段文档库，更新 `CHANGE.md`。
- **Milestone 2: 转班助手核心算法与单测 (Task 009)**
  - TypeScript 重构自愈与翻转算法，实现企微 Markdown 组装，100% Jest 单测覆盖。
- **Milestone 3: 转班助手 Server Actions 与定时任务 (Task 010)**
  - 数据库持久化/配置管理，接入 `src/lib/cron.ts`，配套 Actions 单测。
- **Milestone 4: 转班助手前端交互看板 (Task 011)**
  - 搭建 `/shifts` 页面，实现倒计时看板、增删改查与测试推送。
- **Milestone 5: 工牌制作核心解析与单测 (Task 012)**
  - 实现 Excel 批量导入、模板导出与系统人员同步，配套单测。
- **Milestone 6: 工牌制作工作台前端与 A4 高清打印 (Task 013)**
  - 搭建 `/badge` 页面，实现 1:1 实时预览与高精 A4 拼版打印。
- **Milestone 7: 全局导航入口与全流程构建闭环 (Task 014)**
  - 顶部导航栏挂载入口，执行 `npm test` 全量通过与 `npm run build` 成功。

---

## 三、风险与应对

1. **二维码离线生成与清晰度**：使用矢量 SVG / 高分辨率 Canvas 绘制，避免打印发虚。
2. **打印页边距与浏览器兼容**：使用严格毫米（`mm`）单位与 CSS `@page` 分页规则，保证 A4 打印尺寸 1:1。
3. **时区与跨日推算**：严格使用标准时区与日期格式化函数，避免由于时区偏移导致的转班判定错误。
