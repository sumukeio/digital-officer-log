import { getEnabledQuestions, getCurrentUserConfig } from "@/app/actions/submit-report";
import ReportForm from "./report-form";
import { redirect } from "next/navigation"; // 引入跳转

export default async function NewReportPage() {
  // 1. 获取当前用户
  const user = await getCurrentUserConfig();

  // ▼▼▼ 2. 核心修复：未登录强制跳转 ▼▼▼
  if (!user) {
    redirect("/login");
  }

  // 3. 获取题目
  const questions = await getEnabledQuestions();

  // 4. 解析用户负责区域 (字符串转数组)
  const userAreas = user.assignedAreas 
    ? user.assignedAreas.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <ReportForm questions={questions} userAreas={userAreas} />
    </div>
  );
}