"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";
import axios from "axios";
import {
  SaveHeadlineBriefInput,
  HeadlineModule,
  HeadlineModuleKey,
} from "@/lib/headline-brief/types";
import { buildProblemSkeletonFromMetrics } from "@/lib/headline-brief/metrics-skeleton";
import { getWecomWebhookConfig } from "@/app/actions/weekly-report";
import { AllWeeklyMetrics } from "@/lib/weekly-report/types";

async function resolveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  let targetUserId: string | null = user?.id ?? null;

  if (!targetUserId) {
    const admin = await prisma.user.findFirst({
      where: { roles: { some: { name: "admin" } } },
      orderBy: { createdAt: "asc" },
    });
    if (admin) {
      targetUserId = admin.id;
    } else {
      const anyUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      targetUserId = anyUser?.id ?? null;
    }
  }

  return targetUserId;
}

/**
 * 按年周获取头条周简报
 */
export async function getHeadlineBriefByPeriod(year: number, weekNumber: number) {
  try {
    const userId = await resolveUserId();
    if (!userId) return null;

    return await prisma.headlineBrief.findUnique({
      where: {
        userId_year_weekNumber: { userId, year, weekNumber },
      },
    });
  } catch (error) {
    console.error("按周期查询头条周简报失败:", error);
    return null;
  }
}

/**
 * 保存或更新头条周简报（同一用户同一周唯一）
 */
export async function saveHeadlineBrief(input: SaveHeadlineBriefInput) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return { success: false, message: "无法关联用户，请先登录" };
    }

    if (!input.markdownContent?.trim()) {
      return { success: false, message: "简报内容不能为空" };
    }

    const data = {
      title: input.title,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      weekNumber: input.weekNumber,
      year: input.year,
      modules: JSON.stringify(input.modules),
      rawSource: input.rawSource || null,
      markdownContent: input.markdownContent,
    };

    const saved = await prisma.headlineBrief.upsert({
      where: {
        userId_year_weekNumber: {
          userId,
          year: input.year,
          weekNumber: input.weekNumber,
        },
      },
      update: data,
      create: { ...data, userId },
    });

    revalidatePath("/headline-brief");
    return { success: true, message: "头条周简报已保存", id: saved.id };
  } catch (error: any) {
    console.error("保存头条周简报失败:", error);
    return { success: false, message: error.message || "保存失败" };
  }
}

/**
 * 历史列表
 */
export async function getHeadlineBriefList(limit: number = 20) {
  try {
    return await prisma.headlineBrief.findMany({
      take: limit,
      orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      include: {
        user: { select: { id: true, name: true, workId: true } },
      },
    });
  } catch (error) {
    console.error("获取头条周简报列表失败:", error);
    return [];
  }
}

/**
 * 推送到企微群
 */
export async function pushHeadlineBriefToWecom(input: {
  briefId?: string;
  markdownContent: string;
  webhookUrl?: string;
}) {
  try {
    const webhookUrl =
      (input.webhookUrl || "").trim() || (await getWecomWebhookConfig());

    if (!webhookUrl) {
      return { success: false, message: "未配置有效的企微群机器人 Webhook 地址" };
    }
    if (!input.markdownContent?.trim()) {
      return { success: false, message: "简报内容不能为空" };
    }

    const response = await axios.post(
      webhookUrl,
      {
        msgtype: "markdown",
        markdown: { content: input.markdownContent },
      },
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
        timeout: 8000,
      }
    );

    if (response.data && response.data.errcode === 0) {
      if (input.briefId) {
        try {
          await prisma.headlineBrief.update({
            where: { id: input.briefId },
            data: { isPushedToWecom: true, pushedAt: new Date() },
          });
        } catch (dbErr) {
          console.warn("更新简报推送状态失败:", dbErr);
        }
      }
      return { success: true, message: "已成功推送到企业微信群！" };
    }

    return {
      success: false,
      message: `企微返回错误: ${response.data?.errmsg || "未知错误"} (code: ${response.data?.errcode})`,
    };
  } catch (error: any) {
    console.error("推送头条周简报失败:", error);
    return {
      success: false,
      message: error.response?.data?.errmsg || error.message || "网络请求超时或失败",
    };
  }
}

/**
 * 从当周已保存的指标周报生成问题骨架
 */
export async function getProblemSkeletonFromWeeklyReport(
  year: number,
  weekNumber: number,
  moduleKey: HeadlineModuleKey = "production"
): Promise<{ success: boolean; module: HeadlineModule | null; message: string }> {
  try {
    const report = await prisma.weeklyReport.findFirst({
      where: { year, weekNumber },
      orderBy: { updatedAt: "desc" },
    });

    if (!report?.metrics) {
      return {
        success: false,
        module: null,
        message: "当周尚未保存海铭德指标周报，无法生成问题骨架",
      };
    }

    const metrics = JSON.parse(report.metrics) as AllWeeklyMetrics;
    const module = buildProblemSkeletonFromMetrics(metrics, moduleKey);
    if (module.problems.length === 0) {
      return {
        success: false,
        module,
        message: "指标中暂无可提炼的问题骨架",
      };
    }

    return { success: true, module, message: "已从指标周报生成问题骨架" };
  } catch (error: any) {
    console.error("生成问题骨架失败:", error);
    return {
      success: false,
      module: null,
      message: error.message || "生成问题骨架失败",
    };
  }
}
