import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import {
  buildMachineMapIndexFromBuffer,
  resolveWorkshop,
  resolveAlias,
  DEVICE_ALIASES,
  UNMAPPED_WORKSHOP,
  pickSuffixMatch,
} from '@/lib/qc-workshop';

const exampleDir = path.join(process.cwd(), 'docs', 'example');

describe('QC workshop resolve (task023 / RFC002)', () => {
  const mapBuf = fs.readFileSync(path.join(exampleDir, '机台映射表.xlsx'));
  const index = buildMachineMapIndexFromBuffer(mapBuf);

  it('应成功解析机台映射表并建立索引', () => {
    expect(index.rowCount).toBeGreaterThan(100);
    expect(index.byCode.size).toBeGreaterThan(50);
  });

  describe('别名表', () => {
    it('T001 → 智造二部', () => {
      expect(resolveAlias('T001')).toBe('智造二部');
      expect(resolveWorkshop('T001', index)).toEqual(
        expect.objectContaining({ workshop: '智造二部', method: 'alias' })
      );
    });

    it('喷绘 → 智造七部', () => {
      expect(resolveAlias('喷绘')).toBe('智造七部');
      expect(resolveWorkshop('喷绘', index).workshop).toBe('智造七部');
    });

    it('无部名前缀装箱* → 暂智造九部', () => {
      expect(resolveAlias('装箱组')).toBe('智造九部');
      expect(resolveAlias('装箱6组')).toBe('智造九部');
      expect(resolveAlias('装箱二组')).toBe('智造九部');
    });

    it('无部名前缀吸塑* → 暂智造九部', () => {
      expect(resolveAlias('吸塑组')).toBe('智造九部');
      expect(resolveAlias('吸塑二组')).toBe('智造九部');
    });

    it('含部名的吸塑不走暂定九部别名', () => {
      expect(resolveAlias('八部吸塑组')).toBeNull();
      expect(resolveWorkshop('八部吸塑组', index).workshop).toBe('智造八部');
      expect(resolveWorkshop('八部吸塑组', index).method).toBe('text_infer');
    });

    it('DEVICE_ALIASES 含 T001 与喷绘', () => {
      expect(DEVICE_ALIASES.T001).toBe('智造二部');
      expect(DEVICE_ALIASES['喷绘']).toBe('智造七部');
    });
  });

  describe('映射表匹配', () => {
    it('C23 精确编号 → 品管部（归一后可能仍为品管部）', () => {
      const r = resolveWorkshop('C23', index);
      expect(r.method).toBe('exact_code');
      expect(r.workshop).toMatch(/品管/);
    });

    it('6015 后缀优先匹配 ZSJ6015 → 智造五部', () => {
      const r = resolveWorkshop('6015', index);
      expect(r.method).toBe('code_suffix');
      expect(r.workshop).toBe('智造五部');
      expect(r.matchedCode).toMatch(/6015/);
    });

    it('pickSuffixMatch 应压低过长误匹配', () => {
      const picked = pickSuffixMatch('6015', [
        { code: 'B752406015', workshop: '研发部' },
        { code: 'ZSJ6015', workshop: '智造五部' },
      ]);
      expect(picked?.code).toBe('ZSJ6015');
      expect(picked?.workshop).toBe('智造五部');
    });
  });

  describe('文本推断', () => {
    it('八部流水线 / 九部包装车间', () => {
      expect(resolveWorkshop('八部流水线', index).workshop).toBe('智造八部');
      expect(resolveWorkshop('九部包装车间', index).workshop).toBe('智造九部');
      expect(resolveWorkshop('七部包装', index).workshop).toBe('智造七部');
    });
  });

  describe('样例 QC 文件覆盖率', () => {
    it('生产头条_20260915143729.xlsx 记录归属可解释且关键别名正确', () => {
      const qcBuf = fs.readFileSync(path.join(exampleDir, '生产头条_20260915143729.xlsx'));
      const wb = XLSX.read(qcBuf, { type: 'buffer' });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], {
        defval: '',
      });

      let mapped = 0;
      const unmappedDevices = new Set<string>();
      for (const row of rows) {
        const dev = String(row['设备编号'] ?? '').trim();
        const r = resolveWorkshop(dev, index);
        if (r.workshop !== UNMAPPED_WORKSHOP) mapped++;
        else unmappedDevices.add(dev);
      }

      expect(mapped / rows.length).toBeGreaterThanOrEqual(0.95);

      // 关键固化断言
      const t001 = rows.filter((r) => String(r['设备编号']).trim() === 'T001');
      expect(t001.length).toBe(2);
      t001.forEach((row) => {
        expect(resolveWorkshop(String(row['设备编号']), index).workshop).toBe('智造二部');
      });

      const spray = rows.find((r) => String(r['设备编号']).trim() === '喷绘');
      expect(spray).toBeTruthy();
      expect(resolveWorkshop('喷绘', index).workshop).toBe('智造七部');

      // 无部名前缀装箱应归九部
      expect(resolveWorkshop('装箱组', index).workshop).toBe('智造九部');
      expect(resolveWorkshop('装箱6组', index).workshop).toBe('智造九部');
    });
  });

  it('空设备号 → 未归类', () => {
    expect(resolveWorkshop('', index)).toEqual({
      workshop: UNMAPPED_WORKSHOP,
      method: 'unmapped',
    });
  });
});
