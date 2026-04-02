import type { TaskCategory, TaskVisibility, GameDayPeriod } from "@/lib/types";

// ── Questionnaire answer types ────────────────────────────────────────────────

export type LaundryMethod = "on_site" | "outsourced";
export type LaundryFrequency = "daily" | "every_other_day" | "weekly";
export type FoodPrepMethod = "in_house" | "vendor" | "both";
export type TeardownDuration = "under_30" | "30_to_60" | "over_60";

export interface Step1Answers {
  roster_size: number | null;
  has_home_clubhouse: boolean;
  has_visitor_clubhouse: boolean;
  laundry_method: LaundryMethod;
}

export interface Step2Answers {
  equipment: string[]; // "washers", "dryers", "dry_cleaning"
  uniform_frequency: LaundryFrequency;
  towel_frequency: LaundryFrequency;
}

export interface Step3Answers {
  food_prep: FoodPrepMethod | null;
  meals_provided: string[]; // "pre_game_snacks", "post_game_meals"
  has_coffee_station: boolean;
}

export interface Step4Answers {
  field_prep: string[]; // "bases_lines", "batting_cage", "bullpen"
  equipment_room: string[]; // "daily_org", "weekly_deep_clean"
}

export interface Step5Answers {
  responsible_aed: boolean;
  responsible_first_aid: boolean;
  training_room_coordination: boolean;
}

export interface Step6Answers {
  arrival_hours_before: number | null;
  teardown_duration: TeardownDuration | null;
  game_day_notes: string;
}

export interface KeyContact {
  label: string; // "Head Trainer", "Field Manager", "Visiting Clubhouse Contact"
  name: string;
  phone: string;
  email: string;
}

export interface Step7Answers {
  contacts: [KeyContact, KeyContact, KeyContact]; // fixed labels
}

export interface OnboardingAnswers {
  step1: Step1Answers;
  step2: Step2Answers;
  step3: Step3Answers;
  step4: Step4Answers;
  step5: Step5Answers;
  step6: Step6Answers;
  step7: Step7Answers;
  mode: "replace" | "merge";
}

// ── Generated task shape ──────────────────────────────────────────────────────

export interface GeneratedTask {
  title: string;
  description: string | null;
  category: TaskCategory;
  visibility: TaskVisibility;
  game_day_period: GameDayPeriod | null;
  default_time: string | null; // "HH:MM"
}

// ── Default answer values (used to initialize wizard state) ──────────────────

export function defaultAnswers(): OnboardingAnswers {
  return {
    step1: {
      roster_size: null,
      has_home_clubhouse: true,
      has_visitor_clubhouse: false,
      laundry_method: "on_site",
    },
    step2: {
      equipment: [],
      uniform_frequency: "daily",
      towel_frequency: "daily",
    },
    step3: {
      food_prep: null,
      meals_provided: [],
      has_coffee_station: false,
    },
    step4: {
      field_prep: [],
      equipment_room: [],
    },
    step5: {
      responsible_aed: false,
      responsible_first_aid: false,
      training_room_coordination: false,
    },
    step6: {
      arrival_hours_before: null,
      teardown_duration: null,
      game_day_notes: "",
    },
    step7: {
      contacts: [
        { label: "Head Trainer", name: "", phone: "", email: "" },
        { label: "Field Manager", name: "", phone: "", email: "" },
        { label: "Visiting Clubhouse Contact", name: "", phone: "", email: "" },
      ],
    },
    mode: "replace",
  };
}

// ── Stub task generator ───────────────────────────────────────────────────────

export function generateTasksStub(answers: OnboardingAnswers): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const outsourced = answers.step1.laundry_method === "outsourced";

  // ── Sanitation (always) ──
  tasks.push({
    title: "Clean and sanitize clubhouse floor",
    description: "Sweep and mop the entire clubhouse floor.",
    category: "sanitation",
    visibility: "game_day",
    game_day_period: "post_game",
    default_time: "23:00",
  });
  tasks.push({
    title: "Wipe down counters and surfaces",
    description: "Sanitize all counter tops, benches, and lockers.",
    category: "sanitation",
    visibility: "game_day",
    game_day_period: "pre_game",
    default_time: "12:00",
  });
  tasks.push({
    title: "Empty trash cans",
    description: "Empty and reline all trash cans in the clubhouse.",
    category: "sanitation",
    visibility: "all",
    game_day_period: null,
    default_time: "08:00",
  });

  // ── Laundry ──
  if (outsourced) {
    tasks.push({
      title: "Prepare laundry for pickup",
      description: "Bag and label all uniforms and towels for the dry cleaning service.",
      category: "laundry",
      visibility: "game_day",
      game_day_period: "post_game",
      default_time: "22:00",
    });
    tasks.push({
      title: "Receive laundry delivery",
      description: "Check in returned laundry and distribute to lockers.",
      category: "laundry",
      visibility: "game_day",
      game_day_period: "morning",
      default_time: "10:00",
    });
  } else {
    tasks.push({
      title: "Start uniform wash cycle",
      description: "Load uniforms into the washer after the game.",
      category: "laundry",
      visibility: "game_day",
      game_day_period: "post_game",
      default_time: "22:00",
    });
    tasks.push({
      title: "Move uniforms to dryer",
      description: "Transfer washed uniforms to the dryer.",
      category: "laundry",
      visibility: "game_day",
      game_day_period: "post_game",
      default_time: "23:00",
    });
    tasks.push({
      title: "Fold and distribute uniforms",
      description: "Fold dried uniforms and place in each player's locker.",
      category: "laundry",
      visibility: "game_day",
      game_day_period: "morning",
      default_time: "10:00",
    });
    tasks.push({
      title: "Wash towels",
      description: "Run a full towel wash and dry cycle.",
      category: "laundry",
      visibility: "off_day",
      game_day_period: null,
      default_time: "09:00",
    });
  }

  // ── Food ──
  if (answers.step3.food_prep !== null) {
    if (answers.step3.meals_provided.includes("pre_game_snacks")) {
      tasks.push({
        title: "Set up pre-game snack spread",
        description: "Lay out snacks, fruit, and beverages in the clubhouse before gates open.",
        category: "food",
        visibility: "game_day",
        game_day_period: "pre_game",
        default_time: "14:00",
      });
    }
    if (answers.step3.meals_provided.includes("post_game_meals")) {
      tasks.push({
        title: "Order/prepare post-game meal",
        description: "Coordinate post-game meal delivery or begin in-house preparation.",
        category: "food",
        visibility: "game_day",
        game_day_period: "pre_game",
        default_time: "16:00",
      });
      tasks.push({
        title: "Set up post-game meal spread",
        description: "Lay out post-game meal for players after the final out.",
        category: "food",
        visibility: "game_day",
        game_day_period: "post_game",
        default_time: "21:30",
      });
    }
    if (answers.step3.has_coffee_station) {
      tasks.push({
        title: "Restock coffee station",
        description: "Refill coffee, creamer, sugar, and cups.",
        category: "food",
        visibility: "all",
        game_day_period: null,
        default_time: "07:30",
      });
    }
  }

  // ── Equipment ──
  if (answers.step4.equipment_room.includes("daily_org")) {
    tasks.push({
      title: "Organize equipment room",
      description: "Ensure bats, helmets, and gear are stored properly.",
      category: "equipment",
      visibility: "game_day",
      game_day_period: "morning",
      default_time: "11:00",
    });
  }
  if (answers.step4.equipment_room.includes("weekly_deep_clean")) {
    tasks.push({
      title: "Deep clean equipment room",
      description: "Full cleaning and inventory check of all equipment.",
      category: "equipment",
      visibility: "off_day",
      game_day_period: null,
      default_time: "09:00",
    });
  }

  // ── Field ──
  if (answers.step4.field_prep.includes("bases_lines")) {
    tasks.push({
      title: "Set bases and chalk foul lines",
      description: "Install bases and chalk all foul lines before batting practice.",
      category: "field",
      visibility: "game_day",
      game_day_period: "morning",
      default_time: "12:00",
    });
  }
  if (answers.step4.field_prep.includes("batting_cage")) {
    tasks.push({
      title: "Set up batting cage",
      description: "Inspect and set up the batting cage net and equipment before BP.",
      category: "field",
      visibility: "game_day",
      game_day_period: "morning",
      default_time: "11:30",
    });
  }

  // ── Medical ──
  if (answers.step5.responsible_aed) {
    tasks.push({
      title: "Check AED battery and readiness",
      description: "Verify the AED has a green indicator light and is accessible.",
      category: "medical",
      visibility: "off_day",
      game_day_period: null,
      default_time: "08:00",
    });
  }
  if (answers.step5.responsible_first_aid) {
    tasks.push({
      title: "Restock first aid kit",
      description: "Check first aid supplies and reorder anything low or expired.",
      category: "medical",
      visibility: "off_day",
      game_day_period: null,
      default_time: "08:30",
    });
  }

  // ── Admin (always) ──
  tasks.push({
    title: "Review day's schedule and notes",
    description: "Check the day's game time, roster moves, and any clubhouse notes.",
    category: "admin",
    visibility: "all",
    game_day_period: null,
    default_time: "07:00",
  });

  // ── General (always) ──
  tasks.push({
    title: "Stock player lounge",
    description: "Ensure the lounge area is clean and stocked with beverages and snacks.",
    category: "general",
    visibility: "game_day",
    game_day_period: "morning",
    default_time: "11:00",
  });

  return tasks;
}
