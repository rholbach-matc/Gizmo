import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type VetVisitEntry = {
  id: number;
  entry_time: string;
  reason: string | null;
  summary: string | null;
  follow_up_needed: boolean | null;
  notes: string | null;
  created_at: string;
};

export type VetVisitEntryCreate = {
  entry_time?: string;
  reason?: string | null;
  summary?: string | null;
  follow_up_needed?: boolean | null;
  notes?: string | null;
};

export type VetVisitEntryUpdate = {
  entry_time: string;
  reason?: string | null;
  summary?: string | null;
  follow_up_needed?: boolean | null;
  notes?: string | null;
};

export async function getVetVisitEntries(): Promise<VetVisitEntry[]> {
  const response = await fetch(`${API_BASE_URL}/vet-visit-entries`);

  if (!response.ok) {
    throw new Error("Could not load vet visit entries.");
  }

  return response.json();
}

export async function createVetVisitEntry(
  vetVisitEntry: VetVisitEntryCreate,
): Promise<VetVisitEntry> {
  const response = await fetch(`${API_BASE_URL}/vet-visit-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vetVisitEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create vet visit entry.");
  }

  return response.json();
}

export async function updateVetVisitEntry(
  vetVisitEntryId: number,
  vetVisitEntry: VetVisitEntryUpdate,
): Promise<VetVisitEntry> {
  const response = await fetch(
    `${API_BASE_URL}/vet-visit-entries/${vetVisitEntryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vetVisitEntry),
    },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not update vet visit entry.");
  }

  return response.json();
}

export async function deleteVetVisitEntry(
  vetVisitEntryId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/vet-visit-entries/${vetVisitEntryId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Could not delete vet visit entry.");
  }
}
