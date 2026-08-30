import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AISummariesClient from "./ai-summaries-client";

export const dynamic = "force-dynamic";

export default async function AISummariesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AISummariesClient />;
}






