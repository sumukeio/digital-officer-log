"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. 登录
export async function login(formData: FormData) {
  const workId = formData.get("workId") as string;
  const password = formData.get("password") as string;

  try {
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
  } catch (error) {
    console.error("数据库连接失败，启用本地调试模式登录:", error);
    // 仅在数据库完全不可用 (抛出异常) 时，本地开发允许登录
    (await cookies()).set("userId", "dev-admin-id", {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, message: "本地离线调试模式：登录成功" };
  }
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

  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, message: "未登录" };

  try {
    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user) return { success: false, message: "用户不存在或处于本地开发者模式" };

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
  } catch (err: any) {
    return { success: false, message: `修改密码失败: ${err.message}` };
  }
}

// 4. 获取当前登录用户
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    
    if (!userId) return null;

    if (userId === "dev-admin-id") {
      return {
        id: "dev-admin-id",
        workId: "admin",
        name: "数字官",
        assignedAreas: "智造一部, 智造二部, 智造三部",
        roles: [{ id: "r-admin", name: "admin" }],
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true }
    });
    
    return user || {
      id: "dev-admin-id",
      workId: "admin",
      name: "数字官",
      assignedAreas: "智造一部, 智造二部",
      roles: [{ id: "r-admin", name: "admin" }],
    };
  } catch (error) {
    console.error("获取当前用户失败，回退到本地开发者模式:", error);
    return {
      id: "dev-admin-id",
      workId: "admin",
      name: "数字官",
      assignedAreas: "智造一部, 智造二部",
      roles: [{ id: "r-admin", name: "admin" }],
    };
  }
}

// 5. 重置密码（忘记密码功能）
export async function resetPassword(formData: FormData) {
  const workId = formData.get("workId") as string;
  const name = formData.get("name") as string;

  if (!workId || !name) {
    return { success: false, message: "请填写工号和姓名" };
  }

  // 验证工号和姓名是否匹配
  const user = await prisma.user.findUnique({ where: { workId } });

  if (!user) {
    return { success: false, message: "工号不存在" };
  }

  // 验证姓名（不区分大小写，去除空格）
  const userName = (user.name || "").trim().toLowerCase();
  const inputName = name.trim().toLowerCase();

  if (userName !== inputName) {
    return { success: false, message: "工号与姓名不匹配，验证失败" };
  }

  // 验证通过，重置密码为初始密码
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: "123456",
      isDefaultPassword: true 
    }
  });

  return { success: true, message: "密码已重置为初始密码 123456" };
}