# `.phrase/` 体系与研发管理总说明

> **状态**：[权威/现行]
> **参考依据**：[AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md) 第四节

---

## 一、体系定位与核心目标

`.phrase/` 是本仓库进行精细化研发管理与任务推进的生命周期目录：
1. **消除工程盲目性**：每个阶段均有清晰的目标边界（`spec_*`）、计划预案（`plan_*`）与原子任务拆解（`task_*`）。
2. **全周期变更可追溯**：每个原子任务完成后，必须沉淀变更回溯日志（`change_*`）并更新全局变更索引。
3. **缺陷闭环可查**：所有的缺陷与 Issue 均在 `ISSUES.md` 登记并拆解进对应阶段处理。

---

## 二、目录结构

```text
.phrase/
  docs/
    CHANGE.md       # 变更总索引，顶部维护【当前进行阶段】链接与历史回溯
    ISSUES.md       # 缺陷与问题追踪索引 (issueNNN)
    README.md       # 本文档（体系说明）
  phases/
    phase-<purpose>-<YYYYMMDD>/
      spec_*.md     # 阶段目标、范围定义 (Goals & Non-goals)、验收标准
      plan_*.md     # 里程碑计划、架构边界、风险预案
      task_*.md     # 原子任务清单 (taskNNN)，包含：产出 + 验证方式 + 影响范围
      change_*.md   # 任务完成后的变更回溯日志 (时间倒序)
      tech-refer_*.md (可选) 技术选型与规范参考
      adr_*.md        (可选) 架构决策记录
  templates/        # 阶段与任务初始化模版
```

---

## 三、Phase 推进生命周期与规则

1. **Phase Gate（阶段开启）**：
   - 仅当人类明确要求开启新阶段或大版本演进时新建 `phases/phase-<purpose>-<YYYYMMDD>/`。
   - 必须基于 `templates/` 初始化最小集：`spec_*`、`plan_*`、`task_*`、`change_*`。
2. **In-Phase 原子任务推进**：
   - 严格单任务推进（`task001~taskNNN`），完成并验证后执行 Task 闭环四部曲，并**强制刹车等待人类确认**。
3. **Phase 结项归档**：
   - 未经人类确认严禁擅自结项。
   - 验收通过后，目录重命名为 `phases/DONE-phase-<purpose>-<YYYYMMDD>/`。
