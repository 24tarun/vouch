-- Ensure task_reminders timestamps always have defaults.
-- This guards environments where defaults may have drifted.

ALTER TABLE task_reminders
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE task_reminders
  ALTER COLUMN updated_at SET DEFAULT NOW();
