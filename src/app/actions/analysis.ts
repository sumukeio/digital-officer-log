"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";

// 1. 获取用户区域 (保持不变)
export async function getUserAreas() {
  const user = await getCurrentUser();
  if (!user || !user.assignedAreas) return [];
  return user.assignedAreas.split(/[,，]/).map(s => s.trim()).filter(Boolean);
}

// 定义趋势数据结构
type TrendData = {
  date: string;
  production: number;
  qc: number;
  okr: number;
  lean: number;
  ipqc: number;
};

// 2. 获取日报指标趋势 (适配 JSON 存储结构)
export async function getReportTrend(area: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  // --- A. 准备区域过滤 ---
  let areaFilter: string[] = [];
  if (area === "all") {
    if (user.assignedAreas) {
      areaFilter = user.assignedAreas.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    }
  } else {
    areaFilter = [area];
  }
  if (areaFilter.length === 0) return [];

  // --- B. 关键步骤：找到对应指标的题目 ID ---
  // 我们需要从 Question 表里找出哪些题目对应我们要统计的指标
  // 假设 answers JSON 的 key 是 Question.id
  const questions = await prisma.question.findMany({
    where: { isEnabled: true }
  });

  // 根据 label 关键字模糊匹配找到对应的 Question ID
  // 注意：这里增加了 "开卡" 关键字，防止匹配到 "关卡" 或其他题目
  const findQIds = (keyword: string, mustInclude?: string) => {
    return questions
      .filter(q => {
        const hasKeyword = q.label.includes(keyword);
        const hasMust = mustInclude ? q.label.includes(mustInclude) : true;
        return hasKeyword && hasMust;
      })
      .map(q => q.id);
  };

  const productionIds = findQIds("生产头条", "开卡"); // 匹配 "生产头条" 且包含 "开卡"
  const qcIds = findQIds("QC头条", "开卡");         // 匹配 "QC头条" 且包含 "开卡"
  const okrIds = findQIds("OKR");
  const leanIds = findQIds("精益");
  const ipqcIds = findQIds("IPQC");

  console.log("🔍 [Debug] 指标映射 ID:", { productionIds, qcIds, okrIds, leanIds, ipqcIds });

  // --- C. 生成过去7天的数据 ---
  const daysToLookBack = 7;
  const trendData: TrendData[] = [];

  // 计算时间范围：7天前的 00:00 到 今天的 23:59
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysToLookBack - 1));
  startDate.setHours(0, 0, 0, 0);

  // --- D. 一次性查出所有相关日报 (比循环查库性能更好) ---
  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: startDate,
      },
      OR: areaFilter.map(a => ({
        area: { contains: a }
      }))
    },
    select: {
      createdAt: true,
      answers: true // 取出 JSON 字符串
    }
  });

  // --- E. 在内存中按天分组并计算 ---
  for (let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateLabel = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    
    // 筛选当天的日报
    const dayReports = reports.filter(r => {
      const rDate = new Date(r.createdAt);
      return rDate.getDate() === d.getDate() && rDate.getMonth() === d.getMonth();
    });

    let dayStats = { production: 0, qc: 0, okr: 0, lean: 0, ipqc: 0 };

    // 遍历当天的每一份日报，解析 JSON 并累加
    dayReports.forEach(report => {
      try {
        const answers = JSON.parse(report.answers || "{}");
        
        // 辅助函数：累加指定 ID 列表在 answers 中的值
        const sumValues = (ids: string[]) => {
          return ids.reduce((sum, id) => {
            const val = answers[id];
            // 确保转为数字，处理可能的字符串 "5" 或 null
            return sum + (Number(val) || 0);
          }, 0);
        };

        dayStats.production += sumValues(productionIds);
        dayStats.qc += sumValues(qcIds);
        dayStats.okr += sumValues(okrIds);
        dayStats.lean += sumValues(leanIds);
        dayStats.ipqc += sumValues(ipqcIds);

      } catch (e) {
        console.error("❌ JSON 解析失败:", e);
      }
    });

    trendData.push({
      date: dateLabel,
      ...dayStats
    });
  }

  return trendData;
}