import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, FileText, LayoutDashboard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-64 bg-slate-900 text-white p-4">
        <div className="text-xl font-bold mb-8 pl-2">管理员后台</div>
        <nav className="space-y-2">
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <Users className="mr-2 h-4 w-4" /> 人员管理
            </Button>
          </Link>
          <Link href="/admin/template">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800">
              <FileText className="mr-2 h-4 w-4" /> 模板配置
            </Button>
          </Link>
          <Link href="/">
             <Button variant="ghost" className="w-full justify-start text-blue-400 hover:text-blue-300 hover:bg-slate-800">
              <LayoutDashboard className="mr-2 h-4 w-4" /> 返回工作台
            </Button>
          </Link>
        </nav>
      </aside>
      {/* 内容区 */}
      <main className="flex-1 bg-slate-50 p-8">
        {children}
      </main>
    </div>
  );
}