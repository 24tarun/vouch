CREATE OR REPLACE FUNCTION public.enqueue_google_calendar_task_delete(
  p_task_id uuid,
  p_google_event_id text DEFAULT NULL,
  p_calendar_id text DEFAULT NULL
)
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
  v_connection public.google_calendar_connections%ROWTYPE;
  v_existing_outbox_id bigint;
  v_google_event_id text := NULLIF(btrim(p_google_event_id), '');
  v_calendar_id text := NULLIF(btrim(p_calendar_id), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  IF v_google_event_id IS NULL THEN
    RETURN QUERY SELECT 'skipped'::text, 'google_event_missing'::text, NULL::bigint;
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

  v_calendar_id := COALESCE(v_calendar_id, NULLIF(btrim(v_connection.selected_calendar_id), ''));
  IF v_calendar_id IS NULL THEN
    RETURN QUERY SELECT 'skipped'::text, 'calendar_not_selected'::text, NULL::bigint;
    RETURN;
  END IF;

  SELECT outbox.id
  INTO v_existing_outbox_id
  FROM public.google_calendar_sync_outbox AS outbox
  WHERE outbox.user_id = v_user_id
    AND outbox.task_id IS NULL
    AND outbox.intent = 'DELETE'
    AND outbox.status IN ('PENDING', 'PROCESSING', 'FAILED')
    AND COALESCE(outbox.payload->>'google_event_id', '') = v_google_event_id
    AND COALESCE(outbox.payload->>'calendar_id', '') = v_calendar_id
  ORDER BY outbox.created_at DESC, outbox.id DESC
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
    next_attempt_at,
    payload
  )
  VALUES (
    v_user_id,
    NULL,
    'DELETE',
    'PENDING',
    NOW(),
    jsonb_build_object(
      'google_event_id', v_google_event_id,
      'calendar_id', v_calendar_id,
      'deleted_task_id', p_task_id
    )
  )
  RETURNING id INTO v_existing_outbox_id;

  RETURN QUERY SELECT 'enqueued'::text, NULL::text, v_existing_outbox_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_google_calendar_task_delete(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_google_calendar_task_delete(uuid, text, text) TO service_role;
