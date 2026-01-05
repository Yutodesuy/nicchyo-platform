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
          "日曜市の案内役のおばあちゃんやきね。お店や道のことを教えるき、気軽に聞いてね。",
      });
    }
    const shopIntent = /店|お店|店舗|おすすめ|買|探|食材|食べ物|野菜|果物|惣菜|お土産|雑貨|道具|工具|苗|植物|アクセサリー|工芸|レシピ|食べ歩き|朝ごはん/.test(
      normalized
    );
    const nearIntent = /近く|近い|周辺/.test(normalized);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
      return NextResponse.json(
        { reply: "いま準備中やき、もう少し待っててね。" },
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
        { reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。" },
        { status: 500 }
      );
    }
    const embeddingPayload = (await embeddingResponse.json()) as {
      data?: { embedding: number[] }[];
    };
    const embedding = embeddingPayload.data?.[0]?.embedding;
    if (!embedding) {
      return NextResponse.json(
        { reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。" },
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

    const sortedMatches = [...(matches ?? [])].sort((a, b) => b.similarity - a.similarity);
    const matchIds = sortedMatches.map((row) => row.shop_id).filter(Boolean);
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
      shops = (data ?? []) as ShopRow[];
    }

    const { data: knowledgeMatches } = await supabase
      .rpc("match_knowledge_embeddings", {
        query_embedding: embedding,
        match_count: 3,
        match_threshold: 0.55,
      })
      .returns<{ id: string; similarity: number }[]>();
    const knowledgeIds = (knowledgeMatches ?? []).map((row) => row.id).filter(Boolean);
    let knowledgeRows: KnowledgeRow[] = [];
    if (knowledgeIds.length > 0) {
      const { data } = await supabase
        .from("knowledge_embeddings")
        .select(["id", "category", "title", "content", "image_url"].join(","))
        .in("id", knowledgeIds);
      knowledgeRows = (data ?? []) as KnowledgeRow[];
    }

    const shopContext =
      shops.length > 0
        ? shops
            .map((shop) => {
              const parts = [
                `id:${shop.id}`,
                shop.legacy_id ? `legacy_id:${String(shop.legacy_id).padStart(3, "0")}` : null,
                shop.name ? `name:${shop.name}` : null,
                shop.category ? `category:${shop.category}` : null,
                shop.products?.length ? `products:${shop.products.join(" / ")}` : null,
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

    const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
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
            }\n候補店舗:\n${shopContext}\n知識ベース:\n${knowledgeContext}`,
          },
        ],
      }),
    });
    if (!chatResponse.ok) {
      return NextResponse.json(
        { reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。" },
        { status: 500 }
      );
    }
    const chatPayload = (await chatResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawReply =
      chatPayload.choices?.[0]?.message?.content?.trim() ??
      "ごめんね、今は答えを出せんかった。時間をおいて試してね。";
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
    if (recommendedIds.length === 0 && shopIntent && matchIds.length > 0) {
      recommendedIds = matchIds
        .map((id) => {
          const shop = shops.find((row) => row.id === id);
          const legacyId = shop?.legacy_id ?? null;
          if (!legacyId) return null;
          if (nearIntent && location && shop?.lat && shop?.lng) {
            const distance = haversine(
              { lat: location.lat, lng: location.lng },
              { lat: shop.lat, lng: shop.lng }
            );
            return { legacyId, distance };
          }
          return { legacyId, distance: null };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
        .map((row) => row.legacyId);
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
      { reply: "ごめんね、今は答えを出せんかった。時間をおいて試してね。" },
      { status: 500 }
    );
  }
}
