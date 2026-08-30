import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getDefaultWeekRange } from "@/lib/weekly-report/date-helper";
import {
  getLastWeekMetrics,
  getWecomWebhookConfig,
  getWeeklyReportList,
} from "@/app/actions/weekly-report";
import WeeklySummaryClient from "./weekly-summary-client";

export const dynamic = "force-dynamic";

export default async function WeeklySummaryPage() {
  const user = await getCurrentUser();

  // 本地开发或数据库未连通时的优雅回退
  const currentUser = user || {
    id: "dev-officer-id",
    name: "数字官",
    workId: "DO-001",
    roles: [{ id: "r1", name: "admin" }],
  };

  // 默认根据当前日期推算自然周 (周一至周日)
  const defaultRange = getDefaultWeekRange(new Date());

  // 并行预拉取上周基准、企微 Webhook、历史周报
  const [baseline, webhookUrl, historyReports] = await Promise.all([
    getLastWeekMetrics(defaultRange.year, defaultRange.weekNumber).catch(() => null),
    getWecomWebhookConfig().catch(() => ""),
    getWeeklyReportList(20).catch(() => []),
  ]);

  return (
    <WeeklySummaryClient
      currentUser={currentUser as any}
      initialDateRange={defaultRange}
      initialBaseline={baseline}
      initialWebhookUrl={webhookUrl}
      initialHistoryReports={historyReports || []}
    />
  );
}
