// Shared, keyword-based scripted reply logic for the demo support chat.
// Used by BOTH the full-page /messages thread and the floating ChatWidget so
// the two stay in sync. This is a DEMO: there is no real backend or AI here —
// we just match a few Vietnamese/English keywords and return a canned reply.

export interface QuickReply {
  /** Text shown on the chip AND sent as the user's message when tapped. */
  label: string;
}

/** Suggested quick-reply chips shown above the chat input. */
export const QUICK_REPLIES: QuickReply[] = [
  { label: "Giá vật phẩm thế nào?" },
  { label: "Bao lâu thì nhận được hàng?" },
  { label: "Mua ở đây có an toàn không?" },
  { label: "Chính sách hoàn tiền ra sao?" },
  { label: "Có nhận thanh toán gì?" },
];

interface ReplyRule {
  /** Lowercased keywords — if the message contains ANY of these, this reply wins. */
  keywords: string[];
  reply: string;
}

// Order matters: the first rule whose keyword appears in the message wins.
const RULES: ReplyRule[] = [
  {
    keywords: ["giá", "price", "bao nhiêu", "cost", "tiền", "đắt", "rẻ"],
    reply:
      "Giá mỗi vật phẩm được niêm yết công khai ngay trên trang sản phẩm (theo USD) và đã bao gồm phí giao dịch. Nhiều vật phẩm đang có giá giảm — bạn cứ so sánh thoải mái, Uniemarket cam kết giá tốt và minh bạch. (Đây là bản demo, không thanh toán thật.)",
  },
  {
    keywords: ["giao", "delivery", "nhận hàng", "bao lâu", "ship", "nhanh", "khi nào"],
    reply:
      "Đa số đơn được giao trong khoảng 5–15 phút sau khi thanh toán, tuỳ vật phẩm và giờ cao điểm. Nhân viên sẽ vào game trao trực tiếp cho nhân vật Roblox của bạn và gửi ảnh minh chứng. Nhớ để trạng thái tài khoản là online và cho phép giao dịch nhé!",
  },
  {
    keywords: ["an toàn", "safe", "uy tín", "lừa", "scam", "tin được", "thật không", "legit"],
    reply:
      "Uniemarket giao dịch minh bạch: mỗi đơn hoàn tất đều có bản ghi minh chứng ở trang /proofs, kèm ảnh giao hàng và tên nhân viên xử lý. Chúng tôi không bao giờ hỏi mật khẩu Roblox của bạn. Tài khoản của bạn luôn an toàn.",
  },
  {
    keywords: ["hoàn tiền", "refund", "trả lại", "hoàn lại", "đổi trả", "money back"],
    reply:
      "Nếu vì lý do từ phía chúng tôi mà đơn không giao được, bạn sẽ được hoàn tiền 100%. Xem chi tiết ở trang Chính sách hoàn tiền (/refund). Với đơn đã giao thành công đúng mô tả thì không áp dụng hoàn tiền.",
  },
  {
    keywords: ["thanh toán", "payment", "pay", "trả bằng", "phương thức", "momo", "thẻ", "card", "paypal"],
    reply:
      "Đây là bản DEMO nên KHÔNG có thanh toán thật — mọi bước thanh toán chỉ là mô phỏng. Trong phiên bản thật, chúng tôi sẽ hỗ trợ nhiều phương thức phổ biến. Bạn có thể thử toàn bộ luồng mua hàng mà không mất đồng nào.",
  },
  {
    keywords: ["roblox", "username", "tên nhân vật", "id game", "vào game"],
    reply:
      "Khi thanh toán, bạn chỉ cần cung cấp username Roblox để nhân viên vào game trao vật phẩm. Chúng tôi KHÔNG cần mật khẩu tài khoản của bạn — tuyệt đối không chia sẻ mật khẩu với bất kỳ ai.",
  },
  {
    keywords: ["cảm ơn", "thanks", "thank", "ok", "oke", "tuyệt"],
    reply:
      "Rất vui được hỗ trợ bạn! Nếu cần thêm gì, cứ nhắn cho Uniemarket bất cứ lúc nào nhé. Chúc bạn săn được vật phẩm ưng ý!",
  },
  {
    keywords: ["chào", "hello", "hi", "alo", "xin chào", "hey"],
    reply:
      "Xin chào! Mình là trợ lý demo của Uniemarket. Bạn cần hỗ trợ về giá, thời gian giao hàng, độ an toàn hay hoàn tiền? Cứ hỏi thoải mái nhé!",
  },
];

const FALLBACK =
  "Cảm ơn bạn đã nhắn tin cho Uniemarket! Đây là trợ lý demo với câu trả lời soạn sẵn. Bạn có thể hỏi về giá, thời gian giao hàng, độ an toàn hoặc chính sách hoàn tiền — hoặc để lại tin nhắn, đội ngũ thật sẽ phản hồi trong ít phút.";

/** Return a canned Vietnamese reply for a user message, matched by keyword. */
export function getScriptedReply(message: string): string {
  const text = message.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.reply;
    }
  }
  return FALLBACK;
}
