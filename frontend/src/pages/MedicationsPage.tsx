import { FormEvent, useEffect, useState } from "react";

import {
  Medication,
  MedicationEntry,
  createMedicationEntry,
  deleteMedicationEntry,
  getMedicationEntries,
  getMedications,
  updateMedicationEntry,
} from "../api/medicationEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

type MedicationEntryEditForm = {
  entryTime: string;
  medicationId: string;
  dose: string;
  notes: string;
};

function medicationEntryEditForm(entry: MedicationEntry): MedicationEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    medicationId: entry.medication_id?.toString() ?? "",
    dose: entry.dose ?? "",
    notes: entry.notes ?? "",
  };
}

function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationEntries, setMedicationEntries] = useState<MedicationEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MedicationEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadMedicationData() {
    try {
      setIsLoading(true);
      setError(null);
      const [loadedMedications, loadedMedicationEntries] = await Promise.all([
        getMedications(),
        getMedicationEntries(),
      ]);
      setMedications(loadedMedications);
      setMedicationEntries(sortByEntryTimeDescending(loadedMedicationEntries));
      setMedicationId(loadedMedications[0]?.id.toString() ?? "");
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
    loadMedicationData();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: MedicationEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(medicationEntryEditForm(entry));
  }

  function updateEditForm(field: keyof MedicationEntryEditForm, value: string) {
    setEditForm((currentForm) =>
      currentForm ? { ...currentForm, [field]: value } : currentForm,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const newMedicationEntry = await createMedicationEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        medication_id: Number(medicationId),
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
      setMedicationId(medications[0]?.id.toString() ?? "");
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

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: MedicationEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateMedicationEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        medication_id: Number(editForm.medicationId),
        dose: editForm.dose.trim() || null,
        notes: editForm.notes.trim() || null,
      });

      setMedicationEntries((currentMedicationEntries) =>
        sortByEntryTimeDescending(
          currentMedicationEntries.map((currentEntry) =>
            currentEntry.id === entry.id ? updatedEntry : currentEntry,
          ),
        ),
      );
      setEditingEntryId(null);
      setEditForm(null);
      showSuccessMessage();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update medication entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(medicationEntryId: number) {
    if (!window.confirm("Delete this medication entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteMedicationEntry(medicationEntryId);
      setMedicationEntries((currentMedicationEntries) =>
        currentMedicationEntries.filter((entry) => entry.id !== medicationEntryId),
      );
      if (editingEntryId === medicationEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
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
            Medication
            <select
              required
              value={medicationId}
              onChange={(event) => setMedicationId(event.target.value)}
              disabled={medications.length === 0}
            >
              <option value="" disabled>
                Select medication
              </option>
              {medications.map((medication) => (
                <option value={medication.id} key={medication.id}>
                  {medication.name}
                </option>
              ))}
            </select>
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

          {medications.length === 0 ? (
            <p className="empty-state">
              No medications available. Add a medication before logging doses.
            </p>
          ) : null}

          <button type="submit" disabled={isSaving || medications.length === 0}>
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
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

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

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      Medication
                      <select
                        required
                        value={editForm.medicationId}
                        onChange={(event) =>
                          updateEditForm("medicationId", event.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select medication
                        </option>
                        {medications.map((medication) => (
                          <option value={medication.id} key={medication.id}>
                            {medication.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Date and Time
                      <input
                        required
                        type="datetime-local"
                        value={editForm.entryTime}
                        onChange={(event) =>
                          updateEditForm("entryTime", event.target.value)
                        }
                      />
                    </label>

                    <label>
                      Dose
                      <input
                        type="text"
                        value={editForm.dose}
                        onChange={(event) => updateEditForm("dose", event.target.value)}
                      />
                    </label>

                    <label className="edit-entry-form-wide">
                      Notes
                      <textarea
                        value={editForm.notes}
                        onChange={(event) => updateEditForm("notes", event.target.value)}
                      />
                    </label>

                    <div className="entry-actions">
                      <button type="submit" disabled={savingEditEntryId === entry.id}>
                        {savingEditEntryId === entry.id ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => {
                          setEditingEntryId(null);
                          setEditForm(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="entry-actions">
                  <button type="button" onClick={() => startEditing(entry)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(entry.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default MedicationsPage;
