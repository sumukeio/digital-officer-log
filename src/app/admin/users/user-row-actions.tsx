"use client"; // <--- 关键：标记为客户端组件

import { deleteUser, resetUserPassword } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UserDialog } from "./user-dialog"; // 引入

// 定义需要的 User 类型结构
interface UserRowActionsProps {
  user: {
    id: string;
    workId: string;
    name: string | null;
    assignedAreas: string | null;
    roles: { name: string }[];
  };
}

export function UserRowActions({ user }: UserRowActionsProps) {
  
  // 处理删除的确认逻辑
  const handleDelete = (e: React.FormEvent) => {
    if (!confirm("确定要删除该用户吗？此操作不可恢复。")) {
      e.preventDefault(); // 阻止表单提交
    }
  };

  // 处理重置密码
  const handleReset = async (formData: FormData) => {
    await resetUserPassword(user.id);
    toast.success("密码已重置为 123456");
  };

  return (
    <div className="flex gap-2 items-center">
      {/* 1. 编辑按钮 (其实是 UserDialog 组件，因为传了 user 属性，它会渲染成编辑样式的按钮) */}
      <UserDialog user={user} />

      {/* 重置密码按钮 */}
      <form action={handleReset}>
        <Button variant="outline" size="sm" title="重置为123456">
          <RotateCcw className="w-3 h-3 mr-1" />
          重置
        </Button>
      </form>

      {/* 删除按钮 */}
      <form action={deleteUser.bind(null, user.id)} onSubmit={handleDelete}>
        <Button variant="destructive" size="sm" title="删除用户">
          <Trash2 className="w-3 h-3" />
        </Button>
      </form>
    </div>
  );
}