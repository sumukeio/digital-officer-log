"use client";

import React, { useState } from "react";
import { AllWeeklyMetrics } from "@/lib/weekly-report/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Factory,
  CheckCircle,
  Clock,
  Camera,
  Target,
  Sparkles,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MetricsOverviewProps {
  metrics: AllWeeklyMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const [detailModal, setDetailModal] = useState<{
    title: string;
    items: any[];
  } | null>(null);

  const renderWowBadge = (rate?: number | null) => {
    if (rate === undefined || rate === null) {
      return (
        <span className="text-xs text-slate-400 font-normal">暂无上周基准</span>
      );
    }
    if (rate === 0) {
      return (
        <Badge
          variant="outline"
          className="text-xs font-normal text-slate-600 bg-slate-100 border-slate-200 flex items-center gap-1"
        >
          <Minus className="w-3 h-3" /> 持平
        </Badge>
      );
    }
    if (rate < 0) {
      return (
        <Badge
          variant="outline"
          className="text-xs font-semibold text-rose-700 bg-rose-50 border-rose-200 flex items-center gap-1"
        >
          <TrendingDown className="w-3 h-3" /> 环比跌 {Math.abs(Math.round(rate))}%
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-xs font-semibold text-emerald-700 bg-emerald-50 border-emerald-200 flex items-center gap-1"
      >
        <TrendingUp className="w-3 h-3" /> 环比涨 {Math.round(rate)}%
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. 生产头条指标卡 */}
        <Card className="border-blue-200 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-bold text-slate-800">生产头条</CardTitle>
            </div>
            {metrics.production && renderWowBadge(metrics.production.wowRate)}
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {metrics.production ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {metrics.production.totalCards}
                  </span>
                  <span className="text-xs text-slate-500">条开卡</span>
                </div>

                {/* 超时情况 */}
                <div className="flex items-center gap-2 text-xs">
                  {metrics.production.over48Count > 0 ? (
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "生产头条停机超过48小时明细",
                          items: metrics.production!.over48Details,
                        })
                      }
                      className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100 flex items-center gap-1 font-medium transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      超48h: {metrics.production.over48Count} 条
                    </button>
                  ) : (
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      无超48h停机
                    </span>
                  )}
                  <span className="text-slate-500">
                    超24h: {metrics.production.over24Count} 条
                  </span>
                </div>

                {/* 车间分布占比标签 */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 mb-1">车间开卡分布:</div>
                  <div className="flex flex-wrap gap-1">
                    {metrics.production.workshopStats.map((ws) => (
                      <span
                        key={ws.workshop}
                        className={`text-[11px] px-1.5 py-0.5 rounded border ${
                          ws.count > 0
                            ? "bg-blue-100/80 text-blue-900 border-blue-200 font-medium"
                            : "bg-slate-50 text-slate-400 border-slate-100"
                        }`}
                      >
                        {ws.shortName} {ws.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> 拖入生产头条文件后自动分析
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. QC 头条指标卡 */}
        <Card className="border-purple-200 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-sm font-bold text-slate-800">QC 头条</CardTitle>
            </div>
            {metrics.qc && renderWowBadge(metrics.qc.wowRate)}
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {metrics.qc ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {metrics.qc.totalCards}
                  </span>
                  <span className="text-xs text-slate-500">条开卡</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {metrics.qc.over48Count > 0 ? (
                    <button
                      onClick={() =>
                        setDetailModal({
                          title: "QC头条处理超过48小时未关卡明细",
                          items: metrics.qc!.over48Details,
                        })
                      }
                      className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100 flex items-center gap-1 font-medium transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      超48h: {metrics.qc.over48Count} 条
                    </button>
                  ) : (
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      无超48h未处理
                    </span>
                  )}
                  <span className="text-slate-500">
                    超24h: {metrics.qc.over24Count} 条
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  超期已督促责任人关卡闭环
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> 拖入 QC 头条文件后自动分析
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. 新随拍指标卡 */}
        <Card className="border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold text-slate-800">新随拍</CardTitle>
            </div>
            {metrics.punch && renderWowBadge(metrics.punch.wowRate)}
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {metrics.punch ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">
                    {metrics.punch.totalPunches}
                  </span>
                  <span className="text-xs text-slate-500">人次打卡</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="text-[11px] text-slate-400">主要打卡部门分布:</div>
                  <div className="flex flex-wrap gap-1">
                    {metrics.punch.topDepts.slice(0, 4).map((d) => (
                      <span
                        key={d.department}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-900 border border-emerald-200 font-medium"
                      >
                        {d.shortName} {d.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> 拖入打卡记录文件后自动分析
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. OKR & 精益指标卡 */}
        <Card className="border-indigo-200 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-sm font-bold text-slate-800">OKR 与精益</CardTitle>
            </div>
            {metrics.okr && renderWowBadge(metrics.okr.wowRate)}
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {metrics.okr || metrics.lean ? (
              <div className="space-y-2">
                {metrics.okr && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-500">OKR 开卡:</span>
                    <span className="text-xl font-bold text-indigo-700">
                      {metrics.okr.totalCards}
                    </span>
                    <span className="text-xs text-slate-500">条</span>
                  </div>
                )}
                {metrics.lean && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-500">精益开卡:</span>
                    <span className="text-xl font-bold text-amber-700">
                      {metrics.lean.totalCards}
                    </span>
                    <span className="text-xs text-slate-500">条</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> 拖入 OKR / 精益文件后自动分析
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 超期明细弹窗 */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              {detailModal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {detailModal?.items && detailModal.items.length > 0 ? (
              detailModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center font-medium text-slate-800">
                    <span>
                      {item.id ? `【${item.id}】` : ""} {item.title || "未命名事项"}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      {item.duration} 小时
                    </Badge>
                  </div>
                  <div className="text-slate-500 flex gap-3 text-[11px]">
                    {item.workshop && <span>车间: {item.workshop}</span>}
                    {item.owner && <span>责任人: {item.owner}</span>}
                    {item.handler && <span>负责人: {item.handler}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                暂无超期明细记录
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
