-- One-off tasks: tied to a specific date.
-- Created manually by managers via Daily Checklists or Task Calendar.
CREATE TABLE tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  task_date date NOT NULL,
  task_time time,
  category task_category NOT NULL DEFAULT 'general',
  visibility task_visibility NOT NULL DEFAULT 'all',
  game_day_period game_day_period,        -- only relevant when visibility = 'game_day'
  is_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_date ON tasks(user_id, task_date);

-- Recurring task definitions: no date, repeat every applicable day.
-- Replaces both the old "recurring tasks" and "template tasks."
CREATE TABLE recurring_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  default_time time,
  category task_category NOT NULL DEFAULT 'general',
  visibility task_visibility NOT NULL DEFAULT 'all',
  game_day_period game_day_period,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_tasks_user ON recurring_tasks(user_id);

-- Recurring task completions: persisted per day.
-- Solves the old problem where completions reset on page refresh.
CREATE TABLE recurring_task_completions (
  recurring_task_id bigint NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  completion_date date NOT NULL,
  is_complete boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (recurring_task_id, completion_date)
);

CREATE INDEX idx_rtc_date ON recurring_task_completions(completion_date);
