# [任务清单] task_qc_workshop.md — QC 按车间统计导出

> **阶段标识**：`phase-qc-workshop-20260915`  
> **编号承接**：全局 `task022` 起（接续 task021）  
> **执行约束**：每次只执行一个原子任务，完成后刹车等待确认。

---

## 阶段原子任务

- [x] **`task022`**: 初始化本阶段文档集并更新项目索引
  - **任务描述**：建立 `spec_/plan_/task_/change_`，更新 `.phrase/docs/CHANGE.md`、`docs/CHANGELOG.md`、`docs/README.md`；将 RFC002 第一节写为已锁定决策。
  - **产出**：
    - `[NEW]` `.phrase/phases/phase-qc-workshop-20260915/*`
    - `[MODIFY]` `docs/rcfs/RFC002.md`、`.phrase/docs/CHANGE.md`、`docs/CHANGELOG.md`、`docs/README.md`
  - **验证**：RFC002 含锁定决策；阶段链接可打开  
  - **状态**：已完成 (Pass)

- [x] **`task023`**: 机台映射解析、索引、归属匹配与别名表 + Jest
  - **任务描述**：实现映射表解析与 `resolveWorkshop(deviceId)`；固化 T001/喷绘/装箱*/吸塑* 别名；样例覆盖率单测。
  - **产出**：
    - `[NEW]` `src/lib/qc-workshop/{types,aliases,machine-map,resolve-workshop,index}.ts`
    - `[NEW]` `src/__tests__/lib/qc-workshop-resolve.test.ts`
  - **验证**：`npm test -- --testPathPattern=qc-workshop-resolve` 13 用例通过；样例覆盖率 ≥95%  
  - **状态**：已完成 (Pass)

- [x] **`task024`**: QC 车间聚合器（全厂/分车间 TOP）+ Jest
  - **任务描述**：`qc-workshop-aggregator`：按车间计数、问题 TOP、未归类列表。
  - **产出**：
    - `[NEW]` `src/lib/qc-workshop/aggregator.ts`
    - `[NEW]` `src/__tests__/lib/qc-workshop-aggregator.test.ts`
  - **验证**：`npm test -- --testPathPattern=qc-workshop` 22 用例通过  
  - **状态**：已完成 (Pass)

- [x] **`task025`**: 导出 xlsx（全厂+有数据车间 Sheet）与单文件 txt + Prompt 生成
  - **任务描述**：纯函数生成导出内容；Prompt 模板供复制按钮（不写入 txt）。
  - **产出**：
    - `[NEW]` `src/lib/qc-workshop/{export-meta,export-xlsx,export-txt,generate-prompt}.ts`
    - `[NEW]` `src/__tests__/lib/qc-workshop-export.test.ts`
  - **验证**：`npm test -- --testPathPattern=qc-workshop` 34 用例通过  
  - **状态**：已完成 (Pass)

- [x] **`task026`**: UI 入口（上传/读当周 QC）+ 下载/复制 + 文档闭环
  - **任务描述**：工作台入口与最小页面；映射表导入；guide 更新；全量 test/build。
  - **产出**：
    - `[NEW]` `src/app/qc-workshop/{page,qc-workshop-client}.tsx`
    - `[NEW]` `browser-storage.ts`、`parse-qc-upload.ts`、`download-helper.ts`
    - `[MODIFY]` `dashboard-client.tsx`、`weekly-summary-client.tsx`（QC 行 localStorage 同步）
    - `[MODIFY]` `docs/guide/project-modules-and-features.md`、`docs/README.md`
  - **验证**：`npm test` 170 通过；`npx next build` 通过（含 `/qc-workshop` 路由）  
  - **状态**：已完成 (Pass)

- [x] **`task027`**: 周期三模式（周/月/自定义）+ 整表当区间
  - **任务描述**：左上角切换周|月|自定义；月含整月/月初至今；缓存按 periodKey 分桶；不按开卡时间裁剪。
  - **产出**：
    - `[NEW]` `src/lib/qc-workshop/period.ts`、`QcPeriodBar.tsx`、`qc-workshop-period.test.ts`
    - `[MODIFY]` `browser-storage.ts`、`qc-workshop-client.tsx`、`docs/rcfs/RFC002.md`
  - **验证**：`npm test -- --testPathPattern=qc-workshop` 42 用例通过  
  - **状态**：已完成 (Pass)

---

## Task 闭环检查表

- [x] 1. 本文件勾选 `[x]`  
- [x] 2. `change_qc_workshop.md` + `.phrase/docs/CHANGE.md`  
- [x] 3. `docs/CHANGELOG.md`  
- [x] 4. 必要时更新 `docs/guide/`  
