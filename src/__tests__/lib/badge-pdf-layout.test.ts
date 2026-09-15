import {
  getBadgePdfLayout,
  getBadgePositionMm,
  mmToPt,
  BADGE_W_MM,
  BADGE_H_MM,
  A4_W_MM,
  A4_H_MM,
} from '@/lib/badge/pdf-layout';
import { DEFAULT_BADGE_CONFIG } from '@/lib/badge/types';

describe('Badge PDF layout (对齐参考 ReportLab)', () => {
  it('默认 3×3 页边距与参考公式一致', () => {
    const layout = getBadgePdfLayout(3, 3);
    expect(layout.badgeWMm).toBe(54);
    expect(layout.badgeHMm).toBe(90);
    expect(layout.marginLeftMm).toBe((A4_W_MM - 3 * BADGE_W_MM) / 2); // 24
    expect(layout.marginTopMm).toBe((A4_H_MM - 3 * BADGE_H_MM) / 2); // 13.5
    expect(layout.itemsPerPage).toBe(9);
  });

  it('首张工牌左下角坐标对齐参考 y = PAGE_H - MARGIN_TOP - BADGE_H', () => {
    const layout = getBadgePdfLayout(3, 3);
    const pos = getBadgePositionMm(0, layout);
    expect(pos.xMm).toBe(24);
    expect(pos.yMm).toBe(A4_H_MM - 13.5 - 90); // 193.5
  });

  it('第二列 / 第二行位置正确', () => {
    const layout = getBadgePdfLayout(3, 3);
    const col1 = getBadgePositionMm(1, layout);
    expect(col1.xMm).toBe(24 + 54);
    expect(col1.yMm).toBe(193.5);

    const row1 = getBadgePositionMm(3, layout);
    expect(row1.xMm).toBe(24);
    expect(row1.yMm).toBe(193.5 - 90);
  });

  it('mmToPt 换算正确', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 5);
    expect(mmToPt(54)).toBeCloseTo((54 * 72) / 25.4, 5);
  });

  it('默认配置坐标与参考 layout_config 对齐', () => {
    expect(DEFAULT_BADGE_CONFIG.photoW).toBe(250);
    expect(DEFAULT_BADGE_CONFIG.textValueX).toBe(253);
    expect(DEFAULT_BADGE_CONFIG.qrX).toBe(440);
    expect(DEFAULT_BADGE_CONFIG.qrY).toBe(89);
    expect(DEFAULT_BADGE_CONFIG.qrSize).toBe(120);
    expect(DEFAULT_BADGE_CONFIG.badgeWidthMm).toBe(54);
    expect(DEFAULT_BADGE_CONFIG.badgeHeightMm).toBe(90);
  });
});
