import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import CreateRequest from "./pages/CreateRequest";
import EditRequest from "./pages/EditRequest";
import HealthPage from "./pages/Health";
import HomePage from "./pages";
import LoginPage from "./pages/Login";
import NotFoundPage from "./pages/NotFound";
import RequestDetail from "./pages/RequestDetail";
import RequesterDashboard from "./pages/RequesterDashboard";
import ReviewerQueue from "./pages/ReviewerQueue";

function LoginRoute() {
  const navigate = useNavigate();

  return <LoginPage onLoginSuccess={() => navigate("/", { replace: true })} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="login" element={<LoginRoute />} />

        {/* Protected Requester Routes */}
        <Route element={<ProtectedRoute allowedRoles={["REQUESTER"]} />}>
          <Route path="requests" element={<RequesterDashboard />} />
          <Route path="requester/dashboard" element={<RequesterDashboard />} />
          <Route path="requests/new" element={<CreateRequest />} />
          <Route path="requests/:id/edit" element={<EditRequest />} />
        </Route>

        {/* Protected Reviewer Routes */}
        <Route element={<ProtectedRoute allowedRoles={["REVIEWER"]} />}>
          <Route path="reviewer/queue" element={<ReviewerQueue />} />
        </Route>

        {/* Protected Common Routes (both roles can view permitted request details) */}
        <Route element={<ProtectedRoute allowedRoles={["REQUESTER", "REVIEWER"]} />}>
          <Route path="requests/:id" element={<RequestDetail />} />
        </Route>

        <Route path="not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </AuthProvider>
  );
}
