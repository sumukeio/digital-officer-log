"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Bell } from "lucide-react";

// 更新公告内容（从 README.md 提取）
const updateContent = `## 12月17日更新
### Bug修复
1、修复了立即发布按钮，点两次还是会新建两个同名任务的bug（服务端防重复提交 + 前端loading状态）。
2、修复了任务看板横向滚动条必须滚动到底部才能看到的问题（固定容器高度，滚动条始终可见）。
3、修复了删除历史归档任务时的外键约束错误（先删除关联日志再删除任务）。
4、修复了任务看板页面的语法错误导致页面无法加载的问题。

### 新增功能
1、管理员可以在历史归档任务页面删除任务（卡片右上角删除按钮）。
2、任务看板支持任务复制功能（点击复制按钮，预填数据打开新建弹窗）。
3、任务看板支持删除任务功能（本人可删除自己的任务，管理员可删除任意任务）。

## 12月16日更新
### Bug修复
1、指标趋势分析看板取数异常。
2、通过日历查看当日已提交日报时，无法选择区域。

### 新增功能
1、日报填写页面，支持图片的右键粘贴和拖入。
2、任务看板：新建任务时，开始日期与持续时间非必填，方便安排计划。
持续时间支持点击拖拽修改。

## 12月13日更新
### 优化功能
1、关键指标趋势看板，增加了区域选项，可以根据区域查看对应各指标数据。

2、任务看板优化了任务结构，可以设置开始时间、预计用时。完成后的任务会出现在历史任务中。

## 12月12日更新

### 新增功能
增加了知识库、任务看板、快捷网址等功能。

### bug修复
1）手机端看不到知识库入口；

2）管理员拖动任务失败；

3）页面上的文字可以选中；

4）创建/修改/完成任务，都需要刷新才能看到；

### 功能优化：手机端任务看板。
1）手机端自动切换为竖向布局。

2）任务看板只显示当日任务和未来任务。今天以前且已经完成的任务自动隐藏，未完成的依旧显示。

3、增加了历史任务入口，可以看到今天以前的任务。`;

export function UpdateAnnouncementDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50">
          <Bell className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            更新公告
          </DialogTitle>
          <DialogDescription className="sr-only">查看系统更新公告和历史更新记录</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1 py-4 custom-scrollbar min-h-0">
          <div className="text-sm text-slate-700 space-y-4 leading-relaxed px-3">
            {updateContent.split('\n').map((line, index) => {
              // 处理标题
              if (line.startsWith('## ')) {
                return (
                  <h3 key={index} className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0">
                    {line.replace('## ', '')}
                  </h3>
                );
              }
              // 处理二级标题
              if (line.startsWith('### ')) {
                return (
                  <h4 key={index} className="text-sm font-semibold text-slate-800 mt-3 mb-1">
                    {line.replace('### ', '')}
                  </h4>
                );
              }
              // 处理列表项
              if (line.trim().match(/^[\d、）]/)) {
                return (
                  <p key={index} className="text-xs text-slate-600 ml-2">
                    {line.trim()}
                  </p>
                );
              }
              // 处理空行
              if (line.trim() === '') {
                return <br key={index} />;
              }
              // 普通文本
              return (
                <p key={index} className="text-xs text-slate-600">
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

