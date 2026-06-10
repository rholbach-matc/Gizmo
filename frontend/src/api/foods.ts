import { API_BASE_URL } from "./config";

export type Food = {
  id: number;
  name: string;
  brand: string | null;
  can_size_grams: number;
  calories_per_can: number;
  calories_per_gram: number;
  moisture_percent: number;
  dry_matter_percent: number;
  protein_as_fed_percent: number;
  protein_dry_matter_percent: number;
  fat_as_fed_percent: number;
  fat_dry_matter_percent: number;
  phosphorus_as_fed_percent: number;
  phosphorus_dry_matter_percent: number;
  sodium_as_fed_percent: number;
  sodium_dry_matter_percent: number;
  notes: string | null;
  created_at: string;
};

export type FoodCreate = {
  name: string;
  brand?: string | null;
  can_size_grams: number;
  calories_per_can: number;
  moisture_percent: number;
  protein_as_fed_percent: number;
  fat_as_fed_percent: number;
  phosphorus_as_fed_percent: number;
  sodium_as_fed_percent: number;
  notes?: string | null;
};

export async function getFoods(): Promise<Food[]> {
  const response = await fetch(`${API_BASE_URL}/foods`);

  if (!response.ok) {
    throw new Error("Could not load foods.");
  }

  return response.json();
}

export async function createFood(food: FoodCreate): Promise<Food> {
  const response = await fetch(`${API_BASE_URL}/foods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(food),
  });

  if (!response.ok) {
    throw new Error("Could not create food.");
  }

  return response.json();
}

export async function deleteFood(foodId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/foods/${foodId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete food.");
  }
}
