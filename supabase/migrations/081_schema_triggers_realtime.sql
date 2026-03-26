--
-- 081: Triggers and Realtime publication
--

-- ============================================
-- TRIGGERS: updated_at auto-set
-- ============================================
CREATE TRIGGER commitments_updated_at
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER google_calendar_connections_updated_at
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER google_calendar_sync_outbox_updated_at
  BEFORE UPDATE ON public.google_calendar_sync_outbox
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER google_calendar_task_links_updated_at
  BEFORE UPDATE ON public.google_calendar_task_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pomo_sessions_updated_at
  BEFORE UPDATE ON public.pomo_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER task_completion_proofs_updated_at
  BEFORE UPDATE ON public.task_completion_proofs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER task_reminders_updated_at
  BEFORE UPDATE ON public.task_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER task_subtasks_updated_at
  BEFORE UPDATE ON public.task_subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGERS: business logic
-- ============================================

-- Increment abandoned count when active commitment is deleted
CREATE TRIGGER commitments_increment_abandoned_count
  AFTER DELETE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION increment_abandoned_commitments_count();

-- Enforce 5 rectify passes per month per user
CREATE TRIGGER enforce_rectify_pass_limit
  BEFORE INSERT ON public.rectify_passes
  FOR EACH ROW EXECUTE FUNCTION check_rectify_pass_limit();

-- Prevent mutation of proof storage location fields
CREATE TRIGGER task_completion_proofs_prevent_location_mutation
  BEFORE UPDATE ON public.task_completion_proofs
  FOR EACH ROW EXECUTE FUNCTION prevent_task_proof_location_mutation();

-- Enforce max 20 subtasks per task
CREATE TRIGGER task_subtasks_limit
  BEFORE INSERT OR UPDATE OF parent_task_id ON public.task_subtasks
  FOR EACH ROW EXECUTE FUNCTION enforce_task_subtask_limit();

-- Prevent task.user_id from being changed
CREATE TRIGGER enforce_task_user_id_immutable
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION prevent_task_user_id_change();

-- Delete subtasks when task transitions to a completed state
CREATE TRIGGER tasks_delete_subtasks_on_completion
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION delete_subtasks_on_task_completion();

-- Auto-assign iteration number for recurring tasks
CREATE TRIGGER trg_assign_recurrence_task_iteration_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  WHEN (NEW.recurrence_rule_id IS NOT NULL)
  EXECUTE FUNCTION assign_recurrence_task_iteration_number();

-- ============================================
-- TRIGGER: auth.users → auto-create profile
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME PUBLICATION
-- ============================================
-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.commitment_task_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commitments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_calendar_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_calendar_sync_outbox;
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_calendar_task_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomo_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
