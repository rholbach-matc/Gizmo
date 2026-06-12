import { API_BASE_URL } from "./config";

export type DashboardFoodEntry = {
  id: number;
  entry_time: string;
  food_eaten_grams: number | null;
  calories_eaten: number | null;
  phosphorus_consumed_mg: number | null;
  sodium_consumed_mg: number | null;
  notes: string | null;
  created_at: string;
  is_open: boolean;
};

export type DashboardBMEntry = {
  id: number;
  entry_time: string;
  occurred: boolean;
  notes: string | null;
  created_at: string;
};

export type DashboardFluidEntry = {
  id: number;
  entry_time: string;
  amount_ml: number;
  notes: string | null;
  created_at: string;
};

export type DashboardWeightEntry = {
  id: number;
  entry_time: string;
  weight_lbs: number;
  notes: string | null;
  created_at: string;
};

export type DashboardWaterEntry = {
  id: number;
  entry_time: string;
  observation_type: string;
  bowl_id: number | null;
  notes: string | null;
  created_at: string;
};

export type DashboardEpisodeEntry = {
  id: number;
  entry_time: string;
  severity: string | null;
  notes: string | null;
  created_at: string;
};

export type DashboardMedicationEntry = {
  id: number;
  entry_time: string;
  medication_id: number | null;
  medication_name: string;
  dose: string | null;
  notes: string | null;
  created_at: string;
};

export type DashboardVetVisitEntry = {
  id: number;
  entry_time: string;
  reason: string | null;
  summary: string | null;
  follow_up_needed: boolean | null;
  notes: string | null;
  created_at: string;
};

export type DashboardActivityItem = {
  type:
    | "food"
    | "bm"
    | "fluids"
    | "weight"
    | "water"
    | "episode"
    | "vomit"
    | "medication"
    | "vet_visit";
  entry_time: string;
  title: string;
  summary: string;
  details: string | null;
};

export type TodayDashboard = {
  date: string;
  feedings_count: number;
  open_feedings_count: number;
  food_eaten_grams: number;
  calories_eaten: number;
  yesterday_calories_eaten: number | null;
  protein_consumed_grams: number;
  fat_consumed_grams: number;
  phosphorus_consumed_mg: number;
  sodium_consumed_mg: number;
  moisture_consumed_grams: number;
  dry_matter_consumed_grams: number;
  last_food_entry: DashboardFoodEntry | null;
  last_bm_entry: DashboardBMEntry | null;
  last_fluid_entry: DashboardFluidEntry | null;
  latest_weight_entry: DashboardWeightEntry | null;
  last_water_entry: DashboardWaterEntry | null;
  latest_episode_entry: DashboardEpisodeEntry | null;
  latest_medication_entry: DashboardMedicationEntry | null;
  latest_vet_visit_entry: DashboardVetVisitEntry | null;
  today_water_observation_count: number;
  today_bm_count: number;
  today_fluid_count: number;
  today_medication_count: number;
  today_episode_count: number;
  recent_activity: DashboardActivityItem[];
};

export type DayDashboard = {
  date: string;
  calories_eaten: number;
  feedings_count: number;
  bm_count: number;
  water_observation_count: number;
  episode_count: number;
  medication_count: number;
  fluids_given: boolean;
  latest_weight_entry: DashboardWeightEntry | null;
  activity: DashboardActivityItem[];
};

export async function getTodayDashboard(): Promise<TodayDashboard> {
  const response = await fetch(`${API_BASE_URL}/dashboard/today`);

  if (!response.ok) {
    throw new Error("Could not load today's dashboard.");
  }

  return response.json();
}

export async function getDayDashboard(date: string): Promise<DayDashboard> {
  const response = await fetch(`${API_BASE_URL}/dashboard/day/${date}`);

  if (!response.ok) {
    throw new Error("Could not load historical dashboard.");
  }

  return response.json();
}
