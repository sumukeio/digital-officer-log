# [阶段计划] plan_qc_workshop.md — QC 按车间统计导出

> **阶段标识**：`phase-qc-workshop-20260915`  
> **状态**：[权威/现行]

---

## Milestones

1. **M1 归属与聚合纯函数**（task022–task023）：映射/别名/聚合 + 单测  
2. **M2 导出**（task024）：xlsx + txt + Prompt 字符串生成  
3. **M3 UI 与数据入口**（task025）：页面/入口、读 weekly-summary 或上传、复制/下载  
4. **M4 闭环**（task026）：文档、导航、全量验证  

## Risks

| 风险 | 缓解 |
| --- | --- |
| 数字机台后缀误匹配 | 优先字母前缀+后缀；单测覆盖 6015→ZSJ6015 类 |
| 装箱/吸塑暂归九部不准 | 别名可配置；未归类清单便于后续改 |
| 映射表体积大 | 构建索引 Map；导入校验列名 |

## Rollback

功能独立模块；可隐藏入口；不影响现有 weekly-summary / headline-brief。
