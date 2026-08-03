// Danh mục cổng thanh toán + cấu hình. Admin bật/tắt và nhập API trong Cài đặt
// (lưu trong app_settings key 'payment_gateways'); Checkout hiển thị cổng đang
// bật; OrderDetail hiện hướng dẫn theo cổng khách chọn.
import { Landmark, Wallet, CreditCard, Bitcoin, DollarSign, type LucideIcon } from "lucide-react";
import { USD_VND_RATE } from "@/store/currencyStore";
import type { DbPaymentMethod } from "@/types/db";

// Phí xử lý khi trả bằng Stripe (khách chịu) — PHẢI khớp với
// supabase/functions/create-checkout-session/index.ts.
export const STRIPE_FEE_PERCENT = 0.05; // 5%
export const STRIPE_FEE_FIXED_USD_CENTS = 30; // + $0.30

/** Phí Stripe (VND) cho danh sách món — tính theo cent USD y hệt Edge Function
 * để số hiện ở checkout khớp từng xu với trang Stripe. */
export function stripeProcessingFeeVnd(
  lines: Array<{ unitPrice: number; quantity: number }>,
): number {
  const subtotalCents = lines.reduce(
    (sum, l) => sum + Math.round((l.unitPrice / USD_VND_RATE) * 100) * l.quantity,
    0,
  );
  if (subtotalCents <= 0) return 0;
  const feeCents =
    Math.round(subtotalCents * STRIPE_FEE_PERCENT) + STRIPE_FEE_FIXED_USD_CENTS;
  return Math.round((feeCents / 100) * USD_VND_RATE);
}

export interface GatewayField {
  key: string;
  vi: string;
  en: string;
  secret?: boolean;
  placeholder?: string;
}

export interface GatewayMeta {
  id: string;
  vi: string;
  en: string;
  hintVi: string;
  hintEn: string;
  /** payment_method enum lưu vào đơn (chỉ bank_transfer | momo hợp lệ). */
  method: DbPaymentMethod;
  icon: LucideIcon;
  /** Cổng "tích hợp sẵn" (bank/momo) — cấu hình nằm ở phần Thông tin nhận tiền. */
  builtin?: boolean;
  /** Trường cấu hình riêng (API key, ví…) lưu trong payment_gateways JSON. */
  fields: GatewayField[];
}

export const GATEWAY_META: GatewayMeta[] = [
  {
    id: "bank_transfer",
    vi: "Chuyển khoản ngân hàng",
    en: "Bank transfer",
    hintVi: "Chuyển khoản theo hướng dẫn",
    hintEn: "Transfer per the instructions",
    method: "bank_transfer",
    icon: Landmark,
    builtin: true,
    fields: [],
  },
  {
    id: "momo",
    vi: "Momo",
    en: "Momo",
    hintVi: "Chuyển qua ví Momo / quét QR",
    hintEn: "Pay via Momo wallet / scan QR",
    method: "momo",
    icon: Wallet,
    builtin: true,
    fields: [],
  },
  {
    id: "stripe",
    vi: "Card / Apple Pay",
    en: "Card / Apple Pay",
    hintVi: "Thanh toán bằng thẻ hoặc Apple Pay",
    hintEn: "Pay by card or Apple Pay",
    method: "bank_transfer",
    icon: CreditCard,
    fields: [
      { key: "publishable_key", vi: "Publishable key", en: "Publishable key", placeholder: "pk_live_..." },
      { key: "secret_key", vi: "Secret key", en: "Secret key", secret: true, placeholder: "sk_live_..." },
      { key: "link", vi: "Link thanh toán", en: "Payment link", placeholder: "https://buy.stripe.com/..." },
    ],
  },
  {
    id: "crypto",
    vi: "Crypto",
    en: "Crypto",
    hintVi: "Chuyển tiền mã hoá",
    hintEn: "Pay with cryptocurrency",
    method: "bank_transfer",
    icon: Bitcoin,
    fields: [
      { key: "network", vi: "Mạng lưới (BTC/ETH/USDT…)", en: "Network (BTC/ETH/USDT…)", placeholder: "USDT (TRC20)" },
      { key: "wallet_address", vi: "Địa chỉ ví", en: "Wallet address", placeholder: "0x... / T..." },
    ],
  },
  {
    id: "paypal",
    vi: "PayPal",
    en: "PayPal",
    hintVi: "Thanh toán qua PayPal",
    hintEn: "Pay via PayPal",
    method: "bank_transfer",
    icon: DollarSign,
    fields: [
      { key: "client_id", vi: "Client ID", en: "Client ID" },
      { key: "link", vi: "Link PayPal.me", en: "PayPal.me link", placeholder: "https://paypal.me/..." },
    ],
  },
];

export type GatewayConfig = { enabled?: boolean } & Record<string, unknown>;
export type GatewaysSettings = Record<string, GatewayConfig>;

/** Đọc payment_gateways từ getSettings() (an toàn nếu thiếu). */
export function parseGateways(settings: Record<string, unknown> | undefined): GatewaysSettings {
  const raw = settings?.payment_gateways;
  if (raw && typeof raw === "object") return raw as GatewaysSettings;
  // Mặc định: bật bank + momo.
  return { bank_transfer: { enabled: true }, momo: { enabled: true } };
}

export function isGatewayEnabled(gws: GatewaysSettings, id: string): boolean {
  return Boolean(gws[id]?.enabled);
}

/** Các cổng đang bật (giữ thứ tự trong GATEWAY_META). */
export function enabledGateways(gws: GatewaysSettings): GatewayMeta[] {
  return GATEWAY_META.filter((g) => isGatewayEnabled(gws, g.id));
}

export function gatewayMeta(id: string | null | undefined): GatewayMeta | undefined {
  return GATEWAY_META.find((g) => g.id === id);
}
