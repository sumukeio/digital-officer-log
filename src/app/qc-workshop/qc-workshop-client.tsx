'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateRangeInfo } from '@/lib/weekly-report/types';
import { QcPeriodBar } from '@/components/qc-workshop/QcPeriodBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  aggregateQcByWorkshop,
  buildMachineMapIndexFromBuffer,
  buildQcWorkshopPrompt,
  buildQcWorkshopTxt,
  buildQcWorkshopXlsx,
  listStandardWorkshopsWithData,
  listWorkshopsForXlsxSheets,
  MachineMapIndex,
  parseMachineMapRows,
  QcRawRow,
  UNMAPPED_WORKSHOP,
} from '@/lib/qc-workshop';
import {
  getMachineMapBufferFromStorage,
  loadMachineMapFromStorage,
  loadQcRowsForPeriod,
  saveMachineMapToStorage,
  saveQcRowsForPeriod,
  StoredMachineMap,
  StoredQcRows,
} from '@/lib/qc-workshop/browser-storage';
import { buildWeekPeriod, QcPeriodState } from '@/lib/qc-workshop/period';
import { parseQcExcelUpload } from '@/lib/qc-workshop/parse-qc-upload';
import { downloadArrayBuffer, downloadText } from '@/lib/qc-workshop/download-helper';
import {
  ArrowLeft,
  ClipboardCopy,
  Download,
  Factory,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface QcWorkshopClientProps {
  currentUser: { id: string; name: string | null; workId: string };
  initialDateRange: DateRangeInfo;
}

export default function QcWorkshopClient({
  currentUser,
  initialDateRange,
}: QcWorkshopClientProps) {
  const router = useRouter();
  const qcInputRef = useRef<HTMLInputElement>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);

  const [period, setPeriod] = useState<QcPeriodState>(() => buildWeekPeriod(initialDateRange));
  const [qcSource, setQcSource] = useState<StoredQcRows | null>(null);
  const [mapMeta, setMapMeta] = useState<StoredMachineMap | null>(null);
  const [mapIndex, setMapIndex] = useState<MachineMapIndex | null>(null);
  const [promptWorkshop, setPromptWorkshop] = useState<string>('');

  const reloadFromStorage = useCallback(() => {
    setQcSource(loadQcRowsForPeriod(period));
    const meta = loadMachineMapFromStorage();
    setMapMeta(meta);
    const buf = getMachineMapBufferFromStorage();
    setMapIndex(buf ? buildMachineMapIndexFromBuffer(buf) : null);
  }, [period]);

  useEffect(() => {
    reloadFromStorage();
  }, [reloadFromStorage]);

  const qcRows: QcRawRow[] = qcSource?.rows ?? [];

  const aggregate = useMemo(() => {
    if (!qcRows.length) return null;
    return aggregateQcByWorkshop(qcRows, mapIndex, { topN: 5 });
  }, [qcRows, mapIndex]);

  const exportMeta = useMemo(() => ({ periodLabel: period.periodLabel }), [period.periodLabel]);

  const fileStamp = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }, []);

  const promptWorkshopOptions = useMemo(() => {
    if (!aggregate) return [];
    const std = listStandardWorkshopsWithData(aggregate);
    const extra = listWorkshopsForXlsxSheets(aggregate).filter((w) => !w.isStandard);
    const opts = std.map((w) => w.workshop);
    extra.forEach((w) => {
      if (!opts.includes(w.workshop)) opts.push(w.workshop);
    });
    if (aggregate.unmapped?.count) opts.push(UNMAPPED_WORKSHOP);
    return opts;
  }, [aggregate]);

  useEffect(() => {
    if (!promptWorkshopOptions.length) return;
    setPromptWorkshop((prev) =>
      prev && promptWorkshopOptions.includes(prev) ? prev : promptWorkshopOptions[0]
    );
  }, [promptWorkshopOptions]);

  const handleQcUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const { rows, fileName } = parseQcExcelUpload(buffer, file.name, file.size);
      const saved = saveQcRowsForPeriod(period, rows, fileName);
      setQcSource(saved);
      toast.success(`已载入 QC 数据 ${rows.length} 条（整表 → ${period.periodLabel}）`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'QC 文件解析失败');
    }
  };

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseMachineMapRows(buffer);
      if (!rows.length) throw new Error('机台映射表为空');
      const saved = saveMachineMapToStorage(buffer, file.name, rows.length);
      setMapMeta(saved);
      setMapIndex(buildMachineMapIndexFromBuffer(buffer));
      toast.success(`机台映射表已导入 ${rows.length} 行`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '映射表解析失败');
    }
  };

  const requireReady = (): boolean => {
    if (!qcRows.length) {
      toast.error(
        period.mode === 'week'
          ? '请先载入本周期 QC 数据（周报页上传或本页上传）'
          : '请先上传本区间 QC Excel（整表即区间）'
      );
      return false;
    }
    if (!mapIndex) {
      toast.warning('未导入机台映射表，归属将大量落入「未归类」');
    }
    return true;
  };

  const handleDownloadXlsx = () => {
    if (!aggregate || !requireReady()) return;
    const { buffer } = buildQcWorkshopXlsx(aggregate, exportMeta);
    downloadArrayBuffer(buffer, `QC车间分析_${period.titleFormatted}_${fileStamp}.xlsx`);
    toast.success('分析 Excel 已开始下载');
  };

  const handleDownloadTxt = () => {
    if (!aggregate || !requireReady()) return;
    const txt = buildQcWorkshopTxt(aggregate, exportMeta);
    downloadText(txt, `QC车间统计_${period.titleFormatted}_${fileStamp}.txt`);
    toast.success('纯文本已开始下载');
  };

  const handleCopyPrompt = async (scope: 'plant' | 'workshop') => {
    if (!aggregate || !requireReady()) return;
    try {
      let text: string;
      if (scope === 'plant') {
        text = buildQcWorkshopPrompt(aggregate, exportMeta, { scope: 'plant' });
      } else {
        const ws = promptWorkshop;
        if (!ws) {
          toast.error('请先选择车间');
          return;
        }
        text = buildQcWorkshopPrompt(aggregate, exportMeta, {
          scope: 'workshop',
          workshop: ws,
        });
      }
      await navigator.clipboard.writeText(text);
      toast.success(scope === 'plant' ? '已复制全厂 Prompt' : '已复制分车间 Prompt');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '复制失败');
    }
  };

  const emptyHint =
    period.mode === 'week'
      ? '本周暂无 QC 数据。可在「周报生成」页拖入 QC Excel，或在本页上传。'
      : '本区间暂无 QC 数据。请上传整月/自定义区间的 QC Excel（整表当作本区间，不按开卡时间裁剪）。';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Factory className="w-5 h-5 text-violet-600" />
                QC 车间统计
              </h1>
              <p className="text-xs text-slate-500">
                {currentUser.name || currentUser.workId} · 归属 → 统计 → 导出 → 海铭德 AI
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!aggregate}
              onClick={handleDownloadXlsx}
            >
              <Download className="w-4 h-4 mr-1" /> 分析 Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!aggregate}
              onClick={handleDownloadTxt}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1" /> 纯文本
            </Button>
            <Button size="sm" disabled={!aggregate} onClick={() => handleCopyPrompt('plant')}>
              <ClipboardCopy className="w-4 h-4 mr-1" /> 复制全厂 Prompt
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 space-y-4">
        <QcPeriodBar period={period} onChange={setPeriod} />

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">QC 头条数据</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qcSource ? (
                <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{qcSource.fileName}</p>
                    <p className="text-emerald-600/90">
                      {qcSource.rowCount} 条 · {qcSource.periodLabel || period.periodLabel} ·
                      {qcSource.savedAt.slice(0, 10)} 缓存
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{emptyHint}</p>
                </div>
              )}
              <input
                ref={qcInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleQcUpload}
              />
              <Button variant="outline" className="w-full" onClick={() => qcInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> 上传 QC 头条 Excel
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">机台映射表</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mapMeta ? (
                <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{mapMeta.fileName}</p>
                    <p className="text-emerald-600/90">
                      {mapMeta.rowCount} 行 · {mapMeta.importedAt.slice(0, 10)} 导入
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>请导入「机台映射表.xlsx」。未导入时大部分设备将无法归属车间。</p>
                </div>
              )}
              <input
                ref={mapInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleMapUpload}
              />
              <Button variant="outline" className="w-full" onClick={() => mapInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> 导入机台映射表
              </Button>
            </CardContent>
          </Card>
        </div>

        {aggregate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                统计预览 · 全厂 {aggregate.totalCards} 条
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <StatBox label="已归属" value={aggregate.mappedCount} />
                <StatBox label="未归类" value={aggregate.unmappedCount} warn={aggregate.unmappedCount > 0} />
                <StatBox label="有数据车间" value={aggregate.workshops.length} />
                <StatBox label="标准七部有数据" value={listStandardWorkshopsWithData(aggregate).length} />
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left p-2">车间</th>
                      <th className="text-right p-2">条数</th>
                      <th className="text-right p-2">占比</th>
                      <th className="text-left p-2">TOP 问题</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregate.workshops.map((w) => (
                      <tr key={w.workshop} className="border-t">
                        <td className="p-2 font-medium">{w.workshop}</td>
                        <td className="p-2 text-right">{w.count}</td>
                        <td className="p-2 text-right">{w.percentage}%</td>
                        <td className="p-2 text-slate-600">
                          {w.topProblems[0]?.problem ?? '—'}
                        </td>
                      </tr>
                    ))}
                    {aggregate.unmapped && (
                      <tr className="border-t bg-amber-50/50">
                        <td className="p-2 font-medium text-amber-800">{UNMAPPED_WORKSHOP}</td>
                        <td className="p-2 text-right">{aggregate.unmapped.count}</td>
                        <td className="p-2 text-right">{aggregate.unmapped.percentage}%</td>
                        <td className="p-2 text-amber-700">
                          {aggregate.unmapped.topProblems[0]?.problem ?? '—'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
                <div className="min-w-[180px]">
                  <p className="text-xs text-slate-500 mb-1">分车间 Prompt</p>
                  <Select value={promptWorkshop} onValueChange={setPromptWorkshop}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择车间" />
                    </SelectTrigger>
                    <SelectContent>
                      {promptWorkshopOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="secondary"
                  disabled={!promptWorkshopOptions.length}
                  onClick={() => handleCopyPrompt('workshop')}
                >
                  <ClipboardCopy className="w-4 h-4 mr-1" /> 复制分车间 Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StatBox({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${warn ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${warn ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
