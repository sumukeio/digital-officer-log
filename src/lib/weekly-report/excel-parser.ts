import * as xlsx from 'xlsx';
import { RecognizedFile } from './types';
import { recognizeModule } from './file-recognizer';

/**
 * 解析 Excel 文件并返回结构化的识别结果
 */
export function parseExcelData(
  buffer: ArrayBuffer | Uint8Array | Buffer,
  fileName: string,
  fileSize: number = 0
): RecognizedFile {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // 读取所有行
  const rawRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  if (!rawRows || rawRows.length === 0) {
    return {
      fileId: `${fileName}_${Date.now()}`,
      fileName,
      fileSize,
      moduleType: 'unknown',
      moduleName: '未知模块',
      rows: [],
      headers: [],
    };
  }

  // 提取表头 (第 0 行)
  const headers = (rawRows[0] || []).map((h: any) => String(h || '').trim());

  // 转换为对象行数组
  const objectRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  // 智能识别模块
  const recognition = recognizeModule(fileName, headers);

  return {
    fileId: `${fileName}_${fileSize}_${rawRows.length}`,
    fileName,
    fileSize,
    moduleType: recognition.moduleType,
    moduleName: recognition.moduleName,
    rows: objectRows,
    headers,
  };
}
