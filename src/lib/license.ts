import { SignJWT } from "jose";
import { LicenseStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { sha256 } from "@/lib/crypto";
import { getKasaModuleEntitlement } from "@/lib/kasa-modules";
import { prisma } from "@/lib/prisma";

type ActivationInput = {
  licenseKey: string;
  productSlug: string;
  instanceId: string;
  instanceLabel?: string;
  productVersion?: string;
  metadata?: Record<string, unknown>;
};

type LicenseWithActivationContext = NonNullable<
  Awaited<ReturnType<typeof findLicenseByKey>>
>;

function getLicenseSigningSecret() {
  const secret = process.env.LICENSE_SIGNING_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("LICENSE_SIGNING_SECRET must be at least 24 characters long.");
  }

  return new TextEncoder().encode(secret);
}

function isLicenseDateValid(expiresAt: Date | null) {
  return !expiresAt || expiresAt.getTime() > Date.now();
}

function getLicenseLimits(license: {
  userLimit: number | null;
  courseLimit: number | null;
  facultyLimit: number | null;
}) {
  return {
    ...(license.userLimit !== null ? { users: license.userLimit } : {}),
    ...(license.courseLimit !== null ? { courses: license.courseLimit } : {}),
    ...(license.facultyLimit !== null ? { faculty: license.facultyLimit } : {}),
  };
}

async function findLicenseByKey(input: Pick<ActivationInput, "licenseKey" | "productSlug">) {
  const keyHash = sha256(input.licenseKey);
  const exactMatch = await prisma.license.findFirst({
    where: {
      keyHash,
      product: { slug: input.productSlug },
    },
    include: {
      product: true,
      activations: true,
    },
  });

  if (exactMatch) {
    return exactMatch;
  }

  return prisma.license.findUnique({
    where: { keyHash },
    include: {
      product: true,
      activations: true,
    },
  });
}

async function findLicenseById(licenseId: string) {
  return prisma.license.findUnique({
    where: { id: licenseId },
    include: {
      product: true,
      activations: {
        where: { status: "ACTIVE" },
      },
    },
  });
}

export async function createSignedLicenseToken(payload: {
  licenseId: string;
  productSlug: string;
  plan: string;
  expiresAt: Date | null;
  instanceId: string;
  maxActivations: number;
}) {
  return new SignJWT({
    licenseId: payload.licenseId,
    product: payload.productSlug,
    plan: payload.plan,
    expiresAt: payload.expiresAt?.toISOString() || null,
    instanceIdHash: sha256(payload.instanceId),
    maxActivations: payload.maxActivations,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("kasa-licence-portal")
    .setAudience(payload.productSlug)
    .setExpirationTime(payload.expiresAt || "30d")
    .sign(getLicenseSigningSecret());
}

async function activateLicenseRecord(
  license: LicenseWithActivationContext | null,
  input: Omit<ActivationInput, "licenseKey" | "productSlug">,
) {
  if (!license) {
    return { ok: false as const, code: "LICENSE_NOT_FOUND", message: "License key is invalid." };
  }

  if (license.status !== LicenseStatus.ACTIVE) {
    return { ok: false as const, code: "LICENSE_INACTIVE", message: `License is ${license.status.toLowerCase()}.` };
  }

  if (!isLicenseDateValid(license.expiresAt)) {
    await prisma.license.update({
      where: { id: license.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false as const, code: "LICENSE_EXPIRED", message: "License has expired." };
  }

  const instanceIdHash = sha256(input.instanceId);
  const existingActivation = license.activations.find(
    (activation) => activation.instanceIdHash === instanceIdHash,
  );
  const activeActivations = license.activations.filter(
    (activation) => activation.status === "ACTIVE",
  );

  if (existingActivation?.status === "DEACTIVATED") {
    return {
      ok: false as const,
      code: "INSTALLATION_DEACTIVATED",
      message: "This installation has been deactivated by the license administrator.",
    };
  }

  if (!existingActivation && activeActivations.length >= license.maxActivations) {
    return {
      ok: false as const,
      code: "ACTIVATION_LIMIT_REACHED",
      message: "This license is already active on the maximum allowed installations.",
    };
  }

  const activation = await prisma.licenseActivation.upsert({
    where: {
      licenseId_instanceIdHash: {
        licenseId: license.id,
        instanceIdHash,
      },
    },
    create: {
      licenseId: license.id,
      instanceIdHash,
      instanceLabel: input.instanceLabel,
      productVersion: input.productVersion,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
    update: {
      status: "ACTIVE",
      instanceLabel: input.instanceLabel,
      productVersion: input.productVersion,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      lastSeenAt: new Date(),
      deactivatedAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      licenseId: license.id,
      action: existingActivation ? "license.checked" : "license.activated",
      actor: input.instanceLabel || input.instanceId,
      details: {
        productSlug: license.product.slug,
        activationId: activation.id,
      },
    },
  });

  const token = await createSignedLicenseToken({
    licenseId: license.id,
    productSlug: license.product.slug,
    plan: license.plan,
    expiresAt: license.expiresAt,
    instanceId: input.instanceId,
    maxActivations: license.maxActivations,
  });
  const entitlement = await getKasaModuleEntitlement(license.edition);

  return {
    ok: true as const,
    license: {
      id: license.id,
      product: license.product.slug,
      plan: license.edition,
      term: license.plan,
      expiresAt: license.expiresAt?.toISOString() || null,
      maxActivations: license.maxActivations,
      activeActivations: existingActivation
        ? activeActivations.length
        : activeActivations.length + 1,
      limits: {
        ...getLicenseLimits(license),
      },
      features: entitlement.features,
      rules: entitlement.rules,
    },
    activation: {
      id: activation.id,
      status: activation.status,
    },
    signature: token,
  };
}

export async function activateLicense(input: ActivationInput) {
  return activateLicenseRecord(await findLicenseByKey(input), input);
}

export async function activateLicenseById(
  licenseId: string,
  input: Omit<ActivationInput, "licenseKey" | "productSlug">,
) {
  return activateLicenseRecord(await findLicenseById(licenseId), input);
}
