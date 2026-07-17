#!/usr/bin/env node
// E2E migrations 11-14: username login, CTV queue notify, sections, manager role.
//   SERVICE_KEY=sb_secret_... node supabase/e2e-11-14.mjs
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

// ---------- 11: đăng nhập bằng username ----------
console.log("— 11: username login —");
{
  const c = anon();
  const { data: email, error } = await c.rpc("email_for_login", { p_login: "Admin" });
  ok(!error && email === "miding471@gmail.com", `email_for_login('Admin') -> ${email ?? error?.message}`);
  if (email) {
    const { error: e2 } = await c.auth.signInWithPassword({ email, password: "unieAdmin2026!" });
    ok(!e2, "login qua username 'Admin' thành công");
  }
}

// ---------- chuẩn bị: user thao tác ----------
const adminUser = anon();
await adminUser.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });
const ctvUser = anon();
await ctvUser.auth.signInWithPassword({ email: "unie.ctv.test@gmail.com", password: "unieCTV2026!" });
const { data: { users } } = await admin.auth.admin.listUsers();
const ctvId = users.find((u) => u.email === "unie.ctv.test@gmail.com")?.id;

// ---------- 13: sections ----------
console.log("— 13: product sections —");
{
  const { data: cat, error } = await admin.from("categories").select("id,sections").limit(1).maybeSingle();
  ok(!error && cat && "sections" in cat, "categories.sections tồn tại");
  const { error: e2 } = await admin.from("products").update({ section: null }).eq("id", "00000000-0000-0000-0000-000000000000");
  ok(!e2, "products.section tồn tại");
}

// ---------- 14: manager role ----------
console.log("— 14: manager role —");
const MGR_EMAIL = "unie.manager.test@gmail.com", MGR_PASS = "unieManager2026!";
let mgrId = users.find((u) => u.email === MGR_EMAIL)?.id;
if (!mgrId) {
  const { data, error } = await admin.auth.admin.createUser({
    email: MGR_EMAIL, password: MGR_PASS, email_confirm: true,
    user_metadata: { username: "Manager_Test" },
  });
  ok(!error, "tạo tài khoản manager test" + (error ? " — " + error.message : ""));
  mgrId = data?.user?.id;
  await new Promise((r) => setTimeout(r, 1200)); // chờ trigger tạo profile
}
{
  const { error } = await admin.from("profiles").update({ role: "manager" }).eq("id", mgrId);
  ok(!error, "gán role manager (enum có 'manager')" + (error ? " — " + error.message : ""));
}
const mgr = anon();
{
  const { error } = await mgr.auth.signInWithPassword({ email: MGR_EMAIL, password: MGR_PASS });
  ok(!error, "manager đăng nhập được");
}
// manager: sửa danh mục (đổi tagline rồi trả lại)
{
  const { data: cat } = await admin.from("categories").select("id,tagline").limit(1).maybeSingle();
  const { error } = await mgr.from("categories").update({ tagline: cat.tagline }).eq("id", cat.id);
  ok(!error, "manager update categories (RLS write)" + (error ? " — " + error.message : ""));
}
// manager: xem mọi đơn
{
  const { data, error } = await mgr.from("orders").select("id").limit(3);
  ok(!error && (data?.length ?? 0) > 0, `manager xem được mọi đơn (${data?.length ?? 0} rows)`);
}
// manager: BỊ CHẶN ghi app_settings
{
  const { data, error } = await mgr.from("app_settings").update({ value: "60" }).eq("key", "refund_timeout_minutes").select();
  ok(!!error || (data?.length ?? 0) === 0, "manager KHÔNG ghi được app_settings");
}
// manager: BỊ CHẶN đổi role người khác
{
  const { data, error } = await mgr.from("profiles").update({ role: "ctv" }).eq("id", ctvId).select();
  ok(!!error || (data?.length ?? 0) === 0, "manager KHÔNG đổi được role người khác");
}

// ---------- 12 + claim/assign: tạo đơn thật ----------
console.log("— 12: notify queue + claim/assign —");
// CTV all-access để nhận notify
await admin.rpc; // noop
{
  const { data: prod } = await admin.from("products").select("id,name,stock").eq("kind", "item").limit(1).maybeSingle();
  const prevStock = prod?.stock ?? null;
  if (prevStock !== null) await admin.from("products").update({ stock: prevStock + 5 }).eq("id", prod.id);

  // đảm bảo CTV all-access (đúng chuẩn qua RPC bằng admin user)
  const { error: eCats } = await adminUser.rpc("set_ctv_categories", { p_ctv: ctvId, p_category_ids: null, p_all: true });
  ok(!eCats, "set_ctv_categories(all=true) cho CTV" + (eCats ? " — " + eCats.message : ""));

  // khách (admin đóng vai) đặt đơn
  const { data: orders, error: eOrder } = await adminUser.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }],
    p_payment_method: "bank_transfer", p_game_username: "E2E", p_contact_channel: "discord",
    p_contact_value: "e2e#1", p_note: "e2e mgr", p_gateway: "bank_transfer",
  });
  const order = Array.isArray(orders) ? orders[0] : orders;
  ok(!eOrder && order, "đặt đơn test" + (eOrder ? " — " + eOrder.message : ""));

  // đếm notify trước
  const { count: before } = await admin.from("notifications").select("*", { count: "exact", head: true })
    .eq("user_id", ctvId).eq("type", "order_claimable");
  // admin confirm payment -> notify CTV + manager
  const { error: eConfirm } = await adminUser.rpc("confirm_payment", { p_order_id: order.id, p_ref: "e2e" });
  ok(!eConfirm, "confirm_payment" + (eConfirm ? " — " + eConfirm.message : ""));
  const { count: after } = await admin.from("notifications").select("*", { count: "exact", head: true })
    .eq("user_id", ctvId).eq("type", "order_claimable");
  ok((after ?? 0) > (before ?? 0), `CTV nhận notify order_claimable (${before ?? 0} -> ${after ?? 0})`);
  const { count: mgrNotif } = await admin.from("notifications").select("*", { count: "exact", head: true })
    .eq("user_id", mgrId).eq("type", "order_claimable");
  ok((mgrNotif ?? 0) > 0, `manager cũng nhận notify hàng đợi (${mgrNotif ?? 0})`);

  // manager claim đơn
  const { data: claimed, error: eClaim } = await mgr.rpc("claim_order", { p_order_id: order.id });
  ok(!eClaim && claimed?.assigned_ctv === mgrId, "manager tự nhận đơn (mọi danh mục)" + (eClaim ? " — " + eClaim.message : ""));

  // dọn: xóa đơn (kho trả lại ở cuối)
  await admin.from("orders").delete().eq("id", order.id);

  // manager assign: tạo đơn 2, confirm, manager giao cho CTV
  const { data: o2s, error: eO2 } = await adminUser.rpc("place_order", {
    p_items: [{ product_id: prod.id, quantity: 1 }],
    p_payment_method: "bank_transfer", p_game_username: "E2E", p_contact_channel: "discord",
    p_contact_value: "e2e#2", p_note: "e2e assign",
  });
  const o2 = Array.isArray(o2s) ? o2s[0] : o2s;
  if (!eO2 && o2) {
    await adminUser.rpc("confirm_payment", { p_order_id: o2.id });
    const { data: assigned, error: eAssign } = await mgr.rpc("assign_order", { p_order_id: o2.id, p_ctv: ctvId });
    ok(!eAssign && assigned?.assigned_ctv === ctvId, "manager giao đơn cho CTV" + (eAssign ? " — " + eAssign.message : ""));
    await admin.from("orders").delete().eq("id", o2.id);
  } else {
    ok(false, "tạo đơn 2 thất bại — " + (eO2?.message ?? "?"));
  }
  await admin.from("products").update({ stock: prevStock }).eq("id", prod.id);
}

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
