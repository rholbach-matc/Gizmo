const API_BASE_URL = "http://127.0.0.1:8000";

export type Food = {
  id: number;
  name: string;
  brand: string | null;
  calories_per_gram: number;
  notes: string | null;
  created_at: string;
};

export type FoodCreate = {
  name: string;
  brand?: string | null;
  calories_per_gram: number;
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
