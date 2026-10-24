import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import {
  aggregateQcByWorkshop,
  buildMachineMapIndexFromBuffer,
  listStandardWorkshopsWithData,
  QcRawRow,
  UNMAPPED_WORKSHOP,
} from '@/lib/qc-workshop';

const exampleDir = path.join(process.cwd(), 'docs', 'example');

describe('QC workshop aggregator (task024 / RFC002)', () => {
  const mapBuf = fs.readFileSync(path.join(exampleDir, '机台映射表.xlsx'));
  const index = buildMachineMapIndexFromBuffer(mapBuf);
  const qcBuf = fs.readFileSync(path.join(exampleDir, '生产头条_20260915143729.xlsx'));
  const wb = XLSX.read(qcBuf, { type: 'buffer' });
  const rawRows = XLSX.utils.sheet_to_json<QcRawRow>(wb.Sheets[wb.SheetNames[0]], {
    defval: '',
  });

  const result = aggregateQcByWorkshop(rawRows, index, { topN: 5 });

  it('应聚合样例全部行且 mapped+unmapped = total', () => {
    expect(result.totalCards).toBe(rawRows.length);
    expect(result.mappedCount + result.unmappedCount).toBe(result.totalCards);
    expect(result.enrichedRows).toHaveLength(rawRows.length);
  });

  it('有数据的车间列表按条数降序，且不含未归类', () => {
    expect(result.workshops.length).toBeGreaterThan(0);
    expect(result.workshops.every((w) => w.workshop !== UNMAPPED_WORKSHOP)).toBe(true);
    for (let i = 1; i < result.workshops.length; i++) {
      expect(result.workshops[i - 1].count).toBeGreaterThanOrEqual(result.workshops[i].count);
    }
  });

  it('T001 两条应计入智造二部', () => {
    const erBu = result.workshops.find((w) => w.workshop === '智造二部');
    expect(erBu).toBeTruthy();
    const t001 = erBu!.rows.filter((r) => r.deviceId === 'T001');
    expect(t001.length).toBe(2);
  });

  it('喷绘应计入智造七部', () => {
    const qi = result.workshops.find((w) => w.workshop === '智造七部');
    expect(qi).toBeTruthy();
    expect(qi!.rows.some((r) => r.deviceId === '喷绘')).toBe(true);
  });

  it('无前缀装箱应计入智造九部', () => {
    const jiu = result.workshops.find((w) => w.workshop === '智造九部');
    expect(jiu).toBeTruthy();
    expect(jiu!.rows.some((r) => r.deviceId === '装箱组' || r.deviceId.startsWith('装箱'))).toBe(
      true
    );
  });

  it('分车间 TOP 问题条数之和不超过车间总数，且百分比合理', () => {
    for (const w of result.workshops) {
      const topSum = w.topProblems.reduce((s, t) => s + t.count, 0);
      expect(topSum).toBeLessThanOrEqual(w.count);
      expect(w.percentage).toBeGreaterThan(0);
      w.topProblems.forEach((t) => {
        expect(t.count).toBeGreaterThan(0);
        expect(t.percentage).toBeGreaterThan(0);
      });
    }
  });

  it('全厂 TOP 存在且降序', () => {
    expect(result.plantTopProblems.length).toBeGreaterThan(0);
    expect(result.plantTopProblems.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < result.plantTopProblems.length; i++) {
      expect(result.plantTopProblems[i - 1].count).toBeGreaterThanOrEqual(
        result.plantTopProblems[i].count
      );
    }
  });

  it('listStandardWorkshopsWithData 仅返回 7 标准单元中有数据者', () => {
    const std = listStandardWorkshopsWithData(result);
    expect(std.every((w) => w.isStandard && w.count > 0)).toBe(true);
    // 品管部若有数据会出现在 workshops 但不在 std
    const pinGuan = result.workshops.find((w) => w.workshop.includes('品管'));
    if (pinGuan) {
      expect(std.find((w) => w.workshop === pinGuan.workshop)).toBeUndefined();
    }
  });

  it('空输入返回空聚合', () => {
    const empty = aggregateQcByWorkshop([], index);
    expect(empty.totalCards).toBe(0);
    expect(empty.workshops).toEqual([]);
    expect(empty.unmapped).toBeNull();
  });
});
