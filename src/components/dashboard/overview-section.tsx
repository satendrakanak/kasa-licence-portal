import { Activity, Boxes, KeyRound, MonitorCheck, Timer, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { formatMoney } from "@/lib/dashboard-format";

type OverviewSectionProps = {
  metrics: DashboardData["metrics"];
};

function RevenueCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
      <p className="text-sm text-emerald-100/80">{label}</p>
      <p className="mt-2 break-words text-3xl font-semibold text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-emerald-50/60">{helper}</p>
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
      <div className="grid size-11 place-items-center rounded-xl bg-slate-950 text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export function OverviewSection({ metrics }: OverviewSectionProps) {
  const operationalMetrics = [
    { label: "Products", value: metrics.productCount, icon: <Boxes size={20} /> },
    { label: "Licenses", value: metrics.licenseCount, icon: <KeyRound size={20} /> },
    { label: "Active installs", value: metrics.activeInstallations, icon: <MonitorCheck size={20} /> },
    { label: "Healthy keys", value: metrics.activeLicenses, icon: <Activity size={20} /> },
    { label: "Expiring soon", value: metrics.expiringSoonCount, icon: <Timer size={20} /> },
    { label: "Fresh leads", value: metrics.newLeadCount, icon: <UsersRound size={20} /> },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-emerald-200/20 bg-slate-900 p-5 md:p-6">
        <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
              KASA Operations
            </p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight text-white md:text-3xl">
              Sales, leads, module policy, and product health.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Track revenue, lead flow, license health, and product signals from one admin workspace.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <RevenueCard
              label="Month revenue"
              value={formatMoney(metrics.monthRevenue, metrics.revenueCurrency)}
              helper="Closed sales this month"
            />
            <RevenueCard
              label="Year revenue"
              value={formatMoney(metrics.yearRevenue, metrics.revenueCurrency)}
              helper="Closed sales this year"
            />
            <RevenueCard
              label="Avg order"
              value={formatMoney(metrics.averageOrderValue, metrics.revenueCurrency)}
              helper="Across paid license sales"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {operationalMetrics.map((metric) => (
          <MetricPill key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}
