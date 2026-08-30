import fs from 'fs';
import path from 'path';
import { getDefaultWeekRange, formatWeekTitle } from '@/lib/weekly-report/date-helper';
import { recognizeModule } from '@/lib/weekly-report/file-recognizer';
import { normalizeDepartmentName, getShortDeptName } from '@/lib/weekly-report/department-normalizer';
import { parseExcelData } from '@/lib/weekly-report/excel-parser';
import {
  calculateProductionMetrics,
  calculateQCMetrics,
  calculateOKRMetrics,
  calculatePunchMetrics,
  calculateWowRate,
  formatWowText,
} from '@/lib/weekly-report/metrics-calculator';
import {
  generatePlainTextWeeklyReport,
  generateWeComMarkdownWeeklyReport,
  DEFAULT_MANUAL_SECTIONS,
} from '@/lib/weekly-report/report-generator';

describe('周报自动总结核心纯函数库测试', () => {
  const exampleDir = path.join(process.cwd(), 'docs', 'example');

  describe('1. 日期与周期计算 (date-helper)', () => {
    it('应正确计算指定日期的自然周 (周一至周日) 及格式化', () => {
      // 2026-08-30 是周日，其所在周是 2026-08-24 ~ 2026-08-30
      const testDate = new Date(2026, 7, 30); // 8月30日
      const range = getDefaultWeekRange(testDate);
      expect(range.startDate).toBe('2026-08-24');
      expect(range.endDate).toBe('2026-08-30');
      expect(range.titleFormatted).toBe('8.24-8.30');
      expect(range.year).toBe(2026);
    });

    it('应正确生成周报标题', () => {
      const title = formatWeekTitle('2026-08-17', '2026-08-23');
      expect(title).toBe('8.17-8.23周报');
    });
  });

  describe('2. 部门智能归一与动态发现 (department-normalizer)', () => {
    it('应将班组/别名正确归一为标准车间名称', () => {
      expect(normalizeDepartmentName('一组')).toBe('智造一部');
      expect(normalizeDepartmentName('1组')).toBe('智造一部');
      expect(normalizeDepartmentName('二组')).toBe('智造二部');
      expect(normalizeDepartmentName('5组')).toBe('智造五部');
      expect(normalizeDepartmentName('五组')).toBe('智造五部');
      expect(normalizeDepartmentName('八部吸塑')).toBe('智造八部');
    });

    it('应保留职能部门与非标准部门的原名', () => {
      expect(normalizeDepartmentName('品质部')).toBe('品质部');
      expect(normalizeDepartmentName('工程部')).toBe('工程部');
      expect(normalizeDepartmentName('研发部')).toBe('研发部');
    });

    it('应正确提取简短名称', () => {
      expect(getShortDeptName('智造一部')).toBe('一部');
      expect(getShortDeptName('智造五部')).toBe('五部');
      expect(getShortDeptName('品质部')).toBe('品质部');
    });
  });

  describe('3. 模块智能识别 (file-recognizer)', () => {
    it('应通过表头与前缀精准区分 QC 头条 与 生产头条', () => {
      // QC 头条 (文件名叫生产头条，但包含行号、设备编号、问题)
      const qcResult = recognizeModule('生产头条_20260830144236.xlsx', ['行号', '设备编号', '问题', '处理时长']);
      expect(qcResult.moduleType).toBe('qc');
      expect(qcResult.moduleName).toBe('QC头条');

      // 生产头条 (文件名叫生产头条，包含卡号、标题、优先级、停机时长)
      const prodResult = recognizeModule('生产头条_20260830144107.xlsx', ['卡号', '标题', '优先级', '停机时长']);
      expect(prodResult.moduleType).toBe('production');
      expect(prodResult.moduleName).toBe('生产头条');
    });

    it('应正确识别 OKR 与 新随拍', () => {
      const okrResult = recognizeModule('OKR_20260830144201.xlsx', ['卡号', '标题']);
      expect(okrResult.moduleType).toBe('okr');

      const punchResult = recognizeModule('打卡记录_20260830145408.xlsx', ['打卡人', '部门', '打卡时间']);
      expect(punchResult.moduleType).toBe('punch');
    });
  });

  describe('4. 环比增长率计算 (metrics-calculator)', () => {
    it('应正确计算环比增减率与格式化文字', () => {
      // 上周 18 条，本周 12 条 -> (12-18)/18 = -33.3%
      const rate = calculateWowRate(12, 18);
      expect(rate).toBe(-33.3);
      expect(formatWowText(rate)).toBe('环比下跌33%');

      // 上周 100 条，本周 115 条 -> +15%
      const rateUp = calculateWowRate(115, 100);
      expect(rateUp).toBe(15);
      expect(formatWowText(rateUp)).toBe('环比增长15%');

      // 无上周基准
      expect(calculateWowRate(10, null)).toBeNull();
      expect(formatWowText(null)).toBe('');
    });
  });

  describe('5. 真实 Excel 文件端到端解析与指标计算', () => {
    it('应正确解析 生产头条_20260830144107.xlsx', () => {
      const fileBuffer = fs.readFileSync(path.join(exampleDir, '生产头条_20260830144107.xlsx'));
      const parsed = parseExcelData(fileBuffer, '生产头条_20260830144107.xlsx', fileBuffer.length);
      
      expect(parsed.moduleType).toBe('production');
      expect(parsed.rows.length).toBe(7);

      const metrics = calculateProductionMetrics(parsed.rows, 10);
      expect(metrics.totalCards).toBe(7);
      expect(metrics.over24Count).toBe(2);
      expect(metrics.over48Count).toBe(1);
      expect(metrics.wowRate).toBe(-30);
      
      const ws1 = metrics.workshopStats.find(w => w.workshop === '智造一部');
      expect(ws1?.count).toBe(6);
      expect(ws1?.percentage).toBe(86);
    });

    it('应正确解析 QC头条_20260830144236.xlsx', () => {
      const fileBuffer = fs.readFileSync(path.join(exampleDir, '生产头条_20260830144236.xlsx'));
      const parsed = parseExcelData(fileBuffer, '生产头条_20260830144236.xlsx', fileBuffer.length);
      
      expect(parsed.moduleType).toBe('qc');
      expect(parsed.rows.length).toBe(23);

      const metrics = calculateQCMetrics(parsed.rows, 54);
      expect(metrics.totalCards).toBe(23);
      expect(metrics.over24Count).toBe(12);
      expect(metrics.over48Count).toBe(7);
      expect(metrics.wowRate).toBe(-57.4);
    });

    it('应正确解析 OKR_20260830144201.xlsx', () => {
      const fileBuffer = fs.readFileSync(path.join(exampleDir, 'OKR_20260830144201.xlsx'));
      const parsed = parseExcelData(fileBuffer, 'OKR_20260830144201.xlsx', fileBuffer.length);
      
      expect(parsed.moduleType).toBe('okr');
      expect(parsed.rows.length).toBe(2);

      const metrics = calculateOKRMetrics(parsed.rows);
      expect(metrics.totalCards).toBe(2);
    });

    it('应正确解析 打卡记录_20260830145408.xlsx', () => {
      const fileBuffer = fs.readFileSync(path.join(exampleDir, '打卡记录_20260830145408.xlsx'));
      const parsed = parseExcelData(fileBuffer, '打卡记录_20260830145408.xlsx', fileBuffer.length);
      
      expect(parsed.moduleType).toBe('punch');
      expect(parsed.rows.length).toBe(204);

      const metrics = calculatePunchMetrics(parsed.rows, 288);
      expect(metrics.totalPunches).toBe(204);
      expect(metrics.topDepts.length).toBeGreaterThan(0);
      
      // 五组(65) + 智造五部(2) = 67 (33%)
      const dept5 = metrics.deptStats.find(d => d.department === '智造五部');
      expect(dept5?.count).toBe(67);
      expect(dept5?.percentage).toBe(33);
    });
  });

  describe('6. 最终周报纯文本与企微 Markdown 生成', () => {
    it('应生成结构完整、与标准格式高度一致的微信周报文本', () => {
      const dateRange = getDefaultWeekRange(new Date(2026, 7, 23));
      const text = generatePlainTextWeeklyReport({
        dateRange,
        metrics: {
          production: {
            totalCards: 12,
            over24Count: 3,
            over48Count: 1,
            over48Details: [],
            workshopStats: [
              { workshop: '智造一部', shortName: '一部', count: 4, percentage: 33 },
              { workshop: '智造五部', shortName: '五部', count: 2, percentage: 17 },
            ],
            wowRate: -33,
          },
          qc: {
            totalCards: 54,
            over24Count: 15,
            over48Count: 7,
            over48Details: [],
            wowRate: -57,
          },
          punch: {
            totalPunches: 288,
            deptStats: [],
            topDepts: [
              { department: '智造五部', shortName: '五部', count: 66, percentage: 23 },
              { department: '智造一部', shortName: '一部', count: 63, percentage: 22 },
            ],
            wowRate: -5,
          },
        },
        manualSections: DEFAULT_MANUAL_SECTIONS,
      });

      expect(text).toContain('生产头条：本周总体开卡数共12条，环比下跌33%');
      expect(text).toContain('QC头条：本周总体开卡数共54条，环比下跌57%');
      expect(text).toContain('新随拍：本周共计打卡288人次，环比下跌5%');
      expect(text).toContain('设备点检：一二三五七部都在正常使用。');
      expect(text).toContain('系统改进建议：');
    });

    it('应生成企业微信群机器人 Markdown 格式消息', () => {
      const dateRange = getDefaultWeekRange(new Date(2026, 7, 23));
      const markdown = generateWeComMarkdownWeeklyReport({
        dateRange,
        metrics: {
          production: {
            totalCards: 12,
            over24Count: 3,
            over48Count: 1,
            over48Details: [],
            workshopStats: [{ workshop: '智造一部', shortName: '一部', count: 4, percentage: 33 }],
            wowRate: -33,
          },
        },
        manualSections: DEFAULT_MANUAL_SECTIONS,
      });

      expect(markdown).toContain('海铭德系统使用周报');
      expect(markdown).toContain('生产头条');
      expect(markdown).toContain('font color="warning"');
    });
  });
});
