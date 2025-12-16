"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableDurationProps {
  name: string;
  defaultValue?: number | null;
  placeholder?: string;
  className?: string;
}

export function DraggableDuration({ name, defaultValue, placeholder, className }: DraggableDurationProps) {
  // 状态：如果是 null/undefined 显示空字符串，否则显示数字
  const [value, setValue] = useState<number | "">(defaultValue ?? "");
  const [isDragging, setIsDragging] = useState(false);
  
  // 记录拖拽起始点
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  // 1. 获得焦点时的“智能默认值”
  const handleFocus = () => {
    if (value === "") {
      setValue(25); // 需求：点击准备填写时，默认为 25 分钟
    }
  };

  // 2. 鼠标按下：开始拖拽
  const handleMouseDown = (e: MouseEvent) => {
    // 只有在 Input 上按住鼠标左键才触发，且不是在点击清除按钮等
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = typeof value === 'number' ? value : 25;
    
    // 全局监听移动和松开
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize'; // 改变鼠标样式
  };

  // 3. 鼠标移动：计算数值变化
  const handleMouseMove = (e: globalThis.MouseEvent) => {
    const deltaY = startY.current - e.clientY; // 向上拖动 deltaY 为正
    // 灵敏度：每移动 5 像素，数值变化 1
    const step = Math.floor(deltaY / 5); 
    
    // 计算新值，最小为 1 (或者是 0，看你需求)
    const newValue = Math.max(1, startValue.current + step);
    setValue(newValue);
  };

  // 4. 鼠标松开：结束拖拽
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
  };

  return (
    <div className={cn("relative group", className)}>
      <Input
        name={name}
        type="number"
        value={value}
        placeholder={placeholder}
        onFocus={handleFocus}
        onChange={(e) => setValue(e.target.value ? parseInt(e.target.value) : "")}
        // 添加 cursor 样式提示可以拖拽
        className="pr-8 cursor-ns-resize selection:bg-blue-100" 
        // 绑定拖拽事件
        onMouseDown={handleMouseDown}
      />
      
      {/* 右侧小图标提示 */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      </div>
      
      {/* 拖拽时的蒙层提示 (可选，为了防止拖拽时意外选中文字) */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-ns-resize" />
      )}
    </div>
  );
}