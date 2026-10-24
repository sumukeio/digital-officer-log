/**
 * 解析上传的 QC 头条 Excel
 */

import { parseExcelData } from '@/lib/weekly-report/excel-parser';
import { QcRawRow } from './aggregator';

export function parseQcExcelUpload(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize = 0
): { rows: QcRawRow[]; fileName: string } {
  const parsed = parseExcelData(buffer, fileName, fileSize);
  if (parsed.moduleType !== 'qc') {
    throw new Error(
      `无法识别为 QC 头条表（需含「行号」「设备编号」「问题」等列），当前识别为：${parsed.moduleName}`
    );
  }
  if (!parsed.rows.length) {
    throw new Error('QC 表为空，请检查 Excel 内容');
  }
  return { rows: parsed.rows as QcRawRow[], fileName: parsed.fileName };
}
