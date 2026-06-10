import { API_BASE_URL } from "./config";

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
};

export async function getTodayDashboard(): Promise<TodayDashboard> {
  const response = await fetch(`${API_BASE_URL}/dashboard/today`);

  if (!response.ok) {
    throw new Error("Could not load today's dashboard.");
  }

  return response.json();
}
