import { FormEvent, useEffect, useState } from "react";

import { Food, createFood, deleteFood, getFoods } from "../api/foods";

function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [caloriesPerGram, setCaloriesPerGram] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFoods() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedFoods = await getFoods();
      setFoods(loadedFoods);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not load foods.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const newFood = await createFood({
        name,
        brand: brand.trim() || null,
        calories_per_gram: Number(caloriesPerGram),
        notes: notes.trim() || null,
      });

      setFoods((currentFoods) => [...currentFoods, newFood]);
      setName("");
      setBrand("");
      setCaloriesPerGram("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not create food.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(foodId: number) {
    try {
      setError(null);
      await deleteFood(foodId);
      setFoods((currentFoods) =>
        currentFoods.filter((food) => food.id !== foodId),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not delete food.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Foods</h1>
        <p>Save food details so meal calories can be calculated.</p>
      </section>

      <section className="content-grid" aria-label="Food management">
        <form className="panel food-form" onSubmit={handleSubmit}>
          <h2>Add a Food</h2>

          <label>
            Name
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chicken pate"
            />
          </label>

          <label>
            Brand
            <input
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Favorite brand"
            />
          </label>

          <label>
            Calories per gram
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={caloriesPerGram}
              onChange={(event) => setCaloriesPerGram(event.target.value)}
              placeholder="1.25"
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Texture, flavor, or feeding notes"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Adding..." : "Add Food"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Saved Foods</h2>
            {isLoading ? <span>Loading...</span> : <span>{foods.length}</span>}
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          {!isLoading && foods.length === 0 ? (
            <p className="empty-state">No foods saved yet.</p>
          ) : null}

          <div className="food-list">
            {foods.map((food) => (
              <article className="food-card" key={food.id}>
                <div>
                  <h3>{food.name}</h3>
                  <p>{food.calories_per_gram} cal/g</p>
                </div>

                {food.brand ? <p>Brand: {food.brand}</p> : null}
                {food.notes ? <p>{food.notes}</p> : null}

                <button type="button" onClick={() => handleDelete(food.id)}>
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

export default FoodsPage;
