// Supabase client singleton.
//
// Đọc cấu hình từ .env.local (xem .env.example + SETUP.md). Khi CHƯA cấu hình,
// app KHÔNG crash: storefront demo (seed data) vẫn chạy bình thường, còn các
// trang cần database sẽ hiện hướng dẫn kết nối (SetupNotice).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true khi .env.local đã có VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY. */
export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

/** Client Supabase dùng chung — `null` khi chưa cấu hình env. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;

/** Thông báo lỗi thân thiện khi gọi tính năng cần Supabase mà chưa cấu hình. */
export const NOT_CONFIGURED_MESSAGE =
  "Supabase is not connected. Running in demo mode — see SETUP.md to connect a database.";

/**
 * Lấy client Supabase, ném lỗi tiếng Việt thân thiện nếu chưa cấu hình.
 * Toàn bộ data layer trong src/lib/db/* đi qua hàm này.
 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(NOT_CONFIGURED_MESSAGE);
  }
  return supabase;
}
