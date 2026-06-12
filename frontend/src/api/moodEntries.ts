import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type MoodEntry = {
  id: number;
  entry_time: string;
  mood_rating: number | null;
  appetite_rating: number | null;
  energy_rating: number | null;
  social_rating: number | null;
  yowling_rating: number | null;
  notes: string | null;
  created_at: string;
};

export type MoodEntryCreate = {
  entry_time?: string;
  mood_rating?: number | null;
  appetite_rating?: number | null;
  energy_rating?: number | null;
  social_rating?: number | null;
  yowling_rating?: number | null;
  notes?: string | null;
};

export type MoodEntryUpdate = {
  entry_time: string;
  mood_rating?: number | null;
  appetite_rating?: number | null;
  energy_rating?: number | null;
  social_rating?: number | null;
  yowling_rating?: number | null;
  notes?: string | null;
};

export async function getMoodEntries(): Promise<MoodEntry[]> {
  const response = await fetch(`${API_BASE_URL}/mood-entries`);

  if (!response.ok) {
    throw new Error("Could not load mood entries.");
  }

  return response.json();
}

export async function createMoodEntry(
  moodEntry: MoodEntryCreate,
): Promise<MoodEntry> {
  const response = await fetch(`${API_BASE_URL}/mood-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(moodEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not create mood entry.");
  }

  return response.json();
}

export async function updateMoodEntry(
  moodEntryId: number,
  moodEntry: MoodEntryUpdate,
): Promise<MoodEntry> {
  const response = await fetch(`${API_BASE_URL}/mood-entries/${moodEntryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(moodEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not update mood entry.");
  }

  return response.json();
}

export async function deleteMoodEntry(moodEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/mood-entries/${moodEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete mood entry.");
  }
}
