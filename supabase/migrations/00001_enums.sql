CREATE TYPE user_role AS ENUM ('clubhouse_manager', 'general_manager', 'player');

-- Controls when a task is visible
-- 'all'      = always show on its date
-- 'game_day' = only show when the team has a home game
-- 'off_day'  = only show when the team does NOT have a home game
CREATE TYPE task_visibility AS ENUM ('all', 'game_day', 'off_day');

-- For game-day tasks, which section they appear in
CREATE TYPE game_day_period AS ENUM ('morning', 'pre_game', 'post_game');

CREATE TYPE task_category AS ENUM (
  'sanitation', 'laundry', 'food', 'equipment',
  'field', 'admin', 'medical', 'general'
);

CREATE TYPE inventory_category AS ENUM (
  'laundry_cleaning', 'hygiene_personal', 'medical_safety',
  'equipment_field', 'food_beverage', 'miscellaneous'
);

-- Simplified stock status for the checklist UI
CREATE TYPE stock_status AS ENUM ('stocked', 'low', 'out');

CREATE TYPE issue_status AS ENUM ('new', 'in_progress', 'resolved');

CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'bulletin');
