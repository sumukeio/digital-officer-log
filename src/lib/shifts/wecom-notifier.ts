import axios from 'axios';
import { ShiftAlert, ShiftWorkerStatus } from './types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export interface BuildMessageParams {
  today: Date;
  tomorrow: Date;
  tomorrowAlerts: ShiftAlert[];
  allStatuses: ShiftWorkerStatus[];
  isTest?: boolean;
}

/**
 * 构建企业微信群机器人 Markdown 消息卡片
 */
export function buildShiftMarkdownMessage({
  today,
  tomorrow,
  tomorrowAlerts,
  allStatuses,
  isTest = false,
}: BuildMessageParams): string {
  const getWeekday = (d: Date) => WEEKDAYS[d.getDay()];

  const formatFullDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}年${m}月${day}日 ${getWeekday(d)}`;
  };

  const headerTag = isTest ? '🧪 【转班提醒测试】' : '📢 【转班预警 & 排班核对通知】';
  const tomorrowShort = `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日`;

  const lines: string[] = [
    `### ${headerTag}`,
    `> 📅 **今日日期**：${formatFullDate(today)}`,
    `> ⏱️ **明日日期**：${formatFullDate(tomorrow)}`,
    '',
  ];

  // 1. 明日转班提醒区
  if (tomorrowAlerts.length > 0) {
    lines.push(`### 🚨 **明天（${tomorrowShort}）转班人员明细：**`);
    for (const alert of tomorrowAlerts) {
      const isNight = alert.targetShift.includes('夜') || alert.targetShift.includes('晚');
      const tagColor = isNight ? 'warning' : 'info';
      const icon = isNight ? '🌙' : '☀️';
      lines.push(
        `> 👤 **${alert.name}** ➔ 明天转 <font color="${tagColor}">**${alert.targetShift}**</font> ${icon} *(下次转班: ${alert.nextDate})*`
      );
    }
    lines.push('');
    lines.push('⚠️ **请以上同事注意调整作息与交接班考勤。**');
  } else {
    lines.push('> 💡 **明日无人员转班**（全员班次保持不变）。');
  }

  lines.push('');
  lines.push('---');
  lines.push('### 📋 **全员近期排班状态表（供群内查对）：**');

  // 2. 全员排班清单
  for (const item of allStatuses) {
    const isNight = item.worker.targetShift.includes('夜') || item.worker.targetShift.includes('晚');
    const shiftColor = isNight ? 'warning' : 'info';
    lines.push(
      `> 🔹 **${item.worker.name}**：${item.monthDayStr} (${item.weekdayStr}) ➔ <font color="${shiftColor}">${item.worker.targetShift}</font> · ${item.statusDesc}`
    );
  }

  lines.push('');
  lines.push('> 💬 *如需请假、临时调班或排班有误，请及时联系数字官调整。*');

  return lines.join('\n');
}

/**
 * 发送企业微信群机器人 Markdown 通知
 */
export async function sendWecomShiftNotice(
  content: string,
  webhookUrl?: string
): Promise<{ success: boolean; message: string; errcode?: number }> {
  const url =
    webhookUrl ||
    process.env.WECOM_WEBHOOK_URL ||
    'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=1848bd32-881e-474c-978c-b67556102cbb';

  if (!url || !url.startsWith('http')) {
    return { success: false, message: '未配置有效的企业微信 Webhook 地址' };
  }

  const payload = {
    msgtype: 'markdown',
    markdown: {
      content,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    if (response.data && response.data.errcode === 0) {
      return { success: true, message: '企业微信通知已成功推送到群聊！', errcode: 0 };
    } else {
      const errcode = response.data?.errcode || -1;
      const errmsg = response.data?.errmsg || '未知错误';
      return { success: false, message: `企微接口返回错误: [${errcode}] ${errmsg}`, errcode };
    }
  } catch (err: any) {
    return { success: false, message: `网络推送异常: ${err?.message || err}` };
  }
}
