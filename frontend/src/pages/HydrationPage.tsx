import { FormEvent, useEffect, useState } from "react";

import {
  DrinkingWaterEntry,
  createWaterEntry,
  deleteWaterEntry,
  getWaterEntries,
} from "../api/waterEntries";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function HydrationPage() {
  const [waterEntries, setWaterEntries] = useState<DrinkingWaterEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadWaterEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedWaterEntries = await getWaterEntries();
      setWaterEntries(sortByEntryTimeDescending(loadedWaterEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load water entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWaterEntries();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const newWaterEntry = await createWaterEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        notes: notes.trim() || null,
      });

      setWaterEntries((currentWaterEntries) =>
        sortByEntryTimeDescending([newWaterEntry, ...currentWaterEntries]),
      );
      setEntryTime("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create water entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(waterEntryId: number) {
    if (!window.confirm("Delete this water entry?")) {
      return;
    }

    try {
      setError(null);
      await deleteWaterEntry(waterEntryId);
      setWaterEntries((currentWaterEntries) =>
        currentWaterEntries.filter((entry) => entry.id !== waterEntryId),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete water entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Hydration</h1>
      </section>

      <section className="content-grid" aria-label="Water entry management">
        <form className="panel water-form" onSubmit={handleSubmit}>
          <h2>Log Drinking Observation</h2>

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
              placeholder="Bowl, timing, or context"
            />
          </label>

          <button className="quick-action-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Gizmo drank water"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Drinking Observations</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{waterEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          {!isLoading && waterEntries.length === 0 ? (
            <p className="empty-state">No drinking observations saved yet.</p>
          ) : null}

          <div className="water-list">
            {waterEntries.map((entry) => (
              <article className="water-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>Drank water</p>
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

export default HydrationPage;
