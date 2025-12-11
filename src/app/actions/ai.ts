"use server";

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

const openai = new OpenAI({
  baseURL: "https://api.lkeap.cloud.tencent.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function generateWeeklySummary() {
  const user = await getCurrentUser();
  if (!user) return "请先登录";

  // 1. 获取最近 7 天的日报
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      date: { gte: sevenDaysAgo }
    },
    orderBy: { date: 'asc' }
  });

  if (reports.length === 0) return "本周暂无日报数据，无法生成总结。";

  // ▼▼▼ 新增步骤：获取所有题目定义，建立 ID -> 标题 的映射字典 ▼▼▼
  const allQuestions = await prisma.question.findMany();
  const questionMap = new Map<string, string>();
  const questionTypeMap = new Map<string, string>(); // 顺便记录类型

  allQuestions.forEach(q => {
    // 截取 label 的前半部分，去掉后面冗长的说明，让 AI 读起来更清爽
    // 比如 "1、生产头条...? 内容是否..." -> "1、生产头条"
    const simpleLabel = q.label.split('？')[0].split('?')[0];
    questionMap.set(q.id, simpleLabel);
    questionTypeMap.set(q.id, q.type);
  });

  // 2. 数据清洗 (翻译 ID 为中文标题)
  const reportTexts = reports.map(r => {
    let readableContent = "";

    try {
      const answers = JSON.parse(r.answers);

      // 遍历每个回答
      for (const [qId, data] of Object.entries(answers)) {
        const label = questionMap.get(qId);
        if (!label) continue; // 如果题目已被删除，跳过

        const typedData = data as { value: any, remark?: string };
        let displayValue = typedData.value;

        // 优化布尔值的显示
        if (questionTypeMap.get(qId) === 'boolean') {
          if (displayValue === true) displayValue = "正常/是";
          else if (displayValue === false) displayValue = "异常/否";
        }

        readableContent += `- ${label}: ${displayValue}`;
        if (typedData.remark) {
          readableContent += ` (备注: ${typedData.remark})`;
        }
        readableContent += "\n";
      }
    } catch (e) {
      readableContent = "数据解析错误";
    }

    return `
=== 日期: ${r.date.toLocaleDateString()} ===
区域: ${r.area}
个人总结: ${r.summary || '无'}
详细数据:
${readableContent}
`;
  }).join("\n");

  // 3. 调用 AI
  try {
    console.log("正在调用腾讯云 DeepSeek API...");
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "你是一名工厂数字化助手。请根据提供的日报数据生成周报。数据格式为“题目: 值”。请忽略“正常/是”的项目，重点总结：1. 产出数量的统计与趋势；2. 所有标记为“异常/否”的项目；3. 备注中的关键问题。Markdown格式。" },
        { role: "user", content: reportTexts }
      ],
      model: "deepseek-v3",
    });

    return completion.choices[0].message.content || "生成失败";
  } catch (error: any) {
    console.error("AI Error Details:", error);
    return `AI 服务不可用: ${error.message || "未知错误"}`;
  }
}