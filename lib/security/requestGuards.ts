import { NextResponse } from "next/server";

export function requireSameOrigin(request: Request) {
  const targetOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && origin !== targetOrigin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid origin" }, { status: 403 }),
    };
  }

  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== targetOrigin) {
        return {
          ok: false as const,
          response: NextResponse.json({ error: "Invalid referer" }, { status: 403 }),
        };
      }
    } catch {
      return {
        ok: false as const,
        response: NextResponse.json({ error: "Invalid referer" }, { status: 403 }),
      };
    }
  }

  if (!origin && !referer && process.env.NODE_ENV === "production") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Origin header required" }, { status: 403 }),
    };
  }

  return { ok: true as const };
}