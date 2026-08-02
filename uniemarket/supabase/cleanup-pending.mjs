#!/usr/bin/env node
// Dọn đơn chờ thanh toán: admin hủy từng đơn (tự HOÀN KHO) rồi xóa các đơn đã
// hủy. Chạy:  node supabase/cleanup-pending.mjs
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

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const { error: loginErr } = await sb.auth.signInWithPassword({
  email: "miding471@gmail.com",
  password: "unieAdmin2026!",
});
if (loginErr) { console.error("Đăng nhập admin thất bại:", loginErr.message); process.exit(1); }

const { data: pending, error: listErr } = await sb
  .from("orders").select("id, order_code").eq("status", "pending_payment");
if (listErr) { console.error("Không đọc được đơn:", listErr.message); process.exit(1); }
console.log(`Tìm thấy ${pending.length} đơn chờ thanh toán.`);

const cancelled = [];
for (const o of pending) {
  const { error } = await sb.rpc("cancel_order", {
    p_order_id: o.id, p_reason: "Dọn đơn test (spam checkout).",
  });
  if (error) console.log(`  ❌ ${o.order_code}: ${error.message}`);
  else { cancelled.push(o.id); console.log(`  ✅ hủy ${o.order_code} (đã hoàn kho)`); }
}

if (cancelled.length > 0) {
  const { data: deleted, error: delErr } = await sb.rpc("admin_delete_orders", { p_ids: cancelled });
  if (delErr) console.error("Xóa thất bại:", delErr.message);
  else console.log(`Đã xóa ${deleted} đơn khỏi lịch sử.`);
}
console.log("Xong.");
