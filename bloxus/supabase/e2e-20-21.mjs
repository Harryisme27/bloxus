#!/usr/bin/env node
// E2E 20+21 — account + instant delivery + folder. SERVICE_KEY=... node supabase/e2e-20-21.mjs
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

const buyer = anon(); await buyer.auth.signInWithPassword({ email: "miding471@gmail.com", password: "unieAdmin2026!" });

// ---------- 20: account + instant delivery ----------
console.log("— 20: account product + instant delivery —");
const { data: cat } = await admin.from("categories").select("id").limit(1).maybeSingle();
const { data: prod, error: pe } = await admin.from("products").insert({
  category_id: cat.id, slug: "e2e-account-" + Date.now(), kind: "account",
  name: "E2E Account", price: 50000, stock: 5, instant_delivery: true,
}).select().single();
ok(!pe && prod, "tạo product kind=account, instant_delivery=true" + (pe ? " — " + pe.message : ""));
ok(prod?.kind === "account", "kind lưu = account");

// đặt secret qua RPC (admin)
const { error: se } = await buyer.rpc("set_product_secret", { p_product_id: prod.id, p_content: "acc: user01 / pass01" });
ok(!se, "set_product_secret OK" + (se ? " — " + se.message : ""));

// anon KHÔNG đọc được product_secrets
const guest = anon();
const { data: leak } = await guest.from("product_secrets").select("content").eq("product_id", prod.id);
ok(!leak || leak.length === 0, "anon KHÔNG đọc được nội dung bí mật ở product_secrets");

// đặt đơn + confirm payment -> tự giao + hoàn tất
const { data: os } = await buyer.rpc("place_order", {
  p_items: [{ product_id: prod.id, quantity: 1 }], p_payment_method: "bank_transfer",
  p_game_username: "E2E", p_contact_channel: "discord", p_contact_value: "acc", p_note: "acc",
});
const order = Array.isArray(os) ? os[0] : os;
ok(order?.status === "pending_payment", "đặt đơn -> pending_payment");
const { data: confirmed, error: ce } = await buyer.rpc("confirm_payment", { p_order_id: order.id });
ok(!ce && confirmed?.status === "completed", "confirm payment -> TỰ hoàn tất (completed)" + (ce ? " — " + ce.message : ""));
ok(confirmed?.delivery_content === "acc: user01 / pass01", "nội dung giao gắn vào đơn cho khách: " + confirmed?.delivery_content);

// dọn
await admin.from("orders").delete().eq("id", order.id);
await admin.from("products").delete().eq("id", prod.id);

// ---------- 21: folder ----------
console.log("— 21: category folder —");
const { data: folder, error: fe } = await admin.from("category_folders").insert({
  name: "E2E Roblox", slug: "e2e-roblox-" + Date.now(),
}).select().single();
ok(!fe && folder, "tạo folder" + (fe ? " — " + fe.message : ""));
// gán 1 category vào folder
await admin.from("categories").update({ folder_id: folder.id }).eq("id", cat.id);
const { data: reread } = await admin.from("categories").select("folder_id").eq("id", cat.id).maybeSingle();
ok(reread?.folder_id === folder.id, "gán category vào folder OK");
// anon đọc được folder (public read)
const { data: pubFolders } = await guest.from("category_folders").select("id").eq("id", folder.id);
ok((pubFolders ?? []).length === 1, "khách (anon) đọc được folder (public read)");
// dọn: gỡ folder khỏi category rồi xoá folder
await admin.from("categories").update({ folder_id: null }).eq("id", cat.id);
await admin.from("category_folders").delete().eq("id", folder.id);

console.log(`\n=== ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
