import { NextResponse } from "next/server";
import { getDemoOperationsSettings } from "@/lib/demo-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getDemoOperationsSettings();

  return NextResponse.json({
    ok: true,
    demoToursEnabled: settings.demoToursEnabled,
    demoResetOnExpiry: settings.demoResetOnExpiry,
  });
}
