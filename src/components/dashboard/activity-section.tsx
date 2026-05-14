import { Activity, MonitorCheck } from "lucide-react";
import { ActivationDeactivateButton } from "@/components/activation-controls";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";
import type { DashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/dashboard-format";

function getDetail(details: unknown, key: string) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  const value = (details as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function getAuditLabel(action: string) {
  const labels: Record<string, string> = {
    "license.activated": "License activated",
    "license.checked": "License checked",
    "license.access_revoked": "Access revoked",
    "license.reactivated": "License reactivated",
    "license.deleted": "License deleted",
    "installation.deactivated": "Installation deactivated",
  };

  return labels[action] || action;
}

function getAuditSummary(log: DashboardData["auditLogs"][number]) {
  const installCount = getDetail(log.details, "deactivatedInstallations");
  const keyPreview = getDetail(log.details, "keyPreview");
  const instanceLabel = getDetail(log.details, "instanceLabel");

  if (installCount) return `${installCount} installation${installCount === "1" ? "" : "s"} stopped`;
  if (instanceLabel) return instanceLabel;
  if (keyPreview) return keyPreview;
  return log.license?.keyPreview || log.license?.product.name || "System event";
}

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
        <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {activations.map((activation) => (
            <article key={activation.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{activation.instanceLabel || "Unnamed instance"}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${
                      activation.status === "ACTIVE"
                        ? "border-emerald-300/20 text-emerald-200"
                        : "border-red-300/20 text-red-200"
                    }`}
                    >
                      {activation.status}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm text-slate-400">
                    {activation.license.product.name} · {activation.license.keyPreview}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-400">
                    {activation.license.buyerName || "Unnamed buyer"} · {activation.license.buyerEmail}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activation.license.edition} · {activation.license.saleChannel}
                    {activation.license.purchaseRef ? ` · ${activation.license.purchaseRef}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Last seen {formatDate(activation.lastSeenAt)}
                  </p>
                </div>
                {activation.status === "ACTIVE" ? (
                  <ActivationDeactivateButton activationId={activation.id} />
                ) : null}
              </div>
            </article>
          ))}
          {activations.length === 0 ? <p className="text-sm text-slate-400">No installations yet.</p> : null}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionTitle
          icon={<Activity />}
          title="Audit trail"
          description="Recent license and installation events."
        />
        <div className="mt-5 max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <article
              key={log.id}
              className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{getAuditLabel(log.action)}</p>
                <p className="mt-1 break-words text-sm text-slate-400">
                  {log.license?.product.name || "System"} · {getAuditSummary(log)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.actor || "admin"} · {formatDate(log.createdAt)}
                </p>
              </div>
              <span className="h-fit rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {log.license?.status || "SYSTEM"}
              </span>
            </article>
          ))}
          {auditLogs.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : null}
        </div>
      </SectionCard>
    </section>
  );
}
