"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DateRangeInfo } from "@/lib/weekly-report/types";
import { getDefaultWeekRange } from "@/lib/weekly-report/date-helper";
import {
  HeadlineModule,
  HEADLINE_BRIEF_LIMITS,
  createEmptyModule,
  distillHeadlineMarkdown,
  generateMergedMarkdown,
  validateHeadlineBrief,
  hasBlockingErrors,
  mergeSkeletonIntoModule,
} from "@/lib/headline-brief";
import { StructuredEditor } from "@/components/headline-brief/StructuredEditor";
import { PosterExport } from "@/components/headline-brief/PosterExport";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ClipboardCopy,
  Save,
  Send,
  Sparkles,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  saveHeadlineBrief,
  getHeadlineBriefByPeriod,
  pushHeadlineBriefToWecom,
  getProblemSkeletonFromWeeklyReport,
} from "@/app/actions/headline-brief";

interface HeadlineBriefClientProps {
  currentUser: { id: string; name: string | null; workId: string };
  initialDateRange: DateRangeInfo;
  initialWebhookUrl: string;
}

export default function HeadlineBriefClient({
  currentUser,
  initialDateRange,
  initialWebhookUrl,
}: HeadlineBriefClientProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [rawText, setRawText] = useState("");
  const [modules, setModules] = useState<HeadlineModule[]>([
    createEmptyModule("production"),
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [briefId, setBriefId] = useState<string | undefined>();
  const [webhookUrl] = useState(initialWebhookUrl);
  const [pushMode, setPushMode] = useState<"merged" | "split">("merged");
  const [busy, setBusy] = useState(false);
  /** 方案 A：最终稿（推送/复制/保存用），可与结构生成稿分离 */
  const [finalMarkdown, setFinalMarkdown] = useState("");
  const [previewDirty, setPreviewDirty] = useState(false);
  const [showRendered, setShowRendered] = useState(false);

  const activeModule = modules[activeIndex] || modules[0];

  const structuredMarkdown = useMemo(
    () =>
      generateMergedMarkdown({
        year: dateRange.year,
        weekNumber: dateRange.weekNumber,
        titleFormatted: dateRange.titleFormatted,
        modules,
      }),
    [dateRange, modules]
  );

  const issues = useMemo(() => validateHeadlineBrief(modules), [modules]);

  const buildMarkdown = (mods: HeadlineModule[], range = dateRange) =>
    generateMergedMarkdown({
      year: range.year,
      weekNumber: range.weekNumber,
      titleFormatted: range.titleFormatted,
      modules: mods,
    });

  const applyModules = (next: HeadlineModule[], syncFinal = true) => {
    setModules(next);
    if (syncFinal) {
      setFinalMarkdown(buildMarkdown(next));
      setPreviewDirty(false);
    }
  };

  // 切换周期时回显历史
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getHeadlineBriefByPeriod(
        dateRange.year,
        dateRange.weekNumber
      );
      if (cancelled) return;
      if (saved) {
        try {
          const parsed = JSON.parse(saved.modules) as HeadlineModule[];
          const mods = parsed.length ? parsed : [createEmptyModule("production")];
          setModules(mods);
          setRawText(saved.rawSource || "");
          setBriefId(saved.id);
          // 优先使用已保存的最终稿（可能含人工微调）
          setFinalMarkdown(
            saved.markdownContent || buildMarkdown(mods, dateRange)
          );
          setPreviewDirty(
            Boolean(
              saved.markdownContent &&
                saved.markdownContent !== buildMarkdown(mods, dateRange)
            )
          );
        } catch {
          toast.error("历史简报解析失败，已重置为空草稿");
          applyModules([createEmptyModule("production")]);
          setBriefId(undefined);
          setRawText("");
        }
      } else {
        applyModules([createEmptyModule("production")]);
        setRawText("");
        setBriefId(undefined);
      }
      setActiveIndex(0);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.year, dateRange.weekNumber]);

  const shiftWeek = (offset: number) => {
    const d = new Date(dateRange.startDate);
    d.setDate(d.getDate() + offset * 7);
    setDateRange(getDefaultWeekRange(d));
  };

  const handleDistill = () => {
    if (!rawText.trim()) {
      toast.error("请先粘贴 DeepSeek 长文");
      return;
    }
    const drafted = distillHeadlineMarkdown(rawText, {
      moduleKey: activeModule.moduleKey,
      moduleTitle: activeModule.moduleTitle,
    });
    const nextMod = {
      ...drafted,
      actions: drafted.actions.length ? drafted.actions : activeModule.actions,
      benefits:
        drafted.benefits.production ||
        drafted.benefits.quality ||
        drafted.benefits.management
          ? drafted.benefits
          : activeModule.benefits,
    };
    const copy = [...modules];
    copy[activeIndex] = nextMod;
    applyModules(copy, true);
    toast.success("已提炼为结构化草稿，请人工改稿确认");
  };

  const handleSkeleton = async () => {
    setBusy(true);
    try {
      const res = await getProblemSkeletonFromWeeklyReport(
        dateRange.year,
        dateRange.weekNumber,
        activeModule.moduleKey === "custom" ? "production" : activeModule.moduleKey
      );
      if (!res.success || !res.module) {
        toast.error(res.message);
        return;
      }
      const merged = mergeSkeletonIntoModule(activeModule, res.module);
      const copy = [...modules];
      copy[activeIndex] = merged;
      applyModules(copy, true);
      toast.success(res.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPreview = () => {
    setFinalMarkdown(structuredMarkdown);
    setPreviewDirty(false);
    toast.success("已重置为结构生成稿");
  };

  const handleSave = async () => {
    if (hasBlockingErrors(issues)) {
      toast.error("请先修正硬约束错误后再保存");
      return;
    }
    if (!finalMarkdown.trim()) {
      toast.error("最终稿为空，无法保存");
      return;
    }
    setBusy(true);
    try {
      const res = await saveHeadlineBrief({
        title: `${dateRange.titleFormatted} 头条周简报`,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        weekNumber: dateRange.weekNumber,
        year: dateRange.year,
        modules,
        rawSource: rawText || undefined,
        markdownContent: finalMarkdown,
        briefId,
      });
      if (res.success) {
        setBriefId(res.id);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalMarkdown);
    toast.success("已复制最终稿 Markdown");
  };

  const handlePush = async () => {
    if (!finalMarkdown.trim()) {
      toast.error("内容为空，无法推送");
      return;
    }
    if (hasBlockingErrors(issues)) {
      toast.error("请先修正硬约束错误");
      return;
    }
    setBusy(true);
    try {
      if (pushMode === "split") {
        for (const m of modules) {
          const part = buildMarkdown([m]);
          const res = await pushHeadlineBriefToWecom({
            briefId,
            markdownContent: part,
            webhookUrl,
          });
          if (!res.success) {
            toast.error(`${m.moduleTitle} 推送失败：${res.message}`);
            return;
          }
        }
        toast.success("已分模块推送到企微群");
      } else {
        const res = await pushHeadlineBriefToWecom({
          briefId,
          markdownContent: finalMarkdown,
          webhookUrl,
        });
        if (res.success) toast.success(res.message);
        else toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50/40">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">头条周简报</h1>
            <p className="text-xs text-slate-500">
              问题—改善—收益 · {currentUser.name || currentUser.workId}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-white px-1">
            <Button variant="ghost" size="icon" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-sm font-medium text-slate-700">
              第{dateRange.weekNumber}周 {dateRange.titleFormatted}
            </span>
            <Button variant="ghost" size="icon" onClick={() => shiftWeek(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(getDefaultWeekRange(new Date()))}
            >
              本周
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">粘贴 DeepSeek 长文</Label>
              <Button type="button" size="sm" onClick={handleDistill}>
                <Sparkles className="w-4 h-4 mr-1" /> 规则提炼
              </Button>
            </div>
            <Textarea
              rows={10}
              placeholder="粘贴含「一、问题 / 二、改善 / 三、收益」的长文…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={handleSkeleton}
              >
                <Wand2 className="w-4 h-4 mr-1" /> 从指标周报生成问题骨架
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = [...modules, createEmptyModule("qc")];
                  applyModules(next, true);
                  setActiveIndex(modules.length);
                }}
              >
                <Layers className="w-4 h-4 mr-1" /> 添加 QC/模块
              </Button>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            {modules.map((m, i) => (
              <Button
                key={i}
                type="button"
                size="sm"
                variant={i === activeIndex ? "default" : "outline"}
                onClick={() => setActiveIndex(i)}
              >
                {m.moduleTitle}
              </Button>
            ))}
            {modules.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => {
                  if (modules.length <= 1) return;
                  const next = modules.filter((_, i) => i !== activeIndex);
                  applyModules(next, true);
                  setActiveIndex(Math.max(0, activeIndex - 1));
                }}
              >
                删除当前模块
              </Button>
            )}
          </div>

          {activeModule && (
            <StructuredEditor
              module={activeModule}
              onChange={(next) => {
                const copy = [...modules];
                copy[activeIndex] = next;
                applyModules(copy, true);
              }}
            />
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-800">最终稿 / 推送</h2>
                <p className="text-xs text-slate-500">
                  可直接改右侧文案（不回写左侧结构）
                  {previewDirty ? " · 已手动微调" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className="h-9 rounded-md border px-2 text-sm"
                  value={pushMode}
                  onChange={(e) =>
                    setPushMode(e.target.value as "merged" | "split")
                  }
                >
                  <option value="merged">合并推送</option>
                  <option value="split">分模块推送</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRendered((v) => !v)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showRendered ? "编辑源码" : "渲染预览"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPreview}
                  disabled={!previewDirty && finalMarkdown === structuredMarkdown}
                >
                  <RotateCcw className="w-4 h-4 mr-1" /> 重置为结构稿
                </Button>
                <Button type="button" variant="outline" onClick={handleCopy}>
                  <ClipboardCopy className="w-4 h-4 mr-1" /> 复制
                </Button>
                {activeModule && (
                  <PosterExport
                    modules={modules}
                    activeModule={activeModule}
                    titleFormatted={dateRange.titleFormatted}
                    weekNumber={dateRange.weekNumber}
                  />
                )}
                <Button type="button" disabled={busy} onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" /> 保存
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handlePush}
                >
                  <Send className="w-4 h-4 mr-1" /> 推送企微
                </Button>
              </div>
            </div>

            {issues.length > 0 && (
              <ul className="mb-3 space-y-1 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                {issues.map((iss, i) => (
                  <li key={i}>
                    [{iss.level === "error" ? "错误" : "提示"}] {iss.message}
                  </li>
                ))}
              </ul>
            )}

            {showRendered ? (
              <div className="max-h-[70vh] overflow-auto rounded-lg border bg-slate-50 p-4 prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{finalMarkdown || "_暂无内容_"}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                rows={22}
                value={finalMarkdown}
                onChange={(e) => {
                  setFinalMarkdown(e.target.value);
                  setPreviewDirty(true);
                }}
                className="max-h-[70vh] font-mono text-xs leading-relaxed"
                placeholder="结构提炼或改稿后的最终 Markdown 会出现在这里，可直接编辑…"
              />
            )}
            <p className="mt-2 text-xs text-slate-400">
              约 {finalMarkdown.length} 字 · 建议 ≤ {HEADLINE_BRIEF_LIMITS.maxMarkdownChars}
              {finalMarkdown.length > HEADLINE_BRIEF_LIMITS.maxMarkdownChars
                ? "（已超建议上限）"
                : ""}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
