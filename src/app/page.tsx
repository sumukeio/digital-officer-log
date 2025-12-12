import { getMonthlySubmissionStats } from "@/app/actions/submit-report";
import { getCurrentUser } from "@/app/actions/auth";
import { getAnalyticsData } from "@/app/actions/admin"; 
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation"; 
import { getQuickLinks } from "@/app/actions/admin"; // 引入

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  
  const [submittedDates, chartData, quickLinks] = await Promise.all([
    getMonthlySubmissionStats(now.getFullYear(), now.getMonth()),
    getAnalyticsData(),
    getQuickLinks() // 获取链接
  ]);

  return (
    <DashboardClient 
      submittedDates={submittedDates} 
      // ▼▼▼ 核心修改：直接传整个 user 对象 ▼▼▼
      currentUser={user as any} 
      chartData={chartData} 
      quickLinks={quickLinks}
    />
  );
}