-- Store optional per-rule manual reminder offsets for recurring task generation.
-- NULL = legacy behavior (derive from latest generated task reminders).
-- [] or [offsets] = template behavior for newly created recurrence rules.

ALTER TABLE recurrence_rules
  ADD COLUMN IF NOT EXISTS manual_reminder_offsets_ms JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'recurrence_rules_manual_reminder_offsets_ms_is_array'
  ) THEN
    ALTER TABLE recurrence_rules
      ADD CONSTRAINT recurrence_rules_manual_reminder_offsets_ms_is_array
      CHECK (
        manual_reminder_offsets_ms IS NULL
        OR jsonb_typeof(manual_reminder_offsets_ms) = 'array'
      );
  END IF;
END $$;
