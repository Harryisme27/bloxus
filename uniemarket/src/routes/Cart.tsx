import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Box, Sparkles, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cartStore";
import { CartLine } from "@/components/commerce/CartLine";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { DemoNotice } from "@/components/commerce/DemoNotice";
import {
  getAppliedPromo,
  normalizePromo,
  promoRate,
  setAppliedPromo,
} from "@/components/commerce/promo";

export function Cart() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const clear = useCartStore((state) => state.clear);

  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(() => getAppliedPromo());

  const subtotalUSD = subtotal();
  const discountUSD = subtotalUSD * promoRate(appliedCode);
  const totalUSD = subtotalUSD - discountUSD;

  function handleApplyPromo() {
    const code = normalizePromo(codeInput);
    if (!code) {
      toast.error("Vui lòng nhập mã giảm giá.");
      return;
    }
    if (promoRate(code) > 0) {
      setAppliedCode(code);
      setAppliedPromo(code);
      setCodeInput("");
      toast.success(`Đã áp dụng mã "${code}"`, { description: "Bạn được giảm 10% cho đơn này." });
    } else {
      toast.error("Mã giảm giá không hợp lệ", { description: `"${code}" không tồn tại hoặc đã hết hạn.` });
    }
  }

  function handleRemovePromo() {
    setAppliedCode(null);
    setAppliedPromo(null);
    toast.message("Đã gỡ mã giảm giá.");
  }

  // ---- Empty state ----------------------------------------------------------
  if (items.length === 0) {
    return (
      <PageContainer className="py-16">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border-strong bg-surface">
              <Box className="h-11 w-11 text-text-subtle" aria-hidden="true" />
            </div>
            <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-soft text-yellow">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">Giỏ hàng trống</h1>
          <p className="mt-3 text-text-muted">
            Bạn chưa thêm vật phẩm nào. Khám phá kho vật phẩm hiếm từ các tựa game Roblox đang hot và
            bắt đầu shopping nào!
          </p>
          <Link to="/games" className="mt-8">
            <Button size="lg">
              Khám phá vật phẩm
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // ---- Cart with items ------------------------------------------------------
  return (
    <PageContainer className="py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">Giỏ hàng</h1>
          <p className="mt-2 text-text-muted">
            <span className="tabular-nums-mono font-semibold text-text">{items.length}</span> vật phẩm
            đang chờ được giao ngay tức thì.
          </p>
        </div>
        <DemoNotice variant="inline" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Cart lines */}
        <div>
          <div className="space-y-3">
            {items.map((line) => (
              <CartLine key={line.id} line={line} />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/games"
              className="text-sm font-medium text-text-muted transition-colors hover:text-yellow"
            >
              ← Tiếp tục mua sắm
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
                toast.message("Đã xoá toàn bộ giỏ hàng.");
              }}
              className="text-text-subtle hover:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Xoá tất cả
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            subtotalUSD={subtotalUSD}
            discountUSD={discountUSD}
            totalUSD={totalUSD}
            promoCode={appliedCode}
          >
            <div className="space-y-4">
              {/* Promo */}
              {appliedCode ? (
                <div className="flex items-center justify-between rounded-lg border border-green bg-green-soft px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-green">
                    <Tag className="h-4 w-4" aria-hidden="true" />
                    {appliedCode} · -10%
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    aria-label="Gỡ mã giảm giá"
                    className="text-green transition-colors hover:text-green-hover"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyPromo();
                    }}
                    placeholder="Nhập mã giảm giá"
                    aria-label="Mã giảm giá"
                    className="uppercase"
                  />
                  <Button variant="secondary" onClick={handleApplyPromo} className="shrink-0">
                    Áp dụng
                  </Button>
                </div>
              )}
              {!appliedCode ? (
                <p className="text-xs text-text-subtle">
                  Thử mã <span className="font-mono font-semibold text-text-muted">UNIE10</span> để
                  được giảm 10%.
                </p>
              ) : null}

              <Link to="/checkout" className="block">
                <Button size="lg" className="w-full">
                  Tiến hành thanh toán
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </OrderSummary>
        </div>
      </div>
    </PageContainer>
  );
}
