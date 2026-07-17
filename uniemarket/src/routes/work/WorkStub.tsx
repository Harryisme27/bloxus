import { Construction } from "lucide-react";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    building: "Phase 2 đang xây dựng",
    note: "Màn hình này sẽ được hoàn thiện ở giai đoạn tiếp theo.",
  },
  en: {
    building: "Phase 2 in progress",
    note: "This screen will be completed in the next phase.",
  },
};

/**
 * Khung trang tạm cho các màn hình khu làm việc — Phase 2 thay ruột từng
 * trang trong src/routes/work/*.tsx (mỗi trang 1 file riêng).
 */
export function WorkStub({ title, description }: { title: string; description?: string }) {
  const t = usePick(STR);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text">{title}</h1>
        {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
      </div>
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-subtle">
          <Construction className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-4 font-heading text-lg font-semibold text-text">{t.building}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">{t.note}</p>
      </div>
      {!isSupabaseConfigured ? <SetupNotice /> : null}
    </div>
  );
}
