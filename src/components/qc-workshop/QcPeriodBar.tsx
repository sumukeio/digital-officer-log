'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  QcMonthKind,
  QcPeriodMode,
  QcPeriodState,
  buildCustomPeriod,
  buildMonthPeriod,
  buildWeekPeriod,
  shiftMonthPeriod,
  shiftWeekPeriod,
} from '@/lib/qc-workshop/period';
import { getDefaultWeekRange } from '@/lib/weekly-report/date-helper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface QcPeriodBarProps {
  period: QcPeriodState;
  onChange: (next: QcPeriodState) => void;
}

const MODES: { id: QcPeriodMode; label: string }[] = [
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'custom', label: '自定义' },
];

export function QcPeriodBar({ period, onChange }: QcPeriodBarProps) {
  const switchMode = (mode: QcPeriodMode) => {
    if (mode === period.mode) return;
    const today = new Date();
    if (mode === 'week') {
      onChange(buildWeekPeriod(getDefaultWeekRange(today)));
    } else if (mode === 'month') {
      onChange(buildMonthPeriod(today.getFullYear(), today.getMonth() + 1, 'full', today));
    } else {
      const week = getDefaultWeekRange(today);
      onChange(buildCustomPeriod(week.startDate, week.endDate));
    }
  };

  const setMonthKind = (kind: QcMonthKind) => {
    const year = period.year;
    const month = period.month ?? new Date().getMonth() + 1;
    onChange(buildMonthPeriod(year, month, kind));
  };

  const applyCustom = (start: string, end: string) => {
    try {
      onChange(buildCustomPeriod(start, end));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '日期无效');
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {MODES.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant={period.mode === m.id ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 text-xs ${
                period.mode === m.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}
              onClick={() => switchMode(m.id)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {period.mode === 'week' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="上一周"
                onClick={() => onChange(shiftWeekPeriod(period, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onChange(buildWeekPeriod(getDefaultWeekRange(new Date())))}
              >
                本周
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="下一周"
                onClick={() => onChange(shiftWeekPeriod(period, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {period.mode === 'month' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="上一月"
                onClick={() => onChange(shiftMonthPeriod(period, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  const t = new Date();
                  onChange(buildMonthPeriod(t.getFullYear(), t.getMonth() + 1, 'full', t));
                }}
              >
                本月
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="下一月"
                onClick={() => onChange(shiftMonthPeriod(period, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="ml-1 flex gap-1">
                <Button
                  type="button"
                  variant={period.monthKind === 'full' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setMonthKind('full')}
                >
                  整月
                </Button>
                <Button
                  type="button"
                  variant={period.monthKind === 'mtd' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setMonthKind('mtd')}
                >
                  月初至今
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {period.mode === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs text-slate-500">开始</Label>
            <Input
              type="date"
              className="h-9 w-[150px]"
              value={period.startDate}
              onChange={(e) => applyCustom(e.target.value, period.endDate)}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">结束</Label>
            <Input
              type="date"
              className="h-9 w-[150px]"
              value={period.endDate}
              onChange={(e) => applyCustom(period.startDate, e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="text-sm text-slate-700">
        <span className="font-semibold">{period.titleFormatted}</span>
        <span className="text-slate-400 mx-2">·</span>
        <span className="text-slate-500">{period.periodLabel}</span>
        <span className="text-slate-400 mx-2">·</span>
        <span className="text-xs text-slate-400">整表当作本区间（不按开卡时间裁剪）</span>
      </div>
    </div>
  );
}
