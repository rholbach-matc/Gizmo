import { FormEvent, useEffect, useState } from "react";

import {
  BMEntry,
  createBMEntry,
  deleteBMEntry,
  getBMEntries,
} from "../api/bmEntries";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function BMTrackerPage() {
  const [bmEntries, setBMEntries] = useState<BMEntry[]>([]);
  const [occurred, setOccurred] = useState(true);
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

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

  async function handleDelete(bmEntryId: number) {
    if (!window.confirm("Delete this BM entry?")) {
      return;
    }

    try {
      setError(null);
      await deleteBMEntry(bmEntryId);
      setBMEntries((currentBMEntries) =>
        currentBMEntries.filter((entry) => entry.id !== bmEntryId),
      );
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
        <p>Record bowel movements and review recent bathroom notes.</p>
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

export default BMTrackerPage;
