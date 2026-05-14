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
          <select name="productPriceId" required className={`${inputClass} md:col-span-2`}>
            <option value="">Select product pricing</option>
            {products.map((product) => (
              product.prices
                .filter((price) => price.isActive)
                .map((price) => (
                  <option key={price.id} value={price.id}>
                    {product.name} · {price.edition} · {price.plan.replace("_", " ")} · {price.currency} {Number(price.amount).toLocaleString("en-IN")} · {price.maxActivations} install{price.maxActivations === 1 ? "" : "s"}
                  </option>
                ))
            ))}
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
          <button className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 md:col-span-2">
            Generate license
          </button>
        </form>
      </SectionCard>
    </section>
  );
}
