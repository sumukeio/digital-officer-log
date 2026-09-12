import { HeadlineModule, HeadlineModuleKey } from './types';

/** 画布宽度固定；高度按内容动态增高（B1：单模块永远一张图） */
export const POSTER_CANVAS = {
  width: 1240,
  minHeight: 1600,
  margin: 56,
  footerReserve: 120,
  headerHeight: 168,
  background: '#F7F8FA',
  cardRadius: 16,
  /** 测宽折行软边距：不到满行就换（约 6%） */
  softMarginRatio: 0.06,
} as const;

export interface PosterTheme {
  accent: string;
  accentSoft: string;
  chipBg: string;
  chipText: string;
  cardBg: string;
  text: string;
  muted: string;
}

const THEMES: Record<HeadlineModuleKey, PosterTheme> = {
  production: {
    accent: '#0F766E',
    accentSoft: '#CCFBF1',
    chipBg: '#E6FFFA',
    chipText: '#115E59',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
  },
  qc: {
    accent: '#1D4ED8',
    accentSoft: '#DBEAFE',
    chipBg: '#EFF6FF',
    chipText: '#1E40AF',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
  },
  custom: {
    accent: '#334155',
    accentSoft: '#E2E8F0',
    chipBg: '#F1F5F9',
    chipText: '#334155',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
  },
};

export function getPosterTheme(moduleKey: HeadlineModuleKey): PosterTheme {
  return THEMES[moduleKey] || THEMES.custom;
}

/** 去掉标题前导序号，避免绘制时出现「1. 1.」 */
export function stripLeadingIndex(text: string): string {
  return (text || '')
    .replace(/^\s*\d+[\.．、]\s*/u, '')
    .replace(/^\s*[（(]\d+[）)]\s*/u, '')
    .trim();
}

/**
 * A1：按像素测宽折行（可注入 measure，便于单测）
 * - 到达 maxWidth×(1-softMargin) 才换行
 * - 优先在标点/空白处断开
 */
export function wrapTextByWidth(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  softMarginRatio: number = POSTER_CANVAS.softMarginRatio
): string[] {
  const raw = (text || '').trim();
  if (!raw) return [''];

  const limit = Math.max(40, maxWidth * (1 - softMarginRatio));
  if (measure(raw) <= limit) return [raw];

  const isBreakChar = (ch: string) =>
    /[\s，。、；：,.!?;！？）》」』】]/.test(ch);

  const lines: string[] = [];
  let buf = '';
  let lastBreak = -1;

  const flush = (forceAt: number) => {
    if (forceAt >= 0 && forceAt < buf.length - 1) {
      const head = buf.slice(0, forceAt + 1).trimEnd();
      const tail = buf.slice(forceAt + 1);
      if (head) lines.push(head);
      buf = tail;
    } else {
      if (buf) lines.push(buf);
      buf = '';
    }
    lastBreak = -1;
    for (let j = 0; j < buf.length; j++) {
      if (isBreakChar(buf[j])) lastBreak = j;
    }
  };

  for (const ch of raw) {
    const next = buf + ch;
    if (measure(next) > limit && buf) {
      flush(lastBreak >= 0 ? lastBreak : buf.length - 1);
      buf = buf + ch;
      if (isBreakChar(ch)) lastBreak = buf.length - 1;
    } else {
      buf = next;
      if (isBreakChar(ch)) lastBreak = buf.length - 1;
    }
  }
  if (buf.trim()) lines.push(buf.trim());
  return lines.length ? lines : [''];
}

/** 兼容旧单测：按字符数折行（主路径已改用 wrapTextByWidth） */
export function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [''];
  const result: string[] = [];
  let buf = '';
  for (const ch of text) {
    buf += ch;
    if (buf.length >= maxChars) {
      result.push(buf);
      buf = '';
    }
  }
  if (buf) result.push(buf);
  return result;
}

/** 近似中英混排测宽（Jest / 无 Canvas 环境） */
export function approxMeasureText(text: string, fontSize = 26): number {
  let w = 0;
  for (const ch of text) {
    w += /[\u4e00-\u9fff]/.test(ch) ? fontSize : fontSize * 0.55;
  }
  return w;
}

export function truncatePosterText(text: string, maxChars: number): string {
  const t = (text || '').trim();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + '…';
}

/** 证据压缩为短标签（海报芯片） */
export function toPosterChips(evidence: string[], max = 4): string[] {
  return evidence
    .map((e) => truncatePosterText(stripLeadingIndex(e.replace(/^高频[：:]/, '').trim()), 14))
    .filter(Boolean)
    .slice(0, max);
}

export interface PosterLayoutLine {
  text: string;
  fontSize: number;
  weight: 'normal' | 'bold';
  color: string;
  indent: number;
}

export interface PosterLayoutPage {
  lines: PosterLayoutLine[];
}

/**
 * 兼容旧单测：生成可断言的文本行摘要（永远 1 页）
 */
export function buildPosterLayout(
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number,
  _maxPages = 1
): PosterLayoutPage[] {
  const lines: PosterLayoutLine[] = [
    {
      text: `第${weekNumber}周（${titleFormatted}）`,
      fontSize: 28,
      weight: 'bold',
      color: '#0F172A',
      indent: 0,
    },
    {
      text: '一、问题',
      fontSize: 24,
      weight: 'bold',
      color: '#0F172A',
      indent: 0,
    },
  ];
  module.problems.forEach((p, i) => {
    lines.push({
      text: `${i + 1}. ${stripLeadingIndex(p.title)}`,
      fontSize: 22,
      weight: 'normal',
      color: '#0F172A',
      indent: 0,
    });
    toPosterChips(p.evidence).forEach((chip) => {
      lines.push({
        text: chip,
        fontSize: 16,
        weight: 'normal',
        color: '#64748B',
        indent: 12,
      });
    });
  });
  lines.push({
    text: '二、改善',
    fontSize: 24,
    weight: 'bold',
    color: '#0F172A',
    indent: 0,
  });
  module.actions.forEach((a, i) => {
    lines.push({
      text: `${i + 1}. ${stripLeadingIndex(a)}`,
      fontSize: 20,
      weight: 'normal',
      color: '#0F172A',
      indent: 0,
    });
  });
  lines.push({
    text: '三、收益',
    fontSize: 24,
    weight: 'bold',
    color: '#0F172A',
    indent: 0,
  });
  return [{ lines }];
}

/** B1：单模块永远一张图 */
export function estimatePosterPageCount(_module?: HeadlineModule): number {
  return 1;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

function drawSectionLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  theme: PosterTheme
): number {
  ctx.font = 'bold 22px "Microsoft YaHei", "PingFang SC", sans-serif';
  const padX = 16;
  const w = ctx.measureText(label).width + padX * 2;
  const h = 36;
  fillRoundRect(ctx, x, y, w, h, 8, theme.accent);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(label, x + padX, y + 26);
  return y + h + 20;
}

function makeMeasurer(ctx: CanvasRenderingContext2D, font: string) {
  return (s: string) => {
    ctx.font = font;
    return ctx.measureText(s).width;
  };
}

/**
 * 估算单模块海报所需高度（B1 动态增高）
 */
export function estimatePosterHeight(
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number,
  measure: (font: string, text: string) => number = (font, text) => {
    const sizeMatch = /(\d+)px/.exec(font);
    const size = sizeMatch ? Number(sizeMatch[1]) : 26;
    return approxMeasureText(text, size);
  }
): number {
  const { width, margin, footerReserve, headerHeight, minHeight, cardRadius } =
    POSTER_CANVAS;
  const contentWidth = width - margin * 2;
  const titleFont = 'bold 26px "Microsoft YaHei", "PingFang SC", sans-serif';
  const bodyFont = '22px "Microsoft YaHei", "PingFang SC", sans-serif';
  const measureTitle = (t: string) => measure(titleFont, t);
  const measureBody = (t: string) => measure(bodyFont, t);

  let y = headerHeight + 24;
  y += 36 + 20; // section 问题

  module.problems.slice(0, 3).forEach((p) => {
    const title = stripLeadingIndex(p.title);
    const lines = wrapTextByWidth(title, contentWidth - 48, measureTitle);
    const chips = toPosterChips(p.evidence, 4);
    const cardH = 36 + lines.length * 34 + (chips.length ? 44 : 12) + 16;
    y += cardH + 16;
  });

  y += 36 + 20; // section 改善
  let actionH = 28;
  module.actions.forEach((a) => {
    const lines = wrapTextByWidth(
      `${stripLeadingIndex(a)}`,
      contentWidth - 48,
      measureBody
    );
    actionH += lines.length * 32 + 12;
  });
  y += Math.max(80, actionH) + 24;

  y += 36 + 20; // section 收益
  y += 200 + 24;
  y += footerReserve;

  void titleFormatted;
  void weekNumber;
  void cardRadius;
  return Math.max(minHeight, Math.ceil(y));
}

function paintHeader(
  ctx: CanvasRenderingContext2D,
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number,
  theme: PosterTheme
) {
  const { width, margin, headerHeight } = POSTER_CANVAS;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, width, headerHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px "Microsoft YaHei", "PingFang SC", sans-serif';
  const headTitle = module.moduleTitle || '头条周简报';
  // 顶栏标题：整行测宽，过长才缩小字号，避免「9.7-9.1」被砍断
  let size = 40;
  ctx.font = `bold ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  while (size > 28 && ctx.measureText(headTitle).width > width - margin * 2) {
    size -= 2;
    ctx.font = `bold ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  }
  ctx.fillText(headTitle, margin, 64);

  const weekLine = `第${weekNumber}周（${titleFormatted}）`;
  size = 30;
  ctx.font = `bold ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  while (size > 22 && ctx.measureText(weekLine).width > width - margin * 2) {
    size -= 2;
    ctx.font = `bold ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  }
  ctx.fillText(weekLine, margin, 112);

  ctx.font = '22px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('问题 — 改善 — 收益', margin, 148);
}

function drawBenefitsBlock(
  ctx: CanvasRenderingContext2D,
  module: HeadlineModule,
  theme: PosterTheme,
  margin: number,
  y: number,
  contentWidth: number,
  cardRadius: number
): number {
  y = drawSectionLabel(ctx, '三、收益', margin, y, theme);
  const gap = 16;
  const colW = (contentWidth - gap * 2) / 3;
  const items: Array<{ label: string; text: string; bg: string }> = [
    {
      label: '生产',
      text: module.benefits.production || '（待补）',
      bg: '#ECFDF5',
    },
    {
      label: '质量',
      text: module.benefits.quality || '（待补）',
      bg: '#EFF6FF',
    },
    {
      label: '管理',
      text: module.benefits.management || '（待补）',
      bg: '#FFF7ED',
    },
  ];

  const bodyFont = '20px "Microsoft YaHei", "PingFang SC", sans-serif';
  const measureBody = makeMeasurer(ctx, bodyFont);
  let maxCardH = 120;
  const wrapped = items.map((item) => {
    const lines = wrapTextByWidth(item.text, colW - 32, measureBody);
    maxCardH = Math.max(maxCardH, 56 + lines.length * 30 + 24);
    return { ...item, lines };
  });

  wrapped.forEach((item, i) => {
    const x = margin + i * (colW + gap);
    fillRoundRect(ctx, x, y, colW, maxCardH, cardRadius, item.bg);
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 22px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(item.label, x + 16, y + 36);
    ctx.fillStyle = theme.text;
    ctx.font = bodyFont;
    let ty = y + 72;
    item.lines.forEach((line) => {
      ctx.fillText(line, x + 16, ty);
      ty += 30;
    });
  });

  return y + maxCardH + 24;
}

/**
 * 在已确定尺寸的 canvas 上绘制单模块单页海报
 */
export function paintPosterDocument(
  ctx: CanvasRenderingContext2D,
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number,
  canvasHeight: number
): void {
  const { width, margin, footerReserve, background, cardRadius, headerHeight } =
    POSTER_CANVAS;
  const theme = getPosterTheme(module.moduleKey);
  const contentWidth = width - margin * 2;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, canvasHeight);

  paintHeader(ctx, module, titleFormatted, weekNumber, theme);

  let y = headerHeight + 24;
  y = drawSectionLabel(ctx, '一、问题', margin, y, theme);

  const titleFont = 'bold 26px "Microsoft YaHei", "PingFang SC", sans-serif';
  const measureTitle = makeMeasurer(ctx, titleFont);

  module.problems.slice(0, 3).forEach((p, i) => {
    const chips = toPosterChips(p.evidence, 4);
    const title = stripLeadingIndex(p.title);
    const titleLines = wrapTextByWidth(title, contentWidth - 48, measureTitle);
    const cardH = 36 + titleLines.length * 34 + (chips.length ? 44 : 12) + 16;

    fillRoundRect(ctx, margin, y, contentWidth, cardH, cardRadius, theme.cardBg);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(margin, y, 6, cardH);

    let ty = y + 36;
    ctx.fillStyle = theme.text;
    ctx.font = titleFont;
    titleLines.forEach((line, li) => {
      const prefix = li === 0 ? `${i + 1}. ` : '';
      ctx.fillText(`${prefix}${line}`, margin + 24, ty);
      ty += 34;
    });

    let chipX = margin + 24;
    const chipY = ty + 4;
    ctx.font = '18px "Microsoft YaHei", "PingFang SC", sans-serif';
    chips.forEach((chip) => {
      const cw = ctx.measureText(chip).width + 24;
      if (chipX + cw > margin + contentWidth - 16) return;
      fillRoundRect(ctx, chipX, chipY, cw, 32, 16, theme.chipBg);
      ctx.fillStyle = theme.chipText;
      ctx.fillText(chip, chipX + 12, chipY + 22);
      chipX += cw + 10;
    });

    y += cardH + 16;
  });

  y = drawSectionLabel(ctx, '二、改善', margin, y + 8, theme);

  const bodyFont = '22px "Microsoft YaHei", "PingFang SC", sans-serif';
  const measureBody = makeMeasurer(ctx, bodyFont);
  const actionLines = module.actions.map((a, i) => {
    const text = `${i + 1}. ${stripLeadingIndex(a)}`;
    return wrapTextByWidth(text, contentWidth - 48, measureBody);
  });
  const actionBlockH = Math.max(
    80,
    actionLines.reduce((s, lines) => s + lines.length * 32 + 12, 0) + 28
  );

  fillRoundRect(ctx, margin, y, contentWidth, actionBlockH, cardRadius, theme.cardBg);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(margin, y, 6, actionBlockH);

  let ay = y + 40;
  ctx.fillStyle = theme.text;
  ctx.font = bodyFont;
  actionLines.forEach((lines) => {
    lines.forEach((line) => {
      ctx.fillText(line, margin + 24, ay);
      ay += 32;
    });
    ay += 12;
  });
  y = y + actionBlockH + 24;

  y = drawBenefitsBlock(ctx, module, theme, margin, y, contentWidth, cardRadius);

  // 脚注
  const note =
    module.note ||
    (module.quantified
      ? ''
      : '说明：暂无停机时长/不良数等量化字段，收益以定性为主。');
  ctx.fillStyle = theme.muted;
  ctx.font = '18px "Microsoft YaHei", "PingFang SC", sans-serif';
  if (note) {
    const noteLines = wrapTextByWidth(
      note,
      contentWidth,
      makeMeasurer(ctx, '18px "Microsoft YaHei", "PingFang SC", sans-serif')
    );
    let ny = canvasHeight - footerReserve + 28;
    noteLines.slice(0, 3).forEach((line) => {
      ctx.fillText(line, margin, ny);
      ny += 26;
    });
  }
  ctx.font = '16px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('数字官工作台 · 头条周简报', margin, canvasHeight - 32);
}

/** @deprecated 兼容旧签名；内部转为单页动态高 */
export function paintPosterPage(
  ctx: CanvasRenderingContext2D,
  _page: PosterLayoutPage,
  moduleTitle: string,
  options?: {
    module?: HeadlineModule;
    titleFormatted?: string;
    weekNumber?: number;
    pageIndex?: number;
  }
): void {
  const module = options?.module;
  if (!module) {
    const { width, background, minHeight } = POSTER_CANVAS;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, minHeight);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 32px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(`头条周简报 · ${moduleTitle}`, 56, 80);
    return;
  }
  const h = estimatePosterHeight(
    module,
    options?.titleFormatted || '',
    options?.weekNumber || 0,
    (font, text) => {
      ctx.font = font;
      return ctx.measureText(text).width;
    }
  );
  paintPosterDocument(
    ctx,
    module,
    options?.titleFormatted || '',
    options?.weekNumber || 0,
    h
  );
}

/**
 * 渲染单个模块为 1 张动态高度海报（B1）
 */
export function renderModulePoster(
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number
): HTMLCanvasElement {
  const { width } = POSTER_CANVAS;
  const probe = document.createElement('canvas');
  probe.width = width;
  probe.height = 100;
  const probeCtx = probe.getContext('2d');
  const height = estimatePosterHeight(
    module,
    titleFormatted,
    weekNumber,
    probeCtx
      ? (font, text) => {
          probeCtx.font = font;
          return probeCtx.measureText(text).width;
        }
      : undefined
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  paintPosterDocument(ctx, module, titleFormatted, weekNumber, height);
  return canvas;
}

/**
 * C2：每个模块各一张图
 */
export function renderModulesPosters(
  modules: HeadlineModule[],
  titleFormatted: string,
  weekNumber: number
): Array<{ module: HeadlineModule; canvas: HTMLCanvasElement }> {
  return modules.map((module) => ({
    module,
    canvas: renderModulePoster(module, titleFormatted, weekNumber),
  }));
}

/** 兼容旧 API：单模块返回 [canvas] */
export function renderPosterCanvases(
  module: HeadlineModule,
  titleFormatted: string,
  weekNumber: number
): HTMLCanvasElement[] {
  return [renderModulePoster(module, titleFormatted, weekNumber)];
}
