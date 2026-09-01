# 仓库全量历史变更日志 (CHANGELOG.md)

> **权威性声明**：本文档遵循 Keep a Changelog 格式规范，**只追加、不覆盖**。
> **维护规则**：每次完成 Phase 任务或重要工程/业务交付时，在此以标准格式追加最新记录。

---

## [2026-09-01] - 企业微信日报定时催报可视化管理中心落地

### 运维与配置管理
- **系统设置中心 (`src/app/admin/system/`)**：
  - 在系统配置页面中新增「🔔 企业微信日报定时催报管理」控制卡片；
  - **定时推送总开关**：一键开启/停用自动催报，停用后后台定时任务彻底跳过；
  - **动态推送时间设置**：可视化选择每天推送时间（如 18:00），分钟级巡检机制，后台修改后无需重启服务器立即生效；
  - **Markdown 模板自定义与变量插槽**：支持自由修改推送文案，内置 `{date}`、`{count}`、`{url}` 动态变量替换；
  - **独立 Webhook 与一键测试**：支持指定专属 Webhook，提供「立即测试发送到群」按钮实时验证群消息效果。
- **自动化测试 (`src/__tests__/lib/daily-reminder.test.ts`)**：
  - 新增 4 个单元测试用例，覆盖开关控制、变量替换、测试模式前缀与 Server Action 持久化；
  - 执行 `npm test`，全量 14 个测试套件 103 个测试用例 100% 绿色通过。

---

## [2026-09-01] - 万得福工牌设计器 2.0 自由坐标参数系统重构

### 前端画布与设计器升级
- **设计器控制面板 (`src/app/badge/badge-client.tsx`)**：
  - 100% 对齐原 Python 版（`app.py`）600x1000 坐标系统与万得福出厂满意预设；
  - 提供左上角 Logo（X/Y/Size/图片替换）、公司标志（X/Y/高/字标替换）、右上角二维码（X/Y/Size）、照片框（X/Y/宽/高）、底部中英文字与下划线（起始Y/行距/标签X/数值X/数值宽/字号）全套自由滑动条；
  - 新增「🔒 设计已锁定 / 🔓 自由编辑模式」切换开关，防止日常操作误触；
  - 新增「↺ 恢复默认参数」按钮与 `localStorage` 本地参数持久化记忆。
- **高保真卡片与打印 (`src/components/badge/`)**：
  - [BadgeCard.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/badge/BadgeCard.tsx)：重构为基于 600x1000 相对缩放的纯白卡片与两端对齐带下划线经典排版；
  - [A4PrintSheet.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/badge/A4PrintSheet.tsx)：支持 3x3 经典拼版网格与毫米级裁切十字线输出。
- **自动化测试**：
  - 运行 `npm test`：13 个测试套件 99 个用例 100% 绿色通过；
  - 运行 `next build`：生产编译成功，0 错误 0 警告。

---

## [2026-09-01] - 全局导航入口集成、生产环境全量构建与 Phase 闭环 (`task014`)

### 导航与入口
- **工作台主页导航 (`src/app/dashboard-client.tsx`)**：
  - 顶部导航栏添加「转班提醒」（`/shifts`）与「工牌生成」（`/badge`）快捷 Tab；
  - 移动端浮动操作区同步增加对应图标入口。

### 文档与全量构建
- **文档更新**：
  - [docs/guide/project-modules-and-features.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/project-modules-and-features.md)：追加转班提醒小助手与智能工牌制作工作台业务全景说明。
- **全量测试与构建验证**：
  - 运行 `npm test`：13 个测试套件 99 个测试用例 100% 绿色通过；
  - 运行 `npm run build`：触发 `prisma generate` 及 Next.js 严格生产编译，全部 19 个路由页面编译成功，0 错误 0 警告。

---

## [2026-09-01] - 工牌制作前端画布与 A4 拼版打印系统落地 (`task013`)

### 前端页面与打印排版
- **工牌制作工作台 (`src/app/badge/` 与 `src/components/badge/`)**：
  - [QRCodeSVG.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/badge/QRCodeSVG.tsx)：实现轻量纯前端矢量二维码点阵生成器，保证任意放大与高精打印不失真；
  - [BadgeCard.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/badge/BadgeCard.tsx)：实现 1:1 标准工牌卡片（企业 Logo Header、员工照片框、两端对齐带下划线字段、防伪编码与二维码）；
  - [A4PrintSheet.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/badge/A4PrintSheet.tsx)：实现 A4 多页拼版网格（2列×4行），渲染四角裁切对齐辅助线与 CSS `@media print` 打印规范；
  - [badge-client.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/app/badge/badge-client.tsx)：实现 Excel 批量拖拽导入、模板下载、系统数字官一键载入、单条快速添加、多选勾选与实时 1:1 缩放预览。
- **自动化测试 (`src/__tests__/components/BadgePage.test.tsx`)**：
  - 新增 5 个组件测试用例，覆盖单卡渲染、A4 拼版、表格勾选、单条录入与配置弹窗；
  - 执行 `npm test`，全量 13 个测试套件 99 个测试用例 100% 绿色通过。

---

## [2026-09-01] - 工牌制作核心解析模块与数据转换落地 (`task012`)

### 核心模型与数据解析
- **工牌核心纯函数库 (`src/lib/badge/`)**：
  - [types.ts](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/lib/badge/types.ts)：定义工牌实体数据模型（`BadgeItem`）、工牌模板配置（`BadgeTemplateConfig`）与标准示例数据；
  - [excel-importer.ts](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/lib/badge/excel-importer.ts)：实现 Excel 批量数据导入与多表头模糊适配（`parseBadgeExcel`）、标准模板生成（`generateBadgeExcelTemplate`）以及系统数字官用户一键转工牌实体（`convertUsersToBadges`）。
- **自动化测试 (`src/__tests__/lib/badge.test.ts`)**：
  - 新增 6 个单元测试用例，覆盖日期格式化、Excel 导入导出双向解析校验与用户模型映射；
  - 执行 `npm test`，全量 12 个测试套件 94 个测试用例 100% 绿色通过。

---

## [2026-09-01] - 转班小助手前端管理看板与交互组件落地 (`task011`)

### 前端页面与交互体验
- **转班小助手看板 (`src/app/shifts/`)**：
  - [page.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/app/shifts/page.tsx)：实现服务端页面渲染与初始数据预加载；
  - [shift-client.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/app/shifts/shift-client.tsx)：构建完整的响应式管理控制台，包含今日/明日/在册统计卡片、明日转班重点预警横幅、白夜班颜色徽章（☀️/🌙）、排班表格以及新增/编辑 Dialog 弹窗与企微配置 Dialog 弹窗；
  - **企微卡片实时预览**：支持在弹窗中渲染 Markdown 原生样式，并提供一键复制与测试发送至群。
- **自动化测试 (`src/__tests__/components/ShiftsPage.test.tsx`)**：
  - 新增 3 个组件测试用例，覆盖指标渲染、排班列表、新增员工弹窗与配置弹窗交互；
  - 执行 `npm test`，全量 11 个测试套件 88 个测试用例 100% 绿色通过。

---

## [2026-09-01] - 转班小助手 Server Actions、持久化与系统定时任务集成 (`task010`)

### 后端服务与定时任务
- **Server Actions 服务 (`src/app/actions/shifts.ts`)**：
  - `getShiftData`：读取数据库持久化排班员工与配置，执行内存推演与历史过期自愈修正；
  - `addShiftWorker` / `updateShiftWorker` / `deleteShiftWorker`：提供原子化排班人员增删改操作；
  - `saveShiftConfig`：支持配置企业微信 Webhook 地址与默认转班周期；
  - `triggerShiftNotification`：支持手动一键测试推送与全员排班播报。
- **系统定时任务 (`src/lib/cron.ts` / `src/instrumentation.ts`)**：
  - 在全局定时任务中注册每日 08:00（`0 0 8 * * *`）自动巡检任务（`sendDailyShiftCheck`），实现无服务器依赖的自动预警。
- **自动化测试 (`src/__tests__/actions/shifts.test.ts`)**：
  - 编写 9 个单元测试用例，覆盖查询、新增、修改、删除、配置保存、手动推送与 Cron 调度；
  - 执行 `npm test`，全量 10 个测试套件 85 个测试用例 100% 绿色通过。

---

## [2026-09-01] - 转班小助手核心算法与企微推送模块落地 (`task009`)

### 核心算法与企微推送
- **转班核心纯函数库 (`src/lib/shifts/`)**：
  - [types.ts](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/lib/shifts/types.ts)：定义员工排班契约、转班预警、状态标签与全局配置接口；
  - [shift-algorithm.ts](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/lib/shifts/shift-algorithm.ts)：实现白夜班智能翻转（`flipShift`）、日期时区安全解析（`parseDateSafe`）、历史过期自动自愈推算（`selfHealWorker`）、状态倒计时标签计算（`calculateWorkerStatus`）以及推演排班（`processShiftSchedule`）；
  - [wecom-notifier.ts](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/lib/shifts/wecom-notifier.ts)：实现高可读性的企业微信群机器人 Markdown 消息卡片构建（`buildShiftMarkdownMessage`）与 Axios 推送服务（`sendWecomShiftNotice`）。
- **自动化测试 (`src/__tests__/lib/shifts.test.ts`)**：
  - 新增 15 个单元测试用例，覆盖班次翻转、日期解析、自愈推算、明日转班预警、Markdown 生成与 Webhook 请求 mock；
  - 执行 `npm test`，全量 9 个测试套件 76 个测试用例 100% 绿色通过。

---

## [2026-09-01] - 阶段初始化：智能工牌制作工作台与转班提醒小助手全栈融合 (`task008`)

### 阶段管理与架构设计
- **阶段开启 (`phase-tools-integration-20260901`)**：
  - 确立将原 Python 独立工具（`gongpai` 工牌生成系统、`zhuanbantixingxiaozhushou` 转班小助手）重构为 Next.js 纯全栈模块的技术路径；
  - 完成阶段规格书（`spec_tools_integration.md`）、架构计划（`plan_tools_integration.md`）、任务清单（`task_tools_integration.md`）与变更日志（`change_tools_integration.md`）初始化；
  - 在 `.phrase/docs/CHANGE.md` 中更新当前进行阶段与索引。
- **自动化测试**：
  - 执行 `npm test`，全量 8 个测试套件 61 个测试用例 100% 绿色通过。

---

## [2026-08-31] - 上周指标基准严格周期匹配与空值修复

### 算法与逻辑严谨性优化
- **基准严格 1 对 1 自然周绑定 (`src/app/actions/weekly-report.ts`)**：
  - 彻底移除了 `getLastWeekMetrics` 中“无匹配时降级拉取最新周报”的跨周模糊兜底逻辑；
  - 确保第 N 周的基准值**只能精准查询第 N-1 周**已保存的数据；如果第 N-1 周未录入过周报，基准值严格返回 `null`。
- **UI 指示与环比文案优化**：
  - [PeriodSelector.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/weekly-report/PeriodSelector.tsx)：当上周无基准数据时，清晰标识为 `(空)`；
  - [MetricsOverview.tsx](file:///d:/j/OpenProject/Nextproject/digital-officer-log/src/components/weekly-report/MetricsOverview.tsx)：当无上周基准时，环比标签规范显示为「暂无上周基准」。
- **自动化测试**：
  - 执行 `npm test`，全量 8 个测试套件 61 个测试用例 100% 绿色通过。

---

## [2026-08-31] - 周维度数据隔离与自动重置/历史回显功能

### 业务与交互优化
- **周维度数据严格隔离 (`src/app/weekly-summary/weekly-summary-client.tsx`)**：
  - 用户在顶部切换周期（如从 34 周切换到 35 周）时，自动清空上周临时上传的文件列表（`setFiles([])`），杜绝跨周临时文件残留。
  - **新周期自动重置**：如果切换到的那一周尚未保存过周报，数据看板、可视化图表及手写表单彻底复位为空白待导入就绪状态。
  - **历史周报智能回显**：如果切换到的那一周此前已保存过周报，系统通过 `getWeeklyReportByPeriod` 自动拉取并回显该周已保存的指标快照与手写内容。
- **服务端 Action 扩展 (`src/app/actions/weekly-report.ts`)**：
  - 新增 `getWeeklyReportByPeriod(year, weekNumber)` 按周期精准获取周报历史记录。
- **自动化测试**：
  - 执行 `npm test`，全量 8 个测试套件 61 个测试用例 100% 绿色通过。

---

## [2026-08-30] - 全局模块异常健壮性加固与 UI 弹窗重叠修复

### UI 修复
- **预览弹窗布局优化 (`src/components/weekly-report/ReportPreviewModal.tsx`)**：
  - 为弹窗顶部工具栏添加 `pr-8` 右侧间距，彻底消除「企微 Webhook 配置」按钮与 Dialog 默认右上角关闭「✕」按钮的视觉重叠。

### 全局健壮性加固
- **全站 Server Actions 防御性加固**：
  - 在 `src/app/actions/admin.ts`（用户列表、题目模板、看板分析、快捷链接）、`src/app/actions/submit-report.ts`（题目获取、月度日历状态、单日详情）、`src/app/actions/task.ts`（看板任务、历史任务、日志）、`src/app/actions/issue.ts`（知识库）、`src/app/actions/analysis.ts`（区域趋势）等核心查询中全部加入健壮的 `try-catch` 异常捕获与空数组/安全兜底，杜绝离线或网络抖动时服务端崩溃。
- **环境配置归档**：
  - 在 `.env` 中注释保留历史 Supabase 配置并启用内网服务器 PostgreSQL 配置。
- **全量测试与构建验证**：
  - 执行 `npm test`：8 个测试套件 61 个测试用例 100% 绿色通过；
  - 执行 Next.js 全量生产编译构建：全部 17 个路由页面编译成功，0 错误 0 警告。

---

## [2026-08-30] - 导航入口集成、生产环境全量构建与 Phase 闭环 (`task007`)

### 导航与入口
- **工作台主页导航 (`src/app/dashboard-client.tsx`)**：
  - 顶部导航栏与移动端添加「周报生成」按钮，直达 `/weekly-summary`；
  - 欢迎卡片操作区新增「自动总结周报」快捷按钮。

### 工程与构建加固
- **TypeScript 严格类型加固**：
  - 完善 `WorkshopStats` 与 `DepartmentStats` 索引签名，全面兼容 Recharts 3.x 数据结构；
  - 规范组件 `WeeklyCharts` 中的 `percent` 校验与类型守卫；
- **生产编译与 SSR 安全性加固**：
  - 在 `login`, `knowledge`, `admin/system`, `ai-summaries`, `report/new` 等页面规范声明 `export const dynamic = 'force-dynamic'`，防止离线静态构建尝试连接数据库；
  - 运行 `npm run build`，Next.js 生产 Turbopack 打包编译 100% 通过（0 错误 0 警告）；
  - 运行 `npm test`，全量 8 个测试套件 61 个用例 100% 绿色通过。

---

## [2026-08-30] - 周报工作台前端页面与交互组件落地 (`task006`)

### 前端与用户交互
- **周报工作台路由 (`src/app/weekly-summary/`)**：
  - `page.tsx`：周报工作台服务端页面，负责身份鉴权、自然周推算与基准数据预取。
  - `weekly-summary-client.tsx`：客户端主交互工作台，集成多文件拖拽、实时指标计算、图表看板、手写表单与一键推送预览。
- **周报专属组件库 (`src/components/weekly-report/`)**：
  - `PeriodSelector.tsx`：周期快捷切换（本周/上周/自然周）与上周环比基准微调弹窗。
  - `FileDropzone.tsx`：多 Excel 批量拖拽上传、文件级去重校验、识别标签与清单展示。
  - `MetricsOverview.tsx`：生产头条/QC头条/新随拍/OKR/精益实时指标透视与超期明细弹窗。
  - `WeeklyCharts.tsx`：生产车间分布饼图与随拍各部门打卡柱状图。
  - `ManualForm.tsx`：模块勾选开关、反思预填草稿、设备点检/保养/嘟嘟卡/系统改进建议等手写表单。
  - `ReportPreviewModal.tsx`：微信群文本与企微 Markdown 实时双视图预览、一键复制到剪贴板与企微群机器人一键推送。
- **单元测试**：
  - 新增 `src/__tests__/components/WeeklySummary.test.tsx` 页面组件单元测试。
  - 运行 `npm test`，全量 8 个测试套件 61 个用例 100% 通过。

---

## [2026-08-30] - 周报服务端 Actions 与企微机器人推送服务落地 (`task005`)

### 服务端与通信
- **Server Actions 实现 (`src/app/actions/weekly-report.ts`)**：
  - `saveWeeklyReport`：周报新增与更新持久化，支持指标快照与手写补充。
  - `getLastWeekMetrics`：自动跨周/跨年检索上一周期历史周报并提取指标基准。
  - `getWeeklyReportList`：周报历史列表查询。
  - `getWecomWebhookConfig` / `saveWecomWebhookConfig`：管理企微群机器人 Webhook 地址。
  - `pushWeeklyReportToWecom`：调用企微机器人 Webhook 接口发送 Markdown 格式周报，支持状态回写与友好错误提示。
- **单元测试**：
  - 新增 `src/__tests__/actions/weekly-report.test.ts`，涵盖 Webhook 配置、基准拉取、持久化、推送等单测。
  - 运行 `npm test`，全量 7 个测试套件 57 个用例 100% 通过。

---

## [2026-08-30] - 周报核心纯函数库与单元测试落地 (`task004`)

### 业务逻辑与算法实现
- **纯函数计算模块 (`src/lib/weekly-report/`)**：
  - `types.ts`：定义完整的周报、各模块指标快照、手写填报及日期周期数据结构。
  - `date-helper.ts`：以系统当前日期计算自然周（周一至周日）及 `M.D-M.D` 标准标题格式。
  - `file-recognizer.ts`：前缀与表头特征识别器（精准分流 QC头条、生产头条、OKR、新随拍、精益、综合点检）。
  - `excel-parser.ts`：基于 `xlsx` 库的 ArrayBuffer / Buffer 行对象解析与去重辅助。
  - `department-normalizer.ts`：班组归一（“一组/一部” $\rightarrow$ “智造一部”）与全量真实部门动态提取。
  - `metrics-calculator.ts`：开卡数、超24h/48h停机/处理、车间与部门分布占比、环比增长率计算。
  - `report-generator.ts`：微信群标准格式纯文本周报与企业微信 Markdown 格式化拼装生成器。
- **单元测试**：
  - 新增 `src/__tests__/lib/weekly-report.test.ts`，涵盖 6 大测试套件，全面覆盖 4 个真实 Excel 文件的解析与指标计算。
  - 运行 `npm test`，全量 6 个测试套件 47 个用例 100% 通过。

---

## [2026-08-30] - 周报数据模型扩展与 Prisma Client 升级 (`task003`)

### 数据库与数据模型
- **模型扩展**：
  - 在 `prisma/schema.prisma` 中新增 `WeeklyReport` 模型，支持周度周期（`startDate`, `endDate`, `year`, `weekNumber`）、指标快照（`metrics` JSON）、手动填报（`manualSections` JSON）、启用模块（`activeModules` JSON）、微信周报内容（`content` / `markdownContent`）以及企微机器人推送记录（`isPushedToWecom`, `pushedAt`）。
  - 在 `User` 模型中建立与 `WeeklyReport` 的一对多关联。
  - 重新执行 `npx prisma generate`，生成最新 TypeScript ORM 类型定义。

---

## [2026-08-30] - 海铭德系统使用情况周报自动总结阶段开启 (`task002`)

### 阶段管理与架构脚手架
- **阶段开启**：
  - 按照 AGENTS.md 规范开启研发阶段 `phase-weekly-report-20260830`。
  - 创建阶段标准文档集：`spec_weekly_report.md`、`plan_weekly_report.md`、`task_weekly_report.md`、`change_weekly_report.md`。
  - 更新 `.phrase/docs/CHANGE.md` 活跃阶段指向与历史归档回溯。
  - 完成企微群机器人 Webhook (`https://qyapi.weixin.qq.com/...`) 联调测试，返回 `{"errcode": 0, "errmsg": "ok"}` 确认可用。

---

## [2026-08-30] - 系统全量模块与功能全景架构梳理

### 文档驱动与系统全景
- **业务模块与架构梳理**：
  - 新增 [docs/guide/project-modules-and-features.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/project-modules-and-features.md)，全面梳理 7 大业务模块（工作台概览、日报填报、任务看板与工时、知识库/案例沉淀、数据分析、AI 总结、后台管理）及底层支撑模块。
  - 梳理 Prisma 数据模型与实体关系全景表（`User`, `DailyReport`, `Task`, `TaskLog`, `Issue`, `AISummary`, `Question`, `QuickLink`, `SystemConfig`）。
  - 更新 [docs/README.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/README.md) 全局文档索引与路由表。

---

## [2026-08-24] - 落地 Doc-Driven 项目管理脚手架与跨 Agent 规则库 (`task001`)

### 新增与工程治理
- **跨 Agent 规则库**：
  - 新增 `.agents/rules/000-agents-governance.md`（7 大铁律与自检清单）
  - 新增 `.agents/rules/001-doc-driven-workflow.md`（严格文档驱动与 Phase 推进规范）
  - 新增 `.agents/rules/002-tech-stack-and-negative-rules.md`（技术栈与负向禁令）
  - 新增 `.cursor/rules/` 对应 3 个 `.mdc` 规则文件
- **工程主干规范**：
  - 完善根目录 `AGENTS.md` 第六节，明确 Next.js 16 + React 19 + TypeScript + Prisma + Jest 规范
- **`.phrase/` 研发管理体系**：
  - 新增 `.phrase/docs/README.md`、`.phrase/docs/CHANGE.md`、`.phrase/docs/ISSUES.md`
  - 新增 `.phrase/templates/` 标准模板库（spec, plan, task, change, tech-refer, adr）
  - 开启并记录脚手架落地阶段 `phase-scaffolding-20260824`
- **`docs/` 业务文档体系与优雅归档**：
  - 新增 `docs/README.md` 全局文档索引与路由表
  - 初始化 `docs/CHANGELOG.md` 并完整继承项目历史发布更新日志
  - 迁移并规范化主线指引文档至 `docs/guide/`（`deployment-troubleshooting.md`、`why-deployment-fails.md`、`testing-guide.md`）
  - 初始化 `docs/archive/` 与 `docs/adr/`
  - 重构根目录 `README.md` 为现代化项目主页

---

## [2024-12-23] - 动态列表/复选框历史详情渲染修复

### Bug修复
- 修复日报详情页点击日历查看历史记录时的 React 报错（`dynamic_list`/`checkbox` 答案现在按表格或标签正确渲染，避免直接渲染对象导致的错误）。

---

## [2024-12-18] - 登录优化、题型扩展、动态列表与 OCR 识别

### 新增功能
- **登录页优化**：添加“记住密码”功能，自动保存工号；添加“忘记密码”功能，支持通过工号+姓名验证重置密码。
- **管理员后台题目类型扩展**：新增单选框（radio）、多选框（checkbox）、下拉框（select）类型，支持配置选项列表。
- **动态列表功能**：新增动态列表题目类型，支持多行数据输入（如产品名称+规格），可动态增删行。
- **OCR 图片识别**：动态列表支持图片识别功能，用户可上传或粘贴图片，自动识别并填充数据（使用浏览器端 Tesseract.js，支持中英文识别）。

### Bug修复
- 修复了测试环境 `ResizeObserver` 未定义的错误。

---

## [2024-12-17] - 防重复提交、看板滚动条、级联删除与任务复制

### 新增功能
- 管理员可以在历史归档任务页面删除任务（卡片右上角删除按钮）。
- 任务看板支持任务复制功能（点击复制按钮，预填数据打开新建弹窗）。
- 任务看板支持删除任务功能（本人可删除自己的任务，管理员可删除任意任务）。

### Bug修复
- 修复了立即发布按钮点击两次仍会新建两个同名任务的 Bug（服务端防重复提交 + 前端 loading 状态）。
- 修复了任务看板横向滚动条必须滚动到底部才能看到的问题（固定容器高度，滚动条始终可见）。
- 修复了删除历史归档任务时的外键约束错误（先删除关联日志再删除任务）。
- 修复了任务看板页面的语法错误导致页面无法加载的问题。

---

## [2024-12-16] - 趋势看板取数、日报图片粘贴与任务排期

### 新增功能
- 日报填写页面，支持图片的右键粘贴和拖入。
- 任务看板：新建任务时，开始日期与持续时间非必填，方便安排计划；持续时间支持点击拖拽修改。

### Bug修复
- 指标趋势分析看板取数异常。
- 通过日历查看当日已提交日报时，无法选择区域。

---

## [2024-12-13] - 区域指标趋势与任务结构优化

### 功能优化
- **关键指标趋势看板**：增加了区域选项，可以根据区域查看对应各指标数据。
- **任务看板**：优化了任务结构，可以设置开始时间、预计用时。完成后的任务会出现在历史任务中。

---

## [2024-12-12] - 知识库、看板、快捷网址与移动端适配

### 新增功能
- 增加了知识库、任务看板、快捷网址等功能。

### Bug修复
- 手机端看不到知识库入口。
- 管理员拖动任务失败。
- 页面上的文字可以选中。
- 创建/修改/完成任务，都需要刷新才能看到。

### 功能优化
- **手机端任务看板**：
  - 手机端自动切换为竖向布局。
  - 任务看板只显示当日任务和未来任务。今天以前且已经完成的任务自动隐藏，未完成的依旧显示。
  - 增加了历史任务入口，可以看到今天以前的任务。
