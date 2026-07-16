// Panel trạng thái "Đã giao — chờ khách xác nhận": gallery ảnh minh chứng + ghi chú.
// Nhân viên không còn thao tác nào ở bước này (khách tự bấm "Đã nhận hàng").
import { CheckCircle2, Truck } from "lucide-react";
import { relativeTime } from "@/lib/format";

export interface DeliveredPanelProps {
  proofImages: string[];
  note: string | null;
  deliveredAt: string | null;
}

/** Hiển thị minh chứng đã giao khi displayStatus === 'delivered'. */
export function DeliveredPanel({ proofImages, note, deliveredAt }: DeliveredPanelProps) {
  return (
    <section className="rounded-2xl border border-yellow bg-surface p-5 shadow-glow-amber">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-soft text-yellow">
          <Truck className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-text">
            Đã giao — chờ khách xác nhận
          </h2>
          <p className="text-xs text-text-subtle">
            {deliveredAt ? `Giao lúc ${relativeTime(deliveredAt)} · ` : ""}
            Khách sẽ xác nhận đã nhận hàng.
          </p>
        </div>
      </div>

      {proofImages.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {proofImages.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="aspect-square overflow-hidden rounded-lg border border-border-strong bg-surface-2 transition-opacity hover:opacity-90"
            >
              <img
                src={url}
                alt="Ảnh minh chứng giao hàng"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : null}

      {note ? (
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-xs font-semibold text-text-subtle">Ghi chú giao hàng</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-muted">{note}</p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
        Chờ khách bấm “Đã nhận hàng”. Không cần thao tác thêm.
      </div>
    </section>
  );
}
