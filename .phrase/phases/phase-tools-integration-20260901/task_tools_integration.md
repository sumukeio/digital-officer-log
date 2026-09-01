# [任务清单] task_tools_integration.md — 阶段原子任务跟踪

> **阶段标识**：`phase-tools-integration-20260901`  
> **任务推进原则**：严格单任务推进（`task008~task014`），每个任务完成并验证通过后执行闭环四部曲，并**强制刹车等待人类确认**。

---

## 任务拆解与状态

### 阶段原子任务

- [x] **`task008`**: 初始化 `phase-tools-integration-20260901` 阶段文档集并更新项目索引
  - **任务描述**：建立 `spec_tools_integration.md`、`plan_tools_integration.md`、`task_tools_integration.md`、`change_tools_integration.md`，并在 `.phrase/docs/CHANGE.md` 与 `docs/CHANGELOG.md` 更新索引。
  - **产出清单**：
    - `[NEW]` `.phrase/phases/phase-tools-integration-20260901/spec_tools_integration.md`
    - `[NEW]` `.phrase/phases/phase-tools-integration-20260901/plan_tools_integration.md`
    - `[NEW]` `.phrase/phases/phase-tools-integration-20260901/task_tools_integration.md`
    - `[NEW]` `.phrase/phases/phase-tools-integration-20260901/change_tools_integration.md`
    - `[MODIFY]` `.phrase/docs/CHANGE.md`
    - `[MODIFY]` `docs/CHANGELOG.md`
  - **验证方案**：
    - 检查文档与路由链接有效性；
    - 运行 `npm test` 确保无副作用。
  - **状态**：已完成 (Pass)

- [x] **`task009`**: 转班小助手核心算法模块（自愈推算、班次翻转、企微 Markdown 消息构建）与 Jest 单元测试
  - **任务描述**：用 TypeScript 实现转班核心纯函数库（`types.ts`, `shift-algorithm.ts`, `wecom-notifier.ts`），编写全面覆盖过期自愈、白夜班翻转与 Markdown 格式的 Jest 单元测试。
  - **产出清单**：
    - `[NEW]` `src/lib/shifts/types.ts`
    - `[NEW]` `src/lib/shifts/shift-algorithm.ts`
    - `[NEW]` `src/lib/shifts/wecom-notifier.ts`
    - `[NEW]` `src/__tests__/lib/shifts.test.ts`
  - **验证方案**：
    - 运行 `npm test`，所有 9 个单测套件 76 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task010`**: 转班小助手 Server Actions、持久化与定时任务（`src/lib/cron.ts`）集成及单元测试
  - **任务描述**：实现转班排班数据的 CRUD Server Actions、系统配置读取、企微 Webhook 调用，以及接入系统内置 `node-cron` 定时任务（每日 08:00 自动检查并推送）。
  - **产出清单**：
    - `[NEW]` `src/app/actions/shifts.ts`
    - `[MODIFY]` `src/lib/cron.ts`
    - `[MODIFY]` `src/instrumentation.ts`
    - `[NEW]` `src/__tests__/actions/shifts.test.ts`
  - **验证方案**：
    - 运行 `npm test`，所有 10 个单测套件 85 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task011`**: 转班小助手前端管理看板（`/shifts` 页面、卡片/表格视图、增删改弹窗、企微测试推送）
  - **任务描述**：开发 `/shifts` 页面及其交互组件，包含今日/明日转班预警卡片、倒计时状态标签、排班表格、员工编辑/添加弹窗、配置弹窗与一键企微测试推送。
  - **产出清单**：
    - `[NEW]` `src/app/shifts/page.tsx`
    - `[NEW]` `src/app/shifts/shift-client.tsx`
    - `[NEW]` `src/__tests__/components/ShiftsPage.test.tsx`
  - **验证方案**：
    - 运行 `npm test`，所有 11 个单测套件 88 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task012`**: 工牌制作工作台核心模块（数据结构、Excel 批量解析、员工数据导入、工牌参数配置）与 Jest 单测
  - **任务描述**：开发工牌核心类型与数据处理纯函数库，支持 Excel 模板生成、批量 Excel 导入校验、系统数字官用户一键转换工牌数据。
  - **产出清单**：
    - `[NEW]` `src/lib/badge/types.ts`
    - `[NEW]` `src/lib/badge/excel-importer.ts`
    - `[NEW]` `src/__tests__/lib/badge.test.ts`
  - **验证方案**：
    - 运行 `npm test`，所有 12 个单测套件 94 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task013`**: 工牌制作工作台前端画布与高精 A4 拼版打印系统（`/badge` 页面、1:1 预览、打印样式）
  - **任务描述**：开发 `/badge` 页面及子组件（工牌卡片实时预览、企业 Logo/参数配置、A4 网格拼版视图、带裁切线高精打印 `@media print`）。
  - **产出清单**：
    - `[NEW]` `src/app/badge/page.tsx`
    - `[NEW]` `src/app/badge/badge-client.tsx`
    - `[NEW]` `src/components/badge/QRCodeSVG.tsx`
    - `[NEW]` `src/components/badge/BadgeCard.tsx`
    - `[NEW]` `src/components/badge/A4PrintSheet.tsx`
    - `[NEW]` `src/__tests__/components/BadgePage.test.tsx`
  - **验证方案**：
    - 运行 `npm test`，所有 13 个单测套件 99 个用例 100% 通过。
  - **状态**：已完成 (Pass)

- [x] **`task014`**: 全局导航入口集成、端到端全量验证（`npm test` + `npm run build`）与文档归档闭环
  - **任务描述**：在 Dashboard 顶部与移动端导航挂载「转班助手」与「工牌制作」入口，执行全量端到端验证、`npm test` 与 `npm run build`，同步更新 `docs/README.md` 与 `docs/CHANGELOG.md`。
  - **产出清单**：
    - `[MODIFY]` `src/app/dashboard-client.tsx`
    - `[MODIFY]` `docs/guide/project-modules-and-features.md`
    - `[MODIFY]` `docs/README.md`
    - `[MODIFY]` `docs/CHANGELOG.md`
  - **验证方案**：
    - `npm test` 全量 13 个测试套件 99 个用例 100% 通过；
    - `npm run build` 全部 19 个页面生成成功，0 错误 0 警告。
  - **状态**：已完成 (Pass)

---

## Task 闭环检查表 (每次任务执行)

- [ ] 1. 在本文件中将任务标记为 `[x]`
- [ ] 2. 在 `change_tools_integration.md` 追加变更回溯记录，并在 `.phrase/docs/CHANGE.md` 更新索引
- [ ] 3. 在 `docs/CHANGELOG.md` 中以规范格式追加一条记录
- [ ] 4. 同步更新 `docs/README.md` 对应路由（若有）
