/**
 * QC 车间模块 — 浏览器端缓存（机台映射表 + 按周期 QC 原始行）
 * MVP：localStorage；周模式与 weekly-summary 上传联动。
 */

import { DateRangeInfo } from '@/lib/weekly-report/types';
import { QcRawRow } from './aggregator';
import { QcPeriodState, buildWeekPeriod, legacyWeekStorageKey } from './period';

const MACHINE_MAP_KEY = 'dol_qc_machine_map_v1';
const QC_ROWS_PREFIX = 'dol_qc_rows_v2';
/** 兼容 task026 周桶 */
const QC_ROWS_PREFIX_V1 = 'dol_qc_rows_v1';

export interface StoredMachineMap {
  fileName: string;
  rowCount: number;
  importedAt: string;
  /** base64 编码的 xlsx buffer */
  base64: string;
}

export interface StoredQcRows {
  fileName: string;
  periodKey: string;
  periodLabel: string;
  mode: QcPeriodState['mode'];
  startDate: string;
  endDate: string;
  titleFormatted: string;
  year: number;
  weekNumber?: number;
  rowCount: number;
  savedAt: string;
  rows: QcRawRow[];
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function periodBucketKey(periodKey: string): string {
  return `${QC_ROWS_PREFIX}_${periodKey}`;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function saveMachineMapToStorage(
  buffer: ArrayBuffer,
  fileName: string,
  rowCount: number
): StoredMachineMap {
  const record: StoredMachineMap = {
    fileName,
    rowCount,
    importedAt: new Date().toISOString(),
    base64: bufferToBase64(buffer),
  };
  if (isBrowser()) {
    localStorage.setItem(MACHINE_MAP_KEY, JSON.stringify(record));
  }
  return record;
}

export function loadMachineMapFromStorage(): StoredMachineMap | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(MACHINE_MAP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredMachineMap;
  } catch {
    return null;
  }
}

export function clearMachineMapStorage(): void {
  if (isBrowser()) localStorage.removeItem(MACHINE_MAP_KEY);
}

export function getMachineMapBufferFromStorage(): ArrayBuffer | null {
  const stored = loadMachineMapFromStorage();
  if (!stored?.base64) return null;
  return base64ToBuffer(stored.base64);
}

export function saveQcRowsForPeriod(
  period: QcPeriodState,
  rows: QcRawRow[],
  fileName: string
): StoredQcRows {
  const record: StoredQcRows = {
    fileName,
    periodKey: period.storageKey,
    periodLabel: period.periodLabel,
    mode: period.mode,
    startDate: period.startDate,
    endDate: period.endDate,
    titleFormatted: period.titleFormatted,
    year: period.year,
    weekNumber: period.weekNumber,
    rowCount: rows.length,
    savedAt: new Date().toISOString(),
    rows,
  };
  if (isBrowser()) {
    localStorage.setItem(periodBucketKey(period.storageKey), JSON.stringify(record));
    // 周模式同步写 v1 桶，兼容旧读取路径
    if (period.mode === 'week' && period.weekNumber != null) {
      const legacy: Record<string, unknown> = {
        fileName,
        year: period.year,
        weekNumber: period.weekNumber,
        titleFormatted: period.titleFormatted,
        rowCount: rows.length,
        savedAt: record.savedAt,
        rows,
      };
      localStorage.setItem(
        `${QC_ROWS_PREFIX_V1}_${legacyWeekStorageKey(period.year, period.weekNumber)}`,
        JSON.stringify(legacy)
      );
    }
  }
  return record;
}

export function loadQcRowsForPeriod(period: QcPeriodState): StoredQcRows | null {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(periodBucketKey(period.storageKey));
  if (raw) {
    try {
      return JSON.parse(raw) as StoredQcRows;
    } catch {
      /* fallthrough */
    }
  }

  // 周模式回退 v1
  if (period.mode === 'week' && period.weekNumber != null) {
    const legacyRaw = localStorage.getItem(
      `${QC_ROWS_PREFIX_V1}_${legacyWeekStorageKey(period.year, period.weekNumber)}`
    );
    if (!legacyRaw) return null;
    try {
      const legacy = JSON.parse(legacyRaw) as {
        fileName: string;
        year: number;
        weekNumber: number;
        titleFormatted: string;
        rowCount: number;
        savedAt: string;
        rows: QcRawRow[];
      };
      return {
        fileName: legacy.fileName,
        periodKey: period.storageKey,
        periodLabel: period.periodLabel,
        mode: 'week',
        startDate: period.startDate,
        endDate: period.endDate,
        titleFormatted: legacy.titleFormatted,
        year: legacy.year,
        weekNumber: legacy.weekNumber,
        rowCount: legacy.rowCount,
        savedAt: legacy.savedAt,
        rows: legacy.rows,
      };
    } catch {
      return null;
    }
  }

  return null;
}

/** 周报页联动：按自然周写入缓存桶（与 qc-workshop 周模式共享） */
export function saveQcRowsForWeek(
  dateRange: DateRangeInfo,
  rows: QcRawRow[],
  fileName: string
): StoredQcRows {
  return saveQcRowsForPeriod(buildWeekPeriod(dateRange), rows, fileName);
}

/** @deprecated 请用 loadQcRowsForPeriod */
export function loadQcRowsForWeek(year: number, weekNumber: number): StoredQcRows | null {
  const stub = buildWeekPeriod({
    startDate: '1970-01-01',
    endDate: '1970-01-07',
    startFormatted: '',
    endFormatted: '',
    titleFormatted: '',
    year,
    weekNumber,
  });
  // 仅用 year/week 组 key；标签回退占位
  return loadQcRowsForPeriod({
    ...stub,
    storageKey: `w_${year}_${weekNumber}`,
  });
}
