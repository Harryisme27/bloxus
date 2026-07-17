-- ============================================================================
-- 16-chat-images.sql — Cho phép gửi tin nhắn CHỈ có ảnh (không cần chữ)
-- ----------------------------------------------------------------------------
-- post_message cũ bắt buộc body không rỗng. Bản này: hợp lệ khi CÓ chữ HOẶC
-- CÓ ảnh đính kèm. Xem trước trong thông báo hiển thị "📷 Hình ảnh" nếu chỉ ảnh.
-- Tiện thể cho manager cũng nhận thông báo kênh nội bộ (đồng bộ vai trò mới).
-- Chạy 1 lần trong Supabase SQL Editor (sau 14/15).
-- ============================================================================

create or replace function public.post_message(
  p_thread_id   uuid,
  p_body        text,
  p_attachments text[] default null
)
returns public.messages
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_thread  public.threads;
  v_order   public.orders;
  v_message public.messages;
  v_sender  text;
  v_body    text := btrim(coalesce(p_body, ''));
  v_atts    text[] := coalesce(p_attachments, '{}');
  v_preview text;
begin
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập để nhắn tin.';
  end if;
  -- Hợp lệ khi có chữ HOẶC có ít nhất 1 ảnh.
  if v_body = '' and array_length(v_atts, 1) is null then
    raise exception 'Tin nhắn không được để trống.';
  end if;
  if not public.can_access_thread(p_thread_id) then
    raise exception 'Bạn không có quyền truy cập cuộc trò chuyện này.';
  end if;

  select * into v_thread from public.threads where id = p_thread_id;

  insert into public.messages (thread_id, sender_id, body, attachments)
  values (p_thread_id, v_uid, v_body, v_atts)
  returning * into v_message;

  select coalesce(display_name, username) into v_sender
  from public.profiles where id = v_uid;

  -- Xem trước cho thông báo: có chữ thì cắt 120 ký tự, chỉ ảnh thì "📷 Hình ảnh".
  v_preview := case when v_body <> '' then left(v_body, 120) else '📷 Hình ảnh' end;

  if v_thread.kind = 'staff' then
    insert into public.notifications (user_id, type, title, body, link)
    select id, 'message',
           'Tin nhắn mới trong ' || coalesce(v_thread.title, 'kênh nội bộ'),
           v_sender || ': ' || v_preview,
           '/work/chat'
    from public.profiles
    where role in ('admin', 'manager', 'ctv') and id <> v_uid;
  else
    select * into v_order from public.orders where id = v_thread.order_id;
    insert into public.notifications (user_id, type, title, body, link)
    select distinct pid, 'message',
           'Tin nhắn mới về đơn ' || v_order.order_code,
           v_sender || ': ' || v_preview,
           case when pid = v_order.user_id
                then '/orders/' || v_order.id
                else '/work/orders/' || v_order.id end
    from (
      select v_order.user_id as pid
      union select v_order.assigned_ctv
      union select id from public.profiles where role = 'admin'
    ) participants
    where pid is not null and pid <> v_uid;
  end if;

  return v_message;
end;
$$;

-- Xong.
