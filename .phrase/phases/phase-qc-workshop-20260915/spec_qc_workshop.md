# [阶段说明书] spec_qc_workshop.md — QC 头条按车间统计与导出

> **阶段标识**：`phase-qc-workshop-20260915`  
> **状态**：[权威/现行]  
> **创建日期**：2026-09-15  
> **需求输入**：[docs/rcfs/RFC002.md](file:///d:/j/OpenProject/Nextproject/digital-officer-log/docs/rcfs/RFC002.md)（第一节已锁定决策）

---

## 一、阶段背景与核心目标

### 1. 背景

QC 头条 Excel 无车间列；领导汇报需要按车间统计，再交给海铭德 AI 出「问题—改善—收益」精简稿。数字官第一版负责 **归属 + 统计 + 导出 + Prompt**，叙事仍最大化利用海铭德 AI。

### 2. Goals

- [x] 机台映射表导入系统 + 别名规则（T001→二部、喷绘→七部、无前缀装箱/吸塑→九部等）
- [x] QC 行按车间聚合（TOP 问题、条数占比）
- [x] 导出分析 xlsx（全厂概览 + 有数据车间各 Sheet + 未归类）
- [x] 导出单文件纯文本（有数据的部门分章节；不含完整 Prompt）
- [x] UI：复制全厂/分车间 Prompt（硬约束同 headline-brief）
- [x] 数据源优先复用 weekly-summary 同源 QC；可兜底上传

### 3. Non-goals

- ❌ 自动调用 DeepSeek / 海铭德 API
- ❌ 本阶段接入 `/headline-brief` 海报与企微
- ❌ 装箱/吸塑独立汇报单元
- ❌ 要求海铭德导出增加车间列

---

## 二、功能要点

1. **归属引擎**：映射表 + 后缀匹配 + 文本含部 + 别名表 + 未归类  
2. **聚合**：7 标准车间；全厂 TOP；分车间 TOP（对标参考不良 TOP 表思路）  
3. **导出**：xlsx + txt；Prompt 仅复制按钮  
4. **维护**：映射表可重新导入；未归类列表可提示补别名  

---

## 三、验收标准

- [x] 样例 `生产头条_20260915143729.xlsx` + `机台映射表.xlsx`：归属与别名符合 RFC002；未归类可解释  
- [x] 导出 xlsx：有全厂概览；仅有数据车间有 Sheet；有未归类则含该 Sheet  
- [x] 导出 txt：有数据部门分章节；无完整 Prompt 正文  
- [x] 复制 Prompt：含日期区间、模块【QC头条】、统计摘要、问题/改善/收益硬约束  
- [x] `npm test` / `npm run build` 通过；CHANGELOG 闭环  
