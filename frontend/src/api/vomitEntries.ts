import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type VomitSeverity = "mild" | "moderate" | "severe";

export type VomitEntry = {
  id: number;
  entry_time: string;
  severity: VomitSeverity;
  notes: string | null;
  created_at: string;
};

export type VomitEntryCreate = {
  entry_time?: string;
  severity: VomitSeverity;
  notes?: string | null;
};

export type VomitEntryUpdate = {
  entry_time: string;
  severity: VomitSeverity;
  notes?: string | null;
};

export async function getVomitEntries(): Promise<VomitEntry[]> {
  const response = await fetch(`${API_BASE_URL}/vomit-entries`);

  if (!response.ok) {
    throw new Error("Could not load vomit entries.");
  }

  return response.json();
}

export async function createVomitEntry(
  vomitEntry: VomitEntryCreate,
): Promise<VomitEntry> {
  const response = await fetch(`${API_BASE_URL}/vomit-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vomitEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not create vomit entry.");
  }

  return response.json();
}

export async function updateVomitEntry(
  vomitEntryId: number,
  vomitEntry: VomitEntryUpdate,
): Promise<VomitEntry> {
  const response = await fetch(`${API_BASE_URL}/vomit-entries/${vomitEntryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vomitEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not update vomit entry.");
  }

  return response.json();
}

export async function deleteVomitEntry(vomitEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/vomit-entries/${vomitEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete vomit entry.");
  }
}
