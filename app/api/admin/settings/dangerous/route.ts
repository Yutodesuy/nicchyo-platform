import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      action: typeof body?.action === "string" ? body.action : null,
      message: "危険操作は現在無効化されています。",
    },
    { status: 409 }
  );
}
