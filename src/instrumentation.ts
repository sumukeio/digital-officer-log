export async function register() {
  // 确保只在 Node.js 服务端运行时执行 (避免构建时触发)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import("node-cron");
    const { sendDailyReminder } = await import("@/lib/cron");

    console.log("⏰ 定时任务服务已启动 (Zeabur Mode)...");

    // 每天 16:45 执行 (秒 分 时 日 月 星期)
    cron.schedule("0 04 18 * * *", async () => {
      console.log("🚀 触发每日定时提醒...");
      await sendDailyReminder();
    }, {
      timezone: "Asia/Shanghai" // ⚠️ 必须加这个，否则 Zeabur 服务器默认是 UTC 时间 (会变成凌晨00:45发)
    });
  }
}