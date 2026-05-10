import { NextResponse } from "next/server";
import { activateLicense } from "@/lib/license";
import { activationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = activationSchema.parse(await request.json());
    const result = await activateLicense(payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Invalid activation request.",
      },
      { status: 400 },
    );
  }
}
