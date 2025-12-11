import { getQuestions, updateQuestion } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default async function TemplatePage() {
  const questions = await getQuestions();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">工作记录模板配置</h2>
      <div className="grid gap-4">
        {questions.map((q) => (
          <Card key={q.id} className={!q.isEnabled ? "opacity-60 bg-slate-50" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{q.category}</Badge>
                  <span className="text-xs text-slate-400">排序: {q.order}</span>
                </div>
                <p className="font-medium">{q.label}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge>{q.type === 'number' ? '数字' : q.type === 'boolean' ? '开关' : '文本'}</Badge>
                {/* 切换启用/禁用 */}
                <form action={async () => {
                  "use server";
                  await updateQuestion(q.id, { isEnabled: !q.isEnabled });
                }}>
                  <Button variant={q.isEnabled ? "default" : "secondary"} size="sm">
                    {q.isEnabled ? "启用中" : "已禁用"}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}