import { NextResponse } from "next/server";
import type { IssueInitialResponse } from "@/lib/coupons/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/coupons/issue-initial
 *
 * スタンプラリー移行により、マップ初訪問での自動クーポン発行は廃止。
 * 後方互換のためエンドポイントは維持し、常に issued: false を返す。
 */
export async function POST(): Promise<NextResponse<IssueInitialResponse>> {
  return NextResponse.json({ issued: false, coupon: null });
}
