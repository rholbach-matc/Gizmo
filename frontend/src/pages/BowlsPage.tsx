import { FormEvent, useEffect, useState } from "react";

import { Bowl, createBowl, deleteBowl, getBowls } from "../api/bowls";

function BowlsPage() {
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [name, setName] = useState("");
  const [emptyWeight, setEmptyWeight] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBowls() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedBowls = await getBowls();
      setBowls(loadedBowls);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not load bowls.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBowls();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError(null);

      const newBowl = await createBowl({
        name,
        empty_weight_grams: Number(emptyWeight),
        color: color.trim() || null,
        notes: notes.trim() || null,
      });

      setBowls((currentBowls) => [...currentBowls, newBowl]);
      setName("");
      setEmptyWeight("");
      setColor("");
      setNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not create bowl.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(bowlId: number) {
    if (!window.confirm("Delete this bowl?")) {
      return;
    }

    try {
      setError(null);
      await deleteBowl(bowlId);
      setBowls((currentBowls) =>
        currentBowls.filter((bowl) => bowl.id !== bowlId),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not delete bowl.",
      );
    }
  }

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Bowls</h1>
      </section>

      <section className="content-grid" aria-label="Bowl management">
        <form className="panel bowl-form" onSubmit={handleSubmit}>
          <h2>Add a Bowl</h2>

          <label>
            Name
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Kitchen bowl"
            />
          </label>

          <label>
            Empty weight in grams
            <input
              required
              min="0"
              step="0.1"
              type="number"
              value={emptyWeight}
              onChange={(event) => setEmptyWeight(event.target.value)}
              placeholder="120"
            />
          </label>

          <label>
            Color
            <input
              type="text"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="Blue"
            />
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ceramic, wide rim"
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Adding..." : "Add Bowl"}
          </button>
        </form>

        <section className="panel">
          <div className="section-heading">
            <h2>Saved Bowls</h2>
            {isLoading ? <span>Loading...</span> : <span>{bowls.length}</span>}
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          {!isLoading && bowls.length === 0 ? (
            <p className="empty-state">No bowls saved yet.</p>
          ) : null}

          <div className="bowl-list">
            {bowls.map((bowl) => (
              <article className="bowl-card" key={bowl.id}>
                <div>
                  <h3>{bowl.name}</h3>
                  <p>{bowl.empty_weight_grams} g empty</p>
                </div>

                {bowl.color ? <p>Color: {bowl.color}</p> : null}
                {bowl.notes ? <p>{bowl.notes}</p> : null}

                <button type="button" onClick={() => handleDelete(bowl.id)}>
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

export default BowlsPage;
