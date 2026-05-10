import { SignJWT } from "jose";
import { LicenseStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

type ActivationInput = {
  licenseKey: string;
  productSlug: string;
  instanceId: string;
  instanceLabel?: string;
  productVersion?: string;
  metadata?: Record<string, unknown>;
};

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

export async function activateLicense(input: ActivationInput) {
  const license = await prisma.license.findFirst({
    where: {
      keyHash: sha256(input.licenseKey),
      product: { slug: input.productSlug },
    },
    include: {
      product: true,
      activations: {
        where: { status: "ACTIVE" },
      },
    },
  });

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

  if (!existingActivation && license.activations.length >= license.maxActivations) {
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
        productSlug: input.productSlug,
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

  return {
    ok: true as const,
    license: {
      id: license.id,
      product: license.product.slug,
      plan: license.plan,
      expiresAt: license.expiresAt?.toISOString() || null,
      maxActivations: license.maxActivations,
      activeActivations: existingActivation
        ? license.activations.length
        : license.activations.length + 1,
    },
    activation: {
      id: activation.id,
      status: activation.status,
    },
    signature: token,
  };
}
