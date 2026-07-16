// /ctv (public) — trang tuyển cộng tác viên: giới thiệu quyền lợi, quy trình,
// yêu cầu, FAQ và form ứng tuyển (cần đăng nhập để nộp đơn).
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeDollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Headset,
  Hourglass,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { SetupNotice } from "@/components/SetupNotice";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyApplication, submitApplication } from "@/lib/db/applications";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

const BENEFITS = [
  {
    icon: BadgeDollarSign,
    title: "Thu nhập theo đơn",
    text: "Nhận thù lao theo từng đơn hoàn thành — làm nhiều nhận nhiều, thanh toán minh bạch.",
  },
  {
    icon: Clock,
    title: "Thời gian linh hoạt",
    text: "Tự chọn khung giờ online, nhận đơn phù hợp với lịch của bạn. Không gò bó giờ hành chính.",
  },
  {
    icon: Headset,
    title: "Đội ngũ hỗ trợ",
    text: "Kênh chat nội bộ, admin đồng hành xử lý tình huống khó — bạn không bao giờ làm việc một mình.",
  },
] as const;

const STEPS = [
  {
    icon: FileText,
    title: "Nộp đơn",
    text: "Điền form ứng tuyển bên dưới: thông tin liên hệ, kinh nghiệm và các game/dịch vụ bạn làm được.",
  },
  {
    icon: ShieldCheck,
    title: "Admin duyệt",
    text: "Đội ngũ xét duyệt trong 24–48 giờ. Kết quả được báo qua thông báo trong web.",
  },
  {
    icon: Briefcase,
    title: "Nhận đơn & làm việc",
    text: "Vào khu làm việc, nhận đơn được giao, trao đổi với khách và nhận thù lao khi hoàn thành.",
  },
] as const;

const REQUIREMENTS = [
  "Trung thực, có trách nhiệm với đơn được giao — uy tín là tài sản lớn nhất của Uniemarket.",
  "Online tối thiểu 2–3 giờ mỗi ngày và phản hồi tin nhắn nhanh.",
  "Rành ít nhất một game/dịch vụ mà Uniemarket đang bán (cày thuê, kéo rank, farm tài nguyên...).",
  "Có tài khoản ngân hàng hoặc Momo để nhận thù lao.",
] as const;

const FAQS = [
  {
    q: "Ứng tuyển CTV có mất phí hay phải đặt cọc không?",
    a: "Không. Uniemarket không thu bất kỳ khoản phí hay tiền cọc nào khi ứng tuyển và trong suốt quá trình làm việc.",
  },
  {
    q: "Thu nhập được tính như thế nào?",
    a: "Theo phần trăm giá trị mỗi đơn bạn hoàn thành. Mức chia cụ thể tùy loại dịch vụ và được thống nhất khi bạn được duyệt.",
  },
  {
    q: "Bao lâu thì đơn của tôi được duyệt?",
    a: "Thông thường trong 24–48 giờ. Bạn sẽ nhận thông báo ngay trong web khi có kết quả.",
  },
  {
    q: "Tôi làm việc ở đâu, có cần đến văn phòng không?",
    a: "Hoàn toàn online. Mọi thứ — nhận đơn, trao đổi với khách, chat nội bộ — đều diễn ra trong khu làm việc trên web.",
  },
] as const;

export function Ctv() {
  return (
    <PageContainer className="py-10 sm:py-14">
      {/* Hero */}
      <section className="rounded-3xl border border-border bg-surface p-8 sm:p-12">
        <Badge variant="gold" className="mb-4">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Đang tuyển
        </Badge>
        <h1 className="max-w-2xl font-heading text-3xl font-bold text-text sm:text-4xl">
          Trở thành Cộng tác viên Uniemarket
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
          Kiếm thu nhập từ chính kỹ năng chơi game của bạn: nhận đơn cày thuê, kéo rank, farm tài
          nguyên... do Uniemarket giao, làm việc online hoàn toàn linh hoạt.
        </p>
        <div className="mt-6">
          <a href="#apply" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Nộp đơn ngay
          </a>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="rounded-2xl border border-border bg-surface-2 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-soft text-yellow">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-3 font-heading text-base font-semibold text-text">
                  {benefit.title}
                </p>
                <p className="mt-1 text-sm text-text-muted">{benefit.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quy trình 3 bước */}
      <section className="mt-12">
        <SectionHeading
          eyebrow="Quy trình"
          title="3 bước để bắt đầu"
          description="Đơn giản, minh bạch — từ lúc nộp đơn tới lúc nhận đơn đầu tiên."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-soft font-heading text-sm font-bold text-green">
                    {index + 1}
                  </span>
                  <Icon className="h-5 w-5 text-text-subtle" aria-hidden />
                </div>
                <p className="mt-3 font-heading text-base font-semibold text-text">{step.title}</p>
                <p className="mt-1 text-sm text-text-muted">{step.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Yêu cầu + FAQ */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu đối với CTV</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {REQUIREMENTS.map((req) => (
                <li key={req} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Câu hỏi thường gặp</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion defaultValue={FAQS[0].q}>
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-sm">{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Form ứng tuyển / trạng thái đơn */}
      <section id="apply" className="mt-12 scroll-mt-24">
        <SectionHeading
          eyebrow="Ứng tuyển"
          title="Nộp đơn ứng tuyển"
          description="Điền thông tin bên dưới — admin sẽ phản hồi qua thông báo trong web."
        />
        <div className="mx-auto max-w-2xl">
          <ApplicationSection />
        </div>
      </section>
    </PageContainer>
  );
}

/** Khu vực form/trạng thái — tách riêng để gom logic auth + query. */
function ApplicationSection() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const isStaff = user?.role === "ctv" || user?.role === "admin";

  const appQuery = useQuery({
    queryKey: ["my-application"],
    queryFn: getMyApplication,
    enabled: isSupabaseConfigured && Boolean(session) && !isStaff,
  });
  const application = appQuery.data ?? null;

  // Đơn đã duyệt nhưng profile trong store còn role cũ -> tải lại profile.
  useEffect(() => {
    if (application?.status === "approved" && user?.role === "customer") {
      void refreshProfile();
    }
  }, [application?.status, user?.role, refreshProfile]);

  // Cho phép nộp lại sau khi bị từ chối.
  const [resubmitting, setResubmitting] = useState(false);

  if (!isSupabaseConfigured) return <SetupNotice />;

  if (authLoading) {
    return (
      <Card className="space-y-3 p-5">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-soft text-yellow">
          <LogIn className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text">Đăng nhập để nộp đơn</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Bạn cần có tài khoản Uniemarket để ứng tuyển — đơn của bạn sẽ gắn với tài khoản này.
          </p>
        </div>
        <Link
          to="/login?next=/ctv"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          Đăng nhập để nộp đơn
        </Link>
      </Card>
    );
  }

  if (isStaff) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-soft text-green">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text">
            Bạn đã là thành viên đội ngũ
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
            Không cần ứng tuyển nữa — vào khu làm việc để nhận đơn và trao đổi nội bộ.
          </p>
        </div>
        <Link to="/work" className={buttonVariants({ variant: "gold", size: "md" })}>
          Vào khu làm việc
        </Link>
      </Card>
    );
  }

  if (appQuery.isPending) {
    return (
      <Card className="space-y-3 p-5">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (appQuery.isError) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-text-muted">Không tải được trạng thái đơn ứng tuyển.</p>
        <p className="max-w-sm text-xs text-text-subtle">
          {appQuery.error instanceof Error ? appQuery.error.message : ""}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void appQuery.refetch()}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Thử lại
        </Button>
      </Card>
    );
  }

  if (application?.status === "pending") {
    return (
      <div className="rounded-2xl border border-yellow bg-yellow-soft p-6">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-yellow">
          <Hourglass className="h-5 w-5" aria-hidden />
          Đang chờ duyệt
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Đơn ứng tuyển của bạn (nộp lúc{" "}
          {new Date(application.created_at).toLocaleString("vi-VN")}) đang được admin xem xét —
          thường trong 24–48 giờ. Kết quả sẽ báo qua thông báo trong web.
        </p>
      </div>
    );
  }

  if (application?.status === "approved") {
    return (
      <div className="rounded-2xl border border-green bg-green-soft p-6">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-green">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          Đã duyệt — chào mừng bạn vào đội ngũ!
        </div>
        <p className="mt-2 text-sm text-text-muted">
          Đơn của bạn đã được chấp nhận. Nếu chưa thấy khu làm việc, hãy đăng xuất rồi đăng nhập
          lại để cập nhật quyền.
        </p>
        <Link
          to="/work"
          className={buttonVariants({ variant: "gold", size: "md" }) + " mt-4"}
        >
          Vào khu làm việc
        </Link>
      </div>
    );
  }

  if (application?.status === "rejected" && !resubmitting) {
    return (
      <div className="rounded-2xl border border-danger bg-danger-soft p-6">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-danger">
          <XCircle className="h-5 w-5" aria-hidden />
          Đơn chưa được duyệt
        </div>
        <p className="mt-2 text-sm text-text-muted">
          {application.note
            ? `Ghi chú từ admin: “${application.note}”`
            : "Admin chưa để lại ghi chú cụ thể."}{" "}
          Bạn có thể nộp lại đơn mới hoặc liên hệ admin qua trang Liên hệ nếu cần giải thích thêm.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="md" onClick={() => setResubmitting(true)}>
            Nộp đơn mới
          </Button>
          <Link to="/contact" className={buttonVariants({ variant: "secondary", size: "md" })}>
            Liên hệ admin
          </Link>
        </div>
      </div>
    );
  }

  return <ApplicationForm />;
}

function ApplicationForm() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState(user?.display_name ?? "");
  const [contact, setContact] = useState("");
  const [experience, setExperience] = useState("");
  const [games, setGames] = useState("");

  const submitMutation = useMutation({
    mutationFn: () =>
      submitApplication({
        fullName: fullName.trim(),
        contact: contact.trim(),
        experience: experience.trim() || undefined,
        games: games.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã gửi đơn ứng tuyển! Admin sẽ duyệt trong 24–48 giờ.");
      void queryClient.invalidateQueries({ queryKey: ["my-application"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Không gửi được đơn ứng tuyển.");
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fullName.trim() || !contact.trim() || submitMutation.isPending) return;
    submitMutation.mutate();
  }

  const textareaClass =
    "flex w-full rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:border-yellow disabled:cursor-not-allowed disabled:opacity-50";

  const field = (label: string, required: boolean, input: ReactNode): ReactNode => (
    <div>
      <Label>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      {input}
    </div>
  );

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {field(
          "Họ và tên",
          true,
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
            disabled={submitMutation.isPending}
          />,
        )}
        {field(
          "Liên hệ",
          true,
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Zalo/Discord/SĐT"
            required
            disabled={submitMutation.isPending}
          />,
        )}
        {field(
          "Kinh nghiệm",
          false,
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={4}
            placeholder="Bạn từng cày thuê/kéo rank ở đâu, bao lâu, thành tích nổi bật..."
            className={textareaClass}
            disabled={submitMutation.isPending}
          />,
        )}
        {field(
          "Game / dịch vụ",
          false,
          <Input
            value={games}
            onChange={(e) => setGames(e.target.value)}
            placeholder="Các game/dịch vụ bạn làm được"
            disabled={submitMutation.isPending}
          />,
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!fullName.trim() || !contact.trim() || submitMutation.isPending}
        >
          {submitMutation.isPending ? "Đang gửi…" : "Gửi đơn ứng tuyển"}
        </Button>
        <p className="text-center text-xs text-text-subtle">
          Miễn phí 100% — Uniemarket không bao giờ thu phí hay tiền cọc khi ứng tuyển.
        </p>
      </form>
    </Card>
  );
}
