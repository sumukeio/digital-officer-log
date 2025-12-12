import axios from "axios";
import { prisma } from "@/lib/prisma";

// 建议把这个 URL 放到环境变量里，不要硬编码
const WECHAT_WEBHOOK_URL = process.env.WECOM_WEBHOOK_URL || "你的中文地址";

export async function sendDailyReminder() {
  try {
    const now = new Date();
    // 获取当天 0点到16点(下班前)的数据
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const count = await prisma.dailyReport.count({
      where: {
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    const message = {
      msgtype: "markdown",
      markdown: {
        content: `### 🔔 数字官日报提醒\n\n下午好！今天是 ${now.toLocaleDateString('zh-CN')}。\n\n📊 **今日填报进度：${count} 人已提交**\n\n好官，工作了一天，辛苦啦，该写日报了哦~\n\n[点击跳转工作台](https://wdfcn.zeabur.app/)`
      }
    };

    await axios.post(WECHAT_WEBHOOK_URL, message);
    console.log("✅ 企微消息推送成功");

  } catch (error) {
    console.error("❌ 企微消息推送失败:", error);
  }
}