"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadToMinIO } from "@/lib/minio"; // 引入上传工具

// =========================================================
// 1. 用户管理 (User Management)
// =========================================================

export async function getUsers() {
  return await prisma.user.findMany({
    include: { roles: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function saveUser(formData: FormData) {
  const id = formData.get("id") as string;
  const workId = formData.get("workId") as string;
  const name = formData.get("name") as string;
  const areas = formData.get("areas") as string;
  const isAdmin = formData.get("isAdmin") === "on";
  
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const officerRole = await prisma.role.findUnique({ where: { name: "officer" } });

  const rolesConnect = [{ id: officerRole?.id }];
  if (isAdmin) rolesConnect.push({ id: adminRole?.id });

  if (id) {
    // 编辑
    await prisma.user.update({
      where: { id },
      data: {
        workId, name, assignedAreas: areas,
        roles: { set: [], connect: rolesConnect as any }
      }
    });
  } else {
    // 新增 (默认密码 123456)
    await prisma.user.create({
      data: {
        workId, name, password: "123456", assignedAreas: areas,
        roles: { connect: rolesConnect as any }
      }
    });
  }
  revalidatePath("/admin/users");
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function resetUserPassword(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { password: "123456", isDefaultPassword: true }
  });
  revalidatePath("/admin/users");
}

// =========================================================
// 2. Excel 导出 (Export)
// =========================================================

export async function getAllReportsForExport() {
  const reports = await prisma.dailyReport.findMany({
    orderBy: { date: "desc" },
    include: { user: true },
  });
  return reports;
}

// =========================================================
// 3. 模板管理 (Template Management)
// =========================================================

export async function getQuestions() {
  return await prisma.question.findMany({ orderBy: { order: 'asc' } });
}

export async function saveQuestion(formData: FormData) {
  const id = formData.get("id") as string;
  const label = formData.get("label") as string;
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const options = formData.get("options") as string | null;

  const data: any = { label, type, category };
  if (options) {
    data.options = options;
  }

  if (id) {
    await prisma.question.update({
      where: { id },
      data
    });
  } else {
    const last = await prisma.question.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = (last?.order || 0) + 1;
    await prisma.question.create({
      data: { ...data, order: newOrder, isEnabled: true }
    });
  }
  revalidatePath("/admin/template");
  revalidatePath("/report/new");
}

export async function updateQuestion(id: string, data: any) {
  await prisma.question.update({ where: { id }, data });
  revalidatePath("/admin/template");
  revalidatePath("/report/new");
}

export async function reorderQuestions(newOrderIds: string[]) {
  const updates = newOrderIds.map((id, index) => 
    prisma.question.update({
      where: { id },
      data: { order: index + 1 }
    })
  );
  await prisma.$transaction(updates);
  revalidatePath("/admin/template");
  revalidatePath("/report/new");
}

export async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } });
  revalidatePath("/admin/template");
  revalidatePath("/report/new");
}

// =========================================================
// 4. 数据看板分析 (Data Analytics)
// =========================================================

export async function getAnalyticsData() {
  const questions = await prisma.question.findMany({ where: { isEnabled: true } });
  
  const metricsMap: Record<string, string> = {};
  questions.forEach(q => {
    if (q.label.includes("生产头条开卡")) metricsMap["prod_open"] = q.id;
    if (q.label.includes("QC头条开卡")) metricsMap["qc_open"] = q.id;
    if (q.label.includes("OKR开卡")) metricsMap["okr_open"] = q.id;
    if (q.label.includes("精益提报")) metricsMap["lean_open"] = q.id;
    if (q.label.includes("IPQC点检")) metricsMap["ipqc_open"] = q.id;
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const reports = await prisma.dailyReport.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'asc' }
  });

  const dailyStats: Record<string, any> = {};

  reports.forEach(r => {
    const dateKey = new Date(r.date.getTime() + 8 * 3600 * 1000).toISOString().slice(5, 10);
    
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { date: dateKey, prod: 0, qc: 0, okr: 0, lean: 0, ipqc: 0 };
    }

    try {
      const answers = JSON.parse(r.answers);
      const getVal = (key: string) => {
        const qId = metricsMap[key];
        if (!qId || !answers[qId]) return 0;
        return Number(answers[qId].value) || 0;
      };

      dailyStats[dateKey].prod += getVal("prod_open");
      dailyStats[dateKey].qc += getVal("qc_open");
      dailyStats[dateKey].okr += getVal("okr_open");
      dailyStats[dateKey].lean += getVal("lean_open");
      dailyStats[dateKey].ipqc += getVal("ipqc_open");
    } catch (e) {}
  });

  return Object.values(dailyStats);
}

// =========================================================
// 5. 系统配置 (升级版：支持 Logo 文件上传)
// =========================================================

export async function getSystemConfig() {
  const configs = await prisma.systemConfig.findMany();
  const configMap: Record<string, string> = {};
  configs.forEach(c => configMap[c.key] = c.value);
  return configMap;
}

export async function saveSystemConfig(formData: FormData) {
  const appName = formData.get("app_name") as string;
  const logoFile = formData.get("app_logo_file") as File; // 获取文件

  // 1. 保存名称
  if (appName) {
    await prisma.systemConfig.upsert({
      where: { key: "app_name" },
      update: { value: appName },
      create: { key: "app_name", value: appName }
    });
  }

  // 2. 如果上传了新图片，上传到 MinIO 并保存 URL
  if (logoFile && logoFile.size > 0) {
    try {
      const url = await uploadToMinIO(logoFile, "system"); // 存到 system 文件夹
      await prisma.systemConfig.upsert({
        where: { key: "app_logo" },
        update: { value: url },
        create: { key: "app_logo", value: url }
      });
    } catch (e) {
      console.error("Logo Upload Failed:", e);
      throw new Error("Logo 上传失败");
    }
  }

  revalidatePath("/login");
  revalidatePath("/admin/system");
}

// =========================================================
// 6. 快捷链接管理 (Quick Links)
// =========================================================

export async function getQuickLinks() {
  return await prisma.quickLink.findMany({ orderBy: { order: 'asc' } });
}

export async function saveQuickLink(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;

  if (id) {
    await prisma.quickLink.update({ where: { id }, data: { title, url } });
  } else {
    // 自动放到最后
    const last = await prisma.quickLink.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = (last?.order || 0) + 1;
    await prisma.quickLink.create({ data: { title, url, order: newOrder } });
  }
  revalidatePath("/"); // 刷新首页
  revalidatePath("/admin/system");
}

export async function deleteQuickLink(id: string) {
  await prisma.quickLink.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/system");
}