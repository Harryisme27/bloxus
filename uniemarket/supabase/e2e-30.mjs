#!/usr/bin/env node
// E2E migration 30 — nạp tiền lưu method. SERVICE_KEY=... node supabase/e2e-30.mjs
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
const { data: { users } } = await admin.auth.admin.listUsers();
const custEmail = "unie.manager.test@gmail.com";
const custId = users.find((u) => u.email === custEmail)?.id;

const bal = async (id) => (await admin.from("profiles").select("credit_balance").eq("id", id).maybeSingle()).data.credit_balance;

await admin.from("profiles").update({ credit_balance: 0 }).eq("id", custId);
await admin.from("credit_transactions").delete().eq("user_id", custId);
await admin.from("topup_requests").delete().eq("user_id", custId);
const cust = anon(); await cust.auth.signInWithPassword({ email: custEmail, password: "unieManager2026!" });

console.log("— nạp tiền có method —");
{
  const { data: req, error } = await cust.rpc("request_topup", { p_amount: 250000, p_method: "bank_transfer", p_note: "e2e-30" });
  ok(!error && req?.status === "pending", "gửi yêu cầu nạp (pending)" + (error ? " — " + error.message : ""));
  ok(req?.method === "bank_transfer", "lưu đúng method = bank_transfer (thực: " + req?.method + ")");
  ok(Number(req?.amount) === 250000, "lưu đúng số tiền VND = 250000 (thực: " + req?.amount + ")");

  // method mặc định null vẫn hoạt động (tương thích ngược)
  await admin.from("topup_requests").delete().eq("user_id", custId);
  const { data: req2, error: e2 } = await cust.rpc("request_topup", { p_amount: 100000 });
  ok(!e2 && req2?.method === null, "gọi không method -> method = null (tương thích ngược)");

  // admin duyệt -> cộng đúng số dư
  await adminC.rpc("review_topup", { p_id: req2.id, p_approve: true });
  ok((await bal(custId)) === 100000, "admin duyệt -> số dư = 100k");
}

console.log(`\n${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
