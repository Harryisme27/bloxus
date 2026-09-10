import { LegalPageLayout, type LegalSection } from "@/components/content/LegalPageLayout";
import { BRAND_NAME } from "@/lib/constants";
import { usePick } from "@/i18n";

const STR: {
  vi: { title: string; intro: string; sections: LegalSection[] };
  en: { title: string; intro: string; sections: LegalSection[] };
} = {
  vi: {
    title: "Điều khoản dịch vụ",
    intro: `Vui lòng đọc kỹ các điều khoản dịch vụ này trước khi sử dụng ${BRAND_NAME}. Đây là nội dung minh hoạ cho một cửa hàng vật phẩm Roblox.`,
    sections: [
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
    ],
  },
  en: {
    title: "Terms of Service",
    intro: `Please read these terms of service carefully before using ${BRAND_NAME}. This is illustrative content for a Roblox item store.`,
    sections: [
      {
        id: "acceptance",
        heading: "Acceptance of terms",
        body: [
          {
            type: "p",
            text: `By accessing and using ${BRAND_NAME}, you agree to abide by the terms of service below. If you do not agree with any of them, please stop using the website.`,
          },
        ],
      },
      {
        id: "service",
        heading: "Service description",
        body: [
          {
            type: "p",
            text: `${BRAND_NAME} is a platform that provides virtual items for Roblox games. We are not an official product of Roblox Corporation and are not affiliated with Roblox.`,
          },
          {
            type: "list",
            items: [
              "Items are delivered directly in-game by our staff.",
              "We only ask for your Roblox username, never your password.",
              "Delivery time may vary depending on the item and system status.",
            ],
          },
        ],
      },
      {
        id: "accounts",
        heading: "User accounts",
        body: [
          {
            type: "p",
            text: "You are responsible for keeping your login credentials secure and for all activity under your account. Please provide accurate information when ordering to avoid mis-delivery.",
          },
        ],
      },
      {
        id: "conduct",
        heading: "Rules of use",
        body: [
          {
            type: "p",
            text: "When using the service, you agree not to do any of the following:",
          },
          {
            type: "list",
            items: [
              "Fraud, unauthorized chargebacks, or abuse of the refund policy.",
              "Providing false information to obtain items dishonestly.",
              "Harassing support staff or other users.",
            ],
          },
        ],
      },
      {
        id: "liability",
        heading: "Limitation of liability",
        body: [
          {
            type: "p",
            text: `${BRAND_NAME} is not liable for indirect damages arising from use of the service, including but not limited to a game account being banned for violating a third party's terms.`,
          },
        ],
      },
      {
        id: "changes",
        heading: "Changes to the terms",
        body: [
          {
            type: "p",
            text: "We may update these terms at any time. A new version takes effect as soon as it is posted. Your continued use of the service means you accept the changes.",
          },
        ],
      },
    ],
  },
};

export function Terms() {
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
