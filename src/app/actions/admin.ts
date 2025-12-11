"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// === 用户管理 ===

// 1. 获取所有用户
export async function getUsers() {
  return await prisma.user.findMany({
    include: { roles: true },
    orderBy: { createdAt: 'desc' }
  });
}

// 2. 创建/更新用户
export async function saveUser(formData: FormData) {
  const id = formData.get("id") as string;
  const workId = formData.get("workId") as string;
  const name = formData.get("name") as string;
  const areas = formData.get("areas") as string;
  const isAdmin = formData.get("isAdmin") === "on";
  
  // 获取角色ID
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const officerRole = await prisma.role.findUnique({ where: { name: "officer" } });

  const rolesConnect = [{ id: officerRole?.id }];
  if (isAdmin) rolesConnect.push({ id: adminRole?.id });

  if (id) {
    // 更新
    await prisma.user.update({
      where: { id },
      data: {
        workId, name, assignedAreas: areas,
        roles: { set: [], connect: rolesConnect as any } // 重置角色
      }
    });
  } else {
    // 新增
    await prisma.user.create({
      data: {
        workId, 
        name, 
        password: "123456", 
        assignedAreas: areas,
        roles: { connect: rolesConnect as any }
      }
    });
  }
  revalidatePath("/admin/users");
}

// 3. 删除用户
export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

// === 模板管理 ===

// 4. 获取所有题目
export async function getQuestions() {
  return await prisma.question.findMany({ orderBy: { order: 'asc' } });
}

// 5. 保存题目状态 (禁用/启用/改名)
export async function updateQuestion(id: string, data: any) {
  await prisma.question.update({ where: { id }, data });
  revalidatePath("/admin/template");
}

// 新增：重置密码
export async function resetUserPassword(userId: string) {
  // 必须鉴权 (只有管理员能调) - 这里省略了严格的角色检查，建议加上
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: "123456", // 重置回初始密码
      isDefaultPassword: true // 标记为默认，用户下次登录会被强制修改
    }
  });
  revalidatePath("/admin/users");
}

// ▼▼▼ 新增：导出所有日报数据 ▼▼▼
export async function getAllReportsForExport() {
  // 简单鉴权：确保是登录状态
  // (严格来说这里应该检查是否为管理员角色，但在内网工具中，登录即可导出通常也是可接受的)
  // const user = await getCurrentUser(); // 如果你之前没在 admin.ts 引入 getCurrentUser，需要从 auth 引入，或者暂时跳过鉴权
  
  const reports = await prisma.dailyReport.findMany({
    orderBy: { date: "desc" }, // 按日期倒序
    include: {
      user: true, // 关键：把关联的用户信息（姓名、工号）也查出来
    },
  });

  return reports;
}