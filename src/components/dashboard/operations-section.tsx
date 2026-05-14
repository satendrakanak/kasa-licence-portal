import { KeyRound, PackagePlus } from "lucide-react";
import { createLicenseAction, createProductAction } from "@/app/actions";
import type { DashboardData } from "@/lib/dashboard-data";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-4 focus:ring-emerald-400/15";

export function OperationsSection({ products }: { products: DashboardData["products"] }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
      <SectionCard>
        <SectionTitle icon={<PackagePlus />} title="Add product" />
        <form action={createProductAction} className="mt-5 grid gap-3">
          <input name="name" required placeholder="Kasa Enterprise" className={inputClass} />
          <input name="slug" required placeholder="kasa-enterprise" className={inputClass} />
          <textarea
            name="description"
            placeholder="Product notes"
            className={`${inputClass} min-h-28`}
          />
          <button className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
            Save product
          </button>
        </form>
      </SectionCard>

      <SectionCard>
        <SectionTitle
          icon={<KeyRound />}
          title="Issue license"
          description="Create a buyer license with plan, sales source, expiry, and activation limit."
        />
        <form action={createLicenseAction} className="mt-5 grid gap-3 md:grid-cols-2">
          <select name="productId" required className={`${inputClass} md:col-span-2`}>
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <input name="buyerName" placeholder="Buyer name" className={inputClass} />
          <input name="buyerEmail" type="email" required placeholder="buyer@email.com" className={inputClass} />
          <input name="platform" defaultValue="manual" placeholder="envato / direct / manual" className={inputClass} />
          <input name="purchaseRef" placeholder="Purchase reference" className={inputClass} />
          <input name="saleAmount" type="number" min={0} step="0.01" placeholder="Sale amount" className={inputClass} />
          <input name="saleCurrency" defaultValue="INR" maxLength={3} placeholder="INR" className={`${inputClass} uppercase`} />
          <select name="saleChannel" defaultValue="direct-website" className={inputClass}>
            <option value="direct-website">Direct website</option>
            <option value="envato">Envato</option>
            <option value="manual-invoice">Manual invoice</option>
            <option value="partner">Partner</option>
          </select>
          <input name="marketingSource" placeholder="fb / instagram / google / referral" className={inputClass} />
          <input name="soldAt" type="date" className={inputClass} />
          <select name="edition" defaultValue="ENTERPRISE" className={inputClass}>
            <option value="STARTER">KASA Starter</option>
            <option value="PLUS">KASA Plus</option>
            <option value="ENTERPRISE">KASA Enterprise</option>
          </select>
          <select name="plan" defaultValue="LIFETIME" className={inputClass}>
            <option value="LIFETIME">Lifetime</option>
            <option value="SIX_MONTHS">6 months</option>
            <option value="TWELVE_MONTHS">12 months</option>
            <option value="CUSTOM">Custom expiry</option>
          </select>
          <input name="expiresAt" type="date" className={inputClass} />
          <input name="maxActivations" type="number" min={1} max={50} defaultValue={1} className={inputClass} />
          <input name="renewalUrl" type="url" placeholder="Renewal URL" className={`${inputClass} md:col-span-2`} />
          <textarea name="notes" placeholder="Internal notes" className={`${inputClass} min-h-24 md:col-span-2`} />
          <button className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 md:col-span-2">
            Generate license
          </button>
        </form>
      </SectionCard>
    </section>
  );
}
