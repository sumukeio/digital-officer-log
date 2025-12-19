"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ▼▼▼ 自动登录：检查近期登录记录 ▼▼▼
const RECENT_LOGIN_KEY = "recent_login";
const RECENT_LOGIN_EXPIRY_DAYS = 7; // 7天内登录过，自动登录

export default function LoginClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoLoginLoading, setAutoLoginLoading] = useState(true);

  // ▼▼▼ 自动登录逻辑：页面加载时检查 ▼▼▼
  useEffect(() => {
    const tryAutoLogin = async () => {
      try {
        // 1. 检查 localStorage 中是否有近期登录记录
        const recentLoginStr = localStorage.getItem(RECENT_LOGIN_KEY);
        if (!recentLoginStr) {
          setAutoLoginLoading(false);
          return;
        }

        const recentLogin = JSON.parse(recentLoginStr);
        const loginTime = new Date(recentLogin.timestamp);
        const now = new Date();
        const daysDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60 * 24);

        // 2. 如果超过7天，清除记录，需要重新登录
        if (daysDiff > RECENT_LOGIN_EXPIRY_DAYS) {
          localStorage.removeItem(RECENT_LOGIN_KEY);
          setAutoLoginLoading(false);
          return;
        }

        // 3. 尝试自动登录（检查服务端 cookie 是否有效）
        const response = await fetch("/api/check-auth", { 
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            // Cookie 有效，直接跳转
            router.push("/");
            router.refresh();
            return;
          }
        }
        
        // Cookie 已过期，清除记录，显示登录表单
        localStorage.removeItem(RECENT_LOGIN_KEY);
        setAutoLoginLoading(false);
      } catch (error) {
        // 自动登录失败，显示登录表单
        console.error("Auto login failed:", error);
        setAutoLoginLoading(false);
      }
    };

    tryAutoLogin();
  }, [router]);

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await login(formData);
      if (res.success) {
        // ▼▼▼ 登录成功，保存近期登录记录 ▼▼▼
        const workId = formData.get("workId") as string;
        localStorage.setItem(RECENT_LOGIN_KEY, JSON.stringify({
          workId,
          timestamp: new Date().toISOString()
        }));

        toast.success("欢迎回来！");
        router.push("/");
        router.refresh();
      } else {
        toast.error(res.message);
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
      toast.error("登录失败");
    }
  };

  // ▼▼▼ 自动登录中，显示加载状态 ▼▼▼
  if (autoLoginLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">正在自动登录...</p>
      </div>
    );
  }

  return (
    <form action={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workId" className="text-xs font-medium text-slate-500 uppercase tracking-wider ml-1">工号</Label>
        <Input 
            id="workId" 
            name="workId" 
            placeholder="例：2020010" 
            required 
            className="h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-0 transition-all rounded-lg text-base shadow-sm"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-medium text-slate-500 uppercase tracking-wider ml-1">密码</Label>
        <Input 
            id="password" 
            name="password" 
            type="password" 
            required 
            className="h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-0 transition-all rounded-lg text-base shadow-sm"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-lg font-medium transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 mt-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
      </Button>
    </form>
  );
}