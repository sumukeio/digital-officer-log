"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  if (id) {
    await prisma.question.update({
      where: { id },
      data: { label, type, category }
    });
  } else {
    const last = await prisma.question.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = (last?.order || 0) + 1;
    await prisma.question.create({
      data: { label, type, category, order: newOrder, isEnabled: true }
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
  // 1. 获取所有已启用题目
  const questions = await prisma.question.findMany({ where: { isEnabled: true } });
  
  // 2. 建立 "关键词 -> 题目ID" 映射
  // 这样无论题目ID怎么变，只要标题包含关键词就能识别
  const metricsMap: Record<string, string> = {};
  questions.forEach(q => {
    if (q.label.includes("生产头条开卡")) metricsMap["prod_open"] = q.id;
    if (q.label.includes("QC头条开卡")) metricsMap["qc_open"] = q.id;
    if (q.label.includes("OKR开卡")) metricsMap["okr_open"] = q.id;
    if (q.label.includes("精益提报")) metricsMap["lean_open"] = q.id;
    if (q.label.includes("IPQC点检")) metricsMap["ipqc_open"] = q.id;
  });

  // 3. 获取最近 30 天的数据
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const reports = await prisma.dailyReport.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'asc' }
  });

  // 4. 按日期聚合数据
  const dailyStats: Record<string, any> = {};

  reports.forEach(r => {
    // 简单时区处理，取 MM-DD
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

      // 累加（防止同一天有多人提交，需要sum）
      dailyStats[dateKey].prod += getVal("prod_open");
      dailyStats[dateKey].qc += getVal("qc_open");
      dailyStats[dateKey].okr += getVal("okr_open");
      dailyStats[dateKey].lean += getVal("lean_open");
      dailyStats[dateKey].ipqc += getVal("ipqc_open");
    } catch (e) {}
  });

  return Object.values(dailyStats);
}