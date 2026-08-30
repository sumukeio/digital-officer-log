"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Send,
  Save,
  Check,
  Settings,
  FileText,
  MessageSquareCode,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { pushWeeklyReportToWecom, saveWecomWebhookConfig } from "@/app/actions/weekly-report";

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plainText: string;
  markdownText: string;
  webhookUrl: string;
  onUpdateWebhookUrl: (url: string) => void;
  onSaveReport: () => Promise<void>;
  isSaving: boolean;
}

export function ReportPreviewModal({
  open,
  onOpenChange,
  plainText,
  markdownText,
  webhookUrl,
  onUpdateWebhookUrl,
  onSaveReport,
  isSaving,
}: ReportPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [webhookEditOpen, setWebhookEditOpen] = useState(false);
  const [tempWebhook, setTempWebhook] = useState(webhookUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      toast.success("周报内容已成功复制到剪贴板！可直接粘贴到微信群");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error("复制失败，请手动全选复制");
    }
  };

  const handlePushWecom = async () => {
    setIsPushing(true);
    try {
      const res = await pushWeeklyReportToWecom({
        markdownContent: markdownText,
        webhookUrl,
      });

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(`推送异常: ${err.message || "未知错误"}`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleSaveWebhook = async () => {
    const res = await saveWecomWebhookConfig(tempWebhook);
    if (res.success) {
      onUpdateWebhookUrl(tempWebhook);
      toast.success("企微 Webhook 地址已保存");
      setWebhookEditOpen(false);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <DialogTitle className="text-base font-bold text-slate-800">
                  周报内容预览与导出
                </DialogTitle>
              </div>

              <div className="flex items-center gap-2 pr-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempWebhook(webhookUrl);
                    setWebhookEditOpen(true);
                  }}
                  className="h-8 text-xs border-slate-300 text-slate-600 hover:text-slate-900"
                >
                  <Settings className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  企微 Webhook 配置
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* 预览视图切换 */}
          <div className="flex-1 overflow-y-auto p-4">
            <Tabs defaultValue="plain" className="w-full">
              <TabsList className="grid grid-cols-2 mb-3 bg-slate-100">
                <TabsTrigger value="plain" className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> 微信群标准文本格式
                </TabsTrigger>
                <TabsTrigger value="markdown" className="text-xs flex items-center gap-1.5">
                  <MessageSquareCode className="w-3.5 h-3.5" /> 企微群机器人 Markdown
                </TabsTrigger>
              </TabsList>

              {/* 微信群纯文本 */}
              <TabsContent value="plain" className="mt-0">
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all max-h-[50vh] overflow-y-auto border border-slate-800 shadow-inner">
                  {plainText || "暂无可生成的周报内容，请先导入数据"}
                </div>
              </TabsContent>

              {/* 企微群 Markdown */}
              <TabsContent value="markdown" className="mt-0">
                <div className="bg-slate-50 rounded-xl p-4 text-xs leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto border border-slate-200 text-slate-800">
                  {markdownText || "暂无可生成的 Markdown 内容"}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 底部操作工具栏 */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              💡 预览无误后可一键复制文本，或按需推送到企业微信群。
            </div>

            <div className="flex items-center gap-2">
              {/* 保存到数据库 */}
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveReport}
                disabled={isSaving}
                className="h-8 text-xs border-slate-300 font-medium"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1 text-slate-600" />
                )}
                保存归档
              </Button>

              {/* 一键复制全文 */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="h-8 text-xs bg-slate-200/80 hover:bg-slate-200 text-slate-800 font-medium"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {copied ? "已复制" : "复制微信全文"}
              </Button>

              {/* 🚀 推送到企业微信群 (需主动点击触发) */}
              <Button
                size="sm"
                onClick={handlePushWecom}
                disabled={isPushing}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
              >
                {isPushing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1" />
                )}
                推送到企业微信群
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Webhook 编辑微调弹窗 */}
      <Dialog open={webhookEditOpen} onOpenChange={setWebhookEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              企业微信群机器人 Webhook 设置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-slate-600">
            <p>
              在企业微信群中点击「群设置」$\rightarrow$「添加群机器人」，复制 Webhook 链接粘贴至下方：
            </p>
            <Input
              value={tempWebhook}
              onChange={(e) => setTempWebhook(e.target.value)}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              className="text-xs h-9"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWebhookEditOpen(false)}
            >
              取消
            </Button>
            <Button size="sm" onClick={handleSaveWebhook}>
              保存配置
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
