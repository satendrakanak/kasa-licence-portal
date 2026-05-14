import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ModuleManagementControls } from "@/components/module-management-controls";
import { requireAdmin } from "@/lib/auth";
import { getKasaModuleEntitlements } from "@/lib/kasa-modules";

export const dynamic = "force-dynamic";

export default async function ModuleManagementPage() {
  await requireAdmin();
  const entitlements = await getKasaModuleEntitlements();

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-50 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
              Kasa module management
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Plan module control
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Manage which KASA modules and plan behaviours are delivered with
              Starter, Plus, and Enterprise keys. Starter modules are
              automatically carried into Plus and Enterprise.
            </p>
          </div>
        </div>

        <ModuleManagementControls entitlements={entitlements} />
      </div>
    </main>
  );
}
