-- Rename table
ALTER TABLE public.ai_vouch_denials RENAME TO ai_vouches;

-- Rename index
ALTER INDEX ai_vouch_denials_task_id_idx RENAME TO ai_vouches_task_id_idx;

-- Add decision column (default 'denied' so existing rows stay correct)
ALTER TABLE public.ai_vouches
  ADD COLUMN decision TEXT NOT NULL DEFAULT 'denied' CHECK (decision IN ('approved', 'denied'));

-- Rename denied_at -> vouched_at
ALTER TABLE public.ai_vouches RENAME COLUMN denied_at TO vouched_at;

-- Drop old RLS policy and recreate with new name
DROP POLICY IF EXISTS "Owner can read own ai_vouch_denials" ON public.ai_vouches;
CREATE POLICY "Owner can read own ai_vouches"
  ON public.ai_vouches FOR SELECT
  USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));
