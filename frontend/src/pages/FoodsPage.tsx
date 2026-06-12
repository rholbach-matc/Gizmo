import { FormEvent, KeyboardEvent, MouseEvent, useEffect, useState } from "react";

import { Food, createFood, deleteFood, getFoods, updateFood } from "../api/foods";

type FoodEditForm = {
  canSize: string;
  caloriesPerCan: string;
  moisture: string;
  protein: string;
  fat: string;
  phosphorus: string;
  sodium: string;
};

type FoodDetail = {
  label: string;
  value: string | number | null;
  unit?: string;
};

type FoodDetailGroup = {
  title: string;
  details: FoodDetail[];
};

function foodEditForm(food: Food): FoodEditForm {
  return {
    canSize: food.can_size_grams.toString(),
    caloriesPerCan: food.calories_per_can.toString(),
    moisture: food.moisture_percent.toString(),
    protein: food.protein_as_fed_percent.toString(),
    fat: food.fat_as_fed_percent.toString(),
    phosphorus: food.phosphorus_as_fed_percent.toString(),
    sodium: food.sodium_as_fed_percent.toString(),
  };
}

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function hasStoredValue(value: string | number | null) {
  if (value === null) {
    return false;
  }

  return typeof value === "number" || value.trim().length > 0;
}

function foodDetailGroups(food: Food): FoodDetailGroup[] {
  return [
    {
      title: "Package",
      details: [
        { label: "Can size", value: formatNumber(food.can_size_grams), unit: "g" },
        {
          label: "Calories per can",
          value: formatNumber(food.calories_per_can),
          unit: "cal",
        },
        {
          label: "Calories per gram",
          value: formatNumber(food.calories_per_gram),
          unit: "cal/g",
        },
      ],
    },
    {
      title: "As-fed",
      details: [
        { label: "Moisture", value: formatNumber(food.moisture_percent), unit: "%" },
        { label: "Protein", value: formatNumber(food.protein_as_fed_percent), unit: "%" },
        { label: "Fat", value: formatNumber(food.fat_as_fed_percent), unit: "%" },
        {
          label: "Phosphorus",
          value: formatNumber(food.phosphorus_as_fed_percent),
          unit: "%",
        },
        { label: "Sodium", value: formatNumber(food.sodium_as_fed_percent), unit: "%" },
      ],
    },
    {
      title: "Dry matter",
      details: [
        {
          label: "Protein",
          value: formatNumber(food.protein_dry_matter_percent),
          unit: "%",
        },
        { label: "Fat", value: formatNumber(food.fat_dry_matter_percent), unit: "%" },
        {
          label: "Phosphorus",
          value: formatNumber(food.phosphorus_dry_matter_percent),
          unit: "%",
        },
        { label: "Sodium", value: formatNumber(food.sodium_dry_matter_percent), unit: "%" },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      details: group.details.filter((detail) => hasStoredValue(detail.value)),
    }))
    .filter((group) => group.details.length > 0);
}

function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [canSize, setCanSize] = useState("");
  const [caloriesPerCan, setCaloriesPerCan] = useState("");
  const [moisture, setMoisture] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [sodium, setSodium] = useState("");
  const [notes, setNotes] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<number | null>(null);
  const [expandedFoodIds, setExpandedFoodIds] = useState<Set<number>>(new Set());
  const [editForm, setEditForm] = useState<FoodEditForm | null>(null);
  const [savingEditFoodId, setSavingEditFoodId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  function resetNewFoodForm() {
    setName("");
    setBrand("");
    setCanSize("");
    setCaloriesPerCan("");
    setMoisture("");
    setProtein("");
    setFat("");
    setPhosphorus("");
    setSodium("");
    setNotes("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const newFood = await createFood({
        name,
        brand: brand.trim() || null,
        can_size_grams: Number(canSize),
        calories_per_can: Number(caloriesPerCan),
        moisture_percent: Number(moisture),
        protein_as_fed_percent: Number(protein),
        fat_as_fed_percent: Number(fat),
        phosphorus_as_fed_percent: Number(phosphorus),
        sodium_as_fed_percent: Number(sodium),
        notes: notes.trim() || null,
      });

      setFoods((currentFoods) => [...currentFoods, newFood]);
      resetNewFoodForm();
      setIsAddFormOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not create food.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(foodId: number) {
    if (!window.confirm("Delete this food?")) {
      return;
    }

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

  function startEditing(food: Food) {
    setEditingFoodId(food.id);
    setEditForm(foodEditForm(food));
    setError(null);
    setSuccessMessage(null);
  }

  function toggleExpanded(foodId: number) {
    setExpandedFoodIds((currentExpandedFoodIds) => {
      const nextExpandedFoodIds = new Set(currentExpandedFoodIds);

      if (nextExpandedFoodIds.has(foodId)) {
        nextExpandedFoodIds.delete(foodId);
      } else {
        nextExpandedFoodIds.add(foodId);
      }

      return nextExpandedFoodIds;
    });
  }

  function handleCardToggleClick(
    event: MouseEvent<HTMLElement>,
    foodId: number,
  ) {
    const target = event.target as HTMLElement;

    if (target.closest("button, input, textarea, select, a, form")) {
      return;
    }

    toggleExpanded(foodId);
  }

  function handleCardToggleKeyDown(
    event: KeyboardEvent<HTMLElement>,
    foodId: number,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest("button, input, textarea, select, a, form")) {
      return;
    }

    event.preventDefault();
    toggleExpanded(foodId);
  }

  function updateEditForm(field: keyof FoodEditForm, value: string) {
    setEditForm((currentForm) =>
      currentForm ? { ...currentForm, [field]: value } : currentForm,
    );
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, food: Food) {
    event.preventDefault();

    if (!editForm) {
      return;
    }

    try {
      setSavingEditFoodId(food.id);
      setError(null);
      setSuccessMessage(null);

      const updatedFood = await updateFood(food.id, {
        can_size_grams: Number(editForm.canSize),
        calories_per_can: Number(editForm.caloriesPerCan),
        moisture_percent: Number(editForm.moisture),
        protein_as_fed_percent: Number(editForm.protein),
        fat_as_fed_percent: Number(editForm.fat),
        phosphorus_as_fed_percent: Number(editForm.phosphorus),
        sodium_as_fed_percent: Number(editForm.sodium),
      });

      setFoods((currentFoods) =>
        currentFoods.map((currentFood) =>
          currentFood.id === updatedFood.id ? updatedFood : currentFood,
        ),
      );
      setEditingFoodId(null);
      setEditForm(null);
      setSuccessMessage("Changes saved");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not update food.",
      );
    } finally {
      setSavingEditFoodId(null);
    }
  }

  return (
    <main className="app reference-app foods-page">
      <section className="page-header reference-page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Foods</h1>
      </section>

      <section className="reference-stack" aria-label="Food management">
        <section className="reference-panel">
          <div className="section-heading">
            <h2>Saved Foods</h2>
            {isLoading ? <span>Loading...</span> : <span>{foods.length}</span>}
          </div>

          {error ? <p className="error-message">{error}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}

          {!isLoading && foods.length === 0 ? (
            <p className="empty-state">No foods saved yet.</p>
          ) : null}

          <div className="food-list">
            {foods.map((food) => {
              const detailGroups = foodDetailGroups(food);
              const isExpanded = expandedFoodIds.has(food.id);

              return (
                <article
                  className="ref-card food-card"
                  key={food.id}
                  onClick={(event) => handleCardToggleClick(event, food.id)}
                  onKeyDown={(event) => handleCardToggleKeyDown(event, food.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${food.name}`}
                >
                  <div className="ref-card-collapsed food-card-summary">
                    <div className="food-card-package">
                      <span>{food.brand}</span>
                      <span>Can: {formatNumber(food.can_size_grams)}g</span>
                      <span>Cal/can: {formatNumber(food.calories_per_can)}</span>
                    </div>

                    <h3 className="food-card-name">{food.name}</h3>

                    <div
                      className="food-card-metric-values"
                      aria-label="Key nutrition values"
                    >
                      <strong>{formatNumber(food.calories_per_gram)}</strong>
                      <strong>{formatNumber(food.phosphorus_dry_matter_percent)}%</strong>
                      <strong>{formatNumber(food.protein_dry_matter_percent)}%</strong>
                      <strong>{formatNumber(food.sodium_dry_matter_percent)}%</strong>
                    </div>

                    <div className="food-card-metric-labels" aria-hidden="true">
                      <span>
                        cal/g
                      </span>
                      <span>
                        Phos DM
                      </span>
                      <span>
                        Protein DM
                      </span>
                      <span>Na DM</span>
                    </div>
                  </div>

                  {isExpanded ? (
                    <section
                      className="ref-card-expanded food-detail-panel"
                      aria-label={`${food.name} nutrition details`}
                    >
                      {detailGroups.length > 0 ? (
                        <div className="nutrition-grid">
                          {detailGroups.map((group) => (
                            <section className="nutrition-group" key={group.title}>
                              <h4>{group.title}</h4>
                              <dl>
                                {group.details.map((detail) => (
                                  <div key={`${group.title}-${detail.label}`}>
                                    <dt>{detail.label}</dt>
                                    <dd>
                                      {detail.value}
                                      {detail.unit ? ` ${detail.unit}` : ""}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </section>
                          ))}
                        </div>
                      ) : null}

                      {food.notes ? (
                        <section className="nutrition-group food-notes-detail">
                          <h4>Notes</h4>
                          <p>{food.notes}</p>
                        </section>
                      ) : null}

                      {editingFoodId === food.id && editForm ? (
                        <form
                          className="form-compact edit-entry-form food-edit-form"
                          onSubmit={(event) => handleEdit(event, food)}
                        >
                          <p className="form-section-label">Nutrition values</p>

                          <div className="form-row">
                            <label>
                              Can size (g)
                              <input
                                required
                                min="0"
                                step="0.1"
                                type="number"
                                value={editForm.canSize}
                                onChange={(event) =>
                                  updateEditForm("canSize", event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Calories per can
                              <input
                                required
                                min="0"
                                step="0.1"
                                type="number"
                                value={editForm.caloriesPerCan}
                                onChange={(event) =>
                                  updateEditForm("caloriesPerCan", event.target.value)
                                }
                              />
                            </label>
                          </div>

                          <div className="form-row">
                            <label>
                              Moisture %
                              <input
                                required
                                min="0"
                                max="99.9"
                                step="0.1"
                                type="number"
                                value={editForm.moisture}
                                onChange={(event) =>
                                  updateEditForm("moisture", event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Protein as-fed %
                              <input
                                required
                                min="0"
                                step="0.01"
                                type="number"
                                value={editForm.protein}
                                onChange={(event) =>
                                  updateEditForm("protein", event.target.value)
                                }
                              />
                            </label>
                          </div>

                          <div className="form-row">
                            <label>
                              Fat as-fed %
                              <input
                                required
                                min="0"
                                step="0.01"
                                type="number"
                                value={editForm.fat}
                                onChange={(event) =>
                                  updateEditForm("fat", event.target.value)
                                }
                              />
                            </label>

                            <label>
                              Phosphorus as-fed %
                              <input
                                required
                                min="0"
                                step="0.01"
                                type="number"
                                value={editForm.phosphorus}
                                onChange={(event) =>
                                  updateEditForm("phosphorus", event.target.value)
                                }
                              />
                            </label>
                          </div>

                          <div className="form-row">
                            <label>
                              Sodium as-fed %
                              <input
                                required
                                min="0"
                                step="0.01"
                                type="number"
                                value={editForm.sodium}
                                onChange={(event) =>
                                  updateEditForm("sodium", event.target.value)
                                }
                              />
                            </label>
                          </div>

                          <div className="entry-actions">
                            <button type="submit" disabled={savingEditFoodId === food.id}>
                              {savingEditFoodId === food.id
                                ? "Saving..."
                                : "Save Changes"}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => {
                                setEditingFoodId(null);
                                setEditForm(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <div className="entry-actions food-detail-actions">
                        <button type="button" onClick={() => startEditing(food)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(food.id)}>
                          Delete
                        </button>
                      </div>
                    </section>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          className="add-reference-button"
          onClick={() => setIsAddFormOpen((currentIsOpen) => !currentIsOpen)}
          aria-expanded={isAddFormOpen}
        >
          + Add New Food
        </button>

        {isAddFormOpen ? (
          <form className="ref-card form-compact food-form" onSubmit={handleSubmit}>
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

            <p className="form-section-label">Nutrition values</p>

            <div className="form-row">
              <label>
                Can size (g)
                <input
                  required
                  min="0"
                  step="0.1"
                  type="number"
                  value={canSize}
                  onChange={(event) => setCanSize(event.target.value)}
                  placeholder="156"
                />
              </label>

              <label>
                Calories per can
                <input
                  required
                  min="0"
                  step="0.1"
                  type="number"
                  value={caloriesPerCan}
                  onChange={(event) => setCaloriesPerCan(event.target.value)}
                  placeholder="180"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Moisture %
                <input
                  required
                  min="0"
                  max="99.9"
                  step="0.1"
                  type="number"
                  value={moisture}
                  onChange={(event) => setMoisture(event.target.value)}
                  placeholder="78"
                />
              </label>

              <label>
                Protein as-fed %
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={protein}
                  onChange={(event) => setProtein(event.target.value)}
                  placeholder="10"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Fat as-fed %
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={fat}
                  onChange={(event) => setFat(event.target.value)}
                  placeholder="5"
                />
              </label>

              <label>
                Phosphorus as-fed %
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={phosphorus}
                  onChange={(event) => setPhosphorus(event.target.value)}
                  placeholder="0.2"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Sodium as-fed %
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={sodium}
                  onChange={(event) => setSodium(event.target.value)}
                  placeholder="0.08"
                />
              </label>
            </div>

            <label>
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Texture, flavor, or feeding notes"
              />
            </label>

            <button type="submit" disabled={isSaving}>
              {isSaving ? "Adding..." : "Save Food"}
            </button>
            <button
              type="button"
              className="cancel-link-button"
              onClick={() => {
                resetNewFoodForm();
                setIsAddFormOpen(false);
              }}
            >
              Cancel
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

export default FoodsPage;
