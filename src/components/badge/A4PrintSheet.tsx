import React from 'react';
import { BadgeItem, BadgeTemplateConfig } from '@/lib/badge/types';
import { BadgeCard } from './BadgeCard';
import { getBadgePdfLayout } from '@/lib/badge/pdf-layout';

interface A4PrintSheetProps {
  badges: BadgeItem[];
  config: BadgeTemplateConfig;
  className?: string;
}

/**
 * A4 拼版预览 — 几何与参考 PDF（无卡间 gap、页边距居中）一致
 * 正式交付请走 exportBadgesPdf，本组件仅屏幕预览
 */
export function A4PrintSheet({ badges, config, className = '' }: A4PrintSheetProps) {
  const enabledBadges = badges.filter((b) => b.enabled);
  const layout = getBadgePdfLayout(config.layoutCols || 3, config.layoutRows || 3);
  const { cols, rows, itemsPerPage, marginLeftMm, marginTopMm, badgeWMm, badgeHMm } = layout;

  const pages: BadgeItem[][] = [];
  for (let i = 0; i < enabledBadges.length; i += itemsPerPage) {
    pages.push(enabledBadges.slice(i, i + itemsPerPage));
  }

  if (pages.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-lg border border-dashed">
        暂无勾选的工牌，请在左侧勾选需要导出的员工记录
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {pages.map((pageBadges, pageIdx) => (
        <div
          key={pageIdx}
          className="a4-page bg-white shadow-md mx-auto relative border border-slate-200"
          style={{
            width: '210mm',
            height: '297mm',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div className="absolute top-2 left-0 right-0 text-xs text-slate-400 px-4 flex justify-between pointer-events-none">
            <span>
              A4 拼版预览 ({pageIdx + 1} / {pages.length}) · 与导出 PDF 同版式
            </span>
            <span>
              {pageBadges.length} 张 · {cols}×{rows} · 单卡 {badgeWMm}×{badgeHMm}mm
            </span>
          </div>

          {pageBadges.map((badge, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const leftMm = marginLeftMm + col * badgeWMm;
            const topMm = marginTopMm + row * badgeHMm;

            return (
              <div
                key={badge.id || idx}
                className="absolute"
                style={{
                  left: `${leftMm}mm`,
                  top: `${topMm}mm`,
                  width: `${badgeWMm}mm`,
                  height: `${badgeHMm}mm`,
                }}
              >
                {config.showCropMarks && (
                  <>
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-slate-400 pointer-events-none" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-slate-400 pointer-events-none" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-slate-400 pointer-events-none" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-slate-400 pointer-events-none" />
                  </>
                )}
                <BadgeCard badge={badge} config={config} isPrint={true} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
