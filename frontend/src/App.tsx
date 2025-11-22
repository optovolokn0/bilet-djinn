import { Routes, Route, Navigate } from "react-router-dom";
import "../src/App.css";

import LoginPage from "./pages/LoginPage";
import ReaderCatalog from "./pages/reader/ReaderCatalog";
import LibraryCatalog from "./pages/library/LibraryCatalog";
import ReaderEvents from "./components/EventsList";
import ReaderLoansPage from "./pages/reader/ReaderLoansPage";

import { ProtectedRoute } from "./routes/ProtectedRoutes";

export default function App() {
  return (
    <main>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- Reader routes --- */}
        <Route
          path="/reader/catalog"
          element={
            <ProtectedRoute role="reader">
              <ReaderCatalog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader/events"
          element={
            <ProtectedRoute role="reader">
              <ReaderEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader/my-books"
          element={
            <ProtectedRoute role="reader">
              <ReaderLoansPage />
            </ProtectedRoute>
          }
        />

        {/* --- Library routes --- */}
        <Route
          path="/library/catalog"
          element={
            <ProtectedRoute role="library">
              <LibraryCatalog />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </main>
  );
}
