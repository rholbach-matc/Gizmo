import { FormEvent, useEffect, useState } from "react";

import { Bowl, getBowls } from "../api/bowls";
import {
  DrinkingWaterEntry,
  createWaterEntry,
  deleteWaterEntry,
  getWaterEntries,
  updateWaterEntry,
} from "../api/waterEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

const observationTypeOptions = [
  { label: "Drank water", value: "drank_water" },
  { label: "Visited bowl", value: "visited_bowl" },
  { label: "Refused water", value: "refused_water" },
];

type WaterEntryEditForm = {
  entryTime: string;
  observationType: string;
  bowlId: string;
  notes: string;
};

function formatObservationType(value: string) {
  return (
    observationTypeOptions.find((option) => option.value === value)?.label ??
    "Water observation"
  );
}

function getBowlName(bowls: Bowl[], bowlId: number | null) {
  if (bowlId === null) {
    return "No bowl selected";
  }

  return bowls.find((bowl) => bowl.id === bowlId)?.name ?? "Unknown bowl";
}

function waterEntryEditForm(entry: DrinkingWaterEntry): WaterEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    observationType: entry.observation_type,
    bowlId: entry.bowl_id?.toString() ?? "",
    notes: entry.notes ?? "",
  };
}

function HydrationPage() {
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [waterEntries, setWaterEntries] = useState<DrinkingWaterEntry[]>([]);
  const [entryTime, setEntryTime] = useState("");
  const [observationType, setObservationType] = useState("drank_water");
  const [bowlId, setBowlId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<WaterEntryEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadWaterData() {
    try {
      setIsLoading(true);
      setError(null);
      const [loadedBowls, loadedWaterEntries] = await Promise.all([
        getBowls(),
        getWaterEntries(),
      ]);
      setBowls(loadedBowls);
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
    loadWaterData();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: DrinkingWaterEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(waterEntryEditForm(entry));
  }

  function updateEditForm(field: keyof WaterEntryEditForm, value: string) {
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

      const newWaterEntry = await createWaterEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        observation_type: observationType,
        bowl_id: bowlId ? Number(bowlId) : null,
        notes: notes.trim() || null,
      });

      setWaterEntries((currentWaterEntries) =>
        sortByEntryTimeDescending([newWaterEntry, ...currentWaterEntries]),
      );
      setEntryTime("");
      setObservationType("drank_water");
      setBowlId("");
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

  async function handleEdit(
    event: FormEvent<HTMLFormElement>,
    entry: DrinkingWaterEntry,
  ) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateWaterEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        observation_type: editForm.observationType,
        bowl_id: editForm.bowlId ? Number(editForm.bowlId) : null,
        notes: editForm.notes.trim() || null,
      });

      setWaterEntries((currentWaterEntries) =>
        sortByEntryTimeDescending(
          currentWaterEntries.map((currentEntry) =>
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
          : "Could not update water entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(waterEntryId: number) {
    if (!window.confirm("Delete this water entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteWaterEntry(waterEntryId);
      setWaterEntries((currentWaterEntries) =>
        currentWaterEntries.filter((entry) => entry.id !== waterEntryId),
      );
      if (editingEntryId === waterEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
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
            Observation Type
            <select
              value={observationType}
              onChange={(event) => setObservationType(event.target.value)}
            >
              {observationTypeOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Bowl
            <select value={bowlId} onChange={(event) => setBowlId(event.target.value)}>
              <option value="">No bowl selected</option>
              {bowls.map((bowl) => (
                <option value={bowl.id} key={bowl.id}>
                  {bowl.name}
                </option>
              ))}
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
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && waterEntries.length === 0 ? (
            <p className="empty-state">No drinking observations saved yet.</p>
          ) : null}

          <div className="water-list">
            {waterEntries.map((entry) => (
              <article className="water-card" key={entry.id}>
                <div>
                  <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                  <p>{formatObservationType(entry.observation_type)}</p>
                </div>

                <p>{getBowlName(bowls, entry.bowl_id)}</p>
                {entry.notes ? <p>{entry.notes}</p> : null}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
                    <label>
                      Observation Type
                      <select
                        value={editForm.observationType}
                        onChange={(event) =>
                          updateEditForm("observationType", event.target.value)
                        }
                      >
                        {observationTypeOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Bowl
                      <select
                        value={editForm.bowlId}
                        onChange={(event) =>
                          updateEditForm("bowlId", event.target.value)
                        }
                      >
                        <option value="">No bowl selected</option>
                        {bowls.map((bowl) => (
                          <option value={bowl.id} key={bowl.id}>
                            {bowl.name}
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

export default HydrationPage;
