import { FormEvent, useEffect, useState } from "react";

import { Bowl, getBowls } from "../api/bowls";
import {
  FoodEntry,
  createFoodEntry,
  deleteFoodEntry,
  finishFoodEntry,
  getFoodEntries,
} from "../api/foodEntries";
import { Food, getFoods } from "../api/foods";
import {
  formatLocalTimestamp,
  optionalLocalDateTimeToISOString,
  sortByEntryTimeDescending,
} from "../utils/dateTime";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function formatOptionalNumber(value: number | null) {
  return value === null ? "--" : formatNumber(value);
}

function getFoodName(foods: Food[], foodId: number) {
  const food = foods.find((currentFood) => currentFood.id === foodId);
  if (!food) {
    return "Unknown food";
  }

  return food.brand ? `${food.name} - ${food.brand}` : food.name;
}

function getBowlName(bowls: Bowl[], bowlId: number) {
  return bowls.find((bowl) => bowl.id === bowlId)?.name ?? "Unknown bowl";
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
  const [lastSavedEntry, setLastSavedEntry] = useState<FoodEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [finishingEntryId, setFinishingEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

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

  async function handleDelete(foodEntryId: number) {
    if (!window.confirm("Delete this food entry?")) {
      return;
    }

    try {
      setError(null);
      await deleteFoodEntry(foodEntryId);
      setFoodEntries((currentFoodEntries) =>
        currentFoodEntries.filter((entry) => entry.id !== foodEntryId),
      );
      setLastSavedEntry((currentEntry) =>
        currentEntry?.id === foodEntryId ? null : currentEntry,
      );
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
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Food Entries</h1>
        <p>Log meals and review the nutrition Gizmo actually ate.</p>
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

          {!isLoading && (foods.length === 0 || bowls.length === 0) ? (
            <p className="empty-state">Add at least one food and bowl first.</p>
          ) : null}

          {lastSavedEntry ? (
            <article className="entry-result">
              <h3>{lastSavedEntry.is_open ? "Feeding Started" : "Feeding Finished"}</h3>
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
            {foodEntries.map((entry) => (
              <article
                className={`entry-card ${entry.is_open ? "entry-card-open" : ""}`}
                key={entry.id}
              >
                <div>
                  <h3>
                    {entry.is_open
                      ? getFoodName(foods, entry.food_id)
                      : formatLocalTimestamp(entry.entry_time)}
                  </h3>
                  <p>
                    {entry.is_open
                      ? "Open feeding"
                      : `${formatOptionalNumber(entry.food_eaten_grams)} g eaten`}
                  </p>
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
                    <p>{formatOptionalNumber(entry.calories_eaten)} calories</p>
                    <p>{formatOptionalNumber(entry.phosphorus_consumed_mg)} mg phosphorus</p>
                  </>
                )}

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

export default FoodEntriesPage;
