import { prisma } from "@/lib/prisma";

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

type BreakdownRow = {
  label: string;
  count: number;
  revenue: number;
};

function addBreakdownRow(
  rows: Record<string, BreakdownRow>,
  key: string,
  revenue: number,
) {
  rows[key] ??= { label: key, count: 0, revenue: 0 };
  rows[key].count += 1;
  rows[key].revenue += revenue;
}

export async function getDashboardData() {
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

  const paidSalesLicenses = salesLicenses.filter(
    (license) => Number(license.saleAmount) > 0,
  );
  const totalRevenue = paidSalesLicenses.reduce(
    (sum, license) => sum + Number(license.saleAmount),
    0,
  );
  const monthRevenue = paidSalesLicenses
    .filter((license) => license.soldAt >= monthStart)
    .reduce((sum, license) => sum + Number(license.saleAmount), 0);
  const yearRevenue = paidSalesLicenses
    .filter((license) => license.soldAt >= yearStart)
    .reduce((sum, license) => sum + Number(license.saleAmount), 0);

  const channelMap: Record<string, BreakdownRow> = {};
  const sourceMap: Record<string, BreakdownRow> = {};
  const editionMap: Record<string, BreakdownRow> = {};
  for (const license of paidSalesLicenses) {
    const revenue = Number(license.saleAmount);
    addBreakdownRow(channelMap, license.saleChannel || license.platform || "unknown", revenue);
    addBreakdownRow(sourceMap, license.marketingSource || "unknown", revenue);
    addBreakdownRow(editionMap, license.edition, revenue);
  }

  const monthRows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = getMonthKey(date);
    const rows = paidSalesLicenses.filter(
      (license) => getMonthKey(license.soldAt) === key,
    );

    return {
      label: getShortMonth(date),
      revenue: rows.reduce((sum, license) => sum + Number(license.saleAmount), 0),
      count: rows.length,
    };
  });

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

  return {
    products,
    licenses,
    activations,
    auditLogs,
    recentLeads,
    metrics: {
      productCount,
      licenseCount,
      activeInstallations,
      activeLicenses,
      leadCount,
      newLeadCount,
      expiringSoonCount,
      expiredCount,
      monthRevenue,
      yearRevenue,
      averageOrderValue: paidSalesLicenses.length
        ? Math.round(totalRevenue / paidSalesLicenses.length)
        : 0,
    },
    revenue: {
      monthRows,
      channelRows: Object.values(channelMap).sort((a, b) => b.revenue - a.revenue),
      sourceRows: Object.values(sourceMap).sort((a, b) => b.revenue - a.revenue),
      editionRows: Object.values(editionMap).sort((a, b) => b.revenue - a.revenue),
      recentSales: paidSalesLicenses.slice(0, 8),
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
