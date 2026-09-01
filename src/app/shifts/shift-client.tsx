'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShiftWorker,
  ShiftGlobalConfig,
  ShiftCheckResult,
} from '@/lib/shifts/types';
import {
  addShiftWorker,
  updateShiftWorker,
  deleteShiftWorker,
  saveShiftConfig,
  triggerShiftNotification,
  getShiftData,
} from '@/app/actions/shifts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Settings,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Sun,
  Moon,
  Copy,
  Users,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ShiftClientProps {
  currentUser: {
    id: string;
    name: string | null;
    workId: string;
  };
  initialConfig: ShiftGlobalConfig;
  initialWorkers: ShiftWorker[];
  initialScheduleResult: ShiftCheckResult;
}

export default function ShiftClient({
  initialConfig,
  initialWorkers,
  initialScheduleResult,
}: ShiftClientProps) {
  const router = useRouter();

  const [config, setConfig] = useState<ShiftGlobalConfig>(initialConfig);
  const [workers, setWorkers] = useState<ShiftWorker[]>(initialWorkers);
  const [scheduleResult, setScheduleResult] = useState<ShiftCheckResult>(initialScheduleResult);
  const [loading, setLoading] = useState(false);

  // 弹窗状态
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [workerForm, setWorkerForm] = useState<{
    name: string;
    department: string;
    shiftDate: string;
    targetShift: string;
    cycleDays: number;
  }>({
    name: '',
    department: '',
    shiftDate: '',
    targetShift: '白班',
    cycleDays: 14,
  });

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [webhookInput, setWebhookInput] = useState(config.webhookUrl);
  const [cycleInput, setCycleInput] = useState(config.defaultCycle);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // 刷新最新排班数据
  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await getShiftData();
      setConfig(res.config);
      setWorkers(res.workers);
      setScheduleResult(res.scheduleResult);
    } catch (err: any) {
      toast.error('加载排班数据失败: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // 打开添加员工弹窗
  const handleOpenAddWorker = () => {
    setEditingIndex(null);
    setWorkerForm({
      name: '',
      department: '',
      shiftDate: scheduleResult.tomorrowStr || new Date().toISOString().split('T')[0],
      targetShift: '白班',
      cycleDays: config.defaultCycle || 14,
    });
    setWorkerModalOpen(true);
  };

  // 打开编辑员工弹窗
  const handleOpenEditWorker = (index: number, worker: ShiftWorker) => {
    setEditingIndex(index);
    setWorkerForm({
      name: worker.name,
      department: worker.department || '',
      shiftDate: worker.shiftDate,
      targetShift: worker.targetShift || '白班',
      cycleDays: worker.cycleDays || 14,
    });
    setWorkerModalOpen(true);
  };

  // 保存员工
  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name.trim()) {
      toast.error('请输入员工姓名');
      return;
    }
    if (!workerForm.shiftDate.trim()) {
      toast.error('请选择下次转班日期');
      return;
    }

    setLoading(true);
    try {
      if (editingIndex === null) {
        const res = await addShiftWorker(workerForm);
        if (res.success) {
          toast.success(res.message);
          setWorkerModalOpen(false);
          await refreshData();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await updateShiftWorker(editingIndex, workerForm);
        if (res.success) {
          toast.success(res.message);
          setWorkerModalOpen(false);
          await refreshData();
        } else {
          toast.error(res.message);
        }
      }
    } catch (err: any) {
      toast.error('保存失败: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // 删除员工
  const handleDeleteWorker = async (index: number, name: string) => {
    if (!confirm(`确定要删除员工【${name}】的排班记录吗？`)) return;

    setLoading(true);
    try {
      const res = await deleteShiftWorker(index);
      if (res.success) {
        toast.success(res.message);
        await refreshData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error('删除失败: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // 保存全局配置
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await saveShiftConfig({
        webhookUrl: webhookInput.trim(),
        defaultCycle: Number(cycleInput) || 14,
      });
      if (res.success) {
        toast.success(res.message);
        setConfigModalOpen(false);
        await refreshData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error('保存配置失败: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // 发送测试通知
  const handleSendTestNotify = async () => {
    setLoading(true);
    try {
      const res = await triggerShiftNotification({ isTest: true });
      if (res.success) {
        toast.success('🎉 测试排班通知已发送至企业微信群！');
      } else {
        toast.error('发送失败: ' + res.message);
      }
    } catch (err: any) {
      toast.error('推送异常: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // 强制全员播报
  const handleForceBroadcast = async () => {
    if (!confirm('是否立即向企业微信群发送当天的全员排班核对卡片？')) return;

    setLoading(true);
    try {
      const res = await triggerShiftNotification({ force: true });
      if (res.success) {
        toast.success('📢 全员排班通知已成功推送到企业微信群！');
        await refreshData();
      } else {
        toast.error('播报失败: ' + res.message);
      }
    } catch (err: any) {
      toast.error('播报异常: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  // 复制 Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(scheduleResult.markdownMessage);
    toast.success('已复制企业微信 Markdown 内容至剪贴板');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* 顶部导航 */}
      <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 工作台
          </Button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">转班提醒小助手</h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                每日 08:00 自动推算轮转 · 明日转班预警 · 企微群通知
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={loading}
            className="text-slate-600 border-slate-200"
            title="刷新数据"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-blue-600" /> 消息卡片预览
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setWebhookInput(config.webhookUrl);
              setCycleInput(config.defaultCycle);
              setConfigModalOpen(true);
            }}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Settings className="w-4 h-4 mr-1" /> 配置
          </Button>
          <Button
            onClick={handleOpenAddWorker}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> 添加排班
          </Button>
        </div>
      </nav>

      {/* 主工作区 */}
      <main className="container mx-auto p-4 max-w-6xl space-y-5 flex-1">
        {/* 顶部指标统计栏 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">今日日期</p>
                <p className="text-sm sm:text-base font-bold text-slate-700">{scheduleResult.todayStr}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">明日转班人员</p>
                <p className="text-base sm:text-lg font-bold text-amber-600">
                  {scheduleResult.tomorrowAlerts.length} <span className="text-xs font-normal text-slate-400">人</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">在册监控员工</p>
                <p className="text-base sm:text-lg font-bold text-slate-700">
                  {workers.length} <span className="text-xs font-normal text-slate-400">人</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400">企微定时推送</p>
                <p className="text-xs sm:text-sm font-semibold text-purple-700 truncate">
                  每天 08:00 (已就绪)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 明日转班焦点卡片 */}
        {scheduleResult.tomorrowAlerts.length > 0 ? (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-base">🚨 明天（{scheduleResult.tomorrowStr}）转班人员预警</h3>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                共 {scheduleResult.tomorrowAlerts.length} 人需要调班
              </span>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {scheduleResult.tomorrowAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-base">{alert.name}</p>
                    <p className="text-xs text-white/80">下次转班: {alert.nextDate}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white text-slate-800 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                    {alert.targetShift.includes('夜') ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-indigo-600">{alert.targetShift}</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-amber-600">{alert.targetShift}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-white/90 flex items-center gap-1">
              ⚠️ 请提醒以上同事注意调整作息与交接班考勤。
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 border border-emerald-100 flex items-center justify-between text-emerald-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-bold text-sm text-slate-800">明日全员班次保持不变</p>
                <p className="text-xs text-slate-400">所有同事无需转班，正常按现有班次出勤即可。</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceBroadcast}
              disabled={loading}
              className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> 全员排班播报
            </Button>
          </div>
        )}

        {/* 全员排班列表看板 */}
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base font-bold text-slate-800">全员近期排班状态看板</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestNotify}
                disabled={loading}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Send className="w-3.5 h-3.5 mr-1 text-purple-600" /> 测试企微推送
              </Button>
              <Button
                size="sm"
                onClick={handleOpenAddWorker}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> 新增员工
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {scheduleResult.allStatuses.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>暂无排班员工数据，请点击上方「新增员工」</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-500 text-xs border-b">
                    <tr>
                      <th className="py-3 px-4 font-medium">序号</th>
                      <th className="py-3 px-4 font-medium">员工姓名</th>
                      <th className="py-3 px-4 font-medium">所属部门/组</th>
                      <th className="py-3 px-4 font-medium">目标班次</th>
                      <th className="py-3 px-4 font-medium">下次转班日期</th>
                      <th className="py-3 px-4 font-medium">周期</th>
                      <th className="py-3 px-4 font-medium">状态倒计时</th>
                      <th className="py-3 px-4 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduleResult.allStatuses.map((item, idx) => {
                      const isNight = item.worker.targetShift.includes('夜') || item.worker.targetShift.includes('晚');
                      const originalIndex = workers.findIndex((w) => w.name === item.worker.name);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{item.worker.name}</td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">{item.worker.department || '—'}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isNight
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isNight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                              {item.worker.targetShift}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-mono text-xs">
                            {item.shiftDateStr}{' '}
                            <span className="text-slate-400">({item.weekdayStr})</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-xs">{item.worker.cycleDays || 14}天</td>
                          <td className="py-3.5 px-4">
                            {item.statusTag === 'today' && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold animate-pulse">
                                今日转班
                              </span>
                            )}
                            {item.statusTag === 'tomorrow' && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                                明天转班
                              </span>
                            )}
                            {item.statusTag === 'upcoming' && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {item.diffDays} 天后
                              </span>
                            )}
                            {item.statusTag === 'past' && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">已生效</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditWorker(originalIndex, item.worker)}
                                className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                title="编辑排班"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteWorker(originalIndex, item.worker.name)}
                                className="h-7 w-7 text-slate-400 hover:text-rose-600"
                                title="删除排班"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 员工添加/编辑弹窗 */}
      <Dialog open={workerModalOpen} onOpenChange={setWorkerModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? '添加排班员工' : '编辑员工排班'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveWorker} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">员工姓名 *</Label>
              <Input
                placeholder="例如: 张三"
                value={workerForm.name}
                onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">所属部门 / 组别 (可选)</Label>
              <Input
                placeholder="例如: 生产一部 / A班组"
                value={workerForm.department}
                onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">下次转班基准日期 *</Label>
              <Input
                type="date"
                value={workerForm.shiftDate}
                onChange={(e) => setWorkerForm({ ...workerForm, shiftDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">目标班次 (转班后进入的班次)</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkerForm({ ...workerForm, targetShift: '白班' })}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    workerForm.targetShift === '白班'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" /> 白班
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerForm({ ...workerForm, targetShift: '夜班' })}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                    workerForm.targetShift === '夜班'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-500" /> 夜班
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">轮转周期 (天)</Label>
              <div className="flex gap-2">
                {[7, 14, 28].map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={workerForm.cycleDays === c ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWorkerForm({ ...workerForm, cycleDays: c })}
                    className="flex-1 text-xs"
                  >
                    {c} 天
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setWorkerModalOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                保存排班
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 配置弹窗 */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>企业微信 Webhook 与排班配置</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConfig} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">企业微信群机器人 Webhook 地址</Label>
              <Input
                placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                支持在群内添加自定义机器人，将生成的 Webhook 复制粘贴到此处。
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">默认排班轮转周期 (天)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={cycleInput}
                onChange={(e) => setCycleInput(Number(e.target.value))}
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">⏰ 系统内置定时机制说明：</p>
              <p>• 每天早晨 08:00 会自动触发巡检并推送到本企业微信群。</p>
              <p>• 若明日有同事需要转班，会自动发送强预警 Markdown 卡片。</p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setConfigModalOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                保存配置
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 消息卡片预览弹窗 */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-blue-600" /> 企业微信消息卡片实时预览
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs leading-relaxed select-text space-y-2 border border-slate-800">
            <ReactMarkdown>{scheduleResult.markdownMessage}</ReactMarkdown>
          </div>

          <DialogFooter className="pt-2 flex justify-between items-center sm:justify-between">
            <Button variant="outline" size="sm" onClick={handleCopyMarkdown} className="text-xs">
              <Copy className="w-3.5 h-3.5 mr-1" /> 复制 Markdown
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(false)} className="text-xs">
                关闭
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleSendTestNotify();
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> 一键发送到群
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
