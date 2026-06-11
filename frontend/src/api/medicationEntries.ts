import { API_BASE_URL } from "./config";
import { responseError } from "./errors";

export type Medication = {
  id: number;
  name: string;
  notes: string | null;
  created_at: string;
};

export type MedicationEntry = {
  id: number;
  entry_time: string;
  medication_id: number | null;
  medication_name: string;
  dose: string | null;
  notes: string | null;
  created_at: string;
};

export type MedicationEntryCreate = {
  entry_time?: string;
  medication_id: number;
  dose?: string | null;
  notes?: string | null;
};

export type MedicationEntryUpdate = {
  entry_time: string;
  medication_id: number;
  dose?: string | null;
  notes?: string | null;
};

export type MedicationCreate = {
  name: string;
  notes?: string | null;
};

export async function getMedications(): Promise<Medication[]> {
  const response = await fetch(`${API_BASE_URL}/medication-entries/medications`);

  if (!response.ok) {
    throw new Error("Could not load medications.");
  }

  return response.json();
}

export async function createMedication(
  medication: MedicationCreate,
): Promise<Medication> {
  const response = await fetch(`${API_BASE_URL}/medication-entries/medications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medication),
  });

  if (!response.ok) {
    throw await responseError(response, "Could not create medication.");
  }

  return response.json();
}

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

export async function updateMedicationEntry(
  medicationEntryId: number,
  medicationEntry: MedicationEntryUpdate,
): Promise<MedicationEntry> {
  const response = await fetch(
    `${API_BASE_URL}/medication-entries/${medicationEntryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(medicationEntry),
    },
  );

  if (!response.ok) {
    throw await responseError(response, "Could not update medication entry.");
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
