// Auth thật qua Supabase Auth (thay cho bản demo localStorage của v1).
//
// - `session`: phiên Supabase (JWT) — null khi chưa đăng nhập.
// - `user`: dòng profiles của người đang đăng nhập (kèm role) — null khi chưa
//   đăng nhập hoặc profile chưa tải xong.
// - `loading`: true cho tới khi init() xác định xong trạng thái đăng nhập ban
//   đầu — guards (RequireAuth/RequireRole) PHẢI chờ loading = false.
//
// Khi CHƯA cấu hình Supabase (thiếu .env.local): store rơi vào chế độ
// "not configured" — login/register trả lỗi tiếng Việt thân thiện, còn
// storefront seed-data vẫn duyệt bình thường.
import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/supabase";
import type { ProfileRow } from "@/types/db";

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  /** Token Cloudflare Turnstile (khi Supabase Auth bật captcha). */
  captchaToken?: string;
}

export type AuthResult = { success: true } | { success: false; error: string };

interface AuthState {
  session: Session | null;
  /** Profile row (kèm role) của người đang đăng nhập. */
  user: ProfileRow | null;
  /** true cho tới khi biết chắc trạng thái đăng nhập ban đầu. */
  loading: boolean;
  /** Gọi đúng 1 lần khi app khởi động (main.tsx). */
  init: () => void;
  login: (identifier: string, password: string, captchaToken?: string) => Promise<AuthResult>;
  /** Đăng nhập/đăng ký qua Google hoặc Discord — chuyển hướng sang trang OAuth,
   * quay về là có phiên (profile tự tạo bởi trigger handle_new_user). */
  /** `next` = trang quay về sau khi đăng nhập (mặc định /dashboard). */
  loginWithOAuth: (provider: "google" | "discord", next?: string) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  /** Tải lại profile từ DB (sau khi cập nhật hồ sơ / được duyệt Seller). */
  refreshProfile: () => Promise<void>;
}

let initialized = false;

/** Dịch các lỗi Supabase Auth thường gặp sang tiếng Việt. */
function translateAuthError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  if (msg.includes("already registered") || msg.includes("already been registered")) {
    return "Email này đã được đăng ký.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email chưa được xác nhận. Kiểm tra hộp thư hoặc nhờ admin tắt Confirm email.";
  }
  if (msg.includes("password should be at least")) {
    return "Mật khẩu quá ngắn (tối thiểu 6 ký tự).";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Thao tác quá nhanh, vui lòng thử lại sau ít phút.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network")) {
    return "Không kết nối được máy chủ. Kiểm tra mạng hoặc cấu hình Supabase.";
  }
  return message;
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Không tải được profile:", error.message);
    return null;
  }
  return (data as ProfileRow | null) ?? null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  user: null,
  loading: true,

  init: () => {
    if (initialized) return;
    initialized = true;

    if (!isSupabaseConfigured || !supabase) {
      // Chế độ chưa cấu hình: coi như chưa đăng nhập, không chờ gì cả.
      set({ session: null, user: null, loading: false });
      return;
    }

    // Trạng thái ban đầu.
    void supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      const profile = session ? await fetchProfile(session.user.id) : null;
      set({ session, user: profile, loading: false });
    });

    // Theo dõi đăng nhập/đăng xuất/refresh token.
    supabase.auth.onAuthStateChange((_event, session) => {
      const prev = get().session;
      set({ session });
      if (!session) {
        set({ user: null, loading: false });
        return;
      }
      // Chỉ tải lại profile khi đổi người dùng (tránh gọi thừa mỗi lần refresh token).
      if (prev?.user.id !== session.user.id || !get().user) {
        void fetchProfile(session.user.id).then((profile) => {
          set({ user: profile, loading: false });
        });
      }
    });
  },

  login: async (identifier, password, captchaToken) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }
    // Cho phép đăng nhập bằng username HOẶC email. Nếu không có "@" thì coi là
    // username -> tra email qua RPC (SECURITY DEFINER). Lỗi trả về chung chung
    // để tránh dò tên đăng nhập.
    let email = identifier.trim();
    if (email && !email.includes("@")) {
      const { data: resolved, error: lookupError } = await supabase.rpc("email_for_login", {
        p_login: email,
      });
      if (lookupError || !resolved) {
        return { success: false, error: translateAuthError("Invalid login credentials") };
      }
      email = resolved as string;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }
    const profile = await fetchProfile(data.user.id);
    set({ session: data.session, user: profile, loading: false });
    return { success: true };
  },

  loginWithOAuth: async (provider, next) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }
    // Discord trên bản thật: đi qua máy chủ của chính bloxus.store
    // (functions/api/auth/discord) để màn hình Discord hiện bloxus.store thay vì
    // supabase.co. `npm run dev` không chạy Pages Functions -> dùng Supabase như cũ.
    if (provider === "discord" && import.meta.env.PROD) {
      window.location.assign(`/api/auth/discord/login?next=${encodeURIComponent(next ?? "/dashboard")}`);
      return { success: true };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }
    // Trình duyệt sẽ rời trang sang Google/Discord; quay về thì
    // detectSessionInUrl + onAuthStateChange (init) tự nạp phiên & profile.
    return { success: true };
  },

  register: async ({ email, password, username, captchaToken }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return { success: false, error: "Tên hiển thị cần tối thiểu 3 ký tự." };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: trimmedUsername }, ...(captchaToken ? { captchaToken } : {}) },
    });
    if (error) {
      return { success: false, error: translateAuthError(error.message) };
    }
    // Nếu Confirm email đang BẬT, signUp không trả session — người dùng phải
    // xác nhận email rồi đăng nhập lại. (SETUP.md khuyên tắt Confirm email.)
    if (data.session && data.user) {
      const profile = await fetchProfile(data.user.id);
      set({ session: data.session, user: profile, loading: false });
    }
    return { success: true };
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ session: null, user: null, loading: false });
  },

  refreshProfile: async () => {
    const session = get().session;
    if (!session) return;
    const profile = await fetchProfile(session.user.id);
    set({ user: profile });
  },
}));
