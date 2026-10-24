import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import {
  aggregateQcByWorkshop,
  buildMachineMapIndexFromBuffer,
  buildQcWorkshopPrompt,
  buildQcWorkshopTxt,
  buildQcWorkshopXlsx,
  listWorkshopsForXlsxSheets,
  orderStandardWorkshopsForExport,
  QC_PROMPT_HARD_CONSTRAINT_MARKERS,
  QC_XLSX_SHEET_OVERVIEW,
  QC_XLSX_SHEET_UNMAPPED,
  QcRawRow,
  readXlsxSheetNames,
} from '@/lib/qc-workshop';

const exampleDir = path.join(process.cwd(), 'docs', 'example');
const meta = { periodLabel: '9月7日—9月12日' };

describe('QC workshop export (task025 / RFC002)', () => {
  const mapBuf = fs.readFileSync(path.join(exampleDir, '机台映射表.xlsx'));
  const index = buildMachineMapIndexFromBuffer(mapBuf);
  const qcBuf = fs.readFileSync(path.join(exampleDir, '生产头条_20260915143729.xlsx'));
  const wb = XLSX.read(qcBuf, { type: 'buffer' });
  const rawRows = XLSX.utils.sheet_to_json<QcRawRow>(wb.Sheets[wb.SheetNames[0]], {
    defval: '',
  });
  const result = aggregateQcByWorkshop(rawRows, index, { topN: 5 });

  describe('xlsx', () => {
    const { sheetNames, buffer } = buildQcWorkshopXlsx(result, meta);
    const parsedNames = readXlsxSheetNames(buffer);

    it('首张 Sheet 为全厂概览', () => {
      expect(sheetNames[0]).toBe(QC_XLSX_SHEET_OVERVIEW);
      expect(parsedNames[0]).toBe(QC_XLSX_SHEET_OVERVIEW);
    });

    it('仅有数据的车间才建 Sheet，0 条标准车间不建空 Sheet', () => {
      const withData = listWorkshopsForXlsxSheets(result);
      for (const w of withData) {
        expect(sheetNames).toContain(w.workshop);
      }
      // 智造四部/六部不在标准单元，不应出现空 sheet
      expect(sheetNames.filter((n) => n === '智造四部')).toHaveLength(0);
      expect(sheetNames.filter((n) => n === '智造六部')).toHaveLength(0);
    });

    it('有未归类时含未归类 Sheet', () => {
      if (result.unmapped && result.unmapped.count > 0) {
        expect(sheetNames).toContain(QC_XLSX_SHEET_UNMAPPED);
      }
    });

    it('sheet 名与写入 buffer 可读一致', () => {
      expect(parsedNames).toEqual(sheetNames);
    });

    it('车间 Sheet 含 TOP 与明细表头', () => {
      const xwb = XLSX.read(buffer, { type: 'array' });
      const firstWs = listWorkshopsForXlsxSheets(result)[0];
      if (!firstWs) return;
      const rows = XLSX.utils.sheet_to_json(xwb.Sheets[firstWs.workshop], {
        header: 1,
        defval: '',
      }) as unknown[][];
      const flat = rows.flat().join('|');
      expect(flat).toContain('排名');
      expect(flat).toContain('问题');
      expect(flat).toContain('设备编号');
    });
  });

  describe('txt', () => {
    const txt = buildQcWorkshopTxt(result, meta);

    it('含周期与全厂摘要', () => {
      expect(txt).toContain('9月7日—9月12日');
      expect(txt).toContain(`全厂开卡 ${result.totalCards} 条`);
    });

    it('有数据的标准部门分章节', () => {
      const std = orderStandardWorkshopsForExport(result);
      for (const w of std) {
        expect(txt).toContain(`【${w.workshop}】`);
        expect(txt).toContain(`开卡 ${w.count} 条`);
      }
    });

    it('不含完整 Prompt 指令正文', () => {
      expect(txt).not.toContain('严格按下面结构输出');
      expect(txt).not.toContain('一、问题（最多');
      expect(txt).toContain('不含海铭德 AI Prompt');
    });

    it('未归类有数据时单独章节', () => {
      if (result.unmapped && result.unmapped.count > 0) {
        expect(txt).toContain('【未归类】');
      }
    });
  });

  describe('prompt', () => {
    it('全厂 Prompt 含硬约束与统计摘要', () => {
      const prompt = buildQcWorkshopPrompt(result, meta, { scope: 'plant' });
      for (const marker of QC_PROMPT_HARD_CONSTRAINT_MARKERS) {
        expect(prompt).toContain(marker);
      }
      expect(prompt).toContain('【QC头条】');
      expect(prompt).toContain('全厂统计摘要');
      expect(prompt).toContain('最多3条');
      expect(prompt).toContain('最多4条');
    });

    it('分车间 Prompt 含车间名与 TOP', () => {
      const ws = listWorkshopsForXlsxSheets(result)[0];
      if (!ws) return;
      const prompt = buildQcWorkshopPrompt(result, meta, {
        scope: 'workshop',
        workshop: ws.workshop,
      });
      expect(prompt).toContain(`「${ws.workshop}」`);
      expect(prompt).toContain('统计摘要');
      expect(prompt).not.toContain('全厂统计摘要');
    });

    it('无数据车间抛错', () => {
      expect(() =>
        buildQcWorkshopPrompt(result, meta, { scope: 'workshop', workshop: '智造四部' })
      ).toThrow(/无数据/);
    });
  });
});
