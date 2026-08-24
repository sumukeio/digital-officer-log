# Digital Officer Log (数字化专员工作日志系统)

> 数字化专员工作日志、任务看板、指标分析与知识库管理系统。  
> 本项目遵循 [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md) 严格 Doc-Driven 工程治理体系与 7 大铁律。

---

## 🚀 快速启动

### 1. 环境要求
- Node.js >= 20.0.0
- npm / pnpm / yarn

### 2. 安装与运行
```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 启动开发服务器
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

### 3. 自动化测试与构建
```bash
# 运行 Jest 自动化测试 (交付必测)
npm test

# 运行测试覆盖率
npm run test:coverage

# 执行生产全量构建 (带严格类型检查)
npm run build
```

---

## 🛠️ 技术栈选型

- **全栈框架**：Next.js 16 (App Router) + React 19
- **开发语言**：TypeScript 5 (Strict 模式)
- **数据层**：Prisma ORM 5.22
- **UI 体系**：TailwindCSS v4 + Radix UI + Lucide Icons + Recharts
- **测试框架**：Jest 29 + React Testing Library + `@testing-library/jest-dom`

---

## 📖 工程规范与文档导航

项目的文档与研发管理遵循**单一事实来源**原则：

| 模块 | 说明 | 快速跳转 |
| --- | --- | --- |
| **工程开发总守则** | 7 大铁律、五步工作流与负向禁令 | [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md) |
| **业务文档总索引** | 知识库与操作指引全局路由表 | [docs/README.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/README.md) |
| **全量变更日志** | 项目历史发布与各阶段功能变更记录 | [docs/CHANGELOG.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/CHANGELOG.md) |
| **研发生命周期** | `.phrase/` 阶段治理与当前任务 | [.phrase/docs/CHANGE.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/docs/CHANGE.md) |
| **测试规范指南** | Jest 编写与单测执行指引 | [docs/guide/testing-guide.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/testing-guide.md) |
| **排错与构建指南** | 部署排查与 `dev` vs `build` 差异剖析 | [docs/guide/deployment-troubleshooting.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/deployment-troubleshooting.md) |
