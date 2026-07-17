// Data layer — Chat realtime (threads + messages) và thông báo realtime.
// Gửi tin qua RPC post_message (server kiểm tra quyền + tạo notification).
import type { RealtimeChannel } from "@supabase/supabase-js";
import { requireSupabase } from "@/lib/supabase";
import type { MessageRow, NotificationRow, ThreadRow } from "@/types/db";

/** Các thread tôi được tham gia (RLS lọc sẵn), mới nhắn gần nhất lên đầu. */
export async function listMyThreads(): Promise<ThreadRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("threads")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ThreadRow[];
}

export async function getThread(id: string): Promise<ThreadRow | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("threads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ThreadRow | null) ?? null;
}

export async function listMessages(
  threadId: string,
  opts?: { limit?: number },
): Promise<MessageRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(opts?.limit ?? 200);
  if (error) throw new Error(error.message);
  return (data ?? []) as MessageRow[];
}

/** Gửi tin nhắn qua RPC (kiểm tra quyền + notify người còn lại phía server). */
export async function postMessage(
  threadId: string,
  body: string,
  attachments?: string[],
): Promise<MessageRow> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("post_message", {
    p_thread_id: threadId,
    p_body: body,
    p_attachments: attachments ?? null,
  });
  if (error) throw new Error(error.message);
  return data as MessageRow;
}

/** Tải ảnh vào bucket riêng `chat-attachments/<threadId>/...` (RLS theo thread).
 * Trả về PATH của object (lưu vào messages.attachments); hiển thị qua signed URL. */
export async function uploadChatImage(threadId: string, file: File): Promise<string> {
  const sb = requireSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${threadId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("chat-attachments").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

/** Tạo signed URL (1 giờ) để hiển thị ảnh chat từ bucket riêng. */
export async function signedChatUrl(path: string): Promise<string | null> {
  const sb = requireSupabase();
  const { data, error } = await sb.storage.from("chat-attachments").createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/**
 * Lắng nghe tin nhắn mới trong 1 thread (Realtime).
 * Trả về hàm unsubscribe — GỌI NÓ trong cleanup của useEffect.
 */
export function subscribeToThread(
  threadId: string,
  cb: (message: MessageRow) => void,
): () => void {
  const sb = requireSupabase();
  const channel: RealtimeChannel = sb
    .channel(`thread-${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => cb(payload.new as MessageRow),
    )
    .subscribe();

  return () => {
    void sb.removeChannel(channel);
  };
}

/**
 * Lắng nghe thông báo mới của CHÍNH TÔI (badge sidebar, toast...).
 * Trả về hàm unsubscribe. An toàn khi gọi trước khi session sẵn sàng
 * (tự lấy user id async; nếu chưa đăng nhập thì không subscribe gì).
 */
export function subscribeToMyNotifications(
  cb: (notification: NotificationRow) => void,
): () => void {
  const sb = requireSupabase();
  let channel: RealtimeChannel | null = null;
  let cancelled = false;

  void sb.auth.getSession().then(({ data }) => {
    const uid = data.session?.user.id;
    if (!uid || cancelled) return;
    channel = sb
      .channel(`notifications-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${uid}`,
        },
        (payload) => cb(payload.new as NotificationRow),
      )
      .subscribe();
  });

  return () => {
    cancelled = true;
    if (channel) void sb.removeChannel(channel);
  };
}
