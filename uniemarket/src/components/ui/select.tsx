import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom dropdown thay cho <select> gốc (dropdown gốc do OS vẽ, không style được).
// Giữ API kiểu native: nhận <option> children + onChange(event.target.value) nên
// mọi nơi đang dùng <Select> không phải sửa gì.

interface OptionData {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

/** Gom các <option> (đệ quy qua Fragment/mảng) để dựng danh sách tùy chọn. */
function collectOptions(children: React.ReactNode, out: OptionData[]) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      collectOptions((child.props as { children?: React.ReactNode }).children, out);
      return;
    }
    if (child.type === "option") {
      const p = child.props as {
        value?: string | number;
        children?: React.ReactNode;
        disabled?: boolean;
      };
      out.push({ value: String(p.value ?? ""), label: p.children, disabled: !!p.disabled });
    }
  });
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, id, ...props }, _ref) => {
    const options: OptionData[] = [];
    collectOptions(children, options);

    const [open, setOpen] = React.useState(false);
    const [activeIdx, setActiveIdx] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const currentValue =
      value !== undefined
        ? String(value)
        : defaultValue !== undefined
          ? String(defaultValue)
          : undefined;
    const selectedIdx = options.findIndex((o) => o.value === currentValue);
    const selected = selectedIdx >= 0 ? options[selectedIdx] : options[0];

    const emit = React.useCallback(
      (v: string) => {
        onChange?.({
          target: { value: v },
          currentTarget: { value: v },
        } as unknown as React.ChangeEvent<HTMLSelectElement>);
      },
      [onChange],
    );

    // Đóng khi click ra ngoài.
    React.useEffect(() => {
      if (!open) return;
      function onPointerDown(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open]);

    function openWith(idx: number) {
      setActiveIdx(idx >= 0 ? idx : 0);
      setOpen(true);
    }

    function choose(idx: number) {
      const opt = options[idx];
      if (!opt || opt.disabled) return;
      if (opt.value !== currentValue) emit(opt.value);
      setOpen(false);
    }

    function moveActive(dir: 1 | -1) {
      setActiveIdx((prev) => {
        let i = prev;
        for (let step = 0; step < options.length; step++) {
          i = (i + dir + options.length) % options.length;
          if (!options[i]?.disabled) return i;
        }
        return prev;
      });
    }

    function onKeyDown(e: React.KeyboardEvent) {
      if (disabled) return;
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openWith(selectedIdx);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        choose(activeIdx);
      }
    }

    return (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openWith(selectedIdx))}
          onKeyDown={onKeyDown}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-strong bg-surface-2 px-3 text-left text-sm text-text transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow focus-visible:border-yellow",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "border-yellow ring-2 ring-yellow",
            className,
          )}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <span className="truncate">{selected?.label ?? ""}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-subtle transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            className="absolute z-50 mt-1.5 max-h-72 w-full min-w-max overflow-y-auto rounded-lg border border-border-strong bg-surface p-1 shadow-2xl"
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === currentValue;
              const isActive = idx === activeIdx;
              return (
                <li key={opt.value + idx} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => choose(idx)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      opt.disabled
                        ? "cursor-not-allowed text-text-disabled"
                        : "text-text-muted hover:text-text",
                      isActive && !opt.disabled && "bg-surface-2 text-text",
                      isSelected && "text-yellow",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <Check className="h-4 w-4 shrink-0 text-yellow" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";
