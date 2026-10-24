'use client';

import React, { useEffect, useState } from 'react';
import { createQrDataUrl } from '@/lib/badge/create-qr';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  logoUrl?: string | null;
  className?: string;
}

/**
 * 标准二维码（可选中心 Logo）— 对齐参考工牌生成器 create_qr
 */
export function QRCodeSVG({
  value,
  size = 64,
  logoUrl,
  className = '',
}: QRCodeSVGProps) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const sz = Math.max(1, Math.round(size));

    createQrDataUrl(value, sz, logoUrl)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, logoUrl]);

  if (!src) {
    return (
      <div
        className={`bg-white ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`select-none block ${className}`}
      draggable={false}
    />
  );
}
