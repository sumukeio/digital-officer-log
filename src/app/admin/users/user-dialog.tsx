"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveUser } from "@/app/actions/admin";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

// 定义组件接收的 Props
interface UserDialogProps {
  user?: {
    id: string;
    workId: string;
    name: string | null;
    assignedAreas: string | null;
    roles: { name: string }[];
  }; // 如果传入 user，则是编辑模式；否则是新增模式
}

export function UserDialog({ user }: UserDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!user; // 是否为编辑模式

  // 判断当前用户是否是管理员 (用于回显 Switch)
  const isAdmin = user?.roles.some(r => r.name === 'admin');

  // 处理提交 (为了关闭弹窗，我们在客户端包裹一层)
  const handleSubmit = async (formData: FormData) => {
    try {
      await saveUser(formData);
      setOpen(false);
      toast.success(isEdit ? "用户更新成功" : "用户创建成功");
    } catch (e) {
      toast.error("操作失败，工号可能已存在");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          // 编辑模式显示的按钮 (图标)
          <Button variant="outline" size="sm" title="编辑信息">
            <Pencil className="w-3 h-3 mr-1" /> 编辑
          </Button>
        ) : (
          // 新增模式显示的按钮 (大按钮)
          <Button>
            <Plus className="w-4 h-4 mr-2" /> 新增用户
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑用户信息" : "新增用户"}</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4">
          {/* 隐藏字段：ID (仅编辑模式有值) */}
          <input type="hidden" name="id" value={user?.id || ""} />

          <div className="space-y-2">
            <Label>工号 <span className="text-red-500">*</span></Label>
            <Input 
              name="workId" 
              required 
              placeholder="如: 88002" 
              defaultValue={user?.workId} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>姓名</Label>
            <Input 
              name="name" 
              placeholder="姓名" 
              defaultValue={user?.name || ""} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>负责区域 (用逗号分隔)</Label>
            <Input 
              name="areas" 
              placeholder="注塑A区, 包装C区" 
              defaultValue={user?.assignedAreas || ""} 
            />
          </div>
          
          <div className="flex items-center justify-between border p-3 rounded bg-slate-50">
            <div className="space-y-0.5">
              <Label>管理员权限</Label>
              <div className="text-xs text-slate-500">开启后可访问后台配置</div>
            </div>
            {/* Switch 的 name="isAdmin" 会在勾选时提交 "on" */}
            <Switch name="isAdmin" defaultChecked={isAdmin} />
          </div>
          
          <Button type="submit" className="w-full">
            {isEdit ? "保存修改" : "确认创建"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}