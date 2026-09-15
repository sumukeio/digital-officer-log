/**
 * QC 按车间统计 — 分析 Excel 导出（全厂概览 + 有数据车间 Sheet + 未归类）
 */

import * as XLSX from 'xlsx';
import {
  QC_REPORT_WORKSHOPS,
  UNMAPPED_WORKSHOP,
} from './types';
import {
  QcWorkshopAggregateResult,
  WorkshopAggStats,
} from './aggregator';
import { QcExportMeta } from './export-meta';

export const QC_XLSX_SHEET_OVERVIEW = '全厂概览';
export const QC_XLSX_SHEET_UNMAPPED = UNMAPPED_WORKSHOP;

const DETAIL_HEADERS = [
  '行号',
  '设备编号',
  '问题',
  '问题描述',
  '问题归属',
  '处理时长',
  '处理状态',
  '开卡人',
  '开卡时间',
  '负责人',
  '归属方式',
  '匹配机台',
] as const;

function safeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
}

function topSummary(topProblems: WorkshopAggStats['topProblems']): string {
  if (topProblems.length === 0) return '';
  return topProblems
    .slice(0, 3)
    .map((t) => `${t.problem}(${t.count})`)
    .join('；');
}

function buildOverviewSheet(
  result: QcWorkshopAggregateResult,
  meta: QcExportMeta
): XLSX.WorkSheet {
  const period = meta.periodLabel.trim() || '本周';
  const rows: unknown[][] = [
    [`QC 头条按车间统计 — ${period}`],
    [`全厂开卡 ${result.totalCards} 条；已归属 ${result.mappedCount} 条；未归类 ${result.unmappedCount} 条`],
    [],
    ['车间', '条数', '占全厂(%)', 'TOP问题摘要', '是否标准汇报单元'],
  ];

  const standardSet = new Set<string>(QC_REPORT_WORKSHOPS);
  const ordered: WorkshopAggStats[] = [];

  for (const name of QC_REPORT_WORKSHOPS) {
    const w = result.workshops.find((x) => x.workshop === name);
    if (w && w.count > 0) ordered.push(w);
  }
  for (const w of result.workshops) {
    if (!standardSet.has(w.workshop) && w.count > 0) ordered.push(w);
  }
  if (result.unmapped && result.unmapped.count > 0) {
    ordered.push(result.unmapped);
  }

  for (const w of ordered) {
    rows.push([
      w.workshop,
      w.count,
      w.percentage,
      topSummary(w.topProblems),
      w.workshop === UNMAPPED_WORKSHOP ? '否' : standardSet.has(w.workshop) ? '是' : '否',
    ]);
  }

  if (result.plantTopProblems.length > 0) {
    rows.push([]);
    rows.push(['全厂 TOP 问题', '次数', '占全厂(%)']);
    result.plantTopProblems.forEach((t) => {
      rows.push([t.problem, t.count, t.percentage]);
    });
  }

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildWorkshopTopSection(stats: WorkshopAggStats): unknown[][] {
  const rows: unknown[][] = [
    [`【${stats.workshop}】开卡 ${stats.count} 条，占全厂 ${stats.percentage}%`],
    [],
    ['排名', '问题', '发生次数', '占车间比(%)'],
  ];
  stats.topProblems.forEach((t, i) => {
    rows.push([i + 1, t.problem, t.count, t.percentage]);
  });
  rows.push([]);
  rows.push(['问题归属分布']);
  Object.entries(stats.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, cnt]) => rows.push([cat, cnt]));
  rows.push([]);
  rows.push([...DETAIL_HEADERS]);
  return rows;
}

function appendDetailRows(rows: unknown[][], stats: WorkshopAggStats): void {
  for (const r of stats.rows) {
    rows.push([
      r.rowNo,
      r.deviceId,
      r.problem,
      r.problemDesc,
      r.category,
      r.duration,
      r.status,
      r.opener,
      r.openTime,
      r.handler,
      r.resolveMethod,
      r.matchedCode ?? '',
    ]);
  }
}

function buildWorkshopSheet(stats: WorkshopAggStats): XLSX.WorkSheet {
  const rows = buildWorkshopTopSection(stats);
  appendDetailRows(rows, stats);
  return XLSX.utils.aoa_to_sheet(rows);
}

/** 有数据的车间（标准单元优先，再非标准，不含未归类） */
export function listWorkshopsForXlsxSheets(
  result: QcWorkshopAggregateResult
): WorkshopAggStats[] {
  const standardSet = new Set<string>(QC_REPORT_WORKSHOPS);
  const out: WorkshopAggStats[] = [];

  for (const name of QC_REPORT_WORKSHOPS) {
    const w = result.workshops.find((x) => x.workshop === name);
    if (w && w.count > 0) out.push(w);
  }
  for (const w of result.workshops) {
    if (!standardSet.has(w.workshop) && w.count > 0) out.push(w);
  }
  return out;
}

export interface QcXlsxWorkbookInfo {
  sheetNames: string[];
  buffer: ArrayBuffer;
}

/**
 * 生成分析 Excel（ArrayBuffer）
 */
export function buildQcWorkshopXlsx(
  result: QcWorkshopAggregateResult,
  meta: QcExportMeta
): QcXlsxWorkbookInfo {
  const wb = XLSX.utils.book_new();
  const sheetNames: string[] = [];

  XLSX.utils.book_append_sheet(wb, buildOverviewSheet(result, meta), QC_XLSX_SHEET_OVERVIEW);
  sheetNames.push(QC_XLSX_SHEET_OVERVIEW);

  const workshopSheets = listWorkshopsForXlsxSheets(result);
  for (const ws of workshopSheets) {
    const name = safeSheetName(ws.workshop);
    XLSX.utils.book_append_sheet(wb, buildWorkshopSheet(ws), name);
    sheetNames.push(name);
  }

  if (result.unmapped && result.unmapped.count > 0) {
    XLSX.utils.book_append_sheet(wb, buildWorkshopSheet(result.unmapped), QC_XLSX_SHEET_UNMAPPED);
    sheetNames.push(QC_XLSX_SHEET_UNMAPPED);
  }

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return { sheetNames, buffer };
}

/** 从 buffer 读取 sheet 名（单测用） */
export function readXlsxSheetNames(buffer: ArrayBuffer): string[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  return wb.SheetNames;
}
