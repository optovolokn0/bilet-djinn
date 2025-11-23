import { Routes, Route, Navigate } from "react-router-dom";
import "../src/App.css";

import LoginPage from "./pages/LoginPage";
import ReaderCatalog from "./pages/reader/ReaderCatalog";
import LibraryCatalog from "./pages/library/LibraryCatalog";
import ReaderLoansPage from "./pages/reader/ReaderLoansPage";

import { ProtectedRoute } from "./routes/ProtectedRoutes";
import EventsPage from "./pages/EventPage";
import MapPage from "./pages/reader/MapPage";
import RegisterReaderPage from "./pages/library/RegisterReaderPage";
import ReturnedLoansPage from "./pages/reader/HistoryPage";
import IssuedBooksPage from "./pages/library/IssuedBooksPage";
import RenewRequestsPage from "./pages/library/RenewRequestsPage";
import RecommendedCatalog from "./pages/reader/RecommendedCatalog";

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
          path="/reader/my-books"
          element={
            <ProtectedRoute role="reader">
              <ReaderLoansPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader/events"
          element={
            <ProtectedRoute role="reader">
              <EventsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader/map"
          element={
            <ProtectedRoute role="reader">
              <MapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader/history"
          element={
            <ProtectedRoute role="reader">
              <ReturnedLoansPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reader/recommendations"
          element={
            <ProtectedRoute role="reader">
              <RecommendedCatalog />
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

        <Route
          path="/library/events"
          element={
            <ProtectedRoute role="library">
              <EventsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library/register-reader"
          element={
            <ProtectedRoute role="library">
              <RegisterReaderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library/issued"
          element={
            <ProtectedRoute role="library">
              <IssuedBooksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library/renew"
          element={
            <ProtectedRoute role="library">
              <RenewRequestsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </main>
  );
}
