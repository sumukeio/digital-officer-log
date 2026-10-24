/** 触发浏览器下载 Blob / ArrayBuffer / 文本 */

export function downloadArrayBuffer(
  buffer: ArrayBuffer,
  filename: string,
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
): void {
  const blob = new Blob([buffer], { type: mimeType });
  triggerDownload(blob, filename);
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
