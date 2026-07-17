import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePick } from "@/i18n";

const STR = {
  vi: { loadError: "Không tải được dữ liệu", retry: "Thử lại" },
  en: { loadError: "Couldn't load data", retry: "Try again" },
};

/** Khối báo lỗi tải dữ liệu + nút thử lại (dùng cho isError của useQuery). */
export function LoadError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const t = usePick(STR);
  return (
    <div className="rounded-2xl border border-border-strong bg-surface p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-danger" aria-hidden />
      <p className="mt-3 font-heading text-base font-semibold text-text">{t.loadError}</p>
      {message ? <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">{message}</p> : null}
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        {t.retry}
      </Button>
    </div>
  );
}

/** Khối trạng thái rỗng (chưa có dữ liệu). */
export function EmptyBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-text-subtle" aria-hidden />
      <p className="mt-3 font-heading text-base font-semibold text-text">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">{hint}</p> : null}
    </div>
  );
}

/** Skeleton dạng danh sách/bảng khi đang tải. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
