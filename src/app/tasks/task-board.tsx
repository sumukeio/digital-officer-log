"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createTask, updateTask, completeTask, moveTask } from "@/app/actions/task";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Clock, CheckCircle2, UserCircle, Plus } from "lucide-react";
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  
  // ▼▼▼ 拖拽水合修复 ▼▼▼
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  // ▼▼▼ 自动刷新修复：服务端数据变了，前端自动跟进 ▼▼▼
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId !== destination.droppableId && !isAdmin) {
        toast.error("只有管理员可以跨任务区移动任务");
        return;
    }

    const newTasks = Array.from(tasks);
    const movedTask = newTasks.find(t => t.id === draggableId);
    if (!movedTask) return;

    const targetUserId = destination.droppableId;
    movedTask.userId = targetUserId;
    
    // 乐观更新
    setTasks(newTasks.map(t => t.id === draggableId ? { ...t, userId: targetUserId } : t));

    try {
        await moveTask(draggableId, targetUserId, Date.now()); 
        toast.success("移动成功");
    } catch (e) {
        toast.error("移动失败");
    }
  };

  if (!enabled) {
    return null; 
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* ▼▼▼ 布局优化：手机竖排，电脑横排 ▼▼▼ */}
      <div className="flex flex-col md:flex-row h-full p-4 gap-4 overflow-x-auto select-none">
        {users.map((u: User) => (
          // 手机端宽度占满，电脑端固定宽度
          <div key={u.id} className="w-full md:w-80 flex-shrink-0 flex flex-col bg-slate-200/50 rounded-xl border max-h-[80vh] md:max-h-full">
            <div className="p-3 border-b bg-white/50 rounded-t-xl flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                    <UserCircle className="w-5 h-5 text-blue-500" />
                    <span>{u.name || u.workId}</span>
                </div>
                {u.id === currentUserId && (
                    <TaskDialog userId={u.id} />
                )}
            </div>

            <Droppable droppableId={u.id}>
              {(provided) => (
                <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
                >
                  {tasks
                    .filter(t => t.userId === u.id)
                    .sort((a, b) => a.order - b.order)
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

function TaskCard({ task, currentUserId }: { task: Task, currentUserId: string }) {
    const isOwner = task.userId === currentUserId;
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
        const timer = setInterval(tick, 60000);
        return () => clearInterval(timer);
    }, [task.deadline, task.isCompleted]);

    let cardClass = "bg-white border-l-4 shadow-sm hover:shadow-md transition-all";
    if (task.isCompleted) cardClass += " border-l-slate-300 bg-slate-50 opacity-60";
    else if (isOverdue) cardClass += " border-l-red-500";
    else cardClass += " border-l-blue-500";

    return (
        <Card className={cardClass}>
            <CardContent className="p-3 space-y-2">
                <div className={`font-medium text-sm ${task.isCompleted && "line-through text-slate-500"} select-text`}>
                    {task.content}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 select-text">
                        <MapPin className="w-3 h-3" /> {task.location}
                    </div>
                </div>
                {!task.isCompleted && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${isOverdue ? "text-red-500" : "text-blue-600"}`}>
                        <Clock className="w-3 h-3" />
                        {isOverdue ? "已超时" : `剩余: ${timeLeft}`}
                    </div>
                )}
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
                        <Input name="content" required defaultValue={task?.content} placeholder="例如：检查3号机台气压" className="select-text" />
                    </div>
                    <div className="space-y-2">
                        <Label>执行地点</Label>
                        <Input name="location" required defaultValue={task?.location} placeholder="注塑A区" className="select-text" />
                    </div>
                    <div className="space-y-2">
                        <Label>截止时间</Label>
                        <Input name="deadline" type="datetime-local" required defaultValue={task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""} className="select-text" />
                    </div>
                    <Button type="submit" className="w-full">{isEdit ? "保存修改" : "立即发布"}</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}