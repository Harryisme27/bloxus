import { MessageSquare, Users, Zap } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Tham gia cộng đồng Uniemarket",
    subtitle:
      "Nhận thông báo hàng mới, mã giảm giá độc quyền và hỗ trợ nhanh chóng từ đội ngũ. Kết nối cùng hàng nghìn game thủ khác.",
    members: "8.900+ thành viên",
    support: "Hỗ trợ 24/7",
    demoAlert: "DEMO — đây là bản demo, chưa có máy chủ Discord thật.",
    joinDiscord: "Vào Discord",
    demoLink: "DEMO — liên kết mô phỏng",
  },
  en: {
    title: "Join the Uniemarket community",
    subtitle:
      "Get new-stock alerts, exclusive discount codes and fast support from our team. Connect with thousands of other gamers.",
    members: "8,900+ members",
    support: "24/7 support",
    demoAlert: "DEMO — this is a demo, there's no real Discord server yet.",
    joinDiscord: "Join Discord",
    demoLink: "DEMO — simulated link",
  },
};

/** Community call-to-action band inviting visitors to the (demo) Discord. */
export function DiscordCTA() {
  const t = usePick(STR);
  return (
    <PageContainer className="py-14">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(245, 176, 30, 0.12)" }}
        />
        <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-soft text-yellow">
              <MessageSquare className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-text sm:text-3xl">
              {t.title}
            </h2>
            <p className="mt-3 text-sm text-text-muted sm:text-base">
              {t.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-yellow" aria-hidden="true" />
                {t.members}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-yellow" aria-hidden="true" />
                {t.support}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() =>
                // DEMO — không có link Discord thật trong bản demo cục bộ này.
                alert(t.demoAlert)
              }
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {t.joinDiscord}
            </Button>
            <p className="mt-2 text-center text-[11px] text-text-subtle">{t.demoLink}</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
