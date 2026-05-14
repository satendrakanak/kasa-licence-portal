import { NextResponse } from "next/server";
import { createInboundLead } from "@/lib/leads";
import { publicLeadSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "http://localhost:3001");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const raw =
      contentType.includes("application/json")
        ? await request.json()
        : Object.fromEntries((await request.formData()).entries());

    const parsed = publicLeadSchema.parse(raw);
    const lead = await createInboundLead(parsed);

    return withCors(NextResponse.json(
      {
        ok: true,
        leadId: lead.id,
        message: "Lead captured successfully.",
      },
      { status: 201 },
    ));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not capture lead.";
    return withCors(NextResponse.json(
      { ok: false, message },
      { status: 400 },
    ));
  }
}
