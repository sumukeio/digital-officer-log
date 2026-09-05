"use server";

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";

function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "dummy-key-not-configured";
  return new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.lkeap.cloud.tencent.com/v1",
    apiKey,
  });
}

// 获取默认的 AI Prompt（如果配置中没有，使用默认值）
async function getAIPrompt(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "ai_summary_prompt" }
    });
    
    if (config && config.value) {
      return config.value;
    }
  } catch (e) {
    console.error("获取 AI Prompt 失败，使用默认 Prompt:", e);
  }
  
  // 默认 Prompt
  return "你是一名工厂数字化助手。请根据提供的日报数据生成周报。数据格式为\"题目: 值\"。请忽略\"正常/是\"的项目，重点总结：1. 产出数量的统计与趋势；2. 所有标记为\"异常/否\"的项目；3. 备注中的关键问题。Markdown格式。";
}

export async function generateWeeklySummary() {
  const user = await getCurrentUser();
  if (!user) return "请先登录";

  // 1. 获取最近 7 天的日报
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const endDate = new Date();

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

  // 3. 从配置中获取 Prompt
  const systemPrompt = await getAIPrompt();

  // 4. 调用 AI
  let summaryContent = "";
  try {
    if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
      return "AI 服务未配置 API Key（如需使用 AI 总结功能，请在服务端环境变量中设置 DEEPSEEK_API_KEY）";
    }

    console.log("正在调用腾讯云 DeepSeek API...");
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: reportTexts }
      ],
      model: "deepseek-v3",
    });

    summaryContent = completion.choices[0].message.content || "生成失败";
  } catch (error: any) {
    console.error("AI Error Details:", error);
    summaryContent = `AI 服务不可用: ${error.message || "未知错误"}`;
    return summaryContent; // 如果AI调用失败，直接返回错误信息，不保存记录
  }

  // 5. 保存总结记录到数据库
  try {
    await prisma.aISummary.create({
      data: {
        userId: user.id,
        content: summaryContent,
        startDate: sevenDaysAgo,
        endDate: endDate,
      }
    });
  } catch (error) {
    console.error("保存AI总结记录失败:", error);
    // 即使保存失败，也返回生成的总结内容
  }

  return summaryContent;
}

// 获取当前用户的所有AI总结记录
export async function getUserAISummaries() {
  const user = await getCurrentUser();
  if (!user) return [];

  const summaries = await prisma.aISummary.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    }
  });

  return summaries;
}