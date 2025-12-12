"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saveSystemConfig, saveQuickLink, deleteQuickLink } from "@/app/actions/admin";
import { toast } from "sonner";
import { Plus, Trash2, Link as LinkIcon, UploadCloud, Monitor } from "lucide-react";

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

      {/* 2. 快捷链接管理 */}
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