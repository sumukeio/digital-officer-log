/**
 * 设备编号 → 车间归属（RFC002）
 */

import { normalizeDepartmentName } from '@/lib/weekly-report/department-normalizer';
import { resolveAlias } from './aliases';
import { pickSuffixMatch } from './machine-map';
import {
  MachineMapIndex,
  UNMAPPED_WORKSHOP,
  WorkshopResolveResult,
} from './types';

/** 从设备字段文本推断车间（八部流水线、九部手包组…） */
export function inferWorkshopFromDeviceText(deviceId: string): string | null {
  const d = (deviceId || '').trim();
  if (!d) return null;
  const normalized = normalizeDepartmentName(d);
  if (
    normalized.startsWith('智造') &&
    normalized.endsWith('部') &&
    normalized !== d
  ) {
    return normalized;
  }
  // normalize 可能原样返回「八部流水线」——再抽部名
  for (const n of ['一', '二', '三', '五', '七', '八', '九', '十'] as const) {
    if (d.includes(`${n}部`) || d.includes(`智造${n}部`)) {
      return `智造${n}部`;
    }
  }
  if (normalized.startsWith('智造') && normalized.endsWith('部')) {
    return normalized;
  }
  return null;
}

/**
 * 解析单条设备编号的车间归属
 */
export function resolveWorkshop(
  deviceId: string,
  index: MachineMapIndex | null | undefined
): WorkshopResolveResult {
  const d = (deviceId || '').trim();
  if (!d) {
    return { workshop: UNMAPPED_WORKSHOP, method: 'unmapped' };
  }

  // 1. 别名
  const alias = resolveAlias(d);
  if (alias) {
    return { workshop: alias, method: 'alias' };
  }

  if (index) {
    // 2. 精确设备编号
    const byCode = index.byCode.get(d);
    if (byCode) {
      return { workshop: byCode, method: 'exact_code', rawWorkshop: byCode, matchedCode: d };
    }
    // 3. 名称 / 线体
    const byName = index.byName.get(d);
    if (byName) {
      return { workshop: byName, method: 'exact_name', matchedCode: d };
    }
    const byLine = index.byLine.get(d);
    if (byLine) {
      return { workshop: byLine, method: 'exact_line', matchedCode: d };
    }
    // 4. 纯数字后缀
    if (/^\d+$/.test(d)) {
      const candidates = index.byNumericSuffix.get(d) || [];
      const picked = pickSuffixMatch(d, candidates);
      if (picked) {
        return {
          workshop: picked.workshop,
          method: 'code_suffix',
          matchedCode: picked.code,
        };
      }
    }
  }

  // 5. 文本推断
  const inferred = inferWorkshopFromDeviceText(d);
  if (inferred) {
    return { workshop: inferred, method: 'text_infer' };
  }

  return { workshop: UNMAPPED_WORKSHOP, method: 'unmapped' };
}
