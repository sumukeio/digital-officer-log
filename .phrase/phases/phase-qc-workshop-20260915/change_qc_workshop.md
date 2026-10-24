# [变更日志] change_qc_workshop.md — 阶段变更回溯

> **阶段标识**：`phase-qc-workshop-20260915`  
> **更新模式**：时间倒序追加，只追加不覆盖。

---

## 变更回溯记录

### [2026-09-15] task027: 周期三模式（周/月/自定义）+ 整表当区间

- **变更摘要**：
  - `period.ts`：周/月（整月|月初至今）/自定义；独立 `storageKey`；
  - `QcPeriodBar`：页面左上角切换；切月默认整月；
  - 缓存 `dol_qc_rows_v2_*`，周模式兼容 v1；上传整表不裁剪。
- **验证结论**：`npm test -- --testPathPattern=qc-workshop` 4 套件 42 用例通过。

### [2026-09-15] task026: QC 车间统计 UI + 数据入口 + 文档

- **变更摘要**：
  - 新增 `/qc-workshop` 页面：周期选择、QC/映射表上传、统计预览、下载 xlsx/txt、复制全厂/分车间 Prompt；
  - `browser-storage`：localStorage 缓存映射表与按周 QC 行；`weekly-summary` 上传 QC 时自动同步；
  - 工作台顶栏增加「QC车间统计」入口。
- **关联文件**：
  - `[NEW]` `src/app/qc-workshop/*`、`browser-storage.ts`、`parse-qc-upload.ts`、`download-helper.ts`
  - `[MODIFY]` `dashboard-client.tsx`、`weekly-summary-client.tsx`、`docs/guide/*`、`docs/README.md`
- **验证结论**：`npm test` 170/170；`npx next build` 通过。

### [2026-09-15] task025: 导出 xlsx / txt / Prompt 纯函数

- **变更摘要**：
  - `buildQcWorkshopXlsx`：全厂概览 + 有数据车间 Sheet + 未归类（无空 Sheet）；
  - `buildQcWorkshopTxt`：7 标准部门有数据分章节 + 未归类；不含 Prompt；
  - `buildQcWorkshopPrompt`：全厂/分车间；硬约束对齐 headline-brief（问题≤3、改善≤4、收益 3 句）。
- **关联文件**：
  - `[NEW]` `export-meta.ts`、`export-xlsx.ts`、`export-txt.ts`、`generate-prompt.ts`
  - `[NEW]` `qc-workshop-export.test.ts`
  - `[MODIFY]` `index.ts`
- **验证结论**：`npm test -- --testPathPattern=qc-workshop` 3 套件 34 用例通过。

### [2026-09-15] task024: QC 车间聚合器

- **变更摘要**：
  - 新增 `aggregateQcByWorkshop`：归属 enrichment、全厂/分车间 TOP、问题归属分布、未归类分离；
  - `listStandardWorkshopsWithData` 供后续 txt 七部章节使用。
- **验证结论**：`npm test -- --testPathPattern=qc-workshop` 2 套件 22 用例通过。

### [2026-09-15] task023: 机台映射解析与 resolveWorkshop

- **变更摘要**：
  - 新增 `src/lib/qc-workshop/`：映射表解析/索引、后缀匹配（含前导零）、RFC002 别名、`resolveWorkshop`；
  - 单测覆盖 T001/喷绘/装箱吸塑别名、ZSJ6015、样例 QC ≥95% 覆盖率。
- **关联文件**：
  - `[NEW]` `src/lib/qc-workshop/*`
  - `[NEW]` `src/__tests__/lib/qc-workshop-resolve.test.ts`
- **验证结论**：`npm test -- --testPathPattern=qc-workshop-resolve` 13/13 通过。

### [2026-09-15] task022: 初始化阶段文档 + RFC002 锁定决策

- **变更摘要**：
  - 开启 `phase-qc-workshop-20260915`（spec/plan/task/change）；
  - `docs/rcfs/RFC002.md` 文首写入「已锁定决策」（7 车间、别名、导出形态、MVP 边界）；保留原文讨论不删减；
  - 更新 `.phrase/docs/CHANGE.md` 当前阶段、`docs/CHANGELOG.md`、`docs/README.md` 路由。
- **关联文件**：
  - `[NEW]` `.phrase/phases/phase-qc-workshop-20260915/spec_qc_workshop.md` 等
  - `[MODIFY]` `docs/rcfs/RFC002.md`、`.phrase/docs/CHANGE.md`、`docs/CHANGELOG.md`、`docs/README.md`
- **验证结论**：文档可读；决策与用户 Q1–Q5 一致；**未改业务代码**。
