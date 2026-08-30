"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadToMinIO } from "@/lib/minio"; // 引入上传工具

// =========================================================
// 1. 用户管理 (User Management)
// =========================================================

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      include: { roles: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("读取用户列表失败，回退为空列表:", error);
    return [];
  }
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
  try {
    const reports = await prisma.dailyReport.findMany({
      orderBy: { date: "desc" },
      include: { user: true },
    });
    return reports;
  } catch (error) {
    console.error("导出日报数据失败:", error);
    return [];
  }
}

// =========================================================
// 3. 模板管理 (Template Management)
// =========================================================

export async function getQuestions() {
  try {
    return await prisma.question.findMany({ orderBy: { order: 'asc' } });
  } catch (error) {
    console.error("读取问卷题目失败:", error);
    return [];
  }
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
  try {
    const questions = await prisma.question.findMany({ where: { isEnabled: true } });
    
    const metricsMap: Record<string, string> = {};
    questions.forEach(q => {
      if (q.label.includes("生产头条开卡")) metricsMap["prod_open"] = q.id;
      if (q.label.includes("QC头条开卡")) metricsMap["qc_open"] = q.id;
      if (q.label.includes("OKR开卡")) metricsMap["okr_open"] = q.id;
      if (q.label.includes("精益提报")) metricsMap["lean_open"] = q.id;
      if (q.label.includes("IPQC点检")) metricsMap["ipqc_open"] = q.id;
    });

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: { gte: sevenDaysAgo }
      },
      orderBy: { date: 'asc' }
    });

    const dailyStats: Record<string, any> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dailyStats[dateStr] = {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        prod: 0, qc: 0, okr: 0, lean: 0, ipqc: 0
      };
    }

    reports.forEach(report => {
      const dateKey = report.date.toISOString().split("T")[0];
      if (!dailyStats[dateKey]) return;

      try {
        const answersObj = JSON.parse(report.answers || "{}");
        const getVal = (metricKey: string) => {
          const qId = metricsMap[metricKey];
          if (!qId || !answersObj[qId]) return 0;
          return Number(answersObj[qId].value) || 0;
        };

        dailyStats[dateKey].prod += getVal("prod_open");
        dailyStats[dateKey].qc += getVal("qc_open");
        dailyStats[dateKey].okr += getVal("okr_open");
        dailyStats[dateKey].lean += getVal("lean_open");
        dailyStats[dateKey].ipqc += getVal("ipqc_open");
      } catch (e) {}
    });

    return Object.values(dailyStats);
  } catch (error) {
    console.error("读取看板分析数据失败:", error);
    return [];
  }
}

// =========================================================
// 5. 系统配置 (升级版：支持 Logo 文件上传)
// =========================================================

export async function getSystemConfig() {
  try {
    const configs = await prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    configs.forEach(c => configMap[c.key] = c.value);
    return configMap;
  } catch (error) {
    console.error("读取系统配置失败，使用默认配置回退:", error);
    return {
      app_name: "数字官工作台",
    };
  }
}

export async function saveSystemConfig(formData: FormData) {
  const appName = formData.get("app_name") as string;
  const logoFile = formData.get("app_logo_file") as File; // 获取文件
  const aiPrompt = formData.get("ai_summary_prompt") as string;

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

  // 3. 保存 AI Prompt 配置
  if (aiPrompt !== null) {
    await prisma.systemConfig.upsert({
      where: { key: "ai_summary_prompt" },
      update: { value: aiPrompt },
      create: { key: "ai_summary_prompt", value: aiPrompt }
    });
  }

  revalidatePath("/login");
  revalidatePath("/admin/system");
}

// =========================================================
// 6. 快捷链接管理 (Quick Links)
// =========================================================

export async function getQuickLinks() {
  try {
    return await prisma.quickLink.findMany({ orderBy: { order: 'asc' } });
  } catch (error) {
    console.error("读取快捷链接失败，回退为空列表:", error);
    return [];
  }
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