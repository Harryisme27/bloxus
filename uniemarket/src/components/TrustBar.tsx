import { ShieldCheck, Zap, Users, Star } from "lucide-react";
import { StatCounter } from "@/components/StatCounter";
import { cn } from "@/lib/utils";

export interface TrustBarProps {
  className?: string;
}

/** Row of trust-building stats shown near the top of the homepage. Demo numbers — edit freely. */
export function TrustBar({ className }: TrustBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-4",
        className,
      )}
    >
      <StatCounter icon={Zap} value="12,400+" label="Đơn hàng đã giao" />
      <StatCounter icon={Users} value="8,900+" label="Khách hàng tin dùng" />
      <StatCounter icon={Star} value="4.9/5" label="Đánh giá trung bình" />
      <StatCounter icon={ShieldCheck} value="100%" label="Giao dịch minh bạch" />
    </div>
  );
}
