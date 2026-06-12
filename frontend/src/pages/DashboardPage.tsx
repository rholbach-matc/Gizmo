import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Bowl, getBowls } from "../api/bowls";
import { TodayDashboard, getTodayDashboard } from "../api/dashboard";
import { FoodEntry, finishFoodEntry, getFoodEntries } from "../api/foodEntries";
import { Food, getFoods } from "../api/foods";
import { formatLocalTimestamp, sortByEntryTimeDescending } from "../utils/dateTime";

const CALORIE_GOAL = 190;

type IconName =
  | "activity"
  | "bowl"
  | "check"
  | "droplet"
  | "flame"
  | "pill"
  | "triangle"
  | "x";

function formatNumber(value: number) {
  return Number(value.toFixed(2));
}

function formatTime(value: string) {
  return new Date(normalizeTimestamp(value)).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value: string) {
  return new Date(normalizeTimestamp(value)).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatDateChip() {
  return new Date().toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function normalizeTimestamp(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function entryLocalDateKey(entryTime: string) {
  return localDateKey(new Date(normalizeTimestamp(entryTime)));
}

function getFoodName(foods: Food[], foodId: number, fallbackName?: string) {
  const food = foods.find((currentFood) => currentFood.id === foodId);
  if (!food) {
    return fallbackName ?? "Unknown Food";
  }

  return food.brand ? `${food.name} - ${food.brand}` : food.name;
}

function getBowlName(bowls: Bowl[], bowlId: number) {
  return bowls.find((bowl) => bowl.id === bowlId)?.name ?? "Unknown bowl";
}

function daysSince(entryTime: string) {
  const entryDate = new Date(normalizeTimestamp(entryTime));
  const today = new Date();
  const startOfEntryDay = new Date(
    entryDate.getFullYear(),
    entryDate.getMonth(),
    entryDate.getDate(),
  );
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.max(
    0,
    Math.floor(
      (startOfToday.getTime() - startOfEntryDay.getTime()) / 86_400_000,
    ),
  );
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    activity: (
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    ),
    bowl: (
      <>
        <path d="M4 11h16" />
        <path d="M6 11a6 6 0 0 0 12 0" />
        <path d="M8 17h8" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
    droplet: <path d="M12 2s7 7 7 13a7 7 0 0 1-14 0c0-6 7-13 7-13z" />,
    flame: (
      <path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 4-2 4 0-4-3-7-3-7-1 4-5 6-5 10 0 4 3 7 7 7z" />
    ),
    pill: (
      <>
        <path d="M10 21 21 10a5 5 0 0 0-7-7L3 14a5 5 0 0 0 7 7z" />
        <path d="m8 8 8 8" />
      </>
    ),
    triangle: (
      <>
        <path d="M12 3 2 20h20L12 3z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="care-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

type DashboardPageProps = {
  onDateChipClick: () => void;
};

function DashboardPage({ onDateChipClick }: DashboardPageProps) {
  const [dashboard, setDashboard] = useState<TodayDashboard | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [bowls, setBowls] = useState<Bowl[]>([]);
  const [finishEntry, setFinishEntry] = useState<FoodEntry | null>(null);
  const [finishWeight, setFinishWeight] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError(null);
      const [
        loadedDashboard,
        loadedFoodEntries,
        loadedFoods,
        loadedBowls,
      ] = await Promise.all([
        getTodayDashboard(),
        getFoodEntries(),
        getFoods(),
        getBowls(),
      ]);

      setDashboard(loadedDashboard);
      setFoodEntries(sortByEntryTimeDescending(loadedFoodEntries));
      setFoods(loadedFoods);
      setBowls(loadedBowls);
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

  async function handleFinish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!finishEntry) {
      return;
    }

    try {
      setIsFinishing(true);
      setError(null);
      await finishFoodEntry(finishEntry.id, {
        ending_total_weight_grams: Number(finishWeight),
      });
      setFinishEntry(null);
      setFinishWeight("");
      await loadDashboard();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not finish food entry.",
      );
    } finally {
      setIsFinishing(false);
    }
  }

  const todayKey = localDateKey(new Date());
  const openFeedings = foodEntries.filter((entry) => entry.is_open);
  const visibleOpenFeedings = openFeedings.slice(0, 3);
  const caloriePercent = dashboard
    ? Math.min(100, Math.round((dashboard.calories_eaten / CALORIE_GOAL) * 100))
    : 0;

  const trendDays = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      return {
        calories: 0,
        key: localDateKey(date),
        label: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      };
    });

    const dayLookup = new Map(days.map((day) => [day.key, day]));

    foodEntries.forEach((entry) => {
      if (entry.is_open || entry.calories_eaten === null) {
        return;
      }

      const day = dayLookup.get(entryLocalDateKey(entry.entry_time));
      if (day) {
        day.calories += entry.calories_eaten;
      }
    });

    return days;
  }, [foodEntries]);

  const trendDataDays = trendDays.filter((day) => day.calories > 0).length;
  const trendMax = Math.max(...trendDays.map((day) => day.calories), CALORIE_GOAL);

  const medicationsLogged = (dashboard?.today_medication_count ?? 0) > 0;
  const bmLogged = (dashboard?.today_bm_count ?? 0) > 0;
  const lastFluidEntry = dashboard?.last_fluid_entry ?? null;
  const fluidDaysAgo = lastFluidEntry ? daysSince(lastFluidEntry.entry_time) : null;
  const fluidsOverdue = fluidDaysAgo !== null && fluidDaysAgo > 4;

  return (
    <main className="app dashboard-app">
      <section className="page-header dashboard-page-header">
        <div>
          <p className="eyebrow">Gizmo</p>
          <h1>Today</h1>
        </div>
        <button
          type="button"
          className="date-chip date-chip-button"
          onClick={onDateChipClick}
        >
          {formatDateChip()}
        </button>
      </section>

      <section className="dashboard-shell" aria-label="Gizmo care dashboard">
        {error ? <p className="error-message">{error}</p> : null}

        {isLoading ? <p className="empty-state">Loading dashboard...</p> : null}

        {!isLoading && !error && dashboard ? (
          <>
            <section className="today-overview-card" aria-label="Today overview">
              <div className="today-metric-grid">
                <article className="today-metric">
                  <Icon name="flame" />
                  <strong>{formatNumber(dashboard.calories_eaten)}</strong>
                  <span>kcal</span>
                  <small>
                    Calories
                    {dashboard.yesterday_calories_eaten !== null ? (
                      <em>
                        Yesterday: {formatNumber(dashboard.yesterday_calories_eaten)} kcal
                      </em>
                    ) : null}
                  </small>
                </article>
                <article className="today-metric">
                  <Icon name="bowl" />
                  <strong>
                    {dashboard.open_feedings_count} / {dashboard.feedings_count}
                  </strong>
                  <span>open / done</span>
                  <small>Food entries</small>
                </article>
                <article className="today-metric">
                  <Icon name="activity" />
                  <div className="behavior-counts">
                    <strong>Episodes: {dashboard.today_episode_count}</strong>
                    <strong>
                      Yowls: {dashboard.today_yowling_observation_count}
                    </strong>
                  </div>
                  <small>Behavior</small>
                </article>
                <article className="today-metric">
                  <Icon name="droplet" />
                  <strong>{dashboard.today_water_observation_count}</strong>
                  <span>seen</span>
                  <small>Water observations</small>
                </article>
              </div>

              <div className="calorie-goal">
                <div>
                  <span>Calorie goal</span>
                  <strong>
                    {formatNumber(dashboard.calories_eaten)} / {CALORIE_GOAL} kcal ·{" "}
                    {caloriePercent}%
                  </strong>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${caloriePercent}%` }} />
                </div>
              </div>
            </section>

            <section className="status-strip" aria-label="Care status">
              <article
                className={`status-box ${medicationsLogged ? "status-ok" : "status-neutral"}`}
              >
                <Icon name="pill" />
                <p>Medications</p>
                <strong>{medicationsLogged ? "Given" : "None today"}</strong>
                <span>
                  {medicationsLogged && dashboard.latest_medication_entry
                    ? formatTime(dashboard.latest_medication_entry.entry_time)
                    : "No medication logged today"}
                </span>
              </article>

              <article
                className={`status-box ${
                  lastFluidEntry
                    ? fluidsOverdue
                      ? "status-warning"
                      : "status-ok"
                    : "status-neutral"
                }`}
              >
                <Icon name={fluidsOverdue ? "triangle" : "droplet"} />
                <p>Fluids</p>
                <strong>
                  {lastFluidEntry
                    ? fluidsOverdue
                      ? "Overdue"
                      : formatShortDate(lastFluidEntry.entry_time)
                    : "None yet"}
                </strong>
                <span>
                  {lastFluidEntry
                    ? fluidDaysAgo === 0
                      ? "Today"
                      : `${fluidDaysAgo} ${fluidDaysAgo === 1 ? "day" : "days"} ago`
                    : "No fluids entries recorded"}
                </span>
              </article>

              <article className={`status-box ${bmLogged ? "status-ok" : "status-neutral"}`}>
                <Icon name={bmLogged ? "check" : "x"} />
                <p>BM</p>
                <strong>{bmLogged ? "Yes" : "None today"}</strong>
                <span>
                  {bmLogged && dashboard.last_bm_entry
                    ? formatTime(dashboard.last_bm_entry.entry_time)
                    : "No BM logged today"}
                </span>
              </article>
            </section>

            {openFeedings.length > 0 ? (
              <section className="open-feedings" aria-label="Open feedings">
                {visibleOpenFeedings.map((entry) => (
                  <article className="open-feeding-item" key={entry.id}>
                    <div>
                      <strong>{getFoodName(foods, entry.food_id, entry.food_name)}</strong>
                      <span>
                        {getBowlName(bowls, entry.bowl_id)} ·{" "}
                        {formatNumber(entry.starting_total_weight_grams)} g ·{" "}
                        {formatTime(entry.entry_time)}
                      </span>
                    </div>
                    <button type="button" onClick={() => setFinishEntry(entry)}>
                      Finish
                    </button>
                  </article>
                ))}
                {openFeedings.length > 3 ? (
                  <p className="open-feedings-more">
                    +{openFeedings.length - 3} more open feedings
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className="trend-card" aria-labelledby="calorie-trend-title">
              <h2 id="calorie-trend-title">7-day calorie trend</h2>
              {trendDataDays === 0 ? (
                <p className="trend-empty">Not enough data yet</p>
              ) : (
                <>
                  <div className="trend-bars" aria-hidden="true">
                    {trendDays.map((day) => (
                      <div
                        className={day.key === todayKey ? "today" : ""}
                        key={day.key}
                      >
                        <small className="trend-calorie-label">
                          {day.calories > 0 ? formatNumber(day.calories) : ""}
                        </small>
                        <span
                          style={{
                            height: `${Math.max(6, (day.calories / trendMax) * 48)}px`,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="trend-labels">
                    <span>{trendDays[0]?.label}</span>
                    <span>today</span>
                  </div>
                </>
              )}
            </section>

            <section className="timeline-section" aria-labelledby="timeline-title">
              <p className="eyebrow" id="timeline-title">
                Timeline
              </p>

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
                        <span>{formatLocalTimestamp(item.entry_time)}</span>
                        {item.details ? <small>{item.details}</small> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {finishEntry ? (
              <div className="modal-backdrop" role="presentation">
                <form className="finish-modal" onSubmit={handleFinish}>
                  <h2>Finish Feeding</h2>
                  <p>
                    {getFoodName(foods, finishEntry.food_id, finishEntry.food_name)} ·{" "}
                    {getBowlName(bowls, finishEntry.bowl_id)}
                  </p>
                  <label>
                    Ending Weight (grams)
                    <input
                      required
                      min="0"
                      step="0.1"
                      type="number"
                      value={finishWeight}
                      onChange={(event) => setFinishWeight(event.target.value)}
                      placeholder="180"
                    />
                  </label>
                  <div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setFinishEntry(null);
                        setFinishWeight("");
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={isFinishing}>
                      {isFinishing ? "Finishing..." : "Finish"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

export default DashboardPage;
