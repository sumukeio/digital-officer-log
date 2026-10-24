/**
 * 工牌 PDF 导出 — 对齐参考 export_pdf (ReportLab A4 3×3 + 裁切延长线)
 */

import { PDFDocument, rgb } from 'pdf-lib';
import type { BadgeItem, BadgeTemplateConfig } from './types';
import { getBadgePdfLayout, getBadgePositionMm, mmToPt } from './pdf-layout';
import { renderBadgeToDataUrl } from './render-badge-canvas';

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('无效的图片 DataURL');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 将已勾选工牌导出为 A4 PDF Blob（文件名建议：工牌.pdf）
 */
export async function exportBadgesPdf(
  badges: BadgeItem[],
  config: BadgeTemplateConfig
): Promise<Blob> {
  const enabled = badges.filter((b) => b.enabled);
  if (enabled.length === 0) {
    throw new Error('请至少勾选一张工牌');
  }

  const layout = getBadgePdfLayout(config.layoutCols || 3, config.layoutRows || 3);
  const pageW = mmToPt(layout.pageWMm);
  const pageH = mmToPt(layout.pageHMm);
  const badgeW = mmToPt(layout.badgeWMm);
  const badgeH = mmToPt(layout.badgeHMm);

  const pdf = await PDFDocument.create();
  const cropColor = rgb(0.6, 0.6, 0.6);

  for (let i = 0; i < enabled.length; i++) {
    const indexOnPage = i % layout.itemsPerPage;
    if (indexOnPage === 0) {
      pdf.addPage([pageW, pageH]);
    }
    const page = pdf.getPage(pdf.getPageCount() - 1);

    const dataUrl = await renderBadgeToDataUrl(enabled[i], config);
    const pngBytes = dataUrlToBytes(dataUrl);
    const png = await pdf.embedPng(pngBytes);

    const { xMm, yMm } = getBadgePositionMm(indexOnPage, layout);
    const x = mmToPt(xMm);
    const y = mmToPt(yMm);

    page.drawImage(png, {
      x,
      y,
      width: badgeW,
      height: badgeH,
    });

    // 裁切延长线（对齐参考）
    if (config.showCropMarks !== false) {
      const bx1 = x;
      const by1 = y;
      const bx2 = x + badgeW;
      const by2 = y + badgeH;
      const stroke = { thickness: 0.5, color: cropColor };
      page.drawLine({ start: { x: bx1, y: by2 }, end: { x: bx1, y: pageH }, ...stroke });
      page.drawLine({ start: { x: bx2, y: by2 }, end: { x: bx2, y: pageH }, ...stroke });
      page.drawLine({ start: { x: bx1, y: by1 }, end: { x: bx1, y: 0 }, ...stroke });
      page.drawLine({ start: { x: bx2, y: by1 }, end: { x: bx2, y: 0 }, ...stroke });
      page.drawLine({ start: { x: bx1, y: by2 }, end: { x: 0, y: by2 }, ...stroke });
      page.drawLine({ start: { x: bx1, y: by1 }, end: { x: 0, y: by1 }, ...stroke });
      page.drawLine({ start: { x: bx2, y: by2 }, end: { x: pageW, y: by2 }, ...stroke });
      page.drawLine({ start: { x: bx2, y: by1 }, end: { x: pageW, y: by1 }, ...stroke });
    }
  }

  const pdfBytes = await pdf.save();
  // pdf-lib 返回的 Uint8Array 在 TS 5 下不满足 BlobPart，拷贝一份即可
  return new Blob([Uint8Array.from(pdfBytes)], { type: 'application/pdf' });
}

/** 触发浏览器下载 PDF */
export function downloadPdfBlob(blob: Blob, filename = '工牌.pdf'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
