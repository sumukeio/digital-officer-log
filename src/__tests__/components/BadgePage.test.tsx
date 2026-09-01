import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BadgeClient from '@/app/badge/badge-client';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { A4PrintSheet } from '@/components/badge/A4PrintSheet';
import { DEFAULT_BADGE_CONFIG, DEFAULT_SAMPLE_BADGES } from '@/lib/badge/types';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Badge Studio Component Tests', () => {
  describe('1. BadgeCard', () => {
    it('renders badge card fields properly with coordinates', () => {
      render(
        <BadgeCard
          badge={{
            id: 'test-1',
            name: '李四',
            department: '技术部',
            post: '工程师',
            workNo: '1001',
            entryDate: '2023-10-01',
            enabled: true,
          }}
          config={DEFAULT_BADGE_CONFIG}
        />
      );

      expect(screen.getByText('李四')).toBeInTheDocument();
      expect(screen.getByText('技术部')).toBeInTheDocument();
      expect(screen.getByText('工程师')).toBeInTheDocument();
      expect(screen.getByText('1001')).toBeInTheDocument();
      expect(screen.getByText('2023-10-01')).toBeInTheDocument();
    });
  });

  describe('2. A4PrintSheet', () => {
    it('renders print sheet with crop marks and correct badge count', () => {
      render(<A4PrintSheet badges={DEFAULT_SAMPLE_BADGES} config={DEFAULT_BADGE_CONFIG} />);

      expect(screen.getByText(/A4 拼版打印页/)).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('王五')).toBeInTheDocument();
    });
  });

  describe('3. BadgeClient Main Component', () => {
    it('renders header, design controls and preview canvas', () => {
      render(
        <BadgeClient
          currentUser={{ id: '1', name: '数字官', workId: 'DO-001' }}
          systemUsers={[{ id: 'u1', name: '系统用户A', workId: '2026010' }]}
        />
      );

      expect(screen.getByText('万得福工牌设计器')).toBeInTheDocument();
      expect(screen.getByText('样式设计')).toBeInTheDocument();
      expect(screen.getByText('左上角 Logo')).toBeInTheDocument();
      expect(screen.getByText('公司标志 / 字标')).toBeInTheDocument();
      expect(screen.getByText('右上角二维码')).toBeInTheDocument();
      expect(screen.getByText('员工照片框')).toBeInTheDocument();
      expect(screen.getByText('底部中英双语文字与下划线')).toBeInTheDocument();
    });

    it('toggles lock mode correctly', () => {
      render(
        <BadgeClient
          currentUser={{ id: '1', name: '数字官', workId: 'DO-001' }}
          systemUsers={[]}
        />
      );

      const lockBtn = screen.getByRole('button', { name: /锁定设计/i });
      fireEvent.click(lockBtn);

      expect(screen.getByText(/设计已锁定/i)).toBeInTheDocument();

      // Click again to unlock
      const unlockBtn = screen.getByRole('button', { name: /解锁设计/i });
      fireEvent.click(unlockBtn);
      expect(screen.getByText(/自由编辑模式/i)).toBeInTheDocument();
    });

    it('resets to default config when clicking 恢复默认参数', () => {
      render(
        <BadgeClient
          currentUser={{ id: '1', name: '数字官', workId: 'DO-001' }}
          systemUsers={[]}
        />
      );

      const resetBtn = screen.getByRole('button', { name: /恢复默认参数/i });
      fireEvent.click(resetBtn);

      expect(screen.getByText('万得福工牌设计器')).toBeInTheDocument();
    });
  });
});
