import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type EpisodeEntry = {
  id: number;
  entry_time: string;
  severity: string | null;
  notes: string | null;
  created_at: string;
};

export type EpisodeEntryCreate = {
  entry_time?: string;
  severity?: string | null;
  notes?: string | null;
};

export type EpisodeEntryUpdate = {
  entry_time: string;
  severity?: string | null;
  notes?: string | null;
};

export async function getEpisodeEntries(): Promise<EpisodeEntry[]> {
  const response = await fetch(`${API_BASE_URL}/episode-entries`);

  if (!response.ok) {
    throw new Error("Could not load episode entries.");
  }

  return response.json();
}

export async function createEpisodeEntry(
  episodeEntry: EpisodeEntryCreate,
): Promise<EpisodeEntry> {
  const response = await fetch(`${API_BASE_URL}/episode-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(episodeEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create episode entry.");
  }

  return response.json();
}

export async function updateEpisodeEntry(
  episodeEntryId: number,
  episodeEntry: EpisodeEntryUpdate,
): Promise<EpisodeEntry> {
  const response = await fetch(
    `${API_BASE_URL}/episode-entries/${episodeEntryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(episodeEntry),
    },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not update episode entry.");
  }

  return response.json();
}

export async function deleteEpisodeEntry(
  episodeEntryId: number,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/episode-entries/${episodeEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete episode entry.");
  }
}
