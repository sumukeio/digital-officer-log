# 001-doc-driven-workflow.md — 严格文档驱动与 Phase 生命周期规范

> **权威性声明**：本文档映射自根目录 [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md)，规范本仓库的 Phase 推进流程与文档驱动开发闭环。

---

## 一、单一事实来源：`docs/` 体系

`docs/` 目录是业务知识库与运行维护的唯一权威源：

1. **`docs/README.md`**：文档总索引与全局路由表，必须保持所有业务与架构文档的跳转准确。
2. **`docs/CHANGELOG.md`**：仓库全量历史变更日志，记录真实演进，**只追加不覆盖**。
3. **`docs/guide/`**：主线部署、测试、运维与业务操作指引。
4. **`docs/adr/`**：架构决策记录（Architecture Decision Records）。
5. **`docs/archive/`**：过时文档归档区（严禁硬删除历史资产）。

---

## 二、精细化研发管理：`.phrase/` 体系

```text
.phrase/
  docs/
    CHANGE.md       # 变更总索引，顶部维护【当前进行阶段】链接
    ISSUES.md       # 缺陷与问题追踪索引 (issueNNN)
    README.md       # .phrase 体系说明
  phases/
    phase-<purpose>-<YYYYMMDD>/
      spec_*.md     # 阶段目标、范围定义 (Goals & Non-goals)、验收标准
      plan_*.md     # 里程碑计划、架构边界、风险预案
      task_*.md     # 原子任务清单 (taskNNN)，包含：产出 + 验证方式 + 影响范围
      change_*.md   # 任务完成后的变更回溯日志 (时间倒序)
      tech-refer_*.md (可选) 技术选型与规范参考
      adr_*.md        (可选) 架构决策记录
```

---

## 三、Phase 推进与 Task 闭环四部曲

每次在阶段中完成一个原子任务 `taskNNN` 时，**强制执行以下四部曲**：

1. **更新 Task 清单**：在 phase 的 `task_*.md` 中将对应任务标记为 `[x]`；
2. **追加 Phase 变更日志**：在 phase 的 `change_*.md` 中追加变更详情，并在 `.phrase/docs/CHANGE.md` 更新索引；
3. **追加全量 CHANGELOG**：在 `docs/CHANGELOG.md` 中以固定格式追加一条变更记录；
4. **主线文档同步**：若涉及配置变动、架构调整或操作指引，同步更新 `docs/guide/` 对应主线文档。

---

## 四、阶段生命周期控制

1. **Phase 开启**：仅当人类明确要求开启新阶段时，新建 `phase-<purpose>-<YYYYMMDD>`。
2. **Phase 结项**：未经人类明确确认，严禁擅自结项。人类验收通过后方可重命名为 `DONE-phase-<purpose>-<YYYYMMDD>`。
