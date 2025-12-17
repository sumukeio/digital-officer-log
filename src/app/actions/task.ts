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

  // ✅ 防重复提交：5 秒内，同一人、同一内容 + 地点 的未完成任务，只保留一条
  const now = new Date();
  const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000);
  const existing = await prisma.task.findFirst({
    where: {
      userId: user.id,
      isCompleted: false,
      content,
      location,
      createdAt: {
        gte: fiveSecondsAgo,
      },
    },
  });

  if (existing) {
    // 已经有一条“几乎同时”创建的同名任务了，认为是误触重复提交，直接返回即可
    return;
  }

  // 查找最后一条任务用于排序 (保持原有逻辑)
  const lastTask = await prisma.task.findFirst({
    where: { userId: user.id, isCompleted: false },
    orderBy: { order: 'desc' }
  });

  const MAX_INT4 = 2147483647; // 补全这个常量定义，防止报错
  let lastOrder = lastTask?.order || 0;
  // 简单防溢出
  const increment = lastOrder > (MAX_INT4 - 2000) ? 1 : 1000;
  let newOrder = lastOrder + increment;
  if (newOrder > MAX_INT4) newOrder = MAX_INT4;

  const task = await prisma.task.create({
    data: {
      content,
      location,
      // ▼▼▼ 修改核心：有值转时间，没值存 null (不再强制默认当前时间) ▼▼▼
      startTime: startTimeStr ? new Date(startTimeStr) : null,
      
      // ▼▼▼ 修改核心：有值转数字，没值存 null (不再强制默认60) ▼▼▼
      duration: durationStr ? parseInt(durationStr) : null,
      
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
      // ▼▼▼ 修改核心：允许清空时间 (设为 null) ▼▼▼
      startTime: startTimeStr ? new Date(startTimeStr) : null,
      
      // ▼▼▼ 修改核心：允许清空时长 (设为 null) ▼▼▼
      duration: durationStr ? parseInt(durationStr) : null
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

// 删除任务（仅本人或管理员）
export async function deleteTask(taskId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return;
  }

  const isOwner = task.userId === user.id;
  const isAdmin = user.roles.some((r) => r.name === "admin");

  if (!isOwner && !isAdmin) {
    throw new Error("Forbidden");
  }

  // 先删除关联的 TaskLog，再删除任务，避免外键约束错误
  await prisma.$transaction([
    prisma.taskLog.deleteMany({ where: { taskId } }),
    prisma.task.delete({ where: { id: taskId } }),
  ]);

  // 删除操作不再记录到 TaskLog（因为任务已被物理删除）
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