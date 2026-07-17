// Popup xác nhận DÙNG CHUNG theo tông web (thay cho window.confirm/window.prompt
// mặc định của trình duyệt). Mount <ConfirmProvider> một lần ở main.tsx, rồi gọi
// bằng hook: const confirm = useConfirm(); const r = await confirm({...}).
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { usePick } from "@/i18n";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
  /** Ẩn nút Huỷ — dùng khi popup chỉ để thông báo (như alert). */
  hideCancel?: boolean;
  /** Nếu có → hiện ô nhập; kết quả trả về ở `value`. */
  input?: {
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
    multiline?: boolean;
  };
}

export interface ConfirmResult {
  ok: boolean;
  value?: string;
}

const LABELS = {
  vi: { confirm: "Xác nhận", cancel: "Huỷ" },
  en: { confirm: "Confirm", cancel: "Cancel" },
};

const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<ConfirmResult>>(() =>
  Promise.resolve({ ok: false }),
);

/** Gọi trong component: `const confirm = useConfirm();` rồi `await confirm({title,...})`. */
export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = usePick(LABELS);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [value, setValue] = useState("");
  const resolverRef = useRef<((r: ConfirmResult) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    setValue(o.input?.defaultValue ?? "");
    return new Promise<ConfirmResult>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((result: ConfirmResult) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpts(null);
  }, []);

  const inputRequiredUnmet = !!opts?.input?.required && value.trim() === "";

  function handleConfirm() {
    if (inputRequiredUnmet) return;
    settle({ ok: true, value: opts?.input ? value.trim() : undefined });
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={opts !== null}
        onOpenChange={(open) => {
          if (!open) settle({ ok: false });
        }}
      >
        {opts ? (
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{opts.title}</DialogTitle>
              {opts.message ? <DialogDescription>{opts.message}</DialogDescription> : null}
            </DialogHeader>

            {opts.input ? (
              <div className="space-y-1.5">
                {opts.input.label ? (
                  <label className="text-sm font-medium text-text-muted">{opts.input.label}</label>
                ) : null}
                {opts.input.multiline ? (
                  <textarea
                    autoFocus
                    rows={3}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={opts.input.placeholder}
                    className="w-full rounded-lg border border-border bg-surface-3 px-3 py-2 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                  />
                ) : (
                  <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirm();
                    }}
                    placeholder={opts.input.placeholder}
                    className="h-10 w-full rounded-lg border border-border bg-surface-3 px-3 text-sm text-text placeholder:text-text-subtle focus-visible:border-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
                  />
                )}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              {opts.hideCancel ? null : (
                <Button variant="secondary" size="sm" onClick={() => settle({ ok: false })}>
                  {opts.cancelText ?? t.cancel}
                </Button>
              )}
              <Button
                variant={opts.tone === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={handleConfirm}
                disabled={inputRequiredUnmet}
              >
                {opts.confirmText ?? t.confirm}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </ConfirmContext.Provider>
  );
}
