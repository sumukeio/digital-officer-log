import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { sendDailyReminder } from '@/lib/cron';
import { saveDailyReminderConfig, triggerTestReminderAction } from '@/app/actions/admin';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    dailyReport: {
      count: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Daily Report Reminder System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip sending if DAILY_REMINDER_ENABLED is false', async () => {
    (prisma.systemConfig.findMany as jest.Mock).mockResolvedValueOnce([
      { key: 'DAILY_REMINDER_ENABLED', value: 'false' },
    ]);

    const res = await sendDailyReminder(false);
    expect(res.success).toBe(true);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should format and send reminder with replaced variables', async () => {
    (prisma.systemConfig.findMany as jest.Mock).mockResolvedValueOnce([
      { key: 'DAILY_REMINDER_ENABLED', value: 'true' },
      { key: 'DAILY_REMINDER_TEMPLATE', value: '今日人数: {count}, 日期: {date}, 链接: {url}' },
      { key: 'DAILY_REMINDER_WEBHOOK', value: 'https://qyapi.weixin.qq.com/mock-webhook' },
    ]);

    (prisma.dailyReport.count as jest.Mock).mockResolvedValueOnce(5);
    mockedAxios.post.mockResolvedValueOnce({ data: { errcode: 0, errmsg: 'ok' } });

    const res = await sendDailyReminder(false);
    expect(res.success).toBe(true);
    expect(res.count).toBe(5);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://qyapi.weixin.qq.com/mock-webhook',
      expect.objectContaining({
        markdown: expect.objectContaining({
          content: expect.stringContaining('今日人数: 5'),
        }),
      }),
      expect.any(Object)
    );
  });

  it('should support test mode prefix', async () => {
    (prisma.systemConfig.findMany as jest.Mock).mockResolvedValueOnce([
      { key: 'DAILY_REMINDER_ENABLED', value: 'true' },
      { key: 'DAILY_REMINDER_TEMPLATE', value: '进度: {count}' },
      { key: 'DAILY_REMINDER_WEBHOOK', value: 'https://qyapi.weixin.qq.com/mock-webhook' },
    ]);

    (prisma.dailyReport.count as jest.Mock).mockResolvedValueOnce(0);
    mockedAxios.post.mockResolvedValueOnce({ data: { errcode: 0, errmsg: 'ok' } });

    const res = await triggerTestReminderAction();
    expect(res.success).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://qyapi.weixin.qq.com/mock-webhook',
      expect.objectContaining({
        markdown: expect.objectContaining({
          content: expect.stringContaining('【测试发送】'),
        }),
      }),
      expect.any(Object)
    );
  });

  it('should save reminder configs properly via Server Action', async () => {
    const formData = new FormData();
    formData.append('reminder_enabled', 'on');
    formData.append('reminder_time', '17:30');
    formData.append('reminder_template', '自定义模板 {count}');
    formData.append('reminder_webhook', 'https://qyapi.weixin.qq.com/new-hook');

    (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({});

    const res = await saveDailyReminderConfig(formData);
    expect(res.success).toBe(true);
    expect(prisma.systemConfig.upsert).toHaveBeenCalledTimes(4);
  });
});
