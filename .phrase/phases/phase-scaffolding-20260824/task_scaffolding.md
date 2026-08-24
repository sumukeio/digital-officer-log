# [任务清单] task_scaffolding.md — 阶段原子任务跟踪

> **阶段标识**：`phase-scaffolding-20260824`  
> **任务推进原则**：严格单任务推进（`task001~taskNNN`），每个任务完成并验证通过后执行闭环四部曲，并**强制刹车等待人类确认**。

---

## 任务拆解与状态

### 阶段原子任务

- [x] **`task001`**: 按照 AGENTS.md 落地严格 Doc-Driven 项目管理脚手架与跨 Agent 规则库
  - **任务描述**：建立 `.agents/rules/` 与 `.cursor/rules/`，补全 `AGENTS.md` 第六节，落地 `.phrase/` 研发管理体系与模板，构建 `docs/` 业务文档索引与全量 `CHANGELOG.md`，对既有说明文档进行优雅治理与路由重构。
  - **产出清单**：
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
    - `[NEW]` `.phrase/templates/*` (spec, plan, task, change, tech-refer, adr)
    - `[NEW]` `.phrase/phases/phase-scaffolding-20260824/*`
    - `[NEW]` `docs/README.md`
    - `[NEW]` `docs/CHANGELOG.md`
    - `[NEW]` `docs/guide/deployment-troubleshooting.md`
    - `[NEW]` `docs/guide/why-deployment-fails.md`
    - `[NEW]` `docs/guide/testing-guide.md`
    - `[NEW]` `docs/archive/README.md`
    - `[NEW]` `docs/adr/README.md`
    - `[MODIFY]` `README.md`
  - **验证方案**：
    - 运行 `npm test` 确保所有 5 个测试套件（33 个用例）全部通过。
    - 检查文档与路由链接的完整性与有效性。
  - **状态**：已完成 (Passed npm test)

---

## Task 闭环检查表

- [x] 1. 在本文件中将任务标记为 `[x]`
- [x] 2. 在 `change_scaffolding.md` 追加变更回溯记录，并在 `.phrase/docs/CHANGE.md` 更新索引
- [x] 3. 在 `docs/CHANGELOG.md` 中以规范格式追加一条记录
- [x] 4. 同步更新 `docs/README.md` 对应路由
