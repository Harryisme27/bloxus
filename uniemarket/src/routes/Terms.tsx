import { LegalPageLayout, type LegalSection } from "@/components/content/LegalPageLayout";
import { BRAND_NAME } from "@/lib/constants";

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Chấp nhận điều khoản",
    body: [
      {
        type: "p",
        text: `Bằng việc truy cập và sử dụng ${BRAND_NAME}, bạn đồng ý tuân thủ các điều khoản dịch vụ dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng website.`,
      },
    ],
  },
  {
    id: "service",
    heading: "Mô tả dịch vụ",
    body: [
      {
        type: "p",
        text: `${BRAND_NAME} là nền tảng cung cấp vật phẩm ảo trong các trò chơi Roblox. Chúng tôi không phải là sản phẩm chính thức của Roblox Corporation và không có liên kết với Roblox.`,
      },
      {
        type: "list",
        items: [
          "Vật phẩm được giao trực tiếp trong game bởi nhân viên của chúng tôi.",
          "Chúng tôi chỉ yêu cầu username Roblox, không bao giờ hỏi mật khẩu của bạn.",
          "Thời gian giao hàng có thể thay đổi tùy vào vật phẩm và tình trạng hệ thống.",
        ],
      },
    ],
  },
  {
    id: "accounts",
    heading: "Tài khoản người dùng",
    body: [
      {
        type: "p",
        text: "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Vui lòng cung cấp thông tin chính xác khi đặt hàng để tránh giao nhầm.",
      },
    ],
  },
  {
    id: "conduct",
    heading: "Quy tắc sử dụng",
    body: [
      {
        type: "p",
        text: "Khi sử dụng dịch vụ, bạn đồng ý không thực hiện các hành vi sau:",
      },
      {
        type: "list",
        items: [
          "Gian lận, chargeback trái phép hoặc lạm dụng chính sách hoàn tiền.",
          "Cung cấp thông tin sai lệch nhằm chiếm đoạt vật phẩm.",
          "Quấy rối nhân viên hỗ trợ hoặc người dùng khác.",
        ],
      },
    ],
  },
  {
    id: "liability",
    heading: "Giới hạn trách nhiệm",
    body: [
      {
        type: "p",
        text: `${BRAND_NAME} không chịu trách nhiệm cho các thiệt hại gián tiếp phát sinh từ việc sử dụng dịch vụ, bao gồm nhưng không giới hạn ở việc tài khoản game bị khóa do vi phạm điều khoản của bên thứ ba.`,
      },
    ],
  },
  {
    id: "changes",
    heading: "Thay đổi điều khoản",
    body: [
      {
        type: "p",
        text: "Chúng tôi có thể cập nhật các điều khoản này bất cứ lúc nào. Phiên bản mới sẽ có hiệu lực ngay khi được đăng tải. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận các thay đổi.",
      },
    ],
  },
];

export function Terms() {
  return (
    <LegalPageLayout
      title="Điều khoản dịch vụ"
      lastUpdated="16/07/2026"
      intro={`Vui lòng đọc kỹ các điều khoản dịch vụ này trước khi sử dụng ${BRAND_NAME}. Đây là nội dung minh hoạ cho một cửa hàng vật phẩm Roblox.`}
      sections={SECTIONS}
    />
  );
}
