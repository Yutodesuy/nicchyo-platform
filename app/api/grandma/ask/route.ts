import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildGrandmaAiSystemPrompt } from "@/app/(public)/map/data/grandmaAiContext";
import {
  CONSULT_CHARACTER_BY_ID,
  pickConsultCharacters,
  type ConsultCharacter,
  type ConsultCharacterId,
} from "@/app/(public)/consult/data/consultCharacters";
import type {
  ConsultAskResponse,
  ConsultHistoryEntry,
  ConsultTurn,
} from "@/app/(public)/consult/types/consultConversation";
import type { Shop } from "@/app/(public)/map/data/shops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MARKET_CENTER = { lat: 33.565, lng: 133.531 };
const ON_SITE_RADIUS_KM = 0.5;

type VendorRow = {
  id: string;
  shop_name: string | null;
  owner_name: string | null;
  strength: string | null;
  style: string | null;
  style_tags: string[] | null;
  category_id: string | null;
  categories: { name: string | null }[] | { name: string | null } | null;
  main_products: string[] | null;
  main_product_prices: Record<string, number | null> | null;
  payment_methods: string[] | null;
  rain_policy: string | null;
  schedule: string[] | null;
};

type ProductRow = {
  vendor_id: string | null;
  name: string | null;
};

type LocationRow = {
  id: string;
  store_number: number | null;
  latitude: number | null;
  longitude: number | null;
  district: string | null;
};

type AssignmentRow = {
  vendor_id: string | null;
  location_id: string | null;
  market_date: string | null;
};

type ActiveContentRow = {
  vendor_id: string | null;
  body: string | null;
  image_url: string | null;
  expires_at: string;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string | null;
};

type KnowledgeRow = {
  id: string;
  category: string | null;
  title: string | null;
  content: string | null;
  image_url: string | null;
};

type ParsedRequest = {
  text: string;
  location: { lat: number; lng: number } | null;
  imageDataUrl: string | null;
  targetShopId: number | null;
  targetShopName: string | null;
  history: ConsultHistoryEntry[];
  memorySummary: string;
};

type StructuredConsultResponse = {
  summary: string;
  turns: { speakerId: ConsultCharacterId; text: string }[];
  shopIds: number[];
  imageUrl: string | null;
};

const CHOME_VALUES = new Set([
  "一丁目",
  "二丁目",
  "三丁目",
  "四丁目",
  "五丁目",
  "六丁目",
  "七丁目",
]);

function normalizeChome(value: string | null): Shop["chome"] {
  if (value && CHOME_VALUES.has(value)) {
    return value as Shop["chome"];
  }
  return undefined;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function classifyLocationType(
  location: { lat: number; lng: number } | null | undefined
): "pre_visit" | "on_site" | "unknown" {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    return "unknown";
  }
  return haversineKm(location, MARKET_CENTER) <= ON_SITE_RADIUS_KM
    ? "on_site"
    : "pre_visit";
}

function classifyIntent(question: string): string {
  if (/人気|売れ|ランキング|売れ筋/.test(question)) return "人気商品";
  if (/味|美味|うまい|おいし|甘|辛|酸っ|塩/.test(question)) return "味";
  if (/行列|混|待ち|並ぶ|並び/.test(question)) return "行列";
  if (/何時|営業|開店|閉店|時間|朝|終わ/.test(question)) return "営業時間";
  if (/おすすめ|オススメ|いい|良い/.test(question)) return "おすすめ";
  return "その他";
}

function extractKeywords(question: string): string[] {
  const stopwords =
    /^(は|が|を|に|で|と|も|の|て|だ|な|や|か|から|まで|より|けど|ので|って|ね|よ|し|ている|てる|です|ます|ない|ある|いる|する|した|して|できる|ください|教え|知り|たい)$/;
  const tokens = question
    .replace(/[、。！？,\s]/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopwords.test(token));
  return [...new Set(tokens)].slice(0, 6);
}

function sanitizeLikeKeyword(value: string) {
  return value.replace(/[%_,]/g, "").trim();
}

function isShopRelatedQuestion(normalized: string): boolean {
  return /お店|おすすめ|人気|売って|買い|食べ|飲み|野菜|果物|惣菜|お土産|アクセサリー|雑貨|道具|工具|植物|苗|花|ハンドメイド|工芸|ランチ|朝ごはん|おやつ|スイーツ|食材|食べ物/.test(
    normalized
  );
}

function buildHistoryContext(history: ConsultHistoryEntry[], memorySummary: string) {
  const recentHistory = history.slice(-6);
  const historyBlock =
    recentHistory.length > 0
      ? recentHistory
          .map((entry) => {
            const speaker =
              entry.role === "assistant"
                ? entry.speakerName || entry.speakerId || "assistant"
                : "user";
            return `${speaker}: ${entry.text}`;
          })
          .join("\n")
      : "なし";

  return [
    `会話メモ: ${memorySummary || "まだ特記事項なし"}`,
    `直近の会話:\n${historyBlock}`,
  ].join("\n");
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type") ?? "";
  let text = "";
  let location: { lat: number; lng: number } | null = null;
  let imageDataUrl: string | null = null;
  let targetShopId: number | null = null;
  let targetShopName: string | null = null;
  let history: ConsultHistoryEntry[] = [];
  let memorySummary = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    text = typeof form.get("text") === "string" ? String(form.get("text")) : "";
    if (typeof form.get("location") === "string") {
      try {
        location = JSON.parse(String(form.get("location"))) as {
          lat: number;
          lng: number;
        } | null;
      } catch {
        location = null;
      }
    }
    if (typeof form.get("shopId") === "string" && String(form.get("shopId")).trim()) {
      const parsed = Number(form.get("shopId"));
      targetShopId = Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof form.get("shopName") === "string" && String(form.get("shopName")).trim()) {
      targetShopName = String(form.get("shopName")).trim();
    }
    if (typeof form.get("history") === "string") {
      try {
        history = JSON.parse(String(form.get("history"))) as ConsultHistoryEntry[];
      } catch {
        history = [];
      }
    }
    if (typeof form.get("memorySummary") === "string") {
      memorySummary = String(form.get("memorySummary")).trim();
    }
    const formImage = form.get("image");
    if (formImage && typeof formImage === "object" && "arrayBuffer" in formImage) {
      const imageFile = formImage as File;
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mime = imageFile.type || "image/jpeg";
      imageDataUrl = `data:${mime};base64,${base64}`;
    }
  } else {
    const payload = (await request.json()) as {
      text?: string;
      location?: { lat: number; lng: number } | null;
      shopId?: number | null;
      shopName?: string | null;
      history?: ConsultHistoryEntry[];
      memorySummary?: string;
    };
    text = payload.text ?? "";
    location = payload.location ?? null;
    targetShopId =
      typeof payload.shopId === "number" && Number.isFinite(payload.shopId)
        ? payload.shopId
        : null;
    targetShopName = payload.shopName?.trim() || null;
    history = Array.isArray(payload.history) ? payload.history : [];
    memorySummary = payload.memorySummary?.trim() || "";
  }

  return {
    text: text.trim(),
    location,
    imageDataUrl,
    targetShopId,
    targetShopName,
    history,
    memorySummary,
  };
}

async function fetchCandidateVendorIds(
  supabase: SupabaseClient,
  keywords: string[],
  targetShopName: string | null
) {
  const vendorIds = new Set<string>();
  const searchWords = [...new Set([...(targetShopName ? [targetShopName] : []), ...keywords])]
    .map(sanitizeLikeKeyword)
    .filter(Boolean)
    .slice(0, 5);

  for (const word of searchWords) {
    const { data: vendorMatches } = await supabase
      .from("vendors")
      .select("id")
      .or(
        [
          `shop_name.ilike.%${word}%`,
          `owner_name.ilike.%${word}%`,
          `strength.ilike.%${word}%`,
          `style.ilike.%${word}%`,
        ].join(",")
      )
      .limit(8);
    (vendorMatches ?? []).forEach((row) => {
      if (row.id) vendorIds.add(row.id);
    });

    const { data: productMatches } = await supabase
      .from("products")
      .select("vendor_id")
      .ilike("name", `%${word}%`)
      .limit(10);
    (productMatches ?? []).forEach((row) => {
      if (row.vendor_id) vendorIds.add(row.vendor_id);
    });

    const { data: categoryMatches } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", `%${word}%`)
      .limit(5);
    const categoryIds = (categoryMatches ?? []).map((row) => row.id).filter(Boolean);
    if (categoryIds.length > 0) {
      const { data: categoryVendors } = await supabase
        .from("vendors")
        .select("id")
        .in("category_id", categoryIds)
        .limit(8);
      (categoryVendors ?? []).forEach((row) => {
        if (row.id) vendorIds.add(row.id);
      });
    }
  }

  return Array.from(vendorIds).slice(0, 12);
}

async function fetchShopsByVendorIds(
  supabase: SupabaseClient,
  vendorIds: string[]
): Promise<Shop[]> {
  if (vendorIds.length === 0) return [];

  const [
    { data: vendorsData },
    { data: productsData },
    { data: assignmentsData },
    { data: activeContentsData },
  ] = await Promise.all([
    supabase
      .from("vendors")
      .select(
        "id, shop_name, owner_name, strength, style, style_tags, category_id, categories(name), main_products, main_product_prices, payment_methods, rain_policy, schedule"
      )
      .in("id", vendorIds),
    supabase.from("products").select("vendor_id, name").in("vendor_id", vendorIds),
    supabase
      .from("location_assignments")
      .select("vendor_id, location_id, market_date")
      .in("vendor_id", vendorIds),
    supabase
      .from("vendor_contents")
      .select("vendor_id, body, image_url, expires_at, created_at")
      .in("vendor_id", vendorIds)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const vendors = Array.isArray(vendorsData) ? (vendorsData as VendorRow[]) : [];
  const products = Array.isArray(productsData) ? (productsData as ProductRow[]) : [];
  const assignments = Array.isArray(assignmentsData)
    ? (assignmentsData as AssignmentRow[])
    : [];
  const activeContents = Array.isArray(activeContentsData)
    ? (activeContentsData as ActiveContentRow[])
    : [];

  const latestAssignmentByVendor = new Map<string, AssignmentRow>();
  assignments.forEach((row) => {
    if (!row.vendor_id || !row.location_id) return;
    const current = latestAssignmentByVendor.get(row.vendor_id);
    if (!current) {
      latestAssignmentByVendor.set(row.vendor_id, row);
      return;
    }
    const currentDate = current.market_date ? new Date(current.market_date) : null;
    const nextDate = row.market_date ? new Date(row.market_date) : null;
    if (!currentDate || (nextDate && nextDate > currentDate)) {
      latestAssignmentByVendor.set(row.vendor_id, row);
    }
  });

  const locationIds = Array.from(
    new Set(
      Array.from(latestAssignmentByVendor.values())
        .map((row) => row.location_id)
        .filter((value): value is string => !!value)
    )
  );

  const { data: locationsData } =
    locationIds.length > 0
      ? await supabase
          .from("market_locations")
          .select("id, store_number, latitude, longitude, district")
          .in("id", locationIds)
      : { data: [] as LocationRow[] };

  const locations = Array.isArray(locationsData) ? (locationsData as LocationRow[]) : [];

  const productsByVendor = new Map<string, string[]>();
  products.forEach((row) => {
    if (!row.vendor_id || !row.name) return;
    const list = productsByVendor.get(row.vendor_id) ?? [];
    list.push(row.name);
    productsByVendor.set(row.vendor_id, list);
  });

  const activeContentsByVendor = new Map<string, ActiveContentRow[]>();
  activeContents.forEach((row) => {
    if (!row.vendor_id) return;
    const list = activeContentsByVendor.get(row.vendor_id) ?? [];
    list.push(row);
    activeContentsByVendor.set(row.vendor_id, list);
  });

  const locationById = new Map<string, LocationRow>();
  locations.forEach((row) => {
    if (row.id) locationById.set(row.id, row);
  });

  return vendors
    .map((vendor): Shop | null => {
      const assignment = latestAssignmentByVendor.get(vendor.id);
      if (!assignment?.location_id) return null;
      const location = locationById.get(assignment.location_id);
      if (!location) return null;
      const storeNumber = Number(location.store_number ?? 0);
      if (!Number.isFinite(storeNumber) || storeNumber <= 0) return null;

      const catRaw = vendor.categories;
      const joinedCategoryName = Array.isArray(catRaw)
        ? (catRaw[0]?.name ?? null)
        : ((catRaw as { name: string | null } | null)?.name ?? null);
      const displayProducts =
        (vendor.main_products ?? []).length > 0
          ? (vendor.main_products as string[])
          : (productsByVendor.get(vendor.id) ?? []);
      const scheduleStr = (vendor.schedule ?? []).join("、");
      const contents = activeContentsByVendor.get(vendor.id) ?? [];
      const activePosts =
        contents.length > 0
          ? contents.map((content) => ({
              text: content.body ?? "",
              imageUrl: content.image_url ?? undefined,
              expiresAt: content.expires_at,
              createdAt: content.created_at,
            }))
          : undefined;
      const activePost = activePosts?.[0];

      return {
        id: storeNumber,
        vendorId: vendor.id,
        name: vendor.shop_name ?? "",
        ownerName: vendor.owner_name ?? "",
        category: joinedCategoryName ?? "",
        products: displayProducts,
        productPrices: (vendor.main_product_prices ?? undefined) as
          | Record<string, number | null>
          | undefined,
        description: "",
        stallStyle: vendor.style ?? undefined,
        stallStyleTags:
          (vendor.style_tags ?? []).length > 0
            ? (vendor.style_tags as string[])
            : undefined,
        schedule: scheduleStr,
        message: undefined,
        shopStrength: vendor.strength ?? undefined,
        paymentMethods: (vendor.payment_methods ?? []) as string[],
        rainPolicy: vendor.rain_policy ?? undefined,
        activePosts,
        activePost,
        position: storeNumber,
        lat: Number(location.latitude ?? 0),
        lng: Number(location.longitude ?? 0),
        chome: normalizeChome(location.district),
      };
    })
    .filter((shop): shop is Shop => shop !== null)
    .sort((a, b) => a.id - b.id);
}

async function fetchShopByStoreNumber(
  supabase: SupabaseClient,
  storeNumber: number
): Promise<Shop | null> {
  const { data: locationsData } = await supabase
    .from("market_locations")
    .select("id")
    .eq("store_number", storeNumber)
    .limit(1);
  const locationId = locationsData?.[0]?.id;
  if (!locationId) return null;

  const { data: assignmentsData } = await supabase
    .from("location_assignments")
    .select("vendor_id, market_date")
    .eq("location_id", locationId)
    .order("market_date", { ascending: false })
    .limit(1);
  const vendorId = assignmentsData?.[0]?.vendor_id;
  if (!vendorId) return null;

  const shops = await fetchShopsByVendorIds(supabase, [vendorId]);
  return shops[0] ?? null;
}

async function fetchShopByName(
  supabase: SupabaseClient,
  shopName: string
): Promise<Shop | null> {
  const keyword = sanitizeLikeKeyword(shopName);
  if (!keyword) return null;
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .or(`shop_name.ilike.%${keyword}%,owner_name.ilike.%${keyword}%`)
    .limit(1);
  const vendorId = data?.[0]?.id;
  if (!vendorId) return null;
  const shops = await fetchShopsByVendorIds(supabase, [vendorId]);
  return shops[0] ?? null;
}

function summarizeShops(shops: Shop[]) {
  if (shops.length === 0) return "該当なし";
  return shops
    .slice(0, 6)
    .map((shop) => {
      const parts = [
        `id:${shop.id}`,
        shop.name ? `name:${shop.name}` : null,
        shop.ownerName ? `owner:${shop.ownerName}` : null,
        shop.category ? `category:${shop.category}` : null,
        shop.products.length > 0 ? `products:${shop.products.join(" / ")}` : null,
        shop.shopStrength ? `strength:${shop.shopStrength}` : null,
        shop.schedule ? `schedule:${shop.schedule}` : null,
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("\n");
}

function sortShopIdsByDistance(
  ids: number[],
  shops: Shop[],
  location: { lat: number; lng: number } | null
) {
  if (!location) return ids;
  return [...ids]
    .map((id) => {
      const shop = shops.find((candidate) => candidate.id === id);
      if (!shop) return { id, distance: Number.POSITIVE_INFINITY };
      return {
        id,
        distance: haversineKm(location, { lat: shop.lat, lng: shop.lng }),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .map((item) => item.id);
}

function buildResponseSchema(characters: ConsultCharacter[]) {
  return {
    type: "json_schema",
    json_schema: {
      name: "consult_duet_response",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          turns: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                speakerId: {
                  type: "string",
                  enum: characters.map((character) => character.id),
                },
                text: { type: "string" },
              },
              required: ["speakerId", "text"],
            },
          },
          shopIds: {
            type: "array",
            maxItems: 3,
            items: { type: "number" },
          },
          imageUrl: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
        },
        required: ["summary", "turns", "shopIds", "imageUrl"],
      },
    },
  } as const;
}

export async function POST(request: Request) {
  try {
    const {
      text,
      location,
      imageDataUrl,
      targetShopId,
      targetShopName,
      history,
      memorySummary,
    } = await parseRequest(request);
    const question = text || (imageDataUrl ? "画像について教えて" : "");
    if (!question) {
      return NextResponse.json({ reply: "質問を入力してね。" }, { status: 400 });
    }

    const normalized = question.replace(/\s+/g, "");
    if (normalized.includes("おばあちゃんは何者") || normalized.includes("おばあちゃん何者")) {
      return NextResponse.json({
        reply: "高知の日曜市を案内するにちよさんたちやきね。気軽に聞いてや。",
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
      return NextResponse.json(
        { reply: "準備中やき、もう少し待ってね。" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const keywords = extractKeywords(question);
    const shopIntent = isShopRelatedQuestion(normalized);
    const selectedCharacters = pickConsultCharacters(question);

    let targetShop: Shop | null = null;
    if (targetShopId) {
      targetShop = await fetchShopByStoreNumber(supabase, targetShopId);
    }
    if (!targetShop && targetShopName) {
      targetShop = await fetchShopByName(supabase, targetShopName);
    }

    const candidateVendorIds = shopIntent
      ? await fetchCandidateVendorIds(supabase, keywords, targetShopName)
      : [];
    if (targetShop?.vendorId) {
      candidateVendorIds.unshift(targetShop.vendorId);
    }
    const candidateShops = await fetchShopsByVendorIds(
      supabase,
      Array.from(new Set(candidateVendorIds)).slice(0, 12)
    );

    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: question,
      }),
    });
    if (!embeddingResponse.ok) {
      return NextResponse.json(
        { reply: "うまく調べられんかったき、もう一回聞いてみて。" },
        { status: 500 }
      );
    }
    const embeddingPayload = (await embeddingResponse.json()) as {
      data?: { embedding: number[] }[];
    };
    const embedding = embeddingPayload.data?.[0]?.embedding;
    if (!embedding) {
      return NextResponse.json(
        { reply: "うまく調べられんかったき、もう一回聞いてみて。" },
        { status: 500 }
      );
    }

    const { data: knowledgeMatches } = await supabase
      .rpc("match_knowledge_embeddings", {
        query_embedding: embedding,
        match_count: 3,
        match_threshold: 0.55,
      })
      .returns<{ id: string; similarity: number }[]>();
    const safeKnowledgeMatches = Array.isArray(knowledgeMatches) ? knowledgeMatches : [];
    const knowledgeIds = safeKnowledgeMatches.map((row) => row.id).filter(Boolean);
    let knowledgeRows: KnowledgeRow[] = [];
    if (knowledgeIds.length > 0) {
      const { data } = await supabase
        .from("knowledge_embeddings")
        .select("id, category, title, content, image_url")
        .in("id", knowledgeIds);
      knowledgeRows = (data ?? []) as KnowledgeRow[];
    }

    let storeKnowledgeContext = "";
    const ragVendorIds = Array.from(
      new Set(
        [
          targetShop?.vendorId ?? null,
          ...candidateShops.slice(0, 3).map((shop) => shop.vendorId ?? null),
        ].filter((value): value is string => !!value)
      )
    );
    if (ragVendorIds.length > 0) {
      const knowledgeResults = await Promise.all(
        ragVendorIds.map(async (vendorId) => {
          const result = await supabase.rpc("match_store_knowledge", {
            query_embedding: embedding,
            target_store_id: vendorId,
            match_count: 2,
            match_threshold: 0.45,
          });
          return result as { data: { content: string; similarity: number }[] | null };
        })
      );
      const snippets = knowledgeResults
        .flatMap((result) => result.data ?? [])
        .sort((a, b) => b.similarity - a.similarity)
        .map((row) => row.content)
        .filter(Boolean);
      if (snippets.length > 0) {
        storeKnowledgeContext = snippets.join("\n---\n");
      }
    }

    const knowledgeContext =
      knowledgeRows.length > 0
        ? knowledgeRows
            .map((row) => {
              return [
                `id:${row.id}`,
                row.category ? `category:${row.category}` : null,
                row.title ? `title:${row.title}` : null,
                row.content ? `content:${row.content}` : null,
                row.image_url ? `image_url:${row.image_url}` : null,
              ]
                .filter(Boolean)
                .join(" | ");
            })
            .join("\n")
        : "該当なし";

    const userContextText = [
      buildHistoryContext(history, memorySummary),
      `今回の質問: ${text || "（画像についての相談）"}`,
      `位置情報: ${location ? `${location.lat}, ${location.lng}` : "不明"}`,
      targetShop
        ? `注目中の店舗: id:${targetShop.id} | name:${targetShop.name} | owner:${targetShop.ownerName}`
        : "注目中の店舗: なし",
      `店舗候補:\n${summarizeShops(targetShop ? [targetShop, ...candidateShops.filter((shop) => shop.id !== targetShop.id)] : candidateShops)}`,
      `共通知識:\n${knowledgeContext}`,
      `出店者知識:\n${storeKnowledgeContext || "該当なし"}`,
      `選ばれた話者: ${selectedCharacters.map((character) => character.name).join(" / ")}`,
    ].join("\n\n");

    const userContent = imageDataUrl
      ? [
          { type: "text", text: `${userContextText}\n画像が添付されています。` },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ]
      : userContextText;

    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 500,
        response_format: buildResponseSchema(selectedCharacters),
        messages: [
          {
            role: "system",
            content: buildGrandmaAiSystemPrompt(selectedCharacters),
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });
    if (!chatResponse.ok) {
      return NextResponse.json(
        { reply: "うまく調べられんかったき、もう一回聞いてみて。" },
        { status: 500 }
      );
    }

    const chatPayload = (await chatResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawStructured =
      chatPayload.choices?.[0]?.message?.content?.trim() ?? "";
    const structured = JSON.parse(rawStructured) as StructuredConsultResponse;

    const turns: ConsultTurn[] = (structured.turns ?? [])
      .map((turn) => {
        const character = CONSULT_CHARACTER_BY_ID.get(turn.speakerId);
        if (!character) return null;
        return {
          speakerId: character.id,
          speakerName: character.name,
          text: String(turn.text ?? "").trim(),
        } satisfies ConsultTurn;
      })
      .filter((turn): turn is ConsultTurn => !!turn && turn.text.length > 0)
      .slice(0, 4);

    const recommendedIds = sortShopIdsByDistance(
      Array.from(
        new Set(
          (structured.shopIds ?? [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value))
        )
      ).slice(0, 3),
      targetShop ? [targetShop, ...candidateShops.filter((shop) => shop.id !== targetShop.id)] : candidateShops,
      location
    );

    const recommendedShops = (
      targetShop ? [targetShop, ...candidateShops.filter((shop) => shop.id !== targetShop.id)] : candidateShops
    ).filter((shop) => recommendedIds.includes(shop.id));

    const finalRecommendedShops =
      recommendedShops.length > 0 || !shopIntent
        ? recommendedShops
        : (targetShop ? [targetShop, ...candidateShops.filter((shop) => shop.id !== targetShop.id)] : candidateShops).slice(0, 3);

    const reply =
      turns.map((turn) => `${turn.speakerName}: ${turn.text}`).join("\n") ||
      "うまく答えがまとまらんかったき、もう一回聞いてみてね。";

    const locationType = classifyLocationType(location);
    const intentCategory = classifyIntent(text);
    const logVendorIds = Array.from(
      new Set(
        finalRecommendedShops
          .map((shop) => shop.vendorId)
          .filter((value): value is string => !!value)
      )
    );
    if (logVendorIds.length > 0) {
      const logs = logVendorIds.map((vendorId) => ({
        store_id: vendorId,
        question_text: text || "(画像のみ)",
        intent_category: intentCategory,
        keywords,
        location_type: locationType,
        is_recommendation: true,
      }));
      supabase.from("ai_consult_logs").insert(logs).then(() => {});
    }

    const response: ConsultAskResponse = {
      reply,
      imageUrl: structured.imageUrl ?? undefined,
      shopIds: finalRecommendedShops.map((shop) => shop.id),
      shops: finalRecommendedShops,
      turns,
      memorySummary: structured.summary?.trim() || memorySummary,
      retryable: false,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { reply: "うまく調べられんかったき、もう一回聞いてみて。" },
      { status: 500 }
    );
  }
}
