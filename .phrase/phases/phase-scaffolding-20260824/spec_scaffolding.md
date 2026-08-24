# [阶段规范] spec_scaffolding.md — 落地严格 Doc-Driven 项目管理脚手架

> **阶段标识**：`phase-scaffolding-20260824`  
> **状态**：[权威/现行]  
> **创建日期**：2026-08-24  

---

## 一、阶段背景与核心目标 (Background & Goals)

### 1. 阶段背景
仓库已有业务功能开发，但缺乏统一的跨 Agent（Antigravity / Cursor）治理规则库、Doc-Driven 任务推进体系与业务文档单一事实来源。根据根目录 [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md) 总规范，需要为本项目建立健全严格的研发脚手架。

### 2. 核心目标 (Goals)
- [x] 建立跨 Agent 规则库：`.agents/rules/` 与 `.cursor/rules/`
- [x] 完善 [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md) 第六节技术栈与工程规范
- [x] 构建 `.phrase/` 生命周期管理脚手架（索引、模板与 Phase 0 实例）
- [x] 构建 `docs/` 业务文档体系，并按优雅归档原则治理既有历史说明文档
- [x] 重构根目录 `README.md` 为清晰的项目总门户

### 3. 非目标 (Non-Goals)
- ❌ **严禁借机修改业务逻辑与功能代码**
- ❌ **严禁破坏既有自动化测试用例**
- ❌ **严禁硬删除既有历史文档内容**

---

## 二、阶段验收标准 (Acceptance Criteria)

- [x] 跨 Agent 规则库同构建立且与 AGENTS.md 保持一致。
- [x] `.phrase/` 目录结构与初始化模板完备。
- [x] 根目录既有说明文档（部署排错、测试文档等）完成优雅迁移并添加状态标识。
- [x] `docs/CHANGELOG.md` 完整继承历史变更记录并建立规范追加格式。
- [x] 自动化测试 `npm test` 全部通过（5 suites, 33 tests）。
