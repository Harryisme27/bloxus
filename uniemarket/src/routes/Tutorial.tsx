import { Link } from "react-router-dom";
import {
  Gamepad2,
  PackageSearch,
  CreditCard,
  Gift,
  PlayCircle,
  Zap,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/content/StepCard";
import { usePick } from "@/i18n";

const STEP_ICONS = [Gamepad2, PackageSearch, CreditCard, Gift];
const DELIVERY_ICONS = [UserCheck, Zap, ShieldCheck];

const STR = {
  vi: {
    badge: "Hướng dẫn",
    heading: "Cách thức hoạt động",
    subtitle:
      "Chỉ 4 bước đơn giản để sở hữu vật phẩm Roblox bạn mong muốn. Nhanh, an toàn và có minh chứng.",
    deliveryEyebrow: "Giao hàng",
    deliveryTitle: "Vật phẩm đến tay bạn thế nào?",
    deliveryDescription:
      "Chúng tôi giao trực tiếp trong game để đảm bảo an toàn tuyệt đối cho tài khoản của bạn.",
    videoEyebrow: "Xem nhanh",
    videoTitle: "Video hướng dẫn",
    videoDescription: "Xem toàn bộ quy trình mua hàng chỉ trong 60 giây.",
    videoComingSoon: "Video sắp ra mắt",
    videoDemoNote: "Nội dung demo — trình phát chỉ mang tính minh hoạ.",
    faqTitle: "Còn thắc mắc?",
    faqBody: "Xem thêm các câu hỏi thường gặp về đặt hàng, giao hàng và hoàn tiền.",
    faqButton: "Đến trang FAQ",
    steps: [
      {
        title: "Chọn game",
        description:
          "Duyệt danh sách các game Roblox chúng tôi hỗ trợ như Adopt Me, Blox Fruits, MM2... và chọn game bạn đang chơi.",
      },
      {
        title: "Chọn vật phẩm",
        description:
          "Lựa chọn vật phẩm yêu thích, xem giá, độ hiếm và thời gian giao. Thêm vào giỏ hàng — có thể mua nhiều vật phẩm cùng lúc.",
      },
      {
        title: "Thanh toán",
        description:
          "Nhập username Roblox và hoàn tất thanh toán mô phỏng. Đây là bản demo nên bạn không mất bất kỳ khoản tiền thật nào.",
      },
      {
        title: "Nhận trong game",
        description:
          "Nhân viên sẽ vào game và trao vật phẩm trực tiếp cho nhân vật của bạn, kèm ảnh minh chứng. Thường chỉ mất 5–15 phút.",
      },
    ],
    delivery: [
      {
        title: "Giao tận tay trong game",
        text: "Nhân viên vào chung server và trao vật phẩm qua tính năng trade — an toàn và minh bạch.",
      },
      {
        title: "Nhanh chóng",
        text: "Đa số đơn hoàn tất trong vòng vài phút. Bạn được cập nhật tiến độ suốt quá trình.",
      },
      {
        title: "Không cần mật khẩu",
        text: "Chúng tôi chỉ cần username Roblox của bạn — tuyệt đối không hỏi mật khẩu tài khoản.",
      },
    ],
  },
  en: {
    badge: "Guide",
    heading: "How it works",
    subtitle:
      "Just 4 simple steps to get the Roblox item you want. Fast, safe, and backed by proof.",
    deliveryEyebrow: "Delivery",
    deliveryTitle: "How items reach you",
    deliveryDescription:
      "We deliver directly in-game to keep your account completely safe.",
    videoEyebrow: "Quick look",
    videoTitle: "Video guide",
    videoDescription: "See the whole buying process in just 60 seconds.",
    videoComingSoon: "Video coming soon",
    videoDemoNote: "Demo content — this player is for illustration only.",
    faqTitle: "Still have questions?",
    faqBody: "Browse more frequently asked questions about ordering, delivery, and refunds.",
    faqButton: "Go to the FAQ",
    steps: [
      {
        title: "Choose a game",
        description:
          "Browse the Roblox games we support — Adopt Me, Blox Fruits, MM2, and more — and pick the one you're playing.",
      },
      {
        title: "Choose your items",
        description:
          "Pick the items you want, check the price, rarity, and delivery time. Add them to your cart — you can buy several items at once.",
      },
      {
        title: "Checkout",
        description:
          "Enter your Roblox username and complete the simulated payment. This is a demo, so you won't spend any real money.",
      },
      {
        title: "Receive in-game",
        description:
          "Our staff join the game and hand the item directly to your character, along with proof photos. It usually takes just 5–15 minutes.",
      },
    ],
    delivery: [
      {
        title: "Delivered by hand in-game",
        text: "Our staff join the same server and hand over the item through the trade feature — safe and transparent.",
      },
      {
        title: "Fast",
        text: "Most orders are completed within minutes. You're kept up to date the whole way through.",
      },
      {
        title: "No password needed",
        text: "We only need your Roblox username — we never ask for your account password.",
      },
    ],
  },
};

export function Tutorial() {
  const t = usePick(STR);
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="border-b border-border bg-bg-subtle">
        <PageContainer className="py-14 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t.badge}
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mx-auto mt-4 text-text-muted">
              {t.subtitle}
            </p>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="pt-14">
        {/* Steps */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_ICONS.map((Icon, i) => (
            <StepCard
              key={i}
              step={i + 1}
              icon={Icon}
              title={t.steps[i].title}
              description={t.steps[i].description}
            />
          ))}
        </div>

        {/* Delivery explainer */}
        <div className="mt-20">
          <SectionHeading
            eyebrow={t.deliveryEyebrow}
            title={t.deliveryTitle}
            description={t.deliveryDescription}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {DELIVERY_ICONS.map((Icon, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-base font-semibold text-text">{t.delivery[i].title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{t.delivery[i].text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Video placeholder */}
        <div className="mt-20">
          <SectionHeading
            eyebrow={t.videoEyebrow}
            title={t.videoTitle}
            description={t.videoDescription}
          />
          <div className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-2">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(50% 60% at 50% 50%, rgba(245,176,30,0.12) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow text-text-on-yellow shadow-glow-amber transition-transform group-hover:scale-105">
                <PlayCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="font-heading text-lg font-semibold text-text">{t.videoComingSoon}</p>
              <p className="text-sm text-text-subtle">{t.videoDemoNote}</p>
            </div>
          </div>
        </div>

        {/* FAQ CTA */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-gradient-to-br from-yellow-soft to-surface p-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow text-text-on-yellow">
              <HelpCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-text">{t.faqTitle}</h3>
              <p className="mt-1 text-sm text-text-muted">
                {t.faqBody}
              </p>
            </div>
          </div>
          <Link to="/faq" className="shrink-0">
            <Button variant="primary" size="lg">
              {t.faqButton}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
