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
import { listStaff, setUserRole, listCtvCategories, setCtvCategories, requestRoleGrant, listRoleRequests, reviewRoleGrant } from "@/lib/db/profiles";
import { listCategories } from "@/lib/db/catalog";
import { getSettings, updateSetting } from "@/lib/db/settings";
import { adminAdjustCredit } from "@/lib/db/credit";
import { PriceInput } from "@/components/work-admin/PriceInput";
import { formatPrice } from "@/lib/format";
import { PERMISSIONS } from "@/lib/usePermissions";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import type { CtvApplicationRow, ProfileRow, RoleRequestRow, UserRole } from "@/types/db";
import { usePick, useLangStore } from "@/i18n";
import { useAuthStore } from "@/store/authStore";

const ROLE_LABELS: { vi: Record<UserRole, string>; en: Record<UserRole, string> } = {
  vi: { ctv: "Người bán", manager: "Quản lý", admin: "Quản trị", customer: "Khách" },
  en: { ctv: "Seller", manager: "Manager", admin: "Admin", customer: "Customer" },
};

const STR = {
  vi: {
    title: "Người bán",
    subtitle: "Cấp quyền trực tiếp theo email và quản lý đội ngũ Seller. Cấp quyền = mở khu làm việc.",
    tabGrant: "Cấp quyền thủ công",
    tabList: "Danh sách vai trò",
    tabApplications: "Đơn ứng tuyển",
    granted: (role: string, email: string) => `Đã cấp quyền ${role} cho ${email}.`,
    grantFail: "Cấp quyền thất bại.",
    grantInfo: "Nhập email hoặc username tài khoản đã đăng ký để cấp quyền ngay, không cần qua đơn ứng tuyển.",
    emailLabel: "Email hoặc username",
    emailPlaceholder: "email hoặc username",
    roleLabel: "Quyền",
    granting: "Đang cấp…",
    grant: "Cấp quyền",
    approvedCtv: "Đã duyệt Seller.",
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
    noCtvPre: "Chưa có Seller nào. Dùng tab",
    noCtvPost: "để thêm Seller theo email.",
    ctvBadge: "Seller",
    manageCats: "Phân danh mục",
    catDialogTitle: (name: string) => `Danh mục cho ${name}`,
    catDialogDesc: "Chọn danh mục Seller được phép nhận đơn, hoặc cho phép toàn bộ.",
    allCats: "Toàn bộ danh mục",
    catsSaved: "Đã cập nhật danh mục cho Seller.",
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
    reasonLabel: "Lý do đề xuất (để admin đọc)",
    reasonPh: "VD: bạn này hỗ trợ khách rất tốt, đề xuất lên Seller…",
    filterRole: "Lọc vai trò",
    allRoles: "Tất cả vai trò",
    reviewerFilter: "Người duyệt",
    allReviewers: "Tất cả người duyệt",
    kindApp: "Ứng tuyển Seller",
    kindRole: "Đề xuất cấp quyền",
    reviewedBy: (name: string) => `Duyệt bởi ${name}`,
    proposedBy: "Đề xuất",
    noStaff: "Chưa có nhân sự nào.",
    tabCredits: "Nạp số dư",
    creditInfo: "Nạp/điều chỉnh số dư ví cho khách theo email. Số âm để trừ.",
    creditEmail: "Email khách hàng",
    creditAmount: "Số tiền (âm để trừ)",
    creditNote: "Ghi chú (tuỳ chọn)",
    creditNotePh: "VD: nạp qua chuyển khoản",
    creditSubmit: "Cập nhật số dư",
    creditDone: (bal: string) => `Đã cập nhật. Số dư mới: ${bal}.`,
    tabPerms: "Phân quyền",
    permsHint:
      "Bật/tắt quyền cho từng vai trò. Admin luôn có mọi quyền. Thay đổi áp dụng ngay sau khi Lưu.",
    permsSaved: "Đã lưu phân quyền.",
    savePerms: "Lưu phân quyền",
    permName: {
      manage_catalog: "Quản lý danh mục & sản phẩm",
      manage_ctv: "Quản lý vai trò (phân danh mục Seller)",
      assign_orders: "Giao đơn cho Seller",
      confirm_payment: "Xác nhận thanh toán",
      resolve_refund: "Duyệt hoàn tiền",
      claim_orders: "Tự nhận đơn",
    } as Record<string, string>,
  },
  en: {
    title: "Sellers",
    subtitle:
      "Grant roles directly by email and manage your Seller team. Granting a role opens the work area.",
    tabGrant: "Grant manually",
    tabList: "Role List",
    tabApplications: "Applications",
    granted: (role: string, email: string) => `Granted the ${role} role to ${email}.`,
    grantFail: "Failed to grant the role.",
    grantInfo: "Enter a registered account email or username to grant a role right away, no application needed.",
    emailLabel: "Email or username",
    emailPlaceholder: "email or username",
    roleLabel: "Role",
    granting: "Granting…",
    grant: "Grant role",
    approvedCtv: "Seller approved.",
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
    noCtvPre: "No sellers yet. Use the",
    noCtvPost: "tab to add a Seller by email.",
    ctvBadge: "Seller",
    manageCats: "Assign categories",
    catDialogTitle: (name: string) => `Categories for ${name}`,
    catDialogDesc: "Choose which categories this seller can claim orders from, or allow all.",
    allCats: "All categories",
    catsSaved: "Seller categories updated.",
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
    reasonLabel: "Reason (for admin to read)",
    reasonPh: "e.g. handles customers very well, proposing them for Seller…",
    filterRole: "Filter role",
    allRoles: "All roles",
    reviewerFilter: "Reviewed by",
    allReviewers: "All reviewers",
    kindApp: "Seller application",
    kindRole: "Role request",
    reviewedBy: (name: string) => `Reviewed by ${name}`,
    proposedBy: "Proposed",
    noStaff: "No staff members yet.",
    tabCredits: "Credits",
    creditInfo: "Add/adjust a customer's wallet balance by email. Use a negative amount to deduct.",
    creditEmail: "Customer email",
    creditAmount: "Amount (negative to deduct)",
    creditNote: "Note (optional)",
    creditNotePh: "e.g. topped up via bank transfer",
    creditSubmit: "Update balance",
    creditDone: (bal: string) => `Updated. New balance: ${bal}.`,
    tabPerms: "Permissions",
    permsHint:
      "Toggle what each role can do. Admin always has everything. Changes apply right after you save.",
    permsSaved: "Permissions saved.",
    savePerms: "Save permissions",
    permName: {
      manage_catalog: "Manage categories & products",
      manage_ctv: "Manage roles (assign Seller categories)",
      assign_orders: "Assign orders to Seller",
      confirm_payment: "Confirm payment",
      resolve_refund: "Approve refunds",
      claim_orders: "Claim orders",
    } as Record<string, string>,
  },
};

/** /work/ctv (admin) — duyệt đơn ứng tuyển + danh sách Seller. */
export function WorkCtv() {
  const t = usePick(STR);
  // Cấp/đổi vai trò là quyền admin (guard_profile_role chặn ở DB) — manager chỉ
  // quản lý danh sách + phân danh mục.
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">{t.title}</h1>
      </div>

      <Tabs defaultValue="grant">
        <TabsList>
          <TabsTrigger value="grant">{t.tabGrant}</TabsTrigger>
          <TabsTrigger value="list">{t.tabList}</TabsTrigger>
          <TabsTrigger value="applications">{t.tabApplications}</TabsTrigger>
          {isAdmin ? <TabsTrigger value="credits">{t.tabCredits}</TabsTrigger> : null}
          {isAdmin ? <TabsTrigger value="perms">{t.tabPerms}</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="grant" className="pt-5">
          <ManualRoleTab isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="list" className="pt-5">
          <RoleListTab />
        </TabsContent>
        <TabsContent value="applications" className="pt-5">
          <ApplicationsTab isAdmin={isAdmin} />
        </TabsContent>
        {isAdmin ? (
          <TabsContent value="credits" className="pt-5">
            <CreditsTab />
          </TabsContent>
        ) : null}
        {isAdmin ? (
          <TabsContent value="perms" className="pt-5">
            <PermissionsTab />
          </TabsContent>
        ) : null}
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
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    // Admin cấp thẳng; manager chỉ ĐỀ XUẤT kèm lý do (admin duyệt sau).
    mutationFn: async ({
      email: e,
      role: r,
      note,
    }: {
      email: string;
      role: UserRole;
      note?: string;
    }): Promise<void> => {
      if (isAdmin) await setUserRole(e, r);
      else await requestRoleGrant(e, r, note);
    },
    onSuccess: (_data, vars) => {
      toast.success(
        isAdmin ? t.granted(roleLabels[vars.role], vars.email) : t.requestSent(vars.email),
      );
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
      void queryClient.invalidateQueries({ queryKey: ["role-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      setEmail("");
      setReason("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.grantFail),
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate({ email: trimmed, role, note: reason.trim() || undefined });
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
                type="text"
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
            {/* Manager đề xuất -> kèm lý do cho admin đọc. */}
            {!isAdmin ? (
              <div>
                <Label htmlFor="grant-reason">{t.reasonLabel}</Label>
                <textarea
                  id="grant-reason"
                  value={reason}
                  placeholder={t.reasonPh}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  disabled={mutation.isPending}
                  className="w-full resize-none rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                />
              </div>
            ) : null}
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
    </div>
  );
}

// Mục review gộp: đơn ứng tuyển Seller + đề xuất cấp quyền của manager.
type ReviewItem = {
  key: string;
  kind: "app" | "role";
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  createdAt: string;
  app?: CtvApplicationRow;
  req?: RoleRequestRow;
};

function ApplicationsTab({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const roleLabels = ROLE_LABELS[lang];
  const confirm = useConfirm();
  const [reviewerFilter, setReviewerFilter] = useState("all");

  const appsQuery = useQuery({ queryKey: ["applications"], queryFn: () => listApplications() });
  const reqsQuery = useQuery({ queryKey: ["role-requests"], queryFn: listRoleRequests });
  // Tên người duyệt (chỉ admin đọc được danh sách nhân sự).
  const staffQuery = useQuery({ queryKey: ["staff"], queryFn: listStaff, enabled: isAdmin });

  const staffName = new Map<string, string>();
  for (const p of staffQuery.data ?? []) staffName.set(p.id, p.display_name || p.username);

  const appMutation = useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      approveCtv(id, approve, note),
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? t.approvedCtv : t.rejectedApp);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.actionFail),
  });
  const roleMutation = useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      reviewRoleGrant(id, approve, note),
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? t.requestApproved : t.requestRejected);
      void queryClient.invalidateQueries({ queryKey: ["role-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.actionFail),
  });
  const busy = appMutation.isPending || roleMutation.isPending;

  if (appsQuery.isPending || reqsQuery.isPending) return <Skeleton className="h-40 rounded-2xl" />;

  const items: ReviewItem[] = [
    ...(appsQuery.data ?? []).map((a) => ({
      key: "app-" + a.id,
      kind: "app" as const,
      status: a.status,
      reviewedBy: a.reviewed_by,
      createdAt: a.created_at,
      app: a,
    })),
    ...(reqsQuery.data ?? []).map((r) => ({
      key: "role-" + r.id,
      kind: "role" as const,
      status: r.status,
      reviewedBy: r.reviewed_by,
      createdAt: r.created_at,
      req: r,
    })),
  ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const pending = items.filter((i) => i.status === "pending");
  let reviewed = items.filter((i) => i.status !== "pending");

  // Danh sách người duyệt xuất hiện trong mục đã xử lý (cho bộ lọc).
  const reviewerIds = Array.from(
    new Set(reviewed.map((i) => i.reviewedBy).filter((x): x is string => Boolean(x))),
  );
  if (reviewerFilter !== "all") reviewed = reviewed.filter((i) => i.reviewedBy === reviewerFilter);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        {t.noApps}
      </div>
    );
  }

  const approve = (i: ReviewItem, note?: string) => {
    if (i.kind === "app" && i.app) appMutation.mutate({ id: i.app.id, approve: true, note });
    if (i.kind === "role" && i.req) roleMutation.mutate({ id: i.req.id, approve: true, note });
  };
  const reject = async (i: ReviewItem) => {
    const r = await confirm({ title: t.reject, input: { label: t.rejectPrompt, multiline: true } });
    if (!r.ok) return;
    const note = r.value || undefined;
    if (i.kind === "app" && i.app) appMutation.mutate({ id: i.app.id, approve: false, note });
    if (i.kind === "role" && i.req) roleMutation.mutate({ id: i.req.id, approve: false, note });
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">{t.pendingHeading(pending.length)}</h3>
          {pending.map((i) => (
            <ReviewCard
              key={i.key}
              item={i}
              roleLabels={roleLabels}
              staffName={staffName}
              onApprove={isAdmin ? () => approve(i) : undefined}
              onReject={isAdmin ? () => reject(i) : undefined}
              busy={busy}
            />
          ))}
        </div>
      ) : null}

      {items.some((i) => i.status !== "pending") ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-muted">{t.reviewedHeading}</h3>
            {isAdmin && reviewerIds.length > 0 ? (
              <div className="w-52">
                <Select
                  value={reviewerFilter}
                  onChange={(e) => setReviewerFilter(e.target.value)}
                  aria-label={t.reviewerFilter}
                >
                  <option value="all">{t.allReviewers}</option>
                  {reviewerIds.map((id) => (
                    <option key={id} value={id}>
                      {staffName.get(id) ?? id.slice(0, 8)}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
          {reviewed.map((i) => (
            <ReviewCard key={i.key} item={i} roleLabels={roleLabels} staffName={staffName} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReviewCard({
  item,
  roleLabels,
  staffName,
  onApprove,
  onReject,
  busy,
}: {
  item: ReviewItem;
  roleLabels: Record<UserRole, string>;
  staffName: Map<string, string>;
  onApprove?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
  const t = usePick(STR);
  const isApp = item.kind === "app";
  const title = isApp ? item.app!.full_name : item.req!.target_email;
  const reviewerName = item.reviewedBy ? staffName.get(item.reviewedBy) : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isApp ? "gold" : "success"}>{isApp ? t.kindApp : t.kindRole}</Badge>
            <span className="font-heading font-semibold text-text">{title}</span>
            {!isApp ? (
              <span className="text-xs text-text-subtle">→ {roleLabels[item.req!.requested_role]}</span>
            ) : null}
            {item.status === "approved" ? (
              <Badge variant="success">
                <Check className="h-3 w-3" aria-hidden /> {t.badgeApproved}
              </Badge>
            ) : item.status === "rejected" ? (
              <Badge variant="danger">{t.badgeRejected}</Badge>
            ) : (
              <Badge variant="gold">{t.badgePending}</Badge>
            )}
            <span className="text-xs text-text-subtle">{relativeTime(item.createdAt)}</span>
          </div>

          {isApp ? (
            <>
              <p className="text-sm text-text-muted">
                <span className="text-text-subtle">{t.contactLabel}</span> {item.app!.contact}
              </p>
              {item.app!.games ? (
                <p className="text-sm text-text-muted">
                  <span className="text-text-subtle">{t.gamesLabel}</span> {item.app!.games}
                </p>
              ) : null}
              {item.app!.experience ? (
                <p className="text-sm text-text-muted">
                  <span className="text-text-subtle">{t.experienceLabel}</span> {item.app!.experience}
                </p>
              ) : null}
            </>
          ) : item.req!.note ? (
            <p className="text-sm text-text-muted">
              <span className="text-text-subtle">{t.noteLabel}</span> {item.req!.note}
            </p>
          ) : null}

          {reviewerName ? (
            <p className="text-xs text-text-subtle">{t.reviewedBy(reviewerName)}</p>
          ) : null}
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

const ROLE_BADGE: Record<string, "gold" | "success" | "green"> = {
  admin: "gold",
  manager: "gold",
  ctv: "success",
};

function RoleListTab() {
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const roleLabels = ROLE_LABELS[lang];
  const query = useQuery({ queryKey: ["staff"], queryFn: listStaff });
  const [managing, setManaging] = useState<ProfileRow | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");

  if (query.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  const all = query.data ?? [];
  if (all.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        {t.noStaff}
      </div>
    );

  const members = roleFilter === "all" ? all : all.filter((m) => m.role === roleFilter);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-text-muted">{members.length}</p>
        <div className="w-52">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label={t.filterRole}
          >
            <option value="all">{t.allRoles}</option>
            <option value="admin">{roleLabels.admin}</option>
            <option value="manager">{roleLabels.manager}</option>
            <option value="ctv">{roleLabels.ctv}</option>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {members.map((c) => (
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
            {c.ctv_all_categories && c.role === "ctv" ? (
              <Badge variant="gold">{t.allAccessBadge}</Badge>
            ) : null}
            {/* Phân danh mục chỉ áp cho Seller (admin/manager nhận mọi danh mục). */}
            {c.role === "ctv" ? (
              <Button variant="secondary" size="sm" onClick={() => setManaging(c)}>
                <FolderCog className="h-4 w-4" aria-hidden /> {t.manageCats}
              </Button>
            ) : null}
            <Badge variant={ROLE_BADGE[c.role] ?? "success"}>
              <BadgeCheck className="h-3 w-3" aria-hidden /> {roleLabels[c.role]}
            </Badge>
          </div>
        ))}
      </div>
      <CategoryAssignDialog ctv={managing} onClose={() => setManaging(null)} />
    </>
  );
}

/** Admin nạp/điều chỉnh số dư ví cho khách theo email. */
function CreditsTab() {
  const t = usePick(STR);
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sign, setSign] = useState<1 | -1>(1);

  const mutation = useMutation({
    mutationFn: () => adminAdjustCredit(email.trim(), (amount ?? 0) * sign, note.trim() || undefined),
    onSuccess: (bal) => {
      toast.success(t.creditDone(formatPrice(bal)));
      setAmount(null);
      setNote("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.actionFail),
  });

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-2xl border border-yellow/40 bg-yellow-soft px-4 py-3 text-sm text-text-muted">
        {t.creditInfo}
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <Label htmlFor="credit-email">{t.creditEmail}</Label>
            <Input
              id="credit-email"
              type="email"
              value={email}
              placeholder="user@email.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="credit-amount">{t.creditAmount}</Label>
            <div className="flex gap-2">
              <div className="flex overflow-hidden rounded-lg border border-border-strong">
                <button
                  type="button"
                  onClick={() => setSign(1)}
                  className={cn("px-3 text-sm font-semibold", sign === 1 ? "bg-green text-text-on-green" : "text-text-muted")}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setSign(-1)}
                  className={cn("px-3 text-sm font-semibold", sign === -1 ? "bg-danger text-white" : "text-text-muted")}
                >
                  −
                </button>
              </div>
              <PriceInput value={amount} onChange={setAmount} className="flex-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="credit-note">{t.creditNote}</Label>
            <Input
              id="credit-note"
              value={note}
              placeholder={t.creditNotePh}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!email.trim() || !amount || mutation.isPending}
          >
            {mutation.isPending ? t.saving : t.creditSubmit}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** Ma trận phân quyền: hàng = quyền, cột = Manager / Seller. Admin luôn full. */
function PermissionsTab() {
  const queryClient = useQueryClient();
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  const roleLabels = ROLE_LABELS[lang];
  const ROLES = ["manager", "ctv"] as const;

  const query = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const raw = query.data?.role_permissions as Record<string, Record<string, boolean>> | undefined;
    setPerms(raw ?? {});
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateSetting("role_permissions", perms),
    onSuccess: () => {
      toast.success(t.permsSaved);
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t.actionFail),
  });

  const toggle = (role: string, perm: string, val: boolean) =>
    setPerms((prev) => ({ ...prev, [role]: { ...(prev[role] ?? {}), [perm]: val } }));

  if (query.isPending) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-text-muted">{t.permsHint}</p>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs font-semibold uppercase tracking-wider text-text-subtle">
              <th className="px-4 py-3">Quyền</th>
              {ROLES.map((r) => (
                <th key={r} className="px-4 py-3 text-center">
                  {roleLabels[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-text">{t.permName[perm] ?? perm}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(perms[r]?.[perm])}
                      onChange={(e) => toggle(r, perm, e.target.checked)}
                      aria-label={`${roleLabels[r]} — ${t.permName[perm] ?? perm}`}
                      className="h-4 w-4 accent-yellow"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? t.saving : t.savePerms}
      </Button>
    </div>
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
