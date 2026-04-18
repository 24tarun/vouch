-- Add INSERT RLS policies to ledger_entries.
-- Previously only a SELECT policy existed, so any insert via a non-service-role
-- client (e.g. user-scoped client in acceptDenial, or admin client with wrong key)
-- would fail silently.
--
-- Two cases we need to cover:
--   1. Task owner accepts an AI denial (auth.uid() = user_id)
--   2. Voucher denies a task on behalf of the owner (auth.uid() = voucher_id on the task)

CREATE POLICY "Users can insert own ledger entries" ON public.ledger_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Voucher can insert ledger entry for their task" ON public.ledger_entries
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT voucher_id FROM public.tasks WHERE id = task_id)
  );
