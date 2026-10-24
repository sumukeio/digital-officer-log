import { getCurrentUser } from "@/app/actions/auth";
import { getDefaultWeekRange } from "@/lib/weekly-report/date-helper";
import { getWecomWebhookConfig } from "@/app/actions/weekly-report";
import HeadlineBriefClient from "./headline-brief-client";

export const dynamic = "force-dynamic";

export default async function HeadlineBriefPage() {
  const user = await getCurrentUser();

  const currentUser = user || {
    id: "dev-officer-id",
    name: "数字官",
    workId: "DO-001",
    roles: [{ id: "r1", name: "admin" }],
  };

  const defaultRange = getDefaultWeekRange(new Date());
  const webhookUrl = await getWecomWebhookConfig().catch(() => "");

  return (
    <HeadlineBriefClient
      currentUser={currentUser as any}
      initialDateRange={defaultRange}
      initialWebhookUrl={webhookUrl}
    />
  );
}
