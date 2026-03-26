--
-- 080: Row Level Security — enable RLS on all tables + all policies
--

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.ai_vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitment_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_sync_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rectify_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completion_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TASKS
-- ============================================
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Vouchers can view assigned tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = voucher_id);

CREATE POLICY "Vouchers can update assigned tasks" ON public.tasks
  FOR UPDATE
  USING (auth.uid() = voucher_id)
  WITH CHECK (auth.uid() = voucher_id AND status <> 'DELETED');

-- ============================================
-- RECURRENCE RULES
-- ============================================
CREATE POLICY "Users can view own recurrence rules" ON public.recurrence_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurrence rules" ON public.recurrence_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurrence rules" ON public.recurrence_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurrence rules" ON public.recurrence_rules
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COMMITMENTS
-- ============================================
CREATE POLICY "Users can view own commitments" ON public.commitments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments" ON public.commitments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments" ON public.commitments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commitments" ON public.commitments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COMMITMENT TASK LINKS
-- ============================================
CREATE POLICY "Users can view own commitment links" ON public.commitment_task_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM commitments WHERE commitments.id = commitment_task_links.commitment_id AND commitments.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own commitment links" ON public.commitment_task_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM commitments WHERE commitments.id = commitment_task_links.commitment_id AND commitments.user_id = auth.uid())
  );

CREATE POLICY "Users can update own commitment links" ON public.commitment_task_links
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM commitments WHERE commitments.id = commitment_task_links.commitment_id AND commitments.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM commitments WHERE commitments.id = commitment_task_links.commitment_id AND commitments.user_id = auth.uid()));

CREATE POLICY "Users can delete own commitment links" ON public.commitment_task_links
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM commitments WHERE commitments.id = commitment_task_links.commitment_id AND commitments.user_id = auth.uid())
  );

-- ============================================
-- TASK EVENTS
-- ============================================
CREATE POLICY "Users can view events for own tasks" ON public.task_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_events.task_id AND (tasks.user_id = auth.uid() OR tasks.voucher_id = auth.uid()))
  );

CREATE POLICY "System can insert events" ON public.task_events
  FOR INSERT WITH CHECK (true);

-- ============================================
-- TASK SUBTASKS
-- ============================================
CREATE POLICY "Users can view own task subtasks" ON public.task_subtasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task subtasks" ON public.task_subtasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task subtasks" ON public.task_subtasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task subtasks" ON public.task_subtasks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TASK REMINDERS
-- ============================================
CREATE POLICY "Users can view own task reminders" ON public.task_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task reminders" ON public.task_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task reminders" ON public.task_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task reminders" ON public.task_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TASK COMPLETION PROOFS
-- ============================================
CREATE POLICY "Owners can view own task proofs" ON public.task_completion_proofs
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Vouchers can view assigned task proofs" ON public.task_completion_proofs
  FOR SELECT USING (auth.uid() = voucher_id);

CREATE POLICY "Owners can insert own task proofs" ON public.task_completion_proofs
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_completion_proofs.task_id
        AND tasks.user_id = auth.uid()
        AND tasks.voucher_id = task_completion_proofs.voucher_id
    )
  );

CREATE POLICY "Owners can update own task proofs" ON public.task_completion_proofs
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own task proofs" ON public.task_completion_proofs
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- POMO SESSIONS
-- ============================================
CREATE POLICY "Users can manage own pomo sessions" ON public.pomo_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Friends can view active or paused pomo sessions" ON public.pomo_sessions
  FOR SELECT USING (
    status = ANY (ARRAY['ACTIVE','PAUSED'])
    AND EXISTS (
      SELECT 1 FROM friendships
      WHERE friendships.user_id = auth.uid()
        AND friendships.friend_id = pomo_sessions.user_id
    )
  );

-- ============================================
-- AI VOUCHES
-- ============================================
CREATE POLICY "Owner can read own ai_vouches" ON public.ai_vouches
  FOR SELECT USING (
    task_id IN (SELECT tasks.id FROM tasks WHERE tasks.user_id = auth.uid())
  );

-- ============================================
-- LEDGER ENTRIES
-- ============================================
CREATE POLICY "Users can view own ledger" ON public.ledger_entries
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- OVERRIDES
-- ============================================
CREATE POLICY "Users can view own overrides" ON public.overrides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own overrides" ON public.overrides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RECTIFY PASSES
-- ============================================
CREATE POLICY "Users can view own rectify passes" ON public.rectify_passes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vouchers can view authorized passes" ON public.rectify_passes
  FOR SELECT USING (auth.uid() = authorized_by);

CREATE POLICY "System can insert rectify passes" ON public.rectify_passes
  FOR INSERT WITH CHECK (true);

-- ============================================
-- GOOGLE CALENDAR CONNECTIONS
-- ============================================
CREATE POLICY "Users can view own Google Calendar connection" ON public.google_calendar_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own Google Calendar connection" ON public.google_calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Google Calendar connection" ON public.google_calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Google Calendar connection" ON public.google_calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- GOOGLE CALENDAR SYNC OUTBOX
-- ============================================
CREATE POLICY "Users can view own Google Calendar outbox" ON public.google_calendar_sync_outbox
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- GOOGLE CALENDAR TASK LINKS
-- ============================================
CREATE POLICY "Users can view own Google Calendar links" ON public.google_calendar_task_links
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- VOUCHER REMINDER LOGS
-- ============================================
CREATE POLICY "Users can view own voucher reminder logs" ON public.voucher_reminder_logs
  FOR SELECT USING (auth.uid() = voucher_id);

CREATE POLICY "Users can insert own voucher reminder logs" ON public.voucher_reminder_logs
  FOR INSERT WITH CHECK (auth.uid() = voucher_id);

-- ============================================
-- WEB PUSH SUBSCRIPTIONS
-- ============================================
CREATE POLICY "Users can view their own subscriptions" ON public.web_push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.web_push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON public.web_push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);
