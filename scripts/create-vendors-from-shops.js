const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BASE_DIR = process.cwd();
const DATA_DIR = path.resolve(BASE_DIR, "data", "shopsmanage");
const SHOPS_CSV = path.join(DATA_DIR, "shops_rows.csv");
const CATEGORIES_CSV = path.join(DATA_DIR, "categories.csv");
const VENDORS_CSV = path.join(DATA_DIR, "vendors.csv");
const PASSWORDS_CSV = path.resolve(BASE_DIR, "initial_passwords.csv");

const ENV_PATHS = [
  path.resolve(BASE_DIR, ".env.local"),
  path.resolve(BASE_DIR, ".env"),
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
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
  return true;
}

function loadEnv() {
  for (const envPath of ENV_PATHS) {
    if (loadEnvFile(envPath)) return envPath;
  }
  return null;
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

function loadCsvRows(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]);
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

function toBoolString(value) {
  return value ? "true" : "false";
}

function generatePassword() {
  return crypto.randomBytes(9).toString("base64").slice(0, 12);
}

function padShopNumber(value) {
  const num = String(value || "").trim();
  if (!num) return null;
  return num.padStart(3, "0");
}

async function listAllUsers(supabase) {
  const perPage = 1000;
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage,
  });
  if (error) {
    throw new Error(`listUsers error: ${error.message}`);
  }
  return data?.users || [];
}

async function main() {
  const envLoaded = loadEnv();
  if (envLoaded) {
    console.log(`Loaded env from ${envLoaded}`);
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is missing.");
  }
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const categories = loadCsvRows(CATEGORIES_CSV);
  const categoryMap = new Map();
  categories.forEach((row) => {
    const name = (row.name || "").trim();
    if (name) categoryMap.set(name, row.id || "");
  });

  const shops = loadCsvRows(SHOPS_CSV);
  const users = await listAllUsers(supabase);
  const userByEmail = new Map();
  users.forEach((user) => {
    if (user.email) userByEmail.set(user.email, user.id);
  });

  const vendorRows = [];
  const passwordRows = [];
  let createdUsers = 0;
  let existingUsers = 0;
  let vendorUpserts = 0;

  for (const row of shops) {
    const legacyId = (row.legacy_id || "").trim();
    const position = (row.position || "").trim();
    const shopNumber = padShopNumber(legacyId || position);
    if (!shopNumber) {
      console.warn(`Skip row without legacy_id/position: ${row.id || row.name}`);
      continue;
    }

    const email = `shop${shopNumber}@nicchyo.local`;
    let userId = userByEmail.get(email);
    let password = null;

    if (!userId) {
      password = generatePassword();
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) {
        console.error(`Error creating ${shopNumber}:`, error.message);
        continue;
      }
      userId = data.user.id;
      userByEmail.set(email, userId);
      createdUsers += 1;
      passwordRows.push({ shop_number: shopNumber, email, initial_password: password });
    } else {
      existingUsers += 1;
    }

    const categoryName = (row.category || "").trim();
    const categoryId = categoryMap.get(categoryName) || "";

    const vendorRow = {
      id: userId,
      shop_name: (row.name || "").trim(),
      owner_name: (row.owner_name || "").trim(),
      strength: (row.shop_strength || "").trim(),
      style: (row.stall_style || "").trim(),
      category_id: categoryId,
      must_change_password: toBoolString(true),
      created_at: (row.created_at || "").trim(),
      updated_at: (row.updated_at || "").trim(),
      role: "vendor",
    };

    const { error: upsertError } = await supabase
      .from("vendors")
      .upsert(vendorRow, { onConflict: "id" });

    if (upsertError) {
      console.error(`Vendor upsert failed for ${shopNumber}:`, upsertError.message);
      continue;
    }

    vendorRows.push(vendorRow);
    vendorUpserts += 1;
  }

  const vendorFields = [
    "id",
    "shop_name",
    "owner_name",
    "strength",
    "style",
    "category_id",
    "must_change_password",
    "created_at",
    "updated_at",
    "role",
  ];

  const vendorsCsvLines = [vendorFields.join(",")].concat(
    vendorRows.map((row) =>
      vendorFields.map((key) => {
        const value = row[key] ?? "";
        const text = String(value);
        if (text.includes("\"") || text.includes(",") || text.includes("\n")) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      }).join(",")
    )
  );
  fs.writeFileSync(VENDORS_CSV, vendorsCsvLines.join("\n"));

  const passwordFields = ["shop_number", "email", "initial_password"];
  const passwordLines = [passwordFields.join(",")].concat(
    passwordRows.map((row) =>
      passwordFields.map((key) => row[key]).join(",")
    )
  );
  fs.writeFileSync(PASSWORDS_CSV, passwordLines.join("\n"));

  console.log(`Users created: ${createdUsers}, existing: ${existingUsers}`);
  console.log(`Vendors upserted: ${vendorUpserts}`);
  console.log(`CSV written: ${VENDORS_CSV}`);
  console.log(`CSV written: ${PASSWORDS_CSV}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
