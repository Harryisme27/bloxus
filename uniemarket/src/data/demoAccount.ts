// SEED DATA — chủ shop có thể sửa file này.
//
// Đây là tài khoản demo có sẵn để khách dùng thử tính năng đăng nhập mà không
// cần tự đăng ký. KHÔNG PHẢI bảo mật thật: đây chỉ là bản demo chạy 100% cục
// bộ (localStorage), nên "passwordHash" bên dưới thực chất chỉ là chuỗi mật
// khẩu gốc được lưu thẳng (không mã hoá). Không dùng cách này cho ứng dụng
// thật có dữ liệu người dùng thật.
import type { User } from "@/types";

/** Mật khẩu demo hiển thị công khai: "demo1234" (xem DEMO_CREDENTIALS bên dưới). */
export const DEMO_ACCOUNT: User = {
  id: "user-demo-buyer",
  username: "DemoBuyer",
  email: "demo@uniemarket.gg",
  // DEMO ONLY — mật khẩu gốc là "demo1234", lưu thẳng vì đây không phải hệ
  // thống thật. authStore.ts so khớp trực tiếp chuỗi này, không có mã hoá.
  passwordHash: "demo1234",
  robloxUsername: "DemoPlayer",
  role: "customer",
  walletUSD: 100,
  isVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** Gợi ý đăng nhập nhanh, hiển thị trên trang /login. */
export const DEMO_CREDENTIALS = {
  email: "demo@uniemarket.gg",
  password: "demo1234",
};
