import { KeyRound, PackagePlus } from "lucide-react";
import { createProductAction } from "@/app/actions";
import { IssueLicenseForm } from "@/components/issue-license-form";
import type { DashboardData } from "@/lib/dashboard-data";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

const inputClass =
  "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-4 focus:ring-emerald-400/15";

export function OperationsSection({ products }: { products: DashboardData["products"] }) {
  const pricingProducts = products.map((product) => ({
    name: product.name,
    prices: product.prices.map((price) => ({
      id: price.id,
      edition: price.edition,
      plan: price.plan,
      currency: price.currency,
      amount: Number(price.amount),
      maxActivations: price.maxActivations,
      isActive: price.isActive,
    })),
  }));

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
        <IssueLicenseForm products={pricingProducts} />
      </SectionCard>
    </section>
  );
}
