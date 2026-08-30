export type ModuleType =
  | 'production'
  | 'qc'
  | 'okr'
  | 'punch'
  | 'comprehensive'
  | 'lean'
  | 'unknown';

export interface RecognizedFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  moduleType: ModuleType;
  moduleName: string;
  rows: any[];
  headers: string[];
}

export interface WorkshopStats {
  [key: string]: any;
  workshop: string;
  shortName: string; // "一部", "五部" 等
  count: number;
  percentage: number; // 0-100
}

export interface DepartmentStats {
  [key: string]: any;
  department: string;
  shortName: string;
  count: number;
  percentage: number;
}

export interface OverdueDetail {
  id?: string;
  title?: string;
  workshop?: string;
  owner?: string;
  handler?: string;
  duration: number;
}

export interface ProductionMetrics {
  totalCards: number;
  over24Count: number;
  over48Count: number;
  over48Details: OverdueDetail[];
  workshopStats: WorkshopStats[];
  wowRate?: number | null; // 环比增长率 (如 -33.3 代表下跌33.3%, 15.0 代表上涨15%)
}

export interface QCMetrics {
  totalCards: number;
  over24Count: number;
  over48Count: number;
  over48Details: OverdueDetail[];
  wowRate?: number | null;
}

export interface OKRMetrics {
  totalCards: number;
  wowRate?: number | null;
}

export interface PunchMetrics {
  totalPunches: number;
  deptStats: DepartmentStats[];
  topDepts: DepartmentStats[];
  wowRate?: number | null;
}

export interface LeanMetrics {
  totalCards: number;
  workshopStats: WorkshopStats[];
  wowRate?: number | null;
}

export interface AllWeeklyMetrics {
  production?: ProductionMetrics;
  qc?: QCMetrics;
  okr?: OKRMetrics;
  punch?: PunchMetrics;
  lean?: LeanMetrics;
}

export interface TrainingSection {
  theme: string;
  trainer: string;
  scoreOver90: number;
  score80to89: number;
  incentive: string;
  futureExamCenter: boolean;
}

export interface DuduSection {
  nightShift: string;
  planner: string;
  siteConsistency: string;
}

export interface ManualSections {
  productionReflection?: string;
  qcReflection?: string;
  punchReflection?: string;
  inspection?: string;
  maintenance?: string;
  binying?: string;
  taskGrid?: string;
  training?: TrainingSection;
  rewards?: string;
  bulletin?: string;
  inspectionGeneral?: string;
  dudu?: DuduSection;
  improvements?: string[];
}

export interface LastWeekBaseline {
  productionTotal?: number;
  qcTotal?: number;
  okrTotal?: number;
  punchTotal?: number;
  leanTotal?: number;
}

export interface DateRangeInfo {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startFormatted: string; // M.D
  endFormatted: string;   // M.D
  titleFormatted: string; // "8.24-8.30"
  year: number;
  weekNumber: number;
}

export const DEFAULT_WECOM_WEBHOOK =
  "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=1848bd32-881e-474c-978c-b67556102cbb";

export interface SaveWeeklyReportInput {
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  year: number;
  weekNumber: number;
  metrics: any;
  manualSections: any;
  activeModules?: string[];
  content: string;
  markdownContent?: string;
}
