#!/usr/bin/env node
// E2E 31+32 — refund về ví + thu hồi hoa hồng + mã/tên user. SERVICE_KEY=... node supabase/e2e-31-32.mjs
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
const setPct = async (key, v) => admin.from("app_settings").upsert({ key, value: v }, { onConflict: "key" });

// reset
await admin.from("profiles").update({ credit_balance: 0 }).in("id", [sellerId, custId]);
await admin.from("credit_transactions").delete().in("user_id", [sellerId, custId]);
await admin.from("topup_requests").delete().eq("user_id", custId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);

// ============ 31: REFUND VỀ VÍ ============
// request_refund chỉ cho paid/in_progress (mig 08) -> test luồng in_progress.
console.log("— refund đơn -> ví khách —");
await setPct("order_commission_pct", 15);
{
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").eq("instant_delivery", false).limit(1).maybeSingle();
  const prevStock = prod.stock;
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock + 2 }).eq("id", prod.id);

  const { data: os } = await cust.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E31", p_contact_channel: "discord", p_contact_value: "rf", p_note: "refund",
  });
  const order = Array.isArray(os) ? os[0] : os;
  await cust.rpc("confirm_payment", { p_order_id: order.id });                 // -> paid
  await admin.from("orders").update({ assigned_ctv: sellerId, status: "in_progress" }).eq("id", order.id);

  const custBefore = await bal(custId);
  ok((await bal(sellerId)) === 0, "seller chưa được ghi hoa hồng (đơn chưa completed)");

  // khách yêu cầu hoàn -> admin duyệt
  const { error: eReq } = await cust.rpc("request_refund", { p_order_id: order.id, p_reason: "e2e refund" });
  ok(!eReq, "khách gửi yêu cầu hoàn tiền" + (eReq ? " — " + eReq.message : ""));
  const { data: refunded, error: eRes } = await adminC.rpc("resolve_refund", { p_order_id: order.id, p_approve: true });
  const ro = Array.isArray(refunded) ? refunded[0] : refunded;
  ok(!eRes && ro?.status === "refunded", "admin duyệt -> đơn refunded" + (eRes ? " — " + eRes.message : ""));

  ok((await bal(custId)) === custBefore + order.total, `ví khách +${order.total} (đủ tiền đơn)`);

  const { data: ctxCust } = await admin.from("credit_transactions").select("*").eq("order_id", order.id).eq("user_id", custId).eq("type", "refund");
  ok((ctxCust ?? []).length === 1 && Number(ctxCust[0].amount) === order.total, "sổ ví khách có dòng refund +total");

  // hoàn 2 lần không cộng thêm
  const before2 = await bal(custId);
  const { error: eDup } = await adminC.rpc("resolve_refund", { p_order_id: order.id, p_approve: true });
  ok(!!eDup || (await bal(custId)) === before2, "không hoàn tiền lần 2");

  await admin.from("orders").delete().eq("id", order.id);
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock }).eq("id", prod.id);
}

// ============ 32: MÃ + TÊN USER ============
console.log("— mã + tên user trên yêu cầu —");
{
  const { data: tr } = await cust.rpc("request_topup", { p_amount: 120000, p_method: "bank_transfer" });
  ok(/^TP-[0-9A-F]{6}$/.test(tr?.code || ""), "topup có mã TP-xxxxxx (" + tr?.code + ")");

  const { data: list } = await adminC.rpc("list_topup_requests");
  const row = (list ?? []).find((x) => x.id === tr.id);
  ok(!!row && row.code === tr.code, "list_topup_requests trả đúng mã");
  ok(!!row && (row.username || row.email), "list_topup_requests có tên/email người gửi (" + (row?.username || row?.email) + ")");

  await admin.from("profiles").update({ credit_balance: 300000 }).eq("id", sellerId);
  const { data: wr } = await seller.rpc("request_withdrawal", { p_amount: 100000, p_method: "bank_transfer" });
  ok(/^WD-[0-9A-F]{6}$/.test(wr?.code || ""), "withdrawal có mã WD-xxxxxx (" + wr?.code + ")");
  const { data: wlist } = await adminC.rpc("list_withdrawal_requests");
  const wrow = (wlist ?? []).find((x) => x.id === wr.id);
  ok(!!wrow && wrow.code === wr.code && (wrow.username || wrow.email), "list_withdrawal_requests có mã + tên người gửi");
}

// dọn
await setPct("order_commission_pct", 0);
await admin.from("profiles").update({ credit_balance: 0 }).in("id", [sellerId, custId]);
await admin.from("credit_transactions").delete().in("user_id", [sellerId, custId]);
await admin.from("topup_requests").delete().eq("user_id", custId);
await admin.from("withdrawal_requests").delete().eq("user_id", sellerId);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
