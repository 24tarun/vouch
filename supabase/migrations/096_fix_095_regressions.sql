-- Fix regressions and duplicate indexes introduced by migration 095

-- 1. Revert google_calendar_sync_outbox.task_id back to SET NULL
--    CASCADE was wrong: when a task is deleted the sync worker still needs
--    the outbox row to send the DELETE intent to Google Calendar.
ALTER TABLE google_calendar_sync_outbox DROP CONSTRAINT google_calendar_sync_outbox_task_id_fkey;
ALTER TABLE google_calendar_sync_outbox ADD CONSTRAINT google_calendar_sync_outbox_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- 2. Drop commitment_task_links_unique_task (NULLS NOT DISTINCT was too restrictive:
--    prevented a commitment from linking to more than one recurrence rule)
--    The pre-existing partial unique indexes already enforce what we need.
ALTER TABLE commitment_task_links DROP CONSTRAINT IF EXISTS commitment_task_links_unique_task;

-- 3. Drop google_calendar_sync_outbox_unique_intent (NULLS NOT DISTINCT caused
--    conflicts when multiple tasks from the same user are deleted simultaneously)
ALTER TABLE google_calendar_sync_outbox DROP CONSTRAINT IF EXISTS google_calendar_sync_outbox_unique_intent;

-- 4. Drop duplicate indexes added by 095 that already existed under other names
DROP INDEX IF EXISTS public.task_events_task_event_type_idx;
DROP INDEX IF EXISTS public.user_blocks_blocker_id_idx;
DROP INDEX IF EXISTS public.user_blocks_blocked_id_idx;
DROP INDEX IF EXISTS public.task_subtasks_parent_task_id_idx;
ALTER TABLE google_calendar_connections DROP CONSTRAINT IF EXISTS google_calendar_connections_unique_user;
DROP INDEX IF EXISTS public.google_calendar_sync_outbox_status_retry_idx;
DROP INDEX IF EXISTS public.task_reminders_parent_task_id_idx;
DROP INDEX IF EXISTS public.voucher_reminder_logs_voucher_id_idx;

-- 5. Drop pre-existing redundant index (UNIQUE constraint already creates this index)
DROP INDEX IF EXISTS public.idx_task_reminders_parent_reminder;
