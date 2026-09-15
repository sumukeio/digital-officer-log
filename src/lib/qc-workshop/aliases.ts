/**
 * RFC002 固化别名（设备编号原文 → 车间）
 * 装箱/吸塑无部名前缀：暂统一智造九部
 */

import { UNMAPPED_WORKSHOP } from './types';

/** 精确别名 */
export const DEVICE_ALIASES: Record<string, string> = {
  T001: '智造二部',
  喷绘: '智造七部',
};

/**
 * 无部名前缀的装箱/吸塑类设备字段 → 暂归九部
 * 含部名的（如「八部吸塑组」）不走此规则，由文本推断处理
 */
export function matchProvisionalPackBlisterAlias(deviceId: string): string | null {
  const d = (deviceId || '').trim();
  if (!d) return null;
  // 已含「X部」则不当作暂定别名
  if (/[一二三四五六七八九十]部/.test(d) || /智造[一二三四五六七八九十]部/.test(d)) {
    return null;
  }
  if (/^装箱/.test(d) || d.includes('装箱组') || /^装箱\d*组$/.test(d)) {
    return '智造九部';
  }
  if (/^吸塑/.test(d) || /吸塑组/.test(d) || /^吸塑\d*组$/.test(d)) {
    return '智造九部';
  }
  return null;
}

export function resolveAlias(deviceId: string): string | null {
  const d = (deviceId || '').trim();
  if (!d) return null;
  if (DEVICE_ALIASES[d]) return DEVICE_ALIASES[d];
  return matchProvisionalPackBlisterAlias(d);
}

export { UNMAPPED_WORKSHOP };
