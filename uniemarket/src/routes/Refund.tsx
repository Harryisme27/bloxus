import { LegalPageLayout, type LegalSection } from "@/components/content/LegalPageLayout";
import { BRAND_NAME } from "@/lib/constants";
import { usePick } from "@/i18n";

const STR: {
  vi: { title: string; intro: string; sections: LegalSection[] };
  en: { title: string; intro: string; sections: LegalSection[] };
} = {
  vi: {
    title: "Chính sách hoàn tiền",
    intro: `Sự hài lòng của bạn là ưu tiên của ${BRAND_NAME}. Chính sách hoàn tiền dưới đây minh hoạ cách chúng tôi bảo vệ quyền lợi người mua.`,
    sections: [
      {
        id: "overview",
        heading: "Tổng quan",
        body: [
          {
            type: "p",
            text: `${BRAND_NAME} cam kết mọi đơn hàng đều được giao đúng và đủ. Chính sách này quy định các trường hợp bạn được hoàn tiền và cách thức xử lý.`,
          },
        ],
      },
      {
        id: "eligible",
        heading: "Trường hợp được hoàn tiền",
        body: [
          {
            type: "p",
            text: "Bạn đủ điều kiện hoàn tiền 100% trong các trường hợp lỗi từ phía chúng tôi:",
          },
          {
            type: "list",
            items: [
              "Vật phẩm hết hàng và chúng tôi không thể giao trong thời gian hợp lý.",
              "Giao sai vật phẩm hoặc sai số lượng so với đơn hàng.",
              "Sự cố kỹ thuật khiến đơn không thể hoàn tất.",
            ],
          },
        ],
      },
      {
        id: "ineligible",
        heading: "Trường hợp không hoàn tiền",
        body: [
          {
            type: "p",
            text: "Do vật phẩm số được giao trực tiếp vào tài khoản và không thể thu hồi, chúng tôi không hoàn tiền trong các trường hợp:",
          },
          {
            type: "list",
            items: [
              "Đơn đã giao thành công, đúng mô tả và đúng số lượng.",
              "Bạn cung cấp sai username Roblox dẫn đến giao nhầm (sau khi đã xác nhận).",
              "Tài khoản của bạn gặp vấn đề do vi phạm điều khoản của bên thứ ba.",
            ],
          },
        ],
      },
      {
        id: "process",
        heading: "Quy trình yêu cầu hoàn tiền",
        body: [
          {
            type: "list",
            items: [
              "Liên hệ đội ngũ hỗ trợ qua chat, email hoặc Discord kèm mã đơn hàng.",
              "Cung cấp thông tin và (nếu có) ảnh chụp minh hoạ vấn đề.",
              "Chúng tôi xem xét và phản hồi trong thời gian sớm nhất.",
            ],
          },
        ],
      },
      {
        id: "timeline",
        heading: "Thời gian xử lý",
        body: [
          {
            type: "p",
            text: "Yêu cầu hoàn tiền hợp lệ thường được xử lý trong vòng vài phút đến vài ngày làm việc, tùy phương thức thanh toán ban đầu.",
          },
        ],
      },
    ],
  },
  en: {
    title: "Refund Policy",
    intro: `Your satisfaction is ${BRAND_NAME}'s priority. The refund policy below illustrates how we protect buyers' interests.`,
    sections: [
      {
        id: "overview",
        heading: "Overview",
        body: [
          {
            type: "p",
            text: `${BRAND_NAME} is committed to delivering every order correctly and in full. This policy sets out when you are entitled to a refund and how it is handled.`,
          },
        ],
      },
      {
        id: "eligible",
        heading: "When you're eligible for a refund",
        body: [
          {
            type: "p",
            text: "You're eligible for a 100% refund whenever the fault is on our side:",
          },
          {
            type: "list",
            items: [
              "The item is out of stock and we can't deliver within a reasonable time.",
              "The wrong item or wrong quantity was delivered compared to your order.",
              "A technical issue prevents the order from being completed.",
            ],
          },
        ],
      },
      {
        id: "ineligible",
        heading: "When refunds don't apply",
        body: [
          {
            type: "p",
            text: "Because digital items are delivered directly to your account and cannot be reclaimed, we don't offer refunds in these cases:",
          },
          {
            type: "list",
            items: [
              "The order was delivered successfully, as described and in the right quantity.",
              "You provided the wrong Roblox username, causing mis-delivery (after you confirmed it).",
              "Your account runs into problems due to violating a third party's terms.",
            ],
          },
        ],
      },
      {
        id: "process",
        heading: "How to request a refund",
        body: [
          {
            type: "list",
            items: [
              "Contact the support team via chat, email, or Discord with your order code.",
              "Provide details and (if available) screenshots illustrating the issue.",
              "We'll review and respond as soon as possible.",
            ],
          },
        ],
      },
      {
        id: "timeline",
        heading: "Processing time",
        body: [
          {
            type: "p",
            text: "A valid refund request is usually processed within a few minutes to a few business days, depending on the original payment method.",
          },
        ],
      },
    ],
  },
};

export function Refund() {
  const t = usePick(STR);
  return (
    <LegalPageLayout
      title={t.title}
      lastUpdated="16/07/2026"
      intro={t.intro}
      sections={t.sections}
    />
  );
}
