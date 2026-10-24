/**
 * QC 按车间 — 海铭德 AI Prompt 生成（供复制，不写入 txt）
 */

import { HEADLINE_BRIEF_LIMITS } from '@/lib/headline-brief/types';
import {
  QcWorkshopAggregateResult,
  WorkshopAggStats,
} from './aggregator';
import { QcExportMeta } from './export-meta';
import { orderStandardWorkshopsForExport } from './export-txt';
import { UNMAPPED_WORKSHOP } from './types';

export type QcPromptScope = 'plant' | 'workshop';

export interface BuildQcPromptOptions {
  scope: QcPromptScope;
  /** scope=workshop 时必填 */
  workshop?: string;
}

function statsBlock(stats: WorkshopAggStats, label: string): string[] {
  const lines: string[] = [`【${label}统计摘要】`, `- 开卡 ${stats.count} 条`];
  if (stats.topProblems.length > 0) {
    lines.push('- TOP 问题：');
    stats.topProblems.forEach((t, i) => {
      lines.push(`  ${i + 1}. ${t.problem}（${t.count} 次，${t.percentage}%）`);
    });
  }
  return lines;
}

function plantStatsBlock(result: QcWorkshopAggregateResult): string[] {
  const lines: string[] = [
    '【全厂统计摘要】',
    `- 开卡 ${result.totalCards} 条；已归属 ${result.mappedCount} 条；未归类 ${result.unmappedCount} 条`,
  ];
  if (result.plantTopProblems.length > 0) {
    lines.push('- 全厂 TOP 问题：');
    result.plantTopProblems.forEach((t, i) => {
      lines.push(`  ${i + 1}. ${t.problem}（${t.count} 次，${t.percentage}%）`);
    });
  }
  const std = orderStandardWorkshopsForExport(result);
  if (std.length > 0) {
    lines.push('- 各车间条数：');
    std.forEach((w) => lines.push(`  · ${w.workshop}：${w.count} 条（${w.percentage}%）`));
  }
  return lines;
}

function resolveWorkshopStats(
  result: QcWorkshopAggregateResult,
  workshop: string
): WorkshopAggStats | null {
  if (workshop === UNMAPPED_WORKSHOP) return result.unmapped;
  return result.workshops.find((w) => w.workshop === workshop) ?? null;
}

/**
 * 生成海铭德 AI Prompt（全厂或指定车间）
 */
export function buildQcWorkshopPrompt(
  result: QcWorkshopAggregateResult,
  meta: QcExportMeta,
  options: BuildQcPromptOptions
): string {
  const period = meta.periodLabel.trim() || '本周';
  const { maxProblems, maxActions } = HEADLINE_BRIEF_LIMITS;

  let scopeLabel = '全厂';
  let summaryLines: string[] = plantStatsBlock(result);

  if (options.scope === 'workshop') {
    const wsName = options.workshop?.trim();
    if (!wsName) {
      throw new Error('workshop scope 需要指定 workshop 名称');
    }
    const wsStats = resolveWorkshopStats(result, wsName);
    if (!wsStats || wsStats.count === 0) {
      throw new Error(`车间「${wsName}」无数据，无法生成 Prompt`);
    }
    scopeLabel = wsName;
    summaryLines = statsBlock(wsStats, wsName);
  }

  const lines: string[] = [
    `分析${period}【QC头条】${scopeLabel === '全厂' ? '全厂' : `「${scopeLabel}」`}异常，严格按下面结构输出，不要写机台流水账细节：`,
    '',
    ...summaryLines,
    '',
    `一、问题（最多${maxProblems}条）`,
    '每条格式：',
    '**N. 结论句（含条数或占比）**',
    '- 高频关键词1（一句话，不列全部单号）',
    '- 高频关键词2',
    `- 高频关键词3（最多${HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem}个）`,
    '',
    `二、改善（最多${maxActions}条）`,
    '每条一句：动作 + 对象 + 防再发机制。',
    '',
    '三、收益（仅3句）',
    '- 生产：…',
    '- 质量：…',
    '- 管理：…',
    '',
    '文末加一行：> 说明：有/无量化字段（停机时长、不良数、返工工时、损失金额）。',
  ];

  return lines.join('\n');
}

/** Prompt 硬约束关键词（单测断言用） */
export const QC_PROMPT_HARD_CONSTRAINT_MARKERS = [
  '【QC头条】',
  '一、问题',
  '二、改善',
  '三、收益',
  '生产：',
  '质量：',
  '管理：',
  '停机时长、不良数、返工工时、损失金额',
] as const;
