/**
 * 单张工牌 Canvas 渲染 — 对齐参考 generate_badge (600×1000)
 */

import type { BadgeItem, BadgeTemplateConfig } from './types';
import { CANVAS_W, CANVAS_H } from './pdf-layout';
import { createQrDataUrl } from './create-qr';

const COLOR_BORDER = '#c8c8c8';
const COLOR_TEXT = '#000000';
const FONT_FAMILY = '"Microsoft YaHei", "SimHei", "PingFang SC", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${src}`));
    img.src = src;
  });
}

/** 按固定高度等比缩放后绘制 */
async function drawImageAtHeight(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  targetH: number
): Promise<void> {
  if (!src || targetH <= 0) return;
  try {
    const img = await loadImage(src);
    if (img.height <= 0) return;
    const w = Math.max(1, Math.round(img.width * (targetH / img.height)));
    ctx.drawImage(img, x, y, w, targetH);
  } catch {
    // 与参考一致：素材失败则跳过
  }
}

function measureText(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width;
}

/** 两端对齐标签 + 末尾冒号 — 对齐 draw_justified_label */
function drawJustifiedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number
): void {
  ctx.fillStyle = COLOR_TEXT;
  ctx.textBaseline = 'top';
  ctx.fillText('：', x + width, y);

  if (!text) return;

  if (text.includes(' ')) {
    const parts = text.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      ctx.fillText(parts[0], x, y);
      const rw = measureText(ctx, parts[parts.length - 1]);
      ctx.fillText(parts[parts.length - 1], x + width - rw, y);
      return;
    }
  }

  if (text.length <= 1) {
    ctx.fillText(text, x, y);
    return;
  }

  const chars = Array.from(text);
  const totalW = chars.reduce((sum, c) => sum + measureText(ctx, c), 0);
  const gap = width > totalW ? (width - totalW) / (chars.length - 1) : 0;
  let cur = x;
  for (const c of chars) {
    ctx.fillText(c, cur, y);
    cur += measureText(ctx, c) + gap;
  }
}

/**
 * 将单张工牌绘制为 PNG DataURL（600×1000）
 */
export async function renderBadgeToDataUrl(
  badge: BadgeItem,
  config: BadgeTemplateConfig
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = config.canvasW || CANVAS_W;
  canvas.height = config.canvasH || CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 上下文');

  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // 边框
  ctx.strokeStyle = COLOR_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // 左上 Logo
  if (config.logoShow && config.logoUrl) {
    await drawImageAtHeight(ctx, config.logoUrl, config.logoX, config.logoY, config.logoSize);
  }

  // 公司字标
  if (config.compShow) {
    if (config.compUrl) {
      await drawImageAtHeight(ctx, config.compUrl, config.compX, config.compY, config.compH);
    } else {
      ctx.fillStyle = COLOR_TEXT;
      ctx.font = `bold ${Math.round(config.compH * 0.7)}px ${FONT_FAMILY}`;
      ctx.textBaseline = 'top';
      ctx.fillText(config.companyName || '万得福', config.compX, config.compY);
    }
  }

  // 右上 QR（含中心 Logo）
  if (config.qrShow) {
    const qrData = badge.qrData || badge.workNo || badge.name || '';
    const qrUrl = await createQrDataUrl(
      qrData,
      config.qrSize,
      config.logoShow ? config.logoUrl : null
    );
    try {
      const qrImg = await loadImage(qrUrl);
      ctx.drawImage(qrImg, config.qrX, config.qrY, config.qrSize, config.qrSize);
    } catch {
      // skip
    }
  }

  // 照片框
  const { photoX: px, photoY: py, photoW: pw, photoH: ph } = config;
  if (pw > 0 && ph > 0) {
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    if (badge.photoUrl) {
      try {
        const photo = await loadImage(badge.photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py, pw, ph);
        ctx.clip();
        // cover
        const scale = Math.max(pw / photo.width, ph / photo.height);
        const dw = photo.width * scale;
        const dh = photo.height * scale;
        ctx.drawImage(photo, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
        ctx.restore();
      } catch {
        // 空框
      }
    }
  }

  // 底部字段
  const fontSize = config.fontSize;
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = COLOR_TEXT;
  ctx.textBaseline = 'top';

  const items: Array<[string, string]> = [
    ['姓名Name', badge.name || ''],
    ['部门Dept', badge.department || ''],
    ['职务Post', badge.post || ''],
    ['工号 No', badge.workNo || ''],
    ['入职日期', badge.entryDate || ''],
  ];

  let y = config.textStartY;
  const lx = config.textLabelX;
  const labelW = Math.max(10, config.textValueX - lx - 40);

  for (const [lbl, val] of items) {
    drawJustifiedLabel(ctx, lbl, lx, y, labelW);
    const vx = config.textValueX;
    const vw = config.textValueW;
    const ly = y + fontSize + 10;
    ctx.strokeStyle = COLOR_TEXT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vx, ly);
    ctx.lineTo(vx + vw, ly);
    ctx.stroke();

    const valS = String(val);
    const tw = measureText(ctx, valS);
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(valS, vx + (vw - tw) / 2, y);
    y += config.textLineH;
  }

  return canvas.toDataURL('image/png');
}
