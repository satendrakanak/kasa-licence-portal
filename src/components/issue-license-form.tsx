"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createLicenseAction } from "@/app/actions";
import { LicenseKeyActions } from "@/components/license-key-actions";

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-4 focus:ring-emerald-400/15";

type IssueLicenseFormProps = {
  products: Array<{
    name: string;
    prices: Array<{
      id: string;
      edition: string;
      plan: string;
      currency: string;
      amount: number;
      maxActivations: number;
      isActive: boolean;
    }>;
  }>;
};

export function IssueLicenseForm({ products }: IssueLicenseFormProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createLicenseAction(formData);

      if (result.ok && result.licenseKey) {
        setLicenseKey(result.licenseKey);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="mt-5 space-y-4">
      {licenseKey ? (
        <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">New license key generated</p>
          <p className="mt-2 break-all font-mono text-sm text-white md:text-base">{licenseKey}</p>
          <div className="mt-4">
            <LicenseKeyActions licenseKey={licenseKey} />
          </div>
        </div>
      ) : null}

      <form action={submit} className="grid gap-3 md:grid-cols-2">
        <select name="productPriceId" required className={`${inputClass} md:col-span-2`}>
          <option value="">Select product pricing</option>
          {products.map((product) =>
            product.prices
              .filter((price) => price.isActive)
              .map((price) => (
                <option key={price.id} value={price.id}>
                  {product.name} · {price.edition} · {price.plan.replace("_", " ")} · {price.currency}{" "}
                  {price.amount.toLocaleString("en-IN")} · {price.maxActivations} install
                  {price.maxActivations === 1 ? "" : "s"}
                </option>
              )),
          )}
        </select>
        <input name="buyerName" placeholder="Buyer name" className={inputClass} />
        <input name="buyerEmail" type="email" required placeholder="buyer@email.com" className={inputClass} />
        <input name="platform" defaultValue="manual" placeholder="envato / direct / manual" className={inputClass} />
        <input name="purchaseRef" placeholder="Purchase reference" className={inputClass} />
        <select name="saleChannel" defaultValue="direct-website" className={inputClass}>
          <option value="direct-website">Direct website</option>
          <option value="envato">Envato</option>
          <option value="manual-invoice">Manual invoice</option>
          <option value="partner">Partner</option>
        </select>
        <input name="marketingSource" placeholder="fb / instagram / google / referral" className={inputClass} />
        <input name="soldAt" type="date" className={inputClass} />
        <input name="expiresAt" type="date" className={inputClass} />
        <input name="renewalUrl" type="url" placeholder="Renewal URL" className={`${inputClass} md:col-span-2`} />
        <textarea name="notes" placeholder="Internal notes" className={`${inputClass} min-h-24 md:col-span-2`} />
        <button
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
        >
          <KeyRound size={16} /> {isPending ? "Generating..." : "Generate license"}
        </button>
      </form>
    </div>
  );
}
