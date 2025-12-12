import { getSystemConfig, getQuickLinks } from "@/app/actions/admin";
import SystemForm from "./system-form";

export default async function SystemConfigPage() {
  const [config, links] = await Promise.all([
    getSystemConfig(),
    getQuickLinks()
  ]);

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">系统配置中心</h1>
      <SystemForm config={config} links={links} />
    </div>
  );
}