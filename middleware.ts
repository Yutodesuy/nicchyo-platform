import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, getResponse } = createClient(request);

  // セッション更新（Supabase Auth）
  // getUser() 内でセッションリフレッシュが起きると createClient 内の supabaseResponse が
  // 再代入されるため、呼び出し後に getResponse() で最新のレスポンスを取得する
  await supabase.auth.getUser();
  const supabaseResponse = getResponse();

  // ノンスを生成してCSPヘッダーに設定
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/security/csp-report",
  ].join("; ");

  // ノンスをリクエストヘッダーに渡す（Server Components から参照可能）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // レスポンスにCSPヘッダーとSupabase Cookieを設定（リフレッシュ後の最新 Cookie を使用）
  res.headers.set("content-security-policy", csp);
  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    res.cookies.set(name, value);
  });

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
