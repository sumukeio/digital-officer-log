/**
 * 转班提醒小助手 — 类型定义
 */

export type ShiftType = '白班' | '夜班' | '中班' | string;

export interface ShiftWorker {
  id?: string;
  name: string;
  shiftDate: string; // 格式: YYYY-MM-DD (下次转班日期)
  targetShift: ShiftType; // 转班后的目标班次 (如: 白班 / 夜班)
  cycleDays: number; // 转班周期天数 (默认 14 天)
  department?: string; // 所属部门/组别
  order?: number; // 排序权重
  updatedAt?: string | Date;
}

export interface ShiftAlert {
  name: string;
  targetShift: ShiftType;
  nextDate: string; // 下下次转班日期 (YYYY-MM-DD)
  nextShift: ShiftType; // 下下次目标班次
  cycleDays: number;
}

export type ShiftStatusTag = 'today' | 'tomorrow' | 'upcoming' | 'past';

export interface ShiftWorkerStatus {
  worker: ShiftWorker;
  shiftDateStr: string; // YYYY-MM-DD
  monthDayStr: string; // MM-DD
  weekdayStr: string; // 周一 ~ 周日
  diffDays: number; // 距离今日的天数差 (0=今天, 1=明天, >1=未来)
  statusTag: ShiftStatusTag;
  statusDesc: string; // 【今天转班】 / 【明天转班】 / N天后 / 已生效
  statusColor: string; // info, warning, comment 等企微 Markdown 标签色
}

export interface ShiftCheckResult {
  today: Date;
  tomorrow: Date;
  todayStr: string;
  tomorrowStr: string;
  dataChanged: boolean;
  healedWorkers: ShiftWorker[];
  tomorrowAlerts: ShiftAlert[];
  allStatuses: ShiftWorkerStatus[];
  markdownMessage: string;
}

export interface ShiftGlobalConfig {
  webhookUrl: string;
  defaultCycle: number;
  notifyHour: number;
  notifyMinute: number;
  isEnabled: boolean;
}
