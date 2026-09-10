import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom dropdown thay cho <select> gốc (dropdown gốc do OS vẽ, không style được).
// Giữ API kiểu native: nhận <option> children + onChange(event.target.value) nên
// mọi nơi đang dùng <Select> không phải sửa gì.

interface OptionData {
  value: string;
  label: React.ReactNode;
  /** Text thuần của label (đệ quy qua JSX) — dùng cho ô tìm kiếm. */
  text: string;
  disabled?: boolean;
}

/** Trích text thuần từ một ReactNode (đệ quy). */
function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return "";
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
      out.push({
        value: String(p.value ?? ""),
        label: p.children,
        text: textOf(p.children),
        disabled: !!p.disabled,
      });
    }
  });
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Hiện ô tìm kiếm trong dropdown — gõ để lọc lựa chọn (cho danh sách dài). */
  searchable?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, id, searchable, ...props }, _ref) => {
    const allOptions: OptionData[] = [];
    collectOptions(children, allOptions);

    const [open, setOpen] = React.useState(false);
    const [activeIdx, setActiveIdx] = React.useState(-1);
    const [query, setQuery] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchRef = React.useRef<HTMLInputElement>(null);

    // Lọc theo từ khoá (chỉ khi searchable); label không phải string thì giữ lại.
    const q = query.trim().toLowerCase();
    const options =
      searchable && q ? allOptions.filter((o) => o.text.toLowerCase().includes(q)) : allOptions;

    // Mở dropdown searchable -> focus ô tìm; đóng -> xoá từ khoá.
    React.useEffect(() => {
      if (!searchable) return;
      if (open) searchRef.current?.focus();
      else setQuery("");
    }, [open, searchable]);

    const currentValue =
      value !== undefined
        ? String(value)
        : defaultValue !== undefined
          ? String(defaultValue)
          : undefined;
    // Nhãn trên nút lấy từ danh sách ĐẦY ĐỦ (không bị ảnh hưởng bởi bộ lọc tìm).
    const selectedFull = allOptions.find((o) => o.value === currentValue) ?? allOptions[0];
    const selected = selectedFull;
    const selectedIdx = options.findIndex((o) => o.value === currentValue);

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
          <div className="absolute z-50 mt-1.5 w-full min-w-max rounded-lg border border-border-strong bg-surface shadow-2xl">
            {searchable ? (
              <div className="border-b border-border p-1.5">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  placeholder="Tìm... / Search..."
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIdx(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setOpen(false);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      moveActive(1);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      moveActive(-1);
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      choose(activeIdx >= 0 ? activeIdx : 0);
                    }
                  }}
                  className="h-8 w-full rounded-md border border-border-strong bg-surface-2 px-2.5 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-1 focus:ring-yellow"
                />
              </div>
            ) : null}
            <ul role="listbox" className="max-h-72 overflow-y-auto p-1">
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
            {options.length === 0 ? (
              <li className="px-2.5 py-2 text-sm text-text-subtle">—</li>
            ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";
