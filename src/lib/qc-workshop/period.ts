/**
 * QC 车间统计 — 周期模式（周 / 月 / 自定义）
 * 整表当区间：上传文件不按开卡时间裁剪，周期仅影响标签、缓存桶、Prompt 文案。
 */

import { DateRangeInfo } from '@/lib/weekly-report/types';
import { getDefaultWeekRange } from '@/lib/weekly-report/date-helper';

export type QcPeriodMode = 'week' | 'month' | 'custom';

/** 月模式子类型：整月 | 月初至今 */
export type QcMonthKind = 'full' | 'mtd';

export interface QcPeriodState {
  mode: QcPeriodMode;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  /** 展示用，如 9.1-9.15 / 2026年9月 */
  titleFormatted: string;
  /** 导出/Prompt 用，如 9月1日—9月15日 */
  periodLabel: string;
  /** 缓存桶 key 片段（不含前缀） */
  storageKey: string;
  /** 周模式字段 */
  year: number;
  weekNumber?: number;
  /** 月模式字段 */
  month?: number;
  monthKind?: QcMonthKind;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function chineseDayRange(startYmd: string, endYmd: string): string {
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  return `${s.getMonth() + 1}月${s.getDate()}日—${e.getMonth() + 1}月${e.getDate()}日`;
}

function lastDayOfMonth(year: number, month1to12: number): Date {
  return new Date(year, month1to12, 0);
}

/** 由周 DateRangeInfo 构建周期（与 weekly-summary 对齐） */
export function buildWeekPeriod(dateRange: DateRangeInfo): QcPeriodState {
  const periodLabel = chineseDayRange(dateRange.startDate, dateRange.endDate);
  return {
    mode: 'week',
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    titleFormatted: dateRange.titleFormatted,
    periodLabel,
    storageKey: `w_${dateRange.year}_${dateRange.weekNumber}`,
    year: dateRange.year,
    weekNumber: dateRange.weekNumber,
  };
}

export function buildMonthPeriod(
  year: number,
  month1to12: number,
  kind: QcMonthKind = 'full',
  today: Date = new Date()
): QcPeriodState {
  const start = new Date(year, month1to12 - 1, 1);
  const monthLast = lastDayOfMonth(year, month1to12);
  let end = monthLast;

  if (kind === 'mtd') {
    const sameMonth =
      today.getFullYear() === year && today.getMonth() + 1 === month1to12;
    if (sameMonth) {
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (today < start) {
      // 未来月：落到月初
      end = start;
    }
    // 过去整月：mtd 等价于整月（月初至今已结束）
  }

  const startDate = formatYmd(start);
  const endDate = formatYmd(end);
  const titleFormatted =
    kind === 'mtd' && end.getDate() !== monthLast.getDate()
      ? `${year}年${month1to12}月(月初至今)`
      : `${year}年${month1to12}月`;

  return {
    mode: 'month',
    startDate,
    endDate,
    titleFormatted,
    periodLabel: chineseDayRange(startDate, endDate),
    storageKey:
      kind === 'mtd'
        ? `mtd_${year}_${pad2(month1to12)}`
        : `m_${year}_${pad2(month1to12)}`,
    year,
    month: month1to12,
    monthKind: kind,
  };
}

export function buildCustomPeriod(startDate: string, endDate: string): QcPeriodState {
  const s = parseYmd(startDate);
  const e = parseYmd(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    throw new Error('自定义日期无效');
  }
  if (e < s) {
    throw new Error('结束日期不能早于开始日期');
  }
  const startFormatted = `${s.getMonth() + 1}.${s.getDate()}`;
  const endFormatted = `${e.getMonth() + 1}.${e.getDate()}`;
  return {
    mode: 'custom',
    startDate: formatYmd(s),
    endDate: formatYmd(e),
    titleFormatted: `${startFormatted}-${endFormatted}`,
    periodLabel: chineseDayRange(formatYmd(s), formatYmd(e)),
    storageKey: `r_${formatYmd(s)}_${formatYmd(e)}`,
    year: s.getFullYear(),
  };
}

export function shiftWeekPeriod(period: QcPeriodState, offsetWeeks: number): QcPeriodState {
  const base = parseYmd(period.startDate);
  base.setDate(base.getDate() + offsetWeeks * 7);
  return buildWeekPeriod(getDefaultWeekRange(base));
}

export function shiftMonthPeriod(period: QcPeriodState, offsetMonths: number): QcPeriodState {
  const month = period.month ?? parseYmd(period.startDate).getMonth() + 1;
  const year = period.year;
  const d = new Date(year, month - 1 + offsetMonths, 1);
  // 切月后默认整月（避免把「月初至今」带到过去月造成歧义）
  return buildMonthPeriod(d.getFullYear(), d.getMonth() + 1, 'full');
}

export function defaultPeriodFromToday(today: Date = new Date()): QcPeriodState {
  return buildWeekPeriod(getDefaultWeekRange(today));
}

/** 周模式专用 storage key（与历史 v1 格式兼容读写） */
export function legacyWeekStorageKey(year: number, weekNumber: number): string {
  return `${year}_w${weekNumber}`;
}
