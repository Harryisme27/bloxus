import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  ShieldCheck,
  BadgeCheck,
  PackageSearch,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  Tag,
  Boxes,
  Truck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type {
  ProductRow,
  SelectedServiceOptions,
  ServiceOptionsRankRange,
  ServiceOptionsTiers,
} from "@/types/db";
import { PageContainer } from "@/components/PageContainer";
import { ProductCard, isInStock } from "@/components/ProductCard";
import { RarityBadge } from "@/components/RarityBadge";
import { PriceTag } from "@/components/PriceTag";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/SectionHeading";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProductById, listCategories, listProducts } from "@/lib/db/catalog";
import { useCartStore, computeUnitPrice, buildCartLine } from "@/store/cartStore";
import { formatPrice } from "@/lib/format";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    choosePackageAria: "Chọn gói dịch vụ",
    from: "Từ",
    to: "Đến",
    rankInvalid: "Rank đích phải cao hơn rank hiện tại.",
    stepsCount: (n: number) => `${n} bậc`,
    perStep: "/ bậc",
    loadErrorTitle: "Không tải được sản phẩm",
    connectError: "Có lỗi khi kết nối máy chủ. Kiểm tra mạng rồi thử lại nhé.",
    retry: "Thử lại",
    notFoundTitle: "Không tìm thấy sản phẩm",
    notFoundDesc:
      "Sản phẩm này không tồn tại hoặc đã ngừng bán. Khám phá các sản phẩm khác nhé.",
    backToGames: "Về danh mục trò chơi",
    home: "Trang chủ",
    games: "Trò chơi",
    trustFast: "Xử lý nhanh",
    trustSafe: "An toàn 100%",
    trustProof: "Có minh chứng",
    service: "Dịch vụ",
    item: "Vật phẩm",
    featured: "Nổi bật",
    lowStock: (n: number) => `Sắp hết — chỉ còn ${n}`,
    inStock: "Còn hàng",
    outOfStock: "Hết hàng",
    timeLabel: "Thời gian:",
    choosePackage: "Chọn gói",
    chooseRankRange: "Chọn khoảng rank",
    quantity: "Số lượng",
    decreaseQty: "Giảm số lượng",
    increaseQty: "Tăng số lượng",
    addToCart: "Thêm vào giỏ",
    buyNow: "Mua ngay",
    addedToCart: (name: string) => `Đã thêm "${name}" vào giỏ hàng`,
    quantitySummary: (n: number) => `Số lượng: ${n}`,
    description: "Mô tả",
    info: "Thông tin",
    typeLabel: "Loại",
    rarityLabel: "Độ hiếm",
    deliveryTime: "Thời gian giao",
    stockLabel: "Tồn kho",
    deliveryMethod: "Cách thức giao hàng",
    deliveryNote:
      "Sau khi đặt và thanh toán, đội ngũ Bloxus sẽ liên hệ qua kênh bạn để lại và giao trong game / theo thỏa thuận. Mỗi đơn đều có ảnh/log minh chứng.",
    relatedEyebrow: "Cùng trò chơi",
    relatedTitle: "Sản phẩm liên quan",
    viewAll: "Xem tất cả",
  },
  en: {
    choosePackageAria: "Choose a service package",
    from: "From",
    to: "To",
    rankInvalid: "The target rank must be higher than the current rank.",
    stepsCount: (n: number) => `${n} steps`,
    perStep: "/ step",
    loadErrorTitle: "Couldn't load the product",
    connectError: "There was a problem connecting to the server. Check your connection and try again.",
    retry: "Try again",
    notFoundTitle: "Product not found",
    notFoundDesc:
      "This product doesn't exist or is no longer for sale. Explore our other products.",
    backToGames: "Back to game catalog",
    home: "Home",
    games: "Games",
    trustFast: "Fast processing",
    trustSafe: "100% safe",
    trustProof: "Proof included",
    service: "Service",
    item: "Item",
    featured: "Featured",
    lowStock: (n: number) => `Almost gone — only ${n} left`,
    inStock: "In stock",
    outOfStock: "Out of stock",
    timeLabel: "Time:",
    choosePackage: "Choose a package",
    chooseRankRange: "Choose a rank range",
    quantity: "Quantity",
    decreaseQty: "Decrease quantity",
    increaseQty: "Increase quantity",
    addToCart: "Add to cart",
    buyNow: "Buy now",
    addedToCart: (name: string) => `Added "${name}" to cart`,
    quantitySummary: (n: number) => `Quantity: ${n}`,
    description: "Description",
    info: "Details",
    typeLabel: "Type",
    rarityLabel: "Rarity",
    deliveryTime: "Delivery time",
    stockLabel: "Stock",
    deliveryMethod: "Delivery method",
    deliveryNote:
      "After you order and pay, the Bloxus team will reach out via the channel you provided and deliver in-game / as agreed. Every order comes with image/log proof.",
    relatedEyebrow: "Same game",
    relatedTitle: "Related products",
    viewAll: "View all",
  },
};

const DEFAULT_ACCENT = "#7CC35A";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Option configurator — gói cố định (tiers)
// ---------------------------------------------------------------------------

function TierPicker({
  options,
  value,
  onChange,
}: {
  options: ServiceOptionsTiers;
  value: string;
  onChange: (tierId: string) => void;
}) {
  const t = usePick(STR);
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={t.choosePackageAria}>
      {options.tiers.map((tier) => {
        const selected = tier.id === value;
        return (
          <button
            key={tier.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(tier.id)}
            className={cn(
              "relative flex items-center justify-between gap-3 rounded-xl border bg-surface-2 p-3.5 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
              selected
                ? "border-yellow shadow-glow-amber"
                : "border-border hover:border-border-strong",
            )}
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-yellow bg-yellow text-text-on-yellow"
                    : "border-border-strong bg-surface",
                )}
              >
                {selected ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
              </span>
              <span className="text-sm font-semibold text-text">{tier.label}</span>
            </span>
            <span className="tabular-nums-mono shrink-0 text-sm font-bold text-yellow">
              {formatPrice(tier.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Option configurator — kéo rank (rank_range)
// ---------------------------------------------------------------------------

function RankRangePicker({
  options,
  fromId,
  toId,
  onFromChange,
  onToChange,
}: {
  options: ServiceOptionsRankRange;
  fromId: string;
  toId: string;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
}) {
  const t = usePick(STR);
  const fromIdx = options.ranks.findIndex((r) => r.id === fromId);
  const toIdx = options.ranks.findIndex((r) => r.id === toId);
  const invalid = fromIdx >= 0 && toIdx >= 0 && toIdx <= fromIdx;
  const steps = fromIdx >= 0 && toIdx > fromIdx ? toIdx - fromIdx : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="rank-from">{t.from}</Label>
          <Select
            id="rank-from"
            value={fromId}
            onChange={(e) => onFromChange(e.target.value)}
          >
            {options.ranks.map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="rank-to">{t.to}</Label>
          <Select id="rank-to" value={toId} onChange={(e) => onToChange(e.target.value)}>
            {options.ranks.map((rank) => (
              <option key={rank.id} value={rank.id}>
                {rank.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {invalid ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {t.rankInvalid}
        </p>
      ) : steps > 0 ? (
        <p className="text-xs text-text-muted">
          {t.stepsCount(steps)} × <span className="tabular-nums-mono">{formatPrice(options.step_price)}</span>{" "}
          {t.perStep}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function ItemDetail() {
  const t = usePick(STR);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const [qty, setQty] = useState(1);
  const [tierId, setTierId] = useState<string | null>(null);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: isSupabaseConfigured && !!id,
  });
  const product = productQuery.data ?? null;

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories({ activeOnly: true }),
    enabled: isSupabaseConfigured,
  });
  const category = useMemo(
    () => (categoriesQuery.data ?? []).find((c) => c.id === product?.category_id) ?? null,
    [categoriesQuery.data, product],
  );

  const relatedQuery = useQuery({
    queryKey: ["products", category?.slug ?? "all"],
    queryFn: () => listProducts({ categorySlug: category!.slug }),
    enabled: isSupabaseConfigured && !!category,
  });
  const related = useMemo(
    () => (relatedQuery.data ?? []).filter((p) => p.id !== product?.id).slice(0, 4),
    [relatedQuery.data, product],
  );

  if (!isSupabaseConfigured) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <SetupNotice />
      </PageContainer>
    );
  }

  if (productQuery.isPending) {
    return (
      <PageContainer className="py-8 sm:py-10">
        <Skeleton className="h-5 w-72" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (productQuery.isError) {
    return (
      <PageContainer className="py-20">
        <EmptyState
          icon={PackageSearch}
          title={t.loadErrorTitle}
          description={t.connectError}
          action={
            <Button type="button" variant="primary" size="md" onClick={() => productQuery.refetch()}>
              {t.retry}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // Not-found state
  if (!product) {
    return (
      <PageContainer className="py-20">
        <EmptyState
          icon={PackageSearch}
          title={t.notFoundTitle}
          description={t.notFoundDesc}
          action={
            <Link to="/games">
              <Button type="button" variant="primary" size="md">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t.backToGames}
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <ItemDetailContent
      product={product}
      categoryName={category?.name ?? null}
      categorySlug={category?.slug ?? null}
      accent={category?.accent_color || DEFAULT_ACCENT}
      related={related}
      qty={qty}
      setQty={setQty}
      tierId={tierId}
      setTierId={setTierId}
      fromId={fromId}
      setFromId={setFromId}
      toId={toId}
      setToId={setToId}
      addItem={addItem}
      navigate={navigate}
    />
  );
}

function ItemDetailContent({
  product,
  categoryName,
  categorySlug,
  accent,
  related,
  qty,
  setQty,
  tierId,
  setTierId,
  fromId,
  setFromId,
  toId,
  setToId,
  addItem,
  navigate,
}: {
  product: ProductRow;
  categoryName: string | null;
  categorySlug: string | null;
  accent: string;
  related: ProductRow[];
  qty: number;
  setQty: (updater: (q: number) => number) => void;
  tierId: string | null;
  setTierId: (id: string) => void;
  fromId: string | null;
  setFromId: (id: string) => void;
  toId: string | null;
  setToId: (id: string) => void;
  addItem: ReturnType<typeof useCartStore.getState>["addItem"];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const t = usePick(STR);
  const isService = product.kind === "service";
  const opts = product.service_options;
  const inStock = isInStock(product);
  const imageUrl = product.images[0] ?? null;

  // --- Lựa chọn hiện tại (với mặc định hợp lý khi khách chưa bấm gì) --------
  let selectedOptions: SelectedServiceOptions | null = null;
  let optionSummary: string | undefined;
  let optionsValid = true;

  if (isService && opts) {
    if (opts.type === "tiers") {
      const activeTierId = tierId ?? opts.tiers[0]?.id ?? null;
      const tier = opts.tiers.find((t) => t.id === activeTierId) ?? null;
      if (tier) {
        selectedOptions = { tier_id: tier.id };
        optionSummary = tier.label;
      } else {
        optionsValid = false;
      }
    } else {
      const activeFrom = fromId ?? opts.ranks[0]?.id ?? "";
      const activeTo = toId ?? opts.ranks[1]?.id ?? "";
      const fromIdx = opts.ranks.findIndex((r) => r.id === activeFrom);
      const toIdx = opts.ranks.findIndex((r) => r.id === activeTo);
      if (fromIdx >= 0 && toIdx > fromIdx) {
        selectedOptions = { from: activeFrom, to: activeTo };
        optionSummary = `${opts.ranks[fromIdx].label} → ${opts.ranks[toIdx].label}`;
      } else {
        optionsValid = false;
      }
    }
  }

  // Giá hiển thị cập nhật trực tiếp theo lựa chọn (server tính lại khi đặt).
  const displayPrice = computeUnitPrice(product, selectedOptions);
  const showOriginal = !isService || !opts ? product.original_price : null;

  const maxQty = product.stock === null ? 99 : Math.max(product.stock, 1);
  const lowStock = !isService && inStock && product.stock !== null && product.stock <= 5;

  const clamp = (n: number) => Math.max(1, Math.min(maxQty, n));

  const canBuy = inStock && (!isService || !opts || optionsValid);

  const handleAdd = () => {
    if (!canBuy) return;
    addItem(product, isService ? 1 : qty, {
      selectedOptions,
      optionSummary,
    });
    toast.success(t.addedToCart(product.name), {
      description: optionSummary ?? t.quantitySummary(isService ? 1 : qty),
    });
  };

  const handleBuyNow = () => {
    if (!canBuy) return;
    // Mua ngay: chỉ món này qua thẳng checkout (không đụng giỏ hàng).
    navigate("/checkout", {
      state: { buyNow: buildCartLine(product, isService ? 1 : qty, { selectedOptions, optionSummary }) },
    });
  };

  return (
    <PageContainer className="py-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: t.home, to: "/" },
          { label: t.games, to: "/games" },
          ...(categoryName && categorySlug
            ? [{ label: categoryName, to: `/games/${categorySlug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image */}
        <div>
          <div
            className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border"
            style={{
              background: `linear-gradient(135deg, ${accent}30 0%, ${accent}0D 55%, transparent 100%)`,
            }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-50"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, ${accent}55, transparent 60%)`,
                  }}
                />
                <span
                  className="relative font-heading text-6xl font-extrabold tracking-tight sm:text-7xl"
                  style={{ color: accent }}
                >
                  {initialsOf(product.name)}
                </span>
              </>
            )}
            {categoryName && categorySlug ? (
              <Link
                to={`/games/${categorySlug}`}
                className="absolute bottom-4 left-4 rounded-full border border-border-strong px-3 py-1 text-xs font-semibold text-text-muted backdrop-blur transition-colors hover:text-yellow"
                style={{ backgroundColor: "rgba(10, 17, 11, 0.8)" }}
              >
                {categoryName}
              </Link>
            ) : null}
          </div>
          {/* Trust badges */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: t.trustFast },
              { icon: ShieldCheck, label: t.trustSafe },
              { icon: BadgeCheck, label: t.trustProof },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface p-3 text-center"
              >
                <Icon className="h-5 w-5 text-green" aria-hidden="true" />
                <span className="text-[11px] font-medium text-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.rarity ? <RarityBadge rarity={product.rarity} /> : null}
              <Badge variant={isService ? "green" : "outline"}>
                {isService ? t.service : t.item}
              </Badge>
              {product.is_featured ? <Badge variant="gold">{t.featured}</Badge> : null}
            </div>
            <h1 className="font-heading text-3xl font-extrabold text-text sm:text-4xl">
              {product.name}
            </h1>
            <PriceTag price={displayPrice} originalPrice={showOriginal} size="lg" />
          </div>

          {/* Stock + delivery */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {!isService ? (
              inStock ? (
                lowStock ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-warning">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    {t.lowStock(product.stock ?? 0)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {t.inStock}{product.stock !== null ? ` (${product.stock})` : ""}
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  {t.outOfStock}
                </span>
              )
            ) : null}
            {product.delivery_time_text ? (
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                <Zap className="h-4 w-4 text-yellow" aria-hidden="true" />
                {t.timeLabel} <span className="font-medium text-text">{product.delivery_time_text}</span>
              </span>
            ) : null}
          </div>

          {/* Option configurator (dịch vụ) + quantity + actions */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
            {isService && opts ? (
              <div>
                <p className="mb-2.5 text-sm font-medium text-text">
                  {opts.type === "tiers" ? t.choosePackage : t.chooseRankRange}
                </p>
                {opts.type === "tiers" ? (
                  <TierPicker
                    options={opts}
                    value={tierId ?? opts.tiers[0]?.id ?? ""}
                    onChange={setTierId}
                  />
                ) : (
                  <RankRangePicker
                    options={opts}
                    fromId={fromId ?? opts.ranks[0]?.id ?? ""}
                    toId={toId ?? opts.ranks[1]?.id ?? ""}
                    onFromChange={setFromId}
                    onToChange={setToId}
                  />
                )}
              </div>
            ) : null}

            {!isService ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-text">{t.quantity}</span>
                <div className="flex items-center gap-1 rounded-lg border border-border-strong bg-surface-2 p-1">
                  <button
                    type="button"
                    onClick={() => setQty((q) => clamp(q - 1))}
                    disabled={!inStock || qty <= 1}
                    aria-label={t.decreaseQty}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-3 hover:text-text disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums text-text">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => clamp(q + 1))}
                    disabled={!inStock || qty >= maxQty}
                    aria-label={t.increaseQty}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-3 hover:text-text disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!canBuy}
                onClick={handleAdd}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {!inStock ? t.outOfStock : t.addToCart}
              </Button>
              <Button
                type="button"
                variant="gold"
                size="lg"
                className="flex-1"
                disabled={!canBuy}
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                {t.buyNow}
              </Button>
            </div>
          </div>

          {/* Description */}
          {product.description ? (
            <div>
              <h2 className="mb-2 font-heading text-lg font-semibold text-text">{t.description}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                {product.description}
              </p>
            </div>
          ) : null}

          {/* Attributes */}
          <div>
            <h2 className="mb-3 font-heading text-lg font-semibold text-text">{t.info}</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                <dt className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                  <Boxes className="h-4 w-4" aria-hidden="true" />
                  {t.typeLabel}
                </dt>
                <dd className="text-sm font-medium text-text">
                  {isService ? t.service : t.item}
                </dd>
              </div>
              {product.rarity ? (
                <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                  <dt className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    {t.rarityLabel}
                  </dt>
                  <dd className="text-sm font-medium text-text">{product.rarity}</dd>
                </div>
              ) : null}
              {product.delivery_time_text ? (
                <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                  <dt className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                    <Truck className="h-4 w-4" aria-hidden="true" />
                    {t.deliveryTime}
                  </dt>
                  <dd className="text-sm font-medium text-text">{product.delivery_time_text}</dd>
                </div>
              ) : null}
              {!isService && product.stock !== null ? (
                <div className="flex items-center justify-between gap-3 border-b border-border py-2">
                  <dt className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                    <Boxes className="h-4 w-4" aria-hidden="true" />
                    {t.stockLabel}
                  </dt>
                  <dd className="font-mono text-sm font-medium tabular-nums text-text">
                    {product.stock}
                  </dd>
                </div>
              ) : null}
            </dl>

            {product.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-text-subtle" aria-hidden="true" />
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {/* Delivery-method note */}
          <div className="rounded-2xl border border-border bg-bg-subtle p-4">
            <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold text-text">
              <Truck className="h-4 w-4 text-yellow" aria-hidden="true" />
              {t.deliveryMethod}
            </h3>
            <p className="mt-1.5 text-sm text-text-muted">
              {t.deliveryNote}
            </p>
          </div>
        </div>
      </div>

      {/* Related items */}
      {related.length > 0 ? (
        <section className="mt-14">
          <SectionHeading
            eyebrow={t.relatedEyebrow}
            title={t.relatedTitle}
            action={
              categorySlug ? (
                <Link
                  to={`/games/${categorySlug}`}
                  className="text-sm font-semibold text-yellow transition-colors hover:text-yellow-hover"
                >
                  {t.viewAll}
                </Link>
              ) : undefined
            }
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
