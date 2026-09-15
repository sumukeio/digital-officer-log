/**
 * 工牌 PDF 拼版几何 — 与参考 Python 工牌生成器 (ReportLab) 对齐
 * 单卡 54×90mm，A4 竖向 3×3 居中，无卡间 gap
 */

export const BADGE_W_MM = 54;
export const BADGE_H_MM = 90;
export const A4_W_MM = 210;
export const A4_H_MM = 297;
export const CANVAS_W = 600;
export const CANVAS_H = 1000;

/** mm → PDF 点 (1pt = 1/72 inch) */
export function mmToPt(mm: number): number {
  return (mm * 72) / 25.4;
}

export interface BadgePdfLayout {
  cols: number;
  rows: number;
  itemsPerPage: number;
  marginLeftMm: number;
  marginTopMm: number;
  badgeWMm: number;
  badgeHMm: number;
  pageWMm: number;
  pageHMm: number;
}

export function getBadgePdfLayout(cols = 3, rows = 3): BadgePdfLayout {
  const c = cols > 0 ? cols : 3;
  const r = rows > 0 ? rows : 3;
  return {
    cols: c,
    rows: r,
    itemsPerPage: c * r,
    marginLeftMm: (A4_W_MM - c * BADGE_W_MM) / 2,
    marginTopMm: (A4_H_MM - r * BADGE_H_MM) / 2,
    badgeWMm: BADGE_W_MM,
    badgeHMm: BADGE_H_MM,
    pageWMm: A4_W_MM,
    pageHMm: A4_H_MM,
  };
}

/** 第 idx 张工牌在当前页的左下角坐标 (PDF 坐标系，原点左下，单位 mm) */
export function getBadgePositionMm(
  indexOnPage: number,
  layout: BadgePdfLayout
): { xMm: number; yMm: number } {
  const col = indexOnPage % layout.cols;
  const row = Math.floor(indexOnPage / layout.cols);
  const xMm = layout.marginLeftMm + col * layout.badgeWMm;
  // ReportLab: y = PAGE_H - MARGIN_TOP - (row + 1) * BADGE_H
  const yMm = layout.pageHMm - layout.marginTopMm - (row + 1) * layout.badgeHMm;
  return { xMm, yMm };
}
