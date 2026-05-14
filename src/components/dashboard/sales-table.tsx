import { Banknote } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";
import { displayLabel, formatMoney } from "@/lib/dashboard-format";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

export function SalesTable({ sales }: { sales: DashboardData["revenue"]["recentSales"] }) {
  return (
    <SectionCard>
      <SectionTitle
        icon={<Banknote />}
        title="Recent sales"
        description="Latest paid license sales with buyer, product, source, and amount."
      />
      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-950/70 text-slate-400">
            <tr>
              <th className="px-4 py-4">Buyer</th>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">Channel</th>
              <th className="px-4 py-4">Source</th>
              <th className="px-4 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((license) => (
              <tr key={license.id} className="border-t border-white/10">
                <td className="px-4 py-4">
                  <p className="font-semibold text-white">{license.buyerName || "Unnamed buyer"}</p>
                  <p className="mt-1 text-xs text-slate-500">{license.buyerEmail}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-slate-200">{license.product.name}</p>
                  <p className="mt-1 text-xs text-emerald-300">{license.edition}</p>
                </td>
                <td className="px-4 py-4 capitalize text-slate-300">
                  {displayLabel(license.saleChannel)}
                </td>
                <td className="px-4 py-4 capitalize text-slate-300">
                  {displayLabel(license.marketingSource || "unknown")}
                </td>
                <td className="px-4 py-4 text-right font-semibold text-white">
                  {formatMoney(Number(license.saleAmount), license.saleCurrency)}
                </td>
              </tr>
            ))}
            {sales.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-slate-400" colSpan={5}>
                  No paid sales yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
