import { FormEvent, useEffect, useState } from "react";

import {
  VomitEntry,
  VomitSeverity,
  createVomitEntry,
  deleteVomitEntry,
  getVomitEntries,
  updateVomitEntry,
} from "../api/vomitEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

const severityOptions: { label: string; value: VomitSeverity }[] = [
  { label: "Mild", value: "mild" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe", value: "severe" },
];

type VomitEntryEditForm = {
  entryTime: string;
  severity: VomitSeverity;
  notes: string;
};

function vomitEntryEditForm(entry: VomitEntry): VomitEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    severity: entry.severity,
    notes: entry.notes ?? "",
  };
}

function severityLabel(value: VomitSeverity) {
  return (
    severityOptions.find((severityOption) => severityOption.value === value)?.label ??
    value
  );
}

function VomitTrackerPage() {
  const [vomitEntries, setVomitEntries] = useState<VomitEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [severity, setSeverity] = useState<VomitSeverity>("mild");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<VomitEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadVomitEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedVomitEntries = await getVomitEntries();
      setVomitEntries(sortByEntryTimeDescending(loadedVomitEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load vomit entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVomitEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: VomitEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(vomitEntryEditForm(entry));
  }

  function updateEditForm(field: keyof VomitEntryEditForm, value: string) {
    setEditForm((currentForm) => {
      if (!currentForm) {
        return currentForm;
      }

      if (field === "severity") {
        return { ...currentForm, severity: value as VomitSeverity };
      }

      return { ...currentForm, [field]: value };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const newVomitEntry = await createVomitEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        severity,
        notes: notes.trim() || null,
      });

      setVomitEntries((currentVomitEntries) =>
        sortByEntryTimeDescending([newVomitEntry, ...currentVomitEntries]),
      );
      setEntryTime("");
      setSeverity("mild");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create vomit entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: VomitEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateVomitEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        severity: editForm.severity,
        notes: editForm.notes.trim() || null,
      });

      setVomitEntries((currentVomitEntries) =>
        sortByEntryTimeDescending(
          currentVomitEntries.map((currentEntry) =>
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
          : "Could not update vomit entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(vomitEntryId: number) {
    if (!window.confirm("Delete this vomit entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteVomitEntry(vomitEntryId);
      setVomitEntries((currentVomitEntries) =>
        currentVomitEntries.filter((entry) => entry.id !== vomitEntryId),
      );
      if (editingEntryId === vomitEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete vomit entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Vomit Tracker</h1>
      </section>

      <section className="content-grid" aria-label="Vomit entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Log Vomit</h2>

          <label>
            Date and Time (optional)
            <input
              type="datetime-local"
              value={entryTime}
              onChange={(event) => setEntryTime(event.target.value)}
            />
          </label>

          <label>
            Severity
            <select
              required
              value={severity}
              onChange={(event) => setSeverity(event.target.value as VomitSeverity)}
            >
              {severityOptions.map((severityOption) => (
                <option value={severityOption.value} key={severityOption.value}>
                  {severityOption.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Context or cleanup notes"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Vomit Entry"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Vomit Entries</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{vomitEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && vomitEntries.length === 0 ? (
            <p className="empty-state">No vomit entries saved yet.</p>
          ) : null}

          <div className="entry-list">
            {vomitEntries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{severityLabel(entry.severity)}</p>
                </div>

                {entry.notes ? <p>{entry.notes}</p> : null}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      Severity
                      <select
                        required
                        value={editForm.severity}
                        onChange={(event) =>
                          updateEditForm("severity", event.target.value)
                        }
                      >
                        {severityOptions.map((severityOption) => (
                          <option
                            value={severityOption.value}
                            key={severityOption.value}
                          >
                            {severityOption.label}
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

export default VomitTrackerPage;
