"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await login(formData);
      if (res.success) {
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