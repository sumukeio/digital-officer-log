import axios from "axios";
import { prisma } from "@/lib/prisma";

// 企微 Webhook 地址
const WECHAT_WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=b2e2f4b8-fed7-41f0-adea-e4a64b2fc73e";

export async function sendDailyReminder() {
  try {
    // 1. 获取今天的日期范围 (北京时间)
    const now = new Date();
    // UTC 0点 (北京 8点) -> UTC 15点 (北京 23点)
    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), -8, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 15, 59, 59));

    // 2. 统计今日提交人数
    const count = await prisma.dailyReport.count({
      where: {
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    // 3. 构造消息
    const message = {
      msgtype: "markdown",
      markdown: {
        content: `### 🔔 数字官日报提醒\n\n下午好！今天是 ${now.toLocaleDateString('zh-CN')}。\n\n📊 **今日填报进度：${count} 人已提交**\n\n请各位数字官记得在下班前完成今日工作记录填写。\n\n[点击跳转工作台](https://wdfcn.zeabur.app/)`
      }
    };

    // 4. 发送
    await axios.post(WECHAT_WEBHOOK_URL, message);
    console.log("✅ 企微消息推送成功");

  } catch (error) {
    console.error("❌ 企微消息推送失败:", error);
  }
}