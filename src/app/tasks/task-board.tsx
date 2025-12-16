"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createTask, updateTask, completeTask, moveTask } from "@/app/actions/task";
// 引入上一轮创建的组件 (包含倒计时逻辑)
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Plus, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DraggableDuration } from "@/components/DraggableDuration"; // 引入刚才写的组件

// 1. 更新接口定义以匹配数据库
interface Task {
  id: string;
  content: string;
  location: string;
  startTime: Date; // 改为开始时间
  duration: number; // 新增时长
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

  // 拖拽水合修复
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  // 服务端数据同步
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // 2. 核心修复：拖拽结束后的排序计算
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // 没动或者拖到了非法区域
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // 权限校验
    if (source.droppableId !== destination.droppableId && !isAdmin) {
      toast.error("只有管理员可以跨任务区移动任务");
      return;
    }

    // --- 乐观更新 (Optimistic UI) ---
    const targetUserId = destination.droppableId;

    // 1. 深拷贝当前任务列表
    const newTasks = Array.from(tasks);
    const movedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
    const [movedTask] = newTasks.splice(movedTaskIndex, 1); // 移除被拖拽的任务

    // 更新任务的 userId
    movedTask.userId = targetUserId;

    // 2. 找到目标列的所有任务，用于计算新位置
    const targetColumnTasks = newTasks
      .filter(t => t.userId === targetUserId)
      .sort((a, b) => a.order - b.order); // 必须先排好序

    // 3. 插入到目标位置
    targetColumnTasks.splice(destination.index, 0, movedTask);

    // 4. 计算新的 order 值 (取前后两个任务 order 的中间值)
    let newOrder = 0;
    const prevTask = targetColumnTasks[destination.index - 1];
    const nextTask = targetColumnTasks[destination.index + 1];

    if (!prevTask && !nextTask) {
      // 这一列原来是空的
      newOrder = 1000;
    } else if (!prevTask) {
      // 插到了最前面
      newOrder = (nextTask?.order || 2000) / 2;
    } else if (!nextTask) {
      // 插到了最后面
      newOrder = (prevTask?.order || 0) + 1000;
    } else {
      // 插到了中间
      newOrder = (prevTask.order + nextTask.order) / 2;
    }

    // 更新被移动任务的 order
    movedTask.order = newOrder;

    // 将修改后的任务合并回主数组 (这里为了简单，直接把目标列的任务替换回去，或者重新组合)
    // 更简单的做法：直接把 movedTask 放回 newTasks 数组（注意 newTasks 刚才已经splice掉了它）
    newTasks.push(movedTask);

    // 更新 UI
    setTasks(newTasks);

    // --- 发送请求 ---
    try {
      await moveTask(draggableId, targetUserId, newOrder);
      // toast.success("移动成功"); // 拖拽太频繁不用总是弹窗
    } catch (e) {
      toast.error("移动失败，正在回滚...");
      setTasks(initialTasks); // 失败回滚
    }
  };

  if (!enabled) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col md:flex-row h-full p-4 gap-4 overflow-x-auto select-none">
        {users.map((u: User) => (
          <div key={u.id} className="w-full md:w-80 flex-shrink-0 flex flex-col bg-slate-100/80 rounded-xl border max-h-[80vh] md:max-h-full shadow-sm">
            {/* 列表头部 */}
            <div className="p-3 border-b bg-white rounded-t-xl flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <UserCircle className="w-5 h-5 text-blue-600" />
                <span>{u.name || u.workId}</span>
              </div>
              {/* 只有当前用户可以在自己列新建 */}
              {u.id === currentUserId && (
                <TaskDialog userId={u.id} />
              )}
            </div>

            <Droppable droppableId={u.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 overflow-y-auto p-2 space-y-3 min-h-[150px]"
                >
                  {tasks
                    .filter(t => t.userId === u.id)
                    .sort((a, b) => a.order - b.order) // 必须按 order 排序
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={task.isCompleted}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{ ...provided.draggableProps.style }}
                            className={`${snapshot.isDragging ? "opacity-90 scale-105 z-50" : ""}`}
                          >
                            <div className="relative group">
                              {/* 引用外部组件 */}
                              <TaskCard task={task} />

                              {/* 操作按钮：仅本人可见，悬浮或移动端常驻 */}
                              {task.userId === currentUserId && !task.isCompleted && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded backdrop-blur-sm p-1">
                                  <TaskDialog task={task} isEdit />
                                  <form action={async () => {
                                    // 乐观更新：立刻从列表消失(或变灰)
                                    const newTasks = tasks.map(t => t.id === task.id ? { ...t, isCompleted: true } : t);
                                    setTasks(newTasks);
                                    await completeTask(task.id);
                                    toast.success("任务完成！");
                                  }}>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                  </form>
                                </div>
                              )}
                            </div>
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

// 3. 修改后的弹窗：支持开始时间和时长
function TaskDialog({ userId, task, isEdit }: { userId?: string, task?: Task, isEdit?: boolean }) {
  const [open, setOpen] = useState(false);

  // --- 状态管理 ---
  // 如果是编辑模式，使用原有值；如果是新建，初始为空字符串
  // 注意：toISOString 会有时区问题，这里为了简单演示，
  // 实际项目中建议用 format(new Date(), "yyyy-MM-dd'T'HH:mm") 处理本地时间
  const initialStart = task?.startTime
    ? new Date(task.startTime).toISOString().slice(0, 16)
    : "";

  const [startTime, setStartTime] = useState(initialStart);

  // --- 交互逻辑：点击开始时间输入框时 ---
  const handleStartTimeFocus = () => {
    // 只有当它是空的时候，才自动填入当前时间
    if (!startTime) {
      // 获取当前本地时间，格式化为 datetime-local 需要的格式
      const now = new Date();
      // 处理时区偏移，保证显示的是北京时间/本地时间
      const offset = now.getTimezoneOffset() * 60000;
      const localIso = new Date(now.getTime() - offset).toISOString().slice(0, 16);
      setStartTime(localIso);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-blue-500">
            <Edit2 className="w-4 h-4" />
          </Button>
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
          {/* 如果是新建任务，自动带入 userId */}
          {!isEdit && userId && <input type="hidden" name="userId" value={userId} />}
          <div className="space-y-2">
            <Label>任务内容</Label>
            <Input name="content" required defaultValue={task?.content} placeholder="例如：八部上下线情况排查" />
          </div>

          <div className="space-y-2">
            <Label>执行地点</Label>
            <Input name="location" defaultValue={task?.location} placeholder="例如：智造八部" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始时间</Label>
              {/* 1. 受控组件：value={startTime}
                                2. onFocus：实现“点击即定位到当前时间”
                                3. onChange：允许用户修改
                            */}
              <Input
                name="startTime"
                type="datetime-local"
                value={startTime}
                onFocus={handleStartTimeFocus}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>预计用时 (分钟)</Label>
              {/* 改为 duration */}
              {/* 使用刚才封装的拖拽组件 */}
              <DraggableDuration
                name="duration"
                defaultValue={task?.duration} // 编辑时回显，新建时为 null
                placeholder="点击设置 (默认25)"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">{isEdit ? "保存修改" : "立即发布"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}