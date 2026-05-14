import { ChevronRight, UserRound } from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard-data";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

export function LeadsSection({ leads }: { leads: DashboardData["recentLeads"] }) {
  return (
    <SectionCard>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionTitle
          icon={<UserRound />}
          title="Recent leads"
          description="New website queries arrive here before sales follow-up."
        />
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          Open leads <ChevronRight size={16} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {leads.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">{lead.name}</h3>
                <p className="mt-1 truncate text-sm text-emerald-300">{lead.email}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {lead.status}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{lead.message}</p>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="truncate">{lead.institute || "No institute shared"}</span>
              <span className="shrink-0">{lead.assignedTo?.name || "Unassigned"}</span>
            </div>
          </article>
        ))}
        {leads.length === 0 ? <p className="text-sm text-slate-400">No leads yet.</p> : null}
      </div>
    </SectionCard>
  );
}
