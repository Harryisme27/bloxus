// Tiện ích dùng chung cho khu quản trị (/work/catalog, /work/settings, /work/ctv).

/** Bỏ dấu tiếng Việt + tạo slug: "Kéo Rank Cao Thủ" -> "keo-rank-cao-thu". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** "tag1, tag2 , ,tag3" -> ["tag1", "tag2", "tag3"]. */
export function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Sinh id cho các dòng option (tier / rank) từ label, đảm bảo không trùng
 * trong cùng danh sách: ["Đồng", "Bạc", "Đồng"] -> ["dong", "bac", "dong-2"].
 */
export function makeOptionIds(labels: string[]): string[] {
  const seen = new Map<string, number>();
  return labels.map((label) => {
    const base = slugify(label) || "muc";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

/** 875000 -> "875.000" (chỉ số, không kèm ₫ — dùng cho ô nhập giá). */
export function formatThousands(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

/** ISO -> "16/07/2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
