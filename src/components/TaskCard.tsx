"use client";

import { useState, useEffect } from 'react';
import { differenceInMinutes, addMinutes } from 'date-fns';

// 这里的类型定义要匹配 Prisma 返回的数据
interface TaskProps {
  task: {
    id: string;
    content: string;
    location?: string | null;
    startTime: Date | string; // 兼容 string (因为 server component 传过来可能是序列化的)
    duration: number;
  };
}

export function TaskCard({ task }: TaskProps) {
  const [statusText, setStatusText] = useState("计算中...");
  const [statusColor, setStatusColor] = useState("text-gray-500");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const start = new Date(task.startTime);
      const end = addMinutes(start, task.duration); 

      if (now < start) {
        // 1. 还没开始
        const diff = differenceInMinutes(start, now);
        const display = diff > 60 ? `${Math.ceil(diff/60)}小时后` : `${diff}分后`;
        setStatusText(`⏳ ${display}开始`);
        setStatusColor("text-blue-600"); 
      } else if (now >= start && now <= end) {
        // 2. 进行中
        const left = differenceInMinutes(end, now);
        setStatusText(`🔥 剩余 ${left} 分钟`);
        setStatusColor("text-orange-600"); 
      } else {
        // 3. 已超时
        const overdue = differenceInMinutes(now, end);
        setStatusText(`❌ 超时 ${overdue} 分钟`);
        setStatusColor("text-red-600");
      }
    };

    tick();
    const timer = setInterval(tick, 60000); 
    return () => clearInterval(timer);
  }, [task.startTime, task.duration]);

  return (
    <div className="bg-white p-3 rounded shadow mb-2 border-l-4 border-gray-200 hover:shadow-md transition-all">
      <div className="font-bold text-gray-800">{task.content}</div>
      <div className="flex justify-between items-center mt-2 text-xs">
        {task.location ? (
           <span className="bg-gray-100 px-1 rounded text-gray-600">{task.location}</span>
        ) : <span></span>}
        <span className={`font-medium ${statusColor}`}>{statusText}</span>
      </div>
    </div>
  );
}