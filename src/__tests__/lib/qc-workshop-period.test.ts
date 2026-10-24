import {
  buildCustomPeriod,
  buildMonthPeriod,
  buildWeekPeriod,
  shiftMonthPeriod,
  shiftWeekPeriod,
} from '@/lib/qc-workshop/period';
import { getDefaultWeekRange } from '@/lib/weekly-report/date-helper';

describe('QC workshop period (task027)', () => {
  it('周模式：storageKey 与 periodLabel', () => {
    const week = getDefaultWeekRange(new Date('2026-09-15'));
    const p = buildWeekPeriod(week);
    expect(p.mode).toBe('week');
    expect(p.storageKey).toBe(`w_${week.year}_${week.weekNumber}`);
    expect(p.periodLabel).toMatch(/月.*日—.*月.*日/);
  });

  it('周模式切换上下周改变 storageKey', () => {
    const p0 = buildWeekPeriod(getDefaultWeekRange(new Date('2026-09-15')));
    const p1 = shiftWeekPeriod(p0, -1);
    expect(p1.storageKey).not.toBe(p0.storageKey);
    expect(p1.mode).toBe('week');
  });

  it('月模式整月：9 月为 9.1—9.30', () => {
    const p = buildMonthPeriod(2026, 9, 'full', new Date('2026-09-15'));
    expect(p.mode).toBe('month');
    expect(p.startDate).toBe('2026-09-01');
    expect(p.endDate).toBe('2026-09-30');
    expect(p.storageKey).toBe('m_2026_09');
    expect(p.periodLabel).toContain('9月1日');
    expect(p.periodLabel).toContain('9月30日');
  });

  it('月模式月初至今：结束日为今天', () => {
    const today = new Date('2026-09-15');
    const p = buildMonthPeriod(2026, 9, 'mtd', today);
    expect(p.storageKey).toBe('mtd_2026_09');
    expect(p.startDate).toBe('2026-09-01');
    expect(p.endDate).toBe('2026-09-15');
    expect(p.titleFormatted).toContain('月初至今');
  });

  it('过去月选月初至今等价整月', () => {
    const p = buildMonthPeriod(2026, 8, 'mtd', new Date('2026-09-15'));
    expect(p.startDate).toBe('2026-08-01');
    expect(p.endDate).toBe('2026-08-31');
  });

  it('切月后默认整月且 key 独立', () => {
    const p = buildMonthPeriod(2026, 9, 'mtd', new Date('2026-09-15'));
    const prev = shiftMonthPeriod(p, -1);
    expect(prev.monthKind).toBe('full');
    expect(prev.storageKey).toBe('m_2026_08');
  });

  it('自定义区间校验与 key', () => {
    const p = buildCustomPeriod('2026-09-01', '2026-09-20');
    expect(p.mode).toBe('custom');
    expect(p.storageKey).toBe('r_2026-09-01_2026-09-20');
    expect(() => buildCustomPeriod('2026-09-20', '2026-09-01')).toThrow(/结束日期/);
  });

  it('三种模式 storageKey 互不冲突', () => {
    const week = buildWeekPeriod(getDefaultWeekRange(new Date('2026-09-15')));
    const month = buildMonthPeriod(2026, 9, 'full');
    const mtd = buildMonthPeriod(2026, 9, 'mtd', new Date('2026-09-15'));
    const custom = buildCustomPeriod('2026-09-01', '2026-09-30');
    const keys = new Set([week.storageKey, month.storageKey, mtd.storageKey, custom.storageKey]);
    expect(keys.size).toBe(4);
  });
});
