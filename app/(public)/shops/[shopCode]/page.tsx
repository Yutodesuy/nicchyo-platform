import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { formatShopIdToCode, normalizeShopCodeToId } from "@/lib/shops/route";

type ShopPageProps = {
  params: Promise<{
    shopCode: string;
  }>;
};

type ShopBasic = {
  shop_name: string | null;
  strength: string | null;
  main_products: string[] | null;
  shop_image_url: string | null;
};

async function fetchShopBasic(shopId: number): Promise<ShopBasic | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("vendors")
      .select("shop_name, strength, main_products, shop_image_url")
      .eq("store_number", shopId)
      .maybeSingle();
    return data as ShopBasic | null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { shopCode } = await params;
  const shopId = normalizeShopCodeToId(shopCode);
  if (shopId === null) return {};

  const code = formatShopIdToCode(shopId);
  if (!code) return {};

  const shop = await fetchShopBasic(shopId);
  const shopName = shop?.shop_name?.trim() || `店舗 ${code}`;
  const products = shop?.main_products?.slice(0, 3).join("・") ?? "";
  const description = products
    ? `${shopName}（高知・日曜市 ${code}番）の出店情報。取扱商品: ${products}。`
    : `${shopName}（高知・日曜市 ${code}番）の出店情報。インタラクティブ地図で場所を確認できます。`;

  const images = shop?.shop_image_url
    ? [{ url: shop.shop_image_url, width: 800, height: 600, alt: shopName }]
    : [{ url: "/og-default.png", width: 1200, height: 630, alt: shopName }];

  return {
    title: `${shopName} – 日曜市 ${code}番`,
    description,
    openGraph: {
      title: `${shopName} – 日曜市 ${code}番 | nicchyo`,
      description,
      images,
    },
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { shopCode } = await params;
  const shopId = normalizeShopCodeToId(shopCode);

  if (shopId === null) {
    notFound();
  }

  const normalizedCode = formatShopIdToCode(shopId);

  if (normalizedCode === null) {
    notFound();
  }

  const shop = await fetchShopBasic(shopId);
  const shopName = shop?.shop_name?.trim() || `店舗 ${normalizedCode}`;

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shopName,
    description: shop?.strength ?? `高知・日曜市 ${normalizedCode}番の出店者`,
    image: shop?.shop_image_url ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "追手筋",
      addressLocality: "高知市",
      addressRegion: "高知県",
      addressCountry: "JP",
    },
    url: `https://nicchyo.jp/shops/${normalizedCode}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center px-4 py-12">
        <section className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#0284C7]">出店者ページ</p>
          <h1 className="mt-2 text-2xl font-bold text-[#111827]">店舗コード {normalizedCode}</h1>
          <p className="mt-3 text-sm text-[#4B5563]">
            3桁コードを数値IDへ正規化しました。内部ID: <span className="font-semibold">{shopId}</span>
          </p>
        </section>
      </main>
    </>
  );
}
