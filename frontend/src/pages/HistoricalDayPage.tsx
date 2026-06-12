import { useEffect, useState } from "react";

import { DayDashboard, getDayDashboard } from "../api/dashboard";
import { formatLocalTimestamp } from "../utils/dateTime";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromOffset(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return localDateKey(date);
}

function formatPageDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type HistoricalDayPageProps = {
  onTodaySelected: () => void;
};

function HistoricalDayPage({ onTodaySelected }: HistoricalDayPageProps) {
  const todayKey = localDateKey(new Date());
  const latestSelectableDate = dateFromOffset(1);
  const [selectedDate, setSelectedDate] = useState(latestSelectableDate);
  const [dashboard, setDashboard] = useState<DayDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate >= todayKey) {
      onTodaySelected();
      return;
    }

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);
        setDashboard(await getDayDashboard(selectedDate));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load historical dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [onTodaySelected, selectedDate, todayKey]);

  function updateSelectedDate(value: string) {
    if (value >= todayKey) {
      onTodaySelected();
      return;
    }

    setSelectedDate(value);
  }

  return (
    <main className="app dashboard-app historical-day-app">
      <section className="page-header dashboard-page-header historical-day-header">
        <div>
          <p className="eyebrow">Historical Day</p>
          <h1>{formatPageDate(selectedDate)}</h1>
        </div>
        <label className="historical-date-picker">
          <span>Date</span>
          <input
            type="date"
            max={latestSelectableDate}
            value={selectedDate}
            onChange={(event) => updateSelectedDate(event.target.value)}
          />
        </label>
      </section>

      <section className="dashboard-shell" aria-label="Historical care dashboard">
        {error ? <p className="error-message">{error}</p> : null}
        {isLoading ? <p className="empty-state">Loading day...</p> : null}

        {!isLoading && !error && dashboard ? (
          <>
            <section className="today-overview-card" aria-label="Day summary">
              <div className="today-metric-grid historical-summary-grid">
                <article className="today-metric">
                  <strong>{formatNumber(dashboard.calories_eaten)}</strong>
                  <span>kcal</span>
                  <small>Calories</small>
                </article>
                <article className="today-metric">
                  <strong>{dashboard.feedings_count}</strong>
                  <span>done</span>
                  <small>Food entries</small>
                </article>
                <article className="today-metric">
                  <strong>{dashboard.bm_count}</strong>
                  <span>logged</span>
                  <small>BM</small>
                </article>
                <article className="today-metric">
                  <strong>{dashboard.water_observation_count}</strong>
                  <span>seen</span>
                  <small>Water observations</small>
                </article>
                <article className="today-metric">
                  <strong>{dashboard.episode_count}</strong>
                  <span>logged</span>
                  <small>Episodes</small>
                </article>
                <article className="today-metric">
                  <strong>{dashboard.medication_count}</strong>
                  <span>given</span>
                  <small>Medications</small>
                </article>
                <article className="today-metric">
                  <strong>{dashboard.fluids_given ? "Yes" : "No"}</strong>
                  <span>fluids</span>
                  <small>Fluids given</small>
                </article>
                <article className="today-metric">
                  <strong>
                    {dashboard.latest_weight_entry
                      ? formatNumber(dashboard.latest_weight_entry.weight_lbs)
                      : "--"}
                  </strong>
                  <span>lbs</span>
                  <small>Latest weight</small>
                </article>
              </div>
            </section>

            <section className="timeline-section" aria-labelledby="historical-timeline-title">
              <p className="eyebrow" id="historical-timeline-title">
                Timeline
              </p>

              {dashboard.activity.length === 0 ? (
                <p className="empty-state">No care activity recorded for this date.</p>
              ) : (
                <div className="activity-list">
                  {dashboard.activity.map((item) => (
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
                        <span>{formatLocalTimestamp(item.entry_time)}</span>
                        {item.details ? <small>{item.details}</small> : null}
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

export default HistoricalDayPage;
