import { getQuestions } from "@/app/actions/admin";
import TemplateList from "./template-list";

export const dynamic = 'force-dynamic'; // 确保每次进入页面都重新获取最新数据，不缓存


export default async function TemplatePage() {
  // 1. 在服务端获取所有题目
  const questions = await getQuestions();

  return (
    <div className="space-y-6">
      {/* 2. 将数据传递给支持拖拽的客户端组件 */}
      {/* 使用 as any[] 是为了规避 Prisma Date 类型序列化可能带来的类型推断差异，
          TemplateList 内部只使用了 id, label, type, category, isEnabled, order */}
      <TemplateList initialQuestions={questions as any[]} />
    </div>
  );
}