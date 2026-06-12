import { FormEvent, KeyboardEvent, MouseEvent, useEffect, useState } from "react";

import { Bowl, getBowls } from "../api/bowls";
import {
  FoodEntry,
  createFoodEntry,
  deleteFoodEntry,
  finishFoodEntry,
  getFoodEntries,
  updateFoodEntry,
} from "../api/foodEntries";
import { Food, getFoods } from "../api/foods";
import {
  formatLocalTimestamp,
  localDateTimeInputValue,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function formatOptionalNumber(value: number | null) {
  return value === null ? "--" : formatNumber(value);
}

function populatedNumber(value: number | null, unit = "") {
  if (value === null) {
    return null;
  }

  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
}

function populatedText(value: string | null) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function getFoodName(foods: Food[], foodId: number, fallbackName?: string) {
  const food = foods.find((currentFood) => currentFood.id === foodId);
  if (!food) {
    return fallbackName ?? "Unknown Food";
  }

  return food.brand ? `${food.name} - ${food.brand}` : food.name;
}

function getFoodSummary(foods: Food[], entry: FoodEntry) {
  const food = foods.find((currentFood) => currentFood.id === entry.food_id);

  if (food) {
    return {
      name: food.name,
      brand: food.brand,
    };
  }

  const fallbackName = entry.food_name || "Unknown Food";
  const [name, brand] = fallbackName.split(" - ", 2);

  return {
    name,
    brand: brand ?? null,
  };
}

function getBowlName(bowls: Bowl[], bowlId: number) {
  return bowls.find((bowl) => bowl.id === bowlId)?.name ?? "Unknown bowl";
}

function foodEntryName(foods: Food[], entry: FoodEntry) {
  return getFoodName(foods, entry.food_id, entry.food_name);
}

function getOpenBowlIds(foodEntries: FoodEntry[]) {
  return new Set(
    foodEntries
      .filter((entry) => entry.is_open)
      .map((entry) => entry.bowl_id),
  );
}

function getFirstAvailableBowlId(bowls: Bowl[], openBowlIds: Set<number>) {
  return bowls.find((bowl) => !openBowlIds.has(bowl.id))?.id.toString() ?? "";
}

type FoodEntryEditForm = {
  entryTime: string;
  startingWeight: string;
  endingWeight: string;
  notes: string;
};

type NutritionDetail = {
  label: string;
  value: string | null;
};

function foodEntryEditForm(entry: FoodEntry): FoodEntryEditForm {
  return {
    entryTime: localDateTimeInputValue(entry.entry_time),
    startingWeight: entry.starting_total_weight_grams.toString(),
    endingWeight: entry.ending_total_weight_grams?.toString() ?? "",
    notes: entry.notes ?? "",
  };
}

function FoodEntriesPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [foodId, setFoodId] = useState("");
  const [bowlId, setBowlId] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [finishWeights, setFinishWeights] = useState<Record<number, string>>({});
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<number>>(new Set());
  const [editForm, setEditForm] = useState<FoodEntryEditForm | null>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<FoodEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [finishingEntryId, setFinishingEntryId] = useState<number | null>(null);
  const [savingEditEntryId, setSavingEditEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadFoodEntryData() {
    try {
      setIsLoading(true);
      setError(null);

      const [loadedFoods, loadedBowls, loadedFoodEntries] = await Promise.all([
        getFoods(),
        getBowls(),
        getFoodEntries(),
      ]);

      const sortedFoodEntries = sortByEntryTimeDescending(loadedFoodEntries);
      setFoods(loadedFoods);
      setBowls(loadedBowls);
      setFoodEntries(sortedFoodEntries);
      setFoodId(loadedFoods[0]?.id.toString() ?? "");
      setBowlId(getFirstAvailableBowlId(loadedBowls, getOpenBowlIds(sortedFoodEntries)));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load food entry data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFoodEntryData();
  }, []);

  function showSuccessMessage() {
    setSuccessMessage("Changes saved");
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }

  function startEditing(entry: FoodEntry) {
    setError(null);
    setSuccessMessage(null);
    setEditingEntryId(entry.id);
    setEditForm(foodEntryEditForm(entry));
    if (!entry.is_open) {
      setExpandedEntryIds((currentExpandedEntryIds) => {
        const nextExpandedEntryIds = new Set(currentExpandedEntryIds);
        nextExpandedEntryIds.add(entry.id);
        return nextExpandedEntryIds;
      });
    }
  }

  function toggleFinishedEntry(entryId: number) {
    setExpandedEntryIds((currentExpandedEntryIds) => {
      const nextExpandedEntryIds = new Set(currentExpandedEntryIds);

      if (nextExpandedEntryIds.has(entryId)) {
        nextExpandedEntryIds.delete(entryId);
      } else {
        nextExpandedEntryIds.add(entryId);
      }

      return nextExpandedEntryIds;
    });
  }

  function handleFinishedCardClick(entryId: number) {
    toggleFinishedEntry(entryId);
  }

  function handleFinishedCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    entryId: number,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFinishedEntry(entryId);
    }
  }

  function handleNestedActionClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
  }

  function foodEntryNutritionDetails(entry: FoodEntry): NutritionDetail[] {
    return [
      { label: "Calories consumed", value: populatedNumber(entry.calories_eaten) },
      {
        label: "Protein consumed",
        value: populatedNumber(entry.protein_consumed_grams, "g"),
      },
      { label: "Fat consumed", value: populatedNumber(entry.fat_consumed_grams, "g") },
      {
        label: "Phosphorus consumed",
        value: populatedNumber(entry.phosphorus_consumed_mg, "mg"),
      },
      {
        label: "Sodium consumed",
        value: populatedNumber(entry.sodium_consumed_mg, "mg"),
      },
      {
        label: "Moisture consumed",
        value: populatedNumber(entry.moisture_consumed_grams, "g"),
      },
      {
        label: "Dry matter consumed",
        value: populatedNumber(entry.dry_matter_consumed_grams, "g"),
      },
      { label: "Notes", value: populatedText(entry.notes) },
    ].filter((detail) => detail.value !== null);
  }

  function updateEditForm(field: keyof FoodEntryEditForm, value: string) {
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

      const newFoodEntry = await createFoodEntry({
        entry_time: optionalLocalDateTimeToISOString(entryTime),
        food_id: Number(foodId),
        bowl_id: Number(bowlId),
        starting_total_weight_grams: Number(startingWeight),
        notes: notes.trim() || null,
      });

      setFoodEntries((currentFoodEntries) =>
        sortByEntryTimeDescending([newFoodEntry, ...currentFoodEntries]),
      );
      setLastSavedEntry(newFoodEntry);
      if (newFoodEntry.is_open) {
        setBowlId(
          getFirstAvailableBowlId(
            bowls,
            getOpenBowlIds([newFoodEntry, ...foodEntries]),
          ),
        );
      }
      setStartingWeight("");
      setEntryTime("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create food entry.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFinish(event: FormEvent<HTMLFormElement>, foodEntryId: number) {
    event.preventDefault();

    try {
      setFinishingEntryId(foodEntryId);
      setError(null);
      setSuccessMessage(null);

      const finishedEntry = await finishFoodEntry(foodEntryId, {
        ending_total_weight_grams: Number(finishWeights[foodEntryId]),
      });

      setFoodEntries((currentFoodEntries) =>
        sortByEntryTimeDescending(
          currentFoodEntries.map((entry) =>
            entry.id === foodEntryId ? finishedEntry : entry,
          ),
        ),
      );
      setLastSavedEntry(finishedEntry);
      setFinishWeights((currentFinishWeights) => {
        const updatedFinishWeights = { ...currentFinishWeights };
        delete updatedFinishWeights[foodEntryId];
        return updatedFinishWeights;
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not finish food entry.",
      );
    } finally {
      setFinishingEntryId(null);
    }
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, entry: FoodEntry) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    try {
      setSavingEditEntryId(entry.id);
      setError(null);
      setSuccessMessage(null);

      const updatedEntry = await updateFoodEntry(entry.id, {
        entry_time: optionalLocalDateTimeToISOString(editForm.entryTime) ?? entry.entry_time,
        starting_total_weight_grams: Number(editForm.startingWeight),
        ending_total_weight_grams: entry.is_open ? null : Number(editForm.endingWeight),
        notes: editForm.notes.trim() || null,
      });

      setFoodEntries((currentFoodEntries) =>
        sortByEntryTimeDescending(
          currentFoodEntries.map((currentEntry) =>
            currentEntry.id === entry.id ? updatedEntry : currentEntry,
          ),
        ),
      );
      setLastSavedEntry(updatedEntry);
      setEditingEntryId(null);
      setEditForm(null);
      showSuccessMessage();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update food entry.",
      );
    } finally {
      setSavingEditEntryId(null);
    }
  }

  async function handleDelete(foodEntryId: number) {
    if (!window.confirm("Delete this food entry?")) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteFoodEntry(foodEntryId);
      setFoodEntries((currentFoodEntries) =>
        currentFoodEntries.filter((entry) => entry.id !== foodEntryId),
      );
      setLastSavedEntry((currentEntry) =>
        currentEntry?.id === foodEntryId ? null : currentEntry,
      );
      if (editingEntryId === foodEntryId) {
        setEditingEntryId(null);
        setEditForm(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete food entry.",
      );
    }
  }

  const openEntriesCount = foodEntries.filter((entry) => entry.is_open).length;
  const openBowlIds = getOpenBowlIds(foodEntries);

  return (
    <main className="app food-entries-page">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Food Entries</h1>
      </section>

      <section className="content-grid" aria-label="Food entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Start Feeding</h2>

          <label>
            Food
            <select
              required
              value={foodId}
              onChange={(event) => setFoodId(event.target.value)}
            >
              <option value="" disabled>
                Select food
              </option>
              {foods.map((food) => (
                <option value={food.id} key={food.id}>
                  {food.brand ? `${food.name} - ${food.brand}` : food.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Bowl
            <select
              required
              value={bowlId}
              onChange={(event) => setBowlId(event.target.value)}
            >
              <option value="" disabled>
                Select bowl
              </option>
              {bowls.map((bowl) => (
                <option
                  value={bowl.id}
                  key={bowl.id}
                  disabled={openBowlIds.has(bowl.id)}
                >
                  {openBowlIds.has(bowl.id)
                    ? `${bowl.name} - currently in use`
                    : bowl.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Starting Weight (grams)
            <input
              required
              min="0"
              step="0.1"
              type="number"
              value={startingWeight}
              onChange={(event) => setStartingWeight(event.target.value)}
              placeholder="260"
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
              placeholder="Meal timing, appetite, or medication notes"
            />
          </label>

          <button type="submit" disabled={isSaving || isLoading || !bowlId}>
            {isSaving ? "Starting..." : "Start Feeding"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Entries</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>
                {openEntriesCount > 0
                  ? `${openEntriesCount} open`
                  : `${foodEntries.length} saved`}
              </span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && (foods.length === 0 || bowls.length === 0) ? (
            <p className="empty-state">Add at least one food and bowl first.</p>
          ) : null}

          {lastSavedEntry ? (
            <article className="entry-result">
              <h3>{lastSavedEntry.is_open ? "Feeding Started" : "Feeding Finished"}</h3>
              <p className="food-entry-name">{foodEntryName(foods, lastSavedEntry)}</p>
              {lastSavedEntry.is_open ? (
                <p>
                  {formatNumber(lastSavedEntry.starting_food_weight_grams)} g served.
                  Add ending weight when Gizmo is done.
                </p>
              ) : (
                <dl>
                  <div>
                    <dt>Food eaten</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.food_eaten_grams)} g</dd>
                  </div>
                  <div>
                    <dt>Calories</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.calories_eaten)}</dd>
                  </div>
                  <div>
                    <dt>Protein</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.protein_consumed_grams)} g</dd>
                  </div>
                  <div>
                    <dt>Fat</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.fat_consumed_grams)} g</dd>
                  </div>
                  <div>
                    <dt>Phosphorus</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.phosphorus_consumed_mg)} mg</dd>
                  </div>
                  <div>
                    <dt>Sodium</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.sodium_consumed_mg)} mg</dd>
                  </div>
                  <div>
                    <dt>Moisture</dt>
                    <dd>{formatOptionalNumber(lastSavedEntry.moisture_consumed_grams)} g</dd>
                  </div>
                </dl>
              )}
            </article>
          ) : null}

          {!isLoading && foodEntries.length === 0 ? (
            <p className="empty-state">No food entries saved yet.</p>
          ) : null}

          <div className="entry-list">
            {foodEntries.map((entry) => {
              const foodSummary = getFoodSummary(foods, entry);
              const isExpanded = expandedEntryIds.has(entry.id);
              const nutritionDetails = foodEntryNutritionDetails(entry);

              return (
              <article
                className={`entry-card ref-card ${
                  entry.is_open ? "entry-card-open" : "entry-card-finished"
                }`}
                key={entry.id}
                onClick={
                  entry.is_open ? undefined : () => handleFinishedCardClick(entry.id)
                }
                onKeyDown={
                  entry.is_open
                    ? undefined
                    : (event) => handleFinishedCardKeyDown(event, entry.id)
                }
                role={entry.is_open ? undefined : "button"}
                tabIndex={entry.is_open ? undefined : 0}
                aria-expanded={entry.is_open ? undefined : isExpanded}
                aria-label={
                  entry.is_open
                    ? undefined
                    : `${isExpanded ? "Collapse" : "Expand"} finished feeding for ${
                        foodSummary.name
                      }`
                }
              >
                <div className="entry-card-summary">
                  <div
                    className={`entry-card-meta-row ${
                      entry.is_open ? "entry-card-meta-row-open" : ""
                    }`}
                  >
                    <span
                      className={`entry-status-badge ${
                        entry.is_open ? "entry-status-open" : "entry-status-finished"
                      }`}
                    >
                      {entry.is_open ? "Open Feeding" : "Finished Feeding"}
                    </span>
                    {!entry.is_open ? (
                      <div className="entry-card-times">
                        <span>Started {formatLocalTimestamp(entry.entry_time)}</span>
                        <span>
                          Finished{" "}
                          {entry.finished_at
                            ? formatLocalTimestamp(entry.finished_at)
                            : "time not saved"}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <h3 className="entry-card-name">{foodSummary.name}</h3>
                  {foodSummary.brand ? (
                    <p className="entry-card-brand">{foodSummary.brand}</p>
                  ) : null}
                </div>

                {entry.is_open ? (
                  <>
                    <dl className="entry-details">
                      <div>
                        <dt>Bowl</dt>
                        <dd>{getBowlName(bowls, entry.bowl_id)}</dd>
                      </div>
                      <div>
                        <dt>Started</dt>
                        <dd>{formatLocalTimestamp(entry.entry_time)}</dd>
                      </div>
                      <div>
                        <dt>Starting total</dt>
                        <dd>{formatNumber(entry.starting_total_weight_grams)} g</dd>
                      </div>
                      <div>
                        <dt>Food served</dt>
                        <dd>{formatNumber(entry.starting_food_weight_grams)} g</dd>
                      </div>
                    </dl>
                    <form
                      className="finish-entry-form"
                      onClick={handleNestedActionClick}
                      onSubmit={(event) => handleFinish(event, entry.id)}
                    >
                      <label>
                        Ending Weight (grams)
                        <input
                          required
                          min="0"
                          step="0.1"
                          type="number"
                          value={finishWeights[entry.id] ?? ""}
                          onChange={(event) =>
                            setFinishWeights((currentFinishWeights) => ({
                              ...currentFinishWeights,
                              [entry.id]: event.target.value,
                            }))
                          }
                          placeholder="180"
                        />
                      </label>
                      <button type="submit" disabled={finishingEntryId === entry.id}>
                        {finishingEntryId === entry.id ? "Finishing..." : "Finish Feeding"}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <dl className="entry-details entry-key-metrics">
                      <div>
                        <dt>Starting weight</dt>
                        <dd>{formatNumber(entry.starting_total_weight_grams)} g</dd>
                      </div>
                      <div>
                        <dt>Ending weight</dt>
                        <dd>{formatOptionalNumber(entry.ending_total_weight_grams)} g</dd>
                      </div>
                      <div>
                        <dt>Food eaten</dt>
                        <dd>{formatOptionalNumber(entry.food_eaten_grams)} g</dd>
                      </div>
                      <div>
                        <dt>Calories</dt>
                        <dd>{formatOptionalNumber(entry.calories_eaten)}</dd>
                      </div>
                    </dl>

                    {isExpanded ? (
                      <section
                        className="ref-card-expanded entry-expanded"
                        aria-label={`${foodSummary.name} consumed nutrition`}
                      >
                        {nutritionDetails.length > 0 ? (
                          <dl className="nutrition-grid entry-nutrition-grid">
                            {nutritionDetails.map((detail) => (
                              <div className="nutrition-group" key={detail.label}>
                                <dt>{detail.label}</dt>
                                <dd>{detail.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                      </section>
                    ) : null}
                  </>
                )}

                {editingEntryId === entry.id && editForm ? (
                  <form
                    className="edit-entry-form"
                    onClick={handleNestedActionClick}
                    onSubmit={(event) => handleEdit(event, entry)}
                  >
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

                    <label>
                      Starting Weight (grams)
                      <input
                        required
                        min="0"
                        step="0.1"
                        type="number"
                        value={editForm.startingWeight}
                        onChange={(event) =>
                          updateEditForm("startingWeight", event.target.value)
                        }
                      />
                    </label>

                    {!entry.is_open ? (
                      <label>
                        Ending Weight (grams)
                        <input
                          required
                          min="0"
                          step="0.1"
                          type="number"
                          value={editForm.endingWeight}
                          onChange={(event) =>
                            updateEditForm("endingWeight", event.target.value)
                          }
                        />
                      </label>
                    ) : null}

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

                {entry.is_open || isExpanded ? (
                  <div className="entry-actions">
                    <button
                      type="button"
                      onClick={(event) => {
                        handleNestedActionClick(event);
                        startEditing(entry);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        handleNestedActionClick(event);
                        handleDelete(entry.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default FoodEntriesPage;
