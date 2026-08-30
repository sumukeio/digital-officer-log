# [任务清单] task_weekly_report.md — 阶段原子任务跟踪

> **阶段标识**：`phase-weekly-report-20260830`  
> **任务推进原则**：严格单任务推进（`task001~taskNNN`），每个任务完成并验证通过后执行闭环四部曲，并**强制刹车等待人类确认**。

---

## 任务拆解与状态

### 阶段原子任务

- [x] **`task002`**: 初始化 `phase-weekly-report-20260830` 阶段文档集并更新项目索引
  - **任务描述**：建立 `spec_weekly_report.md`、`plan_weekly_report.md`、`task_weekly_report.md`、`change_weekly_report.md`，并在 `.phrase/docs/CHANGE.md` 更新【当前进行阶段】链接与历史阶段索引。
  - **产出清单**：
    - `[NEW]` `.phrase/phases/phase-weekly-report-20260830/spec_weekly_report.md`
    - `[NEW]` `.phrase/phases/phase-weekly-report-20260830/plan_weekly_report.md`
    - `[NEW]` `.phrase/phases/phase-weekly-report-20260830/task_weekly_report.md`
    - `[NEW]` `.phrase/phases/phase-weekly-report-20260830/change_weekly_report.md`
    - `[MODIFY]` `.phrase/docs/CHANGE.md`
    - `[MODIFY]` `docs/CHANGELOG.md`
  - **验证方案**：
    - 检查文档与路由链接的完整性与有效性；
    - 运行 `npm test` 确保无副作用。
  - **状态**：已完成 (Pass)

- [x] **`task003`**: 数据库 Schema 扩展（`WeeklyReport` 模型）与 Prisma Client 更新
  - **任务描述**：在 `prisma/schema.prisma` 中定义 `WeeklyReport` 模型，执行 `npx prisma generate` 生成最新 Client 类型定义。
  - **产出清单**：
    - `[MODIFY]` `prisma/schema.prisma`
  - **验证方案**：
    - 执行 `npx prisma generate` 成功，TypeScript 类型检查无报错，`npm test` 保持全绿。
  - **状态**：已完成 (Pass)

- [x] **`task004`**: 核心纯函数库与单元测试实现
  - **任务描述**：开发文件识别器、Excel 行解析器、部门归一与动态发现器、指标计算与环比聚合器、微信周报文本生成器，并编写覆盖真实样例的 Jest 单元测试。
  - **产出清单**：
    - `[NEW]` `src/lib/weekly-report/types.ts`
    - `[NEW]` `src/lib/weekly-report/date-helper.ts`
    - `[NEW]` `src/lib/weekly-report/file-recognizer.ts`
    - `[NEW]` `src/lib/weekly-report/excel-parser.ts`
    - `[NEW]` `src/lib/weekly-report/department-normalizer.ts`
    - `[NEW]` `src/lib/weekly-report/metrics-calculator.ts`
    - `[NEW]` `src/lib/weekly-report/report-generator.ts`
    - `[NEW]` `src/__tests__/lib/weekly-report.test.ts`
  - **验证方案**：
    - 运行 `npm test`，所有 6 个单测套件 47 个用例 100% 通过（验证 4 个真实 Excel 文件的解析与指标计算准确性）。
  - **状态**：已完成 (Pass)

- [x] **`task005`**: Server Actions 与企业微信机器人 Webhook 推送服务
  - **任务描述**：实现周报持久化保存、历史周报与基准指标拉取、系统 Webhook 配置读写、企微群机器人 Markdown 消息一键推送，并配齐 Actions 单测。
  - **产出清单**：
    - `[NEW]` `src/app/actions/weekly-report.ts`
    - `[NEW]` `src/__tests__/actions/weekly-report.test.ts`
  - **验证方案**：
    - 运行 `npm test`，所有 7 个单测套件 57 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task006`**: 周报工作台前端页面与交互组件
  - **任务描述**：开发 `/weekly-summary` 页面及子组件（快捷周期选择、批量文件拖拽上传、数据透视与 Recharts 图表看板、手写表单与模块开关、周报文本预览与一键推送/复制）。
  - **产出清单**：
    - `[NEW]` `src/app/weekly-summary/page.tsx`
    - `[NEW]` `src/app/weekly-summary/weekly-summary-client.tsx`
    - `[NEW]` `src/components/weekly-report/PeriodSelector.tsx`
    - `[NEW]` `src/components/weekly-report/FileDropzone.tsx`
    - `[NEW]` `src/components/weekly-report/MetricsOverview.tsx`
    - `[NEW]` `src/components/weekly-report/WeeklyCharts.tsx`
    - `[NEW]` `src/components/weekly-report/ManualForm.tsx`
    - `[NEW]` `src/components/weekly-report/ReportPreviewModal.tsx`
    - `[NEW]` `src/__tests__/components/WeeklySummary.test.tsx`
  - **验证方案**：
    - 运行 `npm test`，所有 8 个单测套件 61 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task007`**: 导航入口集成、端到端全流程验证与全量构建闭环
  - **任务描述**：在 Dashboard 顶部导航栏与主操作区添加入口，导入 4 份真实 Excel 样例进行端到端测试，运行全量 `npm test` 与 `npm run build`，完成 Phase 归档与文档回写。
  - **产出清单**：
    - `[MODIFY]` `src/app/dashboard-client.tsx`（添加顶部与移动端「周报生成」导航按钮及欢迎区「自动总结周报」快捷入口）
    - `[MODIFY]` `src/app/dashboard.tsx`
    - `[MODIFY]` `docs/README.md`
    - `[MODIFY]` `docs/CHANGELOG.md`
  - **验证方案**：
    - `npm test` 全量通过；`npm run build` 成功编译。
  - **状态**：已完成 (Pass)

---

## Task 闭环检查表 (每次任务执行)

- [ ] 1. 在本文件中将任务标记为 `[x]`
- [ ] 2. 在 `change_weekly_report.md` 追加变更回溯记录，并在 `.phrase/docs/CHANGE.md` 更新索引
- [ ] 3. 在 `docs/CHANGELOG.md` 中以规范格式追加一条记录
- [ ] 4. 同步更新 `docs/README.md` 对应路由（若有）
