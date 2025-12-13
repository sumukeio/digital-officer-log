"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";

// 1. 获取当前用户的负责区域 (公用)
export async function getUserAreas() {
  const user = await getCurrentUser();
  if (!user || !user.assignedAreas) return [];
  return user.assignedAreas.split(/[,，]/).map(s => s.trim()).filter(Boolean);
}

// ==========================================
//  旧逻辑：基于 Task 表的任务统计
//  (恢复此方法以修复 analysis/page.tsx 报错)
// ==========================================
export async function getAnalysisMetrics(area: string) {
  const user = await getCurrentUser();
  if (!user) return { totalTasks: 0, completedTasks: 0, completionRate: "0" };

  let areaFilter: string[] = [];
  if (area === "all") {
    if (user.assignedAreas) {
      areaFilter = user.assignedAreas.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    }
  } else {
    areaFilter = [area];
  }

  if (areaFilter.length === 0) {
    return { totalTasks: 0, completedTasks: 0, completionRate: "0" };
  }

  const taskWhere = {
    OR: areaFilter.map(a => ({
      location: { contains: a }
    }))
  };

  const totalTasks = await prisma.task.count({ where: taskWhere });
  const completedTasks = await prisma.task.count({
    where: { ...taskWhere, isCompleted: true }
  });

  const completionRate = totalTasks > 0 
    ? ((completedTasks / totalTasks) * 100).toFixed(1) 
    : "0";

  return { totalTasks, completedTasks, completionRate };
}

// ==========================================
//  新逻辑：基于 DailyReport 表的趋势分析
//  (用于 Dashboard 图表)
// ==========================================

// 定义趋势数据结构
type TrendData = {
  date: string;
  production: number;
  qc: number;
  okr: number;
  lean: number;
  ipqc: number;
};

export async function getReportTrend(area: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  // A. 准备区域过滤
  let areaFilter: string[] = [];
  if (area === "all") {
    if (user.assignedAreas) {
      areaFilter = user.assignedAreas.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    }
  } else {
    areaFilter = [area];
  }
  if (areaFilter.length === 0) return [];

  // B. 找到对应指标的题目 ID
  const questions = await prisma.question.findMany({
    where: { isEnabled: true }
  });

  const findQIds = (keyword: string, mustInclude?: string) => {
    return questions
      .filter(q => {
        const hasKeyword = q.label.includes(keyword);
        const hasMust = mustInclude ? q.label.includes(mustInclude) : true;
        return hasKeyword && hasMust;
      })
      .map(q => q.id);
  };

  const productionIds = findQIds("生产头条", "开卡");
  const qcIds = findQIds("QC头条", "开卡");
  const okrIds = findQIds("OKR");
  const leanIds = findQIds("精益");
  const ipqcIds = findQIds("IPQC");

  // C. 生成过去7天的数据
  const daysToLookBack = 7;
  const trendData: TrendData[] = [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysToLookBack - 1));
  startDate.setHours(0, 0, 0, 0);

  // D. 查询日报
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
      answers: true
    }
  });

  // E. 内存聚合计算
  for (let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateLabel = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    
    const dayReports = reports.filter(r => {
      const rDate = new Date(r.createdAt);
      return rDate.getDate() === d.getDate() && rDate.getMonth() === d.getMonth();
    });

    let dayStats = { production: 0, qc: 0, okr: 0, lean: 0, ipqc: 0 };

    dayReports.forEach(report => {
      try {
        const answers = JSON.parse(report.answers || "{}");
        const sumValues = (ids: string[]) => {
          return ids.reduce((sum, id) => sum + (Number(answers[id]) || 0), 0);
        };

        dayStats.production += sumValues(productionIds);
        dayStats.qc += sumValues(qcIds);
        dayStats.okr += sumValues(okrIds);
        dayStats.lean += sumValues(leanIds);
        dayStats.ipqc += sumValues(ipqcIds);
      } catch (e) {
        console.error("JSON 解析失败:", e);
      }
    });

    trendData.push({
      date: dateLabel,
      ...dayStats
    });
  }

  return trendData;
}