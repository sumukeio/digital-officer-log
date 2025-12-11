"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, PlusCircle, KeyRound, Loader2, Bot } from "lucide-react";
import { logout, changePassword } from "@/app/actions/auth";
import { generateWeeklySummary } from "@/app/actions/ai";
import { toast } from "sonner";

interface DashboardClientProps {
  submittedDates: Date[];
  forceChangePassword: boolean;
}

export default function DashboardClient({ submittedDates, forceChangePassword }: DashboardClientProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // AI 总结相关状态
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // 日历点击逻辑
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (!newDate) return;

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 检查是否在已提交列表中 (简单对比年月日)
    const isSubmitted = submittedDates.some(d => 
      d.getDate() === newDate.getDate() && 
      d.getMonth() === newDate.getMonth() && 
      d.getFullYear() === newDate.getFullYear()
    );

    if (isSubmitted) {
      router.push(`/report/${dateStr}`);
    } else {
      // 只有点击“今天”才允许新建 (或者你可以放宽这个限制)
      const todayStr = new Date().toISOString().split('T')[0];
      // 简单的本地时区修正检查，或者直接允许点击
      // 这里简单处理：只要没提交，就尝试去新建页，让新建页自己判断或单纯允许补填
      router.push("/report/new");
    }
  };

  // 生成 AI 周报逻辑
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setSummaryOpen(true); // 先打开弹窗
    setSummaryContent(""); // 清空旧内容
    
    try {
      const text = await generateWeeklySummary();
      setSummaryContent(text);
    } catch (e) {
      setSummaryContent("生成失败，请稍后重试。");
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
           {/* 修改密码弹窗 */}
           <ChangePasswordDialog />
           
           <form action={logout}>
             <Button variant="ghost" size="sm" type="submit" className="text-slate-500 hover:text-red-600">
               <LogOut className="w-4 h-4 mr-1" /> 退出
             </Button>
           </form>
        </div>
      </nav>

      <main className="container mx-auto p-4 max-w-4xl space-y-6">
        {/* 顶部概览卡片 */}
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* 左侧：提交日历 */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-500">提交日历</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-0 pb-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md border-0"
                modifiers={{
                  submitted: submittedDates // 绿色标记
                }}
                modifiersStyles={{
                  submitted: { 
                    color: 'white', 
                    backgroundColor: '#10b981', 
                    fontWeight: 'bold',
                    borderRadius: '100%'
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* 右侧：数据洞察 & AI */}
          <Card className="bg-slate-900 text-white border-0 shadow-xl flex flex-col justify-between">
            <div>
                <CardHeader>
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <CardTitle>智能洞察</CardTitle>
                </div>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <span className="text-slate-400">平均UPH (本周)</span>
                    <span className="text-3xl font-bold font-mono">--</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <span className="text-slate-400">异常关卡率</span>
                    <span className="text-2xl font-bold text-green-400">0%</span>
                </div>
                </CardContent>
            </div>
            
            <div className="p-6 pt-0">
                <Button 
                    variant="secondary" 
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 border-0 h-12"
                    onClick={handleGenerateSummary}
                    disabled={aiLoading}
                >
                  {aiLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> DeepSeek 思考中...</>
                  ) : (
                    "生成本周总结 (DeepSeek)"
                  )}
                </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* AI 总结弹窗 */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    AI 周报总结
                </DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-lg border text-sm md:text-base">
                {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>正在分析您的历史日报数据...</p>
                    </div>
                ) : (
                    summaryContent || "未生成内容"
                )}
            </div>
        </DialogContent>
      </Dialog>

      {/* 强制改密弹窗 (条件渲染) */}
      <ForceChangePasswordDialog open={forceChangePassword} />
    </div>
  );
}

// === 组件：主动修改密码 ===
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
                        <Label>新密码 (至少6位)</Label>
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

// === 组件：强制修改密码 (不可关闭) ===
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
            {/* 拦截所有关闭事件 */}
            <DialogContent 
                className="[&>button]:hidden pointer-events-auto" 
                onInteractOutside={(e) => e.preventDefault()} 
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <KeyRound className="w-5 h-5" />
                        安全警告：请修改初始密码
                    </DialogTitle>
                </DialogHeader>
                <div className="text-sm text-slate-500 mb-4 bg-red-50 p-3 rounded border border-red-100">
                    为了保障工厂数据安全，首次登录必须将初始密码 (123456) 修改为您的个人密码。
                    <br/>修改成功后方可使用系统。
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