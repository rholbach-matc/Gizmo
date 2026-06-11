import { FormEvent, useEffect, useState } from "react";

import {
  VetVisitEntry,
  createVetVisitEntry,
  deleteVetVisitEntry,
  getVetVisitEntries,
  updateVetVisitEntry,
} from "../api/vetVisitEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

type VetVisitEntryEditForm = {
  entryTime: string;
  reason: string;
  summary: string;
  followUpNeeded: boolean;
  notes: string;
};

function vetVisitEntryEditForm(entry: VetVisitEntry): VetVisitEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    reason: entry.reason ?? "",
    summary: entry.summary ?? "",
    followUpNeeded: Boolean(entry.follow_up_needed),
    notes: entry.notes ?? "",
  };
}

function VetVisitsPage() {
  const [vetVisitEntries, setVetVisitEntries] = useState<VetVisitEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<VetVisitEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadVetVisitEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedVetVisitEntries = await getVetVisitEntries();
      setVetVisitEntries(sortByEntryTimeDescending(loadedVetVisitEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load vet visit entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVetVisitEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: VetVisitEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(vetVisitEntryEditForm(entry));
  }

  function updateEditForm(
    field: keyof VetVisitEntryEditForm,
    value: string | boolean,
  ) {
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

      const newVetVisitEntry = await createVetVisitEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        reason: reason.trim() || null,
        summary: summary.trim() || null,
        follow_up_needed: followUpNeeded,
        notes: notes.trim() || null,
      });

      setVetVisitEntries((currentVetVisitEntries) =>
        sortByEntryTimeDescending([newVetVisitEntry, ...currentVetVisitEntries]),
      );
      setEntryTime("");
      setReason("");
      setSummary("");
      setFollowUpNeeded(false);
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create vet visit entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: VetVisitEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateVetVisitEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        reason: editForm.reason.trim() || null,
        summary: editForm.summary.trim() || null,
        follow_up_needed: editForm.followUpNeeded,
        notes: editForm.notes.trim() || null,
      });

      setVetVisitEntries((currentVetVisitEntries) =>
        sortByEntryTimeDescending(
          currentVetVisitEntries.map((currentEntry) =>
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
          : "Could not update vet visit entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(vetVisitEntryId: number) {
    if (!window.confirm("Delete this vet visit entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteVetVisitEntry(vetVisitEntryId);
      setVetVisitEntries((currentVetVisitEntries) =>
        currentVetVisitEntries.filter((entry) => entry.id !== vetVisitEntryId),
      );
      if (editingEntryId === vetVisitEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete vet visit entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Vet Visits</h1>
      </section>

      <section className="content-grid" aria-label="Vet visit entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Log Vet Visit</h2>

          <label>
            Date and Time (optional)
            <input
              type="datetime-local"
              value={entryTime}
              onChange={(event) => setEntryTime(event.target.value)}
            />
          </label>

          <label>
            Reason
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Visit reason"
            />
          </label>

          <label>
            Summary
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Visit summary"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={followUpNeeded}
              onChange={(event) => setFollowUpNeeded(event.target.checked)}
            />
            Follow-up needed
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Additional notes"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Vet Visit"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Vet Visits</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{vetVisitEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && vetVisitEntries.length === 0 ? (
            <p className="empty-state">No vet visits saved yet.</p>
          ) : null}

          <div className="entry-list">
            {vetVisitEntries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{entry.reason || "Vet visit"}</p>
                </div>

                {entry.summary ? <p>{entry.summary}</p> : null}
                <p>
                  {entry.follow_up_needed
                    ? "Follow-up needed"
                    : "No follow-up marked"}
                </p>
                {entry.notes ? <p>{entry.notes}</p> : null}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      Reason
                      <input
                        type="text"
                        value={editForm.reason}
                        onChange={(event) =>
                          updateEditForm("reason", event.target.value)
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
                      Summary
                      <textarea
                        value={editForm.summary}
                        onChange={(event) =>
                          updateEditForm("summary", event.target.value)
                        }
                      />
                    </label>

                    <label className="checkbox-label edit-entry-form-wide">
                      <input
                        type="checkbox"
                        checked={editForm.followUpNeeded}
                        onChange={(event) =>
                          updateEditForm("followUpNeeded", event.target.checked)
                        }
                      />
                      Follow-up needed
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

export default VetVisitsPage;
