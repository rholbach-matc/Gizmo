import { useEffect, useState } from "react";

import { TodayDashboard, getTodayDashboard } from "../api/dashboard";
import { formatLocalTimestamp } from "../utils/dateTime";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function formatOptionalTime(value: string | null | undefined) {
  return value ? formatLocalTimestamp(value) : "No entries yet";
}

function formatCount(value: number, singular: string, plural: string) {
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
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
          label: "Last Episode",
          value: formatOptionalTime(dashboard.latest_episode_entry?.entry_time),
          detail: dashboard.latest_episode_entry
            ? dashboard.latest_episode_entry.severity || "Episode logged"
            : "No episodes recorded",
        },
        {
          label: "Last Medication",
          value: formatOptionalTime(dashboard.latest_medication_entry?.entry_time),
          detail: dashboard.latest_medication_entry
            ? dashboard.latest_medication_entry.medication_name
            : "No medications recorded",
        },
        {
          label: "Last Vet Visit",
          value: formatOptionalTime(dashboard.latest_vet_visit_entry?.entry_time),
          detail: dashboard.latest_vet_visit_entry
            ? dashboard.latest_vet_visit_entry.reason || "Vet visit logged"
            : "No vet visits recorded",
        },
      ]
    : [];

  const careSummaryCards = dashboard
    ? [
        {
          label: "Food",
          value: dashboard.feedings_count > 0 ? "Yes" : "No",
          detail: formatCount(dashboard.feedings_count, "feeding", "feedings"),
          tone: dashboard.feedings_count > 0 ? "good" : "quiet",
        },
        {
          label: "BM",
          value: dashboard.today_bm_count > 0 ? "Yes" : "No",
          detail: formatCount(dashboard.today_bm_count, "BM", "BMs"),
          tone: dashboard.today_bm_count > 0 ? "good" : "quiet",
        },
        {
          label: "Fluids",
          value: dashboard.today_fluid_count > 0 ? "Yes" : "No",
          detail: formatCount(dashboard.today_fluid_count, "entry", "entries"),
          tone: dashboard.today_fluid_count > 0 ? "good" : "quiet",
        },
        {
          label: "Water",
          value: dashboard.today_water_observation_count > 0 ? "Yes" : "No",
          detail: formatCount(
            dashboard.today_water_observation_count,
            "observation",
            "observations",
          ),
          tone: dashboard.today_water_observation_count > 0 ? "good" : "quiet",
        },
        {
          label: "Medications",
          value: dashboard.today_medication_count > 0 ? "Yes" : "No",
          detail: formatCount(dashboard.today_medication_count, "entry", "entries"),
          tone: dashboard.today_medication_count > 0 ? "good" : "quiet",
        },
        {
          label: "Episodes",
          value: dashboard.today_episode_count > 0 ? "Yes" : "No",
          detail: formatCount(dashboard.today_episode_count, "episode", "episodes"),
          tone: dashboard.today_episode_count > 0 ? "watch" : "quiet",
        },
      ]
    : [];

  return (
    <main className="app">
      <section className="page-header">
        <p className="eyebrow">Gizmo</p>
        <h1>Care Dashboard</h1>
        <p>Today&apos;s care, latest status, and recent activity in one place.</p>
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
                <h2>
                  {dashboard.feedings_count > 0
                    ? "Food is logged today."
                    : "No food logged yet today."}
                </h2>
                <p>
                  {dashboard.feedings_count > 0
                    ? `${formatNumber(dashboard.calories_eaten)} calories from ${formatNumber(
                        dashboard.food_eaten_grams,
                      )} g of food.`
                    : "Use Food Entries when Gizmo eats so the totals stay current."}
                </p>
              </div>
              <div className="dashboard-hero-stat">
                <strong>{dashboard.recent_activity.length}</strong>
                <span>recent care events</span>
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

            <section className="dashboard-section" aria-labelledby="care-summary">
              <h2 id="care-summary">Today&apos;s Care Summary</h2>
              <div className="care-summary-grid">
                {careSummaryCards.map((card) => (
                  <article
                    className={`care-summary-card summary-${card.tone}`}
                    key={card.label}
                  >
                    <p>{card.label}</p>
                    <strong>{card.value}</strong>
                    <span>{card.detail}</span>
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
                <h2 id="recent-care">Unified Care Timeline</h2>
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
                        <p>
                          <span className="activity-badge">{item.title}</span>
                        </p>
                        <h3>{item.summary}</h3>
                        {item.details ? <small>{item.details}</small> : null}
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
