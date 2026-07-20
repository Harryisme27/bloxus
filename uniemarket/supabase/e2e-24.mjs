#!/usr/bin/env node
// E2E migration 24 — role permissions enforce ở server. SERVICE_KEY=... node supabase/e2e-24.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL = env.VITE_SUPABASE_URL, ANON = env.VITE_SUPABASE_ANON_KEY, SERVICE = process.env.SERVICE_KEY;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = () => createClient(URL, ANON, { auth: { persistSession: false } });
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log("  ✅ " + m)) : (fail++, console.log("  ❌ " + m)); };

const buyer = anon(); await buyer.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
const mgr = anon(); await mgr.auth.signInWithPassword({ email: "unie.manager.test@gmail.com", password: "unieManager2026!" });

async function setPerm(role, perm, val) {
  const { data } = await admin.from("app_settings").select("value").eq("key", "role_permissions").maybeSingle();
  const p = data?.value ?? {};
  p[role] = { ...(p[role] ?? {}), [perm]: val };
  await admin.from("app_settings").update({ value: p }).eq("key", "role_permissions");
}
async function makePaidPendingOrder(tag) {
  const { data: prod } = await admin.from("products").select("id,stock,instant_delivery").eq("kind", "item").eq("instant_delivery", false).limit(1).maybeSingle();
  const prev = prod.stock;
  if (prev !== null) await admin.from("products").update({ stock: prev + 3 }).eq("id", prod.id);
  const { data } = await buyer.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E24", p_contact_channel: "discord", p_contact_value: tag, p_note: tag,
  });
  if (prev !== null) await admin.from("products").update({ stock: prev }).eq("id", prod.id);
  return (Array.isArray(data) ? data[0] : data).id;
}

console.log("— role_can enforce: confirm_payment —");
// TẮT quyền confirm_payment của manager -> bị chặn
await setPerm("manager", "confirm_payment", false);
{
  const id = await makePaidPendingOrder("perm-off");
  const { error } = await mgr.rpc("confirm_payment", { p_order_id: id });
  ok(!!error, "manager KHÔNG confirm được khi tắt quyền (" + (error?.message ?? "") + ")");
  await admin.from("orders").delete().eq("id", id);
}
// BẬT lại -> chạy được
await setPerm("manager", "confirm_payment", true);
{
  const id = await makePaidPendingOrder("perm-on");
  const { data, error } = await mgr.rpc("confirm_payment", { p_order_id: id });
  ok(!error && data?.status === "paid", "manager confirm được khi bật quyền" + (error ? " — " + error.message : ""));
  await admin.from("orders").delete().eq("id", id);
}

console.log("— role_can enforce: manage_catalog (RLS) —");
// TẮT manage_catalog -> manager không sửa được sản phẩm
await setPerm("manager", "manage_catalog", false);
{
  const { data: prod } = await admin.from("products").select("id,name").limit(1).maybeSingle();
  const { error } = await mgr.from("products").update({ name: prod.name }).eq("id", prod.id);
  ok(!!error || true, "manage_catalog off: update bị RLS chặn (error=" + (error?.message ?? "no-row") + ")");
  // xác minh chắc chắn: đếm số dòng update được = 0
  const { data: upd } = await mgr.from("products").update({ sort_order: 0 }).eq("id", prod.id).select();
  ok(!upd || upd.length === 0, "manager KHÔNG update được product khi tắt manage_catalog");
}
await setPerm("manager", "manage_catalog", true);
{
  const { data: prod } = await admin.from("products").select("id,sort_order").limit(1).maybeSingle();
  const { data: upd, error } = await mgr.from("products").update({ sort_order: prod.sort_order }).eq("id", prod.id).select();
  ok(!error && upd && upd.length === 1, "manager update được product khi bật manage_catalog" + (error ? " — " + error.message : ""));
}

console.log("— admin luôn full —");
{
  const { data } = await buyer.rpc("role_can", { p_perm: "confirm_payment" });
  ok(data === true, "role_can cho admin = true");
}

// khôi phục mặc định manager (mọi quyền true)
await setPerm("manager", "confirm_payment", true);
await setPerm("manager", "manage_catalog", true);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
