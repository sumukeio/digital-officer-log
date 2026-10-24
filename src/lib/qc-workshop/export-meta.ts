/** 导出元信息（周期标签、生成时间等） */

export interface QcExportMeta {
  /** 如「9月7日—9月12日」 */
  periodLabel: string;
  generatedAt?: Date;
}

export function defaultExportMeta(periodLabel = '本周'): QcExportMeta {
  return { periodLabel, generatedAt: new Date() };
}
