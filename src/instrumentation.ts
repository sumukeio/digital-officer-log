export async function register() {
  // 仅在服务端运行时执行，避免构建时执行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import("node-cron");
    const { sendDailyReminder } = await import("@/lib/cron");

    console.log("⏰ 定时任务服务已启动...");

    // 每天 16:45 执行 (秒 分 时 日 月 星期)
    cron.schedule("0 45 16 * * *", async () => {
      console.log("🚀 触发每日定时提醒...");
      await sendDailyReminder();
    }, {
      timezone: "Asia/Shanghai" // 强制北京时间
    });
  }
}