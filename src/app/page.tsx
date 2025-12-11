import { getMonthlySubmissionStats } from "@/app/actions/submit-report";
import { getCurrentUser } from "@/app/actions/auth"; // 引入
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const now = new Date();
  const submittedDates = await getMonthlySubmissionStats(now.getFullYear(), now.getMonth());
  const user = await getCurrentUser(); // 获取用户信息

  return (
    <DashboardClient 
      submittedDates={submittedDates} 
      // 传入是否需要强制改密
      forceChangePassword={user?.isDefaultPassword || false} 
    />
  );
}