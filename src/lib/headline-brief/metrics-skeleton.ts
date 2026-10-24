import { AllWeeklyMetrics } from '@/lib/weekly-report/types';
import {
  HeadlineModule,
  HeadlineModuleKey,
  MODULE_TITLE_MAP,
  createEmptyModule,
} from './types';

/**
 * 从海铭德指标周报 metrics 生成「问题」结论骨架（改善/收益留给人工或长文补充）
 */
export function buildProblemSkeletonFromMetrics(
  metrics: AllWeeklyMetrics | null | undefined,
  moduleKey: HeadlineModuleKey = 'production'
): HeadlineModule {
  const base = createEmptyModule(moduleKey, MODULE_TITLE_MAP[moduleKey]);

  if (!metrics) return base;

  if (moduleKey === 'production' && metrics.production) {
    const prod = metrics.production;
    const top = [...(prod.workshopStats || [])]
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

    if (top.length > 0) {
      const first = top[0];
      base.problems.push({
        title: `${first.workshop || first.shortName}异常最集中（约 ${first.count} 条 / ${first.percentage}%）`,
        evidence: top.slice(1).map(
          (w) => `${w.workshop || w.shortName} ${w.count} 条（${w.percentage}%）`
        ),
      });
    }

    const overdueBits: string[] = [];
    if (prod.over24Count > 0) overdueBits.push(`超24h ${prod.over24Count} 条`);
    if (prod.over48Count > 0) overdueBits.push(`超48h ${prod.over48Count} 条`);
    if (overdueBits.length) {
      base.problems.push({
        title: `本周生产头条开卡 ${prod.totalCards} 条，超期需关注`,
        evidence: overdueBits,
      });
    }

    if (base.problems.length === 0 && prod.totalCards > 0) {
      base.problems.push({
        title: `本周生产头条开卡 ${prod.totalCards} 条`,
        evidence: [],
      });
    }

    base.quantified = true;
    return base;
  }

  if (moduleKey === 'qc' && metrics.qc) {
    const qc = metrics.qc;
    const evidence: string[] = [];
    if (qc.over24Count > 0) evidence.push(`超24h处理 ${qc.over24Count} 条`);
    if (qc.over48Count > 0) evidence.push(`超48h处理 ${qc.over48Count} 条`);
    base.problems.push({
      title: `本周 QC 头条开卡 ${qc.totalCards} 条`,
      evidence,
    });
    base.quantified = true;
    return base;
  }

  return base;
}

/**
 * 将指标骨架合并进已有模块：保留人工改善/收益，仅在问题为空时填充
 */
export function mergeSkeletonIntoModule(
  existing: HeadlineModule,
  skeleton: HeadlineModule
): HeadlineModule {
  if (existing.problems.length > 0) return existing;
  return {
    ...existing,
    problems: skeleton.problems,
    quantified: existing.quantified || skeleton.quantified,
  };
}
