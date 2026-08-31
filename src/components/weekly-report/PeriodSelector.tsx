"use client";

import React from "react";
import { DateRangeInfo, LastWeekBaseline } from "@/lib/weekly-report/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { getDefaultWeekRange } from "@/lib/weekly-report/date-helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PeriodSelectorProps {
  dateRange: DateRangeInfo;
  onChangeDateRange: (newRange: DateRangeInfo) => void;
  baseline: LastWeekBaseline | null;
  onUpdateBaseline: (newBaseline: LastWeekBaseline) => void;
}

export function PeriodSelector({
  dateRange,
  onChangeDateRange,
  baseline,
  onUpdateBaseline,
}: PeriodSelectorProps) {
  const [baselineOpen, setBaselineOpen] = React.useState(false);
  const [customProd, setCustomProd] = React.useState<string>(
    baseline?.productionTotal !== undefined ? String(baseline.productionTotal) : ""
  );
  const [customQc, setCustomQc] = React.useState<string>(
    baseline?.qcTotal !== undefined ? String(baseline.qcTotal) : ""
  );
  const [customPunch, setCustomPunch] = React.useState<string>(
    baseline?.punchTotal !== undefined ? String(baseline.punchTotal) : ""
  );
  const [customOkr, setCustomOkr] = React.useState<string>(
    baseline?.okrTotal !== undefined ? String(baseline.okrTotal) : ""
  );

  React.useEffect(() => {
    setCustomProd(baseline?.productionTotal !== undefined ? String(baseline.productionTotal) : "");
    setCustomQc(baseline?.qcTotal !== undefined ? String(baseline.qcTotal) : "");
    setCustomPunch(baseline?.punchTotal !== undefined ? String(baseline.punchTotal) : "");
    setCustomOkr(baseline?.okrTotal !== undefined ? String(baseline.okrTotal) : "");
  }, [baseline]);

  // 切换上一周 / 下一周
  const handleShiftWeek = (offsetWeeks: number) => {
    const currentStart = new Date(dateRange.startDate);
    currentStart.setDate(currentStart.getDate() + offsetWeeks * 7);
    const newRange = getDefaultWeekRange(currentStart);
    onChangeDateRange(newRange);
  };

  // 重置为本周
  const handleResetCurrentWeek = () => {
    onChangeDateRange(getDefaultWeekRange(new Date()));
  };

  // 保存手动调整的基准
  const handleSaveBaseline = () => {
    onUpdateBaseline({
      productionTotal: customProd ? parseInt(customProd, 10) : undefined,
      qcTotal: customQc ? parseInt(customQc, 10) : undefined,
      punchTotal: customPunch ? parseInt(customPunch, 10) : undefined,
      okrTotal: customOkr ? parseInt(customOkr, 10) : undefined,
    });
    setBaselineOpen(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* 周期切换与标题 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-slate-900"
            onClick={() => handleShiftWeek(-1)}
            title="上一周"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs font-medium px-2.5 bg-white text-slate-800 shadow-sm"
            onClick={handleResetCurrentWeek}
          >
            本周
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-slate-900"
            onClick={() => handleShiftWeek(1)}
            title="下一周"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-base font-bold text-slate-800">
              {dateRange.year}年 第 {dateRange.weekNumber} 周 (
              <span className="text-blue-600">{dateRange.titleFormatted}</span>)
            </div>
            <div className="text-xs text-slate-400">
              {dateRange.startDate} ~ {dateRange.endDate} (自然周一至周日)
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：起止日期自定义与基准值配置 */}
      <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>起:</span>
          <Input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => {
              const start = e.target.value;
              if (start) {
                const s = new Date(start);
                const e = new Date(dateRange.endDate);
                onChangeDateRange({
                  ...dateRange,
                  startDate: start,
                  startFormatted: `${s.getMonth() + 1}.${s.getDate()}`,
                  titleFormatted: `${s.getMonth() + 1}.${s.getDate()}-${e.getMonth() + 1}.${e.getDate()}`,
                });
              }
            }}
            className="h-8 w-32 text-xs py-1 px-2"
          />
          <span>止:</span>
          <Input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => {
              const end = e.target.value;
              if (end) {
                const s = new Date(dateRange.startDate);
                const e = new Date(end);
                onChangeDateRange({
                  ...dateRange,
                  endDate: end,
                  endFormatted: `${e.getMonth() + 1}.${e.getDate()}`,
                  titleFormatted: `${s.getMonth() + 1}.${s.getDate()}-${e.getMonth() + 1}.${e.getDate()}`,
                });
              }
            }}
            className="h-8 w-32 text-xs py-1 px-2"
          />
        </div>

        {/* 环比基准微调弹窗 */}
        <Dialog open={baselineOpen} onOpenChange={setBaselineOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>上周基准值</span>
              {Boolean(
                baseline &&
                (baseline.productionTotal !== undefined ||
                  baseline.qcTotal !== undefined ||
                  baseline.punchTotal !== undefined ||
                  baseline.okrTotal !== undefined ||
                  baseline.leanTotal !== undefined)
              ) ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="已具备上周基准" />
              ) : (
                <span className="text-[11px] text-slate-400 font-normal">(空)</span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800">
                上周指标基准值配置 (用于环比计算)
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-slate-500">
              系统会自动从上周已保存的周报中拉取基准数据。您也可以在此直接修改或补全上周的实际指标值。
            </p>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div>
                <Label className="text-xs text-slate-600">生产头条开卡数</Label>
                <Input
                  type="number"
                  placeholder="如: 18"
                  value={customProd}
                  onChange={(e) => setCustomProd(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">QC头条开卡数</Label>
                <Input
                  type="number"
                  placeholder="如: 54"
                  value={customQc}
                  onChange={(e) => setCustomQc(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">新随拍打卡人次</Label>
                <Input
                  type="number"
                  placeholder="如: 288"
                  value={customPunch}
                  onChange={(e) => setCustomPunch(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600">OKR 开卡数</Label>
                <Input
                  type="number"
                  placeholder="如: 5"
                  value={customOkr}
                  onChange={(e) => setCustomOkr(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBaselineOpen(false)}
              >
                取消
              </Button>
              <Button size="sm" onClick={handleSaveBaseline}>
                确定生效
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
