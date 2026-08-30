import { ModuleType } from './types';

export interface ModuleRecognitionResult {
  moduleType: ModuleType;
  moduleName: string;
  confidence: number;
}

/**
 * 根据文件名与表头特征，智能识别所属业务模块
 */
export function recognizeModule(fileName: string, headers: string[]): ModuleRecognitionResult {
  const normalizedFileName = (fileName || '').trim();
  const headerSet = new Set((headers || []).map(h => (h ? String(h).trim() : '')));

  // 1. OKR (文件名以 OKR 开头优先)
  if (
    normalizedFileName.startsWith('OKR') ||
    normalizedFileName.startsWith('okr') ||
    normalizedFileName.includes('OKR')
  ) {
    return {
      moduleType: 'okr',
      moduleName: 'OKR',
      confidence: 0.98,
    };
  }

  // 2. 新随拍 (文件名以“打卡记录”开头，或表头包含“打卡人”)
  if (
    normalizedFileName.startsWith('打卡记录') ||
    normalizedFileName.includes('随拍') ||
    (headerSet.has('打卡人') && headerSet.has('打卡时间'))
  ) {
    return {
      moduleType: 'punch',
      moduleName: '新随拍',
      confidence: 0.95,
    };
  }

  // 3. 综合点检
  if (
    normalizedFileName.startsWith('综合点检') ||
    normalizedFileName.includes('综合点检')
  ) {
    return {
      moduleType: 'comprehensive',
      moduleName: '综合点检',
      confidence: 0.95,
    };
  }

  // 4. 精益
  if (
    normalizedFileName.startsWith('精益') ||
    normalizedFileName.includes('精益')
  ) {
    return {
      moduleType: 'lean',
      moduleName: '精益',
      confidence: 0.95,
    };
  }

  // 5. QC 头条 (系统导出时文件名经常也以“生产头条”开头，但表头特征为：行号、设备编号、问题、处理时长)
  if (
    (headerSet.has('行号') && headerSet.has('设备编号') && headerSet.has('问题')) ||
    (headerSet.has('处理时长') && (headerSet.has('问题') || headerSet.has('问题描述'))) ||
    (normalizedFileName.includes('QC') || normalizedFileName.includes('qc'))
  ) {
    return {
      moduleType: 'qc',
      moduleName: 'QC头条',
      confidence: 0.95,
    };
  }

  // 6. 生产头条 (文件名以“生产头条”开头，表头特征为：卡号、标题、优先级、停机时长、车间名称)
  if (
    normalizedFileName.startsWith('生产头条') ||
    (headerSet.has('卡号') && headerSet.has('标题') && (headerSet.has('停机时长') || headerSet.has('优先级')))
  ) {
    return {
      moduleType: 'production',
      moduleName: '生产头条',
      confidence: 0.95,
    };
  }

  return {
    moduleType: 'unknown',
    moduleName: '未知模块',
    confidence: 0,
  };
}
