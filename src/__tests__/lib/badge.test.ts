import {
  formatExcelDate,
  parseBadgeExcel,
  generateBadgeExcelTemplate,
  convertUsersToBadges,
} from '@/lib/badge/excel-importer';
import * as XLSX from 'xlsx';

describe('Badge Excel Importer & Utilities', () => {
  describe('formatExcelDate', () => {
    it('should format Date objects to YYYY-MM-DD', () => {
      const d = new Date(2026, 8, 1);
      expect(formatExcelDate(d)).toBe('2026-09-01');
    });

    it('should format string dates with slashes and dots', () => {
      expect(formatExcelDate('2026/05/20')).toBe('2026-05-20');
      expect(formatExcelDate('2026.10.15')).toBe('2026-10-15');
    });

    it('should return empty string for empty input', () => {
      expect(formatExcelDate(null)).toBe('');
      expect(formatExcelDate(undefined)).toBe('');
    });
  });

  describe('generateBadgeExcelTemplate and parseBadgeExcel roundtrip', () => {
    it('should generate template and parse it back accurately', () => {
      const templateBuffer = generateBadgeExcelTemplate();
      expect(templateBuffer).toBeDefined();
      expect(templateBuffer.length).toBeGreaterThan(0);

      const parsedBadges = parseBadgeExcel(templateBuffer);
      expect(parsedBadges.length).toBe(3);

      expect(parsedBadges[0].name).toBe('张三');
      expect(parsedBadges[0].department).toBe('数字创新部');
      expect(parsedBadges[0].post).toBe('数字工程师');
      expect(parsedBadges[0].workNo).toBe('DO-1001');
      expect(parsedBadges[0].entryDate).toBe('2026-01-01');
      expect(parsedBadges[0].enabled).toBe(true);

      expect(parsedBadges[1].name).toBe('李四');
      expect(parsedBadges[2].name).toBe('王五');
    });

    it('should handle custom column naming in excel parsing', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Name', 'Dept', 'Title', 'WorkId', 'Date'],
        ['赵六', '技术部', '主管', '8088', '2026-04-01'],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      const parsed = parseBadgeExcel(buffer);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('赵六');
      expect(parsed[0].department).toBe('技术部');
      expect(parsed[0].post).toBe('主管');
      expect(parsed[0].workNo).toBe('8088');
      expect(parsed[0].entryDate).toBe('2026-04-01');
    });
  });

  describe('convertUsersToBadges', () => {
    it('should map user records to badge items', () => {
      const mockUsers = [
        { id: 'u1', name: '数字官A', workId: '2026001', assignedAreas: '1号厂房' },
        { id: 'u2', name: null, workId: '2026002', assignedAreas: null },
      ];

      const badges = convertUsersToBadges(mockUsers);
      expect(badges.length).toBe(2);
      expect(badges[0].name).toBe('数字官A');
      expect(badges[0].department).toBe('1号厂房');
      expect(badges[0].workNo).toBe('2026001');

      expect(badges[1].name).toBe('2026002');
      expect(badges[1].department).toBe('数字官工作组');
      expect(badges[1].workNo).toBe('2026002');
    });
  });
});
