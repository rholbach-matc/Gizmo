import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type FoodEntry = {
  id: number;
  entry_time: string;
  bowl_id: number;
  food_id: number;
  food_name: string;
  starting_total_weight_grams: number;
  ending_total_weight_grams: number | null;
  starting_food_weight_grams: number;
  leftover_food_weight_grams: number | null;
  food_eaten_grams: number | null;
  calories_eaten: number | null;
  protein_consumed_grams: number | null;
  fat_consumed_grams: number | null;
  phosphorus_consumed_mg: number | null;
  sodium_consumed_mg: number | null;
  moisture_consumed_grams: number | null;
  dry_matter_consumed_grams: number | null;
  notes: string | null;
  created_at: string;
  is_open: boolean;
};

export type FoodEntryCreate = {
  entry_time?: string;
  bowl_id: number;
  food_id: number;
  starting_total_weight_grams: number;
  ending_total_weight_grams?: number;
  notes?: string | null;
};

export type FoodEntryFinish = {
  ending_total_weight_grams: number;
  notes?: string | null;
};

export type FoodEntryUpdate = {
  entry_time: string;
  starting_total_weight_grams: number;
  ending_total_weight_grams?: number | null;
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
    throw await responseError(response, "Could not create food entry.");
  }

  return response.json();
}

export async function deleteFoodEntry(foodEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/food-entries/${foodEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not delete food entry.");
  }
}

export async function updateFoodEntry(
  foodEntryId: number,
  foodEntry: FoodEntryUpdate,
): Promise<FoodEntry> {
  const response = await fetch(`${API_BASE_URL}/food-entries/${foodEntryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(foodEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not update food entry.");
  }

  return response.json();
}

export async function finishFoodEntry(
  foodEntryId: number,
  foodEntry: FoodEntryFinish,
): Promise<FoodEntry> {
  const response = await fetch(`${API_BASE_URL}/food-entries/${foodEntryId}/finish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(foodEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not finish food entry.");
  }

  return response.json();
}
