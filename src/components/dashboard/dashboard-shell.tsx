import { ActivitySection } from "@/components/dashboard/activity-section";
import { ClientApiCard } from "@/components/dashboard/client-api-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LeadsSection } from "@/components/dashboard/leads-section";
import { LicensesSection } from "@/components/dashboard/licenses-section";
import { NewLicenseKeyBanner } from "@/components/dashboard/new-license-key-banner";
import { OperationsSection } from "@/components/dashboard/operations-section";
import { OverviewSection } from "@/components/dashboard/overview-section";
import { ProductsSection } from "@/components/dashboard/products-section";
import { RevenueSection } from "@/components/dashboard/revenue-section";
import { SalesTable } from "@/components/dashboard/sales-table";
import type { DashboardData } from "@/lib/dashboard-data";

type DashboardShellProps = {
  adminName: string;
  newKey?: string;
  data: DashboardData;
};

export function DashboardShell({ adminName, newKey, data }: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardHeader adminName={adminName} />
      <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 lg:px-8">
        <OverviewSection metrics={data.metrics} />
        <NewLicenseKeyBanner licenseKey={newKey} />
        <RevenueSection revenue={data.revenue} />
        <SalesTable sales={data.revenue.recentSales} />
        <LeadsSection leads={data.recentLeads} />
        <OperationsSection products={data.products} />
        <ProductsSection products={data.products} />
        <LicensesSection licenses={data.licenses} />
        <ActivitySection activations={data.activations} auditLogs={data.auditLogs} />
        <ClientApiCard />
      </div>
    </main>
  );
}
