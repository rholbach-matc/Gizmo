import { API_BASE_URL } from "./config";

export type DrinkingWaterEntry = {
  id: number;
  entry_time: string;
  notes: string | null;
  created_at: string;
};

export type DrinkingWaterEntryCreate = {
  entry_time?: string;
  notes?: string | null;
};

export async function getWaterEntries(): Promise<DrinkingWaterEntry[]> {
  const response = await fetch(`${API_BASE_URL}/water-entries`);

  if (!response.ok) {
    throw new Error("Could not load water entries.");
  }

  return response.json();
}

export async function createWaterEntry(
  waterEntry: DrinkingWaterEntryCreate,
): Promise<DrinkingWaterEntry> {
  const response = await fetch(`${API_BASE_URL}/water-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(waterEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create water entry.");
  }

  return response.json();
}

export async function deleteWaterEntry(waterEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/water-entries/${waterEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete water entry.");
  }
}
