#!/usr/bin/env node
// E2E migration 33 — hủy nạp/rút, giới hạn min-max, mark_payment_sent.
// SERVICE_KEY=... node supabase/e2e-33.mjs
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

const adminC = anon(); await adminC.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
const seller = anon(); await seller.auth.signInWithPassword({ email: "unie.ctv.test@gmail.com", password: "unieCTV2026!" });
const cust = anon(); await cust.auth.signInWithPassword({ email: "unie.manager.test@gmail.com", password: "unieManager2026!" });

const { data: { users } } = await admin.auth.admin.listUsers();
const sellerId = users.find((u) => u.email === "unie.ctv.test@gmail.com")?.id;
const custId = users.find((u) => u.email === "unie.manager.test@gmail.com")?.id;
const bal = async (id) => (await admin.from("profiles").select("credit_balance").eq("id", id).maybeSingle()).data.credit_balance;
const setV = async (key, v) => admin.from("app_settings").upsert({ key, value: v }, { onConflict: "key" });

// reset
await admin.from("profiles").update({ credit_balance: 0 }).in("id", [sellerId, custId]);
await admin.from("credit_transactions").delete().in("user_id", [sellerId, custId]);
await admin.from("topup_requests").delete().eq("user_id", custId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);
await setV("withdrawal_commission_pct", 0);

// ============ 1: GIỚI HẠN NẠP ============
console.log("— giới hạn nạp min/max —");
{
  await setV("topup_min", 50000);
  await setV("topup_max", 5000000);
  const { error: eLow } = await cust.rpc("request_topup", { p_amount: 10000 });
  ok(!!eLow && /tối thiểu/.test(eLow.message), "chặn nạp dưới min (" + (eLow?.message ?? "?") + ")");
  const { error: eHigh } = await cust.rpc("request_topup", { p_amount: 10000000 });
  ok(!!eHigh && /tối đa/.test(eHigh.message), "chặn nạp trên max");
  const { data: r, error: eOk } = await cust.rpc("request_topup", { p_amount: 100000, p_method: "bank_transfer" });
  ok(!eOk && r?.status === "pending", "nạp trong khoảng -> OK" + (eOk ? " — " + eOk.message : ""));
}

// ============ 2: HỦY YÊU CẦU NẠP ============
console.log("— tự hủy yêu cầu nạp —");
{
  const { error } = await cust.rpc("cancel_topup_request");
  ok(!error, "hủy yêu cầu nạp pending" + (error ? " — " + error.message : ""));
  const { data: reqs } = await admin.from("topup_requests").select("*").eq("user_id", custId).eq("status", "cancelled");
  ok((reqs ?? []).length === 1, "trạng thái -> cancelled");
  const { error: e2 } = await cust.rpc("cancel_topup_request");
  ok(!!e2, "không còn pending -> hủy lần 2 báo lỗi");
  // sau khi hủy có thể tạo yêu cầu mới
  const { data: r2, error: e3 } = await cust.rpc("request_topup", { p_amount: 100000 });
  ok(!e3 && r2?.status === "pending", "tạo lại yêu cầu mới sau khi hủy -> OK");
  await admin.from("topup_requests").delete().eq("user_id", custId);
}

// ============ 3: HỦY YÊU CẦU RÚT -> HOÀN TIỀN ============
console.log("— tự hủy yêu cầu rút (hoàn tiền giữ) —");
{
  await setV("withdraw_min", 0);
  await setV("withdraw_max", 0);
  await admin.from("profiles").update({ credit_balance: 500000 }).eq("id", sellerId);
  const { data: wr, error } = await seller.rpc("request_withdrawal", { p_amount: 200000, p_method: "bank_transfer" });
  ok(!error && wr?.status === "pending", "seller gửi yêu cầu rút" + (error ? " — " + error.message : ""));
  ok((await bal(sellerId)) === 300000, "tiền bị giữ (500k -> 300k)");
  const { error: eC } = await seller.rpc("cancel_withdrawal_request");
  ok(!eC, "tự hủy yêu cầu rút" + (eC ? " — " + eC.message : ""));
  ok((await bal(sellerId)) === 500000, "tiền giữ HOÀN về ví (300k -> 500k)");
  const { data: wreqs } = await admin.from("withdrawal_requests").select("*").eq("user_id", sellerId).eq("status", "cancelled");
  ok((wreqs ?? []).length === 1, "trạng thái rút -> cancelled");
}

// ============ 4: GIỚI HẠN RÚT ============
console.log("— giới hạn rút min —");
{
  await setV("withdraw_min", 100000);
  const { error } = await seller.rpc("request_withdrawal", { p_amount: 50000 });
  ok(!!error && /tối thiểu/.test(error.message), "chặn rút dưới min");
  await setV("withdraw_min", 0);
}

// ============ 5: MARK PAYMENT SENT ============
console.log("— khách báo đã chuyển khoản —");
{
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").eq("instant_delivery", false).limit(1).maybeSingle();
  const prevStock = prod.stock;
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock + 2 }).eq("id", prod.id);
  const { data: os } = await cust.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E33", p_contact_channel: "discord", p_contact_value: "ps", p_note: "ps",
  });
  const order = Array.isArray(os) ? os[0] : os;

  // người khác không báo được
  const { error: eOther } = await seller.rpc("mark_payment_sent", { p_order_id: order.id });
  ok(!!eOther, "người khác KHÔNG báo được đơn của khách");

  const { data: marked, error } = await cust.rpc("mark_payment_sent", { p_order_id: order.id });
  const mo = Array.isArray(marked) ? marked[0] : marked;
  ok(!error && mo?.payment_sent_at != null, "khách báo đã CK -> payment_sent_at set" + (error ? " — " + error.message : ""));
  const { error: eDup } = await cust.rpc("mark_payment_sent", { p_order_id: order.id });
  ok(!!eDup, "báo lần 2 bị chặn");

  // admin có notification
  const { data: notif } = await admin.from("notifications").select("*").like("title", "%" + order.order_code + "%").eq("type", "order_paid");
  ok((notif ?? []).length >= 1, "admin nhận thông báo 'khách báo đã CK'");

  await admin.from("orders").delete().eq("id", order.id);
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock }).eq("id", prod.id);
}

// dọn
await setV("topup_min", 0);
await setV("topup_max", 0);
await admin.from("profiles").update({ credit_balance: 0 }).in("id", [sellerId, custId]);
await admin.from("credit_transactions").delete().in("user_id", [sellerId, custId]);
await admin.from("topup_requests").delete().eq("user_id", custId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
