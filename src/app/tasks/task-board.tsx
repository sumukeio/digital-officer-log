"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createTask, updateTask, completeTask, moveTask } from "@/app/actions/task";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, CheckCircle2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Task {
  id: string;
  content: string;
  location: string;
  deadline: Date;
  isCompleted: boolean;
  userId: string;
  order: number;
}

interface User {
  id: string;
  name: string | null;
  workId: string;
}

export default function TaskBoard({ users, initialTasks, currentUserId, isAdmin }: any) {
  // 本地状态用于乐观更新
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // 拖拽处理
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // 权限校验：跨列拖拽
    if (source.droppableId !== destination.droppableId && !isAdmin) {
        toast.error("只有管理员可以跨任务区移动任务");
        return;
    }

    // 1. 乐观更新前端 UI
    const newTasks = Array.from(tasks);
    const movedTask = newTasks.find(t => t.id === draggableId);
    if (!movedTask) return;

    // 更新任务属性
    const targetUserId = destination.droppableId;
    // 计算新排序值 (简单算法：取前后平均值，或者 simply index update 配合 reload)
    // 这里为了演示流畅性，我们假设后端会处理 order，前端先只管位置
    movedTask.userId = targetUserId;
    
    // 重新排序数组以反映拖拽结果 (复杂，这里简化处理：触发 UI 更新，实际顺序靠刷新)
    // 在真实生产中，你需要在这里精确计算 splice 逻辑
    setTasks(newTasks.map(t => t.id === draggableId ? { ...t, userId: targetUserId } : t));

    // 2. 调用后端
    try {
        // 这里的 newOrder 简化处理，实际需要计算
        // 我们传入一个 timestamp 作为 order 确保它排在最后，或者需要更复杂的链表算法
        // 这里简单传一个时间戳模拟
        await moveTask(draggableId, targetUserId, Date.now()); 
        toast.success("移动成功");
    } catch (e) {
        toast.error("移动失败");
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full p-4 gap-4">
        {users.map((u: User) => (
          <div key={u.id} className="w-80 flex-shrink-0 flex flex-col bg-slate-200/50 rounded-xl border max-h-full">
            {/* 列头 */}
            <div className="p-3 border-b bg-white/50 rounded-t-xl flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                    <UserCircle className="w-5 h-5 text-blue-500" />
                    <span>{u.name || u.workId}</span>
                </div>
                {u.id === currentUserId && (
                    <TaskDialog userId={u.id} />
                )}
            </div>

            {/* 任务列表区域 */}
            <Droppable droppableId={u.id}>
              {(provided) => (
                <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
                >
                  {tasks
                    .filter(t => t.userId === u.id)
                    .sort((a, b) => a.order - b.order) // 前端简单排序
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard task={task} currentUserId={currentUserId} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

// === 单个任务卡片组件 ===
function TaskCard({ task, currentUserId }: { task: Task, currentUserId: string }) {
    const isOwner = task.userId === currentUserId;
    
    // 倒计时逻辑
    const [timeLeft, setTimeLeft] = useState("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const tick = () => {
            if (task.isCompleted) return;
            const now = new Date();
            const end = new Date(task.deadline);
            
            if (isPast(end)) {
                setIsOverdue(true);
                setTimeLeft("已超时");
            } else {
                setIsOverdue(false);
                setTimeLeft(formatDistanceToNow(end, { locale: zhCN, addSuffix: false }));
            }
        };
        tick();
        const timer = setInterval(tick, 60000); // 每分钟刷新
        return () => clearInterval(timer);
    }, [task.deadline, task.isCompleted]);

    // 样式处理
    let cardClass = "bg-white border-l-4 shadow-sm hover:shadow-md transition-all";
    if (task.isCompleted) cardClass += " border-l-slate-300 bg-slate-50 opacity-60"; // 完成变灰
    else if (isOverdue) cardClass += " border-l-red-500"; // 超时变红
    else cardClass += " border-l-blue-500"; // 进行中

    return (
        <Card className={cardClass}>
            <CardContent className="p-3 space-y-2">
                <div className={`font-medium text-sm ${task.isCompleted && "line-through text-slate-500"}`}>
                    {task.content}
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {task.location}
                    </div>
                </div>

                {!task.isCompleted && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${isOverdue ? "text-red-500" : "text-blue-600"}`}>
                        <Clock className="w-3 h-3" />
                        {isOverdue ? "已超时" : `剩余: ${timeLeft}`}
                    </div>
                )}

                {/* 操作栏 (只有任务主人能操作) */}
                {isOwner && !task.isCompleted && (
                    <div className="pt-2 flex justify-end gap-2 border-t mt-2">
                         <TaskDialog task={task} isEdit />
                         <form action={async () => {
                             await completeTask(task.id);
                             toast.success("任务完成！");
                         }}>
                            <Button size="xs" variant="ghost" className="h-6 text-green-600 hover:text-green-700 hover:bg-green-50">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> 完成
                            </Button>
                         </form>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// === 新建/编辑任务弹窗 ===
function TaskDialog({ userId, task, isEdit }: { userId?: string, task?: Task, isEdit?: boolean }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button size="xs" variant="ghost" className="h-6 text-slate-400">修改</Button>
                ) : (
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Plus className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{isEdit ? "修改任务" : "新建任务"}</DialogTitle></DialogHeader>
                <form action={async (formData) => {
                    if (isEdit) await updateTask(formData);
                    else await createTask(formData);
                    setOpen(false);
                    toast.success("保存成功");
                }} className="space-y-4">
                    {isEdit && <input type="hidden" name="id" value={task?.id} />}
                    
                    <div className="space-y-2">
                        <Label>任务内容</Label>
                        <Input name="content" required defaultValue={task?.content} placeholder="例如：检查3号机台气压" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>执行地点</Label>
                        <Input name="location" required defaultValue={task?.location} placeholder="注塑A区" />
                    </div>

                    <div className="space-y-2">
                        <Label>截止时间 (北京时间)</Label>
                        <Input 
                            name="deadline" 
                            type="datetime-local" 
                            required 
                            defaultValue={task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""} 
                        />
                    </div>

                    <Button type="submit" className="w-full">{isEdit ? "保存修改" : "立即发布"}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}