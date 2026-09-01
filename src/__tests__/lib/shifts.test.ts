import {
  flipShift,
  parseDateSafe,
  formatDateSafe,
  selfHealWorker,
  calculateWorkerStatus,
  processShiftSchedule,
} from '@/lib/shifts/shift-algorithm';
import { buildShiftMarkdownMessage, sendWecomShiftNotice } from '@/lib/shifts/wecom-notifier';
import { ShiftWorker } from '@/lib/shifts/types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Shift Algorithm & Notifier Tests', () => {
  describe('flipShift', () => {
    it('should flip between 白班 and 夜班 correctly', () => {
      expect(flipShift('白班')).toBe('夜班');
      expect(flipShift('夜班')).toBe('白班');
      expect(flipShift('早班')).toBe('中班');
      expect(flipShift('中班')).toBe('夜班');
      expect(flipShift('纯白班')).toBe('夜班');
    });

    it('should fallback to 白班 if empty', () => {
      expect(flipShift('')).toBe('白班');
    });
  });

  describe('parseDateSafe & formatDateSafe', () => {
    it('should parse YYYY-MM-DD strings accurately', () => {
      const d = parseDateSafe('2026-09-01');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(8); // September is index 8
      expect(d.getDate()).toBe(1);
      expect(formatDateSafe(d)).toBe('2026-09-01');
    });

    it('should handle Date object inputs', () => {
      const input = new Date(2026, 8, 15, 14, 30, 0);
      const parsed = parseDateSafe(input);
      expect(parsed.getHours()).toBe(0);
      expect(formatDateSafe(parsed)).toBe('2026-09-15');
    });
  });

  describe('selfHealWorker', () => {
    it('should heal expired shift dates to the next valid cycle >= today', () => {
      // Today is 2026-09-01, worker shift date was 2026-08-18 (14 days ago)
      const worker: ShiftWorker = {
        name: '张三',
        shiftDate: '2026-08-18',
        targetShift: '白班',
        cycleDays: 14,
      };

      const today = new Date(2026, 8, 1); // 2026-09-01
      const { worker: healed, hasHealed } = selfHealWorker(worker, today);

      expect(hasHealed).toBe(true);
      expect(healed.shiftDate).toBe('2026-09-01');
      // Flipped once: 白班 -> 夜班
      expect(healed.targetShift).toBe('夜班');
    });

    it('should heal across multiple missed cycles and flip multiple times', () => {
      // 28 days ago (2 cycles)
      const worker: ShiftWorker = {
        name: '李四',
        shiftDate: '2026-08-03',
        targetShift: '白班',
        cycleDays: 14,
      };

      const today = new Date(2026, 8, 1); // 2026-09-01
      const { worker: healed, hasHealed } = selfHealWorker(worker, today);

      expect(hasHealed).toBe(true);
      // 08-03 + 14 = 08-17 (夜班) + 14 = 08-31 (白班) + 14 = 09-14 (夜班)
      expect(healed.shiftDate).toBe('2026-09-14');
      expect(healed.targetShift).toBe('夜班');
    });

    it('should not modify workers whose shift date is today or future', () => {
      const worker: ShiftWorker = {
        name: '王五',
        shiftDate: '2026-09-05',
        targetShift: '夜班',
        cycleDays: 14,
      };

      const today = new Date(2026, 8, 1);
      const { worker: healed, hasHealed } = selfHealWorker(worker, today);

      expect(hasHealed).toBe(false);
      expect(healed.shiftDate).toBe('2026-09-05');
      expect(healed.targetShift).toBe('夜班');
    });
  });

  describe('calculateWorkerStatus', () => {
    const today = new Date(2026, 8, 1); // 2026-09-01

    it('should return 【今天转班】 for diffDays = 0', () => {
      const status = calculateWorkerStatus(
        { name: 'A', shiftDate: '2026-09-01', targetShift: '白班', cycleDays: 14 },
        today
      );
      expect(status.diffDays).toBe(0);
      expect(status.statusTag).toBe('today');
      expect(status.statusDesc).toBe('【今天转班】');
    });

    it('should return 【明天转班】 for diffDays = 1', () => {
      const status = calculateWorkerStatus(
        { name: 'B', shiftDate: '2026-09-02', targetShift: '夜班', cycleDays: 14 },
        today
      );
      expect(status.diffDays).toBe(1);
      expect(status.statusTag).toBe('tomorrow');
      expect(status.statusDesc).toBe('【明天转班】');
    });

    it('should return N天后 for future days', () => {
      const status = calculateWorkerStatus(
        { name: 'C', shiftDate: '2026-09-08', targetShift: '夜班', cycleDays: 14 },
        today
      );
      expect(status.diffDays).toBe(7);
      expect(status.statusTag).toBe('upcoming');
      expect(status.statusDesc).toBe('7天后');
    });
  });

  describe('processShiftSchedule', () => {
    it('should detect tomorrow switchers, create alerts and advance their schedule', () => {
      const today = new Date(2026, 8, 1); // 2026-09-01
      const workers: ShiftWorker[] = [
        { name: '张三', shiftDate: '2026-09-02', targetShift: '白班', cycleDays: 14 },
        { name: '李四', shiftDate: '2026-09-05', targetShift: '夜班', cycleDays: 14 },
      ];

      const result = processShiftSchedule(workers, { today });

      expect(result.tomorrowAlerts.length).toBe(1);
      expect(result.tomorrowAlerts[0].name).toBe('张三');
      expect(result.tomorrowAlerts[0].targetShift).toBe('白班');
      expect(result.tomorrowAlerts[0].nextDate).toBe('2026-09-16');
      expect(result.tomorrowAlerts[0].nextShift).toBe('夜班');

      // Check healedWorkers updated
      const updatedZhang = result.healedWorkers.find((w) => w.name === '张三');
      expect(updatedZhang?.shiftDate).toBe('2026-09-16');
      expect(updatedZhang?.targetShift).toBe('夜班');
      expect(result.dataChanged).toBe(true);
    });

    it('should work cleanly when no one switches tomorrow', () => {
      const today = new Date(2026, 8, 1);
      const workers: ShiftWorker[] = [
        { name: '王五', shiftDate: '2026-09-10', targetShift: '白班', cycleDays: 14 },
      ];

      const result = processShiftSchedule(workers, { today });
      expect(result.tomorrowAlerts.length).toBe(0);
      expect(result.markdownMessage).toContain('明日无人员转班');
    });
  });

  describe('buildShiftMarkdownMessage & Wecom Notifier', () => {
    it('should format Markdown text with alerts and all statuses', () => {
      const today = new Date(2026, 8, 1);
      const tomorrow = new Date(2026, 8, 2);
      const tomorrowAlerts = [
        { name: '张三', targetShift: '夜班', nextDate: '2026-09-16', nextShift: '白班', cycleDays: 14 },
      ];
      const allStatuses = [
        calculateWorkerStatus({ name: '张三', shiftDate: '2026-09-16', targetShift: '夜班', cycleDays: 14 }, today),
      ];

      const md = buildShiftMarkdownMessage({
        today,
        tomorrow,
        tomorrowAlerts,
        allStatuses,
        isTest: false,
      });

      expect(md).toContain('【转班预警 & 排班核对通知】');
      expect(md).toContain('张三');
      expect(md).toContain('夜班');
      expect(md).toContain('明日日期');
    });

    it('should send notification via axios correctly', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { errcode: 0, errmsg: 'ok' },
      });

      const res = await sendWecomShiftNotice('测试消息内容', 'https://qyapi.weixin.qq.com/mock-webhook');
      expect(res.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://qyapi.weixin.qq.com/mock-webhook',
        expect.objectContaining({ msgtype: 'markdown' }),
        expect.any(Object)
      );
    });

    it('should handle webhook error responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { errcode: 93000, errmsg: 'invalid webhook url' },
      });

      const res = await sendWecomShiftNotice('测试消息内容', 'https://qyapi.weixin.qq.com/mock-webhook');
      expect(res.success).toBe(false);
      expect(res.errcode).toBe(93000);
    });
  });
});
