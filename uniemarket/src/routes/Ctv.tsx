// /ctv (public) — tuyển Cộng tác viên. Bật/tắt bằng setting ctv_apply_open.
//  - Đóng: hiện thông báo tạm đóng.
//  - Mở: hiện form ứng tuyển (cần đăng nhập). Đã nộp -> hiện trạng thái đơn.
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Home, PauseCircle, Send, CheckCircle2, Clock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageContainer } from "@/components/PageContainer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings } from "@/lib/db/settings";
import { submitApplication, getMyApplication } from "@/lib/db/applications";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    closedTitle: "Tuyển Cộng tác viên tạm đóng",
    closedBody:
      "Chương trình tuyển Cộng tác viên hiện đang tạm đóng. Vui lòng quay lại sau hoặc liên hệ quản trị viên.",
    home: "Về trang chủ",
    openTitle: "Ứng tuyển Cộng tác viên",
    openSubtitle: "Điền thông tin bên dưới. Quản trị viên sẽ xem xét và phản hồi bạn.",
    loginNeeded: "Bạn cần đăng nhập để nộp đơn ứng tuyển.",
    login: "Đăng nhập",
    fullName: "Họ tên",
    fullNamePh: "Nguyễn Văn A",
    contact: "Liên hệ (Discord / Zalo / SĐT)",
    contactPh: "vd: discord: unie#0001",
    games: "Game/dịch vụ bạn làm được",
    gamesPh: "vd: Blox Fruits, Grow a Garden…",
    experience: "Kinh nghiệm (không bắt buộc)",
    experiencePh: "Mô tả ngắn kinh nghiệm của bạn…",
    submit: "Nộp đơn",
    submitting: "Đang gửi…",
    submitted: "Đã gửi đơn ứng tuyển — chờ duyệt.",
    needFields: "Vui lòng nhập họ tên và liên hệ.",
    statusPendingTitle: "Đơn của bạn đang chờ duyệt",
    statusPendingBody: "Quản trị viên sẽ xem xét và phản hồi sớm. Cảm ơn bạn đã ứng tuyển!",
    statusApprovedTitle: "Đơn của bạn đã được duyệt 🎉",
    statusApprovedBody: "Bạn đã trở thành Cộng tác viên — vào khu làm việc để bắt đầu.",
    workArea: "Vào khu làm việc",
  },
  en: {
    closedTitle: "Collaborator recruitment is paused",
    closedBody:
      "Our collaborator (CTV) recruitment is currently paused. Please check back later or contact an administrator.",
    home: "Back to home",
    openTitle: "Apply as a Collaborator",
    openSubtitle: "Fill in the details below. An administrator will review and get back to you.",
    loginNeeded: "You need to log in to submit an application.",
    login: "Log in",
    fullName: "Full name",
    fullNamePh: "John Doe",
    contact: "Contact (Discord / Zalo / phone)",
    contactPh: "e.g. discord: unie#0001",
    games: "Games/services you can handle",
    gamesPh: "e.g. Blox Fruits, Grow a Garden…",
    experience: "Experience (optional)",
    experiencePh: "Briefly describe your experience…",
    submit: "Submit application",
    submitting: "Submitting…",
    submitted: "Application submitted — awaiting review.",
    needFields: "Please enter your full name and contact.",
    statusPendingTitle: "Your application is under review",
    statusPendingBody: "An administrator will review it and respond soon. Thanks for applying!",
    statusApprovedTitle: "Your application was approved 🎉",
    statusApprovedBody: "You're now a Collaborator — head to the work area to get started.",
    workArea: "Go to work area",
  },
};

export function Ctv() {
  const t = usePick(STR);
  const session = useAuthStore((s) => s.session);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: isSupabaseConfigured,
  });
  const open = settingsQuery.data?.ctv_apply_open === true;

  const myAppQuery = useQuery({
    queryKey: ["my-application"],
    queryFn: getMyApplication,
    enabled: isSupabaseConfigured && open && Boolean(session),
  });

  if (settingsQuery.isPending) {
    return (
      <PageContainer className="py-16">
        <Skeleton className="mx-auto h-80 max-w-lg rounded-2xl" />
      </PageContainer>
    );
  }

  // Đóng tuyển
  if (!open) {
    return (
      <PageContainer className="py-16 sm:py-24">
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-soft text-yellow">
              <PauseCircle className="h-7 w-7" aria-hidden />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-text">{t.closedTitle}</h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                {t.closedBody}
              </p>
            </div>
            <Link to="/" className={buttonVariants({ variant: "primary", size: "md" })}>
              <Home className="h-4 w-4" aria-hidden />
              {t.home}
            </Link>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-12 sm:py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl">{t.openTitle}</h1>
        <p className="mt-1.5 text-sm text-text-muted">{t.openSubtitle}</p>

        {!session ? (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <p className="text-sm text-text-muted">{t.loginNeeded}</p>
              <Link to="/login?next=/ctv" className={buttonVariants({ variant: "primary", size: "md" })}>
                {t.login}
              </Link>
            </CardContent>
          </Card>
        ) : myAppQuery.data ? (
          <ApplicationStatus status={myAppQuery.data.status} t={t} />
        ) : (
          <ApplyForm onDone={() => myAppQuery.refetch()} t={t} />
        )}
      </div>
    </PageContainer>
  );
}

function ApplicationStatus({
  status,
  t,
}: {
  status: string;
  t: (typeof STR)["en"];
}) {
  const approved = status === "approved";
  return (
    <Card className="mt-6">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${
            approved ? "bg-green-soft text-green" : "bg-yellow-soft text-yellow"
          }`}
        >
          {approved ? (
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          ) : (
            <Clock className="h-7 w-7" aria-hidden />
          )}
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-text">
            {approved ? t.statusApprovedTitle : t.statusPendingTitle}
          </h2>
          <p className="mt-1.5 text-sm text-text-muted">
            {approved ? t.statusApprovedBody : t.statusPendingBody}
          </p>
        </div>
        {approved ? (
          <Link to="/work" className={buttonVariants({ variant: "primary", size: "md" })}>
            {t.workArea}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ApplyForm({ onDone, t }: { onDone: () => void; t: (typeof STR)["en"] }) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [games, setGames] = useState("");
  const [experience, setExperience] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitApplication({
        fullName: fullName.trim(),
        contact: contact.trim(),
        games: games.trim() || undefined,
        experience: experience.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t.submitted);
      void queryClient.invalidateQueries({ queryKey: ["my-application"] });
      onDone();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !contact.trim()) {
      toast.error(t.needFields);
      return;
    }
    mutation.mutate();
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ctv-name">{t.fullName}</Label>
            <Input id="ctv-name" value={fullName} placeholder={t.fullNamePh}
              onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="ctv-contact">{t.contact}</Label>
            <Input id="ctv-contact" value={contact} placeholder={t.contactPh}
              onChange={(e) => setContact(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="ctv-games">{t.games}</Label>
            <Input id="ctv-games" value={games} placeholder={t.gamesPh}
              onChange={(e) => setGames(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ctv-exp">{t.experience}</Label>
            <textarea
              id="ctv-exp"
              value={experience}
              placeholder={t.experiencePh}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            <Send className="h-4 w-4" aria-hidden />
            {mutation.isPending ? t.submitting : t.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
