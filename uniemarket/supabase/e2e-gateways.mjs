#!/usr/bin/env node
/**
 * E2E — migration 10 (payment gateways).
 * Kiểm chứng: cột orders.payment_gateway, setting payment_gateways, và
 * place_order(..., p_gateway) lưu đúng cổng đã chọn.
 *
 *   SERVICE_KEY=sb_secret_... node supabase/e2e-gateways.mjs
 */
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
const URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SERVICE_KEY;
if (!URL || !ANON || !SERVICE) { console.error("Missing URL/ANON/SERVICE_KEY"); process.exit(1); }

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log("  ✅ " + m)) : (fail++, console.log("  ❌ " + m)); };

// 1) Cột payment_gateway tồn tại + setting payment_gateways
const { data: setting } = await admin.from("app_settings").select("value").eq("key", "payment_gateways").maybeSingle();
ok(!!setting, "setting payment_gateways tồn tại");
const gws = setting?.value ?? {};
ok(gws.bank_transfer?.enabled === true, "bank_transfer bật mặc định");
ok("stripe" in gws && "crypto" in gws && "paypal" in gws, "có stripe/crypto/paypal trong setting");

// 2) Đăng nhập user thật (admin) qua anon để có auth.uid()
const user = createClient(URL, ANON, { auth: { persistSession: false } });
const { error: sErr } = await user.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
ok(!sErr, "đăng nhập user để đặt đơn" + (sErr ? " — " + sErr.message : ""));

// 3) Lấy 1 product để đặt — nạp tạm kho để test đặt 2 đơn
const { data: prod } = await admin.from("products").select("id,name,category_id,stock").eq("kind", "item").limit(1).maybeSingle();
ok(!!prod, "có product để test: " + (prod?.name ?? "—"));
const prevStock = prod?.stock ?? null;
if (prod && prevStock !== null) await admin.from("products").update({ stock: prevStock + 5 }).eq("id", prod.id);

// 4) place_order với p_gateway = 'stripe'
let orderId = null;
if (prod) {
  const { data: orders, error: pErr } = await user.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }],
    p_payment_method: "bank_transfer",
    p_game_username: "E2E_Tester",
    p_contact_channel: "discord",
    p_contact_value: "e2e#0001",
    p_note: "e2e gateway test",
    p_gateway: "stripe",
  });
  ok(!pErr, "place_order chấp nhận p_gateway" + (pErr ? " — " + pErr.message : ""));
  const o = Array.isArray(orders) ? orders[0] : orders;
  orderId = o?.id;
  ok(o?.payment_gateway === "stripe", `orders.payment_gateway = 'stripe' (got: ${o?.payment_gateway})`);
  ok(o?.payment_method === "bank_transfer", "payment_method vẫn = bank_transfer (enum an toàn)");
}

// 5) place_order KHÔNG có p_gateway -> fallback = payment_method
if (prod) {
  const { data: orders2, error: p2 } = await user.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }],
    p_payment_method: "momo",
    p_game_username: "E2E_Tester",
    p_contact_channel: "discord",
    p_contact_value: "e2e#0002",
    p_note: "e2e fallback",
  });
  ok(!p2, "place_order chạy được khi bỏ trống p_gateway" + (p2 ? " — " + p2.message : ""));
  const o2 = Array.isArray(orders2) ? orders2[0] : orders2;
  ok(o2?.payment_gateway === "momo", `fallback payment_gateway = payment_method ('momo', got: ${o2?.payment_gateway})`);
  // dọn đơn phụ
  if (o2?.id) await admin.from("orders").delete().eq("id", o2.id);
}

// dọn đơn test chính + khôi phục kho
if (orderId) await admin.from("orders").delete().eq("id", orderId);
if (prod && prevStock !== null) await admin.from("products").update({ stock: prevStock }).eq("id", prod.id);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
