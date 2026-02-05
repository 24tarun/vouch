-- Migration: Add Recurrence Rules for Repetitive Tasks
-- This migration adds the recurrence_rules table and links tasks to it.

-- 1. Create recurrence_rules table
CREATE TABLE recurrence_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL, -- tasks need a voucher, but if voucher is deleted, rule might need attention.
  title TEXT NOT NULL,
  description TEXT,
  failure_cost_cents INT NOT NULL,
  
  -- rule_config stores the logic: 
  -- { 
  --   "frequency": "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "WEEKDAYS" | "CUSTOM",
  --   "interval": 1, 
  --   "days_of_week": [1, 3], -- Mon, Wed (0-6 or 1-7 depending on convention, let's use 0=Sun, 1=Mon)
  --   "time_of_day": "14:00" 
  -- }
  rule_config JSONB NOT NULL,
  
  -- User's timezone to calculate "midnight" or specific times correctly.
  -- e.g. 'Europe/London', 'America/New_York'
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  active BOOLEAN DEFAULT true NOT NULL,
  
  -- Track the last date a task was generated for.
  -- Stored as a date string 'YYYY-MM-DD' in the user's timezone.
  last_generated_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add foreign key to tasks table
ALTER TABLE tasks
ADD COLUMN recurrence_rule_id UUID REFERENCES recurrence_rules(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view own recurrence rules" ON recurrence_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurrence rules" ON recurrence_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurrence rules" ON recurrence_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurrence rules" ON recurrence_rules
  FOR DELETE USING (auth.uid() = user_id);

-- System/Admin (Trigger.dev) needs access, which bypasses RLS if using service role,
-- otherwise ensure policies allow system actions if running as specific user.

-- 5. Index for performance (finding active rules)
CREATE INDEX idx_recurrence_rules_active ON recurrence_rules(active) WHERE active = true;
CREATE INDEX idx_tasks_recurrence_rule_id ON tasks(recurrence_rule_id);
