// Shared data-model types for Uniemarket.
//
// This is a DEMO app: everything here maps 1:1 to the local seed data in
// `src/data/*` and to what gets persisted into localStorage by the zustand
// stores in `src/store/*`. There is no backend — these types exist purely to
// keep the frontend consistent and to make a future swap to a real API (e.g.
// Supabase) a matter of changing `src/lib/api.ts` bodies, not component code.

/** A Roblox game whose items we sell (e.g. "Adopt Me", "Blox Fruits"). */
export interface Game {
  /** Slug used as the id and in the URL, e.g. "adopt-me". */
  id: string;
  name: string;
  tagline: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  /** Hex color used for gradients/placeholders/accents tied to this game. */
  accentColor: string;
  itemCount: number;
  rarityTiers: string[];
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
}

/** A single purchasable in-game item belonging to a Game. */
export interface Item {
  id: string;
  gameId: string;
  name: string;
  description: string;
  priceUSD: number;
  originalPriceUSD: number | null;
  rarity: string;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  stock: number;
  deliveryTime: string;
  isFeatured: boolean;
  discountPercent: number | null;
  tags: string[];
  createdAt: string;
}

/** A local demo user account (NOT real auth — see store/authStore.ts). */
export interface User {
  id: string;
  username: string;
  email: string;
  /** Demo-only. Never a real hash; see data/demoAccount.ts for details. */
  passwordHash: string;
  robloxUsername: string;
  avatarUrl?: string;
  role: "customer" | "admin";
  walletUSD: number;
  isVerified: boolean;
  createdAt: string;
}

/** A line item inside the shopping cart (cartStore). */
export interface CartItem {
  /** Unique id for this cart line (usually same as itemId). */
  id: string;
  itemId: string;
  gameId: string;
  name: string;
  imageUrl?: string;
  unitPriceUSD: number;
  quantity: number;
  lineTotalUSD: number;
}

/** A snapshot of an Item as it existed at the time an Order was placed. */
export interface OrderItem {
  itemId: string;
  gameName: string;
  name: string;
  rarity: string;
  unitPriceUSD: number;
  quantity: number;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "delivered"
  | "failed"
  | "cancelled"
  | "refunded";

export type DeliveryStatus = "awaiting" | "in_progress" | "delivered";

/** A completed (simulated) checkout, persisted by ordersStore. */
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  robloxUsername: string;
  subtotalUSD: number;
  discountUSD: number;
  totalUSD: number;
  status: OrderStatus;
  paymentMethod: string;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

/** A "proof of delivery" card shown on the /proofs page for social trust. */
export interface Proof {
  id: string;
  orderId: string;
  gameName: string;
  itemName: string;
  rarity: string;
  buyerMasked: string;
  amountUSD: number;
  staffName: string;
  proofImageUrl?: string;
  status: "Delivered" | "Verified";
  deliveredAt: string;
}

/** A customer review/testimonial shown on the homepage and /about. */
export interface Review {
  id: string;
  author: string;
  avatarUrl?: string;
  stars: number;
  text: string;
  gameId: string | null;
  itemName: string | null;
  verifiedPurchase: boolean;
  source: "Trustpilot" | "On-site" | "Discord";
  createdAt: string;
}

/** A single message inside a support chat thread (ChatWidget / /messages). */
export interface ChatMessage {
  id: string;
  threadId: string;
  author: "user" | "staff" | "bot";
  authorName: string;
  text: string;
  createdAt: string;
}

/** A support chat conversation. */
export interface ChatThread {
  id: string;
  userId: string | null;
  subject: string;
  messages: ChatMessage[];
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
}
