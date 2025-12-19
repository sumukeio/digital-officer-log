"use client";

import { Loader2 } from "lucide-react";

interface GlobalLoadingProps {
  message?: string;
}

/**
 * 全局加载遮罩组件
 * 用于显示全屏加载状态（如登录中、提交中等）
 */
export function GlobalLoading({ message = "加载中..." }: GlobalLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-700">{message}</p>
      </div>
    </div>
  );
}


