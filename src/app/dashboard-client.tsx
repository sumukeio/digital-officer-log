"use client";

// ▼▼▼ 核心修复：添加 useEffect 和 useActionState 的引用 ▼▼▼
import { useState, useActionState, useEffect } from "react";
// ▲▲▲ 核心修复 ▲▲▲

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, PlusCircle, KeyRound, Loader2, Bot, Settings, BarChart3 } from "lucide-react";
import { logout, changePassword } from "@/app/actions/auth";
import { generateWeeklySummary } from "@/app/actions/ai";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardClientProps {
  submittedDates: Date[];
  forceChangePassword: boolean;
  isAdmin: boolean;
  chartData: any[];
}

export default function DashboardClient({ submittedDates, forceChangePassword, isAdmin, chartData }: DashboardClientProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // AI 状态
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // 日历点击
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (!newDate) return;

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 检查是否已提交
    const isSubmitted = submittedDates.some(d => 
      d.getDate() === newDate.getDate() && 
      d.getMonth() === newDate.getMonth() && 
      d.getFullYear() === newDate.getFullYear()
    );

    if (isSubmitted) {
      router.push(`/report/${dateStr}`);
    } else {
      router.push("/report/new");
    }
  };

  // 生成 AI 周报
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setSummaryOpen(true);
    setSummaryContent("");
    try {
      const text = await generateWeeklySummary();
      setSummaryContent(text);
    } catch (e) {
      setSummaryContent("生成失败，请重试。");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-sm font-mono">DO</span>
          数字官工作台
        </div>
        <div className="flex items-center gap-2">
           {/* 管理员入口 */}
           {isAdmin && (
             <Button variant="outline" size="sm" onClick={() => router.push('/admin/template')} className="border-blue-200 text-blue-700 bg-blue-50">
               <Settings className="w-4 h-4 mr-1" /> 后台管理
             </Button>
           )}

           <ChangePasswordDialog />
           
           <form action={logout}>
             <Button variant="ghost" size="sm" type="submit" className="text-slate-500 hover:text-red-600">
               <LogOut className="w-4 h-4 mr-1" /> 退出
             </Button>
           </form>
        </div>
      </nav>

      <main className="container mx-auto p-4 max-w-7xl space-y-6">
        {/* 概览条 */}
        <section className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">工作概览</h1>
            <p className="text-slate-500 mt-1">
               本月已提交 <span className="text-blue-600 font-bold text-lg">{submittedDates.length}</span> 篇日报
            </p>
          </div>
          <Button onClick={() => router.push("/report/new")} className="h-12 px-6 text-base shadow-lg shadow-blue-200">
            <PlusCircle className="w-5 h-5 mr-2" />
            新建今日日报
          </Button>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：日历 (1列) */}
          <Card className="border-0 shadow-sm h-full min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-base text-slate-500">提交日历</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-0 pb-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border-0"
                modifiers={{ submitted: submittedDates }}
                modifiersStyles={{ submitted: { color: 'white', backgroundColor: '#10b981', fontWeight: 'bold', borderRadius: '100%' } }}
              />
            </CardContent>
          </Card>

          {/* 右侧：数据看板 (2列) */}
          <Card className="lg:col-span-2 border-0 shadow-sm flex flex-col min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600"/>
                <CardTitle className="text-base font-bold text-slate-700">关键指标趋势 (近30天)</CardTitle>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0"
                onClick={handleGenerateSummary}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Bot className="w-3 h-3 mr-1"/>}
                AI 周总结
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                  <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  {/* 多条折线 */}
                  <Line type="monotone" dataKey="prod" name="生产头条" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{r:6}} />
                  <Line type="monotone" dataKey="qc" name="QC头条" stroke="#dc2626" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="okr" name="OKR" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lean" name="精益" stroke="#d97706" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ipqc" name="IPQC" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 弹窗组件区域 */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" /> AI 周报总结
                </DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-lg border text-sm md:text-base">
                {aiLoading ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-slate-400"/></div> : summaryContent}
            </div>
        </DialogContent>
      </Dialog>
      <ForceChangePasswordDialog open={forceChangePassword} />
    </div>
  );
}

// === 修改密码组件 ===
function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState(changePassword, null);

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message);
            setOpen(false);
        } else if (state?.success === false) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-600">
                    <KeyRound className="w-4 h-4 mr-1"/>改密
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>修改密码</DialogTitle></DialogHeader>
                <form action={action} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>旧密码</Label>
                        <Input name="oldPassword" type="password" required />
                    </div>
                    <div className="space-y-2">
                        <Label>新密码</Label>
                        <Input name="newPassword" type="password" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "确认修改"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// === 强制改密组件 ===
function ForceChangePasswordDialog({ open }: { open: boolean }) {
    const [state, action, isPending] = useActionState(changePassword, null);

    useEffect(() => {
        if (state?.success) {
            toast.success("密码修改成功，系统将自动刷新");
            setTimeout(() => window.location.reload(), 1500);
        } else if (state?.success === false) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <Dialog open={open}>
            <DialogContent 
                className="[&>button]:hidden pointer-events-auto" 
                onInteractOutside={(e) => e.preventDefault()} 
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <KeyRound className="w-5 h-5" /> 安全警告：请修改初始密码
                    </DialogTitle>
                </DialogHeader>
                <div className="text-sm text-slate-500 mb-4 bg-red-50 p-3 rounded border border-red-100">
                    为了保障工厂数据安全，首次登录必须将初始密码 (123456) 修改为您的个人密码。
                </div>
                <form action={action} className="space-y-4">
                    <div className="space-y-2">
                        <Label>当前密码 (初始)</Label>
                        <Input name="oldPassword" type="password" defaultValue="123456" readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <Label>新密码 (至少6位)</Label>
                        <Input name="newPassword" type="password" placeholder="请输入新密码" required autoFocus />
                    </div>
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isPending}>
                        {isPending ? "修改中..." : "确认修改并进入系统"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}