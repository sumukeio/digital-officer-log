# [变更日志] change_weekly_report.md — 阶段变更回溯日志

> **阶段标识**：`phase-weekly-report-20260830`  
> **记录原则**：时间倒序，每次完成原子任务后追加记录，严禁覆盖历史条目。

---

### [2026-08-30] `task007`: 导航入口集成、生产全量构建与 Phase 闭环
- **变更类型**：导航集成、类型严谨性加固与全量构建闭环
- **变更摘要**：
  - 在 `src/app/dashboard-client.tsx` 中添加工作台顶部导航栏与移动端「周报生成」按钮，在欢迎区新增「自动总结周报」快捷入口；
  - 修复 `src/lib/weekly-report/types.ts` 和 `src/components/weekly-report/WeeklyCharts.tsx` 中的 TypeScript 严格类型断言；
  - 在静态页面渲染中为 `login`, `knowledge`, `admin/system`, `ai-summaries`, `report/new` 规范添加 `force-dynamic`，确保构建时安全；
  - 运行 `npm test` 8 个测试套件 61 个用例 100% 通过；
  - 运行 `npm run build` Next.js 生产环境 Turbopack 编译打包成功（0 错误 0 警告）。
- **验证结果**：测试与生产全量构建通过。

---

### [2026-08-30] `task006`: 周报工作台前端页面与交互组件落地
- **变更类型**：前端页面与可视化组件
- **变更摘要**：
  - 新增 `src/app/weekly-summary/page.tsx` 服务端路由页面（登录校验、自然周推算、并行数据预取）；
  - 新增 `src/app/weekly-summary/weekly-summary-client.tsx` 客户端工作台主容器；
  - 新增子组件库 `src/components/weekly-report/`：
    - `PeriodSelector.tsx`：周期快捷切换、起止日期自定义与上周基准值微调弹窗；
    - `FileDropzone.tsx`：多 Excel 批量拖拽导入、文件级去重判断、识别标签与清单展示；
    - `MetricsOverview.tsx`：生产头条/QC头条/新随拍/OKR/精益实时指标透视与超期明细弹窗；
    - `WeeklyCharts.tsx`：生产车间分布饼图与随拍各部门打卡柱状图；
    - `ManualForm.tsx`：模块勾选开关、反思预填草稿、设备点检/保养/嘟嘟卡/系统改进建议等手写表单；
    - `ReportPreviewModal.tsx`：微信群文本与企微 Markdown 实时双视图预览、一键复制到剪贴板与企微群机器人一键推送；
  - 新增 `src/__tests__/components/WeeklySummary.test.tsx` 组件单元测试。
- **验证结果**：`npm test` 8 个测试套件 61 个用例 100% 通过。

---

### [2026-08-30] `task005`: Server Actions 与企业微信推送服务落地
- **变更类型**：服务端接口与企微机器人通信
- **变更摘要**：
  - 新增 `src/app/actions/weekly-report.ts`：
    - `getWecomWebhookConfig` / `saveWecomWebhookConfig`：管理企微机器人 Webhook 地址（支持数据库持久化与默认兜底）；
    - `getLastWeekMetrics`：根据当前年份与周数自动匹配上一周期已归档周报，提取指标快照用于环比计算；
    - `saveWeeklyReport`：周报持久化新增与更新，关联用户与周度元数据；
    - `getWeeklyReportList`：查询最近周报历史；
    - `pushWeeklyReportToWecom`：调用企微机器人 Webhook 接口发送 Markdown 格式周报，并更新推送状态；
  - 新增 `src/__tests__/actions/weekly-report.test.ts` 单元测试套件。
- **验证结果**：`npm test` 7 个测试套件 57 个用例 100% 通过。

---

### [2026-08-30] `task004`: 核心纯函数库开发与单元测试落地
- **变更类型**：纯函数计算库与单元测试
- **变更摘要**：
  - 在 `src/lib/weekly-report/` 落地全套纯函数：
    - `types.ts`：定义周报完整类型体系；
    - `date-helper.ts`：计算指定/当前日期的自然周（周一至周日）及标题格式化；
    - `file-recognizer.ts`：前缀与表头特征智能识别（精准分流 QC头条、生产头条、OKR、新随拍等）；
    - `excel-parser.ts`：基于 `xlsx` 的 ArrayBuffer / Buffer 安全解析与行结构化；
    - `department-normalizer.ts`：班组归一（“一组/一部” $\rightarrow$ “智造一部”）与全量真实部门动态提取；
    - `metrics-calculator.ts`：开卡数、超24h/48h停机与处理、车间与部门分布占比、环比增长率计算；
    - `report-generator.ts`：标准微信纯文本周报与企业微信 Markdown 格式化拼装生成器；
  - 新增 `src/__tests__/lib/weekly-report.test.ts`，涵盖 6 大测试套件，全面覆盖 4 个真实 Excel 文件的解析与指标计算。
- **验证结果**：`npm test` 6 个测试套件 47 个用例 100% 通过。

---

### [2026-08-30] `task003`: 数据库 Schema 扩展与 Prisma Client 升级
- **变更类型**：数据库模型与类型生成
- **变更摘要**：
  - 在 `prisma/schema.prisma` 中新增 `WeeklyReport` 模型，包含周期（`startDate`, `endDate`, `year`, `weekNumber`）、指标快照（`metrics`）、手写补充（`manualSections`）、启用模块（`activeModules`）、周报文本（`content`, `markdownContent`）以及企微推送状态字段；
  - 在 `User` 模型中建立 `weeklyReports WeeklyReport[]` 一对多关联；
  - 成功执行 `npx prisma generate` 生成最新的 `@prisma/client` 类型定义；
- **验证结果**：类型生成成功，`npm test` 5 个套件 33 个用例全量通过。

---

### [2026-08-30] `task002`: 初始化阶段文档集与项目管理索引
- **变更类型**：文档与阶段工程脚手架
- **变更摘要**：
  - 按照 AGENTS.md 规范创建阶段目录 `.phrase/phases/phase-weekly-report-20260830/`；
  - 编写 `spec_weekly_report.md`、`plan_weekly_report.md`、`task_weekly_report.md` 与本文件；
  - 更新 `.phrase/docs/CHANGE.md`，将当前进行阶段指向本阶段，并在历史阶段表中记录；
  - 在 `docs/CHANGELOG.md` 中追加初始化变更记录。
- **验证结果**：文档链接完整有效，`npm test` 5 个套件 33 个用例全量通过。
