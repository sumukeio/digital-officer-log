import {
  getShiftData,
  addShiftWorker,
  updateShiftWorker,
  deleteShiftWorker,
  saveShiftConfig,
  triggerShiftNotification,
  runDailyShiftCron,
} from '@/app/actions/shifts';
import { prisma } from '@/lib/prisma';
import { sendWecomShiftNotice } from '@/lib/shifts/wecom-notifier';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/lib/shifts/wecom-notifier', () => ({
  sendWecomShiftNotice: jest.fn(),
  buildShiftMarkdownMessage: jest.fn(() => 'Mock Markdown Message'),
}));

describe('Shifts Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShiftData', () => {
    it('should return stored config and workers', async () => {
      const mockConfig = { webhookUrl: 'https://mock-url', defaultCycle: 14, isEnabled: true };
      const mockWorkers = [
        { name: '测试员工', shiftDate: '2099-01-01', targetShift: '白班', cycleDays: 14 },
      ];

      (prisma.systemConfig.findUnique as jest.Mock)
        .mockResolvedValueOnce({ key: 'SHIFT_SCHEDULE_CONFIG', value: JSON.stringify(mockConfig) })
        .mockResolvedValueOnce({ key: 'SHIFT_WORKERS_DATA', value: JSON.stringify(mockWorkers) });

      const data = await getShiftData();
      expect(data.config.webhookUrl).toBe('https://mock-url');
      expect(data.workers.length).toBe(1);
      expect(data.workers[0].name).toBe('测试员工');
    });

    it('should initialize defaults when DB is empty', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({ id: '1' });

      const data = await getShiftData();
      expect(data.workers.length).toBeGreaterThan(0);
      expect(prisma.systemConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('addShiftWorker', () => {
    it('should validate empty name and date', async () => {
      const res1 = await addShiftWorker({ name: '', shiftDate: '2026-09-01', targetShift: '白班', cycleDays: 14 });
      expect(res1.success).toBe(false);

      const res2 = await addShiftWorker({ name: '张三', shiftDate: '', targetShift: '白班', cycleDays: 14 });
      expect(res2.success).toBe(false);
    });

    it('should add valid worker and persist', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify([]),
      });
      (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({ id: '1' });

      const res = await addShiftWorker({
        name: '新人',
        shiftDate: '2099-01-01',
        targetShift: '夜班',
        cycleDays: 14,
      });

      expect(res.success).toBe(true);
      expect(prisma.systemConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('updateShiftWorker & deleteShiftWorker', () => {
    it('should update worker at given index', async () => {
      const initialWorkers = [
        { name: '员工A', shiftDate: '2099-01-01', targetShift: '白班', cycleDays: 14 },
      ];
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify(initialWorkers),
      });
      (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({ id: '1' });

      const res = await updateShiftWorker(0, {
        name: '员工A改',
        shiftDate: '2099-01-05',
        targetShift: '夜班',
        cycleDays: 14,
      });

      expect(res.success).toBe(true);
      expect(prisma.systemConfig.upsert).toHaveBeenCalled();
    });

    it('should delete worker at given index', async () => {
      const initialWorkers = [
        { name: '员工A', shiftDate: '2099-01-01', targetShift: '白班', cycleDays: 14 },
      ];
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify(initialWorkers),
      });
      (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({ id: '1' });

      const res = await deleteShiftWorker(0);
      expect(res.success).toBe(true);
    });
  });

  describe('saveShiftConfig', () => {
    it('should save webhook and cycle config', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({ id: '1' });

      const res = await saveShiftConfig({
        webhookUrl: 'https://new-webhook',
        defaultCycle: 7,
      });

      expect(res.success).toBe(true);
      expect(prisma.systemConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'SHIFT_SCHEDULE_CONFIG' },
        })
      );
    });
  });

  describe('triggerShiftNotification & runDailyShiftCron', () => {
    it('should send test notification successfully', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (sendWecomShiftNotice as jest.Mock).mockResolvedValue({
        success: true,
        message: '发送成功',
      });

      const res = await triggerShiftNotification({ isTest: true });
      expect(res.success).toBe(true);
      expect(sendWecomShiftNotice).toHaveBeenCalled();
    });

    it('should run daily cron without throwing', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (sendWecomShiftNotice as jest.Mock).mockResolvedValue({
        success: true,
        message: '发送成功',
      });

      await expect(runDailyShiftCron()).resolves.not.toThrow();
    });
  });
});
