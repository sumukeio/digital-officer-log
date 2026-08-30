export const STANDARD_WORKSHOPS = [
  '智造一部',
  '智造二部',
  '智造三部',
  '智造五部',
  '智造七部',
  '智造八部',
  '智造九部',
];

/**
 * 将各类车间/班组别名归一化为标准名称
 * 例如："一组" -> "智造一部", "5组" -> "智造五部", "智造二部" -> "智造二部"
 */
export function normalizeDepartmentName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return '未填/其他';
  }
  const clean = rawName.trim();

  // 1. 中文数字组别映射
  if (/^一[组部]$/.test(clean) || /^1[组部]$/.test(clean) || clean === '智造一部' || clean.includes('一部')) {
    return '智造一部';
  }
  if (/^二[组部]$/.test(clean) || /^2[组部]$/.test(clean) || clean === '智造二部' || clean.includes('二部')) {
    return '智造二部';
  }
  if (/^三[组部]$/.test(clean) || /^3[组部]$/.test(clean) || clean === '智造三部' || clean.includes('三部')) {
    return '智造三部';
  }
  if (/^五[组部]$/.test(clean) || /^5[组部]$/.test(clean) || clean === '智造五部' || clean.includes('五部')) {
    return '智造五部';
  }
  if (/^七[组部]$/.test(clean) || /^7[组部]$/.test(clean) || clean === '智造七部' || clean.includes('七部')) {
    return '智造七部';
  }
  if (/^八[组部]$/.test(clean) || /^8[组部]$/.test(clean) || clean === '智造八部' || clean.includes('八部')) {
    return '智造八部';
  }
  if (/^九[组部]$/.test(clean) || /^9[组部]$/.test(clean) || clean === '智造九部' || clean.includes('九部')) {
    return '智造九部';
  }
  if (/^十[组部]$/.test(clean) || /^10[组部]$/.test(clean) || clean === '智造十部' || clean.includes('十部')) {
    return '智造十部';
  }

  // 2. 特殊设备前缀等（如八部吸塑 -> 智造八部）
  for (const num of ['一', '二', '三', '五', '七', '八', '九']) {
    if (clean.includes(`${num}部`)) {
      return `智造${num}部`;
    }
  }

  return clean;
}

/**
 * 获取用于周报汇报的简短名称
 * 例如："智造一部" -> "一部", "智造五部" -> "五部", "研发部" -> "研发部"
 */
export function getShortDeptName(deptName: string): string {
  if (!deptName) return '';
  if (deptName.startsWith('智造') && deptName.endsWith('部')) {
    return deptName.replace('智造', '');
  }
  return deptName;
}
