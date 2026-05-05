-- Rename legacy AI deny event type to the canonical AI_DENIED.
UPDATE public.task_events
SET event_type = 'AI_DENIED'
WHERE event_type = 'AI_DENY';
