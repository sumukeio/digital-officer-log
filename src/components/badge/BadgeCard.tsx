import React from 'react';
import { BadgeItem, BadgeTemplateConfig } from '@/lib/badge/types';
import { QRCodeSVG } from './QRCodeSVG';
import { User } from 'lucide-react';

interface BadgeCardProps {
  badge: BadgeItem;
  config: BadgeTemplateConfig;
  scale?: number;
  className?: string;
  isPrint?: boolean;
}

export function BadgeCard({
  badge,
  config,
  scale = 0.5,
  className = '',
  isPrint = false,
}: BadgeCardProps) {
  // 基准画布比例转换: 600px 对应实际宽度
  // 在打印模式下，物理尺寸为 badgeWidthMm (54mm) x badgeHeightMm (90mm)
  const baseW = config.canvasW || 600;
  const baseH = config.canvasH || 1000;

  // 缩放系数
  const r = isPrint ? 1 : scale;
  const cardWidthPx = isPrint ? undefined : baseW * r;
  const cardHeightPx = isPrint ? undefined : baseH * r;

  const items = [
    { label: '姓名Name:', value: badge.name || '' },
    { label: '部门Dept:', value: badge.department || '' },
    { label: '职务Post:', value: badge.post || '' },
    { label: '工号  No:', value: badge.workNo || '' },
    { label: '入职日期:', value: badge.entryDate || '' },
  ];

  return (
    <div
      className={`relative bg-white border border-slate-300 shadow-sm overflow-hidden select-none ${className}`}
      style={{
        width: isPrint ? `${config.badgeWidthMm}mm` : `${cardWidthPx}px`,
        height: isPrint ? `${config.badgeHeightMm}mm` : `${cardHeightPx}px`,
        maxWidth: isPrint ? `${config.badgeWidthMm}mm` : undefined,
        maxHeight: isPrint ? `${config.badgeHeightMm}mm` : undefined,
        boxSizing: 'border-box',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    >
      {/* 内部绝对坐标定位容器 (基于 600 x 1000 相对缩放) */}
      <div
        className="absolute inset-0"
        style={{
          transform: isPrint
            ? `scale(${(config.badgeWidthMm / (baseW / 3.7795))})`
            : undefined,
          transformOrigin: 'top left',
          width: isPrint ? `${baseW}px` : undefined,
          height: isPrint ? `${baseH}px` : undefined,
        }}
      >
        {/* 1. 左上角 Logo */}
        {config.logoShow && config.logoUrl && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: isPrint ? config.logoX : config.logoX * r,
              top: isPrint ? config.logoY : config.logoY * r,
              height: isPrint ? config.logoSize : config.logoSize * r,
            }}
          >
            <img
              src={config.logoUrl}
              alt="Logo"
              className="h-full w-auto object-contain pointer-events-none"
            />
          </div>
        )}

        {/* 2. 公司标志 / 字标 */}
        {config.compShow && (
          <div
            className="absolute flex items-center"
            style={{
              left: isPrint ? config.compX : config.compX * r,
              top: isPrint ? config.compY : config.compY * r,
              height: isPrint ? config.compH : config.compH * r,
            }}
          >
            {config.compUrl ? (
              <img
                src={config.compUrl}
                alt="Company"
                className="h-full w-auto object-contain pointer-events-none"
              />
            ) : (
              <span
                className="font-bold text-slate-900 leading-none tracking-wide"
                style={{
                  fontSize: isPrint ? config.compH * 0.7 : config.compH * 0.7 * r,
                }}
              >
                {config.companyName || '万得福'}
              </span>
            )}
          </div>
        )}

        {/* 3. 右上角二维码 */}
        {config.qrShow && (
          <div
            className="absolute flex items-center justify-center bg-white p-0.5"
            style={{
              left: isPrint ? config.qrX : config.qrX * r,
              top: isPrint ? config.qrY : config.qrY * r,
              width: isPrint ? config.qrSize : config.qrSize * r,
              height: isPrint ? config.qrSize : config.qrSize * r,
            }}
          >
            <QRCodeSVG
              value={badge.qrData || badge.workNo || badge.name || '1001'}
              size={isPrint ? config.qrSize : config.qrSize * r}
            />
          </div>
        )}

        {/* 4. 员工照片框 */}
        <div
          className="absolute border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden"
          style={{
            left: isPrint ? config.photoX : config.photoX * r,
            top: isPrint ? config.photoY : config.photoY * r,
            width: isPrint ? config.photoW : config.photoW * r,
            height: isPrint ? config.photoH : config.photoH * r,
          }}
        >
          {badge.photoUrl ? (
            <img
              src={badge.photoUrl}
              alt={badge.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <User
                style={{
                  width: isPrint ? 64 : 64 * r,
                  height: isPrint ? 64 : 64 * r,
                }}
              />
            </div>
          )}
        </div>

        {/* 5. 底部文字与下划线列表 */}
        {items.map((item, idx) => {
          const itemY = isPrint
            ? config.textStartY + idx * config.textLineH
            : (config.textStartY + idx * config.textLineH) * r;

          const labelX = isPrint ? config.textLabelX : config.textLabelX * r;
          const valueX = isPrint ? config.textValueX : config.textValueX * r;
          const valueW = isPrint ? config.textValueW : config.textValueW * r;
          const fSize = isPrint ? config.fontSize : config.fontSize * r;

          return (
            <div key={idx}>
              {/* 左侧标签 (如 "姓名Name:") */}
              <span
                className="absolute font-sans font-medium text-slate-900 whitespace-nowrap leading-none"
                style={{
                  left: labelX,
                  top: itemY,
                  fontSize: `${fSize}px`,
                }}
              >
                {item.label}
              </span>

              {/* 右侧居中值与下划线 */}
              <div
                className="absolute text-center border-b-2 border-slate-900"
                style={{
                  left: valueX,
                  top: itemY - (isPrint ? 4 : 4 * r),
                  width: valueW,
                  height: isPrint ? config.fontSize + 8 : (config.fontSize + 8) * r,
                }}
              >
                <span
                  className="font-sans font-medium text-slate-900 leading-tight truncate block"
                  style={{
                    fontSize: `${fSize}px`,
                  }}
                >
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
