-- Ensure default voucher is self by default for all users.
-- 1) Backfill existing profiles with null default_voucher_id.
-- 2) Update signup profile bootstrap to set default_voucher_id = user id.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_voucher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

UPDATE profiles
SET default_voucher_id = id
WHERE default_voucher_id IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, default_voucher_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    ),
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
