import { NextResponse } from "next/server";
import { activateEnvatoPurchase } from "@/lib/envato";
import { envatoActivationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = envatoActivationSchema.parse(await request.json());
    const result = await activateEnvatoPurchase(payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        message: error instanceof Error ? error.message : "Invalid Envato activation request.",
      },
      { status: 400 },
    );
  }
}
