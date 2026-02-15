-- Add per-user toggle controlling whether vouchers can view active owner tasks.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS voucher_can_view_active_tasks BOOLEAN NOT NULL DEFAULT false;
