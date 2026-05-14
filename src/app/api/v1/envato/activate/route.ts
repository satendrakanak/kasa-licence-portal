import { NextResponse } from "next/server";
import { activateEnvatoPurchase } from "@/lib/envato";
import { envatoActivationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const resultPayload = envatoActivationSchema.safeParse(await request.json());
    if (!resultPayload.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_REQUEST",
          message: "Please enter a valid purchase code and buyer email.",
        },
        { status: 400 },
      );
    }

    const payload = resultPayload.data;
    const result = await activateEnvatoPurchase(payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  } catch (error) {
    console.error("Envato activation failed", error);
    return NextResponse.json(
      {
        ok: false,
        code: "ACTIVATION_FAILED",
        message: "Purchase code could not be verified. Please check the code and try again.",
      },
      { status: 503 },
    );
  }
}
