import { ActivitySection } from "@/components/dashboard/activity-section";
import { ClientApiCard } from "@/components/dashboard/client-api-card";
import { LicensesSection } from "@/components/dashboard/licenses-section";
import { OperationsSection } from "@/components/dashboard/operations-section";
import { ProductsSection } from "@/components/dashboard/products-section";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function LicensesPage() {
  const data = await getDashboardData();

  return (
    <>
      <section className="rounded-3xl border border-emerald-200/20 bg-slate-900 p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
          License Workspace
        </p>
        <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight text-white md:text-3xl">
          Products, pricing, keys, installs, and activation API.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Manage product editions, issue license keys, revoke buyer access, review installations, and keep the activation API details in one focused page.
        </p>
      </section>

      <OperationsSection products={data.products} />
      <ProductsSection products={data.products} />
      <LicensesSection licenses={data.licenses} />
      <ActivitySection activations={data.activations} auditLogs={data.auditLogs} />
      <ClientApiCard />
    </>
  );
}
