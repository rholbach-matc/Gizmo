import { useEffect, useState } from "react";

import { TodayDashboard, getTodayDashboard } from "../api/dashboard";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState<TodayDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError(null);
      const loadedDashboard = await getTodayDashboard();
      setDashboard(loadedDashboard);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load today's dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summaryCards = dashboard
    ? [
        {
          label: "Feedings Count",
          value: dashboard.feedings_count,
          unit: "",
        },
        {
          label: "Food Eaten",
          value: formatNumber(dashboard.food_eaten_grams),
          unit: "g",
        },
        {
          label: "Calories",
          value: formatNumber(dashboard.calories_eaten),
          unit: "cal",
        },
        {
          label: "Protein",
          value: formatNumber(dashboard.protein_consumed_grams),
          unit: "g",
        },
        {
          label: "Fat",
          value: formatNumber(dashboard.fat_consumed_grams),
          unit: "g",
        },
        {
          label: "Phosphorus",
          value: formatNumber(dashboard.phosphorus_consumed_mg),
          unit: "mg",
        },
        {
          label: "Sodium",
          value: formatNumber(dashboard.sodium_consumed_mg),
          unit: "mg",
        },
        {
          label: "Moisture",
          value: formatNumber(dashboard.moisture_consumed_grams),
          unit: "g",
        },
        {
          label: "Dry Matter",
          value: formatNumber(dashboard.dry_matter_consumed_grams),
          unit: "g",
        },
      ]
    : [];

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Dashboard</h1>
        <p>Today&apos;s meal and nutrition totals.</p>
      </section>

      <section className="panel dashboard-panel">
        <div className="section-heading">
          <h2>Today</h2>
          <span>{isLoading ? "Loading..." : dashboard?.date}</span>
        </div>

        {error ? <p className="error-message">{error}</p> : null}

        {!isLoading && !error && dashboard ? (
          <div className="dashboard-grid">
            {summaryCards.map((card) => (
              <article className="dashboard-card" key={card.label}>
                <p>{card.label}</p>
                <strong>
                  {card.value}
                  {card.unit ? <span> {card.unit}</span> : null}
                </strong>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default DashboardPage;
