import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { decryptLicenseKey } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  await requireAdmin();
  const { licenseId } = await params;
  const license = await prisma.license.findUnique({
    where: { id: licenseId },
    include: { product: true },
  });

  if (!license) {
    return NextResponse.json({ ok: false, message: "License not found." }, { status: 404 });
  }

  const licenseKey = decryptLicenseKey(license.keyEncrypted);
  if (!licenseKey) {
    return NextResponse.json(
      { ok: false, message: "Full key is not available for this older hashed-only license." },
      { status: 404 },
    );
  }

  const body = [
    `Product: ${license.product.name}`,
    `Product slug: ${license.product.slug}`,
    `Buyer: ${license.buyerName || "N/A"}`,
    `Buyer email: ${license.buyerEmail}`,
    `Platform: ${license.platform}`,
    `Purchase reference: ${license.purchaseRef || "N/A"}`,
    `License key: ${licenseKey}`,
    `Plan: ${license.plan}`,
    `Expires: ${license.expiresAt?.toISOString() || "Lifetime"}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${license.product.slug}-${license.keyPreview.replace(/[^a-zA-Z0-9]/g, "-")}.txt"`,
    },
  });
}
