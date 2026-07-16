import { Link } from "react-router-dom";
import { MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { BRAND_NAME, DISCORD_URL, SUPPORT_EMAIL, TAGLINE } from "@/lib/constants";

// Every zustand persist() store in this app writes to one of these
// localStorage keys — see store/*.ts. Resetting the demo just clears them
// and reloads, dropping the app back to its first-run state.
const DEMO_STORAGE_KEYS = [
  "uniemarket-cart",
  "uniemarket-auth",
  "uniemarket-orders",
  "uniemarket-demo",
];

const SHOP_LINKS = [
  { to: "/games", label: "Tất cả trò chơi" },
  { to: "/proofs", label: "Minh chứng giao dịch" },
  { to: "/tutorial", label: "Hướng dẫn mua hàng" },
  { to: "/faq", label: "Câu hỏi thường gặp" },
];

const ACCOUNT_LINKS = [
  { to: "/login", label: "Đăng nhập" },
  { to: "/register", label: "Đăng ký" },
  { to: "/orders", label: "Lịch sử đơn hàng" },
  { to: "/messages", label: "Tin nhắn hỗ trợ" },
];

const COMPANY_LINKS = [
  { to: "/about", label: "Giới thiệu" },
  { to: "/contact", label: "Liên hệ" },
  { to: "/admin", label: "Khu vực quản trị" },
];

const LEGAL_LINKS = [
  { to: "/terms", label: "Điều khoản dịch vụ" },
  { to: "/privacy", label: "Chính sách bảo mật" },
  { to: "/refund", label: "Chính sách hoàn tiền" },
];

function handleResetDemo() {
  DEMO_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  toast.success("Đã reset demo. Đang tải lại trang...");
  setTimeout(() => window.location.reload(), 600);
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-subtle">
      <PageContainer className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-2">
          <Link to="/" className="w-fit" aria-label="Uniemarket - Trang chủ">
            <img src="/logo-unie.png" alt="Uniemarket" className="h-8 w-auto" />
          </Link>
          <p className="max-w-xs text-sm text-text-muted">{TAGLINE}</p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-fit"
          >
            <Button variant="gold" size="sm">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Tham gia Discord
            </Button>
          </a>
        </div>

        <FooterColumn title="Cửa hàng" links={SHOP_LINKS} />
        <FooterColumn title="Tài khoản" links={ACCOUNT_LINKS} />
        <FooterColumn title="Công ty" links={COMPANY_LINKS} />
      </PageContainer>

      <div className="border-t border-border">
        <PageContainer className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-subtle">
            <span>
              &copy; {new Date().getFullYear()} {BRAND_NAME}. Bản demo — không thanh toán thật.
            </span>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-text-muted">
                {link.label}
              </Link>
            ))}
            <span>{SUPPORT_EMAIL}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border-strong bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-subtle">
              DEMO — không thanh toán thật
            </span>
            <Button variant="ghost" size="sm" onClick={handleResetDemo}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset demo
            </Button>
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
