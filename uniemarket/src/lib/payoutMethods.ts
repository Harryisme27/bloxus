// Meta các phương thức rút tiền (payout). Cấu hình %/phí/min do admin đặt trong
// setting payout_methods; phần meta (nhãn, ô nhập tài khoản) cố định ở đây.
import { Landmark, Wallet, Bitcoin, CircleDollarSign, Send } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PayoutMethodMeta {
  id: string;
  vi: string;
  en: string;
  icon: LucideIcon;
  /** Nhãn ô nhập tài khoản nhận. */
  destVi: string;
  destEn: string;
  destPlaceholder: string;
}

export const PAYOUT_META: PayoutMethodMeta[] = [
  { id: "bank_transfer", vi: "Chuyển khoản ngân hàng", en: "Bank transfer", icon: Landmark, destVi: "Số tài khoản + ngân hàng", destEn: "Account number + bank", destPlaceholder: "0123456789 - Vietcombank - NGUYEN VAN A" },
  { id: "ewallet", vi: "Ví điện tử (Momo/ZaloPay)", en: "E-wallet (Momo/ZaloPay)", icon: Wallet, destVi: "Số điện thoại ví", destEn: "Wallet phone number", destPlaceholder: "0900000000" },
  { id: "crypto", vi: "Crypto", en: "Crypto", icon: Bitcoin, destVi: "Địa chỉ ví + mạng", destEn: "Wallet address + network", destPlaceholder: "USDT (TRC20): T..." },
  { id: "paypal", vi: "PayPal", en: "PayPal", icon: CircleDollarSign, destVi: "Email PayPal", destEn: "PayPal email", destPlaceholder: "you@email.com" },
  { id: "payoneer", vi: "Payoneer", en: "Payoneer", icon: CircleDollarSign, destVi: "Email Payoneer", destEn: "Payoneer email", destPlaceholder: "you@email.com" },
  { id: "skrill", vi: "Skrill", en: "Skrill", icon: Send, destVi: "Email Skrill", destEn: "Skrill email", destPlaceholder: "you@email.com" },
];

export interface PayoutMethodCfg {
  enabled?: boolean;
  percent?: number;
  flat?: number;
  min?: number;
}
export type PayoutMethods = Record<string, PayoutMethodCfg>;

export function parsePayoutMethods(settings: Record<string, unknown> | undefined): PayoutMethods {
  const raw = settings?.payout_methods;
  if (raw && typeof raw === "object") return raw as PayoutMethods;
  return { bank_transfer: { enabled: true }, ewallet: { enabled: true } };
}

export function enabledPayoutMethods(m: PayoutMethods): PayoutMethodMeta[] {
  return PAYOUT_META.filter((meta) => m[meta.id]?.enabled);
}

export function payoutMeta(id: string | null | undefined): PayoutMethodMeta | undefined {
  return PAYOUT_META.find((m) => m.id === id);
}

/** Phí = floor(amount * %/100) + flat. */
export function payoutFee(cfg: PayoutMethodCfg | undefined, amount: number): number {
  if (!cfg) return 0;
  return Math.floor((amount * (cfg.percent ?? 0)) / 100) + (cfg.flat ?? 0);
}
