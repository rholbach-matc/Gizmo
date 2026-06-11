import { FormEvent, useEffect, useState } from "react";

import {
  FluidEntry,
  createFluidEntry,
  deleteFluidEntry,
  getFluidEntries,
  updateFluidEntry,
} from "../api/fluidEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

type FluidEntryEditForm = {
  entryTime: string;
  amountMl: string;
  notes: string;
};

function fluidEntryEditForm(entry: FluidEntry): FluidEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    amountMl: entry.amount_ml.toString(),
    notes: entry.notes ?? "",
  };
}

function FluidsTrackerPage() {
  const [fluidEntries, setFluidEntries] = useState<FluidEntry[]>([]);
  const [amountMl, setAmountMl] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FluidEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadFluidEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedFluidEntries = await getFluidEntries();
      setFluidEntries(sortByEntryTimeDescending(loadedFluidEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load fluid entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFluidEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: FluidEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(fluidEntryEditForm(entry));
  }

  function updateEditForm(field: keyof FluidEntryEditForm, value: string) {
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

      const newFluidEntry = await createFluidEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        amount_ml: Number(amountMl),
        notes: notes.trim() || null,
      });

      setFluidEntries((currentFluidEntries) =>
        sortByEntryTimeDescending([newFluidEntry, ...currentFluidEntries]),
      );
      setAmountMl("");
      setEntryTime("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create fluid entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: FluidEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateFluidEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        amount_ml: Number(editForm.amountMl),
        notes: editForm.notes.trim() || null,
      });

      setFluidEntries((currentFluidEntries) =>
        sortByEntryTimeDescending(
          currentFluidEntries.map((currentEntry) =>
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
          : "Could not update fluid entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(fluidEntryId: number) {
    if (!window.confirm("Delete this fluid entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteFluidEntry(fluidEntryId);
      setFluidEntries((currentFluidEntries) =>
        currentFluidEntries.filter((entry) => entry.id !== fluidEntryId),
      );
      if (editingEntryId === fluidEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete fluid entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Fluids Tracker</h1>
      </section>

      <section className="content-grid" aria-label="Fluid entry management">
        <form className="panel fluid-form" onSubmit={handleSubmit}>
          <h2>Log Fluid Entry</h2>

          <label>
            Amount ml
            <input
              min="0"
              step="1"
              type="number"
              value={amountMl}
              onChange={(event) => setAmountMl(event.target.value)}
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
              placeholder="Location, response, or treatment context"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Fluid Entry"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Fluid Entries</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{fluidEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && fluidEntries.length === 0 ? (
            <p className="empty-state">No fluid entries saved yet.</p>
          ) : null}

          <div className="fluid-list">
            {fluidEntries.map((entry) => (
              <article className="fluid-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{entry.amount_ml} ml</p>
                </div>

                {entry.notes ? <p>{entry.notes}</p> : null}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      Amount ml
                      <input
                        required
                        min="0"
                        step="1"
                        type="number"
                        value={editForm.amountMl}
                        onChange={(event) =>
                          updateEditForm("amountMl", event.target.value)
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

export default FluidsTrackerPage;
