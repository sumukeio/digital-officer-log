import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ShiftClient from '@/app/shifts/shift-client';
import { ShiftGlobalConfig, ShiftWorker, ShiftCheckResult } from '@/lib/shifts/types';

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: React.ReactNode }) {
    return <div data-testid="react-markdown">{children}</div>;
  };
});

jest.mock('@/app/actions/shifts', () => ({
  addShiftWorker: jest.fn(),
  updateShiftWorker: jest.fn(),
  deleteShiftWorker: jest.fn(),
  saveShiftConfig: jest.fn(),
  triggerShiftNotification: jest.fn(),
  getShiftData: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockConfig: ShiftGlobalConfig = {
  webhookUrl: 'https://qyapi.weixin.qq.com/mock',
  defaultCycle: 14,
  notifyHour: 8,
  notifyMinute: 0,
  isEnabled: true,
};

const mockWorkers: ShiftWorker[] = [
  { name: '张三', shiftDate: '2026-09-02', targetShift: '白班', cycleDays: 14, department: 'A组' },
  { name: '李四', shiftDate: '2026-09-05', targetShift: '夜班', cycleDays: 14, department: 'B组' },
];

const mockScheduleResult: ShiftCheckResult = {
  today: new Date(2026, 8, 1),
  tomorrow: new Date(2026, 8, 2),
  todayStr: '2026-09-01',
  tomorrowStr: '2026-09-02',
  dataChanged: false,
  healedWorkers: mockWorkers,
  tomorrowAlerts: [
    { name: '张三', targetShift: '白班', nextDate: '2026-09-16', nextShift: '夜班', cycleDays: 14 },
  ],
  allStatuses: [
    {
      worker: mockWorkers[0],
      shiftDateStr: '2026-09-02',
      monthDayStr: '09-02',
      weekdayStr: '周三',
      diffDays: 1,
      statusTag: 'tomorrow',
      statusDesc: '【明天转班】',
      statusColor: 'info',
    },
    {
      worker: mockWorkers[1],
      shiftDateStr: '2026-09-05',
      monthDayStr: '09-05',
      weekdayStr: '周六',
      diffDays: 4,
      statusTag: 'upcoming',
      statusDesc: '4天后',
      statusColor: 'warning',
    },
  ],
  markdownMessage: '### 📢 【转班预警 & 排班核对通知】\n> 👤 **张三** ➔ 明天转 白班',
};

describe('ShiftClient Component', () => {
  it('renders ShiftClient with page title, metrics and roster table', () => {
    render(
      <ShiftClient
        currentUser={{ id: '1', name: '数字官', workId: 'DO-001' }}
        initialConfig={mockConfig}
        initialWorkers={mockWorkers}
        initialScheduleResult={mockScheduleResult}
      />
    );

    expect(screen.getByText('转班提醒小助手')).toBeInTheDocument();
    expect(screen.getByText('今日日期')).toBeInTheDocument();
    expect(screen.getByText('明日转班人员')).toBeInTheDocument();
    expect(screen.getByText('在册监控员工')).toBeInTheDocument();

    // Roster rows
    expect(screen.getAllByText('张三').length).toBeGreaterThan(0);
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getAllByText(/明天转班/).length).toBeGreaterThan(0);
    expect(screen.getByText('4 天后')).toBeInTheDocument();
  });

  it('opens add worker dialog when clicking 添加排班 button', () => {
    render(
      <ShiftClient
        currentUser={{ id: '1', name: '数字官', workId: 'DO-001' }}
        initialConfig={mockConfig}
        initialWorkers={mockWorkers}
        initialScheduleResult={mockScheduleResult}
      />
    );

    const addBtn = screen.getByRole('button', { name: /添加排班/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('添加排班员工')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('例如: 张三')).toBeInTheDocument();
  });

  it('opens settings dialog when clicking 配置 button', () => {
    render(
      <ShiftClient
        currentUser={{ id: '1', name: '数字官', workId: 'DO-001' }}
        initialConfig={mockConfig}
        initialWorkers={mockWorkers}
        initialScheduleResult={mockScheduleResult}
      />
    );

    const configBtn = screen.getByRole('button', { name: /配置/i });
    fireEvent.click(configBtn);

    expect(screen.getByText('企业微信 Webhook 与排班配置')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://qyapi.weixin.qq.com/mock')).toBeInTheDocument();
  });
});
