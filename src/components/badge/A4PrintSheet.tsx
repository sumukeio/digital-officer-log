import React from 'react';
import { BadgeItem, BadgeTemplateConfig } from '@/lib/badge/types';
import { BadgeCard } from './BadgeCard';

interface A4PrintSheetProps {
  badges: BadgeItem[];
  config: BadgeTemplateConfig;
  className?: string;
}

export function A4PrintSheet({ badges, config, className = '' }: A4PrintSheetProps) {
  const enabledBadges = badges.filter((b) => b.enabled);
  const cols = config.layoutCols || 3;
  const rows = config.layoutRows || 3;
  const itemsPerPage = cols * rows;

  // 分页切片
  const pages: BadgeItem[][] = [];
  for (let i = 0; i < enabledBadges.length; i += itemsPerPage) {
    pages.push(enabledBadges.slice(i, i + itemsPerPage));
  }

  if (pages.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-dashed">
        暂无勾选的工牌，请在左侧勾选需要打印的员工记录
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {pages.map((pageBadges, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page bg-white shadow-md mx-auto p-8 relative border border-slate-200"
          style={{
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
            pageBreakAfter: 'always',
          }}
        >
          {/* 页眉指示 (仅屏幕显示) */}
          <div className="print:hidden text-xs text-slate-400 pb-3 mb-4 border-b flex justify-between">
            <span>
              A4 拼版打印页 ({pageIdx + 1} / {pages.length})
            </span>
            <span>
              共 {pageBadges.length} 张工牌 · {cols}列 × {rows}行布局
            </span>
          </div>

          {/* 网格拼版区域 */}
          <div
            className="grid justify-center items-center gap-x-4 gap-y-4 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, max-content)`,
            }}
          >
            {pageBadges.map((badge, idx) => (
              <div key={badge.id || idx} className="relative group p-1">
                {/* 裁切对齐辅助十字线 */}
                {config.showCropMarks && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-2 h-2 border-t border-l border-slate-400 pointer-events-none" />
                    <div className="absolute -top-1.5 -right-1.5 w-2 h-2 border-t border-r border-slate-400 pointer-events-none" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-2 h-2 border-b border-l border-slate-400 pointer-events-none" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-2 h-2 border-b border-r border-slate-400 pointer-events-none" />
                  </>
                )}

                <BadgeCard badge={badge} config={config} isPrint={true} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 打印全局样式注入 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .a4-page,
          .a4-page * {
            visibility: visible;
          }
          .a4-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
