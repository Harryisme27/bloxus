import { LegalPageLayout, type LegalSection } from "@/components/content/LegalPageLayout";
import { BRAND_NAME } from "@/lib/constants";

const SECTIONS: LegalSection[] = [
  {
    id: "intro",
    heading: "Giới thiệu",
    body: [
      {
        type: "p",
        text: `${BRAND_NAME} tôn trọng quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin khi bạn sử dụng website.`,
      },
    ],
  },
  {
    id: "collect",
    heading: "Thông tin chúng tôi thu thập",
    body: [
      {
        type: "p",
        text: "Để cung cấp dịch vụ, chúng tôi có thể thu thập các thông tin sau:",
      },
      {
        type: "list",
        items: [
          "Thông tin tài khoản: tên đăng nhập, email, username Roblox.",
          "Thông tin đơn hàng: vật phẩm đã mua, lịch sử giao dịch.",
          "Dữ liệu kỹ thuật cơ bản như trình duyệt, thiết bị (nếu có).",
        ],
      },
      {
        type: "p",
        text: "Lưu ý: đây là bản demo chạy hoàn toàn trên trình duyệt của bạn (localStorage). Không có dữ liệu nào được gửi tới máy chủ.",
      },
    ],
  },
  {
    id: "use",
    heading: "Cách chúng tôi sử dụng thông tin",
    body: [
      {
        type: "list",
        items: [
          "Xử lý và giao các đơn hàng của bạn.",
          "Hỗ trợ khách hàng và giải quyết khiếu nại.",
          "Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.",
        ],
      },
    ],
  },
  {
    id: "security",
    heading: "Bảo mật dữ liệu",
    body: [
      {
        type: "p",
        text: "Chúng tôi áp dụng các biện pháp hợp lý để bảo vệ thông tin của bạn. Chúng tôi không bao giờ yêu cầu mật khẩu tài khoản Roblox và khuyến cáo bạn tuyệt đối không chia sẻ thông tin đó với bất kỳ ai.",
      },
    ],
  },
  {
    id: "sharing",
    heading: "Chia sẻ với bên thứ ba",
    body: [
      {
        type: "p",
        text: `${BRAND_NAME} không bán hay cho thuê thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ khi cần thiết để hoàn tất giao dịch hoặc khi pháp luật yêu cầu.`,
      },
    ],
  },
  {
    id: "rights",
    heading: "Quyền của bạn",
    body: [
      {
        type: "p",
        text: "Bạn có quyền yêu cầu truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình. Với bản demo, bạn có thể xóa toàn bộ dữ liệu bất cứ lúc nào bằng cách xóa dữ liệu localStorage của trình duyệt.",
      },
    ],
  },
];

export function Privacy() {
  return (
    <LegalPageLayout
      title="Chính sách bảo mật"
      lastUpdated="16/07/2026"
      intro="Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Nội dung dưới đây minh hoạ cách một cửa hàng vật phẩm Roblox xử lý dữ liệu người dùng."
      sections={SECTIONS}
    />
  );
}
