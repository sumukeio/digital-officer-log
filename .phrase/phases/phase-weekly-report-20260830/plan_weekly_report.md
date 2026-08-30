# [实施计划] plan_weekly_report.md — 海铭德系统使用情况周报自动总结

> **阶段标识**：`phase-weekly-report-20260830`  
> **权威状态**：[权威/现行]  
> **最后更新**：2026-08-30  

---

## 1. 架构设计与技术选型

### 数据模型设计 (Prisma)
在 `prisma/schema.prisma` 中新增 `WeeklyReport` 模型，用于存储周报元数据、各模块指标 JSON、手写内容 JSON、生成的最终 Markdown / Text 文本，以及创建人关联。

### 业务与计算分层
- **纯函数计算层 (`src/lib/weekly-report/`)**：
  - `file-recognizer.ts`：特征匹配与模块识别。
  - `excel-parser.ts`：Excel 行数据解析与清洗。
  - `department-normalizer.ts`：部门智能归一与动态发现。
  - `metrics-calculator.ts`：指标聚合、超期统计、车间占比与环比。
  - `report-generator.ts`：标准周报文本生成与企微 Markdown 格式化。
- **服务端接口层 (`src/app/actions/weekly-report.ts`)**：
  - `saveWeeklyReport`：持久化周报与指标快照。
  - `getWeeklyReportByWeek`：按周期拉取历史周报。
  - `getLastWeekMetrics`：拉取上一周期基准指标。
  - `pushWeeklyReportToWecom`：企微机器人 Webhook 推送。
  - `getWecomWebhookConfig` / `saveWecomWebhookConfig`：系统 Webhook 配置管理。
- **前端交互层 (`src/app/weekly-summary/` & `src/components/weekly-report/`)**：
  - 周期快捷选择器、批量文件拖拽上传区、数据透视与 Recharts 图表、手写表单与模块开关、周报文本预览与一键推送/复制。

---

## 2. 里程碑与任务拆解

| 任务编号 | 任务名称 | 核心产出 | 验证方式 |
| --- | --- | --- | --- |
| **`task002`** | 阶段文档集初始化 | 建立 phase 目录、spec/plan/task/change 文档，更新 CHANGE.md | 文件完整性与路由有效性检查 |
| **`task003`** | 数据库 Schema 扩展 | `WeeklyReport` 模型定义与 `prisma generate` | `prisma generate` 成功，无类型断言缺陷 |
| **`task004`** | 核心纯函数库与单元测试 | 识别器、解析器、归一器、指标与周报生成器 | Jest 单元测试覆盖真实 Excel 样例，100% 通过 |
| **`task005`** | Server Actions 与推送服务 | 保存、查询、基准拉取、企微 Webhook 接口及单测 | Actions 单元测试与接口响应断言 |
| **`task006`** | 周报工作台前端页面与组件 | 上传、透视表、图表、手写表单、预览弹窗与推送 | 组件渲染与交互逻辑验证 |
| **`task007`** | 导航集成与全流程构建验证 | Dashboard 入口集成，端到端体验，全量构建检查 | `npm test` + `npm run build` 通过 |

---

## 3. 风险预案与防范

- **风险 1：海铭德系统导出的 Excel 字段偶发空值或格式变动**
  - *防御措施*：纯函数层建立严格的容错与安全转换（NaN 兜底、默认值补齐），单测包含空值与脏数据用例。
- **风险 2：企微 Webhook 网络超时或 Key 错误**
  - *防御措施*：后端加超时控制（5秒）与友好错误捕获，前端给出清晰的错误提示与状态反馈。
