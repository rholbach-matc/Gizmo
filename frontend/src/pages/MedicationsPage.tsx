import { FormEvent, useEffect, useState } from "react";

import {
  MedicationEntry,
  createMedicationEntry,
  deleteMedicationEntry,
  getMedicationEntries,
} from "../api/medicationEntries";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function MedicationsPage() {
  const [medicationEntries, setMedicationEntries] = useState<MedicationEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMedicationEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedMedicationEntries = await getMedicationEntries();
      setMedicationEntries(sortByEntryTimeDescending(loadedMedicationEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load medication entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMedicationEntries();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const newMedicationEntry = await createMedicationEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        medication_name: medicationName.trim(),
        dose: dose.trim() || null,
        notes: notes.trim() || null,
      });

      setMedicationEntries((currentMedicationEntries) =>
        sortByEntryTimeDescending([
          newMedicationEntry,
          ...currentMedicationEntries,
        ]),
      );
      setEntryTime("");
      setMedicationName("");
      setDose("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create medication entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(medicationEntryId: number) {
    if (!window.confirm("Delete this medication entry?")) {
      return;
    }

    try {
      setError(null);
      await deleteMedicationEntry(medicationEntryId);
      setMedicationEntries((currentMedicationEntries) =>
        currentMedicationEntries.filter((entry) => entry.id !== medicationEntryId),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete medication entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Medications</h1>
        <p>Record medication administrations and review recent notes.</p>
      </section>

      <section className="content-grid" aria-label="Medication entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Log Medication</h2>

          <label>
            Date and Time (optional)
            <input
              type="datetime-local"
              value={entryTime}
              onChange={(event) => setEntryTime(event.target.value)}
            />
          </label>

          <label>
            Medication Name
            <input
              required
              type="text"
              value={medicationName}
              onChange={(event) => setMedicationName(event.target.value)}
              placeholder="Medication name"
            />
          </label>

          <label>
            Dose
            <input
              type="text"
              value={dose}
              onChange={(event) => setDose(event.target.value)}
              placeholder="Dose given"
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Administration notes or response"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Medication"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Medications</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{medicationEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          {!isLoading && medicationEntries.length === 0 ? (
            <p className="empty-state">No medications saved yet.</p>
          ) : null}

          <div className="entry-list">
            {medicationEntries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{entry.medication_name}</p>
                </div>

                {entry.dose ? <p>{entry.dose}</p> : null}
                {entry.notes ? <p>{entry.notes}</p> : null}

                <button type="button" onClick={() => handleDelete(entry.id)}>
                  Delete
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default MedicationsPage;
