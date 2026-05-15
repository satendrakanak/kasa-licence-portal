"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateDemoOperationsAction } from "@/app/actions";
import type { DemoOperationsSettings } from "@/lib/demo-settings";

type DemoOperationsControlsProps = {
  settings: DemoOperationsSettings;
};

export function DemoOperationsControls({
  settings,
}: DemoOperationsControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updateDemoOperationsAction(formData);
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
      className="rounded-3xl border border-emerald-400/20 bg-emerald-950/20 p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
            Demo operations
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Take a Tour control
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Control whether the public website can create temporary demo
            workspaces. Software reads this from KASA Admin at runtime, so no
            env edit is needed.
          </p>
        </div>
        <button
          disabled={isPending}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-400/30 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={15} /> {isPending ? "Saving..." : "Save demo control"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <span>
            <span className="block text-sm font-semibold text-white">
              Enable Take a Tour
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              Allows new one-hour demo accounts from getkasa.in.
            </span>
          </span>
          <input
            type="checkbox"
            name="demoToursEnabled"
            defaultChecked={settings.demoToursEnabled}
            className="mt-1 h-5 w-5 accent-emerald-400"
          />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <span>
            <span className="block text-sm font-semibold text-white">
              Restore demo data on expiry
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              Cleans temporary demo changes after access expires.
            </span>
          </span>
          <input
            type="checkbox"
            name="demoResetOnExpiry"
            defaultChecked={settings.demoResetOnExpiry}
            className="mt-1 h-5 w-5 accent-emerald-400"
          />
        </label>
      </div>
    </form>
  );
}
