// Bộ độ hiếm chuẩn theo game — dùng chung cho editor sản phẩm (dropdown chọn
// khi tạo/sửa) và bộ lọc "Độ hiếm" trên trang game. Giá trị lưu thẳng vào
// products.rarity nên đổi tên ở đây KHÔNG tự đổi dữ liệu cũ.

/** Độ hiếm mặc định cho game chưa có bộ riêng.
 * ĐANG TẮT TOÀN BỘ ([]) — bộ lọc "All rarities" và trường Rarity trong editor
 * ẩn ở mọi game. Muốn bật lại: điền danh sách vào đây / RARITY_BY_GAME. */
export const RARITY_DEFAULT: string[] = [];

/** Bộ độ hiếm riêng theo game (key = categories.slug). */
export const RARITY_BY_GAME: Record<string, string[]> = {};

/** Danh sách độ hiếm cho một game (theo slug danh mục). */
export function rarityOptionsFor(slug: string | null | undefined): string[] {
  return (slug && RARITY_BY_GAME[slug]) || RARITY_DEFAULT;
}

/** "Item Type" riêng theo game (VD MM2: Chroma / FX / Other) — KHÔNG phải độ
 * hiếm. Lưu dưới dạng tag trên sản phẩm; game không có trong map thì không
 * hiện bộ lọc/dropdown này. */
/** ĐANG TẮT — bộ lọc "Item Type" và dropdown trong editor ẩn ở mọi game.
 * Muốn bật lại: thêm entry, VD "murder-mystery-2": ["Chroma", "FX", "Other"]. */
export const ITEMTYPE_BY_GAME: Record<string, string[]> = {};

/** Danh sách item type cho một game ([] = game không dùng). */
export function itemTypeOptionsFor(slug: string | null | undefined): string[] {
  return (slug && ITEMTYPE_BY_GAME[slug]) || [];
}

/** Game có bộ lọc theo tag tự do (admin gõ tag vào sản phẩm là thành lựa chọn
 * lọc) — value là nhãn hiển thị của dropdown. VD Adopt Me: tên pet/egg. */
export const TAG_FILTER_BY_GAME: Record<string, string> = {};

/** Nhãn riêng cho dropdown khu vực (sections) trong filter bar — mặc định
 * "All types"; VD PS99 gọi là "Item Type". */
export const SECTION_FILTER_LABEL_BY_GAME: Record<string, string> = {
  "pet-simulator-99": "Item Type",
};

/** Nhãn dropdown khu vực cho một game (null = dùng mặc định). */
export function sectionFilterLabelFor(slug: string | null | undefined): string | null {
  return (slug && SECTION_FILTER_LABEL_BY_GAME[slug]) || null;
}

/** Nhãn bộ lọc tag cho một game (null = game không dùng). */
export function tagFilterLabelFor(slug: string | null | undefined): string | null {
  return (slug && TAG_FILTER_BY_GAME[slug]) || null;
}

/** Trait của pet, lưu trên sản phẩm dưới dạng tag đúng mã (không phân biệt hoa
 * thường). VD Adopt Me: N = Neon; PS99 dùng làm "Pet Power" (Huge, Golden
 * Huge…) — code trùng label thì dropdown chỉ hiện code. */
export interface GameTrait {
  code: string;
  label: string;
}

export interface GameTraitConfig {
  /** Nhãn dropdown (VD "Traits", "Pet Power"). */
  label: string;
  options: GameTrait[];
}

export const TRAITS_BY_GAME: Record<string, GameTraitConfig> = {
  "pet-simulator-99": {
    label: "Pet Power",
    options: [
      { code: "Huge", label: "Huge" },
      { code: "Golden Huge", label: "Golden Huge" },
      { code: "Rainbow Huge", label: "Rainbow Huge" },
      { code: "Shiny Huge", label: "Shiny Huge" },
      { code: "Evolved Huge", label: "Evolved Huge" },
      { code: "Other", label: "Other" },
    ],
  },
};

/** Danh sách trait cho một game ([] = game không dùng). */
export function traitsFor(slug: string | null | undefined): GameTrait[] {
  return (slug && TRAITS_BY_GAME[slug]?.options) || [];
}

/** Nhãn dropdown trait cho một game (VD "Pet Power"); null = game không dùng. */
export function traitFilterLabelFor(slug: string | null | undefined): string | null {
  return (slug && TRAITS_BY_GAME[slug]?.label) || null;
}

/** Tab loại sản phẩm hiển thị trên game bar — game không có trong map thì hiện
 * đủ 5 tab (all/item/account/service/currency). */
export const KIND_TABS_BY_GAME: Record<string, string[]> = {
  "pet-simulator-99": ["all", "item", "account", "currency"],
  "adopt-me": ["all", "item", "account"],
  "murder-mystery-2": ["all", "item", "account"],
  "blox-fruits": ["all", "item", "account", "service"],
  "grow-a-garden": ["all", "item", "account", "currency"],
};

/** Danh sách tab kind cho một game (null = hiện tất cả). */
export function kindTabsVisibleFor(slug: string | null | undefined): string[] | null {
  return (slug && KIND_TABS_BY_GAME[slug]) || null;
}

/** Tag đánh dấu account có kèm email gốc (Original Email: Yes) — không hiển
 * thị trong các bộ lọc tag. */
export const ORIGINAL_EMAIL_TAG = "original-email";

/** Đơn vị giá cho sản phẩm currency theo game (VD PS99 bán gems theo $/B). */
export const SERVICE_PRICE_UNIT_BY_GAME: Record<string, string> = {
  "pet-simulator-99": "$/B",
};

/** Đơn vị giá currency cho một game (null = không có đơn vị riêng). */
export function servicePriceUnitFor(slug: string | null | undefined): string | null {
  return (slug && SERVICE_PRICE_UNIT_BY_GAME[slug]) || null;
}
