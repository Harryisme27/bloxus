// Panel minh họa cạnh form đăng nhập/đăng ký (kiểu preview của yummytrack):
// video loop /logo.webm — thỏ đội nón lát chanh uống nước chanh + chữ
// BLOXUS, nền biển đêm mùa hè. Video dựng từ scratchpad/logo-scene.html
// (quay bằng Playwright); poster là khung hình tĩnh cho lúc đang tải.
import { BRAND_NAME } from "@/lib/constants";

export function AuthHeroScene() {
  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-[28px] border border-border bg-[#12100a] shadow-2xl shadow-black/50">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/logo-poster.png"
        aria-label={BRAND_NAME}
        className="h-full w-full object-cover"
      >
        <source src="/logo.webm" type="video/webm" />
        {/* Trình duyệt không hỗ trợ webm -> hiện poster tĩnh. */}
        <img src="/logo-poster.png" alt={BRAND_NAME} className="h-full w-full object-cover" />
      </video>
    </div>
  );
}
