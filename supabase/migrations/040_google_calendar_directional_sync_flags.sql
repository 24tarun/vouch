-- Add independent directional sync controls for Google Calendar integration.
ALTER TABLE IF EXISTS public.google_calendar_connections
  ADD COLUMN IF NOT EXISTS sync_app_to_google_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.google_calendar_connections
  ADD COLUMN IF NOT EXISTS sync_google_to_app_enabled BOOLEAN NOT NULL DEFAULT false;

-- Backfill directional flags from legacy sync_enabled for existing users.
UPDATE public.google_calendar_connections
SET
  sync_app_to_google_enabled = sync_enabled,
  sync_google_to_app_enabled = sync_enabled;

-- Keep compatibility column aligned with directional flags.
UPDATE public.google_calendar_connections
SET sync_enabled = (sync_app_to_google_enabled OR sync_google_to_app_enabled);
