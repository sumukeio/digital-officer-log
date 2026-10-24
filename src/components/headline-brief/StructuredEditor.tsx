"use client";

import React from "react";
import { HeadlineModule, HeadlineProblem } from "@/lib/headline-brief/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface StructuredEditorProps {
  module: HeadlineModule;
  onChange: (next: HeadlineModule) => void;
}

export function StructuredEditor({ module, onChange }: StructuredEditorProps) {
  const updateProblem = (index: number, patch: Partial<HeadlineProblem>) => {
    const problems = module.problems.map((p, i) =>
      i === index ? { ...p, ...patch } : p
    );
    onChange({ ...module, problems });
  };

  const updateEvidence = (pIndex: number, eIndex: number, value: string) => {
    const problems = module.problems.map((p, i) => {
      if (i !== pIndex) return p;
      const evidence = [...p.evidence];
      evidence[eIndex] = value;
      return { ...p, evidence };
    });
    onChange({ ...module, problems });
  };

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <Label>模块标题</Label>
          <Input
            value={module.moduleTitle}
            onChange={(e) => onChange({ ...module, moduleTitle: e.target.value })}
          />
        </div>
        <div className="w-40">
          <Label>模块类型</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={module.moduleKey}
            onChange={(e) =>
              onChange({
                ...module,
                moduleKey: e.target.value as HeadlineModule["moduleKey"],
              })
            }
          >
            <option value="production">生产头条</option>
            <option value="qc">QC头条</option>
            <option value="custom">自定义</option>
          </select>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">一、问题</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={module.problems.length >= 3}
            onClick={() =>
              onChange({
                ...module,
                problems: [...module.problems, { title: "", evidence: [] }],
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> 添加问题
          </Button>
        </div>
        {module.problems.map((p, pi) => (
          <div key={pi} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="结论句（含占比/数量）"
                value={p.title}
                onChange={(e) => updateProblem(pi, { title: e.target.value })}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...module,
                    problems: module.problems.filter((_, i) => i !== pi),
                  })
                }
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
            {p.evidence.map((ev, ei) => (
              <div key={ei} className="flex gap-2 pl-2">
                <Input
                  placeholder="证据/关键词"
                  value={ev}
                  onChange={(e) => updateEvidence(pi, ei, e.target.value)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    updateProblem(pi, {
                      evidence: p.evidence.filter((_, i) => i !== ei),
                    })
                  }
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            ))}
            {p.evidence.length < 4 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateProblem(pi, { evidence: [...p.evidence, ""] })
                }
              >
                <Plus className="w-3 h-3 mr-1" /> 证据
              </Button>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">二、改善</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={module.actions.length >= 4}
            onClick={() =>
              onChange({ ...module, actions: [...module.actions, ""] })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> 添加改善
          </Button>
        </div>
        {module.actions.map((a, ai) => (
          <div key={ai} className="flex gap-2">
            <Input
              placeholder="动作 + 对象 + 防再发机制"
              value={a}
              onChange={(e) => {
                const actions = [...module.actions];
                actions[ai] = e.target.value;
                onChange({ ...module, actions });
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                onChange({
                  ...module,
                  actions: module.actions.filter((_, i) => i !== ai),
                })
              }
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-800">三、收益</h3>
        <div className="grid gap-2">
          <div>
            <Label>生产</Label>
            <Input
              value={module.benefits.production}
              onChange={(e) =>
                onChange({
                  ...module,
                  benefits: { ...module.benefits, production: e.target.value },
                })
              }
            />
          </div>
          <div>
            <Label>质量</Label>
            <Input
              value={module.benefits.quality}
              onChange={(e) =>
                onChange({
                  ...module,
                  benefits: { ...module.benefits, quality: e.target.value },
                })
              }
            />
          </div>
          <div>
            <Label>管理</Label>
            <Input
              value={module.benefits.management}
              onChange={(e) =>
                onChange({
                  ...module,
                  benefits: { ...module.benefits, management: e.target.value },
                })
              }
            />
          </div>
        </div>
        <div>
          <Label>说明（可选）</Label>
          <Textarea
            rows={2}
            value={module.note || ""}
            onChange={(e) => onChange({ ...module, note: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={module.quantified}
            onChange={(e) => onChange({ ...module, quantified: e.target.checked })}
          />
          已有量化字段（勾选后不再强制「定性」提示）
        </label>
      </section>
    </div>
  );
}
