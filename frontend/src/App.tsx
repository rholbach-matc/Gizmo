import { useState } from "react";

import BowlsPage from "./pages/BowlsPage";
import FoodEntriesPage from "./pages/FoodEntriesPage";
import FoodsPage from "./pages/FoodsPage";

type Page = "foodEntries" | "foods" | "bowls";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("foodEntries");

  return (
    <>
      <nav className="page-tabs" aria-label="Gizmo sections">
        <button
          type="button"
          className={currentPage === "foodEntries" ? "active" : ""}
          onClick={() => setCurrentPage("foodEntries")}
        >
          Food Entries
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

      {currentPage === "foodEntries" ? <FoodEntriesPage /> : null}
      {currentPage === "foods" ? <FoodsPage /> : null}
      {currentPage === "bowls" ? <BowlsPage /> : null}
    </>
  );
}

export default App;
