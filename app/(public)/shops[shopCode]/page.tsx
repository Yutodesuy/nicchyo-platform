import { notFound } from "next/navigation";

import { formatShopIdToCode, normalizeShopsPathSegmentToId } from "@/lib/shops/route";

type ShopPageProps = {
  params: Promise<{
    shopCode: string;
  }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { shopCode } = await params;
  const shopId = normalizeShopsPathSegmentToId(shopCode);

  if (shopId === null) {
    notFound();
  }

  const normalizedCode = formatShopIdToCode(shopId);

  if (normalizedCode === null) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#0284C7]">出店者ページ</p>
        <h1 className="mt-2 text-2xl font-bold text-[#111827]">店舗コード {normalizedCode}</h1>
        <p className="mt-3 text-sm text-[#4B5563]">
          3桁コードを数値IDへ正規化しました。内部ID: <span className="font-semibold">{shopId}</span>
        </p>
      </section>
    </main>
  );
}
