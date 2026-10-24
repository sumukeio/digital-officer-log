"use client";

import React from "react";
import {
  HeadlineModule,
  renderModulePoster,
  renderModulesPosters,
} from "@/lib/headline-brief";
import { Button } from "@/components/ui/button";
import { Copy, Download, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface PosterExportProps {
  /** C2：全部模块各出一张 */
  modules: HeadlineModule[];
  /** 复制剪贴板时用当前选中模块 */
  activeModule: HeadlineModule;
  titleFormatted: string;
  weekNumber: number;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("无法生成 PNG"));
    }, "image/png");
  });
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function fileName(weekNumber: number, moduleKey: string) {
  return `头条周简报-W${weekNumber}-${moduleKey}.png`;
}

export function PosterExport({
  modules,
  activeModule,
  titleFormatted,
  weekNumber,
}: PosterExportProps) {
  const handleDownloadAll = () => {
    try {
      const list = modules.length
        ? modules
        : activeModule
          ? [activeModule]
          : [];
      if (!list.length) {
        toast.error("暂无内容可导出海报");
        return;
      }
      const posters = renderModulesPosters(list, titleFormatted, weekNumber);
      posters.forEach(({ module, canvas }) => {
        downloadCanvas(canvas, fileName(weekNumber, module.moduleKey));
      });
      toast.success(
        posters.length > 1
          ? `已按模块下载 ${posters.length} 张海报（各一张）`
          : "海报 PNG 已下载"
      );
    } catch (err: any) {
      toast.error(err?.message || "海报导出失败");
    }
  };

  const handleCopyActive = async () => {
    try {
      const canvas = renderModulePoster(
        activeModule,
        titleFormatted,
        weekNumber
      );
      const blob = await canvasToBlob(canvas);

      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function"
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.success(
          `已复制「${activeModule.moduleTitle}」海报；其它模块请用下载`
        );
        return;
      }

      throw new Error("当前浏览器不支持复制图片");
    } catch (err: any) {
      console.warn("复制海报失败，回退下载当前模块:", err);
      try {
        const canvas = renderModulePoster(
          activeModule,
          titleFormatted,
          weekNumber
        );
        downloadCanvas(
          canvas,
          fileName(weekNumber, activeModule.moduleKey)
        );
        toast.error(`${err?.message || "复制失败"}，已下载当前模块 PNG`);
      } catch (e: any) {
        toast.error(e?.message || "复制与下载均失败");
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={handleCopyActive}>
        <Copy className="w-4 h-4 mr-1.5 text-sky-600" />
        复制当前
      </Button>
      <Button type="button" variant="outline" onClick={handleDownloadAll}>
        <ImageIcon className="w-4 h-4 mr-1.5 text-sky-600" />
        下载全部
        <Download className="w-3.5 h-3.5 ml-1 opacity-60" />
      </Button>
    </div>
  );
}
