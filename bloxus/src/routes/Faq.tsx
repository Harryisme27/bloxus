import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, HelpCircle, MessageCircle, X, ArrowRight } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { DISCORD_URL } from "@/lib/constants";
import { usePick } from "@/i18n";

type CategoryId = "order" | "delivery" | "payment" | "refund" | "safety" | "suggest";

interface FaqItem {
  id: string;
  category: CategoryId;
  question: string;
  answer: string;
}

interface FaqStrings {
  badge: string;
  heading: string;
  subtitle: string;
  searchPlaceholder: string;
  searchAria: string;
  clearSearch: string;
  foundResults: (n: number, q: string) => string;
  noResults: (q: string) => string;
  noMatch: string;
  contactSupport: string;
  ctaTitle: string;
  ctaBody: string;
  askDiscord: string;
  categories: { id: CategoryId; label: string }[];
  categoryLabel: Record<CategoryId, string>;
  faqs: FaqItem[];
}

/** Render câu trả lời: URL trong text thành link bấm được (mở tab mới). */
function renderAnswer(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-yellow underline underline-offset-2 hover:text-yellow-hover"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

const STR: { vi: FaqStrings; en: FaqStrings } = {
  vi: {
    badge: "Trung tâm trợ giúp",
    heading: "Câu hỏi thường gặp",
    subtitle:
      "Tìm nhanh câu trả lời cho những thắc mắc phổ biến khi mua vật phẩm tại Bloxus.",
    searchPlaceholder: "Tìm câu hỏi, ví dụ: giao hàng, hoàn tiền, an toàn...",
    searchAria: "Tìm câu hỏi",
    clearSearch: "Xóa tìm kiếm",
    foundResults: (n, q) => `Tìm thấy ${n} kết quả cho "${q}"`,
    noResults: (q) => `Không có kết quả cho "${q}"`,
    noMatch:
      "Không tìm thấy câu hỏi phù hợp. Thử từ khóa khác hoặc liên hệ trực tiếp với chúng tôi.",
    contactSupport: "Liên hệ hỗ trợ",
    ctaTitle: "Vẫn chưa tìm được câu trả lời?",
    ctaBody:
      "Đội ngũ Bloxus luôn sẵn sàng hỗ trợ bạn. Nhắn cho chúng tôi và nhận phản hồi trong ít phút.",
    askDiscord: "Hỏi trên Discord",
    categories: [
      { id: "order", label: "Đặt hàng" },
      { id: "delivery", label: "Giao hàng" },
      { id: "payment", label: "Thanh toán" },
      { id: "refund", label: "Hoàn tiền" },
      { id: "safety", label: "An toàn" },
      { id: "suggest", label: "Góp ý" },
    ],
    categoryLabel: {
      order: "Đặt hàng",
      delivery: "Giao hàng",
      payment: "Thanh toán",
      refund: "Hoàn tiền",
      safety: "An toàn",
      suggest: "Góp ý",
    },
    faqs: [
      {
        id: "order-1",
        category: "order",
        question: "Làm thế nào để đặt mua một vật phẩm?",
        answer:
          "Rất đơn giản: chọn game bạn chơi, chọn vật phẩm muốn mua, thêm vào giỏ hàng rồi tiến hành thanh toán. Ở bước cuối bạn chỉ cần nhập username Roblox để nhân viên biết cần giao cho ai.",
      },
      {
        id: "order-2",
        category: "order",
        question: "Tôi có cần tạo tài khoản để mua hàng không?",
        answer:
          "Bạn nên đăng ký tài khoản để dễ dàng theo dõi lịch sử đơn hàng và trạng thái giao hàng. Bạn cũng có thể mua nhanh với tư cách khách (guest) mà không cần tài khoản.",
      },
      {
        id: "order-3",
        category: "order",
        question: "Tôi có thể mua nhiều vật phẩm trong cùng một đơn không?",
        answer:
          "Có. Bạn cứ thêm tất cả vật phẩm mong muốn vào giỏ hàng, có thể thuộc nhiều game khác nhau, rồi thanh toán một lần. Nhân viên sẽ giao lần lượt từng vật phẩm cho bạn.",
      },
      {
        id: "order-4",
        category: "order",
        question: "Tôi lỡ nhập sai username Roblox thì phải làm sao?",
        answer:
          "Hãy liên hệ ngay với đội ngũ hỗ trợ qua chat hoặc Discord trước khi đơn được giao. Chúng tôi sẽ cập nhật lại đúng username cho bạn để tránh giao nhầm người.",
      },
      {
        id: "delivery-1",
        category: "delivery",
        question: "Bao lâu sau khi thanh toán thì tôi nhận được vật phẩm?",
        answer:
          "Đa số đơn được giao trong vòng 5–15 phút. Vào giờ cao điểm hoặc với các vật phẩm đặc biệt, thời gian có thể lâu hơn một chút, nhưng nhân viên luôn cập nhật tiến độ cho bạn.",
      },
      {
        id: "delivery-2",
        category: "delivery",
        question: "Vật phẩm được giao đến tôi bằng cách nào?",
        answer:
          "Nhân viên của Bloxus sẽ vào chính game đó, kết bạn hoặc vào chung server và trao vật phẩm trực tiếp cho nhân vật Roblox của bạn qua tính năng giao dịch (trade) trong game.",
      },
      {
        id: "delivery-3",
        category: "delivery",
        question: "Tôi cần chuẩn bị gì để nhận hàng nhanh nhất?",
        answer:
          "Hãy đảm bảo tài khoản Roblox của bạn đang online, đã bật cho phép giao dịch/kết bạn, và có đủ chỗ trống trong kho (inventory). Điều này giúp quá trình giao diễn ra suôn sẻ.",
      },
      {
        id: "delivery-4",
        category: "delivery",
        question: "Nếu tôi offline lúc nhân viên giao hàng thì sao?",
        answer:
          "Đừng lo, đơn của bạn không bị mất. Nhân viên sẽ giữ đơn và hẹn giao lại khi bạn online. Bạn có thể chủ động nhắn trong phần Tin nhắn để hẹn khung giờ thuận tiện.",
      },
      {
        id: "payment-1",
        category: "payment",
        question: "Bloxus chấp nhận những hình thức thanh toán nào?",
        answer:
          "Thanh toán hiện dùng thẻ an toàn qua Stripe.",
      },
      {
        id: "payment-2",
        category: "payment",
        question: "Giá hiển thị đã bao gồm mọi chi phí chưa?",
        answer:
          "Rồi. Giá niêm yết trên mỗi vật phẩm là giá cuối cùng, đã bao gồm phí giao dịch. Chúng tôi không thu thêm bất kỳ khoản phí ẩn nào ở bước thanh toán.",
      },
      {
        id: "payment-3",
        category: "payment",
        question: "Tôi có xem lại được các đơn đã đặt không?",
        answer:
          "Có. Sau khi hoàn tất, đơn hàng sẽ xuất hiện trong mục Lịch sử đơn hàng của tài khoản, kèm mã đơn, danh sách vật phẩm và trạng thái giao hàng.",
      },
      {
        id: "refund-1",
        category: "refund",
        question: "Khi nào tôi được hoàn tiền?",
        answer:
          "Nếu vì lý do từ phía chúng tôi mà đơn không thể giao (hết hàng, sự cố kỹ thuật...), bạn sẽ được hoàn 100%. Xem chi tiết tại trang Chính sách hoàn tiền.",
      },
      {
        id: "refund-2",
        category: "refund",
        question: "Vật phẩm đã giao đúng mô tả có được hoàn không?",
        answer:
          "Vì vật phẩm số được giao trực tiếp vào tài khoản game và không thể thu hồi, các đơn đã giao thành công đúng mô tả sẽ không áp dụng hoàn tiền. Hãy kiểm tra kỹ trước khi đặt.",
      },
      {
        id: "refund-3",
        category: "refund",
        question: "Quá trình hoàn tiền mất bao lâu?",
        answer:
          "Bạn có thể được hoàn tiền trong vòng 24 giờ nếu đơn hàng chưa được giao xong.",
      },
      {
        id: "safety-1",
        category: "safety",
        question: "Mua vật phẩm ở Bloxus có an toàn không?",
        answer:
          "Có. Chúng tôi công khai minh chứng mọi giao dịch tại trang /proofs, kèm ảnh giao hàng và tên nhân viên xử lý. Sự minh bạch này là cam kết uy tín của chúng tôi với bạn.",
      },
      {
        id: "safety-2",
        category: "safety",
        question: "Bloxus có yêu cầu mật khẩu Roblox của tôi không?",
        answer:
          "Tuyệt đối KHÔNG. Chúng tôi chỉ cần username của bạn để giao trong game. Đừng bao giờ chia sẻ mật khẩu Roblox với bất kỳ ai — kể cả người tự xưng là nhân viên hỗ trợ.",
      },
      {
        id: "safety-3",
        category: "safety",
        question: "Giao dịch có ảnh hưởng đến tài khoản Roblox của tôi không?",
        answer:
          "Nhân viên giao vật phẩm thông qua cơ chế giao dịch hợp lệ ngay trong game, giống như khi bạn trao đổi với bạn bè. Chúng tôi luôn tuân thủ cách làm an toàn để bảo vệ tài khoản của bạn.",
      },
      {
        id: "suggest-1",
        category: "suggest",
        question: "Tôi muốn góp ý hoặc đề xuất game mới thì làm thế nào?",
        answer:
          "Nếu bạn muốn góp ý hoặc có game mới muốn chúng tôi bán, hãy tham gia Discord BLOXUS tại https://discord.com/invite/bloxus và nhắn cho chúng tôi — mọi đề xuất đều được đội ngũ đọc và phản hồi.",
      },
    ],
  },
  en: {
    badge: "Help center",
    heading: "Frequently asked questions",
    subtitle:
      "Quickly find answers to the most common questions about buying items at Bloxus.",
    searchPlaceholder: "Search questions, e.g. delivery, refunds, safety...",
    searchAria: "Search questions",
    clearSearch: "Clear search",
    foundResults: (n, q) => `Found ${n} result${n === 1 ? "" : "s"} for "${q}"`,
    noResults: (q) => `No results for "${q}"`,
    noMatch:
      "No matching questions found. Try different keywords or contact us directly.",
    contactSupport: "Contact support",
    ctaTitle: "Still haven't found your answer?",
    ctaBody:
      "The Bloxus team is always ready to help. Message us and get a reply within minutes.",
    askDiscord: "Ask on Discord",
    categories: [
      { id: "order", label: "Ordering" },
      { id: "delivery", label: "Delivery" },
      { id: "payment", label: "Payment" },
      { id: "refund", label: "Refunds" },
      { id: "safety", label: "Safety" },
      { id: "suggest", label: "Suggest" },
    ],
    categoryLabel: {
      order: "Ordering",
      delivery: "Delivery",
      payment: "Payment",
      refund: "Refunds",
      safety: "Safety",
      suggest: "Suggest",
    },
    faqs: [
      {
        id: "order-1",
        category: "order",
        question: "How do I order an item?",
        answer:
          "It's simple: pick the game you play, choose the item you want, add it to your cart, then proceed to checkout. At the last step you just enter your Roblox username so our staff know who to deliver to.",
      },
      {
        id: "order-2",
        category: "order",
        question: "Do I need an account to buy?",
        answer:
          "We recommend signing up so you can easily track your order history and delivery status. You can also check out quickly as a guest without an account.",
      },
      {
        id: "order-3",
        category: "order",
        question: "Can I buy several items in one order?",
        answer:
          "Yes. Just add all the items you want to your cart — they can be from different games — and pay once. Our staff will deliver each item to you one by one.",
      },
      {
        id: "order-4",
        category: "order",
        question: "What if I entered the wrong Roblox username?",
        answer:
          "Contact the support team right away via chat or Discord before the order is delivered. We'll update it to the correct username so it isn't delivered to the wrong person.",
      },
      {
        id: "delivery-1",
        category: "delivery",
        question: "How long after payment will I receive my item?",
        answer:
          "Most orders are delivered within 5–15 minutes. During peak hours or for special items it may take a little longer, but our staff always keep you posted on the progress.",
      },
      {
        id: "delivery-2",
        category: "delivery",
        question: "How is the item delivered to me?",
        answer:
          "A Bloxus staff member joins that same game, friends you or hops into the same server, and hands the item directly to your Roblox character through the in-game trade feature.",
      },
      {
        id: "delivery-3",
        category: "delivery",
        question: "What should I do to receive my item as fast as possible?",
        answer:
          "Make sure your Roblox account is online, has trading and friend requests enabled, and has enough free space in your inventory. This keeps the delivery running smoothly.",
      },
      {
        id: "delivery-4",
        category: "delivery",
        question: "What happens if I'm offline when staff try to deliver?",
        answer:
          "Don't worry, your order isn't lost. Staff will hold it and arrange to deliver again once you're online. You can message us in the Messages section to set a convenient time.",
      },
      {
        id: "payment-1",
        category: "payment",
        question: "What payment methods does Bloxus accept?",
        answer:
          "Checkout currently uses secure card payment through Stripe.",
      },
      {
        id: "payment-2",
        category: "payment",
        question: "Does the displayed price include all costs?",
        answer:
          "Yes. The price listed on each item is the final price, transaction fees included. We don't add any hidden fees at checkout.",
      },
      {
        id: "payment-3",
        category: "payment",
        question: "Can I review the orders I've placed?",
        answer:
          "Yes. Once completed, your order appears in the Order history section of your account, along with the order code, item list, and delivery status.",
      },
      {
        id: "refund-1",
        category: "refund",
        question: "When am I eligible for a refund?",
        answer:
          "If an order can't be delivered for reasons on our side (out of stock, a technical issue, etc.), you get a 100% refund. See the Refund Policy page for details.",
      },
      {
        id: "refund-2",
        category: "refund",
        question: "Can I get a refund for an item delivered as described?",
        answer:
          "Because digital items are delivered directly to your game account and can't be reclaimed, orders delivered successfully and as described aren't eligible for a refund. Please double-check before ordering.",
      },
      {
        id: "refund-3",
        category: "refund",
        question: "How long does a refund take?",
        answer:
          "Refunds are available within 24 hours if the delivery has not been completed.",
      },
      {
        id: "safety-1",
        category: "safety",
        question: "Is it safe to buy items from Bloxus?",
        answer:
          "Yes. We publish proof of every transaction on the /proofs page, complete with delivery photos and the name of the staff member who handled it. That transparency is our promise of trust to you.",
      },
      {
        id: "safety-2",
        category: "safety",
        question: "Does Bloxus ask for my Roblox password?",
        answer:
          "Absolutely NOT. We only need your username to deliver in-game. Never share your Roblox password with anyone — not even someone claiming to be support staff.",
      },
      {
        id: "safety-3",
        category: "safety",
        question: "Will the trade affect my Roblox account?",
        answer:
          "Staff deliver items through the game's legitimate trade mechanism, just like trading with a friend. We always follow safe practices to protect your account.",
      },
      {
        id: "suggest-1",
        category: "suggest",
        question: "How do I share feedback or request a new game?",
        answer:
          "If you'd like to give feedback or there's a new game you want us to sell, join the BLOXUS Discord at https://discord.com/invite/bloxus and message us — the team reads and responds to every suggestion.",
      },
    ],
  },
};

export function Faq() {
  const t = usePick(STR);
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return t.faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(trimmed) || f.answer.toLowerCase().includes(trimmed),
    );
  }, [isSearching, trimmed, t.faqs]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="border-b border-border bg-bg-subtle">
        <PageContainer className="py-14 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {t.badge}
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mx-auto mt-4 text-text-muted">
              {t.subtitle}
            </p>

            {/* Search */}
            <div className="relative mx-auto mt-8 max-w-xl">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-subtle"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-12 pl-11 pr-10"
                aria-label={t.searchAria}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-subtle hover:text-text"
                  aria-label={t.clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="pt-12">
        <div className="mx-auto max-w-3xl">
          {isSearching ? (
            /* Search results across all categories */
            <div>
              <p className="mb-4 text-sm text-text-muted">
                {searchResults.length > 0
                  ? t.foundResults(searchResults.length, query)
                  : t.noResults(query)}
              </p>
              {searchResults.length > 0 ? (
                <Accordion className="rounded-2xl border border-border bg-surface px-5">
                  {searchResults.map((f) => (
                    <AccordionItem key={f.id} value={f.id}>
                      <AccordionTrigger>
                        <span className="flex flex-col items-start gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-yellow">
                            {t.categoryLabel[f.category]}
                          </span>
                          {f.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="leading-relaxed">
                        {renderAnswer(f.answer)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
                  <HelpCircle className="mx-auto h-8 w-8 text-text-subtle" aria-hidden="true" />
                  <p className="mt-3 text-text-muted">
                    {t.noMatch}
                  </p>
                  <Link to="/contact" className="mt-4 inline-block">
                    <Button variant="secondary" size="sm">
                      {t.contactSupport}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Category tabs */
            <Tabs defaultValue="order">
              <TabsList className="flex w-full flex-wrap justify-center gap-1">
                {t.categories.map((c) => (
                  <TabsTrigger key={c.id} value={c.id}>
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {t.categories.map((c) => {
                const items = t.faqs.filter((f) => f.category === c.id);
                return (
                  <TabsContent key={c.id} value={c.id} className="mt-6">
                    <Accordion
                      defaultValue={items[0]?.id}
                      className="rounded-2xl border border-border bg-surface px-5"
                    >
                      {items.map((f) => (
                        <AccordionItem key={f.id} value={f.id}>
                          <AccordionTrigger>{f.question}</AccordionTrigger>
                          <AccordionContent className="leading-relaxed">
                            {renderAnswer(f.answer)}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}

          {/* Contact CTA */}
          <div className="mt-14 rounded-2xl border border-border bg-gradient-to-br from-yellow-soft to-surface p-8 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-yellow" aria-hidden="true" />
            <h2 className="mt-3 font-heading text-xl font-bold text-text">
              {t.ctaTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
              {t.ctaBody}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link to="/contact">
                <Button variant="primary">
                  {t.contactSupport}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  <MessageCircle className="h-4 w-4" />
                  {t.askDiscord}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
