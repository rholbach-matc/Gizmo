import { FormEvent, useEffect, useState } from "react";

import {
  MoodEntry,
  MoodEntryCreate,
  createMoodEntry,
  deleteMoodEntry,
  getMoodEntries,
  updateMoodEntry,
} from "../api/moodEntries";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

type MoodEntryForm = {
  entryTime: string;
  moodRating: string;
  appetiteRating: string;
  energyRating: string;
  socialRating: string;
  yowlingRating: string;
  notes: string;
};

type RatingField = {
  field: keyof Pick<
    MoodEntryForm,
    | "moodRating"
    | "appetiteRating"
    | "energyRating"
    | "socialRating"
    | "yowlingRating"
  >;
  label: string;
  apiField:
    | "mood_rating"
    | "appetite_rating"
    | "energy_rating"
    | "social_rating"
    | "yowling_rating";
  minLabel: string;
  maxLabel: string;
};

const ratingFields: RatingField[] = [
  {
    field: "moodRating",
    label: "Mood",
    apiField: "mood_rating",
    minLabel: "Very Poor",
    maxLabel: "Excellent",
  },
  {
    field: "appetiteRating",
    label: "Appetite",
    apiField: "appetite_rating",
    minLabel: "Very Poor",
    maxLabel: "Excellent",
  },
  {
    field: "energyRating",
    label: "Energy",
    apiField: "energy_rating",
    minLabel: "Very Low",
    maxLabel: "High",
  },
  {
    field: "socialRating",
    label: "Social",
    apiField: "social_rating",
    minLabel: "Avoiding Interaction",
    maxLabel: "Very Social",
  },
  {
    field: "yowlingRating",
    label: "Yowling",
    apiField: "yowling_rating",
    minLabel: "Much Less Than Normal",
    maxLabel: "Much More Than Normal",
  },
];

const emptyMoodEntryForm: MoodEntryForm = {
  entryTime: "",
  moodRating: "",
  appetiteRating: "",
  energyRating: "",
  socialRating: "",
  yowlingRating: "",
  notes: "",
};

function moodEntryEditForm(entry: MoodEntry): MoodEntryForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    moodRating: entry.mood_rating?.toString() ?? "",
    appetiteRating: entry.appetite_rating?.toString() ?? "",
    energyRating: entry.energy_rating?.toString() ?? "",
    socialRating: entry.social_rating?.toString() ?? "",
    yowlingRating: entry.yowling_rating?.toString() ?? "",
    notes: entry.notes ?? "",
  };
}

function moodPayload(form: MoodEntryForm): MoodEntryCreate {
  return {
    entry_time: optionalLocalDateTimeToISOString(form.entryTime),
    mood_rating: form.moodRating ? Number(form.moodRating) : null,
    appetite_rating: form.appetiteRating ? Number(form.appetiteRating) : null,
    energy_rating: form.energyRating ? Number(form.energyRating) : null,
    social_rating: form.socialRating ? Number(form.socialRating) : null,
    yowling_rating: form.yowlingRating ? Number(form.yowlingRating) : null,
    notes: form.notes.trim() || null,
  };
}

function enteredRatings(entry: MoodEntry) {
  return ratingFields
    .map((ratingField) => ({
      label: ratingField.label,
      value: entry[ratingField.apiField],
    }))
    .filter((rating): rating is { label: string; value: number } => rating.value !== null);
}

function ratingOptions(ratingField: RatingField) {
  return [
    <option value="" key="blank">
      Not entered
    </option>,
    ...[1, 2, 3, 4, 5].map((rating) => (
      <option value={rating} key={rating}>
        {rating} = {rating === 1 ? ratingField.minLabel : rating === 5 ? ratingField.maxLabel : rating}
      </option>
    )),
  ];
}

function MoodTrackerPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [form, setForm] = useState<MoodEntryForm>(emptyMoodEntryForm);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MoodEntryForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadMoodEntries() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedMoodEntries = await getMoodEntries();
      setMoodEntries(sortByEntryTimeDescending(loadedMoodEntries));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load mood entries.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMoodEntries();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function updateForm(field: keyof MoodEntryForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function startEditing(entry: MoodEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(moodEntryEditForm(entry));
  }

  function updateEditForm(field: keyof MoodEntryForm, value: string) {
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

      const newMoodEntry = await createMoodEntry(moodPayload(form));

      setMoodEntries((currentMoodEntries) =>
        sortByEntryTimeDescending([newMoodEntry, ...currentMoodEntries]),
      );
      setForm(emptyMoodEntryForm);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create mood entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: MoodEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const payload = moodPayload(editForm);
      const updatedEntry = await updateMoodEntry(entry.id, {
        ...payload,
        entry_time: payload.entry_time ?? entry.entry_time,
      });

      setMoodEntries((currentMoodEntries) =>
        sortByEntryTimeDescending(
          currentMoodEntries.map((currentEntry) =>
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
          : "Could not update mood entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(moodEntryId: number) {
    if (!window.confirm("Delete this mood entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteMoodEntry(moodEntryId);
      setMoodEntries((currentMoodEntries) =>
        currentMoodEntries.filter((entry) => entry.id !== moodEntryId),
      );
      if (editingEntryId === moodEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete mood entry.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Mood Tracker</h1>
      </section>

      <section className="content-grid" aria-label="Mood entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Log Mood Check-In</h2>

          {ratingFields.map((ratingField) => (
            <label key={ratingField.field}>
              {ratingField.label}
              <select
                value={form[ratingField.field]}
                onChange={(event) => updateForm(ratingField.field, event.target.value)}
              >
                {ratingOptions(ratingField)}
              </select>
            </label>
          ))}

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Behavior, comfort, or context"
            />
          </label>

          <label>
            Date and Time (optional)
            <input
              type="datetime-local"
              value={form.entryTime}
              onChange={(event) => updateForm("entryTime", event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Mood Entry"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Mood Entries</h2>
            {isLoading ? <span>Loading...</span> : <span>{moodEntries.length}</span>}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && moodEntries.length === 0 ? (
            <p className="empty-state">No mood entries saved yet.</p>
          ) : null}

          <div className="entry-list">
            {moodEntries.map((entry) => {
              const ratings = enteredRatings(entry);

              return (
                <article className="entry-card" key={entry.id}>
                  <div>
                    <h3>{formatLocalTimestamp(entry.entry_time)}</h3>
                    {ratings.length > 0 ? (
                      <p>{ratings.map((rating) => `${rating.label}: ${rating.value}`).join(" | ")}</p>
                    ) : (
                      <p>Notes only</p>
                    )}
                  </div>

                  {entry.notes ? <p>{entry.notes}</p> : null}

                  {editingEntryId === entry.id && editForm ? (
                    <form
                      className="edit-entry-form"
                      onSubmit={(event) => handleEdit(event, entry)}
                    >
                      {ratingFields.map((ratingField) => (
                        <label key={ratingField.field}>
                          {ratingField.label}
                          <select
                            value={editForm[ratingField.field]}
                            onChange={(event) =>
                              updateEditForm(ratingField.field, event.target.value)
                            }
                          >
                            {ratingOptions(ratingField)}
                          </select>
                        </label>
                      ))}

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
                          onChange={(event) =>
                            updateEditForm("notes", event.target.value)
                          }
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
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default MoodTrackerPage;
