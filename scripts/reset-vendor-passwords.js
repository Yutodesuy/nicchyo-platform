const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const BASE_DIR = process.cwd();
const ENV_PATHS = [
  path.resolve(BASE_DIR, ".env.local"),
  path.resolve(BASE_DIR, ".env"),
];
const PASSWORDS_CSV = path.resolve(BASE_DIR, "initial_passwords.csv");

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

  const perPage = 1000;
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage,
  });

  if (error) {
    throw new Error(`listUsers error: ${error.message}`);
  }

  const users = data?.users || [];
  const targets = users.filter((user) =>
    typeof user.email === "string" &&
    user.email.endsWith("@nicchyo.local") &&
    user.email.startsWith("shop")
  );

  const rows = [];
  let updated = 0;
  let failed = 0;

  for (const user of targets) {
    const email = user.email;
    const shopNumber = email.replace("shop", "").replace("@nicchyo.local", "");
    const password = generatePassword();

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      failed += 1;
      console.error(`Failed to update ${email}:`, updateError.message);
      continue;
    }

    rows.push({ shop_number: shopNumber, email, initial_password: password });
    updated += 1;
  }

  const header = "shop_number,email,initial_password";
  const lines = [header].concat(
    rows.map((row) => `${row.shop_number},${row.email},${row.initial_password}`)
  );
  fs.writeFileSync(PASSWORDS_CSV, lines.join("\n"));

  console.log(`Passwords updated: ${updated}, failed: ${failed}`);
  console.log(`CSV written: ${PASSWORDS_CSV}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
