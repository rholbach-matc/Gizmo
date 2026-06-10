import { FormEvent, useEffect, useState } from "react";

import { Bowl, getBowls } from "../api/bowls";
import {
  FoodEntry,
  createFoodEntry,
  deleteFoodEntry,
  getFoodEntries,
} from "../api/foodEntries";
import { Food, getFoods } from "../api/foods";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function FoodEntriesPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [foodId, setFoodId] = useState("");
  const [bowlId, setBowlId] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [endingWeight, setEndingWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [lastSavedEntry, setLastSavedEntry] = useState<FoodEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

      setFoods(loadedFoods);
      setBowls(loadedBowls);
      setFoodEntries(loadedFoodEntries);
      setFoodId(loadedFoods[0]?.id.toString() ?? "");
      setBowlId(loadedBowls[0]?.id.toString() ?? "");
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
        food_id: Number(foodId),
        bowl_id: Number(bowlId),
        starting_total_weight_grams: Number(startingWeight),
        ending_total_weight_grams: Number(endingWeight),
        notes: notes.trim() || null,
      });

      setFoodEntries((currentFoodEntries) => [
        newFoodEntry,
        ...currentFoodEntries,
      ]);
      setLastSavedEntry(newFoodEntry);
      setStartingWeight("");
      setEndingWeight("");
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

  async function handleDelete(foodEntryId: number) {
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

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Food Entries</h1>
        <p>Log meals and review the nutrition Gizmo actually ate.</p>
      </section>

      <section className="content-grid" aria-label="Food entry management">
        <form className="panel entry-form" onSubmit={handleSubmit}>
          <h2>Add Food Entry</h2>

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
                <option value={bowl.id} key={bowl.id}>
                  {bowl.name}
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
            Ending Weight (grams)
            <input
              required
              min="0"
              step="0.1"
              type="number"
              value={endingWeight}
              onChange={(event) => setEndingWeight(event.target.value)}
              placeholder="180"
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

          <button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Entry"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Recent Entries</h2>
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <span>{foodEntries.length}</span>
            )}
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          {!isLoading && (foods.length === 0 || bowls.length === 0) ? (
            <p className="empty-state">Add at least one food and bowl first.</p>
          ) : null}

          {lastSavedEntry ? (
            <article className="entry-result">
              <h3>Last Saved</h3>
              <dl>
                <div>
                  <dt>Food eaten</dt>
                  <dd>{formatNumber(lastSavedEntry.food_eaten_grams)} g</dd>
                </div>
                <div>
                  <dt>Calories</dt>
                  <dd>{formatNumber(lastSavedEntry.calories_eaten)}</dd>
                </div>
                <div>
                  <dt>Protein</dt>
                  <dd>{formatNumber(lastSavedEntry.protein_consumed_grams)} g</dd>
                </div>
                <div>
                  <dt>Fat</dt>
                  <dd>{formatNumber(lastSavedEntry.fat_consumed_grams)} g</dd>
                </div>
                <div>
                  <dt>Phosphorus</dt>
                  <dd>{formatNumber(lastSavedEntry.phosphorus_consumed_mg)} mg</dd>
                </div>
                <div>
                  <dt>Sodium</dt>
                  <dd>{formatNumber(lastSavedEntry.sodium_consumed_mg)} mg</dd>
                </div>
                <div>
                  <dt>Moisture</dt>
                  <dd>{formatNumber(lastSavedEntry.moisture_consumed_grams)} g</dd>
                </div>
              </dl>
            </article>
          ) : null}

          {!isLoading && foodEntries.length === 0 ? (
            <p className="empty-state">No food entries saved yet.</p>
          ) : null}

          <div className="entry-list">
            {foodEntries.map((entry) => (
              <article className="entry-card" key={entry.id}>
                <div>
                  <h3>{formatTimestamp(entry.entry_time)}</h3>
                  <p>{formatNumber(entry.food_eaten_grams)} g eaten</p>
                </div>

                <p>{formatNumber(entry.calories_eaten)} calories</p>
                <p>{formatNumber(entry.phosphorus_consumed_mg)} mg phosphorus</p>

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
