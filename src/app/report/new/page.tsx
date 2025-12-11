import { getEnabledQuestions, getCurrentUserConfig } from "@/app/actions/submit-report";
import ReportForm from "./report-form";

// 这是一个 Server Component (默认)
export default async function NewReportPage() {
  // 1. 并行获取题目配置和用户信息
  const [questions, user] = await Promise.all([
    getEnabledQuestions(),
    getCurrentUserConfig()
  ]);

  // 2. 解析用户负责的区域 (逗号分隔字符串 -> 数组)
  const userAreas = user?.assignedAreas 
    ? user.assignedAreas.split(",").map(s => s.trim()) 
    : [];

  // 3. 渲染客户端表单
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <ReportForm questions={questions} userAreas={userAreas} />
    </div>
  );
}