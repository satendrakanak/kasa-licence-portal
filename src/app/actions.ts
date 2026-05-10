"use server";

import { LicenseStatus, PlanType, ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLicenseKey, previewLicenseKey, sha256 } from "@/lib/crypto";
import {
  createSession,
  destroySession,
  hasAdminUser,
  hashPassword,
  requireAdmin,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deactivateActivationSchema,
  licenseSchema,
  licenseStatusSchema,
  loginSchema,
  productSchema,
  setupSchema,
} from "@/lib/validators";

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getPlanExpiry(plan: PlanType, customDate?: string) {
  if (plan === "LIFETIME") return null;
  if (plan === "CUSTOM") return customDate ? new Date(customDate) : null;

  const date = new Date();
  date.setMonth(date.getMonth() + (plan === "SIX_MONTHS" ? 6 : 12));
  return date;
}

export async function setupAdminAction(formData: FormData) {
  if (await hasAdminUser()) redirect("/login");

  const parsed = setupSchema.parse(formObject(formData));
  const admin = await prisma.adminUser.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.password),
    },
  });

  await prisma.product.createMany({
    data: [
      {
        name: "Kasa Enterprise",
        slug: "kasa-enterprise",
        description: "Full LMS, live classes, exams, certificates, notifications, and marketplace-ready modules.",
      },
      {
        name: "Kasa Starter Kit",
        slug: "kasa-starter-kit",
        description: "A focused starter edition for smaller academies and quick launches.",
      },
    ],
    skipDuplicates: true,
  });

  await createSession(admin.id);
  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.parse(formObject(formData));
  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.email.toLowerCase() },
  });

  if (!admin || !(await verifyPassword(parsed.password, admin.passwordHash))) {
    redirect("/login?error=invalid");
  }

  await createSession(admin.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const parsed = productSchema.parse(formObject(formData));

  await prisma.product.create({
    data: {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description || null,
    },
  });

  revalidatePath("/dashboard");
}

export async function createLicenseAction(formData: FormData) {
  await requireAdmin();
  const parsed = licenseSchema.parse(formObject(formData));
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: parsed.productId },
  });
  const prefix = product.slug
    .split("-")
    .map((part) => part[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
  const key = createLicenseKey(prefix || "KASA");
  const plan = parsed.plan as PlanType;

  await prisma.license.create({
    data: {
      productId: parsed.productId,
      keyHash: sha256(key),
      keyPreview: previewLicenseKey(key),
      buyerName: parsed.buyerName || null,
      buyerEmail: parsed.buyerEmail.toLowerCase(),
      platform: parsed.platform,
      purchaseRef: parsed.purchaseRef || null,
      plan,
      expiresAt: getPlanExpiry(plan, parsed.expiresAt),
      maxActivations: parsed.maxActivations,
      notes: parsed.notes || null,
    },
  });

  redirect(`/dashboard?newKey=${encodeURIComponent(key)}`);
}

export async function updateLicenseStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = licenseStatusSchema.parse(formObject(formData));

  await prisma.license.update({
    where: { id: parsed.licenseId },
    data: { status: parsed.status as LicenseStatus },
  });

  revalidatePath("/dashboard");
}

export async function toggleProductStatusAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") || "");
  const status = String(formData.get("status") || "") as ProductStatus;
  if (!productId || !["ACTIVE", "ARCHIVED"].includes(status)) return;

  await prisma.product.update({
    where: { id: productId },
    data: { status },
  });

  revalidatePath("/dashboard");
}

export async function deactivateActivationAction(formData: FormData) {
  await requireAdmin();
  const parsed = deactivateActivationSchema.parse(formObject(formData));

  await prisma.licenseActivation.update({
    where: { id: parsed.activationId },
    data: { status: "DEACTIVATED", deactivatedAt: new Date() },
  });

  revalidatePath("/dashboard");
}
