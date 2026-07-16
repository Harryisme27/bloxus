import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications, approveCtv } from "@/lib/db/applications";
import { listCtvs } from "@/lib/db/profiles";
import { relativeTime } from "@/lib/format";
import type { CtvApplicationRow } from "@/types/db";

/** /work/ctv (admin) — duyệt đơn ứng tuyển + danh sách CTV. */
export function WorkCtv() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">Cộng tác viên</h1>
        <p className="mt-1 text-sm text-text-muted">
          Duyệt đơn ứng tuyển và quản lý đội ngũ CTV. Duyệt = cấp quyền vào khu làm việc.
        </p>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Đơn ứng tuyển</TabsTrigger>
          <TabsTrigger value="list">Danh sách CTV</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="pt-5">
          <ApplicationsTab />
        </TabsContent>
        <TabsContent value="list" className="pt-5">
          <CtvListTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplicationsTab() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["applications"], queryFn: () => listApplications() });

  const mutation = useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
      approveCtv(id, approve, note),
    onSuccess: (_data, vars) => {
      toast.success(vars.approve ? "Đã duyệt CTV." : "Đã từ chối đơn.");
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["ctvs"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Thao tác thất bại."),
  });

  if (query.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  if (query.isError) return <p className="text-sm text-danger">Không tải được danh sách đơn.</p>;

  const apps = query.data ?? [];
  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        Chưa có đơn ứng tuyển nào.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">Chờ duyệt ({pending.length})</h3>
          {pending.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={() => mutation.mutate({ id: app.id, approve: true })}
              onReject={() => {
                const note = window.prompt("Lý do từ chối (không bắt buộc):") ?? undefined;
                mutation.mutate({ id: app.id, approve: false, note });
              }}
              busy={mutation.isPending}
            />
          ))}
        </div>
      ) : null}
      {reviewed.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted">Đã xử lý</h3>
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
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-text">{app.full_name}</span>
            {app.status === "approved" ? (
              <Badge variant="success">
                <Check className="h-3 w-3" aria-hidden /> Đã duyệt
              </Badge>
            ) : app.status === "rejected" ? (
              <Badge variant="danger">Đã từ chối</Badge>
            ) : (
              <Badge variant="gold">Chờ duyệt</Badge>
            )}
            <span className="text-xs text-text-subtle">{relativeTime(app.created_at)}</span>
          </div>
          <p className="text-sm text-text-muted">
            <span className="text-text-subtle">Liên hệ:</span> {app.contact}
          </p>
          {app.games ? (
            <p className="text-sm text-text-muted">
              <span className="text-text-subtle">Game/dịch vụ:</span> {app.games}
            </p>
          ) : null}
          {app.experience ? (
            <p className="text-sm text-text-muted">
              <span className="text-text-subtle">Kinh nghiệm:</span> {app.experience}
            </p>
          ) : null}
          {app.note ? <p className="text-xs text-warning">Ghi chú: {app.note}</p> : null}
        </div>
        {onApprove ? (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={onApprove} disabled={busy}>
              <Check className="h-4 w-4" aria-hidden /> Duyệt
            </Button>
            <Button size="sm" variant="secondary" onClick={onReject} disabled={busy}>
              <X className="h-4 w-4" aria-hidden /> Từ chối
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CtvListTab() {
  const query = useQuery({ queryKey: ["ctvs"], queryFn: listCtvs });
  if (query.isPending) return <Skeleton className="h-40 rounded-2xl" />;
  const ctvs = query.data ?? [];
  if (ctvs.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-text-muted">
        Chưa có CTV nào. Duyệt đơn ứng tuyển để thêm CTV.
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
            <BadgeCheck className="h-3 w-3" aria-hidden /> CTV
          </Badge>
        </div>
      ))}
    </div>
  );
}
