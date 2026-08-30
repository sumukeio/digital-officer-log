"use client";

import React from "react";
import { ManualSections, TrainingSection, DuduSection } from "@/lib/weekly-report/types";
import { DEFAULT_MANUAL_SECTIONS, EMPTY_MANUAL_SECTIONS } from "@/lib/weekly-report/report-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FileEdit,
  Plus,
  Trash2,
  Settings2,
  Wrench,
  MessageSquare,
  GraduationCap,
  Sparkles,
  Truck,
  Lightbulb,
  Eraser,
  RotateCcw,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";

interface ManualFormProps {
  manualSections: ManualSections;
  onChangeManualSections: (sections: ManualSections) => void;
  activeModules: Record<string, boolean>;
  onToggleModule: (moduleKey: string, enabled: boolean) => void;
}

const ALL_MODULE_KEYS = [
  { key: "production", label: "生产头条" },
  { key: "qc", label: "QC头条" },
  { key: "punch", label: "新随拍" },
  { key: "okr", label: "OKR" },
  { key: "inspection", label: "设备点检" },
  { key: "maintenance", label: "设备保养" },
  { key: "binying", label: "必应" },
  { key: "taskGrid", label: "任务格子" },
  { key: "training", label: "集体培训" },
  { key: "rewards", label: "激励" },
  { key: "bulletin", label: "公告栏" },
  { key: "inspectionGeneral", label: "综合点检" },
  { key: "dudu", label: "嘟嘟卡" },
  { key: "lean", label: "精益" },
  { key: "improvements", label: "系统改进建议" },
];

export function ManualForm({
  manualSections,
  onChangeManualSections,
  activeModules,
  onToggleModule,
}: ManualFormProps) {
  const updateField = (key: keyof ManualSections, value: any) => {
    onChangeManualSections({
      ...manualSections,
      [key]: value,
    });
  };

  const updateTraining = (key: keyof TrainingSection, value: any) => {
    onChangeManualSections({
      ...manualSections,
      training: {
        ...(manualSections.training || {
          theme: "",
          trainer: "",
          scoreOver90: 0,
          score80to89: 0,
          incentive: "",
          futureExamCenter: true,
        }),
        [key]: value,
      },
    });
  };

  const updateDudu = (key: keyof DuduSection, value: any) => {
    onChangeManualSections({
      ...manualSections,
      dudu: {
        ...(manualSections.dudu || {
          nightShift: "",
          planner: "",
          siteConsistency: "",
        }),
        [key]: value,
      },
    });
  };

  const handleAddImprovement = () => {
    const list = [...(manualSections.improvements || [])];
    list.push("");
    updateField("improvements", list);
  };

  const handleUpdateImprovement = (index: number, val: string) => {
    const list = [...(manualSections.improvements || [])];
    list[index] = val;
    updateField("improvements", list);
  };

  const handleRemoveImprovement = (index: number) => {
    const list = [...(manualSections.improvements || [])];
    list.splice(index, 1);
    updateField("improvements", list);
  };

  // 全局清空所有手写内容
  const handleClearAllManual = () => {
    onChangeManualSections(EMPTY_MANUAL_SECTIONS);
    toast.success("已清空全部手写与反思内容");
  };

  // 恢复默认预置草稿
  const handleResetToDefault = () => {
    onChangeManualSections(DEFAULT_MANUAL_SECTIONS);
    toast.success("已恢复预置参考草稿");
  };

  // 全选 / 全不选模块
  const handleSelectAllModules = (enable: boolean) => {
    ALL_MODULE_KEYS.forEach(({ key }) => {
      onToggleModule(key, enable);
    });
    toast.info(enable ? "已勾选全部 15 个模块" : "已取消勾选全部模块");
  };

  return (
    <div className="space-y-4">
      {/* 模块启用配置与全局操作栏 */}
      <Card className="border-slate-200 shadow-sm bg-slate-50/70">
        <CardHeader className="p-3 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-600" />
            <CardTitle className="text-xs font-bold text-slate-700">
              周报模块勾选配置（可自定义周报中包含哪些版块）
            </CardTitle>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelectAllModules(true)}
              className="h-7 text-[11px] px-2 text-slate-600 hover:text-blue-600"
            >
              <CheckSquare className="w-3 h-3 mr-1" /> 全选
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelectAllModules(false)}
              className="h-7 text-[11px] px-2 text-slate-600 hover:text-red-600"
            >
              <Square className="w-3 h-3 mr-1" /> 全不选
            </Button>
            <div className="h-3.5 w-px bg-slate-300 mx-0.5" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              className="h-7 text-[11px] px-2.5 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> 恢复参考草稿
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAllManual}
              className="h-7 text-[11px] px-2.5 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 font-medium"
            >
              <Trash2 className="w-3 h-3 mr-1" /> 清空全部手写内容
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2.5">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {ALL_MODULE_KEYS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100/60 select-none transition-colors"
              >
                <input
                  type="checkbox"
                  checked={activeModules[key] !== false}
                  onChange={(e) => onToggleModule(key, e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span className="text-slate-700 font-medium">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 手动填报与反思输入表单 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 左侧：反思与点检保养 */}
        <div className="space-y-4">
          {/* 1. 反思说明卡片 */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-blue-600" />
                头条与随拍反思说明
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChangeManualSections({
                    ...manualSections,
                    productionReflection: "",
                    qcReflection: "",
                    punchReflection: "",
                  });
                  toast.info("已清空头条与随拍反思说明");
                }}
                className="h-7 text-xs text-slate-500 hover:text-red-600 px-2"
                title="清空本卡片所有输入"
              >
                <Eraser className="w-3 h-3 mr-1" /> 清空本项
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {activeModules.production !== false && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">生产头条反思说明</Label>
                    {manualSections.productionReflection && (
                      <button
                        type="button"
                        onClick={() => updateField("productionReflection", "")}
                        className="text-[11px] text-slate-400 hover:text-red-500"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <Textarea
                    rows={2}
                    value={manualSections.productionReflection || ""}
                    onChange={(e) => updateField("productionReflection", e.target.value)}
                    placeholder="如：由于关闭企微提醒，开卡后无法主动提醒到责任人..."
                    className="mt-1 text-xs"
                  />
                </div>
              )}

              {activeModules.qc !== false && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">QC 头条反思说明</Label>
                    {manualSections.qcReflection && (
                      <button
                        type="button"
                        onClick={() => updateField("qcReflection", "")}
                        className="text-[11px] text-slate-400 hover:text-red-500"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <Textarea
                    rows={2}
                    value={manualSections.qcReflection || ""}
                    onChange={(e) => updateField("qcReflection", e.target.value)}
                    placeholder="如：反思：7条处理时间较长超过48小时未处理，已督促关卡。"
                    className="mt-1 text-xs"
                  />
                </div>
              )}

              {activeModules.punch !== false && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">新随拍提示/反思</Label>
                    {manualSections.punchReflection && (
                      <button
                        type="button"
                        onClick={() => updateField("punchReflection", "")}
                        className="text-[11px] text-slate-400 hover:text-red-500"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <Input
                    value={manualSections.punchReflection || ""}
                    onChange={(e) => updateField("punchReflection", e.target.value)}
                    placeholder="如：二部需继续进步。"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. 设备点检 & 保养 */}
          {(activeModules.inspection !== false || activeModules.maintenance !== false || activeModules.inspectionGeneral !== false) && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  设备点检与保养
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChangeManualSections({
                      ...manualSections,
                      inspection: "",
                      maintenance: "",
                      inspectionGeneral: "",
                    });
                    toast.info("已清空点检与保养内容");
                  }}
                  className="h-7 text-xs text-slate-500 hover:text-red-600 px-2"
                  title="清空点检与保养"
                >
                  <Eraser className="w-3 h-3 mr-1" /> 清空本项
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {activeModules.inspection !== false && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">设备点检情况</Label>
                      {manualSections.inspection && (
                        <button
                          type="button"
                          onClick={() => updateField("inspection", "")}
                          className="text-[11px] text-slate-400 hover:text-red-500"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <Input
                      value={manualSections.inspection || ""}
                      onChange={(e) => updateField("inspection", e.target.value)}
                      placeholder="如：一二三五七部都在正常使用。"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                )}
                {activeModules.maintenance !== false && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">设备保养情况</Label>
                      {manualSections.maintenance && (
                        <button
                          type="button"
                          onClick={() => updateField("maintenance", "")}
                          className="text-[11px] text-slate-400 hover:text-red-500"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <Input
                      value={manualSections.maintenance || ""}
                      onChange={(e) => updateField("maintenance", e.target.value)}
                      placeholder="如：一部五部八部九部正常使用。二部三部未见使用。下周当面督促。"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                )}
                {activeModules.inspectionGeneral !== false && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">综合点检情况</Label>
                      {manualSections.inspectionGeneral && (
                        <button
                          type="button"
                          onClick={() => updateField("inspectionGeneral", "")}
                          className="text-[11px] text-slate-400 hover:text-red-500"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <Input
                      value={manualSections.inspectionGeneral || ""}
                      onChange={(e) => updateField("inspectionGeneral", e.target.value)}
                      placeholder="如：各部门正常使用中。出现员工误操作、扫码失败的问题，已经处理解决。"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 3. 必应与任务格子 */}
          {(activeModules.binying !== false || activeModules.taskGrid !== false || activeModules.rewards !== false || activeModules.bulletin !== false) && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  必应、任务格子与公告激励
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChangeManualSections({
                      ...manualSections,
                      binying: "",
                      taskGrid: "",
                      rewards: "",
                      bulletin: "",
                    });
                    toast.info("已清空必应、任务格子与公告激励内容");
                  }}
                  className="h-7 text-xs text-slate-500 hover:text-red-600 px-2"
                >
                  <Eraser className="w-3 h-3 mr-1" /> 清空本项
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {activeModules.binying !== false && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">必应回复情况</Label>
                      {manualSections.binying && (
                        <button
                          type="button"
                          onClick={() => updateField("binying", "")}
                          className="text-[11px] text-slate-400 hover:text-red-500"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <Textarea
                      rows={2}
                      value={manualSections.binying || ""}
                      onChange={(e) => updateField("binying", e.target.value)}
                      placeholder="如：总体回复率较高，消息基本都有处理回复..."
                      className="mt-1 text-xs"
                    />
                  </div>
                )}
                {activeModules.taskGrid !== false && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">任务格子运行情况</Label>
                      {manualSections.taskGrid && (
                        <button
                          type="button"
                          onClick={() => updateField("taskGrid", "")}
                          className="text-[11px] text-slate-400 hover:text-red-500"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <Textarea
                      rows={2}
                      value={manualSections.taskGrid || ""}
                      onChange={(e) => updateField("taskGrid", e.target.value)}
                      placeholder="如：正常使用中，本周未出现过可分配工时异常问题..."
                      className="mt-1 text-xs"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {activeModules.rewards !== false && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700">激励板块</Label>
                        {manualSections.rewards && (
                          <button
                            type="button"
                            onClick={() => updateField("rewards", "")}
                            className="text-[11px] text-slate-400 hover:text-red-500"
                          >
                            清空
                          </button>
                        )}
                      </div>
                      <Input
                        value={manualSections.rewards || ""}
                        onChange={(e) => updateField("rewards", e.target.value)}
                        placeholder="如：正常使用中。"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                  )}
                  {activeModules.bulletin !== false && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700">公告栏</Label>
                        {manualSections.bulletin && (
                          <button
                            type="button"
                            onClick={() => updateField("bulletin", "")}
                            className="text-[11px] text-slate-400 hover:text-red-500"
                          >
                            清空
                          </button>
                        )}
                      </div>
                      <Input
                        value={manualSections.bulletin || ""}
                        onChange={(e) => updateField("bulletin", e.target.value)}
                        placeholder="如：目前已发布公告5篇，持续更新中。"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：集体培训、嘟嘟卡与系统改进建议 */}
        <div className="space-y-4">
          {/* 4. 集体培训 */}
          {activeModules.training !== false && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  集体培训与考试
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChangeManualSections({
                      ...manualSections,
                      training: {
                        theme: "",
                        trainer: "",
                        scoreOver90: 0,
                        score80to89: 0,
                        incentive: "",
                        futureExamCenter: false,
                      },
                    });
                    toast.info("已清空集体培训内容");
                  }}
                  className="h-7 text-xs text-slate-500 hover:text-red-600 px-2"
                >
                  <Eraser className="w-3 h-3 mr-1" /> 清空本项
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">培训主持人/讲师</Label>
                    <Input
                      value={manualSections.training?.trainer || ""}
                      onChange={(e) => updateTraining("trainer", e.target.value)}
                      placeholder="如：李建成总"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-700">培训主题</Label>
                    <Input
                      value={manualSections.training?.theme || ""}
                      onChange={(e) => updateTraining("theme", e.target.value)}
                      placeholder="如：夏季安全生产培训——用电专项培训"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">90分及以上人数</Label>
                    <Input
                      type="number"
                      value={manualSections.training?.scoreOver90 ?? 0}
                      onChange={(e) => updateTraining("scoreOver90", parseInt(e.target.value, 10) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-700">80分-89分人数</Label>
                    <Input
                      type="number"
                      value={manualSections.training?.score80to89 ?? 0}
                      onChange={(e) => updateTraining("score80to89", parseInt(e.target.value, 10) || 0)}
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-700">激励情况</Label>
                  <Input
                    value={manualSections.training?.incentive || ""}
                    onChange={(e) => updateTraining("incentive", e.target.value)}
                    placeholder="如：均已进行点赞送花激励"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. 嘟嘟卡 */}
          {activeModules.dudu !== false && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600" />
                  嘟嘟卡
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChangeManualSections({
                      ...manualSections,
                      dudu: {
                        nightShift: "",
                        planner: "",
                        siteConsistency: "",
                      },
                    });
                    toast.info("已清空嘟嘟卡内容");
                  }}
                  className="h-7 text-xs text-slate-500 hover:text-red-600 px-2"
                >
                  <Eraser className="w-3 h-3 mr-1" /> 清空本项
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div>
                  <Label className="text-xs font-medium text-slate-700">1) 夜班上线情况</Label>
                  <Input
                    value={manualSections.dudu?.nightShift || ""}
                    onChange={(e) => updateDudu("nightShift", e.target.value)}
                    placeholder="夜班人员下班前未做上线的情况未见发生，都会及时上线。"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-700">2) 计划员上传计划</Label>
                  <Input
                    value={manualSections.dudu?.planner || ""}
                    onChange={(e) => updateDudu("planner", e.target.value)}
                    placeholder="计划员基本都能及时上传计划。"
                    className="mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-700">3) 实际生产与嘟嘟计划一致性</Label>
                  <Textarea
                    rows={2}
                    value={manualSections.dudu?.siteConsistency || ""}
                    onChange={(e) => updateDudu("siteConsistency", e.target.value)}
                    placeholder="会出现嘟嘟计划中的产品与现场实际生产的产品不一致..."
                    className="mt-1 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. 系统改进建议 */}
          {activeModules.improvements !== false && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  系统改进建议清单
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateField("improvements", []);
                      toast.info("已清空所有改进建议");
                    }}
                    className="h-7 text-xs text-slate-500 hover:text-red-600 px-2"
                  >
                    <Eraser className="w-3 h-3 mr-1" /> 清空建议
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImprovement}
                    className="h-7 text-xs px-2"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> 添加建议
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(manualSections.improvements || []).length > 0 ? (
                  (manualSections.improvements || []).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-xs font-bold text-slate-500 mt-2">{idx + 1}、</span>
                      <Textarea
                        rows={2}
                        value={item}
                        onChange={(e) => handleUpdateImprovement(idx, e.target.value)}
                        placeholder={`建议 ${idx + 1}...`}
                        className="text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImprovement(idx)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    暂无手写改进建议，点击右上角「添加建议」或「恢复参考草稿」
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
