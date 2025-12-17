import { getBoardData } from "@/app/actions/task";
import { getCurrentUser } from "@/app/actions/auth";
import TaskBoard from "./task-board"; 
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, History, Archive } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { users, tasks } = await getBoardData();
  const isAdmin = user.roles.some(r => r.name === 'admin');

  // ▼▼▼ 逻辑：过滤任务 (只保留活跃的) ▼▼▼
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeTasks = tasks.filter(task => {
    // 1. 未完成的 -> 必须显示
    if (!task.deadline) return true;
    
    // 2. 已完成的，只有当截止时间是“今天及未来”时才显示
    // 这样能保证用户看到今天的成果，但不被昨天的刷屏
    const deadline = new Date(task.deadline);
    if (deadline >= todayStart) return true;

    // 其他（过去的已完成任务）都隐藏到历史页
    return false;
  });

  return (
    <div className="h-screen bg-slate-100 flex flex-col select-none overflow-hidden">
      {/* 头部固定，不滚动 */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-4">
           <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft/></Button></Link>
           <h1 className="text-xl font-bold text-slate-800">任务看板</h1>
        </div>
        <div className="flex gap-2">
             {/* ▼▼▼ 新增：历史任务入口 ▼▼▼ */}
             <Link href="/tasks/history">
                <Button variant="outline" size="sm" className="text-slate-600">
                    <Archive className="w-4 h-4 mr-2"/>历史任务
                </Button>
             </Link>
             
             {isAdmin && (
                 <Link href="/tasks/logs">
                    <Button variant="outline" size="sm"><History className="w-4 h-4 mr-2"/>日志</Button>
                 </Link>
             )}
        </div>
      </div>

      {/* ▼▼▼ Bug修复1: flex-1 自动填充剩余高度，让横向滚动条始终可见 ▼▼▼ */}
      <div className="flex-1 overflow-hidden min-h-0">
         <TaskBoard 
            users={users} 
            initialTasks={activeTasks} 
            currentUserId={user.id} 
            isAdmin={isAdmin} 
         />
      </div>
    </div>
  );
}