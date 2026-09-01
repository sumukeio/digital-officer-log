import axios from "axios";
import { prisma } from "@/lib/prisma";

export const DEFAULT_REMINDER_TEMPLATE = `### 🔔 数字官日报提醒

下午好！今天是 {date}。

📊 **今日填报进度：{count} 人已提交**

好官，工作了一天，辛苦啦，该写日报了哦~

[点击跳转工作台]({url})`;

let lastExecutedDateMinute = "";

/**
 * 组装并发送日报催报通知
 */
export async function sendDailyReminder(isTest: boolean = false) {
  try {
    // 1. 读取系统配置
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            "DAILY_REMINDER_ENABLED",
            "DAILY_REMINDER_TEMPLATE",
            "DAILY_REMINDER_WEBHOOK",
            "WECOM_WEBHOOK_URL",
          ],
        },
      },
    });

    const configMap: Record<string, string> = {};
    configs.forEach((c) => (configMap[c.key] = c.value));

    // 如果非测试且已显式关闭
    const isEnabled = configMap["DAILY_REMINDER_ENABLED"] !== "false";
    if (!isTest && !isEnabled) {
      console.log("⏸️ [Cron] 日报定时催报已关闭，跳过执行");
      return { success: true, message: "催报已关闭" };
    }

    const now = new Date();
    // 2. 统计今日填报人数 (上海时区当天 00:00:00 - 23:59:59)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const count = await prisma.dailyReport.count({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    // 3. 模板变量替换
    const template = configMap["DAILY_REMINDER_TEMPLATE"] || DEFAULT_REMINDER_TEMPLATE;
    const dateStr = now.toLocaleDateString("zh-CN");
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://wdfcn.zeabur.app";

    let content = template
      .replace(/\{date\}/g, dateStr)
      .replace(/\{count\}/g, String(count))
      .replace(/\{url\}/g, baseUrl);

    if (isTest) {
      content = `> 🧪 **【测试发送】以下为催报消息预览**\n\n` + content;
    }

    // 4. Webhook 发送
    const webhookUrl =
      configMap["DAILY_REMINDER_WEBHOOK"] ||
      configMap["WECOM_WEBHOOK_URL"] ||
      process.env.WECOM_WEBHOOK_URL ||
      "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=1848bd32-881e-474c-978c-b67556102cbb";

    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      console.warn("⚠️ [Cron] 未配置有效的企业微信 Webhook 地址");
      return { success: false, message: "未配置有效的 Webhook 地址" };
    }

    const payload = {
      msgtype: "markdown",
      markdown: { content },
    };

    const res = await axios.post(webhookUrl, payload, { timeout: 10000 });
    if (res.data?.errcode && res.data.errcode !== 0) {
      console.error("❌ 企微催报推送失败:", res.data);
      return { success: false, message: res.data.errmsg || "企微返回错误" };
    }

    console.log("✅ [Cron] 企微日报催报通知发送成功 (今日已提交:", count, "人)");
    return { success: true, message: "发送成功", count };
  } catch (error: any) {
    console.error("❌ [Cron] 企微日报催报推送异常:", error?.message || error);
    return { success: false, message: error?.message || "发送异常" };
  }
}

/**
 * 分钟级巡检执行器 (支持后台动态修改时间，无需重启服务器)
 */
export async function checkAndRunDailyReminder() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "DAILY_REMINDER_TIME" },
    });

    const targetTime = config?.value || "18:00"; // 默认 18:00
    const [targetH, targetM] = targetTime.split(":").map(Number);

    // 获取当前上海时区的时分与日期
    const now = new Date();
    // 使用上海时区格式化
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const getVal = (type: string) => parts.find((p) => p.type === type)?.value || "";
    const currentH = Number(getVal("hour"));
    const currentM = Number(getVal("minute"));
    const todayStr = `${getVal("year")}-${getVal("month")}-${getVal("day")}`;

    const dateMinuteKey = `${todayStr}_${currentH}:${currentM}`;

    // 如果到达设定时分且本分钟尚未执行过
    if (
      currentH === targetH &&
      currentM === targetM &&
      lastExecutedDateMinute !== dateMinuteKey
    ) {
      lastExecutedDateMinute = dateMinuteKey;
      console.log(`⏰ [Cron] 触发每日 ${targetTime} 日报催报自动任务...`);
      await sendDailyReminder();
    }
  } catch (e) {
    console.error("检查定时催报时间异常:", e);
  }
}

/**
 * 每日转班排班检查 (转班前一天提醒)
 */
export async function sendDailyShiftCheck() {
  try {
    const { runDailyShiftCron } = await import("@/app/actions/shifts");
    await runDailyShiftCron();
  } catch (error) {
    console.error("❌ 企微每日转班检查推送失败:", error);
  }
}