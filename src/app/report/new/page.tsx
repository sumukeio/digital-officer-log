import { getEnabledQuestions, getCurrentUserConfig } from "@/app/actions/submit-report";
import ReportForm from "./report-form";
import { redirect } from "next/navigation"; 

// 定义 Props 接口以接收 searchParams (URL 参数)
interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export const dynamic = "force-dynamic";

export default async function NewReportPage(props: PageProps) {
  // 1. 获取 URL 参数中的 date
  const searchParams = await props.searchParams;
  const defaultDate = searchParams.date;

  // 2. 获取当前用户
  const user = await getCurrentUserConfig();

  // 3. 核心修复：未登录强制跳转
  if (!user) {
    redirect("/login");
  }

  // 4. 获取题目
  const questions = await getEnabledQuestions();

  // 5. 解析用户负责区域
  const userAreas = user.assignedAreas 
    ? user.assignedAreas.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <ReportForm 
        questions={questions} 
        userAreas={userAreas} 
        defaultDate={defaultDate} // <--- 将日期传给表单组件
      />
    </div>
  );
}