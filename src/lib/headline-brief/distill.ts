import {
  DistillOptions,
  HeadlineBenefits,
  HeadlineModule,
  HeadlineModuleKey,
  HeadlineProblem,
  MODULE_TITLE_MAP,
  HEADLINE_BRIEF_LIMITS,
  createEmptyModule,
} from './types';

const SECTION_PATTERNS: Array<{ key: 'problems' | 'actions' | 'benefits'; re: RegExp }> = [
  // 仅匹配章节标题行，避免正文中的「问题/收益」误命中
  { key: 'problems', re: /(?:^|\n)\s*(?:#{1,3}\s*)?一\s*[,，、.．:：]?\s*问题[^\n]*/i },
  { key: 'actions', re: /(?:^|\n)\s*(?:#{1,3}\s*)?二\s*[,，、.．:：]?\s*(?:改善|措施)[^\n]*/i },
  { key: 'benefits', re: /(?:^|\n)\s*(?:#{1,3}\s*)?三\s*[,，、.．:：]?\s*收益[^\n]*/i },
];

/** @internal 导出供单测调试 */
export function splitHeadlineSections(raw: string): Record<'problems' | 'actions' | 'benefits' | 'preface', string> {
  return splitSections(raw);
}

/** 去掉 Markdown 加粗/斜体标记 */
export function stripMdMarks(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .trim();
}

/** 是否 Markdown 列表项（避免把 **加粗** 误判为 * 列表） */
export function isMdBullet(line: string): boolean {
  return /^[-•]\s+/.test(line) || /^\*\s+/.test(line);
}

function splitSections(raw: string): Record<'problems' | 'actions' | 'benefits' | 'preface', string> {
  const text = raw.replace(/\r\n/g, '\n');
  const hits: Array<{ key: 'problems' | 'actions' | 'benefits'; index: number; len: number }> = [];

  for (const p of SECTION_PATTERNS) {
    const m = p.re.exec(text);
    if (m && m.index !== undefined) {
      hits.push({ key: p.key, index: m.index, len: m[0].length });
    }
  }

  hits.sort((a, b) => a.index - b.index);

  const result = {
    preface: text,
    problems: '',
    actions: '',
    benefits: '',
  };

  if (hits.length === 0) {
    result.problems = text;
    return result;
  }

  result.preface = text.slice(0, hits[0].index);

  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index + hits[i].len;
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    result[hits[i].key] = text.slice(start, end).trim();
  }

  return result;
}

/** 提取加粗标题行作为问题结论 */
function extractProblemBlocks(section: string): HeadlineProblem[] {
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  const problems: HeadlineProblem[] = [];
  let current: HeadlineProblem | null = null;

  const titleRe = /^(?:\*{0,2})?(?:\d+[\.、．]|[\*•\-]\s*)?\*{0,2}(.+?)\*{0,2}$/;

  for (const line of lines) {
    const boldTitle = /^\*{2}(.+?)\*{2}\s*$/.exec(line);
    const numberedBold = /^(?:\d+[\.、．]\s*)?\*{2}(.+?)\*{2}\s*$/.exec(line);
    const isBullet = isMdBullet(line) || /^高频问题/.test(line);

    if (numberedBold || boldTitle) {
      const title = stripMdMarks((numberedBold || boldTitle)![1]);
      // 跳过小节内小标题噪声
      if (/^(?:\d+[\.、．]\s*)?(直接生产收益|质量收益|管理收益|说明)/.test(title)) continue;
      if (current) problems.push(current);
      current = { title, evidence: [] };
      continue;
    }

    // 无加粗时：以数字开头的短结论行作为标题
    if (!current && /^\d+[\.、．]/.test(line) && !isBullet) {
      const m = titleRe.exec(line);
      current = { title: stripMdMarks(m?.[1] || line), evidence: [] };
      continue;
    }

    if (isMdBullet(line) || /^\s{2,}[-•*]\s+/.test(line)) {
      const cleaned = stripMdMarks(line.replace(/^[\s\-•*]+/, ''));
      if (!cleaned) continue;
      if (!current) {
        current = { title: cleaned.slice(0, 40), evidence: [] };
      } else if (current.evidence.length < HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem) {
        // 压缩证据：取冒号前主题或截断
        const short = compressEvidence(cleaned);
        if (short && !current.evidence.includes(short)) {
          current.evidence.push(short);
        }
      }
      continue;
    }

    // 非 bullet 描述行：若已有 current，尝试抽关键词
    if (current && line.length > 8 && current.evidence.length < HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem) {
      if (/主要|高频|发生|涉及/.test(line)) {
        const short = compressEvidence(stripMdMarks(line));
        if (short) current.evidence.push(short);
      }
    }
  }

  if (current) problems.push(current);

  return problems.slice(0, HEADLINE_BRIEF_LIMITS.maxProblems).map((p) => ({
    title: truncate(p.title, 80),
    evidence: p.evidence.slice(0, HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem),
  }));
}

function compressEvidence(text: string): string {
  // 「硅胶板损坏/更换：涉及…」→「硅胶板损坏/更换」
  const beforeColon = text.split(/[：:]/)[0]?.trim() || text;
  // 去掉机台流水：保留主题短语
  let s = beforeColon
    .replace(/涉及[^，。；;]*/g, '')
    .replace(/TJJ-\d+(?:[、,，]\s*TJJ-\d+)*/gi, '')
    .replace(/ZSJ\d+(?:[、,，]\s*ZSJ\d+)*/gi, '')
    .replace(/6T\d+(?:[、,，]\s*6T\d+)*/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[，,；;]+$/g, '')
    .trim();

  if (s.length > 36) s = s.slice(0, 36) + '…';
  return s;
}

function extractActions(section: string): string[] {
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  const actions: string[] = [];
  let pendingTitle = '';

  for (const line of lines) {
    const bold = /^(?:\d+[\.、．]\s*)?\*{2}(.+?)\*{2}\s*$/.exec(line);
    if (bold) {
      pendingTitle = stripMdMarks(bold[1]);
      continue;
    }

    if (/^[-•]\s+/.test(line) || /^\*\s+/.test(line)) {
      const body = stripMdMarks(line.replace(/^[\s\-•*]+/, ''));
      if (!body) continue;
      const merged = pendingTitle
        ? `${pendingTitle.replace(/要|应/g, '').replace(/：$/, '')}：${body}`
        : body;
      actions.push(truncate(merged, 90));
      pendingTitle = '';
      if (actions.length >= HEADLINE_BRIEF_LIMITS.maxActions) break;
      continue;
    }

    if (pendingTitle && !isMdBullet(line) && line.length > 6) {
      actions.push(truncate(`${pendingTitle}：${stripMdMarks(line)}`, 90));
      pendingTitle = '';
      if (actions.length >= HEADLINE_BRIEF_LIMITS.maxActions) break;
    }
  }

  // 若只有标题没有 bullet，把标题本身作为动作
  if (actions.length === 0 && pendingTitle) {
    actions.push(truncate(pendingTitle, 90));
  }

  return actions.slice(0, HEADLINE_BRIEF_LIMITS.maxActions);
}

function classifyBenefitBucket(text: string): keyof HeadlineBenefits | null {
  const t = text;
  if (/客诉|退货|质量溢出|不良流入|一次合格|混料.*流出/.test(t)) return 'quality';
  if (/管理|责任人|绩效|供应商|来料检验|点检台账|分类更加清晰/.test(t)) return 'management';
  if (/返工|挑选|开机|停机|交付|直通|人力|物料浪费|生产连续性/.test(t)) return 'production';
  if (/质量/.test(t)) return 'quality';
  if (/生产/.test(t)) return 'production';
  return null;
}

/**
 * 收益提炼：
 * 1) 优先识别「生产/质量/管理收益」小标题 + 下属 bullet（生产样例）
 * 2) 若无小标题（QC 常见：四条并列 bullet），按语义归入三类，空位按顺序补齐
 */
function extractBenefits(section: string): HeadlineBenefits {
  const benefits: HeadlineBenefits = { production: '', quality: '', management: '' };
  const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
  let bucket: keyof HeadlineBenefits | null = null;
  const flatBullets: string[] = [];

  for (const line of lines) {
    const title = stripMdMarks(line);
    const isBullet = isMdBullet(line);

    if (!isBullet && /直接生产收益|(?:^|[\d.、．\s])生产收益/.test(title) && !/质量收益|管理收益/.test(title)) {
      bucket = 'production';
      continue;
    }
    if (!isBullet && /质量收益/.test(title)) {
      bucket = 'quality';
      continue;
    }
    if (!isBullet && /管理收益/.test(title)) {
      bucket = 'management';
      continue;
    }

    if (isBullet) {
      const body = stripMdMarks(line.replace(/^[\s\-•*]+/, ''));
      if (!body) continue;
      if (bucket) {
        if (!benefits[bucket]) {
          benefits[bucket] = truncate(body, 80);
        }
      } else {
        flatBullets.push(body);
      }
    }
  }

  // QC 等「无三类小标题」格式：语义归类 + 顺序兜底
  if (!benefits.production && !benefits.quality && !benefits.management && flatBullets.length > 0) {
    const unused: string[] = [];
    for (const b of flatBullets) {
      const key = classifyBenefitBucket(b);
      if (key && !benefits[key]) {
        benefits[key] = truncate(b, 80);
      } else {
        unused.push(b);
      }
    }
    const order: Array<keyof HeadlineBenefits> = ['production', 'quality', 'management'];
    let ui = 0;
    for (const key of order) {
      if (!benefits[key] && ui < unused.length) {
        benefits[key] = truncate(unused[ui++], 80);
      }
    }
  }

  return benefits;
}

function extractNote(raw: string): { note: string; quantified: boolean } {
  const noteMatch =
    />\s*说明[：:]\s*(.+)/.exec(raw) ||
    /说明[：:]\s*(当前数据中未提供.+)/.exec(raw);
  const note = noteMatch ? stripMdMarks(noteMatch[1]).slice(0, 120) : '';
  const quantified = !/未提供|暂以定性|无量化/.test(raw);
  return { note, quantified: quantified && !note };
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max) + '…' : t;
}

function inferModuleMeta(
  raw: string,
  options?: DistillOptions
): { moduleKey: HeadlineModuleKey; moduleTitle: string } {
  if (options?.moduleKey) {
    return {
      moduleKey: options.moduleKey,
      moduleTitle: options.moduleTitle || MODULE_TITLE_MAP[options.moduleKey],
    };
  }
  if (/QC\s*头条|质检头条/i.test(raw)) {
    return { moduleKey: 'qc', moduleTitle: options?.moduleTitle || MODULE_TITLE_MAP.qc };
  }
  return {
    moduleKey: 'production',
    moduleTitle: options?.moduleTitle || MODULE_TITLE_MAP.production,
  };
}

/**
 * 规则模板提炼：将 DeepSeek「问题—改善—收益」长文压缩为结构化模块草稿
 */
export function distillHeadlineMarkdown(
  raw: string,
  options?: DistillOptions
): HeadlineModule {
  const text = (raw || '').trim();
  const meta = inferModuleMeta(text, options);
  if (!text) {
    return createEmptyModule(meta.moduleKey, meta.moduleTitle);
  }

  const sections = splitSections(text);
  const problems = extractProblemBlocks(sections.problems || sections.preface);
  const actions = extractActions(sections.actions);
  let benefits = extractBenefits(sections.benefits);
  // 章节切分失败时回退全文扫描收益块
  if (!benefits.production && !benefits.quality && !benefits.management) {
    benefits = extractBenefits(text);
  }
  const { note, quantified } = extractNote(text);

  const module: HeadlineModule = {
    moduleKey: meta.moduleKey,
    moduleTitle: meta.moduleTitle,
    problems,
    actions,
    benefits,
    quantified,
    note,
  };

  return module;
}
