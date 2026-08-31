"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";
import axios from "axios";
import { LastWeekBaseline, DEFAULT_WECOM_WEBHOOK, SaveWeeklyReportInput } from "@/lib/weekly-report/types";

/**
 * 获取企微群机器人 Webhook 地址配置
 */
export async function getWecomWebhookConfig(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "WECOM_WEBHOOK_URL" },
    });
    return config?.value || DEFAULT_WECOM_WEBHOOK;
  } catch (error) {
    console.error("读取 Webhook 配置失败，使用默认配置:", error);
    return DEFAULT_WECOM_WEBHOOK;
  }
}

/**
 * 保存/更新企微群机器人 Webhook 配置
 */
export async function saveWecomWebhookConfig(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const cleanUrl = (webhookUrl || "").trim();
    if (!cleanUrl) {
      return { success: false, message: "Webhook 地址不能为空" };
    }

    await prisma.systemConfig.upsert({
      where: { key: "WECOM_WEBHOOK_URL" },
      update: { value: cleanUrl },
      create: { key: "WECOM_WEBHOOK_URL", value: cleanUrl },
    });

    return { success: true, message: "Webhook 地址已保存" };
  } catch (error: any) {
    console.error("保存 Webhook 配置失败:", error);
    return { success: false, message: error.message || "保存配置失败" };
  }
}

/**
 * 获取上一周期的关键指标基准 (用于自动计算环比)
 */
export async function getLastWeekMetrics(
  year: number,
  weekNumber: number
): Promise<LastWeekBaseline | null> {
  try {
    // 上周的年份与周数计算
    let targetYear = year;
    let targetWeek = weekNumber - 1;
    if (targetWeek <= 0) {
      targetYear = year - 1;
      targetWeek = 52; // 跨年兜底
    }

    // 优先按 (year, weekNumber) 精准查找
    let previousReport = await prisma.weeklyReport.findFirst({
      where: {
        year: targetYear,
        weekNumber: targetWeek,
      },
      orderBy: { createdAt: "desc" },
    });

    // 若无精准周匹配，降级拉取最近一条历史周报
    if (!previousReport) {
      previousReport = await prisma.weeklyReport.findFirst({
        where: {
          OR: [
            { year: { lt: year } },
            { AND: [{ year }, { weekNumber: { lt: weekNumber } }] },
          ],
        },
        orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      });
    }

    if (!previousReport || !previousReport.metrics) {
      return null;
    }

    const parsedMetrics = JSON.parse(previousReport.metrics);
    return {
      productionTotal: parsedMetrics.production?.totalCards,
      qcTotal: parsedMetrics.qc?.totalCards,
      okrTotal: parsedMetrics.okr?.totalCards,
      punchTotal: parsedMetrics.punch?.totalPunches,
      leanTotal: parsedMetrics.lean?.totalCards,
    };
  } catch (error) {
    console.error("拉取上周指标基准失败:", error);
    return null;
  }
}

/**
 * 保存或更新周报记录
 */
export async function saveWeeklyReport(input: SaveWeeklyReportInput) {
  try {
    const user = await getCurrentUser();
    let targetUserId = user?.id;

    // 智能用户关联：如果未显式登录或处于离线模拟账号，自动从数据库寻找/创建管理员
    if (!targetUserId || targetUserId.startsWith("dev-")) {
      try {
        const dbAdmin = await prisma.user.findFirst({
          where: { workId: "admin" },
        });
        if (dbAdmin) {
          targetUserId = dbAdmin.id;
        } else {
          const anyUser = await prisma.user.findFirst();
          if (anyUser) {
            targetUserId = anyUser.id;
          } else {
            const newAdmin = await prisma.user.create({
              data: {
                workId: "admin",
                name: "数字官管理员",
                password: "admin",
                assignedAreas: "智造一部, 智造二部, 智造三部",
              },
            });
            targetUserId = newAdmin.id;
          }
        }
      } catch (dbErr) {
        console.error("查找或创建管理员用户失败:", dbErr);
      }
    }

    if (!targetUserId) {
      return { success: false, message: "请先登录后再保存周报" };
    }

    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    const reportData = {
      title: input.title,
      startDate: start,
      endDate: end,
      year: input.year,
      weekNumber: input.weekNumber,
      metrics: JSON.stringify(input.metrics || {}),
      manualSections: JSON.stringify(input.manualSections || {}),
      activeModules: JSON.stringify(input.activeModules || []),
      content: input.content || "",
      markdownContent: input.markdownContent || "",
      userId: targetUserId,
    };

    let savedReport;

    if (input.id) {
      savedReport = await prisma.weeklyReport.update({
        where: { id: input.id },
        data: reportData,
      });
    } else {
      // 检查当周是否已有周报，若有则更新，否则新建
      const existing = await prisma.weeklyReport.findFirst({
        where: {
          year: input.year,
          weekNumber: input.weekNumber,
        },
      });

      if (existing) {
        savedReport = await prisma.weeklyReport.update({
          where: { id: existing.id },
          data: reportData,
        });
      } else {
        savedReport = await prisma.weeklyReport.create({
          data: reportData,
        });
      }
    }

    revalidatePath("/weekly-summary");
    return { success: true, message: "周报保存成功", report: savedReport };
  } catch (error: any) {
    console.error("保存周报失败:", error);
    return { success: false, message: error.message || "保存周报失败" };
  }
}

/**
 * 获取周报历史列表
 */
export async function getWeeklyReportList(limit: number = 20) {
  try {
    return await prisma.weeklyReport.findMany({
      take: limit,
      orderBy: { startDate: "desc" },
      include: {
        user: { select: { id: true, name: true, workId: true } },
      },
    });
  } catch (error) {
    console.error("获取周报列表失败:", error);
    return [];
  }
}

/**
 * 一键推送周报到企业微信群机器人 Webhook
 */
export async function pushWeeklyReportToWecom(input: {
  reportId?: string;
  markdownContent: string;
  webhookUrl?: string;
}) {
  try {
    const webhookUrl =
      (input.webhookUrl || "").trim() || (await getWecomWebhookConfig());

    if (!webhookUrl) {
      return { success: false, message: "未配置有效的企微群机器人 Webhook 地址" };
    }

    if (!input.markdownContent) {
      return { success: false, message: "周报内容不能为空" };
    }

    const payload = {
      msgtype: "markdown",
      markdown: {
        content: input.markdownContent,
      },
    };

    const response = await axios.post(webhookUrl, payload, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      timeout: 8000,
    });

    if (response.data && response.data.errcode === 0) {
      // 若关联了周报 ID，标记推送状态
      if (input.reportId) {
        try {
          await prisma.weeklyReport.update({
            where: { id: input.reportId },
            data: { isPushedToWecom: true, pushedAt: new Date() },
          });
        } catch (dbErr) {
          console.warn("更新周报推送状态失败:", dbErr);
        }
      }
      return { success: true, message: "已成功推送到企业微信群！" };
    } else {
      return {
        success: false,
        message: `企微返回错误: ${response.data?.errmsg || "未知错误"} (code: ${response.data?.errcode})`,
      };
    }
  } catch (error: any) {
    console.error("推送企微机器人失败:", error);
    return {
      success: false,
      message: error.response?.data?.errmsg || error.message || "网络请求超时或失败",
    };
  }
}
