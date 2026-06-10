import { API_BASE_URL } from "./config";

export type Bowl = {
  id: number;
  name: string;
  empty_weight_grams: number;
  color: string | null;
  notes: string | null;
  created_at: string;
};

export type BowlCreate = {
  name: string;
  empty_weight_grams: number;
  color?: string | null;
  notes?: string | null;
};

export async function getBowls(): Promise<Bowl[]> {
  const response = await fetch(`${API_BASE_URL}/bowls`);

  if (!response.ok) {
    throw new Error("Could not load bowls.");
  }

  return response.json();
}

export async function createBowl(bowl: BowlCreate): Promise<Bowl> {
  const response = await fetch(`${API_BASE_URL}/bowls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bowl),
  });

  if (!response.ok) {
    throw new Error("Could not create bowl.");
  }

  return response.json();
}

export async function deleteBowl(bowlId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/bowls/${bowlId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete bowl.");
  }
}
