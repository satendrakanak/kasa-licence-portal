import { LeadsSection } from "@/components/dashboard/leads-section";
import { OverviewSection } from "@/components/dashboard/overview-section";
import { RevenueSection } from "@/components/dashboard/revenue-section";
import { SalesTable } from "@/components/dashboard/sales-table";
import type { DashboardData } from "@/lib/dashboard-data";

type DashboardShellProps = {
  data: DashboardData;
};

export function DashboardShell({ data }: DashboardShellProps) {
  return (
    <>
      <OverviewSection metrics={data.metrics} />
      <RevenueSection revenue={data.revenue} />
      <SalesTable sales={data.revenue.recentSales} />
      <LeadsSection leads={data.recentLeads} />
    </>
  );
}
