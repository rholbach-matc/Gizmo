import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

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

export type WeightEntryUpdate = {
  entry_time: string;
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
    throw await responseError(response, "Could not create weight entry.");
  }

  return response.json();
}

export async function updateWeightEntry(
  weightEntryId: number,
  weightEntry: WeightEntryUpdate,
): Promise<WeightEntry> {
  const response = await fetch(`${API_BASE_URL}/weight-entries/${weightEntryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(weightEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not update weight entry.");
  }

  return response.json();
}

export async function deleteWeightEntry(weightEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/weight-entries/${weightEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await responseError(response, "Could not delete weight entry.");
  }
}
