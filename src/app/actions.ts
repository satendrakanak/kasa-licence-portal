"use server";

import {
  KasaEdition,
  LeadStatus,
  LicenseStatus,
  PlanType,
  ProductStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLicenseKey, encryptLicenseKey, previewLicenseKey, sha256 } from "@/lib/crypto";
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
  changePasswordSchema,
  deleteLicenseSchema,
  leadAssignmentSchema,
  leadStatusUpdateSchema,
  deleteProductSchema,
  updateProductSchema,
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

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateProductSchema.parse(formObject(formData));

  const duplicate = await prisma.product.findUnique({
    where: { slug: parsed.slug },
    select: { id: true },
  });

  if (duplicate && duplicate.id !== parsed.productId) {
    return { ok: false, message: "Another product already uses this slug." };
  }

  await prisma.product.update({
    where: { id: parsed.productId },
    data: {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description || null,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, message: "Product updated." };
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const parsed = deleteProductSchema.parse(formObject(formData));
  const product = await prisma.product.findUnique({
    where: { id: parsed.productId },
    include: {
      _count: {
        select: {
          licenses: true,
        },
      },
    },
  });

  if (!product) {
    return { ok: false, message: "Product could not be found." };
  }

  if (product._count.licenses > 0) {
    return {
      ok: false,
      message: "Delete or archive licenses for this product before deleting it.",
    };
  }

  await prisma.product.delete({
    where: { id: parsed.productId },
  });

  revalidatePath("/dashboard");
  return { ok: true, message: "Product deleted." };
}

export async function createLicenseAction(formData: FormData) {
  await requireAdmin();
  const parsed = licenseSchema.parse(formObject(formData));
  await prisma.product.findUniqueOrThrow({
    where: { id: parsed.productId },
  });
  const edition = parsed.edition as KasaEdition;
  const key = createLicenseKey(`KASA-${edition}`);
  const plan = parsed.plan as PlanType;

  await prisma.license.create({
    data: {
      productId: parsed.productId,
      keyHash: sha256(key),
      keyPreview: previewLicenseKey(key),
      keyEncrypted: encryptLicenseKey(key),
      buyerName: parsed.buyerName || null,
      buyerEmail: parsed.buyerEmail.toLowerCase(),
      platform: parsed.platform,
      purchaseRef: parsed.purchaseRef || null,
      edition,
      plan,
      expiresAt: getPlanExpiry(plan, parsed.expiresAt),
      renewalUrl: parsed.renewalUrl || null,
      maxActivations: parsed.maxActivations,
      notes: parsed.notes || null,
    },
  });

  redirect(`/dashboard?newKey=${encodeURIComponent(key)}`);
}

export async function changePasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const result = changePasswordSchema.safeParse(formObject(formData));
  if (!result.success) {
    redirect("/account/password?error=invalid");
  }
  const parsed = result.data;
  const record = await prisma.adminUser.findUniqueOrThrow({
    where: { id: admin.id },
  });

  if (!(await verifyPassword(parsed.currentPassword, record.passwordHash))) {
    redirect("/account/password?error=current");
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(parsed.newPassword) },
  });

  redirect("/account/password?success=1");
}

export async function updateLicenseStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = licenseStatusSchema.parse(formObject(formData));

  await prisma.license.update({
    where: { id: parsed.licenseId },
    data: { status: parsed.status as LicenseStatus },
  });

  revalidatePath("/dashboard");
  return { ok: true, message: "License status updated." };
}

export async function deleteUnusedLicenseAction(formData: FormData) {
  await requireAdmin();
  const parsed = deleteLicenseSchema.parse(formObject(formData));
  const license = await prisma.license.findUnique({
    where: { id: parsed.licenseId },
    include: {
      activations: {
        select: { status: true },
      },
    },
  });

  if (!license) {
    return { ok: false, message: "License could not be found." };
  }

  const hasActiveInstallations = license.activations.some(
    (activation) => activation.status === "ACTIVE",
  );
  if (hasActiveInstallations) {
    return {
      ok: false,
      message: "Deactivate active installations before deleting this license.",
    };
  }

  await prisma.auditLog.create({
    data: {
      licenseId: license.id,
      action: "license.deleted",
      actor: "admin",
      details: {
        keyPreview: license.keyPreview,
        buyerEmail: license.buyerEmail,
      },
    },
  });

  await prisma.license.delete({
    where: { id: license.id },
  });

  revalidatePath("/dashboard");
  return { ok: true, message: "Unused license deleted successfully." };
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

export async function assignLeadAction(formData: FormData) {
  await requireAdmin();
  const parsed = leadAssignmentSchema.parse(formObject(formData));

  await prisma.lead.update({
    where: { id: parsed.leadId },
    data: {
      assignedToId: parsed.assignedToId || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}

export async function updateLeadStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = leadStatusUpdateSchema.parse(formObject(formData));

  await prisma.lead.update({
    where: { id: parsed.leadId },
    data: {
      status: parsed.status as LeadStatus,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
}
