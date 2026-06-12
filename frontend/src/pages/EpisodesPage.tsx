import { FormEvent, useEffect, useState } from "react";

import {
  EpisodeEntry,
  createEpisodeEntry,
  deleteEpisodeEntry,
  getEpisodeEntries,
  updateEpisodeEntry,
} from "../api/episodeEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

const severityOptions = ["Mild", "Moderate", "Severe"];

type EpisodeEntryEditForm = {
  entryTime: string;
  severity: string;
  notes: string;
};

function episodeEntryEditForm(entry: EpisodeEntry): EpisodeEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    severity: entry.severity ?? "",
    notes: entry.notes ?? "",
  };
}

function EpisodesPage() {
  const [episodeEntries, setEpisodeEntries] = useState<EpisodeEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [severity, setSeverity] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EpisodeEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadEpisodeEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedEpisodeEntries = await getEpisodeEntries();
      setEpisodeEntries(sortByEntryTimeDescending(loadedEpisodeEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load episode entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEpisodeEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: EpisodeEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(episodeEntryEditForm(entry));
  }

  function updateEditForm(field: keyof EpisodeEntryEditForm, value: string) {
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

      const newEpisodeEntry = await createEpisodeEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        severity: severity || null,
        notes: notes.trim() || null,
      });

      setEpisodeEntries((currentEpisodeEntries) =>
        sortByEntryTimeDescending([newEpisodeEntry, ...currentEpisodeEntries]),
      );
      setEntryTime("");
      setSeverity("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create episode entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: EpisodeEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateEpisodeEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        severity: editForm.severity || null,
        notes: editForm.notes.trim() || null,
      });

      setEpisodeEntries((currentEpisodeEntries) =>
        sortByEntryTimeDescending(
          currentEpisodeEntries.map((currentEntry) =>
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
          : "Could not update episode entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(episodeEntryId: number) {
    if (!window.confirm("Delete this episode entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteEpisodeEntry(episodeEntryId);
      setEpisodeEntries((currentEpisodeEntries) =>
        currentEpisodeEntries.filter((entry) => entry.id !== episodeEntryId),
      );
      if (editingEntryId === episodeEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete episode entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Episodes</h1>
      </section>

      <section className="content-grid" aria-label="Episode entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Log Episode</h2>

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
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
            >
              <option value="">Select severity</option>
              {severityOptions.map((severityOption) => (
                <option value={severityOption} key={severityOption}>
                  {severityOption}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What happened, duration, or context"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Episode"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Episodes</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{episodeEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && episodeEntries.length === 0 ? (
            <p className="empty-state">No episodes saved yet.</p>
          ) : null}

          <div className="entry-list">
            {episodeEntries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{entry.severity || "No severity set"}</p>
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
                        value={editForm.severity}
                        onChange={(event) =>
                          updateEditForm("severity", event.target.value)
                        }
                      >
                        <option value="">Select severity</option>
                        {severityOptions.map((severityOption) => (
                          <option value={severityOption} key={severityOption}>
                            {severityOption}
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

export default EpisodesPage;
