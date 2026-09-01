import * as XLSX from 'xlsx';
import { BadgeItem } from './types';

/**
 * 格式化 Excel 日期值 (兼容数字序列号、字符串或 Date 对象)
 */
export function formatExcelDate(rawDate: any): string {
  if (!rawDate) return '';

  if (rawDate instanceof Date) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const d = String(rawDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof rawDate === 'number') {
    // Excel 日期序列号转换 (自 1900-01-01)
    const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(rawDate).trim();
  // 匹配类似 "2026/01/01" 或 "2026.01.01"
  const normalized = str.replace(/[./]/g, '-').split(' ')[0];
  return normalized;
}

/**
 * 解析批量工牌 Excel 文件
 */
export function parseBadgeExcel(fileData: ArrayBuffer | Uint8Array): BadgeItem[] {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const badges: BadgeItem[] = [];

  rawRows.forEach((row, idx) => {
    let name = '';
    let department = '';
    let post = '';
    let workNo = '';
    let entryDate = '';
    let photoUrl = '';

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      const val = row[key];

      if (/^(姓名|名字|员工姓名|name)$/i.test(cleanKey)) {
        name = String(val).trim();
      } else if (/^(部门|所属部门|科室|班组|dept|department)$/i.test(cleanKey)) {
        department = String(val).trim();
      } else if (/^(岗位|职务|职位|工种|post|title|position)$/i.test(cleanKey)) {
        post = String(val).trim();
      } else if (/^(工号|编号|员工工号|工号编号|workno|workid|no|id)$/i.test(cleanKey)) {
        workNo = String(val).trim();
      } else if (/^(入职日期|发证日期|入职时间|日期|date|entrydate)$/i.test(cleanKey)) {
        entryDate = formatExcelDate(val);
      } else if (/^(照片|头像|相片|photo|avatar|image)$/i.test(cleanKey)) {
        photoUrl = String(val).trim();
      }
    }

    // 如果至少存在姓名或工号，则视为有效工牌记录
    if (name || workNo) {
      badges.push({
        id: `badge-${Date.now()}-${idx + 1}`,
        name: name || '未命名',
        department: department || '—',
        post: post || '—',
        workNo: workNo || String(1000 + idx + 1),
        entryDate: entryDate || new Date().toISOString().split('T')[0],
        photoUrl: photoUrl || undefined,
        enabled: true,
      });
    }
  });

  return badges;
}

/**
 * 生成工牌 Excel 导入标准模板
 */
export function generateBadgeExcelTemplate(): Uint8Array {
  const headers = ['姓名', '部门', '岗位', '工号', '入职日期'];
  const sampleData = [
    headers,
    ['张三', '数字创新部', '数字工程师', 'DO-1001', '2026-01-01'],
    ['李四', '智能制造中心', '精益班组长', 'DO-1002', '2026-02-15'],
    ['王五', '质量管控部', 'IPQC巡检员', 'DO-1003', '2026-03-01'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  // 设置列宽
  ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '工牌数据导入模板');

  const arrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(arrayBuffer);
}

/**
 * 将系统 User 记录一键转换为工牌数据
 */
export function convertUsersToBadges(
  users: Array<{
    id: string;
    name: string | null;
    workId: string;
    assignedAreas?: string | null;
  }>
): BadgeItem[] {
  return users.map((u, idx) => ({
    id: `user-badge-${u.id || idx}`,
    name: u.name || u.workId,
    department: u.assignedAreas || '数字官工作组',
    post: '数字官 (Digital Officer)',
    workNo: u.workId,
    entryDate: new Date().toISOString().split('T')[0],
    enabled: true,
  }));
}
