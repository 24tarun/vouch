-- Add per-user default duration for event tasks.
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS default_event_duration_minutes INT NOT NULL DEFAULT 60;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_default_event_duration_minutes_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_default_event_duration_minutes_check
      CHECK (default_event_duration_minutes BETWEEN 1 AND 720);
  END IF;
END $$;
