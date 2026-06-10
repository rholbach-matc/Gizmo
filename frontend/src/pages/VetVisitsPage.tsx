import { FormEvent, useEffect, useState } from "react";

import {
  VetVisitEntry,
  createVetVisitEntry,
  deleteVetVisitEntry,
  getVetVisitEntries,
} from "../api/vetVisitEntries";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function VetVisitsPage() {
  const [vetVisitEntries, setVetVisitEntries] = useState<VetVisitEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

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

  async function handleDelete(vetVisitEntryId: number) {
    try {
      setError(null);
      await deleteVetVisitEntry(vetVisitEntryId);
      setVetVisitEntries((currentVetVisitEntries) =>
        currentVetVisitEntries.filter((entry) => entry.id !== vetVisitEntryId),
      );
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
        <p>Record vet visits, summaries, follow-up status, and notes.</p>
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

export default VetVisitsPage;
