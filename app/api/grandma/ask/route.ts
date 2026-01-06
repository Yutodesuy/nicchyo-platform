import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { grandmaAiSystemPrompt } from "@/app/(public)/map/data/grandmaAiContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MatchRow = {
  shop_id: string;
  similarity: number;
};

type ShopRow = {
  id: string;
  legacy_id: number | null;
  name: string | null;
  owner_name: string | null;
  chome: string | null;
  category: string | null;
  products: string[] | null;
  description: string | null;
  specialty_dish: string | null;
  about_vendor: string | null;
  stall_style: string | null;
  schedule: string | null;
  message: string | null;
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
    const { text, location } = (await request.json()) as {
      text?: string;
      location?: { lat: number; lng: number } | null;
    };
    const question = (text ?? "").trim();
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
    const { data: matches } = await supabase
      .rpc("match_shop_embeddings", {
        query_embedding: embedding,
        match_count: 3,
        match_threshold: 0,
      })
      .returns<MatchRow[]>();

    const safeMatches = Array.isArray(matches) ? matches : [];
    const sortedMatches = [...safeMatches].sort(
      (a, b) => b.similarity - a.similarity
    );
    let matchIds = sortedMatches.map((row) => row.shop_id).filter(Boolean);
    let shops: ShopRow[] = [];
    if (matchIds.length > 0) {
      const { data } = await supabase
        .from("shops")
        .select(
          [
            "id",
            "legacy_id",
            "name",
            "owner_name",
            "chome",
            "category",
            "products",
            "description",
            "specialty_dish",
            "about_vendor",
            "stall_style",
            "schedule",
            "message",
            "lat",
            "lng",
          ].join(",")
        )
        .in("id", matchIds);
      shops = (data ?? []) as unknown as ShopRow[];
    }

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
      const filters = [
        `owner_name.ilike.%${nameQuery}%`,
        `name.ilike.%${nameQuery}%`,
        ...nameParts.flatMap((part) => [
          `owner_name.ilike.%${part}%`,
          `name.ilike.%${part}%`,
        ]),
      ];
      const { data: directRows } = await supabase
        .from("shops")
        .select(
          [
            "id",
            "legacy_id",
            "name",
            "owner_name",
            "chome",
            "category",
            "products",
            "description",
            "specialty_dish",
            "about_vendor",
            "stall_style",
            "schedule",
            "message",
            "lat",
            "lng",
          ].join(",")
        )
        .or(filters.join(","));
      const normalizedMatches = (directRows ?? []).filter((row) => {
        const owner = (row.owner_name ?? "").replace(/\s+/g, "");
        return owner.includes(normalizedNameQuery);
      });
      const useRows = normalizedMatches.length > 0 ? normalizedMatches : directRows;
      if (useRows && useRows.length > 0) {
        shopIntent = true;
        shops = useRows as ShopRow[];
        matchIds = shops.map((row) => row.id);
      }
    }

    if (!shopIntent && shortQuery) {
      const { data: directRows } = await supabase
        .from("shops")
        .select(
          [
            "id",
            "legacy_id",
            "name",
            "owner_name",
            "chome",
            "category",
            "products",
            "description",
            "specialty_dish",
            "about_vendor",
            "stall_style",
            "schedule",
            "message",
            "lat",
            "lng",
          ].join(",")
        )
        .or(`products.cs.{${normalized}},synonyms.cs.{${normalized}}`);
      if (directRows && directRows.length > 0) {
        shopIntent = true;
        const merged = new Map<string, ShopRow>();
        shops.forEach((row) => merged.set(row.id, row));
        (directRows as ShopRow[]).forEach((row) => merged.set(row.id, row));
        shops = Array.from(merged.values());
        matchIds = shops.map((row) => row.id);
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

    const shopContext =
      shops.length > 0
        ? shops
            .map((shop) => {
              const parts = [
                `id:${shop.id}`,
                shop.legacy_id
                  ? `legacy_id:${String(shop.legacy_id).padStart(3, "0")}`
                  : null,
                shop.name ? `name:${shop.name}` : null,
                shop.category ? `category:${shop.category}` : null,
                shop.products?.length
                  ? `products:${shop.products.join(" / ")}`
                  : null,
                shop.specialty_dish ? `specialty:${shop.specialty_dish}` : null,
                shop.description ? `desc:${shop.description}` : null,
                shop.message ? `message:${shop.message}` : null,
              ].filter(Boolean);
              return parts.join(" | ");
            })
            .join("\n")
        : "該当なし";

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
      rows: Array<{ legacy_id: number | null; lat: number | null; lng: number | null }>
    ) => {
      if (!hasLocation) return ids;
      const loc = { lat: location!.lat, lng: location!.lng };
      return [...ids]
        .map((id) => {
          const row = rows.find((shop) => shop.legacy_id === id);
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
            content: `ユーザー質問: ${question}\n現在位置: ${
              location ? `${location.lat}, ${location.lng}` : "不明"
            }\n店舗情報:\n${shopContext}\n知識ベース:\n${knowledgeContext}`,
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
      const { data: locationRows } = await supabase
        .from("shops")
        .select(["legacy_id", "lat", "lng"].join(","))
        .in("legacy_id", recommendedIds);
      const rows = (locationRows ?? []) as unknown as Array<{
        legacy_id: number | null;
        lat: number | null;
        lng: number | null;
      }>;
      recommendedIds = sortLegacyByDistance(recommendedIds, rows);
    }
    if (recommendedIds.length === 0 && shopIntent && matchIds.length > 0) {
      const legacyIds = matchIds
        .map((id) => shops.find((row) => row.id === id)?.legacy_id ?? null)
        .filter((value): value is number => typeof value === "number");
      recommendedIds = sortLegacyByDistance(legacyIds, shops);
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
