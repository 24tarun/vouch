-- Add per-user opt-in toggle to import only tagged Google events into Vouch.
ALTER TABLE IF EXISTS public.google_calendar_connections
  ADD COLUMN IF NOT EXISTS import_only_tagged_google_events BOOLEAN NOT NULL DEFAULT false;
