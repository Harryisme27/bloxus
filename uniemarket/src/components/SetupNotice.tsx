import { Database, ExternalLink, FileText } from "lucide-react";

/**
 * Hiển thị khi app CHƯA kết nối Supabase (.env.local thiếu VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY). Storefront demo vẫn chạy; các trang cần database
 * (đăng nhập, đơn hàng thật, khu làm việc...) hiện khối hướng dẫn này.
 */
export function SetupNotice() {
  return (
    <div className="rounded-2xl border border-yellow bg-yellow-soft p-6">
      <div className="flex items-center gap-2 font-heading text-lg font-bold text-yellow">
        <Database className="h-5 w-5" aria-hidden />
        Chưa kết nối cơ sở dữ liệu
      </div>
      <p className="mt-2 text-sm text-text-muted">
        Web đang chạy ở <span className="font-semibold text-text">chế độ demo</span> (dữ liệu mẫu,
        không lưu thật). Để bật tài khoản, đơn hàng và khu làm việc, bạn cần kết nối Supabase —
        miễn phí và chỉ mất khoảng 10 phút:
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
        <li>
          Tạo project miễn phí tại{" "}
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
          Chạy file <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">supabase/01-schema.sql</code>{" "}
          trong SQL Editor
        </li>
        <li>
          Dán Project URL + anon key vào file{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">.env.local</code>
        </li>
        <li>Khởi động lại web (chạy lại start.bat)</li>
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-text">
        <FileText className="h-4 w-4 text-yellow" aria-hidden />
        Hướng dẫn từng bước chi tiết: mở file SETUP.md trong thư mục dự án.
      </p>
    </div>
  );
}
