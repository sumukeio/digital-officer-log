import {
  AllWeeklyMetrics,
  ManualSections,
  DateRangeInfo,
} from './types';
import { formatWowText } from './metrics-calculator';

export interface ReportGenerationOptions {
  dateRange: DateRangeInfo;
  metrics: AllWeeklyMetrics;
  manualSections: ManualSections;
  activeModules?: string[] | Record<string, boolean>; // 可选启用的模块列表（支持数组或布尔对象映射）
}

/**
 * 判断指定模块当前是否处于启用状态
 */
export function isModuleActive(
  moduleKey: string,
  activeModules?: string[] | Record<string, boolean>
): boolean {
  if (!activeModules) return true;
  if (Array.isArray(activeModules)) {
    return activeModules.includes(moduleKey);
  }
  return activeModules[moduleKey] !== false;
}


export const DEFAULT_MANUAL_SECTIONS: ManualSections = {
  inspection: '一二三五七部都在正常使用。',
  maintenance: '一部五部八部九部正常使用。二部三部未见使用。下周当面督促。',
  binying: '总体回复率较高，消息基本都有处理回复，由于企微消息提醒功能此前已关闭，需要大家定时主动查看必应消息。',
  taskGrid: '正常使用中，本周未出现过可分配工时异常问题。\n为尽可能避免工时、掉打卡状态等问题。研发人员转班自动提醒机器人正常使用中，提前做好后台班次配置。',
  training: {
    theme: '夏季安全生产培训——用电专项培训',
    trainer: '李建成总',
    scoreOver90: 3,
    score80to89: 34,
    incentive: '均已进行点赞送花激励',
    futureExamCenter: true,
  },
  rewards: '正常使用中。',
  bulletin: '目前已发布公告5篇，持续更新中。',
  inspectionGeneral: '各部门正常使用中。出现员工误操作、扫码失败的问题，已经处理解决。',
  dudu: {
    nightShift: '夜班人员下班前未做上线的情况未见发生，都会及时上线。',
    planner: '计划员基本都能及时上传计划。',
    siteConsistency: '会出现嘟嘟计划中的产品与现场实际生产的产品不一致、现场在打但嘟嘟计划未加入，数字官会在车间巡检发现问题并与计划及时沟通调整解决。',
  },
  improvements: [
    '嘟嘟前台OKR页面，在下载数据时，在已经选择起止日期的情况下，导出数据的范围与选择的日期范围不符。',
    '生产头条看板，导出QC头条、OKR数据，文件名依然是生产头条开头。',
    '新随拍页面，下载按钮，无法选择起止日期，只能全部。想要导出固定起止日期的数据只能先通过日期选择器选择日期再点击下载，与其他页面操作不符。',
    '后台部门模块报错原因不够明确。例如在嘟嘟计划产出页面新增计划，信息未填写全面的情况下，会报“处理异常”，但没有明确说XX字段未填写。',
  ],
};

export const EMPTY_MANUAL_SECTIONS: ManualSections = {
  productionReflection: '',
  qcReflection: '',
  punchReflection: '',
  inspection: '',
  maintenance: '',
  binying: '',
  taskGrid: '',
  training: {
    theme: '',
    trainer: '',
    scoreOver90: 0,
    score80to89: 0,
    incentive: '',
    futureExamCenter: false,
  },
  rewards: '',
  bulletin: '',
  inspectionGeneral: '',
  dudu: {
    nightShift: '',
    planner: '',
    siteConsistency: '',
  },
  improvements: [],
};

/**
 * 生成标准微信群格式纯文本周报
 */
export function generatePlainTextWeeklyReport(options: ReportGenerationOptions): string {
  const { dateRange, metrics, manualSections, activeModules } = options;
  const sections: string[] = [];

  // 标题
  sections.push(`${dateRange.titleFormatted}周报：`);

  let index = 1;

  // 1. 生产头条
  if (metrics.production && isModuleActive('production', activeModules)) {
    const p = metrics.production;
    const wowStr = p.wowRate !== null && p.wowRate !== undefined ? `，${formatWowText(p.wowRate)}` : '';
    
    // 车间占比 (筛选出开卡数 > 0 的车间)
    const activeWs = p.workshopStats.filter(ws => ws.count > 0);
    let wsDistStr = '';
    if (activeWs.length > 0) {
      const parts = activeWs.map(ws => `${ws.shortName}开卡占比${ws.percentage}%`);
      wsDistStr = `其中${parts.join('，')}，其他部门未开卡。`;
    }

    const over48Str = p.over48Count > 0 ? `${p.over48Count}条头条的处理时长超过48小时。` : '';
    const defaultReflection = manualSections.productionReflection || 
      '由于关闭企微提醒，开卡后无法主动提醒到责任人，解决问题效率远不如直接企微沟通，导致开卡数量总体不多。';

    sections.push(
      `${index}、生产头条：本周总体开卡数共${p.totalCards}条${wowStr}。${wsDistStr}${over48Str}\n${defaultReflection}`
    );
    index++;
  }

  // 2. QC 头条
  if (metrics.qc && isModuleActive('qc', activeModules)) {
    const q = metrics.qc;
    const wowStr = q.wowRate !== null && q.wowRate !== undefined ? `，${formatWowText(q.wowRate)}` : '';
    const defaultQcReflection = manualSections.qcReflection || 
      (q.over48Count > 0 
        ? `反思：${q.over48Count}条处理时间较长超过48小时未处理，较上周有所减少，已督促关卡。`
        : '反思：各条头条均得到及时关卡处理。');

    sections.push(
      `${index}、QC头条：本周总体开卡数共${q.totalCards}条${wowStr}。\n${defaultQcReflection}`
    );
    index++;
  }

  // 3. 新随拍
  if (metrics.punch && isModuleActive('punch', activeModules)) {
    const pu = metrics.punch;
    const wowStr = pu.wowRate !== null && pu.wowRate !== undefined ? `，${formatWowText(pu.wowRate)}` : '';
    const topParts = pu.topDepts.map(d => `${d.shortName}打卡占比${d.percentage}%`);
    const topStr = topParts.length > 0 ? `${topParts.join('，')}。` : '';
    const reflection = manualSections.punchReflection || '二部需继续进步。';

    sections.push(
      `${index}、新随拍：本周共计打卡${pu.totalPunches}人次${wowStr}，${topStr}${reflection}`
    );
    index++;
  }

  // 4. OKR (若有解析)
  if (metrics.okr && isModuleActive('okr', activeModules)) {
    const o = metrics.okr;
    const wowStr = o.wowRate !== null && o.wowRate !== undefined ? `，${formatWowText(o.wowRate)}` : '';
    sections.push(
      `${index}、OKR：本周总体开卡数共${o.totalCards}条${wowStr}。`
    );
    index++;
  }

  // 5. 设备点检
  if (isModuleActive('inspection', activeModules) && manualSections.inspection !== undefined && manualSections.inspection !== '') {
    sections.push(`${index}、设备点检：${manualSections.inspection}`);
    index++;
  }

  // 6. 设备保养
  if (isModuleActive('maintenance', activeModules) && manualSections.maintenance !== undefined && manualSections.maintenance !== '') {
    sections.push(`${index}、设备保养：${manualSections.maintenance}`);
    index++;
  }

  // 7. 必应
  if (isModuleActive('binying', activeModules) && manualSections.binying !== undefined && manualSections.binying !== '') {
    sections.push(`${index}、必应：${manualSections.binying}`);
    index++;
  }

  // 8. 任务格子
  if (isModuleActive('taskGrid', activeModules) && manualSections.taskGrid !== undefined && manualSections.taskGrid !== '') {
    sections.push(`${index}、任务格子：${manualSections.taskGrid}`);
    index++;
  }

  // 9. 集体培训
  if (isModuleActive('training', activeModules) && manualSections.training && (manualSections.training.theme || manualSections.training.trainer)) {
    const t = manualSections.training;
    const examStr = `本周${t.trainer}举行了${t.theme}，并组织了考试，90分及以上${t.scoreOver90}人，80分-89分${t.score80to89}人，${t.incentive}。`;
    const examCenterStr = t.futureExamCenter ? '\n后续的考试可以使用学院版块的考试中心进行。' : '';
    sections.push(
      `${index}、集体培训：使用情况良好，生产、品质部门每次举行培训时都会使用，已经养成习惯。\n${examStr}${examCenterStr}`
    );
    index++;
  }

  // 10. 激励
  if (isModuleActive('rewards', activeModules) && manualSections.rewards !== undefined && manualSections.rewards !== '') {
    sections.push(`${index}、激励：${manualSections.rewards}`);
    index++;
  }

  // 11. 公告栏
  if (isModuleActive('bulletin', activeModules) && manualSections.bulletin !== undefined && manualSections.bulletin !== '') {
    sections.push(`${index}、公告栏：${manualSections.bulletin}`);
    index++;
  }

  // 12. 综合点检
  if (isModuleActive('inspectionGeneral', activeModules) && manualSections.inspectionGeneral !== undefined && manualSections.inspectionGeneral !== '') {
    sections.push(`${index}、综合点检：${manualSections.inspectionGeneral}`);
    index++;
  }

  // 13. 嘟嘟卡
  if (isModuleActive('dudu', activeModules) && manualSections.dudu) {
    const d = manualSections.dudu;
    sections.push(
      `${index}、嘟嘟卡：\n1）${d.nightShift}\n2）${d.planner}\n3）${d.siteConsistency}`
    );
    index++;
  }

  // 14. 精益 (如果启用)
  if (metrics.lean && isModuleActive('lean', activeModules)) {
    const l = metrics.lean;
    const parts = l.workshopStats.map(ws => `${ws.shortName}开卡${ws.count}条`);
    sections.push(
      `${index}、精益：本周开卡共${l.totalCards}条（${parts.join('，')}）。`
    );
    index++;
  }

  // 15. 系统改进建议
  if (isModuleActive('improvements', activeModules) && manualSections.improvements && manualSections.improvements.length > 0) {
    const impList = manualSections.improvements.map((item, idx) => `${idx + 1}、${item}`).join('\n');
    sections.push(`系统改进建议：\n${impList}`);
  }

  return sections.join('\n\n');
}

/**
 * 生成企业微信群机器人 Markdown 格式消息
 */
export function generateWeComMarkdownWeeklyReport(options: ReportGenerationOptions): string {
  const { dateRange, metrics, manualSections, activeModules } = options;
  const lines: string[] = [];

  lines.push(`### 📊 **${dateRange.titleFormatted} 海铭德系统使用周报**`);
  lines.push(`> 统计周期：<font color="comment">${dateRange.startDate} ~ ${dateRange.endDate}</font>\n`);

  let index = 1;

  // 1. 生产头条
  if (metrics.production && isModuleActive('production', activeModules)) {
    const p = metrics.production;
    const wowStr = p.wowRate !== null && p.wowRate !== undefined
      ? (p.wowRate < 0 ? `，环比<font color="warning">下跌${Math.abs(p.wowRate)}%</font>` : `，环比<font color="info">增长${p.wowRate}%</font>`)
      : '';
    const activeWs = p.workshopStats.filter(ws => ws.count > 0);
    const wsDistStr = activeWs.length > 0
      ? activeWs.map(ws => `${ws.shortName}占比 **${ws.percentage}%**`).join('，')
      : '各车间暂未开卡';

    lines.push(`**${index}、生产头条**`);
    lines.push(`> 本周总体开卡数：**${p.totalCards} 条**${wowStr}`);
    lines.push(`> 车间分布：${wsDistStr}`);
    if (p.over48Count > 0) {
      lines.push(`> 超期预警：<font color="warning">${p.over48Count} 条</font> 停机处理时长超过 48 小时`);
    }
    const defaultProdReflection = manualSections.productionReflection ||
      '由于关闭企微提醒，开卡后无法主动提醒到责任人，解决问题效率远不如直接企微沟通，导致开卡数量总体不多。';
    lines.push(`> 反思：${defaultProdReflection}`);
    lines.push('');
    index++;
  }

  // 2. QC 头条
  if (metrics.qc && isModuleActive('qc', activeModules)) {
    const q = metrics.qc;
    const wowStr = q.wowRate !== null && q.wowRate !== undefined
      ? (q.wowRate < 0 ? `，环比<font color="warning">下跌${Math.abs(q.wowRate)}%</font>` : `，环比<font color="info">增长${q.wowRate}%</font>`)
      : '';
    lines.push(`**${index}、QC头条**`);
    lines.push(`> 本周总体开卡数：**${q.totalCards} 条**${wowStr}`);
    if (q.over48Count > 0) {
      lines.push(`> 超期预警：<font color="warning">${q.over48Count} 条</font> 超过 48 小时未处理已督促关卡`);
    }
    const defaultQcReflection = manualSections.qcReflection ||
      (q.over48Count > 0
        ? `${q.over48Count} 条处理时间较长超过 48 小时未处理，较上周有所减少，已督促关卡。`
        : '各条头条均得到及时关卡处理。');
    lines.push(`> 反思：${defaultQcReflection}`);
    lines.push('');
    index++;
  }

  // 3. 新随拍
  if (metrics.punch && isModuleActive('punch', activeModules)) {
    const pu = metrics.punch;
    const wowStr = pu.wowRate !== null && pu.wowRate !== undefined
      ? (pu.wowRate < 0 ? `，环比<font color="warning">下跌${Math.abs(pu.wowRate)}%</font>` : `，环比<font color="info">增长${pu.wowRate}%</font>`)
      : '';
    const topStr = pu.topDepts.map(d => `${d.shortName}占比 **${d.percentage}%**`).join('，');
    lines.push(`**${index}、新随拍**`);
    lines.push(`> 本周打卡人次：**${pu.totalPunches} 人次**${wowStr}`);
    if (topStr) {
      lines.push(`> 部门占比：${topStr}`);
    }
    const punchReflection = manualSections.punchReflection || '二部需继续进步。';
    lines.push(`> 提示：${punchReflection}`);
    lines.push('');
    index++;
  }

  // 4. OKR (若有解析)
  if (metrics.okr && isModuleActive('okr', activeModules)) {
    const o = metrics.okr;
    const wowStr = o.wowRate !== null && o.wowRate !== undefined
      ? (o.wowRate < 0 ? `，环比<font color="warning">下跌${Math.abs(o.wowRate)}%</font>` : `，环比<font color="info">增长${o.wowRate}%</font>`)
      : '';
    lines.push(`**${index}、OKR**`);
    lines.push(`> 本周总体开卡数：**${o.totalCards} 条**${wowStr}`);
    lines.push('');
    index++;
  }

  // 5. 设备点检、保养与综合点检
  const hasInspection = isModuleActive('inspection', activeModules) && !!manualSections.inspection;
  const hasMaintenance = isModuleActive('maintenance', activeModules) && !!manualSections.maintenance;
  const hasInspectionGeneral = isModuleActive('inspectionGeneral', activeModules) && !!manualSections.inspectionGeneral;
  if (hasInspection || hasMaintenance || hasInspectionGeneral) {
    lines.push(`**${index}、设备点检与保养**`);
    if (hasInspection && manualSections.inspection) lines.push(`> 点检：${manualSections.inspection}`);
    if (hasMaintenance && manualSections.maintenance) lines.push(`> 保养：${manualSections.maintenance}`);
    if (hasInspectionGeneral && manualSections.inspectionGeneral) lines.push(`> 综合点检：${manualSections.inspectionGeneral}`);
    lines.push('');
    index++;
  }

  // 6. 必应与任务格子
  const hasBinying = isModuleActive('binying', activeModules) && !!manualSections.binying;
  const hasTaskGrid = isModuleActive('taskGrid', activeModules) && !!manualSections.taskGrid;
  if (hasBinying || hasTaskGrid) {
    lines.push(`**${index}、必应与任务格子**`);
    if (hasBinying && manualSections.binying) lines.push(`> 必应：${manualSections.binying}`);
    if (hasTaskGrid && manualSections.taskGrid) {
      const gridLines = manualSections.taskGrid.split('\n');
      lines.push(`> 任务格子：${gridLines[0]}`);
      gridLines.slice(1).forEach(gl => {
        if (gl.trim()) lines.push(`> ${gl}`);
      });
    }
    lines.push('');
    index++;
  }

  // 7. 集体培训
  const hasTraining = isModuleActive('training', activeModules) && !!manualSections.training && !!(manualSections.training.theme || manualSections.training.trainer);
  if (hasTraining && manualSections.training) {
    const t = manualSections.training;
    lines.push(`**${index}、集体培训**`);
    lines.push(`> 使用情况良好，生产、品质部门每次举行培训时都会使用，已经养成习惯。`);
    lines.push(`> 本周${t.trainer}举行了《${t.theme}》，并组织了考试，90分及以上 **${t.scoreOver90}人**，80分-89分 **${t.score80to89}人**，${t.incentive}。`);
    if (t.futureExamCenter) {
      lines.push(`> 后续的考试可以使用学院版块的考试中心进行。`);
    }
    lines.push('');
    index++;
  }

  // 8. 公告与激励
  const hasRewards = isModuleActive('rewards', activeModules) && !!manualSections.rewards;
  const hasBulletin = isModuleActive('bulletin', activeModules) && !!manualSections.bulletin;
  if (hasRewards || hasBulletin) {
    lines.push(`**${index}、公告与激励**`);
    if (hasBulletin && manualSections.bulletin) lines.push(`> 公告栏：${manualSections.bulletin}`);
    if (hasRewards && manualSections.rewards) lines.push(`> 激励：${manualSections.rewards}`);
    lines.push('');
    index++;
  }

  // 9. 嘟嘟卡
  const hasDudu = isModuleActive('dudu', activeModules) && !!manualSections.dudu;
  if (hasDudu && manualSections.dudu) {
    const d = manualSections.dudu;
    lines.push(`**${index}、嘟嘟卡运行情况**`);
    lines.push(`> 1）${d.nightShift}`);
    lines.push(`> 2）${d.planner}`);
    lines.push(`> 3）${d.siteConsistency}`);
    lines.push('');
    index++;
  }

  // 10. 精益 (如果启用)
  if (metrics.lean && isModuleActive('lean', activeModules)) {
    const l = metrics.lean;
    const parts = l.workshopStats.map(ws => `${ws.shortName}开卡${ws.count}条`);
    lines.push(`**${index}、精益**`);
    lines.push(`> 本周开卡共 **${l.totalCards} 条**（${parts.join('，')}）。`);
    lines.push('');
    index++;
  }

  // 11. 系统改进建议
  const hasImprovements = isModuleActive('improvements', activeModules) && !!manualSections.improvements && manualSections.improvements.length > 0;
  if (hasImprovements && manualSections.improvements) {
    lines.push(`**💡 系统改进建议**`);
    manualSections.improvements.forEach((item, idx) => {
      lines.push(`> ${idx + 1}、${item}`);
    });
  }

  return lines.join('\n');
}
