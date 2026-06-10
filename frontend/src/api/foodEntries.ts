import { API_BASE_URL } from "./config";

export type FoodEntry = {
  id: number;
  entry_time: string;
  bowl_id: number;
  food_id: number;
  starting_total_weight_grams: number;
  ending_total_weight_grams: number;
  starting_food_weight_grams: number;
  leftover_food_weight_grams: number;
  food_eaten_grams: number;
  calories_eaten: number;
  protein_consumed_grams: number;
  fat_consumed_grams: number;
  phosphorus_consumed_mg: number;
  sodium_consumed_mg: number;
  moisture_consumed_grams: number;
  dry_matter_consumed_grams: number;
  notes: string | null;
  created_at: string;
};

export type FoodEntryCreate = {
  entry_time?: string;
  bowl_id: number;
  food_id: number;
  starting_total_weight_grams: number;
  ending_total_weight_grams: number;
  notes?: string | null;
};

export async function getFoodEntries(): Promise<FoodEntry[]> {
  const response = await fetch(`${API_BASE_URL}/food-entries`);

  if (!response.ok) {
    throw new Error("Could not load food entries.");
  }

  return response.json();
}

export async function createFoodEntry(
  foodEntry: FoodEntryCreate,
): Promise<FoodEntry> {
  const response = await fetch(`${API_BASE_URL}/food-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(foodEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create food entry.");
  }

  return response.json();
}

export async function deleteFoodEntry(foodEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/food-entries/${foodEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete food entry.");
  }
}
