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
    row.owner_name ? `owner: ${row.owner_name}` : "",
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
    row.synonyms ? `synonyms: ${row.synonyms}` : "",
  ].filter(Boolean);

  const products = Array.isArray(row.products) ? row.products.join(", ") : "";
  if (products) parts.push(`products: ${products}`);

  return parts.filter(Boolean).join("\n");
}

async function fetchRows(supabase, from, to) {
  const [
    { data: vendorsData, error: vendorsError },
    { data: categoriesData, error: categoriesError },
    { data: productsData, error: productsError },
    { data: locationsData, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, shop_name, owner_name, strength, style, category_id")
      .order("id", { ascending: true })
      .range(from, to),
    supabase.from("categories").select("id, name"),
    supabase.from("products").select("vendor_id, name"),
    supabase
      .from("market_locations")
      .select("id, store_number, latitude, longitude, district"),
  ]);

  if (vendorsError) throw new Error(`Supabase error: ${vendorsError.message}`);
  if (categoriesError) throw new Error(`Supabase error: ${categoriesError.message}`);
  if (productsError) throw new Error(`Supabase error: ${productsError.message}`);
  if (locationsError) throw new Error(`Supabase error: ${locationsError.message}`);

  const { data: marketAssignmentsData, error: marketAssignmentsError } = await supabase
    .from("market_assignments")
    .select("vendor_id, location_id, market_date");

  let assignmentsData = marketAssignmentsData;
  let assignmentsError = marketAssignmentsError;

  if (marketAssignmentsError) {
    const fallback = await supabase
      .from("location_assignments")
      .select("vendor_id, location_id, market_date");
    assignmentsData = fallback.data;
    assignmentsError = fallback.error;
  }

  if (assignmentsError) {
    throw new Error(`Supabase error: ${assignmentsError.message}`);
  }

  const categoryById = new Map(
    (categoriesData ?? [])
      .filter((row) => row && row.id)
      .map((row) => [row.id, row.name ?? ""])
  );

  const productsByVendorId = new Map();
  for (const row of productsData ?? []) {
    if (!row?.vendor_id || !row.name) continue;
    const list = productsByVendorId.get(row.vendor_id) ?? [];
    list.push(row.name);
    productsByVendorId.set(row.vendor_id, list);
  }

  const locationById = new Map(
    (locationsData ?? [])
      .filter((row) => row && row.id)
      .map((row) => [row.id, row])
  );

  const latestAssignmentByVendorId = new Map();
  for (const row of assignmentsData ?? []) {
    if (!row?.vendor_id || !row.location_id) continue;
    const current = latestAssignmentByVendorId.get(row.vendor_id);
    if (!current) {
      latestAssignmentByVendorId.set(row.vendor_id, row);
      continue;
    }
    const currentDate = current.market_date ? new Date(current.market_date) : null;
    const nextDate = row.market_date ? new Date(row.market_date) : null;
    if (!currentDate || (nextDate && nextDate > currentDate)) {
      latestAssignmentByVendorId.set(row.vendor_id, row);
    }
  }

  return (vendorsData ?? [])
    .map((vendor) => {
      const assignment = latestAssignmentByVendorId.get(vendor.id);
      if (!assignment?.location_id) return null;
      const location = locationById.get(assignment.location_id);
      if (!location) return null;

      return {
        id: vendor.id,
        legacy_id: location.store_number,
        name: vendor.shop_name ?? "",
        owner_name: vendor.owner_name ?? "",
        category: categoryById.get(vendor.category_id) ?? "",
        chome: location.district ?? "",
        side: "",
        position: location.store_number ?? "",
        lat: location.latitude ?? null,
        lng: location.longitude ?? null,
        description: "",
        products: productsByVendorId.get(vendor.id) ?? [],
        specialty_dish: "",
        about_vendor: "",
        stall_style: vendor.style ?? "",
        schedule: "",
        message: "",
        synonyms: "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.legacy_id ?? 0) - (b.legacy_id ?? 0));
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
    const data = await fetchRows(supabase, from, from + pageSize - 1);

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
      shop_id: row.legacy_id,
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
    console.log(`Processed ${totalProcessed} vendors...`);
    from += pageSize;
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
