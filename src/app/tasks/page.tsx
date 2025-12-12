import { getBoardData } from "@/app/actions/task";
import { getCurrentUser } from "@/app/actions/auth";
import TaskBoard from "./task-board"; // 客户端组件
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { users, tasks } = await getBoardData();
  const isAdmin = user.roles.some(r => r.name === 'admin');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 顶部栏 */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-4">
           <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft/></Button></Link>
           <h1 className="text-xl font-bold text-slate-800">任务看板 (Kanban)</h1>
        </div>
        {isAdmin && (
             <Link href="/tasks/logs">
                <Button variant="outline" size="sm"><History className="w-4 h-4 mr-2"/>操作日志</Button>
             </Link>
        )}
      </div>

      {/* 看板主体 */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
         <TaskBoard 
            users={users} 
            initialTasks={tasks} 
            currentUserId={user.id} 
            isAdmin={isAdmin} 
         />
      </div>
    </div>
  );
}