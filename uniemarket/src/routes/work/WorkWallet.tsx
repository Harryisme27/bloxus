// /work/wallet (admin) — duyệt yêu cầu NẠP và RÚT tiền.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  listTopupRequests,
  reviewTopup,
  listWithdrawalRequests,
  reviewWithdrawal,
} from "@/lib/db/credit";
import { formatPrice, relativeTime } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TopupRequestRow, WithdrawalRequestRow } from "@/types/db";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Ví — duyệt nạp/rút",
    subtitle: "Duyệt yêu cầu nạp tiền và rút tiền của người dùng.",
    topupTitle: "Yêu cầu nạp tiền",
    withdrawTitle: "Yêu cầu rút tiền",
    none: "Không có yêu cầu nào.",
    approve: "Duyệt",
    reject: "Từ chối",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    pending: "Chờ duyệt",
    fee: "Phí",
    net: "Thực nhận",
    done: "Đã xử lý.",
  },
  en: {
    title: "Wallet — approvals",
    subtitle: "Approve users' top-up and withdrawal requests.",
    topupTitle: "Top-up requests",
    withdrawTitle: "Withdrawal requests",
    none: "No requests.",
    approve: "Approve",
    reject: "Reject",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
    fee: "Fee",
    net: "Net",
    done: "Done.",
  },
};

export function WorkWallet() {
  const t = usePick(STR);
  const queryClient = useQueryClient();

  const topupQ = useQuery({ queryKey: ["topup-requests"], queryFn: listTopupRequests, enabled: isSupabaseConfigured });
  const withdrawQ = useQuery({ queryKey: ["withdrawal-requests"], queryFn: listWithdrawalRequests, enabled: isSupabaseConfigured });

  const topupMut = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => reviewTopup(id, approve),
    onSuccess: () => {
      toast.success(t.done);
      void queryClient.invalidateQueries({ queryKey: ["topup-requests"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });
  const withdrawMut = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => reviewWithdrawal(id, approve),
    onSuccess: () => {
      toast.success(t.done);
      void queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Error"),
  });

  const statusBadge = (status: string) =>
    status === "approved" ? (
      <Badge variant="success">{t.approved}</Badge>
    ) : status === "rejected" ? (
      <Badge variant="danger">{t.rejected}</Badge>
    ) : (
      <Badge variant="gold">{t.pending}</Badge>
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">{t.title}</h1>
        <p className="mt-1 text-sm text-text-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nạp tiền */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-green" aria-hidden />
            <h2 className="font-heading text-lg font-semibold text-text">{t.topupTitle}</h2>
          </div>
          {topupQ.isPending ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (topupQ.data ?? []).length === 0 ? (
            <EmptyBox text={t.none} />
          ) : (
            <div className="space-y-2">
              {(topupQ.data ?? []).map((r: TopupRequestRow) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-text">{formatPrice(r.amount)}</p>
                      <p className="text-xs text-text-subtle">
                        {relativeTime(r.created_at)}
                        {r.note ? ` · ${r.note}` : ""}
                      </p>
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" disabled={topupMut.isPending} onClick={() => topupMut.mutate({ id: r.id, approve: true })}>
                          <Check className="h-3.5 w-3.5" aria-hidden /> {t.approve}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={topupMut.isPending} onClick={() => topupMut.mutate({ id: r.id, approve: false })}>
                          <X className="h-3.5 w-3.5" aria-hidden /> {t.reject}
                        </Button>
                      </div>
                    ) : (
                      statusBadge(r.status)
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Rút tiền */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-yellow" aria-hidden />
            <h2 className="font-heading text-lg font-semibold text-text">{t.withdrawTitle}</h2>
          </div>
          {withdrawQ.isPending ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (withdrawQ.data ?? []).length === 0 ? (
            <EmptyBox text={t.none} />
          ) : (
            <div className="space-y-2">
              {(withdrawQ.data ?? []).map((r: WithdrawalRequestRow) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-text">{formatPrice(r.amount)}</p>
                      <p className="text-xs text-text-subtle">
                        {t.fee}: {formatPrice(r.fee)} · {t.net}: {formatPrice(r.net)} · {relativeTime(r.created_at)}
                      </p>
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" disabled={withdrawMut.isPending} onClick={() => withdrawMut.mutate({ id: r.id, approve: true })}>
                          <Check className="h-3.5 w-3.5" aria-hidden /> {t.approve}
                        </Button>
                        <Button size="sm" variant="secondary" disabled={withdrawMut.isPending} onClick={() => withdrawMut.mutate({ id: r.id, approve: false })}>
                          <X className="h-3.5 w-3.5" aria-hidden /> {t.reject}
                        </Button>
                      </div>
                    ) : (
                      statusBadge(r.status)
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-8 text-center text-sm text-text-muted">
      {text}
    </div>
  );
}
