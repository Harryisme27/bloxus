import { Link } from "react-router-dom";
import { ArrowRight, Box, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { CartLine } from "@/components/commerce/CartLine";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    emptyTitle: "Giỏ hàng trống",
    emptyDesc: "Bạn chưa thêm sản phẩm hay dịch vụ nào. Khám phá các danh mục và bắt đầu chọn nhé!",
    exploreStore: "Khám phá cửa hàng",
    title: "Giỏ hàng",
    countSuffix: " sản phẩm đang chờ được xử lý.",
    continueShopping: "← Tiếp tục mua sắm",
    cleared: "Đã xoá toàn bộ giỏ hàng.",
    clearAll: "Xoá tất cả",
    proceed: "Tiến hành thanh toán",
  },
  en: {
    emptyTitle: "Your cart is empty",
    emptyDesc:
      "You haven't added any products or services yet. Browse the categories and start picking!",
    exploreStore: "Explore the store",
    title: "Cart",
    countSuffix: " products waiting to be checked out.",
    continueShopping: "← Continue shopping",
    cleared: "Your entire cart has been cleared.",
    clearAll: "Clear all",
    proceed: "Proceed to checkout",
  },
};

export function Cart() {
  const t = usePick(STR);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const clear = useCartStore((state) => state.clear);

  const total = subtotal();

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
          <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">{t.emptyTitle}</h1>
          <p className="mt-3 text-text-muted">{t.emptyDesc}</p>
          <Link to="/games" className="mt-8">
            <Button size="lg">
              {t.exploreStore}
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
          <h1 className="font-heading text-3xl font-bold text-text sm:text-4xl">{t.title}</h1>
          <p className="mt-2 text-text-muted">
            <span className="tabular-nums-mono font-semibold text-text">{items.length}</span>
            {t.countSuffix}
          </p>
        </div>
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
              {t.continueShopping}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
                toast.message(t.cleared);
              }}
              className="text-text-subtle hover:text-danger"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t.clearAll}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary subtotal={total} total={total} lines={items}>
            <Link to="/checkout" className="block">
              <Button size="lg" className="w-full">
                {t.proceed}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </OrderSummary>
        </div>
      </div>
    </PageContainer>
  );
}
