import { z } from "zod";

export const setupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().optional(),
});

export const updateProductSchema = productSchema.extend({
  productId: z.string().min(1),
});

export const deleteProductSchema = z.object({
  productId: z.string().min(1),
});

export const licenseSchema = z.object({
  productId: z.string().min(1),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email(),
  platform: z.string().min(2).default("manual"),
  purchaseRef: z.string().optional(),
  edition: z.enum(["STARTER", "PLUS", "ENTERPRISE"]),
  plan: z.enum(["LIFETIME", "SIX_MONTHS", "TWELVE_MONTHS", "CUSTOM"]),
  maxActivations: z.coerce.number().int().min(1).max(50),
  expiresAt: z.string().optional(),
  renewalUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const licenseStatusSchema = z.object({
  licenseId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "REFUNDED"]),
});

export const deactivateActivationSchema = z.object({
  activationId: z.string().min(1),
});

export const deleteLicenseSchema = z.object({
  licenseId: z.string().min(1),
});

export const publicLeadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  institute: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  message: z.string().min(10).max(3000),
  source: z.string().max(100).optional().default("marketing-site"),
});

export const leadAssignmentSchema = z.object({
  leadId: z.string().min(1),
  assignedToId: z.string().optional(),
});

export const leadStatusUpdateSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "CLOSED"]),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const activationSchema = z.object({
  licenseKey: z.string().min(8),
  productSlug: z.string().min(2),
  instanceId: z.string().min(12),
  instanceLabel: z.string().optional(),
  productVersion: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
