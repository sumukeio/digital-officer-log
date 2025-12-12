import { getTaskLogs } from "@/app/actions/task";
import { getCurrentUser } from "@/app/actions/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function TaskLogsPage() {
  const user = await getCurrentUser();
  if (!user || !user.roles.some(r => r.name === 'admin')) {
    redirect("/tasks");
  }

  const logs = await getTaskLogs();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/tasks"><Button variant="ghost"><ArrowLeft className="mr-2 w-4 h-4"/>返回看板</Button></Link>
            <h1 className="text-2xl font-bold">任务操作日志</h1>
        </div>

        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>操作人</TableHead>
                        <TableHead>动作</TableHead>
                        <TableHead>任务内容</TableHead>
                        <TableHead>详情</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell className="text-slate-500 text-xs">
                                {log.createdAt.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">{log.operatorName}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={
                                    log.action === 'CREATE' ? 'bg-blue-50 text-blue-700' :
                                    log.action === 'COMPLETE' ? 'bg-green-50 text-green-700' :
                                    log.action === 'MOVE' ? 'bg-orange-50 text-orange-700' : ''
                                }>
                                    {log.action}
                                </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={log.task?.content}>
                                {log.task?.content || "已删除"}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                                {log.details}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      </div>
    </div>
  );
}