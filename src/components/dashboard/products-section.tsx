import { Boxes } from "lucide-react";
import { ProductCardControls } from "@/components/product-card-controls";
import { ProductPricingControls } from "@/components/product-pricing-controls";
import type { DashboardData } from "@/lib/dashboard-data";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

export function ProductsSection({ products }: { products: DashboardData["products"] }) {
  return (
    <SectionCard>
      <SectionTitle icon={<Boxes />} title="Products" />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <article key={product.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-1 truncate font-mono text-sm text-emerald-300">{product.slug}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {product._count.licenses} license{product._count.licenses === 1 ? "" : "s"}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {product.status}
              </span>
            </div>
            <div className="mt-5">
              <ProductCardControls
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  description: product.description,
                  status: product.status,
                  licenseCount: product._count.licenses,
                }}
              />
            </div>
            <div className="mt-5">
              <ProductPricingControls
                productId={product.id}
                prices={product.prices.map((price) => ({
                  id: price.id,
                  edition: price.edition,
                  plan: price.plan,
                  currency: price.currency,
                  amount: Number(price.amount),
                  maxActivations: price.maxActivations,
                  envatoItemId: price.envatoItemId,
                  isActive: price.isActive,
                }))}
              />
            </div>
          </article>
        ))}
        {products.length === 0 ? <p className="text-sm text-slate-400">No products yet.</p> : null}
      </div>
    </SectionCard>
  );
}
