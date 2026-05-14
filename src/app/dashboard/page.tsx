import {
  Activity,
  Banknote,
  BarChart3,
  Boxes,
  ChevronRight,
  Eye,
  KeyRound,
  LogOut,
  MonitorCheck,
  PackagePlus,
  PauseCircle,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  createLicenseAction,
  createProductAction,
  deactivateActivationAction,
  logoutAction,
} from "@/app/actions";
import { LicenseKeyActions } from "@/components/license-key-actions";
import { LicenseRowActions, LicenseStatusControl } from "@/components/license-table-controls";
import { ProductCardControls } from "@/components/product-card-controls";
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

function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getShortMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
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

function BreakdownCard({
  icon,
  title,
  rows,
}: {
  icon: ReactNode;
  title: string;
  rows: Array<{ label: string; count: number; revenue: number }>;
}) {
  const peak = Math.max(...rows.map((row) => row.revenue), 1);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium capitalize text-slate-200">
                {row.label.replace(/[-_]/g, " ")}
              </span>
              <span className="text-slate-400">
                {formatMoney(row.revenue)} · {row.count}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-950">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${Math.max(4, Math.round((row.revenue / peak) * 100))}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">No paid sales recorded yet.</p>
        ) : null}
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ newKey?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const expiryWindow = new Date(now);
  expiryWindow.setDate(expiryWindow.getDate() + 15);

  const [
    products,
    licenses,
    activations,
    auditLogs,
    recentLeads,
    salesLicenses,
    totals,
  ] = await Promise.all([
    prisma.product.findMany({
      include: {
        _count: {
          select: {
            licenses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
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
    prisma.lead.findMany({
      include: { assignedTo: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.license.findMany({
      include: { product: true },
      where: {
        soldAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: { soldAt: "desc" },
      take: 500,
    }),
    Promise.all([
      prisma.product.count(),
      prisma.license.count(),
      prisma.licenseActivation.count({ where: { status: "ACTIVE" } }),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.license.count({
        where: {
          status: "ACTIVE",
          expiresAt: {
            gt: now,
            lte: expiryWindow,
          },
        },
      }),
      prisma.license.count({
        where: {
          OR: [
            { status: "EXPIRED" },
            {
              status: "ACTIVE",
              expiresAt: {
                lte: now,
              },
            },
          ],
        },
      }),
    ]),
  ]);

  const [
    productCount,
    licenseCount,
    activeInstallations,
    activeLicenses,
    leadCount,
    newLeadCount,
    expiringSoonCount,
    expiredCount,
  ] = totals;
  const paidSalesLicenses = salesLicenses.filter(
    (license) => Number(license.saleAmount) > 0,
  );
  const monthRevenue = paidSalesLicenses
    .filter((license) => license.soldAt >= monthStart)
    .reduce((sum, license) => sum + Number(license.saleAmount), 0);
  const yearRevenue = paidSalesLicenses
    .filter((license) => license.soldAt >= yearStart)
    .reduce((sum, license) => sum + Number(license.saleAmount), 0);
  const totalRevenue = paidSalesLicenses.reduce(
    (sum, license) => sum + Number(license.saleAmount),
    0,
  );
  const averageOrderValue = paidSalesLicenses.length
    ? Math.round(totalRevenue / paidSalesLicenses.length)
    : 0;
  const channelRows = Object.values(
    paidSalesLicenses.reduce(
      (acc, license) => {
        const key = license.saleChannel || license.platform || "unknown";
        acc[key] ??= { label: key, count: 0, revenue: 0 };
        acc[key].count += 1;
        acc[key].revenue += Number(license.saleAmount);
        return acc;
      },
      {} as Record<string, { label: string; count: number; revenue: number }>,
    ),
  ).sort((a, b) => b.revenue - a.revenue);
  const sourceRows = Object.values(
    paidSalesLicenses.reduce(
      (acc, license) => {
        const key = license.marketingSource || "unknown";
        acc[key] ??= { label: key, count: 0, revenue: 0 };
        acc[key].count += 1;
        acc[key].revenue += Number(license.saleAmount);
        return acc;
      },
      {} as Record<string, { label: string; count: number; revenue: number }>,
    ),
  ).sort((a, b) => b.revenue - a.revenue);
  const editionRows = Object.values(
    paidSalesLicenses.reduce(
      (acc, license) => {
        const key = license.edition;
        acc[key] ??= { label: key, count: 0, revenue: 0 };
        acc[key].count += 1;
        acc[key].revenue += Number(license.saleAmount);
        return acc;
      },
      {} as Record<string, { label: string; count: number; revenue: number }>,
    ),
  ).sort((a, b) => b.revenue - a.revenue);
  const monthRows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = getMonthKey(date);
    const revenue = paidSalesLicenses
      .filter((license) => getMonthKey(license.soldAt) === key)
      .reduce((sum, license) => sum + Number(license.saleAmount), 0);
    const count = paidSalesLicenses.filter(
      (license) => getMonthKey(license.soldAt) === key,
    ).length;

    return {
      label: getShortMonth(date),
      revenue,
      count,
    };
  });
  const recentSales = paidSalesLicenses.slice(0, 8);

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
              href="/dashboard/leads"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Leads
            </Link>
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
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-50/70">New leads</p>
                <p className="mt-3 text-4xl font-semibold">{newLeadCount}</p>
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

        <section className="grid gap-4 md:grid-cols-4 xl:grid-cols-8">
          {stat("Month revenue", formatMoney(monthRevenue), "Closed sales this month")}
          {stat("Year revenue", formatMoney(yearRevenue), "Closed sales this year")}
          {stat("Avg order", formatMoney(averageOrderValue), "Across paid license sales")}
          {stat("Products", productCount, "Future products can share this portal")}
          {stat("Licenses", licenseCount, "Marketplace and direct buyers")}
          {stat("Active installs", activeInstallations, "Current bound instances")}
          {stat("Healthy keys", activeLicenses, "Ready for activation checks")}
          {stat("Expiring soon", expiringSoonCount, "Ending within 15 days")}
          {stat("Expired", expiredCount, "Needs renewal follow-up")}
          {stat("All leads", leadCount, "Queries captured from the marketing site")}
          {stat("Fresh leads", newLeadCount, "Awaiting first response")}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-emerald-300" />
              <div>
                <h2 className="text-2xl font-semibold">Revenue trend</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Six-month sales view across direct, marketplace, and campaign channels.
                </p>
              </div>
            </div>
            <div className="mt-6 grid h-72 grid-cols-6 items-end gap-3">
              {monthRows.map((row) => {
                const peak = Math.max(...monthRows.map((item) => item.revenue), 1);
                const height = Math.max(8, Math.round((row.revenue / peak) * 100));

                return (
                  <div key={row.label} className="flex h-full flex-col justify-end gap-3">
                    <div className="text-center text-xs text-slate-400">
                      <p>{formatMoney(row.revenue)}</p>
                      <p>{row.count} sale{row.count === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex h-48 items-end rounded-2xl bg-slate-950 p-2">
                      <div
                        className="w-full rounded-xl bg-emerald-400"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <p className="text-center text-xs font-medium text-slate-300">
                      {row.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6">
            <BreakdownCard
              icon={<Banknote className="text-emerald-300" />}
              title="Sales by channel"
              rows={channelRows}
            />
            <BreakdownCard
              icon={<TrendingUp className="text-emerald-300" />}
              title="Marketing source"
              rows={sourceRows}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <BreakdownCard
            icon={<ShieldCheck className="text-emerald-300" />}
            title="Edition revenue"
            rows={editionRows}
          />
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="flex items-center gap-3">
              <Banknote className="text-emerald-300" />
              <div>
                <h2 className="text-2xl font-semibold">Recent sales</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Latest paid license sales with buyer, source, and amount.
                </p>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
              <table className="w-full min-w-[760px] text-left text-sm">
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
                  {recentSales.map((license) => (
                    <tr key={license.id} className="border-t border-white/10">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{license.buyerName || "Unnamed buyer"}</p>
                        <p className="mt-1 text-xs text-slate-500">{license.buyerEmail}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{license.product.name}</p>
                        <p className="mt-1 text-xs text-emerald-300">{license.edition}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{license.saleChannel}</td>
                      <td className="px-4 py-4 text-slate-300">{license.marketingSource || "unknown"}</td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {formatMoney(Number(license.saleAmount), license.saleCurrency)}
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 ? (
                    <tr>
                      <td className="px-4 py-5 text-slate-400" colSpan={5}>
                        No paid sales yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <UserRound className="text-emerald-300" />
              <div>
                <h2 className="text-2xl font-semibold">Recent leads</h2>
                <p className="mt-1 text-sm text-slate-400">
                  New website queries auto-land here and can be assigned from the leads workspace.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/leads"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Open leads workspace <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentLeads.map((lead) => (
              <article key={lead.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{lead.name}</h3>
                    <p className="mt-1 text-sm text-emerald-300">{lead.email}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {lead.status}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{lead.message}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{lead.institute || "No institute shared"}</span>
                  <span>{lead.assignedTo?.name || "Unassigned"}</span>
                </div>
              </article>
            ))}
          </div>
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
              <input name="saleAmount" type="number" min={0} step="0.01" placeholder="Sale amount" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="saleCurrency" defaultValue="INR" maxLength={3} placeholder="INR" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 uppercase outline-none" />
              <select name="saleChannel" defaultValue="direct-website" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">
                <option value="direct-website">Direct website</option>
                <option value="envato">Envato</option>
                <option value="manual-invoice">Manual invoice</option>
                <option value="partner">Partner</option>
              </select>
              <input name="marketingSource" placeholder="fb / instagram / google / referral" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="soldAt" type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <select name="edition" defaultValue="ENTERPRISE" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">
                <option value="STARTER">KASA Starter</option>
                <option value="PLUS">KASA Plus</option>
                <option value="ENTERPRISE">KASA Enterprise</option>
              </select>
              <select name="plan" defaultValue="LIFETIME" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">
                <option value="LIFETIME">Lifetime</option>
                <option value="SIX_MONTHS">6 months</option>
                <option value="TWELVE_MONTHS">12 months</option>
                <option value="CUSTOM">Custom expiry</option>
              </select>
              <input name="expiresAt" type="date" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="maxActivations" type="number" min={1} max={50} defaultValue={1} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none" />
              <input name="renewalUrl" type="url" placeholder="Renewal URL" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none md:col-span-2" />
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
                    <p className="mt-2 text-xs text-slate-500">
                      {product._count.licenses} license{product._count.licenses === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{product.status}</span>
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
                  <th className="px-4 py-4">Edition</th>
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
                      <p className="mt-2 text-xs font-semibold text-emerald-300">
                        {formatMoney(Number(license.saleAmount), license.saleCurrency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {license.saleChannel}
                        {license.marketingSource ? ` · ${license.marketingSource}` : ""}
                      </p>
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
                        {license.edition}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        {license.plan.replace("_", " ")}
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
                      <span className="rounded-full border border-white/10 px-3 py-1 text-sm">
                        {license.activations.filter((item) => item.status === "ACTIVE").length}/{license.maxActivations}
                      </span>
                    </td>
                    <td className="px-4 py-5 align-top text-slate-300">{formatDate(license.expiresAt)}</td>
                    <td className="px-4 py-5 align-top">
                      <LicenseRowActions
                        licenseId={license.id}
                        canDelete={!license.activations.some((activation) => activation.status === "ACTIVE")}
                        hasDownload={Boolean(license.keyEncrypted)}
                      />
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
  "licenseKey": "KASA-ENTERPRISE-XXXXXX-XXXXXX-XXXXXX-XXXXXX",
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
