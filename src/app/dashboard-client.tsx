"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
// UI 组件
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// 图标库
import { 
    LogOut, PlusCircle, KeyRound, Loader2, Bot, 
    Settings2, BarChart3, User, MapPin, BadgeCheck, 
    UserCircle, LayoutTemplate, BookOpen, ExternalLink,
    ClipboardList 
} from "lucide-react";
// Server Actions
import { logout, changePassword } from "@/app/actions/auth";
import { generateWeeklySummary } from "@/app/actions/ai";
// 工具
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardClientProps {
  submittedDates: Date[];
  currentUser: {
    id: string;
    workId: string;
    name: string | null;
    isDefaultPassword: boolean;
    assignedAreas: string | null;
    roles: { name: string }[];
  };
  chartData: any[];
  quickLinks: { id: string; title: string; url: string }[];
}

export default function DashboardClient({ submittedDates, currentUser, chartData, quickLinks }: DashboardClientProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // 权限判断
  const isAdmin = currentUser.roles.some(r => r.name === 'admin');

  // AI 状态
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // 日历点击处理
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (!newDate) return;

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // 检查该日期是否已提交
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 顶部导航 */}
      <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
        <div className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-sm font-mono">DO</span>
          <span className="hidden sm:inline">数字官工作台</span>
          
          {/* ▼▼▼ 任务看板入口 (桌面端) ▼▼▼ */}
          <div className="ml-4 h-6 w-px bg-slate-200 hidden sm:block"></div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/tasks')} 
            className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 ml-2"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="font-medium">任务看板</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
           {/* ▼▼▼ 任务看板入口 (移动端图标) ▼▼▼ */}
           <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/tasks')} 
                className="sm:hidden text-slate-600"
            >
                <ClipboardList className="w-5 h-5" />
            </Button>

           {/* 管理员入口组 */}
           {isAdmin && (
             <>
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/template')} className="border-blue-200 text-blue-700 bg-blue-50 mr-2 hidden sm:flex">
                    <LayoutTemplate className="w-4 h-4 mr-1" /> 模板
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/system')} className="border-slate-200 text-slate-700 hover:bg-slate-50 mr-2 hidden sm:flex">
                    <Settings2 className="w-4 h-4 mr-1" /> 设置
                </Button>
                {/* 移动端管理员图标 */}
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/system')} className="sm:hidden text-slate-500">
                    <Settings2 className="w-5 h-5" />
                </Button>
             </>
           )}

           {/* 个人信息弹窗 */}
           <UserProfileDialog user={currentUser} />
           
           <form action={logout}>
             <Button variant="ghost" size="icon" type="submit" title="退出登录" className="text-slate-400 hover:text-red-600">
               <LogOut className="w-5 h-5" />
             </Button>
           </form>
        </div>
      </nav>

      <main className="container mx-auto p-4 max-w-7xl space-y-6 flex-1">
        {/* 概览条 */}
        <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800">
                你好，{currentUser.name || currentUser.workId} 👋
            </h1>
            <p className="text-slate-500 mt-1">
               本月已提交 <span className="text-blue-600 font-bold text-lg">{submittedDates.length}</span> 篇日报
            </p>
          </div>
          <Button onClick={() => router.push("/report/new")} className="h-12 px-6 text-base shadow-lg shadow-blue-200 w-full sm:w-auto">
            <PlusCircle className="w-5 h-5 mr-2" />
            新建今日日报
          </Button>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：日历 */}
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

          {/* 右侧：数据看板 */}
          <Card className="lg:col-span-2 border-0 shadow-sm flex flex-col min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600"/>
                <CardTitle className="text-base font-bold text-slate-700">关键指标趋势</CardTitle>
              </div>
              <div className="flex gap-2">
                {/* ▼▼▼ 知识库入口 ▼▼▼ */}
                <Button variant="outline" size="sm" onClick={() => router.push('/knowledge')} className="hidden sm:flex">
                    <BookOpen className="w-4 h-4 mr-1 text-slate-500"/> 知识库
                </Button>
                {/* AI 按钮 */}
                <Button 
                    variant="secondary" 
                    size="sm"
                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0"
                    onClick={handleGenerateSummary}
                    disabled={aiLoading}
                >
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Bot className="w-3 h-3 mr-1"/>}
                    AI总结
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                  <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  {/* 数据线配置 */}
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

        {/* ▼▼▼ 底部快捷访问栏 ▼▼▼ */}
        {quickLinks.length > 0 && (
         <section className="pt-6 border-t mt-auto">
            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <ExternalLink className="w-3 h-3"/> Quick Access / 常用系统
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {quickLinks.map(link => (
                    <a 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                            <ExternalLink className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate">
                            {link.title}
                        </span>
                    </a>
                ))}
            </div>
         </section>
        )}
      </main>

      {/* AI 总结弹窗 */}
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
      
      {/* 强制改密弹窗 */}
      <ForceChangePasswordDialog open={currentUser.isDefaultPassword} />
    </div>
  );
}

// === 组件：个人信息与改密弹窗 ===
function UserProfileDialog({ user }: { user: DashboardClientProps['currentUser'] }) {
    const [open, setOpen] = useState(false);
    const [state, action, isPending] = useActionState(changePassword, null);

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message);
        } else if (state?.success === false) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-100">
                    <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full">
                        <UserCircle className="w-5 h-5" />
                    </div>
                    <span className="text-slate-700 font-medium max-w-[100px] truncate hidden md:inline">
                        {user.name || user.workId}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>个人中心</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="info" className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">基本信息</TabsTrigger>
                        <TabsTrigger value="password">修改密码</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info" className="space-y-4 py-4">
                        <div className="grid gap-4">
                            <div className="flex items-center gap-4 border p-3 rounded-lg bg-slate-50">
                                <div className="bg-white p-2 rounded-full border shadow-sm">
                                    <User className="w-6 h-6 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">姓名</p>
                                    <p className="font-medium text-slate-900">{user.name || "未设置"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 border p-3 rounded-lg bg-slate-50">
                                <div className="bg-white p-2 rounded-full border shadow-sm">
                                    <BadgeCheck className="w-6 h-6 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">工号</p>
                                    <p className="font-mono font-medium text-slate-900">{user.workId}</p>
                                </div>
                            </div>
                            <div className="border p-3 rounded-lg bg-slate-50 space-y-2">
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm">负责区域</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {user.assignedAreas ? (
                                        user.assignedAreas.split(/[,，]/).map(area => (
                                            <span key={area} className="bg-white border px-2 py-1 rounded text-xs font-medium text-slate-600">
                                                {area.trim()}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-400 text-sm italic">未分配区域</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="password">
                        <form action={action} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>旧密码</Label>
                                <Input name="oldPassword" type="password" required />
                            </div>
                            <div className="space-y-2">
                                <Label>新密码</Label>
                                <Input name="newPassword" type="password" required placeholder="至少 6 位" />
                            </div>
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "确认修改"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

// === 组件：强制改密弹窗 ===
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