import { useState } from "react";
import type { ReactNode } from "react";

import BMTrackerPage from "./pages/BMTrackerPage";
import BowlsPage from "./pages/BowlsPage";
import DashboardPage from "./pages/DashboardPage";
import EpisodesPage from "./pages/EpisodesPage";
import FoodEntriesPage from "./pages/FoodEntriesPage";
import FoodsPage from "./pages/FoodsPage";
import FluidsTrackerPage from "./pages/FluidsTrackerPage";
import HydrationPage from "./pages/HydrationPage";
import MedicationsPage from "./pages/MedicationsPage";
import VetVisitsPage from "./pages/VetVisitsPage";
import WeightTrackerPage from "./pages/WeightTrackerPage";

type Page =
  | "dashboard"
  | "foodEntries"
  | "episodes"
  | "medications"
  | "vetVisits"
  | "bmTracker"
  | "fluidsTracker"
  | "hydration"
  | "weightTracker"
  | "foods"
  | "bowls";

type NavIcon = "activity" | "bowl" | "dots" | "droplet" | "home";

function NavIconSvg({ name }: { name: NavIcon }) {
  const paths: Record<NavIcon, ReactNode> = {
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    bowl: (
      <>
        <path d="M4 11h16" />
        <path d="M6 11a6 6 0 0 0 12 0" />
        <path d="M8 17h8" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </>
    ),
    droplet: <path d="M12 2s7 7 7 13a7 7 0 0 1-14 0c0-6 7-13 7-13z" />,
    home: (
      <>
        <path d="M3 11 12 3l9 8" />
        <path d="M5 10v10h14V10" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="bottom-nav-icon"
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

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  function navigate(page: Page) {
    setCurrentPage(page);
    setIsMoreOpen(false);
  }

  const morePages: { label: string; page: Page }[] = [
    { label: "Vet Visits", page: "vetVisits" },
    { label: "BM Tracker", page: "bmTracker" },
    { label: "Fluids Tracker", page: "fluidsTracker" },
    { label: "Weight Tracker", page: "weightTracker" },
    { label: "Foods", page: "foods" },
    { label: "Bowls", page: "bowls" },
    { label: "Medications", page: "medications" },
  ];
  const isMoreActive = morePages.some((item) => item.page === currentPage);

  return (
    <>
      <nav className="page-tabs" aria-label="Gizmo sections">
        <button
          type="button"
          className={currentPage === "dashboard" ? "active" : ""}
          onClick={() => navigate("dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={currentPage === "foodEntries" ? "active" : ""}
          onClick={() => navigate("foodEntries")}
        >
          Food Entries
        </button>
        <button
          type="button"
          className={currentPage === "episodes" ? "active" : ""}
          onClick={() => navigate("episodes")}
        >
          Episodes
        </button>
        <button
          type="button"
          className={currentPage === "medications" ? "active" : ""}
          onClick={() => navigate("medications")}
        >
          Medications
        </button>
        <button
          type="button"
          className={currentPage === "vetVisits" ? "active" : ""}
          onClick={() => navigate("vetVisits")}
        >
          Vet Visits
        </button>
        <button
          type="button"
          className={currentPage === "bmTracker" ? "active" : ""}
          onClick={() => navigate("bmTracker")}
        >
          BM Tracker
        </button>
        <button
          type="button"
          className={currentPage === "fluidsTracker" ? "active" : ""}
          onClick={() => navigate("fluidsTracker")}
        >
          Fluids Tracker
        </button>
        <button
          type="button"
          className={currentPage === "hydration" ? "active" : ""}
          onClick={() => navigate("hydration")}
        >
          Hydration
        </button>
        <button
          type="button"
          className={currentPage === "weightTracker" ? "active" : ""}
          onClick={() => navigate("weightTracker")}
        >
          Weight Tracker
        </button>
        <button
          type="button"
          className={currentPage === "foods" ? "active" : ""}
          onClick={() => navigate("foods")}
        >
          Foods
        </button>
        <button
          type="button"
          className={currentPage === "bowls" ? "active" : ""}
          onClick={() => navigate("bowls")}
        >
          Bowls
        </button>
      </nav>

      {currentPage === "dashboard" ? <DashboardPage /> : null}
      {currentPage === "foodEntries" ? <FoodEntriesPage /> : null}
      {currentPage === "episodes" ? <EpisodesPage /> : null}
      {currentPage === "medications" ? <MedicationsPage /> : null}
      {currentPage === "vetVisits" ? <VetVisitsPage /> : null}
      {currentPage === "bmTracker" ? <BMTrackerPage /> : null}
      {currentPage === "fluidsTracker" ? <FluidsTrackerPage /> : null}
      {currentPage === "hydration" ? <HydrationPage /> : null}
      {currentPage === "weightTracker" ? <WeightTrackerPage /> : null}
      {currentPage === "foods" ? <FoodsPage /> : null}
      {currentPage === "bowls" ? <BowlsPage /> : null}

      {isMoreOpen ? (
        <div className="more-drawer" aria-label="More sections">
          {morePages.map((item) => (
            <button
              type="button"
              className={currentPage === item.page ? "active" : ""}
              key={item.page}
              onClick={() => navigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <nav className="bottom-nav" aria-label="Primary mobile sections">
        <button
          type="button"
          className={currentPage === "dashboard" ? "active" : ""}
          onClick={() => navigate("dashboard")}
        >
          <NavIconSvg name="home" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={currentPage === "episodes" ? "active" : ""}
          onClick={() => navigate("episodes")}
        >
          <NavIconSvg name="activity" />
          <span>Episodes</span>
        </button>
        <button
          type="button"
          className={currentPage === "foodEntries" ? "active" : ""}
          onClick={() => navigate("foodEntries")}
        >
          <NavIconSvg name="bowl" />
          <span>Feed</span>
        </button>
        <button
          type="button"
          className={currentPage === "hydration" ? "active" : ""}
          onClick={() => navigate("hydration")}
        >
          <NavIconSvg name="droplet" />
          <span>Hydration</span>
        </button>
        <button
          type="button"
          className={isMoreActive || isMoreOpen ? "active" : ""}
          onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
        >
          <NavIconSvg name="dots" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default App;
