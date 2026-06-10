import { FormEvent, useEffect, useState } from "react";

import {
  FluidEntry,
  createFluidEntry,
  deleteFluidEntry,
  getFluidEntries,
} from "../api/fluidEntries";
import { formatLocalTimestamp } from "../utils/dateTime";

function FluidsTrackerPage() {
  const [fluidEntries, setFluidEntries] = useState<FluidEntry[]>([]);
  const [amountMl, setAmountMl] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFluidEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedFluidEntries = await getFluidEntries();
      setFluidEntries(loadedFluidEntries);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const newFluidEntry = await createFluidEntry({
        amount_ml: Number(amountMl),
        notes: notes.trim() || null,
      });

      setFluidEntries((currentFluidEntries) => [
        newFluidEntry,
        ...currentFluidEntries,
      ]);
      setAmountMl("");
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

  async function handleDelete(fluidEntryId: number) {
    try {
      setError(null);
      await deleteFluidEntry(fluidEntryId);
      setFluidEntries((currentFluidEntries) =>
        currentFluidEntries.filter((entry) => entry.id !== fluidEntryId),
      );
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
        <p>Record Sub-Q fluid treatments and review recent fluid notes.</p>
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

export default FluidsTrackerPage;
