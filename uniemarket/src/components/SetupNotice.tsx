import { Database, ExternalLink, FileText } from "lucide-react";
import { usePick } from "@/i18n";

const STR = {
  vi: {
    title: "Chưa kết nối cơ sở dữ liệu",
    introPre: "Web đang chạy ở",
    demoMode: "chế độ ngoại tuyến",
    introPost:
      "(dữ liệu mẫu, không lưu thật). Để bật tài khoản, đơn hàng và khu làm việc, bạn cần kết nối Supabase — miễn phí và chỉ mất khoảng 10 phút:",
    step1: "Tạo project miễn phí tại",
    step2Pre: "Chạy file",
    step2Post: "trong SQL Editor",
    step3Pre: "Dán Project URL + anon key vào file",
    step3Post: "",
    step4: "Khởi động lại web (chạy lại start.bat)",
    guide: "Hướng dẫn từng bước chi tiết: mở file SETUP.md trong thư mục dự án.",
  },
  en: {
    title: "Database not connected",
    introPre: "The site is running in",
    demoMode: "offline mode",
    introPost:
      "(sample data, nothing is really saved). To enable accounts, real orders, and the work area, you need to connect Supabase — it's free and takes about 10 minutes:",
    step1: "Create a free project at",
    step2Pre: "Run the file",
    step2Post: "in the SQL Editor",
    step3Pre: "Paste your Project URL + anon key into the",
    step3Post: "file",
    step4: "Restart the site (run start.bat again)",
    guide: "Step-by-step guide: open the SETUP.md file in the project folder.",
  },
};

/**
 * Hiển thị khi app CHƯA kết nối Supabase (.env.local thiếu VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY). Storefront demo vẫn chạy; các trang cần database
 * (đăng nhập, đơn hàng thật, khu làm việc...) hiện khối hướng dẫn này.
 */
export function SetupNotice() {
  const t = usePick(STR);
  return (
    <div className="rounded-2xl border border-yellow bg-yellow-soft p-6">
      <div className="flex items-center gap-2 font-heading text-lg font-bold text-yellow">
        <Database className="h-5 w-5" aria-hidden />
        {t.title}
      </div>
      <p className="mt-2 text-sm text-text-muted">
        {t.introPre} <span className="font-semibold text-text">{t.demoMode}</span> {t.introPost}
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
        <li>
          {t.step1}{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-yellow hover:text-yellow-hover"
          >
            supabase.com
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </li>
        <li>
          {t.step2Pre} <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">supabase/01-schema.sql</code>{" "}
          {t.step2Post}
        </li>
        <li>
          {t.step3Pre}{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">.env.local</code>
          {t.step3Post ? ` ${t.step3Post}` : ""}
        </li>
        <li>{t.step4}</li>
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-text">
        <FileText className="h-4 w-4 text-yellow" aria-hidden />
        {t.guide}
      </p>
    </div>
  );
}
