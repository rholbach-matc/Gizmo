import { FormEvent, useEffect, useState } from "react";

import {
  EpisodeEntry,
  createEpisodeEntry,
  deleteEpisodeEntry,
  getEpisodeEntries,
} from "../api/episodeEntries";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

const severityOptions = ["Mild", "Moderate", "Severe"];

function EpisodesPage() {
  const [episodeEntries, setEpisodeEntries] = useState<EpisodeEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [severity, setSeverity] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

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

  async function handleDelete(episodeEntryId: number) {
    if (!window.confirm("Delete this episode entry?")) {
      return;
    }

    try {
      setError(null);
      await deleteEpisodeEntry(episodeEntryId);
      setEpisodeEntries((currentEpisodeEntries) =>
        currentEpisodeEntries.filter((entry) => entry.id !== episodeEntryId),
      );
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

export default EpisodesPage;
