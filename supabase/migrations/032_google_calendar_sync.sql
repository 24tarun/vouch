-- Google Calendar duplex sync storage

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  google_account_email TEXT,
  selected_calendar_id TEXT,
  selected_calendar_summary TEXT,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  watch_channel_id TEXT,
  watch_resource_id TEXT,
  watch_expires_at TIMESTAMPTZ,
  sync_token TEXT,
  last_webhook_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS google_calendar_task_links (
  task_id UUID PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  calendar_id TEXT NOT NULL,
  google_event_id TEXT NOT NULL,
  last_google_etag TEXT,
  last_google_updated_at TIMESTAMPTZ,
  last_app_updated_at TIMESTAMPTZ,
  last_origin TEXT NOT NULL DEFAULT 'APP' CHECK (last_origin IN ('APP', 'GOOGLE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT google_calendar_task_links_event_unique UNIQUE (user_id, calendar_id, google_event_id)
);

CREATE TABLE IF NOT EXISTS google_calendar_sync_outbox (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  intent TEXT NOT NULL CHECK (intent IN ('UPSERT', 'DELETE')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
  attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_task_links_user_id
  ON google_calendar_task_links(user_id);

CREATE INDEX IF NOT EXISTS idx_google_calendar_task_links_event
  ON google_calendar_task_links(user_id, calendar_id, google_event_id);

CREATE INDEX IF NOT EXISTS idx_google_calendar_outbox_pending
  ON google_calendar_sync_outbox(status, next_attempt_at)
  WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_google_calendar_outbox_user
  ON google_calendar_sync_outbox(user_id);

ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_sync_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own Google Calendar connection" ON google_calendar_connections;
CREATE POLICY "Users can view own Google Calendar connection" ON google_calendar_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own Google Calendar connection" ON google_calendar_connections;
CREATE POLICY "Users can insert own Google Calendar connection" ON google_calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own Google Calendar connection" ON google_calendar_connections;
CREATE POLICY "Users can update own Google Calendar connection" ON google_calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own Google Calendar connection" ON google_calendar_connections;
CREATE POLICY "Users can delete own Google Calendar connection" ON google_calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own Google Calendar links" ON google_calendar_task_links;
CREATE POLICY "Users can view own Google Calendar links" ON google_calendar_task_links
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own Google Calendar outbox" ON google_calendar_sync_outbox;
CREATE POLICY "Users can view own Google Calendar outbox" ON google_calendar_sync_outbox
  FOR SELECT USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS google_calendar_connections_updated_at ON google_calendar_connections;
CREATE TRIGGER google_calendar_connections_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS google_calendar_task_links_updated_at ON google_calendar_task_links;
CREATE TRIGGER google_calendar_task_links_updated_at
  BEFORE UPDATE ON google_calendar_task_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS google_calendar_sync_outbox_updated_at ON google_calendar_sync_outbox;
CREATE TRIGGER google_calendar_sync_outbox_updated_at
  BEFORE UPDATE ON google_calendar_sync_outbox
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
