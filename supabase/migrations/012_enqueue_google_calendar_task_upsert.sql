CREATE OR REPLACE FUNCTION public.enqueue_google_calendar_task_upsert(p_task_id uuid)
RETURNS TABLE (
  status text,
  reason text,
  outbox_id bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_task public.tasks%ROWTYPE;
  v_connection public.google_calendar_connections%ROWTYPE;
  v_existing_outbox_id bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND user_id = v_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT COALESCE(v_task.google_sync_for_task, false) THEN
    RETURN QUERY SELECT 'skipped'::text, 'task_not_event'::text, NULL::bigint;
    RETURN;
  END IF;

  SELECT *
  INTO v_connection
  FROM public.google_calendar_connections
  WHERE user_id = v_user_id
  LIMIT 1;

  IF NOT FOUND OR v_connection.encrypted_refresh_token IS NULL THEN
    RETURN QUERY SELECT 'skipped'::text, 'google_not_connected'::text, NULL::bigint;
    RETURN;
  END IF;

  IF NOT COALESCE(v_connection.sync_app_to_google_enabled, false) THEN
    RETURN QUERY SELECT 'skipped'::text, 'app_to_google_disabled'::text, NULL::bigint;
    RETURN;
  END IF;

  IF v_connection.selected_calendar_id IS NULL OR btrim(v_connection.selected_calendar_id) = '' THEN
    RETURN QUERY SELECT 'skipped'::text, 'calendar_not_selected'::text, NULL::bigint;
    RETURN;
  END IF;

  SELECT id
  INTO v_existing_outbox_id
  FROM public.google_calendar_sync_outbox
  WHERE user_id = v_user_id
    AND task_id = p_task_id
    AND intent = 'UPSERT'
    AND status IN ('PENDING', 'PROCESSING', 'FAILED')
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'enqueued'::text, NULL::text, v_existing_outbox_id;
    RETURN;
  END IF;

  INSERT INTO public.google_calendar_sync_outbox (
    user_id,
    task_id,
    intent,
    status,
    next_attempt_at
  )
  VALUES (
    v_user_id,
    p_task_id,
    'UPSERT',
    'PENDING',
    NOW()
  )
  RETURNING id INTO v_existing_outbox_id;

  RETURN QUERY SELECT 'enqueued'::text, NULL::text, v_existing_outbox_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_google_calendar_task_upsert(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_google_calendar_task_upsert(uuid) TO service_role;
