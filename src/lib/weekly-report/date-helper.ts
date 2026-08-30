import { DateRangeInfo } from './types';

/**
 * 获取指定日期的所在自然周 (周一至周日)
 * 默认以当前系统日期为基准
 */
export function getDefaultWeekRange(dateInput: Date = new Date()): DateRangeInfo {
  const current = new Date(dateInput);
  
  // 获取当前星期几 (0是周日, 1是周一, ..., 6是周六)
  const day = current.getDay();
  // 计算距离本周一的天数差 (周日视为本周最后一天，距离周一 -6 天)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  const startFormatted = `${monday.getMonth() + 1}.${monday.getDate()}`;
  const endFormatted = `${sunday.getMonth() + 1}.${sunday.getDate()}`;
  const titleFormatted = `${startFormatted}-${endFormatted}`;

  // 计算周数 (ISO Week number)
  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  return {
    startDate: formatDateStr(monday),
    endDate: formatDateStr(sunday),
    startFormatted,
    endFormatted,
    titleFormatted,
    year: monday.getFullYear(),
    weekNumber,
  };
}

/**
 * 根据起止日期生成标准周报标题
 * 如 "8.17-8.23周报"
 */
export function formatWeekTitle(startDateStr: string, endDateStr: string): string {
  const s = new Date(startDateStr);
  const e = new Date(endDateStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return '海铭德系统使用周报';
  }
  const startFmt = `${s.getMonth() + 1}.${s.getDate()}`;
  const endFmt = `${e.getMonth() + 1}.${e.getDate()}`;
  return `${startFmt}-${endFmt}周报`;
}
