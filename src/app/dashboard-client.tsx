"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, PlusCircle, KeyRound, Loader2, Bot,
  Settings2, BarChart3, User, MapPin, BadgeCheck,
  UserCircle, LayoutTemplate, BookOpen, ExternalLink,
  ClipboardList, Bell, History, FileSpreadsheet, Clock
} from "lucide-react";
import { UpdateAnnouncementDialog } from "@/components/UpdateAnnouncement";
import { logout, changePassword } from "@/app/actions/auth";
import { generateWeeklySummary } from "@/app/actions/ai";
import ReactMarkdown from "react-markdown";
// ▼▼▼ 1. 引入新的 Server Action (注意方法名) ▼▼▼
import { getUserAreas, getReportTrend } from "@/app/actions/analysis";
import { toast } from "sonner";

// ▼▼▼ 2. 引入 Recharts 图表库组件 ▼▼▼
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// 定义趋势数据类型 (对应后端 getReportTrend 返回的数据结构)
type TrendItem = {
  date: string;
  production: number; // 生产头条
  qc: number;         // QC头条
  okr: number;        // OKR
  lean: number;       // 精益
  ipqc: number;       // IPQC
};

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

export default function DashboardClient({ submittedDates, currentUser, quickLinks }: DashboardClientProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const isAdmin = currentUser.roles.some(r => r.name === 'admin');

  // 修复 Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // AI 总结状态
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ▼▼▼ 3. 区域分析状态 ▼▼▼
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState("all");
  const [trendData, setTrendData] = useState<TrendItem[]>([]); 
  const [analysisLoading, setAnalysisLoading] = useState(true);

  // 初始化区域列表
  useEffect(() => {
    let ignore = false;
    const initAreas = async () => {
      try {
        const areaList = await getUserAreas();
        if (!ignore) setAreas(areaList);
      } catch (e) {
        if (!ignore) toast.error("无法加载负责区域列表");
      }
    };
    initAreas();
    return () => { ignore = true; };
  }, []);

  // 监听区域变化，加载趋势数据
  useEffect(() => {
    let ignore = false;
    const fetchTrend = async () => {
      setAnalysisLoading(true);
      try {
        // 调用新的 getReportTrend 方法
        const result = await getReportTrend(selectedArea);
        if (!ignore) setTrendData(result);
      } catch (err) {
        console.error("加载数据失败", err);
        if (!ignore) toast.error("数据加载失败");
      } finally {
        if (!ignore) setAnalysisLoading(false);
      }
    };
    fetchTrend();
    return () => { ignore = true; };
  }, [selectedArea]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (!newDate) return;

    // 格式化为 YYYY-MM-DD，解决时区问题的关键
    // 这种写法能保证拿到的是你本地看到的日期，而不是 UTC 的前一天
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isSubmitted = submittedDates.some(d =>
      d.getDate() === newDate.getDate() &&
      d.getMonth() === newDate.getMonth() &&
      d.getFullYear() === newDate.getFullYear()
    );

    if (isSubmitted) {
      router.push(`/report/${dateStr}`);
    } else {
      // ▼▼▼ 修改这里：带上 date 参数 ▼▼▼
      router.push(`/report/new?date=${dateStr}`);
    }
  };

  const handleGenerateSummary = async () => {
    setAiLoading(true); setSummaryOpen(true); setSummaryContent("");
    try { const text = await generateWeeklySummary(); setSummaryContent(text); } 
    catch (e) { setSummaryContent("生成失败"); } 
    finally { setAiLoading(false); }
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50"></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none">
      {/* 顶部导航 (保持不变) */}
      <nav className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
         <div className="font-bold text-lg flex items-center gap-2 text-slate-800">
           <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-sm font-mono">DO</span>
           <span className="hidden sm:inline">数字官工作台</span>
           <div className="ml-4 h-6 w-px bg-slate-200 hidden sm:block"></div>
           <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')} className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 ml-2">
             <ClipboardList className="w-4 h-4" /> <span className="font-medium">任务看板</span>
           </Button>
           <Button variant="ghost" size="sm" onClick={() => router.push('/weekly-summary')} className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 ml-1">
             <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> <span className="font-medium">周报生成</span>
           </Button>
           <Button variant="ghost" size="sm" onClick={() => router.push('/shifts')} className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 ml-1">
             <Clock className="w-4 h-4 text-amber-600" /> <span className="font-medium">转班提醒</span>
           </Button>
           <Button variant="ghost" size="sm" onClick={() => router.push('/badge')} className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 ml-1">
             <BadgeCheck className="w-4 h-4 text-blue-600" /> <span className="font-medium">工牌生成</span>
           </Button>
         </div>
         <div className="flex items-center gap-2">
            {/* 移动端/管理员按钮等 */}
            <Button variant="ghost" size="icon" onClick={() => router.push('/tasks')} className="sm:hidden text-slate-600" title="任务看板"><ClipboardList className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/weekly-summary')} className="sm:hidden text-slate-600" title="周报生成"><FileSpreadsheet className="w-5 h-5 text-emerald-600" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/shifts')} className="sm:hidden text-slate-600" title="转班提醒"><Clock className="w-5 h-5 text-amber-600" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/badge')} className="sm:hidden text-slate-600" title="工牌生成"><BadgeCheck className="w-5 h-5 text-blue-600" /></Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/knowledge')} className="sm:hidden text-slate-600"><BookOpen className="w-5 h-5" /></Button>
            {isAdmin && (
              <>
               <Button variant="outline" size="sm" onClick={() => router.push('/admin/template')} className="border-blue-200 text-blue-700 bg-blue-50 mr-2 hidden sm:flex"><LayoutTemplate className="w-4 h-4 mr-1" /> 模板</Button>
               <Button variant="outline" size="sm" onClick={() => router.push('/admin/system')} className="border-slate-200 text-slate-700 hover:bg-slate-50 mr-2 hidden sm:flex"><Settings2 className="w-4 h-4 mr-1" /> 设置</Button>
               <Button variant="ghost" size="icon" onClick={() => router.push('/admin/system')} className="sm:hidden text-slate-500"><Settings2 className="w-5 h-5" /></Button>
              </>
            )}
            {/* ▼▼▼ 更新公告按钮（右上角）▼▼▼ */}
            <UpdateAnnouncementDialog />
            <UserProfileDialog user={currentUser} />
            <form action={logout}><Button variant="ghost" size="icon" type="submit"><LogOut className="w-5 h-5" /></Button></form>
         </div>
      </nav>

      <main className="container mx-auto p-4 max-w-7xl space-y-6 flex-1">
        {/* 欢迎区 */}
        <section className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border gap-4">
           <div className="text-center sm:text-left">
             <h1 className="text-2xl font-bold text-slate-800">你好，{currentUser.name || currentUser.workId} 👋</h1>
             <p className="text-slate-500 mt-1">本月已提交 <span className="text-blue-600 font-bold text-lg">{submittedDates.length}</span> 篇日报</p>
           </div>
           <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" onClick={() => router.push("/weekly-summary")} className="h-12 px-5 text-sm border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 flex-1 sm:flex-initial">
               <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" /> 自动总结周报
             </Button>
             <Button onClick={() => router.push("/report/new")} className="h-12 px-6 text-base shadow-lg shadow-blue-200 flex-1 sm:flex-initial">
               <PlusCircle className="w-5 h-5 mr-2" /> 新建今日日报
             </Button>
           </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：提交日历 (保持不变) */}
          <Card className="border-0 shadow-sm h-full min-h-[400px]">
             <CardHeader><CardTitle className="text-base text-slate-500">提交日历</CardTitle></CardHeader>
             <CardContent className="flex justify-center p-0 pb-4">
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} className="rounded-md border-0" modifiers={{ submitted: submittedDates }} modifiersStyles={{ submitted: { color: 'white', backgroundColor: '#10b981', fontWeight: 'bold', borderRadius: '100%' } }} />
             </CardContent>
          </Card>

          {/* ▼▼▼ 右侧：关键指标趋势 (重构为5指标折线图) ▼▼▼ */}
          <Card className="lg:col-span-2 border-0 shadow-sm flex flex-col min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base font-bold text-slate-700">关键指标趋势 (近7天)</CardTitle>
              </div>

              {/* 功能区 */}
              <div className="flex items-center gap-2">
                {/* 区域筛选下拉框 */}
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="appearance-none bg-white border border-blue-400 text-slate-700 font-medium text-sm rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <option value="all">全负责区域</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => router.push('/knowledge')} className="hidden sm:flex border-slate-200">
                  <BookOpen className="w-4 h-4 mr-1 text-slate-500" /> 知识库
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0" onClick={handleGenerateSummary} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />} AI总结
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900" onClick={() => router.push("/ai-summaries")}>
                    <History className="w-3 h-3 mr-1" /> 历史记录
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 pb-4 pr-4"> 
              {/* 使用 p-0 和 padding-right 调整图表边距 */}
              {analysisLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm">正在加载指标数据...</p>
                </div>
              ) : trendData.length > 0 ? (
                <div className="h-[320px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>
                      
                      {/* 1. IPQC (紫色) */}
                      <Line type="monotone" dataKey="ipqc" name="IPQC" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      
                      {/* 2. OKR (绿色) */}
                      <Line type="monotone" dataKey="okr" name="OKR" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />

                      {/* 3. QC头条 (红色) */}
                      <Line type="monotone" dataKey="qc" name="QC头条" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />

                      {/* 4. 生产头条 (蓝色) */}
                      <Line type="monotone" dataKey="production" name="生产头条" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />

                      {/* 5. 精益 (橙色) */}
                      <Line type="monotone" dataKey="lean" name="精益" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl m-4 border border-dashed">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* 底部快捷链接 (保持不变) */}
        {quickLinks.length > 0 && (
          <section className="pt-6 border-t mt-auto">
             <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <ExternalLink className="w-3 h-3" /> Quick Access / 常用系统
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {quickLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0"><ExternalLink className="w-4 h-4" /></div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate select-text">{link.title}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* AI总结弹窗 */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" /> AI 周报总结
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => { setSummaryOpen(false); router.push("/ai-summaries"); }}>
                <History className="w-4 h-4 mr-1" /> 查看历史记录
              </Button>
            </div>
          </DialogHeader>
          <div className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-lg border text-sm md:text-base select-text">
            {aiLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{summaryContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ForceChangePasswordDialog open={currentUser.isDefaultPassword} />
    </div>
  );
}

// UserProfileDialog 和 ForceChangePasswordDialog 保持不变 (由于篇幅原因省略，请保留原来的代码)
function UserProfileDialog({ user }: { user: DashboardClientProps['currentUser'] }) {
  // ...原来的代码
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState(changePassword, null);
  useEffect(() => { if (state?.success) toast.success(state.message); else if (state?.success === false) toast.error(state.message); }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-100"><div className="bg-blue-100 text-blue-700 p-1.5 rounded-full"><UserCircle className="w-5 h-5" /></div><span className="text-slate-700 font-medium max-w-[100px] truncate hidden md:inline">{user.name || user.workId}</span></Button></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
         {/* ...省略内容，保持原样... */}
         <DialogHeader><DialogTitle>个人中心</DialogTitle></DialogHeader>
         <Tabs defaultValue="info" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="info">基本信息</TabsTrigger><TabsTrigger value="password">修改密码</TabsTrigger></TabsList>
            <TabsContent value="info" className="space-y-4 py-4">
               {/* 个人信息展示逻辑保持不变 */}
               <div className="grid gap-4">
                  <div className="flex items-center gap-4 border p-3 rounded-lg bg-slate-50"><div className="bg-white p-2 rounded-full border shadow-sm"><User className="w-6 h-6 text-slate-500" /></div><div><p className="text-sm text-slate-500">姓名</p><p className="font-medium text-slate-900 select-text">{user.name || "未设置"}</p></div></div>
                  <div className="flex items-center gap-4 border p-3 rounded-lg bg-slate-50"><div className="bg-white p-2 rounded-full border shadow-sm"><BadgeCheck className="w-6 h-6 text-slate-500" /></div><div><p className="text-sm text-slate-500">工号</p><p className="font-mono font-medium text-slate-900 select-text">{user.workId}</p></div></div>
                  <div className="border p-3 rounded-lg bg-slate-50 space-y-2"><div className="flex items-center gap-2 text-slate-500 mb-1"><MapPin className="w-4 h-4" /><span className="text-sm">负责区域</span></div><div className="flex flex-wrap gap-2">{user.assignedAreas ? user.assignedAreas.split(/[,，]/).map(area => (<span key={area} className="bg-white border px-2 py-1 rounded text-xs font-medium text-slate-600 select-text">{area.trim()}</span>)) : (<span className="text-slate-400 text-sm italic">未分配区域</span>)}</div></div>
               </div>
            </TabsContent>
            <TabsContent value="password">
               <form action={action} className="space-y-4 py-4">
                  <div className="space-y-2"><Label>旧密码</Label><Input name="oldPassword" type="password" required className="select-text" /></div>
                  <div className="space-y-2"><Label>新密码</Label><Input name="newPassword" type="password" required placeholder="至少 6 位" className="select-text" /></div>
                  <Button type="submit" className="w-full" disabled={isPending}>{isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "确认修改"}</Button>
               </form>
            </TabsContent>
         </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ForceChangePasswordDialog({ open }: { open: boolean }) {
  // ...原来的代码
  const [state, action, isPending] = useActionState(changePassword, null);
  useEffect(() => { if (state?.success) { toast.success("密码修改成功，系统将自动刷新"); setTimeout(() => window.location.reload(), 1500); } else if (state?.success === false) { toast.error(state.message); } }, [state]);
  return (
    <Dialog open={open}>
      <DialogContent className="[&>button]:hidden pointer-events-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><KeyRound className="w-5 h-5" /> 安全警告：请修改初始密码</DialogTitle></DialogHeader>
        <div className="text-sm text-slate-500 mb-4 bg-red-50 p-3 rounded border border-red-100">为了您的数据安全，首次登录必须将初始密码 (123456) 修改为您的个人密码。</div>
        <form action={action} className="space-y-4">
          <div className="space-y-2"><Label>当前密码 (初始)</Label><Input name="oldPassword" type="password" defaultValue="123456" readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed select-text" /></div>
          <div className="space-y-2"><Label>新密码 (至少6位)</Label><Input name="newPassword" type="password" placeholder="请输入新密码" required autoFocus className="select-text" /></div>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isPending}>{isPending ? "修改中..." : "确认修改并进入系统"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}