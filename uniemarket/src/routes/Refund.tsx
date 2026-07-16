import { LegalPageLayout, type LegalSection } from "@/components/content/LegalPageLayout";
import { BRAND_NAME } from "@/lib/constants";

const SECTIONS: LegalSection[] = [
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
        text: "Yêu cầu hoàn tiền hợp lệ thường được xử lý trong vòng vài phút đến vài ngày làm việc, tùy phương thức thanh toán ban đầu. Trong bản demo, mọi thao tác hoàn tiền chỉ mang tính mô phỏng.",
      },
    ],
  },
];

export function Refund() {
  return (
    <LegalPageLayout
      title="Chính sách hoàn tiền"
      lastUpdated="16/07/2026"
      intro={`Sự hài lòng của bạn là ưu tiên của ${BRAND_NAME}. Chính sách hoàn tiền dưới đây minh hoạ cách chúng tôi bảo vệ quyền lợi người mua.`}
      sections={SECTIONS}
    />
  );
}
