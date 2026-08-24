# [阶段规范] spec_<purpose>.md — 阶段目标与验收标准

> **阶段标识**：`phase-<purpose>-<YYYYMMDD>`  
> **状态**：[讨论稿] / [权威/现行] / [已完成]  
> **创建日期**：YYYY-MM-DD  

---

## 一、阶段背景与核心目标 (Background & Goals)

### 1. 业务/技术背景
简要说明开启本阶段的原因、痛点或需求输入。

### 2. 核心目标 (Goals)
- [ ] 目标 1：...
- [ ] 目标 2：...

### 3. 非目标 / 边界说明 (Non-Goals)
明确本阶段**明确不做**的事情，严防范围蔓延：
- ❌ Non-Goal 1：...
- ❌ Non-Goal 2：...

---

## 二、功能与技术特性清单 (Features & Requirements)

### 1. 核心需求点
1. ...
2. ...

### 2. 架构契约与数据模型变动
若涉及数据库、API 或数仓模型调整，在此说明并列出影响面。

---

## 三、阶段验收标准 (Acceptance Criteria)

- [ ] **自动化测试**：所有新增及既有 Jest 测试通过 (`npm test`)。
- [ ] **构建无报错**：`npm run build` 成功无 TypeScript 类型错误。
- [ ] **文档与变更闭环**：同步完成 `task_*.md`、`change_*.md`、`docs/CHANGELOG.md` 及相关 guide。
- [ ] **人类签字验收**：阶段输出物经人类审查并确认结项。
