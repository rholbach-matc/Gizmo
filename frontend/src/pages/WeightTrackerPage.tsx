import { FormEvent, useEffect, useState } from "react";

import {
  WeightEntry,
  createWeightEntry,
  deleteWeightEntry,
  getWeightEntries,
} from "../api/weightEntries";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function WeightTrackerPage() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightLbs, setWeightLbs] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

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

  async function handleDelete(weightEntryId: number) {
    if (!window.confirm("Delete this weight entry?")) {
      return;
    }

    try {
      setError(null);
      await deleteWeightEntry(weightEntryId);
      setWeightEntries((currentWeightEntries) =>
        currentWeightEntries.filter((entry) => entry.id !== weightEntryId),
      );
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

export default WeightTrackerPage;
