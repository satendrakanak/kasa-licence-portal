import { KasaEdition, Marketplace, PlanType, Prisma } from "@prisma/client";
import { createLicenseKey, encryptLicenseKey, previewLicenseKey, sha256 } from "@/lib/crypto";
import { activateLicenseById } from "@/lib/license";
import { prisma } from "@/lib/prisma";

type EnvatoActivationInput = {
  purchaseCode: string;
  buyerName?: string;
  buyerEmail: string;
  instanceId: string;
  instanceLabel?: string;
  productVersion?: string;
  metadata?: Record<string, unknown>;
};

type EnvatoSale = {
  itemId: string;
  itemName: string | null;
  buyerUsername: string | null;
  soldAt: Date | null;
  supportedUntil: Date | null;
  raw: Record<string, unknown>;
};

function getEnvatoToken() {
  const token = process.env.ENVATO_PERSONAL_TOKEN;
  if (!token) {
    throw new Error("ENVATO_PERSONAL_TOKEN is not configured.");
  }

  return token;
}

function dateOrNull(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function purchaseCodePreview(purchaseCode: string) {
  const normalized = purchaseCode.trim();
  return `${normalized.slice(0, 4)}...${normalized.slice(-6)}`;
}

function getPlanExpiry(plan: PlanType, supportedUntil: Date | null) {
  if (supportedUntil) return supportedUntil;
  if (plan === PlanType.LIFETIME) return null;

  const date = new Date();
  date.setMonth(date.getMonth() + (plan === PlanType.SIX_MONTHS ? 6 : 12));
  return date;
}

function extractEnvatoSale(payload: Record<string, unknown>): EnvatoSale {
  const item = payload.item && typeof payload.item === "object"
    ? (payload.item as Record<string, unknown>)
    : {};
  const buyer = payload.buyer && typeof payload.buyer === "object"
    ? (payload.buyer as Record<string, unknown>)
    : null;
  const itemId = String(item.id || payload.item_id || "").trim();

  if (!itemId) {
    throw new Error("Envato verification response did not include an item id.");
  }

  return {
    itemId,
    itemName: typeof item.name === "string" ? item.name : null,
    buyerUsername:
      typeof payload.buyer === "string"
        ? payload.buyer
        : typeof buyer?.username === "string"
          ? buyer.username
          : null,
    soldAt: dateOrNull(payload.sold_at),
    supportedUntil: dateOrNull(payload.supported_until),
    raw: payload,
  };
}

export async function verifyEnvatoPurchaseCode(purchaseCode: string) {
  const response = await fetch(
    `https://api.envato.com/v3/market/author/sale?code=${encodeURIComponent(purchaseCode.trim())}`,
    {
      headers: {
        Authorization: `Bearer ${getEnvatoToken()}`,
        "User-Agent": "Kasa Licence Portal",
      },
      cache: "no-store",
    },
  );

  if (response.status === 404 || response.status === 403) {
    return {
      ok: false as const,
      code: "ENVATO_PURCHASE_NOT_FOUND",
      message: "Envato purchase code could not be verified for this author account.",
    };
  }

  if (!response.ok) {
    return {
      ok: false as const,
      code: "ENVATO_API_ERROR",
      message: `Envato verification failed with status ${response.status}.`,
    };
  }

  const payload = await response.json() as Record<string, unknown>;
  return {
    ok: true as const,
    sale: extractEnvatoSale(payload),
  };
}

export async function activateEnvatoPurchase(input: EnvatoActivationInput) {
  const purchaseCodeHash = sha256(input.purchaseCode);
  const existingPurchase = await prisma.marketplacePurchase.findUnique({
    where: { purchaseCodeHash },
    include: { license: true },
  });

  if (existingPurchase) {
    if (!existingPurchase.buyerEmail && input.buyerEmail) {
      await prisma.marketplacePurchase.update({
        where: { id: existingPurchase.id },
        data: { buyerEmail: input.buyerEmail.toLowerCase() },
      });
    }

    const activation = await activateLicenseById(existingPurchase.licenseId, input);
    return {
      ...activation,
      marketplace: {
        name: Marketplace.ENVATO,
        purchaseId: existingPurchase.id,
        reused: true,
      },
    };
  }

  const verified = await verifyEnvatoPurchaseCode(input.purchaseCode);
  if (!verified.ok) return verified;

  const price = await prisma.productPrice.findUnique({
    where: { envatoItemId: verified.sale.itemId },
    include: { product: true },
  });

  if (!price) {
    return {
      ok: false as const,
      code: "ENVATO_ITEM_NOT_CONFIGURED",
      message: `Envato item ${verified.sale.itemId} is not mapped to a KASA product pricing row.`,
    };
  }

  if (!price.isActive || price.product.status !== "ACTIVE") {
    return {
      ok: false as const,
      code: "PRODUCT_PRICE_INACTIVE",
      message: "This product pricing is not active for new marketplace activations.",
    };
  }

  const licenseKey = createLicenseKey(`KASA-${price.edition}`);
  const license = await prisma.$transaction(async (tx) => {
    const createdLicense = await tx.license.create({
      data: {
        productId: price.productId,
        productPriceId: price.id,
        keyHash: sha256(licenseKey),
        keyPreview: previewLicenseKey(licenseKey),
        keyEncrypted: encryptLicenseKey(licenseKey),
        buyerName: input.buyerName || verified.sale.buyerUsername,
        buyerEmail: input.buyerEmail.toLowerCase(),
        platform: "envato",
        purchaseRef: purchaseCodePreview(input.purchaseCode),
        saleAmount: price.amount,
        saleCurrency: price.currency,
        saleChannel: "envato",
        marketingSource: "envato",
        soldAt: verified.sale.soldAt || new Date(),
        edition: price.edition as KasaEdition,
        plan: price.plan,
        expiresAt: getPlanExpiry(price.plan, verified.sale.supportedUntil),
        maxActivations: price.maxActivations,
        notes: "Generated from verified Envato purchase code.",
      },
    });

    await tx.marketplacePurchase.create({
      data: {
        marketplace: Marketplace.ENVATO,
        purchaseCodeHash,
        purchaseCodePreview: purchaseCodePreview(input.purchaseCode),
        externalItemId: verified.sale.itemId,
        externalItemName: verified.sale.itemName,
        buyerUsername: verified.sale.buyerUsername,
        buyerEmail: input.buyerEmail.toLowerCase(),
        soldAt: verified.sale.soldAt,
        supportedUntil: verified.sale.supportedUntil,
        licenseId: createdLicense.id,
        rawSummary: {
          itemId: verified.sale.itemId,
          itemName: verified.sale.itemName,
          buyerUsername: verified.sale.buyerUsername,
          soldAt: verified.sale.soldAt?.toISOString() || null,
          supportedUntil: verified.sale.supportedUntil?.toISOString() || null,
        } satisfies Prisma.InputJsonValue,
      },
    });

    await tx.auditLog.create({
      data: {
        licenseId: createdLicense.id,
        action: "marketplace.envato.license_created",
        actor: input.buyerEmail.toLowerCase(),
        details: {
          itemId: verified.sale.itemId,
          purchaseCodePreview: purchaseCodePreview(input.purchaseCode),
        },
      },
    });

    return createdLicense;
  });

  const activation = await activateLicenseById(license.id, input);
  return {
    ...activation,
    marketplace: {
      name: Marketplace.ENVATO,
      reused: false,
      itemId: verified.sale.itemId,
    },
  };
}
