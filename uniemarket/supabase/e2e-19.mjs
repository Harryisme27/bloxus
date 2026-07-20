#!/usr/bin/env node
// E2E migration 19 — xóa đơn theo trạng thái + ctv_apply_open công khai.
//   SERVICE_KEY=... node supabase/e2e-19.mjs
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

async function makeOrder(tag) {
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").limit(1).maybeSingle();
  const prev = prod.stock;
  if (prev !== null) await admin.from("products").update({ stock: prev + 3 }).eq("id", prod.id);
  const { data } = await buyer.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E19", p_contact_channel: "discord", p_contact_value: tag, p_note: tag,
  });
  if (prev !== null) await admin.from("products").update({ stock: prev }).eq("id", prod.id);
  return (Array.isArray(data) ? data[0] : data).id;
}

// 1) Setting + helper
const { data: setting } = await admin.from("app_settings").select("value").eq("key", "deletable_order_statuses").maybeSingle();
ok(!!setting, "setting deletable_order_statuses tồn tại: " + JSON.stringify(setting?.value));
ok(setting && !setting.value.includes("pending_payment") && !setting.value.includes("in_progress"),
  "mặc định KHÔNG cho xóa pending_payment + in_progress");

// 2) pending_payment -> không xóa được
{
  const id = await makeOrder("pending");
  const { data: n } = await buyer.rpc("admin_delete_orders", { p_ids: [id] });
  ok(n === 0, "đơn 'chờ thanh toán' KHÔNG xóa được (n=" + n + ")");
  const { count } = await admin.from("orders").select("*", { count: "exact", head: true }).eq("id", id);
  ok(count === 1, "đơn vẫn còn nguyên");
  await admin.from("orders").delete().eq("id", id);
}

// 3) in_progress -> không xóa được
{
  const id = await makeOrder("inprog");
  await buyer.rpc("confirm_payment", { p_order_id: id });
  await buyer.rpc("claim_order", { p_order_id: id });
  const { data: n } = await buyer.rpc("admin_delete_orders", { p_ids: [id] });
  ok(n === 0, "đơn 'đang xử lý' KHÔNG xóa được (n=" + n + ")");
  await admin.from("orders").delete().eq("id", id);
}

// 4) paid -> xóa được (nằm trong danh sách cho phép)
{
  const id = await makeOrder("paid");
  await buyer.rpc("confirm_payment", { p_order_id: id });
  const { data: n } = await buyer.rpc("admin_delete_orders", { p_ids: [id] });
  ok(n === 1, "đơn 'đã thanh toán' xóa được (n=" + n + ")");
  const { count } = await admin.from("orders").select("*", { count: "exact", head: true }).eq("id", id);
  ok(count === 0, "đơn đã biến mất");
}

// 5) ctv_apply_open — anon đọc được (whitelist)
{
  await admin.from("app_settings").upsert({ key: "ctv_apply_open", value: true }, { onConflict: "key" });
  const guest = anon();
  const { data } = await guest.from("app_settings").select("value").eq("key", "ctv_apply_open").maybeSingle();
  ok(data?.value === true, "khách (anon) đọc được ctv_apply_open = " + JSON.stringify(data?.value));
  // trả về đóng (mặc định) để không mở tuyển ngoài ý muốn
  await admin.from("app_settings").upsert({ key: "ctv_apply_open", value: false }, { onConflict: "key" });
}

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
