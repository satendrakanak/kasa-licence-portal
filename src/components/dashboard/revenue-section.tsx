import { Banknote, BarChart3, ShieldCheck, TrendingUp } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";
import { displayLabel, formatMoney } from "@/lib/dashboard-format";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

type BreakdownRow = DashboardData["revenue"]["channelRows"][number];

function BreakdownList({ rows }: { rows: BreakdownRow[] }) {
  const peak = Math.max(...rows.map((row) => row.revenue), 1);

  if (rows.length === 0) {
    return <p className="mt-5 text-sm text-slate-400">No paid sales recorded yet.</p>;
  }

  return (
    <div className="mt-5 space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate font-medium capitalize text-slate-200">
              {displayLabel(row.label)}
            </span>
            <span className="shrink-0 text-slate-400">
              {formatMoney(row.revenue)} · {row.count}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-950">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${Math.max(4, Math.round((row.revenue / peak) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RevenueSection({ revenue }: { revenue: DashboardData["revenue"] }) {
  const peak = Math.max(...revenue.monthRows.map((row) => row.revenue), 1);

  return (
    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard>
        <SectionTitle
          icon={<BarChart3 />}
          title="Revenue trend"
          description="Six-month view across direct, marketplace, partner, and campaign-led sales."
        />
        <div className="mt-6 grid h-72 grid-cols-6 items-end gap-3">
          {revenue.monthRows.map((row) => {
            const height = Math.max(6, Math.round((row.revenue / peak) * 100));

            return (
              <div key={row.label} className="flex h-full min-w-0 flex-col justify-end gap-3">
                <div className="min-h-10 text-center text-xs text-slate-400">
                  <p className="truncate">{formatMoney(row.revenue)}</p>
                  <p>{row.count} sale{row.count === 1 ? "" : "s"}</p>
                </div>
                <div className="flex h-44 items-end rounded-xl bg-slate-950 p-2">
                  <div
                    className="w-full rounded-lg bg-emerald-400"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <p className="truncate text-center text-xs font-medium text-slate-300">
                  {row.label}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-5">
        <SectionCard>
          <SectionTitle icon={<Banknote />} title="Sales by channel" />
          <BreakdownList rows={revenue.channelRows} />
        </SectionCard>
        <SectionCard>
          <SectionTitle icon={<TrendingUp />} title="Marketing source" />
          <BreakdownList rows={revenue.sourceRows} />
        </SectionCard>
        <SectionCard>
          <SectionTitle icon={<ShieldCheck />} title="Edition revenue" />
          <BreakdownList rows={revenue.editionRows} />
        </SectionCard>
      </div>
    </section>
  );
}
