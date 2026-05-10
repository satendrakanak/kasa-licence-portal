import { NextResponse } from "next/server";
import { sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { activationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = activationSchema
      .pick({ licenseKey: true, productSlug: true, instanceId: true })
      .parse(await request.json());

    const license = await prisma.license.findFirst({
      where: {
        keyHash: sha256(payload.licenseKey),
        product: { slug: payload.productSlug },
      },
    });

    if (!license) {
      return NextResponse.json(
        { ok: false, code: "LICENSE_NOT_FOUND", message: "License key is invalid." },
        { status: 404 },
      );
    }

    await prisma.licenseActivation.updateMany({
      where: {
        licenseId: license.id,
        instanceIdHash: sha256(payload.instanceId),
      },
      data: {
        status: "DEACTIVATED",
        deactivatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        licenseId: license.id,
        action: "license.deactivated",
        actor: payload.instanceId,
        details: { productSlug: payload.productSlug },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Invalid deactivation request.",
      },
      { status: 400 },
    );
  }
}
