import { getMonthlySubmissionStats } from "@/app/actions/submit-report";
import { getCurrentUser } from "@/app/actions/auth";
import { getAnalyticsData } from "@/app/actions/admin"; 
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation"; // 1. 引入跳转函数

// 设置 revalidate = 0 确保首页数据总是最新的
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // ▼▼▼ 2. 核心修复：如果没有登录，直接踢回登录页 ▼▼▼
  if (!user) {
    redirect("/login");
  }
  // ▲▲▲ 核心修复 ▲▲▲

  const now = new Date();
  
  // 并行请求：日历状态、图表数据 (用户信息上面已经拿了)
  const [submittedDates, chartData] = await Promise.all([
    getMonthlySubmissionStats(now.getFullYear(), now.getMonth()),
    getAnalyticsData()
  ]);

  return (
    <DashboardClient 
      submittedDates={submittedDates} 
      forceChangePassword={user.isDefaultPassword} // user 此时肯定存在
      isAdmin={user.roles.some(r => r.name === 'admin')} 
      chartData={chartData} 
    />
  );
}