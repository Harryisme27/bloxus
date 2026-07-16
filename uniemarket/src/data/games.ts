// SEED DATA — chủ shop có thể sửa file này.
//
// Đây là danh sách các game mà cửa hàng bán vật phẩm. Muốn thêm game mới, chỉ
// cần thêm một object mới vào mảng GAMES bên dưới (nhớ đặt `id` là slug viết
// thường, không dấu, cách nhau bằng dấu gạch ngang — id này sẽ xuất hiện trên
// URL dạng /games/<id>). `itemCount` được tính tự động ở cuối file dựa trên số
// vật phẩm thực tế trong items.ts, không cần tự đếm tay.
import type { Game } from "@/types";
import { ITEMS_BY_GAME_COUNT } from "./items";

// Danh sách "chưa tính itemCount" — itemCount sẽ được ghép vào ở cuối file.
const GAMES_BASE: Omit<Game, "itemCount">[] = [
  {
    id: "adopt-me",
    name: "Adopt Me",
    tagline: "The most-played pet-trading game on Roblox.",
    description:
      "Adopt Me là tựa game nuôi và giao dịch thú cưng nổi tiếng nhất Roblox. Tại Uniemarket, bạn có thể mua các thú cưng Legendary, Rare hiếm có khó tìm với giá tốt và giao hàng nhanh chóng.",
    accentColor: "#7BD0F0",
    rarityTiers: ["Common", "Uncommon", "Rare", "Ultra-Rare", "Legendary"],
    isFeatured: true,
    sortOrder: 1,
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "murder-mystery-2",
    name: "Murder Mystery 2",
    tagline: "Iconic MM2 knives and guns.",
    description:
      "Murder Mystery 2 (MM2) nổi tiếng với các con dao (knife) và súng Chroma, Godly cực đẹp. Uniemarket cung cấp đầy đủ các vật phẩm Godly hot nhất với độ uy tín cao.",
    accentColor: "#E5484D",
    rarityTiers: ["Common", "Uncommon", "Rare", "Godly", "Chroma", "Exclusive"],
    isFeatured: true,
    sortOrder: 2,
    createdAt: "2026-01-06T08:00:00.000Z",
  },
  {
    id: "blox-fruits",
    name: "Blox Fruits",
    tagline: "Permanent fruits, rare swords, Beli.",
    description:
      "Blox Fruits là game phiêu lưu chiến đấu lấy cảm hứng từ One Piece. Chúng tôi bán trái ác quỷ vĩnh viễn (Permanent), kiếm hiếm và Beli với mức giá cạnh tranh nhất thị trường.",
    accentColor: "#4CC2FF",
    rarityTiers: ["Common", "Uncommon", "Rare", "Legendary", "Mythical"],
    isFeatured: true,
    sortOrder: 3,
    createdAt: "2026-01-07T08:00:00.000Z",
  },
  {
    id: "grow-a-garden",
    name: "Grow a Garden",
    tagline: "Rare pollinating pets and seed bundles.",
    description:
      "Grow a Garden là game trồng trọt kết hợp thú cưng thụ phấn đang gây sốt. Sở hữu ngay các thú cưng Godly, Mythical hiếm và bundle hạt giống chỉ có tại Uniemarket.",
    accentColor: "#6FCF5B",
    rarityTiers: ["Common", "Rare", "Legendary", "Mythical", "Godly"],
    isFeatured: true,
    sortOrder: 4,
    createdAt: "2026-01-08T08:00:00.000Z",
  },
  {
    id: "pet-simulator-99",
    name: "Pet Simulator 99",
    tagline: "Huge and Titanic pets plus Diamonds.",
    description:
      "Pet Simulator 99 nổi bật với các thú cưng khổng lồ Huge và Titanic cực kỳ hiếm, cùng nguồn Diamonds dồi dào. Giao dịch an toàn, nhanh chóng tại Uniemarket.",
    accentColor: "#C77BF0",
    rarityTiers: ["Common", "Rare", "Epic", "Huge", "Titanic"],
    isFeatured: true,
    sortOrder: 5,
    createdAt: "2026-01-09T08:00:00.000Z",
  },
  {
    id: "steal-a-brainrot",
    name: "Steal a Brainrot",
    tagline: "Collect the viral brainrot characters.",
    description:
      "Steal a Brainrot cho phép bạn sưu tầm các nhân vật brainrot viral đang làm mưa làm gió trên mạng xã hội. Uniemarket có đầy đủ các nhân vật Secret cực hiếm.",
    accentColor: "#F0A93B",
    rarityTiers: ["Common", "Epic", "Legendary", "Secret"],
    isFeatured: true,
    sortOrder: 6,
    createdAt: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "anime-vanguards",
    name: "Anime Vanguards",
    tagline: "Top-tier tower units, gems, rerolls.",
    description:
      "Anime Vanguards là game tower-defense chủ đề anime với các unit Secret, Mythical mạnh mẽ. Chúng tôi bán unit hiếm, gói reroll và gems giúp bạn build đội hình mạnh nhanh chóng.",
    accentColor: "#F05B8C",
    rarityTiers: ["Common", "Rare", "Epic", "Mythical", "Secret"],
    isFeatured: false,
    sortOrder: 7,
    createdAt: "2026-01-11T08:00:00.000Z",
  },
  {
    id: "anime-defenders",
    name: "Anime Defenders",
    tagline: "Secret and mythic units, gems, rerolls.",
    description:
      "Anime Defenders là đối thủ đáng gờm trong dòng game tower-defense anime, với các unit Secret, Mythic cực mạnh. Mua unit, gems và reroll ngay tại Uniemarket.",
    accentColor: "#8C7BF0",
    rarityTiers: ["Common", "Rare", "Mythic", "Secret"],
    isFeatured: false,
    sortOrder: 8,
    createdAt: "2026-01-12T08:00:00.000Z",
  },
];

export const GAMES: Game[] = GAMES_BASE.map((game) => ({
  ...game,
  itemCount: ITEMS_BY_GAME_COUNT[game.id] ?? 0,
})).sort((a, b) => a.sortOrder - b.sortOrder);
