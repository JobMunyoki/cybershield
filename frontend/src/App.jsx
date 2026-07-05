import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Incidents from "./pages/Incidents";
import Vulnerabilities from "./pages/Vulnerabilities";
import ReportIncident from "./pages/ReportIncident";
import AddVulnerability from "./pages/AddVulnerability";
import AddAsset from "./pages/AddAsset";
import AuditLogs from "./pages/AuditLogs";
import EditIncident from "./pages/EditIncident";
import EditVulnerability from "./pages/EditVulnerability";
import EditAsset from "./pages/EditAsset";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <Assets />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/new"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AddAsset />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assets/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <EditAsset />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <Incidents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents/new"
          element={
            <ProtectedRoute>
              <ReportIncident />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Security Analyst"]}>
              <EditIncident />
            </ProtectedRoute>
          }
        />

      <Route
        path="/vulnerabilities"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Security Analyst"]}>
            <Vulnerabilities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vulnerabilities/new"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Security Analyst"]}>
            <AddVulnerability />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vulnerabilities/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Security Analyst"]}>
            <EditVulnerability />
          </ProtectedRoute>
        }
      />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Security Analyst"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;