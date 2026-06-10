import { API_BASE_URL } from "./config";

export type DashboardFoodEntry = {
  id: number;
  entry_time: string;
  food_eaten_grams: number;
  calories_eaten: number;
  phosphorus_consumed_mg: number;
  sodium_consumed_mg: number;
  notes: string | null;
  created_at: string;
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
  notes: string | null;
  created_at: string;
};

export type DashboardActivityItem = {
  type: "food" | "bm" | "fluids" | "weight" | "water";
  entry_time: string;
  title: string;
  summary: string;
};

export type TodayDashboard = {
  date: string;
  feedings_count: number;
  food_eaten_grams: number;
  calories_eaten: number;
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
  today_water_observation_count: number;
  recent_activity: DashboardActivityItem[];
};

export async function getTodayDashboard(): Promise<TodayDashboard> {
  const response = await fetch(`${API_BASE_URL}/dashboard/today`);

  if (!response.ok) {
    throw new Error("Could not load today's dashboard.");
  }

  return response.json();
}
