import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function HistoryTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 计算“今天”的分界线
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 查询条件：
  // 1. 只有“已完成”的任务
  // 2. 且日期早于今天 (也就是看板里隐藏的那些)
  const historyTasks = await prisma.task.findMany({
    where: {
      isCompleted: true,
      deadline: {
        lt: todayStart
      }
    },
    include: {
      user: true // 获取执行人名字
    },
    orderBy: {
      deadline: 'desc' // 按时间倒序
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/tasks"><Button variant="ghost"><ArrowLeft className="mr-2 w-4 h-4"/>返回看板</Button></Link>
            <h1 className="text-2xl font-bold text-slate-800">历史归档任务</h1>
        </div>

        <div className="bg-white rounded-xl shadow border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>截止时间</TableHead>
                        <TableHead>任务内容</TableHead>
                        <TableHead>执行人</TableHead>
                        <TableHead>地点</TableHead>
                        <TableHead>状态</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {historyTasks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                暂无归档任务
                            </TableCell>
                        </TableRow>
                    ) : (
                        historyTasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell className="font-mono text-slate-500">
                                    {new Date(task.deadline).toLocaleString('zh-CN')}
                                </TableCell>
                                <TableCell className="font-medium select-text">{task.content}</TableCell>
                                <TableCell>{task.user.name || task.user.workId}</TableCell>
                                <TableCell className="select-text">{task.location}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 flex w-fit items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3"/> 已完成
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}