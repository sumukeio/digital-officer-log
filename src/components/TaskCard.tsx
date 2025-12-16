"use client";

import { useState, useEffect } from 'react';
import { differenceInMinutes, addMinutes } from 'date-fns';

// 1. 接口定义：兼容 null (数据库空值) 和 undefined (可选属性)
interface TaskProps {
  task: {
    id: string;
    content: string;
    location?: string | null;
    // 这里加上 ? 是为了防止父组件传递 undefined
    // 加上 | null 是为了兼容 Prisma 数据库的空值
    startTime?: Date | string | null; 
    duration?: number | null;      
  };
}

export function TaskCard({ task }: TaskProps) {
  const [statusText, setStatusText] = useState("计算中...");
  // 给状态颜色加个默认背景色，视觉更明显
  const [statusColor, setStatusColor] = useState("text-gray-500");

  useEffect(() => {
    // ▼▼▼ 2. 核心修复：判空逻辑 ▼▼▼
    // 只要开始时间或时长没填 (null/undefined/0/空字符串)，就显示待定
    if (!task.startTime || !task.duration) {
      setStatusText("📅 时间待定");
      setStatusColor("text-slate-400 font-normal"); // 灰色，低调一点
      return;
    }

    const tick = () => {
      // 因为上面已经拦截了空值，这里可以用 ! 断言它肯定有值
      const now = new Date();
      const start = new Date(task.startTime!); 
      const end = addMinutes(start, task.duration!); 

      if (now < start) {
        // 1. 还没开始
        const diff = differenceInMinutes(start, now);
        // 优化显示：超过60分钟显示小时，否则显示分钟
        const display = diff > 60 
            ? `${Math.ceil(diff/60)}小时后` 
            : `${diff}分后`;
        setStatusText(`⏳ ${display}开始`);
        setStatusColor("text-blue-600 font-bold"); 
      } else if (now >= start && now <= end) {
        // 2. 进行中
        const left = differenceInMinutes(end, now);
        setStatusText(`🔥 剩余 ${left} 分钟`);
        setStatusColor("text-orange-600 font-bold"); 
      } else {
        // 3. 已超时
        const overdue = differenceInMinutes(now, end);
        setStatusText(`❌ 超时 ${overdue} 分钟`);
        setStatusColor("text-red-600 font-bold");
      }
    };

    // 立即执行一次
    tick();
    // 每分钟更新一次
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
        
        {/* 状态文字 */}
        <span className={`font-medium ${statusColor}`}>{statusText}</span>
      </div>
    </div>
  );
}