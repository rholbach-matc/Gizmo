import { useState } from "react";

import BMTrackerPage from "./pages/BMTrackerPage";
import BowlsPage from "./pages/BowlsPage";
import DashboardPage from "./pages/DashboardPage";
import FoodEntriesPage from "./pages/FoodEntriesPage";
import FoodsPage from "./pages/FoodsPage";
import FluidsTrackerPage from "./pages/FluidsTrackerPage";
import WeightTrackerPage from "./pages/WeightTrackerPage";

type Page =
  | "dashboard"
  | "foodEntries"
  | "bmTracker"
  | "fluidsTracker"
  | "weightTracker"
  | "foods"
  | "bowls";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <>
      <nav className="page-tabs" aria-label="Gizmo sections">
        <button
          type="button"
          className={currentPage === "dashboard" ? "active" : ""}
          onClick={() => setCurrentPage("dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={currentPage === "foodEntries" ? "active" : ""}
          onClick={() => setCurrentPage("foodEntries")}
        >
          Food Entries
        </button>
        <button
          type="button"
          className={currentPage === "bmTracker" ? "active" : ""}
          onClick={() => setCurrentPage("bmTracker")}
        >
          BM Tracker
        </button>
        <button
          type="button"
          className={currentPage === "fluidsTracker" ? "active" : ""}
          onClick={() => setCurrentPage("fluidsTracker")}
        >
          Fluids Tracker
        </button>
        <button
          type="button"
          className={currentPage === "weightTracker" ? "active" : ""}
          onClick={() => setCurrentPage("weightTracker")}
        >
          Weight Tracker
        </button>
        <button
          type="button"
          className={currentPage === "foods" ? "active" : ""}
          onClick={() => setCurrentPage("foods")}
        >
          Foods
        </button>
        <button
          type="button"
          className={currentPage === "bowls" ? "active" : ""}
          onClick={() => setCurrentPage("bowls")}
        >
          Bowls
        </button>
      </nav>

      {currentPage === "dashboard" ? <DashboardPage /> : null}
      {currentPage === "foodEntries" ? <FoodEntriesPage /> : null}
      {currentPage === "bmTracker" ? <BMTrackerPage /> : null}
      {currentPage === "fluidsTracker" ? <FluidsTrackerPage /> : null}
      {currentPage === "weightTracker" ? <WeightTrackerPage /> : null}
      {currentPage === "foods" ? <FoodsPage /> : null}
      {currentPage === "bowls" ? <BowlsPage /> : null}
    </>
  );
}

export default App;
