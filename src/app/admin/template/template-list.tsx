"use client";

import { useState } from "react";
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
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button variant="ghost" size="icon"><Pencil className="w-4 h-4 text-slate-500" /></Button>
                ) : (
                    <Button><Plus className="w-4 h-4 mr-2"/>新增题目</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>{isEdit ? "编辑题目" : "新增题目"}</DialogTitle></DialogHeader>
                <form action={async (formData) => {
                    await saveQuestion(formData);
                    setOpen(false);
                    toast.success("保存成功");
                    // 最好在这里触发一次列表刷新，或者利用 router.refresh()
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
                            <Select name="type" defaultValue={question?.type || "number"}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="number">数字 (计数)</SelectItem>
                                    <SelectItem value="boolean">开关 (是/否)</SelectItem>
                                    <SelectItem value="text">文本</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button type="submit" className="w-full">保存</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}