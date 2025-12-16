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
//  (保持不变，用于 analysis/page.tsx)
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
//  (核心修复区域)
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

  // B. 找到对应指标的题目 ID (关键词匹配)
  const questions = await prisma.question.findMany({
    where: { isEnabled: true }
  });

  const findQIds = (keyword: string) => {
    return questions
      .filter(q => q.label.includes(keyword))
      .map(q => q.id);
  };

  // 根据你提供的题目名称进行匹配
  // "1、生产头条..." / "3、QC头条..." / "5、OKR..."
  const productionIds = findQIds("生产头条");
  const qcIds = findQIds("QC头条");
  const okrIds = findQIds("OKR");
  const leanIds = findQIds("精益");
  const ipqcIds = findQIds("IPQC");

  // C. 生成过去7天的数据
  const daysToLookBack = 7;
  const trendData: TrendData[] = [];

  // 设定查询结束时间为今天 23:59:59
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  // 设定查询开始时间为7天前的 00:00:00
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysToLookBack - 1));
  startDate.setHours(0, 0, 0, 0);

  // D. 查询日报 (使用 date 字段查询)
  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
      OR: areaFilter.map(a => ({
        area: { contains: a }
      }))
    },
    select: {
      date: true,
      answers: true
    }
  });

  // E. 内存聚合计算
  for (let i = daysToLookBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateLabel = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    
    // 按日期分组 (年月日都要匹配)
    const dayReports = reports.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getDate() === d.getDate() && 
             rDate.getMonth() === d.getMonth() &&
             rDate.getFullYear() === d.getFullYear();
    });

    let dayStats = { production: 0, qc: 0, okr: 0, lean: 0, ipqc: 0 };

    dayReports.forEach(report => {
      try {
        const answers = JSON.parse(report.answers || "{}");
        
        // ▼▼▼ 核心修复：正确读取对象里的 .value ▼▼▼
        const sumValues = (ids: string[]) => {
          return ids.reduce((sum, id) => {
            const item = answers[id];
            if (!item) return sum; // 如果该题没填，跳过

            let val = 0;
            // 情况1: 新版数据结构 { value: 10, remark: "..." }
            if (typeof item === 'object' && item.value !== undefined) {
               val = Number(item.value);
            } 
            // 情况2: 兼容旧数据 (如果直接存了数字或字符串)
            else if (typeof item === 'number' || typeof item === 'string') {
               val = Number(item);
            }

            return sum + (isNaN(val) ? 0 : val);
          }, 0);
        };
        // ▲▲▲ 修复结束 ▲▲▲

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