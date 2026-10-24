import {
  saveHeadlineBrief,
  getHeadlineBriefByPeriod,
  getHeadlineBriefList,
  pushHeadlineBriefToWecom,
  getProblemSkeletonFromWeeklyReport,
} from '@/app/actions/headline-brief';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { getWecomWebhookConfig } from '@/app/actions/weekly-report';
import axios from 'axios';

jest.mock('@/app/actions/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/app/actions/weekly-report', () => ({
  getWecomWebhookConfig: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('axios');

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    headlineBrief: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    weeklyReport: {
      findFirst: jest.fn(),
    },
  },
}));

describe('Headline Brief Server Actions', () => {
  const mockUser = { id: 'user-1', name: '数字官', workId: 'DO001' };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  it('应能按周期查询简报', async () => {
    (prisma.headlineBrief.findUnique as jest.Mock).mockResolvedValue({
      id: 'hb-1',
      year: 2026,
      weekNumber: 37,
    });
    const res = await getHeadlineBriefByPeriod(2026, 37);
    expect(res?.id).toBe('hb-1');
  });

  it('应能保存简报', async () => {
    (prisma.headlineBrief.upsert as jest.Mock).mockResolvedValue({ id: 'hb-2' });
    const res = await saveHeadlineBrief({
      title: '9.8-9.14 头条周简报',
      startDate: '2026-09-08',
      endDate: '2026-09-14',
      weekNumber: 37,
      year: 2026,
      modules: [],
      markdownContent: '### test',
    });
    expect(res.success).toBe(true);
    expect(res.id).toBe('hb-2');
  });

  it('内容为空时应拒绝保存', async () => {
    const res = await saveHeadlineBrief({
      title: 'x',
      startDate: '2026-09-08',
      endDate: '2026-09-14',
      weekNumber: 37,
      year: 2026,
      modules: [],
      markdownContent: '  ',
    });
    expect(res.success).toBe(false);
  });

  it('应返回历史列表', async () => {
    (prisma.headlineBrief.findMany as jest.Mock).mockResolvedValue([{ id: 'hb-1' }]);
    const list = await getHeadlineBriefList(10);
    expect(list).toHaveLength(1);
  });

  it('企微推送成功应回写状态', async () => {
    (getWecomWebhookConfig as jest.Mock).mockResolvedValue('https://hook.test');
    (axios.post as jest.Mock).mockResolvedValue({ data: { errcode: 0 } });
    (prisma.headlineBrief.update as jest.Mock).mockResolvedValue({});

    const res = await pushHeadlineBriefToWecom({
      briefId: 'hb-1',
      markdownContent: '### hello',
    });
    expect(res.success).toBe(true);
    expect(prisma.headlineBrief.update).toHaveBeenCalled();
  });

  it('应从 WeeklyReport metrics 生成问题骨架', async () => {
    (prisma.weeklyReport.findFirst as jest.Mock).mockResolvedValue({
      metrics: JSON.stringify({
        production: {
          totalCards: 10,
          over24Count: 1,
          over48Count: 0,
          over48Details: [],
          workshopStats: [
            { workshop: '智造三部', shortName: '三部', count: 6, percentage: 60 },
          ],
        },
      }),
    });
    const res = await getProblemSkeletonFromWeeklyReport(2026, 37, 'production');
    expect(res.success).toBe(true);
    expect(res.module?.problems[0].title).toMatch(/智造三部/);
  });

  it('无指标周报时应返回失败信息', async () => {
    (prisma.weeklyReport.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await getProblemSkeletonFromWeeklyReport(2026, 37);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/尚未保存/);
  });
});
