"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

const MAX_INT4 = 2147483647;

// ==========================================
// 1. 数据查询类 (Board, History, Logs)
// ==========================================

// 获取看板数据 (只展示未完成的任务)
export async function getBoardData() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, workId: true }
  });

  const tasks = await prisma.task.findMany({
    where: {
      isCompleted: false // 只查没做完的
    },
    orderBy: { order: 'asc' },
    include: { user: true }
  });

  return { users, tasks };
}

// ✅ 补回：获取历史任务 (已完成的任务)
export async function getHistoryTasks() {
  return await prisma.task.findMany({
    where: { isCompleted: true },
    orderBy: { updatedAt: 'desc' }, // 按完成时间倒序
    include: { user: true },
    take: 100 // 限制显示最近100条
  });
}

// ✅ 补回：获取操作日志
export async function getTaskLogs() {
  return await prisma.taskLog.findMany({
    include: { task: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

// ==========================================
// 2. 操作执行类 (Create, Update, Move, Complete)
// ==========================================

// 新建任务
export async function createTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const content = formData.get("content") as string;
  const location = formData.get("location") as string;
  const startTimeStr = formData.get("startTime") as string; 
  const durationStr = formData.get("duration") as string;   
  
  // 查找最后一条任务用于排序
  const lastTask = await prisma.task.findFirst({
    where: { userId: user.id, isCompleted: false },
    orderBy: { order: 'desc' }
  });

  let lastOrder = lastTask?.order || 0;
  // 简单防溢出
  const increment = lastOrder > (MAX_INT4 - 2000) ? 1 : 1000;
  let newOrder = lastOrder + increment;
  if (newOrder > MAX_INT4) newOrder = MAX_INT4;

  const task = await prisma.task.create({
    data: {
      content,
      location,
      startTime: new Date(startTimeStr || new Date()), // 默认当前时间
      duration: parseInt(durationStr) || 60,           // 默认60分钟
      userId: user.id,
      order: newOrder,
      isCompleted: false
    }
  });

  await createLog(task.id, user.id, user.name || user.workId, "CREATE", "新建任务");
  revalidatePath("/tasks");
}

// 修改任务
export async function updateTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const content = formData.get("content") as string;
  const location = formData.get("location") as string;
  const startTimeStr = formData.get("startTime") as string;
  const durationStr = formData.get("duration") as string;

  await prisma.task.update({
    where: { id },
    data: { 
      content, 
      location, 
      startTime: new Date(startTimeStr),
      duration: parseInt(durationStr) || 60
    }
  });

  await createLog(id, user.id, user.name || user.workId, "UPDATE", "修改任务详情");
  revalidatePath("/tasks");
}

// 拖拽移动
export async function moveTask(taskId: string, newUserId: string, newOrder: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const isCrossUser = task.userId !== newUserId;
  // const isAdmin = currentUser.roles.some(r => r.name === 'admin'); 

  // --- 防溢出逻辑 ---
  let safeOrder = newOrder;
  if (safeOrder > MAX_INT4) {
    safeOrder = Math.floor(safeOrder / 1000); 
  }
  if (safeOrder > MAX_INT4) safeOrder = MAX_INT4;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      userId: newUserId,
      order: safeOrder
    }
  });

  const detail = isCrossUser ? `跨区移动: 从 ${task.userId} 到 ${newUserId}` : "区内排序";
  await createLog(taskId, currentUser.id, currentUser.name || currentUser.workId, "MOVE", detail);
  
  revalidatePath("/tasks");
}

// 完成任务
export async function completeTask(taskId: string) {
    const user = await getCurrentUser();
    if (!user) return;
    
    await prisma.task.update({
        where: { id: taskId },
        data: { isCompleted: true }
    });
    
    await createLog(taskId, user.id, user.name || user.workId, "COMPLETE", "完成任务");
    
    // 关键：同时刷新看板和历史页面的缓存
    revalidatePath("/tasks");
    revalidatePath("/tasks/history"); 
}

// ==========================================
// 3. 内部辅助函数
// ==========================================

async function createLog(taskId: string, opId: string, opName: string, action: string, details: string) {
  await prisma.taskLog.create({
    data: { taskId, operatorId: opId, operatorName: opName, action, details }
  });
}