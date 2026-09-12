import {
  HEADLINE_BRIEF_LIMITS,
  HeadlineBriefDocument,
  HeadlineModule,
  ValidationIssue,
} from './types';

/**
 * 生成单模块企微 Markdown
 */
export function generateModuleMarkdown(
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number
): string {
  const lines: string[] = [];
  lines.push(`**【${module.moduleTitle}】第${weekNumber}周（${titleFormatted}）问题—改善—收益**`);
  lines.push('');
  lines.push('**一、问题**');

  if (module.problems.length === 0) {
    lines.push('> 暂无');
  } else {
    module.problems.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.title}`);
      if (p.evidence.length > 0) {
        lines.push(`   - 高频：${p.evidence.join('；')}`);
      }
    });
  }

  lines.push('');
  lines.push('**二、改善**');
  if (module.actions.length === 0) {
    lines.push('> 暂无');
  } else {
    module.actions.forEach((a, i) => {
      lines.push(`${i + 1}. ${a}`);
    });
  }

  lines.push('');
  lines.push('**三、收益**');
  lines.push(`- 生产：${module.benefits.production || '（待补）'}`);
  lines.push(`- 质量：${module.benefits.quality || '（待补）'}`);
  lines.push(`- 管理：${module.benefits.management || '（待补）'}`);

  if (!module.quantified) {
    lines.push('');
    lines.push(
      `> ${module.note || '说明：暂无停机时长/不良数等量化字段，收益以定性为主。'}`
    );
  } else if (module.note) {
    lines.push('');
    lines.push(`> ${module.note}`);
  }

  return lines.join('\n').trim();
}

/**
 * 合并多模块为领导版 Markdown
 */
export function generateMergedMarkdown(doc: HeadlineBriefDocument): string {
  if (!doc.modules.length) return '';
  return doc.modules
    .map((m) => generateModuleMarkdown(m, doc.titleFormatted, doc.weekNumber))
    .join('\n\n---\n\n')
    .trim();
}

/**
 * 硬约束校验
 */
export function validateHeadlineBrief(modules: HeadlineModule[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  modules.forEach((m, idx) => {
    const label = m.moduleTitle || `模块${idx + 1}`;
    if (m.problems.length > HEADLINE_BRIEF_LIMITS.maxProblems) {
      issues.push({
        level: 'error',
        message: `${label}：问题条数超过 ${HEADLINE_BRIEF_LIMITS.maxProblems}`,
      });
    }
    if (m.actions.length > HEADLINE_BRIEF_LIMITS.maxActions) {
      issues.push({
        level: 'error',
        message: `${label}：改善条数超过 ${HEADLINE_BRIEF_LIMITS.maxActions}`,
      });
    }
    m.problems.forEach((p, pi) => {
      if (p.evidence.length > HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem) {
        issues.push({
          level: 'error',
          message: `${label} 问题${pi + 1}：证据超过 ${HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem} 条`,
        });
      }
      if (!p.title.trim()) {
        issues.push({ level: 'warn', message: `${label} 问题${pi + 1}：结论句为空` });
      }
    });
    if (!m.benefits.production && !m.benefits.quality && !m.benefits.management) {
      issues.push({ level: 'warn', message: `${label}：收益三类均为空` });
    }
  });

  const md = generateMergedMarkdown({
    year: 0,
    weekNumber: 0,
    titleFormatted: '',
    modules,
  });
  if (md.length > HEADLINE_BRIEF_LIMITS.maxMarkdownChars) {
    issues.push({
      level: 'warn',
      message: `合并文案约 ${md.length} 字，超过建议上限 ${HEADLINE_BRIEF_LIMITS.maxMarkdownChars}，建议分模块推送`,
    });
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
