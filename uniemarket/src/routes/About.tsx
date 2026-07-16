import { Link } from "react-router-dom";
import {
  Zap,
  ShieldCheck,
  BadgeCheck,
  HeartHandshake,
  Clock,
  Lock,
  Sparkles,
  MessageCircle,
  ArrowRight,
  Target,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { CountUpStat } from "@/components/content/CountUpStat";
import { BRAND_NAME, DISCORD_URL } from "@/lib/constants";

const REASONS = [
  {
    icon: Zap,
    title: "Giao hàng siêu tốc",
    text: "Đa số đơn được trao trong game chỉ sau 5–15 phút. Nhân viên trực gần như 24/7 để bạn không phải chờ lâu.",
  },
  {
    icon: ShieldCheck,
    title: "Minh bạch tuyệt đối",
    text: "Mỗi đơn hoàn tất đều có bản ghi minh chứng kèm ảnh giao hàng — bạn luôn kiểm chứng được.",
  },
  {
    icon: Lock,
    title: "An toàn tài khoản",
    text: "Chúng tôi không bao giờ hỏi mật khẩu Roblox của bạn. Giao dịch diễn ra ngay trong game một cách an toàn.",
  },
  {
    icon: BadgeCheck,
    title: "Hàng chính xác",
    text: "Đúng vật phẩm, đúng số lượng như mô tả. Nếu sai sót từ phía chúng tôi, bạn được hỗ trợ hoặc hoàn tiền.",
  },
  {
    icon: HeartHandshake,
    title: "Hỗ trợ tận tâm",
    text: "Đội ngũ CSKH thân thiện, phản hồi nhanh qua chat và Discord, đồng hành cùng bạn từ đầu đến cuối.",
  },
  {
    icon: Clock,
    title: "Giá tốt, ổn định",
    text: "Mức giá cạnh tranh và rõ ràng, không phí ẩn. Thường xuyên có ưu đãi cho các vật phẩm hot.",
  },
];

export function About() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-bg-subtle">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(245,176,30,0.1) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <PageContainer className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Câu chuyện của {BRAND_NAME}
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              Chợ vật phẩm Roblox <span className="text-yellow">uy tín</span> cho mọi game thủ
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
              {BRAND_NAME} ra đời với một mục tiêu đơn giản: mua vật phẩm Roblox phải{" "}
              <span className="font-semibold text-text">nhanh</span>,{" "}
              <span className="font-semibold text-text">an toàn</span> và{" "}
              <span className="font-semibold text-text">có minh chứng</span> — để bạn yên tâm tận
              hưởng cuộc chơi, không phải lo lắng.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/games">
                <Button variant="primary" size="lg">
                  Khám phá vật phẩm
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/proofs">
                <Button variant="secondary" size="lg">
                  <ShieldCheck className="h-5 w-5" />
                  Xem minh chứng
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="pt-16">
        {/* Mission */}
        <div className="grid gap-8 rounded-2xl border border-border bg-surface p-8 sm:p-10 lg:grid-cols-[auto,1fr] lg:items-start lg:gap-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow text-text-on-yellow">
            <Target className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow">Sứ mệnh</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-text sm:text-3xl">
              Biến việc mua vật phẩm Roblox trở nên đáng tin
            </h2>
            <div className="mt-4 space-y-4 text-text-muted">
              <p>
                Thị trường vật phẩm Roblox có quá nhiều nơi bán mập mờ, giao chậm, thậm chí lừa đảo.
                Chúng tôi tin rằng game thủ xứng đáng có một trải nghiệm tốt hơn: rõ ràng về giá,
                nhanh chóng khi giao, và luôn có bằng chứng cho mỗi giao dịch.
              </p>
              <p>
                Vì vậy, {BRAND_NAME} xây dựng quy trình lấy sự minh bạch làm gốc — từ trang minh
                chứng công khai, đội ngũ hỗ trợ trực tuyến, đến chính sách bảo vệ người mua. Chúng
                tôi muốn trở thành cái tên bạn nghĩ đến đầu tiên khi cần bất kỳ vật phẩm nào.
              </p>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CountUpStat icon={Zap} target={12480} suffix="+" label="Đơn đã giao" />
          <CountUpStat icon={HeartHandshake} target={8900} suffix="+" label="Khách hàng tin dùng" />
          <CountUpStat icon={Clock} target={9} prefix="~" suffix=" phút" label="Giao trung bình" />
          <CountUpStat icon={ShieldCheck} target={100} suffix="%" label="Đơn có minh chứng" />
        </div>

        {/* Why choose us */}
        <div className="mt-20">
          <SectionHeading
            eyebrow="Giá trị cốt lõi"
            title="Vì sao chọn chúng tôi"
            description="Những điều làm nên sự khác biệt của Uniemarket so với các nơi khác."
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-soft text-yellow transition-colors group-hover:bg-yellow group-hover:text-text-on-yellow">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-text">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discord CTA */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-yellow-soft to-surface p-8 sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-heading text-2xl font-bold text-text">
                Có câu hỏi? Cộng đồng luôn sẵn sàng
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Tham gia Discord của {BRAND_NAME} để được hỗ trợ nhanh, cập nhật hàng mới và nhận ưu
                đãi độc quyền.
              </p>
            </div>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="shrink-0">
              <Button variant="primary" size="lg">
                <MessageCircle className="h-5 w-5" />
                Tham gia Discord
              </Button>
            </a>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
