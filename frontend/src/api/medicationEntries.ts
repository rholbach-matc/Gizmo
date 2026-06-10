import { API_BASE_URL } from "./config";

export type MedicationEntry = {
  id: number;
  entry_time: string;
  medication_name: string;
  dose: string | null;
  notes: string | null;
  created_at: string;
};

export type MedicationEntryCreate = {
  entry_time?: string;
  medication_name: string;
  dose?: string | null;
  notes?: string | null;
};

export async function getMedicationEntries(): Promise<MedicationEntry[]> {
  const response = await fetch(`${API_BASE_URL}/medication-entries`);

  if (!response.ok) {
    throw new Error("Could not load medication entries.");
  }

  return response.json();
}

export async function createMedicationEntry(
  medicationEntry: MedicationEntryCreate,
): Promise<MedicationEntry> {
  const response = await fetch(`${API_BASE_URL}/medication-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medicationEntry),
  });

  if (!response.ok) {
    throw new Error("Could not create medication entry.");
  }

  return response.json();
}

export async function deleteMedicationEntry(
  medicationEntryId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/medication-entries/${medicationEntryId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Could not delete medication entry.");
  }
}
