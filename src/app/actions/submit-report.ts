"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/actions/auth";
import { uploadToMinIO } from "@/lib/minio"; // 确保你已创建此文件

// 定义返回状态类型 (给前端 useActionState 使用)
export type FormState = {
  success: boolean;
  message: string;
  timestamp?: number;
} | null;

// ==========================================
// 1. 创建/提交日报 (核心逻辑)
// ==========================================
export async function createDailyReport(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1.1 鉴权：获取当前登录用户
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "登录已过期，请重新登录", timestamp: Date.now() };
  }

  // 1.2 校验：区域权限
  const area = String(formData.get("area") || "");
  const allowedAreas = user.assignedAreas ? user.assignedAreas.split(",").map(s => s.trim()) : [];
  
  // 如果管理员配置了区域限制，且提交的区域不在范围内
  if (allowedAreas.length > 0 && !allowedAreas.includes(area)) {
      return { success: false, message: `您无权在 "${area}" 提交日报`, timestamp: Date.now() };
  }

  // 1.3 数据解析：处理 Summary 和 Answers JSON
  const summary = String(formData.get("summary") || "");
  const answers: Record<string, any> = {};
  
  // 获取所有表单键并去重
  const keys = Array.from(formData.keys());
  const uniqueKeys = new Set(keys);

  // 遍历处理每个字段
  for (const key of uniqueKeys) {
    // 跳过基础字段和 Next.js 内部字段
    if (["area", "summary"].includes(key) || key.startsWith("$ACTION")) continue;

    // A. 处理图片上传 (后缀 _images)
    if (key.endsWith("_images")) {
      const files = formData.getAll(key);
      const imageUrls: string[] = [];
      
      for (const file of files) {
        if (file instanceof File && file.size > 0) {
            try {
                //调用 MinIO 上传工具
                const url = await uploadToMinIO(file, "reports");
                imageUrls.push(url); 
            } catch (e) {
                console.error(`图片上传失败 [${file.name}]:`, e);
                // 如果上传失败，存一个占位符提示，防止整个流程崩溃
                imageUrls.push(`[上传失败] ${file.name}`);
            }
        }
      }

      if (imageUrls.length > 0) {
        const qId = key.replace("_images", "");
        if (!answers[qId]) answers[qId] = {};
        answers[qId].images = imageUrls;
      }
      continue;
    }

    // B. 处理备注 (后缀 _remark)
    if (key.endsWith("_remark")) {
      const val = String(formData.get(key) || "").trim();
      if (val) {
        const qId = key.replace("_remark", "");
        if (!answers[qId]) answers[qId] = {};
        answers[qId].remark = val;
      }
      continue;
    }

    // C. 处理核心答案值 (没有特殊后缀)
    if (!key.includes("_")) {
        const rawVal = formData.get(key);
        if (!answers[key]) answers[key] = {};
        
        if (rawVal === "on") {
            answers[key].value = true; // Switch 开关
        } else {
            const num = Number(rawVal);
            // 如果是有效数字存数字，否则存原字符串
            answers[key].value = isNaN(num) ? rawVal : num;
        }
    }
  }

  // 1.4 写入数据库
  try {
    await prisma.dailyReport.create({
      data: {
        userId: user.id,
        area: area,
        summary: summary,
        answers: JSON.stringify(answers), // 序列化存入
      }
    });
    
    revalidatePath("/"); // 刷新首页数据
    return { success: true, message: "日报提交成功！", timestamp: Date.now() };

  } catch (error) {
    console.error("❌ 提交数据库失败:", error);
    return { success: false, message: "提交失败，请联系管理员", timestamp: Date.now() };
  }
}

// ==========================================
// 2. 读取配置相关
// ==========================================

// 获取所有已启用的题目模板
export async function getEnabledQuestions() {
  return await prisma.question.findMany({
    where: { isEnabled: true },
    orderBy: { order: 'asc' }
  });
}

// 获取当前用户配置 (复用 Auth 逻辑)
export async function getCurrentUserConfig() {
  return await getCurrentUser();
}

// ==========================================
// 3. 读取报表相关 (含时区修正)
// ==========================================

// 获取某月的所有提交记录 (修正为北京时间视角)
export async function getMonthlySubmissionStats(year: number, month: number) {
  // 构造查询范围：UTC 时间通常比北京时间慢8小时
  // 为了确保囊括所有可能的记录，我们查询前后各宽限一天
  const startSearch = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  startSearch.setDate(startSearch.getDate() - 1);

  const endSearch = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
  endSearch.setDate(endSearch.getDate() + 1);

  const user = await getCurrentUser();
  if (!user) return [];

  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startSearch,
        lte: endSearch
      }
    },
    select: { date: true }
  });

  // 将数据库取出的 UTC 时间，强行加上 8 小时，转换为北京时间对象返回给前端
  return reports.map(r => new Date(r.date.getTime() + 8 * 60 * 60 * 1000));
}

// 获取指定日期的日报详情 (修正为北京时间视角)
export async function getReportDetail(dateStr: string) {
  // 校验日期格式 YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // JS月份 0-11
  const day = parseInt(match[3]);

  // 构造 UTC 查询区间，对应北京时间的 00:00:00 到 23:59:59
  // 北京时间 00:00 = UTC 前一天 16:00
  const start = new Date(Date.UTC(year, month, day, -8, 0, 0, 0)); 
  // 北京时间 23:59:59 = UTC 当天 15:59:59
  const end = new Date(Date.UTC(year, month, day, 15, 59, 59, 999));

  const user = await getCurrentUser();
  if (!user) return null;

  const report = await prisma.dailyReport.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: start,
        lte: end
      }
    },
    include: { user: true }
  });

  return report;
}