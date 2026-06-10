import { API_BASE_URL } from "./config";

export type WeightEntry = {
  id: number;
  entry_time: string;
  weight_lbs: number;
  notes: string | null;
  created_at: string;
};

export type WeightEntryCreate = {
  entry_time?: string;
  weight_lbs: number;
  notes?: string | null;
};

export async function getWeightEntries(): Promise<WeightEntry[]> {
  const response = await fetch(`${API_BASE_URL}/weight-entries`);

  if (!response.ok) {
    throw new Error("Could not load weight entries.");
  }

  return response.json();
}

export async function createWeightEntry(
  weightEntry: WeightEntryCreate,
): Promise<WeightEntry> {
  const response = await fetch(`${API_BASE_URL}/weight-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(weightEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create weight entry.");
  }

  return response.json();
}

export async function deleteWeightEntry(weightEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/weight-entries/${weightEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete weight entry.");
  }
}
