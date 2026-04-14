import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CspViolation = {
  "csp-report"?: {
    "document-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "blocked-uri"?: string;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "original-policy"?: string;
  };
};

const reportBucket: CspViolation[] = [];

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as CspViolation | null;
  if (payload) {
    reportBucket.push(payload);
    if (reportBucket.length > 200) reportBucket.shift();
  }

  return NextResponse.json({ ok: true });
}
