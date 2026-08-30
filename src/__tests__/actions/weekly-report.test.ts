import {
  saveWeeklyReport,
  getLastWeekMetrics,
  getWeeklyReportList,
  getWecomWebhookConfig,
  saveWecomWebhookConfig,
  pushWeeklyReportToWecom,
} from '@/app/actions/weekly-report';
import { DEFAULT_WECOM_WEBHOOK } from '@/lib/weekly-report/types';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import axios from 'axios';

jest.mock('@/app/actions/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('axios');

jest.mock('@/lib/prisma', () => ({
  prisma: {
    systemConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    weeklyReport: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Weekly Report Server Actions 测试', () => {
  const mockUser = {
    id: 'user-123',
    name: '数字官测试员',
    workId: 'DO001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Webhook 配置管理', () => {
    it('当系统存在配置时应返回已保存的 Webhook', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({
        value: 'https://qyapi.weixin.qq.com/custom_hook',
      });
      const url = await getWecomWebhookConfig();
      expect(url).toBe('https://qyapi.weixin.qq.com/custom_hook');
    });

    it('当系统无配置时应返回默认 Webhook', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      const url = await getWecomWebhookConfig();
      expect(url).toBe(DEFAULT_WECOM_WEBHOOK);
    });

    it('应能正确更新保存 Webhook 配置', async () => {
      (prisma.systemConfig.upsert as jest.Mock).mockResolvedValue({
        key: 'WECOM_WEBHOOK_URL',
        value: 'https://qyapi.weixin.qq.com/new_hook',
      });
      const res = await saveWecomWebhookConfig('https://qyapi.weixin.qq.com/new_hook');
      expect(res.success).toBe(true);
      expect(prisma.systemConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('2. 上周指标基准拉取 (getLastWeekMetrics)', () => {
    it('应正确拉取并解析上周关键指标', async () => {
      (prisma.weeklyReport.findFirst as jest.Mock).mockResolvedValue({
        id: 'report-last-week',
        year: 2026,
        weekNumber: 34,
        metrics: JSON.stringify({
          production: { totalCards: 18 },
          qc: { totalCards: 54 },
          punch: { totalPunches: 288 },
        }),
      });

      const baseline = await getLastWeekMetrics(2026, 35);
      expect(baseline).not.toBeNull();
      expect(baseline?.productionTotal).toBe(18);
      expect(baseline?.qcTotal).toBe(54);
      expect(baseline?.punchTotal).toBe(288);
    });

    it('无历史记录时应返回 null', async () => {
      (prisma.weeklyReport.findFirst as jest.Mock).mockResolvedValue(null);
      const baseline = await getLastWeekMetrics(2026, 35);
      expect(baseline).toBeNull();
    });
  });

  describe('3. 周报保存与查询 (saveWeeklyReport & getWeeklyReportList)', () => {
    it('登录用户应能成功保存周报', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.weeklyReport.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.weeklyReport.create as jest.Mock).mockResolvedValue({
        id: 'report-new',
        title: '8.24-8.30周报',
        userId: mockUser.id,
      });

      const res = await saveWeeklyReport({
        title: '8.24-8.30周报',
        startDate: '2026-08-24',
        endDate: '2026-08-30',
        year: 2026,
        weekNumber: 35,
        metrics: { production: { totalCards: 12 } },
        manualSections: { inspection: '正常' },
        content: '8.24-8.30周报内容',
      });

      expect(res.success).toBe(true);
      expect(res.report?.id).toBe('report-new');
      expect(prisma.weeklyReport.create).toHaveBeenCalled();
    });

    it('未登录时应提示登录', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);
      const res = await saveWeeklyReport({
        title: '8.24-8.30周报',
        startDate: '2026-08-24',
        endDate: '2026-08-30',
        year: 2026,
        weekNumber: 35,
        metrics: {},
        manualSections: {},
        content: '',
      });
      expect(res.success).toBe(false);
      expect(res.message).toContain('请先登录');
    });

    it('应能正确获取周报历史列表', async () => {
      (prisma.weeklyReport.findMany as jest.Mock).mockResolvedValue([
        { id: 'rep-1', title: '8.24-8.30周报' },
        { id: 'rep-2', title: '8.17-8.23周报' },
      ]);
      const list = await getWeeklyReportList();
      expect(list.length).toBe(2);
    });
  });

  describe('4. 企微群机器人 Webhook 推送 (pushWeeklyReportToWecom)', () => {
    it('成功调用 Webhook 时应返回推送成功', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (axios.post as jest.Mock).mockResolvedValue({
        data: { errcode: 0, errmsg: 'ok' },
      });

      const res = await pushWeeklyReportToWecom({
        markdownContent: '### 周报测试推送',
      });

      expect(res.success).toBe(true);
      expect(res.message).toContain('成功');
      expect(axios.post).toHaveBeenCalled();
    });

    it('企微返回错误码时应返回失败信息', async () => {
      (prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
      (axios.post as jest.Mock).mockResolvedValue({
        data: { errcode: 93000, errmsg: 'invalid webhook url' },
      });

      const res = await pushWeeklyReportToWecom({
        markdownContent: '### 周报测试推送',
      });

      expect(res.success).toBe(false);
      expect(res.message).toContain('invalid webhook url');
    });
  });
});
