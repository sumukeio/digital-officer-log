'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeItem,
  BadgeTemplateConfig,
  DEFAULT_BADGE_CONFIG,
  DEFAULT_SAMPLE_BADGES,
} from '@/lib/badge/types';
import {
  parseBadgeExcel,
  generateBadgeExcelTemplate,
  convertUsersToBadges,
} from '@/lib/badge/excel-importer';
import { BadgeCard } from '@/components/badge/BadgeCard';
import { A4PrintSheet } from '@/components/badge/A4PrintSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Upload,
  Download,
  Printer,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Users,
  Eye,
  LayoutGrid,
  ShieldCheck,
  RotateCcw,
  Lock,
  Unlock,
  Sliders,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface BadgeClientProps {
  currentUser: {
    id: string;
    name: string | null;
    workId: string;
  };
  systemUsers?: Array<{
    id: string;
    name: string | null;
    workId: string;
    assignedAreas?: string | null;
  }>;
}

export default function BadgeClient({ systemUsers = [] }: BadgeClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const compInputRef = useRef<HTMLInputElement>(null);

  // 核心状态
  const [config, setConfig] = useState<BadgeTemplateConfig>(DEFAULT_BADGE_CONFIG);
  const [badges, setBadges] = useState<BadgeItem[]>(DEFAULT_SAMPLE_BADGES);
  const [selectedBadgeIndex, setSelectedBadgeIndex] = useState<number>(0);
  const [previewZoom, setPreviewZoom] = useState<number>(0.65);
  const [previewTab, setPreviewTab] = useState<'single' | 'a4'>('single');
  const [activeLeftTab, setActiveLeftTab] = useState<'design' | 'data'>('design');

  // 本地持久化加载
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('badge_layout_config_v2');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error('加载本地工牌配置失败:', e);
    }
  }, []);

  // 配置持久化保存
  const updateConfig = (updater: (prev: BadgeTemplateConfig) => BadgeTemplateConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('badge_layout_config_v2', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // 单条快速添加表单
  const [newBadgeForm, setNewBadgeForm] = useState<{
    name: string;
    department: string;
    post: string;
    workNo: string;
    entryDate: string;
  }>({
    name: '',
    department: '',
    post: '数字工程师',
    workNo: '',
    entryDate: new Date().toISOString().split('T')[0],
  });

  // 图片上传转 Base64
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'logoUrl' | 'compUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      updateConfig((prev) => ({ ...prev, [key]: base64 }));
      toast.success('已替换图片');
    };
    reader.readAsDataURL(file);
  };

  // 批量导入 Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const imported = parseBadgeExcel(buffer);
      if (imported.length > 0) {
        setBadges((prev) => [...prev, ...imported]);
        toast.success(`🎉 成功导入 ${imported.length} 条工牌数据！`);
      } else {
        toast.error('未在 Excel 中识别到有效数据');
      }
    } catch (err: any) {
      toast.error('解析 Excel 失败: ' + err?.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 下载 Excel 导入模板
  const handleDownloadTemplate = () => {
    try {
      const buffer = generateBadgeExcelTemplate();
      const blob = new Blob([buffer as any], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '工牌数据导入模板.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('已下载工牌 Excel 模板');
    } catch (err: any) {
      toast.error('下载模板失败: ' + err?.message);
    }
  };

  // 一键从系统数字官列表导入
  const handleSyncSystemUsers = () => {
    if (!systemUsers || systemUsers.length === 0) {
      toast.error('系统暂无其他在册数字官用户');
      return;
    }
    const converted = convertUsersToBadges(systemUsers);
    setBadges((prev) => {
      const existingWorkNos = new Set(prev.map((b) => b.workNo));
      const newItems = converted.filter((b) => !existingWorkNos.has(b.workNo));
      if (newItems.length === 0) {
        toast.info('系统数字官均已在工牌列表中');
        return prev;
      }
      toast.success(`已载入 ${newItems.length} 名系统在册数字官！`);
      return [...prev, ...newItems];
    });
  };

  // 添加单条
  const handleAddSingleBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeForm.name.trim()) {
      toast.error('请输入姓名');
      return;
    }

    const newBadge: BadgeItem = {
      id: `badge-${Date.now()}`,
      name: newBadgeForm.name.trim(),
      department: newBadgeForm.department.trim() || '—',
      post: newBadgeForm.post.trim() || '—',
      workNo: newBadgeForm.workNo.trim() || String(1000 + badges.length + 1),
      entryDate: newBadgeForm.entryDate.trim() || new Date().toISOString().split('T')[0],
      enabled: true,
    };

    setBadges((prev) => [...prev, newBadge]);
    setNewBadgeForm({
      name: '',
      department: '',
      post: '数字工程师',
      workNo: '',
      entryDate: new Date().toISOString().split('T')[0],
    });
    toast.success(`已添加【${newBadge.name}】`);
  };

  // 全选/全不选
  const handleToggleSelectAll = () => {
    const allSelected = badges.every((b) => b.enabled);
    setBadges((prev) => prev.map((b) => ({ ...b, enabled: !allSelected })));
  };

  // 单条切换
  const handleToggleBadge = (index: number) => {
    setBadges((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], enabled: !copy[index].enabled };
      return copy;
    });
  };

  // 删除单条
  const handleDeleteBadge = (index: number) => {
    setBadges((prev) => prev.filter((_, i) => i !== index));
    if (selectedBadgeIndex >= badges.length - 1) {
      setSelectedBadgeIndex(Math.max(0, badges.length - 2));
    }
  };

  // 调起打印
  const handlePrint = () => {
    const enabledCount = badges.filter((b) => b.enabled).length;
    if (enabledCount === 0) {
      toast.error('请至少勾选一张工牌进行打印');
      return;
    }
    setPreviewTab('a4');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const enabledBadges = badges.filter((b) => b.enabled);
  const activeBadge = badges[selectedBadgeIndex] || badges[0] || DEFAULT_SAMPLE_BADGES[0];

  // 渲染参数滑块控件
  const renderSlider = (
    label: string,
    val: number,
    min: number,
    max: number,
    onChange: (n: number) => void
  ) => {
    return (
      <div className="flex items-center gap-2 py-1 text-xs">
        <span className="w-14 text-slate-500 shrink-0">{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={val}
          disabled={config.isLocked}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <span className="w-10 font-mono text-slate-700 text-right shrink-0">{val}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col select-none">
      {/* 隐藏的文件输入组件 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={(e) => handleImageUpload(e, 'logoUrl')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={compInputRef}
        onChange={(e) => handleImageUpload(e, 'compUrl')}
        accept="image/*"
        className="hidden"
      />

      {/* 顶部导航 */}
      <nav className="bg-white border-b px-4 py-2.5 flex justify-between items-center sticky top-0 z-10 shadow-xs shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 工作台
          </Button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                万得福工牌设计器
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                自由参数调节 · 实时高保真预览 · A4 高精拼版
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateConfig(() => DEFAULT_BADGE_CONFIG);
              toast.success('已恢复万得福经典满意配置');
            }}
            className="text-slate-600 border-slate-200 hover:bg-slate-50 text-xs hidden sm:flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 恢复默认参数
          </Button>

          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" /> 打印 / 导出 PDF ({enabledBadges.length})
          </Button>
        </div>
      </nav>

      {/* 主布局 */}
      <main className="container mx-auto p-4 max-w-[1600px] flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 print:block print:p-0">
        {/* 左侧：双 Tab 控制面板 (样式设计 / 数据处理) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 print:hidden">
          <Tabs
            value={activeLeftTab}
            onValueChange={(v: any) => setActiveLeftTab(v)}
            className="w-full flex-1 flex flex-col"
          >
            <TabsList className="grid grid-cols-2 bg-slate-200/80 p-1 rounded-lg">
              <TabsTrigger value="design" className="text-xs flex items-center gap-1.5 font-medium">
                <Sliders className="w-3.5 h-3.5 text-blue-600" /> 样式设计
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs flex items-center gap-1.5 font-medium">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 数据处理 (
                {badges.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 样式设计面板 */}
            <TabsContent value="design" className="mt-3 flex-1">
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                {/* 顶部锁定条 (还原原版经典设计) */}
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
                    config.isLocked ? 'bg-amber-50/80 border-amber-200' : 'bg-blue-50/80 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {config.isLocked ? (
                      <Lock className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-slate-800">
                      {config.isLocked ? '🔒 设计已锁定 (防止误触)' : '🔓 自由编辑模式'}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={config.isLocked ? 'outline' : 'default'}
                    onClick={() => {
                      updateConfig((prev) => ({ ...prev, isLocked: !prev.isLocked }));
                      toast.info(config.isLocked ? '已解锁参数编辑' : '已锁定设计防误触');
                    }}
                    className="h-7 text-xs px-3"
                  >
                    {config.isLocked ? '解锁设计' : '锁定设计'}
                  </Button>
                </div>

                {/* 滚动调节区域 */}
                <CardContent className="p-4 space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto">
                  {/* 分组 1: 左上角 Logo */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-xs font-bold text-slate-800">左上角 Logo</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={config.isLocked}
                        onClick={() => logoInputRef.current?.click()}
                        className="h-6 px-2 text-[11px] bg-white border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" /> 替换 Logo 图
                      </Button>
                    </div>
                    {renderSlider('X 轴:', config.logoX, 0, 600, (v) =>
                      updateConfig((p) => ({ ...p, logoX: v }))
                    )}
                    {renderSlider('Y 轴:', config.logoY, 0, 500, (v) =>
                      updateConfig((p) => ({ ...p, logoY: v }))
                    )}
                    {renderSlider('Size 大小:', config.logoSize, 20, 300, (v) =>
                      updateConfig((p) => ({ ...p, logoSize: v }))
                    )}
                  </div>

                  {/* 分组 2: 公司标志 / 字标 */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="text-xs font-bold text-slate-800">公司标志 / 字标</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={config.isLocked}
                        onClick={() => compInputRef.current?.click()}
                        className="h-6 px-2 text-[11px] bg-white border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" /> 替换字标图
                      </Button>
                    </div>
                    {renderSlider('X 轴:', config.compX, 0, 600, (v) =>
                      updateConfig((p) => ({ ...p, compX: v }))
                    )}
                    {renderSlider('Y 轴:', config.compY, 0, 500, (v) =>
                      updateConfig((p) => ({ ...p, compY: v }))
                    )}
                    {renderSlider('高 度:', config.compH, 20, 300, (v) =>
                      updateConfig((p) => ({ ...p, compH: v }))
                    )}
                  </div>

                  {/* 分组 3: 二维码 */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-800 block border-b pb-1.5">
                      右上角二维码
                    </span>
                    {renderSlider('X 轴:', config.qrX, 0, 600, (v) =>
                      updateConfig((p) => ({ ...p, qrX: v }))
                    )}
                    {renderSlider('Y 轴:', config.qrY, 0, 500, (v) =>
                      updateConfig((p) => ({ ...p, qrY: v }))
                    )}
                    {renderSlider('Size 大小:', config.qrSize, 20, 300, (v) =>
                      updateConfig((p) => ({ ...p, qrSize: v }))
                    )}
                  </div>

                  {/* 分组 4: 照片框 */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-800 block border-b pb-1.5">
                      员工照片框
                    </span>
                    {renderSlider('X 轴:', config.photoX, 0, 600, (v) =>
                      updateConfig((p) => ({ ...p, photoX: v }))
                    )}
                    {renderSlider('Y 轴:', config.photoY, 0, 800, (v) =>
                      updateConfig((p) => ({ ...p, photoY: v }))
                    )}
                    {renderSlider('宽 度:', config.photoW, 50, 400, (v) =>
                      updateConfig((p) => ({ ...p, photoW: v }))
                    )}
                    {renderSlider('高 度:', config.photoH, 50, 500, (v) =>
                      updateConfig((p) => ({ ...p, photoH: v }))
                    )}
                  </div>

                  {/* 分组 5: 底部文字与下划线 */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-800 block border-b pb-1.5">
                      底部中英双语文字与下划线
                    </span>
                    {renderSlider('起始 Y:', config.textStartY, 400, 900, (v) =>
                      updateConfig((p) => ({ ...p, textStartY: v }))
                    )}
                    {renderSlider('行 距:', config.textLineH, 30, 120, (v) =>
                      updateConfig((p) => ({ ...p, textLineH: v }))
                    )}
                    {renderSlider('标签 X:', config.textLabelX, 0, 300, (v) =>
                      updateConfig((p) => ({ ...p, textLabelX: v }))
                    )}
                    {renderSlider('数值 X:', config.textValueX, 100, 400, (v) =>
                      updateConfig((p) => ({ ...p, textValueX: v }))
                    )}
                    {renderSlider('数值宽:', config.textValueW, 100, 450, (v) =>
                      updateConfig((p) => ({ ...p, textValueW: v }))
                    )}
                    {renderSlider('字 号:', config.fontSize, 16, 60, (v) =>
                      updateConfig((p) => ({ ...p, fontSize: v }))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: 数据处理面板 */}
            <TabsContent value="data" className="mt-3 flex-1 space-y-3">
              {/* 快速录入单人 */}
              <Card className="border-0 shadow-sm bg-white p-3.5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-blue-600" /> 快速录入单张工牌
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="h-6 px-2 text-[11px] border-slate-200"
                    >
                      <Download className="w-3 h-3 mr-1" /> 模板
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-6 px-2 text-[11px] bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Upload className="w-3 h-3 mr-1" /> 导入 Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncSystemUsers}
                      className="h-6 px-2 text-[11px] text-slate-700 border-slate-200"
                    >
                      <Users className="w-3 h-3 mr-1 text-blue-600" /> 载入数字官
                    </Button>
                  </div>
                </div>

                <form onSubmit={handleAddSingleBadge} className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px] text-slate-500">姓名 *</Label>
                    <Input
                      placeholder="李四"
                      value={newBadgeForm.name}
                      onChange={(e) =>
                        setNewBadgeForm({ ...newBadgeForm, name: e.target.value })
                      }
                      className="h-7 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">部门</Label>
                    <Input
                      placeholder="技术部"
                      value={newBadgeForm.department}
                      onChange={(e) =>
                        setNewBadgeForm({ ...newBadgeForm, department: e.target.value })
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">岗位</Label>
                    <Input
                      placeholder="工程师"
                      value={newBadgeForm.post}
                      onChange={(e) =>
                        setNewBadgeForm({ ...newBadgeForm, post: e.target.value })
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">工号</Label>
                    <Input
                      placeholder="1001"
                      value={newBadgeForm.workNo}
                      onChange={(e) =>
                        setNewBadgeForm({ ...newBadgeForm, workNo: e.target.value })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500">入职日期</Label>
                    <Input
                      type="date"
                      value={newBadgeForm.entryDate}
                      onChange={(e) =>
                        setNewBadgeForm({ ...newBadgeForm, entryDate: e.target.value })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> 添加到列表
                    </Button>
                  </div>
                </form>
              </Card>

              {/* 批量人员列表 */}
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <div className="p-2.5 border-b flex justify-between items-center bg-slate-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSelectAll}
                    className="h-6 px-2 text-xs text-slate-600 hover:text-blue-600"
                  >
                    {badges.every((b) => b.enabled) ? (
                      <CheckSquare className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    )}
                    全选 ({enabledBadges.length}/{badges.length})
                  </Button>
                  <span className="text-[11px] text-slate-400">点击查看预览</span>
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5 w-8 text-center">打</th>
                        <th className="py-2 px-2">姓名</th>
                        <th className="py-2 px-2">部门</th>
                        <th className="py-2 px-2">工号</th>
                        <th className="py-2 px-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {badges.map((badge, idx) => (
                        <tr
                          key={badge.id || idx}
                          onClick={() => setSelectedBadgeIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            selectedBadgeIndex === idx
                              ? 'bg-blue-50/90 font-bold text-blue-900'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td
                            className="py-2 px-2.5 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBadge(idx);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={badge.enabled}
                              onChange={() => handleToggleBadge(idx)}
                              className="rounded border-slate-300 text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-2">{badge.name}</td>
                          <td className="py-2 px-2 text-slate-500 truncate max-w-[90px]">
                            {badge.department}
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-600">{badge.workNo}</td>
                          <td className="py-2 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBadge(idx);
                              }}
                              className="h-5 w-5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧：超大实时画布与 A4 拼版 (还原原版视窗比例) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <Tabs
            value={previewTab}
            onValueChange={(v: any) => setPreviewTab(v)}
            className="w-full flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between print:hidden">
              <TabsList className="bg-slate-200/80 p-1 rounded-lg">
                <TabsTrigger value="single" className="text-xs flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> 1:1 单卡实时预览
                </TabsTrigger>
                <TabsTrigger value="a4" className="text-xs flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" /> A4 拼版多页视图 ({Math.ceil(enabledBadges.length / 9)}页)
                </TabsTrigger>
              </TabsList>

              {/* 缩放条 (与原版底部缩放一致) */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>视图缩放:</span>
                <input
                  type="range"
                  min="0.3"
                  max="1.1"
                  step="0.05"
                  value={previewZoom}
                  onChange={(e) => setPreviewZoom(Number(e.target.value))}
                  className="w-24 accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
                <span className="w-8 font-mono text-right">{Math.round(previewZoom * 100)}%</span>
              </div>
            </div>

            {/* 单卡 1:1 预览画布 */}
            <TabsContent value="single" className="mt-3 flex-1 flex flex-col print:hidden">
              <Card className="border-0 shadow-sm bg-white p-6 flex-1 flex flex-col items-center justify-center min-h-[640px] relative overflow-hidden bg-dot-grid">
                <div className="absolute top-3 left-4 text-xs text-slate-400">
                  当前渲染：<span className="font-bold text-slate-700">{activeBadge.name}</span> ({activeBadge.workNo})
                </div>

                <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
                  <BadgeCard
                    badge={activeBadge}
                    config={config}
                    scale={previewZoom}
                    className="transition-all duration-75"
                  />
                </div>

                <div className="text-[11px] text-slate-400 mt-4">
                  基准像素：600 × 1000 px · 物理尺寸：{config.badgeWidthMm}mm × {config.badgeHeightMm}mm
                </div>
              </Card>
            </TabsContent>

            {/* A4 拼版预览 */}
            <TabsContent value="a4" className="mt-3 flex-1">
              <div className="p-4 bg-slate-200/70 rounded-xl max-h-[750px] overflow-y-auto print:p-0 print:bg-white print:max-h-none">
                <A4PrintSheet badges={badges} config={config} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
