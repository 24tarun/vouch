-- Add subtasks for parent tasks

CREATE TABLE IF NOT EXISTS task_subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_subtasks_title_not_blank CHECK (char_length(btrim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent_task_id
  ON task_subtasks(parent_task_id);

CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent_created_at
  ON task_subtasks(parent_task_id, created_at);

ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own task subtasks" ON task_subtasks;
CREATE POLICY "Users can view own task subtasks" ON task_subtasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task subtasks" ON task_subtasks;
CREATE POLICY "Users can insert own task subtasks" ON task_subtasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task subtasks" ON task_subtasks;
CREATE POLICY "Users can update own task subtasks" ON task_subtasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task subtasks" ON task_subtasks;
CREATE POLICY "Users can delete own task subtasks" ON task_subtasks
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS task_subtasks_updated_at ON task_subtasks;
CREATE TRIGGER task_subtasks_updated_at
  BEFORE UPDATE ON task_subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION enforce_task_subtask_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.parent_task_id = OLD.parent_task_id THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO current_count
  FROM task_subtasks
  WHERE parent_task_id = NEW.parent_task_id;

  IF current_count >= 20 THEN
    RAISE EXCEPTION 'A task cannot have more than 20 subtasks.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_subtasks_limit ON task_subtasks;
CREATE TRIGGER task_subtasks_limit
  BEFORE INSERT OR UPDATE OF parent_task_id ON task_subtasks
  FOR EACH ROW EXECUTE FUNCTION enforce_task_subtask_limit();
