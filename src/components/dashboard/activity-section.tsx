import { Activity, MonitorCheck, PauseCircle } from "lucide-react";
import { deactivateActivationAction } from "@/app/actions";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";
import type { DashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/dashboard-format";

export function ActivitySection({
  activations,
  auditLogs,
}: {
  activations: DashboardData["activations"];
  auditLogs: DashboardData["auditLogs"];
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <SectionCard>
        <SectionTitle icon={<MonitorCheck />} title="Installations" />
        <div className="mt-5 space-y-3">
          {activations.map((activation) => (
            <article key={activation.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{activation.instanceLabel || "Unnamed instance"}</p>
                  <p className="mt-1 break-words text-sm text-slate-400">
                    {activation.license.product.name} · {activation.license.keyPreview}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Last seen {formatDate(activation.lastSeenAt)}
                  </p>
                </div>
                <form action={deactivateActivationAction}>
                  <input type="hidden" name="activationId" value={activation.id} />
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10">
                    <PauseCircle size={16} /> Deactivate
                  </button>
                </form>
              </div>
            </article>
          ))}
          {activations.length === 0 ? <p className="text-sm text-slate-400">No installations yet.</p> : null}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={<Activity />} title="Audit trail" />
        <div className="mt-5 space-y-3">
          {auditLogs.map((log) => (
            <article key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="font-semibold text-white">{log.action}</p>
              <p className="mt-1 text-sm text-slate-400">
                {log.license?.product.name || "System"} · {log.actor || "unknown actor"}
              </p>
              <p className="mt-2 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
            </article>
          ))}
          {auditLogs.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : null}
        </div>
      </SectionCard>
    </section>
  );
}
