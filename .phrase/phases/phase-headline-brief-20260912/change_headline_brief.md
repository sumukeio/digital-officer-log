# [变更日志] change_headline_brief.md — 阶段变更回溯

> **阶段标识**：`phase-headline-brief-20260912`  
> **更新规则**：时间倒序追加；每个完成的 `taskNNN` 至少一条。

---

## 变更记录

### 2026-09-12 — 海报 A1/B1/C2 落地

- **Modify** `src/lib/headline-brief/poster.ts`（测宽折行、动态高度、单页）
- **Modify** `src/components/headline-brief/PosterExport.tsx`（下载全部模块 / 复制当前）
- **Modify** `src/app/headline-brief/headline-brief-client.tsx`、单测与 CHANGELOG
- **行为说明**：按用户确认组合 A1+B1+C2 实施。

### 2026-09-12 — 体验增强：最终稿可编 / 海报复制 / 海报 v2

- **Modify** `src/app/headline-brief/headline-brief-client.tsx`（方案 A 最终稿编辑）
- **Modify** `src/components/headline-brief/PosterExport.tsx`（复制图片 + 下载）
- **Modify** `src/lib/headline-brief/poster.ts`（海报 v2 结构化绘制）
- **Modify** `src/__tests__/lib/headline-brief.test.ts`、`docs/CHANGELOG.md`、`docs/rcfs/问题与解决.md`
- **行为说明**：用户确认三项需求后落地；推送以最终稿为准；海报视觉按领导一屏卡规格重绘。

### 2026-09-12 — `task016`–`task020` 全栈落地

- **Add** `prisma/schema.prisma` → `HeadlineBrief` 模型与 `User.headlineBriefs`
- **Add** `src/lib/headline-brief/*`（types / distill / markdown / metrics-skeleton / poster）
- **Add** `src/app/actions/headline-brief.ts`
- **Add** `src/app/headline-brief/*`、`src/components/headline-brief/*`
- **Add** `src/__tests__/lib/headline-brief.test.ts`、`actions/headline-brief.test.ts`、`components/HeadlineBrief.test.tsx`
- **Modify** `src/app/dashboard-client.tsx`（导航与快捷入口）
- **Modify** `docs/guide/project-modules-and-features.md`、`docs/README.md`、`docs/CHANGELOG.md`
- **行为说明**：独立「头条周简报」工作台；粘贴提炼、企微推送、海报下载、指标骨架联动。
- **运维注意**：部署前需在可达库执行 `npx prisma db push`（或正式 migrate）创建表。

### 2026-09-12 — `task015` 阶段文档初始化

- **Add** `.phrase/phases/phase-headline-brief-20260912/spec_headline_brief.md`
- **Add** `.phrase/phases/phase-headline-brief-20260912/plan_headline_brief.md`
- **Add** `.phrase/phases/phase-headline-brief-20260912/task_headline_brief.md`
- **Add** `.phrase/phases/phase-headline-brief-20260912/change_headline_brief.md`
- **Modify** `.phrase/docs/CHANGE.md`（切换当前进行阶段）
- **行为说明**：开启头条周简报阶段，锁定精简硬约束与分期里程碑。
