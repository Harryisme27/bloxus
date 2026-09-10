import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Mail,
  MessageCircle,
  Clock,
  Send,
  CheckCircle2,
  Zap,
  MessagesSquare,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORT_EMAIL, DISCORD_URL, BRAND_NAME } from "@/lib/constants";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    toastSent: "Đã gửi! Chúng tôi sẽ phản hồi bạn sớm.",
    badge: "Liên hệ với chúng tôi",
    heading: "Chúng tôi luôn lắng nghe bạn",
    introPre: "Có thắc mắc về đơn hàng, vật phẩm hay bất kỳ điều gì? Gửi tin nhắn cho đội ngũ",
    introPost: "— chúng tôi phản hồi rất nhanh.",
    confirmTitle: "Đã nhận tin nhắn của bạn!",
    thanksPre: "Cảm ơn",
    nameFallback: "bạn",
    thanksPost: ". Đội ngũ Bloxus sẽ phản hồi qua email trong thời gian sớm nhất.",
    demoNote: "Cần hỗ trợ gấp? Nhắn trực tiếp trên Discord để được phản hồi nhanh nhất.",
    sendAnother: "Gửi tin nhắn khác",
    formTitle: "Gửi tin nhắn",
    formSubtitle: "Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại với bạn.",
    nameLabel: "Họ và tên",
    namePlaceholder: "Nguyễn Văn A",
    emailLabel: "Email",
    emailPlaceholder: "ban@email.com",
    messageLabel: "Nội dung",
    messagePlaceholder: "Mình cần hỗ trợ về...",
    submit: "Gửi tin nhắn",
    formDemoNote: "Thông tin của bạn chỉ dùng để phản hồi yêu cầu hỗ trợ.",
    discordTitle: "Discord",
    discordDesc: "Cách nhanh nhất để được hỗ trợ trực tiếp từ cộng đồng và nhân viên.",
    discordAction: "Tham gia server",
    emailTitle: "Email",
    emailAction: "Gửi email",
    hoursTitle: "Giờ hỗ trợ",
    weekdays: "Thứ 2 – Thứ 6",
    weekend: "Thứ 7 – Chủ nhật",
    avgReply: "Phản hồi trung bình dưới 5 phút",
  },
  en: {
    toastSent: "Sent! We'll get back to you soon.",
    badge: "Get in touch",
    heading: "We're always here to listen",
    introPre: "Questions about an order, an item, or anything else? Message the",
    introPost: "team — we reply very fast.",
    confirmTitle: "We got your message!",
    thanksPre: "Thank you,",
    nameFallback: "there",
    thanksPost: ". The Bloxus team will get back to you by email as soon as possible.",
    demoNote: "Need help fast? Message us on Discord for the quickest reply.",
    sendAnother: "Send another message",
    formTitle: "Send a message",
    formSubtitle: "Fill in the details below and we'll get back to you.",
    nameLabel: "Full name",
    namePlaceholder: "Your full name",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    messageLabel: "Message",
    messagePlaceholder: "I need help with...",
    submit: "Send message",
    formDemoNote: "Your details are only used to respond to your request.",
    discordTitle: "Discord",
    discordDesc: "The fastest way to get direct help from the community and our staff.",
    discordAction: "Join the server",
    emailTitle: "Email",
    emailAction: "Send email",
    hoursTitle: "Support hours",
    weekdays: "Mon – Fri",
    weekend: "Sat – Sun",
    avgReply: "Average reply under 5 minutes",
  },
};

export function Contact() {
  const t = usePick(STR);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // DEMO ONLY — nothing is actually sent anywhere.
    toast.success(t.toastSent);
    setSubmitted(true);
  }

  function resetForm() {
    setName("");
    setEmail("");
    setMessage("");
    setSubmitted(false);
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="border-b border-border bg-bg-subtle">
        <PageContainer className="py-14 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow">
              <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {t.badge}
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mx-auto mt-4 text-text-muted">
              {t.introPre}{" "}
              {BRAND_NAME} {t.introPost}
            </p>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="pt-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.4fr,1fr]">
          {/* Form / confirmation */}
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-green">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <h2 className="mt-5 font-heading text-2xl font-bold text-text">
                  {t.confirmTitle}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-text-muted">
                  {t.thanksPre} <span className="font-semibold text-text">{name || t.nameFallback}</span>{t.thanksPost}
                </p>
                <div className="mt-4 rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs text-text-subtle">
                  {t.demoNote}
                </div>
                <Button variant="secondary" className="mt-6" onClick={resetForm}>
                  {t.sendAnother}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-bold text-text">{t.formTitle}</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {t.formSubtitle}
                  </p>
                </div>

                <div>
                  <Label htmlFor="contact-name">{t.nameLabel}</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact-email">{t.emailLabel}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message">{t.messageLabel}</Label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    required
                    rows={5}
                    className="flex w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Send className="h-5 w-5" />
                  {t.submit}
                </Button>
                <p className="text-center text-xs text-text-subtle">
                  {t.formDemoNote}
                </p>
              </form>
            )}
          </div>

          {/* Alternate contact methods */}
          <div className="space-y-4">
            <ContactMethod
              icon={MessageCircle}
              title={t.discordTitle}
              description={t.discordDesc}
              actionLabel={t.discordAction}
              href={DISCORD_URL}
            />
            <ContactMethod
              icon={Mail}
              title={t.emailTitle}
              description={SUPPORT_EMAIL}
              actionLabel={t.emailAction}
              href={`mailto:${SUPPORT_EMAIL}`}
            />

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-base font-semibold text-text">{t.hoursTitle}</h3>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">{t.weekdays}</dt>
                  <dd className="font-medium text-text">08:00 – 23:00</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">{t.weekend}</dt>
                  <dd className="font-medium text-text">09:00 – 22:00</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-soft px-3 py-2 text-sm font-medium text-green">
                <Zap className="h-4 w-4" aria-hidden="true" />
                {t.avgReply}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

interface ContactMethodProps {
  icon: typeof Mail;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}

function ContactMethod({ icon: Icon, title, description, actionLabel, href }: ContactMethodProps) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-yellow hover:shadow-glow-amber"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-soft text-yellow transition-colors group-hover:bg-yellow group-hover:text-text-on-yellow">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-semibold text-text">{title}</h3>
        <p className="mt-1 break-words text-sm text-text-muted">{description}</p>
        <span className="mt-2 inline-block text-sm font-semibold text-yellow group-hover:underline">
          {actionLabel}
        </span>
      </div>
    </a>
  );
}
