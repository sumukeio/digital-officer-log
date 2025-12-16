"use client";

import { createDailyReport } from "@/app/actions/submit-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState, ChangeEvent, useActionState, useRef, DragEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, RotateCcw, XCircle, Loader2, UploadCloud } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils"; // 假设你有 utils，如果没有可以直接写 class 字符串

// 定义题目类型 (对应数据库)
type Question = {
  id: string;
  label: string;
  type: string;
  category: string;
};

interface ReportFormProps {
  questions: Question[];
  userAreas: string[]; // 用户可选的区域列表
  defaultDate?: string;
}

export default function ReportForm({ questions, userAreas, defaultDate }: ReportFormProps) {
  const router = useRouter();
  const [formDataState, setFormDataState] = useState<Record<string, any>>({});
  const [mounted, setMounted] = useState(false);

  // 使用 React 19 的 useActionState 处理服务端 Action
  const [formState, formAction] = useActionState(createDailyReport, null);

  // 1. 初始化 & 缓存读取
  useEffect(() => {
    const saved = localStorage.getItem("daily_report_cache");
    if (saved) {
      try {
        setFormDataState(JSON.parse(saved));
        toast.info("已恢复上次未提交的内容");
      } catch (e) { }
    }
    setMounted(true);
  }, []);

  // 2. 自动缓存 (仅缓存文本和开关状态，图片无法缓存)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("daily_report_cache", JSON.stringify(formDataState));
    }
  }, [formDataState, mounted]);

  // 3. 处理提交结果
  useEffect(() => {
    if (formState?.success) {
      toast.success(formState.message);
      // 提交成功清除缓存
      localStorage.removeItem("daily_report_cache");
      router.push("/");
    } else if (formState?.success === false) {
      toast.error(formState.message);
    }
  }, [formState, router]);

  const handleValueChange = (key: string, value: any) => {
    setFormDataState(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (confirm("确定清空所有内容吗？此操作无法撤销。")) {
      setFormDataState({});
      localStorage.removeItem("daily_report_cache");
      window.location.reload();
    }
  };

  // 按分类对题目进行分组
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  if (!mounted) return <div className="p-10 text-center text-slate-500">正在加载表单资源...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* 顶部固定栏 */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-50 z-10 py-2 border-b border-slate-200/50 backdrop-blur-sm shadow-sm px-1">
        <h1 className="text-2xl font-bold text-slate-800">填写今日日报</h1>
        <div className="space-x-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleReset} className="text-slate-500 hover:text-red-600">
            <RotateCcw className="w-4 h-4 mr-1" /> 重置
          </Button>
          <Button variant="outline" type="button" onClick={() => router.back()}>取消</Button>
        </div>
      </div>

      {/* 传递日期参数给 Server Action (如果有) */}
      <form action={formAction} className="space-y-6 px-1">
        {defaultDate && <input type="hidden" name="date" value={defaultDate} />}

        {/* 区域选择 */}
        <Card>
          <CardHeader><CardTitle>基础信息</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>今日负责区域 <span className="text-red-500">*</span></Label>
              {/* 隐藏 Input 用于传递给 Server Action */}
              <input type="hidden" name="area" value={formDataState["area"] || ""} />
              <Select onValueChange={(val) => handleValueChange("area", val)} value={formDataState["area"]}>
                <SelectTrigger><SelectValue placeholder="请选择负责区域" /></SelectTrigger>
                <SelectContent>
                  {userAreas.map(area => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 动态渲染题目卡片 */}
        {Object.entries(groupedQuestions).map(([category, qs]) => (
          <Card key={category}>
            <CardHeader><CardTitle className="text-blue-700">{category}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {qs.map(q => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  state={formDataState}
                  onChange={handleValueChange}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        {/* 总结部分 (独立) */}
        <Card>
          <CardHeader><CardTitle>四、今日总结</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-base font-medium">今天还做了什么？可以总结在这里。</Label>
              <Textarea
                name="summary"
                placeholder="自由填写工作总结、心得或建议..."
                className="min-h-[120px]"
                value={formDataState["summary"] || ""}
                onChange={(e) => handleValueChange("summary", e.target.value)}
              />
              {/* 总结也支持图片上传 */}
              <ImageUploader id="summary" />
            </div>
          </CardContent>
        </Card>

        <SubmitButton />
      </form>
    </div>
  );
}

// === 提交按钮组件 (提取出来使用 useFormStatus) ===
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full py-6 text-lg shadow-lg shadow-blue-100" disabled={pending}>
      {pending ? (
        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 正在提交...</>
      ) : (
        "提交今日日报"
      )}
    </Button>
  );
}

// === 单个题目组件 ===
function QuestionItem({ question, state, onChange }: { question: Question, state: any, onChange: any }) {
  const { id, label, type } = question;
  const val = state[id];
  const remarkVal = state[`${id}_remark`] || "";

  return (
    <div className="border-b pb-6 last:border-0 last:pb-0">
      <div className="flex flex-col gap-3">
        {/* 标题与核心输入控件 */}
        <div className="flex items-start justify-between gap-4">
          <Label htmlFor={id} className="text-base leading-6 flex-1 pt-2 text-slate-700">{label}</Label>
          <div className="w-32 shrink-0 flex justify-end">
            {type === 'number' ? (
              <Input
                id={id} name={id} type="number" min={0} placeholder="0"
                className="text-right font-mono text-lg"
                value={val ?? ""}
                onChange={(e) => onChange(id, e.target.value)}
              />
            ) : type === 'boolean' ? (
              <div className="pt-1">
                <input type="hidden" name={id} value={val === true ? "on" : "off"} />
                <Switch id={id} checked={val === true} onCheckedChange={(checked) => onChange(id, checked)} />
              </div>
            ) : (
              <Input id={id} name={id} placeholder="文本" value={val ?? ""} onChange={(e) => onChange(id, e.target.value)} />
            )}
          </div>
        </div>

        {/* 扩展区域：图片上传 + 备注 */}
        <div className="space-y-3 pl-1">
          <ImageUploader id={id} />

          <Input
            name={`${id}_remark`}
            placeholder="备注 (选填)..."
            className="text-sm bg-slate-50/50 border-slate-200"
            value={remarkVal}
            onChange={(e) => onChange(`${id}_remark`, e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

// === 图片上传组件 (增强版：支持粘贴、拖拽、点击) ===
function ImageUploader({ id }: { id: string }) {
  const inputId = `${id}_images`;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false); // 拖拽高亮状态

  // 统一处理文件添加 (过滤非图片)
  const handleFiles = (files: FileList | File[]) => {
    const newFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newFiles.push(file);
      } else {
        toast.warning(`忽略非图片文件: ${file.name}`);
      }
    });

    if (newFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...newFiles]);
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  // 1. 点击选择
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ''; // 清空以允许重复选择
    }
  };

  // 2. 粘贴图片 (Ctrl+V)
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFiles(e.clipboardData.files);
      toast.info("已粘贴图片");
    }
  };

  // 3. 拖拽相关事件
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  useEffect(() => { return () => { previewUrls.forEach(url => URL.revokeObjectURL(url)); }; }, []);

  return (
    <div 
      className={cn(
        "space-y-2 rounded-lg transition-colors p-2 -ml-2 border border-transparent", 
        isDragging && "bg-blue-50 border-blue-300 border-dashed"
      )}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 隐藏的 Input: 用于提交数据 */}
      <input
        type="file"
        id={inputId}
        name={inputId}
        className="hidden"
        accept="image/*"
        multiple
        ref={input => {
          if (input && selectedFiles.length > 0) {
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(file => dataTransfer.items.add(file));
            input.files = dataTransfer.files;
          }
        }}
      />

      {/* 图片预览区域 */}
      {previewUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2 pl-2">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative w-20 h-20 rounded-lg border overflow-hidden group bg-slate-100 shadow-sm shrink-0">
              <Dialog>
                <DialogTrigger asChild>
                  <img src={url} alt="preview" className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition" />
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none flex justify-center items-center">
                  <DialogHeader className="sr-only"><DialogTitle>预览</DialogTitle><DialogDescription>大图</DialogDescription></DialogHeader>
                  <img src={url} alt="full" className="max-w-full max-h-[85vh] rounded-md object-contain" />
                </DialogContent>
              </Dialog>
              <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-0 right-0 p-1 text-slate-400 hover:text-red-500 bg-white/90 rounded-bl transition opacity-0 group-hover:opacity-100 z-10">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 添加按钮 (视觉上不仅是按钮，也是拖拽提示区) */}
      <div className="flex items-center gap-2 pl-2">
        <input type="file" id={`${inputId}_trigger`} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
        <Label
          htmlFor={`${inputId}_trigger`}
          className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded flex items-center gap-2 text-sm text-slate-600 transition border border-slate-200 select-none"
        >
          <Camera className="w-4 h-4" />
          {selectedFiles.length > 0 ? `继续添加 (${selectedFiles.length})` : "粘贴/拖入/选择图片"}
        </Label>
        
        {/* 提示文案，只有在没图片时显示，或者一直显示 */}
        <span className="text-xs text-slate-400 hidden sm:inline-block pointer-events-none">
          支持 Ctrl+V 粘贴或拖拽上传
        </span>
      </div>
    </div>
  );
}