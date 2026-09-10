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
import { usePick } from "@/i18n";

const REASON_ICONS = [Zap, ShieldCheck, Lock, BadgeCheck, HeartHandshake, Clock];

const STR = {
  vi: {
    storyBadge: "Câu chuyện của",
    heroPre: "Chợ vật phẩm Roblox",
    heroHighlight: "uy tín",
    heroPost: "cho mọi game thủ",
    leadIntro: "ra đời với một mục tiêu đơn giản: mua vật phẩm Roblox phải",
    leadFast: "nhanh",
    leadSafe: "an toàn",
    leadAnd: "và",
    leadProof: "có minh chứng",
    leadOutro: "— để bạn yên tâm tận hưởng cuộc chơi, không phải lo lắng.",
    exploreItems: "Khám phá vật phẩm",
    viewProof: "Xem minh chứng",
    missionEyebrow: "Sứ mệnh",
    missionTitle: "Biến việc mua vật phẩm Roblox trở nên đáng tin",
    missionP1:
      "Thị trường vật phẩm Roblox có quá nhiều nơi bán mập mờ, giao chậm, thậm chí lừa đảo. Chúng tôi tin rằng game thủ xứng đáng có một trải nghiệm tốt hơn: rõ ràng về giá, nhanh chóng khi giao, và luôn có bằng chứng cho mỗi giao dịch.",
    missionP2Pre: "Vì vậy,",
    missionP2Post:
      "xây dựng quy trình lấy sự minh bạch làm gốc — từ trang minh chứng công khai, đội ngũ hỗ trợ trực tuyến, đến chính sách bảo vệ người mua. Chúng tôi muốn trở thành cái tên bạn nghĩ đến đầu tiên khi cần bất kỳ vật phẩm nào.",
    statDelivered: "Đơn đã giao",
    statCustomers: "Khách hàng tin dùng",
    statMinutes: " phút",
    statAvgDelivery: "Giao trung bình",
    statWithProof: "Đơn có minh chứng",
    valuesEyebrow: "Giá trị cốt lõi",
    valuesTitle: "Vì sao chọn chúng tôi",
    valuesDescription: "Những điều làm nên sự khác biệt của Bloxus so với các nơi khác.",
    ctaTitle: "Có câu hỏi? Cộng đồng luôn sẵn sàng",
    ctaPre: "Tham gia Discord của",
    ctaPost: "để được hỗ trợ nhanh, cập nhật hàng mới và nhận ưu đãi độc quyền.",
    ctaButton: "Tham gia Discord",
    reasons: [
      {
        title: "Giao hàng siêu tốc",
        text: "Đa số đơn được trao trong game chỉ sau 5–15 phút. Nhân viên trực gần như 24/7 để bạn không phải chờ lâu.",
      },
      {
        title: "Minh bạch tuyệt đối",
        text: "Mỗi đơn hoàn tất đều có bản ghi minh chứng kèm ảnh giao hàng — bạn luôn kiểm chứng được.",
      },
      {
        title: "An toàn tài khoản",
        text: "Chúng tôi không bao giờ hỏi mật khẩu Roblox của bạn. Giao dịch diễn ra ngay trong game một cách an toàn.",
      },
      {
        title: "Hàng chính xác",
        text: "Đúng vật phẩm, đúng số lượng như mô tả. Nếu sai sót từ phía chúng tôi, bạn được hỗ trợ hoặc hoàn tiền.",
      },
      {
        title: "Hỗ trợ tận tâm",
        text: "Đội ngũ CSKH thân thiện, phản hồi nhanh qua chat và Discord, đồng hành cùng bạn từ đầu đến cuối.",
      },
      {
        title: "Giá tốt, ổn định",
        text: "Mức giá cạnh tranh và rõ ràng, không phí ẩn. Thường xuyên có ưu đãi cho các vật phẩm hot.",
      },
    ],
  },
  en: {
    storyBadge: "The story of",
    heroPre: "The",
    heroHighlight: "trusted",
    heroPost: "Roblox item marketplace for every gamer",
    leadIntro: "was built with one simple goal: buying Roblox items should be",
    leadFast: "fast",
    leadSafe: "safe",
    leadAnd: "and",
    leadProof: "backed by proof",
    leadOutro: "— so you can enjoy the game with total peace of mind, no worries.",
    exploreItems: "Explore items",
    viewProof: "See the proof",
    missionEyebrow: "Our mission",
    missionTitle: "Making Roblox item purchases something you can trust",
    missionP1:
      "The Roblox item market is full of shady sellers, slow delivery, even scams. We believe gamers deserve a better experience: clear pricing, fast delivery, and proof for every transaction.",
    missionP2Pre: "That's why",
    missionP2Post:
      "built its whole process around transparency — from a public proof page and an online support team to a buyer-protection policy. We want to be the first name you think of whenever you need any item.",
    statDelivered: "Orders delivered",
    statCustomers: "Trusted customers",
    statMinutes: " min",
    statAvgDelivery: "Average delivery",
    statWithProof: "Orders with proof",
    valuesEyebrow: "Core values",
    valuesTitle: "Why choose us",
    valuesDescription: "What sets Bloxus apart from everywhere else.",
    ctaTitle: "Got questions? The community is here for you",
    ctaPre: "Join the",
    ctaPost: "Discord for fast support, new-stock updates, and exclusive deals.",
    ctaButton: "Join Discord",
    reasons: [
      {
        title: "Lightning-fast delivery",
        text: "Most orders are handed over in-game within just 5–15 minutes. Our staff are on duty nearly 24/7 so you never wait long.",
      },
      {
        title: "Total transparency",
        text: "Every completed order comes with a proof record and delivery photos — you can always verify it.",
      },
      {
        title: "Account safety",
        text: "We never ask for your Roblox password. Transactions happen safely, right inside the game.",
      },
      {
        title: "Exactly what you ordered",
        text: "The right item, the right quantity, just as described. If the mistake is ours, you get support or a refund.",
      },
      {
        title: "Dedicated support",
        text: "A friendly support team that replies fast over chat and Discord, with you from start to finish.",
      },
      {
        title: "Great, stable prices",
        text: "Competitive, clear pricing with no hidden fees. Regular deals on the hottest items.",
      },
    ],
  },
};

export function About() {
  const t = usePick(STR);
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
              {t.storyBadge} {BRAND_NAME}
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              {t.heroPre} <span className="text-yellow">{t.heroHighlight}</span> {t.heroPost}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-muted">
              {BRAND_NAME} {t.leadIntro}{" "}
              <span className="font-semibold text-text">{t.leadFast}</span>,{" "}
              <span className="font-semibold text-text">{t.leadSafe}</span> {t.leadAnd}{" "}
              <span className="font-semibold text-text">{t.leadProof}</span> {t.leadOutro}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/games">
                <Button variant="primary" size="lg">
                  {t.exploreItems}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/proofs">
                <Button variant="secondary" size="lg">
                  <ShieldCheck className="h-5 w-5" />
                  {t.viewProof}
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
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow">{t.missionEyebrow}</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-text sm:text-3xl">
              {t.missionTitle}
            </h2>
            <div className="mt-4 space-y-4 text-text-muted">
              <p>
                {t.missionP1}
              </p>
              <p>
                {t.missionP2Pre} {BRAND_NAME} {t.missionP2Post}
              </p>
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CountUpStat icon={Zap} target={12480} suffix="+" label={t.statDelivered} />
          <CountUpStat icon={HeartHandshake} target={8900} suffix="+" label={t.statCustomers} />
          <CountUpStat icon={Clock} target={9} prefix="~" suffix={t.statMinutes} label={t.statAvgDelivery} />
          <CountUpStat icon={ShieldCheck} target={100} suffix="%" label={t.statWithProof} />
        </div>

        {/* Why choose us */}
        <div className="mt-20">
          <SectionHeading
            eyebrow={t.valuesEyebrow}
            title={t.valuesTitle}
            description={t.valuesDescription}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {REASON_ICONS.map((Icon, i) => {
              const reason = t.reasons[i];
              return (
                <div
                  key={i}
                  className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-soft text-yellow transition-colors group-hover:bg-yellow group-hover:text-text-on-yellow">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-text">{reason.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{reason.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discord CTA */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-yellow-soft to-surface p-8 sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="font-heading text-2xl font-bold text-text">
                {t.ctaTitle}
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                {t.ctaPre} {BRAND_NAME} {t.ctaPost}
              </p>
            </div>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="shrink-0">
              <Button variant="primary" size="lg">
                <MessageCircle className="h-5 w-5" />
                {t.ctaButton}
              </Button>
            </a>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
