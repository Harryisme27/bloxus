// Thư viện ảnh bằng chứng giao hàng cho khách xem ở trang chi tiết đơn.
// Giá trị trong delivery_proof_images có thể là public URL sẵn hoặc chỉ là
// path trong bucket 'proof-images' — tự dựng public URL khi cần.
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { usePick } from "@/i18n";

const STR = {
  vi: { proofAlt: (n: number) => `Ảnh giao hàng ${n}` },
  en: { proofAlt: (n: number) => `Delivery image ${n}` },
};

/** Trả về URL hiển thị: giữ nguyên nếu đã là http(s), nếu không thì dựng public URL từ bucket. */
function resolveProofUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!supabase) return pathOrUrl;
  return supabase.storage.from("proof-images").getPublicUrl(pathOrUrl).data.publicUrl;
}

export function DeliveryProofGallery({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) {
  const t = usePick(STR);
  if (!images || images.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {images.map((img, index) => {
        const url = resolveProofUrl(img);
        return (
          <a
            key={`${img}-${index}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group relative block overflow-hidden rounded-lg border border-border bg-surface-2"
          >
            <img
              src={url}
              alt={t.proofAlt(index + 1)}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </a>
        );
      })}
    </div>
  );
}
