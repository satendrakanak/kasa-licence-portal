"use client";

import { PauseCircle, PlayCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  createProductPriceAction,
  deleteProductPriceAction,
  toggleProductPriceStatusAction,
} from "@/app/actions";

type ProductPricingControlsProps = {
  productId: string;
  prices: Array<{
    id: string;
    edition: string;
    plan: string;
    currency: string;
    amount: number;
    maxActivations: number;
    isActive: boolean;
  }>;
};

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none";

function priceLabel(price: ProductPricingControlsProps["prices"][number]) {
  return `${price.edition} · ${price.plan.replace("_", " ")} · ${price.currency} ${price.amount.toLocaleString("en-IN")} · ${price.maxActivations} install${price.maxActivations === 1 ? "" : "s"}`;
}

export function ProductPricingControls({ productId, prices }: ProductPricingControlsProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isChanging, startChanging] = useTransition();

  function savePrice(formData: FormData) {
    startSaving(async () => {
      formData.set("productId", productId);
      const result = await createProductPriceAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function togglePrice(priceId: string, nextActive: boolean) {
    startChanging(async () => {
      const formData = new FormData();
      formData.set("productPriceId", priceId);
      formData.set("isActive", String(nextActive));
      const result = await toggleProductPriceStatusAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function deletePrice(priceId: string) {
    startChanging(async () => {
      const formData = new FormData();
      formData.set("productPriceId", priceId);
      const result = await deleteProductPriceAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4 border-t border-white/10 pt-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-200">Pricing</p>
        {prices.length ? (
          <div className="space-y-2">
            {prices.map((price) => (
              <div
                key={price.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{priceLabel(price)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {price.isActive ? "Active for new licenses" : "Disabled"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => togglePrice(price.id, !price.isActive)}
                    disabled={isChanging}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
                  >
                    {price.isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    {price.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePrice(price.id)}
                    disabled={isChanging}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No pricing set yet.</p>
        )}
      </div>

      <form action={savePrice} className="grid gap-2 md:grid-cols-5">
        <select name="edition" defaultValue="ENTERPRISE" className={inputClass}>
          <option value="STARTER">Starter</option>
          <option value="PLUS">Plus</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select name="plan" defaultValue="LIFETIME" className={inputClass}>
          <option value="LIFETIME">Lifetime</option>
          <option value="SIX_MONTHS">6 months</option>
          <option value="TWELVE_MONTHS">12 months</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <select name="currency" defaultValue="INR" className={inputClass}>
          <option value="INR">INR</option>
          <option value="USD">USD</option>
        </select>
        <input name="amount" type="number" min={0} step="0.01" placeholder="Price" className={inputClass} />
        <input name="maxActivations" type="number" min={1} max={50} defaultValue={1} className={inputClass} />
        <button
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50 md:col-span-5"
        >
          <Save size={15} /> {isSaving ? "Saving..." : "Save pricing"}
        </button>
      </form>
    </div>
  );
}
