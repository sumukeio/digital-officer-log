# 仓库全量历史变更日志 (CHANGELOG.md)

> **权威性声明**：本文档遵循 Keep a Changelog 格式规范，**只追加、不覆盖**。
> **维护规则**：每次完成 Phase 任务或重要工程/业务交付时，在此以标准格式追加最新记录。

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
