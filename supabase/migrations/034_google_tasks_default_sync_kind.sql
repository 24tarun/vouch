-- Add Google sync kind metadata to support TASK (default) vs EVENT routing.

ALTER TABLE IF EXISTS public.tasks
  ADD COLUMN IF NOT EXISTS google_sync_kind TEXT NOT NULL DEFAULT 'TASK';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_google_sync_kind_check'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_google_sync_kind_check
      CHECK (google_sync_kind IN ('TASK', 'EVENT'));
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.recurrence_rules
  ADD COLUMN IF NOT EXISTS google_sync_kind TEXT NOT NULL DEFAULT 'TASK';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recurrence_rules_google_sync_kind_check'
      AND conrelid = 'public.recurrence_rules'::regclass
  ) THEN
    ALTER TABLE public.recurrence_rules
      ADD CONSTRAINT recurrence_rules_google_sync_kind_check
      CHECK (google_sync_kind IN ('TASK', 'EVENT'));
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.google_calendar_task_links
  ADD COLUMN IF NOT EXISTS google_item_kind TEXT NOT NULL DEFAULT 'EVENT';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'google_calendar_task_links_item_kind_check'
      AND conrelid = 'public.google_calendar_task_links'::regclass
  ) THEN
    ALTER TABLE public.google_calendar_task_links
      ADD CONSTRAINT google_calendar_task_links_item_kind_check
      CHECK (google_item_kind IN ('TASK', 'EVENT'));
  END IF;
END
$$;

UPDATE public.google_calendar_task_links
SET google_item_kind = 'EVENT'
WHERE google_item_kind IS DISTINCT FROM 'EVENT';
