/**
 * 智能工牌制作工作台 — 类型定义与坐标系统
 * 基于 600 x 1000 矢量网格排版系统 (与 Python 版 100% 对齐并全面升级)
 */

export interface BadgeItem {
  id: string;
  name: string; // 姓名
  department: string; // 部门
  post: string; // 岗位 / 职务
  workNo: string; // 工号
  entryDate: string; // 入职日期 / 发证日期 (YYYY-MM-DD)
  photoUrl?: string; // 员工照片 (URL 或 Base64)
  qrData?: string; // 二维码自定义数据 (默认工号)
  enabled: boolean; // 是否勾选打印
}

export interface BadgeTemplateConfig {
  // 设计器锁定状态
  isLocked: boolean;

  // 1. 左上角 Logo
  logoShow: boolean;
  logoUrl: string; // 图片路径或 Base64
  logoX: number; // 0 ~ 600
  logoY: number; // 0 ~ 500
  logoSize: number; // 20 ~ 300

  // 2. 公司标志 / 字标
  compShow: boolean;
  compUrl: string; // 图片路径或 Base64
  companyName?: string; // 文本备用名称
  compX: number; // 0 ~ 600
  compY: number; // 0 ~ 500
  compH: number; // 高度 20 ~ 300

  // 3. 右上角二维码
  qrShow: boolean;
  qrX: number; // 0 ~ 600
  qrY: number; // 0 ~ 500
  qrSize: number; // 20 ~ 300

  // 4. 照片框
  photoX: number; // 0 ~ 600
  photoY: number; // 0 ~ 800
  photoW: number; // 50 ~ 400
  photoH: number; // 50 ~ 500

  // 5. 底部文字与下划线
  textStartY: number; // 起始 Y (如 639)
  textLineH: number; // 行距 (如 65)
  textLabelX: number; // 标签 X (如 59)
  textValueX: number; // 文本与下划线起点 X (如 250)
  textValueW: number; // 文本与下划线宽度 (如 280)
  fontSize: number; // 字号 (如 32)

  // 6. 物理尺寸与打印参数
  canvasW: number; // 基准画布宽 (600)
  canvasH: number; // 基准画布高 (1000)
  badgeWidthMm: number; // 物理宽度 mm (54)
  badgeHeightMm: number; // 物理高度 mm (90)
  layoutCols: number; // A4 排版列数 (默认 3 或 2)
  layoutRows: number; // A4 排版行数 (默认 3 或 4)
  showCropMarks: boolean; // 是否显示裁切辅助十字线 (默认 true)
}

/**
 * 万得福经典满意出厂预设 (与原 Python 调优后参数 100% 一致)
 */
export const DEFAULT_BADGE_CONFIG: BadgeTemplateConfig = {
  isLocked: false,

  // 1. 左上角 Logo
  logoShow: true,
  logoUrl: '/badge/logo.png',
  logoX: 40,
  logoY: 50,
  logoSize: 104,

  // 2. 公司标志
  compShow: true,
  compUrl: '/badge/company_name.png',
  companyName: '万得福',
  compX: 139,
  compY: 89,
  compH: 69,

  // 3. 右上角二维码
  qrShow: true,
  qrX: 440,
  qrY: 89,
  qrSize: 120,

  // 4. 照片框
  photoX: 175,
  photoY: 240,
  photoW: 260,
  photoH: 350,

  // 5. 底部文字
  textStartY: 639,
  textLineH: 65,
  textLabelX: 59,
  textValueX: 250,
  textValueW: 280,
  fontSize: 32,

  // 6. 画布与打印
  canvasW: 600,
  canvasH: 1000,
  badgeWidthMm: 54,
  badgeHeightMm: 90,
  layoutCols: 3,
  layoutRows: 3,
  showCropMarks: true,
};

export const DEFAULT_SAMPLE_BADGES: BadgeItem[] = [
  {
    id: 'badge-demo-1',
    name: '李四',
    department: '技术部',
    post: '工程师',
    workNo: '1001',
    entryDate: '2023-10-01',
    enabled: true,
  },
  {
    id: 'badge-demo-2',
    name: '张三',
    department: '制造部',
    post: '技术员',
    workNo: '1002',
    entryDate: '2023-10-01',
    enabled: true,
  },
  {
    id: 'badge-demo-3',
    name: '王五',
    department: '品质部',
    post: '检验员',
    workNo: '1003',
    entryDate: '2023-10-01',
    enabled: true,
  },
];
