import { getMonthlySubmissionStats } from "@/app/actions/submit-report";
import { getCurrentUser } from "@/app/actions/auth";
import { getAnalyticsData } from "@/app/actions/admin"; 
import DashboardClient from "./dashboard-client";

// 设置 revalidate = 0 确保首页数据总是最新的（避免缓存导致图表不更新）
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const now = new Date();
  
  // 并行请求：日历状态、用户信息、图表数据
  const [submittedDates, user, chartData] = await Promise.all([
    getMonthlySubmissionStats(now.getFullYear(), now.getMonth()),
    getCurrentUser(),
    getAnalyticsData()
  ]);

  return (
    <DashboardClient 
      submittedDates={submittedDates} 
      forceChangePassword={user?.isDefaultPassword || false}
      isAdmin={user?.roles.some(r => r.name === 'admin') || false} 
      chartData={chartData} 
    />
  );
}