/**
 * 标准二维码生成（含中心 Logo）— 对齐参考 create_qr
 * logo 高度 = qrSize / 4，白底 (w+4)×(h+4) 居中贴图
 */

import QRCode from 'qrcode';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${src}`));
    img.src = src;
  });
}

/**
 * 生成带可选中心 Logo 的 QR DataURL (PNG)
 */
export async function createQrDataUrl(
  data: string,
  size: number,
  logoUrl?: string | null
): Promise<string> {
  const sz = size > 0 ? Math.round(size) : 100;
  const canvas = document.createElement('canvas');

  await QRCode.toCanvas(canvas, String(data || ''), {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: sz,
    color: { dark: '#000000', light: '#ffffff' },
  });

  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl);
      const ctx = canvas.getContext('2d');
      if (ctx && logo.height > 0) {
        const logoH = Math.max(1, Math.floor(sz / 4));
        const logoW = Math.max(1, Math.round(logo.width * (logoH / logo.height)));
        const bgW = logoW + 4;
        const bgH = logoH + 4;
        const bx = Math.floor((sz - bgW) / 2);
        const by = Math.floor((sz - bgH) / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, bgW, bgH);
        ctx.drawImage(logo, bx + 2, by + 2, logoW, logoH);
      }
    } catch {
      // Logo 失败时仍返回纯 QR，与参考 try/except 一致
    }
  }

  return canvas.toDataURL('image/png');
}
