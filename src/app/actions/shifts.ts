'use server';

import { prisma } from '@/lib/prisma';
import { ShiftWorker, ShiftGlobalConfig, ShiftCheckResult } from '@/lib/shifts/types';
import { processShiftSchedule } from '@/lib/shifts/shift-algorithm';
import { sendWecomShiftNotice, buildShiftMarkdownMessage } from '@/lib/shifts/wecom-notifier';
import { revalidatePath } from 'next/cache';

const CONFIG_KEY = 'SHIFT_SCHEDULE_CONFIG';
const WORKERS_KEY = 'SHIFT_WORKERS_DATA';

const DEFAULT_CONFIG: ShiftGlobalConfig = {
  webhookUrl:
    process.env.WECOM_WEBHOOK_URL ||
    'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=1848bd32-881e-474c-978c-b67556102cbb',
  defaultCycle: 14,
  notifyHour: 8,
  notifyMinute: 0,
  isEnabled: true,
};

const DEFAULT_WORKERS: ShiftWorker[] = [
  { name: '张三', shiftDate: '2026-08-29', targetShift: '白班', cycleDays: 14 },
  { name: '李四', shiftDate: '2026-08-30', targetShift: '白班', cycleDays: 14 },
  { name: '王五', shiftDate: '2026-08-30', targetShift: '夜班', cycleDays: 14 },
  { name: '赵六', shiftDate: '2026-08-30', targetShift: '夜班', cycleDays: 14 },
  { name: '钱七', shiftDate: '2026-08-17', targetShift: '夜班', cycleDays: 14 },
  { name: '孙八', shiftDate: '2026-08-17', targetShift: '白班', cycleDays: 14 },
];

/**
 * 获取转班小助手配置与排班数据（含自动自愈和状态计算）
 */
export async function getShiftData(): Promise<{
  config: ShiftGlobalConfig;
  workers: ShiftWorker[];
  scheduleResult: ShiftCheckResult;
}> {
  try {
    let config = DEFAULT_CONFIG;
    let workers = DEFAULT_WORKERS;

    // 1. 读取全局配置
    const configRecord = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    if (configRecord?.value) {
      try {
        config = { ...DEFAULT_CONFIG, ...JSON.parse(configRecord.value) };
      } catch (e) {
        console.error('解析转班配置失败，使用默认配置:', e);
      }
    }

    // 2. 读取排班员工列表
    const workersRecord = await prisma.systemConfig.findUnique({
      where: { key: WORKERS_KEY },
    });
    if (workersRecord?.value) {
      try {
        const parsed = JSON.parse(workersRecord.value);
        if (Array.isArray(parsed)) {
          workers = parsed;
        }
      } catch (e) {
        console.error('解析转班员工列表失败，使用默认列表:', e);
      }
    } else {
      // 首次持久化默认数据
      await prisma.systemConfig.upsert({
        where: { key: WORKERS_KEY },
        update: { value: JSON.stringify(DEFAULT_WORKERS) },
        create: { key: WORKERS_KEY, value: JSON.stringify(DEFAULT_WORKERS) },
      });
    }

    // 3. 执行推演与自愈
    const scheduleResult = processShiftSchedule(workers);

    // 4. 如果发生了过期自愈修正，自动持久化最新推算后的数据
    if (scheduleResult.dataChanged) {
      await prisma.systemConfig.upsert({
        where: { key: WORKERS_KEY },
        update: { value: JSON.stringify(scheduleResult.healedWorkers) },
        create: { key: WORKERS_KEY, value: JSON.stringify(scheduleResult.healedWorkers) },
      });
    }

    return {
      config,
      workers: scheduleResult.healedWorkers,
      scheduleResult,
    };
  } catch (error) {
    console.error('获取转班数据异常:', error);
    const fallbackResult = processShiftSchedule(DEFAULT_WORKERS);
    return {
      config: DEFAULT_CONFIG,
      workers: fallbackResult.healedWorkers,
      scheduleResult: fallbackResult,
    };
  }
}

/**
 * 添加排班员工
 */
export async function addShiftWorker(worker: Omit<ShiftWorker, 'id'>): Promise<{ success: boolean; message: string }> {
  try {
    if (!worker.name?.trim()) {
      return { success: false, message: '员工姓名不能为空' };
    }
    if (!worker.shiftDate?.trim()) {
      return { success: false, message: '下次转班日期不能为空' };
    }

    const { workers } = await getShiftData();
    const newWorker: ShiftWorker = {
      name: worker.name.trim(),
      shiftDate: worker.shiftDate.trim(),
      targetShift: worker.targetShift || '白班',
      cycleDays: worker.cycleDays && worker.cycleDays > 0 ? Number(worker.cycleDays) : 14,
      department: worker.department?.trim() || '',
    };

    const updatedWorkers = [...workers, newWorker];

    await prisma.systemConfig.upsert({
      where: { key: WORKERS_KEY },
      update: { value: JSON.stringify(updatedWorkers) },
      create: { key: WORKERS_KEY, value: JSON.stringify(updatedWorkers) },
    });

    revalidatePath('/shifts');
    return { success: true, message: `成功添加员工【${newWorker.name}】` };
  } catch (error: any) {
    console.error('添加员工失败:', error);
    return { success: false, message: `添加失败: ${error?.message || error}` };
  }
}

/**
 * 更新排班员工信息
 */
export async function updateShiftWorker(
  index: number,
  worker: ShiftWorker
): Promise<{ success: boolean; message: string }> {
  try {
    const { workers } = await getShiftData();
    if (index < 0 || index >= workers.length) {
      return { success: false, message: '未找到对应员工记录' };
    }

    const updated = [...workers];
    updated[index] = {
      ...updated[index],
      name: worker.name.trim(),
      shiftDate: worker.shiftDate.trim(),
      targetShift: worker.targetShift || '白班',
      cycleDays: worker.cycleDays && worker.cycleDays > 0 ? Number(worker.cycleDays) : 14,
      department: worker.department?.trim() || '',
    };

    await prisma.systemConfig.upsert({
      where: { key: WORKERS_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: WORKERS_KEY, value: JSON.stringify(updated) },
    });

    revalidatePath('/shifts');
    return { success: true, message: `已更新员工【${worker.name}】` };
  } catch (error: any) {
    console.error('更新员工失败:', error);
    return { success: false, message: `更新失败: ${error?.message || error}` };
  }
}

/**
 * 删除排班员工
 */
export async function deleteShiftWorker(index: number): Promise<{ success: boolean; message: string }> {
  try {
    const { workers } = await getShiftData();
    if (index < 0 || index >= workers.length) {
      return { success: false, message: '未找到对应员工记录' };
    }

    const deletedWorker = workers[index];
    const updated = workers.filter((_, i) => i !== index);

    await prisma.systemConfig.upsert({
      where: { key: WORKERS_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: WORKERS_KEY, value: JSON.stringify(updated) },
    });

    revalidatePath('/shifts');
    return { success: true, message: `已删除员工【${deletedWorker.name}】` };
  } catch (error: any) {
    console.error('删除员工失败:', error);
    return { success: false, message: `删除失败: ${error?.message || error}` };
  }
}

/**
 * 保存转班全局配置 (Webhook / 默认周期 / 启用状态)
 */
export async function saveShiftConfig(
  config: Partial<ShiftGlobalConfig>
): Promise<{ success: boolean; message: string }> {
  try {
    const { config: currentConfig } = await getShiftData();
    const updatedConfig: ShiftGlobalConfig = {
      ...currentConfig,
      ...config,
      defaultCycle: config.defaultCycle ? Number(config.defaultCycle) : currentConfig.defaultCycle,
    };

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(updatedConfig) },
      create: { key: CONFIG_KEY, value: JSON.stringify(updatedConfig) },
    });

    revalidatePath('/shifts');
    return { success: true, message: '转班助手配置已保存成功！' };
  } catch (error: any) {
    console.error('保存转班配置失败:', error);
    return { success: false, message: `保存失败: ${error?.message || error}` };
  }
}

/**
 * 触发向企业微信推送通知 (支持测试推送与手动强制全员播报)
 */
export async function triggerShiftNotification(options?: {
  isTest?: boolean;
  force?: boolean;
}): Promise<{ success: boolean; message: string; alertCount: number }> {
  try {
    const { config, workers } = await getShiftData();
    const isTest = Boolean(options?.isTest);
    const force = Boolean(options?.force);

    const scheduleResult = processShiftSchedule(workers, { isTest });
    const shouldSend = isTest || force || scheduleResult.tomorrowAlerts.length > 0;

    if (!shouldSend) {
      return {
        success: true,
        message: '明日无人员转班，无需群内强预警',
        alertCount: 0,
      };
    }

    const sendRes = await sendWecomShiftNotice(scheduleResult.markdownMessage, config.webhookUrl);

    // 如果是正式检测且产生了推演轮转，持久化更新员工状态
    if (sendRes.success && !isTest && scheduleResult.dataChanged) {
      await prisma.systemConfig.upsert({
        where: { key: WORKERS_KEY },
        update: { value: JSON.stringify(scheduleResult.healedWorkers) },
        create: { key: WORKERS_KEY, value: JSON.stringify(scheduleResult.healedWorkers) },
      });
      revalidatePath('/shifts');
    }

    return {
      success: sendRes.success,
      message: sendRes.message,
      alertCount: scheduleResult.tomorrowAlerts.length,
    };
  } catch (error: any) {
    console.error('推送转班通知失败:', error);
    return { success: false, message: `推送异常: ${error?.message || error}`, alertCount: 0 };
  }
}

/**
 * 供 cron 调度的每日 08:00 自动转班检查与通知
 */
export async function runDailyShiftCron(): Promise<void> {
  try {
    console.log('[Cron] 开始执行每日转班检查...');
    const res = await triggerShiftNotification({ force: false });
    console.log(`[Cron] 每日转班检查完成: ${res.message} (明日转班: ${res.alertCount}人)`);
  } catch (err) {
    console.error('[Cron] 每日转班检查异常:', err);
  }
}
