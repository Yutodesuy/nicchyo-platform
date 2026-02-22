import { NextResponse, type NextRequest } from "next/server";

import { canAccessVendorShop, getShopCodeFromPathname, mapSupabaseUser } from "@/lib/auth/authorization";
import { normalizeShopCodeToId } from "@/lib/shops/route";
import { createClient } from "./utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const { pathname } = request.nextUrl;

  const shopCode = getShopCodeFromPathname(pathname);
  if (!shopCode) {
    return response;
  }

  const shopId = normalizeShopCodeToId(shopCode);
  if (shopId === null) {
    return NextResponse.redirect(new URL("/shopslogin?error=forbidden", request.url));
  }

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ? mapSupabaseUser(data.user) : null;

  if (error || !user) {
    return NextResponse.redirect(new URL("/shopslogin", request.url));
  }

  if (!canAccessVendorShop(user, shopId)) {
    return NextResponse.redirect(new URL("/shopslogin?error=forbidden", request.url));
  }

  if (pathname === `/shops${shopCode}`) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/shops/${shopCode}`;
    return NextResponse.rewrite(rewriteUrl, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
