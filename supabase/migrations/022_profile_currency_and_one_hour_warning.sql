-- Add per-user currency preference and one-hour deadline warning toggle.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS deadline_one_hour_warning_enabled BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_currency_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_currency_check
      CHECK (currency IN ('EUR', 'USD', 'INR'));
  END IF;
END $$;
