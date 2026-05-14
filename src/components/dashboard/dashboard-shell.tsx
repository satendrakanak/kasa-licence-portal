import { ActivitySection } from "@/components/dashboard/activity-section";
import { ClientApiCard } from "@/components/dashboard/client-api-card";
import { LeadsSection } from "@/components/dashboard/leads-section";
import { LicensesSection } from "@/components/dashboard/licenses-section";
import { OperationsSection } from "@/components/dashboard/operations-section";
import { OverviewSection } from "@/components/dashboard/overview-section";
import { ProductsSection } from "@/components/dashboard/products-section";
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
      <OperationsSection products={data.products} />
      <ProductsSection products={data.products} />
      <LicensesSection licenses={data.licenses} />
      <ActivitySection activations={data.activations} auditLogs={data.auditLogs} />
      <ClientApiCard />
    </>
  );
}
