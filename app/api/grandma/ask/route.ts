import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { grandmaAiSystemPrompt } from "@/app/(public)/map/data/grandmaAiContext";
import { fetchShopsFromDb } from "@/app/(public)/map/services/shopDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShopRow = {
  id: number;
  name: string | null;
  owner_name: string | null;
  chome: string | null;
  category: string | null;
  products: string[] | null;
  description: string | null;
  stall_style: string | null;
  schedule: string | null;
  message: string | null;
  shop_strength: string | null;
  lat: number | null;
  lng: number | null;
};

type KnowledgeRow = {
  id: string;
  category: string | null;
  title: string | null;
  content: string | null;
  image_url: string | null;
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let text: string | undefined;
    let location: { lat: number; lng: number } | null | undefined;
    let imageDataUrl: string | null = null;
    let targetShopId: number | null = null;
    let targetShopName: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const formText = form.get("text");
      const formLocation = form.get("location");
      const formShopId = form.get("shopId");
      const formShopName = form.get("shopName");
      const formImage = form.get("image");
      text = typeof formText === "string" ? formText : undefined;
      if (typeof formLocation === "string") {
        try {
          location = JSON.parse(formLocation) as { lat: number; lng: number } | null;
        } catch {
          location = null;
        }
      }
      if (typeof formShopId === "string" && formShopId.trim()) {
        const parsed = Number(formShopId);
        targetShopId = Number.isFinite(parsed) ? parsed : null;
      }
      if (typeof formShopName === "string" && formShopName.trim()) {
        targetShopName = formShopName.trim();
      }
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
      };
      text = payload.text;
      location = payload.location;
      targetShopId =
        typeof payload.shopId === "number" && Number.isFinite(payload.shopId)
          ? payload.shopId
          : null;
      targetShopName = payload.shopName?.trim() || null;
    }

    const rawQuestion = (text ?? "").trim();
    const question = rawQuestion || (imageDataUrl ? "画像について教えて" : "");
    if (!question) {
      return NextResponse.json({ reply: "質問を入力してね。" }, { status: 400 });
    }

    const normalized = question.replace(/\s+/g, "");
    if (
      normalized.includes("おばあちゃんは何者") ||
      normalized.includes("おばあちゃん何者")
    ) {
      return NextResponse.json({
        reply:
          "高知の日曜市を案内するおせっかいばあちゃんやきね。困ったら何でも聞いてや。",
      });
    }

    let shopIntent = /お店|おすすめ|人気|売って|買い|食べ|飲み|野菜|果物|惣菜|お土産|アクセサリー|雑貨|道具|工具|植物|苗|花|ハンドメイド|工芸|ランチ|朝ごはん|おやつ|スイーツ|食材|食べ物/.test(
      normalized
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
      return NextResponse.json(
        { reply: "準備中やき、もう少し待ってね。" },
        { status: 500 }
      );
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

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const allShops: ShopRow[] = (await fetchShopsFromDb(supabase)).map((shop) => ({
      id: shop.id,
      name: shop.name ?? null,
      owner_name: shop.ownerName ?? null,
      chome: shop.chome ?? null,
      category: shop.category ?? null,
      products: shop.products ?? [],
      description: shop.description ?? null,
      stall_style: shop.stallStyle ?? null,
      schedule: shop.schedule ?? null,
      message: shop.message ?? null,
      shop_strength: shop.shopStrength ?? null,
      lat: shop.lat ?? null,
      lng: shop.lng ?? null,
    }));

    let targetShop: ShopRow | null = null;
    if (targetShopId || targetShopName) {
      targetShop =
        allShops.find((shop) => {
          if (targetShopId && shop.id === targetShopId) return true;
          if (targetShopName && shop.name) {
            return shop.name.includes(targetShopName);
          }
          return false;
        }) ?? null;
    }

    let shops: ShopRow[] = [];
    let matchIds: number[] = [];

    const shortQuery = normalized.length <= 6 && normalized.length > 0;
    const nameQuery = question
      .replace(/さん.*$/, "")
      .replace(/のお店.*$/, "")
      .trim();
    const wantsOwnerSearch = question.includes("さん") || question.includes("のお店");
    if (nameQuery.length > 0 && wantsOwnerSearch) {
      const normalizedNameQuery = nameQuery.replace(/\s+/g, "");
      let nameParts = nameQuery.split(/\s+/).filter(Boolean);
      if (nameParts.length === 1 && normalizedNameQuery.length >= 3) {
        nameParts = [
          normalizedNameQuery.slice(0, 2),
          normalizedNameQuery.slice(2),
        ].filter(Boolean);
      }
      const safeDirectRows = allShops.filter((row) => {
        const owner = (row.owner_name ?? "").replace(/\s+/g, "");
        const shopName = (row.name ?? "").replace(/\s+/g, "");
        if (owner.includes(normalizedNameQuery) || shopName.includes(normalizedNameQuery)) {
          return true;
        }
        return nameParts.some((part) => owner.includes(part) || shopName.includes(part));
      });
      const useRows = safeDirectRows;
      if (useRows.length > 0) {
        shopIntent = true;
        shops = useRows;
        matchIds = shops.map((row) => row.id);
      }
    }

    if (!shopIntent && shortQuery) {
      const safeDirectRows = allShops.filter((row) => {
        const products = row.products ?? [];
        return products.some((item) => item.includes(normalized));
      });
      if (safeDirectRows.length > 0) {
        shopIntent = true;
        shops = safeDirectRows;
        matchIds = shops.map((row) => row.id);
      }
    }

    if (shopIntent && shops.length === 0) {
      const scored = allShops
        .map((shop) => {
          const name = shop.name ?? "";
          const owner = shop.owner_name ?? "";
          const category = shop.category ?? "";
          const products = shop.products ?? [];
          let score = 0;
          if (name.includes(normalized)) score += 3;
          if (owner.includes(normalized)) score += 2;
          if (category.includes(normalized)) score += 2;
          if (products.some((item) => item.includes(normalized))) score += 2;
          return { shop, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((row) => row.shop);
      if (scored.length > 0) {
        shops = scored;
        matchIds = scored.map((row) => row.id);
      }
    }

    const { data: knowledgeMatches } = await supabase
      .rpc("match_knowledge_embeddings", {
        query_embedding: embedding,
        match_count: 3,
        match_threshold: 0.55,
      })
      .returns<{ id: string; similarity: number }[]>();
    const safeKnowledgeMatches = Array.isArray(knowledgeMatches)
      ? knowledgeMatches
      : [];
    const knowledgeIds = safeKnowledgeMatches
      .map((row) => row.id)
      .filter(Boolean);
    let knowledgeRows: KnowledgeRow[] = [];
    if (knowledgeIds.length > 0) {
      const { data } = await supabase
        .from("knowledge_embeddings")
        .select(["id", "category", "title", "content", "image_url"].join(","))
        .in("id", knowledgeIds);
      knowledgeRows = (data ?? []) as unknown as KnowledgeRow[];
    }

    const knowledgeContext =
      knowledgeRows.length > 0
        ? knowledgeRows
            .map((row) => {
              const parts = [
                `id:${row.id}`,
                row.category ? `category:${row.category}` : null,
                row.title ? `title:${row.title}` : null,
                row.content ? `content:${row.content}` : null,
                row.image_url ? `image_url:${row.image_url}` : null,
              ].filter(Boolean);
              return parts.join(" | ");
            })
            .join("\n")
        : "該当なし";
    let shopContext =
      shops.length > 0
        ? shops
            .map((shop) => {
              const parts = [
                `id:${shop.id}`,
                shop.name ? `name:${shop.name}` : null,
                shop.category ? `category:${shop.category}` : null,
                shop.products?.length
                  ? `products:${shop.products.join(" / ")}`
                  : null,
                shop.description ? `desc:${shop.description}` : null,
                shop.shop_strength ? `strength:${shop.shop_strength}` : null,
                shop.message ? `message:${shop.message}` : null,
              ].filter(Boolean);
              return parts.join(" | ");
            })
            .join("\n")
        : "該当なし";
    if (targetShop) {
      shopIntent = true;
      const targetParts = [
        `id:${targetShop.id}`,
        targetShop.name ? `name:${targetShop.name}` : null,
        targetShop.category ? `category:${targetShop.category}` : null,
        targetShop.products?.length
          ? `products:${targetShop.products.join(" / ")}`
          : null,
        targetShop.shop_strength ? `strength:${targetShop.shop_strength}` : null,
      ].filter(Boolean);
      if (targetParts.length > 0) {
        const targetContext = `TARGET_SHOP: ${targetParts.join(" | ")}`;
        shopContext = `${targetContext}\n${shopContext}`.trim();
        shops = [targetShop, ...shops.filter((shop) => shop.id !== targetShop!.id)];
        matchIds = [targetShop.id, ...matchIds.filter((id) => id !== targetShop!.id)];
        matchIds = Array.from(new Set(matchIds));
      }
    }

    const haversine = (
      a: { lat: number; lng: number },
      b: { lat: number; lng: number }
    ) => {
      const toRad = (value: number) => (value * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLng = Math.sin(dLng / 2);
      const h =
        sinDLat * sinDLat +
        Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
      return 2 * 6371 * Math.asin(Math.sqrt(h));
    };
    const hasLocation =
      location && Number.isFinite(location.lat) && Number.isFinite(location.lng);
    const sortLegacyByDistance = (
      ids: number[],
      rows: Array<{ id: number; lat: number | null; lng: number | null }>
    ) => {
      if (!hasLocation) return ids;
      const loc = { lat: location!.lat, lng: location!.lng };
      return [...ids]
        .map((id) => {
          const row = rows.find((shop) => shop.id === id);
          if (!row || row.lat == null || row.lng == null) {
            return { id, dist: null };
          }
          return { id, dist: haversine(loc, { lat: row.lat, lng: row.lng }) };
        })
        .sort((a, b) => {
          if (a.dist === null && b.dist === null) return 0;
          if (a.dist === null) return 1;
          if (b.dist === null) return -1;
          return a.dist - b.dist;
        })
        .map((item) => item.id);
    };

    const userContextText = `ユーザー質問: ${rawQuestion || "（画像のみ）"}\n現在位置: ${
      location ? `${location.lat}, ${location.lng}` : "不明"
    }\n店舗情報:\n${shopContext}\n知識ベース:\n${knowledgeContext}`;
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
        temperature: 0.4,
        max_tokens: 200,
        messages: [
          { role: "system", content: grandmaAiSystemPrompt },
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
    const rawReply =
      chatPayload.choices?.[0]?.message?.content?.trim() ??
      "うまく調べられんかったき、もう一回聞いてみて。";

    const imageMatch = rawReply.match(/IMAGE_URL:\s*(\S+)/i);
    let reply = imageMatch ? rawReply.replace(imageMatch[0], "").trim() : rawReply;
    const imageUrl = imageMatch?.[1];
    const shopMatch = reply.match(/SHOP_IDS:\s*([0-9,\s]+)/i);
    const shopIds = shopMatch
      ? shopMatch[1]
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value))
      : [];

    let recommendedIds = shopIds;
    if (recommendedIds.length > 0 && hasLocation && shopIntent) {
      recommendedIds = sortLegacyByDistance(recommendedIds, shops);
    }
    if (recommendedIds.length === 0 && shopIntent && matchIds.length > 0) {
      recommendedIds = sortLegacyByDistance(matchIds, shops);
    }

    const uniqueRecommended = Array.from(new Set(recommendedIds)).slice(0, 3);
    if (shopMatch) {
      reply = reply.replace(shopMatch[0], "").trim();
    }
    if (!shopIntent || uniqueRecommended.length === 0) {
      return NextResponse.json({ reply, imageUrl });
    }

    return NextResponse.json({ reply, imageUrl, shopIds: uniqueRecommended });
  } catch {
    return NextResponse.json(
      { reply: "うまく調べられんかったき、もう一回聞いてみて。" },
      { status: 500 }
    );
  }
}
