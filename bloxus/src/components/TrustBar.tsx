import { ShieldCheck, Zap, Users, Star } from "lucide-react";
import { StatCounter } from "@/components/StatCounter";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    ordersDelivered: "Đơn hàng đã giao",
    trustedCustomers: "Khách hàng tin dùng",
    averageRating: "Đánh giá trung bình",
    transparentTx: "Giao dịch minh bạch",
  },
  en: {
    ordersDelivered: "Orders delivered",
    trustedCustomers: "Trusted customers",
    averageRating: "Average rating",
    transparentTx: "Transparent transactions",
  },
};

export interface TrustBarProps {
  className?: string;
}

/** Row of trust-building stats shown near the top of the homepage. Demo numbers — edit freely. */
export function TrustBar({ className }: TrustBarProps) {
  const t = usePick(STR);
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-4",
        className,
      )}
    >
      <StatCounter icon={Zap} value="12,400+" label={t.ordersDelivered} />
      <StatCounter icon={Users} value="8,900+" label={t.trustedCustomers} />
      <StatCounter icon={Star} value="4.9/5" label={t.averageRating} />
      <StatCounter icon={ShieldCheck} value="100%" label={t.transparentTx} />
    </div>
  );
}
