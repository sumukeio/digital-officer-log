/**
 * QC 行按车间聚合（全厂概览 / 分车间 TOP / 未归类）
 */

import {
  MachineMapIndex,
  QC_REPORT_WORKSHOPS,
  UNMAPPED_WORKSHOP,
  WorkshopResolveMethod,
} from './types';
import { resolveWorkshop } from './resolve-workshop';

/** 单条 QC 原始行（字段兼容海铭德导出） */
export interface QcRawRow {
  行号?: string | number;
  设备编号?: string;
  问题?: string;
  问题描述?: string;
  问题归属?: string;
  处理时长?: string | number;
  处理状态?: string;
  开卡人?: string;
  开卡时间?: string;
  负责人?: string;
  [key: string]: unknown;
}

export interface QcEnrichedRow {
  rowNo: string;
  deviceId: string;
  problem: string;
  problemDesc: string;
  category: string;
  duration: number;
  status: string;
  opener: string;
  openTime: string;
  handler: string;
  workshop: string;
  resolveMethod: WorkshopResolveMethod;
  matchedCode?: string;
}

export interface ProblemTopItem {
  problem: string;
  count: number;
  /** 占本车间（或全厂）条数比 % */
  percentage: number;
}

export interface WorkshopAggStats {
  workshop: string;
  count: number;
  percentage: number;
  /** 是否属于 RFC002 七个标准汇报单元 */
  isStandard: boolean;
  topProblems: ProblemTopItem[];
  /** 问题归属分布 */
  categoryCounts: Record<string, number>;
  rows: QcEnrichedRow[];
}

export interface QcWorkshopAggregateResult {
  totalCards: number;
  mappedCount: number;
  unmappedCount: number;
  /** 全厂问题 TOP */
  plantTopProblems: ProblemTopItem[];
  /** 有数据的车间（含标准外如品管部），按条数降序；不含「未归类」 */
  workshops: WorkshopAggStats[];
  /** 未归类明细 */
  unmapped: WorkshopAggStats | null;
  enrichedRows: QcEnrichedRow[];
}

function toEnriched(row: QcRawRow, index: MachineMapIndex | null | undefined): QcEnrichedRow {
  const deviceId = String(row['设备编号'] ?? '').trim();
  const resolved = resolveWorkshop(deviceId, index);
  const durationRaw = row['处理时长'];
  const duration =
    typeof durationRaw === 'number'
      ? durationRaw
      : parseFloat(String(durationRaw ?? '0').replace(/,/g, '')) || 0;

  return {
    rowNo: String(row['行号'] ?? ''),
    deviceId,
    problem: String(row['问题'] ?? '').trim() || '（未填问题）',
    problemDesc: String(row['问题描述'] ?? '').trim(),
    category: String(row['问题归属'] ?? '').trim() || '未填',
    duration,
    status: String(row['处理状态'] ?? '').trim(),
    opener: String(row['开卡人'] ?? '').trim(),
    openTime: String(row['开卡时间'] ?? '').trim(),
    handler: String(row['负责人'] ?? '').trim(),
    workshop: resolved.workshop,
    resolveMethod: resolved.method,
    matchedCode: resolved.matchedCode,
  };
}

function buildTopProblems(rows: QcEnrichedRow[], topN: number): ProblemTopItem[] {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.problem] = (counts[r.problem] || 0) + 1;
  }
  const total = rows.length || 1;
  return Object.entries(counts)
    .map(([problem, count]) => ({
      problem,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count || a.problem.localeCompare(b.problem, 'zh'))
    .slice(0, topN);
}

function buildCategoryCounts(rows: QcEnrichedRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.category] = (counts[r.category] || 0) + 1;
  }
  return counts;
}

function isStandardWorkshop(name: string): boolean {
  return (QC_REPORT_WORKSHOPS as readonly string[]).includes(name);
}

export interface AggregateOptions {
  /** 分车间 / 全厂 TOP 条数，默认 5 */
  topN?: number;
}

/**
 * 将 QC 原始行按车间聚合
 */
export function aggregateQcByWorkshop(
  rows: QcRawRow[],
  index: MachineMapIndex | null | undefined,
  options: AggregateOptions = {}
): QcWorkshopAggregateResult {
  const topN = options.topN ?? 5;
  const enrichedRows = (rows || []).map((r) => toEnriched(r, index));
  const totalCards = enrichedRows.length;

  const byWs = new Map<string, QcEnrichedRow[]>();
  for (const r of enrichedRows) {
    const list = byWs.get(r.workshop) || [];
    list.push(r);
    byWs.set(r.workshop, list);
  }

  const unmappedRows = byWs.get(UNMAPPED_WORKSHOP) || [];
  byWs.delete(UNMAPPED_WORKSHOP);

  const workshops: WorkshopAggStats[] = [...byWs.entries()]
    .map(([workshop, wsRows]) => ({
      workshop,
      count: wsRows.length,
      percentage: totalCards > 0 ? Math.round((wsRows.length / totalCards) * 1000) / 10 : 0,
      isStandard: isStandardWorkshop(workshop),
      topProblems: buildTopProblems(wsRows, topN),
      categoryCounts: buildCategoryCounts(wsRows),
      rows: wsRows,
    }))
    .sort((a, b) => b.count - a.count || a.workshop.localeCompare(b.workshop, 'zh'));

  const unmapped: WorkshopAggStats | null =
    unmappedRows.length > 0
      ? {
          workshop: UNMAPPED_WORKSHOP,
          count: unmappedRows.length,
          percentage:
            totalCards > 0 ? Math.round((unmappedRows.length / totalCards) * 1000) / 10 : 0,
          isStandard: false,
          topProblems: buildTopProblems(unmappedRows, topN),
          categoryCounts: buildCategoryCounts(unmappedRows),
          rows: unmappedRows,
        }
      : null;

  return {
    totalCards,
    mappedCount: totalCards - unmappedRows.length,
    unmappedCount: unmappedRows.length,
    plantTopProblems: buildTopProblems(enrichedRows, topN),
    workshops,
    unmapped,
    enrichedRows,
  };
}

/** 仅有数据、且属于 7 标准单元的车间（导出 txt 分章节用） */
export function listStandardWorkshopsWithData(
  result: QcWorkshopAggregateResult
): WorkshopAggStats[] {
  return result.workshops.filter((w) => w.isStandard && w.count > 0);
}
