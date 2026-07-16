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

const STEPS = [
  {
    icon: Gamepad2,
    title: "Chọn game",
    description:
      "Duyệt danh sách các game Roblox chúng tôi hỗ trợ như Adopt Me, Blox Fruits, MM2... và chọn game bạn đang chơi.",
  },
  {
    icon: PackageSearch,
    title: "Chọn vật phẩm",
    description:
      "Lựa chọn vật phẩm yêu thích, xem giá, độ hiếm và thời gian giao. Thêm vào giỏ hàng — có thể mua nhiều vật phẩm cùng lúc.",
  },
  {
    icon: CreditCard,
    title: "Thanh toán",
    description:
      "Nhập username Roblox và hoàn tất thanh toán mô phỏng. Đây là bản demo nên bạn không mất bất kỳ khoản tiền thật nào.",
  },
  {
    icon: Gift,
    title: "Nhận trong game",
    description:
      "Nhân viên sẽ vào game và trao vật phẩm trực tiếp cho nhân vật của bạn, kèm ảnh minh chứng. Thường chỉ mất 5–15 phút.",
  },
];

const DELIVERY_POINTS = [
  {
    icon: UserCheck,
    title: "Giao tận tay trong game",
    text: "Nhân viên vào chung server và trao vật phẩm qua tính năng trade — an toàn và minh bạch.",
  },
  {
    icon: Zap,
    title: "Nhanh chóng",
    text: "Đa số đơn hoàn tất trong vòng vài phút. Bạn được cập nhật tiến độ suốt quá trình.",
  },
  {
    icon: ShieldCheck,
    title: "Không cần mật khẩu",
    text: "Chúng tôi chỉ cần username Roblox của bạn — tuyệt đối không hỏi mật khẩu tài khoản.",
  },
];

export function Tutorial() {
  return (
    <div className="pb-20">
      {/* Header */}
      <div className="border-b border-border bg-bg-subtle">
        <PageContainer className="py-14 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Hướng dẫn
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              Cách thức hoạt động
            </h1>
            <p className="mx-auto mt-4 text-text-muted">
              Chỉ 4 bước đơn giản để sở hữu vật phẩm Roblox bạn mong muốn. Nhanh, an toàn và có minh
              chứng.
            </p>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="pt-14">
        {/* Steps */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <StepCard
              key={step.title}
              step={i + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>

        {/* Delivery explainer */}
        <div className="mt-20">
          <SectionHeading
            eyebrow="Giao hàng"
            title="Vật phẩm đến tay bạn thế nào?"
            description="Chúng tôi giao trực tiếp trong game để đảm bảo an toàn tuyệt đối cho tài khoản của bạn."
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {DELIVERY_POINTS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-base font-semibold text-text">{title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Video placeholder */}
        <div className="mt-20">
          <SectionHeading
            eyebrow="Xem nhanh"
            title="Video hướng dẫn"
            description="Xem toàn bộ quy trình mua hàng chỉ trong 60 giây."
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
              <p className="font-heading text-lg font-semibold text-text">Video sắp ra mắt</p>
              <p className="text-sm text-text-subtle">Nội dung demo — trình phát chỉ mang tính minh hoạ.</p>
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
              <h3 className="font-heading text-xl font-bold text-text">Còn thắc mắc?</h3>
              <p className="mt-1 text-sm text-text-muted">
                Xem thêm các câu hỏi thường gặp về đặt hàng, giao hàng và hoàn tiền.
              </p>
            </div>
          </div>
          <Link to="/faq" className="shrink-0">
            <Button variant="primary" size="lg">
              Đến trang FAQ
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
