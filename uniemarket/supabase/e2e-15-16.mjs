#!/usr/bin/env node
// E2E migrations 15 (manager money + role requests) & 16 (chat image-only).
//   SERVICE_KEY=sb_secret_... node supabase/e2e-15-16.mjs
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

const adminUser = anon(); await adminUser.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
const mgr = anon(); await mgr.auth.signInWithPassword({ email: "unie.manager.test@gmail.com", password: "unieManager2026!" });
const ctv = anon(); await ctv.auth.signInWithPassword({ email: "unie.ctv.test@gmail.com", password: "unieCTV2026!" });
const { data: { users } } = await admin.auth.admin.listUsers();
const ctvId = users.find((u) => u.email === "unie.ctv.test@gmail.com")?.id;
const mgrId = users.find((u) => u.email === "unie.manager.test@gmail.com")?.id;

// helper: tạo đơn đã thanh toán
async function makePaidOrder(tag) {
  const { data: prod } = await admin.from("products").select("id,stock").eq("kind", "item").limit(1).maybeSingle();
  if (prod.stock !== null) await admin.from("products").update({ stock: prod.stock + 3 }).eq("id", prod.id);
  const { data: os } = await adminUser.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
    p_game_username: "E2E", p_contact_channel: "discord", p_contact_value: tag, p_note: tag,
  });
  const o = Array.isArray(os) ? os[0] : os;
  return { order: o, prod, prevStock: prod.stock };
}

// ---------- 15: manager confirm payment ----------
console.log("— 15: manager confirm payment —");
{
  const { order, prod, prevStock } = await makePaidOrder("mgr-confirm");
  const { data: confirmed, error } = await mgr.rpc("confirm_payment", { p_order_id: order.id, p_ref: "mgr" });
  ok(!error && confirmed?.status === "paid", "manager confirm_payment -> paid" + (error ? " — " + error.message : ""));
  await admin.from("orders").delete().eq("id", order.id);
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock }).eq("id", prod.id);
}

// ---------- 15: manager approve refund ----------
console.log("— 15: manager approve refund —");
{
  const { order, prod, prevStock } = await makePaidOrder("mgr-refund");
  await mgr.rpc("confirm_payment", { p_order_id: order.id });
  await mgr.rpc("claim_order", { p_order_id: order.id });
  // khách yêu cầu hoàn tiền
  const { error: eReq } = await adminUser.rpc("request_refund", { p_order_id: order.id, p_reason: "e2e refund" });
  ok(!eReq, "khách gửi yêu cầu hoàn tiền" + (eReq ? " — " + eReq.message : ""));
  const { data: resolved, error: eRes } = await mgr.rpc("resolve_refund", { p_order_id: order.id, p_approve: true });
  ok(!eRes && resolved?.status === "refunded", "manager duyệt hoàn tiền -> refunded" + (eRes ? " — " + eRes.message : ""));
  await admin.from("orders").delete().eq("id", order.id);
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock }).eq("id", prod.id);
}

// ---------- 15: role request flow ----------
console.log("— 15: role request (manager proposes, admin approves) —");
{
  // dọn đề xuất cũ cho email test
  await admin.from("role_requests").delete().eq("target_email", "occac@gmail.com");
  const { data: req, error: eReq } = await mgr.rpc("request_role_grant", { p_email: "occac@gmail.com", p_role: "ctv", p_note: "e2e" });
  ok(!eReq && req?.status === "pending", "manager gửi đề xuất cấp quyền (pending)" + (eReq ? " — " + eReq.message : ""));
  // manager KHÔNG được tự duyệt
  const { error: eSelf } = await mgr.rpc("review_role_grant", { p_request_id: req.id, p_approve: true });
  ok(!!eSelf, "manager KHÔNG tự duyệt được đề xuất");
  // admin duyệt -> occac thành ctv
  const { data: reviewed, error: eRev } = await adminUser.rpc("review_role_grant", { p_request_id: req.id, p_approve: true });
  ok(!eRev && reviewed?.status === "approved", "admin duyệt đề xuất" + (eRev ? " — " + eRev.message : ""));
  const { data: occac } = await admin.from("profiles").select("role").eq("id",
    users.find((u) => u.email === "occac@gmail.com")?.id).maybeSingle();
  ok(occac?.role === "ctv", `occac được cấp quyền ctv (role=${occac?.role})`);
  // trả occac về customer + dọn
  await admin.from("profiles").update({ role: "customer" }).eq("id", users.find((u) => u.email === "occac@gmail.com")?.id);
  await admin.from("role_requests").delete().eq("id", req.id);
}

// ---------- 16: chat image-only ----------
console.log("— 16: chat image-only message —");
{
  // tìm 1 thread admin tham gia (staff kênh chung)
  const { data: threads } = await adminUser.from("threads").select("id,kind").eq("kind", "staff").limit(1);
  const threadId = threads?.[0]?.id;
  ok(!!threadId, "có thread staff để test");
  if (threadId) {
    // chỉ ảnh (body rỗng) — trước 16 sẽ lỗi "không được để trống"
    const { data: m1, error: e1 } = await adminUser.rpc("post_message", {
      p_thread_id: threadId, p_body: "", p_attachments: ["fake/path/img.jpg"],
    });
    ok(!e1 && m1?.attachments?.length === 1 && (m1?.body ?? "") === "", "gửi tin CHỈ ảnh (body rỗng) OK" + (e1 ? " — " + e1.message : ""));
    // ảnh + chữ
    const { data: m2, error: e2 } = await adminUser.rpc("post_message", {
      p_thread_id: threadId, p_body: "kèm chữ", p_attachments: ["fake/path/img2.jpg"],
    });
    ok(!e2 && m2?.body === "kèm chữ" && m2?.attachments?.length === 1, "gửi ảnh + chữ OK" + (e2 ? " — " + e2.message : ""));
    // rỗng cả 2 -> vẫn phải lỗi
    const { error: e3 } = await adminUser.rpc("post_message", { p_thread_id: threadId, p_body: "  ", p_attachments: null });
    ok(!!e3, "gửi rỗng cả chữ lẫn ảnh vẫn bị chặn");
    // dọn 2 tin test
    if (m1?.id) await admin.from("messages").delete().eq("id", m1.id);
    if (m2?.id) await admin.from("messages").delete().eq("id", m2.id);
  }
}

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
