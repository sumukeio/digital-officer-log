# 业务知识库与工程文档总索引 (docs/README.md)

> **状态**：[权威/现行]  
> **单一事实来源**：`docs/` 是本项目的业务知识库与运行维护的唯一权威源。所有文档的新增与移动必须同步更新本路由表。

---

## 🧭 「你要找什么 $\rightarrow$ 打开哪个文件」全局路由表

| 你要找什么？ | 目标文件 / 目录 | 简要说明 |
| --- | --- | --- |
| **工程开发总守则与 7 大铁律** | [AGENTS.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/AGENTS.md) | 跨 IDE、CLI 及 Agent 的总工程守则与最高仲裁基准 |
| **Antigravity 规则库** | [.agents/rules/](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.agents/rules/) | Antigravity 原生规则库 (治理总则、Doc-Driven、技术栈与禁令) |
| **Cursor 规则库** | [.cursor/rules/](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.cursor/rules/) | Cursor 兼容规则库 (.mdc 规范文件) |
| **项目生命周期与任务推进** | [.phrase/docs/README.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/docs/README.md) | `.phrase/` 阶段精细化研发管理体系说明 |
| **变更总索引与当前阶段** | [.phrase/docs/CHANGE.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/docs/CHANGE.md) | 维护当前进行中阶段链接与阶段回溯索引 |
| **缺陷与问题追踪** | [.phrase/docs/ISSUES.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/.phrase/docs/ISSUES.md) | 缺陷与 Issue 登记追踪台账 |
| **仓库全量变更日志** | [docs/CHANGELOG.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/CHANGELOG.md) | 规范的 Keep a Changelog 格式历史日志 (只追加不覆盖) |
| **系统模块与功能全景** | [docs/guide/project-modules-and-features.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/project-modules-and-features.md) | 全量业务模块、功能清单与系统技术架构的全景参考 |
| **自动化测试指引** | [docs/guide/testing-guide.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/testing-guide.md) | Jest + RTL 测试运行、编写规范与单测用例说明 |
| **宝塔面板内网部署指南** | [docs/guide/bt-panel-deployment-guide.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/bt-panel-deployment-guide.md) | Linux 内网服务器 + 宝塔面板环境部署、Nginx 反代与日常运维全流程 |
| **部署失败排错指南** | [docs/guide/deployment-troubleshooting.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/deployment-troubleshooting.md) | 类型错误、缺失参数、环境变量等部署常见故障排除 |
| **开发与生产构建差异剖析** | [docs/guide/why-deployment-fails.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/guide/why-deployment-fails.md) | 深入解析 `next dev` 与 `next build` 严格模式差异 |
| **架构决策记录 (ADR)** | [docs/adr/](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/adr/) | 重大架构变更、破坏性升级与模型变动决策记录 |
| **历史归档区** | [docs/archive/](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/archive/) | 优雅归档的过时文档与历史素材 |

---

## 📚 目录结构全貌

```text
digital-officer-log/
├── AGENTS.md                  # 工程治理总规范与最高仲裁基准
├── README.md                  # 项目门户与快速上手
├── .agents/                   # Antigravity 原生规则库
│   └── rules/
├── .cursor/                   # Cursor 规则库
│   └── rules/
├── .phrase/                   # 研发阶段生命周期治理
│   ├── docs/                  # CHANGE.md, ISSUES.md, README.md
│   ├── phases/                # 阶段实例 (phase-<purpose>-<YYYYMMDD>)
│   └── templates/             # spec, plan, task, change, tech-refer, adr 模板
├── docs/                      # 业务知识库单一事实来源
│   ├── README.md              # 本文档 (全局文档索引与路由)
│   ├── CHANGELOG.md           # 全量历史变更日志
│   ├── guide/                 # 主线操作与技术指引
│   ├── adr/                   # 架构决策记录
│   └── archive/               # 优雅归档历史文档
├── prisma/                    # 数据库 schema 与迁移
└── src/                       # 应用源代码与 Jest 测试套件
```
