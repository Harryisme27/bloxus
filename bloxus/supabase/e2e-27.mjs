#!/usr/bin/env node
// E2E migration 27 — ví đầy đủ: nạp/rút/hoa hồng. SERVICE_KEY=... node supabase/e2e-27.mjs
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
const buyer = anon(); await buyer.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
const { data: { users } } = await admin.auth.admin.listUsers();
const sellerId = users.find((u) => u.email === "unie.ctv.test@gmail.com")?.id;
const custEmail = "unie.manager.test@gmail.com";
const custId = users.find((u) => u.email === custEmail)?.id;

const bal = async (id) => (await admin.from("profiles").select("credit_balance").eq("id", id).maybeSingle()).data.credit_balance;
const setPct = async (key, v) => admin.from("app_settings").upsert({ key, value: v }, { onConflict: "key" });

await admin.from("profiles").update({ credit_balance: 0 }).in("id", [sellerId, custId]);
await admin.from("credit_transactions").delete().in("user_id", [sellerId, custId]);
await admin.from("topup_requests").delete().eq("user_id", custId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);
const cust = anon(); await cust.auth.signInWithPassword({ email: custEmail, password: "unieManager2026!" });

// 1) NẠP: yêu cầu -> duyệt -> cộng tiền
console.log("— nạp tiền (request -> approve) —");
{
  const { data: req, error } = await cust.rpc("request_topup", { p_amount: 300000, p_note: "e2e" });
  ok(!error && req?.status === "pending", "khách gửi yêu cầu nạp (pending)" + (error ? " — " + error.message : ""));
  const { error: eDup } = await cust.rpc("request_topup", { p_amount: 100000 });
  ok(!!eDup, "chặn yêu cầu nạp trùng khi đang chờ");
  const { error: eSelf } = await cust.rpc("review_topup", { p_id: req.id, p_approve: true });
  ok(!!eSelf, "non-admin KHÔNG duyệt được");
  await adminC.rpc("review_topup", { p_id: req.id, p_approve: true });
  ok((await bal(custId)) === 300000, "admin duyệt -> số dư = 300k");
}

// 2) RÚT: giữ tiền -> duyệt; phí theo %
console.log("— rút tiền (fee %) —");
{
  await setPct("withdrawal_commission_pct", 10);
  await admin.from("profiles").update({ credit_balance: 1000000 }).eq("id", sellerId);
  const { data: req, error } = await seller.rpc("request_withdrawal", { p_amount: 500000, p_note: "e2e" });
  ok(!error && req?.status === "pending", "seller gửi yêu cầu rút" + (error ? " — " + error.message : ""));
  ok(req.fee === 50000 && req.net === 450000, "phí 10% = 50k, thực nhận 450k");
  ok((await bal(sellerId)) === 500000, "tiền bị GIỮ ngay khi yêu cầu (1M - 500k = 500k)");
  await adminC.rpc("review_withdrawal", { p_id: req.id, p_approve: true });
  ok((await bal(sellerId)) === 500000, "duyệt -> số dư không đổi (tiền đã giữ)");
}
// 2b) rút bị từ chối -> hoàn
{
  const { data: req } = await seller.rpc("request_withdrawal", { p_amount: 200000 });
  ok((await bal(sellerId)) === 300000, "giữ tiếp 200k (500k - 200k)");
  await adminC.rpc("review_withdrawal", { p_id: req.id, p_approve: false });
  ok((await bal(sellerId)) === 500000, "từ chối -> HOÀN 200k về (300k + 200k = 500k)");
}

// 3) HOA HỒNG ĐƠN: seller hoàn tất đơn -> nhận total - commission
console.log("— hoa hồng đơn cho seller —");
{
  await setPct("order_commission_pct", 15);
  const before = await bal(sellerId);
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").eq("instant_delivery", false).limit(1).maybeSingle();
  const prev = prod.stock;
  if (prev !== null) await admin.from("products").update({ stock: prev + 2 }).eq("id", prod.id);
  const { data: os } = await buyer.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E27", p_contact_channel: "discord", p_contact_value: "comm", p_note: "comm",
  });
  const order = Array.isArray(os) ? os[0] : os;
  await buyer.rpc("confirm_payment", { p_order_id: order.id });
  // gán seller + hoàn tất (admin đặt trạng thái completed qua update trực tiếp service role)
  await admin.from("orders").update({ assigned_ctv: sellerId, status: "in_progress" }).eq("id", order.id);
  await admin.from("orders").update({ status: "completed" }).eq("id", order.id);
  const expected = order.total - Math.floor(order.total * 15 / 100);
  const after = await bal(sellerId);
  ok(after === before + expected, `seller nhận ${after - before} = total ${order.total} - 15% (mong đợi ${expected})`);
  const { data: tx } = await admin.from("credit_transactions").select("*").eq("order_id", order.id).eq("type", "earning");
  ok((tx ?? []).length === 1, "có giao dịch earning cho seller");
  // xóa lại không được (đơn completed) -> xóa trực tiếp service
  await admin.from("orders").delete().eq("id", order.id);
  if (prev !== null) await admin.from("products").update({ stock: prev }).eq("id", prod.id);
}

// dọn
await setPct("order_commission_pct", 0);
await setPct("withdrawal_commission_pct", 0);
await admin.from("profiles").update({ credit_balance: 0 }).in("id", [sellerId, custId]);
await admin.from("credit_transactions").delete().in("user_id", [sellerId, custId]);
await admin.from("topup_requests").delete().eq("user_id", custId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
