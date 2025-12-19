"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { updateQuestion, reorderQuestions, saveQuestion, deleteQuestion } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Question {
  id: string;
  label: string;
  type: string;
  category: string;
  options?: string | null; // JSON 格式的选项配置
  isEnabled: boolean;
  order: number;
}

export default function TemplateList({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions);

  // 处理拖拽结束
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // 1. 前端乐观更新 (立即改变 UI)
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setQuestions(items);

    // 2. 提交到后端
    const newOrderIds = items.map(q => q.id);
    try {
        await reorderQuestions(newOrderIds);
        toast.success("顺序已更新");
    } catch(e) {
        toast.error("排序保存失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">模板配置</h2>
        <QuestionDialog />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {questions.map((q, index) => (
                <Draggable key={q.id} draggableId={q.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm ${!q.isEnabled && 'opacity-60 bg-slate-50'}`}
                    >
                      {/* 拖拽把手 */}
                      <div {...provided.dragHandleProps} className="text-slate-400 cursor-grab hover:text-slate-600">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{q.category}</Badge>
                            <span className="text-xs text-slate-400">Type: {q.type}</span>
                        </div>
                        <div className="font-medium text-slate-800">{q.label}</div>
                      </div>

                      <div className="flex items-center gap-3">
                         {/* 启用/禁用 */}
                         <Switch 
                            checked={q.isEnabled}
                            onCheckedChange={async (checked) => {
                                // 乐观更新
                                setQuestions(qs => qs.map(item => item.id === q.id ? {...item, isEnabled: checked} : item));
                                await updateQuestion(q.id, { isEnabled: checked });
                            }}
                         />
                         
                         {/* 编辑 */}
                         <QuestionDialog question={q} />
                         
                         {/* 删除 */}
                         <Button variant="ghost" size="icon" onClick={async () => {
                             if(confirm("确定删除吗？")) {
                                 await deleteQuestion(q.id);
                                 setQuestions(qs => qs.filter(item => item.id !== q.id));
                             }
                         }}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                         </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

// 通用新增/编辑弹窗
function QuestionDialog({ question }: { question?: Question }) {
    const [open, setOpen] = useState(false);
    const isEdit = !!question;

    // 解析选项配置
    const getInitialOptions = () => {
        if (question?.options) {
            try {
                const parsed = JSON.parse(question.options);
                if (parsed.options && Array.isArray(parsed.options)) {
                    return parsed.options.join("\n");
                }
            } catch {}
        }
        return "";
    };

    const getInitialDynamicFields = () => {
        if (question?.options) {
            try {
                const parsed = JSON.parse(question.options);
                if (parsed.fields && Array.isArray(parsed.fields)) {
                    return parsed.fields;
                }
            } catch {}
        }
        return [{ label: "产品名称", key: "productName" }, { label: "规格", key: "spec" }];
    };

    const [questionType, setQuestionType] = useState(question?.type || "number");
    const [optionsText, setOptionsText] = useState(getInitialOptions());
    const [dynamicFields, setDynamicFields] = useState(getInitialDynamicFields());

    // 当对话框打开且是编辑模式时，重新初始化状态
    useEffect(() => {
        if (open && question) {
            setQuestionType(question.type || "number");
            setOptionsText(getInitialOptions());
            setDynamicFields(getInitialDynamicFields());
        }
    }, [open, question]);
    
    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
                // 重置状态
                setQuestionType(question?.type || "number");
                setOptionsText(getInitialOptions());
                setDynamicFields(getInitialDynamicFields());
            }
        }}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button variant="ghost" size="icon"><Pencil className="w-4 h-4 text-slate-500" /></Button>
                ) : (
                    <Button><Plus className="w-4 h-4 mr-2"/>新增题目</Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{isEdit ? "编辑题目" : "新增题目"}</DialogTitle></DialogHeader>
                <form action={async (formData) => {
                    // 根据类型构建 options JSON
                    let optionsJson = null;
                    if (questionType === "radio" || questionType === "checkbox" || questionType === "select") {
                        const options = optionsText.split("\n").filter((o: string) => o.trim()).map((o: string) => o.trim());
                        if (options.length > 0) {
                            optionsJson = JSON.stringify({ options });
                        }
                    } else if (questionType === "dynamic_list") {
                        optionsJson = JSON.stringify({ fields: dynamicFields });
                    }
                    
                    if (optionsJson) {
                        formData.append("options", optionsJson);
                    }
                    
                    await saveQuestion(formData);
                    setOpen(false);
                    toast.success("保存成功");
                    window.location.reload(); 
                }} className="space-y-4">
                    <input type="hidden" name="id" value={question?.id || ""} />
                    
                    <div className="space-y-2">
                        <Label>题目内容</Label>
                        <Input name="label" defaultValue={question?.label} required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>分类</Label>
                            <Select name="category" defaultValue={question?.category || "一、生产与质量"}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="一、生产与质量">一、生产与质量</SelectItem>
                                    <SelectItem value="二、现场与设备">二、现场与设备</SelectItem>
                                    <SelectItem value="三、嘟嘟卡与效率">三、嘟嘟卡与效率</SelectItem>
                                    <SelectItem value="四、总结">四、总结</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>类型</Label>
                            <Select 
                                name="type" 
                                value={questionType}
                                onValueChange={setQuestionType}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="number">数字 (计数)</SelectItem>
                                    <SelectItem value="boolean">开关 (是/否)</SelectItem>
                                    <SelectItem value="text">文本</SelectItem>
                                    <SelectItem value="radio">单选框</SelectItem>
                                    <SelectItem value="checkbox">多选框</SelectItem>
                                    <SelectItem value="select">下拉框</SelectItem>
                                    <SelectItem value="dynamic_list">动态列表</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 选项配置：radio、checkbox、select */}
                    {(questionType === "radio" || questionType === "checkbox" || questionType === "select") && (
                        <div className="space-y-2">
                            <Label>选项列表（每行一个）</Label>
                            <textarea
                                className="w-full min-h-[120px] p-2 border rounded-md text-sm"
                                value={optionsText}
                                onChange={(e) => setOptionsText(e.target.value)}
                                placeholder="选项1&#10;选项2&#10;选项3"
                            />
                            <p className="text-xs text-slate-500">每行输入一个选项</p>
                        </div>
                    )}

                    {/* 动态列表配置 */}
                    {questionType === "dynamic_list" && (
                        <div className="space-y-2">
                            <Label>字段配置</Label>
                            <div className="space-y-2 border rounded-md p-3 bg-slate-50">
                                {dynamicFields.map((field, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="字段名称"
                                            value={field.label}
                                            onChange={(e) => {
                                                const newFields = [...dynamicFields];
                                                newFields[index].label = e.target.value;
                                                setDynamicFields(newFields);
                                            }}
                                            className="flex-1"
                                        />
                                        <Input
                                            placeholder="字段标识（英文）"
                                            value={field.key}
                                            onChange={(e) => {
                                                const newFields = [...dynamicFields];
                                                newFields[index].key = e.target.value;
                                                setDynamicFields(newFields);
                                            }}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">配置动态列表的字段名称和标识</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full">保存</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}