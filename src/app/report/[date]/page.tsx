import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getEnabledQuestions, getReportDetail } from "@/app/actions/submit-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, User, Image as ImageIcon } from "lucide-react";

// ▼▼▼ 核心修改 1：params 的类型变为 Promise ▼▼▼
export default async function ReportDetailPage({ params }: { params: Promise<{ date: string }> }) {

    // ▼▼▼ 核心修改 2：必须先 await params 才能拿到 date ▼▼▼
    const { date } = await params;

    // 1. 并行获取：该日期的报表 + 题目定义(为了拿标题)
    const report = await getReportDetail(date);
    const questions = await getEnabledQuestions();

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-xl font-bold text-slate-500">未找到 {date} 的日报记录</h1>
                <Link href="/"><Button>返回首页</Button></Link>
            </div>
        );
    }

    // 2. 解析 JSON 数据
    // 数据库里存的是 string，这里转回对象
    let answers: Record<string, any> = {};
    try {
        answers = JSON.parse(report.answers as string);
    } catch (e) {
        console.error("JSON解析失败", e);
    }

    // 3. 按分类分组题目
    const groupedQuestions = questions.reduce((acc, q) => {
        if (!acc[q.category]) acc[q.category] = [];
        acc[q.category].push(q);
        return acc;
    }, {} as Record<string, typeof questions>);

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* 顶部导航 */}
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">日报详情</h1>
                        {/* 这里的 date 已经是解构出来的 string 了 */}
                        <p className="text-slate-500 text-sm">{date}</p>
                    </div>
                </div>

                {/* 基础信息卡片 */}
                <Card>
                    <CardContent className="pt-6 flex flex-wrap gap-6">
                        <div className="flex items-center gap-2 text-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold">{report.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{report.area}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>提交于 {report.createdAt.toLocaleTimeString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 动态题目展示 */}
                {Object.entries(groupedQuestions).map(([category, qs]) => (
                    <Card key={category}>
                        <CardHeader><CardTitle className="text-blue-700 text-lg">{category}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {qs.map(q => {
                                const ans = answers[q.id] || {};
                                const val = ans.value;
                                const remark = ans.remark;
                                const images = ans.images || [];

                                return (
                                    <div key={q.id} className="border-b pb-4 last:border-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="text-slate-700 font-medium flex-1">{q.label}</div>
                                            <div className="font-mono text-lg font-bold shrink-0">
                                                {q.type === 'boolean' ? (
                                                    val ? <Badge className="bg-green-500">是 / 正常</Badge> : <Badge variant="destructive">否 / 异常</Badge>
                                                ) : (
                                                    <span className="text-slate-900">{val ?? '-'}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 备注与图片区域 */}
                                        {(remark || images.length > 0) && (
                                            <div className="mt-3 bg-slate-50 p-3 rounded text-sm space-y-2">
                                                {remark && (
                                                    <div className="text-slate-600">
                                                        <span className="font-bold text-slate-400 mr-2">备注:</span>
                                                        {remark}
                                                    </div>
                                                )}
                                                {images.length > 0 && (
                                                    <div className="space-y-1">
                                                        {images.map((img: string, i: number) => (
                                                            <div key={i} className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                                <ImageIcon className="w-3 h-3" />
                                                                {/* ▼▼▼ 修改：如果是 MinIO 的 URL 或 blob，这里应该用 Dialog 显示图片。
                    但目前我们只存了文件名字符串 "[待上传] xxx"。
                    如果是真实 URL，代码如下： 
                */}
                                                                <Dialog>
                                                                    <DialogTrigger className="text-xs truncate max-w-[200px] hover:underline cursor-pointer text-left">
                                                                        {img} (点击看大图 - 仅演示)
                                                                    </DialogTrigger>
                                                                    {/* 这里演示用一张占位图，因为目前数据库存的还不是真实 URL */}
                                                                    <DialogContent className="max-w-4xl flex flex-col items-center justify-center bg-transparent border-0 shadow-none p-0">
                                                                        {/* 必须加上 Header 和 Title，用 sr-only 隐藏它，或者直接显示文件名 */}
                                                                        <DialogHeader className="sr-only">
                                                                            <DialogTitle>图片预览</DialogTitle>
                                                                            <DialogDescription>查看图片详情</DialogDescription>
                                                                        </DialogHeader>

                                                                        {/* 这里因为数据库现在存的是 "[待上传]..." 字符串，没法直接显示图。
                             等接了真实 MinIO 后，这里 src={img} 即可 */}
                                                                        <div className="relative w-full h-auto">
                                                                            {/* 暂时用个占位，如果是真实URL直接 <img src={img} ... /> */}
                                                                            <div className="bg-white p-4 rounded text-center">
                                                                                <p>图片路径：{img}</p>
                                                                            </div>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                ))}

                {/* 总结卡片 */}
                {report.summary && (
                    <Card>
                        <CardHeader><CardTitle>四、今日总结</CardTitle></CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap text-slate-700 leading-relaxed">
                                {report.summary}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}