-- Persist explicit Google Calendar event colors for app-origin and recurrence-generated tasks.

ALTER TABLE IF EXISTS public.tasks
  ADD COLUMN IF NOT EXISTS google_event_color_id TEXT;

ALTER TABLE IF EXISTS public.recurrence_rules
  ADD COLUMN IF NOT EXISTS google_event_color_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_google_event_color_id_check'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_google_event_color_id_check
      CHECK (
        google_event_color_id IS NULL
        OR google_event_color_id IN ('1','2','3','4','5','6','7','8','9','10','11')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recurrence_rules_google_event_color_id_check'
      AND conrelid = 'public.recurrence_rules'::regclass
  ) THEN
    ALTER TABLE public.recurrence_rules
      ADD CONSTRAINT recurrence_rules_google_event_color_id_check
      CHECK (
        google_event_color_id IS NULL
        OR google_event_color_id IN ('1','2','3','4','5','6','7','8','9','10','11')
      );
  END IF;
END $$;

