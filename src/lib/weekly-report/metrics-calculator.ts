import {
  ProductionMetrics,
  QCMetrics,
  OKRMetrics,
  PunchMetrics,
  LeanMetrics,
  WorkshopStats,
  DepartmentStats,
  OverdueDetail,
} from './types';
import {
  STANDARD_WORKSHOPS,
  normalizeDepartmentName,
  getShortDeptName,
} from './department-normalizer';

/**
 * 计算环比增长率 (WoW Rate)
 * 环比 = (本周 - 上周) / 上周 * 100%
 */
export function calculateWowRate(current: number, previous?: number | null): number | null {
  if (previous === undefined || previous === null || previous <= 0) {
    return null;
  }
  const rate = ((current - previous) / previous) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * 格式化环比文字描述
 * 例如：-33.3 -> "环比下跌33%"，15.0 -> "环比增长15%"，0 -> "与上周持平"
 */
export function formatWowText(rate?: number | null): string {
  if (rate === undefined || rate === null) {
    return '';
  }
  if (rate === 0) {
    return '与上周持平';
  }
  const absRate = Math.abs(Math.round(rate));
  if (rate < 0) {
    return `环比下跌${absRate}%`;
  }
  return `环比增长${absRate}%`;
}

/**
 * 计算生产头条各项指标
 */
export function calculateProductionMetrics(
  rows: any[],
  lastWeekTotal?: number | null
): ProductionMetrics {
  const totalCards = rows.length;
  let over24Count = 0;
  let over48Count = 0;
  const over48Details: OverdueDetail[] = [];

  // 车间计数 map
  const workshopCounts: Record<string, number> = {};
  for (const ws of STANDARD_WORKSHOPS) {
    workshopCounts[ws] = 0;
  }

  for (const row of rows) {
    // 停机时长
    const duration = parseFloat(row['停机时长'] || '0') || 0;
    if (duration > 24) over24Count++;
    if (duration > 48) {
      over48Count++;
      over48Details.push({
        id: String(row['卡号'] || ''),
        title: String(row['标题'] || ''),
        workshop: String(row['车间名称'] || ''),
        owner: String(row['责任人'] || ''),
        duration,
      });
    }

    // 车间分布
    const rawWs = String(row['车间名称'] || '').trim();
    const normalizedWs = normalizeDepartmentName(rawWs);
    workshopCounts[normalizedWs] = (workshopCounts[normalizedWs] || 0) + 1;
  }

  // 组装车间统计 (标准 7 车间 + 其他出现过的车间)
  const workshopStats: WorkshopStats[] = Object.entries(workshopCounts).map(([ws, count]) => {
    const percentage = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
    return {
      workshop: ws,
      shortName: getShortDeptName(ws),
      count,
      percentage,
    };
  });

  // 按开卡数降序排序，零开卡排在后
  workshopStats.sort((a, b) => b.count - a.count);

  return {
    totalCards,
    over24Count,
    over48Count,
    over48Details,
    workshopStats,
    wowRate: calculateWowRate(totalCards, lastWeekTotal),
  };
}

/**
 * 计算 QC 头条各项指标
 */
export function calculateQCMetrics(
  rows: any[],
  lastWeekTotal?: number | null
): QCMetrics {
  const totalCards = rows.length;
  let over24Count = 0;
  let over48Count = 0;
  const over48Details: OverdueDetail[] = [];

  for (const row of rows) {
    const duration = parseFloat(row['处理时长'] || '0') || 0;
    if (duration > 24) over24Count++;
    if (duration > 48) {
      over48Count++;
      over48Details.push({
        id: String(row['行号'] || ''),
        title: String(row['问题'] || row['问题描述'] || ''),
        handler: String(row['负责人'] || ''),
        duration,
      });
    }
  }

  return {
    totalCards,
    over24Count,
    over48Count,
    over48Details,
    wowRate: calculateWowRate(totalCards, lastWeekTotal),
  };
}

/**
 * 计算 OKR 指标
 */
export function calculateOKRMetrics(
  rows: any[],
  lastWeekTotal?: number | null
): OKRMetrics {
  const totalCards = rows.length;
  return {
    totalCards,
    wowRate: calculateWowRate(totalCards, lastWeekTotal),
  };
}

/**
 * 计算新随拍 (打卡记录) 指标
 */
export function calculatePunchMetrics(
  rows: any[],
  lastWeekTotal?: number | null
): PunchMetrics {
  const totalPunches = rows.length;
  const deptCounts: Record<string, number> = {};

  for (const row of rows) {
    const rawDept = String(row['部门'] || '').trim();
    const normalizedDept = normalizeDepartmentName(rawDept);
    deptCounts[normalizedDept] = (deptCounts[normalizedDept] || 0) + 1;
  }

  const deptStats: DepartmentStats[] = Object.entries(deptCounts).map(([dept, count]) => {
    const percentage = totalPunches > 0 ? Math.round((count / totalPunches) * 100) : 0;
    return {
      department: dept,
      shortName: getShortDeptName(dept),
      count,
      percentage,
    };
  });

  // 按打卡人次降序排列
  deptStats.sort((a, b) => b.count - a.count);

  return {
    totalPunches,
    deptStats,
    topDepts: deptStats.slice(0, 5),
    wowRate: calculateWowRate(totalPunches, lastWeekTotal),
  };
}

/**
 * 计算精益指标
 */
export function calculateLeanMetrics(
  rows: any[],
  lastWeekTotal?: number | null
): LeanMetrics {
  const totalCards = rows.length;
  const workshopCounts: Record<string, number> = {};

  for (const row of rows) {
    const rawWs = String(row['车间名称'] || '').trim();
    const normalizedWs = normalizeDepartmentName(rawWs);
    workshopCounts[normalizedWs] = (workshopCounts[normalizedWs] || 0) + 1;
  }

  const workshopStats: WorkshopStats[] = Object.entries(workshopCounts).map(([ws, count]) => {
    const percentage = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
    return {
      workshop: ws,
      shortName: getShortDeptName(ws),
      count,
      percentage,
    };
  });

  workshopStats.sort((a, b) => b.count - a.count);

  return {
    totalCards,
    workshopStats,
    wowRate: calculateWowRate(totalCards, lastWeekTotal),
  };
}
