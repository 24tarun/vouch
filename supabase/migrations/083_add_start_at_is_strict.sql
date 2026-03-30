-- Add start_at as a general submission window start field (independent of Google Calendar)
-- Add is_strict to enforce the [start_at, deadline] submission window
ALTER TABLE tasks ADD COLUMN start_at timestamptz;
ALTER TABLE tasks ADD COLUMN is_strict boolean NOT NULL DEFAULT false;
