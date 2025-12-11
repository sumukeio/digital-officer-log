"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. 登录
export async function login(formData: FormData) {
  const workId = formData.get("workId") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { workId } });

  if (!user || user.password !== password) {
    return { success: false, message: "工号或密码错误" };
  }

  (await cookies()).set("userId", user.id, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7 
  });

  return { success: true, message: "登录成功" };
}

// 2. 登出
export async function logout() {
  // ▼▼▼ 修复：cookies() 需要 await ▼▼▼
  (await cookies()).delete("userId");
  redirect("/login");
}

// 3. 修改密码 (逻辑升级：修改后将 isDefaultPassword 设为 false)
export async function changePassword(prevState: any, formData: FormData) {
  const oldPassword = formData.get("oldPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  // 简单校验
  if (newPassword.length < 6) return { success: false, message: "新密码至少6位" };
  if (newPassword === "123456") return { success: false, message: "不能使用初始密码" };

  const user = await getCurrentUser();
  if (!user) return { success: false, message: "未登录" };

  if (user.password !== oldPassword) {
    return { success: false, message: "旧密码错误" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: newPassword,
      isDefaultPassword: false // ✅ 标记为已修改
    }
  });

  return { success: true, message: "密码修改成功" };
}

// 4. 获取当前登录用户
export async function getCurrentUser() {
  // ▼▼▼ 修复：cookies() 需要 await ▼▼▼
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true }
  });
  
  return user;
}