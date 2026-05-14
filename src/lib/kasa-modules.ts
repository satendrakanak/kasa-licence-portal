import { KasaEdition } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const KASA_MODULES = [
  {
    key: "courses",
    label: "Courses",
    description: "Course catalog, curriculum, and lessons.",
  },
  {
    key: "faculty",
    label: "Faculty workspace",
    description: "Faculty dashboard, classes, and course ownership.",
  },
  {
    key: "liveClasses",
    label: "Live classes",
    description: "Live sessions, calendars, and classroom access.",
  },
  {
    key: "exams",
    label: "Exams",
    description: "Course exams, question banks, and attempts.",
  },
  {
    key: "assignments",
    label: "Assignments",
    description: "Assignment workflows and submissions.",
  },
  {
    key: "certificates",
    label: "Certificates",
    description: "Certificate dashboards and certificate generation.",
  },
  {
    key: "coupons",
    label: "Coupons",
    description: "Coupons, discounts, and redemption controls.",
  },
  {
    key: "emailTemplates",
    label: "Email templates",
    description: "Transactional email template management.",
  },
  {
    key: "engagement",
    label: "Engagement",
    description: "Notifications, reminders, and learner engagement tools.",
  },
  {
    key: "advancedSettings",
    label: "Advanced settings",
    description: "High-risk operational settings and access controls.",
  },
  {
    key: "branding",
    label: "Branding",
    description: "Site identity and brand controls.",
  },
  {
    key: "prioritySupport",
    label: "Priority support",
    description: "Support entitlement indicator for enterprise buyers.",
  },
] as const;

export type KasaModuleKey = (typeof KASA_MODULES)[number]["key"];
export type CertificateRule = "lecture_completion" | "exam_pass";
export type KasaModuleFeatures = Record<KasaModuleKey, boolean>;
export type KasaModuleRules = {
  certificateRule: CertificateRule;
};
export type KasaModuleEntitlement = {
  edition: KasaEdition;
  features: KasaModuleFeatures;
  rules: KasaModuleRules;
};

const moduleKeys = KASA_MODULES.map((module) => module.key);

const baseFeatures: KasaModuleFeatures = {
  courses: true,
  faculty: true,
  liveClasses: false,
  exams: false,
  assignments: false,
  certificates: false,
  coupons: false,
  emailTemplates: false,
  engagement: false,
  advancedSettings: false,
  branding: false,
  prioritySupport: false,
};

export const DEFAULT_KASA_MODULE_ENTITLEMENTS: Record<
  KasaEdition,
  KasaModuleEntitlement
> = {
  STARTER: {
    edition: "STARTER",
    features: {
      ...baseFeatures,
      certificates: true,
      branding: true,
    },
    rules: {
      certificateRule: "lecture_completion",
    },
  },
  PLUS: {
    edition: "PLUS",
    features: {
      ...baseFeatures,
      liveClasses: true,
      exams: true,
      assignments: true,
      certificates: true,
      coupons: true,
      emailTemplates: true,
      branding: true,
    },
    rules: {
      certificateRule: "exam_pass",
    },
  },
  ENTERPRISE: {
    edition: "ENTERPRISE",
    features: Object.fromEntries(
      moduleKeys.map((key) => [key, true]),
    ) as KasaModuleFeatures,
    rules: {
      certificateRule: "exam_pass",
    },
  },
};

export function normalizeFeatures(features: unknown, edition: KasaEdition) {
  const fallback = DEFAULT_KASA_MODULE_ENTITLEMENTS[edition].features;
  const source =
    features && typeof features === "object" && !Array.isArray(features)
      ? (features as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    moduleKeys.map((key) => [
      key,
      typeof source[key] === "boolean" ? source[key] : fallback[key],
    ]),
  ) as KasaModuleFeatures;
}

export function normalizeRules(rules: unknown, edition: KasaEdition) {
  const fallback = DEFAULT_KASA_MODULE_ENTITLEMENTS[edition].rules;
  const source =
    rules && typeof rules === "object" && !Array.isArray(rules)
      ? (rules as Record<string, unknown>)
      : {};
  const certificateRule =
    source.certificateRule === "lecture_completion" ||
    source.certificateRule === "exam_pass"
      ? source.certificateRule
      : fallback.certificateRule;

  return { certificateRule };
}

export async function getKasaModuleEntitlements() {
  const rows = await prisma.kasaModulePlan.findMany();
  const rowByEdition = new Map(rows.map((row) => [row.edition, row]));

  return (["STARTER", "PLUS", "ENTERPRISE"] as const).map((edition) => {
    const row = rowByEdition.get(edition);
    return {
      edition,
      features: normalizeFeatures(row?.features, edition),
      rules: normalizeRules(row?.rules, edition),
    };
  });
}

export async function getKasaModuleEntitlement(edition: KasaEdition) {
  const row = await prisma.kasaModulePlan.findUnique({ where: { edition } });
  return {
    edition,
    features: normalizeFeatures(row?.features, edition),
    rules: normalizeRules(row?.rules, edition),
  };
}

export async function saveKasaModuleEntitlements(
  entitlements: KasaModuleEntitlement[],
) {
  await prisma.$transaction(
    entitlements.map((entitlement) =>
      prisma.kasaModulePlan.upsert({
        where: { edition: entitlement.edition },
        update: {
          features: entitlement.features as unknown as Prisma.InputJsonValue,
          rules: entitlement.rules as unknown as Prisma.InputJsonValue,
        },
        create: {
          edition: entitlement.edition,
          features: entitlement.features as unknown as Prisma.InputJsonValue,
          rules: entitlement.rules as unknown as Prisma.InputJsonValue,
        },
      }),
    ),
  );
}

export function enforcePlanHierarchy(entitlements: KasaModuleEntitlement[]) {
  const byEdition = new Map(
    entitlements.map((entitlement) => [entitlement.edition, entitlement]),
  );
  const starter = byEdition.get("STARTER");
  const plus = byEdition.get("PLUS");
  const enterprise = byEdition.get("ENTERPRISE");

  if (!starter || !plus || !enterprise) return entitlements;

  for (const key of moduleKeys) {
    plus.features[key] = plus.features[key] || starter.features[key];
    enterprise.features[key] = enterprise.features[key] || plus.features[key];
  }

  return [starter, plus, enterprise];
}
