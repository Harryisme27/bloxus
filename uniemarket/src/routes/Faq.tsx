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

interface FaqItem {
  id: string;
  category: CategoryId;
  question: string;
  answer: string;
}

type CategoryId = "order" | "delivery" | "payment" | "refund" | "safety";

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "order", label: "Đặt hàng" },
  { id: "delivery", label: "Giao hàng" },
  { id: "payment", label: "Thanh toán" },
  { id: "refund", label: "Hoàn tiền" },
  { id: "safety", label: "An toàn" },
];

const CATEGORY_LABEL: Record<CategoryId, string> = {
  order: "Đặt hàng",
  delivery: "Giao hàng",
  payment: "Thanh toán",
  refund: "Hoàn tiền",
  safety: "An toàn",
};

const FAQS: FaqItem[] = [
  // Đặt hàng
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
      "Bạn nên đăng ký tài khoản để dễ dàng theo dõi lịch sử đơn hàng và trạng thái giao hàng. Trong bản demo này, bạn cũng có thể dùng tài khoản demo có sẵn để trải nghiệm toàn bộ luồng mua sắm.",
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
  // Giao hàng
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
      "Nhân viên của Uniemarket sẽ vào chính game đó, kết bạn hoặc vào chung server và trao vật phẩm trực tiếp cho nhân vật Roblox của bạn qua tính năng giao dịch (trade) trong game.",
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
  // Thanh toán
  {
    id: "payment-1",
    category: "payment",
    question: "Uniemarket chấp nhận những hình thức thanh toán nào?",
    answer:
      "Đây là website DEMO nên KHÔNG có thanh toán thật — mọi bước thanh toán chỉ được mô phỏng để bạn trải nghiệm. Trong phiên bản thật, chúng tôi sẽ hỗ trợ nhiều phương thức phổ biến.",
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
  // Hoàn tiền
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
      "Trong bản demo, việc hoàn tiền chỉ mang tính mô phỏng. Ở phiên bản thật, thời gian hoàn thường từ vài phút đến vài ngày làm việc tùy phương thức thanh toán ban đầu.",
  },
  // An toàn
  {
    id: "safety-1",
    category: "safety",
    question: "Mua vật phẩm ở Uniemarket có an toàn không?",
    answer:
      "Có. Chúng tôi công khai minh chứng mọi giao dịch tại trang /proofs, kèm ảnh giao hàng và tên nhân viên xử lý. Sự minh bạch này là cam kết uy tín của chúng tôi với bạn.",
  },
  {
    id: "safety-2",
    category: "safety",
    question: "Uniemarket có yêu cầu mật khẩu Roblox của tôi không?",
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
];

export function Faq() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(trimmed) || f.answer.toLowerCase().includes(trimmed),
    );
  }, [isSearching, trimmed]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="border-b border-border bg-bg-subtle">
        <PageContainer className="py-14 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-soft px-3 py-1 text-xs font-semibold text-yellow">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Trung tâm trợ giúp
            </span>
            <h1 className="mt-4 font-heading text-4xl font-bold text-text sm:text-5xl">
              Câu hỏi thường gặp
            </h1>
            <p className="mx-auto mt-4 text-text-muted">
              Tìm nhanh câu trả lời cho những thắc mắc phổ biến khi mua vật phẩm tại Uniemarket.
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
                placeholder="Tìm câu hỏi, ví dụ: giao hàng, hoàn tiền, an toàn..."
                className="h-12 pl-11 pr-10"
                aria-label="Tìm câu hỏi"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-subtle hover:text-text"
                  aria-label="Xóa tìm kiếm"
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
                  ? `Tìm thấy ${searchResults.length} kết quả cho "${query}"`
                  : `Không có kết quả cho "${query}"`}
              </p>
              {searchResults.length > 0 ? (
                <Accordion className="rounded-2xl border border-border bg-surface px-5">
                  {searchResults.map((f) => (
                    <AccordionItem key={f.id} value={f.id}>
                      <AccordionTrigger>
                        <span className="flex flex-col items-start gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-yellow">
                            {CATEGORY_LABEL[f.category]}
                          </span>
                          {f.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="leading-relaxed">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-12 text-center">
                  <HelpCircle className="mx-auto h-8 w-8 text-text-subtle" aria-hidden="true" />
                  <p className="mt-3 text-text-muted">
                    Không tìm thấy câu hỏi phù hợp. Thử từ khóa khác hoặc liên hệ trực tiếp với chúng
                    tôi.
                  </p>
                  <Link to="/contact" className="mt-4 inline-block">
                    <Button variant="secondary" size="sm">
                      Liên hệ hỗ trợ
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Category tabs */
            <Tabs defaultValue="order">
              <TabsList className="flex w-full flex-wrap justify-center gap-1">
                {CATEGORIES.map((c) => (
                  <TabsTrigger key={c.id} value={c.id}>
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORIES.map((c) => {
                const items = FAQS.filter((f) => f.category === c.id);
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
                            {f.answer}
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
              Vẫn chưa tìm được câu trả lời?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
              Đội ngũ Uniemarket luôn sẵn sàng hỗ trợ bạn. Nhắn cho chúng tôi và nhận phản hồi trong
              ít phút.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link to="/contact">
                <Button variant="primary">
                  Liên hệ hỗ trợ
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  <MessageCircle className="h-4 w-4" />
                  Hỏi trên Discord
                </Button>
              </a>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
