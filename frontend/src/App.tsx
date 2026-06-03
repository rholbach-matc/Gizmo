import { useState } from "react";

import BowlsPage from "./pages/BowlsPage";
import FoodsPage from "./pages/FoodsPage";

function App() {
  const [currentPage, setCurrentPage] = useState<"bowls" | "foods">("bowls");

  return (
    <>
      <nav className="page-tabs" aria-label="Gizmo sections">
        <button
          type="button"
          className={currentPage === "bowls" ? "active" : ""}
          onClick={() => setCurrentPage("bowls")}
        >
          Bowls
        </button>
        <button
          type="button"
          className={currentPage === "foods" ? "active" : ""}
          onClick={() => setCurrentPage("foods")}
        >
          Foods
        </button>
      </nav>

      {currentPage === "bowls" ? <BowlsPage /> : <FoodsPage />}
    </>
  );
}

export default App;
