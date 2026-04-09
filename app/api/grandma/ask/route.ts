import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildGrandmaAiSystemPrompt } from "@/app/(public)/map/data/grandmaAiContext";
import { detectAbuse } from "@/lib/security/abuseDetector";
import {
  CONSULT_CHARACTER_BY_ID,
  pickConsultCharacters,
  type ConsultCharacter,
  type ConsultCharacterId,
} from "@/app/(public)/consult/data/consultCharacters";
import type {
  ConsultAskResponse,
  ConsultErrorCode,
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

type SeasonalProductRow = {
  vendorId: string;
  shopName: string;
  productName: string;
  seasonName: string;
};

type ParsedRequest = {
  text: string;
  location: { lat: number; lng: number } | null;
  imageDataUrl: string | null;
  targetShopId: number | null;
  targetShopName: string | null;
  history: ConsultHistoryEntry[];
  memorySummary: string;
  preferredCharacterId: ConsultCharacterId | null;
  visitorKey: string | null;
  stream: boolean;
};

type StructuredConsultResponse = {
  summary: string;
  turns: { speakerId: ConsultCharacterId; text: string }[];
  shopIds: number[];
  imageUrl: string | null;
  followUpQuestion: string;
};

type StreamedConsultPayload = {
  summary: string;
  turns: ConsultTurn[];
  shopIds: number[];
  imageUrl: string | null;
  followUpQuestion: string;
};

type ConversationPattern = {
  id: "pattern1" | "pattern2" | "pattern3" | "pattern4" | "all_cast";
  instruction: string;
  turnCount: number;
};

const CONSULT_CONVERSATION_PATTERNS: ConversationPattern[] = [
  {
    id: "pattern1",
    instruction:
      "構成1: キャラ1が回答し、キャラ2がそこから自然に出てくる疑問を投げ、キャラ1が補足し、最後にキャラ2が納得と感想で締める。",
    turnCount: 4,
  },
  {
    id: "pattern2",
    instruction:
      "構成2: キャラ1が回答し、キャラ2が別視点の答えを足し、キャラ1が共感し、最後にキャラ2がユーザーへやさしく声を掛ける。",
    turnCount: 4,
  },
  {
    id: "pattern3",
    instruction:
      "構成3: キャラ1が回答し、キャラ2がやさしく反対側の意見や注意点を述べ、キャラ1が納得し、最後にキャラ2が整理して締める。",
    turnCount: 4,
  },
  {
    id: "pattern4",
    instruction:
      "構成4: キャラ1が回答し、キャラ2が共感し、キャラ1が新たな意見を足し、最後にキャラ2がキャラ1とユーザーの両方を受けてまとめる。",
    turnCount: 4,
  },
];

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

function isSeasonalQuestion(normalized: string) {
  return /季節|旬|今の時期|今の季節|春|夏|秋|冬/.test(normalized);
}

function getCurrentSeasonInfo(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return { seasonId: 0, seasonName: "春ー夏" };
  }
  if (month >= 6 && month <= 8) {
    return { seasonId: 1, seasonName: "夏ー秋" };
  }
  if (month >= 9 && month <= 11) {
    return { seasonId: 2, seasonName: "秋ー冬" };
  }
  return { seasonId: 3, seasonName: "冬ー春" };
}

function isUnsupportedQuestion(normalized: string) {
  return /違法|犯罪|爆弾|殺|死ね|個人情報|住所を教え|電話番号|パスワード|ハッキング|詐欺/.test(
    normalized
  );
}

function getErrorSpeaker(
  errorCode: ConsultErrorCode,
  characters: ConsultCharacter[]
): ConsultCharacter {
  const preferredIdByError: Record<ConsultErrorCode, ConsultCharacterId> = {
    system_error: "nichiyosan",
    insufficient_context: "nichiyosan",
    unsupported_request: "nichiyosan",
    no_result: "yosakochan",
  };
  return (
    characters.find((character) => character.id === preferredIdByError[errorCode]) ??
    characters[0]
  );
}

function getHelperQuestions(errorCode: ConsultErrorCode): string[] {
  switch (errorCode) {
    case "insufficient_context":
      return [
        "旬の食べものを探してるんだけど、おすすめある？",
        "おみやげ向きのお店を教えて",
      ];
    case "unsupported_request":
      return [
        "日曜市の回り方を教えて",
        "今の季節におすすめの食材はある？",
      ];
    case "no_result":
      return [
        "近い条件でおすすめを教えて",
        "ジャンルを変えるなら何がおすすめ？",
      ];
    default:
      return [];
  }
}

function buildErrorResponse(
  errorCode: ConsultErrorCode,
  characters: ConsultCharacter[],
  message: string,
  options?: {
    retryable?: boolean;
    errorMessage?: string;
    memorySummary?: string;
  }
): ConsultAskResponse {
  const speaker = getErrorSpeaker(errorCode, characters);
  const turns: ConsultTurn[] = [
    {
      speakerId: speaker.id,
      speakerName: speaker.name,
      text: message,
    },
  ];

  return {
    reply: `${speaker.name}: ${message}`,
    turns,
    errorCode,
    helperQuestions: getHelperQuestions(errorCode),
    memorySummary: options?.memorySummary,
    retryable: options?.retryable ?? false,
    errorMessage: options?.errorMessage ?? message,
  };
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
  let preferredCharacterId: ConsultCharacterId | null = null;
  let visitorKey: string | null = null;
  let stream = false;

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
    if (typeof form.get("preferredCharacterId") === "string") {
      const value = String(form.get("preferredCharacterId")).trim() as ConsultCharacterId;
      preferredCharacterId = CONSULT_CHARACTER_BY_ID.has(value) ? value : null;
    }
    if (typeof form.get("visitorKey") === "string") {
      const vk = String(form.get("visitorKey")).trim();
      visitorKey = vk.length > 0 && vk.length <= 128 ? vk : null;
    }
    if (typeof form.get("stream") === "string") {
      const streamValue = String(form.get("stream")).trim().toLowerCase();
      stream = streamValue === "1" || streamValue === "true";
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
      preferredCharacterId?: ConsultCharacterId | null;
      visitorKey?: string | null;
      stream?: boolean;
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
    preferredCharacterId =
      payload.preferredCharacterId && CONSULT_CHARACTER_BY_ID.has(payload.preferredCharacterId)
        ? payload.preferredCharacterId
        : null;
    if (typeof payload.visitorKey === "string") {
      const vk = payload.visitorKey.trim();
      visitorKey = vk.length > 0 && vk.length <= 128 ? vk : null;
    }
    stream = payload.stream === true;
  }

  return {
    text: text.trim(),
    location,
    imageDataUrl,
    targetShopId,
    targetShopName,
    history,
    memorySummary,
    preferredCharacterId,
    visitorKey,
    stream,
  };
}

async function fetchCandidateVendorIds(
  supabase: SupabaseClient,
  keywords: string[],
  targetShopName: string | null,
  embedding: number[] | null,
  seasonalVendorIds: string[] = []
) {
  const vendorIds = new Set<string>();
  seasonalVendorIds.forEach((vendorId) => {
    if (vendorId) vendorIds.add(vendorId);
  });
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

  if (embedding) {
    const { data: embeddingMatches } = await supabase
      .rpc("match_vendor_embeddings", {
        query_embedding: embedding,
        match_count: 8,
        match_threshold: 0.45,
      })
      .returns<{ vendor_id: string; similarity: number }[]>();
    if (Array.isArray(embeddingMatches)) {
      embeddingMatches.forEach((row) => {
        if (row.vendor_id) vendorIds.add(row.vendor_id);
      });
    }
  }

  return Array.from(vendorIds).slice(0, 12);
}

async function fetchSeasonalProductContext(
  supabase: SupabaseClient,
  seasonId: number
): Promise<SeasonalProductRow[]> {
  const { data: productSeasonRows } = await supabase
    .from("product_seasons")
    .select("product_id, season_id")
    .eq("season_id", seasonId)
    .limit(24);

  const productIds = (productSeasonRows ?? [])
    .map((row) => row.product_id)
    .filter((value): value is string => !!value);
  if (productIds.length === 0) return [];

  const { data: productsData } = await supabase
    .from("products")
    .select("id, vendor_id, name")
    .in("id", productIds);
  const products = Array.isArray(productsData) ? productsData : [];
  if (products.length === 0) return [];

  const vendorIds = Array.from(
    new Set(
      products
        .map((row) => row.vendor_id)
        .filter((value): value is string => !!value)
    )
  );
  const { data: vendorsData } =
    vendorIds.length > 0
      ? await supabase.from("vendors").select("id, shop_name").in("id", vendorIds)
      : { data: [] as { id: string; shop_name: string | null }[] };

  const vendorNameById = new Map<string, string>();
  (vendorsData ?? []).forEach((row) => {
    if (row.id) {
      vendorNameById.set(row.id, row.shop_name ?? "");
    }
  });

  const seasonName = getCurrentSeasonInfo().seasonName;
  return products
    .map((row) => {
      if (!row.vendor_id || !row.name) return null;
      return {
        vendorId: row.vendor_id,
        shopName: vendorNameById.get(row.vendor_id) ?? "",
        productName: row.name,
        seasonName,
      } satisfies SeasonalProductRow;
    })
    .filter((row): row is SeasonalProductRow => row !== null)
    .slice(0, 12);
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

function buildResponseSchema(characters: ConsultCharacter[], pattern: ConversationPattern) {
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
            minItems: pattern.turnCount,
            maxItems: pattern.turnCount,
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
          followUpQuestion: { type: "string" },
        },
        required: ["summary", "turns", "shopIds", "imageUrl", "followUpQuestion"],
      },
    },
  } as const;
}

function pickConversationPattern(characters: ConsultCharacter[]): ConversationPattern {
  if (characters.length >= 4) {
    return {
      id: "all_cast",
      instruction:
        "全員会話: 選ばれた全員が1発話ずつ話し、前の発話を軽く受けながらそれぞれの言い方で答える。",
      turnCount: 4,
    };
  }
  const index = Math.floor(Math.random() * CONSULT_CONVERSATION_PATTERNS.length);
  return CONSULT_CONVERSATION_PATTERNS[index];
}

function buildConversationPatternPrompt(
  characters: ConsultCharacter[],
  pattern: ConversationPattern
) {
  const speakerOrder =
    characters.length >= 4
      ? characters.map((character) => character.name).join(" → ")
      : `${characters[0]?.name} → ${characters[1]?.name} → ${characters[0]?.name} → ${characters[1]?.name}`;
  return [
    pattern.instruction,
    `発話数は必ず${pattern.turnCount}つ。`,
    `発話順は必ず ${speakerOrder}。`,
  ].join("\n");
}

function buildStreamingFormatPrompt(
  characters: ConsultCharacter[],
  pattern: ConversationPattern
) {
  const speakerMap = characters.map((character) => `${character.id}=${character.name}`).join(", ");
  return [
    "出力は必ずプレーンテキストのみ。JSON、Markdown、前置きは禁止。",
    `TURN 行を必ず ${pattern.turnCount} 行、最初に出力する。`,
    `TURN 行の形式は TURN|speakerId|speakerName|text。speakerId は ${speakerMap} のいずれかを使う。`,
    "text には改行を入れない。speakerName は対応する表示名を使う。",
    "TURN 行の後に、次の行をこの順番で必ず1行ずつ出力する。",
    "SHOP_IDS|1,2,3",
    "IMAGE_URL|https://... または null",
    "FOLLOW_UP|次にユーザーへ聞く質問",
    "SUMMARY|会話の要約",
    "END",
    "候補がない時は SHOP_IDS| とする。画像がない時は IMAGE_URL|null とする。",
    "余計な説明は絶対に足さない。",
  ].join("\n");
}

function parseStreamingConsultOutput(
  rawOutput: string,
  selectedCharacters: ConsultCharacter[]
): StreamedConsultPayload {
  const turns: ConsultTurn[] = [];
  let shopIds: number[] = [];
  let imageUrl: string | null = null;
  let followUpQuestion = "";
  let summary = "";

  const lines = rawOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line === "END") continue;
    if (line.startsWith("TURN|")) {
      const parts = line.split("|");
      if (parts.length < 4) continue;
      const requestedSpeakerId = parts[1].trim() as ConsultCharacterId;
      const matchedCharacter =
        CONSULT_CHARACTER_BY_ID.get(requestedSpeakerId) ??
        selectedCharacters.find((character) => character.id === requestedSpeakerId) ??
        selectedCharacters[turns.length % Math.max(selectedCharacters.length, 1)];
      if (!matchedCharacter) continue;
      const text = parts.slice(3).join("|").trim();
      if (!text) continue;
      turns.push({
        speakerId: matchedCharacter.id,
        speakerName: parts[2].trim() || matchedCharacter.name,
        text,
      });
      continue;
    }
    if (line.startsWith("SHOP_IDS|")) {
      shopIds = line
        .slice("SHOP_IDS|".length)
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));
      continue;
    }
    if (line.startsWith("IMAGE_URL|")) {
      const value = line.slice("IMAGE_URL|".length).trim();
      imageUrl = !value || /^null$/i.test(value) ? null : value;
      continue;
    }
    if (line.startsWith("FOLLOW_UP|")) {
      followUpQuestion = line.slice("FOLLOW_UP|".length).trim();
      continue;
    }
    if (line.startsWith("SUMMARY|")) {
      summary = line.slice("SUMMARY|".length).trim();
    }
  }

  if (turns.length === 0) {
    const fallbackText = rawOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^(TURN|SHOP_IDS|IMAGE_URL|FOLLOW_UP|SUMMARY)\|/.test(line) && line !== "END")
      .join("\n")
      .trim();
    const fallbackSpeaker = selectedCharacters[0];
    if (fallbackText && fallbackSpeaker) {
      turns.push({
        speakerId: fallbackSpeaker.id,
        speakerName: fallbackSpeaker.name,
        text: fallbackText,
      });
    }
  }

  return {
    summary,
    turns,
    shopIds,
    imageUrl,
    followUpQuestion,
  };
}

function buildReplyFromTurns(turns: ConsultTurn[]) {
  return turns.map((turn) => `${turn.speakerName}: ${turn.text}`).join("\n");
}

async function finalizeConsultResponse(options: {
  request: Request;
  supabase: SupabaseClient;
  text: string;
  keywords: string[];
  location: { lat: number; lng: number } | null;
  visitorKey: string | null;
  targetShopName: string | null;
  targetShop: Shop | null;
  candidateShops: Shop[];
  turns: ConsultTurn[];
  shopIds: number[];
  imageUrl: string | null;
  followUpQuestion: string;
  summary: string;
  shopIntent: boolean;
  memorySummary: string;
}): Promise<ConsultAskResponse> {
  const {
    request,
    supabase,
    text,
    keywords,
    location,
    visitorKey,
    targetShopName,
    targetShop,
    candidateShops,
    turns,
    shopIds,
    imageUrl,
    followUpQuestion,
    summary,
    shopIntent,
    memorySummary,
  } = options;

  const normalizedTurns = turns
    .filter((turn) => turn.text.trim().length > 0)
    .slice(0, 4);

  const shopPool = targetShop
    ? [targetShop, ...candidateShops.filter((shop) => shop.id !== targetShop.id)]
    : candidateShops;

  const recommendedIds = sortShopIdsByDistance(
    Array.from(
      new Set(
        shopIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      )
    ).slice(0, 3),
    shopPool,
    location
  );

  const recommendedShops = shopPool.filter((shop) => recommendedIds.includes(shop.id));
  const finalRecommendedShops =
    recommendedShops.length > 0 || !shopIntent
      ? recommendedShops
      : shopPool.slice(0, 3);

  const reply =
    buildReplyFromTurns(normalizedTurns) ||
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
  const logIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  if (logVendorIds.length > 0) {
    const logs = logVendorIds.map((vendorId) => ({
      store_id: vendorId,
      question_text: text || "(画像のみ)",
      intent_category: intentCategory,
      keywords,
      location_type: locationType,
      is_recommendation: true,
      ip_address: logIp,
      visitor_key: visitorKey ?? null,
    }));
    supabase.from("ai_consult_logs").insert(logs).then(() => {});
  } else {
    supabase.from("ai_consult_logs").insert({
      store_id: null,
      question_text: text || "(画像のみ)",
      intent_category: intentCategory,
      keywords,
      location_type: locationType,
      is_recommendation: false,
      ip_address: logIp,
      visitor_key: visitorKey ?? null,
    }).then(() => {});
  }

  const safeFollowUpQuestion = isValidFollowUpQuestion(followUpQuestion ?? "")
    ? followUpQuestion.trim()
    : buildFallbackFollowUpQuestion(text, targetShopName, finalRecommendedShops.length);

  return {
    reply,
    imageUrl: imageUrl ?? undefined,
    shopIds: finalRecommendedShops.map((shop) => shop.id),
    shops: finalRecommendedShops,
    turns: normalizedTurns,
    followUpQuestion: safeFollowUpQuestion,
    memorySummary: summary.trim() || memorySummary,
    retryable: false,
  };
}

async function createStreamingConsultResponse(options: {
  openaiKey: string;
  selectedCharacters: ConsultCharacter[];
  conversationPattern: ConversationPattern;
  userContent:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
  request: Request;
  supabase: SupabaseClient;
  text: string;
  keywords: string[];
  location: { lat: number; lng: number } | null;
  visitorKey: string | null;
  targetShopName: string | null;
  targetShop: Shop | null;
  candidateShops: Shop[];
  shopIntent: boolean;
  memorySummary: string;
}): Promise<Response> {
  const {
    openaiKey,
    selectedCharacters,
    conversationPattern,
    userContent,
    request,
    supabase,
    text,
    keywords,
    location,
    visitorKey,
    targetShopName,
    targetShop,
    candidateShops,
    shopIntent,
    memorySummary,
  } = options;

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
      messages: [
        {
          role: "system",
          content: buildGrandmaAiSystemPrompt(
            selectedCharacters,
            [
              buildConversationPatternPrompt(selectedCharacters, conversationPattern),
              buildStreamingFormatPrompt(selectedCharacters, conversationPattern),
            ].join("\n\n")
          ),
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      buildErrorResponse(
        "system_error",
        selectedCharacters,
        "いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
        {
          retryable: true,
          errorMessage: "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
          memorySummary,
        }
      ),
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (payload: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      const reader = upstream.body!.getReader();
      let sseBuffer = "";
      let modelOutput = "";
      let firstTurnStarted = false;
      let firstTurnTextLength = 0;

      const emitFirstTurnProgress = () => {
        const firstLine = modelOutput.split(/\r?\n/, 1)[0]?.replace(/\r/g, "") ?? "";
        if (!firstLine.startsWith("TURN|")) return;
        const parts = firstLine.split("|");
        if (parts.length < 4) return;
        const requestedSpeakerId = parts[1].trim() as ConsultCharacterId;
        const matchedCharacter =
          CONSULT_CHARACTER_BY_ID.get(requestedSpeakerId) ??
          selectedCharacters.find((character) => character.id === requestedSpeakerId) ??
          selectedCharacters[0];
        if (!matchedCharacter) return;
        if (!firstTurnStarted) {
          firstTurnStarted = true;
          enqueue({
            type: "first_turn_start",
            speakerId: matchedCharacter.id,
            speakerName: parts[2].trim() || matchedCharacter.name,
          });
        }
        const currentText = parts.slice(3).join("|");
        if (currentText.length <= firstTurnTextLength) return;
        enqueue({
          type: "first_turn_delta",
          delta: currentText.slice(firstTurnTextLength),
        });
        firstTurnTextLength = currentText.length;
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (!delta) continue;
              modelOutput += delta;
              emitFirstTurnProgress();
            } catch {
              // skip malformed chunks
            }
          }
        }

        const streamedPayload = parseStreamingConsultOutput(modelOutput, selectedCharacters);
        const response = await finalizeConsultResponse({
          request,
          supabase,
          text,
          keywords,
          location,
          visitorKey,
          targetShopName,
          targetShop,
          candidateShops,
          turns: streamedPayload.turns,
          shopIds: streamedPayload.shopIds,
          imageUrl: streamedPayload.imageUrl,
          followUpQuestion: streamedPayload.followUpQuestion,
          summary: streamedPayload.summary,
          shopIntent,
          memorySummary,
        });
        enqueue({
          type: "final",
          response,
        });
      } catch {
        enqueue({
          type: "final",
          response: buildErrorResponse(
            "system_error",
            selectedCharacters,
            "いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
            {
              retryable: true,
              errorMessage: "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
              memorySummary,
            }
          ),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}

function isValidFollowUpQuestion(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < 8 || trimmed.length > 40) return false;
  if (!/[？?]$/.test(trimmed)) return false;
  if (/(してみる|どうかな|どう？|気になる|行ってみる)/.test(trimmed)) return false;
  return true;
}

function buildFallbackFollowUpQuestion(
  question: string,
  targetShopName: string | null,
  shopCount: number
) {
  if (targetShopName) {
    return `${targetShopName}でいちばん人気の商品は？`;
  }
  if (/(季節|旬|食材|野菜|果物)/.test(question)) {
    return "今の季節なら何を最初に見ればいい？";
  }
  if (shopCount > 0) {
    return "この中でいちばん人気のお店は？";
  }
  return "はじめて行くならどこから回るのがおすすめ？";
}

async function handleAbuseDetection(
  supabase: SupabaseClient,
  ip: string | null,
  text: string,
  visitorKey?: string
): Promise<"blocked" | "ok"> {
  const blockIpValue = ip ?? "__visitor_key__";

  // ① ブロックリスト確認（IP または visitor_key でブロック）
  const orConditions: string[] = [];
  if (ip) orConditions.push(`ip_address.eq.${ip}`);
  if (visitorKey) orConditions.push(`visitor_key.eq.${visitorKey}`);

  if (orConditions.length > 0) {
    const { data: blockData } = await supabase
      .from("ai_abuse_blocks")
      .select("id")
      .eq("is_active", true)
      .limit(1)
      .or(orConditions.join(","));
    if (blockData && blockData.length > 0) return "blocked";
  }

  // ② 不正パターン検知
  const abuse = detectAbuse(text);
  if (abuse) {
    const shouldBlock = abuse.severity >= 3;
    await supabase.from("ai_abuse_events").insert({
      ip_address: ip,
      visitor_key: visitorKey ?? null,
      event_type: abuse.type,
      message: text.slice(0, 200),
      severity: abuse.severity,
      blocked: shouldBlock,
    });
    if (shouldBlock && (ip || visitorKey)) {
      await supabase.from("ai_abuse_blocks").insert({
        ip_address: blockIpValue,
        visitor_key: visitorKey ?? null,
        reason: abuse.reason,
      });
      await supabase.from("admin_notifications").insert({
        type: "ai_abuse",
        title: `AI不正アクセスをブロック（${abuse.type}）`,
        body: `IP: ${ip ?? "不明"} | visitor: ${visitorKey ?? "不明"} | ${abuse.reason} | 内容: ${text.slice(0, 80)}`,
        link: "/admin/audit-logs",
      });
      return "blocked";
    }
  }

  return "ok";
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
      preferredCharacterId,
      visitorKey,
      stream,
    } = await parseRequest(request);
    const question = text || (imageDataUrl ? "画像について教えて" : "");
    if (!question) {
      return NextResponse.json({ reply: "質問を入力してね。" }, { status: 400 });
    }

    const normalized = question.replace(/\s+/g, "");
    const selectedCharacters = pickConsultCharacters(preferredCharacterId);

    // セキュリティチェック（環境変数が揃っている場合のみ実行）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceRoleKey) {
      const secClient = createClient(supabaseUrl, serviceRoleKey);
      // x-real-ip はVercelが設定する信頼できるヘッダー（スプーフィング不可）
      // x-forwarded-for の末尾はプロキシが追加した値で比較的信頼できる
      const forwardedIp =
        request.headers.get("x-real-ip") ??
        request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
        null;
      const ip = forwardedIp && forwardedIp !== "unknown" ? forwardedIp : null;
      const abuseResult = await handleAbuseDetection(secClient, ip, text, visitorKey ?? undefined);
      if (abuseResult === "blocked") {
        return NextResponse.json(
          buildErrorResponse(
            "unsupported_request",
            selectedCharacters,
            "申し訳ありませんが、このアクセスはご利用いただけません。"
          ),
          { status: 403 }
        );
      }
    }
    const conversationPattern = pickConversationPattern(selectedCharacters);
    if (normalized.includes("おばあちゃんは何者") || normalized.includes("おばあちゃん何者")) {
      return NextResponse.json({
        reply: "高知の日曜市を案内するにちよさんたちやきね。気軽に聞いてや。",
      });
    }
    if (isUnsupportedQuestion(normalized)) {
      return NextResponse.json(
        buildErrorResponse(
          "unsupported_request",
          selectedCharacters,
          "その相談には答えられんけんど、日曜市のお店や回り方なら一緒に考えられるよ。"
        )
      );
    }
    if (text && text.length < 4 && !imageDataUrl) {
      return NextResponse.json(
        buildErrorResponse(
          "insufficient_context",
          selectedCharacters,
          "もう少し詳しく聞かせてくれたら案内しやすいよ。食べたいものや気になるお店があると分かりやすいきね。"
        )
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
      return NextResponse.json(
        buildErrorResponse(
          "system_error",
          selectedCharacters,
          "いま準備が整ってないみたい。少しおいて、もう一回試してみてね。",
          {
            retryable: true,
            errorMessage: "相談の準備がまだ整っていません。少し時間をおいて再試行してください。",
            memorySummary,
          }
        ),
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const keywords = extractKeywords(question);
    const shopIntent = isShopRelatedQuestion(normalized);
    const seasonalQuestion = isSeasonalQuestion(normalized);
    const currentSeason = getCurrentSeasonInfo();

    let targetShop: Shop | null = null;
    if (targetShopId) {
      targetShop = await fetchShopByStoreNumber(supabase, targetShopId);
    }
    if (!targetShop && targetShopName) {
      targetShop = await fetchShopByName(supabase, targetShopName);
    }

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
        buildErrorResponse(
          "system_error",
          selectedCharacters,
          "いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
          {
            retryable: true,
            errorMessage: "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
            memorySummary,
          }
        ),
        { status: 500 }
      );
    }
    const embeddingPayload = (await embeddingResponse.json()) as {
      data?: { embedding: number[] }[];
    };
    const embedding = embeddingPayload.data?.[0]?.embedding;
    if (!embedding) {
      return NextResponse.json(
        buildErrorResponse(
          "system_error",
          selectedCharacters,
          "いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
          {
            retryable: true,
            errorMessage: "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
            memorySummary,
          }
        ),
        { status: 500 }
      );
    }

    const seasonalProducts = seasonalQuestion
      ? await fetchSeasonalProductContext(supabase, currentSeason.seasonId)
      : [];
    const seasonalVendorIds = Array.from(
      new Set(seasonalProducts.map((row) => row.vendorId))
    );

    const candidateVendorIds = shopIntent
      ? await fetchCandidateVendorIds(
          supabase,
          keywords,
          targetShopName,
          embedding,
          seasonalVendorIds
        )
      : [];
    if (targetShop?.vendorId) {
      candidateVendorIds.unshift(targetShop.vendorId);
    }
    const candidateShops = await fetchShopsByVendorIds(
      supabase,
      Array.from(new Set(candidateVendorIds)).slice(0, 12)
    );
    if (
      shopIntent &&
      !targetShop &&
      candidateShops.length === 0 &&
      seasonalProducts.length === 0 &&
      !imageDataUrl
    ) {
      return NextResponse.json(
        buildErrorResponse(
          "no_result",
          selectedCharacters,
          "ぴったり当てはまるお店は見つからんかったけんど、言い方を少し変えると探しやすくなるかもしれんね。"
        )
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
      `現在の季節: ${currentSeason.seasonName}`,
      targetShop
        ? `注目中の店舗: id:${targetShop.id} | name:${targetShop.name} | owner:${targetShop.ownerName}`
        : "注目中の店舗: なし",
      `店舗候補:\n${summarizeShops(targetShop ? [targetShop, ...candidateShops.filter((shop) => shop.id !== targetShop.id)] : candidateShops)}`,
      `季節の候補:\n${
        seasonalProducts.length > 0
          ? seasonalProducts
              .map(
                (row) =>
                  `shop:${row.shopName || "店舗名不明"} | product:${row.productName} | season:${row.seasonName}`
              )
              .join("\n")
          : "該当なし"
      }`,
      `共通知識:\n${knowledgeContext}`,
      `出店者知識:\n${storeKnowledgeContext || "該当なし"}`,
      `選ばれた話者: ${selectedCharacters.map((character) => character.name).join(" / ")}`,
    ].join("\n\n");

    const userContent:
      | string
      | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> =
      imageDataUrl
        ? [
            { type: "text", text: `${userContextText}\n画像が添付されています。` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ]
        : userContextText;

    if (stream) {
      return createStreamingConsultResponse({
        openaiKey,
        selectedCharacters,
        conversationPattern,
        userContent,
        request,
        supabase,
        text,
        keywords,
        location,
        visitorKey,
        targetShopName,
        targetShop,
        candidateShops,
        shopIntent,
        memorySummary,
      });
    }

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
        response_format: buildResponseSchema(selectedCharacters, conversationPattern),
        messages: [
          {
            role: "system",
            content: buildGrandmaAiSystemPrompt(
              selectedCharacters,
              buildConversationPatternPrompt(selectedCharacters, conversationPattern)
            ),
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
        buildErrorResponse(
          "system_error",
          selectedCharacters,
          "いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
          {
            retryable: true,
            errorMessage: "相談の送信に失敗しました。通信状況を確認して、もう一度試してください。",
            memorySummary,
          }
        ),
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
    const response = await finalizeConsultResponse({
      request,
      supabase,
      text,
      keywords,
      location,
      visitorKey,
      targetShopName,
      targetShop,
      candidateShops,
      turns,
      shopIds: structured.shopIds ?? [],
      imageUrl: structured.imageUrl,
      followUpQuestion: structured.followUpQuestion ?? "",
      summary: structured.summary ?? "",
      shopIntent,
      memorySummary,
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        reply: "にちよさん: いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
        turns: [
          {
            speakerId: "nichiyosan",
            speakerName: "にちよさん",
            text: "いま少し混みゆうみたい。少しおいて、もう一回聞いてみてね。",
          },
        ],
        errorCode: "system_error",
        retryable: true,
        errorMessage: "接続に失敗しました。少し時間をおいて、もう一度試してください。",
      },
      { status: 500 }
    );
  }
}
