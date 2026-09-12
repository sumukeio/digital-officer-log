/** 头条周简报 — 类型与硬约束常量 */

export const HEADLINE_BRIEF_LIMITS = {
  maxProblems: 3,
  maxEvidencePerProblem: 4,
  maxActions: 4,
  maxMarkdownChars: 1200,
  maxPosterPages: 2,
} as const;

export type HeadlineModuleKey = 'production' | 'qc' | 'custom';

export interface HeadlineProblem {
  title: string;
  evidence: string[];
}

export interface HeadlineBenefits {
  production: string;
  quality: string;
  management: string;
}

export interface HeadlineModule {
  moduleKey: HeadlineModuleKey;
  moduleTitle: string;
  problems: HeadlineProblem[];
  actions: string[];
  benefits: HeadlineBenefits;
  quantified: boolean;
  note?: string;
}

export interface HeadlineBriefDocument {
  year: number;
  weekNumber: number;
  titleFormatted: string; // 如 9.8-9.14
  modules: HeadlineModule[];
  rawSource?: string;
}

export interface DistillOptions {
  moduleKey?: HeadlineModuleKey;
  moduleTitle?: string;
}

export interface ValidationIssue {
  level: 'error' | 'warn';
  message: string;
}

export interface SaveHeadlineBriefInput {
  title: string;
  startDate: string;
  endDate: string;
  weekNumber: number;
  year: number;
  modules: HeadlineModule[];
  rawSource?: string;
  markdownContent: string;
  briefId?: string;
}

export const MODULE_TITLE_MAP: Record<HeadlineModuleKey, string> = {
  production: '生产头条',
  qc: 'QC头条',
  custom: '自定义模块',
};

export function createEmptyModule(
  moduleKey: HeadlineModuleKey = 'production',
  moduleTitle?: string
): HeadlineModule {
  return {
    moduleKey,
    moduleTitle: moduleTitle || MODULE_TITLE_MAP[moduleKey],
    problems: [],
    actions: [],
    benefits: { production: '', quality: '', management: '' },
    quantified: false,
    note: '',
  };
}
