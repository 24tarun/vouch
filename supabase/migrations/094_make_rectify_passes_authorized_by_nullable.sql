-- rectify_passes.authorized_by must be nullable so account deletion can null out
-- the reference before removing the auth user (FK has NO ACTION delete rule).
ALTER TABLE rectify_passes ALTER COLUMN authorized_by DROP NOT NULL;
