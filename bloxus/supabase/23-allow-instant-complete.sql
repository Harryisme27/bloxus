-- ============================================================================
-- 23-allow-instant-complete.sql — Cho phép paid -> completed (giao ngay)
-- ----------------------------------------------------------------------------
-- Sản phẩm instant_delivery: confirm_payment chuyển pending_payment -> paid ->
-- completed ngay. Guard cũ không cho paid -> completed. Bản này bổ sung.
-- Chạy 1 lần trong Supabase SQL Editor (sau 20b).
-- ============================================================================

create or replace function public.guard_order_status()
returns trigger language plpgsql as $$
begin
  if old.status = new.status then return new; end if;
  if not (
    (old.status = 'pending_payment' and new.status in ('paid', 'cancelled')) or
    (old.status = 'paid'            and new.status in ('in_progress', 'completed', 'cancelled', 'refunded')) or
    (old.status = 'in_progress'     and new.status in ('paid', 'completed', 'cancelled', 'refunded')) or
    (old.status = 'completed'       and new.status = 'refunded')
  ) then
    raise exception 'Không thể chuyển trạng thái đơn từ % sang %.', old.status, new.status;
  end if;
  return new;
end;
$$;

-- Xong.
