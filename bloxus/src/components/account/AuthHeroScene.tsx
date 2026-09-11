// Panel minh họa cạnh form đăng nhập/đăng ký (kiểu preview của yummytrack):
// video loop /video.mp4 (H.264, 10 giây) — thỏ uống nước chanh + chữ BLOXUS.
// Poster /video-poster.jpg là 1 khung hình tĩnh của chính video, hiện trong lúc
// video đang tải hoặc khi trình duyệt không phát được.
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
        poster="/video-poster.jpg"
        aria-label={BRAND_NAME}
        className="h-full w-full object-cover"
      >
        <source src="/video.mp4" type="video/mp4" />
        {/* Trình duyệt không phát được video -> hiện poster tĩnh. */}
        <img src="/video-poster.jpg" alt={BRAND_NAME} className="h-full w-full object-cover" />
      </video>
    </div>
  );
}
