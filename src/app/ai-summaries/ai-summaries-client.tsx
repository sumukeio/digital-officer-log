"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserAISummaries } from "@/app/actions/ai";
import { Bot, ArrowLeft, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AISummary {
  id: string;
  content: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export default function AISummariesClient() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const data = await getUserAISummaries();
        // 转换日期字符串为 Date 对象
        const formattedData = data.map((s: any) => ({
          ...s,
          startDate: new Date(s.startDate),
          endDate: new Date(s.endDate),
          createdAt: new Date(s.createdAt),
        }));
        setSummaries(formattedData);
      } catch (error) {
        console.error("加载AI总结记录失败:", error);
        toast.error("加载失败，请重试");
      } finally {
        setLoading(false);
      }
    };

    loadSummaries();
  }, []);

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
    const endStr = end.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">AI 总结记录</h1>
            </div>
          </div>
        </div>

        {/* 总结列表 */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中...</div>
        ) : summaries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>暂无AI总结记录</p>
              <p className="text-sm mt-2">在工作台生成AI总结后，记录会显示在这里</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      {formatDateRange(summary.startDate, summary.endDate)}
                    </CardTitle>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {summary.createdAt.toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-slate-700">
                    <ReactMarkdown>{summary.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

