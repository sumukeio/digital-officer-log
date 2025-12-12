"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

// 获取所有任务 (按用户分组)
export async function getBoardData() {
  // 获取所有用户 (作为列)
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, workId: true }
  });

  // 获取所有任务
  const tasks = await prisma.task.findMany({
    orderBy: { order: 'asc' },
    include: { user: true }
  });

  return { users, tasks };
}

// 1. 新建任务
export async function createTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const content = formData.get("content") as string;
  const location = formData.get("location") as string;
  const deadlineStr = formData.get("deadline") as string; // 前端传 ISO String
  
  // 新任务默认排在最后
  const lastTask = await prisma.task.findFirst({
    where: { userId: user.id },
    orderBy: { order: 'desc' }
  });
  const newOrder = (lastTask?.order || 0) + 1000;

  const task = await prisma.task.create({
    data: {
      content,
      location,
      deadline: new Date(deadlineStr),
      userId: user.id,
      order: newOrder
    }
  });

  // 记录日志
  await createLog(task.id, user.id, user.name || user.workId, "CREATE", "新建任务");
  revalidatePath("/tasks");
}

// 2. 修改任务
export async function updateTask(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const content = formData.get("content") as string;
  const location = formData.get("location") as string;
  const deadlineStr = formData.get("deadline") as string;

  await prisma.task.update({
    where: { id },
    data: { content, location, deadline: new Date(deadlineStr) }
  });

  await createLog(id, user.id, user.name || user.workId, "UPDATE", "修改内容/时间");
  revalidatePath("/tasks");
}

// 3. 结束任务
export async function completeTask(taskId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: true }
  });

  await createLog(taskId, user.id, user.name || user.workId, "COMPLETE", "完成任务");
  revalidatePath("/tasks");
}

// 4. 拖拽移动 (核心逻辑)
export async function moveTask(taskId: string, newUserId: string, newOrder: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const isCrossUser = task.userId !== newUserId;
  
  // 权限校验：如果是跨用户移动，必须是管理员
  const isAdmin = currentUser.roles.some(r => r.name === 'admin');
  if (isCrossUser && !isAdmin) {
    throw new Error("只有管理员可以跨区移动任务");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      userId: newUserId,
      order: newOrder
    }
  });

  const detail = isCrossUser ? `跨区移动: 从 ${task.userId} 到 ${newUserId}` : "区内排序";
  await createLog(taskId, currentUser.id, currentUser.name || currentUser.workId, "MOVE", detail);
  
  revalidatePath("/tasks");
}

// 内部工具：写日志
async function createLog(taskId: string, opId: string, opName: string, action: string, details: string) {
  await prisma.taskLog.create({
    data: { taskId, operatorId: opId, operatorName: opName, action, details }
  });
}

// 获取日志列表 (供后台使用)
export async function getTaskLogs() {
  return await prisma.taskLog.findMany({
    include: { task: true },
    orderBy: { createdAt: 'desc' },
    take: 100 // 只看最近100条
  });
}