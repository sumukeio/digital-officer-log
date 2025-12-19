"use client";

import { createDailyReport } from "@/app/actions/submit-report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState, ChangeEvent, useActionState, useRef, DragEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, RotateCcw, XCircle, Loader2, UploadCloud, Plus, Minus, Image as ImageIcon } from "lucide-react";
import { createWorker } from "tesseract.js";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils"; // 假设你有 utils，如果没有可以直接写 class 字符串
import { GlobalLoading } from "@/components/GlobalLoading";

// 定义题目类型 (对应数据库)
type Question = {
  id: string;
  label: string;
  type: string;
  category: string;
  options?: string | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setIsSubmitting(false);
      toast.success(formState.message);
      // 提交成功清除缓存
      localStorage.removeItem("daily_report_cache");
      router.push("/");
    } else if (formState?.success === false) {
      setIsSubmitting(false);
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
      {/* 提交中全屏加载遮罩 */}
      {isSubmitting && <GlobalLoading message="提交中..." />}
      
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
      <form 
        action={async (formData) => {
          setIsSubmitting(true);
          await formAction(formData);
        }} 
        className="space-y-6 px-1"
      >
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
  const { id, label, type, options } = question;
  const val = state[id];
  const remarkVal = state[`${id}_remark`] || "";

  // 解析选项配置
  const parsedOptions = options ? (() => {
    try {
      return JSON.parse(options);
    } catch {
      return null;
    }
  })() : null;

  // 渲染不同类型的输入控件
  const renderInput = () => {
    switch (type) {
      case 'number':
        return (
          <Input
            id={id} name={id} type="number" min={0} placeholder="0"
            className="text-right font-mono text-lg"
            value={val ?? ""}
            onChange={(e) => onChange(id, e.target.value)}
          />
        );
      
      case 'boolean':
        return (
          <div className="pt-1">
            <input type="hidden" name={id} value={val === true ? "on" : "off"} />
            <Switch id={id} checked={val === true} onCheckedChange={(checked) => onChange(id, checked)} />
          </div>
        );
      
      case 'text':
        return (
          <Input 
            id={id} 
            name={id} 
            placeholder="文本" 
            value={val ?? ""} 
            onChange={(e) => onChange(id, e.target.value)} 
          />
        );
      
      case 'radio':
        const radioOptions = parsedOptions?.options || [];
        return (
          <RadioGroup
            value={val || ""}
            onValueChange={(value) => onChange(id, value)}
            className="flex flex-col gap-2"
          >
            {radioOptions.map((opt: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${id}_${idx}`} />
                <Label htmlFor={`${id}_${idx}`} className="cursor-pointer text-sm">{opt}</Label>
              </div>
            ))}
            <input type="hidden" name={id} value={val || ""} />
          </RadioGroup>
        );
      
      case 'checkbox':
        const checkboxOptions = parsedOptions?.options || [];
        const checkboxValues = Array.isArray(val) ? val : [];
        return (
          <div className="flex flex-col gap-2">
            {checkboxOptions.map((opt: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${id}_${idx}`}
                  checked={checkboxValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, opt]
                      : checkboxValues.filter((v: string) => v !== opt);
                    onChange(id, newValues);
                  }}
                />
                <Label htmlFor={`${id}_${idx}`} className="cursor-pointer text-sm">{opt}</Label>
              </div>
            ))}
            <input type="hidden" name={id} value={JSON.stringify(checkboxValues)} />
          </div>
        );
      
      case 'select':
        const selectOptions = parsedOptions?.options || [];
        return (
          <Select value={val || ""} onValueChange={(value) => onChange(id, value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((opt: string, idx: number) => (
                <SelectItem key={idx} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
            <input type="hidden" name={id} value={val || ""} />
          </Select>
        );
      
      case 'dynamic_list':
        return <DynamicListInput question={question} value={val} onChange={(v) => onChange(id, v)} />;
      
      default:
        return (
          <Input 
            id={id} 
            name={id} 
            placeholder="文本" 
            value={val ?? ""} 
            onChange={(e) => onChange(id, e.target.value)} 
          />
        );
    }
  };

  // 动态列表和某些类型需要全宽布局
  const needsFullWidth = type === 'radio' || type === 'checkbox' || type === 'select' || type === 'dynamic_list';

  return (
    <div className="border-b pb-6 last:border-0 last:pb-0">
      <div className="flex flex-col gap-3">
        {/* 标题与核心输入控件 */}
        <div className={cn("flex items-start gap-4", needsFullWidth ? "flex-col" : "justify-between")}>
          <Label htmlFor={id} className="text-base leading-6 flex-1 pt-2 text-slate-700">{label}</Label>
          <div className={cn(needsFullWidth ? "w-full" : "w-32 shrink-0 flex justify-end")}>
            {renderInput()}
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

// === 动态列表组件 ===
function DynamicListInput({ question, value, onChange }: { question: Question, value: any, onChange: (value: any) => void }) {
  const parsedOptions = question.options ? (() => {
    try {
      return JSON.parse(question.options);
    } catch {
      return null;
    }
  })() : null;

  const fields = parsedOptions?.fields || [
    { label: "产品名称", key: "productName" },
    { label: "规格", key: "spec" }
  ];

  // 初始化数据：如果 value 为空，默认有一行空数据
  const [rows, setRows] = useState(() => {
    if (value) {
      try {
        // value 可能是字符串（JSON）或已经是数组
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // 解析失败，使用默认值
      }
    }
    return [fields.reduce((acc: any, f: any) => ({ ...acc, [f.key]: "" }), {})];
  });

  // OCR 相关状态
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当 rows 变化时，同步到父组件
  useEffect(() => {
    onChange(rows);
  }, [rows]);

  const addRow = () => {
    const newRow = fields.reduce((acc: any, f: any) => ({ ...acc, [f.key]: "" }), {});
    setRows([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, fieldKey: string, fieldValue: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [fieldKey]: fieldValue };
    setRows(newRows);
  };

  // 将数据序列化为 JSON 字符串，用于表单提交
  useEffect(() => {
    const hiddenInput = document.querySelector(`input[name="${question.id}"]`) as HTMLInputElement;
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(rows);
    }
  }, [rows, question.id]);

  // OCR 识别函数
  const recognizeImage = async (imageFile: File) => {
    setOcrLoading(true);
    setOcrProgress(0);

    try {
      // 显示提示：首次使用需要下载语言包（约 10-20MB）
      if (!localStorage.getItem('tesseract_initialized')) {
        toast.info("首次使用 OCR，正在下载语言包，请稍候...");
      }

      const worker = await createWorker('chi_sim+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          } else if (m.status === 'loading language') {
            setOcrProgress(10); // 语言包加载中
          } else if (m.status === 'initializing tesseract') {
            setOcrProgress(5); // 初始化中
          }
        },
      });

      localStorage.setItem('tesseract_initialized', 'true');
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();

      // 解析识别结果
      const parsedData = parseOCRText(text, fields);
      
      if (parsedData.length > 0) {
        // 如果当前只有一行空数据，替换它；否则追加
        const currentRows = rows.length === 1 && Object.values(rows[0]).every(v => !v) 
          ? [] 
          : [...rows];
        setRows([...currentRows, ...parsedData]);
        toast.success(`成功识别 ${parsedData.length} 条数据`);
      } else {
        toast.warning("未能识别出有效数据，请检查图片质量或手动输入");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("图片识别失败，请重试或手动输入");
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  };

  // 解析 OCR 文本，提取字段-值对
  const parseOCRText = (text: string, fields: any[]): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const results: any[] = [];

    // 策略1: 尝试按行解析，每行包含所有字段值（用空格或制表符分隔）
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 尝试分割：空格、制表符、多个空格
      const parts = trimmed.split(/\s+/).filter(p => p.trim());
      
      if (parts.length >= fields.length) {
        const row: any = {};
        fields.forEach((field, index) => {
          row[field.key] = parts[index] || "";
        });
        results.push(row);
      } else if (parts.length > 0) {
        // 如果字段数不够，至少填充第一个字段
        const row: any = {};
        fields.forEach((field, index) => {
          row[field.key] = index === 0 ? parts.join(' ') : "";
        });
        results.push(row);
      }
    }

    // 策略2: 如果策略1没结果，尝试查找字段名模式
    if (results.length === 0) {
      const fieldLabels = fields.map(f => f.label);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const row: any = {};
        let hasData = false;

        fields.forEach((field, fieldIndex) => {
          // 尝试找到字段名后面的值
          const labelIndex = line.indexOf(fieldLabels[fieldIndex]);
          if (labelIndex !== -1) {
            const afterLabel = line.substring(labelIndex + fieldLabels[fieldIndex].length).trim();
            // 提取字段名后的内容（直到下一个字段名或行尾）
            let value = afterLabel;
            if (fieldIndex < fields.length - 1) {
              const nextLabelIndex = line.indexOf(fieldLabels[fieldIndex + 1]);
              if (nextLabelIndex !== -1) {
                value = line.substring(labelIndex + fieldLabels[fieldIndex].length, nextLabelIndex).trim();
              }
            }
            row[field.key] = value || "";
            if (value) hasData = true;
          }
        });

        if (hasData) {
          results.push(row);
        }
      }
    }

    return results;
  };

  // 处理文件选择
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      recognizeImage(file);
    } else {
      toast.error("请选择图片文件");
    }
    // 重置 input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await recognizeImage(file);
          }
          break;
        }
      }
    };

    // 只在动态列表区域监听粘贴事件
    const container = document.querySelector(`input[name="${question.id}"]`)?.closest('.w-full');
    if (container) {
      const wrappedHandler = (e: Event) => {
        handlePaste(e as unknown as ClipboardEvent);
      };
      container.addEventListener('paste', wrappedHandler);
      return () => {
        container.removeEventListener('paste', wrappedHandler);
      };
    }
  }, [question.id, fields]);

  return (
    <div className="w-full space-y-2">
      <input type="hidden" name={question.id} value={JSON.stringify(rows)} />
      
      {/* OCR 图片识别区域 */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 bg-slate-50/50 hover:border-slate-400 transition-colors">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`ocr-input-${question.id}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="shrink-0"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {ocrLoading ? "识别中..." : "上传图片识别"}
          </Button>
          <span className="text-xs text-slate-500 flex-1">
            {ocrLoading 
              ? `正在识别... ${ocrProgress}%` 
              : "支持粘贴图片 (Ctrl+V) 或点击上传，自动识别并填充数据"}
          </span>
        </div>
        {ocrLoading && (
          <div className="mt-2">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 数据行列表 */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2 items-center border rounded-md p-2 bg-white">
          {fields.map((field: any, fieldIndex: number) => (
            <Input
              key={fieldIndex}
              placeholder={field.label}
              value={row[field.key] || ""}
              onChange={(e) => updateRow(rowIndex, field.key, e.target.value)}
              className="flex-1"
            />
          ))}
          {rowIndex === 0 ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={addRow}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => removeRow(rowIndex)}
              className="shrink-0 text-red-500 hover:text-red-600"
            >
              <Minus className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
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