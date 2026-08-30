"use client";

import React, { useState, useRef } from "react";
import { RecognizedFile } from "@/lib/weekly-report/types";
import { parseExcelData } from "@/lib/weekly-report/excel-parser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle, FilePlus2 } from "lucide-react";
import { toast } from "sonner";

interface FileDropzoneProps {
  files: RecognizedFile[];
  onAddFiles: (newFiles: RecognizedFile[]) => void;
  onRemoveFile: (fileId: string) => void;
}

export function FileDropzone({
  files,
  onAddFiles,
  onRemoveFile,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (rawFiles: FileList | File[]) => {
    setIsProcessing(true);
    const addedList: RecognizedFile[] = [];
    let duplicateCount = 0;

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error(`文件 "${file.name}" 不是 Excel 格式 (.xlsx/.xls)`);
        continue;
      }

      // 文件级去重：判断文件名与大小是否已存在
      const isDuplicate = files.some(
        (f) => f.fileName === file.name && f.fileSize === file.size
      );

      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const recognized = parseExcelData(buffer, file.name, file.size);
        addedList.push(recognized);
      } catch (err: any) {
        console.error("解析文件失败:", file.name, err);
        toast.error(`解析文件 "${file.name}" 失败: ${err.message || "未知错误"}`);
      }
    }

    if (duplicateCount > 0) {
      toast.warning(`已自动跳过 ${duplicateCount} 个重复拖入的文件`);
    }

    if (addedList.length > 0) {
      onAddFiles(addedList);
      toast.success(`成功识别并导入 ${addedList.length} 个使用记录表格！`);
    }

    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const getModuleBadgeColor = (moduleType: string) => {
    switch (moduleType) {
      case "production":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "qc":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "punch":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "okr":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "lean":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "comprehensive":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-3">
      {/* 拖拽导入区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50/70 scale-[0.99]"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-800">
              {isProcessing ? "正在智能解析表格中..." : "点击或将海铭德系统导出的 Excel 批量拖入此处"}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              支持同时拖入多个文件（生产头条、QC头条、打卡记录、OKR、精益等，自动识别与去重）
            </p>
          </div>
        </div>
      </div>

      {/* 已上传文件识别清单 */}
      {files.length > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              已识别导入文件 ({files.length} 个)
            </span>
            <span>文件级防重校验通过</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {files.map((file) => (
              <div
                key={file.fileId}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors gap-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 font-medium ${getModuleBadgeColor(
                          file.moduleType
                        )}`}
                      >
                        {file.moduleName}
                      </Badge>
                      <span className="text-xs font-medium text-slate-700 truncate" title={file.fileName}>
                        {file.fileName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      共 {file.rows.length} 行数据
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.fileId);
                  }}
                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                  title="移除文件"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
