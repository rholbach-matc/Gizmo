import { FormEvent, useEffect, useState } from "react";

import {
  WeightEntry,
  createWeightEntry,
  deleteWeightEntry,
  getWeightEntries,
  updateWeightEntry,
} from "../api/weightEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

type WeightEntryEditForm = {
  entryTime: string;
  weightLbs: string;
  notes: string;
};

function weightEntryEditForm(entry: WeightEntry): WeightEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    weightLbs: entry.weight_lbs.toString(),
    notes: entry.notes ?? "",
  };
}

function WeightTrackerPage() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightLbs, setWeightLbs] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<WeightEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadWeightEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedWeightEntries = await getWeightEntries();
      setWeightEntries(sortByEntryTimeDescending(loadedWeightEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load weight entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWeightEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: WeightEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(weightEntryEditForm(entry));
  }

  function updateEditForm(field: keyof WeightEntryEditForm, value: string) {
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

      const newWeightEntry = await createWeightEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        weight_lbs: Number(weightLbs),
        notes: notes.trim() || null,
      });

      setWeightEntries((currentWeightEntries) =>
        sortByEntryTimeDescending([newWeightEntry, ...currentWeightEntries]),
      );
      setWeightLbs("");
      setEntryTime("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create weight entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: WeightEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateWeightEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        weight_lbs: Number(editForm.weightLbs),
        notes: editForm.notes.trim() || null,
      });

      setWeightEntries((currentWeightEntries) =>
        sortByEntryTimeDescending(
          currentWeightEntries.map((currentEntry) =>
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
          : "Could not update weight entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(weightEntryId: number) {
    if (!window.confirm("Delete this weight entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteWeightEntry(weightEntryId);
      setWeightEntries((currentWeightEntries) =>
        currentWeightEntries.filter((entry) => entry.id !== weightEntryId),
      );
      if (editingEntryId === weightEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete weight entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Weight Tracker</h1>
      </section>

      <section className="content-grid" aria-label="Weight entry management">
        <form className="panel weight-form" onSubmit={handleSubmit}>
          <h2>Log Weight Entry</h2>

          <label>
            Weight lbs
            <input
              min="0"
              step="0.01"
              type="number"
              value={weightLbs}
              onChange={(event) => setWeightLbs(event.target.value)}
              required
            />
          </label>

          <label>
            Date and Time (optional)
            <input
              type="datetime-local"
              value={entryTime}
              onChange={(event) => setEntryTime(event.target.value)}
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Scale, timing, or weighing context"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Weight Entry"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Weight Entries</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{weightEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && weightEntries.length === 0 ? (
            <p className="empty-state">No weight entries saved yet.</p>
          ) : null}

          <div className="weight-list">
            {weightEntries.map((entry) => (
              <article className="weight-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{entry.weight_lbs} lbs</p>
                </div>

                {entry.notes ? <p>{entry.notes}</p> : null}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      Weight lbs
                      <input
                        required
                        min="0"
                        step="0.01"
                        type="number"
                        value={editForm.weightLbs}
                        onChange={(event) =>
                          updateEditForm("weightLbs", event.target.value)
                        }
                      />
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

export default WeightTrackerPage;
