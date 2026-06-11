import { FormEvent, useEffect, useState } from "react";

import {
  BMEntry,
  createBMEntry,
  deleteBMEntry,
  getBMEntries,
  updateBMEntry,
} from "../api/bmEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

type BMEntryEditForm = {
  entryTime: string;
  occurred: string;
  notes: string;
};

function bmEntryEditForm(entry: BMEntry): BMEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    occurred: entry.occurred ? "yes" : "no",
    notes: entry.notes ?? "",
  };
}

function BMTrackerPage() {
  const [bmEntries, setBMEntries] = useState<BMEntry[]>([]);
  const [occurred, setOccurred] = useState(true);
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<BMEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadBMEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedBMEntries = await getBMEntries();
      setBMEntries(sortByEntryTimeDescending(loadedBMEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load BM entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBMEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: BMEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(bmEntryEditForm(entry));
  }

  function updateEditForm(field: keyof BMEntryEditForm, value: string) {
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

      const newBMEntry = await createBMEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        occurred,
        notes: notes.trim() || null,
      });

      setBMEntries((currentBMEntries) =>
        sortByEntryTimeDescending([newBMEntry, ...currentBMEntries]),
      );
      setOccurred(true);
      setEntryTime("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create BM entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: BMEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateBMEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        occurred: editForm.occurred === "yes",
        notes: editForm.notes.trim() || null,
      });

      setBMEntries((currentBMEntries) =>
        sortByEntryTimeDescending(
          currentBMEntries.map((currentEntry) =>
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
          : "Could not update BM entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(bmEntryId: number) {
    if (!window.confirm("Delete this BM entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteBMEntry(bmEntryId);
      setBMEntries((currentBMEntries) =>
        currentBMEntries.filter((entry) => entry.id !== bmEntryId),
      );
      if (editingEntryId === bmEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete BM entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>BM Tracker</h1>
      </section>

      <section className="content-grid" aria-label="BM entry management">
        <form className="panel bm-form" onSubmit={handleSubmit}>
          <h2>Log BM Entry</h2>

          <label>
            BM occurred?
            <select
              value={occurred ? "yes" : "no"}
              onChange={(event) => setOccurred(event.target.value === "yes")}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
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
              placeholder="Timing, litter box notes, or context"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save BM Entry"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent BM Entries</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{bmEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && bmEntries.length === 0 ? (
            <p className="empty-state">No BM entries saved yet.</p>
          ) : null}

          <div className="bm-list">
            {bmEntries.map((entry) => (
              <article className="bm-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{entry.occurred ? "BM occurred" : "No BM"}</p>
                </div>

                {entry.notes ? <p>{entry.notes}</p> : null}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      BM occurred?
                      <select
                        value={editForm.occurred}
                        onChange={(event) =>
                          updateEditForm("occurred", event.target.value)
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
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

export default BMTrackerPage;
