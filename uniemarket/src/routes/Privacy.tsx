import { LegalPageLayout, type LegalSection } from "@/components/content/LegalPageLayout";
import { BRAND_NAME } from "@/lib/constants";
import { usePick } from "@/i18n";

const STR: {
  vi: { title: string; intro: string; sections: LegalSection[] };
  en: { title: string; intro: string; sections: LegalSection[] };
} = {
  vi: {
    title: "Chính sách bảo mật",
    intro:
      "Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Nội dung dưới đây minh hoạ cách một cửa hàng vật phẩm Roblox xử lý dữ liệu người dùng.",
    sections: [
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
    ],
  },
  en: {
    title: "Privacy Policy",
    intro:
      "We are committed to protecting your personal information. The content below illustrates how a Roblox item store handles user data.",
    sections: [
      {
        id: "intro",
        heading: "Introduction",
        body: [
          {
            type: "p",
            text: `${BRAND_NAME} respects your privacy. This policy explains how we collect, use, and protect your information when you use the website.`,
          },
        ],
      },
      {
        id: "collect",
        heading: "Information we collect",
        body: [
          {
            type: "p",
            text: "To provide the service, we may collect the following information:",
          },
          {
            type: "list",
            items: [
              "Account information: username, email, Roblox username.",
              "Order information: items purchased, transaction history.",
              "Basic technical data such as browser and device (if any).",
            ],
          },
          {
            type: "p",
            text: "Note: this is a demo that runs entirely in your browser (localStorage). No data is sent to any server.",
          },
        ],
      },
      {
        id: "use",
        heading: "How we use your information",
        body: [
          {
            type: "list",
            items: [
              "Process and deliver your orders.",
              "Provide customer support and resolve complaints.",
              "Improve service quality and the user experience.",
            ],
          },
        ],
      },
      {
        id: "security",
        heading: "Data security",
        body: [
          {
            type: "p",
            text: "We apply reasonable measures to protect your information. We never ask for your Roblox account password, and we strongly advise you never to share it with anyone.",
          },
        ],
      },
      {
        id: "sharing",
        heading: "Sharing with third parties",
        body: [
          {
            type: "p",
            text: `${BRAND_NAME} does not sell or rent your personal information. Information is shared only when necessary to complete a transaction or when required by law.`,
          },
        ],
      },
      {
        id: "rights",
        heading: "Your rights",
        body: [
          {
            type: "p",
            text: "You have the right to request access to, correction of, or deletion of your personal information. In this demo, you can delete all data at any time by clearing your browser's localStorage.",
          },
        ],
      },
    ],
  },
};

export function Privacy() {
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
