import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
import type { ServiceOptions } from "@/types/db";
import { PriceInput } from "./PriceInput";
import { makeOptionIds } from "./helpers";

// ----------------------------------------------------------------------------
// Draft state (chưa có id — id sinh tự động từ label khi lưu)
// ----------------------------------------------------------------------------

export type ServiceOptionsDraft =
  | { type: "none" }
  | { type: "tiers"; tiers: Array<{ label: string; price: number | null }> }
  | { type: "rank_range"; ranks: Array<{ label: string }>; stepPrice: number | null };

/** Chuyển service_options trong DB thành draft cho form. */
export function draftFromServiceOptions(options: ServiceOptions | null): ServiceOptionsDraft {
  if (!options) return { type: "none" };
  if (options.type === "tiers") {
    return {
      type: "tiers",
      tiers: options.tiers.map((tier) => ({ label: tier.label, price: tier.price })),
    };
  }
  return {
    type: "rank_range",
    ranks: options.ranks.map((rank) => ({ label: rank.label })),
    stepPrice: options.step_price,
  };
}

/**
 * Validate draft + build JSON sạch đúng shape trong @/types/db.
 * Trả về { error } tiếng Việt nếu chưa hợp lệ.
 */
export function buildServiceOptions(draft: ServiceOptionsDraft): {
  options: ServiceOptions | null;
  error?: string;
} {
  if (draft.type === "none") return { options: null };

  if (draft.type === "tiers") {
    const rows = draft.tiers
      .map((tier) => ({ label: tier.label.trim(), price: tier.price ?? 0 }))
      .filter((tier) => tier.label !== "" || tier.price > 0);
    if (rows.length < 1) {
      return { options: null, error: "Gói cố định cần ít nhất 1 gói (tên gói + giá)." };
    }
    if (rows.some((tier) => tier.label === "" || tier.price <= 0)) {
      return { options: null, error: "Mỗi gói cần có tên và giá lớn hơn 0." };
    }
    const ids = makeOptionIds(rows.map((row) => row.label));
    return {
      options: {
        type: "tiers",
        tiers: rows.map((row, i) => ({ id: ids[i], label: row.label, price: row.price })),
      },
    };
  }

  const ranks = draft.ranks
    .map((rank) => ({ label: rank.label.trim() }))
    .filter((rank) => rank.label !== "");
  if (ranks.length < 2) {
    return { options: null, error: "Khoảng rank cần ít nhất 2 bậc rank (theo thứ tự từ thấp đến cao)." };
  }
  if (!draft.stepPrice || draft.stepPrice <= 0) {
    return { options: null, error: "Giá mỗi bậc rank phải lớn hơn 0." };
  }
  const ids = makeOptionIds(ranks.map((rank) => rank.label));
  return {
    options: {
      type: "rank_range",
      step_price: draft.stepPrice,
      ranks: ranks.map((rank, i) => ({ id: ids[i], label: rank.label })),
    },
  };
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export interface ServiceOptionsBuilderProps {
  value: ServiceOptionsDraft;
  onChange: (draft: ServiceOptionsDraft) => void;
}

/** Trình cấu hình tuỳ chọn giá cho sản phẩm dịch vụ (tiers / rank_range). */
export function ServiceOptionsBuilder({ value, onChange }: ServiceOptionsBuilderProps) {
  const [previewFrom, setPreviewFrom] = useState(0);
  const [previewTo, setPreviewTo] = useState(-1); // -1 = bậc cuối cùng

  function handleTypeChange(type: string) {
    if (type === "tiers") {
      onChange({ type: "tiers", tiers: [{ label: "", price: null }] });
    } else if (type === "rank_range") {
      onChange({ type: "rank_range", ranks: [{ label: "" }, { label: "" }], stepPrice: null });
    } else {
      onChange({ type: "none" });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="svc-type">Kiểu tuỳ chọn giá</Label>
        <Select id="svc-type" value={value.type} onChange={(e) => handleTypeChange(e.target.value)}>
          <option value="none">Không có tuỳ chọn (giá cố định)</option>
          <option value="tiers">Gói cố định (khách chọn 1 gói)</option>
          <option value="rank_range">Khoảng rank (giá theo số bậc)</option>
        </Select>
      </div>

      {value.type === "tiers" ? (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Mỗi gói gồm tên + giá. Khách chọn đúng 1 gói khi đặt hàng.
          </p>
          {value.tiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={tier.label}
                placeholder={`Tên gói ${index + 1} (VD: Gói 100 trận)`}
                className="flex-1"
                onChange={(e) => {
                  const tiers = value.tiers.map((row, i) =>
                    i === index ? { ...row, label: e.target.value } : row,
                  );
                  onChange({ ...value, tiers });
                }}
              />
              <PriceInput
                value={tier.price}
                className="w-40 shrink-0"
                onChange={(price) => {
                  const tiers = value.tiers.map((row, i) => (i === index ? { ...row, price } : row));
                  onChange({ ...value, tiers });
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 px-2"
                disabled={value.tiers.length <= 1}
                onClick={() =>
                  onChange({ ...value, tiers: value.tiers.filter((_, i) => i !== index) })
                }
              >
                <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                <span className="sr-only">Xoá gói {index + 1}</span>
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange({ ...value, tiers: [...value.tiers, { label: "", price: null }] })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Thêm gói
          </Button>
        </div>
      ) : null}

      {value.type === "rank_range" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-text-muted">
              Liệt kê các bậc rank theo thứ tự <span className="font-semibold">từ thấp đến cao</span>.
              Giá = giá mỗi bậc × số bậc giữa rank hiện tại và rank mong muốn.
            </p>
            {value.ranks.map((rank, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center font-mono text-xs text-text-subtle">
                  {index + 1}
                </span>
                <Input
                  value={rank.label}
                  placeholder={`Bậc rank ${index + 1} (VD: Vàng IV)`}
                  className="flex-1"
                  onChange={(e) => {
                    const ranks = value.ranks.map((row, i) =>
                      i === index ? { label: e.target.value } : row,
                    );
                    onChange({ ...value, ranks });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2"
                  disabled={index === 0}
                  onClick={() => {
                    const ranks = [...value.ranks];
                    [ranks[index - 1], ranks[index]] = [ranks[index], ranks[index - 1]];
                    onChange({ ...value, ranks });
                  }}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Chuyển lên</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2"
                  disabled={index === value.ranks.length - 1}
                  onClick={() => {
                    const ranks = [...value.ranks];
                    [ranks[index], ranks[index + 1]] = [ranks[index + 1], ranks[index]];
                    onChange({ ...value, ranks });
                  }}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Chuyển xuống</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-2"
                  disabled={value.ranks.length <= 2}
                  onClick={() =>
                    onChange({ ...value, ranks: value.ranks.filter((_, i) => i !== index) })
                  }
                >
                  <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                  <span className="sr-only">Xoá bậc {index + 1}</span>
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onChange({ ...value, ranks: [...value.ranks, { label: "" }] })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Thêm bậc rank
            </Button>
          </div>

          <div>
            <Label htmlFor="svc-step-price">Giá mỗi bậc rank</Label>
            <PriceInput
              id="svc-step-price"
              value={value.stepPrice}
              className="max-w-[220px]"
              onChange={(stepPrice) => onChange({ ...value, stepPrice })}
            />
          </div>

          <RankPreview
            ranks={value.ranks.map((rank) => rank.label.trim()).filter(Boolean)}
            stepPrice={value.stepPrice}
            from={previewFrom}
            to={previewTo}
            onFromChange={setPreviewFrom}
            onToChange={setPreviewTo}
          />
        </div>
      ) : null}
    </div>
  );
}

interface RankPreviewProps {
  ranks: string[];
  stepPrice: number | null;
  from: number;
  to: number;
  onFromChange: (index: number) => void;
  onToChange: (index: number) => void;
}

/** Xem trước giá: "Từ X đến Y = Z ₫" đúng công thức server dùng. */
function RankPreview({ ranks, stepPrice, from, to, onFromChange, onToChange }: RankPreviewProps) {
  if (ranks.length < 2 || !stepPrice || stepPrice <= 0) {
    return (
      <p className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-3 py-2 text-xs text-text-subtle">
        Nhập đủ tối thiểu 2 bậc rank + giá mỗi bậc để xem trước giá.
      </p>
    );
  }

  const fromIndex = Math.min(Math.max(from, 0), ranks.length - 2);
  const toIndex = to < 0 ? ranks.length - 1 : Math.min(Math.max(to, fromIndex + 1), ranks.length - 1);
  const steps = toIndex - fromIndex;
  const price = steps * stepPrice;

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
        Xem trước giá
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(fromIndex)}
          className="h-9 w-40"
          onChange={(e) => onFromChange(Number(e.target.value))}
          aria-label="Rank hiện tại"
        >
          {ranks.slice(0, -1).map((label, index) => (
            <option key={index} value={index}>
              {label}
            </option>
          ))}
        </Select>
        <span className="text-sm text-text-muted">đến</span>
        <Select
          value={String(toIndex)}
          className="h-9 w-40"
          onChange={(e) => onToChange(Number(e.target.value))}
          aria-label="Rank mong muốn"
        >
          {ranks.map((label, index) =>
            index > fromIndex ? (
              <option key={index} value={index}>
                {label}
              </option>
            ) : null,
          )}
        </Select>
      </div>
      <p className="mt-2 text-sm text-text">
        Từ <span className="font-semibold">{ranks[fromIndex]}</span> đến{" "}
        <span className="font-semibold">{ranks[toIndex]}</span> ={" "}
        <span className="font-mono font-semibold text-yellow tabular-nums-mono">
          {formatPrice(price)}
        </span>{" "}
        <span className="text-text-subtle">
          ({steps} bậc × {formatPrice(stepPrice)})
        </span>
      </p>
    </div>
  );
}
