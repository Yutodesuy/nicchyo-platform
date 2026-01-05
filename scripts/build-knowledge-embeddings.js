const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const CSV_PATH = path.resolve(process.cwd(), "data", "knowledge.csv");

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

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
}

function loadKnowledgeRows() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found: ${CSV_PATH}`);
  }
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const header = parseCsvLine(lines[0] || "");
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((key, index) => {
      row[key] = cols[index] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function buildContent(row) {
  const parts = [
    row.title,
    row.category,
    row.content,
  ].filter(Boolean);
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

  const rows = loadKnowledgeRows()
    .map((row) => {
      const content = buildContent(row);
      if (!row.id || !content) return null;
      return {
        id: row.id,
        category: row.category,
        title: row.title,
        content: row.content,
        image_url: row.image_url || null,
        embedding_text: content,
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    console.log("No knowledge rows found.");
    return;
  }

  const embeddings = await fetchEmbeddings(
    apiKey,
    rows.map((row) => row.embedding_text)
  );

  const payload = rows.map((row, index) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    image_url: row.image_url,
    embedding: embeddings[index],
  }));

  const { error: upsertError } = await supabase
    .from("knowledge_embeddings")
    .upsert(payload, { onConflict: "id" });

  if (upsertError) {
    throw new Error(`Upsert error: ${upsertError.message}`);
  }

  console.log(`Processed ${payload.length} knowledge rows.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
