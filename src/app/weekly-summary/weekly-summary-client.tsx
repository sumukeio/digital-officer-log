"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DateRangeInfo,
  LastWeekBaseline,
  RecognizedFile,
  AllWeeklyMetrics,
  ManualSections,
} from "@/lib/weekly-report/types";
import {
  calculateProductionMetrics,
  calculateQCMetrics,
  calculateOKRMetrics,
  calculatePunchMetrics,
  calculateLeanMetrics,
} from "@/lib/weekly-report/metrics-calculator";
import {
  generatePlainTextWeeklyReport,
  generateWeComMarkdownWeeklyReport,
  DEFAULT_MANUAL_SECTIONS,
} from "@/lib/weekly-report/report-generator";
import { PeriodSelector } from "@/components/weekly-report/PeriodSelector";
import { FileDropzone } from "@/components/weekly-report/FileDropzone";
import { MetricsOverview } from "@/components/weekly-report/MetricsOverview";
import { WeeklyCharts } from "@/components/weekly-report/WeeklyCharts";
import { ManualForm } from "@/components/weekly-report/ManualForm";
import { ReportPreviewModal } from "@/components/weekly-report/ReportPreviewModal";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  History,
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveWeeklyReport,
  getLastWeekMetrics,
  getWeeklyReportByPeriod,
} from "@/app/actions/weekly-report";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WeeklySummaryClientProps {
  currentUser: {
    id: string;
    name: string | null;
    workId: string;
  };
  initialDateRange: DateRangeInfo;
  initialBaseline: LastWeekBaseline | null;
  initialWebhookUrl: string;
  initialHistoryReports: any[];
}

export default function WeeklySummaryClient({
  currentUser,
  initialDateRange,
  initialBaseline,
  initialWebhookUrl,
  initialHistoryReports,
}: WeeklySummaryClientProps) {
  const router = useRouter();

  // 1. 周期状态
  const [dateRange, setDateRange] = useState<DateRangeInfo>(initialDateRange);
  const [baseline, setBaseline] = useState<LastWeekBaseline | null>(initialBaseline);

  // 2. 文件与解析数据状态
  const [files, setFiles] = useState<RecognizedFile[]>([]);
  const [savedMetrics, setSavedMetrics] = useState<AllWeeklyMetrics>({});
  const [manualSections, setManualSections] = useState<ManualSections>(DEFAULT_MANUAL_SECTIONS);
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    production: true,
    qc: true,
    punch: true,
    okr: true,
    inspection: true,
    maintenance: true,
    binying: true,
    taskGrid: true,
    training: true,
    rewards: true,
    bulletin: true,
    inspectionGeneral: true,
    dudu: true,
    lean: false,
    improvements: true,
  });

  // 3. 弹窗与交互状态
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>(initialHistoryReports);

  // 切换周期时：1. 自动清空临时上传文件列表；2. 拉取基准；3. 智能回显已保存周报或重置看板
  useEffect(() => {
    let ignore = false;
    
    // 每次切换周期时，清空当前临时解析的文件列表，避免跨周数据混淆
    setFiles([]);

    const syncPeriodData = async () => {
      try {
        // 1. 获取对应上周环比基准
        const fetchedBaseline = await getLastWeekMetrics(dateRange.year, dateRange.weekNumber);
        if (!ignore) {
          setBaseline(fetchedBaseline);
        }

        // 2. 检查当前切换到的这一周，是否在数据库中已有保存记录
        const savedReport = await getWeeklyReportByPeriod(dateRange.year, dateRange.weekNumber);
        if (!ignore) {
          if (savedReport) {
            // 该周此前已保存过：自动回显指标快照与手写内容
            try {
              if (savedReport.metrics) {
                setSavedMetrics(JSON.parse(savedReport.metrics));
              }
              if (savedReport.manualSections) {
                setManualSections(JSON.parse(savedReport.manualSections));
              }
              if (savedReport.activeModules) {
                setActiveModules(JSON.parse(savedReport.activeModules));
              }
            } catch (parseErr) {
              console.error("解析历史周报数据失败:", parseErr);
            }
          } else {
            // 该周为全新的周期（未保存过）：彻底复位为空白待导入状态
            setSavedMetrics({});
            setManualSections(DEFAULT_MANUAL_SECTIONS);
          }
        }
      } catch (err) {
        console.error("同步周期数据失败:", err);
      }
    };

    syncPeriodData();
    return () => {
      ignore = true;
    };
  }, [dateRange.year, dateRange.weekNumber]);

  // 添加文件
  const handleAddFiles = (newFiles: RecognizedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // 移除文件
  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
    toast.info("已移除该文件");
  };

  // 4. 自动化指标聚合计算
  const metrics: AllWeeklyMetrics = useMemo(() => {
    // 若当前导入了新文件，以新解析的文件计算为准
    if (files.length > 0) {
      const result: AllWeeklyMetrics = {};

      for (const file of files) {
        if (file.moduleType === "production" && activeModules.production !== false) {
          result.production = calculateProductionMetrics(
            file.rows,
            baseline?.productionTotal
          );
        } else if (file.moduleType === "qc" && activeModules.qc !== false) {
          result.qc = calculateQCMetrics(file.rows, baseline?.qcTotal);
        } else if (file.moduleType === "okr" && activeModules.okr !== false) {
          result.okr = calculateOKRMetrics(file.rows, baseline?.okrTotal);
        } else if (file.moduleType === "punch" && activeModules.punch !== false) {
          result.punch = calculatePunchMetrics(file.rows, baseline?.punchTotal);
        } else if (file.moduleType === "lean" && activeModules.lean !== false) {
          result.lean = calculateLeanMetrics(file.rows, baseline?.leanTotal);
        }
      }

      return result;
    }

    // 若未上传新文件，展示已保存的历史指标（若为全新周则为 {} 空状态）
    return savedMetrics;
  }, [files, savedMetrics, baseline, activeModules]);

  // 5. 生成的最终周报文本
  const plainTextReport = useMemo(() => {
    return generatePlainTextWeeklyReport({
      dateRange,
      metrics,
      manualSections,
    });
  }, [dateRange, metrics, manualSections]);

  const markdownReport = useMemo(() => {
    return generateWeComMarkdownWeeklyReport({
      dateRange,
      metrics,
      manualSections,
    });
  }, [dateRange, metrics, manualSections]);

  // 保存周报到数据库
  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const res = await saveWeeklyReport({
        title: `${dateRange.titleFormatted}海铭德系统使用周报`,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        year: dateRange.year,
        weekNumber: dateRange.weekNumber,
        metrics,
        manualSections,
        activeModules: Object.keys(activeModules).filter((k) => activeModules[k] !== false),
        content: plainTextReport,
        markdownContent: markdownReport,
      });

      if (res.success) {
        toast.success("周报已成功保存入库！下周将自动作为环比基准使用");
        if (res.report) {
          setHistoryList((prev) => [
            res.report,
            ...prev.filter((r) => r.id !== res.report.id),
          ]);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(`保存异常: ${err.message || "未知错误"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModule = (moduleKey: string, enabled: boolean) => {
    setActiveModules((prev) => ({
      ...prev,
      [moduleKey]: enabled,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> 工作台
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h1 className="font-bold text-base text-slate-800">
                海铭德系统使用周报自动总结
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <History className="w-3.5 h-3.5 mr-1 text-slate-500" /> 历史周报 ({historyList.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveReport}
              disabled={isSaving}
              className="text-xs border-slate-300 text-slate-700"
            >
              <Save className="w-3.5 h-3.5 mr-1 text-slate-500" /> 保存记录
            </Button>

            <Button
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              预览周报内容
            </Button>
          </div>
        </div>
      </header>

      {/* 主工作台主体 */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 flex-1 w-full">
        {/* 1. 周期选择与基准栏 */}
        <PeriodSelector
          dateRange={dateRange}
          onChangeDateRange={setDateRange}
          baseline={baseline}
          onUpdateBaseline={(newBaseline) => {
            setBaseline(newBaseline);
            toast.success("已手动更新上周环比基准指标");
          }}
        />

        {/* 2. Excel 文件拖拽导入区 */}
        <FileDropzone
          files={files}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemoveFile}
        />

        {/* 3. 实时指标透视看板 */}
        <MetricsOverview metrics={metrics} />

        {/* 4. 可视化图表看板 */}
        <WeeklyCharts metrics={metrics} />

        {/* 5. 手动填报与模块配置表单 */}
        <ManualForm
          manualSections={manualSections}
          onChangeManualSections={setManualSections}
          activeModules={activeModules}
          onToggleModule={handleToggleModule}
        />

        {/* 底部汇总状态栏 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              已解析 <strong className="text-blue-600 font-bold">{files.length}</strong> 个表格，
              当前所属周期：<strong className="text-slate-800 font-semibold">{dateRange.titleFormatted}周报</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-300" /> 预览周报内容
            </Button>
          </div>
        </div>
      </main>

      {/* 周报预览与推送弹窗 */}
      <ReportPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        plainText={plainTextReport}
        markdownText={markdownReport}
        webhookUrl={webhookUrl}
        onUpdateWebhookUrl={setWebhookUrl}
        onSaveReport={handleSaveReport}
        isSaving={isSaving}
      />

      {/* 历史周报列表抽屉/弹窗 */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" /> 历史归档周报清单
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {historyList.length > 0 ? (
              historyList.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white transition-colors text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{rep.title}</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(rep.createdAt).toLocaleDateString()} 保存
                    </span>
                  </div>
                  <div className="text-slate-600 whitespace-pre-wrap line-clamp-3 bg-white p-2.5 rounded border border-slate-100 font-mono text-[11px]">
                    {rep.content}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>录入人: {rep.user?.name || rep.user?.workId || "数字官"}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(rep.content);
                        toast.success("已复制该历史周报内容！");
                      }}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      复制历史周报
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                暂无已归档的历史周报
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
