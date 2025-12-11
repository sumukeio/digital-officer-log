import { getUsers } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// 引入新提取的组件
import { UserRowActions } from "./user-row-actions";
import { UserDialog } from "./user-dialog"; 

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">人员管理</h2>
        {/* 这里直接使用引入的组件 (新增模式) */}
        <UserDialog />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>工号</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>负责区域</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono">{user.workId}</TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>
                  {user.roles.map(r => 
                    <span key={r.id} className={`text-xs px-2 py-1 rounded mr-1 ${r.name==='admin'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'}`}>
                      {r.name === 'admin' ? '管理员' : '数字官'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-500 max-w-xs truncate" title={user.assignedAreas || ""}>
                  {user.assignedAreas}
                </TableCell>
                <TableCell>
                  {/* 编辑模式：传入 user 对象 */}
                  <UserRowActions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ❌ 注意：请确保删除了这里原本存在的 function UserDialog() { ... }