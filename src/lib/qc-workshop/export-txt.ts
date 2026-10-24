/**
 * QC 按车间统计 — 纯文本导出（不含完整 Prompt）
 */

import {
  QC_REPORT_WORKSHOPS,
  UNMAPPED_WORKSHOP,
} from './types';
import {
  listStandardWorkshopsWithData,
  QcWorkshopAggregateResult,
  WorkshopAggStats,
} from './aggregator';
import { QcExportMeta } from './export-meta';

function formatTopLines(stats: WorkshopAggStats, indent = '  '): string[] {
  const lines: string[] = [];
  lines.push(`${indent}开卡 ${stats.count} 条，占全厂 ${stats.percentage}%`);
  if (stats.topProblems.length > 0) {
    lines.push(`${indent}TOP 问题：`);
    stats.topProblems.forEach((t, i) => {
      lines.push(`${indent}  ${i + 1}. ${t.problem}（${t.count} 次，占本车间 ${t.percentage}%）`);
    });
  }
  const cats = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) {
    lines.push(`${indent}问题归属：${cats.map(([k, v]) => `${k} ${v} 条`).join('；')}`);
  }
  return lines;
}

function sectionTitle(workshop: string): string {
  return `【${workshop}】`;
}

/** 按 RFC002 七个标准单元顺序排列有数据车间 */
export function orderStandardWorkshopsForExport(
  result: QcWorkshopAggregateResult
): WorkshopAggStats[] {
  const withData = listStandardWorkshopsWithData(result);
  const byName = new Map(withData.map((w) => [w.workshop, w]));
  return QC_REPORT_WORKSHOPS.map((name) => byName.get(name)).filter(
    (w): w is WorkshopAggStats => !!w
  );
}

/**
 * 生成单文件纯文本（有数据的 7 标准部门分章节 + 未归类若有）
 */
export function buildQcWorkshopTxt(
  result: QcWorkshopAggregateResult,
  meta: QcExportMeta
): string {
  const lines: string[] = [];
  const period = meta.periodLabel.trim() || '本周';

  lines.push(`QC 头条按车间统计（${period}）`);
  lines.push(`全厂开卡 ${result.totalCards} 条；已归属 ${result.mappedCount} 条；未归类 ${result.unmappedCount} 条`);
  lines.push('');

  if (result.plantTopProblems.length > 0) {
    lines.push('全厂 TOP 问题：');
    result.plantTopProblems.forEach((t, i) => {
      lines.push(`  ${i + 1}. ${t.problem}（${t.count} 次，占全厂 ${t.percentage}%）`);
    });
    lines.push('');
  }

  const standardOrdered = orderStandardWorkshopsForExport(result);
  for (const ws of standardOrdered) {
    lines.push(sectionTitle(ws.workshop));
    lines.push(...formatTopLines(ws));
    lines.push('');
  }

  if (result.unmapped && result.unmapped.count > 0) {
    lines.push(sectionTitle(UNMAPPED_WORKSHOP));
    lines.push(...formatTopLines(result.unmapped));
    lines.push('  明细设备（供补映射/别名）：');
    const devices = [...new Set(result.unmapped.rows.map((r) => r.deviceId))].slice(0, 20);
    devices.forEach((d) => lines.push(`    - ${d}`));
    if (result.unmapped.rows.length > devices.length) {
      lines.push(`    … 共 ${result.unmapped.rows.length} 条，详见 Excel「未归类」Sheet`);
    }
    lines.push('');
  }

  lines.push('—');
  lines.push('说明：本文件为统计摘要，不含海铭德 AI Prompt；请使用页面「复制 Prompt」获取指令。');

  return lines.join('\n');
}
