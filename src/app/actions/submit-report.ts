"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { uploadToMinIO } from "@/lib/minio";
import { redirect } from "next/navigation";

export type FormState = {
  success?: boolean;
  message?: string;
} | null;

// 获取启用的题目
export async function getEnabledQuestions() {
  return await prisma.question.findMany({
    where: { isEnabled: true },
    orderBy: { order: "asc" },
  });
}

// 获取当前用户信息 (用于填写页)
export async function getCurrentUserConfig() {
  return await getCurrentUser();
}

// 提交日报 (Server Action)
export async function createDailyReport(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "未登录或会话已过期" };
    }

    // 1. 提取基础字段
    const area = formData.get("area") as string;
    const summary = formData.get("summary") as string;

    if (!area) {
      return { success: false, message: "请选择负责区域" };
    }

    // 2. 提取题目回答 (过滤掉固定字段)
    // 我们需要遍历 FormData，找出所有题目ID对应的 value
    const rawData = Object.fromEntries(formData.entries());
    const answers: Record<string, any> = {};

    // 获取所有题目ID列表以便匹配
    const questions = await prisma.question.findMany({ select: { id: true, type: true } });
    const questionMap = new Map(questions.map(q => [q.id, q.type]));

    for (const [key, val] of Object.entries(rawData)) {
        // 跳过非题目字段 (包含系统字段和我们在Form里用的临时字段)
        if (["area", "summary", "$ACTION_ID"].includes(key)) continue;
        if (key.endsWith("_remark") || key.endsWith("_images")) continue; // 备注和图片单独处理

        // 如果 key 是题目 ID
        if (questionMap.has(key)) {
            let value: any = val;
            const type = questionMap.get(key);

            // 类型转换
            if (type === 'number') value = Number(val);
            if (type === 'boolean') value = val === 'on';
            if (type === 'checkbox' || type === 'dynamic_list') {
                // checkbox 和 dynamic_list 的值是 JSON 字符串
                try {
                    value = JSON.parse(val as string);
                } catch {
                    value = val;
                }
            }

            // 获取备注
            const remark = formData.get(`${key}_remark`) as string;
            
            // 获取图片 (处理多文件上传)
            // 注意：report-form.tsx 里图片 input 的 name 是 `${key}_images`
            const imageFiles = formData.getAll(`${key}_images`);
            const imageUrls: string[] = [];
            
            for (const file of imageFiles) {
                if (file instanceof File && file.size > 0) {
                    try {
                        const url = await uploadToMinIO(file, "reports"); // 上传到 MinIO
                        imageUrls.push(url);
                    } catch (e) {
                        console.error(`Image upload failed for ${key}:`, e);
                    }
                }
            }

            answers[key] = {
                value,
                remark: remark || "",
                images: imageUrls // 存入图片链接数组
            };
        }
    }

    // 处理 Summary 的图片
    const summaryFiles = formData.getAll("summary_images"); // 假设前端 summary 图片 input name 为 summary_images
    // (实际上你的 report-form.tsx 里 ImageUploader id="summary" 会生成 name="summary_images")
    // 但 summary 字段是纯文本，如果 summary 也要带图，我们需要把 summary 的图片也放进 answers 里的特殊字段，或者存到 summary 文本里？
    // 为了简单，我们通常把 summary 图片也当作一个特殊的 "answer" 存起来，或者拼接到 summary 文本后
    // 这里暂时不做特殊处理，如果需要 summary 图片，建议在 Question 表里加一个 "今日总结" 的题目。
    // *修正*：看你的 report-form，summary 确实有 ImageUploader。我们把它存到 answers 里的 "summary_images" 键里吧。
    const summaryImageUrls: string[] = [];
    for (const file of summaryFiles) {
        if (file instanceof File && file.size > 0) {
             const url = await uploadToMinIO(file, "reports");
             summaryImageUrls.push(url);
        }
    }
    if (summaryImageUrls.length > 0) {
        answers["summary_images"] = { value: "summary_media", images: summaryImageUrls };
    }


    // 3. 存入数据库
    await prisma.dailyReport.create({
      data: {
        userId: user.id,
        area,
        summary,
        // ▼▼▼ 修复报错的核心代码：手动加上 date 字段 ▼▼▼
        date: new Date(), 
        answers: JSON.stringify(answers),
      },
    });

    revalidatePath("/");
    return { success: true, message: "日报提交成功！" };

  } catch (error) {
    console.error("Submit Error:", error);
    return { success: false, message: "提交失败，请重试" };
  }
}

// 获取月度提交状态 (用于日历)
export async function getMonthlySubmissionStats(year: number, month: number) {
  const user = await getCurrentUser();
  if (!user) return [];

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: { date: true },
  });

  return reports.map((r) => r.date);
}

// ▼▼▼ 新增：获取单日详情 ▼▼▼
export async function getReportDetail(dateStr: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  // 解析日期字符串 YYYY-MM-DD
  // 注意：这里需要处理时区，为了简单起见，我们查找当天的范围
  const date = new Date(dateStr);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  // 1. 查找日报
  const report = await prisma.dailyReport.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // 2. 获取题目定义 (为了把 answers 里的 ID 翻译成中文标题)
  const questions = await prisma.question.findMany({
    orderBy: { order: 'asc' }
  });

  return { report, questions };
}

export async function getDayReports(dateStr: string) {
  const user = await getCurrentUser();
  if (!user) return { reports: [], questions: [] };

  // 1. 暴力且稳妥的日期范围处理
  // dateStr 格式应该是 "2025-12-12"
  // 我们手动拼出当天的 UTC 起止时间，或者利用 date-fns，这里用原生最稳妥
  const startDate = new Date(`${dateStr}T00:00:00.000Z`);
  const endDate = new Date(`${dateStr}T23:59:59.999Z`);

  // 为了防止时区偏移导致找不到（比如你是在 UTC+8 存的），
  // 我们稍微放宽一点范围，或者更简单的：
  // 既然我们在保存时通常只存日期部分，我们可以假设 date 字段存的是当天的某个时刻。
  
  // 修正：我们不假设时区，直接构造一个极其宽的范围，覆盖所有可能的时区偏差
  // 只要数据库里的 date 也是这一天即可
  // 但最精准的做法是：相信传入的 dateStr 就是用户看到的日期
  // 让我们用一个更宽松的查询：前一天23点到第二天23点（覆盖时区差）
  // 还是走标准路子，但在 dashboard-client 传参时要确保格式正确
  
  // 方案 B：如果你的 date 字段存的是纯日期（00:00:00），我们可以试试直接匹配
  // 但 findMany 不支持直接等于某一天。
  
  // 最终修正版逻辑：
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0); // 强制 UTC 0点
  
  const end = new Date(dateStr);
  end.setUTCHours(23, 59, 59, 999); // 强制 UTC 23点

  console.log(`🔍 [Debug] 查询日报范围: ${start.toISOString()} - ${end.toISOString()} 用户: ${user.name}`);

  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      createdAt: 'asc',
    }
  });

  console.log(`✅ [Debug] 查找到 ${reports.length} 条日报`);

  const questions = await prisma.question.findMany({
    where: { isEnabled: true },
    orderBy: { order: "asc" },
  });

  return { reports, questions };
}