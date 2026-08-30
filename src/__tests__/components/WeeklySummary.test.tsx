import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PeriodSelector } from '@/components/weekly-report/PeriodSelector';
import { MetricsOverview } from '@/components/weekly-report/MetricsOverview';
import { ManualForm } from '@/components/weekly-report/ManualForm';
import { DEFAULT_MANUAL_SECTIONS } from '@/lib/weekly-report/report-generator';

describe('周报前端 UI 组件测试', () => {
  describe('1. PeriodSelector 周期选择器', () => {
    const mockDateRange = {
      startDate: '2026-08-24',
      endDate: '2026-08-30',
      startFormatted: '8.24',
      endFormatted: '8.30',
      titleFormatted: '8.24-8.30',
      year: 2026,
      weekNumber: 35,
    };

    it('应正确渲染当前年份、周数和起止日期', () => {
      render(
        <PeriodSelector
          dateRange={mockDateRange}
          onChangeDateRange={jest.fn()}
          baseline={null}
          onUpdateBaseline={jest.fn()}
        />
      );

      expect(screen.getByText(/2026年 第 35 周/)).toBeInTheDocument();
      expect(screen.getByText('8.24-8.30')).toBeInTheDocument();
    });

    it('点击本周按钮应触发重置', () => {
      const onChange = jest.fn();
      render(
        <PeriodSelector
          dateRange={mockDateRange}
          onChangeDateRange={onChange}
          baseline={null}
          onUpdateBaseline={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('本周'));
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('2. MetricsOverview 实时指标卡片', () => {
    it('应正确渲染生产头条与 QC 头条的开卡数与车间占比', () => {
      render(
        <MetricsOverview
          metrics={{
            production: {
              totalCards: 12,
              over24Count: 3,
              over48Count: 1,
              over48Details: [{ id: '1', title: '测试停机', workshop: '智造一部', owner: '张三', duration: 50 }],
              workshopStats: [
                { workshop: '智造一部', shortName: '一部', count: 4, percentage: 33 },
                { workshop: '智造五部', shortName: '五部', count: 2, percentage: 17 },
              ],
              wowRate: -33.3,
            },
            qc: {
              totalCards: 54,
              over24Count: 12,
              over48Count: 7,
              over48Details: [],
              wowRate: -57,
            },
          }}
        />
      );

      expect(screen.getByText('生产头条')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('QC 头条')).toBeInTheDocument();
      expect(screen.getByText('54')).toBeInTheDocument();
      expect(screen.getByText(/环比跌 33%/)).toBeInTheDocument();
      expect(screen.getByText(/一部 33%/)).toBeInTheDocument();
    });
  });

  describe('3. ManualForm 手写填报与模块开关', () => {
    it('应正确渲染模块勾选列表和手写反思输入框', () => {
      render(
        <ManualForm
          manualSections={{
            ...DEFAULT_MANUAL_SECTIONS,
            productionReflection: '由于关闭企微提醒，开卡后无法主动提醒到责任人',
          }}
          onChangeManualSections={jest.fn()}
          activeModules={{ production: true, qc: true, dudu: true }}
          onToggleModule={jest.fn()}
        />
      );

      expect(screen.getAllByText('生产头条').length).toBeGreaterThan(0);
      expect(screen.getAllByText('QC头条').length).toBeGreaterThan(0);
      expect(screen.getAllByText('嘟嘟卡').length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue(/由于关闭企微提醒/)).toBeInTheDocument();
    });
  });
});
