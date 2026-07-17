import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, KeyRound, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications, approveCtv } from "@/lib/db/applications";
import { listCtvs, setUserRole } from "@/lib/db/profiles";
import { relativeTime } from "@/lib/format";
import type { CtvApplicationRow, UserRole } from "@/types/db";
import { usePick, useLangStore } from "@/i18n";

const ROLE_LABELS: { vi: Record<UserRole, string>; en: Record<UserRole, string> } = {
  vi: { ctv: "Cộng tác viên", admin: "Quản trị", customer: "Khách" },
  en: { ctv: "Collaborator", admin: "Admin", customer: "Customer" },
};

const STR = {
  vi: {
    title: "Cộng tác viên",
    subtitle: "Cấp quyền trực tiếp theo email và quản lý đội ngũ CTV. Cấp quyền = mở khu làm việc.",
    tabGrant: "Cấp quyền thủ công",
    tabList: "Danh sách CTV",
    tabApplications: "Đơn ứng tuyển",
    granted: (role: string, email: string) => `Đã cấp quyền ${role} cho ${email}.`,
    grantFail: "Cấp quyền thất bại.",
    grantInfo: "Nhập email tài khoản đã đăng ký để cấp quyền ngay, không cần qua đơn ứng tuyển.",
    emailLabel: "Email tài khoản",
    emailPlaceholder: "nguoidung@email.com",
    roleLabel: "Quyền",
    granting: "Đang cấp…",
    grant: "Cấp quyền",
    approvedCtv: "Đã duyệt CTV.",
    rejectedApp: "Đã từ chối đơn.",
    actionFail: "Thao tác thất bại.",
    loadAppsError: "Không tải được danh sách đơn.",
    noApps: "Chưa có đơn ứng tuyển nào.",
    pendingHeading: (n: number) => `Chờ duyệt (${n})`,
    rejectPrompt: "Lý do từ chối (không bắt buộc):",
    reviewedHeading: "Đã xử lý",
    badgeApproved: "Đã duyệt",
    badgeRejected: "Đã từ chối",
    badgePending: "Chờ duyệt",
    contactLabel: "Liên hệ:",
    gamesLabel: "Game/dịch vụ:",
    experienceLabel: "Kinh nghiệm:",
    noteLabel: "Ghi chú:",
    approve: "Duyệt",
    reject: "Từ chối",
    noCtvPre: "Chưa có CTV nào. Dùng tab",
    noCtvPost: "để thêm CTV theo email.",
    ctvBadge: "CTV",
  },
  en: {
    title: "Collaborators",
    subtitle:
      "Grant roles directly by email and manage your CTV team. Granting a role opens the work area.",
    tabGrant: "Grant manually",
    tabList: "CTV list",
    tabApplications: "Applications",
    granted: (role: string, email: string) => `Granted the ${role} role to ${email}.`,
    grantFail: "Failed to grant the role.",
    grantInfo: "Enter a registered account email to grant a role right away, no application needed.",
    emailLabel: "Account email",
    emailPlaceholder: "user@email.com",
    roleLabel: "Role",
    granting: "Granting…",
    grant: "Grant role",
    approvedCtv: "Collaborator approved.",
    rejectedApp: "Application declined.",
    actionFail: "Action failed.",
    loadAppsError: "Couldn't load the application list.",
    noApps: "No applications yet.",
    pendingHeading: (n: number) => `Pending (${n})`,
    rejectPrompt: "Reason for declining (optional):",
    reviewedHeading: "Reviewed",
    badgeApproved: "Approved",
    badgeRejected: "Declined",
    badgePending: "Pending",
    contactLabel: "Contact:",
    gamesLabel: "Games/services:",
    experienceLabel: "Experience:",
    noteLabel: "Note:",
    approve: "Approve",
    reject: "Decline",
    noCtvPre: "No collaborators yet. Use the",
    noCtvPost: "tab to add a CTV by email.",
    ctvBadge: "CTV",
  },
};

/** /work/ctv (admin) — duyệt đơn ứng tuyển + danh sách CTV. */
export function WorkCtv() {
  const t = usePick(STR);
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <Tabs defaultValue="grant">
        <TabsList>
          <TabsTrigger value="grant">{t.tabGrant}</TabsTrigger>
          <TabsTrigger value="list">{t.tabList}</TabsTrigger>
          <TabsTrigger value="applications">{t.tabApplications}</TabsTrigger>
        </TabsList>
        <TabsContent value="grant" className="pt-5">
          <ManualRoleTab />
        </TabsContent>
        <TabsContent value="list" className="pt-5">
          <CtvListTab />
        </TabsContent>
        <TabsContent value="applications" className="pt-5">
          <ApplicationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ManualRoleTab() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const roleLabels = ROLE_LABELS[lang];
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ctv");

  const mutation = useMutation({
    mutationFn: ({ email: e, role: r }: { email: string; role: UserRole }) => setUserRole(e, r),
    onSuccess: (_data, vars) => {
      toast.success(t.granted(roleLabels[vars.role], vars.email));
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
      setEmail("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.grantFail),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate({ email: trimmed, role });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-yellow/40 bg-yellow-soft px-4 py-3 text-sm text-text-muted">
        {t.grantInfo}
      </div>
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="grant-email">{t.emailLabel}</Label>
              <Input
                id="grant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="grant-role">{t.roleLabel}</Label>
              <Select
                id="grant-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={mutation.isPending}
              >
                <option value="ctv">{roleLabels.ctv}</option>
                <option value="admin">{roleLabels.admin}</option>
                <option value="customer">{roleLabels.customer}</option>
              </Select>
            </div>
            <Button type="submit" disabled={!email.trim() || mutation.isPending}>
              <KeyRound className="h-4 w-4" aria-hidden />
              {mutation.isPending ? t.granting : t.grant}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationsTab() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const query = useQuery({ queryKey: ["applications"], queryFn: () => listApplications() });

  const mutation = useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      approveCtv(id, approve, note),
    onSuccess: (_data, vars) => {
      toast.success(vars.approve ? t.approvedCtv : t.rejectedApp);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.actionFail),
  });

  if (query.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  if (query.isError) return <p className="text-sm text-danger">{t.loadAppsError}</p>;

  const apps = query.data ?? [];
  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        {t.noApps}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">{t.pendingHeading(pending.length)}</h3>
          {pending.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={() => mutation.mutate({ id: app.id, approve: true })}
              onReject={() => {
                const note = window.prompt(t.rejectPrompt) ?? undefined;
                mutation.mutate({ id: app.id, approve: false, note });
              }}
              busy={mutation.isPending}
            />
          ))}
        </div>
      ) : null}
      {reviewed.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted">{t.reviewedHeading}</h3>
          {reviewed.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ApplicationCard({
  app,
  onApprove,
  onReject,
  busy,
}: {
  app: CtvApplicationRow;
  onApprove?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
  const t = usePick(STR);
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-text">{app.full_name}</span>
            {app.status === "approved" ? (
              <Badge variant="success">
                <Check className="h-3 w-3" aria-hidden /> {t.badgeApproved}
              </Badge>
            ) : app.status === "rejected" ? (
              <Badge variant="danger">{t.badgeRejected}</Badge>
            ) : (
              <Badge variant="gold">{t.badgePending}</Badge>
            )}
            <span className="text-xs text-text-subtle">{relativeTime(app.created_at)}</span>
          </div>
          <p className="text-sm text-text-muted">
            <span className="text-text-subtle">{t.contactLabel}</span> {app.contact}
          </p>
          {app.games ? (
            <p className="text-sm text-text-muted">
              <span className="text-text-subtle">{t.gamesLabel}</span> {app.games}
            </p>
          ) : null}
          {app.experience ? (
            <p className="text-sm text-text-muted">
              <span className="text-text-subtle">{t.experienceLabel}</span> {app.experience}
            </p>
          ) : null}
          {app.note ? <p className="text-xs text-warning">{t.noteLabel} {app.note}</p> : null}
        </div>
        {onApprove ? (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={onApprove} disabled={busy}>
              <Check className="h-4 w-4" aria-hidden /> {t.approve}
            </Button>
            <Button size="sm" variant="secondary" onClick={onReject} disabled={busy}>
              <X className="h-4 w-4" aria-hidden /> {t.reject}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CtvListTab() {
  const t = usePick(STR);
  const query = useQuery({ queryKey: ["ctvs"], queryFn: listCtvs });
  if (query.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  const ctvs = query.data ?? [];
  if (ctvs.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        {t.noCtvPre} “{t.tabGrant}” {t.noCtvPost}
      </div>
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {ctvs.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-soft text-green">
            <UserRound className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-text">{c.display_name || c.username}</p>
            <p className="text-xs text-text-subtle">
              @{c.username}
              {c.discord ? ` · ${c.discord}` : ""}
              {c.phone ? ` · ${c.phone}` : ""}
            </p>
          </div>
          <Badge variant="success">
            <BadgeCheck className="h-3 w-3" aria-hidden /> {t.ctvBadge}
          </Badge>
        </div>
      ))}
    </div>
  );
}
