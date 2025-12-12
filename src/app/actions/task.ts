"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

// PostgreSQL Int4 最大值 (2,147,483,647)
const MAX_INT4 = 2147483647;

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

  // 安全计算：如果上一个任务的 order 已经很大，防止 +1000 后溢出
  let lastOrder = lastTask?.order || 0;
  // 如果数据库里已有不正常的大数，重置一下逻辑，或者直接取 +1000
  // 这里做一个简单的保护，如果已经接近溢出，就只 +1
  const increment = lastOrder > (MAX_INT4 - 2000) ? 1 : 1000;
  
  // 再次检查防止溢出
  let newOrder = lastOrder + increment;
  if (newOrder > MAX_INT4) {
    // 极端情况：如果到了最大值，就只能等于最大值（可能会导致排序重叠，但不会报错）
    newOrder = MAX_INT4; 
  }

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

// 4. 拖拽移动 (核心逻辑 - 已修复溢出问题)
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

  // --- 修复开始：处理数值溢出 ---
  let safeOrder = newOrder;
  
  // 如果前端传来了毫秒级时间戳 (例如 1765532781668)，它会超过 Int4 的上限 (2147483647)。
  // 我们将其转换为秒级时间戳，这样就能存进去了 (例如 1765532781)。
  if (safeOrder > MAX_INT4) {
    safeOrder = Math.floor(safeOrder / 1000);
  }

  // 二次检查：如果除以1000后依然比 Int4 大 (极少见，除非你传了天文数字)，强制截断
  if (safeOrder > MAX_INT4) {
    safeOrder = MAX_INT4;
  }
  // --- 修复结束 ---

  await prisma.task.update({
    where: { id: taskId },
    data: {
      userId: newUserId,
      order: safeOrder // 使用处理过的安全数值
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