import { ShiftWorker, ShiftAlert, ShiftWorkerStatus, ShiftCheckResult } from './types';
import { buildShiftMarkdownMessage } from './wecom-notifier';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 安全解析日期为本地零点 Date 对象 (避免时区导致的跨天偏差)
 */
export function parseDateSafe(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }

  if (typeof dateInput === 'string') {
    const parts = dateInput.trim().split(/[-/]/);
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2].slice(0, 2), 10);
      return new Date(y, m, d, 0, 0, 0, 0);
    }
  }

  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * 格式化为 YYYY-MM-DD
 */
export function formatDateSafe(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 格式化为 MM-DD
 */
export function formatMonthDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}-${day}`;
}

/**
 * 获取中文星期 (周一 ~ 周日)
 */
export function getWeekdayStr(d: Date): string {
  return WEEKDAYS[d.getDay()];
}

/**
 * 白班 <-> 夜班 智能翻转
 */
export function flipShift(currentShift: string): string {
  if (!currentShift) return '白班';
  if (currentShift.includes('白')) return '夜班';
  if (currentShift.includes('夜') || currentShift.includes('晚')) return '白班';
  if (currentShift.includes('早')) return '中班';
  if (currentShift.includes('中')) return '夜班';
  return currentShift === '白班' ? '夜班' : '白班';
}

/**
 * 自愈机制：如果某员工的历史转班日期已经过去 (shiftDate < today)
 * 自动根据周期递推到大于等于今天的下一个正确转班日，并自动翻转对应班次
 */
export function selfHealWorker(
  worker: ShiftWorker,
  todayInput: Date = new Date()
): { worker: ShiftWorker; hasHealed: boolean } {
  const today = parseDateSafe(todayInput);
  let shiftDate = parseDateSafe(worker.shiftDate);
  const cycle = worker.cycleDays && worker.cycleDays > 0 ? worker.cycleDays : 14;
  let targetShift = worker.targetShift || '白班';

  let hasHealed = false;
  while (shiftDate.getTime() < today.getTime()) {
    shiftDate.setDate(shiftDate.getDate() + cycle);
    targetShift = flipShift(targetShift);
    hasHealed = true;
  }

  const updatedWorker: ShiftWorker = {
    ...worker,
    shiftDate: formatDateSafe(shiftDate),
    targetShift,
    cycleDays: cycle,
  };

  return { worker: updatedWorker, hasHealed };
}

/**
 * 计算单个员工相对于今日的状态与描述
 */
export function calculateWorkerStatus(
  worker: ShiftWorker,
  todayInput: Date = new Date()
): ShiftWorkerStatus {
  const today = parseDateSafe(todayInput);
  const shiftDate = parseDateSafe(worker.shiftDate);

  const diffMs = shiftDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let statusTag: 'today' | 'tomorrow' | 'upcoming' | 'past' = 'upcoming';
  let statusDesc = `${diffDays}天后`;
  let statusColor = worker.targetShift.includes('夜') ? 'warning' : 'info';

  if (diffDays === 0) {
    statusTag = 'today';
    statusDesc = '【今天转班】';
  } else if (diffDays === 1) {
    statusTag = 'tomorrow';
    statusDesc = '【明天转班】';
  } else if (diffDays < 0) {
    statusTag = 'past';
    statusDesc = '已生效';
  }

  return {
    worker,
    shiftDateStr: formatDateSafe(shiftDate),
    monthDayStr: formatMonthDay(shiftDate),
    weekdayStr: getWeekdayStr(shiftDate),
    diffDays,
    statusTag,
    statusDesc,
    statusColor,
  };
}

/**
 * 核心排班处理流程 (自愈、明日判定、推演下周期、排序及生成 Markdown)
 */
export function processShiftSchedule(
  workers: ShiftWorker[],
  options?: {
    today?: Date;
    forceNotify?: boolean;
    isTest?: boolean;
  }
): ShiftCheckResult {
  const today = parseDateSafe(options?.today || new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowStr = formatDateSafe(tomorrow);

  let dataChanged = false;
  const healedWorkers: ShiftWorker[] = [];
  const tomorrowAlerts: ShiftAlert[] = [];

  // 1. 运行历史过期数据自愈算法
  for (const rawWorker of workers) {
    const { worker: healed, hasHealed } = selfHealWorker(rawWorker, today);
    if (hasHealed) {
      dataChanged = true;
    }
    healedWorkers.push(healed);
  }

  // 2. 检测明天是否有人转班，并推演下一周期
  const finalWorkers: ShiftWorker[] = [];
  for (const worker of healedWorkers) {
    const shiftDate = parseDateSafe(worker.shiftDate);
    const cycle = worker.cycleDays && worker.cycleDays > 0 ? worker.cycleDays : 14;

    if (worker.shiftDate === tomorrowStr || shiftDate.getTime() === tomorrow.getTime()) {
      // 明天转班触发：推算下下个周期并翻转
      const nextShiftDate = new Date(shiftDate);
      nextShiftDate.setDate(nextShiftDate.getDate() + cycle);
      const nextTargetShift = flipShift(worker.targetShift);

      tomorrowAlerts.push({
        name: worker.name,
        targetShift: worker.targetShift,
        nextDate: formatDateSafe(nextShiftDate),
        nextShift: nextTargetShift,
        cycleDays: cycle,
      });

      // 记录已进入下个周期的员工状态
      finalWorkers.push({
        ...worker,
        shiftDate: formatDateSafe(nextShiftDate),
        targetShift: nextTargetShift,
        cycleDays: cycle,
      });
      dataChanged = true;
    } else {
      finalWorkers.push(worker);
    }
  }

  // 3. 计算全员状态展示 (按转班日期升序排列)
  const allStatuses: ShiftWorkerStatus[] = finalWorkers
    .map((w) => calculateWorkerStatus(w, today))
    .sort((a, b) => a.diffDays - b.diffDays || a.worker.name.localeCompare(b.worker.name, 'zh-CN'));

  // 4. 生成企业微信 Markdown 消息
  const markdownMessage = buildShiftMarkdownMessage({
    today,
    tomorrow,
    tomorrowAlerts,
    allStatuses,
    isTest: options?.isTest,
  });

  return {
    today,
    tomorrow,
    todayStr: formatDateSafe(today),
    tomorrowStr: formatDateSafe(tomorrow),
    dataChanged,
    healedWorkers: finalWorkers,
    tomorrowAlerts,
    allStatuses,
    markdownMessage,
  };
}
