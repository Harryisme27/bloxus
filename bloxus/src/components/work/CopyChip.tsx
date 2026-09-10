// Nút sao chép + chip liên hệ khách hàng — dùng khắp khu làm việc.
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePick, useLangStore } from "@/i18n";
import { contactChannelLabel } from "./workData";

const STR = {
  vi: {
    copiedWith: (l: string) => `Đã sao chép ${l}.`,
    copied: "Đã sao chép.",
    copyFail: "Không sao chép được — hãy copy thủ công.",
    copyWith: (l: string) => `Sao chép ${l}`,
    copy: "Sao chép",
    contact: "liên hệ",
  },
  en: {
    copiedWith: (l: string) => `Copied ${l}.`,
    copied: "Copied.",
    copyFail: "Couldn't copy — please copy manually.",
    copyWith: (l: string) => `Copy ${l}`,
    copy: "Copy",
    contact: "contact",
  },
};

/** Nút sao chép nhỏ (icon), toast xác nhận khi copy xong. */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** Tên dữ liệu để đọc trong toast, ví dụ "mã đơn". */
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = usePick(STR);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(label ? t.copiedWith(label) : t.copied);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t.copyFail);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-subtle transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow",
        className,
      )}
      aria-label={label ? t.copyWith(label) : t.copy}
      title={label ? t.copyWith(label) : t.copy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}

/** Chip liên hệ khách: kênh + giá trị + nút copy. */
export function ContactChip({
  channel,
  value,
  className,
}: {
  channel: string | null;
  value: string | null;
  className?: string;
}) {
  const t = usePick(STR);
  const lang = useLangStore((state) => state.lang);
  if (!value) return <span className="text-sm text-text-subtle">—</span>;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 py-1 pl-2.5 pr-1 text-xs",
        className,
      )}
    >
      <span className="shrink-0 font-semibold text-text-muted">
        {contactChannelLabel(channel, lang)}
      </span>
      <span className="truncate font-mono text-text">{value}</span>
      <CopyButton value={value} label={t.contact} className="h-5 w-5" />
    </span>
  );
}
