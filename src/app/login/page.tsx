import { login } from "@/app/actions/auth";
import { getSystemConfig } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardHat, ArrowRight } from "lucide-react";
import LoginClient from "./login-client";

export const dynamic = "force-dynamic";

// 1. 服务端获取配置
export default async function LoginPage() {
  const config = await getSystemConfig();
  const appName = config.app_name || "数字官日报系统";
  const appLogo = config.app_logo;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] selection:bg-slate-200">
      
      {/* 顶部装饰 (可选，极简风通常留白) */}
      
      <div className="w-full max-w-[400px] px-6">
        {/* 2. Logo 区域 */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-center mb-6 transition-transform hover:scale-105 duration-300">
            {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
                <HardHat className="w-8 h-8 text-slate-900" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{appName}</h1>
          <p className="text-slate-500 text-sm mt-2">Sign in to your workspace</p>
        </div>

        {/* 3. 登录卡片 (Vercel Style: 无边框，或极细边框，重在排版) */}
        <LoginClient />

        <div className="mt-8 text-center">
           <p className="text-xs text-slate-400">
             © 2025 {appName}. Powered by Factory Hacker.
           </p>
        </div>
      </div>
    </div>
  );
}