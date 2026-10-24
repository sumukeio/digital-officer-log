# [阶段说明书] spec_headline_brief.md — 头条「问题—改善—收益」精简周简报

> **阶段标识**：`phase-headline-brief-20260912`  
> **权威状态**：[权威/现行]  
> **最后更新**：2026-09-12  
> **需求输入**：[docs/rcfs/新需求.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/rcfs/新需求.md)

---

## 1. 业务目标与愿景 (Goals)

将 DeepSeek 生成的「问题—改善—收益」长文，压缩为领导群可读的短 Markdown / 一页海报，并沉淀为数字官工作台独立能力「头条周简报」。

### 核心目标 (Goals)

1. **独立模块**：不并入海铭德指标周报正文，与 `/weekly-summary` 互补。
2. **粘贴提炼 + 人工改稿**：规则模板解析长文为结构化草稿，人工确认后输出。
3. **双输出**：企微短 Markdown（一键推送/复制）+ 一页竖版海报 PNG（下载发群）。
4. **多模块**：生产头条 / QC头条 / 自定义，默认合并推送。
5. **指标联动**：可从当周已存 `WeeklyReport.metrics` 生成问题结论骨架。

### 明确不做 (Non-goals)

- ❌ 不把叙事长文塞进 `ManualSections.productionReflection`。
- ❌ MVP 不依赖外部 LLM 免审自动发群。
- ❌ 暂不做企微机器人直接发图（先下载 PNG）。

---

## 2. 精简硬约束

| 区块 | 上限 |
| --- | --- |
| 问题 | 最多 3 条；每条结论 + 最多 4 个证据/关键词 |
| 改善 | 最多 4 条；每条一句「动作+对象+机制」 |
| 收益 | 生产/质量/管理各 1 句 |
| 合并 Markdown | 全文建议 ≤ 1200 字 |
| 海报 | 默认 1 页竖屏；超长最多提示分页 |

领导可读结构：

```text
【生产头条】第N周（M.D–M.D）问题—改善—收益
一、问题（2–3 条结论）
二、改善（3–4 条动作）
三、收益（三类各 1 句）
```

---

## 3. 验收标准 (Acceptance Criteria)

1. 使用 `docs/rcfs/新需求.md` 样例长文，规则提炼产出结构化字段且长度符合硬约束；Jest 覆盖解析/生成/校验。
2. `/headline-brief` 可完成：粘贴 → 提炼 → 编辑 → 预览 → 复制/企微推送 → 按周存档。
3. 可导出一页海报 PNG；可从当周 WeeklyReport 指标生成问题骨架。
4. `npm test` 与 `npm run build` 全绿；文档与 CHANGELOG 闭环。
