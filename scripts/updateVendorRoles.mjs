import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    env[key] = value;
  }
  return env;
}

const env = loadEnv(".env.local");
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const emailRegex = /^shop(\d{3})@nicchyo\.local$/;
const targetSet = new Set(
  Array.from({ length: 300 }, (_, i) => String(i + 1).padStart(3, "0"))
);

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!data?.users?.length) break;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

(async () => {
  const users = await listAllUsers();
  const targets = users.filter((u) => {
    const email = u.email || "";
    const match = email.match(emailRegex);
    if (!match) return false;
    return targetSet.has(match[1]);
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of targets) {
    const current = user.app_metadata ?? {};
    if (current.role === "vendor") {
      skipped += 1;
      continue;
    }
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { ...current, role: "vendor" },
    });
    if (error) {
      failed += 1;
      console.error(`Failed: ${user.email} -> ${error.message}`);
      continue;
    }
    updated += 1;
  }

  console.log(`Matched users: ${targets.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already vendor): ${skipped}`);
  console.log(`Failed: ${failed}`);
})();
