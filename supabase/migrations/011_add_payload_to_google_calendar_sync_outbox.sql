-- The google_calendar_sync_outbox table was missing the payload column.
-- This column stores optional JSONB metadata (google_event_id, calendar_id)
-- used when deleting a specific event or when the event ID is already known.
-- Without this column, every INSERT into the outbox silently failed (PostgREST
-- rejected the extra key), so google-calendar-dispatch never ran.
ALTER TABLE public.google_calendar_sync_outbox
  ADD COLUMN IF NOT EXISTS payload JSONB NULL;
