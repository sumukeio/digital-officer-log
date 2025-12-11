import { sendDailyReminder } from "@/lib/cron";
import { NextResponse } from "next/server";

export async function GET() {
  // 可以在这里加一个简单的鉴权，防止被人恶意刷
  await sendDailyReminder();
  return NextResponse.json({ ok: true });
}