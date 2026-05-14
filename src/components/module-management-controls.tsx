"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateKasaModulePlanAction } from "@/app/actions";
import type { KasaModuleEntitlement } from "@/lib/kasa-modules";
import { KASA_MODULES } from "@/lib/kasa-modules";

type ModuleManagementControlsProps = {
  entitlements: KasaModuleEntitlement[];
};

const editionLabels = {
  STARTER: "Starter",
  PLUS: "Plus",
  ENTERPRISE: "Enterprise",
} as const;

const ruleLabels = {
  lecture_completion: "Lecture completion",
  exam_pass: "Exam pass",
} as const;

export function ModuleManagementControls({
  entitlements,
}: ModuleManagementControlsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {entitlements.map((entitlement) => (
        <PlanModuleCard key={entitlement.edition} entitlement={entitlement} />
      ))}
    </div>
  );
}

function PlanModuleCard({
  entitlement,
}: {
  entitlement: KasaModuleEntitlement;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateKasaModulePlanAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form
      action={save}
      className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"
    >
      <input type="hidden" name="edition" value={entitlement.edition} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Kasa {editionLabels[entitlement.edition]}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Module policy
          </h2>
        </div>
        <button
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          <Save size={15} /> {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <label className="text-sm font-semibold text-slate-200">
          Certificate rule
        </label>
        <select
          name="certificateRule"
          defaultValue={entitlement.rules.certificateRule}
          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
        >
          {Object.entries(ruleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-3">
        {KASA_MODULES.map((module) => (
          <label
            key={module.key}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4"
          >
            <span>
              <span className="block text-sm font-semibold text-white">
                {module.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">
                {module.description}
              </span>
            </span>
            <input
              type="checkbox"
              name="features"
              value={module.key}
              defaultChecked={entitlement.features[module.key]}
              className="mt-1 h-5 w-5 accent-emerald-400"
            />
          </label>
        ))}
      </div>
    </form>
  );
}
