import { useState } from "react";
import { CreditCard, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Insert a space every 4 digits, max 16 digits -> "4242 4242 4242 4242". */
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** "MM/YY" masking as the user types. */
function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export interface FakeCardFormProps {
  className?: string;
}

/** Purely visual, NON-functional card form. Nothing is validated, stored, or
 * transmitted — it exists to make the demo checkout feel real. */
export function FakeCardForm({ className }: FakeCardFormProps) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState("");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Card preview */}
      <div className="relative overflow-hidden rounded-xl border border-border-strong bg-gradient-to-br from-surface-3 to-surface p-5 shadow-inner">
        <div className="flex items-start justify-between">
          <span className="flex h-8 w-11 items-center justify-center rounded-md bg-yellow-soft">
            <CreditCard className="h-4 w-4 text-yellow" aria-hidden="true" />
          </span>
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-text-subtle">
            Uniemarket
          </span>
        </div>
        <p className="tabular-nums-mono mt-6 text-lg tracking-[0.2em] text-text">
          {number || "•••• •••• •••• ••••"}
        </p>
        <div className="mt-4 flex items-end justify-between text-xs">
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wider text-text-subtle">
              Chủ thẻ
            </span>
            <span className="block truncate font-medium uppercase text-text-muted">
              {holder || "NGUYEN VAN A"}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[10px] uppercase tracking-wider text-text-subtle">
              Hết hạn
            </span>
            <span className="tabular-nums-mono block font-medium text-text-muted">
              {expiry || "MM/YY"}
            </span>
          </span>
        </div>
      </div>

      {/* Inputs (visual only) */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="card-number">Số thẻ</Label>
          <Input
            id="card-number"
            inputMode="numeric"
            autoComplete="off"
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="card-holder">Tên chủ thẻ</Label>
          <Input
            id="card-holder"
            autoComplete="off"
            placeholder="NGUYEN VAN A"
            maxLength={40}
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="card-expiry">Hết hạn</Label>
            <Input
              id="card-expiry"
              inputMode="numeric"
              autoComplete="off"
              placeholder="MM/YY"
              maxLength={5}
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="card-cvc">CVC</Label>
            <Input
              id="card-cvc"
              inputMode="numeric"
              autoComplete="off"
              placeholder="•••"
              maxLength={4}
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-text-subtle">
        <Lock className="h-3 w-3" aria-hidden="true" />
        Trường thẻ chỉ mang tính minh hoạ — không có dữ liệu nào được gửi đi.
      </p>
    </div>
  );
}
