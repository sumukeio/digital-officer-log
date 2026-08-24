# 002-tech-stack-and-negative-rules.md — 技术栈与负向禁令清单

> **权威性声明**：本文档映射自根目录 [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md)，明确本仓库的技术栈标准与最高优先级的负向禁令。

---

## 一、本仓库核心技术栈

- **框架与运行时**：Next.js 16 (App Router), React 19, Node.js (>=20)
- **开发语言**：TypeScript 5 (Strict 模式)
- **数据持久层**：Prisma ORM 5.22, PostgreSQL/MySQL/SQLite
- **样式与组件**：TailwindCSS v4, Radix UI, Lucide React
- **测试框架**：Jest 29, React Testing Library, `@testing-library/jest-dom`

---

## 二、标准开发与验证命令

| 目的 | 命令 | 规范说明 |
| --- | --- | --- |
| 本地开发 | `npm run dev` | 启动本地 Next.js 服务 |
| 运行测试 | `npm test` | 每次任务交付前必须执行并通过 |
| 覆盖率检查 | `npm run test:coverage` | 单元与集成测试覆盖率报告 |
| 完整生产构建 | `npm run build` | 执行 `npx prisma generate && next build` |
| 代码静态检查 | `npm run lint` | 执行 Next.js ESLint 检查 |

---

## 三、最高优先级负向禁令 (Negative Rules)

以下踩坑禁令具备最高解释权，严禁违反：

1. **严禁隐式 `any` 与宽松类型忽略**：
   - 必须保持 `strict: true`，严禁在回调、数组方法（`map`/`filter`）或事件参数中漏写类型。
   - 类型转换避免直接盲目断言，必要时通过 `unknown` 过渡：`e as unknown as ClipboardEvent`。
2. **严禁未执行验证即声称任务完成**：
   - 严禁用“应该没问题了”搪塞。必须运行 `npm test` 并出具通过凭据。
3. **严禁私自执行 `git commit` / `git push`**：
   - 无论何种情况，Git 提交权限 100% 归人类所有。
4. **严禁硬删除历史文档与配置**：
   - 历史说明文档必须优雅迁移归档，不可直接 `rm` 删除。
5. **严禁擅自修改业务代码或扩大需求范围**：
   - 当任务为环境/脚手架/文档治理时，严禁顺手修改无关的业务逻辑代码。
6. **严禁连续串行执行下一个 Task**：
   - 每个原子任务完成并出具报告后，**必须强制刹车并等待人类确认**。
