import { getMonthlySubmissionStats } from "@/app/actions/submit-report";
import { getCurrentUser } from "@/app/actions/auth";
import { getAnalyticsData } from "@/app/actions/admin"; 
import DashboardClient from "./dashboard-client";
import { redirect } from "next/navigation"; 
import { getQuickLinks } from "@/app/actions/admin"; // 引入

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // 本地开发或数据库未连通时的优雅回退体验
  const currentUser = user || {
    id: "dev-admin-id",
    workId: "admin",
    name: "数字官",
    assignedAreas: "智造一部, 智造二部, 智造三部",
    roles: [{ id: "r-admin", name: "admin" }],
  };

  const now = new Date();
  
  const [submittedDates, chartData, quickLinks] = await Promise.all([
    getMonthlySubmissionStats(now.getFullYear(), now.getMonth()).catch(() => []),
    getAnalyticsData().catch(() => []),
    getQuickLinks().catch(() => [])
  ]);

  return (
    <DashboardClient 
      submittedDates={submittedDates || []} 
      currentUser={currentUser as any} 
      chartData={chartData || []} 
      quickLinks={quickLinks || []}
    />
  );
}