import { API_BASE_URL } from "./config";

export type BMEntry = {
  id: number;
  entry_time: string;
  occurred: boolean;
  notes: string | null;
  created_at: string;
};

export type BMEntryCreate = {
  occurred: boolean;
  notes?: string | null;
};

export async function getBMEntries(): Promise<BMEntry[]> {
  const response = await fetch(`${API_BASE_URL}/bm-entries`);

  if (!response.ok) {
    throw new Error("Could not load BM entries.");
  }

  return response.json();
}

export async function createBMEntry(
  bmEntry: BMEntryCreate,
): Promise<BMEntry> {
  const response = await fetch(`${API_BASE_URL}/bm-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bmEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create BM entry.");
  }

  return response.json();
}

export async function deleteBMEntry(bmEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/bm-entries/${bmEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete BM entry.");
  }
}
