const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const ENV_PATHS = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
];
const CSV_PATH = path.resolve(process.cwd(), "initial_passwords.csv");

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

function generatePassword() {
  return crypto.randomBytes(9).toString("base64").slice(0, 12);
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

  let csv = "shop_number,email,initial_password\n";
  let created = 0;
  let authFailed = 0;
  let insertFailed = 0;

  for (let i = 1; i <= 300; i += 1) {
    const shopNumber = String(i).padStart(3, "0");
    const email = `shop${shopNumber}@nicchyo.local`;
    const password = generatePassword();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      authFailed += 1;
      console.error(`Error creating ${shopNumber}:`, error.message);
      continue;
    }

    const userId = data.user.id;

    const { error: insertError } = await supabase.from("vendors").insert({
      id: userId,
      shop_number: i,
      must_change_password: true,
    });

    if (insertError) {
      insertFailed += 1;
      console.error(`Error inserting vendor ${shopNumber}:`, insertError.message);
      continue;
    }

    csv += `${shopNumber},${email},${password}\n`;
    created += 1;
    console.log(`Created shop ${shopNumber}`);
  }

  fs.writeFileSync(CSV_PATH, csv);
  console.log(`CSV saved: ${CSV_PATH}`);
  console.log(
    `Summary: created=${created}, authFailed=${authFailed}, insertFailed=${insertFailed}`
  );

  const { count, error: countError } = await supabase
    .from("vendors")
    .select("shop_number", { count: "exact", head: true })
    .gte("shop_number", 1)
    .lte("shop_number", 300);

  if (countError) {
    console.warn(`Vendor count check failed: ${countError.message}`);
  } else {
    console.log(`Vendors with shop_number 1-300: ${count}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
