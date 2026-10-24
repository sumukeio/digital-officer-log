/**
 * QC 按车间归属 — 类型
 */

export type WorkshopResolveMethod =
  | 'alias'
  | 'exact_code'
  | 'exact_name'
  | 'exact_line'
  | 'code_suffix'
  | 'text_infer'
  | 'unmapped';

export interface MachineMapRow {
  deviceCode: string;
  deviceName: string;
  lineName: string;
  workshopRaw: string;
  teamName: string;
}

/** 内存索引（由机台映射表构建） */
export interface MachineMapIndex {
  byCode: Map<string, string>;
  byName: Map<string, string>;
  byLine: Map<string, string>;
  /** 字母前缀 + 数字后缀 → 车间（如 ZSJ6015 → 智造五部） */
  byNumericSuffix: Map<string, Array<{ code: string; workshop: string }>>;
  rowCount: number;
}

export interface WorkshopResolveResult {
  /** 归一化后的车间名；未归类时为「未归类」 */
  workshop: string;
  method: WorkshopResolveMethod;
  /** 映射表原始车间名（若有） */
  rawWorkshop?: string;
  matchedCode?: string;
}

export const UNMAPPED_WORKSHOP = '未归类';

/** RFC002 标准汇报单元 */
export const QC_REPORT_WORKSHOPS = [
  '智造一部',
  '智造二部',
  '智造三部',
  '智造五部',
  '智造七部',
  '智造八部',
  '智造九部',
] as const;

export type QcReportWorkshop = (typeof QC_REPORT_WORKSHOPS)[number];
