import { getReportDetail } from "@/app/actions/submit-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, CalendarDays, MapPin, ImageIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function ReportDetailPage(props: PageProps) {
  const params = await props.params;
  const { date } = params;

  // 调用刚才补上的后端函数
  const data = await getReportDetail(date);

  if (!data || !data.report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50">
        <h1 className="text-xl font-bold text-slate-800">未找到该日期的日报</h1>
        <p className="text-slate-500">日期: {date}</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    );
  }

  const { report, questions } = data;
  let answers: Record<string, any> = {};
  try {
    answers = JSON.parse(report.answers);
  } catch (e) {
    console.error("JSON Parse Error", e);
  }

  // 辅助函数：渲染单个答案
  const renderAnswer = (qId: string) => {
    const ans = answers[qId];
    if (!ans) return <span className="text-slate-400 italic">未填</span>;

    const val = ans.value;
    const remark = ans.remark;
    const images = ans.images || []; // 图片数组

    let displayVal = val;
    if (val === true) displayVal = <span className="text-green-600 font-bold">正常 / 是</span>;
    if (val === false) displayVal = <span className="text-red-500 font-bold">异常 / 否</span>;

    return (
      <div className="space-y-1">
        <div className="text-lg font-mono text-slate-800">{displayVal}</div>
        
        {remark && (
            <div className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">
                备注: {remark}
            </div>
        )}

        {/* 图片预览区域 */}
        {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img: string, i: number) => (
                    <Dialog key={i}>
                        <DialogTrigger asChild>
                            <div className="relative w-16 h-16 border rounded overflow-hidden cursor-zoom-in hover:opacity-80">
                                <img src={img} className="w-full h-full object-cover" alt="preview" />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none flex justify-center items-center">
                             <DialogHeader className="sr-only">
                                <DialogTitle>图片预览</DialogTitle>
                                <DialogDescription>查看大图</DialogDescription>
                             </DialogHeader>
                             <img src={img} alt="full" className="max-w-full max-h-[85vh] rounded-md object-contain" />
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* 顶部导航 */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">日报详情</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/> {date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {report.area}</span>
            </div>
          </div>
        </div>

        {/* 题目列表 */}
        <Card>
          <CardHeader><CardTitle>详细记录</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {questions.map((q) => {
               // 如果这个问题在这个日报里压根没记录（可能是新增的题目），就跳过，或者显示未填
               if(!answers[q.id]) return null; 

               return (
                <div key={q.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="text-sm text-slate-500 mb-1">{q.label}</div>
                    {renderAnswer(q.id)}
                </div>
               );
            })}
          </CardContent>
        </Card>

        {/* 总结卡片 */}
        <Card>
            <CardHeader><CardTitle>今日总结</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border">
                    {report.summary || "无总结内容"}
                </div>
                {/* 总结的图片 */}
                {answers["summary_images"] && answers["summary_images"].images && (
                     <div className="flex flex-wrap gap-2">
                        {answers["summary_images"].images.map((img: string, i: number) => (
                            <Dialog key={i}>
                                <DialogTrigger asChild>
                                    <div className="relative w-20 h-20 border rounded overflow-hidden cursor-zoom-in hover:opacity-80">
                                        <img src={img} className="w-full h-full object-cover" alt="summary-preview" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none flex justify-center items-center">
                                     <DialogHeader className="sr-only">
                                        <DialogTitle>总结图片</DialogTitle>
                                        <DialogDescription>查看大图</DialogDescription>
                                     </DialogHeader>
                                     <img src={img} alt="full" className="max-w-full max-h-[85vh] rounded-md object-contain" />
                                </DialogContent>
                            </Dialog>
                        ))}
                     </div>
                )}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}