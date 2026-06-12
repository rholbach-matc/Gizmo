import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type FluidEntry = {
  id: number;
  entry_time: string;
  amount_ml: number;
  notes: string | null;
  created_at: string;
};

export type FluidEntryCreate = {
  entry_time?: string;
  amount_ml: number;
  notes?: string | null;
};

export type FluidEntryUpdate = {
  entry_time: string;
  amount_ml: number;
  notes?: string | null;
};

export async function getFluidEntries(): Promise<FluidEntry[]> {
  const response = await fetch(`${API_BASE_URL}/fluid-entries`);

  if (!response.ok) {
    throw new Error("Could not load fluid entries.");
  }

  return response.json();
}

export async function createFluidEntry(
  fluidEntry: FluidEntryCreate,
): Promise<FluidEntry> {
  const response = await fetch(`${API_BASE_URL}/fluid-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fluidEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create fluid entry.");
  }

  return response.json();
}

export async function updateFluidEntry(
  fluidEntryId: number,
  fluidEntry: FluidEntryUpdate,
): Promise<FluidEntry> {
  const response = await fetch(`${API_BASE_URL}/fluid-entries/${fluidEntryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fluidEntry),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not update fluid entry.");
  }

  return response.json();
}

export async function deleteFluidEntry(fluidEntryId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/fluid-entries/${fluidEntryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Could not delete fluid entry.");
  }
}
