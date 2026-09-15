/**
 * 机台映射表解析与索引
 */

import * as XLSX from 'xlsx';
import { normalizeDepartmentName } from '@/lib/weekly-report/department-normalizer';
import { MachineMapIndex, MachineMapRow } from './types';

const REQUIRED_HEADERS = ['设备编号', '车间名称'];

export function parseMachineMapRows(buffer: ArrayBuffer | Uint8Array): MachineMapRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const objects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (objects.length === 0) return [];

  const headers = Object.keys(objects[0]);
  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      throw new Error(`机台映射表缺少必要列「${h}」，当前列：${headers.slice(0, 12).join(', ')}…`);
    }
  }

  return objects.map((r) => ({
    deviceCode: String(r['设备编号'] ?? '').trim(),
    deviceName: String(r['设备名称'] ?? '').trim(),
    lineName: String(r['线体名称'] ?? '').trim(),
    workshopRaw: String(r['车间名称'] ?? '').trim(),
    teamName: String(r['班组名称'] ?? '').trim(),
  }));
}

function normalizeWorkshopFromMap(raw: string): string {
  if (!raw) return '';
  return normalizeDepartmentName(raw);
}

/**
 * 从映射行构建查询索引
 */
export function buildMachineMapIndex(rows: MachineMapRow[]): MachineMapIndex {
  const byCode = new Map<string, string>();
  const byName = new Map<string, string>();
  const byLine = new Map<string, string>();
  const byNumericSuffix = new Map<string, Array<{ code: string; workshop: string }>>();

  for (const row of rows) {
    const ws = normalizeWorkshopFromMap(row.workshopRaw);
    if (!ws || ws === '未填/其他') continue;

    if (row.deviceCode) {
      byCode.set(row.deviceCode, ws);
      // 末尾数字后缀索引：同时登记「0706」与去前导零「706」，兼容 QC 短号
      const dig = row.deviceCode.match(/(\d+)$/);
      if (dig && /[A-Za-z]/.test(row.deviceCode)) {
        const fullSuffix = dig[1];
        const stripped = fullSuffix.replace(/^0+/, '') || '0';
        for (const suffix of new Set([fullSuffix, stripped])) {
          const list = byNumericSuffix.get(suffix) || [];
          list.push({ code: row.deviceCode, workshop: ws });
          byNumericSuffix.set(suffix, list);
        }
      }
    }
    if (row.deviceName) byName.set(row.deviceName, ws);
    if (row.lineName && row.lineName !== row.deviceCode) {
      byLine.set(row.lineName, ws);
    }
  }

  return {
    byCode,
    byName,
    byLine,
    byNumericSuffix,
    rowCount: rows.length,
  };
}

export function buildMachineMapIndexFromBuffer(
  buffer: ArrayBuffer | Uint8Array
): MachineMapIndex {
  return buildMachineMapIndex(parseMachineMapRows(buffer));
}

/** 纯数字机台：在后缀候选中打分选取 */
export function pickSuffixMatch(
  deviceId: string,
  candidates: Array<{ code: string; workshop: string }>
): { code: string; workshop: string } | null {
  if (!candidates.length) return null;
  const scored = candidates
    .map((c) => {
      let score = 0;
      if (c.code === deviceId) score += 100;
      // ZSJ6015 / BZ706 类
      if (/^[A-Za-z]{2,}\d+$/.test(c.code) && c.code.endsWith(deviceId)) score += 50;
      if (/^[A-Za-z]+\d+$/.test(c.code) && c.code.endsWith(deviceId)) score += 45;
      // TJJ-0706 类（字母+连字符+数字）
      if (/^[A-Za-z]+-\d+$/.test(c.code) && c.code.endsWith(deviceId)) score += 48;
      if (c.code.endsWith(deviceId)) score += 10;
      if (/ZSJ|TJJ|TJ|BZ/i.test(c.code)) score += 5;
      // 惩罚过长编码中间碰巧以该数字结尾（如 B752406015）
      if (c.code.length > deviceId.length + 8) score -= 25;
      // 末尾数字段去零后与 deviceId 相同加分（0706 vs 706）
      const trail = c.code.match(/(\d+)$/);
      if (trail && trail[1].replace(/^0+/, '') === deviceId.replace(/^0+/, '')) {
        score += 15;
      }
      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score >= 40) {
    return { code: scored[0].code, workshop: scored[0].workshop };
  }
  return null;
}
