import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { HeroPlayground } from "@/components/storefront/HeroPlayground";
import { buttonVariants } from "@/components/ui/button";
import { usePick } from "@/i18n";
import { cn } from "@/lib/utils";

const STR = {
  vi: {
    headlineLead: "Vật phẩm & dịch vụ game,",
    headlineAccent: "giao nhanh chóng",
    subtitle:
      "Bloxus là cửa hàng vật phẩm và dịch vụ trong game uy tín: pet hiếm, tài khoản, cày thuê, kéo rank và hơn thế nữa — giá tốt, giao dịch minh bạch, có minh chứng cho từng đơn.",
    shopNow: "Mua ngay",
    viewProofs: "Xem minh chứng",
    support: "Hỗ trợ 24/7",
    safe: "Giao dịch an toàn",
    realProof: "Minh chứng thật cho mọi đơn",
  },
  en: {
    headlineLead: "Game items & services,",
    headlineAccent: "delivered fast",
    subtitle:
      "Bloxus is a trusted in-game item and service store: rare pets, accounts, boosting, rank carries and more — great prices, transparent transactions, and proof for every order.",
    shopNow: "Shop now",
    viewProofs: "View proofs",
    support: "24/7 support",
    safe: "Safe transactions",
    realProof: "Real proof for every order",
  },
};

/** Landing hero: BLOXUS logo, brand headline, dual CTAs, and a subtle grid + warm amber-glow motif. */
export function HeroSection() {
  const t = usePick(STR);
  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      {/* Cube-grid motif, faded toward the edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, #000 40%, transparent 100%)",
        }}
      />
      {/* Warm amber glow blooms */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(245, 176, 30, 0.14)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-32 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(245, 176, 30, 0.08)" }}
      />

      {/* Sân chơi coin lát chanh: tóm - kéo - ném được (vùng trống của hero). */}
      <HeroPlayground />

      <PageContainer className="pointer-events-none relative z-10 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <img
            src="/logo-bloxus.png?v=2"
            alt="BLOXUS"
            className="um-enter um-enter-1 um-float mb-6 h-28 w-auto drop-shadow-[0_12px_40px_rgba(245,176,30,0.35)] md:h-36"
          />

          <h1 className="um-enter um-enter-2 font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-text sm:text-5xl">
            {t.headlineLead}{" "}
            <span className="text-yellow">{t.headlineAccent}</span>
          </h1>

          <p className="um-enter um-enter-3 mt-5 max-w-2xl text-base text-text-muted sm:text-lg">
            {t.subtitle}
          </p>

          <div className="um-enter um-enter-4 pointer-events-auto mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/games" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "group")}>
              {t.shopNow}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link to="/proofs" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              {t.viewProofs}
            </Link>
          </div>

          <div className="um-enter um-enter-5 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow" aria-hidden="true" />
              {t.support}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-green" aria-hidden="true" />
              {t.safe}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-green" aria-hidden="true" />
              {t.realProof}
            </span>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
