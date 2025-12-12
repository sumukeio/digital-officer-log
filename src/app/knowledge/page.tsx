import { getIssues, createIssue } from "@/app/actions/issue";
import { getCurrentUser } from "@/app/actions/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, User, Image as ImageIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// 这里我们直接写一个简单的 Client Component 混用在页面里，或者拆分
// 为了方便展示，这里写一个 Server Component，包含 Client 交互部分

export default async function KnowledgeBasePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const issues = await getIssues();

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 顶部 */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-4">
                <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5"/></Button></Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">问题与解决方案库</h1>
                    <p className="text-xs text-slate-500">共 {issues.length} 条记录</p>
                </div>
            </div>
        </div>

        <Link href="/knowledge/create">
                <Button className="shadow-lg shadow-blue-100">
                    <Plus className="w-4 h-4 mr-2"/> 新建记录
                </Button>
        </Link>


        {/* 列表区域 */}
        <div className="space-y-4">
            {issues.map((issue:any) => (
                <Card key={issue.id} className="overflow-hidden">
                    {/* 标题栏 */}
                    <div className="bg-slate-100/50 px-6 py-3 border-b flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">{issue.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <User className="w-4 h-4" />
                            <span>{issue.user.name || issue.user.workId}</span>
                            <span>•</span>
                            <span>{issue.createdAt.toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    {/* 内容区域：左右分栏 */}
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-slate-100">
                        {/* 左侧：问题 */}
                        <div className="p-6 space-y-3 bg-red-50/10">
                            <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Problem / 问题描述</div>
                            <p className="text-slate-700 whitespace-pre-wrap">{issue.problemDesc}</p>
                            <ImageGrid jsonStr={issue.problemImages} />
                        </div>

                        {/* 右侧：解决 */}
                        <div className="p-6 space-y-3 bg-green-50/10">
                            <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Solution / 解决方案</div>
                            <p className="text-slate-700 whitespace-pre-wrap">{issue.solutionDesc}</p>
                            <ImageGrid jsonStr={issue.solutionImages} />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

// 图片网格组件
function ImageGrid({ jsonStr }: { jsonStr: string | null }) {
    if (!jsonStr) return null;
    let images: string[] = [];
    try { images = JSON.parse(jsonStr); } catch(e) {}
    if (images.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap mt-2">
            {images.map((img, i) => (
                <a key={i} href={img} target="_blank" className="block w-20 h-20 border rounded-lg overflow-hidden hover:opacity-80">
                    <img src={img} className="w-full h-full object-cover" />
                </a>
            ))}
        </div>
    );
}

// // 新建弹窗 (客户端组件逻辑嵌入)
// function CreateIssueDialog() {
//     return (
//         <Dialog>
//             <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2"/>新建记录</Button></DialogTrigger>
//             <DialogContent className="max-w-2xl">
//                 <DialogHeader><DialogTitle>新建问题与解决记录</DialogTitle></DialogHeader>
//                 <form action={createIssue} className="space-y-4 mt-2">
//                     <div className="space-y-2">
//                         <Label>标题</Label>
//                         <Input name="title" placeholder="简要描述问题..." required />
//                     </div>
                    
//                     <div className="grid md:grid-cols-2 gap-4">
//                         <div className="space-y-2 p-3 bg-red-50 rounded-lg border border-red-100">
//                             <Label className="text-red-700">问题描述</Label>
//                             <Textarea name="problemDesc" className="bg-white" rows={4} required />
//                             <Label className="text-xs text-red-400">问题图片</Label>
//                             <Input type="file" name="problem_images" multiple accept="image/*" className="bg-white" />
//                         </div>
//                         <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-100">
//                             <Label className="text-green-700">解决方案</Label>
//                             <Textarea name="solutionDesc" className="bg-white" rows={4} required />
//                             <Label className="text-xs text-green-400">解决后图片</Label>
//                             <Input type="file" name="solution_images" multiple accept="image/*" className="bg-white" />
//                         </div>
//                     </div>
//                     <Button type="submit" className="w-full">发布到公共库</Button>
//                 </form>
//             </DialogContent>
//         </Dialog>
//     )
// }