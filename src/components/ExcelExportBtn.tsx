"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useState } from "react";
import { toast } from "sonner";
// 这一步需要你去 actions/admin.ts 里加一个 getAllReportsForExport 函数
import { getAllReportsForExport } from "@/app/actions/admin"; 

export default function ExcelExportBtn() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await getAllReportsForExport();
      
      // 1. 数据清洗：把 JSON 拍平
      const rows = data.map((item: any) => {
        const answers = JSON.parse(item.answers);
        const row: any = {
          "日期": new Date(item.date).toLocaleDateString(),
          "提交人": item.user.name,
          "工号": item.user.workId,
          "区域": item.area,
          "总结": item.summary
        };
        // 把每个题目的答案提取出来
        // 这里需要你知道题目ID，或者动态遍历
        // 简单示例：
        // row["生产头条开卡"] = answers["prodOpenCount"]?.value || 0;
        return row;
      });

      // 2. 生成 Excel
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "日报记录");
      
      // 3. 下载
      XLSX.writeFile(workbook, `工厂日报_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("导出成功");
    } catch (e) {
      toast.error("导出失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading}>
      <Download className="mr-2 h-4 w-4" />
      {loading ? "正在生成..." : "导出 Excel"}
    </Button>
  );
}