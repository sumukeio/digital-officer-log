"use client";

import React from "react";
import { AllWeeklyMetrics } from "@/lib/weekly-report/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { BarChart3, PieChart as PieIcon, LineChart as ChartPlaceholderIcon } from "lucide-react";

interface WeeklyChartsProps {
  metrics: AllWeeklyMetrics;
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6", "#94a3b8"];

export function WeeklyCharts({ metrics }: WeeklyChartsProps) {
  const prodStats = metrics.production?.workshopStats.filter(w => w.count > 0) || [];
  const punchStats = metrics.punch?.deptStats.slice(0, 8) || [];

  // 如果暂未导入对应表格，显示可视化图表引导占位卡片
  if (prodStats.length === 0 && punchStats.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm border-dashed bg-slate-50/50">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-700">
            📊 数据可视化图表看板就绪
          </div>
          <p className="text-[11px] text-slate-400 max-w-md">
            拖入「生产头条」与「新随拍」Excel 文件后，系统将在此自动生成车间开卡占比饼图与各部门打卡柱状图。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* 生产头条车间分布饼图 */}
      {prodStats.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-bold text-slate-800">生产头条车间开卡占比</CardTitle>
            </div>
            <span className="text-xs text-slate-400">总计 {metrics.production?.totalCards} 条</span>
          </CardHeader>
          <CardContent className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prodStats}
                  dataKey="count"
                  nameKey="shortName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ name, percent }: any) =>
                    `${name || ""} ${(((percent as number) || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {prodStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} 条 (${item.payload.percentage}%)`,
                    item.payload.workshop,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 新随拍各部门打卡柱状图 */}
      {punchStats.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold text-slate-800">新随拍各部门打卡人次</CardTitle>
            </div>
            <span className="text-xs text-slate-400">总计 {metrics.punch?.totalPunches} 人次</span>
          </CardHeader>
          <CardContent className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={punchStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortName"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval={0}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} 人次 (${item.payload.percentage}%)`,
                    item.payload.department,
                  ]}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
