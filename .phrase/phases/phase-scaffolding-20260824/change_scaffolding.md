# [变更回溯] change_scaffolding.md — 脚手架建设与文档治理变更日志

> **阶段标识**：`phase-scaffolding-20260824`  
> **记录原则**：时间倒序，记录每个原子任务的实质变动与验证凭据。

---

## 变更流水记录

### [2026-08-24] `[task001]` 落地严格 Doc-Driven 项目管理脚手架与跨 Agent 规则库

- **任务编号**：`task001`
- **执行时间**：2026-08-24
- **改动文件清单**：
  - `[NEW]` `.agents/rules/000-agents-governance.md`
  - `[NEW]` `.agents/rules/001-doc-driven-workflow.md`
  - `[NEW]` `.agents/rules/002-tech-stack-and-negative-rules.md`
  - `[NEW]` `.cursor/rules/agents-governance.mdc`
  - `[NEW]` `.cursor/rules/doc-driven-workflow.mdc`
  - `[NEW]` `.cursor/rules/tech-stack-and-negative-rules.mdc`
  - `[MODIFY]` `AGENTS.md` (补全第六节技术栈与工程规范)
  - `[NEW]` `.phrase/docs/README.md`
  - `[NEW]` `.phrase/docs/CHANGE.md`
  - `[NEW]` `.phrase/docs/ISSUES.md`
  - `[NEW]` `.phrase/templates/spec_template.md`
  - `[NEW]` `.phrase/templates/plan_template.md`
  - `[NEW]` `.phrase/templates/task_template.md`
  - `[NEW]` `.phrase/templates/change_template.md`
  - `[NEW]` `.phrase/templates/tech-refer_template.md`
  - `[NEW]` `.phrase/templates/adr_template.md`
  - `[NEW]` `.phrase/phases/phase-scaffolding-20260824/spec_scaffolding.md`
  - `[NEW]` `.phrase/phases/phase-scaffolding-20260824/plan_scaffolding.md`
  - `[NEW]` `.phrase/phases/phase-scaffolding-20260824/task_scaffolding.md`
  - `[NEW]` `.phrase/phases/phase-scaffolding-20260824/change_scaffolding.md`
  - `[NEW]` `docs/README.md`
  - `[NEW]` `docs/CHANGELOG.md`
  - `[NEW]` `docs/guide/deployment-troubleshooting.md`
  - `[NEW]` `docs/guide/why-deployment-fails.md`
  - `[NEW]` `docs/guide/testing-guide.md`
  - `[NEW]` `docs/archive/README.md`
  - `[NEW]` `docs/adr/README.md`
  - `[MODIFY]` `README.md`
- **核心逻辑说明**：
  - 依照根目录 `AGENTS.md` 规范，建立了跨 Antigravity 和 Cursor 的规则约束体系；
  - 落地了 `.phrase/` 研发管理体系，包括阶段规范、任务拆解模板与阶段变更追踪；
  - 规范治理了 `docs/` 业务文档体系，将历史发布更新日志整合进 `docs/CHANGELOG.md`，将历史说明文档妥善迁移至 `docs/guide/` 并添加权威状态标识；
  - 重构了根目录 `README.md` 为规范项目入口。
- **验证凭据 (Verification Evidence)**：
  - 执行 `npm test`，全部 5 个测试套件（33 个测试用例）均顺利通过，无破坏既有逻辑。
- **关联文档更新**：
  - 已同步更新 `docs/CHANGELOG.md`
  - 已同步更新 `.phrase/docs/CHANGE.md`
  - 已同步更新 `docs/README.md`
