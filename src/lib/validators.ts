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

export const licenseSchema = z.object({
  productId: z.string().min(1),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email(),
  platform: z.string().min(2).default("manual"),
  purchaseRef: z.string().optional(),
  plan: z.enum(["LIFETIME", "SIX_MONTHS", "TWELVE_MONTHS", "CUSTOM"]),
  maxActivations: z.coerce.number().int().min(1).max(50),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

export const licenseStatusSchema = z.object({
  licenseId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "REFUNDED"]),
});

export const deactivateActivationSchema = z.object({
  activationId: z.string().min(1),
});

export const activationSchema = z.object({
  licenseKey: z.string().min(8),
  productSlug: z.string().min(2),
  instanceId: z.string().min(12),
  instanceLabel: z.string().optional(),
  productVersion: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
