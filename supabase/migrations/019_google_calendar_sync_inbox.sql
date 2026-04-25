CREATE TABLE public.google_calendar_sync_inbox (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  channel_id      text        NOT NULL,
  resource_state  text        NOT NULL DEFAULT 'exists',
  status          text        NOT NULL DEFAULT 'PENDING',
  attempt_count   integer     NOT NULL DEFAULT 0,
  last_error      text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_calendar_sync_inbox_status_check
    CHECK (status = ANY (ARRAY['PENDING','PROCESSING','DONE','FAILED']))
);

CREATE INDEX google_calendar_sync_inbox_pending_idx
  ON public.google_calendar_sync_inbox (next_attempt_at)
  WHERE status IN ('PENDING', 'FAILED');

ALTER TABLE public.google_calendar_sync_inbox ENABLE ROW LEVEL SECURITY;
