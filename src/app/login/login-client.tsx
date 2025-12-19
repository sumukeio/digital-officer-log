"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { login, resetPassword } from "@/app/actions/auth";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { GlobalLoading } from "@/components/GlobalLoading";

// ▼▼▼ 自动登录：检查近期登录记录 ▼▼▼
const RECENT_LOGIN_KEY = "recent_login";
const RECENT_LOGIN_EXPIRY_DAYS = 7; // 7天内登录过，自动登录
const REMEMBER_PASSWORD_KEY = "remember_password"; // 记住密码

export default function LoginClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoLoginLoading, setAutoLoginLoading] = useState(true);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // ▼▼▼ 页面加载时：恢复记住的密码和勾选状态 ▼▼▼
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_PASSWORD_KEY);
    if (remembered) {
      try {
        const data = JSON.parse(remembered);
        setRememberPassword(true);
        // 注意：密码不应该自动填充，只恢复勾选状态
        // 浏览器密码管理器会处理密码填充
      } catch (e) {
        // 忽略解析错误
      }
    }
  }, []);

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
        const workId = formData.get("workId") as string;
        
        // ▼▼▼ 登录成功，保存近期登录记录 ▼▼▼
        localStorage.setItem(RECENT_LOGIN_KEY, JSON.stringify({
          workId,
          timestamp: new Date().toISOString()
        }));

        // ▼▼▼ 如果勾选了记住密码，保存工号（不保存密码，由浏览器管理）▼▼▼
        if (rememberPassword) {
          localStorage.setItem(REMEMBER_PASSWORD_KEY, JSON.stringify({
            workId,
            timestamp: new Date().toISOString()
          }));
        } else {
          localStorage.removeItem(REMEMBER_PASSWORD_KEY);
        }

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

  const handleResetPassword = async (formData: FormData) => {
    setResetLoading(true);
    try {
      const res = await resetPassword(formData);
      if (res.success) {
        toast.success("密码已重置为初始密码 123456，请登录后及时修改");
        setForgotPasswordOpen(false);
        // 清空表单
        const form = document.getElementById("reset-password-form") as HTMLFormElement;
        form?.reset();
      } else {
        toast.error(res.message);
      }
    } catch (e) {
      toast.error("重置失败，请重试");
    } finally {
      setResetLoading(false);
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
    <>
      {/* 登录中全屏加载遮罩 */}
      {loading && <GlobalLoading message="登录中..." />}
      
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

        {/* ▼▼▼ 记住密码和忘记密码 ▼▼▼ */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="remember" 
              checked={rememberPassword}
              onCheckedChange={(checked) => setRememberPassword(checked === true)}
            />
            <Label htmlFor="remember" className="text-slate-600 cursor-pointer font-normal">
              记住密码
            </Label>
          </div>
          <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-normal"
              >
                忘记密码？
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  重置密码
                </DialogTitle>
                <DialogDescription>
                  请输入您的工号和姓名以验证身份，验证通过后密码将重置为初始密码 123456
                </DialogDescription>
              </DialogHeader>
              <form id="reset-password-form" action={handleResetPassword} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-workId">工号</Label>
                  <Input 
                    id="reset-workId" 
                    name="workId" 
                    placeholder="例：2020010" 
                    required 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-name">姓名</Label>
                  <Input 
                    id="reset-name" 
                    name="name" 
                    placeholder="请输入您的姓名" 
                    required 
                    className="h-11"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">⚠️ 安全提示</p>
                  <p className="text-xs">密码将重置为初始密码 <strong>123456</strong>，登录后请立即修改密码。</p>
                </div>
                <Button 
                  type="submit" 
                  disabled={resetLoading}
                  className="w-full h-11"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      验证中...
                    </>
                  ) : (
                    "重置密码"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-lg font-medium transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 mt-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
        </Button>
      </form>
    </>
  );
}