-- Fix all schema issues: FKs, constraints, and nullable column mismatches

-- 1. Fix task_events.actor_id: Change NO ACTION to SET NULL
ALTER TABLE task_events DROP CONSTRAINT task_events_actor_id_fkey;
ALTER TABLE task_events ADD CONSTRAINT task_events_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Fix recurrence_rules.voucher_id: Make nullable (contradicts SET NULL cascade)
ALTER TABLE recurrence_rules ALTER COLUMN voucher_id DROP NOT NULL;

-- 3. Fix web_push_subscriptions.user_id: Make NOT NULL (required relationship)
-- First, any existing null rows will violate the constraint, but table is empty
ALTER TABLE web_push_subscriptions ALTER COLUMN user_id SET NOT NULL;

-- 4. Add unique constraint to commitment_task_links on (commitment_id, task_id)
-- Since task_id is nullable, add constraint that handles nulls: only one non-null per commitment
ALTER TABLE commitment_task_links
ADD CONSTRAINT commitment_task_links_unique_task
UNIQUE NULLS NOT DISTINCT (commitment_id, task_id);

-- 5. Add unique constraint to google_calendar_task_links on (task_id, google_event_id)
ALTER TABLE google_calendar_task_links
ADD CONSTRAINT google_calendar_task_links_unique_event
UNIQUE (task_id, google_event_id);

-- 6. Add unique constraint to google_calendar_connections on (user_id)
ALTER TABLE google_calendar_connections
ADD CONSTRAINT google_calendar_connections_unique_user
UNIQUE (user_id);

-- 7. Add unique constraint to google_calendar_sync_outbox on (user_id, task_id, intent)
-- This prevents duplicate sync intents for the same user+task pair
ALTER TABLE google_calendar_sync_outbox
ADD CONSTRAINT google_calendar_sync_outbox_unique_intent
UNIQUE NULLS NOT DISTINCT (user_id, task_id, intent);

-- 8. Align task_events references: Make actor_user_client_instance_id SET NULL (already is)
-- No change needed, already SET NULL

-- 9. Change google_calendar_sync_outbox.task_id to CASCADE DELETE
-- This prevents orphaned sync records when task is deleted
ALTER TABLE google_calendar_sync_outbox DROP CONSTRAINT google_calendar_sync_outbox_task_id_fkey;
ALTER TABLE google_calendar_sync_outbox ADD CONSTRAINT google_calendar_sync_outbox_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 10. Add missing indexes on FK columns for query performance
CREATE INDEX IF NOT EXISTS commitment_task_links_task_id_idx ON commitment_task_links(task_id);
CREATE INDEX IF NOT EXISTS commitment_task_links_recurrence_rule_id_idx ON commitment_task_links(recurrence_rule_id);
CREATE INDEX IF NOT EXISTS google_calendar_sync_outbox_task_id_idx ON google_calendar_sync_outbox(task_id);
CREATE INDEX IF NOT EXISTS google_calendar_task_links_calendar_id_idx ON google_calendar_task_links(calendar_id);
CREATE INDEX IF NOT EXISTS task_reminders_parent_task_id_idx ON task_reminders(parent_task_id);
CREATE INDEX IF NOT EXISTS task_subtasks_parent_task_id_idx ON task_subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocker_id_idx ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS voucher_reminder_logs_voucher_id_idx ON voucher_reminder_logs(voucher_id);

-- 11. Add index on google_calendar_sync_outbox (status, next_attempt_at) for sync workers
CREATE INDEX IF NOT EXISTS google_calendar_sync_outbox_status_retry_idx
  ON google_calendar_sync_outbox(status, next_attempt_at) WHERE status != 'DONE';

-- 12. Add index on task_events for common queries (task_id, event_type)
CREATE INDEX IF NOT EXISTS task_events_task_event_type_idx ON task_events(task_id, event_type);
