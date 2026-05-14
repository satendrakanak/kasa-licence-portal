import { NextRequest, NextResponse } from "next/server";
import { sendExpiryNotifications } from "@/lib/license-expiry-notifications";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
  }

  const result = await sendExpiryNotifications();
  return NextResponse.json({ ok: true, ...result });
}
