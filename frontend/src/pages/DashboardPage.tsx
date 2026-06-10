import { useEffect, useState } from "react";

import { TodayDashboard, getTodayDashboard } from "../api/dashboard";
import { formatLocalTimestamp } from "../utils/dateTime";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function formatOptionalTime(value: string | null | undefined) {
  return value ? formatLocalTimestamp(value) : "No entries yet";
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

  const overviewCards = dashboard
    ? [
        {
          label: "Feedings",
          value: dashboard.feedings_count,
          unit: "",
          detail: dashboard.feedings_count > 0 ? "Food logged today" : "No meals logged",
        },
        {
          label: "Calories",
          value: formatNumber(dashboard.calories_eaten),
          unit: "cal",
          detail: "Calories eaten today",
        },
        {
          label: "Food Eaten",
          value: formatNumber(dashboard.food_eaten_grams),
          unit: "g",
          detail: "Measured intake",
        },
        {
          label: "Phosphorus",
          value: formatNumber(dashboard.phosphorus_consumed_mg),
          unit: "mg",
          detail: "From food entries",
        },
        {
          label: "Sodium",
          value: formatNumber(dashboard.sodium_consumed_mg),
          unit: "mg",
          detail: "From food entries",
        },
        {
          label: "Moisture",
          value: formatNumber(dashboard.moisture_consumed_grams),
          unit: "g",
          detail: "Food moisture",
        },
      ]
    : [];

  const careStatusCards = dashboard
    ? [
        {
          label: "Last Feeding",
          value: formatOptionalTime(dashboard.last_food_entry?.entry_time),
          detail: dashboard.last_food_entry
            ? `${formatNumber(dashboard.last_food_entry.food_eaten_grams)} g, ${formatNumber(
                dashboard.last_food_entry.calories_eaten,
              )} cal`
            : "No food entries recorded",
        },
        {
          label: "Last BM",
          value: formatOptionalTime(dashboard.last_bm_entry?.entry_time),
          detail: dashboard.last_bm_entry
            ? dashboard.last_bm_entry.occurred
              ? "BM occurred"
              : "No BM"
            : "No BM entries recorded",
        },
        {
          label: "Last Fluids",
          value: formatOptionalTime(dashboard.last_fluid_entry?.entry_time),
          detail: dashboard.last_fluid_entry
            ? `${formatNumber(dashboard.last_fluid_entry.amount_ml)} ml`
            : "No Sub-Q fluids recorded",
        },
        {
          label: "Latest Weight",
          value: dashboard.latest_weight_entry
            ? `${formatNumber(dashboard.latest_weight_entry.weight_lbs)} lbs`
            : "No entries yet",
          detail: dashboard.latest_weight_entry
            ? formatLocalTimestamp(dashboard.latest_weight_entry.entry_time)
            : "No weight entries recorded",
        },
        {
          label: "Last Water Observation",
          value: formatOptionalTime(dashboard.last_water_entry?.entry_time),
          detail: dashboard.last_water_entry
            ? "Seen drinking water"
            : "No water observations recorded",
        },
        {
          label: "Water Observations Today",
          value: dashboard.today_water_observation_count,
          detail:
            dashboard.today_water_observation_count === 1
              ? "Observation logged today"
              : "Observations logged today",
        },
      ]
    : [];

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Care Command Center</h1>
        <p>Today&apos;s food, hydration, bathroom, fluids, and weight snapshot.</p>
      </section>

      <section className="dashboard-shell" aria-label="Gizmo care dashboard">
        <div className="section-heading">
          <h2>Today Overview</h2>
          <span>{isLoading ? "Loading..." : dashboard?.date}</span>
        </div>

        {error ? <p className="error-message">{error}</p> : null}

        {!isLoading && !error && dashboard ? (
          <>
            <section className="dashboard-hero">
              <div>
                <p className="eyebrow">Today&apos;s Status</p>
                <h2>{dashboard.feedings_count > 0 ? "Food is logged." : "No food logged yet."}</h2>
                <p>
                  {dashboard.feedings_count > 0
                    ? `${formatNumber(dashboard.calories_eaten)} calories from ${formatNumber(
                        dashboard.food_eaten_grams,
                      )} g of food.`
                    : "Use Food Entries when Gizmo eats so the totals stay current."}
                </p>
              </div>
              <div className="dashboard-hero-stat">
                <strong>{dashboard.today_water_observation_count}</strong>
                <span>water observations today</span>
              </div>
            </section>

            <section className="dashboard-section" aria-labelledby="today-overview">
              <h2 id="today-overview">Today Overview</h2>
              <div className="dashboard-grid overview-grid">
                {overviewCards.map((card) => (
                  <article className="dashboard-card overview-card" key={card.label}>
                    <p>{card.label}</p>
                    <strong>
                      {card.value}
                      {card.unit ? <span> {card.unit}</span> : null}
                    </strong>
                    <small>{card.detail}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section" aria-labelledby="care-status">
              <h2 id="care-status">Care Status</h2>
              <div className="care-status-grid">
                {careStatusCards.map((card) => (
                  <article className="status-card" key={card.label}>
                    <p>{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.detail}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section" aria-labelledby="recent-care">
              <div className="section-heading">
                <h2 id="recent-care">Recent Care Activity</h2>
                <span>{dashboard.recent_activity.length}</span>
              </div>

              {dashboard.recent_activity.length === 0 ? (
                <p className="empty-state">No recent care activity recorded yet.</p>
              ) : (
                <div className="activity-list">
                  {dashboard.recent_activity.map((item) => (
                    <article
                      className={`activity-item activity-${item.type}`}
                      key={`${item.type}-${item.entry_time}-${item.summary}`}
                    >
                      <div className="activity-marker" aria-hidden="true" />
                      <div>
                        <p>{item.title}</p>
                        <h3>{item.summary}</h3>
                        <span>{formatLocalTimestamp(item.entry_time)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

export default DashboardPage;
