// Kiểu dữ liệu (hand-written) khớp 1:1 với schema Supabase trong
// supabase/01-schema.sql. KHÔNG dùng codegen — nếu đổi schema, sửa file này.
//
// Quy ước: tên field snake_case đúng như cột trong Postgres để đọc/ghi
// trực tiếp qua supabase-js không cần mapping.

// ----------------------------------------------------------------------------
// Enums (khớp các CREATE TYPE trong 01-schema.sql)
// ----------------------------------------------------------------------------

export type UserRole = "customer" | "ctv" | "admin";
export type ProductKind = "item" | "service";
export type DbOrderStatus =
  | "pending_payment"
  | "paid"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded";
export type DbPaymentMethod = "bank_transfer" | "momo";
export type ThreadKind = "order" | "staff";
export type CtvApplicationStatus = "pending" | "approved" | "rejected";
export type OrderEventType =
  | "created"
  | "payment_confirmed"
  | "assigned"
  | "status_changed"
  | "note"
  | "cancelled"
  | "refunded";

// ----------------------------------------------------------------------------
// service_options trên products (2 dạng — giá LUÔN do server tính lại)
// ----------------------------------------------------------------------------

/** Gói cố định: khách chọn 1 tier, giá = price của tier. */
export interface ServiceOptionsTiers {
  type: "tiers";
  tiers: Array<{ id: string; label: string; price: number }>;
}

/** Kéo rank: khách chọn from/to trong danh sách ranks (đã xếp thứ tự),
 * giá = step_price × số bậc giữa from và to. */
export interface ServiceOptionsRankRange {
  type: "rank_range";
  step_price: number;
  ranks: Array<{ id: string; label: string }>;
}

export type ServiceOptions = ServiceOptionsTiers | ServiceOptionsRankRange;

/** Lựa chọn của khách cho 1 dòng hàng service, gửi lên place_order. */
export type SelectedServiceOptions =
  | { tier_id: string }
  | { from: string; to: string };

// ----------------------------------------------------------------------------
// Rows
// ----------------------------------------------------------------------------

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  discord: string | null;
  role: UserRole;
  last_seen_at: string | null;
  ctv_all_categories: boolean;
  created_at: string;
  updated_at: string;
}

/** View public_profiles — thông tin tối thiểu để hiển thị trong chat. */
export interface PublicProfileRow {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  last_seen_at: string | null;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon_url: string | null;
  banner_url: string | null;
  accent_color: string | null;
  contact_field_label: string | null;
  contact_field_placeholder: string | null;
  /** Các khu vực trong danh mục (thứ tự hiển thị) — admin đặt, vd ["Pets","Eggs"]. */
  sections: string[];
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  category_id: string;
  slug: string;
  kind: ProductKind;
  name: string;
  description: string | null;
  /** VNĐ */
  price: number;
  original_price: number | null;
  currency: string;
  /** null = không quản lý tồn kho (luôn còn hàng). Chỉ dùng cho kind='item'. */
  stock: number | null;
  images: string[];
  rarity: string | null;
  /** Khu vực trong danh mục (khớp categories.sections). null = chưa phân khu. */
  section: string | null;
  delivery_time_text: string | null;
  service_options: ServiceOptions | null;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  /** Mã đơn ngắn 'UM-XXXXXX' — dùng làm nội dung chuyển khoản. */
  order_code: string;
  user_id: string;
  status: DbOrderStatus;
  category_id: string | null;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  payment_method: DbPaymentMethod | null;
  payment_gateway: string | null;
  payment_ref: string | null;
  game_username: string | null;
  contact_channel: string | null;
  contact_value: string | null;
  customer_note: string | null;
  assigned_ctv: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  paid_confirmed_at: string | null;
  paid_confirmed_by: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  // Luồng giao hàng online (05-order-flow.sql):
  cancel_requested_at: string | null;
  cancel_request_reason: string | null;
  delivered_at: string | null;
  delivery_note: string | null;
  delivery_proof_images: string[];
  buyer_confirmed_at: string | null;
  // Luồng hoàn tiền (07-refund-realtime.sql):
  refund_requested_at: string | null;
  refund_reason: string | null;
  refund_request_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Trạng thái hiển thị cho khách (gồm cả bước "đã giao, chờ xác nhận"). */
export type OrderDisplayStatus =
  | "pending_payment"
  | "paid"
  | "in_progress"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

/** Suy ra trạng thái hiển thị từ 1 đơn (delivered = in_progress + đã có delivered_at). */
export function orderDisplayStatus(o: {
  status: DbOrderStatus;
  delivered_at: string | null;
  buyer_confirmed_at: string | null;
}): OrderDisplayStatus {
  if (o.status === "in_progress" && o.delivered_at && !o.buyer_confirmed_at) return "delivered";
  return o.status;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_kind: ProductKind;
  name: string;
  category_name: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  selected_options: Record<string, unknown> | null;
}

export interface OrderEventRow {
  id: number;
  order_id: string;
  actor_id: string | null;
  event_type: OrderEventType;
  note: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface ThreadRow {
  id: string;
  kind: ThreadKind;
  order_id: string | null;
  title: string | null;
  created_by: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachments: string[];
  created_at: string;
}

export interface CtvApplicationRow {
  id: string;
  user_id: string;
  full_name: string;
  contact: string;
  experience: string | null;
  games: string | null;
  status: CtvApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  note: string | null;
  created_at: string;
}

export interface ProofRow {
  id: string;
  order_id: string | null;
  game_name: string;
  item_name: string;
  rarity: string | null;
  buyer_masked: string | null;
  /** VNĐ */
  amount: number | null;
  staff_name: string | null;
  proof_image_url: string | null;
  status: string;
  delivered_at: string;
}

export interface ReviewRow {
  id: string;
  author: string;
  avatar_url: string | null;
  stars: number;
  text: string;
  category_slug: string | null;
  item_name: string | null;
  verified_purchase: boolean;
  source: string | null;
  /** Đánh giá gắn với đơn/CTV (09-reviews-refund-time.sql). */
  order_id: string | null;
  ctv_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface AppSettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface NotificationRow {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Input types cho data layer (src/lib/db/*)
// ----------------------------------------------------------------------------

/** Upsert danh mục: slug + name bắt buộc; các field khác tùy chọn. */
export type CategoryUpsert = Partial<
  Omit<CategoryRow, "id" | "created_at" | "updated_at">
> & { id?: string; slug: string; name: string };

/** Upsert sản phẩm: các field cốt lõi bắt buộc. */
export type ProductUpsert = Partial<
  Omit<ProductRow, "id" | "created_at" | "updated_at">
> & {
  id?: string;
  category_id: string;
  slug: string;
  kind: ProductKind;
  name: string;
  price: number;
};

/** Một dòng hàng gửi lên RPC place_order. */
export interface PlaceOrderItem {
  productId: string;
  quantity: number;
  /** Bắt buộc với service có service_options (tier hoặc rank range). */
  selectedOptions?: SelectedServiceOptions;
}

export interface PlaceOrderPayload {
  items: PlaceOrderItem[];
  paymentMethod: DbPaymentMethod;
  /** Id cổng thanh toán khách chọn (bank_transfer | momo | stripe | crypto | paypal…). */
  gateway?: string;
  gameUsername: string;
  contactChannel: string;
  contactValue: string;
  note?: string;
}

export interface CtvApplicationInput {
  fullName: string;
  contact: string;
  experience?: string;
  games?: string;
}

/** OrderRow kèm các dòng hàng — trả về từ getOrder(). */
export type OrderWithItems = OrderRow & { items: OrderItemRow[] };
