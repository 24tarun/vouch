-- Account deletion FK hardening:
-- 1) recurrence_rules.voucher_id should cascade on profile delete
-- 2) rectify_passes.authorized_by should become nullable and set null on profile delete

DO $$
DECLARE
  r RECORD;
  voucher_attnum SMALLINT;
BEGIN
  SELECT attnum
  INTO voucher_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.recurrence_rules'::regclass
    AND attname = 'voucher_id'
    AND NOT attisdropped;

  IF voucher_attnum IS NOT NULL THEN
    FOR r IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.recurrence_rules'::regclass
        AND contype = 'f'
        AND conkey = ARRAY[voucher_attnum]
    LOOP
      EXECUTE format('ALTER TABLE public.recurrence_rules DROP CONSTRAINT %I', r.conname);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.recurrence_rules
  ADD CONSTRAINT recurrence_rules_voucher_id_fkey
  FOREIGN KEY (voucher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$
DECLARE
  r RECORD;
  authorized_by_attnum SMALLINT;
BEGIN
  SELECT attnum
  INTO authorized_by_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.rectify_passes'::regclass
    AND attname = 'authorized_by'
    AND NOT attisdropped;

  IF authorized_by_attnum IS NOT NULL THEN
    FOR r IN
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.rectify_passes'::regclass
        AND contype = 'f'
        AND conkey = ARRAY[authorized_by_attnum]
    LOOP
      EXECUTE format('ALTER TABLE public.rectify_passes DROP CONSTRAINT %I', r.conname);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.rectify_passes
  ALTER COLUMN authorized_by DROP NOT NULL;

ALTER TABLE public.rectify_passes
  ADD CONSTRAINT rectify_passes_authorized_by_fkey
  FOREIGN KEY (authorized_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
