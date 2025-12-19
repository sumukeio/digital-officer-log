"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Bell, Loader2 } from "lucide-react";
import { getReadmeContent } from "@/app/actions/readme";

export function UpdateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [updateContent, setUpdateContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const hasLoadedRef = useRef(false);

  // 当对话框打开时，从 README.md 读取内容（只加载一次）
  useEffect(() => {
    if (open && !hasLoadedRef.current && !loading) {
      setLoading(true);
      setError(false);
      hasLoadedRef.current = true;
      
      getReadmeContent()
        .then((content) => {
          if (content) {
            setUpdateContent(content);
          } else {
            setError(true);
          }
        })
        .catch(() => {
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, loading]);

  // 当对话框关闭时，可以选择保留内容（缓存）或清空（每次打开都重新加载）
  // 这里选择保留内容，减少不必要的文件读取
  // 如果需要每次打开都重新加载最新内容，可以在对话框关闭时清空 updateContent

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50">
          <Bell className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            更新公告
          </DialogTitle>
          <DialogDescription className="sr-only">查看系统更新公告和历史更新记录</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1 py-4 custom-scrollbar min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">正在加载更新内容...</span>
            </div>
          ) : error || !updateContent ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-500 mb-2">无法加载更新内容</p>
              <p className="text-xs text-slate-400">请稍后重试或联系管理员</p>
            </div>
          ) : (
            <div className="text-sm text-slate-700 space-y-4 leading-relaxed px-3">
              {updateContent.split('\n').map((line, index) => {
                // 处理标题
                if (line.startsWith('## ')) {
                  return (
                    <h3 key={index} className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0">
                      {line.replace('## ', '')}
                    </h3>
                  );
                }
                // 处理二级标题
                if (line.startsWith('### ')) {
                  return (
                    <h4 key={index} className="text-sm font-semibold text-slate-800 mt-3 mb-1">
                      {line.replace('### ', '')}
                    </h4>
                  );
                }
                // 处理列表项
                if (line.trim().match(/^[\d、）]/)) {
                  return (
                    <p key={index} className="text-xs text-slate-600 ml-2">
                      {line.trim()}
                    </p>
                  );
                }
                // 处理空行
                if (line.trim() === '') {
                  return <br key={index} />;
                }
                // 普通文本
                return (
                  <p key={index} className="text-xs text-slate-600">
                    {line}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

