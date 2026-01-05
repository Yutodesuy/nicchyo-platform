const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ENV_PATH = path.resolve(process.cwd(), ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^"(.*)"$/, "$1");
    }
  });
}

function buildContent(row) {
  const parts = [
    row.name,
    row.category,
    row.chome ? `block: ${row.chome}` : "",
    row.side ? `side: ${row.side}` : "",
    row.position ? `position: ${row.position}` : "",
    row.lat ? `lat: ${row.lat}` : "",
    row.lng ? `lng: ${row.lng}` : "",
    row.description,
    row.specialty_dish,
    row.about_vendor,
    row.stall_style,
    row.schedule,
    row.message,
  ].filter(Boolean);

  const products = Array.isArray(row.products) ? row.products.join(", ") : "";
  if (products) parts.push(`products: ${products}`);

  return parts.join("\n");
}

async function fetchEmbeddings(apiKey, inputs) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: inputs,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

async function main() {
  loadEnvFile(ENV_PATH);

  const apiKey = process.env.OPENAI_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const pageSize = 50;
  let from = 0;
  let totalProcessed = 0;

  while (true) {
    const { data, error } = await supabase
      .from("shops")
      .select(
        [
          "id",
          "legacy_id",
          "name",
          "category",
          "chome",
          "side",
          "position",
          "lat",
          "lng",
          "description",
          "products",
          "specialty_dish",
          "about_vendor",
          "stall_style",
          "schedule",
          "message",
        ].join(",")
      )
      .order("legacy_id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    const rows = data
      .map((row) => {
        const content = buildContent(row);
        if (!row.id || !content) return null;
        return { id: row.id, content };
      })
      .filter(Boolean);

    if (rows.length === 0) {
      from += pageSize;
      continue;
    }

    const embeddings = await fetchEmbeddings(
      apiKey,
      rows.map((row) => row.content)
    );

    const payload = rows.map((row, index) => ({
      shop_id: row.id,
      content: row.content,
      embedding: embeddings[index],
    }));

    const { error: upsertError } = await supabase
      .from("shop_embeddings")
      .upsert(payload, { onConflict: "shop_id" });

    if (upsertError) {
      throw new Error(`Upsert error: ${upsertError.message}`);
    }

    totalProcessed += payload.length;
    console.log(`Processed ${totalProcessed} shops...`);
    from += pageSize;
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
