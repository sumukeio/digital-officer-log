import { getHistoryTasks, deleteTask } from "@/app/actions/task"; 
import { getCurrentUser } from "@/app/actions/auth";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CheckCircle2, MapPin, UserCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// 强制动态渲染，保证每次进来都查最新数据
export const dynamic = 'force-dynamic'; 

export default async function HistoryPage() {
  // 调用 Action 获取数据 (按完成时间倒序，无日期限制)
  const [tasks, currentUser] = await Promise.all([
    getHistoryTasks(),
    getCurrentUser(),
  ]);

  const isAdmin = !!currentUser?.roles?.some((r) => r.name === "admin");

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 顶部导航 */}
        <div className="flex items-center gap-4">
            <Link href="/tasks">
              <Button variant="ghost" className="hover:bg-white/50">
                <ArrowLeft className="mr-2 w-4 h-4"/>返回看板
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">历史归档任务</h1>
            </div>
        </div>

        {/* 任务列表 */}
        <div className="grid gap-4">
          {tasks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                  <p className="text-gray-400">暂无已完成的任务</p>
              </div>
          ) : (
              tasks.map((task) => (
                <Card
                  key={task.id}
                  className="group hover:shadow-md transition-all bg-white/80 border-slate-200"
                >
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      {/* 任务内容 */}
                      <div className="font-medium text-lg text-gray-500 line-through decoration-gray-300">
                        {task.content}
                      </div>

                      {/* 辅助信息 */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3" /> {task.location || "无地点"}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCircle className="w-3 h-3" />
                          {task.user?.name || task.user?.workId || "未知"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* 完成时间 */}
                      <div className="text-xs font-medium text-gray-400 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                        完成于: {format(new Date(task.updatedAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}
                      </div>

                      {/* 管理员删除，仅 admin 可见，极简小按钮 */}
                      {isAdmin && (
                        <form
                          action={async () => {
                            "use server";
                            await deleteTask(task.id);
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                            aria-label="删除任务"
                          >
                            ✕
                          </Button>
                        </form>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}