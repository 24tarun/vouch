-- Track incremental cursor for Google Tasks delta pulls.
ALTER TABLE IF EXISTS public.google_calendar_connections
  ADD COLUMN IF NOT EXISTS google_tasks_updated_min TIMESTAMPTZ;
