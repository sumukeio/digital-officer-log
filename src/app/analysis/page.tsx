"use client";

import { useState, useEffect } from "react";
// 引入刚才改好的 getUserAreas
import { getUserAreas, getAnalysisMetrics } from "@/app/actions/analysis"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// 引入图标美化界面
import { BarChart3, CheckCircle2, ListTodo } from "lucide-react";

// 定义数据类型
type Metrics = {
  totalTasks: number;
  completedTasks: number;
  completionRate: string | number;
};

export default function AnalysisPage() {
  const [areas, setAreas] = useState<string[]>([]); // 区域列表
  const [selectedArea, setSelectedArea] = useState("all"); // 当前选中
  const [data, setData] = useState<Metrics | null>(null); // 指标数据
  const [loading, setLoading] = useState(true);

  // 1. 初始化：加载【当前用户】的负责区域
  useEffect(() => {
    const init = async () => {
      try {
        const areaList = await getUserAreas();
        setAreas(areaList);
      } catch (e) {
        console.error("获取区域失败", e);
      }
    };
    init();
  }, []);

  // 2. 监听：选中区域变化时，加载对应数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 后端会根据 selectedArea 是 "all" 还是具体区域来返回数据
        const result = await getAnalysisMetrics(selectedArea);
        setData(result);
      } catch (err) {
        console.error("加载数据失败", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedArea]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* 顶部栏：标题 + 筛选器 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 关键指标趋势</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {selectedArea === 'all' 
              ? '您负责的所有区域数据汇总' 
              : `正在分析区域：${selectedArea}`}
          </p>
        </div>
        
        {/* 区域选择器 */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">筛选区域：</label>
          <select 
            value={selectedArea} 
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none min-w-[120px] cursor-pointer"
          >
            <option value="all">🌐 全部负责区域</option>
            {areas.length === 0 && <option disabled>暂无分配区域</option>}
            {areas.map(area => (
              <option key={area} value={area}>📍 {area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 数据展示区 */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* 卡片 1: 总任务 */}
           <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">
                 区域任务总数
               </CardTitle>
               <ListTodo className="h-4 w-4 text-blue-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-gray-900">{data.totalTasks}</div>
               <p className="text-xs text-gray-400 mt-1">
                 {selectedArea === 'all' ? '所有负责区域' : selectedArea} 产生的任务
               </p>
             </CardContent>
           </Card>

           {/* 卡片 2: 已完成 */}
           <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">
                 已完成任务
               </CardTitle>
               <CheckCircle2 className="h-4 w-4 text-green-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-gray-900">{data.completedTasks}</div>
               <p className="text-xs text-gray-400 mt-1">
                 按时交付与处理
               </p>
             </CardContent>
           </Card>

           {/* 卡片 3: 完成率 */}
           <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-gray-500">
                 任务完成率
               </CardTitle>
               <BarChart3 className="h-4 w-4 text-purple-500" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-gray-900">{data.completionRate}%</div>
               <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                 <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Number(data.completionRate) > 100 ? 100 : data.completionRate}%` }}
                 ></div>
               </div>
             </CardContent>
           </Card>
        </div>
      ) : (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">
            数据加载失败，请稍后重试
        </div>
      )}
    </div>
  );
}