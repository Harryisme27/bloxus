import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, FolderCog, KeyRound, Loader2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications, approveCtv } from "@/lib/db/applications";
import { listCtvs, setUserRole, listCtvCategories, setCtvCategories, requestRoleGrant, listRoleRequests, reviewRoleGrant } from "@/lib/db/profiles";
import { listCategories } from "@/lib/db/catalog";
import { relativeTime } from "@/lib/format";
import type { CtvApplicationRow, ProfileRow, UserRole } from "@/types/db";
import { usePick, useLangStore } from "@/i18n";
import { useAuthStore } from "@/store/authStore";

const ROLE_LABELS: { vi: Record<UserRole, string>; en: Record<UserRole, string> } = {
  vi: { ctv: "Cộng tác viên", manager: "Quản lý", admin: "Quản trị", customer: "Khách" },
  en: { ctv: "Collaborator", manager: "Manager", admin: "Admin", customer: "Customer" },
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
    manageCats: "Phân danh mục",
    catDialogTitle: (name: string) => `Danh mục cho ${name}`,
    catDialogDesc: "Chọn danh mục CTV được phép nhận đơn, hoặc cho phép toàn bộ.",
    allCats: "Toàn bộ danh mục",
    catsSaved: "Đã cập nhật danh mục cho CTV.",
    catsSaveFail: "Không lưu được.",
    saveCats: "Lưu",
    saving: "Đang lưu...",
    allAccessBadge: "Toàn bộ",
    catsCount: (n: number) => `${n} danh mục`,
    noCatAccess: "Chưa phân",
    requestInfo:
      "Bạn là Manager — đề xuất cấp quyền sẽ được gửi cho Admin duyệt trước khi có hiệu lực.",
    requestSent: (email: string) => `Đã gửi đề xuất cấp quyền cho ${email} — chờ admin duyệt.`,
    sendRequest: "Gửi đề xuất",
    requestsHeading: "Đề xuất cấp quyền",
    requestApproved: "Đã duyệt đề xuất — quyền được cấp.",
    requestRejected: "Đã từ chối đề xuất.",
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
    manageCats: "Assign categories",
    catDialogTitle: (name: string) => `Categories for ${name}`,
    catDialogDesc: "Choose which categories this collaborator can claim orders from, or allow all.",
    allCats: "All categories",
    catsSaved: "Collaborator categories updated.",
    catsSaveFail: "Couldn't save.",
    saveCats: "Save",
    saving: "Saving...",
    allAccessBadge: "All",
    catsCount: (n: number) => `${n} categor${n === 1 ? "y" : "ies"}`,
    noCatAccess: "None",
    requestInfo:
      "You're a Manager — role grant proposals are sent to an Admin for approval before taking effect.",
    requestSent: (email: string) => `Role request for ${email} sent — awaiting admin approval.`,
    sendRequest: "Send request",
    requestsHeading: "Role grant requests",
    requestApproved: "Request approved — role granted.",
    requestRejected: "Request declined.",
  },
};

/** /work/ctv (admin) — duyệt đơn ứng tuyển + danh sách CTV. */
export function WorkCtv() {
  const t = usePick(STR);
  // Cấp/đổi vai trò là quyền admin (guard_profile_role chặn ở DB) — manager chỉ
  // quản lý danh sách + phân danh mục.
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
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
          <ManualRoleTab isAdmin={isAdmin} />
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

function ManualRoleTab({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const roleLabels = ROLE_LABELS[lang];
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ctv");

  const mutation = useMutation({
    // Admin cấp thẳng; manager chỉ ĐỀ XUẤT (admin duyệt sau — RPC request_role_grant).
    mutationFn: async ({ email: e, role: r }: { email: string; role: UserRole }): Promise<void> => {
      if (isAdmin) await setUserRole(e, r);
      else await requestRoleGrant(e, r);
    },
    onSuccess: (_data, vars) => {
      toast.success(
        isAdmin ? t.granted(roleLabels[vars.role], vars.email) : t.requestSent(vars.email),
      );
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
      void queryClient.invalidateQueries({ queryKey: ["role-requests"] });
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
        {isAdmin ? t.grantInfo : t.requestInfo}
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
                <option value="manager">{roleLabels.manager}</option>
                {isAdmin ? (
                  <>
                    <option value="admin">{roleLabels.admin}</option>
                    <option value="customer">{roleLabels.customer}</option>
                  </>
                ) : null}
              </Select>
            </div>
            <Button type="submit" disabled={!email.trim() || mutation.isPending}>
              <KeyRound className="h-4 w-4" aria-hidden />
              {mutation.isPending
                ? t.granting
                : isAdmin
                  ? t.grant
                  : t.sendRequest}
            </Button>
          </form>
        </CardContent>
      </Card>

      <RoleRequestsPanel isAdmin={isAdmin} />
    </div>
  );
}

/** Danh sách đề xuất cấp quyền: admin duyệt/từ chối; manager theo dõi của mình. */
function RoleRequestsPanel({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const roleLabels = ROLE_LABELS[lang];

  const query = useQuery({ queryKey: ["role-requests"], queryFn: listRoleRequests });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => reviewRoleGrant(id, approve),
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? t.requestApproved : t.requestRejected);
      void queryClient.invalidateQueries({ queryKey: ["role-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.actionFail),
  });

  const rows = query.data ?? [];
  if (query.isPending || rows.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <p className="mb-3 font-heading text-sm font-semibold text-text">{t.requestsHeading}</p>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {r.target_email}
                  <span className="ml-2 text-xs text-text-subtle">→ {roleLabels[r.requested_role]}</span>
                </p>
                <p className="text-xs text-text-subtle">{relativeTime(r.created_at)}</p>
              </div>
              {r.status === "pending" && isAdmin ? (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ id: r.id, approve: true })}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {t.approve}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate({ id: r.id, approve: false })}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    {t.reject}
                  </Button>
                </div>
              ) : (
                <Badge
                  variant={
                    r.status === "approved" ? "green" : r.status === "rejected" ? "danger" : "gold"
                  }
                >
                  {r.status === "approved"
                    ? t.badgeApproved
                    : r.status === "rejected"
                      ? t.badgeRejected
                      : t.badgePending}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ApplicationsTab() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const confirm = useConfirm();
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
              onReject={async () => {
                const r = await confirm({
                  title: t.reject,
                  input: { label: t.rejectPrompt, multiline: true },
                });
                if (r.ok) mutation.mutate({ id: app.id, approve: false, note: r.value || undefined });
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
  const [managing, setManaging] = useState<ProfileRow | null>(null);

  if (query.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  const ctvs = query.data ?? [];
  if (ctvs.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        {t.noCtvPre} “{t.tabGrant}” {t.noCtvPost}
      </div>
    );
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border">
        {ctvs.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0"
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
            {c.ctv_all_categories ? (
              <Badge variant="gold">{t.allAccessBadge}</Badge>
            ) : null}
            <Button variant="secondary" size="sm" onClick={() => setManaging(c)}>
              <FolderCog className="h-4 w-4" aria-hidden /> {t.manageCats}
            </Button>
            <Badge variant="success">
              <BadgeCheck className="h-3 w-3" aria-hidden /> {t.ctvBadge}
            </Badge>
          </div>
        ))}
      </div>
      <CategoryAssignDialog ctv={managing} onClose={() => setManaging(null)} />
    </>
  );
}

function CategoryAssignDialog({ ctv, onClose }: { ctv: ProfileRow | null; onClose: () => void }) {
  const t = usePick(STR);
  const queryClient = useQueryClient();
  const [all, setAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const catsQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => listCategories({ activeOnly: false }),
    enabled: ctv !== null,
  });
  const assignedQuery = useQuery({
    queryKey: ["ctv-categories", ctv?.id],
    queryFn: () => listCtvCategories(ctv!.id),
    enabled: ctv !== null,
  });

  useEffect(() => {
    if (ctv) setAll(ctv.ctv_all_categories);
  }, [ctv]);
  useEffect(() => {
    if (assignedQuery.data) setSelected(new Set(assignedQuery.data));
  }, [assignedQuery.data]);

  const mutation = useMutation({
    mutationFn: () => setCtvCategories(ctv!.id, Array.from(selected), all),
    onSuccess: () => {
      toast.success(t.catsSaved);
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
      void queryClient.invalidateQueries({ queryKey: ["ctv-categories", ctv?.id] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || t.catsSaveFail),
  });

  const cats = catsQuery.data ?? [];

  return (
    <Dialog open={ctv !== null} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      {ctv ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.catDialogTitle(ctv.display_name || ctv.username)}</DialogTitle>
            <DialogDescription>{t.catDialogDesc}</DialogDescription>
          </DialogHeader>

          <label className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
            <input
              type="checkbox"
              checked={all}
              onChange={(e) => setAll(e.target.checked)}
              className="h-4 w-4 accent-yellow"
            />
            <span className="text-sm font-medium text-text">{t.allCats}</span>
          </label>

          {!all ? (
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
              {catsQuery.isPending ? (
                <Skeleton className="h-24" />
              ) : (
                cats.map((cat) => {
                  const checked = selected.has(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(cat.id);
                            else next.delete(cat.id);
                            return next;
                          });
                        }}
                        className="h-4 w-4 accent-yellow"
                      />
                      <span className="text-sm text-text">{cat.name}</span>
                      {!cat.is_active ? (
                        <span className="text-xs text-text-subtle">(ẩn)</span>
                      ) : null}
                    </label>
                  );
                })
              )}
            </div>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden /> {t.reject}
            </Button>
            <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {mutation.isPending ? t.saving : t.saveCats}
            </Button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
