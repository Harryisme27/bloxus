#!/usr/bin/env node
/**
 * UNIEMARKET V2 — RLS smoke test
 * ------------------------------
 * Chứng minh các ranh giới bảo mật (Row Level Security) hoạt động đúng trên
 * project Supabase thật. Chạy SAU khi đã chạy 01-schema.sql (+ 02-seed.sql):
 *
 *     node supabase/rls-smoke-test.mjs
 *
 * Đọc cấu hình từ biến môi trường hoặc file .env.local ở gốc dự án:
 *   SUPABASE_URL / VITE_SUPABASE_URL            (bắt buộc)
 *   SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY  (bắt buộc)
 *   SUPABASE_SERVICE_ROLE_KEY                   (tùy chọn — để dọn user test)
 *   TEST_USER_A_EMAIL / TEST_USER_A_PASSWORD    (tùy chọn — dùng user có sẵn)
 *   TEST_USER_B_EMAIL / TEST_USER_B_PASSWORD    (tùy chọn)
 *
 * Lưu ý: cần TẮT "Confirm email" trong Supabase Auth settings để script tự
 * đăng ký user test được. Test sẽ đặt 1 đơn hàng thật rồi tự hủy để hoàn kho.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Cấu hình
// ---------------------------------------------------------------------------
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnvLocal() {
  const out = {};
  try {
    const raw = readFileSync(resolve(projectRoot, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local không tồn tại — dùng env của shell */
  }
  return out;
}

const dotenv = loadDotEnvLocal();
const env = (key) => process.env[key] ?? dotenv[key];

const SUPABASE_URL = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
const ANON_KEY = env("SUPABASE_ANON_KEY") ?? env("VITE_SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    "[LỖI] Thiếu SUPABASE_URL / SUPABASE_ANON_KEY (hoặc VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).\n" +
      "Hãy điền vào .env.local hoặc export biến môi trường rồi chạy lại.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tiện ích test
// ---------------------------------------------------------------------------
let failures = 0;
function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  failures += 1;
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

const newClient = (key = ANON_KEY) =>
  createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const stamp = Date.now().toString(36);
const users = {
  a: {
    email: env("TEST_USER_A_EMAIL") ?? `rls-test-a-${stamp}@example.com`,
    password: env("TEST_USER_A_PASSWORD") ?? `RlsTest!${stamp}a`,
    preexisting: Boolean(env("TEST_USER_A_EMAIL")),
    client: newClient(),
    id: null,
  },
  b: {
    email: env("TEST_USER_B_EMAIL") ?? `rls-test-b-${stamp}@example.com`,
    password: env("TEST_USER_B_PASSWORD") ?? `RlsTest!${stamp}b`,
    preexisting: Boolean(env("TEST_USER_B_EMAIL")),
    client: newClient(),
    id: null,
  },
};

async function signInOrUp(user, label) {
  if (!user.preexisting) {
    const { data, error } = await user.client.auth.signUp({
      email: user.email,
      password: user.password,
      options: { data: { username: `rlstest_${label}_${stamp}` } },
    });
    if (error) throw new Error(`Không đăng ký được user ${label}: ${error.message}`);
    if (!data.session) {
      throw new Error(
        `Đăng ký user ${label} không trả về session — có thể "Confirm email" đang BẬT. ` +
          "Tắt nó trong Authentication → Sign In / Up → Email, hoặc cung cấp TEST_USER_*_EMAIL/PASSWORD.",
      );
    }
    user.id = data.user.id;
    return;
  }
  const { data, error } = await user.client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Không đăng nhập được user ${label}: ${error.message}`);
  user.id = data.user.id;
}

// ---------------------------------------------------------------------------
// Các bài test
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Đang test project: ${SUPABASE_URL}\n`);
  const anon = newClient();

  // 1. Anon đọc được catalog đang bán --------------------------------------
  {
    const { data, error } = await anon
      .from("products")
      .select("id, name, price, stock, kind")
      .eq("is_active", true)
      .limit(50);
    if (error) fail("anon đọc products", error.message);
    else if (data.length === 0)
      pass("anon đọc products", "0 sản phẩm (chưa chạy 02-seed.sql?) — quyền đọc vẫn OK");
    else pass("anon đọc products", `${data.length} sản phẩm`);
  }

  // 2. Anon KHÔNG đọc được orders -------------------------------------------
  {
    const { data, error } = await anon.from("orders").select("id").limit(5);
    if (error) pass("anon KHÔNG đọc được orders", `bị chặn: ${error.message}`);
    else if (data.length === 0) pass("anon KHÔNG đọc được orders", "trả về 0 dòng");
    else fail("anon KHÔNG đọc được orders", `lộ ${data.length} đơn hàng!`);
  }

  // 3. Tạo / đăng nhập 2 user test -------------------------------------------
  await signInOrUp(users.a, "a");
  await signInOrUp(users.b, "b");
  pass("đăng nhập 2 user test", `${users.a.email} + ${users.b.email}`);

  // 4. INSERT thẳng vào orders phải bị từ chối --------------------------------
  {
    const { error } = await users.a.client.from("orders").insert({
      user_id: users.a.id,
      order_code: `HACK-${stamp}`.slice(0, 12),
      total: 1,
    });
    if (error) pass("INSERT thẳng vào orders bị chặn", error.message);
    else fail("INSERT thẳng vào orders bị chặn", "insert trực tiếp đã thành công!");
  }

  // 5. place_order hoạt động + server tự tính tiền ---------------------------
  let orderId = null;
  {
    const { data: products, error: prodErr } = await users.a.client
      .from("products")
      .select("id, name, price, stock, kind, service_options")
      .eq("is_active", true)
      .eq("kind", "item")
      .order("price", { ascending: true })
      .limit(50);

    const product =
      products?.find((p) => p.stock === null || p.stock >= 2) ??
      products?.find((p) => p.stock === null || p.stock >= 1);
    if (prodErr || !product) {
      fail("place_order", "không tìm được sản phẩm còn hàng để đặt thử (chạy 02-seed.sql trước)");
    } else {
      const qty = product.stock === null || product.stock >= 2 ? 2 : 1;
      const expectedTotal = product.price * qty;

      const { data: order, error } = await users.a.client.rpc("place_order", {
        p_items: [{ product_id: product.id, quantity: qty }],
        p_payment_method: "bank_transfer",
        p_game_username: "RlsTester",
        p_contact_channel: "discord",
        p_contact_value: "rls#0001",
        p_note: "RLS smoke test — đơn này sẽ tự hủy",
      });

      if (error) {
        fail("place_order", error.message);
      } else {
        orderId = order.id;
        const codeOk = /^UM-[A-Z0-9]{6}$/.test(order.order_code ?? "");
        if (Number(order.total) === expectedTotal && codeOk) {
          pass(
            "place_order + server tự tính tiền",
            `${order.order_code}: ${qty} x "${product.name}" = ${order.total} VNĐ`,
          );
        } else {
          fail(
            "place_order + server tự tính tiền",
            `total=${order.total} (mong đợi ${expectedTotal}), order_code=${order.order_code}`,
          );
        }
      }
    }
  }

  // 6. User B không đọc được đơn của user A -----------------------------------
  if (orderId) {
    const { data, error } = await users.b.client
      .from("orders")
      .select("id, total")
      .eq("id", orderId);
    if (error) pass("user B KHÔNG đọc được đơn của A", `bị chặn: ${error.message}`);
    else if (data.length === 0) pass("user B KHÔNG đọc được đơn của A", "trả về 0 dòng");
    else fail("user B KHÔNG đọc được đơn của A", "B đã đọc được đơn của A!");
  }

  // 7. User B không được xác nhận thanh toán (RPC admin-only) ------------------
  if (orderId) {
    const { error } = await users.b.client.rpc("confirm_payment", {
      p_order_id: orderId,
      p_ref: "hack",
    });
    if (error) pass("khách KHÔNG gọi được confirm_payment", error.message);
    else fail("khách KHÔNG gọi được confirm_payment", "RPC admin đã chạy cho khách thường!");
  }

  // 8. Khách hủy đơn của chính mình (hoàn kho, dọn dữ liệu test) ---------------
  if (orderId) {
    const { data, error } = await users.a.client.rpc("cancel_order", {
      p_order_id: orderId,
      p_reason: "RLS smoke test cleanup",
    });
    if (error) fail("khách hủy đơn pending của mình", error.message);
    else if (data.status === "cancelled") pass("khách hủy đơn pending của mình", "đã hoàn kho");
    else fail("khách hủy đơn pending của mình", `status=${data.status}`);
  }

  // Dọn user test (chỉ khi có service role key) --------------------------------
  if (SERVICE_ROLE_KEY) {
    const adminClient = newClient(SERVICE_ROLE_KEY);
    for (const [label, user] of Object.entries(users)) {
      if (!user.preexisting && user.id) {
        const { error } = await adminClient.auth.admin.deleteUser(user.id);
        if (error) console.log(`(cleanup) không xóa được user ${label}: ${error.message}`);
      }
    }
    console.log("(cleanup) đã xóa user test bằng service role key");
  } else {
    console.log(
      "(cleanup) không có SUPABASE_SERVICE_ROLE_KEY — user test rls-test-* vẫn còn trong Auth, có thể xóa tay trong Dashboard.",
    );
  }

  console.log(
    failures === 0
      ? "\n✅ TẤT CẢ PASS — RLS đang bảo vệ dữ liệu đúng thiết kế."
      : `\n❌ CÓ ${failures} BÀI FAIL — KHÔNG deploy/kinh doanh cho tới khi sửa xong RLS.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(`\n[LỖI] ${err.message}`);
  process.exit(1);
});
