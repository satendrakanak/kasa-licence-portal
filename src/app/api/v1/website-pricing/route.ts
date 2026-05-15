import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKasaModuleEntitlements, KASA_MODULES } from "@/lib/kasa-modules";

export const dynamic = "force-dynamic";

const editionRank = {
  STARTER: 1,
  PLUS: 2,
  ENTERPRISE: 3,
} as const;

const planRank = {
  LIFETIME: 1,
  TWELVE_MONTHS: 2,
  SIX_MONTHS: 3,
  CUSTOM: 4,
} as const;

function formatPlan(plan: string) {
  return plan
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFeatureLabel(key: string) {
  return KASA_MODULES.find((module) => module.key === key)?.label || key;
}

export async function GET() {
  const [products, entitlements] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: [{ edition: "asc" }, { plan: "asc" }, { currency: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getKasaModuleEntitlements(),
  ]);

  const entitlementByEdition = new Map(
    entitlements.map((entitlement) => [entitlement.edition, entitlement]),
  );

  const plans = products
    .flatMap((product) =>
      product.prices.map((price) => {
        const entitlement = entitlementByEdition.get(price.edition);
        const enabledFeatures = Object.entries(entitlement?.features || {})
          .filter(([, enabled]) => enabled)
          .map(([key]) => formatFeatureLabel(key));

        return {
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
          },
          edition: price.edition,
          plan: price.plan,
          planLabel: formatPlan(price.plan),
          currency: price.currency,
          amount: Number(price.amount),
          maxActivations: price.maxActivations,
          userLimit: price.userLimit,
          courseLimit: price.courseLimit,
          facultyLimit: price.facultyLimit,
          features: enabledFeatures,
          rules: entitlement?.rules || null,
          highlighted: price.edition === "PLUS",
        };
      }),
    )
    .sort((left, right) => {
      const editionDiff =
        editionRank[left.edition] - editionRank[right.edition];
      if (editionDiff) return editionDiff;

      return planRank[left.plan] - planRank[right.plan];
    });

  return NextResponse.json({
    ok: true,
    plans,
  });
}
