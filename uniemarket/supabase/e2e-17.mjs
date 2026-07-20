#!/usr/bin/env node
// E2E migration 17 — admin xóa đơn. An toàn: tự tạo đơn test rồi xóa, KHÔNG gọi
// admin_delete_all_orders (sẽ xóa sạch). SERVICE_KEY=... node supabase/e2e-17.mjs
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

async function makeOrders(n) {
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").limit(1).maybeSingle();
  const prev = prod.stock;
  if (prev !== null) await admin.from("products").update({ stock: prev + n + 2 }).eq("id", prod.id);
  const ids = [];
  for (let i = 0; i < n; i++) {
    const { data } = await buyer.rpc("place_order", {
      p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
      p_game_username: "E2E17", p_contact_channel: "discord", p_contact_value: "del" + i, p_note: "e2e17",
    });
    ids.push((Array.isArray(data) ? data[0] : data).id);
  }
  if (prev !== null) await admin.from("products").update({ stock: prev }).eq("id", prod.id);
  return ids;
}

// 1) Xóa 1 đơn — cascade order_items/order_events
console.log("— xóa 1 đơn (cascade) —");
{
  const [id] = await makeOrders(1);
  await admin.from("proofs").insert({ order_id: id, game_name: "G", item_name: "I", buyer_masked: "x" });
  const { data: n, error } = await buyer.rpc("admin_delete_orders", { p_ids: [id] });
  ok(!error && n === 1, "admin_delete_orders xóa 1 đơn (n=" + n + ")" + (error ? " — " + error.message : ""));
  const { count: oc } = await admin.from("orders").select("*", { count: "exact", head: true }).eq("id", id);
  ok(oc === 0, "đơn đã biến mất khỏi bảng orders");
  const { count: ic } = await admin.from("order_items").select("*", { count: "exact", head: true }).eq("order_id", id);
  ok(ic === 0, "order_items cascade theo (=0)");
  const { data: pf } = await admin.from("proofs").select("order_id").eq("order_id", id);
  ok((pf ?? []).length === 0, "proofs.order_id đã được gỡ (không chặn xóa)");
}

// 2) Xóa nhiều đơn cùng lúc
console.log("— xóa nhiều đơn —");
{
  const ids = await makeOrders(3);
  const { data: n, error } = await buyer.rpc("admin_delete_orders", { p_ids: ids });
  ok(!error && n === 3, "xóa 3 đơn cùng lúc (n=" + n + ")" + (error ? " — " + error.message : ""));
  const { count } = await admin.from("orders").select("*", { count: "exact", head: true }).in("id", ids);
  ok(count === 0, "cả 3 đơn đã biến mất");
}

// 3) Manager KHÔNG được xóa
console.log("— phân quyền —");
{
  const ids = await makeOrders(1);
  const { error } = await mgr.rpc("admin_delete_orders", { p_ids: ids });
  ok(!!error, "manager bị chặn xóa đơn (" + (error?.message ?? "") + ")");
  const { error: eAll } = await mgr.rpc("admin_delete_all_orders");
  ok(!!eAll, "manager bị chặn xóa TẤT CẢ");
  // dọn đơn test bằng admin
  await admin.from("orders").delete().in("id", ids);
}

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
