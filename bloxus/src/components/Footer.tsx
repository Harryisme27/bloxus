import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { BRAND_NAME, DISCORD_URL, SUPPORT_EMAIL } from "@/lib/constants";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    logoAria: "Bloxus - Trang chủ",
    tagline: "Vật phẩm Roblox chính hãng, giao dịch nhanh, minh bạch từng đơn hàng.",
    joinDiscord: "Tham gia Discord",
    shopTitle: "Cửa hàng",
    accountTitle: "Tài khoản",
    companyTitle: "Công ty",
    allGames: "Tất cả trò chơi",
    proofs: "Minh chứng giao dịch",
    tutorial: "Hướng dẫn mua hàng",
    faq: "Câu hỏi thường gặp",
    login: "Đăng nhập",
    register: "Đăng ký",
    orderHistory: "Lịch sử đơn hàng",
    supportMessages: "Tin nhắn hỗ trợ",
    about: "Giới thiệu",
    contact: "Liên hệ",
    admin: "Khu vực quản trị",
    terms: "Điều khoản dịch vụ",
    privacy: "Chính sách bảo mật",
    refund: "Chính sách hoàn tiền",
  },
  en: {
    logoAria: "Bloxus - Home",
    tagline: "Genuine Roblox items, fast trades, and full transparency on every order.",
    joinDiscord: "Join Discord",
    shopTitle: "Shop",
    accountTitle: "Account",
    companyTitle: "Company",
    allGames: "All games",
    proofs: "Transaction proof",
    tutorial: "How to buy",
    faq: "FAQ",
    login: "Log in",
    register: "Sign up",
    orderHistory: "Order history",
    supportMessages: "Support messages",
    about: "About",
    contact: "Contact",
    admin: "Admin area",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
  },
};

export function Footer() {
  const t = usePick(STR);
  const shopLinks = [
    { to: "/games", label: t.allGames },
    { to: "/proofs", label: t.proofs },
    { to: "/tutorial", label: t.tutorial },
    { to: "/faq", label: t.faq },
  ];
  const accountLinks = [
    { to: "/login", label: t.login },
    { to: "/register", label: t.register },
    { to: "/orders", label: t.orderHistory },
    { to: "/messages", label: t.supportMessages },
  ];
  const companyLinks = [
    { to: "/about", label: t.about },
    { to: "/contact", label: t.contact },
    { to: "/admin", label: t.admin },
  ];
  const legalLinks = [
    { to: "/terms", label: t.terms },
    { to: "/privacy", label: t.privacy },
    { to: "/refund", label: t.refund },
  ];
  return (
    <footer className="border-t border-border bg-bg-subtle">
      <PageContainer className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-2">
          <Link to="/" className="w-fit" aria-label={t.logoAria}>
            <img src="/logo-bloxus.png" alt="Bloxus" className="h-8 w-auto" />
          </Link>
          <p className="max-w-xs text-sm text-text-muted">{t.tagline}</p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-fit"
          >
            <Button variant="gold" size="sm">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t.joinDiscord}
            </Button>
          </a>
        </div>

        <FooterColumn title={t.shopTitle} links={shopLinks} />
        <FooterColumn title={t.accountTitle} links={accountLinks} />
        <FooterColumn title={t.companyTitle} links={companyLinks} />
      </PageContainer>

      <div className="border-t border-border">
        <PageContainer className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-subtle">
            <span>
              &copy; {new Date().getFullYear()} {BRAND_NAME}.
            </span>
            {legalLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-text-muted">
                {link.label}
              </Link>
            ))}
            <span>{SUPPORT_EMAIL}</span>
          </div>

        </PageContainer>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {links.map((link) => (
        <Link key={link.to} to={link.to} className="text-sm text-text-muted hover:text-text">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
