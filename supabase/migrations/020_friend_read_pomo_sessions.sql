-- Allow friends to read only active/paused pomodoro sessions for friend activity.
-- Owner management policy remains unchanged.

DROP POLICY IF EXISTS "Friends can view active or paused pomo sessions" ON pomo_sessions;

CREATE POLICY "Friends can view active or paused pomo sessions" ON pomo_sessions
  FOR SELECT
  USING (
    status IN ('ACTIVE', 'PAUSED')
    AND EXISTS (
      SELECT 1
      FROM friendships
      WHERE friendships.user_id = auth.uid()
        AND friendships.friend_id = pomo_sessions.user_id
    )
  );
