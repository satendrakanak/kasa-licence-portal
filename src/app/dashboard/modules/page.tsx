import { ModuleManagementControls } from "@/components/module-management-controls";
import { requireAdmin } from "@/lib/auth";
import { getKasaModuleEntitlements } from "@/lib/kasa-modules";

export const dynamic = "force-dynamic";

export default async function ModuleManagementPage() {
  await requireAdmin();
  const entitlements = await getKasaModuleEntitlements();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
          Kasa module management
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Plan module control
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Manage which KASA modules and plan behaviours are delivered with
          Starter, Plus, and Enterprise keys. Starter modules are automatically
          carried into Plus and Enterprise.
        </p>
      </section>

      <ModuleManagementControls entitlements={entitlements} />
    </div>
  );
}
