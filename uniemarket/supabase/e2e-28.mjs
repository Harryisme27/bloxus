#!/usr/bin/env node
// E2E migration 28 — rút đa phương thức + phí riêng. SERVICE_KEY=... node supabase/e2e-28.mjs
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

const seller = anon(); await seller.auth.signInWithPassword({ email: "unie.ctv.test@gmail.com", password: "unieCTV2026!" });
const { data: { users } } = await admin.auth.admin.listUsers();
const sellerId = users.find((u) => u.email === "unie.ctv.test@gmail.com")?.id;
const bal = async () => (await admin.from("profiles").select("credit_balance").eq("id", sellerId).maybeSingle()).data.credit_balance;

// cấu hình payout_methods: crypto 6% + 10k, min 100k; skrill tắt
await admin.from("app_settings").upsert({ key: "payout_methods", value: {
  bank_transfer: { enabled: true, percent: 0, flat: 0, min: 0 },
  crypto: { enabled: true, percent: 6, flat: 10000, min: 100000 },
  skrill: { enabled: false, percent: 5, flat: 1000, min: 30000 },
} }, { onConflict: "key" });
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);
await admin.from("credit_transactions").delete().eq("user_id", sellerId);
await admin.from("profiles").update({ credit_balance: 2000000, payout_info: {} }).eq("id", sellerId);

// 1) rút crypto: phí = 6% + 10k
console.log("— rút crypto (6% + 10k) —");
{
  const { data: req, error } = await seller.rpc("request_withdrawal", { p_amount: 500000, p_method: "crypto", p_destination: "USDT TRC20: TXyz" });
  ok(!error && req, "gửi yêu cầu rút crypto" + (error ? " — " + error.message : ""));
  const expectedFee = Math.floor(500000 * 6 / 100) + 10000; // 40000
  ok(req.fee === expectedFee && req.net === 500000 - expectedFee, `phí = ${req.fee} (mong đợi ${expectedFee}), net ${req.net}`);
  ok(req.method === "crypto" && req.destination === "USDT TRC20: TXyz", "lưu method + destination");
  ok((await bal()) === 1500000, "tiền bị giữ (2M - 500k)");
  await admin.rpc; // no-op
  // duyệt để dọn pending
  await (anon().auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" }).then(() => {}));
}

// 2) method tắt -> chặn
console.log("— method tắt / dưới min —");
{
  // cần dọn pending trước (đang có 1 pending). Duyệt bằng admin.
  const adminC = anon(); await adminC.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
  const { data: pend } = await admin.from("withdrawal_requests").select("id").eq("user_id", sellerId).eq("status", "pending").maybeSingle();
  if (pend) await adminC.rpc("review_withdrawal", { p_id: pend.id, p_approve: true });

  const { error: eOff } = await seller.rpc("request_withdrawal", { p_amount: 200000, p_method: "skrill", p_destination: "x@y.com" });
  ok(!!eOff, "method tắt (skrill) -> chặn (" + (eOff?.message ?? "") + ")");
  const { error: eMin } = await seller.rpc("request_withdrawal", { p_amount: 50000, p_method: "crypto", p_destination: "x" });
  ok(!!eMin, "dưới min 100k -> chặn (" + (eMin?.message ?? "") + ")");
}

// 3) rút bank (0 phí)
console.log("— rút bank (0 phí) —");
{
  const before = await bal();
  const { data: req, error } = await seller.rpc("request_withdrawal", { p_amount: 100000, p_method: "bank_transfer", p_destination: "0123 - VCB" });
  ok(!error && req?.fee === 0 && req?.net === 100000, "bank: phí 0, net 100k" + (error ? " — " + error.message : ""));
  ok((await bal()) === before - 100000, "trừ đúng 100k");
}

// dọn
const adminC = anon(); await adminC.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
const { data: pend2 } = await admin.from("withdrawal_requests").select("id").eq("user_id", sellerId).eq("status", "pending");
for (const p of pend2 ?? []) await adminC.rpc("review_withdrawal", { p_id: p.id, p_approve: true });
await admin.from("profiles").update({ credit_balance: 0, payout_info: {} }).eq("id", sellerId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);
await admin.from("credit_transactions").delete().eq("user_id", sellerId);
await admin.from("app_settings").upsert({ key: "payout_methods", value: {
  bank_transfer: { enabled: true, percent: 0, flat: 0, min: 0 },
  ewallet: { enabled: true, percent: 0, flat: 0, min: 0 },
} }, { onConflict: "key" });

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
