export async function register() {
  // 确保只在 Node.js 服务端运行时执行 (避免构建时触发)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import("node-cron");
    const { checkAndRunDailyReminder, sendDailyShiftCheck } = await import("@/lib/cron");

    console.log("⏰ 定时任务服务已启动 (Zeabur / Docker Mode)...");

    // 1. 每天 08:00 (上海时区) 执行每日转班排班检查 (提前1天强预警)
    cron.schedule("0 0 8 * * *", async () => {
      console.log("🚀 触发每日 08:00 转班排班检查...");
      await sendDailyShiftCheck();
    }, {
      timezone: "Asia/Shanghai"
    });

    // 2. 每分钟巡检一次是否到达后台设定的日报催报时分 (支持后台动态改时间/开关，无需重启服务)
    cron.schedule("* * * * *", async () => {
      await checkAndRunDailyReminder();
    }, {
      timezone: "Asia/Shanghai"
    });
  }
}