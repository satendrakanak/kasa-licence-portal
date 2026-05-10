import {
  Activity,
  Archive,
  Boxes,
  CheckCircle2,
  Download,
  Eye,
  KeyRound,
  LogOut,
  MonitorCheck,
  PackagePlus,
  PauseCircle,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  createLicenseAction,
  createProductAction,
  deactivateActivationAction,
  deleteUnusedLicenseAction,
  logoutAction,
  toggleProductStatusAction,
  updateLicenseStatusAction,
} from "@/app/actions";
import { LicenseKeyActions } from "@/components/license-key-actions";
import { requireAdmin } from "@/lib/auth";
import { decryptLicenseKey } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null | undefined) {
  if (!date) return "Lifetime";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function stat(label: string, value: string | number, helper: string) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-semibold">{value}</p>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ newKey?: string; licenseDelete?: string; licenseStatus?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const [products, licenses, activations, auditLogs, totals] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.license.findMany({
      include: { product: true, activations: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.licenseActivation.findMany({
      include: { license: { include: { product: true } } },
      orderBy: { lastSeenAt: "desc" },
      take: 20,
    }),
    prisma.auditLog.findMany({
      include: { license: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    Promise.all([
      prisma.product.count(),
      prisma.license.count(),
      prisma.licenseActivation.count({ where: { status: "ACTIVE" } }),
      prisma.license.count({ where: { status: "ACTIVE" } }),
    ]),
  ]);

  const [productCount, licenseCount, activeInstallations, activeLicenses] = totals;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#064e3b_0%,#020617_34%,#020617_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-300">Kasa Licence Portal</p>
            <h1 className="mt-1 text-xl font-semibold">Product licensing workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 sm:block">
              {admin.name}
            </div>
            <Link
              href="/account/password"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Change password
            </Link>
            <form action={logoutAction}>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
                <LogOut size={16} /> Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-200/50 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-400 p-8 shadow-2xl shadow-emerald-950/30">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-emerald-100">Licence Operations</p>
              <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
                Sell once, control activations, and keep every product protected.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50/80">
                Manage marketplace buyers, direct customers, product editions, installation limits,
                expiry rules, and audit history from one clean portal.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-50/70">Active licenses</p>
                <p className="mt-3 text-4xl font-semibold">{activeLicenses}</p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-50/70">Installations</p>
                <p className="mt-3 text-4xl font-semibold">{activeInstallations}</p>
              </div>
            </div>
          </div>
        </section>

        {params.newKey ? (
          <section className="rounded-3xl border border-emerald-300/40 bg-emerald-400/10 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-200">New license key generated</p>
                <p className="mt-2 font-mono text-lg text-white">{params.newKey}</p>
                <p className="mt-1 text-sm text-slate-400">You can copy or download it now. It is also stored encrypted for admin recovery.</p>
              </div>
              <LicenseKeyActions licenseKey={params.newKey} />
            </div>
          </section>
        ) : null}

        {params.licenseDelete ? (
          <section
            className={`rounded-3xl border p-5 ${
              params.licenseDelete === "success"
                ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                : "border-amber-300/40 bg-amber-400/10 text-amber-100"
            }`}
          >
            {params.licenseDelete === "success"
              ? "Unused license deleted successfully."
              : params.licenseDelete === "active"
                ? "This license has an active installation. Deactivate the installation before deleting it."
                : "License could not be found."}
          </section>
        ) : null}

        {params.licenseStatus === "updated" ? (
          <section className="rounded-3xl border border-emerald-300/40 bg-emerald-400/10 p-5 text-emerald-100">
            License status updated successfully.
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {stat("Products", productCount, "Future products can share this portal")}
          {stat("Licenses", licenseCount, "Marketplace and direct buyers")}
          {stat("Active installs", activeInstallations, "Current bound instances")}
          {stat("Healthy keys", activeLicenses, "Ready for activation checks")}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form action={createProductAction} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <PackagePlus className="text-emerald-300" />
              <h2 className="text-2xl font-semibold">Add product</h2>
            </div>
            <div className="mt-6 grid gap-4">
              <input name="name" required placeholder="Kasa Enterprise" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-400/20" />
              <input name="slug" required placeholder="kasa-enterprise" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-400/20" />
              <textarea name="description" placeholder="Product notes" className="min-h-28 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-400/20" />
              <button className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300">
                Save product
              </button>
            </div>
          </form>

          <form action={createLicenseAction} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <KeyRound className="text-emerald-300" />
              <h2 className="text-2xl font-semibold">Issue license</h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <select name="productId" required className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none md:col-span-2">
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input name="buyerName" placeholder="Buyer name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="buyerEmail" type="email" required placeholder="buyer@email.com" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="platform" defaultValue="manual" placeholder="envato / direct / manual" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="purchaseRef" placeholder="Purchase reference" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <select name="plan" defaultValue="LIFETIME" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">
                <option value="LIFETIME">Lifetime</option>
                <option value="SIX_MONTHS">6 months</option>
                <option value="TWELVE_MONTHS">12 months</option>
                <option value="CUSTOM">Custom expiry</option>
              </select>
              <input name="expiresAt" type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="maxActivations" type="number" min={1} max={50} defaultValue={1} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <textarea name="notes" placeholder="Internal notes" className="min-h-24 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none md:col-span-2" />
              <button className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300 md:col-span-2">
                Generate license
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3">
            <Boxes className="text-emerald-300" />
            <h2 className="text-2xl font-semibold">Products</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="mt-1 font-mono text-sm text-emerald-300">{product.slug}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{product.status}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{product.description || "No description yet."}</p>
                <form action={toggleProductStatusAction} className="mt-5">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="status" value={product.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"} />
                  <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
                    {product.status === "ACTIVE" ? <Archive size={16} /> : <CheckCircle2 size={16} />}
                    {product.status === "ACTIVE" ? "Archive" : "Restore"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-300" />
            <h2 className="text-2xl font-semibold">Recent licenses</h2>
          </div>
          <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full min-w-[1280px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[250px]" />
                <col className="w-[190px]" />
                <col className="w-[350px]" />
                <col className="w-[115px]" />
                <col className="w-[190px]" />
                <col className="w-[130px]" />
                <col className="w-[150px]" />
                <col className="w-[210px]" />
              </colgroup>
              <thead className="bg-slate-950/70 text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4">Buyer</th>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">License key</th>
                  <th className="px-4 py-4">Plan</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Installs</th>
                  <th className="px-4 py-4">Expiry</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((license) => (
                  <tr key={license.id} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-5 align-top">
                      <p className="break-words font-semibold">{license.buyerName || "Unnamed buyer"}</p>
                      <p className="mt-1 break-all text-slate-400">{license.buyerEmail}</p>
                      {license.purchaseRef ? (
                        <p className="mt-2 text-xs text-slate-500">{license.platform} · {license.purchaseRef}</p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">{license.platform}</p>
                      )}
                    </td>
                    <td className="px-4 py-5 align-top">
                      <p className="break-words font-medium">{license.product.name}</p>
                      <p className="mt-1 font-mono text-xs text-emerald-300">{license.product.slug}</p>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <div className="break-all font-mono text-emerald-300">{license.keyPreview}</div>
                      {(() => {
                        const fullKey = decryptLicenseKey(license.keyEncrypted);
                        return fullKey ? (
                          <details className="mt-3 rounded-2xl border border-white/10 bg-slate-950/80 p-3">
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
                        );
                      })()}
                    </td>
                    <td className="px-4 py-5 align-top">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                        {license.plan.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <form action={updateLicenseStatusAction} className="space-y-2">
                        <input type="hidden" name="licenseId" value={license.id} />
                        <select
                          key={`${license.id}-${license.status}`}
                          name="status"
                          defaultValue={license.status}
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none"
                        >
                          {["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "REFUNDED"].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10">
                          Save status
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-5 align-top">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-sm">
                        {license.activations.filter((item) => item.status === "ACTIVE").length}/{license.maxActivations}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top text-slate-300">{formatDate(license.expiresAt)}</td>
                    <td className="px-4 py-5 align-top">
                      <div className="flex flex-col items-stretch gap-2">
                        {license.keyEncrypted ? (
                          <a
                            href={`/api/admin/licenses/${license.id}/download`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 hover:bg-white/10"
                          >
                            <Download size={14} /> TXT
                          </a>
                        ) : null}
                        <form action={deleteUnusedLicenseAction}>
                          <input type="hidden" name="licenseId" value={license.id} />
                          <button
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={license.activations.some((activation) => activation.status === "ACTIVE")}
                            title={
                              license.activations.some((activation) => activation.status === "ACTIVE")
                                ? "Deactivate active installations before deleting this license."
                                : "Delete unused license"
                            }
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <MonitorCheck className="text-emerald-300" />
              <h2 className="text-2xl font-semibold">Installations</h2>
            </div>
            <div className="mt-5 space-y-3">
              {activations.map((activation) => (
                <div key={activation.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{activation.instanceLabel || "Unnamed instance"}</p>
                      <p className="text-sm text-slate-400">{activation.license.product.name} · {activation.license.keyPreview}</p>
                      <p className="mt-2 text-xs text-slate-500">Last seen {formatDate(activation.lastSeenAt)}</p>
                    </div>
                    <form action={deactivateActivationAction}>
                      <input type="hidden" name="activationId" value={activation.id} />
                      <button className="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10">
                        <PauseCircle size={16} /> Deactivate
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {activations.length === 0 ? <p className="text-slate-400">No installations yet.</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <Activity className="text-emerald-300" />
              <h2 className="text-2xl font-semibold">Audit trail</h2>
            </div>
            <div className="mt-5 space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <p className="font-semibold">{log.action}</p>
                  <p className="text-sm text-slate-400">
                    {log.license?.product.name || "System"} · {log.actor || "unknown actor"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                </div>
              ))}
              {auditLogs.length === 0 ? <p className="text-slate-400">No activity yet.</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3">
            <UserRound className="text-emerald-300" />
            <h2 className="text-2xl font-semibold">Client activation API</h2>
          </div>
          <pre className="mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950 p-5 text-sm text-slate-300">
{`POST /api/v1/licenses/activate
{
  "licenseKey": "KASA-XXXX-XXXX-XXXX-XXXX",
  "productSlug": "kasa-enterprise",
  "instanceId": "server-or-installation-uuid",
  "instanceLabel": "Client production server",
  "productVersion": "1.0.0"
}`}
          </pre>
        </section>
      </div>
    </main>
  );
}
