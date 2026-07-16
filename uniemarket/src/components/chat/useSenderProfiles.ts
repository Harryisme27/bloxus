// Cache tên + vai trò người gửi cho chat (view public_profiles).
// Mỗi sender_id chỉ được query đúng 1 lần (queryKey ['public-profile', id])
// và cache được chia sẻ giữa mọi khung chat qua TanStack Query.
import { useQueries } from "@tanstack/react-query";
import { getPublicProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { PublicProfileRow } from "@/types/db";

/**
 * Trả về map sender_id -> PublicProfileRow cho các id đã tải xong.
 * Id chưa tải xong (hoặc lỗi) đơn giản là vắng mặt trong map — caller
 * fallback sang tên chung chung ("Thành viên").
 */
export function useSenderProfiles(senderIds: string[]): Record<string, PublicProfileRow> {
  const ids = Array.from(new Set(senderIds.filter(Boolean))).sort();

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["public-profile", id] as const,
      queryFn: () => getPublicProfile(id),
      enabled: isSupabaseConfigured,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  const map: Record<string, PublicProfileRow> = {};
  results.forEach((result, index) => {
    if (result.data) map[ids[index]] = result.data;
  });
  return map;
}
