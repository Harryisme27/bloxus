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

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // DEMO ONLY — nothing is actually sent anywhere.
    toast.success("Đã gửi! Chúng tôi sẽ phản hồi bạn sớm (demo — không gửi thật).");
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
              Liên hệ với chúng tôi
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              Chúng tôi luôn lắng nghe bạn
            </h1>
            <p className="mx-auto mt-4 text-text-muted">
              Có thắc mắc về đơn hàng, vật phẩm hay bất kỳ điều gì? Gửi tin nhắn cho đội ngũ{" "}
              {BRAND_NAME} — chúng tôi phản hồi rất nhanh.
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
                  Đã nhận tin nhắn của bạn!
                </h2>
                <p className="mt-2 max-w-sm text-sm text-text-muted">
                  Cảm ơn <span className="font-semibold text-text">{name || "bạn"}</span>. Đội ngũ
                  Uniemarket sẽ phản hồi qua email trong thời gian sớm nhất.
                </p>
                <div className="mt-4 rounded-lg border border-border bg-surface-2 px-4 py-2 text-xs text-text-subtle">
                  DEMO — không có email nào thực sự được gửi đi.
                </div>
                <Button variant="secondary" className="mt-6" onClick={resetForm}>
                  Gửi tin nhắn khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="font-heading text-xl font-bold text-text">Gửi tin nhắn</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại với bạn.
                  </p>
                </div>

                <div>
                  <Label htmlFor="contact-name">Họ và tên</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message">Nội dung</Label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mình cần hỗ trợ về..."
                    required
                    rows={5}
                    className="flex w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Send className="h-5 w-5" />
                  Gửi tin nhắn
                </Button>
                <p className="text-center text-xs text-text-subtle">
                  Đây là biểu mẫu demo — thông tin không được gửi đi đâu cả.
                </p>
              </form>
            )}
          </div>

          {/* Alternate contact methods */}
          <div className="space-y-4">
            <ContactMethod
              icon={MessageCircle}
              title="Discord"
              description="Cách nhanh nhất để được hỗ trợ trực tiếp từ cộng đồng và nhân viên."
              actionLabel="Tham gia server"
              href={DISCORD_URL}
            />
            <ContactMethod
              icon={Mail}
              title="Email"
              description={SUPPORT_EMAIL}
              actionLabel="Gửi email"
              href={`mailto:${SUPPORT_EMAIL}`}
            />

            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-base font-semibold text-text">Giờ hỗ trợ</h3>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Thứ 2 – Thứ 6</dt>
                  <dd className="font-medium text-text">08:00 – 23:00</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Thứ 7 – Chủ nhật</dt>
                  <dd className="font-medium text-text">09:00 – 22:00</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-soft px-3 py-2 text-sm font-medium text-green">
                <Zap className="h-4 w-4" aria-hidden="true" />
                Phản hồi trung bình dưới 5 phút
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
