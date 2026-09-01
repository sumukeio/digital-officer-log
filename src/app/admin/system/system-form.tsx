"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  saveSystemConfig,
  saveQuickLink,
  deleteQuickLink,
  saveDailyReminderConfig,
  triggerTestReminderAction,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { Plus, Trash2, Link as LinkIcon, UploadCloud, Monitor, Bot, Bell, Clock, Send } from "lucide-react";

interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export default function SystemForm({ config, links }: { config: Record<string, string>, links: QuickLink[] }) {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(config.app_logo || "");

  // 处理文件选择预览
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setLogoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. 品牌设置 (Logo & Name) */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600"/> 品牌设置
            </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
              setLoading(true);
              try {
                await saveSystemConfig(formData);
                toast.success("系统配置已更新");
              } catch(e) {
                toast.error("保存失败");
              } finally {
                setLoading(false);
              }
          }} className="space-y-6">
            
            <div className="space-y-2">
              <Label>系统名称</Label>
              <Input name="app_name" defaultValue={config.app_name} placeholder="例如：数字官工作台" className="max-w-md" />
            </div>

            <div className="space-y-2">
              <Label>系统 Logo</Label>
              <div className="flex items-start gap-6">
                 {/* 预览框 */}
                 <div className="w-24 h-24 border rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden relative shadow-sm">
                    {logoPreview ? (
                        <img src={logoPreview} className="w-16 h-16 object-contain" alt="Logo Preview" />
                    ) : (
                        <span className="text-xs text-slate-400">无Logo</span>
                    )}
                 </div>
                 
                 {/* 上传控件 */}
                 <div className="flex-1 max-w-md space-y-2">
                    <Input 
                        type="file" 
                        name="app_logo_file" 
                        accept="image/png, image/jpeg, image/svg+xml" 
                        className="cursor-pointer file:text-blue-600 file:font-medium"
                        onChange={handleFileChange}
                    />
                    <p className="text-xs text-slate-500">
                        支持 PNG, JPG, SVG 格式。建议尺寸 128x128 像素，透明背景最佳。
                        <br/>上传后会自动替换旧 Logo。
                    </p>
                 </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "保存中..." : "保存系统设置"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. AI Prompt 配置 */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600"/> AI 总结 Prompt 配置
            </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
              setLoading(true);
              try {
                await saveSystemConfig(formData);
                toast.success("AI Prompt 配置已更新");
              } catch(e) {
                toast.error("保存失败");
              } finally {
                setLoading(false);
              }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>系统提示词 (System Prompt)</Label>
              <textarea
                name="ai_summary_prompt"
                defaultValue={config.ai_summary_prompt || "你是一名工厂数字化助手。请根据提供的日报数据生成周报。数据格式为\"题目: 值\"。请忽略\"正常/是\"的项目，重点总结：1. 产出数量的统计与趋势；2. 所有标记为\"异常/否\"的项目；3. 备注中的关键问题。Markdown格式。"}
                placeholder="输入AI总结的系统提示词..."
                rows={6}
                className="w-full px-3 py-2 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">
                这个提示词将用于指导AI如何生成周报总结。你可以根据需要调整提示词的内容和风格。
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "保存中..." : "保存 Prompt 配置"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. 企业微信日报定时催报管理 */}
      <Card className="border-amber-200/80 shadow-xs">
        <CardHeader className="bg-amber-50/40 border-b border-amber-100">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" /> 企业微信日报定时催报管理
            </span>
            <span className="text-xs font-normal text-slate-500">自动定时推送催写日报</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            action={async (formData) => {
              setLoading(true);
              try {
                await saveDailyReminderConfig(formData);
                toast.success("日报催报配置已保存！");
              } catch (e: any) {
                toast.error("保存失败: " + e?.message);
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-5"
          >
            {/* 开关与时间 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-3.5 bg-slate-50 rounded-xl border">
              <div className="flex items-center justify-between pr-4">
                <div>
                  <Label className="text-sm font-bold text-slate-800">启用每日定时催报</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    开启后将在设定时间向企微群推送提醒
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="reminder_enabled"
                  defaultChecked={config.DAILY_REMINDER_ENABLED !== "false"}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-800">每日推送时间 (上海时区)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <Input
                    type="time"
                    name="reminder_time"
                    defaultValue={config.DAILY_REMINDER_TIME || "18:00"}
                    className="max-w-[140px] font-mono text-sm bg-white"
                  />
                  <span className="text-xs text-slate-400">例如: 18:00 下班前催报</span>
                </div>
              </div>
            </div>

            {/* Webhook 专属覆盖地址 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-800">
                企业微信机器人 Webhook 地址 (可选)
              </Label>
              <Input
                name="reminder_webhook"
                defaultValue={config.DAILY_REMINDER_WEBHOOK || ""}
                placeholder="留空则默认使用全局环境变量 WECOM_WEBHOOK_URL"
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-400">
                支持单独为日报提醒指定专属的企业微信群机器人 Webhook 地址。
              </p>
            </div>

            {/* Markdown 文案模板 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-slate-800">
                  推送 Markdown 消息模板
                </Label>
                <div className="flex gap-1.5 text-[11px] text-slate-500">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{date}"} 日期</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{count}"} 填报人数</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{"{url}"} 工作台链接</span>
                </div>
              </div>
              <textarea
                name="reminder_template"
                defaultValue={
                  config.DAILY_REMINDER_TEMPLATE ||
                  `### 🔔 数字官日报提醒\n\n下午好！今天是 {date}。\n\n📊 **今日填报进度：{count} 人已提交**\n\n好官，工作了一天，辛苦啦，该写日报了哦~\n\n[点击跳转工作台]({url})`
                }
                rows={6}
                className="w-full px-3 py-2 border rounded-lg resize-y font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "保存中..." : "保存催报配置"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  toast.info("正在发送测试推送至企业微信群...");
                  try {
                    const res = await triggerTestReminderAction();
                    if (res?.success) {
                      toast.success(`🎉 测试推送成功！今日统计: ${res.count} 人提交`);
                    } else {
                      toast.error("推送失败: " + (res?.message || "未知错误"));
                    }
                  } catch (e: any) {
                    toast.error("测试发送异常: " + e?.message);
                  }
                }}
                className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 text-xs"
              >
                <Send className="w-3.5 h-3.5" /> 立即测试发送到群
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. 快捷链接管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-green-600"/> 底部快捷访问栏
            </CardTitle>
            <AddLinkDialog />
        </CardHeader>
        <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
                {links.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-white rounded border shadow-sm shrink-0">
                                <LinkIcon className="w-4 h-4 text-slate-500"/>
                            </div>
                            <div className="min-w-0">
                                <div className="font-medium text-sm truncate">{link.title}</div>
                                <div className="text-xs text-slate-400 truncate pr-2">{link.url}</div>
                            </div>
                        </div>
                        <form action={async () => {
                            if(confirm(`确定删除 "${link.title}" 吗?`)) { 
                                await deleteQuickLink(link.id); 
                                toast.success("链接已删除"); 
                            }
                        }}>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                        </form>
                    </div>
                ))}
                {links.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed">
                        暂无快捷链接，请点击右上角添加
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 内部组件：新增链接弹窗
function AddLinkDialog() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1"/>添加链接</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>新增快捷链接</DialogTitle></DialogHeader>
                <form action={async (formData) => {
                    await saveQuickLink(formData);
                    setOpen(false);
                    toast.success("快捷链接已添加");
                }} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label>标题</Label>
                        <Input name="title" placeholder="例如：MES系统" required />
                    </div>
                    <div className="space-y-2">
                        <Label>跳转地址 (URL)</Label>
                        <Input name="url" placeholder="https://..." required />
                    </div>
                    <Button type="submit" className="w-full">保存</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}