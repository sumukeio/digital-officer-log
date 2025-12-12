import { createIssue } from "@/app/actions/issue";
import { getCurrentUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ImagePlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function CreateIssuePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Link href="/knowledge">
                    <Button variant="ghost" size="icon" className="text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="font-bold text-lg text-slate-800">撰写新纪录</h1>
            </div>
            {/* 这里的保存按钮放在表单外很难触发 submit，所以我们在表单里也放一个，或者用 form id 关联 */}
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <form action={createIssue} className="space-y-8">
            
            {/* 1. 标题区域 */}
            <div className="space-y-2">
                <Label className="text-base">标题</Label>
                <Input 
                    name="title" 
                    placeholder="一句话描述遇到的问题，例如：注塑机温度异常波动导致次品" 
                    className="h-14 text-lg bg-white shadow-sm"
                    required 
                    autoFocus
                />
            </div>

            {/* 2. 核心内容区：左右分栏 (在大屏下) 或 上下分栏 (小屏下) */}
            <div className="grid md:grid-cols-2 gap-6">
                
                {/* 左边：问题描述 (红色系) */}
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-red-600 font-bold border-b border-red-100 pb-2">
                            <AlertCircle className="w-5 h-5" />
                            <h2>问题描述 (Problem)</h2>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-slate-500">详细情况</Label>
                            <Textarea 
                                name="problemDesc" 
                                className="min-h-[200px] text-base leading-relaxed bg-slate-50/50 focus:bg-white transition-colors resize-none" 
                                placeholder="请详细描述问题发生的现象、时间、报错代码等..."
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-500 flex items-center justify-between">
                                <span>现场照片/截图</span>
                                <span className="text-xs text-slate-400 font-normal">支持多张</span>
                            </Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-center cursor-pointer relative group">
                                <input 
                                    type="file" 
                                    name="problem_images" 
                                    multiple 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600">
                                    <ImagePlus className="w-8 h-8" />
                                    <span className="text-sm">点击或拖拽上传图片</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 右边：解决方案 (绿色系) */}
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-2 text-green-600 font-bold border-b border-green-100 pb-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <h2>解决方案 (Solution)</h2>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-slate-500">处理步骤</Label>
                            <Textarea 
                                name="solutionDesc" 
                                className="min-h-[200px] text-base leading-relaxed bg-slate-50/50 focus:bg-white transition-colors resize-none" 
                                placeholder="1. 第一步...&#10;2. 第二步...&#10;3. 最终结果..."
                                required 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-500 flex items-center justify-between">
                                <span>修复后照片/截图</span>
                                <span className="text-xs text-slate-400 font-normal">支持多张</span>
                            </Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-center cursor-pointer relative group">
                                <input 
                                    type="file" 
                                    name="solution_images" 
                                    multiple 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600">
                                    <ImagePlus className="w-8 h-8" />
                                    <span className="text-sm">点击或拖拽上传图片</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 底部提交栏 */}
            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full md:w-auto px-8 text-lg h-12 shadow-xl shadow-blue-100">
                    <Save className="w-5 h-5 mr-2" />
                    发布到公共库
                </Button>
            </div>
        </form>
      </main>
    </div>
  );
}