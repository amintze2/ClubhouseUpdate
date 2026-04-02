// ============================================================
// ENUMS
// ============================================================

export type UserRole = "clubhouse_manager" | "general_manager" | "player";

export type TaskVisibility = "all" | "game_day" | "off_day";

export type GameDayPeriod = "morning" | "pre_game" | "post_game";

export type TaskCategory =
  | "sanitation"
  | "laundry"
  | "food"
  | "equipment"
  | "field"
  | "admin"
  | "medical"
  | "general";

export type InventoryCategory =
  | "laundry_cleaning"
  | "hygiene_personal"
  | "medical_safety"
  | "equipment_field"
  | "food_beverage"
  | "miscellaneous";

export type StockStatus = "stocked" | "low" | "out";

export type IssueStatus = "new" | "in_progress" | "resolved";

export type ConversationType = "direct" | "group" | "bulletin";

// ============================================================
// TABLES
// ============================================================

export interface Team {
  id: number;
  team_name: string;
  created_at: string;
}

export interface User {
  id: number;
  slugger_user_id: string;
  user_name: string | null;
  email: string | null;
  role: UserRole;
  team_id: number;
  team_name: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
}

export interface Game {
  id: number;
  home_team_id: number;
  away_team_id: number;
  game_date: string; // ISO date string: "YYYY-MM-DD"
  game_time: string | null; // "HH:MM"
  is_makeup: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  task_date: string; // "YYYY-MM-DD"
  task_time: string | null; // "HH:MM"
  category: TaskCategory;
  visibility: TaskVisibility;
  game_day_period: GameDayPeriod | null;
  is_complete: boolean;
  created_at: string;
}

export interface RecurringTask {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  default_time: string | null; // "HH:MM"
  category: TaskCategory;
  visibility: TaskVisibility;
  game_day_period: GameDayPeriod | null;
  is_enabled: boolean;
  created_at: string;
}

export interface RecurringTaskCompletion {
  recurring_task_id: number;
  completion_date: string; // "YYYY-MM-DD"
  is_complete: boolean;
  completed_at: string | null;
}

export interface InventoryItem {
  id: number;
  team_id: number;
  item_name: string;
  category: InventoryCategory;
  unit: string | null;
  current_stock: number;
  par_level: number;
  stock_status: StockStatus;
  price_per_unit: number | null; // decimal dollars
  purchase_link: string | null;
  notes: string | null;
  created_at: string;
}

export interface Meal {
  id: number;
  game_id: number;
  pre_game_snack: string | null;
  post_game_meal: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerPreference {
  player_id: number;
  preferred_name: string | null;
  other_details: string | null;
  updated_at: string;
}

export interface PlayerRestriction {
  player_id: number;
  restriction: string;
  is_custom: boolean;
  created_at: string;
}

export interface Contact {
  id: number;
  team_id: number;
  contact_name: string;
  contact_role: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  display_order: number;
  created_by: number | null;
  created_at: string;
}

export interface Conversation {
  id: string; // UUID
  type: ConversationType;
  name: string | null;
  created_by: number | null;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string; // UUID
  user_id: number;
  last_read_at: string | null;
  joined_at: string;
}

export interface Message {
  id: string; // UUID
  conversation_id: string; // UUID
  sender_id: number;
  content: string;
  created_at: string;
}

export interface Issue {
  id: number;
  player_id: number;
  player_team_id: number;
  team_context: "home" | "away";
  away_team_name: string | null;
  description: string;
  status: IssueStatus;
  gm_flagged: boolean;
  routed_to: string;
  routed_by: number | null;
  routed_at: string | null;
  created_at: string;
}

export interface IssueComment {
  id: number;
  issue_id: number;
  user_id: number | null;
  comment: string;
  created_at: string;
}
