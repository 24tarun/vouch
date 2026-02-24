-- Expand failure cost check upper bounds to support INR 1000.00 (100000 cents).
-- Also align profile default cost to the new minimum policy.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'tasks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%failure_cost_cents%'
  ) LOOP
    EXECUTE 'ALTER TABLE tasks DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_failure_cost_cents_check
  CHECK (failure_cost_cents BETWEEN 1 AND 100000);

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_default_failure_cost_cents_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_failure_cost_cents_check
  CHECK (default_failure_cost_cents BETWEEN 1 AND 100000);

ALTER TABLE profiles
  ALTER COLUMN default_failure_cost_cents SET DEFAULT 100;

-- One-time cleanup so existing defaults respect per-currency minimums.
UPDATE profiles
SET default_failure_cost_cents = CASE
  WHEN currency = 'INR' AND default_failure_cost_cents < 5000 THEN 5000
  WHEN currency IN ('EUR', 'USD') AND default_failure_cost_cents < 100 THEN 100
  ELSE default_failure_cost_cents
END
WHERE
  (currency = 'INR' AND default_failure_cost_cents < 5000)
  OR (currency IN ('EUR', 'USD') AND default_failure_cost_cents < 100);
