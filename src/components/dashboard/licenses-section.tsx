import { Eye, ShieldCheck } from "lucide-react";
import { LicenseKeyActions } from "@/components/license-key-actions";
import { LicenseRowActions, LicenseStatusControl } from "@/components/license-table-controls";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";
import type { DashboardData } from "@/lib/dashboard-data";
import { decryptLicenseKey } from "@/lib/crypto";
import { formatDate, formatMoney } from "@/lib/dashboard-format";

export function LicensesSection({ licenses }: { licenses: DashboardData["licenses"] }) {
  return (
    <SectionCard>
      <SectionTitle
        icon={<ShieldCheck />}
        title="Recent licenses"
        description="Control buyer access, activation limits, license status, and key recovery."
      />
      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1320px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[255px]" />
            <col className="w-[190px]" />
            <col className="w-[350px]" />
            <col className="w-[125px]" />
            <col className="w-[180px]" />
            <col className="w-[125px]" />
            <col className="w-[165px]" />
            <col className="w-[130px]" />
          </colgroup>
          <thead className="bg-slate-950/70 text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-4 py-4">Buyer</th>
              <th className="px-4 py-4">Product</th>
              <th className="px-4 py-4">License key</th>
              <th className="px-4 py-4">Edition</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Installs</th>
              <th className="px-4 py-4">Expiry</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => {
              const fullKey = decryptLicenseKey(license.keyEncrypted);
              const activeActivations = license.activations.filter(
                (item) => item.status === "ACTIVE",
              ).length;
              const deactivatedActivations = license.activations.filter(
                (item) => item.status === "DEACTIVATED",
              ).length;

              return (
                <tr key={license.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-5 align-top">
                    <p className="break-words font-semibold text-white">{license.buyerName || "Unnamed buyer"}</p>
                    <p className="mt-1 break-all text-slate-400">{license.buyerEmail}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {license.platform}
                      {license.purchaseRef ? ` · ${license.purchaseRef}` : ""}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-emerald-300">
                      {formatMoney(Number(license.saleAmount), license.saleCurrency)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {license.saleChannel}
                      {license.marketingSource ? ` · ${license.marketingSource}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Sold {formatDate(license.soldAt)}
                    </p>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <p className="break-words font-medium text-slate-200">{license.product.name}</p>
                    <p className="mt-1 font-mono text-xs text-emerald-300">{license.product.slug}</p>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <div className="break-all font-mono text-emerald-300">{license.keyPreview}</div>
                    {fullKey ? (
                      <details className="mt-3 rounded-xl border border-white/10 bg-slate-950/80 p-3">
                        <summary className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-200">
                          <Eye size={14} /> Reveal full key
                        </summary>
                        <p className="mt-3 break-all font-mono text-xs text-white">{fullKey}</p>
                        <div className="mt-3">
                          <LicenseKeyActions
                            licenseKey={fullKey}
                            filename={`${license.product.slug}-${license.keyPreview.replace(/[^a-zA-Z0-9]/g, "-")}.txt`}
                          />
                        </div>
                      </details>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-amber-200">
                        Full key is unavailable for this older hashed-only record. Reissue a new key if needed.
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-5 align-top">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                      {license.edition}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">
                      {license.plan.replace("_", " ")}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Users {license.userLimit ?? "∞"} · Courses {license.courseLimit ?? "∞"} · Faculty{" "}
                      {license.facultyLimit ?? "∞"}
                    </p>
                    {license.renewalUrl ? (
                      <a
                        href={license.renewalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-xs text-emerald-300 hover:text-emerald-200"
                      >
                        Renewal link
                      </a>
                    ) : null}
                    {license.expiryNoticeLastSentAt ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Notice sent {formatDate(license.expiryNoticeLastSentAt)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-5 align-top">
                    <LicenseStatusControl licenseId={license.id} status={license.status} />
                  </td>
                  <td className="px-4 py-5 align-top">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200">
                      {activeActivations}/{license.maxActivations}
                    </span>
                    {deactivatedActivations > 0 ? (
                      <p className="mt-2 text-xs text-red-200">
                        {deactivatedActivations} deactivated
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-5 align-top text-slate-300">
                    {formatDate(license.expiresAt)}
                  </td>
                  <td className="px-4 py-5 align-top">
                    <LicenseRowActions
                      licenseId={license.id}
                      status={license.status}
                      canDelete={activeActivations === 0}
                      hasDownload={Boolean(license.keyEncrypted)}
                    />
                  </td>
                </tr>
              );
            })}
            {licenses.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-slate-400" colSpan={8}>
                  No licenses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
