#!/usr/bin/env node
// E2E migration 25+26 — ví/credit. Khách = tài khoản manager (non-admin).
// SERVICE_KEY=... node supabase/e2e-25.mjs
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
// "khách" = manager account (non-admin nên trigger guard áp dụng như khách thường)
const cust = anon(); await cust.auth.signInWithPassword({ email: "unie.manager.test@gmail.com", password: "unieManager2026!" });
const custEmail = "unie.manager.test@gmail.com";
const { data: { users } } = await admin.auth.admin.listUsers();
const custId = users.find((u) => u.email === custEmail)?.id;

await admin.from("credit_transactions").delete().eq("user_id", custId);
await admin.from("profiles").update({ credit_balance: 0 }).eq("id", custId);

// 1) admin nạp
console.log("— admin nạp số dư —");
{
  const { data: bal, error } = await adminC.rpc("admin_adjust_credit", { p_email: custEmail, p_amount: 500000, p_note: "e2e topup" });
  ok(!error && bal === 500000, "admin nạp 500k -> " + bal + (error ? " — " + error.message : ""));
  const { data: tx } = await admin.from("credit_transactions").select("*").eq("user_id", custId).order("created_at", { ascending: false }).limit(1);
  ok(tx?.[0]?.type === "topup" && tx[0].amount === 500000, "giao dịch topup +500k");
}

// 2) manager (khách) KHÔNG nạp cho người khác
{
  const { error } = await cust.rpc("admin_adjust_credit", { p_email: custEmail, p_amount: 100000 });
  ok(!!error, "non-admin bị chặn admin_adjust_credit (" + (error?.message ?? "") + ")");
}

// 3) khách KHÔNG tự sửa số dư (trigger guard)
console.log("— guard tự sửa số dư —");
{
  const { error } = await cust.from("profiles").update({ credit_balance: 9999999 }).eq("id", custId);
  const { data: prof } = await admin.from("profiles").select("credit_balance").eq("id", custId).maybeSingle();
  ok(prof.credit_balance === 500000, "khách KHÔNG tự sửa được số dư (vẫn 500k)" + (error ? " [update err: " + error.message + "]" : ""));
}

// 4) trả đơn bằng số dư (nạp đủ trước)
console.log("— thanh toán đơn bằng số dư —");
{
  await admin.from("profiles").update({ credit_balance: 5000000 }).eq("id", custId);
  const start = 5000000;
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").eq("instant_delivery", false).limit(1).maybeSingle();
  const prev = prod.stock;
  if (prev !== null) await admin.from("products").update({ stock: prev + 2 }).eq("id", prod.id);
  const { data: os } = await cust.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E25", p_contact_channel: "discord", p_contact_value: "credit", p_note: "credit",
  });
  const order = Array.isArray(os) ? os[0] : os;
  const { data: paid, error } = await cust.rpc("pay_order_with_credit", { p_order_id: order.id });
  ok(!error && paid?.status === "paid", "trả đơn bằng số dư -> paid" + (error ? " — " + error.message : ""));
  const { data: prof } = await admin.from("profiles").select("credit_balance").eq("id", custId).maybeSingle();
  ok(prof.credit_balance === start - order.total, "số dư trừ đúng: " + prof.credit_balance + " (= " + start + " - " + order.total + ")");
  const { data: tx } = await admin.from("credit_transactions").select("*").eq("order_id", order.id);
  ok(tx?.[0]?.type === "spend" && tx[0].amount === -order.total, "giao dịch spend đúng số");
  await admin.from("orders").delete().eq("id", order.id);
  if (prev !== null) await admin.from("products").update({ stock: prev }).eq("id", prod.id);
}

// 5) số dư không đủ -> chặn + rollback
console.log("— số dư không đủ —");
{
  await admin.from("profiles").update({ credit_balance: 1000 }).eq("id", custId);
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").limit(1).maybeSingle();
  const prev = prod.stock;
  if (prev !== null) await admin.from("products").update({ stock: prev + 2 }).eq("id", prod.id);
  const { data: os } = await cust.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E25b", p_contact_channel: "discord", p_contact_value: "low", p_note: "low",
  });
  const order = Array.isArray(os) ? os[0] : os;
  const { error } = await cust.rpc("pay_order_with_credit", { p_order_id: order.id });
  ok(!!error, "số dư không đủ -> bị chặn");
  const { data: prof } = await admin.from("profiles").select("credit_balance").eq("id", custId).maybeSingle();
  ok(prof.credit_balance === 1000, "rollback: số dư KHÔNG bị trừ (vẫn 1000)");
  await admin.from("orders").delete().eq("id", order.id);
  if (prev !== null) await admin.from("products").update({ stock: prev }).eq("id", prod.id);
}

await admin.from("profiles").update({ credit_balance: 0 }).eq("id", custId);
await admin.from("credit_transactions").delete().eq("user_id", custId);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
